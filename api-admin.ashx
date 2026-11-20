<%@ WebHandler Language="C#" Class="KiDeskyAdminHandler" %>
<%@ Assembly Src="backend/KiDeskyCore.cs" %>

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Text;
using System.Web;
using KiDesky.Backend;

public class KiDeskyAdminHandler : KiDeskyHandlerBase
{
    protected override void DispatchAction(HttpContext context, string action)
    {
        switch (action)
        {
            case "admin-stats":
                HandleAdminStats(context);
                break;
            case "admin-list-users":
                HandleAdminListUsers(context);
                break;
            case "admin-update-user":
                HandleAdminUpdateUser(context);
                break;
            case "admin-reset-password":
                HandleAdminResetPassword(context);
                break;
            case "admin-delete-user":
                HandleAdminDeleteUser(context);
                break;
            case "admin-list-sessions":
                HandleAdminListSessions(context);
                break;
            case "admin-close-session":
                HandleAdminCloseSession(context);
                break;
            case "admin-purge-sessions":
                HandleAdminPurgeSessions(context);
                break;
            case "admin-system-info":
                HandleAdminSystemInfo(context);
                break;
            case "admin-save-board-template":
                HandleAdminSaveBoardTemplate(context);
                break;
            case "admin-rename-board-template":
                HandleAdminRenameBoardTemplate(context);
                break;
            case "admin-delete-board-template":
                HandleAdminDeleteBoardTemplate(context);
                break;
            default:
                context.Response.StatusCode = 400;
                context.Response.Write(_json.Serialize(new { ok = false, status = "error", code = "UNKNOWN_ACTION", message = "Neznámá akce." }));
                break;
        }
    }

    private void HandleAdminStats(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;

        var users = new List<object>();

        var logs = new List<object>();

        using (var conn = new SqlConnection(CONN_STR))

        {

            conn.Open();

            using (var cmd = new SqlCommand("SELECT TOP 50 [Id], [Username], [Email], [Role], [GamesPlayed], [GamesWon], [CreatedAt], [LastLoginAt] FROM [prs].[prs_Users] ORDER BY [Id] ASC", conn))

            using (var r = cmd.ExecuteReader())

            {

                while (r.Read())

                {

                    users.Add(new

                    {

                        id = Convert.ToInt32(r["Id"]),

                        username = r["Username"].ToString(),

                        email = r["Email"] == DBNull.Value ? "" : r["Email"].ToString(),

                        role = r["Role"].ToString(),

                        gamesPlayed = Convert.ToInt32(r["GamesPlayed"]),

                        gamesWon = Convert.ToInt32(r["GamesWon"]),

                        createdAt = Convert.ToDateTime(r["CreatedAt"]).ToString("o")

                    });

                }

            }

            using (var cmd = new SqlCommand("SELECT TOP 30 [Id], [SessionGuid], [TurnNumber], [EventType], [PlayerName], [Message], [CreatedAt] FROM [prs].[prs_TelemetryLogs] ORDER BY [Id] DESC", conn))

            using (var r = cmd.ExecuteReader())

            {

                while (r.Read())

                {

                    logs.Add(new

                    {

                        id = Convert.ToInt32(r["Id"]),

                        turnNumber = Convert.ToInt32(r["TurnNumber"]),

                        eventType = r["EventType"].ToString(),

                        playerName = r["PlayerName"] == DBNull.Value ? "" : r["PlayerName"].ToString(),

                        message = r["Message"].ToString(),

                        createdAt = Convert.ToDateTime(r["CreatedAt"]).ToString("o")

                    });

                }

            }

        }

        context.Response.Write(_json.Serialize(new { status = "success", users = users, recentLogs = logs }));

    }

