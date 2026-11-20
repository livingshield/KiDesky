using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace KiDesky.Backend
{
    public class RoomEmoteItem
    {
        public string id;
        public string code;
        public int playerIndex;
        public string author;
        public string emote;
        public long timestamp;
    }

    public class RoomChatMessage
    {
        public string id;
        public string code;
        public int playerIndex;
        public string author;
        public string crestId;
        public string crestColor;
        public string text;
        public long timestamp;
        public bool isSystem;
    }

    public class AuthenticatedUser
    {
        public int Id;
        public string Username;
        public string Email;
        public string Role;
        public string DisplayName;
        public bool IsActive;
        public bool EmailConfirmed;
        public int Credits;
        public string SelectedPawnId;
        public string UnlockedPawnsJson;
        public int GamesPlayed;
        public int GamesWon;
        public int DragonsSlain;
        public double TotalHeartsEarned;
        public double HighestScore;
        public string AchievementsJson;
        public string AvatarUrl;
        public string AuthProvider;
    }

    public abstract class KiDeskyHandlerBase : IHttpHandler
    {
    protected static readonly Dictionary<string, int> _authoritativePawnPrices = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
    {
        { "knight_valiant", 0 },
        { "knight_tourney", 0 },
        { "lady_huntress", 0 },
        { "lord_diplomat", 0 },
        { "knight_warden", 0 },
        { "lady_sorceress", 0 },
        { "bot_aggressive", 0 },
        { "bot_breeder", 0 },
        { "bot_noble", 0 },
        { "bot_balanced", 0 },
        { "bot_easy", 0 },
        { "prem_dragon_lord", 500 },
        { "prem_ice_queen", 500 },
        { "prem_shadow_assassin", 600 },
        { "prem_golden_king", 750 },
        { "prem_unicorn_rider", 800 },
        { "prem_phoenix_paladin", 1000 }
    };

    protected static string _resolvedConnStr = null;

    protected readonly JavaScriptSerializer _json = new JavaScriptSerializer { MaxJsonLength = 20 * 1024 * 1024 };

    protected static bool _schemaEnsured = false;

    protected static readonly object _schemaLock = new object();

    protected static string ExtractJsonConn(string json, string key)

    {

        if (string.IsNullOrEmpty(json)) return null;

        int idx = json.IndexOf("\"" + key + "\"", StringComparison.OrdinalIgnoreCase);

        if (idx < 0) return null;

        int colon = json.IndexOf(':', idx);

        if (colon < 0) return null;

        int startQuote = json.IndexOf('"', colon + 1);

        if (startQuote < 0) return null;

        int endQuote = json.IndexOf('"', startQuote + 1);

        if (startQuote > 0 && endQuote > startQuote)

        {

            string val = json.Substring(startQuote + 1, endQuote - startQuote - 1).Replace("\\\"", "\"").Replace("\\\\", "\\");

            if (!string.IsNullOrEmpty(val) && !val.Contains("YOUR_SERVER"))

            {

                return val;

            }

        }

        return null;

    }

    protected static string CONN_STR

    {

        get

        {

            if (!string.IsNullOrEmpty(_resolvedConnStr)) return _resolvedConnStr;

            // 1. Web.config ConnectionStrings

            try

            {

                var csProd = System.Configuration.ConfigurationManager.ConnectionStrings["ProductionConnection"];

                if (csProd != null && !string.IsNullOrEmpty(csProd.ConnectionString) && !csProd.ConnectionString.Contains("YOUR_SERVER"))

                {

                    _resolvedConnStr = csProd.ConnectionString;

                    return _resolvedConnStr;

                }

                var csDef = System.Configuration.ConfigurationManager.ConnectionStrings["DefaultConnection"];

                if (csDef != null && !string.IsNullOrEmpty(csDef.ConnectionString) && !csDef.ConnectionString.Contains("YOUR_SERVER"))

                {

                    _resolvedConnStr = csDef.ConnectionString;

                    return _resolvedConnStr;

                }

            }

            catch { }

            // 2. JSON konfigurace v ruznych moznych umistenich

            string[] candidateFiles = new string[] {

                "appsettings.Production.json",

                "appsettings.local.json",

                "appsettings.json"

            };

            List<string> candidatePaths = new List<string>();

            try

            {

                if (HttpContext.Current != null && HttpContext.Current.Server != null)

                {

                    foreach (var cf in candidateFiles)

                    {

                        try { candidatePaths.Add(HttpContext.Current.Server.MapPath(cf)); } catch { }

                        try { candidatePaths.Add(HttpContext.Current.Server.MapPath("./" + cf)); } catch { }

                        try { candidatePaths.Add(HttpContext.Current.Server.MapPath("~/" + cf)); } catch { }

                        try { candidatePaths.Add(HttpContext.Current.Server.MapPath("~/apps/KiDesky/" + cf)); } catch { }

                    }

                }

            }

            catch { }

            try

            {

                string baseDir = AppDomain.CurrentDomain.BaseDirectory;

                if (!string.IsNullOrEmpty(baseDir))

                {

                    foreach (var cf in candidateFiles)

                    {

                        candidatePaths.Add(Path.Combine(baseDir, cf));

                        candidatePaths.Add(Path.Combine(baseDir, "apps", "KiDesky", cf));

                    }

                }

            }

            catch { }

            foreach (var path in candidatePaths)

            {

                try

                {

                    if (!string.IsNullOrEmpty(path) && File.Exists(path))

                    {

                        string json = File.ReadAllText(path);

                        string res = ExtractJsonConn(json, "ProductionConnection") ?? ExtractJsonConn(json, "DefaultConnection");

                        if (!string.IsNullOrEmpty(res))

                        {

                            _resolvedConnStr = res;

                            return _resolvedConnStr;

                        }

                    }

                }

                catch { }

            }

            // 3. Environment variable

            try

            {

                string envConn = Environment.GetEnvironmentVariable("SQL_CONN_STR") ?? Environment.GetEnvironmentVariable("DB_CONN_STR");

                if (!string.IsNullOrEmpty(envConn) && !envConn.Contains("YOUR_SERVER"))

                {

                    _resolvedConnStr = envConn;

                    return _resolvedConnStr;

                }

            }

            catch { }

            _resolvedConnStr = string.Empty;

            return _resolvedConnStr;

        }

    }

    private static List<Dictionary<string, object>> _cachedSettingsList = null;

    protected static List<Dictionary<string, object>> LoadSettingsObjects()
    {
        if (_cachedSettingsList != null) return _cachedSettingsList;

        var list = new List<Dictionary<string, object>>();
        string[] candidateFiles = new string[] {
            "appsettings.Production.json",
            "appsettings.local.json",
            "appsettings.json"
        };
        var candidatePaths = new List<string>();
        try
        {
            if (HttpContext.Current != null && HttpContext.Current.Server != null)
            {
                foreach (var cf in candidateFiles)
                {
                    try { candidatePaths.Add(HttpContext.Current.Server.MapPath(cf)); } catch { }
                    try { candidatePaths.Add(HttpContext.Current.Server.MapPath("./" + cf)); } catch { }
                    try { candidatePaths.Add(HttpContext.Current.Server.MapPath("~/" + cf)); } catch { }
                    try { candidatePaths.Add(HttpContext.Current.Server.MapPath("~/apps/KiDesky/" + cf)); } catch { }
                }
            }
        }
        catch { }
        try
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            if (!string.IsNullOrEmpty(baseDir))
            {
                foreach (var cf in candidateFiles)
                {
                    candidatePaths.Add(Path.Combine(baseDir, cf));
                    candidatePaths.Add(Path.Combine(baseDir, "apps", "KiDesky", cf));
                }
            }
        }
        catch { }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var js = new JavaScriptSerializer { MaxJsonLength = 2 * 1024 * 1024 };
        foreach (var p in candidatePaths)
        {
            try
            {
                if (string.IsNullOrEmpty(p) || !seen.Add(p) || !File.Exists(p)) continue;
                string raw = File.ReadAllText(p, Encoding.UTF8);
                var parsed = js.Deserialize<Dictionary<string, object>>(raw);
                if (parsed != null) list.Add(parsed);
            }
            catch { }
        }
        _cachedSettingsList = list;
        return list;
    }

    private static object LookupSettingPath(Dictionary<string, object> root, string pathExpr)
    {
        if (root == null || string.IsNullOrEmpty(pathExpr)) return null;
        string[] parts = pathExpr.Split(':');
        object cur = root;
        for (int i = 0; i < parts.Length; i++)
        {
            var dict = cur as Dictionary<string, object>;
            if (dict == null) return null;
            object matched = null;
            bool found = false;
            foreach (var kv in dict)
            {
                if (string.Equals(kv.Key, parts[i], StringComparison.OrdinalIgnoreCase))
                {
                    matched = kv.Value;
                    found = true;
                    break;
                }
            }
            if (!found || matched == null) return null;
            cur = matched;
        }
        return cur;
    }

    protected static string GetSettingStr(string jsonPath, string envVarName, string defaultVal)
    {
        var objs = LoadSettingsObjects();
        for (int i = 0; i < objs.Count; i++)
        {
            object val = LookupSettingPath(objs[i], jsonPath);
            if (val == null) continue;
            string s = Convert.ToString(val);
            if (!string.IsNullOrEmpty(s) && !s.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
            {
                return s;
            }
        }
        if (!string.IsNullOrEmpty(envVarName))
        {
            try
            {
                string envVal = Environment.GetEnvironmentVariable(envVarName);
                if (!string.IsNullOrEmpty(envVal) && !envVal.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
                {
                    return envVal;
                }
            }
            catch { }
        }
        return defaultVal;
    }

    protected static int GetSettingInt(string jsonPath, string envVarName, int defaultVal)
    {
        string raw = GetSettingStr(jsonPath, envVarName, null);
        int parsed;
        if (!string.IsNullOrEmpty(raw) && int.TryParse(raw, out parsed)) return parsed;
        return defaultVal;
    }

    protected static bool GetSettingBool(string jsonPath, string envVarName, bool defaultVal)
    {
        string raw = GetSettingStr(jsonPath, envVarName, null);
        bool parsed;
        if (!string.IsNullOrEmpty(raw) && bool.TryParse(raw, out parsed)) return parsed;
        return defaultVal;
    }

    protected static string GOOGLE_CLIENT_ID
    {
        get
        {
            return GetSettingStr(
                "Authentication:Google:ClientId",
                "GOOGLE_CLIENT_ID",
                "335921016939-afepn3s6mpsep890pjr08bli6ufj0jub.apps.googleusercontent.com"
            );
        }
    }

    protected static bool SendConfirmationEmail(string recipientEmail, string recipientName, string token, out string error)
    {
        error = null;
        try
        {
            if (string.IsNullOrEmpty(recipientEmail) || !recipientEmail.Contains("@"))
            {
                error = "Neplatna e-mailova adresa.";
                return false;
            }

            try
            {
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;
            }
            catch { }

            string smtpHost = GetSettingStr("Smtp:Host", "SMTP_HOST", "");
            int smtpPort = GetSettingInt("Smtp:Port", "SMTP_PORT", 587);
            string smtpUser = GetSettingStr("Smtp:Username", "SMTP_USER", "");
            string smtpPass = GetSettingStr("Smtp:Password", "SMTP_PASS", "");
            bool smtpSsl = GetSettingBool("Smtp:EnableSsl", "SMTP_SSL", true);
            string smtpFrom = GetSettingStr("Smtp:FromEmail", "SMTP_FROM", smtpUser);
            string smtpFromName = GetSettingStr("Smtp:FromName", "SMTP_FROM_NAME", "Princeznino srdce");

            if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
            {
                error = "SMTP konfigurace není nastavena.";
                return false;
            }

            using (var client = new SmtpClient(smtpHost, smtpPort))
            {
                client.EnableSsl = smtpSsl;
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                client.DeliveryMethod = SmtpDeliveryMethod.Network;
                client.Timeout = 12000;

                string confirmUrl = "https://www.ekobio.org/apps/KiDesky/?confirmEmail=" + HttpUtility.UrlEncode(token);
                string safeName = string.IsNullOrEmpty(recipientName) ? "Rytíři" : recipientName;

                using (var msg = new MailMessage())
                {
                    msg.From = new MailAddress(smtpFrom, smtpFromName, Encoding.UTF8);
                    msg.To.Add(new MailAddress(recipientEmail, safeName, Encoding.UTF8));
                    msg.Subject = "👑 Potvrzení rytířského účtu – KiDesky: Princeznino srdce";
                    msg.BodyEncoding = Encoding.UTF8;
                    msg.IsBodyHtml = true;
                    msg.Body = "<!DOCTYPE html><html><head><meta charset='utf-8'/><style>" +
                        "body{font-family:'Segoe UI',Arial,sans-serif;background:#120d08;color:#f1ede4;margin:0;padding:20px;}" +
                        ".box{max-width:580px;margin:0 auto;background:#1c140d;border:2px solid #d4af37;border-radius:10px;padding:28px;box-shadow:0 6px 24px rgba(0,0,0,0.7);}" +
                        "h1{color:#ffd86b;font-size:22px;margin-top:0;border-bottom:1px solid rgba(212,175,55,0.3);padding-bottom:10px;}" +
                        "p{font-size:15px;line-height:1.6;color:#e2d9cc;}" +
                        ".btn-wrap{text-align:center;margin:24px 0;}" +
                        ".btn{display:inline-block;background:#d4af37;color:#1c1917 !important;text-decoration:none;font-weight:bold;font-size:16px;padding:13px 26px;border-radius:6px;box-shadow:0 4px 12px rgba(212,175,55,0.35);}" +
                        ".footer{font-size:12px;color:#8c8275;margin-top:22px;border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;}" +
                        "</style></head><body><div class='box'>" +
                        "<h1>🛡️ Královská pečeť pro rytíře " + HttpUtility.HtmlEncode(safeName) + "</h1>" +
                        "<p>Zdravíme tě v království <strong>KiDesky: Princeznino srdce</strong>!</p>" +
                        "<p>Tvůj rytířský účet byl úspěšně vytvořen. Aby se tvá postava probudila v plné síle, získala <strong>250 zlaťáků/kreditů</strong> a možnost ukládat herní úspěchy a prémiové figurky, stačí potvrdit tvou e-mailovou adresu:</p>" +
                        "<div class='btn-wrap'><a class='btn' href='" + confirmUrl + "' target='_blank'>👑 Potvrdit můj rytířský účet</a></div>" +
                        "<p style='font-size:13px;color:#b0a595;'>Pokud tlačítko nefunguje, otevři tento odkaz v prohlížeči:<br/>" +
                        "<a style='color:#ffd86b;' href='" + confirmUrl + "'>" + confirmUrl + "</a></p>" +
                        "<div class='footer'>Tento e-mail byl odeslán na základě registrace na www.ekobio.org/apps/KiDesky/. Platnost odkazu je 48 hodin.<br/>Pokud jsi registraci neprováděl/a, tento dopis můžeš ignorovat.</div>" +
                        "</div></body></html>";
                    client.Send(msg);
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    protected static bool IsAllowedOrigin(string origin)
    {
        if (string.IsNullOrEmpty(origin)) return false;
        Uri uri;
        if (!Uri.TryCreate(origin, UriKind.Absolute, out uri)) return false;
        string host = uri.Host;
        if (uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase) &&
            (host.Equals("www.ekobio.org", StringComparison.OrdinalIgnoreCase) ||
             host.Equals("ekobio.org", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }
        if ((uri.Scheme.Equals("http", StringComparison.OrdinalIgnoreCase) || uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase)) &&
            (host.Equals("localhost", StringComparison.OrdinalIgnoreCase) || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }
        return false;
    }

    protected static string ComputeSha256Hex(string input)
    {
        using (var sha = SHA256.Create())
        {
            byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input ?? ""));
            StringBuilder sb = new StringBuilder(bytes.Length * 2);
            for (int i = 0; i < bytes.Length; i++)
            {
                sb.Append(bytes[i].ToString("x2"));
            }
            return sb.ToString();
        }
    }

    protected static string ExtractAuthToken(HttpContext context)
    {
        if (context == null || context.Request == null) return null;
        string tok = context.Request.Headers["X-KiDesky-Auth"];
        if (!string.IsNullOrEmpty(tok)) return tok.Trim();
        string authHdr = context.Request.Headers["Authorization"];
        if (!string.IsNullOrEmpty(authHdr) && authHdr.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHdr.Substring(7).Trim();
        }
        return null;
    }

    protected string CreateSessionToken(SqlConnection conn, int userId, HttpContext context)
    {
        byte[] rawBytes = new byte[32];
        using (var rng = new RNGCryptoServiceProvider())
        {
            rng.GetBytes(rawBytes);
        }
        StringBuilder sb = new StringBuilder(rawBytes.Length * 2);
        for (int i = 0; i < rawBytes.Length; i++)
        {
            sb.Append(rawBytes[i].ToString("x2"));
        }
        string rawToken = sb.ToString();
        string tokenHash = ComputeSha256Hex(rawToken);
        DateTime expiresAt = DateTime.UtcNow.AddDays(30);
        string ua = (context != null && context.Request != null) ? (context.Request.UserAgent ?? "") : "";
        if (ua.Length > 256) ua = ua.Substring(0, 256);

        try
        {
            using (var cleanupCmd = new SqlCommand("DELETE FROM [prs].[prs_UserSessions] WHERE [ExpiresAt] < SYSUTCDATETIME()", conn))
            {
                cleanupCmd.ExecuteNonQuery();
            }
        }
        catch { }

        using (var insCmd = new SqlCommand(@"
            INSERT INTO [prs].[prs_UserSessions] ([UserId], [TokenHash], [CreatedAt], [ExpiresAt], [UserAgent])
            VALUES (@uid, @th, SYSUTCDATETIME(), @exp, @ua)", conn))
        {
            insCmd.Parameters.AddWithValue("@uid", userId);
            insCmd.Parameters.Add("@th", SqlDbType.NVarChar, 64).Value = tokenHash;
            insCmd.Parameters.AddWithValue("@exp", expiresAt);
            insCmd.Parameters.Add("@ua", SqlDbType.NVarChar, 256).Value = string.IsNullOrEmpty(ua) ? (object)DBNull.Value : ua;
            insCmd.ExecuteNonQuery();
        }
        return rawToken;
    }

    protected void RevokeSessionToken(SqlConnection conn, string rawToken)
    {
        if (conn == null || string.IsNullOrEmpty(rawToken)) return;
        string tokenHash = ComputeSha256Hex(rawToken.Trim());
        try
        {
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_UserSessions] SET [RevokedAt] = SYSUTCDATETIME() WHERE [TokenHash] = @th AND [RevokedAt] IS NULL", conn))
            {
                cmd.Parameters.Add("@th", SqlDbType.NVarChar, 64).Value = tokenHash;
                cmd.ExecuteNonQuery();
            }
        }
        catch { }
    }

    protected void RevokeAllUserSessions(SqlConnection conn, int userId)
    {
        if (conn == null || userId <= 0) return;
        try
        {
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_UserSessions] SET [RevokedAt] = SYSUTCDATETIME() WHERE [UserId] = @uid AND [RevokedAt] IS NULL", conn))
            {
                cmd.Parameters.AddWithValue("@uid", userId);
                cmd.ExecuteNonQuery();
            }
        }
        catch { }
    }

    protected object BuildUserDto(AuthenticatedUser u)
    {
        return new
        {
            id = u.Id,
            username = u.Username,
            displayName = u.DisplayName,
            role = u.Role,
            email = u.Email,
            emailConfirmed = u.EmailConfirmed,
            avatarUrl = u.AvatarUrl,
            authProvider = u.AuthProvider,
            gamesPlayed = u.GamesPlayed,
            gamesWon = u.GamesWon,
            dragonsSlain = u.DragonsSlain,
            totalHeartsEarned = Math.Round(u.TotalHeartsEarned, 1),
            highestScore = Math.Round(u.HighestScore, 1),
            achievementsJson = u.AchievementsJson,
            credits = u.Credits,
            selectedPawnId = u.SelectedPawnId,
            unlockedPawnsJson = u.UnlockedPawnsJson
        };
    }

    protected AuthenticatedUser GetAuthenticatedUser(HttpContext context)
    {
        string token = ExtractAuthToken(context);
        if (string.IsNullOrEmpty(token) || !IsDbConfigured()) return null;
        string tokenHash = ComputeSha256Hex(token);

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT TOP 1
                    u.[Id], u.[Username], u.[Email], u.[Role], u.[DisplayName],
                    ISNULL(u.[IsActive], 1) AS [IsActive],
                    ISNULL(u.[EmailConfirmed], 0) AS [EmailConfirmed],
                    ISNULL(u.[Credits], 250) AS [Credits],
                    ISNULL(u.[SelectedPawnId], N'knight_valiant') AS [SelectedPawnId],
                    u.[UnlockedPawnsJson],
                    ISNULL(u.[GamesPlayed], 0) AS [GamesPlayed],
                    ISNULL(u.[GamesWon], 0) AS [GamesWon],
                    ISNULL(u.[DragonsSlain], 0) AS [DragonsSlain],
                    ISNULL(u.[TotalHeartsEarned], 0) AS [TotalHeartsEarned],
                    ISNULL(u.[HighestScore], 0) AS [HighestScore],
                    u.[AchievementsJson],
                    u.[AvatarUrl],
                    ISNULL(u.[AuthProvider], N'local') AS [AuthProvider]
                FROM [prs].[prs_UserSessions] s
                INNER JOIN [prs].[prs_Users] u ON u.[Id] = s.[UserId]
                WHERE s.[TokenHash] = @th
                  AND s.[RevokedAt] IS NULL
                  AND s.[ExpiresAt] > SYSUTCDATETIME()", conn))
            {
                cmd.Parameters.Add("@th", SqlDbType.NVarChar, 64).Value = tokenHash;
                using (var r = cmd.ExecuteReader())
                {
                    if (!r.Read()) return null;
                    bool isActive = Convert.ToBoolean(r["IsActive"]);
                    if (!isActive) return null;

                    string uname = r["Username"].ToString();
                    string disp = (r["DisplayName"] == DBNull.Value || string.IsNullOrEmpty(r["DisplayName"].ToString()))
                        ? uname : r["DisplayName"].ToString();
                    string unlocked = (r["UnlockedPawnsJson"] == DBNull.Value || string.IsNullOrEmpty(r["UnlockedPawnsJson"].ToString()))
                        ? "[\"knight_valiant\",\"knight_tourney\",\"lady_huntress\",\"lord_diplomat\",\"knight_warden\",\"lady_sorceress\"]"
                        : r["UnlockedPawnsJson"].ToString();
                    string ach = (r["AchievementsJson"] == DBNull.Value || string.IsNullOrEmpty(r["AchievementsJson"].ToString()))
                        ? "[]" : r["AchievementsJson"].ToString();

                    return new AuthenticatedUser
                    {
                        Id = Convert.ToInt32(r["Id"]),
                        Username = uname,
                        Email = r["Email"] == DBNull.Value ? "" : r["Email"].ToString(),
                        Role = r["Role"].ToString(),
                        DisplayName = disp,
                        IsActive = isActive,
                        EmailConfirmed = Convert.ToBoolean(r["EmailConfirmed"]),
                        Credits = Convert.ToInt32(r["Credits"]),
                        SelectedPawnId = r["SelectedPawnId"].ToString(),
                        UnlockedPawnsJson = unlocked,
                        GamesPlayed = Convert.ToInt32(r["GamesPlayed"]),
                        GamesWon = Convert.ToInt32(r["GamesWon"]),
                        DragonsSlain = Convert.ToInt32(r["DragonsSlain"]),
                        TotalHeartsEarned = Convert.ToDouble(r["TotalHeartsEarned"]),
                        HighestScore = Convert.ToDouble(r["HighestScore"]),
                        AchievementsJson = ach,
                        AvatarUrl = r["AvatarUrl"] == DBNull.Value ? "" : r["AvatarUrl"].ToString(),
                        AuthProvider = r["AuthProvider"].ToString()
                    };
                }
            }
        }
    }

    protected AuthenticatedUser RequireAuthenticatedUser(HttpContext context)
    {
        AuthenticatedUser user = GetAuthenticatedUser(context);
        if (user == null)
        {
            context.Response.StatusCode = 401;
            context.Response.Write(_json.Serialize(new
            {
                ok = false,
                status = "unauthorized",
                code = "AUTH_REQUIRED",
                message = "Vyžadováno přihlášení."
            }));
            return null;
        }
        return user;
    }

    protected AuthenticatedUser RequireAdmin(HttpContext context)
    {
        AuthenticatedUser user = RequireAuthenticatedUser(context);
        if (user == null) return null;
        if (!string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = 403;
            context.Response.Write(_json.Serialize(new
            {
                ok = false,
                status = "forbidden",
                code = "ADMIN_REQUIRED",
                message = "Vyžadována oprávnění administrátora."
            }));
            return null;
        }
        return user;
    }

    protected bool IsDbConfigured()

    {

        return !string.IsNullOrEmpty(CONN_STR) && !CONN_STR.Contains("YOUR_SERVER") && !CONN_STR.Contains("__DB_" + "CONN_STRING__");

    }

    protected static string HashPassword(string password)

    {

        byte[] salt = new byte[16];

        using (var rng = new RNGCryptoServiceProvider())

        {

            rng.GetBytes(salt);

        }

        using (var pbkdf2 = new Rfc2898DeriveBytes(password ?? "", salt, 10000))

        {

            byte[] hash = pbkdf2.GetBytes(32);

            return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);

        }

    }

    protected static bool VerifyPassword(string password, string storedHash)

    {

        if (string.IsNullOrEmpty(storedHash)) return false;

        // Zpětná kompatibilita pro původní SHA256 hashe

        if (!storedHash.Contains(":"))

        {

            using (var sha = SHA256.Create())

            {

                byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes("prs_salt_2026_" + (password ?? "")));

                StringBuilder sb = new StringBuilder();

                foreach (byte b in bytes) sb.Append(b.ToString("x2"));

                return sb.ToString().Equals(storedHash, StringComparison.OrdinalIgnoreCase);

            }

        }

        string[] parts = storedHash.Split(':');

        if (parts.Length != 2) return false;

        try

        {

            byte[] salt = Convert.FromBase64String(parts[0]);

            byte[] expectedHash = Convert.FromBase64String(parts[1]);

            using (var pbkdf2 = new Rfc2898DeriveBytes(password ?? "", salt, 10000))

            {

                byte[] actualHash = pbkdf2.GetBytes(32);

                if (actualHash.Length != expectedHash.Length) return false;

                int diff = 0;

                for (int i = 0; i < actualHash.Length; i++) diff |= (actualHash[i] ^ expectedHash[i]);

                return diff == 0;

            }

        }

        catch

        {

            return false;

        }

    }

    protected Dictionary<string, object> ReadJsonBody(HttpContext context)

    {

        using (var reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))

        {

            string body = reader.ReadToEnd();

            if (string.IsNullOrWhiteSpace(body)) return new Dictionary<string, object>();

            return _json.Deserialize<Dictionary<string, object>>(body) ?? new Dictionary<string, object>();

        }

    }

    protected string GetStr(Dictionary<string, object> dict, string key, string defVal = "")

    {

        if (dict != null && dict.ContainsKey(key) && dict[key] != null)

            return dict[key].ToString();

        return defVal;

    }

    protected int GetInt(Dictionary<string, object> dict, string key, int defVal = 0)

    {

        if (dict != null && dict.ContainsKey(key) && dict[key] != null)

        {

            int val;

            if (int.TryParse(dict[key].ToString(), out val)) return val;

        }

        return defVal;

    }

    protected bool GetBool(Dictionary<string, object> dict, string key, bool defVal = false)

    {

        if (dict != null && dict.ContainsKey(key) && dict[key] != null)

        {

            bool val;

            if (bool.TryParse(dict[key].ToString(), out val)) return val;

            string s = dict[key].ToString().ToLowerInvariant();

            if (s == "1" || s == "true" || s == "yes") return true;

            if (s == "0" || s == "false" || s == "no") return false;

        }

        return defVal;

    }

    protected static string StripControlChars(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        StringBuilder sb = new StringBuilder(s.Length);
        for (int i = 0; i < s.Length; i++)
        {
            char c = s[i];
            if (c >= 0x20 || c == '\n' || c == '\r' || c == '\t')
            {
                sb.Append(c);
            }
        }
        return sb.ToString();
    }

    protected static string TruncateStr(string s, int maxLen)
    {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Length > maxLen ? s.Substring(0, maxLen) : s;
    }

    protected List<RoomChatMessage> LoadRoomChat(SqlConnection conn, string roomCode, long sinceTs, int maxCount)
    {
        List<RoomChatMessage> list = new List<RoomChatMessage>();
        if (string.IsNullOrEmpty(roomCode)) return list;
        int lim = maxCount > 0 ? maxCount : 60;
        if (lim > 100) lim = 100;
        using (var cmd = new SqlCommand(@"
            SELECT TOP (@lim) [MessageId], [RoomCode], [PlayerIndex], [Author], [CrestId], [CrestColor], [MessageText], [IsSystem], [TimestampMs]
            FROM [prs].[prs_RoomChat]
            WHERE [RoomCode] = @code AND (@since <= 0 OR [TimestampMs] > @since)
            ORDER BY [TimestampMs] DESC, [Id] DESC", conn))
        {
            cmd.Parameters.Add("@lim", SqlDbType.Int).Value = lim;
            cmd.Parameters.Add("@code", SqlDbType.NVarChar, 16).Value = TruncateStr(roomCode.Trim().ToUpperInvariant(), 16);
            cmd.Parameters.Add("@since", SqlDbType.BigInt).Value = sinceTs;
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    list.Add(new RoomChatMessage
                    {
                        id = r["MessageId"].ToString(),
                        code = r["RoomCode"].ToString(),
                        playerIndex = Convert.ToInt32(r["PlayerIndex"]),
                        author = r["Author"].ToString(),
                        crestId = r["CrestId"].ToString(),
                        crestColor = r["CrestColor"].ToString(),
                        text = r["MessageText"].ToString(),
                        isSystem = Convert.ToBoolean(r["IsSystem"]),
                        timestamp = Convert.ToInt64(r["TimestampMs"])
                    });
                }
            }
        }
        list.Reverse();
        return list;
    }

    protected List<RoomEmoteItem> LoadRecentRoomEmotes(SqlConnection conn, string roomCode, long minTs)
    {
        List<RoomEmoteItem> list = new List<RoomEmoteItem>();
        if (string.IsNullOrEmpty(roomCode)) return list;
        using (var cmd = new SqlCommand(@"
            SELECT TOP 15 [EmoteId], [RoomCode], [PlayerIndex], [Author], [EmoteText], [TimestampMs]
            FROM [prs].[prs_RoomEmotes]
            WHERE [RoomCode] = @code AND [TimestampMs] > @minTs
            ORDER BY [TimestampMs] ASC, [Id] ASC", conn))
        {
            cmd.Parameters.Add("@code", SqlDbType.NVarChar, 16).Value = TruncateStr(roomCode.Trim().ToUpperInvariant(), 16);
            cmd.Parameters.Add("@minTs", SqlDbType.BigInt).Value = minTs;
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    list.Add(new RoomEmoteItem
                    {
                        id = r["EmoteId"].ToString(),
                        code = r["RoomCode"].ToString(),
                        playerIndex = Convert.ToInt32(r["PlayerIndex"]),
                        author = r["Author"].ToString(),
                        emote = r["EmoteText"].ToString(),
                        timestamp = Convert.ToInt64(r["TimestampMs"])
                    });
                }
            }
        }
        return list;
    }

    protected static bool _extendedAdminSchemaChecked = false;

    protected void EnsureExtendedAdminSchema(SqlConnection conn)
    {
        if (_extendedAdminSchemaChecked) return;
        try
        {
            using (var migCmd = new SqlCommand(@"
IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'DisplayName') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [DisplayName] NVARCHAR(64) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'IsActive') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [IsActive] BIT NOT NULL DEFAULT 1;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'Credits') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [Credits] INT NOT NULL DEFAULT 250;
    EXEC(N'UPDATE [prs].[prs_Users] SET [Credits] = 2500 WHERE [Role] = N''Admin'' OR [Username] = N''rytir_jan''');
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'SelectedPawnId') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [SelectedPawnId] NVARCHAR(64) NOT NULL DEFAULT N'knight_valiant';
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'UnlockedPawnsJson') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [UnlockedPawnsJson] NVARCHAR(MAX) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL
BEGIN
    EXEC(N'UPDATE [prs].[prs_Users] SET [DisplayName] = [Username] WHERE [DisplayName] IS NULL OR [DisplayName] = ''''');
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'EmailConfirmed') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [EmailConfirmed] BIT NOT NULL DEFAULT 0;
    EXEC(N'UPDATE [prs].[prs_Users] SET [EmailConfirmed] = 1 WHERE [Role] = N''Admin'' OR [Username] IN (N''admin'', N''rytir_jan'', N''jan.kytyr@seznam.cz'')');
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'EmailConfirmationToken') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [EmailConfirmationToken] NVARCHAR(128) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'EmailConfirmationExpires') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [EmailConfirmationExpires] DATETIME2 NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'GoogleId') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [GoogleId] NVARCHAR(128) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'AuthProvider') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [AuthProvider] NVARCHAR(32) NOT NULL DEFAULT N'local';
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'AvatarUrl') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [AvatarUrl] NVARCHAR(512) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'GoogleId') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'IX_prs_Users_GoogleId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_prs_Users_GoogleId ON [prs].[prs_Users]([GoogleId]) WHERE [GoogleId] IS NOT NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'GamesPlayed') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [GamesPlayed] INT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'GamesWon') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [GamesWon] INT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'DragonsSlain') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [DragonsSlain] INT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'TotalHeartsEarned') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [TotalHeartsEarned] FLOAT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'HighestScore') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [HighestScore] FLOAT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'AchievementsJson') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [AchievementsJson] NVARCHAR(MAX) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_Users]', N'LastLoginAt') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [LastLoginAt] DATETIME2 NULL;
END

IF OBJECT_ID(N'[prs].[prs_Videos]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Videos]') AND name = 'LikesCount')
BEGIN
    ALTER TABLE [prs].[prs_Videos] ADD [LikesCount] INT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_Videos]', N'U') IS NOT NULL
BEGIN
    EXEC(N'UPDATE [prs].[prs_Videos] SET [VideoType] = ''youtube'' WHERE ([Url] LIKE ''%youtube.com%'' OR [Url] LIKE ''%youtu.be%'') AND [VideoType] <> ''youtube''');
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_Videos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [prs].[prs_Videos] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(128) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [VideoType] NVARCHAR(32) NOT NULL DEFAULT N'mp4',
        [Url] NVARCHAR(500) NOT NULL,
        [PosterUrl] NVARCHAR(500) NULL,
        [Category] NVARCHAR(64) NOT NULL DEFAULT N'trailer',
        [IsHeroActive] BIT NOT NULL DEFAULT 0,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_Audio]') AND type in (N'U'))
