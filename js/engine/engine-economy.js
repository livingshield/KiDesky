// ============================================================================
// KiDesky: Princeznino srdce - Jádro enginu: nájmy, ekonomika, daně, karty náhody a svitky
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_GameEngine) window.PRS_GameEngine = {};

    Object.assign(window.PRS_GameEngine, {

    // Výpočet poplatku na cizím poli,

    calculateNodeRent: function (state, node, owner, moveRoll) {

        var cfg = state.config;

        if (node.type === "ANIMAL") {

            return this.calculateAnimalRent(state, node, owner);

        }

        if (node.type === "VILLAGE") {

            var lvl = (node.villageLevel || 1) - 1;

            var baseVillRent = cfg.estates.villageRent[lvl] || 300;

            if (owner && owner.livestock) {
                var lsCfg = (cfg && cfg.livestock) ? cfg.livestock : {};
                var exC = Number(owner.livestock.cattle) || 0;
                var exP = Number(owner.livestock.pigs) || 0;
                var exS = Number(owner.livestock.sheep) || 0;
                baseVillRent += (exC * ((lsCfg.cattleRent !== undefined) ? Number(lsCfg.cattleRent) : 100)) +
                                (exP * ((lsCfg.pigsRent !== undefined) ? Number(lsCfg.pigsRent) : 75)) +
                                (exS * ((lsCfg.sheepRent !== undefined) ? Number(lsCfg.sheepRent) : 50));
            }

            return baseVillRent;

        }

        if (node.type === "TOWN") {

            return cfg.estates.townRent || 700;

        }

        if (node.type === "CASTLE") {

            return cfg.estates.castleRent || 1500;

        }

        if (node.type === "JESTER") {

            var jesterCount = 0;

            for (var i = 0; i < owner.ownedNodes.length; i++) {

                var n = state.board.nodes[owner.ownedNodes[i]];

                if (n && n.type === "JESTER") jesterCount++;

            }

            var effRoll = (typeof moveRoll === "number" && moveRoll > 0) ? moveRoll : 4;

            return effRoll * (cfg.jesterRentMultiplier || 100) * Math.max(1, jesterCount);

        }

        if (node.type === "BUILDING") {

            var count = 0;

            for (var j = 0; j < owner.ownedNodes.length; j++) {

                var bn = state.board.nodes[owner.ownedNodes[j]];

                if (!bn) continue;

                if (node.subtype === "stables" && bn.type === "ANIMAL" && bn.subtype === "horse") count++;

                if (node.subtype === "falconer" && bn.type === "ANIMAL" && bn.subtype === "falcon") count++;

                if (node.subtype === "doghandler" && bn.type === "ANIMAL" && bn.subtype === "dog") count++;

            }

            if (node.subtype === "forge" || node.subtype === "tailor") {

                count = owner.items.length;

            }

            return Math.max(1, count) * (cfg.buildingFeePerItem || 400);

        }

        return 300;

    },


    computeNodeRent: function (state, node, owner, moveRoll) {

        return this.calculateNodeRent(state, node, owner, moveRoll || 4);

    },


    calculateRent: function (state, node, owner, moveRoll) {

        return this.calculateNodeRent(state, node, owner, moveRoll || 4);

    },


    // Kompletní ekonomický souhrn hráče pro HUD (Panství, Chov, Daně, Mýtné, Očekávaný příjem za okruh),
    calculatePlayerEconomySummary: function (state, player) {
        if (!state || !player) return null;
        var cfg = state.config || {};
        var estCfg = cfg.estates || {};
        var st = this.getEffectiveStats(state, player);

        var villageCount = 0, townCount = 0, castleCount = 0, craftCount = 0, jesterCount = 0;
        var horseCount = 0, dogCount = 0, falconCount = 0;
        var estateTaxYield = 0;
        var totalRentSum = 0;

        var nodes = (state.board && state.board.nodes) ? state.board.nodes : [];
        for (var i = 0; i < player.ownedNodes.length; i++) {
            var nd = nodes[player.ownedNodes[i]];
            if (!nd) continue;

            var rent = this.calculateNodeRent(state, nd, player, 4);
            totalRentSum += rent;

            if (nd.type === "ANIMAL") {
                if (nd.subtype === "horse") horseCount++;
                else if (nd.subtype === "dog") dogCount++;
                else falconCount++;
            } else if (nd.type === "VILLAGE") {
                villageCount++;
                var lvl = (nd.villageLevel || 1) - 1;
                estateTaxYield += ((estCfg.villageTaxYield && estCfg.villageTaxYield[lvl]) || 500);
            } else if (nd.type === "TOWN") {
                townCount++;
                estateTaxYield += (estCfg.townTaxYield || 1200);
            } else if (nd.type === "CASTLE") {
                castleCount++;
                estateTaxYield += (estCfg.castleTaxYield || 2500);
            } else if (nd.type === "BUILDING") {
                craftCount++;
            } else if (nd.type === "JESTER") {
                jesterCount++;
            }
        }

        var livestockTaxBonus = st.livestockTaxBonus || 0;
        var totalTaxYield = estateTaxYield + livestockTaxBonus;
        var isLandless = (!player.ownedNodes || player.ownedNodes.length === 0);
        var startStipend = isLandless ? (cfg.passStartGoldLandless || 5000) : (cfg.passStartGold || 3000);
        var estimatedRoundYield = totalTaxYield + totalRentSum;

        return {
            totalOwned: player.ownedNodes.length,
            horses: horseCount,
            dogs: dogCount,
            falcons: falconCount,
            animalsTotal: horseCount + dogCount + falconCount,
            villages: villageCount,
            towns: townCount,
            castles: castleCount,
            crafts: craftCount,
            jesters: jesterCount,
            craftsAndJesters: craftCount + jesterCount,
            cattle: st.cattle || 0,
            sheep: st.sheep || 0,
            pigs: st.pigs || 0,
            extraCattle: st.extraCattle || 0,
            extraSheep: st.extraSheep || 0,
            extraPigs: st.extraPigs || 0,
            livestockCapacity: st.livestockCapacity || 0,
            extraLivestockCount: st.extraLivestockCount || 0,
            estateTaxYield: estateTaxYield,
            livestockTaxBonus: livestockTaxBonus,
            totalTaxYield: totalTaxYield,
            totalRentSum: totalRentSum,
            startStipend: startStipend,
            estimatedRoundYield: estimatedRoundYield,
            completeSetsCount: player.completeSetsCount || 0,
            breedingHearts: player.breedingHearts || 0,
            setHeartsBonus: player.setHeartsBonus || 0,
            hasStables: st.hasStables
        };
    },


    // Nákup hospodářské zvěře (Kráva, Ovce, Prase) na pastviny vesnic nebo do královských stájí,
    buyLivestock: function (state, playerIndex, animalType) {
        if (!state || !state.players) return { ok: false, message: "Hra není aktivní." };
        var pIdx = (typeof playerIndex === "number") ? playerIndex : state.currentPlayerIndex;
        var player = state.players[pIdx];
        if (!player) return { ok: false, message: "Hráč nebyl nalezen." };

        var st = this.getEffectiveStats(state, player);
        if (st.livestockCapacity <= 0) {
            return { ok: false, message: "Pro chov hospodářského dobytka musíš nejprve vlastnit alespoň 1 Vesnici, Město nebo Královské stáje!" };
        }
        if (st.extraLivestockCount >= st.livestockCapacity) {
            return { ok: false, message: "Tvé pastviny a stáje jsou plné (" + st.extraLivestockCount + "/" + st.livestockCapacity + " přikoupených kusů). Kup další Vesnici, Město nebo Stáje!" };
        }

        var lsCfg = (state.config && state.config.livestock) ? state.config.livestock : {};
        var catalog = {
            sheep: { price: (lsCfg.sheepPrice !== undefined) ? Number(lsCfg.sheepPrice) : 500, name: "Ovci", icon: "🐑", taxBonus: (lsCfg.sheepTax !== undefined) ? Number(lsCfg.sheepTax) : 120, rentBonus: (lsCfg.sheepRent !== undefined) ? Number(lsCfg.sheepRent) : 50 },
            pigs: { price: (lsCfg.pigsPrice !== undefined) ? Number(lsCfg.pigsPrice) : 600, name: "Prase", icon: "🐖", taxBonus: (lsCfg.pigsTax !== undefined) ? Number(lsCfg.pigsTax) : 150, rentBonus: (lsCfg.pigsRent !== undefined) ? Number(lsCfg.pigsRent) : 75 },
            cattle: { price: (lsCfg.cattlePrice !== undefined) ? Number(lsCfg.cattlePrice) : 800, name: "Krávu", icon: "🐄", taxBonus: (lsCfg.cattleTax !== undefined) ? Number(lsCfg.cattleTax) : 200, rentBonus: (lsCfg.cattleRent !== undefined) ? Number(lsCfg.cattleRent) : 100 }
        };
        var info = catalog[animalType];
        if (!info) return { ok: false, message: "Neznámý druh hospodářského zvířete." };

        if (player.gold < info.price) {
            return { ok: false, message: "Nemáš dostatek zlata (" + info.price + " zl.) na zakoupení " + info.icon + " " + info.name + "." };
        }

        if (!player.livestock) player.livestock = { cattle: 0, sheep: 0, pigs: 0 };
        player.gold -= info.price;
        player.livestock[animalType] = (Number(player.livestock[animalType]) || 0) + 1;

        var msg = info.icon + " " + player.badge + " " + player.name + " přikoupil do svého hospodářství **" + info.name + "** za " + info.price + " zl. (Daňový výnos +" + info.taxBonus + " zl., nájem vesnic +" + info.rentBonus + " zl.)!";
        this.addLog(state, msg, "buy");
        return { ok: true, message: msg, animal: info };
    },


    // Převod zlata mezi hráči (pokud plátce nemá dost, zaplatí co má),

    transferGold: function (state, fromPlayer, toPlayer, amount) {

        var actual = Math.min(fromPlayer.gold, amount);

        fromPlayer.gold -= actual;

        if (toPlayer) {

            toPlayer.gold += actual;

        }

        return actual;

    },


    // Výběrčí daní (VD) - vyplácí výnos všem majitelům Vesnic, Měst a Hradů,

    resolveTaxCollector: function (state, activePlayer) {

        var cfg = state.config.estates;

        var totalTaxes = 0;

        var summaryParts = [];

        for (var i = 0; i < state.players.length; i++) {

            var p = state.players[i];

            var playerYield = 0;

            for (var j = 0; j < p.ownedNodes.length; j++) {

                var nd = state.board.nodes[p.ownedNodes[j]];

                if (!nd) continue;

                if (nd.type === "VILLAGE") {

                    var lvl = (nd.villageLevel || 1) - 1;

                    playerYield += (cfg.villageTaxYield[lvl] || 500);

                } else if (nd.type === "TOWN") {

                    playerYield += (cfg.townTaxYield || 1200);

                } else if (nd.type === "CASTLE") {

                    playerYield += (cfg.castleTaxYield || 2500);

                }

            }

            var stTax = this.getEffectiveStats(state, p);
            if (stTax && stTax.livestockTaxBonus > 0) {
                playerYield += stTax.livestockTaxBonus;
            }

            if (playerYield > 0) {

                p.gold += playerYield;

                p.stats.taxesCollected += playerYield;

                totalTaxes += playerYield;

                summaryParts.push(p.name + " +" + playerYield + " zl." + (stTax && stTax.livestockTaxBonus > 0 ? " (vč. chovu +" + stTax.livestockTaxBonus + " zl.)" : ""));

            }

        }

        // Pokud aktivní hráč nevlastní žádné panství, zaplatí královskou daň 500 zl.

        var activeHasEstate = false;

        for (var k = 0; k < activePlayer.ownedNodes.length; k++) {

            var an = state.board.nodes[activePlayer.ownedNodes[k]];

            if (an && (an.type === "VILLAGE" || an.type === "TOWN" || an.type === "CASTLE")) {

                activeHasEstate = true;

                break;

            }

        }

        var msg = "";

        if (!activeHasEstate) {

            var penalty = Math.min(activePlayer.gold, cfg.landlessTaxPenalty || 500);

            activePlayer.gold -= penalty;

            msg = "👑 Výběrčí daní! " + activePlayer.name + " nevlastní žádné panství a odvádí královskou daň -" + penalty + " zl. ";

        } else {

            msg = "👑 Výběrčí daní rozděluje výnosy z panství! ";

        }

        if (summaryParts.length > 0) {

            msg += "Vyplaceno: " + summaryParts.join(", ") + ".";

        } else {

            msg += "Zatím žádný rytíř nevlastní Vesnici, Město ani Hrad.";

        }

        this.addLog(state, msg, "gold");

        state.pendingAction.summary = msg;

    },


    // Karta Náhody (N) s váhováním podle herního módu,

    resolveChanceCard: function (state, player) {

        var diffMode = (state.config && state.config.difficultyMode) ? state.config.difficultyMode : "standard";

        var posWeight = 0.50, dilWeight = 0.25, negWeight = 0.25;

        if (diffMode === "easy") {

            posWeight = 0.70; dilWeight = 0.20; negWeight = 0.10;

        } else if (diffMode === "hard") {

            posWeight = 0.35; dilWeight = 0.35; negWeight = 0.30;

        } else if (diffMode === "ultimate") {

            posWeight = 0.35; dilWeight = 0.30; negWeight = 0.35;

        }

        var rollType = Math.random();

        var targetCat = "positive";

        if (rollType < 0.16) {
            targetCat = "scroll";
        } else if (rollType < posWeight) {

            targetCat = "positive";

        } else if (rollType < posWeight + dilWeight) {

            targetCat = "dilemma";

        } else {

            targetCat = "negative";

        }

        var pool = window.PRS_CHANCE_CARDS.filter(function (c) {

            return c.category === targetCat;

        });

        if (!pool || pool.length === 0) pool = window.PRS_CHANCE_CARDS;

        var card = pool[Math.floor(Math.random() * pool.length)];

        var stats = this.getEffectiveStats(state, player);

        // KARTA PERGAMENU / SVITKU (Uložení do brašny rytíře vs. zahrání ihned)
        if (card.category === "scroll" || card.isScroll) {
            if (!player.inventory) player.inventory = [];
            state.pendingAction.chanceCard = card;
            state.pendingAction.scrollCard = card;
            state.pendingAction.canStoreScroll = (player.inventory.length < 3);
            state.pendingAction.canUseScrollNow = true;

            var scrollMsg = "📜 Nález pergamenu – **" + card.title + "**: " + card.text;
            state.pendingAction.summary = scrollMsg;
            this.addLog(state, scrollMsg, "gold");

            if (player.type !== "Human") {
                if (player.inventory.length < 3) {
                    this.storeScrollInInventory(state, player, card);
                } else {
                    this.useScrollEffect(state, player, card);
                }
            }
            return;
        }

        // KARTA DILEMATU / VOLBY (Interaktivní rozhodnutí A vs. B)

        if (card.category === "dilemma") {

            state.pendingAction.chanceCard = card;

            state.pendingAction.dilemmaCard = card;

            state.pendingAction.canChooseDilemma = true;

            var dilemmaMsg = "❓ Karta osudu vyžaduje tvé rozhodnutí – **" + card.title + "**: " + card.text;

            state.pendingAction.summary = dilemmaMsg;

            this.addLog(state, dilemmaMsg, "gold");

            // Pokud je hráč AI Bot, provede autonomní volbu ihned

            if (player.type !== "Human") {

                var chosenOpt = this.decideBotDilemma(state, player, card);

                this.chooseChanceDilemma(state, player, chosenOpt);

            }

            return;

        }

        var msg = "❓ Karta Náhody – **" + card.title + "**: " + card.text;

        if (card.effect === "hearts") {

            player.permanentHearts += card.value;

            player.stats.heartsFromChance += card.value;

        } else if (card.effect === "gold_gain") {

            player.gold += card.value;

        } else if (card.effect === "gold_loss") {

            player.gold = Math.max(0, player.gold - card.value);

            if (card.id === "ch_10") {

                player.permanentHearts += 0.5;

                player.stats.heartsFromChance += 0.5;

            }

        } else if (card.effect === "estate_bonus") {

            var estCount = 0;

            for (var i = 0; i < player.ownedNodes.length; i++) {

                var n = state.board.nodes[player.ownedNodes[i]];

                if (n && (n.type === "VILLAGE" || n.type === "TOWN" || n.type === "CASTLE")) estCount++;

            }

            var gain = Math.max(1000, estCount * card.value);

            player.gold += gain;

            if (!player.livestock) player.livestock = { cattle: 0, sheep: 0, pigs: 0 };
            player.livestock.cattle = (Number(player.livestock.cattle) || 0) + 1;

            msg += " (Získáno +" + gain + " zl. a dar poddaných: **+1 🐄 Kráva** do chovu!)";

        } else if (card.effect === "robbers") {

            if (stats.combat >= 3) {

                player.gold += card.value;

                msg += " (Tvůj Boj je " + stats.combat + " -> Lapkové zahnáni, +" + card.value + " zl.!)";

                if (window.PRS_TROPHIES && window.PRS_TROPHIES.trophy_robbers) {

                    var hasRobRing = false;

                    for (var rIdx = 0; rIdx < player.items.length; rIdx++) {

                        if (player.items[rIdx].id === "trophy_robbers") { hasRobRing = true; break; }

                    }

                    if (!hasRobRing) {

                        var robTrophy = this.deepClone(window.PRS_TROPHIES.trophy_robbers);

                        robTrophy.isEquipped = false;

                        player.items.push(robTrophy);

                        msg += " 🏆 Kořist: **" + robTrophy.icon + " " + robTrophy.name + "**!";

                    }

                }

            } else {

                player.gold = Math.max(0, player.gold - card.value);

                msg += " (Tvůj Boj je jen " + stats.combat + " -> Ztrácíš " + card.value + " zl.)";

            }

        } else if (card.effect === "curse") {

            var cursePaid = Math.min(player.gold, card.value || 1200);

            player.gold -= cursePaid;

            msg += " (Zaplaceno knězi -" + cursePaid + " zl. za sejmutí kletby)";

        } else if (card.effect === "village_bonus") {

            var vCount = 0;

            for (var vi = 0; vi < player.ownedNodes.length; vi++) {

                var vn = state.board.nodes[player.ownedNodes[vi]];

                if (vn && vn.type === "VILLAGE") vCount++;

            }

            var vGain = Math.max(1000, vCount * card.value);

            player.gold += vGain;

            if (!player.livestock) player.livestock = { cattle: 0, sheep: 0, pigs: 0 };
            player.livestock.sheep = (Number(player.livestock.sheep) || 0) + 1;
            player.livestock.pigs = (Number(player.livestock.pigs) || 0) + 1;

            msg += " (Získáno +" + vGain + " zl. a hospodářský přírůstek: **+1 🐑 Ovce a +1 🐖 Prase** do chovu!)";

        } else if (card.effect === "intrigue") {

            if (stats.charisma >= 3) {

                player.permanentHearts += card.value;

                player.stats.heartsFromChance += card.value;

                msg += " (Charisma " + stats.charisma + " >= 3 -> Triumf, +" + card.value + " 💖!)";

            } else {

                player.gold = Math.max(0, player.gold - 600);

                msg += " (Charisma jen " + stats.charisma + " -> Zaplaceno 600 zl.)";

            }

        } else if (card.effect === "ball") {

            if (stats.hasDress || stats.dance >= 2) {

                player.permanentHearts += card.value;

                player.stats.heartsFromChance += card.value;

                msg += " (Společenský úspěch -> +" + card.value + " 💖!)";

            } else {

                player.gold = Math.max(0, player.gold - 400);

                msg += " (Bez šatů a tance -> Pokuta 400 zl.)";

            }

        } else if (card.effect === "riding") {

            if (stats.horses > 0 || stats.riding >= 2) {

                player.permanentHearts += card.value;

                player.stats.heartsFromChance += card.value;

                if (card.id === "ch_ride_2") player.gold += 500;

                msg += " (Jezdecký triumf -> +" + card.value + " 💖!)";

            } else {

                player.gold = Math.max(0, player.gold - 300);

                msg += " (Bez koně a jezdeckého umu -> Pokuta/zdržení 300 zl.)";

            }

        } else if (card.effect === "free_item_1") {

            var tier1Items = window.PRS_ITEMS.filter(function (it) { return it.tier === 1; });

            var gift = this.deepClone(tier1Items[Math.floor(Math.random() * tier1Items.length)]);

            player.items.push(gift);

            msg += " (Získán předmět: " + gift.icon + " " + gift.name + ")";

        } else if (card.effect === "free_skill") {

            var skKeys = ["combat", "riding", "dance", "charisma"];

            skKeys.sort(function (a, b) { return player.skills[a] - player.skills[b]; });

            var chosen = skKeys[0];

            if (player.skills[chosen] < 5) {

                player.skills[chosen]++;

                var skName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(chosen, false) : (chosen === "riding" ? "Jízda" : (chosen === "combat" ? "Boj" : (chosen === "dance" ? "Tanec" : "Charisma")));
                msg += " (Zvýšena vlastnost **" + skName + "** na stupeň " + player.skills[chosen] + "!)";

            }

        }

        state.pendingAction.chanceCard = card;

        state.pendingAction.summary = msg;

        this.addLog(state, msg);

        this.recalculateBreedingAndVictory(state);

    },


    // Vyhodnocení volby v dilematu Karty osudu (Možnost A = 0, Možnost B = 1),

    chooseChanceDilemma: function (state, player, optionIndex) {

        var pa = state.pendingAction;

        var card = pa.dilemmaCard || pa.chanceCard;

        if (!card || !card.options || !card.options[optionIndex]) return null;

        var opt = card.options[optionIndex];

        var stats = this.getEffectiveStats(state, player);

        var msg = "⚖️ Rozhodnutí: **" + opt.title + "** – ";

        if (opt.costGold) {

            var actualCost = Math.min(player.gold, opt.costGold);

            player.gold -= actualCost;

            msg += "Uhrazeno -" + actualCost + " zl. ";

        }

        if (opt.gainGold) {

            player.gold += opt.gainGold;

            msg += "+" + opt.gainGold + " zl. ";

        }

        if (opt.gainHearts) {

            player.permanentHearts += opt.gainHearts;

            player.stats.heartsFromChance += opt.gainHearts;

            msg += "+" + opt.gainHearts + " 💖 ";

        }

        if (opt.lossHearts) {

            player.permanentHearts = Math.max(0, player.permanentHearts - opt.lossHearts);

            msg += "-" + opt.lossHearts + " 💖 ";

        }

        // Speciální efekty voleb

        if (opt.effect === "alchemist_gamble") {

            var r = Math.random();

            if (r < 0.6) {

                var skKeys = ["combat", "riding", "dance", "charisma"];

                skKeys.sort(function (a, b) { return player.skills[a] - player.skills[b]; });

                var chosenSk = skKeys[0];

                if (player.skills[chosenSk] < 5) player.skills[chosenSk]++;

                var skName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(chosenSk, false) : (chosenSk === "riding" ? "Jízda" : (chosenSk === "combat" ? "Boj" : (chosenSk === "dance" ? "Tanec" : "Charisma")));
                msg += "Tinktura zabrala! Získáno +1 k vlastnosti " + skName + "!";

            } else {

                var medCost = Math.min(player.gold, 400);

                player.gold -= medCost;

                msg += "Nevolnost! Návštěva ranhojiče stála -" + medCost + " zl.";

            }

        } else if (opt.effect === "dice_gamble") {

            var dRoll = Math.floor(Math.random() * 6) + 1;

            if (dRoll >= 4) {

                player.gold += 3500;

                msg += "Hod " + dRoll + " -> VÝHRA 3 500 zl. v kostkách!";

            } else {

                msg += "Hod " + dRoll + " -> Smůla v kostkách, vklad propadl!";

            }

        } else if (opt.effect === "gain_riding") {

            if (player.skills.riding < 5) player.skills.riding++;

            msg += "Získáno +1 k Jízdě na koni!";

        } else if (opt.effect === "gain_combat") {

            if (player.skills.combat < 5) player.skills.combat++;

            msg += "Získáno +1 k Boji!";

        } else if (opt.effect === "open_chest_loot") {

            var pool = window.PRS_ITEMS.filter(function (it) { return (it.tier === 1 || it.tier === 2) && it.slot !== "trophy"; });

            if (pool.length > 0) {

                var chestLoot = this.deepClone(pool[Math.floor(Math.random() * pool.length)]);

                player.items.push(chestLoot);

                msg += "V truhlici byl nalezen předmět: " + chestLoot.icon + " " + chestLoot.name + "!";

            }

        } else if (opt.effect === "fencer_duel") {

            if (stats.combat >= 3) {

                player.permanentHearts += 1.0;

                player.gold += 600;

                msg += "Tvůj Boj " + stats.combat + " stačil na vítězství (+1 💖, +600 zl.)!";

            } else {

                var fCost = Math.min(player.gold, 600);

                player.gold -= fCost;

                msg += "Šermíř tě odzbrojil, ošetření ran stálo -" + fCost + " zl.";

            }

        } else if (opt.effect === "free_item_1") {

            var tier1 = window.PRS_ITEMS.filter(function (it) { return it.tier === 1 && it.slot !== "trophy"; });

            if (tier1.length > 0) {

                var gItem = this.deepClone(tier1[Math.floor(Math.random() * tier1.length)]);

                player.items.push(gItem);

                msg += "Získán předmět: " + gItem.icon + " " + gItem.name + "!";

            }

        } else if (opt.effect === "free_skill") {

            var sks = ["combat", "riding", "dance", "charisma"];

            sks.sort(function (a, b) { return player.skills[a] - player.skills[b]; });

            var chSk = sks[0];

            if (player.skills[chSk] < 5) player.skills[chSk]++;

            var skName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(chSk, false) : (chSk === "riding" ? "Jízda" : (chSk === "combat" ? "Boj" : (chSk === "dance" ? "Tanec" : "Charisma")));
            msg += "Získáno +1 k vlastnosti " + skName + "!";

        } else if (opt.effect === "trade_caravan") {

            player.gold += 2200;

            msg += "Karavana úspěšně dorazila, výplata zisku +2 200 zl.!";

        }

        pa.canChooseDilemma = false;

        pa.dilemmaCard = null;

        pa.summary = msg;

        this.addLog(state, msg, "gold");

        this.recalculateBreedingAndVictory(state);

        return { option: opt, message: msg };

    },


    // Uložení nalezeného pergamenu do brašny rytíře (max 3)
    storeScrollInInventory: function (state, player, card) {
        if (!player.inventory) player.inventory = [];
        if (player.inventory.length >= 3) {
            return { ok: false, message: "Brašna je již plná (max 3 svitky)!" };
        }
        var scCopy = this.deepClone(card || (state.pendingAction && (state.pendingAction.scrollCard || state.pendingAction.chanceCard)));
        if (!scCopy) return { ok: false, message: "Svitek nenalezen." };
        player.inventory.push(scCopy);

        var pa = state.pendingAction;
        if (pa) {
            pa.canStoreScroll = false;
            pa.canUseScrollNow = false;
            pa.scrollCard = null;
            pa.chanceCard = null;
            var msg = "🎒 " + player.badge + " " + player.name + " uložil **" + scCopy.title + "** do své rytířské brašny (kapacita: " + player.inventory.length + "/3).";
            pa.summary = msg;
            this.addLog(state, msg, "gold");
        }
        return { ok: true, scroll: scCopy };
    },


    // Aplikace okamžitého efektu pergamenu
    useScrollEffect: function (state, player, card) {
        var sc = card || (state.pendingAction && (state.pendingAction.scrollCard || state.pendingAction.chanceCard));
        if (!sc) return { ok: false, message: "Svitek nenalezen." };
        if (!player.activeScrolls) player.activeScrolls = {};
        var msg = "";

        if (sc.scrollType === "speed_boost") {
            player.activeScrolls.bonusRoll = (player.activeScrolls.bonusRoll || 0) + 3;
            msg = "⚡ Rytíř " + player.badge + " " + player.name + " přečetl **" + sc.title + "**! K příštímu hodu kostkou získá **+3 pole**!";
        } else if (sc.scrollType === "rent_amnesty") {
            player.activeScrolls.rentImmunity = true;
            msg = "👑 Rytíř " + player.badge + " " + player.name + " vytasil **" + sc.title + "**! Je plně osvobozen od mýtného a nájmů na 1 tah!";
        } else if (sc.scrollType === "combat_boost") {
            player.activeScrolls.combatBonus = (player.activeScrolls.combatBonus || 0) + 2;
            msg = "🧪 Rytíř " + player.badge + " " + player.name + " požil **" + sc.title + "**! Jeho Boj se zvyšuje o **+2 body**!";
        } else if (sc.scrollType === "breeding_double") {
            player.gold += 1000;
            player.activeScrolls.doubleBreeding = true;
            msg = "🐑 Rytíř " + player.badge + " " + player.name + " aktivoval **" + sc.title + "**! Získává +1 000 zl. a zdvojený chov stád!";
        } else if (sc.scrollType === "fortune_favor") {
            player.activeScrolls.forcedRoll = 6;
            msg = "⭐ Rytíř " + player.badge + " " + player.name + " vyvolal **" + sc.title + "**! Hvězdy přejí rytíři – při příštím hodu padne **čistá 6**!";
        } else {
            msg = "📜 Rytíř " + player.badge + " " + player.name + " použil pergamen **" + sc.title + "**!";
        }

        var pa = state.pendingAction;
        if (pa) {
            pa.canStoreScroll = false;
            pa.canUseScrollNow = false;
            pa.scrollCard = null;
            pa.chanceCard = null;
            pa.summary = msg;
        }
        this.addLog(state, msg, "gold");
        this.recalculateBreedingAndVictory(state);
        return { ok: true, message: msg };
    },


    // Zahrání pergamenu z brašny (z ruky hráče)
    useInventoryScroll: function (state, playerIndex, scrollIndex) {
        var player = state.players[playerIndex];
        if (!player || !player.inventory || !player.inventory[scrollIndex]) {
            return { ok: false, message: "Pergamen v brašně nenalezen!" };
        }
        var scroll = player.inventory.splice(scrollIndex, 1)[0];
        return this.useScrollEffect(state, player, scroll);
    }
    });
})();
