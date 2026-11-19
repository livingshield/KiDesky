// ============================================================================
// KiDesky: Princeznino srdce - Horní HUD hráčů, Postranní inspektor, Stupnice Srdcí a Sál Slávy
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    // ========================================================================

    // INTERAKTIVNÍ ZOOM A POSOUVÁNÍ MAPY (PAN & ZOOM)

    // ========================================================================,

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

        var isEnEndless = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var tHudE = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

        var bannerTitle = tHudE("hud.endless_banner_title", {
            color: winColor,
            name: this.escapeHtml(winName),
            round: winRound
        }, '🏆 ' + (isEnEndless ? 'GAME FINISHED • WINNER: ' : 'HRA JE DOHRÁNA • VÍTĚZ: ') + '<strong style="color:' + winColor + ';">' + this.escapeHtml(winName) + '</strong> (' + (isEnEndless ? 'Round ' + winRound : winRound + '. kolo') + ')!');

        var bannerDesc = tHudE("hud.endless_banner_desc", null, isEnEndless ?
            '♾️ <em>Endless free play mode: continue building, breeding, and completing remaining goals for the joy of the game.</em>' :
            '♾️ <em>Režim nekonečné volné hry: pokračuješ ve stavění, chovu a plnění zbývajících cílů pro radost ze hry.</em>');

        var btnRes = tHudE("hud.endless_banner_results", null, isEnEndless ? "🏆 Results &amp; Hall of Fame" : "🏆 Výsledky &amp; Síň slávy");
        var btnResTitle = tHudE("hud.endless_banner_results_title", null, isEnEndless ? "View victory table and game statistics" : "Zobrazit slavnostní tabulku a statistiky vítězství");
        var btnNew = tHudE("hud.endless_banner_new_game", null, isEnEndless ? "🔄 New Game" : "🔄 Nová partie");
        var btnNewTitle = tHudE("hud.endless_banner_new_game_title", null, isEnEndless ? "Start a new match from the beginning" : "Začít novou partii od začátku");

        banner.innerHTML =
            '<div style="display:flex; align-items:center; gap:0.65rem;">' +
            '  <span style="font-size:1.5rem; filter:drop-shadow(0 0 6px rgba(234,179,8,0.7));">👑</span>' +
            '  <div>' +
            '    <div style="color:var(--gold-light); font-size:0.95rem; font-weight:700; font-family:\'Cinzel\',serif;">' +
            '      ' + bannerTitle +
            '    </div>' +
            '    <div style="font-size:0.77rem; color:#fde68a; margin-top:2px;">' +
            '      ' + bannerDesc +
            '    </div>' +
            '  </div>' +
            '</div>' +
            '<div style="display:flex; gap:0.45rem; align-items:center;">' +
            '  <button type="button" class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.75rem; border-color:var(--gold); color:var(--gold-light); font-weight:700;" onclick="PRS_App.openVictoryModal()" title="' + btnResTitle + '">' + btnRes + '</button>' +
            '  <button type="button" class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.75rem;" onclick="PRS_App.startNewGame(true)" title="' + btnNewTitle + '">' + btnNew + '</button>' +
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
            '        <button class="btn-help-bubble" onclick="PRS_App.openTileHelp(\'' + (node.type || '') + '\', \'' + (node.code || '') + '\')" title="' + (isEn ? "Read rules and tips for this tile in the Codex" : "Přečíst pravidla a tipy k tomuto poli v Kodexu") + '">' + (isEn ? "❓ Help" : "❓ Nápověda") + '</button>' +
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

    
    activePlayerTab: "none",

     // "none" | "items" | "fiefs",

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
    }
    });
})();
