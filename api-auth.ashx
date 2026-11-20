<%@ WebHandler Language="C#" Class="KiDeskyAuthHandler" %>
<%@ Assembly Src="backend/KiDeskyCore.cs" %>

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Net;
using System.Text;
using System.Web;
using KiDesky.Backend;

public class KiDeskyAuthHandler : KiDeskyHandlerBase
{
    protected override void DispatchAction(HttpContext context, string action)
    {
        switch (action)
        {
            case "register":
                HandleRegister(context);
                break;
            case "confirm-email":
                HandleConfirmEmail(context);
                break;
            case "resend-confirmation":
                HandleResendConfirmation(context);
                break;
            case "google-login":
                HandleGoogleLogin(context);
                break;
            case "login":
                HandleLogin(context);
                break;
            case "session-me":
                HandleSessionMe(context);
                break;
            case "logout":
                HandleLogout(context);
                break;
            case "update-profile":
            case "update_nickname":
                HandleUpdateNickname(context);
                break;
            case "save-user-pawn":
                HandleSaveUserPawn(context);
                break;
            case "unlock-pawn":
                HandleUnlockPawn(context);
                break;
            case "award-credits":
                HandleAwardCredits(context);
                break;
            case "record-game-stats":
                HandleRecordGameStats(context);
                break;
            default:
                context.Response.StatusCode = 400;
                context.Response.Write(_json.Serialize(new { ok = false, status = "error", code = "UNKNOWN_ACTION", message = "Neznámá akce." }));
                break;
        }
    }

    private void HandleSessionMe(HttpContext context)
    {
        AuthenticatedUser user = RequireAuthenticatedUser(context);
        if (user == null) return;
        context.Response.Write(_json.Serialize(new
        {
            ok = true,
            status = "success",
            user = BuildUserDto(user)
        }));
    }

