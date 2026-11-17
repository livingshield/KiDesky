// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Modaly, Soubojová Aréna, Slavnosti a Zbrojnice
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    openGraphicsModal: function () {

        var m = document.getElementById("graphics-modal");

        if (!m) return;

        this.setInputValue("gfx-env-bg", this.graphicsConfig.environmentBgUrl || "");

        this.setInputValue("gfx-board-bg", this.graphicsConfig.boardBgUrl || "");

        this.setInputValue("gfx-tile-horse", this.graphicsConfig.tileBitmapsByType.horse || "");

        this.setInputValue("gfx-tile-dog", this.graphicsConfig.tileBitmapsByType.dog || "");

        this.setInputValue("gfx-tile-falcon", this.graphicsConfig.tileBitmapsByType.falcon || "");

        this.setInputValue("gfx-tile-village", this.graphicsConfig.tileBitmapsByType.VILLAGE || "");

        this.setInputValue("gfx-tile-town", this.graphicsConfig.tileBitmapsByType.TOWN || "");

        this.setInputValue("gfx-tile-castle", this.graphicsConfig.tileBitmapsByType.CASTLE || "");

        this.setInputValue("gfx-tile-festival", this.graphicsConfig.tileBitmapsByType.FESTIVAL || "");

        this.setInputValue("gfx-landmark-castle", this.graphicsConfig.landmarkBitmaps.royalCastle || "");

        m.style.display = "flex";

    },

    closeGraphicsModal: function () {

        var m = document.getElementById("graphics-modal");

        if (m) { m.style.display = "none"; this.updateBodyModalClass(); }

    },

    saveGraphicsSettings: function () {

        this.graphicsConfig.environmentBgUrl = document.getElementById("gfx-env-bg").value.trim();

        this.graphicsConfig.boardBgUrl = document.getElementById("gfx-board-bg").value.trim();

        this.graphicsConfig.tileBitmapsByType.horse = document.getElementById("gfx-tile-horse").value.trim();

        this.graphicsConfig.tileBitmapsByType.dog = document.getElementById("gfx-tile-dog").value.trim();

        this.graphicsConfig.tileBitmapsByType.falcon = document.getElementById("gfx-tile-falcon").value.trim();

        this.graphicsConfig.tileBitmapsByType.VILLAGE = document.getElementById("gfx-tile-village").value.trim();

        this.graphicsConfig.tileBitmapsByType.TOWN = document.getElementById("gfx-tile-town").value.trim();

        this.graphicsConfig.tileBitmapsByType.CASTLE = document.getElementById("gfx-tile-castle").value.trim();

        this.graphicsConfig.tileBitmapsByType.FESTIVAL = document.getElementById("gfx-tile-festival").value.trim();

        this.graphicsConfig.landmarkBitmaps.royalCastle = document.getElementById("gfx-landmark-castle").value.trim();

        localStorage.setItem("prs_graphics_config", JSON.stringify(this.graphicsConfig));

        this.applyEnvironmentBackground();

        this.isBoardStaticDirty = true;

        this.renderBoardSVG();

        this.closeGraphicsModal();

    },

    // --- OVLÁDÁNÍ ZVUKŮ (Web Audio API) ---,

    openVictoryModal: function () {

        var modal = document.getElementById("victory-modal");

        if (!modal || !this.state) return;

        if (this.clearActiveGameAutosave) this.clearActiveGameAutosave();

        if (modal.style.display === "flex") return; // Zabraňuje problikávání a opakovanému překreslování

        if (window.PRS_Audio) window.PRS_Audio.playFanfare();

        var winIdx = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;

        var winner = this.state.players[winIdx];

        var subEl = document.getElementById("victory-winner-subtitle");
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var tModal = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currGold = isEn ? "g." : "zl.";
        var titleEl = document.querySelector("#victory-modal .victory-title");
        var crownEl = document.querySelector("#victory-modal .victory-crown-icon");

        if (subEl) {
            var subText = "";
            var winType = this.state.winType || "";
            var bName = '<strong style="color:' + winner.color + '; font-size:1.15rem;">' + winner.badge + ' ' + this.escapeHtml(winner.name) + '</strong>';

            if (winType === "slayer_dragons") {
                if (titleEl) titleEl.innerHTML = tModal("modals.endgame.title_slayer", null, "🐉 Dračí triumf &amp; Královská svatba");
                if (crownEl) crownEl.innerHTML = "🐉👑";
                subText = tModal("modals.endgame.sub_slayer", { badge_name: bName, round: this.state.roundNumber });
            } else if (winType === "tycoon_estates") {
                if (titleEl) titleEl.innerHTML = tModal("modals.endgame.title_tycoon", null, "🏰 Feudální triumf &amp; Královská svatba");
                if (crownEl) crownEl.innerHTML = "🏰👑";
                subText = tModal("modals.endgame.sub_tycoon", { badge_name: bName, round: this.state.roundNumber });
            } else if (winType === "sole_survivor") {
                if (titleEl) titleEl.innerHTML = tModal("modals.endgame.title_survivor", null, "💀 Přeživší šampion &amp; Triumf");
                if (crownEl) crownEl.innerHTML = "💀👑";
                subText = tModal("modals.endgame.sub_survivor", { badge_name: bName, round: this.state.roundNumber });
            } else {
                if (titleEl) titleEl.innerHTML = tModal("modals.endgame.title_default", null, "Královská svatba &amp; Triumf");
                if (crownEl) crownEl.innerHTML = "👑";
                var tgtH = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : winner.totalHearts;
                subText = tModal("modals.endgame.sub_default", { badge_name: bName, target: tgtH, total: winner.totalHearts, round: this.state.roundNumber });
            }

            if (!this.victoryCreditsAwarded && this.state.roundNumber > 0) {
                this.victoryCreditsAwarded = true;
                var humanPlayer = null;
                for (var hpi = 0; hpi < this.state.players.length; hpi++) {
                    if (this.state.players[hpi].type === "Human") {
                        humanPlayer = this.state.players[hpi];
                        break;
                    }
                }
                if (humanPlayer) {
                    var isHumanWinner = (winner.index === humanPlayer.index);
                    var creditsEarned = 50; // účast v turnaji
                    if (isHumanWinner) creditsEarned += 150; // triumf
                    if (winType === "slayer_dragons" && isHumanWinner) creditsEarned += 50; // drakobijec bonus
                    if (this.awardCredits) {
                        this.awardCredits(creditsEarned, isHumanWinner ? (isEn ? "Royal Triumph" : "Královský triumf") : (isEn ? "Tournament Participation" : "Účast v turnaji"), isHumanWinner);
                    }
                    if (this.recordGameStats) {
                        var castlesCount = 0;
                        var herdsCount = 0;
                        if (this.state.board && this.state.board.nodes) {
                            for (var nid in this.state.board.nodes) {
                                var nd = this.state.board.nodes[nid];
                                if (nd && nd.owner === humanPlayer.index) {
                                    if (nd.castle) castlesCount++;
                                    if (nd.hasHerds) herdsCount++;
                                }
                            }
                        }
                        this.recordGameStats({
                            username: (this.currentUser && this.currentUser.username) || humanPlayer.name,
                            isWin: isHumanWinner,
                            hearts: humanPlayer.totalHearts || 0,
                            dragons: (humanPlayer.questsDone && humanPlayer.questsDone.slayer) ? 1 : 0,
                            castles: castlesCount,
                            herds: herdsCount,
                            festivalHearts: humanPlayer.stats ? (humanPlayer.stats.festivalHearts || 0) : 0
                        });
                    }
                    var rewBanner = tModal("modals.endgame.reward_banner", { credits: creditsEarned, balance: (this.userCredits || 0) });
                    subText += '<div style="margin-top:0.45rem; padding:0.35rem 0.65rem; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.35); border-radius:6px; color:#7dd3fc; font-size:0.83rem;">' + rewBanner + '</div>';
                }
            }

            subEl.innerHTML = subText;
        }

        var formatH = function (val) {
            if (typeof val !== "number" || isNaN(val)) return "0";
            var rounded = Math.round(val * 10) / 10;
            return String(rounded);
        };

        // Vítěz MUSÍ být vždy na 1. místě žebříčku i pódia!
        var others = [];
        for (var pi = 0; pi < this.state.players.length; pi++) {
            if (pi !== winIdx) others.push(this.state.players[pi]);
        }

        others.sort(function (a, b) {
            var aDead = !!(a.isEliminated || a.isBankrupt);
            var bDead = !!(b.isEliminated || b.isBankrupt);

            // 1. Živý (přeživší) rytíř má VŽDY absolutní přednost před mrtvým / vyřazeným!
            if (aDead !== bDead) {
                return aDead ? 1 : -1;
            }

            // 2. Mezi žijícími (nebo mezi vyřazenými) rozhoduje celkový počet srdcí
            if (b.totalHearts !== a.totalHearts) return b.totalHearts - a.totalHearts;

            // 3. Při shodě srdcí rozhoduje hotovost ve zlatě
            if (b.gold !== a.gold) return b.gold - a.gold;

            // 4. Pokud jsou oba vyřazení, rozhoduje, kdo přežil déle (vyšší kolo vyřazení)
            if (aDead && bDead) {
                var aRound = a.eliminatedRound || 0;
                var bRound = b.eliminatedRound || 0;
                if (bRound !== aRound) return bRound - aRound;
            }

            return 0;
        });

        var ranked = [winner].concat(others);

        if (!this.state._historySaved && this.state.roundNumber > 0) {
            this.state._historySaved = true;
            this.saveMatchToHistory(winner, ranked);
        }

        var podEl = document.getElementById("victory-podium-content");
        if (podEl) {
            var podHtml = [];
            var ranks = [
                { rank: 1, title: tModal("modals.endgame.podium_rank_1", null, "🏆 VÍTĚZ"), cls: "podium-rank-1", badgeCls: "#fbbf24" },
                { rank: 2, title: tModal("modals.endgame.podium_rank_2", null, "🥈 2. MÍSTO"), cls: "podium-rank-2", badgeCls: "#94a3b8" },
                { rank: 3, title: tModal("modals.endgame.podium_rank_3", null, "🥉 3. MÍSTO"), cls: "podium-rank-3", badgeCls: "#d97706" }
            ];

            for (var r = 0; r < Math.min(3, ranked.length); r++) {
                var rp = ranked[r];
                var rInfo = ranks[r];
                var isDeadP = !!(rp.isEliminated || rp.isBankrupt);

                podHtml.push('<div class="podium-card ' + rInfo.cls + '" style="' + (isDeadP ? 'opacity:0.8; border-color:#ef4444;' : '') + '">');
                podHtml.push('  <span class="podium-rank-badge" style="background:rgba(212,175,55,0.2); color:' + rInfo.badgeCls + ';">' + rInfo.title + '</span>');
                podHtml.push('  <div style="margin:0.15rem 0;">' + (this.getPlayerPawnAvatarHtml ? this.getPlayerPawnAvatarHtml(rp, 48) : rp.badge) + '</div>');
                podHtml.push('  <div style="font-weight:bold; font-size:0.95rem; color:' + rp.color + '; margin-bottom:0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:145px;' + (isDeadP ? ' text-decoration:line-through; opacity:0.75;' : '') + '" title="' + this.escapeHtml(rp.name) + '">' + this.escapeHtml(rp.name) + '</div>');
                podHtml.push('  <div style="font-size:1.2rem; font-weight:bold; color:#f472b6;">' + formatH(rp.totalHearts) + ' 💖</div>');
                if (isDeadP) {
                    podHtml.push('  <small style="color:#ef4444; font-size:0.75rem; font-weight:700;">' + tModal("modals.endgame.podium_bankrupt", null, "💀 Vyřazen (bankrot)") + '</small>');
                } else {
                    podHtml.push('  <small style="color:var(--text-muted); font-size:0.75rem;">' + rp.gold.toLocaleString(isEn ? "en-US" : "cs-CZ") + ' ' + currGold + '</small>');
                }
                podHtml.push('</div>');
            }
            podEl.innerHTML = podHtml.join("\n");
        }

        var tblEl = document.getElementById("victory-table-el");
        if (tblEl) {
            var tHtml = [];
            tHtml.push('<thead><tr>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_rank", null, "Pořadí") + '</th>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_knight", null, "Rytíř") + '</th>');
            tHtml.push('  <th style="color:#f472b6;">' + tModal("modals.endgame.th_total_hearts", null, "Srdce celkem") + '</th>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_festivals", null, "Slavnosti") + '</th>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_quests", null, "Bojové úkoly") + '</th>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_animals", null, "Chov zvířat") + '</th>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_pouch", null, "Měšec") + '</th>');
            tHtml.push('  <th>' + tModal("modals.endgame.th_wealth", null, "Majetek celkem") + '</th>');
            tHtml.push('</tr></thead><tbody>');

            for (var i = 0; i < ranked.length; i++) {
                var p = ranked[i];
                var isDeadRow = !!(p.isEliminated || p.isBankrupt);
                var wealth = p.gold;
                for (var it = 0; it < p.items.length; it++) wealth += (p.items[it].price || 0);
                for (var nd = 0; nd < p.ownedNodes.length; nd++) {
                    var nObj = this.state.board.nodes[p.ownedNodes[nd]];
                    if (nObj) wealth += window.PRS_GameEngine.getNodeInvestedValue(this.state, nObj);
                }

                var deadBadge = isDeadRow ? (' <span style="background:#dc2626; color:#fff; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:4px;">' + tModal("modals.endgame.badge_eliminated", null, "💀 Vyřazen") + '</span>') : '';
                var pNameStyle = 'color:' + p.color + ';' + (isDeadRow ? ' text-decoration:line-through; opacity:0.7;' : '');

                var fWonStr = tModal("modals.endgame.festivals_won", { count: p.stats.festivalsWon }, p.stats.festivalsWon + "x výhra");
                var qSlainStr = tModal("modals.endgame.quests_slain", { count: p.stats.questsWon }, p.stats.questsWon + "x skoleno");
                var dSlainStr = p.stats.dragonsSlain > 0 ? (' <strong style="color:#ef4444; display:block; font-size:0.8rem;">' + tModal("modals.endgame.dragons_slain", { count: p.stats.dragonsSlain }, "🐉 " + p.stats.dragonsSlain + "x drak") + '</strong>') : '';

                tHtml.push('<tr>');
                tHtml.push('  <td><strong>#' + (i + 1) + '</strong></td>');
                tHtml.push('  <td><strong style="' + pNameStyle + '">' + p.badge + ' ' + this.escapeHtml(p.name) + '</strong> <small style="color:var(--text-muted);">(' + p.type + ')</small>' + deadBadge + '</td>');
                tHtml.push('  <td><strong style="color:#f472b6; font-size:1.05rem;">' + formatH(p.totalHearts) + ' 💖</strong></td>');
                tHtml.push('  <td>' + formatH(p.stats.heartsFromFestivals) + ' 💖 (' + fWonStr + ')</td>');
                tHtml.push('  <td>' + formatH(p.stats.heartsFromQuests) + ' 💖 (' + qSlainStr + ')' + dSlainStr + '</td>');
                tHtml.push('  <td>' + formatH(p.breedingHearts || 0) + ' 💖</td>');
                if (isDeadRow) {
                    tHtml.push('  <td><strong style="color:#ef4444;">💀 0 ' + currGold + '</strong></td>');
                } else {
                    tHtml.push('  <td><strong style="color:var(--gold-light);">' + p.gold.toLocaleString(isEn ? "en-US" : "cs-CZ") + ' ' + currGold + '</strong></td>');
                }
                tHtml.push('  <td>' + wealth.toLocaleString(isEn ? "en-US" : "cs-CZ") + ' ' + currGold + '</td>');
                tHtml.push('</tr>');
            }
            tHtml.push('</tbody>');
            tblEl.innerHTML = tHtml.join("\n");
        }

        var fb = document.getElementById("victory-cloud-feedback");

        if (fb) fb.textContent = "";

        modal.style.display = "flex";

        this.updateBodyModalClass();

        if (window.PRS_I18n && window.PRS_I18n.updateDOM) {
            window.PRS_I18n.updateDOM(modal);
        }

    },

    closeVictoryModal: function () {
        var modal = document.getElementById("victory-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    continueInEndlessMode: function () {
        if (!this.state) return;

        this.state.isEndlessMode = true;
        if (this.state.originalWinnerIndex === null || this.state.originalWinnerIndex === undefined) {
            this.state.originalWinnerIndex = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;
            this.state.originalWinRound = this.state.roundNumber || 1;
            this.state.originalWinType = this.state.winType || "standard";
        }

        // Pokud byla hra zastavena ve stavu GAME_OVER, vrátíme ji do běhu (fáze ROLL / ACTION)
        if (this.state.phase === "GAME_OVER") {
            if (this.state.pendingAction && this.state.pendingAction.type) {
                this.state.phase = "ACTION";
            } else {
                this.state.phase = "ROLL";
            }
        }

        this.closeVictoryModal();

        if (window.PRS_Audio && window.PRS_Audio.playNotice) {
            window.PRS_Audio.playNotice();
        }

        var winIdx = this.state.originalWinnerIndex;
        var winP = (this.state.players && this.state.players[winIdx]) ? this.state.players[winIdx] : null;
        var winName = winP ? winP.name : "Vítěz";

        if (this.showToast) {
            var isEnEndlessToast = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var tToast = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var msgToast = tToast("modals.endgame.endless_toast", { name: winName }, isEnEndlessToast
                ? ("♾️ Endless Mode started! Official winner: " + winName + ". You can continue freely playing and developing estates.")
                : ("♾️ Nekonečná hra zahájena! Oficiální vítěz: " + winName + ". Můžeš dál volně hrát a rozvíjet panství."));
            this.showToast(msgToast, "success");
        }

        if (this.renderGameScreen) {
            this.renderGameScreen();
        }

        // Pokud je aktuálně na tahu PC bot, naplánujeme jeho tah
        var curPl = this.state.players[this.state.currentPlayerIndex];
        if (curPl && curPl.type !== "Human" && this.scheduleBotTurnIfNeeded) {
            this.scheduleBotTurnIfNeeded();
        }

        // Pokud jde o online hru, uložíme aktualizovaný stav
        if (this.state.roomCode && this.saveSessionAuto) {
            this.saveSessionAuto();
        }
    },

    saveVictoryToCloud: function () {
        var self = this;
        var fb = document.getElementById("victory-cloud-feedback");
        var btn = document.getElementById("btn-save-hall-of-fame");
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var tModal = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

        if (fb) fb.textContent = tModal("modals.endgame.hall_saving", null, isEn ? "Recording victory in Hall of Fame on database..." : "Zapisuji vítězství do Síně slávy na MSSQL databázi...");
        if (btn) btn.disabled = true;

        var winIdx = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;
        var winner = this.state.players[winIdx];

        var payload = {
            sessionGuid: this.state.sessionGuid || ("v_" + Date.now()),
            roomCode: (this.state.sessionGuid ? this.state.sessionGuid.substring(0, 6).toUpperCase() : "VICTORY"),
            title: (isEn ? "The Princess's Heart - Victory: " : "Princeznino srdce - Vítězství: ") + winner.name,
            boardCode: this.state.board.code,
            status: "Finished",
            currentTurnPlayer: winIdx,
            turnNumber: this.state.turnNumber,
            targetHearts: this.state.config.targetHearts,
            winnerName: winner.name,
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        };

        fetch("api.ashx?action=save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (btn) btn.disabled = false;
                if (fb) {
                    if (res && res.ok) {
                        var code = res.roomCode || (isEn ? "SAVED" : "ULOŽENO");
                        fb.innerHTML = tModal("modals.endgame.hall_saved_ok", { code: code },
                            "✅ <strong>" + (isEn ? "Great! Victory was permanently recorded in the Hall of Fame on the server (code: " : "Skvělé! Vítězství bylo trvale zapsáno do Síně slávy na serveru (kód: ") + code + ").</strong>");
                    } else {
                        fb.innerHTML = tModal("modals.endgame.hall_saved_db", null, isEn ? "✅ Game saved to database." : "✅ Partie uložena do databáze.");
                    }
                }
            })
            .catch(function () {
                if (btn) btn.disabled = false;
                if (fb) fb.textContent = tModal("modals.endgame.hall_saved_local", null, isEn ? "✅ Match recorded locally." : "✅ Partie zaznamenána lokálně.");
            });
    },

    // Uložení odehrané partie do historie a profilu
    saveMatchToHistory: function (winner, ranked) {
        if (!this.state || !winner) return;
        var hist = [];
        try {
            hist = JSON.parse(localStorage.getItem("prs_game_history") || "[]");
        } catch (e) { }

        var entry = {
            id: "game_" + Date.now(),
            date: new Date().toLocaleDateString("cs-CZ") + " " + new Date().toLocaleTimeString("cs-CZ", { hour: '2-digit', minute: '2-digit' }),
            boardName: (this.state.board && this.state.board.name) || "Království KiDesky",
            mapVariant: this.state.mapVariant || "classic",
            roundNumber: this.state.roundNumber || 1,
            winnerName: winner.name,
            winnerBadge: winner.badge,
            winnerColor: winner.color,
            winnerHearts: winner.totalHearts,
            winType: this.state.winType || "standard",
            players: (ranked || []).map(function (p) {
                return {
                    name: p.name,
                    badge: p.badge,
                    color: p.color,
                    hearts: p.totalHearts,
                    gold: p.gold,
                    isDead: !!(p.isEliminated || p.isBankrupt)
                };
            })
        };

        hist.push(entry);
        if (hist.length > 25) hist = hist.slice(-25);
        try {
            localStorage.setItem("prs_game_history", JSON.stringify(hist));
        } catch (e) { }
    },

    // Otevření slavnostního modálu s Královským diplomem
    openWinnerDiplomaModal: function (histIndex) {
        var modal = document.getElementById("diploma-modal");
        if (!modal) return;

        var matchData = null;
        if (histIndex !== undefined && histIndex !== null) {
            try {
                var hist = JSON.parse(localStorage.getItem("prs_game_history") || "[]");
                matchData = hist[histIndex];
            } catch (e) { }
        }

        if (!matchData && this.state) {
            var winIdx = (this.state.originalWinnerIndex !== null && this.state.originalWinnerIndex !== undefined)
                ? this.state.originalWinnerIndex
                : ((this.state.winnerIndex !== null) ? this.state.winnerIndex : 0);
            var winner = (this.state.players && this.state.players[winIdx]) ? this.state.players[winIdx] : { name: "Rytíř", badge: "👑", color: "#fbbf24", totalHearts: 30 };
            matchData = {
                id: "game_" + Date.now(),
                date: new Date().toLocaleDateString("cs-CZ") + " " + new Date().toLocaleTimeString("cs-CZ", { hour: '2-digit', minute: '2-digit' }),
                boardName: (this.state.board && this.state.board.name) || "Království KiDesky",
                roundNumber: this.state.roundNumber || 1,
                winnerName: winner.name,
                winnerBadge: winner.badge,
                winnerColor: winner.color,
                winnerHearts: winner.totalHearts,
                winType: this.state.winType || "standard"
            };
        }

        if (!matchData) return;
        this._currentDiplomaMatch = matchData;
        modal.style.display = "flex";
        this.updateBodyModalClass();
        if (window.PRS_I18n && window.PRS_I18n.updateDOM) {
            window.PRS_I18n.updateDOM(modal);
        }
        this.renderWinnerDiploma(matchData);
        if (window.PRS_Audio) window.PRS_Audio.playFanfare();
    },

    closeWinnerDiplomaModal: function () {
        var modal = document.getElementById("diploma-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    // Vykreslení iluminovaného dekretu na HTML5 Canvas
    renderWinnerDiploma: function (data) {
        var canvas = document.getElementById("diploma-canvas");
        if (!canvas) return;
        var ctx = canvas.getContext("2d");
        var w = canvas.width;
        var h = canvas.height;

        // 1. Pergamenový podklad s vinětací
        var bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, 450);
        bgGrad.addColorStop(0, "#fefce8");
        bgGrad.addColorStop(0.65, "#fbf3db");
        bgGrad.addColorStop(1, "#ebd5a7");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Subtílní textura stárnoucího papíru
        ctx.save();
        ctx.fillStyle = "rgba(180, 130, 60, 0.04)";
        for (var i = 0; i < 40; i++) {
            var rx = (i * 97) % w;
            var ry = (i * 71) % h;
            var rw = 30 + ((i * 13) % 80);
            var rh = 15 + ((i * 7) % 50);
            ctx.fillRect(rx, ry, rw, rh);
        }
        ctx.restore();

        // 2. Ozdobný dvojitý zlatý lem a rohy
        ctx.strokeStyle = "#c59b27";
        ctx.lineWidth = 6;
        ctx.strokeRect(18, 18, w - 36, h - 36);

        ctx.strokeStyle = "#78350f";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(26, 26, w - 52, h - 52);

        // Rohové ornamenty
        var corners = [
            [26, 26], [w - 26, 26],
            [26, h - 26], [w - 26, h - 26]
        ];
        ctx.fillStyle = "#c59b27";
        corners.forEach(function (pt) {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 8, 0, Math.PI * 2);
            ctx.fill();
        });

        var isEnDip = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var tDip = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

        // 3. Záhlaví a koruna
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "38px serif";
        ctx.fillText("👑", w / 2, 65);

        ctx.font = "bold 15px 'Cinzel', serif";
        ctx.fillStyle = "#854d0e";
        ctx.fillText(tDip("modals.diploma.realm_header", null, "KRÁLOVSTVÍ KIDESKY"), w / 2, 102);

        ctx.font = "bold 24px 'Cinzel', serif";
        ctx.fillStyle = "#451a03";
        ctx.fillText(tDip("modals.diploma.game_title", null, "PRINCEZNINO SRDCE"), w / 2, 130);

        // Dělící zlatá linka s ornamentem
        ctx.strokeStyle = "#c59b27";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 180, 148);
        ctx.lineTo(w / 2 + 180, 148);
        ctx.stroke();
        ctx.fillStyle = "#c59b27";
        ctx.font = "14px serif";
        ctx.fillText("✦  ⚜️  ✦", w / 2, 148);

        // 4. Titul diplomu
        ctx.font = "bold 27px 'Cinzel', serif";
        ctx.fillStyle = "#b45309";
        ctx.fillText(tDip("modals.diploma.diploma_title", null, "KRÁLOVSKÝ DIPLOM VÍTĚZE"), w / 2, 188);

        // 5. Provolání
        ctx.font = "italic 15px 'Outfit', sans-serif";
        ctx.fillStyle = "#5c3d18";
        ctx.fillText(tDip("modals.diploma.proclamation", null, "Tímto slavnostním dekretem se dává na vědomí celému světu, že udatný rytíř"), w / 2, 225);

        // Jméno vítěze
        ctx.font = "bold 32px 'Cinzel', serif";
        ctx.fillStyle = data.winnerColor || "#b45309";
        var winTitle = (data.winnerBadge ? data.winnerBadge + " " : "") + (data.winnerName || "Neznámý Rytíř");
        ctx.fillText(winTitle, w / 2, 268);

        // Dekretový text o vítězství
        ctx.font = "16px 'Outfit', sans-serif";
        ctx.fillStyle = "#3e2710";
        var mapTxt = data.boardName || (isEnDip ? "Realm of KiDesky" : "Království");
        var rTxt = data.roundNumber || 1;
        var hTxt = data.winnerHearts || 30;
        ctx.fillText(tDip("modals.diploma.decree_p1", { round: rTxt }, "dokázal v nelítostném a čestném zápolení po " + rTxt + " kolech ovládnout turnaj"), w / 2, 315);
        ctx.fillText(tDip("modals.diploma.decree_p2", { board: mapTxt, hearts: hTxt }, "na herním stole „" + mapTxt + "“ a získal celkem " + hTxt + " Princezniných srdcí,"), w / 2, 342);
        ctx.fillText(tDip("modals.diploma.decree_p3", null, "čímž si vydobyl nehynoucí slávu rytířského stavu i ruku spanilé princezny."), w / 2, 369);

        // 6. Královské pečetě a podpis
        // Levá pečeť (Červený vosk)
        var sealX = 140, sealY = 465;
        var sGrad = ctx.createRadialGradient(sealX, sealY, 5, sealX, sealY, 40);
        sGrad.addColorStop(0, "#dc2626");
        sGrad.addColorStop(0.85, "#991b1b");
        sGrad.addColorStop(1, "#5f0f0f");
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(sealX, sealY, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#fef08a";
        ctx.font = "24px serif";
        ctx.fillText("👑", sealX, sealY - 4);
        ctx.font = "bold 8px 'Cinzel', serif";
        ctx.fillText(tDip("modals.diploma.seal_label", null, "KRÁLOVSKÁ PEČEŤ"), sealX, sealY + 18);

        // Středové údaje
        ctx.font = "12px 'Outfit', sans-serif";
        ctx.fillStyle = "#78350f";
        ctx.fillText(tDip("modals.diploma.issued_in", null, "Dáno v sídelním městě království KiDesky"), w / 2, 445);
        ctx.font = "bold 13px 'Cinzel', serif";
        ctx.fillStyle = "#451a03";
        var dateFormatted = data.date || new Date().toLocaleDateString(isEnDip ? "en-US" : "cs-CZ");
        ctx.fillText(tDip("modals.diploma.date_label", { date: dateFormatted }, "Datum: " + dateFormatted), w / 2, 468);
        ctx.font = "11px 'Outfit', sans-serif";
        ctx.fillStyle = "#854d0e";
        var decNo = String(data.id || "").replace("game_", "").slice(-6);
        ctx.fillText(tDip("modals.diploma.decree_no", { no: decNo }, "Dekret koruny č. KD-" + decNo), w / 2, 490);

        // Pravá strana: podpis kancléře
        var signX = w - 160, signY = 455;
        ctx.font = "italic 13px 'Outfit', sans-serif";
        ctx.fillStyle = "#5c3d18";
        ctx.fillText(tDip("modals.diploma.behalf_of", null, "V zastoupení koruny a dvora:"), signX, signY - 18);
        ctx.font = "italic bold 18px 'Cinzel', serif";
        ctx.fillStyle = "#1e293b";
        ctx.fillText("Lord Kikin", signX, signY + 6);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(signX - 60, signY + 16);
        ctx.lineTo(signX + 60, signY + 16);
        ctx.stroke();
        ctx.font = "10px 'Outfit', sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.fillText(tDip("modals.diploma.chancellor_title", null, "Nejvyšší královský kancléř"), signX, signY + 28);
    },

    // Stažení certifikátu jako PNG
    downloadWinnerDiploma: function () {
        var canvas = document.getElementById("diploma-canvas");
        if (!canvas) return;
        var dataUrl = canvas.toDataURL("image/png");
        var link = document.createElement("a");
        var winName = (this._currentDiplomaMatch && this._currentDiplomaMatch.winnerName) ? this._currentDiplomaMatch.winnerName.replace(/\s+/g, "_") : "vitez";
        link.download = "kralovsky_diplom_" + winName + ".png";
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (this.showToast) {
            this.showToast("💾 Královský diplom vítěze byl úspěšně stažen do tvého zařízení!", "success");
        }
    },

    // --- KRÁLOVSKÁ ZBROJNICE A TRŽIŠTĚ (MODAL) ---,

    openLivestockMarket: function () {
        this.openArmoryModal();
        this.setArmoryTab("livestock");
    },

    openArmoryModal: function () {

        var modal = document.getElementById("armory-modal");

        if (!modal) return;

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

        this.renderArmoryModalContent();

        modal.style.display = "flex";

    },

    closeArmoryModal: function () {

        var modal = document.getElementById("armory-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    setArmoryTab: function (tab) {

        this.armoryActiveTab = tab;

        var btns = document.querySelectorAll(".armory-tab-btn");

        btns.forEach(function (b) {

            if (b.getAttribute("data-armtab") === tab) b.classList.add("active");

            else b.classList.remove("active");

        });

        this.renderArmoryGrid();

    },

    // Převod kódů slotů do přehledného jazyka pro zbrojnici, obchod i inventář
    formatSlotLabel: function (slot, withIcon) {
        var s = (slot || "").toLowerCase();
        var icon = "";
        var key = "default";
        switch (s) {
            case "weapon": icon = "🗡️ "; key = "weapon"; break;
            case "armor": icon = "🛡️ "; key = "armor"; break;
            case "dress": icon = "👗 "; key = "dress"; break;
            case "jewel": icon = "💍 "; key = "jewel"; break;
            case "trophy": icon = "🏆 "; key = "trophy"; break;
            default: icon = "📦 "; key = "default"; break;
        }
        var defTxt = (key === "weapon" ? "Zbraň" : (key === "armor" ? "Zbroj" : (key === "dress" ? "Šaty & Plášť" : (key === "jewel" ? "Klenot" : (key === "trophy" ? "Trofej" : "Vybavení")))));
        var txt = window.PRS_I18n ? window.PRS_I18n.t("slots." + key, null, defTxt) : defTxt;
        return withIcon ? (icon + txt) : txt;
    },

    renderArmoryModalContent: function () {

        if (!this.state || !this.state.players) return;

        var player = this.state.players[this.state.currentPlayerIndex];

        var currNode = this.state.board ? this.state.board.nodes[player.nodeId] : null;

        var isAtMerchant = currNode && currNode.type === "MERCHANT";

        var pa = this.state.pendingAction;

        var canShop = isAtMerchant && pa && pa.canShopMerchant;

        // Informace o rytíři a měšci

        var infoEl = document.getElementById("armory-player-info");

        if (infoEl) {

            infoEl.innerHTML = 'Rytíř: <strong style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</strong> &nbsp;|&nbsp; V měšci: <strong style="color:var(--gold-light); font-size:1.05rem;">' + player.gold.toLocaleString("cs-CZ") + ' zl.</strong>';

        }

        // Status obchodníka

        var statusEl = document.getElementById("armory-merchant-status-badge");

        if (statusEl) {

            if (canShop) {

                statusEl.innerHTML = '<span style="color:#86efac; font-weight:bold; background:rgba(34,197,94,0.18); border:1px solid #22c55e; padding:3px 9px; border-radius:6px;">🏪 Stojíš u Obchodníka – Nákup i výkup aktivní!</span>';

            } else if (isAtMerchant) {

                statusEl.innerHTML = '<span style="color:#fde047; background:rgba(234,179,8,0.18); border:1px solid #eab308; padding:3px 9px; border-radius:6px;">⚖️ Jsi na poli Obchodníka</span>';

            } else {

                statusEl.innerHTML = '<span style="color:#94a3b8; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:3px 9px; border-radius:6px;">👀 Prohlídka katalogu (k nákupu musíš vstoupit na pole Obchodník)</span>';

            }

        }

        this.setArmoryTab(this.armoryActiveTab || "all");

    },

    renderArmoryGrid: function () {

        var grid = document.getElementById("armory-items-grid");

        if (!grid || !this.state) return;

        var player = this.state.players[this.state.currentPlayerIndex];

        var currNode = this.state.board ? this.state.board.nodes[player.nodeId] : null;

        var isAtMerchant = currNode && currNode.type === "MERCHANT";

        var pa = this.state.pendingAction;

        var canShop = isAtMerchant && pa && pa.canShopMerchant;

        var tab = this.armoryActiveTab || "all";

        var html = [];

        // 1. ZÁLOŽKA VÝKUP MAJETKU (Prodej věcí za 50% / budov za 100% u obchodníka)

        if (tab === "sell") {

            var rates = this.state.config.sellRates;

            var itemRatio = isAtMerchant ? rates.merchantItem : rates.anywhereItem;

            var bldRatio = isAtMerchant ? rates.merchantBuilding : rates.anywhereBuilding;

            html.push('<div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">');

            html.push('  <div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:0.6rem 0.8rem; font-size:0.83rem;">');

            html.push('    <strong>Kurz výkupu:</strong> ' + (isAtMerchant ? '🌟 Zlatý kurz na trhu: <strong>' + Math.round(itemRatio * 100) + ' %</strong> z ceny předmětů, <strong>' + Math.round(bldRatio * 100) + ' %</strong> z investic do budov!' : 'Běžný výkup na cestě: ' + Math.round(itemRatio * 100) + ' % věci, ' + Math.round(bldRatio * 100) + ' % budovy.'));

            html.push('  </div>');

            html.push('</div>');

            if (player.items.length === 0 && player.ownedNodes.length === 0) {

                html.push('<div style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-muted);">Tvůj inventář je prázdný, nemáš co prodat.</div>');

            } else {

                // Seznam předmětů k prodeji

                for (var i = 0; i < player.items.length; i++) {

                    var it = player.items[i];
                    var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                                  (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);
                    var itemName = it.name || (baseDef ? baseDef.name : "Neznámý předmět");
                    var itemIcon = it.icon || (baseDef ? baseDef.icon : "📦");
                    var itemSlot = it.slot || (baseDef ? baseDef.slot : "weapon");
                    var itemTier = it.tier || (baseDef ? baseDef.tier : 1);
                    var itemPrice = (it.price !== undefined && it.price !== null) ? it.price : (baseDef && baseDef.price ? baseDef.price : 1000);
                    var sellPrice = Math.round(itemPrice * itemRatio);

                    var itCombat = Number(it.combat !== undefined && it.combat !== null ? it.combat : (baseDef && baseDef.combat !== undefined ? baseDef.combat : 0)) || 0;
                    var itRiding = Number(it.riding !== undefined && it.riding !== null ? it.riding : (baseDef && baseDef.riding !== undefined ? baseDef.riding : 0)) || 0;
                    var itDance = Number(it.dance !== undefined && it.dance !== null ? it.dance : (baseDef && baseDef.dance !== undefined ? baseDef.dance : 0)) || 0;
                    var itCharisma = Number(it.charisma !== undefined && it.charisma !== null ? it.charisma : (baseDef && baseDef.charisma !== undefined ? baseDef.charisma : 0)) || 0;

                    html.push('<div class="armory-card armory-card-tier-' + itemTier + '">');

                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');

                    html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + itemTier + '. stupeň</span>');

                    html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(itemSlot, true) + '</span>');

                    html.push('  </div>');

                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + itemIcon + ' ' + this.escapeHtml(itemName) + '</div>');

                    html.push('  <div style="margin-bottom:0.6rem;">');

                    if (itCombat) html.push('<span class="armory-stat-chip ' + (itCombat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (itCombat > 0 ? '+' : '') + itCombat + ' Boj</span> ');

                    if (itRiding) html.push('<span class="armory-stat-chip ' + (itRiding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (itRiding > 0 ? '+' : '') + itRiding + ' Jízda</span> ');

                    if (itDance) html.push('<span class="armory-stat-chip ' + (itDance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (itDance > 0 ? '+' : '') + itDance + ' Tanec</span> ');

                    if (itCharisma) html.push('<span class="armory-stat-chip ' + (itCharisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (itCharisma > 0 ? '+' : '') + itCharisma + ' Charisma</span> ');

                    html.push('  </div>');

                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');

                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + sellPrice.toLocaleString("cs-CZ") + ' zl.</span>');

                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'item\', \'' + (it.uid || it.id) + '\')">💰 Prodat</button>');

                    html.push('  </div>');

                    html.push('</div>');

                }

                // Nemovitosti k prodeji

                for (var b = 0; b < player.ownedNodes.length; b++) {

                    var bNode = this.state.board.nodes[player.ownedNodes[b]];

                    if (!bNode) continue;

                    var invested = window.PRS_GameEngine.getNodeInvestedValue(this.state, bNode);

                    var bSellPrice = Math.round(invested * bldRatio);

                    html.push('<div class="armory-card" style="border-top:3.5px solid #22c55e;">');

                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');

                    html.push('    <span class="armory-badge-tier" style="background:rgba(34,197,94,0.18); color:#86efac;">Nemovitost</span>');

                    html.push('    <span style="font-size:0.75rem; color:var(--text-muted);">' + bNode.code + '</span>');

                    html.push('  </div>');

                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + bNode.icon + ' ' + this.escapeHtml(bNode.name) + '</div>');

                    html.push('  <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.6rem;">Investováno celkem: ' + invested.toLocaleString("cs-CZ") + ' zl.</div>');

                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');

                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + bSellPrice.toLocaleString("cs-CZ") + ' zl.</span>');

                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'node\', ' + bNode.id + ')">🏦 Prodat</button>');

                    html.push('  </div>');

                    html.push('</div>');

                }

            }

            grid.innerHTML = html.join("\n");

            return;

        }

        // 2. ZÁLOŽKA TAJEMNÉ BALÍČKY

        if (tab === "packs") {

            var packs = this.state.config.itemPackPrices;

            var packDefs = [

                { tier: 1, name: "Balíček Věci 1. stupně", icon: "🎒", price: packs.tier1, desc: "Základní rytířská výzbroj (tesáky, prošívané zbroje, kabátce, ostruhy)." },

                { tier: 2, name: "Balíček Věci 2. stupně", icon: "⚔️", price: packs.tier2, desc: "Turnajové dřevce, damaškové meče, plátová zbroj, brokátové róby." },

                { tier: 3, name: "Balíček Věci 3. stupně", icon: "👑", price: packs.tier3, desc: "Královské legendární předměty: Meč dračího bijce, zlatá zbroj, knížecí šat." }

            ];

            for (var p = 0; p < packDefs.length; p++) {

                var pk = packDefs[p];

                var canAfford = player.gold >= pk.price;

                html.push('<div class="armory-card armory-card-tier-' + pk.tier + '">');

                html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');

                html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + pk.tier + '. STUPEŇ</span>');

                html.push('    <span style="font-size:0.8rem; color:#fde047; font-weight:bold;">' + pk.price.toLocaleString("cs-CZ") + ' zl.</span>');

                html.push('  </div>');

                html.push('  <div style="font-size:1.1rem; font-weight:bold; color:#fff; margin-bottom:0.35rem;">' + pk.icon + ' ' + pk.name + '</div>');

                html.push('  <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.85rem;">' + pk.desc + '</p>');

                html.push('  <div style="margin-top:auto;">');

                if (!canShop) {

                    html.push('    <button class="btn-secondary" disabled style="width:100%; opacity:0.45; font-size:0.82rem;">Jen u Obchodníka</button>');

                } else if (!canAfford) {

                    html.push('    <button class="btn-action-buy" disabled style="width:100%; opacity:0.4; font-size:0.82rem;">Nedostatek zlata</button>');

                } else {

                    html.push('    <button class="btn-action-buy" style="width:100%; font-size:0.85rem;" onclick="PRS_App.handleBuyPackFromArmory(' + pk.tier + ')">🎁 Koupit balíček (' + pk.price.toLocaleString("cs-CZ") + ' zl.)</button>');

                }

                html.push('  </div>');

                html.push('</div>');

            }

            grid.innerHTML = html.join("\n");

            return;

        }

        // 2.5 ZÁLOŽKA DOBYTČÍ TRH & HOSPODÁŘSKÝ CHOV (Krávy, Ovce, Prasata)
        if (tab === "livestock") {
            var st = window.PRS_GameEngine.getEffectiveStats(this.state, player);
            var isAtStables = currNode && currNode.type === "BUILDING" && currNode.subtype === "stables";
            var canShopAnimals = canShop || isAtStables;
            var canBuyMore = (st.extraLivestockCount < st.livestockCapacity);

            html.push('<div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">');
            html.push('  <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:8px; padding:0.65rem 0.85rem; font-size:0.83rem;">');
            html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; flex-wrap:wrap; gap:6px;">');
            html.push('      <span style="font-size:0.92rem; font-weight:700; color:var(--gold-light);">🌾 Pastviny a královské stáje</span>');
            html.push('      <span style="color:#fde047; font-weight:700;">Daňový zisk z chovu: +' + (st.livestockTaxBonus || 0).toLocaleString("cs-CZ") + ' zl.</span>');
            html.push('    </div>');
            html.push('    <div style="color:#cbd5e1; font-size:0.77rem; line-height:1.4;">');
            html.push('      Kapacita přikoupených stád: <strong style="color:#4ade80;">' + st.extraLivestockCount + ' / ' + st.livestockCapacity + ' ks</strong> &nbsp;|&nbsp; Celkový chov: 🐄 ' + (st.cattle || 0) + ' krav, 🐑 ' + (st.sheep || 0) + ' ovcí, 🐖 ' + (st.pigs || 0) + ' prasat.');
            html.push('      <br><small style="color:#94a3b8;">Každá 🏡 Vesnice poskytuje +3 pastviny (a automaticky chová 1★ 🐑, 2★ 🐖, 3★ 🐄), 🏛️ Město +2 pastviny a 🏠 Stáje +4 pastviny. Dobytek trvale zvyšuje daň u Výběrčího daní i mýtné na tvých vesnicích!</small>');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');

            var lsCfgMod = (this.state && this.state.config && this.state.config.livestock) ? this.state.config.livestock : {};
            var sPr = (lsCfgMod.sheepPrice !== undefined) ? Number(lsCfgMod.sheepPrice) : 500;
            var sTx = (lsCfgMod.sheepTax !== undefined) ? Number(lsCfgMod.sheepTax) : 120;
            var sRn = (lsCfgMod.sheepRent !== undefined) ? Number(lsCfgMod.sheepRent) : 50;
            var pPr = (lsCfgMod.pigsPrice !== undefined) ? Number(lsCfgMod.pigsPrice) : 600;
            var pTx = (lsCfgMod.pigsTax !== undefined) ? Number(lsCfgMod.pigsTax) : 150;
            var pRn = (lsCfgMod.pigsRent !== undefined) ? Number(lsCfgMod.pigsRent) : 75;
            var cPr = (lsCfgMod.cattlePrice !== undefined) ? Number(lsCfgMod.cattlePrice) : 800;
            var cTx = (lsCfgMod.cattleTax !== undefined) ? Number(lsCfgMod.cattleTax) : 200;
            var cRn = (lsCfgMod.cattleRent !== undefined) ? Number(lsCfgMod.cattleRent) : 100;

            var catalog = [
                { id: "sheep", name: "Chovná ovce", icon: "🐑", price: sPr, taxBonus: sTx, rentBonus: sRn, desc: "Nenáročný chov pro pastviny. Trvale zvyšuje daň u Výběrčího daní o +" + sTx + " zl. a mýtné tvých vesnic o +" + sRn + " zl." },
                { id: "pigs", name: "Královské prase", icon: "🐖", price: pPr, taxBonus: pTx, rentBonus: pRn, desc: "Tučný výnos pro osady. Trvale zvyšuje daň u Výběrčího daní o +" + pTx + " zl. a mýtné tvých vesnic o +" + pRn + " zl." },
                { id: "cattle", name: "Ušlechtilý skot (Kráva)", icon: "🐄", price: cPr, taxBonus: cTx, rentBonus: cRn, desc: "Špičkový velký dobytek. Trvale zvyšuje daň u Výběrčího daní o +" + cTx + " zl. a mýtné tvých vesnic o +" + cRn + " zl." }
            ];

            for (var c = 0; c < catalog.length; c++) {
                var catItem = catalog[c];
                var canAfford = player.gold >= catItem.price;

                html.push('<div class="armory-card armory-card-tier-2" style="display:flex; flex-direction:column; justify-content:space-between;">');
                html.push('  <div>');
                html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
                html.push('      <span class="armory-badge-tier" style="background:rgba(74,222,128,0.18); color:#86efac;">Hospodářský chov</span>');
                html.push('      <span class="armory-slot-badge">🌾 Zvíře</span>');
                html.push('    </div>');
                html.push('    <div style="font-weight:bold; font-size:1.05rem; color:#f8fafc; margin-bottom:0.35rem;">' + catItem.icon + ' ' + catItem.name + '</div>');
                html.push('    <p style="font-size:0.77rem; color:#cbd5e1; margin-bottom:0.6rem; line-height:1.35;">' + catItem.desc + '</p>');
                html.push('    <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.75rem;">');
                html.push('      <span class="armory-stat-chip armory-stat-pos">💰 +' + catItem.taxBonus + ' zl. / daň</span>');
                html.push('      <span class="armory-stat-chip armory-stat-pos">🏡 +' + catItem.rentBonus + ' zl. / mýto</span>');
                html.push('    </div>');
                html.push('  </div>');

                html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.06);">');
                html.push('    <span style="font-size:0.95rem; color:var(--gold-light); font-weight:bold;">' + catItem.price.toLocaleString("cs-CZ") + ' zl.</span>');

                if (st.livestockCapacity <= 0) {
                    html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.5;" title="Kup nejprve Vesnici, Město nebo Stáje">Nemáš pastviny</button>');
                } else if (!canBuyMore) {
                    html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.5;" title="Pastviny jsou plné">Pastviny plné</button>');
                } else if (!canShopAnimals) {
                    html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.45;" title="K nákupu musíš stát na poli Obchodník nebo Stáje">U Obchodníka / Stájí</button>');
                } else if (!canAfford) {
                    html.push('    <button class="btn-action-buy" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.4;">Málo zlata</button>');
                } else {
                    html.push('    <button class="btn-action-buy" style="padding:0.32rem 0.75rem; font-size:0.84rem; cursor:pointer;" onclick="PRS_App.handleBuyLivestock(\x27' + catItem.id + '\x27)">🛒 Koupit ' + catItem.icon + '</button>');
                }

                html.push('  </div>');
                html.push('</div>');
            }

            grid.innerHTML = html.join("\n");
            return;
        }

        // 3. KATALOG JEDNOTLIVÝCH PŘEDMĚTŮ (Zbraně, Zbroje, Šaty, Klenoty)

        var items = window.PRS_ITEMS || [];

        var filtered = items.filter(function (it) {

            if (tab === "all") return it.slot !== "trophy";

            return it.slot === tab;

        });

        // Mapování vlastněných předmětů

        var ownedIds = {};

        for (var o = 0; o < player.items.length; o++) {

            ownedIds[player.items[o].id] = true;

        }

        for (var k = 0; k < filtered.length; k++) {

            var item = filtered[k];

            var isOwned = !!ownedIds[item.id];

            var canAfford = player.gold >= item.price;

            html.push('<div class="armory-card armory-card-tier-' + (item.tier || 1) + '">');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');

            html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + (item.tier || 1) + '. stupeň</span>');

            html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(item.slot, true) + '</span>');

            html.push('  </div>');

            html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.4rem;">' + item.icon + ' ' + this.escapeHtml(item.name) + '</div>');

            html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.3rem; margin-bottom:0.75rem;">');

            if (item.combat) html.push('<span class="armory-stat-chip ' + (item.combat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (item.combat > 0 ? '+' : '') + item.combat + ' Boj</span>');

            if (item.riding) html.push('<span class="armory-stat-chip ' + (item.riding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (item.riding > 0 ? '+' : '') + item.riding + ' Jízda</span>');

            if (item.dance) html.push('<span class="armory-stat-chip ' + (item.dance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (item.dance > 0 ? '+' : '') + item.dance + ' Tanec</span>');

            if (item.charisma) html.push('<span class="armory-stat-chip ' + (item.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (item.charisma > 0 ? '+' : '') + item.charisma + ' Charisma</span>');

            html.push('  </div>');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.06);">');

            html.push('    <span style="font-size:0.92rem; color:var(--gold-light); font-weight:bold;">' + item.price.toLocaleString("cs-CZ") + ' zl.</span>');

            if (isOwned) {

                html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.65; cursor:default;">✓ Vlastníš</button>');

            } else if (!canShop) {

                html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.45;">Jen na trhu</button>');

            } else if (!canAfford) {

                html.push('    <button class="btn-action-buy" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.4;">Málo zlata</button>');

            } else {

                html.push('    <button class="btn-action-buy" style="padding:0.32rem 0.7rem; font-size:0.82rem;" onclick="PRS_App.handleBuySpecificItem(\'' + item.id + '\')">🛒 Koupit</button>');

            }

            html.push('  </div>');

            html.push('</div>');

        }

        grid.innerHTML = html.join("\n");

    },

    handleBuySpecificItem: function (itemId) {

        var bought = window.PRS_GameEngine.buySpecificItem(this.state, itemId);

        if (bought) {

            if (window.PRS_Audio) window.PRS_Audio.playCoin();

            this.renderArmoryModalContent();

            this.renderGameScreen();

        }

    },

    handleBuyPackFromArmory: function (tier) {

        var bought = window.PRS_GameEngine.buyItemPack(this.state, tier);

        if (bought) {

            if (window.PRS_Audio) window.PRS_Audio.playCoin();

            this.renderArmoryModalContent();

            this.renderGameScreen();

        }

    },

    handleSellAssetFromArmory: function (assetType, assetId) {

        var ok = window.PRS_GameEngine.sellAsset(this.state, assetType, assetId);

        if (ok) {

            if (window.PRS_Audio) window.PRS_Audio.playCoin();

            this.renderArmoryModalContent();

            this.renderGameScreen();

        }

    },

    // --- PŘEPÍNÁNÍ ZÁLOŽEK ---

    activeTab: "lobby",

    rulesSubtab: "rules",

    bestiaryActiveTier: "all",

    trophiesActiveCategory: "all",

    currentLandingMedia: "anim",

    landingCanvasTimer: null,

    myOnlinePlayerIndex: -1,

    onlinePollingEnabled: true,

    onlinePollTimer: null,

    isOnlineSyncing: false,

    isActionProcessing: false,

    isSavingSession: false,

    openQuestDuelModal: function () {

        var pa = this.state.pendingAction;

        if (!pa || !pa.canResolveQuest || !pa.questCard) return;

        var modal = document.getElementById("quest-duel-modal");

        var body = document.getElementById("quest-duel-modal-body");

        if (!modal || !body) return;

        this.duelMonsterFlipped = false;

        this.selectedDuelTactic = "normal";

        this.selectedDuelStance = "tactical";

        this.isDuelRolling = false;

        this.renderQuestDuelContent();

        modal.style.display = "flex";

        this.updateBodyModalClass();

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

    },

    closeQuestDuelModal: function () {

        var modal = document.getElementById("quest-duel-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    toggleDuelMonsterFlip: function () {

        this.duelMonsterFlipped = !this.duelMonsterFlipped;

        var img = document.getElementById("quest-monster-img-el");

        if (img) {

            if (this.duelMonsterFlipped) img.classList.add("flipped");

            else img.classList.remove("flipped");

        }

        if (window.PRS_Audio) window.PRS_Audio.playItem();

    },

    selectDuelTactic: function (tacticKey) {

        if (this.isDuelRolling) return;

        this.selectedDuelTactic = tacticKey;

        this.renderQuestDuelContent();

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    selectDuelStance: function (stanceKey) {

        if (this.isDuelRolling) return;

        this.selectedDuelStance = stanceKey;

        this.renderQuestDuelContent();

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    renderQuestDuelContent: function () {

        var pa = this.state.pendingAction;

        if (!pa || !pa.canResolveQuest || !pa.questCard) return;

        var body = document.getElementById("quest-duel-modal-body");

        if (!body) return;

        var q = pa.questCard;

        var player = this.state.players[this.state.currentPlayerIndex];

        var stats = window.PRS_GameEngine.getEffectiveStats(this.state, player);

        var hasHorse = stats.horses > 0;

        var hasHounds = stats.dogs > 0 || stats.falcons > 0;

        var canAffordElixir = player.gold >= 500;

        var tacticObj = {

            charge: this.selectedDuelTactic === "charge",

            hounds: this.selectedDuelTactic === "hounds",

            elixir: this.selectedDuelTactic === "elixir"

        };

        var tacticBonus = 0;

        if (tacticObj.charge && hasHorse) tacticBonus = 1;

        if (tacticObj.hounds && hasHounds) tacticBonus = 1;

        var animalBonus = 0;

        if (q.questTier === "U1" && hasHounds) {

            animalBonus = 1;

        } else if (q.questTier === "U3" && hasHounds) {

            animalBonus = (stats.dogs > 0 && stats.falcons > 0) ? 2 : 1;

        }

        var horseBonus = (q.questTier !== "U1" && hasHorse) ? (1 + Math.floor(stats.riding / 2)) : 0;

        var wRes = window.PRS_GameEngine.checkQuestWeakness(this.state, player, q, tacticObj);

        var weaknessBonus = wRes.exploited ? 2 : 0;

        var stanceBonus = 0;

        if (this.selectedDuelStance === "aggressive") stanceBonus = 2;

        else if (this.selectedDuelStance === "defensive") stanceBonus = -1;

        var basePower = stats.combat + animalBonus + horseBonus + tacticBonus + weaknessBonus + stanceBonus;

        var neededRoll = q.difficulty - basePower;

        var winCount = 0;

        for (var d = 1; d <= 6; d++) {

            if (basePower + d >= q.difficulty) winCount++;

        }

        var winRate = Math.round((winCount / 6) * 100);

        var qImg = this.duelMonsterFlipped ? (q.imgFlip || q.img) : (q.img || "assets/landmarks/dragon.png");

        var tierTitle = (q.questTier === "U3") ? "Dračí doupě" : (q.questTier === "U2" ? "Temné monstrum" : "Divoká zvěř");

        var tierColor = (q.questTier === "U3") ? "#ef4444" : (q.questTier === "U2" ? "#f59e0b" : "#10b981");

        var wMap = {

            dogs: "🐕 Lovečtí psi odlákají pozornost (+1 k síle)",

            falcons: "🦅 Lovecký sokol vystopuje zvíře v houští (+1 k síle)",

            horse: "🏇 Útok na koni z plné jízdy dává taktickou převahu",

            spear: "🔱 Dlouhé kopí udrží bestii v bezpečné vzdálenosti",

            armor: "🛡️ Pevná rytířská zbroj chrání před drtivými údery",

            water_armor: "💧 Vodní brnění nebo zbroj chrání před ohněm",

            fire: "🔥 Ohnivé zbraně roztaví ledové brnění",

            ice: "❄️ Mrazivá magie zchladí žhavou lávu",

            elixir: "🧪 Hojivý lektvar z Lazaretu neutralizuje jedy",

            dance: "💃 Taneční krok a Charisma okouzlí hravou bestii",

            charisma: "✨ Vysoké charisma rytíře dojme drahokamovou bytost",

            light: "☀️ Světelné relikvie rozeženou stínovou temnotu",

            crystal: "💎 Drahokamové ostří probodne zkamenělou kůži",

            undead: "💀 Posvěcená čepel a modlitba zničí nemrtvé kosti",

            holy: "✨ Svaté relikvie spálí temného draka",

            dragon_slayer: "🗡️ Legendární meč Dračího bijce zaručuje triumf"

        };

        var weaknessText = wMap[q.weakness] || "Tato bestie vyžaduje odvahu a pevnou ruku.";

        var trophyHtml = "";

        if (q.trophyId && window.PRS_TROPHIES && window.PRS_TROPHIES[q.trophyId]) {

            var tr = window.PRS_TROPHIES[q.trophyId];

            var trBonuses = [];

            if (tr.combat) trBonuses.push("⚔️+" + tr.combat);

            if (tr.riding) trBonuses.push("🏇+" + tr.riding);

            if (tr.dance) trBonuses.push("💃+" + tr.dance);

            if (tr.charisma) trBonuses.push("✨+" + tr.charisma);

            trophyHtml = '<div class="quest-trophy-banner">' +

                '<span style="font-size:1.6rem;">' + tr.icon + '</span>' +

                '<div>' +

                '<div style="font-weight:700; color:#fef08a;">Možná trofej: ' + this.escapeHtml(tr.name) + '</div>' +

                '<div style="font-size:0.75rem; color:#86efac;">Bonus: ' + trBonuses.join(" ") + ' (pro 5. slot zbrojnice)</div>' +

                '</div>' +

                '</div>';

        }

        var html = [];

        html.push('<div class="quest-duel-grid">');

        // LEVÝ SLOUPEC: Obrázek bestie a odměny

        html.push('  <div class="quest-duel-col-left">');

        html.push('    <div class="quest-monster-showcase">');

        html.push('      <div class="quest-monster-img-wrap">');

        html.push('        <img id="quest-monster-img-el" src="' + qImg + '" alt="' + this.escapeHtml(q.name) + '" class="quest-monster-img ' + (this.duelMonsterFlipped ? 'flipped' : '') + '" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.png\';">');

        html.push('        <button class="quest-flip-btn" onclick="PRS_App.toggleDuelMonsterFlip()" title="Zrcadlově otočit pohled">🔄 Otočit</button>');

        html.push('      </div>');

        html.push('      <div style="font-family:\'Cinzel\',serif; font-size:1.15rem; font-weight:700; color:#fef08a; margin-bottom:2px;">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>');

        html.push('      <div style="font-size:0.78rem; color:#fca5a5; margin-bottom:8px;">' + this.escapeHtml(q.desc || "") + '</div>');

        html.push('      <div class="quest-bounty-badge-row">');

        html.push('        <span class="quest-bounty-pill quest-bounty-gold">💰 +' + q.gold.toLocaleString("cs-CZ") + ' zl.</span>');

        if (q.hearts > 0) html.push('        <span class="quest-bounty-pill quest-bounty-heart">💖 +' + q.hearts + ' Srdce</span>');

        html.push('      </div>');

        html.push('    </div>');

        if (trophyHtml) html.push(trophyHtml);

        html.push('  </div>');

        // PRAVÝ SLOUPEC: Soubojový stav, šance a taktická příprava

        html.push('  <div class="quest-duel-col-right">');

        html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">');

        html.push('      <span class="duel-tier-badge" style="background:rgba(239,68,68,0.22); border-color:' + tierColor + '; color:' + tierColor + ';">⚔️ ' + q.questTier + ' • ' + tierTitle + '</span>');

        html.push('      <span style="font-size:0.8rem; color:#cbd5e1;">💡 Slabina: <strong style="color:#fde047;">' + weaknessText + '</strong></span>');

        html.push('    </div>');

        if (wRes.exploited) {

            html.push('    <div class="duel-weakness-badge exploited">');

            html.push('      <span style="font-size:1.25rem;">🎯</span>');

            html.push('      <div><strong>SLABINA VYUŽITA (+2 k síle):</strong> ' + this.escapeHtml(wRes.reason) + '!</div>');

            html.push('    </div>');

        } else if (q.weakness) {

            html.push('    <div class="duel-weakness-badge locked">');

            html.push('      <span style="font-size:1.15rem;">💡</span>');

            html.push('      <div><strong>Slabina bestie:</strong> ' + weaknessText + ' <span style="opacity:0.75; font-size:0.78rem;">(Zatím nesplněno – pro bonus +2 potřebuješ odpovídající výbavu, ctnost či zvíře)</span></div>');

            html.push('    </div>');

        }

        html.push('    <div class="duel-arena-grid">');

        html.push('      <div class="duel-combatant" style="border-color:' + player.color + ';">');

        html.push('        <div class="duel-fighter-role" style="color:' + player.color + '; display:flex; align-items:center; justify-content:center; gap:0.4rem;">' + (this.getPlayerPawnAvatarHtml ? this.getPlayerPawnAvatarHtml(player, 34) : player.badge) + ' <span>' + this.escapeHtml(player.name) + '</span></div>');

        html.push('        <div class="duel-fighter-stat">⚔️ ' + basePower + ' <small>stálá síla</small></div>');

        html.push('        <div class="duel-fighter-sub">Boj ' + stats.combat + (horseBonus > 0 ? ' + Kůň ' + horseBonus : '') + (animalBonus > 0 ? ' + Zvěř ' + animalBonus : '') + (tacticBonus > 0 ? ' + Taktika ' + tacticBonus : '') + (weaknessBonus > 0 ? ' + Slabina ' + weaknessBonus : '') + (stanceBonus !== 0 ? (stanceBonus > 0 ? ' + Postoj +' + stanceBonus : ' + Postoj ' + stanceBonus) : '') + '</div>');

        html.push('      </div>');

        html.push('      <div class="duel-vs-badge">VS</div>');

        html.push('      <div class="duel-combatant">');

        html.push('        <div class="duel-fighter-role" style="color:#f87171;">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>');

        html.push('        <div class="duel-fighter-stat" style="color:#ef4444;">🛡️ ' + q.difficulty + ' <small>obtížnost</small></div>');

        html.push('        <div class="duel-fighter-sub">Potřebný hod: 🎲 <strong>' + (neededRoll <= 1 ? '1+' : (neededRoll <= 6 ? neededRoll + '+' : 'nelze bez hodu')) + '</strong></div>');

        html.push('      </div>');

        html.push('    </div>');

        html.push('    <div class="duel-odds-container">');

        html.push('      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">');

        html.push('        <span>Šance na hrdinské vítězství:</span>');

        html.push('        <strong style="color:' + (winRate >= 50 ? '#86efac' : '#fca5a5') + ';">' + winRate + ' %</strong>');

        html.push('      </div>');

        html.push('      <div class="duel-odds-bar-track">');

        html.push('        <div class="duel-odds-bar-fill" style="width:' + winRate + '%; background:' + (winRate >= 65 ? 'linear-gradient(90deg, #10b981, #22c55e)' : (winRate >= 35 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #dc2626, #ef4444)')) + ';"></div>');

        html.push('      </div>');

        html.push('    </div>');

        // Volba bojového postoje

        var curStance = this.selectedDuelStance || "tactical";

        html.push('    <div class="duel-stances-container">');

        html.push('      <div class="quest-tactics-title"><span>⚔️ Bojový postoj rytíře:</span></div>');

        html.push('      <div class="duel-stances-row">');

        html.push('        <button type="button" class="duel-stance-btn aggressive ' + (curStance === "aggressive" ? "active" : "") + '" onclick="PRS_App.selectDuelStance(\'aggressive\')">');

        html.push('          <span class="stance-title">⚔️ Dravý útok</span>');

        html.push('          <span class="stance-badge">+2 Síla</span>');

        html.push('          <span class="stance-desc">Při prohře -2 💖</span>');

        html.push('        </button>');

        html.push('        <button type="button" class="duel-stance-btn tactical ' + (curStance === "tactical" ? "active" : "") + '" onclick="PRS_App.selectDuelStance(\'tactical\')">');

        html.push('          <span class="stance-title">🎯 Taktický</span>');

        html.push('          <span class="stance-badge">Běžná síla</span>');

        html.push('          <span class="stance-desc">Šance na Reroll</span>');

        html.push('        </button>');

        html.push('        <button type="button" class="duel-stance-btn defensive ' + (curStance === "defensive" ? "active" : "") + '" onclick="PRS_App.selectDuelStance(\'defensive\')">');

        html.push('          <span class="stance-title">🛡️ Opatrná obrana</span>');

        html.push('          <span class="stance-badge">-1 Síla</span>');

        html.push('          <span class="stance-desc">Ústup bez ztráty 💖</span>');

        html.push('        </button>');

        html.push('      </div>');

        html.push('    </div>');

        html.push('    <div class="quest-tactics-section">');

        html.push('      <div class="quest-tactics-title"><span>🛡️ Taktická volba před bojem:</span></div>');

        var actNorm = this.selectedDuelTactic === "normal" ? "active" : "";

        html.push('      <div class="quest-tactic-option ' + actNorm + '" onclick="PRS_App.selectDuelTactic(\'normal\')">');

        html.push('        <div class="quest-tactic-radio"></div>');

        html.push('        <div class="quest-tactic-body">');

        html.push('          <div class="quest-tactic-name">⚔️ Vyvážený rytířský výpad</div>');

        html.push('          <div class="quest-tactic-desc">Standardní boj s využitím zbraní a ctností (+0 k síle).</div>');

        html.push('        </div>');

        html.push('      </div>');

        if (hasHorse) {

            var actCharge = this.selectedDuelTactic === "charge" ? "active" : "";

            html.push('      <div class="quest-tactic-option ' + actCharge + '" onclick="PRS_App.selectDuelTactic(\'charge\')">');

            html.push('        <div class="quest-tactic-radio"></div>');

            html.push('        <div class="quest-tactic-body">');

            html.push('          <div class="quest-tactic-name">🏇 Útok z plné jízdy na koni (+1 k síle)</div>');

            html.push('          <div class="quest-tactic-desc">Drtivý nájezd dodává rytíři dodatečnou údernou sílu.</div>');

            html.push('        </div>');

            html.push('      </div>');

        }

        if (hasHounds) {

            var actHounds = this.selectedDuelTactic === "hounds" ? "active" : "";

            html.push('      <div class="quest-tactic-option ' + actHounds + '" onclick="PRS_App.selectDuelTactic(\'hounds\')">');

            html.push('        <div class="quest-tactic-radio"></div>');

            html.push('        <div class="quest-tactic-body">');

            html.push('          <div class="quest-tactic-name">🐕 Vypuštění lovecké smečky (+1 k síle)</div>');

            html.push('          <div class="quest-tactic-desc">Smečka psů a sokolů zmate bestii a odláká její pozornost.</div>');

            html.push('        </div>');

            html.push('      </div>');

        }

        if (canAffordElixir || q.questTier !== "U1") {

            var actElix = this.selectedDuelTactic === "elixir" ? "active" : "";

            html.push('      <div class="quest-tactic-option ' + actElix + '" onclick="PRS_App.selectDuelTactic(\'elixir\')">');

            html.push('        <div class="quest-tactic-radio"></div>');

            html.push('        <div class="quest-tactic-body">');

            html.push('          <div class="quest-tactic-name">🧪 Hojivý lektvar z Lazaretu (500 zl.)</div>');

            html.push('          <div class="quest-tactic-desc">Pojistka: Při porážce neutrpíš těžké zranění a nemusíš do Špitálu!</div>');

            html.push('        </div>');

            html.push('      </div>');

        }

        html.push('    </div>');

        html.push('    <button id="btn-quest-duel-action" class="quest-btn-roll-action" onclick="PRS_App.executeDuelRoll()">');

        html.push('      🎲 Vrhni kostku do souboje!');

        html.push('    </button>');

        html.push('  </div>');

        html.push('</div>');

        body.innerHTML = html.join("");

    },

    executeDuelRoll: function () {

        if (this.isDuelRolling) return;

        this.isDuelRolling = true;

        var btn = document.getElementById("btn-quest-duel-action");

        if (btn) {

            btn.disabled = true;

            btn.innerHTML = "🎲 Kostka se točí v aréně...";

        }

        if (window.PRS_Audio) window.PRS_Audio.playSword();

        var tactics = {

            charge: this.selectedDuelTactic === "charge",

            hounds: this.selectedDuelTactic === "hounds",

            elixir: this.selectedDuelTactic === "elixir",

            stance: this.selectedDuelStance || "tactical"

        };

        var self = this;

        setTimeout(function () {

            var res = window.PRS_GameEngine.resolveQuest(self.state, null, tactics);

            self.isDuelRolling = false;

            if (res && res.won) {

                if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            } else {

                if (window.PRS_Audio) window.PRS_Audio.playOminous();

            }

            self.renderDuelCeremony(res);

            self.renderGameScreen();

            self.saveSessionAuto();

        }, 900);

    },

    renderDuelCeremony: function (res) {
        var body = document.getElementById("quest-duel-modal-body");
        if (!body || !res) return;

        var q = res.quest || {};
        var won = res.won;
        var player = this.state.players[this.state.currentPlayerIndex];
        var html = [];

        html.push('<div class="quest-ceremony-wrap">');

        if (won) {
            html.push('  <div class="quest-ceremony-banner win">⚔️ HRDINSKÉ VÍTĚZSTVÍ!</div>');
            html.push('  <p style="font-size:0.95rem; color:#fef08a; margin:0 0 0.35rem 0;">');
            html.push('    ' + player.badge + ' <strong>' + this.escapeHtml(player.name) + '</strong> přemohl v souboji <strong>' + q.icon + ' ' + this.escapeHtml(q.name) + '</strong>!');
            html.push('  </p>');

            html.push('  <div style="font-size:0.83rem; color:#cbd5e1; margin-bottom:0.45rem;">');
            html.push('    Hod kostkou: 🎲 <strong>' + res.roll + '</strong> &nbsp;|&nbsp; Celková síla: ⚔️ <strong>' + res.totalPower + '</strong> (vs. obtížnost ' + res.difficulty + ')');
            if (res.stanceName) html.push('    <span style="color:#fef08a; margin-left:8px;">Postoj: <strong>' + this.escapeHtml(res.stanceName) + '</strong></span>');
            if (res.tacticName) html.push('    <span style="color:#86efac; margin-left:8px;">Taktika: <strong>' + this.escapeHtml(res.tacticName) + '</strong></span>');
            if (res.weaknessExploited) html.push('    <div style="font-size:0.8rem; color:#fef08a; font-weight:700; margin-top:2px;">🎯 Využita slabina bestie (+2 síla): ' + this.escapeHtml(res.weaknessReason) + '</div>');
            html.push('  </div>');

            html.push('  <div class="quest-bounty-badge-row" style="margin-bottom:0.45rem;">');
            html.push('    <span class="quest-bounty-pill quest-bounty-gold" style="font-size:0.92rem; padding:4px 14px;">💰 +' + res.goldWon.toLocaleString("cs-CZ") + ' zl.</span>');
            if (res.heartsWon > 0) {
                html.push('    <span class="quest-bounty-pill quest-bounty-heart" style="font-size:0.92rem; padding:4px 14px;">💖 +' + res.heartsWon + ' Srdce princezny</span>');
            }
            html.push('  </div>');

            if (res.trophyWon) {
                var tr = res.trophyWon;
                var statParts = [];
                if (tr.combat) statParts.push("⚔️ +" + tr.combat + " Boj");
                if (tr.riding) statParts.push("🏇 +" + tr.riding + " Jízda");
                if (tr.dance) statParts.push("💃 +" + tr.dance + " Tanec");
                if (tr.charisma) statParts.push("✨ +" + tr.charisma + " Charisma");

                html.push('  <div class="quest-trophy-ceremony-card">');
                html.push('    <div class="quest-trophy-ceremony-icon">' + tr.icon + '</div>');
                html.push('    <div class="quest-trophy-content-wrap">');
                html.push('      <div class="quest-trophy-ceremony-name">🏆 Získána relikvie: ' + this.escapeHtml(tr.name) + '</div>');
                html.push('      <div class="quest-trophy-ceremony-stats">' + statParts.join(" &nbsp;•&nbsp; ") + '</div>');
                html.push('      <div class="quest-trophy-ceremony-desc">' + this.escapeHtml(tr.desc || "Vzácná trofej potvrzující slavný triumf rytíře.") + '</div>');
                html.push('      <div id="quest-trophy-equip-box">');
                if (tr.isEquipped) {
                    html.push('        <span style="color:#86efac; font-weight:700; font-size:0.8rem;">✅ Trofej automaticky nasazena v 5. slotu zbrojnice!</span>');
                } else {
                    html.push('        <button class="quest-btn-equip-trophy" onclick="PRS_App.equipDuelTrophyNow(\'' + tr.id + '\')">👑 Nasadit trofej do 5. slotu</button>');
                }
                html.push('      </div>');
                html.push('    </div>');
                html.push('  </div>');
            }

            if (res.lootWon) {
                var loot = res.lootWon;
                html.push('  <div style="background:rgba(212,175,55,0.15); border:1px solid #d4af37; border-radius:8px; padding:0.35rem 0.65rem; max-width:440px; margin:0 auto 0.45rem auto; font-size:0.82rem; color:#fef08a;">');
                html.push('    🎁 Nalezena výbava: <strong>' + loot.icon + ' ' + this.escapeHtml(loot.name) + '</strong> (uložena do zbrojnice)');
                html.push('  </div>');
            }

            html.push('  <button class="quest-btn-continue" onclick="PRS_App.closeQuestDuelModal()">🏆 Sláva vítězům (Pokračovat ve hře)</button>');

        } else {
            html.push('  <div class="quest-ceremony-banner loss">💀 PORÁŽKA V SOUBOJI</div>');
            html.push('  <p style="font-size:0.95rem; color:#fca5a5; margin:0 0 0.35rem 0;">');
            html.push('    <strong>' + q.icon + ' ' + this.escapeHtml(q.name) + '</strong> byl nad síly rytíře (Hod: 🎲 ' + res.roll + ', Síla ' + res.totalPower + ' vs. ' + res.difficulty + ').');
            if (res.weaknessExploited) html.push('    <div style="font-size:0.78rem; color:#fde047; margin-top:2px;">🎯 Využil jsi slabinu bestie (+2 síla: ' + this.escapeHtml(res.weaknessReason) + '), ale hod kostkou bohužel nestačil.</div>');
            html.push('  </p>');

            if (res.canTacticalReroll) {
                html.push('  <div style="background:rgba(245,158,11,0.22); border:1.5px dashed #f59e0b; border-radius:10px; padding:0.55rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto;">');
                html.push('    <div style="font-weight:bold; color:#fef08a; font-size:0.88rem; margin-bottom:0.2rem;">🎯 Šance na taktický opravný hod!</div>');
                html.push('    <div style="font-size:0.78rem; color:#fde68a; margin-bottom:0.45rem;">Prohrál jsi o pouhé ' + (res.difficulty - res.totalPower) + ' body! Zkušenosti a zvířata ti dávají druhou šanci.</div>');
                html.push('    <button class="quest-btn-roll-action" style="background:linear-gradient(135deg, #f59e0b, #d97706); font-size:0.88rem; padding:0.4rem 1rem; margin:0;" onclick="PRS_App.executeTacticalReroll()">🎲 Taktický opravný hod (Reroll 1 kostky)</button>');
                html.push('  </div>');
            }

            if (res.preventedHospital) {
                html.push('  <div style="background:rgba(16,185,129,0.18); border:1.5px solid #10b981; border-radius:8px; padding:0.5rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto; color:#86efac; font-size:0.84rem;">');
                html.push('    🧪 <strong>Záchrana lektvarem!</strong> Díky elixíru z Lazaretu neutrpěl rytíř fatální zranění a nemusí do Špitálu.');
                html.push('  </div>');
            } else if (q.questTier === "U1") {
                html.push('  <div style="background:rgba(239,68,68,0.18); border:1.5px solid #ef4444; border-radius:8px; padding:0.5rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto; color:#fca5a5; font-size:0.84rem;">');
                html.push('    🐗 Zvíře uniklo do hlubokého lesa. Ošetření lehkých ran stálo rytíře zlaťáky.');
                html.push('  </div>');
            } else {
                html.push('  <div style="background:rgba(239,68,68,0.22); border:1.5px solid #ef4444; border-radius:8px; padding:0.5rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto; color:#fca5a5; font-size:0.84rem;">');
                html.push('    🏥 Raněný rytíř byl převezen do Královského lazaretu (Špitál), kde se 1 tah léčí ze svých zranění.');
                html.push('  </div>');
            }

            html.push('  <button class="quest-btn-continue" onclick="PRS_App.closeQuestDuelModal()">⚔️ Ustoupit z bojiště (Pokračovat)</button>');
        }

        html.push('</div>');
        body.innerHTML = html.join("");
    },

    equipDuelTrophyNow: function (trophyId) {

        var res = window.PRS_GameEngine.toggleEquipItem(this.state, trophyId);

        if (res && res.ok !== false) {

            var box = document.getElementById("quest-trophy-equip-box");

            if (box) {

                box.innerHTML = '<span style="color:#86efac; font-weight:700; font-size:0.88rem;">✅ Trofej byla úspěšně nasazena do 5. slotu zbrojnice!</span>';

            }

            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            this.showPawnToast(this.state.currentPlayerIndex, "Trofej nasazena!", "👑", "#86efac");

            this.renderGameScreen();

            this.saveSessionAuto();

        }

    },

    executeTacticalReroll: function () {

        if (this.isDuelRolling) return;

        this.isDuelRolling = true;

        var btn = event && event.target;

        if (btn) {

            btn.disabled = true;

            btn.innerHTML = "🎲 Opravný hod se točí...";

        }

        var self = this;

        var tactics = {

            charge: this.selectedDuelTactic === "charge",

            hounds: this.selectedDuelTactic === "hounds",

            elixir: this.selectedDuelTactic === "elixir",

            stance: this.selectedDuelStance || "tactical",

            isReroll: true

        };

        if (window.PRS_Audio) window.PRS_Audio.playSword();

        setTimeout(function () {

            var res = window.PRS_GameEngine.resolveQuest(self.state, null, tactics);

            self.isDuelRolling = false;

            if (res && res.won) {

                if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            } else {

                if (window.PRS_Audio) window.PRS_Audio.playOminous();

            }

            self.renderDuelCeremony(res);

            self.renderGameScreen();

            self.saveSessionAuto();

        }, 800);

    },

    handleChooseChanceDilemma: function (optionIndex) {

        if (!this.state || !this.state.pendingAction || !this.state.pendingAction.canChooseDilemma) return;

        var player = this.state.players[this.state.currentPlayerIndex];

        var res = window.PRS_GameEngine.chooseChanceDilemma(this.state, player, optionIndex);

        if (window.PRS_Audio) window.PRS_Audio.playItem();

        this.closeChanceModal();

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    // Uložení nalezeného pergamenu do brašny rytíře (max 3)
    handleStoreScroll: function () {
        if (!this.state || !this.state.pendingAction) return;
        var player = this.state.players[this.state.currentPlayerIndex];
        var card = (this.state.pendingAction.scrollCard || this.state.pendingAction.chanceCard);
        var res = window.PRS_GameEngine.storeScrollInInventory(this.state, player, card);
        if (window.PRS_Audio) window.PRS_Audio.playItem();
        this.closeChanceModal();
        if (res && res.scroll) {
            if (this.showToast) {
                this.showToast("🎒 Svitek " + res.scroll.title + " byl bezpečně uložen do tvé brašny!", "success");
            }
        } else if (res && res.message && this.showToast) {
            this.showToast(res.message, "warning");
        }
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    // Okamžité použití pergamenu po otočení
    handleUseScrollNow: function () {
        if (!this.state || !this.state.pendingAction) return;
        var player = this.state.players[this.state.currentPlayerIndex];
        var card = (this.state.pendingAction.scrollCard || this.state.pendingAction.chanceCard);
        var res = window.PRS_GameEngine.useScrollEffect(this.state, player, card);
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        this.closeChanceModal();
        if (this.showToast && res && res.message) {
            this.showToast(res.message, "success");
        }
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    // Zahrání pergamenu z brašny (z ruky hráče)
    handleUseInventoryScroll: function (scrollIndex) {
        if (!this.state) return;
        var curIdx = this.state.currentPlayerIndex;
        var player = this.state.players[curIdx];
        if (!player || !player.inventory || !player.inventory[scrollIndex]) return;

        var scrollName = player.inventory[scrollIndex].title;
        var res = window.PRS_GameEngine.useInventoryScroll(this.state, curIdx, scrollIndex);
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        if (this.showToast) {
            this.showToast("📜 Pergamen " + scrollName + " aktivován!", "success");
        }
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    // --- FÁZE 3: ZÁLOŽKOVÝ INSPEKTOR HRÁČE & ERGONOMIE ---

    activeSidebarTab: "tile",

    openTutorialModal: function () {

        var modal = document.getElementById("tutorial-onboarding-modal");

        if (!modal) return;

        this.tutorialCurrentStep = 0;

        this.renderTutorialStep();

        modal.style.display = "flex";

        this.updateBodyModalClass();

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

    },

    closeTutorialModal: function () {

        var modal = document.getElementById("tutorial-onboarding-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    nextTutorialStep: function () {

        if (this.tutorialCurrentStep < 3) {

            this.tutorialCurrentStep++;

            this.renderTutorialStep();

            if (window.PRS_Audio) window.PRS_Audio.playStep();

        } else {

            this.closeTutorialModal();

        }

    },

    prevTutorialStep: function () {

        if (this.tutorialCurrentStep > 0) {

            this.tutorialCurrentStep--;

            this.renderTutorialStep();

            if (window.PRS_Audio) window.PRS_Audio.playStep();

        }

    },

    renderTutorialStep: function () {

        var body = document.getElementById("tutorial-modal-body");

        var dots = document.getElementById("tutorial-step-dots");

        var btnPrev = document.getElementById("btn-tut-prev");

        var btnNext = document.getElementById("btn-tut-next");

        if (!body) return;

        var steps = [

            {

                icon: "🎲",

                badge: "Krok 1 ze 4 • Základní princip",

                title: "Pohyb po království a nákup panství",

                desc: "Házíš kostkou (1–6) a posouváš se po herním plánu. Zastavíš-li se na volné vesnici, hradu či pastvině, můžeš ji <strong>zakoupit do svého vlastnictví</strong>. Každý protihráč, který na tvé panství vstoupí, ti zaplatí nájem!",

                tip: "💡 Tip pro nováčky: Na začátku hry investuj své zlaťáky do nákupu políček kolem STARTU pro stabilní daňový příjem."

            },

            {

                icon: "🐑",

                badge: "Krok 2 ze 4 • Zvířata & Láska",

                title: "Chov zvěře a zisk Princezniných srdcí",

                desc: "Zvířata (koně, krávy, ovce, prasata, psi a sokoli) mají zvláštní moc: <strong>páry a chovné sady generují prestižní Srdce princezny 💖</strong>, která jsou hlavním cílem vítězství ve hře!",

                tip: "💡 Tip: Kompletní trojice zvířat navíc vynáší nejvyšší nájem v celém království."

            },

            {

                icon: "🏘️",

                badge: "Krok 3 ze 4 • Feudální růst",

                title: "Povyšování vesnic na města a hrady",

                desc: "Svou vesnici můžeš povýšit na <strong>Město</strong> a později na <strong>nedobytný Hrad</strong>. Povýšením dramaticky vzroste vybíraný nájem a získáš pevnou pozici feudálního vládce.",

                tip: "💡 Tip: Povýšení provedeš v postranním panelu na záložce <strong>[🏰 Majetek]</strong> nebo tlačítkem po šlápnutí na své pole."

            },

            {

                icon: "🐉",

                badge: "Krok 4 ze 4 • Výpravy & Trofeje",

                title: "Soubojová aréna s monstry a draky",

                desc: "Vstup na pole <strong>U1, U2 a U3 (Dračí doupata)</strong> otevře dramatickou Soubojovou arénu! Využij zbraně ze zbrojnice, pomoc loveckých psů a lektvary z Lazaretu. Za vítězství získáš hromadu zlaťáků, srdce a <strong>unikátní trofej</strong> do své rytířské výbavy!",

                tip: "💡 Tip: Máš-li koně, můžeš v aréně zvolit <em>Útok z plné jízdy (+1 k síle)</em>!"

            }

        ];

        var cur = steps[this.tutorialCurrentStep];

        var html = [];

        html.push('<div style="text-align:center; margin-bottom:1rem;">');

        html.push('  <div style="font-size:3.2rem; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6)); margin-bottom:0.35rem;">' + cur.icon + '</div>');

        html.push('  <span style="background:rgba(212,175,55,0.18); border:1px solid var(--gold); color:#fef08a; font-size:0.75rem; font-weight:700; padding:2.5px 9px; border-radius:12px; text-transform:uppercase;">' + cur.badge + '</span>');

        html.push('  <h4 style="font-family:\'Cinzel\',serif; font-size:1.25rem; color:#f8fafc; margin:0.6rem 0 0.4rem 0;">' + cur.title + '</h4>');

        html.push('</div>');

        html.push('<p style="font-size:0.92rem; color:#e2e8f0; line-height:1.55; margin-bottom:1rem;">' + cur.desc + '</p>');

        html.push('<div style="background:rgba(0,0,0,0.35); border-left:3px solid #38bdf8; border-radius:0 8px 8px 0; padding:0.65rem 0.85rem; font-size:0.83rem; color:#bae6fd;">' + cur.tip + '</div>');

        body.innerHTML = html.join("");

        if (btnPrev) btnPrev.style.visibility = (this.tutorialCurrentStep === 0) ? "hidden" : "visible";

        if (btnNext) btnNext.innerHTML = (this.tutorialCurrentStep === 3) ? "Rozumím, jdeme do hry! 🎲" : "Další →";

        if (dots) {

            var dotHtml = [];

            for (var d = 0; d < 4; d++) {

                dotHtml.push('<div class="tutorial-dot ' + (d === this.tutorialCurrentStep ? 'active' : '') + '"></div>');

            }

            dots.innerHTML = dotHtml.join("");

        }

    },

    handleResolveQuest: function () {

        this.openQuestDuelModal();

    },

    handleRetreatFromQuest: function () {

        if (!this.state) return;

        window.PRS_GameEngine.retreatFromQuest(this.state);

        var qModal = document.getElementById("quest-duel-modal");

        if (qModal) qModal.style.display = "none";

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    handleResolveFestival: function () {

        var pa = this.state ? this.state.pendingAction : null;

        if (!pa || !pa.canResolveFestival) return;

        // Pokud tahá automatický bot a jsou zapnuté rychlé animace, vyhodnotíme přímo

        var curPlayer = this.state.players[this.state.currentPlayerIndex];

        if (curPlayer && curPlayer.isAi && this.fastAnimations) {

            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            window.PRS_GameEngine.resolveFestival(this.state);

            this.renderGameScreen();

            this.saveSessionAuto();

            return;

        }

        this.openFestivalModal();

    },

    // ========================================================================

    // MODÁL NASTAVENÍ HRY (#game-settings-modal)

    // ========================================================================,

    openFestivalModal: function () {

        var modal = document.getElementById("festival-modal");

        var body = document.getElementById("festival-modal-body");

        if (!modal || !body || !this.state) return;

        var pa = this.state.pendingAction;

        if (!pa || !pa.canResolveFestival) return;

        var fType = pa.festivalType || "tournament";

        var organizer = this.state.players[this.state.currentPlayerIndex];

        var meta = {

            turnaj: {

                icon: "🎪",

                title: "Velký Královský Turnaj v kolbišti",

                sub: "Rytířský souboj dřevci, lukostřelba a drezura před dvorem královny",

                req: "Kůň, Pes a Sokol (nebo Kůň + Zbroj / Zbraň)",

                formula: "Hod kostkou 🎲 (1–6) + Boj ⚔️ + Jízda 🏇 + Zvířecí set (+3)",

                prizes: "🥇 1. místo: 3 + ½ Charisma 💖 (+1 200 zl.)<br>🥈 2. místo: 2 + ½ Charisma 💖 (+600 zl.)<br>🥉 3. místo: 1 + ½ Charisma 💖 (+300 zl.)"

            },

            ples: {

                icon: "🎭",

                title: "Královský Zámecký Ples & Dvorská slavnost",

                sub: "Slavnostní ples na zámku, společenská promenáda a salónní tanec s princeznou",

                req: "Slavnostní šaty (nebo ctnost Tanec ≥ 1)",

                formula: "Hod kostkou 🎲 (1–6) + Tanec 💃 + Charisma ✨ + Šaty (+2)",

                prizes: "🥇 1. místo: 1 + Charisma 💖 (+1 000 zl.)<br>🥈 2. místo: Charisma 💖 (min 1, +500 zl.)<br>🥉 3. místo: Charisma − 1 💖 (min 0.5, +250 zl.)"

            },

            zavod: {

                icon: "🏇",

                title: "Velký Královský Dostih & Jezdecký závod",

                sub: "Rychlostní a překážkový dostih přes louky a vodní příkopy o vavřínový věnec",

                req: "Alespoň 1 ušlechtilý kůň v chovu",

                formula: "Hod kostkou 🎲 (1–6) + 2× Jízda 🏇 + Stádo koní (max +3)",

                prizes: "🥇 1. místo: 1,5× Charisma 💖 (min 1.5, +1 000 zl.)<br>🥈 2. místo: Charisma 💖 (min 1, +500 zl.)<br>🥉 3. místo: ½ Charisma 💖 (min 0.5, +250 zl.)"

            }

        }[fType] || {

            icon: "🎪",

            title: "Královská slavnost",

            sub: "Klání o čest, slávu a srdce princezny",

            req: "Podle typu slavnosti",

            formula: "Hod kostkou + příslušné ctnosti",

            prizes: "Drahocenná Princeznina srdce 💖 a královské zlaťáky"

        };

        var elIcon = document.getElementById("festival-modal-icon");

        var elTitle = document.getElementById("festival-modal-title");

        var elSub = document.getElementById("festival-modal-sub");

        if (elIcon) elIcon.textContent = meta.icon;

        if (elTitle) elTitle.textContent = meta.title;

        if (elSub) elSub.textContent = meta.sub;

        // Roztřídíme hráče na soutěžící a diváky

        var contestants = [];

        var spectators = [];

        for (var i = 0; i < this.state.players.length; i++) {

            var p = this.state.players[i];

            var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);

            var eligible = false;

            var bonusText = "";

            if (fType === "tournament") {

                eligible = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) || (st.horses >= 1 && (st.hasWeapon || st.hasArmor));

                var setB = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) ? 3 : 0;

                var baseB = st.combat + st.riding + setB;

                bonusText = "⚔️ Boj: " + st.combat + " | 🏇 Jízda: " + st.riding + (setB ? " | 🐕🦅 Set: +3" : "") + " (Základ: +" + baseB + ")";

            } else if (fType === "ball") {

                eligible = st.hasDress || st.dance >= 1;

                var dressB = st.hasDress ? 2 : 0;

                var baseB = st.dance + st.charisma + dressB;

                bonusText = "💃 Tanec: " + st.dance + " | ✨ Charisma: " + st.charisma + (dressB ? " | 👗 Šaty: +2" : "") + " (Základ: +" + baseB + ")";

            } else if (fType === "race") {

                eligible = st.horses >= 1;

                var horseB = Math.min(3, st.horses);

                var baseB = (st.riding * 2) + horseB;

                bonusText = "🏇 2× Jízda: " + (st.riding * 2) + " | 🐎 Koně: +" + horseB + " (Základ: +" + baseB + ")";

            }

            if (eligible) {

                contestants.push({ player: p, stats: st, bonusText: bonusText });

            } else {

                var reason = (fType === "tournament") ? "Nemá potřebná zvířata / zbroj" : ((fType === "ball") ? "Nemá slavnostní šaty ani tanec" : "Nemá žádného koně");

                spectators.push({ player: p, reason: reason });

            }

        }

        var h = [];

        // Disciplína a pravidla banner

        h.push('<div class="festival-discipline-banner">');

        h.push('  <div style="font-size:2.4rem;">' + meta.icon + '</div>');

        h.push('  <div style="flex:1;">');

        h.push('    <div style="font-weight:bold; color:#fef08a; font-size:1.05rem;">' + meta.title + '</div>');

        h.push('    <div style="font-size:0.83rem; color:#cbd5e1; margin-top:2px;">📜 <strong>Podmínka:</strong> ' + meta.req + '</div>');

        h.push('    <div style="font-size:0.81rem; color:var(--gold-light); margin-top:3px;">🎲 <strong>Vzorec výkonu:</strong> ' + meta.formula + '</div>');

        h.push('    <div style="font-size:0.79rem; color:#fbcfe8; margin-top:4px;">🎁 <strong>Odměny:</strong> ' + meta.prizes + '</div>');

        h.push('  </div>');

        h.push('</div>');

        // Pokud nesplňuje podmínku dostatek hráčů (< 2)

        if (contestants.length < 2) {

            h.push('<div style="background:rgba(239, 68, 68, 0.15); border:1px solid rgba(239, 68, 68, 0.4); border-radius:10px; padding:1.1rem; text-align:center; margin-bottom:1.1rem;">');

            h.push('  <div style="font-size:1.8rem; margin-bottom:0.4rem;">🎺</div>');

            h.push('  <h4 style="color:#fca5a5; font-family:\'Cinzel\',serif; margin:0 0 0.4rem;">Slavnost se nekoná v plné parádě</h4>');

            h.push('  <p style="color:#cbd5e1; font-size:0.88rem; line-height:1.45; margin:0 0 0.85rem;">Podmínku účasti splňuje méně než 2 rytíři (' + contestants.length + ' rytíř splnil kvalifikaci). Král však oceňuje iniciativu pořadatele <strong>' + this.escapeHtml(organizer.name) + '</strong> a uděluje mu královský dar:</p>');

            h.push('  <div style="display:inline-flex; gap:0.75rem; align-items:center; background:rgba(0,0,0,0.5); border:1px solid var(--gold); border-radius:8px; padding:0.5rem 1rem; font-weight:bold; color:#fef08a; margin-bottom:1rem;">');

            h.push('    <span>💰 +800 zl.</span> <span>•</span> <span>💖 +0,5 Princeznina srdce</span>');

            h.push('  </div>');

            h.push('  <div><button class="btn-primary" style="padding:0.6rem 1.6rem; font-size:0.95rem;" onclick="PRS_App.executeFestivalContest(true)">🏆 Převzít královský dar a pokračovat</button></div>');

            h.push('</div>');

        } else {

            // Kvalifikovaní soutěžící

            h.push('<div style="font-weight:bold; color:var(--gold-light); margin-bottom:0.5rem; font-size:0.9rem; text-transform:uppercase; letter-spacing:0.5px;">');

            h.push('  ⚔️ Kvalifikovaní soutěžící rytíři (' + contestants.length + '):');

            h.push('</div>');

            for (var c = 0; c < contestants.length; c++) {

                var cont = contestants[c];

                var pl = cont.player;

                var isHost = (pl.index === organizer.index);

                h.push('<div class="festival-contestant-card">');

                h.push('  <div class="festival-contestant-left">');

                h.push('    <div class="festival-contestant-pawn" style="background:' + pl.color + ';">' + (pl.index + 1) + '</div>');

                h.push('    <div class="festival-contestant-info">');

                h.push('      <div class="festival-contestant-name">' + this.escapeHtml(pl.name) + (isHost ? ' <span style="font-size:0.75rem; color:#fef08a; background:rgba(212,175,55,0.25); border:1px solid var(--gold); border-radius:4px; padding:1px 5px;">Pořadatel</span>' : '') + '</div>');

                h.push('      <div class="festival-contestant-bonuses">' + cont.bonusText + '</div>');

                h.push('    </div>');

                h.push('  </div>');

                h.push('  <div class="festival-contestant-score-box">');

                h.push('    <span style="font-size:0.8rem; color:#94a3b8;">Připraven</span>');

                h.push('    <span class="festival-score-badge">🎲 ?</span>');

                h.push('  </div>');

                h.push('</div>');

            }

            // Diváci bez kvalifikace

            if (spectators.length > 0) {

                h.push('<div style="font-size:0.82rem; color:#94a3b8; margin:0.85rem 0 0.4rem; font-weight:600;">👀 Diváci na tribuně (nesplňují podmínky účasti):</div>');

                for (var s = 0; s < spectators.length; s++) {

                    var sp = spectators[s];

                    h.push('<div class="festival-contestant-card festival-contestant-spectator">');

                    h.push('  <div class="festival-contestant-left">');

                    h.push('    <div class="festival-contestant-pawn" style="background:' + sp.player.color + '; opacity:0.7;">' + (sp.player.index + 1) + '</div>');

                    h.push('    <div class="festival-contestant-info">');

                    h.push('      <div style="font-weight:600; color:#cbd5e1; font-size:0.88rem;">' + this.escapeHtml(sp.player.name) + '</div>');

                    h.push('      <div style="font-size:0.77rem; color:#ef4444;">❌ ' + sp.reason + '</div>');

                    h.push('    </div>');

                    h.push('  </div>');

                    h.push('</div>');

                }

            }

            // Spouštěcí akční tlačítko

            h.push('<div style="margin-top:1.25rem; text-align:center;">');

            h.push('  <button class="btn-primary" style="padding:0.75rem 2rem; font-size:1.05rem; font-weight:bold; letter-spacing:0.5px; box-shadow:0 0 20px rgba(212,175,55,0.4);" onclick="PRS_App.executeFestivalContest(false)">');

            h.push('    🎲 Zahájit královské klání a hodit kostkami!');

            h.push('  </button>');

            h.push('</div>');

        }

        body.innerHTML = h.join("\n");

        modal.style.display = "flex";

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

    },

    executeFestivalContest: function (isCompensationOnly) {

        if (!this.state) return;

        var modal = document.getElementById("festival-modal");

        var body = document.getElementById("festival-modal-body");

        if (isCompensationOnly) {

            window.PRS_GameEngine.resolveFestival(this.state);

            if (window.PRS_Audio) window.PRS_Audio.playCoin();

            this.closeFestivalModal();

            return;

        }

        // Hrajeme zvuk kostek

        if (window.PRS_Audio) window.PRS_Audio.playDice();

        // Vyhodnotíme v enginu

        var res = window.PRS_GameEngine.resolveFestival(this.state);

        if (window.PRS_Audio) window.PRS_Audio.playFanfare();

        if (!res || !body) {

            this.closeFestivalModal();

            return;

        }

        // Zobrazíme ceremoniál vítězů

        var h = [];

        h.push('<div style="text-align:center; margin-bottom:1.25rem;">');

        h.push('  <div style="font-size:2.8rem; filter:drop-shadow(0 0 12px rgba(251,191,36,0.8));">👑</div>');

        h.push('  <h3 style="font-family:\'Cinzel\',serif; color:#fef08a; font-size:1.35rem; margin:0 0 0.3rem;">Slavnostní vyhlášení vítězů</h3>');

        h.push('  <div style="font-size:0.86rem; color:#cbd5e1;">Dvorní dámy a panovník dekorují nejlepší rytíře království!</div>');

        h.push('</div>');

        var parts = res.participants || [];

        var medals = ["🥇 1. Místo", "🥈 2. Místo", "🥉 3. Místo"];

        for (var p = 0; p < parts.length; p++) {

            var part = parts[p];

            var pl = part.player;

            var isWinner = (p === 0);

            var medalLabel = medals[p] || ((p + 1) + ". Místo");

            h.push('<div class="festival-contestant-card' + (isWinner ? ' festival-contestant-winner' : '') + '">');

            h.push('  <div class="festival-contestant-left">');

            h.push('    <div class="festival-contestant-pawn" style="background:' + pl.color + ';">' + (pl.index + 1) + '</div>');

            h.push('    <div class="festival-contestant-info">');

            h.push('      <div class="festival-contestant-name">' + medalLabel + ': ' + this.escapeHtml(pl.name) + '</div>');

            h.push('      <div class="festival-contestant-bonuses">🎲 Hod: ' + part.roll + ' | Výsledný výkon: <strong>' + part.score + '</strong></div>');

            h.push('    </div>');

            h.push('  </div>');

            h.push('  <div class="festival-contestant-score-box">');

            if (res.resultsText && res.resultsText[p]) {

                var rewPart = res.resultsText[p].indexOf("->") !== -1 ? res.resultsText[p].split("->")[1].trim() : res.resultsText[p];

                h.push('    <span class="festival-reward-pill">' + rewPart + '</span>');

            }

            h.push('    <span class="festival-score-badge">' + part.score + ' b.</span>');

            h.push('  </div>');

            h.push('</div>');

        }

        h.push('<div style="margin-top:1.4rem; text-align:center;">');

        h.push('  <button class="btn-primary" style="padding:0.75rem 2.2rem; font-size:1.05rem; font-weight:bold;" onclick="PRS_App.closeFestivalModal()">');

        h.push('    👑 Sláva vítězům! Pokračovat ve hře');

        h.push('  </button>');

        h.push('</div>');

        body.innerHTML = h.join("\n");

    },

    closeFestivalModal: function () {

        var modal = document.getElementById("festival-modal");

        if (modal) modal.style.display = "none";

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    // --- INTERAKTIVNÍ KARTA NÁHODY (3D OTOČENÍ) ---,

    openChanceModal: function () {
        if (!this.state || !this.state.pendingAction || !this.state.pendingAction.chanceCard) return;
        var modal = document.getElementById("chance-card-modal");
        if (!modal) return;
        this.renderChanceModalContent();
        modal.style.display = "flex";
        this.updateBodyModalClass();
        if (window.PRS_Audio) window.PRS_Audio.playItem();
    },

    closeChanceModal: function () {
        var modal = document.getElementById("chance-card-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    renderChanceModalContent: function () {
        var body = document.getElementById("chance-modal-body");
        if (!body || !this.state || !this.state.pendingAction || !this.state.pendingAction.chanceCard) return;
        var pa = this.state.pendingAction;
        var c = pa.chanceCard;
        var player = this.state.players[this.state.currentPlayerIndex];
        var isFlipped = (this.flippedChanceCardId === c.id);
        var effColor = (c.effect === "gold_loss" || c.effect === "robbers") ? "#fca5a5" : ((c.effect === "hearts" || c.effect === "ball") ? "#f472b6" : "#fde047");
        var isScroll = !!(c.isScroll || c.category === "scroll" || c.scrollType || pa.canStoreScroll || pa.scrollCard);
        var isDilemma = !!(pa.canChooseDilemma && c.options && c.options.length >= 2);
        var invCount = (player && player.inventory && player.inventory.length) || 0;
        var canStore = invCount < 3;

        // Pokud karta ještě nebyla otočena: Zobrazíme královskou voskovou pečeť
        if (!isFlipped) {
            body.innerHTML = '<div style="text-align:center; padding:1.5rem 0.75rem; cursor:pointer;" onclick="PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">' +
                '  <div class="chance-seal" style="margin:0 auto 1.1rem; width:68px; height:68px; font-size:2rem; display:flex; align-items:center; justify-content:center; border-radius:50%; background:radial-gradient(circle, #dc2626 0%, #991b1b 75%, #450a0a 100%); border:2.5px solid #fbbf24; box-shadow:0 0 25px rgba(220,38,38,0.65);">👑</div>' +
                '  <div style="font-family:\'Cinzel\',serif; font-size:1.3rem; font-weight:bold; color:var(--gold-light); margin-bottom:0.4rem; letter-spacing:0.5px;">KRÁLOVSKÝ PERGAMEN OSUDU</div>' +
                '  <p style="font-size:0.92rem; color:#fde68a; margin-bottom:1.4rem; line-height:1.5;">Stoupnul jsi na pole Náhody! Prolom královskou voskovou pečeť a odhal vůli osudu.</p>' +
                '  <button type="button" class="btn-primary" style="font-size:1rem; padding:0.75rem 2rem; cursor:pointer; font-weight:bold; border-radius:8px; background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; color:#fff; box-shadow:0 4px 18px rgba(217,119,6,0.5);" onclick="event.stopPropagation(); PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">📜 PROLOMIT PEČEŤ &amp; ODHALIT KARTU</button>' +
                '</div>';
            return;
        }

        // Karta je otočena: Zobrazíme čistý, dokonale dimenzovaný obsah bez ořezu a bez dvojitých rámů
        var html = '<div class="chance-modal-content" style="display:flex; flex-direction:column; gap:0.75rem;">' +
            '  <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:0.35rem; border-bottom:1px solid rgba(212,175,55,0.25);">' +
            '    <span class="standing-tile-badge" style="background:rgba(234,179,8,0.2); color:#fef08a; border-color:#eab308; font-weight:700; font-size:0.78rem; padding:2px 8px; border-radius:4px;">❓ KARTA NÁHODY</span>' +
            '    <span style="font-size:0.8rem; color:#fde047; font-weight:700;">' + c.id + '</span>' +
            '  </div>' +
            '  <div style="font-family:\'Cinzel\',serif; font-size:1.3rem; font-weight:bold; color:#fef08a; text-shadow:0 0 10px rgba(250,204,21,0.3); line-height:1.3;">' +
            this.escapeHtml(c.title) +
            '  </div>' +
            '  <div style="font-size:0.94rem; color:#f8fafc; line-height:1.5; background:rgba(0,0,0,0.35); border-left:3px solid #facc15; padding:0.65rem 0.85rem; border-radius:6px;">' +
            this.escapeHtml(c.text) +
            '  </div>';

        // 1. Dilema (volba ze dvou možností)
        if (isDilemma) {
            html += '<div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.35rem;">' +
                '  <div style="font-size:0.78rem; color:#fde047; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Zvol své rozhodnutí:</div>' +
                '  <button type="button" class="chance-dilemma-btn opt-a" style="text-align:left; padding:0.8rem 1rem; background:linear-gradient(135deg, rgba(2,132,199,0.35), rgba(3,105,161,0.55)); border:1.5px solid #38bdf8; border-radius:8px; color:#fff; cursor:pointer; transition:all 0.15s ease;" onclick="PRS_App.handleChooseChanceDilemma(0)">' +
                '    <div class="opt-title" style="font-weight:800; font-size:0.96rem; color:#7dd3fc; margin-bottom:3px; display:flex; align-items:center; gap:0.35rem;">' +
                '      <span>' + c.options[0].icon + '</span> <span>' + this.escapeHtml(c.options[0].title) + '</span>' +
                '    </div>' +
                '    <div class="opt-desc" style="font-size:0.83rem; color:#e0f2fe; line-height:1.35;">' + this.escapeHtml(c.options[0].desc) + '</div>' +
                '  </button>' +
                '  <button type="button" class="chance-dilemma-btn opt-b" style="text-align:left; padding:0.8rem 1rem; background:linear-gradient(135deg, rgba(124,58,237,0.35), rgba(109,40,217,0.55)); border:1.5px solid #c084fc; border-radius:8px; color:#fff; cursor:pointer; transition:all 0.15s ease;" onclick="PRS_App.handleChooseChanceDilemma(1)">' +
                '    <div class="opt-title" style="font-weight:800; font-size:0.96rem; color:#e9d5ff; margin-bottom:3px; display:flex; align-items:center; gap:0.35rem;">' +
                '      <span>' + c.options[1].icon + '</span> <span>' + this.escapeHtml(c.options[1].title) + '</span>' +
                '    </div>' +
                '    <div class="opt-desc" style="font-size:0.83rem; color:#f5f3ff; line-height:1.35;">' + this.escapeHtml(c.options[1].desc) + '</div>' +
                '  </button>' +
                '</div>';
        }
        // 2. Taktický pergamen (uložit do brašny nebo použít ihned)
        else if (isScroll) {
            html += '<div style="margin-top:0.35rem; display:flex; flex-direction:column; gap:0.55rem;">' +
                '  <div style="font-size:0.82rem; color:#86efac; font-weight:700; background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.35); border-radius:6px; padding:0.45rem 0.65rem; text-align:center;">' +
                '    🎒 Taktický pergamen: ulož do brašny na později, nebo zahraj ihned:' +
                '  </div>' +
                '  <div style="display:flex; gap:0.55rem;">' +
                (canStore ? (
                    '    <button type="button" class="btn-primary" style="flex:1; background:linear-gradient(135deg, #059669, #047857); border:1.5px solid #34d399; color:#fff; font-size:0.92rem; padding:0.65rem 0.8rem; font-weight:bold; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem; box-shadow:0 3px 10px rgba(5,150,105,0.4);" onclick="PRS_App.handleStoreScroll(); PRS_App.closeChanceModal();">' +
                    '      🎒 Do brašny (' + invCount + '/3)' +
                    '    </button>'
                ) : (
                    '    <div style="flex:1; color:#f87171; font-size:0.82rem; text-align:center; font-weight:700; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:0.55rem; border-radius:8px;">⚠️ Brašna plná (3/3)</div>'
                )) +
                '    <button type="button" class="btn-primary" style="flex:1; background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; color:#fff; font-size:0.92rem; padding:0.65rem 0.8rem; font-weight:bold; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem; box-shadow:0 3px 10px rgba(217,119,6,0.4);" onclick="PRS_App.handleUseScrollNow(); PRS_App.closeChanceModal();">' +
                '      ⚡ Použít ihned' +
                '    </button>' +
                '  </div>' +
                '</div>';
        }
        // 3. Běžná karta s efektem
        else {
            html += '<div style="margin-top:0.35rem; display:flex; flex-direction:column; gap:0.65rem;">' +
                '  <div style="font-size:0.92rem; font-weight:bold; color:' + effColor + '; background:rgba(0,0,0,0.55); padding:0.65rem 0.9rem; border-radius:8px; border:1px solid rgba(255,255,255,0.15); text-align:center;">' +
                '    ⚡ ' + this.formatGameText(pa.summary || c.text) +
                '  </div>' +
                '  <button type="button" class="btn-primary" style="width:100%; padding:0.7rem; font-weight:bold; font-size:0.95rem; border-radius:8px;" onclick="PRS_App.closeChanceModal(); PRS_App.handleEndTurn();">' +
                '    ➡️ Rozumím &amp; Ukončit tah' +
                '  </button>' +
                '</div>';
        }

        html += '</div>';
        body.innerHTML = html;
    },

    toggleChanceCardFlip: function (cardId) {
        if (this.flippedChanceCardId === cardId) {
            this.flippedChanceCardId = null;
        } else {
            this.flippedChanceCardId = cardId;
            if (window.PRS_Audio) window.PRS_Audio.playItem();
        }
        this.renderActionPanel();
        this.renderChanceModalContent();

        var isMobile = (window.innerWidth <= 768) || (this.deviceProfile && this.deviceProfile.device === "mobile");
        if (isMobile) {
            var modal = document.getElementById("chance-card-modal");
            if (!modal || modal.style.display === "none") {
                this.openChanceModal();
            }
        }
        this.updateMobileDock();
    },

    // --- SPECIÁLNÍ POLE: ŠATLAVA (PRISON) ---,

    handlePayPrisonBail: function () {

        var ok = window.PRS_GameEngine.payPrisonBail(this.state);

        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();

        this.renderGameScreen();

    },

    handlePrisonEscape: function () {

        if (window.PRS_Audio) window.PRS_Audio.playDice();

        var res = window.PRS_GameEngine.attemptPrisonEscape(this.state);

        if (res && res.success) {

            if (window.PRS_Audio) {

                setTimeout(function () {

                    window.PRS_Audio.playFanfare();

                }, 350);

            }

        } else {

            if (window.PRS_Audio) window.PRS_Audio.playSword();

        }

        this.renderGameScreen();

    },

    handleServePrisonSentence: function () {

        window.PRS_GameEngine.servePrisonSentence(this.state);

        if (window.PRS_Audio) window.PRS_Audio.playStep();

        this.renderGameScreen();

    },

    // --- SPECIÁLNÍ POLE: ŠPITÁL (HOSPITAL) ---,

    handleBuyHospitalElixir: function () {

        var ok = window.PRS_GameEngine.buyHospitalElixir(this.state);

        if (ok && window.PRS_Audio) {

            window.PRS_Audio.playCoin();

            setTimeout(function () {

                window.PRS_Audio.playFanfare();

            }, 300);

        }

        this.renderGameScreen();

    },

    handleRestHospital: function () {

        window.PRS_GameEngine.restInHospital(this.state);

        if (window.PRS_Audio) window.PRS_Audio.playStep();

        this.renderGameScreen();

    },

    // --- SPECIÁLNÍ POLE: KRČMA (TAVERN) ---,

    handleTavernGamble: function () {

        if (window.PRS_Audio) window.PRS_Audio.playDice();

        var res = window.PRS_GameEngine.gambleInTavern(this.state);

        if (res && res.win && window.PRS_Audio) {

            setTimeout(function () {

                window.PRS_Audio.playCoin();

            }, 300);

        }

        this.renderGameScreen();

    },

    handleBuyTavernRound: function () {

        var ok = window.PRS_GameEngine.buyTavernRound(this.state);

        if (ok && window.PRS_Audio) {

            window.PRS_Audio.playCoin();

            setTimeout(function () {

                window.PRS_Audio.playFanfare();

            }, 300);

        }

        this.renderGameScreen();

    },

    handlePlayerDuel: function (targetIdx) {

        var res = window.PRS_GameEngine.executePlayerDuel(this.state, targetIdx);

        if (res) {

            this.renderGameScreen();

            this.saveSessionAuto();

            this.showDuelResultModal(res, "duel");

        }

    },

    handlePlayerToast: function (targetIdx) {

        var res = window.PRS_GameEngine.executePlayerToast(this.state, targetIdx);

        if (res) {

            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            this.renderGameScreen();

            this.saveSessionAuto();

        }

    },

    handleAnimalBuyout: function (nodeId) {
        if (this.isActionProcessing || this.isSavingSession) return;
        this.isActionProcessing = true;

        // Okamžitě v DOMu odstranit panel s předkupním právem pro okamžitou vizuální odezvu
        var buyoutCards = document.querySelectorAll(".buyout-interaction-card, .btn-action-buyout");
        for (var b = 0; b < buyoutCards.length; b++) {
            if (buyoutCards[b].classList.contains("buyout-interaction-card")) {
                buyoutCards[b].remove();
            } else {
                buyoutCards[b].disabled = true;
                buyoutCards[b].style.opacity = "0.5";
            }
        }

        // Preventivně vyčistit stav předkupního práva v pendingAction
        if (this.state && this.state.pendingAction) {
            this.state.pendingAction.canBuyoutAnimalSet = false;
            this.state.pendingAction.buyoutCandidates = [];
            delete this.state.pendingAction.canBuyoutAnimalSet;
            delete this.state.pendingAction.buyoutCandidates;
            delete this.state.pendingAction.buyoutSuccess;
        }

        var res = null;
        try {
            res = window.PRS_GameEngine.executeAnimalBuyout(this.state, nodeId);
        } catch (err) {
            console.error("Chyba při výkupu zvířete executeAnimalBuyout:", err);
        }

        if (res) {
            if (window.PRS_Audio) window.PRS_Audio.playBuy();
            this.inspectedPlayerIndex = this.state.currentPlayerIndex;
            var price = (typeof res === "object" && res.buyoutPrice) ? res.buyoutPrice : 1600;
            var nodeName = (typeof res === "object" && res.nodeName) ? res.nodeName : "Zvíře";
            if (this.showToast) {
                this.showToast("🦅 " + nodeName + " úspěšně vykoupen ze sady (-" + price.toLocaleString("cs-CZ") + " zl., +1.0 💖)!", "success");
            }
            if (this.showPawnToast) {
                this.showPawnToast(this.state.currentPlayerIndex, "Vykoupen " + nodeName + "!", "🦅", "#10b981");
            }

            if (this.state && this.state.pendingAction) {
                this.state.pendingAction.canBuyoutAnimalSet = false;
                this.state.pendingAction.buyoutCandidates = [];
                this.state.pendingAction.buyoutSuccess = null;
                delete this.state.pendingAction.canBuyoutAnimalSet;
                delete this.state.pendingAction.buyoutCandidates;
                delete this.state.pendingAction.buyoutSuccess;
            }

            this.isBoardStaticDirty = true;
            try { this.renderGameScreen(); } catch (e) { console.error("renderGameScreen error:", e); }
            try { this.renderActionPanel(); } catch (e) { console.error("renderActionPanel error:", e); }
            try { this.renderLowerKnightDetail(); } catch (e) { console.error("renderLowerKnightDetail error:", e); }
            if (this.activeSidebarTab === "property") {
                try { this.renderSidebarPropertyPanel(); } catch (e) { }
            }

            var self = this;
            var p = this.saveSessionAuto();
            if (p && p.finally) {
                p.finally(function () {
                    self.isActionProcessing = false;
                });
            } else {
                setTimeout(function () { self.isActionProcessing = false; }, 350);
            }
        } else {
            this.isActionProcessing = false;
            try { this.renderActionPanel(); } catch (e) { }
        }
    },

    getGenericModal: function () {
        var modal = document.getElementById("generic-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "generic-modal";
            modal.className = "modal-backdrop";
            modal.style.display = "none";
            modal.style.zIndex = "10060";
            modal.onclick = function (e) {
                if (e.target === this) this.style.display = "none";
            };
            document.body.appendChild(modal);
        }
        return modal;
    },

    openIntrigueModal: function (type) {
        var self = this;
        var modal = this.getGenericModal();
        if (!modal) return;
        var p = self.state.players[self.state.currentPlayerIndex];
        var targets = [];
        for (var i = 0; i < self.state.players.length; i++) {
            var pl = self.state.players[i];
            if (pl.index !== p.index && !pl.isEliminated) targets.push(pl);
        }
        var isBallad = (type === "ballad");
        var cost = isBallad ? ((self.state.pendingAction && self.state.pendingAction.intrigueBalladCost) || 750) : ((self.state.pendingAction && self.state.pendingAction.intrigueCustomsCost) || 600);
        var canAfford = (p.gold >= cost);

        var costWarnHtml = "";
        if (!canAfford) {
            costWarnHtml = '<div style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:8px; padding:0.45rem 0.65rem; color:#fca5a5; font-size:0.8rem; margin-bottom:0.75rem;">' +
                '⚠️ <strong>Nedostatek zlata!</strong> Na tuto intriku potřebuješ <strong>' + cost.toLocaleString("cs-CZ") + ' zl.</strong>, ve váčku máš pouze <strong>' + p.gold.toLocaleString("cs-CZ") + ' zl.</strong>' +
                '</div>';
        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid var(--gold); border-radius:14px; text-align:center;">' +
            '<div style="font-size:2rem; margin-bottom:0.25rem;">' + (isBallad ? '🎭 🃏' : '📜 ⚖️') + '</div>' +
            '<h3 style="font-family:Cinzel,serif; color:var(--gold-light); margin:0 0 0.5rem 0;">' + (isBallad ? 'Posměšná balada pod balkónem' : 'Královská celní kontrola') + '</h3>' +
            '<p style="font-size:0.84rem; color:var(--text-muted); margin-bottom:0.8rem;">' +
            (isBallad ? 'Kejklíř složí uštěpačnou píseň o vybraném soupeři (souboj Charisma + 1d6). Úspěch: soupeř ztrácí 💖 a ty získáváš dvorskou přízeň! Cena: <strong>' + cost.toLocaleString("cs-CZ") + ' zl.</strong>' : 'Zvol soupeře, jehož panství budou na 1 kolo zmrazena celní kontrolou (nikdo mu neplatí nájem). Cena: <strong>' + cost.toLocaleString("cs-CZ") + ' zl.</strong>') +
            '</p>' +
            costWarnHtml +
            '<div style="display:flex; flex-direction:column; gap:0.5rem;">';
        for (var t = 0; t < targets.length; t++) {
            var tgt = targets[t];
            var chVal = (tgt.skills && tgt.skills.charisma !== undefined) ? tgt.skills.charisma : 1;
            var btnStyle = canAfford ? 'text-align:left; padding:0.6rem 0.85rem;' : 'text-align:left; padding:0.6rem 0.85rem; opacity:0.45; cursor:not-allowed;';
            var clickHandler = canAfford ? ('PRS_App.confirmPlotIntrigue(\'' + type + '\', ' + tgt.index + ')') : '';
            html += '<button class="btn-gold-lg" style="' + btnStyle + '" ' + (canAfford ? ('onclick="' + clickHandler + '"') : 'disabled') + '>' +
                tgt.badge + ' <strong>' + self.escapeHtml(tgt.name) + '</strong> (' + tgt.totalHearts + ' 💖, Charisma ' + chVal + ')' +
                '</button>';
        }
        if (targets.length === 0) {
            html += '<p style="color:#fca5a5; font-size:0.85rem;">V království již nezbyl žádný aktivní soupeř.</p>';
        }
        html += '</div>' +
            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m) m.style.display=\'none\';">Zrušit</button>' +
            '</div>';
        modal.innerHTML = html;
        modal.style.display = "flex";
    },

    confirmPlotIntrigue: function (type, targetIdx) {

        var modal = document.getElementById("generic-modal");

        if (modal) modal.style.display = "none";

        var res = window.PRS_GameEngine.executePlotIntrigue(this.state, type, targetIdx);

        if (!res) {
            if (this.showToast) {
                this.showToast("⚠️ Nemáš dostatek zlata na provedení intriky!", "warning");
            }
            return;
        }

        if (res.type === "ballad") {
            if (res.success) {
                if (window.PRS_Audio && window.PRS_Audio.playVictory) window.PRS_Audio.playVictory();
                else if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            } else {
                if (window.PRS_Audio && window.PRS_Audio.playFailure) window.PRS_Audio.playFailure();
                else if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            }
            this.showIntrigueResultModal(res);
        } else if (res.type === "customs") {
            if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            if (this.showToast) {
                this.showToast("📜 Královský celní dekret uvalen na panství hráče " + res.target.name + "!", "success");
            }
        }

        if (this.showPawnToast) {
            if (res.type === "ballad") {
                if (res.success) {
                    this.showPawnToast(res.player.index, "+0,5 💖", "👑", "#86efac");
                    this.showPawnToast(res.target.index, "-" + res.penalty + " 💖", "💔", "#f87171");
                } else {
                    this.showPawnToast(res.player.index, "-" + res.cost + " zl.", "💸", "#fca5a5");
                    this.showPawnToast(res.target.index, "+0,25 💖", "✨", "#86efac");
                }
            } else if (res.type === "customs") {
                this.showPawnToast(res.target.index, "Celní kontrola!", "⚖️", "#fbbf24");
            }
        }

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    showIntrigueResultModal: function (res) {
        var modal = this.getGenericModal();
        if (!modal) return;
        var p1 = res.player;
        var p2 = res.target;
        var isSuccess = res.success;

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:480px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid ' + (isSuccess ? '#10b981' : '#f59e0b') + '; border-radius:14px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.7);">' +
            '<div style="font-size:2.5rem; margin-bottom:0.25rem;">' + (isSuccess ? '🎭 🎶 👑' : '🛡️ 📜 🎭') + '</div>' +
            '<h3 style="font-family:\'Cinzel\',serif; color:' + (isSuccess ? '#86efac' : '#fde047') + '; margin:0 0 0.35rem 0;">' +
            (isSuccess ? 'Posměšná balada uspěla!' : 'Posměšná balada selhala!') + '</h3>' +
            '<p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">Dvorní intrika pod balkónem u Kejklíře</p>' +

            '<div style="display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; background:rgba(0,0,0,0.35); padding:10px; border-radius:10px; margin-bottom:1rem; border:1px solid rgba(212,175,55,0.2);">' +
            '  <div style="background:' + (isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)') + '; border:1.5px solid ' + (isSuccess ? '#10b981' : 'rgba(212,175,55,0.3)') + '; border-radius:8px; padding:8px 6px;">' +
            '    <div style="font-size:1.6rem;">' + p1.badge + '</div>' +
            '    <div style="font-size:0.82rem; font-weight:700; color:' + (p1.color || '#fde047') + '; margin:2px 0;">' + this.escapeHtml(p1.name) + '</div>' +
            '    <div style="font-size:0.75rem; color:#94a3b8;">Tvůj pěvec</div>' +
            '    <div style="margin-top:6px; font-size:0.78rem; line-height:1.4;">' +
            '      <div>✨ Charisma: <strong>' + res.stat1 + '</strong></div>' +
            '      <div>🎲 Kostka: <strong>+' + res.r1 + '</strong></div>' +
            '      <div style="margin-top:4px; font-weight:800; font-size:0.95rem; color:' + (isSuccess ? '#86efac' : '#cbd5e1') + ';">= ' + res.ch1 + '</div>' +
            '    </div>' +
            '  </div>' +

            '  <div style="font-family:\'Cinzel\',serif; font-size:1.2rem; font-weight:900; color:#fbbf24; text-shadow:0 0 8px rgba(251,191,36,0.6);">VS</div>' +

            '  <div style="background:' + (!isSuccess ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)') + '; border:1.5px solid ' + (!isSuccess ? '#f59e0b' : 'rgba(212,175,55,0.3)') + '; border-radius:8px; padding:8px 6px;">' +
            '    <div style="font-size:1.6rem;">' + p2.badge + '</div>' +
            '    <div style="font-size:0.82rem; font-weight:700; color:' + (p2.color || '#fca5a5') + '; margin:2px 0;">' + this.escapeHtml(p2.name) + '</div>' +
            '    <div style="font-size:0.75rem; color:#94a3b8;">Cíl intriky</div>' +
            '    <div style="margin-top:6px; font-size:0.78rem; line-height:1.4;">' +
            '      <div>✨ Charisma: <strong>' + res.stat2 + '</strong></div>' +
            '      <div>🎲 Kostka: <strong>+' + res.r2 + '</strong></div>' +
            '      <div style="margin-top:4px; font-weight:800; font-size:0.95rem; color:' + (!isSuccess ? '#fde047' : '#cbd5e1') + ';">= ' + res.ch2 + '</div>' +
            '    </div>' +
            '  </div>' +
            '</div>' +

            '<div style="background:' + (isSuccess ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)') + '; border:1px solid ' + (isSuccess ? '#10b981' : '#f87171') + '; border-radius:8px; padding:10px; margin-bottom:1rem; font-size:0.84rem; text-align:left; line-height:1.45;">' +
            (isSuccess
                ? ('<div style="color:#86efac; font-weight:700; margin-bottom:4px;">👑 Kejklířova balada pobavila dvůr a zostudila soupeře!</div>' +
                   '<div style="color:#e2e8f0;">Dvořané se soupeřově neobratnosti hlasitě vysmáli. ' + this.escapeHtml(p2.name) + ' ztrácí <strong style="color:#f87171;">-' + res.penalty + ' 💖</strong> a tvůj rytíř si získává obdiv princezny (<strong style="color:#86efac;">+0,5 💖</strong>)!</div>')
                : ('<div style="color:#fca5a5; font-weight:700; margin-bottom:4px;">🛡️ Soupeř zachoval vznešenou noblesu a vtip obrátil proti tobě!</div>' +
                   '<div style="color:#e2e8f0;">Dvůr odsoudil laciný pokus o pomluvu. ' + this.escapeHtml(p2.name) + ' získává <strong style="color:#86efac;">+0,25 💖</strong> za dvorskou ctnost a kejklíř ti odmítá vrátit zaplacených <strong>' + res.cost + ' zl.</strong></div>')) +
            '</div>' +

            '<button class="btn-gold-lg" style="width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m) m.style.display=\'none\'; PRS_App.renderGameScreen();">Rozumím</button>' +
            '</div>';

        modal.innerHTML = html;
        modal.style.display = "flex";
    },

    openTradePactModal: function () {
        var self = this;
        var modal = this.getGenericModal();
        if (!modal) return;
        var p = self.state.players[self.state.currentPlayerIndex];
        var rate = (self.state.config && self.state.config.interactionRate !== undefined) ? self.state.config.interactionRate : 0.5;
        var cost = Math.round(1500 * (rate > 0 ? rate : 0.5));
        var partners = [];
        var maxHearts = 0;
        for (var h = 0; h < self.state.players.length; h++) {
            if (self.state.players[h].totalHearts > maxHearts) maxHearts = self.state.players[h].totalHearts;
        }
        for (var i = 0; i < self.state.players.length; i++) {
            var pl = self.state.players[i];
            if (pl.index !== p.index && !pl.isEliminated && !window.PRS_GameEngine.hasActiveTradePact(self.state, p.index, pl.index)) {
                var isLeaderAhead = (pl.totalHearts === maxHearts && maxHearts >= p.totalHearts + 2);
                partners.push({ player: pl, isLeaderAhead: isLeaderAhead });
            }
        }
        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; text-align:center;">' +
            '<div style="font-size:2rem; margin-bottom:0.25rem;">🤝 📜</div>' +
            '<h3 style="font-family:Cinzel,serif; color:#7dd3fc; margin:0 0 0.5rem 0;">Uzavření Obchodního paktu</h3>' +
            '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:1rem;">' +
            'Zpečeť bezcelní alianci na <strong>8 celých kol</strong> za <strong>' + cost + ' zl.</strong> (polovina jde do pokladny, polovina partnerovi jako dar). ' +
            'Pravidlo cti: Pakt nelze uzavřít s lídrem království, který vede o 2+ 💖!' +
            '</p>' +
            '<div style="display:flex; flex-direction:column; gap:0.5rem;">';
        for (var pt = 0; pt < partners.length; pt++) {
            var item = partners[pt];
            var part = item.player;
            var disabled = item.isLeaderAhead || (p.gold < cost);
            html += '<button class="btn-gold-lg" ' + (disabled ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '') + ' style="text-align:left; padding:0.6rem 0.85rem; background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="PRS_App.confirmTradePact(' + part.index + ')">' +
                part.badge + ' <strong>' + self.escapeHtml(part.name) + '</strong> (' + (part.ownedNodes ? part.ownedNodes.length : 0) + ' panství, ' + part.totalHearts + ' 💖)' +
                (item.isLeaderAhead ? ' <small style="color:#fca5a5;">(Nelze: Lídr)</small>' : '') +
                '</button>';
        }
        if (partners.length === 0) {
            html += '<p style="color:#bae6fd; font-size:0.85rem;">V království není žádný volný spojenec pro pakt.</p>';
        }
        html += '</div>' +
            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m) m.style.display=\'none\';">Zrušit</button>' +
            '</div>';
        modal.innerHTML = html;
        modal.style.display = "flex";
    },

    confirmTradePact: function (partnerIdx) {
        var modal = document.getElementById("generic-modal");
        if (modal) modal.style.display = "none";
        var res = window.PRS_GameEngine.executeFormTradePact(this.state, partnerIdx);
        if (res) {
            if (window.PRS_Audio) window.PRS_Audio.playFanfare();
            this.renderGameScreen();
            this.saveSessionAuto();
        }
    },

    openFestivalChallengeModal: function () {
        var self = this;
        var modal = this.getGenericModal();
        if (!modal || !self.state) return;
        var p = self.state.players[self.state.currentPlayerIndex];
        if (!p) return;
        var stake = (self.state.pendingAction && self.state.pendingAction.festivalChallengeStake) || 750;
        var canAfford = (p.gold >= stake);
        var rivals = [];
        for (var i = 0; i < self.state.players.length; i++) {
            var pl = self.state.players[i];
            if (pl.index !== p.index && !pl.isEliminated) rivals.push(pl);
        }
        var html = '<div class="modal-box tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #ec4899; border-radius:14px; text-align:center; box-shadow:0 12px 35px rgba(0,0,0,0.85);">' +
            '<div style="font-size:2rem; margin-bottom:0.25rem;">🏆 🤺</div>' +
            '<h3 style="font-family:Cinzel,serif; color:#fbcfe8; margin:0 0 0.5rem 0;">Osobní výzva na Slavnosti</h3>' +
            '<p style="font-size:0.84rem; color:#fce7f3; margin-bottom:0.85rem;">' +
            'Zvol rivala a disciplínu (hod 1d6 + hodnota ctnosti). Vítěz získá <strong>' + stake.toLocaleString("cs-CZ") + ' zl.</strong> a <strong>+0,5 💖</strong> slávy!' +
            '</p>' +
            (!canAfford ? '<div style="background:rgba(239,68,68,0.2); border:1px solid #f87171; border-radius:8px; padding:0.45rem; font-size:0.8rem; color:#fca5a5; margin-bottom:0.75rem;">⚠️ Nemáš dostatek zlaťáků na sázku (' + (p.gold || 0) + ' / ' + stake + ' zl.).</div>' : '') +
            '<div style="display:flex; flex-direction:column; gap:0.6rem;">';
        for (var r = 0; r < rivals.length; r++) {
            var riv = rivals[r];
            var rCombat = (riv.skills && riv.skills.combat !== undefined) ? riv.skills.combat : 1;
            var rRiding = (riv.skills && riv.skills.riding !== undefined) ? riv.skills.riding : 1;
            var rDance = (riv.skills && riv.skills.dance !== undefined) ? riv.skills.dance : 1;
            var btnDis = !canAfford ? 'disabled style="flex:1; font-size:0.78rem; padding:0.35rem; opacity:0.5;"' : 'style="flex:1; font-size:0.78rem; padding:0.35rem;"';
            html += '<div style="background:rgba(0,0,0,0.35); border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:0.55rem; text-align:left;">' +
                '<div style="font-weight:700; color:#fbcfe8; margin-bottom:4px;">' + riv.badge + ' ' + (self.escapeHtml ? self.escapeHtml(riv.name) : riv.name) + ' (' + riv.totalHearts + ' 💖)</div>' +
                '<div style="display:flex; gap:4px;">' +
                '  <button class="btn-secondary" ' + btnDis + ' onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'boj\')">⚔️ Boj (' + rCombat + ')</button>' +
                '  <button class="btn-secondary" ' + btnDis + ' onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'jizda\')">🏇 Jízda (' + rRiding + ')</button>' +
                '  <button class="btn-secondary" ' + btnDis + ' onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'tanec\')">💃 Tanec (' + rDance + ')</button>' +
                '</div>' +
                '</div>';
        }
        if (rivals.length === 0) {
            html += '<p style="color:#fca5a5; font-size:0.85rem;">V království již nezbyl žádný aktivní soupeř k výzvě.</p>';
        }
        html += '</div>' +
            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m){ m.style.display=\'none\'; if(window.PRS_App && window.PRS_App.updateBodyModalClass) window.PRS_App.updateBodyModalClass(); }">Zrušit</button>' +
            '</div>';
        modal.innerHTML = html;
        modal.style.display = "flex";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    confirmFestivalChallenge: function (rivalIdx, discipline) {
        var modal = document.getElementById("generic-modal");
        if (modal) modal.style.display = "none";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
        var res = window.PRS_GameEngine.executeFestivalChallenge(this.state, rivalIdx, discipline);

        if (res) {
            this.renderGameScreen();
            this.saveSessionAuto();
            this.showDuelResultModal(res, "festival");
        }
    },

    showDuelResultModal: function (res, category) {

        if (!res) return;

        var modal = document.getElementById("knight-duel-modal");

        var titleEl = document.getElementById("knight-duel-header-title");

        var subEl = document.getElementById("knight-duel-header-sub");

        var bodyEl = document.getElementById("knight-duel-modal-body");

        if (!modal || !bodyEl) return;

        var isFestival = (category === "festival" || res.type === "festival_challenge");

        if (titleEl) {

            titleEl.textContent = isFestival ? "Osobní výzva na Slavnosti" : "Rytířský duel cti";

        }

        if (subEl) {

            subEl.textContent = isFestival ? "Rytířské klání v turnajové disciplíně" : "Výsledek přímého souboje na poli";

        }

        var p1 = res.p1;

        var p2 = res.p2;

        var p1Obj = (this.state && this.state.players && p1 && p1.index !== undefined) ? this.state.players[p1.index] : null;
        var p2Obj = (this.state && this.state.players && p2 && p2.index !== undefined) ? this.state.players[p2.index] : null;
        var p1IsBot = (p1 && p1.type && p1.type !== "Human") || (p1Obj && p1Obj.type !== "Human");
        var p2IsBot = (p2 && p2.type && p2.type !== "Human") || (p2Obj && p2Obj.type !== "Human");
        var isBothBots = Boolean(p1IsBot && p2IsBot);

        if (this.botDuelAutoCloseTimer) {
            clearTimeout(this.botDuelAutoCloseTimer);
            this.botDuelAutoCloseTimer = null;
        }

        var isDraw = res.isDraw;

        var p1Won = (res.winnerIndex === p1.index);

        var p2Won = (res.winnerIndex === p2.index);

        var statName = isFestival ? ((window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(res.discipline, true) : "⚔️ Boj") : "⚔️ Boj";

        var statVal1 = isFestival ? p1.stat : p1.combat;

        var statVal2 = isFestival ? p2.stat : p2.combat;

        var html = [];

        html.push('<div class="duel-combatants-arena">');

        // Bojovník 1 (Útočník / Vyzývatel)

        html.push('  <div class="duel-combatant-card' + (p1Won ? ' winner' : '') + '" style="border-color:' + p1.color + ';">');

        if (p1Won) html.push('    <div style="position:absolute; top:-10px; right:10px; background:#fbbf24; color:#000; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.6);">👑 VÍTĚZ</div>');

        html.push('    <div class="duel-combatant-badge">' + p1.badge + '</div>');

        html.push('    <div class="duel-combatant-name" style="color:' + p1.color + ';" title="' + this.escapeHtml(p1.name) + '">' + this.escapeHtml(p1.name) + '</div>');

        html.push('    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:4px;">Útočník</div>');

        html.push('    <div class="duel-combatant-stats">');

        html.push('      <div>' + statName + ': <strong>+' + statVal1 + '</strong></div>');

        html.push('      <div>Hod kostkou: 🎲 <strong>' + p1.roll + '</strong></div>');

        html.push('    </div>');

        html.push('    <div class="duel-combatant-total">' + p1.total + '</div>');

        html.push('    <div style="font-size:0.7rem; color:#fde047;">Celková síla</div>');

        html.push('  </div>');

        // VS střed

        html.push('  <div class="duel-vs-divider">');

        html.push('    <div style="font-size:1.6rem;">⚔️</div>');

        html.push('    <div class="duel-vs-text">VS</div>');

        html.push('    <div style="font-size:0.72rem; color:#cbd5e1; font-weight:bold;">Sázka: ' + res.stake.toLocaleString("cs-CZ") + ' zl.</div>');

        html.push('  </div>');

        // Bojovník 2 (Obránce / Rival)

        html.push('  <div class="duel-combatant-card' + (p2Won ? ' winner' : '') + '" style="border-color:' + p2.color + ';">');

        if (p2Won) html.push('    <div style="position:absolute; top:-10px; right:10px; background:#fbbf24; color:#000; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.6);">👑 VÍTĚZ</div>');

        html.push('    <div class="duel-combatant-badge">' + p2.badge + '</div>');

        html.push('    <div class="duel-combatant-name" style="color:' + p2.color + ';" title="' + this.escapeHtml(p2.name) + '">' + this.escapeHtml(p2.name) + '</div>');

        html.push('    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:4px;">Obránce</div>');

        html.push('    <div class="duel-combatant-stats">');

        html.push('      <div>' + statName + ': <strong>+' + statVal2 + '</strong></div>');

        html.push('      <div>Hod kostkou: 🎲 <strong>' + p2.roll + '</strong></div>');

        html.push('    </div>');

        html.push('    <div class="duel-combatant-total">' + p2.total + '</div>');

        html.push('    <div style="font-size:0.7rem; color:#fde047;">Celková síla</div>');

        html.push('  </div>');

        html.push('</div>');

        // Banner s výsledkem

        var bannerCls = isDraw ? 'draw' : (p1Won ? 'win' : 'lose');

        html.push('<div class="duel-outcome-banner ' + bannerCls + '">');

        if (isDraw) {

            html.push('  <h4 style="margin:0 0 0.35rem; color:#7dd3fc; font-family:\"Cinzel\",serif; font-size:1.15rem;">⚖️ Nerozhodný střet čepelí!</h4>');

            html.push('  <p style="margin:0; font-size:0.85rem; color:#e0f2fe;">Oba rytíři předvedli stejnou sílu (' + p1.total + ' vs ' + p2.total + '). Žádné zlaťáky ani srdce princezny se nemění.</p>');

        } else {

            var winner = p1Won ? p1 : p2;

            var loser = p1Won ? p2 : p1;

            html.push('  <h4 style="margin:0 0 0.35rem; color:#fef08a; font-family:\"Cinzel\",serif; font-size:1.15rem;">🏆 Vítězem duelu je ' + winner.badge + ' ' + this.escapeHtml(winner.name) + '!</h4>');

            html.push('  <div style="font-size:0.88rem; line-height:1.45; color:#f1f5f9;">');

            html.push('    <div>Slavný úder překonal soupeře (<strong>' + winner.total + '</strong> vs <strong>' + loser.total + '</strong>).</div>');

            html.push('    <div style="margin-top:0.35rem; font-weight:bold; color:#a7f3d0;">💰 Kořist vítěze: +' + (res.actualGold || res.stake).toLocaleString("cs-CZ") + ' zl. &nbsp;•&nbsp; 💖 +' + (res.heartStake || 0.5) + ' Srdce princezny</div>');

            if (res.heartLost) {

                html.push('    <div style="font-size:0.8rem; color:#fca5a5; margin-top:2px;">💔 Poražený ztrácí -' + (res.heartStake || 0.5) + ' 💖 slávy</div>');

            }

            if (res.hospitalTransferred) {

                html.push('    <div style="font-size:0.82rem; color:#fca5a5; margin-top:4px; font-weight:bold;">🏥 V režimu Na život a smrt je těžce zraněný rytíř ' + this.escapeHtml(loser.name) + ' urychleně převezen do Královského lazaretu!</div>');

            }

            html.push('  </div>');

        }

        html.push('</div>');

        // Tlačítko pokračovat
        if (isBothBots) {
            html.push('<button class="btn-gold-lg" style="width:100%; padding:0.75rem; font-size:1.02rem;" onclick="PRS_App.closeKnightDuelModal()">⚔️ Pokračovat ve hře <span style="font-size:0.8rem; opacity:0.85; margin-left:6px;">(BOT duel – zavře se za 0,5 s...)</span></button>');
            html.push('<div style="height:3px; background:rgba(239,68,68,0.25); border-radius:2px; margin-top:8px; overflow:hidden;"><div style="height:100%; background:#ef4444; width:100%; animation:botDuelProgress 0.5s linear forwards;"></div></div>');
        } else {
            html.push('<button class="btn-gold-lg" style="width:100%; padding:0.75rem; font-size:1.02rem;" onclick="PRS_App.closeKnightDuelModal()">⚔️ Pokračovat ve hře</button>');
        }

        bodyEl.innerHTML = html.join("\n");

        modal.style.display = "flex";

        this.updateBodyModalClass();

        if (isBothBots) {
            var self = this;
            this.botDuelAutoCloseTimer = setTimeout(function () {
                self.botDuelAutoCloseTimer = null;
                self.closeKnightDuelModal();
            }, 500);
        }

        if (window.PRS_Audio) {

            window.PRS_Audio.playSword();

            if (p1Won && p1.type === "Human") {

                setTimeout(function () { if (window.PRS_Audio) window.PRS_Audio.playFanfare(); }, 300);

            }

        }

    },

    openCardPreview: function (type, id) {
        var modal = document.getElementById("card-detail-preview-modal");
        var titleEl = document.getElementById("card-detail-preview-title");
        var bodyEl = document.getElementById("card-detail-preview-body");
        if (!modal || !bodyEl) return;

        var html = [];
        var modalTitle = "Náhled karty";

        if (type === "quest") {
            var q = null;
            if (window.PRS_QUESTS) {
                var allQuests = (window.PRS_QUESTS.U1 || []).concat(window.PRS_QUESTS.U2 || []).concat(window.PRS_QUESTS.U3 || []);
                for (var i = 0; i < allQuests.length; i++) {
                    if (allQuests[i].id === id) { q = allQuests[i]; break; }
                }
            }
            if (!q) return;

            modalTitle = (q.icon || "⚔️") + " " + q.name;

            var isU1 = (q.id && q.id.indexOf("u1_") === 0);
            var isU2 = (q.id && q.id.indexOf("u2_") === 0);

            var tierTitle = isU1 ? "Tier U1 • Lesní zvěř" :
                            (isU2 && q.difficulty >= 12 ? "Tier U2+ • Mýtický titán" :
                            (isU2 ? "Tier U2 • Bájné monstrum" :
                            (q.tierGroup === "young" ? "Tier U3 • Mladý drak" :
                            (q.tierGroup === "elemental" ? "Tier U3 • Živlový drak" : "Tier U3 • Legendární Boss"))));

            var tierColor = isU1 ? "#10b981" :
                            (isU2 && q.difficulty >= 12 ? "#ec4899" :
                            (isU2 ? "#f59e0b" :
                            (q.tierGroup === "young" ? "#60a5fa" :
                            (q.tierGroup === "elemental" ? "#a855f7" : "#e11d48"))));

            var wMap = {
                dogs: "Lovečtí psi odlákají pozornost (+2 k síle se psy v chovu)",
                falcon: "Sokol útočí na zranitelná místa (+2 k síle se sokolem v chovu)",
                falcons: "Lovecký sokol vystopuje úkryt / odrazí vzdušný útok (+2 k síle)",
                animals: "Pes i sokol matou protivníka v boji (+2 k síle při vlastnictví psa i sokola)",
                horse: "Útok z plné jízdy na koni (+2 k síle s koněm v chovu)",
                dance: "Lze okouzlit ladným tancem (+2 k síle s Tancem ≥ 2)",
                elixir: "Hojivý lektvar neutralizuje dech či jed (+2 k síle s lektvarem)",
                water_armor: "Vodní perla či pevná zbroj tlumí žár (+2 k síle se zbrojí / vodní perlou)",
                ice: "Mrazivé zbraně oslabují protivníka (+2 k síle s mrazivou zbraní / relikvií)",
                fire: "Oheň taví led, krystaly a sítě (+2 k síle s ohnivou zbraní / relikvií)",
                armor: "Pevná rytířská zbroj svádí blesky a odráží drtivé údery (+2 k síle)",
                light: "Posvěcené relikvie rozhánějí temnotu a přízraky (+2 k síle)",
                charisma: "Vznešené charisma soka uchlácholí (+2 k síle s Charismatem ≥ 3)",
                holy: "Svaté relikvie zaženou nemrtvého a zlomí kletbu (+2 k síle)",
                courage: "Pevná vůle a odvaha pronikne mlhou (+2 k síle s Bojem ≥ 3 či Jízdou ≥ 3)",
                mastery: "Zkouška všech 4 ctností (+2 k síle při všech ctnostech ≥ 2)",
                spear: "Dlouhé rytířské kopí udrží soka v bezpečné vzdálenosti (+2 k síle)"
            };

            var trophyDef = (q.trophyId && window.PRS_TROPHIES) ? window.PRS_TROPHIES[q.trophyId] : null;

            html.push('<div class="bestiary-card" style="margin:0; background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; overflow:hidden;">');

            if (q.img) {
                html.push('  <div class="card-media-header" style="cursor:pointer;" onclick="PRS_App.openImageModal(\'' + q.img + '\', \'' + this.escapeHtml(q.name) + '\', \'' + this.escapeHtml(q.desc) + '\')" title="Klikni pro celoobrazovkové zvětšení">');
                html.push('    <img src="' + q.img + '" alt="' + this.escapeHtml(q.name) + '" class="card-media-img" loading="lazy" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.png\';" />');
                html.push('    <span class="card-media-badge-left" style="border-color:' + tierColor + '; color:' + tierColor + ';">' + tierTitle + '</span>');
                html.push('    <span class="card-media-badge-right" style="border-color:rgba(239,68,68,0.6); color:#fca5a5;">⚔️ Obtížnost ' + q.difficulty + '</span>');
                html.push('  </div>');
            }

            html.push('  <div class="card-media-body" style="padding:0.9rem;">');
            html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;">');
            html.push('      <span style="font-weight:bold; font-size:1.1rem; color:#f8fafc;">' + (q.icon || "⚔️") + ' ' + this.escapeHtml(q.name) + '</span>');
            html.push('      <span style="background:rgba(212,175,55,0.2); border:1px solid var(--gold); border-radius:6px; padding:0.2rem 0.55rem; font-size:0.82rem; color:var(--gold-light); font-weight:bold;">💰 +' + q.gold.toLocaleString("cs-CZ") + ' zl. &nbsp;|&nbsp; 💖 +' + q.hearts + '</span>');
            html.push('    </div>');

            html.push('    <div style="font-size:0.86rem; color:#cbd5e1; line-height:1.45; margin-bottom:0.75rem;">' + this.escapeHtml(q.desc) + '</div>');

            if (q.weakness && wMap[q.weakness]) {
                html.push('    <div class="card-callout-box" style="border-color:rgba(253,224,71,0.4); color:#fef08a; background:rgba(212,175,55,0.12); font-size:0.83rem; margin-bottom:0.6rem; padding:0.5rem 0.75rem; border-radius:6px;">');
                html.push('      🎯 <strong>Využitelná slabina (+2 k síle):</strong> ' + wMap[q.weakness]);
                html.push('    </div>');
            }

            if (trophyDef) {
                var statsBonus = [];
                if (trophyDef.combat) statsBonus.push("⚔️+" + trophyDef.combat);
                if (trophyDef.riding) statsBonus.push("🏇+" + trophyDef.riding);
                if (trophyDef.dance) statsBonus.push("💃+" + trophyDef.dance);
                if (trophyDef.charisma) statsBonus.push("✨+" + trophyDef.charisma);
                html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.4); color:var(--gold-light); background:rgba(255,255,255,0.04); font-size:0.83rem; padding:0.5rem 0.75rem; border-radius:6px;">');
                html.push('      🏆 <strong>Trofej po porážce:</strong> ' + trophyDef.icon + ' ' + this.escapeHtml(trophyDef.name) + (statsBonus.length ? ' (' + statsBonus.join(" ") + ')' : ''));
                html.push('    </div>');
            }

            if (q.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + q.img + '\', \'' + q.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; margin-top:0.6rem; width:100%; cursor:pointer;">🔄 Otočit směr pohledu</button>');
            }

            html.push('  </div>');
            html.push('</div>');

        } else if (type === "item") {
            var it = null;
            if (window.PRS_ITEMS) {
                for (var j = 0; j < window.PRS_ITEMS.length; j++) {
                    if (window.PRS_ITEMS[j].id === id) { it = window.PRS_ITEMS[j]; break; }
                }
            }
            if (!it) return;

            modalTitle = (it.icon || "🛡️") + " " + it.name;

            var statChips = [];
            if (it.combat) statChips.push('<span class="armory-stat-chip ' + (it.combat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (it.combat > 0 ? '+' : '') + it.combat + ' Boj</span>');
            if (it.riding) statChips.push('<span class="armory-stat-chip ' + (it.riding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (it.riding > 0 ? '+' : '') + it.riding + ' Jízda</span>');
            if (it.dance) statChips.push('<span class="armory-stat-chip ' + (it.dance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (it.dance > 0 ? '+' : '') + it.dance + ' Tanec</span>');
            if (it.charisma) statChips.push('<span class="armory-stat-chip ' + (it.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">✨ ' + (it.charisma > 0 ? '+' : '') + it.charisma + ' Charisma</span>');

            var slotLabels = {
                weapon: "⚔️ Zbraň",
                armor: "🛡️ Brnění",
                steed: "🏇 Oř / Zvíře",
                cloak: "🧥 Plášť / Oděv",
                jewel: "💎 Klenot / Šperk",
                trophy: "🏆 Trofej"
            };

            html.push('<div style="background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:1.1rem;">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">');
            html.push('    <span style="font-size:0.8rem; background:rgba(212,175,55,0.18); color:var(--gold-light); padding:0.2rem 0.55rem; border-radius:4px; font-weight:bold;">' + (it.tier || 1) + '. stupeň výbavy</span>');
            html.push('    <span style="font-size:1.05rem; color:var(--gold-light); font-weight:bold;">' + (it.price ? it.price.toLocaleString("cs-CZ") + ' zl.' : 'Vzácné') + '</span>');
            html.push('  </div>');

            html.push('  <div style="font-size:1.3rem; font-weight:bold; color:#f8fafc; margin-bottom:0.5rem;">' + (it.icon || '🛡️') + ' ' + this.escapeHtml(it.name) + '</div>');
            html.push('  <div style="font-size:0.86rem; color:#cbd5e1; line-height:1.45; margin-bottom:0.85rem;">' + this.escapeHtml(it.desc || 'Ušlechtilý předmět pro rytíře turnajového dvora.') + '</div>');

            if (statChips.length > 0) {
                html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.85rem;">' + statChips.join("") + '</div>');
            }

            html.push('  <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.82rem; color:#94a3b8; display:flex; justify-content:space-between;">');
            html.push('    <span>Slot rytíře: <strong style="color:#e2e8f0;">' + (slotLabels[it.slot] || it.slot || 'Univerzální') + '</strong></span>');
            if (it.source) html.push('    <span>Původ: <strong style="color:var(--gold-light);">' + this.escapeHtml(it.source) + '</strong></span>');
            html.push('  </div>');

            html.push('</div>');

        } else if (type === "chance") {
            var ch = null;
            if (window.PRS_CHANCE_CARDS) {
                for (var k = 0; k < window.PRS_CHANCE_CARDS.length; k++) {
                    if (window.PRS_CHANCE_CARDS[k].id === id) { ch = window.PRS_CHANCE_CARDS[k]; break; }
                }
            }
            if (!ch) return;

            modalTitle = (ch.icon || "❓") + " " + ch.title;
            var catLabel = ch.category === "positive" ? "Pozitivní osud (+)" : (ch.category === "negative" ? "Neštěstí (-)" : "Výzva (!)");
            var catCol = ch.category === "positive" ? "#4ade80" : (ch.category === "negative" ? "#f87171" : "#facc15");

            html.push('<div style="background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:1.1rem; text-align:center;">');
            html.push('  <div style="font-size:2.4rem; margin-bottom:0.4rem;">' + (ch.icon || '❓') + '</div>');
            html.push('  <div style="font-size:0.8rem; color:' + catCol + '; font-weight:bold; text-transform:uppercase; margin-bottom:0.5rem;">' + catLabel + '</div>');
            html.push('  <div style="font-size:1.15rem; font-weight:bold; color:var(--gold-light); margin-bottom:0.75rem;">' + this.escapeHtml(ch.title) + '</div>');
            html.push('  <div style="font-size:0.92rem; color:#e2e8f0; line-height:1.5; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.25); border-radius:8px; padding:0.75rem;">' + this.escapeHtml(ch.text) + '</div>');
            html.push('</div>');

        } else if (type === "festival") {
            var festMap = {
                fest_tournament: { title: "Královský rytířský turnaj", icon: "⚔️", desc: "Turnajové klání v plné zbroji na počest královny. Měří se dovednost Boje a Jízdy na koni.", virtues: "⚔️ Boj + 🏇 Jízda", prizes: "1. místo: 1 500 zl. &nbsp;|&nbsp; 2. místo: 800 zl. &nbsp;|&nbsp; 3. místo: 400 zl." },
                fest_ball: { title: "Dvorský ples u princezny", icon: "💃", desc: "Slavnostní ples v audienční síni. Dvorské dámy hodnotí ladnost Tance a vznešené Charisma rytířů.", virtues: "💃 Tanec + ✨ Charisma", prizes: "1. místo: 1 500 zl. &nbsp;|&nbsp; 2. místo: 800 zl. &nbsp;|&nbsp; 3. místo: 400 zl." },
                fest_race: { title: "Velký královský dostih", icon: "🏇", desc: "Rychlostní a vytrvalostní závod koní přes louky i příkopy království. Rozhoduje Jízda a Boj.", virtues: "🏇 Jízda + ⚔️ Boj", prizes: "1. místo: 1 500 zl. &nbsp;|&nbsp; 2. místo: 800 zl. &nbsp;|&nbsp; 3. místo: 400 zl." }
            };
            var f = festMap[id] || { title: "Královská slavnost", icon: "🎪", desc: "Slavnostní událost království.", virtues: "Turnajové ctnosti", prizes: "Peněžité odměny" };
            modalTitle = f.icon + " " + f.title;

            html.push('<div style="background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:1.1rem;">');
            html.push('  <div style="text-align:center; font-size:2.4rem; margin-bottom:0.4rem;">' + f.icon + '</div>');
            html.push('  <div style="font-size:1.15rem; font-weight:bold; color:var(--gold-light); text-align:center; margin-bottom:0.6rem;">' + this.escapeHtml(f.title) + '</div>');
            html.push('  <div style="font-size:0.88rem; color:#cbd5e1; line-height:1.45; margin-bottom:0.85rem;">' + this.escapeHtml(f.desc) + '</div>');
            html.push('  <div style="background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.75rem; margin-bottom:0.6rem; font-size:0.84rem;"><strong>Hodnocené ctnosti:</strong> ' + f.virtues + '</div>');
            html.push('  <div style="background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:8px; padding:0.6rem 0.75rem; font-size:0.84rem; color:#86efac;"><strong>Ceny pro vítěze:</strong> ' + f.prizes + '</div>');
            html.push('</div>');
        }

        if (titleEl) titleEl.innerHTML = modalTitle;
        if (bodyEl) bodyEl.innerHTML = html.join("");
        modal.style.display = "flex";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    closeCardPreviewModal: function () {
        var modal = document.getElementById("card-detail-preview-modal");
        if (modal) modal.style.display = "none";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    closeKnightDuelModal: function () {

        if (this.botDuelAutoCloseTimer) {
            clearTimeout(this.botDuelAutoCloseTimer);
            this.botDuelAutoCloseTimer = null;
        }

        var modal = document.getElementById("knight-duel-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

        var activeP = (this.state && this.state.players) ? this.state.players[this.state.currentPlayerIndex] : null;
        if (this.syncFocusToActivePlayer) {
            this.syncFocusToActivePlayer(true);
        } else if (activeP && activeP.type === "Human") {
            this.selectedNodeId = activeP.nodeId;
            this.inspectedPlayerIndex = activeP.index;
            this.inspectNode(activeP.nodeId);
            this.centerOnActivePlayer(true, true);
            this.renderGameScreen();
        }

        this.scheduleBotTurnIfNeeded();

    },

    // ========================================================================
    // 📜 RYCHLÝ TAHÁK DO KAPSY (A4 CHEATSHEET & TISKOVÝ EXPORT)
    // ========================================================================
    cheatSheetMode: "1page",

    openCheatSheetModal: function (mode) {
        if (mode) this.cheatSheetMode = mode;
        var modal = document.getElementById("cheatsheet-modal");
        if (!modal) return;
        modal.style.display = "flex";
        this.renderCheatSheetContent();
        this.updateCheatSheetModeButtons();
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    closeCheatSheetModal: function () {
        var modal = document.getElementById("cheatsheet-modal");
        if (modal) modal.style.display = "none";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    setCheatSheetMode: function (mode) {
        this.cheatSheetMode = mode || "1page";
        this.updateCheatSheetModeButtons();
        this.renderCheatSheetContent();
    },

    updateCheatSheetModeButtons: function () {
        var b1 = document.getElementById("cs-mode-btn-1page");
        var b2 = document.getElementById("cs-mode-btn-2page");
        if (b1) b1.classList.toggle("active", this.cheatSheetMode === "1page");
        if (b2) b2.classList.toggle("active", this.cheatSheetMode === "2page");
    },

    printCheatSheet: function () {
        this.renderCheatSheetContent();
        document.body.classList.add("printing-cheatsheet");
        window.print();
        setTimeout(function () {
            document.body.classList.remove("printing-cheatsheet");
        }, 1500);
    },

    copyCheatSheetText: function () {
        var text = this.getCheatSheetPlainText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                if (window.KiDeskyToast) window.KiDeskyToast.show("📋 Tahák byl zkopírován do schránky!", "good");
            }).catch(function () {
                PRS_App.fallbackCopyText(text);
            });
        } else {
            this.fallbackCopyText(text);
        }
    },

    fallbackCopyText: function (text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            if (window.KiDeskyToast) window.KiDeskyToast.show("📋 Tahák byl zkopírován do schránky!", "good");
        } catch (e) {
            alert("Kopírování selhalo:\n\n" + text);
        }
        document.body.removeChild(ta);
    },

    getCheatSheetPlainText: function () {
        return "👑 KIDESKY: PRINCEZNINO SRDCE - RYCHLÝ TAHÁK DO KAPSY\n" +
            "=================================================================\n" +
            "CÍL HRY: 30 💖 Princezniných srdcí NEBO skolení 2 draků (okamžitá výhra)!\n" +
            "START: 10 000 zl. • Přejití startu: +3 000 zl. (bez panství záchranná podpora +5 000 zl.)\n\n" +
            "1. SMYČKA TAHU (4 KROKY):\n" +
            "• Krok 1 [HOD]: 1d6 základ (1–6). Opatrný krok (1–4). Kůň: Klus (+1), Cval (+2, Jízda ≥ 2), Trysk (2d6, Jízda ≥ 4 + kůň).\n" +
            "• Krok 2 [ROZCESTÍ]: Hod 1–3 odbočka na vedlejší trasu, 4–6 hlavní trasa. 🦅 Sokolí navigace umožňuje posun doskoku o ±1 pole.\n" +
            "• Krok 3 [AKCE POLE]: Nákup volného pole / zaplacení nájmu majiteli / výcvik u mistra / duel s rytířem / slavnost či trh.\n" +
            "• Krok 4 [KONEC TAHU]: Správa výstroje a zbraní, zahrání pergamenů z brašny (kapacita 3 ks), předání tahu.\n\n" +
            "2. CENÍK & NÁJMY PANSTVÍ A ZVÍŘAT:\n" +
            "• 🦅 Sokol (S1–S4): cena 400 × n (400–1600 zl.), nájem 20%/40%/80% sady. Sada: +4,0 💖 & sokolí navigace (±1 pole).\n" +
            "• 🐕 Pes (P1–P4): cena 500 × n (500–2000 zl.), nájem 20%/40%/80% sady. Sada: +2,5 💖 & obrana panství.\n" +
            "• 🐎 Kůň (K1–K4): cena 600 × n (600–2400 zl.), nájem 20%/40%/80% sady. Sada: +1,5 💖 & Klus/Cval/Trysk.\n" +
            "• 🏡 Vesnice (1★/2★/3★): cena 2000 / +1500 / +1500 zl. Daň: 500/900/1400 zl. Nájem: 300/500/800 zl. Kapacita chovu: 3 ks.\n" +
            "• 🏛️ Město (M1–M5): cena 4500 zl., daň 1200 zl., nájem 700 zl. Kapacita chovu: 2 ks dobytka.\n" +
            "• 🏰 Hrad (H1–H2): cena 8000 zl., daň 2500 zl., nájem 1500 zl., trvale +1 ✨ Charisma pro držitele.\n" +
            "• ⚒️ Živnosti: Kovárna (+1⚔️ Boj), Stáje (+1🏇 Jízda), Krejčí (+1💃 Tanec), Kejklíř (+výnosy). Cena 2500–3000 zl., nájem 350–400 zl.\n" +
            "• 🌾 Chov dobytka: 🐑 Ovce (500 zl., daň +120, nájem +50), 🐖 Prase (600 zl., daň +150, nájem +75), 🐄 Kráva (800 zl., daň +200, nájem +100).\n\n" +
            "3. ČTYŘI CTNOSTI, MISTŘI & DUELY:\n" +
            "• Ctnosti (0–5 stupňů): ⚔️ Boj, 🏇 Jízda, 💃 Tanec, ✨ Charisma.\n" +
            "• Výcvik u Mistra: poplatek 1k–5k zl., hod kostkou 4, 5, 6 uspěje (+1 stupeň). Velmistr dává +1,5 💖 a 1500 zl.\n" +
            "• Rytířský duel na poli: Síla rytíře + 1d6 vs síla soupeře + 1d6. Vítěz bere sázku ve zlatě nebo +1 💖 srdce!\n\n" +
            "4. SLAVNOSTI, AUDIENCE & DRAČÍ VÝZVY:\n" +
            "• ⚔️ Turnaj: Boj + Jízda + 1d6. Ceny: 1500 / 800 / 400 zl. + 💖.\n" +
            "• 💃 Dvorský bál: Tanec + Charisma + 1d6 (Šaty +2). Ceny: 1500 / 800 / 400 zl. + 💖.\n" +
            "• 🏇 Královské dostihy: 2× Jízda + 1d6 (+1 za každého koně). Ceny: 1500 / 800 / 400 zl. + 💖.\n" +
            "• 🐉 Lov draků: U1 (6–8), U2 (9–11), U3 (12–14). Skolení 2 draků = okamžité vítězství!\n" +
            "• 🏥 Špitál: ošetření za 500 zl. nebo hod 5–6 při čekání.\n" +
            "• 🎒 Brašna pergamenů (max 3 ks): Blesková rychlost, Královská amnestie, Síla lva, Zlaté rouno, Přízeň štěstěny.\n\n" +
            "5. KLÁVESOVÉ ZKRATKY:\n" +
            "• Mezerník: Hod kostkou / Pokračovat • T: Otevřít/Zavřít tahák • B: Brašna pergamenů • M: Hudba • Esc: Zavřít okno";
    },

    renderCheatSheetContent: function () {
        var body = document.getElementById("cheatsheet-modal-body");
        if (!body) return;

        var is2Page = (this.cheatSheetMode === "2page");
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var html = '<div class="cs-container" data-mode="' + this.cheatSheetMode + '">';

        if (isEn) {
            // ====================================================================
            // PAGE 1: MAIN POCKET CHEATSHEET (ENGLISH)
            // ====================================================================
            html += '<div class="cs-page cs-page-1">' +
                '  <div class="cs-header">' +
                '    <h2 class="cs-header-title">👑 PRINCESS\'S HEART • QUICK POCKET CHEATSHEET</h2>' +
                '    <div class="cs-header-sub">Original strategic &amp; RPG board game • Tabletop reference guide</div>' +
                '    <div class="cs-meta-bar">' +
                '      <span class="cs-pill">🎯 Goal: 30 💖 Princess Hearts OR 2 slain dragons 🐉</span>' +
                '      <span class="cs-pill">💰 Start: 10,000 g.</span>' +
                '      <span class="cs-pill">🏁 START: +3,000 g. (+5,000 g. landless)</span>' +
                '    </div>' +
                '  </div>' +

                '  <div class="cs-grid">' +

                // LEFT COLUMN
                '    <div class="cs-col">' +

                // Box 1: Turn Cycle
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🔄</span> TURN CYCLE IN 4 STEPS</div>' +
                '        <div class="cs-step-list">' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">1</div>' +
                '            <div><strong>Dice Roll &amp; Movement:</strong> Standard 1d6 (1–6). <em>Cautious Step</em> (1–4 tiles). 🐎 On horseback: <em>Trot</em> (+1), <em>Canter</em> (+2, Riding ≥ 2), <em>Steed Gallop</em> (2d6 choice, Riding ≥ 4 + horse).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">2</div>' +
                '            <div><strong>Crossroads &amp; Falcon:</strong> Roll 1–3 turn left/up, 4–6 straight/right. 🦅 <em>Falcon Navigation</em> (falcon breeding) allows adjusting landing by ±1 tile (reveals owners and rents).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">3</div>' +
                '            <div><strong>Tile Action:</strong> Buy unowned estate / pay rent to owner / train with a master / duel rival knight on tile / attend festival or purchase gear at merchant.</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">4</div>' +
                '            <div><strong>End of Turn:</strong> Play tactical scrolls from pouch (capacity 3/3), manage active gear in backpack, pass turn to next knight.</div>' +
                '          </div>' +
                '        </div>' +
                '      </div>' +

                // Box 2: 4 Virtues
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>⚔️</span> 4 VIRTUES, MASTERS &amp; DUELS</div>' +
                '        <div style="font-size:0.75rem; margin-bottom:0.35rem;">' +
                '          <strong>⚔️ Combat:</strong> weapons, dragon beasts, duels • <strong>🏇 Riding:</strong> speed, race speed<br/>' +
                '          <strong>💃 Dance:</strong> court ball, agility • <strong>✨ Charisma:</strong> audience, heart multiplier 💖' +
                '        </div>' +
                '        <div style="font-size:0.73rem; background:rgba(212,175,55,0.08); padding:0.35rem 0.5rem; border-radius:5px; border:1px solid rgba(212,175,55,0.2);">' +
                '          <strong>🎓 Master Training:</strong> Fee 1k / 2k / 3k / 4k / 5k g. Practice roll <strong>4, 5, 6</strong> succeeds (+1 rank). Grandmaster grants <strong>+1.5 💖</strong> and 1,500 g.<br/>' +
                '          <strong>⚔️ Knight Duel on Tile:</strong> Landing on a rival\'s tile allows challenging them: Knight Power + 1d6. Victory = loot gold or <strong>+1 💖</strong>!' +
                '        </div>' +
                '      </div>' +

                // Box 3: Pouch & Scrolls
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎒</span> POUCH &amp; SCROLLS (MAX 3 PCS)</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚡ Lightning Speed:</strong> Dice roll is automatically 6 (or +3 to landing).</div>' +
                '          <div><strong>🕊️ Royal Amnesty:</strong> Pay no rent on rival tile / rescue from Infirmary.</div>' +
                '          <div><strong>🦁 Lion\'s Might:</strong> +3 combat power in any battle or duel.</div>' +
                '          <div><strong>🐑 Golden Fleece:</strong> Doubles tax collection at Start or rent from rival.</div>' +
                '          <div><strong>🍀 Lady Luck:</strong> Re-roll any unfavorable dice.</div>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // end left col

                // RIGHT COLUMN
                '    <div class="cs-col">' +

                // Box 4: Price list
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🏰</span> ESTATE PRICE LIST &amp; NOBLE BREEDING</div>' +
                '        <table class="cs-table">' +
                '          <thead>' +
                '            <tr><th>Estate Type</th><th>Buy Price</th><th>Tax</th><th>Rent/Toll</th><th>Bonus</th></tr>' +
                '          </thead>' +
                '          <tbody>' +
                '            <tr><td><strong>🦅 Falcon (1–4)</strong></td><td>400–1,600 g.</td><td>—</td><td>20/40/80 %</td><td><strong>+4.0 💖</strong>, ±1 navigation</td></tr>' +
                '            <tr><td><strong>🐕 Dog (1–4)</strong></td><td>500–2,000 g.</td><td>—</td><td>20/40/80 %</td><td><strong>+2.5 💖</strong>, defense</td></tr>' +
                '            <tr><td><strong>🐎 Horse (1–4)</strong></td><td>600–2,400 g.</td><td>—</td><td>20/40/80 %</td><td><strong>+1.5 💖</strong>, Trot/Gallop</td></tr>' +
                '            <tr><td><strong>🏡 Village 1★</strong></td><td>2,000 g.</td><td>500 g.</td><td>300 g.</td><td>Breeding: max 3 beasts</td></tr>' +
                '            <tr><td><strong>🏡 Village 2★/3★</strong></td><td>+1.5k / +1.5k</td><td>900/1400</td><td>500/800</td><td>Higher yields</td></tr>' +
                '            <tr><td><strong>🏛️ Town</strong></td><td>4,500 g.</td><td>1,200 g.</td><td>700 g.</td><td>Breeding: max 2 beasts</td></tr>' +
                '            <tr><td><strong>🏰 Castle</strong></td><td>8,000 g.</td><td>2,500 g.</td><td>1,500 g.</td><td><strong>+1 ✨ Charisma</strong></td></tr>' +
                '            <tr><td><strong>⚒️ Crafts/Guilds</strong></td><td>2.5k–3.0k</td><td>600–800</td><td>350–400</td><td>Smithy/Stables/Tailor</td></tr>' +
                '          </tbody>' +
                '        </table>' +
                '        <div style="font-size:0.7rem; color:#fde047; margin-top:0.35rem;">' +
                '          🌾 <strong>Livestock:</strong> 🐑 Sheep (500 g., tax +120, rent +50) • 🐖 Pig (600 g., tax +150, rent +75) • 🐄 Cow (800 g., tax +200, rent +100)' +
                '        </div>' +
                '      </div>' +

                // Box 5: Festivals & Dragons
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎪</span> FESTIVALS, AUDIENCE &amp; DRAGON QUESTS</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚔️ Tournament:</strong> Combat + Riding + 1d6. Prize: 1,500 / 800 / 400 g. + 💖 hearts.</div>' +
                '          <div><strong>💃 Court Ball:</strong> Dance + Charisma + 1d6 (Dress +2). Prize: 1,500 / 800 / 400 g. + 💖.</div>' +
                '          <div><strong>🏇 Royal Steed Race:</strong> 2× Riding + 1d6 (+1 per horse). Prizes: up to 1,500 g. + 💖.</div>' +
                '          <div><strong>🐉 Dragon Hunt:</strong> U1 (diff 6–8), U2 (9–11), U3 (12–14). <strong>2 dragons = victory!</strong></div>' +
                '          <div><strong>🏥 Infirmary:</strong> Treat wounds for 500 g. or roll 5–6 when resting (skip turn).</div>' +
                '          <div><strong>💸 Bankruptcy:</strong> Sell gear at 50–70%, King waives debt in exchange for 💖 hearts.</div>' +
                '        </div>' +
                '      </div>' +

                // Box 6: Shortcuts
                '      <div class="cs-box" style="padding:0.45rem 0.65rem;">' +
                '        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.71rem; color:var(--text-muted);">' +
                '          <span>⌨️ <strong>Hotkeys:</strong> [Space] Roll/Move • [T] Cheatsheet • [B] Pouch • [M] Music • [Esc] Close</span>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // end right col

                '  </div>' + // end cs-grid

                '  <div class="cs-footer">KiDesky: The Princess\'s Heart © 2026 • 1-Page A4 Pocket Rules Cheatsheet • ekobio.org/apps/KiDesky</div>' +
                '</div>'; // end cs-page-1

            // ====================================================================
            // PAGE 2: EXTENDED LEXICON (ENGLISH)
            // ====================================================================
            if (is2Page) {
                html += '<div class="cs-page cs-page-2">' +
                    '  <div class="cs-header">' +
                    '    <h2 class="cs-header-title">🛡️ REFERENCE GUIDE • ARMORY &amp; BESTIARY</h2>' +
                    '    <div class="cs-header-sub">Beast weaknesses, armory gear, trophies, and cartographic legend</div>' +
                    '  </div>' +

                    '  <div class="cs-grid">' +

                    // LEFT COL PAGE 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🐉</span> BEAST WEAKNESSES IN COMBAT (+2 POWER)</div>' +
                    '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.35rem;">' +
                    '          <div><strong>🛡️ Plate Armor:</strong> Deflects crushing blows from heavy brute monsters (<em>Black Knight, Clay Golem, Stone Giant, Cyclops</em>).</div>' +
                    '          <div><strong>🗡️ Lance / Spear:</strong> Pierces armored hides and airborne dives (<em>Cliff Harpy, Forest Griffin, Manticore</em>).</div>' +
                    '          <div><strong>💧 Water / Frost:</strong> Extinguishes fiery beasts (<em>Lava Lizard, Fire Drake, Volcanic Serpent</em>).</div>' +
                    '          <div><strong>🔥 Fire / Flame:</strong> Melts frozen tissues of northern monsters (<em>Frost Wraith, Polar Dragon, Ice Wurm</em>).</div>' +
                    '          <div><strong>✨ Holy Relics:</strong> Consecrated light scorches dark and undead fiends (<em>Undead Lord, Shadow Dragon, Forest Apparition</em>).</div>' +
                    '          <div><strong>💃 Dance &amp; Jewels:</strong> Noble grace entrances gemstone creatures (<em>Ruby Dragon, Sacred Golden Stag</em>).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🏆</span> UNIQUE HUNTING TROPHIES</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.3rem;">' +
                    '          <div><strong>🪶 Harpy Razor Talon:</strong> +3 ⚔️ Combat, +2 🏇 Riding, +1 💃 Dance (7,500 g.)</div>' +
                    '          <div><strong>🗿 Clay Golem Core:</strong> +4 ⚔️ Combat, +3 ✨ Charisma, -2 💃 Dance (8,200 g.)</div>' +
                    '          <div><strong>🐺 Silver-Forged Alpha Fang:</strong> +4 ⚔️ Combat, +2 🏇 Riding, +1 ✨ Charisma (8,500 g.)</div>' +
                    '          <div><strong>🐙 Deep Sea Kraken Tentacle:</strong> +4 ⚔️ Combat, +2 🏇 Riding, +3 ✨ Charisma (9,000 g.)</div>' +
                    '          <div><strong>🩸 Manticore Stinger:</strong> +4 ⚔️ Combat, +3 🏇 Riding, +1 ✨ Charisma (9,500 g.)</div>' +
                    '          <div><strong>💀 Crown of the Undead Lord:</strong> +5 ⚔️ Combat, +4 ✨ Charisma (11,000 g.)</div>' +
                    '          <div><strong>💎 Ruby Dragon Heart:</strong> +5 ⚔️ Combat, +3 💃 Dance, +4 ✨ Charisma (14,000 g.)</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // end left col page 2

                    // RIGHT COL PAGE 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🛒</span> MERCHANT ARMORY &amp; GEAR</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                    '          <div><strong>🗡️ Weapons:</strong> Short Dagger (+1⚔️, 1.2k) • Broadsword (+2⚔️, 2.5k) • Knight\'s Halberd (+3⚔️, 4.5k) • Runed Blade (+4⚔️ +1🏇, 7k) • Sacred Excalibur (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>🛡️ Armor:</strong> Leather Armor (+1⚔️ +1🏇, 2k) • Chainmail (+2⚔️, 3k) • Full Plate (+3⚔️, 4.5k) • Silver Shield (+4⚔️ +2🏇 +1✨, 7k) • Dragonscale Armor (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>👗 Dresses &amp; Robes:</strong> Buckler &amp; Velvet (+2💃, 2.5k) • Silk Gown (+3💃, 4.5k) • Gold-Woven Raiment (+4💃 +2✨, 7k).</div>' +
                    '          <div><strong>💍 Jewelry:</strong> Ring of Courage (+1✨, 2k) • Amulet of Wisdom (+2✨, 4k) • Diamond Necklace (+3✨ +1💃, 7k).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🗺️</span> CARTOGRAPHIC LEGEND &amp; CODES</div>' +
                    '        <div style="font-size:0.71rem; display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">' +
                    '          <div><code>START</code> Realm Starting Gate</div>' +
                    '          <div><code>SHOP</code> Armory &amp; Market</div>' +
                    '          <div><code>MB, MJ</code> Master of Combat, Riding</div>' +
                    '          <div><code>MT, MCH</code> Master of Dance, Charisma</div>' +
                    '          <div><code>V1–V10</code> Villages (upgrades 1–3★)</div>' +
                    '          <div><code>M1–M5</code> Royal Fortified Towns</div>' +
                    '          <div><code>H1–H2</code> Stronghold Castles (+1✨)</div>' +
                    '          <div><code>S1–S4</code> Noble Falcons (+4💖)</div>' +
                    '          <div><code>P1–P4</code> Hunting Hounds (+2.5💖)</div>' +
                    '          <div><code>K1–K4</code> Noble Steeds (+1.5💖)</div>' +
                    '          <div><code>U1–U3</code> Monster &amp; Dragon Lairs</div>' +
                    '          <div><code>CHANCE</code> Fortune Chest &amp; Scrolls</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // end right col page 2

                    '  </div>' + // end cs-grid page 2

                    '  <div class="cs-footer">KiDesky: The Princess\'s Heart © 2026 • Full Reference Manual (Page 2/2)</div>' +
                    '</div>'; // end cs-page-2
            }
        } else {
            // ====================================================================
            // STRANA 1: HLAVNÍ TAHÁK DO KAPSY (ČEŠTINA)
            // ====================================================================
            html += '<div class="cs-page cs-page-1">' +
                '  <div class="cs-header">' +
                '    <h2 class="cs-header-title">👑 PRINCEZNINO SRDCE • RYCHLÝ TAHÁK DO KAPSY</h2>' +
                '    <div class="cs-header-sub">Autorská strategická &amp; RPG desková hra • Referenční příručka na herní stůl</div>' +
                '    <div class="cs-meta-bar">' +
                '      <span class="cs-pill">🎯 Cíl: 30 💖 Srdcí Princezny NEBO 2 skolené saně 🐉</span>' +
                '      <span class="cs-pill">💰 Start: 10 000 zl.</span>' +
                '      <span class="cs-pill">🏁 START: +3 000 zl. (+5 000 zl. bez panství)</span>' +
                '    </div>' +
                '  </div>' +

                '  <div class="cs-grid">' +

                // LEVÝ SLOUPEC
                '    <div class="cs-col">' +

                // Box 1: Smyčka tahu
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🔄</span> SMYČKA TAHU VE 4 KROCÍCH</div>' +
                '        <div class="cs-step-list">' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">1</div>' +
                '            <div><strong>Hod kostkou &amp; Chůze:</strong> Standard 1d6 (1–6). <em>Opatrný krok</em> (1–4 políčka). 🐎 Na koni: <em>Klus</em> (+1), <em>Cval</em> (+2, Jízda ≥ 2), <em>Trysk</em> (2d6, Jízda ≥ 4 + kůň).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">2</div>' +
                '            <div><strong>Rozcestí &amp; Sokol:</strong> Hod 1–3 odbočka vlevo/nahoru, 4–6 rovně/vpravo. 🦅 <em>Sokolí navigace</em> (chov sokolů) umožní upravit dopad o ±1 pole (odhalí vlastníky a nájmy).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">3</div>' +
                '            <div><strong>Akce pole:</strong> Nákup volného panství / platba nájmu majiteli / výcvik u mistra / souboj s rytířem na poli / účast na slavnosti či nákup na trhu.</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">4</div>' +
                '            <div><strong>Konec tahu:</strong> Zahrání pergamenů z brašny (kapacita 3/3), správa aktivní výstroje v batohu, předání tahu dalšímu hráči.</div>' +
                '          </div>' +
                '        </div>' +
                '      </div>' +

                // Box 2: Čtyři ctnosti
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>⚔️</span> 4 CTNOSTI, MISTŘI &amp; DUELY</div>' +
                '        <div style="font-size:0.75rem; margin-bottom:0.35rem;">' +
                '          <strong>⚔️ Boj:</strong> zbraně, dračí stvůry, duely • <strong>🏇 Jízda:</strong> rychlost, dostihy<br/>' +
                '          <strong>💃 Tanec:</strong> dvorský bál, obratnost • <strong>✨ Charisma:</strong> audience, násobič zisku 💖' +
                '        </div>' +
                '        <div style="font-size:0.73rem; background:rgba(212,175,55,0.08); padding:0.35rem 0.5rem; border-radius:5px; border:1px solid rgba(212,175,55,0.2);">' +
                '          <strong>🎓 Výcvik u Mistra:</strong> Poplatek 1k / 2k / 3k / 4k / 5k zl. Cvičný hod <strong>4, 5, 6</strong> uspěje (+1 stupeň). Velmistr dá <strong>+1,5 💖</strong> a 1 500 zl.<br/>' +
                '          <strong>⚔️ Duel rytířů na poli:</strong> Vstoupíš-li na pole soupeře, můžeš ho vyzvat: Síla rytíře + 1d6. Výhra = zisk zlata nebo <strong>+1 💖</strong>!' +
                '        </div>' +
                '      </div>' +

                // Box 3: Pergameny
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎒</span> BRAŠNA &amp; PERGAMENY (MAX 3 KS)</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚡ Blesková rychlost:</strong> Hod kostkou je automaticky 6 (nebo +3 k doskoku).</div>' +
                '          <div><strong>🕊️ Královská amnestie:</strong> Neplatíš nájem na poli soupeře / záchrana ze Špitálu.</div>' +
                '          <div><strong>🦁 Síla lva:</strong> +3 k bojové síle v libovolném souboji či duelu.</div>' +
                '          <div><strong>🐑 Zlaté rouno:</strong> Zdvojnásobí výběr daní na Startu nebo nájemné od soupeře.</div>' +
                '          <div><strong>🍀 Přízeň štěstěny:</strong> Možnost přehodit jakoukoliv nepříznivou kostku.</div>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // konec levého sloupce

                // PRAVÝ SLOUPEC
                '    <div class="cs-col">' +

                // Box 4: Ceník
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🏰</span> CENÍK PANSTVÍ A ŠLECHTIČTÍ CHOVANCI</div>' +
                '        <table class="cs-table">' +
                '          <thead>' +
                '            <tr><th>Typ panství</th><th>Cena nákupu</th><th>Daň</th><th>Mýtné/Nájem</th><th>Bonus</th></tr>' +
                '          </thead>' +
                '          <tbody>' +
                '            <tr><td><strong>🦅 Sokol (1–4)</strong></td><td>400–1 600 zl.</td><td>—</td><td>20/40/80 %</td><td><strong>+4,0 💖</strong>, navigace ±1</td></tr>' +
                '            <tr><td><strong>🐕 Pes (1–4)</strong></td><td>500–2 000 zl.</td><td>—</td><td>20/40/80 %</td><td><strong>+2,5 💖</strong>, obrana</td></tr>' +
                '            <tr><td><strong>🐎 Kůň (1–4)</strong></td><td>600–2 400 zl.</td><td>—</td><td>20/40/80 %</td><td><strong>+1,5 💖</strong>, Klus/Trysk</td></tr>' +
                '            <tr><td><strong>🏡 Vesnice 1★</strong></td><td>2 000 zl.</td><td>500 zl.</td><td>300 zl.</td><td>Chov: max 3 zvířata</td></tr>' +
                '            <tr><td><strong>🏡 Vesnice 2★/3★</strong></td><td>+1.5k / +1.5k</td><td>900/1400</td><td>500/800</td><td>Vyšší výnosy</td></tr>' +
                '            <tr><td><strong>🏛️ Město</strong></td><td>4 500 zl.</td><td>1 200 zl.</td><td>700 zl.</td><td>Chov: max 2 zvířata</td></tr>' +
                '            <tr><td><strong>🏰 Hrad</strong></td><td>8 000 zl.</td><td>2 500 zl.</td><td>1 500 zl.</td><td><strong>+1 ✨ Charisma</strong></td></tr>' +
                '            <tr><td><strong>⚒️ Živnosti</strong></td><td>2.5k–3.0k</td><td>600–800</td><td>350–400</td><td>Kovárna/Stáje/Krejčí</td></tr>' +
                '          </tbody>' +
                '        </table>' +
                '        <div style="font-size:0.7rem; color:#fde047; margin-top:0.35rem;">' +
                '          🌾 <strong>Hospodářský chov:</strong> 🐑 Ovce (500 zl., daň +120, nájem +50) • 🐖 Prase (600 zl., daň +150, nájem +75) • 🐄 Kráva (800 zl., daň +200, nájem +100)' +
                '        </div>' +
                '      </div>' +

                // Box 5: Slavnosti a Draci
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎪</span> SLAVNOSTI, AUDIENCE &amp; DRAČÍ VÝZVY</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚔️ Turnaj:</strong> Boj + Jízda + 1d6. Výhra: 1 500 / 800 / 400 zl. + 💖 srdce.</div>' +
                '          <div><strong>💃 Dvorský bál:</strong> Tanec + Charisma + 1d6 (Šaty +2). Výhra: 1 500 / 800 / 400 zl. + 💖.</div>' +
                '          <div><strong>🏇 Královské dostihy:</strong> 2× Jízda + 1d6 (+1 za každého koně). Ceny: až 1 500 zl. + 💖.</div>' +
                '          <div><strong>🐉 Lov draků:</strong> U1 (obtížnost 6–8), U2 (9–11), U3 (12–14). <strong>2 draci = výhra!</strong></div>' +
                '          <div><strong>🏥 Špitál:</strong> Ošetření za 500 zl. nebo hod 5–6 při čekání (vynechání tahu).</div>' +
                '          <div><strong>💸 Bankrot:</strong> Prodej za 50–70 %, král dluh odpustí za cenu ztráty 💖 srdcí.</div>' +
                '        </div>' +
                '      </div>' +

                // Box 6: Zkratky
                '      <div class="cs-box" style="padding:0.45rem 0.65rem;">' +
                '        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.71rem; color:var(--text-muted);">' +
                '          <span>⌨️ <strong>Klávesy:</strong> [Mezerník] Hod/Tah • [T] Tahák • [B] Brašna • [M] Hudba • [Esc] Zavřít</span>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // konec pravého sloupce

                '  </div>' + // konec cs-grid

                '  <div class="cs-footer">KiDesky: Princeznino srdce © 2026 • Rychlý tahák pravidel na 1 list A4 • ekobio.org/apps/KiDesky</div>' +
                '</div>'; // konec cs-page-1

            // ====================================================================
            // STRANA 2: ROZŠÍŘENÝ LEXIKON (VOLITELNÁ DRUHÁ STRANA A4 - ČEŠTINA)
            // ====================================================================
            if (is2Page) {
                html += '<div class="cs-page cs-page-2">' +
                    '  <div class="cs-header">' +
                    '    <h2 class="cs-header-title">🛡️ REFERENČNÍ PŘÍRUČKA • VÝZBROJ &amp; BESTIÁŘ</h2>' +
                    '    <div class="cs-header-sub">Slabiny nestvůr, zbrojnice, trofeje a kartografická legenda</div>' +
                    '  </div>' +

                    '  <div class="cs-grid">' +

                    // LEVÝ SLOUPEC STRANY 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🐉</span> SLABINY BESTIÍ V BOJI (+2 K SÍLE)</div>' +
                    '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.35rem;">' +
                    '          <div><strong>🛡️ Plátová zbroj:</strong> Odrazí drtivé údery tupých a těžkých monster (<em>Černý rytíř, Hliněný Golem, Skalní obr, Kyklop</em>).</div>' +
                    '          <div><strong>🗡️ Dřevce / Kopí:</strong> Prokláto klenuté tělo a útok ze vzduchu (<em>Skalní krvežíznivá Harpyje, Lesní Gryf, Mantikora</em>).</div>' +
                    '          <div><strong>💧 Voda / Chlad:</strong> Uhasí žár a oslabí plamenné netvory (<em>Lávový ještěr, Ohnivý drak, Sopečná saň</em>).</div>' +
                    '          <div><strong>🔥 Oheň / Žár:</strong> Roztaví zmrzlé tkáně severských monster (<em>Mrazivý přízrak, Polární drak, Ledový červ</em>).</div>' +
                    '          <div><strong>✨ Svaté relikvie:</strong> Posvěcené světlo spálí temná a hnilobná stvoření (<em>Nemrtvý pán, Stínový drak, Přízrak hvozdu</em>).</div>' +
                    '          <div><strong>💃 Tanec &amp; Klenoty:</strong> Vznešený dojem dojme drahokamové bytosti (<em>Rubínový drak, Zlatý posvátný jelen</em>).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🏆</span> PŘEHLED UNIKÁTNÍCH TROFEJÍ Z LOVU</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.3rem;">' +
                    '          <div><strong>🪶 Ostrý pařát skalní harpyje:</strong> +3 ⚔️ Boj, +2 🏇 Jízda, +1 💃 Tanec (cena 7 500 zl.)</div>' +
                    '          <div><strong>🗿 Šém hliněného Golema:</strong> +4 ⚔️ Boj, +3 ✨ Charisma, -2 💃 Tanec (cena 8 200 zl.)</div>' +
                    '          <div><strong>🐺 Stříbrem kovaný tesák Alfy:</strong> +4 ⚔️ Boj, +2 🏇 Jízda, +1 ✨ Charisma (cena 8 500 zl.)</div>' +
                    '          <div><strong>🐙 Chapadlo z mořských hlubin:</strong> +4 ⚔️ Boj, +2 🏇 Jízda, +3 ✨ Charisma (cena 9 000 zl.)</div>' +
                    '          <div><strong>🩸 Bodák pouštní mantikory:</strong> +4 ⚔️ Boj, +3 🏇 Jízda, +1 ✨ Charisma (cena 9 500 zl.)</div>' +
                    '          <div><strong>💀 Koruna Nemrtvého pána:</strong> +5 ⚔️ Boj, +4 ✨ Charisma (cena 11 000 zl.)</div>' +
                    '          <div><strong>💎 Planoucí srdce Rubínového draka:</strong> +5 ⚔️ Boj, +3 💃 Tanec, +4 ✨ Charisma (cena 14 000 zl.)</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // konec levého sloupce strany 2

                    // PRAVÝ SLOUPEC STRANY 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🛒</span> ARSENÁL ZBROJNICE &amp; VÝBAVA</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                    '          <div><strong>🗡️ Zbraně:</strong> Lovecká dýka (+1⚔️, 1.2k) • Široký meč (+2⚔️, 2.5k) • Rytířská halapartna (+3⚔️, 4.5k) • Runová čepel (+4⚔️ +1🏇, 7k) • Posvátná čepel (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>🛡️ Zbroje:</strong> Kožená zbroj (+1⚔️ +1🏇, 2k) • Kroužková košile (+2⚔️, 3k) • Plátová zbroj (+3⚔️, 4.5k) • Stříbrný erbovní štít (+4⚔️ +2🏇 +1✨, 7k) • Dračí brnění (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>👗 Šaty &amp; Róby:</strong> Pukléř &amp; samet (+2💃, 2.5k) • Hedvábná róba (+3💃, 4.5k) • Zlatotkané roucho (+4💃 +2✨, 7k).</div>' +
                    '          <div><strong>💍 Klenoty:</strong> Prsten odvahy (+1✨, 2k) • Amulet moudrosti (+2✨, 4k) • Diamantový náhrdelník (+3✨ +1💃, 7k).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🗺️</span> KARTOGRAFICKÉ ZKRATKY &amp; LEGENDA</div>' +
                    '        <div style="font-size:0.71rem; display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">' +
                    '          <div><code>START</code> Startovní brána království</div>' +
                    '          <div><code>OBCHOD</code> Zbrojnice &amp; výkup bance</div>' +
                    '          <div><code>MB, MJ</code> Mistr Boje, Mistr Jízdy</div>' +
                    '          <div><code>MT, MCH</code> Mistr Tance, Mistr Charismatu</div>' +
                    '          <div><code>V1–V10</code> Vesnice (povyšování 1–3★)</div>' +
                    '          <div><code>M1–M5</code> Královská města</div>' +
                    '          <div><code>H1–H2</code> Majestátní hrady (+1✨)</div>' +
                    '          <div><code>S1–S4</code> Šlechtičtí sokoli (+4💖)</div>' +
                    '          <div><code>P1–P4</code> Lovečtí psi (+2.5💖)</div>' +
                    '          <div><code>K1–K4</code> Ušlechtilí koně (+1.5💖)</div>' +
                    '          <div><code>U1–U3</code> Doupata nestvůr a draků</div>' +
                    '          <div><code>NÁHODA</code> Královská truhla &amp; Pergameny</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // konec pravého sloupce strany 2

                    '  </div>' + // konec cs-grid strany 2

                    '  <div class="cs-footer">KiDesky: Princeznino srdce © 2026 • Kompletní referenční příručka (Strana 2/2)</div>' +
                    '</div>'; // konec cs-page-2
            }
        }

        html += '</div>'; // konec cs-container

        body.innerHTML = html;
    },

    });
})();
