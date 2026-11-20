<%@ WebHandler Language="C#" Class="KiDeskyGameHandler" %>
<%@ Assembly Src="backend/KiDeskyCore.cs" %>

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Text;
using System.Web;
using KiDesky.Backend;

public class KiDeskyGameHandler : KiDeskyHandlerBase
{
    protected override void DispatchAction(HttpContext context, string action)
    {
        switch (action)
        {
            case "get-config":
                HandleGetConfig(context);
                break;
            case "save-config":
                HandleSaveConfig(context);
                break;
            case "save-session":
                HandleSaveSession(context);
                break;
            case "list-sessions":
                HandleListSessions(context);
                break;
            case "check-session":
                HandleCheckSession(context);
                break;
            case "load-session":
                HandleLoadSession(context);
                break;
            case "log-telemetry":
                HandleLogTelemetry(context);
                break;
            case "send-emote":
                HandleSendEmote(context);
                break;
            case "send-chat":
                HandleSendChat(context);
                break;
            case "get-chat":
                HandleGetChat(context);
                break;
            case "list-board-templates":
                HandleListBoardTemplates(context);
                break;
            case "get-board-template":
                HandleGetBoardTemplate(context);
                break;
            default:
                context.Response.StatusCode = 400;
                context.Response.Write(_json.Serialize(new { ok = false, status = "error", code = "UNKNOWN_ACTION", message = "Neznámá akce." }));
                break;
        }
    }

    private void HandleGetConfig(HttpContext context)

