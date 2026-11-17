// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Soubojový Systém, Slavnosti, AI Boti a Simulace
// ============================================================================

(function () {
    if (!window.PRS_GameEngine) window.PRS_GameEngine = {};

    Object.assign(window.PRS_GameEngine, {
    scoreNodeForPlayer: function (state, player, targetNode) {

        if (!targetNode) return 0;

        var score = 0;

        var pType = player.type || "Bot_Balanced";

        var effStats = this.getEffectiveStats(state, player);

        if (targetNode.type === "START") {

            score += 15;

        } else if (targetNode.type === "VILLAGE" || targetNode.type === "CASTLE") {

            if (targetNode.owner === null || targetNode.owner === undefined) {

                var price = this.getNodePrice ? this.getNodePrice(state, targetNode) : (targetNode.buyPrice || 2000);

                if (player.gold >= price) {

                    score += (targetNode.type === "CASTLE" ? 30 : 20);

                    if (pType === "Bot_Noble") score += 10;

                    if (pType === "Bot_Breeder") score += 5;

                } else {

                    score += 5;

                }

            } else if (targetNode.owner === player.index) {

                score += 10;

            } else {

                var rent = this.computeNodeRent ? this.computeNodeRent(state, targetNode) : (targetNode.baseRent || 500);

                score -= Math.min(40, Math.floor(rent / 150));

            }

        } else if (targetNode.type === "ANIMAL") {

            if (targetNode.owner === null || targetNode.owner === undefined) {

                var aPrice = targetNode.buyPrice || 1000;

                if (player.gold >= aPrice) {

                    score += 18;

                    if (pType === "Bot_Breeder") score += 15;

                } else {

                    score += 4;

                }

            } else if (targetNode.owner === player.index) {

                score += 8;

            } else {

                score -= 10;

            }

        } else if (targetNode.type === "FESTIVAL") {

            score += 22;

            if (pType === "Bot_Noble") score += 15;

        } else if (targetNode.type === "QUEST") {

            var subtype = targetNode.subtype || "U1";

            var curHearts = player.permanentHearts || 0;

            if (subtype === "U3") {

                var isSlayerMode = (state.config && state.config.scenario === "slayer");
                if (isSlayerMode) {
                    if (effStats.combat >= 10 && curHearts >= 1.5) {
                        score += (pType === "Bot_Aggressive" ? 55 : 40);
                    } else if (effStats.combat >= 7 && curHearts >= 1.5) {
                        score += 25;
                    } else {
                        score -= 20;
                    }
                } else {
                    if (effStats.combat >= 14 && curHearts >= 2.0) {
                        score += (pType === "Bot_Aggressive" ? 35 : 15);
                    } else {
                        score -= 40;
                    }
                }

            } else if (subtype === "U2") {

                if (effStats.combat >= 8 && curHearts >= 1.0) {

                    score += (pType === "Bot_Aggressive" ? 25 : 12);

                } else {

                    score -= 15;

                }

            } else {

                score += (pType === "Bot_Aggressive" ? 18 : 10);

            }

        } else if (targetNode.type === "MASTER") {

            var skl = targetNode.skill;

            if (skl && (player.skills[skl] || 0) < 3) {

                score += 16;

            } else {

                score += 5;

            }

        } else if (targetNode.type === "CHANCE") {

            score += 8;

        } else if (targetNode.type === "TAVERN") {

            if (player.hp < 4 && player.gold >= 400) {

                score += 14;

            } else {

                score += 6;

            }

        } else if (targetNode.type === "HOSPITAL") {

            if (player.hp <= 2) {

                score += 30;

            } else {

                score += 2;

            }

        } else if (targetNode.type === "PRISON" || targetNode.type === "JAIL") {

            score -= 25;

        } else if (targetNode.type === "TAX") {

            score -= 15;

        } else if (targetNode.type === "BONUS") {

            score += 12;

        } else {

            score += 5;

        }

        return score;

    },

    // Rozhodování bota na křižovatkách,

    decideBotBranch: function (state, bot, junctionNode, remainingSteps) {

        var lowTarget = this.getTargetNodeForBranch(state, junctionNode.id, "low", remainingSteps);

        var highTarget = this.getTargetNodeForBranch(state, junctionNode.id, "high", remainingSteps);

        var scoreLow = this.scoreNodeForPlayer(state, bot, lowTarget);

        var scoreHigh = this.scoreNodeForPlayer(state, bot, highTarget);

        if (bot.type === "Bot_Aggressive") {

            scoreHigh += 4;

        } else if (bot.type === "Bot_Noble") {

            scoreHigh += 3;

        } else if (bot.type === "Bot_Breeder") {

            scoreLow += 4;

        } else if (bot.type === "Bot_Easy") {

            scoreLow += 5;

        }

        return (scoreHigh > scoreLow) ? "high" : "low";

    },

    // Volba režimu pohybu a taktických hodů pro bota,

    decideBotMovementMode: function (state, bot) {

        var effStats = this.getEffectiveStats(state, bot);

        var hasHorse = (bot.stats.horses > 0 || effStats.horses > 0);

        var hasFalcon = (bot.stats.falcons > 0 || effStats.falcons > 0);

        var rollResult = Math.floor(Math.random() * 6) + 1;
        var chosenMode = "standard";

        if (hasHorse) {
            var d1 = Math.floor(Math.random() * 6) + 1;
            var d2 = Math.floor(Math.random() * 6) + 1;
            var jz = effStats.riding || 0;
            var canGallop = jz >= 2;
            var canSprint = jz >= 4;

            // Varianta A: Sokol naviguje jen u taktických manévrů (d1 a d2). Plný cval a trysk jsou příliš rychlé.
            var candidates = [];

            // 1. Cval a Královský trysk (rychlost, ale bez sokola)
            if (canSprint) {
                candidates.push({ roll: d1 + d2 + 2, type: "sprint", usesFalcon: false });
            }
            if (canGallop) {
                candidates.push({ roll: d1 + d2, type: "gallop", usesFalcon: false });
            }

            // 2. Taktické manévry d1 a d2 (přesnost se sokolí navigací ±1)
            var maneuverBases = [d1];
            if (d2 !== d1) maneuverBases.push(d2);

            for (var m = 0; m < maneuverBases.length; m++) {
                var mBase = maneuverBases[m];
                candidates.push({ roll: mBase, type: "maneuver", usesFalcon: false });
                if (hasFalcon) {
                    if (mBase > 1) {
                        candidates.push({ roll: mBase - 1, type: "maneuver_falcon_minus", usesFalcon: true });
                    }
                    candidates.push({ roll: mBase + 1, type: "maneuver_falcon_plus", usesFalcon: true });
                }
            }

            // Ohodnocení kandidátů botem
            var bestCand = candidates[0];
            var bestScore = -9999;
            for (var c = 0; c < candidates.length; c++) {
                var cand = candidates[c];
                var tNode = this.getTargetNodeForRoll(state, bot, cand.roll);
                var sc = this.scoreNodeForPlayer(state, bot, tNode);
                if (sc > bestScore) {
                    bestScore = sc;
                    bestCand = cand;
                }
            }

            rollResult = bestCand.roll;
            chosenMode = "horse";

            if (bestCand.usesFalcon) {
                var targetNodeName = this.getTargetNodeForRoll(state, bot, rollResult).name;
                this.addLog(state, "🏇🦅 " + bot.badge + " " + bot.name + " volí taktický manévr s koněm a sokolí navigací na **" + targetNodeName + "** (" + rollResult + " polí)!");
            } else if (bestCand.type === "sprint") {
                this.addLog(state, "🏇👑 " + bot.badge + " " + bot.name + " vyráží do Královského trysku o " + rollResult + " polí (" + d1 + "+" + d2 + "+2)!");
            } else if (bestCand.type === "gallop") {
                this.addLog(state, "🏇 " + bot.badge + " " + bot.name + " využívá plného koňského cvalu o " + rollResult + " polí (" + d1 + "+" + d2 + ")!");
            } else {
                this.addLog(state, "🏇 " + bot.badge + " " + bot.name + " volí taktický manévr s koněm o " + rollResult + " polí!");
            }

            return { roll: rollResult, mode: chosenMode };
        }

        // Pěší se sokolem (pouze pokud bot nemá koně)
        if (hasFalcon) {
            var baseTarget = this.getTargetNodeForRoll(state, bot, rollResult);
            var baseScore = this.scoreNodeForPlayer(state, bot, baseTarget);
            var minusRoll = Math.max(1, rollResult - 1);
            var plusRoll = rollResult + 1;
            var minusTarget = this.getTargetNodeForRoll(state, bot, minusRoll);
            var plusTarget = this.getTargetNodeForRoll(state, bot, plusRoll);
            var minusScore = this.scoreNodeForPlayer(state, bot, minusTarget);
            var plusScore = this.scoreNodeForPlayer(state, bot, plusTarget);

            if (plusScore > baseScore + 4 && plusScore >= minusScore) {
                this.addLog(state, "🦅 " + bot.badge + " " + bot.name + " díky sokolí navigaci upravuje přistání o +1 pole na **" + plusTarget.name + "**!");
                rollResult = plusRoll;
            } else if (minusScore > baseScore + 4) {
                this.addLog(state, "🦅 " + bot.badge + " " + bot.name + " díky sokolí navigaci upravuje přistání o -1 pole na **" + minusTarget.name + "**!");
                rollResult = minusRoll;
            }
        }

        return { roll: rollResult, mode: chosenMode };

    },

    // Dokončení pohybu po volbě větve na rozcestí,

    decideBotDilemma: function (state, bot, card) {

        if (!card.options || card.options.length < 2) return 0;

        var optA = card.options[0];

        var optB = card.options[1];

        // Bot_Aggressive: preferuje zisk zlata, hazard a bojové výzvy

        if (bot.type === "Bot_Aggressive") {

            if (optA.effect === "dice_gamble" && bot.gold >= 2500) return 0;

            if (optA.gainGold && (!optB.gainGold || optA.gainGold > optB.gainGold)) return 0;

            if (optB.gainGold && (!optA.gainGold || optB.gainGold > optA.gainGold)) return 1;

            return (Math.random() < 0.6) ? 0 : 1;

        }

        // Bot_Noble: ctí rytířské ctnosti, odmítá úplatky, preferuje Srdce princezny

        if (bot.type === "Bot_Noble") {

            if (optB.id === "opt_honor" || optB.gainHearts > (optA.gainHearts || 0)) return 1;

            if (optA.gainHearts && optA.gainHearts > (optB.gainHearts || 0) && (!optA.costGold || bot.gold >= optA.costGold + 1000)) return 0;

            if (optA.lossHearts) return 1;

            if (optB.lossHearts) return 0;

            return 0;

        }

        // Bot_Breeder: preferuje chov koní a šetří zlato

        if (bot.type === "Bot_Breeder") {

            if (optA.effect === "gain_jizda" && bot.gold >= 1500) return 0;

            if (optA.costGold && optA.costGold > 800) return 1;

            return 0;

        }

        // Bot_Balanced a Bot_Easy: racionální volba podle hotovosti

        if (optA.costGold && bot.gold < optA.costGold + 800) return 1;

        if (optA.gainHearts && optA.gainHearts >= 1.0) return 0;

        return (Math.random() < 0.5) ? 0 : 1;

    },

    // Nákup volného políčka,

    checkQuestWeakness: function (state, player, q, tactics) {

        if (!q || !q.weakness) return { exploited: false, reason: "" };

        var stats = this.getEffectiveStats(state, player);

        tactics = tactics || {};

        var w = q.weakness;

        var items = player.items || [];

        function hasItemMatching(predicate) {

            for (var i = 0; i < items.length; i++) {

                var it = items[i];

                if (it.isEquipped !== false && predicate(it)) return it;

            }

            return null;

        }

        // 1. Zvířata & jezdecké umění

        if (w === "dogs") {

            if (stats.dogs > 0 || tactics.hounds) {

                return { exploited: true, reason: "Lovečtí psi odlákali pozornost bestie" };

            }

        } else if (w === "falcon" || w === "falcons") {

            if (stats.falcons > 0 || tactics.hounds) {

                return { exploited: true, reason: "Lovecký sokol vystopoval zranitelná místa" };

            }

        } else if (w === "horse") {

            if (stats.horses > 0 || tactics.charge || stats.riding >= 2) {

                return { exploited: true, reason: "Drtivý nájezd z plné jízdy na koni zlomil obranu" };

            }

        } else if (w === "animals") {

            if ((stats.dogs > 0 && stats.falcons > 0) || (stats.horses > 0 && stats.dogs > 0)) {

                return { exploited: true, reason: "Kombinace vycvičených zvířat dokonale zmátla draka" };

            }

        } else if (w === "animals_and_spear") {

            var hasSpear = hasItemMatching(function (it) {

                return it.id === "it1_3" || it.id === "it2_2" || /kopí|dřevce/i.test(it.name);

            });

            if ((stats.horses > 0 || stats.dogs > 0) && (hasSpear || stats.combat >= 4)) {

                return { exploited: true, reason: "Mistrovská koordinace jízdy na koni a turnajového kopí" };

            }

        }

        // 2. Zbraně & rytířská zbroj

        else if (w === "spear") {

            var spearIt = hasItemMatching(function (it) {

                return it.id === "it1_3" || it.id === "it2_2" || /kopí|dřevce/i.test(it.name);

            });

            if (spearIt) {

                return { exploited: true, reason: "Dlouhé " + spearIt.name + " udrželo nestvůru v bezpečném odstupu" };

            }

            if (stats.combat >= 3 && stats.riding >= 2) {

                return { exploited: true, reason: "Rytířské ovládnutí jezdeckého kopí a manévrů" };

            }

        } else if (w === "armor") {

            var armorIt = hasItemMatching(function (it) {

                return it.slot === "armor" || it.id === "trophy_black_knight";

            });

            if (armorIt || stats.hasArmor) {

                var aName = armorIt ? armorIt.name : "Pevná zbroj";

                return { exploited: true, reason: aName + " odrazila drtivý úder" };

            }

        } else if (w === "water_armor") {

            var waterIt = hasItemMatching(function (it) {

                return it.id === "trophy_water" || it.id === "it2_3" || it.id === "it2_4" || it.id === "it3_2" || /voda|vodní|chlad|jezero/i.test(it.name);

            });

            if (waterIt || stats.hasArmor) {

                return { exploited: true, reason: "Ochranné brnění a vodní perla zchladily spalující žár" };

            }

        }

        // 3. Živlové zbraně (Oheň, Led/Mráz)

        else if (w === "fire") {

            var fireIt = hasItemMatching(function (it) {

                return it.id === "trophy_red" || it.id === "trophy_volcano" || /oheň|ohniv|žár|plam|láva/i.test(it.name);

            });

            var curTheme = (state && state.config && state.config.elementTheme) || (state && state.currentTheme);

            if (fireIt || curTheme === "fire" || stats.combat >= 4) {

                return { exploited: true, reason: "Žhavé plameny a sopečný žár roztavily ledový krunýř" };

            }

        } else if (w === "ice") {

            var iceIt = hasItemMatching(function (it) {

                return it.id === "trophy_ice" || /led|mraz|rampouch/i.test(it.name);

            });

            var curTheme2 = (state && state.config && state.config.elementTheme) || (state && state.currentTheme);

            if (iceIt || curTheme2 === "water" || stats.combat >= 4) {

                return { exploited: true, reason: "Mrazivý chlad a ledové krystaly zchladily lávovou tlamu" };

            }

        }

        // 4. Lektvary & Lazaret

        else if (w === "elixir") {

            if (tactics.elixir || player.gold >= 500) {

                return { exploited: true, reason: "Hojivý lektvar z Lazaretu neutralizoval jedovatý dech" };

            }

        }

        // 5. Ctnosti: Tanec & Charisma

        else if (w === "dance") {

            if (stats.dance >= 2 || stats.hasDress) {

                return { exploited: true, reason: "Půvabný taneční krok a dvorský šat okouzlily hravého draka" };

            }

        } else if (w === "charisma") {

            if (stats.charisma >= 3 || stats.hasJewel) {

                return { exploited: true, reason: "Vznešené charisma rytíře dojalo drahokamového draka" };

            }

        }

        // 6. Odvaha, Světlo, Svaté relikvie, Mistrovství

        else if (w === "courage") {

            if (stats.combat >= 3 || stats.riding >= 3) {

                return { exploited: true, reason: "Nezlomná rytířská odvaha pronikla mlhou stínů" };

            }

        } else if (w === "light" || w === "holy") {

            var holyIt = hasItemMatching(function (it) {

                return it.id === "trophy_stag" || it.id === "it3_4" || it.id === "it1_9" || it.id === "it3_2" || it.id === "it3_1" || it.id === "trophy_gold" || /svat|klenot|světlo|zlat/i.test(it.name);

            });

            if (holyIt || stats.charisma >= 3) {

                return { exploited: true, reason: "Zářící posvátné světlo relikvií spálilo stínovou temnotu" };

            }

        } else if (w === "mastery") {

            if (stats.combat >= 2 && stats.riding >= 2 && stats.dance >= 2 && stats.charisma >= 2) {

                return { exploited: true, reason: "Dokonalé ovládnutí všech 4 rytířských ctností (Boj, Jízda, Tanec, Charisma)" };

            }

        }

        return { exploited: false, reason: "" };

    },

    // Vyhodnocení Úkolu / Souboje s monstrem či drakem (U1, U2, U3),

    resolveQuest: function (state, forcedRoll, tactics) {

        var pa = state.pendingAction;

        if (!pa || !pa.canResolveQuest || !pa.questCard) return null;

        var player = state.players[state.currentPlayerIndex];

        var q = pa.questCard;

        var stats = this.getEffectiveStats(state, player);

        tactics = tactics || {};

        var tacticBonus = 0;

        var tacticName = "Běžný útok";

        if (tactics.charge && stats.horses > 0) {

            tacticBonus += 1;

            tacticName = "🏇 Útok z plné jízdy (+1 k síle)";

        } else if (tactics.hounds && (stats.dogs > 0 || stats.falcons > 0)) {

            tacticBonus += 1;

            tacticName = "🐕 Lovecká smečka odlákala pozornost (+1 k síle)";

        } else if (tactics.elixir) {

            tacticName = "🧪 Hojivý elixír z Lazaretu (Pojistka proti Špitálu)";

        }

        // Taktický bojový postoj: Dravý útok (+2 Síla / -2 Srdce), Opatrná obrana (-1 Síla / bezpečný ústup), Taktický (standard + reroll)

        var stance = tactics.stance || "tactical";

        var stanceBonus = 0;

        var stanceName = "🎯 Taktický manévr";

        if (stance === "aggressive") {

            stanceBonus = 2;

            stanceName = "⚔️ Dravý útok (+2 k síle, při prohře -2 💖 nebo 2× pokuta)";

        } else if (stance === "defensive") {

            stanceBonus = -1;

            stanceName = "🛡️ Opatrná obrana (-1 k síle, při prohře 0 ztráta srdcí & bezpečný ústup)";

        }

        var roll = forcedRoll || (Math.floor(Math.random() * 6) + 1);

        var animalBonus = 0;

        if (q.questTier === "U1" && (stats.dogs > 0 || stats.falcons > 0)) {

            animalBonus = 1;

        } else if (q.questTier === "U3" && (stats.dogs > 0 || stats.falcons > 0)) {

            animalBonus = (stats.dogs > 0 && stats.falcons > 0) ? 2 : 1;

        }

        var horseBonus = (q.questTier !== "U1" && stats.horses > 0) ? (1 + Math.floor(stats.riding / 2)) : 0;

        var wRes = this.checkQuestWeakness(state, player, q, tactics);

        var weaknessBonus = wRes.exploited ? 2 : 0;

        var totalPower = roll + stats.combat + animalBonus + horseBonus + tacticBonus + weaknessBonus + stanceBonus;

        pa.canResolveQuest = false;

        var won = totalPower >= q.difficulty;

        var trophyItemWon = null;

        var lootWon = null;

        var preventedHospital = false;

        if (won) {

            player.gold += q.gold;
            player.permanentHearts = Math.round((player.permanentHearts + q.hearts) * 10) / 10;
            player.stats.questsWon++;
            player.stats.heartsFromQuests = Math.round((player.stats.heartsFromQuests + q.hearts) * 10) / 10;

            if (q.questTier === "U3" || (q.id && q.id.indexOf("u3") === 0)) {

                player.stats.dragonsSlain = (player.stats.dragonsSlain || 0) + 1;

            } else if (q.questTier === "U2" || (q.id && q.id.indexOf("u2") === 0)) {

                player.stats.monstersSlain = (player.stats.monstersSlain || 0) + 1;

            } else {

                player.stats.beastsSlain = (player.stats.beastsSlain || 0) + 1;

            }

            var rewardMsg = "⚔️ HRDINSKÉ VÍTĚZSTVÍ! " + player.badge + " " + player.name + " porazil **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. obtížnost " + q.difficulty + ", hod " + roll + ")! Získává **+" + q.gold.toLocaleString("cs-CZ") + " zl.**" + (q.hearts > 0 ? " a **+" + q.hearts + " 💖**!" : "!");

            if (wRes.exploited) {

                rewardMsg += " 🎯 Využita slabina bestie (+2 k síle: " + wRes.reason + ")!";

            }

            // 🏆 Získání unikátní trofeje z nestvůry / draka (U1: 75 %, U2: 65 %, U3: 90 %)

            var trophyChance = (q.questTier === "U1") ? 0.75 : ((q.questTier === "U2") ? 0.65 : 0.90);

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

                    trophyItemWon = trophyItem;

                    if (!player.stats.trophiesCollected) player.stats.trophiesCollected = 0;

                    player.stats.trophiesCollected++;

                    rewardMsg += " 🏆 Trofej: **" + trophyItem.icon + " " + trophyItem.name + "** (" + (trophyItem.isEquipped ? "Aktivně nasazena!" : "Uložena do batohu") + ")!";

                }

            }

            // Bonusový předmět zdarma padne pouze při drtivém vítězství (překonání obtížnosti o +3 a více)
            if (q.itemTier && (totalPower >= q.difficulty + 3)) {

                var pool = window.PRS_ITEMS.filter(function (it) { return it.tier === q.itemTier && it.slot !== "trophy"; });

                if (pool.length > 0) {

                    var loot = this.deepClone(pool[Math.floor(Math.random() * pool.length)]);

                    player.items.push(loot);

                    lootWon = loot;

                    rewardMsg += " 🎁 Drtivé vítězství (+3 k obtížnosti)! Kořist: **" + loot.icon + " " + loot.name + "**!";

                }

            }

            pa.summary = rewardMsg;

            this.addLog(state, rewardMsg, "quest_win", {
                key: "engine.quest_win_log",
                params: {
                    badge: player.badge,
                    player: player.name,
                    monster: q.icon + " " + q.name
                }
            });

        } else {

            player.stats.questsLost++;

            // Kontrola taktického Rerollu (při taktickém postoji, prohře o 1-2 body a přítomnosti psa/sokola či Boj >= 2)

            var canReroll = (stance === "tactical" && (q.difficulty - totalPower <= 2) && (stats.dogs > 0 || stats.falcons > 0 || stats.combat >= 2));

            if (canReroll && !tactics.isReroll) {

                pa.canTacticalReroll = true;

                pa.lastDuelRoll = roll;

                pa.lastDuelTactics = tactics;

                pa.lastDuelPower = totalPower;

            }

            if (stance === "defensive") {

                // Opatrná obrana: hráč neutrpí žádnou ztrátu srdcí ani vězení/lazaret

                preventedHospital = true;

                var defLossMsg = "🛡️ Opatrný ústup za štítem! " + player.badge + " " + player.name + " včas kryl svůj ústup před **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + "). Díky obrannému postoji neutrpěl žádnou ztrátu srdcí ani zranění!";

                pa.summary = defLossMsg;

                this.addLog(state, defLossMsg, "quest_loss", {
                    key: "engine.quest_loss_log",
                    params: {
                        badge: player.badge,
                        player: player.name,
                        monster: q.icon + " " + q.name
                    }
                });

            } else if (tactics.elixir || player.hasElixirToken) {

                // Pojistka elixírem z Lazaretu - hráč neutrpí těžké zranění
                var usedToken = !!player.hasElixirToken;
                if (usedToken) player.hasElixirToken = false;
                var elixCost = usedToken ? 0 : Math.min(player.gold, 500);

                if (elixCost > 0) player.gold -= elixCost;

                preventedHospital = true;

                var elixLossMsg = "🧪 Záchrana hojivým elixírem! " + player.badge + " " + player.name + " podlehl bestii **" + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + "), ale díky ochrannému elixíru z Lazaretu neutrpěl těžká zranění a nemusí do Špitálu!";

                pa.summary = elixLossMsg;

                this.addLog(state, elixLossMsg, "quest_loss");

            } else if (q.questTier === "U1") {

                var failCost = Math.min(player.gold, (state.config.quests.u1FailCost || 500) * (stance === "aggressive" ? 2 : 1));

                player.gold -= failCost;

                var u1Msg = "🐗 Lov se nezdařil! **" + q.name + "** unikl (Síla " + totalPower + " vs. " + q.difficulty + ", hod " + roll + ")." + (stance === "aggressive" ? " Kvůli dravému výpadu tě ošetření ran stálo dvojnásobek: -" + failCost + " zl." : " Ošetření ran stojí -" + failCost + " zl.");

                pa.summary = u1Msg;

                this.addLog(state, u1Msg, "quest_loss");

            } else {

                // Dravý útok na U2/U3: ztráta 2 Srdcí

                var heartsLost = (stance === "aggressive") ? 2.0 : 1.0;

                player.permanentHearts = Math.max(0, player.permanentHearts - heartsLost);

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

                    var hospLossMsg = "💀 PORÁŽKA V BOJI! " + player.badge + " " + player.name + " podlehl v souboji s **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + ", hod " + roll + ")." + (stance === "aggressive" ? " Dravý výpad způsobil kritické zranění: **-" + heartsLost + " 💖**!" : " Rytíř ztratil **-" + heartsLost + " 💖**.") + " Těžce raněný byl převezen do **" + hospitalNode.name + "**, kde se 1 tah léčí!";

                    pa.summary = hospLossMsg;

                    this.addLog(state, hospLossMsg, "quest_loss");

                } else {

                    player.nodeId = 0;

                    player.skipTurns = 1;

                    var deathMsg = "💀 PORÁŽKA V BOJI! " + player.badge + " " + player.name + " podlehl v souboji s **" + q.icon + " " + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + ", hod " + roll + ")." + (stance === "aggressive" ? " Kritické zranění: **-" + heartsLost + " 💖**!" : " Ztráta **-" + heartsLost + " 💖**.") + " Rytíř byl odnesen na **START** a vynechává 1 tah!";

                    pa.summary = deathMsg;

                    this.addLog(state, deathMsg, "quest_loss");

                }

            }

        }

        this.recalculateBreedingAndVictory(state);

        return {

            won: won,

            roll: roll,

            totalPower: totalPower,

            difficulty: q.difficulty,

            trophyWon: trophyItemWon,

            lootWon: lootWon,

            goldWon: q.gold,

            heartsWon: q.hearts,

            quest: q,

            preventedHospital: preventedHospital,

            tacticBonus: tacticBonus,

            horseBonus: horseBonus,

            animalBonus: animalBonus,

            weaknessBonus: weaknessBonus,

            weaknessExploited: wRes.exploited,

            weaknessReason: wRes.reason,

            tacticName: tacticName,

            stance: stance,

            stanceBonus: stanceBonus,

            stanceName: stanceName,

            canTacticalReroll: (stance === "tactical" && !won && (q.difficulty - totalPower <= 2) && (stats.dogs > 0 || stats.falcons > 0 || stats.combat >= 2))

        };

    },

    // Vyhodnocení SLAVNOSTI (Turnaj, Ples, Závod) podle vzorců z rukopisů IMG_4596 a IMG_4597,

    resolveFestival: function (state) {

        var pa = state.pendingAction;

        if (!pa || !pa.canResolveFestival) return null;

        var fType = pa.festivalType || "tournament";

        var organizer = state.players[state.currentPlayerIndex];

        pa.canResolveFestival = false;

        // Zjistíme, kteří hráči splňují podmínku účasti

        var participants = [];

        for (var i = 0; i < state.players.length; i++) {

            var p = state.players[i];

            var st = this.getEffectiveStats(state, p);

            var eligible = false;

            if (fType === "tournament") {

                // Podmínka z IMG_4596: Kůň, Pes, Sokol (nebo alespoň Kůň + Zbroj/Zbraň pro plynulost hry, pokud ještě nikdo nemá všechna 3 zvířata)

                eligible = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) || (st.horses >= 1 && (st.hasWeapon || st.hasArmor));

            } else if (fType === "ball") {

                // Podmínka z IMG_4596: Šaty (nebo Tanec >= 1)

                eligible = st.hasDress || st.dance >= 1;

            } else if (fType === "race") {

                // Podmínka z IMG_4596: Kůň

                eligible = st.horses >= 1;

            }

            if (eligible) {

                var roll = Math.floor(Math.random() * 6) + 1;

                var score = roll;

                if (fType === "tournament") {

                    var animalSetBonus = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) ? 3 : 0;

                    score = roll + st.combat + st.riding + animalSetBonus;

                } else if (fType === "ball") {

                    var armorPenalty = st.hasArmor ? 2 : 0;

                    score = roll + st.dance + st.charisma + (st.hasDress ? 2 : 0) - armorPenalty;

                } else if (fType === "race") {

                    score = roll + (st.riding * 2) + Math.min(3, st.horses);

                }

                participants.push({

                    player: p,

                    stats: st,

                    roll: roll,

                    score: score

                });

            }

        }

        var fNames = { tournament: "Královský Turnaj", ball: "Zámecký Ples", race: "Velký Jezdecký Závod" };

        var festTitle = fNames[fType] || "Královská Slavnost";

        // Pravidlo z IMG_4596: "min 2 hráči"

        if (participants.length < 2) {
            organizer.gold += 800;
            organizer.permanentHearts = Math.round((organizer.permanentHearts + 0.5) * 10) / 10;
            organizer.stats.heartsFromFestivals = Math.round((organizer.stats.heartsFromFestivals + 0.5) * 10) / 10;
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

        var prevRankHearts = null;

        for (var r = 0; r < Math.min(3, participants.length); r++) {

            var part = participants[r];

            var pl = part.player;

            var ch = part.stats.charisma || 0;
            var jz = part.stats.riding || 0;
            var tn = part.stats.dance || 0;
            var bj = part.stats.combat || 0;

            var heartsWon = 0;

            // Vyvážené slavnostní odměny: zohledňují příslušnou dovednost i Charisma a garantují 1. > 2. > 3.
            if (fType === "tournament") {

                if (r === 0) heartsWon = 3.0 + (bj * 0.3) + (ch * 0.2);

                else if (r === 1) heartsWon = 2.0 + (bj * 0.2) + (ch * 0.1);

                else heartsWon = 1.0 + (bj * 0.15);

            } else if (fType === "ball") {

                if (r === 0) heartsWon = 2.5 + (tn * 0.4) + (ch * 0.3);

                else if (r === 1) heartsWon = 1.5 + (tn * 0.2) + (ch * 0.15);

                else heartsWon = 0.5 + (tn * 0.15);

            } else if (fType === "race") {

                if (r === 0) heartsWon = 2.5 + (jz * 0.4) + (ch * 0.2);

                else if (r === 1) heartsWon = 1.5 + (jz * 0.2) + (ch * 0.1);

                else heartsWon = 0.5 + (jz * 0.15);

            }

            // Striktní garance: vítěz bere vždy alespoň o 0.5 💖 více než 2. místo a 2. místo více než 3.
            if (r === 1 && prevRankHearts !== null) {

                heartsWon = Math.min(prevRankHearts - 0.5, heartsWon);

                heartsWon = Math.max(1.0, heartsWon);

            } else if (r === 2 && prevRankHearts !== null) {

                heartsWon = Math.min(prevRankHearts - 0.5, heartsWon);

                heartsWon = Math.max(0.5, heartsWon);

            }

            heartsWon = Math.round(heartsWon * 10) / 10;
            prevRankHearts = heartsWon;
            var goldWon = goldPrizes[r] || 300;
            pl.permanentHearts = Math.round((pl.permanentHearts + heartsWon) * 10) / 10;
            pl.gold += goldWon;
            pl.stats.heartsFromFestivals = Math.round((pl.stats.heartsFromFestivals + heartsWon) * 10) / 10;

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

    // Šatlava: Zaplacení kauce,

    executePlayerDuel: function (state, targetPlayerIndex) {

        var player = state.players[state.currentPlayerIndex];

        var target = state.players[targetPlayerIndex];

        if (!player || !target || player.isEliminated || target.isEliminated) return null;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        var stake = Math.round(1000 * (rate > 0 ? rate : 0.5));

        var heartStake = 0.5;

        // Kontrola zrady paktu

        this.breakTradePact(state, player.index, target.index, "rytířský duel na stejném poli");

        var p1Stats = this.getEffectiveStats(state, player);

        var p2Stats = this.getEffectiveStats(state, target);

        var r1 = Math.floor(Math.random() * 6) + 1;

        var r2 = Math.floor(Math.random() * 6) + 1;

        var power1 = p1Stats.combat + r1;

        // Obránce může použít Jezdecký úhyb na koni (Jízda + min(2, koně)), pokud je vyšší než Boj
        var defRidingVal = (p2Stats.riding >= 1 && p2Stats.horses > 0) ? (p2Stats.riding + Math.min(2, p2Stats.horses)) : p2Stats.riding;
        var usedEvasion = defRidingVal > p2Stats.combat;
        var defStat = usedEvasion ? defRidingVal : p2Stats.combat;

        var power2 = defStat + r2;

        var isUltimate = (state.config.difficultyMode === "ultimate");

        var result = {

            type: "field_duel",

            winnerIndex: null,

            p1: { index: player.index, name: player.name, badge: player.badge, color: player.color, roll: r1, combat: p1Stats.combat, total: power1, type: player.type },

            p2: { index: target.index, name: target.name, badge: target.badge, color: target.color, roll: r2, combat: defStat, total: power2, type: target.type, usedEvasion: usedEvasion },

            stake: stake,

            actualGold: 0,

            heartStake: heartStake,

            heartLost: (state.config.difficultyMode !== "easy" && state.config.difficultyMode !== "standard"),

            isUltimate: isUltimate,

            hospitalTransferred: false,

            message: "",

            isDraw: false

        };

        if (power1 > power2) {

            result.winnerIndex = player.index;

            var actualGold = this.transferGold(state, target, player, stake);

            result.actualGold = actualGold;

            player.permanentHearts += heartStake;

            if (state.config.difficultyMode !== "easy" && state.config.difficultyMode !== "standard") {

                target.permanentHearts = Math.round((target.permanentHearts - heartStake) * 10) / 10;

            }

            var winMsg = "⚔️ DUEL NA POLI! " + player.badge + " " + player.name + " (" + power1 + ") slavně porazil v rytířském souboji " + target.badge + " " + target.name + " (" + power2 + ")! Získává +" + actualGold + " zl. a +" + heartStake + " 💖!";

            if (isUltimate) {

                var hospNode = null;

                for (var ni in state.board.nodes) {

                    if (state.board.nodes[ni].type === "HOSPITAL") { hospNode = state.board.nodes[ni]; break; }

                }

                if (hospNode) {

                    target.nodeId = hospNode.id;

                    winMsg += " V Ultimate módu je těžce zraněný rytíř urychleně převezen do Královského lazaretu!";

                    result.hospitalTransferred = true;

                } else {

                    target.skipTurns = 1;

                    winMsg += " V Ultimate módu je poražený zraněn a vynechává 1 tah!";

                }

            }

            result.message = winMsg;

            this.addLog(state, winMsg, "victory", {
                key: "engine.duel_win_log",
                params: {
                    badge: player.badge,
                    player: player.name,
                    opponentBadge: target.badge,
                    opponent: target.name
                }
            });

        } else if (power2 > power1) {

            result.winnerIndex = target.index;

            var actualGold2 = this.transferGold(state, player, target, stake);

            result.actualGold = actualGold2;

            target.permanentHearts += heartStake;

            if (usedEvasion && (power2 - power1 >= 3)) {

                target.permanentHearts += 0.5;

            }

            if (state.config.difficultyMode !== "easy" && state.config.difficultyMode !== "standard") {

                player.permanentHearts = Math.round((player.permanentHearts - heartStake) * 10) / 10;

            }

            var loseMsg = usedEvasion
                ? ("🐎 JEZDECKÝ ÚHYB! " + target.badge + " " + target.name + " (" + power2 + ") v sedle obratně vymanévroval útočníka " + player.badge + " " + player.name + " (" + power1 + ")!" + ((power2 - power1 >= 3) ? " Za bravurní manévr získává navíc +0,5 💖!" : "") + " Poražený útočník odevzdává " + actualGold2 + " zl.!")
                : ("⚔️ DUEL NA POLI! " + target.badge + " " + target.name + " (" + power2 + ") odrazil výzvu a porazil útočníka " + player.badge + " " + player.name + " (" + power1 + ")! Poražený odevzdává " + actualGold2 + " zl.!");

            if (isUltimate) {

                var hospNode2 = null;

                for (var ni2 in state.board.nodes) {

                    if (state.board.nodes[ni2].type === "HOSPITAL") { hospNode2 = state.board.nodes[ni2]; break; }

                }

                if (hospNode2) {

                    player.nodeId = hospNode2.id;

                    loseMsg += " V Ultimate módu je těžce zraněný rytíř urychleně převezen do Královského lazaretu!";

                    result.hospitalTransferred = true;

                } else {

                    player.skipTurns = 1;

                    loseMsg += " V Ultimate módu je poražený zraněn a vynechává 1 tah!";

                }

            }

            result.message = loseMsg;

            this.addLog(state, loseMsg, "danger", {
                key: "engine.duel_loss_log",
                params: {
                    badge: player.badge,
                    player: player.name,
                    opponentBadge: target.badge,
                    opponent: target.name
                }
            });

        } else {

            result.isDraw = true;

            result.message = "Rytíři zkřížili meče v nerozhodném střetu! Žádné zlato ani srdce se nemění.";

            this.addLog(state, "⚔️ DUEL NA POLI! " + player.name + " (" + power1 + ") a " + target.name + " (" + power2 + ") zkřížili meče v nerozhodném střetu! Žádné zlato ani srdce se nemění.");

        }

        if (state.pendingAction) {

            state.pendingAction.canDuelPlayer = false;

            state.pendingAction.canToastPlayer = false;

        }

        state.lastDuelResult = result;

        this.recalculateBreedingAndVictory(state);

        return result;

    },

    // 2. Přátelský přípitek na stejném poli,

    executePlayerToast: function (state, targetPlayerIndex) {

        var player = state.players[state.currentPlayerIndex];

        var target = state.players[targetPlayerIndex];

        if (!player || !target) return false;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        var cost = Math.round(500 * (rate > 0 ? rate : 0.5));

        if (player.gold < cost) return false;

        player.gold -= cost;

        target.gold += cost;

        var tStats = this.getEffectiveStats(state, player);

        var toastHearts = (tStats.dance >= 3) ? 1.0 : 0.5;

        player.permanentHearts += toastHearts;

        player.lastToastRound = state.roundNumber;

        var msg = "🍷 PŘÁTELSKÝ PŘÍPITEK! " + player.badge + " " + player.name + " pozval rytíře " + target.badge + " " + target.name + " na číši burgundského vína (-" + cost + " zl.). Za dvorskou štědrost a společenský šarm získává **+" + toastHearts + " 💖**!";

        this.addLog(state, msg, "gold");

        if (state.pendingAction) {

            state.pendingAction.canDuelPlayer = false;

            state.pendingAction.canToastPlayer = false;

            state.pendingAction.summary = msg;

        }

        this.recalculateBreedingAndVictory(state);

        return true;

    },

    // 3. Šlechtický výkup ze sady (Královské předkupní právo)
    executeAnimalBuyout: function (state, targetNodeId) {
        var player = state.players[state.currentPlayerIndex];
        var targetNode = null;
        if (state.board && Array.isArray(state.board.nodes)) {
            if (typeof targetNodeId === "number" && state.board.nodes[targetNodeId]) {
                targetNode = state.board.nodes[targetNodeId];
            } else {
                for (var ni = 0; ni < state.board.nodes.length; ni++) {
                    if (state.board.nodes[ni] && state.board.nodes[ni].id == targetNodeId) {
                        targetNode = state.board.nodes[ni];
                        break;
                    }
                }
            }
        }
        if (!player || !targetNode || targetNode.type !== "ANIMAL" || targetNode.owner === null || targetNode.owner === undefined || targetNode.owner === player.index) {
            return false;
        }
        var targetOwner = state.players[targetNode.owner];
        if (!targetOwner) return false;

        var origPrice = this.getNodePrice ? this.getNodePrice(state, targetNode) : (targetNode.buyPrice || 1000);
        var buyoutPrice = origPrice * 2;
        if (player.gold < buyoutPrice) return false;

        player.gold -= buyoutPrice;
        targetOwner.gold += buyoutPrice;
        if (Array.isArray(targetOwner.ownedNodes)) {
            var oIdx = targetOwner.ownedNodes.indexOf(targetNode.id);
            if (oIdx !== -1) targetOwner.ownedNodes.splice(oIdx, 1);
        }
        if (!Array.isArray(player.ownedNodes)) player.ownedNodes = [];
        if (player.ownedNodes.indexOf(targetNode.id) === -1) {
            player.ownedNodes.push(targetNode.id);
            if (window.PRS_GameEngine && window.PRS_GameEngine.sortPlayerOwnedNodes) {
                window.PRS_GameEngine.sortPlayerOwnedNodes(player, state);
            }
        }
        targetNode.owner = player.index;

        var msg = "📜 KRÁLOVSKÉ PŘEDKUPNÍ PRÁVO! " + player.badge + " " + player.name + " vykoupil " + (targetNode.icon || "🐾") + " **" + targetNode.name + "** od " + targetOwner.badge + " " + targetOwner.name + " za dvojnásobek (" + buyoutPrice + " zl.) a zkompletoval sadu #" + targetNode.setId + " (+1,0 💖)!";
        this.addLog(state, msg, "victory");

        if (state.pendingAction) {
            state.pendingAction.canBuyoutAnimalSet = false;
            state.pendingAction.buyoutCandidates = [];
            state.pendingAction.buyoutSuccess = null;
            delete state.pendingAction.canBuyoutAnimalSet;
            delete state.pendingAction.buyoutCandidates;
            delete state.pendingAction.buyoutSuccess;
            state.pendingAction.summary = msg;
        }

        try {
            this.recalculateBreedingAndVictory(state);
        } catch (e) {
            console.error("recalculateBreedingAndVictory error in buyout:", e);
        }

        return {
            success: true,
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            targetOwnerName: targetOwner.name,
            buyoutPrice: buyoutPrice,
            setId: targetNode.setId
        };
    },

    // 4. Dvorní intrika u Kejklíře nebo v Krčmě,

    executePlotIntrigue: function (state, type, targetPlayerIndex) {

        var player = state.players[state.currentPlayerIndex];

        var target = state.players[targetPlayerIndex];

        if (!player || !target || player.isEliminated || target.isEliminated) return null;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        this.breakTradePact(state, player.index, target.index, "dvorní intrika");

        if (type === "ballad") {

            var cost = (state.pendingAction && state.pendingAction.intrigueBalladCost) || Math.round(1500 * (rate > 0 ? rate : 0.5));

            if (player.gold < cost) return null;

            player.gold -= cost;

            var p1Stats = this.getEffectiveStats(state, player);

            var p2Stats = this.getEffectiveStats(state, target);

            var r1 = Math.floor(Math.random() * 6) + 1;

            var r2 = Math.floor(Math.random() * 6) + 1;

            var ch1 = (p1Stats.charisma || 0) + r1;

            var ch2 = (p2Stats.charisma || 0) + r2;

            var isHard = Boolean(state.config && (state.config.difficultyMode === "hard" || state.config.difficultyMode === "ultimate"));
            var penalty = isHard ? 1.0 : 0.5;

            var isSuccess = (ch1 > ch2);

            var msg = "";

            if (isSuccess) {

                target.permanentHearts = Math.round((target.permanentHearts - penalty) * 10) / 10;

                player.permanentHearts = Math.round((player.permanentHearts + 0.5) * 10) / 10;

                msg = "🃏 POSMĚŠNÁ BALADA USPĚLA! Kejklíř složil jízlivou píseň o " + target.badge + " " + target.name + " (" + ch1 + " vs " + ch2 + "). Soupeř ztrácí -" + penalty + " 💖 a " + player.badge + " " + player.name + " získává +0,5 💖 dvorské přízně!";

                this.addLog(state, msg, "gold");

            } else {

                target.permanentHearts = Math.round((target.permanentHearts + 0.25) * 10) / 10;

                msg = "🃏 POSMĚŠNÁ BALADA SELHALA! " + target.badge + " " + target.name + " prokázal neochvějnou pověst (" + ch2 + " vs " + ch1 + ") a získává +0,25 💖 za dvorskou ctnost. " + player.badge + " " + player.name + " přišel o " + cost + " zl.";

                this.addLog(state, msg, "danger");

            }

            this.recalculateBreedingAndVictory(state);

            if (state.pendingAction) {
                state.pendingAction.canPlotIntrigue = false;
                state.pendingAction.intriguePlotted = true;
                state.pendingAction.intrigueSummary = isSuccess
                    ? ("Posměšná balada uspěla! Soupeř " + target.name + " ztratil -" + penalty + " 💖.")
                    : ("Posměšná balada selhala. Soupeř " + target.name + " získal +0,25 💖.");
            }

            return {
                type: "ballad",
                success: isSuccess,
                cost: cost,
                player: player,
                target: target,
                r1: r1,
                r2: r2,
                stat1: p1Stats.charisma || 0,
                stat2: p2Stats.charisma || 0,
                ch1: ch1,
                ch2: ch2,
                diff: Math.abs(ch1 - ch2),
                penalty: penalty,
                msg: msg
            };

        } else if (type === "customs") {

            var cCost = (state.pendingAction && state.pendingAction.intrigueCustomsCost) || Math.round(1200 * (rate > 0 ? rate : 0.5));

            if (player.gold < cCost) return null;

            player.gold -= cCost;

            target.frozenRentRounds = 1;

            var cMsg = "📜 KRÁLOVSKÝ CELNÍ DEKRET! " + player.badge + " " + player.name + " uplatnil královské pravomoci. Panství rytíře " + target.badge + " " + target.name + " podléhají po celé 1 kolo celní kontrole (žádný hráč mu neplatí nájem)!";

            this.addLog(state, cMsg, "gold");

            if (state.pendingAction) {
                state.pendingAction.canPlotIntrigue = false;
                state.pendingAction.intriguePlotted = true;
                state.pendingAction.intrigueSummary = "Celní kontrola uvalena na " + target.name + " (1 kolo bez nájmu).";
            }

            return {
                type: "customs",
                success: true,
                cost: cCost,
                player: player,
                target: target,
                msg: cMsg
            };

        }

        return null;

    },

    // 5. Obchodní pakt u Obchodníka nebo na STARTu,

    executeFormTradePact: function (state, partnerIndex) {

        var player = state.players[state.currentPlayerIndex];

        var partner = state.players[partnerIndex];

        if (!player || !partner || player.isEliminated || partner.isEliminated) return false;

        if (this.hasActiveTradePact(state, player.index, partner.index)) return false;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        var cost = Math.round(1500 * (rate > 0 ? rate : 0.5));

        if (player.gold < cost) return false;

        player.gold -= cost;

        var gift = Math.round(cost / 2);

        partner.gold += gift;

        if (!state.activePacts) state.activePacts = [];

        state.activePacts.push({

            p1: player.index,

            p2: partner.index,

            remainingRounds: 8

        });

        var msg = "🤝 OBCHODNÍ PAKT UZAVŘEN! " + player.badge + " " + player.name + " a " + partner.badge + " " + partner.name + " zpečetili bezcelní alianci na 8 kol (poplatek " + cost + " zl., spojenec obdržel dar +" + gift + " zl.)! Obě strany mají nulové mýtné a získávají dividendu +300 zl. při návštěvě.";

        this.addLog(state, msg, "gold");

        if (state.pendingAction) {

            state.pendingAction.canFormTradePact = false;

            state.pendingAction.summary = msg;

        }

        return true;

    },

    // 6. Osobní výzva na Slavnosti,

    executeFestivalChallenge: function (state, rivalIndex, discipline) {

        var player = state.players[state.currentPlayerIndex];

        var rival = state.players[rivalIndex];

        if (!player || !rival || player.isEliminated || rival.isEliminated) return null;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        var stake = Math.round(1500 * (rate > 0 ? rate : 0.5));

        this.breakTradePact(state, player.index, rival.index, "osobní výzva na slavnosti");

        var rawDisc = discipline || "combat";
        var discKey = (window.PRS_SKILLS && window.PRS_SKILLS.normalizeKey) ? window.PRS_SKILLS.normalizeKey(rawDisc) : rawDisc;

        var s1 = player.skills[discKey] || 0;

        var s2 = rival.skills[discKey] || 0;

        var r1 = Math.floor(Math.random() * 6) + 1;

        var r2 = Math.floor(Math.random() * 6) + 1;

        var tot1 = s1 + r1;

        var tot2 = s2 + r2;

        var result = {

            type: "festival_challenge",

            discipline: discKey,

            winnerIndex: null,

            p1: { index: player.index, name: player.name, badge: player.badge, color: player.color, roll: r1, stat: s1, total: tot1, type: player.type },

            p2: { index: rival.index, name: rival.name, badge: rival.badge, color: rival.color, roll: r2, stat: s2, total: tot2, type: rival.type },

            stake: stake,

            actualGold: 0,

            heartStake: 0.5,

            message: "",

            isDraw: false

        };

        var discName = (window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(discKey, true) : discKey;

        if (tot1 > tot2) {

            var actual = this.transferGold(state, rival, player, stake);

            player.permanentHearts += 0.5;

            result.winnerIndex = player.index;

            result.actualGold = actual;

            var winMsg = "🏆 OSOBNÍ VÝZVA NA SLAVNOSTI! " + player.badge + " " + player.name + " zvítězil nad " + rival.badge + " " + rival.name + " v disciplíně " + discName + " (" + tot1 + " vs " + tot2 + ")! Získává +" + actual + " zl. a +0,5 💖!";

            result.message = winMsg;

            this.addLog(state, winMsg, "victory", {
                key: "engine.duel_win_log",
                params: {
                    badge: player.badge,
                    player: player.name,
                    opponentBadge: target.badge,
                    opponent: target.name
                }
            });

        } else if (tot2 > tot1) {

            var actual2 = this.transferGold(state, player, rival, stake);

            rival.permanentHearts += 0.5;

            result.winnerIndex = rival.index;

            result.actualGold = actual2;

            var loseMsg = "🏆 OSOBNÍ VÝZVA NA SLAVNOSTI! " + rival.badge + " " + rival.name + " odrazil výzvu a zvítězil nad " + player.badge + " " + player.name + " v disciplíně " + discName + " (" + tot2 + " vs " + tot1 + ")! Poražený platí " + actual2 + " zl.!";

            result.message = loseMsg;

            this.addLog(state, loseMsg, "danger", {
                key: "engine.duel_loss_log",
                params: {
                    badge: player.badge,
                    player: player.name,
                    opponentBadge: target.badge,
                    opponent: target.name
                }
            });

        } else {

            result.isDraw = true;

            result.message = "Osobní výzva na slavnosti skončila nerozhodně.";

            this.addLog(state, "🏆 OSOBNÍ VÝZVA NA SLAVNOSTI skončila nerozhodně (" + tot1 + " vs " + tot2 + ").");

        }

        if (state.pendingAction) {

            state.pendingAction.canChallengeFestivalRival = false;

        }

        state.lastDuelResult = result;

        this.recalculateBreedingAndVictory(state);

        return result;

    },

    // Ukončení tahu a předání dalšímu hráči,

    executeBotTurn: function (state) {

        if (state.phase === "GAME_OVER") return;

        var bot = state.players[state.currentPlayerIndex];

        if (bot.type === "Human") return;

        // 0. Vyřešení dluhu, pokud nastala nucená královská dražba

        if (state.pendingAction && state.pendingAction.debt) {

            this.autoLiquidateDebt(state, bot);

            if (state.phase === "GAME_OVER") return;

        }

        // 1. Pokud jsme ve fázi hodu, hodíme kostkou

        if (state.phase === "ROLL") {

            var moveDecision = this.decideBotMovementMode ? this.decideBotMovementMode(state, bot) : { roll: null };

            this.rollAndMove(state, moveDecision.roll);

            if (state.phase === "GAME_OVER") return;

        }

        var pa = state.pendingAction;

        if (!pa) {

            this.endTurn(state);

            return;

        }

        // Pokud po hodu nastal dluh

        if (pa.debt) {

            this.autoLiquidateDebt(state, bot);

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

            var qTier = (pa.questCard && pa.questCard.questTier) || pa.questSubtype || "U1";

            // Dvořan a Panoš jsou opatrní u Draků (U3) a Netvorů (U2)
            if (qTier === "U3") {

                if (bot.type === "Bot_Noble" && effStats.combat < 13) shouldFight = false;

                if (bot.type === "Bot_Easy" && effStats.combat < 14) shouldFight = false;

                if (bot.type === "Bot_Breeder" && effStats.combat < 11) shouldFight = false;

            } else if (qTier === "U2") {

                if (bot.type === "Bot_Noble" && effStats.combat < 8) shouldFight = false;

                if (bot.type === "Bot_Breeder" && effStats.combat < 7) shouldFight = false;

            }

            if (shouldFight) {

                var botStance = "tactical";

                if (bot.type === "Bot_Aggressive") {

                    botStance = "aggressive";

                } else if (bot.type === "Bot_Noble" || bot.type === "Bot_Easy") {

                    botStance = (pa.questCard && pa.questCard.difficulty > effStats.combat + 6) ? "defensive" : "tactical";

                }

                this.resolveQuest(state, null, { stance: botStance });

                if (state.phase === "GAME_OVER") return;

            } else {

                // Taktický ústup z doupěte bez rizika Lazaretu
                if (this.retreatFromQuest) {

                    this.retreatFromQuest(state);

                } else if (window.PRS_GameEngine && window.PRS_GameEngine.retreatFromQuest) {

                    window.PRS_GameEngine.retreatFromQuest(state);

                } else {

                    pa.canResolveQuest = false;

                }

            }

        }

        // 3. Slavnost – optimalizace výstroje a spuštění

        if (pa.canResolveFestival) {

            var fType = pa.festivalType || "tournament";

            if (fType === "ball") {

                // Obléknout šaty a klenot

                for (var itP = 0; itP < bot.items.length; itP++) {

                    if (bot.items[itP].slot === "dress" || bot.items[itP].slot === "jewel") {

                        bot.items[itP].isEquipped = true;

                    }

                }

            } else if (fType === "tournament") {

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

                        neededReserve = (targetNode.subtype === "horse") ? 400 : 700;

                    }

                }

                // ŠLECHTA & MAGNÁTI: Absolutní priorita pro Města, Hrady a Vesnice
                else if (targetNode.type === "CASTLE" || targetNode.type === "TOWN" || targetNode.type === "VILLAGE") {
                    var scn = (state.config && state.config.scenario) ? state.config.scenario : "classic";
                    if (scn === "tycoon") neededReserve = 100;
                    else if (bot.type === "Bot_Noble") neededReserve = 200;
                    else if (bot.type === "Bot_Aggressive") neededReserve = 350;
                    else neededReserve = 500;
                }

                // Řemeslné budovy

                else if (targetNode.type === "BUILDING") {

                    if (bot.type === "Bot_Breeder" && (targetNode.subtype === "stables" || targetNode.subtype === "doghandler" || targetNode.subtype === "falconer")) {

                        neededReserve = 300;

                    } else if (bot.type === "Bot_Aggressive" && targetNode.subtype === "forge") {

                        neededReserve = 300;

                    } else if (bot.type === "Bot_Noble" && targetNode.subtype === "tailor") {

                        neededReserve = 300;

                    }

                }

            }

            if (bot.gold - pa.buyPrice >= neededReserve) {

                this.buyCurrentNode(state);

            }

        }

        // 5. Vylepšování vesnic (při dopadu na pole i z celého rytířského portfolia)
        if (pa.canUpgradeVillage) {
            var upgRes = (scen === "tycoon") ? 300 : (bot.type === "Bot_Breeder" ? 400 : reserveGold);
            if (bot.gold - pa.upgradeCost >= upgRes) {
                this.upgradeVillage(state, pa.nodeId);
            }
        }
        // 5b. Průběžná správa a povyšování vlastněných vesnic na Města (2★) a Hrady (3★)
        if (bot.ownedNodes && bot.ownedNodes.length > 0) {
            var scen = (state.config && state.config.scenario) ? state.config.scenario : "classic";
            var minSpare = (scen === "tycoon") ? 400 : (bot.type === "Bot_Breeder" ? 600 : 2500);
            for (var vi = 0; vi < bot.ownedNodes.length; vi++) {
                var vId = bot.ownedNodes[vi];
                var vNd = state.board.nodes[vId];
                if (vNd && vNd.type === "VILLAGE" && (vNd.villageLevel || 1) < 3) {
                    var uPrices = (state.config.estates && state.config.estates.villagePrices) || [2000, 1500, 3000];
                    var uC = uPrices[vNd.villageLevel || 1] || 1500;
                    if (bot.gold - uC >= minSpare) {
                        this.upgradeVillage(state, vId);
                        if (state.phase === "GAME_OVER") return;
                    }
                }
            }
        }

        // 6. Trénink u Mistra podle archetypu

        if (pa.canTrainMaster) {

            var chosenSkill = pa.skill;

            if (chosenSkill === "any") {

                if (bot.type === "Bot_Aggressive") {

                    chosenSkill = (bot.skills.combat < 5) ? "combat" : ((bot.skills.riding < 5) ? "riding" : "charisma");

                } else if (bot.type === "Bot_Breeder") {

                    chosenSkill = (bot.skills.riding < 5) ? "riding" : ((bot.skills.combat < 5) ? "combat" : "dance");

                } else if (bot.type === "Bot_Noble") {

                    chosenSkill = (bot.skills.charisma < 5) ? "charisma" : ((bot.skills.dance < 5) ? "dance" : "riding");

                } else if (bot.type === "Bot_Balanced") {

                    var sks = ["combat", "riding", "dance", "charisma"];

                    sks.sort(function (a, b) { return bot.skills[a] - bot.skills[b]; });

                    chosenSkill = sks[0];

                } else {

                    chosenSkill = (bot.skills.charisma < 3) ? "charisma" : "combat";

                }

            }

            var lvl = bot.skills[chosenSkill] || 0;

            var trainCost = state.config.masterCosts[lvl] || 5000;

            var canAffordTrain = (lvl < 5 && bot.gold - trainCost >= reserveGold * 0.4);

            if (canAffordTrain) {

                this.trainAtMaster(state, chosenSkill);

            }

        }

        // 7. Obchodník – nákup cílené výbavy podle archetypu nebo balíčků
        if (pa.canShopMerchant) {

            var packs = (state.config && state.config.itemPackPrices) || { tier1: 2500, tier2: 7000, tier3: 12000 };

            var canSpecific = (typeof this.buySpecificItem === "function" && window.PRS_ITEMS);

            if (bot.type === "Bot_Aggressive") {

                if (canSpecific && bot.gold >= 10000 + 400 && !bot.items.some(function (it) { return it.id === "it3_1"; })) {
                    this.buySpecificItem(state, "it3_1");
                } else if (canSpecific && bot.gold >= 8500 + 400 && !bot.items.some(function (it) { return it.id === "it3_2"; })) {
                    this.buySpecificItem(state, "it3_2");
                } else if (canSpecific && bot.gold >= 7000 + 400 && !bot.items.some(function (it) { return it.id === "it2_1"; })) {
                    this.buySpecificItem(state, "it2_1");
                } else if (canSpecific && bot.gold >= 2500 + 400 && !bot.items.some(function (it) { return it.id === "it1_2"; })) {
                    this.buySpecificItem(state, "it1_2");
                } else if (bot.gold - packs.tier3 >= 400 && bot.items.length < 5) {
                    this.buyItemPack(state, 3);
                } else if (bot.gold - packs.tier2 >= 400 && bot.items.length < 4) {
                    this.buyItemPack(state, 2);
                }

            } else if (bot.type === "Bot_Noble") {

                if (canSpecific && bot.gold >= 12000 + 600 && !bot.items.some(function (it) { return it.id === "it3_3"; })) {
                    this.buySpecificItem(state, "it3_3");
                } else if (canSpecific && bot.gold >= 7000 + 600 && !bot.items.some(function (it) { return it.id === "it2_5"; })) {
                    this.buySpecificItem(state, "it2_5");
                } else if (canSpecific && bot.gold >= 3000 + 600 && !bot.items.some(function (it) { return it.id === "it1_6"; })) {
                    this.buySpecificItem(state, "it1_6");
                } else if (bot.gold - packs.tier3 >= 600 && bot.items.length < 5) {
                    this.buyItemPack(state, 3);
                } else if (bot.gold - packs.tier2 >= 600 && bot.items.length < 4) {
                    this.buyItemPack(state, 2);
                }

            } else if (bot.type === "Bot_Breeder") {

                if (canSpecific && bot.gold >= 10000 + 1500 && !bot.items.some(function (it) { return it.id === "it3_5"; })) {
                    this.buySpecificItem(state, "it3_5");
                } else if (canSpecific && bot.gold >= 7500 + 1500 && !bot.items.some(function (it) { return it.id === "it2_2"; })) {
                    this.buySpecificItem(state, "it2_2");
                } else if (canSpecific && bot.gold >= 2500 + 1500 && !bot.items.some(function (it) { return it.id === "it1_8"; })) {
                    this.buySpecificItem(state, "it1_8");
                } else if (bot.gold - packs.tier2 >= 2000 && bot.items.length < 3) {
                    this.buyItemPack(state, 2);
                }

            } else {

                if (bot.gold - packs.tier3 >= reserveGold && bot.items.length < 5) this.buyItemPack(state, 3);

                else if (bot.gold - packs.tier2 >= reserveGold && bot.items.length < 4) this.buyItemPack(state, 2);

                else if (bot.gold - packs.tier1 >= reserveGold && bot.items.length < 2) this.buyItemPack(state, 1);

            }

        }

        // 7b. Dobytčí trh & Pastviny (nákup skotu, prasat a ovcí u Obchodníka nebo ve Stájích)
        if ((pa.canShopLivestock || pa.canShopMerchant) && this.buyLivestock) {
            var lsSt = this.getEffectiveStats(state, bot);
            var lsCfg = (state.config && state.config.livestock) ? state.config.livestock : {};
            var cPrice = Number(lsCfg.cattlePrice) || 800;
            var pPrice = Number(lsCfg.pigsPrice) || 600;
            var sPrice = Number(lsCfg.sheepPrice) || 500;
            var minKeep = (bot.type === "Bot_Breeder" || bot.type === "Bot_Noble") ? Math.round(reserveGold * 0.4) : reserveGold;
            var maxBuysThisTurn = (bot.type === "Bot_Breeder") ? 3 : 2;
            var boughtCnt = 0;
            while (lsSt.extraLivestockCount < lsSt.livestockCapacity && boughtCnt < maxBuysThisTurn) {
                var chosenLs = null;
                if (bot.gold - cPrice >= minKeep) chosenLs = "cattle";
                else if (bot.gold - pPrice >= minKeep) chosenLs = "pigs";
                else if (bot.gold - sPrice >= minKeep) chosenLs = "sheep";
                if (!chosenLs) break;
                var buyRes = this.buyLivestock(state, bot.index, chosenLs);
                if (!buyRes || !buyRes.ok) break;
                boughtCnt++;
                lsSt = this.getEffectiveStats(state, bot);
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

        // 11. Šlechtický výkup ze sady pro bota (Priorita: gain +1.0 💖)

        if (pa.canBuyoutAnimalSet && pa.buyoutCandidates && pa.buyoutCandidates.length > 0) {

            for (var bci = 0; bci < pa.buyoutCandidates.length; bci++) {

                var bc = pa.buyoutCandidates[bci];

                if (bot.gold >= bc.buyoutPrice + reserveGold) {

                    this.executeAnimalBuyout(state, bc.nodeId);

                    break;

                }

            }

        }

        // 12. Setkání na poli pro bota (Duel vs Přípitek)

        if (pa.encounterPlayer) {

            if (pa.canDuelPlayer && (bot.type === "Bot_Aggressive" || state.config.difficultyMode === "hard" || state.config.difficultyMode === "ultimate")) {

                this.executePlayerDuel(state, pa.encounterPlayer.index);

            } else if (pa.canToastPlayer && bot.gold >= pa.encounterPlayer.toastCost + reserveGold) {

                this.executePlayerToast(state, pa.encounterPlayer.index);

            }

        }

        // 13. Dvorní intriky pro bota (útočí na lídra v Srdcích)

        if (pa.canPlotIntrigue && bot.gold >= pa.intrigueBalladCost + reserveGold) {

            var leadRival = null;

            var maxHearts = bot.totalHearts;

            for (var ri = 0; ri < state.players.length; ri++) {

                var rp = state.players[ri];

                if (rp.index !== bot.index && !rp.isEliminated && rp.totalHearts > maxHearts) {

                    maxHearts = rp.totalHearts;

                    leadRival = rp;

                }

            }

            if (leadRival && (leadRival.totalHearts >= bot.totalHearts + 1.5)) {

                this.executePlotIntrigue(state, "ballad", leadRival.index);

            }

        }

        // 14. Obchodní pakt pro bota (Chovatel a Šlechtic hledají spojence)

        if (pa.canFormTradePact && (bot.type === "Bot_Breeder" || bot.type === "Bot_Noble") && bot.gold >= pa.tradePactCost + reserveGold) {

            var bestPartner = null;

            var maxEstates = 0;

            for (var pi = 0; pi < state.players.length; pi++) {

                var pp = state.players[pi];

                if (pp.index !== bot.index && !pp.isEliminated && !this.hasActiveTradePact(state, bot.index, pp.index)) {

                    var estCount = pp.ownedNodes ? pp.ownedNodes.length : 0;

                    if (estCount > maxEstates) {

                        maxEstates = estCount;

                        bestPartner = pp;

                    }

                }

            }

            if (bestPartner && maxEstates >= 2) {

                this.executeFormTradePact(state, bestPartner.index);

            }

        }

        // 15. Konec tahu bota

        this.endTurn(state);

    },

    // ========================================================================

    // HEADLESS SIMULÁTOR EKONOMIKY (Spustí N celých her během zlomku vteřiny)

    // ========================================================================,

    simulateGames: function (numGames, configOverride, boardCode, simOptions) {

        numGames = Math.min(200, Math.max(1, Number(numGames) || 25));

        if (typeof configOverride === "string") {

            var tmp = boardCode;

            boardCode = configOverride;

            configOverride = tmp;

        }

        simOptions = simOptions || {};

        var baseConfig = window.PRS_DEFAULT_CONFIG || {};

        var cfg = this.deepClone(baseConfig);

        if (configOverride && typeof configOverride === "object") {

            for (var k in configOverride) {

                if (configOverride.hasOwnProperty(k)) cfg[k] = configOverride[k];

            }

        }

        if (simOptions.scenario) cfg.scenario = simOptions.scenario;

        if (simOptions.difficultyMode) cfg.difficultyMode = simOptions.difficultyMode;

        var bCode = boardCode || "classic_96";

        var playerCount = Math.min(6, Math.max(2, Number(simOptions.playerCount) || 4));

        var allBotPool = [
            { name: "Válečník Bořivoj", type: "Bot_Aggressive" },
            { name: "Chovatel Zikmund", type: "Bot_Breeder" },
            { name: "Kněžna Eliška", type: "Bot_Noble" },
            { name: "Rytíř Vladislav", type: "Bot_Balanced" },
            { name: "Opatrný Panoš", type: "Bot_Easy" },
            { name: "Černý Baron", type: "Bot_Aggressive" }
        ];

        var simPlayers = allBotPool.slice(0, playerCount);

        var totalRounds = 0;

        var totalTurns = 0;

        var maxRoundsSafety = 160;

        var winsByType = { Bot_Aggressive: 0, Bot_Breeder: 0, Bot_Noble: 0, Bot_Balanced: 0, Bot_Easy: 0 };

        var heartBreakdown = { festivals: 0, quests: 0, chance: 0, breeding: 0 };

        var avgWinnerGold = 0;
        var avgWinnerNetWorth = 0;
        var avgTaxesCollected = 0;
        var avgRentCollected = 0;
        var avgWinnerVillages = 0;
        var avgWinnerTowns = 0;
        var avgWinnerCastles = 0;
        var avgWinnerLivestock = 0;
        var avgDragonsSlain = 0;
        var avgEliminations = 0;

        var sampleLogs = [];

        for (var g = 0; g < numGames; g++) {

            var simState = this.createGame({

                config: cfg,

                boardCode: bCode,

                scenario: cfg.scenario || "standard",

                difficultyMode: cfg.difficultyMode || "normal",

                players: simPlayers

            });

            var guard = 0;

            while (simState.phase !== "GAME_OVER" && simState.roundNumber <= maxRoundsSafety && guard < 1600) {

                this.executeBotTurn(simState);

                guard++;

            }

            var winIdx = (simState.winnerIndex !== null) ? simState.winnerIndex : 0;

            var winner = simState.players[winIdx];

            var winStats = this.getEffectiveStats(simState, winner);

            totalRounds += simState.roundNumber;

            totalTurns += simState.turnNumber;

            winsByType[winner.type] = (winsByType[winner.type] || 0) + 1;

            avgWinnerGold += winner.gold;

            var netW = winner.gold;
            for (var ni = 0; ni < (winner.ownedNodes || []).length; ni++) {
                var nd = simState.board.nodes[winner.ownedNodes[ni]];
                if (nd) netW += this.getNodeInvestedValue(simState, nd);
            }
            for (var ii = 0; ii < (winner.items || []).length; ii++) {
                netW += (winner.items[ii].price || 0);
            }
            avgWinnerNetWorth += netW;

            avgTaxesCollected += (winner.stats.taxesCollected || 0);
            avgRentCollected += (winner.stats.rentCollected || 0);
            avgWinnerVillages += (winStats.ownedVillages || 0);
            avgWinnerTowns += (winStats.ownedTowns || 0);
            avgWinnerCastles += (winStats.ownedCastles || 0);
            avgWinnerLivestock += (winStats.extraLivestockCount || 0);
            avgDragonsSlain += (winner.stats.dragonsSlain || 0);

            var elimCnt = 0;
            for (var ei = 0; ei < simState.players.length; ei++) {
                if (simState.players[ei].isEliminated) elimCnt++;
            }
            avgEliminations += elimCnt;

            heartBreakdown.festivals += (winner.stats.heartsFromFestivals || 0);

            heartBreakdown.quests += (winner.stats.heartsFromQuests || 0);

            heartBreakdown.chance += (winner.stats.heartsFromChance || 0);

            heartBreakdown.breeding += (winner.breedingHearts || 0) + (winner.setHeartsBonus || 0);

            if (g === 0) {

                sampleLogs = simState.logs.slice(0, 15);

            }

        }

        var avgRounds = Math.round((totalRounds / numGames) * 10) / 10;

        var avgTurns = Math.round(totalTurns / numGames);

        // Odhad stolní doby podle počtu hráčů (cca 0.4 min na tah u stolu)
        var estTabletopMinutes = Math.round(avgTurns * 0.4);

        return {

            gamesSimulated: numGames,

            boardCode: bCode,

            scenario: cfg.scenario || "standard",

            difficultyMode: cfg.difficultyMode || "normal",

            playerCount: playerCount,

            targetHearts: cfg.targetHearts,

            avgRounds: avgRounds,

            avgTurns: avgTurns,

            estTabletopMinutes: estTabletopMinutes,

            estTabletopHoursText: Math.floor(estTabletopMinutes / 60) + " h " + (estTabletopMinutes % 60) + " min",

            avgWinnerGold: Math.round(avgWinnerGold / numGames),

            avgWinnerNetWorth: Math.round(avgWinnerNetWorth / numGames),

            avgTaxesCollected: Math.round(avgTaxesCollected / numGames),

            avgRentCollected: Math.round(avgRentCollected / numGames),

            avgWinnerVillages: Math.round((avgWinnerVillages / numGames) * 10) / 10,

            avgWinnerTowns: Math.round((avgWinnerTowns / numGames) * 10) / 10,

            avgWinnerCastles: Math.round((avgWinnerCastles / numGames) * 10) / 10,

            avgWinnerLivestock: Math.round((avgWinnerLivestock / numGames) * 10) / 10,

            avgDragonsSlain: Math.round((avgDragonsSlain / numGames) * 10) / 10,

            avgEliminations: Math.round((avgEliminations / numGames) * 10) / 10,

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
    });
})();
