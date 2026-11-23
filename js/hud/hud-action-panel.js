// ============================================================================
// KiDesky: Princeznino srdce - Akční panel tahu (rozčleněn podle herních fází) a kronika
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    renderActionPanel: function () {
        var el = document.getElementById("turn-action-panel");
        if (!el || !this.state) return;

        if (this.state.phase === "GAME_OVER") {
            this._renderActionPhaseGameOver(el);
            return;
        }

        var player = this.state.players[this.state.currentPlayerIndex];
        var currNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;
        var isBot = (player.type !== "Human");

        if (this._renderActionPhaseBotOrWait(el, player, currNode, isBot)) {
            return;
        }

        if (this.state.phase === "ROLL") {
            this._renderActionPhaseRoll(el, player, currNode, isBot);
            return;
        }

        if (this.state.phase === "BRANCH_CHOICE" && this._renderActionPhaseBranch(el, player)) {
            return;
        }

        this._renderActionPhaseLanded(el, player, currNode);
    }
,

    _renderActionPhaseGameOver: function (el) {
        var winP = this.state.players[this.state.winnerIndex || 0];

            if (!this.victoryModalShown) {

                this.victoryModalShown = true;

                var self = this;

                setTimeout(function () { self.openVictoryModal(); }, 400);

            }


            var tHudG = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

            var headTitle = tHudG("hud.game_over_banner_title", {
                badge: (winP ? winP.badge : "👑"),
                name: this.escapeHtml(winP ? winP.name : "Vítěz")
            }, ("👑 Královská svatba! Vítězem je " + (winP ? winP.badge : "👑") + " " + this.escapeHtml(winP ? winP.name : "Vítěz") + "!"));

            var descText = "";
            if (this.state.winType === "slayer_dragons") {
                descText = tHudG("hud.game_over_banner_slayer", { round: this.state.roundNumber }, ("Skolil 2 obávané draky království za " + this.state.roundNumber + " kol a získává ruku princezny."));
            } else if (this.state.winType === "tycoon_estates") {
                descText = tHudG("hud.game_over_banner_tycoon", { round: this.state.roundNumber }, ("Ovládl 3 města a královský hrad za " + this.state.roundNumber + " kol a získává ruku princezny."));
            } else {
                var heartsVal = winP ? winP.totalHearts : 30;
                descText = tHudG("hud.game_over_banner_default", { hearts: heartsVal, round: this.state.roundNumber }, ("Získal celkem <strong>" + heartsVal + " 💖</strong> za " + this.state.roundNumber + " kol a získává ruku princezny."));
            }

            var btnEndless = tHudG("hud.game_over_banner_endless", null, "♾️ Pokračovat v nekonečné hře");
            var btnEndlessTitle = tHudG("hud.game_over_banner_endless_title", null, "Pokračovat ve volné hře na stávajícím herním plánu");
            var btnCeremony = tHudG("hud.game_over_banner_ceremony", null, "👑 Otevřít ceremoniál &amp; Síň slávy");
            var btnNewG = tHudG("hud.endless_banner_new_game", null, "🔄 Nová partie");

            el.innerHTML = '<div class="action-card victory-banner">' +
                '<h3>' + headTitle + '</h3>' +
                '<p>' + descText + '</p>' +
                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.6rem;">' +
                '  <button class="btn-gold-lg" onclick="PRS_App.continueInEndlessMode()" title="' + btnEndlessTitle + '">' + btnEndless + '</button>' +
                '  <button class="btn-secondary" onclick="PRS_App.openVictoryModal()">' + btnCeremony + '</button>' +
                '  <button class="btn-secondary" onclick="PRS_App.startNewGame(true)">' + btnNewG + '</button>' +
                '</div>' +
                '</div>';
    },

    _renderActionPhaseBotOrWait: function (el, player, currNode, isBot) {
        // Pokud jsme v Online místnosti s uzamčenou rolí (myOnlinePlayerIndex >= 0) a na tahu je jiný lidský hráč:

        if (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot) {

            // Pokud hráč na tahu ve skutečnosti patří tomuto přihlášenému uživateli, okamžitě přepneme lokální slot
            if (typeof this.isMySlot === "function" && this.isMySlot(player, this.state.currentPlayerIndex)) {
                this.myOnlinePlayerIndex = this.state.currentPlayerIndex;
                player.type = "Human";
                player.claimedBy = this.getOnlineClientId();
                try {
                    localStorage.setItem("prs_slot_" + this.state.roomCode, String(this.state.currentPlayerIndex));
                } catch (e) { }
                this.saveCurrentSessionToCloud();
            } else {
                var myP = this.state.players[this.myOnlinePlayerIndex];
                var myName = myP ? myP.name : "Tvůj rytíř";

                var canClaimActiveTurn = false;
                if (this.currentUser && this.currentUser.role !== "Guest") {
                    var curU = (this.currentUser.username || "").toLowerCase();
                    var curD = (this.currentUser.displayName || "").toLowerCase();
                    var pClean = (player.name || "").replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").trim().toLowerCase();
                    if (pClean === curD || pClean === curU || (player.isOnlineHost && (this.state.hostUsername || "").toLowerCase() === curU)) {
                        canClaimActiveTurn = true;
                    }
                }

                var claimBtnHtml = '';
                if (canClaimActiveTurn) {
                    claimBtnHtml = '<div style="margin-bottom:0.75rem;"><button class="btn-gold-lg" style="width:100%; font-size:0.92rem; padding:0.5rem 0.85rem; background:linear-gradient(135deg, #d4af37, #b45309); border-color:#fef08a;" onclick="PRS_App.claimOnlineRole(' + this.state.currentPlayerIndex + ')">⚔️ Hrát za ' + this.escapeHtml(player.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Ty\)/gi, "")) + ' (Převzít svůj tah)</button></div>';
                }

                var isHostWaiting = typeof this.amIOnlineHost === "function" && this.amIOnlineHost();
                var afkHostControls = '';
                if (isHostWaiting && player.type === "Human" && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex) {
                    var elapsedSec = 0;
                    var turnKey = (this.state.turnNumber || 1) + "_" + this.state.currentPlayerIndex;
                    if (this._inactivityTurnStart && this._inactivityTrackingKey === turnKey) {
                        elapsedSec = Math.floor((Date.now() - this._inactivityTurnStart) / 1000);
                    }
                    var m = Math.floor(elapsedSec / 60);
                    var s = elapsedSec % 60;
                    var timeStr = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
                    var isAfk = (elapsedSec >= 120);

                    afkHostControls = '<div style="margin:0.65rem 0; padding:0.5rem 0.65rem; background:rgba(0,0,0,0.35); border:1px solid ' + (isAfk ? '#ef4444' : 'rgba(212,175,55,0.25)') + '; border-radius:8px;">' +
                        '<div style="font-size:0.75rem; color:' + (isAfk ? '#fca5a5' : '#cbd5e1') + '; margin-bottom:' + (isAfk ? '0.45rem' : '0.15rem') + '; display:flex; justify-content:space-between; align-items:center;">' +
                        '  <span>' + (window.PRS_I18n ? window.PRS_I18n.t("online.waiting_timer_label") : "⏱️ Čas rytíře na tahu:") + '</span>' +
                        '  <strong style="font-family:monospace; font-size:0.82rem; color:' + (isAfk ? '#ef4444' : '#fef08a') + ';">' + timeStr + (isAfk ? (window.PRS_I18n ? window.PRS_I18n.t("online.waiting_inactive_badge") : " (Neaktivní!)") : '') + '</strong>' +
                        '</div>' +
                        (isAfk
                            ? '<div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">' +
                              '  <button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_App.stepAfkPlayerOnce()">' + (window.PRS_I18n ? window.PRS_I18n.t("online.btn_step_bot_once") : "⚡ Odehrát 1 tah botem") + '</button>' +
                              '  <button class="btn-secondary" style="font-size:0.75rem; padding:0.25rem 0.5rem; border-color:#ef4444; color:#fca5a5;" onclick="PRS_App.convertSeatToBot(' + this.state.currentPlayerIndex + ')">🤖 Převést na PC</button>' +
                              '</div>'
                            : '<div style="font-size:0.7rem; color:var(--text-muted); text-align:center;">' + (window.PRS_I18n ? window.PRS_I18n.t("online.waiting_advisor_takeover_hint") : "Při neaktivitě > 2 min můžeš tah odehrát rádcem.") + '</div>'
                        ) +
                        '</div>';
                }

                el.innerHTML = '<div class="waiting-turn-card">' +
                    '<div style="font-size:1.5rem; margin-bottom:0.35rem;">⏳</div>' +
                    '<div style="font-family:\'Cinzel\',serif; font-size:1.05rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">' +
                    '  Čeká se na tah spoluhráče: <span style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</span>' +
                    '</div>' +
                    '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:0.75rem;">' +
                    '  Tvůj zvolený rytíř u stolu je <strong>' + this.escapeHtml(myName) + '</strong>. Herní plán se automaticky synchronizuje každé 3 sekundy.' +
                    '</p>' +
                    claimBtnHtml +
                    afkHostControls +
                    '<div style="display:flex; justify-content:center; gap:0.5rem; flex-wrap:wrap;">' +
                    '  <button class="btn-secondary" style="font-size:0.8rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.pollOnlineSessionNow(true)">🔄 Zkontrolovat tah hned</button>' +
                    '  <button class="btn-secondary" style="font-size:0.78rem;" onclick="PRS_App.setMyOnlinePlayerSlot(-1)">🔓 Odemknout (hrát za všechny u 1 PC)</button>' +
                    '</div>' +
                    '</div>';
                return true;
            }
        }

        // Trvalé stabilní zobrazení tahu bota - tlačítko je nahoře na pevné pozici, text pod ním
        if (isBot && this.autoBotEnabled) {
            var pDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(player) : player.name;
            var botRoll = this.state.lastRoll;
            var botLandedNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;
            var botLandedName = botLandedNode ? ((window.PRS_App && window.PRS_App.getNodeDisplayName) ? window.PRS_App.getNodeDisplayName(botLandedNode) : botLandedNode.name) : "";

            var botStatusText = "";
            if (this.state.phase === "ROLL") {
                botStatusText = window.PRS_I18n ? window.PRS_I18n.t("hud.bot_turn_preparing", null, "Připravuje se k hodu kostkou...") : "Připravuje se k hodu kostkou...";
            } else if (botRoll) {
                botStatusText = botLandedNode
                    ? (window.PRS_I18n ? window.PRS_I18n.t("hud.bot_turn_rolled", { roll: botRoll, name: this.escapeHtml(botLandedName) }) : ("Hodil <strong>" + botRoll + "</strong> a dorazil na pole <strong>" + this.escapeHtml(botLandedName) + "</strong>."))
                    : ("Hodil <strong>" + botRoll + "</strong>.");
            } else {
                botStatusText = isEnBotTurn ? "Making moves across the realm..." : "Provádí tah královstvím...";
            }

            var skipBtnText = isEnBotTurn ? "⚡ Skip directly to my turn" : "⚡ Přeskočit přímo na můj tah";
            var onTurnLabel = isEnBotTurn ? "On turn: " : "Na tahu: ";
            var botAutoNotice = isEnBotTurn
                ? "The AI turn runs automatically. Tap the button above to jump straight to your turn."
                : "Tah počítače běží automaticky. Klepnutím na tlačítko výše ihned skočíš na svůj tah.";

            el.innerHTML = '<div class="action-card" style="border-color:rgba(212,175,55,0.4);">' +
                '<div class="turn-indicator" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">' +
                '  <span>' + onTurnLabel + '<span style="color:' + player.color + ';">' + player.badge + ' <strong>' + this.escapeHtml(pDisplayName) + '</strong></span></span>' +
                '  <span style="font-size:0.75rem; color:var(--text-muted); background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:10px;">🤖 PC</span>' +
                '</div>' +
                '<div style="margin-bottom:0.75rem;">' +
                '  <button class="btn-gold-lg" style="width:100%; font-size:0.92rem; padding:0.58rem 0.85rem; font-weight:700; box-shadow:0 4px 14px rgba(212,175,55,0.3);" onclick="PRS_App.skipToNextHumanTurn()">' + skipBtnText + '</button>' +
                '</div>' +
                '<div class="bot-auto-status" style="text-align:center; padding:0.75rem 0.6rem; background:rgba(0,0,0,0.35); border-radius:10px; border:1px solid rgba(212,175,55,0.18);">' +
                '  <div style="font-size:0.98rem; font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.3rem;">🤖 ' + this.escapeHtml(pDisplayName) + '</div>' +
                '  <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:0.4rem;">' + botStatusText + '</div>' +
                '  <div style="font-size:0.75rem; color:var(--text-muted);">' + botAutoNotice + '</div>' +
                '</div>' +
                '</div>';
            return true;
        }
        return false;
    },

    _renderActionPhaseRoll: function (el, player, currNode, isBot) {
        var lastRollVal = this.state.lastRoll;

            var diceGlyph = this.getDiceGlyph(lastRollVal || 1);

            var diceStatus = lastRollVal ? (window.PRS_I18n ? window.PRS_I18n.t("hud.last_roll", { val: lastRollVal }, "Minulý hod: <strong>" + lastRollVal + "</strong>") : ("Minulý hod: <strong>" + lastRollVal + "</strong>")) : (window.PRS_I18n ? window.PRS_I18n.t("hud.prepare_dice", null, "Připrav kostku k hodu") : "Připrav kostku k hodu");

            var effStats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

            var hasHorse = (player.stats.horses > 0 || effStats.horses > 0);

            var curMode = this.selectedMovementMode || "standard";

            if (curMode === "horse" && !hasHorse) curMode = "standard";

            var modeLabels = {
                standard: window.PRS_I18n ? window.PRS_I18n.t("hud.roll_dice", null, "🎲 HODIT KOSTKOU (1–6)") : "🎲 HODIT KOSTKOU (1–6)",
                cautious: window.PRS_I18n ? window.PRS_I18n.t("hud.cautious_step", null, "🚶 OPATRNÝ KROK (1–4)") : "🚶 OPATRNÝ KROK (1–4)",
                horse: window.PRS_I18n ? window.PRS_I18n.t("hud.horse_gallop", null, "🏇 KOŇSKÝ CVAL (2d6)") : "🏇 KOŇSKÝ CVAL (2d6)"
            };

            var titleStandard = window.PRS_I18n ? window.PRS_I18n.t("hud.stance_march_title", null, "Běžný hod 1–6") : "Běžný hod 1–6";
            var titleCautious = window.PRS_I18n ? window.PRS_I18n.t("hud.stance_cautious_title", null, "Opatrný krok 1–4 pro přesné manévrování") : "Opatrný krok 1–4 pro přesné manévrování";
            var titleHorse = hasHorse
                ? (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop_title", null, "Házíš 2 kostkami (2d6) – volba trysku nebo manévru!") : "Házíš 2 kostkami (2d6) – volba trysku nebo manévru!")
                : (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop_locked_title", null, "Vyžaduje alespoň 1 koně ve stáji") : "Vyžaduje alespoň 1 koně ve stáji");

            var tempoSelectorHtml = isBot ? '' : (
                '<div class="movement-stance-selector">' +
                '  <div style="font-size:0.73rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:4px; font-weight:600;">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.movement_mode", null, "Režim pohybu:") : "Režim pohybu:") + '</div>' +
                '  <div class="movement-stance-grid">' +
                '    <button type="button" class="btn-tempo-option ' + (curMode === "standard" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'standard\')" title="' + titleStandard + '" data-i18n-title="hud.stance_march_title">' +
                '      <span class="tempo-icon">🎲</span>' +
                '      <span class="tempo-name" data-i18n="hud.stance_march">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_march", null, "Pochod") : "Pochod") + '</span>' +
                '      <span class="tempo-desc" data-i18n="hud.stance_march_desc">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_march_desc", null, "1–6 polí") : "1–6 polí") + '</span>' +
                '    </button>' +
                '    <button type="button" class="btn-tempo-option ' + (curMode === "cautious" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'cautious\')" title="' + titleCautious + '" data-i18n-title="hud.stance_cautious_title">' +
                '      <span class="tempo-icon">🚶</span>' +
                '      <span class="tempo-name" data-i18n="hud.stance_cautious">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_cautious", null, "Opatrný") : "Opatrný") + '</span>' +
                '      <span class="tempo-desc" data-i18n="hud.stance_cautious_desc">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_cautious_desc", null, "1–4 pole") : "1–4 pole") + '</span>' +
                '    </button>' +
                '    <button type="button" class="btn-tempo-option ' + (!hasHorse ? "disabled" : (curMode === "horse" ? "active" : "")) + '" ' + (!hasHorse ? 'disabled' : 'onclick="PRS_App.selectMovementMode(\'horse\')"') + ' title="' + titleHorse + '" data-i18n-title="' + (hasHorse ? "hud.stance_gallop_title" : "hud.stance_gallop_locked_title") + '">' +
                '      <span class="tempo-icon">🏇</span>' +
                '      <span class="tempo-name" data-i18n="hud.stance_gallop">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop", null, "Cval") : "Cval") + '</span>' +
                '      <span class="tempo-desc">' + (hasHorse ? (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop_desc", null, "2d6 volba") : "2d6 volba") : (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_locked", null, "Zamčeno") : "Zamčeno")) + '</span>' +
                '    </button>' +
                '  </div>' +
                '</div>'
            );

            var targetHearts = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;

            var tHud = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var hudCurr = window.PRS_I18n ? window.PRS_I18n.t("common.gold_symbol", null, "zl.") : "zl.";

            var treasuryBannerHtml = '<div class="turn-active-treasury-banner">' +

                '<div style="display:flex; justify-content:space-between; align-items:center;">' +

                '  <div style="display:flex; align-items:center; gap:0.45rem;">' +

                '    ' + this.getPlayerPawnAvatarHtml(player, 34) + 

                '    <div>' +

                '      <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">' + tHud("hud.active_knight", null, "Rytíř na tahu") + '</div>' +

                '      <strong style="color:' + player.color + '; font-size:0.95rem;">' + this.escapeHtml(this.getPlayerDisplayName ? this.getPlayerDisplayName(player) : player.name) + '</strong>' +

                '    </div>' +

                '  </div>' +

                '  <div style="text-align:right;">' +

                '    <div style="font-size:1.15rem; font-weight:900; color:#facc15; text-shadow:0 0 10px rgba(250,204,21,0.5);">🪙 ' + player.gold.toLocaleString(isHudEn ? "en-US" : "cs-CZ") + ' ' + hudCurr + '</div>' +

                '    <div style="font-size:0.76rem; font-weight:bold;">' + (this.state.config && this.state.config.scenario === "slayer" ? ('<span style="color:#ef4444;">' + tHud("hud.dragons_slain", { count: ((player.stats && player.stats.dragonsSlain) ? player.stats.dragonsSlain : 0) }, '🐉 ' + ((player.stats && player.stats.dragonsSlain) ? player.stats.dragonsSlain : 0) + ' / 2 draků') + '</span> <span style="color:#f472b6; font-size:0.72rem;">(' + player.totalHearts + ' 💖)</span>') : (this.state.config && this.state.config.scenario === "tycoon" ? ('<span style="color:#f59e0b;">' + tHud("hud.estates_owned", { count: (player.ownedNodes ? player.ownedNodes.length : 0) }, '🏰 ' + (player.ownedNodes ? player.ownedNodes.length : 0) + ' sídel') + '</span> <span style="color:#f472b6; font-size:0.72rem;">(' + player.totalHearts + ' 💖)</span>') : ('<span style="color:#f472b6;">💖 ' + player.totalHearts + ' / ' + targetHearts + '</span>'))) + '</div>' +

                '  </div>' +

                '</div>' +

                '</div>';

            var pouchHudHtml = this.getKnightPouchHudHtml(player, true);

            el.innerHTML = '<div class="action-card">' +

                treasuryBannerHtml +

                '<div class="dice-showcase-box">' +

                '  <div>' +

                '    <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.dice_box_title", null, "Královská hrací kostka") : "Královská hrací kostka") + '</div>' +

                '    <div style="font-size:0.92rem; color:var(--gold-light);">' + diceStatus + '</div>' +

                '  </div>' +

                '  <div id="dice-cube-el" class="dice-cube clickable-dice" onclick="PRS_App.handleRollDice()" title="' + (window.PRS_I18n ? window.PRS_I18n.t("dice.click_to_roll") : "Klepni na kostku pro hod!") + '">' + diceGlyph + '</div>' +

                '</div>' +

                tempoSelectorHtml +

                (isBot

                    ? '<button class="btn-gold-lg" style="width:100%;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.stepBotNow()">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.bot_playing", { name: this.escapeHtml(player.name) }, "🤖 Odehrát tah PC (" + this.escapeHtml(player.name) + ")") : "🤖 Odehrát tah PC (" + this.escapeHtml(player.name) + ")") + '</button>'

                    : '<button class="btn-gold-lg" style="width:100%;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.handleRollDice()">' + (modeLabels[curMode] || modeLabels.standard) + '</button>') +

                this.getRoyalAdvisorHtml(player, "ROLL", null, currNode) +

                pouchHudHtml +

                '</div>';
    },

    _renderActionPhaseBranch: function (el, player) {
        var pbc = this.state.pendingBranchChoice;

            if (pbc) {

                var junctionNode = this.state.board.nodes[pbc.junctionNodeId];

                var branchLowNode = this.state.board.nodes[pbc.branchLow];

                var branchHighNode = this.state.board.nodes[pbc.branchHigh];

                var targetLow = window.PRS_GameEngine.getTargetNodeForBranch(this.state, pbc.junctionNodeId, "low", pbc.remainingSteps);

                var targetHigh = window.PRS_GameEngine.getTargetNodeForBranch(this.state, pbc.junctionNodeId, "high", pbc.remainingSteps);

                var getNdName = function(node, fallback) {
                    if (!node) return fallback;
                    return (window.PRS_App && window.PRS_App.getNodeDisplayName) ? window.PRS_App.getNodeDisplayName(node) : node.name;
                };

                var lowName = getNdName(branchLowNode, window.PRS_I18n ? window.PRS_I18n.t("hud.outer_path", null, "Vnější cesta") : "Vnější cesta");
                var highName = getNdName(branchHighNode, window.PRS_I18n ? window.PRS_I18n.t("hud.royal_path", null, "Královská stezka") : "Královská stezka");
                var targetLowName = getNdName(targetLow, window.PRS_I18n ? window.PRS_I18n.t("hud.crossroads_tile_prefix", { id: pbc.branchLow }, "Pole #" + pbc.branchLow) : ("Pole #" + pbc.branchLow));
                var targetHighName = getNdName(targetHigh, window.PRS_I18n ? window.PRS_I18n.t("hud.crossroads_tile_prefix", { id: pbc.branchHigh }, "Pole #" + pbc.branchHigh) : ("Pole #" + pbc.branchHigh));
                var junctionName = getNdName(junctionNode, "");

                var branchTitle = window.PRS_I18n ? window.PRS_I18n.t("hud.crossroads_title", null, "🔀 Volba trasy na rozcestí!") : "🔀 Volba trasy na rozcestí!";
                var branchPrompt = isEn
                    ? ("You are standing on <strong>" + this.escapeHtml(junctionName) + "</strong>. You have <strong>" + pbc.remainingSteps + "</strong> steps remaining. Which path will you take?")
                    : ("Stojíš na poli <strong>" + this.escapeHtml(junctionName) + "</strong>. Zbývá ti ještě <strong>" + pbc.remainingSteps + "</strong> kroků. Kudy se vydáš?");
                var branchLowLabel = isEn ? ("🌿 Outer Ring (" + this.escapeHtml(lowName) + ")") : ("🌿 Vnější okruh (" + this.escapeHtml(lowName) + ")");
                var branchLowTarget = isEn ? ("🎯 Destination in " + pbc.remainingSteps + " steps: <strong>" + this.escapeHtml(targetLowName) + "</strong>") : ("🎯 Cíl za " + pbc.remainingSteps + " kr.: <strong>" + this.escapeHtml(targetLowName) + "</strong>");
                var branchHighLabel = isEn ? ("🏰 Inner Royal Path (" + this.escapeHtml(highName) + ")") : ("🏰 Vnitřní královská stezka (" + this.escapeHtml(highName) + ")");
                var branchHighTarget = isEn ? ("🎯 Destination in " + pbc.remainingSteps + " steps: <strong>" + this.escapeHtml(targetHighName) + "</strong>") : ("🎯 Cíl za " + pbc.remainingSteps + " kr.: <strong>" + this.escapeHtml(targetHighName) + "</strong>");

                el.innerHTML = '<div class="action-card branch-choice-card" style="border:1.5px solid var(--gold); background:linear-gradient(180deg, rgba(30,27,75,0.92), rgba(15,23,42,0.95));">' +

                    '<div class="turn-indicator" style="color:var(--gold-light); font-size:1rem; font-family:\'Cinzel\',serif;">' + branchTitle + '</div>' +

                    '<div style="font-size:0.84rem; color:var(--text-muted); margin:0.35rem 0 0.75rem 0;">' + branchPrompt + '</div>' +

                    '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

                    '  <button class="btn-branch-choice branch-low" onclick="PRS_App.handleChooseBranch(\'low\')" style="text-align:left; padding:0.75rem 0.9rem; background:rgba(16,185,129,0.15); border:1px solid #10b981; border-radius:8px; color:#ecfdf5; cursor:pointer;">' +

                    '    <div style="font-weight:700; font-size:0.95rem; color:#6ee7b7; margin-bottom:2px;">' + branchLowLabel + '</div>' +

                    '    <div style="font-size:0.78rem; color:#a7f3d0;">' + branchLowTarget + '</div>' +

                    '  </button>' +

                    '  <button class="btn-branch-choice branch-high" onclick="PRS_App.handleChooseBranch(\'high\')" style="text-align:left; padding:0.75rem 0.9rem; background:rgba(217,119,6,0.15); border:1px solid #f59e0b; border-radius:8px; color:#fffbeb; cursor:pointer;">' +

                    '    <div style="font-weight:700; font-size:0.95rem; color:#fde68a; margin-bottom:2px;">' + branchHighLabel + '</div>' +

                    '    <div style="font-size:0.78rem; color:#fef3c7;">' + branchHighTarget + '</div>' +

                    '  </button>' +

                    '</div>' +

                    this.getRoyalAdvisorHtml(player, "BRANCH_CHOICE", pbc, junctionNode) +

                    '</div>';

                return true;
            }
        return false;
    },

    _renderActionPhaseLanded: function (el, player, currNode) {
        
        var pa = this.state.pendingAction || {};

        var btns = [];

        if (pa.canBuyNode) {
            var bPrice = (typeof pa.buyPrice === "number" && !isNaN(pa.buyPrice)) ? pa.buyPrice : 1000;
            var canAfford = (player.gold || 0) >= bPrice;
            var remGold = (player.gold || 0) - bPrice;
            var isProc = this.isActionProcessing || this.isSavingSession;
            var priceFmt = window.PRS_I18n ? window.PRS_I18n.formatGold(bPrice) : (bPrice + " zl.");
            var remFmt = window.PRS_I18n ? window.PRS_I18n.formatGold(remGold) : (remGold + " zl.");
            var buyLabel = isProc
                ? (window.PRS_I18n ? window.PRS_I18n.t("hud.buying_tile_proc") : "⏳ Kupuji pole...")
                : ((window.PRS_I18n ? window.PRS_I18n.t("hud.buy_tile_label", { price: priceFmt }) : ("📜 Koupit toto pole (" + priceFmt + ")")) +
                   (canAfford
                       ? (" • " + (window.PRS_I18n ? window.PRS_I18n.t("hud.buy_remaining_gold", { rem: remFmt }) : ("Zbyde: " + remFmt)))
                       : (" • " + (window.PRS_I18n ? window.PRS_I18n.t("hud.buy_need_gold") : "❌ Chybí zlato!"))));
            btns.push('<button class="btn-action-buy" id="btn-buy-current-node" style="' + (isProc ? 'opacity:0.5; pointer-events:none;' : '') + '" ' + (!canAfford || isProc ? 'disabled' : '') + ' onclick="PRS_App.handleBuyNode()">' + buyLabel + '</button>');
        }

        if (pa.canUpgradeVillage) {
            var uCost = (typeof pa.upgradeCost === "number" && !isNaN(pa.upgradeCost)) ? pa.upgradeCost : 1500;
            var canAffordUpg = (player.gold || 0) >= uCost;
            var remUpg = (player.gold || 0) - uCost;
            btns.push('<button class="btn-action-buy" ' + (!canAffordUpg ? 'disabled' : '') + ' onclick="PRS_App.handleUpgradeVillage(' + pa.nodeId + ')">🏘️ Povýšit vesnici (' + uCost.toLocaleString("cs-CZ") + ' zl.)' + (canAffordUpg ? (' • Zbyde: ' + remUpg.toLocaleString("cs-CZ") + ' zl.') : '') + '</button>');
        }

        if (pa.canTrainMaster) {
            if (pa.isMasterDuel) {
                btns.push('<button class="btn-action-fight" style="width:100%; margin-bottom:0.45rem; background:linear-gradient(135deg, #b91c1c, #dc2626); border-color:#fca5a5; font-weight:bold; padding:0.55rem;" onclick="PRS_App.handleMasterDuel()">⚔️ Vyzvat mistra na duel o 1.5 💖 Srdce princezny!</button>');
            }

            if (pa.skill === "any") {

                var skList = [

                    { k: "combat", label: "⚔️ Boj" },

                    { k: "riding", label: "🏇 Jízda" },

                    { k: "dance", label: "💃 Tanec" },

                    { k: "charisma", label: "✨ Charisma" }

                ];

                for (var s = 0; s < skList.length; s++) {

                    var skKey = skList[s].k;

                    var curLvl = player.skills[skKey] || 0;

                    if (curLvl < 5) {

                        var cCost = this.state.config.masterCosts[curLvl] || ((curLvl + 1) * 1000);

                        btns.push('<button class="btn-action-skill" ' + (player.gold < cCost ? 'disabled' : '') + ' onclick="PRS_App.handleTrainMaster(\'' + skKey + '\')">🎓 Cvičit ' + skList[s].label + ' na ' + (curLvl + 1) + ' (' + cCost.toLocaleString("cs-CZ") + ' zl.)</button>');

                    }

                }

            } else {

                var normSk = (window.PRS_SKILLS && window.PRS_SKILLS.normalizeKey) ? window.PRS_SKILLS.normalizeKey(pa.skill) : pa.skill;
                var lvl = player.skills[normSk] || 0;

                if (lvl < 5) {

                    var cost = this.state.config.masterCosts[lvl] || ((lvl + 1) * 1000);
                    var skAcc = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(normSk, true, true) : normSk;

                    btns.push('<button class="btn-action-skill" ' + (player.gold < cost ? 'disabled' : '') + ' onclick="PRS_App.handleTrainMaster(\'' + normSk + '\')">🎓 Vycvičit ' + skAcc + ' na ' + (lvl + 1) + '/5 (' + cost.toLocaleString("cs-CZ") + ' zl.)</button>');

                }

            }

        }

        if (pa.canShopLivestock || (currNode && currNode.type === "BUILDING" && currNode.subtype === "stables")) {

            btns.push('<button class="btn-action-buy" onclick="PRS_App.openLivestockMarket()" style="width:100%; font-weight:bold; background:linear-gradient(135deg, #15803d, #16a34a); border-color:#86efac; padding:0.6rem; margin-bottom:0.4rem;">🌾 Vstoupit do stájí (Dobytčí trh &amp; Chov)</button>');

        }

        if (pa.canShopMerchant) {

            var p1 = this.state.config.itemPackPrices.tier1;

            var p2 = this.state.config.itemPackPrices.tier2;

            var p3 = this.state.config.itemPackPrices.tier3;

            btns.push('<button class="btn-action-buy" onclick="PRS_App.openArmoryModal()" style="width:100%; font-weight:bold; background:linear-gradient(135deg, #b45309, #d97706); border-color:#fbbf24; padding:0.6rem; margin-bottom:0.4rem;">🛒 Otevřít Královskou zbrojnici &amp; Trh</button>');

            btns.push('<button class="btn-action-buy" ' + (player.gold < p1 ? 'disabled' : '') + ' onclick="PRS_App.handleBuyPack(1)">🎒 Koupit balíček Věcí 1 (' + p1 + ' zl.)</button>');

            btns.push('<button class="btn-action-buy" ' + (player.gold < p2 ? 'disabled' : '') + ' onclick="PRS_App.handleBuyPack(2)">⚔️ Koupit balíček Věcí 2 (' + p2 + ' zl.)</button>');

            btns.push('<button class="btn-action-buy" ' + (player.gold < p3 ? 'disabled' : '') + ' onclick="PRS_App.handleBuyPack(3)">👑 Koupit balíček Věcí 3 (' + p3 + ' zl.)</button>');

        }

        var specialCardHtml = "";

        if (pa.canResolveQuest && pa.questCard) {

            var q = pa.questCard;

            var stats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

            var animalBonus = 0;

            if (q.questTier === "U1" && (stats.dogs > 0 || stats.falcons > 0)) {

                animalBonus = 1;

            } else if (q.questTier === "U3" && (stats.dogs > 0 || stats.falcons > 0)) {

                animalBonus = (stats.dogs > 0 && stats.falcons > 0) ? 2 : 1;

            }

            var horseBonus = (q.questTier !== "U1" && stats.horses > 0) ? (1 + Math.floor(stats.riding / 2)) : 0;

            var basePower = stats.combat + animalBonus + horseBonus;

            var neededRoll = Math.max(1, q.difficulty - basePower);

            var winRate = (neededRoll > 6) ? 0 : Math.round(((7 - Math.max(1, neededRoll)) / 6) * 100);

            var qImg = q.img || ((q.questTier === "U1") ? "assets/tiles/u1_zver.webp" : ((q.questTier === "U2") ? "assets/tiles/u2_monstrum.webp" : "assets/tiles/u3_drak.webp"));

            var tierTitle = (q.questTier === "U1") ? "Lesní zvířena" : ((q.questTier === "U2") ? "Temný netvor" : (q.tierGroup === "boss" ? "Legendární Dračí Saň" : "Drak království"));

            var tierColor = (q.questTier === "U1") ? "#f59e0b" : ((q.questTier === "U2") ? "#ef4444" : "#dc2626");

            var weaknessHtml = "";

            if (q.weakness) {

                var wMap = {

                    dogs: "🐕 Psi snadno odlákají pozornost draka",

                    falcon: "🦅 Sokol zaútočí na oči",

                    animals: "🐕+🦅 Zvířecí pomocníci snižují obtížnost",

                    horse: "🏇 Útok z plné jízdy na koni dává bonus",

                    dance: "💃 Hravého draka lze okouzlit tancem a charismatem",

                    elixir: "🧪 Hojivý lektvar z Lazaretu pomáhá přežít",

                    water_armor: "🛡️ Vodní či chladivá zbroj tlumí žár",

                    ice: "❄️ Ledové a mrazivé zbraně oslabují sopečného draka",

                    fire: "🔥 Oheň taví led a krystaly",

                    armor: "🛡️ Pevná plátová zbroj svádí blesky",

                    light: "✨ Zářící a posvěcené zbraně rozhánějí temnotu",

                    charisma: "👑 Vysoké Charisma umožňuje draka uchlácholit bez boje",

                    holy: "⚡ Prastarý kostlivec se bojí čisté rytířské cti",

                    courage: "💖 Pevné rytířské srdce zažene přízrak",

                    mastery: "🔮 Čtyřhlavý drak vyžaduje mistrovství ve všech 4 ctnostech",

                    animals_and_spear: "🏇+🐕 Pětihlavý drak vyžaduje koordinaci koně i smečky"

                };

                if (wMap[q.weakness]) {

                    weaknessHtml = '<div style="font-size:0.78rem; color:#fde68a; background:rgba(0,0,0,0.45); border:1px solid rgba(253,224,71,0.25); padding:4px 8px; border-radius:6px; margin-top:6px; margin-bottom:6px;">💡 Taktika: ' + wMap[q.weakness] + '</div>';

                }

            }

            if (q.trophyId && window.PRS_TROPHIES && window.PRS_TROPHIES[q.trophyId]) {

                var trDef = window.PRS_TROPHIES[q.trophyId];

                var statParts = [];

                if (trDef.combat) statParts.push("⚔️+" + trDef.combat);

                if (trDef.riding) statParts.push("🏇+" + trDef.riding);

                if (trDef.dance) statParts.push("💃+" + trDef.dance);

                if (trDef.charisma) statParts.push("✨+" + trDef.charisma);

                weaknessHtml += '<div style="font-size:0.78rem; color:#fef08a; background:rgba(212,175,55,0.18); border:1px solid rgba(212,175,55,0.4); padding:4px 8px; border-radius:6px; margin-bottom:6px;">🏆 Kořist vítěze: <strong>' + trDef.icon + ' ' + this.escapeHtml(trDef.name) + '</strong> <small style="color:#e7e5e4;">(' + statParts.join(" ") + ')</small></div>';

            }

            specialCardHtml = '<div class="combat-duel-card">' +

                '<div class="duel-card-header">' +

                '  <span class="duel-tier-badge" style="background:rgba(239,68,68,0.22); border-color:' + tierColor + '; color:' + tierColor + ';">⚔️ SOUBOJ: ' + q.questTier + ' (' + tierTitle + ')</span>' +

                '  <span class="duel-reward-pill">🏆 +' + q.gold.toLocaleString("cs-CZ") + ' zl.' + (q.hearts > 0 ? ' &nbsp;💖 +' + q.hearts : '') + '</span>' +

                '</div>' +

                '<div class="duel-monster-portrait-wrap">' +

                '  <img src="' + qImg + '" alt="' + this.escapeHtml(q.name) + '" class="duel-monster-art" />' +

                '  <div class="duel-monster-overlay">' +

                '    <div class="duel-monster-name">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>' +

                '    <div class="duel-monster-sub">' + this.escapeHtml(q.desc || (q.questTier === "U3" ? 'Obávaná dračí bestie království' : 'Divoký protivník v temných hvozdech')) + '</div>' +

                '  </div>' +

                '</div>' +

                '<div class="duel-arena-grid">' +

                '  <div class="duel-combatant" style="border-color:' + player.color + ';">' +

                '    <div class="duel-fighter-role" style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</div>' +

                '    <div class="duel-fighter-stat">⚔️ ' + basePower + ' <small>stálá síla</small></div>' +

                '    <div class="duel-fighter-sub">' +

                '      Boj ' + stats.combat +

                (horseBonus > 0 ? ' + Kůň ' + horseBonus : '') +

                (animalBonus > 0 ? (' + ' + (q.questTier === 'U3' ? 'Odlákání draka ' : 'Zvíře ') + animalBonus) : '') +

                '    </div>' +

                '  </div>' +

                '  <div class="duel-vs-badge">VS</div>' +

                '  <div class="duel-combatant">' +

                '    <div class="duel-fighter-role" style="color:#f87171;">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>' +

                '    <div class="duel-fighter-stat" style="color:#ef4444;">🛡️ ' + q.difficulty + ' <small>obtížnost</small></div>' +

                '    <div class="duel-fighter-sub">Potřebný hod: 🎲 <strong>' + (neededRoll <= 1 ? '1+' : (neededRoll <= 6 ? neededRoll + '+' : 'nelze bez tréninku')) + '</strong></div>' +

                '  </div>' +

                '</div>' +

                '<div class="duel-odds-container">' +

                '  <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">' +

                '    <span>Pravděpodobnost vítězství:</span>' +

                '    <strong style="color:' + (winRate >= 50 ? '#86efac' : '#fca5a5') + ';">' + winRate + ' %</strong>' +

                '  </div>' +

                '  <div class="duel-odds-bar-track">' +

                '    <div class="duel-odds-bar-fill" style="width:' + winRate + '%; background:' + (winRate >= 65 ? 'linear-gradient(90deg, #10b981, #22c55e)' : (winRate >= 35 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #dc2626, #ef4444)')) + ';"></div>' +

                '  </div>' +

                '</div>' +

                weaknessHtml +

                '<button id="btn-duel-attack" class="duel-attack-action-btn" onclick="PRS_App.handleResolveQuest()">' +

                '  ⚔️ HODIT KOSTKOU A ZAÚTOČIT!' +

                '</button>' +

                ((q.questTier === "U2" || q.questTier === "U3") ?
                ('<button id="btn-duel-retreat" class="btn-action-buy" style="margin-top:0.45rem; background:linear-gradient(135deg, #475569, #334155); border-color:#94a3b8; width:100%; font-weight:600; padding:0.6rem; cursor:pointer;" onclick="PRS_App.handleRetreatFromQuest()">' +
                '  🛡️ Taktický ústup z doupěte (' + (q.questTier === "U3" ? '800' : '400') + ' zl.)' +
                '</button>') : '') +

                '</div>';

        }

        if (pa.canResolveFestival) {

            var fType = pa.festivalType || "tournament";

            var fTitle = (fType === "tournament" ? "Královský Turnaj 🏇" : (fType === "ball" ? "Zámecký Ples 💃" : "Velký Závod 🐎"));

            specialCardHtml = '<div class="festival-encounter-card">' +

                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.45rem;">' +

                '  <div class="standing-tile-medallion" style="border-color:#ec4899;"><img src="assets/tiles/festival.webp" alt="Slavnost" /></div>' +

                '  <div>' +

                '    <span class="standing-tile-badge" style="background:rgba(236,72,153,0.25); color:#fbcfe8; border-color:#ec4899;">💖 Královské klání</span>' +

                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#fdf2f8;">' + fTitle + '</div>' +

                '  </div>' +

                '</div>' +

                '<p style="font-size:0.83rem; color:#fce7f3; margin-bottom:0.5rem;">Hraje se o prestižní <strong>Srdce princezny 💖</strong>! Klání se zúčastní všichni způsobilí rytíři království.</p>' +

                '<button class="btn-action-festival" style="width:100%; font-size:0.95rem; padding:0.6rem;" onclick="PRS_App.handleResolveFestival()">🏆 VYHODNOTIT SLAVNOST A ROZDAT SRDCE!</button>' +

                '</div>';

        }

        // Karta Náhody s 3D otáčením a pečetí

        if (pa.chanceCard) {

            var c = pa.chanceCard;

            var isFlipped = (this.flippedChanceCardId === c.id);

            var effColor = (c.effect === "gold_loss" || c.effect === "robbers") ? "#fca5a5" : ((c.effect === "hearts" || c.effect === "ball") ? "#f472b6" : "#fde047");

            specialCardHtml += '<div class="chance-card-box">' +

                '  <div id="chance-card-inner" class="chance-card-inner ' + (isFlipped ? 'flipped' : '') + '" onclick="PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">' +

                '    <div class="chance-card-face chance-card-back">' +

                '      <div class="chance-seal">👑</div>' +

                '      <div style="font-family:\'Cinzel\',serif; font-size:1.15rem; font-weight:bold; color:var(--gold-light); margin-bottom:0.25rem;">KRÁLOVSKÝ PERGAMEN OSUDU</div>' +

                '      <p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.6rem;">Stoupnul jsi na pole Náhody! Klepnutím prolomíš pečeť a odhalíš vůli osudu.</p>' +

                '      <button class="btn-action-tavern" style="font-size:0.85rem; padding:0.35rem 0.85rem;" onclick="event.stopPropagation(); PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">📜 OTOČIT KARTU NÁHODY</button>' +

                '    </div>' +

                '    <div class="chance-card-face chance-card-front">' +

                '      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; border-bottom:1px solid rgba(250,204,21,0.3); padding-bottom:0.3rem;">' +

                '        <span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a; border-color:#eab308;">❓ KARTA NÁHODY</span>' +

                '        <span style="font-size:0.8rem; color:#fef08a;">' + c.id + '</span>' +

                '      </div>' +

                '      <div style="font-family:\'Cinzel\',serif; font-size:1.1rem; font-weight:bold; color:#fef08a; margin-bottom:0.35rem;">' + this.escapeHtml(c.title) + '</div>' +

                '      <p style="font-size:0.86rem; color:#f8fafc; line-height:1.35; margin-bottom:0.45rem;">' + this.escapeHtml(c.text) + '</p>' +

                ((c.isScroll || c.category === "scroll" || c.scrollType || pa.canStoreScroll || pa.scrollCard) ? (
                    '      <div style="margin-top:0.45rem; display:flex; flex-direction:column; gap:0.35rem;" onclick="event.stopPropagation();">' +
                    '        <div style="font-size:0.75rem; color:#86efac; font-weight:700; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.3); border-radius:5px; padding:0.22rem 0.45rem; text-align:center;">' +
                    '          🎒 Taktický pergamen: ulož do brašny na později, nebo zahraj ihned:' +
                    '        </div>' +
                    '        <div style="display:flex; gap:0.4rem;">' +
                    ((!player.inventory || player.inventory.length < 3) ? (
                        '          <button type="button" class="btn-primary" style="flex:1; background:linear-gradient(135deg, #059669, #047857); border:1.5px solid #34d399; color:#fff; font-size:0.84rem; padding:0.45rem 0.55rem; font-weight:bold; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.3rem; box-shadow:0 3px 8px rgba(5,150,105,0.4);" onclick="PRS_App.handleStoreScroll()" title="Uložit pergamen do brašny rytíře">' +
                        '            🎒 Do brašny (' + ((player.inventory && player.inventory.length) || 0) + '/3)' +
                        '          </button>'
                    ) : (
                        '          <div style="flex:1; color:#f87171; font-size:0.75rem; text-align:center; font-weight:700; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:0.4rem; border-radius:5px;">⚠️ Brašna plná (3/3)</div>'
                    )) +
                    '          <button type="button" class="btn-primary" style="flex:1; background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; color:#fff; font-size:0.84rem; padding:0.45rem 0.55rem; font-weight:bold; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.3rem; box-shadow:0 3px 8px rgba(217,119,6,0.4);" onclick="PRS_App.handleUseScrollNow()" title="Zahrát tento pergamen okamžitě v tomto tahu">' +
                    '            ⚡ Použít ihned' +
                    '          </button>' +
                    '        </div>' +
                    '      </div>'
                ) : pa.canChooseDilemma && c.options && c.options.length >= 2 ? (

                    '      <div class="chance-dilemma-container" onclick="event.stopPropagation();">' +

                    '        <button type="button" class="chance-dilemma-btn opt-a" onclick="PRS_App.handleChooseChanceDilemma(0)">' +

                    '          <div class="opt-title">' + c.options[0].icon + ' ' + this.escapeHtml(c.options[0].title) + '</div>' +

                    '          <div class="opt-desc">' + this.escapeHtml(c.options[0].desc) + '</div>' +

                    '        </button>' +

                    '        <button type="button" class="chance-dilemma-btn opt-b" onclick="PRS_App.handleChooseChanceDilemma(1)">' +

                    '          <div class="opt-title">' + c.options[1].icon + ' ' + this.escapeHtml(c.options[1].title) + '</div>' +

                    '          <div class="opt-desc">' + this.escapeHtml(c.options[1].desc) + '</div>' +

                    '        </button>' +

                    '      </div>'

                ) : (

                    '      <div style="margin-top:auto; font-size:0.83rem; font-weight:bold; color:' + effColor + '; background:rgba(0,0,0,0.45); padding:0.35rem 0.6rem; border-radius:6px;">' +

                    '        ⚡ ' + this.formatGameText(pa.summary || c.text) +

                    '      </div>'

                )) +

                '    </div>' +

                '  </div>' +

                '</div>';

        }

        // Šatlava (Vězení)
        var tActH = window.PRS_I18n ? function(k, p, d) { return window.PRS_I18n.t(k, p, d); } : function(k, p, d) { return d; };

        if (pa.canPayPrisonBail || pa.canAttemptPrisonEscape || pa.canServeSentence) {

            var canAffordBail = player.gold >= (pa.bailCost || 1000);

            specialCardHtml += '<div class="prison-encounter-card">' +

                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +

                '  <div class="standing-tile-medallion" style="border-color:#71717a; background:#18181b;"><span style="font-size:1.6rem;">⛓️</span></div>' +

                '  <div>' +

                '    <span class="standing-tile-badge" style="background:rgba(113,113,122,0.3); color:#e4e4e7; border-color:#71717a;">' + tActH("hud.prison_badge", null, "⛓️ Žalář &amp; Vězení") + '</span>' +

                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#f4f4f5;">' + tActH("hud.prison_title", null, "Královská Šatlava") + '</div>' +

                '  </div>' +

                '</div>' +

                '<p style="font-size:0.84rem; color:#d4d4d8; margin-bottom:0.6rem;">' + tActH("hud.prison_desc", null, "Rytíř je uvězněn! Vyber si způsob propuštění:") + '</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                '  <button class="btn-action-prison" ' + (!canAffordBail ? 'disabled' : '') + ' onclick="PRS_App.handlePayPrisonBail()">' + tActH("hud.prison_bail_btn", { cost: (window.PRS_I18n ? window.PRS_I18n.formatGold(pa.bailCost || 1000) : ((pa.bailCost || 1000) + " zl.")) }, "🔓 Složit kauci (" + (pa.bailCost || 1000) + " zl.) – Okamžité propuštění") + '</button>' +

                '  <button class="btn-action-prison" onclick="PRS_App.handlePrisonEscape()">' + tActH("hud.prison_escape_btn", null, "🏃‍♂️ Pokus o noční útěk (Hoď 🎲 6 – zisk +500 zl. / jinak zůstáváš)") + '</button>' +

                '  <button class="btn-action-prison" style="background:#27272a; border-color:#52525b;" onclick="PRS_App.handleServePrisonSentence()">' + tActH("hud.prison_sentence_btn", null, "⚖️ Odpykat trest (královský rychtář tě propustí)") + '</button>' +

                '</div>' +

                '</div>';

        }

        // Špitál (Lazaret)

        if (pa.canBuyHospitalElixir || pa.canRestHospital) {

            var canAffordElix = player.gold >= (pa.elixirCost || 800);

            specialCardHtml += '<div class="hospital-encounter-card">' +

                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +

                '  <div class="standing-tile-medallion" style="border-color:#38bdf8; background:#0c4a6e;"><span style="font-size:1.6rem;">🏥</span></div>' +

                '  <div>' +

                '    <span class="standing-tile-badge" style="background:rgba(2,132,199,0.3); color:#7dd3fc; border-color:#0284c7;">' + tActH("hud.hospital_badge", null, "🏥 Lazaret") + '</span>' +

                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#f0f9ff;">' + tActH("hud.hospital_title", null, "Královský Lazaret &amp; Ranhojič") + '</div>' +

                '  </div>' +

                '</div>' +

                '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:0.6rem;">' + tActH("hud.hospital_desc", null, "Zranění rytíři zde nabírají síly do dalších klání:") + '</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                '  <button class="btn-action-hospital" ' + (!canAffordElix ? 'disabled' : '') + ' onclick="PRS_App.handleBuyHospitalElixir()">' + tActH("hud.hospital_elixir_btn", { cost: (window.PRS_I18n ? window.PRS_I18n.formatGold(pa.elixirCost || 800) : ((pa.elixirCost || 800) + " zl.")) }, "🧪 Zakoupit Hojivý lektvar (+1 Boj, +0.5 💖 za " + (pa.elixirCost || 800) + " zl.)") + '</button>' +

                '  <button class="btn-action-hospital" style="background:#0369a1; border-color:#0284c7;" onclick="PRS_App.handleRestHospital()">' + tActH("hud.hospital_rest_btn", null, "🌿 Zdarma odpočívat u bylinkáře") + '</button>' +

                '</div>' +

                '</div>';

        }

        // 1. Setkání na stejném poli (Duel vs Přípitek)

        if (pa.encounterPlayer) {

            var enc = pa.encounterPlayer;

            var canDuel = pa.canDuelPlayer;

            var canToast = pa.canToastPlayer;

            var encCurrG = window.PRS_I18n ? window.PRS_I18n.t("common.gold_symbol", null, "zl.") : "zl.";
            var encTitle = window.PRS_I18n ? window.PRS_I18n.t("hud.knight_encounter_title", { badge: enc.badge, name: this.escapeHtml(enc.name) }) : ("🤺 Setkání rytířů: " + enc.badge + " " + this.escapeHtml(enc.name));
            var encDesc = window.PRS_I18n ? window.PRS_I18n.t("hud.knight_encounter_desc") : "Na tomto poli stojí soupeř. Zvol rytířský duel cti, nebo ukaž dvorskou noblesu přátelským přípitkem:";
            var duelLabel = window.PRS_I18n ? window.PRS_I18n.t("hud.knight_encounter_duel", { stake: enc.duelStake + " " + encCurrG }) : ("⚔️ Rytířský duel cti (Sázka " + enc.duelStake + " zl. & 0.5 💖)");
            var toastLabel = window.PRS_I18n ? window.PRS_I18n.t("hud.knight_encounter_toast", { cost: enc.toastCost + " " + encCurrG }) : ("🍷 Přátelský přípitek (" + enc.toastCost + " zl. ➔ Zisk +0,5 💖)");

            specialCardHtml += '<div class="encounter-interaction-card" style="border:1.5px solid #38bdf8; background:linear-gradient(180deg, rgba(12,74,110,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#7dd3fc; margin-bottom:4px;">' + encTitle + '</div>' +
                '<p style="font-size:0.8rem; color:#bae6fd; margin-bottom:0.6rem;">' + encDesc + '</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +
                (canDuel ? '  <button class="btn-action-duel" style="padding:0.55rem; background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; border:1px solid #fca5a5; border-radius:7px; font-weight:700; cursor:pointer;" onclick="PRS_App.handlePlayerDuel(' + enc.index + ')">' + duelLabel + '</button>' : '') +
                (canToast ? '  <button class="btn-action-toast" style="padding:0.55rem; background:linear-gradient(135deg, #f59e0b, #b45309); color:#fff; border:1px solid #fde68a; border-radius:7px; font-weight:700; cursor:pointer;" onclick="PRS_App.handlePlayerToast(' + enc.index + ')">' + toastLabel + '</button>' : '') +
                '</div>' +
                '</div>';

        }

        // 2. Šlechtický výkup ze sady (Královské předkupní právo)
        var validBuyoutCandidates = [];
        if (pa.canBuyoutAnimalSet && pa.buyoutCandidates && pa.buyoutCandidates.length > 0 && this.state.board && this.state.board.nodes) {
            for (var biCheck = 0; biCheck < pa.buyoutCandidates.length; biCheck++) {
                var bcCandidate = pa.buyoutCandidates[biCheck];
                var candNodeObj = this.state.board.nodes[bcCandidate.nodeId];
                if (candNodeObj && candNodeObj.owner !== null && candNodeObj.owner !== undefined && candNodeObj.owner !== player.index) {
                    validBuyoutCandidates.push(bcCandidate);
                }
            }
            if (validBuyoutCandidates.length === 0) {
                pa.canBuyoutAnimalSet = false;
                pa.buyoutCandidates = [];
            }
        }

        if (validBuyoutCandidates.length > 0) {
            specialCardHtml += '<div class="buyout-interaction-card" style="border:1.5px solid #10b981; background:linear-gradient(180deg, rgba(6,78,59,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#6ee7b7; margin-bottom:4px;">' + (isEnAction ? "📜 Royal Pre-Emption Right on Animal!" : "📜 Královské předkupní právo na zvíře!") + '</div>' +
                '<p style="font-size:0.8rem; color:#a7f3d0; margin-bottom:0.6rem;">' + (isEnAction ? "You own 2 of 3 animals in this set! You may buy out the missing animal from its owner for 2x price to immediately complete the set (+1.0 💖):" : "Vlastníš 2 ze 3 zvířat sady! Můžeš vykoupit chybějící kus od majitele za dvojnásobek ceny a ihned zkompletovat sadu (+1,0 💖):") + '</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">';

            for (var bi = 0; bi < validBuyoutCandidates.length; bi++) {
                var bc = validBuyoutCandidates[bi];
                var canAffordBc = player.gold >= bc.buyoutPrice;
                var boBtnText = isEnAction
                    ? (bc.icon + ' Buy out ' + this.escapeHtml(bc.name) + ' from set #' + bc.setId + ' (' + bc.buyoutPrice + ' g. for ' + this.escapeHtml(bc.ownerName) + ') ➔ +1.0 💖')
                    : (bc.icon + ' Vykoupit ' + this.escapeHtml(bc.name) + ' ze sady #' + bc.setId + ' (' + bc.buyoutPrice + ' zl. pro ' + this.escapeHtml(bc.ownerName) + ') ➔ +1.0 💖');
                specialCardHtml += '  <button class="btn-action-buyout" ' + (!canAffordBc ? 'disabled' : '') + ' style="padding:0.55rem; background:linear-gradient(135deg, #059669, #047857); color:#fff; border:1px solid #6ee7b7; border-radius:7px; font-weight:700; text-align:left; cursor:pointer;" onclick="PRS_App.handleAnimalBuyout(' + bc.nodeId + ')">' +
                    boBtnText +
                    '</button>';
            }

            specialCardHtml += '</div></div>';
        } else if (pa.buyoutSuccess) {
            var bs = pa.buyoutSuccess;
            var boSuccTitle = isEnAction ? "✅ Royal Buyout Successfully Completed!" : "✅ Královský výkup úspěšně dokončen!";
            var boSuccDesc = isEnAction
                ? ("Animal <strong>" + this.escapeHtml(bs.nodeName) + "</strong> was bought from rival <strong>" + this.escapeHtml(bs.sellerName) + "</strong> for <strong>" + bs.price.toLocaleString(actLoc) + " g.</strong> Your breeding set #" + bs.setId + " is now complete (+1.0 💖)!")
                : ("Kus <strong>" + this.escapeHtml(bs.nodeName) + "</strong> byl vykoupen od soupeře <strong>" + this.escapeHtml(bs.sellerName) + "</strong> za <strong>" + bs.price.toLocaleString("cs-CZ") + " zl.</strong> Tvoje chovná sada #" + bs.setId + " je nyní kompletní (+1,0 💖)!");
            specialCardHtml += '<div class="buyout-interaction-card" style="border:1.5px solid #10b981; background:linear-gradient(180deg, rgba(6,78,59,0.55), rgba(15,23,42,0.92)); border-radius:10px; padding:0.85rem; margin-top:0.6rem; display:flex; align-items:flex-start; gap:0.75rem; position:relative;">' +
                '<div style="font-size:1.8rem; line-height:1;">' + (bs.nodeIcon || '🦅') + '</div>' +
                '<div style="flex:1;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#6ee7b7; font-weight:700;">' + boSuccTitle + '</div>' +
                '<div style="font-size:0.82rem; color:#a7f3d0; margin-top:0.25rem;">' + boSuccDesc + '</div>' +
                '</div>' +
                '<button type="button" onclick="this.closest(\'.buyout-interaction-card\').remove(); if(PRS_App.state && PRS_App.state.pendingAction) PRS_App.state.pendingAction.buyoutSuccess=null;" style="background:transparent; border:none; color:#a7f3d0; font-size:1.15rem; cursor:pointer; padding:0 4px; line-height:1;" title="' + (isEnAction ? "Close notice" : "Zavřít oznámení") + '">✕</button>' +
                '</div>';
        }

        // 3. Dvorní intriky u Kejklíře a v Krčmě

        if (pa.canPlotIntrigue) {
            var bCost = pa.intrigueBalladCost || 750;
            var cCost = pa.intrigueCustomsCost || 600;
            var balladBtnLabel = isEnAction
                ? ('🎭 Mocking Ballad Under Balcony (' + bCost + ' g. ➔ Reduce Rival\'s Hearts 💖)')
                : ('🎭 Posměšná balada pod balkónem (' + bCost + ' zl. ➔ Srazit soupeři Srdce 💖)');
            var customsBtnLabel = isEnAction
                ? ('📜 Royal Customs Inspection (' + cCost + ' g. ➔ Freeze Rents for 1 Round)')
                : ('📜 Královská celní kontrola (' + cCost + ' zl. ➔ Zmrazit nájemné na 1 kolo)');

            specialCardHtml += '<div class="intrigue-interaction-card" style="border:1.5px solid #d97706; background:linear-gradient(180deg, rgba(120,53,15,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#fde68a; margin-bottom:4px;">' + (isEnAction ? "🃏 Court Intrigues Against Rivals" : "🃏 Dvorní intriky proti soupeřům") + '</div>' +
                '<p style="font-size:0.8rem; color:#fef3c7; margin-bottom:0.6rem;">' + (isEnAction ? "Hire a jester to mock the leader or exercise royal authority:" : "Najmi kejklíře k posměchu lídra nebo uplatni královské pravomoci:") + '</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +
                '  <button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #7c3aed, #5b21b6); border-color:#c084fc;" onclick="PRS_App.openIntrigueModal(\'ballad\')">' + balladBtnLabel + '</button>' +
                '  <button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #b45309, #78350f); border-color:#fbbf24;" onclick="PRS_App.openIntrigueModal(\'customs\')">' + customsBtnLabel + '</button>' +
                '</div></div>';

        } else if (pa.intriguePlotted) {

            specialCardHtml += '<div class="intrigue-interaction-card" style="border:1px solid #10b981; background:rgba(6,78,59,0.35); border-radius:10px; padding:0.6rem 0.8rem; margin-top:0.6rem; font-size:0.82rem; color:#6ee7b7; display:flex; align-items:center; gap:8px;">' +
                '<span style="font-size:1.3rem;">🎭</span> <span>' + this.escapeHtml(pa.intrigueSummary || (isEnAction ? "Court intrigue has been evaluated for this turn." : "Dvorní intrika byla pro tento tah vyhodnocena.")) + '</span>' +
                '</div>';

        }

        // 4. Obchodní pakt u Obchodníka a na STARTu

        if (pa.canFormTradePact) {
            var tpCost = pa.tradePactCost || 750;
            var tpBtnLabel = isEnAction
                ? ('🤝 Seal Trade Pact (' + tpCost + ' g.)')
                : ('🤝 Uzavřít Obchodní pakt (' + tpCost + ' zl.)');

            specialCardHtml += '<div class="pact-interaction-card" style="border:1.5px solid #0284c7; background:linear-gradient(180deg, rgba(12,74,110,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#7dd3fc; margin-bottom:4px;">' + (isEnAction ? "🤝 Trade Pact (Duty-Free Alliance for 8 Rounds)" : "🤝 Obchodní pakt (Bezcelní aliance na 8 kol)") + '</div>' +
                '<p style="font-size:0.8rem; color:#bae6fd; margin-bottom:0.6rem;">' + (isEnAction ? "Ally with a knight: zero tolls on estates and +300 g. dividend on every visit!" : "Spoj se s rytířem: nulové mýtné na panstvích a dividenda +300 zl. při každé návštěvě!") + '</p>' +
                '<button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="PRS_App.openTradePactModal()">' + tpBtnLabel + '</button>' +
                '</div>';

        }

        // 5. Osobní výzva na Slavnosti

        if (pa.canChallengeFestivalRival) {
            var fcStake = pa.festivalChallengeStake || 750;
            var fcBtnLabel = isEnAction
                ? ('🤺 Issue Personal Challenge to Rival (' + fcStake + ' g.)')
                : ('🤺 Vyhlásit osobní výzvu soupeři (' + fcStake + ' zl.)');

            specialCardHtml += '<div class="festival-challenge-card" style="border:1.5px solid #ec4899; background:linear-gradient(180deg, rgba(131,24,67,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#fbcfe8; margin-bottom:4px;">' + (isEnAction ? "🏆 1-on-1 Personal Challenge at Festival" : "🏆 Osobní výzva 1 na 1 na Slavnosti") + '</div>' +
                '<p style="font-size:0.8rem; color:#fce7f3; margin-bottom:0.6rem;">' + (isEnAction ? "Challenge a specific rival to a contest of royal virtue for gold and glory:" : "Vyzvi konkrétního soupeře k souboji v královské ctnosti o zlato a slávu:") + '</p>' +
                '<button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #ec4899, #be185d); border-color:#fbcfe8;" onclick="PRS_App.openFestivalChallengeModal()">' + fcBtnLabel + '</button>' +
                '</div>';

        }

        // Krčma (Hostinec)

        if (pa.canTavernGamble || pa.canBuyTavernRound) {

            var canAffordBet = player.gold >= (pa.gambleBet || 500);
            var canAffordRound = player.gold >= (pa.roundCost || 400);
            var tBetLabel = isEnAction
                ? ('🎲 Dice with Innkeeper (Bet ' + (pa.gambleBet || 500) + ' g. – roll 2 dice)')
                : ('🎲 Kostky s krčmářem (Sázka ' + (pa.gambleBet || 500) + ' zl. – hod 2 kostkami)');
            var tRoundLabel = isEnAction
                ? ('🍻 Round of Mead for the Entire Tavern (+0.5 💖 for ' + (pa.roundCost || 400) + ' g.)')
                : ('🍻 Runda medoviny pro celou hospodu (+0.5 💖 za ' + (pa.roundCost || 400) + ' zl.)');

            specialCardHtml += '<div class="tavern-encounter-card">' +
                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +
                '  <div class="standing-tile-medallion" style="border-color:#f59e0b; background:#451a03;"><span style="font-size:1.6rem;">🍺</span></div>' +
                '  <div>' +
                '    <span class="standing-tile-badge" style="background:rgba(217,119,6,0.3); color:#fde68a; border-color:#d97706;">' + (isEnAction ? "🍺 Tavern" : "🍺 Hostinec") + '</span>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#fef3c7;">' + (isEnAction ? "The Golden Flagon Tavern" : "Krčma U Zlatého korbelu") + '</div>' +
                '  </div>' +
                '</div>' +
                '<p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.6rem;">' + (isEnAction ? "Merry folk and travelling merchants sit by the hearth. Choose your entertainment:" : "U krbu sedí veselá chasa i záletní kupci. Vyber si zábavu:") + '</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +
                '  <button class="btn-action-tavern" ' + (!canAffordBet ? 'disabled' : '') + ' onclick="PRS_App.handleTavernGamble()">' + tBetLabel + '</button>' +
                '  <button class="btn-action-tavern" ' + (!canAffordRound ? 'disabled' : '') + ' onclick="PRS_App.handleBuyTavernRound()">' + tRoundLabel + '</button>' +
                '</div>' +
                '</div>';

        }

        // Nucené vyrovnání dluhu (Dražba majetku za 60 %)

        if (pa.debt) {

            var creditor = this.state.players[pa.debt.creditorIndex];
            var credName = creditor ? creditor.name : (isEnAction ? "creditor" : "věřiteli");
            var rate = (this.state.config.sellRates && this.state.config.sellRates.forcedLiquidation) || 0.60;
            var assetsRows = "";

            // 1. Předměty v inventáři

            for (var itIdx = 0; itIdx < player.items.length; itIdx++) {
                var itObj = player.items[itIdx];
                var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === itObj.id; })) ||
                              (window.PRS_TROPHIES && window.PRS_TROPHIES[itObj.id]);
                var itPrice = (itObj.price !== undefined && itObj.price !== null) ? itObj.price : (baseDef && baseDef.price ? baseDef.price : 1000);
                var itName = itObj.name || (baseDef ? baseDef.name : "Neznámý předmět");
                var itIcon = itObj.icon || (baseDef ? baseDef.icon : "📦");
                var itLiq = Math.round(itPrice * rate);

                var eqBadge = itObj.isEquipped === false ? (isEnAction ? "🎒 in bag" : "🎒 v batohu") : (isEnAction ? "⚔️ equipped" : "⚔️ nasazeno");
                var liqBtnText = isEnAction ? ("Sell for +" + itLiq + " g.") : ("Odprodat za +" + itLiq + " zl.");

                assetsRows += '<div class="debt-asset-row">' +
                    '<span>' + itIcon + ' <strong>' + this.escapeHtml(itName) + '</strong> (' + eqBadge + ')</span>' +
                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'item\', \'' + (itObj.uid || itObj.id) + '\')">' + liqBtnText + '</button>' +
                    '</div>';
            }

            // 2. Vlastněná panství a zvířata

            var sortedDebtNodes = (window.PRS_GameEngine && window.PRS_GameEngine.getSortedOwnedNodes)
                ? window.PRS_GameEngine.getSortedOwnedNodes(player, this.state)
                : (player.ownedNodes || []);

            for (var ndIdx = 0; ndIdx < sortedDebtNodes.length; ndIdx++) {
                var ndObj = this.state.board.nodes[sortedDebtNodes[ndIdx]];
                if (!ndObj) continue;

                if (ndObj.type === "VILLAGE" && (ndObj.villageLevel || 1) > 1) {
                    var downCost = (this.state.config.estates.villagePrices && this.state.config.estates.villagePrices[ndObj.villageLevel - 1]) || 1500;
                    var downLiq = Math.round(downCost * rate);
                    var downSpan = isEnAction
                        ? ('🏘️ Downgrade village <strong>' + this.escapeHtml(ndObj.name) + '</strong> from ' + ndObj.villageLevel + '★ to ' + (ndObj.villageLevel - 1) + '★')
                        : ('🏘️ Snížit vesnici <strong>' + this.escapeHtml(ndObj.name) + '</strong> z ' + ndObj.villageLevel + '★ na ' + (ndObj.villageLevel - 1) + '★');
                    var downBtn = isEnAction ? ('Downgrade for +' + downLiq + ' g.') : ('Snížit za +' + downLiq + ' zl.');

                    assetsRows += '<div class="debt-asset-row">' +
                        '<span>' + downSpan + '</span>' +
                        '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'village_downgrade\', ' + ndObj.id + ')">' + downBtn + '</button>' +
                        '</div>';
                }

                var investVal = window.PRS_GameEngine.getNodeInvestedValue(this.state, ndObj);
                var ndLiq = Math.round(investVal * rate);
                var ndBtn = isEnAction ? ('Sell for +' + ndLiq + ' g.') : ('Odprodat za +' + ndLiq + ' zl.');

                assetsRows += '<div class="debt-asset-row">' +
                    '<span>' + (ndObj.icon || '📍') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> (' + ndObj.code + ')</span>' +
                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'node\', ' + ndObj.id + ')">' + ndBtn + '</button>' +
                    '</div>';
            }

            var debtBadge = isEnAction ? "⚖️ Royal Auction &amp; Debt Settlement" : "⚖️ Královská dražba &amp; Vyrovnání dluhu";
            var debtRem = isEnAction
                ? ('Remaining to pay: <span style="color:#ef4444;">' + pa.debt.remainingDebt + ' g.</span>')
                : ('Zbývá doplatit: <span style="color:#ef4444;">' + pa.debt.remainingDebt + ' zl.</span>');
            var debtDesc = isEnAction
                ? ('Not enough cash to pay rent to knight <strong>' + this.escapeHtml(credName) + '</strong>. To settle the debt, you must liquidate assets to the Royal Chamber at 60% value:')
                : ('Hotovost nestačila na úhradu nájmu hráči <strong>' + this.escapeHtml(credName) + '</strong>. K vyrovnání závazku musíš odprodat část majetku Královské komoře za 60 % pořizovací ceny:');
            var debtEmpty = isEnAction ? "No assets available for liquidation." : "Žádný majetek k odprodeji.";
            var debtAuto = isEnAction ? "⚡ Automatically select and settle debt" : "⚡ Automaticky vybrat a uhradit dluh";

            specialCardHtml += '<div class="debt-encounter-card">' +
                '<span class="debt-badge">' + debtBadge + '</span>' +
                '<div class="debt-title">' + debtRem + '</div>' +
                '<p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.5rem;">' + debtDesc + '</p>' +
                '<div class="debt-assets-list">' + (assetsRows || ('<div class="empty-note">' + debtEmpty + '</div>')) + '</div>' +
                '<div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap;">' +
                '  <button class="btn-action-buy" style="background:#b45309; border-color:#fbbf24; font-weight:bold; width:100%;" onclick="PRS_App.handleAutoLiquidateDebt()">' + debtAuto + '</button>' +
                '</div>' +
                '</div>';
        }

        var isScrollPending = !!(pa.canStoreScroll || pa.scrollCard || (pa.chanceCard && (pa.chanceCard.isScroll || pa.chanceCard.category === "scroll" || pa.chanceCard.scrollType)));
        var mustCompleteFirst = pa.canResolveQuest || pa.canResolveFestival || pa.isImprisoned || pa.debt || isScrollPending;

        if (isScrollPending) {
            if (!player.inventory || player.inventory.length < 3) {
                var storeText = isEnAction
                    ? ('🎒 Store in pouch (' + ((player.inventory && player.inventory.length) || 0) + '/3)')
                    : ('🎒 Uložit do brašny (' + ((player.inventory && player.inventory.length) || 0) + '/3)');
                btns.push('<button class="btn-primary" style="background:linear-gradient(135deg, #059669, #047857); border:1.5px solid #34d399; font-weight:700; padding:0.55rem 0.9rem;" onclick="PRS_App.handleStoreScroll()">' + storeText + '</button>');
            }
            var useText = isEnAction ? '⚡ Use scroll immediately' : '⚡ Použít svitek ihned';
            btns.push('<button class="btn-primary" style="background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; font-weight:700; padding:0.55rem 0.9rem;" onclick="PRS_App.handleUseScrollNow()">' + useText + '</button>');
        }

        if (!mustCompleteFirst) {

            btns.push('<button class="btn-end-turn" style="width:100%; font-size:0.95rem; padding:0.58rem 1rem; font-weight:700; background:linear-gradient(135deg, #1e293b, #0f172a); border:1.5px solid #64748b; border-radius:9px; cursor:pointer;" onclick="PRS_App.handleEndTurn()">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.end_turn", null, "➡️ Ukončit tah") : "➡️ Ukončit tah") + '</button>');

        }

        var rollVal = this.state.lastRoll || 1;

        var rollGlyph = this.getDiceGlyph(rollVal);

        var landedNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;

        var landedLocHtml = "";
        if (landedNode) {
            var landedNodeDisplay = (typeof this.getUnifiedNodeDisplayName === "function") ? this.getUnifiedNodeDisplayName(landedNode) : (landedNode ? landedNode.name : "");
            landedLocHtml = '<div class="dice-landed-loc">' +
                '<span class="loc-name">' + (landedNode.icon ? '<span style="font-size:1.15rem; margin-right:3px;">' + landedNode.icon + '</span> ' : '📍 ') +
                '<strong>' + this.escapeHtml(landedNodeDisplay) + '</strong></span>' +
                (landedNode.code ? ' <span class="loc-code">' + this.escapeHtml(landedNode.code) + '</span>' : '') +
                '</div>';
        }

        var summaryRaw = pa.summary || "";
        if (pa.summaryMeta && window.PRS_I18n) {
            summaryRaw = window.PRS_I18n.t(pa.summaryMeta.key, pa.summaryMeta.params, pa.summary);
        } else if (summaryRaw && window.PRS_I18n) {
            var mBuy = summaryRaw.match(/Pole je volné ke koupi za\s*(\d+)\s*zl\./i);
            if (mBuy) {
                var cFmt = window.PRS_I18n.formatGold(parseInt(mBuy[1], 10));
                summaryRaw = window.PRS_I18n.t("hud.tile_free_to_buy", { cost: cFmt }, summaryRaw);
            }
        }
        var encounterHtml = this.parseTurnEncounter(summaryRaw);

        var targetHeartsAction = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;
        var actGoldStr = window.PRS_I18n ? window.PRS_I18n.formatGold(player.gold) : (player.gold + " zl.");

        var actTreasuryHtml = '<div class="turn-active-treasury-banner">' +
            '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '  <div style="display:flex; align-items:center; gap:0.45rem;">' +
            '    <span class="top-hud-avatar" style="background:' + player.color + '; width:28px; height:28px; font-size:0.95rem;">' + player.badge + '</span>' +
            '    <div>' +
            '      <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.active_knight") : "Rytíř na tahu") + '</div>' +
            '      <strong style="color:' + player.color + '; font-size:0.95rem;">' + this.escapeHtml(player.name) + '</strong>' +
            '    </div>' +
            '  </div>' +
            '  <div style="text-align:right;">' +
            '    <div style="font-size:1.15rem; font-weight:900; color:#facc15; text-shadow:0 0 10px rgba(250,204,21,0.5);">🪙 ' + actGoldStr + '</div>' +
            '    <div style="font-size:0.76rem; font-weight:bold;">' + (this.state.config && this.state.config.scenario === "slayer" ? ('<span style="color:#ef4444;">🐉 ' + ((player.stats && player.stats.dragonsSlain) ? player.stats.dragonsSlain : 0) + ' / 2 draků</span> <span style="color:#f472b6; font-size:0.72rem;">(' + player.totalHearts + ' 💖)</span>') : (this.state.config && this.state.config.scenario === "tycoon" ? ('<span style="color:#f59e0b;">🏰 ' + (player.ownedNodes ? player.ownedNodes.length : 0) + ' sídel</span> <span style="color:#f472b6; font-size:0.72rem;">(' + player.totalHearts + ' 💖)</span>') : ('<span style="color:#f472b6;">💖 ' + player.totalHearts + ' / ' + targetHeartsAction + '</span>'))) + '</div>' +
            '  </div>' +
            '</div>' +
            '</div>';

        var pouchHudHtml = this.getKnightPouchHudHtml(player, true);
        var diceBadgeText = window.PRS_I18n ? window.PRS_I18n.t("hud.dice_roll_prefix", { roll: rollVal }) : ("🎲 Hod kostkou: <strong>" + rollVal + "</strong>");

        el.innerHTML = '<div class="action-card">' +
            actTreasuryHtml +
            '<div class="dice-badge-row">' +
            '  <div class="dice-cube-mini" title="Hod: ' + rollVal + '">' + rollGlyph + '</div>' +
            '  <div class="dice-badge-content">' +
            '    <div class="dice-roll-badge">' + diceBadgeText + '</div>' +
            landedLocHtml +
            '  </div>' +
            '</div>' +

            (btns.length > 0 ? ('<div class="action-buttons-wrap" style="margin:0.75rem 0 0.85rem 0; display:flex; flex-direction:column; gap:0.45rem;">' + btns.join(" ") + '</div>') : '') +

            encounterHtml +

            specialCardHtml +

            this.getRoyalAdvisorHtml(player, "ACTION", pa, currNode) +

            pouchHudHtml +

            '</div>';
    },

    
    formatGameText: function (rawText) {

        if (!rawText) return "";

        var s = String(rawText);

        // 1. Escapování základních HTML znaků pro bezpečnost

        s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // 2. Odstranění zbytečné desetinné nuly u celých čísel srdcí (+1,0 💖 -> +1 💖)

        s = s.replace(/([+-]?\d+),0\s*(💖|srdce)/gi, "$1 $2");

        // 3. Převod markdown tučného písma **text** na stylizovaný span

        s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="hl-bold">$1</strong>');

        // 4. Zlaté zvýraznění zlaťáků (+1 500 zl., -800 zl., 2 000 zl.)

        s = s.replace(/([+-]\s*[0-9]+(?:\s*[0-9]+)*\s*zl\.)/g, '<span class="hl-gold">$1</span>');

        // 5. Růžové zářící zvýraznění Princezniných srdcí (+1 💖, +0,5 💖)

        s = s.replace(/(\+[0-9]+(?:,[0-9]+)?\s*💖)/g, '<span class="hl-heart">$1</span>');

        return s;

    },

    
    parseTurnEncounter: function (summary) {

        if (!summary) return "";

        var s = String(summary).trim();

        // Detekce strukturovaného formátu: Tag – **Title**: Lore / Text

        var m = s.match(/^(.*?)\s*–\s*\*\*(.*?)\*\*:\s*(.*)$/);

        if (m) {

            var tag = m[1].trim();

            var title = m[2].trim();

            var rest = m[3].trim();

            var rewardMatch = rest.match(/(Získáváš\s+[^.!?]+[.!?]|Ztrácíš\s+[^.!?]+[.!?]|Zaplatíš\s+[^.!?]+[.!?]|Získáno\s+[^.!?]+[.!?]|\+[0-9]+(?:,[0-9]+)?\s*💖[^.!?]*|\+[0-9\s]+\s*zl\.[^.!?]*)/i);

            var lore = rest;

            var rewardHtml = "";

            if (rewardMatch) {

                var rewardStr = rewardMatch[0];

                var idx = rest.indexOf(rewardStr);

                if (idx > 0) {

                    lore = rest.substring(0, idx).trim();

                }

                rewardHtml = '<div class="encounter-reward-badge">✨ ' + this.formatGameText(rewardStr) + '</div>';

            }

            return '<div class="turn-encounter-card encounter-chance">' +

                '  <div class="encounter-header">' +

                '    <span class="encounter-type-tag">' + this.formatGameText(tag) + '</span>' +

                '    <div class="encounter-title">' + this.formatGameText(title) + '</div>' +

                '  </div>' +

                '  <div class="encounter-lore">' + this.formatGameText(lore) + '</div>' +

                rewardHtml +

                '</div>';

        }

        // Běžná událost (nákup, mýtné, návštěva krčmy, výcvik)

        return '<div class="turn-encounter-card">' +

            '  <div class="turn-summary-text">' + this.formatGameText(s) + '</div>' +

            '</div>';

    },

    
    addLog: function (text, type) {

        if (!this.state) return;

        window.PRS_GameEngine.addLog(this.state, text, type || "action");

        this.renderLogs();

    },

    
    renderLogs: function () {
        var el = document.getElementById("game-log-list");
        if (!el || !this.state) return;
        var html = "";
        var roundLbl = window.PRS_I18n ? window.PRS_I18n.t("ui.common.round_label", null, "Kolo:") : "Kolo:";
        var roundPrefix = roundLbl.replace(":", "");
        for (var i = 0; i < Math.min(30, this.state.logs.length); i++) {
            var l = this.state.logs[i];
            var logText = l.text;
            if (l.meta && window.PRS_I18n) {
                logText = window.PRS_I18n.t(l.meta.key, l.meta.params, l.text);
            }
            html += '<div class="log-entry log-' + l.type + '"><span class="log-turn">[' + roundPrefix + ' ' + l.round + ']</span> ' + this.formatGameText(logText) + '</div>';
        }
        el.innerHTML = html;
    }
    });
})();