BEGIN
    CREATE TABLE [prs].[prs_Audio] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Title] NVARCHAR(128) NOT NULL,
        [Author] NVARCHAR(128) NULL,
        [AudioType] NVARCHAR(32) NOT NULL DEFAULT N'mp3',
        [Url] NVARCHAR(500) NOT NULL,
        [Category] NVARCHAR(64) NOT NULL DEFAULT N'bgm',
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_Announcements]') AND type in (N'U'))
BEGIN
    CREATE TABLE [prs].[prs_Announcements] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Message] NVARCHAR(500) NOT NULL,
        [LinkUrl] NVARCHAR(256) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF OBJECT_ID(N'[prs].[prs_UserSessions]', N'U') IS NULL
BEGIN
    CREATE TABLE [prs].[prs_UserSessions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [TokenHash] NVARCHAR(64) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ExpiresAt] DATETIME2 NOT NULL,
        [RevokedAt] DATETIME2 NULL,
        [UserAgent] NVARCHAR(256) NULL
    );
    CREATE UNIQUE INDEX [IX_prs_UserSessions_TokenHash] ON [prs].[prs_UserSessions]([TokenHash]);
    CREATE INDEX [IX_prs_UserSessions_UserId] ON [prs].[prs_UserSessions]([UserId]);
