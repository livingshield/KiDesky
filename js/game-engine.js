// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Herní Jádro, Pohyb a Pravidla Ekonomiky
// ============================================================================

window.PRS_GameEngine = {
    PLAYER_COLORS: [
        { name: "Červený rytíř", hex: "#ef4444", badge: "🔴" },
        { name: "Modrý rytíř", hex: "#3b82f6", badge: "🔵" },
        { name: "Zelený rytíř", hex: "#10b981", badge: "🟢" },
        { name: "Zlatý rytíř", hex: "#f59e0b", badge: "🟡" },
        { name: "Fialový rytíř", hex: "#a855f7", badge: "🟣" },
        { name: "Stříbrný rytíř", hex: "#ec4899", badge: "🌸" }
    ],
    deepClone: function (obj) {

        return JSON.parse(JSON.stringify(obj));

    },

    createGame: function (options) {

        options = options || {};

        var baseConfig = window.PRS_DEFAULT_CONFIG || {};

        var cfg = this.deepClone(baseConfig);

        if (options.config && typeof options.config === "object") {

            for (var k in options.config) {

                if (options.config.hasOwnProperty(k)) cfg[k] = options.config[k];

            }

        }

        var diffMode = options.difficultyMode || cfg.difficultyMode || "standard";

        cfg.difficultyMode = diffMode;

        if (diffMode === "easy") {

            cfg.startGold = 12000;

            cfg.passStartGold = 3500;

            cfg.passStartGoldLandless = 5500;

            if (cfg.sellRates) cfg.sellRates.forcedLiquidation = 0.75;

            cfg.interactionRate = 0; // mírumilovný režim bez útočných duelů a intrik

            cfg.hospitalMultiplier = 1;

            cfg.prisonBail = 1000;

            cfg.bankruptcyElimination = false;

        } else if (diffMode === "hard") {

            cfg.startGold = 8000;

            cfg.passStartGold = 2500;

            cfg.passStartGoldLandless = 4500;

            if (cfg.sellRates) cfg.sellRates.forcedLiquidation = 0.50;

            cfg.interactionRate = 1.0; // plné sazby

            cfg.hospitalMultiplier = 1;

            cfg.prisonBail = 1000;

            cfg.bankruptcyElimination = false;

        } else if (diffMode === "ultimate") {

            cfg.startGold = 8000;

            cfg.passStartGold = 2500;

            cfg.passStartGoldLandless = 4000;

            if (cfg.sellRates) cfg.sellRates.forcedLiquidation = 0.50;

            cfg.interactionRate = 1.0;

            cfg.hospitalMultiplier = 2; // Elixír 1 600 zl.

            cfg.prisonBail = 2000; // Kauce 2 000 zl.

            cfg.bankruptcyElimination = true;

        } else {

            // standard

            cfg.startGold = 10000;

            cfg.passStartGold = 3000;

            cfg.passStartGoldLandless = 5000;

            if (cfg.sellRates) cfg.sellRates.forcedLiquidation = 0.60;

            cfg.interactionRate = 0.5; // poloviční sazby

            cfg.hospitalMultiplier = 1;

            cfg.prisonBail = 1000;

            cfg.bankruptcyElimination = false;

        }

        if (options.scenario) {

            cfg.scenario = options.scenario;

            if (cfg.scenario === "sprint") cfg.targetHearts = 15;

            else if (cfg.scenario === "classic") cfg.targetHearts = 30;

            else if (cfg.scenario === "slayer") cfg.targetHearts = 20;

            else if (cfg.scenario === "tycoon") cfg.targetHearts = 25;

            else if (cfg.scenario === "epic") cfg.targetHearts = 45;

        } else if (options.targetHearts) {

            cfg.targetHearts = Number(options.targetHearts);

        }

        var boardCode = options.boardCode || "classic_96";

        var board = window.PRS_BoardBuilder.createBoard(boardCode);

        var playerDefs = options.players || [

            { name: "Host (Ty)", type: "Human" },

            { name: "Černý Baron (PC)", type: "Bot_Aggressive" },

            { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder" },

            { name: "Kněžna Eliška (PC)", type: "Bot_Noble" }

        ];

        var players = [];

        for (var i = 0; i < playerDefs.length; i++) {

            var pDef = playerDefs[i];

            var col = this.PLAYER_COLORS[i % this.PLAYER_COLORS.length];

            players.push({

                index: i,

                name: pDef.name || col.name,

                type: pDef.type || "Human",

                color: pDef.color || col.hex,

                badge: col.badge,

                nodeId: 0,

                gold: cfg.startGold,

                permanentHearts: 0,

                breedingHearts: 0,

                totalHearts: 0,

                skills: {

                    boj: 0,

                    jizda: 0,

                    tanec: 0,

                    charisma: 0

                },

                items: [], // pole objektů z PRS_ITEMS

                ownedNodes: [], // pole nodeId

                skipTurns: 0,

                isEliminated: false,

                isBankrupt: false,

                frozenRentRounds: 0,

                lastToastRound: 0,

                stats: {

                    questsWon: 0,

                    dragonsSlain: 0,

                    monstersSlain: 0,

                    beastsSlain: 0,

                    questsLost: 0,

                    festivalsWon: 0,

                    heartsFromFestivals: 0,

                    heartsFromQuests: 0,

                    heartsFromChance: 0,

                    taxesCollected: 0,

                    rentCollected: 0,

                    rentPaid: 0

                }

            });

        }

        // Inicializujeme stav uzlů (vlastník, úroveň vesnice)

        for (var n = 0; n < board.nodes.length; n++) {

            board.nodes[n].owner = null;

            board.nodes[n].villageLevel = (board.nodes[n].type === "VILLAGE") ? 1 : 0;

        }

        var state = {

            sessionGuid: options.sessionGuid || null,

            roomCode: options.roomCode || null,

            title: options.title || "Princeznino srdce",

            config: cfg,

            board: board,

            players: players,

            currentPlayerIndex: 0,

            turnNumber: 1,

            roundNumber: 1,

            phase: "ROLL", // ROLL | ACTION | GAME_OVER

            lastRoll: null,

            lastPath: [],

            pendingAction: null,

            winnerIndex: null,

            winType: null,

            activePacts: [],

            logs: []

        };

        this.addLog(state, "👑 Královská trubačská fanfára! Hra „Princeznino srdce“ začíná. Cílem je získat " + cfg.targetHearts + " 💖.");

        this.recalculateBreedingAndVictory(state);

        return state;

    },

    addLog: function (state, text, type) {

        state.logs.unshift({

            turn: state.turnNumber,

            round: state.roundNumber,

            type: type || "info",

            text: text

        });

        if (state.logs.length > 120) {

            state.logs.pop();

        }

    },

    // Cena políčka podle typu a sady,

    getNodePrice: function (state, node) {

        var realNode = node;

        var cfg = (state && state.config) ? state.config : (window.PRS_DEFAULT_CONFIG || {});

        if (!realNode && state && state.type) {

            realNode = state;

            cfg = window.PRS_DEFAULT_CONFIG || {};

        }

        if (!realNode) return 0;

        var animalBase = (cfg && cfg.animalBasePrices) ? cfg.animalBasePrices : { sokol: 400, pes: 500, kun: 600 };

        var estates = (cfg && cfg.estates) ? cfg.estates : (window.PRS_DEFAULT_CONFIG ? window.PRS_DEFAULT_CONFIG.estates : {});

        if (realNode.type === "ANIMAL") {

            var base = animalBase[realNode.subtype] || 500;

            return base * (realNode.setId || 1);

        }

        if (realNode.type === "VILLAGE") {

            return (estates.villagePrices && estates.villagePrices[0]) || 2000;

        }

        if (realNode.type === "TOWN") {

            return estates.townPrice || 4500;

        }

        if (realNode.type === "CASTLE") {

            return estates.castlePrice || 8000;

        }

        if (realNode.type === "JESTER") {

            return cfg.jesterPrice || 2000;

        }

        if (realNode.type === "BUILDING") {

            return cfg.buildingPrice || 3000;

        }

        return 0;

    },

    // Celková investovaná hodnota políčka (včetně vylepšení vesnice),

    getNodeInvestedValue: function (state, node) {

        var base = this.getNodePrice(state, node);

        if (node.type === "VILLAGE" && node.villageLevel > 1) {

            for (var lvl = 1; lvl < node.villageLevel; lvl++) {

                base += (state.config.estates.villagePrices[lvl] || 1500);

            }

        }

        return base;

    },

    isPurchasableNode: function (node) {

        return node && (

            node.type === "ANIMAL" ||

            node.type === "VILLAGE" ||

            node.type === "TOWN" ||

            node.type === "CASTLE" ||

            node.type === "JESTER" ||

            node.type === "BUILDING"

        );

    },

    // Zjistí nasazené předměty hráče (respektuje přepínání Batoh / Nasazeno),

    getEquippedItems: function (player) {

        var equippedBySlot = { weapon: null, armor: null, dress: null, jewel: null, trophy: null };

        if (!player || !player.items) return equippedBySlot;

        // Zajistíme unikátní uid pro všechny položky

        for (var u = 0; u < player.items.length; u++) {

            if (!player.items[u].uid) {

                player.items[u].uid = (player.items[u].id || "item") + "_" + (u + 1) + "_" + Math.random().toString(36).substring(2, 7);

            }

        }

        // 1. Předměty explicitně označené jako isEquipped === true

        // Pokud by byly dva ve stejném slotu, první zůstane a druhý se odznačí

        for (var i = 0; i < player.items.length; i++) {

            var it = player.items[i];

            var slot = it.slot || "weapon";

            if (it.isEquipped === true) {

                if (!equippedBySlot[slot]) {

                    equippedBySlot[slot] = it;

                } else {

                    it.isEquipped = false;

                }

            }

        }

        // 2. Pro sloty, které ještě nejsou obsazené a předmět nebyl ručně sundán (isEquipped !== false),

        // automaticky nasadíme nejlepší dostupný

        for (var s in equippedBySlot) {

            if (!equippedBySlot[s]) {

                var bestCandidate = null;

                for (var j = 0; j < player.items.length; j++) {

                    var cand = player.items[j];

                    if (cand.slot === s && cand.isEquipped !== false) {

                        if (!bestCandidate || cand.price > bestCandidate.price) {

                            bestCandidate = cand;

                        }

                    }

                }

                if (bestCandidate) {

                    bestCandidate.isEquipped = true;

                    equippedBySlot[s] = bestCandidate;

                }

            }

        }

        return equippedBySlot;

    },

    // Přepnutí předmětu: Nasazeno v ruce/na sobě vs. Uloženo v batohu,

    toggleEquipItem: function (state, itemIdentifier, itemIndex, playerIndex) {

        var pIdx = (typeof playerIndex === "number" && playerIndex >= 0 && playerIndex < state.players.length)

            ? playerIndex

            : state.currentPlayerIndex;

        var player = state.players[pIdx];

        if (!player || !player.items) return { ok: false, message: "Hráč nebyl nalezen." };

        // Zajistíme unikátní uid pro všechny předměty

        for (var u = 0; u < player.items.length; u++) {

            if (!player.items[u].uid) {

                player.items[u].uid = (player.items[u].id || "item") + "_" + (u + 1) + "_" + Math.random().toString(36).substring(2, 7);

            }

        }

        var target = null;

        if (typeof itemIndex === "number" && itemIndex >= 0 && itemIndex < player.items.length) {

            target = player.items[itemIndex];

        } else if (itemIdentifier !== undefined && itemIdentifier !== null) {

            for (var i = 0; i < player.items.length; i++) {

                if (player.items[i].uid === itemIdentifier) {

                    target = player.items[i];

                    break;

                }

            }

            if (!target) {

                for (var j = 0; j < player.items.length; j++) {

                    if (player.items[j].id === itemIdentifier) {

                        target = player.items[j];

                        break;

                    }

                }

            }

        }

        if (!target) return { ok: false, message: "Předmět nebyl nalezen." };

        var slot = target.slot || "weapon";

        var isCurrentlyEquipped = (target.isEquipped === true);

        var msg = "";

        if (isCurrentlyEquipped) {

            target.isEquipped = false;

            msg = "🎒 " + player.badge + " " + player.name + " uložil předmět " + (target.icon || "📦") + " " + target.name + " do batohu.";

        } else {

            // Sundáme jakýkoliv jiný předmět ve stejném slotu (i kdyby měl stejné ID!)

            for (var k = 0; k < player.items.length; k++) {

                if (player.items[k].slot === slot && player.items[k] !== target) {

                    player.items[k].isEquipped = false;

                }

            }

            target.isEquipped = true;

            msg = "⚔️ " + player.badge + " " + player.name + " nasadil " + (target.icon || "📦") + " " + target.name + " do aktivní výstroje!";

        }

        this.addLog(state, msg);

        this.recalculateBreedingAndVictory(state);

        return { ok: true, message: msg };

    },

    // Spočítá efektivní atributy hráče (vycvičené vlastnosti + nasazená výbava + Hrad + budovy),

    getEffectiveStats: function (state, player) {

        var eq = this.getEquippedItems(player);

        var boj = player.skills.boj;

        var jizda = player.skills.jizda;

        var tanec = player.skills.tanec;

        var charisma = player.skills.charisma;

        var slots = ["weapon", "armor", "dress", "jewel", "trophy"];

        for (var s = 0; s < slots.length; s++) {

            var item = eq[slots[s]];

            if (item) {

                boj += (item.boj || 0);

                jizda += (item.jizda || 0);

                tanec += (item.tanec || 0);

                charisma += (item.charisma || 0);

            }

        }

        // Bonusy z vlastněných Hradů, Měst, Vesnic a Řemeslných budov

        var ownedCastles = 0, ownedTowns = 0, ownedVillages = 0;

        var hasStaje = false, hasKovarna = false, hasKrejci = false, hasSokolnik = false, hasPsovod = false;

        var horses = 0, dogs = 0, falcons = 0;

        for (var i = 0; i < player.ownedNodes.length; i++) {

            var nd = state.board.nodes[player.ownedNodes[i]];

            if (!nd) continue;

            if (nd.type === "CASTLE") ownedCastles++;

            if (nd.type === "TOWN") ownedTowns++;

            if (nd.type === "VILLAGE") ownedVillages++;

            if (nd.type === "BUILDING") {

                if (nd.subtype === "staje") hasStaje = true;

                if (nd.subtype === "kovarna") hasKovarna = true;

                if (nd.subtype === "krejci") hasKrejci = true;

                if (nd.subtype === "sokolnik") hasSokolnik = true;

                if (nd.subtype === "psovod") hasPsovod = true;

            }

            if (nd.type === "ANIMAL") {

                if (nd.subtype === "kun") horses++;

                if (nd.subtype === "pes") dogs++;

                if (nd.subtype === "sokol") falcons++;

            }

        }

        var castleBonus = (state.config && state.config.estates) ? (state.config.estates.castleCharismaBonus || 1) : 1;

        charisma += ownedCastles * castleBonus;

        if (hasKovarna) boj += 1;

        if (hasStaje) jizda += 1;

        if (hasKrejci) tanec += 1;

        return {

            boj: Math.max(0, boj),

            jizda: Math.max(0, jizda),

            tanec: Math.max(0, tanec),

            charisma: Math.max(0, charisma),

            horses: horses,

            dogs: dogs,

            falcons: falcons,

            ownedCastles: ownedCastles,

            ownedTowns: ownedTowns,

            ownedVillages: ownedVillages,

            hasDress: !!eq.dress,

            hasWeapon: !!eq.weapon,

            hasArmor: !!eq.armor,

            hasTrophy: !!eq.trophy,

            trophyItem: eq.trophy,

            hasStaje: hasStaje,

            hasKovarna: hasKovarna,

            hasKrejci: hasKrejci,

            hasSokolnik: hasSokolnik,

            hasPsovod: hasPsovod,

            equipped: eq

        };

    },

    // Spočítá nájemné za šlechtické zvíře (20% za 1 kus, 40% za pár v sadě, 80% za celou sadu K+P+S),

    calculateAnimalRent: function (state, node, owner) {

        var basePrice = this.getNodePrice(state, node);

        var setId = node.setId;

        var countInSet = 0;

        for (var i = 0; i < owner.ownedNodes.length; i++) {

            var n = state.board.nodes[owner.ownedNodes[i]];

            if (n && n.type === "ANIMAL" && n.setId === setId) {

                countInSet++;

            }

        }

        var ratios = (state.config && state.config.animalRentRatios) || { single: 0.20, pair: 0.40, fullSet: 0.80 };

        var ratio = ratios.single || 0.20;

        if (countInSet === 2) ratio = ratios.pair || 0.40;

        if (countInSet >= 3) ratio = ratios.fullSet || 0.80;

        return Math.round(basePrice * ratio);

    },

    // Kontrola existence aktivního obchodního paktu mezi dvěma hráči,

    hasActiveTradePact: function (state, p1Idx, p2Idx) {

        if (!state.activePacts || state.activePacts.length === 0) return false;

        for (var i = 0; i < state.activePacts.length; i++) {

            var pact = state.activePacts[i];

            if ((pact.p1 === p1Idx && pact.p2 === p2Idx) || (pact.p1 === p2Idx && pact.p2 === p1Idx)) {

                return true;

            }

        }

        return false;

    },

    // Porušení obchodního paktu při nepřátelské akci (duel, intrika),

    breakTradePact: function (state, traitorIdx, victimIdx, reason) {

        if (!state.activePacts || state.activePacts.length === 0) return false;

        var foundIdx = -1;

        for (var i = 0; i < state.activePacts.length; i++) {

            var pact = state.activePacts[i];

            if ((pact.p1 === traitorIdx && pact.p2 === victimIdx) || (pact.p1 === victimIdx && pact.p2 === traitorIdx)) {

                foundIdx = i;

                break;

            }

        }

        if (foundIdx !== -1) {

            state.activePacts.splice(foundIdx, 1);

            var traitor = state.players[traitorIdx];

            var victim = state.players[victimIdx];

            traitor.permanentHearts = Math.max(0, traitor.permanentHearts - 1.0);

            this.addLog(state, "💔 ZRADA OBCHODNÍHO PAKTU! " + traitor.badge + " " + traitor.name + " napadl spojence " + victim.badge + " " + victim.name + " (" + (reason || "nepřátelská akce") + ") a ztrácí -1,0 💖 za křivopřísežnictví!", "danger");

            return true;

        }

        return false;

    },

    // Nalezení chybějících zvířat do sady pro Šlechtický výkup (Královské předkupní právo),

    getAnimalBuyoutCandidates: function (state, player, currentNode) {

        var candidates = [];

        var setCounts = {};

        for (var on = 0; on < player.ownedNodes.length; on++) {

            var an = state.board.nodes[player.ownedNodes[on]];

            if (an && an.type === "ANIMAL" && an.setId) {

                var sid = an.setId;

                if (!setCounts[sid]) setCounts[sid] = { kun: 0, pes: 0, sokol: 0 };

                if (an.subtype) setCounts[sid][an.subtype]++;

            }

        }

        var isMerchant = (currentNode && (currentNode.type === "MERCHANT" || currentNode.type === "OBCHOD"));

        for (var sKey in setCounts) {

            var sc = setCounts[sKey];

            var totalInSet = (sc.kun ? 1 : 0) + (sc.pes ? 1 : 0) + (sc.sokol ? 1 : 0);

            if (totalInSet === 2) {

                var missingSubtype = !sc.kun ? "kun" : (!sc.pes ? "pes" : "sokol");

                for (var ni = 0; ni < state.board.nodes.length; ni++) {

                    var candNode = state.board.nodes[ni];

                    if (candNode && candNode.type === "ANIMAL" && candNode.setId === Number(sKey) && candNode.subtype === missingSubtype) {

                        if (candNode.owner !== null && candNode.owner !== undefined && candNode.owner !== player.index) {

                            var otherOwner = state.players[candNode.owner];

                            if (otherOwner && !otherOwner.isEliminated) {

                                if (isMerchant || candNode.id === currentNode.id) {

                                    var origPrice = this.getNodePrice(state, candNode);

                                    var buyoutPrice = origPrice * 2;

                                    candidates.push({

                                        nodeId: candNode.id,

                                        name: candNode.name,

                                        icon: candNode.icon || "🐾",

                                        setId: candNode.setId,

                                        subtype: candNode.subtype,

                                        ownerIndex: otherOwner.index,

                                        ownerName: otherOwner.name,

                                        ownerBadge: otherOwner.badge,

                                        buyoutPrice: buyoutPrice

                                    });

                                }

                            }

                        }

                    }

                }

            }

        }

        return candidates;

    },

    // Aktualizace trvání paktů a celních kontrol na konci celého kola,

    advanceRoundsForPactsAndIntrigues: function (state) {

        if (state.activePacts && state.activePacts.length > 0) {

            for (var i = state.activePacts.length - 1; i >= 0; i--) {

                state.activePacts[i].remainingRounds--;

                if (state.activePacts[i].remainingRounds <= 0) {

                    var p1 = state.players[state.activePacts[i].p1];

                    var p2 = state.players[state.activePacts[i].p2];

                    this.addLog(state, "📜 Obchodní pakt mezi " + p1.badge + " " + p1.name + " a " + p2.badge + " " + p2.name + " po 8 kolech vypršel.");

                    state.activePacts.splice(i, 1);

                }

            }

        }

        for (var p = 0; p < state.players.length; p++) {

            if (state.players[p].frozenRentRounds > 0) {

                state.players[p].frozenRentRounds--;

                if (state.players[p].frozenRentRounds === 0) {

                    this.addLog(state, "🏰 Královská celní kontrola nad panstvími rytíře " + state.players[p].name + " skončila.");

                }

            }

        }

    },

    // Přepočet průběžných chovatelských bodů, kompletních sad zvířat a kontrola vítězství,

    recalculateBreedingAndVictory: function (state) {

        var animalTotals = [];

        for (var i = 0; i < state.players.length; i++) {

            var p = state.players[i];

            var val = 0;

            for (var j = 0; j < p.ownedNodes.length; j++) {

                var nd = state.board.nodes[p.ownedNodes[j]];

                if (nd && nd.type === "ANIMAL") {

                    val += this.getNodePrice(state, nd);

                }

            }

            p.animalValue = val;

            p.breedingHearts = 0;

            if (val > 0) {

                animalTotals.push({ index: i, val: val });

            }

        }

        animalTotals.sort(function (a, b) { return b.val - a.val; });

        var awards = state.config.animalBreedingHearts || [3, 2, 1];

        for (var k = 0; k < Math.min(awards.length, animalTotals.length); k++) {

            var winnerIdx = animalTotals[k].index;

            state.players[winnerIdx].breedingHearts = awards[k];

        }

        // 3.1 Balanc: Bonus za kompletní sady zvířat (Kůň + Pes + Sokol ze stejné sady 1..12 -> +1.0 💖 za každou sadu)

        for (var pIdx = 0; pIdx < state.players.length; pIdx++) {

            var plObj = state.players[pIdx];

            var setCounts = {};

            for (var on = 0; on < plObj.ownedNodes.length; on++) {

                var animNode = state.board.nodes[plObj.ownedNodes[on]];

                if (animNode && animNode.type === "ANIMAL" && animNode.setId) {

                    var sid = animNode.setId;

                    if (!setCounts[sid]) setCounts[sid] = { kun: 0, pes: 0, sokol: 0 };

                    if (animNode.subtype) setCounts[sid][animNode.subtype]++;

                }

            }

            var completeSets = 0;

            for (var sKey in setCounts) {

                if (setCounts[sKey].kun >= 1 && setCounts[sKey].pes >= 1 && setCounts[sKey].sokol >= 1) {

                    completeSets++;

                }

            }

            plObj.completeSetsCount = completeSets;

            plObj.setHeartsBonus = completeSets * 1.0;

        }

        for (var m = 0; m < state.players.length; m++) {

            var pl = state.players[m];

            pl.totalHearts = Math.round((pl.permanentHearts + pl.breedingHearts + (pl.setHeartsBonus || 0)) * 10) / 10;

            var isWin = false;

            var winReason = "";

            var scen = (state.config && state.config.scenario) ? state.config.scenario : "classic";

            var winTypeAchieved = null;

            if (scen === "slayer") {

                // Lovci draků: ulovení 2 draků (z U3) nebo dosažení cílových srdcí (20 💖)

                var dragonsSlain = (pl.stats && pl.stats.dragonsSlain) ? pl.stats.dragonsSlain : 0;

                if (dragonsSlain >= 2) {

                    isWin = true;

                    winTypeAchieved = "slayer_dragons";

                    winReason = "🏆 VÍTĚZSTVÍ LOVCE DRAKŮ! " + pl.badge + " " + pl.name + " skolil 2 obávané draky království a získává věčnou slávu i ruku princezny!";

                } else if (pl.totalHearts >= state.config.targetHearts) {

                    isWin = true;

                    winTypeAchieved = "target_hearts";

                    winReason = "🏆 VÍTĚZSTVÍ! " + pl.badge + " " + pl.name + " dosáhl cílových " + state.config.targetHearts + " 💖 a získává ruku princezny!";

                }

            } else if (scen === "tycoon") {

                // Feudální magnát: ovládnutí 3 měst a 1 hradu nebo cílových srdcí

                var cCount = 0, kCount = 0;

                for (var oi = 0; oi < pl.ownedNodes.length; oi++) {

                    var oNd = state.board.nodes[pl.ownedNodes[oi]];

                    if (oNd) {

                        if (oNd.level === 3 || oNd.type === "CASTLE") kCount++;

                        else if (oNd.level === 2 || oNd.type === "TOWN") cCount++;

                    }

                }

                if (cCount >= 3 && kCount >= 1) {

                    isWin = true;

                    winTypeAchieved = "tycoon_estates";

                    winReason = "🏆 VÍTĚZSTVÍ FEUDÁLNÍHO MAGNÁTA! " + pl.badge + " " + pl.name + " ovládl 3 vzkvétající města a 1 hrad (" + cCount + " měst, " + kCount + " hradů)!";

                } else if (pl.totalHearts >= state.config.targetHearts) {

                    isWin = true;

                    winTypeAchieved = "target_hearts";

                    winReason = "🏆 VÍTĚZSTVÍ! " + pl.badge + " " + pl.name + " dosáhl cílových " + state.config.targetHearts + " 💖 a získává ruku princezny!";

                }

            } else {

                if (pl.totalHearts >= state.config.targetHearts) {

                    isWin = true;

                    winTypeAchieved = "target_hearts";

                    winReason = "🏆 VÍTĚZSTVÍ! " + pl.badge + " " + pl.name + " dosáhl cílových " + state.config.targetHearts + " 💖 a získává ruku princezny!";

                }

            }

            if (state.winnerIndex === null && isWin) {

                state.winnerIndex = m;

                state.winType = winTypeAchieved;

                state.phase = "GAME_OVER";

                this.addLog(state, winReason, "win");

            }

        }

        // Kontrola jediného přeživšího rytíře v Ultimate módu

        if (state.config.bankruptcyElimination && state.winnerIndex === null) {

            var activePlayers = [];

            for (var ap = 0; ap < state.players.length; ap++) {

                if (!state.players[ap].isEliminated) activePlayers.push(state.players[ap]);

            }

            if (activePlayers.length === 1) {

                var soleSurvivor = activePlayers[0];

                state.winnerIndex = soleSurvivor.index;

                state.winType = "sole_survivor";

                state.phase = "GAME_OVER";

                this.addLog(state, "💀 VÍTĚZSTVÍ PŘEŽITÍM! " + soleSurvivor.badge + " " + soleSurvivor.name + " jako jediný rytíř nezkrachoval a stává se vládcem království!", "win");

            }

        }

    },

    // Pomocná predikce cílového pole pro určitou větev,

    getTargetNodeForBranch: function (state, startNodeId, branchType, steps) {

        var nodes = state.board.nodes;

        var currNode = nodes[startNodeId];

        if (!currNode) return null;

        var nextId = (branchType === "high") ? currNode.branchHigh : currNode.branchLow;

        if (nextId === null || nextId === undefined) nextId = (currNode.next && currNode.next[0] !== undefined) ? currNode.next[0] : 0;

        var curr = nextId;

        for (var s = 1; s < steps; s++) {

            var n = nodes[curr];

            if (!n || !n.next || n.next.length === 0) break;

            if (n.branchLow !== null && n.branchLow !== undefined) {

                curr = (branchType === "high" && n.branchHigh !== null) ? n.branchHigh : n.branchLow;

            } else {

                curr = n.next[0];

            }

        }

        return nodes[curr] || null;

    },

    // Pomocná predikce cílového pole pro zadaný hod,

    getTargetNodeForRoll: function (state, player, rollValue) {

        var nodes = state.board.nodes;

        var curr = player.nodeId;

        for (var s = 0; s < rollValue; s++) {

            var n = nodes[curr];

            if (!n || !n.next || n.next.length === 0) break;

            if (n.branchLow !== null && n.branchLow !== undefined && n.branchHigh !== null && n.branchHigh !== undefined) {

                var pref = (player.type === "Bot_Aggressive" || player.type === "Bot_Noble") ? n.branchHigh : n.branchLow;

                curr = pref;

            } else {

                curr = n.next[0];

            }

        }

        return nodes[curr] || null;

    },

    // Hodnocení atraktivity pole pro bota / taktické rozhodování,

    continueMovementFromBranch: function (state, branchChoice) {

        if (!state.pendingBranchChoice) return null;

        var pbc = state.pendingBranchChoice;

        var player = state.players[state.currentPlayerIndex];

        var currentId = pbc.junctionNodeId;

        var currNode = state.board.nodes[currentId];

        var remainingSteps = pbc.remainingSteps;

        var passedBridgeFestival = pbc.passedBridgeFestival || false;

        var path = pbc.pathSoFar ? pbc.pathSoFar.slice() : [currentId];

        var choice = branchChoice === "high" ? "high" : "low";

        var nextId = (choice === "high") ? pbc.branchHigh : pbc.branchLow;

        var branchName = (choice === "high") ? "vnitřní královskou stezku" : "vnější okruh";

        if (currNode && currNode.code === "SLAV_TURNAJ") {

            branchName = (choice === "high") ? "královským průvodem na Zámecký Ples" : "hlavní okruh";

        }

        var nodeName = currNode ? currNode.name : ("Pole #" + currentId);

        this.addLog(state, "🪧 " + player.badge + " " + player.name + " na rozcestí " + nodeName + " volí **" + branchName + "**.");

        for (var step = 0; step < remainingSteps; step++) {

            if (step > 0) {

                var cNode = state.board.nodes[currentId];

                nextId = (cNode.next && cNode.next[0] !== undefined) ? cNode.next[0] : 0;

                if (cNode.branchLow !== null && cNode.branchLow !== undefined &&

                    cNode.branchHigh !== null && cNode.branchHigh !== undefined) {

                    nextId = (choice === "high") ? cNode.branchHigh : cNode.branchLow;

                }

            }

            currentId = nextId;

            path.push(currentId);

            var enteredNode = state.board.nodes[currentId];

            if (enteredNode.type === "START") {

                var isLandless = (!player.ownedNodes || player.ownedNodes.length === 0);

                var stipend = isLandless ? (state.config.passStartGoldLandless || 5000) : state.config.passStartGold;

                player.gold += stipend;

                var stNow = this.getEffectiveStats(state, player);

                var hasNobleStatus = (stNow.ownedCastles > 0 || stNow.ownedTowns > 0);

                var courtHearts = 0;

                if (hasNobleStatus) {

                    courtHearts = stNow.charisma >= 4 ? 1.0 : (stNow.charisma >= 2 ? 0.5 : 0);

                }

                var stipendDesc = isLandless ? "zvýšenou královskou podporu pro nemajetné **+" + stipend + " zl.**" : "žold +" + stipend + " zl.";

                if (courtHearts > 0) {

                    player.permanentHearts += courtHearts;

                    player.stats.heartsFromFestivals += courtHearts;

                    this.addLog(state, "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + " a +" + courtHearts + " 💖 při královské audienci (díky šlechtickému titulu)!", "gold");

                } else {

                    this.addLog(state, "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + ".", "gold");

                }

            }

            if (enteredNode.type === "BONUS" && enteredNode.bonusGold) {

                player.gold += enteredNode.bonusGold;

                this.addLog(state, "⛲ " + player.badge + " " + player.name + " získává prémii +" + enteredNode.bonusGold + " zl. na poli " + enteredNode.name + ".");

            }

            if (enteredNode.code === "SLAV_PLES") {

                passedBridgeFestival = true;

            }

        }

        player.nodeId = currentId;

        state.lastPath = path;

        state.phase = "ACTION";

        state.pendingBranchChoice = null;

        var landedNode = state.board.nodes[currentId];

        this.addLog(state, "🎲 " + player.badge + " " + player.name + " dokončil tah (" + pbc.totalRoll + ") a dorazil na pole **" + landedNode.name + "**.");

        this.resolveLandedNode(state, player, landedNode, pbc.totalRoll);

        this.attachPlayerInteractions(state, player, landedNode);

        if (passedBridgeFestival && landedNode.type !== "FESTIVAL") {

            var festTypes = ["turnaj", "ples", "zavod"];

            state.pendingAction.canResolveFestival = true;

            state.pendingAction.festivalType = festTypes[state.roundNumber % 3];

            state.pendingAction.summary += " Při průchodu pod hradem (♡ ♡ ♡) se navíc koná Královská slavnost!";

        }

        this.recalculateBreedingAndVictory(state);

        return {

            roll: pbc.totalRoll,

            path: path,

            node: landedNode,

            resumedPath: path.slice(pbc.pathSoFar ? pbc.pathSoFar.length - 1 : 0)

        };

    },

    // Hod kostkou a pohyb po plánu,

    rollAndMove: function (state, forcedRoll, branchChoices) {

        if (state.phase === "GAME_OVER") return null;

        var player = state.players[state.currentPlayerIndex];

        if (player.isImprisoned) {

            this.addLog(state, "⛓️ " + player.badge + " " + player.name + " je uvězněn v Královské šatlavě!");

            state.phase = "ACTION";

            var bailCur = (state.config && state.config.prisonBail) ? state.config.prisonBail : 1000;

            state.pendingAction = {

                type: "PRISON",

                nodeId: player.nodeId,

                canPayPrisonBail: true,

                bailCost: bailCur,

                canAttemptPrisonEscape: true,

                canServeSentence: true,

                summary: "Jsi v Šatlavě! Zvol: Složit kauci (" + bailCur.toLocaleString("cs-CZ") + " zl.), pokus o útěk (kostka 6), nebo odpykat trest."

            };

            return { roll: 0, path: [player.nodeId] };

        }

        if (player.skipTurns > 0) {

            player.skipTurns--;

            this.addLog(state, "⏳ " + player.badge + " " + player.name + " se zotavuje na STARTu a vynechává tento tah.");

            state.phase = "ACTION";

            state.pendingAction = { type: "SKIPPED", message: "Zotavuješ se ze zranění a vynecháváš tah." };

            return { roll: 0, path: [player.nodeId] };

        }

        var roll = forcedRoll || (Math.floor(Math.random() * 6) + 1);

        state.lastRoll = roll;

        var currentId = player.nodeId;

        var path = [currentId];

        var passedBridgeFestival = false;

        for (var step = 0; step < roll; step++) {

            var currNode = state.board.nodes[currentId];

            var nextId = currNode.next[0];

            // Taktické rozcestí (Volba větve)

            if (currNode.branchLow !== null && currNode.branchLow !== undefined &&

                currNode.branchHigh !== null && currNode.branchHigh !== undefined) {

                // Pokud je hráč Člověk a větev zatím nebyla zvolena: zastavíme a vyžádáme volbu

                if (player.type === "Human" && (!branchChoices || !branchChoices[currNode.id])) {

                    var remainingSteps = roll - step;

                    player.nodeId = currentId;

                    state.lastPath = path;

                    state.phase = "BRANCH_CHOICE";

                    state.pendingBranchChoice = {

                        junctionNodeId: currentId,

                        remainingSteps: remainingSteps,

                        totalRoll: roll,

                        passedBridgeFestival: passedBridgeFestival,

                        pathSoFar: path.slice(),

                        branchLow: currNode.branchLow,

                        branchHigh: currNode.branchHigh

                    };

                    return {

                        status: "BRANCH_REQUIRED",

                        roll: roll,

                        path: path,

                        junctionNode: currNode,

                        remainingSteps: remainingSteps,

                        branchLow: currNode.branchLow,

                        branchHigh: currNode.branchHigh

                    };

                }

                // Pokud je větev předvolena nebo je na tahu bot:

                var choice = (branchChoices && branchChoices[currNode.id]) || this.decideBotBranch(state, player, currNode, roll - step);

                nextId = (choice === "high") ? currNode.branchHigh : currNode.branchLow;

                var branchName = (choice === "high") ? "vnitřní královskou stezku" : "vnější okruh";

                if (currNode.code === "SLAV_TURNAJ") {

                    branchName = (choice === "high") ? "královským průvodem na Zámecký Ples" : "hlavní okruh";

                }

                this.addLog(state, "🪧 " + player.badge + " " + player.name + " na rozcestí " + currNode.name + " volí **" + branchName + "**.");

            }

            currentId = nextId;

            path.push(currentId);

            var enteredNode = state.board.nodes[currentId];

            // Průchod nebo stoupnutí na START

            if (enteredNode.type === "START") {

                var isLandless = (!player.ownedNodes || player.ownedNodes.length === 0);

                var stipend = isLandless ? (state.config.passStartGoldLandless || 5000) : state.config.passStartGold;

                player.gold += stipend;

                var stNow = this.getEffectiveStats(state, player);

                // 3.1 Balanc: Zisk Srdce z audience u krále vyžaduje šlechtický status (alespoň 1 Město či Hrad)

                var hasNobleStatus = (stNow.ownedCastles > 0 || stNow.ownedTowns > 0);

                var courtHearts = 0;

                if (hasNobleStatus) {

                    courtHearts = stNow.charisma >= 4 ? 1.0 : (stNow.charisma >= 2 ? 0.5 : 0);

                }

                var stipendDesc = isLandless ? "zvýšenou královskou podporu pro nemajetné **+" + stipend + " zl.**" : "žold +" + stipend + " zl.";

                if (courtHearts > 0) {

                    player.permanentHearts += courtHearts;

                    player.stats.heartsFromFestivals += courtHearts;

                    this.addLog(state, "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + " a +" + courtHearts + " 💖 při královské audienci (díky šlechtickému titulu)!", "gold");

                } else if (stNow.charisma >= 2 && !hasNobleStatus) {

                    this.addLog(state, "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + " (pro audienci u krále a zisk Srdce z Charismatu je však nutné vlastnit Město či Hrad).", "gold");

                } else {

                    this.addLog(state, "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + ".", "gold");

                }

            }

            // Bonusová pole na vnitřních větvích (+200, +300, +400 zl.)

            if (enteredNode.type === "BONUS" && enteredNode.bonusGold) {

                player.gold += enteredNode.bonusGold;

                this.addLog(state, "⛲ " + player.badge + " " + player.name + " získává prémii +" + enteredNode.bonusGold + " zl. na poli " + enteredNode.name + ".");

            }

            // Průchod pod balkónem princezny (trojice srdíček ♡ ♡ ♡ na centrálním mostě)

            if (enteredNode.code === "SLAV_PLES") {

                passedBridgeFestival = true;

            }

        }

        player.nodeId = currentId;

        state.lastPath = path;

        state.phase = "ACTION";

        var landedNode = state.board.nodes[currentId];

        this.addLog(state, "🎲 " + player.badge + " " + player.name + " hodil **" + roll + "** a dorazil na pole **" + landedNode.name + "**.");

        this.resolveLandedNode(state, player, landedNode, roll);

        this.attachPlayerInteractions(state, player, landedNode);

        if (passedBridgeFestival && landedNode.type !== "FESTIVAL") {

            var festTypes = ["turnaj", "ples", "zavod"];

            state.pendingAction.canResolveFestival = true;

            state.pendingAction.festivalType = festTypes[state.roundNumber % 3];

            state.pendingAction.summary += " Při průchodu pod hradem (♡ ♡ ♡) se navíc koná Královská slavnost!";

        }

        this.recalculateBreedingAndVictory(state);

        return { roll: roll, path: path, node: landedNode };

    },

    // Připojení interakcí mezi hráči (Duel, Přípitek, Výkup sad, Intriky, Pakt, Výzva),

    attachPlayerInteractions: function (state, player, node) {

        if (!state.pendingAction) state.pendingAction = { nodeId: node.id };

        var pa = state.pendingAction;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        // 1. Setkání na stejném poli (Duel vs Přípitek)

        if (node.type !== "START" && node.type !== "HOSPITAL" && node.type !== "PRISON") {

            var others = [];

            for (var i = 0; i < state.players.length; i++) {

                var o = state.players[i];

                if (o.index !== player.index && !o.isEliminated && o.nodeId === node.id) {

                    others.push(o);

                }

            }

            if (others.length > 0) {

                var targetP = others[0];

                var duelStake = Math.round(1000 * (rate > 0 ? rate : 0.5));

                var toastCost = Math.round(500 * (rate > 0 ? rate : 0.5));

                pa.encounterPlayer = {

                    index: targetP.index,

                    name: targetP.name,

                    badge: targetP.badge,

                    color: targetP.color,

                    duelStake: duelStake,

                    toastCost: toastCost

                };

                if (rate > 0) {

                    pa.canDuelPlayer = true;

                }

                var canToast = (player.gold >= toastCost && (!player.lastToastRound || state.roundNumber - player.lastToastRound >= 3));

                if (canToast) {

                    pa.canToastPlayer = true;

                }

            }

        }

        // 2. Šlechtický výkup ze sady (Královské předkupní právo)

        var buyouts = this.getAnimalBuyoutCandidates(state, player, node);

        if (buyouts.length > 0) {

            pa.canBuyoutAnimalSet = true;

            pa.buyoutCandidates = buyouts;

        }

        // 3. Dvorní intriky u Kejklíře a v Krčmě

        if ((node.type === "JESTER" || node.type === "TAVERN") && rate > 0) {

            pa.canPlotIntrigue = true;

            pa.intrigueBalladCost = Math.round(1500 * rate);

            pa.intrigueCustomsCost = Math.round(1200 * rate);

        }

        // 4. Obchodní pakt u Obchodníka a na STARTu

        if ((node.type === "START" || node.type === "MERCHANT" || node.type === "OBCHOD") && rate > 0) {

            pa.canFormTradePact = true;

            pa.tradePactCost = Math.round(1500 * rate);

        }

        // 5. Osobní výzva na Slavnosti

        if (node.type === "FESTIVAL" && rate > 0) {

            pa.canChallengeFestivalRival = true;

            pa.festivalChallengeStake = Math.round(1500 * rate);

        }

    },

    // Vyhodnocení pole, na kterém hráč skončil pohyb,

    resolveLandedNode: function (state, player, node, moveRoll) {

        state.pendingAction = {

            nodeId: node.id,

            nodeType: node.type,

            canBuyNode: false,

            canUpgradeVillage: false,

            canTrainMaster: false,

            masterRoll: null,

            canShopMerchant: false,

            canResolveQuest: false,

            questCard: null,

            canResolveFestival: false,

            summary: ""

        };

        // 1. Koupitelná pole (Zvířata, Vesnice, Města, Hrady, Kejklíři, Řemeslné budovy)

        if (this.isPurchasableNode(node)) {

            var price = this.getNodePrice(state, node);

            if (node.owner === null) {

                state.pendingAction.canBuyNode = true;

                state.pendingAction.buyPrice = price;

                state.pendingAction.summary = "Pole je volné ke koupi za " + price + " zl.";

            } else if (node.owner === player.index) {

                if (node.type === "VILLAGE" && node.villageLevel < 3) {

                    var upgCost = state.config.estates.villagePrices[node.villageLevel] || 1500;

                    state.pendingAction.canUpgradeVillage = true;

                    state.pendingAction.upgradeCost = upgCost;

                    state.pendingAction.summary = "Vlastníš tuto vesnici (úroveň " + node.villageLevel + "/3). Můžeš ji povýšit za " + upgCost + " zl.";

                } else {

                    state.pendingAction.summary = "Odpočíváš na svém vlastním panství.";

                }

            } else {

                // Cizí vlastník -> zaplacení nájmu / poplatku

                var owner = state.players[node.owner];

                // 1. Kontrola celní kontroly (intrika)

                if (owner.frozenRentRounds && owner.frozenRentRounds > 0) {

                    var frozenMsg = "📜 Královská celní kontrola! Panství " + node.name + " je pod dohledem a " + player.badge + " " + player.name + " v tomto kole neplatí žádný nájem.";

                    this.addLog(state, frozenMsg, "info");

                    state.pendingAction.summary = frozenMsg;

                    return;

                }

                // 2. Kontrola obchodního paktu (bezcelní aliance + dividenda)

                if (this.hasActiveTradePact(state, player.index, owner.index)) {

                    var divBonus = 300;

                    player.gold += divBonus;

                    owner.gold += divBonus;

                    var pactMsg = "🤝 Obchodní pakt v platnosti! " + player.badge + " " + player.name + " a " + owner.badge + " " + owner.name + " si na poli " + node.name + " neplatí nájem a oba získávají obchodní dividendu +" + divBonus + " zl.!";

                    this.addLog(state, pactMsg, "gold");

                    state.pendingAction.summary = pactMsg;

                    return;

                }

                var rent = this.calculateNodeRent(state, node, owner, moveRoll);

                var actualPaid = this.transferGold(state, player, owner, rent);

                player.stats.rentPaid += actualPaid;

                owner.stats.rentCollected += actualPaid;

                var remainingDebt = rent - actualPaid;

                if (remainingDebt <= 0) {

                    var msg = "💸 " + player.badge + " " + player.name + " platí poplatek **" + actualPaid + " zl.** hráči " + owner.badge + " " + owner.name + " (" + node.name + ").";

                    this.addLog(state, msg, "rent");

                    state.pendingAction.summary = msg;

                } else {

                    var hasAssets = (player.items.length > 0 || player.ownedNodes.length > 0);

                    if (hasAssets) {

                        this.addLog(state, "💸 " + player.badge + " " + player.name + " neměl dost hotovosti! Zaplatil hotově " + actualPaid + " zl., zbývá dluh **" + remainingDebt + " zl.** vůči hráči " + owner.badge + " " + owner.name + " (" + node.name + ").", "rent");

                        state.pendingAction.debt = {

                            creditorIndex: owner.index,

                            nodeId: node.id,

                            originalRent: rent,

                            cashPaid: actualPaid,

                            remainingDebt: remainingDebt

                        };

                        if (player.type !== "Human") {

                            // Bot provede automatickou nucenou likvidaci

                            this.autoLiquidateDebt(state, player);

                        } else {

                            state.pendingAction.summary = "⚖️ Dlužíš ještě **" + remainingDebt + " zl.** hráči " + owner.name + "! Vyber majetek k odprodeji za 60 % ceny.";

                        }

                    } else {

                        var noAssetMsg = "💸 " + player.badge + " " + player.name + " zaplatil hotově jen " + actualPaid + " zl. (z " + rent + " zl.) a jako nemajetný nemá další majetek k odprodeji.";

                        this.addLog(state, noAssetMsg, "rent");

                        state.pendingAction.summary = noAssetMsg;

                    }

                }

            }

            return;

        }

        // 2. Mistr vlastnosti (MB, MJ, MT, MCH, VM)

        if (node.type === "MASTER") {

            var mRoll = Math.floor(Math.random() * 6) + 1;

            state.pendingAction.masterRoll = mRoll;

            if (mRoll >= state.config.masterMinRoll) {

                state.pendingAction.canTrainMaster = true;

                state.pendingAction.skill = node.skill;

                state.pendingAction.summary = "Mistr je v dobrém rozmaru (hod " + mRoll + " ≥ 4)! Můžeš si zaplatit výcvik.";

                this.addLog(state, "🎓 " + player.name + " uspěl u " + node.name + " (hod " + mRoll + ") a může trénovat!");

            } else {

                state.pendingAction.summary = "Mistr dnes nepřijímá žáky (hodil jsi " + mRoll + ", potřeba 4–6).";

                this.addLog(state, "🎓 " + player.name + " neuspěl u " + node.name + " (hod " + mRoll + ", potřeba 4–6).");

            }

            return;

        }

        // 3. Obchodník (Nákup Věcí 1–3, prodej věcí za 1/2 a budov za 100%)

        if (node.type === "MERCHANT") {

            state.pendingAction.canShopMerchant = true;

            state.pendingAction.summary = "Vítej u Královského obchodníka! Můžeš nakupovat Věci 1–3 nebo výhodně prodávat majetek.";

            return;

        }

        // 4. Výběrčí daní (VD)

        if (node.type === "TAX") {

            this.resolveTaxCollector(state, player);

            return;

        }

        // 5. Náhoda (N)

        if (node.type === "CHANCE") {

            this.resolveChanceCard(state, player);

            return;

        }

        // 6. Úkol / Souboj (U1, U2, U3)

        if (node.type === "QUEST") {

            var qList = window.PRS_QUESTS[node.subtype] || window.PRS_QUESTS.U1;

            var qCard = this.deepClone(qList[Math.floor(Math.random() * qList.length)]);

            qCard.questTier = node.subtype;

            var qCfg = state.config.quests || {};

            var baseDiff = (node.subtype === "U3") ? (qCfg.u3BaseDiff || 13) : (node.subtype === "U2" ? (qCfg.u2BaseDiff || 9) : (qCfg.u1BaseDiff || 5));

            qCard.difficulty = Math.max(2, baseDiff + (qCard.diffOffset || 0));

            state.pendingAction.canResolveQuest = true;

            state.pendingAction.questCard = qCard;

            state.pendingAction.summary = "Čeká tě " + qCard.name + " (Obtížnost " + qCard.difficulty + ")! Hoď kostkou do boje.";

            return;

        }

        // 7. Slavnost (Turnaj, Ples, Závod)

        if (node.type === "FESTIVAL") {

            state.pendingAction.canResolveFestival = true;

            state.pendingAction.festivalType = node.subtype;

            state.pendingAction.summary = "Vstupuješ na pole **" + node.name + "**! Zahaj slavnost pro všechny způsobilé rytíře.";

            return;

        }

        // 8. Královská šatlava (PRISON)

        if (node.type === "PRISON") {

            player.isImprisoned = true;

            player.prisonTurns = 1;

            var bail = (state.config && state.config.prisonBail) ? state.config.prisonBail : 1000;

            state.pendingAction.canPayPrisonBail = true;

            state.pendingAction.bailCost = bail;

            state.pendingAction.canAttemptPrisonEscape = true;

            state.pendingAction.canServeSentence = true;

            var prisonMsg = "⛓️ Královská stráž uvrhla rytíře " + player.badge + " " + player.name + " do Šatlavy! Můžeš složit kauci (" + bail.toLocaleString("cs-CZ") + " zl.), zkusit uprchnout hodem 6, nebo odsedět trest.";

            state.pendingAction.summary = prisonMsg;

            this.addLog(state, prisonMsg, "danger");

            return;

        }

        // 9. Královský lazaret / Špitál (HOSPITAL)

        if (node.type === "HOSPITAL") {

            var hospMult = (state.config && state.config.hospitalMultiplier) || 1;

            var elixCost = Math.round(800 * hospMult);

            state.pendingAction.canBuyHospitalElixir = true;

            state.pendingAction.elixirCost = elixCost;

            state.pendingAction.canRestHospital = true;

            var hospMsg = "🏥 Rytíř " + player.badge + " " + player.name + " dorazil do Královského lazaretu. Může zakoupit hojivý lektvar (+1 Boj a zotavení za " + elixCost.toLocaleString("cs-CZ") + " zl.) nebo zdarma odpočívat.";

            state.pendingAction.summary = hospMsg;

            this.addLog(state, hospMsg, "info");

            return;

        }

        // 10. Krčma / Hostinec (TAVERN)

        if (node.type === "TAVERN") {

            state.pendingAction.canTavernGamble = true;

            state.pendingAction.gambleBet = 500;

            state.pendingAction.canBuyTavernRound = true;

            state.pendingAction.roundCost = 400;

            var tavMsg = "🍺 Vítej v hostinci U Zlatého korbelu! Rytíři zde hrají kostky s krčmářem o zlaťáky (sázka 500 zl.) nebo zvou společnost na rundu pro zvýšení své slávy (+0.5 💖).";

            state.pendingAction.summary = tavMsg;

            this.addLog(state, tavMsg, "info");

            return;

        }

    },

    // Výpočet poplatku na cizím poli,

    calculateNodeRent: function (state, node, owner, moveRoll) {

        var cfg = state.config;

        if (node.type === "ANIMAL") {

            return this.calculateAnimalRent(state, node, owner);

        }

        if (node.type === "VILLAGE") {

            var lvl = (node.villageLevel || 1) - 1;

            return cfg.estates.villageRent[lvl] || 300;

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

            return moveRoll * (cfg.jesterRentMultiplier || 100) * Math.max(1, jesterCount);

        }

        if (node.type === "BUILDING") {

            var count = 0;

            for (var j = 0; j < owner.ownedNodes.length; j++) {

                var bn = state.board.nodes[owner.ownedNodes[j]];

                if (!bn) continue;

                if (node.subtype === "staje" && bn.type === "ANIMAL" && bn.subtype === "kun") count++;

                if (node.subtype === "sokolnik" && bn.type === "ANIMAL" && bn.subtype === "sokol") count++;

                if (node.subtype === "psovod" && bn.type === "ANIMAL" && bn.subtype === "pes") count++;

            }

            if (node.subtype === "kovarna" || node.subtype === "krejci") {

                count = owner.items.length;

            }

            return Math.max(1, count) * (cfg.buildingFeePerItem || 400);

        }

        return 300;

    },

    computeNodeRent: function (state, node, owner, moveRoll) {

        return this.calculateNodeRent(state, node, owner, moveRoll || 1);

    },

    calculateRent: function (state, node, owner, moveRoll) {

        return this.calculateNodeRent(state, node, owner, moveRoll || 1);

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

            if (playerYield > 0) {

                p.gold += playerYield;

                p.stats.taxesCollected += playerYield;

                totalTaxes += playerYield;

                summaryParts.push(p.name + " +" + playerYield + " zl.");

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

        if (rollType < posWeight) {

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

            msg += " (Získáno +" + gain + " zl.)";

        } else if (card.effect === "robbers") {

            if (stats.boj >= 3) {

                player.gold += card.value;

                msg += " (Tvůj Boj je " + stats.boj + " -> Lapkové zahnáni, +" + card.value + " zl.!)";

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

                msg += " (Tvůj Boj je jen " + stats.boj + " -> Ztrácíš " + card.value + " zl.)";

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

            msg += " (Získáno +" + vGain + " zl.)";

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

            if (stats.hasDress || stats.tanec >= 2) {

                player.permanentHearts += card.value;

                player.stats.heartsFromChance += card.value;

                msg += " (Společenský úspěch -> +" + card.value + " 💖!)";

            } else {

                player.gold = Math.max(0, player.gold - 400);

                msg += " (Bez šatů a tance -> Pokuta 400 zl.)";

            }

        } else if (card.effect === "free_item_1") {

            var tier1Items = window.PRS_ITEMS.filter(function (it) { return it.tier === 1; });

            var gift = this.deepClone(tier1Items[Math.floor(Math.random() * tier1Items.length)]);

            player.items.push(gift);

            msg += " (Získán předmět: " + gift.icon + " " + gift.name + ")";

        } else if (card.effect === "free_skill") {

            var skKeys = ["boj", "jizda", "tanec", "charisma"];

            skKeys.sort(function (a, b) { return player.skills[a] - player.skills[b]; });

            var chosen = skKeys[0];

            if (player.skills[chosen] < 5) {

                player.skills[chosen]++;

                msg += " (Zvýšena vlastnost **" + chosen.toUpperCase() + "** na stupeň " + player.skills[chosen] + "!)";

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

                var skKeys = ["boj", "jizda", "tanec", "charisma"];

                skKeys.sort(function (a, b) { return player.skills[a] - player.skills[b]; });

                var chosenSk = skKeys[0];

                if (player.skills[chosenSk] < 5) player.skills[chosenSk]++;

                msg += "Tinktura zabrala! Získáno +1 k " + chosenSk.toUpperCase() + "!";

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

        } else if (opt.effect === "gain_jizda") {

            if (player.skills.jizda < 5) player.skills.jizda++;

            msg += "Získáno +1 k Jízdě na koni!";

        } else if (opt.effect === "gain_boj") {

            if (player.skills.boj < 5) player.skills.boj++;

            msg += "Získáno +1 k Boji!";

        } else if (opt.effect === "open_chest_loot") {

            var pool = window.PRS_ITEMS.filter(function (it) { return (it.tier === 1 || it.tier === 2) && it.slot !== "trophy"; });

            if (pool.length > 0) {

                var chestLoot = this.deepClone(pool[Math.floor(Math.random() * pool.length)]);

                player.items.push(chestLoot);

                msg += "V truhlici byl nalezen předmět: " + chestLoot.icon + " " + chestLoot.name + "!";

            }

        } else if (opt.effect === "fencer_duel") {

            if (stats.boj >= 3) {

                player.permanentHearts += 1.0;

                player.gold += 600;

                msg += "Tvůj Boj " + stats.boj + " stačil na vítězství (+1 💖, +600 zl.)!";

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

            var sks = ["boj", "jizda", "tanec", "charisma"];

            sks.sort(function (a, b) { return player.skills[a] - player.skills[b]; });

            var chSk = sks[0];

            if (player.skills[chSk] < 5) player.skills[chSk]++;

            msg += "Získáno +1 k " + chSk.toUpperCase() + "!";

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

    // Rozhodování AI botů u dilematických karet podle jejich archetypu,

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

        pa.canBuyNode = false;

        pa.summary = "Zakoupil jsi **" + node.name + "** za " + price + " zl.";

        this.addLog(state, "📜 " + player.badge + " " + player.name + " zakoupil **" + node.name + "** za " + price + " zl.", "buy");

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

        var levelNames = ["Malá vesnice", "Střední městečko", "Velká osada"];

        var msg = "🏘️ " + player.badge + " " + player.name + " povýšil **" + node.name + "** na stupeň " + node.villageLevel + " (" + levelNames[node.villageLevel - 1] + ") za " + cost + " zl.";

        this.addLog(state, msg, "buy");

        if (state.pendingAction && state.pendingAction.nodeId === node.id) {

            state.pendingAction.canUpgradeVillage = (node.villageLevel < 3);

            state.pendingAction.summary = msg;

        }

        return true;

    },

    // Výcvik u Mistra (MB, MJ, MT, MCH, VM),

    trainAtMaster: function (state, chosenSkill) {

        var pa = state.pendingAction;

        if (!pa || !pa.canTrainMaster) return false;

        var player = state.players[state.currentPlayerIndex];

        var skill = (pa.skill === "any") ? (chosenSkill || "charisma") : pa.skill;

        var currentLevel = player.skills[skill] || 0;

        if (currentLevel >= 5) return false;

        var cost = state.config.masterCosts[currentLevel] || ((currentLevel + 1) * 1000);

        if (player.gold < cost) return false;

        player.gold -= cost;

        player.skills[skill] = currentLevel + 1;

        pa.canTrainMaster = false;

        var msg = "🎓 " + player.badge + " " + player.name + " vycvičil vlastnost **" + skill.toUpperCase() + "** na stupeň **" + player.skills[skill] + "/5** za " + cost + " zl.!";

        pa.summary = msg;

        this.addLog(state, msg, "skill");

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

            var ratio = atMerchant ? rates.merchantItem : rates.anywhereItem;

            var sellPrice = Math.round(it.price * ratio);

            player.items.splice(idx, 1);

            player.gold += sellPrice;

            this.addLog(state, "💰 " + player.badge + " " + player.name + " prodal předmět **" + it.name + "** za " + sellPrice + " zl. (" + Math.round(ratio * 100) + "% ceny).");

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

                if (player.items[i].id === assetId) { idx = i; break; }

            }

            if (idx === -1) return { ok: false, message: "Předmět nenalezen." };

            var it = player.items.splice(idx, 1)[0];

            yieldVal = Math.round(it.price * rate);

            assetName = it.icon + " " + it.name;

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

                    player.isBankrupt = true;

                    player.isEliminated = true;

                    state.pendingAction.summary = "💀 ÚPLNÝ BANKROT! Rytíř " + player.name + " nemá žádný další majetek ke splacení dluhu a je navždy vyřazen ze hry!";

                    this.addLog(state, "💀 ÚPLNÝ BANKROT! " + player.badge + " " + player.name + " nedokázal splatit dluh a končí v dlužním vězení (vyřazen ze hry)!", "danger");

                    delete state.pendingAction.debt;

                    this.recalculateBreedingAndVictory(state);

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

    // Špitál: Nákup hojivého lektvaru (+1 Boj a +0.5 💖 za 800 zl.),

    buyHospitalElixir: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canBuyHospitalElixir) return false;

        var player = state.players[state.currentPlayerIndex];

        var cost = pa.elixirCost || 800;

        if (player.gold < cost) return false;

        player.gold -= cost;

        if (player.skills.boj < 5) {

            player.skills.boj++;

        }

        player.permanentHearts += 0.5;

        player.stats.heartsFromQuests += 0.5;

        pa.canBuyHospitalElixir = false;

        pa.canRestHospital = false;

        var msg = "🧪 " + player.badge + " " + player.name + " zakoupil Hojivý lektvar za " + cost + " zl.! Získává posílení Boje (+1) a +0.5 💖 za rytířskou statečnost.";

        pa.summary = msg;

        this.addLog(state, msg, "buy");

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

        player.permanentHearts += 0.5;

        player.stats.heartsFromFestivals += 0.5;

        pa.canBuyTavernRound = false;

        var msg = "🍻 Runda medoviny na účet rytíře " + player.badge + " " + player.name + "! Celá krčma bouří a pěje oslavné písně (+0.5 💖 k přízni princezny za " + cost + " zl.).";

        pa.summary = msg;

        this.addLog(state, msg, "festival");

        this.recalculateBreedingAndVictory(state);

        return true;

    },

    // 1. Rytířský duel na stejném poli,

    endTurn: function (state) {

        if (state.phase === "GAME_OVER") return;

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

        }

        state.currentPlayerIndex = nextIdx;

        state.phase = "ROLL";

        this.recalculateBreedingAndVictory(state);

    },

    // ========================================================================

    // UMĚLÁ INTELIGENCE (AI BOTI pro hru i automatické balancování ekonomiky)

    // ========================================================================
};