    private void HandleAdminListUsers(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var users = new List<object>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT [Id], [Username], [Email], [Role], [DisplayName], [GamesPlayed], [GamesWon], [CreatedAt], [LastLoginAt], [IsActive], [Credits], [SelectedPawnId]
                FROM [prs].[prs_Users]
                ORDER BY [Id] ASC", conn))
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    users.Add(new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        username = r["Username"].ToString(),
                        email = r["Email"] == DBNull.Value ? "" : r["Email"].ToString(),
                        role = r["Role"].ToString(),
                        displayName = r["DisplayName"] == DBNull.Value ? r["Username"].ToString() : r["DisplayName"].ToString(),
                        gamesPlayed = Convert.ToInt32(r["GamesPlayed"]),
                        gamesWon = Convert.ToInt32(r["GamesWon"]),
                        createdAt = Convert.ToDateTime(r["CreatedAt"]).ToString("o"),
                        lastLoginAt = r["LastLoginAt"] == DBNull.Value ? null : Convert.ToDateTime(r["LastLoginAt"]).ToString("o"),
                        isActive = Convert.ToBoolean(r["IsActive"]),
                        credits = r["Credits"] == DBNull.Value ? 250 : Convert.ToInt32(r["Credits"]),
                        selectedPawnId = r["SelectedPawnId"] == DBNull.Value ? "knight_valiant" : r["SelectedPawnId"].ToString()
                    });
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", users = users }));
    }

    private void HandleAdminUpdateUser(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string role = GetStr(body, "role", "Player").Trim();
        string displayName = GetStr(body, "displayName").Trim();
        int credits = GetInt(body, "credits", 250);
        bool isActive = !body.ContainsKey("isActive") || Convert.ToBoolean(body["isActive"]);

        if (id <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné ID uživatele." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                UPDATE [prs].[prs_Users]
                SET [Role] = @r, [DisplayName] = @d, [IsActive] = @a, [Credits] = @c
                WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@r", role);
                cmd.Parameters.AddWithValue("@d", string.IsNullOrEmpty(displayName) ? (object)DBNull.Value : displayName);
                cmd.Parameters.AddWithValue("@a", isActive);
                cmd.Parameters.AddWithValue("@c", credits);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
            if (!isActive)
            {
                RevokeAllUserSessions(conn, id);
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Uživatelský účet byl aktualizován." }));
    }

    private void HandleAdminResetPassword(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string newPassword = GetStr(body, "newPassword");

        if (id <= 0 || string.IsNullOrEmpty(newPassword) || newPassword.Length < 4)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Heslo musí mít alespoň 4 znaky." }));
            return;
        }

        string newHash = HashPassword(newPassword);
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_Users] SET [PasswordHash] = @p WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@p", newHash);
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
            RevokeAllUserSessions(conn, id);
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Heslo uživatele bylo úspěšně změněno." }));
    }

    private void HandleAdminDeleteUser(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);

        if (id <= 1)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Hlavního administrátora nelze smazat." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            RevokeAllUserSessions(conn, id);
            using (var cmd = new SqlCommand("DELETE FROM [prs].[prs_Users] WHERE [Id] = @id AND [Username] <> 'admin'", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Uživatel byl smazán." }));
    }

    private void HandleAdminListSessions(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var sessions = new List<object>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT TOP 40 s.[Id], s.[SessionGuid], s.[RoomCode], s.[TemplateCode], s.[HostUsername], s.[Mode], s.[Status], s.[WinnerName], s.[TurnNumber], s.[CreatedAt], s.[UpdatedAt],
                       (SELECT COUNT(*) FROM [prs].[prs_SessionPlayers] p WHERE p.[SessionGuid] = s.[SessionGuid]) AS [PlayerCount]
                FROM [prs].[prs_GameSessions] s
                ORDER BY s.[UpdatedAt] DESC", conn))
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    sessions.Add(new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        sessionGuid = r["SessionGuid"].ToString(),
                        roomCode = r["RoomCode"] == DBNull.Value ? "" : r["RoomCode"].ToString(),
                        templateCode = r["TemplateCode"].ToString(),
                        hostUsername = r["HostUsername"].ToString(),
                        mode = r["Mode"].ToString(),
                        difficulty = "standard",
                        status = r["Status"].ToString(),
                        winnerName = r["WinnerName"] == DBNull.Value ? null : r["WinnerName"].ToString(),
                        turnCount = (r["TurnNumber"] == DBNull.Value) ? 0 : Convert.ToInt32(r["TurnNumber"]),
                        playerCount = Convert.ToInt32(r["PlayerCount"]),
                        createdAt = Convert.ToDateTime(r["CreatedAt"]).ToString("o"),
                        updatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("o")
                    });
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", sessions = sessions }));
    }

    private void HandleAdminCloseSession(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        string sessionGuid = GetStr(body, "sessionGuid").Trim();

        if (string.IsNullOrEmpty(sessionGuid))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Identifikátor relace je povinný." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_GameSessions] SET [Status] = 'Closed', [UpdatedAt] = SYSUTCDATETIME() WHERE [SessionGuid] = @sg", conn))
            {
                cmd.Parameters.AddWithValue("@sg", sessionGuid);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Herní relace byla uzavřena." }));
    }

    private void HandleAdminPurgeSessions(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int daysOld = GetInt(body, "daysOld", 7);
        if (daysOld < 1) daysOld = 1;

        int deletedCount = 0;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                DELETE FROM [prs].[prs_RoomChat]
                WHERE [CreatedAt] < DATEADD(day, -@days, SYSUTCDATETIME());

                DELETE FROM [prs].[prs_RoomEmotes]
                WHERE [CreatedAt] < DATEADD(day, -@days, SYSUTCDATETIME());

                DELETE FROM [prs].[prs_SessionPlayers]
                WHERE [SessionGuid] IN (SELECT [SessionGuid] FROM [prs].[prs_GameSessions] WHERE [UpdatedAt] < DATEADD(day, -@days, SYSUTCDATETIME()));

                DELETE FROM [prs].[prs_GameSessions]
                WHERE [UpdatedAt] < DATEADD(day, -@days, SYSUTCDATETIME());", conn))
            {
                cmd.Parameters.AddWithValue("@days", daysOld);
                deletedCount = cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Staré relace starší než " + daysOld + " dní byly promazány." }));
    }

    private void HandleAdminSystemInfo(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var counts = new Dictionary<string, int>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            string[] tables = new string[] { "prs_Users", "prs_UserSessions", "prs_GameSessions", "prs_SessionPlayers", "prs_RoomChat", "prs_RoomEmotes", "prs_TelemetryLogs", "prs_GameConfigs", "prs_BoardTemplates", "prs_Videos", "prs_Announcements" };
            foreach (var t in tables)
            {
                try
                {
                    using (var cmd = new SqlCommand("SELECT COUNT(*) FROM [prs].[" + t + "]", conn))
                    {
                        counts[t] = Convert.ToInt32(cmd.ExecuteScalar());
                    }
                }
                catch
                {
                    counts[t] = -1;
                }
            }
        }

        context.Response.Write(_json.Serialize(new
        {
            ok = true,
            status = "success",
            serverTime = DateTime.UtcNow.ToString("o"),
            dbConnected = true,
            runtime = Environment.Version.ToString(),
            os = Environment.OSVersion.ToString(),
            tableCounts = counts
        }));
    }

    private void HandleAdminSaveBoardTemplate(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string templateCode = GetStr(body, "templateCode").Trim();
        string name = GetStr(body, "name").Trim();
        string description = GetStr(body, "description").Trim();
        int nodeCount = GetInt(body, "nodeCount", 96);
        int seed = GetInt(body, "seed", 4598);
        int sortOrder = GetInt(body, "sortOrder", 50);
        bool isActive = !body.ContainsKey("isActive") || GetBool(body, "isActive", true);
        string createdBy = adminUser.Username;
        string recipeJson = GetStr(body, "recipeJson");
        string graphJson = GetStr(body, "graphJson", "{}");

        if (string.IsNullOrEmpty(name))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Zadejte prosím název herního plánu." }));
            return;
        }

        if (string.IsNullOrEmpty(templateCode))
        {
            templateCode = "custom_" + DateTime.UtcNow.ToString("yyyyMMddHHmmss") + "_" + (new Random().Next(100, 999));
        }

        if (string.IsNullOrEmpty(graphJson)) graphJson = "{}";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            int existingId = id;
            if (existingId <= 0)
            {
                using (var chk = new SqlCommand("SELECT [Id] FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = @tc", conn))
                {
                    chk.Parameters.AddWithValue("@tc", templateCode);
                    object found = chk.ExecuteScalar();
                    if (found != null && found != DBNull.Value) existingId = Convert.ToInt32(found);
                }
            }

            if (existingId > 0)
            {
                using (var upd = new SqlCommand(@"
                    UPDATE [prs].[prs_BoardTemplates]
                    SET [Name] = @n,
                        [Description] = @d,
                        [NodeCount] = @nc,
                        [Seed] = @s,
                        [SortOrder] = @so,
                        [IsActive] = @ia,
                        [RecipeJson] = COALESCE(@rj, [RecipeJson]),
                        [GraphJson] = CASE WHEN @gj = N'{}' THEN [GraphJson] ELSE @gj END,
                        [UpdatedAt] = SYSUTCDATETIME()
                    WHERE [Id] = @id", conn))
                {
                    upd.Parameters.Add("@n", SqlDbType.NVarChar, 100).Value = name;
                    upd.Parameters.Add("@d", SqlDbType.NVarChar, 500).Value = description;
                    upd.Parameters.AddWithValue("@nc", nodeCount);
                    upd.Parameters.AddWithValue("@s", seed);
                    upd.Parameters.AddWithValue("@so", sortOrder);
                    upd.Parameters.AddWithValue("@ia", isActive);
                    upd.Parameters.Add("@rj", SqlDbType.NVarChar, -1).Value = string.IsNullOrEmpty(recipeJson) ? (object)DBNull.Value : recipeJson;
                    upd.Parameters.Add("@gj", SqlDbType.NVarChar, -1).Value = graphJson;
                    upd.Parameters.AddWithValue("@id", existingId);
                    upd.ExecuteNonQuery();
                }

                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    id = existingId,
                    templateCode = templateCode,
                    message = "Předdefinovaný herní plán '" + name + "' byl aktualizován."
                }));
                return;
            }
            else
            {
                int newId = 0;
                using (var ins = new SqlCommand(@"
                    INSERT INTO [prs].[prs_BoardTemplates]
                        ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy], [CreatedAt], [UpdatedAt])
                    OUTPUT INSERTED.[Id]
                    VALUES
                        (@tc, @n, @d, @nc, @gj, @rj, @s, 0, @ia, @so, @cb, SYSUTCDATETIME(), SYSUTCDATETIME())", conn))
                {
                    ins.Parameters.Add("@tc", SqlDbType.NVarChar, 50).Value = templateCode;
                    ins.Parameters.Add("@n", SqlDbType.NVarChar, 100).Value = name;
                    ins.Parameters.Add("@d", SqlDbType.NVarChar, 500).Value = description;
                    ins.Parameters.AddWithValue("@nc", nodeCount);
                    ins.Parameters.Add("@gj", SqlDbType.NVarChar, -1).Value = graphJson;
                    ins.Parameters.Add("@rj", SqlDbType.NVarChar, -1).Value = string.IsNullOrEmpty(recipeJson) ? (object)DBNull.Value : recipeJson;
                    ins.Parameters.AddWithValue("@s", seed);
                    ins.Parameters.AddWithValue("@ia", isActive);
                    ins.Parameters.AddWithValue("@so", sortOrder);
                    ins.Parameters.Add("@cb", SqlDbType.NVarChar, 64).Value = createdBy;
                    newId = Convert.ToInt32(ins.ExecuteScalar());
                }

                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    id = newId,
                    templateCode = templateCode,
                    message = "Nový předdefinovaný herní plán '" + name + "' byl uložen do databáze."
                }));
            }
        }
    }

    private void HandleAdminRenameBoardTemplate(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string templateCode = GetStr(body, "templateCode").Trim();
        string name = GetStr(body, "name").Trim();
        string description = GetStr(body, "description").Trim();
        int sortOrder = GetInt(body, "sortOrder", -1);
        bool hasActive = body.ContainsKey("isActive");
        bool isActive = GetBool(body, "isActive", true);

        if ((id <= 0 && string.IsNullOrEmpty(templateCode)) || string.IsNullOrEmpty(name))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Zadejte platné ID a nový název herního plánu." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            string sql = @"
                UPDATE [prs].[prs_BoardTemplates]
                SET [Name] = @n,
                    [Description] = @d,
                    [SortOrder] = CASE WHEN @so >= 0 THEN @so ELSE [SortOrder] END,
                    [IsActive] = CASE WHEN @hasAct = 1 THEN @ia ELSE [IsActive] END,
                    [UpdatedAt] = SYSUTCDATETIME()
                WHERE " + (id > 0 ? "[Id] = @id" : "[TemplateCode] = @tc");

            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.Add("@n", SqlDbType.NVarChar, 100).Value = name;
                cmd.Parameters.Add("@d", SqlDbType.NVarChar, 500).Value = description;
                cmd.Parameters.AddWithValue("@so", sortOrder);
                cmd.Parameters.AddWithValue("@hasAct", hasActive ? 1 : 0);
                cmd.Parameters.AddWithValue("@ia", isActive);
                if (id > 0) cmd.Parameters.AddWithValue("@id", id);
                else cmd.Parameters.Add("@tc", SqlDbType.NVarChar, 50).Value = templateCode;
                cmd.ExecuteNonQuery();
            }
        }

        context.Response.Write(_json.Serialize(new
        {
            ok = true,
            status = "success",
            message = "Herní plán byl přejmenován na '" + name + "'."
        }));
    }

    private void HandleAdminDeleteBoardTemplate(HttpContext context)
    {
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string templateCode = GetStr(body, "templateCode").Trim();

        if (id <= 0 && string.IsNullOrEmpty(templateCode))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatný identifikátor herního plánu." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            bool isBuiltIn = false;
            string whereClause = id > 0 ? "[Id] = @id" : "[TemplateCode] = @tc";
            using (var chk = new SqlCommand("SELECT [IsBuiltIn] FROM [prs].[prs_BoardTemplates] WHERE " + whereClause, conn))
            {
                if (id > 0) chk.Parameters.AddWithValue("@id", id);
                else chk.Parameters.Add("@tc", SqlDbType.NVarChar, 50).Value = templateCode;
                object res = chk.ExecuteScalar();
                if (res != null && res != DBNull.Value) isBuiltIn = Convert.ToBoolean(res);
            }

            if (isBuiltIn)
            {
                // Vestavěné plány skryjeme z nabídky (IsActive = 0), aby je šlo v případě potřeby v administraci obnovit
                using (var cmd = new SqlCommand("UPDATE [prs].[prs_BoardTemplates] SET [IsActive] = 0, [UpdatedAt] = SYSUTCDATETIME() WHERE " + whereClause, conn))
                {
                    if (id > 0) cmd.Parameters.AddWithValue("@id", id);
                    else cmd.Parameters.Add("@tc", SqlDbType.NVarChar, 50).Value = templateCode;
                    cmd.ExecuteNonQuery();
                }
                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    message = "Výchozí herní plán byl odebrán z aktivní nabídky (v administraci jej lze kdykoliv znovu zapnout)."
                }));
            }
            else
            {
                using (var cmd = new SqlCommand("DELETE FROM [prs].[prs_BoardTemplates] WHERE " + whereClause, conn))
                {
                    if (id > 0) cmd.Parameters.AddWithValue("@id", id);
                    else cmd.Parameters.Add("@tc", SqlDbType.NVarChar, 50).Value = templateCode;
                    cmd.ExecuteNonQuery();
                }
                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    message = "Předdefinovaný herní plán byl trvale odebrán."
                }));
            }
        }
    }
}
