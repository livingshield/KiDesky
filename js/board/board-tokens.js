// ============================================================================
// KiDesky: Princeznino srdce - Žetony hráčů, interakce uzlů, tooltipy, toasty a balíčky karet
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    renderBoardTokens: function () {

        var tokensLayer = document.getElementById("prs-tokens-layer");

        if (!tokensLayer || !this.state) return;

        tokensLayer.innerHTML = this.renderBoardTokensHTML();

    },

    
    renderBoardTokensHTML: function () {

        var nodes = this.state.board.nodes;

        var out = [];

        var activePlayer = (this.state.players && this.state.players[this.state.currentPlayerIndex]) ? this.state.players[this.state.currentPlayerIndex] : null;

        var activeNodeId = activePlayer ? activePlayer.nodeId : null;

        // 1. Zvýraznění vybraného / zkoumaného políčka (Inspected Node Halo)

        if (this.selectedNodeId !== null && this.selectedNodeId !== undefined && this.selectedNodeId !== activeNodeId) {

            var selNode = nodes[this.selectedNodeId];

            if (selNode) {

                var selMajor = (selNode.type === "START" || selNode.type === "FESTIVAL" || selNode.type === "CASTLE" || (selNode.type === "QUEST" && selNode.subtype === "U3"));

                var selR = selMajor ? 21 : 16.5;

                out.push('  <g class="inspected-tile-halo" style="pointer-events:none;">');

                out.push('    <circle cx="' + selNode.x + '" cy="' + selNode.y + '" r="' + (selR + 5.5) + '" fill="none" stroke="#38bdf8" stroke-width="3.2" stroke-dasharray="4,2"/>');

                out.push('  </g>');

            }

        }

        // 2. Pulzující zlatý lem a štítek "ZDE STOJÍŠ" pro políčko aktivního hráče

        if (activePlayer) {

            var standNode = nodes[activePlayer.nodeId];

            if (standNode) {

                var standMajor = (standNode.type === "START" || standNode.type === "FESTIVAL" || standNode.type === "CASTLE" || (standNode.type === "QUEST" && standNode.subtype === "U3"));

                var standR = standMajor ? 21 : 16.5;

                out.push('  <g class="active-standing-marker" style="pointer-events:none;">');

                out.push('    <circle cx="' + standNode.x + '" cy="' + standNode.y + '" r="' + (standR + 7.5) + '" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5,3" opacity="0.95">');

                out.push('      <animateTransform attributeName="transform" type="rotate" from="0 ' + standNode.x + ' ' + standNode.y + '" to="360 ' + standNode.x + ' ' + standNode.y + '" dur="12s" repeatCount="indefinite"/>');

                out.push('    </circle>');

                out.push('    <circle cx="' + standNode.x + '" cy="' + standNode.y + '" r="' + (standR + 4) + '" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.9"/>');

                out.push('    <g transform="translate(' + standNode.x + ',' + (standNode.y - standR - 15) + ')">');

                out.push('      <rect x="-24" y="-12" width="48" height="15" rx="5" fill="#b45309" stroke="#fbbf24" stroke-width="1.2"/>');

                var standingLabel = (window.PRS_I18n && window.PRS_I18n.t) ? window.PRS_I18n.t("board.standing_here", null, "ZDE STOJÍŠ") : "ZDE STOJÍŠ";
                out.push('      <text x="0" y="-1" text-anchor="middle" fill="#fff" font-size="8.5" font-weight="bold">' + standingLabel + '</text>');

                out.push('      <polygon points="-4,3 0,7 4,3" fill="#fbbf24"/>');

                out.push('    </g>');

                out.push('  </g>');

            }

        }

        // 2b. Taktický náhled dosahu kostky při fázi ROLL (Reachable Nodes & Našeptávač)
        if (this.state.phase === "ROLL" && activePlayer && activePlayer.nodeId !== null && activePlayer.nodeId !== undefined) {
            var curMode = this.selectedMovementMode || (activePlayer && activePlayer.movementMode) || "standard";
            var diceLimit = (curMode === "cautious") ? 4 : 6;
            var reachableMap = {};
            for (var dr = 1; dr <= diceLimit; dr++) {
                var tNode = (window.PRS_GameEngine && window.PRS_GameEngine.getTargetNodeForRoll)
                    ? window.PRS_GameEngine.getTargetNodeForRoll(this.state, activePlayer, dr)
                    : null;
                if (tNode) {
                    if (!reachableMap[tNode.id]) reachableMap[tNode.id] = [];
                    reachableMap[tNode.id].push(dr);
                }
            }
            for (var rNid in reachableMap) {
                var targetN = nodes[Number(rNid)];
                if (!targetN) continue;
                var rollsStr = reachableMap[rNid].join(", ");
                var tR = (targetN.type === "START" || targetN.type === "FESTIVAL" || targetN.type === "CASTLE" || (targetN.type === "QUEST" && targetN.subtype === "U3")) ? 21 : 16.5;

                // Taktické hodnocení pole pro barevné odlišení:
                var haloColor = "#38bdf8"; // modrá neutrální
                var haloFill = "none";
                var haloBadgeIcon = "🎲";

                if (targetN.owner !== null && targetN.owner !== undefined && targetN.owner !== activePlayer.index) {
                    haloColor = "#ef4444"; // červená hrozba (cizí nájem)
                    haloFill = "rgba(239, 68, 68, 0.16)";
                    haloBadgeIcon = "💸";
                } else if (targetN.type === "PRISON") {
                    haloColor = "#f97316"; // oranžová
                    haloFill = "rgba(249, 115, 22, 0.16)";
                    haloBadgeIcon = "⛓️";
                } else if (targetN.owner === null || targetN.owner === undefined) {
                    if (targetN.type === "ANIMAL") {
                        haloColor = "#10b981"; // zelená příležitost
                        haloFill = "rgba(16, 185, 129, 0.18)";
                        haloBadgeIcon = "🐎";
                    } else if (targetN.type === "TOWN" || targetN.type === "CASTLE" || targetN.type === "VILLAGE") {
                        haloColor = "#fbbf24"; // zlatá příležitost
                        haloFill = "rgba(251, 191, 36, 0.20)";
                        haloBadgeIcon = "🏰";
                    } else if (targetN.type === "FESTIVAL") {
                        haloColor = "#ec4899"; // růžová slavnost
                        haloFill = "rgba(236, 72, 153, 0.18)";
                        haloBadgeIcon = "💖";
                    }
                }

                out.push('  <g class="dice-reach-preview" style="pointer-events:none;">');
                out.push('    <circle cx="' + targetN.x + '" cy="' + targetN.y + '" r="' + (tR + 5.5) + '" fill="' + haloFill + '" stroke="' + haloColor + '" stroke-width="2.4" stroke-dasharray="3,3" opacity="0.9"><animate attributeName="opacity" values="0.45;0.95;0.45" dur="1.6s" repeatCount="indefinite"/></circle>');
                out.push('    <g transform="translate(' + (targetN.x) + ',' + (targetN.y - tR - 9) + ')">');
                out.push('      <rect x="-18" y="-7.5" width="36" height="15" rx="4" fill="rgba(15,23,42,0.92)" stroke="' + haloColor + '" stroke-width="1.2"/>');
                out.push('      <text x="0" y="3.2" text-anchor="middle" fill="#fff" font-size="8" font-weight="bold">' + haloBadgeIcon + ' ' + rollsStr + '</text>');
                out.push('    </g>');
                out.push('  </g>');
            }
        }

        var playersByNode = {};

        for (var k = 0; k < this.state.players.length; k++) {

            var pl = this.state.players[k];

            // ELIMINOVANÝ HRÁČ: Jeho figurka se nesmí vykreslovat na hracím plánu ani na hřbitově
            if (pl.isEliminated) continue;

            if (!playersByNode[pl.nodeId]) playersByNode[pl.nodeId] = [];

            playersByNode[pl.nodeId].push(pl);

        }

        for (var nid in playersByNode) {

            var pList = playersByNode[nid];

            var hostNode = nodes[Number(nid)];

            if (!hostNode) continue;

            // Seřadíme figurky tak, aby aktivní hráč byl vykreslen jako poslední (v popředí a s plně viditelnou zlatou aurou)

            var actIdx = this.state.currentPlayerIndex;

            pList.sort(function (a, b) {

                if (a.index === actIdx) return 1;

                if (b.index === actIdx) return -1;

                return a.index - b.index;

            });

            var count = pList.length;

            for (var m = 0; m < count; m++) {

                var tokenPlayer = pList[m];

                var isAct = (tokenPlayer.index === actIdx);

                var isCurrentlyJumping = (this.isMoveAnimating && this.animatingPlayerIndex === tokenPlayer.index && this.animTokenPos);

                var txToken, tyToken, groundY;

                if (isCurrentlyJumping) {

                    txToken = this.animTokenPos.x;

                    tyToken = this.animTokenPos.y;

                    groundY = hostNode.y - 4;

                } else {

                    var dx = 0;

                    var dy = -16;

                    if (count === 1) {

                        dx = 0;

                        dy = -16;

                    } else if (count === 2) {

                        dx = (m === 0) ? -13.5 : 13.5;

                        dy = (m === 0) ? -17 : -15;

                    } else if (count === 3) {

                        if (m === 0) { dx = 0; dy = -25; }

                        else if (m === 1) { dx = -15; dy = -11; }

                        else { dx = 15; dy = -11; }

                    } else if (count === 4) {

                        if (m === 0) { dx = -14; dy = -24; }

                        else if (m === 1) { dx = 14; dy = -24; }

                        else if (m === 2) { dx = -14; dy = -8; }

                        else { dx = 14; dy = -8; }

                    } else {

                        var angle = (m / count) * Math.PI * 2;

                        dx = Math.cos(angle) * 20;

                        dy = -16 + Math.sin(angle) * 16;

                    }

                    txToken = Math.round(hostNode.x + dx);

                    tyToken = Math.round(hostNode.y + dy);

                    groundY = tyToken + 12;

                }

                out.push('  <g class="knight-token-group" data-player-index="' + tokenPlayer.index + '" style="pointer-events:auto; cursor:pointer;" ' +

                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + tokenPlayer.index + ')" ' +

                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                    'onclick="PRS_App.selectPlayerToInspect(' + tokenPlayer.index + ')">');

                out.push('    <title>' + this.escapeHtml(tokenPlayer.name) + ': ' + tokenPlayer.totalHearts + ' 💖 | ' + tokenPlayer.gold.toLocaleString("cs-CZ") + ' zl.</title>');

                // 1. Pozemní oválný stín pod figurkou

                var shadowRx = isCurrentlyJumping ? 7.0 : 10.5;

                var shadowRy = isCurrentlyJumping ? 3.0 : 4.5;

                out.push('    <ellipse cx="' + txToken + '" cy="' + groundY + '" rx="' + shadowRx + '" ry="' + shadowRy + '" fill="rgba(0,0,0,0.48)"/>');

                // 2. Rotující sluneční aura a královský ukazatel aktivního hráče

                if (isAct) {

                    out.push('    <g transform="translate(' + txToken + ',' + (tyToken - 4) + ')">');

                    out.push('      <circle cx="0" cy="0" r="21" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.95">');

                    out.push('        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>');

                    out.push('      </circle>');

                    out.push('      <circle cx="0" cy="0" r="16" fill="none" stroke="#f59e0b" stroke-width="1.2" opacity="0.6"/>');

                    out.push('      <g>');

                    out.push('        <polygon points="0,-27 -5,-21 5,-21" fill="#fbbf24" stroke="#d97706" stroke-width="0.8">');

                    out.push('          <animate attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="1.2s" repeatCount="indefinite"/>');

                    out.push('        </polygon>');

                    out.push('      </g>');

                    out.push('    </g>');

                }

                // 3. Kovový zkosený podstavec figurky s barvou hráče a případnou prémiovou aurou
                var pawnObj = window.PRS_getPawnById ? window.PRS_getPawnById(tokenPlayer.pawnId) : null;
                var pawnImg = pawnObj ? pawnObj.img : 'assets/pawns/pawn_knight_valiant.webp';
                var isPremPawn = pawnObj && pawnObj.category === 'premium';
                var auraCol = (pawnObj && pawnObj.accentColor) ? pawnObj.accentColor : tokenPlayer.color;

                if (isPremPawn) {
                    out.push('    <circle cx="' + txToken + '" cy="' + (tyToken - 3) + '" r="18" fill="none" stroke="' + auraCol + '" stroke-width="2" stroke-dasharray="4,3" opacity="0.85">');
                    out.push('      <animateTransform attributeName="transform" type="rotate" from="0 ' + txToken + ' ' + (tyToken - 3) + '" to="360 ' + txToken + ' ' + (tyToken - 3) + '" dur="6s" repeatCount="indefinite"/>');
                    out.push('    </circle>');
                    out.push('    <circle cx="' + txToken + '" cy="' + (tyToken - 3) + '" r="14" fill="' + auraCol + '" opacity="0.22">');
                    out.push('      <animate attributeName="r" values="12;17;12" dur="2.2s" repeatCount="indefinite"/>');
                    out.push('      <animate attributeName="opacity" values="0.15;0.38;0.15" dur="2.2s" repeatCount="indefinite"/>');
                    out.push('    </circle>');
                }

                out.push('    <ellipse cx="' + txToken + '" cy="' + (tyToken + 9) + '" rx="13.5" ry="5.5" fill="' + tokenPlayer.color + '" stroke="#ffd86b" stroke-width="1.5"/>');
                out.push('    <ellipse cx="' + txToken + '" cy="' + (tyToken + 7.2) + '" rx="11" ry="4" fill="url(#pedestalGrad)" stroke="' + tokenPlayer.color + '" stroke-width="1.1"/>');

                // 4. 2.5D Sběratelská figurka rytíře / bota / prémiového hrdiny (256x256 RGBA PNG)
                out.push('    <image href="' + pawnImg + '" x="' + (txToken - 17) + '" y="' + (tyToken - 24) + '" width="34" height="34" preserveAspectRatio="xMidYMid meet" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,0.85));"/>');

                // 5. Heraldický štítek s číslem hráče v popředí vpravo dole
                out.push('    <circle cx="' + (txToken + 10.5) + '" cy="' + (tyToken + 7) + '" r="6" fill="' + tokenPlayer.color + '" stroke="#ffffff" stroke-width="1.3" filter="url(#glowFilter)"/>');
                out.push('    <text x="' + (txToken + 10.5) + '" y="' + (tyToken + 10) + '" text-anchor="middle" fill="#ffffff" font-size="8.2" font-weight="bold" font-family="Cinzel, serif">' + (tokenPlayer.index + 1) + '</text>');

                out.push('  </g>');

            }

        }

        // 5. Aktivní plovoucí hláška nad figurkou (Toast Bubble)

        if (this.activePawnToast) {

            var t = this.activePawnToast;

            out.push('  <g class="pawn-toast-bubble" transform="translate(' + t.x + ',' + t.y + ')" style="pointer-events:none;">');

            out.push('    <rect x="-75" y="-22" width="150" height="26" rx="13" fill="' + t.bg + '" stroke="' + t.color + '" stroke-width="1.6" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.75))"/>');

            out.push('    <text x="0" y="-5" text-anchor="middle" fill="' + t.color + '" font-size="10.5" font-weight="bold" font-family="Cinzel, serif">' + this.escapeHtml(t.icon + ' ' + t.text) + '</text>');

            out.push('  </g>');

        }

        // 6. Aktivní bublina prozkoumané dekorace (Living Terrain Tooltip)

        if (this.activeDecorTooltip) {

            var dt = this.activeDecorTooltip;

            var bx = dt.x, by = dt.y;

            if (bx < 125) bx = 125;

            if (bx > 1275) bx = 1275;

            if (by < 70) by = 70;

            var descLines = this.wrapText(dt.desc, 44);

            var l1 = descLines[0] || "";

            var l2 = descLines[1] || "";

            var boxH = l2 ? 54 : 42;

            out.push('  <g class="board-decor-tooltip" transform="translate(' + bx + ',' + by + ')" style="cursor:pointer;" onclick="PRS_App.dismissDecorTooltip(event)">');

            out.push('    <rect x="-115" y="' + (-boxH) + '" width="230" height="' + boxH + '" rx="8" fill="rgba(20, 16, 12, 0.96)" stroke="#fbbf24" stroke-width="1.5"/>');

            out.push('    <polygon points="-6,0 0,6 6,0" fill="#fbbf24"/>');

            out.push('    <text x="0" y="' + (-boxH + 16) + '" text-anchor="middle" fill="#fef08a" font-family="Cinzel, serif" font-size="11" font-weight="bold">' + this.escapeHtml(dt.icon + ' ' + dt.name) + '</text>');

            out.push('    <text x="0" y="' + (-boxH + 30) + '" text-anchor="middle" fill="#cbd5e1" font-size="8.5">' + this.escapeHtml(l1) + '</text>');

            if (l2) {

                out.push('    <text x="0" y="' + (-boxH + 43) + '" text-anchor="middle" fill="#94a3b8" font-size="8">' + this.escapeHtml(l2) + '</text>');

            }

            out.push('  </g>');

        }

        return out.join("\n");

    },

    
    handleNodeClick: function (nodeId) {

        // Pokud uživatel právě táhl mapou myší, neotvíráme detail políčka

        if (this.viewport.dragMoved) return;

        if (this.activeDecorTooltip) {

            this.activeDecorTooltip = null;

            this.renderBoardTokens();

        }

        this.inspectNode(nodeId);

    },

    
    handleNodeMouseEnter: function (evt, nodeId) {

        var tip = document.getElementById("prs-tile-tooltip");

        if (!tip || !this.state) return;

        var nd = this.state.board.nodes[nodeId];

        if (!nd) return;

        var activePlayer = this.state.players[this.state.currentPlayerIndex];

        var typeLabel = this.getNodeCategoryLabel(nd);

        var ownerText = "";

        var t = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currStr = t("common.gold", null, "zl.");
        var locStr = t("ui.locale", null, "cs-CZ");

        if (nd.owner !== null && this.state.players[nd.owner]) {

            var ownerP = this.state.players[nd.owner];

            var curRent = window.PRS_GameEngine.calculateNodeRent(this.state, nd, activePlayer);

            var rentFormatted = curRent.toLocaleString(locStr) + " " + currStr;

            ownerText = '<div class="prs-tooltip-meta">' + t("tooltips.owner", { color: ownerP.color, name: this.escapeHtml(ownerP.name) }, '👑 Vlastník: <strong style="color:' + ownerP.color + '">' + this.escapeHtml(ownerP.name) + '</strong>') + '</div>' +

                        '<div class="prs-tooltip-rent">' + t("tooltips.rent", { rent: rentFormatted }, '🛑 Vstupné / Nájem: <strong style="color:#f87171">' + rentFormatted + '</strong>') + '</div>';

        } else if (nd.price) {

            var priceFormatted = nd.price.toLocaleString(locStr) + " " + currStr;

            if (nd.rent) {

                var rentVal = Array.isArray(nd.rent) ? (nd.rent[nd.villageLevel || 1] || nd.rent[0]) : (typeof nd.rent === "object" ? nd.rent[nd.villageLevel || 1] : nd.rent);

                var rFormatted = (rentVal || 0).toLocaleString(locStr) + " " + currStr;

                ownerText = '<div class="prs-tooltip-meta">' + t("tooltips.price_rent", { price: priceFormatted, rent: rFormatted }, '💰 Cena: <strong>' + priceFormatted + '</strong> | Základní nájem: <strong>' + rFormatted + '</strong>') + '</div>';

            } else {

                ownerText = '<div class="prs-tooltip-meta">' + t("tooltips.price_only", { price: priceFormatted }, '💰 Cena: <strong>' + priceFormatted + '</strong>') + '</div>';

            }

        }

        // Doplňkové informace podle typu políčka

        var extraInfoHtml = "";

        if (nd.type === "ANIMAL") {

            var setNum = nd.setId || (nd.code && nd.code.match(/\d+/) ? nd.code.match(/\d+/)[0] : 1);

            var myAnimals = [];

            for (var ani = 0; ani < this.state.board.nodes.length; ani++) {

                var anNode = this.state.board.nodes[ani];

                if (anNode && anNode.type === "ANIMAL") {

                    var anSet = anNode.setId || (anNode.code && anNode.code.match(/\d+/) ? anNode.code.match(/\d+/)[0] : 1);

                    if (anSet == setNum && activePlayer && activePlayer.ownedNodes.indexOf(anNode.id) !== -1) {

                        myAnimals.push(anNode);

                    }

                }

            }

            if (myAnimals.length === 3) {

                extraInfoHtml = '<div class="prs-tooltip-set prs-set-complete">' + t("tooltips.set_complete", { set: setNum }, '✨ Vlastníš celou sadu č. ' + setNum + ' (3/3)! Nájem 80 % &amp; bonus +1,0 💖') + '</div>';

            } else if (myAnimals.length > 0) {

                var myKinds = myAnimals.map(function(a){ return a.subtype === "horse" ? t("animals.horse", null, "Kůň") : (a.subtype === "dog" ? t("animals.dog", null, "Pes") : t("animals.falcon", null, "Sokol")); }).join(", ");

                extraInfoHtml = '<div class="prs-tooltip-set prs-set-partial">' + t("tooltips.set_partial", { set: setNum, count: myAnimals.length, kinds: myKinds }, '🐾 V sadě č. ' + setNum + ' vlastníš: <strong>' + myAnimals.length + '/3 (' + myKinds + ')</strong>') + '</div>';

            } else {

                extraInfoHtml = '<div class="prs-tooltip-set">' + t("tooltips.set_none", { set: setNum }, '🐾 Sada č. ' + setNum + ' (Kůň, Pes, Sokol) – zatím z ní nic nevlastníš') + '</div>';

            }

        } else if (nd.type === "VILLAGE") {

            var vLvl = nd.villageLevel || 1;

            var vStars = "★".repeat(vLvl);

            var taxYield = (vLvl === 1 ? 500 : (vLvl === 2 ? 900 : 1400));

            var upgInfo = (vLvl < 3) ? '<div class="prs-tooltip-meta" style="color:#86efac">' + t("tooltips.village_upgrade", { stars: (vLvl + 1) + "★" }, '🔨 Vylepšení na ' + (vLvl + 1) + '★ stojí 1 500 zl.') + '</div>' : '<div class="prs-tooltip-meta" style="color:#cbd5e1">' + t("tooltips.village_max", null, '🏰 Plně opevněná tvrz (3★)') + '</div>';

            extraInfoHtml = '<div class="prs-tooltip-meta">' + t("tooltips.village_tier", { stars: vStars, lvl: vLvl, tax: (taxYield + " " + currStr) }, '🏛️ Úroveň: <strong style="color:#fde047">' + vStars + ' (' + vLvl + '. st.)</strong> | Daň VD: <strong>+' + taxYield + ' zl.</strong>') + '</div>' + upgInfo;

        } else if (nd.type === "CASTLE") {

            extraInfoHtml = '<div class="prs-tooltip-meta" style="color:#e9d5ff">' + t("tooltips.castle_perk", null, '👑 Šlechtické sídlo | Daň VD: <strong>+2 500 zl.</strong> | Trvale <strong>+1 Charisma</strong> &amp; audience u krále!') + '</div>';

        } else if (nd.type === "TOWN") {

            extraInfoHtml = '<div class="prs-tooltip-meta" style="color:#93c5fd">' + t("tooltips.town_perk", null, '🏙️ Bohaté město | Daň VD: <strong>+1 200 zl.</strong> | Zajišťuje šlechtický titul a audienci!') + '</div>';

        } else if (nd.type === "QUEST") {

            if (nd.subtype === "U3") {

                extraInfoHtml = '<div class="prs-tooltip-set prs-set-complete" style="background:rgba(220,38,38,0.25);border-color:#ef4444;color:#fca5a5;">' + t("tooltips.quest_u3", null, '🐉 Dračí sluj! Výhra: 8 000 – 12 000 zl., Věci 3 a <strong>+4 až +6 💖</strong>!') + '</div>';

            } else if (nd.subtype === "U2") {

                extraInfoHtml = '<div class="prs-tooltip-set" style="color:#fdba74;">' + t("tooltips.quest_u2", null, '👹 Monstrum: Výhra 3 500 – 5 000 zl., Věci 1 a <strong>+1 💖</strong>.') + '</div>';

            } else {

                extraInfoHtml = '<div class="prs-tooltip-set">' + t("tooltips.quest_u1", null, '🐗 Lov zvěře: Výhra 1 500 – 2 500 zl.') + '</div>';

            }

        } else if (nd.type === "START") {

            extraInfoHtml = '<div class="prs-tooltip-set" style="color:#93c5fd;">' + t("tooltips.start_perk", null, '🏁 Žold: <strong>+3 000 zl.</strong> (+5 000 zl. pro bezzemky) | Audience: +0,5 až +1,0 💖 (vyžaduje Hrad/Město)') + '</div>';

        }

        tip.innerHTML = '<div class="prs-tooltip-header"><span>' + (nd.icon || '📍') + '</span> <span>' + this.escapeHtml(this.getNodeDisplayName(nd)) + '</span></div>' +

            '<div class="prs-tooltip-meta">' + typeLabel + (nd.code ? ' (' + nd.code + ')' : '') + '</div>' +

            ownerText +

            extraInfoHtml +

            '<div class="prs-tooltip-body">' + this.getNodeTooltipSummary(nd) + '</div>';

        tip.classList.add("visible");

        this.handleNodeMouseMove(evt);

    },

    
    handleNodeMouseLeave: function () {

        var tip = document.getElementById("prs-tile-tooltip");

        if (tip) tip.classList.remove("visible");

    },

    
    handleNodeMouseMove: function (evt) {

        var tip = document.getElementById("prs-tile-tooltip");

        if (!tip || !tip.classList.contains("visible")) return;

        var mx = evt.clientX + 14;

        var my = evt.clientY + 14;

        var maxW = window.innerWidth - 290;

        var maxH = window.innerHeight - 150;

        if (mx > maxW) mx = evt.clientX - 260;

        if (my > maxH) my = evt.clientY - 130;

        tip.style.left = mx + "px";

        tip.style.top = my + "px";

    },

    

    getLandmarkDisplayName: function (lmk) {
        if (!lmk) return "";
        if (lmk.id === "royalCastle") {
            return window.PRS_I18n ? window.PRS_I18n.t("castles.royal.name", null, lmk.name || "Královský Hrad") : (lmk.name || "Královský Hrad");
        }
        var cKey = "";
        if (lmk.castleKey) {
            cKey = lmk.castleKey;
        } else if (lmk.image) {
            var m = lmk.image.match(/castle_([a-z0-9_]+?)(?:_flip)?\.(?:png|jpe?g|webp)/i);
            if (m) cKey = m[1];
        } else if (lmk.id && lmk.id.indexOf("castle_") === 0) {
            cKey = lmk.id.replace("castle_", "");
        }
        if (cKey && window.PRS_I18n) {
            var trans = window.PRS_I18n.t("castles." + cKey + ".name");
            if (trans && trans !== ("castles." + cKey + ".name")) {
                return trans;
            }
        }
        var raw = (lmk.name || "").trim();
        if (raw && window.PRS_I18n) {
            var rawClean = raw.replace(/^[★*\s()]+|[()\s]+$/g, "").toLowerCase();
            var cList = ["ice", "lava", "crystal", "forest", "desert", "wind", "water", "swamp", "dark", "royal"];
            for (var i = 0; i < cList.length; i++) {
                var k = cList[i];
                var defCs = (window.PRS_I18N && window.PRS_I18N.cs && window.PRS_I18N.cs.castles && window.PRS_I18N.cs.castles[k]) ? window.PRS_I18N.cs.castles[k].name.toLowerCase() : "";
                var defEn = (window.PRS_I18N && window.PRS_I18N.en && window.PRS_I18N.en.castles && window.PRS_I18N.en.castles[k]) ? window.PRS_I18N.en.castles[k].name.toLowerCase() : "";
                if ((defCs && rawClean.indexOf(defCs) !== -1) ||
                    (defEn && rawClean.indexOf(defEn) !== -1) ||
                    rawClean.indexOf(k) !== -1 ||
                    (k === "ice" && (rawClean.indexOf("mrazu") !== -1 || rawClean.indexOf("frost") !== -1)) ||
                    (k === "lava" && (rawClean.indexOf("chřtán") !== -1 || rawClean.indexOf("maw") !== -1)) ||
                    (k === "crystal" && (rawClean.indexOf("ametyst") !== -1 || rawClean.indexOf("amethyst") !== -1)) ||
                    (k === "forest" && rawClean.indexOf("doubrava") !== -1) ||
                    (k === "wind" && rawClean.indexOf("boreas") !== -1) ||
                    (k === "water" && (rawClean.indexOf("oceán") !== -1 || rawClean.indexOf("ocean") !== -1)) ||
                    (k === "desert" && (rawClean.indexOf("pískovcový") !== -1 || rawClean.indexOf("sandstone") !== -1)) ||
                    (k === "swamp" && (rawClean.indexOf("černá tůň") !== -1 || rawClean.indexOf("black mere") !== -1)) ||
                    (k === "dark" && rawClean.indexOf("erebus") !== -1)) {
                    var tVal = window.PRS_I18n.t("castles." + k + ".name", null, raw);
                    return raw.indexOf("(") === 0 ? ("(" + tVal + ")") : tVal;
                }
            }
        }
        return raw;
    },

    
    getNodeCategoryLabel: function (nd) {
        if (!nd) return "Herní pole";
        var t = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        switch (nd.type) {
            case "START": return t("tooltips.types.START", null, "Královská audience (Cíl &amp; Start)");
            case "FESTIVAL": return t("tooltips.types.FESTIVAL", null, "Královský turnaj a ples");
            case "VILLAGE": return t("tooltips.types.VILLAGE", { lvl: nd.villageLevel || 1 }, "Panství - Vesnice (Úroveň " + (nd.villageLevel || 1) + "/3)");
            case "TOWN": return t("tooltips.types.TOWN", null, "Panství - Opevněné Město");
            case "CASTLE": return t("tooltips.types.CASTLE", null, "Panství - Rytířský Hrad");
            case "ANIMAL":
                var animalKind = nd.subtype === "horse" ? t("animals.horse", null, "Kůň") : (nd.subtype === "dog" ? t("animals.dog", null, "Pes") : t("animals.falcon", null, "Sokol"));
                var setN = nd.setId || (nd.code && nd.code.match(/\d+/) ? nd.code.match(/\d+/)[0] : "");
                return t("tooltips.types.ANIMAL", { kind: animalKind, set: setN }, "Chovné zvíře - " + animalKind + " (Sada " + setN + ")");
            case "QUEST": return t("tooltips.types.QUEST", { subtype: nd.subtype || "Běžný" }, "Výprava &amp; Boj (" + (nd.subtype || "Běžný") + ")");
            case "MERCHANT": return t("tooltips.types.MERCHANT", null, "Královský trh a obchodník");
            case "MASTER": return t("tooltips.types.MASTER", null, "Mistr řemesel (Trénink dovedností)");
            case "CHANCE": return t("tooltips.types.CHANCE", null, "Karta osudu a náhody");
            case "JESTER": return t("tooltips.types.JESTER", null, "Královský šašek");
            case "TAVERN": return t("tooltips.types.TAVERN", null, "Hostinec U Zlatého kance");
            case "PRISON": return t("tooltips.types.PRISON", null, "Královská šatlava");
            case "HOSPITAL": return t("tooltips.types.HOSPITAL", null, "Špitál sv. Lazara");
            case "TAX": return t("tooltips.types.TAX", null, "Královská berně (Daň)");
            case "BONUS": return t("tooltips.types.BONUS", null, "Pokladnice a odměna");
            default: return t("tooltips.types.DEFAULT", null, "Herní pole");
        }
    },

    
    getNodeTooltipSummary: function (nd) {
        if (!nd) return "";
        var t = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        switch (nd.type) {
            case "START": return t("tooltips.summary.START", null, "Zde začíná pouť. Při průchodu či zastavení možnost audience u krále (+1 💖 za Charisma, vyžaduje šlechtický titul - vlastnictví Města či Hradu).");
            case "FESTIVAL": return t("tooltips.summary.FESTIVAL", null, "Soutěž v tanci a jezdeckém umění. Vítěz získává srdce dvorních dam (+1 až +2 💖) a turnajovou slávu.");
            case "VILLAGE": return t("tooltips.summary.VILLAGE", null, "Základní venkovské panství. Výnosný nájem pro majitele, možnost vylepšení na kamenný statek a tvrz.");
            case "TOWN": return t("tooltips.summary.TOWN", null, "Bohaté opevněné obchodní centrum. Přináší vysoké nájmy a opravňuje k audienci u krále.");
            case "CASTLE": return t("tooltips.summary.CASTLE", null, "Nedobytné panské sídlo. Symbol moci, obrovský nájem a šlechtický titul pro audienci.");
            case "ANIMAL": return t("tooltips.summary.ANIMAL", null, "Zvíře do chovu. Komplet trojice Kůň + Pes + Sokol stejné sady přináší trvalý chovný bonus +1 💖 a body pro vítězství!");
            case "QUEST": return (nd.subtype === "U3") ? t("tooltips.summary.QUEST_U3", null, "Legendární tříhlavá saň či drak! Výhra: až 12 000 zl. a 6 💖 princeznina srdce! Vyžaduje vysoký Boj a zbraně.") : t("tooltips.summary.QUEST_U1_U2", null, "Výprava za zvěří či monstrem. Zisk zlaťáků, srdcí a slávy.");
            case "MERCHANT": return t("tooltips.summary.MERCHANT", null, "Nákup zbraní, brnění a ořů za zvýhodněné ceny. Prodej za 70 % hodnoty.");
            case "MASTER": return t("tooltips.summary.MASTER", null, "Trénink Boje, Jízdy, Tance a Charismatu za zlaťáky.");
            case "CHANCE": return t("tooltips.summary.CHANCE", null, "Vytáhni si kartu štěstěny. Může přinést nečekané bohatství i nástrahy.");
            case "JESTER": return t("tooltips.summary.JESTER", null, "Rozvesel krále vtipem či obratností a získej odměnu.");
            case "TAVERN": return t("tooltips.summary.TAVERN", null, "Odpočinek, hazardní kostky a doplnění sil.");
            case "PRISON": return t("tooltips.summary.PRISON", null, "Uvržen do žaláře! Vykup se kaucí nebo hoď 6 na kostce.");
            case "HOSPITAL": return t("tooltips.summary.HOSPITAL", null, "Léčení zranění z neúspěšných bojů za mírný poplatek.");
            case "TAX": return t("tooltips.summary.TAX", null, "Odevzdej královskou berni do státní pokladnice.");
            case "BONUS": return t("tooltips.summary.BONUS", null, "Nečekaný nález zlaťáků na cestě.");
            default: return t("tooltips.summary.DEFAULT", null, "Políčko království.");
        }
    },

    
    handleDecorClick: function (catalogId, x, y, evt) {

        if (evt) evt.stopPropagation();

        var cat = window.PRS_DECOR_CATALOG ? window.PRS_DECOR_CATALOG[catalogId] : null;

        if (!cat) return;

        // Pokud je tooltip teto dekorace jiz otevreny, kliknutim jej zavreme

        if (this.activeDecorTooltip && this.activeDecorTooltip.catalogId === catalogId) {

            this.dismissDecorTooltip(evt);

            return;

        }

        this.activeDecorTooltip = {

            catalogId: catalogId,

            name: cat.name,

            icon: cat.icon || "🌲",

            desc: cat.desc || "Malebná dekorace oživující krajinu království.",

            category: cat.category,

            x: x,

            y: y - (cat.h ? cat.h * 0.45 : 30) - 15,

            created: Date.now()

        };

        if (window.PRS_Audio) {

            if (cat.category === "water") {

                if (typeof window.PRS_Audio.playWater === "function") window.PRS_Audio.playWater();

                else window.PRS_Audio.playStep();

            } else if (cat.category === "quest_lair") {

                window.PRS_Audio.playOminous();

            } else if (cat.category === "magic") {

                window.PRS_Audio.playNotice();

            } else if (cat.category === "settlement" || cat.category === "civilization" || cat.category === "agriculture") {

                window.PRS_Audio.playItem();

            } else {

                window.PRS_Audio.playStep();

            }

        }

        this.renderBoardTokens();

        var self = this;

        if (this._decorTooltipTimer) clearTimeout(this._decorTooltipTimer);

        this._decorTooltipTimer = setTimeout(function () {

            if (self.activeDecorTooltip && self.activeDecorTooltip.catalogId === catalogId) {

                self.activeDecorTooltip = null;

                self.renderBoardTokens();

            }

        }, 4500);

    },

    
    dismissDecorTooltip: function (evt) {

        if (evt) evt.stopPropagation();

        if (this._decorTooltipTimer) clearTimeout(this._decorTooltipTimer);

        this.activeDecorTooltip = null;

        this.renderBoardTokens();

    },

    
    showPawnToast: function (playerIndex, text, icon, color, bg) {

        var pl = (this.state && this.state.players) ? this.state.players[playerIndex] : null;

        if (!pl) return;

        var node = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[pl.nodeId] : null;

        if (!node) return;

        this.activePawnToast = {

            playerIndex: playerIndex,

            text: text,

            icon: icon || "✨",

            color: color || "#fef08a",

            bg: bg || "rgba(24, 18, 12, 0.94)",

            x: node.x,

            y: node.y - 38,

            created: Date.now()

        };

        this.renderBoardTokens();

        var self = this;

        if (this._pawnToastTimer) clearTimeout(this._pawnToastTimer);

        this._pawnToastTimer = setTimeout(function () {

            self.activePawnToast = null;

            self.renderBoardTokens();

        }, 3200);

    },

    
    inspectCardZone: function (code) {

        var modal = document.getElementById("card-deck-inspector-modal");

        var titleEl = document.getElementById("card-deck-modal-title");

        var bodyEl = document.getElementById("card-deck-modal-body");

        if (!modal || !titleEl || !bodyEl) return;

        if (window.PRS_Audio) window.PRS_Audio.playItem();

        var info = this.getCardZoneInfo(code);

        titleEl.innerHTML = info.title;

        bodyEl.innerHTML = info.bodyHTML;

        modal.style.display = "flex";

        this.updateBodyModalClass();

    },

    
    closeDeckModal: function () {

        var modal = document.getElementById("card-deck-inspector-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    
    getCardZoneInfo: function (code) {

        var title = "Balíček karet";

        var html = [];

        if (code === "VECI_1") {

            title = "🛡️ Balíček VĚCI 1 (Základní výzbroj)";

            var items1 = (window.PRS_ITEMS || []).filter(function (it) { return it.tier === 1; });

            html.push('<div style="margin-bottom:0.8rem; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Cena balíčku: 2 500 zl.</strong> | Obsahuje 9 základních zbraní, zbrojí a dvorských šperků.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Lze nakupovat u Kováře, Obchodníka nebo v záložce Zbrojnice. Poskytují bonusy k Boji (+2 až +3), Jízdě na koni či Tanci a Charismatu.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:var(--gold-light); font-size:0.88rem;">Přehled předmětů v balíčku (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < items1.length; i++) {

                var it = items1[i];

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'item\', \'' + it.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:0.45rem 0.65rem; font-size:0.82rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'var(--gold)\'; this.style.background=\'rgba(212,175,55,0.15)\'" onmouseout="this.style.borderColor=\'rgba(212,175,55,0.3)\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong></span>');
                html.push('    <span style="font-size:0.72rem; color:var(--gold-light);">🔍 Náhled</span>');
                html.push('  </div>');
                html.push('  <div style="font-size:0.75rem; color:#fef08a; margin-top:2px;">' + (it.combat ? "⚔️+" + it.combat + " " : "") + (it.riding ? "🏇+" + it.riding + " " : "") + (it.dance ? "💃+" + it.dance + " " : "") + (it.charisma ? "✨+" + it.charisma : "") + '</div>');
                html.push('</div>');

            }

            html.push('</div>');

        } else if (code === "VECI_2") {

            title = "⚔️ Balíček VĚCI 2 (Rytířská výzbroj)";

            var items2 = (window.PRS_ITEMS || []).filter(function (it) { return it.tier === 2; });

            html.push('<div style="margin-bottom:0.8rem; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Cena balíčku: 7 000 zl.</strong> | Obsahuje 7 elitních zbraní, plátových zbrojí a brokátových rouch.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Zásadní pro souboje s monstry U2 a prestiž u královského dvora. Dávají souhrnné bonusy až +7 k vlastnostem.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#c084fc; font-size:0.88rem;">Přehled předmětů v balíčku (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < items2.length; i++) {

                var it = items2[i];

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'item\', \'' + it.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid rgba(168,85,247,0.3); border-radius:6px; padding:0.45rem 0.65rem; font-size:0.82rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'#c084fc\'; this.style.background=\'rgba(168,85,247,0.15)\'" onmouseout="this.style.borderColor=\'rgba(168,85,247,0.3)\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong></span>');
                html.push('    <span style="font-size:0.72rem; color:#d8b4fe;">🔍 Náhled</span>');
                html.push('  </div>');
                html.push('  <div style="font-size:0.75rem; color:#e9d5ff; margin-top:2px;">' + (it.combat ? "⚔️+" + it.combat + " " : "") + (it.riding ? "🏇+" + it.riding + " " : "") + (it.dance ? "💃+" + it.dance + " " : "") + (it.charisma ? "✨+" + it.charisma : "") + '</div>');
                html.push('</div>');

            }

            html.push('</div>');

        } else if (code === "VECI_3") {

            title = "👑 Balíček VĚCI 3 (Legendární královské relikvie)";

            var items3 = (window.PRS_ITEMS || []).filter(function (it) { return it.tier === 3 && it.slot !== "trophy"; });

            html.push('<div style="margin-bottom:0.8rem; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Cena balíčku: 12 000 zl.</strong> | Obsahuje 4 ultimátní klenoty a meče Dračích bijců.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Nejvzácnější královské relikvie dávající až +13 k celkovým vlastnostem, nezbytné pro porážku nejmocnějších draků U3.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#facc15; font-size:0.88rem;">Přehled předmětů v balíčku (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr; gap:0.45rem;">');

            for (var i = 0; i < items3.length; i++) {

                var it = items3[i];

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'item\', \'' + it.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:0.5rem 0.75rem; font-size:0.85rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'#facc15\'; this.style.background=\'rgba(245,158,11,0.15)\'" onmouseout="this.style.borderColor=\'rgba(245,158,11,0.3)\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong> (' + it.price.toLocaleString("cs-CZ") + ' zl.)</span>');
                html.push('    <span style="font-size:0.75rem; color:#fde047;">🔍 Náhled</span>');
                html.push('  </div>');
                html.push('  <div style="color:#fef08a; font-size:0.8rem; margin-top:2px;">' + (it.combat ? "⚔️+" + it.combat + " " : "") + (it.riding ? "🏇+" + it.riding + " " : "") + (it.dance ? "💃+" + it.dance + " " : "") + (it.charisma ? "✨+" + it.charisma : "") + '</div>');
                html.push('</div>');

            }

            html.push('</div>');

        } else if (code === "ZVER_U1") {

            title = "🐗 Balíček ZVĚŘ (Úkoly U1 - Lovecký revír)";

            var q1 = (window.PRS_QUESTS && window.PRS_QUESTS.U1) ? window.PRS_QUESTS.U1 : [];

            html.push('<div style="margin-bottom:0.8rem; background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Obtížnost: 4–6</strong> | Odměna: 1 200 – 2 600 zl. + 0.5–1.5 💖 Srdce.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Lovečtí psi a sokoli usnadňují ulovení zvěře. Poražením každého zvířete získáte unikátní loveckou trofej do 5. slotu výbavy.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#86efac; font-size:0.88rem;">Seznam ' + q1.length + ' zvířat v revíru (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < q1.length; i++) {

                var z = q1[i];

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'quest\', \'' + z.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid rgba(74,222,128,0.3); border-radius:6px; padding:0.45rem 0.65rem; font-size:0.82rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'#4ade80\'; this.style.background=\'rgba(74,222,128,0.15)\'" onmouseout="this.style.borderColor=\'rgba(74,222,128,0.3)\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + z.icon + ' <strong>' + this.escapeHtml(z.name) + '</strong></span>');
                html.push('    <span style="font-size:0.72rem; color:#86efac;">🔍 Náhled</span>');
                html.push('  </div>');
                html.push('  <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:0.75rem;">');
                html.push('    <span style="color:#4ade80;">⚔️ Obtížnost ' + z.difficulty + '</span>');
                html.push('    <span style="color:var(--gold-light);">+' + z.gold + ' zl.</span>');
                html.push('  </div>');
                html.push('</div>');

            }

            html.push('</div>');

        } else if (code === "MONSTRA_U2") {

            title = "👹 Balíček MONSTRA (Úkoly U2 - Nebezpečné zkoušky)";

            var q2 = (window.PRS_QUESTS && window.PRS_QUESTS.U2) ? window.PRS_QUESTS.U2 : [];

            html.push('<div style="margin-bottom:0.8rem; background:rgba(251,146,60,0.1); border:1px solid rgba(251,146,60,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Obtížnost: 8–15</strong> | Odměna: 3 000 – 12 000 zl. + 1–5 💖 + Předmět výbavy.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Skalní obři, vlkodlaci, loupeživí rytíři, titáni a čarodějové. Poražení vám přinese trvalé srdce princezny a mocnou relikvii.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#fdba74; font-size:0.88rem;">Seznam ' + q2.length + ' monster v balíčku (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < q2.length; i++) {

                var m = q2[i];
                var mCol = (m.difficulty >= 12) ? "#ec4899" : "#fb923c";

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'quest\', \'' + m.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid ' + mCol + '44; border-radius:6px; padding:0.45rem 0.65rem; font-size:0.82rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'' + mCol + '\'; this.style.background=\'' + mCol + '22\'" onmouseout="this.style.borderColor=\'' + mCol + '44\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + m.icon + ' <strong>' + this.escapeHtml(m.name) + '</strong></span>');
                html.push('    <span style="font-size:0.72rem; color:' + mCol + ';">🔍 Náhled</span>');
                html.push('  </div>');
                html.push('  <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:0.75rem;">');
                html.push('    <span style="color:' + mCol + ';">⚔️ Obtížnost ' + m.difficulty + '</span>');
                html.push('    <span style="color:var(--gold-light);">+' + m.gold + ' zl.</span>');
                html.push('  </div>');
                html.push('</div>');

            }

            html.push('</div>');

        } else if (code === "DRACI_U3") {

            title = "🐉 Balíček DRACI (Úkoly U3 - Dračí sluje)";

            var q3 = (window.PRS_QUESTS && window.PRS_QUESTS.U3) ? window.PRS_QUESTS.U3 : [];

            html.push('<div style="margin-bottom:0.8rem; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Obtížnost: 11–17</strong> | Odměna: 6 000 – 16 000 zl. + 2.5–6.0 💖 Srdcí princezny.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Království ohrožuje 20 unikátních draků a saní. Každý má svou zranitelnost (kopí, psi, lektvary, oheň či mráz) a zanechává legendární poklad.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#fda4af; font-size:0.88rem;">Seznam ' + q3.length + ' draků v balíčku (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem; margin-bottom:0.8rem;">');

            for (var i = 0; i < q3.length; i++) {

                var d = q3[i];
                var dCol = (d.tierGroup === "young") ? "#60a5fa" : (d.tierGroup === "elemental" ? "#c084fc" : "#f43f5e");

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'quest\', \'' + d.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid ' + dCol + '44; border-radius:6px; padding:0.45rem 0.65rem; font-size:0.82rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'' + dCol + '\'; this.style.background=\'' + dCol + '22\'" onmouseout="this.style.borderColor=\'' + dCol + '44\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + d.icon + ' <strong>' + this.escapeHtml(d.name) + '</strong></span>');
                html.push('    <span style="font-size:0.72rem; color:' + dCol + ';">🔍 Náhled</span>');
                html.push('  </div>');
                html.push('  <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:0.75rem;">');
                html.push('    <span style="color:' + dCol + ';">⚔️ ' + d.difficulty + '</span>');
                html.push('    <span style="color:var(--gold-light);">+' + d.gold + ' zl. | 💖+' + d.hearts + '</span>');
                html.push('  </div>');
                html.push('</div>');

            }

            html.push('</div>');

            html.push('<div style="text-align:center; margin-top:0.4rem;">');

            html.push('  <button class="rules-subnav-btn active" onclick="PRS_App.closeDeckModal(); PRS_App.switchTab(\'rules\'); PRS_App.switchRulesSubtab(\'dragons\');" style="cursor:pointer; padding:0.45rem 1rem;">🐉 Prohlédnout kompletní Dračí Bestiář v pravidlech (21)</button>');

            html.push('</div>');

        } else if (code === "NAHODA_N") {

            title = "❓ Balíček NÁHODA (24 karet královského osudu)";

            html.push('<div style="margin-bottom:0.8rem; background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Celkem 24 autentických královských událostí.</strong>');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Královská přízeň (+1 💖), loupežnická přepadení, milostné sonety, dary od královny matky, opravy zbrojí i nálezy pokladů na rozcestí.</p>');

            html.push('</div>');

            var chList = (window.PRS_CHANCE_CARDS && window.PRS_CHANCE_CARDS.length) ? window.PRS_CHANCE_CARDS : [];

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#fef08a; font-size:0.88rem;">Výběr karet osudu (klikni pro detail karty):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < Math.min(12, chList.length); i++) {

                var ch = chList[i];
                var cCol = ch.category === "positive" ? "#4ade80" : (ch.category === "negative" ? "#f87171" : "#facc15");

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'chance\', \'' + ch.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid rgba(234,179,8,0.25); border-radius:6px; padding:0.45rem 0.65rem; font-size:0.82rem; cursor:pointer; transition:all 0.15s ease;" onmouseover="this.style.borderColor=\'#eab308\'; this.style.background=\'rgba(234,179,8,0.15)\'" onmouseout="this.style.borderColor=\'rgba(234,179,8,0.25)\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center;">');
                html.push('    <span>' + ch.icon + ' <strong>' + this.escapeHtml(ch.title) + '</strong></span>');
                html.push('    <span style="font-size:0.72rem; color:#fde047;">🔍 Detail</span>');
                html.push('  </div>');
                html.push('  <div style="font-size:0.74rem; color:' + cCol + '; margin-top:2px;">' + (ch.category === 'positive' ? 'Přízeň dvora (+)' : (ch.category === 'negative' ? 'Neštěstí (-)' : 'Zkouška (!)')) + '</div>');
                html.push('</div>');

            }

            html.push('</div>');

        } else if (code === "SLAVNOST_S") {

            title = "🎪 Balíček SLAVNOSTI (Královská klání)";

            html.push('<div style="margin-bottom:0.8rem; background:rgba(236,72,153,0.1); border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Královský turnaj, Dvorský ples a Závod koní.</strong>');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Hráči porovnávají své ctnosti: Turnaj (Boj a Jízda), Ples (Tanec a Charisma), Závod (Jízda a Boj). Tři nejlepší získávají peněžité ceny až 1 500 zl.!</p>');

            html.push('</div>');

            var festList = [
                { id: "fest_tournament", title: "Královský rytířský turnaj", icon: "⚔️", subtitle: "Boj & Jízda", prize: "až 1 500 zl." },
                { id: "fest_ball", title: "Dvorský ples u princezny", icon: "💃", subtitle: "Tanec & Charisma", prize: "až 1 500 zl." },
                { id: "fest_race", title: "Velký královský dostih", icon: "🏇", subtitle: "Jízda & Boj", prize: "až 1 500 zl." }
            ];

            html.push('<div style="font-weight:bold; margin-bottom:0.45rem; color:#f472b6; font-size:0.88rem;">Královské slavnosti (klikni pro detail):</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr; gap:0.5rem; margin-bottom:0.8rem;">');

            for (var i = 0; i < festList.length; i++) {

                var f = festList[i];

                html.push('<div class="deck-item-interactive" onclick="PRS_App.openCardPreview(\'festival\', \'' + f.id + '\')" style="background:rgba(0,0,0,0.45); border:1px solid rgba(236,72,153,0.3); border-radius:6px; padding:0.55rem 0.75rem; font-size:0.85rem; cursor:pointer; transition:all 0.15s ease; display:flex; justify-content:space-between; align-items:center;" onmouseover="this.style.borderColor=\'#ec4899\'; this.style.background=\'rgba(236,72,153,0.15)\'" onmouseout="this.style.borderColor=\'rgba(236,72,153,0.3)\'; this.style.background=\'rgba(0,0,0,0.45)\'">');
                html.push('  <div>' + f.icon + ' <strong>' + this.escapeHtml(f.title) + '</strong><br/><span style="color:#f472b6; font-size:0.78rem;">' + f.subtitle + '</span></div>');
                html.push('  <div style="text-align:right;"><span style="color:var(--gold-light); font-weight:bold; font-size:0.84rem;">' + f.prize + '</span><br/><span style="font-size:0.74rem; color:#f9a8d4;">🔍 Náhled</span></div>');
                html.push('</div>');

            }

            html.push('</div>');

        }
        return { title: title, bodyHTML: html.join("") };

    },

    
    // --- FÁZE 2: SOUBOJOVÁ ARÉNA & DRAČÍ VÝPRAVA (QUEST DUEL ARENA) ---

    duelMonsterFlipped: false,

    
    selectedDuelTactic: "normal",

    
    isDuelRolling: false
    });
})();