END

IF OBJECT_ID(N'[prs].[prs_GameSessions]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_GameSessions]', N'StateVersion') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_GameSessions] ADD [StateVersion] INT NOT NULL CONSTRAINT [DF_prs_GameSessions_StateVersion] DEFAULT 1;
END

IF OBJECT_ID(N'[prs].[prs_RoomChat]', N'U') IS NULL
BEGIN
    CREATE TABLE [prs].[prs_RoomChat] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [MessageId] NVARCHAR(16) NOT NULL,
        [RoomCode] NVARCHAR(16) NOT NULL,
        [PlayerIndex] INT NOT NULL DEFAULT 0,
        [Author] NVARCHAR(64) NOT NULL,
        [CrestId] NVARCHAR(32) NOT NULL DEFAULT N'lion',
        [CrestColor] NVARCHAR(32) NOT NULL DEFAULT N'gold',
        [MessageText] NVARCHAR(320) NOT NULL,
        [IsSystem] BIT NOT NULL DEFAULT 0,
        [TimestampMs] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX [IX_prs_RoomChat_RoomCode_Ts] ON [prs].[prs_RoomChat]([RoomCode], [TimestampMs] DESC);
END

IF OBJECT_ID(N'[prs].[prs_RoomEmotes]', N'U') IS NULL
BEGIN
    CREATE TABLE [prs].[prs_RoomEmotes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [EmoteId] NVARCHAR(16) NOT NULL,
        [RoomCode] NVARCHAR(16) NOT NULL,
        [PlayerIndex] INT NOT NULL DEFAULT 0,
        [Author] NVARCHAR(64) NOT NULL,
        [EmoteText] NVARCHAR(128) NOT NULL,
        [TimestampMs] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX [IX_prs_RoomEmotes_RoomCode_Ts] ON [prs].[prs_RoomEmotes]([RoomCode], [TimestampMs] DESC);
END", conn))
            {
                migCmd.ExecuteNonQuery();
            }

            // Bezpečná oprava a synchronizace výchozích českých textů pomocí parametrizovaného příkazu
            using (var seedCmd = new SqlCommand(@"
IF NOT EXISTS (SELECT 1 FROM [prs].[prs_Videos] WHERE [Id] = 1)
BEGIN
    INSERT INTO [prs].[prs_Videos] ([Title], [Description], [VideoType], [Url], [PosterUrl], [Category], [IsHeroActive], [SortOrder])
    VALUES (@vt, @vd, N'mp4', N'assets/video/RuzeProDanielku.mp4', N'assets/board/parchment_board_bg.jpg', N'trailer', 1, 10);
END
ELSE
BEGIN
    UPDATE [prs].[prs_Videos]
    SET [Title] = @vt, [Description] = @vd
    WHERE [Id] = 1 OR [Url] LIKE '%RuzeProDanielku%' OR [Title] LIKE '%Ã%' OR [Title] LIKE '%Å%' OR [Description] LIKE '%Ã%' OR [Description] LIKE '%Å%';
END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_Announcements] WHERE [Id] = 1)
BEGIN
    INSERT INTO [prs].[prs_Announcements] ([Message], [LinkUrl], [IsActive])
    VALUES (@am, N'#rules', 1);
END
ELSE
BEGIN
    UPDATE [prs].[prs_Announcements]
    SET [Message] = @am
    WHERE [Id] = 1 OR [Message] LIKE '%Ã%' OR [Message] LIKE '%Å%' OR [Message] LIKE '%kr%lovstv%';
END

UPDATE [prs].[prs_Users]
SET [DisplayName] = [Username]
WHERE [DisplayName] LIKE '%Ã%' OR [DisplayName] LIKE '%Å%';", conn))
            {
                seedCmd.Parameters.Add("@vt", SqlDbType.NVarChar, 128).Value = "Královská upoutávka (Růže pro Danielku)";
                seedCmd.Parameters.Add("@vd", SqlDbType.NVarChar, 500).Value = "Oficiální videopředstavení světa KiDesky a Princeznina srdce";
                seedCmd.Parameters.Add("@am", SqlDbType.NVarChar, 500).Value = "Vítejte v království KiDesky: Princeznino srdce! Otestujte své rytířské ctnosti v turnajích.";
                seedCmd.ExecuteNonQuery();
            }

            // Schéma a výchozí záznamy pro předdefinované a dynamické herní plány [prs].[prs_BoardTemplates]
            try
            {
                using (var tplMigCmd = new SqlCommand(@"
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND type in (N'U'))
BEGIN
    CREATE TABLE [prs].[prs_BoardTemplates] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [TemplateCode] NVARCHAR(50) NOT NULL UNIQUE,
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [NodeCount] INT NOT NULL DEFAULT 96,
        [GraphJson] NVARCHAR(MAX) NOT NULL DEFAULT N'{}',
        [RecipeJson] NVARCHAR(MAX) NULL,
        [Seed] INT NOT NULL DEFAULT 4598,
        [IsBuiltIn] BIT NOT NULL DEFAULT 0,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [SortOrder] INT NOT NULL DEFAULT 100,
        [CreatedBy] NVARCHAR(64) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'RecipeJson')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [RecipeJson] NVARCHAR(MAX) NULL;
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'Seed')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [Seed] INT NOT NULL DEFAULT 4598;
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'IsBuiltIn')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [IsBuiltIn] BIT NOT NULL DEFAULT 0;
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'IsActive')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [IsActive] BIT NOT NULL DEFAULT 1;
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'SortOrder')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [SortOrder] INT NOT NULL DEFAULT 100;
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'CreatedBy')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [CreatedBy] NVARCHAR(64) NULL;
END

