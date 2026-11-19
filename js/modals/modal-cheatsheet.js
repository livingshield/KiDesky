// ============================================================================
// KiDesky: Princeznino srdce - Tisknutelný tahák pravidel a Univerzální lightbox obrázků
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    // ========================================================================
    // 📜 RYCHLÝ TAHÁK DO KAPSY (A4 CHEATSHEET & TISKOVÝ EXPORT)
    // ========================================================================
    cheatSheetMode: "1page",

    
    openCheatSheetModal: function (mode) {
        if (mode) this.cheatSheetMode = mode;
        var modal = document.getElementById("cheatsheet-modal");
        if (!modal) return;
        modal.style.display = "flex";
        this.renderCheatSheetContent();
        this.updateCheatSheetModeButtons();
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    
    closeCheatSheetModal: function () {
        var modal = document.getElementById("cheatsheet-modal");
        if (modal) modal.style.display = "none";
        if (this.updateBodyModalClass) this.updateBodyModalClass();
    },

    
    setCheatSheetMode: function (mode) {
        this.cheatSheetMode = mode || "1page";
        this.updateCheatSheetModeButtons();
        this.renderCheatSheetContent();
    },

    
    updateCheatSheetModeButtons: function () {
        var b1 = document.getElementById("cs-mode-btn-1page");
        var b2 = document.getElementById("cs-mode-btn-2page");
        if (b1) b1.classList.toggle("active", this.cheatSheetMode === "1page");
        if (b2) b2.classList.toggle("active", this.cheatSheetMode === "2page");
    },

    
    printCheatSheet: function () {
        this.renderCheatSheetContent();
        document.body.classList.add("printing-cheatsheet");
        window.print();
        setTimeout(function () {
            document.body.classList.remove("printing-cheatsheet");
        }, 1500);
    },

    
    copyCheatSheetText: function () {
        var text = this.getCheatSheetPlainText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                if (window.KiDeskyToast) window.KiDeskyToast.show("📋 Tahák byl zkopírován do schránky!", "good");
            }).catch(function () {
                PRS_App.fallbackCopyText(text);
            });
        } else {
            this.fallbackCopyText(text);
        }
    },

    
    fallbackCopyText: function (text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            if (window.KiDeskyToast) window.KiDeskyToast.show("📋 Tahák byl zkopírován do schránky!", "good");
        } catch (e) {
            alert("Kopírování selhalo:\n\n" + text);
        }
        document.body.removeChild(ta);
    },

    
    getCheatSheetPlainText: function () {
        return "👑 KIDESKY: PRINCEZNINO SRDCE - RYCHLÝ TAHÁK DO KAPSY\n" +
            "=================================================================\n" +
            "CÍL HRY: 30 💖 Princezniných srdcí NEBO skolení 2 draků (okamžitá výhra)!\n" +
            "START: 10 000 zl. • Přejití startu: +3 000 zl. (bez panství záchranná podpora +5 000 zl.)\n\n" +
            "1. SMYČKA TAHU (4 KROKY):\n" +
            "• Krok 1 [HOD]: 1d6 základ (1–6). Opatrný krok (1–4). Kůň: Klus (+1), Cval (+2, Jízda ≥ 2), Trysk (2d6, Jízda ≥ 4 + kůň).\n" +
            "• Krok 2 [ROZCESTÍ]: Hod 1–3 odbočka na vedlejší trasu, 4–6 hlavní trasa. 🦅 Sokolí navigace umožňuje posun doskoku o ±1 pole.\n" +
            "• Krok 3 [AKCE POLE]: Nákup volného pole / zaplacení nájmu majiteli / výcvik u mistra / duel s rytířem / slavnost či trh.\n" +
            "• Krok 4 [KONEC TAHU]: Správa výstroje a zbraní, zahrání pergamenů z brašny (kapacita 3 ks), předání tahu.\n\n" +
            "2. CENÍK & NÁJMY PANSTVÍ A ZVÍŘAT:\n" +
            "• 🦅 Sokol (S1–S4): cena 400 × n (400–1600 zl.), nájem 20%/40%/80% sady. Sada: +4,0 💖 & sokolí navigace (±1 pole).\n" +
            "• 🐕 Pes (P1–P4): cena 500 × n (500–2000 zl.), nájem 20%/40%/80% sady. Sada: +2,5 💖 & obrana panství.\n" +
            "• 🐎 Kůň (K1–K4): cena 600 × n (600–2400 zl.), nájem 20%/40%/80% sady. Sada: +1,5 💖 & Klus/Cval/Trysk.\n" +
            "• 🏡 Vesnice (1★/2★/3★): cena 2000 / +1500 / +1500 zl. Daň: 500/900/1400 zl. Nájem: 300/500/800 zl. Kapacita chovu: 3 ks.\n" +
            "• 🏛️ Město (M1–M5): cena 4500 zl., daň 1200 zl., nájem 700 zl. Kapacita chovu: 2 ks dobytka.\n" +
            "• 🏰 Hrad (H1–H2): cena 8000 zl., daň 2500 zl., nájem 1500 zl., trvale +1 ✨ Charisma pro držitele.\n" +
            "• ⚒️ Živnosti: Kovárna (+1⚔️ Boj), Stáje (+1🏇 Jízda), Krejčí (+1💃 Tanec), Kejklíř (+výnosy). Cena 2500–3000 zl., nájem 350–400 zl.\n" +
            "• 🌾 Chov dobytka: 🐑 Ovce (500 zl., daň +120, nájem +50), 🐖 Prase (600 zl., daň +150, nájem +75), 🐄 Kráva (800 zl., daň +200, nájem +100).\n\n" +
            "3. ČTYŘI CTNOSTI, MISTŘI & DUELY:\n" +
            "• Ctnosti (0–5 stupňů): ⚔️ Boj, 🏇 Jízda, 💃 Tanec, ✨ Charisma.\n" +
            "• Výcvik u Mistra: poplatek 1k–5k zl., hod kostkou 4, 5, 6 uspěje (+1 stupeň). Velmistr dává +1,5 💖 a 1500 zl.\n" +
            "• Rytířský duel na poli: Síla rytíře + 1d6 vs síla soupeře + 1d6. Vítěz bere sázku ve zlatě nebo +1 💖 srdce!\n\n" +
            "4. SLAVNOSTI, AUDIENCE & DRAČÍ VÝZVY:\n" +
            "• ⚔️ Turnaj: Boj + Jízda + 1d6. Ceny: 1500 / 800 / 400 zl. + 💖.\n" +
            "• 💃 Dvorský bál: Tanec + Charisma + 1d6 (Šaty +2). Ceny: 1500 / 800 / 400 zl. + 💖.\n" +
            "• 🏇 Královské dostihy: 2× Jízda + 1d6 (+1 za každého koně). Ceny: 1500 / 800 / 400 zl. + 💖.\n" +
            "• 🐉 Lov draků: U1 (6–8), U2 (9–11), U3 (12–14). Skolení 2 draků = okamžité vítězství!\n" +
            "• 🏥 Špitál: ošetření za 500 zl. nebo hod 5–6 při čekání.\n" +
            "• 🎒 Brašna pergamenů (max 3 ks): Blesková rychlost, Královská amnestie, Síla lva, Zlaté rouno, Přízeň štěstěny.\n\n" +
            "5. KLÁVESOVÉ ZKRATKY:\n" +
            "• Mezerník: Hod kostkou / Pokračovat • T: Otevřít/Zavřít tahák • B: Brašna pergamenů • M: Hudba • Esc: Zavřít okno";
    },

    
    renderCheatSheetContent: function () {
        var body = document.getElementById("cheatsheet-modal-body");
        if (!body) return;

        var is2Page = (this.cheatSheetMode === "2page");
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var html = '<div class="cs-container" data-mode="' + this.cheatSheetMode + '">';

        if (isEn) {
            // ====================================================================
            // PAGE 1: MAIN POCKET CHEATSHEET (ENGLISH)
            // ====================================================================
            html += '<div class="cs-page cs-page-1">' +
                '  <div class="cs-header">' +
                '    <h2 class="cs-header-title">👑 PRINCESS\'S HEART • QUICK POCKET CHEATSHEET</h2>' +
                '    <div class="cs-header-sub">Original strategic &amp; RPG board game • Tabletop reference guide</div>' +
                '    <div class="cs-meta-bar">' +
                '      <span class="cs-pill">🎯 Goal: 30 💖 Princess Hearts OR 2 slain dragons 🐉</span>' +
                '      <span class="cs-pill">💰 Start: 10,000 g.</span>' +
                '      <span class="cs-pill">🏁 START: +3,000 g. (+5,000 g. landless)</span>' +
                '    </div>' +
                '  </div>' +

                '  <div class="cs-grid">' +

                // LEFT COLUMN
                '    <div class="cs-col">' +

                // Box 1: Turn Cycle
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🔄</span> TURN CYCLE IN 4 STEPS</div>' +
                '        <div class="cs-step-list">' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">1</div>' +
                '            <div><strong>Dice Roll &amp; Movement:</strong> Standard 1d6 (1–6). <em>Cautious Step</em> (1–4 tiles). 🐎 On horseback: <em>Trot</em> (+1), <em>Canter</em> (+2, Riding ≥ 2), <em>Steed Gallop</em> (2d6 choice, Riding ≥ 4 + horse).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">2</div>' +
                '            <div><strong>Crossroads &amp; Falcon:</strong> Roll 1–3 turn left/up, 4–6 straight/right. 🦅 <em>Falcon Navigation</em> (falcon breeding) allows adjusting landing by ±1 tile (reveals owners and rents).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">3</div>' +
                '            <div><strong>Tile Action:</strong> Buy unowned estate / pay rent to owner / train with a master / duel rival knight on tile / attend festival or purchase gear at merchant.</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">4</div>' +
                '            <div><strong>End of Turn:</strong> Play tactical scrolls from pouch (capacity 3/3), manage active gear in backpack, pass turn to next knight.</div>' +
                '          </div>' +
                '        </div>' +
                '      </div>' +

                // Box 2: 4 Virtues
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>⚔️</span> 4 VIRTUES, MASTERS &amp; DUELS</div>' +
                '        <div style="font-size:0.75rem; margin-bottom:0.35rem;">' +
                '          <strong>⚔️ Combat:</strong> weapons, dragon beasts, duels • <strong>🏇 Riding:</strong> speed, race speed<br/>' +
                '          <strong>💃 Dance:</strong> court ball, agility • <strong>✨ Charisma:</strong> audience, heart multiplier 💖' +
                '        </div>' +
                '        <div style="font-size:0.73rem; background:rgba(212,175,55,0.08); padding:0.35rem 0.5rem; border-radius:5px; border:1px solid rgba(212,175,55,0.2);">' +
                '          <strong>🎓 Master Training:</strong> Fee 1k / 2k / 3k / 4k / 5k g. Practice roll <strong>4, 5, 6</strong> succeeds (+1 rank). Grandmaster grants <strong>+1.5 💖</strong> and 1,500 g.<br/>' +
                '          <strong>⚔️ Knight Duel on Tile:</strong> Landing on a rival\'s tile allows challenging them: Knight Power + 1d6. Victory = loot gold or <strong>+1 💖</strong>!' +
                '        </div>' +
                '      </div>' +

                // Box 3: Pouch & Scrolls
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎒</span> POUCH &amp; SCROLLS (MAX 3 PCS)</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚡ Lightning Speed:</strong> Dice roll is automatically 6 (or +3 to landing).</div>' +
                '          <div><strong>🕊️ Royal Amnesty:</strong> Pay no rent on rival tile / rescue from Infirmary.</div>' +
                '          <div><strong>🦁 Lion\'s Might:</strong> +3 combat power in any battle or duel.</div>' +
                '          <div><strong>🐑 Golden Fleece:</strong> Doubles tax collection at Start or rent from rival.</div>' +
                '          <div><strong>🍀 Lady Luck:</strong> Re-roll any unfavorable dice.</div>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // end left col

                // RIGHT COLUMN
                '    <div class="cs-col">' +

                // Box 4: Price list
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🏰</span> ESTATE PRICE LIST &amp; NOBLE BREEDING</div>' +
                '        <table class="cs-table">' +
                '          <thead>' +
                '            <tr><th>Estate Type</th><th>Buy Price</th><th>Tax</th><th>Rent/Toll</th><th>Bonus</th></tr>' +
                '          </thead>' +
                '          <tbody>' +
                '            <tr><td><strong>🦅 Falcon (1–4)</strong></td><td>400–1,600 g.</td><td>—</td><td>20/40/80 %</td><td><strong>+4.0 💖</strong>, ±1 navigation</td></tr>' +
                '            <tr><td><strong>🐕 Dog (1–4)</strong></td><td>500–2,000 g.</td><td>—</td><td>20/40/80 %</td><td><strong>+2.5 💖</strong>, defense</td></tr>' +
                '            <tr><td><strong>🐎 Horse (1–4)</strong></td><td>600–2,400 g.</td><td>—</td><td>20/40/80 %</td><td><strong>+1.5 💖</strong>, Trot/Gallop</td></tr>' +
                '            <tr><td><strong>🏡 Village 1★</strong></td><td>2,000 g.</td><td>500 g.</td><td>300 g.</td><td>Breeding: max 3 beasts</td></tr>' +
                '            <tr><td><strong>🏡 Village 2★/3★</strong></td><td>+1.5k / +1.5k</td><td>900/1400</td><td>500/800</td><td>Higher yields</td></tr>' +
                '            <tr><td><strong>🏛️ Town</strong></td><td>4,500 g.</td><td>1,200 g.</td><td>700 g.</td><td>Breeding: max 2 beasts</td></tr>' +
                '            <tr><td><strong>🏰 Castle</strong></td><td>8,000 g.</td><td>2,500 g.</td><td>1,500 g.</td><td><strong>+1 ✨ Charisma</strong></td></tr>' +
                '            <tr><td><strong>⚒️ Crafts/Guilds</strong></td><td>2.5k–3.0k</td><td>600–800</td><td>350–400</td><td>Smithy/Stables/Tailor</td></tr>' +
                '          </tbody>' +
                '        </table>' +
                '        <div style="font-size:0.7rem; color:#fde047; margin-top:0.35rem;">' +
                '          🌾 <strong>Livestock:</strong> 🐑 Sheep (500 g., tax +120, rent +50) • 🐖 Pig (600 g., tax +150, rent +75) • 🐄 Cow (800 g., tax +200, rent +100)' +
                '        </div>' +
                '      </div>' +

                // Box 5: Festivals & Dragons
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎪</span> FESTIVALS, AUDIENCE &amp; DRAGON QUESTS</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚔️ Tournament:</strong> Combat + Riding + 1d6. Prize: 1,500 / 800 / 400 g. + 💖 hearts.</div>' +
                '          <div><strong>💃 Court Ball:</strong> Dance + Charisma + 1d6 (Dress +2). Prize: 1,500 / 800 / 400 g. + 💖.</div>' +
                '          <div><strong>🏇 Royal Steed Race:</strong> 2× Riding + 1d6 (+1 per horse). Prizes: up to 1,500 g. + 💖.</div>' +
                '          <div><strong>🐉 Dragon Hunt:</strong> U1 (diff 6–8), U2 (9–11), U3 (12–14). <strong>2 dragons = victory!</strong></div>' +
                '          <div><strong>🏥 Infirmary:</strong> Treat wounds for 500 g. or roll 5–6 when resting (skip turn).</div>' +
                '          <div><strong>💸 Bankruptcy:</strong> Sell gear at 50–70%, King waives debt in exchange for 💖 hearts.</div>' +
                '        </div>' +
                '      </div>' +

                // Box 6: Shortcuts
                '      <div class="cs-box" style="padding:0.45rem 0.65rem;">' +
                '        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.71rem; color:var(--text-muted);">' +
                '          <span>⌨️ <strong>Hotkeys:</strong> [Space] Roll/Move • [T] Cheatsheet • [B] Pouch • [M] Music • [Esc] Close</span>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // end right col

                '  </div>' + // end cs-grid

                '  <div class="cs-footer">KiDesky: The Princess\'s Heart © 2026 • 1-Page A4 Pocket Rules Cheatsheet • ekobio.org/apps/KiDesky</div>' +
                '</div>'; // end cs-page-1

            // ====================================================================
            // PAGE 2: EXTENDED LEXICON (ENGLISH)
            // ====================================================================
            if (is2Page) {
                html += '<div class="cs-page cs-page-2">' +
                    '  <div class="cs-header">' +
                    '    <h2 class="cs-header-title">🛡️ REFERENCE GUIDE • ARMORY &amp; BESTIARY</h2>' +
                    '    <div class="cs-header-sub">Beast weaknesses, armory gear, trophies, and cartographic legend</div>' +
                    '  </div>' +

                    '  <div class="cs-grid">' +

                    // LEFT COL PAGE 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🐉</span> BEAST WEAKNESSES IN COMBAT (+2 POWER)</div>' +
                    '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.35rem;">' +
                    '          <div><strong>🛡️ Plate Armor:</strong> Deflects crushing blows from heavy brute monsters (<em>Black Knight, Clay Golem, Stone Giant, Cyclops</em>).</div>' +
                    '          <div><strong>🗡️ Lance / Spear:</strong> Pierces armored hides and airborne dives (<em>Cliff Harpy, Forest Griffin, Manticore</em>).</div>' +
                    '          <div><strong>💧 Water / Frost:</strong> Extinguishes fiery beasts (<em>Lava Lizard, Fire Drake, Volcanic Serpent</em>).</div>' +
                    '          <div><strong>🔥 Fire / Flame:</strong> Melts frozen tissues of northern monsters (<em>Frost Wraith, Polar Dragon, Ice Wurm</em>).</div>' +
                    '          <div><strong>✨ Holy Relics:</strong> Consecrated light scorches dark and undead fiends (<em>Undead Lord, Shadow Dragon, Forest Apparition</em>).</div>' +
                    '          <div><strong>💃 Dance &amp; Jewels:</strong> Noble grace entrances gemstone creatures (<em>Ruby Dragon, Sacred Golden Stag</em>).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🏆</span> UNIQUE HUNTING TROPHIES</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.3rem;">' +
                    '          <div><strong>🪶 Harpy Razor Talon:</strong> +3 ⚔️ Combat, +2 🏇 Riding, +1 💃 Dance (7,500 g.)</div>' +
                    '          <div><strong>🗿 Clay Golem Core:</strong> +4 ⚔️ Combat, +3 ✨ Charisma, -2 💃 Dance (8,200 g.)</div>' +
                    '          <div><strong>🐺 Silver-Forged Alpha Fang:</strong> +4 ⚔️ Combat, +2 🏇 Riding, +1 ✨ Charisma (8,500 g.)</div>' +
                    '          <div><strong>🐙 Deep Sea Kraken Tentacle:</strong> +4 ⚔️ Combat, +2 🏇 Riding, +3 ✨ Charisma (9,000 g.)</div>' +
                    '          <div><strong>🩸 Manticore Stinger:</strong> +4 ⚔️ Combat, +3 🏇 Riding, +1 ✨ Charisma (9,500 g.)</div>' +
                    '          <div><strong>💀 Crown of the Undead Lord:</strong> +5 ⚔️ Combat, +4 ✨ Charisma (11,000 g.)</div>' +
                    '          <div><strong>💎 Ruby Dragon Heart:</strong> +5 ⚔️ Combat, +3 💃 Dance, +4 ✨ Charisma (14,000 g.)</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // end left col page 2

                    // RIGHT COL PAGE 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🛒</span> MERCHANT ARMORY &amp; GEAR</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                    '          <div><strong>🗡️ Weapons:</strong> Short Dagger (+1⚔️, 1.2k) • Broadsword (+2⚔️, 2.5k) • Knight\'s Halberd (+3⚔️, 4.5k) • Runed Blade (+4⚔️ +1🏇, 7k) • Sacred Excalibur (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>🛡️ Armor:</strong> Leather Armor (+1⚔️ +1🏇, 2k) • Chainmail (+2⚔️, 3k) • Full Plate (+3⚔️, 4.5k) • Silver Shield (+4⚔️ +2🏇 +1✨, 7k) • Dragonscale Armor (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>👗 Dresses &amp; Robes:</strong> Buckler &amp; Velvet (+2💃, 2.5k) • Silk Gown (+3💃, 4.5k) • Gold-Woven Raiment (+4💃 +2✨, 7k).</div>' +
                    '          <div><strong>💍 Jewelry:</strong> Ring of Courage (+1✨, 2k) • Amulet of Wisdom (+2✨, 4k) • Diamond Necklace (+3✨ +1💃, 7k).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🗺️</span> CARTOGRAPHIC LEGEND &amp; CODES</div>' +
                    '        <div style="font-size:0.71rem; display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">' +
                    '          <div><code>START</code> Realm Starting Gate</div>' +
                    '          <div><code>SHOP</code> Armory &amp; Market</div>' +
                    '          <div><code>MB, MJ</code> Master of Combat, Riding</div>' +
                    '          <div><code>MT, MCH</code> Master of Dance, Charisma</div>' +
                    '          <div><code>V1–V10</code> Villages (upgrades 1–3★)</div>' +
                    '          <div><code>M1–M5</code> Royal Fortified Towns</div>' +
                    '          <div><code>H1–H2</code> Stronghold Castles (+1✨)</div>' +
                    '          <div><code>S1–S4</code> Noble Falcons (+4💖)</div>' +
                    '          <div><code>P1–P4</code> Hunting Hounds (+2.5💖)</div>' +
                    '          <div><code>K1–K4</code> Noble Steeds (+1.5💖)</div>' +
                    '          <div><code>U1–U3</code> Monster &amp; Dragon Lairs</div>' +
                    '          <div><code>CHANCE</code> Fortune Chest &amp; Scrolls</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // end right col page 2

                    '  </div>' + // end cs-grid page 2

                    '  <div class="cs-footer">KiDesky: The Princess\'s Heart © 2026 • Full Reference Manual (Page 2/2)</div>' +
                    '</div>'; // end cs-page-2
            }
        } else {
            // ====================================================================
            // STRANA 1: HLAVNÍ TAHÁK DO KAPSY (ČEŠTINA)
            // ====================================================================
            html += '<div class="cs-page cs-page-1">' +
                '  <div class="cs-header">' +
                '    <h2 class="cs-header-title">👑 PRINCEZNINO SRDCE • RYCHLÝ TAHÁK DO KAPSY</h2>' +
                '    <div class="cs-header-sub">Autorská strategická &amp; RPG desková hra • Referenční příručka na herní stůl</div>' +
                '    <div class="cs-meta-bar">' +
                '      <span class="cs-pill">🎯 Cíl: 30 💖 Srdcí Princezny NEBO 2 skolené saně 🐉</span>' +
                '      <span class="cs-pill">💰 Start: 10 000 zl.</span>' +
                '      <span class="cs-pill">🏁 START: +3 000 zl. (+5 000 zl. bez panství)</span>' +
                '    </div>' +
                '  </div>' +

                '  <div class="cs-grid">' +

                // LEVÝ SLOUPEC
                '    <div class="cs-col">' +

                // Box 1: Smyčka tahu
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🔄</span> SMYČKA TAHU VE 4 KROCÍCH</div>' +
                '        <div class="cs-step-list">' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">1</div>' +
                '            <div><strong>Hod kostkou &amp; Chůze:</strong> Standard 1d6 (1–6). <em>Opatrný krok</em> (1–4 políčka). 🐎 Na koni: <em>Klus</em> (+1), <em>Cval</em> (+2, Jízda ≥ 2), <em>Trysk</em> (2d6, Jízda ≥ 4 + kůň).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">2</div>' +
                '            <div><strong>Rozcestí &amp; Sokol:</strong> Hod 1–3 odbočka vlevo/nahoru, 4–6 rovně/vpravo. 🦅 <em>Sokolí navigace</em> (chov sokolů) umožní upravit dopad o ±1 pole (odhalí vlastníky a nájmy).</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">3</div>' +
                '            <div><strong>Akce pole:</strong> Nákup volného panství / platba nájmu majiteli / výcvik u mistra / souboj s rytířem na poli / účast na slavnosti či nákup na trhu.</div>' +
                '          </div>' +
                '          <div class="cs-step-item">' +
                '            <div class="cs-step-num">4</div>' +
                '            <div><strong>Konec tahu:</strong> Zahrání pergamenů z brašny (kapacita 3/3), správa aktivní výstroje v batohu, předání tahu dalšímu hráči.</div>' +
                '          </div>' +
                '        </div>' +
                '      </div>' +

                // Box 2: Čtyři ctnosti
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>⚔️</span> 4 CTNOSTI, MISTŘI &amp; DUELY</div>' +
                '        <div style="font-size:0.75rem; margin-bottom:0.35rem;">' +
                '          <strong>⚔️ Boj:</strong> zbraně, dračí stvůry, duely • <strong>🏇 Jízda:</strong> rychlost, dostihy<br/>' +
                '          <strong>💃 Tanec:</strong> dvorský bál, obratnost • <strong>✨ Charisma:</strong> audience, násobič zisku 💖' +
                '        </div>' +
                '        <div style="font-size:0.73rem; background:rgba(212,175,55,0.08); padding:0.35rem 0.5rem; border-radius:5px; border:1px solid rgba(212,175,55,0.2);">' +
                '          <strong>🎓 Výcvik u Mistra:</strong> Poplatek 1k / 2k / 3k / 4k / 5k zl. Cvičný hod <strong>4, 5, 6</strong> uspěje (+1 stupeň). Velmistr dá <strong>+1,5 💖</strong> a 1 500 zl.<br/>' +
                '          <strong>⚔️ Duel rytířů na poli:</strong> Vstoupíš-li na pole soupeře, můžeš ho vyzvat: Síla rytíře + 1d6. Výhra = zisk zlata nebo <strong>+1 💖</strong>!' +
                '        </div>' +
                '      </div>' +

                // Box 3: Pergameny
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎒</span> BRAŠNA &amp; PERGAMENY (MAX 3 KS)</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚡ Blesková rychlost:</strong> Hod kostkou je automaticky 6 (nebo +3 k doskoku).</div>' +
                '          <div><strong>🕊️ Královská amnestie:</strong> Neplatíš nájem na poli soupeře / záchrana ze Špitálu.</div>' +
                '          <div><strong>🦁 Síla lva:</strong> +3 k bojové síle v libovolném souboji či duelu.</div>' +
                '          <div><strong>🐑 Zlaté rouno:</strong> Zdvojnásobí výběr daní na Startu nebo nájemné od soupeře.</div>' +
                '          <div><strong>🍀 Přízeň štěstěny:</strong> Možnost přehodit jakoukoliv nepříznivou kostku.</div>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // konec levého sloupce

                // PRAVÝ SLOUPEC
                '    <div class="cs-col">' +

                // Box 4: Ceník
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🏰</span> CENÍK PANSTVÍ A ŠLECHTIČTÍ CHOVANCI</div>' +
                '        <table class="cs-table">' +
                '          <thead>' +
                '            <tr><th>Typ panství</th><th>Cena nákupu</th><th>Daň</th><th>Mýtné/Nájem</th><th>Bonus</th></tr>' +
                '          </thead>' +
                '          <tbody>' +
                '            <tr><td><strong>🦅 Sokol (1–4)</strong></td><td>400–1 600 zl.</td><td>—</td><td>20/40/80 %</td><td><strong>+4,0 💖</strong>, navigace ±1</td></tr>' +
                '            <tr><td><strong>🐕 Pes (1–4)</strong></td><td>500–2 000 zl.</td><td>—</td><td>20/40/80 %</td><td><strong>+2,5 💖</strong>, obrana</td></tr>' +
                '            <tr><td><strong>🐎 Kůň (1–4)</strong></td><td>600–2 400 zl.</td><td>—</td><td>20/40/80 %</td><td><strong>+1,5 💖</strong>, Klus/Trysk</td></tr>' +
                '            <tr><td><strong>🏡 Vesnice 1★</strong></td><td>2 000 zl.</td><td>500 zl.</td><td>300 zl.</td><td>Chov: max 3 zvířata</td></tr>' +
                '            <tr><td><strong>🏡 Vesnice 2★/3★</strong></td><td>+1.5k / +1.5k</td><td>900/1400</td><td>500/800</td><td>Vyšší výnosy</td></tr>' +
                '            <tr><td><strong>🏛️ Město</strong></td><td>4 500 zl.</td><td>1 200 zl.</td><td>700 zl.</td><td>Chov: max 2 zvířata</td></tr>' +
                '            <tr><td><strong>🏰 Hrad</strong></td><td>8 000 zl.</td><td>2 500 zl.</td><td>1 500 zl.</td><td><strong>+1 ✨ Charisma</strong></td></tr>' +
                '            <tr><td><strong>⚒️ Živnosti</strong></td><td>2.5k–3.0k</td><td>600–800</td><td>350–400</td><td>Kovárna/Stáje/Krejčí</td></tr>' +
                '          </tbody>' +
                '        </table>' +
                '        <div style="font-size:0.7rem; color:#fde047; margin-top:0.35rem;">' +
                '          🌾 <strong>Hospodářský chov:</strong> 🐑 Ovce (500 zl., daň +120, nájem +50) • 🐖 Prase (600 zl., daň +150, nájem +75) • 🐄 Kráva (800 zl., daň +200, nájem +100)' +
                '        </div>' +
                '      </div>' +

                // Box 5: Slavnosti a Draci
                '      <div class="cs-box">' +
                '        <div class="cs-box-title"><span>🎪</span> SLAVNOSTI, AUDIENCE &amp; DRAČÍ VÝZVY</div>' +
                '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                '          <div><strong>⚔️ Turnaj:</strong> Boj + Jízda + 1d6. Výhra: 1 500 / 800 / 400 zl. + 💖 srdce.</div>' +
                '          <div><strong>💃 Dvorský bál:</strong> Tanec + Charisma + 1d6 (Šaty +2). Výhra: 1 500 / 800 / 400 zl. + 💖.</div>' +
                '          <div><strong>🏇 Královské dostihy:</strong> 2× Jízda + 1d6 (+1 za každého koně). Ceny: až 1 500 zl. + 💖.</div>' +
                '          <div><strong>🐉 Lov draků:</strong> U1 (obtížnost 6–8), U2 (9–11), U3 (12–14). <strong>2 draci = výhra!</strong></div>' +
                '          <div><strong>🏥 Špitál:</strong> Ošetření za 500 zl. nebo hod 5–6 při čekání (vynechání tahu).</div>' +
                '          <div><strong>💸 Bankrot:</strong> Prodej za 50–70 %, král dluh odpustí za cenu ztráty 💖 srdcí.</div>' +
                '        </div>' +
                '      </div>' +

                // Box 6: Zkratky
                '      <div class="cs-box" style="padding:0.45rem 0.65rem;">' +
                '        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.71rem; color:var(--text-muted);">' +
                '          <span>⌨️ <strong>Klávesy:</strong> [Mezerník] Hod/Tah • [T] Tahák • [B] Brašna • [M] Hudba • [Esc] Zavřít</span>' +
                '        </div>' +
                '      </div>' +

                '    </div>' + // konec pravého sloupce

                '  </div>' + // konec cs-grid

                '  <div class="cs-footer">KiDesky: Princeznino srdce © 2026 • Rychlý tahák pravidel na 1 list A4 • ekobio.org/apps/KiDesky</div>' +
                '</div>'; // konec cs-page-1

            // ====================================================================
            // STRANA 2: ROZŠÍŘENÝ LEXIKON (VOLITELNÁ DRUHÁ STRANA A4 - ČEŠTINA)
            // ====================================================================
            if (is2Page) {
                html += '<div class="cs-page cs-page-2">' +
                    '  <div class="cs-header">' +
                    '    <h2 class="cs-header-title">🛡️ REFERENČNÍ PŘÍRUČKA • VÝZBROJ &amp; BESTIÁŘ</h2>' +
                    '    <div class="cs-header-sub">Slabiny nestvůr, zbrojnice, trofeje a kartografická legenda</div>' +
                    '  </div>' +

                    '  <div class="cs-grid">' +

                    // LEVÝ SLOUPEC STRANY 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🐉</span> SLABINY BESTIÍ V BOJI (+2 K SÍLE)</div>' +
                    '        <div style="font-size:0.73rem; display:flex; flex-direction:column; gap:0.35rem;">' +
                    '          <div><strong>🛡️ Plátová zbroj:</strong> Odrazí drtivé údery tupých a těžkých monster (<em>Černý rytíř, Hliněný Golem, Skalní obr, Kyklop</em>).</div>' +
                    '          <div><strong>🗡️ Dřevce / Kopí:</strong> Prokláto klenuté tělo a útok ze vzduchu (<em>Skalní krvežíznivá Harpyje, Lesní Gryf, Mantikora</em>).</div>' +
                    '          <div><strong>💧 Voda / Chlad:</strong> Uhasí žár a oslabí plamenné netvory (<em>Lávový ještěr, Ohnivý drak, Sopečná saň</em>).</div>' +
                    '          <div><strong>🔥 Oheň / Žár:</strong> Roztaví zmrzlé tkáně severských monster (<em>Mrazivý přízrak, Polární drak, Ledový červ</em>).</div>' +
                    '          <div><strong>✨ Svaté relikvie:</strong> Posvěcené světlo spálí temná a hnilobná stvoření (<em>Nemrtvý pán, Stínový drak, Přízrak hvozdu</em>).</div>' +
                    '          <div><strong>💃 Tanec &amp; Klenoty:</strong> Vznešený dojem dojme drahokamové bytosti (<em>Rubínový drak, Zlatý posvátný jelen</em>).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🏆</span> PŘEHLED UNIKÁTNÍCH TROFEJÍ Z LOVU</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.3rem;">' +
                    '          <div><strong>🪶 Ostrý pařát skalní harpyje:</strong> +3 ⚔️ Boj, +2 🏇 Jízda, +1 💃 Tanec (cena 7 500 zl.)</div>' +
                    '          <div><strong>🗿 Šém hliněného Golema:</strong> +4 ⚔️ Boj, +3 ✨ Charisma, -2 💃 Tanec (cena 8 200 zl.)</div>' +
                    '          <div><strong>🐺 Stříbrem kovaný tesák Alfy:</strong> +4 ⚔️ Boj, +2 🏇 Jízda, +1 ✨ Charisma (cena 8 500 zl.)</div>' +
                    '          <div><strong>🐙 Chapadlo z mořských hlubin:</strong> +4 ⚔️ Boj, +2 🏇 Jízda, +3 ✨ Charisma (cena 9 000 zl.)</div>' +
                    '          <div><strong>🩸 Bodák pouštní mantikory:</strong> +4 ⚔️ Boj, +3 🏇 Jízda, +1 ✨ Charisma (cena 9 500 zl.)</div>' +
                    '          <div><strong>💀 Koruna Nemrtvého pána:</strong> +5 ⚔️ Boj, +4 ✨ Charisma (cena 11 000 zl.)</div>' +
                    '          <div><strong>💎 Planoucí srdce Rubínového draka:</strong> +5 ⚔️ Boj, +3 💃 Tanec, +4 ✨ Charisma (cena 14 000 zl.)</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // konec levého sloupce strany 2

                    // PRAVÝ SLOUPEC STRANY 2
                    '    <div class="cs-col">' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🛒</span> ARSENÁL ZBROJNICE &amp; VÝBAVA</div>' +
                    '        <div style="font-size:0.72rem; display:flex; flex-direction:column; gap:0.25rem;">' +
                    '          <div><strong>🗡️ Zbraně:</strong> Lovecká dýka (+1⚔️, 1.2k) • Široký meč (+2⚔️, 2.5k) • Rytířská halapartna (+3⚔️, 4.5k) • Runová čepel (+4⚔️ +1🏇, 7k) • Posvátná čepel (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>🛡️ Zbroje:</strong> Kožená zbroj (+1⚔️ +1🏇, 2k) • Kroužková košile (+2⚔️, 3k) • Plátová zbroj (+3⚔️, 4.5k) • Stříbrný erbovní štít (+4⚔️ +2🏇 +1✨, 7k) • Dračí brnění (+5⚔️ +2✨, 12k).</div>' +
                    '          <div><strong>👗 Šaty &amp; Róby:</strong> Pukléř &amp; samet (+2💃, 2.5k) • Hedvábná róba (+3💃, 4.5k) • Zlatotkané roucho (+4💃 +2✨, 7k).</div>' +
                    '          <div><strong>💍 Klenoty:</strong> Prsten odvahy (+1✨, 2k) • Amulet moudrosti (+2✨, 4k) • Diamantový náhrdelník (+3✨ +1💃, 7k).</div>' +
                    '        </div>' +
                    '      </div>' +

                    '      <div class="cs-box">' +
                    '        <div class="cs-box-title"><span>🗺️</span> KARTOGRAFICKÉ ZKRATKY &amp; LEGENDA</div>' +
                    '        <div style="font-size:0.71rem; display:grid; grid-template-columns:1fr 1fr; gap:0.25rem;">' +
                    '          <div><code>START</code> Startovní brána království</div>' +
                    '          <div><code>OBCHOD</code> Zbrojnice &amp; výkup bance</div>' +
                    '          <div><code>MB, MJ</code> Mistr Boje, Mistr Jízdy</div>' +
                    '          <div><code>MT, MCH</code> Mistr Tance, Mistr Charismatu</div>' +
                    '          <div><code>V1–V10</code> Vesnice (povyšování 1–3★)</div>' +
                    '          <div><code>M1–M5</code> Královská města</div>' +
                    '          <div><code>H1–H2</code> Majestátní hrady (+1✨)</div>' +
                    '          <div><code>S1–S4</code> Šlechtičtí sokoli (+4💖)</div>' +
                    '          <div><code>P1–P4</code> Lovečtí psi (+2.5💖)</div>' +
                    '          <div><code>K1–K4</code> Ušlechtilí koně (+1.5💖)</div>' +
                    '          <div><code>U1–U3</code> Doupata nestvůr a draků</div>' +
                    '          <div><code>NÁHODA</code> Královská truhla &amp; Pergameny</div>' +
                    '        </div>' +
                    '      </div>' +

                    '    </div>' + // konec pravého sloupce strany 2

                    '  </div>' + // konec cs-grid strany 2

                    '  <div class="cs-footer">KiDesky: Princeznino srdce © 2026 • Kompletní referenční příručka (Strana 2/2)</div>' +
                    '</div>'; // konec cs-page-2
            }
        }

        html += '</div>'; // konec cs-container

        body.innerHTML = html;
    },

    
    // --- UNIVERZÁLNÍ LIGHTBOX PRO OBRÁZKY (DRAKY, ZÁMKY, NÁKRESY) ---
    openImageModal: function (imgSrc, title, desc) {
        var m = document.getElementById("image-lightbox-modal");
        var img = document.getElementById("image-lightbox-img");
        var tEl = document.getElementById("image-lightbox-title");
        var cEl = document.getElementById("image-lightbox-caption");
        if (m && img) {
            img.src = imgSrc || "";
            if (tEl) tEl.textContent = title || "Královská ilustrace";
            if (cEl) cEl.textContent = desc || "";
            m.style.display = "flex";
            if (this.updateBodyModalClass) this.updateBodyModalClass();
        }
    },

    
    closeImageModal: function () {
        var m = document.getElementById("image-lightbox-modal");
        if (m) { m.style.display = "none"; if (this.updateBodyModalClass) this.updateBodyModalClass(); }
    },

    
    openSketchModal: function (imgSrc, caption) {
        this.openImageModal(imgSrc, "Archivní ruční nákres z roku 2016", caption);
    },

    
    closeSketchModal: function () {
        this.closeImageModal();
    }
    });
})();
