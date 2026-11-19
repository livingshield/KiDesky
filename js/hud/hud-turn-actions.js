// ============================================================================
// KiDesky: Princeznino srdce - Hod kostkou, Pohyb koně/sokola, Rozcestí, Akce panství a Tahy AI
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
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

        var isEnPed = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var getNdName = function(node) {
            if (!node) return "";
            return (window.PRS_App && window.PRS_App.getNodeDisplayName) ? window.PRS_App.getNodeDisplayName(node) : node.name;
        };
        var targetSprintName = getNdName(targetSprint);
        var targetBaseName = getNdName(targetBase);
        var destLabel = isEnPed ? "Destination: " : "Cíl: ";

        var titleStr = isEnPed ? ("Riding Training: Rolled " + baseRoll + "!") : ("Výcvik Jízdy: Hod " + baseRoll + "!");
        var subStr = isEnPed
            ? ("Thanks to your knightly agility and Riding training, you can take a swift advance (+" + jzBonus + (jzBonus === 1 ? " tile" : " tiles") + ")!")
            : ("Díky své rytířské mrštnosti a výcviku Jízdy můžeš vyrazit svižným přesunem (+" + jzBonus + (jzBonus === 1 ? " pole" : " pole") + ")!");

        var sprintBtnText = isEnPed
            ? ("⚡ Swift Advance: " + sprintRoll + " tiles (+" + jzBonus + ")")
            : ("⚡ Rychlý přesun: " + sprintRoll + " polí (+" + jzBonus + ")");
        var baseBtnText = isEnPed
            ? ("🚶 Standard March: " + baseRoll + " tiles")
            : ("🚶 Běžný krok: " + baseRoll + " polí");

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +

            '<div style="font-size:2rem; margin-bottom:0.3rem;">🏃‍♂️ 🏇</div>' +

            '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.5rem 0;">' + titleStr + '</h3>' +

            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.1rem;">' + subStr + '</div>' +

            '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border:2px solid #38bdf8; color:#f0f9ff;" onclick="PRS_App.confirmFalconRoll(' + sprintRoll + ')">' +

            '    <div style="font-weight:800; font-size:0.96rem; color:#e0f2fe;">' + sprintBtnText + '</div>' +

            '    <div style="font-size:0.84rem; color:#bae6fd; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#ffffff;">' + (targetSprint ? self.escapeHtml(targetSprintName) : '') + '</strong></div>' +

            '  </button>' +

            '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #f59e0b, #d97706); border:2px solid #fbbf24; color:#291201;" onclick="PRS_App.confirmFalconRoll(' + baseRoll + ')">' +

            '    <div style="font-weight:800; font-size:0.96rem; color:#451a03;">' + baseBtnText + '</div>' +

            '    <div style="font-size:0.84rem; color:#291201; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#1e0d00;">' + (targetBase ? self.escapeHtml(targetBaseName) : '') + '</strong></div>' +

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

        var isEnHorse = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var headerTitle = canSprint
            ? (isEnHorse ? "Royal Sprint" : "Královský trysk")
            : (canGallop ? (isEnHorse ? "Horse Gallop" : "Koňský cval") : (isEnHorse ? "Horse Trot" : "Koňský klus"));

        var headerSub = canGallop
            ? (isEnHorse ? ("Thanks to Riding mastery (" + jz + "/5) and your horse, you can choose between a fast gallop or a precise maneuver.") : ("Díky mistrovství Jízdy (" + jz + "/5) a koni máš volbu mezi bleskovým cvalem či přesným manévrem."))
            : (isEnHorse ? ("Horse Trot (Riding " + jz + "/5): Choose from either die (full gallop d1+d2 requires Riding ≥ 2).") : ("Koňský klus (Jízda " + jz + "/5): Volíš z obou kostek (plný cval d1+d2 vyžaduje Jízdu ≥ 2)."));

        if (hasFalcon) {
            headerSub += "<br><span style='color:#7dd3fc; font-size:0.8rem;'>🦅 <strong>" + (isEnHorse ? "Falcon navigation (±1 tile)" : "Sokolí navigaci (±1 pole)") + "</strong> " + (isEnHorse ? "can be used during tactical maneuvers (during full gallop or sprint, the horse charges too fast for falcon scouting)." : "můžeš využít při taktických manévrech (při plném cvalu či trysku kůň pádí příliš rychle na navigaci sokolem).") + "</span>";
        }

        var getNdName = function(node) {
            if (!node) return "";
            return (window.PRS_App && window.PRS_App.getNodeDisplayName) ? window.PRS_App.getNodeDisplayName(node) : node.name;
        };

        var targetSprintName = getNdName(targetSprint);
        var targetSumName = getNdName(targetSum);
        var targetD1Name = getNdName(targetD1);
        var targetD2Name = getNdName(targetD2);
        var destLabel = isEnHorse ? "Destination: " : "Cíl: ";

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid var(--gold); border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +
            '<div style="font-size:2rem; margin-bottom:0.3rem;">🏇 🎲 🎲</div>' +
            '<h3 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin:0 0 0.5rem 0;">' + headerTitle + (isEnHorse ? (': Rolled ' + d1 + ' and ' + d2 + '!') : (': Padlo ' + d1 + ' a ' + d2 + '!')) + '</h3>' +
            '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.1rem;">' + headerSub + '</div>' +
            '<div style="display:flex; flex-direction:column; gap:0.6rem;">';

        if (canSprint && targetSprint) {
            var sprintTitle = isEnHorse
                ? ("👑 Royal Sprint (" + sprintSum + " tiles: " + sum + "+2)" + (hasFalcon ? ' <small style="font-size:0.75rem; color:#fbcfe8; font-weight:600;">(direct sprint – no falcon)</small>' : ''))
                : ("👑 Královský trysk (" + sprintSum + " polí: " + sum + "+2)" + (hasFalcon ? ' <small style="font-size:0.75rem; color:#fbcfe8; font-weight:600;">(přímý trysk – bez sokola)</small>' : ''));
            html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #7c3aed, #4f46e5); border:2px solid #c084fc; color:#ffffff;" onclick="PRS_App.confirmHorseRoll(' + sprintSum + ', false)">' +
                '    <div style="font-weight:800; font-size:0.96rem; color:#f5d0fe;">' + sprintTitle + '</div>' +
                '    <div style="font-size:0.84rem; color:#e9d5ff; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#ffffff;">' + self.escapeHtml(targetSprintName) + '</strong></div>' +
                '  </button>';
        }

        if (canGallop && targetSum) {
            var gallopTitle = isEnHorse
                ? ("⚡ Full Gallop (" + sum + " tiles)" + (hasFalcon ? ' <small style="font-size:0.75rem; color:#78350f; font-weight:700;">(direct gallop – no falcon)</small>' : ''))
                : ("⚡ Plný cval (" + sum + " polí)" + (hasFalcon ? ' <small style="font-size:0.75rem; color:#78350f; font-weight:700;">(přímý cval – bez sokola)</small>' : ''));
            html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #f59e0b, #d97706); border:2px solid #fbbf24; color:#291201;" onclick="PRS_App.confirmHorseRoll(' + sum + ', false)">' +
                '    <div style="font-weight:800; font-size:0.96rem; color:#451a03;">' + gallopTitle + '</div>' +
                '    <div style="font-size:0.84rem; color:#291201; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#1e0d00;">' + self.escapeHtml(targetSumName) + '</strong></div>' +
                '  </button>';
        }

        var scoutLevel = hasFalcon ? self.getFalconScoutLevel(player) : 0;

        var man1Title = isEnHorse
            ? ("🎯 Tactical Maneuver (" + d1 + " " + (d1 === 1 ? "tile" : "tiles") + ")" + (hasFalcon ? ' <span style="color:#38bdf8; font-size:0.8rem; font-weight:600;">🦅 + Falcon navigation (±1)</span>' : ''))
            : ("🎯 Taktický manévr (" + d1 + " " + (d1 === 1 ? 'pole' : (d1 < 5 ? 'pole' : 'polí')) + ')' + (hasFalcon ? ' <span style="color:#38bdf8; font-size:0.8rem; font-weight:600;">🦅 + Sokolí navigace (±1)</span>' : ''));

        html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #1e293b, #334155); border:2px solid #64748b; color:#f8fafc;" onclick="PRS_App.confirmHorseRoll(' + d1 + ', ' + hasFalcon + ')">' +
            '    <div style="font-weight:800; font-size:0.96rem; color:#f8fafc;">' + man1Title + '</div>' +
            '    <div style="font-size:0.84rem; color:#cbd5e1; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#ffffff;">' + (targetD1 ? self.escapeHtml(targetD1Name) : '') + '</strong></div>' +
            (hasFalcon ? self.renderFalconTargetIntelHtml(player, targetD1, scoutLevel, d1, false) : '') +
            '  </button>';

        if (targetD2) {
            var man2Title = isEnHorse
                ? ("🎯 Tactical Maneuver (" + d2 + " " + (d2 === 1 ? "tile" : "tiles") + ")" + (hasFalcon ? ' <span style="color:#38bdf8; font-size:0.8rem; font-weight:600;">🦅 + Falcon navigation (±1)</span>' : ''))
                : ("🎯 Taktický manévr (" + d2 + " " + (d2 < 5 ? 'pole' : 'polí') + ')' + (hasFalcon ? ' <span style="color:#38bdf8; font-size:0.8rem; font-weight:600;">🦅 + Sokolí navigace (±1)</span>' : ''));
            html += '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #1e293b, #334155); border:2px solid #64748b; color:#f8fafc;" onclick="PRS_App.confirmHorseRoll(' + d2 + ', ' + hasFalcon + ')">' +
                '    <div style="font-weight:800; font-size:0.96rem; color:#f8fafc;">' + man2Title + '</div>' +
                '    <div style="font-size:0.84rem; color:#cbd5e1; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#ffffff;">' + self.escapeHtml(targetD2Name) + '</strong></div>' +
                (hasFalcon ? self.renderFalconTargetIntelHtml(player, targetD2, scoutLevel, d2, false) : '') +
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

    
    renderFalconTargetIntelHtml: function (player, targetNode, scoutLevel, moveRoll, isGold) {
        if (!targetNode || !this.state || !window.PRS_GameEngine) return "";
        var isEnIntel = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var currIntel = isEnIntel ? "g." : "zl.";
        var locIntel = isEnIntel ? "en-US" : "cs-CZ";

        if (scoutLevel < 2) {
            var lockColor = isGold ? "#78350f" : "#cbd5e1";
            return '<div style="font-size:0.75rem; color:' + lockColor + '; font-weight:600; margin-top:3px;">' + (isEnIntel ? "🔒 Owner intel requires 2+ falcons or Falconer" : "🔒 Průzkum vlastníka od 2 sokolů nebo se Sokolníkem") + '</div>';
        }
        var eng = window.PRS_GameEngine;
        var isBuyable = eng.isPurchasableNode ? eng.isPurchasableNode(targetNode) : false;
        if (!isBuyable) {
            var neutralColor = isGold ? "#5c3d18" : "#94a3b8";
            return '<div style="font-size:0.75rem; color:' + neutralColor + '; font-weight:600; margin-top:3px;">' + (isEnIntel ? "🏳️ Neutral / action tile" : "🏳️ Neutrální / akční pole") + '</div>';
        }
        if (targetNode.owner === player.index) {
            var vStars = (targetNode.type === "VILLAGE") ? " (" + (targetNode.villageLevel || 1) + "★)" : "";
            var upgHint = (scoutLevel >= 3 && targetNode.type === "VILLAGE" && (targetNode.villageLevel || 1) < 3) ? (isEnIntel ? " · Upgrade possible" : " · Povýšení možné") : "";
            var ownColor = isGold ? "#14532d" : "#86efac";
            return '<div style="font-size:0.75rem; color:' + ownColor + '; font-weight:700; margin-top:3px;">' + (isEnIntel ? ("👑 Your estate" + vStars + upgHint) : ("👑 Tvé panství" + vStars + upgHint)) + '</div>';
        }
        if (targetNode.owner !== null && targetNode.owner !== undefined && this.state.players && this.state.players[targetNode.owner]) {
            var ownerObj = this.state.players[targetNode.owner];
            var rentStr = "";
            if (scoutLevel >= 3 && eng.calculateNodeRent) {
                var rentVal = eng.calculateNodeRent(this.state, targetNode, ownerObj, moveRoll || 0);
                var rentColor = isGold ? "#991b1b" : "#fca5a5";
                var noRentColor = isGold ? "#451a03" : "#cbd5e1";
                rentStr = (rentVal > 0)
                    ? (' · <span style="color:' + rentColor + '; font-weight:700;">💸 ' + (isEnIntel ? "Rent: " : "Nájem: ") + rentVal.toLocaleString(locIntel) + ' ' + currIntel + '</span>')
                    : (' · <span style="color:' + noRentColor + ';">' + (isEnIntel ? "🤝 No rent" : "🤝 Bez nájmu") + '</span>');
            }
            var ownerTextColor = isGold ? "#7f1d1d" : (ownerObj.color || '#fca5a5');
            return '<div style="font-size:0.75rem; margin-top:3px; color:' + ownerTextColor + '; font-weight:700;">🛡️ ' + (isEnIntel ? "Owner: " : "Vlastník: ") + (ownerObj.badge || '') + ' ' + this.escapeHtml(ownerObj.name) + rentStr + '</div>';
        }
        var priceStr = "";
        if (scoutLevel >= 3 && eng.getNodePrice) {
            var pVal = eng.getNodePrice(this.state, targetNode);
            if (pVal > 0) priceStr = ' · 💰 ' + (isEnIntel ? "Price: " : "Cena: ") + pVal.toLocaleString(locIntel) + ' ' + currIntel;
        }
        var availColor = isGold ? "#5c3d18" : "#fde68a";
        return '<div style="font-size:0.75rem; color:' + availColor + '; font-weight:700; margin-top:3px;">🏷️ ' + (isEnIntel ? "Available for purchase" : "Volné k nákupu") + priceStr + '</div>';
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

        var isEnFalcon = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var getNdName = function(node) {
            if (!node) return "";
            return (window.PRS_App && window.PRS_App.getNodeDisplayName) ? window.PRS_App.getNodeDisplayName(node) : node.name;
        };
        var targetMinusName = getNdName(targetMinus);
        var targetBaseName = getNdName(targetBase);
        var targetPlusName = getNdName(targetPlus);

        var destLabel = isEnFalcon ? "Destination: " : "Cíl: ";
        var baseLabel = isEnFalcon
            ? ("🎯 Original roll: " + baseRoll + " tiles (no change)")
            : ("🎯 Původní hod: " + baseRoll + " polí (bez změny)");
        var plusLabel = isEnFalcon
            ? ("▶️ Adjustment: " + plusRoll + " tiles (+1)")
            : ("▶️ Úprava: " + plusRoll + " polí (+1)");

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; text-align:center; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +

                '<div style="font-size:2rem; margin-bottom:0.3rem;">🦅 🎯</div>' +

                '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.4rem 0;">' + (isEnFalcon ? ("Falcon Navigation: Rolled " + baseRoll + "!") : ("Sokolí navigace: Hod " + baseRoll + "!")) + '</h3>' +

                '<div style="display:inline-block; font-size:0.74rem; color:#bae6fd; background:rgba(56,189,248,0.14); border:1px solid rgba(56,189,248,0.35); border-radius:999px; padding:0.15rem 0.65rem; margin-bottom:0.55rem;">' + scoutBadgeText + '</div>' +

                '<div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:1.05rem;">' + (isEnFalcon ? "Your falcon circles above the landscape, granting you the power to adjust your reach by ±1 tile!" : "Tvůj sokol krouží nad krajinou a dává ti možnost upravit výsledný doskok o ±1 pole!") + '</div>' +

                '<div style="display:flex; flex-direction:column; gap:0.6rem;">' +

                (targetMinus ? '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border:2px solid #38bdf8; color:#f0f9ff;" onclick="PRS_App.confirmFalconRoll(' + minusRoll + ')">' +

                '    <div style="font-weight:800; font-size:0.96rem; color:#e0f2fe;">' + (isEnFalcon ? ("◀️ Adjustment: " + minusRoll + " tiles (-1)") : ("◀️ Úprava: " + minusRoll + " polí (-1)")) + '</div>' +

                '    <div style="font-size:0.84rem; color:#bae6fd; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#ffffff;">' + self.escapeHtml(targetMinusName) + '</strong></div>' +
                self.renderFalconTargetIntelHtml(player, targetMinus, scoutLevel, minusRoll, false) +

                '  </button>' : '') +

                '  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #f59e0b, #d97706); border:2px solid #fbbf24; color:#291201;" onclick="PRS_App.confirmFalconRoll(' + baseRoll + ')">' +

                '    <div style="font-weight:800; font-size:0.96rem; color:#451a03;">' + baseLabel + '</div>' +

                '    <div style="font-size:0.84rem; color:#291201; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#1e0d00;">' + self.escapeHtml(targetBaseName) + '</strong></div>' +
                self.renderFalconTargetIntelHtml(player, targetBase, scoutLevel, baseRoll, true) +

                '  </button>' +

                (targetPlus ? ('  <button class="btn-gold-lg" style="text-align:left; padding:0.8rem 1.1rem; background:linear-gradient(135deg, #0369a1, #0284c7); border:2px solid #38bdf8; color:#f0f9ff;" onclick="PRS_App.confirmFalconRoll(' + plusRoll + ')">' +

                '    <div style="font-weight:800; font-size:0.96rem; color:#e0f2fe;">' + plusLabel + '</div>' +

                '    <div style="font-size:0.84rem; color:#bae6fd; font-weight:600; margin-top:3px;">' + destLabel + '<strong style="color:#ffffff;">' + self.escapeHtml(targetPlusName) + '</strong></div>' +
                self.renderFalconTargetIntelHtml(player, targetPlus, scoutLevel, plusRoll, false) +

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