IF OBJECT_ID(N'[prs].[prs_BoardTemplates]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND name = 'UpdatedAt')
BEGIN
    ALTER TABLE [prs].[prs_BoardTemplates] ADD [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME();
END", conn))
                {
                    tplMigCmd.ExecuteNonQuery();
                }

                using (var tplSeedCmd = new SqlCommand(@"
IF NOT EXISTS (SELECT 1 FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = N'classic_96')
BEGIN
    INSERT INTO [prs].[prs_BoardTemplates] ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy])
    VALUES (N'classic_96', @n1, @d1, 96, N'{}', @r1, 4598, 1, 1, 10, N'system');
END
ELSE
BEGIN
    UPDATE [prs].[prs_BoardTemplates] SET [Description] = @d1, [RecipeJson] = @r1, [UpdatedAt] = SYSUTCDATETIME() WHERE [TemplateCode] = N'classic_96' AND [IsBuiltIn] = 1;
END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = N'dragon_4598')
BEGIN
    INSERT INTO [prs].[prs_BoardTemplates] ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy])
    VALUES (N'dragon_4598', @n2, @d2, 64, N'{}', @r2, 4598, 1, 1, 20, N'system');
END
ELSE
BEGIN
    UPDATE [prs].[prs_BoardTemplates] SET [Description] = @d2, [RecipeJson] = @r2, [NodeCount] = 64, [UpdatedAt] = SYSUTCDATETIME() WHERE [TemplateCode] = N'dragon_4598' AND [IsBuiltIn] = 1;