    private void HandleLogout(HttpContext context)
    {
        string token = ExtractAuthToken(context);
        if (!string.IsNullOrEmpty(token) && IsDbConfigured())
        {
            using (var conn = new SqlConnection(CONN_STR))
            {
                conn.Open();
                EnsureExtendedAdminSchema(conn);
                RevokeSessionToken(conn, token);
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success" }));
    }

    private void HandleRegister(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);

        string username = GetStr(body, "username").Trim();
        string password = GetStr(body, "password");
        string reqDisplayName = GetStr(body, "displayName").Trim();
        string email = GetStr(body, "email").Trim();

        if (string.IsNullOrEmpty(email) && username.Contains("@"))
        {
            email = username;
        }

        if (username.Length < 3 || password.Length < 3)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, status = "error", message = "Jméno i heslo musí mít alespoň 3 znaky." }));
            return;
        }

        if (string.IsNullOrEmpty(email) || !email.Contains("@"))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, status = "error", message = "Vyplňte prosím platný e-mail pro zaslání potvrzení registrace." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            using (var check = new SqlCommand("SELECT COUNT(*) FROM [prs].[prs_Users] WHERE [Username] = @u OR ([Email] IS NOT NULL AND [Email] != '' AND [Email] = @e)", conn))
            {
                check.Parameters.AddWithValue("@u", username);
                check.Parameters.AddWithValue("@e", email);
                if (Convert.ToInt32(check.ExecuteScalar()) > 0)
                {
                    context.Response.StatusCode = 409;
                    context.Response.Write(_json.Serialize(new { ok = false, status = "error", message = "Uživatel s tímto jménem nebo e-mailem již existuje." }));
                    return;
                }
            }

            string displayName = !string.IsNullOrEmpty(reqDisplayName) ? reqDisplayName : username;
            string role = "Guest";
            bool isConfirmed = false;
            string confirmationToken = Guid.NewGuid().ToString("N");
            DateTime tokenExpires = DateTime.UtcNow.AddHours(48);
            string defaultPawns = @"[""knight_valiant"",""knight_tourney"",""lady_huntress"",""lord_diplomat"",""knight_warden"",""lady_sorceress""]";
            int initialCredits = 250;

            int userId = 0;
            try
            {
                using (var ins = new SqlCommand(@"
                    INSERT INTO [prs].[prs_Users] (
                        [Username], [Email], [PasswordHash], [Role], [DisplayName],
                        [EmailConfirmed], [EmailConfirmationToken], [EmailConfirmationExpires],
                        [AuthProvider], [Credits], [SelectedPawnId], [UnlockedPawnsJson], [LastLoginAt]
                    )
                    OUTPUT INSERTED.Id
                    VALUES (
                        @u, @e, @p, @r, @d,
                        @ec, @tok, @exp,
                        'local', @cred, 'knight_valiant', @unl, SYSUTCDATETIME()
                    )", conn))
                {
                    ins.Parameters.AddWithValue("@u", username);
                    ins.Parameters.AddWithValue("@e", email);
                    ins.Parameters.AddWithValue("@p", HashPassword(password));
                    ins.Parameters.AddWithValue("@r", role);
                    ins.Parameters.AddWithValue("@d", displayName);
                    ins.Parameters.AddWithValue("@ec", isConfirmed ? 1 : 0);
                    ins.Parameters.AddWithValue("@tok", isConfirmed ? (object)DBNull.Value : confirmationToken);
                    ins.Parameters.AddWithValue("@exp", isConfirmed ? (object)DBNull.Value : tokenExpires);
                    ins.Parameters.AddWithValue("@cred", initialCredits);
                    ins.Parameters.AddWithValue("@unl", defaultPawns);
                    userId = Convert.ToInt32(ins.ExecuteScalar());
                }
            }
            catch (SqlException)
            {
                // Fallback for older columns
                using (var ins = new SqlCommand(@"
                    INSERT INTO [prs].[prs_Users] ([Username], [Email], [PasswordHash], [Role], [DisplayName], [LastLoginAt])
                    OUTPUT INSERTED.Id
                    VALUES (@u, @e, @p, @r, @d, SYSUTCDATETIME())", conn))
                {
                    ins.Parameters.AddWithValue("@u", username);
                    ins.Parameters.AddWithValue("@e", email);
                    ins.Parameters.AddWithValue("@p", HashPassword(password));
                    ins.Parameters.AddWithValue("@r", role);
                    ins.Parameters.AddWithValue("@d", displayName);
                    userId = Convert.ToInt32(ins.ExecuteScalar());
                }
            }

            string mailErr = null;
            bool emailSent = SendConfirmationEmail(email, displayName, confirmationToken, out mailErr);

            string authToken = CreateSessionToken(conn, userId, context);

            string msg = emailSent
                ? ("Registrace proběhla úspěšně! Na e-mail " + email + " byl odeslán potvrzovací odkaz. Do jeho potvrzení můžeš hrát v režimu Hosta.")
                : "Účet byl vytvořen, ale nepodařilo se odeslat potvrzovací e-mail. Můžeš hrát v režimu Hosta a potvrzení si poslat znovu z profilu.";

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                message = msg,
                emailSent = emailSent,
                authToken = authToken,
                user = new
                {
                    id = userId,
                    username = username,
                    displayName = displayName,
                    role = role,
                    email = email,
                    emailConfirmed = isConfirmed,
                    authProvider = "local",
                    credits = initialCredits,
                    selectedPawnId = "knight_valiant",
                    unlockedPawnsJson = defaultPawns
                }
            }));
        }
    }

    private void HandleConfirmEmail(HttpContext context)
    {
        EnsureDatabaseSchema();
        string token = context.Request.QueryString["token"];
        if (string.IsNullOrEmpty(token))
        {
            var body = ReadJsonBody(context);
            token = GetStr(body, "token");
        }
        token = (token ?? "").Trim();
        if (string.IsNullOrEmpty(token))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Chybí ověřovací token." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            int userId = 0;
            string username = "";
            string email = "";
            string role = "";
            string displayName = "";
            int credits = 250;
            string selectedPawn = "knight_valiant";
            string unlockedPawns = "";
            DateTime? expires = null;

            using (var cmd = new SqlCommand(@"
                SELECT [Id], [Username], [Email], [Role], [DisplayName], [Credits], [SelectedPawnId], [UnlockedPawnsJson], [EmailConfirmationExpires]
                FROM [prs].[prs_Users]
                WHERE [EmailConfirmationToken] = @t", conn))
            {
                cmd.Parameters.AddWithValue("@t", token);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        userId = Convert.ToInt32(r["Id"]);
                        username = r["Username"].ToString();
                        email = r["Email"] == DBNull.Value ? "" : r["Email"].ToString();
                        role = r["Role"].ToString();
                        displayName = r["DisplayName"] == DBNull.Value ? username : r["DisplayName"].ToString();
                        credits = r["Credits"] == DBNull.Value ? 250 : Convert.ToInt32(r["Credits"]);
                        selectedPawn = r["SelectedPawnId"] == DBNull.Value ? "knight_valiant" : r["SelectedPawnId"].ToString();
                        unlockedPawns = r["UnlockedPawnsJson"] == DBNull.Value ? "" : r["UnlockedPawnsJson"].ToString();
                        if (r["EmailConfirmationExpires"] != DBNull.Value)
                        {
                            expires = Convert.ToDateTime(r["EmailConfirmationExpires"]);
                        }
                    }
                }
            }

            if (userId <= 0)
            {
                context.Response.StatusCode = 404;
                context.Response.Write(_json.Serialize(new { ok = false, message = "Ověřovací odkaz je neplatný nebo již byl použit." }));
                return;
            }

            if (expires.HasValue && DateTime.UtcNow > expires.Value)
            {
                context.Response.StatusCode = 410;
                context.Response.Write(_json.Serialize(new { ok = false, message = "Platnost ověřovacího odkazu vypršela. Nechte si prosím zaslat nový z profilu." }));
                return;
            }

            string newRole = (role == "Guest") ? "Player" : role;
            using (var upd = new SqlCommand(@"
                UPDATE [prs].[prs_Users]
                SET [EmailConfirmed] = 1,
                    [EmailConfirmationToken] = NULL,
                    [Role] = @r,
                    [LastLoginAt] = SYSUTCDATETIME()
                WHERE [Id] = @id", conn))
            {
                upd.Parameters.AddWithValue("@r", newRole);
                upd.Parameters.AddWithValue("@id", userId);
                upd.ExecuteNonQuery();
            }

            string authToken = CreateSessionToken(conn, userId, context);

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                message = "E-mail byl úspěšně potvrzen! Vítej v království jako plnohodnotný rytíř.",
                authToken = authToken,
                user = new
                {
                    id = userId,
                    username = username,
                    displayName = displayName,
                    role = newRole,
                    email = email,
                    emailConfirmed = true,
                    credits = credits,
                    selectedPawnId = selectedPawn,
                    unlockedPawnsJson = unlockedPawns
                }
            }));
        }
    }

    private void HandleResendConfirmation(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        string ident = GetStr(body, "username").Trim();
        if (string.IsNullOrEmpty(ident)) ident = GetStr(body, "email").Trim();

        if (string.IsNullOrEmpty(ident))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Zadejte uživatelské jméno nebo e-mail." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            int userId = 0;
            string email = "";
            string displayName = "";
            bool confirmed = false;

            using (var cmd = new SqlCommand(@"
                SELECT [Id], [Username], [Email], [DisplayName], [EmailConfirmed]
                FROM [prs].[prs_Users]
                WHERE [Username] = @u OR ([Email] IS NOT NULL AND [Email] = @u)", conn))
            {
                cmd.Parameters.AddWithValue("@u", ident);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        userId = Convert.ToInt32(r["Id"]);
                        email = r["Email"] == DBNull.Value ? "" : r["Email"].ToString();
                        displayName = r["DisplayName"] == DBNull.Value ? r["Username"].ToString() : r["DisplayName"].ToString();
                        confirmed = r["EmailConfirmed"] != DBNull.Value && Convert.ToBoolean(r["EmailConfirmed"]);
                    }
                }
            }

            if (userId <= 0 || string.IsNullOrEmpty(email))
            {
                context.Response.StatusCode = 404;
                context.Response.Write(_json.Serialize(new { ok = false, message = "Uživatel s tímto jménem nebo e-mailem nebyl nalezen." }));
                return;
            }

            if (confirmed)
            {
                context.Response.Write(_json.Serialize(new { ok = true, alreadyConfirmed = true, message = "Tento účet již má e-mail potvrzený." }));
                return;
            }

            string newToken = Guid.NewGuid().ToString("N");
            DateTime tokenExpires = DateTime.UtcNow.AddHours(48);

            using (var upd = new SqlCommand(@"
                UPDATE [prs].[prs_Users]
                SET [EmailConfirmationToken] = @t,
                    [EmailConfirmationExpires] = @e
                WHERE [Id] = @id", conn))
            {
                upd.Parameters.AddWithValue("@t", newToken);
                upd.Parameters.AddWithValue("@e", tokenExpires);
                upd.Parameters.AddWithValue("@id", userId);
                upd.ExecuteNonQuery();
            }

            string emailErr = null;
            bool sent = SendConfirmationEmail(email, displayName, newToken, out emailErr);

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                emailSent = sent,
                message = sent ? ("Nový potvrzovací e-mail byl odeslán na " + email + ".") : ("Chyba při odesílání e-mailu: " + emailErr)
            }));
        }
    }

    private void HandleGoogleLogin(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        string credential = GetStr(body, "credential").Trim();
        string reqDisplayName = GetStr(body, "displayName").Trim();

        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.TrySkipIisCustomErrors = true;

        if (string.IsNullOrEmpty(credential))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Chybí Google credential token." }));
            return;
        }

        string googleId = null;
        string email = null;
        string name = null;
        string picture = null;

        try
        {
            ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
            using (var wc = new WebClient())
            {
                wc.Headers[HttpRequestHeader.UserAgent] = "KiDesky-App/1.0";
                wc.Encoding = Encoding.UTF8;
                string tokenInfoJson = wc.DownloadString("https://oauth2.googleapis.com/tokeninfo?id_token=" + HttpUtility.UrlEncode(credential));
                var tokenInfo = _json.Deserialize<Dictionary<string, object>>(tokenInfoJson);
                if (tokenInfo != null)
                {
                    string subVal = tokenInfo.ContainsKey("sub") && tokenInfo["sub"] != null ? tokenInfo["sub"].ToString().Trim() : "";
                    string emailVal = tokenInfo.ContainsKey("email") && tokenInfo["email"] != null ? tokenInfo["email"].ToString().Trim() : "";
                    string verifiedVal = tokenInfo.ContainsKey("email_verified") && tokenInfo["email_verified"] != null ? tokenInfo["email_verified"].ToString().Trim() : "";
                    string audVal = tokenInfo.ContainsKey("aud") && tokenInfo["aud"] != null ? tokenInfo["aud"].ToString().Trim() : "";
                    string issVal = tokenInfo.ContainsKey("iss") && tokenInfo["iss"] != null ? tokenInfo["iss"].ToString().Trim() : "";
                    string expVal = tokenInfo.ContainsKey("exp") && tokenInfo["exp"] != null ? tokenInfo["exp"].ToString().Trim() : "";

                    long expUnix = 0;
                    long.TryParse(expVal, out expUnix);
                    long nowUnix = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds;

                    bool issuerOk = issVal.Equals("https://accounts.google.com", StringComparison.OrdinalIgnoreCase) ||
                                    issVal.Equals("accounts.google.com", StringComparison.OrdinalIgnoreCase);
                    bool audOk = audVal.Equals(GOOGLE_CLIENT_ID, StringComparison.Ordinal);
                    bool verifiedOk = verifiedVal.Equals("true", StringComparison.OrdinalIgnoreCase);
                    bool expOk = expUnix > nowUnix;

                    if (!string.IsNullOrEmpty(subVal) && !string.IsNullOrEmpty(emailVal) && issuerOk && audOk && verifiedOk && expOk)
                    {
                        googleId = subVal;
                        email = emailVal;
                        if (tokenInfo.ContainsKey("name") && tokenInfo["name"] != null) name = tokenInfo["name"].ToString();
                        if (tokenInfo.ContainsKey("picture") && tokenInfo["picture"] != null) picture = tokenInfo["picture"].ToString();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Trace.TraceWarning("Google tokeninfo verification failed: " + ex.Message);
            context.Response.StatusCode = 401;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Ověření Google účtu selhalo." }));
            return;
        }

        if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
        {
            context.Response.StatusCode = 401;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatný nebo expirovaný Google token." }));
            return;
        }

        googleId = TruncateStr(googleId, 128);
        email = TruncateStr(email, 128);
        if (picture != null) picture = TruncateStr(picture, 512);

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            int userId = 0;
            string username = null;
            string currentRole = null;
            string currentDisplayName = null;
            bool isUserActive = true;
            int credits = 250;
            string selectedPawn = "knight_valiant";
            string unlockedPawns = null;
            int gPlayed = 0;
            int gWon = 0;
            int gDragons = 0;
            double gTotalHearts = 0;
            double gHighestScore = 0;
            string gAchJson = "[]";

            using (var cmd = new SqlCommand(@"
                SELECT [Id], [Username], [Email], [Role], [DisplayName],
                       ISNULL([IsActive], 1) AS [IsActive],
                       [Credits], [SelectedPawnId], [UnlockedPawnsJson],
                       ISNULL([GamesPlayed], 0) AS [GamesPlayed],
                       ISNULL([GamesWon], 0) AS [GamesWon],
                       ISNULL([DragonsSlain], 0) AS [DragonsSlain],
                       ISNULL([TotalHeartsEarned], 0) AS [TotalHeartsEarned],
                       ISNULL([HighestScore], 0) AS [HighestScore],
                       [AchievementsJson]
                FROM [prs].[prs_Users]
                WHERE [GoogleId] = @gid OR ([Email] IS NOT NULL AND [Email] != '' AND [Email] = @e)", conn))
            {
                cmd.Parameters.AddWithValue("@gid", googleId);
                cmd.Parameters.AddWithValue("@e", email);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        userId = Convert.ToInt32(r["Id"]);
                        username = r["Username"] == DBNull.Value ? "" : r["Username"].ToString();
                        currentRole = r["Role"] == DBNull.Value ? "Player" : r["Role"].ToString();
                        currentDisplayName = r["DisplayName"] == DBNull.Value ? username : r["DisplayName"].ToString();
                        isUserActive = Convert.ToBoolean(r["IsActive"]);
                        credits = r["Credits"] == DBNull.Value ? 250 : Convert.ToInt32(r["Credits"]);
                        selectedPawn = r["SelectedPawnId"] == DBNull.Value ? "knight_valiant" : r["SelectedPawnId"].ToString();
                        unlockedPawns = r["UnlockedPawnsJson"] == DBNull.Value ? "" : r["UnlockedPawnsJson"].ToString();
                        try
                        {
                            int gpIdx = r.GetOrdinal("GamesPlayed");
                            if (!r.IsDBNull(gpIdx)) gPlayed = Convert.ToInt32(r[gpIdx]);
                            int gwIdx = r.GetOrdinal("GamesWon");
                            if (!r.IsDBNull(gwIdx)) gWon = Convert.ToInt32(r[gwIdx]);
                            int dsIdx = r.GetOrdinal("DragonsSlain");
                            if (!r.IsDBNull(dsIdx)) gDragons = Convert.ToInt32(r[dsIdx]);
                            int thIdx = r.GetOrdinal("TotalHeartsEarned");
                            if (!r.IsDBNull(thIdx)) gTotalHearts = Convert.ToDouble(r[thIdx]);
                            int hsIdx = r.GetOrdinal("HighestScore");
                            if (!r.IsDBNull(hsIdx)) gHighestScore = Convert.ToDouble(r[hsIdx]);
                            int ajIdx = r.GetOrdinal("AchievementsJson");
                            if (!r.IsDBNull(ajIdx) && !string.IsNullOrEmpty(r[ajIdx].ToString())) gAchJson = r[ajIdx].ToString();
                        }
                        catch { }
                    }
                }
            }

            if (userId > 0 && !isUserActive)
            {
                context.Response.StatusCode = 403;
                context.Response.Write(_json.Serialize(new { ok = false, status = "error", code = "ACCOUNT_DISABLED", message = "Tento účet byl deaktivován administrátorem." }));
                return;
            }

            bool isAdminOwner = email.Equals("jan.kytyr@seznam.cz", StringComparison.OrdinalIgnoreCase) ||
                                email.Equals("lordkikin@gmail.com", StringComparison.OrdinalIgnoreCase);

            string effectiveDisplayName = !string.IsNullOrEmpty(reqDisplayName)
                ? reqDisplayName
                : (!string.IsNullOrEmpty(currentDisplayName) && currentDisplayName != "Host" && !currentDisplayName.Contains("@")
                    ? currentDisplayName
                    : (!string.IsNullOrEmpty(name) ? name : email.Split('@')[0]));
            effectiveDisplayName = TruncateStr(effectiveDisplayName, 64);

            if (userId > 0)
            {
                string targetRole = (isAdminOwner || string.Equals(currentRole, "Admin", StringComparison.OrdinalIgnoreCase))
                    ? "Admin"
                    : ((currentRole == "Guest") ? "Player" : currentRole);
                int targetCredits = isAdminOwner ? Math.Max(credits, 2500) : credits;

                using (var upd = new SqlCommand(@"
                    UPDATE [prs].[prs_Users]
                    SET [GoogleId] = @gid,
                        [AvatarUrl] = @pic,
                        [EmailConfirmed] = 1,
                        [Role] = @r,
                        [DisplayName] = @d,
                        [Credits] = @c,
                        [LastLoginAt] = SYSUTCDATETIME()
                    WHERE [Id] = @id", conn))
                {
                    upd.Parameters.AddWithValue("@gid", googleId);
                    upd.Parameters.AddWithValue("@pic", (object)picture ?? DBNull.Value);
                    upd.Parameters.AddWithValue("@r", targetRole);
                    upd.Parameters.AddWithValue("@d", effectiveDisplayName);
                    upd.Parameters.AddWithValue("@c", targetCredits);
                    upd.Parameters.AddWithValue("@id", userId);
                    upd.ExecuteNonQuery();
                }

                string authTokenExisting = CreateSessionToken(conn, userId, context);

                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    message = "Prihlaseni pres Google probehlo uspesne.",
                    authToken = authTokenExisting,
                    user = new
                    {
                        id = userId,
                        username = username,
                        displayName = effectiveDisplayName,
                        role = targetRole,
                        email = email,
                        emailConfirmed = true,
                        avatarUrl = picture,
                        authProvider = "google",
                        gamesPlayed = gPlayed,
                        gamesWon = gWon,
                        dragonsSlain = gDragons,
                        totalHeartsEarned = Math.Round(gTotalHearts, 1),
                        highestScore = Math.Round(gHighestScore, 1),
                        achievementsJson = gAchJson,
                        credits = targetCredits,
                        selectedPawnId = selectedPawn,
                        unlockedPawnsJson = unlockedPawns
                    }
                }));
                return;
            }

            // New user via Google
            string targetNewRole = isAdminOwner ? "Admin" : "Player";
            int newCredits = (targetNewRole == "Admin") ? 2500 : 250;
            string defaultUnlocked = @"[""knight_valiant"",""knight_tourney"",""lady_huntress"",""lord_diplomat"",""knight_warden"",""lady_sorceress""]";
            string newUsername = TruncateStr(email.Split('@')[0].Replace(".", "_").Replace("-", "_"), 60);
            if (newUsername.Length < 3) newUsername = "player_" + (googleId.Length > 6 ? googleId.Substring(0, 6) : googleId);
            newUsername = TruncateStr(newUsername, 64);

            using (var unCheck = new SqlCommand("SELECT COUNT(*) FROM [prs].[prs_Users] WHERE [Username] = @u", conn))
            {
                unCheck.Parameters.AddWithValue("@u", newUsername);
                if (Convert.ToInt32(unCheck.ExecuteScalar()) > 0)
                {
                    newUsername = TruncateStr(TruncateStr(newUsername, 59) + "_" + (new Random()).Next(100, 999), 64);
                }
            }

            using (var ins = new SqlCommand(@"
                INSERT INTO [prs].[prs_Users] (
                    [Username], [Email], [PasswordHash], [Role], [DisplayName],
                    [GoogleId], [AuthProvider], [AvatarUrl], [EmailConfirmed],
                    [Credits], [SelectedPawnId], [UnlockedPawnsJson], [LastLoginAt]
                )
                OUTPUT INSERTED.Id
                VALUES (
                    @u, @e, @p, @r, @d,
                    @gid, 'google', @pic, 1,
                    @c, 'knight_valiant', @unl, SYSUTCDATETIME()
                )", conn))
            {
                ins.Parameters.AddWithValue("@u", newUsername);
                ins.Parameters.AddWithValue("@e", email);
                ins.Parameters.AddWithValue("@p", HashPassword(Guid.NewGuid().ToString("N")));
                ins.Parameters.AddWithValue("@r", targetNewRole);
                ins.Parameters.AddWithValue("@d", effectiveDisplayName);
                ins.Parameters.AddWithValue("@gid", googleId);
                ins.Parameters.AddWithValue("@pic", (object)picture ?? DBNull.Value);
                ins.Parameters.AddWithValue("@c", newCredits);
                ins.Parameters.AddWithValue("@unl", defaultUnlocked);
                userId = Convert.ToInt32(ins.ExecuteScalar());
            }

            string authTokenNew = CreateSessionToken(conn, userId, context);

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                message = "Vitej! Ucet pres Google byl uspesne vytvoren.",
                authToken = authTokenNew,
                user = new
                {
                    id = userId,
                    username = newUsername,
                    displayName = effectiveDisplayName,
                    role = targetNewRole,
                    email = email,
                    emailConfirmed = true,
                    avatarUrl = picture,
                    authProvider = "google",
                    credits = newCredits,
                    selectedPawnId = "knight_valiant",
                    unlockedPawnsJson = defaultUnlocked
                }
            }));
        }
    }

    private void HandleUpdateNickname(HttpContext context)
    {
        AuthenticatedUser authUser = RequireAuthenticatedUser(context);
        if (authUser == null) return;

        var body = ReadJsonBody(context);
        string nickname = GetStr(body, "displayName").Trim();
        if (string.IsNullOrEmpty(nickname)) nickname = GetStr(body, "nickname").Trim();

        if (string.IsNullOrEmpty(nickname) || nickname.Length < 2 || nickname.Length > 48)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Rytířské jméno musí mít 2 až 48 znaků." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_Users] SET [DisplayName] = @d WHERE [Id] = @id", conn))
            {
                cmd.Parameters.Add("@d", SqlDbType.NVarChar, 64).Value = nickname;
                cmd.Parameters.AddWithValue("@id", authUser.Id);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, displayName = nickname }));
    }

    private void HandleSaveUserPawn(HttpContext context)
    {
        AuthenticatedUser authUser = RequireAuthenticatedUser(context);
        if (authUser == null) return;

        var body = ReadJsonBody(context);
        string pawnId = GetStr(body, "selectedPawnId", "knight_valiant").Trim();
        if (string.IsNullOrEmpty(pawnId) || pawnId.Length > 64)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné parametry." }));
            return;
        }
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_Users] SET [SelectedPawnId] = @p WHERE [Id] = @id", conn))
            {
                cmd.Parameters.Add("@p", SqlDbType.NVarChar, 64).Value = pawnId;
                cmd.Parameters.AddWithValue("@id", authUser.Id);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", selectedPawnId = pawnId }));
    }

    private void HandleAwardCredits(HttpContext context)
    {
        AuthenticatedUser authUser = RequireAuthenticatedUser(context);
        if (authUser == null) return;

        var body = ReadJsonBody(context);
        int amount = GetInt(body, "amount", 0);
        bool isWin = GetBool(body, "isWin", false);
        if (amount < 1 || amount > 500)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatný počet kreditů (povoleno 1 až 500)." }));
            return;
        }

        int newCredits = 250;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                UPDATE [prs].[prs_Users] 
                SET [Credits] = ISNULL([Credits], 250) + @amt,
                    [GamesPlayed] = ISNULL([GamesPlayed], 0) + 1,
                    [GamesWon] = ISNULL([GamesWon], 0) + (CASE WHEN @isWin = 1 THEN 1 ELSE 0 END)
                WHERE [Id] = @id;
                SELECT [Credits] FROM [prs].[prs_Users] WHERE [Id] = @id;
            ", conn))
            {
                cmd.Parameters.AddWithValue("@amt", amount);
                cmd.Parameters.AddWithValue("@isWin", isWin ? 1 : 0);
                cmd.Parameters.AddWithValue("@id", authUser.Id);
                var scalar = cmd.ExecuteScalar();
                if (scalar != null && scalar != DBNull.Value)
                {
                    newCredits = Convert.ToInt32(scalar);
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", credits = newCredits, awarded = amount }));
    }

    private void HandleUnlockPawn(HttpContext context)
    {
        AuthenticatedUser authUser = RequireAuthenticatedUser(context);
        if (authUser == null) return;

        var body = ReadJsonBody(context);
        string pawnId = GetStr(body, "pawnId").Trim();

        int price;
        if (string.IsNullOrEmpty(pawnId) || !_authoritativePawnPrices.TryGetValue(pawnId, out price))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neznámá figurka." }));
            return;
        }

        int curCredits = 250;
        string unlockedJson = "[\"knight_valiant\",\"knight_tourney\",\"lady_huntress\",\"lord_diplomat\",\"knight_warden\",\"lady_sorceress\"]";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("SELECT [Credits], [UnlockedPawnsJson] FROM [prs].[prs_Users] WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", authUser.Id);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        if (r["Credits"] != DBNull.Value) curCredits = Convert.ToInt32(r["Credits"]);
                        if (r["UnlockedPawnsJson"] != DBNull.Value && !string.IsNullOrEmpty(r["UnlockedPawnsJson"].ToString()))
                        {
                            unlockedJson = r["UnlockedPawnsJson"].ToString();
                        }
                    }
                    else
                    {
                        context.Response.StatusCode = 404;
                        context.Response.Write(_json.Serialize(new { ok = false, message = "Uživatel nenalezen." }));
                        return;
                    }
                }
            }

            var unlockedList = new List<string>();
            try
            {
                var parsed = _json.Deserialize<List<string>>(unlockedJson);
                if (parsed != null) unlockedList = parsed;
            }
            catch { }

            if (!unlockedList.Contains(pawnId))
            {
                if (curCredits < price)
                {
                    context.Response.StatusCode = 400;
                    context.Response.Write(_json.Serialize(new { ok = false, message = "Nedostatek kreditů na účtu." }));
                    return;
                }
                curCredits -= price;
                unlockedList.Add(pawnId);
            }

            string newUnlockedJson = _json.Serialize(unlockedList);
            using (var upd = new SqlCommand("UPDATE [prs].[prs_Users] SET [Credits] = @c, [UnlockedPawnsJson] = @uJson, [SelectedPawnId] = @p WHERE [Id] = @id", conn))
            {
                upd.Parameters.AddWithValue("@c", curCredits);
                upd.Parameters.AddWithValue("@uJson", newUnlockedJson);
                upd.Parameters.Add("@p", SqlDbType.NVarChar, 64).Value = pawnId;
                upd.Parameters.AddWithValue("@id", authUser.Id);
                upd.ExecuteNonQuery();
            }

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                credits = curCredits,
                selectedPawnId = pawnId,
                unlockedPawnsJson = newUnlockedJson
            }));
        }
    }

    private void HandleRecordGameStats(HttpContext context)
    {
        AuthenticatedUser authUser = RequireAuthenticatedUser(context);
        if (authUser == null) return;

        var body = ReadJsonBody(context);
        bool isWin = GetBool(body, "isWin", false);
        double hearts = 0;
        double.TryParse(GetStr(body, "hearts"), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out hearts);
        if (hearts < 0) hearts = 0;
        if (hearts > 200) hearts = 200;

        int dragons = GetInt(body, "dragons", 0);
        if (dragons < 0) dragons = 0;
        if (dragons > 20) dragons = 20;

        int castles = GetInt(body, "castles", 0);
        if (castles < 0) castles = 0;
        if (castles > 20) castles = 20;

        int herds = GetInt(body, "herds", 0);
        if (herds < 0) herds = 0;
        if (herds > 30) herds = 30;

        double festHearts = 0;
        double.TryParse(GetStr(body, "festivalHearts"), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out festHearts);
        if (festHearts < 0) festHearts = 0;
        if (festHearts > 200) festHearts = 200;

        int played = 0, won = 0, totalDragons = 0;
        double totalHearts = 0, highestScore = 0;
        string achJson = "";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT ISNULL([GamesPlayed], 0) as GamesPlayed,
                       ISNULL([GamesWon], 0) as GamesWon,
                       ISNULL([DragonsSlain], 0) as DragonsSlain,
                       ISNULL([TotalHeartsEarned], 0) as TotalHeartsEarned,
                       ISNULL([HighestScore], 0) as HighestScore,
                       ISNULL([AchievementsJson], '') as AchievementsJson
                FROM [prs].[prs_Users]
                WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", authUser.Id);
                using (var r = cmd.ExecuteReader())
                {
                    if (r.Read())
                    {
                        played = Convert.ToInt32(r["GamesPlayed"]);
                        won = Convert.ToInt32(r["GamesWon"]);
                        totalDragons = Convert.ToInt32(r["DragonsSlain"]);
                        totalHearts = Convert.ToDouble(r["TotalHeartsEarned"]);
                        highestScore = Convert.ToDouble(r["HighestScore"]);
                        achJson = r["AchievementsJson"].ToString();
                    }
                }
            }

            played += 1;
            if (isWin) won += 1;
            totalDragons += dragons;
            totalHearts += hearts;
            if (hearts > highestScore) highestScore = hearts;

            var achList = new List<string>();
            if (!string.IsNullOrEmpty(achJson) && achJson.StartsWith("["))
            {
                try
                {
                    var parsed = _json.Deserialize<List<string>>(achJson);
                    if (parsed != null) achList.AddRange(parsed);
                } catch { }
            }

            List<string> newlyUnlocked = new List<string>();
            Action<string> tryUnlock = delegate(string c) {
                if (!achList.Contains(c)) {
                    achList.Add(c);
                    newlyUnlocked.Add(c);
                }
            };

            if (played >= 1) tryUnlock("first_game");
            if (totalDragons >= 1) tryUnlock("slayer");
            if (castles >= 2) tryUnlock("castle_lord");
            if (herds >= 3) tryUnlock("breeder");
            if (festHearts >= 15.0) tryUnlock("ball_master");
            if (won >= 1) tryUnlock("champion");
            if (totalDragons >= 3 || won >= 3) tryUnlock("grandmaster");

            string newAchJson = _json.Serialize(achList);

            using (var upd = new SqlCommand(@"
                UPDATE [prs].[prs_Users]
                SET [GamesPlayed] = @gp,
                    [GamesWon] = @gw,
                    [DragonsSlain] = @ds,
                    [TotalHeartsEarned] = @th,
                    [HighestScore] = @hs,
                    [AchievementsJson] = @aj
                WHERE [Id] = @id", conn))
            {
                upd.Parameters.AddWithValue("@gp", played);
                upd.Parameters.AddWithValue("@gw", won);
                upd.Parameters.AddWithValue("@ds", totalDragons);
                upd.Parameters.AddWithValue("@th", totalHearts);
                upd.Parameters.AddWithValue("@hs", highestScore);
                upd.Parameters.AddWithValue("@aj", newAchJson);
                upd.Parameters.AddWithValue("@id", authUser.Id);
                upd.ExecuteNonQuery();
            }

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                stats = new
                {
                    gamesPlayed = played,
                    gamesWon = won,
                    dragonsSlain = totalDragons,
                    totalHeartsEarned = Math.Round(totalHearts, 1),
                    highestScore = Math.Round(highestScore, 1),
                    achievements = achList,
                    newlyUnlocked = newlyUnlocked
                }
            }));
        }
    }

    private void HandleLogin(HttpContext context)

    {

        var body = ReadJsonBody(context);

        string username = GetStr(body, "username").Trim();
        string password = GetStr(body, "password");
        string reqDisplayName = GetStr(body, "displayName").Trim();

        using (var conn = new SqlConnection(CONN_STR))

        {

            conn.Open();

            EnsureExtendedAdminSchema(conn);

            SqlCommand cmd = null;

            SqlDataReader r = null;

            try

            {

                cmd = new SqlCommand(@"
                    SELECT [Id], [Username], [Email], [Role], [DisplayName], [PasswordHash],
                           ISNULL([IsActive], 1) AS [IsActive],
                           ISNULL([EmailConfirmed], 0) AS [EmailConfirmed],
                           [AvatarUrl],
                           ISNULL([AuthProvider], N'local') AS [AuthProvider],
                           [GamesPlayed], [GamesWon],
                           ISNULL([DragonsSlain], 0) AS [DragonsSlain],
                           ISNULL([TotalHeartsEarned], 0) AS [TotalHeartsEarned],
                           ISNULL([HighestScore], 0) AS [HighestScore],
                           [AchievementsJson],
                           [Credits], [SelectedPawnId], [UnlockedPawnsJson]
                    FROM [prs].[prs_Users]
                    WHERE [Username] = @u OR [Email] = @u", conn);

                cmd.Parameters.AddWithValue("@u", username);

                r = cmd.ExecuteReader();

            }

            catch (SqlException sqx)

            {

                if (sqx.Message.IndexOf("DisplayName", StringComparison.OrdinalIgnoreCase) >= 0)

                {

                    if (cmd != null) cmd.Dispose();

                    cmd = new SqlCommand(@"

                        SELECT [Id], [Username], [Email], [Role], [PasswordHash], [GamesPlayed], [GamesWon]

                        FROM [prs].[prs_Users]

                        WHERE [Username] = @u OR [Email] = @u", conn);

                    cmd.Parameters.AddWithValue("@u", username);

                    r = cmd.ExecuteReader();

                }

                else

                {

                    throw;

                }

            }

            using (cmd)

            using (r)

                {

                    if (r.Read())

                    {

                        string dbHash = r["PasswordHash"].ToString();

                        if (!VerifyPassword(password, dbHash))
                        {
                            context.Response.StatusCode = 401;
                            context.Response.Write(_json.Serialize(new { ok = false, status = "error", error = "Neplatn\u00e9 jm\u00e9no nebo heslo.", message = "Neplatn\u00e9 jm\u00e9no nebo heslo." }));
                            return;
                        }

                        bool isActive = true;
                        try
                        {
                            int iaIdx = r.GetOrdinal("IsActive");
                            if (!r.IsDBNull(iaIdx)) isActive = Convert.ToBoolean(r.GetValue(iaIdx));
                        }
                        catch { }
                        if (!isActive)
                        {
                            context.Response.StatusCode = 403;
                            context.Response.Write(_json.Serialize(new { ok = false, status = "error", code = "ACCOUNT_DISABLED", message = "Tento účet byl deaktivován administrátorem." }));
                            return;
                        }

                        int id = Convert.ToInt32(r["Id"]);

                        string u = r["Username"].ToString();

                        string role = r["Role"].ToString();

                        string dn = u;

                        try

                        {

                            int colIdx = r.GetOrdinal("DisplayName");

                            if (!r.IsDBNull(colIdx))

                            {

                                string val = r.GetString(colIdx);

                                if (!string.IsNullOrEmpty(val)) dn = val;

                            }

                        }

                        catch { }

                        int gp = Convert.ToInt32(r["GamesPlayed"]);

                        int gw = Convert.ToInt32(r["GamesWon"]);

                        int credits = (role == "Admin" || u == "rytir_jan") ? 2500 : 250;
                        string selectedPawnId = "knight_valiant";
                        string unlockedPawnsJson = "[\"knight_valiant\",\"knight_tourney\",\"lady_huntress\",\"lord_diplomat\",\"knight_warden\",\"lady_sorceress\"]";
                        try
                        {
                            int cIdx = r.GetOrdinal("Credits");
                            if (!r.IsDBNull(cIdx)) credits = Convert.ToInt32(r["Credits"]);
                            int sIdx = r.GetOrdinal("SelectedPawnId");
                            if (!r.IsDBNull(sIdx) && !string.IsNullOrEmpty(r.GetString(sIdx))) selectedPawnId = r.GetString(sIdx);
                            int uIdx = r.GetOrdinal("UnlockedPawnsJson");
                            if (!r.IsDBNull(uIdx) && !string.IsNullOrEmpty(r.GetString(uIdx))) unlockedPawnsJson = r.GetString(uIdx);
                        }
                        catch { }

                        string userEmail = (r["Email"] == DBNull.Value) ? "" : r["Email"].ToString();
                        bool emailConfirmed = false;
                        string avatarUrl = "";
                        string authProvider = "local";
                        int ds = 0;
                        double th = 0;
                        double hs = 0;
                        string ach = "[]";
                        try
                        {
                            int dsIdx = r.GetOrdinal("DragonsSlain");
                            if (!r.IsDBNull(dsIdx)) ds = Convert.ToInt32(r[dsIdx]);
                            int thIdx = r.GetOrdinal("TotalHeartsEarned");
                            if (!r.IsDBNull(thIdx)) th = Convert.ToDouble(r[thIdx]);
                            int hsIdx = r.GetOrdinal("HighestScore");
                            if (!r.IsDBNull(hsIdx)) hs = Convert.ToDouble(r[hsIdx]);
                            int achIdx = r.GetOrdinal("AchievementsJson");
                            if (!r.IsDBNull(achIdx) && !string.IsNullOrEmpty(r[achIdx].ToString())) ach = r[achIdx].ToString();
                        }
                        catch { }
                        try
                        {
                            int ecIdx = r.GetOrdinal("EmailConfirmed");
                            if (!r.IsDBNull(ecIdx)) emailConfirmed = Convert.ToBoolean(r.GetValue(ecIdx));
                        }
                        catch { }
                        try
                        {
                            int avIdx = r.GetOrdinal("AvatarUrl");
                            if (!r.IsDBNull(avIdx)) avatarUrl = r.GetString(avIdx);
                        }
                        catch { }
                        try
                        {
                            int apIdx = r.GetOrdinal("AuthProvider");
                            if (!r.IsDBNull(apIdx)) authProvider = r.GetString(apIdx);
                        }
                        catch { }

                        r.Close();

                        // Pokud byl uživatel ověřen starým SHA-256 hashem (bez dvojtečky per-user saltu),

                        // transparentně zmigrujeme heslo na standardní PBKDF2 / Rfc2898DeriveBytes

                        if (!dbHash.Contains(":"))

                        {

                            string newPbkdf2Hash = HashPassword(password);

                            using (var upg = new SqlCommand("UPDATE [prs].[prs_Users] SET [PasswordHash] = @newHash WHERE [Id] = @id", conn))

                            {

                                upg.Parameters.AddWithValue("@newHash", newPbkdf2Hash);

                                upg.Parameters.AddWithValue("@id", id);

                                upg.ExecuteNonQuery();

                            }

                        }

                        if (!string.IsNullOrEmpty(reqDisplayName) && reqDisplayName != dn)
                        {
                            try
                            {
                                using (var updNick = new SqlCommand("UPDATE [prs].[prs_Users] SET [DisplayName] = @dn WHERE [Id] = @id", conn))
                                {
                                    updNick.Parameters.Add("@dn", SqlDbType.NVarChar, 64).Value = reqDisplayName;
                                    updNick.Parameters.AddWithValue("@id", id);
                                    updNick.ExecuteNonQuery();
                                    dn = reqDisplayName;
                                }
                            }
                            catch { }
                        }

                        using (var upd = new SqlCommand("UPDATE [prs].[prs_Users] SET [LastLoginAt] = SYSUTCDATETIME() WHERE [Id] = @id", conn))
                        {
                            upd.Parameters.AddWithValue("@id", id);
                            upd.ExecuteNonQuery();
                        }

                        string authToken = CreateSessionToken(conn, id, context);

                        context.Response.Write(_json.Serialize(new
                        {
                            ok = true,
                            status = "success",
                            authToken = authToken,
                            user = new { id = id, username = u, displayName = dn, role = role, email = userEmail, emailConfirmed = emailConfirmed, avatarUrl = avatarUrl, authProvider = authProvider, gamesPlayed = gp, gamesWon = gw, dragonsSlain = ds, totalHeartsEarned = Math.Round(th, 1), highestScore = Math.Round(hs, 1), achievementsJson = ach, credits = credits, selectedPawnId = selectedPawnId, unlockedPawnsJson = unlockedPawnsJson }
                        }));

                        return;

                    }

                }

            }

        context.Response.StatusCode = 401;

        context.Response.Write(_json.Serialize(new { ok = false, status = "error", error = "Neplatn\u00e9 jm\u00e9no nebo heslo.", message = "Neplatn\u00e9 jm\u00e9no nebo heslo." }));

    }
}
