// ============================================================================
// KiDesky: Princeznino srdce - Královská zbrojnice, Tržiště výbavy a stavové příznaky
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
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

        var tArmM = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
        var plDispArm = this.getPlayerDisplayName ? this.getPlayerDisplayName(player) : player.name;
        var plGoldStrArm = window.PRS_I18n ? window.PRS_I18n.formatGold(player.gold) : (player.gold.toLocaleString("cs-CZ") + " zl.");

        // Informace o rytíři a měšci
        var infoEl = document.getElementById("armory-player-info");
        if (infoEl) {
            infoEl.innerHTML = tArmM("modals.armory_view.knight_label", null, "Rytíř:") + ' <strong style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(plDispArm) + '</strong> &nbsp;|&nbsp; ' + tArmM("modals.armory_view.purse_label", null, "V měšci:") + ' <strong style="color:var(--gold-light); font-size:1.05rem;">' + plGoldStrArm + '</strong>';
        }

        // Status obchodníka
        var statusEl = document.getElementById("armory-merchant-status-badge");
        if (statusEl) {
            if (canShop) {
                statusEl.innerHTML = '<span style="color:#86efac; font-weight:bold; background:rgba(34,197,94,0.18); border:1px solid #22c55e; padding:3px 9px; border-radius:6px;">' + tArmM("modals.armory_view.status_can_shop", null, "🏪 Stojíš u Obchodníka – Nákup i výkup aktivní!") + '</span>';
            } else if (isAtMerchant) {
                statusEl.innerHTML = '<span style="color:#fde047; background:rgba(234,179,8,0.18); border:1px solid #eab308; padding:3px 9px; border-radius:6px;">' + tArmM("modals.armory_view.status_at_merchant", null, "⚖️ Jsi na poli Obchodníka") + '</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#94a3b8; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:3px 9px; border-radius:6px;">' + tArmM("modals.armory_view.status_browse", null, "👀 Prohlídka katalogu (k nákupu musíš vstoupit na pole Obchodník)") + '</span>';
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

        var tArm = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
        var fmtGoldArm = function (n) { return window.PRS_I18n ? window.PRS_I18n.formatGold(n) : (n.toLocaleString("cs-CZ") + " zl."); };
        var html = [];

        // 1. ZÁLOŽKA VÝKUP MAJETKU (Prodej věcí za 50% / budov za 100% u obchodníka)
        if (tab === "sell") {
            var rates = this.state.config.sellRates;
            var itemRatio = isAtMerchant ? rates.merchantItem : rates.anywhereItem;
            var bldRatio = isAtMerchant ? rates.merchantBuilding : rates.anywhereBuilding;
            var itemPct = Math.round(itemRatio * 100);
            var bldPct = Math.round(bldRatio * 100);

            html.push('<div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">');
            html.push('  <div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:0.6rem 0.8rem; font-size:0.83rem;">');
            html.push('    <strong>' + tArm("modals.armory_view.sell_rate_label", null, "Kurz výkupu:") + '</strong> ' + (isAtMerchant
                ? tArm("modals.armory_view.sell_rate_merchant", { itemPct: itemPct, bldPct: bldPct }, "🌟 Zlatý kurz na trhu: <strong>" + itemPct + " %</strong> z ceny předmětů, <strong>" + bldPct + " %</strong> z investic do budov!")
                : tArm("modals.armory_view.sell_rate_road", { itemPct: itemPct, bldPct: bldPct }, "Běžný výkup na cestě: " + itemPct + " % věci, " + bldPct + " % budovy.")));
            html.push('  </div>');
            html.push('</div>');

            if (player.items.length === 0 && player.ownedNodes.length === 0) {
                html.push('<div style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-muted);">' + tArm("modals.armory_view.sell_empty", null, "Tvůj inventář je prázdný, nemáš co prodat.") + '</div>');
            } else {
                // Seznam předmětů k prodeji
                for (var i = 0; i < player.items.length; i++) {
                    var it = player.items[i];
                    var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                                  (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);
                    var rawItemName = it.name || (baseDef ? baseDef.name : tArm("modals.armory_view.unknown_item", null, "Neznámý předmět"));
                    var itemName = this.getItemDisplayName ? this.getItemDisplayName(it) : rawItemName;
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
                    html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + tArm("modals.armory_view.tier_short", { tier: itemTier }, itemTier + ". stupeň") + '</span>');
                    html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(itemSlot, true) + '</span>');
                    html.push('  </div>');
                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + itemIcon + ' ' + this.escapeHtml(itemName) + '</div>');
                    html.push('  <div style="margin-bottom:0.6rem;">');
                    if (itCombat) html.push('<span class="armory-stat-chip ' + (itCombat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (itCombat > 0 ? '+' : '') + itCombat + ' ' + tArm("skills.combat", null, "Boj") + '</span> ');
                    if (itRiding) html.push('<span class="armory-stat-chip ' + (itRiding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (itRiding > 0 ? '+' : '') + itRiding + ' ' + tArm("skills.riding", null, "Jízda") + '</span> ');
                    if (itDance) html.push('<span class="armory-stat-chip ' + (itDance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (itDance > 0 ? '+' : '') + itDance + ' ' + tArm("skills.dance", null, "Tanec") + '</span> ');
                    if (itCharisma) html.push('<span class="armory-stat-chip ' + (itCharisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (itCharisma > 0 ? '+' : '') + itCharisma + ' ' + tArm("skills.charisma", null, "Charisma") + '</span> ');
                    html.push('  </div>');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');
                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + fmtGoldArm(sellPrice) + '</span>');
                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'item\', \'' + (it.uid || it.id) + '\')">' + tArm("modals.armory_view.btn_sell_item", null, "💰 Prodat") + '</button>');
                    html.push('  </div>');
                    html.push('</div>');
                }

                // Nemovitosti k prodeji
                for (var b = 0; b < player.ownedNodes.length; b++) {
                    var bNode = this.state.board.nodes[player.ownedNodes[b]];
                    if (!bNode) continue;
                    var invested = window.PRS_GameEngine.getNodeInvestedValue(this.state, bNode);
                    var bSellPrice = Math.round(invested * bldRatio);
                    var bNodeName = this.translateDynamicName ? this.translateDynamicName(bNode.name) : bNode.name;

                    html.push('<div class="armory-card" style="border-top:3.5px solid #22c55e;">');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
                    html.push('    <span class="armory-badge-tier" style="background:rgba(34,197,94,0.18); color:#86efac;">' + tArm("modals.armory_view.estate_badge", null, "Nemovitost") + '</span>');
                    html.push('    <span style="font-size:0.75rem; color:var(--text-muted);">' + bNode.code + '</span>');
                    html.push('  </div>');
                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + bNode.icon + ' ' + this.escapeHtml(bNodeName) + '</div>');
                    html.push('  <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.6rem;">' + tArm("modals.armory_view.invested_total", { val: fmtGoldArm(invested) }, "Investováno celkem: " + fmtGoldArm(invested)) + '</div>');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');
                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + fmtGoldArm(bSellPrice) + '</span>');
                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'node\', ' + bNode.id + ')">' + tArm("modals.armory_view.btn_sell_node", null, "🏦 Prodat") + '</button>');
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
                { tier: 1, name: tArm("modals.armory_view.pack_1_name", null, "Balíček Věci 1. stupně"), icon: "🎒", price: packs.tier1, desc: tArm("modals.armory_view.pack_1_desc", null, "Základní rytířská výzbroj (tesáky, prošívané zbroje, kabátce, ostruhy).") },
                { tier: 2, name: tArm("modals.armory_view.pack_2_name", null, "Balíček Věci 2. stupně"), icon: "⚔️", price: packs.tier2, desc: tArm("modals.armory_view.pack_2_desc", null, "Turnajové dřevce, damaškové meče, plátová zbroj, brokátové róby.") },
                { tier: 3, name: tArm("modals.armory_view.pack_3_name", null, "Balíček Věci 3. stupně"), icon: "👑", price: packs.tier3, desc: tArm("modals.armory_view.pack_3_desc", null, "Královské legendární předměty: Meč dračího bijce, zlatá zbroj, knížecí šat.") }
            ];

            for (var p = 0; p < packDefs.length; p++) {
                var pk = packDefs[p];
                var canAfford = player.gold >= pk.price;
                var pkPriceStr = fmtGoldArm(pk.price);

                html.push('<div class="armory-card armory-card-tier-' + pk.tier + '">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
                html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + tArm("modals.armory_view.tier_upper", { tier: pk.tier }, pk.tier + ". STUPEŇ") + '</span>');
                html.push('    <span style="font-size:0.8rem; color:#fde047; font-weight:bold;">' + pkPriceStr + '</span>');
                html.push('  </div>');
                html.push('  <div style="font-size:1.1rem; font-weight:bold; color:#fff; margin-bottom:0.35rem;">' + pk.icon + ' ' + pk.name + '</div>');
                html.push('  <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.85rem;">' + pk.desc + '</p>');
                html.push('  <div style="margin-top:auto;">');

                if (!canShop) {
                    html.push('    <button class="btn-secondary" disabled style="width:100%; opacity:0.45; font-size:0.82rem;">' + tArm("modals.armory_view.btn_merchant_only", null, "Jen u Obchodníka") + '</button>');
                } else if (!canAfford) {
                    html.push('    <button class="btn-action-buy" disabled style="width:100%; opacity:0.4; font-size:0.82rem;">' + tArm("modals.armory_view.btn_no_gold", null, "Nedostatek zlata") + '</button>');
                } else {
                    html.push('    <button class="btn-action-buy" style="width:100%; font-size:0.85rem;" onclick="PRS_App.handleBuyPackFromArmory(' + pk.tier + ')">' + tArm("modals.armory_view.btn_buy_pack", { price: pkPriceStr }, "🎁 Koupit balíček (" + pkPriceStr + ")") + '</button>');
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
            var taxBonusStr = fmtGoldArm(st.livestockTaxBonus || 0);

            html.push('<div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">');
            html.push('  <div style="background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:8px; padding:0.65rem 0.85rem; font-size:0.83rem;">');
            html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; flex-wrap:wrap; gap:6px;">');
            html.push('      <span style="font-size:0.92rem; font-weight:700; color:var(--gold-light);">' + tArm("modals.armory_view.pastures_title", null, "🌾 Pastviny a královské stáje") + '</span>');
            html.push('      <span style="color:#fde047; font-weight:700;">' + tArm("modals.armory_view.livestock_tax_gain", { val: taxBonusStr }, "Daňový zisk z chovu: +" + taxBonusStr) + '</span>');
            html.push('    </div>');
            html.push('    <div style="color:#cbd5e1; font-size:0.77rem; line-height:1.4;">');
            html.push('      ' + tArm("modals.armory_view.livestock_capacity", { count: st.extraLivestockCount, cap: st.livestockCapacity, cattle: (st.cattle || 0), sheep: (st.sheep || 0), pigs: (st.pigs || 0) }, "Kapacita přikoupených stád: <strong style=\"color:#4ade80;\">" + st.extraLivestockCount + " / " + st.livestockCapacity + " ks</strong> &nbsp;|&nbsp; Celkový chov: 🐄 " + (st.cattle || 0) + " krav, 🐑 " + (st.sheep || 0) + " ovcí, 🐖 " + (st.pigs || 0) + " prasat."));
            html.push('      <br><small style="color:#94a3b8;">' + tArm("modals.armory_view.livestock_hint", null, "Každá 🏡 Vesnice poskytuje +3 pastviny (a automaticky chová 1★ 🐑, 2★ 🐖, 3★ 🐄), 🏛️ Město +2 pastviny a 🏠 Stáje +4 pastviny. Dobytek trvale zvyšuje daň u Výběrčího daní i mýtné na tvých vesnicích!") + '</small>');
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
                { id: "sheep", name: tArm("modals.armory_view.sheep_name", null, "Chovná ovce"), icon: "🐑", price: sPr, taxBonus: sTx, rentBonus: sRn, desc: tArm("modals.armory_view.sheep_desc", { tax: fmtGoldArm(sTx), rent: fmtGoldArm(sRn) }, "Nenáročný chov pro pastviny. Trvale zvyšuje daň u Výběrčího daní o +" + fmtGoldArm(sTx) + " a mýtné tvých vesnic o +" + fmtGoldArm(sRn) + ".") },
                { id: "pigs", name: tArm("modals.armory_view.pigs_name", null, "Královské prase"), icon: "🐖", price: pPr, taxBonus: pTx, rentBonus: pRn, desc: tArm("modals.armory_view.pigs_desc", { tax: fmtGoldArm(pTx), rent: fmtGoldArm(pRn) }, "Tučný výnos pro osady. Trvale zvyšuje daň u Výběrčího daní o +" + fmtGoldArm(pTx) + " a mýtné tvých vesnic o +" + fmtGoldArm(pRn) + ".") },
                { id: "cattle", name: tArm("modals.armory_view.cattle_name", null, "Ušlechtilý skot (Kráva)"), icon: "🐄", price: cPr, taxBonus: cTx, rentBonus: cRn, desc: tArm("modals.armory_view.cattle_desc", { tax: fmtGoldArm(cTx), rent: fmtGoldArm(cRn) }, "Špičkový velký dobytek. Trvale zvyšuje daň u Výběrčího daní o +" + fmtGoldArm(cTx) + " a mýtné tvých vesnic o +" + fmtGoldArm(cRn) + ".") }
            ];

            for (var c = 0; c < catalog.length; c++) {
                var catItem = catalog[c];
                var canAfford = player.gold >= catItem.price;

                html.push('<div class="armory-card armory-card-tier-2" style="display:flex; flex-direction:column; justify-content:space-between;">');
                html.push('  <div>');
                html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
                html.push('      <span class="armory-badge-tier" style="background:rgba(74,222,128,0.18); color:#86efac;">' + tArm("modals.armory_view.badge_livestock", null, "Hospodářský chov") + '</span>');
                html.push('      <span class="armory-slot-badge">' + tArm("modals.armory_view.slot_animal", null, "🌾 Zvíře") + '</span>');
                html.push('    </div>');
                html.push('    <div style="font-weight:bold; font-size:1.05rem; color:#f8fafc; margin-bottom:0.35rem;">' + catItem.icon + ' ' + catItem.name + '</div>');
                html.push('    <p style="font-size:0.77rem; color:#cbd5e1; margin-bottom:0.6rem; line-height:1.35;">' + catItem.desc + '</p>');
                html.push('    <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.75rem;">');
                html.push('      <span class="armory-stat-chip armory-stat-pos">' + tArm("modals.armory_view.chip_per_tax", { val: fmtGoldArm(catItem.taxBonus) }, "💰 +" + fmtGoldArm(catItem.taxBonus) + " / daň") + '</span>');
                html.push('      <span class="armory-stat-chip armory-stat-pos">' + tArm("modals.armory_view.chip_per_rent", { val: fmtGoldArm(catItem.rentBonus) }, "🏡 +" + fmtGoldArm(catItem.rentBonus) + " / mýto") + '</span>');
                html.push('    </div>');
                html.push('  </div>');

                html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.06);">');
                html.push('    <span style="font-size:0.95rem; color:var(--gold-light); font-weight:bold;">' + fmtGoldArm(catItem.price) + '</span>');

                if (st.livestockCapacity <= 0) {
                    html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.5;" title="' + tArm("modals.armory_view.btn_no_pastures_title", null, "Kup nejprve Vesnici, Město nebo Stáje") + '">' + tArm("modals.armory_view.btn_no_pastures", null, "Nemáš pastviny") + '</button>');
                } else if (!canBuyMore) {
                    html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.5;" title="' + tArm("modals.armory_view.btn_pastures_full_title", null, "Pastviny jsou plné") + '">' + tArm("modals.armory_view.btn_pastures_full", null, "Pastviny plné") + '</button>');
                } else if (!canShopAnimals) {
                    html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.45;" title="' + tArm("modals.armory_view.btn_at_merchant_stables_title", null, "K nákupu musíš stát na poli Obchodník nebo Stáje") + '">' + tArm("modals.armory_view.btn_at_merchant_stables", null, "U Obchodníka / Stájí") + '</button>');
                } else if (!canAfford) {
                    html.push('    <button class="btn-action-buy" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.4;">' + tArm("modals.armory_view.btn_low_gold", null, "Málo zlata") + '</button>');
                } else {
                    html.push('    <button class="btn-action-buy" style="padding:0.32rem 0.75rem; font-size:0.84rem; cursor:pointer;" onclick="PRS_App.handleBuyLivestock(\'' + catItem.id + '\')">' + tArm("modals.armory_view.btn_buy_animal", { icon: catItem.icon }, "🛒 Koupit " + catItem.icon) + '</button>');
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
            var itemDispName = this.getItemDisplayName ? this.getItemDisplayName(item) : item.name;

            html.push('<div class="armory-card armory-card-tier-' + (item.tier || 1) + '">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
            html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + tArm("modals.armory_view.tier_short", { tier: (item.tier || 1) }, (item.tier || 1) + ". stupeň") + '</span>');
            html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(item.slot, true) + '</span>');
            html.push('  </div>');
            html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.4rem;">' + item.icon + ' ' + this.escapeHtml(itemDispName) + '</div>');
            html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.3rem; margin-bottom:0.75rem;">');

            if (item.combat) html.push('<span class="armory-stat-chip ' + (item.combat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (item.combat > 0 ? '+' : '') + item.combat + ' ' + tArm("skills.combat", null, "Boj") + '</span>');
            if (item.riding) html.push('<span class="armory-stat-chip ' + (item.riding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (item.riding > 0 ? '+' : '') + item.riding + ' ' + tArm("skills.riding", null, "Jízda") + '</span>');
            if (item.dance) html.push('<span class="armory-stat-chip ' + (item.dance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (item.dance > 0 ? '+' : '') + item.dance + ' ' + tArm("skills.dance", null, "Tanec") + '</span>');
            if (item.charisma) html.push('<span class="armory-stat-chip ' + (item.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (item.charisma > 0 ? '+' : '') + item.charisma + ' ' + tArm("skills.charisma", null, "Charisma") + '</span>');

            html.push('  </div>');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.06);">');
            html.push('    <span style="font-size:0.92rem; color:var(--gold-light); font-weight:bold;">' + fmtGoldArm(item.price) + '</span>');

            if (isOwned) {
                html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.65; cursor:default;">' + tArm("modals.armory_view.btn_owned", null, "✓ Vlastníš") + '</button>');
            } else if (!canShop) {
                html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.45;">' + tArm("modals.armory_view.btn_market_only", null, "Jen na trhu") + '</button>');
            } else if (!canAfford) {
                html.push('    <button class="btn-action-buy" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.4;">' + tArm("modals.armory_view.btn_low_gold", null, "Málo zlata") + '</button>');
            } else {
                html.push('    <button class="btn-action-buy" style="padding:0.32rem 0.7rem; font-size:0.82rem;" onclick="PRS_App.handleBuySpecificItem(\'' + item.id + '\')">' + tArm("modals.armory_view.btn_buy_item", null, "🛒 Koupit") + '</button>');
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

    
    isSavingSession: false
    });
})();
