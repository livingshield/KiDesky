// ============================================================================
// KiDesky: Princeznino srdce - Panel aktivního rytíře, Královský rádce a Brašna pergamenů
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    // --- PANEL AKTIVNÍHO HRÁČE A AKCÍ TAHU ---,

    renderActivePlayerPanel: function () {
        var tAdvP = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };


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
                '<div class="eq-slot-pill empty"><span class="eq-icon">🗡️</span> <span class="eq-name">' + (window.PRS_I18n ? window.PRS_I18n.t("advisor.eq_empty_weapon", null, "Zbraň (volno)") : "Zbraň (volno)") + '</span></div>' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">🛡️</span> <span class="eq-name">' + (window.PRS_I18n ? window.PRS_I18n.t("advisor.eq_empty_armor", null, "Zbroj (volno)") : "Zbroj (volno)") + '</span></div>' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">💍</span> <span class="eq-name">' + (window.PRS_I18n ? window.PRS_I18n.t("advisor.eq_empty_jewel", null, "Klenot (volno)") : "Klenot (volno)") + '</span></div>' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">🏆</span> <span class="eq-name">' + tAdvP("advisor.eq_empty_trophy", null, "Trofej (volno)") + '</span></div>' +
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

                var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                              (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);
                var itCombat = Number(it.combat !== undefined && it.combat !== null ? it.combat : (baseDef && baseDef.combat !== undefined ? baseDef.combat : (it.boj !== undefined ? it.boj : 0))) || 0;
                var itRiding = Number(it.riding !== undefined && it.riding !== null ? it.riding : (baseDef && baseDef.riding !== undefined ? baseDef.riding : (it.jizda !== undefined ? it.jizda : 0))) || 0;
                var itDance = Number(it.dance !== undefined && it.dance !== null ? it.dance : (baseDef && baseDef.dance !== undefined ? baseDef.dance : (it.tanec !== undefined ? it.tanec : 0))) || 0;
                var itCharisma = Number(it.charisma !== undefined && it.charisma !== null ? it.charisma : (baseDef && baseDef.charisma !== undefined ? baseDef.charisma : 0)) || 0;

                var statParts = [];
                if (itCombat !== 0) statParts.push("⚔️" + (itCombat > 0 ? "+" : "") + itCombat);
                if (itRiding !== 0) statParts.push("🏇" + (itRiding > 0 ? "+" : "") + itRiding);
                if (itDance !== 0) statParts.push("💃" + (itDance > 0 ? "+" : "") + itDance);
                if (itCharisma !== 0) statParts.push("✨" + (itCharisma > 0 ? "+" : "") + itCharisma);
                var statStr = statParts.length > 0 ? statParts.join(" ") : "(⚔️+0 🏇+0 💃+0 ✨+0)";

                var toggleTitle = isEq
                    ? tAdvP("advisor.store_in_bag", null, "Uložit do batohu")
                    : tAdvP("advisor.equip_active", null, "Nasadit do aktivní výstroje");
                var toggleLabel = isEq
                    ? tAdvP("advisor.equipped_badge", null, "⚔️ Nasazeno")
                    : tAdvP("advisor.in_bag_badge", null, "🎒 V batohu");
                var sellValStr = window.PRS_I18n ? window.PRS_I18n.formatGold(sellVal) : (sellVal + " zl.");
                var sellLabel = tAdvP("advisor.sell_item_btn", { val: sellValStr }, "Prodat +" + sellValStr);

                var displayName = (window.PRS_App && window.PRS_App.getItemDisplayName) ? window.PRS_App.getItemDisplayName(it) : it.name;

                itemsHtml += '<div class="asset-chip ' + (isEq ? 'chip-equipped' : 'chip-in-bag') + '">' +
                    '<span><small class="slot-badge ' + (isTrophy ? 'slot-badge-trophy' : '') + '">' + slotLabel + '</small> ' + (it.icon || '🎒') + ' <strong>' + this.escapeHtml(displayName) + '</strong> <small style="color:var(--gold-light); font-weight:600;">(' + statStr + ')</small></span>' +
                    '<div style="display:flex;align-items:center;">' +
                    '  <button class="btn-equip-toggle ' + (isEq ? 'equipped' : 'in-bag') + '" onclick="PRS_App.handleToggleEquip(\'' + it.uid + '\', ' + i + ', ' + inspIdx + ')" title="' + toggleTitle + '">' + toggleLabel + '</button>' +
                    '  <button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'item\', \'' + it.uid + '\', ' + i + ', ' + inspIdx + ')">' + sellLabel + '</button>' +
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

                var currUnitP = tAdvP("common.gold_short", null, "zl.");
                var uCostStr = window.PRS_I18n ? window.PRS_I18n.formatNumber(uCost) : uCost;
                if (nd.type === "VILLAGE" && nd.villageLevel < 3 && isCurTurn) {

                    var uCost = this.state.config.estates.villagePrices[nd.villageLevel] || 1500;
                    uCostStr = window.PRS_I18n ? window.PRS_I18n.formatNumber(uCost) : uCost;

                    upgBtn = '<button class="btn-upg-mini" onclick="PRS_App.handleUpgradeVillage(' + nd.id + ')">' + tAdvP("knight_tab.upgrade_btn", { cost: uCostStr, curr: currUnitP }, "★ Povýšit (" + uCostStr + " " + currUnitP + ")") + '</button>';

                }

                var ndNameDisp = this.translateDynamicName ? this.translateDynamicName(nd.name) : nd.name;
                var rentFmt = window.PRS_I18n ? window.PRS_I18n.formatNumber(rentVal) : rentVal.toLocaleString("cs-CZ");
                var bSellFmt = window.PRS_I18n ? window.PRS_I18n.formatNumber(bSellVal) : bSellVal;

                nodesHtml += '<div class="asset-chip">' +

                    '<div>' +
                    '  <div>' + nd.icon + ' <strong>' + this.escapeHtml(ndNameDisp) + '</strong>' + (nd.type === "VILLAGE" ? (' (' + tAdvP("knight_tab.level_short", { lvl: nd.villageLevel }, 'Úr. ' + nd.villageLevel + '/3') + ')') : '') + '</div>' +
                    '  <div style="font-size:0.68rem; color:#86efac;">' + tAdvP("knight_tab.toll_label", { amount: rentFmt, curr: currUnitP }, "Mýtné: " + rentFmt + " " + currUnitP) + '</div>' +
                    '</div>' +

                    '<div style="display:flex; gap:4px; align-items:center;">' + upgBtn + '<button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'node\', ' + nd.id + ', null, ' + inspIdx + ')">' + tAdvP("knight_tab.sell_btn", { amount: bSellFmt, curr: currUnitP }, "Prodat +" + bSellFmt + " " + currUnitP) + '</button></div>' +

                    '</div>';

            }

            nodesHtml += '</div>';

        } else {

            nodesHtml = '<div class="fiefs-empty-hint">' + tAdvP("knight_tab.no_estates", null, "🏰 Rytíř zatím nevlastní panství ani stáje. Kupuj pole po království!") + '</div>';

        }

        // 5. Sestavení odlehčeného, kompaktního profilu rytíře na tahu

        var curTab = this.activePlayerTab || "none";

        var tabContentHtml = "";

        if (curTab === "items") {

            tabContentHtml = '<div style="margin-top:0.45rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.2);">' +

                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">' + tAdvP("knight_tab.equipment_header", null, "🎒 Rytířská výbava:") + '</div>' +

                itemsHtml +

                '</div>';

        } else if (curTab === "fiefs") {

            tabContentHtml = '<div style="margin-top:0.45rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.2);">' +

                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem; display:flex; justify-content:space-between; align-items:center;">' +
                '  <span>' + tAdvP("knight_tab.estates_header", { count: p.ownedNodes.length }, "🏰 Panství a chovy (" + p.ownedNodes.length + " polí):") + '</span>' +
                '  <small style="color:#fde047; font-size:0.7rem;">' + tAdvP("knight_tab.farming_sub", { cattle: (st.cattle || 0), sheep: (st.sheep || 0), pigs: (st.pigs || 0) }, "🌾 Chov: 🐄" + (st.cattle || 0) + " 🐑" + (st.sheep || 0) + " 🐖" + (st.pigs || 0)) + '</small>' +
                '</div>' +

                '<div class="fiefs-summary-pills" style="margin-bottom:0.4rem; flex-wrap:wrap;">' +

                '  <span class="fief-pill ' + (horseCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_horses", { count: horseCount }, "Koně: " + horseCount) + '">🐎 ' + horseCount + '</span>' +

                '  <span class="fief-pill ' + (dogCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_dogs", { count: dogCount }, "Lovečtí psi: " + dogCount) + '">🐕 ' + dogCount + '</span>' +

                '  <span class="fief-pill ' + (falconCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_falcons", { count: falconCount }, "Sokoli: " + falconCount) + '">🦅 ' + falconCount + '</span>' +

                '  <span class="fief-pill ' + (villageCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_villages", { count: villageCount }, "Vesnice: " + villageCount) + '">🏡 ' + villageCount + '</span>' +

                '  <span class="fief-pill ' + (townCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_towns", { count: townCount }, "Města: " + townCount) + '">🏛️ ' + townCount + '</span>' +

                '  <span class="fief-pill ' + (castleCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_castles", { count: castleCount }, "Hrady: " + castleCount) + '">🏰 ' + castleCount + '</span>' +

                '  <span class="fief-pill ' + (craftCount > 0 ? 'active' : '') + '" title="' + tAdvP("knight_tab.pill_crafts", { count: craftCount }, "Řemeslné živnosti a kejklíři: " + craftCount) + '">⚒️ ' + craftCount + '</span>' +

                '</div>' +

                nodesHtml +

                '</div>';

        }

        // Taktické svitky v brašně rytíře
        var invHtml = '';
        var invList = p.inventory || [];
        if (invList.length > 0) {
            invHtml = '<div style="margin-top:0.4rem; padding:0.35rem 0.5rem; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:6px; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">' +
                '  ' + '<span style="font-size:0.75rem; color:var(--gold-light); font-weight:700;">' + tAdvP("advisor.pouch_count", { count: invList.length }, "🎒 Brašna (" + invList.length + "/3):") + '</span>' + '';
            for (var scI = 0; scI < invList.length; scI++) {
                var sc = invList[scI];
                var canUse = (inspIdx === this.state.currentPlayerIndex && p.type === "Human" && this.state.phase !== "GAME_OVER");
                var scTit = (sc.id && window.PRS_I18n && window.PRS_I18n.t("cards." + sc.id + ".title") !== ("cards." + sc.id + ".title")) ? window.PRS_I18n.t("cards." + sc.id + ".title") : sc.title;
                var scTxt = (sc.id && window.PRS_I18n && window.PRS_I18n.t("cards." + sc.id + ".text") !== ("cards." + sc.id + ".text")) ? window.PRS_I18n.t("cards." + sc.id + ".text") : sc.text;
                invHtml += '  <button type="button" class="btn-secondary" style="padding:0.2rem 0.45rem; font-size:0.75rem; border-color:var(--gold); color:#fef08a; display:inline-flex; align-items:center; gap:0.25rem;' + (canUse ? ' cursor:pointer;' : ' opacity:0.8;') + '" ' +
                    (canUse ? 'onclick="PRS_App.handleUseInventoryScroll(' + scI + ')"' : '') + ' title="' + this.escapeHtml(scTxt) + '">' +
                    sc.icon + ' ' + this.escapeHtml(scTit) + (canUse ? ' <span style="color:#4ade80; font-weight:bold;">▶</span>' : '') +
                    '</button>';
            }
            invHtml += '</div>';
        } else {
            invHtml = '<div style="margin-top:0.4rem; padding:0.3rem 0.5rem; background:rgba(212,175,55,0.05); border:1px dashed rgba(212,175,55,0.22); border-radius:6px; display:flex; align-items:center; justify-content:space-between;">' +
                '  ' + '<span style="font-size:0.75rem; color:var(--gold-light);">' + tAdvP("advisor.scroll_pouch_empty", null, "🎒 <strong>Brašna pergamenů:</strong> 0 / 3 (volno)") + '</span>' + '' +
                '  ' + '<span style="font-size:0.68rem; color:#94a3b8; font-style:italic;">' + tAdvP("advisor.obtain_on_chance", null, "získej na poli Náhody") + '</span>' + '' +
                '</div>';
        }

        // Aktivní svitky v platnosti
        var actBuffs = [];
        if (p.activeScrolls) {
            if (p.activeScrolls.bonusRoll) actBuffs.push(tAdvP("pouch.buff_roll", { val: p.activeScrolls.bonusRoll }, '⚡ +' + p.activeScrolls.bonusRoll + ' k hodu'));
            if (p.activeScrolls.forcedRoll) actBuffs.push(tAdvP("pouch.buff_forced", { val: p.activeScrolls.forcedRoll }, '⭐ Zaručená ' + p.activeScrolls.forcedRoll));
            if (p.activeScrolls.combatBonus) actBuffs.push(tAdvP("pouch.buff_combat", { val: p.activeScrolls.combatBonus }, '🧪 +' + p.activeScrolls.combatBonus + ' Boj'));
            if (p.activeScrolls.rentImmunity) actBuffs.push(tAdvP("pouch.buff_rent", null, '👑 Ochrana nájmu'));
            if (p.activeScrolls.doubleBreeding) actBuffs.push(tAdvP("pouch.buff_breeding", null, '🐑 2x Chov'));
        }
        if (actBuffs.length > 0) {
            invHtml += '<div style="margin-top:0.3rem; font-size:0.73rem; color:#86efac; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); border-radius:4px; padding:0.2rem 0.45rem;">' +
                '' + tAdvP("advisor.active_effect", null, "✨ Aktivní účinek: ") + "<strong>" + '' + actBuffs.join(', ') + '</strong>' +
                '</div>';
        }

        el.innerHTML = '<div class="compact-knight-card" style="border-left: 4px solid ' + p.color + ';">' +

            '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">' +

            '    <div style="display:flex; align-items:center; gap:0.45rem;">' +

            '      ' + this.getPlayerPawnAvatarHtml(p, 32) + 

            '      <strong style="color:var(--text-main); font-size:0.92rem;' + (p.isEliminated ? ' text-decoration:line-through; opacity:0.6;' : '') + '">' + this.escapeHtml(p.name) + '</strong>' +

            (p.isEliminated ? '' + '<span style="font-size:0.68rem; padding:1px 5px; background:#dc2626; color:#fff; border-radius:4px; font-weight:bold;">' + tAdvP("advisor.bankrupt_tag", null, "💀 Bankrot") + '</span>' + '' : (isCurTurn ? '' + '<span class="tag-on-turn" style="font-size:0.68rem; padding:1px 5px;">' + tAdvP("advisor.on_turn_tag", null, "👑 Na tahu") + '</span>' + '' : '')) +

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

            '      ' + tAdvP("advisor.gear_tab_label", { count: p.items.length }, "🎒 Výbava (" + p.items.length + ")") + '' + (curTab === "items" ? ' ▲' : ' ▼') +

            '    </button>' +

            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "fiefs" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;fiefs&quot;)">' +

            '      ' + tAdvP("advisor.estates_tab_label", { count: p.ownedNodes.length }, "🏰 Panství (" + p.ownedNodes.length + ")") + '' + (curTab === "fiefs" ? ' ▲' : ' ▼') +

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
        var tAdvE = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var cfg = this.state.config || {};
        var scen = cfg.scenario || "classic";
        var price = (window.PRS_GameEngine && window.PRS_GameEngine.getNodePrice) ? window.PRS_GameEngine.getNodePrice(this.state, node) : (node.price || 600);
        var priceStr = window.PRS_I18n ? window.PRS_I18n.formatGold(price) : (price.toLocaleString("cs-CZ") + " zl.");
        if (node.type === "ANIMAL") {
            var owned = 0;
            for (var i = 0; i < player.ownedNodes.length; i++) {
                var oN = this.state.board.nodes[player.ownedNodes[i]];
                if (oN && oN.type === "ANIMAL" && oN.setId === node.setId) owned++;
            }
            if (node.owner === player.index) return tAdvE("advisor.eval_animal_own", { setId: node.setId }, "Tvé vlastní zvíře (sada č. " + node.setId + ").");
            if (node.owner !== null && node.owner !== undefined) return tAdvE("advisor.eval_animal_rival", null, "Patří soupeři. Stoupnutí tě bude stát nájemné.");
            if (owned === 2) return tAdvE("advisor.eval_animal_complete", { setId: node.setId }, "Klíčové pole! Koupí završíš sadu č. " + node.setId + " na 3/3 (korunka 👑 + 1.5 💖).");
            if (owned === 1) return tAdvE("advisor.eval_animal_pair", { setId: node.setId }, "Koupí získáš pár (2/3 v sadě č. " + node.setId + ").");
            return tAdvE("advisor.eval_animal_free", { price: priceStr }, "Volné zvíře do chovu (cena " + priceStr + ").");
        }
        if (node.type === "TOWN") {
            if (node.owner === player.index) return tAdvE("advisor.eval_town_own", null, "Tvé město s daňovým výnosem 1 200 zl.");
            if (node.owner !== null) return tAdvE("advisor.eval_town_rival", null, "Město soupeře. Přináší mu daně z každého výběru.");
            return (scen === "tycoon" ? (tAdvE("advisor.eval_tycoon_goal", null, "Cíl scénáře Magnát!") + " ") : "") + tAdvE("advisor.eval_town_free", { price: priceStr }, "Volné město za " + priceStr + " (+1 200 zl. daň).");
        }
        if (node.type === "CASTLE") {
            if (node.owner === player.index) return tAdvE("advisor.eval_castle_own", null, "Tvůj hrad (+2 500 zl. daň a +1 Charisma).");
            if (node.owner !== null) return tAdvE("advisor.eval_castle_rival", null, "Hrad soupeře. Pozor na vysoký nájem.");
            return (scen === "tycoon" ? (tAdvE("advisor.eval_tycoon_goal", null, "Cíl scénáře Magnát!") + " ") : "") + tAdvE("advisor.eval_castle_free", { price: priceStr }, "Volný hrad za " + priceStr + " (+2 500 zl. daň a +1 Charisma).");
        }
        if (node.type === "VILLAGE") {
            if (node.owner === player.index) return tAdvE("advisor.eval_village_own", { lvl: (node.villageLevel || 1) }, "Tvá vesnice úrovně " + (node.villageLevel || 1) + "★. Lze ji povýšit.");
            if (node.owner !== null) return tAdvE("advisor.eval_village_rival", null, "Vesnice soupeře.");
            return tAdvE("advisor.eval_village_free", { price: priceStr }, "Volná vesnice za " + priceStr + ". Stabilní zdroj daní.");
        }
        if (node.type === "QUEST") {
            if (node.subtype === "U3") return (scen === "slayer" ? (tAdvE("advisor.eval_slayer_goal", null, "Cíl scénáře Lovci draků!") + " ") : "") + tAdvE("advisor.eval_quest_u3", null, "Nebezpečná Dračí sluj s královským pokladem.");
            if (node.subtype === "U2") return tAdvE("advisor.eval_quest_u2", null, "Doupě monstra. Vyžaduje solidní bojovou výbavu.");
            return tAdvE("advisor.eval_quest_u1", null, "Lesní zvěř. Vhodný cíl pro lehký lov se psy či sokoly.");
        }
        if (node.type === "MASTER") {
            var skLabel = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(node.skill, true) : tAdvE("advisor.eval_virtue_fallback", null, "Ctnost");
            return tAdvE("advisor.eval_master", { skill: skLabel }, "Mistr ctnosti (" + skLabel + "). Zvyšuje úroveň vlastnosti.");
        }
        if (node.type === "FESTIVAL") {
            return tAdvE("advisor.eval_festival", null, "Královské slavnosti. Skvělé místo pro zisk Princezniných srdcí 💖.");
        }
        return "";
    },

    
    getRoyalAdvisorAdvice: function (player, phase, pa, currNode) {
        if (!player && this.state && Array.isArray(this.state.players)) { player = this.state.players[this.state.currentPlayerIndex || 0]; }
        if (!phase && this.state) { phase = this.state.phase; }
        if (!this.state || !player) return null;
        var tAdvTop = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var cfg = this.state.config || {};
        var scen = cfg.scenario || "classic";
        var effStats = window.PRS_GameEngine.getEffectiveStats ? window.PRS_GameEngine.getEffectiveStats(this.state, player) : player.skills;

        // 1. ZVLÁŠTNÍ PŘÍPAD: DLUH A LIKVIDACE
        if (pa && pa.debt && pa.debt > 0) {
            var debtAmt = (typeof pa.debt === "number" && !isNaN(pa.debt)) ? pa.debt : 0;
            var debtStr = window.PRS_I18n ? window.PRS_I18n.formatGold(debtAmt) : (debtAmt.toLocaleString("cs-CZ") + " zl.");
            return {
                icon: "⚠️",
                title: tAdvTop("advisor.title", null, "Královský rádce"),
                badge: tAdvTop("advisor.badge_debt", null, "Hrozba dluhu"),
                badgeClass: "advisor-warn",
                text: tAdvTop("advisor.debt_text", { debt: debtStr }, "Dlužíš věřitelům **" + debtStr + "**! Královská rada ti doporučuje nejprve prodat **samostatná zvířata bez sady**, a chránit svá **města, hrady a kompletní 3/3 chovy**, které ti zajišťují stálý zlaťákový i prestižní příjem."),
                actionPrompt: tAdvTop("advisor.debt_prompt", null, "Vyber majetek k prodeji za 50–75 % ceny níže.")
            };
        }

        // 2. ŠATLAVA A ŠPITÁL
        if (pa && pa.isImprisoned) {
            var bailVal = cfg.prisonBail || 1000;
            var canBail = player.gold >= bailVal;
            var bailStr = window.PRS_I18n ? window.PRS_I18n.formatGold(bailVal) : (bailVal + " zl.");
            return {
                icon: "⛓️",
                title: tAdvTop("advisor.title", null, "Královský rádce"),
                badge: tAdvTop("advisor.badge_prison", null, "Šatlava"),
                badgeClass: "advisor-warn",
                text: canBail
                    ? tAdvTop("advisor.prison_can_bail", { bail: bailStr }, "Jsi ve vězení! Máš dostatek zlaťáků na složení kauce (**" + bailStr + "**). Doporučuji kauci zaplatit hned, ať neztrácíš cenné tahy!")
                    : tAdvTop("advisor.prison_no_bail", null, "Jsi uvězněn a chybí ti zlato na kauci. Zkus štěstí hodem na útěk (hod 5–6 ti vrátí svobodu), nebo vyčkej 2 kola."),
                actionPrompt: canBail ? tAdvTop("advisor.prison_bail_prompt", null, "Zvol 'Složit kauci a odejít'.") : tAdvTop("advisor.prison_escape_prompt", null, "Zvol 'Pokusit se o útěk'.")
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
                    threats.push({ node: tNode, roll: rollVal, isPrison: true, rent: 0 });
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
                if (opp && opp.node) {
                    var oppNameDisp = this.translateDynamicName ? this.translateDynamicName(opp.node.name) : opp.node.name;
                    var cHint = (curMode !== "cautious" && opp.roll <= 4) ? tAdvTop("advisor.trio_cautious_hint", null, " Zvaž přepnutí na **Opatrný krok 🚶 (1–4)** pro vyšší šanci na přesný hod.") : "";
                    return {
                        icon: "👑",
                        title: tAdvTop("advisor.title", null, "Královský rádce"),
                        badge: tAdvTop("advisor.badge_trio", null, "Šlechtický chov"),
                        badgeClass: "advisor-good",
                        text: tAdvTop("advisor.trio_text", { roll: opp.roll, name: this.escapeHtml(oppNameDisp), cautiousHint: cHint }, "Při hodu **" + opp.roll + "** máš na dosah volné zvíře **" + this.escapeHtml(oppNameDisp) + "**, které zkompletuje tvou chovnou sadu na **3/3** a zajistí ti korunu 👑 a **+1.5 💖**!" + cHint),
                        actionPrompt: tAdvTop("advisor.trio_prompt", { roll: opp.roll }, "Hoď kostkou a usiluj o číslo " + opp.roll + "!")
                    };
                }
            }

            if (threats.length > 0 && curMode === "standard") {
                var th = threats[0];

                var tAdvH = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
                var rentVal = (typeof th.rent === "number") ? th.rent : 0;
                var rentStr = window.PRS_I18n ? window.PRS_I18n.formatGold(rentVal) : (rentVal + " zl.");
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

            var tAdv = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            if (opportunities.length > 0) {
                var op = opportunities[0];
                var opNodeName = op.node ? (this.translateDynamicName ? this.translateDynamicName(op.node.name) : op.node.name) : "";
                var opDesc = op.isEstate
                    ? tAdv("advisor.op_desc_estate", { name: this.escapeHtml(opNodeName) }, "volné sídlo **" + this.escapeHtml(opNodeName) + "**")
                    : (op.isFestival
                        ? tAdv("advisor.op_desc_festival", null, "královské Slavnosti 💖")
                        : tAdv("advisor.op_desc_tile", { name: this.escapeHtml(opNodeName) }, "pole **" + this.escapeHtml(opNodeName) + "**"));
                return {
                    icon: "💡",
                    title: tAdv("advisor.title", null, "Královský rádce"),
                    badge: tAdv("advisor.badge_opportunity", null, "Taktický dosah"),
                    badgeClass: "advisor-tip",
                    text: tAdv("advisor.opportunity_text", { roll: op.roll, desc: opDesc }, "Před tebou na hodu **" + op.roll + "** leží " + opDesc + ". Cesta je volná a příznivá pro tvůj další postup."),
                    actionPrompt: tAdv("advisor.opportunity_prompt", null, "Hoď kostkou a vykroč na cestu.")
                };
            }

            if (scen === "slayer") {
                return {
                    icon: "🐉",
                    title: tAdv("advisor.title", null, "Královský rádce"),
                    badge: tAdv("advisor.badge_slayer", null, "Scénář Lovci draků"),
                    badgeClass: "advisor-tip",
                    text: tAdv("advisor.text_slayer", null, "Ve scénáři Lovci draků je tvým cílem skolit 2 draky království v Dračích slujích (U3). Sleduj rozcestí a směřuj na Dračí stezku!"),
                    actionPrompt: tAdv("advisor.prompt_slayer", null, "Klepni na kostku pro hod.")
                };
            }
            if (scen === "tycoon") {
                return {
                    icon: "🏰",
                    title: tAdv("advisor.title", null, "Královský rádce"),
                    badge: tAdv("advisor.badge_tycoon", null, "Scénář Feudální magnát"),
                    badgeClass: "advisor-tip",
                    text: tAdv("advisor.text_tycoon", null, "K vítězství potřebuješ ovládnout 3 města a 1 hrad. Šetři si zlaťáky na jejich nákup a nenech si je vyfouknout soupeři!"),
                    actionPrompt: tAdv("advisor.prompt_tycoon", null, "Klepni na kostku pro hod.")
                };
            }

            var pGoldVal = (typeof player.gold === "number") ? player.gold : 0;
            var pGoldStrAdv = window.PRS_I18n ? window.PRS_I18n.formatGold(pGoldVal) : (pGoldVal + " zl.");
            return {
                icon: "🧙‍♂️",
                title: tAdv("advisor.title", null, "Královský rádce"),
                badge: tAdv("advisor.badge_march", null, "Královský pochod"),
                badgeClass: "advisor-tip",
                text: tAdv("advisor.text_march", { gold: pGoldStrAdv, hearts: player.totalHearts + " 💖" }, "Máš k dispozici **" + pGoldStrAdv + "** a **" + player.totalHearts + " 💖**. Cesta před tebou je přehledná, zvol tempo pochodu a vyraz vstříc dobrodružství."),
                actionPrompt: tAdv("advisor.prompt_march", null, "Klepni na kostku pro hod.")
            };
        }

        // 4. FÁZE BRANCH_CHOICE
        if (phase === "BRANCH_CHOICE") {
            var tAdv = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            return {
                icon: "🔀",
                title: tAdv("advisor.title", null, "Královský rádce"),
                badge: tAdv("advisor.badge_branch", null, "Volba rozcestí"),
                badgeClass: "advisor-tip",
                text: tAdv("advisor.branch_text", null, "Stojíš před klíčovým rozcestím. **Vnitřní královská stezka** nabízí slavnosti, turnaje a vysoké odměny, zatímco **Vnější okruh** poskytuje stabilní hospodářství a chov zvířat."),


                actionPrompt: tAdv("advisor.branch_prompt", null, "Zvol si jednu ze dvou tras výše.")
            };
        }

        // 5. FÁZE ACTION (Po hodu na poli)
        if (currNode) {
            var tAdvA = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            if (pa && pa.canBuyNode) {
                var bPrice = (typeof pa.buyPrice === "number" && !isNaN(pa.buyPrice)) ? pa.buyPrice : ((currNode && typeof currNode.price === "number") ? currNode.price : 1000);
                var pGold = (player && typeof player.gold === "number") ? player.gold : 0;
                var canAfford = pGold >= bPrice;
                var rem = pGold - bPrice;
                var bPriceStr = window.PRS_I18n ? window.PRS_I18n.formatGold(bPrice) : (bPrice + " zl.");
                var pGoldCurStr = window.PRS_I18n ? window.PRS_I18n.formatGold(pGold) : (pGold + " zl.");
                var remStr = window.PRS_I18n ? window.PRS_I18n.formatGold(rem) : (rem + " zl.");

                if (!canAfford) {
                    return {
                        icon: "🪙",
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_no_gold", null, "Nedostatek zlata"),
                        badgeClass: "advisor-warn",
                        text: tAdvA("advisor.text_no_gold", { name: this.escapeHtml(currNode.name), price: bPriceStr, gold: pGoldCurStr }, "Pole **" + this.escapeHtml(currNode.name) + "** stojí **" + bPriceStr + "**, ale v měšci máš jen " + pGoldCurStr + ". Nyní pole koupit nemůžeš, pokračuj ukončením tahu."),
                        actionPrompt: tAdvA("advisor.prompt_end_turn", null, "Klepni na Ukoncit tah.")
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
                            title: tAdvA("advisor.title", null, "Královský rádce"),
                            badge: tAdvA("advisor.badge_buy_complete", null, "Kompletace 3/3!"),
                            badgeClass: "advisor-good",
                            text: tAdvA("advisor.text_buy_complete", { setId: sId }, "Doporucuji koupit!"),
                            actionPrompt: tAdvA("advisor.prompt_buy_btn", null, "Klepni na Koupit toto pole.")
                        };
                    } else if (ownedInSet === 1) {
                        return {
                            icon: "🐎",
                            title: tAdvA("advisor.title", null, "Královský rádce"),
                            badge: tAdvA("advisor.badge_buy_pair", null, "Zisk páru do sady"),
                            badgeClass: "advisor-good",
                            text: tAdvA("advisor.text_buy_pair", { setId: sId }, "Skvela investice!"),
                            actionPrompt: tAdvA("advisor.prompt_buy", null, "Klepni na Koupit toto pole.")
                        };
                    } else {
                        var subDesc = currNode.subtype === "horse" ? tAdvA("advisor.sub_horse", null, "Kůň – nutný pro cval a závody") : ((currNode.subtype === "dog" || currNode.subtype === "pes") ? tAdvA("advisor.sub_dog", null, "Pes – bonus k lovu monster") : tAdvA("advisor.sub_falcon", null, "Sokol – bonus k turnajům"));
                        return {
                            icon: "🐎",
                            title: tAdvA("advisor.title", null, "Královský rádce"),
                            badge: tAdvA("advisor.badge_buy_animal", null, "Nákup zvířete"),
                            badgeClass: "advisor-tip",
                            text: tAdvA("advisor.text_buy_animal", { desc: subDesc, rem: remStr }, "Volne chovne zvire"),
                            actionPrompt: tAdvA("advisor.prompt_buy", null, "Klepni na Koupit toto pole.")
                        };
                    }
                }

                if (currNode.type === "TOWN" || currNode.type === "CASTLE") {
                    return {
                        icon: "🏰",
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_strategic_estate", null, "Strategické panství"),
                        badgeClass: "advisor-good",
                        text: tAdvA("advisor.text_strategic_estate", null, "Doporucuji koupit!"),
                        actionPrompt: tAdvA("advisor.prompt_buy", null, "Klepni na Koupit toto pole.")
                    };
                }

                if (currNode.type === "VILLAGE") {
                    return {
                        icon: "🏘️",
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_village_dev", null, "Rozvoj vesnice"),
                        badgeClass: "advisor-tip",
                        text: tAdvA("advisor.text_village_dev", { rem: remStr }, "Vesnice"),
                        actionPrompt: tAdvA("advisor.prompt_buy", null, "Klepni na Koupit toto pole.")
                    };
                }
            }

            if (pa && pa.canUpgradeVillage) {
                return {
                    icon: "🏘️",
                    title: tAdvA("advisor.title", null, "Královský rádce"),
                    badge: tAdvA("advisor.badge_estate_upg", null, "Povýšení panství"),
                    badgeClass: "advisor-good",
                    text: tAdvA("advisor.text_estate_upg", null, "Stojis na sve vesnici"),
                    actionPrompt: tAdvA("advisor.prompt_estate_upg", null, "Zvol Povysit vesnici nebo ukonci tah.")
                };
            }

            if (pa && pa.canTrainMaster) {
                if (pa.isMasterDuel) {
                    return {
                        icon: "⚔️",
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_master_duel", null, "Rytířský duel!"),
                        badgeClass: "advisor-good",
                        text: tAdvA("advisor.text_master_duel", null, "Mistr ctnosti tě vyzývá k slavnostnímu rytířskému turnaji o **1.5 💖 Srdce princezny**!"),


                        actionPrompt: tAdvA("advisor.prompt_master_duel", null, "Klepni na Vyzvat mistra na duel!")
                    };
                }
                return {
                    icon: "🎓",
                    title: tAdvA("advisor.title", null, "Královský rádce"),
                    badge: tAdvA("advisor.badge_virtue_training", null, "Výcvik ctnosti"),
                    badgeClass: "advisor-tip",
                        text: tAdvA("advisor.text_virtue_training", null, "Mistr tě přijal do učení! Zvýšení vlastnosti ti dá trvalou výhodu při Slavnostech a bojových výpravách."),


                    actionPrompt: tAdvA("advisor.prompt_virtue_training", null, "Klepni na tlacitko vycviku.")
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
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_battle_favorable", { winRate: winRate }, "Příznivý boj (" + winRate + " %)"),
                        badgeClass: "advisor-good",
                        text: tAdvA("advisor.text_battle_favorable", { power: basePower, needed: needed, winRate: winRate }, "Tvoje bojová síla je vysoká (**+" + basePower + "**). K vítězství ti stačí hod **" + needed + "+** (šance **" + winRate + " %**). Výhra ti přinese štědré zlaťáky i srdce!"),


                        actionPrompt: tAdvA("advisor.prompt_battle_favorable", null, "Klepni na Bojovat s nepritelem.")
                    };
                } else if (winRate >= 35) {
                    return {
                        icon: "⚖️",
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_battle_balanced", { winRate: winRate }, "Vyrovnaný souboj (" + winRate + " %)"),
                        badgeClass: "advisor-tip",
                        text: tAdvA("advisor.text_battle_balanced", { needed: needed, winRate: winRate }, "Šance je vyrovnaná (**" + winRate + " %**, potřebuješ hod **" + needed + "+**). Pokud máš v brašně bojový pergamen, aktivuj jej pro vyšší jistotu."),


                        actionPrompt: tAdvA("advisor.prompt_battle_balanced", null, "Bojuj s odvahou")
                    };
                } else {
                    return {
                        icon: "⚠️",
                        title: tAdvA("advisor.title", null, "Královský rádce"),
                        badge: tAdvA("advisor.badge_battle_risk", { winRate: winRate }, "Vysoké riziko (" + winRate + " %)"),
                        badgeClass: "advisor-warn",
                        text: tAdvA("advisor.text_battle_risk", { needed: needed, winRate: winRate }, "Tento protivník je nad tvé současné síly (potřebuješ hod **" + needed + "**, šance jen **" + winRate + " %**). Porážka tě zraní a pošle do Špitálu. Doporučuji raději ustoupit."),


                        actionPrompt: tAdvA("advisor.prompt_battle_risk", null, "Zvaz riziko")
                    };
                }
            }

            return {
                icon: "➡️",
                title: tAdvA("advisor.title", null, "Královský rádce"),
                badge: tAdvA("advisor.badge_turn_done", null, "Tah dokončen"),
                badgeClass: "advisor-tip",
                text: tAdvA("advisor.turn_done_text", null, "Všechny záležitosti na tomto poli jsou vyřízeny. Předej hrací kostku dalšímu rytíři."),
                actionPrompt: tAdvA("advisor.prompt_end_turn_btn", null, "Klepni na tlacitko Ukoncit tah.")
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
        var tPouch = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        if (player.activeScrolls) {
            if (player.activeScrolls.bonusRoll) actBuffs.push(tPouch("pouch.buff_roll", { val: player.activeScrolls.bonusRoll }, '⚡ +' + player.activeScrolls.bonusRoll + ' k hodu'));
            if (player.activeScrolls.forcedRoll) actBuffs.push(tPouch("pouch.buff_forced", { val: player.activeScrolls.forcedRoll }, '⭐ Zaručená ' + player.activeScrolls.forcedRoll));
            if (player.activeScrolls.combatBonus) actBuffs.push(tPouch("pouch.buff_combat", { val: player.activeScrolls.combatBonus }, '🧪 +' + player.activeScrolls.combatBonus + ' Boj'));
            if (player.activeScrolls.rentImmunity) actBuffs.push(tPouch("pouch.buff_rent", null, '👑 Ochrana nájmu'));
            if (player.activeScrolls.doubleBreeding) actBuffs.push(tPouch("pouch.buff_breeding", null, '🐑 2x Chov'));
        }

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
                tPouch("pouch.active_buffs", { buffs: actBuffs.join(', ') }, '✨ Aktivní: <strong>' + actBuffs.join(', ') + '</strong>') +
                '</div>';
        }

        html += '</div>';
        return html;
    }
    });
})();
