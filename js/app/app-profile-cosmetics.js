// ============================================================================
// KiDesky: Princeznino srdce - Profil rytíře, herna, obchod figurek, erby, úspěchy a katalog her
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    // --- UŽIVATELSKÝ ÚČET (Guest / Player / Admin) ---,

    loadSavedUser: function () {

        try {

            var raw = localStorage.getItem("prs_user");

            if (raw) {

                this.currentUser = JSON.parse(raw);

                if (this.currentUser && (this.currentUser.role === "Guest" || !this.currentUser.role)) {

                    this.currentUser.username = "Host";

                    this.currentUser.displayName = "Host";

                    this.currentUser.role = "Guest";

                    this.currentUser.credits = 0;

                }

                if (this.currentUser && typeof this.currentUser.credits === "number" && this.currentUser.role !== "Guest") {

                    this.userCredits = this.currentUser.credits;

                }

                if (this.currentUser && this.currentUser.selectedPawnId) {

                    this.selectedPawnId = this.currentUser.selectedPawnId;

                }

                if (this.currentUser && this.currentUser.unlockedPawnsJson && this.currentUser.role !== "Guest") {

                    try {

                        var arr = JSON.parse(this.currentUser.unlockedPawnsJson);

                        if (Array.isArray(arr) && arr.length > 0) this.unlockedPawns = arr;

                    } catch (e2) { console.warn("[KiDesky] Invalid saved unlockedPawnsJson:", e2); }

                }

            }

            var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
            if (!isGuest) {
                var tok = (window.PRS_Api && typeof window.PRS_Api.getAuthToken === "function") ? window.PRS_Api.getAuthToken() : null;
                if (!tok || tok === "local") {
                    isGuest = true;
                    this.currentUser = {
                        id: null,
                        username: "Host",
                        displayName: "Host",
                        role: "Guest",
                        credits: 0,
                        selectedPawnId: "knight_valiant",
                        token: null
                    };
                    try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e3) { }
                    if (window.PRS_Api) window.PRS_Api.clearAuthToken();
                    var selfLegacy = this;
                    setTimeout(function () {
                        if (typeof selfLegacy.handleSessionExpired === "function") {
                            selfLegacy.handleSessionExpired();
                        }
                    }, 400);
                } else {
                    var selfSync = this;
                    window.PRS_Api.get("session-me", null, { silentAuth: true })
                        .then(function (res) {
                            if (res && res.ok && res.user) {
                                res.user.authToken = tok;
                                selfSync.currentUser = res.user;
                                if (typeof res.user.credits === "number") selfSync.userCredits = res.user.credits;
                                if (res.user.selectedPawnId) selfSync.selectedPawnId = res.user.selectedPawnId;
                                if (res.user.unlockedPawnsJson) {
                                    try {
                                        var unlArr = JSON.parse(res.user.unlockedPawnsJson);
                                        if (Array.isArray(unlArr) && unlArr.length > 0) selfSync.unlockedPawns = unlArr;
                                    } catch (e4) { }
                                }
                                try { localStorage.setItem("prs_user", JSON.stringify(selfSync.currentUser)); } catch (e5) { }
                                selfSync.updateUserUI();
                            } else if (res && (res._httpStatus === 401 || res._httpStatus === 403)) {
                                selfSync.handleSessionExpired();
                            }
                        })
                        .catch(function (err) { console.warn("[KiDesky] session-me sync failed:", err); });
                }
            }
            if (isGuest) {
                // Host má VŽDY 0 modrých krystalů a pouze 6 základních figurek zdarma
                this.userCredits = 0;
                this.unlockedPawns = ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"];
                var basicPawns = ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"];
                if (!this.selectedPawnId || basicPawns.indexOf(this.selectedPawnId) === -1) {
                    this.selectedPawnId = "knight_valiant";
                }
                try { localStorage.removeItem("prs_guest_credits"); } catch (e) { }
                try { localStorage.removeItem("prs_unlocked_pawns"); } catch (e) { }
            } else {
                var locPawn = localStorage.getItem("prs_selected_pawn");
                if (locPawn) this.selectedPawnId = locPawn;
            }

        } catch (e) { }

        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].pawnId = this.selectedPawnId || "knight_valiant";
        }

        this.updateUserUI();

    },

    checkEmailConfirmationUrl: function () {
        var self = this;
        var search = window.location.search;
        if (!search || search.indexOf("confirmEmail") === -1) return;

        var token = "";
        try {
            var params = new URLSearchParams(search);
            token = params.get("confirmEmail") || "";
        } catch (e) {
            var m = search.match(/[?&]confirmEmail=([^&]+)/);
            if (m && m[1]) token = decodeURIComponent(m[1]);
        }
        if (!token) return;

        PRS_Api.get("confirm-email", { token: token })
            .then(function (res) {
                if (res && res.ok && res.user) {
                    self.currentUser = res.user;
                    if (res.authToken && window.PRS_Api) {
                        window.PRS_Api.setAuthToken(res.authToken);
                        self.currentUser.authToken = res.authToken;
                    }
                    if (typeof res.user.credits === "number") self.userCredits = res.user.credits;
                    if (res.user.selectedPawnId) self.selectedPawnId = res.user.selectedPawnId;
                    if (res.user.unlockedPawnsJson) {
                        try {
                            var unl = JSON.parse(res.user.unlockedPawnsJson);
                            if (Array.isArray(unl) && unl.length > 0) self.unlockedPawns = unl;
                        } catch (e2) { }
                    }
                    localStorage.setItem("prs_user", JSON.stringify(self.currentUser));
                    self.updateUserUI();
                    if (window.history && window.history.replaceState) {
                        var cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                    if (window.PRS_Audio && window.PRS_Audio.playFanfare) {
                        window.PRS_Audio.playFanfare();
                    }
                    alert("👑 " + (res.message || "Tvůj e-mail byl úspěšně potvrzen! Vítej v království jako plnohodnotný rytíř."));
                } else {
                    alert("⚠️ " + ((res && res.message) ? res.message : "Ověření e-mailu selhalo."));
                }
            })
            .catch(function () {
                alert("⚠️ Chyba sítě při ověřování e-mailu.");
            });
    },

    updateUserUI: function () {

        var badgeEl = document.getElementById("user-status-badge");

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        var isUnconfirmed = (this.currentUser && this.currentUser.emailConfirmed === false && this.currentUser.role === "Guest");

        var savedNick = "";

        try { savedNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }

        var rawName = "";
        if (isGuest) {
            rawName = "Host";
        } else {
            rawName = (this.currentUser.displayName || "").trim() || (this.currentUser.username || "").trim() || "Hráč";
        }

        if (rawName && rawName.indexOf("@") !== -1) {

            rawName = rawName.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();

        } else if (rawName && rawName.toLowerCase() === "admin") {

            rawName = "Rytíř Admin";

        }

        var nameStr = this.escapeHtml(rawName);

        var roleIcon = isGuest ? (isUnconfirmed ? "👤 Host (Čeká na e-mail ✉️)" : "👤 Host") : (this.currentUser.role === "Admin" ? "👑 Admin" : "🛡️ Hráč");

        if (badgeEl) {
            if (isGuest) {
                badgeEl.innerHTML = roleIcon;
                badgeEl.title = isUnconfirmed ? "Účet čeká na potvrzení e-mailu. Kliknutím otevřeš podrobnosti." : "Hraješ volně jako Host. Kliknutím se můžeš přihlásit.";
            } else {
                badgeEl.innerHTML = roleIcon + ": <strong>" + nameStr + "</strong>";
                badgeEl.title = "Klepnutím otevřete správu rytířského účtu";
            }
        }

        var unconfBox = document.getElementById("auth-unconfirmed-box");
        if (unconfBox) {
            unconfBox.style.display = isUnconfirmed ? "block" : "none";
        }

        var adminNav = document.getElementById("nav-btn-admin");
        if (adminNav) {
            adminNav.style.display = (this.currentUser && this.currentUser.role === "Admin") ? "inline-flex" : "none";
        }

        // Tlačítka přihlášení a odhlášení v horní liště
        var loginBtn = document.getElementById("topbar-login-btn");
        var logoutBtn = document.getElementById("topbar-logout-btn");
        var creditsBtn = document.getElementById("topbar-credits-btn");

        if (loginBtn) loginBtn.style.display = isGuest ? "inline-flex" : "none";
        if (logoutBtn) logoutBtn.style.display = isGuest ? "none" : "inline-flex";
        if (creditsBtn) creditsBtn.style.display = isGuest ? "none" : "inline-flex";

        var navBoardBtn = document.getElementById("nav-btn-board");
        if (navBoardBtn) navBoardBtn.style.display = this.hasGameStarted ? "inline-flex" : "none";

        // Aktualizace dvoustavového Auth modálu
        var loggedView = document.getElementById("auth-logged-view");
        var guestView = document.getElementById("auth-guest-view");
        if (loggedView && guestView) {
            if (isGuest) {
                loggedView.style.display = "none";
                guestView.style.display = "block";
            } else {
                loggedView.style.display = "block";
                guestView.style.display = "none";

                var pNameInput = document.getElementById("auth-profile-displayname-input");
                if (pNameInput) pNameInput.value = rawName;
                var pBadge = document.getElementById("auth-profile-role-badge");
                if (pBadge) pBadge.textContent = roleIcon;
                var pUser = document.getElementById("auth-profile-username-val");
                if (pUser) pUser.textContent = (this.currentUser && this.currentUser.username) || "rytir";
                var pEmail = document.getElementById("auth-profile-email-val");
                if (pEmail) pEmail.textContent = (this.currentUser && this.currentUser.email) || "Neuveden";
                var pCredits = document.getElementById("auth-profile-credits-val");
                if (pCredits) pCredits.textContent = String(this.userCredits || 0) + " 💎";
            }
        }

        // Aktualizace výchozího hráče č. 0 v lobby

        var defaultPlayerName = this.getDefaultPlayerName();

        if (this.lobbyPlayers && this.lobbyPlayers.length > 0) {

            var curName = this.lobbyPlayers[0].name;

            if (!curName || curName === "Lord Filip (Ty)" || curName === "Host (Ty)" || curName === "Královský Host (Ty)" || curName.endsWith(" (Ty)")) {

                this.lobbyPlayers[0].name = defaultPlayerName;

                this.renderLobbyPlayers();

            }

        }

        // Aktualizace uvítacího pásu na Landing Page

        var lpText = document.getElementById("lp-user-banner-text");

        var lpAct = document.getElementById("lp-user-banner-actions");

        if (lpText) {

            if (isGuest) {

                lpText.innerHTML = "👤 <strong>Vstup bez bariér:</strong> Hraješ jako <strong>Host</strong>. Můžeš ihned hrát proti PC nebo se připojit ke stolu přes kód.";

            } else {

                lpText.innerHTML = roleIcon + " <strong>Vítej v království, " + nameStr + "!</strong> Tvé rozehrané partie a statistiky jsou propojené s databází.";

            }

        }

        if (lpAct) {

            if (isGuest) {

                lpAct.innerHTML = '<button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem;" onclick="PRS_App.openAuthModal()">🔑 Přihlásit se / Registrovat</button>';

            } else {

                lpAct.innerHTML = '<button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem;" onclick="PRS_App.openAuthModal()">👤 Změnit účet / Odhlásit</button>';

            }

        }

        var credEl = document.getElementById("top-user-credits");
        if (credEl) {
            if (isGuest) {
                this.userCredits = 0;
                if (this.currentUser) this.currentUser.credits = 0;
            } else if (this.currentUser && typeof this.currentUser.credits === "number") {
                this.userCredits = this.currentUser.credits;
            }
            credEl.textContent = String(this.userCredits || 0);
        }

        this.updateGameHallUI();

    },

    enterGameHall: function () {
        if (this.refreshLobbySettingsSelects) this.refreshLobbySettingsSelects();
        this.switchTab("lobby");
        this.switchGameHallRoom("custom");
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { }
    },

    setGuestModeAndEnter: function () {
        this.setGuestMode();
        this.enterGameHall();
    },

    activeGameHallRoom: "custom",

    switchGameHallRoom: function (roomId) {
        this.activeGameHallRoom = roomId || "custom";
        var rooms = ["custom", "online", "saves"];
        for (var i = 0; i < rooms.length; i++) {
            var r = rooms[i];
            var el = document.getElementById("room-gh-" + r);
            var btn = document.getElementById("btn-gh-" + r);
            if (el) el.style.display = (r === this.activeGameHallRoom) ? "block" : "none";
            if (btn) {
                if (r === this.activeGameHallRoom) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }
        if (roomId === "online") {
            this.fetchServerStatusAndSessions();
        } else if (roomId === "saves") {
            if (typeof this.renderSavedGamesList === "function") {
                this.renderSavedGamesList();
            }
            var roomEl = document.getElementById("room-gh-saves");
            if (roomEl) {
                try {
                    var rect = roomEl.getBoundingClientRect();
                    if (rect.top < 60 || rect.top > window.innerHeight * 0.7) {
                        roomEl.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                } catch (e) { }
            }
        }
    },

    promptEditNickname: async function () {
        var cur = (this.currentUser && this.currentUser.displayName) || "";
        if (!cur) {
            try { cur = localStorage.getItem("prs_player_nickname") || ""; } catch (e) { }
        }
        if (!cur || cur.toLowerCase() === "host" || cur.toLowerCase() === "admin") cur = "Lord Filip";
        var newNick = await KiDeskyDialog.prompt("Zadej své nové rytířské jméno u stolu:", cur, {
            title: "Úprava rytířského jména",
            icon: "⚔️",
            placeholder: "např. Lord Filip",
            confirmText: "⚔️ Uložit jméno",
            cancelText: "Zrušit"
        });
        if (newNick === null) return;
        newNick = newNick.trim();
        if (!newNick) return;
        if (this.currentUser && this.currentUser.role !== "Guest") {
            this.currentUser.displayName = newNick;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
            PRS_Api.post("update_nickname", { displayName: newNick }).catch(function (err) { console.warn("[KiDesky] update_nickname failed:", err); });
        }
        try { localStorage.setItem("prs_player_nickname", newNick); } catch (e) { }
        this.updateUserUI();
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = this.getDefaultPlayerName();
            this.renderLobbyPlayers();
        }
    },

    scrollToSection: function (id) {
        var el = document.getElementById(id);
        if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    },

    updateGameHallUI: function () {
        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        var savedNick = "";
        try { savedNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }
        var rawName = isGuest ? (savedNick || "Host") : ((this.currentUser && this.currentUser.displayName) || (this.currentUser && this.currentUser.username) || savedNick || "Hráč");
        if (rawName && rawName.indexOf("@") !== -1) {
            rawName = rawName.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();
        } else if (rawName && rawName.toLowerCase() === "admin") {
            rawName = "Rytíř Admin";
        }
        var roleLabel = isGuest ? "👤 Host" : (this.currentUser.role === "Admin" ? "👑 Admin" : "🛡️ Hráč");

        // 1. Karta vstupu na Úvodní bráně (tab-welcome)
        var guestView = document.getElementById("welcome-entry-guest-view");
        var userView = document.getElementById("welcome-entry-user-view");
        var wName = document.getElementById("welcome-user-name");
        var wRole = document.getElementById("welcome-user-role-badge");
        var wCredits = document.getElementById("welcome-user-credits");
        if (guestView && userView) {
            if (isGuest) {
                guestView.style.display = "block";
                userView.style.display = "none";
            } else {
                guestView.style.display = "none";
                userView.style.display = "block";
                if (wName) wName.textContent = rawName;
                if (wRole) wRole.textContent = roleLabel;
                if (wCredits) wCredits.textContent = String(this.userCredits || 0);
            }
        }

        // 2. Šlechtická karta v Rytířské herně (tab-lobby)
        var ghName = document.getElementById("gamehall-player-name");
        if (ghName) ghName.textContent = isGuest ? "Host" : rawName;
        var ghRole = document.getElementById("gamehall-role-badge");
        if (ghRole) ghRole.textContent = roleLabel;
        var ghCredits = document.getElementById("gamehall-credits");
        if (ghCredits) ghCredits.textContent = String(this.userCredits || 0);
        var ghCreditsWrap = ghCredits ? ghCredits.parentElement : null;
        if (ghCreditsWrap) {
            ghCreditsWrap.style.display = isGuest ? "none" : "inline-flex";
        }

        // 3. Avatar v herně (opravená cesta k img!)
        var activePawnId = this.selectedPawnId || (this.currentUser && this.currentUser.selectedPawnId) || "knight_valiant";
        var pData = (window.PRS_getPawnById ? window.PRS_getPawnById(activePawnId) : null);
        var ghAvatar = document.getElementById("gamehall-pawn-avatar");
        if (ghAvatar && pData) {
            ghAvatar.src = pData.img || pData.avatarUrl || pData.image || "assets/pawns/pawn_knight_valiant.png";
            ghAvatar.alt = pData.name || "Figurka";
        }

        // 4. Rychlý pás figurek v herně (miniatury odemčených figurek)
        var strip = document.getElementById("gamehall-quick-pawns-strip");
        if (strip && window.PRS_PAWNS_CATALOG) {
            var self = this;
            var htmlPawns = "";
            for (var pi = 0; pi < window.PRS_PAWNS_CATALOG.length; pi++) {
                var pw = window.PRS_PAWNS_CATALOG[pi];
                var isUnl = self.isPawnUnlocked(pw.id);
                if (isUnl) {
                    var isAct = (pw.id === activePawnId);
                    htmlPawns += '<div class="gamehall-pawn-chip ' + (isAct ? 'active' : '') + '" onclick="PRS_App.selectPawnForSlot(\'' + pw.id + '\'); PRS_App.updateUserUI();" title="' + self.escapeHtml(pw.name + ' (' + pw.title + ')') + '">';
                    htmlPawns += '<img src="' + pw.img + '" alt="' + self.escapeHtml(pw.name) + '" />';
                    htmlPawns += '</div>';
                }
            }
            strip.innerHTML = htmlPawns;
        }

        // 5. Banner rozehrané hry (pouze pokud byla hra skutečně zahájena)
        var activeBanner = document.getElementById("gamehall-active-game-banner");
        var activeRound = document.getElementById("gamehall-active-round-info");
        if (activeBanner) {
            var hasActiveGame = (this.hasGameStarted === true && this.state !== null);
            activeBanner.style.display = hasActiveGame ? "flex" : "none";
            if (activeRound && this.state) {
                var roundTxt = window.PRS_I18n ? window.PRS_I18n.t("lobby.active_game_info", { round: this.state.roundNumber || 1, count: this.state.players ? this.state.players.length : 4 }) : ("Kolo " + (this.state.roundNumber || 1) + " • " + (this.state.players ? this.state.players.length : 4) + " Rytířů");
                activeRound.textContent = roundTxt;
            }
        }

        // 6. Tlačítko pro založení online místnosti (Host se může připojit, ale nemůže ji založit)
        var createRoomBtn = document.getElementById("btn-create-online-room");
        if (createRoomBtn) {
            var isEnNow = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (isGuest) {
                createRoomBtn.innerHTML = isEnNow ? "🔒 Create New Online Room (Sign-in required)" : "🔒 Založit novou Online místnost (vyžaduje přihlášení)";
                createRoomBtn.style.borderColor = "rgba(212,175,55,0.45)";
                createRoomBtn.style.color = "var(--gold-light)";
                createRoomBtn.title = isEnNow ? "As a Guest you can join a friend's table via 6-digit code. Sign in to host a table." : "Jako Host se můžeš připojit ke stolu kamaráda přes 6místný kód. Pro založení nového stolu se přihlas.";
            } else {
                createRoomBtn.innerHTML = isEnNow ? "☁️ Create New Online Room & get friend invite code" : "☁️ Založit novou Online místnost a získat kód pro přátele";
                createRoomBtn.style.borderColor = "#38bdf8";
                createRoomBtn.style.color = "#bae6fd";
                createRoomBtn.title = isEnNow ? "Creates a new online game and generates a 6-digit invite code" : "Založí novou online hru a vygeneruje 6místný kód pro přátele";
            }
        }

        // 7. Rodový erb rytíře v herně
        this.updateGameHallCrestUI();

        // 8. Aktualizace posledních rozehraných / uložených výprav
        if (typeof this.updateSavedGamesUI === "function") {
            this.updateSavedGamesUI();
        }
        if (this.activeGameHallRoom === "saves" && typeof this.renderSavedGamesList === "function") {
            this.renderSavedGamesList();
        }
    },

    updateGameHallCrestUI: function () {
        var crestInfo = this.getPlayerCrest();
        var crestWrap = document.getElementById("gamehall-crest-wrap");
        if (crestWrap && window.PRS_renderCrestBadgeHTML) {
            crestWrap.innerHTML = window.PRS_renderCrestBadgeHTML(crestInfo.crestId, crestInfo.tincture, 34);
        }
        var setCrestPreview = document.getElementById("settings-crest-preview");
        if (setCrestPreview && window.PRS_renderCrestBadgeHTML) {
            var cObj = window.PRS_getCrestById(crestInfo.crestId);
            var tObj = window.PRS_getTinctureByKey(crestInfo.tincture);
            setCrestPreview.innerHTML = window.PRS_renderCrestBadgeHTML(crestInfo.crestId, crestInfo.tincture, 44) +
                '<div style="margin-left:0.5rem;"><div style="font-weight:700; color:' + tObj.text + '; font-size:0.92rem;">' + this.escapeHtml(cObj.name) + '</div>' +
                '<div style="font-size:0.75rem; color:#cbd5e1; font-style:italic;">„' + this.escapeHtml(cObj.motto) + '“</div></div>';
        }
    },

    getPlayerCrest: function () {
        var crestId = "lion";
        var tincture = "gold";
        try {
            crestId = localStorage.getItem("kidesky_player_crest_id") || "lion";
            tincture = localStorage.getItem("kidesky_player_crest_tincture") || "gold";
        } catch (e) { }
        return { crestId: crestId, tincture: tincture };
    },

    setPlayerCrest: function (crestId, tincture) {
        crestId = crestId || "lion";
        tincture = tincture || "gold";
        try {
            localStorage.setItem("kidesky_player_crest_id", crestId);
            localStorage.setItem("kidesky_player_crest_tincture", tincture);
        } catch (e) { }
        this.updateGameHallCrestUI();
        if (this.state && this.state.players) {
            var myIdx = (typeof this.myOnlinePlayerIndex === "number") ? this.myOnlinePlayerIndex : 0;
            if (this.state.players[myIdx]) {
                this.state.players[myIdx].crestId = crestId;
                this.state.players[myIdx].crestColor = tincture;
            }
        }
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].crestId = crestId;
            this.lobbyPlayers[0].crestColor = tincture;
        }
    },

    openCrestPickerModal: function () {
        var modal = document.getElementById("crest-picker-modal");
        if (!modal) return;
        var cur = this.getPlayerCrest();
        this._pickerSelectedCrest = cur.crestId;
        this._pickerSelectedTincture = cur.tincture;
        this.renderCrestPickerModal();
        modal.style.display = "flex";
        this.updateBodyModalClass();
    },

    closeCrestPickerModal: function () {
        var modal = document.getElementById("crest-picker-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    selectCrestInPicker: function (crestId) {
        this._pickerSelectedCrest = crestId;
        this.renderCrestPickerModal();
    },

    selectTinctureInPicker: function (tKey) {
        this._pickerSelectedTincture = tKey;
        this.renderCrestPickerModal();
    },

    confirmCrestSelection: function () {
        var cId = this._pickerSelectedCrest || "lion";
        var tKey = this._pickerSelectedTincture || "gold";
        this.setPlayerCrest(cId, tKey);
        this.closeCrestPickerModal();
        if (window.PRS_Audio && typeof window.PRS_Audio.playItem === "function") {
            window.PRS_Audio.playItem();
        }
    },

    renderCrestPickerModal: function () {
        var grid = document.getElementById("crest-picker-grid");
        var tincturesWrap = document.getElementById("crest-tinctures-strip");
        var previewWrap = document.getElementById("crest-live-preview-box");
        if (!grid || !window.PRS_HERALDRY_CATALOG) return;

        var curCrest = this._pickerSelectedCrest || "lion";
        var curTincture = this._pickerSelectedTincture || "gold";
        var isEnCrest = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var getCrestName = function (cr) {
            return (window.PRS_I18n ? window.PRS_I18n.t("crest.names." + cr.id) : "") || cr.name;
        };
        var getCrestMotto = function (cr) {
            return (window.PRS_I18n ? window.PRS_I18n.t("crest.mottos." + cr.id) : "") || cr.motto;
        };
        var getTinctureName = function (tc) {
            return (window.PRS_I18n ? window.PRS_I18n.t("crest.tinctures." + tc.key) : "") || tc.name;
        };

        // 1. Grid of crests
        var htmlGrid = [];
        for (var i = 0; i < window.PRS_HERALDRY_CATALOG.length; i++) {
            var cr = window.PRS_HERALDRY_CATALOG[i];
            var isSel = (cr.id === curCrest);
            var crName = getCrestName(cr);
            var crMotto = getCrestMotto(cr);
            htmlGrid.push(
                '<div class="crest-card-opt ' + (isSel ? 'selected' : '') + '" onclick="PRS_App.selectCrestInPicker(\'' + cr.id + '\')">' +
                '  <div style="font-size:2rem; margin-bottom:2px;">' + cr.icon + '</div>' +
                '  <div style="font-family:\'Cinzel\',serif; font-size:0.82rem; font-weight:700; color:' + (isSel ? '#fef08a' : '#e2e8f0') + ';">' + this.escapeHtml(crName) + '</div>' +
                '  <div style="font-size:0.68rem; color:#94a3b8; line-height:1.2;">' + this.escapeHtml(crMotto) + '</div>' +
                '</div>'
            );
        }
        grid.innerHTML = htmlGrid.join("\n");

        // 2. Tinctures
        if (tincturesWrap && window.PRS_HERALDRY_TINCTURES) {
            var htmlTinc = [];
            for (var t = 0; t < window.PRS_HERALDRY_TINCTURES.length; t++) {
                var tc = window.PRS_HERALDRY_TINCTURES[t];
                var isTSel = (tc.key === curTincture);
                htmlTinc.push(
                    '<div class="crest-tincture-swatch ' + (isTSel ? 'selected' : '') + '" style="background:' + tc.bg + '; border-color:' + (isTSel ? '#fff' : tc.border) + ';" onclick="PRS_App.selectTinctureInPicker(\'' + tc.key + '\')" title="' + this.escapeHtml(getTinctureName(tc)) + '"></div>'
                );
            }
            tincturesWrap.innerHTML = htmlTinc.join("\n");
        }

        // 3. Live preview
        if (previewWrap && window.PRS_renderCrestBadgeHTML) {
            var cObj = window.PRS_getCrestById(curCrest);
            var tObj = window.PRS_getTinctureByKey(curTincture);
            previewWrap.innerHTML =
                '<div style="display:flex; align-items:center; gap:1.1rem; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:0.75rem 1.15rem;">' +
                '  ' + window.PRS_renderCrestBadgeHTML(curCrest, curTincture, 52) +
                '  <div>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.1rem; font-weight:700; color:' + tObj.text + ';">' + this.escapeHtml(cObj.name) + '</div>' +
                '    <div style="font-size:0.8rem; color:#fde68a; font-style:italic; margin-top:2px;">„' + this.escapeHtml(cObj.motto) + '“</div>' +
                '    <div style="font-size:0.72rem; color:#94a3b8; margin-top:3px;">Heraldická tinktura: <strong>' + this.escapeHtml(tObj.name) + '</strong></div>' +
                '  </div>' +
                '</div>';
        }
    },

    resetActiveGameSessionForLogout: function () {
        if (this.autoBotTimer) {
            clearTimeout(this.autoBotTimer);
            this.autoBotTimer = null;
        }
        if (typeof this.stopTurnTimer === "function") {
            this.stopTurnTimer();
        }
        this.hasGameStarted = false;
        this.state = null;
        this.selectedNodeId = null;
        this.isMoveAnimating = false;
        this.animatingPlayerIndex = null;
        this.animTokenPos = null;
        this.victoryModalShown = false;
        this.myOnlinePlayerIndex = 0;

        if (typeof this.clearActiveGameAutosave === "function") {
            this.clearActiveGameAutosave();
        } else {
            try {
                localStorage.removeItem("prs_active_autosave");
                sessionStorage.removeItem("prs_active_tab");
            } catch (e) { }
        }
        try { localStorage.removeItem("prs_active_online_room"); } catch (e2) { }
        try { localStorage.removeItem("prs_saved_game"); } catch (e3) { }
        try { localStorage.setItem("prs_last_logout_ts", String(Date.now())); } catch (e4) { }
        try {
            var slotKeys = [];
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (k && k.indexOf("prs_slot_") === 0) slotKeys.push(k);
            }
            for (var j = 0; j < slotKeys.length; j++) {
                localStorage.removeItem(slotKeys[j]);
            }
        } catch (e5) { }
        try {
            if (window.location && window.location.search && window.location.search.indexOf("room=") !== -1 && window.history && window.history.replaceState) {
                window.history.replaceState(null, "", window.location.pathname);
            }
        } catch (e6) { }
        if (typeof this.closeAllModals === "function") {
            this.closeAllModals();
        }
    },

    logoutUser: function () {
        if (window.PRS_Api) {
            window.PRS_Api.post("logout", {}, { silentAuth: true }).catch(function (err) { console.warn("[KiDesky] logout request failed:", err); });
            window.PRS_Api.clearAuthToken();
        }
        this.resetActiveGameSessionForLogout();
        this.setGuestMode();
        if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
        if (typeof this.closeAuthModal === "function") this.closeAuthModal();
        this.updateUserUI();
        if (typeof this.updateResumeGameButtonUI === "function") this.updateResumeGameButtonUI();
        if (typeof this.updateSavedGamesUI === "function") this.updateSavedGamesUI();
        if (this.activeTab && this.activeTab !== "welcome" && this.activeTab !== "rules" && this.activeTab !== "lobby" && typeof this.switchTab === "function") {
            this.switchTab("welcome");
        }
        var outMsg = window.PRS_I18n ? window.PRS_I18n.t("auth.logout_success") : "Byl jsi úspěšně odhlášen. Nyní pokračuješ volně v režimu Hosta."; if (window.KiDeskyToast) { KiDeskyToast.show(outMsg, "info"); } else { alert(outMsg); }
    },

    handleSessionExpired: function () {
        if (window.PRS_Api && typeof window.PRS_Api.clearAuthToken === "function") {
            window.PRS_Api.clearAuthToken();
        }
        if (typeof this.setGuestMode === "function") {
            this.setGuestMode();
        } else {
            this.currentUser = { id: null, username: "Host", displayName: "Host", role: "Guest", credits: 0, selectedPawnId: "knight_valiant", token: null };
            this.userCredits = 0;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
        }
        try { localStorage.removeItem("prs_active_online_room"); } catch (e2) { }
        this.updateUserUI();
        if (typeof this.updateResumeGameButtonUI === "function") this.updateResumeGameButtonUI();
        if (typeof this.updateSavedGamesUI === "function") this.updateSavedGamesUI();
        if (this.activeTab === "admin" && typeof this.switchTab === "function") {
            this.switchTab("welcome");
        }
        var expMsg = (window.PRS_I18n ? window.PRS_I18n.t("auth.session_expired") : "Tvoje přihlášení vypršelo nebo je potřeba ho obnovit. Přihlas se prosím znovu.");
        if (window.KiDeskyToast) {
            KiDeskyToast.show(expMsg, "warning");
        } else if (typeof this.showToast === "function") {
            this.showToast(expMsg, "warning");
        }
    },

    showAuthLoginForm: function () {
        var loggedView = document.getElementById("auth-logged-view");
        var guestView = document.getElementById("auth-guest-view");
        if (loggedView) loggedView.style.display = "none";
        if (guestView) guestView.style.display = "block";
    },

    saveProfileNickname: function () {
        var input = document.getElementById("auth-profile-displayname-input");
        if (!input) return;
        var newNick = input.value.trim();
        if (!newNick) return;
        if (this.currentUser && this.currentUser.role !== "Guest") {
            this.currentUser.displayName = newNick;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
            PRS_Api.post("update_nickname", { displayName: newNick }).catch(function (err) { console.warn("[KiDesky] saveProfileNickname failed:", err); });
        }
        try { localStorage.setItem("prs_player_nickname", newNick); } catch (e) { }
        this.updateUserUI();
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = this.getDefaultPlayerName();
            this.renderLobbyPlayers();
        }
        alert("Rytířské jméno bylo uloženo: " + newNick);
    },

    // --- KRÁLOVSKÁ ŠATNA A KLENOTNICE FIGUREK (#pawn-shop-modal) ---
    isPawnUnlocked: function (pawnId) {
        var pObj = window.PRS_getPawnById ? window.PRS_getPawnById(pawnId) : null;
        if (!pObj) return false;

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            // Host má k dispozici VÝHRADNĚ 6 základních bezplatných rytířů
            return pObj.category === "basic";
        }

        // Administrátor má odemčeny všechny figurky v království
        if (this.currentUser && this.currentUser.role === "Admin") {
            return true;
        }

        // Běžný přihlášený hráč: základní jsou zdarma, ostatní podle profilu
        if (pObj.category === "basic") return true;

        return Array.isArray(this.unlockedPawns) && this.unlockedPawns.indexOf(pawnId) !== -1;
    },

    openPawnShopModal: function (slotIdx) {
        if (typeof slotIdx === "number" && slotIdx >= 0) {
            this.pawnPickerTargetSlot = slotIdx;
        } else {
            this.pawnPickerTargetSlot = 0;
        }
        var modal = document.getElementById("pawn-shop-modal");
        if (!modal) return;
        this.renderPawnShopModal();
        modal.style.display = "flex";
        this.updateBodyModalClass();
    },

    closePawnShopModal: function () {
        var modal = document.getElementById("pawn-shop-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    setPawnShopCategory: function (cat) {
        this.pawnShopActiveCategory = cat || "all";
        this.renderPawnShopModal();
    },

    renderPawnShopModal: function () {
        var grid = document.getElementById("pawn-shop-grid");
        var credEl = document.getElementById("pawn-shop-credits-val");
        var slotInfoEl = document.getElementById("pawn-shop-slot-info");
        if (!grid) return;

        var isEn = (typeof window !== "undefined" && window.PRS_I18n && window.PRS_I18n.getLanguage() === "en");

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            this.userCredits = 0;
        }

        if (credEl) credEl.textContent = String(this.userCredits || 0);

        var slotIdx = this.pawnPickerTargetSlot || 0;
        var targetPlayer = (this.lobbyPlayers && this.lobbyPlayers[slotIdx]) ? this.lobbyPlayers[slotIdx] : null;
        var currentPawnId = targetPlayer ? (targetPlayer.pawnId || this.selectedPawnId) : this.selectedPawnId;

        if (slotInfoEl) {
            if (isGuest) {
                slotInfoEl.innerHTML = isEn
                    ? '👤 Playing as <strong>Guest</strong>: <strong>6 basic knights</strong> are available for free. Premium figures and crystals 💎 are for registered accounts.'
                    : '👤 Hraješ jako <strong>Host</strong>: máš zdarma k dispozici <strong>6 základních rytířů</strong>. Prémiové figurky a krystaly 💎 jsou pro přihlášené účty.';
            } else if (targetPlayer) {
                var pName = this.getPlayerDisplayName ? this.getPlayerDisplayName(targetPlayer) : targetPlayer.name;
                slotInfoEl.innerHTML = isEn
                    ? ('Selecting pawn for slot <strong>#' + (slotIdx + 1) + ': ' + this.escapeHtml(pName) + '</strong>')
                    : ('Vybíráš figurku pro slot <strong>#' + (slotIdx + 1) + ': ' + this.escapeHtml(pName) + '</strong>');
            } else {
                slotInfoEl.innerHTML = isEn ? 'Selecting your primary personal pawn' : 'Vybíráš svou hlavní osobní figurku';
            }
        }

        var cat = this.pawnShopActiveCategory || "all";
        var tabs = ["all", "basic", "premium", "bot"];
        for (var t = 0; t < tabs.length; t++) {
            var btn = document.getElementById("pawn-tab-" + tabs[t]);
            if (btn) {
                if (tabs[t] === cat) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }

        var catalog = window.PRS_PAWNS_CATALOG || [];
        var html = [];
        for (var i = 0; i < catalog.length; i++) {
            var pw = catalog[i];
            if (cat !== "all" && pw.category !== cat) continue;

            var unlocked = this.isPawnUnlocked(pw.id);
            var isSelected = (currentPawnId === pw.id);
            var isPrem = (pw.category === "premium");
            var isBot = (pw.category === "bot");

            var catBadge = "";
            if (isPrem) {
                catBadge = '<span class="pawn-card-badge premium">' + (isEn ? '💎 Premium' : '💎 Prémiová') + '</span>';
            } else if (isBot) {
                catBadge = '<span class="pawn-card-badge bot">🤖 PC Bot</span>';
            } else {
                catBadge = '<span class="pawn-card-badge basic">' + (isEn ? '🛡️ Basic' : '🛡️ Základní') + '</span>';
            }

            var actionBtn = "";
            if (isSelected) {
                actionBtn = '<button type="button" class="btn-gold-lg" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border-color:#86efac;">' + (isEn ? '✅ Currently Selected' : '✅ Právě zvoleno') + '</button>';
            } else if (unlocked) {
                actionBtn = '<button type="button" class="btn-secondary" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.selectPawnForSlot(&quot;' + pw.id + '&quot;)">' + (isEn ? '🎭 Select Pawn' : '🎭 Zvolit figurku') + '</button>';
            } else if (isGuest) {
                actionBtn = '<button type="button" class="btn-secondary" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; opacity:0.85; border-color:rgba(212,175,55,0.4);" onclick="PRS_App.unlockPremiumPawn(&quot;' + pw.id + '&quot;)">' + (isEn ? '🔒 For Registered' : '🔒 Pro přihlášené') + '</button>';
            } else {
                var canAfford = (this.userCredits >= pw.priceCredits);
                actionBtn = '<button type="button" class="btn-gold-lg" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; ' + (!canAfford ? 'opacity:0.65;' : '') + '" onclick="PRS_App.unlockPremiumPawn(&quot;' + pw.id + '&quot;)">' + (isEn ? ('🔓 Unlock (' + pw.priceCredits + ' 💎)') : ('🔓 Odemknout (' + pw.priceCredits + ' 💎)')) + '</button>';
            }

            var statusBadge = "";
            if (unlocked) {
                statusBadge = '<span style="font-size:0.72rem; color:#86efac;">' + (isEn ? '✓ Unlocked' : '✓ Odemčeno') + '</span>';
            } else if (isBot) {
                statusBadge = '<span style="font-size:0.72rem; color:#9ca3af;">' + (isEn ? '🔒 PC Only' : '🔒 Pouze pro PC') + '</span>';
            } else {
                statusBadge = '<span style="font-size:0.74rem; color:#fde047; font-weight:700;">🔒 ' + (pw.priceCredits || 150) + ' 💎</span>';
            }

            var pName = (isEn && pw.nameEn) ? pw.nameEn : pw.name;
            var pTitle = (isEn && pw.titleEn) ? pw.titleEn : (pw.title || "");
            var pDesc = (isEn && pw.descEn) ? pw.descEn : (pw.desc || "");

            html.push('<div class="pawn-shop-card ' + (isSelected ? 'selected' : '') + ' ' + (isPrem ? 'premium-card' : '') + '" style="border-color:' + (isSelected ? '#22c55e' : (isPrem ? pw.accentColor : 'rgba(212,175,55,0.3)')) + ';">');
            html.push('  <div class="pawn-card-top">' + catBadge + statusBadge + '</div>');
            html.push('  <div class="pawn-card-figure-wrap" onclick="PRS_App.selectPawnOrUnlock(&quot;' + pw.id + '&quot;)">');
            html.push('    <div class="pawn-card-aura" style="background:radial-gradient(circle, ' + (pw.accentColor || '#d4af37') + ' 0%, transparent 70%);"></div>');
            html.push('    <img src="' + pw.img + '" alt="' + this.escapeHtml(pName) + '" class="pawn-card-img"/>');
            html.push('  </div>');
            html.push('  <div class="pawn-card-name">' + this.escapeHtml(pName) + '</div>');
            html.push('  <div class="pawn-card-title">' + this.escapeHtml(pTitle) + '</div>');
            html.push('  <div class="pawn-card-desc">' + this.escapeHtml(pDesc) + '</div>');
            html.push('  <div class="pawn-card-action">' + actionBtn + '</div>');
            html.push('</div>');
        }
        grid.innerHTML = html.join("\n");
    },

    selectPawnOrUnlock: function (pawnId) {
        if (this.isPawnUnlocked(pawnId)) {
            this.selectPawnForSlot(pawnId);
        } else {
            this.unlockPremiumPawn(pawnId);
        }
    },

    selectPawnForSlot: function (pawnId) {
        if (!this.isPawnUnlocked(pawnId)) {
            this.unlockPremiumPawn(pawnId);
            return;
        }
        var slotIdx = this.pawnPickerTargetSlot || 0;
        if (this.lobbyPlayers && this.lobbyPlayers[slotIdx]) {
            this.lobbyPlayers[slotIdx].pawnId = pawnId;
        }
        if (slotIdx === 0) {
            this.selectedPawnId = pawnId;
            try { localStorage.setItem("prs_selected_pawn", pawnId); } catch (e) { }
            if (this.currentUser) {
                this.currentUser.selectedPawnId = pawnId;
                try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
                if (this.currentUser.role !== "Guest" && this.currentUser.username) {
                    PRS_Api.post("save-user-pawn", { selectedPawnId: pawnId }).catch(function (err) { console.warn("[KiDesky] save-user-pawn failed:", err); });
                }
            }
        }
        // Pokud už běží partie, aktualizujeme figurku i v živé hře!
        if (this.state && this.state.players && this.state.players[slotIdx]) {
            if (!this.state.roomCode || this.myOnlinePlayerIndex === slotIdx || slotIdx === 0) {
                var targetLiveIdx = (this.state.roomCode && this.myOnlinePlayerIndex >= 0) ? this.myOnlinePlayerIndex : slotIdx;
                if (this.state.players[targetLiveIdx]) {
                    this.state.players[targetLiveIdx].pawnId = pawnId;
                    this.renderGameScreen();
                    if (this.state.roomCode && this.saveCurrentSessionToCloud) {
                        this.saveCurrentSessionToCloud();
                    }
                }
            }
        }
        this.renderLobbyPlayers();
        this.renderPawnShopModal();
        if (this.renderOnlineRolePawnPicker) this.renderOnlineRolePawnPicker();
    },

    awardCredits: function (amount, reason, isWin) {
        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            // Host nezískává krystaly (krystaly 💎 jsou vyhrazeny pro registrované rytíře)
            this.userCredits = 0;
            return;
        }
        if (typeof amount !== "number" || amount <= 0) return;
        this.userCredits = (this.userCredits || 0) + amount;

        if (this.currentUser) {
            this.currentUser.credits = this.userCredits;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }

            if (this.currentUser.role !== "Guest" && this.currentUser.username) {
                var self = this;
                PRS_Api.post("award-credits", {
                    amount: amount,
                    isWin: !!isWin
                })
                .then(function (res) {
                    if (res && res.ok && typeof res.credits === "number") {
                        self.userCredits = res.credits;
                        self.currentUser.credits = res.credits;
                        try { localStorage.setItem("prs_user", JSON.stringify(self.currentUser)); } catch (e2) { }
                        self.updateUserUI();
                    }
                })
                .catch(function (err) { console.warn("[KiDesky] award-credits failed:", err); });
            }
        }
        this.updateUserUI();
    },

    unlockPremiumPawn: async function (pawnId) {
        var self = this;
        var pw = window.PRS_getPawnById ? window.PRS_getPawnById(pawnId) : null;
        if (!pw) return;
        if (this.isPawnUnlocked(pawnId)) {
            this.selectPawnForSlot(pawnId);
            return;
        }

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            alert("🔒 Tato figurka je uzamčena pro registrované rytíře.\n\nJako Host máš zdarma k dispozici 6 základních rytířů a 0 krystalů (💎).\n\nChceš-li získávat krystaly za vítězství a odemykat prémiové šampiony se speciální aurou, stačí se bezplatně přihlásit nebo zaregistrovat!");
            this.openAuthModal();
            return;
        }

        if (pw.category === "bot") {
            alert("🤖 Figurky PC Botů jsou vyhrazeny pro počítačové soupeře u stolu.");
            return;
        }

        var price = pw.priceCredits || 150;
        if (this.userCredits < price) {
            alert("Nemáš dostatek kreditů (💎) k odemčení této prémiové figurky!\n\nPotřebuješ: " + price + " 💎\nTvůj zůstatek: " + this.userCredits + " 💎\n\nTip: Kredity získáš za vítězství v partiích nebo od správce v administraci.");
            return;
        }
        var conf = await KiDeskyDialog.confirm("Přeješ si trvale odemknout sběratelskou prémiovou figurku:\n\n✨ " + pw.name + " (" + pw.title + ")\nCena: " + price + " 💎 kreditů?", {
            title: "Odemknutí šampiona",
            icon: "💎",
            confirmText: "💎 Odemknout figurku",
            cancelText: "Zpět"
        });
        if (!conf) return;

        this.userCredits -= price;
        if (!Array.isArray(this.unlockedPawns)) this.unlockedPawns = [];
        if (this.unlockedPawns.indexOf(pawnId) === -1) this.unlockedPawns.push(pawnId);

        if (this.currentUser) {
            this.currentUser.credits = this.userCredits;
            this.currentUser.unlockedPawnsJson = JSON.stringify(this.unlockedPawns);
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }

            if (this.currentUser.role !== "Guest" && this.currentUser.username) {
                PRS_Api.post("unlock-pawn", {
                    pawnId: pawnId
                })
                .then(function (res) {
                    if (res && res.ok) {
                        if (typeof res.credits === "number") {
                            self.userCredits = res.credits;
                            self.currentUser.credits = res.credits;
                        }
                        if (res.unlockedPawnsJson) {
                            self.currentUser.unlockedPawnsJson = res.unlockedPawnsJson;
                            try { self.unlockedPawns = JSON.parse(res.unlockedPawnsJson); } catch (e2) { console.warn("[KiDesky] Invalid unlockedPawnsJson response:", e2); }
                        }
                        try { localStorage.setItem("prs_user", JSON.stringify(self.currentUser)); } catch (e3) { }
                        self.updateUserUI();
                        self.renderPawnShopModal();
                    }
                })
                .catch(function (err) { console.warn("[KiDesky] unlock-pawn failed:", err); });
            }
        }

        if (window.PRS_Audio && window.PRS_Audio.playFanfare) window.PRS_Audio.playFanfare();
        this.updateUserUI();
        this.selectPawnForSlot(pawnId);
    },

    // --- RYTÍŘSKÉ STATISTIKY & SÍŇ SLÁVY (ETAPA 4) ---
    recordGameStats: function (statsPayload) {
        if (!statsPayload) return;
        if (!this.currentUser || this.currentUser.role === "Guest" || !window.PRS_Api || !window.PRS_Api.getAuthToken()) return;
        var self = this;

        PRS_Api.post("record-game-stats", {
            isWin: !!statsPayload.isWin,
            hearts: statsPayload.hearts || 0,
            dragons: statsPayload.dragons || 0,
            castles: statsPayload.castles || 0,
            herds: statsPayload.herds || 0,
            festivalHearts: statsPayload.festivalHearts || 0
        })
        .then(function (res) {
            if (res && res.ok && res.stats) {
                if (self.currentUser) {
                    self.currentUser.gamesPlayed = res.stats.gamesPlayed;
                    self.currentUser.gamesWon = res.stats.gamesWon;
                    self.currentUser.dragonsSlain = res.stats.dragonsSlain;
                    self.currentUser.totalHeartsEarned = res.stats.totalHeartsEarned;
                    self.currentUser.highestScore = res.stats.highestScore;
                    self.currentUser.achievementsJson = JSON.stringify(res.stats.achievements);
                    try { localStorage.setItem("prs_user", JSON.stringify(self.currentUser)); } catch (e) { }
                }
                if (res.stats.newlyUnlocked && res.stats.newlyUnlocked.length > 0) {
                    var names = {
                        first_game: "🥉 První krok",
                        slayer: "🐉 Drakobijce",
                        castle_lord: "🏰 Pán hradů",
                        breeder: "🐎 Velkochovatel",
                        ball_master: "💃 Mistr bálů",
                        champion: "👑 Královský vítěz",
                        grandmaster: "🌟 Dračí legenda"
                    };
                    var unlNames = res.stats.newlyUnlocked.map(function (k) { return names[k] || k; }).join(", ");
                    if (window.PRS_Audio) window.PRS_Audio.playFanfare();
                    setTimeout(function () {
                        KiDeskyDialog.alert("Gratulujeme! Získal jsi nový královský odznak:<br><br><strong style='color:#fde68a; font-size:1.15rem;'>" + self.escapeHtml(unlNames) + "</strong><br><br>Najdeš ho ve své Rytířské síni slávy.", {
                            title: "Nový královský odznak",
                            icon: "🏆",
                            allowHtml: true
                        });
                    }, 1200);
                }
            }
        })
        .catch(function (err) { console.warn("[KiDesky] record-game-stats failed:", err); });
    },

    openAchievementsModal: function () {
        var m = document.getElementById("achievements-modal");
        if (!m) return;
        m.style.display = "flex";
        this.renderAchievementsModalContent();
    },

    closeAchievementsModal: function () {
        var m = document.getElementById("achievements-modal");
        if (m) m.style.display = "none";
    },

    
    getItemDisplayName: function (it) {
        if (!it) return "";
        var id = (typeof it === "string") ? it : (it.id || it.code || "");
        if (window.PRS_I18n) {
            if (id) {
                var trItem = window.PRS_I18n.t("items." + id + ".name");
                if (trItem && trItem !== ("items." + id + ".name")) return trItem;
                var trTrophy = window.PRS_I18n.t("trophies." + id + ".name");
                if (trTrophy && trTrophy !== ("trophies." + id + ".name")) return trTrophy;
            }
        }
        return (typeof it === "object" && it.name) ? it.name : id;
    },

    getNodeDisplayName: function (node) {
        if (!node) return "";
        if (this._inGetNodeDisplayName) return node.name || node.code || "";
        this._inGetNodeDisplayName = true;
        try {
            return this.getUnifiedNodeDisplayName(node);
        } finally {
            this._inGetNodeDisplayName = false;
        }
    },

    getUnifiedNodeDisplayName: function (node) {
        if (!node) return "";
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        if (!isEn) return node.name || node.code || "";

        var type = node.type;
        var name = node.name || "";
        var code = node.code || "";

        if (type === "START" || code === "START") {
            return "Royal Castle Start";
        }

        if (type === "ANIMAL") {
            var setId = node.setId || (code && code.match(/\d+/) ? parseInt(code.match(/\d+/)[0], 10) : 1);
            var subtype = node.subtype || "";
            var animalType = (subtype === "horse" || code.startsWith("K")) ? "Horse" : ((subtype === "dog" || code.startsWith("P")) ? "Dog" : "Falcon");
            var breedsEn = {
                1: { horse: "Dapple Gray", falcon: "Kestrel", dog: "Pointer" },
                2: { horse: "Bay Horse", falcon: "Sparrowhawk", dog: "Beagle" },
                3: { horse: "Black Steed", falcon: "Hobby", dog: "Greyhound" },
                4: { horse: "Chestnut", falcon: "Saker", dog: "Bloodhound" },
                5: { horse: "White Steed", falcon: "Royal Hobby", dog: "Tracker" },
                6: { horse: "Dun Horse", falcon: "Peregrine Falcon", dog: "Wolfhound" },
                7: { horse: "Dappled Gray", falcon: "Kite", dog: "Great Dane" },
                8: { horse: "Friesian", falcon: "Osprey", dog: "Hound King" },
                9: { horse: "Andalusian", falcon: "Goshawk", dog: "Hunting Hound" },
                10: { horse: "Warhorse", falcon: "Royal Falcon", dog: "Royal Hound" },
                11: { horse: "Star Stallion", falcon: "White Saker", dog: "Silver Pointer" },
                12: { horse: "Sovereign Steed", falcon: "Phoenix Falcon", dog: "Golden Hound" },
                13: { horse: "Golden Palomino", falcon: "Golden Eagle", dog: "Northern Wolfhound" },
                14: { horse: "Shadow Steed", falcon: "Night Falcon", dog: "Castle Gargoyle" }
            };
            var bInfo = breedsEn[setId] || breedsEn[1];
            var breedStr = (subtype === "horse" || code.startsWith("K")) ? bInfo.horse : ((subtype === "dog" || code.startsWith("P")) ? bInfo.dog : bInfo.falcon);
            return animalType + " " + setId + " (" + breedStr + ")";
        }

        if (type === "VILLAGE") {
            var vMap = {
                "Králova Lhota": "King's Lhota", "Lhotka": "Little Lhota", "Březová": "Birchwood", "Dubina": "Oak Vale",
                "Skalice": "Rockford", "Meziříčí": "Riverbend", "Slunečná": "Sunny", "Podhradí": "Castlefold",
                "Větrná": "Windy", "Zlatá Olešnice": "Golden Alder", "Rovensko": "Flatland", "Chlumec": "Hillcrest",
                "Lipnice": "Lindendale", "Studánka": "Springfield", "Osek": "Ashwood", "Hvozd": "Deep Forest",
                "Kamenice": "Stoney", "Jabloňov": "Applegrove", "Borová": "Pinewood", "Blatná": "Marshfield",
                "Dobříš": "Goodhaven", "Rožmitál": "Rosendale", "Třeboňsko": "Lakehurst", "Bystřička": "Brookside"
            };
            var match = name.match(/Vesnice\s+(\d+)\s*\(([^)]+)\)/);
            if (match) {
                var num = match[1];
                var czName = match[2];
                var enName = vMap[czName] || czName;
                return "Village " + num + " (" + enName + ")";
            }
            return name.replace(/^Vesnice/i, "Village");
        }

        if (type === "TOWN") {
            var tMap = {
                "Královo Pole": "King's Field", "Stříbratec": "Silverton", "Zlatov": "Goldtown", "Mečov": "Swordhaven",
                "Železný Brod": "Ironford", "Korunní Město": "Crown City", "Sokolov": "Falconreach", "Hvězdomír": "Starwatch",
                "Lví Brod": "Lionford", "Sluneční Hradec": "Sun Keep", "Velehrad": "Grand Stronghold", "Křišťálov": "Crystaltown",
                "Jantarové Město": "Amber City", "Bílý Kámen": "Whitestone"
            };
            var matchT = name.match(/Město\s+(\d+)\s*\(([^)]+)\)/);
            if (matchT) {
                var numT = matchT[1];
                var czNameT = matchT[2];
                var enNameT = tMap[czNameT] || czNameT;
                return "Town " + numT + " (" + enNameT + ")";
            }
            return name.replace(/^Město/i, "Town");
        }

        if (type === "CASTLE") {
            var cKey = node.castleKey || "";
            if (!cKey && node.castleImg) {
                var m = node.castleImg.match(/castle_([a-z0-9_]+?)(?:_flip)?\.(?:png|jpg)/i);
                if (m) cKey = m[1];
            }
            if (!cKey && node.estateId && node.estateId.indexOf("H") === 0) {
                cKey = "H" + node.estateId.replace("H", "");
            }
            var cName = (cKey && window.PRS_I18n) ? window.PRS_I18n.t("castles." + cKey + ".name") : "";
            if (cName && cName !== ("castles." + cKey + ".name")) {
                var prefix = isEn ? "Castle " : "Hrad ";
                var num = node.estateId ? node.estateId.replace("H", "") : (node.code ? node.code.replace("H", "") : "");
                return prefix + (num ? (num + " ") : "") + "(" + cName + ")";
            }

            var cMap = {
                "Doubrava": "Doubrava Castle",
                "Věčného mrazu": "Eternal Frost",
                "Lávový chřtán": "Lava Maw",
                "Ametyst": "Amethyst",
                "Boreas": "Boreas",
                "Oceán": "Ocean",
                "Pískovcový": "Sandstone",
                "Černá tůň": "Black Mere",
                "Erebus": "Erebus",
                "Královský hrad": "Royal Castle",
                "Královská citadela": "Royal Citadel"
            };
            var matchC = name.match(/Hrad\s+(\d+)\s*\(([^)]+)\)/);
            if (matchC) {
                var numC = matchC[1];
                var czC = matchC[2];
                for (var ck in cMap) {
                    if (czC.indexOf(ck) !== -1) return "Castle " + numC + " (" + cMap[ck] + ")";
                }
                return "Castle " + numC + " (" + czC + ")";
            }
            return name.replace(/^Hrad/i, "Castle");
        }

        if (type === "QUEST") {
            if (node.subtype === "U3") return "Dragon's Lair (U3)";
            if (node.subtype === "U2") return "Monster Den (U2)";
            if (node.subtype === "U1") return "Wild Beast Hunt (U1)";
            return name.replace(/^Úkol\b/i, "Quest");
        }

        if (type === "MASTER") {
            if (name.indexOf("Boje") !== -1) return "Master of Combat";
            if (name.indexOf("Jízdy") !== -1) return "Master of Riding";
            if (name.indexOf("Tance") !== -1) return "Master of Dance";
            if (name.indexOf("Charismatu") !== -1) return "Master of Charisma";
            if (name.indexOf("Velmistr") !== -1) return "Grandmaster";
            return name;
        }

        if (type === "BUILDING") {
            if (name.indexOf("stáje") !== -1) return "Royal Stables";
            if (name.indexOf("kovárna") !== -1) return "Guild Forge";
            if (name.indexOf("sokolník") !== -1) return "Royal Falconer";
            if (name.indexOf("Psovod") !== -1) return "Dog Handler & Pack";
            if (name.indexOf("krejčí") !== -1) return "Court Tailor";
            return name;
        }

        if (type === "FESTIVAL") {
            if (name.indexOf("Turnaj") !== -1) return "FESTIVAL: Royal Tournament ♡";
            if (name.indexOf("Ples") !== -1) return "FESTIVAL: Castle Ball ♡";
            if (name.indexOf("Závod") !== -1) return "FESTIVAL: Grand Race ♡";
            return name;
        }

        if (type === "JESTER") {
            return name.replace(/^Kejklíř/i, "Jester");
        }

        if (type === "TAX") return "Tax Collector";
        if (type === "MERCHANT") return "Royal Market";
        if (type === "CHANCE") return "Card of Chance";
        if (type === "PRISON") return "Royal Dungeon";
        if (type === "HOSPITAL") return "Royal Infirmary";
        if (type === "TAVERN") return "Golden Tankard Tavern";

        return name;
    },

    renderAchievementsModalContent: function () {
        var body = document.getElementById("achievements-modal-body");
        if (!body) return;
        var u = this.currentUser || { displayName: "Host", role: "Guest", credits: 0 };
        var played = u.gamesPlayed || 0;
        var won = u.gamesWon || 0;
        var dragons = u.dragonsSlain || 0;
        var hearts = u.totalHeartsEarned || 0;
        var highest = u.highestScore || 0;
        var achList = [];
        try {
            if (u.achievementsJson) achList = JSON.parse(u.achievementsJson);
        } catch (e) { console.warn("[KiDesky] Invalid achievementsJson:", e); }

        var badges = [
            { id: "first_game", icon: "🥉", title: "První krok", desc: "Zahraj svou první partii v království Princeznina srdce." },
            { id: "slayer", icon: "🐉", title: "Drakobijce", desc: "Skol obávaného draka v jeho nebezpečné sluji." },
            { id: "castle_lord", icon: "🏰", title: "Pán hradů", desc: "Postav alespoň 2 majestátní hrady na svých panstvích." },
            { id: "breeder", icon: "🐎", title: "Velkochovatel", desc: "Vlastni kompletní sadu koní a alespoň 3 stáda užitkového dobytka." },
            { id: "ball_master", icon: "💃", title: "Mistr bálů", desc: "Získej na jedněch Slavnostech přes 15 Princezniných srdcí." },
            { id: "champion", icon: "👑", title: "Královský vítěz", desc: "Zvítěz v partii a získej ruku princezny i královskou korunu." },
            { id: "grandmaster", icon: "🌟", title: "Dračí legenda", desc: "Dosáhni alespoň 3 slavných vítězství nebo skol 3 draky." }
        ];

        var activeTab = this._achievementsSubtab || "badges";
        var hist = [];
        try {
            hist = JSON.parse(localStorage.getItem("prs_game_history") || "[]");
        } catch (e) { }

        var html = '<div class="achievements-profile-header">' +
            '  <div class="achievements-avatar-badge">' + (u.role === "Admin" ? '👑' : '🛡️') + '</div>' +
            '  <div>' +
            '    <div style="font-family:\'Cinzel\',serif; font-size:1.25rem; font-weight:700; color:var(--gold-light);">' + this.escapeHtml(u.displayName || u.username || "Host") + '</div>' +
            '    <div style="font-size:0.8rem; color:#94a3b8; display:flex; gap:0.5rem; align-items:center; margin-top:0.15rem;">' +
            '      <span>Titul: <strong style="color:#fde68a;">' + (won >= 3 ? "Dračí velmistr" : (won >= 1 ? "Rytíř šampion" : "Čestný panoš")) + '</strong></span> • ' +
            '      <span>Pokladnice: <strong style="color:#38bdf8;">' + (u.credits || 0) + ' 💎</strong></span>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        html += '<div class="achievements-stats-grid">' +
            '  <div class="ach-stat-box"><div class="ach-stat-val">' + played + '</div><div class="ach-stat-lbl">Partií</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#22c55e;">' + won + '</div><div class="ach-stat-lbl">Vítězství</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#f97316;">' + dragons + '</div><div class="ach-stat-lbl">Draků</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#ec4899;">' + (Math.round(hearts * 10) / 10) + '</div><div class="ach-stat-lbl">Srdcí celkem</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#38bdf8;">' + (Math.round(highest * 10) / 10) + '</div><div class="ach-stat-lbl">Rekord partie</div></div>' +
            '</div>';

        // Přepínač podzáložek: Odznaky vs. Historie výprav
        html += '<div style="display:flex; gap:0.5rem; margin:1rem 0 0.85rem; border-bottom:1px solid rgba(212,175,55,0.25); padding-bottom:0.55rem;">' +
            '  <button type="button" class="rules-subnav-btn ' + (activeTab === "badges" ? "active" : "") + '" onclick="PRS_App.setAchievementsSubtab(\'badges\')" style="padding:0.35rem 0.85rem; font-size:0.84rem;">🏆 Královské odznaky (' + achList.length + ' / ' + badges.length + ')</button>' +
            '  <button type="button" class="rules-subnav-btn ' + (activeTab === "history" ? "active" : "") + '" onclick="PRS_App.setAchievementsSubtab(\'history\')" style="padding:0.35rem 0.85rem; font-size:0.84rem;">📜 Historie výprav (' + hist.length + ')</button>' +
            '</div>';

        if (activeTab === "history") {
            if (hist.length === 0) {
                html += '<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.9rem; background:rgba(0,0,0,0.25); border-radius:8px; border:1px dashed rgba(212,175,55,0.2);">' +
                    '  <div style="font-size:2rem; margin-bottom:0.4rem;">📜</div>' +
                    '  <strong style="color:var(--gold-light);">Žádná zaznamenaná historie partií</strong>' +
                    '  <div style="margin-top:0.25rem;">Odehraj partii na herním stole a tvoje výsledky i slavnostní diplomy se uloží sem do kroniky království.</div>' +
                    '</div>';
            } else {
                html += '<div style="display:flex; flex-direction:column; gap:0.75rem; max-height:48vh; overflow-y:auto; padding-right:0.35rem;">';
                for (var hi = hist.length - 1; hi >= 0; hi--) {
                    var hItem = hist[hi];
                    html += '<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(212,175,55,0.25); border-radius:8px; padding:0.75rem 0.95rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;">' +
                        '  <div>' +
                        '    <div style="display:flex; align-items:center; gap:0.45rem;">' +
                        '      <span style="font-size:1.1rem;">👑</span>' +
                        '      <strong style="color:' + (hItem.winnerColor || 'var(--gold-light)') + '; font-size:0.96rem;">' + (hItem.winnerBadge || '🛡️') + ' ' + this.escapeHtml(hItem.winnerName || 'Vítěz') + '</strong>' +
                        '      <span style="font-size:0.82rem; color:#ec4899; font-weight:700;">' + hItem.winnerHearts + ' 💖</span>' +
                        '    </div>' +
                        '    <div style="font-size:0.78rem; color:#94a3b8; margin-top:0.2rem;">' +
                        '      <span>📅 ' + this.escapeHtml(hItem.date) + '</span> • ' +
                        '      <span>🗺️ ' + this.escapeHtml(hItem.boardName) + '</span> • ' +
                        '      <span>⏳ ' + hItem.roundNumber + ' kol</span>' +
                        '    </div>' +
                        '  </div>' +
                        '  <button type="button" class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.65rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.openWinnerDiplomaModal(' + hi + ')">📜 Královský diplom</button>' +
                        '</div>';
                }
                html += '</div>';
            }
        } else {
            html += '<div class="achievements-badges-grid">';
            for (var bi = 0; bi < badges.length; bi++) {
                var b = badges[bi];
                var isUnl = achList.indexOf(b.id) !== -1;
                html += '<div class="ach-badge-card ' + (isUnl ? 'unlocked' : 'locked') + '">' +
                    '  <div class="ach-badge-icon">' + b.icon + '</div>' +
                    '  <div style="flex:1;">' +
                    '    <div class="ach-badge-title">' + b.title + '</div>' +
                    '    <div class="ach-badge-desc">' + b.desc + '</div>' +
                    '    <div class="ach-badge-status ' + (isUnl ? 'unlocked-tag' : 'locked-tag') + '">' + (isUnl ? (isEn ? '✨ Unlocked' : '✨ Odemčeno') : (isEn ? '🔒 Locked' : '🔒 Zamčeno')) + '</div>' +
                    '  </div>' +
                    '</div>';
            }
            html += '</div>';
        }

        body.innerHTML = html;
    },

    setAchievementsSubtab: function (tab) {
        this._achievementsSubtab = tab;
        this.renderAchievementsModalContent();
    },

    // --- KATALOG AUTORSKÝCH HER (ETAPA 5) ---
    openGameCatalogPreview: function (gameKey) {
        var m = document.getElementById("catalog-game-modal");
        if (!m) return;
        m.style.display = "flex";
        var body = document.getElementById("catalog-game-modal-body");
        if (!body) return;

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        if (gameKey === "dragon_dungeon") {
            var badgeText = isEn ? "🔨 In Development • KiDesky Edition" : "🔨 V přípravě • Edice KiDesky";
            var titleText = isEn ? "🐉 Conquest of Dragon Mountain" : "🐉 Dobytí Dračí Hory";
            var subtitleText = isEn ? "Cooperative dungeon crawler for 1–4 players" : "Kooperativní dungeon crawler pro 1–4 hráče";
            var pill1 = isEn ? "👥 1–4 Heroes (Co-op)" : "👥 1–4 Hrdinové (Kooperace)";
            var pill2 = isEn ? "⏱️ 60–90 minutes" : "⏱️ 60–90 minut";
            var pill3 = isEn ? "🗺️ Modular dungeon board" : "🗺️ Modulární podzemní deska";
            var pill4 = isEn ? "🎲 Tactical dice battles" : "🎲 Kostkové taktické souboje";
            var hStory = isEn ? "Story Background &amp; Rules" : "Příběhové pozadí &amp; Pravidla";
            var pStory = isEn
                ? "Deep within Black Rock, the ancient dragon Vermithrax has awakened and his minions infest the surrounding lands. Players are not rivals, but a united party of valiant heroes. Each player chooses a unique class: <strong>Warrior</strong> (tank & crushing strikes), <strong>Mage</strong> (area fire & lightning magic), <strong>Rogue</strong> (chest unlocking & critical hits), or <strong>Cleric</strong> (healing & sacred warding)."
                : "Hluboko v nitru Černé skály procitl prastarý drak Vermithrax a jeho služebníci zamořili okolní kraje. Hráči netvoří soupeře, nýbrž společnou družinu odvážných hrdinů. Každý hráč si volí unikátní třídu: <strong>Válečníka</strong> (tank a drtivé údery), <strong>Kouzelníka</strong> (plošná magie ohně a blesků), <strong>Zlodějku</strong> (odemykání truhel a kritické zásahy) nebo <strong>Klerika</strong> (léčení a posvátná ochrana).";
            var hMech = isEn ? "Game Mechanics" : "Herní mechaniky";
            var li1 = isEn ? "<strong>Modular dungeon:</strong> Each descent into the lair randomly generates new halls, traps, and relic chests." : "<strong>Modulární podzemí:</strong> Každé sestoupení do sluje náhodně generuje nové sály, pasti a truhly s relikviemi.";
            var li2 = isEn ? "<strong>Dragon boss fight:</strong> Multi-phase final encounter requiring coordinated team strategy." : "<strong>Boss fight s drakem:</strong> Vícefázový závěrečný souboj vyžadující sehranou týmovou strategii.";
            var li3 = isEn ? "<strong>Shared life pool:</strong> If one hero falls and is not revived in time, the entire quest fails!" : "<strong>Sdílená zásoba životů:</strong> Padne-li jeden hrdina a není včas oživen, celá výprava prohrává!";
            var btnSub = isEn ? "🔔 Follow Development &amp; Get Beta Access" : "🔔 Sledovat vývoj &amp; Získat přístup do Beta testu";
            var btnClose = isEn ? "Close Preview" : "Zavřít náhled";

            body.innerHTML = '<div class="catalog-modal-banner" style="background-image:linear-gradient(to top, rgba(10,7,4,0.95), rgba(10,7,4,0.2)), url(\'assets/landmarks/dragon.jpg\');">' +
                '  <div class="catalog-modal-banner-overlay"></div>' +
                '  <div style="position:relative; z-index:2;">' +
                '    <span class="lp-kicker-badge" style="background:rgba(249,115,22,0.25); border-color:#fb923c; color:#fed7aa;">' + badgeText + '</span>' +
                '    <h2 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.6rem; margin:0.35rem 0 0.15rem;">' + titleText + '</h2>' +
                '    <div style="font-size:0.85rem; color:#fde68a;">' + subtitleText + '</div>' +
                '  </div>' +
                '</div>' +
                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.1rem;">' +
                '  <span class="catalog-feature-pill">' + pill1 + '</span>' +
                '  <span class="catalog-feature-pill">' + pill2 + '</span>' +
                '  <span class="catalog-feature-pill">' + pill3 + '</span>' +
                '  <span class="catalog-feature-pill">' + pill4 + '</span>' +
                '</div>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">' + hStory + '</h4>' +
                '<p style="font-size:0.88rem; line-height:1.5; color:#cbd5e1; margin-bottom:0.9rem;">' + pStory + '</p>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">' + hMech + '</h4>' +
                '<ul style="font-size:0.86rem; line-height:1.5; color:#cbd5e1; margin-left:1.2rem; margin-bottom:1.2rem;">' +
                '  <li>' + li1 + '</li>' +
                '  <li>' + li2 + '</li>' +
                '  <li>' + li3 + '</li>' +
                '</ul>' +
                '<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">' +
                '  <button class="btn-gold-lg" style="flex:1; padding:0.65rem;" onclick="PRS_App.subscribeGameNewsletter(\'dragon_dungeon\')">' + btnSub + '</button>' +
                '  <button class="btn-secondary" style="padding:0.65rem 1rem;" onclick="PRS_App.closeGameCatalogPreview()">' + btnClose + '</button>' +
                '</div>';
        } else {
            var mBadgeText = isEn ? "📐 Draft Concept • KiDesky Edition" : "📐 Koncept v návrhu • Edice KiDesky";
            var mTitleText = isEn ? "⚖️ Merchants of the Realm" : "⚖️ Obchodníci Království";
            var mSubtitleText = isEn ? "Strategic economic board game for 2–5 merchants" : "Strategická ekonomická desková hra pro 2–5 kupců";
            var mPill1 = isEn ? "👥 2–5 Merchants" : "👥 2–5 Kupců";
            var mPill2 = isEn ? "⏱️ 45–75 minutes" : "⏱️ 45–75 minut";
            var mPill3 = isEn ? "⛵ Trade Routes &amp; Guilds" : "⛵ Obchodní stezky &amp; Cechy";
            var mPill4 = isEn ? "🪙 Market Price Fluctuation" : "🪙 Fluktuace tržních cen";
            var mHStory = isEn ? "Story Background &amp; Rules" : "Příběhové pozadí &amp; Pravidla";
            var mPStory = isEn
                ? "Vast empires are linked by caravan trails and naval convoys. As head of a merchant guild, you buy silk, amber, rare spices, and royal wines cheaply in harbors and sell them for multipliers in inland metropolises with high demand."
                : "Rozlehlé říše propojují karavanní stezky a námořní konvoje. Jako představený kupeckého cechu nakupuješ levně hedvábí, jantar, vzácné koření a královská vína v přístavech a prodáváš je za násobky ve vnitrozemských metropolích s vysokou poptávkou.";
            var mHMech = isEn ? "Game Mechanics" : "Herní mechaniky";
            var mLi1 = isEn ? "<strong>Dynamic supply &amp; demand market:</strong> As soon as a merchant floods a city with spices, the price drops for everyone!" : "<strong>Živý trh s nabídkou a poptávkou:</strong> Jakmile kupec zaplaví město kořením, jeho cena klesá pro všechny!";
            var mLi2 = isEn ? "<strong>Guild warehouse construction:</strong> Build trading posts along trade routes and collect toll fees from rivals." : "<strong>Výstavba cechovních skladů:</strong> Možnost stavět faktorie podél obchodních tras a vybírat celní poplatky od soupeřů.";
            var mLi3 = isEn ? "<strong>Pirates and robber knights:</strong> Travel risks mitigated by hiring mercenary escorts." : "<strong>Piráti a loupeživí rytíři:</strong> Riziko na cestách snižované najímáním žoldnéřských eskort.";
            var mBtnSub = isEn ? "🔔 Follow Development &amp; Get Beta Access" : "🔔 Sledovat vývoj &amp; Získat přístup do Beta testu";
            var mBtnClose = isEn ? "Close Preview" : "Zavřít náhled";

            body.innerHTML = '<div class="catalog-modal-banner" style="background-image:linear-gradient(to top, rgba(10,7,4,0.95), rgba(10,7,4,0.2)), url(\'assets/tiles/merchant.jpg\');">' +
                '  <div class="catalog-modal-banner-overlay"></div>' +
                '  <div style="position:relative; z-index:2;">' +
                '    <span class="lp-kicker-badge" style="background:rgba(56,189,248,0.25); border-color:#38bdf8; color:#bae6fd;">' + mBadgeText + '</span>' +
                '    <h2 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.6rem; margin:0.35rem 0 0.15rem;">' + mTitleText + '</h2>' +
                '    <div style="font-size:0.85rem; color:#bae6fd;">' + mSubtitleText + '</div>' +
                '  </div>' +
                '</div>' +
                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.1rem;">' +
                '  <span class="catalog-feature-pill">' + mPill1 + '</span>' +
                '  <span class="catalog-feature-pill">' + mPill2 + '</span>' +
                '  <span class="catalog-feature-pill">' + mPill3 + '</span>' +
                '  <span class="catalog-feature-pill">' + mPill4 + '</span>' +
                '</div>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">' + mHStory + '</h4>' +
                '<p style="font-size:0.88rem; line-height:1.5; color:#cbd5e1; margin-bottom:0.9rem;">' + mPStory + '</p>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">' + mHMech + '</h4>' +
                '<ul style="font-size:0.86rem; line-height:1.5; color:#cbd5e1; margin-left:1.2rem; margin-bottom:1.2rem;">' +
                '  <li>' + mLi1 + '</li>' +
                '  <li>' + mLi2 + '</li>' +
                '  <li>' + mLi3 + '</li>' +
                '</ul>' +
                '<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">' +
                '  <button class="btn-gold-lg" style="flex:1; padding:0.65rem;" onclick="PRS_App.subscribeGameNewsletter(\'merchants\')">' + mBtnSub + '</button>' +
                '  <button class="btn-secondary" style="padding:0.65rem 1rem;" onclick="PRS_App.closeGameCatalogPreview()">' + mBtnClose + '</button>' +
                '</div>';
        }
    },

    closeGameCatalogPreview: function () {
        var m = document.getElementById("catalog-game-modal");
        if (m) m.style.display = "none";
    },

    subscribeGameNewsletter: function (gameKey) {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var gName = (gameKey === "dragon_dungeon")
            ? (isEn ? "Conquest of Dragon Mountain" : "Dobytí Dračí Hory")
            : (isEn ? "Merchants of the Realm" : "Obchodníci Království");
        if (window.PRS_Audio) window.PRS_Audio.playCoin();
        var alertMsg = isEn
            ? ("Thank you for your interest in <strong>" + gName + "</strong>!<br><br>Your knight profile has been registered among priority applicants for the upcoming closed Beta testing.")
            : ("Děkujeme za tvůj zájem o hru <strong>" + gName + "</strong>!<br><br>Tvůj rytířský profil byl zaznamenán mezi přednostní zájemce pro nadcházející uzavřené Beta testování.");
        var alertTitle = isEn ? "Beta Testing Application Accepted" : "Přihláška k testování přijata";
        KiDeskyDialog.alert(alertMsg, {
            title: alertTitle,
            icon: "📜",
            allowHtml: true
        });
    }
    });
})();
