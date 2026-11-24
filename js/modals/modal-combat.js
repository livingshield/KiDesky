// ============================================================================
// KiDesky: Princeznino srdce - Soubojová aréna nestvůr, Duely rytířů, Intriky a Obchodní pakty
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
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

        var finalizedRerollLoss = false;

        if (this.state && this.state.pendingAction && this.state.pendingAction.canTacticalReroll && window.PRS_GameEngine && window.PRS_GameEngine.finalizeQuestLoss) {

            window.PRS_GameEngine.finalizeQuestLoss(this.state);

            finalizedRerollLoss = true;

        }

        var modal = document.getElementById("quest-duel-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

        if (finalizedRerollLoss) {

            this.renderGameScreen();

            this.saveSessionAuto();

        }

    },

    declineTacticalReroll: function () {

        this.closeQuestDuelModal();

    },

    _notifyQuestDuelOutcome: function (res) {

        if (res && res.won) {

            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            if (this.showPawnToast && this.state) {

                var curr = window.PRS_I18n ? window.PRS_I18n.t("ui.currency", null, "zl.") : "zl.";

                var toastTxt = "+" + (window.PRS_I18n ? window.PRS_I18n.formatGold(res.goldWon) : (res.goldWon.toLocaleString("cs-CZ") + " zl.")) + (res.heartsWon > 0 ? (" | +" + res.heartsWon + " 💖") : "") + (res.trophyWon ? (" | 🏆 " + res.trophyWon.icon) : "");

                this.showPawnToast(this.state.currentPlayerIndex, toastTxt, "🏆", "#86efac");

            }

        } else {

            if (window.PRS_Audio) window.PRS_Audio.playOminous();

        }

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

        var horseBonus = (q.questTier !== "U1" && hasHorse) ? (1 + Math.floor(stats.riding / 2)) : 0;

        var wRes = window.PRS_GameEngine.checkQuestWeakness(this.state, player, q, tacticObj);

        var weaknessBonus = wRes.exploited ? 2 : 0;

        var stanceBonus = 0;

        if (this.selectedDuelStance === "aggressive") stanceBonus = 2;

        else if (this.selectedDuelStance === "defensive") stanceBonus = -1;

        var basePower = stats.combat + animalBonus + horseBonus + tacticBonus + weaknessBonus + stanceBonus;

        var neededRoll = q.difficulty - basePower;

        var winCount = 0;

        for (var d = 1; d <= 6; d++) {

            if (basePower + d >= q.difficulty) winCount++;

        }

        var winRate = Math.round((winCount / 6) * 100);

        var qImgRaw = q.img || "assets/landmarks/dragon.webp";
        var qImg = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(qImgRaw) : qImgRaw;

        var tQd = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
        var tierTitle = (q.questTier === "U3")
            ? tQd("modals.quest_duel.tier_u3", null, "Dračí doupě")
            : (q.questTier === "U2"
                ? tQd("modals.quest_duel.tier_u2", null, "Temné monstrum")
                : tQd("modals.quest_duel.tier_u1", null, "Divoká zvěř"));

        var tierColor = (q.questTier === "U3") ? "#ef4444" : (q.questTier === "U2" ? "#f59e0b" : "#10b981");

        var wDefaults = {
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

        var wDef = wDefaults[q.weakness];
        var weaknessText = wDef
            ? tQd("modals.quest_duel.w_" + q.weakness, null, wDef)
            : tQd("modals.quest_duel.w_default", null, "Tato bestie vyžaduje odvahu a pevnou ruku.");

        var trophyHtml = "";

        if (q.trophyId && window.PRS_TROPHIES && window.PRS_TROPHIES[q.trophyId]) {

            var tr = window.PRS_TROPHIES[q.trophyId];

            var trBonuses = [];

            if (tr.combat) trBonuses.push("⚔️+" + tr.combat);

            if (tr.riding) trBonuses.push("🏇+" + tr.riding);

            if (tr.dance) trBonuses.push("💃+" + tr.dance);

            if (tr.charisma) trBonuses.push("✨+" + tr.charisma);

            trophyHtml = '<div class="quest-trophy-banner">' +

                '<span style="font-size:1.6rem;">' + tr.icon + '</span>' +

                '<div>' +

                '<div style="font-weight:700; color:#fef08a;">' + tQd("modals.quest_duel.possible_trophy", { name: this.escapeHtml(tr.name) }, "Možná trofej: " + this.escapeHtml(tr.name)) + '</div>' +

                '<div style="font-size:0.75rem; color:#86efac;">' + tQd("modals.quest_duel.trophy_bonus_slot", { bonus: trBonuses.join(" ") }, "Bonus: " + trBonuses.join(" ") + " (pro 5. slot zbrojnice)") + '</div>' +

                '</div>' +

                '</div>';

        }

        var html = [];
        var qGoldStr = window.PRS_I18n ? window.PRS_I18n.formatGold(q.gold) : (q.gold.toLocaleString("cs-CZ") + " zl.");
        var playerDispName = this.getPlayerDisplayName ? this.getPlayerDisplayName(player) : player.name;

        html.push('<div class="quest-duel-grid">');

        // LEVÝ SLOUPEC: Obrázek bestie a odměny

        html.push('  <div class="quest-duel-col-left">');

        html.push('    <div class="quest-monster-showcase">');

        html.push('      <div class="quest-monster-img-wrap">');

        html.push('        <img id="quest-monster-img-el" src="' + qImg + '" alt="' + this.escapeHtml(q.name) + '" class="quest-monster-img ' + (this.duelMonsterFlipped ? 'flipped' : '') + '" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.webp\';">');

        html.push('        <button class="quest-flip-btn" onclick="PRS_App.toggleDuelMonsterFlip()" title="' + this.escapeHtml(tQd("modals.quest_duel.flip_title", null, "Zrcadlově otočit pohled")) + '">' + tQd("modals.quest_duel.flip_btn", null, "🔄 Otočit") + '</button>');

        html.push('      </div>');

        html.push('      <div style="font-family:\'Cinzel\',serif; font-size:1.15rem; font-weight:700; color:#fef08a; margin-bottom:2px;">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>');

        html.push('      <div style="font-size:0.78rem; color:#fca5a5; margin-bottom:8px;">' + this.escapeHtml(q.desc || "") + '</div>');

        html.push('      <div class="quest-bounty-badge-row">');

        html.push('        <span class="quest-bounty-pill quest-bounty-gold">💰 +' + qGoldStr + '</span>');

        if (q.hearts > 0) html.push('        <span class="quest-bounty-pill quest-bounty-heart">💖 +' + q.hearts + ' ' + tQd("common.hearts_singular", null, "Srdce") + '</span>');

        html.push('      </div>');

        html.push('    </div>');

        if (trophyHtml) html.push(trophyHtml);

        html.push('  </div>');

        // PRAVÝ SLOUPEC: Soubojový stav, šance a taktická příprava

        html.push('  <div class="quest-duel-col-right">');

        html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">');

        html.push('      <span class="duel-tier-badge" style="background:rgba(239,68,68,0.22); border-color:' + tierColor + '; color:' + tierColor + ';">⚔️ ' + q.questTier + ' • ' + tierTitle + '</span>');

        html.push('      <span style="font-size:0.8rem; color:#cbd5e1;">' + tQd("modals.quest_duel.weakness_label", null, "💡 Slabina:") + ' <strong style="color:#fde047;">' + weaknessText + '</strong></span>');

        html.push('    </div>');

        if (wRes.exploited) {

            html.push('    <div class="duel-weakness-badge exploited">');

            html.push('      <span style="font-size:1.25rem;">🎯</span>');

            html.push('      <div><strong>' + tQd("modals.quest_duel.weakness_exploited_title", null, "SLABINA VYUŽITA (+2 k síle):") + '</strong> ' + this.escapeHtml(wRes.reason) + '!</div>');

            html.push('    </div>');

        } else if (q.weakness) {

            html.push('    <div class="duel-weakness-badge locked">');

            html.push('      <span style="font-size:1.15rem;">💡</span>');

            html.push('      <div><strong>' + tQd("modals.quest_duel.weakness_beast_title", null, "Slabina bestie:") + '</strong> ' + weaknessText + ' <span style="opacity:0.75; font-size:0.78rem;">' + tQd("modals.quest_duel.weakness_locked_hint", null, "(Zatím nesplněno – pro bonus +2 potřebuješ odpovídající výbavu, ctnost či zvíře)") + '</span></div>');

            html.push('    </div>');

        }

        html.push('    <div class="duel-arena-grid">');

        html.push('      <div class="duel-combatant" style="border-color:' + player.color + ';">');

        html.push('        <div class="duel-fighter-role" style="color:' + player.color + '; display:flex; align-items:center; justify-content:center; gap:0.4rem;">' + (this.getPlayerPawnAvatarHtml ? this.getPlayerPawnAvatarHtml(player, 34) : player.badge) + ' <span>' + this.escapeHtml(playerDispName) + '</span></div>');

        html.push('        <div class="duel-fighter-stat">⚔️ ' + basePower + ' <small>' + tQd("modals.quest_duel.static_power", null, "stálá síla") + '</small></div>');

        var breakdownParts = [tQd("skills.combat", null, "Boj") + " " + stats.combat];
        if (horseBonus > 0) breakdownParts.push(tQd("modals.quest_duel.part_horse", { val: horseBonus }, "Kůň " + horseBonus));
        if (animalBonus > 0) breakdownParts.push(tQd("modals.quest_duel.part_beasts", { val: animalBonus }, "Zvěř " + animalBonus));
        if (tacticBonus > 0) breakdownParts.push(tQd("modals.quest_duel.part_tactic", { val: tacticBonus }, "Taktika " + tacticBonus));
        if (weaknessBonus > 0) breakdownParts.push(tQd("modals.quest_duel.part_weakness", { val: weaknessBonus }, "Slabina " + weaknessBonus));
        if (stanceBonus !== 0) breakdownParts.push(tQd("modals.quest_duel.part_stance", { val: (stanceBonus > 0 ? "+" + stanceBonus : stanceBonus) }, "Postoj " + (stanceBonus > 0 ? "+" + stanceBonus : stanceBonus)));

        html.push('        <div class="duel-fighter-sub">' + breakdownParts.join(" + ") + '</div>');

        html.push('      </div>');

        html.push('      <div class="duel-vs-badge">VS</div>');

        html.push('      <div class="duel-combatant">');

        html.push('        <div class="duel-fighter-role" style="color:#f87171;">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>');

        html.push('        <div class="duel-fighter-stat" style="color:#ef4444;">🛡️ ' + q.difficulty + ' <small>' + tQd("modals.quest_duel.difficulty_small", null, "obtížnost") + '</small></div>');

        var neededStr = neededRoll <= 1 ? '1+' : (neededRoll <= 6 ? neededRoll + '+' : tQd("modals.quest_duel.impossible_without_roll", null, "nelze bez hodu"));
        html.push('        <div class="duel-fighter-sub">' + tQd("modals.quest_duel.needed_roll_label", null, "Potřebný hod:") + ' 🎲 <strong>' + neededStr + '</strong></div>');

        html.push('      </div>');

        html.push('    </div>');

        html.push('    <div class="duel-odds-container">');

        html.push('      <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">');

        html.push('        <span>' + tQd("modals.quest_duel.win_chance_label", null, "Šance na hrdinské vítězství:") + '</span>');

        html.push('        <strong style="color:' + (winRate >= 50 ? '#86efac' : '#fca5a5') + ';">' + winRate + ' %</strong>');

        html.push('      </div>');

        html.push('      <div class="duel-odds-bar-track">');

        html.push('        <div class="duel-odds-bar-fill" style="width:' + winRate + '%; background:' + (winRate >= 65 ? 'linear-gradient(90deg, #10b981, #22c55e)' : (winRate >= 35 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #dc2626, #ef4444)')) + ';"></div>');

        html.push('      </div>');

        html.push('    </div>');

        // Volba bojového postoje

        var curStance = this.selectedDuelStance || "tactical";

        html.push('    <div class="duel-stances-container">');

        html.push('      <div class="quest-tactics-title"><span>' + tQd("modals.quest_duel.stance_header", null, "⚔️ Bojový postoj rytíře:") + '</span></div>');

        html.push('      <div class="duel-stances-row">');

        html.push('        <button type="button" class="duel-stance-btn aggressive ' + (curStance === "aggressive" ? "active" : "") + '" onclick="PRS_App.selectDuelStance(\'aggressive\')">');

        html.push('          <span class="stance-title">' + tQd("modals.quest_duel.stance_aggressive_title", null, "⚔️ Dravý útok") + '</span>');

        html.push('          <span class="stance-badge">' + tQd("modals.quest_duel.stance_aggressive_badge", null, "+2 Síla") + '</span>');

        html.push('          <span class="stance-desc">' + tQd("modals.quest_duel.stance_aggressive_desc", null, "Při prohře -2 💖") + '</span>');

        html.push('        </button>');

        html.push('        <button type="button" class="duel-stance-btn tactical ' + (curStance === "tactical" ? "active" : "") + '" onclick="PRS_App.selectDuelStance(\'tactical\')">');

        html.push('          <span class="stance-title">' + tQd("modals.quest_duel.stance_tactical_title", null, "🎯 Taktický") + '</span>');

        html.push('          <span class="stance-badge">' + tQd("modals.quest_duel.stance_tactical_badge", null, "Běžná síla") + '</span>');

        html.push('          <span class="stance-desc">' + tQd("modals.quest_duel.stance_tactical_desc", null, "Šance na Reroll") + '</span>');

        html.push('        </button>');

        html.push('        <button type="button" class="duel-stance-btn defensive ' + (curStance === "defensive" ? "active" : "") + '" onclick="PRS_App.selectDuelStance(\'defensive\')">');

        html.push('          <span class="stance-title">' + tQd("modals.quest_duel.stance_defensive_title", null, "🛡️ Opatrná obrana") + '</span>');

        html.push('          <span class="stance-badge">' + tQd("modals.quest_duel.stance_defensive_badge", null, "-1 Síla") + '</span>');

        html.push('          <span class="stance-desc">' + tQd("modals.quest_duel.stance_defensive_desc", null, "Ústup bez ztráty 💖") + '</span>');

        html.push('        </button>');

        html.push('      </div>');

        html.push('    </div>');

        html.push('    <div class="quest-tactics-section">');

        html.push('      <div class="quest-tactics-title"><span>' + tQd("modals.quest_duel.tactic_header", null, "🛡️ Taktická volba před bojem:") + '</span></div>');

        var actNorm = this.selectedDuelTactic === "normal" ? "active" : "";

        html.push('      <div class="quest-tactic-option ' + actNorm + '" onclick="PRS_App.selectDuelTactic(\'normal\')">');

        html.push('        <div class="quest-tactic-radio"></div>');

        html.push('        <div class="quest-tactic-body">');

        html.push('          <div class="quest-tactic-name">' + tQd("modals.quest_duel.tactic_normal_name", null, "⚔️ Vyvážený rytířský výpad") + '</div>');

        html.push('          <div class="quest-tactic-desc">' + tQd("modals.quest_duel.tactic_normal_desc", null, "Standardní boj s využitím zbraní a ctností (+0 k síle).") + '</div>');

        html.push('        </div>');

        html.push('      </div>');

        if (hasHorse) {

            var actCharge = this.selectedDuelTactic === "charge" ? "active" : "";

            html.push('      <div class="quest-tactic-option ' + actCharge + '" onclick="PRS_App.selectDuelTactic(\'charge\')">');

            html.push('        <div class="quest-tactic-radio"></div>');

            html.push('        <div class="quest-tactic-body">');

            html.push('          <div class="quest-tactic-name">' + tQd("modals.quest_duel.tactic_charge_name", null, "🏇 Útok z plné jízdy na koni (+1 k síle)") + '</div>');

            html.push('          <div class="quest-tactic-desc">' + tQd("modals.quest_duel.tactic_charge_desc", null, "Drtivý nájezd dodává rytíři dodatečnou údernou sílu.") + '</div>');

            html.push('        </div>');

            html.push('      </div>');

        }

        if (hasHounds) {

            var actHounds = this.selectedDuelTactic === "hounds" ? "active" : "";

            html.push('      <div class="quest-tactic-option ' + actHounds + '" onclick="PRS_App.selectDuelTactic(\'hounds\')">');

            html.push('        <div class="quest-tactic-radio"></div>');

            html.push('        <div class="quest-tactic-body">');

            html.push('          <div class="quest-tactic-name">' + tQd("modals.quest_duel.tactic_hounds_name", null, "🐕 Vypuštění lovecké smečky (+1 k síle)") + '</div>');

            html.push('          <div class="quest-tactic-desc">' + tQd("modals.quest_duel.tactic_hounds_desc", null, "Smečka psů a sokolů zmate bestii a odláká její pozornost.") + '</div>');

            html.push('        </div>');

            html.push('      </div>');

        }

        if (canAffordElixir || q.questTier !== "U1") {

            var actElix = this.selectedDuelTactic === "elixir" ? "active" : "";

            html.push('      <div class="quest-tactic-option ' + actElix + '" onclick="PRS_App.selectDuelTactic(\'elixir\')">');

            html.push('        <div class="quest-tactic-radio"></div>');

            html.push('        <div class="quest-tactic-body">');

            var elixCostStr = window.PRS_I18n ? window.PRS_I18n.formatGold(500) : "500 zl.";
            html.push('          <div class="quest-tactic-name">' + tQd("modals.quest_duel.tactic_elixir_name", { price: elixCostStr }, "🧪 Hojivý lektvar z Lazaretu (" + elixCostStr + ")") + '</div>');

            html.push('          <div class="quest-tactic-desc">' + tQd("modals.quest_duel.tactic_elixir_desc", null, "Pojistka: Při porážce neutrpíš těžké zranění a nemusíš do Špitálu!") + '</div>');

            html.push('        </div>');

            html.push('      </div>');

        }

        html.push('    </div>');

        html.push('    <button id="btn-quest-duel-action" class="quest-btn-roll-action" onclick="PRS_App.executeDuelRoll()">');

        html.push('      ' + tQd("modals.quest_duel.btn_roll_action", null, "🎲 Vrhni kostku do souboje!"));

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

            var tQdRoll = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
            btn.innerHTML = tQdRoll("modals.quest_duel.rolling_btn", null, "🎲 Kostka se točí v aréně...");

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

            self._notifyQuestDuelOutcome(res);

            self.renderDuelCeremony(res);

            self.renderGameScreen();

            self.saveSessionAuto();

        }, 900);

    },

    
    renderDuelCeremony: function (res) {
        var body = document.getElementById("quest-duel-modal-body");
        if (!body || !res) return;

        var tCer = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
        var q = res.quest || {};
        var won = res.won;
        var player = this.state.players[this.state.currentPlayerIndex];
        var playerDisp = this.getPlayerDisplayName ? this.getPlayerDisplayName(player) : player.name;
        var html = [];

        html.push('<div class="quest-ceremony-wrap">');

        if (won) {
            html.push('  <div class="quest-ceremony-banner win">' + tCer("modals.quest_duel.ceremony_win_banner", null, "⚔️ HRDINSKÉ VÍTĚZSTVÍ!") + '</div>');
            html.push('  <p style="font-size:0.95rem; color:#fef08a; margin:0 0 0.35rem 0;">');
            html.push('    ' + tCer("modals.quest_duel.ceremony_win_sub", { badge: player.badge, player: this.escapeHtml(playerDisp), quest: (q.icon + ' ' + this.escapeHtml(q.name)) }, player.badge + ' <strong>' + this.escapeHtml(playerDisp) + '</strong> přemohl v souboji <strong>' + q.icon + ' ' + this.escapeHtml(q.name) + '</strong>!'));
            html.push('  </p>');

            html.push('  <div style="font-size:0.83rem; color:#cbd5e1; margin-bottom:0.45rem;">');
            html.push('    ' + tCer("modals.quest_duel.ceremony_roll_stats", { roll: res.roll, power: res.totalPower, diff: res.difficulty }, "Hod kostkou: 🎲 <strong>" + res.roll + "</strong> &nbsp;|&nbsp; Celková síla: ⚔️ <strong>" + res.totalPower + "</strong> (vs. obtížnost " + res.difficulty + ")"));
            if (res.stanceName) html.push('    <span style="color:#fef08a; margin-left:8px;">' + tCer("modals.quest_duel.ceremony_stance_label", null, "Postoj:") + ' <strong>' + this.escapeHtml(res.stanceName) + '</strong></span>');
            if (res.tacticName) html.push('    <span style="color:#86efac; margin-left:8px;">' + tCer("modals.quest_duel.ceremony_tactic_label", null, "Taktika:") + ' <strong>' + this.escapeHtml(res.tacticName) + '</strong></span>');
            if (res.weaknessExploited) html.push('    <div style="font-size:0.8rem; color:#fef08a; font-weight:700; margin-top:2px;">🎯 ' + tCer("modals.quest_duel.ceremony_weakness_win", { reason: this.escapeHtml(res.weaknessReason) }, "Využita slabina bestie (+2 síla): " + this.escapeHtml(res.weaknessReason)) + '</div>');
            html.push('  </div>');

            var wonGoldStr = window.PRS_I18n ? window.PRS_I18n.formatGold(res.goldWon) : (res.goldWon.toLocaleString("cs-CZ") + " zl.");
            html.push('  <div class="quest-bounty-badge-row" style="margin-bottom:0.45rem;">');
            html.push('    <span class="quest-bounty-pill quest-bounty-gold" style="font-size:0.92rem; padding:4px 14px;">💰 +' + wonGoldStr + '</span>');
            if (res.heartsWon > 0) {
                html.push('    <span class="quest-bounty-pill quest-bounty-heart" style="font-size:0.92rem; padding:4px 14px;">💖 +' + res.heartsWon + ' ' + tCer("common.hearts_singular_princezna", null, "Srdce princezny") + '</span>');
            }
            html.push('  </div>');

            if (res.trophyWon) {
                var tr = res.trophyWon;
                var statParts = [];
                if (tr.combat) statParts.push("⚔️ +" + tr.combat + " " + tCer("skills.combat", null, "Boj"));
                if (tr.riding) statParts.push("🏇 +" + tr.riding + " " + tCer("skills.riding", null, "Jízda"));
                if (tr.dance) statParts.push("💃 +" + tr.dance + " " + tCer("skills.dance", null, "Tanec"));
                if (tr.charisma) statParts.push("✨ +" + tr.charisma + " " + tCer("skills.charisma", null, "Charisma"));

                html.push('  <div class="quest-trophy-ceremony-card">');
                html.push('    <div class="quest-trophy-ceremony-icon">' + tr.icon + '</div>');
                html.push('    <div class="quest-trophy-content-wrap">');
                html.push('      <div class="quest-trophy-ceremony-name">' + tCer("modals.quest_duel.ceremony_trophy_won", { name: this.escapeHtml(tr.name) }, "🏆 Získána relikvie: " + this.escapeHtml(tr.name)) + '</div>');
                html.push('      <div class="quest-trophy-ceremony-stats">' + statParts.join(" &nbsp;•&nbsp; ") + '</div>');
                html.push('      <div class="quest-trophy-ceremony-desc">' + this.escapeHtml(tr.desc || tCer("modals.quest_duel.ceremony_trophy_default_desc", null, "Vzácná trofej potvrzující slavný triumf rytíře.")) + '</div>');
                html.push('      <div id="quest-trophy-equip-box">');
                if (tr.isEquipped) {
                    html.push('        <span style="color:#86efac; font-weight:700; font-size:0.8rem;">' + tCer("modals.quest_duel.ceremony_trophy_auto_equipped", null, "✅ Trofej automaticky nasazena v 5. slotu zbrojnice!") + '</span>');
                } else {
                    html.push('        <button class="quest-btn-equip-trophy" onclick="PRS_App.equipDuelTrophyNow(\'' + tr.id + '\')">' + tCer("modals.quest_duel.ceremony_btn_equip_trophy", null, "👑 Nasadit trofej do 5. slotu") + '</button>');
                }
                html.push('      </div>');
                html.push('    </div>');
                html.push('  </div>');
            }

            if (res.lootWon) {
                var loot = res.lootWon;
                var lootDispName = this.getItemDisplayName ? this.getItemDisplayName(loot) : loot.name;
                html.push('  <div style="background:rgba(212,175,55,0.15); border:1px solid #d4af37; border-radius:8px; padding:0.35rem 0.65rem; max-width:440px; margin:0 auto 0.45rem auto; font-size:0.82rem; color:#fef08a;">');
                html.push('    ' + tCer("modals.quest_duel.ceremony_loot_found", { item: loot.icon + ' ' + this.escapeHtml(lootDispName) }, "🎁 Nalezena výbava: <strong>" + loot.icon + " " + this.escapeHtml(lootDispName) + "</strong> (uložena do zbrojnice)"));
                html.push('  </div>');
            }

            html.push('  <button class="quest-btn-continue" onclick="PRS_App.closeQuestDuelModal()">' + tCer("modals.quest_duel.ceremony_win_continue", null, "🏆 Sláva vítězům (Pokračovat ve hře)") + '</button>');

        } else {
            html.push('  <div class="quest-ceremony-banner loss">' + tCer("modals.quest_duel.ceremony_loss_banner", null, "💀 PORÁŽKA V SOUBOJI") + '</div>');
            html.push('  <p style="font-size:0.95rem; color:#fca5a5; margin:0 0 0.35rem 0;">');
            html.push('    ' + tCer("modals.quest_duel.ceremony_loss_sub", { quest: q.icon + ' ' + this.escapeHtml(q.name), roll: res.roll, power: res.totalPower, diff: res.difficulty }, "<strong>" + q.icon + " " + this.escapeHtml(q.name) + "</strong> byl nad síly rytíře (Hod: 🎲 " + res.roll + ", Síla " + res.totalPower + " vs. " + res.difficulty + ")."));
            if (res.weaknessExploited) html.push('    <div style="font-size:0.78rem; color:#fde047; margin-top:2px;">🎯 ' + tCer("modals.quest_duel.ceremony_weakness_loss", { reason: this.escapeHtml(res.weaknessReason) }, "Využil jsi slabinu bestie (+2 síla: " + this.escapeHtml(res.weaknessReason) + "), ale hod kostkou bohužel nestačil.") + '</div>');
            html.push('  </p>');

            if (res.canTacticalReroll) {
                var pendingNote = tCer("engine.quest_reroll_pending_note", null, "⏳ Trest za porážku se uplatní až v případě, že nevyužiješ opravný hod nebo i druhý hod selže.");
                var declineLbl = tCer("engine.quest_reroll_decline_btn", null, "⚔️ Přijmout porážku a ustoupit");
                html.push('  <div style="background:rgba(245,158,11,0.22); border:1.5px dashed #f59e0b; border-radius:10px; padding:0.55rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto;">');
                html.push('    <div style="font-weight:bold; color:#fef08a; font-size:0.88rem; margin-bottom:0.2rem;">' + tCer("modals.quest_duel.reroll_title", null, "🎯 Šance na taktický opravný hod!") + '</div>');
                html.push('    <div style="font-size:0.78rem; color:#fde68a; margin-bottom:0.45rem;">' + tCer("modals.quest_duel.reroll_desc", { diff: (res.difficulty - res.totalPower) }, "Prohrál jsi o pouhé " + (res.difficulty - res.totalPower) + " body! Zkušenosti a zvířata ti dávají druhou šanci.") + '</div>');
                html.push('    <button id="quest-tactical-reroll-btn" class="quest-btn-roll-action" style="background:linear-gradient(135deg, #f59e0b, #d97706); font-size:0.88rem; padding:0.4rem 1rem; margin:0;" onclick="PRS_App.executeTacticalReroll(this)">' + tCer("modals.quest_duel.reroll_btn", null, "🎲 Taktický opravný hod (Reroll 1 kostky)") + '</button>');
                html.push('  </div>');
                html.push('  <div style="background:rgba(148,163,184,0.14); border:1px solid rgba(148,163,184,0.35); border-radius:8px; padding:0.45rem 0.75rem; max-width:440px; margin:0 auto 0.5rem auto; color:#cbd5e1; font-size:0.8rem;">' + this.escapeHtml(pendingNote) + '</div>');
                html.push('  <button class="quest-btn-continue" onclick="PRS_App.declineTacticalReroll()">' + this.escapeHtml(declineLbl) + '</button>');
            } else {
                if (res.preventedHospital) {
                    html.push('  <div style="background:rgba(16,185,129,0.18); border:1.5px solid #10b981; border-radius:8px; padding:0.5rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto; color:#86efac; font-size:0.84rem;">');
                    html.push('    ' + tCer("modals.quest_duel.loss_saved_elixir", null, "🧪 <strong>Záchrana lektvarem!</strong> Díky elixíru z Lazaretu neutrpěl rytíř fatální zranění a nemusí do Špitálu."));
                    html.push('  </div>');
                } else if (q.questTier === "U1") {
                    html.push('  <div style="background:rgba(239,68,68,0.18); border:1.5px solid #ef4444; border-radius:8px; padding:0.5rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto; color:#fca5a5; font-size:0.84rem;">');
                    html.push('    ' + tCer("modals.quest_duel.loss_u1", null, "🐗 Zvíře uniklo do hlubokého lesa. Ošetření lehkých ran stálo rytíře zlaťáky."));
                    html.push('  </div>');
                } else {
                    html.push('  <div style="background:rgba(239,68,68,0.22); border:1.5px solid #ef4444; border-radius:8px; padding:0.5rem 0.8rem; max-width:440px; margin:0 auto 0.5rem auto; color:#fca5a5; font-size:0.84rem;">');
                    html.push('    ' + tCer("modals.quest_duel.loss_hospital", null, "🏥 Raněný rytíř byl převezen do Královského lazaretu (Špitál), kde se 1 tah léčí ze svých zranění."));
                    html.push('  </div>');
                }

                html.push('  <button class="quest-btn-continue" onclick="PRS_App.closeQuestDuelModal()">' + tCer("modals.quest_duel.loss_retreat_continue", null, "⚔️ Ustoupit z bojiště (Pokračovat)") + '</button>');
            }
        }

        html.push('</div>');
        body.innerHTML = html.join("");
    },

    
    equipDuelTrophyNow: function (trophyId) {

        var res = window.PRS_GameEngine.toggleEquipItem(this.state, trophyId);

        if (res && res.ok !== false) {

            var tEq = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
            var box = document.getElementById("quest-trophy-equip-box");

            if (box) {

                box.innerHTML = '<span style="color:#86efac; font-weight:700; font-size:0.88rem;">' + tEq("modals.quest_duel.trophy_equipped_box", null, "✅ Trofej byla úspěšně nasazena do 5. slotu zbrojnice!") + '</span>';

            }

            if (window.PRS_Audio) window.PRS_Audio.playFanfare();

            this.showPawnToast(this.state.currentPlayerIndex, tEq("modals.quest_duel.trophy_equipped_toast", null, "Trofej nasazena!"), "👑", "#86efac");

            this.renderGameScreen();

            this.saveSessionAuto();

        }

    },

    
    executeTacticalReroll: function (btnEl) {

        if (this.isDuelRolling) return;

        this.isDuelRolling = true;

        var btn = btnEl || document.getElementById("quest-tactical-reroll-btn");

        var tQmc = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
        if (btn) {

            btn.disabled = true;

            btn.innerHTML = tQmc("modals.quest_duel.rerolling_btn", null, "🎲 Opravný hod se točí...");

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

            self._notifyQuestDuelOutcome(res);

            self.renderDuelCeremony(res);

            self.renderGameScreen();

            self.saveSessionAuto();

        }, 800);

    },

    
    handleResolveQuest: function () {

        this.openQuestDuelModal();

    },

    
    handleRetreatFromQuest: function () {

        if (!this.state) return;

        window.PRS_GameEngine.retreatFromQuest(this.state);

        var qModal = document.getElementById("quest-duel-modal");

        if (qModal) qModal.style.display = "none";

        this.renderGameScreen();

        this.saveSessionAuto();

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
        if (this.isActionProcessing || this.isSavingSession) return;
        this.isActionProcessing = true;
        var self = this;
        var deferredRelease = false;

        try {
            // Okamžitě v DOMu odstranit panel s předkupním právem pro okamžitou vizuální odezvu
            var buyoutCards = document.querySelectorAll(".buyout-interaction-card, .btn-action-buyout");
            for (var b = 0; b < buyoutCards.length; b++) {
                if (buyoutCards[b].classList.contains("buyout-interaction-card")) {
                    buyoutCards[b].remove();
                } else {
                    buyoutCards[b].disabled = true;
                    buyoutCards[b].style.opacity = "0.5";
                }
            }

            // Preventivně vyčistit stav předkupního práva v pendingAction
            if (this.state && this.state.pendingAction) {
                this.state.pendingAction.canBuyoutAnimalSet = false;
                this.state.pendingAction.buyoutCandidates = [];
                delete this.state.pendingAction.canBuyoutAnimalSet;
                delete this.state.pendingAction.buyoutCandidates;
                delete this.state.pendingAction.buyoutSuccess;
            }

            var res = null;
            try {
                res = window.PRS_GameEngine.executeAnimalBuyout(this.state, nodeId);
            } catch (err) {
                console.error("Chyba při výkupu zvířete executeAnimalBuyout:", err);
            }

            if (res) {
                if (window.PRS_Audio && typeof window.PRS_Audio.playBuy === "function") {
                    try { window.PRS_Audio.playBuy(); } catch (e) {}
                }
                this.inspectedPlayerIndex = this.state.currentPlayerIndex;
                var tBo = window.PRS_I18n ? function (k, p2, d) { return window.PRS_I18n.t(k, p2, d); } : function (k, p2, d) { return d; };
                var price = (typeof res === "object" && res.buyoutPrice) ? res.buyoutPrice : 1600;
                var rawNodeName = (typeof res === "object" && res.nodeName) ? res.nodeName : "";
                var nodeName = rawNodeName ? (this.translateDynamicName ? this.translateDynamicName(rawNodeName) : rawNodeName) : tBo("modals.quest_duel.animal_fallback", null, "Zvíře");
                var priceStrBo = window.PRS_I18n ? window.PRS_I18n.formatGold(price) : (price.toLocaleString("cs-CZ") + " zl.");
                if (this.showToast) {
                    this.showToast(tBo("modals.quest_duel.buyout_toast", { name: nodeName, price: priceStrBo }, "🦅 " + nodeName + " úspěšně vykoupen ze sady (-" + priceStrBo + ", +1.0 💖)!"), "success");
                }
                if (this.showPawnToast) {
                    this.showPawnToast(this.state.currentPlayerIndex, tBo("modals.quest_duel.buyout_pawn_toast", { name: nodeName }, "Vykoupen " + nodeName + "!"), "🦅", "#10b981");
                }

                if (this.state && this.state.pendingAction) {
                    this.state.pendingAction.canBuyoutAnimalSet = false;
                    this.state.pendingAction.buyoutCandidates = [];
                    this.state.pendingAction.buyoutSuccess = null;
                    delete this.state.pendingAction.canBuyoutAnimalSet;
                    delete this.state.pendingAction.buyoutCandidates;
                    delete this.state.pendingAction.buyoutSuccess;
                }

                this.isBoardStaticDirty = true;
                try { this.renderGameScreen(); } catch (e) { console.error("renderGameScreen error:", e); }
                try { this.renderActionPanel(); } catch (e) { console.error("renderActionPanel error:", e); }
                try { this.renderLowerKnightDetail(); } catch (e) { console.error("renderLowerKnightDetail error:", e); }
                if (this.activeSidebarTab === "property") {
                    try { this.renderSidebarPropertyPanel(); } catch (e) { console.warn("[Modals] renderSidebarPropertyPanel error:", e); }
                }

                var p = this.saveSessionAuto();
                if (p && typeof p.finally === "function") {
                    deferredRelease = true;
                    p.finally(function () {
                        self.isActionProcessing = false;
                    });
                } else {
                    deferredRelease = true;
                    setTimeout(function () { self.isActionProcessing = false; }, 350);
                }
            } else {
                try { this.renderActionPanel(); } catch (e) { console.warn("[Modals] renderActionPanel error:", e); }
            }
        } finally {
            if (!deferredRelease) {
                this.isActionProcessing = false;
            }
        }
    },

    
    getGenericModal: function () {
        var modal = document.getElementById("generic-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "generic-modal";
            modal.className = "modal-backdrop";
            modal.style.display = "none";
            modal.style.zIndex = "10060";
            modal.onclick = function (e) {
                if (e.target === this) this.style.display = "none";
            };
            document.body.appendChild(modal);
        }
        return modal;
    },

    
    openIntrigueModal: function (type) {
        var self = this;
        var tInt = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currG = tInt("common.gold", null, "zl.");
        var localeStr = tInt("ui.locale", null, "cs-CZ");
        var modal = this.getGenericModal();
        if (!modal) return;
        var p = self.state.players[self.state.currentPlayerIndex];
        var targets = [];
        for (var i = 0; i < self.state.players.length; i++) {
            var pl = self.state.players[i];
            if (pl.index !== p.index && !pl.isEliminated) targets.push(pl);
        }
        var isBallad = (type === "ballad");
        var cost = isBallad ? ((self.state.pendingAction && self.state.pendingAction.intrigueBalladCost) || 750) : ((self.state.pendingAction && self.state.pendingAction.intrigueCustomsCost) || 600);
        var costFmt = cost.toLocaleString(localeStr);
        var goldFmt = p.gold.toLocaleString(localeStr);
        var canAfford = (p.gold >= cost);

        var modalTitle = isBallad
            ? tInt("modals.intrigue.ballad_title", null, "Posměšná balada pod balkónem")
            : tInt("modals.intrigue.customs_title", null, "Královská celní kontrola");
        var modalDesc = isBallad
            ? tInt("modals.intrigue.ballad_desc", { cost: costFmt, curr: currG }, "Kejklíř složí uštěpačnou píseň o vybraném soupeři (souboj Charisma + 1d6). Úspěch: soupeř ztrácí 💖 a ty získáváš dvorskou přízeň! Cena: <strong>" + costFmt + " " + currG + "</strong>")
            : tInt("modals.intrigue.customs_desc", { cost: costFmt, curr: currG }, "Zvol soupeře, jehož panství budou na 1 kolo zmrazena celní kontrolou (nikdo mu neplatí nájem). Cena: <strong>" + costFmt + " " + currG + "</strong>");

        var costWarnHtml = "";
        if (!canAfford) {
            costWarnHtml = '<div style="background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:8px; padding:0.45rem 0.65rem; color:#fca5a5; font-size:0.8rem; margin-bottom:0.75rem;">' +
                tInt("modals.intrigue.no_gold_warn", { cost: costFmt, gold: goldFmt, curr: currG }, "⚠️ <strong>Nedostatek zlata!</strong> Na tuto intriku potřebuješ <strong>" + costFmt + " " + currG + "</strong>, ve váčku máš pouze <strong>" + goldFmt + " " + currG + "</strong>") +
                '</div>';
        }

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid var(--gold); border-radius:14px; text-align:center;">' +
            '<div style="font-size:2rem; margin-bottom:0.25rem;">' + (isBallad ? '🎭 🃏' : '📜 ⚖️') + '</div>' +
            '<h3 style="font-family:Cinzel,serif; color:var(--gold-light); margin:0 0 0.5rem 0;">' + modalTitle + '</h3>' +
            '<p style="font-size:0.84rem; color:var(--text-muted); margin-bottom:0.8rem;">' + modalDesc + '</p>' +
            costWarnHtml +
            '<div style="display:flex; flex-direction:column; gap:0.5rem;">';
        for (var t = 0; t < targets.length; t++) {
            var tgt = targets[t];
            var tgtDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(tgt) : tgt.name;
            var chVal = (tgt.skills && tgt.skills.charisma !== undefined) ? tgt.skills.charisma : 1;
            var btnStyle = canAfford ? 'text-align:left; padding:0.6rem 0.85rem;' : 'text-align:left; padding:0.6rem 0.85rem; opacity:0.45; cursor:not-allowed;';
            var clickHandler = canAfford ? ('PRS_App.confirmPlotIntrigue(\'' + type + '\', ' + tgt.index + ')') : '';
            html += '<button class="btn-gold-lg" style="' + btnStyle + '" ' + (canAfford ? ('onclick="' + clickHandler + '"') : 'disabled') + '>' +
                tgt.badge + ' <strong>' + self.escapeHtml(tgtDisplayName) + '</strong> (' + tgt.totalHearts + ' 💖, Charisma ' + chVal + ')' +
                '</button>';
        }
        if (targets.length === 0) {
            html += '<p style="color:#fca5a5; font-size:0.85rem;">' + tInt("modals.intrigue.no_rivals", null, "V království již nezbyl žádný aktivní soupeř.") + '</p>';
        }
        var cancelText = tInt("common.cancel", null, "Zrušit");
        html += '</div>' +
            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m) m.style.display=\'none\';">' + cancelText + '</button>' +
            '</div>';
        modal.innerHTML = html;
        modal.style.display = "flex";
    },

        confirmPlotIntrigue: function (type, targetIdx) {

        var modal = document.getElementById("generic-modal");

        if (modal) modal.style.display = "none";

        var res = window.PRS_GameEngine.executePlotIntrigue(this.state, type, targetIdx);

        var tPlot = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

        if (!res) {
            if (this.showToast) {
                this.showToast(tPlot("modals.intrigue.toast_no_gold", null, "⚠️ Nemáš dostatek zlata na provedení intriky!"), "warning");
            }
            return;
        }

        if (res.type === "ballad") {
            if (res.success) {
                if (window.PRS_Audio && window.PRS_Audio.playVictory) window.PRS_Audio.playVictory();
                else if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            } else {
                if (window.PRS_Audio && window.PRS_Audio.playFailure) window.PRS_Audio.playFailure();
                else if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            }
            this.showIntrigueResultModal(res);
        } else if (res.type === "customs") {
            if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            if (this.showToast) {
                this.showToast(tPlot("modals.intrigue.toast_customs_applied", { name: res.target.name }, "📜 Královský celní dekret uvalen na panství hráče " + res.target.name + "!"), "success");
            }
        }

        if (this.showPawnToast) {
            var currGoldBadge = tPlot("common.gold", null, "zl.");
            if (res.type === "ballad") {
                if (res.success) {
                    this.showPawnToast(res.player.index, "+0,5 💖", "👑", "#86efac");
                    this.showPawnToast(res.target.index, "-" + res.penalty + " 💖", "💔", "#f87171");
                } else {
                    this.showPawnToast(res.player.index, tPlot("modals.intrigue.pawn_ballad_cost", { cost: res.cost, curr: currGoldBadge }, "-" + res.cost + " " + currGoldBadge), "💸", "#fca5a5");
                    this.showPawnToast(res.target.index, "+0,25 💖", "✨", "#86efac");
                }
            } else if (res.type === "customs") {
                this.showPawnToast(res.target.index, tPlot("modals.intrigue.pawn_customs_badge", null, "Celní kontrola!"), "⚖️", "#fbbf24");
            }
        }

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    
    showIntrigueResultModal: function (res) {
        var modal = this.getGenericModal();
        if (!modal) return;
        var tRes = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currG = tRes("common.gold", null, "zl.");
        var p1 = res.player;
        var p2 = res.target;
        var isSuccess = res.success;

        var p1DisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(p1) : p1.name;
        var p2DisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(p2) : p2.name;
        var safeP2 = this.escapeHtml(p2DisplayName);

        var modalTitle = isSuccess
            ? tRes("modals.intrigue.result_success_title", null, "Posměšná balada uspěla!")
            : tRes("modals.intrigue.result_fail_title", null, "Posměšná balada selhala!");
        var modalSub = tRes("modals.intrigue.result_sub", null, "Dvorní intrika pod balkónem u Kejklíře");
        var yourSingerText = tRes("modals.intrigue.your_singer", null, "Tvůj pěvec");
        var targetIntrigueText = tRes("modals.intrigue.target_label", null, "Cíl intriky");
        var diceLabel = tRes("modals.intrigue.dice_label", null, "🎲 Kostka: ");
        var okBtnText = tRes("modals.intrigue.ok_btn", null, "Rozumím");

        var outcomeHtml = isSuccess
            ? ('<div style="color:#86efac; font-weight:700; margin-bottom:4px;">' +
               tRes("modals.intrigue.success_head", null, "👑 Kejklířova balada pobavila dvůr a zostudila soupeře!") + '</div>' +
               '<div style="color:#e2e8f0;">' +
               tRes("modals.intrigue.success_body", { name: safeP2, penalty: res.penalty }, "Dvořané se soupeřově neobratnosti hlasitě vysmáli. " + safeP2 + " ztrácí <strong style='color:#f87171;'>-" + res.penalty + " 💖</strong> a tvůj rytíř si získává obdiv princezny (<strong style='color:#86efac;'>+0,5 💖</strong>)!") + '</div>')
            : ('<div style="color:#fca5a5; font-weight:700; margin-bottom:4px;">' +
               tRes("modals.intrigue.fail_head", null, "🛡️ Soupeř zachoval vznešenou noblesu a vtip obrátil proti tobě!") + '</div>' +
               '<div style="color:#e2e8f0;">' +
               tRes("modals.intrigue.fail_body", { name: safeP2, cost: res.cost, curr: currG }, "Dvůr odsoudil laciný pokus o pomluvu. " + safeP2 + " získává <strong style='color:#86efac;'>+0,25 💖</strong> za dvorskou ctnost a kejklíř ti odmítá vrátit zaplacených <strong>" + res.cost + " " + currG + "</strong>") + '</div>');

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:480px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid ' + (isSuccess ? '#10b981' : '#f59e0b') + '; border-radius:14px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.7);">' +
            '<div style="font-size:2.5rem; margin-bottom:0.25rem;">' + (isSuccess ? '🎭 🎶 👑' : '🛡️ 📜 🎭') + '</div>' +
            '<h3 style="font-family:\'Cinzel\',serif; color:' + (isSuccess ? '#86efac' : '#fde047') + '; margin:0 0 0.35rem 0;">' + modalTitle + '</h3>' +
            '<p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">' + modalSub + '</p>' +

            '<div style="display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; background:rgba(0,0,0,0.35); padding:10px; border-radius:10px; margin-bottom:1rem; border:1px solid rgba(212,175,55,0.2);">' +
            '  <div style="background:' + (isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)') + '; border:1.5px solid ' + (isSuccess ? '#10b981' : 'rgba(212,175,55,0.3)') + '; border-radius:8px; padding:8px 6px;">' +
            '    <div style="font-size:1.6rem;">' + p1.badge + '</div>' +
            '    <div style="font-size:0.82rem; font-weight:700; color:' + (p1.color || '#fde047') + '; margin:2px 0;">' + this.escapeHtml(p1DisplayName) + '</div>' +
            '    <div style="font-size:0.75rem; color:#94a3b8;">' + yourSingerText + '</div>' +
            '    <div style="margin-top:6px; font-size:0.78rem; line-height:1.4;">' +
            '      <div>✨ Charisma: <strong>' + res.stat1 + '</strong></div>' +
            '      <div>' + diceLabel + '<strong>+' + res.r1 + '</strong></div>' +
            '      <div style="margin-top:4px; font-weight:800; font-size:0.95rem; color:' + (isSuccess ? '#86efac' : '#cbd5e1') + ';">= ' + res.ch1 + '</div>' +
            '    </div>' +
            '  </div>' +

            '  <div style="font-family:\'Cinzel\',serif; font-size:1.2rem; font-weight:900; color:#fbbf24; text-shadow:0 0 8px rgba(251,191,36,0.6);">VS</div>' +

            '  <div style="background:' + (!isSuccess ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)') + '; border:1.5px solid ' + (!isSuccess ? '#f59e0b' : 'rgba(212,175,55,0.3)') + '; border-radius:8px; padding:8px 6px;">' +
            '    <div style="font-size:1.6rem;">' + p2.badge + '</div>' +
            '    <div style="font-size:0.82rem; font-weight:700; color:' + (p2.color || '#fca5a5') + '; margin:2px 0;">' + this.escapeHtml(p2DisplayName) + '</div>' +
            '    <div style="font-size:0.75rem; color:#94a3b8;">' + targetIntrigueText + '</div>' +
            '    <div style="margin-top:6px; font-size:0.78rem; line-height:1.4;">' +
            '      <div>✨ Charisma: <strong>' + res.stat2 + '</strong></div>' +
            '      <div>' + diceLabel + '<strong>+' + res.r2 + '</strong></div>' +
            '      <div style="margin-top:4px; font-weight:800; font-size:0.95rem; color:' + (!isSuccess ? '#fde047' : '#cbd5e1') + ';">= ' + res.ch2 + '</div>' +
            '    </div>' +
            '  </div>' +
            '</div>' +

            '<div style="background:' + (isSuccess ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)') + '; border:1px solid ' + (isSuccess ? '#10b981' : '#f87171') + '; border-radius:8px; padding:10px; margin-bottom:1rem; font-size:0.84rem; text-align:left; line-height:1.45;">' +
            outcomeHtml +
            '</div>' +

            '<button class="btn-gold-lg" style="width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m) m.style.display=\'none\'; PRS_App.renderGameScreen();">' + okBtnText + '</button>' +
            '</div>';

        modal.innerHTML = html;
        modal.style.display = "flex";
    },

        openTradePactModal: function () {
        var self = this;
        var tPact = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currG = tPact("common.gold", null, "zl.");
        var modal = this.getGenericModal();
        if (!modal) return;
        var p = self.state.players[self.state.currentPlayerIndex];
        var rate = (self.state.config && self.state.config.interactionRate !== undefined) ? self.state.config.interactionRate : 0.5;
        var cost = Math.round(1500 * (rate > 0 ? rate : 0.5));
        var partners = [];
        var maxHearts = 0;
        for (var h = 0; h < self.state.players.length; h++) {
            if (self.state.players[h].totalHearts > maxHearts) maxHearts = self.state.players[h].totalHearts;
        }
        for (var i = 0; i < self.state.players.length; i++) {
            var pl = self.state.players[i];
            if (pl.index !== p.index && !pl.isEliminated && !window.PRS_GameEngine.hasActiveTradePact(self.state, p.index, pl.index)) {
                var isLeaderAhead = (pl.totalHearts === maxHearts && maxHearts >= p.totalHearts + 2);
                partners.push({ player: pl, isLeaderAhead: isLeaderAhead });
            }
        }

        var pactTitle = tPact("modals.pact.title", null, "Uzavření Obchodního paktu");
        var pactDesc = tPact("modals.pact.desc", { cost: cost, curr: currG }, "Zpečeť bezcelní alianci na <strong>8 celých kol</strong> za <strong>" + cost + " " + currG + "</strong> (polovina jde do pokladny, polovina partnerovi jako dar). Pravidlo cti: Pakt nelze uzavřít s lídrem království, který vede o 2+ 💖!");

        var html = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; text-align:center;">' +
            '<div style="font-size:2rem; margin-bottom:0.25rem;">🤝 📜</div>' +
            '<h3 style="font-family:Cinzel,serif; color:#7dd3fc; margin:0 0 0.5rem 0;">' + pactTitle + '</h3>' +
            '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:1rem;">' + pactDesc + '</p>' +
            '<div style="display:flex; flex-direction:column; gap:0.5rem;">';
        var estatesText = tPact("modals.pact.estates_label", null, "panství");
        var leaderCannotText = tPact("modals.pact.leader_cannot", null, " (Nelze: Lídr)");
        for (var pt = 0; pt < partners.length; pt++) {
            var item = partners[pt];
            var part = item.player;
            var partDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(part) : part.name;
            var disabled = item.isLeaderAhead || (p.gold < cost);

            html += '<button class="btn-gold-lg" ' + (disabled ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '') + ' style="text-align:left; padding:0.6rem 0.85rem; background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="PRS_App.confirmTradePact(' + part.index + ')">' +
                part.badge + ' <strong>' + self.escapeHtml(partDisplayName) + '</strong> (' + (part.ownedNodes ? part.ownedNodes.length : 0) + ' ' + estatesText + ', ' + part.totalHearts + ' 💖)' +
                (item.isLeaderAhead ? (' <small style="color:#fca5a5;">' + leaderCannotText + '</small>') : '') +
                '</button>';
        }
        if (partners.length === 0) {
            html += '<p style="color:#bae6fd; font-size:0.85rem;">' + tPact("modals.pact.no_partners", null, "V království není žádný volný spojenec pro pakt.") + '</p>';
        }
        var cancelText = tPact("common.cancel", null, "Zrušit");
        html += '</div>' +
            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m) m.style.display=\'none\';">' + cancelText + '</button>' +
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
        var tFest = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currG = tFest("common.gold", null, "zl.");
        var stakeLocale = tFest("ui.locale", null, "cs-CZ");
        var modal = this.getGenericModal();
        if (!modal || !self.state) return;
        var p = self.state.players[self.state.currentPlayerIndex];
        if (!p) return;
        var stake = (self.state.pendingAction && self.state.pendingAction.festivalChallengeStake) || 750;
        var stakeFmt = stake.toLocaleString(stakeLocale);
        var canAfford = (p.gold >= stake);
        var rivals = [];
        for (var i = 0; i < self.state.players.length; i++) {
            var pl = self.state.players[i];
            if (pl.index !== p.index && !pl.isEliminated) rivals.push(pl);
        }

        var festTitle = tFest("modals.festival_challenge.title", null, "Osobní výzva na Slavnosti");
        var festDesc = tFest("modals.festival_challenge.desc", { stake: stakeFmt, curr: currG }, "Zvol rivala a disciplínu (hod 1d6 + hodnota ctnosti). Vítěz získá <strong>" + stakeFmt + " " + currG + "</strong> a <strong>+0,5 💖</strong> slávy!");

        var html = '<div class="modal-box tactical-modal-box" style="padding:1.4rem; max-width:440px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #ec4899; border-radius:14px; text-align:center; box-shadow:0 12px 35px rgba(0,0,0,0.85);">' +
            '<div style="font-size:2rem; margin-bottom:0.25rem;">🏆 🤺</div>' +
            '<h3 style="font-family:Cinzel,serif; color:#fbcfe8; margin:0 0 0.5rem 0;">' + festTitle + '</h3>' +
            '<p style="font-size:0.84rem; color:#fce7f3; margin-bottom:0.85rem;">' + festDesc + '</p>' +
            (!canAfford ? ('<div style="background:rgba(239,68,68,0.2); border:1px solid #f87171; border-radius:8px; padding:0.45rem; font-size:0.8rem; color:#fca5a5; margin-bottom:0.75rem;">' + tFest("modals.festival_challenge.no_gold_warn", { gold: (p.gold || 0), stake: stake, curr: currG }, "⚠️ Nemáš dostatek zlaťáků na sázku (" + (p.gold || 0) + " / " + stake + " " + currG + ").") + '</div>') : '') +
            '<div style="display:flex; flex-direction:column; gap:0.6rem;">';
        for (var r = 0; r < rivals.length; r++) {
            var riv = rivals[r];
            var rivDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(riv) : riv.name;
            var rCombat = (riv.skills && riv.skills.combat !== undefined) ? riv.skills.combat : 1;
            var rRiding = (riv.skills && riv.skills.riding !== undefined) ? riv.skills.riding : 1;
            var rDance = (riv.skills && riv.skills.dance !== undefined) ? riv.skills.dance : 1;
            var btnDis = !canAfford ? 'disabled style="flex:1; font-size:0.78rem; padding:0.35rem; opacity:0.5;"' : 'style="flex:1; font-size:0.78rem; padding:0.35rem;"';
            var combatLabel = tFest("modals.festival_challenge.btn_combat", { val: rCombat }, "⚔️ Boj (" + rCombat + ")");
            var ridingLabel = tFest("modals.festival_challenge.btn_riding", { val: rRiding }, "🏇 Jízda (" + rRiding + ")");
            var danceLabel = tFest("modals.festival_challenge.btn_dance", { val: rDance }, "💃 Tanec (" + rDance + ")");

            html += '<div style="background:rgba(0,0,0,0.35); border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:0.55rem; text-align:left;">' +
                '<div style="font-weight:700; color:#fbcfe8; margin-bottom:4px;">' + riv.badge + ' ' + self.escapeHtml(rivDisplayName) + ' (' + riv.totalHearts + ' 💖)</div>' +
                '<div style="display:flex; gap:4px;">' +
                '  <button class="btn-secondary" ' + btnDis + ' onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'boj\')">' + combatLabel + '</button>' +
                '  <button class="btn-secondary" ' + btnDis + ' onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'jizda\')">' + ridingLabel + '</button>' +
                '  <button class="btn-secondary" ' + btnDis + ' onclick="PRS_App.confirmFestivalChallenge(' + riv.index + ', \'tanec\')">' + danceLabel + '</button>' +
                '</div>' +
                '</div>';
        }
        if (rivals.length === 0) {
            html += '<p style="color:#fca5a5; font-size:0.85rem;">' + tFest("modals.festival_challenge.no_rivals", null, "V království již nezbyl žádný aktivní soupeř k výzvě.") + '</p>';
        }
        var cancelText = tFest("common.cancel", null, "Zrušit");
        html += '</div>' +
            '<button class="btn-secondary" style="margin-top:0.85rem; width:100%;" onclick="var m=document.getElementById(\'generic-modal\'); if(m){ m.style.display=\'none\'; if(window.PRS_App && window.PRS_App.updateBodyModalClass) window.PRS_App.updateBodyModalClass(); }">' + cancelText + '</button>' +
            '</div>';
        modal.innerHTML = html;
        modal.style.display = "flex";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

        confirmFestivalChallenge: function (rivalIdx, discipline) {
        var modal = document.getElementById("generic-modal");
        if (modal) modal.style.display = "none";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
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

        var tDuel = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var currDuelG = tDuel("common.gold", null, "zl.");
        var duelLocale = tDuel("ui.locale", null, "cs-CZ");
        var isFestival = (category === "festival" || res.type === "festival_challenge");

        if (titleEl) {
            titleEl.textContent = isFestival
                ? tDuel("modals.duel.festival_title", null, "Osobní výzva na Slavnosti")
                : tDuel("modals.duel.duel_title", null, "Rytířský duel cti");
        }

        if (subEl) {
            subEl.textContent = isFestival
                ? tDuel("modals.duel.festival_sub", null, "Rytířské klání v turnajové disciplíně")
                : tDuel("modals.duel.duel_sub", null, "Výsledek přímého souboje na poli");
        }

        var p1 = res.p1;
        var p2 = res.p2;

        var p1Obj = (this.state && this.state.players && p1 && p1.index !== undefined) ? this.state.players[p1.index] : null;
        var p2Obj = (this.state && this.state.players && p2 && p2.index !== undefined) ? this.state.players[p2.index] : null;
        var p1IsBot = (p1 && p1.type && p1.type !== "Human") || (p1Obj && p1Obj.type !== "Human");
        var p2IsBot = (p2 && p2.type && p2.type !== "Human") || (p2Obj && p2Obj.type !== "Human");
        var isBothBots = Boolean(p1IsBot && p2IsBot);

        if (this.botDuelAutoCloseTimer) {
            clearTimeout(this.botDuelAutoCloseTimer);
            this.botDuelAutoCloseTimer = null;
        }

        var isDraw = res.isDraw;
        var p1Won = (res.winnerIndex === p1.index);
        var p2Won = (res.winnerIndex === p2.index);

        var p1DisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(p1) : p1.name;
        var p2DisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(p2) : p2.name;

        var defaultCombatStat = tDuel("modals.duel.default_combat_stat", null, "⚔️ Boj");
        var statName = isFestival ? ((window.PRS_SKILLS && window.PRS_SKILLS.getName) ? window.PRS_SKILLS.getName(res.discipline, true) : defaultCombatStat) : defaultCombatStat;
        var statVal1 = isFestival ? p1.stat : p1.combat;
        var statVal2 = isFestival ? p2.stat : p2.combat;

        var roleAttacker = tDuel("modals.duel.attacker", null, "Útočník");
        var roleDefender = tDuel("modals.duel.defender", null, "Obránce");
        var diceRollText = tDuel("modals.duel.dice_roll", null, "Hod kostkou: 🎲 ");
        var totalPowerText = tDuel("modals.duel.total_power", null, "Celková síla");
        var stakeText = tDuel("modals.duel.stake", null, "Sázka: ");
        var winnerBadgeText = tDuel("modals.duel.winner_badge", null, "👑 VÍTĚZ");

        var html = [];
        html.push('<div class="duel-combatants-arena">');

        // Bojovník 1 (Útočník / Vyzývatel)
        html.push('  <div class="duel-combatant-card' + (p1Won ? ' winner' : '') + '" style="border-color:' + p1.color + ';">');
        if (p1Won) html.push('    <div style="position:absolute; top:-10px; right:10px; background:#fbbf24; color:#000; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.6);">' + winnerBadgeText + '</div>');
        html.push('    <div class="duel-combatant-badge">' + p1.badge + '</div>');
        html.push('    <div class="duel-combatant-name" style="color:' + p1.color + ';" title="' + this.escapeHtml(p1DisplayName) + '">' + this.escapeHtml(p1DisplayName) + '</div>');
        html.push('    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:4px;">' + roleAttacker + '</div>');
        html.push('    <div class="duel-combatant-stats">');
        html.push('      <div>' + statName + ': <strong>+' + statVal1 + '</strong></div>');
        html.push('      <div>' + diceRollText + '<strong>' + p1.roll + '</strong></div>');
        html.push('    </div>');
        html.push('    <div class="duel-combatant-total">' + p1.total + '</div>');
        html.push('    <div style="font-size:0.7rem; color:#fde047;">' + totalPowerText + '</div>');
        html.push('  </div>');

        // VS střed
        html.push('  <div class="duel-vs-divider">');
        html.push('    <div style="font-size:1.6rem;">⚔️</div>');
        html.push('    <div class="duel-vs-text">VS</div>');
        html.push('    <div style="font-size:0.72rem; color:#cbd5e1; font-weight:bold;">' + stakeText + res.stake.toLocaleString(duelLocale) + ' ' + currDuelG + '</div>');
        html.push('  </div>');

        // Bojovník 2 (Obránce / Rival)
        html.push('  <div class="duel-combatant-card' + (p2Won ? ' winner' : '') + '" style="border-color:' + p2.color + ';">');
        if (p2Won) html.push('    <div style="position:absolute; top:-10px; right:10px; background:#fbbf24; color:#000; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.6);">' + winnerBadgeText + '</div>');
        html.push('    <div class="duel-combatant-badge">' + p2.badge + '</div>');
        html.push('    <div class="duel-combatant-name" style="color:' + p2.color + ';" title="' + this.escapeHtml(p2DisplayName) + '">' + this.escapeHtml(p2DisplayName) + '</div>');
        html.push('    <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:4px;">' + roleDefender + '</div>');
        html.push('    <div class="duel-combatant-stats">');
        html.push('      <div>' + statName + ': <strong>+' + statVal2 + '</strong></div>');
        html.push('      <div>' + diceRollText + '<strong>' + p2.roll + '</strong></div>');
        html.push('    </div>');
        html.push('    <div class="duel-combatant-total">' + p2.total + '</div>');
        html.push('    <div style="font-size:0.7rem; color:#fde047;">' + totalPowerText + '</div>');
        html.push('  </div>');

        html.push('</div>');

        // Banner s výsledkem
        var bannerCls = isDraw ? 'draw' : (p1Won ? 'win' : 'lose');
        html.push('<div class="duel-outcome-banner ' + bannerCls + '">');

        if (isDraw) {
            html.push('  <h4 style="margin:0 0 0.35rem; color:#7dd3fc; font-family:\"Cinzel\",serif; font-size:1.15rem;">' + tDuel("modals.duel.draw_title", null, "⚖️ Nerozhodný střet čepelí!") + '</h4>');
            html.push('  <p style="margin:0; font-size:0.85rem; color:#e0f2fe;">' + tDuel("modals.duel.draw_desc", { p1: p1.total, p2: p2.total }, "Oba rytíři předvedli stejnou sílu (" + p1.total + " vs " + p2.total + "). Žádné zlaťáky ani srdce princezny se nemění.") + '</p>');
        } else {
            var winner = p1Won ? p1 : p2;
            var loser = p1Won ? p2 : p1;
            var winnerDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(winner) : winner.name;
            var loserDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(loser) : loser.name;
            var safeWin = this.escapeHtml(winnerDisplayName);
            var safeLose = this.escapeHtml(loserDisplayName);
            var spoilsGold = (res.actualGold || res.stake).toLocaleString(duelLocale);
            var heartStakeVal = (res.heartStake || 0.5);

            html.push('  <h4 style="margin:0 0 0.35rem; color:#fef08a; font-family:\"Cinzel\",serif; font-size:1.15rem;">' + tDuel("modals.duel.win_title", { badge: winner.badge, name: safeWin }, "🏆 Vítězem duelu je " + winner.badge + " " + safeWin + "!") + '</h4>');
            html.push('  <div style="font-size:0.88rem; line-height:1.45; color:#f1f5f9;">');
            html.push('    <div>' + tDuel("modals.duel.win_desc", { w: winner.total, l: loser.total }, "Slavný úder překonal soupeře (<strong>" + winner.total + "</strong> vs <strong>" + loser.total + "</strong>).") + '</div>');
            html.push('    <div style="margin-top:0.35rem; font-weight:bold; color:#a7f3d0;">' + tDuel("modals.duel.win_spoils", { gold: spoilsGold, curr: currDuelG, hearts: heartStakeVal }, "💰 Kořist vítěze: +" + spoilsGold + " " + currDuelG + " &nbsp;•&nbsp; 💖 +" + heartStakeVal + " Srdce princezny") + '</div>');

            if (res.heartLost) {
                html.push('    <div style="font-size:0.8rem; color:#fca5a5; margin-top:2px;">' + tDuel("modals.duel.loser_heart_lost", { hearts: heartStakeVal }, "💔 Poražený ztrácí -" + heartStakeVal + " 💖 slávy") + '</div>');
            }

            if (res.hospitalTransferred) {
                html.push('    <div style="font-size:0.82rem; color:#fca5a5; margin-top:4px; font-weight:bold;">' + tDuel("modals.duel.hospital_transfer", { name: safeLose }, "🏥 V režimu Na život a smrt je těžce zraněný rytíř " + safeLose + " urychleně převezen do Královského lazaretu!") + '</div>');
            }

            html.push('  </div>');
        }

        html.push('</div>');

        // Tlačítko pokračovat
        var continueBtnText = tDuel("modals.duel.continue_btn", null, "⚔️ Pokračovat ve hře");
        var botDuelNote = tDuel("modals.duel.bot_auto_close", null, "(BOT duel – zavře se za 0,5 s...)");

        if (isBothBots) {
            html.push('<button class="btn-gold-lg" style="width:100%; padding:0.75rem; font-size:1.02rem;" onclick="PRS_App.closeKnightDuelModal()">' + continueBtnText + ' <span style="font-size:0.8rem; opacity:0.85; margin-left:6px;">' + botDuelNote + '</span></button>');
            html.push('<div style="height:3px; background:rgba(239,68,68,0.25); border-radius:2px; margin-top:8px; overflow:hidden;"><div style="height:100%; background:#ef4444; width:100%; animation:botDuelProgress 0.5s linear forwards;"></div></div>');
        } else {
            html.push('<button class="btn-gold-lg" style="width:100%; padding:0.75rem; font-size:1.02rem;" onclick="PRS_App.closeKnightDuelModal()">' + continueBtnText + '</button>');
        }

        bodyEl.innerHTML = html.join("\n");
        modal.style.display = "flex";
        this.updateBodyModalClass();

        if (isBothBots) {
            var self = this;
            this.botDuelAutoCloseTimer = setTimeout(function () {
                self.botDuelAutoCloseTimer = null;
                self.closeKnightDuelModal();
            }, 500);
        }

        if (window.PRS_Audio) {

            window.PRS_Audio.playSword();

            if (p1Won && p1.type === "Human") {

                setTimeout(function () { if (window.PRS_Audio) window.PRS_Audio.playFanfare(); }, 300);

            }

        }

    },

    
    closeKnightDuelModal: function () {

        if (this.botDuelAutoCloseTimer) {
            clearTimeout(this.botDuelAutoCloseTimer);
            this.botDuelAutoCloseTimer = null;
        }

        var modal = document.getElementById("knight-duel-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

        var activeP = (this.state && this.state.players) ? this.state.players[this.state.currentPlayerIndex] : null;
        if (this.syncFocusToActivePlayer) {
            this.syncFocusToActivePlayer(true);
        } else if (activeP && activeP.type === "Human") {
            this.selectedNodeId = activeP.nodeId;
            this.inspectedPlayerIndex = activeP.index;
            this.inspectNode(activeP.nodeId);
            this.centerOnActivePlayer(true, true);
            this.renderGameScreen();
        }

        this.scheduleBotTurnIfNeeded();

    }
    });
})();
