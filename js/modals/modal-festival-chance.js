// ============================================================================
// KiDesky: Princeznino srdce - Královské slavnosti, Karty náhody, Tutoriál a Speciální pole
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    handleChooseChanceDilemma: function (optionIndex) {

        if (!this.state || !this.state.pendingAction || !this.state.pendingAction.canChooseDilemma) return;

        var player = this.state.players[this.state.currentPlayerIndex];

        var res = window.PRS_GameEngine.chooseChanceDilemma(this.state, player, optionIndex);

        if (window.PRS_Audio) window.PRS_Audio.playItem();

        this.closeChanceModal();

        this.renderGameScreen();

        this.saveSessionAuto();

    },

    
    // Uložení nalezeného pergamenu do brašny rytíře (max 3)
    handleStoreScroll: function () {
        if (!this.state || !this.state.pendingAction) return;
        var player = this.state.players[this.state.currentPlayerIndex];
        var card = (this.state.pendingAction.scrollCard || this.state.pendingAction.chanceCard);
        var res = window.PRS_GameEngine.storeScrollInInventory(this.state, player, card);
        if (window.PRS_Audio) window.PRS_Audio.playItem();
        this.closeChanceModal();
        if (res && res.scroll) {
            if (this.showToast) {
                this.showToast("🎒 Svitek " + res.scroll.title + " byl bezpečně uložen do tvé brašny!", "success");
            }
        } else if (res && res.message && this.showToast) {
            this.showToast(res.message, "warning");
        }
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    
    // Okamžité použití pergamenu po otočení
    handleUseScrollNow: function () {
        if (!this.state || !this.state.pendingAction) return;
        var player = this.state.players[this.state.currentPlayerIndex];
        var card = (this.state.pendingAction.scrollCard || this.state.pendingAction.chanceCard);
        var res = window.PRS_GameEngine.useScrollEffect(this.state, player, card);
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        this.closeChanceModal();
        if (this.showToast && res && res.message) {
            this.showToast(res.message, "success");
        }
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    
    // Zahrání pergamenu z brašny (z ruky hráče)
    handleUseInventoryScroll: function (scrollIndex) {
        if (!this.state) return;
        var curIdx = this.state.currentPlayerIndex;
        var player = this.state.players[curIdx];
        if (!player || !player.inventory || !player.inventory[scrollIndex]) return;

        var scrollName = player.inventory[scrollIndex].title;
        var res = window.PRS_GameEngine.useInventoryScroll(this.state, curIdx, scrollIndex);
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        if (this.showToast) {
            this.showToast("📜 Pergamen " + scrollName + " aktivován!", "success");
        }
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

        var fType = pa.festivalType || "tournament";

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

            if (fType === "tournament") {

                eligible = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) || (st.horses >= 1 && (st.hasWeapon || st.hasArmor));

                var setB = (st.horses >= 1 && st.dogs >= 1 && st.falcons >= 1) ? 3 : 0;

                var baseB = st.combat + st.riding + setB;

                bonusText = "⚔️ Boj: " + st.combat + " | 🏇 Jízda: " + st.riding + (setB ? " | 🐕🦅 Set: +3" : "") + " (Základ: +" + baseB + ")";

            } else if (fType === "ball") {

                eligible = st.hasDress || st.dance >= 1;

                var dressB = st.hasDress ? 2 : 0;

                var baseB = st.dance + st.charisma + dressB;

                bonusText = "💃 Tanec: " + st.dance + " | ✨ Charisma: " + st.charisma + (dressB ? " | 👗 Šaty: +2" : "") + " (Základ: +" + baseB + ")";

            } else if (fType === "race") {

                eligible = st.horses >= 1;

                var horseB = Math.min(3, st.horses);

                var baseB = (st.riding * 2) + horseB;

                bonusText = "🏇 2× Jízda: " + (st.riding * 2) + " | 🐎 Koně: +" + horseB + " (Základ: +" + baseB + ")";

            }

            if (eligible) {

                contestants.push({ player: p, stats: st, bonusText: bonusText });

            } else {

                var reason = (fType === "tournament") ? "Nemá potřebná zvířata / zbroj" : ((fType === "ball") ? "Nemá slavnostní šaty ani tanec" : "Nemá žádného koně");

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

    openChanceModal: function () {
        if (!this.state || !this.state.pendingAction || !this.state.pendingAction.chanceCard) return;
        var modal = document.getElementById("chance-card-modal");
        if (!modal) return;
        this.renderChanceModalContent();
        modal.style.display = "flex";
        this.updateBodyModalClass();
        if (window.PRS_Audio) window.PRS_Audio.playItem();
    },

    
    closeChanceModal: function () {
        var modal = document.getElementById("chance-card-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    
    renderChanceModalContent: function () {
        var body = document.getElementById("chance-modal-body");
        if (!body || !this.state || !this.state.pendingAction || !this.state.pendingAction.chanceCard) return;
        var pa = this.state.pendingAction;
        var c = pa.chanceCard;
        var player = this.state.players[this.state.currentPlayerIndex];
        var isFlipped = (this.flippedChanceCardId === c.id);
        var effColor = (c.effect === "gold_loss" || c.effect === "robbers") ? "#fca5a5" : ((c.effect === "hearts" || c.effect === "ball") ? "#f472b6" : "#fde047");
        var isScroll = !!(c.isScroll || c.category === "scroll" || c.scrollType || pa.canStoreScroll || pa.scrollCard);
        var isDilemma = !!(pa.canChooseDilemma && c.options && c.options.length >= 2);
        var invCount = (player && player.inventory && player.inventory.length) || 0;
        var canStore = invCount < 3;

        // Pokud karta ještě nebyla otočena: Zobrazíme královskou voskovou pečeť
        if (!isFlipped) {
            body.innerHTML = '<div style="text-align:center; padding:1.5rem 0.75rem; cursor:pointer;" onclick="PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">' +
                '  <div class="chance-seal" style="margin:0 auto 1.1rem; width:68px; height:68px; font-size:2rem; display:flex; align-items:center; justify-content:center; border-radius:50%; background:radial-gradient(circle, #dc2626 0%, #991b1b 75%, #450a0a 100%); border:2.5px solid #fbbf24; box-shadow:0 0 25px rgba(220,38,38,0.65);">👑</div>' +
                '  <div style="font-family:\'Cinzel\',serif; font-size:1.3rem; font-weight:bold; color:var(--gold-light); margin-bottom:0.4rem; letter-spacing:0.5px;">KRÁLOVSKÝ PERGAMEN OSUDU</div>' +
                '  <p style="font-size:0.92rem; color:#fde68a; margin-bottom:1.4rem; line-height:1.5;">Stoupnul jsi na pole Náhody! Prolom královskou voskovou pečeť a odhal vůli osudu.</p>' +
                '  <button type="button" class="btn-primary" style="font-size:1rem; padding:0.75rem 2rem; cursor:pointer; font-weight:bold; border-radius:8px; background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; color:#fff; box-shadow:0 4px 18px rgba(217,119,6,0.5);" onclick="event.stopPropagation(); PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">📜 PROLOMIT PEČEŤ &amp; ODHALIT KARTU</button>' +
                '</div>';
            return;
        }

        // Karta je otočena: Zobrazíme čistý, dokonale dimenzovaný obsah bez ořezu a bez dvojitých rámů
        var html = '<div class="chance-modal-content" style="display:flex; flex-direction:column; gap:0.75rem;">' +
            '  <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:0.35rem; border-bottom:1px solid rgba(212,175,55,0.25);">' +
            '    <span class="standing-tile-badge" style="background:rgba(234,179,8,0.2); color:#fef08a; border-color:#eab308; font-weight:700; font-size:0.78rem; padding:2px 8px; border-radius:4px;">❓ KARTA NÁHODY</span>' +
            '    <span style="font-size:0.8rem; color:#fde047; font-weight:700;">' + c.id + '</span>' +
            '  </div>' +
            '  <div style="font-family:\'Cinzel\',serif; font-size:1.3rem; font-weight:bold; color:#fef08a; text-shadow:0 0 10px rgba(250,204,21,0.3); line-height:1.3;">' +
            this.escapeHtml(c.title) +
            '  </div>' +
            '  <div style="font-size:0.94rem; color:#f8fafc; line-height:1.5; background:rgba(0,0,0,0.35); border-left:3px solid #facc15; padding:0.65rem 0.85rem; border-radius:6px;">' +
            this.escapeHtml(c.text) +
            '  </div>';

        // 1. Dilema (volba ze dvou možností)
        if (isDilemma) {
            html += '<div style="display:flex; flex-direction:column; gap:0.6rem; margin-top:0.35rem;">' +
                '  <div style="font-size:0.78rem; color:#fde047; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Zvol své rozhodnutí:</div>' +
                '  <button type="button" class="chance-dilemma-btn opt-a" style="text-align:left; padding:0.8rem 1rem; background:linear-gradient(135deg, rgba(2,132,199,0.35), rgba(3,105,161,0.55)); border:1.5px solid #38bdf8; border-radius:8px; color:#fff; cursor:pointer; transition:all 0.15s ease;" onclick="PRS_App.handleChooseChanceDilemma(0)">' +
                '    <div class="opt-title" style="font-weight:800; font-size:0.96rem; color:#7dd3fc; margin-bottom:3px; display:flex; align-items:center; gap:0.35rem;">' +
                '      <span>' + c.options[0].icon + '</span> <span>' + this.escapeHtml(c.options[0].title) + '</span>' +
                '    </div>' +
                '    <div class="opt-desc" style="font-size:0.83rem; color:#e0f2fe; line-height:1.35;">' + this.escapeHtml(c.options[0].desc) + '</div>' +
                '  </button>' +
                '  <button type="button" class="chance-dilemma-btn opt-b" style="text-align:left; padding:0.8rem 1rem; background:linear-gradient(135deg, rgba(124,58,237,0.35), rgba(109,40,217,0.55)); border:1.5px solid #c084fc; border-radius:8px; color:#fff; cursor:pointer; transition:all 0.15s ease;" onclick="PRS_App.handleChooseChanceDilemma(1)">' +
                '    <div class="opt-title" style="font-weight:800; font-size:0.96rem; color:#e9d5ff; margin-bottom:3px; display:flex; align-items:center; gap:0.35rem;">' +
                '      <span>' + c.options[1].icon + '</span> <span>' + this.escapeHtml(c.options[1].title) + '</span>' +
                '    </div>' +
                '    <div class="opt-desc" style="font-size:0.83rem; color:#f5f3ff; line-height:1.35;">' + this.escapeHtml(c.options[1].desc) + '</div>' +
                '  </button>' +
                '</div>';
        }
        // 2. Taktický pergamen (uložit do brašny nebo použít ihned)
        else if (isScroll) {
            html += '<div style="margin-top:0.35rem; display:flex; flex-direction:column; gap:0.55rem;">' +
                '  <div style="font-size:0.82rem; color:#86efac; font-weight:700; background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.35); border-radius:6px; padding:0.45rem 0.65rem; text-align:center;">' +
                '    🎒 Taktický pergamen: ulož do brašny na později, nebo zahraj ihned:' +
                '  </div>' +
                '  <div style="display:flex; gap:0.55rem;">' +
                (canStore ? (
                    '    <button type="button" class="btn-primary" style="flex:1; background:linear-gradient(135deg, #059669, #047857); border:1.5px solid #34d399; color:#fff; font-size:0.92rem; padding:0.65rem 0.8rem; font-weight:bold; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem; box-shadow:0 3px 10px rgba(5,150,105,0.4);" onclick="PRS_App.handleStoreScroll(); PRS_App.closeChanceModal();">' +
                    '      🎒 Do brašny (' + invCount + '/3)' +
                    '    </button>'
                ) : (
                    '    <div style="flex:1; color:#f87171; font-size:0.82rem; text-align:center; font-weight:700; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); padding:0.55rem; border-radius:8px;">⚠️ Brašna plná (3/3)</div>'
                )) +
                '    <button type="button" class="btn-primary" style="flex:1; background:linear-gradient(135deg, #d97706, #b45309); border:1.5px solid #fde047; color:#fff; font-size:0.92rem; padding:0.65rem 0.8rem; font-weight:bold; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem; box-shadow:0 3px 10px rgba(217,119,6,0.4);" onclick="PRS_App.handleUseScrollNow(); PRS_App.closeChanceModal();">' +
                '      ⚡ Použít ihned' +
                '    </button>' +
                '  </div>' +
                '</div>';
        }
        // 3. Běžná karta s efektem
        else {
            html += '<div style="margin-top:0.35rem; display:flex; flex-direction:column; gap:0.65rem;">' +
                '  <div style="font-size:0.92rem; font-weight:bold; color:' + effColor + '; background:rgba(0,0,0,0.55); padding:0.65rem 0.9rem; border-radius:8px; border:1px solid rgba(255,255,255,0.15); text-align:center;">' +
                '    ⚡ ' + this.formatGameText(pa.summary || c.text) +
                '  </div>' +
                '  <button type="button" class="btn-primary" style="width:100%; padding:0.7rem; font-weight:bold; font-size:0.95rem; border-radius:8px;" onclick="PRS_App.closeChanceModal(); PRS_App.handleEndTurn();">' +
                '    ➡️ Rozumím &amp; Ukončit tah' +
                '  </button>' +
                '</div>';
        }

        html += '</div>';
        body.innerHTML = html;
    },

    
    toggleChanceCardFlip: function (cardId) {
        if (this.flippedChanceCardId === cardId) {
            this.flippedChanceCardId = null;
        } else {
            this.flippedChanceCardId = cardId;
            if (window.PRS_Audio) window.PRS_Audio.playItem();
        }
        this.renderActionPanel();
        this.renderChanceModalContent();

        var isMobile = (window.innerWidth <= 768) || (this.deviceProfile && this.deviceProfile.device === "mobile");
        if (isMobile) {
            var modal = document.getElementById("chance-card-modal");
            if (!modal || modal.style.display === "none") {
                this.openChanceModal();
            }
        }
        this.updateMobileDock();
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

    
    openCardPreview: function (type, id) {
        var modal = document.getElementById("card-detail-preview-modal");
        var titleEl = document.getElementById("card-detail-preview-title");
        var bodyEl = document.getElementById("card-detail-preview-body");
        if (!modal || !bodyEl) return;

        var html = [];
        var modalTitle = "Náhled karty";

        if (type === "quest") {
            var q = null;
            if (window.PRS_QUESTS) {
                var allQuests = (window.PRS_QUESTS.U1 || []).concat(window.PRS_QUESTS.U2 || []).concat(window.PRS_QUESTS.U3 || []);
                for (var i = 0; i < allQuests.length; i++) {
                    if (allQuests[i].id === id) { q = allQuests[i]; break; }
                }
            }
            if (!q) return;

            modalTitle = (q.icon || "⚔️") + " " + q.name;

            var isU1 = (q.id && q.id.indexOf("u1_") === 0);
            var isU2 = (q.id && q.id.indexOf("u2_") === 0);

            var tierTitle = isU1 ? "Tier U1 • Lesní zvěř" :
                            (isU2 && q.difficulty >= 12 ? "Tier U2+ • Mýtický titán" :
                            (isU2 ? "Tier U2 • Bájné monstrum" :
                            (q.tierGroup === "young" ? "Tier U3 • Mladý drak" :
                            (q.tierGroup === "elemental" ? "Tier U3 • Živlový drak" : "Tier U3 • Legendární Boss"))));

            var tierColor = isU1 ? "#10b981" :
                            (isU2 && q.difficulty >= 12 ? "#ec4899" :
                            (isU2 ? "#f59e0b" :
                            (q.tierGroup === "young" ? "#60a5fa" :
                            (q.tierGroup === "elemental" ? "#a855f7" : "#e11d48"))));

            var wMap = {
                dogs: "Lovečtí psi odlákají pozornost (+2 k síle se psy v chovu)",
                falcon: "Sokol útočí na zranitelná místa (+2 k síle se sokolem v chovu)",
                falcons: "Lovecký sokol vystopuje úkryt / odrazí vzdušný útok (+2 k síle)",
                animals: "Pes i sokol matou protivníka v boji (+2 k síle při vlastnictví psa i sokola)",
                horse: "Útok z plné jízdy na koni (+2 k síle s koněm v chovu)",
                dance: "Lze okouzlit ladným tancem (+2 k síle s Tancem ≥ 2)",
                elixir: "Hojivý lektvar neutralizuje dech či jed (+2 k síle s lektvarem)",
                water_armor: "Vodní perla či pevná zbroj tlumí žár (+2 k síle se zbrojí / vodní perlou)",
                ice: "Mrazivé zbraně oslabují protivníka (+2 k síle s mrazivou zbraní / relikvií)",
                fire: "Oheň taví led, krystaly a sítě (+2 k síle s ohnivou zbraní / relikvií)",
                armor: "Pevná rytířská zbroj svádí blesky a odráží drtivé údery (+2 k síle)",
                light: "Posvěcené relikvie rozhánějí temnotu a přízraky (+2 k síle)",
                charisma: "Vznešené charisma soka uchlácholí (+2 k síle s Charismatem ≥ 3)",
                holy: "Svaté relikvie zaženou nemrtvého a zlomí kletbu (+2 k síle)",
                courage: "Pevná vůle a odvaha pronikne mlhou (+2 k síle s Bojem ≥ 3 či Jízdou ≥ 3)",
                mastery: "Zkouška všech 4 ctností (+2 k síle při všech ctnostech ≥ 2)",
                spear: "Dlouhé rytířské kopí udrží soka v bezpečné vzdálenosti (+2 k síle)"
            };

            var trophyDef = (q.trophyId && window.PRS_TROPHIES) ? window.PRS_TROPHIES[q.trophyId] : null;

            html.push('<div class="bestiary-card" style="margin:0; background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; overflow:hidden;">');

            if (q.img) {
                var qBestImg = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(q.img) : q.img;
                html.push('  <div class="card-media-header" style="cursor:pointer;" onclick="PRS_App.openImageModal(\'' + qBestImg + '\', \'' + this.escapeHtml(q.name) + '\', \'' + this.escapeHtml(q.desc) + '\')" title="Klikni pro celoobrazovkové zvětšení">');
                html.push('    <img src="' + qBestImg + '" alt="' + this.escapeHtml(q.name) + '" class="card-media-img" loading="lazy" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.webp\';" />');
                html.push('    <span class="card-media-badge-left" style="border-color:' + tierColor + '; color:' + tierColor + ';">' + tierTitle + '</span>');
                html.push('    <span class="card-media-badge-right" style="border-color:rgba(239,68,68,0.6); color:#fca5a5;">⚔️ Obtížnost ' + q.difficulty + '</span>');
                html.push('  </div>');
            }

            html.push('  <div class="card-media-body" style="padding:0.9rem;">');
            html.push('    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.4rem;">');
            html.push('      <span style="font-weight:bold; font-size:1.1rem; color:#f8fafc;">' + (q.icon || "⚔️") + ' ' + this.escapeHtml(q.name) + '</span>');
            html.push('      <span style="background:rgba(212,175,55,0.2); border:1px solid var(--gold); border-radius:6px; padding:0.2rem 0.55rem; font-size:0.82rem; color:var(--gold-light); font-weight:bold;">💰 +' + q.gold.toLocaleString("cs-CZ") + ' zl. &nbsp;|&nbsp; 💖 +' + q.hearts + '</span>');
            html.push('    </div>');

            html.push('    <div style="font-size:0.86rem; color:#cbd5e1; line-height:1.45; margin-bottom:0.75rem;">' + this.escapeHtml(q.desc) + '</div>');

            if (q.weakness && wMap[q.weakness]) {
                html.push('    <div class="card-callout-box" style="border-color:rgba(253,224,71,0.4); color:#fef08a; background:rgba(212,175,55,0.12); font-size:0.83rem; margin-bottom:0.6rem; padding:0.5rem 0.75rem; border-radius:6px;">');
                html.push('      🎯 <strong>Využitelná slabina (+2 k síle):</strong> ' + wMap[q.weakness]);
                html.push('    </div>');
            }

            if (trophyDef) {
                var statsBonus = [];
                if (trophyDef.combat) statsBonus.push("⚔️+" + trophyDef.combat);
                if (trophyDef.riding) statsBonus.push("🏇+" + trophyDef.riding);
                if (trophyDef.dance) statsBonus.push("💃+" + trophyDef.dance);
                if (trophyDef.charisma) statsBonus.push("✨+" + trophyDef.charisma);
                html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.4); color:var(--gold-light); background:rgba(255,255,255,0.04); font-size:0.83rem; padding:0.5rem 0.75rem; border-radius:6px;">');
                html.push('      🏆 <strong>Trofej po porážce:</strong> ' + trophyDef.icon + ' ' + this.escapeHtml(trophyDef.name) + (statsBonus.length ? ' (' + statsBonus.join(" ") + ')' : ''));
                html.push('    </div>');
            }

            if (q.canFlip || q.imgFlip || q.img) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this)" style="font-size:0.75rem; padding:4px 8px; margin-top:0.6rem; width:100%; cursor:pointer;">🔄 Otočit směr pohledu</button>');
            }

            html.push('  </div>');
            html.push('</div>');

        } else if (type === "item") {
            var it = null;
            if (window.PRS_ITEMS) {
                for (var j = 0; j < window.PRS_ITEMS.length; j++) {
                    if (window.PRS_ITEMS[j].id === id) { it = window.PRS_ITEMS[j]; break; }
                }
            }
            if (!it) return;

            modalTitle = (it.icon || "🛡️") + " " + it.name;

            var statChips = [];
            if (it.combat) statChips.push('<span class="armory-stat-chip ' + (it.combat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (it.combat > 0 ? '+' : '') + it.combat + ' Boj</span>');
            if (it.riding) statChips.push('<span class="armory-stat-chip ' + (it.riding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (it.riding > 0 ? '+' : '') + it.riding + ' Jízda</span>');
            if (it.dance) statChips.push('<span class="armory-stat-chip ' + (it.dance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (it.dance > 0 ? '+' : '') + it.dance + ' Tanec</span>');
            if (it.charisma) statChips.push('<span class="armory-stat-chip ' + (it.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">✨ ' + (it.charisma > 0 ? '+' : '') + it.charisma + ' Charisma</span>');

            var slotLabels = {
                weapon: "⚔️ Zbraň",
                armor: "🛡️ Brnění",
                steed: "🏇 Oř / Zvíře",
                cloak: "🧥 Plášť / Oděv",
                jewel: "💎 Klenot / Šperk",
                trophy: "🏆 Trofej"
            };

            html.push('<div style="background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:1.1rem;">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">');
            html.push('    <span style="font-size:0.8rem; background:rgba(212,175,55,0.18); color:var(--gold-light); padding:0.2rem 0.55rem; border-radius:4px; font-weight:bold;">' + (it.tier || 1) + '. stupeň výbavy</span>');
            html.push('    <span style="font-size:1.05rem; color:var(--gold-light); font-weight:bold;">' + (it.price ? it.price.toLocaleString("cs-CZ") + ' zl.' : 'Vzácné') + '</span>');
            html.push('  </div>');

            html.push('  <div style="font-size:1.3rem; font-weight:bold; color:#f8fafc; margin-bottom:0.5rem;">' + (it.icon || '🛡️') + ' ' + this.escapeHtml(it.name) + '</div>');
            html.push('  <div style="font-size:0.86rem; color:#cbd5e1; line-height:1.45; margin-bottom:0.85rem;">' + this.escapeHtml(it.desc || 'Ušlechtilý předmět pro rytíře turnajového dvora.') + '</div>');

            if (statChips.length > 0) {
                html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.85rem;">' + statChips.join("") + '</div>');
            }

            html.push('  <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.82rem; color:#94a3b8; display:flex; justify-content:space-between;">');
            html.push('    <span>Slot rytíře: <strong style="color:#e2e8f0;">' + (slotLabels[it.slot] || it.slot || 'Univerzální') + '</strong></span>');
            if (it.source) html.push('    <span>Původ: <strong style="color:var(--gold-light);">' + this.escapeHtml(it.source) + '</strong></span>');
            html.push('  </div>');

            html.push('</div>');

        } else if (type === "chance") {
            var ch = null;
            if (window.PRS_CHANCE_CARDS) {
                for (var k = 0; k < window.PRS_CHANCE_CARDS.length; k++) {
                    if (window.PRS_CHANCE_CARDS[k].id === id) { ch = window.PRS_CHANCE_CARDS[k]; break; }
                }
            }
            if (!ch) return;

            modalTitle = (ch.icon || "❓") + " " + ch.title;
            var catLabel = ch.category === "positive" ? "Pozitivní osud (+)" : (ch.category === "negative" ? "Neštěstí (-)" : "Výzva (!)");
            var catCol = ch.category === "positive" ? "#4ade80" : (ch.category === "negative" ? "#f87171" : "#facc15");

            html.push('<div style="background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:1.1rem; text-align:center;">');
            html.push('  <div style="font-size:2.4rem; margin-bottom:0.4rem;">' + (ch.icon || '❓') + '</div>');
            html.push('  <div style="font-size:0.8rem; color:' + catCol + '; font-weight:bold; text-transform:uppercase; margin-bottom:0.5rem;">' + catLabel + '</div>');
            html.push('  <div style="font-size:1.15rem; font-weight:bold; color:var(--gold-light); margin-bottom:0.75rem;">' + this.escapeHtml(ch.title) + '</div>');
            html.push('  <div style="font-size:0.92rem; color:#e2e8f0; line-height:1.5; background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.25); border-radius:8px; padding:0.75rem;">' + this.escapeHtml(ch.text) + '</div>');
            html.push('</div>');

        } else if (type === "festival") {
            var festMap = {
                fest_tournament: { title: "Královský rytířský turnaj", icon: "⚔️", desc: "Turnajové klání v plné zbroji na počest královny. Měří se dovednost Boje a Jízdy na koni.", virtues: "⚔️ Boj + 🏇 Jízda", prizes: "1. místo: 1 500 zl. &nbsp;|&nbsp; 2. místo: 800 zl. &nbsp;|&nbsp; 3. místo: 400 zl." },
                fest_ball: { title: "Dvorský ples u princezny", icon: "💃", desc: "Slavnostní ples v audienční síni. Dvorské dámy hodnotí ladnost Tance a vznešené Charisma rytířů.", virtues: "💃 Tanec + ✨ Charisma", prizes: "1. místo: 1 500 zl. &nbsp;|&nbsp; 2. místo: 800 zl. &nbsp;|&nbsp; 3. místo: 400 zl." },
                fest_race: { title: "Velký královský dostih", icon: "🏇", desc: "Rychlostní a vytrvalostní závod koní přes louky i příkopy království. Rozhoduje Jízda a Boj.", virtues: "🏇 Jízda + ⚔️ Boj", prizes: "1. místo: 1 500 zl. &nbsp;|&nbsp; 2. místo: 800 zl. &nbsp;|&nbsp; 3. místo: 400 zl." }
            };
            var f = festMap[id] || { title: "Královská slavnost", icon: "🎪", desc: "Slavnostní událost království.", virtues: "Turnajové ctnosti", prizes: "Peněžité odměny" };
            modalTitle = f.icon + " " + f.title;

            html.push('<div style="background:rgba(0,0,0,0.5); border:1px solid rgba(212,175,55,0.4); border-radius:12px; padding:1.1rem;">');
            html.push('  <div style="text-align:center; font-size:2.4rem; margin-bottom:0.4rem;">' + f.icon + '</div>');
            html.push('  <div style="font-size:1.15rem; font-weight:bold; color:var(--gold-light); text-align:center; margin-bottom:0.6rem;">' + this.escapeHtml(f.title) + '</div>');
            html.push('  <div style="font-size:0.88rem; color:#cbd5e1; line-height:1.45; margin-bottom:0.85rem;">' + this.escapeHtml(f.desc) + '</div>');
            html.push('  <div style="background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.75rem; margin-bottom:0.6rem; font-size:0.84rem;"><strong>Hodnocené ctnosti:</strong> ' + f.virtues + '</div>');
            html.push('  <div style="background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:8px; padding:0.6rem 0.75rem; font-size:0.84rem; color:#86efac;"><strong>Ceny pro vítěze:</strong> ' + f.prizes + '</div>');
            html.push('</div>');
        }

        if (titleEl) titleEl.innerHTML = modalTitle;
        if (bodyEl) bodyEl.innerHTML = html.join("");
        modal.style.display = "flex";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    
    closeCardPreviewModal: function () {
        var modal = document.getElementById("card-detail-preview-modal");
        if (modal) modal.style.display = "none";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    }
    });
})();
