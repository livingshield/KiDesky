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

        var player = this.state.players[this.state.currentPlayerIndex];

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

        if (heartsEl) heartsEl.textContent = "💖 " + player.totalHearts + "/" + this.state.config.targetHearts;

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

                    standard: "🎲 HODIT KOSTKOU (1–6)",

                    cautious: "🚶 OPATRNÝ KROK (1–4)",

                    horse: "🏇 KOŇSKÝ CVAL (2d6)"

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

        } else if (pa.canResolveFestival) {

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border-color:#fbcfe8;" onclick="PRS_App.handleResolveFestival()">🏆 VYHODNOTIT SLAVNOST (💖)</button>');

        } else if (pa.canChooseDilemma && pa.chanceCard && pa.chanceCard.options && pa.chanceCard.options.length >= 2) {

            var cDil = pa.chanceCard;

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #0284c7, #0369a1); color:#fff; border-color:#38bdf8;" onclick="PRS_App.handleChooseChanceDilemma(0)">' + cDil.options[0].icon + ' ' + this.escapeHtml(cDil.options[0].title) + '</button>');

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #7c3aed, #6d28d9); color:#fff; border-color:#c084fc;" onclick="PRS_App.handleChooseChanceDilemma(1)">' + cDil.options[1].icon + ' ' + this.escapeHtml(cDil.options[1].title) + '</button>');

        } else if (pa.chanceCard) {

            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; border-color:#fef08a;" onclick="PRS_App.toggleChanceCardFlip(\'' + pa.chanceCard.id + '\')">📜 OTOČIT KARTU NÁHODY</button>');

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

            var canAffordUpg = player.gold >= pa.upgradeCost;

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" style="flex:1.4;" ' + (!canAffordUpg ? 'disabled' : '') + ' onclick="PRS_App.handleUpgradeVillage(' + pa.nodeId + ')">🏘️ POVÝŠIT (' + pa.upgradeCost + ' zl.)</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +

                '</div>');

        } else if (pa.canShopMerchant) {

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #b45309, #d97706); color:#fff;" onclick="PRS_App.openArmoryModal()">🛒 TRH & ZBROJNICE</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +

                '</div>');

        } else if (pa.canTrainMaster) {

            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +

                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #4f46e5, #4338ca); color:#fff;" onclick="PRS_App.toggleMobileSheet(\'action\')">🎓 CVIČIT U MISTRA</button>' +

                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +

                '</div>');

        } else {

            htmlBtns.push('<button class="mobile-btn-primary" onclick="PRS_App.handleEndTurn()">➡️ UKONČIT TAH</button>');

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

        if (pa.canUpgradeVillage && p.gold >= pa.upgradeCost) {

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

                '<div><small style="color:var(--text-muted);">⚔️ Boj</small><div style="font-weight:bold; font-size:1.1rem; color:#f87171;">' + stats.boj + '</div></div>' +

                '<div><small style="color:var(--text-muted);">🏇 Jízda</small><div style="font-weight:bold; font-size:1.1rem; color:#60a5fa;">' + stats.jizda + '</div></div>' +

                '<div><small style="color:var(--text-muted);">💃 Tanec</small><div style="font-weight:bold; font-size:1.1rem; color:#f472b6;">' + stats.tanec + '</div></div>' +

                '<div><small style="color:var(--text-muted);">✨ Charisma</small><div style="font-weight:bold; font-size:1.1rem; color:#fbbf24;">' + stats.charisma + '</div></div>' +

                '</div>';

            html += '<h4 style="font-size:0.9rem; margin-bottom:6px; color:var(--gold-light);">🎒 Předměty a zbraně (' + p.items.length + '):</h4>';

            if (p.items.length === 0) {

                html += '<p style="color:var(--text-muted); font-size:0.84rem;">Batoh je prázdný. Zastav se u Kupce nebo v Královské zbrojnici.</p>';

            } else {

                html += '<div style="display:flex; flex-direction:column; gap:6px;">';

                for (var i = 0; i < p.items.length; i++) {

                    var it = p.items[i];

                    html += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:6px 10px; border-radius:8px; border:1px solid rgba(212,175,55,0.2);">' +

                        '<div>' + (it.icon || '📦') + ' <strong>' + this.escapeHtml(it.name) + '</strong> <small style="color:var(--gold-light); font-weight:600;">' + (it.slot ? ('[' + this.formatSlotLabel(it.slot, true) + ']') : '') + '</small></div>' +

                        '<div style="font-weight:600; color:var(--gold-light); font-size:0.82rem;">' + (it.bonusText || (it.price + ' zl.')) + '</div>' +

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

                for (var n = 0; n < p.ownedNodes.length; n++) {

                    var ndId = p.ownedNodes[n];

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

    renderTopPlayersHud: function () {

        var el = document.getElementById("board-top-players-hud");

        if (!el || !this.state || !this.state.players) return;

        var target = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;

        var curIdx = this.state.currentPlayerIndex;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : curIdx;

        var html = [];

        for (var i = 0; i < this.state.players.length; i++) {

            var p = this.state.players[i];

            var isTurn = (i === curIdx);

            var isInspected = (i === inspIdx);

            var pct = Math.min(100, Math.round((p.totalHearts / target) * 100));

            html.push('<div class="top-hud-card ' + (isTurn ? 'is-turn' : '') + ' ' + (isInspected ? 'is-inspected' : '') + ' ' + (p.isEliminated ? 'is-eliminated' : '') + '" ' +

                'style="border-left: 4px solid ' + p.color + ';" ' +

                'onclick="PRS_App.selectPlayerToInspect(' + i + ')" ' +

                'onmouseenter="PRS_App.showPlayerTooltip(event, ' + i + ')" ' +

                'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                'title="' + this.escapeHtml(p.name) + ' – klepnutím zobrazíš detail rytíře">' +

                '  <div class="top-hud-row-main">' +

                '    <div class="top-hud-identity">' +

                '      <span class="top-hud-avatar" style="background:' + p.color + ';">' + p.badge + '</span>' +

                '      <div class="top-hud-name-col">' +

                '        <div class="top-hud-name" style="' + (isTurn ? 'color:#fef08a; font-weight:800;' : '') + '">' +

                this.escapeHtml(p.name) +

                (p.isEliminated ? ' <small style="color:#ef4444; font-weight:bold;">💀</small>' : '') +

                '        </div>' +

                (isTurn ? '        <span class="top-hud-turn-badge">👑 Na tahu</span>' : '') +

                '      </div>' +

                '    </div>' +

                '    <div class="top-hud-stats">' +

                '      <div class="top-hud-gold">🪙 <strong>' + p.gold.toLocaleString("cs-CZ") + '</strong> zl.</div>' +

                '      <div class="top-hud-hearts">💖 ' + p.totalHearts + ' / ' + target + '</div>' +

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

        if (raceEl) {

            var raceHtml = '<div class="princess-race-header">' +

                '<span>🏆 ZÁVOD O PRINCEZNINO SRDCE</span>' +

                '<span style="color:#f472b6;">Cíl: ' + target + ' ❤️</span>' +

                '</div>' +

                '<div class="princess-race-track">' +

                '  <div class="race-milestones">';

            var stepCount = 5;

            for (var m = 0; m <= stepCount; m++) {

                var stepVal = Math.round((target / stepCount) * m);

                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>' + stepVal + ' ❤️</span></div>';

            }

            raceHtml += '  </div>';

            for (var rIdx = 0; rIdx < this.state.players.length; rIdx++) {

                var plTrack = this.state.players[rIdx];

                var isActTrack = (rIdx === this.state.currentPlayerIndex);

                var isInspTrack = (rIdx === inspIdx);

                var pctTrack = Math.min(94, Math.max(3, (plTrack.totalHearts / target) * 88 + 3));

                raceHtml += '<div class="race-token ' + (isInspTrack ? 'inspected-race-token' : '') + '" ' +

                    'style="left:' + pctTrack + '%;background:' + plTrack.color + ';border-color:' + (isActTrack ? '#fbbf24' : (isInspTrack ? '#38bdf8' : '#ffffff')) + ';box-shadow:0 0 ' + (isActTrack ? '14px #fbbf24' : (isInspTrack ? '12px #38bdf8' : '6px rgba(0,0,0,0.6)')) + '; cursor:pointer;" ' +

                    'onclick="PRS_App.selectPlayerToInspect(' + rIdx + ')" ' +

                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + rIdx + ')" ' +

                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                    'title="' + this.escapeHtml(plTrack.name) + ': ' + plTrack.totalHearts + ' ❤️ (' + plTrack.gold.toLocaleString("cs-CZ") + ' zl.) - Klepni pro zobrazení statistik">' + (rIdx + 1) + '</div>';

            }

            raceHtml += '  <div class="race-finish-crown" title="Královský hrad &amp; Princezna">👑🏰</div>' +

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

                    'title="Kliknutím zobrazíš podrobné statistiky a výbavu rytíře ' + this.escapeHtml(p.name) + '">' +

                    '<div class="hp-header">' +

                    '  <span class="hp-name-wrap">' + p.badge + ' <strong class="hp-name-txt">' + this.escapeHtml(p.name) + '</strong> ' + (p.type !== "Human" ? '<small class="bot-tag">PC</small>' : '<small class="bot-tag" style="background:#0284c7;color:#fff;">Hráč</small>') + (isInspected ? ' <span style="font-size:0.72rem; color:#fde047; font-weight:600; margin-left:4px;">👁️ Zobrazen</span>' : '') + '</span>' +

                    '  <span class="hp-hearts">' + p.totalHearts + ' / ' + target + ' ❤️</span>' +

                    '</div>' +

                    '<div class="hp-progress-bg"><div class="hp-progress-fill" style="width:' + pct + '%;background:' + p.color + '"></div></div>' +

                    '<div class="hp-sub">' +

                    '  <span>💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</span>' +

                    '  <span>🐎 Chov: +' + p.breedingHearts + ' ❤️</span>' +

                    '  <span>⚔️' + p.skills.boj + ' 🏇' + p.skills.jizda + ' 💃' + p.skills.tanec + ' 👑' + p.skills.charisma + '</span>' +

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

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    renderSidebarPropertyPanel: function () {

        var el = document.getElementById("sidebar-player-property-panel");

        if (!el || !this.state) return;

        var player = this.state.players[this.state.currentPlayerIndex];

        if (!player) return;

        var nodes = this.state.board.nodes || [];

        var owned = [];

        var totalTax = 0;

        var villageCount = 0;

        var cityCount = 0;

        var castleCount = 0;

        for (var i = 0; i < nodes.length; i++) {

            var nd = nodes[i];

            if (nd.owner === player.index) {

                owned.push(nd);

                if (nd.type === "ANIMAL" && window.PRS_GameEngine.calculateAnimalRent) {

                    totalTax += window.PRS_GameEngine.calculateAnimalRent(this.state, nd, player);

                } else {

                    totalTax += (nd.rent || 0);

                }

                if (nd.level === 3 || nd.type === "CASTLE") castleCount++;

                else if (nd.level === 2 || nd.type === "TOWN") cityCount++;

                else villageCount++;

            }

        }

        // Zvířecí stáda

        var stats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

        var grandYield = totalTax;

        var html = [];

        html.push('<div class="property-panel-card">');

        html.push('  <div class="property-header-banner">');

        html.push('    <div>');

        html.push('      <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:700; color:#fef08a;">' + player.badge + ' ' + this.escapeHtml(player.name) + '</div>');

        html.push('      <div style="font-size:0.75rem; color:#cbd5e1;">Vlastněná panství: <strong>' + owned.length + ' polí</strong></div>');

        html.push('    </div>');

        html.push('    <div class="property-yield-badge" title="Předpokládaný pasivní výnos z nájmů za kolo">💰 +' + grandYield.toLocaleString("cs-CZ") + ' zl. / kolo</div>');

        html.push('  </div>');

        // Seznam sídel

        html.push('  <div style="font-size:0.8rem; font-weight:700; color:#fca5a5; margin-bottom:0.4rem; display:flex; justify-content:space-between;">');

        html.push('    <span>🏰 Sídla & Panství:</span>');

        html.push('    <small style="color:#94a3b8;">' + villageCount + ' vesnic • ' + cityCount + ' měst • ' + castleCount + ' hradů</small>');

        html.push('  </div>');

        if (owned.length === 0) {

            html.push('  <div style="font-size:0.8rem; color:#94a3b8; font-style:italic; padding:0.6rem 0; text-align:center;">Zatím nevlastníš žádná pole království.</div>');

        } else {

            html.push('  <div class="property-list">');

            for (var o = 0; o < owned.length; o++) {

                var pNode = owned[o];

                var icon = (pNode.level === 3 || pNode.type === "CASTLE") ? "🏰" : ((pNode.level === 2 || pNode.type === "TOWN") ? "🏛️" : "🏘️");

                var lvlName = (pNode.level === 3) ? "Hrad" : ((pNode.level === 2) ? "Město" : "Vesnice");

                html.push('    <div class="property-item-row">');

                html.push('      <div class="property-item-left">');

                html.push('        <span style="font-size:1.15rem;">' + icon + '</span>');

                html.push('        <div>');

                html.push('          <div style="font-weight:700; color:#f8fafc;">' + this.escapeHtml(pNode.name) + '</div>');

                html.push('          <div style="font-size:0.72rem; color:#cbd5e1;">' + lvlName + ' &bull; Nájem: ' + (pNode.rent || 0) + ' zl.</div>');

                html.push('        </div>');

                html.push('      </div>');

                if (pNode.level === 1 && pNode.type === "PROPERTY") {

                    html.push('      <button class="rules-subnav-btn" style="font-size:0.7rem; padding:2px 7px;" onclick="PRS_App.handleUpgradeVillage(' + pNode.id + ')">Povýšit</button>');

                }

                html.push('    </div>');

            }

            html.push('  </div>');

        }

        // Chov zvířat a stáj

        html.push('  <div style="font-size:0.8rem; font-weight:700; color:#fca5a5; margin-top:0.6rem; margin-bottom:0.2rem;">🐎 Stáje a chov zvěře:</div>');

        html.push('  <div class="property-animal-grid">');

        html.push('    <div class="property-animal-slot"><span class="property-animal-icon">🐴</span><span class="property-animal-qty">' + stats.horses + ' koní</span></div>');

        html.push('    <div class="property-animal-slot"><span class="property-animal-icon">🐄</span><span class="property-animal-qty">' + stats.cattle + ' krav</span></div>');

        html.push('    <div class="property-animal-slot"><span class="property-animal-icon">🐑</span><span class="property-animal-qty">' + stats.sheep + ' ovcí</span></div>');

        html.push('    <div class="property-animal-slot"><span class="property-animal-icon">🐖</span><span class="property-animal-qty">' + stats.pigs + ' prasat</span></div>');

        html.push('    <div class="property-animal-slot"><span class="property-animal-icon">🐕</span><span class="property-animal-qty">' + stats.dogs + ' psů</span></div>');

        html.push('    <div class="property-animal-slot"><span class="property-animal-icon">🦅</span><span class="property-animal-qty">' + stats.falcons + ' sokolů</span></div>');

        html.push('  </div>');

        html.push('</div>');

        el.innerHTML = html.join("");

    },

    renderSidebarQuickLogPanel: function () {

        var el = document.getElementById("sidebar-quick-log-panel");

        if (!el || !this.state) return;

        var logs = this.state.log || [];

        var recent = logs.slice(Math.max(0, logs.length - 8)).reverse();

        var html = [];

        html.push('<div class="quick-log-card">');

        html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.4rem; border-bottom:1px solid rgba(212,175,55,0.25);">');

        html.push('    <div style="font-family:\'Cinzel\',serif; font-size:0.98rem; font-weight:700; color:#fef08a;">📜 Královská kronika</div>');

        html.push('    <a href="#board-lower-dashboard" onclick="event.preventDefault(); document.getElementById(\\\'board-lower-dashboard\\\').scrollIntoView({behavior:\\\'smooth\\\'});" style="font-size:0.75rem; color:#38bdf8; text-decoration:none;">Všechny záznamy ↓</a>');

        html.push('  </div>');

        if (recent.length === 0) {

            html.push('  <div style="font-size:0.8rem; color:#94a3b8; font-style:italic; padding:0.6rem 0; text-align:center;">Kronika zatím mlčí. Hodem kostkou začne dobrodružství!</div>');

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

        var isMyCurrentStandingTile = (inspectId === p.nodeId);

        var bmpUrl = this.getTileBitmapUrl(node);

        if (!bmpUrl && (node.type === "START" || node.type === "CASTLE" || node.code === "START" || (node.code && node.code.indexOf("START") !== -1))) {

            bmpUrl = "assets/tiles/castle.png";

        }

        var price = window.PRS_GameEngine.getNodePrice(this.state, node);

        var ownerText = "Volné (Nikdo nevlastní)";

        var ownerBadge = "";

        var isOwnedByMe = false;

        var isOwnedByOther = false;

        if (node.owner !== null && this.state.players[node.owner]) {

            var ownerPlayer = this.state.players[node.owner];

            ownerText = ownerPlayer.badge + " " + this.escapeHtml(ownerPlayer.name);

            ownerBadge = '<span style="color:' + ownerPlayer.color + '; font-weight:bold;">' + ownerText + '</span>';

            if (node.owner === this.state.currentPlayerIndex) isOwnedByMe = true;

            else isOwnedByOther = true;

        }

        var description = "";

        var statusPill = "";

        if (node.type === "START") {

            description = "Královský hradní Start. Při průchodu nebo vstupu získáváš královský žold <strong>+3 000 zl.</strong> a zotavuješ se z úmrtí.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">👑 Královská brána</span>';

        } else if (node.type === "ANIMAL") {

            var animalName = (node.subtype === "kun" ? "Kůň" : (node.subtype === "pes" ? "Pes" : "Sokol"));

            if (isOwnedByMe) {

                description = "Tvé zvíře (" + animalName + " ze sady č. " + node.setId + "). Pokud na něj vstoupí soupeř, zaplatí ti nájemné 20 % / 40 % / 80 % ceny sady.";

                statusPill = '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac; border-color:#22c55e;">🛡️ Tvé zvíře</span>';

            } else if (isOwnedByOther) {

                var rent = Math.round(price * 0.2);

                description = "Zvíře vlastní " + ownerBadge + ". Za stoupnutí na toto pole platíš majiteli nájemné (cca <strong>" + rent + " zl.</strong>).";

                statusPill = '<span class="standing-tile-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5; border-color:#ef4444;">💸 Cizí majetek</span>';

            } else {

                description = "Volné zvíře (" + animalName + " ze sady č. " + node.setId + "). Kůň je nutný pro Závod a Turnaj, Pes a Sokol pro Turnaj a chovatelskou prémii (až +3 💖).";

                statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">🛒 Koupě: ' + price + ' zl.</span>';

            }

        } else if (node.type === "VILLAGE") {

            var lvl = node.villageLevel || 1;

            if (isOwnedByMe) {

                description = "Tvá vesnice na úrovni <strong>" + lvl + "/3</strong> (" + "★".repeat(lvl) + "). Při návštěvě Výběrčího daní (VD) ti přináší stálý výnos <strong>" + (lvl === 1 ? '500' : (lvl === 2 ? '900' : '1 400')) + " zl.</strong>";

                statusPill = '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac; border-color:#22c55e;">🏘️ Tvá vesnice</span>';

            } else if (isOwnedByOther) {

                description = "Vesnici vlastní " + ownerBadge + ". Přináší majiteli zlaťáky pokaždé, když kdokoliv stoupne na Výběrčího daní.";

                statusPill = '<span class="standing-tile-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5; border-color:#ef4444;">🏘️ Panství soupeře</span>';

            } else {

                description = "Volná vesnice. Lze ji koupit za <strong>" + price + " zl.</strong> a následně dvakrát povýšit. Daňový výnos: 500 / 900 / 1 400 zl.";

                statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">🛒 Koupě: ' + price + ' zl.</span>';

            }

        } else if (node.type === "TOWN") {

            description = isOwnedByMe ? "Tvé opevněné město. Přináší stálý daňový výnos <strong>1 200 zl.</strong> u Výběrčího daní." : "Královské město. Cena: " + price + " zl., výnos: 1 200 zl. Vlastník: " + (ownerBadge || "Nikdo");

            statusPill = isOwnedByMe ? '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac;">🏙️ Tvé město</span>' : '<span class="standing-tile-badge">🏙️ Město: ' + price + ' zl.</span>';

        } else if (node.type === "CASTLE") {

            description = "Pevný hrad. Přináší daňový výnos <strong>2 500 zl.</strong> a majiteli trvale propůjčuje <strong>+1 Charisma</strong>. Vlastník: " + (ownerBadge || "Nikdo");

            statusPill = isOwnedByMe ? '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac;">🏯 Tvůj hrad</span>' : '<span class="standing-tile-badge">🏯 Hrad: ' + price + ' zl.</span>';

        } else if (node.type === "MASTER") {

            var skName = (node.skill === "boj" ? "Boj ⚔️" : (node.skill === "jizda" ? "Jízda 🏇" : (node.skill === "tanec" ? "Tanec 💃" : (node.skill === "charisma" ? "Charisma ✨" : "Libovolná vlastnost (Velmistr)"))));

            description = "Sídlo Mistra (" + skName + "). Pokud hodíš <strong>4, 5 nebo 6</strong>, mistr tě přijme do výcviku na další úroveň (1 000–5 000 zl.).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(147,51,234,0.25); color:#d8b4fe; border-color:#a855f7;">🎓 Výcvik (hod 4–6)</span>';

        } else if (node.type === "MERCHANT") {

            description = "Královský trh. Můžeš zde nakupovat balíčky Věcí 1., 2. a 3. stupně (zbraně, zbroj, šaty) a prodávat nepotřebný majetek za výhodnější kurz (1/2 za věci, 100 % za budovy).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(16,185,129,0.25); color:#6ee7b7; border-color:#10b981;">⚖️ Královský trh</span>';

        } else if (node.type === "QUEST") {

            description = "Bojový úkol (" + node.name + "). Zde se utkáš v souboji kostkou se zvěří, monstrem nebo drakem. Vítězství přináší zlato a zápis do kroniky.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(220,38,38,0.25); color:#fca5a5; border-color:#ef4444;">⚔️ Bojový úkol</span>';

        } else if (node.type === "FESTIVAL") {

            description = "Místo konání Královských Slavností (Turnaj, Ples, Závod). Zde získáváš nejvíce <strong>Srdcí princezny 💖</strong> do Bodové osy!";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(236,72,153,0.25); color:#fbcfe8; border-color:#ec4899;">💖 Slavnost princezny</span>';

        } else if (node.type === "TAX") {

            description = "Královský výběrčí daní. Hráč, který sem vstoupí, okamžitě získá zlaťáky ze všech svých vesnic, měst a hradů!";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a; border-color:#eab308;">👑 Výběr daní</span>';

        } else if (node.type === "BONUS") {

            description = "Královská prémiová cesta. Hráč při vstupu okamžitě získává bonus <strong>+" + (node.bonusGold || 200) + " zl.</strong>";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a;">💰 Bonus +' + (node.bonusGold || 200) + ' zl.</span>';

        } else if (node.type === "JESTER") {

            description = "Kejklíř (" + node.name + "). Každý vlastněný kejklíř zvyšuje nájemné, které ti soupeři platí při vstupu na tvé kejklíře.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(168,85,247,0.25); color:#e9d5ff;">🃏 Kejklíř: ' + price + ' zl.</span>';

        } else if (node.type === "CHANCE") {

            description = "Pole osudu (Náhoda). Taháš náhodnou kartu s nečekanou událostí nebo královským ediktem.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(59,130,246,0.25); color:#bfdbfe;">❓ Karta Náhody</span>';

        } else if (node.type === "PRISON") {

            description = "Královská šatlava. Zadržení rytíři zde musí složit kauci 1 000 zl., pokusit se o útěk (kostka 6), nebo si odsedět trest.";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(113,113,122,0.25); color:#e4e4e7; border-color:#71717a;">⛓️ Královská šatlava</span>';

        } else if (node.type === "HOSPITAL") {

            description = "Královský lazaret (Špitál). Zde se léčí rytíři po těžkých soubojích s monstry a drakem, a mohou zakoupit Hojivý lektvar (+1 Boj, +0.5 💖 za 800 zl.).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(2,132,199,0.25); color:#7dd3fc; border-color:#0284c7;">🏥 Královský lazaret</span>';

        } else if (node.type === "TAVERN") {

            description = "Hostinec U Zlatého korbelu. Rytíři zde hrají kostky s krčmářem o zlaťáky (sázka 500 zl.) nebo zvou společnost na rundu pro zvýšení slávy (+0.5 💖 za 400 zl.).";

            statusPill = '<span class="standing-tile-badge" style="background:rgba(217,119,6,0.25); color:#fde68a; border-color:#d97706;">🍺 Krčma U Korbelu</span>';

        } else {

            description = "Speciální místo na královské trase.";

            statusPill = '<span class="standing-tile-badge">' + node.code + '</span>';

        }

        var headerTag = isMyCurrentStandingTile

            ? '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25); color:var(--gold-light); border-color:var(--gold);">📍 ZDE PRÁVĚ STOJÍŠ (' + node.code + ')</span>'

            : '<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">' +

                '<span class="standing-tile-badge" style="background:rgba(56,189,248,0.2); color:#7dd3fc; border-color:#38bdf8;">🔍 PROZKOUMÁVÁŠ POLE (' + node.code + ')</span>' +

                '<button class="btn-secondary" style="padding:0.12rem 0.45rem; font-size:0.75rem;" onclick="PRS_App.inspectNode(' + p.nodeId + ')">🎯 Zpět na mé pole</button>' +

              '</div>';

        var imgHtml = bmpUrl

            ? '<img src="' + this.escapeHtml(bmpUrl) + '" alt="' + this.escapeHtml(node.name) + '" onerror="this.onerror=null; this.src=\'assets/tiles/castle.png\';" />'

            : ((node.type === "START" || node.type === "CASTLE" || node.code === "START")

                ? '<img src="assets/tiles/castle.png" alt="' + this.escapeHtml(node.name) + '" />'

                : '<span class="emoji-icon">' + node.icon + '</span>');

        var merchantBtnHtml = (node.type === "MERCHANT")

            ? '<button class="btn-action-buy" style="margin-top:0.45rem; width:100%; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:0.4rem;" onclick="PRS_App.openArmoryModal()">🛒 Otevřít Královskou zbrojnici &amp; Trh</button>'

            : '';

        el.innerHTML = '<div class="standing-tile-card" style="' + (isMyCurrentStandingTile ? '' : 'border-color:#38bdf8; box-shadow:0 6px 20px rgba(56,189,248,0.25);') + '">' +

            '  <div class="standing-tile-header">' +

            '    <div class="standing-tile-medallion">' + imgHtml + '</div>' +

            '    <div class="standing-tile-meta">' +

            '      ' + headerTag +

            '      <div class="standing-tile-title">' + node.icon + ' ' + this.escapeHtml(node.name) + '</div>' +

            '    </div>' +

            '  </div>' +

            '  <div class="standing-tile-body">' +

            '    <div style="margin-bottom:0.35rem;">' + description + '</div>' +

            '    <div class="standing-tile-status-row">' +

            '      <span>' + statusPill + '</span>' +

            '      <span style="color:var(--text-muted); font-size:0.78rem;">Pozice: ' + (node.id + 1) + ' / ' + this.state.board.nodes.length + '</span>' +

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

        this.renderLowerKnightDetail();

        if (this.state.players[pIdx]) {

            this.inspectNode(this.state.players[pIdx].nodeId);

        }

    },

    // --- DETAILNÍ KARTA STATISTIK ZVOLENÉHO RYTÍŘE V DOLNÍM SÁLU ---,

    renderLowerKnightDetail: function () {

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

            '      <span style="font-size:1.8rem;">' + p.badge + '</span>' +

            '      <div>' +

            '        <h3 style="margin:0; font-family:\'Cinzel\',serif; color:' + p.color + '; font-size:1.25rem;">' + this.escapeHtml(p.name) + ' ' + (p.type !== "Human" ? '<small class="bot-tag">PC</small>' : '<small class="bot-tag" style="background:#0284c7;color:#fff;">Hráč</small>') + '</h3>' +

            '        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">' +

            (isTurn ? '<strong style="color:#fbbf24;">⚔️ Právě na tahu</strong> • ' : '') +

            'Stojí na poli: <strong>' + (currNode ? this.escapeHtml(currNode.name) : "Neznámé") + '</strong> (Pole #' + p.nodeId + ')' +

            '        </div>' +

            '      </div>' +

            '    </div>' +

            '  </div>' +

            '  <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">' +

            '    <div style="text-align:right;">' +

            '      <div style="font-size:1.08rem; font-weight:700; color:#f472b6;">' + p.totalHearts + ' / ' + targetHearts + ' ❤️</div>' +

            '      <div style="font-size:0.85rem; color:#facc15; font-weight:600;">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</div>' +

            '    </div>' +

            '    <button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.8rem; border-color:var(--gold); color:var(--gold-light);" onclick="window.scrollTo({top:0, behavior:\'smooth\'}); PRS_App.centerOnActivePlayer();" title="Přejít nahoru k hernímu plánu a ukázat figurku">' +

            '      🎯 Ukázat na desce ↑' +

            '    </button>' +

            '  </div>' +

            '</div>';

        // 4 Cnosti rytíře

        html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:0.55rem; margin-bottom:0.95rem;">' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    <div style="font-size:0.74rem; color:var(--text-muted);">⚔️ Bojová síla</div>' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#fca5a5;">' + st.boj + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.boj + '/5)</small></div>' +

            '  </div>' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    <div style="font-size:0.74rem; color:var(--text-muted);">🏇 Jezdecké umění</div>' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#7dd3fc;">' + st.jizda + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.jizda + '/5)</small></div>' +

            '  </div>' +

            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(244,114,182,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +

            '    <div style="font-size:0.74rem; color:var(--text-muted);">💃 Dvorní tanec</div>' +

            '    <div style="font-size:1.15rem; font-weight:bold; color:#f472b6;">' + st.tanec + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.tanec + '/5)</small></div>' +

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

        var el = document.getElementById("all-players-standings-box");

        if (!el || !this.state) return;

        var target = this.state.config.targetHearts;

        var curIdx = this.state.currentPlayerIndex;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : curIdx;

        var html = '<div class="standings-card">' +

            '  <div class="standings-header">' +

            '    <span>🏆 STAV RYTÍŘŮ &amp; ZÁVOD</span>' +

            '    <span style="color:#f472b6;">Cíl: ' + target + ' 💖</span>' +

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

                '    <span class="sp-badge" style="background:' + p.color + ';"></span>' +

                '    <span class="sp-name" style="' + (isTurn ? 'color:#fef08a; font-weight:700;' : '') + '">' +

                (isTurn ? '👑 ' : '') + this.escapeHtml(p.name) +

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

        var tip = document.getElementById("player-hover-tooltip");

        if (!tip || !this.state || !this.state.players[playerIndex]) return;

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

            '  <span style="font-weight:700; color:' + p.color + '; font-size:0.95rem;">' + p.badge + ' ' + this.escapeHtml(p.name) + '</span>' +

            '  <span style="font-size:0.75rem; color:var(--text-muted);">' + (p.type === "Human" ? "Člověk" : "PC") + '</span>' +

            '</div>' +

            '<div style="display:flex; justify-content:space-between; margin-bottom:0.45rem;">' +

            '  <span style="color:#f472b6; font-weight:700; font-size:0.92rem;">💖 ' + p.totalHearts + ' / ' + target + ' Srdcí</span>' +

            '  <span style="color:#facc15; font-weight:700; font-size:0.92rem;">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</span>' +

            '</div>' +

            '<div style="font-size:0.78rem; color:#bae6fd; margin-bottom:0.45rem;">' +

            '  📍 Pozice: <strong>' + (currNode ? this.escapeHtml(currNode.name) : "-") + '</strong>' +

            '</div>' +

            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem; font-size:0.8rem; background:rgba(0,0,0,0.45); padding:0.45rem; border-radius:6px; margin-bottom:0.45rem;">' +

            '  <div>⚔️ Boj: <strong>' + st.boj + '</strong> <small style="color:var(--text-muted);">(' + p.skills.boj + '/5)</small></div>' +

            '  <div>🏇 Jízda: <strong>' + st.jizda + '</strong> <small style="color:var(--text-muted);">(' + p.skills.jizda + '/5)</small></div>' +

            '  <div>💃 Tanec: <strong>' + st.tanec + '</strong> <small style="color:var(--text-muted);">(' + p.skills.tanec + '/5)</small></div>' +

            '  <div>✨ Charisma: <strong>' + st.charisma + '</strong> <small style="color:var(--text-muted);">(' + p.skills.charisma + '/5)</small></div>' +

            '</div>' +

            '<div style="font-size:0.78rem; color:#e2e8f0; margin-bottom:0.3rem;">' +

            '  🏰 Panství &amp; Chovy: <strong>' + p.ownedNodes.length + '</strong> (Bonus chovu: +' + p.breedingHearts + ' 💖)' +

            '</div>' +

            '<div style="font-size:0.76rem; color:var(--text-muted); white-space:normal; line-height:1.35;">' +

            '  🎒 Aktivní výbava: ' + this.escapeHtml(eqText) +

            '</div>';

        tip.innerHTML = html;

        tip.style.display = "block";

        this.movePlayerTooltip(e);

    },

    movePlayerTooltip: function (e) {

        var tip = document.getElementById("player-hover-tooltip");

        if (!tip || tip.style.display === "none") return;

        var x = e.clientX + 16;

        var y = e.clientY + 16;

        if (x + 310 > window.innerWidth) x = Math.max(10, e.clientX - 320);

        if (y + 240 > window.innerHeight) y = Math.max(10, e.clientY - 250);

        tip.style.left = x + "px";

        tip.style.top = y + "px";

    },

    hidePlayerTooltip: function () {

        var tip = document.getElementById("player-hover-tooltip");

        if (tip) tip.style.display = "none";

    },

    // --- PANEL AKTIVNÍHO HRÁČE A AKCÍ TAHU ---,

    renderActivePlayerPanel: function () {

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

        var horseCount = 0, dogCount = 0, falconCount = 0, villageCount = 0, castleCount = 0;

        var nodesHtml = '';

        if (p.ownedNodes.length > 0) {

            nodesHtml = '<div class="asset-list">';

            for (var j = 0; j < p.ownedNodes.length; j++) {

                var nd = this.state.board.nodes[p.ownedNodes[j]];

                if (!nd) continue;

                if (nd.type === "ANIMAL") {

                    if (nd.setId === 1) horseCount++;

                    else if (nd.setId === 2) dogCount++;

                    else falconCount++;

                } else if (nd.type === "VILLAGE" || nd.type === "TOWN") {

                    villageCount++;

                } else if (nd.type === "CASTLE") {

                    castleCount++;

                }

                var inv = window.PRS_GameEngine.getNodeInvestedValue(this.state, nd);

                var bRatio = atMerchant ? this.state.config.sellRates.merchantBuilding : this.state.config.sellRates.anywhereBuilding;

                var bSellVal = Math.round(inv * bRatio);

                var upgBtn = "";

                if (nd.type === "VILLAGE" && nd.villageLevel < 3) {

                    var uCost = this.state.config.estates.villagePrices[nd.villageLevel] || 1500;

                    upgBtn = '<button class="btn-upg-mini" onclick="PRS_App.handleUpgradeVillage(' + nd.id + ')">★ Povýšit (' + uCost + ' zl.)</button>';

                }

                nodesHtml += '<div class="asset-chip">' +

                    '<span>' + nd.icon + ' <strong>' + this.escapeHtml(nd.name) + '</strong>' + (nd.type === "VILLAGE" ? ' (Úr. ' + nd.villageLevel + '/3)' : '') + '</span>' +

                    '<div>' + upgBtn + '<button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'node\', ' + nd.id + ')">Prodat +' + bSellVal + ' zl.</button></div>' +

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

                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">🏰 Panství a chovy:</div>' +

                '<div class="fiefs-summary-pills" style="margin-bottom:0.4rem;">' +

                '  <span class="fief-pill ' + (horseCount > 0 ? 'active' : '') + '">🐎 ' + horseCount + '</span>' +

                '  <span class="fief-pill ' + (dogCount > 0 ? 'active' : '') + '">🐕 ' + dogCount + '</span>' +

                '  <span class="fief-pill ' + (falconCount > 0 ? 'active' : '') + '">🦅 ' + falconCount + '</span>' +

                '  <span class="fief-pill ' + (villageCount > 0 ? 'active' : '') + '">🏡 ' + villageCount + '</span>' +

                '  <span class="fief-pill ' + (castleCount > 0 ? 'active' : '') + '">🏰 ' + castleCount + '</span>' +

                '</div>' +

                nodesHtml +

                '</div>';

        }

        el.innerHTML = '<div class="compact-knight-card" style="border-left: 4px solid ' + p.color + ';">' +

            '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">' +

            '    <div style="display:flex; align-items:center; gap:0.45rem;">' +

            '      <span class="ks-avatar" style="background:' + p.color + '; width:28px; height:28px; font-size:0.95rem; display:inline-flex; align-items:center; justify-content:center; border-radius:50%;">' + p.badge + '</span>' +

            '      <strong style="color:var(--text-main); font-size:0.92rem;' + (p.isEliminated ? ' text-decoration:line-through; opacity:0.6;' : '') + '">' + this.escapeHtml(p.name) + '</strong>' +

            (p.isEliminated ? '<span style="font-size:0.68rem; padding:1px 5px; background:#dc2626; color:#fff; border-radius:4px; font-weight:bold;">💀 Bankrot</span>' : (isCurTurn ? '<span class="tag-on-turn" style="font-size:0.68rem; padding:1px 5px;">👑 Na tahu</span>' : '')) +

            '    </div>' +

            '    <div style="text-align:right;">' +

            '      <div style="font-size:0.88rem; font-weight:bold; color:var(--gold-light);">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</div>' +

            '      <div style="font-size:0.8rem; font-weight:bold; color:#f472b6;">💖 ' + p.totalHearts + ' / ' + targetHearts + '</div>' +

            '    </div>' +

            '  </div>' +

            '  <!-- 4 ctnosti v jednom kompaktním horizontálním řádku -->' +

            '  <div class="compact-virtues-row">' +

            '    <span class="cv-item" title="Boj: ' + st.boj + ' (výcvik ' + p.skills.boj + '/5)">⚔️ <strong>' + st.boj + '</strong></span>' +

            '    <span class="cv-item" title="Jízda: ' + st.jizda + ' (výcvik ' + p.skills.jizda + '/5)">🏇 <strong>' + st.jizda + '</strong></span>' +

            '    <span class="cv-item" title="Tanec: ' + st.tanec + ' (výcvik ' + p.skills.tanec + '/5)">💃 <strong>' + st.tanec + '</strong></span>' +

            '    <span class="cv-item" title="Charisma: ' + st.charisma + ' (výcvik ' + p.skills.charisma + '/5)">✨ <strong>' + st.charisma + '</strong></span>' +

            '  </div>' +

            '  <!-- Rychlé záložky pro zobrazení batohu a panství -->' +

            '  <div style="display:flex; gap:0.4rem; margin-top:0.4rem;">' +

            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "items" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;items&quot;)">' +

            '      🎒 Výbava (' + p.items.length + ')' + (curTab === "items" ? ' ▲' : ' ▼') +

            '    </button>' +

            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "fiefs" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;fiefs&quot;)">' +

            '      🏰 Panství (' + p.ownedNodes.length + ')' + (curTab === "fiefs" ? ' ▲' : ' ▼') +

            '    </button>' +

            '  </div>' +

            tabContentHtml +

            '</div>';

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

                '  <button class="btn-gold-lg" onclick="PRS_App.openVictoryModal()">👑 Otevřít ceremoniál &amp; Síň slávy</button>' +

                '  <button class="btn-secondary" onclick="PRS_App.startNewGame(true)">🔄 Nová partie</button>' +

                '</div>' +

                '</div>';

            return;

        }

        var player = this.state.players[this.state.currentPlayerIndex];

        var isBot = (player.type !== "Human");

        // Pokud jsme v Online místnosti s uzamčenou rolí (myOnlinePlayerIndex >= 0) a na tahu je jiný lidský hráč:

        if (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot) {

            var myP = this.state.players[this.myOnlinePlayerIndex];

            var myName = myP ? myP.name : "Tvůj rytíř";

            el.innerHTML = '<div class="waiting-turn-card">' +

                '<div style="font-size:1.5rem; margin-bottom:0.35rem;">⏳</div>' +

                '<div style="font-family:\'Cinzel\',serif; font-size:1.05rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">' +

                '  Čeká se na tah spoluhráče: <span style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</span>' +

                '</div>' +

                '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:0.75rem;">' +

                '  Tvůj zvolený rytíř u stolu je <strong>' + this.escapeHtml(myName) + '</strong>. Herní plán se automaticky synchronizuje každé 3 sekundy.' +

                '</p>' +

                '<div style="display:flex; justify-content:center; gap:0.5rem; flex-wrap:wrap;">' +

                '  <button class="btn-secondary" style="font-size:0.8rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.pollOnlineSessionNow(true)">🔄 Zkontrolovat tah hned</button>' +

                '  <button class="btn-secondary" style="font-size:0.78rem;" onclick="PRS_App.setMyOnlinePlayerSlot(-1)">🔓 Odemknout (hrát za všechny u 1 PC)</button>' +

                '</div>' +

                '</div>';

            return;

        }

        if (this.state.phase === "ROLL") {

            var lastRollVal = this.state.lastRoll;

            var diceGlyph = this.getDiceGlyph(lastRollVal || 1);

            var diceStatus = lastRollVal ? ("Minulý hod: <strong>" + lastRollVal + "</strong>") : "Připrav kostku k hodu";

            if (isBot && this.autoBotEnabled) {

                el.innerHTML = '<div class="action-card" style="border-color:rgba(212,175,55,0.4);">' +

                    '<div class="turn-indicator">Na tahu je: <span style="color:' + player.color + ';">' + player.badge + ' <strong>' + this.escapeHtml(player.name) + '</strong></span></div>' +

                    '<div class="bot-auto-status" style="text-align:center; padding:0.9rem 0.6rem; background:rgba(0,0,0,0.35); border-radius:10px; margin:0.6rem 0; border:1px solid rgba(212,175,55,0.22);">' +

                    '  <div style="font-size:1.02rem; font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.35rem;">🤖 ' + this.escapeHtml(player.name) + ' provádí tah...</div>' +

                    '  <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">Tah počítače běží automaticky. Můžeš jej nechat proběhnout nebo přeskočit rovnou na svůj hod.</div>' +

                    '  <button class="btn-gold-lg" style="width:100%; font-size:0.86rem; padding:0.48rem 0.85rem;" onclick="PRS_App.skipToNextHumanTurn()">⚡ Přeskočit přímo na můj tah</button>' +

                    '</div>' +

                    '</div>';

                return;

            }

            var effStats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

            var hasHorse = (player.stats.horses > 0 || effStats.horses > 0);

            var curMode = this.selectedMovementMode || "standard";

            if (curMode === "horse" && !hasHorse) curMode = "standard";

            var modeLabels = {

                standard: "🎲 HODIT KOSTKOU (1–6)",

                cautious: "🚶 OPATRNÝ KROK (1–4)",

                horse: "🏇 KOŇSKÝ CVAL (2d6)"

            };

            var tempoSelectorHtml = isBot ? '' : (

                '<div class="movement-stance-selector">' +

                '  <div style="font-size:0.73rem; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:4px; font-weight:600;">Režim pohybu:</div>' +

                '  <div class="movement-stance-grid">' +

                '    <button type="button" class="btn-tempo-option ' + (curMode === "standard" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'standard\')" title="Běžný hod 1–6">' +

                '      <span class="tempo-icon">🎲</span>' +

                '      <span class="tempo-name">Pochod</span>' +

                '      <span class="tempo-desc">1–6 polí</span>' +

                '    </button>' +

                '    <button type="button" class="btn-tempo-option ' + (curMode === "cautious" ? "active" : "") + '" onclick="PRS_App.selectMovementMode(\'cautious\')" title="Opatrný krok 1–4 pro přesné manévrování">' +

                '      <span class="tempo-icon">🚶</span>' +

                '      <span class="tempo-name">Opatrný</span>' +

                '      <span class="tempo-desc">1–4 pole</span>' +

                '    </button>' +

                '    <button type="button" class="btn-tempo-option ' + (!hasHorse ? "disabled" : (curMode === "horse" ? "active" : "")) + '" ' + (!hasHorse ? 'disabled' : 'onclick="PRS_App.selectMovementMode(\'horse\')"') + ' title="' + (hasHorse ? 'Házíš 2 kostkami (2d6) – volba trysku nebo manévru!' : 'Vyžaduje alespoň 1 koně ve stáji') + '">' +

                '      <span class="tempo-icon">🏇</span>' +

                '      <span class="tempo-name">Cval</span>' +

                '      <span class="tempo-desc">' + (hasHorse ? '2d6 volba' : 'Zamčeno') + '</span>' +

                '    </button>' +

                '  </div>' +

                '</div>'

            );

            var targetHearts = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;

            var treasuryBannerHtml = '<div class="turn-active-treasury-banner">' +

                '<div style="display:flex; justify-content:space-between; align-items:center;">' +

                '  <div style="display:flex; align-items:center; gap:0.45rem;">' +

                '    <span class="top-hud-avatar" style="background:' + player.color + '; width:28px; height:28px; font-size:0.95rem;">' + player.badge + '</span>' +

                '    <div>' +

                '      <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Rytíř na tahu</div>' +

                '      <strong style="color:' + player.color + '; font-size:0.95rem;">' + this.escapeHtml(player.name) + '</strong>' +

                '    </div>' +

                '  </div>' +

                '  <div style="text-align:right;">' +

                '    <div style="font-size:1.15rem; font-weight:900; color:#facc15; text-shadow:0 0 10px rgba(250,204,21,0.5);">🪙 ' + player.gold.toLocaleString("cs-CZ") + ' zl.</div>' +

                '    <div style="font-size:0.76rem; font-weight:bold; color:#f472b6;">💖 ' + player.totalHearts + ' / ' + targetHearts + '</div>' +

                '  </div>' +

                '</div>' +

                '</div>';

            el.innerHTML = '<div class="action-card">' +

                treasuryBannerHtml +

                '<div class="dice-showcase-box">' +

                '  <div>' +

                '    <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Královská hrací kostka</div>' +

                '    <div style="font-size:0.92rem; color:var(--gold-light);">' + diceStatus + '</div>' +

                '  </div>' +

                '  <div id="dice-cube-el" class="dice-cube clickable-dice" onclick="PRS_App.handleRollDice()" title="Klepni na kostku pro hod!">' + diceGlyph + '</div>' +

                '</div>' +

                tempoSelectorHtml +

                (isBot

                    ? '<button class="btn-gold-lg" style="width:100%;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.stepBotNow()">🤖 Odehrát tah PC (' + this.escapeHtml(player.name) + ')</button>'

                    : '<button class="btn-gold-lg" style="width:100%;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.handleRollDice()">' + (modeLabels[curMode] || modeLabels.standard) + '</button>') +

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

                    '</div>';

                return;

            }

        }

        var pa = this.state.pendingAction || {};

        var btns = [];

        if (pa.canBuyNode) {

            var canAfford = player.gold >= pa.buyPrice;

            var remGold = player.gold - pa.buyPrice;

            var isProc = this.isActionProcessing || this.isSavingSession;

            var buyLabel = isProc ? "⏳ Kupuji pole..." : ("📜 Koupit toto pole (" + pa.buyPrice.toLocaleString("cs-CZ") + " zl.)" + (canAfford ? (" • Zbyde: " + remGold.toLocaleString("cs-CZ") + " zl.") : " • ❌ Chybí zlato!"));

            btns.push('<button class="btn-action-buy" id="btn-buy-current-node" style="' + (isProc ? 'opacity:0.5; pointer-events:none;' : '') + '" ' + (!canAfford || isProc ? 'disabled' : '') + ' onclick="PRS_App.handleBuyNode()">' + buyLabel + '</button>');

        }

        if (pa.canUpgradeVillage) {

            var canAffordUpg = player.gold >= pa.upgradeCost;

            var remUpg = player.gold - pa.upgradeCost;

            btns.push('<button class="btn-action-buy" ' + (!canAffordUpg ? 'disabled' : '') + ' onclick="PRS_App.handleUpgradeVillage(' + pa.nodeId + ')">🏘️ Povýšit vesnici (' + pa.upgradeCost.toLocaleString("cs-CZ") + ' zl.)' + (canAffordUpg ? (' • Zbyde: ' + remUpg.toLocaleString("cs-CZ") + ' zl.') : '') + '</button>');

        }

        if (pa.canTrainMaster) {

            if (pa.skill === "any") {

                var skList = [

                    { k: "boj", label: "⚔️ Boj" },

                    { k: "jizda", label: "🏇 Jízda" },

                    { k: "tanec", label: "💃 Tanec" },

                    { k: "charisma", label: "✨ Charisma" }

                ];

                for (var s = 0; s < skList.length; s++) {

                    var skKey = skList[s].k;

                    var curLvl = player.skills[skKey] || 0;

                    if (curLvl < 5) {

                        var cCost = this.state.config.masterCosts[curLvl];

                        btns.push('<button class="btn-action-skill" ' + (player.gold < cCost ? 'disabled' : '') + ' onclick="PRS_App.handleTrainMaster(\'' + skKey + '\')">🎓 Cvičit ' + skList[s].label + ' na ' + (curLvl + 1) + ' (' + cCost + ' zl.)</button>');

                    }

                }

            } else {

                var lvl = player.skills[pa.skill] || 0;

                if (lvl < 5) {

                    var cost = this.state.config.masterCosts[lvl];

                    btns.push('<button class="btn-action-skill" ' + (player.gold < cost ? 'disabled' : '') + ' onclick="PRS_App.handleTrainMaster(\'' + pa.skill + '\')">🎓 Vycvičit ' + pa.skill.toUpperCase() + ' na ' + (lvl + 1) + '/5 (' + cost + ' zl.)</button>');

                }

            }

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

            var horseBonus = (q.questTier !== "U1" && stats.horses > 0) ? (1 + Math.floor(stats.jizda / 2)) : 0;

            var basePower = stats.boj + animalBonus + horseBonus;

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

                if (trDef.boj) statParts.push("⚔️+" + trDef.boj);

                if (trDef.jizda) statParts.push("🏇+" + trDef.jizda);

                if (trDef.tanec) statParts.push("💃+" + trDef.tanec);

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

                '      Boj ' + stats.boj +

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

                '</div>';

        }

        if (pa.canResolveFestival) {

            var fType = pa.festivalType || "turnaj";

            var fTitle = (fType === "turnaj" ? "Královský Turnaj 🏇" : (fType === "ples" ? "Zámecký Ples 💃" : "Velký Závod 🐎"));

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

                (pa.canChooseDilemma && c.options && c.options.length >= 2 ? (

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

            specialCardHtml += '<div class="encounter-interaction-card" style="border:1.5px solid #38bdf8; background:linear-gradient(180deg, rgba(12,74,110,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +

                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#7dd3fc; margin-bottom:4px;">🤺 Setkání rytířů: ' + enc.badge + ' ' + this.escapeHtml(enc.name) + '</div>' +

                '<p style="font-size:0.8rem; color:#bae6fd; margin-bottom:0.6rem;">Na tomto poli stojí soupeř. Zvol rytířský duel cti, nebo ukaž dvorskou noblesu přátelským přípitkem:</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +

                (canDuel ? '  <button class="btn-action-duel" style="padding:0.55rem; background:linear-gradient(135deg, #ef4444, #991b1b); color:#fff; border:1px solid #fca5a5; border-radius:7px; font-weight:700; cursor:pointer;" onclick="PRS_App.handlePlayerDuel(' + enc.index + ')">⚔️ Rytířský duel cti (Sázka ' + enc.duelStake + ' zl. &amp; 0.5 💖)</button>' : '') +

                (canToast ? '  <button class="btn-action-toast" style="padding:0.55rem; background:linear-gradient(135deg, #f59e0b, #b45309); color:#fff; border:1px solid #fde68a; border-radius:7px; font-weight:700; cursor:pointer;" onclick="PRS_App.handlePlayerToast(' + enc.index + ')">🍷 Přátelský přípitek (' + enc.toastCost + ' zl. ➔ Zisk +0,5 💖)</button>' : '') +

                '</div>' +

                '</div>';

        }

        // 2. Šlechtický výkup ze sady (Královské předkupní právo)

        if (pa.canBuyoutAnimalSet && pa.buyoutCandidates && pa.buyoutCandidates.length > 0) {

            specialCardHtml += '<div class="buyout-interaction-card" style="border:1.5px solid #10b981; background:linear-gradient(180deg, rgba(6,78,59,0.4), rgba(15,23,42,0.85)); border-radius:10px; padding:0.8rem; margin-top:0.6rem;">' +

                '<div style="font-size:0.92rem; font-family:\'Cinzel\',serif; color:#6ee7b7; margin-bottom:4px;">📜 Královské předkupní právo na zvíře!</div>' +

                '<p style="font-size:0.8rem; color:#a7f3d0; margin-bottom:0.6rem;">Vlastníš 2 ze 3 zvířat sady! Můžeš vykoupit chybějící kus od majitele za dvojnásobek ceny a ihned zkompletovat sadu (+1,0 💖):</p>' +

                '<div style="display:flex; flex-direction:column; gap:0.4rem;">';

            for (var bi = 0; bi < pa.buyoutCandidates.length; bi++) {

                var bc = pa.buyoutCandidates[bi];

                var canAffordBc = player.gold >= bc.buyoutPrice;

                specialCardHtml += '  <button class="btn-action-buyout" ' + (!canAffordBc ? 'disabled' : '') + ' style="padding:0.55rem; background:linear-gradient(135deg, #059669, #047857); color:#fff; border:1px solid #6ee7b7; border-radius:7px; font-weight:700; text-align:left; cursor:pointer;" onclick="PRS_App.handleAnimalBuyout(' + bc.nodeId + ')">' +

                    bc.icon + ' Vykoupit ' + this.escapeHtml(bc.name) + ' ze sady #' + bc.setId + ' (' + bc.buyoutPrice + ' zl. pro ' + this.escapeHtml(bc.ownerName) + ') ➔ +1.0 💖' +

                    '</button>';

            }

            specialCardHtml += '</div></div>';

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

                var itLiq = Math.round(itObj.price * rate);

                assetsRows += '<div class="debt-asset-row">' +

                    '<span>' + itObj.icon + ' <strong>' + this.escapeHtml(itObj.name) + '</strong> (' + (itObj.isEquipped === false ? '🎒 v batohu' : '⚔️ nasazeno') + ')</span>' +

                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'item\', \'' + itObj.id + '\')">Odprodat za +' + itLiq + ' zl.</button>' +

                    '</div>';

            }

            // 2. Vlastněná panství a zvířata

            for (var ndIdx = 0; ndIdx < player.ownedNodes.length; ndIdx++) {

                var ndObj = this.state.board.nodes[player.ownedNodes[ndIdx]];

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

        var mustCompleteFirst = pa.canResolveQuest || pa.canResolveFestival || pa.isImprisoned || pa.debt;

        if (!mustCompleteFirst) {

            btns.push('<button class="btn-end-turn" onclick="PRS_App.handleEndTurn()">➡️ Ukončit tah</button>');

        }

        var rollVal = this.state.lastRoll || 1;

        var rollGlyph = this.getDiceGlyph(rollVal);

        var landedNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;

        var landedLocHtml = "";

        if (landedNode) {

            landedLocHtml = '<div class="dice-landed-loc">' +

                '<span class="loc-label">Vstup na pole:</span> ' +

                '<span class="loc-name">' + (landedNode.icon || "📍") + ' <strong>' + this.escapeHtml(landedNode.name) + '</strong></span>' +

                (landedNode.code ? ' <span class="loc-code">(' + this.escapeHtml(landedNode.code) + ')</span>' : '') +

                '</div>';

        }

        var encounterHtml = this.parseTurnEncounter(pa.summary || "");

        var targetHeartsAction = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30;

        var actTreasuryHtml = '<div class="turn-active-treasury-banner">' +

            '<div style="display:flex; justify-content:space-between; align-items:center;">' +

            '  <div style="display:flex; align-items:center; gap:0.45rem;">' +

            '    <span class="top-hud-avatar" style="background:' + player.color + '; width:28px; height:28px; font-size:0.95rem;">' + player.badge + '</span>' +

            '    <div>' +

            '      <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Rytíř na tahu</div>' +

            '      <strong style="color:' + player.color + '; font-size:0.95rem;">' + this.escapeHtml(player.name) + '</strong>' +

            '    </div>' +

            '  </div>' +

            '  <div style="text-align:right;">' +

            '    <div style="font-size:1.15rem; font-weight:900; color:#facc15; text-shadow:0 0 10px rgba(250,204,21,0.5);">🪙 ' + player.gold.toLocaleString("cs-CZ") + ' zl.</div>' +

            '    <div style="font-size:0.76rem; font-weight:bold; color:#f472b6;">💖 ' + player.totalHearts + ' / ' + targetHeartsAction + '</div>' +

            '  </div>' +

            '</div>' +

            '</div>';

        el.innerHTML = specialCardHtml +

            '<div class="action-card">' +

            actTreasuryHtml +

            '<div class="dice-badge-row">' +

            '  <div class="dice-cube-mini" title="Hod: ' + rollVal + '">' + rollGlyph + '</div>' +

            '  <div class="dice-badge-content">' +

            '    <div class="dice-roll-badge">🎲 Hod kostkou: <strong>' + rollVal + '</strong></div>' +

            landedLocHtml +

            '  </div>' +

            '</div>' +

            encounterHtml +

            '<div class="action-buttons-wrap">' + btns.join(" ") + '</div>' +

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

        for (var i = 0; i < Math.min(30, this.state.logs.length); i++) {

            var l = this.state.logs[i];

            html += '<div class="log-entry log-' + l.type + '"><span class="log-turn">[Kolo ' + l.round + ']</span> ' + this.formatGameText(l.text) + '</div>';

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

                    if (window.PRS_Audio) window.PRS_Audio.playStep();

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

        // Běžný pochod

        self.executeRollAndAnimateMove(player, null, baseRoll);

    },

    showHorseRollDialog: function (player, d1, d2, hasFalcon) {

        var self = this;

        var sum = d1 + d2;

        var targetSum = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, sum);

        var targetD1 = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, d1);

        var targetD2 = (d1 !== d2) ? window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, d2) : null;

        var modal = document.getElementById("generic-modal");

        if (!modal) {

            self.executeRollAndAnimateMove(player, null, sum);

            return;

        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid var(--gold); border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +

            '<div style="font-size:2rem; margin-bottom:0.3rem;">🏇 🎲 🎲</div>' +

            '<h3 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin:0 0 0.5rem 0;">Koňský cval: Padlo ' + d1 + ' a ' + d2 + '!</h3>' +

            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.1rem;">Díky koním ve stáji máš volbu: bleskově vyrazit kupředu plným tryskem, nebo přesně manévrovat na vybranou hodnotu!</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem;" onclick="PRS_App.confirmHorseRoll(' + sum + ', ' + hasFalcon + ')">' +

            '    <div style="font-weight:700; color:#fef08a;">⚡ Bleskový trysk (' + sum + ' polí)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.85;">Cíl: ' + (targetSum ? self.escapeHtml(targetSum.name) : '') + '</div>' +

            '  </button>' +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #1e293b, #334155); border-color:#64748b;" onclick="PRS_App.confirmHorseRoll(' + d1 + ', ' + hasFalcon + ')">' +

            '    <div style="font-weight:700; color:#cbd5e1;">🎯 Taktický manévr (' + d1 + ' ' + (d1 === 1 ? 'pole' : (d1 < 5 ? 'pole' : 'polí')) + ')</div>' +

            '    <div style="font-size:0.78rem; opacity:0.85;">Cíl: ' + (targetD1 ? self.escapeHtml(targetD1.name) : '') + '</div>' +

            '  </button>' +

            (targetD2 ? '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #1e293b, #334155); border-color:#64748b;" onclick="PRS_App.confirmHorseRoll(' + d2 + ', ' + hasFalcon + ')">' +

            '    <div style="font-weight:700; color:#cbd5e1;">🎯 Taktický manévr (' + d2 + ' ' + (d2 < 5 ? 'pole' : 'polí') + ')</div>' +

            '    <div style="font-size:0.78rem; opacity:0.85;">Cíl: ' + self.escapeHtml(targetD2.name) + '</div>' +

            '  </button>' : '') +

            '</div>' +

            '</div>';

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

    showFalconNavigationDialog: function (player, baseRoll) {

        var self = this;

        var minusRoll = Math.max(1, baseRoll - 1);

        var plusRoll = baseRoll + 1;

        var targetMinus = (minusRoll !== baseRoll) ? window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, minusRoll) : null;

        var targetBase = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, baseRoll);

        var targetPlus = window.PRS_GameEngine.getTargetNodeForRoll(self.state, player, plusRoll);

        var modal = document.getElementById("generic-modal");

        if (!modal) {

            self.executeRollAndAnimateMove(player, null, baseRoll);

            return;

        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +

            '<div style="font-size:2rem; margin-bottom:0.3rem;">🦅 🎯</div>' +

            '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.5rem 0;">Sokolí navigace: Hod ' + baseRoll + '!</h3>' +

            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.1rem;">Tvůj sokol krouží nad krajinou a dává ti možnost upravit výsledný doskok o ±1 pole!</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

            (targetMinus ? '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border-color:#38bdf8;" onclick="PRS_App.confirmFalconRoll(' + minusRoll + ')">' +

            '    <div style="font-weight:700; color:#e0f2fe;">◀️ Úprava: ' + minusRoll + ' polí (-1)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + self.escapeHtml(targetMinus.name) + '</div>' +

            '  </button>' : '') +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem;" onclick="PRS_App.confirmFalconRoll(' + baseRoll + ')">' +

            '    <div style="font-weight:700; color:#fef08a;">🎯 Původní hod: ' + baseRoll + ' polí (bez změny)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + (targetBase ? self.escapeHtml(targetBase.name) : '') + '</div>' +

            '  </button>' +

            (targetPlus ? ('  <button class="btn-gold-lg" style="text-align:left; padding:0.75rem 1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border-color:#38bdf8;" onclick="PRS_App.confirmFalconRoll(' + plusRoll + ')">' +

            '    <div style="font-weight:700; color:#e0f2fe;">▶️ Úprava: ' + plusRoll + ' polí (+1)</div>' +

            '    <div style="font-size:0.78rem; opacity:0.9;">Cíl: ' + self.escapeHtml(targetPlus.name) + '</div>' +

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

        this.selectedNodeId = this.state.players[this.state.currentPlayerIndex].nodeId;

        this.renderGameScreen();

        var self = this;

        var p = this.saveSessionAuto();

        var onDone = function () {

            self.isActionProcessing = false;

            self.scheduleBotTurnIfNeeded();

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

                self.selectedNodeId = bot.nodeId;

                self.renderGameScreen();

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

            self.selectedNodeId = bot.nodeId;

            self.renderGameScreen();

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

        if (currentP && currentP.type !== "Human") {

            var delay = self.isMoveAnimating ? 220 : 130;

            this.autoBotTimer = setTimeout(function () {

                self.stepBotNow();

            }, delay);

        }

    }
    });
})();
