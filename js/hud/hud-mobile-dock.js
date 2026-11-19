// ============================================================================
// KiDesky: Princeznino srdce - Mobilní spodní dock a Bottom Sheet
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
        updateMobileDock: function () {

        var dock = document.getElementById("mobile-action-dock");

        if (!dock) return;

        var shouldShow = (this.activeTab === "board" && this.deviceProfile && this.deviceProfile.device === "mobile" && this.deviceProfile.orientation === "portrait");

        dock.style.display = shouldShow ? "flex" : "none";

        if (!shouldShow || !this.state) return;

        var player = this.state.players ? this.state.players[this.state.currentPlayerIndex] : null;
        if (!player) return;

        if (!player) return;

        // 1. Stavový řádek hráče

        var nameEl = document.getElementById("mobile-dock-player-name");

        var badgeEl = document.getElementById("mobile-dock-player-badge");

        var pillEl = document.getElementById("mobile-dock-player-pill");

        if (nameEl) nameEl.textContent = player.name;

        if (badgeEl) badgeEl.textContent = player.badge;

        if (pillEl) pillEl.style.color = player.color || "var(--gold-light)";

        var goldEl = document.getElementById("mobile-dock-gold");

        if (goldEl) goldEl.innerHTML = '<span style="color:#facc15; font-size:0.96rem; font-weight:900; text-shadow:0 0 8px rgba(250,204,21,0.5);">🪙 ' + player.gold.toLocaleString("cs-CZ") + ' zl.</span>';

        var heartsEl = document.getElementById("mobile-dock-hearts");

        if (heartsEl) {
            var scen = (this.state.config && this.state.config.scenario) ? this.state.config.scenario : "classic";
            if (scen === "slayer") {
                var dSlain = (player.stats && player.stats.dragonsSlain) ? player.stats.dragonsSlain : 0;
                heartsEl.innerHTML = '<span style="color:#ef4444; font-weight:800;">🐉 ' + dSlain + '/2</span> <span style="font-size:0.75rem; color:#f472b6;">(' + player.totalHearts + '💖)</span>';
            } else if (scen === "tycoon") {
                var cCount = 0, kCount = 0;
                if (player.ownedNodes) {
                    for (var oi = 0; oi < player.ownedNodes.length; oi++) {
                        var oNd = this.state.board.nodes[player.ownedNodes[oi]];
                        if (oNd) {
                            var isCst = (oNd.type === "CASTLE" || (oNd.type === "VILLAGE" && (oNd.villageLevel || 1) >= 3));
                            var isTwn = (oNd.type === "TOWN" || (oNd.type === "VILLAGE" && (oNd.villageLevel || 1) >= 2));
                            if (isCst) kCount++;
                            else if (isTwn) cCount++;
                        }
                    }
                }
                heartsEl.innerHTML = '<span style="color:#f59e0b; font-weight:800;">🏰 ' + cCount + 'm/' + kCount + 'h</span> <span style="font-size:0.75rem; color:#f472b6;">(' + player.totalHearts + '💖)</span>';
            } else {
                heartsEl.textContent = "💖 " + player.totalHearts + "/" + this.state.config.targetHearts;
            }
        }

        var tileEl = document.getElementById("mobile-dock-tile");

        var curNd = this.state.board.nodes[player.nodeId];

        if (tileEl && curNd) {

            tileEl.textContent = (curNd.icon || "📍") + " " + curNd.code;

        }

        // 2. Odznaky na tlačítkách (počet věcí, počet sídel)

        var invBadge = document.getElementById("mobile-badge-inventory");

        if (invBadge) {

            var itCount = player.items ? player.items.length : 0;

            invBadge.style.display = itCount > 0 ? "flex" : "none";

            invBadge.textContent = itCount;

        }

        var estBadge = document.getElementById("mobile-badge-estates");

        if (estBadge) {

            var estCount = player.ownedNodes ? player.ownedNodes.length : 0;

            estBadge.style.display = estCount > 0 ? "flex" : "none";

            estBadge.textContent = estCount;

        }

        // 3. Primární akční tlačítko pod palcem

        var mainBtnWrap = document.getElementById("mobile-dock-primary-btn-wrap");

        if (!mainBtnWrap) return;

        var isBot = (player.type !== "Human");

        var isOnlineLock = (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot);

        if (this.state.phase === "GAME_OVER") {

            mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff;" onclick="PRS_App.openVictoryModal()">👑 KRÁLOVSKÁ SVATBA (VÝHRA)</button>';

            return;

        }

        if (isOnlineLock) {

            mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" disabled style="background:#1e293b; color:#94a3b8; border-color:#334155; font-size:0.86rem;">⏳ Čeká se na tah: ' + this.escapeHtml(player.name) + '</button>';

            return;

        }

        if (this.state.phase === "BRANCH_CHOICE") {

            var pbc = this.state.pendingBranchChoice;

            if (pbc) {

                var branchLowNode = this.state.board.nodes[pbc.branchLow];

                var branchHighNode = this.state.board.nodes[pbc.branchHigh];

                var targetLow = window.PRS_GameEngine.getTargetNodeForBranch(this.state, pbc.junctionNodeId, "low", pbc.remainingSteps);

                var targetHigh = window.PRS_GameEngine.getTargetNodeForBranch(this.state, pbc.junctionNodeId, "high", pbc.remainingSteps);

                var lowName = branchLowNode ? branchLowNode.name : "Vnější cesta";

                var highName = branchHighNode ? branchHighNode.name : "Vnitřní stezka";

                var targetLowName = targetLow ? targetLow.name : "";

                var targetHighName = targetHigh ? targetHigh.name : "";

                mainBtnWrap.innerHTML = '<div style="display:flex; flex-direction:column; gap:6px; width:100%;">' +

                    '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #059669, #047857); border-color:#6ee7b7; text-align:center; font-size:0.84rem; padding:0.55rem 0.5rem;" onclick="PRS_App.handleChooseBranch(\'low\')">🌿 Vnější: ' + this.escapeHtml(lowName) + ' (Cíl: ' + this.escapeHtml(targetLowName) + ')</button>' +

                    '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #d97706, #b45309); border-color:#fde68a; text-align:center; font-size:0.84rem; padding:0.55rem 0.5rem;" onclick="PRS_App.handleChooseBranch(\'high\')">🏰 Královská: ' + this.escapeHtml(highName) + ' (Cíl: ' + this.escapeHtml(targetHighName) + ')</button>' +

                    '</div>';

                return;

            }

        }

        if (this.state.phase === "ROLL") {

            if (isBot) {

                if (this.autoBotEnabled) {

                    mainBtnWrap.innerHTML = '<div style="display:flex; gap:6px; width:100%;">' +

                        '<button class="mobile-btn-primary" disabled style="flex:1.4; background:#1e293b; color:#94a3b8; border-color:#334155; font-size:0.83rem;">🤖 Hraje ' + this.escapeHtml(player.name) + '...</button>' +

                        '<button class="mobile-btn-primary" style="flex:1; background:rgba(212,175,55,0.22); border-color:var(--gold); color:var(--gold-light); font-size:0.79rem;" onclick="PRS_App.skipToNextHumanTurn()">⚡ Můj tah</button>' +

                        '</div>';

                } else {

                    mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.stepBotNow()">🤖 ODEHRÁT TAH PC (' + this.escapeHtml(player.name) + ')</button>';

                }

            } else {

                var effStats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

                var hasHorse = (player.stats.horses > 0 || effStats.horses > 0);

                var curMode = this.selectedMovementMode || "standard";

                if (curMode === "horse" && !hasHorse) curMode = "standard";

                var modeLabels = {
                    standard: window.PRS_I18n ? window.PRS_I18n.t("hud.roll_dice", null, "🎲 HODIT KOSTKOU (1–6)") : "🎲 HODIT KOSTKOU (1–6)",
                    cautious: window.PRS_I18n ? window.PRS_I18n.t("hud.cautious_step", null, "🚶 OPATRNÝ KROK (1–4)") : "🚶 OPATRNÝ KROK (1–4)",
                    horse: window.PRS_I18n ? window.PRS_I18n.t("hud.horse_gallop", null, "🏇 KOŇSKÝ CVAL (2d6)") : "🏇 KOŇSKÝ CVAL (2d6)"
                };

                var mTitleStandard = window.PRS_I18n ? window.PRS_I18n.t("hud.stance_march_title", null, "Běžný hod 1–6") : "Běžný hod 1–6";
                var mTitleCautious = window.PRS_I18n ? window.PRS_I18n.t("hud.stance_cautious_title", null, "Opatrný krok 1–4 pro přesné manévrování") : "Opatrný krok 1–4 pro přesné manévrování";
                var mTitleHorse = hasHorse
                    ? (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop_title", null, "Házíš 2 kostkami (2d6) – volba trysku nebo manévru!") : "Házíš 2 kostkami (2d6) – volba trysku nebo manévru!")
                    : (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop_locked_title", null, "Vyžaduje alespoň 1 koně ve stáji") : "Vyžaduje alespoň 1 koně ve stáji");

                mainBtnWrap.innerHTML = '<div style="display:flex; flex-direction:column; gap:6px; width:100%;">' +

                    '<div class="mobile-tempo-row">' +

                    '  <button type="button" class="mobile-tempo-btn ' + (curMode === "standard" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'standard\')" title="' + mTitleStandard + '" data-i18n-title="hud.stance_march_title">🎲 1–6</button>' +

                    '  <button type="button" class="mobile-tempo-btn ' + (curMode === "cautious" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'cautious\')" title="' + mTitleCautious + '" data-i18n-title="hud.stance_cautious_title">🚶 1–4</button>' +

                    '  <button type="button" class="mobile-tempo-btn ' + (!hasHorse ? "disabled" : (curMode === "horse" ? "active" : "")) + '" ' + (!hasHorse ? 'disabled' : 'onclick="PRS_App.selectMovementMode(\'horse\')"') + ' title="' + mTitleHorse + '" data-i18n-title="' + (hasHorse ? "hud.stance_gallop_title" : "hud.stance_gallop_locked_title") + '">🏇 2d6</button>' +

                    '</div>' +

                    '<button class="mobile-btn-primary" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.handleRollDice()">' + (modeLabels[curMode] || modeLabels.standard) + '</button>' +

                    '</div>';

            }

            return;

        }

        // Fáze ACTION

        var pa = this.state.pendingAction || {};

        var htmlBtns = [];

        if (pa.canResolveQuest && pa.questCard) {

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #ef4444, #b91c1c); color:#fff; border-color:#fca5a5;" onclick="PRS_App.handleResolveQuest()">⚔️ ZAÚTOČIT NA BESTII (' + this.escapeHtml(pa.questCard.name) + ')</button>');

            if (pa.questCard.questTier === "U2" || pa.questCard.questTier === "U3") {
                htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #475569, #334155); color:#fff; border-color:#94a3b8; margin-top:4px;" onclick="PRS_App.handleRetreatFromQuest()">🛡️ Taktický ústup (' + (pa.questCard.questTier === "U3" ? '800' : '400') + ' zl.)</button>');
            }

        } else if (pa.canResolveFestival) {

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border-color:#fbcfe8;" onclick="PRS_App.handleResolveFestival()">🏆 VYHODNOTIT SLAVNOST (💖)</button>');

        } else if (pa.canStoreScroll || pa.scrollCard) {

            htmlBtns.push('<div style="display:flex; flex-direction:column; gap:6px; width:100%;">' +
                (pa.canStoreScroll ? '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #059669, #047857); color:#fff; border-color:#34d399;" onclick="PRS_App.handleStoreScroll()">🎒 ULOŽIT DO BRAŠNY (' + (player.inventory ? player.inventory.length : 0) + '/3)</button>' : '') +
                '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #d97706, #b45309); color:#fff; border-color:#fde047;" onclick="PRS_App.handleUseScrollNow()">⚡ POUŽÍT SVITEK IHNED</button>' +
                '<button class="mobile-btn-primary" style="background:rgba(255,255,255,0.12); color:#fde047; border-color:var(--border-gold);" onclick="PRS_App.openChanceModal()">📜 Prohlédnout pergamen</button>' +
                '</div>');

        } else if (pa.canChooseDilemma && pa.chanceCard && pa.chanceCard.options && pa.chanceCard.options.length >= 2) {

            var cDil = pa.chanceCard;

            htmlBtns.push('<div style="display:flex; flex-direction:column; gap:6px; width:100%;">' +
                '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; border-color:#38bdf8;" onclick="PRS_App.handleChooseChanceDilemma(0)">' + cDil.options[0].icon + ' ' + this.escapeHtml(cDil.options[0].title) + '</button>' +
                '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #7c3aed, #6d28d9); color:#fff; border-color:#c084fc;" onclick="PRS_App.handleChooseChanceDilemma(1)">' + cDil.options[1].icon + ' ' + this.escapeHtml(cDil.options[1].title) + '</button>' +
                '<button class="mobile-btn-primary" style="background:rgba(255,255,255,0.12); color:#fde047; border-color:var(--border-gold);" onclick="PRS_App.openChanceModal()">📜 Zobrazit kartu osudu</button>' +
                '</div>');

        } else if (pa.chanceCard) {

            var isFlipped = (this.flippedChanceCardId === pa.chanceCard.id);
            if (!isFlipped) {
                htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; border-color:#fef08a;" onclick="PRS_App.openChanceModal()">📜 OTOČIT KARTU NÁHODY</button>');
            } else {
                htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +
                    '<button class="mobile-btn-primary" style="flex:1.2; background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; border-color:#fef08a;" onclick="PRS_App.openChanceModal()">📜 ' + this.escapeHtml(pa.chanceCard.title) + '</button>' +
                    '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +
                    '</div>');
            }

        } else if (pa.debt) {

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #b45309, #78350f); color:#fff; border-color:#fbbf24;" onclick="PRS_App.handleAutoLiquidateDebt()">⚖️ UHRADIT DLUH (' + pa.debt.remainingDebt + ' zl.)</button>');

        } else if (pa.isImprisoned || pa.canPayPrisonBail || pa.canAttemptPrisonEscape) {

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #52525b, #27272a); color:#f4f4f5; border-color:#71717a;" onclick="PRS_App.toggleMobileSheet(\'action\')">⛓️ VOLBY ŽALÁŘE (KAUCE / ÚTĚK)</button>');

        } else if (pa.canBuyNode) {

            var canAfford = player.gold >= pa.buyPrice;

            var isProc = this.isActionProcessing || this.isSavingSession;

            var buyLabel = isProc ? "⏳ KUPUJI POLE..." : "🛒 KOUPIT (" + pa.buyPrice + " zl.)";

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" id="mobile-btn-buy-node" style="flex:1.4;' + (isProc ? ' opacity:0.5; pointer-events:none;' : '') + '" ' + (!canAfford || isProc ? 'disabled' : '') + ' onclick="PRS_App.handleBuyNode()">' + buyLabel + '</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);' + (isProc ? ' opacity:0.5; pointer-events:none;' : '') + '" ' + (isProc ? 'disabled' : '') + ' onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +

                '</div>');

        } else if (pa.canUpgradeVillage) {
            var uCost = (typeof pa.upgradeCost === "number" && !isNaN(pa.upgradeCost)) ? pa.upgradeCost : 1500;
            var canAffordUpg = (player.gold || 0) >= uCost;
            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +
                '<button class="mobile-btn-primary" style="flex:1.4;" ' + (!canAffordUpg ? 'disabled' : '') + ' onclick="PRS_App.handleUpgradeVillage(' + pa.nodeId + ')">🏘️ POVÝŠIT (' + uCost + ' zl.)</button>' +
                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +
                '</div>');

        } else if (pa.canShopLivestock) {

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #15803d, #16a34a); color:#fff;" onclick="PRS_App.openLivestockMarket()">🌾 STÁJE & CHOV</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +

                '</div>');

        } else if (pa.canShopMerchant) {

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #b45309, #d97706); color:#fff;" onclick="PRS_App.openArmoryModal()">🛒 TRH & ZBROJNICE</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.end_turn", null, "➡️ Konec tahu") : "➡️ Konec tahu") + '</button>' +

                '</div>');

        } else if (pa.canTrainMaster) {

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #4f46e5, #4338ca); color:#fff;" onclick="PRS_App.toggleMobileSheet(\'action\')">🎓 CVIČIT U MISTRA</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.end_turn", null, "➡️ Konec tahu") : "➡️ Konec tahu") + '</button>' +

                '</div>');

        } else {

            htmlBtns.push('<button class="mobile-btn-primary" onclick="PRS_App.handleEndTurn()">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.end_turn", null, "➡️ UKONČIT TAH") : "➡️ UKONČIT TAH") + '</button>');

        }

        mainBtnWrap.innerHTML = htmlBtns.join("");

        // Pokud je otevřený vysouvací šuplík, aktualizujeme jeho obsah live

        if (this.activeMobileSheet) {

            this.renderMobileSheetContent();

        }

    },

    
    handleMobilePrimaryAction: function () {

        if (!this.state || this.isMoveAnimating) return;

        var p = this.state.players[this.state.currentPlayerIndex];

        if (!p) return;

        var isBot = (p.type !== "Human");

        if (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot) {

            this.pollOnlineSessionNow(true);

            return;

        }

        if (this.state.phase === "GAME_OVER") {

            this.openVictoryModal();

            return;

        }

        if (this.state.phase === "ROLL") {

            if (isBot) {

                this.stepBotNow();

            } else {

                this.handleRollDice();

            }

            return;

        }

        var pa = this.state.pendingAction || {};

        if (pa.canResolveQuest && pa.questCard) {

            this.handleResolveQuest();

            return;

        }

        if (pa.canResolveFestival) {

            this.handleResolveFestival();

            return;

        }

        if (pa.chanceCard) {

            this.toggleChanceCardFlip(pa.chanceCard.id);

            return;

        }

        if (pa.debt) {

            this.handleAutoLiquidateDebt();

            return;

        }

        if (pa.canBuyNode && p.gold >= pa.buyPrice) {

            this.handleBuyNode();

            return;

        }

        var uCost = (typeof pa.upgradeCost === "number" && !isNaN(pa.upgradeCost)) ? pa.upgradeCost : 1500;
        if (pa.canUpgradeVillage && (p.gold || 0) >= uCost) {
            this.handleUpgradeVillage(pa.nodeId);
            return;
        }

        if (pa.isImprisoned || pa.canPayPrisonBail || pa.canAttemptPrisonEscape) {

            this.toggleMobileSheet("action");

            return;

        }

        if (pa.canShopMerchant) {

            this.openArmoryModal();

            return;

        }

        if (pa.canTrainMaster) {
            if (pa.isMasterDuel) {
                btns.push('<button class="btn-action-fight" style="width:100%; margin-bottom:0.45rem; background:linear-gradient(135deg, #b91c1c, #dc2626); border-color:#fca5a5; font-weight:bold; padding:0.55rem;" onclick="PRS_App.handleMasterDuel()">⚔️ Vyzvat mistra na duel o 1.5 💖 Srdce princezny!</button>');
            }

            this.toggleMobileSheet("action");

            return;

        }

        this.handleEndTurn();

    },

    
    // --- OVLÁDÁNÍ VYSOUVACÍHO ŠUPLÍKU (BOTTOM SHEET) ---,

    toggleMobileSheet: function (sheetType) {

        if (this.activeMobileSheet === sheetType) {

            this.closeMobileSheet();

        } else {

            this.openMobileSheet(sheetType);

        }

    },

    
    openMobileSheet: function (sheetType) {

        this.activeMobileSheet = sheetType;

        var sheet = document.getElementById("mobile-bottom-sheet");

        var backdrop = document.getElementById("mobile-sheet-backdrop");

        var titleEl = document.getElementById("mobile-sheet-title");

        if (!sheet || !backdrop) return;

        var titles = {

            inventory: "🎒 Královský batoh & Výbava",

            estates: "🏰 Držená panství & Sídla",

            logs: "📜 Královská kronika událostí",

            tile: "ℹ️ Detail políčka na plánu",

            action: "⚡ Královské akce a volby"

        };

        if (titleEl) titleEl.textContent = titles[sheetType] || "Detail";

        this.renderMobileSheetContent();

        backdrop.style.display = "block";

        sheet.style.display = "flex";

        setTimeout(function () {

            backdrop.classList.add("active");

            sheet.classList.add("open");

        }, 10);

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    
    closeMobileSheet: function () {

        var sheet = document.getElementById("mobile-bottom-sheet");

        var backdrop = document.getElementById("mobile-sheet-backdrop");

        this.activeMobileSheet = null;

        if (sheet) sheet.classList.remove("open");

        if (backdrop) backdrop.classList.remove("active");

        setTimeout(function () {

            if (sheet) sheet.style.display = "none";

            if (backdrop) backdrop.style.display = "none";

        }, 280);

    },

    
    renderMobileSheetContent: function () {

        var contentEl = document.getElementById("mobile-sheet-content");

        if (!contentEl || !this.state) return;

        var p = this.state.players[this.state.currentPlayerIndex];

        if (!p) return;

        var html = "";

        var sheetType = this.activeMobileSheet;

        if (sheetType === "inventory") {

            var stats = window.PRS_GameEngine.getEffectiveStats(this.state, p);

            html += '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:12px; background:rgba(0,0,0,0.35); padding:8px; border-radius:10px; text-align:center;">' +

                '<div><small style="color:var(--text-muted);">⚔️ Boj</small><div style="font-weight:bold; font-size:1.1rem; color:#f87171;">' + stats.combat + '</div></div>' +

                '<div><small style="color:var(--text-muted);">🏇 Jízda</small><div style="font-weight:bold; font-size:1.1rem; color:#60a5fa;">' + stats.riding + '</div></div>' +

                '<div><small style="color:var(--text-muted);">💃 Tanec</small><div style="font-weight:bold; font-size:1.1rem; color:#f472b6;">' + stats.dance + '</div></div>' +

                '<div><small style="color:var(--text-muted);">✨ Charisma</small><div style="font-weight:bold; font-size:1.1rem; color:#fbbf24;">' + stats.charisma + '</div></div>' +

                '</div>';

            html += '<h4 style="font-size:0.9rem; margin-bottom:6px; color:var(--gold-light);">🎒 Předměty a zbraně (' + p.items.length + '):</h4>';

            if (p.items.length === 0) {

                html += '<p style="color:var(--text-muted); font-size:0.84rem;">Batoh je prázdný. Zastav se u Kupce nebo v Královské zbrojnici.</p>';

            } else {

                html += '<div style="display:flex; flex-direction:column; gap:6px;">';

                for (var i = 0; i < p.items.length; i++) {

                    var it = p.items[i];
                    var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                                  (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);
                    var itemName = (window.PRS_App && typeof window.PRS_App.getItemDisplayName === "function") ? window.PRS_App.getItemDisplayName(it) : (it.name || (baseDef ? baseDef.name : "Neznámý předmět"));
                    var itemIcon = it.icon || (baseDef ? baseDef.icon : "📦");
                    var itemSlot = it.slot || (baseDef ? baseDef.slot : "");
                    var itemPrice = (it.price !== undefined && it.price !== null) ? it.price : (baseDef && baseDef.price ? baseDef.price : 0);

                    var itBoj = Number(it.combat !== undefined && it.combat !== null ? it.combat : (baseDef && baseDef.combat !== undefined ? baseDef.combat : 0)) || 0;
                    var itJizda = Number(it.riding !== undefined && it.riding !== null ? it.riding : (baseDef && baseDef.riding !== undefined ? baseDef.riding : 0)) || 0;
                    var itTanec = Number(it.dance !== undefined && it.dance !== null ? it.dance : (baseDef && baseDef.dance !== undefined ? baseDef.dance : 0)) || 0;
                    var itChar = Number(it.charisma !== undefined && it.charisma !== null ? it.charisma : (baseDef && baseDef.charisma !== undefined ? baseDef.charisma : 0)) || 0;

                    var statParts = [];
                    if (itBoj !== 0) statParts.push("⚔️" + (itBoj > 0 ? "+" : "") + itBoj);
                    if (itJizda !== 0) statParts.push("🐎" + (itJizda > 0 ? "+" : "") + itJizda);
                    if (itTanec !== 0) statParts.push("💃" + (itTanec > 0 ? "+" : "") + itTanec);
                    if (itChar !== 0) statParts.push("✨" + (itChar > 0 ? "+" : "") + itChar);
                    var bonusLabel = statParts.length > 0 ? statParts.join(" ") : (itemPrice > 0 ? (itemPrice.toLocaleString("cs-CZ") + " zl.") : "Bez bonusu");

                    html += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:6px 10px; border-radius:8px; border:1px solid rgba(212,175,55,0.2);">' +

                        '<div>' + itemIcon + ' <strong>' + this.escapeHtml(itemName) + '</strong> <small style="color:var(--gold-light); font-weight:600;">' + (itemSlot ? ('[' + this.formatSlotLabel(itemSlot, true) + ']') : '') + '</small></div>' +

                        '<div style="font-weight:600; color:var(--gold-light); font-size:0.82rem;">' + (it.bonusText || bonusLabel) + '</div>' +

                        '</div>';

                }

                html += '</div>';

            }

            html += '<button class="btn-action-buy" style="width:100%; margin-top:12px;" onclick="PRS_App.openArmoryModal()">🛒 Otevřít Královskou zbrojnici & Trh</button>';

        } else if (sheetType === "estates") {

            html += '<h4 style="font-size:0.9rem; margin-bottom:6px; color:var(--gold-light);">🏰 Vlastněná panství a chovy (' + p.ownedNodes.length + '):</h4>';

            if (p.ownedNodes.length === 0) {

                html += '<p style="color:var(--text-muted); font-size:0.84rem;">Zatím nevlastníš žádnou vesnici, město ani hřebčín. Skupuj prázdná pole při průchodu!</p>';

            } else {

                html += '<div style="display:flex; flex-direction:column; gap:6px;">';

                var sortedOwnedNodes = (window.PRS_GameEngine && window.PRS_GameEngine.getSortedOwnedNodes)
                    ? window.PRS_GameEngine.getSortedOwnedNodes(p, this.state)
                    : (p.ownedNodes || []);

                for (var n = 0; n < sortedOwnedNodes.length; n++) {

                    var ndId = sortedOwnedNodes[n];

                    var ndObj = this.state.board.nodes[ndId];

                    if (!ndObj) continue;

                    var rent = window.PRS_GameEngine.calculateNodeRent(this.state, ndObj, p);

                    html += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 10px; border-radius:8px; border:1px solid rgba(212,175,55,0.2);">' +

                        '<div>' + (ndObj.icon || '📍') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> <small style="color:var(--text-muted);">(' + ndObj.code + ')' + (ndObj.villageLevel > 1 ? (' ★' + ndObj.villageLevel) : '') + '</small></div>' +

                        '<div style="font-weight:bold; color:#86efac; font-size:0.84rem;">Mýtné: ' + rent.toLocaleString("cs-CZ") + ' zl.</div>' +

                        '</div>';

                }

                html += '</div>';

            }

        } else if (sheetType === "logs") {

            html += '<div class="log-box" style="max-height:55vh;">';

            for (var l = 0; l < Math.min(30, this.state.logs.length); l++) {

                var lg = this.state.logs[l];

                html += '<div class="log-item ' + (lg.type || '') + '" style="font-size:0.82rem; padding:4px 0;">' +

                    '<span class="log-time" style="color:var(--text-muted); margin-right:4px;">[' + lg.time + ']</span>' +

                    this.formatGameText(lg.text) +

                    '</div>';

            }

            html += '</div>';

        } else if (sheetType === "tile") {

            var tileCardEl = document.getElementById("player-standing-tile-card");

            if (tileCardEl) {

                html = tileCardEl.innerHTML;

            } else {

                html = '<div class="empty-note">Žádné políčko ke zkoumání.</div>';

            }

        } else if (sheetType === "action") {

            var actPanelEl = document.getElementById("turn-action-panel");

            if (actPanelEl) {

                html = actPanelEl.innerHTML;

            }

        }

        contentEl.innerHTML = html;

    }
    });
})();