    {

        string gameCode = context.Request.QueryString["game"] ?? "princeznino_srdce";

        string configJson = null;

        string versionName = "v1.0-default";

        string updatedAt = null;

        if (IsDbConfigured())

        {

            using (var conn = new SqlConnection(CONN_STR))

            {

                conn.Open();

                using (var cmd = new SqlCommand(@"

                    SELECT TOP 1 [VersionName], [ConfigJson], [UpdatedAt]

                    FROM [prs].[prs_GameConfigs]

                    WHERE [GameCode] = @g AND [IsActive] = 1

                    ORDER BY [UpdatedAt] DESC", conn))

                {

                    cmd.Parameters.AddWithValue("@g", gameCode);

                    using (var r = cmd.ExecuteReader())

                    {

                        if (r.Read())

                        {

                            versionName = r["VersionName"].ToString();

                            configJson = r["ConfigJson"].ToString();

                            updatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("o");

                        }

                    }

                }

            }

        }

        context.Response.Write(_json.Serialize(new

        {

            status = "success",

            gameCode = gameCode,

            versionName = versionName,

            updatedAt = updatedAt,

            hasCustomConfig = !string.IsNullOrEmpty(configJson),

            configJson = configJson

        }));

    }

    private void HandleSaveConfig(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;

        var body = ReadJsonBody(context);

        string gameCode = GetStr(body, "gameCode", "princeznino_srdce");

        string versionName = GetStr(body, "versionName", "v1.0-custom");

        string configJson = GetStr(body, "configJson", "{}");

        string updatedBy = adminUser.Username;

        using (var conn = new SqlConnection(CONN_STR))

        {

            conn.Open();

            using (var cmd = new SqlCommand(@"

                UPDATE [prs].[prs_GameConfigs] SET [IsActive] = 0 WHERE [GameCode] = @g;

                INSERT INTO [prs].[prs_GameConfigs] ([GameCode], [VersionName], [IsActive], [ConfigJson], [UpdatedBy], [UpdatedAt])

                VALUES (@g, @v, 1, @c, @u, SYSUTCDATETIME());", conn))

            {

                cmd.Parameters.AddWithValue("@g", gameCode);

                cmd.Parameters.AddWithValue("@v", versionName);

                cmd.Parameters.AddWithValue("@c", configJson);

                cmd.Parameters.AddWithValue("@u", updatedBy);

                cmd.ExecuteNonQuery();

            }

        }

        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Konfigurace vyv\u00e1\u017een\u00ed hry byla ulo\u017eena do datab\u00e1ze [prs].[prs_GameConfigs]." }));

    }

    private void HandleSaveSession(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        string sessionGuid = GetStr(body, "sessionGuid");
        if (string.IsNullOrEmpty(sessionGuid)) sessionGuid = Guid.NewGuid().ToString("N");
        string roomCode = GetStr(body, "roomCode");
        if (string.IsNullOrEmpty(roomCode)) roomCode = sessionGuid.Substring(0, 6).ToUpperInvariant();
        string templateCode = GetStr(body, "boardCode", GetStr(body, "templateCode", "classic_96"));
        string hostUsername = GetStr(body, "hostUsername", "Guest");
        string mode = GetStr(body, "mode", "Hotseat");
        double targetHearts = 30;
        if (body.ContainsKey("targetHearts") && body["targetHearts"] != null)
            double.TryParse(body["targetHearts"].ToString(), out targetHearts);
        string status = GetStr(body, "status", "Active");
        int currentTurnIdx = GetInt(body, "currentTurnPlayer", GetInt(body, "currentTurnPlayerIdx", 0));
        int turnNumber = GetInt(body, "turnNumber", 1);
        string winnerName = GetStr(body, "winnerName", null);
        string stateJson = GetStr(body, "stateJson", "{}");
        int expectedTurn = GetInt(body, "expectedTurnNumber", -1);
        int expectedStateVersion = GetInt(body, "expectedStateVersion", -1);
        bool allowBotOverride = body.ContainsKey("allowBotOverride") && Convert.ToBoolean(body["allowBotOverride"]);

        int newStateVersion = 1;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted))
            {
                bool rowExists = false;
                int dbTurn = 0;
                int dbVersion = 1;
                string dbStatus = "Active";
                string existingJson = null;

                using (var chk = new SqlCommand(@"
                    SELECT [TurnNumber], [StateVersion], [Status], [StateJson]
                    FROM [prs].[prs_GameSessions] WITH (UPDLOCK, HOLDLOCK)
                    WHERE [SessionGuid] = @guid", conn, tx))
                {
                    chk.Parameters.AddWithValue("@guid", sessionGuid);
                    using (var rdr = chk.ExecuteReader())
                    {
                        if (rdr.Read())
                        {
                            rowExists = true;
                            dbTurn = Convert.ToInt32(rdr["TurnNumber"]);
                            dbVersion = rdr["StateVersion"] != DBNull.Value ? Convert.ToInt32(rdr["StateVersion"]) : 1;
                            dbStatus = rdr["Status"] != DBNull.Value ? rdr["Status"].ToString() : "Active";
                            existingJson = rdr["StateJson"] != DBNull.Value ? rdr["StateJson"].ToString() : null;
                        }
                    }
                }

                if (rowExists)
                {
                    bool turnConflict = (expectedTurn >= 0 && dbTurn > expectedTurn);
                    bool finishedVersionConflict = (expectedStateVersion > 0 && dbVersion > expectedStateVersion && string.Equals(dbStatus, "Finished", StringComparison.OrdinalIgnoreCase));

                    if (turnConflict || finishedVersionConflict)
                    {
                        tx.Rollback();
                        context.Response.StatusCode = 409;
                        context.Response.Write(_json.Serialize(new
                        {
                            ok = false,
                            status = "conflict",
                            error = "turn_conflict",
                            message = "Tento tah ji\u017e byl odehr\u00e1n jin\u00fdm hr\u00e1\u010dem. Synchronizuji aktu\u00e1ln\u00ed stav hry.",
                            serverTurnNumber = dbTurn,
                            serverStateVersion = dbVersion,
                            sessionGuid = sessionGuid,
                            stateJson = existingJson
                        }));
                        return;
                    }

                    if (!allowBotOverride && !string.IsNullOrEmpty(stateJson) && stateJson != "{}" && !string.IsNullOrEmpty(existingJson))
                    {
                        stateJson = MergeHumanPlayerClaims(existingJson, stateJson);
                    }

                    using (var upd = new SqlCommand(@"
                        UPDATE [prs].[prs_GameSessions]
                        SET [Status] = @status,
                            [CurrentTurnPlayerIdx] = @turnIdx,
                            [TurnNumber] = @turnNum,
                            [WinnerName] = @winner,
                            [StateJson] = @state,
                            [StateVersion] = [StateVersion] + 1,
                            [UpdatedAt] = SYSUTCDATETIME()
                        WHERE [SessionGuid] = @guid", conn, tx))
                    {
                        upd.Parameters.AddWithValue("@guid", sessionGuid);
                        upd.Parameters.AddWithValue("@status", status);
                        upd.Parameters.AddWithValue("@turnIdx", currentTurnIdx);
                        upd.Parameters.AddWithValue("@turnNum", turnNumber);
                        upd.Parameters.AddWithValue("@winner", (object)winnerName ?? DBNull.Value);
                        upd.Parameters.AddWithValue("@state", stateJson);
                        upd.ExecuteNonQuery();
                    }
                    newStateVersion = dbVersion + 1;
                }
                else
                {
                    if (string.IsNullOrEmpty(hostUsername))
                    {
                        hostUsername = "Host";
                    }

                    using (var ins = new SqlCommand(@"
                        INSERT INTO [prs].[prs_GameSessions]
                            ([SessionGuid], [RoomCode], [TemplateCode], [HostUsername], [Mode], [TargetHearts], [Status], [CurrentTurnPlayerIdx], [TurnNumber], [WinnerName], [StateJson], [StateVersion])
                        VALUES
                            (@guid, @room, @tpl, @host, @mode, @target, @status, @turnIdx, @turnNum, @winner, @state, 1)", conn, tx))
                    {
                        ins.Parameters.AddWithValue("@guid", sessionGuid);
                        ins.Parameters.AddWithValue("@room", roomCode);
                        ins.Parameters.AddWithValue("@tpl", templateCode);
                        ins.Parameters.AddWithValue("@host", hostUsername);
                        ins.Parameters.AddWithValue("@mode", mode);
                        ins.Parameters.AddWithValue("@target", targetHearts);
                        ins.Parameters.AddWithValue("@status", status);
                        ins.Parameters.AddWithValue("@turnIdx", currentTurnIdx);
                        ins.Parameters.AddWithValue("@turnNum", turnNumber);
                        ins.Parameters.AddWithValue("@winner", (object)winnerName ?? DBNull.Value);
                        ins.Parameters.AddWithValue("@state", stateJson);
                        ins.ExecuteNonQuery();
                    }
                    newStateVersion = 1;
                }

                tx.Commit();
            }
        }

        context.Response.Write(_json.Serialize(new
        {
            ok = true,
            status = "success",
            sessionGuid = sessionGuid,
            roomCode = roomCode,
            stateVersion = newStateVersion,
            savedAt = DateTime.UtcNow.ToString("o")
        }));
    }

    private string MergeHumanPlayerClaims(string existingJson, string incomingJson)
    {
        try
        {
            var exState = _json.Deserialize<Dictionary<string, object>>(existingJson);
            var inState = _json.Deserialize<Dictionary<string, object>>(incomingJson);
            if (exState == null || inState == null) return incomingJson;
            if (!exState.ContainsKey("players") || !inState.ContainsKey("players")) return incomingJson;

            var exPlayers = exState["players"] as System.Collections.ArrayList;
            var inPlayers = inState["players"] as System.Collections.ArrayList;
            if (exPlayers == null || inPlayers == null) return incomingJson;

            bool merged = false;
            for (int i = 0; i < Math.Min(exPlayers.Count, inPlayers.Count); i++)
            {
                var ep = exPlayers[i] as Dictionary<string, object>;
                var ip = inPlayers[i] as Dictionary<string, object>;
                if (ep == null || ip == null) continue;

                string epType = ep.ContainsKey("type") && ep["type"] != null ? ep["type"].ToString() : "";
                string epClaimed = ep.ContainsKey("claimedBy") && ep["claimedBy"] != null ? ep["claimedBy"].ToString() : "";
                string ipType = ip.ContainsKey("type") && ip["type"] != null ? ip["type"].ToString() : "";

                // Pokud je v existující DB hráč označen jako živý (Human s claimedBy) a příchozí stav ho má jako bota
                if (epType == "Human" && !string.IsNullOrEmpty(epClaimed) && ipType.StartsWith("Bot"))
                {
                    ip["type"] = "Human";
                    ip["claimedBy"] = epClaimed;
                    if (ep.ContainsKey("name") && ep["name"] != null) ip["name"] = ep["name"];
                    if (ep.ContainsKey("pawnId") && ep["pawnId"] != null) ip["pawnId"] = ep["pawnId"];
                    merged = true;
                }
            }
            if (merged)
            {
                return _json.Serialize(inState);
            }
        }
        catch { }
        return incomingJson;
    }

    private void HandleListSessions(HttpContext context)

    {

        var list = new List<object>();

        using (var conn = new SqlConnection(CONN_STR))

        {

            conn.Open();

            using (var cmd = new SqlCommand(@"

                SELECT TOP 25 [SessionGuid], [RoomCode], [TemplateCode], [HostUsername], [Mode], [TargetHearts], [Status], [TurnNumber], [WinnerName], [UpdatedAt]

                FROM [prs].[prs_GameSessions]

                ORDER BY [UpdatedAt] DESC", conn))

            using (var r = cmd.ExecuteReader())

            {

                while (r.Read())

                {

                    int tNum = Convert.ToInt32(r["TurnNumber"]);

                    list.Add(new

                    {

                        sessionGuid = r["SessionGuid"].ToString(),

                        roomCode = r["RoomCode"].ToString(),

                        title = "Princeznino srdce (" + r["TemplateCode"].ToString() + ")",

                        templateCode = r["TemplateCode"].ToString(),

                        hostUsername = r["HostUsername"].ToString(),

                        mode = r["Mode"].ToString(),

                        targetHearts = Convert.ToDouble(r["TargetHearts"]),

                        status = r["Status"].ToString(),

                        turnNumber = tNum,

                        winnerName = r["WinnerName"] == DBNull.Value ? null : r["WinnerName"].ToString(),

                        updatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("dd.MM.yyyy HH:mm")

                    });

                }

            }

        }

        context.Response.Write(_json.Serialize(new { ok = true, status = "success", sessions = list }));

    }

    private void HandleCheckSession(HttpContext context)
    {
        EnsureDatabaseSchema();
        string guid = context.Request.QueryString["guid"] ?? "";
        string room = context.Request.QueryString["room"] ?? context.Request.QueryString["code"] ?? "";
        if (string.IsNullOrEmpty(guid)) guid = room;
        long chatSince = 0;
        long.TryParse(context.Request.QueryString["chatSince"] ?? "0", out chatSince);

        bool found = false;
        string dbSessionGuid = "";
        string dbRoomCode = "";
        int dbTurn = 0;
        int dbCurIdx = 0;
        int dbStateVersion = 1;
        string dbStatus = "";
        string dbWinner = null;
        string dbUpdatedAt = "";
        List<RoomEmoteItem> recentEmotes = new List<RoomEmoteItem>();
        List<RoomChatMessage> recentChat = new List<RoomChatMessage>();

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand(@"
                SELECT TOP 1 [SessionGuid], [RoomCode], [TurnNumber], [CurrentTurnPlayerIdx], [StateVersion], [Status], [WinnerName], [UpdatedAt]
                FROM [prs].[prs_GameSessions]
                WHERE [SessionGuid] = @guid OR [RoomCode] = @room
                ORDER BY [UpdatedAt] DESC", conn))
            {
                cmd.Parameters.AddWithValue("@guid", guid);
                cmd.Parameters.AddWithValue("@room", room);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        found = true;
                        dbSessionGuid = r["SessionGuid"].ToString();
                        dbRoomCode = r["RoomCode"].ToString();
                        dbTurn = Convert.ToInt32(r["TurnNumber"]);
                        dbCurIdx = Convert.ToInt32(r["CurrentTurnPlayerIdx"]);
                        dbStateVersion = r["StateVersion"] != DBNull.Value ? Convert.ToInt32(r["StateVersion"]) : 1;
                        dbStatus = r["Status"].ToString();
                        dbWinner = r["WinnerName"] == DBNull.Value ? null : r["WinnerName"].ToString();
                        dbUpdatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("o");
                    }
                }
            }

            if (found)
            {
                long nowMs = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
                string sessionRoomCode = !string.IsNullOrEmpty(dbRoomCode) ? dbRoomCode : (!string.IsNullOrEmpty(room) ? room : guid);
                recentEmotes = LoadRecentRoomEmotes(conn, sessionRoomCode, nowMs - 25000L);
                long effectiveSince = chatSince > 0 ? chatSince : (nowMs - 86400000L);
                recentChat = LoadRoomChat(conn, sessionRoomCode, effectiveSince, 60);
            }
        }

        if (found)
        {
            var checkObj = new
            {
                ok = true,
                status = "success",
                sessionGuid = dbSessionGuid,
                roomCode = dbRoomCode,
                turnNumber = dbTurn,
                currentPlayerIndex = dbCurIdx,
                stateVersion = dbStateVersion,
                gameStatus = dbStatus,
                winnerName = dbWinner,
                updatedAt = dbUpdatedAt,
                emotes = recentEmotes,
                chat = recentChat
            };
            context.Response.Write(_json.Serialize(checkObj));
            return;
        }

        context.Response.StatusCode = 404;
        context.Response.Write(_json.Serialize(new { ok = false, status = "error", message = "Ulo\u017een\u00e1 hra nebyla nalezena." }));
    }

    private void HandleLoadSession(HttpContext context)
    {
        EnsureDatabaseSchema();
        string guid = context.Request.QueryString["guid"] ?? "";
        string room = context.Request.QueryString["room"] ?? context.Request.QueryString["code"] ?? "";
        if (string.IsNullOrEmpty(guid)) guid = room;

        bool found = false;
        object sessObj = null;
        string sessRoomCode = "";
        string sessStateJson = "";
        List<RoomChatMessage> recentChat = new List<RoomChatMessage>();

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand(@"
                SELECT TOP 1 [SessionGuid], [RoomCode], [TemplateCode], [HostUsername], [Mode], [TargetHearts], [Status], [CurrentTurnPlayerIdx], [TurnNumber], [StateVersion], [WinnerName], [StateJson], [UpdatedAt]
                FROM [prs].[prs_GameSessions]
                WHERE [SessionGuid] = @guid OR [RoomCode] = @room
                ORDER BY [UpdatedAt] DESC", conn))
            {
                cmd.Parameters.AddWithValue("@guid", guid);
                cmd.Parameters.AddWithValue("@room", room);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        found = true;
                        sessRoomCode = r["RoomCode"].ToString();
                        sessStateJson = r["StateJson"].ToString();
                        int dbStateVersion = r["StateVersion"] != DBNull.Value ? Convert.ToInt32(r["StateVersion"]) : 1;
                        sessObj = new
                        {
                            sessionGuid = r["SessionGuid"].ToString(),
                            roomCode = sessRoomCode,
                            templateCode = r["TemplateCode"].ToString(),
                            hostUsername = r["HostUsername"].ToString(),
                            mode = r["Mode"].ToString(),
                            targetHearts = Convert.ToDouble(r["TargetHearts"]),
                            gameStatus = r["Status"].ToString(),
                            turnNumber = Convert.ToInt32(r["TurnNumber"]),
                            stateVersion = dbStateVersion,
                            winnerName = r["WinnerName"] == DBNull.Value ? null : r["WinnerName"].ToString(),
                            stateJson = sessStateJson,
                            updatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("o")
                        };
                    }
                }
            }

            if (found)
            {
                recentChat = LoadRoomChat(conn, sessRoomCode, 0, 60);
            }
        }

        if (found)
        {
            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                session = sessObj,
                stateJson = sessStateJson,
                chat = recentChat
            }));
            return;
        }

        context.Response.StatusCode = 404;
        context.Response.Write(_json.Serialize(new { ok = false, status = "error", message = "Ulo\u017een\u00e1 hra nebyla nalezena." }));
    }

    private void HandleLogTelemetry(HttpContext context)

    {

        var body = ReadJsonBody(context);

        string sessionGuid = GetStr(body, "sessionGuid", null);

        int turnNumber = GetInt(body, "turnNumber", 0);

        string eventType = GetStr(body, "eventType", "GAME_EVENT");

        string playerName = GetStr(body, "playerName", null);

        string message = GetStr(body, "message", "");

        string payloadJson = GetStr(body, "payloadJson", null);

        using (var conn = new SqlConnection(CONN_STR))

        {

            conn.Open();

            using (var cmd = new SqlCommand(@"

                INSERT INTO [prs].[prs_TelemetryLogs] ([SessionGuid], [TurnNumber], [EventType], [PlayerName], [Message], [PayloadJson])

                VALUES (@s, @t, @e, @p, @m, @j)", conn))

            {

                cmd.Parameters.AddWithValue("@s", (object)sessionGuid ?? DBNull.Value);

                cmd.Parameters.AddWithValue("@t", turnNumber);

                cmd.Parameters.AddWithValue("@e", eventType);

                cmd.Parameters.AddWithValue("@p", (object)playerName ?? DBNull.Value);

                cmd.Parameters.AddWithValue("@m", message);

                cmd.Parameters.AddWithValue("@j", (object)payloadJson ?? DBNull.Value);

                cmd.ExecuteNonQuery();

            }

        }

        context.Response.Write(_json.Serialize(new { status = "success" }));

    }

    private void HandleSendEmote(HttpContext context)
    {
        EnsureDatabaseSchema();
        string code = (context.Request.QueryString["code"] ?? "").Trim().ToUpperInvariant();
        string playerIdxStr = context.Request.QueryString["playerIdx"] ?? "0";
        int playerIdx = 0;
        int.TryParse(playerIdxStr, out playerIdx);
        string emote = context.Request.QueryString["emote"] ?? "";
        string author = context.Request.QueryString["author"] ?? "";

        if (string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            var body = ReadJsonBody(context);
            if (body != null)
            {
                if (string.IsNullOrEmpty(code)) code = GetStr(body, "code").Trim().ToUpperInvariant();
                if (string.IsNullOrEmpty(author)) author = GetStr(body, "author").Trim();
                if (string.IsNullOrEmpty(emote)) emote = GetStr(body, "emote");
                if (body.ContainsKey("playerIndex") && body["playerIndex"] != null) int.TryParse(body["playerIndex"].ToString(), out playerIdx);
                else if (body.ContainsKey("playerIdx") && body["playerIdx"] != null) int.TryParse(body["playerIdx"].ToString(), out playerIdx);
            }
        }

        code = TruncateStr(code, 16);
        emote = TruncateStr(StripControlChars(emote).Trim(), 128);
        author = TruncateStr(StripControlChars(author).Trim(), 64);

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(emote))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Missing code or emote" }));
            return;
        }
        if (string.IsNullOrEmpty(author)) author = "Rytíř";

        long nowMs = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
        var item = new RoomEmoteItem
        {
            id = Guid.NewGuid().ToString("N").Substring(0, 8),
            code = code,
            playerIndex = playerIdx,
            author = author,
            emote = emote,
            timestamp = nowMs
        };

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var ins = new SqlCommand(@"
                INSERT INTO [prs].[prs_RoomEmotes] ([EmoteId], [RoomCode], [PlayerIndex], [Author], [EmoteText], [TimestampMs])
                VALUES (@eid, @code, @pidx, @auth, @emote, @ts);
                DELETE FROM [prs].[prs_RoomEmotes] WHERE [TimestampMs] < @cutoff;", conn))
            {
                ins.Parameters.Add("@eid", SqlDbType.NVarChar, 16).Value = item.id;
                ins.Parameters.Add("@code", SqlDbType.NVarChar, 16).Value = item.code;
                ins.Parameters.Add("@pidx", SqlDbType.Int).Value = item.playerIndex;
                ins.Parameters.Add("@auth", SqlDbType.NVarChar, 64).Value = item.author;
                ins.Parameters.Add("@emote", SqlDbType.NVarChar, 128).Value = item.emote;
                ins.Parameters.Add("@ts", SqlDbType.BigInt).Value = item.timestamp;
                ins.Parameters.Add("@cutoff", SqlDbType.BigInt).Value = nowMs - 300000L;
                ins.ExecuteNonQuery();
            }
        }

        context.Response.Write(_json.Serialize(new { ok = true, emote = item }));
    }

    private void HandleSendChat(HttpContext context)
    {
        EnsureDatabaseSchema();
        string code = (context.Request.QueryString["code"] ?? "").Trim().ToUpperInvariant();
        string playerIdxStr = context.Request.QueryString["playerIdx"] ?? "0";
        int playerIdx = 0;
        int.TryParse(playerIdxStr, out playerIdx);
        string author = (context.Request.QueryString["author"] ?? "").Trim();
        string crestId = (context.Request.QueryString["crestId"] ?? "lion").Trim();
        string crestColor = (context.Request.QueryString["crestColor"] ?? "gold").Trim();
        string text = "";

        if (string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            var body = ReadJsonBody(context);
            if (body != null)
            {
                if (string.IsNullOrEmpty(code)) code = GetStr(body, "code").Trim().ToUpperInvariant();
                if (string.IsNullOrEmpty(author)) author = GetStr(body, "author").Trim();
                if (body.ContainsKey("playerIndex") && body["playerIndex"] != null) int.TryParse(body["playerIndex"].ToString(), out playerIdx);
                string cId = GetStr(body, "crestId");
                if (!string.IsNullOrEmpty(cId)) crestId = cId;
                string cCol = GetStr(body, "crestColor");
                if (!string.IsNullOrEmpty(cCol)) crestColor = cCol;
                text = GetStr(body, "text");
            }
        }
        if (string.IsNullOrEmpty(text))
        {
            text = (context.Request.QueryString["text"] ?? "").Trim();
        }

        code = TruncateStr(code, 16);
        text = TruncateStr(StripControlChars(text).Trim(), 280);
        author = TruncateStr(StripControlChars(author).Trim(), 64);
        crestId = TruncateStr(StripControlChars(crestId).Trim(), 32);
        crestColor = TruncateStr(StripControlChars(crestColor).Trim(), 32);

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(text))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Missing code or text" }));
            return;
        }

        if (string.IsNullOrEmpty(author)) author = "Rytíř";
        if (string.IsNullOrEmpty(crestId)) crestId = "lion";
        if (string.IsNullOrEmpty(crestColor)) crestColor = "gold";

        long nowMs = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
        var msg = new RoomChatMessage
        {
            id = Guid.NewGuid().ToString("N").Substring(0, 10),
            code = code,
            playerIndex = playerIdx,
            author = author,
            crestId = crestId,
            crestColor = crestColor,
            text = text,
            timestamp = nowMs,
            isSystem = false
        };

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var ins = new SqlCommand(@"
                INSERT INTO [prs].[prs_RoomChat] ([MessageId], [RoomCode], [PlayerIndex], [Author], [CrestId], [CrestColor], [MessageText], [IsSystem], [TimestampMs])
                VALUES (@mid, @code, @pidx, @auth, @cid, @ccol, @txt, 0, @ts);
                DELETE FROM [prs].[prs_RoomChat]
                WHERE [RoomCode] = @code
                  AND [Id] NOT IN (SELECT TOP 100 [Id] FROM [prs].[prs_RoomChat] WHERE [RoomCode] = @code ORDER BY [TimestampMs] DESC, [Id] DESC);", conn))
            {
                ins.Parameters.Add("@mid", SqlDbType.NVarChar, 16).Value = msg.id;
                ins.Parameters.Add("@code", SqlDbType.NVarChar, 16).Value = msg.code;
                ins.Parameters.Add("@pidx", SqlDbType.Int).Value = msg.playerIndex;
                ins.Parameters.Add("@auth", SqlDbType.NVarChar, 64).Value = msg.author;
                ins.Parameters.Add("@cid", SqlDbType.NVarChar, 32).Value = msg.crestId;
                ins.Parameters.Add("@ccol", SqlDbType.NVarChar, 32).Value = msg.crestColor;
                ins.Parameters.Add("@txt", SqlDbType.NVarChar, 320).Value = msg.text;
                ins.Parameters.Add("@ts", SqlDbType.BigInt).Value = msg.timestamp;
                ins.ExecuteNonQuery();
            }
        }

        context.Response.Write(_json.Serialize(new { ok = true, chat = msg, message = msg }));
    }