END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = N'compact_48')
BEGIN
    INSERT INTO [prs].[prs_BoardTemplates] ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy])
    VALUES (N'compact_48', @n3, @d3, 48, N'{}', @r3, 4848, 1, 1, 30, N'system');
END
ELSE
BEGIN
    UPDATE [prs].[prs_BoardTemplates] SET [Description] = @d3, [RecipeJson] = @r3, [NodeCount] = 48, [Seed] = 4848, [UpdatedAt] = SYSUTCDATETIME() WHERE [TemplateCode] = N'compact_48' AND [IsBuiltIn] = 1;
END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = N'delta_84')
BEGIN
    INSERT INTO [prs].[prs_BoardTemplates] ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy])
    VALUES (N'delta_84', @n4, @d4, 84, N'{}', @r4, 8484, 1, 1, 25, N'system');
END
ELSE
BEGIN
    UPDATE [prs].[prs_BoardTemplates] SET [Description] = @d4, [RecipeJson] = @r4, [NodeCount] = 84, [Seed] = 8484, [UpdatedAt] = SYSUTCDATETIME() WHERE [TemplateCode] = N'delta_84' AND [IsBuiltIn] = 1;
END", conn))
                {
                    tplSeedCmd.Parameters.Add("@n1", SqlDbType.NVarChar, 100).Value = "Královská divočina 96 (Velký plán)";
                    tplSeedCmd.Parameters.Add("@d1", SqlDbType.NVarChar, 500).Value = "Klasická velká herní deska s 96+ poli, 4 vnitřními větvemi, horským přítokem, říční deltou a 12 sadami zvířat.";
                    tplSeedCmd.Parameters.Add("@r1", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5,6,7,8,9,10,11,12],\"villages\":10,\"towns\":5,\"castles\":3,\"jesters\":4,\"buildings\":5,\"questsU1\":4,\"questsU2\":3,\"questsU3\":2,\"masters\":7,\"merchants\":3,\"festivals\":3,\"chances\":5,\"taxes\":2,\"prisons\":1,\"hospitals\":1,\"taverns\":1,\"branches\":4,\"masterTier\":5,\"riverMode\":\"delta\",\"biomeTheme\":\"balanced\",\"royalCastle\":\"castle_royal\"}";

                    tplSeedCmd.Parameters.Add("@n2", SqlDbType.NVarChar, 100).Value = "Dračí stezka (Střední plán – 64 polí)";
                    tplSeedCmd.Parameters.Add("@d2", SqlDbType.NVarChar, 500).Value = "Středně velký královský plán se 64 poli, dvojitým říčním soutokem, dračím pohořím a 8 sadami zvířat.";
                    tplSeedCmd.Parameters.Add("@r2", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5,6,7,8],\"villages\":5,\"towns\":3,\"castles\":2,\"jesters\":2,\"buildings\":4,\"questsU1\":3,\"questsU2\":2,\"questsU3\":2,\"masters\":5,\"merchants\":2,\"festivals\":3,\"chances\":2,\"taxes\":1,\"prisons\":1,\"hospitals\":1,\"taverns\":1,\"branches\":2,\"masterTier\":5,\"riverMode\":\"dual\",\"biomeTheme\":\"dragon_peaks\",\"royalCastle\":\"castle_lava\"}";

                    tplSeedCmd.Parameters.Add("@n3", SqlDbType.NVarChar, 100).Value = "Rytířské kolbiště (Rychlá hra – 48 polí)";
                    tplSeedCmd.Parameters.Add("@d3", SqlDbType.NVarChar, 500).Value = "Kompaktní herní plán se 48 poli, říční deltou a 5 sadami zvířat pro svižné partie plné přímých střetů.";
                    tplSeedCmd.Parameters.Add("@r3", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5],\"villages\":4,\"towns\":2,\"castles\":2,\"jesters\":2,\"buildings\":3,\"questsU1\":2,\"questsU2\":1,\"questsU3\":1,\"masters\":4,\"merchants\":2,\"festivals\":3,\"chances\":2,\"taxes\":1,\"prisons\":1,\"hospitals\":1,\"taverns\":1,\"branches\":1,\"masterTier\":2,\"riverMode\":\"delta\",\"biomeTheme\":\"golden_plains\",\"royalCastle\":\"castle_wind\"}";

                    tplSeedCmd.Parameters.Add("@n4", SqlDbType.NVarChar, 100).Value = "Královská delta & Ostrovy (Plán – 84 polí)";
                    tplSeedCmd.Parameters.Add("@d4", SqlDbType.NVarChar, 500).Value = "Rozlehlá říční delta se 3 větvemi, 10 sadami zvířat, 3 hrady a bohatou vodní sítí.";
                    tplSeedCmd.Parameters.Add("@r4", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5,6,7,8,9,10],\"villages\":7,\"towns\":5,\"castles\":3,\"jesters\":3,\"buildings\":5,\"questsU1\":4,\"questsU2\":3,\"questsU3\":3,\"masters\":6,\"merchants\":3,\"festivals\":3,\"chances\":3,\"taxes\":2,\"prisons\":1,\"hospitals\":1,\"taverns\":1,\"branches\":3,\"masterTier\":5,\"riverMode\":\"delta\",\"biomeTheme\":\"river_delta\",\"royalCastle\":\"castle_water\"}";

                    tplSeedCmd.ExecuteNonQuery();
                }
            }
            catch { }

            using (var roleCmd = new SqlCommand("UPDATE [prs].[prs_Users] SET [Role] = N'Admin' WHERE [Username] IN (N'admin', N'rytir_jan', N'jan.kytyr@seznam.cz')", conn))
            {
                roleCmd.ExecuteNonQuery();
            }

            _extendedAdminSchemaChecked = true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Trace.TraceError("EnsureExtendedAdminSchema error: " + ex.ToString());
        }
    }

    protected void EnsureDisplayNameColumn(SqlConnection conn)
    {
        EnsureExtendedAdminSchema(conn);
    }

    protected void EnsureDatabaseSchema()

    {

        if (_schemaEnsured || !IsDbConfigured()) return;

        lock (_schemaLock)

        {

            if (_schemaEnsured) return;

            using (var conn = new SqlConnection(CONN_STR))

            {

                conn.Open();

                EnsureExtendedAdminSchema(conn);

                // Rychlá kontrola, zda schéma a hlavní tabulky již existují (ušetří DDL a PBKDF2 při studeném startu IIS)

                using (var fastCheck = new SqlCommand("SELECT CASE WHEN OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND OBJECT_ID(N'[prs].[prs_GameSessions]', N'U') IS NOT NULL AND OBJECT_ID(N'[prs].[prs_TelemetryLogs]', N'U') IS NOT NULL THEN 1 ELSE 0 END", conn))

                {

                    if (Convert.ToInt32(fastCheck.ExecuteScalar()) == 1)

                    {

                        EnsureSeedUsers(conn);

                        _schemaEnsured = true;

                        return;

                    }

                }

                // 1. Ensure schema [prs]

                string schemaSql = @"

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'prs')

BEGIN

    EXEC('CREATE SCHEMA [prs]');

END";

                using (var cmd = new SqlCommand(schemaSql, conn))

                {

                    cmd.ExecuteNonQuery();

                }

                // 2. Ensure tables [prs].[prs_*]

                string tablesSql = @"

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND type in (N'U'))

BEGIN

    CREATE TABLE [prs].[prs_Users] (

        [Id] INT IDENTITY(1,1) PRIMARY KEY,

        [Username] NVARCHAR(64) NOT NULL UNIQUE,

        [Email] NVARCHAR(128) NULL,

        [PasswordHash] NVARCHAR(128) NOT NULL,

        [Role] NVARCHAR(24) NOT NULL DEFAULT N'Player',

        [GamesPlayed] INT NOT NULL DEFAULT 0,

        [GamesWon] INT NOT NULL DEFAULT 0,

        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        [LastLoginAt] DATETIME2 NULL

    );

END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_GameConfigs]') AND type in (N'U'))

