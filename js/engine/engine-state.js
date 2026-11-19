// ============================================================================
// KiDesky: Princeznino srdce - Jádro enginu: stav hry, inventář, statistiky a pakty
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

            else if (cfg.scenario === "slayer") {
                cfg.targetHearts = 30;
                cfg.targetDragons = 2;
            }

            else if (cfg.scenario === "tycoon") {
                cfg.targetHearts = 30;
                cfg.targetTowns = 3;
                cfg.targetCastles = 1;
            }

            else if (cfg.scenario === "epic") cfg.targetHearts = 45;

        } else if (options.targetHearts) {

            cfg.targetHearts = Number(options.targetHearts);

        }

        var boardCode = options.boardCode || cfg.boardCode || "classic_96";
        if (cfg.customBoardRecipe && !options.customRecipe) {
            options.customRecipe = cfg.customBoardRecipe;
        }
        var board = window.PRS_BoardBuilder.createBoard(boardCode, options);
        cfg.boardCode = boardCode;
        cfg.boardTemplate = boardCode;
        if (board && board.recipe) {
            cfg.customBoardRecipe = board.recipe;
        }

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

                pawnId: window.PRS_getDefaultPawnIdForPlayer ? window.PRS_getDefaultPawnIdForPlayer(pDef, i) : (pDef.pawnId || "knight_valiant"),

                crestId: pDef.crestId || (window.PRS_HERALDRY_CATALOG ? window.PRS_HERALDRY_CATALOG[i % window.PRS_HERALDRY_CATALOG.length].id : "lion"),

                crestColor: pDef.crestColor || (window.PRS_HERALDRY_TINCTURES ? window.PRS_HERALDRY_TINCTURES[i % window.PRS_HERALDRY_TINCTURES.length].key : "gold"),

                color: pDef.color || col.hex,

                badge: col.badge,

                nodeId: 0,

                gold: cfg.startGold,

                permanentHearts: 0,

                breedingHearts: 0,

                totalHearts: 0,

                skills: {

                    combat: 0,

                    riding: 0,

                    dance: 0,

                    charisma: 0

                },

                items: [], // pole objektů z PRS_ITEMS

                inventory: [], // taktické svitky / pergameny k zahrání z ruky (max 3)

                activeScrolls: {}, // aktivní jednorázové efekty svitků

                ownedNodes: [], // pole nodeId

                livestock: {
                    cattle: 0,
                    sheep: 0,
                    pigs: 0
                },

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
            isEndlessMode: false,
            originalWinnerIndex: null,
            originalWinRound: null,
            originalWinType: null,

            activePacts: [],

            logs: []

        };

        var startGoalMsg = window.PRS_I18n ? window.PRS_I18n.t("engine.start_goal_hearts", { target: cfg.targetHearts }, "Cílem je získat " + cfg.targetHearts + " 💖.") : ("Cílem je získat " + cfg.targetHearts + " 💖.");
        if (cfg.scenario === "slayer") {
            startGoalMsg = window.PRS_I18n ? window.PRS_I18n.t("engine.start_goal_slayer", null, "Cílem scénáře 🐉 LOVCI DRAKŮ je ulovit 2 obávané draky v Dračích slujích (U3)!") : "Cílem scénáře 🐉 LOVCI DRAKŮ je ulovit 2 obávané draky v Dračích slujích (U3)!";
        } else if (cfg.scenario === "tycoon") {
            startGoalMsg = window.PRS_I18n ? window.PRS_I18n.t("engine.start_goal_tycoon", null, "Cílem scénáře 🏰 FEUDÁLNÍ MAGNÁT je vybudovat panství o 3 městech a 1 hradu!") : "Cílem scénáře 🏰 FEUDÁLNÍ MAGNÁT je vybudovat panství o 3 městech a 1 hradu!";
        }
        var startTitle = window.PRS_I18n ? window.PRS_I18n.t("engine.start_title", null, "👑 Královská trubačská fanfára! Hra „Princeznino srdce“ začíná.") : "👑 Královská trubačská fanfára! Hra „Princeznino srdce“ začíná.";
        this.addLog(state, startTitle + " " + startGoalMsg, "info");

        this.recalculateBreedingAndVictory(state);

        return state;

    },


    addLog: function (state, text, type, meta) {
        state.logs.unshift({
            turn: state.turnNumber,
            round: state.roundNumber,
            type: type || "info",
            text: text,
            meta: meta || null
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

        var animalBase = (cfg && cfg.animalBasePrices) ? cfg.animalBasePrices : { falcon: 400, dog: 500, horse: 600 };

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


    getNodeCategoryRank: function (node) {
        if (!node) return 99;
        var t = node.type;
        if (t === "ANIMAL") return 1;
        if (t === "MASTER") return 2;
        if (t === "VILLAGE") return 3;
        if (t === "TOWN") return 4;
        if (t === "CASTLE") return 5;
        return 6;
    },


    extractNumberFromCodeOrName: function (str) {
        if (!str) return 0;
        var m = String(str).match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
    },


    getAnimalSubtypeRank: function (sub) {
        if (sub === "falcon") return 1;
        if (sub === "dog") return 2;
        if (sub === "horse") return 3;
        return 4;
    },


    comparePropertyNodes: function (a, b) {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;

        var catA = this.getNodeCategoryRank(a);
        var catB = this.getNodeCategoryRank(b);
        if (catA !== catB) return catA - catB;

        // 1. Zvířata: podle levelu (1, 2, 3...) a v rámci levelu: sokol -> pes -> kůň
        if (catA === 1) {
            var lvlA = a.setId || a.animalLevel || this.extractNumberFromCodeOrName(a.code) || 0;
            var lvlB = b.setId || b.animalLevel || this.extractNumberFromCodeOrName(b.code) || 0;
            if (lvlA !== lvlB) return lvlA - lvlB;
            var subA = this.getAnimalSubtypeRank(a.subtype);
            var subB = this.getAnimalSubtypeRank(b.subtype);
            if (subA !== subB) return subA - subB;
            return (a.name || "").localeCompare(b.name || "", "cs");
        }

        // 2. Mistři: podle dovednosti (boj -> jízda -> tanec -> charisma -> velmistr) a čísla
        if (catA === 2) {
            var skOrder = { boj: 1, jizda: 2, tanec: 3, charisma: 4, any: 5 };
            var skA = skOrder[a.skill] || 6;
            var skB = skOrder[b.skill] || 6;
            if (skA !== skB) return skA - skB;
            var numA = this.extractNumberFromCodeOrName(a.code) || this.extractNumberFromCodeOrName(a.name) || 0;
            var numB = this.extractNumberFromCodeOrName(b.code) || this.extractNumberFromCodeOrName(b.name) || 0;
            if (numA !== numB) return numA - numB;
            return (a.name || "").localeCompare(b.name || "", "cs");
        }

        // 3. Vesnice, 4. Města, 5. Hrady: podle čísla (1, 2, 3, 4...)
        if (catA === 3 || catA === 4 || catA === 5) {
            var numA = this.extractNumberFromCodeOrName(a.code) || this.extractNumberFromCodeOrName(a.name) || 0;
            var numB = this.extractNumberFromCodeOrName(b.code) || this.extractNumberFromCodeOrName(b.name) || 0;
            if (numA !== numB) return numA - numB;
            return (a.name || "").localeCompare(b.name || "", "cs");
        }

        // 6. Ostatní stavby a živnosti
        return (a.name || "").localeCompare(b.name || "", "cs");
    },


    sortPlayerOwnedNodes: function (player, state) {
        if (!player || !Array.isArray(player.ownedNodes) || player.ownedNodes.length <= 1) return;
        var nodes = (state && state.board && state.board.nodes) || null;
        if (!nodes) return;
        var self = this;
        player.ownedNodes.sort(function (idA, idB) {
            return self.comparePropertyNodes(nodes[idA], nodes[idB]);
        });
    },


    getSortedOwnedNodes: function (player, state) {
        if (!player || !Array.isArray(player.ownedNodes)) return [];
        var list = player.ownedNodes.slice();
        var nodes = (state && state.board && state.board.nodes) || null;
        if (!nodes || list.length <= 1) return list;
        var self = this;
        list.sort(function (idA, idB) {
            return self.comparePropertyNodes(nodes[idA], nodes[idB]);
        });
        return list;
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
            var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === it.id; })) ||
                          (window.PRS_TROPHIES && window.PRS_TROPHIES[it.id]);

            var slot = it.slot || (baseDef ? baseDef.slot : "weapon");

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
                var bestPrice = -1;

                for (var j = 0; j < player.items.length; j++) {

                    var cand = player.items[j];
                    var candBase = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === cand.id; })) ||
                                   (window.PRS_TROPHIES && window.PRS_TROPHIES[cand.id]);
                    var candSlot = cand.slot || (candBase ? candBase.slot : "weapon");
                    var candPrice = (cand.price !== undefined && cand.price !== null) ? cand.price : (candBase && candBase.price ? candBase.price : 0);

                    if (candSlot === s && cand.isEquipped !== false) {

                        if (!bestCandidate || candPrice > bestPrice) {

                            bestCandidate = cand;
                            bestPrice = candPrice;

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

        var targetBase = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === target.id; })) ||
                         (window.PRS_TROPHIES && window.PRS_TROPHIES[target.id]);
        var slot = target.slot || (targetBase ? targetBase.slot : "weapon");
        var targetName = target.name || (targetBase ? targetBase.name : "předmět");
        var targetIcon = target.icon || (targetBase ? targetBase.icon : "📦");

        var isCurrentlyEquipped = (target.isEquipped === true);

        var msg = "";

        if (isCurrentlyEquipped) {

            target.isEquipped = false;

            msg = "🎒 " + player.badge + " " + player.name + " uložil předmět " + targetIcon + " " + targetName + " do batohu.";

        } else {

            // Sundáme jakýkoliv jiný předmět ve stejném slotu (i kdyby měl stejné ID!)

            for (var k = 0; k < player.items.length; k++) {

                var kItem = player.items[k];
                var kBase = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === kItem.id; })) ||
                            (window.PRS_TROPHIES && window.PRS_TROPHIES[kItem.id]);
                var kSlot = kItem.slot || (kBase ? kBase.slot : "weapon");

                if (kSlot === slot && kItem !== target) {

                    kItem.isEquipped = false;

                }

            }

            target.isEquipped = true;

            msg = "⚔️ " + player.badge + " " + player.name + " nasadil " + targetIcon + " " + targetName + " do aktivní výstroje!";

        }

        this.addLog(state, msg);

        this.recalculateBreedingAndVictory(state);

        return { ok: true, message: msg };

    },


    // Spočítá efektivní atributy hráče (vycvičené vlastnosti + nasazená výbava + Hrad + budovy),

    getEffectiveStats: function (state, player) {

        var eq = this.getEquippedItems(player);

        var combat = player.skills.combat;

        var riding = player.skills.riding;

        var dance = player.skills.dance;

        var charisma = player.skills.charisma;

        var slots = ["weapon", "armor", "dress", "jewel", "trophy"];

        for (var s = 0; s < slots.length; s++) {

            var item = eq[slots[s]];

            if (item) {

                var baseDef = (window.PRS_ITEMS && window.PRS_ITEMS.find(function(x) { return x.id === item.id; })) ||
                              (window.PRS_TROPHIES && window.PRS_TROPHIES[item.id]);

                var c = (item.combat !== undefined && item.combat !== null) ? item.combat : (baseDef && baseDef.combat !== undefined ? baseDef.combat : (item.boj || 0));
                var r = (item.riding !== undefined && item.riding !== null) ? item.riding : (baseDef && baseDef.riding !== undefined ? baseDef.riding : (item.jizda || 0));
                var d = (item.dance !== undefined && item.dance !== null) ? item.dance : (baseDef && baseDef.dance !== undefined ? baseDef.dance : (item.tanec || 0));
                var ch = (item.charisma !== undefined && item.charisma !== null) ? item.charisma : (baseDef && baseDef.charisma !== undefined ? baseDef.charisma : 0);

                combat += Number(c) || 0;

                riding += Number(r) || 0;

                dance += Number(d) || 0;

                charisma += Number(ch) || 0;

            }

        }

        // Bonusy z vlastněných Hradů, Měst, Vesnic a Řemeslných budov

        var ownedCastles = 0, ownedTowns = 0, ownedVillages = 0, ownedBuildings = 0, ownedJesters = 0;

        var hasStables = false, hasForge = false, hasTailor = false, hasFalconer = false, hasDoghandler = false;

        var horses = 0, dogs = 0, falcons = 0;

        var villageCattle = 0, villageSheep = 0, villagePigs = 0;

        for (var i = 0; i < player.ownedNodes.length; i++) {

            var nd = state.board.nodes[player.ownedNodes[i]];

            if (!nd) continue;

            if (nd.type === "CASTLE") ownedCastles++;

            if (nd.type === "TOWN") ownedTowns++;

            if (nd.type === "VILLAGE") {
                ownedVillages++;
                var vLvl = nd.villageLevel || 1;
                if (vLvl >= 1) villageSheep++;
                if (vLvl >= 2) villagePigs++;
                if (vLvl >= 3) villageCattle++;
            }

            if (nd.type === "JESTER") ownedJesters++;

            if (nd.type === "BUILDING") {

                ownedBuildings++;

                if (nd.subtype === "stables") hasStables = true;

                if (nd.subtype === "forge") hasForge = true;

                if (nd.subtype === "tailor") hasTailor = true;

                if (nd.subtype === "falconer") hasFalconer = true;

                if (nd.subtype === "doghandler") hasDoghandler = true;

            }

            if (nd.type === "ANIMAL") {

                if (nd.subtype === "horse") horses++;

                if (nd.subtype === "dog") dogs++;

                if (nd.subtype === "falcon") falcons++;

            }

        }

        if (!player.livestock) {
            player.livestock = { cattle: 0, sheep: 0, pigs: 0 };
        }

        var extraCattle = Number(player.livestock.cattle) || 0;
        var extraSheep = Number(player.livestock.sheep) || 0;
        var extraPigs = Number(player.livestock.pigs) || 0;

        var totalCattle = villageCattle + extraCattle;
        var totalSheep = villageSheep + extraSheep;
        var totalPigs = villagePigs + extraPigs;

        var lsCfg = (state && state.config && state.config.livestock) ? state.config.livestock : {};
        var capVil = (lsCfg.capacityPerVillage !== undefined) ? Number(lsCfg.capacityPerVillage) : 3;
        var capTown = (lsCfg.capacityPerTown !== undefined) ? Number(lsCfg.capacityPerTown) : 2;
        var capStaje = (lsCfg.capacityPerStaje !== undefined) ? Number(lsCfg.capacityPerStaje) : 4;
        var taxCattle = (lsCfg.cattleTax !== undefined) ? Number(lsCfg.cattleTax) : 200;
        var taxPigs = (lsCfg.pigsTax !== undefined) ? Number(lsCfg.pigsTax) : 150;
        var taxSheep = (lsCfg.sheepTax !== undefined) ? Number(lsCfg.sheepTax) : 120;
        var rentCattle = (lsCfg.cattleRent !== undefined) ? Number(lsCfg.cattleRent) : 100;
        var rentPigs = (lsCfg.pigsRent !== undefined) ? Number(lsCfg.pigsRent) : 75;
        var rentSheep = (lsCfg.sheepRent !== undefined) ? Number(lsCfg.sheepRent) : 50;

        var livestockCapacity = (ownedVillages * capVil) + (ownedTowns * capTown) + (hasStables ? capStaje : 0);
        var extraLivestockCount = extraCattle + extraSheep + extraPigs;
        var livestockTaxBonus = (totalCattle * taxCattle) + (totalPigs * taxPigs) + (totalSheep * taxSheep);
        var livestockVillageRentBonus = (extraCattle * rentCattle) + (extraPigs * rentPigs) + (extraSheep * rentSheep);

        var castleBonus = (state.config && state.config.estates) ? (state.config.estates.castleCharismaBonus || 1) : 1;

        charisma += ownedCastles * castleBonus;

        if (hasForge) combat += 1;

        if (hasStables) riding += 1;

        if (hasTailor) dance += 1;

        if (player.activeScrolls && player.activeScrolls.combatBonus) {
            combat += player.activeScrolls.combatBonus;
        }

        return {

            combat: Math.max(0, combat),

            riding: Math.max(0, riding),

            dance: Math.max(0, dance),

            charisma: Math.max(0, charisma),

            horses: horses,

            dogs: dogs,

            falcons: falcons,

            cattle: totalCattle,

            sheep: totalSheep,

            pigs: totalPigs,

            villageCattle: villageCattle,

            villageSheep: villageSheep,

            villagePigs: villagePigs,

            extraCattle: extraCattle,

            extraSheep: extraSheep,

            extraPigs: extraPigs,

            livestockCapacity: livestockCapacity,

            extraLivestockCount: extraLivestockCount,

            livestockTaxBonus: livestockTaxBonus,

            livestockVillageRentBonus: livestockVillageRentBonus,

            ownedCastles: ownedCastles,

            ownedTowns: ownedTowns,

            ownedVillages: ownedVillages,

            ownedBuildings: ownedBuildings,

            ownedJesters: ownedJesters,

            hasDress: !!eq.dress,

            hasWeapon: !!eq.weapon,

            hasArmor: !!eq.armor,

            hasTrophy: !!eq.trophy,

            trophyItem: eq.trophy,

            hasStables: hasStables,

            hasForge: hasForge,

            hasTailor: hasTailor,

            hasFalconer: hasFalconer,

            hasDoghandler: hasDoghandler,

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

                if (!setCounts[sid]) setCounts[sid] = { horse: 0, dog: 0, falcon: 0 };

                if (an.subtype) setCounts[sid][an.subtype]++;

            }

        }

        var isMerchant = (currentNode && (currentNode.type === "MERCHANT" || currentNode.type === "OBCHOD"));

        for (var sKey in setCounts) {

            var sc = setCounts[sKey];

            var totalInSet = (sc.horse ? 1 : 0) + (sc.dog ? 1 : 0) + (sc.falcon ? 1 : 0);

            if (totalInSet === 2) {

                var missingSubtype = !sc.horse ? "horse" : (!sc.dog ? "dog" : "falcon");

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
        if (!state || !state.players || !Array.isArray(state.players)) return;
        var hasBoardNodes = Boolean(state.board && Array.isArray(state.board.nodes));

        var animalTotals = [];
        for (var i = 0; i < state.players.length; i++) {
            var p = state.players[i];
            if (!p) continue;
            if (!Array.isArray(p.ownedNodes)) p.ownedNodes = [];
            this.sortPlayerOwnedNodes(p, state);
            var val = 0;
            if (hasBoardNodes) {
                for (var j = 0; j < p.ownedNodes.length; j++) {
                    var nd = state.board.nodes[p.ownedNodes[j]];
                    if (nd && nd.type === "ANIMAL") {
                        val += this.getNodePrice(state, nd);
                    }
                }
            }
            p.animalValue = val;
            p.breedingHearts = 0;
            if (val > 0) {
                animalTotals.push({ index: i, val: val });
            }
        }

        animalTotals.sort(function (a, b) { return b.val - a.val; });
        var awards = (state.config && state.config.animalBreedingHearts) || [4, 2.5, 1.5];
        for (var k = 0; k < Math.min(awards.length, animalTotals.length); k++) {
            var winnerIdx = animalTotals[k].index;
            if (state.players[winnerIdx]) {
                state.players[winnerIdx].breedingHearts = awards[k];
            }
        }

        // 3.1 Balanc: Bonus za kompletní sady zvířat a chovatelské trojice
        for (var pIdx = 0; pIdx < state.players.length; pIdx++) {
            var plObj = state.players[pIdx];
            if (!plObj) continue;
            if (!Array.isArray(plObj.ownedNodes)) plObj.ownedNodes = [];

            var setCounts = {};
            if (hasBoardNodes) {
                for (var on = 0; on < plObj.ownedNodes.length; on++) {
                    var animNode = state.board.nodes[plObj.ownedNodes[on]];
                    if (animNode && animNode.type === "ANIMAL" && animNode.setId) {
                        var sid = animNode.setId;
                        if (!setCounts[sid]) setCounts[sid] = { horse: 0, dog: 0, falcon: 0 };
                        if (animNode.subtype) setCounts[sid][animNode.subtype]++;
                    }
                }
            }

            var completeSets = 0;
            for (var sKey in setCounts) {
                if (setCounts[sKey].horse >= 1 && setCounts[sKey].dog >= 1 && setCounts[sKey].falcon >= 1) {
                    completeSets++;
                }
            }

            plObj.completeSetsCount = completeSets;
            plObj.setHeartsBonus = completeSets * 1.5;

            // Chovatelský titul za 3 zvířata stejného druhu (+1.0 💖 za každou trojici)
            var effSt = this.getEffectiveStats(state, plObj);
            var speciesBonus = (Math.floor(effSt.horses / 3) * 1.0) +
                               (Math.floor(effSt.dogs / 3) * 1.0) +
                               (Math.floor(effSt.falcons / 3) * 1.0);
            plObj.speciesHeartsBonus = speciesBonus;

            // Prestiž panství pro Stavitele a Dvořany (+1.0 💖 za Hrad, +0.5 💖 za Město či 3★ Vesnici)
            var castleCount = 0;
            var townCount = 0;
            var maxVillageCount = 0;
            if (hasBoardNodes) {
                for (var on2 = 0; on2 < plObj.ownedNodes.length; on2++) {
                    var estNode = state.board.nodes[plObj.ownedNodes[on2]];
                    if (!estNode) continue;
                    if (estNode.type === "CASTLE") castleCount++;
                    else if (estNode.type === "TOWN") townCount++;
                    else if (estNode.type === "VILLAGE" && (estNode.villageLevel || 1) >= 3) maxVillageCount++;
                }
            }
            var estatePrestige = (castleCount * 1.0) + (townCount * 0.5) + (maxVillageCount * 0.5);
            plObj.estateHeartsBonus = estatePrestige;
        }

        for (var m = 0; m < state.players.length; m++) {
            var pl = state.players[m];

            if (pl.stats) {
                if (typeof pl.stats.heartsFromFestivals === "number") pl.stats.heartsFromFestivals = Math.round(pl.stats.heartsFromFestivals * 10) / 10;
                if (typeof pl.stats.heartsFromQuests === "number") pl.stats.heartsFromQuests = Math.round(pl.stats.heartsFromQuests * 10) / 10;
                if (typeof pl.stats.heartsFromChance === "number") pl.stats.heartsFromChance = Math.round(pl.stats.heartsFromChance * 10) / 10;
            }
            if (typeof pl.permanentHearts === "number") pl.permanentHearts = Math.round(pl.permanentHearts * 10) / 10;
            if (typeof pl.breedingHearts === "number") pl.breedingHearts = Math.round(pl.breedingHearts * 10) / 10;
            if (typeof pl.setHeartsBonus === "number") pl.setHeartsBonus = Math.round(pl.setHeartsBonus * 10) / 10;
            if (typeof pl.speciesHeartsBonus === "number") pl.speciesHeartsBonus = Math.round(pl.speciesHeartsBonus * 10) / 10;
            if (typeof pl.estateHeartsBonus === "number") pl.estateHeartsBonus = Math.round(pl.estateHeartsBonus * 10) / 10;

            pl.totalHearts = Math.max(0, Math.round((pl.permanentHearts + pl.breedingHearts + (pl.setHeartsBonus || 0) + (pl.speciesHeartsBonus || 0) + (pl.estateHeartsBonus || 0)) * 10) / 10);

            var isWin = false;
            var winReason = "";
            var scen = (state.config && state.config.scenario) ? state.config.scenario : "classic";
            var winTypeAchieved = null;

            if (scen === "slayer") {
                // Lovci draků: ulovení 2 draků (z U3). Pouhý sběr srdcí nestačí!
                var dragonsSlain = (pl.stats && pl.stats.dragonsSlain) ? pl.stats.dragonsSlain : 0;
                var targetDragons = (state.config && state.config.targetDragons) ? state.config.targetDragons : 2;

                if (dragonsSlain >= targetDragons && !pl.isEliminated) {
                    isWin = true;
                    winTypeAchieved = "slayer_dragons";
                    winReason = "🏆 VÍTĚZSTVÍ LOVCE DRAKŮ! " + pl.badge + " " + pl.name + " skolil " + dragonsSlain + " obávané draky království a získává věčnou slávu i ruku princezny!";
                } else if (pl.totalHearts >= 20 && !pl._slayerHeartHintGiven && !pl.isEliminated) {
                    pl._slayerHeartHintGiven = true;
                    this.addLog(state, "🐉 " + pl.badge + " " + pl.name + " má již " + pl.totalHearts + " 💖! Ve scénáři Lovci draků však k vítězství musí ještě skolit " + (targetDragons - dragonsSlain) + " draka v Dračí sluji (U3)!", "info");
                }

            } else if (scen === "tycoon") {
                // Feudální magnát: ovládnutí 3 měst a 1 hradu. Pouhý sběr srdcí nestačí!
                var cCount = 0, kCount = 0;
                for (var oi = 0; oi < pl.ownedNodes.length; oi++) {
                    var oNd = state.board.nodes[pl.ownedNodes[oi]];
                    if (oNd) {
                        var isCst = (oNd.type === "CASTLE" || (oNd.type === "VILLAGE" && (oNd.villageLevel || 1) >= 3));
                        var isTwn = (oNd.type === "TOWN" || (oNd.type === "VILLAGE" && (oNd.villageLevel || 1) >= 2));
                        if (isCst) kCount++;
                        else if (isTwn) cCount++;
                    }
                }

                if (kCount >= 1 && (kCount + cCount) >= 4 && !pl.isEliminated) {
                    isWin = true;
                    winTypeAchieved = "tycoon_estates";
                    winReason = "🏆 VÍTĚZSTVÍ FEUDÁLNÍHO MAGNÁTA! " + pl.badge + " " + pl.name + " ovládl " + (kCount + cCount) + " panství (" + cCount + " měst, " + kCount + " hradů) a vybudoval nejmocnější dominium v království!";
                }

            } else {
                if (pl.totalHearts >= state.config.targetHearts && !pl.isEliminated) {
                    isWin = true;
                    winTypeAchieved = "target_hearts";
                    winReason = "🏆 VÍTĚZSTVÍ! " + pl.badge + " " + pl.name + " dosáhl cílových " + state.config.targetHearts + " 💖 a získává ruku princezny!";
                }
            }

            if (!state.isEndlessMode && state.winnerIndex === null && isWin && !pl.isEliminated) {
                state.winnerIndex = m;
                state.originalWinnerIndex = m;
                state.originalWinRound = state.roundNumber || 1;
                state.originalWinType = winTypeAchieved;
                state.winType = winTypeAchieved;
                state.phase = "GAME_OVER";
                this.addLog(state, winReason, "win");
            }

        }

        // Kontrola jediného přeživšího rytíře v Ultimate módu
        if (!state.isEndlessMode && state.config.bankruptcyElimination && state.winnerIndex === null) {

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

    }
};
