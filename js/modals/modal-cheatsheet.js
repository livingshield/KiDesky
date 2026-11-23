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
        var tCs = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
        var html = '<div class="cs-container" data-mode="' + this.cheatSheetMode + '">';
        html += tCs("cheatsheet.page1_html", "");
        if (is2Page) {
            html += tCs("cheatsheet.page2_html", "");
        }
        html += '</div>';
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