BEGIN

    CREATE TABLE [prs].[prs_GameConfigs] (

        [Id] INT IDENTITY(1,1) PRIMARY KEY,

        [GameCode] NVARCHAR(64) NOT NULL,

        [VersionName] NVARCHAR(64) NOT NULL,

        [IsActive] BIT NOT NULL DEFAULT 1,

        [ConfigJson] NVARCHAR(MAX) NOT NULL,

        [UpdatedBy] NVARCHAR(64) NULL,

        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()

    );

END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_BoardTemplates]') AND type in (N'U'))

BEGIN

    CREATE TABLE [prs].[prs_BoardTemplates] (

        [Id] INT IDENTITY(1,1) PRIMARY KEY,

        [TemplateCode] NVARCHAR(64) NOT NULL UNIQUE,

        [Name] NVARCHAR(128) NOT NULL,

        [Description] NVARCHAR(500) NULL,

        [NodeCount] INT NOT NULL DEFAULT 0,

        [GraphJson] NVARCHAR(MAX) NOT NULL,

        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()

    );

END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_GameSessions]') AND type in (N'U'))

BEGIN

    CREATE TABLE [prs].[prs_GameSessions] (

        [Id] INT IDENTITY(1,1) PRIMARY KEY,

        [SessionGuid] NVARCHAR(64) NOT NULL UNIQUE,

        [RoomCode] NVARCHAR(16) NOT NULL,

        [GameCode] NVARCHAR(64) NOT NULL DEFAULT N'princeznino_srdce',

        [TemplateCode] NVARCHAR(64) NOT NULL DEFAULT N'classic_96',

        [HostUsername] NVARCHAR(64) NOT NULL DEFAULT N'Guest',

        [Mode] NVARCHAR(32) NOT NULL DEFAULT N'Hotseat',

        [TargetHearts] FLOAT NOT NULL DEFAULT 30,

        [TurnTimeLimitSec] INT NULL,

        [Status] NVARCHAR(24) NOT NULL DEFAULT N'Active',

        [CurrentTurnPlayerIdx] INT NOT NULL DEFAULT 0,

        [TurnNumber] INT NOT NULL DEFAULT 1,

        [WinnerName] NVARCHAR(64) NULL,

        [StateJson] NVARCHAR(MAX) NOT NULL,

        [StateVersion] INT NOT NULL DEFAULT 1,

        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()

    );

    CREATE INDEX IX_prs_GameSessions_RoomCode ON [prs].[prs_GameSessions]([RoomCode]);

    CREATE INDEX IX_prs_GameSessions_UpdatedAt ON [prs].[prs_GameSessions]([UpdatedAt] DESC);

