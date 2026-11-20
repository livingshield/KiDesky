<%@ WebHandler Language="C#" Class="KiDeskyMediaHandler" %>
<%@ Assembly Src="backend/KiDeskyCore.cs" %>

using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Text;
using System.Web;
using KiDesky.Backend;

public class KiDeskyMediaHandler : KiDeskyHandlerBase
{
    protected override void DispatchAction(HttpContext context, string action)
    {
        switch (action)
        {
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
            default:
                context.Response.StatusCode = 400;
                context.Response.Write(_json.Serialize(new { ok = false, status = "error", code = "UNKNOWN_ACTION", message = "Neznámá akce." }));
                break;
        }
    }

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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;

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

        // Čištění názvu souboru na bezpečné ASCII znaky + ochrana proti path traversal
        string rawName = System.IO.Path.GetFileNameWithoutExtension(originalName);
        string safeBase = System.Text.RegularExpressions.Regex.Replace(rawName, @"[^a-zA-Z0-9_\-]", "_");
        if (safeBase.Length > 80) safeBase = safeBase.Substring(0, 80);
        if (string.IsNullOrEmpty(safeBase)) safeBase = "media_" + DateTime.UtcNow.Ticks;
        string safeFileName = safeBase + ext;
        string fullTargetDir = System.IO.Path.GetFullPath(targetDir).TrimEnd(System.IO.Path.DirectorySeparatorChar) + System.IO.Path.DirectorySeparatorChar;
        string fullPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(targetDir, safeFileName));
        if (!fullPath.StartsWith(fullTargetDir, StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatný název souboru." }));
            return;
        }

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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
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
        bool wantsAll = context.Request.QueryString["all"] == "1";
        bool isAdminCaller = false;
        if (wantsAll)
        {
            AuthenticatedUser authUser = GetAuthenticatedUser(context);
            isAdminCaller = (authUser != null && string.Equals(authUser.Role, "Admin", StringComparison.OrdinalIgnoreCase));
        }
        bool all = wantsAll && isAdminCaller;
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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;

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
        string fullTargetDir = System.IO.Path.GetFullPath(targetDir).TrimEnd(System.IO.Path.DirectorySeparatorChar) + System.IO.Path.DirectorySeparatorChar;
        string fullPath = System.IO.Path.GetFullPath(System.IO.Path.Combine(targetDir, safeFileName));
        if (!fullPath.StartsWith(fullTargetDir, StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = 400;
            context.Response.Write(_json.Serialize(new { ok = false, message = "Neplatný název souboru." }));
            return;
        }
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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
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
        AuthenticatedUser adminUser = RequireAdmin(context);
        if (adminUser == null) return;
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
}
