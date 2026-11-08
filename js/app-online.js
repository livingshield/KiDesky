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

        var myRoleText = myPl

            ? '🛡️ Hraješ za: <strong style="color:' + myPl.color + ';">' + myPl.badge + ' ' + this.escapeHtml(myPl.name) + '</strong>'

            : '🛋️ Všichni hráči (Hot-Seat bez zámku)';

        var optionsHtml = '<option value="-1" ' + (this.myOnlinePlayerIndex === -1 ? 'selected' : '') + '>🛋️ Všichni hráči u 1 PC (Hot-Seat bez zámku)</option>';

        for (var i = 0; i < this.state.players.length; i++) {

            var pl = this.state.players[i];

            var typeTag = (pl.type === "Human") ? "Hráč" : "PC";

            optionsHtml += '<option value="' + i + '" ' + (this.myOnlinePlayerIndex === i ? 'selected' : '') + '>🛡️ ' + pl.badge + ' ' + (i + 1) + '. ' + this.escapeHtml(pl.name) + ' (' + typeTag + ')</option>';

        }

        barEl.innerHTML = '<div class="online-room-banner">' +

            '<div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">' +

            '  <span class="online-pulse-dot" title="Online místnost je aktivní"></span>' +

            '  <span style="font-size:0.88rem; color:#f0f9ff;">🌐 Online Stůl: <strong style="color:var(--gold-light); letter-spacing:1px; font-size:0.98rem;">' + this.escapeHtml(code) + '</strong></span>' +

            '  <button class="btn-secondary" style="font-size:0.76rem; padding:0.22rem 0.55rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.copyRoomInviteLink()">📋 Kopírovat odkaz pro přátele</button>' +

            '  <span id="online-copy-feedback" style="font-size:0.76rem; color:#86efac;"></span>' +

            '</div>' +

            '<div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">' +

            '  <span style="font-size:0.82rem; background:rgba(0,0,0,0.3); border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:0.22rem 0.55rem;">' + myRoleText + '</span>' +

            '  <button class="btn-gold-lg" style="font-size:0.76rem; padding:0.24rem 0.6rem;" onclick="PRS_App.openOnlineRoleModal()" title="Zvolit si rytíře pro tuto online partii">👤 Zvolit / změnit rytíře</button>' +

            '  <button class="btn-secondary" style="font-size:0.76rem; padding:0.24rem 0.6rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.openOnlineSeatsModal()" title="Spravovat křesla u stolu a nahradit nepřítomné hráče boty">🏰 Křesla &amp; Boti</button>' +

            '  <button class="btn-secondary" style="font-size:0.75rem; padding:0.22rem 0.5rem;" onclick="PRS_App.pollOnlineSessionNow(true)" title="Okamžitě zkontrolovat tah ze serveru">🔄 Sync (Tah #' + (this.state.turnNumber || 1) + ')</button>' +

            '</div>' +

            '</div>';

    },

    setMyOnlinePlayerSlot: function (val) {

        var idx = parseInt(val, 10);

        if (isNaN(idx)) idx = -1;

        this.claimOnlineRole(idx);

    },

    // --- MODAL VÝBĚRU POSTAVY PRO ONLINE MULTIPLAYER ---

    openOnlineRoleModal: function () {

        var modal = document.getElementById("online-role-modal");

        if (!modal || !this.state) return;

        var infoEl = document.getElementById("online-role-room-info");

        if (infoEl) {

            var diffLabel = { easy: "🌿 Easy", standard: "👑 Standard", hard: "⚔️ Hard", ultimate: "💀 Ultimate" }[(this.state.config && this.state.config.difficultyMode) || "standard"] || "👑 Standard";

            infoEl.innerHTML = 'Kód místnosti: <strong style="color:var(--gold-light); letter-spacing:1px;">' + this.escapeHtml(this.state.roomCode || "") + '</strong> | Cíl: <strong>' + (this.state.config.targetHearts || 30) + ' 💖</strong> | Mód: <strong style="color:#fde68a;">' + diffLabel + '</strong> | Kolo: #' + this.state.roundNumber;

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

        var html = [];

        for (var i = 0; i < this.state.players.length; i++) {

            var pl = this.state.players[i];

            var isHost = (i === 0 || !!pl.isOnlineHost);

            var isHuman = (pl.type === "Human");

            var isMyCurrentSlot = (this.myOnlinePlayerIndex === i);

            var st = window.PRS_GameEngine ? window.PRS_GameEngine.getEffectiveStats(this.state, pl) : pl.skills;

            var roleTag = '';

            if (isMyCurrentSlot) {

                roleTag = '<span style="background:#22c55e; color:#fff; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">✅ Tvoje role</span>';

            } else if (isHost) {

                roleTag = '<span style="background:rgba(234,179,8,0.2); color:#fbbf24; border:1px solid #fbbf24; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">👑 Hostitel</span>';

            } else if (isHuman) {

                roleTag = '<span style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #38bdf8; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">👤 Jiný hráč</span>';

            } else {

                roleTag = '<span style="background:rgba(34,197,94,0.18); color:#86efac; border:1px solid #22c55e; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">✨ Volné (PC)</span>';

            }

            html.push('<div class="podium-card" style="background:rgba(20,15,10,0.92); border:1.5px solid ' + (isMyCurrentSlot ? '#22c55e' : pl.color) + '; width:100%; box-sizing:border-box; padding:0.85rem; text-align:center;">');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');

            html.push('    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:bold;">#' + (i + 1) + '</span>');

            html.push('    ' + roleTag);

            html.push('  </div>');

            html.push('  <div style="margin:0.25rem 0;">' + (this.getPlayerPawnAvatarHtml ? this.getPlayerPawnAvatarHtml(pl, 52) : ('<div style="font-size:1.8rem;">' + pl.badge + '</div>')) + '</div>');

            html.push('  <div style="font-size:1rem; font-weight:bold; color:' + pl.color + '; margin-bottom:0.2rem;">' + this.escapeHtml(pl.name) + '</div>');

            html.push('  <div style="font-size:0.85rem; color:#f472b6; font-weight:bold; margin-bottom:0.5rem;">' + pl.totalHearts + ' 💖 • ' + pl.gold.toLocaleString("cs-CZ") + ' zl.</div>');

            html.push('  <div style="display:flex; justify-content:center; gap:0.4rem; font-size:0.76rem; margin-bottom:0.75rem; color:var(--text-muted); background:rgba(0,0,0,0.3); border-radius:6px; padding:0.25rem;">');

            html.push('    <span>⚔️' + (st.boj || 0) + '</span>');

            html.push('    <span>🏇' + (st.jizda || 0) + '</span>');

            html.push('    <span>💃' + (st.tanec || 0) + '</span>');

            html.push('    <span>✨' + (st.charisma || 0) + '</span>');

            html.push('  </div>');

            if (isMyCurrentSlot) {

                html.push('  <button class="btn-secondary" disabled style="width:100%; font-size:0.82rem; opacity:0.8; cursor:default;">✓ Hraješ za tohoto rytíře</button>');

            } else {

                html.push('  <button class="btn-gold-lg" style="width:100%; font-size:0.84rem; padding:0.4rem 0.5rem;" onclick="PRS_App.claimOnlineRole(' + i + ')">⚔️ Hrát za ' + this.escapeHtml(pl.name.replace(" (PC)", "").replace(" (Ty)", "")) + '</button>');

            }

            html.push('</div>');

        }

        grid.innerHTML = html.join("\n");

    },

    claimOnlineRole: function (selIdx) {

        if (!this.state) return;

        var nameInput = document.getElementById("online-player-custom-name");

        var customName = nameInput ? nameInput.value.trim() : "";

        if (selIdx >= 0 && selIdx < this.state.players.length) {

            var pl = this.state.players[selIdx];

            pl.type = "Human"; // Povýšení na lidského hráče, aby za něj netahal automatický bot!

            pl.pawnId = this.selectedPawnId || "knight_valiant"; // Nahrazení bot figurky vlastní zvolenou figurkou hráče!

            if (customName) {

                pl.name = customName;

            } else if (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username)) {

                pl.name = this.currentUser.displayName || this.currentUser.username;

            } else {

                pl.name = "Host";

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

            this.addLog("🛋️ Hraješ v režimu Hot-Seat (všechny postavy u 1 PC).", "turn");

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

                    fb.textContent = "✓ Odkaz zkopírován do schránky!";

                    setTimeout(function () { fb.textContent = ""; }, 3500);

                }

            }).catch(function () {
                KiDeskyDialog.prompt("Zkopíruj tento odkaz a pošli ho spoluhráčům:", inviteUrl, {
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
            if (savedRoom && activeTab === "board") {
                console.log("[KiDesky] Obnovuji online stůl z předchozí relace:", savedRoom);
                this.loadSessionFromCloud(savedRoom);
            }

        } catch (e) { }

    },

    startOnlinePollingLoop: function () {

        var self = this;

        if (this.onlinePollTimer) clearInterval(this.onlinePollTimer);

        this.onlinePollTimer = setInterval(function () {

            if (self.activeTab === "board" && self.onlinePollingEnabled && self.state && self.state.roomCode && !self.isMoveAnimating && !self.isOnlineSyncing) {

                self.pollOnlineSessionNow(false);

            }

        }, 3000);

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

                        var remoteState = JSON.parse(res.session.stateJson);

                        if (!remoteState || !remoteState.players) return;

                        self.lastKnownUpdatedAt = res.session.updatedAt;

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

                    // 4. Došlo k uložení na serveru s novým časovým razítkem (a já nejsem zrovna na tahu)?

                    else if (self.lastKnownUpdatedAt && res.updatedAt && res.updatedAt !== self.lastKnownUpdatedAt) {

                        var isMyTurnNow = (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex);

                        if (!isMyTurnNow) {

                            needsFullFetch = true;

                        }

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

    saveCurrentSessionToCloud: function () {

        var self = this;

        if (!this.state) return;

        var statusEl = document.getElementById("cloud-save-status");

        if (statusEl) statusEl.textContent = "Ukládám hru do databáze...";

        var payload = {

            sessionGuid: this.state.sessionGuid || "",

            roomCode: this.state.roomCode || "",

            title: "Princeznino srdce – Kolo " + this.state.roundNumber,

            boardCode: this.state.board ? this.state.board.code : "classic_96",

            status: this.state.phase === "GAME_OVER" ? "Finished" : "Active",

            currentTurnPlayer: this.state.currentPlayerIndex,

            turnNumber: this.state.turnNumber,

            expectedTurnNumber: (this.lastKnownTurnNumber !== undefined) ? this.lastKnownTurnNumber : -1,

            targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,

            difficultyMode: (this.state.config && this.state.config.difficultyMode) ? this.state.config.difficultyMode : "standard",

            winnerName: (this.state.winner ? this.state.winner.name : null),

            stateJson: JSON.stringify(this.state),

            players: this.state.players

        };

        var isNewRoom = !this.state.roomCode;

        if (isNewRoom && this.myOnlinePlayerIndex < 0) {

            this.myOnlinePlayerIndex = 0;

            if (this.state.players && this.state.players[0]) {

                this.state.players[0].isOnlineHost = true;

                this.state.players[0].type = "Human";

            }

        }

        fetch("api.ashx?action=save-session", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify(payload)

        })

            .then(function (r) {

                if (r.status === 409) {

                    return r.json().then(function (conf) {

                        if (statusEl) statusEl.innerHTML = "⚠️ Konflikt: Tah byl odehrán na jiném zařízení.";

                        self.handleTurnConflict(conf);

                    });

                }

                if (!r.ok) {

                    throw new Error("HTTP " + r.status);

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

                        if (statusEl) statusEl.innerHTML = "✅ Uloženo! Kód místnosti: <strong>" + res.roomCode + "</strong>";

                        self.renderOnlineRoomBar();

                        self.fetchServerStatusAndSessions();

                        self.addLog("☁️ Hra uložena do cloudu! Kód online místnosti: " + res.roomCode, "turn");

                    } else {

                        if (statusEl) statusEl.textContent = "⚠️ Uloženo lokálně v prohlížeči.";

                        localStorage.setItem("prs_saved_game", JSON.stringify(self.state));

                    }

                });

            })

            .catch(function (err) {

                localStorage.setItem("prs_saved_game", JSON.stringify(self.state));

                if (statusEl) statusEl.textContent = "💾 Uloženo do lokální paměti prohlížeče.";

                KiDeskyDialog.alert("Nepodařilo se synchronizovat online místnost se serverem (" + (err && err.message ? self.escapeHtml(err.message) : err) + "). Hra je uložena lokálně v prohlížeči.", {
                    title: "Offline režim",
                    icon: "⚠️"
                });

            });

    },

    saveSessionAuto: function () {

        var self = this;

        if (!this.state || !this.state.sessionGuid) return Promise.resolve();

        this.isSavingSession = true;

        var payload = {

            sessionGuid: this.state.sessionGuid,

            roomCode: this.state.roomCode || this.state.sessionGuid.substring(0, 6).toUpperCase(),

            title: "Princeznino srdce – Kolo " + this.state.roundNumber,

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

                    self.renderSavedSessionsList(res.sessions);

                }

            })

            .catch(function () { });

    },

    renderSavedSessionsList: function (sessions) {

        var box = document.getElementById("saved-sessions-list");

        if (!box) return;

        if (!sessions || sessions.length === 0) {

            box.innerHTML = '<div class="empty-note">Zatím žádné uložené rozehrané partie na serveru.</div>';

            return;

        }

        var html = "";

        for (var i = 0; i < sessions.length; i++) {

            var s = sessions[i];

            html += '<div class="saved-session-row">' +

                '<div><strong>' + this.escapeHtml(s.title) + '</strong> <span class="room-code-pill">Kód: ' + s.roomCode + '</span><br/><small>Tah ' + s.turnNumber + ' | Cíl: ' + s.targetHearts + ' 💖 | ' + s.updatedAt + '</small></div>' +

                '<button class="btn-action-buy" onclick="PRS_App.loadSessionFromCloud(\'' + s.roomCode + '\')">▶️ Načíst</button>' +

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

                    self.state = JSON.parse(res.session.stateJson);

                    self.state.sessionGuid = res.session.sessionGuid;

                    self.state.roomCode = res.session.roomCode;

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

                    // Zjistíme, zda už má tento hráč v prohlížeči pro tuto místnost vybranou postavu

                    var savedSlot = null;

                    try {

                        savedSlot = localStorage.getItem("prs_slot_" + self.state.roomCode);

                    } catch (e) { }

                    if (savedSlot !== null && savedSlot !== undefined && savedSlot !== "" && savedSlot !== "-1") {

                        self.myOnlinePlayerIndex = parseInt(savedSlot, 10);

                        self.renderGameScreen();

                    } else {

                        // Nově připojený hráč si musí ihned vybrat postavu, za kterou chce hrát!

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