END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_SessionPlayers]') AND type in (N'U'))

BEGIN

    CREATE TABLE [prs].[prs_SessionPlayers] (

        [Id] INT IDENTITY(1,1) PRIMARY KEY,

        [SessionGuid] NVARCHAR(64) NOT NULL,

        [SlotIndex] INT NOT NULL,

        [PlayerType] NVARCHAR(32) NOT NULL,

        [Username] NVARCHAR(64) NULL,

        [DisplayName] NVARCHAR(64) NOT NULL,

        [Color] NVARCHAR(24) NOT NULL,

        [Hearts] FLOAT NOT NULL DEFAULT 0,

        [Gold] INT NOT NULL DEFAULT 10000

    );

    CREATE INDEX IX_prs_SessionPlayers_SessionGuid ON [prs].[prs_SessionPlayers]([SessionGuid]);

END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[prs].[prs_TelemetryLogs]') AND type in (N'U'))

BEGIN

    CREATE TABLE [prs].[prs_TelemetryLogs] (

        [Id] INT IDENTITY(1,1) PRIMARY KEY,

        [SessionGuid] NVARCHAR(64) NULL,

        [TurnNumber] INT NOT NULL DEFAULT 0,

        [EventType] NVARCHAR(64) NOT NULL,

        [PlayerName] NVARCHAR(64) NULL,

        [Message] NVARCHAR(500) NOT NULL,

        [PayloadJson] NVARCHAR(MAX) NULL,

        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()

    );

    CREATE INDEX IX_prs_TelemetryLogs_CreatedAt ON [prs].[prs_TelemetryLogs]([CreatedAt] DESC);

