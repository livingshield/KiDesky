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

    
    isSavingSession: false
    });
})();
