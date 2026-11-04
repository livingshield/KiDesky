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

            if (targetNode.ownerIndex === null || targetNode.ownerIndex === undefined) {

                var price = this.getNodePrice(targetNode);

                if (player.gold >= price) {

                    score += (targetNode.type === "CASTLE" ? 30 : 20);

                    if (pType === "Bot_Noble") score += 10;

                    if (pType === "Bot_Breeder") score += 5;

                } else {

                    score += 5;

                }

            } else if (targetNode.ownerIndex === player.index) {

                score += 10;

            } else {

                var rent = this.computeNodeRent ? this.computeNodeRent(state, targetNode) : (targetNode.baseRent || 500);

                score -= Math.min(40, Math.floor(rent / 150));

            }

        } else if (targetNode.type === "ANIMAL") {

            if (targetNode.ownerIndex === null || targetNode.ownerIndex === undefined) {

                var aPrice = targetNode.buyPrice || 1000;

                if (player.gold >= aPrice) {

                    score += 18;

                    if (pType === "Bot_Breeder") score += 15;

                } else {

                    score += 4;

                }

            } else if (targetNode.ownerIndex === player.index) {

                score += 8;

            } else {

                score -= 10;

            }

        } else if (targetNode.type === "FESTIVAL") {

            score += 22;

            if (pType === "Bot_Noble") score += 15;

        } else if (targetNode.type === "QUEST") {

            var subtype = targetNode.subtype || "U1";

            if (subtype === "U3") {

                if (effStats.boj >= 14 && player.hp >= 3) {

                    score += (pType === "Bot_Aggressive" ? 35 : 15);

                } else {

                    score -= 40;

                }

            } else if (subtype === "U2") {

                if (effStats.boj >= 8 && player.hp >= 2) {

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

            var sprint = d1 + d2;

            var options = [sprint, d1, d2];

            var bestRoll = d1;

            var bestScore = -999;

            for (var i = 0; i < options.length; i++) {

                var rCandidate = options[i];

                var tNode = this.getTargetNodeForRoll(state, bot, rCandidate);

                var sc = this.scoreNodeForPlayer(state, bot, tNode);

                if (sc > bestScore) {

                    bestScore = sc;

                    bestRoll = rCandidate;

                }

            }

            rollResult = bestRoll;

            chosenMode = "horse";

            this.addLog(state, "🏇 " + bot.badge + " " + bot.name + " využívá koňského cvalu (kostky " + d1 + " a " + d2 + ") a volí skok o " + rollResult + " polí!");

        }

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

            if (stats.horses > 0 || tactics.charge || stats.jizda >= 2) {

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

            if ((stats.horses > 0 || stats.dogs > 0) && (hasSpear || stats.boj >= 4)) {

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

            if (stats.boj >= 3 && stats.jizda >= 2) {

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

            if (fireIt || curTheme === "fire" || stats.boj >= 4) {

                return { exploited: true, reason: "Žhavé plameny a sopečný žár roztavily ledový krunýř" };

            }

        } else if (w === "ice") {

            var iceIt = hasItemMatching(function (it) {

                return it.id === "trophy_ice" || /led|mraz|rampouch/i.test(it.name);

            });

            var curTheme2 = (state && state.config && state.config.elementTheme) || (state && state.currentTheme);

            if (iceIt || curTheme2 === "water" || stats.boj >= 4) {

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

            if (stats.tanec >= 2 || stats.hasDress) {

                return { exploited: true, reason: "Půvabný taneční krok a dvorský šat okouzlily hravého draka" };

            }

        } else if (w === "charisma") {

            if (stats.charisma >= 3 || stats.hasJewel) {

                return { exploited: true, reason: "Vznešené charisma rytíře dojalo drahokamového draka" };

            }

        }

        // 6. Odvaha, Světlo, Svaté relikvie, Mistrovství

        else if (w === "courage") {

            if (stats.boj >= 3 || stats.jizda >= 3) {

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

            if (stats.boj >= 2 && stats.jizda >= 2 && stats.tanec >= 2 && stats.charisma >= 2) {

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

        var horseBonus = (q.questTier !== "U1" && stats.horses > 0) ? (1 + Math.floor(stats.jizda / 2)) : 0;

        var wRes = this.checkQuestWeakness(state, player, q, tactics);

        var weaknessBonus = wRes.exploited ? 2 : 0;

        var totalPower = roll + stats.boj + animalBonus + horseBonus + tacticBonus + weaknessBonus + stanceBonus;

        pa.canResolveQuest = false;

        var won = totalPower >= q.difficulty;

        var trophyItemWon = null;

        var lootWon = null;

        var preventedHospital = false;

        if (won) {

            player.gold += q.gold;

            player.permanentHearts += q.hearts;

            player.stats.questsWon++;

            player.stats.heartsFromQuests += q.hearts;

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

                    trophyItemWon = trophyItem;

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

                    lootWon = loot;

                    rewardMsg += " Kořist: **" + loot.icon + " " + loot.name + "**!";

                }

            }

            pa.summary = rewardMsg;

            this.addLog(state, rewardMsg, "quest_win");

        } else {

            player.stats.questsLost++;

            // Kontrola taktického Rerollu (při taktickém postoji, prohře o 1-2 body a přítomnosti psa/sokola či Boj >= 2)

            var canReroll = (stance === "tactical" && (q.difficulty - totalPower <= 2) && (stats.dogs > 0 || stats.falcons > 0 || stats.boj >= 2));

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

                this.addLog(state, defLossMsg, "quest_loss");

            } else if (tactics.elixir) {

                // Pojistka lektvarem z Lazaretu - hráč neutrpí těžké zranění

                var elixCost = Math.min(player.gold, 500);

                player.gold -= elixCost;

                preventedHospital = true;

                var elixLossMsg = "🧪 Záchrana hojivým lektvarem! " + player.badge + " " + player.name + " podlehl bestii **" + q.name + "** (Síla " + totalPower + " vs. " + q.difficulty + "), ale díky lektvaru (" + elixCost + " zl.) neutrpěl těžká zranění a nemusí do Špitálu!";

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

            canTacticalReroll: (stance === "tactical" && !won && (q.difficulty - totalPower <= 2) && (stats.dogs > 0 || stats.falcons > 0 || stats.boj >= 2))

        };

    },

    // Vyhodnocení SLAVNOSTI (Turnaj, Ples, Závod) podle vzorců z rukopisů IMG_4596 a IMG_4597,

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

        var power1 = p1Stats.boj + r1;

        var power2 = p2Stats.boj + r2;

        var isUltimate = (state.config.difficultyMode === "ultimate");

        var result = {

            type: "field_duel",

            winnerIndex: null,

            p1: { index: player.index, name: player.name, badge: player.badge, color: player.color, roll: r1, combat: p1Stats.boj, total: power1, type: player.type },

            p2: { index: target.index, name: target.name, badge: target.badge, color: target.color, roll: r2, combat: p2Stats.boj, total: power2, type: target.type },

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

                target.permanentHearts = Math.max(0, target.permanentHearts - heartStake);

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

            this.addLog(state, winMsg, "victory");

        } else if (power2 > power1) {

            result.winnerIndex = target.index;

            var actualGold2 = this.transferGold(state, player, target, stake);

            result.actualGold = actualGold2;

            target.permanentHearts += heartStake;

            if (state.config.difficultyMode !== "easy" && state.config.difficultyMode !== "standard") {

                player.permanentHearts = Math.max(0, player.permanentHearts - heartStake);

            }

            var loseMsg = "⚔️ DUEL NA POLI! " + target.badge + " " + target.name + " (" + power2 + ") odrazil výzvu a porazil útočníka " + player.badge + " " + player.name + " (" + power1 + ")! Poražený odevzdává " + actualGold2 + " zl.!";

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

            this.addLog(state, loseMsg, "danger");

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

        player.permanentHearts += 0.5;

        player.lastToastRound = state.roundNumber;

        var msg = "🍷 PŘÁTELSKÝ PŘÍPITEK! " + player.badge + " " + player.name + " pozval rytíře " + target.badge + " " + target.name + " na číši burgundského vína (-" + cost + " zl.). Za dvorskou štědrost a noblesu získává **+0,5 💖**!";

        this.addLog(state, msg, "gold");

        if (state.pendingAction) {

            state.pendingAction.canDuelPlayer = false;

            state.pendingAction.canToastPlayer = false;

            state.pendingAction.summary = msg;

        }

        this.recalculateBreedingAndVictory(state);

        return true;

    },

    // 3. Šlechtický výkup ze sady (Královské předkupní právo),

    executeAnimalBuyout: function (state, targetNodeId) {

        var player = state.players[state.currentPlayerIndex];

        var targetNode = state.board.nodes[targetNodeId];

        if (!player || !targetNode || targetNode.type !== "ANIMAL" || targetNode.owner === null || targetNode.owner === player.index) {

            return false;

        }

        var targetOwner = state.players[targetNode.owner];

        var origPrice = this.getNodePrice(state, targetNode);

        var buyoutPrice = origPrice * 2;

        if (player.gold < buyoutPrice) return false;

        player.gold -= buyoutPrice;

        targetOwner.gold += buyoutPrice;

        var oIdx = targetOwner.ownedNodes.indexOf(targetNode.id);

        if (oIdx !== -1) targetOwner.ownedNodes.splice(oIdx, 1);

        player.ownedNodes.push(targetNode.id);

        targetNode.owner = player.index;

        var msg = "📜 KRÁLOVSKÉ PŘEDKUPNÍ PRÁVO! " + player.badge + " " + player.name + " vykoupil " + targetNode.icon + " **" + targetNode.name + "** od " + targetOwner.badge + " " + targetOwner.name + " za dvojnásobek (" + buyoutPrice + " zl.) a zkompletoval sadu #" + targetNode.setId + " (+1,0 💖)!";

        this.addLog(state, msg, "victory");

        if (state.pendingAction) {

            state.pendingAction.canBuyoutAnimalSet = false;

            state.pendingAction.summary = msg;

        }

        this.recalculateBreedingAndVictory(state);

        return true;

    },

    // 4. Dvorní intrika u Kejklíře nebo v Krčmě,

    executePlotIntrigue: function (state, type, targetPlayerIndex) {

        var player = state.players[state.currentPlayerIndex];

        var target = state.players[targetPlayerIndex];

        if (!player || !target || player.isEliminated || target.isEliminated) return null;

        var rate = (state.config && state.config.interactionRate !== undefined) ? state.config.interactionRate : 0.5;

        this.breakTradePact(state, player.index, target.index, "dvorní intrika");

        if (type === "ballad") {

            var cost = Math.round(1500 * (rate > 0 ? rate : 0.5));

            if (player.gold < cost) return null;

            player.gold -= cost;

            var p1Stats = this.getEffectiveStats(state, player);

            var p2Stats = this.getEffectiveStats(state, target);

            var r1 = Math.floor(Math.random() * 6) + 1;

            var r2 = Math.floor(Math.random() * 6) + 1;

            var ch1 = p1Stats.charisma + r1;

            var ch2 = p2Stats.charisma + r2;

            if (ch1 > ch2) {

                var penalty = (state.config.difficultyMode === "hard" || state.config.difficultyMode === "ultimate") ? 1.0 : 0.5;

                target.permanentHearts = Math.max(0, target.permanentHearts - penalty);

                player.permanentHearts += 0.5;

                var msg = "🃏 POSMĚŠNÁ BALADA USPĚLA! Kejklíř složil jízlivou píseň o " + target.badge + " " + target.name + ". Soupeř ztrácí -" + penalty + " 💖 a " + player.badge + " " + player.name + " získává +0,5 💖 dvorské přízně!";

                this.addLog(state, msg, "gold");

                this.recalculateBreedingAndVictory(state);

                return { success: true, diff: ch1 - ch2 };

            } else {

                target.permanentHearts += 0.25;

                var failMsg = "🃏 POSMĚŠNÁ BALADA SELHALA! " + target.badge + " " + target.name + " prokázal neochvějnou pověst a získává +0,25 💖 za dvorskou ctnost. " + player.badge + " " + player.name + " přišel o " + cost + " zl.";

                this.addLog(state, failMsg, "danger");

                this.recalculateBreedingAndVictory(state);

                return { success: false, diff: ch2 - ch1 };

            }

        } else if (type === "customs") {

            var cCost = Math.round(1200 * (rate > 0 ? rate : 0.5));

            if (player.gold < cCost) return null;

            player.gold -= cCost;

            target.frozenRentRounds = 1;

            var cMsg = "📜 KRÁLOVSKÝ CELNÍ DEKRET! " + player.badge + " " + player.name + " uplatnil královské pravomoci. Panství rytíře " + target.badge + " " + target.name + " podléhají po celé 1 kolo celní kontrole (žádný hráč mu neplatí nájem)!";

            this.addLog(state, cMsg, "gold");

            return { success: true };

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

        var discKey = discipline || "boj";

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

        if (tot1 > tot2) {

            var actual = this.transferGold(state, rival, player, stake);

            player.permanentHearts += 0.5;

            result.winnerIndex = player.index;

            result.actualGold = actual;

            var winMsg = "🏆 OSOBNÍ VÝZVA NA SLAVNOSTI! " + player.badge + " " + player.name + " zvítězil nad " + rival.badge + " " + rival.name + " v disciplíně " + discKey.toUpperCase() + " (" + tot1 + " vs " + tot2 + ")! Získává +" + actual + " zl. a +0,5 💖!";

            result.message = winMsg;

            this.addLog(state, winMsg, "victory");

        } else if (tot2 > tot1) {

            var actual2 = this.transferGold(state, player, rival, stake);

            rival.permanentHearts += 0.5;

            result.winnerIndex = rival.index;

            result.actualGold = actual2;

            var loseMsg = "🏆 OSOBNÍ VÝZVA NA SLAVNOSTI! " + rival.badge + " " + rival.name + " odrazil výzvu a zvítězil nad " + player.badge + " " + player.name + " v disciplíně " + discKey.toUpperCase() + " (" + tot2 + " vs " + tot1 + ")! Poražený platí " + actual2 + " zl.!";

            result.message = loseMsg;

            this.addLog(state, loseMsg, "danger");

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

            this.autoLiquidateDebt(state);

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

                var botStance = "tactical";

                if (bot.type === "Bot_Aggressive") {

                    botStance = "aggressive";

                } else if (bot.type === "Bot_Noble" || bot.type === "Bot_Easy") {

                    botStance = (pa.questCard && pa.questCard.difficulty > effStats.boj + 6) ? "defensive" : "tactical";

                }

                this.resolveQuest(state, null, { stance: botStance });

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

            var packs = (state.config && state.config.itemPackPrices) || { tier1: 2500, tier2: 7000, tier3: 12000 };

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

    simulateGames: function (numGames, configOverride, boardCode) {

        numGames = Math.min(200, Math.max(1, Number(numGames) || 25));

        if (typeof configOverride === "string") {

            var tmp = boardCode;

            boardCode = configOverride;

            configOverride = tmp;

        }

        var baseConfig = window.PRS_DEFAULT_CONFIG || {};

        var cfg = this.deepClone(baseConfig);

        if (configOverride && typeof configOverride === "object") {

            for (var k in configOverride) {

                if (configOverride.hasOwnProperty(k)) cfg[k] = configOverride[k];

            }

        }

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
    });
})();