END

IF OBJECT_ID(N'[prs].[prs_UserSessions]', N'U') IS NULL
BEGIN
    CREATE TABLE [prs].[prs_UserSessions] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [TokenHash] NVARCHAR(64) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ExpiresAt] DATETIME2 NOT NULL,
        [RevokedAt] DATETIME2 NULL,
        [UserAgent] NVARCHAR(256) NULL
    );
    CREATE UNIQUE INDEX [IX_prs_UserSessions_TokenHash] ON [prs].[prs_UserSessions]([TokenHash]);
    CREATE INDEX [IX_prs_UserSessions_UserId] ON [prs].[prs_UserSessions]([UserId]);
END

IF OBJECT_ID(N'[prs].[prs_GameSessions]', N'U') IS NOT NULL AND COL_LENGTH(N'[prs].[prs_GameSessions]', N'StateVersion') IS NULL
BEGIN
    ALTER TABLE [prs].[prs_GameSessions] ADD [StateVersion] INT NOT NULL CONSTRAINT [DF_prs_GameSessions_StateVersion] DEFAULT 1;
END

IF OBJECT_ID(N'[prs].[prs_RoomChat]', N'U') IS NULL
BEGIN
    CREATE TABLE [prs].[prs_RoomChat] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [MessageId] NVARCHAR(16) NOT NULL,
        [RoomCode] NVARCHAR(16) NOT NULL,
        [PlayerIndex] INT NOT NULL DEFAULT 0,
        [Author] NVARCHAR(64) NOT NULL,
        [CrestId] NVARCHAR(32) NOT NULL DEFAULT N'lion',
        [CrestColor] NVARCHAR(32) NOT NULL DEFAULT N'gold',
        [MessageText] NVARCHAR(320) NOT NULL,
        [IsSystem] BIT NOT NULL DEFAULT 0,
        [TimestampMs] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX [IX_prs_RoomChat_RoomCode_Ts] ON [prs].[prs_RoomChat]([RoomCode], [TimestampMs] DESC);
END

IF OBJECT_ID(N'[prs].[prs_RoomEmotes]', N'U') IS NULL
BEGIN
    CREATE TABLE [prs].[prs_RoomEmotes] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [EmoteId] NVARCHAR(16) NOT NULL,
        [RoomCode] NVARCHAR(16) NOT NULL,
        [PlayerIndex] INT NOT NULL DEFAULT 0,
        [Author] NVARCHAR(64) NOT NULL,
        [EmoteText] NVARCHAR(128) NOT NULL,
        [TimestampMs] BIGINT NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX [IX_prs_RoomEmotes_RoomCode_Ts] ON [prs].[prs_RoomEmotes]([RoomCode], [TimestampMs] DESC);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'DisplayName')

BEGIN

    ALTER TABLE [prs].[prs_Users] ADD [DisplayName] NVARCHAR(64) NULL;

END";

                using (var cmd = new SqlCommand(tablesSql, conn))

                {

                    cmd.ExecuteNonQuery();

                }

                // 3. Seed default Admin, Demo Player & Jan Kytyr if not exists

                EnsureSeedUsers(conn);

            }

            _schemaEnsured = true;

        }

    }

    protected void EnsureSeedUsers(SqlConnection conn)

    {

        try

        {

            string adminHash = HashPassword("admin123");

            string seedUsersSql = @"

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_Users] WHERE [Username] = N'admin')

BEGIN

    INSERT INTO [prs].[prs_Users] ([Username], [Email], [PasswordHash], [Role])

    VALUES (N'admin', N'admin@ekobio.org', @AdminHash, N'Admin');

END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_Users] WHERE [Username] = N'rytir_jan')

BEGIN

    INSERT INTO [prs].[prs_Users] ([Username], [Email], [PasswordHash], [Role])

    VALUES (N'rytir_jan', N'jan@ekobio.org', @AdminHash, N'Player');

END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_Users] WHERE [Username] = N'jan.kytyr@seznam.cz' OR [Email] = N'jan.kytyr@seznam.cz')

BEGIN

    INSERT INTO [prs].[prs_Users] ([Username], [Email], [PasswordHash], [Role])

    VALUES (N'jan.kytyr@seznam.cz', N'jan.kytyr@seznam.cz', @AdminHash, N'Player');

END";

            using (var cmd = new SqlCommand(seedUsersSql, conn))

            {

                cmd.Parameters.AddWithValue("@AdminHash", adminHash);

                cmd.ExecuteNonQuery();

            }

        }

        catch { }

    }

    public void ProcessRequest(HttpContext context)
    {
        bool envelopeApplied = (context.Items["KiDesky.EnvelopeApplied"] is bool) && (bool)context.Items["KiDesky.EnvelopeApplied"];
        string action = (context.Request.QueryString["action"] ?? "status").ToLowerInvariant();

        if (!envelopeApplied)
        {
            context.Response.TrySkipIisCustomErrors = true;
            context.Response.ContentEncoding = Encoding.UTF8;
            context.Response.HeaderEncoding = Encoding.UTF8;
            context.Response.Charset = "utf-8";
            context.Response.ContentType = "application/json; charset=utf-8";

            string origin = context.Request.Headers["Origin"];
            if (IsAllowedOrigin(origin))
            {
                context.Response.Headers.Add("Access-Control-Allow-Origin", origin);
                context.Response.Headers.Add("Vary", "Origin");
            }
            context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-KiDesky-Auth, Authorization");
            context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

            if (context.Request.HttpMethod == "OPTIONS")
            {
                context.Response.StatusCode = 200;
                return;
            }

            context.Items["KiDesky.EnvelopeApplied"] = true;

            try
            {
                if (IsDbConfigured())
                {
                    EnsureDatabaseSchema();
                }
                DispatchAction(context, action);
            }
            catch (Exception ex)
            {
                string errorId = Guid.NewGuid().ToString("N").Substring(0, 8);
                System.Diagnostics.Trace.TraceError("KiDesky API error [" + errorId + "] action=" + action + ": " + ex.ToString());
                context.Response.StatusCode = 500;
                context.Response.Write(_json.Serialize(new
                {
                    ok = false,
                    status = "error",
                    message = "Došlo k interní chybě serveru.",
                    errorId = errorId,
                    timestamp = DateTime.UtcNow.ToString("o")
                }));
            }
        }
        else
        {
            DispatchAction(context, action);
        }
    }

    protected abstract void DispatchAction(HttpContext context, string action);

    public bool IsReusable { get { return false; } }
    }
}