    private void HandleGetChat(HttpContext context)
    {
        EnsureDatabaseSchema();
        string code = TruncateStr((context.Request.QueryString["code"] ?? "").Trim().ToUpperInvariant(), 16);
        string sinceStr = context.Request.QueryString["since"] ?? "0";
        long sinceTs = 0;
        long.TryParse(sinceStr, out sinceTs);

        List<RoomChatMessage> res = new List<RoomChatMessage>();
        if (!string.IsNullOrEmpty(code))
        {
            using (var conn = new SqlConnection(CONN_STR))
            {
                conn.Open();
                res = LoadRoomChat(conn, code, sinceTs, 60);
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, messages = res }));
    }

    private void HandleListBoardTemplates(HttpContext context)
    {
        EnsureDatabaseSchema();
        bool wantsAll = (context.Request.QueryString["all"] == "1");
        bool isAdminCaller = false;
        if (wantsAll)
        {
            AuthenticatedUser authUser = GetAuthenticatedUser(context);
            isAdminCaller = (authUser != null && string.Equals(authUser.Role, "Admin", StringComparison.OrdinalIgnoreCase));
        }
        bool showAll = wantsAll && isAdminCaller;
        bool includeGraph = (context.Request.QueryString["includeGraph"] != "0");
        var list = new List<object>();

        if (!IsDbConfigured())
        {
            context.Response.Write(_json.Serialize(new { ok = true, status = "offline", templates = list }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            string sql = @"
                SELECT [Id], [TemplateCode], [Name], [Description], [NodeCount],
                       [RecipeJson], [GraphJson], [Seed], [IsBuiltIn], [IsActive],
                       [SortOrder], [CreatedBy], [CreatedAt], [UpdatedAt]
                FROM [prs].[prs_BoardTemplates]
                " + (showAll ? "" : "WHERE [IsActive] = 1") + @"
                ORDER BY [SortOrder] ASC, [Id] ASC";

            using (var cmd = new SqlCommand(sql, conn))
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    bool isBuiltIn = r["IsBuiltIn"] != DBNull.Value && Convert.ToBoolean(r["IsBuiltIn"]);
                    string graphStr = (r["GraphJson"] == DBNull.Value) ? "{}" : r["GraphJson"].ToString();
                    list.Add(new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        templateCode = r["TemplateCode"].ToString(),
                        name = r["Name"].ToString(),
                        description = r["Description"] == DBNull.Value ? "" : r["Description"].ToString(),
                        nodeCount = Convert.ToInt32(r["NodeCount"]),
                        seed = r["Seed"] == DBNull.Value ? 4598 : Convert.ToInt32(r["Seed"]),
                        isBuiltIn = isBuiltIn,
                        isActive = r["IsActive"] == DBNull.Value || Convert.ToBoolean(r["IsActive"]),
                        sortOrder = r["SortOrder"] == DBNull.Value ? 100 : Convert.ToInt32(r["SortOrder"]),
                        createdBy = r["CreatedBy"] == DBNull.Value ? "admin" : r["CreatedBy"].ToString(),
                        recipeJson = r["RecipeJson"] == DBNull.Value ? null : r["RecipeJson"].ToString(),
                        graphJson = (includeGraph && !isBuiltIn) ? graphStr : null,
                        createdAt = r["CreatedAt"] == DBNull.Value ? null : Convert.ToDateTime(r["CreatedAt"]).ToString("o"),
                        updatedAt = r["UpdatedAt"] == DBNull.Value ? null : Convert.ToDateTime(r["UpdatedAt"]).ToString("o")
                    });
                }
            }
        }

        context.Response.Write(_json.Serialize(new { ok = true, status = "success", templates = list }));
    }

    private void HandleGetBoardTemplate(HttpContext context)
    {
        EnsureDatabaseSchema();
        string code = (context.Request.QueryString["code"] ?? context.Request.QueryString["templateCode"] ?? "").Trim();
        int id = 0;
        int.TryParse(context.Request.QueryString["id"] ?? "0", out id);

        if (string.IsNullOrEmpty(code) && id <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Chybí identifikátor herního plánu." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            string sql = id > 0
                ? "SELECT TOP 1 * FROM [prs].[prs_BoardTemplates] WHERE [Id] = @id"
                : "SELECT TOP 1 * FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = @code";

            using (var cmd = new SqlCommand(sql, conn))
            {
                if (id > 0) cmd.Parameters.AddWithValue("@id", id);
                else cmd.Parameters.AddWithValue("@code", code);

                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        var tpl = new
                        {
                            id = Convert.ToInt32(r["Id"]),
                            templateCode = r["TemplateCode"].ToString(),
                            name = r["Name"].ToString(),
                            description = r["Description"] == DBNull.Value ? "" : r["Description"].ToString(),
                            nodeCount = Convert.ToInt32(r["NodeCount"]),
                            seed = r["Seed"] == DBNull.Value ? 4598 : Convert.ToInt32(r["Seed"]),
                            isBuiltIn = r["IsBuiltIn"] != DBNull.Value && Convert.ToBoolean(r["IsBuiltIn"]),
                            isActive = r["IsActive"] == DBNull.Value || Convert.ToBoolean(r["IsActive"]),
                            sortOrder = r["SortOrder"] == DBNull.Value ? 100 : Convert.ToInt32(r["SortOrder"]),
                            recipeJson = r["RecipeJson"] == DBNull.Value ? null : r["RecipeJson"].ToString(),
                            graphJson = r["GraphJson"] == DBNull.Value ? "{}" : r["GraphJson"].ToString()
                        };
                        context.Response.Write(_json.Serialize(new { ok = true, status = "success", template = tpl }));
                        return;
                    }
                }
            }
        }

        context.Response.Write(_json.Serialize(new { ok = false, message = "Herní plán nebyl nalezen." }));
    }
}
