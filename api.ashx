<%@ WebHandler Language="C#" Class="KiDeskyApiHandler" CodePage="65001" %>
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

public class KiDeskyApiHandler : IHttpHandler
{
    // Dynamické načtení connection stringu z web.config / appsettings.json / produkčního MSSQL db4937
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
                case "load-session":
                    HandleLoadSession(context);
                    break;
                case "log-telemetry":
                    HandleLogTelemetry(context);
                    break;
                case "admin-stats":
                    HandleAdminStats(context);
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

    private void EnsureDatabaseSchema()
    {
        if (_schemaEnsured || !IsDbConfigured()) return;

        lock (_schemaLock)
        {
            if (_schemaEnsured) return;

            using (var conn = new SqlConnection(CONN_STR))
            {
                conn.Open();

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
        var body = ReadJsonBody(context);
        string username = GetStr(body, "username").Trim();
        string password = GetStr(body, "password");
        string email = GetStr(body, "email").Trim();

        if (string.IsNullOrEmpty(email) && username.Contains("@"))
        {
            email = username;
        }

        if (username.Length < 3 || password.Length < 3)
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { status = "error", message = "Jm\u00e9no i heslo mus\u00ed m\u00edt alespo\u0148 3 znaky." }));
            return;
        }

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var check = new SqlCommand("SELECT COUNT(*) FROM [prs].[prs_Users] WHERE [Username] = @u OR ([Email] IS NOT NULL AND [Email] != '' AND [Email] = @e)", conn))
            {
                check.Parameters.AddWithValue("@u", username);
                check.Parameters.AddWithValue("@e", string.IsNullOrEmpty(email) ? "___no_email___" : email);
                if (Convert.ToInt32(check.ExecuteScalar()) > 0)
                {
                    context.Response.StatusCode = 409;
                    context.Response.Write(_json.Serialize(new { status = "error", message = "U\u017eivatel s t\u00edmto jm\u00e9nem nebo e-mailem ji\u017e existuje." }));
                    return;
                }
            }

            string role = username.ToLowerInvariant().StartsWith("admin") ? "Admin" : "Player";
            using (var ins = new SqlCommand(@"
                INSERT INTO [prs].[prs_Users] ([Username], [Email], [PasswordHash], [Role], [LastLoginAt])
                OUTPUT INSERTED.Id
                VALUES (@u, @e, @p, @r, SYSUTCDATETIME())", conn))
            {
                ins.Parameters.AddWithValue("@u", username);
                ins.Parameters.AddWithValue("@e", email);
                ins.Parameters.AddWithValue("@p", HashPassword(password));
                ins.Parameters.AddWithValue("@r", role);
                int userId = Convert.ToInt32(ins.ExecuteScalar());

                context.Response.Write(_json.Serialize(new
                {
                    ok = true,
                    status = "success",
                    user = new { id = userId, username = username, displayName = username, role = role, email = email }
                }));
            }
        }
    }

    private void HandleLogin(HttpContext context)
    {
        var body = ReadJsonBody(context);
        string username = GetStr(body, "username").Trim();
        string password = GetStr(body, "password");

        using (var conn = new SqlConnection(CONN_STR))
        {
            conn.Open();
            using (var cmd = new SqlCommand(@"
                SELECT [Id], [Username], [Email], [Role], [PasswordHash], [GamesPlayed], [GamesWon]
                FROM [prs].[prs_Users]
                WHERE [Username] = @u OR [Email] = @u", conn))
            {
                cmd.Parameters.AddWithValue("@u", username);
                using (var r = cmd.ExecuteReader())
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
                        int gp = Convert.ToInt32(r["GamesPlayed"]);
                        int gw = Convert.ToInt32(r["GamesWon"]);
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

                        using (var upd = new SqlCommand("UPDATE [prs].[prs_Users] SET [LastLoginAt] = SYSUTCDATETIME() WHERE [Id] = @id", conn))
                        {
                            upd.Parameters.AddWithValue("@id", id);
                            upd.ExecuteNonQuery();
                        }

                        context.Response.Write(_json.Serialize(new
                        {
                            ok = true,
                            status = "success",
                            user = new { id = id, username = u, displayName = u, role = role, gamesPlayed = gp, gamesWon = gw }
                        }));
                        return;
                    }
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

    public bool IsReusable { get { return false; } }
}
