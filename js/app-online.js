// ============================================================================

// KiDesky: PRINCEZNINO SRDCE - Online multiplayer, synchronizace tahů a cloud ukládání

// ============================================================================

(function () {

    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {

        // --- AUTENTIZACE & UŽIVATELSKÝ PROFIL ---

openAuthModal: function () {

        var m = document.getElementById("auth-modal");

        if (m) {

            m.style.display = "flex";

            var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
            var loggedView = document.getElementById("auth-logged-view");
            var guestView = document.getElementById("auth-guest-view");
            if (loggedView && guestView) {
                loggedView.style.display = isGuest ? "none" : "block";
                guestView.style.display = isGuest ? "block" : "none";
            }

            var gNick = document.getElementById("auth-google-nickname");
            if (gNick) {
                var curNick = (this.currentUser && this.currentUser.displayName) || "";
                if (!curNick) {
                    try { curNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }
                }
                if (curNick && curNick.toLowerCase() !== "host" && curNick.toLowerCase() !== "admin" && curNick.indexOf("@") === -1) {
                    gNick.value = curNick;
                } else if (!gNick.value) {
                    gNick.value = "Lord Kikin";
                }
            }

            var pwd = document.getElementById("auth-password");

            if (pwd) pwd.type = "password";

            var btn = document.getElementById("btn-toggle-password");

            if (btn) btn.innerHTML = "👁️";

            if (window.google && window.google.accounts && window.google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: "335921016939-afepn3s6mpsep890pjr08bli6ufj0jub.apps.googleusercontent.com",
                        callback: window.PRS_handleGoogleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true,
                        ux_mode: "popup"
                    });
                    var gBox = document.getElementById("g_id_signin_box");
                    if (gBox) {
                        gBox.innerHTML = "";
                        google.accounts.id.renderButton(gBox, {
                            type: "standard",
                            shape: "rectangular",
                            theme: "outline",
                            text: "signin_with",
                            size: "large",
                            logo_alignment: "left"
                        });
                    }
                } catch (eGsi) {
                    console.warn("GSI modal init:", eGsi);
                }
            }

            this.updateBodyModalClass();

        }

    },

    toggleClassicAuthForm: function () {
        var form = document.getElementById("auth-classic-form");
        if (!form) return;
        var isHidden = (form.style.display === "none" || !form.style.display);
        form.style.display = isHidden ? "block" : "none";
    },

    togglePasswordVisibility: function () {

        var pwd = document.getElementById("auth-password");

        var btn = document.getElementById("btn-toggle-password");

        if (!pwd) return;

        if (pwd.type === "password") {

            pwd.type = "text";

            if (btn) {

                btn.innerHTML = "🙈";

                btn.title = "Skrýt heslo";

            }

        } else {

            pwd.type = "password";

            if (btn) {

                btn.innerHTML = "👁️";

                btn.title = "Zobrazit heslo";

            }

        }

    },

    closeAuthModal: function () {

        var m = document.getElementById("auth-modal");

        if (m) { m.style.display = "none"; this.updateBodyModalClass(); }

    },

    setGuestMode: function () {

        this.currentUser = {

            id: null,

            username: "Host",

            displayName: "Host",

            role: "Guest",

            credits: 0,

            selectedPawnId: "knight_valiant",

            token: null

        };

        this.userCredits = 0;
        this.selectedPawnId = "knight_valiant";
        this.unlockedPawns = ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"];

        localStorage.setItem("prs_user", JSON.stringify(this.currentUser));
        try { localStorage.removeItem("prs_player_nickname"); } catch (e) { }
        try { localStorage.removeItem("prs_guest_credits"); } catch (e) { }
        try { localStorage.removeItem("prs_unlocked_pawns"); } catch (e) { }
        try { localStorage.setItem("prs_selected_pawn", "knight_valiant"); } catch (e) { }

        if (this.lobbyPlayers && this.lobbyPlayers[0]) {

            this.lobbyPlayers[0].name = "Host (Ty)";
            this.lobbyPlayers[0].pawnId = "knight_valiant";

            this.renderLobbyPlayers();

        }

        this.updateUserUI();

        this.closeAuthModal();

    },

    getEffectiveNickname: function () {

        try {

            var sn = (localStorage.getItem("prs_player_nickname") || "").trim();

            if (sn && sn.toLowerCase() !== "host" && sn.toLowerCase() !== "admin") return sn;

        } catch (e) { }

        if (this.currentUser && this.currentUser.role !== "Guest") {

            var d = (this.currentUser.displayName || "").trim();

            if (d && d.toLowerCase() !== "admin" && d.indexOf("@") === -1 && d.toLowerCase() !== "host") return d;

            var u = (this.currentUser.username || "").trim();

            if (u) {

                if (u.indexOf("@") !== -1) {

                    var p = u.split("@")[0].replace(/[._-]/g, " ");

                    return p.replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();

                } else if (u.toLowerCase() === "admin") {

                    return "Rytíř Admin";

                }

                return u;

            }

        }

        return "Lord Filip";

    },

    submitAuth: function (mode) {
        var self = this;
        var uInput = document.getElementById("auth-username");
        var pInput = document.getElementById("auth-password");
        var dInput = document.getElementById("auth-displayname");
        var eInput = document.getElementById("auth-email");
        var msgEl = document.getElementById("auth-feedback");

        var username = uInput ? uInput.value.trim() : "";
        var password = pInput ? pInput.value : "";
        var displayName = dInput ? dInput.value.trim() : username;
        var email = eInput ? eInput.value.trim() : "";

        if (!email && username.indexOf("@") !== -1) {
            email = username;
        }

        if (!username || !password) {
            if (msgEl) msgEl.textContent = "Vyplňte prosím přihlašovací jméno a heslo.";
            return;
        }

        if (mode === "register" && (!email || email.indexOf("@") === -1)) {
            if (msgEl) msgEl.textContent = "Vyplňte prosím platný e-mail pro zaslání potvrzení registrace.";
            return;
        }

        fetch("api.ashx?action=" + mode, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password, displayName: displayName, email: email })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok && data.user) {
                    self.currentUser = data.user;
                    if (typeof data.user.credits === "number") self.userCredits = data.user.credits;
                    if (data.user.selectedPawnId) self.selectedPawnId = data.user.selectedPawnId;
                    if (data.user.unlockedPawnsJson) {
                        try {
                            var unl = JSON.parse(data.user.unlockedPawnsJson);
                            if (Array.isArray(unl) && unl.length > 0) self.unlockedPawns = unl;
                        } catch (e2) { }
                    }
                    if (self.lobbyPlayers && self.lobbyPlayers[0]) {
                        self.lobbyPlayers[0].pawnId = self.selectedPawnId || "knight_valiant";
                    }

                    if (data.user.displayName && data.user.displayName.toLowerCase() !== "admin" && data.user.displayName.indexOf("@") === -1) {
                        localStorage.setItem("prs_player_nickname", data.user.displayName);
                    }

                    localStorage.setItem("prs_user", JSON.stringify(self.currentUser));
                    self.updateUserUI();
                    self.closeAuthModal();
                    if (typeof self.rebindOnlineSeatAfterLogin === "function") {
                        self.rebindOnlineSeatAfterLogin();
                    }
                    self.enterGameHall();
                    self.fetchServerStatusAndSessions();

                    if (mode === "register") {
                        alert(data.message || "Registrace proběhla úspěšně! Na tvůj e-mail byl odeslán potvrzovací odkaz. Do jeho potvrzení můžeš hrát v režimu Hosta.");
                    }
                } else {
                    var rawErr = (data && (data.error || data.message)) ? (data.error || data.message) : "Přihlášení se nezdařilo.";
                    if (rawErr.indexOf("Neplatn") !== -1 && rawErr.indexOf("heslo") !== -1) {
                        rawErr = "Neplatné jméno nebo heslo.";
                    }
                    if (msgEl) msgEl.textContent = rawErr;
                }
            })
            .catch(function () {
                var role = (username.toLowerCase() === "admin") ? "Admin" : "Player";
                self.currentUser = { id: 1, username: username, displayName: displayName || username, role: role, token: "local" };
                localStorage.setItem("prs_user", JSON.stringify(self.currentUser));
                self.updateUserUI();
                self.closeAuthModal();
            });
    },

    resendConfirmationEmail: function () {
        var self = this;
        var u = "";
        if (this.currentUser && (this.currentUser.email || this.currentUser.username)) {
            u = this.currentUser.email || this.currentUser.username;
        } else {
            var uInput = document.getElementById("auth-username");
            var eInput = document.getElementById("auth-email");
            u = (eInput && eInput.value.trim()) || (uInput && uInput.value.trim()) || "";
        }
        if (!u) {
            alert("Zadej prosím své uživatelské jméno nebo e-mail.");
            return;
        }
        fetch("api.ashx?action=resend-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u, email: u })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                alert(res.message || "Požadavek na znovuzaslání byl zpracován.");
            })
            .catch(function () {
                alert("Chyba sítě při odesílání potvrzení.");
            });
    },

