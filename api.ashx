<%@ WebHandler Language="C#" Class="KiDeskyApiHandler" %>
<%@ Assembly Src="backend/KiDeskyCore.cs" %>

using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Web;
using System.Web.Compilation;
using KiDesky.Backend;

public class KiDeskyApiHandler : KiDeskyHandlerBase
{
    private static readonly Dictionary<string, string> _actionRoutes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        // Auth & Profile (api-auth.ashx)
        { "register", "api-auth.ashx" },
        { "confirm-email", "api-auth.ashx" },
        { "resend-confirmation", "api-auth.ashx" },
        { "google-login", "api-auth.ashx" },
        { "login", "api-auth.ashx" },
        { "session-me", "api-auth.ashx" },
        { "logout", "api-auth.ashx" },
        { "update-profile", "api-auth.ashx" },
        { "update_nickname", "api-auth.ashx" },
        { "save-user-pawn", "api-auth.ashx" },
        { "unlock-pawn", "api-auth.ashx" },
        { "award-credits", "api-auth.ashx" },
        { "record-game-stats", "api-auth.ashx" },

        // Game Config, Sessions, Chat & Board Templates (api-game.ashx)
        { "get-config", "api-game.ashx" },
        { "save-config", "api-game.ashx" },
        { "save-session", "api-game.ashx" },
        { "list-sessions", "api-game.ashx" },
        { "check-session", "api-game.ashx" },
        { "load-session", "api-game.ashx" },
        { "log-telemetry", "api-game.ashx" },
        { "send-emote", "api-game.ashx" },
        { "send-chat", "api-game.ashx" },
        { "get-chat", "api-game.ashx" },
        { "list-board-templates", "api-game.ashx" },
        { "get-board-template", "api-game.ashx" },

        // Media & Announcements (api-media.ashx)
        { "list-videos", "api-media.ashx" },
        { "hero-video", "api-media.ashx" },
        { "like-video", "api-media.ashx" },
        { "upload-video", "api-media.ashx" },
        { "admin-upload-video", "api-media.ashx" },
        { "admin-save-video", "api-media.ashx" },
        { "admin-delete-video", "api-media.ashx" },
        { "admin-set-hero-video", "api-media.ashx" },
        { "list-audio", "api-media.ashx" },
        { "upload-audio", "api-media.ashx" },
        { "admin-upload-audio", "api-media.ashx" },
        { "admin-save-audio", "api-media.ashx" },
        { "admin-delete-audio", "api-media.ashx" },
        { "get-announcement", "api-media.ashx" },
        { "admin-save-announcement", "api-media.ashx" },

        // Administration (api-admin.ashx)
        { "admin-stats", "api-admin.ashx" },
        { "admin-list-users", "api-admin.ashx" },
        { "admin-update-user", "api-admin.ashx" },
        { "admin-reset-password", "api-admin.ashx" },
        { "admin-delete-user", "api-admin.ashx" },
        { "admin-list-sessions", "api-admin.ashx" },
        { "admin-close-session", "api-admin.ashx" },
        { "admin-purge-sessions", "api-admin.ashx" },
        { "admin-system-info", "api-admin.ashx" },
        { "admin-save-board-template", "api-admin.ashx" },
        { "admin-rename-board-template", "api-admin.ashx" },
        { "admin-delete-board-template", "api-admin.ashx" }
    };

    protected override void DispatchAction(HttpContext context, string action)
    {
        if (action == "hello" || action == "status")
        {
            HandleStatus(context);
            return;
        }

        string handlerFile;
        if (_actionRoutes.TryGetValue(action, out handlerFile))
        {
            string dir = VirtualPathUtility.GetDirectory(context.Request.AppRelativeCurrentExecutionFilePath);
            string targetVPath = VirtualPathUtility.Combine(dir, handlerFile);
            var subHandler = (IHttpHandler)BuildManager.CreateInstanceFromVirtualPath(targetVPath, typeof(IHttpHandler));
            subHandler.ProcessRequest(context);
            return;
        }

        HandleStatus(context);
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
}
