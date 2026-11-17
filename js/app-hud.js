// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Herní HUD, Dolní Sál, Mobilní Ovládání a Tahy
// ============================================================================

(function () {
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

                mainBtnWrap.innerHTML = '<div style="display:flex; flex-direction:column; gap:6px; width:100%;">' +

                    '<div class="mobile-tempo-row">' +

                    '  <button type="button" class="mobile-tempo-btn ' + (curMode === "standard" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'standard\')">🎲 1–6</button>' +

                    '  <button type="button" class="mobile-tempo-btn ' + (curMode === "cautious" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'cautious\')">🚶 1–4</button>' +

                    '  <button type="button" class="mobile-tempo-btn ' + (!hasHorse ? "disabled" : (curMode === "horse" ? "active" : "")) + '" ' + (!hasHorse ? 'disabled' : 'onclick="PRS_App.selectMovementMode(\'horse\')"') + '>🏇 2d6</button>' +

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

    },

    // ========================================================================

    // INTERAKTIVNÍ ZOOM A POSOUVÁNÍ MAPY (PAN & ZOOM)

    // ========================================================================,

    getPlayerDisplayName: function (player) {
        if (!player) return "";
        var name = player.name || "";
        var isYou = (player.type === "Human" && (name.indexOf("(Ty)") !== -1 || name.indexOf("(You)") !== -1));
        var cleanName = name.replace(/\s*\((?:Ty|You|PC|AI)\)$/i, "").trim();
        if (isYou) {
            var youTag = window.PRS_I18n ? window.PRS_I18n.t("common.you_tag", null, "(Ty)") : "(Ty)";
            return cleanName + " " + youTag;
        }
        return name;
    },

    getPlayerPawnAvatarHtml: function (p, sizePx) {
        var sz = sizePx || 28;
        var isDead = !!(p && p.isEliminated);
        var pawnObj = window.PRS_getPawnById ? window.PRS_getPawnById(p ? p.pawnId : null) : null;
        var img = pawnObj ? pawnObj.img : "assets/pawns/pawn_knight_valiant.png";
        var isPrem = pawnObj && pawnObj.category === "premium";
        var borderCol = isDead ? "#ef4444" : (isPrem ? "#ffd86b" : (p ? p.color : "#d4af37"));
        var glow = isDead ? "0 0 8px rgba(239, 68, 68, 0.85)" : (isPrem ? ("0 0 8px " + (pawnObj.accentColor || "#ffd86b")) : "0 2px 4px rgba(0,0,0,0.6)");
        var bgGrad = isDead ? "radial-gradient(circle, #7f1d1d 0%, #180505 90%)" : ("radial-gradient(circle, " + (p ? p.color : '#334155') + " 0%, #1a0f0a 85%)");
        var imgStyle = "width:108%; height:108%; object-fit:contain; transform:translateY(1px); border-radius:50%;" + (isDead ? " filter:grayscale(100%) brightness(0.5) contrast(1.3); opacity:0.65;" : "");
        var skullBadge = isDead ? ('<span class="dead-skull-overlay" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:' + Math.round(sz * 0.58) + 'px; line-height:1; z-index:3; text-shadow:0 0 4px #000, 0 0 8px #dc2626; pointer-events:none;">💀</span>') : '';

        return '<span class="pawn-hud-avatar ' + (isDead ? 'pawn-avatar-dead' : '') + '" style="position:relative; display:inline-flex; align-items:center; justify-content:center; width:' + sz + 'px; height:' + sz + 'px; border-radius:50%; background:' + bgGrad + '; border:2px solid ' + borderCol + '; box-shadow:' + glow + '; flex-shrink:0; vertical-align:middle;">' +
            '<img src="' + img + '" alt="" style="' + imgStyle + '"/>' +
            skullBadge +
            '</span>';
    },

    renderEndlessModeBanner: function () {
        var banner = document.getElementById("board-endless-mode-banner");
        if (!banner) return;

        if (!this.state || !this.state.isEndlessMode) {
            banner.style.display = "none";
            return;
        }

        banner.style.display = "flex";
        var winIdx = (this.state.originalWinnerIndex !== null && this.state.originalWinnerIndex !== undefined) ? this.state.originalWinnerIndex : (this.state.winnerIndex || 0);
        var winner = (this.state.players && this.state.players[winIdx]) ? this.state.players[winIdx] : null;
        var winName = winner ? (winner.badge + " " + winner.name) : "Vítěz";
        var winColor = winner ? winner.color : "var(--gold-light)";
        var winRound = this.state.originalWinRound || this.state.roundNumber || 1;

        banner.innerHTML =
            '<div style="display:flex; align-items:center; gap:0.65rem;">' +
            '  <span style="font-size:1.5rem; filter:drop-shadow(0 0 6px rgba(234,179,8,0.7));">👑</span>' +
            '  <div>' +
            '    <div style="color:var(--gold-light); font-size:0.95rem; font-weight:700; font-family:\'Cinzel\',serif;">' +
            '      🏆 HRA JE DOHRÁNA • VÍTĚZ: <strong style="color:' + winColor + ';">' + this.escapeHtml(winName) + '</strong> (' + winRound + '. kolo)!' +
            '    </div>' +
            '    <div style="font-size:0.77rem; color:#fde68a; margin-top:2px;">' +
            '      ♾️ <em>Režim nekonečné volné hry: pokračuješ ve stavění, chovu a plnění zbývajících cílů pro radost ze hry.</em>' +
            '    </div>' +
            '  </div>' +
            '</div>' +
            '<div style="display:flex; gap:0.45rem; align-items:center;">' +
            '  <button type="button" class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.75rem; border-color:var(--gold); color:var(--gold-light); font-weight:700;" onclick="PRS_App.openVictoryModal()" title="Zobrazit slavnostní tabulku a statistiky vítězství">🏆 Výsledky &amp; Síň slávy</button>' +
            '  <button type="button" class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.75rem;" onclick="PRS_App.startNewGame(true)" title="Začít novou partii od začátku">🔄 Nová partie</button>' +
            '</div>';
    },

    renderTopPlayersHud: function () {
        this.renderEndlessModeBanner();

        var el = document.getElementById("board-top-players-hud");
        if (!el || !this.state || !this.state.players) return;

        var target = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;
        var curIdx = this.state.currentPlayerIndex;
        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : curIdx;
        var winIdx = (this.state.originalWinnerIndex !== null && this.state.originalWinnerIndex !== undefined) ? this.state.originalWinnerIndex : this.state.winnerIndex;

        var html = [];
        for (var i = 0; i < this.state.players.length; i++) {
            var p = this.state.players[i];
            var isTurn = (i === curIdx);
            var isInspected = (i === inspIdx);
            var isOfficialWinner = (this.state.isEndlessMode || this.state.phase === "GAME_OVER") && (i === winIdx);
            var winnerTag = isOfficialWinner ? ' <span style="background:linear-gradient(135deg,#eab308,#ca8a04); color:#000; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:3px; letter-spacing:0.3px; box-shadow:0 0 6px rgba(234,179,8,0.7);" title="Oficiální vítěz partie">🏆 VÍTĚZ</span>' : '';

            var p = this.state.players[i];

            var isTurn = (i === curIdx);

            var isInspected = (i === inspIdx);

            var scen = (this.state.config && this.state.config.scenario) ? this.state.config.scenario : "classic";
            var pct = 0;
            var statsHeartsHtml = "";
            if (scen === "slayer") {
                var dSlain = (p.stats && p.stats.dragonsSlain) ? p.stats.dragonsSlain : 0;
                var targetD = (this.state.config && this.state.config.targetDragons) ? this.state.config.targetDragons : 2;
                pct = Math.min(100, Math.round((dSlain / targetD) * 100));
                statsHeartsHtml = '<div class="top-hud-hearts" style="color:#ef4444; font-weight:bold;" title="Ulovení draci (cíl scénáře): ' + dSlain + '/' + targetD + ', Srdce: ' + p.totalHearts + ' 💖">🐉 ' + dSlain + ' / ' + targetD + ' <span style="font-size:0.75rem; color:#f472b6; font-weight:600;">(' + p.totalHearts + '💖)</span></div>';
            } else if (scen === "tycoon") {
                var cCount = 0, kCount = 0;
                if (p.ownedNodes) {
                    for (var oi = 0; oi < p.ownedNodes.length; oi++) {
                        var oNd = this.state.board.nodes[p.ownedNodes[oi]];
                        if (oNd) {
                            if (oNd.level === 3 || oNd.type === "CASTLE") kCount++;
                            else if (oNd.level === 2 || oNd.type === "TOWN") cCount++;
                        }
                    }
                }
                pct = Math.min(100, Math.round(((cCount + kCount) / 4) * 100));
                statsHeartsHtml = '<div class="top-hud-hearts" style="color:#f59e0b; font-weight:bold; display:flex; align-items:center; justify-content:flex-end; gap:5px;" title="Ovládnutá panství: ' + cCount + '/3 měst, ' + kCount + '/1 hrad"><span>🏰 ' + cCount + 'm/' + kCount + 'h</span> <span style="font-size:0.75rem; color:#f472b6; font-weight:600;">(' + p.totalHearts + '💖)</span>' +
                    '<span style="font-size:0.69rem; font-weight:700; color:' + ((p.inventory && p.inventory.length) ? '#fde047' : '#94a3b8') + '; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.22); border-radius:3px; padding:0 3px;" title="Rytířská brašna pergamenů: ' + ((p.inventory && p.inventory.length) || 0) + '/3">🎒' + ((p.inventory && p.inventory.length) || 0) + '/3</span>' +
                    '</div>';
            } else {
                pct = Math.min(100, Math.round((p.totalHearts / target) * 100));
                statsHeartsHtml = '<div class="top-hud-hearts" style="display:flex; align-items:center; justify-content:flex-end; gap:5px;"><span>💖 ' + p.totalHearts + ' / ' + target + '</span>' +
                    '<span style="font-size:0.69rem; font-weight:700; color:' + ((p.inventory && p.inventory.length) ? '#fde047' : '#94a3b8') + '; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.22); border-radius:3px; padding:0 3px;" title="Rytířská brašna pergamenů: ' + ((p.inventory && p.inventory.length) || 0) + '/3">🎒' + ((p.inventory && p.inventory.length) || 0) + '/3</span>' +
                    '</div>';
            }

            html.push('<div class="top-hud-card ' + (isTurn ? 'is-turn' : '') + ' ' + (isInspected ? 'is-inspected' : '') + ' ' + (p.isEliminated ? 'is-eliminated' : '') + '" ' +

                'style="border-left: 4px solid ' + p.color + ';" ' +

                'onclick="PRS_App.selectPlayerToInspect(' + i + ')" ' +

                'onmouseenter="PRS_App.showPlayerTooltip(event, ' + i + ')" ' +

                'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                'title="' + this.escapeHtml(p.name) + ' – klepnutím zobrazíš detail rytíře">' +

                '  <div class="top-hud-row-main">' +

                '    <div class="top-hud-identity">' +

                '      ' + this.getPlayerPawnAvatarHtml(p, 30) + 

                '      <div class="top-hud-name-col">' +

                '        <div class="top-hud-name" style="' + (isTurn ? 'color:#fef08a; font-weight:800;' : '') + '">' +
                this.escapeHtml(p.name) + winnerTag +
                (p.isEliminated ? ' <span style="background:#dc2626; color:#fff; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:4px; letter-spacing:0.5px; box-shadow:0 0 6px rgba(220,38,38,0.7);">💀 MRTEV</span>' : '') +

                '        </div>' +

                (isTurn ? '        <span class="top-hud-turn-badge">👑 Na tahu</span>' : '') +

                '      </div>' +

                '    </div>' +

                '    <div class="top-hud-stats">' +

                (p.isEliminated ? '      <div class="top-hud-gold" style="color:#ef4444; font-weight:bold; font-size:0.75rem;">🪙 0 zl.</div><div class="top-hud-hearts" style="color:#ef4444; font-weight:bold; font-size:0.75rem;">💀 ELIMINOVÁN</div>' : '      <div class="top-hud-gold">🪙 <strong>' + p.gold.toLocaleString("cs-CZ") + '</strong> zl.</div>' + statsHeartsHtml) +

                '    </div>' +

                '  </div>' +

                '  <div class="top-hud-progress"><div class="top-hud-progress-bar" style="width:' + pct + '%; background:' + p.color + ';"></div></div>' +

                '</div>');

        }

        el.innerHTML = html.join("");

    },

    renderHeartTrack: function () {

        var raceEl = document.getElementById("princess-race-container");

        var el = document.getElementById("heart-track-bar");

        if (!this.state) return;

        var target = this.state.config.targetHearts;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;

        // 1. Závod o Princeznino srdce (Race Track)

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        if (raceEl) {

            var scen = (this.state.config && this.state.config.scenario) ? this.state.config.scenario : "classic";
            var raceHeaderTitle = isEn ? '🏆 RACE FOR THE PRINCESS\'S HEART' : '🏆 ZÁVOD O PRINCEZNINO SRDCE';
            var raceGoalBadge = '<span style="color:#f472b6;">' + (isEn ? 'Goal: ' : 'Cíl: ') + target + ' ❤️</span>';
            var finishIcon = '👑🏰';
            var finishTitle = isEn ? 'Royal Castle & Princess' : 'Královský hrad & Princezna';

            if (scen === "slayer") {
                raceHeaderTitle = isEn ? '🐉 SCENARIO: DRAGON SLAYERS' : '🐉 SCÉNÁŘ: LOVCI DRAKŮ';
                raceGoalBadge = '<span style="color:#ef4444; font-weight:800;">' + (isEn ? 'Goal: 2 dragons in Dragon Lairs (U3) 🐉' : 'Cíl: 2 draci v Dračích slujích (U3) 🐉') + '</span>';
                finishIcon = '🐉👑';
                finishTitle = isEn ? 'Slain Dragon & Royal Triumph' : 'Skolený drak & Královský triumf';
            } else if (scen === "tycoon") {
                raceHeaderTitle = isEn ? '🏰 SCENARIO: FEUDAL TYCOON' : '🏰 SCÉNÁŘ: FEUDÁLNÍ MAGNÁT';
                raceGoalBadge = '<span style="color:#f59e0b; font-weight:800;">' + (isEn ? 'Goal: 3 towns + 1 castle 🏰' : 'Cíl: 3 města + 1 hrad 🏰') + '</span>';
                finishIcon = '🏰👑';
                finishTitle = isEn ? 'Feudal Estates' : 'Feudální panství';
            }

            var raceHtml = '<div class="princess-race-header">' +
                '<span>' + raceHeaderTitle + '</span>' +
                raceGoalBadge +
                '</div>' +
                '<div class="princess-race-track">' +
                '  <div class="race-milestones">';

            if (scen === "slayer") {
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>0 🐉</span></div>';
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>1 🐉</span></div>';
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>2 🐉 (Cíl)</span></div>';
            } else if (scen === "tycoon") {
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>Start</span></div>';
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>2 sídla</span></div>';
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>3m + 1h (Cíl)</span></div>';
            } else {
                var stepCount = 5;
                for (var m = 0; m <= stepCount; m++) {
                    var stepVal = Math.round((target / stepCount) * m);
                    raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>' + stepVal + ' ❤️</span></div>';
                }
            }

            raceHtml += '  </div>';

            for (var rIdx = 0; rIdx < this.state.players.length; rIdx++) {
                var plTrack = this.state.players[rIdx];
                var isActTrack = (rIdx === this.state.currentPlayerIndex);
                var isInspTrack = (rIdx === inspIdx);
                var pctTrack = 3;
                var trackTooltip = "";

                if (scen === "slayer") {
                    var dCount = (plTrack.stats && plTrack.stats.dragonsSlain) ? plTrack.stats.dragonsSlain : 0;
                    pctTrack = Math.min(94, Math.max(3, (dCount / 2) * 88 + 3));
                    trackTooltip = this.escapeHtml(plTrack.name) + ': ' + dCount + '/2 draků (' + plTrack.totalHearts + ' ❤️, ' + plTrack.gold.toLocaleString("cs-CZ") + ' zl.)';
                } else if (scen === "tycoon") {
                    var cCount = 0, kCount = 0;
                    if (plTrack.ownedNodes) {
                        for (var oi = 0; oi < plTrack.ownedNodes.length; oi++) {
                            var oNd = this.state.board.nodes[plTrack.ownedNodes[oi]];
                            if (oNd) {
                                var isCst = (oNd.type === "CASTLE" || (oNd.type === "VILLAGE" && (oNd.villageLevel || 1) >= 3));
                                var isTwn = (oNd.type === "TOWN" || (oNd.type === "VILLAGE" && (oNd.villageLevel || 1) >= 2));
                                if (isCst) kCount++;
                                else if (isTwn) cCount++;
                            }
                        }
                    }
                    pctTrack = Math.min(94, Math.max(3, ((cCount + kCount) / 4) * 88 + 3));
                    trackTooltip = this.escapeHtml(plTrack.name) + ': ' + cCount + 'm/' + kCount + 'h (' + plTrack.totalHearts + ' ❤️, ' + plTrack.gold.toLocaleString("cs-CZ") + ' zl.)';
                } else {
                    pctTrack = Math.min(94, Math.max(3, (plTrack.totalHearts / target) * 88 + 3));
                    trackTooltip = this.escapeHtml(plTrack.name) + ': ' + plTrack.totalHearts + ' ❤️ (' + plTrack.gold.toLocaleString("cs-CZ") + ' zl.)';
                }

                raceHtml += '<div class="race-token ' + (isInspTrack ? 'inspected-race-token' : '') + '" ' +
                    'style="left:' + pctTrack + '%;background:' + plTrack.color + ';border-color:' + (isActTrack ? '#fbbf24' : (isInspTrack ? '#38bdf8' : '#ffffff')) + ';box-shadow:0 0 ' + (isActTrack ? '14px #fbbf24' : (isInspTrack ? '12px #38bdf8' : '6px rgba(0,0,0,0.6)')) + '; cursor:pointer;" ' +
                    'onclick="PRS_App.selectPlayerToInspect(' + rIdx + ')" ' +
                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + rIdx + ')" ' +
                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                    'title="' + trackTooltip + ' - Klepni pro zobrazení statistik" style="padding:0; overflow:hidden; display:inline-flex; align-items:center; justify-content:center;"><img src="' + (window.PRS_getPawnById && window.PRS_getPawnById(plTrack.pawnId) ? window.PRS_getPawnById(plTrack.pawnId).img : 'assets/pawns/pawn_knight_valiant.png') + '" style="width:100%; height:100%; object-fit:contain;"/></div>';
            }

            raceHtml += '  <div class="race-finish-crown" title="' + finishTitle + '">' + finishIcon + '</div>' +
                '</div>';

            raceEl.innerHTML = raceHtml;

        }

        // 2. Detailní karty rytířů u stolu (kliknutím nebo najetím se zobrazí statistiky)

        if (el) {

            var html = "";

            for (var i = 0; i < this.state.players.length; i++) {

                var p = this.state.players[i];

                var isCurrent = (i === this.state.currentPlayerIndex);

                var isInspected = (i === inspIdx);

                var pct = Math.min(100, Math.round((p.totalHearts / target) * 100));

                html += '<div class="heart-player-pill ' + (isCurrent ? 'active-turn' : '') + ' ' + (isInspected ? 'inspected-player' : '') + '" ' +
                    'style="border-color:' + p.color + ';" ' +
                    'onclick="PRS_App.selectPlayerToInspect(' + i + ')" ' +
                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + i + ')" ' +
                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                    'title="Kliknutím zobrazíš podrobné statistiky a výbavu rytíře ' + this.escapeHtml(p.name) + '">';
                    var pDispName = (this.getPlayerDisplayName ? this.getPlayerDisplayName(p) : (window.PRS_App && window.PRS_App.getPlayerDisplayName ? window.PRS_App.getPlayerDisplayName(p) : p.name));
                    var botTag = (p.type !== "Human")
                        ? '<small class="bot-tag">' + (isEn ? 'AI' : 'PC') + '</small>'
                        : '<small class="bot-tag" style="background:#0284c7;color:#fff;">' + (isEn ? 'Player' : 'Hráč') + '</small>';
                    var inspBadge = isInspected
                        ? (' <span style="font-size:0.72rem; color:#fde047; font-weight:600; margin-left:4px;">👁️ ' + (isEn ? 'Inspected' : 'Zobrazen') + '</span>')
                        : '';
                    var goldTxt = p.gold.toLocaleString(isEn ? "en-US" : "cs-CZ") + (isEn ? ' g.' : ' zl.');
                    var breedTxt = (isEn ? '🐎 Breeding: +' : '🐎 Chov: +') + p.breedingHearts + ' ❤️';

                    html += '<div class="hp-header">' +

                    '  <span class="hp-name-wrap" style="display:inline-flex; align-items:center; gap:0.35rem;">' + this.getPlayerPawnAvatarHtml(p, 24) + ' <strong class="hp-name-txt">' + this.escapeHtml(pDispName) + '</strong> ' + botTag + inspBadge + '</span>' +

                    '  <span class="hp-hearts">' + p.totalHearts + ' / ' + target + ' ❤️</span>' +

                    '</div>' +

                    '<div class="hp-progress-bg"><div class="hp-progress-fill" style="width:' + pct + '%;background:' + p.color + '"></div></div>' +

                    '<div class="hp-sub">' +

                    '  <span>💰 ' + goldTxt + '</span>' +

                    '  <span>' + breedTxt + '</span>' +

                    '  <span>⚔️' + p.skills.combat + ' 🏇' + p.skills.riding + ' 💃' + p.skills.dance + ' 👑' + p.skills.charisma + '</span>' +

                    '</div>' +

                    '</div>';

            }

            el.innerHTML = html;

        }

        this.renderLowerKnightDetail();

    },

    switchSidebarTab: function (tabName) {

        this.activeSidebarTab = tabName;

        var tabs = ["tile", "knight", "property", "log"];

        for (var i = 0; i < tabs.length; i++) {

            var t = tabs[i];

            var btn = document.getElementById("stab-btn-" + t);

            var pane = document.getElementById("sidebar-tab-pane-" + t);

            if (btn) {

                if (t === tabName) btn.classList.add("active");

                else btn.classList.remove("active");

            }

            if (pane) {

                pane.style.display = (t === tabName) ? "block" : "none";

            }

        }

        if (tabName === "property") this.renderSidebarPropertyPanel();

        if (tabName === "log") this.renderSidebarQuickLogPanel();

        this.renderLowerKnightDetail();

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    renderSidebarPropertyPanel: function () {

        var el = document.getElementById("sidebar-player-property-panel");

        if (!el || !this.state || !this.state.players || !this.state.players[this.state.currentPlayerIndex]) return;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;

        var player = this.state.players[inspIdx] || this.state.players[this.state.currentPlayerIndex];

        if (!player) return;

        var isMyTurn = (player.index === this.state.currentPlayerIndex && player.type === "Human");

        var nodes = this.state.board.nodes || [];

        var sortedOwnedIds = (window.PRS_GameEngine && window.PRS_GameEngine.getSortedOwnedNodes)
            ? window.PRS_GameEngine.getSortedOwnedNodes(player, this.state)
            : (player.ownedNodes || []);

        var owned = [];

        for (var i = 0; i < sortedOwnedIds.length; i++) {

            var nd = nodes[sortedOwnedIds[i]];

            if (nd) owned.push(nd);

        }

        var stats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

        var econ = window.PRS_GameEngine.calculatePlayerEconomySummary ? window.PRS_GameEngine.calculatePlayerEconomySummary(this.state, player) : null;

        var totalTaxYield = econ ? econ.totalTaxYield : 0;

        var totalRentSum = econ ? econ.totalRentSum : 0;

        var startStipend = econ ? econ.startStipend : 3000;

        var grandYield = econ ? econ.estimatedRoundYield : 0;

        var villageCount = econ ? econ.villages : stats.ownedVillages;

        var cityCount = econ ? econ.towns : stats.ownedTowns;

        var castleCount = econ ? econ.castles : stats.ownedCastles;

        var craftCount = econ ? econ.craftsAndJesters : ((stats.ownedBuildings || 0) + (stats.ownedJesters || 0));

        var animalTotal = econ ? econ.animalsTotal : (stats.horses + stats.dogs + stats.falcons);

        var estCfg = (this.state.config && this.state.config.estates) ? this.state.config.estates : {};

        var html = [];

        html.push('<div class="property-panel-card">');

        html.push('  <div class="property-header-banner" style="align-items:flex-start;">');

        html.push('    <div style="display:flex; align-items:center; gap:0.5rem;">');

        html.push('      ' + this.getPlayerPawnAvatarHtml(player, 34));

        html.push('      <div>');

        html.push('        <div style="font-family:\'Cinzel\',serif; font-size:1.02rem; font-weight:700; color:#fef08a;">' + this.escapeHtml(player.name) + '</div>');

        html.push('        <div style="font-size:0.74rem; color:#cbd5e1;">Držená pole na mapě: <strong>' + owned.length + ' polí</strong></div>');

        html.push('      </div>');

        html.push('    </div>');

        html.push('    <div class="property-yield-badge" title="Součet výnosu daní u Výběrčího (' + totalTaxYield.toLocaleString("cs-CZ") + ' zl.) a potenciálu mýtného ze všech držených polí (' + totalRentSum.toLocaleString("cs-CZ") + ' zl.)">💰 +' + grandYield.toLocaleString("cs-CZ") + ' zl. / okruh</div>');

        html.push('  </div>');

        // Přehledný rozpis ekonomiky a zlatých za kolo
        html.push('  <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.35rem; margin-bottom:0.65rem; background:rgba(0,0,0,0.35); border:1px solid rgba(212,175,55,0.22); border-radius:8px; padding:0.42rem 0.5rem; text-align:center;">');

        html.push('    <div title="Zisk vyplacený pokaždé, když kdokoliv stoupne na Výběrčího daní (vesnice + města + hrady + hospodářský chov)">');

        html.push('      <div style="font-size:0.66rem; color:#94a3b8; text-transform:uppercase;">👑 Výnos daní (VD)</div>');

        html.push('      <div style="font-size:0.86rem; font-weight:800; color:#fde047;">+' + totalTaxYield.toLocaleString("cs-CZ") + ' zl.</div>');

        html.push('    </div>');

        html.push('    <div title="Součet aktuálního nájemného (mýtného) ze všech tvých vlastněných polí na mapě">');

        html.push('      <div style="font-size:0.66rem; color:#94a3b8; text-transform:uppercase;">🛡️ Součet mýtného</div>');

        html.push('      <div style="font-size:0.86rem; font-weight:800; color:#4ade80;">+' + totalRentSum.toLocaleString("cs-CZ") + ' zl.</div>');

        html.push('    </div>');

        html.push('    <div title="Královský žold vyplacený při každém průchodu nebo zastavení na poli START">');

        html.push('      <div style="font-size:0.66rem; color:#94a3b8; text-transform:uppercase;">🚩 Žold na STARTu</div>');

        html.push('      <div style="font-size:0.86rem; font-weight:800; color:#38bdf8;">+' + startStipend.toLocaleString("cs-CZ") + ' zl.</div>');

        html.push('    </div>');

        html.push('  </div>');

        // Seznam sídel, živností a šlechtických chovů
        html.push('  <div style="font-size:0.78rem; font-weight:700; color:#fca5a5; margin-bottom:0.4rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">');

        html.push('    <span>🏰 Sídla, Panství &amp; Mýtné (' + owned.length + '):</span>');

        html.push('    <small style="color:#cbd5e1; font-weight:600; font-size:0.7rem;">🏡 ' + villageCount + ' ves. • 🏛️ ' + cityCount + ' měst • 🏰 ' + castleCount + ' hradů • ⚒️ ' + craftCount + ' živn. • 🐾 ' + animalTotal + ' zvířat</small>');

        html.push('  </div>');

        if (owned.length === 0) {

            html.push('  <div style="font-size:0.8rem; color:#94a3b8; font-style:italic; padding:0.6rem 0; text-align:center;">Zatím nevlastníš žádná pole království.</div>');

        } else {

            html.push('  <div class="property-list" style="max-height:215px; overflow-y:auto;">');

            for (var o = 0; o < owned.length; o++) {

                var pNode = owned[o];

                var icon = pNode.icon || "🏘️";

                var rentVal = window.PRS_GameEngine.calculateNodeRent(this.state, pNode, player, 4);

                var catLabel = "Panství";

                var extraTaxInfo = "";

                if (pNode.type === "VILLAGE") {

                    var vLvl = pNode.villageLevel || 1;

                    var vTax = (estCfg.villageTaxYield && estCfg.villageTaxYield[vLvl - 1]) || 500;

                    catLabel = "Vesnice (" + "★".repeat(vLvl) + " " + vLvl + "/3)";

                    extraTaxInfo = ' &bull; <span style="color:#fde047;">Daň: +' + vTax.toLocaleString("cs-CZ") + ' zl.</span>';

                } else if (pNode.type === "TOWN") {

                    var tTax = estCfg.townTaxYield || 1200;

                    catLabel = "Královské město";

                    extraTaxInfo = ' &bull; <span style="color:#fde047;">Daň: +' + tTax.toLocaleString("cs-CZ") + ' zl.</span>';

                } else if (pNode.type === "CASTLE") {

                    var cTax = estCfg.castleTaxYield || 2500;

                    catLabel = "Pevný hrad (+1 Charisma)";

                    extraTaxInfo = ' &bull; <span style="color:#fde047;">Daň: +' + cTax.toLocaleString("cs-CZ") + ' zl.</span>';

                } else if (pNode.type === "ANIMAL") {

                    var countInSet = 0;

                    for (var si = 0; si < owned.length; si++) {

                        if (owned[si].type === "ANIMAL" && owned[si].setId === pNode.setId) countInSet++;

                    }

                    var aTypeLabel = pNode.subtype === "horse" ? "Chov koní" : (pNode.subtype === "dog" ? "Chov psů" : "Chov sokolů");

                    catLabel = aTypeLabel + " (Sada #" + pNode.setId + " • " + countInSet + "/3 ks)";

                } else if (pNode.type === "BUILDING") {

                    var bName = pNode.subtype === "stables" ? "Královské stáje (+1 Jízda)" :
                               (pNode.subtype === "forge" ? "Kovárna (+1 Boj)" :
                               (pNode.subtype === "tailor" ? "Krejčovská dílna (+1 Tanec)" :
                               (pNode.subtype === "falconer" ? "Sokolník" :
                               (pNode.subtype === "doghandler" ? "Psovod" : "Živnost"))));

                    catLabel = "Živnost: " + bName;

                } else if (pNode.type === "JESTER") {

                    catLabel = "Královský kejklíř (hod × 100 zl.)";

                }

                html.push('    <div class="property-item-row">');

                html.push('      <div class="property-item-left">');

                html.push('        <span style="font-size:1.15rem;">' + icon + '</span>');

                html.push('        <div>');

                html.push('          <div style="font-weight:700; color:#f8fafc; font-size:0.84rem;">' + this.escapeHtml(pNode.name) + '</div>');

                html.push('          <div style="font-size:0.71rem; color:#cbd5e1;">' + catLabel + ' &bull; <span style="color:#4ade80; font-weight:700;">Nájem: ' + rentVal.toLocaleString("cs-CZ") + ' zl.</span>' + extraTaxInfo + '</div>');

                html.push('        </div>');

                html.push('      </div>');

                if (pNode.type === "VILLAGE" && (pNode.villageLevel || 1) < 3 && isMyTurn) {

                    var uPrice = (estCfg.villagePrices && estCfg.villagePrices[pNode.villageLevel || 1]) || 1500;

                    html.push('      <button class="rules-subnav-btn" style="font-size:0.68rem; padding:3px 7px; white-space:nowrap;" onclick="PRS_App.handleUpgradeVillage(' + pNode.id + ')" title="Povýšit vesnici na vyšší stupeň">★ Povýšit (' + uPrice + ' zl.)</button>');

                }

                html.push('    </div>');

            }

            html.push('  </div>');

        }

        // Chov zvířat a stáje (Šlechtický chov + Hospodářský chov na vesnicích)
        var completeSets = econ ? econ.completeSetsCount : (player.completeSetsCount || 0);
        var breedHearts = Math.round(((player.breedingHearts || 0) + (player.setHeartsBonus || 0)) * 10) / 10;
        var livestockTaxBonus = econ ? econ.livestockTaxBonus : (stats.livestockTaxBonus || 0);
        var livestockCap = econ ? econ.livestockCapacity : (stats.livestockCapacity || 0);
        var extraLivestock = econ ? econ.extraLivestockCount : (stats.extraLivestockCount || 0);

        html.push('  <div style="font-size:0.78rem; font-weight:700; color:#fca5a5; margin-top:0.65rem; margin-bottom:0.25rem; display:flex; justify-content:space-between; align-items:center;">');

        html.push('    <span>🐎 Šlechtický &amp; Hospodářský chov zvěře:</span>');

        html.push('    <small style="color:#f472b6; font-weight:700;">Sady K+P+S: ' + completeSets + ' (Celkem +' + breedHearts + ' 💖)</small>');

        html.push('  </div>');

        html.push('  <div class="property-animal-grid">');

        html.push('    <div class="property-animal-slot" title="Šlechtický chov koní z herních polí (umožňuje Koňský cval 2d6 a účast v Závodě a Turnaji)"><span class="property-animal-icon">🐴</span><span class="property-animal-qty">' + (stats.horses || 0) + ' koní</span><small style="font-size:0.62rem; color:#94a3b8; display:block;">Šlechtický chov</small></div>');

        html.push('    <div class="property-animal-slot" title="Šlechtický chov loveckých psů z herních polí (bonus k lovu zvěře U1 a Turnaji)"><span class="property-animal-icon">🐕</span><span class="property-animal-qty">' + (stats.dogs || 0) + ' psů</span><small style="font-size:0.62rem; color:#94a3b8; display:block;">Šlechtický chov</small></div>');

        html.push('    <div class="property-animal-slot" title="Šlechtický chov loveckých sokolů z herních polí (umožňuje Sokolí navigaci ±1 pole při pěší chůzi či taktickém manévru na koni)"><span class="property-animal-icon">🦅</span><span class="property-animal-qty">' + (stats.falcons || 0) + ' sokolů</span><small style="font-size:0.62rem; color:#94a3b8; display:block;">Šlechtický chov</small></div>');

        html.push('    <div class="property-animal-slot" title="Hospodářský skot z velkých osad (3★), dokoupených stád a karet Náhody: každá kráva dává +200 zl. u Výběrčího daní a +100 zl. k nájmu vesnic"><span class="property-animal-icon">🐄</span><span class="property-animal-qty">' + (stats.cattle || 0) + ' krav</span><small style="font-size:0.62rem; color:#fde047; display:block;">Výnos +200 zl./ks</small></div>');

        html.push('    <div class="property-animal-slot" title="Hospodářský chov ovcí z vesnic (1★+), dokoupených stád a karet Náhody: každá ovce dává +120 zl. u Výběrčího daní a +50 zl. k nájmu vesnic"><span class="property-animal-icon">🐑</span><span class="property-animal-qty">' + (stats.sheep || 0) + ' ovcí</span><small style="font-size:0.62rem; color:#fde047; display:block;">Výnos +120 zl./ks</small></div>');

        html.push('    <div class="property-animal-slot" title="Hospodářský chov vepřů z městeček (2★+), dokoupených stád a karet Náhody: každé prase dává +150 zl. u Výběrčího daní a +75 zl. k nájmu vesnic"><span class="property-animal-icon">🐖</span><span class="property-animal-qty">' + (stats.pigs || 0) + ' prasat</span><small style="font-size:0.62rem; color:#fde047; display:block;">Výnos +150 zl./ks</small></div>');

        html.push('  </div>');

        // Panel rozvoje venkovského chovu (Krávy, Ovce, Prasata)
        html.push('  <div style="margin-top:0.45rem; background:rgba(15,23,42,0.65); border:1px solid rgba(212,175,55,0.22); border-radius:8px; padding:0.45rem 0.55rem; font-size:0.72rem; color:#cbd5e1;">');

        html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">');

        html.push('      <span>🌾 <strong>Pastviny &amp; Hospodářský dvůr:</strong></span>');

        html.push('      <span style="color:#fde047; font-weight:700;">Daň z chovu: +' + livestockTaxBonus.toLocaleString("cs-CZ") + ' zl.</span>');

        html.push('    </div>');

        if (livestockCap <= 0) {

            html.push('    <div style="color:#94a3b8; font-size:0.7rem; line-height:1.35;">Kup na mapě <strong>Vesnici</strong> (automaticky chová 1★ 🐑, 2★ +🐖, 3★ +🐄), <strong>Město</strong> nebo <strong>Stáje</strong>, abys odemkl pastviny pro dokoupení dobytka! Dobytek lze získat i z Karet Náhody.</div>');

        } else {

            var canBuyMore = isMyTurn && (extraLivestock < livestockCap);

            html.push('    <div style="color:#94a3b8; font-size:0.69rem; margin-bottom:0.35rem;">Přikoupený dobytek na pastvinách: <strong>' + extraLivestock + ' / ' + livestockCap + ' ks</strong> (zvyšuje daně u VD i nájem vesnic):</div>');

            if (isMyTurn) {
                var lsCfgHud = (this.state && this.state.config && this.state.config.livestock) ? this.state.config.livestock : {};
                var sPr = (lsCfgHud.sheepPrice !== undefined) ? Number(lsCfgHud.sheepPrice) : 500;
                var pPr = (lsCfgHud.pigsPrice !== undefined) ? Number(lsCfgHud.pigsPrice) : 600;
                var cPr = (lsCfgHud.cattlePrice !== undefined) ? Number(lsCfgHud.cattlePrice) : 800;

                html.push('    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.3rem;">');

                html.push('      <button type="button" class="rules-subnav-btn" ' + (!canBuyMore || player.gold < sPr ? 'disabled style="opacity:0.45; font-size:0.67rem; padding:3px 4px;"' : 'style="font-size:0.67rem; padding:3px 4px; cursor:pointer;"') + ' onclick="PRS_App.handleBuyLivestock(&quot;sheep&quot;)" title="Přikoupit ovci">+🐑 Ovce (' + sPr + ')</button>');

                html.push('      <button type="button" class="rules-subnav-btn" ' + (!canBuyMore || player.gold < pPr ? 'disabled style="opacity:0.45; font-size:0.67rem; padding:3px 4px;"' : 'style="font-size:0.67rem; padding:3px 4px; cursor:pointer;"') + ' onclick="PRS_App.handleBuyLivestock(&quot;pigs&quot;)" title="Přikoupit prase">+🐖 Prase (' + pPr + ')</button>');

                html.push('      <button type="button" class="rules-subnav-btn" ' + (!canBuyMore || player.gold < cPr ? 'disabled style="opacity:0.45; font-size:0.67rem; padding:3px 4px;"' : 'style="font-size:0.67rem; padding:3px 4px; cursor:pointer;"') + ' onclick="PRS_App.handleBuyLivestock(&quot;cattle&quot;)" title="Přikoupit krávu">+🐄 Kráva (' + cPr + ')</button>');

                html.push('    </div>');

            }

        }

        html.push('  </div>');

        html.push('</div>');

        el.innerHTML = html.join("");

    },

    handleBuyLivestock: function (animalType) {
        if (!this.state || !window.PRS_GameEngine.buyLivestock) return;
        var res = window.PRS_GameEngine.buyLivestock(this.state, this.state.currentPlayerIndex, animalType);
        if (!res || !res.ok) {
            if (res && res.message) {
                this.showPawnToast(this.state.currentPlayerIndex, res.message, "⚠️", "#f87171");
            }
            return;
        }
        if (window.PRS_Audio) window.PRS_Audio.playCoin();
        this.showPawnToast(this.state.currentPlayerIndex, "Přikoupeno: " + res.animal.icon + " " + res.animal.name + "!", res.animal.icon, "#4ade80");
        this.renderGameScreen();
        if (this.renderArmoryGrid) this.renderArmoryGrid();
        if (this.renderArmoryModalContent) this.renderArmoryModalContent();
        this.saveSessionAuto();
    },

    renderSidebarQuickLogPanel: function () {

        var el = document.getElementById("sidebar-quick-log-panel");

        if (!el || !this.state) return;

        var logs = this.state.log || [];

        var recent = logs.slice(Math.max(0, logs.length - 8)).reverse();
        var isEn = (typeof window !== "undefined" && window.PRS_I18n && window.PRS_I18n.getLanguage() === "en");

        var html = [];

        html.push('<div class="quick-log-card">');

        html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.4rem; border-bottom:1px solid rgba(212,175,55,0.25);">');

        html.push('    <div style="font-family:\'Cinzel\',serif; font-size:0.98rem; font-weight:700; color:#fef08a;">' + (isEn ? '📜 Royal Chronicle' : '📜 Královská kronika') + '</div>');

        html.push('    <a href="#board-lower-dashboard" onclick="event.preventDefault(); document.getElementById(\\\'board-lower-dashboard\\\').scrollIntoView({behavior:\\\'smooth\\\'});" style="font-size:0.75rem; color:#38bdf8; text-decoration:none;">' + (isEn ? "All records ↓" : "Všechny záznamy ↓") + '</a>');

        html.push('  </div>');

        if (recent.length === 0) {

            html.push('  <div style="font-size:0.8rem; color:#94a3b8; font-style:italic; padding:0.6rem 0; text-align:center;">' + (isEn ? 'The chronicle is silent for now. Roll the dice to begin the adventure!' : 'Kronika zatím mlčí. Hodem kostkou začne dobrodružství!') + '</div>');

        } else {

            html.push('  <div class="quick-log-list">');

            for (var i = 0; i < recent.length; i++) {

                var entry = recent[i];

                var typeCls = "normal";

                if (entry.indexOf("Hodil") !== -1 || entry.indexOf("🎲") !== -1) typeCls = "roll";

                else if (entry.indexOf("VÍTĚZSTVÍ") !== -1 || entry.indexOf("PORÁŽKA") !== -1 || entry.indexOf("⚔️") !== -1) typeCls = "combat";

                else if (entry.indexOf("Koupil") !== -1 || entry.indexOf("Povýšil") !== -1 || entry.indexOf("🏰") !== -1) typeCls = "buy";

                else if (entry.indexOf("💖") !== -1 || entry.indexOf("Turnaj") !== -1) typeCls = "heart";

                else if (entry.indexOf("NÁHODA") !== -1 || entry.indexOf("📜") !== -1) typeCls = "chance";

                // Očištění od markdownu pro kompaktní zobrazení

                var clean = entry.replace(/\*\*(.*?)\*\*/g, '$1');

                html.push('    <div class="quick-log-entry ' + typeCls + '">' + this.escapeHtml(clean) + '</div>');

            }

            html.push('  </div>');

        }

        html.push('</div>');

        el.innerHTML = html.join("");

    },

    inspectNode: function (nodeId) {

        this.selectedNodeId = nodeId;

        this.renderBoardTokens();

        this.renderStandingNodeCard();

        if (this.activeSidebarTab === "property") this.renderSidebarPropertyPanel();

        if (this.activeSidebarTab === "log") this.renderSidebarQuickLogPanel();

        var node = this.state.board.nodes[nodeId];

        var box = document.getElementById("inspected-node-box");

        if (!box || !node) return;

        var price = window.PRS_GameEngine.getNodePrice(this.state, node);

        var ownerText = "Nikdo (Volné)";

        if (node.owner !== null && this.state.players[node.owner]) {

            ownerText = this.state.players[node.owner].badge + " " + this.escapeHtml(this.state.players[node.owner].name);

        }

        var extra = "";

        if (node.type === "ANIMAL") {

            extra = "Sada zvířat č. <strong>" + node.setId + "</strong> | Cena: <strong>" + price + " zl.</strong> | Nájem: 20 % / 40 % (pár) / 80 % (celá sada)";

        } else if (node.type === "VILLAGE") {

            extra = "Cena: <strong>" + price + " zl.</strong> | Úroveň: <strong>" + (node.villageLevel || 1) + "/3</strong> | Daňový výnos u Výběrčího: 500 / 900 / 1 400 zl.";

        } else if (node.type === "TOWN" || node.type === "CASTLE") {

            extra = "Cena: <strong>" + price + " zl.</strong> | Vlastník: " + ownerText;

        } else if (price > 0) {

            extra = "Cena: <strong>" + price + " zl.</strong> | Vlastník: " + ownerText;

        } else {

            extra = "Speciální událost na trase";

        }

        box.innerHTML = '<div class="inspect-title">' + node.icon + ' <strong>' + this.escapeHtml(node.name) + '</strong> <small>(' + node.code + ')</small></div>' +

            '<div class="inspect-sub">' + extra + '</div>';

    },

    // --- PROMINENTNÍ KARTA: POLÍČKO, NA KTERÉM HRÁČ STOJÍ / KTERÉ ZKOUMÁ (BEZ SCROLLOVÁNÍ) ---,

    renderStandingNodeCard: function () {

        var el = document.getElementById("player-standing-tile-card");

        if (!el || !this.state) return;

        var p = this.state.players[this.state.currentPlayerIndex];

        if (!p) return;

        var inspectId = (this.selectedNodeId !== null && this.selectedNodeId !== undefined) ? this.selectedNodeId : p.nodeId;

        var node = this.state.board.nodes[inspectId];

        if (!node) return;

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var isMyCurrentStandingTile = (inspectId === p.nodeId);

        var bmpUrl = this.getTileBitmapUrl(node);

        if (!bmpUrl && (node.type === "START" || node.type === "CASTLE" || node.code === "START" || (node.code && node.code.indexOf("START") !== -1))) {

            bmpUrl = "assets/tiles/castle.png";

        }

        var price = window.PRS_GameEngine.getNodePrice(this.state, node);

        var ownerText = isEn ? "Unclaimed (No owner)" : "Volné (Nikdo nevlastní)";

        var ownerBadge = "";

        var isOwnedByMe = false;

        var isOwnedByOther = false;

        if (node.owner !== null && this.state.players[node.owner]) {

            var ownerPlayer = this.state.players[node.owner];

            var ownerDisplayName = (this.getPlayerDisplayName ? this.getPlayerDisplayName(ownerPlayer) : (window.PRS_App && window.PRS_App.getPlayerDisplayName ? window.PRS_App.getPlayerDisplayName(ownerPlayer) : ownerPlayer.name));

            ownerText = ownerPlayer.badge + " " + this.escapeHtml(ownerDisplayName);

            ownerBadge = '<span style="color:' + ownerPlayer.color + '; font-weight:bold;">' + ownerText + '</span>';

            if (node.owner === this.state.currentPlayerIndex) isOwnedByMe = true;

            else isOwnedByOther = true;

        }

        var description = "";

        var statusPill = "";

        var advisorEval = (!isMyCurrentStandingTile && this.getAdvisorTileEvaluation) ? this.getAdvisorTileEvaluation(node, p) : "";

        if (node.type === "START") {

            description = isEn
                ? "Royal Castle Start. Passing or landing grants royal pay of <strong>+3,000 g.</strong> and revives from death."
                : "Královský hradní Start. Při průchodu nebo vstupu získáváš královský žold <strong>+3 000 zl.</strong> a zotavuješ se z úmrtí.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">' + (isEn ? "👑 Royal Gate" : "👑 Královská brána") + '</span>';

        } else if (node.type === "ANIMAL") {

            var animalName = (node.subtype === "horse" ? (isEn ? "Horse" : "Kůň") : (node.subtype === "dog" ? (isEn ? "Dog" : "Pes") : (isEn ? "Falcon" : "Sokol")));

            if (isOwnedByMe) {

                description = isEn
                    ? ("Your animal (" + animalName + " from set #" + node.setId + "). Rivals landing here pay rent of 20% / 40% / 80% of set value.")
                    : ("Tvé zvíře (" + animalName + " ze sady č. " + node.setId + "). Pokud na něj vstoupí soupeř, zaplatí ti nájemné 20 % / 40 % / 80 % ceny sady.");

                statusPill = '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac; border-color:#22c55e;">' + (isEn ? "🛡️ Your Beast" : "🛡️ Tvé zvíře") + '</span>';

            } else if (isOwnedByOther) {

                var rent = Math.round(price * 0.2);

                description = isEn
                    ? ("Animal owned by " + ownerBadge + ". Landing here incurs rent payment (approx. <strong>" + rent + " g.</strong>).")
                    : ("Zvíře vlastní " + ownerBadge + ". Za stoupnutí na toto pole platíš majiteli nájemné (cca <strong>" + rent + " zl.</strong>).");

                statusPill = '<span class="standing-tile-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5; border-color:#ef4444;">' + (isEn ? "💸 Rival Property" : "💸 Cizí majetek") + '</span>';

            } else {

                description = isEn
                    ? ("Unclaimed animal (" + animalName + " from set #" + node.setId + "). Horse required for Race & Tournament; Dog and Falcon for Tournament and breeding bonus (up to +3 💖).")
                    : ("Volné zvíře (" + animalName + " ze sady č. " + node.setId + "). Kůň je nutný pro Závod a Turnaj, Pes a Sokol pro Turnaj a chovatelskou prémii (až +3 💖).");

                statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">' + (isEn ? ("🛒 Buy: " + price + " g.") : ("🛒 Koupě: " + price + " zl.")) + '</span>';

            }

        } else if (node.type === "VILLAGE") {

            var lvl = node.villageLevel || 1;

            if (isOwnedByMe) {

                description = isEn
                    ? ("Your village at level <strong>" + lvl + "/3</strong> (" + "★".repeat(lvl) + "). Generates a steady tribute of <strong>" + (lvl === 1 ? '500' : (lvl === 2 ? '900' : '1,400')) + " g.</strong> upon Tax Collector visits.")
                    : ("Tvá vesnice na úrovni <strong>" + lvl + "/3</strong> (" + "★".repeat(lvl) + "). Při návštěvě Výběrčího daní (VD) ti přináší stálý výnos <strong>" + (lvl === 1 ? '500' : (lvl === 2 ? '900' : '1 400')) + " zl.</strong>");

                statusPill = '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac; border-color:#22c55e;">' + (isEn ? "🏘️ Your Village" : "🏘️ Tvá vesnice") + '</span>';

            } else if (isOwnedByOther) {

                description = isEn
                    ? ("Village owned by " + ownerBadge + ". Generates gold for the owner whenever anyone lands on the Tax Collector.")
                    : ("Vesnici vlastní " + ownerBadge + ". Přináší majiteli zlaťáky pokaždé, když kdokoliv stoupne na Výběrčího daní.");

                statusPill = '<span class="standing-tile-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5; border-color:#ef4444;">' + (isEn ? "🏘️ Rival Estate" : "🏘️ Panství soupeře") + '</span>';

            } else {

                description = isEn
                    ? ("Unclaimed village. Can be purchased for <strong>" + price + " g.</strong> and upgraded twice. Tax yield: 500 / 900 / 1,400 g.")
                    : ("Volná vesnice. Lze ji koupit za <strong>" + price + " zl.</strong> a následně dvakrát povýšit. Daňový výnos: 500 / 900 / 1 400 zl.");

                statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">' + (isEn ? ("🛒 Buy: " + price + " g.") : ("🛒 Koupě: " + price + " zl.")) + '</span>';

            }

        } else if (node.type === "TOWN") {

            description = isOwnedByMe
                ? (isEn ? "Your fortified town. Generates a steady tax yield of <strong>1,200 g.</strong> upon Tax Collector visits." : "Tvé opevněné město. Přináší stálý daňový výnos <strong>1 200 zl.</strong> u Výběrčího daní.")
                : (isEn ? ("Royal town. Price: " + price + " g., yield: 1,200 g. Owner: " + (ownerBadge || "None")) : ("Královské město. Cena: " + price + " zl., výnos: 1 200 zl. Vlastník: " + (ownerBadge || "Nikdo")));

            statusPill = isOwnedByMe
                ? ('<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac;">' + (isEn ? "🏙️ Your Town" : "🏙️ Tvé město") + '</span>')
                : ('<span class="standing-tile-badge">' + (isEn ? ("🏙️ Town: " + price + " g.") : ("🏙️ Město: " + price + " zl.")) + '</span>');

        } else if (node.type === "CASTLE") {

            description = isEn
                ? ("Mighty castle. Yields <strong>2,500 g.</strong> tax income and grants <strong>+1 Charisma</strong> to its owner. Owner: " + (ownerBadge || "None"))
                : ("Pevný hrad. Přináší daňový výnos <strong>2 500 zl.</strong> a majiteli trvale propůjčuje <strong>+1 Charisma</strong>. Vlastník: " + (ownerBadge || "Nikdo"));

            statusPill = isOwnedByMe
                ? ('<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac;">' + (isEn ? "🏯 Your Castle" : "🏯 Tvůj hrad") + '</span>')
                : ('<span class="standing-tile-badge">' + (isEn ? ("🏯 Castle: " + price + " g.") : ("🏯 Hrad: " + price + " zl.")) + '</span>');

        } else if (node.type === "MASTER") {

            var skName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(node.skill, true) : (isEn ? "Any virtue (Grandmaster)" : "Libovolná vlastnost (Velmistr)");

            description = isEn
                ? ("Master's Guild (" + skName + "). Rolling <strong>4, 5, or 6</strong> admits you to apprentice training for the next level (1,000–5,000 g.).")
                : ("Sídlo Mistra (" + skName + "). Pokud hodíš <strong>4, 5 nebo 6</strong>, mistr tě přijme do výcviku na další úroveň (1 000–5 000 zl.).");

            statusPill = '<span class="standing-tile-badge" style="background:rgba(147,51,234,0.25); color:#d8b4fe; border-color:#a855f7;">' + (isEn ? "🎓 Training (roll 4–6)" : "🎓 Výcvik (hod 4–6)") + '</span>';

        } else if (node.type === "MERCHANT") {

            description = isEn
                ? "Royal Market. Buy item packages of tiers 1, 2, and 3 (weapons, armor, garments) and sell unwanted gear at favorable rates (1/2 for items, 100% for buildings)."
                : "Královský trh. Můžeš zde nakupovat balíčky Věcí 1., 2. a 3. stupně (zbraně, zbroj, šaty) a prodávat nepotřebný majetek za výhodnější kurz (1/2 za věci, 100 % za budovy).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(16,185,129,0.25); color:#6ee7b7; border-color:#10b981;">' + (isEn ? "⚖️ Royal Market" : "⚖️ Královský trh") + '</span>';

        } else if (node.type === "QUEST") {

            var qName = (this.getNodeDisplayName ? this.getNodeDisplayName(node) : (window.PRS_App && window.PRS_App.getNodeDisplayName ? window.PRS_App.getNodeDisplayName(node) : (node.name || "")));

            description = isEn
                ? ("Combat Quest (" + qName + "). Duel beasts, monsters, or a dragon. Victory brings gold and chronicle honors.")
                : ("Bojový úkol (" + qName + "). Zde se utkáš v souboji kostkou se zvěří, monstrem nebo drakem. Vítězství přináší zlato a zápis do kroniky.");

            statusPill = '<span class="standing-tile-badge" style="background:rgba(220,38,38,0.25); color:#fca5a5; border-color:#ef4444;">' + (isEn ? "⚔️ Combat Quest" : "⚔️ Bojový úkol") + '</span>';

        } else if (node.type === "FESTIVAL") {

            description = isEn
                ? "Royal Festival Grounds (Tournament, Ball, Race). Earn the most <strong>Princess Hearts 💖</strong> on the score track here!"
                : "Místo konání Královských Slavností (Turnaj, Ples, Závod). Zde získáváš nejvíce <strong>Srdcí princezny 💖</strong> do Bodové osy!";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(236,72,153,0.25); color:#fbcfe8; border-color:#ec4899;">' + (isEn ? "💖 Royal Festival" : "💖 Slavnost princezny") + '</span>';

        } else if (node.type === "TAX") {

            description = isEn
                ? "Royal Tax Collector. Landing here immediately collects taxes from all your villages, towns, and castles!"
                : "Královský výběrčí daní. Hráč, který sem vstoupí, okamžitě získá zlaťáky ze všech svých vesnic, měst a hradů!";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a; border-color:#eab308;">' + (isEn ? "👑 Tax Collection" : "👑 Výběr daní") + '</span>';

        } else if (node.type === "BONUS") {

            var bGold = node.bonusGold || 200;

            description = isEn
                ? ("Royal Premium Road. Landing here immediately awards a bonus of <strong>+" + bGold + " g.</strong>")
                : ("Královská prémiová cesta. Hráč při vstupu okamžitě získává bonus <strong>+" + bGold + " zl.</strong>");

            statusPill = '<span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a;">' + (isEn ? ("💰 Bonus +" + bGold + " g.") : ("💰 Bonus +" + bGold + " zl.")) + '</span>';

        } else if (node.type === "JESTER") {

            var jName = (this.getNodeDisplayName ? this.getNodeDisplayName(node) : (window.PRS_App && window.PRS_App.getNodeDisplayName ? window.PRS_App.getNodeDisplayName(node) : (node.name || "")));

            description = isEn
                ? ("Jester (" + jName + "). Each owned jester increases rent paid by opponents landing on any of your jesters.")
                : ("Kejklíř (" + jName + "). Každý vlastněný kejklíř zvyšuje nájemné, které ti soupeři platí při vstupu na tvé kejklíře.");

            statusPill = '<span class="standing-tile-badge" style="background:rgba(168,85,247,0.25); color:#e9d5ff;">' + (isEn ? ("🃏 Jester: " + price + " g.") : ("🃏 Kejklíř: " + price + " zl.")) + '</span>';

        } else if (node.type === "CHANCE") {

            description = isEn
                ? "Tile of Fate (Chance). Draw a random card with an unforeseen event or royal decree."
                : "Pole osudu (Náhoda). Taháš náhodnou kartu s nečekanou událostí nebo královským ediktem.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(59,130,246,0.25); color:#bfdbfe;">' + (isEn ? "❓ Chance Card" : "❓ Karta Náhody") + '</span>';

        } else if (node.type === "PRISON") {

            description = isEn
                ? "Royal Dungeon. Detained knights must pay 1,000 g. bail, attempt escape (roll 6), or serve their sentence."
                : "Královská šatlava. Zadržení rytíři zde musí složit kauci 1 000 zl., pokusit se o útěk (kostka 6), nebo si odsedět trest.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(113,113,122,0.25); color:#e4e4e7; border-color:#71717a;">' + (isEn ? "⛓️ Royal Dungeon" : "⛓️ Královská šatlava") + '</span>';

        } else if (node.type === "HOSPITAL") {

            description = isEn
                ? "Royal Infirmary. Knights heal after fierce battles with monsters and dragons, and can purchase a Healing Elixir (+1 Combat, +0.5 💖 for 800 g.)."
                : "Královský lazaret (Špitál). Zde se léčí rytíři po těžkých soubojích s monstry a drakem, a mohou zakoupit Hojivý lektvar (+1 Boj, +0.5 💖 za 800 zl.).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(2,132,199,0.25); color:#7dd3fc; border-color:#0284c7;">' + (isEn ? "🏥 Royal Infirmary" : "🏥 Královský lazaret") + '</span>';

        } else if (node.type === "TAVERN") {

            description = isEn
                ? "Golden Tankard Tavern. Gamble with the barkeep for coin (500 g. bet) or buy a round for fame (+0.5 💖 for 400 g.)."
                : "Hostinec U Zlatého korbelu. Rytíři zde hrají kostky s krčmářem o zlaťáky (sázka 500 zl.) nebo zvou společnost na rundu pro zvýšení slávy (+0.5 💖 za 400 zl.).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(217,119,6,0.25); color:#fde68a; border-color:#d97706;">' + (isEn ? "🍺 Tankard Tavern" : "🍺 Krčma U Korbelu") + '</span>';

        } else {

            description = isEn ? "Special landmark on the royal route." : "Speciální místo na královské trase.";

            statusPill = '<span class="standing-tile-badge">' + node.code + '</span>';

        }

        var headerTag = isMyCurrentStandingTile

            ? '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25); color:var(--gold-light); border-color:var(--gold);">' + (isEn ? "📍 YOU ARE STANDING HERE" : "📍 ZDE PRÁVĚ STOJÍŠ") + ' (' + node.code + ')</span>'

            : '<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">' +

                '<span class="standing-tile-badge" style="background:rgba(56,189,248,0.2); color:#7dd3fc; border-color:#38bdf8;">' + (isEn ? "🔍 INSPECTING TILE" : "🔍 PROZKOUMÁVÁŠ POLE") + ' (' + node.code + ')</span>' +

                '<button class="btn-secondary" style="padding:0.12rem 0.45rem; font-size:0.75rem;" onclick="PRS_App.inspectNode(' + p.nodeId + ')">' + (isEn ? "🎯 Back to my tile" : "🎯 Zpět na mé pole") + '</button>' +

              '</div>';

        var imgHtml = bmpUrl

            ? '<img src="' + this.escapeHtml(bmpUrl) + '" alt="' + this.escapeHtml(node.name) + '" onerror="this.onerror=null; this.src=\'assets/tiles/castle.png\';" />'

            : ((node.type === "START" || node.type === "CASTLE" || node.code === "START")

                ? '<img src="assets/tiles/castle.png" alt="' + this.escapeHtml(node.name) + '" />'

                : '<span class="emoji-icon">' + node.icon + '</span>');

        var merchantBtnHtml = (node.type === "MERCHANT")

            ? '<button class="btn-action-buy" style="margin-top:0.45rem; width:100%; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:0.4rem;" onclick="PRS_App.openArmoryModal()">' + (isEn ? "🛒 Open Royal Armory &amp; Market" : "🛒 Otevřít Královskou zbrojnici &amp; Trh") + '</button>'

            : '';

        var renderedTitle = (this.getNodeDisplayName ? this.getNodeDisplayName(node) : (window.PRS_App && window.PRS_App.getNodeDisplayName ? window.PRS_App.getNodeDisplayName(node) : node.name));

        el.innerHTML = '<div class="standing-tile-card" style="' + (isMyCurrentStandingTile ? '' : 'border-color:#38bdf8; box-shadow:0 6px 20px rgba(56,189,248,0.25);') + '">' +
            '  <div class="standing-tile-header">' +
            '    <div class="standing-tile-medallion">' + imgHtml + '</div>' +
            '    <div class="standing-tile-meta">' +
            '      <div style="display:flex; align-items:center; justify-content:space-between; gap:0.4rem; margin-bottom:2px;">' +
            '        ' + headerTag +
            '        <button class="btn-help-bubble" onclick="PRS_App.openRulesHelpForTile(\'' + (node.type || '') + '\', \'' + (node.code || '') + '\')" title="' + (isEn ? "Read rules and tips for this tile in the Codex" : "Přečíst pravidla a tipy k tomuto poli v Kodexu") + '">' + (isEn ? "❓ Help" : "❓ Nápověda") + '</button>' +
            '      </div>' +
            '      <div class="standing-tile-title">' + node.icon + ' ' + this.escapeHtml(renderedTitle) + '</div>' +
            '    </div>' +
            '  </div>' +

            '  <div class="standing-tile-body">' +

            '    <div style="margin-bottom:0.35rem;">' + description + (advisorEval ? ('<div class="inspected-tile-advisor-tip" style="margin-top:0.45rem; padding:0.3rem 0.55rem; background:rgba(212,175,55,0.12); border-left:3px solid var(--gold); border-radius:4px; font-size:0.75rem; color:#fef08a; line-height:1.35;">💡 <strong>' + (isEn ? "Advisor on this tile:" : "Rádce k tomuto poli:") + '</strong> ' + this.escapeHtml(advisorEval) + '</div>') : '') + '</div>' +

            '    <div class="standing-tile-status-row">' +

            '      <span>' + statusPill + '</span>' +

            '      <span style="color:var(--text-muted); font-size:0.78rem;">' + (isEn ? ("Position: " + (node.id + 1) + " / " + this.state.board.nodes.length) : ("Pozice: " + (node.id + 1) + " / " + this.state.board.nodes.length)) + '</span>' +

            '    </div>' +

            merchantBtnHtml +

            '  </div>' +

            '</div>';

    },

// ========================================================================

    // ŽEBŘÍČEK VŠECH HRÁČŮ, STATISTIKY A HOVER TOOLTIPY

    // ========================================================================

    inspectedPlayerIndex: null,

    activePlayerTab: "none", // "none" | "items" | "fiefs",

    toggleActivePlayerTab: function(tabName) {

        if (this.activePlayerTab === tabName) {

            this.activePlayerTab = "none";

        } else {

            this.activePlayerTab = tabName;

        }

        this.renderActivePlayerPanel();

    },

    selectPlayerToInspect: function (pIdx) {

        if (!this.state || !this.state.players[pIdx]) return;

        this.inspectedPlayerIndex = pIdx;

        this.renderTopPlayersHud();

        this.renderHeartTrack();

        this.renderPlayersStandings();

        this.renderActivePlayerPanel();

        if (this.activeSidebarTab === "property") this.renderSidebarPropertyPanel();

        this.renderLowerKnightDetail();

        if (this.state.players[pIdx]) {

            this.inspectNode(this.state.players[pIdx].nodeId);

        }

    },

    // --- DETAILNÍ KARTA STATISTIK ZVOLENÉHO RYTÍŘE V DOLNÍM SÁLU ---,

    
        renderCardDecksRow: function () {
        var el = document.getElementById("board-card-decks-container");
        if (!el || !this.state) return;

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var t = window.PRS_I18n ? function(k, d) { return window.PRS_I18n.t(k, null, d); } : function(k, d) { return d; };

        var decks = [
            { code: "VECI_1", title: t("decks_row.deck_items1", "VĚCI 1"), subtitle: isEn ? "2,500 g." : "2 500 zl.", icon: "🗡️", color: "#60a5fa", count: 9 },
            { code: "VECI_2", title: t("decks_row.deck_items2", "VĚCI 2"), subtitle: isEn ? "7,000 g." : "7 000 zl.", icon: "⚔️", color: "#a855f7", count: 7 },
            { code: "VECI_3", title: t("decks_row.deck_items3", "VĚCI 3"), subtitle: isEn ? "12,000 g." : "12 000 zl.", icon: "👑", color: "#f59e0b", count: 4 },
            { code: "ZVER_U1", title: t("decks_row.deck_beasts", "ZVĚŘ (U1)"), subtitle: isEn ? "Difficulty 4–6" : "Obtížnost 4–6", icon: "🐗", color: "#4ade80", count: 4 },
            { code: "MONSTRA_U2", title: t("decks_row.deck_monsters", "MONSTRA (U2)"), subtitle: isEn ? "Difficulty 8–10" : "Obtížnost 8–10", icon: "👹", color: "#fb923c", count: 4 },
            { code: "DRACI_U3", title: t("decks_row.deck_dragons", "DRACI (U3)"), subtitle: isEn ? "Difficulty 11–17" : "Obtížnost 11–17", icon: "🐉", color: "#f43f5e", count: 20 },
            { code: "NAHODA_N", title: t("decks_row.deck_chance", "NÁHODA"), subtitle: t("decks_row.chance_sub", "Karty osudu"), icon: "❓", color: "#eab308", count: 24 },
            { code: "SLAVNOST_S", title: t("decks_row.deck_festivals", "SLAVNOSTI"), subtitle: t("decks_row.festivals_sub", "Turnaj & ples"), icon: "🎪", color: "#ec4899", count: 3 }
        ];

        if (this.state.board && this.state.board.cardZones) {
            var bz = this.state.board.cardZones;
            for (var i = 0; i < decks.length; i++) {
                for (var j = 0; j < bz.length; j++) {
                    if (bz[j].code === decks[i].code && bz[j].count !== undefined) {
                        decks[i].count = bz[j].count;
                        break;
                    }
                }
            }
        }

        var pcsStr = t("decks_row.pcs", "ks");
        var html = [];
        html.push('<div class="decks-strip-header">');
        html.push('  <div style="display:flex; align-items:center; gap:0.6rem;">');
        html.push('    <span style="font-size:1.3rem;">🃏</span>');
        html.push('    <div>');
        html.push('      <h3 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.05rem; margin:0;">' + t("decks_row.header_title", "Královské balíčky karet &amp; Pokladnice") + '</h3>');
        html.push('      <div style="font-size:0.78rem; color:var(--text-muted);">' + t("decks_row.header_desc", "Kliknutím na balíček zobrazíš jeho kompletní pravidla, obsah karet a ceny") + '</div>');
        html.push('    </div>');
        html.push('  </div>');
        html.push('  <span style="font-size:0.75rem; color:#fde68a; background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.3); padding:2px 8px; border-radius:12px;">' + t("decks_row.badge_count", "8 balíčků království") + '</span>');
        html.push('</div>');

        html.push('<div class="decks-strip-grid">');
        for (var d = 0; d < decks.length; d++) {
            var dk = decks[d];
            var deckTitleTpl = t("decks_row.inspect_title", "Klikni pro náhled a pravidla balíčku {title}").replace("{title}", dk.title);
            html.push('<div class="deck-physical-card" style="--deck-color:' + dk.color + ';" onclick="PRS_App.inspectCardZone(\'' + dk.code + '\')" title="' + this.escapeHtml(deckTitleTpl) + '">');
            html.push('  <div class="deck-count-badge" style="border-color:' + dk.color + '; color:#f8fafc;">' + dk.count + ' ' + pcsStr + '</div>');
            html.push('  <div class="deck-icon-circle" style="border-color:' + dk.color + '; box-shadow:0 0 10px ' + dk.color + '40;">' + dk.icon + '</div>');
            html.push('  <div class="deck-card-title">' + this.escapeHtml(dk.title) + '</div>');
            html.push('  <div class="deck-card-sub" style="border-color:' + dk.color + '55;">' + this.escapeHtml(dk.subtitle) + '</div>');
            html.push('</div>');
        }
        html.push('</div>');

        el.innerHTML = html.join("\n");
    },

    // ========================================================================
    // KRÁLOVSKÝ RÁDCE & TAKTICKÝ NAŠEPTÁVAČ (BOD 7)
    // ========================================================================
    renderLowerKnightDetail: function () {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var el = document.getElementById("lower-inspected-knight-detail");

        if (!el || !this.state) return;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;

        var p = this.state.players[inspIdx];

        if (!p) return;

        var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);

        var targetHearts = this.state.config.targetHearts;

        var currNode = this.state.board.nodes[p.nodeId];

        var isTurn = (inspIdx === this.state.currentPlayerIndex);

        var eqItems = window.PRS_GameEngine.getEquippedItems(p);

        var html = '<div style="border-left: 4.5px solid ' + p.color + '; padding-left: 0.85rem;">' +

            '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem; border-bottom:1px solid rgba(212,175,55,0.22); padding-bottom:0.75rem; margin-bottom:0.85rem;">' +

            '  <div>' +

            '    <div style="display:flex; align-items:center; gap:0.65rem;">' +

            '      ' + this.getPlayerPawnAvatarHtml(p, 46) + 

            '      <div>' +

            '        <h3 style="margin:0; font-family:\'Cinzel\',serif; color:' + p.color + '; font-size:1.25rem;">' + this.escapeHtml(p.name) + ' ' + (p.type !== "Human" ? '<small class="bot-tag">PC</small>' : ('<small class="bot-tag" style="background:#0284c7;color:#fff;">' + (isEn ? "Player" : "Hráč") + '</small>')) + '</h3>' +

            '        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">' +

            (isTurn ? ('<strong style="color:#fbbf24;">⚔️ ' + (isEn ? "Active turn" : "Právě na tahu") + '</strong> • ') : '') +

            (isEn ? "Standing on: <strong>" : "Stojí na poli: <strong>") + (currNode ? this.escapeHtml((this.getNodeDisplayName ? this.getNodeDisplayName(currNode) : currNode.name)) : (isEn ? "Unknown" : "Neznámé")) + '</strong> (' + (isEn ? "Tile #" : "Pole #") + p.nodeId + ')' +

            '        </div>' +

            '      </div>' +

            '    </div>' +

            '  </div>' +

            '  <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">' +

            '    <div style="text-align:right;">' +

            '      <div style="font-size:1.08rem; font-weight:700; color:#f472b6;">' + p.totalHearts + ' / ' + targetHearts + ' ❤️</div>' +

            '      <div style="font-size:0.85rem; color:#facc15; font-weight:600;">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</div>' +

            '    </div>' +

            '    <button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.8rem; border-color:var(--gold); color:var(--gold-light);" onclick="window.scrollTo({top:0, behavior:\'smooth\'}); PRS_App.centerOnActivePlayer();" title="' + (isEn ? "Scroll up to board and highlight pawn" : "Přejít nahoru k hernímu plánu a ukázat figurku") + '">' +

            '      ' + (isEn ? "🎯 Show on board ↑" : "🎯 Ukázat na desce ↑") +

            '    </button>' +

            '  </div>' +

            '</div>';

        // 4 Cnosti rytíře

        html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:0.55rem; margin-bottom:0.95rem;">' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    ' + '<div style="font-size:0.74rem; color:var(--text-muted);">' + (isEn ? "⚔️ Combat Strength" : "⚔️ Bojová síla") + '</div>' + '' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#fca5a5;">' + st.combat + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.combat + '/5)</small></div>' +

            '  </div>' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    ' + '<div style="font-size:0.74rem; color:var(--text-muted);">' + (isEn ? "🏇 Riding Skill" : "🏇 Jezdecké umění") + '</div>' + '' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#7dd3fc;">' + st.riding + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.riding + '/5)</small></div>' +

            '  </div>' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(244,114,182,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    ' + '<div style="font-size:0.74rem; color:var(--text-muted);">' + (isEn ? "💃 Court Dance" : "💃 Dvorní tanec") + '</div>' + '' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#f472b6;">' + st.dance + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.dance + '/5)</small></div>' +

            '  </div>' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(250,204,21,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    <div style="font-size:0.74rem; color:var(--text-muted);">👑 Charisma</div>' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#fef08a;">' + st.charisma + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.charisma + '/5)</small></div>' +

            '  </div>' +

            '</div>';

        // 2 sloupce: Výbava & Panství

        html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:0.75rem;">';

        // Sloupec 1: Výbava

        var itemsList = p.items || [];

        html += '<div style="background:rgba(0,0,0,0.25); border:1px solid rgba(212,175,55,0.18); border-radius:10px; padding:0.7rem;">' +

            '  <div style="font-size:0.85rem; font-weight:700; color:var(--gold-light); margin-bottom:0.45rem; display:flex; justify-content:space-between;">' +

            '    <span>🛡️ Rytířská výbava (' + itemsList.length + ')</span>' +

            '  </div>';

        if (itemsList.length === 0) {

            html += '  <div style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">Zatím žádná výbava. Lze zakoupit v Obchodě.</div>';

        } else {

            html += '  <div style="display:flex; flex-direction:column; gap:0.3rem;">';

            for (var itIdx = 0; itIdx < itemsList.length; itIdx++) {

                var it = itemsList[itIdx];

                var isEq = (it.isEquipped === true || (it.isEquipped !== false && eqItems[it.slot] && eqItems[it.slot].id === it.id));

                html += '    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); border-radius:6px; padding:0.25rem 0.45rem; font-size:0.8rem;">' +

                    '      <span>' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong> <small style="color:var(--text-muted);">(' + (it.slot || "předmět") + ')</small></span>' +

                    '      <span style="color:' + (isEq ? '#86efac' : 'var(--text-muted)') + '; font-size:0.73rem;">' + (isEq ? '✓ Nasazeno' : 'V brašně') + '</span>' +

                    '    </div>';

            }

            html += '  </div>';

        }

        html += '</div>';

        // Sloupec 2: Panství a zvířata

        var ownedNodesList = p.ownedNodes || [];

        html += '<div style="background:rgba(0,0,0,0.25); border:1px solid rgba(212,175,55,0.18); border-radius:10px; padding:0.7rem;">' +

            '  <div style="font-size:0.85rem; font-weight:700; color:var(--gold-light); margin-bottom:0.45rem; display:flex; justify-content:space-between;">' +

            '    <span>🏰 Panství, chov a stavby (' + ownedNodesList.length + ')</span>' +

            '    <span style="font-size:0.76rem; color:#f472b6;">Chov: +' + p.breedingHearts + ' ❤️</span>' +

            '  </div>';

        if (ownedNodesList.length === 0) {

            html += '  <div style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">Zatím žádné panství ani chov.</div>';

        } else {

            html += '  <div style="display:flex; flex-direction:column; gap:0.3rem;">';

            for (var asIdx = 0; asIdx < ownedNodesList.length; asIdx++) {

                var ndId = ownedNodesList[asIdx];

                var ndObj = this.state.board.nodes[ndId];

                if (!ndObj) continue;

                var rent = window.PRS_GameEngine.calculateNodeRent(this.state, ndObj, p);

                html += '    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); border-radius:6px; padding:0.25rem 0.45rem; font-size:0.8rem;">' +

                    '      <span>' + (ndObj.icon || '🏡') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> <small style="color:var(--text-muted);">(' + ndObj.code + ')' + (ndObj.villageLevel > 1 ? (' v' + ndObj.villageLevel) : '') + '</small></span>' +

                    '      <span style="color:#86efac; font-size:0.75rem;">Mýtné: ' + rent.toLocaleString("cs-CZ") + ' zl.</span>' +

                    '    </div>';

            }

            html += '  </div>';

        }

        html += '</div>';

        html += '</div>';

        html += '</div>';

        el.innerHTML = html;

    },

    renderPlayersStandings: function () {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var el = document.getElementById("all-players-standings-box");

        if (!el || !this.state) return;

        var target = this.state.config.targetHearts;

        var curIdx = this.state.currentPlayerIndex;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : curIdx;

        var isEndless = !!(this.state && this.state.isEndlessMode);
        var winIdx = (this.state.originalWinnerIndex !== null && this.state.originalWinnerIndex !== undefined) ? this.state.originalWinnerIndex : this.state.winnerIndex;
        var winnerP = (isEndless && this.state.players && this.state.players[winIdx]) ? this.state.players[winIdx] : null;
        var headerStatus = isEndless ? ('<span style="color:#fde047; font-weight:800;" title="Oficiální vítěz partie">🏆 Vítěz: ' + this.escapeHtml(winnerP ? winnerP.name : 'Rytíř') + '</span>') : ('<span style="color:#f472b6;">Cíl: ' + target + ' 💖</span>');

        var html = '<div class="standings-card">' +
            '  <div class="standings-header">' +
            '    ' + '<span>' + (isEn ? '🏆 KNIGHTS STANDINGS &amp; RACE' : '🏆 STAV RYTÍŘŮ &amp; ZÁVOD') + '</span>' + '' +
            '    ' + headerStatus +
            '  </div>' +
            '  <div class="standings-list">';

        for (var i = 0; i < this.state.players.length; i++) {

            var p = this.state.players[i];

            var isTurn = (i === curIdx);

            var isInspected = (i === inspIdx);

            var pct = Math.min(100, Math.round((p.totalHearts / target) * 100));

            html += '<div class="standing-player-row ' + (isTurn ? 'active-turn' : '') + ' ' + (isInspected ? 'inspected-player' : '') + '" ' +

                'onmouseenter="PRS_App.showPlayerTooltip(event, ' + i + ')" ' +

                'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                'onclick="PRS_App.selectPlayerToInspect(' + i + ')" ' +

                'title="Najetím zobrazíš statistiky, kliknutím otevřeš detail výbavy">';

            html += '  <div class="sp-info">' +

                '    ' + this.getPlayerPawnAvatarHtml(p, 22) + 

                '    <span class="sp-name" style="' + (isTurn ? 'color:#fef08a; font-weight:700;' : '') + '">' +
                (isTurn ? '👑 ' : '') + this.escapeHtml(p.name) + ((isEndless && i === winIdx) ? ' <small style="background:#eab308; color:#000; font-size:0.62rem; font-weight:800; padding:1px 4px; border-radius:3px;">👑 VÍTĚZ</small>' : '') +
                '</span>' +

                '  </div>' +

                '  <div class="sp-hearts-col">' +

                '    <span class="sp-hearts-val">' + p.totalHearts + ' / ' + target + ' 💖</span>' +

                '    <div class="sp-bar-bg"><div class="sp-bar-fill" style="width:' + pct + '%; background:' + p.color + ';"></div></div>' +

                '  </div>' +

                '</div>';

        }

        html += '  </div>' +

            '</div>';

        el.innerHTML = html;

    },

    showPlayerTooltip: function (e, playerIndex) {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var tip = document.getElementById("player-hover-tooltip");
        if (!tip || !this.state || !this.state.players[playerIndex]) return;

        // Přepínání: Pokud uživatel klepne znovu na stejného hráče a vizitka je otevřená, zavřeme ji
        if (this._activeTooltipPlayerIndex === playerIndex && tip.style.display === "block") {
            this.hidePlayerTooltip();
            return;
        }
        this._activeTooltipPlayerIndex = playerIndex;

        var p = this.state.players[playerIndex];
        var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);
        var target = this.state.config.targetHearts;
        var currNode = this.state.board.nodes[p.nodeId];
        var eqList = [];
        var eqItems = window.PRS_GameEngine.getEquippedItems(p);
        for (var k in eqItems) {
            if (eqItems[k]) eqList.push(eqItems[k].icon + " " + eqItems[k].name);
        }
        var eqText = eqList.length > 0 ? eqList.join(", ") : "Žádná výbava";

        var html = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:0.35rem;">' +
            '  <span style="font-weight:700; color:' + p.color + '; font-size:0.95rem; display:inline-flex; align-items:center; gap:0.4rem;">' + this.getPlayerPawnAvatarHtml(p, 28) + ' ' + this.escapeHtml(p.name) + '</span>' +
            '  <div style="display:flex; align-items:center; gap:0.4rem;">' +
            '    <span style="font-size:0.75rem; color:var(--text-muted);">' + (p.type === "Human" ? "Člověk" : "PC") + '</span>' +
            '    <button type="button" class="btn-close-tooltip" onclick="event.stopPropagation(); PRS_App.hidePlayerTooltip();" style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); color:#fff; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; font-weight:bold; padding:0; line-height:1;" title="Zavřít">✕</button>' +
            '  </div>' +
            '</div>' +
            '<div style="display:flex; justify-content:space-between; margin-bottom:0.45rem;">' +
            '  <span style="color:#f472b6; font-weight:700; font-size:0.92rem;">💖 ' + p.totalHearts + ' / ' + target + ' Srdcí</span>' +
            '  <span style="color:#facc15; font-weight:700; font-size:0.92rem;">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</span>' +
            '</div>' +
            '<div style="font-size:0.78rem; color:#bae6fd; margin-bottom:0.45rem;">' +
            '  📍 Pozice: <strong>' + (currNode ? this.escapeHtml(currNode.name) : "-") + '</strong>' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem; font-size:0.8rem; background:rgba(0,0,0,0.45); padding:0.45rem; border-radius:6px; margin-bottom:0.45rem;">' +
            '  <div>⚔️ Boj: <strong>' + st.combat + '</strong> <small style="color:var(--text-muted);">(' + p.skills.combat + '/5)</small></div>' +
            '  <div>🏇 Jízda: <strong>' + st.riding + '</strong> <small style="color:var(--text-muted);">(' + p.skills.riding + '/5)</small></div>' +
            '  <div>💃 Tanec: <strong>' + st.dance + '</strong> <small style="color:var(--text-muted);">(' + p.skills.dance + '/5)</small></div>' +
            '  <div>✨ Charisma: <strong>' + st.charisma + '</strong> <small style="color:var(--text-muted);">(' + p.skills.charisma + '/5)</small></div>' +
            '</div>' +
            '<div style="font-size:0.78rem; color:#e2e8f0; margin-bottom:0.3rem;">' +
            '  🏰 Panství &amp; Chovy: <strong>' + p.ownedNodes.length + '</strong> (Bonus chovu: +' + p.breedingHearts + ' 💖)' +
            '</div>' +
            '<div style="font-size:0.76rem; color:var(--text-muted); white-space:normal; line-height:1.35;">' +
            '  🎒 Aktivní výbava: ' + this.escapeHtml(eqText) +
            '</div>' +
            '<button type="button" class="btn-close-tooltip-full" onclick="event.stopPropagation(); PRS_App.hidePlayerTooltip();" style="width:100%; margin-top:0.6rem; padding:0.45rem 0.6rem; background:linear-gradient(135deg, rgba(212,175,55,0.22), rgba(0,0,0,0.5)); border:1px solid rgba(212,175,55,0.45); color:#fef08a; border-radius:7px; cursor:pointer; font-size:0.82rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:0.4rem;">✕ Zavřít detail rytíře</button>';

        tip.innerHTML = html;
        tip.style.display = "block";
        this.movePlayerTooltip(e);
    },

    movePlayerTooltip: function (e) {
        var tip = document.getElementById("player-hover-tooltip");
        if (!tip || tip.style.display === "none") return;
        var isMobile = (window.innerWidth <= 768) || (this.deviceProfile && this.deviceProfile.device === "mobile");
        if (isMobile) {
            tip.style.left = "50%";
            tip.style.top = "50%";
            tip.style.transform = "translate(-50%, -50%)";
            return;
        }
        tip.style.transform = "none";
        if (!e || typeof e.clientX !== "number") return;
        var x = e.clientX + 16;
        var y = e.clientY + 16;
        if (x + 310 > window.innerWidth) x = Math.max(10, e.clientX - 320);
        if (y + 240 > window.innerHeight) y = Math.max(10, e.clientY - 250);
        tip.style.left = x + "px";
        tip.style.top = y + "px";
    },

    hidePlayerTooltip: function () {
        this._activeTooltipPlayerIndex = null;
        var tip = document.getElementById("player-hover-tooltip");
        if (tip) tip.style.display = "none";
    },

    // --- PANEL AKTIVNÍHO HRÁČE A AKCÍ TAHU ---,

    renderActivePlayerPanel: function () {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var el = document.getElementById("active-player-sheet");

        if (!el || !this.state) return;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;

        var p = this.state.players[inspIdx];

        if (!p) p = this.state.players[this.state.currentPlayerIndex];

        var targetHearts = this.state.config.targetHearts;

        var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);

        var currNode = this.state.board.nodes[p.nodeId];

        var atMerchant = currNode && currNode.type === "MERCHANT";

        var isCurTurn = (inspIdx === this.state.currentPlayerIndex);

        var heartsPct = Math.min(100, Math.round((p.totalHearts / targetHearts) * 100));

        // 1. Přehledná 2x2 mřížka volby rytířů u stolu

        var selectorHtml = '<div class="knight-selector-grid">';

        for (var tIdx = 0; tIdx < this.state.players.length; tIdx++) {

            var plTab = this.state.players[tIdx];

            var isSel = (tIdx === inspIdx);

            var isTurnPl = (tIdx === this.state.currentPlayerIndex);

            var shortName = this.escapeHtml(plTab.name.replace(" (PC)", "").replace(" (Ty)", ""));

            var kGoldStr = (plTab.gold >= 1000) ? (Math.round(plTab.gold / 1000) + "k") : plTab.gold;

            selectorHtml += '<div class="ks-pill ' + (isSel ? 'active' : '') + ' ' + (isTurnPl ? 'turn-now' : '') + '" ' +

                'style="border-left: 3.5px solid ' + plTab.color + ';" ' +

                'onclick="PRS_App.selectPlayerToInspect(' + tIdx + ')" ' +

                'onmouseenter="PRS_App.showPlayerTooltip(event, ' + tIdx + ')" ' +

                'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                'title="' + this.escapeHtml(plTab.name) + ': ' + plTab.totalHearts + ' 💖 (' + plTab.gold.toLocaleString("cs-CZ") + ' zl.)">' +

                '<div class="ks-pill-top">' +

                '  <span class="ks-avatar" style="background:' + plTab.color + ';">' + plTab.badge + '</span>' +

                '  <span class="ks-name">' + shortName + '</span>' +

                (isTurnPl ? '<span class="ks-crown" title="Hráč na tahu">👑</span>' : '') +

                '</div>' +

                '<div class="ks-pill-bottom">' +

                '  <span class="ks-hearts">' + plTab.totalHearts + ' 💖</span>' +

                '  <span class="ks-gold">' + kGoldStr + ' zl.</span>' +

                '</div>' +

                '</div>';

        }

        selectorHtml += '</div>';

        // 2. Rytířské ctnosti: pomocník pro vykreslení teček (pipů)

        function renderPips(current, max) {

            var out = '';

            for (var pi = 0; pi < max; pi++) {

                if (pi < current) out += '<span class="virtue-pip filled">●</span>';

                else out += '<span class="virtue-pip empty">○</span>';

            }

            return out;

        }

        // 3. Výbava rytíře (Armory Rack)

        var itemsHtml = '';

        var eqItems = window.PRS_GameEngine.getEquippedItems(p);

        if (p.items.length === 0) {

            itemsHtml = '<div class="equipment-rack">' +

                '<div class="eq-slot-pill empty"><span class="eq-icon">🗡️</span> <span class="eq-name">Zbraň (volno)</span></div>' +

                '<div class="eq-slot-pill empty"><span class="eq-icon">🛡️</span> <span class="eq-name">Zbroj (volno)</span></div>' +

                '<div class="eq-slot-pill empty"><span class="eq-icon">💍</span> <span class="eq-name">Klenot (volno)</span></div>' +

                '<div class="eq-slot-pill empty"><span class="eq-icon">🏆</span> <span class="eq-name">Trofej (volno)</span></div>' +

                '</div>';

        } else {

            itemsHtml = '<div class="asset-list">';

            for (var i = 0; i < p.items.length; i++) {

                var it = p.items[i];

                if (!it.uid) {

                    it.uid = (it.id || "item") + "_" + (i + 1) + "_" + Math.random().toString(36).substring(2, 7);

                }

                var isEq = (it.isEquipped === true || (it.isEquipped !== false && eqItems[it.slot] === it));

                var isTrophy = (it.slot === "trophy");

                var slotLabel = this.formatSlotLabel(it.slot, true);

                var sellRatio = atMerchant ? this.state.config.sellRates.merchantItem : this.state.config.sellRates.anywhereItem;

                var sellVal = Math.round(it.price * sellRatio);

                itemsHtml += '<div class="asset-chip ' + (isEq ? 'chip-equipped' : 'chip-in-bag') + '">' +

                    '<span><small class="slot-badge ' + (isTrophy ? 'slot-badge-trophy' : '') + '">' + slotLabel + '</small> ' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong> <small>(⚔️' + it.boj + ' 🏇' + it.jizda + ' 💃' + it.tanec + ' ✨' + it.charisma + ')</small></span>' +

                    '<div style="display:flex;align-items:center;">' +

                    '  <button class="btn-equip-toggle ' + (isEq ? 'equipped' : 'in-bag') + '" onclick="PRS_App.handleToggleEquip(\'' + it.uid + '\', ' + i + ', ' + inspIdx + ')" title="' + (isEq ? 'Uložit do batohu' : 'Nasadit do aktivní výstroje') + '">' + (isEq ? '⚔️ Nasazeno' : '🎒 V batohu') + '</button>' +

                    '  <button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'item\', \'' + it.uid + '\', ' + i + ', ' + inspIdx + ')">Prodat +' + sellVal + ' zl.</button>' +

                    '</div>' +

                    '</div>';

            }

            itemsHtml += '</div>';

        }

        // 4. Panství a chovy zvířat
        var horseCount = (st && typeof st.horses === "number") ? st.horses : 0;
        var dogCount = (st && typeof st.dogs === "number") ? st.dogs : 0;
        var falconCount = (st && typeof st.falcons === "number") ? st.falcons : 0;
        var villageCount = (st && typeof st.ownedVillages === "number") ? st.ownedVillages : 0;
        var townCount = (st && typeof st.ownedTowns === "number") ? st.ownedTowns : 0;
        var castleCount = (st && typeof st.ownedCastles === "number") ? st.ownedCastles : 0;
        var craftCount = (st && typeof st.ownedBuildings === "number") ? (st.ownedBuildings + (st.ownedJesters || 0)) : 0;

        var nodesHtml = '';

        if (p.ownedNodes.length > 0) {

            nodesHtml = '<div class="asset-list">';

            for (var j = 0; j < p.ownedNodes.length; j++) {

                var nd = this.state.board.nodes[p.ownedNodes[j]];

                if (!nd) continue;

                if (nd.type === "ANIMAL") {

                    if (nd.subtype === "horse") horseCount++;

                    else if (nd.subtype === "dog") dogCount++;

                    else falconCount++;

                } else if (nd.type === "VILLAGE") {

                    villageCount++;

                } else if (nd.type === "TOWN") {

                    townCount++;

                } else if (nd.type === "CASTLE") {

                    castleCount++;

                } else if (nd.type === "BUILDING" || nd.type === "JESTER") {

                    craftCount++;

                }

                var inv = window.PRS_GameEngine.getNodeInvestedValue(this.state, nd);

                var bRatio = atMerchant ? this.state.config.sellRates.merchantBuilding : this.state.config.sellRates.anywhereBuilding;

                var bSellVal = Math.round(inv * bRatio);

                var rentVal = window.PRS_GameEngine.calculateNodeRent(this.state, nd, p, 4);

                var upgBtn = "";

                if (nd.type === "VILLAGE" && nd.villageLevel < 3 && isCurTurn) {

                    var uCost = this.state.config.estates.villagePrices[nd.villageLevel] || 1500;

                    upgBtn = '<button class="btn-upg-mini" onclick="PRS_App.handleUpgradeVillage(' + nd.id + ')">★ Povýšit (' + uCost + ' zl.)</button>';

                }

                nodesHtml += '<div class="asset-chip">' +

                    '<div>' +
                    '  <div>' + nd.icon + ' <strong>' + this.escapeHtml(nd.name) + '</strong>' + (nd.type === "VILLAGE" ? ' (Úr. ' + nd.villageLevel + '/3)' : '') + '</div>' +
                    '  <div style="font-size:0.68rem; color:#86efac;">Mýtné: ' + rentVal.toLocaleString("cs-CZ") + ' zl.</div>' +
                    '</div>' +

                    '<div style="display:flex; gap:4px; align-items:center;">' + upgBtn + '<button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'node\', ' + nd.id + ', null, ' + inspIdx + ')">Prodat +' + bSellVal + ' zl.</button></div>' +

                    '</div>';

            }

            nodesHtml += '</div>';

        } else {

            nodesHtml = '<div class="fiefs-empty-hint">🏰 Rytíř zatím nevlastní panství ani stáje. Kupuj pole po království!</div>';

        }

        // 5. Sestavení odlehčeného, kompaktního profilu rytíře na tahu

        var curTab = this.activePlayerTab || "none";

        var tabContentHtml = "";

        if (curTab === "items") {

            tabContentHtml = '<div style="margin-top:0.45rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.2);">' +

                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">🎒 Rytířská výbava:</div>' +

                itemsHtml +

                '</div>';

        } else if (curTab === "fiefs") {

            tabContentHtml = '<div style="margin-top:0.45rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.2);">' +

                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem; display:flex; justify-content:space-between; align-items:center;">' +
                '  <span>🏰 Panství a chovy (' + p.ownedNodes.length + ' polí):</span>' +
                '  <small style="color:#fde047; font-size:0.7rem;">🌾 Chov: 🐄' + (st.cattle || 0) + ' 🐑' + (st.sheep || 0) + ' 🐖' + (st.pigs || 0) + '</small>' +
                '</div>' +

                '<div class="fiefs-summary-pills" style="margin-bottom:0.4rem; flex-wrap:wrap;">' +

                '  <span class="fief-pill ' + (horseCount > 0 ? 'active' : '') + '" title="Koně: ' + horseCount + '">🐎 ' + horseCount + '</span>' +

                '  <span class="fief-pill ' + (dogCount > 0 ? 'active' : '') + '" title="Lovečtí psi: ' + dogCount + '">🐕 ' + dogCount + '</span>' +

                '  <span class="fief-pill ' + (falconCount > 0 ? 'active' : '') + '" title="Sokoli: ' + falconCount + '">🦅 ' + falconCount + '</span>' +

                '  <span class="fief-pill ' + (villageCount > 0 ? 'active' : '') + '" title="Vesnice: ' + villageCount + '">🏡 ' + villageCount + '</span>' +

                '  <span class="fief-pill ' + (townCount > 0 ? 'active' : '') + '" title="Města: ' + townCount + '">🏛️ ' + townCount + '</span>' +

                '  <span class="fief-pill ' + (castleCount > 0 ? 'active' : '') + '" title="Hrady: ' + castleCount + '">🏰 ' + castleCount + '</span>' +

                '  <span class="fief-pill ' + (craftCount > 0 ? 'active' : '') + '" title="Řemeslné živnosti a kejklíři: ' + craftCount + '">⚒️ ' + craftCount + '</span>' +

                '</div>' +

                nodesHtml +

                '</div>';

        }

        // Taktické svitky v brašně rytíře
        var invHtml = '';
        var invList = p.inventory || [];
        if (invList.length > 0) {
            invHtml = '<div style="margin-top:0.4rem; padding:0.35rem 0.5rem; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:6px; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">' +
                '  ' + '<span style="font-size:0.75rem; color:var(--gold-light); font-weight:700;">' + (isEn ? "🎒 Pouch (" : "🎒 Brašna (") + invList.length + '/3):</span>' + '';
            for (var scI = 0; scI < invList.length; scI++) {
                var sc = invList[scI];
                var canUse = (inspIdx === this.state.currentPlayerIndex && p.type === "Human" && this.state.phase !== "GAME_OVER");
                invHtml += '  <button type="button" class="btn-secondary" style="padding:0.2rem 0.45rem; font-size:0.75rem; border-color:var(--gold); color:#fef08a; display:inline-flex; align-items:center; gap:0.25rem;' + (canUse ? ' cursor:pointer;' : ' opacity:0.8;') + '" ' +
                    (canUse ? 'onclick="PRS_App.handleUseInventoryScroll(' + scI + ')"' : '') + ' title="' + this.escapeHtml(sc.text) + '">' +
                    sc.icon + ' ' + this.escapeHtml(sc.title) + (canUse ? ' <span style="color:#4ade80; font-weight:bold;">▶</span>' : '') +
                    '</button>';
            }
            invHtml += '</div>';
        } else {
            invHtml = '<div style="margin-top:0.4rem; padding:0.3rem 0.5rem; background:rgba(212,175,55,0.05); border:1px dashed rgba(212,175,55,0.22); border-radius:6px; display:flex; align-items:center; justify-content:space-between;">' +
                '  ' + '<span style="font-size:0.75rem; color:var(--gold-light);">' + (isEn ? "🎒 <strong>Scroll Pouch:</strong> 0 / 3 (empty)" : "🎒 <strong>Brašna pergamenů:</strong> 0 / 3 (volno)") + '</span>' + '' +
                '  ' + '<span style="font-size:0.68rem; color:#94a3b8; font-style:italic;">' + (isEn ? "obtain on Chance tile" : "získej na poli Náhody") + '</span>' + '' +
                '</div>';
        }

        // Aktivní svitky v platnosti
        var actBuffs = [];
        if (p.activeScrolls) {
            if (p.activeScrolls.bonusRoll) actBuffs.push('⚡ +' + p.activeScrolls.bonusRoll + ' k hodu');
            if (p.activeScrolls.forcedRoll) actBuffs.push('⭐ Zaručená ' + p.activeScrolls.forcedRoll);
            if (p.activeScrolls.combatBonus) actBuffs.push('🧪 +' + p.activeScrolls.combatBonus + ' Boj');
            if (p.activeScrolls.rentImmunity) actBuffs.push('👑 Ochrana nájmu');
            if (p.activeScrolls.doubleBreeding) actBuffs.push('🐑 2x Chov');
        }
        if (actBuffs.length > 0) {
            invHtml += '<div style="margin-top:0.3rem; font-size:0.73rem; color:#86efac; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:4px; padding:0.2rem 0.45rem;">' +
                '' + (isEn ? "✨ Active effect: <strong>" : "✨ Aktivní účinek: <strong>") + '' + actBuffs.join(', ') + '</strong>' +
                '</div>';
        }

        el.innerHTML = '<div class="compact-knight-card" style="border-left: 4px solid ' + p.color + ';">' +

            '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">' +

            '    <div style="display:flex; align-items:center; gap:0.45rem;">' +

            '      ' + this.getPlayerPawnAvatarHtml(p, 32) + 

            '      <strong style="color:var(--text-main); font-size:0.92rem;' + (p.isEliminated ? ' text-decoration:line-through; opacity:0.6;' : '') + '">' + this.escapeHtml(p.name) + '</strong>' +

            (p.isEliminated ? '' + '<span style="font-size:0.68rem; padding:1px 5px; background:#dc2626; color:#fff; border-radius:4px; font-weight:bold;">' + (isEn ? "💀 Bankrupt" : "💀 Bankrot") + '</span>' + '' : (isCurTurn ? '' + '<span class="tag-on-turn" style="font-size:0.68rem; padding:1px 5px;">' + (isEn ? "👑 On Turn" : "👑 Na tahu") + '</span>' + '' : '')) +

            '    </div>' +

            '    <div style="text-align:right;">' +

            '      <div style="font-size:0.88rem; font-weight:bold; color:var(--gold-light);">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</div>' +

            '      <div style="font-size:0.8rem; font-weight:bold; color:#f472b6;">💖 ' + p.totalHearts + ' / ' + targetHearts + '</div>' +

            '    </div>' +

            '  </div>' +

            '  <!-- 4 ctnosti v jednom kompaktním horizontálním řádku -->' +

            '  <div class="compact-virtues-row">' +

            '    <span class="cv-item" title="Boj: ' + st.combat + ' (výcvik ' + p.skills.combat + '/5) – síla v arénách, lov draků a Turnaje">⚔️ <strong>' + st.combat + '</strong></span>' +

            '    <span class="cv-item" title="Jízda: ' + st.riding + ' (výcvik ' + p.skills.riding + '/5) – rychlost pohybu, slevy nájmů a Závody">🏇 <strong>' + st.riding + '</strong></span>' +

            '    <span class="cv-item" title="Tanec: ' + st.dance + ' (výcvik ' + p.skills.dance + '/5) – audience u krále (+💖), Zámecké plesy a dary">💃 <strong>' + st.dance + '</strong></span>' +

            '    <span class="cv-item" title="Charisma: ' + st.charisma + ' (výcvik ' + p.skills.charisma + '/5) – násobí zisk srdcí ze slavností a audiencí">✨ <strong>' + st.charisma + '</strong></span>' +

            '  </div>' +

            '  <!-- Rychlé záložky pro zobrazení batohu a panství -->' +

            '  <div style="display:flex; gap:0.4rem; margin-top:0.4rem;">' +

            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "items" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;items&quot;)">' +

            '      ' + (isEn ? "🎒 Gear (" : "🎒 Výbava (") + p.items.length + ")" + '' + (curTab === "items" ? ' ▲' : ' ▼') +

            '    </button>' +

            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "fiefs" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;fiefs&quot;)">' +

            '      ' + (isEn ? "🏰 Estates (" : "🏰 Panství (") + p.ownedNodes.length + ")" + '' + (curTab === "fiefs" ? ' ▲' : ' ▼') +

            '    </button>' +

            '  </div>' +

            invHtml +

            tabContentHtml +

            '</div>';

    },

    isAdvisorCollapsed: function () {
        try {
            return localStorage.getItem("prs_advisor_collapsed") === "true";
        } catch (e) {
            return false;
        }
    },

    toggleRoyalAdvisorCollapse: function () {
        var cur = this.isAdvisorCollapsed();
        try {
            localStorage.setItem("prs_advisor_collapsed", cur ? "false" : "true");
        } catch (e) { }
        this.renderActionPanel();
    },

    getAdvisorTileEvaluation: function (node, player) {
        if (!node || !player || !this.state) return "";
        var cfg = this.state.config || {};
        var scen = cfg.scenario || "classic";
        var price = (window.PRS_GameEngine && window.PRS_GameEngine.getNodePrice) ? window.PRS_GameEngine.getNodePrice(this.state, node) : (node.price || 600);
        if (node.type === "ANIMAL") {
            var owned = 0;
            for (var i = 0; i < player.ownedNodes.length; i++) {
                var oN = this.state.board.nodes[player.ownedNodes[i]];
                if (oN && oN.type === "ANIMAL" && oN.setId === node.setId) owned++;
            }
            if (node.owner === player.index) return "Tvé vlastní zvíře (sada č. " + node.setId + ").";
            if (node.owner !== null && node.owner !== undefined) return "Patří soupeři. Stoupnutí tě bude stát nájemné.";
            if (owned === 2) return "Klíčové pole! Koupí završíš sadu č. " + node.setId + " na 3/3 (korunka 👑 + 1.5 💖).";
            if (owned === 1) return "Koupí získáš pár (2/3 v sadě č. " + node.setId + ").";
            return "Volné zvíře do chovu (cena " + price.toLocaleString("cs-CZ") + " zl.).";
        }
        if (node.type === "TOWN") {
            if (node.owner === player.index) return "Tvé město s daňovým výnosem 1 200 zl.";
            if (node.owner !== null) return "Město soupeře. Přináší mu daně z každého výběru.";
            return (scen === "tycoon" ? "Cíl scénáře Magnát! " : "") + "Volné město za " + price.toLocaleString("cs-CZ") + " zl. (+1 200 zl. daň).";
        }
        if (node.type === "CASTLE") {
            if (node.owner === player.index) return "Tvůj hrad (+2 500 zl. daň a +1 Charisma).";
            if (node.owner !== null) return "Hrad soupeře. Pozor na vysoký nájem.";
            return (scen === "tycoon" ? "Cíl scénáře Magnát! " : "") + "Volný hrad za " + price.toLocaleString("cs-CZ") + " zl. (+2 500 zl. daň a +1 Charisma).";
        }
        if (node.type === "VILLAGE") {
            if (node.owner === player.index) return "Tvá vesnice úrovně " + (node.villageLevel || 1) + "★. Lze ji povýšit.";
            if (node.owner !== null) return "Vesnice soupeře.";
            return "Volná vesnice za " + price.toLocaleString("cs-CZ") + " zl. Stabilní zdroj daní.";
        }
        if (node.type === "QUEST") {
            if (node.subtype === "U3") return (scen === "slayer" ? "Cíl scénáře Lovci draků! " : "") + "Nebezpečná Dračí sluj s královským pokladem.";
            if (node.subtype === "U2") return "Doupě monstra. Vyžaduje solidní bojovou výbavu.";
            return "Lesní zvěř. Vhodný cíl pro lehký lov se psy či sokoly.";
        }
        if (node.type === "MASTER") {
            var skLabel = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(node.skill, true) : "Ctnost";
            return "Mistr ctnosti (" + skLabel + "). Zvyšuje úroveň vlastnosti.";
        }
        if (node.type === "FESTIVAL") {
            return "Královské slavnosti. Skvělé místo pro zisk Princezniných srdcí 💖.";
        }
        return "";
    },

    getRoyalAdvisorAdvice: function (player, phase, pa, currNode) {
        if (!this.state || !player) return null;
        var cfg = this.state.config || {};
        var scen = cfg.scenario || "classic";
        var effStats = window.PRS_GameEngine.getEffectiveStats ? window.PRS_GameEngine.getEffectiveStats(this.state, player) : player.skills;

        // 1. ZVLÁŠTNÍ PŘÍPAD: DLUH A LIKVIDACE
        if (pa && pa.debt && pa.debt > 0) {
            var debtAmt = (typeof pa.debt === "number" && !isNaN(pa.debt)) ? pa.debt : 0;
            return {
                icon: "⚠️",
                title: "Královský rádce",
                badge: "Hrozba dluhu",
                badgeClass: "advisor-warn",
                text: "Dlužíš věřitelům **" + debtAmt.toLocaleString("cs-CZ") + " zl.**! Královská rada ti doporučuje nejprve prodat **samostatná zvířata bez sady**, a chránit svá **města, hrady a kompletní 3/3 chovy**, které ti zajišťují stálý zlaťákový i prestižní příjem.",
                actionPrompt: "Vyber majetek k prodeji za 50–75 % ceny níže."
            };
        }

        // 2. ŠATLAVA A ŠPITÁL
        if (pa && pa.isImprisoned) {
            var canBail = player.gold >= (cfg.prisonBail || 1000);
            return {
                icon: "⛓️",
                title: "Královský rádce",
                badge: "Šatlava",
                badgeClass: "advisor-warn",
                text: canBail
                    ? "Jsi ve vězení! Máš dostatek zlaťáků na složení kauce (**" + (cfg.prisonBail || 1000) + " zl.**). Doporučuji kauci zaplatit hned, ať neztrácíš cenné tahy!"
                    : "Jsi uvězněn a chybí ti zlato na kauci. Zkus štěstí hodem na útěk (hod 5–6 ti vrátí svobodu), nebo vyčkej 2 kola.",
                actionPrompt: canBail ? "Zvol 'Složit kauci a odejít'." : "Zvol 'Pokusit se o útěk'."
            };
        }

        // 3. FÁZE ROLL (Před hodem kostkou)
        if (phase === "ROLL") {
            var curMode = this.selectedMovementMode || "standard";
            var diceRange = (curMode === "cautious") ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6];

            var threats = [];
            var opportunities = [];
            var hasMissingAnimalInReach = false;

            for (var d = 0; d < diceRange.length; d++) {
                var rollVal = diceRange[d];
                var tNode = (window.PRS_GameEngine && window.PRS_GameEngine.getTargetNodeForRoll)
                    ? window.PRS_GameEngine.getTargetNodeForRoll(this.state, player, rollVal)
                    : null;
                if (!tNode) continue;

                // Nebezpečí: cizí majetek s vysokým nájmem
                if (tNode.owner !== null && tNode.owner !== undefined && tNode.owner !== player.index) {
                    var rentCost = 0;
                    if (tNode.type === "ANIMAL") {
                        rentCost = window.PRS_GameEngine.calculateAnimalRent ? window.PRS_GameEngine.calculateAnimalRent(this.state, tNode, this.state.players[tNode.owner]) : Math.round(tNode.price * 0.2);
                    } else if (tNode.type === "VILLAGE") {
                        var vRentRates = (cfg.estates && cfg.estates.villageRent) || [300, 600, 1000];
                        rentCost = vRentRates[(tNode.villageLevel || 1) - 1] || 300;
                    } else if (tNode.type === "TOWN") {
                        rentCost = (cfg.estates && cfg.estates.townRent) || 800;
                    } else if (tNode.type === "CASTLE") {
                        rentCost = (cfg.estates && cfg.estates.castleRent) || 1500;
                    }
                    if (rentCost >= 600 || rentCost >= player.gold * 0.3) {
                        threats.push({ node: tNode, roll: rollVal, rent: rentCost });
                    }
                } else if (tNode.type === "PRISON") {
                    threats.push({ node: tNode, roll: rollVal, isPrison: true });
                }

                // Příležitosti: volné zvíře do stávající sady
                if (tNode.type === "ANIMAL" && (tNode.owner === null || tNode.owner === undefined)) {
                    var sCount = 0;
                    for (var on = 0; on < player.ownedNodes.length; on++) {
                        var oN = this.state.board.nodes[player.ownedNodes[on]];
                        if (oN && oN.type === "ANIMAL" && oN.setId === tNode.setId) sCount++;
                    }
                    var tPrice = (window.PRS_GameEngine && window.PRS_GameEngine.getNodePrice) ? window.PRS_GameEngine.getNodePrice(this.state, tNode) : (tNode.price || 500);
                    if (sCount === 2) {
                        opportunities.push({ node: tNode, roll: rollVal, isTrioCompleter: true });
                        hasMissingAnimalInReach = true;
                    } else if (sCount === 1) {
                        opportunities.push({ node: tNode, roll: rollVal, isPair: true });
                    } else if (player.gold >= tPrice) {
                        opportunities.push({ node: tNode, roll: rollVal, isBuyable: true });
                    }
                } else if ((tNode.type === "TOWN" || tNode.type === "CASTLE") && (tNode.owner === null || tNode.owner === undefined)) {
                    opportunities.push({ node: tNode, roll: rollVal, isEstate: true });
                } else if (tNode.type === "FESTIVAL") {
                    opportunities.push({ node: tNode, roll: rollVal, isFestival: true });
                } else if (tNode.type === "QUEST" && tNode.subtype === "U3" && scen === "slayer") {
                    opportunities.push({ node: tNode, roll: rollVal, isDragonSlayer: true });
                }
            }

            if (hasMissingAnimalInReach) {
                var opp = opportunities.find(function (o) { return o.isTrioCompleter; });
                return {
                    icon: "👑",
                    title: "Královský rádce",
                    badge: "Šlechtický chov",
                    badgeClass: "advisor-good",
                    text: "Při hodu **" + opp.roll + "** máš na dosah volné zvíře **" + this.escapeHtml(opp.node.name) + "**, které zkompletuje tvou chovnou sadu na **3/3** a zajistí ti korunu 👑 a **+1.5 💖**!" + (curMode !== "cautious" && opp.roll <= 4 ? " Zvaž přepnutí na **Opatrný krok 🚶 (1–4)** pro vyšší šanci na přesný hod." : ""),
                    actionPrompt: "Hoď kostkou a usiluj o číslo " + opp.roll + "!"
                };
            }

            if (threats.length > 0 && curMode === "standard") {
                var th = threats[0];
                var isEnAdv = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
                var tAdvH = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
                var rentStr = th.rent.toLocaleString(isEnAdv ? "en-US" : "cs-CZ") + " " + (isEnAdv ? "g." : "zl.");
                var dangerDesc = th.isPrison ? tAdvH("advisor.hazard_danger_prison", null, "šatlava") : tAdvH("advisor.hazard_danger_rent", { rent: rentStr }, "cizí panství s nájmem **" + rentStr + "**");
                return {
                    icon: "🛡️",
                    title: tAdvH("advisor.title", null, "Královský rádce"),
                    badge: tAdvH("advisor.badge_hazard", null, "Pozor na trasu"),
                    badgeClass: "advisor-warn",
                    text: tAdvH("advisor.hazard_text", { roll: th.roll, danger: dangerDesc }, "Na hodu **" + th.roll + "** číhá " + dangerDesc + ". Pokud se chceš tomuto poli vyhnout, můžeš zvolit **Opatrný krok 🚶 (1–4)** nebo použít svitek z brašny."),
                    actionPrompt: tAdvH("advisor.hazard_prompt", null, "Zvaž režim pohybu a hoď kostkou.")
                };
            }

            var isEnAdv = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (opportunities.length > 0) {
                var op = opportunities[0];
                var opDesc = isEnAdv
                    ? (op.isEstate ? ("free estate **" + this.escapeHtml(op.node.name) + "**") : (op.isFestival ? "royal Festivities 💖" : ("tile **" + this.escapeHtml(op.node.name) + "**")))
                    : (op.isEstate ? ("volné sídlo **" + this.escapeHtml(op.node.name) + "**") : (op.isFestival ? "královské Slavnosti 💖" : ("pole **" + this.escapeHtml(op.node.name) + "**")));
                return {
                    icon: "💡",
                    title: isEnAdv ? "Royal Advisor" : "Královský rádce",
                    badge: isEnAdv ? "Tactical Reach" : "Taktický dosah",
                    badgeClass: "advisor-tip",
                    text: isEnAdv
                        ? ("Ahead of you on roll **" + op.roll + "** lies " + opDesc + ". The path is clear and favorable for your next move.")
                        : ("Před tebou na hodu **" + op.roll + "** leží " + opDesc + ". Cesta je volná a příznivá pro tvůj další postup."),
                    actionPrompt: isEnAdv ? "Roll the dice and set forth on the road." : "Hoď kostkou a vykroč na cestu."
                };
            }

            if (scen === "slayer") {
                return {
                    icon: "🐉",
                    title: isEnAdv ? "Royal Advisor" : "Královský rádce",
                    badge: isEnAdv ? "Dragon Slayers Scenario" : "Scénář Lovci draků",
                    badgeClass: "advisor-tip",
                    text: isEnAdv
                        ? "In the Dragon Slayers scenario, your objective is to slay 2 realm dragons in Dragon Lairs (U3). Watch crossroads and steer towards Dragon Path!"
                        : "Ve scénáři Lovci draků je tvým cílem skolit 2 draky království v Dračích slujích (U3). Sleduj rozcestí a směřuj na Dračí stezku!",
                    actionPrompt: isEnAdv ? "Tap the dice to roll." : "Klepni na kostku pro hod."
                };
            }
            if (scen === "tycoon") {
                return {
                    icon: "🏰",
                    title: isEnAdv ? "Royal Advisor" : "Královský rádce",
                    badge: isEnAdv ? "Feudal Tycoon Scenario" : "Scénář Feudální magnát",
                    badgeClass: "advisor-tip",
                    text: isEnAdv
                        ? "To claim victory, you need to control 3 towns and 1 castle. Save your gold for their purchase and don't let rivals snatch them!"
                        : "K vítězství potřebuješ ovládnout 3 města a 1 hrad. Šetři si zlaťáky na jejich nákup a nenech si je vyfouknout soupeři!",
                    actionPrompt: isEnAdv ? "Tap the dice to roll." : "Klepni na kostku pro hod."
                };
            }

            var pGoldStrAdv = player.gold.toLocaleString(isEnAdv ? "en-US" : "cs-CZ") + " " + (isEnAdv ? "g." : "zl.");
            return {
                icon: "🧙‍♂️",
                title: isEnAdv ? "Royal Advisor" : "Královský rádce",
                badge: isEnAdv ? "Royal March" : "Královský pochod",
                badgeClass: "advisor-tip",
                text: isEnAdv
                    ? ("You have **" + pGoldStrAdv + "** and **" + player.totalHearts + " 💖**. The path ahead is clear; choose your pace and set forth into adventure.")
                    : ("Máš k dispozici **" + pGoldStrAdv + "** a **" + player.totalHearts + " 💖**. Cesta před tebou je přehledná, zvol tempo pochodu a vyraz vstříc dobrodružství."),
                actionPrompt: isEnAdv ? "Tap the dice to roll." : "Klepni na kostku pro hod."
            };
        }

        // 4. FÁZE BRANCH_CHOICE
        if (phase === "BRANCH_CHOICE") {
            var isEnAdvBranch = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            return {
                icon: "🔀",
                title: isEnAdvBranch ? "Royal Advisor" : "Královský rádce",
                badge: isEnAdvBranch ? "Crossroads Choice" : "Volba rozcestí",
                badgeClass: "advisor-tip",
                text: isEnAdvBranch
                    ? "You stand before a pivotal crossroads. The **Inner Royal Path** offers festivals, tournaments, and high rewards, while the **Outer Ring** provides steady farming and animal breeding."
                    : "Stojíš před klíčovým rozcestím. **Vnitřní královská stezka** nabízí slavnosti, turnaje a vysoké odměny, zatímco **Vnější okruh** poskytuje stabilní hospodářství a chov zvířat.",
                actionPrompt: isEnAdvBranch ? "Choose one of the two routes above." : "Zvol si jednu ze dvou tras výše."
            };
        }

        // 5. FÁZE ACTION (Po hodu na poli)
        if (currNode) {
            var isEnAdvAct = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (pa && pa.canBuyNode) {
                var bPrice = (typeof pa.buyPrice === "number" && !isNaN(pa.buyPrice)) ? pa.buyPrice : ((currNode && typeof currNode.price === "number") ? currNode.price : 1000);
                var pGold = (player && typeof player.gold === "number") ? player.gold : 0;
                var canAfford = pGold >= bPrice;
                var rem = pGold - bPrice;
                var bPriceStr = bPrice.toLocaleString(isEnAdvAct ? "en-US" : "cs-CZ") + " " + (isEnAdvAct ? "g." : "zl.");
                var pGoldCurStr = pGold.toLocaleString(isEnAdvAct ? "en-US" : "cs-CZ") + " " + (isEnAdvAct ? "g." : "zl.");
                var remStr = rem.toLocaleString(isEnAdvAct ? "en-US" : "cs-CZ") + " " + (isEnAdvAct ? "g." : "zl.");

                if (!canAfford) {
                    return {
                        icon: "🪙",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? "Not Enough Gold" : "Nedostatek zlata",
                        badgeClass: "advisor-warn",
                        text: isEnAdvAct
                            ? ("Tile **" + this.escapeHtml(currNode.name) + "** costs **" + bPriceStr + "**, but your pouch holds only " + pGoldCurStr + ". You cannot buy this tile now; proceed by ending your turn.")
                            : ("Pole **" + this.escapeHtml(currNode.name) + "** stojí **" + bPriceStr + "**, ale v měšci máš jen " + pGoldCurStr + ". Nyní pole koupit nemůžeš, pokračuj ukončením tahu."),
                        actionPrompt: isEnAdvAct ? "Tap 'End Turn'." : "Klepni na 'Ukončit tah'."
                    };
                }

                if (currNode.type === "ANIMAL") {
                    var sId = currNode.setId;
                    var ownedInSet = 0;
                    for (var oi = 0; oi < player.ownedNodes.length; oi++) {
                        var aN = this.state.board.nodes[player.ownedNodes[oi]];
                        if (aN && aN.type === "ANIMAL" && aN.setId === sId) ownedInSet++;
                    }

                    if (ownedInSet === 2) {
                        return {
                            icon: "👑",
                            title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                            badge: isEnAdvAct ? "Completion 3/3!" : "Kompletace 3/3!",
                            badgeClass: "advisor-good",
                            text: isEnAdvAct
                                ? ("⭐ **Highly recommend buying!** This animal will complete breeding set #" + sId + " to **3/3**. You will earn a golden crown 👑, **+1.5 💖** bonus, and rivals will pay you **triple rent (80%)**!")
                                : ("⭐ **Jednoznačně doporučuji koupit!** Tímto zvířetem zkompletuješ celou chovnou sadu č. " + sId + " na **3/3**. Získáš zlatou korunu 👑, prémii **+1.5 💖** a soupeři ti budou platit **trojnásobné nájemné (80 %)**!"),
                            actionPrompt: isEnAdvAct ? "Tap the green 'Buy this tile' button." : "Klepni na zelené tlačítko 'Koupit toto pole'."
                        };
                    } else if (ownedInSet === 1) {
                        return {
                            icon: "🐎",
                            title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                            badge: isEnAdvAct ? "Pair Acquired" : "Zisk páru do sady",
                            badgeClass: "advisor-good",
                            text: isEnAdvAct
                                ? ("Buying gives you the **2nd animal of set #" + sId + "**. Rent rises to 40% and only 1 piece remains for royal acclaim. Great investment!")
                                : ("Koupí získáš již **2. zvíře ze sady č. " + sId + "**. Nájemné stoupne na 40 % a zbývá ti už jen 1 kus do královského titulu. Skvělá investice!"),
                            actionPrompt: isEnAdvAct ? "Tap 'Buy this tile'." : "Klepni na 'Koupit toto pole'."
                        };
                    } else {
                        var subDesc = isEnAdvAct
                            ? (currNode.subtype === "horse" ? "Horse – needed for gallop and races" : (currNode.subtype === "pes" ? "Dog – bonus to monster hunts" : "Falcon – bonus to tournaments"))
                            : (currNode.subtype === "horse" ? "Kůň – nutný pro cval a závody" : (currNode.subtype === "pes" ? "Pes – bonus k lovu monster" : "Sokol – bonus k turnajům"));
                        return {
                            icon: "🐎",
                            title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                            badge: isEnAdvAct ? "Animal Purchase" : "Nákup zvířete",
                            badgeClass: "advisor-tip",
                            text: isEnAdvAct
                                ? ("Free breeding animal (" + subDesc + "). After purchase you retain a safe **" + remStr + "**.")
                                : ("Volné chovné zvíře (" + subDesc + "). Po nákupu ti zbyde bezpečných **" + remStr + "**."),
                            actionPrompt: isEnAdvAct ? "Tap 'Buy this tile'." : "Klepni na 'Koupit toto pole'."
                        };
                    }
                }

                if (currNode.type === "TOWN" || currNode.type === "CASTLE") {
                    return {
                        icon: "🏰",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? "Strategic Estate" : "Strategické panství",
                        badgeClass: "advisor-good",
                        text: isEnAdvAct
                            ? "Estates yield **passive tax revenue** upon every Tax Collector (TC) visit for all players. Moreover, a castle gives permanent **+1 Charisma**. Highly recommended to buy!"
                            : "Sídla přinášejí **pasivní daňový výnos** při každé návštěvě Výběrčího daní (VD) pro všechny hráče. Navíc hrad ti dává trvalé **+1 Charisma**. Doporučuji koupit!",
                        actionPrompt: isEnAdvAct ? "Tap 'Buy this tile'." : "Klepni na 'Koupit toto pole'."
                    };
                }

                if (currNode.type === "VILLAGE") {
                    return {
                        icon: "🏘️",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? "Village Development" : "Rozvoj vesnice",
                        badgeClass: "advisor-tip",
                        text: isEnAdvAct
                            ? ("A village is an affordable estate foundation (yield 500 g.). Later you can upgrade it up to 3★ (yield 1,400 g.). After purchase you will keep **" + remStr + "**.")
                            : ("Vesnice je levný základ panství (výnos 500 zl.). Později ji můžeš povýšit až na 3★ (výnos 1 400 zl.). Po koupi ti zbyde **" + remStr + "**."),
                        actionPrompt: isEnAdvAct ? "Tap 'Buy this tile'." : "Klepni na 'Koupit toto pole'."
                    };
                }
            }

            if (pa && pa.canUpgradeVillage) {
                return {
                    icon: "🏘️",
                    title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                    badge: isEnAdvAct ? "Estate Upgrade" : "Povýšení panství",
                    badgeClass: "advisor-good",
                    text: isEnAdvAct
                        ? "You stand on your village. Upgrading increases both tax yield and rent from rivals. The investment pays off on the next tax collection."
                        : "Stojíš na své vesnici. Povýšení na vyšší úroveň zvýší daňový výnos i nájemné od soupeřů. Investice se ti vrátí již při příštím výběru daní.",
                    actionPrompt: isEnAdvAct ? "Choose 'Upgrade Village' or end turn." : "Zvol 'Povýšit vesnici' nebo ukonči tah."
                };
            }

            if (pa && pa.canTrainMaster) {
                if (pa.isMasterDuel) {
                    return {
                        icon: "⚔️",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? "Knightly Duel!" : "Rytířský duel!",
                        badgeClass: "advisor-good",
                        text: isEnAdvAct
                            ? "The Virtue Master challenges you to a royal knightly tournament for **1.5 💖 Princess's Heart**! Dice roll + your virtue decides. Even on defeat, you earn an honorable heart for courage."
                            : "Mistr ctnosti tě vyzývá k slavnostnímu rytířskému turnaji o **1.5 💖 Srdce princezny**! Hod kostkou + tvoje ctnost rozhodne. I při prohře získáš čestné srdce za odvahu.",
                        actionPrompt: isEnAdvAct ? "Tap 'Challenge Master to Duel'!" : "Klepni na 'Vyzvat mistra na duel'!"
                    };
                }
                return {
                    icon: "🎓",
                    title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                    badge: isEnAdvAct ? "Virtue Training" : "Výcvik ctnosti",
                    badgeClass: "advisor-tip",
                    text: isEnAdvAct
                        ? "The Master accepted you as an apprentice! Increasing your attribute gives you lasting advantage in Festivals and combat quests. If you have enough gold, pay for the lesson."
                        : "Mistr tě přijal do učení! Zvýšení vlastnosti ti dá trvalou výhodu při Slavnostech a bojových výpravách. Pokud máš dostatek zlaťáků, zaplať si lekci.",
                    actionPrompt: isEnAdvAct ? "Tap virtue training button." : "Klepni na tlačítko výcviku ctnosti."
                };
            }

            if (pa && pa.canResolveQuest && pa.questCard) {
                var q = pa.questCard;
                var animalBonus = (q.questTier === "U1" && (effStats.dogs > 0 || effStats.falcons > 0)) ? 1 : ((q.questTier === "U3" && effStats.dogs > 0 && effStats.falcons > 0) ? 2 : (effStats.dogs > 0 || effStats.falcons > 0 ? 1 : 0));
                var horseBonus = (q.questTier !== "U1" && effStats.horses > 0) ? (1 + Math.floor(effStats.riding / 2)) : 0;
                var basePower = effStats.combat + animalBonus + horseBonus;
                var needed = Math.max(1, q.difficulty - basePower);
                var winRate = (needed > 6) ? 0 : Math.round(((7 - Math.max(1, needed)) / 6) * 100);

                if (winRate >= 65) {
                    return {
                        icon: "⚔️",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? ("Favorable Battle (" + winRate + "%)") : ("Příznivý boj (" + winRate + " %)"),
                        badgeClass: "advisor-good",
                        text: isEnAdvAct
                            ? ("Your combat power is high (**+" + basePower + "**). A roll of **" + needed + "+** is enough for victory (**" + winRate + "%** chance). Victory brings generous gold and hearts!")
                            : ("Tvoje bojová síla je vysoká (**+" + basePower + "**). K vítězství ti stačí hod **" + needed + "+** (šance **" + winRate + " %**). Výhra ti přinese štědré zlaťáky i srdce!"),
                        actionPrompt: isEnAdvAct ? "Tap 'Fight Enemy'." : "Klepni na 'Bojovat s nepřítelem'."
                    };
                } else if (winRate >= 35) {
                    return {
                        icon: "⚖️",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? ("Balanced Contest (" + winRate + "%)") : ("Vyrovnaný souboj (" + winRate + " %)"),
                        badgeClass: "advisor-tip",
                        text: isEnAdvAct
                            ? ("Chances are even (**" + winRate + "%**, you need roll **" + needed + "+**). If you have combat scrolls in pouch, activate them for higher certainty.")
                            : ("Šance je vyrovnaná (**" + winRate + " %**, potřebuješ hod **" + needed + "+**). Pokud máš v brašně bojový pergamen, aktivuj jej pro vyšší jistotu."),
                        actionPrompt: isEnAdvAct ? "Fight with valor or weigh the risks." : "Bojuj s odvahou nebo zvaž riziko."
                    };
                } else {
                    return {
                        icon: "⚠️",
                        title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                        badge: isEnAdvAct ? ("High Risk (" + winRate + "%)") : ("Vysoké riziko (" + winRate + " %)"),
                        badgeClass: "advisor-warn",
                        text: isEnAdvAct
                            ? ("This enemy exceeds your current strength (you need roll **" + needed + "**, only **" + winRate + "%** chance). Defeat will wound you and send you to the Infirmary. Recommend retreating.")
                            : ("Tento protivník je nad tvé současné síly (potřebuješ hod **" + needed + "**, šance jen **" + winRate + " %**). Porážka tě zraní a pošle do Špitálu. Doporučuji raději ustoupit."),
                        actionPrompt: isEnAdvAct ? "Consider whether to risk defeat." : "Zvaž, zda riskovat porážku."
                    };
                }
            }

            return {
                icon: "➡️",
                title: isEnAdvAct ? "Royal Advisor" : "Královský rádce",
                badge: isEnAdvAct ? "Turn Completed" : "Tah dokončen",
                badgeClass: "advisor-tip",
                text: isEnAdvAct ? "All matters on this tile are settled. Pass the dice to the next knight." : "Všechny záležitosti na tomto poli jsou vyřízeny. Předej hrací kostku dalšímu rytíři.",
                actionPrompt: isEnAdvAct ? "Tap 'End Turn' button." : "Klepni na tlačítko 'Ukončit tah'."
            };
        }

        return null;
    },

    getRoyalAdvisorHtml: function (player, phase, pa, currNode) {
        if (!player || player.type !== "Human") return "";
        var advice = this.getRoyalAdvisorAdvice(player, phase, pa, currNode);
        if (!advice) return "";

        var isCollapsed = this.isAdvisorCollapsed();

        var bClass = advice.badgeClass || "advisor-tip";
        var borderColor = (bClass === "advisor-warn") ? "rgba(239,68,68,0.5)" : (bClass === "advisor-good" ? "rgba(34,197,94,0.5)" : "rgba(212,175,55,0.45)");
        var bgGrad = (bClass === "advisor-warn")
            ? "linear-gradient(135deg, rgba(38,12,12,0.95), rgba(24,8,8,0.96))"
            : (bClass === "advisor-good"
                ? "linear-gradient(135deg, rgba(14,34,20,0.95), rgba(10,24,14,0.96))"
                : "linear-gradient(135deg, rgba(32,24,16,0.95), rgba(18,14,10,0.96))");

        var tAdv = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var advTitle = tAdv("advisor.title", null, advice.title || "Královský rádce");
        var advBtnTitle = isCollapsed ? tAdv("advisor.expand", null, "Rozbalit radu") : tAdv("advisor.collapse", null, "Sbalit radu");
        var advBtnText = isCollapsed ? tAdv("advisor.show", null, "▼ Zobrazit radu") : tAdv("advisor.hide", null, "▲ Skrýt");

        var html = '<div class="royal-advisor-hud-box" style="margin-top:0.65rem; border:1.2px solid ' + borderColor + '; background:' + bgGrad + '; border-radius:9px; padding:0.45rem 0.65rem; box-shadow:0 3px 10px rgba(0,0,0,0.45);">' +
            '  <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="PRS_App.toggleRoyalAdvisorCollapse()">' +
            '    <div style="display:flex; align-items:center; gap:0.4rem;">' +
            '      <span style="font-size:1.1rem;">' + advice.icon + '</span>' +
            '      <strong style="color:var(--gold-light); font-family:\'Cinzel\',serif; font-size:0.8rem; letter-spacing:0.3px;">' + this.escapeHtml(advTitle) + '</strong>' +
            '      <span class="royal-advisor-badge ' + bClass + '">' + this.escapeHtml(advice.badge) + '</span>' +
            '    </div>' +
            '    <button type="button" class="btn-advisor-toggle" style="background:none; border:none; color:var(--text-muted); font-size:0.7rem; cursor:pointer; padding:0 3px;" title="' + this.escapeHtml(advBtnTitle) + '">' + this.escapeHtml(advBtnText) + '</button>' +
            '  </div>';

        if (!isCollapsed) {
            html += '  <div class="royal-advisor-body" style="margin-top:0.35rem; font-size:0.77rem; line-height:1.4; color:#e2e8f0; border-top:1px dashed rgba(212,175,55,0.22); padding-top:0.35rem;">' +
                '    ' + this.formatGameText(advice.text) +
                (advice.actionPrompt ? ('    <div style="margin-top:0.35rem; font-weight:700; color:#fde047; font-size:0.75rem; display:flex; align-items:center; gap:0.3rem;">👉 ' + this.escapeHtml(advice.actionPrompt) + '</div>') : '') +
                '  </div>';
        }

        html += '</div>';
        return html;
    },

    // Rytířská brašna na pergameny a svitky (viditelná přímo v ovládání tahu)
    getKnightPouchHudHtml: function (player, isCurTurn, isFullInspector) {
        if (!player) return "";
        var invList = player.inventory || [];
        var actBuffs = [];
        if (player.activeScrolls) {
            if (player.activeScrolls.bonusRoll) actBuffs.push('⚡ +' + player.activeScrolls.bonusRoll + ' k hodu');
            if (player.activeScrolls.forcedRoll) actBuffs.push('⭐ Zaručená ' + player.activeScrolls.forcedRoll);
            if (player.activeScrolls.combatBonus) actBuffs.push('🧪 +' + player.activeScrolls.combatBonus + ' Boj');
            if (player.activeScrolls.rentImmunity) actBuffs.push('👑 Ochrana nájmu');
            if (player.activeScrolls.doubleBreeding) actBuffs.push('🐑 2x Chov');
        }

        var tPouch = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

        // Pokud jsme v rychlém panelu akcí tahu a brašna je prázdná:
        // Vykreslíme elegantní jednořádkový status proužek (nezabírá zbytečně výšku)
        if (!isFullInspector && invList.length === 0 && actBuffs.length === 0) {
            return '<div class="knight-pouch-strip empty" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.32); border:1px dashed rgba(212,175,55,0.3); border-radius:6px; padding:0.25rem 0.55rem; margin-top:0.55rem;">' +
                '  <div style="display:flex; align-items:center; gap:0.35rem;">' +
                '    <span style="font-size:0.95rem;">🎒</span>' +
                '    <strong style="color:var(--gold-light); font-size:0.76rem; font-family:\'Cinzel\',serif;">' + tPouch("pouch.knight_pouch", null, "Brašna rytíře:") + '</strong>' +
                '    <span style="font-size:0.72rem; color:#94a3b8;">' + tPouch("pouch.free_slots", { count: 0, max: 3 }, "0 / 3 svitků (volno)") + '</span>' +
                '  </div>' +
                '  <span style="font-size:0.68rem; color:#64748b; font-style:italic;">' + tPouch("pouch.empty_hint", null, "sloty na pole Náhody") + '</span>' +
                '</div>';
        }

        // Pokud brašna obsahuje svitky nebo aktivní účinky:
        var html = '<div class="knight-pouch-hud-card" style="margin-top:0.55rem; padding:0.4rem 0.6rem; background:linear-gradient(135deg, rgba(32,22,12,0.95), rgba(18,12,6,0.98)); border:1.5px solid var(--gold); border-radius:8px; box-shadow:0 3px 10px rgba(0,0,0,0.5);">' +
            '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; border-bottom:1px solid rgba(212,175,55,0.25); padding-bottom:0.2rem;">' +
            '    <div style="display:flex; align-items:center; gap:0.35rem;">' +
            '      <span style="font-size:0.95rem;">🎒</span>' +
            '      <strong style="color:var(--gold-light); font-size:0.78rem; font-family:\'Cinzel\',serif;">' + tPouch("pouch.title", null, "Brašna pergamenů") + '</strong>' +
            '    </div>' +
            '    <span style="font-size:0.72rem; color:' + (invList.length > 0 ? '#fde047' : '#94a3b8') + '; font-weight:800; background:rgba(0,0,0,0.4); padding:1px 6px; border-radius:4px; border:1px solid rgba(212,175,55,0.2);">' + tPouch("pouch.slots", { count: invList.length, max: 3 }, invList.length + ' / 3 slotů') + '</span>' +
            '  </div>';

        if (invList.length === 0) {
            html += '<div style="font-size:0.72rem; color:#a1a1aa; font-style:italic; padding:0.15rem 0.1rem; line-height:1.3;">' + tPouch("pouch.empty_desc", null, "Brašna je prázdná. Když stoupneš na pole Náhody a otočíš pergamen, můžeš si jej sem uložit k pozdějšímu taktickému zahrání.") + '</div>';
        } else {
            html += '<div style="display:flex; flex-direction:column; gap:0.3rem;">';
            for (var si = 0; si < invList.length; si++) {
                var sc = invList[si];
                var canUse = isCurTurn && (player.type === "Human") && (this.state && this.state.phase !== "GAME_OVER");
                var scTitle = sc.title || "";
                var scText = sc.text || "";
                if (sc.id && window.PRS_I18n) {
                    var tTitle = window.PRS_I18n.t("cards." + sc.id + ".title");
                    if (tTitle && tTitle !== ("cards." + sc.id + ".title")) scTitle = tTitle;
                    var tText = window.PRS_I18n.t("cards." + sc.id + ".text");
                    if (tText && tText !== ("cards." + sc.id + ".text")) scText = tText;
                }
                html += '<div style="display:flex; justify-content:space-between; align-items:center; gap:0.35rem; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:0.25rem 0.45rem;">' +
                    '  <div style="flex:1; min-width:0; overflow:hidden;">' +
                    '    <div style="font-size:0.76rem; font-weight:700; color:#fde68a; display:flex; align-items:center; gap:0.25rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">' +
                    '      <span>' + sc.icon + '</span>' +
                    '      <span style="color:#fff;">' + this.escapeHtml(scTitle) + '</span>' +
                    '    </div>' +
                    '    <div style="font-size:0.68rem; color:#cbd5e1; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" title="' + this.escapeHtml(scText) + '">' + this.escapeHtml(scText) + '</div>' +
                    '  </div>' +
                    (canUse
                        ? '  <button type="button" class="btn-primary" style="padding:0.2rem 0.55rem; font-size:0.72rem; background:linear-gradient(135deg, #10b981, #059669); border-color:#34d399; font-weight:bold; white-space:nowrap; cursor:pointer;" onclick="PRS_App.handleUseInventoryScroll(' + si + ')" title="' + this.escapeHtml(tPouch("pouch.use_title", null, "Zahrát tento pergamen hned")) + '">' + tPouch("pouch.use_btn", null, "⚡ Použít") + '</button>'
                        : '  <span style="font-size:0.68rem; color:#94a3b8; font-style:italic;">' + tPouch("pouch.stored", null, "Uloženo") + '</span>'
                    ) +
                    '</div>';
            }
            html += '</div>';
        }

        if (actBuffs.length > 0) {
            html += '<div style="margin-top:0.3rem; font-size:0.7rem; color:#86efac; background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.35); border-radius:5px; padding:0.2rem 0.45rem;">' +
                '✨ Aktivní: <strong>' + actBuffs.join(', ') + '</strong>' +
                '</div>';
        }

        html += '</div>';
        return html;
    },

    renderActionPanel: function () {

        var el = document.getElementById("turn-action-panel");

        if (!el || !this.state) return;

        if (this.state.phase === "GAME_OVER") {

            var winP = this.state.players[this.state.winnerIndex || 0];

            if (!this.victoryModalShown) {

                this.victoryModalShown = true;

                var self = this;

                setTimeout(function () { self.openVictoryModal(); }, 400);

            }

            el.innerHTML = '<div class="action-card victory-banner">' +

                '<h3>👑 Královská svatba! Vítězem je ' + winP.badge + ' ' + this.escapeHtml(winP.name) + '!</h3>' +

                '<p>' + (this.state.winType === "slayer_dragons" ? "Skolil 2 obávané draky království" : (this.state.winType === "tycoon_estates" ? "Ovládl 3 města a královský hrad" : ("Získal celkem <strong>" + winP.totalHearts + " 💖</strong>"))) + ' za ' + this.state.roundNumber + ' kol a získává ruku princezny.</p>' +

                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.6rem;">' +
                '  <button class="btn-gold-lg" onclick="PRS_App.continueInEndlessMode()" title="Pokračovat ve volné hře na stávajícím herním plánu">♾️ Pokračovat v nekonečné hře</button>' +
                '  <button class="btn-secondary" onclick="PRS_App.openVictoryModal()">👑 Otevřít ceremoniál &amp; Síň slávy</button>' +
                '  <button class="btn-secondary" onclick="PRS_App.startNewGame(true)">🔄 Nová partie</button>' +
                '</div>' +

                '</div>';

            return;

        }

        var player = this.state.players[this.state.currentPlayerIndex];

        var currNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;

        var isBot = (player.type !== "Human");

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
                return;
            }
        }

        // Trvalé stabilní zobrazení tahu bota - tlačítko je nahoře na pevné pozici, text pod ním
        if (isBot && this.autoBotEnabled) {
            var botRoll = this.state.lastRoll;
            var botLandedNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;
            var botStatusText = "";
            if (this.state.phase === "ROLL") {
                botStatusText = "Připravuje se k hodu kostkou...";
            } else if (botRoll) {
                botStatusText = "Hodil <strong>" + botRoll + "</strong>" + (botLandedNode ? (" a dorazil na pole <strong>" + this.escapeHtml(botLandedNode.name) + "</strong>.") : ".");
            } else {
                botStatusText = "Provádí tah královstvím...";
            }

            el.innerHTML = '<div class="action-card" style="border-color:rgba(212,175,55,0.4);">' +
                '<div class="turn-indicator" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">' +
                '  <span>Na tahu: <span style="color:' + player.color + ';">' + player.badge + ' <strong>' + this.escapeHtml(player.name) + '</strong></span></span>' +
                '  <span style="font-size:0.75rem; color:var(--text-muted); background:rgba(0,0,0,0.3); padding:2px 8px; border-radius:10px;">🤖 PC</span>' +
                '</div>' +
                '<div style="margin-bottom:0.75rem;">' +
                '  <button class="btn-gold-lg" style="width:100%; font-size:0.92rem; padding:0.58rem 0.85rem; font-weight:700; box-shadow:0 4px 14px rgba(212,175,55,0.3);" onclick="PRS_App.skipToNextHumanTurn()">⚡ Přeskočit přímo na můj tah</button>' +
                '</div>' +
                '<div class="bot-auto-status" style="text-align:center; padding:0.75rem 0.6rem; background:rgba(0,0,0,0.35); border-radius:10px; border:1px solid rgba(212,175,55,0.18);">' +
                '  <div style="font-size:0.98rem; font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.3rem;">🤖 ' + this.escapeHtml(player.name) + '</div>' +
                '  <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:0.4rem;">' + botStatusText + '</div>' +
                '  <div style="font-size:0.75rem; color:var(--text-muted);">Tah počítače běží automaticky. Klepnutím na tlačítko výše ihned skočíš na svůj tah.</div>' +
                '</div>' +
                '</div>';
            return;
        }

        if (this.state.phase === "ROLL") {

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

            var tempoSelectorHtml = isBot ? '' : (
                '<div class="movement-stance-selector">' +
                '  <div style="font-size:0.73rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:4px; font-weight:600;">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.movement_mode", null, "Režim pohybu:") : "Režim pohybu:") + '</div>' +
                '  <div class="movement-stance-grid">' +
                '    <button type="button" class="btn-tempo-option ' + (curMode === "standard" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'standard\')" title="Běžný hod 1–6">' +
                '      <span class="tempo-icon">🎲</span>' +
                '      <span class="tempo-name">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_march", null, "Pochod") : "Pochod") + '</span>' +
                '      <span class="tempo-desc">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_march_desc", null, "1–6 polí") : "1–6 polí") + '</span>' +
                '    </button>' +
                '    <button type="button" class="btn-tempo-option ' + (curMode === "cautious" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'cautious\')" title="Opatrný krok 1–4 pro přesné manévrování">' +
                '      <span class="tempo-icon">🚶</span>' +
                '      <span class="tempo-name">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_cautious", null, "Opatrný") : "Opatrný") + '</span>' +
                '      <span class="tempo-desc">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_cautious_desc", null, "1–4 pole") : "1–4 pole") + '</span>' +
                '    </button>' +
                '    <button type="button" class="btn-tempo-option ' + (!hasHorse ? "disabled" : (curMode === "horse" ? "active" : "")) + '" ' + (!hasHorse ? 'disabled' : 'onclick="PRS_App.selectMovementMode(\'horse\')"') + ' title="' + (hasHorse ? 'Házíš 2 kostkami (2d6) – volba trysku nebo manévru!' : 'Vyžaduje alespoň 1 koně ve stáji') + '">' +
                '      <span class="tempo-icon">🏇</span>' +
                '      <span class="tempo-name">' + (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop", null, "Cval") : "Cval") + '</span>' +
                '      <span class="tempo-desc">' + (hasHorse ? (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_gallop_desc", null, "2d6 volba") : "2d6 volba") : (window.PRS_I18n ? window.PRS_I18n.t("hud.stance_locked", null, "Zamčeno") : "Zamčeno")) + '</span>' +
                '    </button>' +
                '  </div>' +
                '</div>'
            );

            var targetHearts = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;

            var isHudEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var tHud = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var hudCurr = isHudEn ? "g." : "zl.";

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

            return;

        }

        if (this.state.phase === "BRANCH_CHOICE") {

            var pbc = this.state.pendingBranchChoice;

            if (pbc) {

                var junctionNode = this.state.board.nodes[pbc.junctionNodeId];

                var branchLowNode = this.state.board.nodes[pbc.branchLow];

                var branchHighNode = this.state.board.nodes[pbc.branchHigh];

                var targetLow = window.PRS_GameEngine.getTargetNodeForBranch(this.state, pbc.junctionNodeId, "low", pbc.remainingSteps);

                var targetHigh = window.PRS_GameEngine.getTargetNodeForBranch(this.state, pbc.junctionNodeId, "high", pbc.remainingSteps);

                var lowName = branchLowNode ? branchLowNode.name : "Vnější cesta";

                var highName = branchHighNode ? branchHighNode.name : "Královská stezka";

                var targetLowName = targetLow ? targetLow.name : ("Pole #" + pbc.branchLow);

                var targetHighName = targetHigh ? targetHigh.name : ("Pole #" + pbc.branchHigh);

                el.innerHTML = '<div class="action-card branch-choice-card" style="border:1.5px solid var(--gold); background:linear-gradient(180deg, rgba(30,27,75,0.92), rgba(15,23,42,0.95));">' +

                    '<div class="turn-indicator" style="color:var(--gold-light); font-size:1rem; font-family:\'Cinzel\',serif;">🔀 Volba trasy na rozcestí!</div>' +

                    '<div style="font-size:0.84rem; color:var(--text-muted); margin:0.35rem 0 0.75rem 0;">Stojíš na poli <strong>' + this.escapeHtml(junctionNode ? junctionNode.name : '') + '</strong>. Zbývá ti ještě <strong>' + pbc.remainingSteps + '</strong> kroků. Kudy se vydáš?</div>' +

                    '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

                    '  <button class="btn-branch-choice branch-low" onclick="PRS_App.handleChooseBranch(\'low\')" style="text-align:left; padding:0.75rem 0.9rem; background:rgba(16,185,129,0.15); border:1px solid #10b981; border-radius:8px; color:#ecfdf5; cursor:pointer;">' +

                    '    <div style="font-weight:700; font-size:0.95rem; color:#6ee7b7; margin-bottom:2px;">🌿 Vnější okruh (' + this.escapeHtml(lowName) + ')</div>' +

                    '    <div style="font-size:0.78rem; color:#a7f3d0;">🎯 Cíl za ' + pbc.remainingSteps + ' kr.: <strong>' + this.escapeHtml(targetLowName) + '</strong></div>' +

                    '  </button>' +

                    '  <button class="btn-branch-choice branch-high" onclick="PRS_App.handleChooseBranch(\'high\')" style="text-align:left; padding:0.75rem 0.9rem; background:rgba(217,119,6,0.15); border:1px solid #f59e0b; border-radius:8px; color:#fffbeb; cursor:pointer;">' +

                    '    <div style="font-weight:700; font-size:0.95rem; color:#fde68a; margin-bottom:2px;">🏰 Vnitřní královská stezka (' + this.escapeHtml(highName) + ')</div>' +

                    '    <div style="font-size:0.78rem; color:#fef3c7;">🎯 Cíl za ' + pbc.remainingSteps + ' kr.: <strong>' + this.escapeHtml(targetHighName) + '</strong></div>' +

                    '  </button>' +

                    '</div>' +

                    this.getRoyalAdvisorHtml(player, "BRANCH_CHOICE", pbc, junctionNode) +

                    '</div>';

                return;

            }

        }

        var pa = this.state.pendingAction || {};

        var btns = [];

        if (pa.canBuyNode) {
            var bPrice = (typeof pa.buyPrice === "number" && !isNaN(pa.buyPrice)) ? pa.buyPrice : 1000;
            var canAfford = (player.gold || 0) >= bPrice;
            var remGold = (player.gold || 0) - bPrice;
            var isProc = this.isActionProcessing || this.isSavingSession;
            var isEnBuy = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var currGBuy = isEnBuy ? "g." : "zl.";
            var priceFmt = bPrice.toLocaleString(isEnBuy ? "en-US" : "cs-CZ") + " " + currGBuy;
            var remFmt = remGold.toLocaleString(isEnBuy ? "en-US" : "cs-CZ") + " " + currGBuy;
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

            var qImg = q.img || ((q.questTier === "U1") ? "assets/tiles/u1_zver.jpg" : ((q.questTier === "U2") ? "assets/tiles/u2_monstrum.jpg" : "assets/tiles/u3_drak.jpg"));

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

                '  <div class="standing-tile-medallion" style="border-color:#ec4899;"><img src="assets/tiles/festival.jpg" alt="Slavnost" /></div>' +

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

        if (pa.canPayPrisonBail || pa.canAttemptPrisonEscape || pa.canServeSentence) {

            var canAffordBail = player.gold >= (pa.bailCost || 1000);

            specialCardHtml += '<div class="prison-encounter-card">' +

                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +

                '  <div class="standing-tile-medallion" style="border-color:#71717a; background:#18181b;"><span style="font-size:1.6rem;">⛓️</span></div>' +

                '  <div>' +

                '    <span class="standing-tile-badge" style="background:rgba(113,113,122,0.3); color:#e4e4e7; border-color:#71717a;">⛓️ Žalář &amp; Vězení</span>' +

                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#f4f4f5;">Královská Šatlava</div>' +

                '  </div>' +

                '</div>' +

                '<p style="font-size:0.84rem; color:#d4d4d8; margin-bottom:0.6rem;">Rytíř je uvězněn! Vyber si způsob propuštění:</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                '  <button class="btn-action-prison" ' + (!canAffordBail ? 'disabled' : '') + ' onclick="PRS_App.handlePayPrisonBail()">🔓 Složit kauci (' + (pa.bailCost || 1000) + ' zl.) – Okamžité propuštění</button>' +

                '  <button class="btn-action-prison" onclick="PRS_App.handlePrisonEscape()">🏃‍♂️ Pokus o noční útěk (Hoď 🎲 6 – zisk +500 zl. / jinak zůstáváš)</button>' +

                '  <button class="btn-action-prison" style="background:#27272a; border-color:#52525b;" onclick="PRS_App.handleServePrisonSentence()">⚖️ Odpykat trest (královský rychtář tě propustí)</button>' +

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

                '    <span class="standing-tile-badge" style="background:rgba(2,132,199,0.3); color:#7dd3fc; border-color:#0284c7;">🏥 Lazaret</span>' +

                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#f0f9ff;">Královský Lazaret &amp; Ranhojič</div>' +

                '  </div>' +

                '</div>' +

                '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:0.6rem;">Zranění rytíři zde nabírají síly do dalších klání:</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                '  <button class="btn-action-hospital" ' + (!canAffordElix ? 'disabled' : '') + ' onclick="PRS_App.handleBuyHospitalElixir()">🧪 Zakoupit Hojivý lektvar (+1 Boj, +0.5 💖 za ' + (pa.elixirCost || 800) + ' zl.)</button>' +

                '  <button class="btn-action-hospital" style="background:#0369a1; border-color:#0284c7;" onclick="PRS_App.handleRestHospital()">🌿 Zdarma odpočívat u bylinkáře</button>' +

                '</div>' +

                '</div>';

        }

        // 1. Setkání na stejném poli (Duel vs Přípitek)

        if (pa.encounterPlayer) {

            var enc = pa.encounterPlayer;

            var canDuel = pa.canDuelPlayer;

            var canToast = pa.canToastPlayer;

            var isEnEnc = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var encCurrG = isEnEnc ? "g." : "zl.";
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
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#6ee7b7; margin-bottom:4px;">📜 Královské předkupní právo na zvíře!</div>' +
                '<p style="font-size:0.8rem; color:#a7f3d0; margin-bottom:0.6rem;">Vlastníš 2 ze 3 zvířat sady! Můžeš vykoupit chybějící kus od majitele za dvojnásobek ceny a ihned zkompletovat sadu (+1,0 💖):</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">';

            for (var bi = 0; bi < validBuyoutCandidates.length; bi++) {
                var bc = validBuyoutCandidates[bi];
                var canAffordBc = player.gold >= bc.buyoutPrice;
                specialCardHtml += '  <button class="btn-action-buyout" ' + (!canAffordBc ? 'disabled' : '') + ' style="padding:0.55rem; background:linear-gradient(135deg, #059669, #047857); color:#fff; border:1px solid #6ee7b7; border-radius:7px; font-weight:700; text-align:left; cursor:pointer;" onclick="PRS_App.handleAnimalBuyout(' + bc.nodeId + ')">' +
                    bc.icon + ' Vykoupit ' + this.escapeHtml(bc.name) + ' ze sady #' + bc.setId + ' (' + bc.buyoutPrice + ' zl. pro ' + this.escapeHtml(bc.ownerName) + ') ➔ +1.0 💖' +
                    '</button>';
            }

            specialCardHtml += '</div></div>';
        } else if (pa.buyoutSuccess) {
            var bs = pa.buyoutSuccess;
            specialCardHtml += '<div class="buyout-interaction-card" style="border:1.5px solid #10b981; background:linear-gradient(180deg, rgba(6,78,59,0.55), rgba(15,23,42,0.92)); border-radius:10px; padding:0.85rem; margin-top:0.6rem; display:flex; align-items:flex-start; gap:0.75rem; position:relative;">' +
                '<div style="font-size:1.8rem; line-height:1;">' + (bs.nodeIcon || '🦅') + '</div>' +
                '<div style="flex:1;">' +
                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#6ee7b7; font-weight:700;">✅ Královský výkup úspěšně dokončen!</div>' +
                '<div style="font-size:0.82rem; color:#a7f3d0; margin-top:0.25rem;">Kus <strong>' + this.escapeHtml(bs.nodeName) + '</strong> byl vykoupen od soupeře <strong>' + this.escapeHtml(bs.sellerName) + '</strong> za <strong>' + bs.price.toLocaleString("cs-CZ") + ' zl.</strong> Tvoje chovná sada #' + bs.setId + ' je nyní kompletní (+1,0 💖)!</div>' +
                '</div>' +
                '<button type="button" onclick="this.closest(\'.buyout-interaction-card\').remove(); if(PRS_App.state && PRS_App.state.pendingAction) PRS_App.state.pendingAction.buyoutSuccess=null;" style="background:transparent; border:none; color:#a7f3d0; font-size:1.15rem; cursor:pointer; padding:0 4px; line-height:1;" title="Zavřít oznámení">✕</button>' +
                '</div>';
        }

        // 3. Dvorní intriky u Kejklíře a v Krčmě

        if (pa.canPlotIntrigue) {

            specialCardHtml += '<div class="intrigue-interaction-card" style="border:1.5px solid #d97706; background:linear-gradient(180deg, rgba(120,53,15,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +

                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#fde68a; margin-bottom:4px;">🃏 Dvorní intriky proti soupeřům</div>' +

                '<p style="font-size:0.8rem; color:#fef3c7; margin-bottom:0.6rem;">Najmi kejklíře k posměchu lídra nebo uplatni královské pravomoci:</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                '  <button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #7c3aed, #5b21b6); border-color:#c084fc;" onclick="PRS_App.openIntrigueModal(\'ballad\')">🎭 Posměšná balada pod balkónem (' + (pa.intrigueBalladCost || 750) + ' zl. ➔ Srazit soupeři Srdce 💖)</button>' +

                '  <button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #b45309, #78350f); border-color:#fbbf24;" onclick="PRS_App.openIntrigueModal(\'customs\')">📜 Královská celní kontrola (' + (pa.intrigueCustomsCost || 600) + ' zl. ➔ Zmrazit nájemné na 1 kolo)</button>' +

                '</div></div>';

        } else if (pa.intriguePlotted) {

            specialCardHtml += '<div class="intrigue-interaction-card" style="border:1px solid #10b981; background:rgba(6,78,59,0.35); border-radius:10px; padding:0.6rem 0.8rem; margin-top:0.6rem; font-size:0.82rem; color:#6ee7b7; display:flex; align-items:center; gap:8px;">' +

                '<span style="font-size:1.3rem;">🎭</span> <span>' + this.escapeHtml(pa.intrigueSummary || 'Dvorní intrika byla pro tento tah vyhodnocena.') + '</span>' +

                '</div>';

        }

        // 4. Obchodní pakt u Obchodníka a na STARTu

        if (pa.canFormTradePact) {

            specialCardHtml += '<div class="pact-interaction-card" style="border:1.5px solid #0284c7; background:linear-gradient(180deg, rgba(12,74,110,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +

                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#7dd3fc; margin-bottom:4px;">🤝 Obchodní pakt (Bezcelní aliance na 8 kol)</div>' +

                '<p style="font-size:0.8rem; color:#bae6fd; margin-bottom:0.6rem;">Spoj se s rytířem: nulové mýtné na panstvích a dividenda +300 zl. při každé návštěvě!</p>' +

                '<button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="PRS_App.openTradePactModal()">🤝 Uzavřít Obchodní pakt (' + (pa.tradePactCost || 750) + ' zl.)</button>' +

                '</div>';

        }

        // 5. Osobní výzva na Slavnosti

        if (pa.canChallengeFestivalRival) {

            specialCardHtml += '<div class="festival-challenge-card" style="border:1.5px solid #ec4899; background:linear-gradient(180deg, rgba(131,24,67,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +

                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#fbcfe8; margin-bottom:4px;">🏆 Osobní výzva 1 na 1 na Slavnosti</div>' +

                '<p style="font-size:0.8rem; color:#fce7f3; margin-bottom:0.6rem;">Vyzvi konkrétního soupeře k souboji v královské ctnosti o zlato a slávu:</p>' +

                '<button class="btn-gold-lg" style="font-size:0.84rem; padding:0.5rem; background:linear-gradient(135deg, #ec4899, #be185d); border-color:#fbcfe8;" onclick="PRS_App.openFestivalChallengeModal()">🤺 Vyhlásit osobní výzvu soupeři (' + (pa.festivalChallengeStake || 750) + ' zl.)</button>' +

                '</div>';

        }

        // Krčma (Hostinec)

        if (pa.canTavernGamble || pa.canBuyTavernRound) {

            var canAffordBet = player.gold >= (pa.gambleBet || 500);

            var canAffordRound = player.gold >= (pa.roundCost || 400);

            specialCardHtml += '<div class="tavern-encounter-card">' +

                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +

                '  <div class="standing-tile-medallion" style="border-color:#f59e0b; background:#451a03;"><span style="font-size:1.6rem;">🍺</span></div>' +

                '  <div>' +

                '    <span class="standing-tile-badge" style="background:rgba(217,119,6,0.3); color:#fde68a; border-color:#d97706;">🍺 Hostinec</span>' +

                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#fef3c7;">Krčma U Zlatého korbelu</div>' +

                '  </div>' +

                '</div>' +

                '<p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.6rem;">U krbu sedí veselá chasa i záletní kupci. Vyber si zábavu:</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                '  <button class="btn-action-tavern" ' + (!canAffordBet ? 'disabled' : '') + ' onclick="PRS_App.handleTavernGamble()">🎲 Kostky s krčmářem (Sázka ' + (pa.gambleBet || 500) + ' zl. – hod 2 kostkami)</button>' +

                '  <button class="btn-action-tavern" ' + (!canAffordRound ? 'disabled' : '') + ' onclick="PRS_App.handleBuyTavernRound()">🍻 Runda medoviny pro celou hospodu (+0.5 💖 za ' + (pa.roundCost || 400) + ' zl.)</button>' +

                '</div>' +

                '</div>';

        }

        // Nucené vyrovnání dluhu (Dražba majetku za 60 %)

        if (pa.debt) {

            var creditor = this.state.players[pa.debt.creditorIndex];

            var credName = creditor ? creditor.name : "věřiteli";

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

                assetsRows += '<div class="debt-asset-row">' +

                    '<span>' + itIcon + ' <strong>' + this.escapeHtml(itName) + '</strong> (' + (itObj.isEquipped === false ? '🎒 v batohu' : '⚔️ nasazeno') + ')</span>' +

                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'item\', \'' + (itObj.uid || itObj.id) + '\')">Odprodat za +' + itLiq + ' zl.</button>' +

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

                    assetsRows += '<div class="debt-asset-row">' +

                        '<span>🏘️ Snížit vesnici <strong>' + this.escapeHtml(ndObj.name) + '</strong> z ' + ndObj.villageLevel + '★ na ' + (ndObj.villageLevel - 1) + '★</span>' +

                        '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'village_downgrade\', ' + ndObj.id + ')">Snížit za +' + downLiq + ' zl.</button>' +

                        '</div>';

                }

                var investVal = window.PRS_GameEngine.getNodeInvestedValue(this.state, ndObj);

                var ndLiq = Math.round(investVal * rate);

                assetsRows += '<div class="debt-asset-row">' +

                    '<span>' + (ndObj.icon || '📍') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> (' + ndObj.code + ')</span>' +

                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'node\', ' + ndObj.id + ')">Odprodat za +' + ndLiq + ' zl.</button>' +

                    '</div>';

            }

            specialCardHtml += '<div class="debt-encounter-card">' +

                '<span class="debt-badge">⚖️ Královská dražba &amp; Vyrovnání dluhu</span>' +

                '<div class="debt-title">Zbývá doplatit: <span style="color:#ef4444;">' + pa.debt.remainingDebt + ' zl.</span></div>' +

                '<p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.5rem;">Hotovost nestačila na úhradu nájmu hráči <strong>' + this.escapeHtml(credName) + '</strong>. K vyrovnání závazku musíš odprodat část majetku Královské komoře za 60 % pořizovací ceny:</p>' +

                '<div class="debt-assets-list">' + (assetsRows || '<div class="empty-note">Žádný majetek k odprodeji.</div>') + '</div>' +

                '<div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap;">' +

                '  <button class="btn-action-buy" style="background:#b45309; border-color:#fbbf24; font-weight:bold; width:100%;" onclick="PRS_App.handleAutoLiquidateDebt()">⚡ Automaticky vybrat a uhradit dluh</button>' +

                '</div>' +

                '</div>';

        }

        var isScrollPending = !!(pa.canStoreScroll || pa.scrollCard || (pa.chanceCard && (pa.chanceCard.isScroll || pa.chanceCard.category === "scroll" || pa.chanceCard.scrollType)));
        var mustCompleteFirst = pa.canResolveQuest || pa.canResolveFestival || pa.isImprisoned || pa.debt || isScrollPending;

        if (isScrollPending) {
            if (!player.inventory || player.inventory.length < 3) {
                btns.push('<button class="btn-primary" style="background:linear-gradient(135deg, #059669, #047857); border:1.5px solid #34d399; font-weight:700; padding:0.55rem 0.9rem;" onclick="PRS_App.handleStoreScroll()">🎒 Uložit do brašny (' + ((player.inventory && player.inventory.length) || 0) + '/3)</button>');
            }
            btns.push('<button class="btn-primary" style="background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; font-weight:700; padding:0.55rem 0.9rem;" onclick="PRS_App.handleUseScrollNow()">⚡ Použít svitek ihned</button>');
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
        if (window.PRS_I18n && window.PRS_I18n.getLanguage() === "en" && summaryRaw) {
            summaryRaw = summaryRaw.replace(/Pole je volné ke koupi za\s*(\d+)\s*zl\./gi, "Tile is available for purchase for $1 g.");
        }
        var encounterHtml = this.parseTurnEncounter(summaryRaw);

        var targetHeartsAction = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;
        var isEnActPanel = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var actGoldStr = player.gold.toLocaleString(isEnActPanel ? "en-US" : "cs-CZ") + " " + (isEnActPanel ? "g." : "zl.");

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
    },

    // --- HERNÍ AKCE Z UI & ANIMACE KROKOVÁNÍ ---,

    getDiceGlyph: function (roll) {

        var glyphs = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };

        return glyphs[roll] || "🎲";

    },

    animatePlayerMove: function (playerIndex, path, onComplete) {

        var self = this;

        if (!path || path.length <= 1) {

            self.isMoveAnimating = false;

            self.animatingPlayerIndex = null;

            self.animTokenPos = null;

            if (onComplete) onComplete();

            return;

        }

        self.isMoveAnimating = true;

        self.animatingPlayerIndex = playerIndex;

        var nodes = self.state.board.nodes;

        var stepIndex = 0;

        var movingPlayer = (self.state.players && self.state.players[playerIndex]) ? self.state.players[playerIndex] : null;

        var isBotMoving = movingPlayer && movingPlayer.type !== "Human";

        var stepDuration = isBotMoving ? 65 : (self.fastAnim ? 75 : 125);

        function runNextStep() {

            if (stepIndex >= path.length - 1) {

                self.isMoveAnimating = false;

                self.animatingPlayerIndex = null;

                self.animTokenPos = null;

                if (onComplete) onComplete();

                return;

            }

            var startNode = nodes[path[stepIndex]];

            var endNode = nodes[path[stepIndex + 1]];

            if (!startNode || !endNode) {

                stepIndex++;

                runNextStep();

                return;

            }

            var startX = startNode.x;

            var startY = startNode.y - 15;

            var endX = endNode.x;

            var endY = endNode.y - 15;

            var startTime = performance.now();

            function frame(now) {

                var elapsed = now - startTime;

                var t = Math.min(1, elapsed / stepDuration);

                var easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                var curX = startX + (endX - startX) * easeT;

                var hop = Math.sin(t * Math.PI) * 16;

                var curY = startY + (endY - startY) * easeT - hop;

                self.animTokenPos = { x: Math.round(curX), y: Math.round(curY) };

                self.renderBoardTokens();

                if (t < 1) {

                    requestAnimationFrame(frame);

                } else {

                    if (window.PRS_Audio) {
                        var isBridge = false;
                        if (self.state.board && self.state.board.bridges) {
                            for (var bri = 0; bri < self.state.board.bridges.length; bri++) {
                                var bObj = self.state.board.bridges[bri];
                                var distB = (endNode.x - bObj.x) * (endNode.x - bObj.x) + (endNode.y - bObj.y) * (endNode.y - bObj.y);
                                if (distB < 1600) { isBridge = true; break; }
                            }
                        }
                        if (isBridge && window.PRS_Audio.playBridgeCrossing) {
                            window.PRS_Audio.playBridgeCrossing();
                        } else if (endNode.type === "CASTLE" && window.PRS_Audio.playCastleArrival) {
                            window.PRS_Audio.playCastleArrival();
                        } else {
                            var nBiome = endNode.biome || (endNode.x > 950 && endNode.y > 350 ? "mountain" : (endNode.x < 450 && endNode.y > 350 ? "forest" : (endNode.y > 600 ? "water" : "plains")));
                            if (window.PRS_Audio.playBiomeStep) window.PRS_Audio.playBiomeStep(nBiome);
                            else window.PRS_Audio.playStep();
                        }
                    }

                    self.renderBoardTokens();

                    stepIndex++;

                    var hopPause = isBotMoving ? 12 : (self.fastAnim ? 15 : 25);

                    setTimeout(runNextStep, hopPause);

                }

            }

            requestAnimationFrame(frame);

        }

        runNextStep();

    },

    executeRollAndAnimateMove: function (player, onFinish, forcedRoll) {

        var self = this;

        if (self.isMoveAnimating || !self.state) return;

        self.isMoveAnimating = true;

        // Bezpečnostní watchdog: pokud by animace selhala nebo se zasekla, po 3 s uvolníme zámek

        clearTimeout(self.moveAnimationWatchdog);

        self.moveAnimationWatchdog = setTimeout(function () {

            if (self.isMoveAnimating) {

                self.isMoveAnimating = false;

                self.animatingPlayerIndex = null;

                self.animTokenPos = null;

                self.renderGameScreen();

                if (onFinish) onFinish();

            }

        }, 3200);

        if (window.PRS_Audio) window.PRS_Audio.playDice();

        var isBot = (player.type !== "Human");

        var diceEl = document.getElementById("dice-cube-el");

        if (diceEl) {

            diceEl.classList.add("dice-rolling");

        }

        var shuffleCount = 0;

        var shuffleLimit = isBot ? 2 : 6;

        var shuffleInterval = setInterval(function () {

            shuffleCount++;

            var tempVal = Math.floor(Math.random() * 6) + 1;

            if (diceEl) diceEl.textContent = self.getDiceGlyph(tempVal);

            if (shuffleCount >= shuffleLimit) {

                clearInterval(shuffleInterval);

            }

        }, isBot ? 40 : 60);

        var preMoveDelay = isBot ? 100 : 380;

        setTimeout(function () {

            var res = window.PRS_GameEngine.rollAndMove(self.state, forcedRoll);

            if (!res) {

                self.isMoveAnimating = false;

                clearTimeout(self.moveAnimationWatchdog);

                if (onFinish) onFinish();

                return;

            }

            if (diceEl) {

                diceEl.classList.remove("dice-rolling");

                diceEl.textContent = self.getDiceGlyph(res.roll);

            }

            self.animatePlayerMove(player.index, res.path, function () {

                clearTimeout(self.moveAnimationWatchdog);

                self.selectedNodeId = player.nodeId;

                if (res.status === "BRANCH_REQUIRED") {

                    self.showPawnToast(player.index, "Rozcestí! Zbývá " + res.remainingSteps + " kr.", "🔀", "#38bdf8");

                } else {

                    self.showPawnToast(player.index, "Hodil " + res.roll + "!", "🎲", "#fde047");

                }

                if (self.viewport && self.viewport.scale > 1.05) {

                    self.centerOnActivePlayer();

                }

                self.renderGameScreen();

                self.inspectNode(player.nodeId);

                self.saveSessionAuto();

                if (self.deviceProfile && self.deviceProfile.device === "mobile") {

                    if (self.viewport.scale > 1.05) {

                        self.centerOnActivePlayer();

                    }

                }

                // Automatické otevření karty Náhody pro hráče
                if (player.type === "Human" && self.state.pendingAction && self.state.pendingAction.chanceCard) {
                    setTimeout(function () {
                        self.openChanceModal();
                    }, 280);
                }

                if (onFinish) onFinish();

            });

        }, preMoveDelay);

    },

    selectedMovementMode: "standard",

    selectMovementMode: function (mode) {

        this.selectedMovementMode = mode;

        this.renderGameScreen();

    },

    handleRollDice: function (overrideMode) {

        var self = this;

        if (!self.state) return;

        if (self.isMoveAnimating) return;

        var player = self.state.players[self.state.currentPlayerIndex];

        if (!player || player.type !== "Human") return;

        var mode = overrideMode || self.selectedMovementMode || "standard";

        var effStats = window.PRS_GameEngine.getEffectiveStats(self.state, player);

        var hasHorse = (player.stats.horses > 0 || effStats.horses > 0);

        var hasFalcon = (player.stats.falcons > 0 || effStats.falcons > 0);

        if (mode === "horse" && !hasHorse) {

            mode = "standard";

        }

        // Koňský cval: hod 2d6 a volba trysku vs manévru

        if (mode === "horse") {

            var d1 = Math.floor(Math.random() * 6) + 1;

            var d2 = Math.floor(Math.random() * 6) + 1;

            self.showHorseRollDialog(player, d1, d2, hasFalcon);

            return;

        }

        var baseRoll = (mode === "cautious")

            ? (Math.floor(Math.random() * 4) + 1)

            : (Math.floor(Math.random() * 6) + 1);

        // Sokolí navigace pro člověka
        if (hasFalcon) {

            self.showFalconNavigationDialog(player, baseRoll);

            return;

        }

        // Pěší bonus za výcvik Jízdy (Jízda >= 2 dává +1 pole, Jízda >= 4 dává +2 pole)
        if (!hasHorse && effStats.riding >= 2) {

            var jzBonus = (effStats.riding >= 4) ? 2 : 1;

            self.showPedestrianSprintDialog(player, baseRoll, jzBonus);

            return;

        }

        // Běžný pochod
        self.executeRollAndAnimateMove(player, null, baseRoll);

    },

    showPedestrianSprintDialog: function (player, baseRoll, jzBonus) {

        var self = this;

        var sprintRoll = baseRoll + jzBonus;

        var targetBase = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, baseRoll);

        var targetSprint = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, sprintRoll);

        var modal = (this.getGenericModal ? this.getGenericModal() : document.getElementById("generic-modal"));
        if (!modal) {
            self.executeRollAndAnimateMove(player, null, baseRoll);
            return;
        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +

            '<div style="font-size:2rem; margin-bottom:0.3rem;">🏃‍♂️ 🏇</div>' +

            '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.5rem 0;">Výcvik Jízdy: Hod ' + baseRoll + '!</h3>' +

            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.1rem;">Díky své rytířské mrštnosti a výcviku Jízdy můžeš vyrazit svižným přesunem (+' + jzBonus + ' ' + (jzBonus === 1 ? 'pole' : 'pole') + ')!</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border-color:#38bdf8;" onclick="PRS_App.confirmFalconRoll(' + sprintRoll + ')">' +

            '    <div style="font-weight:700; color:#e0f2fe;">⚡ Rychlý přesun: ' + sprintRoll + ' polí (+' + jzBonus + ')</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + (targetSprint ? self.escapeHtml(targetSprint.name) : '') + '</div>' +

            '  </button>' +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem;" onclick="PRS_App.confirmFalconRoll(' + baseRoll + ')">' +

            '    <div style="font-weight:700; color:#fef08a;">🚶 Běžný krok: ' + baseRoll + ' polí</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + (targetBase ? self.escapeHtml(targetBase.name) : '') + '</div>' +

            '  </button>' +

            '</div></div>';

        modal.innerHTML = html;

        modal.style.display = "flex";

    },

    showHorseRollDialog: function (player, d1, d2, hasFalcon) {

        var self = this;

        var effStats = window.PRS_GameEngine.getEffectiveStats(self.state, player);

        var jz = effStats.riding || 0;

        var canGallop = jz >= 2;

        var canSprint = jz >= 4;

        var sum = d1 + d2;

        var sprintSum = sum + 2;

        var targetSum = canGallop ? window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, sum) : null;

        var targetSprint = canSprint ? window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, sprintSum) : null;

        var targetD1 = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, d1);

        var targetD2 = (d1 !== d2) ? window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, d2) : null;

        var modal = document.getElementById("generic-modal");

        if (!modal) {

            self.executeRollAndAnimateMove(player, null, canGallop ? sum : d1);

            return;

        }

        var headerTitle = canSprint ? "Královský trysk" : (canGallop ? "Koňský cval" : "Koňský klus");

        var headerSub = canGallop
            ? ("Díky mistrovství Jízdy (" + jz + "/5) a koni máš volbu mezi bleskovým cvalem či přesným manévrem.")
            : ("Koňský klus (Jízda " + jz + "/5): Volíš z obou kostek (plný cval d1+d2 vyžaduje Jízdu ≥ 2).");

        if (hasFalcon) {
            headerSub += "<br><span style='color:#7dd3fc; font-size:0.8rem;'>🦅 <strong>Sokolí navigaci (±1 pole)</strong> můžeš využít při taktických manévrech (při plném cvalu či trysku kůň pádí příliš rychle na navigaci sokolem).</span>";
        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid var(--gold); border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +
            '<div style="font-size:2rem; margin-bottom:0.3rem;">🏇 🎲 🎲</div>' +
            '<h3 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin:0 0 0.5rem 0;">' + headerTitle + ': Padlo ' + d1 + ' a ' + d2 + '!</h3>' +
            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.1rem;">' + headerSub + '</div>' +
            '<div style="display:flex; flex-direction:column; gap:0.6rem;">';

        if (canSprint && targetSprint) {
            html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #7c3aed, #4f46e5); border-color:#c084fc;" onclick="PRS_App.confirmHorseRoll(' + sprintSum + ', false)">' +
                '    <div style="font-weight:700; color:#f5d0fe;">👑 Královský trysk (' + sprintSum + ' polí: ' + sum + '+2)' + (hasFalcon ? ' <small style="font-size:0.72rem; color:#fbcfe8; font-weight:normal;">(přímý trysk – bez sokola)</small>' : '') + '</div>' +
                '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + self.escapeHtml(targetSprint.name) + '</div>' +
                '  </button>';
        }

        if (canGallop && targetSum) {
            html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem;" onclick="PRS_App.confirmHorseRoll(' + sum + ', false)">' +
                '    <div style="font-weight:700; color:#fef08a;">⚡ Plný cval (' + sum + ' polí)' + (hasFalcon ? ' <small style="font-size:0.72rem; color:#fde047; font-weight:normal;">(přímý cval – bez sokola)</small>' : '') + '</div>' +
                '    <div style="font-size:0.78rem; opacity:0.85;">Cíl: ' + self.escapeHtml(targetSum.name) + '</div>' +
                '  </button>';
        }

        var scoutLevel = hasFalcon ? self.getFalconScoutLevel(player) : 0;

        html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #1e293b, #334155); border-color:#64748b;" onclick="PRS_App.confirmHorseRoll(' + d1 + ', ' + hasFalcon + ')">' +
            '    <div style="font-weight:700; color:#cbd5e1;">🎯 Taktický manévr (' + d1 + ' ' + (d1 === 1 ? 'pole' : (d1 < 5 ? 'pole' : 'polí')) + ')' + (hasFalcon ? ' <span style="color:#7dd3fc; font-size:0.78rem; font-weight:normal;">🦅 + Sokolí navigace (±1)</span>' : '') + '</div>' +
            '    <div style="font-size:0.78rem; opacity:0.85;">Cíl: ' + (targetD1 ? self.escapeHtml(targetD1.name) : '') + '</div>' +
            (hasFalcon ? self.renderFalconTargetIntelHtml(player, targetD1, scoutLevel, d1) : '') +
            '  </button>';

        if (targetD2) {
            html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #1e293b, #334155); border-color:#64748b;" onclick="PRS_App.confirmHorseRoll(' + d2 + ', ' + hasFalcon + ')">' +
                '    <div style="font-weight:700; color:#cbd5e1;">🎯 Taktický manévr (' + d2 + ' ' + (d2 < 5 ? 'pole' : 'polí') + ')' + (hasFalcon ? ' <span style="color:#7dd3fc; font-size:0.78rem; font-weight:normal;">🦅 + Sokolí navigace (±1)</span>' : '') + '</div>' +
                '    <div style="font-size:0.78rem; opacity:0.85;">Cíl: ' + self.escapeHtml(targetD2.name) + '</div>' +
                (hasFalcon ? self.renderFalconTargetIntelHtml(player, targetD2, scoutLevel, d2) : '') +
                '  </button>';
        }

        html += '</div></div>';

        modal.innerHTML = html;

        modal.style.display = "flex";

    },

    confirmHorseRoll: function (roll, hasFalcon) {

        var modal = document.getElementById("generic-modal");

        if (modal) modal.style.display = "none";

        var player = this.state.players[this.state.currentPlayerIndex];

        if (hasFalcon) {

            this.showFalconNavigationDialog(player, roll);

        } else {

            this.executeRollAndAnimateMove(player, null, roll);

        }

    },

    getFalconScoutLevel: function (player) {
        if (!this.state || !player || !window.PRS_GameEngine) return 0;
        var eff = window.PRS_GameEngine.getEffectiveStats(this.state, player);
        var falcons = (eff && eff.falcons) || (player.stats && player.stats.falcons) || 0;
        if (falcons <= 0) return 0;

        var hasCompleteSet = false;
        if (this.state.board && Array.isArray(this.state.board.nodes)) {
            var setMap = {};
            for (var i = 0; i < this.state.board.nodes.length; i++) {
                var nd = this.state.board.nodes[i];
                if (nd.owner === player.index && nd.type === "ANIMAL" && nd.setId) {
                    if (!setMap[nd.setId]) setMap[nd.setId] = {};
                    setMap[nd.setId][nd.subtype] = true;
                }
            }
            for (var sid in setMap) {
                if (setMap[sid].horse && setMap[sid].dog && setMap[sid].falcon) {
                    hasCompleteSet = true;
                    break;
                }
            }
        }

        if (falcons >= 3 || hasCompleteSet) return 3;
        if (falcons >= 2 || (eff && eff.hasFalconer)) return 2;
        return 1;
    },

    renderFalconTargetIntelHtml: function (player, targetNode, scoutLevel, moveRoll) {
        if (!targetNode || !this.state || !window.PRS_GameEngine) return "";
        if (scoutLevel < 2) {
            return '<div style="font-size:0.71rem; color:#94a3b8; margin-top:2px;">🔒 Průzkum vlastníka od 2 sokolů nebo se Sokolníkem</div>';
        }
        var eng = window.PRS_GameEngine;
        var isBuyable = eng.isPurchasableNode ? eng.isPurchasableNode(targetNode) : false;
        if (!isBuyable) {
            return '<div style="font-size:0.73rem; color:#94a3b8; margin-top:2px;">🏳️ Neutrální / akční pole</div>';
        }
        if (targetNode.owner === player.index) {
            var vStars = (targetNode.type === "VILLAGE") ? " (" + (targetNode.villageLevel || 1) + "★)" : "";
            var upgHint = (scoutLevel >= 3 && targetNode.type === "VILLAGE" && (targetNode.villageLevel || 1) < 3) ? " · Povýšení možné" : "";
            return '<div style="font-size:0.73rem; color:#86efac; margin-top:2px;">👑 Tvé panství' + vStars + upgHint + '</div>';
        }
        if (targetNode.owner !== null && targetNode.owner !== undefined && this.state.players && this.state.players[targetNode.owner]) {
            var ownerObj = this.state.players[targetNode.owner];
            var rentStr = "";
            if (scoutLevel >= 3 && eng.calculateNodeRent) {
                var rentVal = eng.calculateNodeRent(this.state, targetNode, ownerObj, moveRoll || 0);
                rentStr = (rentVal > 0)
                    ? (' · <span style="color:#fca5a5;">💸 Nájem: ' + rentVal.toLocaleString("cs-CZ") + ' zl.</span>')
                    : ' · <span style="color:#cbd5e1;">🤝 Bez nájmu</span>';
            }
            return '<div style="font-size:0.73rem; margin-top:2px; color:' + (ownerObj.color || '#fca5a5') + '; font-weight:600;">🛡️ Vlastník: ' + (ownerObj.badge || '') + ' ' + this.escapeHtml(ownerObj.name) + rentStr + '</div>';
        }
        var priceStr = "";
        if (scoutLevel >= 3 && eng.getNodePrice) {
            var pVal = eng.getNodePrice(this.state, targetNode);
            if (pVal > 0) priceStr = ' · 💰 Cena: ' + pVal.toLocaleString("cs-CZ") + ' zl.';
        }
        return '<div style="font-size:0.73rem; color:#fde68a; margin-top:2px;">🏷️ Volné k nákupu' + priceStr + '</div>';
    },

    showFalconNavigationDialog: function (player, baseRoll) {

        var self = this;

        var minusRoll = Math.max(1, baseRoll - 1);

        var plusRoll = baseRoll + 1;

        var targetMinus = (minusRoll !== baseRoll) ? window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, minusRoll) : null;

        var targetBase = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, baseRoll);

        var targetPlus = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, plusRoll);

        var scoutLevel = self.getFalconScoutLevel(player);
        var scoutBadgeText = scoutLevel >= 3
            ? "🦅 Sokolí průzkum (Úr. 3/3 – Vlastníci & Ceny)"
            : (scoutLevel === 2 ? "🦅 Sokolí průzkum (Úr. 2/3 – Vlastníci)" : "🦅 Sokolí průzkum (Úr. 1/3 – Základní)");

        var modal = (this.getGenericModal ? this.getGenericModal() : document.getElementById("generic-modal"));
        if (!modal) {
            self.executeRollAndAnimateMove(player, null, baseRoll);
            return;
        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +

            '<div style="font-size:2rem; margin-bottom:0.3rem;">🦅 🎯</div>' +

            '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.4rem 0;">Sokolí navigace: Hod ' + baseRoll + '!</h3>' +

            '<div style="display:inline-block; font-size:0.74rem; color:#bae6fd; background:rgba(56,189,248,0.14); border:1px solid rgba(56,189,248,0.35); border-radius:999px; padding:0.15rem 0.65rem; margin-bottom:0.55rem;">' + scoutBadgeText + '</div>' +

            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.05rem;">Tvůj sokol krouží nad krajinou a dává ti možnost upravit výsledný doskok o ±1 pole!</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

            (targetMinus ? '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border-color:#38bdf8;" onclick="PRS_App.confirmFalconRoll(' + minusRoll + ')">' +

            '    <div style="font-weight:700; color:#e0f2fe;">◀️ Úprava: ' + minusRoll + ' polí (-1)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + self.escapeHtml(targetMinus.name) + '</div>' +
            self.renderFalconTargetIntelHtml(player, targetMinus, scoutLevel, minusRoll) +

            '  </button>' : '') +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem;" onclick="PRS_App.confirmFalconRoll(' + baseRoll + ')">' +

            '    <div style="font-weight:700; color:#fef08a;">🎯 Původní hod: ' + baseRoll + ' polí (bez změny)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + (targetBase ? self.escapeHtml(targetBase.name) : '') + '</div>' +
            self.renderFalconTargetIntelHtml(player, targetBase, scoutLevel, baseRoll) +

            '  </button>' +

            (targetPlus ? ('  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border-color:#38bdf8;" onclick="PRS_App.confirmFalconRoll(' + plusRoll + ')">' +

            '    <div style="font-weight:700; color:#e0f2fe;">▶️ Úprava: ' + plusRoll + ' polí (+1)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + self.escapeHtml(targetPlus.name) + '</div>' +
            self.renderFalconTargetIntelHtml(player, targetPlus, scoutLevel, plusRoll) +

            '  </button>') : '') +

            '</div>' +

            '</div>';

        modal.innerHTML = html;

        modal.style.display = "flex";

    },

    confirmFalconRoll: function (finalRoll) {

        var modal = document.getElementById("generic-modal");

        if (modal) modal.style.display = "none";

        var player = this.state.players[this.state.currentPlayerIndex];

        this.executeRollAndAnimateMove(player, null, finalRoll);

    },

    handleChooseBranch: function (branchChoice) {

        var self = this;

        if (!self.state || self.state.phase !== "BRANCH_CHOICE") return;

        var player = self.state.players[self.state.currentPlayerIndex];

        if (!player) return;

        var res = window.PRS_GameEngine.continueMovementFromBranch(self.state, branchChoice);

        if (!res) return;

        if (window.PRS_Audio) window.PRS_Audio.playStep();

        self.animatePlayerMove(player.index, res.resumedPath, function () {

            self.selectedNodeId = player.nodeId;

            self.showPawnToast(player.index, "Dorazil na " + res.node.name + "!", "🔀", "#fde047");

            if (self.viewport && self.viewport.scale > 1.05) {

                self.centerOnActivePlayer();

            }

            self.renderGameScreen();

            self.inspectNode(player.nodeId);

            self.saveSessionAuto();

        });

    },

    handleBuyNode: function () {

        if (this.isActionProcessing || this.isSavingSession) return;

        this.isActionProcessing = true;

        // Okamžitě zneaktivnit tlačítka v DOMu pro okamžitou odezvu bez možnosti druhého kliknutí

        var buyBtns = document.querySelectorAll(".btn-action-buy, #btn-buy-current-node, #mobile-btn-buy-node, [onclick*='handleBuyNode']");

        for (var i = 0; i < buyBtns.length; i++) {

            buyBtns[i].disabled = true;

            buyBtns[i].style.opacity = "0.5";

            buyBtns[i].style.pointerEvents = "none";

            buyBtns[i].innerHTML = "⏳ Kupuji pole...";

        }

        var ok = window.PRS_GameEngine.buyCurrentNode(this.state);

        if (ok) {

            if (window.PRS_Audio) window.PRS_Audio.playCoin();

            this.showPawnToast(this.state.currentPlayerIndex, "Koupeno pole!", "🏰", "#4ade80");

        }

        this.isBoardStaticDirty = true;

        this.renderGameScreen();

        var self = this;

        var p = this.saveSessionAuto();

        if (p && p.finally) {

            p.finally(function () {

                self.isActionProcessing = false;

            });

        } else {

            setTimeout(function () { self.isActionProcessing = false; }, 350);

        }

    },

    handleUpgradeVillage: function (nodeId) {

        if (this.isActionProcessing || this.isSavingSession) return;

        this.isActionProcessing = true;

        var upgBtns = document.querySelectorAll("[onclick*='handleUpgradeVillage']");

        for (var i = 0; i < upgBtns.length; i++) {

            upgBtns[i].disabled = true;

            upgBtns[i].style.opacity = "0.5";

            upgBtns[i].style.pointerEvents = "none";

            upgBtns[i].innerHTML = "⏳ Povyšuji vesnici...";

        }

        var ok = window.PRS_GameEngine.upgradeVillage(this.state, nodeId);

        if (ok) {

            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            this.showPawnToast(this.state.currentPlayerIndex, "Povýšeno panství!", "👑", "#38bdf8");

        }

        this.isBoardStaticDirty = true;

        this.renderGameScreen();

        var self = this;

        var p = this.saveSessionAuto();

        if (p && p.finally) {

            p.finally(function () {

                self.isActionProcessing = false;

            });

        } else {

            setTimeout(function () { self.isActionProcessing = false; }, 350);

        }

    },

    handleTrainMaster: function (skill) {

        var ok = window.PRS_GameEngine.trainAtMaster(this.state, skill);

        if (ok && window.PRS_Audio) window.PRS_Audio.playNotice();

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    handleBuyPack: function (tier) {

        var ok = window.PRS_GameEngine.buyItemPack(this.state, tier);

        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    handleToggleEquip: function (itemId, itemIndex, playerIndex) {

        if (!this.state) return;

        var res = window.PRS_GameEngine.toggleEquipItem(this.state, itemId, itemIndex, playerIndex);

        if (!res.ok) {

            if (this.addLog) this.addLog(res.message, "action");

            return;

        }

        if (window.PRS_Audio) window.PRS_Audio.playItem();

        this.renderLogs();

        this.renderPlayersStandings();

        this.renderActivePlayerPanel();

        this.renderHeartTrack();

        this.renderStandingNodeCard();

        if (this.activeSidebarTab === "property") this.renderSidebarPropertyPanel();

        if (this.activeSidebarTab === "log") this.renderSidebarQuickLogPanel();

        this.saveSessionAuto();

    },

    handleSellAsset: function (assetType, assetId, itemIndex, playerIndex) {

        var ok = window.PRS_GameEngine.sellAsset(this.state, assetType, assetId, itemIndex, playerIndex);

        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();

        this.isBoardStaticDirty = true;

        this.renderGameScreen();

    },

    handleLiquidateAsset: function (assetType, assetId) {

        if (!this.state) return;

        var res = window.PRS_GameEngine.liquidateAssetForDebt(this.state, assetType, assetId);

        if (res && res.ok) {

            if (window.PRS_Audio) window.PRS_Audio.playCoin();

        } else if (res && res.message) {

            this.addLog(res.message, "action");

        }

        this.isBoardStaticDirty = true;

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    handleAutoLiquidateDebt: function () {

        if (!this.state) return;

        var p = this.state.players[this.state.currentPlayerIndex];

        window.PRS_GameEngine.autoLiquidateDebt(this.state, p);

        if (window.PRS_Audio) window.PRS_Audio.playCoin();

        this.isBoardStaticDirty = true;

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    syncFocusToActivePlayer: function (smooth) {
        if (!this.state || !this.state.players) return;
        var activeP = this.state.players[this.state.currentPlayerIndex];
        if (!activeP) return;

        this.selectedNodeId = activeP.nodeId;
        this.inspectedPlayerIndex = activeP.index;
        this.inspectNode(activeP.nodeId);

        // Bezpečné vycentrování pohledu na figurku nově aktivního hráče (vždy, i po dohrání celého kola)
        this.centerOnActivePlayer(true, smooth !== false);

        // Kompletní překreslení panelů, aby focus a žlutý lem okamžitě přeskočily na nového hráče
        this.renderGameScreen();

        if (activeP.type === "Human") {
            if (window.PRS_Audio) window.PRS_Audio.playNotice();
            this.showPawnToast(activeP.index, "Jsi na řadě! (" + activeP.name + ")", "🎲", "#38bdf8");
        }
    },

    handleEndTurn: function () {

        if (this.isActionProcessing || this.isSavingSession) return;

        this.isActionProcessing = true;

        var endBtns = document.querySelectorAll("[onclick*='handleEndTurn']");

        for (var i = 0; i < endBtns.length; i++) {

            endBtns[i].disabled = true;

            endBtns[i].style.opacity = "0.5";

            endBtns[i].style.pointerEvents = "none";

            endBtns[i].innerHTML = "⏳ Předávám tah...";

        }

        if (window.PRS_Audio) window.PRS_Audio.playStep();

        this.isMoveAnimating = false;

        this.animatingPlayerIndex = null;

        this.animTokenPos = null;

        if (this.autoBotTimer) {

            clearTimeout(this.autoBotTimer);

            this.autoBotTimer = null;

        }

        window.PRS_GameEngine.endTurn(this.state);

        this.syncFocusToActivePlayer(true);

        var self = this;

        var p = this.saveSessionAuto();

        var onDone = function () {

            self.isActionProcessing = false;

            self.scheduleBotTurnIfNeeded();

            if (self.startTurnTimer) self.startTurnTimer();

        };

        if (p && p.finally) {

            p.finally(onDone);

        } else {

            onDone();

        }

    },

    skipToNextHumanTurn: function () {

        if (!this.state || this.state.phase === "GAME_OVER") return;

        if (this.autoBotTimer) {

            clearTimeout(this.autoBotTimer);

            this.autoBotTimer = null;

        }

        this.isMoveAnimating = false;

        this.animatingPlayerIndex = null;

        this.animTokenPos = null;

        var safetyLimit = 16;

        while (safetyLimit-- > 0) {

            var cur = this.state.players[this.state.currentPlayerIndex];

            if (!cur || cur.type === "Human" || this.state.phase === "GAME_OVER") break;

            window.PRS_GameEngine.executeBotTurn(this.state);

        }

        var activeP = this.state.players[this.state.currentPlayerIndex];

        if (activeP) {

            this.selectedNodeId = activeP.nodeId;
            this.inspectedPlayerIndex = activeP.index;
            this.inspectNode(activeP.nodeId);
            this.centerOnActivePlayer(true, true);
            this.showPawnToast(activeP.index, "Jsi na řadě! (" + activeP.name + ")", "🎲", "#38bdf8");

        }

        this.renderGameScreen();

        this.saveSessionAuto();

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

    },

    stepBotNow: function () {

        var self = this;

        if (!self.state || self.state.phase === "GAME_OVER") return;

        var bot = self.state.players[self.state.currentPlayerIndex];

        if (!bot || bot.type === "Human") return;

        if (self.isMoveAnimating) {

            if (self.autoBotTimer) clearTimeout(self.autoBotTimer);

            self.autoBotTimer = setTimeout(function () {

                self.stepBotNow();

            }, 80);

            return;

        }

        if (self.state.phase === "ROLL") {

            self.executeRollAndAnimateMove(bot, function () {

                window.PRS_GameEngine.executeBotTurn(self.state);

                self.syncFocusToActivePlayer(true);

                self.saveSessionAuto();

                if (self.state.lastDuelResult) {
                    var dRes = self.state.lastDuelResult;
                    self.state.lastDuelResult = null;
                    self.showDuelResultModal(dRes, dRes.type);
                    return;
                }

                self.scheduleBotTurnIfNeeded();

            });

        } else {

            window.PRS_GameEngine.executeBotTurn(self.state);

            self.syncFocusToActivePlayer(true);

            self.saveSessionAuto();

            if (self.state.lastDuelResult) {
                var dRes2 = self.state.lastDuelResult;
                self.state.lastDuelResult = null;
                self.showDuelResultModal(dRes2, dRes2.type);
                return;
            }

            self.scheduleBotTurnIfNeeded();

        }

    },

    scheduleBotTurnIfNeeded: function () {

        var self = this;

        if (this.autoBotTimer) {

            clearTimeout(this.autoBotTimer);

            this.autoBotTimer = null;

        }

        if (!this.autoBotEnabled || !this.state || this.state.phase === "GAME_OVER") return;

        // V online místnosti tahá za boty pouze neuzamčený stůl (-1) nebo hostitel (hráč č. 0), aby dva prohlížeče netahaly za bota současně

        if (this.state.roomCode && this.myOnlinePlayerIndex > 0) return;

        var currentP = this.state.players[this.state.currentPlayerIndex];

        if (currentP && currentP.type !== "Human" && !currentP.claimedBy) {

            var delay = this.state.roomCode ? 800 : (self.isMoveAnimating ? 220 : 130);

            this.autoBotTimer = setTimeout(function () {
                if (!self.state) return;
                var checkP = self.state.players[self.state.currentPlayerIndex];
                if (!checkP || checkP.type === "Human" || checkP.claimedBy) return;
                self.stepBotNow();
            }, delay);

        }

    }
    });
})();
