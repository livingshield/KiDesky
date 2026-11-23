// ============================================================================
// KiDesky: Princeznino srdce - Jádro enginu: herní akce hráče (nákupy, vězení, špitál, hospoda, konec tahu)
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_GameEngine) window.PRS_GameEngine = {};

    Object.assign(window.PRS_GameEngine, {

    buyCurrentNode: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canBuyNode) return false;

        var player = state.players[state.currentPlayerIndex];

        var node = state.board.nodes[pa.nodeId];

        var price = pa.buyPrice;

        if (player.gold < price || node.owner !== null) return false;

        player.gold -= price;

        node.owner = player.index;

        if (node.type === "VILLAGE") node.villageLevel = 1;

        player.ownedNodes.push(node.id);
        this.sortPlayerOwnedNodes(player, state);

        pa.canBuyNode = false;

        var currSuffix = window.PRS_I18n ? window.PRS_I18n.t("ui.common.gold_short", null, "zl.") : "zl.";
        if (window.PRS_I18n) {
            pa.summary = window.PRS_I18n.t("engine.bought_estate_summary", { estate: node.name, cost: price, currency: currSuffix }, "Zakoupil jsi **" + node.name + "** za " + price + " zl.");
        } else {
            pa.summary = "Zakoupil jsi **" + node.name + "** za " + price + " zl.";
        }

        if (node.type === "CASTLE") {
            var cTitle = window.PRS_I18n ? window.PRS_I18n.t("engine.castle_bought_log", { badge: player.badge, player: player.name, castle: node.name }) : ("👑 " + player.badge + " " + player.name + " se stává svrchovaným pánem velkolepé pevnosti **" + node.name + "** a získává královský šlechtický titul!");
            this.addLog(state, cTitle, "win", { key: "engine.castle_bought_log", params: { badge: player.badge, player: player.name, castle: node.name } });
        } else {
            var bLog = window.PRS_I18n ? window.PRS_I18n.t("engine.estate_bought_log", { badge: player.badge, player: player.name, estate: node.name, cost: price, currency: currSuffix }) : ("📜 " + player.badge + " " + player.name + " zakoupil **" + node.name + "** za " + price + " zl.");
            this.addLog(state, bLog, "buy", { key: "engine.estate_bought_log", params: { badge: player.badge, player: player.name, estate: node.name, cost: price, currency: currSuffix } });
        }

        this.recalculateBreedingAndVictory(state);

        return true;

    },


    // Povýšení vesnice (Malá -> Střední -> Velká),

    upgradeVillage: function (state, nodeId) {

        var player = state.players[state.currentPlayerIndex];

        var targetId = (nodeId !== undefined) ? nodeId : (state.pendingAction ? state.pendingAction.nodeId : null);

        var node = state.board.nodes[targetId];

        if (!node || node.type !== "VILLAGE" || node.owner !== player.index || node.villageLevel >= 3) return false;

        var cost = state.config.estates.villagePrices[node.villageLevel] || 1500;

        if (player.gold < cost) return false;

        player.gold -= cost;

        node.villageLevel++;

        var currSuffixUpg = window.PRS_I18n ? window.PRS_I18n.t("ui.common.gold_short", null, "zl.") : "zl.";
        var msg = window.PRS_I18n ? window.PRS_I18n.t("engine.upgrade_village_log", {
            badge: player.badge,
            player: player.name,
            village: node.name,
            level: node.villageLevel,
            cost: cost,
            currency: currSuffixUpg
        }) : ("🏘️ " + player.badge + " " + player.name + " povýšil **" + node.name + "** na stupeň " + node.villageLevel + " za " + cost + " zl.");

        this.addLog(state, msg, "buy", {
            key: "engine.upgrade_village_log",
            params: {
                badge: player.badge,
                player: player.name,
                village: node.name,
                level: node.villageLevel,
                cost: cost,
                currency: currSuffixUpg
            }
        });

        if (state.pendingAction && state.pendingAction.nodeId === node.id) {
            state.pendingAction.canUpgradeVillage = (node.villageLevel < 3);
            if (node.villageLevel < 3) {
                var prices = (state.config && state.config.estates && state.config.estates.villagePrices) ? state.config.estates.villagePrices : [0, 1500, 3000];
                state.pendingAction.upgradeCost = prices[node.villageLevel] || 1500;
            } else {
                state.pendingAction.upgradeCost = 0;
            }
            state.pendingAction.summary = msg;
        }

        this.recalculateBreedingAndVictory(state);

        return true;

    },


    // Výcvik u Mistra (MB, MJ, MT, MCH, VM),

    trainAtMaster: function (state, chosenSkill) {

        var pa = state.pendingAction;

        if (!pa || !pa.canTrainMaster) return false;

        var player = state.players[state.currentPlayerIndex];

        var rawSkill = (pa.skill === "any") ? (chosenSkill || "charisma") : pa.skill;
        var skill = (window.PRS_SKILLS && window.PRS_SKILLS.normalizeKey) ? window.PRS_SKILLS.normalizeKey(rawSkill) : (rawSkill || "charisma");
        if (skill === "any") skill = "charisma";

        var currentLevel = player.skills[skill] || 0;

        if (currentLevel >= 5) return false;

        var cost = state.config.masterCosts[currentLevel] || ((currentLevel + 1) * 1000);

        if (player.gold < cost) return false;

        player.gold -= cost;

        var node = state.board && state.board.nodes ? state.board.nodes[player.nodeId] : null;
        var tier = (node && node.masterTier) || (pa && pa.masterTier) || (state.config && state.config.masterTier) || (state.board && state.board.masterTier) || 1;
        var gain = (tier === 2) ? 2 : 1;
        var maxCap = (pa && pa.maxTrainLevel) ? pa.maxTrainLevel : 5;
        player.skills[skill] = Math.min(maxCap, Math.min(5, currentLevel + gain));

        if (tier === 3) {
            player.masterSeals = player.masterSeals || {};
            player.masterSeals[skill] = true;
            var sealCount = Object.keys(player.masterSeals).length;
            if (sealCount >= 3 && !player.hasMasterAegis) {
                player.hasMasterAegis = true;
                this.addLog(state, "🛡️ " + player.name + " shromáždil 3 různé pečetě mistrů! Získává Rytířskou záštitu (ochranu před daněmi a bezplatný lazaret)!", "good");
            }
        }

        pa.canTrainMaster = false;

        var skName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(skill, false) : (skill === "riding" ? "Jízda" : (skill === "combat" ? "Boj" : (skill === "dance" ? "Tanec" : "Charisma")));
        var currSuffix = window.PRS_I18n ? window.PRS_I18n.t("ui.common.gold_short", null, "zl.") : "zl.";
        var msg = window.PRS_I18n ? window.PRS_I18n.t("log.trained_skill", {
            player: player.badge + " " + player.name,
            skill: "**" + skName + "**",
            level: player.skills[skill],
            cost: cost.toLocaleString("cs-CZ"),
            currency: currSuffix
        }) : ("🎓 " + player.badge + " " + player.name + " vycvičil vlastnost **" + skName + "** na stupeň **" + player.skills[skill] + "/5** za " + cost.toLocaleString("cs-CZ") + " zl.!");

        pa.summary = msg;

        this.addLog(state, msg, "skill", {
            key: "log.trained_skill",
            params: {
                player: player.badge + " " + player.name,
                skill: "**" + skName + "**",
                level: player.skills[skill],
                cost: cost.toLocaleString("cs-CZ"),
                currency: currSuffix
            }
        });

        return true;

    },


    // Rytířský duel se Čtvrtým Mistrem ctnosti (Stupeň IV) o 1.5 💖 Srdce princezny
    resolveMasterDuel: function (state, playerIndex) {
        if (!state || !state.pendingAction) return false;
        var pa = state.pendingAction;
        if (!pa.isMasterDuel) return false;

        var idx = (playerIndex !== undefined && playerIndex !== null) ? playerIndex : state.currentPlayerIndex;
        var player = state.players[idx];
        if (!player) return false;

        var node = state.board && state.board.nodes ? state.board.nodes[player.nodeId] : null;
        var rawSkill = (pa.skill && pa.skill !== "any") ? pa.skill : ((node && node.skill && node.skill !== "any") ? node.skill : "charisma");
        var skill = (window.PRS_SKILLS && window.PRS_SKILLS.normalizeKey) ? window.PRS_SKILLS.normalizeKey(rawSkill) : (rawSkill || "charisma");
        if (skill === "any") skill = "charisma";
        var eff = this.getEffectiveStats ? this.getEffectiveStats(state, player) : player.skills;
        var skillBonus = (eff && eff[skill] !== undefined) ? eff[skill] : ((player.skills && player.skills[skill]) || 3);

        var roll = Math.floor(Math.random() * 6) + 1;
        var total = roll + skillBonus;
        var target = 8;

        pa.isMasterDuel = false;
        pa.canTrainMaster = false;

        var skName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(skill, false) : skill;

        if (total >= target) {
            player.permanentHearts = Math.round(((player.permanentHearts || 0) + 1.5) * 10) / 10;
            player.gold += 1500;
            if (player.stats) {
                player.stats.questsWon = (player.stats.questsWon || 0) + 1;
                player.stats.heartsFromQuests = Math.round(((player.stats.heartsFromQuests || 0) + 1.5) * 10) / 10;
            }
            var winMsg = "⚔️ VÍTĚZSTVÍ V DUELU MISTRA! " + player.badge + " " + player.name + " hodil " + roll + " + " + skillBonus + " (" + skName + ") = " + total + " (cíl " + target + ") a získává **+1,5 💖** a **+1 500 zl.**!";
            pa.summary = winMsg;
            this.addLog(state, winMsg, "good");
        } else {
            var loseMsg = "🛡️ Čestný střet s Mistrem! " + player.badge + " " + player.name + " hodil " + roll + " + " + skillBonus + " = " + total + " (potřeba " + target + "). Mistr ocenil tvou odvahu darováním **+0,5 💖**!";
            player.permanentHearts = Math.round(((player.permanentHearts || 0) + 0.5) * 10) / 10;
            pa.summary = loseMsg;
            this.addLog(state, loseMsg, "info");
        }

        if (this.recalculateBreedingAndVictory) {
            this.recalculateBreedingAndVictory(state);
        }
        return true;
    },


    // Nákup balíčku předmětů u Obchodníka (Věci 1, Věci 2, Věci 3),

    buyItemPack: function (state, tier) {

        var pa = state.pendingAction;

        if (!pa || !pa.canShopMerchant) return false;

        var player = state.players[state.currentPlayerIndex];

        var packPrices = state.config.itemPackPrices;

        var price = (tier === 3) ? packPrices.tier3 : (tier === 2 ? packPrices.tier2 : packPrices.tier1);

        if (player.gold < price) return false;

        var pool = window.PRS_ITEMS.filter(function (it) { return it.tier === Number(tier) && it.slot !== "trophy"; });

        if (pool.length === 0) return false;

        var item = this.deepClone(pool[Math.floor(Math.random() * pool.length)]);

        item.uid = (item.id || "item") + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

        player.gold -= price;

        player.items.push(item);

        var msg = "⚖️ " + player.badge + " " + player.name + " zakoupil u obchodníka tajemný balíček " + tier + ". stupně: **" + item.icon + " " + item.name + "** za " + price + " zl.";

        pa.summary = msg;

        this.addLog(state, msg, "buy");

        return item;

    },


    // Nákup konkrétní výzbroje z královské zbrojnice podle katalogového ID,

    buySpecificItem: function (state, itemId) {

        var pa = state.pendingAction;

        if (!pa || !pa.canShopMerchant) return false;

        var player = state.players[state.currentPlayerIndex];

        var catalogItem = null;

        for (var i = 0; i < window.PRS_ITEMS.length; i++) {

            if (window.PRS_ITEMS[i].id === itemId) {

                catalogItem = window.PRS_ITEMS[i];

                break;

            }

        }

        if (!catalogItem) return false;

        if (player.gold < catalogItem.price) return false;

        var item = this.deepClone(catalogItem);

        item.uid = (item.id || "item") + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

        player.gold -= catalogItem.price;

        player.items.push(item);

        var msg = "⚔️ " + player.badge + " " + player.name + " zakoupil ve zbrojnici: **" + item.icon + " " + item.name + "** (" + item.tier + ". stupeň) za " + item.price + " zl.";

        pa.summary = msg;

        this.addLog(state, msg, "buy");

        return item;

    },


    // Prodej předmětu nebo nemovitosti (u Obchodníka 1/2 věc a 100% budova, jinde 1/4 věc a 1/2 budova),

    sellAsset: function (state, assetType, assetId, itemIndex, playerIndex) {

        var pIdx = (typeof playerIndex === "number" && playerIndex >= 0 && playerIndex < state.players.length)

            ? playerIndex

            : state.currentPlayerIndex;

        var player = state.players[pIdx];

        var currentNode = state.board.nodes[player.nodeId];

        var atMerchant = currentNode && currentNode.type === "MERCHANT";

        var rates = state.config.sellRates;

        if (assetType === "item") {

            var idx = -1;

            if (typeof arguments[3] === "number" && arguments[3] >= 0 && arguments[3] < player.items.length) {

                idx = arguments[3];

            } else {

                for (var i = 0; i < player.items.length; i++) {

                    if (player.items[i].uid === assetId || player.items[i].id === assetId) { idx = i; break; }

                }

            }

            if (idx === -1) return false;

            var it = player.items[idx];
            var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                          (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);
            var itPrice = (it.price !== undefined && it.price !== null) ? it.price : (baseDef && baseDef.price ? baseDef.price : 1000);
            var itName = it.name || (baseDef ? baseDef.name : "předmět");

            var ratio = atMerchant ? rates.merchantItem : rates.anywhereItem;

            var sellPrice = Math.round(itPrice * ratio);

            player.items.splice(idx, 1);

            player.gold += sellPrice;

            this.addLog(state, "💰 " + player.badge + " " + player.name + " prodal předmět **" + itName + "** za " + sellPrice + " zl. (" + Math.round(ratio * 100) + "% ceny).");

            return true;

        }

        if (assetType === "node") {

            var nIdx = player.ownedNodes.indexOf(Number(assetId));

            if (nIdx === -1) return false;

            var node = state.board.nodes[Number(assetId)];

            var invested = this.getNodeInvestedValue(state, node);

            var bRatio = atMerchant ? rates.merchantBuilding : rates.anywhereBuilding;

            var bSellPrice = Math.round(invested * bRatio);

            player.ownedNodes.splice(nIdx, 1);

            node.owner = null;

            node.villageLevel = (node.type === "VILLAGE") ? 1 : 0;

            player.gold += bSellPrice;

            this.addLog(state, "🏦 " + player.badge + " " + player.name + " prodal **" + node.name + "** za " + bSellPrice + " zl. (" + Math.round(bRatio * 100) + "% ceny).");

            this.recalculateBreedingAndVictory(state);

            return true;

        }

        return false;

    },


    // Nucený odprodej majetku Královské komoře na úhradu dluhu (60 % ceny),

    liquidateAssetForDebt: function (state, assetType, assetId) {

        if (!state.pendingAction || !state.pendingAction.debt) {

            return { ok: false, message: "Žádný dluh k vyrovnání." };

        }

        var debt = state.pendingAction.debt;

        var player = state.players[state.currentPlayerIndex];

        var creditor = state.players[debt.creditorIndex];

        if (!player || !creditor) return { ok: false, message: "Neplatný hráč." };

        var rate = (state.config.sellRates && state.config.sellRates.forcedLiquidation) ? state.config.sellRates.forcedLiquidation : 0.60;

        var yieldVal = 0;

        var assetName = "";

        if (assetType === "item") {

            var idx = -1;

            for (var i = 0; i < player.items.length; i++) {

                if (player.items[i].uid === assetId || player.items[i].id === assetId) { idx = i; break; }

            }

            if (idx === -1) return { ok: false, message: "Předmět nenalezen." };

            var it = player.items.splice(idx, 1)[0];
            var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                          (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);
            var itPrice = (it.price !== undefined && it.price !== null) ? it.price : (baseDef && baseDef.price ? baseDef.price : 1000);
            var itName = it.name || (baseDef ? baseDef.name : "předmět");
            var itIcon = it.icon || (baseDef ? baseDef.icon : "📦");

            yieldVal = Math.round(itPrice * rate);

            assetName = itIcon + " " + itName;

        } else if (assetType === "village_downgrade") {

            var vNode = state.board.nodes[Number(assetId)];

            if (!vNode || vNode.type !== "VILLAGE" || vNode.owner !== player.index || (vNode.villageLevel || 1) <= 1) {

                return { ok: false, message: "Vesnici nelze snížit." };

            }

            var downgradeCost = (state.config.estates.villagePrices && state.config.estates.villagePrices[vNode.villageLevel - 1]) || 1500;

            yieldVal = Math.round(downgradeCost * rate);

            vNode.villageLevel--;

            assetName = "Snížení úrovně vesnice " + vNode.name + " na " + vNode.villageLevel + "★";

        } else if (assetType === "node") {

            var nIdx = player.ownedNodes.indexOf(Number(assetId));

            if (nIdx === -1) return { ok: false, message: "Panství nenalezeno." };

            var node = state.board.nodes[Number(assetId)];

            var invested = this.getNodeInvestedValue(state, node);

            yieldVal = Math.round(invested * rate);

            player.ownedNodes.splice(nIdx, 1);

            node.owner = null;

            if (node.type === "VILLAGE") node.villageLevel = 1;

            assetName = node.icon + " " + node.name;

        } else {

            return { ok: false, message: "Neznámý majetek." };

        }

        var payToCreditor = Math.min(debt.remainingDebt, yieldVal);

        creditor.gold += payToCreditor;

        debt.remainingDebt -= payToCreditor;

        debt.cashPaid += payToCreditor;

        player.stats.rentPaid += payToCreditor;

        creditor.stats.rentCollected += payToCreditor;

        var excess = yieldVal - payToCreditor;

        if (excess > 0) {

            player.gold += excess;

        }

        var logMsg = "⚖️ Nucený odprodej: " + player.badge + " " + player.name + " odprodal **" + assetName + "** za " + yieldVal + " zl. (60 % ceny). Věřitel " + creditor.badge + " " + creditor.name + " obdržel +" + payToCreditor + " zl." + (excess > 0 ? " (přebytek +" + excess + " zl. zůstává dlužníkovi)." : ".");

        this.addLog(state, logMsg, "rent");

        this.recalculateBreedingAndVictory(state);

        if (debt.remainingDebt <= 0) {

            state.pendingAction.summary = "✅ Dluh vůči hráči " + creditor.name + " byl v plné výši vyrovnán.";

            delete state.pendingAction.debt;

            return { ok: true, settled: true, remainingDebt: 0 };

        } else {

            var hasMore = (player.items.length > 0 || player.ownedNodes.length > 0);

            if (!hasMore) {

                if (state.config.bankruptcyElimination) {
                    this.eliminatePlayer(state, player.index, "Úplný bankrot a nesplacený dluh");
                    delete state.pendingAction.debt;
                    return { ok: true, settled: true, eliminated: true };
                } else {

                    state.pendingAction.summary = "⚠️ Rytíř odprodal veškerý majetek. Zbytek dluhu " + debt.remainingDebt + " zl. je nedobytný.";

                    delete state.pendingAction.debt;

                    return { ok: true, settled: true, remainingDebt: debt.remainingDebt };

                }

            } else {

                state.pendingAction.summary = "💸 Dlužíš ještě **" + debt.remainingDebt + " zl.** hráči " + creditor.name + "! Vyber další majetek.";

                return { ok: true, settled: false, remainingDebt: debt.remainingDebt };

            }

        }

    },


    autoLiquidateDebt: function (state, player) {

        if (!state.pendingAction || !state.pendingAction.debt) return;

        var guard = 0;

        while (state.pendingAction && state.pendingAction.debt && state.pendingAction.debt.remainingDebt > 0 && guard < 25) {

            guard++;

            var cand = null;

            // 1. Zkus neaktivní předměty v batohu

            for (var i = 0; i < player.items.length; i++) {

                if (player.items[i].isEquipped === false) {

                    cand = { type: "item", id: player.items[i].id };

                    break;

                }

            }

            // 2. Zkus osamocená zvířata

            if (!cand) {

                for (var j = 0; j < player.ownedNodes.length; j++) {

                    var nd = state.board.nodes[player.ownedNodes[j]];

                    if (nd && nd.type === "ANIMAL") {

                        cand = { type: "node", id: nd.id };

                        break;

                    }

                }

            }

            // 3. Zkus snížení úrovně vesnice

            if (!cand) {

                for (var v = 0; v < player.ownedNodes.length; v++) {

                    var vNd = state.board.nodes[player.ownedNodes[v]];

                    if (vNd && vNd.type === "VILLAGE" && (vNd.villageLevel || 1) > 1) {

                        cand = { type: "village_downgrade", id: vNd.id };

                        break;

                    }

                }

            }

            // 4. Jakýkoliv předmět

            if (!cand && player.items.length > 0) {

                cand = { type: "item", id: player.items[0].id };

            }

            // 5. Jakékoliv vlastněné pole

            if (!cand && player.ownedNodes.length > 0) {

                cand = { type: "node", id: player.ownedNodes[0] };

            }

            if (cand) {

                this.liquidateAssetForDebt(state, cand.type, cand.id);

            } else {

                break;

            }

        }

        // Pokud po vyčerpání majetku stále zbývá nesplacený dluh v módu Ultimate
        if (state.pendingAction && state.pendingAction.debt && state.pendingAction.debt.remainingDebt > 0) {
            var hasMore = (player.items.length > 0 || player.ownedNodes.length > 0);
            if (!hasMore) {
                if (state.config.bankruptcyElimination) {
                    this.eliminatePlayer(state, player.index, "Úplný bankrot a nesplacený dluh v módu Ultimate");
                    delete state.pendingAction.debt;
                } else {
                    state.pendingAction.summary = "⚠️ Rytíř odprodal veškerý majetek. Zbytek dluhu " + state.pendingAction.debt.remainingDebt + " zl. je nedobytný.";
                    delete state.pendingAction.debt;
                }
            }
        }

    },


    eliminatePlayer: function (state, playerIndex, reason) {
        if (!state || !state.players || playerIndex < 0 || playerIndex >= state.players.length) return;
        var p = state.players[playerIndex];
        if (!p || p.isEliminated) return;

        p.isEliminated = true;
        p.isBankrupt = true;
        p.eliminatedRound = (state && (state.roundNumber || state.turnNumber)) ? state.roundNumber : 1;
        p.gold = 0;

        // Uvolnění všech vlastněných polí zpět do neutrálního stavu
        if (p.ownedNodes && p.ownedNodes.length > 0) {
            for (var i = 0; i < p.ownedNodes.length; i++) {
                var ndId = p.ownedNodes[i];
                var nd = state.board && state.board.nodes ? state.board.nodes[ndId] : null;
                if (nd) {
                    nd.owner = null;
                    if (nd.type === "VILLAGE") nd.villageLevel = 1;
                }
            }
            p.ownedNodes = [];
        }

        var rMsg = reason || "Úplný bankrot a vyřazení v módu Ultimate";
        var elimLog = "💀 HRÁČ ELIMINOVÁN! Rytíř " + p.badge + " " + p.name + " byl vyřazen ze hry (" + rMsg + "). Jeho figurka mizí z hracího plánu i hřbitova.";
        this.addLog(state, elimLog, "danger");

        if (state.pendingAction) {
            state.pendingAction.summary = elimLog;
        }

        this.recalculateBreedingAndVictory(state);

        // Kontrola vítězství posledního přeživšího rytíře
        if (!state.isEndlessMode && state.config && state.config.bankruptcyElimination && state.winnerIndex === null) {
            var active = [];
            for (var a = 0; a < state.players.length; a++) {
                if (!state.players[a].isEliminated) active.push(state.players[a]);
            }
            if (active.length === 1) {
                state.winnerIndex = active[0].index;
                state.originalWinnerIndex = active[0].index;
                state.originalWinRound = state.roundNumber || 1;
                state.originalWinType = "sole_survivor";
                state.phase = "GAME_OVER";
                this.addLog(state, "👑 POSLEDNÍ PŘEŽIVŠÍ RYTÍŘ! Všichni ostatní soupeři padli v módu Ultimate. " + active[0].badge + " " + active[0].name + " slaví triumfální vítězství!", "victory");
            }
        }
    },


    // Kontrola a využití specifické slabiny bestie / draka z Bestiáře (+2 k síle),

    payPrisonBail: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canPayPrisonBail) return false;

        var player = state.players[state.currentPlayerIndex];

        var cost = pa.bailCost || 1000;

        if (player.gold < cost) return false;

        player.gold -= cost;

        player.isImprisoned = false;

        player.prisonTurns = 0;

        pa.canPayPrisonBail = false;

        pa.canAttemptPrisonEscape = false;

        pa.canServeSentence = false;

        var msg = "🔓 " + player.badge + " " + player.name + " složil královskou kauci " + cost + " zl. a je okamžitě propuštěn ze Šatlavy na svobodu!";

        pa.summary = msg;

        this.addLog(state, msg, "buy");

        return true;

    },


    // Šatlava: Pokus o útěk (potřeba hodit 6),

    attemptPrisonEscape: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canAttemptPrisonEscape) return null;

        var player = state.players[state.currentPlayerIndex];

        var roll = Math.floor(Math.random() * 6) + 1;

        state.lastRoll = roll;

        pa.canAttemptPrisonEscape = false;

        if (roll === 6) {

            player.isImprisoned = false;

            player.prisonTurns = 0;

            pa.canPayPrisonBail = false;

            pa.canServeSentence = false;

            var bounty = 500;

            player.gold += bounty;

            var msg = "🏃‍♂️ ÚTĚK SE ZDAŘIL! " + player.badge + " " + player.name + " hodil 🎲 " + roll + ", přelstil stráže a při útěku sebral pokladnici (+" + bounty + " zl.)!";

            pa.summary = msg;

            this.addLog(state, msg, "victory");

            return { success: true, roll: roll };

        } else {

            pa.canPayPrisonBail = false;

            pa.canServeSentence = false;

            var failMsg = "⛓️ Stráže útěk zmařily! " + player.badge + " " + player.name + " hodil jen 🎲 " + roll + " (potřeba 6) a zůstává v žaláři.";

            pa.summary = failMsg;

            this.addLog(state, failMsg, "danger");

            return { success: false, roll: roll };

        }

    },


    // Šatlava: Odpykat trest,

    servePrisonSentence: function (state) {

        var pa = state.pendingAction;

        var player = state.players[state.currentPlayerIndex];

        player.isImprisoned = false;

        player.prisonTurns = 0;

        if (pa) {

            pa.canPayPrisonBail = false;

            pa.canAttemptPrisonEscape = false;

            pa.canServeSentence = false;

            var msg = "⚖️ " + player.badge + " " + player.name + " si poctivě odpykal trest a královský rychtář jej propouští na svobodu.";

            pa.summary = msg;

            this.addLog(state, msg, "info");

        }

        return true;

    },


    // Špitál: Nákup hojivého elixíru (+0.5 💖 a ochranný elixír do dalšího souboje za 1 000 zl., základní výcvik Boje jen pokud Boj < 2),

    buyHospitalElixir: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canBuyHospitalElixir) return false;

        var player = state.players[state.currentPlayerIndex];

        var cost = pa.elixirCost || 1000;

        if (player.gold < cost) return false;

        player.gold -= cost;

        var trainedCombat = false;
        if (player.skills.combat < 2) {

            player.skills.combat++;
            trainedCombat = true;

        }

        player.hasElixirToken = true;

        player.permanentHearts += 0.5;

        player.stats.heartsFromQuests += 0.5;

        pa.canBuyHospitalElixir = false;

        pa.canRestHospital = false;

        var msg = "🧪 " + player.badge + " " + player.name + " zakoupil Hojivý elixír za " + cost + " zl.! Získává ochranný elixír do boje a +0.5 💖 za rytířskou statečnost" + (trainedCombat ? " a základní výcvik Boje (+1)" : "") + ".";

        pa.summary = msg;

        this.addLog(state, msg, "buy");

        this.recalculateBreedingAndVictory(state);

        return true;

    },


    // Taktický ústup z doupěte (U2: 400 zl. / U3: 800 zl.) pro nebojové postavy bez pádu do Lazaretu
    retreatFromQuest: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canResolveQuest || !pa.questCard) return false;

        var player = state.players[state.currentPlayerIndex];

        var qTier = pa.questCard.questTier || "U1";

        var cost = (qTier === "U3") ? 800 : ((qTier === "U2") ? 400 : 0);

        var actualPaid = Math.min(player.gold, cost);

        player.gold -= actualPaid;

        pa.canResolveQuest = false;

        var qName = pa.questCard.name;

        pa.questCard = null;

        var msg = "🛡️ TAKTICKÝ ÚSTUP! " + player.badge + " " + player.name + " obezřetně ustoupil před **" + qName + "**" + (actualPaid > 0 ? " (vyplaceno " + actualPaid.toLocaleString("cs-CZ") + " zl. stopařům za bezpečný odchod)." : ".");

        pa.summary = msg;

        this.addLog(state, msg, "info");

        this.recalculateBreedingAndVictory(state);

        return true;

    },


    // Špitál: Zotavení zdarma,

    restInHospital: function (state) {

        var pa = state.pendingAction;

        var player = state.players[state.currentPlayerIndex];

        if (pa) {

            pa.canBuyHospitalElixir = false;

            pa.canRestHospital = false;

            var msg = "🌿 " + player.badge + " " + player.name + " odpočívá u bylinkáře. Jeho mysl i tělo jsou plně zotaveny pro příští klání.";

            pa.summary = msg;

            this.addLog(state, msg, "info");

        }

        return true;

    },


    // Krčma: Kostky s krčmářem,

    gambleInTavern: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canTavernGamble) return null;

        var player = state.players[state.currentPlayerIndex];

        var bet = pa.gambleBet || 500;

        if (player.gold < bet) return null;

        pa.canTavernGamble = false;

        var pRoll1 = Math.floor(Math.random() * 6) + 1;

        var pRoll2 = Math.floor(Math.random() * 6) + 1;

        var pTotal = pRoll1 + pRoll2;

        var kRoll1 = Math.floor(Math.random() * 6) + 1;

        var kRoll2 = Math.floor(Math.random() * 6) + 1;

        var kTotal = kRoll1 + kRoll2;

        if (pTotal > kTotal) {

            player.gold += bet;

            var winMsg = "🎲 Výhra v kostkách! " + player.badge + " " + player.name + " hodil " + pTotal + " (" + pRoll1 + "+" + pRoll2 + ") proti krčmářovým " + kTotal + " (" + kRoll1 + "+" + kRoll2 + ") a vyhrává **+" + bet + " zl.**!";

            pa.summary = winMsg;

            this.addLog(state, winMsg, "victory");

            return { win: true, playerRoll: pTotal, tavernRoll: kTotal, delta: bet };

        } else if (pTotal === kTotal) {

            var tieMsg = "🎲 Nerozhodně v kostkách! Hráč i krčmář hodili shodně " + pTotal + ". Sázka " + bet + " zl. se vrací.";

            pa.summary = tieMsg;

            this.addLog(state, tieMsg, "info");

            return { win: false, tie: true, playerRoll: pTotal, tavernRoll: kTotal, delta: 0 };

        } else {

            player.gold = Math.max(0, player.gold - bet);

            var loseMsg = "🎲 Prohra v kostkách! Krčmář zvítězil se součtem " + kTotal + " (" + kRoll1 + "+" + kRoll2 + ") proti tvým " + pTotal + " (" + pRoll1 + "+" + pRoll2 + "). Ztrácíš **" + bet + " zl.**";

            pa.summary = loseMsg;

            this.addLog(state, loseMsg, "danger");

            return { win: false, playerRoll: pTotal, tavernRoll: kTotal, delta: -bet };

        }

    },


    // Krčma: Runda pro celou hospodu (+0.5 💖 za 400 zl.),

    buyTavernRound: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canBuyTavernRound) return false;

        var player = state.players[state.currentPlayerIndex];

        var cost = pa.roundCost || 400;

        if (player.gold < cost) return false;

        player.gold -= cost;

        var stNow = this.getEffectiveStats(state, player);

        var gainHearts = (stNow.dance >= 2) ? 1.0 : 0.5;

        player.permanentHearts += gainHearts;

        player.stats.heartsFromFestivals += gainHearts;

        pa.canBuyTavernRound = false;

        var msg = "🍻 Runda medoviny na účet rytíře " + player.badge + " " + player.name + "! Celá krčma bouří a pěje oslavné písně (+" + gainHearts + " 💖 k přízni princezny za " + cost + " zl." + (stNow.dance >= 2 ? " – hosty nadchl tvůj taneční věhlas!" : "") + ").";

        pa.summary = msg;

        this.addLog(state, msg, "festival");

        this.recalculateBreedingAndVictory(state);

        return true;

    },


    // 1. Rytířský duel na stejném poli,

    endTurn: function (state) {

        if (state.phase === "GAME_OVER") return;

        if (state.pendingAction && state.pendingAction.canTacticalReroll && this.finalizeQuestLoss) {
            this.finalizeQuestLoss(state);
        }

        state.pendingAction = null;

        state.turnNumber++;

        var count = state.players.length;

        var nextIdx = (state.currentPlayerIndex + 1) % count;

        var loopGuard = 0;

        while (state.players[nextIdx].isEliminated && loopGuard < count) {

            nextIdx = (nextIdx + 1) % count;

            loopGuard++;

        }

        if (nextIdx <= state.currentPlayerIndex) {

            state.roundNumber++;

            this.advanceRoundsForPactsAndIntrigues(state);

            this.addLog(state, "🏰 Začíná " + state.roundNumber + ". kolo království!", "milestone");

        }

        state.currentPlayerIndex = nextIdx;

        state.phase = "ROLL";

        this.recalculateBreedingAndVictory(state);

    }
    });
})();
