// ============================================================================
// KiDesky: Princeznino srdce - Grafika prostředí, Vítězný ceremoniál a Královský diplom
// ============================================================================

(function () {
    "use strict";
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
                        this.awardCredits(creditsEarned, isHumanWinner ? tModal("modals.endgame.credit_triumph", null, "Královský triumf") : tModal("modals.endgame.credit_participation", null, "Účast v turnaji"), isHumanWinner);
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

            var epilogueKey = "story.epilogue_virtues";
            var winnerDragons = (winner.stats && winner.stats.dragonsSlain) ? winner.stats.dragonsSlain : 0;
            var winnerCastles = 0;
            if (winner.ownedNodes && this.state.board && this.state.board.nodes) {
                for (var wi = 0; wi < winner.ownedNodes.length; wi++) {
                    var wnd = this.state.board.nodes[winner.ownedNodes[wi]];
                    if (wnd && (wnd.level === 3 || wnd.type === "CASTLE")) winnerCastles++;
                }
            }
            if (winType === "slayer_dragons" || winnerDragons > 0) {
                epilogueKey = "story.epilogue_dragon";
            } else if (winType === "tycoon_estates" || winnerCastles >= 2) {
                epilogueKey = "story.epilogue_estates";
            }
            subText += '<div class="victory-epilogue-box"><strong>' + tModal("story.epilogue_title", null, "📜 Kronika konce výpravy:") + '</strong>' + tModal(epilogueKey, null, "") + '</div>';

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
        var tToast = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var winName = winP ? winP.name : tToast("modals.endgame.default_winner_name", null, "Vítěz");

        if (this.showToast) {
            var msgToast = tToast("modals.endgame.endless_toast", { name: winName }, "♾️ Nekonečná hra zahájena! Oficiální vítěz: " + winName + ". Můžeš dál volně hrát a rozvíjet panství.");
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

        PRS_Api.post("save-session", payload)
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
        } catch (e) { console.warn("[Modals] Invalid prs_game_history JSON:", e); }

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
            } catch (e) { console.warn("[Modals] Invalid prs_game_history diploma JSON:", e); }
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
    }
    });
})();
