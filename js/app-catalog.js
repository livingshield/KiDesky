// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Encyklopedie, Bestiář, Galerie hradů a Balancovací studio
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
// --- PRAVIDLA, ENCYKLOPEDIE, BESTIÁŘ, HRADY A TROFEJE ---
    _rulesBundleLoaded: true,
    rulesCurrentView: "quick",
    rulesVisualMode: "art", // "art" nebo "scheme"

    switchRulesSubtab: function (subtabId) {
        this.rulesSubtab = subtabId;
        var subtabs = ["rules", "dragons", "castles", "trophies", "decorations"];
        for (var i = 0; i < subtabs.length; i++) {
            var s = subtabs[i];
            var el = document.getElementById("rules-subtab-" + s);
            var btn = document.getElementById("rules-subtab-btn-" + s);
            if (el) el.style.display = (s === subtabId) ? "block" : "none";
            if (btn) {
                if (s === subtabId) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }
        if (subtabId === "dragons") this.renderBestiary();
        else if (subtabId === "castles") this.renderCastlesGallery();
        else if (subtabId === "trophies") this.renderTrophiesHall();
        else if (subtabId === "decorations") this.renderDecorationsGallery();
        else if (subtabId === "rules") {
            this.switchRulesView(this.rulesCurrentView || "quick");
            var savedMode = "art";
            try { savedMode = localStorage.getItem("prs_rules_visual_mode") || "art"; } catch(e){}
            this.setRulesVisualMode(savedMode);
        }
    },

    // --- PŘEPÍNÁNÍ VRSTEV PRAVIDEL (Rychlý start / Průvodce / Tabulky / Slovníček / Atlas) ---
    switchRulesView: function (viewId) {
        this.rulesCurrentView = viewId;
        var views = ["quick", "guide", "tables", "glossary", "atlas"];
        for (var i = 0; i < views.length; i++) {
            var v = views[i];
            var secEl = document.getElementById("rules-view-" + v);
            var btnEl = document.getElementById("btn-rules-view-" + v);
            if (secEl) secEl.style.display = (v === viewId) ? "block" : "none";
            if (btnEl) {
                if (v === viewId) btnEl.classList.add("active");
                else btnEl.classList.remove("active");
            }
        }
        if (viewId === "guide" && typeof this.renderRuleGuide === "function") {
            this.renderRuleGuide();
        }
        if (viewId === "glossary" && typeof this.renderGlossary === "function") {
            this.renderGlossary();
        }
        if (viewId === "atlas" && typeof this.renderTilesAtlas === "function") {
            this.renderTilesAtlas();
        }
    },

    // --- PŘEPÍNÁNÍ VIZUÁLNÍHO REŽIMU: SCHÉMA VS. ILUSTRACE ---
    setRulesVisualMode: function (mode) {
        this.rulesVisualMode = (mode === "scheme") ? "scheme" : "art";
        try { localStorage.setItem("prs_rules_visual_mode", this.rulesVisualMode); } catch (e) { }

        var container = document.getElementById("rules-subtab-rules");
        if (container) {
            container.classList.remove("rules-mode-art", "rules-mode-scheme");
            container.classList.add("rules-mode-" + this.rulesVisualMode);
        }

        var btnArt = document.getElementById("btn-rules-mode-art");
        var btnScheme = document.getElementById("btn-rules-mode-scheme");
        if (btnArt) {
            if (this.rulesVisualMode === "art") {
                btnArt.classList.add("active");
                btnArt.textContent = "🎨 Malovaný (aktivní)";
            } else {
                btnArt.classList.remove("active");
                btnArt.textContent = "🎨 Malovaný";
            }
        }
        if (btnScheme) {
            if (this.rulesVisualMode === "scheme") {
                btnScheme.classList.add("active");
                btnScheme.textContent = "📐 Schéma (aktivní)";
            } else {
                btnScheme.classList.remove("active");
                btnScheme.textContent = "📐 Schéma";
            }
        }
    },

    // --- ROZBALOVACÍ AKORDEONY V PRŮVODCI ---
    toggleRuleAccordion: function (id) {
        var el = document.getElementById("rule-acc-" + id);
        if (el) {
            el.classList.toggle("open");
        }
    },

    expandAllRuleAccordions: function (open) {
        var accs = document.querySelectorAll("#rules-view-guide .rule-accordion");
        accs.forEach(function (acc) {
            if (open) acc.classList.add("open");
            else acc.classList.remove("open");
        });
    },

    filterRulesTopics: function (query) {
        var q = (query || "").trim().toLowerCase();
        var accs = document.querySelectorAll("#rules-view-guide .rule-accordion");
        accs.forEach(function (acc) {
            if (!q) {
                acc.style.display = "";
            } else {
                var text = acc.textContent.toLowerCase();
                if (text.indexOf(q) !== -1) {
                    acc.style.display = "";
                    acc.classList.add("open");
                } else {
                    acc.style.display = "none";
                }
            }
        });
    },

    // --- ATLAS VŠECH TYPŮ DLAŽDIC HERNÍ DESKY ---
    renderTilesAtlas: function () {
        var container = document.getElementById("rules-atlas-grid-container");
        if (!container) return;

        var tileDefinitions = [
            {
                code: "START",
                name: "Královský START",
                cat: "Speciální",
                img: "assets/tiles/start.webp",
                art: "assets/tiles/castle.webp",
                cost: "—",
                action: "Žold <strong>+3 000 zl.</strong> (nemajetní bezzemci <strong>+5 000 zl.</strong>). Šlechtici, majitelé Města/Hradu nebo zkušení tanečníci (Tanec ≥ 2 a šaty) navíc získávají <strong>audienci u krále (+0,5 až +1,0 💖)</strong>.",
                tip: "Využij včasný zisk šatů k čerpání královské přízně při každém oběhu plánu."
            },
            {
                code: "VESNICE",
                name: "Poddanská vesnice (V1–V12)",
                cat: "Panství",
                img: "assets/tiles/village.webp",
                art: "assets/tiles/village.webp",
                cost: "1 500 zl.",
                action: "Koupě panství a výběr nájmu (100–300 zl.) od projíždějících rytířů. Možnost rozvoje: 1★ Vesnice → 2★ Městečko (+1 500 zl.) → 3★ Velká osada (+1 500 zl.). Plně rozvinutá vesnice dává trvale <strong>+0,5 💖</strong> a chová dobytek.",
                tip: "Vesnice jsou základem stabilního příjmu. Na 3★ generují vysoký nájem a automatická stáda."
            },
            {
                code: "MĚSTO",
                name: "Královské město (M1–M4)",
                cat: "Panství",
                img: "assets/tiles/town.webp",
                art: "assets/tiles/town.webp",
                cost: "4 000 zl.",
                action: "Bohaté sídlo s vysokým nájmem (500 zl.) a stálou prestiží: majiteli uděluje trvale <strong>+0,5 💖</strong> a přináší <strong>+1 200 zl.</strong> při návštěvě Výběrčího daní.",
                tip: "Město rozšiřuje kapacitu stád o +2 a zaručuje královskou audienci na STARTu."
            },
            {
                code: "HRAD",
                name: "Šlechtický hrad (H1–H4)",
                cat: "Panství",
                img: "assets/tiles/castle.webp",
                art: "assets/tiles/castle.webp",
                cost: "7 000 zl.",
                action: "Vrchol feudální moci: trvale <strong>+1,0 💖</strong> a <strong>+1 Charisma</strong> pro majitele! Nájem 1 000 zl., výnos u Výběrčího daní činí celých <strong>+2 500 zl.</strong>",
                tip: "Nejrychlejší způsob, jak si trvale pojistit srdce a získat převahu na královském dvoře."
            },
            {
                code: "KŮŇ",
                name: "Chov koní (K1–K12)",
                cat: "Zvířata",
                img: "assets/tiles/kun.webp",
                art: "assets/tiles/kun.webp",
                cost: "600 × úroveň zl.",
                action: "Koupě koně. Zpřístupňuje <strong>koňský pohyb (klus, cval, trysk)</strong>, umožňuje obranu obratností v duelech a je nutnou podmínkou účasti ve <strong>Velkém závodě</strong>.",
                tip: "Kůň je klíč k rychlému pohybu po mapě. V kombinaci se psem a sokolem tvoří Chovnou sadu (+1,5 💖)."
            },
            {
                code: "PES",
                name: "Lovecký pes (P1–P12)",
                cat: "Zvířata",
                img: "assets/tiles/pes.webp",
                art: "assets/tiles/pes.webp",
                cost: "500 × úroveň zl.",
                action: "Koupě loveckého psa. Věrný společník ti dává taktickou výhodu v aréně draků – při těsné prohře o 1–2 body získáš <strong>🎲 Taktický reroll 1 kostky</strong> zdarma!",
                tip: "Pes ti zachrání život v aréně draků a chrání tě před převozem do Lazaretu."
            },
            {
                code: "SOKOL",
                name: "Lovecký sokol (S1–S12)",
                cat: "Zvířata",
                img: "assets/tiles/sokol.webp",
                art: "assets/tiles/sokol.webp",
                cost: "400 × úroveň zl.",
                action: "Koupě dravce. Umožňuje <strong>Sokolí navigaci (±1 pole)</strong> při taktickém manévrování pěšky, čímž ti dovolí přesně dosednout na cíl nebo se vyhnout pasti.",
                tip: "Sokolí navigace nefunguje při plném koňském cvalu a trysku – kůň letí kupředu příliš rychle."
            },
            {
                code: "STAJE",
                name: "Královské stáje & Dobytčí trh",
                cat: "Ekonomika",
                img: "assets/tiles/kun.webp",
                art: "assets/tiles/kun.webp",
                cost: "Dle druhu",
                action: "Nákup hospodářského dobytka: <strong>🐑 Ovce (500 zl.)</strong>, <strong>🐖 Prase (600 zl.)</strong> a <strong>🐄 Skot (800 zl.)</strong>. Stáda zvyšují nájmy vesnic a generují pasivní výnos u Výběrčího daní.",
                tip: "Kapacita stád závisí na počtu tvých vesnic a měst. Stáje samy o sobě přidávají +4 místa."
            },
            {
                code: "MISTR",
                name: "Sídlo Mistra (MB, MJ, MT, MCH, VM)",
                cat: "Výcvik",
                img: "assets/tiles/master.webp",
                art: "assets/tiles/master.webp",
                cost: "1 000–5 000 zl.",
                action: "Trénink ctností (Boj, Jízda, Tanec, Charisma). Hod kostkou: 1–3 = nepřijat, 4–6 = přijat k výcviku. Úspěšný trénink uděluje <strong>Pečeť mistra</strong>. 3 různé pečetě = <strong>Rytířská záštita</strong>!",
                tip: "Velmistr (VM) učí jakoukoliv vlastnost dle tvé volby. Investuj do své primární ctnosti co nejdříve."
            },
            {
                code: "FESTIVAL",
                name: "Královská slavnost (♡ ♡ ♡)",
                cat: "Soutěž",
                img: "assets/tiles/festival.webp",
                art: "assets/tiles/festival.webp",
                cost: "—",
                action: "Turnaj (Boj + Jízda), Zámecký ples (Tanec + Charisma) nebo Velký závod (Jízda + koně). Hlavní zdroj srdcí ve hře! Vítěz získá <strong>až +5 💖 a 1 200 zl.</strong>",
                tip: "Při účasti méně než 2 rytířů se slavnost nekoná, ale pořadatel dostane útěchu +800 zl. a +0,5 💖."
            },
            {
                code: "U1",
                name: "Běžná stvůra (Lesní dravci)",
                cat: "Lov",
                img: "assets/tiles/u1_zver.webp",
                art: "assets/tiles/u1_zver.webp",
                cost: "—",
                action: "Lov vlků, medvědů a divočáků. Vítězství přináší <strong>1 000–2 500 zl.</strong> a <strong>+0,5 až +1,5 💖</strong>. Skvělý bezpečný trénink pro začínající válečníky.",
                tip: "Použij Taktický postoj: Opatrná obrana tě ochrání před zraněním i v případě prohry."
            },
            {
                code: "U2",
                name: "Mocné monstrum (Bájní netvoři)",
                cat: "Lov",
                img: "assets/tiles/u2_monstrum.webp",
                art: "assets/tiles/u2_monstrum.webp",
                cost: "—",
                action: "Boj s Chimérami, Trolly a Golemy. Odměna <strong>2 600 zl.</strong>, <strong>+1,5 až +2,5 💖</strong> a 65% šance na unikátní trofej. Lze uplatnit taktický ústup za 400 zl.",
                tip: "Před bojem zkontroluj slabinu monstra v Bestiáři pro automatický bonus +2 k síle."
            },
            {
                code: "U3",
                name: "Dračí sluj (Legendární draci)",
                cat: "Drakobijci",
                img: "assets/tiles/u3_drak.webp",
                art: "assets/tiles/u3_drak.webp",
                cost: "—",
                action: "Souboj o čest s jedním z 20 unikátních draků! Odměna <strong>6 000 zl.</strong>, <strong>+2,5 až +5,0 💖</strong> a garantovaná dračí trofej. <strong>Skolení 2 draků = okamžitá výhra v celé hře!</strong>",
                tip: "Taktický ústup z dračí sluje stojí 800 zl. Pokud nemáš dostatečný Boj a zbraně, raději ustup."
            },
            {
                code: "MERCHANT",
                name: "Královský obchodník",
                cat: "Trh",
                img: "assets/tiles/merchant.webp",
                art: "assets/tiles/merchant.webp",
                cost: "Dle nákupu",
                action: "Nákup balíčků výstroje (zbraně, zbroje, plesové šaty, klenoty). Možnost dobrovolného odprodeje majetku bance (věci za 50 % ceny, nemovitosti za 100 %).",
                tip: "Nakupuj přednostně věci, které odpovídají tvé zvolené cestě k vítězství."
            },
            {
                code: "KOVARNA",
                name: "Cechovní kovárna",
                cat: "Trh",
                img: "assets/tiles/kovarna.webp",
                art: "assets/tiles/kovarna.webp",
                cost: "Dle zbraně",
                action: "Výroba a nákup mečů, seker, kopí a brnění. Zbraně zvyšují Boj a poskytují taktickou výhodu proti specifickým drakům.",
                tip: "Kopí platí na Vodní draky, těžké brnění na ohnivé plameny."
            },
            {
                code: "KREJCI",
                name: "Zámecký krejčí",
                cat: "Trh",
                img: "assets/tiles/krejci.webp",
                art: "assets/tiles/krejci.webp",
                cost: "Dle oděvu",
                action: "Ušití dvorských šatů a brokátových rouch. Poskytuje bonusy k Tanci a Charismatu, zásadní pro vítězství na Zámeckém plese.",
                tip: "Šaty ti na Zámeckém plese přinášejí automatický bonus +2 ke skóre."
            },
            {
                code: "TAVERN",
                name: "Krčma U Zlatého korbelu",
                cat: "Služby",
                img: "assets/tiles/tavern.webp",
                art: "assets/tiles/tavern.webp",
                cost: "500 zl.",
                action: "Odpočinek a pohoštění. Runda medoviny za 500 zl. Pro zkušené tanečníky (Tanec ≥ 2) přináší dvorní obdiv a zisk <strong>+1,0 💖</strong> za okouzlující zábavu.",
                tip: "Diplomaté a tanečníci zde proměňují drobné mince v cenná srdce."
            },
            {
                code: "TAX",
                name: "Výběrčí daní",
                cat: "Ekonomika",
                img: "assets/tiles/tax.webp",
                art: "assets/tiles/tax.webp",
                cost: "—",
                action: "Výplata feudálních rent: Vesnice (500/900/1 400 zl.), Města (1 200 zl.), Hrady (2 500 zl.) a dobytek (ovce +120, prase +150, kráva +200 zl.).",
                tip: "Rytíř s Rytířskou záštitou (3 pečetě mistrů) je navíc osvobozen od všech plateb královských desátků."
            },
            {
                code: "PRISON",
                name: "Hradní šatlava",
                cat: "Trest",
                img: "assets/tiles/prison.webp",
                art: "assets/tiles/prison.webp",
                cost: "Kauce 1 000 zl.",
                action: "Uvěznění na 1 kolo. Možnosti záchrany: zaplacení kauce 1 000 zl., úspěšný útěk (hod kostkou 6), nebo okamžité zahrání svitku <strong>Královská amnestie</strong> z brašny.",
                tip: "Pokud máš v brašně svitek Královské amnestie, jsi propuštěn okamžitě bez ztráty tahu i peněz."
            },
            {
                code: "HOSPITAL",
                name: "Královský lazaret",
                cat: "Léčení",
                img: "assets/tiles/hospital.webp",
                art: "assets/tiles/hospital.webp",
                cost: "1 000 zl.",
                action: "Zotavení po těžkém zranění. Hojivý elixír za 1 000 zl. trvale zvýší Boj o +1 (pokud Boj < 2), udělí <strong>+0,5 💖 za statečnost</strong> a ochranný amulet proti dalšímu převozu!",
                tip: "Držitelé Rytířské záštity (3 pečetě mistrů) jsou v lazaretu ošetřeni zcela zdarma."
            },
            {
                code: "JESTER",
                name: "Dvorní Kejklíř & Šašek",
                cat: "Speciální",
                img: "assets/tiles/jester.webp",
                art: "assets/tiles/jester.webp",
                cost: "2 000 zl. (Kejklíř)",
                action: "Zábava u dvora. Kejklíř skládá posměšnou baladu na protivníky; Šašek odměňuje zkušené tanečníky královským darem <strong>+200 zl. × stupeň Tance</strong>.",
                tip: "Vysoký Tanec promění návštěvu Šaška ve štědrou královskou rentu."
            },
            {
                code: "CHANCE",
                name: "Náhoda & Královský dar",
                cat: "Osud",
                img: "assets/tiles/chance.webp",
                art: "assets/tiles/chance.webp",
                cost: "—",
                action: "Tažení osudové karty ze zemského balíčku: královské dotace, turnajové výzvy, lapkové, zkoušky jezdectví i nález <strong>taktických pergamenů do brašny rytíře</strong>.",
                tip: "Taktické pergameny můžeš uschovat do brašny (kapacita 3) a zahrát je kdykoliv ve svém tahu."
            }
        ];

        this.atlasTileDefinitions = tileDefinitions;

        var cardTitleHint = isEn ? "Click to inspect large tile illustration and full rules" : "Kliknutím otevřeš velký detail s ilustrací a přesnými pravidly";
        var priceLabel = isEn ? "Cost: " : "Cena: ";

        var html = '<div class="atlas-tiles-grid">';
        for (var i = 0; i < tileDefinitions.length; i++) {
            var t = tileDefinitions[i];
            html += '<div class="atlas-tile-card" onclick="PRS_App.openTileAtlasModal(\'' + t.code + '\')" style="cursor:pointer;" title="' + cardTitleHint + '">' +
                '<div style="display:flex; align-items:center; gap:0.75rem;">' +
                '  <img src="' + t.img + '" alt="' + t.name + '" class="atlas-tile-thumb" onerror="this.src=\'assets/tiles/castle.webp\';" />' +
                '  <div style="flex:1;">' +
                '    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.35rem;">' +
                '      <span style="font-size:0.72rem; font-weight:700; color:var(--gold); background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.3); border-radius:4px; padding:1px 6px;">' + t.code + '</span>' +
                '      <span style="font-size:0.75rem; color:#94a3b8;">' + t.cat + '</span>' +
                '    </div>' +
                '    <div style="font-weight:700; font-size:0.92rem; color:var(--gold-light); margin-top:2px;">' + t.name + '</div>' +
                '    <div style="font-size:0.76rem; color:#cbd5e1;">' + priceLabel + '<strong style="color:#fde68a;">' + t.cost + '</strong></div>' +
                '  </div>' +
                '</div>' +
                '<div style="font-size:0.82rem; color:#e2e8f0; line-height:1.45; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.45rem;">' + t.action + '</div>' +
                '<div style="font-size:0.78rem; color:#93c5fd; background:rgba(59,130,246,0.1); border-left:3px solid #60a5fa; padding:0.35rem 0.55rem; border-radius:0 4px 4px 0;"><strong>💡 Tip:</strong> ' + t.tip + '</div>' +
                '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
    },

    openTileAtlasModal: function (code) {
        var modal = document.getElementById("tile-atlas-modal");
        var content = document.getElementById("tile-atlas-modal-content") || document.getElementById("tile-atlas-modal-body");
        if (!modal) {
            console.error("tile-atlas-modal element not found");
            return;
        }

        if (!this.atlasTileDefinitions || this.atlasTileDefinitions.length === 0) {
            this.renderTilesAtlas();
        }
        if (!this.atlasTileDefinitions) return;

        var t = null;
        for (var i = 0; i < this.atlasTileDefinitions.length; i++) {
            if (this.atlasTileDefinitions[i].code === code) {
                t = this.atlasTileDefinitions[i];
                break;
            }
        }
        if (!t) return;

        var tCatMod = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
        var codeLabel = tCatMod("ui.catalog.tile_code_label", "Kód: ");
        var catLabel = tCatMod("ui.catalog.tile_category_label", "Kategorie: ");
        var costLabel = tCatMod("ui.catalog.tile_cost_label", "Pořizovací hodnota / Náklad: ");
        var tipLabel = tCatMod("ui.catalog.advisor_tip_label", "<strong>👑 Doporučení Královského rádce:</strong> ");
        var guideBtn = tCatMod("ui.catalog.open_guide_btn", "📖 Otevřít kapitolu v Průvodci");
        var closeBtn = tCatMod("ui.catalog.close_btn", "✕ Zavřít");

        if (content) {
            content.innerHTML = '<div class="tile-atlas-modal-box">' +
                '  <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; flex-shrink:0;">' +
                '    <img src="' + t.img + '" alt="' + t.name + '" class="tile-atlas-modal-img" onerror="this.src=\'assets/tiles/castle.webp\';" />' +
                '    <span style="font-size:0.75rem; font-weight:700; color:var(--gold); background:rgba(212,175,55,0.18); border:1px solid rgba(212,175,55,0.45); border-radius:6px; padding:2px 10px;">' + codeLabel + t.code + '</span>' +
                '  </div>' +
                '  <div style="flex:1; min-width:0;">' +
                '    <div style="font-size:0.78rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">' + catLabel + t.cat + '</div>' +
                '    <h3 style="margin:0 0 0.35rem; color:var(--gold-light); font-family:\'Cinzel\',serif; font-size:1.25rem;">' + t.name + '</h3>' +
                '    <div style="font-size:0.86rem; color:#fde68a; margin-bottom:0.75rem;">' + costLabel + '<strong>' + t.cost + '</strong></div>' +
                '    <div style="background:rgba(0,0,0,0.45); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.85rem 1rem; font-size:0.88rem; line-height:1.55; color:#e2e8f0; margin-bottom:0.75rem;">' +
                '      ' + t.action +
                '    </div>' +
                '    <div style="font-size:0.83rem; color:#93c5fd; background:rgba(59,130,246,0.12); border-left:4px solid #60a5fa; padding:0.55rem 0.8rem; border-radius:0 6px 6px 0; margin-bottom:0.85rem; line-height:1.45;">' +
                '      ' + tipLabel + t.tip +
                '    </div>' +
                '    <div style="display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap;">' +
                '      <button class="btn-gold-lg" style="font-size:0.8rem; padding:0.35rem 0.85rem;" onclick="PRS_App.closeTileAtlasModal(); PRS_App.openRulesHelpForTile(\'' + t.code + '\', \'' + t.code + '\');">' + guideBtn + '</button>' +
                '      <button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.85rem;" onclick="PRS_App.closeTileAtlasModal();">' + closeBtn + '</button>' +
                '    </div>' +
                '  </div>' +
                '</div>';
        }

        modal.style.display = "flex";
    },

    closeTileAtlasModal: function () {
        var modal = document.getElementById("tile-atlas-modal");
        if (modal) modal.style.display = "none";
    },

    // --- FILTROVÁNÍ REFERENČNÍ TABULKY PŘEDMĚTŮ & TROFEJÍ ---
    setRulesItemsFilter: function (filter) {
        this.rulesItemsFilter = filter;
        var btns = ["all", "basic", "trophies"];
        for (var b = 0; b < btns.length; b++) {
            var btn = document.getElementById("btn-items-filter-" + btns[b]);
            if (btn) {
                if (btns[b] === filter) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }
        this.renderRulesItemsTable();
    },

    renderRulesItemsTable: function () {
        var itemsBox = document.getElementById("catalog-items-table");
        if (!itemsBox) return;

        var filter = this.rulesItemsFilter || "all";
        var allItems = window.PRS_ITEMS || [];
        var filtered = [];

        if (filter === "basic") {
            filtered = allItems.filter(function (it) { return it.slot !== "trophy"; });
        } else if (filter === "trophies") {
            filtered = allItems.filter(function (it) { return it.slot === "trophy"; });
        } else {
            filtered = allItems;
        }

        var tCat = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var curr = tCat("ui.currency", null, "zl.");
        var locale = tCat("ui.locale", null, "cs-CZ");
        var rows = "";
        for (var i = 0; i < filtered.length; i++) {
            var it = filtered[i];
            var tierTag = "";
            if (it.slot === "trophy") {
                var tLabel = (it.tier === 3) ? tCat("ui.catalog.trophy_tier3_label", null, "Dračí trofej U3") : tCat("ui.catalog.trophy_tier_label", { tier: it.tier }, "Trofej U" + it.tier);
                var tBg = (it.tier === 3)
                    ? "background:linear-gradient(135deg, #b91c1c, #7f1d1d); border-color:#f87171;"
                    : (it.tier === 2 ? "background:linear-gradient(135deg, #7c3aed, #4c1d95); border-color:#c084fc;" : "background:linear-gradient(135deg, #15803d, #14532d); border-color:#86efac;");
                tierTag = "<span class='tier-badge' style='" + tBg + " font-size:0.7rem; padding:2px 7px;'>" + tLabel + "</span>";
            } else {
                var itTierLabel = tCat("ui.catalog.tier_item_label", { tier: it.tier }, "Věci " + it.tier);
                tierTag = "<span class='tier-badge tier-" + it.tier + "'>" + itTierLabel + "</span>";
            }

            var nameExtra = it.source ? (" <small style='color:#94a3b8; font-weight:normal; display:block; font-size:0.75rem;'>" + tCat("ui.catalog.source_label", null, "Zdroj: ") + this.escapeHtml(it.source) + "</small>") : "";

            rows += "<tr>" +
                "<td>" + tierTag + "</td>" +
                "<td>" + it.icon + " <strong>" + this.escapeHtml(it.name) + "</strong>" + nameExtra + "</td>" +
                "<td>" + (it.combat ? (it.combat > 0 ? "+" + it.combat : it.combat) : "—") + "</td>" +
                "<td>" + (it.riding ? (it.riding > 0 ? "+" + it.riding : it.riding) : "—") + "</td>" +
                "<td>" + (it.dance ? (it.dance > 0 ? "+" + it.dance : it.dance) : "—") + "</td>" +
                "<td>" + (it.charisma ? (it.charisma > 0 ? "+" + it.charisma : it.charisma) : "—") + "</td>" +
                "<td><strong>" + (it.price ? it.price.toLocaleString(locale) + " " + curr : "—") + "</strong></td>" +
                "</tr>";
        }
        itemsBox.innerHTML = rows;
    },

    filterGlossaryTerms: function (query) {
        var q = (query || "").trim().toLowerCase();
        var items = document.querySelectorAll("#rules-view-glossary .glossary-term-item");
        items.forEach(function (el) {
            if (!q) {
                el.style.display = "";
            } else {
                var text = el.textContent.toLowerCase();
                el.style.display = (text.indexOf(q) !== -1) ? "" : "none";
            }
        });
    },

// --- KONEC PRAVIDEL A ENCYKLOPEDIE ---

    renderRulesAndCatalog: function () {
        // 1. Základní katalog výbavy & trofejí
        this.renderRulesItemsTable();

        // 2. Bestiář, hrady a trofeje
        this.renderBestiary();
        this.renderCastlesGallery();
        this.renderTrophiesHall();
        this.renderDecorationsGallery();
        this.switchRulesView(this.rulesCurrentView || "quick");
        this.updateFestivalCalculator();
    },

    // --- DRAČÍ BESTIÁŘ (20 DRAKŮ) ---
    setBestiaryTier: function (tier) {
        this.bestiaryActiveTier = tier;
        var btns = document.querySelectorAll(".bestiary-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-tier") === tier) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderBestiary();
    },

    renderBestiary: function () {
        var container = document.getElementById("bestiary-grid-container");
        if (!container || !window.PRS_QUESTS) return;

        var tierFilter = this.bestiaryActiveTier || "all";
        var listToFilter = [];

        if (tierFilter === "u1") {
            listToFilter = window.PRS_QUESTS.U1 || [];
        } else if (tierFilter === "u2") {
            var fullU2 = window.PRS_QUESTS.U2 || [];
            listToFilter = fullU2.slice(0, 16);
        } else if (tierFilter === "u2_epic") {
            var fullU2b = window.PRS_QUESTS.U2 || [];
            listToFilter = fullU2b.slice(16);
        } else {
            listToFilter = window.PRS_QUESTS.U3 || [];
        }

        var filtered = listToFilter.filter(function (d) {
            if (tierFilter === "all" || tierFilter === "u1" || tierFilter === "u2" || tierFilter === "u2_epic") return true;
            return d.tierGroup === tierFilter;
        });

        var tBest = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var curr = tBest("ui.currency", null, "zl.");
        var locale = tBest("ui.locale", null, "cs-CZ");
        var rewardLabel = tBest("ui.catalog.reward", null, "Odměna:");
        var heartsLabel = tBest("ui.catalog.hearts", null, "Srdcí");
        var diffLabel = tBest("ui.catalog.difficulty", null, "Obtížnost");
        var weaknessLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.weakness")) || "Využitelná slabina (+2 k síle):";
        var trophyLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.trophy_after_defeat")) || "Trofej po porážce:";
        var flipLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.flip_view")) || "🔄 Otočit směr pohledu draka";

        var wMap = {
            dogs: "Lovečtí psi odlákají pozornost (+2 k síle se psy v chovu nebo taktikou smečky)",
            falcon: "Sokol útočí na zranitelná místa (+2 k síle se sokolem v chovu)",
            animals: "Pes i sokol matou draka v boji (+2 k síle při vlastnictví psa a sokola)",
            horse: "Útok z plné jízdy na koni (+2 k síle s koněm v chovu nebo taktikou nájezdu)",
            dance: "Hravého draka lze okouzlit tancem (+2 k síle s Tancem ≥ 2 nebo slavnostním šatem)",
            elixir: "Hojivý lektvar neutralizuje dech (+2 k síle s lektvarem / taktikou pojistky)",
            water_armor: "Vodní perla či pevná zbroj tlumí žár (+2 k síle se zbrojí či vodní relikvií)",
            ice: "Mrazivé zbraně oslabují sopečného draka (+2 k síle s mrazivou zbraní / relikvií)",
            fire: "Oheň taví led a krystaly (+2 k síle s ohnivou zbraní / relikvií / tématem)",
            armor: "Pevná rytířská zbroj svádí blesky (+2 k síle s nasazenou zbrojí)",
            light: "Posvěcené relikvie rozhánějí temnotu (+2 k síle se světelnou relikvií / klenotem)",
            charisma: "Vznešené charisma draka uchlácholí (+2 k síle s Charismatem ≥ 3 nebo klenotem)",
            holy: "Svaté relikvie zaženou nemrtvého (+2 k síle s posvátnou relikvií)",
            courage: "Pevná vůle a odvaha pronikne mlhou (+2 k síle s Bojem ≥ 3 či Jízdou ≥ 3)",
            mastery: "Zkouška všech 4 ctností (+2 k síle při všech ctnostech ≥ 2)",
            animals_and_spear: "Koordinace koně, zvířat a kopí (+2 k síle s koněm, zvířaty a kopím)"
        };

        var wMapEn = {
            dogs: "Hunting hounds distract attention (+2 strength with hounds or pack tactics)",
            falcon: "Hunting falcon strikes vulnerable spots (+2 strength with falcon)",
            animals: "Hounds and falcon confuse dragon in battle (+2 strength with hound & falcon)",
            horse: "Mounted charge at full gallop (+2 strength with steed or charge tactic)",
            dance: "Playful dragon enchanted by noble dance (+2 strength with Dance ≥ 2 or court robe)",
            elixir: "Healing elixir neutralizes breath (+2 strength with elixir / insurance tactic)",
            water_armor: "Water pearl or heavy plate dampens heat (+2 strength with armor or water relic)",
            ice: "Glacial weapons counter volcanic dragon (+2 strength with frost weapon / relic)",
            fire: "Fire melts ice and crystals (+2 strength with fire weapon / relic / theme)",
            armor: "Heavy plate armor grounds lightning strikes (+2 strength with equipped armor)",
            light: "Consecrated relics dispel darkness (+2 strength with light relic / jewel)",
            charisma: "Noble charisma pacifies the dragon (+2 strength with Charisma ≥ 3 or jewel)",
            holy: "Holy relics banish undead (+2 strength with sacred relic)",
            courage: "Steadfast courage cuts through mist (+2 strength with Combat ≥ 3 or Riding ≥ 3)",
            mastery: "Mastery test of all 4 virtues (+2 strength with all virtues ≥ 2)",
            animals_and_spear: "Coordinating horse, animals, and spear (+2 strength with steed, animals, and spear)"
        };
        var activeWMap = isEn ? wMapEn : wMap;

        var html = [];
        for (var i = 0; i < filtered.length; i++) {
            var d = filtered[i];
            var tierTitle = (d.id && d.id.indexOf("u1_") === 0) ? (isEn ? "Tier U1 (Forest Beasts)" : "Tier U1 (Lesní zvěř)") :
                            (d.id && d.id.indexOf("u2_") === 0 && d.difficulty >= 12 ? (isEn ? "Tier U2+ (Mythic Titan)" : "Tier U2+ (Mýtický titán)") :
                            (d.id && d.id.indexOf("u2_") === 0 ? (isEn ? "Tier U2 (Mythical Monster)" : "Tier U2 (Bájné monstrum)") :
                            (d.tierGroup === "young" ? (isEn ? "Tier A (Young Dragon)" : "Tier A (Mladý drak)") :
                            (d.tierGroup === "elemental" ? (isEn ? "Tier B (Elemental Dragon)" : "Tier B (Živlový drak)") : (isEn ? "Tier C (Legendary Boss)" : "Tier C (Legendární Boss)")))));
            var tierColor = (d.id && d.id.indexOf("u1_") === 0) ? "#10b981" :
                            (d.id && d.id.indexOf("u2_") === 0 && d.difficulty >= 12 ? "#ec4899" :
                            (d.id && d.id.indexOf("u2_") === 0 ? "#f59e0b" :
                            (d.tierGroup === "young" ? "#60a5fa" :
                            (d.tierGroup === "elemental" ? "#a855f7" : "#e11d48"))));
            var trophyDef = d.trophyId && window.PRS_TROPHIES ? window.PRS_TROPHIES[d.trophyId] : null;

            html.push('<div class="bestiary-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + d.img + '\', \'' + this.escapeHtml(d.name) + '\', \'' + this.escapeHtml(d.desc) + '\')" title="Klikni pro zvětšení ilustrace">');
            html.push('    <img src="' + d.img + '" alt="' + this.escapeHtml(d.name) + '" class="card-media-img" loading="lazy" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.webp\';" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + tierColor + '; color:' + tierColor + ';">' + tierTitle + '</span>');
            html.push('    <span class="card-media-badge-right">⚔️ ' + diffLabel + ' ' + d.difficulty + '</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + d.icon + ' ' + this.escapeHtml(d.name) + '</div>');
            html.push('    <div style="font-size:0.84rem; color:var(--gold-light); margin-bottom:0.4rem; font-weight:bold;">');
            html.push('      💰 ' + rewardLabel + ' +' + d.gold.toLocaleString(locale) + ' ' + curr + ' &nbsp;|&nbsp; 💖 +' + d.hearts + ' ' + heartsLabel + '</div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(d.desc) + '</div>');

            if (d.weakness && activeWMap[d.weakness]) {
                html.push('    <div class="card-callout-box" style="border-color:rgba(253,224,71,0.35); color:#fef08a; background:rgba(212,175,55,0.12); font-size:0.8rem;">');
                html.push('      🎯 <strong>' + weaknessLabel + '</strong> ' + activeWMap[d.weakness]);
                html.push('    </div>');
            }

            if (trophyDef) {
                var statsBonus = [];
                if (trophyDef.combat) statsBonus.push("⚔️+" + trophyDef.combat);
                if (trophyDef.riding) statsBonus.push("🏇+" + trophyDef.riding);
                if (trophyDef.dance) statsBonus.push("💃+" + trophyDef.dance);
                if (trophyDef.charisma) statsBonus.push("✨+" + trophyDef.charisma);
                html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.4); color:var(--gold-light); margin-top:4px;">');
                html.push('      🏆 <strong>' + trophyLabel + '</strong> ' + trophyDef.icon + ' ' + this.escapeHtml(trophyDef.name) + ' (' + statsBonus.join(" ") + ')');
                html.push('    </div>');
            }

            if (d.canFlip || d.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this)" style="font-size:0.75rem; padding:4px 8px; margin-top:0.4rem; width:100%; cursor:pointer;">' + flipLabel + '</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- GALERIE HRADŮ (10 TEMATICKÝCH ZÁMKŮ) ---
    renderCastlesGallery: function () {
        var container = document.getElementById("castles-grid-container");
        if (!container || !window.PRS_CASTLES) return;

        var tCas = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var curr = tCas("ui.currency", null, "zl.");
        var locale = tCas("ui.locale", null, "cs-CZ");
        var elemLabel = tCas("ui.catalog.element_label", null, "Živel:");
        var priceLabel = tCas("ui.catalog.price_label", null, "Cena:");
        var benefitHtml = tCas("ui.catalog.castle_benefit", null, tCas("ui.catalog.castle_benefit_html", null, "🏰 <strong>Výhoda panství:</strong> Výnos daní +2 500 zl., nájem 1 500 zl., trvale +1 Charisma a audience u princezny."));
        var flipCastleLabel = tCas("ui.catalog.flip_castle", null, tCas("ui.catalog.flip_castle_label", null, "🔄 Otočit pohled na hrad"));

        var castles = window.PRS_CASTLES;
        var elemColors = {
            light: "#fbbf24",
            fire: "#f87171",
            water: "#38bdf8",
            earth: "#4ade80",
            air: "#cbd5e1",
            ice: "#93c5fd",
            crystal: "#c084fc",
            dark: "#a855f7"
        };

        var html = [];
        for (var k in castles) {
            if (!castles.hasOwnProperty(k)) continue;
            var c = castles[k];
            var col = elemColors[c.element] || "var(--gold-light)";

            var zoomCastleTitle = (window.PRS_I18n && window.PRS_I18n.t) ? window.PRS_I18n.t("ui.catalog.zoom_title", null, "Klikni pro zvětšení ilustrace") : "Klikni pro zvětšení ilustrace";
            var royalFallback = (window.PRS_I18n && window.PRS_I18n.t) ? window.PRS_I18n.t("ui.catalog.royal_fallback", null, "KRÁLOVSKÝ") : "KRÁLOVSKÝ";
            html.push('<div class="castle-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + c.img + '\', \'' + this.escapeHtml(c.name) + '\', \'' + this.escapeHtml(c.desc) + '\')" title="' + zoomCastleTitle + '">');
            html.push('    <img src="' + c.img + '" alt="' + this.escapeHtml(c.name) + '" class="card-media-img" loading="lazy" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + col + '; color:' + col + ';">' + elemLabel + ' ' + (c.element ? c.element.toUpperCase() : royalFallback) + '</span>');
            html.push('    <span class="card-media-badge-right" style="border-color:var(--gold); color:var(--gold-light);">' + priceLabel + ' 8 000 ' + curr + '</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + c.icon + ' ' + this.escapeHtml(c.name) + '</div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(c.desc) + '</div>');
            html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.3); color:#fef08a;">');
            html.push('      ' + benefitHtml);
            html.push('    </div>');
            if (c.canFlip || c.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this)" style="font-size:0.75rem; padding:4px 8px; margin-top:0.4rem; width:100%; cursor:pointer;">' + flipCastleLabel + '</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- SÍŇ TROFEJÍ A RELIKVIÍ (29 TROFEJÍ) ---
    setTrophiesCategory: function (cat) {
        this.trophiesActiveCategory = cat;
        var btns = document.querySelectorAll(".trophy-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-cat") === cat) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderTrophiesHall();
    },

    renderTrophiesHall: function () {
        var container = document.getElementById("trophies-grid-container");
        if (!container || !window.PRS_TROPHIES) return;

        var tTroph = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var curr = tTroph("ui.currency", null, "zl.");
        var locale = tTroph("ui.locale", null, "cs-CZ");
        var sCombat = window.PRS_SKILLS ? window.PRS_SKILLS.getName("combat") : "Boj";
        var sRiding = window.PRS_SKILLS ? window.PRS_SKILLS.getName("riding") : "Jízda";
        var sDance = window.PRS_SKILLS ? window.PRS_SKILLS.getName("dance") : "Tanec";
        var sCharisma = window.PRS_SKILLS ? window.PRS_SKILLS.getName("charisma") : "Charisma";
        var slotLabel = tTroph("slots.trophy", null, "Trofej");

        var trophies = window.PRS_TROPHIES;
        var filter = this.trophiesActiveCategory || "all";

        var list = [];
        for (var k in trophies) {
            if (!trophies.hasOwnProperty(k)) continue;
            var t = trophies[k];
            if (filter === "beasts" && t.source.indexOf("U1") === -1) continue;
            if (filter === "monsters" && t.source.indexOf("U2") === -1 && t.source.indexOf("Náhoda") === -1) continue;
            if (filter === "dragons" && t.source.indexOf("U3") === -1) continue;
            list.push(t);
        }

        var html = [];
        for (var i = 0; i < list.length; i++) {
            var tr = list[i];
            var tierClass = "tier-" + (tr.tier || 1);
            var statChips = [];
            if (tr.combat) statChips.push('<span class="armory-stat-chip ' + (tr.combat > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (tr.combat > 0 ? '+' : '') + tr.combat + ' ' + sCombat + '</span>');
            if (tr.riding) statChips.push('<span class="armory-stat-chip ' + (tr.riding > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (tr.riding > 0 ? '+' : '') + tr.riding + ' ' + sRiding + '</span>');
            if (tr.dance) statChips.push('<span class="armory-stat-chip ' + (tr.dance > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (tr.dance > 0 ? '+' : '') + tr.dance + ' ' + sDance + '</span>');
            if (tr.charisma) statChips.push('<span class="armory-stat-chip ' + (tr.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">✨ ' + (tr.charisma > 0 ? '+' : '') + tr.charisma + ' ' + sCharisma + '</span>');

            html.push('<div class="trophy-item-card ' + tierClass + '">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
            html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light); font-size:0.75rem;">' + (isEn ? ('Tier ' + (tr.tier || 1)) : ((tr.tier || 1) + '. stupeň')) + '</span>');
            html.push('    <span style="font-size:0.75rem; color:#9ca3af; font-style:italic;">' + this.escapeHtml(tr.source || (isEn ? 'Battle' : 'Boj')) + '</span>');
            html.push('  </div>');

            html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + tr.icon + ' ' + this.escapeHtml(tr.name) + '</div>');
            html.push('  <div style="font-size:0.8rem; color:#d1d5db; line-height:1.35; margin-bottom:0.6rem; flex:1;">' + this.escapeHtml(tr.desc) + '</div>');

            html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.6rem;">' + statChips.join("") + '</div>');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.4rem; font-size:0.82rem;">');
            html.push('    <span style="color:var(--text-muted);">Slot: <strong>🏆 ' + slotLabel + '</strong></span>');
            html.push('    <span style="color:var(--gold-light); font-weight:bold;">' + (tr.price ? tr.price.toLocaleString(locale) : '0') + ' ' + curr + '</span>');
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- ATLAS DEKORACÍ A KRAJINY (34+ PRVKŮ) ---
    setDecorationsCategory: function (cat) {
        this.decorationsActiveCategory = cat;
        var btns = document.querySelectorAll(".decor-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-cat") === cat) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderDecorationsGallery();
    },

    renderDecorationsGallery: function () {
        var container = document.getElementById("decorations-grid-container");
        if (!container || !window.PRS_DECOR_CATALOG) return;

        var catalog = window.PRS_DECOR_CATALOG;
        var filter = this.decorationsActiveCategory || "all";

        var tCat = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var categoryLabels = {
            vegetation: tCat("ui.catalog.decor_cats.vegetation", null, "Lesy & Vegetace"),
            terrain: tCat("ui.catalog.decor_cats.terrain", null, "Skály & Hory"),
            agriculture: tCat("ui.catalog.decor_cats.agriculture", null, "Zemědělství"),
            settlement: tCat("ui.catalog.decor_cats.settlement", null, "Sídla & Stavby"),
            civilization: tCat("ui.catalog.decor_cats.civilization", null, "Opevnění & Stráže"),
            water: tCat("ui.catalog.decor_cats.water", null, "Voda & Močály"),
            magic: tCat("ui.catalog.decor_cats.magic", null, "Magie & Ruiny"),
            quest_lair: tCat("ui.catalog.decor_cats.quest_lair", null, "Doupata & Sluje")
        };

        var categoryColors = {
            vegetation: "#4ade80",
            terrain: "#a8a29e",
            agriculture: "#facc15",
            settlement: "#fb923c",
            civilization: "#94a3b8",
            water: "#38bdf8",
            magic: "#c084fc",
            quest_lair: "#f87171"
        };

        var defaultDecorDesc = tCat("ui.catalog.decor_default_desc", null, "Malebný prvek oživující herní plochu království.");
        var clearanceLabel = tCat("ui.catalog.decor_clearance_label", null, "🏷️ Bezpečná zóna (Clearance):");
        var flipBtnText = tCat("ui.catalog.flip_mirror", null, "🔄 Otočit zrcadlení");
        var zoomTitle = tCat("ui.catalog.zoom_title", null, "Klikni pro zvětšení ilustrace");

        var html = [];
        for (var k in catalog) {
            if (!catalog.hasOwnProperty(k)) continue;
            var d = catalog[k];
            var cat = d.category || "vegetation";

            // Filtrování
            if (filter !== "all") {
                if (filter === "vegetation" && cat !== "vegetation") continue;
                if (filter === "settlement" && cat !== "settlement" && cat !== "agriculture" && cat !== "civilization") continue;
                if (filter === "water" && cat !== "water") continue;
                if (filter === "magic" && cat !== "magic") continue;
                if (filter === "quest_lair" && cat !== "quest_lair" && cat !== "terrain") continue;
            }

            var col = categoryColors[cat] || "var(--gold-light)";
            var catName = categoryLabels[cat] || cat.toUpperCase();
            var icon = d.icon || "🌲";

            var trDecorName = window.PRS_I18n ? window.PRS_I18n.t("decorations." + k + ".name") : null;
            var dName = (trDecorName && trDecorName !== ("decorations." + k + ".name")) ? trDecorName : d.name;
            var trDecorDesc = window.PRS_I18n ? window.PRS_I18n.t("decorations." + k + ".desc") : null;
            var desc = (trDecorDesc && trDecorDesc !== ("decorations." + k + ".desc")) ? trDecorDesc : (d.desc || defaultDecorDesc);

            html.push('<div class="decor-card" style="background:var(--card-bg, #1a1625); border:1px solid rgba(212,175,55,0.25); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 4px 14px rgba(0,0,0,0.4);">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + d.img + '\', \'' + this.escapeHtml(dName) + '\', \'' + this.escapeHtml(desc) + '\')" title="' + zoomTitle + '" style="position:relative; background:radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.5) 100%); padding:1rem 0.5rem; display:flex; justify-content:center; align-items:center; min-height:160px; cursor:pointer;">');
            html.push('    <img src="' + d.img + '" alt="' + this.escapeHtml(dName) + '" class="card-media-img" loading="lazy" style="max-height:130px; max-width:85%; object-fit:contain; filter:drop-shadow(0 6px 10px rgba(0,0,0,0.6)); transition:transform 0.2s;" />');
            html.push('    <span class="card-media-badge-left" style="position:absolute; top:8px; left:8px; font-size:0.7rem; font-weight:bold; border:1px solid ' + col + '; color:' + col + '; background:rgba(0,0,0,0.75); padding:2px 6px; border-radius:4px;">' + catName + '</span>');
            html.push('    <span class="card-media-badge-right" style="position:absolute; top:8px; right:8px; font-size:0.7rem; font-weight:bold; border:1px solid rgba(255,255,255,0.2); color:#cbd5e1; background:rgba(0,0,0,0.75); padding:2px 6px; border-radius:4px;">📐 ' + d.w + '×' + d.h + ' px</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body" style="padding:0.75rem; display:flex; flex-direction:column; flex:1;">');
            html.push('    <div class="card-media-title" style="font-family:\'Cinzel\',serif; font-size:0.95rem; font-weight:bold; color:var(--gold-light, #fef08a); margin-bottom:0.35rem;">' + icon + ' ' + this.escapeHtml(dName) + '</div>');
            html.push('    <div class="card-media-desc" style="font-size:0.8rem; color:#94a3b8; line-height:1.35; flex:1; margin-bottom:0.5rem;">' + this.escapeHtml(desc) + '</div>');
            html.push('    <div style="font-size:0.72rem; color:#64748b; margin-bottom:0.4rem;">' + clearanceLabel + ' <strong>' + (d.clearance || 35) + ' px</strong></div>');

            if (d.canFlip || d.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this)" style="font-size:0.75rem; padding:4px 8px; width:100%; cursor:pointer;">' + flipBtnText + '</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- INTERAKTIVNÍ ZRCADLENÍ ILUSTRACÍ V KARTÁCH (CSS scaleX) ---
    toggleCardFlip: function (btn) {
        var card = btn.closest(".bestiary-card, .castle-card, .decor-card");
        if (!card) return;
        var img = card.querySelector(".card-media-img");
        if (!img) return;
        var tFlip = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
        var flipped = img.classList.toggle("is-flipped");
        img.setAttribute("data-is-flipped", flipped ? "true" : "false");
        btn.textContent = flipped
            ? tFlip("ui.catalog.flip_original", "↩️ Původní směr")
            : tFlip("ui.catalog.flip_mirror", "🔄 Otočit zrcadlení");
    },

    // --- KONTEXTOVÁ NÁPOVĚDA '?' Z HERNÍ PLOCHY DO KODEXU PRAVIDEL ---
    openRulesHelpForTile: function (tileType, tileCode) {
        if (!tileType && tileCode) tileType = tileCode;
        var t = (tileType || "").toUpperCase();
        var code = (tileCode || "").toUpperCase();

        var chapterMap = {
            "START": "board",
            "VILLAGE": "estates",
            "TOWN": "estates",
            "CASTLE": "estates",
            "TAX": "estates",
            "KUN": "animals",
            "PES": "animals",
            "SOKOL": "animals",
            "STAJE": "animals",
            "PSOVID": "animals",
            "SOKOLNIK": "animals",
            "MASTER": "virtues",
            "U1": "combat",
            "U2": "combat",
            "U3": "combat",
            "FESTIVAL": "festivals",
            "MERCHANT": "scrolls",
            "KOVARNA": "scrolls",
            "KREJCI": "scrolls",
            "HOSPITAL": "locations",
            "PRISON": "locations",
            "TAVERN": "locations",
            "JESTER": "locations",
            "CHANCE": "locations",
            "BONUS": "locations"
        };

        var chapterId = chapterMap[t] || "board";
        if (code.indexOf("V") === 0) chapterId = "estates";
        else if (code.indexOf("M") === 0 && code.indexOf("MB") !== 0 && code.indexOf("MJ") !== 0 && code.indexOf("MT") !== 0 && code.indexOf("MCH") !== 0) chapterId = "estates";
        else if (code.indexOf("H") === 0 && code !== "HOSPITAL") chapterId = "estates";
        else if (code.indexOf("K") === 0) chapterId = "animals";
        else if (code.indexOf("P") === 0 && code !== "PRISON") chapterId = "animals";
        else if (code.indexOf("S") === 0 && code !== "START") chapterId = "animals";
        else if (code === "MB" || code === "MJ" || code === "MT" || code === "MCH" || code === "VM") chapterId = "virtues";
        else if (code.indexOf("U1") === 0 || code.indexOf("U2") === 0 || code.indexOf("U3") === 0) chapterId = "combat";

        this.openRulesHelpTopic(chapterId);
    },

    openRulesHelpTopic: function (topicId) {
        if (typeof this.switchTab === "function") this.switchTab("rules");
        if (typeof this.switchRulesSubtab === "function") this.switchRulesSubtab("rules");
        if (typeof this.switchRulesView === "function") this.switchRulesView("guide");

        var self = this;
        setTimeout(function () {
            var acc = document.getElementById("rule-acc-" + topicId);
            if (acc) {
                acc.classList.add("open");
                acc.scrollIntoView({ behavior: "smooth", block: "center" });
                acc.classList.remove("rule-highlight-pulse");
                void acc.offsetWidth; // trigger reflow
                acc.classList.add("rule-highlight-pulse");
                setTimeout(function () {
                    acc.classList.remove("rule-highlight-pulse");
                }, 3000);
            }
        }, 60);
    },

    // --- INTERAKTIVNÍ KALKULAČKA KRÁLOVSKÝCH SLAVNOSTÍ ---
    updateFestivalCalculator: function () {
        var festType = (document.getElementById("calc-fest-type") || {}).value || "tournament";
        var optGroupTournament = document.getElementById("calc-group-tournament");
        var optGroupBall = document.getElementById("calc-group-ball");
        var optGroupRace = document.getElementById("calc-group-race");

        if (optGroupTournament) optGroupTournament.style.display = (festType === "tournament") ? "block" : "none";
        if (optGroupBall) optGroupBall.style.display = (festType === "ball") ? "block" : "none";
        if (optGroupRace) optGroupRace.style.display = (festType === "race") ? "block" : "none";

        var diceRoll = parseInt((document.getElementById("calc-dice-roll") || {}).value || "4", 10);
        var score = 0;
        var r1Heart = 0, r1Gold = 1200;
        var r2Heart = 0, r2Gold = 600;
        var r3Heart = 0, r3Gold = 300;

        if (festType === "tournament") {
            var b = parseInt((document.getElementById("calc-tour-boj") || {}).value || "3", 10);
            var j = parseInt((document.getElementById("calc-tour-jizda") || {}).value || "2", 10);
            var ch = parseInt((document.getElementById("calc-tour-ch") || {}).value || "2", 10);
            var setBonus = (document.getElementById("calc-tour-set") || {}).checked ? 3 : 0;
            score = diceRoll + b + j + setBonus;
            r1Heart = 3.0 + 0.3 * b + 0.2 * ch;
            r2Heart = 2.0 + 0.2 * b + 0.1 * ch;
            r3Heart = 1.0 + 0.15 * b;
        } else if (festType === "ball") {
            var t = parseInt((document.getElementById("calc-ball-tanec") || {}).value || "3", 10);
            var ch2 = parseInt((document.getElementById("calc-ball-ch") || {}).value || "3", 10);
            var dressBonus = (document.getElementById("calc-ball-dress") || {}).checked ? 2 : 0;
            var armorMalus = (document.getElementById("calc-ball-armor") || {}).checked ? -2 : 0;
            score = diceRoll + t + ch2 + dressBonus + armorMalus;
            r1Heart = 2.5 + 0.4 * t + 0.3 * ch2;
            r2Heart = 1.5 + 0.2 * t + 0.15 * ch2;
            r3Heart = 0.5 + 0.15 * t;
        } else if (festType === "race") {
            var j2 = parseInt((document.getElementById("calc-race-jizda") || {}).value || "3", 10);
            var ch3 = parseInt((document.getElementById("calc-race-ch") || {}).value || "2", 10);
            var horses = parseInt((document.getElementById("calc-race-horses") || {}).value || "2", 10);
            score = diceRoll + 2 * j2 + Math.min(3, horses);
            r1Heart = 2.5 + 0.4 * j2 + 0.2 * ch3;
            r2Heart = 1.5 + 0.2 * j2 + 0.1 * ch3;
            r3Heart = 0.5 + 0.15 * j2;
        }

        var scoreEl = document.getElementById("calc-score-val");
        var outcomeEl = document.getElementById("calc-outcome-val");
        var rewardEl = document.getElementById("calc-reward-val");

        var tCalc = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var ptsUnit = tCalc("rules.calc_pts_unit", null, "bodů");
        var goldUnit = tCalc("rules.calc_gold_unit", null, "zl.");
        var andWord = tCalc("rules.calc_and", null, "a");

        if (scoreEl) scoreEl.textContent = score + " " + ptsUnit;

        var standing = tCalc("rules.calc_place_1", null, "🥇 1. Místo (Vysoká šance na triumf)");
        var rewardStr = "+" + r1Heart.toFixed(1) + " 💖 " + andWord + " +" + r1Gold + " " + goldUnit;
        if (score < 8) {
            standing = tCalc("rules.calc_place_3", null, "🥉 3. Místo (Bude to tuhý boj)");
            rewardStr = "+" + r3Heart.toFixed(1) + " 💖 " + andWord + " +" + r3Gold + " " + goldUnit;
        } else if (score < 12) {
            standing = tCalc("rules.calc_place_2", null, "🥈 2. Místo (Přední příčky království)");
            rewardStr = "+" + r2Heart.toFixed(1) + " 💖 " + andWord + " +" + r2Gold + " " + goldUnit;
        }

        if (outcomeEl) outcomeEl.textContent = standing;
        if (rewardEl) rewardEl.innerHTML = rewardStr;
    }
    });
})();
