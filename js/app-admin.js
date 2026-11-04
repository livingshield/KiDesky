/**
 * KiDesky - Princeznino srdce
 * Modul: app-admin.js
 * Kompletní administrátorská sekce portálu:
 * 1. Správa videí a multimédií (MP4 / YouTube, Hero video)
 * 2. Správa uživatelských účtů (DisplayName, role Admin/Player, hesla, blokace)
 * 3. Správa herních relací & místností (monitoring online stolů, uzavírání, purge)
 * 4. Královský posel (oznamovací banner napříč portálem)
 * 5. Správa herních pravidel a balancu
 * 6. Telemetrie & analytické statistiky
 * 7. Systémová diagnostika & stav MSSQL
 */

(function () {
    "use strict";

    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
        activeAdminSubtab: "videos",
        adminVideosList: [],
        adminUsersList: [],
        adminSessionsList: [],
        editingVideoId: 0,

        initAdminSection: function () {
            if (!this.currentUser || this.currentUser.role !== "Admin") {
                this.renderAdminAccessDenied();
                return;
            }
            this.switchAdminSubtab(this.activeAdminSubtab || "videos");
        },

        renderAdminAccessDenied: function () {
            var container = document.getElementById("admin-content-area");
            if (container) {
                container.innerHTML = '<div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">' +
                    '<div style="font-size:3rem; margin-bottom:1rem;">🛡️🔒</div>' +
                    '<h2 style="color:var(--gold-light); font-family:\'Cinzel\',serif;">Přístup vyhrazen pro Administrátora</h2>' +
                    '<p style="max-width:500px; margin:0.8rem auto 1.5rem;">Pro správu videí, uživatelských účtů a herních relací se prosím přihlaste jako <strong>admin</strong>.</p>' +
                    '<button class="btn-primary" onclick="PRS_App.openAuthModal()">🔑 Přihlásit se jako Admin</button>' +
                    '</div>';
            }
        },

        switchAdminSubtab: function (subtab) {
            this.activeAdminSubtab = subtab;
            var subtabs = ["videos", "users", "sessions", "announcements", "balance", "telemetry", "system"];
            for (var i = 0; i < subtabs.length; i++) {
                var s = subtabs[i];
                var sec = document.getElementById("admin-subtab-" + s);
                var btn = document.getElementById("admin-nav-" + s);
                if (sec) sec.style.display = (s === subtab) ? "block" : "none";
                if (btn) {
                    if (s === subtab) btn.classList.add("active");
                    else btn.classList.remove("active");
                }
            }

            switch (subtab) {
                case "videos":
                    this.loadAdminVideos();
                    break;
                case "users":
                    this.loadAdminUsers();
                    break;
                case "sessions":
                    this.loadAdminSessions();
                    break;
                case "announcements":
                    this.loadAdminAnnouncements();
                    break;
                case "balance":
                    this.renderBalanceStudioInputs();
                    break;
                case "telemetry":
                    this.loadAdminTelemetry();
                    break;
                case "system":
                    this.loadAdminSystemInfo();
                    break;
            }
        },

        // ==========================================
        // 1. SPRÁVA VIDEÍ & MULTIMÉDIÍ
        // ==========================================

        loadAdminVideos: function () {
            var self = this;
            var listEl = document.getElementById("admin-videos-table-body");
            if (listEl) listEl.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem;">⏳ Načítám královská videa...</td></tr>';

            fetch("api.ashx?action=list-videos")
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.videos) {
                        self.adminVideosList = res.videos;
                        self.renderAdminVideosTable();
                    } else {
                        if (listEl) listEl.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba načítání videí: ' + (res.message || "Neznámá chyba") + '</td></tr>';
                    }
                })
                .catch(function (err) {
                    if (listEl) listEl.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba sítě při načítání videí.</td></tr>';
                });
        },

        renderAdminVideosTable: function () {
            var listEl = document.getElementById("admin-videos-table-body");
            if (!listEl) return;
            if (!this.adminVideosList || this.adminVideosList.length === 0) {
                listEl.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Zatím nejsou uložena žádná videa. Klikněte na tlačítko "Přidat video".</td></tr>';
                return;
            }

            var html = "";
            for (var i = 0; i < this.adminVideosList.length; i++) {
                var v = this.adminVideosList[i];
                var typeBadge = (v.videoType === "youtube")
                    ? '<span class="badge-pill" style="background:#dc2626; color:#fff;">YouTube</span>'
                    : '<span class="badge-pill" style="background:#2563eb; color:#fff;">MP4 Soubor</span>';

                var heroBadge = v.isHeroActive
                    ? '<span class="badge-pill" style="background:var(--gold); color:#1c1917; font-weight:700;">★ Hlavní Hero</span>'
                    : '<button class="btn-secondary" style="font-size:0.72rem; padding:0.2rem 0.5rem;" onclick="PRS_App.setHeroVideo(' + v.id + ')">Aktivovat na Landing</button>';

                html += '<tr>' +
                    '<td style="font-weight:700; color:var(--gold-light);">' + v.id + '</td>' +
                    '<td><strong>' + this.escapeHtml(v.title) + '</strong><br><small style="color:var(--text-muted);">' + this.escapeHtml(v.description || "") + '</small></td>' +
                    '<td>' + typeBadge + '</td>' +
                    '<td style="word-break:break-all; font-family:monospace; font-size:0.75rem;"><a href="' + this.escapeHtml(v.url) + '" target="_blank" style="color:var(--gold);">' + this.escapeHtml(v.url) + '</a></td>' +
                    '<td style="text-align:center;">' + heroBadge + '</td>' +
                    '<td style="text-align:right; white-space:nowrap;">' +
                        '<button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; margin-right:4px;" onclick="PRS_App.openEditVideoModal(' + v.id + ')">✏️ Upravit</button>' +
                        '<button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; color:#ef4444; border-color:#ef4444;" onclick="PRS_App.deleteAdminVideo(' + v.id + ')">🗑️ Smazat</button>' +
                    '</td>' +
                '</tr>';
            }
            listEl.innerHTML = html;
        },

        openAddVideoModal: function () {
            this.editingVideoId = 0;
            document.getElementById("admin-video-modal-title").textContent = "➕ Přidat nové video";
            document.getElementById("admin-vid-title").value = "";
            document.getElementById("admin-vid-desc").value = "";
            document.getElementById("admin-vid-type").value = "mp4";
            document.getElementById("admin-vid-url").value = "";
            document.getElementById("admin-vid-poster").value = "assets/board/parchment_board_bg.jpg";
            document.getElementById("admin-vid-category").value = "trailer";
            document.getElementById("admin-vid-hero").checked = false;
            document.getElementById("admin-vid-order").value = "10";
            document.getElementById("admin-vid-feedback").textContent = "";
            document.getElementById("admin-video-modal").style.display = "flex";
        },

        openEditVideoModal: function (id) {
            var vid = null;
            for (var i = 0; i < this.adminVideosList.length; i++) {
                if (this.adminVideosList[i].id === id) { vid = this.adminVideosList[i]; break; }
            }
            if (!vid) return;

            this.editingVideoId = id;
            document.getElementById("admin-video-modal-title").textContent = "✏️ Upravit video #" + id;
            document.getElementById("admin-vid-title").value = vid.title || "";
            document.getElementById("admin-vid-desc").value = vid.description || "";
            document.getElementById("admin-vid-type").value = vid.videoType || "mp4";
            document.getElementById("admin-vid-url").value = vid.url || "";
            document.getElementById("admin-vid-poster").value = vid.posterUrl || "";
            document.getElementById("admin-vid-category").value = vid.category || "trailer";
            document.getElementById("admin-vid-hero").checked = !!vid.isHeroActive;
            document.getElementById("admin-vid-order").value = vid.sortOrder || 0;
            document.getElementById("admin-vid-feedback").textContent = "";
            document.getElementById("admin-video-modal").style.display = "flex";
        },

        closeAdminVideoModal: function () {
            document.getElementById("admin-video-modal").style.display = "none";
        },

        saveAdminVideo: function () {
            var self = this;
            var title = (document.getElementById("admin-vid-title").value || "").trim();
            var desc = (document.getElementById("admin-vid-desc").value || "").trim();
            var type = document.getElementById("admin-vid-type").value;
            var url = (document.getElementById("admin-vid-url").value || "").trim();
            var poster = (document.getElementById("admin-vid-poster").value || "").trim();
            var category = document.getElementById("admin-vid-category").value;
            var isHero = document.getElementById("admin-vid-hero").checked;
            var sortOrder = parseInt(document.getElementById("admin-vid-order").value, 10) || 0;
            var fb = document.getElementById("admin-vid-feedback");

            if (!title || !url) {
                if (fb) fb.textContent = "Vyplňte prosím název a URL adresu videa.";
                return;
            }

            var payload = {
                id: this.editingVideoId,
                title: title,
                description: desc,
                videoType: type,
                url: url,
                posterUrl: poster,
                category: category,
                isHeroActive: isHero,
                sortOrder: sortOrder
            };

            fetch("api.ashx?action=admin-save-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        self.closeAdminVideoModal();
                        self.loadAdminVideos();
                        self.loadActiveHeroVideo();
                    } else {
                        if (fb) fb.textContent = res.message || "Uložení videa se nezdařilo.";
                    }
                })
                .catch(function () {
                    if (fb) fb.textContent = "Chyba sítě při ukládání.";
                });
        },

        deleteAdminVideo: function (id) {
            if (!confirm("Opravdu si přejete smazat toto video?")) return;
            var self = this;
            fetch("api.ashx?action=admin-delete-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        self.loadAdminVideos();
                        self.loadActiveHeroVideo();
                    } else {
                        alert(res.message || "Smazání videa selhalo.");
                    }
                })
                .catch(function () { alert("Chyba sítě při mazání."); });
        },

        setHeroVideo: function (id) {
            var self = this;
            fetch("api.ashx?action=admin-set-hero-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        self.loadAdminVideos();
                        self.loadActiveHeroVideo();
                    } else {
                        alert(res.message || "Nastavení hero videa selhalo.");
                    }
                })
                .catch(function () { alert("Chyba sítě při nastavování hero videa."); });
        },

        // ==========================================
        // 2. SPRÁVA UŽIVATELSKÝCH ÚČTŮ
        // ==========================================

        loadAdminUsers: function () {
            var self = this;
            var listEl = document.getElementById("admin-users-table-body");
            if (listEl) listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem;">⏳ Načítám účty hráčů...</td></tr>';

            fetch("api.ashx?action=admin-list-users")
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.users) {
                        self.adminUsersList = res.users;
                        self.renderAdminUsersTable();
                    } else {
                        if (listEl) listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba načítání uživatelů: ' + (res.message || "Neznámá chyba") + '</td></tr>';
                    }
                })
                .catch(function () {
                    if (listEl) listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba sítě při načítání uživatelů.</td></tr>';
                });
        },

        renderAdminUsersTable: function () {
            var listEl = document.getElementById("admin-users-table-body");
            if (!listEl) return;
            var search = (document.getElementById("admin-users-search") ? document.getElementById("admin-users-search").value : "").toLowerCase().trim();

            var users = this.adminUsersList || [];
            if (search) {
                users = users.filter(function (u) {
                    return (u.username && u.username.toLowerCase().indexOf(search) !== -1) ||
                           (u.displayName && u.displayName.toLowerCase().indexOf(search) !== -1) ||
                           (u.email && u.email.toLowerCase().indexOf(search) !== -1) ||
                           (u.role && u.role.toLowerCase().indexOf(search) !== -1);
                });
            }

            if (users.length === 0) {
                listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">Žádní uživatelé neodpovídají hledání.</td></tr>';
                return;
            }

            var html = "";
            for (var i = 0; i < users.length; i++) {
                var u = users[i];
                var roleBadge = (u.role === "Admin")
                    ? '<span class="badge-pill" style="background:var(--gold); color:#1c1917; font-weight:700;">👑 Admin</span>'
                    : '<span class="badge-pill" style="background:rgba(255,255,255,0.1); color:var(--text-muted);">🛡️ Hráč</span>';

                var statusBadge = u.isActive
                    ? '<span class="badge-pill" style="background:#16a34a; color:#fff;">Aktivní</span>'
                    : '<span class="badge-pill" style="background:#dc2626; color:#fff;">Blokován</span>';

                var lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("cs-CZ") : "Zatím nikdy";

                html += '<tr>' +
                    '<td style="font-weight:700; color:var(--gold-light);">' + u.id + '</td>' +
                    '<td><strong>' + this.escapeHtml(u.username) + '</strong><br><small style="color:var(--text-muted);">' + this.escapeHtml(u.email || "") + '</small></td>' +
                    '<td><span style="color:var(--gold-light); font-weight:600;">' + this.escapeHtml(u.displayName || u.username) + '</span></td>' +
                    '<td>' + roleBadge + '</td>' +
                    '<td>' + statusBadge + '<br><small style="color:var(--text-muted); font-size:0.72rem;">Přihlášen: ' + lastLogin + '</small></td>' +
                    '<td style="text-align:center;">' + (u.gamesPlayed || 0) + ' / <strong style="color:var(--gold);">' + (u.gamesWon || 0) + ' 🏆</strong></td>' +
                    '<td style="text-align:right; white-space:nowrap;">' +
                        '<button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; margin-right:4px;" onclick="PRS_App.openEditUserModal(' + u.id + ')">✏️ Upravit</button>' +
                        '<button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; margin-right:4px;" onclick="PRS_App.promptResetPassword(' + u.id + ', \'' + this.escapeHtml(u.username) + '\')">🔑 Heslo</button>' +
                        (u.id > 1 ? '<button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; color:#ef4444; border-color:#ef4444;" onclick="PRS_App.deleteAdminUser(' + u.id + ', \'' + this.escapeHtml(u.username) + '\')">🗑️</button>' : '') +
                    '</td>' +
                '</tr>';
            }
            listEl.innerHTML = html;
        },

        openEditUserModal: function (id) {
            var user = null;
            for (var i = 0; i < this.adminUsersList.length; i++) {
                if (this.adminUsersList[i].id === id) { user = this.adminUsersList[i]; break; }
            }
            if (!user) return;

            this.editingUserId = id;
            document.getElementById("admin-user-modal-title").textContent = "✏️ Úprava účtu: " + user.username;
            document.getElementById("admin-user-displayname").value = user.displayName || user.username;
            document.getElementById("admin-user-role").value = user.role || "Player";
            document.getElementById("admin-user-active").checked = (user.isActive !== false);
            document.getElementById("admin-user-feedback").textContent = "";
            document.getElementById("admin-user-modal").style.display = "flex";
        },

        closeAdminUserModal: function () {
            document.getElementById("admin-user-modal").style.display = "none";
        },

        saveAdminUser: function () {
            var self = this;
            var dn = (document.getElementById("admin-user-displayname").value || "").trim();
            var role = document.getElementById("admin-user-role").value;
            var active = document.getElementById("admin-user-active").checked;
            var fb = document.getElementById("admin-user-feedback");

            var payload = {
                id: this.editingUserId,
                displayName: dn,
                role: role,
                isActive: active
            };

            fetch("api.ashx?action=admin-update-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        self.closeAdminUserModal();
                        self.loadAdminUsers();
                    } else {
                        if (fb) fb.textContent = res.message || "Úprava účtu selhala.";
                    }
                })
                .catch(function () {
                    if (fb) fb.textContent = "Chyba sítě při ukládání.";
                });
        },

        promptResetPassword: function (id, username) {
            var newPass = prompt("Zadejte nové heslo pro uživatele " + username + " (min. 4 znaky):");
            if (!newPass || newPass.trim().length < 4) {
                if (newPass !== null) alert("Heslo musí mít alespoň 4 znaky!");
                return;
            }

            var self = this;
            fetch("api.ashx?action=admin-reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id, newPassword: newPass.trim() })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        alert("Heslo uživatele " + username + " bylo úspěšně změněno.");
                    } else {
                        alert(res.message || "Reset hesla selhal.");
                    }
                })
                .catch(function () { alert("Chyba sítě při resetu hesla."); });
        },

        deleteAdminUser: function (id, username) {
            if (!confirm("Opravdu chcete trvale smazat uživatele " + username + "? Tato akce je nevratná!")) return;
            var self = this;
            fetch("api.ashx?action=admin-delete-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        self.loadAdminUsers();
                    } else {
                        alert(res.message || "Smazání uživatele selhalo.");
                    }
                })
                .catch(function () { alert("Chyba sítě při mazání uživatele."); });
        },

        // ==========================================
        // 3. SPRÁVA HERNÍCH RELACÍ & MÍSTNOSTÍ
        // ==========================================

        loadAdminSessions: function () {
            var self = this;
            var listEl = document.getElementById("admin-sessions-table-body");
            if (listEl) listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem;">⏳ Načítám herní relace...</td></tr>';

            fetch("api.ashx?action=admin-list-sessions")
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.sessions) {
                        self.adminSessionsList = res.sessions;
                        self.renderAdminSessionsTable();
                    } else {
                        if (listEl) listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba načítání relací: ' + (res.message || "Neznámá chyba") + '</td></tr>';
                    }
                })
                .catch(function () {
                    if (listEl) listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba sítě při načítání relací.</td></tr>';
                });
        },

        renderAdminSessionsTable: function () {
            var listEl = document.getElementById("admin-sessions-table-body");
            if (!listEl) return;
            var sessions = this.adminSessionsList || [];
            if (sessions.length === 0) {
                listEl.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">V databázi zatím nejsou žádné herní relace.</td></tr>';
                return;
            }

            var html = "";
            for (var i = 0; i < sessions.length; i++) {
                var s = sessions[i];
                var statusBadge = (s.status === "Active")
                    ? '<span class="badge-pill" style="background:#16a34a; color:#fff;">🟢 Běží</span>'
                    : (s.status === "Finished"
                        ? '<span class="badge-pill" style="background:var(--gold); color:#1c1917; font-weight:700;">🏆 Dokončena</span>'
                        : '<span class="badge-pill" style="background:rgba(255,255,255,0.1); color:var(--text-muted);">Uzavřena</span>');

                var updated = s.updatedAt ? new Date(s.updatedAt).toLocaleString("cs-CZ") : "";

                html += '<tr>' +
                    '<td><strong>' + (s.roomCode || "—") + '</strong><br><small style="color:var(--text-muted); font-size:0.7rem;">' + s.sessionGuid.substring(0, 8) + '...</small></td>' +
                    '<td><span style="color:var(--gold-light);">' + this.escapeHtml(s.hostUsername) + '</span></td>' +
                    '<td>' + this.escapeHtml(s.templateCode) + ' (' + s.mode + ')</td>' +
                    '<td style="text-align:center;">' + (s.playerCount || 0) + ' hráčů</td>' +
                    '<td style="text-align:center;">Tah č. ' + (s.turnCount || 0) + '</td>' +
                    '<td>' + statusBadge + '<br><small style="color:var(--text-muted); font-size:0.72rem;">' + updated + '</small></td>' +
                    '<td style="text-align:right; white-space:nowrap;">' +
                        (s.status === "Active" ? '<button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; color:#ef4444; border-color:#ef4444;" onclick="PRS_App.closeAdminSession(\'' + s.sessionGuid + '\')">⛔ Uzavřít</button>' : '—') +
                    '</td>' +
                '</tr>';
            }
            listEl.innerHTML = html;
        },

        closeAdminSession: function (sessionGuid) {
            if (!confirm("Opravdu chcete uzavřít tuto běžící místnost?")) return;
            var self = this;
            fetch("api.ashx?action=admin-close-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionGuid: sessionGuid })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        self.loadAdminSessions();
                    } else {
                        alert(res.message || "Uzavření místnosti selhalo.");
                    }
                })
                .catch(function () { alert("Chyba sítě při uzavírání relace."); });
        },

        purgeOldSessions: function () {
            var days = prompt("Zadejte počet dní neaktivity, po kterých se staré relace promažou:", "7");
            if (!days || isNaN(days) || parseInt(days, 10) < 1) return;

            var self = this;
            fetch("api.ashx?action=admin-purge-sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ daysOld: parseInt(days, 10) })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        alert(res.message);
                        self.loadAdminSessions();
                    } else {
                        alert(res.message || "Promazání selhalo.");
                    }
                })
                .catch(function () { alert("Chyba sítě při promazávání relací."); });
        },

        // ==========================================
        // 4. KRÁLOVSKÝ POSEL (OZNÁMENÍ)
        // ==========================================

        loadAdminAnnouncements: function () {
            fetch("api.ashx?action=get-announcement")
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.announcement) {
                        var a = res.announcement;
                        document.getElementById("admin-ann-msg").value = a.message || "";
                        document.getElementById("admin-ann-link").value = a.linkUrl || "";
                        document.getElementById("admin-ann-active").checked = !!a.isActive;
                    }
                })
                .catch(function () { });
        },

        saveAdminAnnouncement: function () {
            var msg = (document.getElementById("admin-ann-msg").value || "").trim();
            var link = (document.getElementById("admin-ann-link").value || "").trim();
            var active = document.getElementById("admin-ann-active").checked;
            var fb = document.getElementById("admin-ann-feedback");

            if (!msg) {
                if (fb) fb.textContent = "Vyplňte prosím text oznámení.";
                return;
            }

            var self = this;
            fetch("api.ashx?action=admin-save-announcement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: msg, linkUrl: link, isActive: active })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        if (fb) {
                            fb.style.color = "#16a34a";
                            fb.textContent = "✅ Královské oznámení bylo úspěšně zveřejněno a synchronizováno!";
                        }
                        self.loadAnnouncement();
                    } else {
                        if (fb) {
                            fb.style.color = "#ef4444";
                            fb.textContent = res.message || "Chyba při ukládání oznámení.";
                        }
                    }
                })
                .catch(function () {
                    if (fb) {
                        fb.style.color = "#ef4444";
                        fb.textContent = "Chyba sítě při odesílání oznámení.";
                    }
                });
        },

        // ==========================================
        // 6. TELEMETRIE & STATISTIKY
        // ==========================================

        loadAdminTelemetry: function () {
            var self = this;
            var logsEl = document.getElementById("admin-telemetry-logs-body");
            if (logsEl) logsEl.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem;">⏳ Načítám telemetrii z MSSQL...</td></tr>';

            fetch("api.ashx?action=admin-stats")
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.status === "success") {
                        self.renderAdminTelemetryLogs(res.recentLogs || []);
                    } else {
                        if (logsEl) logsEl.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba načítání telemetrie.</td></tr>';
                    }
                })
                .catch(function () {
                    if (logsEl) logsEl.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444; padding:1.5rem;">Chyba sítě při načítání telemetrie.</td></tr>';
                });
        },

        renderAdminTelemetryLogs: function (logs) {
            var listEl = document.getElementById("admin-telemetry-logs-body");
            if (!listEl) return;
            if (logs.length === 0) {
                listEl.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">Zatím nejsou zaznamenány žádné telemetrické události.</td></tr>';
                return;
            }

            var html = "";
            for (var i = 0; i < logs.length; i++) {
                var l = logs[i];
                var time = l.createdAt ? new Date(l.createdAt).toLocaleTimeString("cs-CZ") : "";

                var evBadge = '<span class="badge-pill" style="background:rgba(212,175,55,0.15); color:var(--gold-light);">' + this.escapeHtml(l.eventType) + '</span>';

                html += '<tr>' +
                    '<td style="color:var(--text-muted); font-size:0.75rem;">' + time + '</td>' +
                    '<td>' + evBadge + '</td>' +
                    '<td><strong>' + this.escapeHtml(l.playerName || "Království") + '</strong></td>' +
                    '<td style="text-align:center;">Tah ' + l.turnNumber + '</td>' +
                    '<td>' + this.escapeHtml(l.message) + '</td>' +
                '</tr>';
            }
            listEl.innerHTML = html;
        },

        // ==========================================
        // 7. SYSTÉM & DIAGNOSTIKA
        // ==========================================

        loadAdminSystemInfo: function () {
            var diagEl = document.getElementById("admin-system-diag-box");
            if (diagEl) diagEl.innerHTML = '<div style="text-align:center; padding:2rem;">⏳ Prověřuji stav databáze a IIS serveru...</div>';

            fetch("api.ashx?action=admin-system-info")
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        var c = res.tableCounts || {};
                        var html = '<div class="admin-stat-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem;">' +
                            '<div class="admin-stat-card">' +
                                '<div class="stat-num" style="color:#16a34a;">ONLINE</div>' +
                                '<div class="stat-label">Stav MSSQL databáze</div>' +
                            '</div>' +
                            '<div class="admin-stat-card">' +
                                '<div class="stat-num" style="color:var(--gold-light);">' + (c.prs_Users || 0) + '</div>' +
                                '<div class="stat-label">Uživatelů (prs_Users)</div>' +
                            '</div>' +
                            '<div class="admin-stat-card">' +
                                '<div class="stat-num" style="color:#38bdf8;">' + (c.prs_GameSessions || 0) + '</div>' +
                                '<div class="stat-label">Relací (prs_GameSessions)</div>' +
                            '</div>' +
                            '<div class="admin-stat-card">' +
                                '<div class="stat-num" style="color:#ec4899;">' + (c.prs_Videos || 0) + '</div>' +
                                '<div class="stat-label">Videí (prs_Videos)</div>' +
                            '</div>' +
                            '<div class="admin-stat-card">' +
                                '<div class="stat-num" style="color:#a855f7;">' + (c.prs_TelemetryLogs || 0) + '</div>' +
                                '<div class="stat-label">Telemetrie (prs_TelemetryLogs)</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="background:rgba(0,0,0,0.35); padding:1rem; border-radius:8px; border:1px solid rgba(212,175,55,0.2); font-family:monospace; font-size:0.82rem; color:var(--text-muted);">' +
                            '<div><strong>Čas serveru:</strong> ' + res.serverTime + '</div>' +
                            '<div><strong>Runtime:</strong> .NET CLR ' + res.runtime + '</div>' +
                            '<div><strong>Operační systém:</strong> ' + res.os + '</div>' +
                            '<div><strong>Schéma:</strong> [prs] na ASPONE SQL Serveru (Ekobio)</div>' +
                        '</div>';

                        if (diagEl) diagEl.innerHTML = html;
                    } else {
                        if (diagEl) diagEl.innerHTML = '<div style="color:#ef4444; padding:1.5rem;">Chyba získání diagnostiky: ' + (res.message || "Neznámá chyba") + '</div>';
                    }
                })
                .catch(function () {
                    if (diagEl) diagEl.innerHTML = '<div style="color:#ef4444; padding:1.5rem;">Chyba sítě při komunikaci se serverem.</div>';
                });
        }
    });

})();
