// ============================================================================
// KiDesky: Princeznino srdce - Rytířská herna, časovač tahu, reakce a spouštění partií
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    ensurePlayerNameForGame: async function () {
        // Pokud je uživatel přihlášený (Admin / Hráč s profilem), použijeme jeho přihlášené jméno
        if (this.currentUser && this.currentUser.role !== "Guest") {
            return this.getDefaultPlayerName();
        }

        // Hráč hraje v režimu Host: zeptáme se na jméno pro tuto partii
        var prevNick = "";
        try { prevNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }
        if (!prevNick || prevNick.toLowerCase() === "host" || prevNick.toLowerCase() === "admin") {
            prevNick = "Lord Filip";
        }

        var entered = await KiDeskyDialog.prompt("Zadej své rytířské jméno u stolu pro tuto výpravu královstvím:", prevNick, {
            title: "Rytířská registrace k výpravě",
            icon: "⚔️",
            placeholder: "Zadej rytířské jméno",
            confirmText: "⚔️ Vstoupit ke stolu",
            cancelText: "Zrušit"
        });
        if (entered === null) {
            // Uživatel kliknul na Zrušit / Storno -> nestartujeme hru
            return null;
        }

        entered = entered.trim();
        if (!entered) entered = prevNick || "Lord Filip";

        try { localStorage.setItem("prs_player_nickname", entered); } catch (e) { }

        var formatted = entered.replace(/\s*\(Ty\)$/i, "") + " (Ty)";
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = formatted;
            this.renderLobbyPlayers();
        }
        return formatted;
    },

    quickStartSoloGame: async function (preset) {

        var myName = await this.ensurePlayerNameForGame();
        if (!myName) return;

        this.lobbyPlayers = [

            { name: myName, type: "Human", pawnId: this.selectedPawnId || "knight_valiant" },

            { name: "Černý Baron (PC)", type: "Bot_Aggressive", pawnId: "bot_aggressive" },

            { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder", pawnId: "bot_breeder" },

            { name: "Kněžna Eliška (PC)", type: "Bot_Noble", pawnId: "bot_noble" }

        ];

        this.renderLobbyPlayers();

        var boardSel = document.getElementById("lobby-board-select");

        var targetSel = document.getElementById("lobby-target-hearts");

        var diffSel = document.getElementById("lobby-difficulty-mode");

        var scenSel = document.getElementById("lobby-game-scenario");

        if (preset === "fast") {

            if (boardSel) boardSel.value = "compact_48";

            if (scenSel) scenSel.value = "sprint";

            if (diffSel) diffSel.value = "standard";

            this.handleDifficultyChange("standard");

        } else if (preset === "ultimate") {

            if (boardSel) boardSel.value = "classic_96";

            if (scenSel) scenSel.value = "classic";

            if (diffSel) diffSel.value = "ultimate";

            this.handleDifficultyChange("ultimate");

        } else {

            if (boardSel) boardSel.value = "classic_96";

            if (scenSel) scenSel.value = "classic";

            if (diffSel) diffSel.value = "standard";

            this.handleDifficultyChange("standard");

        }

        this._skipNamePromptOnce = true;
        this.startNewGame(true);

    },

    createOnlineMultiplayerRoom: async function () {

        var self = this;

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            alert("🔒 Založit novou online místnost mohou pouze přihlášení rytíři.\n\nJako Host se můžeš připojit k jakémukoliv stolu zadáním 6místného kódu od kamaráda.\n\nPro založení vlastního online stolu se stačí bezplatně přihlásit nebo zaregistrovat!");
            this.openAuthModal();
            return;
        }

        var myName = await this.ensurePlayerNameForGame();
        if (!myName) return;
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = myName;
            this.renderLobbyPlayers();
        }
        this._skipNamePromptOnce = true;

        var btn = document.getElementById("btn-create-online-room");

        var origText = btn ? btn.innerHTML : "";

        if (btn) {

            btn.disabled = true;

            btn.innerHTML = "⏳ Zakládám online stůl na serveru...";

        }

        this.startNewGame(false);

        if (!this.state) {

            if (btn) { btn.disabled = false; btn.innerHTML = origText; }

            return;

        }

        // Hostitel automaticky hraje za hráče č. 0

        this.myOnlinePlayerIndex = 0;

        if (this.state.players && this.state.players[0]) {

            this.state.players[0].isOnlineHost = true;

            this.state.players[0].type = "Human";

            var hostDispName = (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username))

                ? (this.currentUser.displayName || this.currentUser.username)

                : "Host";

            this.state.players[0].name = hostDispName + " (Hostitel)";

        }

        var title = "Online stůl (" + ((this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username)) ? (this.currentUser.displayName || this.currentUser.username) : "Host") + ")";

        PRS_Api.post("save-session", {
            sessionGuid: this.state.sessionGuid || "",
            roomCode: this.state.roomCode || "",
            title: title,
            hostUsername: (this.currentUser && this.currentUser.role !== "Guest") ? (this.currentUser.username || this.currentUser.displayName || "Admin") : "Guest",
            boardCode: (this.state.board && this.state.board.code) ? this.state.board.code : "classic_96",
            targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,
            turnNumber: this.state.turnNumber || 1,
            expectedTurnNumber: 0,
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        })
            .then(function (res) {
                if (res && res._httpStatus && (res._httpStatus < 200 || res._httpStatus >= 300)) {
                    throw new Error(res.message || ("Server vrátil HTTP " + res._httpStatus));
                }
                return res;
            })

            .then(function (res) {

                if (btn) { btn.disabled = false; btn.innerHTML = origText; }

                if (res && res.ok) {

                    self.state.sessionGuid = res.sessionGuid;

                    self.state.roomCode = res.roomCode;

                    self.lastKnownTurnNumber = self.state.turnNumber;

                    try {

                        localStorage.setItem("prs_slot_" + res.roomCode, "0");

                    } catch (e) { }

                    var codeInput = document.getElementById("join-room-code-input");

                    if (codeInput) codeInput.value = res.roomCode;

                    self.hasGameStarted = true;
                    self.updateUserUI();
                    self.fetchServerStatusAndSessions();
            if (self.updateSavedGamesUI) self.updateSavedGamesUI();

                    self.switchTab("board");

                    self.renderGameScreen();

                    self.addLog("🌐 Založena nová Online místnost! Pošli přátelům 6místný kód stolu: " + res.roomCode, "win");

                    if (window.PRS_Audio) window.PRS_Audio.playFanfare();

                    self.copyRoomInviteLink();

                    alert("🎉 Online stůl byl úspěšně založen!\n\nKód místnosti: " + res.roomCode + "\n\nOdkaz pro přátele byl zkopírován do schránky.");

                } else {

                    alert("Nepodařilo se založit online stůl: " + (res && res.error ? res.error : "Neznámá chyba serveru."));

                    self.switchTab("board");

                }

            })

            .catch(function (err) {

                if (btn) { btn.disabled = false; btn.innerHTML = origText; }

                alert("Chyba při zakládání místnosti na serveru: " + (err && err.message ? err.message : err));

                self.switchTab("board");

            });

    },

    // --- LOBBY & NASTAVENÍ NOVÉ HRY ---,

    renderLobbyPlayers: function () {

        var container = document.getElementById("lobby-players-list");

        if (!container) return;

        var html = "";

        for (var i = 0; i < this.lobbyPlayers.length; i++) {

            var p = this.lobbyPlayers[i];

            var col = window.PRS_GameEngine.PLAYER_COLORS[i % window.PRS_GameEngine.PLAYER_COLORS.length];

            if (!p.pawnId && window.PRS_getDefaultPawnIdForPlayer) {
                p.pawnId = window.PRS_getDefaultPawnIdForPlayer(p, i);
            }
            var pawnObj = window.PRS_getPawnById ? window.PRS_getPawnById(p.pawnId) : null;
            var pawnImg = pawnObj ? pawnObj.img : "assets/pawns/pawn_knight_valiant.webp";
            var pawnTitle = pawnObj ? pawnObj.name : "Zvolit figurku";

            var optHuman = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.human") : "👤 Člověk (u stolu)";
            var optAggressive = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_aggressive") : "⚔️ PC Válečník (Lovec draků)";
            var optBreeder = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_breeder") : "🐎 PC Chovatel (Sady zvířat)";
            var optNoble = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_noble") : "👑 PC Dvořan (Diplomacie & Ples)";
            var optBalanced = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_balanced") : "⚖️ PC Rytíř (Vyvážený)";
            var optEasy = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_easy") : "🌱 PC Panoš (Opatrný)";

            var pDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(p) : p.name;

            var tLobby = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
            var placeholder = (i === 0)
                ? (' placeholder="' + this.escapeHtml(tLobby("lobby.placeholder_p1", "Tvoje rytířská přezdívka (např. Sir Gawain)")) + '" title="' + this.escapeHtml(tLobby("lobby.placeholder_p1_title", "Zadej svou herní přezdívku (jméno rytíře u stolu)")) + '"')
                : (' placeholder="' + this.escapeHtml(tLobby("lobby.placeholder_other", "Jméno hráče / PC bota")) + '"');

            html += '<div class="lobby-player-row">' +

                '<button type="button" class="lobby-pawn-btn" onclick="PRS_App.openPawnShopModal(' + i + ')" title="Figurka: ' + this.escapeHtml(pawnTitle) + ' (klepni pro změnu figurky)" style="width:36px; height:36px; border-radius:50%; padding:0; background:radial-gradient(circle, ' + col.hex + ' 0%, #1a0f0a 85%); border:2px solid #ffd86b; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; position:relative; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.65);">' +
                '  <img src="' + pawnImg + '" alt="" style="width:105%; height:105%; object-fit:contain; border-radius:50%;"/>' +
                '  <span style="position:absolute; bottom:-3px; right:-3px; background:#1e130c; border:1px solid #ffd86b; border-radius:50%; width:14px; height:14px; font-size:8px; display:flex; align-items:center; justify-content:center; color:#ffd86b;">🎭</span>' +
                '</button>' +

                '<input type="text" class="prs-input" value="' + this.escapeHtml(pDisplayName) + '"' + placeholder + ' oninput="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" onchange="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" />' +

                '<select class="prs-select" onchange="PRS_App.updateLobbyPlayerType(' + i + ', this.value)">' +

                '  <option value="Human" ' + (p.type === "Human" ? "selected" : "") + '>' + optHuman + '</option>' +

                '  <option value="Bot_Aggressive" ' + (p.type === "Bot_Aggressive" ? "selected" : "") + '>' + optAggressive + '</option>' +

                '  <option value="Bot_Breeder" ' + (p.type === "Bot_Breeder" ? "selected" : "") + '>' + optBreeder + '</option>' +

                '  <option value="Bot_Noble" ' + (p.type === "Bot_Noble" ? "selected" : "") + '>' + optNoble + '</option>' +

                '  <option value="Bot_Balanced" ' + (p.type === "Bot_Balanced" ? "selected" : "") + '>' + optBalanced + '</option>' +

                '  <option value="Bot_Easy" ' + (p.type === "Bot_Easy" ? "selected" : "") + '>' + optEasy + '</option>' +

                '</select>' +

                (this.lobbyPlayers.length > 2

                    ? '<button class="btn-icon-danger" onclick="PRS_App.removeLobbyPlayer(' + i + ')" title="Odebrat hráče">✕</button>'

                    : '') +

                '</div>';

        }

        container.innerHTML = html;

    },

    updateLobbyPlayerName: function (idx, val) {

        if (this.lobbyPlayers[idx]) {

            this.lobbyPlayers[idx].name = val;

            if (idx === 0) {

                var cleanNick = (val || "").replace(/\s*\(Ty\)$/i, "").trim();

                if (cleanNick && cleanNick.toLowerCase() !== "host") {

                    try {

                        localStorage.setItem("prs_player_nickname", cleanNick);

                        if (this.currentUser && this.currentUser.role !== "Guest") {

                            this.currentUser.displayName = cleanNick;

                            localStorage.setItem("prs_user", JSON.stringify(this.currentUser));

                            if (this.currentUser.username) {

                                PRS_Api.post("update_nickname", { displayName: cleanNick }).catch(function (err) { console.warn("[KiDesky] updateLobbyPlayerName sync failed:", err); });

                            }

                        }

                    } catch (e) { console.warn("[KiDesky] lobby nickname persist error:", e); }

                }

            }

        }

    },

    updateLobbyPlayerType: function (idx, val) {

        if (this.lobbyPlayers[idx]) {
            this.lobbyPlayers[idx].type = val;
            if (window.PRS_getDefaultPawnIdForPlayer) {
                this.lobbyPlayers[idx].pawnId = window.PRS_getDefaultPawnIdForPlayer({ type: val }, idx);
            }
            this.renderLobbyPlayers();
        }

    },

    addLobbyPlayer: function () {

        if (this.lobbyPlayers.length >= 6) return;

        var idx = this.lobbyPlayers.length;

        var col = window.PRS_GameEngine.PLAYER_COLORS[idx];

        this.lobbyPlayers.push({ name: col.name, type: "Bot_Balanced", pawnId: "bot_balanced" });

        this.renderLobbyPlayers();

    },

    // --- TAHOVÝ ČASOVAČ (TURN TIMER) ---
    startTurnTimer: function () {
        this.stopTurnTimer();
        if (!this.state || !this.state.config || !this.state.config.turnTimerSeconds || this.state.config.turnTimerSeconds <= 0) return;
        if (this.state.phase === "GAME_OVER") return;

        var total = this.state.config.turnTimerSeconds;
        this.turnTimerRemaining = total;
        this.turnTimerTotal = total;
        this.updateTurnTimerUI();

        var self = this;
        this.turnTimerInterval = setInterval(function () {
            if (!self.state || self.state.phase === "GAME_OVER") {
                self.stopTurnTimer();
                return;
            }
            self.turnTimerRemaining--;
            self.updateTurnTimerUI();

            var isMyTurn = (self.myOnlinePlayerIndex < 0 || self.state.currentPlayerIndex === self.myOnlinePlayerIndex);
            if (self.turnTimerRemaining === 10 && isMyTurn && window.PRS_Audio) {
                window.PRS_Audio.playNotice();
            }

            if (self.turnTimerRemaining <= 0) {
                self.stopTurnTimer();
                self.handleTurnTimeout();
            }
        }, 1000);
    },

    stopTurnTimer: function () {
        if (this.turnTimerInterval) {
            clearInterval(this.turnTimerInterval);
            this.turnTimerInterval = null;
        }
    },

    updateTurnTimerUI: function () {
        var el = document.getElementById("turn-timer-hud");
        if (!el) return;
        if (!this.state || !this.state.config || !this.state.config.turnTimerSeconds || this.state.config.turnTimerSeconds <= 0 || this.state.phase === "GAME_OVER") {
            el.innerHTML = "";
            return;
        }
        var total = this.state.config.turnTimerSeconds;
        var rem = Math.max(0, this.turnTimerRemaining !== undefined ? this.turnTimerRemaining : total);
        var pct = Math.max(0, Math.min(100, Math.round((rem / total) * 100)));
        var color = (rem <= 10) ? '#ef4444' : (rem <= 25 ? '#f59e0b' : '#10b981');
        var isUrgent = (rem <= 10);

        el.innerHTML = '<div class="turn-timer-bar-wrap">' +
            '  <div class="turn-timer-header">' +
            '    <span>⏱️ Limit tahu: <strong style="color:' + color + ';">' + rem + 's</strong> / ' + total + 's</span>' +
            (isUrgent ? '    <span class="timer-pulse-warning">⚠️ Vyprší za chvíli!</span>' : '') +
            '  </div>' +
            '  <div class="turn-timer-track">' +
            '    <div class="turn-timer-fill" style="width:' + pct + '%; background:' + color + ';"></div>' +
            '  </div>' +
            '</div>';
    },

    handleTurnTimeout: function () {
        if (!this.state || this.state.phase === "GAME_OVER") return;
        var curIdx = this.state.currentPlayerIndex;
        var curP = this.state.players[curIdx];
        var isMyTurn = (this.myOnlinePlayerIndex < 0 || curIdx === this.myOnlinePlayerIndex);

        if (isMyTurn && curP && curP.type === "Human") {
            this.addLog("⏱️ Časový limit pro tvůj tah vypršel – akce byla provedena automaticky.", "danger");
            if (this.state.phase === "ROLL") {
                this.handleRollDice();
            } else {
                this.handleEndTurn();
            }
        } else if (this.state.roomCode && !isMyTurn && curP && curP.type === "Human") {
            this.addLog("⏱️ Hráč " + curP.name + " nestihl svůj tah v časovém limitu.", "danger");
            var actEl = document.getElementById("turn-action-panel");
            if (actEl) {
                var btn = document.getElementById("afk-takeover-btn");
                if (!btn) {
                    var notice = document.createElement("div");
                    notice.style.marginTop = "0.6rem";
                    notice.innerHTML = '<button id="afk-takeover-btn" class="btn-primary" style="width:100%; background:#dc2626; border-color:#f87171; font-weight:700; padding:0.6rem;" onclick="PRS_App.takeOverAfkTurnAsBot()">⚡ Hráč neodpovídá - Předat tah královskému botovi</button>';
                    actEl.appendChild(notice);
                }
            }
        }
    },

        renderKnightEmotesHud: function () {
        var el = document.getElementById("knight-emotes-hud");
        if (!el) return;
        if (!this.state || this.state.phase === "GAME_OVER") {
            el.innerHTML = "";
            return;
        }
        var t = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
        el.innerHTML = '<div class="knight-emotes-bar">' +
            '  <span class="emotes-label">' + t("reactions.label", "💬 Reakce:") + '</span>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'⚔️\', \'' + t("reactions.to_arms", "Do zbraně!") + '\')" title="' + t("reactions.to_arms", "Do zbraně!") + '">⚔️</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'👑\', \'' + t("reactions.hail_king", "Sláva králi!") + '\')" title="' + t("reactions.hail_king", "Sláva králi!") + '">👑</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🛡️\', \'' + t("reactions.on_guard", "Držím stráž!") + '\')" title="' + t("reactions.on_guard", "Držím stráž!") + '">🛡️</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🍷\', \'' + t("reactions.cheers", "Na zdraví!") + '\')" title="' + t("reactions.cheers", "Na zdraví!") + '">🍷</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🐉\', \'' + t("reactions.beware_dragon", "Pozor na draka!") + '\')" title="' + t("reactions.beware_dragon", "Pozor na draka!") + '">🐉</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'👏\', \'' + t("reactions.great_move", "Skvělý tah!") + '\')" title="' + t("reactions.great_move", "Skvělý tah!") + '">👏</button>' +
            '</div>';
    },

    toggleEmotePicker: function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        var hudEl = document.getElementById("knight-emotes-hud");
        if (hudEl) {
            if (hudEl.style.display === "none") {
                hudEl.style.display = "block";
            } else {
                hudEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    },

    removeLobbyPlayer: function (idx) {

        if (this.lobbyPlayers.length <= 2) return;

        this.lobbyPlayers.splice(idx, 1);

        this.renderLobbyPlayers();

    },

    rerollProceduralMap: async function () {
        var newSeed = Math.floor(Math.random() * 899999 + 100000);
        this.currentBoardSeed = newSeed;
        this.mapStudioSeed = newSeed;
        if (this.mapStudioOptions) this.mapStudioOptions.seed = newSeed;

        var lobbySel = document.getElementById("lobby-board-select");
        if (lobbySel) lobbySel.value = "procedural";

        var bSel = document.getElementById("board-template-select");
        if (bSel) bSel.value = "procedural";

        if (this.state && this.state.turnNumber > 0) {
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var msg = window.PRS_I18n ? window.PRS_I18n.t("dialogs.new_realm.msg", { seed: newSeed }) : ("Generování nového světa vyžaduje novou partii.\nPřeješ si vygenerovat nové království (Seed #" + newSeed + ") a začít novou hru?");
            var conf = await KiDeskyDialog.confirm(msg, {
                title: window.PRS_I18n ? window.PRS_I18n.t("dialogs.new_realm.title") : "Nové království",
                icon: "🎲",
                confirmText: window.PRS_I18n ? window.PRS_I18n.t("dialogs.new_realm.confirm") : "🎲 Vygenerovat a začít",
                cancelText: window.PRS_I18n ? window.PRS_I18n.t("dialogs.new_realm.cancel") : "Zpět k partii"
            });
            if (!conf) return;
        }

        this.startNewGame(true);
        if (this.state && this.state.board) {
            var name = this.state.board.name || ("Království osudu #" + newSeed);
            if (this.showPawnToast) {
                this.showPawnToast(this.state.currentPlayerIndex, name, "🎲", "#38bdf8", "rgba(15, 23, 42, 0.96)");
            }
        }
    },

    handleLobbyBoardSelectChange: function (boardCode) {
        if (boardCode === "custom_dynamic") {
            this.openMapStudioModal();
        } else if (boardCode && String(boardCode).indexOf("saved_map_") === 0) {
            var idx = parseInt(String(boardCode).replace("saved_map_", ""), 10);
            this.applySavedFavoriteMap(idx);
        }
    },

    loadBoardTemplatesFromServer: function (cb) {
        var self = this;
        PRS_Api.get("list-board-templates")
            .then(function (res) {
                if (res && res.ok && Array.isArray(res.templates)) {
                    if (window.PRS_BoardBuilder && window.PRS_BoardBuilder.registerDbTemplates) {
                        window.PRS_BoardBuilder.registerDbTemplates(res.templates);
                    }
                    self.refreshBoardTemplateSelects();
                }
                if (typeof cb === "function") cb(res);
            })
            .catch(function () {
                if (typeof cb === "function") cb(null);
            });
    },

    refreshBoardTemplateSelects: function () {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var t = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var tilesWord = isEn ? "tiles" : "polí";

        var defaultTemplates = isEn ? [
            { templateCode: "classic_96", name: "Royal Wilderness 96 (Grand Map)", nodeCount: 96 },
            { templateCode: "dragon_4598", name: "Dragon Trail (Medium Map – 64 tiles)", nodeCount: 64 },
            { templateCode: "delta_84", name: "Royal Delta & Islands (Map – 84 tiles)", nodeCount: 84 },
            { templateCode: "compact_48", name: "Knight's Jousting Grounds (Fast Game – 48 tiles)", nodeCount: 48 }
        ] : [
            { templateCode: "classic_96", name: "Královská divočina 96 (Velký plán)", nodeCount: 96 },
            { templateCode: "dragon_4598", name: "Dračí stezka (Střední plán – 64 polí)", nodeCount: 64 },
            { templateCode: "delta_84", name: "Královská delta & Ostrovy (Plán – 84 polí)", nodeCount: 84 },
            { templateCode: "compact_48", name: "Rytířské kolbiště (Rychlá hra – 48 polí)", nodeCount: 48 }
        ];

        var list = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.getActiveTemplatesList) ? window.PRS_BoardBuilder.getActiveTemplatesList() : defaultTemplates;
        var lobbySel = document.getElementById("lobby-board-select");
        var boardSel = document.getElementById("board-template-select");
        var simSel = document.getElementById("sim-board-select");

        var savedMaps = [];
        try { savedMaps = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { savedMaps = []; }

        var self = this;
        function populateSelect(sel, prefix) {
            if (!sel) return;
            var curVal = sel.value || "classic_96";
            var html = "";

            // 1. Předdefinované / systémové plány
            html += '<optgroup label="' + self.escapeHtml(t("ui.board_bar.preset_group", null, "👑 Předdefinované herní plány:")) + '">';
            for (var i = 0; i < list.length; i++) {
                var tmpl = list[i];
                var tName = tmpl.name;
                if (isEn) {
                    if (tmpl.templateCode === "classic_96") tName = "Royal Wilderness 96 (Grand Map)";
                    else if (tmpl.templateCode === "dragon_4598") tName = "Dragon Trail (Medium Map – 64 tiles)";
                    else if (tmpl.templateCode === "delta_84") tName = "Royal Delta & Islands (Map – 84 tiles)";
                    else if (tmpl.templateCode === "compact_48") tName = "Knight's Jousting Grounds (Fast Game – 48 tiles)";
                }
                var label = (prefix ? (prefix + tName) : tName) + (tmpl.nodeCount ? (" (" + tmpl.nodeCount + " " + tilesWord + ")") : "");
                html += '<option value="' + self.escapeHtml(tmpl.templateCode) + '">' + self.escapeHtml(label) + '</option>';
            }
            html += '</optgroup>';

            // 2. Moje uložené dynamické plány z Map Studia
            if (savedMaps.length > 0) {
                html += '<optgroup label="' + self.escapeHtml(t("ui.board_bar.saved_group", null, "⭐ Moje uložené dynamické plány:")) + '">';
                for (var s = 0; s < savedMaps.length; s++) {
                    var sm = savedMaps[s];
                    var smName = sm.name || ((isEn ? "Custom Map #" : "Vlastní plán #") + (sm.seed || s + 1));
                    var cleanSmName = smName.replace(/\s*\(\d+\s*(?:polí|tiles)?\)/gi, "");
                    if (isEn) {
                        cleanSmName = cleanSmName.replace(/Dračí království\s*#/gi, "Dragon Realm #")
                                                 .replace(/Vlastní království\s*#/gi, "Custom Realm #");
                    }
                    var smLabel = (prefix ? prefix : "") + "⭐ " + cleanSmName + " (" + (sm.nodeCount || 96) + " " + tilesWord + ")";
                    html += '<option value="saved_map_' + s + '">' + self.escapeHtml(smLabel) + '</option>';
                }
                html += '</optgroup>';
            }

            // 3. Tvůrce & Generátor
            html += '<optgroup label="' + self.escapeHtml(t("ui.board_bar.studio_group", null, "🛠️ Tvůrce & Generátor:")) + '">';
            var dynName = t("ui.board_bar.custom_dynamic", null, "🛠️ Vlastní dynamický plán (Map Studio)");
            var rndName = t("ui.board_bar.random_realm", null, "🎲 Náhodné království (Procedurální)");
            html += '<option value="custom_dynamic">' + (prefix ? (prefix + (isEn ? "Custom Dynamic (Map Studio)" : "Vlastní dynamický (Map Studio)")) : dynName) + '</option>';
            html += '<option value="procedural">' + (prefix ? (prefix + (isEn ? "Random Realm" : "Náhodné království")) : rndName) + '</option>';
            html += '</optgroup>';

            sel.innerHTML = html;
            var exists = false;
            if (sel.options) {
                for (var j = 0; j < sel.options.length; j++) {
                    if (sel.options[j].value === curVal) { exists = true; break; }
                }
                sel.value = exists ? curVal : (sel.options[0] ? sel.options[0].value : "classic_96");
            }
        }

        var mapPfx = t("ui.board_bar.map_prefix", null, "Plán: ");
        populateSelect(lobbySel, "");
        populateSelect(boardSel, mapPfx);
        populateSelect(simSel, "🗺️ " + mapPfx);
    },

    changeBoardTemplateLive: async function (boardCode) {
        if (boardCode === "custom_dynamic") {
            this.openMapStudioModal();
            return;
        }

        if (this.state && this.state.turnNumber > 0) {

            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var msg = isEn
                ? "You cannot switch maps in an active game without restarting.\nDo you really want to end the current game and start a new one on the selected map?"
                : "V rozehrané partii nelze měnit mapu bez restartu hry.\nPřeješ si opravdu ukončit aktuální partii a začít novou hru na zvoleném plánu?";
            var conf = await KiDeskyDialog.confirm(msg, {
                title: isEn ? "Change Realm Map" : "Změna mapy království",
                icon: "🗺️",
                confirmText: isEn ? "🗺️ Switch Map & Restart" : "🗺️ Změnit mapu",
                cancelText: isEn ? "Keep Current" : "Ponechat stávající"
            });

            if (!conf) {

                var s = document.getElementById("board-template-select");

                if (s && this.state.config && this.state.config.boardTemplate) {

                    s.value = this.state.config.boardTemplate;

                }

                return;

            }

        }

        if (boardCode && String(boardCode).indexOf("saved_map_") === 0) {
            var idx = parseInt(String(boardCode).replace("saved_map_", ""), 10);
            this.applySavedFavoriteMap(idx);
        }

        var lobbySel = document.getElementById("lobby-board-select");

        if (lobbySel) lobbySel.value = boardCode;

        this.startNewGame(false);

    },

    startNewGame: async function (switchToBoard) {

        if (switchToBoard) {
            if (!this._skipNamePromptOnce) {
                var myName = await this.ensurePlayerNameForGame();
                if (!myName) return;
                if (this.lobbyPlayers && this.lobbyPlayers[0]) {
                    this.lobbyPlayers[0].name = myName;
                    this.renderLobbyPlayers();
                }
            }
            this._skipNamePromptOnce = false;
        }

        this.victoryModalShown = false;

        this.closeVictoryModal();

        if (this.autoBotTimer) {

            clearTimeout(this.autoBotTimer);

            this.autoBotTimer = null;

        }

        var boardSel = document.getElementById("lobby-board-select");

        var scenSel = document.getElementById("lobby-game-scenario");

        var diffSel = document.getElementById("lobby-difficulty-mode");

        var timerSel = document.getElementById("lobby-turn-timer");

        var turnTimerSec = timerSel ? parseInt(timerSel.value, 10) : 0;

        var royalSel = document.getElementById("lobby-royal-castle");
        var royalCastle = royalSel ? royalSel.value : (this.selectedRoyalCastle || "auto");
        this.selectedRoyalCastle = royalCastle;

        var boardCode = boardSel ? boardSel.value : "classic_96";

        var scenario = scenSel ? scenSel.value : (this.selectedGameScenario || "classic");

        var difficultyMode = diffSel ? diffSel.value : (this.selectedDifficultyMode || "standard");

        this.selectedGameScenario = scenario;

        this.selectedDifficultyMode = difficultyMode;

        var targetHearts = 30;

        if (scenario === "sprint") targetHearts = 15;

        else if (scenario === "classic") targetHearts = 30;

        else if (scenario === "slayer") targetHearts = 30;

        else if (scenario === "tycoon") targetHearts = 30;

        else if (scenario === "epic") targetHearts = 45;

        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].pawnId = this.selectedPawnId || this.lobbyPlayers[0].pawnId || "knight_valiant";
            var myCrest = (typeof this.getPlayerCrest === "function") ? this.getPlayerCrest() : { crestId: "lion", tincture: "gold" };
            this.lobbyPlayers[0].crestId = myCrest.crestId;
            this.lobbyPlayers[0].crestColor = myCrest.tincture;
        }

        var isDynamicOrProc = (boardCode === "procedural" || boardCode === "custom_dynamic" || (boardCode && String(boardCode).indexOf("saved_map_") === 0));
        var activeSeed = isDynamicOrProc ? (this.currentBoardSeed || (this.currentBoardSeed = Math.floor(Math.random() * 899999 + 100000))) : null;
        var customRec = (boardCode === "custom_dynamic" || (boardCode && String(boardCode).indexOf("saved_map_") === 0)) ? this.customBoardRecipe : null;

        this.state = window.PRS_GameEngine.createGame({

            config: this.activeConfig,

            boardCode: boardCode,
            boardSeed: activeSeed,
            seed: activeSeed,
            royalCastle: royalCastle,
            customRecipe: customRec,
            customBoard: (boardCode === "custom_dynamic" || (boardCode && String(boardCode).indexOf("saved_map_") === 0)) ? this._customProceduralBoard : null,

            scenario: scenario,

            difficultyMode: difficultyMode,

            targetHearts: targetHearts,

            players: this.lobbyPlayers

        });

        if (this.state && this.state.config) {
            this.state.config.turnTimerSeconds = turnTimerSec;
        }

        if (this.state) {
            this.state.roomCode = null;
            this.state.sessionGuid = null;
        }
        this.roomCode = null;
        this.sessionGuid = null;

        try {
            localStorage.removeItem("prs_active_online_room");
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, "", window.location.pathname);
            }
        } catch (e) { }

        this.selectedNodeId = 0;

        this.lastKnownTurnNumber = 1;

        if (isDynamicOrProc && window.PRS_Api) {
            try {
                PRS_Api.post("log-telemetry", {
                    eventType: "WorldGenerated",
                    turnNumber: 1,
                    message: "Vygenerováno království #" + this.currentBoardSeed + " (" + (this.state.board ? this.state.board.name : "Neznámé") + ")",
                    payloadJson: JSON.stringify({
                        seed: this.currentBoardSeed,
                        scenario: scenario,
                        difficulty: difficultyMode,
                        playerCount: this.state.players.length
                    })
                }).catch(function (err) { console.warn("[KiDesky] log-telemetry failed:", err); });
            } catch (e) { console.warn("[KiDesky] telemetry payload error:", e); }
        }

        this.isBoardStaticDirty = true;

        this.resetZoomAndPan();

        this.renderGameScreen();

        if (switchToBoard) {

            this.hasGameStarted = true;
            this.updateUserUI();
            if (this.saveActiveGameAutosave) this.saveActiveGameAutosave();
            if (this.updateSavedGamesUI) this.updateSavedGamesUI();

            if (window.PRS_Audio) window.PRS_Audio.playNotice();

            this.switchTab("board");

            this.scheduleBotTurnIfNeeded();

            this.startTurnTimer();

            var skipDecree = false;
            try { skipDecree = (localStorage.getItem("prs_skip_story_decree") === "1"); } catch (eDec) { }
            if (!skipDecree && typeof this.openStoryDecreeModal === "function") {
                this.openStoryDecreeModal();
            }

        }

    },

    // --- FÁZE 4 & 5: MULTIPLAYER, EMOTES, TUTORIÁL & SCÉNÁŘE ---

    myOnlinePlayerIndex: 0,

    onlinePollingTimer: null,

    isEmotePickerOpen: false,

    tutorialCurrentStep: 0,

    selectedGameScenario: "classic",

    _lastSeenEmoteTime: 0,

    handleScenarioChange: function (scenarioKey) {

        this.selectedGameScenario = scenarioKey;

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    handleRoyalCastleChange: function (castleKey) {

        this.selectedRoyalCastle = castleKey;

        if (typeof localStorage !== "undefined") {
            try { localStorage.setItem("kidesky_royal_castle", castleKey); } catch (e) { }
        }

        if (window.PRS_Audio) window.PRS_Audio.playItem();

    },

    handleDifficultyChange: function (mode) {
        this.selectedDifficultyMode = mode;
        var infoEl = document.getElementById("lobby-difficulty-info");
        var btn = document.getElementById("lobby-start-game-btn");
        var mKey = (mode === "easy" || mode === "hard" || mode === "ultimate") ? mode : "standard";
        if (infoEl) {
            infoEl.innerHTML = window.PRS_I18n ? window.PRS_I18n.t("lobby.difficulty_info." + mKey) : "";
        }
        if (btn) {
            btn.innerHTML = window.PRS_I18n ? window.PRS_I18n.t("lobby.start_btn." + mKey) : "🎲 Rozdat 10 000 zl. a zahájit partii!";
        }
        if (window.PRS_Audio) window.PRS_Audio.playStep();
    },

    refreshLobbySettingsSelects: function () {
        if (!window.PRS_I18n) return;
        var t = function (k, d) { return window.PRS_I18n.t(k, null, d); };

        var scenEl = document.getElementById("lobby-game-scenario");
        if (scenEl) {
            var curScen = scenEl.value;
            scenEl.innerHTML = 
                '<option value="sprint">' + t("lobby.scenarios.sprint", "⚡ Rychlovka (15 💖)") + '</option>' +
                '<option value="classic">' + t("lobby.scenarios.classic", "💖 Klasika (30 💖)") + '</option>' +
                '<option value="slayer">' + t("lobby.scenarios.slayer", "🐉 Lovci draků (2 draci)") + '</option>' +
                '<option value="tycoon">' + t("lobby.scenarios.tycoon", "🏰 Magnát (3 města+hrad)") + '</option>' +
                '<option value="epic">' + t("lobby.scenarios.epic", "👑 Epické (45 💖)") + '</option>';
            if (curScen) scenEl.value = curScen;
        }

        var diffEl = document.getElementById("lobby-difficulty-mode");
        if (diffEl) {
            var curDiff = diffEl.value || this.selectedDifficultyMode || "standard";
            diffEl.innerHTML =
                '<option value="easy">' + t("lobby.difficulties.easy", "🌿 Pohádkový (Easy)") + '</option>' +
                '<option value="standard">' + t("lobby.difficulties.standard", "👑 Standardní (50% sazby)") + '</option>' +
                '<option value="hard">' + t("lobby.difficulties.hard", "⚔️ Rytířská výzva (Hard)") + '</option>' +
                '<option value="ultimate">' + t("lobby.difficulties.ultimate", "💀 Na život a smrt (Ultimate)") + '</option>';
            diffEl.value = curDiff;
        }

        var timerEl = document.getElementById("lobby-turn-timer");
        if (timerEl) {
            var curTimer = timerEl.value;
            timerEl.innerHTML =
                '<option value="0">' + t("lobby.timers.unlimited", "♾️ Bez limitu (volné tempo)") + '</option>' +
                '<option value="60">' + t("lobby.timers.fast_60", "⏱️ Rychlý tah (60 vteřin)") + '</option>' +
                '<option value="90">' + t("lobby.timers.standard_90", "⏳ Standardní (90 vteřin)") + '</option>' +
                '<option value="45">' + t("lobby.timers.blitz_45", "⚡ Bleskový (45 vteřin)") + '</option>';
            if (curTimer) timerEl.value = curTimer;
        }

        var castleEl = document.getElementById("lobby-royal-castle");
        if (castleEl) {
            var curCastle = castleEl.value;
            castleEl.innerHTML =
                '<option value="auto">' + t("lobby.castles.auto", "🎲 Pestré (při každé hře jiné)") + '</option>' +
                '<option value="castle_royal">' + t("lobby.castles.castle_royal", "👑 Královský hrad (Sídlo koruny)") + '</option>' +
                '<option value="castle_forest">' + t("lobby.castles.castle_forest", "🌲 Lesní hrad Doubrava") + '</option>' +
                '<option value="castle_ice">' + t("lobby.castles.castle_ice", "❄️ Ledový palác Věčného mrazu") + '</option>' +
                '<option value="castle_lava">' + t("lobby.castles.castle_lava", "🌋 Sopečná pevnost Lávový chřtán") + '</option>' +
                '<option value="castle_crystal">' + t("lobby.castles.castle_crystal", "💎 Křišťálový zámek Ametyst") + '</option>' +
                '<option value="castle_wind">' + t("lobby.castles.castle_wind", "☁️ Větrný vzdušný zámek Boreas") + '</option>' +
                '<option value="castle_water">' + t("lobby.castles.castle_water", "🌊 Vodní citadela Oceán") + '</option>' +
                '<option value="castle_desert">' + t("lobby.castles.castle_desert", "🏜️ Pouštní pískovcový palác") + '</option>' +
                '<option value="castle_swamp">' + t("lobby.castles.castle_swamp", "🌫️ Bažinná tvrz Černá tůň") + '</option>' +
                '<option value="castle_dark">' + t("lobby.castles.castle_dark", "🌑 Temný podzemní hrad Erebus") + '</option>';
            if (curCastle) castleEl.value = curCastle;
        }

        this.handleDifficultyChange(this.selectedDifficultyMode || "standard");
    },

    openStoryDecreeModal: function () {
        var modal = document.getElementById("story-decree-modal");
        if (!modal || !this.state) return;

        var tDec = function (key, params, fb) {
            return (window.PRS_I18n && typeof window.PRS_I18n.t === "function")
                ? window.PRS_I18n.t(key, params, fb)
                : fb;
        };

        var cfg = this.state.config || {};
        var scen = cfg.scenario || "classic";
        var targetH = cfg.targetHearts || 30;
        var targetD = cfg.targetDragons || 2;

        var textKey = "story.decree_classic_text";
        var goalKey = "story.decree_classic_goal";
        var goalParams = { target: targetH };
        if (scen === "sprint") { textKey = "story.decree_sprint_text"; goalKey = "story.decree_sprint_goal"; }
        else if (scen === "epic") { textKey = "story.decree_epic_text"; goalKey = "story.decree_epic_goal"; }
        else if (scen === "slayer") { textKey = "story.decree_slayer_text"; goalKey = "story.decree_slayer_goal"; goalParams = { target: targetD }; }
        else if (scen === "tycoon") { textKey = "story.decree_tycoon_text"; goalKey = "story.decree_tycoon_goal"; goalParams = null; }

        var txtEl = document.getElementById("story-decree-text");
        var goalEl = document.getElementById("story-decree-goal");
        var skipCb = document.getElementById("story-decree-skip-cb");

        if (txtEl) txtEl.textContent = tDec(textKey, null, "");
        if (goalEl) goalEl.textContent = tDec(goalKey, goalParams, "");
        if (skipCb) {
            try { skipCb.checked = (localStorage.getItem("prs_skip_story_decree") === "1"); } catch (e) { skipCb.checked = false; }
        }

        modal.style.display = "flex";
        this.updateBodyModalClass();
    },

    closeStoryDecreeModal: function () {
        var modal = document.getElementById("story-decree-modal");
        var skipCb = document.getElementById("story-decree-skip-cb");
        if (skipCb) {
            try {
                if (skipCb.checked) localStorage.setItem("prs_skip_story_decree", "1");
                else localStorage.removeItem("prs_skip_story_decree");
            } catch (e) { }
        }
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    sendPlayerEmote: function (emoji, label) {

        this.isEmotePickerOpen = false;

        var pIdx = (typeof this.myOnlinePlayerIndex === "number") ? this.myOnlinePlayerIndex : this.state.currentPlayerIndex;

        this.showPawnToast(pIdx, label, emoji, "#fef08a", "rgba(30, 20, 15, 0.96)");

        if (window.PRS_Audio) window.PRS_Audio.playStep();

        if (this.state && this.state.roomCode) {

            this.state.lastEmote = { playerIndex: pIdx, emoji: emoji, label: label, timestamp: Date.now() };

            this.saveSessionAuto();

        }

        this.renderOnlineRoomBar();

    }
    });
})();
