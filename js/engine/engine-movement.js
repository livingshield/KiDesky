// ============================================================================
// KiDesky: Princeznino srdce - Jádro enginu: pohyb po plánu, rozcestí a dopady na pole
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_GameEngine) window.PRS_GameEngine = {};

    Object.assign(window.PRS_GameEngine, {

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

                // Dvorní tanec: Tanec >= 2 se šaty nebo Tanec >= 3 získá přízeň princezny na dvořanské hostině (+0.5 💖, při Tanec >= 5 dokonce +1.0 💖)
                var danceHearts = (stNow.dance >= 5) ? 1.0 : ((stNow.dance >= 3 || (stNow.dance >= 2 && stNow.hasDress)) ? 0.5 : 0);

                var stipendDesc = isLandless ? "zvýšenou královskou podporu pro nemajetné **+" + stipend + " zl.**" : "žold +" + stipend + " zl.";

                if (courtHearts > 0) {

                    player.permanentHearts += courtHearts;

                    player.stats.heartsFromFestivals += courtHearts;

                    var stLog1 = "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + " a +" + courtHearts + " 💖 při královské audienci (díky šlechtickému titulu)!";
                    this.addLog(state, stLog1, "gold", { key: "engine.pass_start_log", params: { badge: player.badge, player: player.name, stipend: stipendDesc + " a +" + courtHearts + " 💖" } });

                } else {

                    var stLog2 = "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + ".";
                    this.addLog(state, stLog2, "gold", { key: "engine.pass_start_log", params: { badge: player.badge, player: player.name, stipend: stipendDesc } });

                }

                if (danceHearts > 0) {

                    player.permanentHearts += danceHearts;

                    player.stats.heartsFromFestivals += danceHearts;

                    this.addLog(state, "💃 Dvorní tanec! " + player.badge + " " + player.name + " svým půvabem a tancem okouzlil princeznu na uvítací hostině (+" + danceHearts + " 💖)!", "festival");

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

        if (landedNode.type === "CASTLE") {
            this.addLog(state, "🏰 " + player.badge + " " + player.name + " dorazil k branám hrdého sídla **" + landedNode.name + "** (" + (landedNode.icon || "🏰") + ")!", "milestone");
        }

        this.resolveLandedNode(state, player, landedNode, pbc.totalRoll);

        this.attachPlayerInteractions(state, player, landedNode);

        if (passedBridgeFestival && landedNode.type !== "FESTIVAL") {

            var festTypes = ["tournament", "ball", "race"];

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

        if (player.activeScrolls && player.activeScrolls.forcedRoll) {
            roll = player.activeScrolls.forcedRoll;
            delete player.activeScrolls.forcedRoll;
            this.addLog(state, "⭐ Hvězdná konjunkce štěstěny: Na kostce padla zaručená 6!", "gold");
        }

        if (player.activeScrolls && player.activeScrolls.bonusRoll) {
            var bRoll = player.activeScrolls.bonusRoll;
            roll += bRoll;
            delete player.activeScrolls.bonusRoll;
            this.addLog(state, "⚡ Pergamen bleskového cvalu: Přidáno +" + bRoll + " polí k hodu! Výsledný posun: " + roll + ".", "gold");
        }

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

                // Dvorní tanec: Tanec >= 2 se šaty nebo Tanec >= 3 získá přízeň princezny na dvořanské hostině (+0.5 💖, při Tanec >= 5 dokonce +1.0 💖)
                var danceHearts = (stNow.dance >= 5) ? 1.0 : ((stNow.dance >= 3 || (stNow.dance >= 2 && stNow.hasDress)) ? 0.5 : 0);

                var stipendDesc = isLandless ? "zvýšenou královskou podporu pro nemajetné **+" + stipend + " zl.**" : "žold +" + stipend + " zl.";

                if (courtHearts > 0) {

                    player.permanentHearts += courtHearts;

                    player.stats.heartsFromFestivals += courtHearts;

                    var stLogA = "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + " a +" + courtHearts + " 💖 při královské audienci (díky šlechtickému titulu)!";
                    this.addLog(state, stLogA, "gold", { key: "engine.pass_start_log", params: { badge: player.badge, player: player.name, stipend: stipendDesc + " a +" + courtHearts + " 💖" } });

                } else if (stNow.charisma >= 2 && !hasNobleStatus) {

                    var stLogB = "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + " (pro audienci u krále a zisk Srdce z Charismatu je však nutné vlastnit Město či Hrad).";
                    this.addLog(state, stLogB, "gold", { key: "engine.pass_start_log", params: { badge: player.badge, player: player.name, stipend: stipendDesc } });

                } else {

                    var stLogC = "🏰 " + player.badge + " " + player.name + " prošel STARTem a získává " + stipendDesc + ".";
                    this.addLog(state, stLogC, "gold", { key: "engine.pass_start_log", params: { badge: player.badge, player: player.name, stipend: stipendDesc } });

                }

                if (danceHearts > 0) {

                    player.permanentHearts += danceHearts;

                    player.stats.heartsFromFestivals += danceHearts;

                    this.addLog(state, "💃 Dvorní tanec! " + player.badge + " " + player.name + " svým půvabem a tancem okouzlil princeznu na uvítací hostině (+" + danceHearts + " 💖)!", "festival");

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

        // Záznam o přejetí mostu přes řeku Doubravku
        if (state.board && state.board.bridges && path && path.length > 1) {
            var crossedBridge = false;
            for (var pi = 0; pi < path.length; pi++) {
                var pNode = state.board.nodes[path[pi]];
                if (pNode) {
                    for (var bi = 0; bi < state.board.bridges.length; bi++) {
                        var br = state.board.bridges[bi];
                        var dSq = (pNode.x - br.x) * (pNode.x - br.x) + (pNode.y - br.y) * (pNode.y - br.y);
                        if (dSq < 1600) { crossedBridge = true; break; }
                    }
                }
                if (crossedBridge) break;
            }
            if (crossedBridge) {
                this.addLog(state, "🌉 " + player.badge + " " + player.name + " s rachotem podkov přejel kamenný most přes řeku Doubravku do nového kraje.", "action");
            }
        }

        // Záznam o slavnostním vstupu do bran Hradu
        if (landedNode.type === "CASTLE") {
            this.addLog(state, "🏰 " + player.badge + " " + player.name + " dorazil k branám hrdého sídla **" + landedNode.name + "** (" + (landedNode.icon || "🏰") + ")!", "milestone");
        }

        this.resolveLandedNode(state, player, landedNode, roll);

        this.attachPlayerInteractions(state, player, landedNode);

        if (passedBridgeFestival && landedNode.type !== "FESTIVAL") {

            var festTypes = ["tournament", "ball", "race"];

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

            canShopLivestock: false,

            canResolveQuest: false,

            questCard: null,

            canResolveFestival: false,

            summary: ""

        };

        // 1. Koupitelná pole (Zvířata, Vesnice, Města, Hrady, Kejklíři, Řemeslné budovy)

        if (this.isPurchasableNode(node)) {

            // Aktivní bonus Tance: Vystoupení na Hradě (+0.5 💖, u Tanec >= 5 až +1.0 💖)
            if (node.type === "CASTLE") {
                var cStats = this.getEffectiveStats(state, player);
                if (cStats.dance >= 2) {
                    var cBonus = (cStats.dance >= 5) ? 1.0 : 0.5;
                    player.permanentHearts += cBonus;
                    player.stats.heartsFromFestivals += cBonus;
                    this.addLog(state, "💃 Dvorní tanec na Hradě! " + player.badge + " " + player.name + " okouzlil společnost na " + node.name + " vznešeným tancem (+" + cBonus + " 💖)!", "festival");
                }
            }

            // Aktivní bonus Tance: Kejklířský dar od trubadúrů (+200 zl. za každý bod Tance)
            if (node.type === "JESTER") {
                var jStats = this.getEffectiveStats(state, player);
                if (jStats.dance >= 1) {
                    var jGift = jStats.dance * 200;
                    player.gold += jGift;
                    this.addLog(state, "🃏 Trubadúrský dar! Kejklíři na " + node.name + " ocenili tvé taneční umění a darovali ti +" + jGift.toLocaleString("cs-CZ") + " zl.!", "gold");
                }
            }

            var price = this.getNodePrice(state, node);

            if (node.owner === null || node.owner === undefined) {

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

                if (node.type === "BUILDING" && node.subtype === "stables") {

                    state.pendingAction.canShopLivestock = true;

                    state.pendingAction.summary = "Vstoupil jsi do svých Královských stájí! Můžeš zde nakupovat chovný dobytek a spravovat pastviny.";

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

                // Královský trysk: Sleva 30 % na mýtné na Vesnicích pro zkušené jezdce v plném cvalu
                var pMoveStats = this.getEffectiveStats(state, player);
                if (node.type === "VILLAGE" && pMoveStats.riding >= 4 && pMoveStats.horses > 0) {
                    rent = Math.round(rent * 0.70);
                }

                if (player.activeScrolls && player.activeScrolls.rentImmunity) {
                    delete player.activeScrolls.rentImmunity;
                    var amMsg = "📜 Královský glejt amnestie! Rytíř " + player.badge + " " + player.name + " je zproštěn placení mýtného/nájmu " + rent.toLocaleString("cs-CZ") + " zl. na poli " + node.name + "!";
                    this.addLog(state, amMsg, "gold");
                    state.pendingAction.summary = amMsg;
                    return;
                }

                var actualPaid = this.transferGold(state, player, owner, rent);

                player.stats.rentPaid += actualPaid;

                owner.stats.rentCollected += actualPaid;

                var remainingDebt = rent - actualPaid;

                if (remainingDebt <= 0) {

                    var pName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(player) : player.name;
                    var oName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(owner) : owner.name;
                    var eName = (window.PRS_App && window.PRS_App.getNodeDisplayName) ? window.PRS_App.getNodeDisplayName(node) : node.name;
                    var currSuffixRent = window.PRS_I18n ? (window.PRS_I18n.t("ui.common.gold") || window.PRS_I18n.t("ui.currency") || "zl.") : "zl.";
                    var msg = window.PRS_I18n ? window.PRS_I18n.t("engine.paid_rent_log", {
                        badge: player.badge,
                        player: pName,
                        rent: actualPaid,
                        currency: currSuffixRent,
                        ownerBadge: owner.badge,
                        owner: oName,
                        estate: eName
                    }) : ("💸 " + player.badge + " " + pName + " platí poplatek **" + actualPaid + " " + currSuffixRent + "** hráči " + owner.badge + " " + oName + " (" + eName + ").");

                    this.addLog(state, msg, "rent", {
                        key: "engine.paid_rent_log",
                        params: {
                            badge: player.badge,
                            player: pName,
                            rent: actualPaid,
                            currency: currSuffixRent,
                            ownerBadge: owner.badge,
                            owner: oName,
                            estate: eName
                        }
                    });

                    state.pendingAction.summary = msg;
                    state.pendingAction.summaryMeta = {
                        key: "engine.paid_rent_log",
                        params: {
                            badge: player.badge,
                            player: pName,
                            rent: actualPaid,
                            currency: currSuffixRent,
                            ownerBadge: owner.badge,
                            owner: oName,
                            estate: eName
                        }
                    };

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

                        if (state.config.bankruptcyElimination) {

                            this.eliminatePlayer(state, player.index, "Neschopnost uhradit nájem v módu Ultimate");

                        } else {

                            var noAssetMsg = "💸 " + player.badge + " " + player.name + " zaplatil hotově jen " + actualPaid + " zl. (z " + rent + " zl.) a jako nemajetný nemá další majetek k odprodeji.";

                            this.addLog(state, noAssetMsg, "rent");

                            state.pendingAction.summary = noAssetMsg;

                        }

                    }

                }

            }

            return;

        }

        // 2. Mistr vlastnosti (MB, MJ, MT, MCH, VM)

                if (node.type === "MASTER") {
            var tier = node.masterTier || (state.config && state.config.masterTier) || (state.board && state.board.masterTier) || 1;
            var mRoll = Math.floor(Math.random() * 6) + 1;
            state.pendingAction.masterRoll = mRoll;
            state.pendingAction.masterTier = tier;
            var normSkill = this.normalizeSkillKey ? this.normalizeSkillKey(node.skill) : (node.skill || "charisma");
            state.pendingAction.skill = normSkill;

            var threshold = (tier === 3) ? 3 : (state.config.masterMinRoll || 4);
            var curSkillVal = (player.skills && player.skills[normSkill] !== undefined) ? player.skills[normSkill] : 0;
            var maxTrainLevel = (state.board && state.board.graduatedMasters) ? ((tier === 1) ? 2 : (tier === 2 ? 3 : (tier === 3 ? 4 : 5))) : 5;

            if (mRoll >= threshold) {
                state.pendingAction.canTrainMaster = (curSkillVal < maxTrainLevel);
                state.pendingAction.maxTrainLevel = maxTrainLevel;
                if (tier === 4 && player.skills[normSkill] >= 3) {
                    state.pendingAction.isMasterDuel = true;
                    state.pendingAction.summary = "Mistr " + node.name + " tě vyzývá k rytířskému turnaji o Srdce princezny! (Hod " + mRoll + " ≥ " + threshold + ")";
                    this.addLog(state, "⚔️ " + player.name + " vstoupil do výzvy mistra u " + node.name + "!");
                } else if (!state.pendingAction.canTrainMaster && state.board && state.board.graduatedMasters) {
                    state.pendingAction.summary = "U tohoto Mistra (Stupeň " + ["I", "II", "III", "IV"][tier - 1] + ") jsi již dosáhl stropu výcviku (" + maxTrainLevel + "/5). Vyhledej vyššího Mistra dále v království!";
                    this.addLog(state, "🎓 " + player.name + " již zvládl učení u " + node.name + " (strop " + maxTrainLevel + "/5).");
                } else if (tier === 2) {
                    state.pendingAction.summary = "Mistr tě vřele vítá (Stupeň II - hod " + mRoll + ")! Můžeš získat pokročilý výcvik (+2 k vlastnosti)!";
                    this.addLog(state, "🎓 " + player.name + " může u " + node.name + " trénovat na Stupni II!");
                } else if (tier === 3) {
                    state.pendingAction.summary = "Mistr ti nabízí výcvik a posvátnou Pečeť ctnosti (Stupeň III - hod " + mRoll + ")!";
                    this.addLog(state, "🎓 " + player.name + " získal přízeň mistra a pečeť u " + node.name + "!");
                } else {
                    state.pendingAction.summary = "Mistr je v dobrém rozmaru (hod " + mRoll + " ≥ 4)! Můžeš si zaplatit výcvik.";
                    this.addLog(state, "🎓 " + player.name + " uspěl u " + node.name + " (hod " + mRoll + ") a může trénovat!");
                }
            } else {
                state.pendingAction.summary = "Mistr dnes nepřijímá žáky (hodil jsi " + mRoll + ", potřeba " + threshold + "–6).";
                this.addLog(state, "🎓 " + player.name + " neuspěl u " + node.name + " (hod " + mRoll + ", potřeba " + threshold + "–6).");
            }
            return;
        }

        // 3. Obchodník (Nákup Věcí 1–3, prodej věcí za 1/2 a budov za 100%)

        if (node.type === "MERCHANT") {

            state.pendingAction.canShopMerchant = true;

            state.pendingAction.canShopLivestock = true;

            state.pendingAction.summary = "Vítej u Královského obchodníka! Můžeš nakupovat Věci 1–3, dobytek na dobytčím trhu nebo výhodně prodávat majetek.";

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

            var elixCost = Math.round(1000 * hospMult);

            state.pendingAction.canBuyHospitalElixir = true;

            state.pendingAction.elixirCost = elixCost;

            state.pendingAction.canRestHospital = true;

            var hospMsg = "🏥 Rytíř " + player.badge + " " + player.name + " dorazil do Královského lazaretu. Může zakoupit hojivý elixír (+0,5 💖 a ochranu do boje za " + elixCost.toLocaleString("cs-CZ") + " zl.) nebo zdarma odpočívat.";

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

    }
    });
})();
