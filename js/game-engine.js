// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Herní engine, AI boti a Balancovací simulátor
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
        var cfg = this.deepClone(options.config || window.PRS_DEFAULT_CONFIG);
        if (options.targetHearts) cfg.targetHearts = Number(options.targetHearts);

        var boardCode = options.boardCode || "classic_96";
        var board = window.PRS_BoardBuilder.createBoard(boardCode);

        var playerDefs = options.players || [
            { name: "Lord Filip (Ty)", type: "Human" },
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
                stats: {
                    questsWon: 0,
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

    // Cena políčka podle typu a sady
    getNodePrice: function (state, node) {
        var cfg = state.config;
        if (!node) return 0;
        if (node.type === "ANIMAL") {
            var base = cfg.animalBasePrices[node.subtype] || 500;
            return base * (node.setId || 1);
        }
        if (node.type === "VILLAGE") {
            return cfg.estates.villagePrices[0] || 2000;
        }
        if (node.type === "TOWN") {
            return cfg.estates.townPrice || 4500;
        }
        if (node.type === "CASTLE") {
            return cfg.estates.castlePrice || 8000;
        }
        if (node.type === "JESTER") {
            return cfg.jesterPrice || 2000;
        }
        if (node.type === "BUILDING") {
            return cfg.buildingPrice || 3000;
        }
        return 0;
    },

    // Celková investovaná hodnota políčka (včetně vylepšení vesnice)
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

    // Zjistí nasazené předměty hráče (respektuje přepínání Batoh / Nasazeno)
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

    // Přepnutí předmětu: Nasazeno v ruce/na sobě vs. Uloženo v batohu
    toggleEquipItem: function (state, itemIdentifier, itemIndex) {
        var player = state.players[state.currentPlayerIndex];
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

    // Spočítá efektivní atributy hráče (vycvičené vlastnosti + nasazená výbava + Hrad + budovy)
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

    // Spočítá nájemné za šlechtické zvíře (20% za 1 kus, 40% za pár v sadě, 80% za celou sadu K+P+S)
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
        var ratios = state.config.animalRentRatios;
        var ratio = ratios.single || 0.20;
        if (countInSet === 2) ratio = ratios.pair || 0.40;
        if (countInSet >= 3) ratio = ratios.fullSet || 0.80;
        return Math.round(basePrice * ratio);
    },

    // Přepočet průběžných chovatelských bodů, kompletních sad zvířat a kontrola vítězství
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
            if (state.winnerIndex === null && pl.totalHearts >= state.config.targetHearts) {
                state.winnerIndex = m;
                state.phase = "GAME_OVER";
                this.addLog(state, "🏆 VÍTĚZSTVÍ! " + pl.badge + " " + pl.name + " získal srdce princezny (" + pl.totalHearts + " 💖) a stává se novým vládcem!", "win");
            }
        }
    },

    // Hod kostkou a pohyb po plánu
    rollAndMove: function (state, forcedRoll) {
        if (state.phase === "GAME_OVER") return null;
        var player = state.players[state.currentPlayerIndex];

        if (player.isImprisoned) {
            this.addLog(state, "⛓️ " + player.badge + " " + player.name + " je uvězněn v Královské šatlavě!");
            state.phase = "ACTION";
            state.pendingAction = {
                type: "PRISON",
                nodeId: player.nodeId,
                canPayPrisonBail: true,
                bailCost: 1000,
                canAttemptPrisonEscape: true,
                canServeSentence: true,
                summary: "Jsi v Šatlavě! Zvol: Složit kauci (1 000 zl.), pokus o útěk (kostka 6), nebo odpykat trest."
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

            // Rozcestí (1-3 vs 4-6)
            if (currNode.branchLow !== null && currNode.branchLow !== undefined &&
                currNode.branchHigh !== null && currNode.branchHigh !== undefined) {
                nextId = (roll <= 3) ? currNode.branchLow : currNode.branchHigh;
                if (step === 0) {
                    if (currNode.code === "SLAV_TURNAJ") {
                        this.addLog(state, "🪧 " + player.name + " hodil " + roll + " v Turnaji a " + (roll <= 3 ? "opouští turnajové klání na hlavní okruh (1–3)." : "pokračuje královským průvodem na Zámecký Ples (4–6)!"));
                    } else {
                        this.addLog(state, "🪧 " + player.name + " hodil " + roll + " na rozcestí a vydává se " + (roll <= 3 ? "vnější cestou (1–3)." : "vnitřní královskou stezkou (4–6)!"));
                    }
                }
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
        if (passedBridgeFestival && landedNode.type !== "FESTIVAL") {
            var festTypes = ["turnaj", "ples", "zavod"];
            state.pendingAction.canResolveFestival = true;
            state.pendingAction.festivalType = festTypes[state.roundNumber % 3];
            state.pendingAction.summary += " Při průchodu pod hradem (♡ ♡ ♡) se navíc koná Královská slavnost!";
        }
        this.recalculateBreedingAndVictory(state);
        return { roll: roll, path: path, node: landedNode };
    },

    // Vyhodnocení pole, na kterém hráč skončil pohyb
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
            state.pendingAction.canPayPrisonBail = true;
            state.pendingAction.bailCost = 1000;
            state.pendingAction.canAttemptPrisonEscape = true;
            state.pendingAction.canServeSentence = true;
            var prisonMsg = "⛓️ Královská stráž uvrhla rytíře " + player.badge + " " + player.name + " do Šatlavy! Můžeš složit kauci (1 000 zl.), zkusit uprchnout hodem 6, nebo odsedět trest.";
            state.pendingAction.summary = prisonMsg;
            this.addLog(state, prisonMsg, "danger");
            return;
        }

        // 9. Královský lazaret / Špitál (HOSPITAL)
        if (node.type === "HOSPITAL") {
            state.pendingAction.canBuyHospitalElixir = true;
            state.pendingAction.elixirCost = 800;
            state.pendingAction.canRestHospital = true;
            var hospMsg = "🏥 Rytíř " + player.badge + " " + player.name + " dorazil do Královského lazaretu. Může zakoupit hojivý lektvar (+1 Boj a zotavení za 800 zl.) nebo zdarma odpočívat.";
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

    // Výpočet poplatku na cizím poli
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

    // Převod zlata mezi hráči (pokud plátce nemá dost, zaplatí co má)
    transferGold: function (state, fromPlayer, toPlayer, amount) {
        var actual = Math.min(fromPlayer.gold, amount);
        fromPlayer.gold -= actual;
        if (toPlayer) {
            toPlayer.gold += actual;
        }
        return actual;
    },

    // Výběrčí daní (VD) - vyplácí výnos všem majitelům Vesnic, Měst a Hradů
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

    // Karta Náhody (N)
    resolveChanceCard: function (state, player) {
        var card = window.PRS_CHANCE_CARDS[Math.floor(Math.random() * window.PRS_CHANCE_CARDS.length)];
        var stats = this.getEffectiveStats(state, player);
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

    // Nákup volného políčka
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

    // Povýšení vesnice (Malá -> Střední -> Velká)
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

    // Výcvik u Mistra (MB, MJ, MT, MCH, VM)
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

    // Nákup balíčku předmětů u Obchodníka (Věci 1, Věci 2, Věci 3)
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

    // Nákup konkrétní výzbroje z královské zbrojnice podle katalogového ID
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

    // Prodej předmětu nebo nemovitosti (u Obchodníka 1/2 věc a 100% budova, jinde 1/4 věc a 1/2 budova)
    sellAsset: function (state, assetType, assetId) {
        var player = state.players[state.currentPlayerIndex];
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

    // Nucený odprodej majetku Královské komoře na úhradu dluhu (60 % ceny)
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
                state.pendingAction.summary = "⚠️ Rytíř odprodal veškerý majetek. Zbytek dluhu " + debt.remainingDebt + " zl. je nedobytný.";
                delete state.pendingAction.debt;
                return { ok: true, settled: true, remainingDebt: debt.remainingDebt };
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

    // Vyhodnocení Úkolu / Souboje s monstrem či drakem (U1, U2, U3)
    resolveQuest: function (state, forcedRoll) {
        var pa = state.pendingAction;
        if (!pa || !pa.canResolveQuest || !pa.questCard) return null;
        var player = state.players[state.currentPlayerIndex];
        var q = pa.questCard;
        var stats = this.getEffectiveStats(state, player);

        var roll = forcedRoll || (Math.floor(Math.random() * 6) + 1);
        var animalBonus = 0;
        if (q.questTier === "U1" && (stats.dogs > 0 || stats.falcons > 0)) {
            animalBonus = 1;
        } else if (q.questTier === "U3" && (stats.dogs > 0 || stats.falcons > 0)) {
            animalBonus = (stats.dogs > 0 && stats.falcons > 0) ? 2 : 1;
        }
        var horseBonus = (q.questTier !== "U1" && stats.horses > 0) ? (1 + Math.floor(stats.jizda / 2)) : 0;
        var totalPower = roll + stats.boj + animalBonus + horseBonus;

        pa.canResolveQuest = false;
        var won = totalPower >= q.difficulty;

        if (won) {
            player.gold += q.gold;
            player.permanentHearts += q.hearts;
            player.stats.questsWon++;
            player.stats.heartsFromQuests += q.hearts;

            var rewardMsg = "⚔️ HRDINSKÉ VÍTĚZSTVÍ! " + player.badge + " " + player.name + " porazil **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. obtížnost " + q.difficulty + ", hod " + roll + ")! Získává **+" + q.gold + " zl.**" + (q.hearts > 0 ? " a **+" + q.hearts + " 💖**!" : "!");

            // 🏆 Získání unikátní trofeje z nestvůry / draka
            var trophyChance = (q.questTier === "U1") ? 0.75 : 1.0;
            if (q.trophyId && Math.random() <= trophyChance) {
                var trophyDef = window.PRS_TROPHIES && window.PRS_TROPHIES[q.trophyId];
                if (trophyDef) {
                    var trophyItem = this.deepClone(trophyDef);
                    // Automaticky nasadit, pokud hráč nemá ve slotu trofeje žádný aktivní předmět
                    var hasEquippedTrophy = false;
                    for (var tIdx = 0; tIdx < player.items.length; tIdx++) {
                        if (player.items[tIdx].slot === "trophy" && player.items[tIdx].isEquipped !== false) {
                            hasEquippedTrophy = true;
                            break;
                        }
                    }
                    trophyItem.isEquipped = !hasEquippedTrophy;
                    player.items.push(trophyItem);
                    if (!player.stats.trophiesCollected) player.stats.trophiesCollected = 0;
                    player.stats.trophiesCollected++;
                    rewardMsg += " 🏆 Trofej: **" + trophyItem.icon + " " + trophyItem.name + "** (" + (trophyItem.isEquipped ? "Aktivně nasazena!" : "Uložena do batohu") + ")!";
                }
            }

            if (q.itemTier) {
                var pool = window.PRS_ITEMS.filter(function (it) { return it.tier === q.itemTier && it.slot !== "trophy"; });
                if (pool.length > 0) {
                    var loot = this.deepClone(pool[Math.floor(Math.random() * pool.length)]);
                    player.items.push(loot);
                    rewardMsg += " Kořist: **" + loot.icon + " " + loot.name + "**!";
                }
            }

            pa.summary = rewardMsg;
            this.addLog(state, rewardMsg, "quest_win");
        } else {
            player.stats.questsLost++;
            if (q.questTier === "U1") {
                var failCost = Math.min(player.gold, state.config.quests.u1FailCost || 500);
                player.gold -= failCost;
                var u1Msg = "🐗 Lov se nezdařil! **" + q.name + "** unikl (Síla " + totalPower + " vs. " + q.difficulty + ", hod " + roll + "). Ošetření ran stojí -" + failCost + " zl.";
                pa.summary = u1Msg;
                this.addLog(state, u1Msg, "quest_loss");
            } else {
                // Zranění v boji na U2/U3 -> převoz do Královského lazaretu (Špitál) k ošetření
                var hospitalNode = null;
                for (var h = 0; h < state.board.nodes.length; h++) {
                    if (state.board.nodes[h].type === "HOSPITAL") {
                        hospitalNode = state.board.nodes[h];
                        break;
                    }
                }
                if (hospitalNode) {
                    player.nodeId = hospitalNode.id;
                    player.skipTurns = 1;
                    var hospLossMsg = "💀 PORÁŽKA V BOJI! " + player.badge + " " + player.name + " podlehl v souboji s **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + ", hod " + roll + "). Těžce raněný rytíř byl převezen do **" + hospitalNode.name + "**, kde se 1 tah léčí!";
                    pa.summary = hospLossMsg;
                    this.addLog(state, hospLossMsg, "quest_loss");
                } else {
                    player.nodeId = 0;
                    player.skipTurns = 1;
                    var deathMsg = "💀 PORÁŽKA V BOJI! " + player.badge + " " + player.name + " podlehl v souboji s **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + ", hod " + roll + "). Je odnesen na **START** a vynechává 1 tah!";
                    pa.summary = deathMsg;
                    this.addLog(state, deathMsg, "quest_loss");
                }
            }
        }

        this.recalculateBreedingAndVictory(state);
        return { won: won, roll: roll, totalPower: totalPower, difficulty: q.difficulty };
    },

    // Vyhodnocení SLAVNOSTI (Turnaj, Ples, Závod) podle vzorců z rukopisů IMG_4596 a IMG_4597
    resolveFestival: function (state) {
        var pa = state.pendingAction;
        if (!pa || !pa.canResolveFestival) return null;
        var fType = pa.festivalType || "turnaj";
        var organizer = state.players[state.currentPlayerIndex];
        pa.canResolveFestival = false;

        // Zjistíme, kteří hráči splňují podmínku účasti
        var participants = [];
        for (var i = 0; i < state.players.length; i++) {
            var p = state.players[i];
            var st = this.getEffectiveStats(state, p);
            var eligible = false;

            if (fType === "turnaj") {
                // Podmínka z IMG_4596: Kůň, Pes, Sokol (nebo alespoň Kůň + Zbroj/Zbraň pro plynulost hry, pokud ještě nikdo nemá všechna 3 zvířata)
                eligible = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) || (st.horses >= 1 && (st.hasWeapon || st.hasArmor));
            } else if (fType === "ples") {
                // Podmínka z IMG_4596: Šaty (nebo Tanec >= 1)
                eligible = st.hasDress || st.tanec >= 1;
            } else if (fType === "zavod") {
                // Podmínka z IMG_4596: Kůň
                eligible = st.horses >= 1;
            }

            if (eligible) {
                var roll = Math.floor(Math.random() * 6) + 1;
                var score = roll;
                if (fType === "turnaj") {
                    var animalSetBonus = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) ? 3 : 0;
                    score = roll + st.boj + st.jizda + animalSetBonus;
                } else if (fType === "ples") {
                    score = roll + st.tanec + st.charisma + (st.hasDress ? 2 : 0);
                } else if (fType === "zavod") {
                    score = roll + (st.jizda * 2) + Math.min(3, st.horses);
                }
                participants.push({
                    player: p,
                    stats: st,
                    roll: roll,
                    score: score
                });
            }
        }

        var fNames = { turnaj: "Královský Turnaj", ples: "Zámecký Ples", zavod: "Velký Jezdecký Závod" };
        var festTitle = fNames[fType] || "Královská Slavnost";

        // Pravidlo z IMG_4596: "min 2 hráči"
        if (participants.length < 2) {
            organizer.gold += 800;
            organizer.permanentHearts += 0.5;
            organizer.stats.heartsFromFestivals += 0.5;
            var cancelMsg = "🎺 **" + festTitle + "** se nekoná v plné parádě (podmínku účasti splňuje méně než 2 rytíři). Pořadatel " + organizer.name + " získává od krále dar **+800 zl.** a **+0,5 💖** za snahu.";
            pa.summary = cancelMsg;
            this.addLog(state, cancelMsg, "festival");
            this.recalculateBreedingAndVictory(state);
            return { held: false, participants: participants };
        }

        // Seřadíme účastníky podle skóre
        participants.sort(function (a, b) { return b.score - a.score; });

        var goldPrizes = state.config.festivalGoldPrizes[fType] || [1200, 600, 300];
        var resultsText = [];

        for (var r = 0; r < Math.min(3, participants.length); r++) {
            var part = participants[r];
            var pl = part.player;
            var ch = part.stats.charisma;
            var heartsWon = 0;

            // Přesné vzorce z autorova rukopisu IMG_4596 & IMG_4597!
            if (fType === "turnaj") {
                // Turnaj: 1) 3 + 1/2 CH, 2) 2 + 1/2 CH, 3) 1 + 1/2 CH
                var baseT = (r === 0) ? 3 : (r === 1 ? 2 : 1);
                heartsWon = baseT + (ch * 0.5);
            } else if (fType === "ples") {
                // Ples: 1) 1 + CH, 2) CH (min 1), 3) CH - 1 (min 0.5)
                if (r === 0) heartsWon = 1 + ch;
                else if (r === 1) heartsWon = Math.max(1, ch);
                else heartsWon = Math.max(0.5, ch - 1);
            } else if (fType === "zavod") {
                // Závod: 1) 1,5 * CH (min 1.5), 2) CH (min 1), 3) 1/2 CH (min 0.5)
                if (r === 0) heartsWon = Math.max(1.5, ch * 1.5);
                else if (r === 1) heartsWon = Math.max(1.0, ch);
                else heartsWon = Math.max(0.5, ch * 0.5);
            }

            heartsWon = Math.round(heartsWon * 10) / 10;
            var goldWon = goldPrizes[r] || 300;

            pl.permanentHearts += heartsWon;
            pl.gold += goldWon;
            pl.stats.heartsFromFestivals += heartsWon;
            if (r === 0) pl.stats.festivalsWon++;

            var medal = (r === 0) ? "🥇 1." : (r === 1 ? "🥈 2." : "🥉 3.");
            resultsText.push(medal + " " + pl.name + " (výkon " + part.score + ") -> **+" + heartsWon + " 💖** a +" + goldWon + " zl.");
        }

        var fullMsg = "💖 SLAVNOST **" + festTitle + "**! Výsledky klání: " + resultsText.join(" | ");
        pa.summary = fullMsg;
        pa.festivalResults = resultsText;
        this.addLog(state, fullMsg, "festival");
        this.recalculateBreedingAndVictory(state);
        return { held: true, participants: participants, resultsText: resultsText };
    },

    // ========================================================================
    // SPECIÁLNÍ POLE: ŠATLAVA (PRISON), ŠPITÁL (HOSPITAL), KRČMA (TAVERN)
    // ========================================================================

    // Šatlava: Zaplacení kauce
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

    // Šatlava: Pokus o útěk (potřeba hodit 6)
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

    // Šatlava: Odpykat trest
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

    // Špitál: Nákup hojivého lektvaru (+1 Boj a +0.5 💖 za 800 zl.)
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

    // Špitál: Zotavení zdarma
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

    // Krčma: Kostky s krčmářem
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

    // Krčma: Runda pro celou hospodu (+0.5 💖 za 400 zl.)
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

    // Ukončení tahu a předání dalšímu hráči
    endTurn: function (state) {
        if (state.phase === "GAME_OVER") return;
        state.pendingAction = null;
        state.turnNumber++;
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
        if (state.currentPlayerIndex === 0) {
            state.roundNumber++;
        }
        state.phase = "ROLL";
        this.recalculateBreedingAndVictory(state);
    },

    // ========================================================================
    // UMĚLÁ INTELIGENCE (AI BOTI pro hru i automatické balancování ekonomiky)
    // ========================================================================
    executeBotTurn: function (state) {
        if (state.phase === "GAME_OVER") return;
        var bot = state.players[state.currentPlayerIndex];
        if (bot.type === "Human") return;

        // 0. Vyřešení dluhu, pokud nastala nucená královská dražba
        if (state.pendingAction && state.pendingAction.debt) {
            this.autoLiquidateDebt(state);
            if (state.phase === "GAME_OVER") return;
        }

        // 1. Pokud jsme ve fázi hodu, hodíme kostkou
        if (state.phase === "ROLL") {
            this.rollAndMove(state);
            if (state.phase === "GAME_OVER") return;
        }

        var pa = state.pendingAction;
        if (!pa) {
            this.endTurn(state);
            return;
        }

        // Pokud po hodu nastal dluh
        if (pa.debt) {
            this.autoLiquidateDebt(state);
            if (state.phase === "GAME_OVER") return;
        }

        // Rezerva podle archetypu
        var reserveGold = 1800;
        if (bot.type === "Bot_Aggressive") reserveGold = 600;
        else if (bot.type === "Bot_Breeder") reserveGold = 1000;
        else if (bot.type === "Bot_Noble") reserveGold = 1200;
        else if (bot.type === "Bot_Easy") reserveGold = 2600;

        // 2. Příprava výstroje a řešení výpravy/souboje (U1, U2, U3)
        if (pa.canResolveQuest) {
            // Všichni nasadí nejlepší zbraň a zbroj
            for (var itQ = 0; itQ < bot.items.length; itQ++) {
                if (bot.items[itQ].slot === "weapon" || bot.items[itQ].slot === "armor" || bot.items[itQ].slot === "trophy") {
                    bot.items[itQ].isEquipped = true;
                }
            }
            var shouldFight = true;
            var effStats = this.getEffectiveStats(state, bot);
            // Dvořan a Panoš jsou opatrní u Draků (U3)
            if (pa.questSubtype === "U3") {
                if (bot.type === "Bot_Noble" && effStats.boj < 14) shouldFight = false;
                if (bot.type === "Bot_Easy" && effStats.boj < 15) shouldFight = false;
                if (bot.type === "Bot_Breeder" && effStats.boj < 12) shouldFight = false;
            }
            if (shouldFight) {
                this.resolveQuest(state);
                if (state.phase === "GAME_OVER") return;
            }
        }

        // 3. Slavnost – optimalizace výstroje a spuštění
        if (pa.canResolveFestival) {
            var fType = pa.festivalType || "turnaj";
            if (fType === "ples") {
                // Obléknout šaty a klenot
                for (var itP = 0; itP < bot.items.length; itP++) {
                    if (bot.items[itP].slot === "dress" || bot.items[itP].slot === "jewel") {
                        bot.items[itP].isEquipped = true;
                    }
                }
            } else if (fType === "turnaj") {
                // Obléknout zbraň a zbroj
                for (var itT = 0; itT < bot.items.length; itT++) {
                    if (bot.items[itT].slot === "weapon" || bot.items[itT].slot === "armor" || bot.items[itT].slot === "trophy") {
                        bot.items[itT].isEquipped = true;
                    }
                }
            }
            this.resolveFestival(state);
            if (state.phase === "GAME_OVER") return;
        }

        // 4. Nákup nemovitostí a zvířat podle archetypu
        if (pa.canBuyNode) {
            var targetNode = state.board.nodes[pa.nodeId];
            var neededReserve = reserveGold;

            if (targetNode) {
                // CHOVATEL: Absolutní priorita pro kompletaci zvířecích sad a chovné budovy
                if (targetNode.type === "ANIMAL") {
                    var sid = targetNode.setId || (targetNode.code.match(/\d+/) || [1])[0];
                    var ownedInSet = 0;
                    for (var oi = 0; oi < bot.ownedNodes.length; oi++) {
                        var onn = state.board.nodes[bot.ownedNodes[oi]];
                        if (onn && onn.type === "ANIMAL" && (onn.setId == sid || onn.code.indexOf("" + sid) !== -1)) {
                            ownedInSet++;
                        }
                    }
                    if (bot.type === "Bot_Breeder") {
                        if (ownedInSet >= 2) neededReserve = 100; // Kompletace tria (+1.0 💖) za každou cenu!
                        else if (ownedInSet === 1) neededReserve = 350;
                        else neededReserve = 700;
                    } else if (bot.type === "Bot_Aggressive") {
                        neededReserve = (targetNode.subtype === "kun") ? 400 : 700;
                    }
                }
                // DVOŘAN: Absolutní priorita pro Města a Hrady (šlechtický status pro START audienci)
                else if (targetNode.type === "CASTLE" || targetNode.type === "TOWN") {
                    if (bot.type === "Bot_Noble") neededReserve = 200;
                    else if (bot.type === "Bot_Aggressive") neededReserve = 350;
                    else neededReserve = 500;
                }
                // Řemeslné budovy
                else if (targetNode.type === "BUILDING") {
                    if (bot.type === "Bot_Breeder" && (targetNode.subtype === "staje" || targetNode.subtype === "psovod" || targetNode.subtype === "sokolnik")) {
                        neededReserve = 300;
                    } else if (bot.type === "Bot_Aggressive" && targetNode.subtype === "kovarna") {
                        neededReserve = 300;
                    } else if (bot.type === "Bot_Noble" && targetNode.subtype === "krejci") {
                        neededReserve = 300;
                    }
                }
            }

            if (bot.gold - pa.buyPrice >= neededReserve) {
                this.buyCurrentNode(state);
            }
        }

        // 5. Vylepšování vesnic (Chovatel vylepšuje nejraději)
        if (pa.canUpgradeVillage) {
            var upgRes = reserveGold;
            if (bot.type === "Bot_Breeder") upgRes = 400;
            if (bot.gold - pa.upgradeCost >= upgRes) {
                this.upgradeVillage(state, pa.nodeId);
            }
        }

        // 6. Trénink u Mistra podle archetypu
        if (pa.canTrainMaster) {
            var chosenSkill = pa.skill;
            if (chosenSkill === "any") {
                if (bot.type === "Bot_Aggressive") {
                    chosenSkill = (bot.skills.boj < 5) ? "boj" : ((bot.skills.jizda < 5) ? "jizda" : "charisma");
                } else if (bot.type === "Bot_Breeder") {
                    chosenSkill = (bot.skills.jizda < 5) ? "jizda" : ((bot.skills.boj < 5) ? "boj" : "tanec");
                } else if (bot.type === "Bot_Noble") {
                    chosenSkill = (bot.skills.charisma < 5) ? "charisma" : ((bot.skills.tanec < 5) ? "tanec" : "jizda");
                } else if (bot.type === "Bot_Balanced") {
                    var sks = ["boj", "jizda", "tanec", "charisma"];
                    sks.sort(function (a, b) { return bot.skills[a] - bot.skills[b]; });
                    chosenSkill = sks[0];
                } else {
                    chosenSkill = (bot.skills.charisma < 3) ? "charisma" : "boj";
                }
            }
            var lvl = bot.skills[chosenSkill] || 0;
            var trainCost = state.config.masterCosts[lvl] || 5000;
            var canAffordTrain = (lvl < 5 && bot.gold - trainCost >= reserveGold * 0.4);
            if (canAffordTrain) {
                this.trainAtMaster(state, chosenSkill);
            }
        }

        // 7. Obchodník – nákup balíčků výbavy
        if (pa.canShopMerchant) {
            var packs = state.config.itemPackPrices;
            if (bot.type === "Bot_Aggressive") {
                if (bot.gold - packs.tier3 >= 400 && bot.items.length < 5) this.buyItemPack(state, 3);
                else if (bot.gold - packs.tier2 >= 400 && bot.items.length < 4) this.buyItemPack(state, 2);
            } else if (bot.type === "Bot_Noble") {
                if (bot.gold - packs.tier3 >= 600 && bot.items.length < 5) this.buyItemPack(state, 3);
                else if (bot.gold - packs.tier2 >= 600 && bot.items.length < 4) this.buyItemPack(state, 2);
            } else if (bot.type === "Bot_Breeder") {
                // Šetří zlato na zvířata na herním plánu
                if (bot.gold - packs.tier2 >= 2000 && bot.items.length < 3) this.buyItemPack(state, 2);
            } else {
                if (bot.gold - packs.tier3 >= reserveGold && bot.items.length < 5) this.buyItemPack(state, 3);
                else if (bot.gold - packs.tier2 >= reserveGold && bot.items.length < 4) this.buyItemPack(state, 2);
                else if (bot.gold - packs.tier1 >= reserveGold && bot.items.length < 2) this.buyItemPack(state, 1);
            }
        }

        // 8. Šatlava
        if (pa.canPayPrisonBail) {
            var shouldBail = (bot.type === "Bot_Aggressive" && bot.gold >= 1500) ||
                             (bot.type === "Bot_Noble" && bot.gold >= 1500) ||
                             (bot.gold >= 3000);
            if (shouldBail) {
                this.payPrisonBail(state);
            } else if (pa.canAttemptPrisonEscape) {
                this.attemptPrisonEscape(state);
            } else if (pa.canServeSentence) {
                this.servePrisonSentence(state);
            }
        } else if (pa.canAttemptPrisonEscape) {
            this.attemptPrisonEscape(state);
        } else if (pa.canServeSentence) {
            this.servePrisonSentence(state);
        }

        // 9. Špitál sv. Lazara
        if (pa.canBuyHospitalElixir && bot.gold - pa.elixirCost >= reserveGold) {
            this.buyHospitalElixir(state);
        } else if (pa.canRestHospital) {
            this.restInHospital(state);
        }

        // 10. Krčma
        if (pa.canBuyTavernRound && (bot.type === "Bot_Noble" || bot.type === "Bot_Aggressive") && bot.gold - pa.roundCost >= reserveGold) {
            this.buyTavernRound(state);
        } else if (pa.canTavernGamble && bot.type === "Bot_Aggressive" && bot.gold >= 2500) {
            this.gambleInTavern(state);
        }

        // 11. Konec tahu bota
        this.endTurn(state);
    },

    // ========================================================================
    // HEADLESS SIMULÁTOR EKONOMIKY (Spustí N celých her během zlomku vteřiny)
    // ========================================================================
    simulateGames: function (numGames, configOverride, boardCode) {
        numGames = Math.min(200, Math.max(1, Number(numGames) || 25));
        var cfg = this.deepClone(configOverride || window.PRS_DEFAULT_CONFIG);
        var bCode = boardCode || "classic_96";

        var totalRounds = 0;
        var totalTurns = 0;
        var maxRoundsSafety = 150;
        var winsByType = { Bot_Aggressive: 0, Bot_Breeder: 0, Bot_Noble: 0, Bot_Balanced: 0, Bot_Easy: 0 };
        var heartBreakdown = { festivals: 0, quests: 0, chance: 0, breeding: 0 };
        var avgWinnerGold = 0;
        var sampleLogs = [];

        for (var g = 0; g < numGames; g++) {
            var simState = this.createGame({
                config: cfg,
                boardCode: bCode,
                players: [
                    { name: "Válečník Bořivoj", type: "Bot_Aggressive" },
                    { name: "Chovatel Zikmund", type: "Bot_Breeder" },
                    { name: "Kněžna Eliška", type: "Bot_Noble" },
                    { name: "Opatrný Panoš", type: "Bot_Easy" }
                ]
            });

            var guard = 0;
            while (simState.phase !== "GAME_OVER" && simState.roundNumber <= maxRoundsSafety && guard < 1200) {
                this.executeBotTurn(simState);
                guard++;
            }

            var winIdx = (simState.winnerIndex !== null) ? simState.winnerIndex : 0;
            var winner = simState.players[winIdx];

            totalRounds += simState.roundNumber;
            totalTurns += simState.turnNumber;
            winsByType[winner.type] = (winsByType[winner.type] || 0) + 1;
            avgWinnerGold += winner.gold;

            heartBreakdown.festivals += winner.stats.heartsFromFestivals;
            heartBreakdown.quests += winner.stats.heartsFromQuests;
            heartBreakdown.chance += winner.stats.heartsFromChance;
            heartBreakdown.breeding += winner.breedingHearts;

            if (g === 0) {
                sampleLogs = simState.logs.slice(0, 15);
            }
        }

        var avgRounds = Math.round((totalRounds / numGames) * 10) / 10;
        var avgTurns = Math.round(totalTurns / numGames);
        // Odhad stolní doby: cca 1.6 minuty na 1 celé kolo 4 hráčů u stolu s kostkami
        var estTabletopMinutes = Math.round(avgRounds * 1.6);

        return {
            gamesSimulated: numGames,
            boardCode: bCode,
            targetHearts: cfg.targetHearts,
            avgRounds: avgRounds,
            avgTurns: avgTurns,
            estTabletopMinutes: estTabletopMinutes,
            estTabletopHoursText: Math.floor(estTabletopMinutes / 60) + " h " + (estTabletopMinutes % 60) + " min",
            avgWinnerGold: Math.round(avgWinnerGold / numGames),
            winsByType: winsByType,
            avgWinnerHeartsBreakdown: {
                festivals: Math.round((heartBreakdown.festivals / numGames) * 10) / 10,
                quests: Math.round((heartBreakdown.quests / numGames) * 10) / 10,
                chance: Math.round((heartBreakdown.chance / numGames) * 10) / 10,
                breeding: Math.round((heartBreakdown.breeding / numGames) * 10) / 10
            },
            sampleLogs: sampleLogs
        };
    }
};
