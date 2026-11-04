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

        this.setInputValue("gfx-tile-kun", this.graphicsConfig.tileBitmapsByType.kun || "");

        this.setInputValue("gfx-tile-pes", this.graphicsConfig.tileBitmapsByType.pes || "");

        this.setInputValue("gfx-tile-sokol", this.graphicsConfig.tileBitmapsByType.sokol || "");

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

        this.graphicsConfig.tileBitmapsByType.kun = document.getElementById("gfx-tile-kun").value.trim();

        this.graphicsConfig.tileBitmapsByType.pes = document.getElementById("gfx-tile-pes").value.trim();

        this.graphicsConfig.tileBitmapsByType.sokol = document.getElementById("gfx-tile-sokol").value.trim();

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

        if (modal.style.display === "flex") return; // Zabraňuje problikávání a opakovanému překreslování

        if (window.PRS_Audio) window.PRS_Audio.playFanfare();

        var winIdx = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;

        var winner = this.state.players[winIdx];

        var subEl = document.getElementById("victory-winner-subtitle");

        if (subEl) {

            var subText = "";

            var winType = this.state.winType || "";

            if (winType === "slayer_dragons") {

                subText = 'Rytíř <strong style="color:' + winner.color + '; font-size:1.15rem;">' + winner.badge + ' ' + this.escapeHtml(winner.name) + '</strong> skolil 2 obávané draky království a v ' + this.state.roundNumber + '. kole získává věčnou slávu i ruku princezny!';

            } else if (winType === "tycoon_estates") {

                subText = 'Rytíř <strong style="color:' + winner.color + '; font-size:1.15rem;">' + winner.badge + ' ' + this.escapeHtml(winner.name) + '</strong> ovládl 3 města i královský hrad a v ' + this.state.roundNumber + '. kole získává ruku princezny!';

            } else if (winType === "sole_survivor") {

                subText = 'Rytíř <strong style="color:' + winner.color + '; font-size:1.15rem;">' + winner.badge + ' ' + this.escapeHtml(winner.name) + '</strong> jako jediný přežil kruté nástrahy království v režimu Na život a smrt!';

            } else {

                var tgtH = (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : winner.totalHearts;

                subText = 'Rytíř <strong style="color:' + winner.color + '; font-size:1.15rem;">' + winner.badge + ' ' + this.escapeHtml(winner.name) + '</strong> dosáhl cílových <strong>' + tgtH + ' 💖</strong> (získal celkem ' + winner.totalHearts + ' 💖) a v ' + this.state.roundNumber + '. kole získává ruku princezny!';

            }

            subEl.innerHTML = subText;

        }

        // Vítěz MUSÍ být vždy na 1. místě žebříčku i pódia!

        var others = [];

        for (var pi = 0; pi < this.state.players.length; pi++) {

            if (pi !== winIdx) others.push(this.state.players[pi]);

        }

        others.sort(function (a, b) {

            if (b.totalHearts !== a.totalHearts) return b.totalHearts - a.totalHearts;

            return b.gold - a.gold;

        });

        var ranked = [winner].concat(others);

        var podEl = document.getElementById("victory-podium-content");

        if (podEl) {

            var podHtml = [];

            var ranks = [

                { rank: 1, title: "🏆 VÍTĚZ", cls: "podium-rank-1", badgeCls: "#fbbf24" },

                { rank: 2, title: "🥈 2. MÍSTO", cls: "podium-rank-2", badgeCls: "#94a3b8" },

                { rank: 3, title: "🥉 3. MÍSTO", cls: "podium-rank-3", badgeCls: "#d97706" }

            ];

            for (var r = 0; r < Math.min(3, ranked.length); r++) {

                var rp = ranked[r];

                var rInfo = ranks[r];

                podHtml.push('<div class="podium-card ' + rInfo.cls + '">');

                podHtml.push('  <span class="podium-rank-badge" style="background:rgba(212,175,55,0.2); color:' + rInfo.badgeCls + ';">' + rInfo.title + '</span>');

                podHtml.push('  <div style="font-size:1.75rem; margin:0.1rem 0;">' + rp.badge + '</div>');

                podHtml.push('  <div style="font-weight:bold; font-size:0.95rem; color:' + rp.color + '; margin-bottom:0.15rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:145px;" title="' + this.escapeHtml(rp.name) + '">' + this.escapeHtml(rp.name) + '</div>');

                podHtml.push('  <div style="font-size:1.2rem; font-weight:bold; color:#f472b6;">' + rp.totalHearts + ' 💖</div>');

                podHtml.push('  <small style="color:var(--text-muted); font-size:0.75rem;">' + rp.gold.toLocaleString("cs-CZ") + ' zl.</small>');

                podHtml.push('</div>');

            }

            podEl.innerHTML = podHtml.join("\n");

        }

        var tblEl = document.getElementById("victory-table-el");

        if (tblEl) {

            var tHtml = [];

            tHtml.push('<thead><tr>');

            tHtml.push('  <th>Pořadí</th>');

            tHtml.push('  <th>Rytíř</th>');

            tHtml.push('  <th style="color:#f472b6;">Srdce celkem</th>');

            tHtml.push('  <th>Slavnosti</th>');

            tHtml.push('  <th>Bojové úkoly</th>');

            tHtml.push('  <th>Chov zvířat</th>');

            tHtml.push('  <th>Měšec</th>');

            tHtml.push('  <th>Majetek celkem</th>');

            tHtml.push('</tr></thead><tbody>');

            for (var i = 0; i < ranked.length; i++) {

                var p = ranked[i];

                var wealth = p.gold;

                for (var it = 0; it < p.items.length; it++) wealth += (p.items[it].price || 0);

                for (var nd = 0; nd < p.ownedNodes.length; nd++) {

                    var nObj = this.state.board.nodes[p.ownedNodes[nd]];

                    if (nObj) wealth += window.PRS_GameEngine.getNodeInvestedValue(this.state, nObj);

                }

                tHtml.push('<tr>');

                tHtml.push('  <td><strong>#' + (i + 1) + '</strong></td>');

                tHtml.push('  <td><strong style="color:' + p.color + ';">' + p.badge + ' ' + this.escapeHtml(p.name) + '</strong> <small style="color:var(--text-muted);">(' + p.type + ')</small></td>');

                tHtml.push('  <td><strong style="color:#f472b6; font-size:1.05rem;">' + p.totalHearts + ' 💖</strong></td>');

                tHtml.push('  <td>' + p.stats.heartsFromFestivals + ' 💖 (' + p.stats.festivalsWon + 'x výhra)</td>');

                tHtml.push('  <td>' + p.stats.heartsFromQuests + ' 💖 (' + p.stats.questsWon + 'x skoleno)</td>');

                tHtml.push('  <td>' + (p.breedingHearts || 0) + ' 💖</td>');

                tHtml.push('  <td><strong style="color:var(--gold-light);">' + p.gold.toLocaleString("cs-CZ") + ' zl.</strong></td>');

                tHtml.push('  <td>' + wealth.toLocaleString("cs-CZ") + ' zl.</td>');

                tHtml.push('</tr>');

            }

            tHtml.push('</tbody>');

            tblEl.innerHTML = tHtml.join("\n");

        }

        var fb = document.getElementById("victory-cloud-feedback");

        if (fb) fb.textContent = "";

        modal.style.display = "flex";

        this.updateBodyModalClass();

    },

    closeVictoryModal: function () {

        var modal = document.getElementById("victory-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    saveVictoryToCloud: function () {

        var self = this;

        var fb = document.getElementById("victory-cloud-feedback");

        var btn = document.getElementById("btn-save-hall-of-fame");

        if (fb) fb.textContent = "Zapisuji vítězství do Síně slávy na MSSQL databázi...";

        if (btn) btn.disabled = true;

        var winIdx = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;

        var winner = this.state.players[winIdx];

        var payload = {

            sessionGuid: this.state.sessionGuid || ("v_" + Date.now()),

            roomCode: (this.state.sessionGuid ? this.state.sessionGuid.substring(0, 6).toUpperCase() : "VICTORY"),

            title: "Princeznino srdce - Vítězství: " + winner.name,

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

                    fb.innerHTML = (res && res.ok)

                        ? "✅ <strong>Skvělé! Vítězství bylo trvale zapsáno do Síně slávy na serveru (kód: " + (res.roomCode || "ULOŽENO") + ").</strong>"

                        : "✅ Partie uložena do databáze.";

                }

            })

            .catch(function () {

                if (btn) btn.disabled = false;

                if (fb) fb.textContent = "✅ Partie zaznamenána lokálně.";

            });

    },

    // --- KRÁLOVSKÁ ZBROJNICE A TRŽIŠTĚ (MODAL) ---,

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

        // Převod kódů slotů do přehledné češtiny pro zbrojnici, obchod i inventář,

    formatSlotLabel: function (slot, withIcon) {

        var s = (slot || "").toLowerCase();

        switch (s) {

            case "weapon": return withIcon ? "🗡️ Zbraň" : "Zbraň";

            case "armor": return withIcon ? "🛡️ Zbroj" : "Zbroj";

            case "dress": return withIcon ? "👗 Šaty & Plášť" : "Šaty & Plášť";

            case "jewel": return withIcon ? "💍 Klenot" : "Klenot";

            case "trophy": return withIcon ? "🏆 Trofej" : "Trofej";

            default: return withIcon ? "📦 Vybavení" : "Vybavení";

        }

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

                    var sellPrice = Math.round(it.price * itemRatio);

                    html.push('<div class="armory-card armory-card-tier-' + (it.tier || 1) + '">');

                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');

                    html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + (it.tier || 1) + '. stupeň</span>');

                    html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(it.slot, true) + '</span>');

                    html.push('  </div>');

                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + it.icon + ' ' + this.escapeHtml(it.name) + '</div>');

                    html.push('  <div style="margin-bottom:0.6rem;">');

                    if (it.boj) html.push('<span class="armory-stat-chip ' + (it.boj > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (it.boj > 0 ? '+' : '') + it.boj + ' Boj</span> ');

                    if (it.jizda) html.push('<span class="armory-stat-chip ' + (it.jizda > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (it.jizda > 0 ? '+' : '') + it.jizda + ' Jízda</span> ');

                    if (it.tanec) html.push('<span class="armory-stat-chip ' + (it.tanec > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (it.tanec > 0 ? '+' : '') + it.tanec + ' Tanec</span> ');

                    if (it.charisma) html.push('<span class="armory-stat-chip ' + (it.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (it.charisma > 0 ? '+' : '') + it.charisma + ' Charisma</span> ');

                    html.push('  </div>');

                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');

                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + sellPrice.toLocaleString("cs-CZ") + ' zl.</span>');

                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'item\', \'' + it.id + '\')">💰 Prodat</button>');

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

            if (item.boj) html.push('<span class="armory-stat-chip ' + (item.boj > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (item.boj > 0 ? '+' : '') + item.boj + ' Boj</span>');

            if (item.jizda) html.push('<span class="armory-stat-chip ' + (item.jizda > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (item.jizda > 0 ? '+' : '') + item.jizda + ' Jízda</span>');

            if (item.tanec) html.push('<span class="armory-stat-chip ' + (item.tanec > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (item.tanec > 0 ? '+' : '') + item.tanec + ' Tanec</span>');

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

        var horseBonus = (q.questTier !== "U1" && hasHorse) ? (1 + Math.floor(stats.jizda / 2)) : 0;

        var wRes = window.PRS_GameEngine.checkQuestWeakness(this.state, player, q, tacticObj);

        var weaknessBonus = wRes.exploited ? 2 : 0;

        var stanceBonus = 0;

        if (this.selectedDuelStance === "aggressive") stanceBonus = 2;

        else if (this.selectedDuelStance === "defensive") stanceBonus = -1;

        var basePower = stats.boj + animalBonus + horseBonus + tacticBonus + weaknessBonus + stanceBonus;

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

            if (tr.boj) trBonuses.push("⚔️+" + tr.boj);

            if (tr.jizda) trBonuses.push("🏇+" + tr.jizda);

            if (tr.tanec) trBonuses.push("💃+" + tr.tanec);

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

        html.push('        <div class="duel-fighter-role" style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</div>');

        html.push('        <div class="duel-fighter-stat">⚔️ ' + basePower + ' <small>stálá síla</small></div>');

        html.push('        <div class="duel-fighter-sub">Boj ' + stats.boj + (horseBonus > 0 ? ' + Kůň ' + horseBonus : '') + (animalBonus > 0 ? ' + Zvěř ' + animalBonus : '') + (tacticBonus > 0 ? ' + Taktika ' + tacticBonus : '') + (weaknessBonus > 0 ? ' + Slabina ' + weaknessBonus : '') + (stanceBonus !== 0 ? (stanceBonus > 0 ? ' + Postoj +' + stanceBonus : ' + Postoj ' + stanceBonus) : '') + '</div>');

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

            html.push('  <p style="font-size:1.05rem; color:#fef08a; margin-bottom:1rem;">');

            html.push('    ' + player.badge + ' <strong>' + this.escapeHtml(player.name) + '</strong> přemohl v souboji <strong>' + q.icon + ' ' + this.escapeHtml(q.name) + '</strong>!');

            html.push('  </p>');

            html.push('  <div style="font-size:0.9rem; color:#cbd5e1; margin-bottom:1rem;">');

            html.push('    Hod kostkou: 🎲 <strong>' + res.roll + '</strong> &nbsp;|&nbsp; Celková bojová síla: ⚔️ <strong>' + res.totalPower + '</strong> (vs. obtížnost ' + res.difficulty + ')');

            if (res.stanceName) html.push('    <div style="font-size:0.82rem; color:#fef08a; margin-top:3px;">Bojový postoj: <strong>' + this.escapeHtml(res.stanceName) + '</strong></div>');

            if (res.tacticName) html.push('    <div style="font-size:0.8rem; color:#86efac; margin-top:3px;">Použitá taktika: ' + this.escapeHtml(res.tacticName) + '</div>');

            if (res.weaknessExploited) html.push('    <div style="font-size:0.85rem; color:#fef08a; font-weight:700; margin-top:4px;">🎯 Využita slabina bestie (+2 k síle): ' + this.escapeHtml(res.weaknessReason) + '</div>');

            html.push('  </div>');

            html.push('  <div class="quest-bounty-badge-row" style="margin-bottom:1.25rem;">');

            html.push('    <span class="quest-bounty-pill quest-bounty-gold" style="font-size:1.05rem; padding:6px 16px;">💰 +' + res.goldWon.toLocaleString("cs-CZ") + ' zl.</span>');

            if (res.heartsWon > 0) {

                html.push('    <span class="quest-bounty-pill quest-bounty-heart" style="font-size:1.05rem; padding:6px 16px;">💖 +' + res.heartsWon + ' Srdce princezny</span>');

            }

            html.push('  </div>');

            if (res.trophyWon) {

                var tr = res.trophyWon;

                var statParts = [];

                if (tr.boj) statParts.push("⚔️ +" + tr.boj + " Boj");

                if (tr.jizda) statParts.push("🏇 +" + tr.jizda + " Jízda");

                if (tr.tanec) statParts.push("💃 +" + tr.tanec + " Tanec");

                if (tr.charisma) statParts.push("✨ +" + tr.charisma + " Charisma");

                html.push('  <div class="quest-trophy-ceremony-card">');

                html.push('    <div class="quest-trophy-ceremony-icon">' + tr.icon + '</div>');

                html.push('    <div class="quest-trophy-ceremony-name">🏆 Získána relikvie: ' + this.escapeHtml(tr.name) + '</div>');

                html.push('    <div class="quest-trophy-ceremony-stats">' + statParts.join(" &nbsp;•&nbsp; ") + '</div>');

                html.push('    <div class="quest-trophy-ceremony-desc">' + this.escapeHtml(tr.desc || "Vzácná trofej potvrzující slavný triumf rytíře.") + '</div>');

                html.push('    <div id="quest-trophy-equip-box">');

                if (tr.isEquipped) {

                    html.push('      <span style="color:#86efac; font-weight:700; font-size:0.88rem;">✅ Trofej je automaticky nasazena v 5. slotu zbrojnice!</span>');

                } else {

                    html.push('      <button class="quest-btn-equip-trophy" onclick="PRS_App.equipDuelTrophyNow(\'' + tr.id + '\')">👑 Nasadit trofej do 5. slotu zbrojnice</button>');

                }

                html.push('    </div>');

                html.push('  </div>');

            }

            if (res.lootWon) {

                var loot = res.lootWon;

                html.push('  <div style="background:rgba(212,175,55,0.15); border:1px solid #d4af37; border-radius:8px; padding:0.6rem; max-width:380px; margin:0 auto 1rem auto; font-size:0.86rem; color:#fef08a;">');

                html.push('    🎁 Nalezena vzácná výbava: <strong>' + loot.icon + ' ' + this.escapeHtml(loot.name) + '</strong> (uložena do zbrojnice)!');

                html.push('  </div>');

            }

            html.push('  <button class="quest-btn-continue" onclick="PRS_App.closeQuestDuelModal()">🏆 Sláva vítězům (Pokračovat ve hře)</button>');

        } else {

            html.push('  <div class="quest-ceremony-banner loss">💀 PORÁŽKA V SOUBOJI</div>');

            html.push('  <p style="font-size:1.02rem; color:#fca5a5; margin-bottom:1rem;">');

            html.push('    <strong>' + q.icon + ' ' + this.escapeHtml(q.name) + '</strong> byl nad síly rytíře (Hod: 🎲 ' + res.roll + ', Síla ' + res.totalPower + ' vs. ' + res.difficulty + ').');

            if (res.weaknessExploited) html.push('    <div style="font-size:0.82rem; color:#fde047; margin-top:4px;">🎯 Využil jsi slabinu bestie (+2 k síle: ' + this.escapeHtml(res.weaknessReason) + '), ale hod kostkou bohužel nestačil.</div>');

            html.push('  </p>');

            if (res.canTacticalReroll) {

                html.push('  <div style="background:rgba(245,158,11,0.22); border:1.5px dashed #f59e0b; border-radius:10px; padding:0.85rem; max-width:440px; margin:0 auto 1.15rem auto;">');

                html.push('    <div style="font-weight:bold; color:#fef08a; font-size:0.92rem; margin-bottom:0.3rem;">🎯 Šance na taktický opravný hod!</div>');

                html.push('    <div style="font-size:0.82rem; color:#fde68a; margin-bottom:0.6rem;">Prohrál jsi o pouhé ' + (res.difficulty - res.totalPower) + ' body! Tvé zkušenosti a lovecká zvířata ti umožňují hodit kostkou ještě jednou.</div>');

                html.push('    <button class="quest-btn-roll-action" style="background:linear-gradient(135deg, #f59e0b, #d97706); font-size:0.92rem; padding:0.5rem 1.15rem; margin:0;" onclick="PRS_App.executeTacticalReroll()">🎲 Taktický opravný hod (Reroll 1 kostky)</button>');

                html.push('  </div>');

            }

            if (res.preventedHospital) {

                html.push('  <div style="background:rgba(16,185,129,0.18); border:1.5px solid #10b981; border-radius:10px; padding:0.85rem; max-width:440px; margin:0 auto 1.25rem auto; color:#86efac; font-size:0.88rem;">');

                html.push('    🧪 <strong>Záchrana lektvarem!</strong> Díky vypitému elixíru z Lazaretu neutrpěl rytíř fatální zranění a nemusí do Špitálu. Může ihned pokračovat ve hře!');

                html.push('  </div>');

            } else if (q.questTier === "U1") {

                html.push('  <div style="background:rgba(239,68,68,0.18); border:1.5px solid #ef4444; border-radius:10px; padding:0.85rem; max-width:440px; margin:0 auto 1.25rem auto; color:#fca5a5; font-size:0.88rem;">');

                html.push('    🐗 Zvíře uniklo do hlubokého lesa. Ošetření lehkých ran stálo rytíře zlaťáky.');

                html.push('  </div>');

            } else {

                html.push('  <div style="background:rgba(239,68,68,0.22); border:1.5px solid #ef4444; border-radius:10px; padding:0.85rem; max-width:440px; margin:0 auto 1.25rem auto; color:#fca5a5; font-size:0.88rem;">');

                html.push('    🏥 Raněný rytíř byl převezen do Královského lazaretu (Špitál), kde se 1 tah léčí ze svých zranění.');

                html.push('  </div>');

            }

            html.push('  <button class="quest-btn-continue" onclick="PRS_App.closeQuestDuelModal()">Pokračovat ve hře</button>');

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

        var fType = pa.festivalType || "turnaj";

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

            if (fType === "turnaj") {

                eligible = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) || (st.horses >= 1 && (st.hasWeapon || st.hasArmor));

                var setB = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) ? 3 : 0;

                var baseB = st.boj + st.jizda + setB;

                bonusText = "⚔️ Boj: " + st.boj + " | 🏇 Jízda: " + st.jizda + (setB ? " | 🐕🦅 Set: +3" : "") + " (Základ: +" + baseB + ")";

            } else if (fType === "ples") {

                eligible = st.hasDress || st.tanec >= 1;

                var dressB = st.hasDress ? 2 : 0;

                var baseB = st.tanec + st.charisma + dressB;

                bonusText = "💃 Tanec: " + st.tanec + " | ✨ Charisma: " + st.charisma + (dressB ? " | 👗 Šaty: +2" : "") + " (Základ: +" + baseB + ")";

            } else if (fType === "zavod") {

                eligible = st.horses >= 1;

                var horseB = Math.min(3, st.horses);

                var baseB = (st.jizda * 2) + horseB;

                bonusText = "🏇 2× Jízda: " + (st.jizda * 2) + " | 🐎 Koně: +" + horseB + " (Základ: +" + baseB + ")";

            }

            if (eligible) {

                contestants.push({ player: p, stats: st, bonusText: bonusText });

            } else {

                var reason = (fType === "turnaj") ? "Nemá potřebná zvířata / zbroj" : ((fType === "ples") ? "Nemá slavnostní šaty ani tanec" : "Nemá žádného koně");

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

    toggleChanceCardFlip: function (cardId) {

        if (this.flippedChanceCardId === cardId) {

            this.flippedChanceCardId = null;

        } else {

            this.flippedChanceCardId = cardId;

            if (window.PRS_Audio) window.PRS_Audio.playItem();

        }

        this.renderActionPanel();

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

        var res = window.PRS_GameEngine.executeAnimalBuyout(this.state, nodeId);

        if (res) {

            if (window.PRS_Audio) window.PRS_Audio.playBuy();

            this.renderGameScreen();

            this.saveSessionAuto();

        }

    },

    openIntrigueModal: function (type) {

        var self = this;

        var modal = document.getElementById("generic-modal");

        if (!modal) return;

        var p = self.state.players[self.state.currentPlayerIndex];

        var targets = [];

        for (var i = 0; i < self.state.players.length; i++) {

            var pl = self.state.players[i];

            if (pl.index !== p.index && !pl.isEliminated) targets.push(pl);

        }

        var isBallad = (type === "ballad");

        var cost = isBallad ? (self.state.pendingAction.intrigueBalladCost || 750) : (self.state.pendingAction.intrigueCustomsCost || 600);

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid var(--gold); border-radius:14px; text-align:center;">' +

            '<div style="font-size:2rem; margin-bottom:0.25rem;">' + (isBallad ? '🎭 🃏' : '📜 ⚖️') + '</div>' +

            '<h3 style="font-family:Cinzel,serif; color:var(--gold-light); margin:0 0 0.5rem 0;">' + (isBallad ? 'Posměšná balada pod balkónem' : 'Královská celní kontrola') + '</h3>' +

            '<p style="font-size:0.84rem; color:var(--text-muted); margin-bottom:1rem;">' +

            (isBallad ? 'Kejklíř složí uštěpačnou píseň o vybraném soupeři (souboj Charisma + 1d6). Úspěch: soupeř ztrácí 💖 a ty získáváš dvorskou přízeň! Cena: ' + cost + ' zl.' : 'Zvol soupeře, jehož panství budou na 1 kolo zmrazena celní kontrolou (nikdo mu neplatí nájem). Cena: ' + cost + ' zl.') +

            '</p>' +

            '<div style="display:flex; flex-direction:column; gap:0.5rem;">';

        for (var t = 0; t < targets.length; t++) {

            var tgt = targets[t];

            html += '<button class="btn-gold-lg" style="text-align:left; padding:0.6rem 0.85rem;" onclick="PRS_App.confirmPlotIntrigue(\'' + type + '\', ' + tgt.index + ')">' +

                tgt.badge + ' <strong>' + self.escapeHtml(tgt.name) + '</strong> (' + tgt.totalHearts + ' 💖, Charisma ' + tgt.skills.charisma + ')' +

                '</button>';

        }

        html += '</div>' +

            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="document.getElementById(\'generic-modal\').style.display=\'none\'">Zrušit</button>' +

            '</div>';

        modal.innerHTML = html;

        modal.style.display = "flex";

    },

    confirmPlotIntrigue: function (type, targetIdx) {

        var modal = document.getElementById("generic-modal");

        if (modal) modal.style.display = "none";

        var res = window.PRS_GameEngine.executePlotIntrigue(this.state, type, targetIdx);

        if (res) {

            if (window.PRS_Audio) window.PRS_Audio.playNotice();

            this.renderGameScreen();

            this.saveSessionAuto();

        }

    },

    openTradePactModal: function () {

        var self = this;

        var modal = document.getElementById("generic-modal");

        if (!modal) return;

        var p = self.state.players[self.state.currentPlayerIndex];

        var cost = self.state.pendingAction.tradePactCost || 750;

        // Najdi nejvyšší počet Srdcí pro kontrolu pravidla proti lídrovi

        var maxHearts = 0;

        for (var h = 0; h < self.state.players.length; h++) {

            if (self.state.players[h].totalHearts > maxHearts) maxHearts = self.state.players[h].totalHearts;

        }

        var partners = [];

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

        html += '</div>' +

            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="document.getElementById(\'generic-modal\').style.display=\'none\'">Zrušit</button>' +

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

        var modal = document.getElementById("generic-modal");

        if (!modal) return;

        var p = self.state.players[self.state.currentPlayerIndex];

        var stake = self.state.pendingAction.festivalChallengeStake || 750;

        var rivals = [];

        for (var i = 0; i < self.state.players.length; i++) {

            var pl = self.state.players[i];

            if (pl.index !== p.index && !pl.isEliminated) rivals.push(pl);

        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #ec4899; border-radius:14px; text-align:center;">' +

            '<div style="font-size:2rem; margin-bottom:0.25rem;">🏆 🤺</div>' +

            '<h3 style="font-family:Cinzel,serif; color:#fbcfe8; margin:0 0 0.5rem 0;">Osobní výzva na Slavnosti</h3>' +

            '<p style="font-size:0.84rem; color:#fce7f3; margin-bottom:1rem;">' +

            'Zvol rivala a disciplínu (hod 1d6 + hodnota ctnosti). Vítěz získá <strong>' + stake + ' zl.</strong> a <strong>+0,5 💖</strong> slávy!' +

            '</p>' +

            '<div style="display:flex; flex-direction:column; gap:0.6rem;">';

        for (var r = 0; r < rivals.length; r++) {

            var riv = rivals[r];

            html += '<div style="background:rgba(0,0,0,0.35); border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:0.55rem; text-align:left;">' +

                '<div style="font-weight:700; color:#fbcfe8; margin-bottom:4px;">' + riv.badge + ' ' + self.escapeHtml(riv.name) + ' (' + riv.totalHearts + ' 💖)</div>' +

                '<div style="display:flex; gap:4px;">' +

                '  <button class="btn-secondary" style="flex:1; font-size:0.78rem; padding:0.35rem;" onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'boj\')">⚔️ Boj (' + riv.skills.boj + ')</button>' +

                '  <button class="btn-secondary" style="flex:1; font-size:0.78rem; padding:0.35rem;" onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'jizda\')">🏇 Jízda (' + riv.skills.jizda + ')</button>' +

                '  <button class="btn-secondary" style="flex:1; font-size:0.78rem; padding:0.35rem;" onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'tanec\')">💃 Tanec (' + riv.skills.tanec + ')</button>' +

                '</div>' +

                '</div>';

        }

        html += '</div>' +

            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="document.getElementById(\'generic-modal\').style.display=\'none\'">Zrušit</button>' +

            '</div>';

        modal.innerHTML = html;

        modal.style.display = "flex";

    },

    confirmFestivalChallenge: function (rivalIdx, discipline) {

        var modal = document.getElementById("generic-modal");

        if (modal) modal.style.display = "none";

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

        var isDraw = res.isDraw;

        var p1Won = (res.winnerIndex === p1.index);

        var p2Won = (res.winnerIndex === p2.index);

        var statName = isFestival ? (res.discipline === "jizda" ? "🏇 Jízda" : (res.discipline === "tanec" ? "💃 Tanec" : "⚔️ Boj")) : "⚔️ Boj";

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

        html.push('<button class="btn-gold-lg" style="width:100%; padding:0.75rem; font-size:1.02rem;" onclick="PRS_App.closeKnightDuelModal()">⚔️ Pokračovat ve hře</button>');

        bodyEl.innerHTML = html.join("\n");

        modal.style.display = "flex";

        this.updateBodyModalClass();

        if (window.PRS_Audio) {

            window.PRS_Audio.playSword();

            if (p1Won && p1.type === "Human") {

                setTimeout(function () { if (window.PRS_Audio) window.PRS_Audio.playFanfare(); }, 300);

            }

        }

    },

    closeKnightDuelModal: function () {

        var modal = document.getElementById("knight-duel-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

        this.scheduleBotTurnIfNeeded();

    }
    });
})();