// --- ONLINE MÍSTNOSTI, SDÍLENÍ POZVÁNKY (?room=), ZÁMEK SLOTU & AUTO-POLLING ---

    getOnlineClientId: function () {
        try {
            var cid = localStorage.getItem("prs_client_uuid");
            if (!cid) {
                cid = "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
                localStorage.setItem("prs_client_uuid", cid);
            }
            return cid;
        } catch (e) {
            return "c_temp_" + Math.random().toString(36).substring(2, 9);
        }
    },

    // Zjistí, zda daný slot rytíře patří aktuálnímu hráči (podle ID zařízení nebo účtu přihlášeného rytíře)
    isMySlot: function (pl, slotIndex) {
        if (!pl) return false;
        if (this.myOnlinePlayerIndex === slotIndex) return true;
        var myClientId = this.getOnlineClientId();
        if (pl.claimedBy && pl.claimedBy === myClientId) return true;

        if (this.currentUser && this.currentUser.role !== "Guest") {
            var uName = (this.currentUser.username || "").trim().toLowerCase();
            var dName = (this.currentUser.displayName || "").trim().toLowerCase();

            // 1. Zaznamenané uživatelské jméno přímo na křesle
            if (pl.userUsername && pl.userUsername.trim().toLowerCase() === uName) {
                return true;
            }

            // 2. Křeslo hostitele (#0 nebo isOnlineHost) a shoda s hostUsername místnosti
            var hostUser = (this.state && (this.state.hostUsername || this.state.sessionHostUsername || "")) || "";
            if (hostUser && hostUser.trim().toLowerCase() === uName && (slotIndex === 0 || pl.isOnlineHost)) {
                return true;
            }

            // 3. Shoda zobrazovaného jména nebo loginu rytíře
            var cleanPlName = (pl.name || "")
                .replace(/\s*\(PC.*?\)/gi, "")
                .replace(/\s*\(Ty\)/gi, "")
                .replace(/\s*\(Hostitel\)/gi, "")
                .trim()
                .toLowerCase();

            if (cleanPlName && (cleanPlName === dName || cleanPlName === uName)) {
                return true;
            }
        }
        return false;
    },

    renderOnlineRoomBar: function () {
        var barEl = document.getElementById("online-room-bar");
        if (!barEl) return;
        if (!this.state) {
            barEl.innerHTML = "";
            barEl.style.display = "none";
            return;
        }

        var code = this.state.roomCode || "";
        var toOnlineBtn = document.getElementById("btn-to-online");

        if (!code) {
            // Lokální partie nemá zbytečný samostatný řádek přes celou obrazovku
            barEl.innerHTML = "";
            barEl.style.display = "none";
            if (toOnlineBtn) {
                toOnlineBtn.style.display = "inline-flex";
            }
            return;
        }

        barEl.style.display = "block";
        if (toOnlineBtn) {
            toOnlineBtn.style.display = "none";
        }

        // Načtení uloženého slotu pro tuto místnost z localStorage

        try {

            var savedSlot = localStorage.getItem("prs_slot_" + code);

            if (savedSlot !== null && savedSlot !== undefined && savedSlot !== "") {

                this.myOnlinePlayerIndex = parseInt(savedSlot, 10);

            }

        } catch (e) { }

        var myPl = (this.myOnlinePlayerIndex >= 0 && this.state.players[this.myOnlinePlayerIndex])

            ? this.state.players[this.myOnlinePlayerIndex]

            : null;

        var isEnBar = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var myRoleText = myPl
            ? ((window.PRS_I18n ? window.PRS_I18n.t("online.role_playing_as") : "🛡️ Hraješ za:") + ' <strong style="color:' + myPl.color + ';">' + myPl.badge + ' ' + this.escapeHtml(myPl.name) + '</strong>')
            : (window.PRS_I18n ? window.PRS_I18n.t("online.role_all_hotseat") : "🛋️ Všichni hráči (Hot-Seat bez zámku)");

        var restoreMyRoleBtn = '';
        if (this.myOnlinePlayerIndex === -1 && this.state.players) {
            var myMatchingIdx = -1;
            for (var pi = 0; pi < this.state.players.length; pi++) {
                if (typeof this.isMySlot === "function" && this.isMySlot(this.state.players[pi], pi)) {
                    myMatchingIdx = pi;
                    break;
                }
            }
            if (myMatchingIdx >= 0) {
                var myTargetP = this.state.players[myMatchingIdx];
                restoreMyRoleBtn = '  <button class="btn-gold-lg" style="font-size:0.75rem; padding:0.22rem 0.55rem; background:linear-gradient(135deg, #d4af37, #b45309); border-color:#fef08a;" onclick="PRS_App.claimOnlineRole(' + myMatchingIdx + ')" title="' + (isEnBar ? "Lock this window only for your character" : "Znovu uzamknout toto okno pouze pro tvou postavu") + '">' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_lock_only_my_role", { name: this.escapeHtml(myTargetP.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "")) }) : ("🔒 Hrát pouze za " + this.escapeHtml(myTargetP.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "")))) + '</button>';
            }
        }

        var optionsHtml = '<option value="-1" ' + (this.myOnlinePlayerIndex === -1 ? 'selected' : '') + '>🛋️ Všichni hráči u 1 PC (Hot-Seat bez zámku)</option>';

        for (var i = 0; i < this.state.players.length; i++) {
            var pl = this.state.players[i];
            var typeTag = (pl.type === "Human") ? "Hráč" : "PC";
            optionsHtml += '<option value="' + i + '" ' + (this.myOnlinePlayerIndex === i ? 'selected' : '') + '>🛡️ ' + pl.badge + ' ' + (i + 1) + '. ' + this.escapeHtml(pl.name) + ' (' + typeTag + ')</option>';
        }

        barEl.innerHTML = '<div class="online-room-banner">' +
            '<div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">' +
            '  <span class="online-pulse-dot" title="Online místnost je aktivní"></span>' +
            '  <span style="font-size:0.88rem; color:#f0f9ff;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.table_bar_prefix") : "🌐 Online Stůl:") + ' <strong style="color:var(--gold-light); letter-spacing:1px; font-size:0.98rem;">' + this.escapeHtml(code) + '</strong></span>' +
            '  <button class="btn-secondary" style="font-size:0.76rem; padding:0.22rem 0.55rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.copyRoomInviteLink()">' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_copy_invite_link") : "📋 Kopírovat odkaz pro přátele") + '</button>' +
            '  <span id="online-copy-feedback" style="font-size:0.76rem; color:#86efac;"></span>' +
            '</div>' +
            '<div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">' +
            '  <span style="font-size:0.82rem; background:rgba(0,0,0,0.3); border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:0.22rem 0.55rem;">' + myRoleText + '</span>' +
            restoreMyRoleBtn +
            '  <button class="btn-gold-lg" style="font-size:0.76rem; padding:0.24rem 0.6rem;" onclick="PRS_App.openOnlineRoleModal()" title="' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_choose_change_knight_tooltip") : "Zvolit si rytíře pro tuto online partii") + '">' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_choose_change_knight") : "👤 Zvolit / změnit rytíře") + '</button>' +
            '  <button class="btn-secondary" style="font-size:0.76rem; padding:0.24rem 0.6rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.openOnlineSeatsModal()" title="' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_seats_bots_tooltip") : "Spravovat křesla u stolu a nahradit nepřítomné hráče boty") + '">' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_seats_bots") : "🏰 Křesla & Boti") + '</button>' +
            '  <button class="btn-secondary" style="font-size:0.75rem; padding:0.22rem 0.5rem;" onclick="PRS_App.pollOnlineSessionNow(true)" title="' + (window.PRS_I18n ? window.PRS_I18n.t("online.sync_tooltip") : "Okamžitě zkontrolovat tah ze serveru") + '">' + (window.PRS_I18n ? window.PRS_I18n.t("online.sync_turn_prefix", { turn: (this.state.turnNumber || 1) }) : ("🔄 Sync (Tah #" + (this.state.turnNumber || 1) + ")")) + '</button>' +
            '</div>' +
            '</div>';
    },

    setMyOnlinePlayerSlot: async function (val) {
        var idx = parseInt(val, 10);
        if (isNaN(idx)) idx = -1;

        if (idx === -1) {
            var conf = await KiDeskyDialog.confirm(
                "Přeješ si v tomto okně <strong>odemknout stůl pro hraní za všechny rytíře (Hot-Seat)</strong>?<br><br>V tomto režimu nebude okno čekat na síťové spoluhráče a budeš moci odehrát tah za kteréhokoliv rytíře přímo odsud.",
                {
                    title: "Odemknout hraní za všechny u 1 PC?",
                    icon: "🛋️",
                    confirmText: "Ano, hrát za všechny (Hot-Seat)",
                    cancelText: "Ponechat zamčeno na svou roli"
                }
            );
            if (!conf) return;
        }

        this.claimOnlineRole(idx);
    },

    // --- MODAL VÝBĚRU POSTAVY PRO ONLINE MULTIPLAYER ---

    openOnlineRoleModal: function () {

        var modal = document.getElementById("online-role-modal");

        if (!modal || !this.state) return;

        var infoEl = document.getElementById("online-role-room-info");

        if (infoEl) {

            var diffLabel = { easy: "🌿 Easy", standard: "👑 Standard", hard: "⚔️ Hard", ultimate: "💀 Ultimate" }[(this.state.config && this.state.config.difficultyMode) || "standard"] || "👑 Standard";

            var isEnInf = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        infoEl.innerHTML = (isEnInf ? "Room Code: " : "Kód místnosti: ") + '<strong style="color:var(--gold-light); letter-spacing:1px;">' + this.escapeHtml(this.state.roomCode || "") + '</strong> | ' + (isEnInf ? "Goal: " : "Cíl: ") + '<strong>' + (this.state.config.targetHearts || 30) + ' 💖</strong> | ' + (isEnInf ? "Mode: " : "Mód: ") + '<strong style="color:#fde68a;">' + diffLabel + '</strong> | ' + (isEnInf ? "Round: #" : "Kolo: #") + this.state.roundNumber;

        }

        var nameInput = document.getElementById("online-player-custom-name");

        if (nameInput) {

            var pref = (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username))

                ? (this.currentUser.displayName || this.currentUser.username)

                : "Host";

            nameInput.value = pref;

        }

        this.renderOnlineRolePawnPicker();

        this.renderOnlineRoleGrid();

        modal.style.display = "flex";

    },

    renderOnlineRolePawnPicker: function () {
        var el = document.getElementById("online-role-pawn-picker");
        if (!el) return;
        var catalog = window.PRS_PAWNS_CATALOG || [];
        var curPawn = this.selectedPawnId || "knight_valiant";
        var html = [];
        for (var i = 0; i < catalog.length; i++) {
            var pw = catalog[i];
            if (pw.category === "bot") continue;
            var unlocked = this.isPawnUnlocked ? this.isPawnUnlocked(pw.id) : pw.unlockedByDefault;
            var isSel = (curPawn === pw.id);
            html.push('<button type="button" onclick="' + (unlocked ? 'PRS_App.selectOnlineJoinPawn(&quot;' + pw.id + '&quot;)' : 'PRS_App.openPawnShopModal(0)') + '" title="' + this.escapeHtml(pw.name) + (unlocked ? '' : ' (Zamčeno: ' + pw.priceCredits + ' 💎)') + '" style="width:44px; height:44px; border-radius:50%; padding:0; background:radial-gradient(circle, ' + (pw.accentColor || '#334155') + ' 0%, #140d08 85%); border:2.5px solid ' + (isSel ? '#22c55e' : (unlocked ? '#ffd86b' : '#64748b')) + '; box-shadow:' + (isSel ? '0 0 12px #22c55e' : '0 2px 5px rgba(0,0,0,0.6)') + '; cursor:pointer; position:relative; opacity:' + (unlocked ? '1' : '0.55') + '; transition:transform 0.15s;">');
            html.push('  <img src="' + pw.img + '" alt="" style="width:105%; height:105%; object-fit:contain; border-radius:50%;"/>');
            if (!unlocked) {
                html.push('  <span style="position:absolute; bottom:-2px; right:-2px; background:#0f172a; border:1px solid #ffd86b; border-radius:50%; width:16px; height:16px; font-size:9px; display:flex; align-items:center; justify-content:center;">🔒</span>');
            } else if (isSel) {
                html.push('  <span style="position:absolute; bottom:-2px; right:-2px; background:#16a34a; border:1px solid #fff; border-radius:50%; width:15px; height:15px; font-size:9px; color:#fff; display:flex; align-items:center; justify-content:center;">✓</span>');
            }
            html.push('</button>');
        }
        el.innerHTML = html.join("");
    },

    selectOnlineJoinPawn: function (pawnId) {
        this.selectedPawnId = pawnId;
        try { localStorage.setItem("prs_selected_pawn", pawnId); } catch (e) { }
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].pawnId = pawnId;
        }
        this.renderOnlineRolePawnPicker();
    },

    closeOnlineRoleModal: function () {

        var modal = document.getElementById("online-role-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    renderOnlineRoleGrid: function () {
        var grid = document.getElementById("online-role-players-grid");
        if (!grid || !this.state || !this.state.players) return;

        var myClientId = this.getOnlineClientId();
        var html = [];
        var availableCount = 0;

        for (var i = 0; i < this.state.players.length; i++) {
            var pl = this.state.players[i];
            var isHost = (i === 0 || !!pl.isOnlineHost);
            var isHuman = (pl.type === "Human");
            var isMyAccount = this.isMySlot(pl, i);
            var isMyCurrentSlot = (this.myOnlinePlayerIndex === i) || (pl.claimedBy && pl.claimedBy === myClientId) || isMyAccount;
            var isOccupiedByOther = !isMyAccount && !isMyCurrentSlot && (isHost || isHuman || (pl.claimedBy && pl.claimedBy !== myClientId));

            var st = window.PRS_GameEngine ? window.PRS_GameEngine.getEffectiveStats(this.state, pl) : pl.skills;
            var roleTag = '';

            if (isMyCurrentSlot && this.myOnlinePlayerIndex === i) {
                roleTag = '<span style="background:#22c55e; color:#fff; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_tag_your_role") : "✅ Tvoje role") + '</span>';
            } else if (isMyAccount) {
                roleTag = '<span style="background:rgba(234,179,8,0.25); color:#fef08a; border:1px solid #eab308; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_tag_your_account") : "👑 Tvůj rytířský účet") + '</span>';
            } else if (isOccupiedByOther) {
                if (isHost) {
                    roleTag = '<span style="background:rgba(234,179,8,0.2); color:#fbbf24; border:1px solid #fbbf24; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_tag_host", { name: this.escapeHtml(pl.name) }) : ("👑 Hostitel (" + this.escapeHtml(pl.name) + ")")) + '</span>';
                } else {
                    roleTag = '<span style="background:rgba(239,68,68,0.2); color:#fca5a5; border:1px solid #ef4444; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_tag_occupied", { name: this.escapeHtml(pl.name) }) : ("🔒 Obsazeno (" + this.escapeHtml(pl.name) + ")")) + '</span>';
                }
            } else {
                availableCount++;
                roleTag = '<span style="background:rgba(34,197,94,0.18); color:#86efac; border:1px solid #22c55e; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_tag_available") : "✨ Volné k převzetí") + '</span>';
            }

            html.push('<div class="podium-card" style="background:rgba(20,15,10,0.92); border:1.5px solid ' + (isMyCurrentSlot ? '#22c55e' : (isOccupiedByOther ? '#52525b' : pl.color)) + '; width:100%; box-sizing:border-box; padding:0.85rem; text-align:center; ' + (isOccupiedByOther ? 'opacity:0.65;' : '') + '">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
            html.push('    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:bold;">#' + (i + 1) + '</span>');
            html.push('    ' + roleTag);
            html.push('  </div>');
            html.push('  <div style="margin:0.25rem 0;">' + (this.getPlayerPawnAvatarHtml ? this.getPlayerPawnAvatarHtml(pl, 52) : ('<div style="font-size:1.8rem;">' + pl.badge + '</div>')) + '</div>');
            html.push('  <div style="font-size:1rem; font-weight:bold; color:' + pl.color + '; margin-bottom:0.2rem;">' + this.escapeHtml(pl.name) + '</div>');
            var currG = (window.PRS_I18n ? window.PRS_I18n.t("common.gold") : "zl.");
        var isEnGrid = (window.PRS_I18n && window.PRS_I18n.getLanguage() === "en");
        html.push('  <div style="font-size:0.85rem; color:#f472b6; font-weight:bold; margin-bottom:0.5rem;">' + pl.totalHearts + ' 💖 • ' + pl.gold.toLocaleString(isEnGrid ? "en-US" : "cs-CZ") + ' ' + currG + '</div>');
            html.push('  <div style="display:flex; justify-content:center; gap:0.4rem; font-size:0.76rem; margin-bottom:0.75rem; color:var(--text-muted); background:rgba(0,0,0,0.3); border-radius:6px; padding:0.25rem;">');
            html.push('    <span>⚔️' + (st.combat || 0) + '</span>');
            html.push('    <span>🏇' + (st.riding || 0) + '</span>');
            html.push('    <span>💃' + (st.dance || 0) + '</span>');
            html.push('    <span>✨' + (st.charisma || 0) + '</span>');
            html.push('  </div>');

            if (isMyCurrentSlot && this.myOnlinePlayerIndex === i) {
                html.push('  <button class="btn-secondary" disabled style="width:100%; font-size:0.82rem; opacity:0.9; cursor:default; background:rgba(34,197,94,0.25); border-color:#22c55e; color:#86efac;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_current") : "✓ Hraješ za tohoto rytíře") + '</button>');
            } else if (isMyAccount) {
                html.push('  <button class="btn-gold-lg" style="width:100%; font-size:0.84rem; padding:0.4rem 0.5rem; background:linear-gradient(135deg, #d4af37, #b45309); border-color:#fef08a;" onclick="PRS_App.claimOnlineRole(' + i + ')">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_claim_mine", { name: this.escapeHtml(pl.name.replace(" (PC)", "").replace(" (Ty)", "")) }) : ("👑 Převzít svého rytíře (" + this.escapeHtml(pl.name.replace(" (PC)", "").replace(" (Ty)", "")) + ")")) + '</button>');
            } else if (isOccupiedByOther) {
                html.push('  <button class="btn-secondary" disabled style="width:100%; font-size:0.82rem; opacity:0.6; cursor:not-allowed; background:rgba(60,40,30,0.5); border:1px dashed #78350f; color:#fed7aa;" title="' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_occupied") : "Tuto postavu již obsadil jiný hráč") + '">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_occupied") : "🔒 Již obsazeno") + '</button>');
                var amIHost = (this.myOnlinePlayerIndex === 0 || (this.state.players[this.myOnlinePlayerIndex] && this.state.players[this.myOnlinePlayerIndex].isOnlineHost));
                if (amIHost && !isHost) {
                    html.push('  <button class="btn-secondary" style="width:100%; font-size:0.75rem; padding:0.22rem 0.4rem; margin-top:0.35rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_App.convertSeatToBot(' + i + ')" title="' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_convert_bot") : "Převést odpojeného hráče zpět na počítačového bota") + '">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_convert_bot") : "🤖 Převést na PC bota") + '</button>');
                }
            } else {
                html.push('  <button class="btn-gold-lg" style="width:100%; font-size:0.84rem; padding:0.4rem 0.5rem;" onclick="PRS_App.claimOnlineRole(' + i + ')">' + (window.PRS_I18n ? window.PRS_I18n.t("online.role_modal_btn_play_as", { name: this.escapeHtml(pl.name.replace(" (PC)", "").replace(" (Ty)", "")) }) : ("⚔️ Hrát za " + this.escapeHtml(pl.name.replace(" (PC)", "").replace(" (Ty)", "")))) + '</button>');
            }
            html.push('</div>');
        }

        if (availableCount === 0 && this.myOnlinePlayerIndex < 0) {
            html.push('<div style="grid-column: 1 / -1; background:rgba(234,179,8,0.12); border:1px solid #eab308; border-radius:8px; padding:0.75rem; text-align:center; color:#fef08a; font-size:0.88rem; margin-top:0.5rem;">');
            html.push('  ℹ️ Všechny role u tohoto online stolu jsou již obsazeny. Můžeš hru sledovat jako divák.');
            html.push('  <div style="margin-top:0.5rem;"><button class="btn-secondary" style="font-size:0.84rem;" onclick="PRS_App.claimOnlineRole(-1)">👁️ Vstoupit jako divák</button></div>');
            html.push('</div>');
        }

        grid.innerHTML = html.join("\n");
    },

    claimOnlineRole: function (selIdx) {
        if (!this.state || !this.state.players) return;
        var myClientId = this.getOnlineClientId();

        if (selIdx >= 0 && selIdx < this.state.players.length) {
            var pl = this.state.players[selIdx];
            var isMyAccount = this.isMySlot(pl, selIdx);
            var isHost = (selIdx === 0 || !!pl.isOnlineHost);
            var isOccupiedByOther = !isMyAccount && (pl.type === "Human" || isHost) && (pl.claimedBy && pl.claimedBy !== myClientId);

            if (isOccupiedByOther) {
                KiDeskyDialog.alert("Role rytíře **" + this.escapeHtml(pl.name) + "** je již obsazena jiným hráčem. Zvol si prosím volnou roli označenou jako ✨ Volné k převzetí.", {
                    title: "Role je již obsazena",
                    icon: "🔒"
                });
                return;
            }

            // Pokud hráč předtím obsadil jiné křeslo (např. omylem jako dočasný Host po restartu PC)
            var prevIdx = this.myOnlinePlayerIndex;
            if (prevIdx >= 0 && prevIdx !== selIdx && this.state.players[prevIdx]) {
                var oldP = this.state.players[prevIdx];
                if (oldP.claimedBy === myClientId) {
                    delete oldP.claimedBy;
                    delete oldP.isOnlineHost;
                    delete oldP.userUsername;
                    oldP.type = "Bot_Balanced";
                    var cName = oldP.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                    if (!cName || cName.toLowerCase() === "host") cName = "Zikmund z Chovu";
                    oldP.name = cName + " (PC Vyvážený)";
                }
            }

            var nameInput = document.getElementById("online-player-custom-name");
            var customName = nameInput ? nameInput.value.trim() : "";

            pl.type = "Human"; // Povýšení na lidského hráče, aby za něj netahal automatický bot!
            pl.pawnId = this.selectedPawnId || "knight_valiant"; // Nahrazení bot figurky vlastní zvolenou figurkou hráče!
            var myOnlineCrest = (typeof this.getPlayerCrest === "function") ? this.getPlayerCrest() : { crestId: "lion", tincture: "gold" };
            pl.crestId = myOnlineCrest.crestId;
            pl.crestColor = myOnlineCrest.tincture;
            pl.claimedBy = myClientId;

            if (this.currentUser && this.currentUser.role !== "Guest") {
                pl.userUsername = this.currentUser.username;
            }

            if (customName) {
                pl.name = customName;
            } else if (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username)) {
                pl.name = this.currentUser.displayName || this.currentUser.username;
            } else {
                var origName = (pl.name || ("Rytíř " + (selIdx + 1))).replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                pl.name = origName || ("Rytíř " + (selIdx + 1));
            }

            this.myOnlinePlayerIndex = selIdx;
            if (this.state.roomCode) {
                try {
                    localStorage.setItem("prs_slot_" + this.state.roomCode, String(selIdx));
                } catch (e) { }
            }
            this.addLog("🛡️ Připojil ses k online stolu jako **" + pl.badge + " " + pl.name + "**!", "win");
        } else {
            this.myOnlinePlayerIndex = -1;
            if (this.state.roomCode) {
                try {
                    localStorage.setItem("prs_slot_" + this.state.roomCode, "-1");
                } catch (e) { }
            }
            this.addLog("👁️ Vstoupil jsi k online stolu jako divák.", "turn");
        }

        this.closeOnlineRoleModal();
        this.saveCurrentSessionToCloud();
        this.renderGameScreen();
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
    },

    copyRoomInviteLink: function () {

        if (!this.state || !this.state.roomCode) return;

        var baseUrl = window.location.origin + window.location.pathname;

        var inviteUrl = baseUrl + "?room=" + encodeURIComponent(this.state.roomCode);

        var fb = document.getElementById("online-copy-feedback");

        if (navigator.clipboard && navigator.clipboard.writeText) {

            navigator.clipboard.writeText(inviteUrl).then(function () {

                if (fb) {

                    fb.textContent = (window.PRS_I18n ? window.PRS_I18n.t("online.link_copied_feedback") : "✓ Odkaz zkopírován do schránky!");

                    setTimeout(function () { fb.textContent = ""; }, 3500);

                }

            }).catch(function () {
                KiDeskyDialog.prompt((window.PRS_I18n ? window.PRS_I18n.t("online.link_copy_prompt") : "Zkopíruj tento odkaz a pošli ho spoluhráčům:"), inviteUrl, {
                    title: "Odkaz ke stolu",
                    icon: "📋",
                    confirmText: "Hotovo",
                    cancelText: "Zavřít"
                });
            });
        } else {
            KiDeskyDialog.prompt("Zkopíruj tento odkaz a pošli ho spoluhráčům:", inviteUrl, {
                title: "Odkaz ke stolu",
                icon: "📋",
                confirmText: "Hotovo",
                cancelText: "Zavřít"
            });
        }

    },

    checkUrlRoomParam: function () {

        try {

            var search = window.location.search || "";

            var match = search.match(/[?&]room=([A-Za-z0-9_-]+)/);

            if (match && match[1]) {

                var code = match[1].toUpperCase();

                var inp = document.getElementById("join-room-code-input");

                if (inp) inp.value = code;

                this.loadSessionFromCloud(code);
                return;

            }

            // Plynulý Reconnect: Pokud není kód v URL, zkontrolujeme zda byl hráč naposledy u online stolu
            var savedRoom = null;
            try { savedRoom = localStorage.getItem("prs_active_online_room"); } catch (e) { }
            var activeTab = null;
            try { activeTab = sessionStorage.getItem("prs_active_tab"); } catch (e) { }
            if (savedRoom && activeTab === "board" && (!this.hasGameStarted || (this.state && this.state.roomCode))) {
                console.log("[KiDesky] Obnovuji online stůl z předchozí relace:", savedRoom);
                this.loadSessionFromCloud(savedRoom);
            }

        } catch (e) { }

    },

    amIOnlineHost: function () {
        if (!this.state) return false;
        if (this.myOnlinePlayerIndex === 0) return true;
        if (this.state.players && this.state.players[this.myOnlinePlayerIndex] && this.state.players[this.myOnlinePlayerIndex].isOnlineHost) {
            return true;
        }
        if (this.currentUser && this.currentUser.role !== "Guest" && this.currentUser.username) {
            var u = this.currentUser.username.trim().toLowerCase();
            var h = (this.state.hostUsername || "").trim().toLowerCase();
            if (h && h === u) return true;
        }
        return false;
    },

    stopOnlinePollingLoop: function () {
        if (this.onlinePollTimer) {
            clearInterval(this.onlinePollTimer);
            this.onlinePollTimer = null;
        }
    },

    startOnlinePollingLoop: function () {
        var self = this;
        if (this.onlinePollTimer) clearInterval(this.onlinePollTimer);

        this.onlinePollTimer = setInterval(function () {
            if (self.activeTab === "board" && self.onlinePollingEnabled && self.state && self.state.roomCode && !self.isMoveAnimating && !self.isOnlineSyncing) {
                self.pollOnlineSessionNow(false);
            }
            if (self.activeTab === "board" && self.state) {
                self.checkTurnInactivity();
            }
        }, 3000);
    },

    // Kontrola neaktivity živého hráče na tahu (více než 2 minuty) – platí pouze pro multi hru (2+ hráčů) a upozorňuje zakladatele
    checkTurnInactivity: function () {
        if (!this.state || !this.state.players || this.state.phase === "GAME_OVER") return;

        // 1. Podmínka: Upozornění neplatí pro hru jednoho hráče (vyžaduje online stůl a 2+ lidské hráče ve hře)
        if (!this.state.roomCode) return;
        var humanCount = 0;
        for (var i = 0; i < this.state.players.length; i++) {
            if (this.state.players[i].type === "Human") humanCount++;
        }
        if (humanCount <= 1) return;

        // 2. Podmínka: Upozornění je určeno pouze pro zakladatele / hostitele stolu
        if (!this.amIOnlineHost()) return;

        // 3. Podmínka: Hráč na tahu je člověk a NENÍ to hostitel
        var curIdx = this.state.currentPlayerIndex;
        var curPlayer = this.state.players[curIdx];
        if (!curPlayer || curPlayer.type !== "Human") return;
        if (curIdx === this.myOnlinePlayerIndex) return;

        // Sledování času aktuálního tahu
        var turnKey = (this.state.turnNumber || 1) + "_" + curIdx;
        if (this._inactivityTrackingKey !== turnKey) {
            this._inactivityTrackingKey = turnKey;
            this._inactivityTurnStart = Date.now();
            this._inactivityAlertShown = false;
            return;
        }

        // Čas na tahu v sekundách
        var elapsedSec = (Date.now() - (this._inactivityTurnStart || Date.now())) / 1000;
        if (elapsedSec >= 120 && !this._inactivityAlertShown) {
            this._inactivityAlertShown = true;
            var self = this;
            if (window.PRS_Audio && window.PRS_Audio.playNotice) {
                try { window.PRS_Audio.playNotice(); } catch (e) {}
            }

            var isEnAfk = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var afkTitle = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.title") : "Neaktivita hráče u online stolu";
            var afkPrompt = window.PRS_I18n
                ? window.PRS_I18n.t("online.afk_dialog.prompt", { name: this.escapeHtml(curPlayer.name), seat: (curIdx + 1) })
                : ("Rytíř <strong>" + this.escapeHtml(curPlayer.name) + "</strong> (křeslo #" + (curIdx + 1) + ") je na tahu již <strong>více než 2 minuty</strong> a neodehrál svůj tah.<br><br>Jako hostitel stolu můžeš zvolit, jak situaci vyřešit:");
            var opt1Label = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.step_once_label") : "⚡ Odehrát tento 1 tah botem";
            var opt1Desc = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.step_once_desc") : "Královský rádce okamžitě provede tah za nepřítomného rytíře, ale křeslo mu ponechá pro příští kolo.";
            var opt2Label = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.convert_perm_label") : "🤖 Trvale převést křeslo na PC bota";
            var opt2Desc = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.convert_perm_desc") : "Křeslo trvale převezme počítačový bot. Pokud se hráč vrátí, můžeš křeslo v menu Křesla & Boti znovu uvolnit.";
            var opt3Label = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.wait_more_label") : "⏱️ Počkat ještě (dalších 60 s)";
            var opt3Desc = window.PRS_I18n ? window.PRS_I18n.t("online.afk_dialog.wait_more_desc") : "Dát hráči ještě minutu času před dalším upozorněním.";

            KiDeskyDialog.choice(
                afkPrompt,
                [
                    {
                        id: "step_once",
                        label: opt1Label,
                        description: opt1Desc,
                        isPrimary: true
                    },
                    {
                        id: "convert_perm",
                        label: opt2Label,
                        description: opt2Desc,
                        isPrimary: false
                    },
                    {
                        id: "wait_more",
                        label: opt3Label,
                        description: opt3Desc,
                        isPrimary: false
                    }
                ],
                {
                    title: afkTitle,
                    icon: "⏳"
                }
            ).then(function (chosen) {
                if (!self.state || self.state.currentPlayerIndex !== curIdx) return;
                if (chosen === "step_once") {
                    self.stepAfkPlayerOnce();
                } else if (chosen === "convert_perm") {
                    self.convertSeatToBot(curIdx);
                } else if (chosen === "wait_more") {
                    self._inactivityTurnStart = Date.now() - 60000;
                    self._inactivityAlertShown = false;
                }
            });
        }
    },

    // Odehraje jeden tah za neaktivního lidského hráče pomocí logiky bota, ale ponechá mu křeslo jako Human
    stepAfkPlayerOnce: function () {
        if (!this.state || this.state.phase === "GAME_OVER") return;
        var curIdx = this.state.currentPlayerIndex;
        var p = this.state.players[curIdx];
        if (!p) return;

        var origType = p.type;
        var self = this;

        var isEnStep = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        this.addLog(isEnStep ? ("⚡ Player " + p.name + " did not respond. Host had the Royal Advisor play their turn.") : ("⚡ Hráč " + p.name + " neodpovídal. Hostitel nechal jeho tah odehrát královským rádcem."), "danger");

        // Dočasně nastavíme typ hráče na bota, aby bot AI rozhodovala
        p.type = "Bot_Balanced";

        if (this.state.phase === "ROLL") {
            this.executeRollAndAnimateMove(p, function () {
                if (window.PRS_GameEngine && window.PRS_GameEngine.executeBotTurn) {
                    window.PRS_GameEngine.executeBotTurn(self.state);
                }
                p.type = origType;
                self._inactivityTurnStart = Date.now();
                self._inactivityAlertShown = false;
                self.syncFocusToActivePlayer(true);
                self.renderGameScreen();
                if (typeof self.saveCurrentSessionToCloud === "function") {
                    self.saveCurrentSessionToCloud();
                }
            });
        } else {
            if (window.PRS_GameEngine && window.PRS_GameEngine.executeBotTurn) {
                window.PRS_GameEngine.executeBotTurn(self.state);
            }
            p.type = origType;
            self._inactivityTurnStart = Date.now();
            self._inactivityAlertShown = false;
            self.syncFocusToActivePlayer(true);
            self.renderGameScreen();
            if (typeof self.saveCurrentSessionToCloud === "function") {
                self.saveCurrentSessionToCloud();
            }
        }
    },

    // Synchronizuje obsazení křesel a typy hráčů z dálkového stavu (např. když se do místnosti připojí živý hráč)
    syncOnlinePlayersRoster: function (remotePlayers) {
        if (!this.state || !this.state.players || !Array.isArray(remotePlayers)) return;
        var changed = false;
        for (var i = 0; i < this.state.players.length; i++) {
            var lp = this.state.players[i];
            var rp = remotePlayers[i];
            if (!lp || !rp) continue;
            // Nechceme přepsat vlastní křeslo lokálního hráče
            if (i !== this.myOnlinePlayerIndex) {
                if (lp.type !== rp.type || lp.name !== rp.name || lp.pawnId !== rp.pawnId || lp.claimedBy !== rp.claimedBy || lp.isOnlineHost !== rp.isOnlineHost) {
                    lp.type = rp.type;
                    lp.name = rp.name;
                    lp.pawnId = rp.pawnId;
                    lp.claimedBy = rp.claimedBy;
                    lp.isOnlineHost = rp.isOnlineHost;
                    changed = true;
                }
            } else {
                // Pro vlastní křeslo: pokud lokálně vím, že jsem živý hráč (Human), nedovolíme vzdálenému stavu přepsat mě na bota
                if (lp.type === "Human" && rp.type !== "Human") {
                    rp.type = "Human";
                    rp.claimedBy = lp.claimedBy;
                    rp.name = lp.name;
                }
            }
        }
        if (changed) {
            this.isBoardStaticDirty = true;
            this.renderGameScreen();
            this.renderOnlineRoomBar();
            if (typeof this.renderOnlineSeatsModal === "function") this.renderOnlineSeatsModal();
            if (typeof this.renderOnlineRoleGrid === "function") this.renderOnlineRoleGrid();
        }
    },

    pollOnlineSessionNow: function (manual) {

        var self = this;

        if (!this.state || !this.state.roomCode || this.isMoveAnimating || this.state.phase === "GAME_OVER") return;

        if (this.isActionProcessing || this.isSavingSession) return;

        this.isOnlineSyncing = true;

        var roomCode = this.state.roomCode;

        // Pomocná funkce pro plné stažení a aplikaci herního stavu

        var fetchFullSession = function () {

            fetch("api.ashx?action=load-session&code=" + encodeURIComponent(roomCode))

                .then(function (r) { return r.json(); })

                .then(function (res) {

                    self.isOnlineSyncing = false;

                    if (res && res.ok && res.session && res.session.stateJson) {

                        if (res.chat && Array.isArray(res.chat)) {
                            self.handleIncomingChatMessages(res.chat, true);
                        }

                        var remoteState = JSON.parse(res.session.stateJson);

                        if (!remoteState || !remoteState.players) return;

                        self.lastKnownUpdatedAt = res.session.updatedAt;

                        // Synchronizujeme obsazenost křesel a typy hráčů (např. připojení živého hráče)
                        self.syncOnlinePlayersRoster(remoteState.players);

                        var localSig = (self.state.turnNumber || 1) + ":" + self.state.currentPlayerIndex + ":" + self.state.phase + ":" + (self.state.logs ? self.state.logs.length : 0);

                        var remoteSig = (remoteState.turnNumber || 1) + ":" + remoteState.currentPlayerIndex + ":" + remoteState.phase + ":" + (remoteState.logs ? remoteState.logs.length : 0);

                        // Pokud jsem na tahu a remote má stejné číslo tahu, remote nesmí přepsat můj čerstvý lokální tah starším stavem

                        var isMyTurn = (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex);

                        if (isMyTurn && remoteState.turnNumber === self.state.turnNumber) {

                            var localLogs = self.state.logs ? self.state.logs.length : 0;

                            var remoteLogs = remoteState.logs ? remoteState.logs.length : 0;

                            if (remoteLogs <= localLogs) {

                                return;

                            }

                        }

                        if ((remoteState.turnNumber > self.state.turnNumber) || (remoteState.turnNumber === self.state.turnNumber && remoteSig !== localSig)) {

                            var prevPlayerIdx = self.state.currentPlayerIndex;

                            self.state = remoteState;

                            self.state.sessionGuid = res.session.sessionGuid;

                            self.state.roomCode = res.session.roomCode;

                            self.lastKnownTurnNumber = self.state.turnNumber;

                            var activeP = self.state.players[self.state.currentPlayerIndex];
                            if (activeP) {
                                self.selectedNodeId = activeP.nodeId;
                                self.inspectedPlayerIndex = activeP.index;
                                self.inspectNode(activeP.nodeId);
                                if (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex) {
                                    self.centerOnActivePlayer(true, true);
                                }
                            }

                            self.renderGameScreen();

                            if (window.PRS_Audio) window.PRS_Audio.playNotice();

                            if (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex && prevPlayerIdx !== self.myOnlinePlayerIndex) {

                                self.addLog("🔔 Jsi na tahu! Spoluhráč dokončil svůj tah.", "win");

                            }

                            self.scheduleBotTurnIfNeeded();

                        } else if (manual) {

                            self.renderOnlineRoomBar();

                        }

                    }

                })

                .catch(function () {

                    self.isOnlineSyncing = false;

                });

        };

        // Manuální stisk tlačítka Sync vynutí okamžité plné načtení

        if (manual) {

            fetchFullSession();

            return;

        }

        // Automatický polling: Odlehčený Headless Turn-Check (~180 bajtů namísto ~100 kB JSONu)

        fetch("api.ashx?action=check-session&code=" + encodeURIComponent(roomCode))

            .then(function (r) { return r.json(); })

            .then(function (res) {

                if (res && res.ok) {

                    var needsFullFetch = false;

                    // 1. Změnilo se číslo tahu?

                    if (res.turnNumber !== self.state.turnNumber) {

                        needsFullFetch = true;

                    }

                    // 2. Změnil se aktivní hráč na tahu?

                    else if (res.currentPlayerIndex !== self.state.currentPlayerIndex) {

                        needsFullFetch = true;

                    }

                    // 3. Byla hra mezitím dokončena?

                    else if (res.gameStatus === "Finished" && self.state.phase !== "GAME_OVER") {

                        needsFullFetch = true;

                    }

                    // 4. Došlo k uložení na serveru s novým časovým razítkem (např. připojení jiného hráče do místnosti)?
                    else if (self.lastKnownUpdatedAt && res.updatedAt && res.updatedAt !== self.lastKnownUpdatedAt) {
                        needsFullFetch = true;
                    }

                    // Kontrola příchozích reakčních emotikonů ze stolu
                    if (res.emotes && Array.isArray(res.emotes)) {
                        self._seenEmoteIds = self._seenEmoteIds || {};
                        for (var ei = 0; ei < res.emotes.length; ei++) {
                            var em = res.emotes[ei];
                            if (em && em.id && !self._seenEmoteIds[em.id]) {
                                self._seenEmoteIds[em.id] = true;
                                if (em.playerIndex !== self.myOnlinePlayerIndex) {
                                    self.showKnightEmoteBubble(em.playerIndex, em.emote, em.author);
                                }
                            }
                        }
                    }

                    // Kontrola příchozích zpráv chatu (Královská sněmovna)
                    if (res.chat && Array.isArray(res.chat)) {
                        self.handleIncomingChatMessages(res.chat);
                    }

                    if (needsFullFetch) {

                        fetchFullSession();

                    } else {

                        self.isOnlineSyncing = false;

                        self.lastKnownUpdatedAt = res.updatedAt;

                    }

                } else {

                    // Fallback na plný load při neočekávané odpovědi

                    fetchFullSession();

                }

            })

            .catch(function () {

                self.isOnlineSyncing = false;

            });

    },

    saveCurrentSessionToCloud: function (allowBotOverride) {
        var self = this;
        if (!this.state) return;

        var statusEl = document.getElementById("cloud-save-status");
        if (statusEl) statusEl.textContent = "Ukládám hru do databáze...";

        var hostName = "Host";
        if (this.currentUser && this.currentUser.role !== "Guest") {
            hostName = (this.currentUser.username || this.currentUser.displayName || "Rytíř").trim();
        } else if (this.state.players && this.state.players[0] && this.state.players[0].name) {
            hostName = this.state.players[0].name.replace(/\s*\(Ty\)\s*/i, "").replace(/\s*\(Hostitel\)\s*/i, "").trim();
        }
        if (!hostName) hostName = "Host";

        var isNewRoom = !this.state.roomCode;
        if (isNewRoom && this.myOnlinePlayerIndex < 0) {
            this.myOnlinePlayerIndex = 0;
            if (this.state.players && this.state.players[0]) {
                this.state.players[0].isOnlineHost = true;
                this.state.players[0].type = "Human";
                this.state.players[0].claimedBy = this.getOnlineClientId();
            }
        } else if (this.state.players && this.myOnlinePlayerIndex >= 0 && this.state.players[this.myOnlinePlayerIndex]) {
            if (!this.state.players[this.myOnlinePlayerIndex].claimedBy) {
                this.state.players[this.myOnlinePlayerIndex].claimedBy = this.getOnlineClientId();
            }
        }

        var payload = {
            sessionGuid: this.state.sessionGuid || "",
            roomCode: this.state.roomCode || "",
            title: "Princeznino srdce – " + hostName + " (Kolo " + (this.state.roundNumber || 1) + ")",
            hostUsername: hostName,
            mode: "Online",
            boardCode: this.state.board ? this.state.board.code : "classic_96",
            status: this.state.phase === "GAME_OVER" ? "Finished" : "Active",
            currentTurnPlayer: this.state.currentPlayerIndex || 0,
            turnNumber: this.state.turnNumber || 1,
            expectedTurnNumber: (this.lastKnownTurnNumber !== undefined) ? this.lastKnownTurnNumber : -1,
            targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,
            difficultyMode: (this.state.config && this.state.config.difficultyMode) ? this.state.config.difficultyMode : "standard",
            winnerName: (this.state.winner ? this.state.winner.name : null),
            allowBotOverride: !!allowBotOverride,
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        };

        var doFetch = function (retryCount) {
            return fetch("api.ashx?action=save-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).then(function (r) {
                if ((r.status === 403 || r.status === 503 || r.status === 502) && retryCount > 0) {
                    return new Promise(function (resolve) { setTimeout(resolve, 650); }).then(function () {
                        return doFetch(retryCount - 1);
                    });
                }
                return r;
            }).catch(function (networkErr) {
                if (retryCount > 0) {
                    return new Promise(function (resolve) { setTimeout(resolve, 650); }).then(function () {
                        return doFetch(retryCount - 1);
                    });
                }
                throw networkErr;
            });
        };

        doFetch(2)
            .then(function (r) {
                if (r.status === 409) {
                    return r.json().then(function (conf) {
                        if (statusEl) statusEl.innerHTML = "⚠️ Konflikt: Tah byl odehrán na jiném zařízení.";
                        self.handleTurnConflict(conf);
                    });
                }
                if (!r.ok) {
                    return r.json().then(function (errJson) {
                        throw new Error(errJson.message || ("HTTP " + r.status));
                    }).catch(function (parseErr) {
                        if (parseErr && parseErr.message && !parseErr.message.startsWith("JSON")) {
                            throw parseErr;
                        }
                        throw new Error("HTTP " + r.status);
                    });
                }
                return r.json().then(function (res) {

                    if (res && res.ok) {

                        self.state.sessionGuid = res.sessionGuid;

                        self.state.roomCode = res.roomCode;

                        self.lastKnownTurnNumber = self.state.turnNumber;

                        try {
                            localStorage.setItem("prs_active_online_room", res.roomCode);
                            if (window.history && window.history.replaceState) {
                                window.history.replaceState(null, "", "?room=" + encodeURIComponent(res.roomCode));
                            }
                        } catch (e) { }

                        if (isNewRoom) {

                            try {

                                localStorage.setItem("prs_slot_" + res.roomCode, "0");

                            } catch (e) { }

                            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

                            self.copyRoomInviteLink();

                            KiDeskyDialog.alert("Hra byla úspěšně převedena na Online stůl!<br><br>Kód místnosti: <strong style='color:var(--gold-light); font-size:1.15rem; letter-spacing:1px;'>" + self.escapeHtml(res.roomCode) + "</strong><br><br>Odkaz pro přátele byl zkopírován do schránky.", {
                                title: "Online stůl připraven",
                                icon: "🌐"
                            });

                        }

                        if (statusEl) statusEl.innerHTML = (window.PRS_I18n ? window.PRS_I18n.t("online.save_room_code_success", { code: res.roomCode }) : ("✅ Uloženo! Kód místnosti: <strong>" + res.roomCode + "</strong>"));

                        self.renderOnlineRoomBar();

                        self.fetchServerStatusAndSessions();

                        self.addLog("☁️ Hra uložena do cloudu! Kód online místnosti: " + res.roomCode, "turn");

                    } else {

                        if (statusEl) statusEl.textContent = (window.PRS_I18n ? window.PRS_I18n.t("online.save_local_browser") : "⚠️ Uloženo lokálně v prohlížeči.");

                        localStorage.setItem("prs_saved_game", JSON.stringify(self.state));

                    }

                });

            })

            .catch(function (err) {

                localStorage.setItem("prs_saved_game", JSON.stringify(self.state));

                if (statusEl) statusEl.textContent = (window.PRS_I18n ? window.PRS_I18n.t("online.save_local_storage") : "💾 Uloženo do lokální paměti prohlížeče.");

                KiDeskyDialog.alert("Nepodařilo se synchronizovat online místnost se serverem (" + (err && err.message ? self.escapeHtml(err.message) : err) + "). Hra je uložena lokálně v prohlížeči.", {
                    title: "Offline režim",
                    icon: "⚠️"
                });

            });

    },

    saveSessionAuto: function () {

        var self = this;

        // VŽDY provést lokální autosave pro okamžité obnovení při Ctrl+F5 / reloadu
        if (typeof this.saveActiveGameAutosave === "function") {
            this.saveActiveGameAutosave();
        }

        if (!this.state || !this.state.sessionGuid) return Promise.resolve();

        this.isSavingSession = true;

        var hostName = "Host";
        if (this.currentUser && this.currentUser.role !== "Guest") {
            hostName = (this.currentUser.username || this.currentUser.displayName || "Rytíř").trim();
        } else if (this.state.players && this.state.players[0] && this.state.players[0].name) {
            hostName = this.state.players[0].name.replace(/\s*\(Ty\)\s*/i, "").replace(/\s*\(Hostitel\)\s*/i, "").trim();
        }
        if (!hostName) hostName = "Host";

        if (this.state.players && this.myOnlinePlayerIndex >= 0 && this.state.players[this.myOnlinePlayerIndex]) {
            if (!this.state.players[this.myOnlinePlayerIndex].claimedBy) {
                this.state.players[this.myOnlinePlayerIndex].claimedBy = this.getOnlineClientId();
            }
        }

        var payload = {
            sessionGuid: this.state.sessionGuid,
            roomCode: this.state.roomCode || this.state.sessionGuid.substring(0, 6).toUpperCase(),
            title: "Princeznino srdce – Kolo " + this.state.roundNumber,
            hostUsername: hostName,
            boardCode: this.state.board ? this.state.board.code : "classic_96",
            status: this.state.phase === "GAME_OVER" ? "Finished" : "Active",
            currentTurnPlayer: this.state.currentPlayerIndex,
            turnNumber: this.state.turnNumber,
            expectedTurnNumber: (this.lastKnownTurnNumber !== undefined) ? this.lastKnownTurnNumber : (this.state.turnNumber - 1),
            targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,
            difficultyMode: (this.state.config && this.state.config.difficultyMode) ? this.state.config.difficultyMode : "standard",
            winnerName: (this.state.winner ? this.state.winner.name : null),
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        };

        return fetch("api.ashx?action=save-session", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify(payload)

        })

            .then(function (r) {

                if (r.status === 409) {

                    return r.json().then(function (conf) {

                        self.handleTurnConflict(conf);

                    });

                }

                return r.json().then(function (res) {

                    if (res && res.ok) {

                        self.lastKnownTurnNumber = self.state.turnNumber;

                    }

                });

            })

            .catch(function () {

                // Tichý fallback při síťových výpadcích

            })

            .finally(function () {

                self.isSavingSession = false;

            });

    },

    handleTurnConflict: function (res) {

        if (!res) return;

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

        var msg = "⚠️ Konflikt tahů: jiný hráč již odehrál svůj tah na serveru (tah #" + (res.serverTurnNumber || "?") + "). Herní plán byl synchronizován.";

        this.addLog(msg, "warning");

        if (res.stateJson) {

            try {

                var newState = JSON.parse(res.stateJson);

                if (newState && newState.players) {

                    this.state = newState;

                    this.lastKnownTurnNumber = this.state.turnNumber;

                    this.isBoardStaticDirty = true;

                    this.renderGameScreen();

                }

            } catch (e) {

                console.error("Chyba při synchronizaci stavu hry po konfliktu:", e);

            }

        }

    },

    fetchServerStatusAndSessions: function () {

        var self = this;

        fetch("api.ashx?action=list-sessions")

            .then(function (r) { return r.json(); })

            .then(function (res) {

                if (res && res.ok && res.sessions) {

                    self.lastSavedSessions = res.sessions;
                    self.renderSavedSessionsList(res.sessions);

                }

            })

            .catch(function () { });

    },

    renderSavedSessionsList: function (sessions) {

        var box = document.getElementById("saved-sessions-list");

        if (!box) return;

        var isEn = (typeof window !== "undefined" && window.PRS_I18n && window.PRS_I18n.getLanguage() === "en");

        if (!sessions || sessions.length === 0) {

            box.innerHTML = '<div class="empty-note">' + (isEn ? 'No saved active games on the server yet.' : 'Zatím žádné uložené rozehrané partie na serveru.') + '</div>';

            return;

        }

        var codeLabel = isEn ? "Code: " : "Kód: ";
        var turnLabel = isEn ? "Turn " : "Tah ";
        var targetLabel = isEn ? "Target: " : "Cíl: ";
        var loadBtn = window.PRS_I18n ? window.PRS_I18n.t("online.btn_load") : (isEn ? "▶️ Load" : "▶️ Načíst");

        var html = "";

        for (var i = 0; i < sessions.length; i++) {

            var s = sessions[i];

            html += '<div class="saved-session-row">' +

                '<div><strong>' + this.escapeHtml(s.title) + '</strong> <span class="room-code-pill">' + codeLabel + s.roomCode + '</span><br/><small>' + turnLabel + s.turnNumber + ' | ' + targetLabel + s.targetHearts + ' 💖 | ' + s.updatedAt + '</small></div>' +

                '<button class="btn-action-buy" onclick="PRS_App.loadSessionFromCloud(\'' + s.roomCode + '\')">' + loadBtn + '</button>' +

                '</div>';

        }

        box.innerHTML = html;

    },

    loadSessionFromCloud: function (codeOrGuid) {

        var self = this;

        var inputEl = document.getElementById("join-room-code-input");

        var code = codeOrGuid || (inputEl ? inputEl.value.trim().toUpperCase() : "");

        if (!code) return;

        fetch("api.ashx?action=load-session&code=" + encodeURIComponent(code))

            .then(function (r) { return r.json(); })

            .then(function (res) {

                if (res && res.ok && res.session && res.session.stateJson) {

                    if (res.chat && Array.isArray(res.chat)) {
                        self.handleIncomingChatMessages(res.chat, true);
                    }

                    self.state = JSON.parse(res.session.stateJson);

                    self.state.sessionGuid = res.session.sessionGuid;

                    self.state.roomCode = res.session.roomCode;
                    self.state.hostUsername = res.session.hostUsername;

                    self.lastKnownTurnNumber = self.state.turnNumber;

                    try {
                        localStorage.setItem("prs_active_online_room", res.session.roomCode);
                        if (window.history && window.history.replaceState) {
                            window.history.replaceState(null, "", "?room=" + encodeURIComponent(res.session.roomCode));
                        }
                    } catch (e) { }

                    self.isBoardStaticDirty = true;

                    self.hasGameStarted = true;
                    self.updateUserUI();

                    self.switchTab("board");

                    // Zjistíme, zda už má tento hráč pro tuto místnost přiřazený slot podle účtu nebo clientId
                    var myClientId = self.getOnlineClientId();
                    var autoSlotIdx = -1;

                    // 1. Nejvyšší priorita: Shoda s účtem přihlášeného rytíře (hostitel nebo rytíř se stejným jménem)
                    if (self.currentUser && self.currentUser.role !== "Guest" && self.state.players && Array.isArray(self.state.players)) {
                        for (var pi = 0; pi < self.state.players.length; pi++) {
                            if (self.isMySlot(self.state.players[pi], pi)) {
                                autoSlotIdx = pi;
                                break;
                            }
                        }
                    }

                    // 2. Druhá priorita: Shoda s ID klientského zařízení
                    if (autoSlotIdx < 0 && self.state.players && Array.isArray(self.state.players)) {
                        for (var pi = 0; pi < self.state.players.length; pi++) {
                            if (self.state.players[pi] && self.state.players[pi].claimedBy === myClientId) {
                                autoSlotIdx = pi;
                                break;
                            }
                        }
                    }

                    var savedSlot = null;
                    try {
                        savedSlot = localStorage.getItem("prs_slot_" + self.state.roomCode);
                    } catch (e) { }

                    if (autoSlotIdx >= 0) {
                        // Uvolníme případná duplicitní křesla držená tímto zařízením
                        for (var opi = 0; opi < self.state.players.length; opi++) {
                            if (opi !== autoSlotIdx && self.state.players[opi] && self.state.players[opi].claimedBy === myClientId) {
                                delete self.state.players[opi].claimedBy;
                                delete self.state.players[opi].isOnlineHost;
                                delete self.state.players[opi].userUsername;
                                self.state.players[opi].type = "Bot_Balanced";
                                var cName = self.state.players[opi].name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                                if (!cName || cName.toLowerCase() === "host") cName = "Zikmund z Chovu";
                                self.state.players[opi].name = cName + " (PC Vyvážený)";
                            }
                        }

                        self.myOnlinePlayerIndex = autoSlotIdx;
                        self.state.players[autoSlotIdx].type = "Human";
                        self.state.players[autoSlotIdx].claimedBy = myClientId;
                        if (self.currentUser && self.currentUser.role !== "Guest") {
                            self.state.players[autoSlotIdx].userUsername = self.currentUser.username;
                        }
                        self.state.players[autoSlotIdx].name = self.state.players[autoSlotIdx].name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                        try {
                            localStorage.setItem("prs_slot_" + self.state.roomCode, String(autoSlotIdx));
                        } catch (e) { }
                        self.renderGameScreen();
                        self.saveCurrentSessionToCloud();
                    } else if (savedSlot !== null && savedSlot !== undefined && savedSlot !== "" && savedSlot !== "-1") {
                        var sIdx = parseInt(savedSlot, 10);
                        if (self.state.players && self.state.players[sIdx] && (!self.state.players[sIdx].claimedBy || self.state.players[sIdx].claimedBy === myClientId || self.isMySlot(self.state.players[sIdx], sIdx))) {
                            self.myOnlinePlayerIndex = sIdx;
                            self.state.players[sIdx].type = "Human";
                            self.state.players[sIdx].claimedBy = myClientId;
                            if (self.currentUser && self.currentUser.role !== "Guest") {
                                self.state.players[sIdx].userUsername = self.currentUser.username;
                            }
                            self.state.players[sIdx].name = self.state.players[sIdx].name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                            self.renderGameScreen();
                            self.saveCurrentSessionToCloud();
                        } else {
                            self.myOnlinePlayerIndex = -1;
                            self.renderGameScreen();
                            self.openOnlineRoleModal();
                        }
                    } else {
                        // Nově připojený hráč si musí vybrat volnou postavu označenou jako ✨ Volné k převzetí!
                        self.myOnlinePlayerIndex = -1;
                        self.renderGameScreen();
                        self.openOnlineRoleModal();
                    }

                    self.addLog("☁️ Hra byla úspěšně načtena ze serveru (Kód: " + res.session.roomCode + ", tah #" + self.state.turnNumber + ").", "turn");

                    if (window.PRS_Audio) window.PRS_Audio.playNotice();

                }

            })

            .catch(function () { });

    },

    // --- RYTÍŘSKÉ EMOTIKONY & REAKCE U STOLU ---
    sendKnightEmote: function (symbol, label) {
        var myIdx = (this.myOnlinePlayerIndex >= 0) ? this.myOnlinePlayerIndex : (this.state ? this.state.currentPlayerIndex : 0);
        var author = (this.currentUser && this.currentUser.displayName) || (this.state && this.state.players[myIdx] ? this.state.players[myIdx].name : "Rytíř");
        var text = symbol + " " + label;
        this.showKnightEmoteBubble(myIdx, text, author);
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        if (this.state && this.state.roomCode) {
            var url = "api.ashx?action=send-emote&code=" + encodeURIComponent(this.state.roomCode) +
                "&playerIdx=" + myIdx +
                "&emote=" + encodeURIComponent(text) +
                "&author=" + encodeURIComponent(author);
            fetch(url).catch(function () { });
        }
    },

    showKnightEmoteBubble: function (playerIndex, text, author) {
        if (!this.state || !this.state.players || !this.state.players[playerIndex]) return;
        var p = this.state.players[playerIndex];
        var boardWrap = document.getElementById("board-canvas-container") || document.querySelector(".svg-board-container") || document.getElementById("tab-board");
        if (!boardWrap) return;

        var bubble = document.createElement("div");
        bubble.className = "knight-emote-bubble";
        bubble.innerHTML = '<span class="emote-author" style="color:' + (p.color || '#fde68a') + ';">' + this.escapeHtml(author || p.name) + '</span><span class="emote-text">' + this.escapeHtml(text) + '</span>';
        
        var pawnEl = document.getElementById("player-pawn-" + playerIndex) || document.querySelector('[data-player-idx="' + playerIndex + '"]');
        if (pawnEl) {
            var rect = pawnEl.getBoundingClientRect();
            var containerRect = boardWrap.getBoundingClientRect();
            bubble.style.left = Math.max(20, Math.min(containerRect.width - 20, (rect.left - containerRect.left + (rect.width / 2)))) + "px";
            bubble.style.top = Math.max(20, (rect.top - containerRect.top - 10)) + "px";
        } else {
            bubble.style.left = "50%";
            bubble.style.top = "30%";
        }
        boardWrap.appendChild(bubble);
        setTimeout(function () {
            if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 3600);
    },

    // --- AUTOMATICKÉ PÁROVÁNÍ KŘESLA PŘI PŘIHLÁŠENÍ UŽIVATELE ---
    rebindOnlineSeatAfterLogin: function () {
        if (!this.state || !this.state.roomCode || !this.state.players) return;
        if (!this.currentUser || this.currentUser.role === "Guest") return;

        var myClientId = this.getOnlineClientId();
        var targetIdx = -1;
        for (var i = 0; i < this.state.players.length; i++) {
            if (this.isMySlot(this.state.players[i], i)) {
                targetIdx = i;
                break;
            }
        }

        if (targetIdx >= 0) {
            var prevIdx = this.myOnlinePlayerIndex;
            // Pokud hráč před přihlášením držel jiné křeslo (např. omylem dočasný Host)
            if (prevIdx >= 0 && prevIdx !== targetIdx && this.state.players[prevIdx]) {
                var oldP = this.state.players[prevIdx];
                if (oldP.claimedBy === myClientId) {
                    delete oldP.claimedBy;
                    delete oldP.isOnlineHost;
                    delete oldP.userUsername;
                    oldP.type = "Bot_Balanced";
                    var cName = oldP.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                    if (!cName || cName.toLowerCase() === "host") cName = "Zikmund z Chovu";
                    oldP.name = cName + " (PC Vyvážený)";
                }
            }

            var pl = this.state.players[targetIdx];
            pl.type = "Human";
            pl.claimedBy = myClientId;
            pl.userUsername = this.currentUser.username;
            var rebCrest = (typeof this.getPlayerCrest === "function") ? this.getPlayerCrest() : { crestId: "lion", tincture: "gold" };
            pl.crestId = rebCrest.crestId;
            pl.crestColor = rebCrest.tincture;
            if (this.currentUser.displayName) {
                pl.name = this.currentUser.displayName;
            }
            this.myOnlinePlayerIndex = targetIdx;
            try {
                localStorage.setItem("prs_slot_" + this.state.roomCode, String(targetIdx));
            } catch (e) { }

            this.saveCurrentSessionToCloud();
            this.renderGameScreen();
            this.addLog("👑 Účet rytíře byl spárován s křeslem. Hraješ za **" + pl.badge + " " + pl.name + "**!", "win");
        }
    },

    // --- PŘEDÁNÍ TAHU NEAKTIVNÍHO HRÁČE KRÁLOVSKÉMU BOTOVI ---
    takeOverAfkTurnAsBot: function () {
        if (!this.state || this.state.phase === "GAME_OVER") return;
        var curIdx = this.state.currentPlayerIndex;
        var p = this.state.players[curIdx];
        if (!p || p.type.indexOf("Bot") === 0) return;
        p.type = "Bot_Balanced";
        this.addLog("⚡ Hráč " + p.name + " neodpovídal v časovém limitu. Jeho tah převzal královský rádce (Bot).", "danger");
        this.renderGameScreen();
        this.scheduleBotTurnIfNeeded();
        this.saveSessionAuto();
    },

    // --- MULTIPLAYER CHAT (Královská sněmovna) ---
    toggleChatDrawer: function (forceState) {
        var drawer = document.getElementById("online-chat-drawer");
        if (!drawer) return;
        var willOpen = (typeof forceState === "boolean") ? forceState : drawer.classList.contains("hidden");
        if (willOpen) {
            drawer.classList.remove("hidden");
            this._isChatDrawerOpen = true;
            this._unreadChatCount = 0;
            var badge = document.getElementById("chat-unread-badge");
            if (badge) {
                badge.style.display = "none";
                badge.textContent = "0";
            }
            this.scrollChatToBottom();
            var input = document.getElementById("online-chat-input");
            if (input) {
                setTimeout(function () { input.focus(); }, 100);
            }
        } else {
            drawer.classList.add("hidden");
            this._isChatDrawerOpen = false;
        }
    },

    scrollChatToBottom: function () {
        var container = document.getElementById("online-chat-messages");
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    sendChatMessage: function (customText) {
        var self = this;
        var input = document.getElementById("online-chat-input");
        var text = (typeof customText === "string") ? customText.trim() : (input ? input.value.trim() : "");
        if (!text) return;
        if (input && typeof customText !== "string") {
            input.value = "";
        }

        var myIdx = (this.myOnlinePlayerIndex >= 0) ? this.myOnlinePlayerIndex : (this.state ? this.state.currentPlayerIndex : 0);
        var author = (this.currentUser && this.currentUser.displayName) || (this.state && this.state.players && this.state.players[myIdx] ? this.state.players[myIdx].name : "Rytíř");
        author = author.replace(/\s*\(Ty\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").trim();

        var crestInfo = (typeof this.getPlayerCrest === "function") ? this.getPlayerCrest() : { crestId: "lion", tincture: "gold" };
        var roomCode = (this.state && this.state.roomCode) ? this.state.roomCode : "";

        if (roomCode) {
            fetch("api.ashx?action=send-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: roomCode,
                    playerIndex: myIdx,
                    author: author,
                    crestId: crestInfo.crestId,
                    crestColor: crestInfo.tincture,
                    text: text
                })
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.chat) {
                        self.handleIncomingChatMessages([res.chat], false, true);
                    }
                })
                .catch(function () { });
        } else {
            var localMsg = {
                id: "local_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
                code: "LOCAL",
                playerIndex: myIdx,
                author: author,
                crestId: crestInfo.crestId,
                crestColor: crestInfo.tincture,
                text: text,
                timestamp: Date.now()
            };
            this.handleIncomingChatMessages([localMsg], false, true);
        }

        if (window.PRS_Audio && window.PRS_Audio.playNotice) {
            window.PRS_Audio.playNotice();
        }
    },

    sendQuickShout: function (shoutKeyOrText) {
        if (!shoutKeyOrText) return;
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var shoutMap = {
            "duel": isEn ? "⚔️ I challenge you to a tournament duel!" : "⚔️ Vyzývám tě na turnajový duel!",
            "toast": isEn ? "🍻 A toast to the Queen and good neighbors!" : "🍻 Připíjím na královnu a dobré sousedy!",
            "dragon": isEn ? "🐉 Dragon on the horizon, take cover!" : "🐉 Drak na obzoru, kryjte se!",
            "peace": isEn ? "🤝 I offer honorable peace and friendship." : "🤝 Nabízím čestný mír a přátelství.",
            "village": isEn ? "🏰 My estate grows, prepare your rent!" : "🏰 Mé panství roste, chystejte nájem!",
            "victory": isEn ? "👑 The Princess's Heart shall soon be mine!" : "👑 Princeznino srdce bude brzy mé!"
        };
        var textToSend = shoutMap[shoutKeyOrText] || shoutKeyOrText;
        if (isEn && !shoutMap[shoutKeyOrText]) {
            if (shoutKeyOrText.indexOf("turnajový duel") !== -1) textToSend = "⚔️ I challenge you to a tournament duel!";
            else if (shoutKeyOrText.indexOf("Připíjím na královnu") !== -1) textToSend = "🍻 A toast to the Queen and good neighbors!";
            else if (shoutKeyOrText.indexOf("Drak na obzoru") !== -1) textToSend = "🐉 Dragon on the horizon, take cover!";
            else if (shoutKeyOrText.indexOf("Nabízím čestný mír") !== -1) textToSend = "🤝 I offer honorable peace and friendship.";
            else if (shoutKeyOrText.indexOf("Mé panství roste") !== -1) textToSend = "🏰 My estate grows, prepare your rent!";
            else if (shoutKeyOrText.indexOf("Princeznino srdce bude brzy mé") !== -1) textToSend = "👑 The Princess's Heart shall soon be mine!";
        }
        this.sendChatMessage(textToSend);
    },

    handleIncomingChatMessages: function (messages, isInitial, isLocalSend) {
        if (!messages || !Array.isArray(messages) || messages.length === 0) return;
        this._chatMessages = this._chatMessages || [];
        this._seenChatIds = this._seenChatIds || {};

        var newCount = 0;
        for (var i = 0; i < messages.length; i++) {
            var msg = messages[i];
            if (!msg || !msg.id || this._seenChatIds[msg.id]) continue;
            this._seenChatIds[msg.id] = true;
            this._chatMessages.push(msg);
            newCount++;
        }

        if (newCount === 0) return;

        if (this._chatMessages.length > 80) {
            this._chatMessages = this._chatMessages.slice(this._chatMessages.length - 80);
        }

        if (!this._isChatDrawerOpen && !isInitial && !isLocalSend) {
            this._unreadChatCount = (this._unreadChatCount || 0) + newCount;
            var badge = document.getElementById("chat-unread-badge");
            if (badge) {
                badge.textContent = this._unreadChatCount > 9 ? "9+" : String(this._unreadChatCount);
                badge.style.display = "inline-block";
            }
            if (window.PRS_Audio && window.PRS_Audio.playNotice) {
                window.PRS_Audio.playNotice();
            }
        }

        this.renderChatMessagesList();
        if (this._isChatDrawerOpen) {
            this.scrollChatToBottom();
        }
    },

    renderChatMessagesList: function () {
        var container = document.getElementById("online-chat-messages");
        if (!container) return;

        if (!this._chatMessages || this._chatMessages.length === 0) {
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var emptyTxt = isEn
                ? "💬 No messages at the table yet.<br/>Type a message or pick a quick shout above!"
                : "💬 Žádné zprávy u stolu.<br/>Napiš zprávu nebo zvol rychlý pokřik výše!";
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.78rem; padding:2rem 0.5rem; font-style:italic;">' + emptyTxt + '</div>';
            return;
        }

        var myIdx = (this.myOnlinePlayerIndex >= 0) ? this.myOnlinePlayerIndex : (this.state ? this.state.currentPlayerIndex : 0);
        var html = "";

        for (var i = 0; i < this._chatMessages.length; i++) {
            var m = this._chatMessages[i];
            if (m.isSystem) {
                html += '<div class="chat-system-msg">' + this.escapeHtml(m.text) + '</div>';
                continue;
            }

            var isMe = (m.playerIndex === myIdx);
            var crestHtml = "";
            if (window.PRS_renderCrestBadgeHTML) {
                crestHtml = window.PRS_renderCrestBadgeHTML(m.crestId || "lion", m.crestColor || "gold", 26);
            }

            var timeStr = "";
            if (m.timestamp) {
                var d = new Date(m.timestamp);
                var hh = String(d.getHours()).padStart(2, "0");
                var mm = String(d.getMinutes()).padStart(2, "0");
                timeStr = hh + ":" + mm;
            }

            var tinc = (window.PRS_getTinctureByKey) ? window.PRS_getTinctureByKey(m.crestColor) : null;
            var authorColor = (tinc && tinc.text) ? tinc.text : "var(--gold-light)";

            html += '<div class="chat-msg-item' + (isMe ? ' from-me' : '') + '">' +
                '<div style="flex-shrink:0;">' + crestHtml + '</div>' +
                '<div class="chat-msg-body">' +
                    '<div class="chat-msg-header">' +
                        '<span class="chat-msg-author" style="color:' + authorColor + ';">' + this.escapeHtml(m.author || "Rytíř") + (isMe ? ' (Ty)' : '') + '</span>' +
                        '<span class="chat-msg-time">' + timeStr + '</span>' +
                    '</div>' +
                    '<div class="chat-msg-text">' + this.escapeHtml(m.text) + '</div>' +
                '</div>' +
            '</div>';
        }

        container.innerHTML = html;
    }

    });

    window.PRS_onGoogleLoginSuccess = function (response) {
        console.log("[Google Auth] Přijata odpověď z Google Identity Services:", response);
        var fb = document.getElementById("auth-feedback");
        var gfb = document.getElementById("auth-google-feedback");
        var setMsg = function (col, text) {
            if (fb) { fb.style.color = col; fb.textContent = text; }
            if (gfb) { gfb.style.color = col; gfb.textContent = text; }
        };

        setMsg("#38bdf8", "⏳ Ověřuji rytířský Google účet v královské matrice...");

        if (!response || !response.credential) {
            var msgNoCred = "Google přihlášení neposkytlo ověřovací token.";
            setMsg("#f87171", "⚠️ " + msgNoCred);
            return;
        }

        var nickInput = document.getElementById("auth-google-nickname");
        var desiredNick = (nickInput ? nickInput.value : "").trim();
        if (!desiredNick) {
            try { desiredNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }
        }

        fetch("api.ashx?action=google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                credential: response.credential,
                displayName: desiredNick
            })
        })
            .then(function (r) {
                return r.text().then(function (txt) {
                    try {
                        return JSON.parse(txt);
                    } catch (pe) {
                        throw new Error("Neplatná odpověď serveru (HTTP " + r.status + "): " + txt.substring(0, 100));
                    }
                });
            })
            .then(function (res) {
                if (res && res.ok && res.user) {
                    setMsg("#4ade80", "✅ Přihlášení úspěšné! Vítej, " + (res.user.displayName || res.user.username) + "!");
                    if (window.PRS_App) {
                        PRS_App.currentUser = res.user;
                        if (typeof res.user.credits === "number") PRS_App.userCredits = res.user.credits;
                        if (res.user.selectedPawnId) PRS_App.selectedPawnId = res.user.selectedPawnId;
                        if (res.user.unlockedPawnsJson) {
                            try {
                                var unl = JSON.parse(res.user.unlockedPawnsJson);
                                if (Array.isArray(unl) && unl.length > 0) PRS_App.unlockedPawns = unl;
                            } catch (e2) { }
                        }
                        if (PRS_App.lobbyPlayers && PRS_App.lobbyPlayers[0]) {
                            PRS_App.lobbyPlayers[0].pawnId = PRS_App.selectedPawnId || "knight_valiant";
                        }
                        var effNick = res.user.displayName || desiredNick || res.user.username;
                        if (effNick && effNick.indexOf("@") === -1 && effNick.toLowerCase() !== "host") {
                            try { localStorage.setItem("prs_player_nickname", effNick); } catch (e3) { }
                        }
                        try { localStorage.setItem("prs_user", JSON.stringify(PRS_App.currentUser)); } catch (e4) { }
                        PRS_App.updateUserUI();
                        PRS_App.updateGameHallUI();

                        setTimeout(function () {
                            PRS_App.closeAuthModal();
                            if (typeof PRS_App.rebindOnlineSeatAfterLogin === "function") {
                                PRS_App.rebindOnlineSeatAfterLogin();
                            }
                            PRS_App.enterGameHall();
                            PRS_App.fetchServerStatusAndSessions();
                            if (window.PRS_Audio && window.PRS_Audio.playFanfare) {
                                window.PRS_Audio.playFanfare();
                            }
                        }, 500);
                    }
                } else {
                    var errMsg = (res && res.message) ? res.message : "Přihlášení přes Google selhalo.";
                    setMsg("#f87171", "⚠️ " + errMsg);
                }
            })
            .catch(function (err) {
                var netErr = "Chyba při ověřování Google účtu: " + (err.message || err);
                setMsg("#f87171", "⚠️ " + netErr);
            });
    };

    window.PRS_handleGoogleCredentialResponse = window.PRS_onGoogleLoginSuccess;
    if (window._pendingGoogleResponse) {
        window.PRS_onGoogleLoginSuccess(window._pendingGoogleResponse);
        window._pendingGoogleResponse = null;
    }

})();

