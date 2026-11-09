<%@ WebHandler Language="C#" Class="KiDeskyApiHandler" %>



using System;



using System.Collections.Generic;



using System.Data;



using System.Data.SqlClient;



using System.IO;



using System.Security.Cryptography;



using System.Text;



using System.Web;



using System.Web.Script.Serialization;
using System.Net;
using System.Net.Mail;



public class KiDeskyApiHandler : IHttpHandler



{



    // Dynamické načtení connection stringu z web.config / appsettings.json / produkčního MSSQL db4937

    public class RoomEmoteItem
    {
        public string id;
        public string code;
        public int playerIndex;
        public string author;
        public string emote;
        public long timestamp;
    }
    private static readonly Dictionary<string, List<RoomEmoteItem>> _roomEmotes = new Dictionary<string, List<RoomEmoteItem>>(StringComparer.OrdinalIgnoreCase);
    private static readonly object _emoteLock = new object();

    private static string _resolvedConnStr = null;



    private static string ExtractJsonConn(string json, string key)



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



    private static string CONN_STR



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



    private readonly JavaScriptSerializer _json = new JavaScriptSerializer { MaxJsonLength = 20 * 1024 * 1024 };



    private static bool _schemaEnsured = false;



    private static readonly object _schemaLock = new object();

    private static string SMTP_HOST = "smtp.forpsi.com";
    private static int SMTP_PORT = 587;
    private static string SMTP_USER = "scio@ekobio.org";
    private static string SMTP_PASS = "Awp3desert";
    private static bool SMTP_SSL = true;
    private static string SMTP_FROM = "scio@ekobio.org";
    private static string SMTP_FROM_NAME = "Princeznino srdce";
    private static string GOOGLE_CLIENT_ID = "335921016939-afepn3s6mpsep890pjr08bli6ufj0jub.apps.googleusercontent.com";

    private static bool SendConfirmationEmail(string recipientEmail, string recipientName, string token, out string error)
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

            using (var client = new SmtpClient(SMTP_HOST, SMTP_PORT))
            {
                client.EnableSsl = SMTP_SSL;
                client.UseDefaultCredentials = false;
                client.Credentials = new NetworkCredential(SMTP_USER, SMTP_PASS);
                client.DeliveryMethod = SmtpDeliveryMethod.Network;
                client.Timeout = 12000;

                string confirmUrl = "https://www.ekobio.org/apps/KiDesky/?confirmEmail=" + HttpUtility.UrlEncode(token);
                string safeName = string.IsNullOrEmpty(recipientName) ? "Rytíři" : recipientName;

                using (var msg = new MailMessage())
                {
                    msg.From = new MailAddress(SMTP_FROM, SMTP_FROM_NAME, Encoding.UTF8);
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



    public void ProcessRequest(HttpContext context)



    {



        context.Response.TrySkipIisCustomErrors = true;



        context.Response.ContentEncoding = Encoding.UTF8;



        context.Response.HeaderEncoding = Encoding.UTF8;



        context.Response.Charset = "utf-8";



        context.Response.ContentType = "application/json; charset=utf-8";



        context.Response.Headers.Add("Access-Control-Allow-Origin", "*");



        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-KiDesky-Auth");



        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");



        if (context.Request.HttpMethod == "OPTIONS")



        {



            context.Response.StatusCode = 200;



            return;



        }



        string action = (context.Request.QueryString["action"] ?? "status").ToLowerInvariant();



        try



        {



            if (IsDbConfigured())



            {



                EnsureDatabaseSchema();



            }



            switch (action)



            {



                case "hello":



                case "status":



                    HandleStatus(context);



                    break;



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



                case "admin-stats":
                    HandleAdminStats(context);
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
                case "list-videos":
                    HandleListVideos(context);
                    break;
                case "hero-video":
                    HandleGetHeroVideo(context);
                    break;

                case "like-video":

                    HandleLikeVideo(context);

                    break;
                case "upload-video":
                case "admin-upload-video":
                    HandleUploadVideo(context);
                    break;
                case "admin-save-video":
                    HandleAdminSaveVideo(context);
                    break;
                case "admin-delete-video":
                    HandleAdminDeleteVideo(context);
                    break;
                case "admin-set-hero-video":
                    HandleAdminSetHeroVideo(context);
                    break;
                case "list-audio":
                    HandleListAudio(context);
                    break;
                case "upload-audio":
                case "admin-upload-audio":
                    HandleUploadAudio(context);
                    break;
                case "admin-save-audio":
                    HandleAdminSaveAudio(context);
                    break;
                case "admin-delete-audio":
                    HandleAdminDeleteAudio(context);
                    break;
                case "get-announcement":
                    HandleGetAnnouncement(context);
                    break;
                case "admin-save-announcement":
                    HandleAdminSaveAnnouncement(context);
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
                case "send-emote":
                    HandleSendEmote(context);
                    break;
                case "record-game-stats":
                    HandleRecordGameStats(context);
                    break;
                case "list-board-templates":
                    HandleListBoardTemplates(context);
                    break;
                case "get-board-template":
                    HandleGetBoardTemplate(context);
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



                    HandleStatus(context);



                    break;



            }



        }



        catch (Exception ex)



        {



            context.Response.StatusCode = 500;



            context.Response.Write(_json.Serialize(new



            {



                status = "error",



                message = ex.Message,



                timestamp = DateTime.UtcNow.ToString("o")



            }));



        }



    }



    private bool IsDbConfigured()



    {



        return !string.IsNullOrEmpty(CONN_STR) && !CONN_STR.Contains("YOUR_SERVER") && !CONN_STR.Contains("__DB_" + "CONN_STRING__");



    }



    private static string HashPassword(string password)



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



    private static bool VerifyPassword(string password, string storedHash)



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



    private Dictionary<string, object> ReadJsonBody(HttpContext context)



    {



        using (var reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))



        {



            string body = reader.ReadToEnd();



            if (string.IsNullOrWhiteSpace(body)) return new Dictionary<string, object>();



            return _json.Deserialize<Dictionary<string, object>>(body) ?? new Dictionary<string, object>();



        }



    }



    private string GetStr(Dictionary<string, object> dict, string key, string defVal = "")



    {



        if (dict != null && dict.ContainsKey(key) && dict[key] != null)



            return dict[key].ToString();



        return defVal;



    }



    private int GetInt(Dictionary<string, object> dict, string key, int defVal = 0)



    {



        if (dict != null && dict.ContainsKey(key) && dict[key] != null)



        {



            int val;



            if (int.TryParse(dict[key].ToString(), out val)) return val;



        }



        return defVal;



    }



    private bool GetBool(Dictionary<string, object> dict, string key, bool defVal = false)

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



    private static bool _extendedAdminSchemaChecked = false;
    private void EnsureExtendedAdminSchema(SqlConnection conn)
    {
        if (_extendedAdminSchemaChecked) return;
        try
        {
            using (var migCmd = new SqlCommand(@"
IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'DisplayName')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [DisplayName] NVARCHAR(64) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'IsActive')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [IsActive] BIT NOT NULL DEFAULT 1;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'Credits')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [Credits] INT NOT NULL DEFAULT 250;
    EXEC(N'UPDATE [prs].[prs_Users] SET [Credits] = 2500 WHERE [Role] = N''Admin'' OR [Username] = N''rytir_jan''');
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'SelectedPawnId')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [SelectedPawnId] NVARCHAR(64) NOT NULL DEFAULT N'knight_valiant';
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'UnlockedPawnsJson')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [UnlockedPawnsJson] NVARCHAR(MAX) NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL
BEGIN
    EXEC(N'UPDATE [prs].[prs_Users] SET [DisplayName] = [Username] WHERE [DisplayName] IS NULL OR [DisplayName] = ''''');
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'EmailConfirmed')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [EmailConfirmed] BIT NOT NULL DEFAULT 0;
    ALTER TABLE [prs].[prs_Users] ADD [EmailConfirmationToken] NVARCHAR(128) NULL;
    ALTER TABLE [prs].[prs_Users] ADD [EmailConfirmationExpires] DATETIME2 NULL;
    ALTER TABLE [prs].[prs_Users] ADD [GoogleId] NVARCHAR(128) NULL;
    ALTER TABLE [prs].[prs_Users] ADD [AuthProvider] NVARCHAR(32) NOT NULL DEFAULT N'local';
    ALTER TABLE [prs].[prs_Users] ADD [AvatarUrl] NVARCHAR(512) NULL;
    EXEC(N'UPDATE [prs].[prs_Users] SET [EmailConfirmed] = 1 WHERE [Role] = N''Admin'' OR [Username] IN (N''admin'', N''rytir_jan'', N''jan.kytyr@seznam.cz'')');
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'IX_prs_Users_GoogleId')
BEGIN
    CREATE NONCLUSTERED INDEX IX_prs_Users_GoogleId ON [prs].[prs_Users]([GoogleId]) WHERE [GoogleId] IS NOT NULL;
END

IF OBJECT_ID(N'[prs].[prs_Users]', N'U') IS NOT NULL AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[prs].[prs_Users]') AND name = 'GamesPlayed')
BEGIN
    ALTER TABLE [prs].[prs_Users] ADD [GamesPlayed] INT NOT NULL DEFAULT 0;
    ALTER TABLE [prs].[prs_Users] ADD [GamesWon] INT NOT NULL DEFAULT 0;
    ALTER TABLE [prs].[prs_Users] ADD [DragonsSlain] INT NOT NULL DEFAULT 0;
    ALTER TABLE [prs].[prs_Users] ADD [TotalHeartsEarned] FLOAT NOT NULL DEFAULT 0;
    ALTER TABLE [prs].[prs_Users] ADD [HighestScore] FLOAT NOT NULL DEFAULT 0;
    ALTER TABLE [prs].[prs_Users] ADD [AchievementsJson] NVARCHAR(MAX) NULL;
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

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = N'dragon_4598')
BEGIN
    INSERT INTO [prs].[prs_BoardTemplates] ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy])
    VALUES (N'dragon_4598', @n2, @d2, 64, N'{}', @r2, 4598, 1, 1, 20, N'system');
END

IF NOT EXISTS (SELECT 1 FROM [prs].[prs_BoardTemplates] WHERE [TemplateCode] = N'compact_48')
BEGIN
    INSERT INTO [prs].[prs_BoardTemplates] ([TemplateCode], [Name], [Description], [NodeCount], [GraphJson], [RecipeJson], [Seed], [IsBuiltIn], [IsActive], [SortOrder], [CreatedBy])
    VALUES (N'compact_48', @n3, @d3, 48, N'{}', @r3, 4598, 1, 1, 30, N'system');
END", conn))
                {
                    tplSeedCmd.Parameters.Add("@n1", SqlDbType.NVarChar, 100).Value = "Královská divočina 96 (Velký plán)";
                    tplSeedCmd.Parameters.Add("@d1", SqlDbType.NVarChar, 500).Value = "Klasická velká herní deska s 96 poli, 4 vnitřními větvemi a 12 chovnými sadami zvířat.";
                    tplSeedCmd.Parameters.Add("@r1", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5,6,7,8,9,10,11,12],\"villages\":10,\"towns\":5,\"castles\":3,\"jesters\":4,\"buildings\":5,\"questsU1\":4,\"questsU2\":3,\"questsU3\":2,\"masters\":7,\"merchants\":3,\"festivals\":3,\"chances\":6,\"taxes\":2,\"prisons\":1,\"hospitals\":1,\"taverns\":0,\"branches\":4}";

                    tplSeedCmd.Parameters.Add("@n2", SqlDbType.NVarChar, 100).Value = "Dračí stezka (Střední plán – 64 polí)";
                    tplSeedCmd.Parameters.Add("@d2", SqlDbType.NVarChar, 500).Value = "Středně velký královský plán se 64 poli, řekou Doubravkou a 8 sadami zvířat.";
                    tplSeedCmd.Parameters.Add("@r2", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5,6,7,8],\"villages\":7,\"towns\":4,\"castles\":2,\"jesters\":3,\"buildings\":4,\"questsU1\":3,\"questsU2\":2,\"questsU3\":2,\"masters\":5,\"merchants\":2,\"festivals\":2,\"chances\":4,\"taxes\":1,\"prisons\":1,\"hospitals\":1,\"taverns\":0,\"branches\":2}";

                    tplSeedCmd.Parameters.Add("@n3", SqlDbType.NVarChar, 100).Value = "Rytířské kolbiště (Rychlá hra – 48 polí)";
                    tplSeedCmd.Parameters.Add("@d3", SqlDbType.NVarChar, 500).Value = "Kompaktní herní plán s 48 poli pro svižnější partie plné přímých střetů.";
                    tplSeedCmd.Parameters.Add("@r3", SqlDbType.NVarChar, -1).Value = "{\"animalLevels\":[1,2,3,4,5,6],\"villages\":5,\"towns\":3,\"castles\":2,\"jesters\":2,\"buildings\":3,\"questsU1\":2,\"questsU2\":2,\"questsU3\":1,\"masters\":4,\"merchants\":2,\"festivals\":2,\"chances\":3,\"taxes\":1,\"prisons\":1,\"hospitals\":1,\"taverns\":0,\"branches\":1}";

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
        catch { }
    }

    private void EnsureDisplayNameColumn(SqlConnection conn)
    {
        EnsureExtendedAdminSchema(conn);
    }



    private void EnsureDatabaseSchema()



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



    private void EnsureSeedUsers(SqlConnection conn)



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



    private void HandleStatus(HttpContext context)



    {



        bool dbConnected = false;



        string dbError = null;



        int usersCount = 0;



        int sessionsCount = 0;



        int configsCount = 0;



        int logsCount = 0;



        if (IsDbConfigured())



        {



            try



            {



                using (var conn = new SqlConnection(CONN_STR))



                {



                    conn.Open();



                    using (var cmd = new SqlCommand(@"



                        SELECT 



                            (SELECT COUNT(*) FROM [prs].[prs_Users]) AS UsersCount,



                            (SELECT COUNT(*) FROM [prs].[prs_GameSessions]) AS SessionsCount,



                            (SELECT COUNT(*) FROM [prs].[prs_GameConfigs]) AS ConfigsCount,



                            (SELECT COUNT(*) FROM [prs].[prs_TelemetryLogs]) AS LogsCount", conn))



                    using (var r = cmd.ExecuteReader())



                    {



                        if (r.Read())



                        {



                            usersCount = Convert.ToInt32(r["UsersCount"]);



                            sessionsCount = Convert.ToInt32(r["SessionsCount"]);



                            configsCount = Convert.ToInt32(r["ConfigsCount"]);



                            logsCount = Convert.ToInt32(r["LogsCount"]);



                            dbConnected = true;



                        }



                    }



                }



            }



            catch (Exception ex)



            {



                dbConnected = false;



                dbError = ex.Message;



            }



        }



        else



        {



            dbError = "IsDbConfigured returned false";



        }



        context.Response.Write(_json.Serialize(new



        {



            ok = true,



            status = "success",



            project = "KiDesky \u2013 Princeznino srdce",



            schema = "prs (prefix prs_)",



            dbConnected = dbConnected,



            dbError = dbError,



            usersCount = usersCount,



            sessionsCount = sessionsCount,



            configsCount = configsCount,



            telemetryCount = logsCount,



            serverTime = DateTime.UtcNow.ToString("o")



        }));



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
            bool isAdmin = username.ToLowerInvariant().StartsWith("admin") || email.Equals("jan.kytyr@seznam.cz", StringComparison.OrdinalIgnoreCase);
            string role = isAdmin ? "Admin" : "Guest";
            bool isConfirmed = isAdmin;
            string confirmationToken = Guid.NewGuid().ToString("N");
            DateTime tokenExpires = DateTime.UtcNow.AddHours(48);
            string defaultPawns = @"[""knight_valiant"",""knight_tourney"",""lady_huntress"",""lord_diplomat"",""knight_warden"",""lady_sorceress""]";
            int initialCredits = isAdmin ? 2500 : 250;

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
            bool emailSent = false;
            if (!isConfirmed)
            {
                emailSent = SendConfirmationEmail(email, displayName, confirmationToken, out mailErr);
            }

            string msg = isAdmin
                ? "Administrátorský účet byl úspěšně vytvořen."
                : (emailSent
                    ? ("Registrace proběhla úspěšně! Na e-mail " + email + " byl odeslán potvrzovací odkaz. Do jeho potvrzení můžeš hrát v režimu Hosta.")
                    : "Účet byl vytvořen, ale nepodařilo se odeslat potvrzovací e-mail. Můžeš hrát v režimu Hosta a potvrzení si poslat znovu z profilu.");

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                message = msg,
                emailSent = emailSent,
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

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                message = "E-mail byl úspěšně potvrzen! Vítej v království jako plnohodnotný rytíř.",
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

        // 1. Přímé dekódování podepsaného JWT payloadu z tokenu (bez závislosti na odchozím síťovém volání)
        try
        {
            string[] jwtParts = credential.Split('.');
            if (jwtParts.Length >= 2)
            {
                string payloadBase64 = jwtParts[1].Replace('-', '+').Replace('_', '/');
                switch (payloadBase64.Length % 4)
                {
                    case 2: payloadBase64 += "=="; break;
                    case 3: payloadBase64 += "="; break;
                }
                byte[] payloadBytes = Convert.FromBase64String(payloadBase64);
                string payloadJson = Encoding.UTF8.GetString(payloadBytes);
                var tokenDict = _json.Deserialize<Dictionary<string, object>>(payloadJson);
                if (tokenDict != null)
                {
                    if (tokenDict.ContainsKey("sub") && tokenDict["sub"] != null) googleId = tokenDict["sub"].ToString();
                    if (tokenDict.ContainsKey("email") && tokenDict["email"] != null) email = tokenDict["email"].ToString();
                    if (tokenDict.ContainsKey("name") && tokenDict["name"] != null) name = tokenDict["name"].ToString();
                    if (tokenDict.ContainsKey("picture") && tokenDict["picture"] != null) picture = tokenDict["picture"].ToString();

                    // Základní bezpečnostní kontrola issueru a audience
                    string iss = tokenDict.ContainsKey("iss") && tokenDict["iss"] != null ? tokenDict["iss"].ToString() : "";
                    string aud = tokenDict.ContainsKey("aud") && tokenDict["aud"] != null ? tokenDict["aud"].ToString() : "";
                    if (!iss.Contains("accounts.google.com") && !iss.Contains("google.com"))
                    {
                        googleId = null; // Neplatný vydavatel
                    }
                    if (!string.IsNullOrEmpty(aud) && !aud.StartsWith("335921016939-", StringComparison.OrdinalIgnoreCase))
                    {
                        googleId = null; // Neplatná cílová aplikace
                    }
                }
            }
        }
        catch { }

        // 2. Fallback: pokud přímé dekódování selhalo, dotážeme se Google tokeninfo endpointu
        if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
        {
            try
            {
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12 | SecurityProtocolType.Tls11 | SecurityProtocolType.Tls;
                using (var wc = new WebClient())
                {
                    wc.Headers[HttpRequestHeader.UserAgent] = "KiDesky-App/1.0";
                    wc.Encoding = Encoding.UTF8;
                    string tokenInfoJson = wc.DownloadString("https://oauth2.googleapis.com/tokeninfo?id_token=" + HttpUtility.UrlEncode(credential));
                    var tokenInfo = _json.Deserialize<Dictionary<string, object>>(tokenInfoJson);
                    if (tokenInfo != null)
                    {
                        if (tokenInfo.ContainsKey("sub")) googleId = tokenInfo["sub"].ToString();
                        if (tokenInfo.ContainsKey("email")) email = tokenInfo["email"].ToString();
                        if (tokenInfo.ContainsKey("name")) name = tokenInfo["name"].ToString();
                        if (tokenInfo.ContainsKey("picture")) picture = tokenInfo["picture"].ToString();
                    }
                }
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = 200;
                context.Response.Write(_json.Serialize(new { ok = false, message = "Ověření Google účtu selhalo: " + ex.Message }));
                return;
            }
        }

        if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
        {
            context.Response.StatusCode = 200;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatný Google token (chybí ID nebo e-mail uživatele)." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            int userId = 0;
            string username = null;
            string currentRole = null;
            string currentDisplayName = null;
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
                SELECT [Id], [Username], [Email], [Role], [DisplayName], [Credits], [SelectedPawnId], [UnlockedPawnsJson]
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
                        username = r["Username"].ToString();
                        currentRole = r["Role"].ToString();
                        currentDisplayName = r["DisplayName"] == DBNull.Value ? username : r["DisplayName"].ToString();
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

            bool isAdminEmail = email.Equals("jan.kytyr@seznam.cz", StringComparison.OrdinalIgnoreCase) ||
                               email.Equals("lordkikin@gmail.com", StringComparison.OrdinalIgnoreCase) ||
                               email.StartsWith("admin@", StringComparison.OrdinalIgnoreCase) ||
                               (username != null && username.Equals("admin", StringComparison.OrdinalIgnoreCase));

            string effectiveDisplayName = !string.IsNullOrEmpty(reqDisplayName)
                ? reqDisplayName
                : (!string.IsNullOrEmpty(currentDisplayName) && currentDisplayName != "Host" && !currentDisplayName.Contains("@")
                    ? currentDisplayName 
                    : (!string.IsNullOrEmpty(name) ? name : email.Split('@')[0]));

            if (userId > 0)
            {
                string targetRole = isAdminEmail ? "Admin" : ((currentRole == "Guest") ? "Player" : currentRole);
                int targetCredits = isAdminEmail ? Math.Max(credits, 2500) : credits;

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

                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    message = "Prihlaseni pres Google probehlo uspesne.",
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
            string targetNewRole = isAdminEmail ? "Admin" : "Player";
            int newCredits = (targetNewRole == "Admin") ? 2500 : 250;
            string defaultUnlocked = @"[""knight_valiant"",""knight_tourney"",""lady_huntress"",""lord_diplomat"",""knight_warden"",""lady_sorceress""]";
            string newUsername = email.Split('@')[0].Replace(".", "_").Replace("-", "_");
            if (newUsername.Length < 3) newUsername = "player_" + (googleId.Length > 6 ? googleId.Substring(0, 6) : googleId);

            using (var unCheck = new SqlCommand("SELECT COUNT(*) FROM [prs].[prs_Users] WHERE [Username] = @u", conn))
            {
                unCheck.Parameters.AddWithValue("@u", newUsername);
                if (Convert.ToInt32(unCheck.ExecuteScalar()) > 0)
                {
                    newUsername = newUsername + "_" + (new Random()).Next(100, 999);
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

            context.Response.Write(_json.Serialize(new
            {
                ok = true,
                status = "success",
                message = "Vitej! Ucet pres Google byl uspesne vytvoren.",
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



        var body = ReadJsonBody(context);



        string username = GetStr(body, "username").Trim();



        string nickname = GetStr(body, "displayName").Trim();



        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(nickname))



        {



            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné parametry." }));



            return;



        }



        using (var conn = new SqlConnection(CONN_STR))



        {



            conn.Open();



            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_Users] SET [DisplayName] = @d WHERE [Username] = @u OR [Email] = @u", conn))



            {



                cmd.Parameters.AddWithValue("@d", nickname);



                cmd.Parameters.AddWithValue("@u", username);



                cmd.ExecuteNonQuery();



            }



        }



        context.Response.Write(_json.Serialize(new { ok = true, displayName = nickname }));



    }

    private void HandleSaveUserPawn(HttpContext context)
    {
        var body = ReadJsonBody(context);
        string username = GetStr(body, "username").Trim();
        string pawnId = GetStr(body, "selectedPawnId", "knight_valiant").Trim();
        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(pawnId))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné parametry." }));
            return;
        }
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("UPDATE [prs].[prs_Users] SET [SelectedPawnId] = @p WHERE [Username] = @u OR [Email] = @u", conn))
            {
                cmd.Parameters.AddWithValue("@p", pawnId);
                cmd.Parameters.AddWithValue("@u", username);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", selectedPawnId = pawnId }));
    }

    private void HandleAwardCredits(HttpContext context)
    {
        var body = ReadJsonBody(context);
        string username = GetStr(body, "username").Trim();
        int amount = GetInt(body, "amount", 0);
        bool isWin = GetBool(body, "isWin", false);
        if (string.IsNullOrEmpty(username) || amount <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné parametry." }));
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
                WHERE [Username] = @u OR [Email] = @u;
                SELECT [Credits] FROM [prs].[prs_Users] WHERE [Username] = @u OR [Email] = @u;
            ", conn))
            {
                cmd.Parameters.AddWithValue("@amt", amount);
                cmd.Parameters.AddWithValue("@isWin", isWin ? 1 : 0);
                cmd.Parameters.AddWithValue("@u", username);
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
        var body = ReadJsonBody(context);
        string username = GetStr(body, "username").Trim();
        string pawnId = GetStr(body, "pawnId").Trim();
        int price = GetInt(body, "priceCredits", 150);
        if (price < 0) price = 0;

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(pawnId))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné parametry." }));
            return;
        }

        int curCredits = 250;
        string unlockedJson = "[\"knight_valiant\",\"knight_tourney\",\"lady_huntress\",\"lord_diplomat\",\"knight_warden\",\"lady_sorceress\"]";

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("SELECT [Credits], [UnlockedPawnsJson] FROM [prs].[prs_Users] WHERE [Username] = @u OR [Email] = @u", conn))
            {
                cmd.Parameters.AddWithValue("@u", username);
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
                    context.Response.Write(_json.Serialize(new { ok = false, message = "Nedostatek kreditů na účtu." }));
                    return;
                }
                curCredits -= price;
                unlockedList.Add(pawnId);
            }

            string newUnlockedJson = _json.Serialize(unlockedList);
            using (var upd = new SqlCommand("UPDATE [prs].[prs_Users] SET [Credits] = @c, [UnlockedPawnsJson] = @uJson, [SelectedPawnId] = @p WHERE [Username] = @u OR [Email] = @u", conn))
            {
                upd.Parameters.AddWithValue("@c", curCredits);
                upd.Parameters.AddWithValue("@uJson", newUnlockedJson);
                upd.Parameters.AddWithValue("@p", pawnId);
                upd.Parameters.AddWithValue("@u", username);
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

    private void HandleSendEmote(HttpContext context)
    {
        string code = (context.Request.QueryString["code"] ?? "").Trim().ToUpperInvariant();
        string playerIdxStr = context.Request.QueryString["playerIdx"] ?? "0";
        int playerIdx = 0;
        int.TryParse(playerIdxStr, out playerIdx);
        string emote = context.Request.QueryString["emote"] ?? "";
        string author = context.Request.QueryString["author"] ?? "";
        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(emote))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Missing code or emote" }));
            return;
        }
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
        lock (_emoteLock)
        {
            if (!_roomEmotes.ContainsKey(code)) _roomEmotes[code] = new List<RoomEmoteItem>();
            var list = _roomEmotes[code];
            list.Add(item);
            if (list.Count > 15) list.RemoveRange(0, list.Count - 15);
        }
        context.Response.Write(_json.Serialize(new { ok = true, emote = item }));
    }

    private void HandleRecordGameStats(HttpContext context)
    {
        var body = ReadJsonBody(context);
        string username = GetStr(body, "username").Trim();
        bool isWin = GetBool(body, "isWin", false);
        double hearts = 0;
        double.TryParse(GetStr(body, "hearts"), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out hearts);
        int dragons = GetInt(body, "dragons", 0);
        int castles = GetInt(body, "castles", 0);
        int herds = GetInt(body, "herds", 0);
        double festHearts = 0;
        double.TryParse(GetStr(body, "festivalHearts"), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out festHearts);

        if (string.IsNullOrEmpty(username))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Missing username" }));
            return;
        }

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
                WHERE [Username] = @u OR [Email] = @u", conn))
            {
                cmd.Parameters.AddWithValue("@u", username);
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
                WHERE [Username] = @u OR [Email] = @u", conn))
            {
                upd.Parameters.AddWithValue("@gp", played);
                upd.Parameters.AddWithValue("@gw", won);
                upd.Parameters.AddWithValue("@ds", totalDragons);
                upd.Parameters.AddWithValue("@th", totalHearts);
                upd.Parameters.AddWithValue("@hs", highestScore);
                upd.Parameters.AddWithValue("@aj", newAchJson);
                upd.Parameters.AddWithValue("@u", username);
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

                    SELECT [Id], [Username], [Email], [Role], [DisplayName], [PasswordHash], [GamesPlayed], [GamesWon], [Credits], [SelectedPawnId], [UnlockedPawnsJson]

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



                        context.Response.Write(_json.Serialize(new
                        {
                            ok = true,
                            status = "success",
                            user = new { id = id, username = u, displayName = dn, role = role, email = userEmail, emailConfirmed = emailConfirmed, avatarUrl = avatarUrl, authProvider = authProvider, gamesPlayed = gp, gamesWon = gw, dragonsSlain = ds, totalHeartsEarned = Math.Round(th, 1), highestScore = Math.Round(hs, 1), achievementsJson = ach, credits = credits, selectedPawnId = selectedPawnId, unlockedPawnsJson = unlockedPawnsJson }
                        }));



                        return;



                    }



                }



            }






        context.Response.StatusCode = 401;



        context.Response.Write(_json.Serialize(new { ok = false, status = "error", error = "Neplatn\u00e9 jm\u00e9no nebo heslo.", message = "Neplatn\u00e9 jm\u00e9no nebo heslo." }));



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



        var body = ReadJsonBody(context);



        string gameCode = GetStr(body, "gameCode", "princeznino_srdce");



        string versionName = GetStr(body, "versionName", "v1.0-custom");



        string configJson = GetStr(body, "configJson", "{}");



        string updatedBy = GetStr(body, "updatedBy", "admin");



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

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();

            bool isNewSession = false;
            using (var chkNew = new SqlCommand("SELECT COUNT(*) FROM [prs].[prs_GameSessions] WHERE [SessionGuid] = @g", conn))
            {
                chkNew.Parameters.AddWithValue("@g", sessionGuid);
                isNewSession = (Convert.ToInt32(chkNew.ExecuteScalar()) == 0);
            }

            if (isNewSession && (string.IsNullOrEmpty(hostUsername) || hostUsername.Equals("Guest", StringComparison.OrdinalIgnoreCase) || hostUsername.Equals("Host", StringComparison.OrdinalIgnoreCase)))
            {
                context.Response.StatusCode = 403;
                context.Response.Write(_json.Serialize(new
                {
                    ok = false,
                    status = "forbidden",
                    message = "Zalozit novou online mistnost mohou pouze prihlaseni rytiri. Jako Host se muzes pripojit ke stolu pres kod."
                }));
                return;
            }

            // 2.2 Optimistický zámek proti race conditions v online multiplayeru



            if (expectedTurn >= 0)



            {



                using (var chk = new SqlCommand("SELECT [TurnNumber], [StateJson] FROM [prs].[prs_GameSessions] WHERE [SessionGuid] = @chkGuid", conn))



                {



                    chk.Parameters.AddWithValue("@chkGuid", sessionGuid);



                    using (var rdr = chk.ExecuteReader())



                    {



                        if (rdr.Read())



                        {



                            int dbTurn = Convert.ToInt32(rdr["TurnNumber"]);



                            if (dbTurn > expectedTurn)



                            {



                                string dbState = rdr["StateJson"] != DBNull.Value ? rdr["StateJson"].ToString() : null;



                                context.Response.StatusCode = 409;



                                context.Response.Write(_json.Serialize(new



                                {



                                    ok = false,



                                    status = "conflict",



                                    error = "turn_conflict",



                                    message = "Tento tah ji\u017e byl odehr\u00e1n jin\u00fdm hr\u00e1\u010dem. Synchronizuji aktu\u00e1ln\u00ed stav hry.",



                                    serverTurnNumber = dbTurn,



                                    sessionGuid = sessionGuid,



                                    stateJson = dbState



                                }));



                                return;



                            }



                        }



                    }



                }



            }



            using (var cmd = new SqlCommand(@"



                IF EXISTS (SELECT 1 FROM [prs].[prs_GameSessions] WHERE [SessionGuid] = @guid)



                BEGIN



                    UPDATE [prs].[prs_GameSessions]



                    SET [Status] = @status,



                        [CurrentTurnPlayerIdx] = @turnIdx,



                        [TurnNumber] = @turnNum,



                        [WinnerName] = @winner,



                        [StateJson] = @state,



                        [UpdatedAt] = SYSUTCDATETIME()



                    WHERE [SessionGuid] = @guid;



                END



                ELSE



                BEGIN



                    INSERT INTO [prs].[prs_GameSessions]



                        ([SessionGuid], [RoomCode], [TemplateCode], [HostUsername], [Mode], [TargetHearts], [Status], [CurrentTurnPlayerIdx], [TurnNumber], [WinnerName], [StateJson])



                    VALUES



                        (@guid, @room, @tpl, @host, @mode, @target, @status, @turnIdx, @turnNum, @winner, @state);



                END", conn))



            {



                cmd.Parameters.AddWithValue("@guid", sessionGuid);



                cmd.Parameters.AddWithValue("@room", roomCode);



                cmd.Parameters.AddWithValue("@tpl", templateCode);



                cmd.Parameters.AddWithValue("@host", hostUsername);



                cmd.Parameters.AddWithValue("@mode", mode);



                cmd.Parameters.AddWithValue("@target", targetHearts);



                cmd.Parameters.AddWithValue("@status", status);



                cmd.Parameters.AddWithValue("@turnIdx", currentTurnIdx);



                cmd.Parameters.AddWithValue("@turnNum", turnNumber);



                cmd.Parameters.AddWithValue("@winner", (object)winnerName ?? DBNull.Value);



                cmd.Parameters.AddWithValue("@state", stateJson);



                cmd.ExecuteNonQuery();



            }



        }



        context.Response.Write(_json.Serialize(new



        {



            ok = true,



            status = "success",



            sessionGuid = sessionGuid,



            roomCode = roomCode,



            savedAt = DateTime.UtcNow.ToString("o")



        }));



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



        string guid = context.Request.QueryString["guid"] ?? "";



        string room = context.Request.QueryString["room"] ?? context.Request.QueryString["code"] ?? "";



        if (string.IsNullOrEmpty(guid)) guid = room;



        using (var conn = new SqlConnection(CONN_STR))



        {



            conn.Open();



            using (var cmd = new SqlCommand(@"



                SELECT TOP 1 [SessionGuid], [RoomCode], [TurnNumber], [CurrentTurnPlayerIdx], [Status], [WinnerName], [UpdatedAt]



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



                        List<RoomEmoteItem> recentEmotes = new List<RoomEmoteItem>();
                        lock (_emoteLock)
                        {
                            string lookupCode = !string.IsNullOrEmpty(room) ? room : guid;
                            if (!string.IsNullOrEmpty(lookupCode) && _roomEmotes.ContainsKey(lookupCode))
                            {
                                long nowMs = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
                                recentEmotes = _roomEmotes[lookupCode].FindAll(e => (nowMs - e.timestamp) < 25000);
                            }
                        }

                        var checkObj = new
                        {
                            ok = true,
                            status = "success",
                            sessionGuid = r["SessionGuid"].ToString(),
                            roomCode = r["RoomCode"].ToString(),
                            turnNumber = Convert.ToInt32(r["TurnNumber"]),
                            currentPlayerIndex = Convert.ToInt32(r["CurrentTurnPlayerIdx"]),
                            gameStatus = r["Status"].ToString(),
                            winnerName = r["WinnerName"] == DBNull.Value ? null : r["WinnerName"].ToString(),
                            updatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("o"),
                            emotes = recentEmotes
                        };



                        context.Response.Write(_json.Serialize(checkObj));



                        return;



                    }



                }



            }



        }



        context.Response.StatusCode = 404;



        context.Response.Write(_json.Serialize(new { ok = false, status = "error", message = "Ulo\u017een\u00e1 hra nebyla nalezena." }));



    }



    private void HandleLoadSession(HttpContext context)



    {



        string guid = context.Request.QueryString["guid"] ?? "";



        string room = context.Request.QueryString["room"] ?? context.Request.QueryString["code"] ?? "";



        if (string.IsNullOrEmpty(guid)) guid = room;



        using (var conn = new SqlConnection(CONN_STR))



        {



            conn.Open();



            using (var cmd = new SqlCommand(@"



                SELECT TOP 1 [SessionGuid], [RoomCode], [TemplateCode], [HostUsername], [Mode], [TargetHearts], [Status], [CurrentTurnPlayerIdx], [TurnNumber], [WinnerName], [StateJson], [UpdatedAt]



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



                        var sessObj = new



                        {



                            sessionGuid = r["SessionGuid"].ToString(),



                            roomCode = r["RoomCode"].ToString(),



                            templateCode = r["TemplateCode"].ToString(),



                            hostUsername = r["HostUsername"].ToString(),



                            mode = r["Mode"].ToString(),



                            targetHearts = Convert.ToDouble(r["TargetHearts"]),



                            gameStatus = r["Status"].ToString(),



                            turnNumber = Convert.ToInt32(r["TurnNumber"]),



                            winnerName = r["WinnerName"] == DBNull.Value ? null : r["WinnerName"].ToString(),



                            stateJson = r["StateJson"].ToString(),



                            updatedAt = Convert.ToDateTime(r["UpdatedAt"]).ToString("o")



                        };



                        context.Response.Write(_json.Serialize(new



                        {



                            ok = true,



                            status = "success",



                            session = sessObj,



                            stateJson = sessObj.stateJson



                        }));



                        return;



                    }



                }



            }



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



    private void HandleAdminStats(HttpContext context)



    {



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




    // ==========================================
    // 🛡️ ADMINISTRACE & SPRÁVA (VIDEA, UŽIVATELÉ, RELACE, OZNÁMENÍ, SYSTÉM)
    // ==========================================

    private void HandleListVideos(HttpContext context)
    {
        EnsureDatabaseSchema();
        var videos = new List<object>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT [Id], [Title], [Description], [VideoType], [Url], [PosterUrl], [Category], [IsHeroActive], [SortOrder], [CreatedAt],
                       ISNULL([LikesCount], 0) AS [LikesCount]
                FROM [prs].[prs_Videos]
                ORDER BY [SortOrder] ASC, [Id] DESC", conn))
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    videos.Add(new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        title = r["Title"].ToString(),
                        description = r["Description"] == DBNull.Value ? "" : r["Description"].ToString(),
                        videoType = r["VideoType"].ToString(),
                        url = r["Url"].ToString(),
                        posterUrl = r["PosterUrl"] == DBNull.Value ? "" : r["PosterUrl"].ToString(),
                        category = r["Category"].ToString(),
                        isHeroActive = Convert.ToBoolean(r["IsHeroActive"]),
                        likesCount = Convert.ToInt32(r["LikesCount"]),
                        sortOrder = Convert.ToInt32(r["SortOrder"]),
                        createdAt = Convert.ToDateTime(r["CreatedAt"]).ToString("o")
                    });
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", videos = videos }));
    }

    
    private void HandleLikeVideo(HttpContext context)
    {
        EnsureDatabaseSchema();
        int id = 0;
        int.TryParse(context.Request.QueryString["id"], out id);
        if (id <= 0 && context.Request.HttpMethod == "POST")
        {
            var body = ReadJsonBody(context);
            id = GetInt(body, "id", 0);
        }
        if (id <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Chybi ID videa." }));
            return;
        }

        int newLikes = 0;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                UPDATE [prs].[prs_Videos]
                SET [LikesCount] = ISNULL([LikesCount], 0) + 1
                OUTPUT INSERTED.[LikesCount]
                WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                object res = cmd.ExecuteScalar();
                if (res != null && res != DBNull.Value)
                {
                    newLikes = Convert.ToInt32(res);
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", videoId = id, likesCount = newLikes }));
    }


    private void HandleGetHeroVideo(HttpContext context)
    {
        EnsureDatabaseSchema();
        object hero = null;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT TOP 1 [Id], [Title], [Description], [VideoType], [Url], [PosterUrl], [Category], [IsHeroActive],
                             ISNULL([LikesCount], 0) AS [LikesCount]
                FROM [prs].[prs_Videos]
                ORDER BY [IsHeroActive] DESC, [SortOrder] ASC, [Id] ASC", conn))
            using (var r = cmd.ExecuteReader())
            {
                if (r.Read())
                {
                    hero = new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        title = r["Title"].ToString(),
                        description = r["Description"] == DBNull.Value ? "" : r["Description"].ToString(),
                        videoType = r["VideoType"].ToString(),
                        url = r["Url"].ToString(),
                        posterUrl = r["PosterUrl"] == DBNull.Value ? "" : r["PosterUrl"].ToString(),
                        category = r["Category"].ToString(),
                        isHeroActive = Convert.ToBoolean(r["IsHeroActive"]),
                        likesCount = Convert.ToInt32(r["LikesCount"])
                    };
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", hero = hero }));
    }

    private void HandleUploadVideo(HttpContext context)
    {
        if (context.Request.HttpMethod != "POST")
        {
            context.Response.StatusCode = 405;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Pouze metoda POST je povolena." }));
            return;
        }

        if (context.Request.Files.Count == 0)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Nebyl odeslán žádný soubor k nahrání." }));
            return;
        }

        HttpPostedFile file = context.Request.Files[0];
        if (file == null || file.ContentLength == 0)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Nahraný soubor je prázdný." }));
            return;
        }

        string originalName = System.IO.Path.GetFileName(file.FileName);
        string ext = System.IO.Path.GetExtension(originalName).ToLowerInvariant();

        // Přísný bezpečnostní filtr: NIKDY nepovolit spustitelné soubory ani skripty
        if (ext == ".exe" || ext == ".dll" || ext == ".ashx" || ext == ".aspx" || ext == ".config" || ext == ".bat" || ext == ".cmd" || ext == ".ps1" || ext == ".vbs" || ext == ".msi")
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Tento typ souboru je z bezpečnostních důvodů přísně zakázán." }));
            return;
        }

        // Povolit pouze multimediální soubory (video nebo plakát)
        bool isVideo = (ext == ".mp4" || ext == ".webm" || ext == ".mov" || ext == ".m4v");
        bool isImage = (ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp");
        if (!isVideo && !isImage)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Povolena jsou pouze videa (.mp4, .webm, .mov) nebo obrázky plakátů (.jpg, .png, .webp)." }));
            return;
        }

        string subFolder = isImage ? "board" : "video";
        string targetDir = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(context.Request.PhysicalPath), "assets", subFolder);
        if (!System.IO.Directory.Exists(targetDir))
        {
            System.IO.Directory.CreateDirectory(targetDir);
        }

        // Čištění názvu souboru na bezpečné ASCII znaky
        string rawName = System.IO.Path.GetFileNameWithoutExtension(originalName);
        string safeBase = System.Text.RegularExpressions.Regex.Replace(rawName, @"[^a-zA-Z0-9_\-]", "_");
        if (string.IsNullOrEmpty(safeBase)) safeBase = "media_" + DateTime.UtcNow.Ticks;
        string safeFileName = safeBase + ext;
        string fullPath = System.IO.Path.Combine(targetDir, safeFileName);

        file.SaveAs(fullPath);

        // Automatická synchronizace do paralelní webroot složky, pokud na serveru existuje (/www/apps vs /www/wwwroot/apps)
        try
        {
            string appDir = System.IO.Path.GetDirectoryName(context.Request.PhysicalPath);
            string relSub = System.IO.Path.Combine("assets", subFolder);
            if (appDir.IndexOf("wwwroot", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                string altRoot = appDir.Replace("wwwroot\\", "").Replace("wwwroot/", "");
                string altDir = System.IO.Path.Combine(altRoot, relSub);
                if (System.IO.Directory.Exists(altDir))
                {
                    System.IO.File.Copy(fullPath, System.IO.Path.Combine(altDir, safeFileName), true);
                }
            }
            else
            {
                string altDir = System.IO.Path.GetFullPath(System.IO.Path.Combine(appDir, "..", "..", "wwwroot", "apps", "KiDesky", relSub));
                if (System.IO.Directory.Exists(altDir))
                {
                    System.IO.File.Copy(fullPath, System.IO.Path.Combine(altDir, safeFileName), true);
                }
            }
        }
        catch { }

        string relativeUrl = "assets/" + subFolder + "/" + safeFileName;
        context.Response.Write(_json.Serialize(new
        {
            ok = true,
            status = "success",
            url = relativeUrl,
            fileName = safeFileName,
            fileSize = file.ContentLength,
            mediaType = isVideo ? "video" : "image",
            message = "Soubor byl úspěšně nahrán na server: " + relativeUrl
        }));
    }

    private void HandleAdminSaveVideo(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string title = GetStr(body, "title").Trim();
        string description = GetStr(body, "description").Trim();
        string videoType = GetStr(body, "videoType", "mp4").Trim().ToLowerInvariant();
        string url = GetStr(body, "url").Trim();
        if (!string.IsNullOrEmpty(url) && (url.IndexOf("youtube.com", StringComparison.OrdinalIgnoreCase) >= 0 || url.IndexOf("youtu.be", StringComparison.OrdinalIgnoreCase) >= 0))
        {
            videoType = "youtube";
        }
        string posterUrl = GetStr(body, "posterUrl").Trim();
        string category = GetStr(body, "category", "trailer").Trim();
        bool isHeroActive = body.ContainsKey("isHeroActive") && Convert.ToBoolean(body["isHeroActive"]);
        int sortOrder = GetInt(body, "sortOrder", 0);

        if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(url))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Název a URL videa jsou povinné." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);

            if (id > 0)
            {
                using (var cmd = new SqlCommand(@"
                    UPDATE [prs].[prs_Videos]
                    SET [Title] = @t, [Description] = @d, [VideoType] = @vt, [Url] = @u, [PosterUrl] = @pu, [Category] = @c, [IsHeroActive] = @h, [SortOrder] = @s
                    WHERE [Id] = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@d", description);
                    cmd.Parameters.AddWithValue("@vt", videoType);
                    cmd.Parameters.AddWithValue("@u", url);
                    cmd.Parameters.AddWithValue("@pu", posterUrl);
                    cmd.Parameters.AddWithValue("@c", category);
                    cmd.Parameters.AddWithValue("@h", isHeroActive);
                    cmd.Parameters.AddWithValue("@s", sortOrder);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand(@"
                    INSERT INTO [prs].[prs_Videos] ([Title], [Description], [VideoType], [Url], [PosterUrl], [Category], [IsHeroActive], [SortOrder])
                    VALUES (@t, @d, @vt, @u, @pu, @c, @h, @s)", conn))
                {
                    cmd.Parameters.AddWithValue("@t", title);
                    cmd.Parameters.AddWithValue("@d", description);
                    cmd.Parameters.AddWithValue("@vt", videoType);
                    cmd.Parameters.AddWithValue("@u", url);
                    cmd.Parameters.AddWithValue("@pu", posterUrl);
                    cmd.Parameters.AddWithValue("@c", category);
                    cmd.Parameters.AddWithValue("@h", isHeroActive);
                    cmd.Parameters.AddWithValue("@s", sortOrder);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Video bylo úspěšně uloženo." }));
    }

    private void HandleAdminDeleteVideo(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        if (id <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné ID videa." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("DELETE FROM [prs].[prs_Videos] WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Video bylo smazáno." }));
    }

    private void HandleAdminSetHeroVideo(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        if (id <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné ID videa." }));
            return;
        }

        bool toggle = body.ContainsKey("toggle") && Convert.ToBoolean(body["toggle"]);
        bool hasActiveState = body.ContainsKey("isActive");
        bool targetActiveState = hasActiveState ? Convert.ToBoolean(body["isActive"]) : true;

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            if (toggle)
            {
                using (var cmd = new SqlCommand("UPDATE [prs].[prs_Videos] SET [IsHeroActive] = CASE WHEN [IsHeroActive] = 1 THEN 0 ELSE 1 END WHERE [Id] = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else if (hasActiveState)
            {
                using (var cmd = new SqlCommand("UPDATE [prs].[prs_Videos] SET [IsHeroActive] = @act WHERE [Id] = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@act", targetActiveState);
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
            else
            {
                using (var cmd = new SqlCommand("UPDATE [prs].[prs_Videos] SET [IsHeroActive] = 1 WHERE [Id] = @id", conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    cmd.ExecuteNonQuery();
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Stav zobrazení videa na Landing Page byl upraven." }));
    }

    // ========================================================================
    // HUDBA / AUDIO (MP3 soubory na serveru + YouTube)
    // ========================================================================

    private void SeedDefaultAudio(SqlConnection conn)
    {
        int cnt;
        using (var c = new SqlCommand("SELECT COUNT(*) FROM [prs].[prs_Audio]", conn))
        {
            cnt = Convert.ToInt32(c.ExecuteScalar());
        }
        if (cnt > 0) return;

        string[,] defaults = new string[,] {
            { "Flight of the High Queen", "Epic Orchestral", "assets/audio/Flight_of_the_High_Queen.mp3" },
            { "Army of Light", "Epic Heroic Fantasy Orchestral Choirs", "assets/audio/army_of_light.mp3" },
            { "Heavenly Warrior", "Epic Heroic Fantasy Orchestral", "assets/audio/heavenly_warrior.mp3" },
            { "We Fight As One", "Epic Heroic Fantasy Orchestral (Remastered)", "assets/audio/we_fight_as_one.mp3" },
            { "Together", "Epic Vocal Fantasy Orchestral", "assets/audio/together.mp3" },
            { "Tomorrow is Here", "Epic Hybrid Orchestral", "assets/audio/tomorrow_is_here.mp3" },
            { "I Will Do Everything To See You Just One More Time", "Hypersonic Music", "assets/audio/i_will_do_everything.mp3" },
            { "Adventure Fantasy Music - Epic Orchestral RPG Soundtrack", "Fantasy Soundtrack (Preview)", "assets/audio/adventure_fantasy_music.mp3" }
        };
        for (int i = 0; i < defaults.GetLength(0); i++)
        {
            using (var cmd = new SqlCommand(@"INSERT INTO [prs].[prs_Audio] ([Title], [Author], [AudioType], [Url], [Category], [IsActive], [SortOrder])
                VALUES (@t, @a, N'mp3', @u, N'bgm', 1, @s)", conn))
            {
                cmd.Parameters.Add("@t", SqlDbType.NVarChar, 128).Value = defaults[i, 0];
                cmd.Parameters.Add("@a", SqlDbType.NVarChar, 128).Value = defaults[i, 1];
                cmd.Parameters.Add("@u", SqlDbType.NVarChar, 500).Value = defaults[i, 2];
                cmd.Parameters.Add("@s", SqlDbType.Int).Value = (i + 1) * 10;
                cmd.ExecuteNonQuery();
            }
        }
    }

    private void HandleListAudio(HttpContext context)
    {
        EnsureDatabaseSchema();
        bool all = context.Request.QueryString["all"] == "1";
        var tracks = new List<object>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            SeedDefaultAudio(conn);
            using (var cmd = new SqlCommand("SELECT [Id], [Title], [Author], [AudioType], [Url], [Category], [IsActive], [SortOrder] FROM [prs].[prs_Audio] " + (all ? "" : "WHERE [IsActive] = 1 ") + "ORDER BY [SortOrder], [Id]", conn))
            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    tracks.Add(new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        title = r["Title"].ToString(),
                        author = r["Author"] == DBNull.Value ? "" : r["Author"].ToString(),
                        audioType = r["AudioType"].ToString(),
                        url = r["Url"].ToString(),
                        category = r["Category"].ToString(),
                        isActive = Convert.ToBoolean(r["IsActive"]),
                        sortOrder = Convert.ToInt32(r["SortOrder"])
                    });
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", tracks = tracks }));
    }

    private void HandleUploadAudio(HttpContext context)
    {
        if (context.Request.HttpMethod != "POST")
        {
            context.Response.StatusCode = 405;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Pouze metoda POST je povolena." }));
            return;
        }
        if (context.Request.Files.Count == 0 || context.Request.Files[0] == null || context.Request.Files[0].ContentLength == 0)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Nebyl odeslán žádný (neprázdný) soubor." }));
            return;
        }
        HttpPostedFile file = context.Request.Files[0];
        string originalName = System.IO.Path.GetFileName(file.FileName);
        string ext = System.IO.Path.GetExtension(originalName).ToLowerInvariant();
        if (ext != ".mp3" && ext != ".ogg" && ext != ".wav" && ext != ".m4a" && ext != ".aac" && ext != ".opus")
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Povoleny jsou pouze audio soubory (.mp3, .ogg, .wav, .m4a, .aac, .opus)." }));
            return;
        }

        string appDir = System.IO.Path.GetDirectoryName(context.Request.PhysicalPath);
        string targetDir = System.IO.Path.Combine(appDir, "assets", "audio");
        if (!System.IO.Directory.Exists(targetDir)) System.IO.Directory.CreateDirectory(targetDir);

        string rawName = System.IO.Path.GetFileNameWithoutExtension(originalName);
        string safeBase = System.Text.RegularExpressions.Regex.Replace(rawName, @"[^a-zA-Z0-9_\-]", "_");
        if (safeBase.Length > 80) safeBase = safeBase.Substring(0, 80);
        if (string.IsNullOrEmpty(safeBase)) safeBase = "audio_" + DateTime.UtcNow.Ticks;
        string safeFileName = safeBase + ext;
        string fullPath = System.IO.Path.Combine(targetDir, safeFileName);
        file.SaveAs(fullPath);

        // Synchronizace do paralelní webroot složky (/www/apps vs /www/wwwroot/apps)
        try
        {
            string relSub = System.IO.Path.Combine("assets", "audio");
            string altDir = null;
            if (appDir.IndexOf("wwwroot", StringComparison.OrdinalIgnoreCase) >= 0)
                altDir = System.IO.Path.Combine(appDir.Replace("wwwroot\\", "").Replace("wwwroot/", ""), relSub);
            else
                altDir = System.IO.Path.GetFullPath(System.IO.Path.Combine(appDir, "..", "..", "wwwroot", "apps", "KiDesky", relSub));
            if (System.IO.Directory.Exists(altDir))
                System.IO.File.Copy(fullPath, System.IO.Path.Combine(altDir, safeFileName), true);
        }
        catch { }

        string relativeUrl = "assets/audio/" + safeFileName;
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", url = relativeUrl, fileName = safeFileName, fileSize = file.ContentLength, message = "Soubor byl nahrán: " + relativeUrl }));
    }

    private void HandleAdminSaveAudio(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        string title = GetStr(body, "title").Trim();
        string author = GetStr(body, "author").Trim();
        string audioType = GetStr(body, "audioType", "mp3").Trim().ToLowerInvariant();
        string url = GetStr(body, "url").Trim();
        string category = GetStr(body, "category", "bgm").Trim();
        bool isActive = !body.ContainsKey("isActive") || Convert.ToBoolean(body["isActive"]);
        int sortOrder = GetInt(body, "sortOrder", 0);

        if (!string.IsNullOrEmpty(url) && (url.IndexOf("youtube.com", StringComparison.OrdinalIgnoreCase) >= 0 || url.IndexOf("youtu.be", StringComparison.OrdinalIgnoreCase) >= 0))
            audioType = "youtube";
        if (audioType != "youtube") audioType = "mp3";

        if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(url))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Název a URL skladby jsou povinné." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            string sql = id > 0
                ? "UPDATE [prs].[prs_Audio] SET [Title]=@t, [Author]=@a, [AudioType]=@at, [Url]=@u, [Category]=@c, [IsActive]=@ia, [SortOrder]=@s WHERE [Id]=@id"
                : "INSERT INTO [prs].[prs_Audio] ([Title],[Author],[AudioType],[Url],[Category],[IsActive],[SortOrder]) VALUES (@t,@a,@at,@u,@c,@ia,@s)";
            using (var cmd = new SqlCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@t", title);
                cmd.Parameters.AddWithValue("@a", author);
                cmd.Parameters.AddWithValue("@at", audioType);
                cmd.Parameters.AddWithValue("@u", url);
                cmd.Parameters.AddWithValue("@c", category);
                cmd.Parameters.AddWithValue("@ia", isActive);
                cmd.Parameters.AddWithValue("@s", sortOrder);
                if (id > 0) cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Skladba byla uložena." }));
    }

    private void HandleAdminDeleteAudio(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        int id = GetInt(body, "id", 0);
        if (id <= 0)
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatné ID skladby." }));
            return;
        }
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand("DELETE FROM [prs].[prs_Audio] WHERE [Id] = @id", conn))
            {
                cmd.Parameters.AddWithValue("@id", id);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Skladba byla smazána." }));
    }

    private void HandleGetAnnouncement(HttpContext context)
    {
        EnsureDatabaseSchema();
        object ann = null;
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                SELECT TOP 1 [Id], [Message], [LinkUrl], [IsActive], [CreatedAt]
                FROM [prs].[prs_Announcements]
                WHERE [IsActive] = 1
                ORDER BY [Id] DESC", conn))
            using (var r = cmd.ExecuteReader())
            {
                if (r.Read())
                {
                    ann = new
                    {
                        id = Convert.ToInt32(r["Id"]),
                        message = r["Message"].ToString(),
                        linkUrl = r["LinkUrl"] == DBNull.Value ? "" : r["LinkUrl"].ToString(),
                        isActive = Convert.ToBoolean(r["IsActive"]),
                        createdAt = Convert.ToDateTime(r["CreatedAt"]).ToString("o")
                    };
                }
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", announcement = ann }));
    }

    private void HandleAdminSaveAnnouncement(HttpContext context)
    {
        EnsureDatabaseSchema();
        var body = ReadJsonBody(context);
        string message = GetStr(body, "message").Trim();
        string linkUrl = GetStr(body, "linkUrl").Trim();
        bool isActive = !body.ContainsKey("isActive") || Convert.ToBoolean(body["isActive"]);

        if (string.IsNullOrEmpty(message))
        {
            context.Response.Write(_json.Serialize(new { ok = false, message = "Text oznámení nesmí být prázdný." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            using (var cmd = new SqlCommand(@"
                INSERT INTO [prs].[prs_Announcements] ([Message], [LinkUrl], [IsActive])
                VALUES (@m, @l, @a)", conn))
            {
                cmd.Parameters.AddWithValue("@m", message);
                cmd.Parameters.AddWithValue("@l", linkUrl);
                cmd.Parameters.AddWithValue("@a", isActive);
                cmd.ExecuteNonQuery();
            }
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Královské oznámení bylo zveřejněno." }));
    }

    private void HandleAdminListUsers(HttpContext context)
    {
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
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Uživatelský účet byl aktualizován." }));
    }

    private void HandleAdminResetPassword(HttpContext context)
    {
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
        }
        context.Response.Write(_json.Serialize(new { ok = true, status = "success", message = "Heslo uživatele bylo úspěšně změněno." }));
    }

    private void HandleAdminDeleteUser(HttpContext context)
    {
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
        EnsureDatabaseSchema();
        var counts = new Dictionary<string, int>();
        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            EnsureExtendedAdminSchema(conn);
            string[] tables = new string[] { "prs_Users", "prs_GameSessions", "prs_SessionPlayers", "prs_TelemetryLogs", "prs_GameConfigs", "prs_BoardTemplates", "prs_Videos", "prs_Announcements" };
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

    // =========================================================
    // SPRÁVA PŘEDDEFINOVANÝCH A DYNAMICKÝCH HERNÍCH PLÁNŮ
    // =========================================================

    private void HandleListBoardTemplates(HttpContext context)
    {
        EnsureDatabaseSchema();
        bool showAll = (context.Request.QueryString["all"] == "1");
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

    private void HandleAdminSaveBoardTemplate(HttpContext context)
    {
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
        string createdBy = GetStr(body, "createdBy", "admin").Trim();
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

    public bool IsReusable { get { return false; } }



}



