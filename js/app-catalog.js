// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Encyklopedie, Bestiář, Galerie hradů a Balancovací studio
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
// --- PRAVIDLA, ENCYKLOPEDIE, BESTIÁŘ, HRADY A TROFEJE ---
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

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

        var tileDefinitions = isEn ? [
            {
                code: "START",
                name: "Royal START",
                cat: "Special",
                img: "assets/tiles/start.png",
                art: "assets/tiles/castle.jpg",
                cost: "—",
                action: "Grant <strong>+3,000 g.</strong> (landless knights <strong>+5,000 g.</strong>). Nobles, owners of Towns/Castles or skilled dancers (Dance ≥ 2 and court attire) also receive <strong>audience with the King (+0.5 to +1.0 💖)</strong>.",
                tip: "Acquire court attire early to harvest royal favors on each circuit."
            },
            {
                code: "VESNICE",
                name: "Peasant Village (V1–V12)",
                cat: "Estate",
                img: "assets/tiles/village.png",
                art: "assets/tiles/village.jpg",
                cost: "1,500 g.",
                action: "Purchase estate and collect rent (100–300 g.) from passing knights. Upgrades: 1★ Village → 2★ Small Town (+1,500 g.) → 3★ Large Settlement (+1,500 g.). Fully developed villages grant permanent <strong>+0.5 💖</strong> and host livestock.",
                tip: "Villages form the backbone of steady income. At 3★ they generate high rent and automatic herds."
            },
            {
                code: "MĚSTO",
                name: "Royal Town (M1–M4)",
                cat: "Estate",
                img: "assets/tiles/town.png",
                art: "assets/tiles/town.jpg",
                cost: "4,000 g.",
                action: "Wealthy settlement with 500 g. rent and high prestige: grants owner permanent <strong>+0.5 💖</strong> and yields <strong>+1,200 g.</strong> at Tax Collection.",
                tip: "Town expands herd capacity by +2 and guarantees an audience at START."
            },
            {
                code: "HRAD",
                name: "Noble Castle (C1–C4)",
                cat: "Estate",
                img: "assets/tiles/castle.png",
                art: "assets/tiles/castle.jpg",
                cost: "7,000 g.",
                action: "Pinnacle of feudal power: permanent <strong>+1.0 💖</strong> and <strong>+1 Charisma</strong> for the owner! Rent 1,000 g., tax payout is a massive <strong>+2,500 g.</strong>",
                tip: "Fastest way to permanently secure hearts and courtly dominance."
            },
            {
                code: "KŮŇ",
                name: "Horse Breeding (H1–H12)",
                cat: "Animals",
                img: "assets/tiles/kun.png",
                art: "assets/tiles/kun.jpg",
                cost: "600 × level g.",
                action: "Purchase horse. Unlocks <strong>equestrian movement (trot, canter, gallop)</strong>, allows agility defense in duels, and is required for the <strong>Grand Race</strong>.",
                tip: "Horses are key to rapid travel. Combine with Hound and Falcon for a Breeding Set (+1.5 💖)."
            },
            {
                code: "PES",
                name: "Hunting Hound (D1–D12)",
                cat: "Animals",
                img: "assets/tiles/pes.png",
                art: "assets/tiles/pes.jpg",
                cost: "500 × level g.",
                action: "Purchase hunting dog. Loyal companion provides tactical advantage in dragon arenas – close loss by 1–2 points grants a free <strong>🎲 Tactical Reroll of 1 die</strong>!",
                tip: "Hounds save your life in dragon lairs and protect against the Infirmary."
            },
            {
                code: "SOKOL",
                name: "Hunting Falcon (F1–F12)",
                cat: "Animals",
                img: "assets/tiles/sokol.png",
                art: "assets/tiles/sokol.jpg",
                cost: "400 × level g.",
                action: "Purchase bird of prey. Enables <strong>Falcon Navigation (±1 tile)</strong> during foot maneuvers, landing precisely on targets or dodging traps.",
                tip: "Falcon navigation is inactive during full horse canter/gallop due to excessive speed."
            },
            {
                code: "STAJE",
                name: "Royal Stables & Livestock Market",
                cat: "Economy",
                img: "assets/tiles/kun.png",
                art: "assets/tiles/kun.jpg",
                cost: "By livestock",
                action: "Purchase livestock: <strong>🐑 Sheep (500 g.)</strong>, <strong>🐖 Pig (600 g.)</strong>, and <strong>🐄 Cattle (800 g.)</strong>. Herds increase village rents and yield passive income at Tax Collection.",
                tip: "Herd capacity scales with your villages and towns. Stables add +4 capacity."
            },
            {
                code: "MISTR",
                name: "Master's Guild (MC, MR, MD, MCH, GM)",
                cat: "Training",
                img: "assets/tiles/master.png",
                art: "assets/tiles/master.jpg",
                cost: "1,000–5,000 g.",
                action: "Train virtues (Combat, Riding, Dance, Charisma). Roll: 1–3 = rejected, 4–6 = accepted. Successful training grants <strong>Master's Seal</strong>. 3 seals = <strong>Knightly Patronage</strong>!",
                tip: "Grandmaster (GM) trains any virtue of your choice. Invest in your primary virtue early."
            },
            {
                code: "FESTIVAL",
                name: "Royal Festival (♡ ♡ ♡)",
                cat: "Contest",
                img: "assets/tiles/festival.png",
                art: "assets/tiles/festival.jpg",
                cost: "—",
                action: "Tournament (Combat + Riding), Castle Ball (Dance + Charisma), or Grand Race (Riding + horses). Primary source of hearts in the game! Winner earns <strong>up to +5 💖 and 1,200 g.</strong>",
                tip: "If fewer than 2 knights participate, the event is cancelled, but the host receives +800 g. and +0.5 💖 consolation."
            },
            {
                code: "U1",
                name: "Common Beast (Forest Predators)",
                cat: "Hunting",
                img: "assets/tiles/u1_zver.png",
                art: "assets/tiles/u1_zver.jpg",
                cost: "—",
                action: "Hunt wolves, bears, and boars. Victory yields <strong>1,000–2,500 g.</strong> and <strong>+0.5 to +1.5 💖</strong>. Safe early training for aspiring warriors.",
                tip: "Use Tactical Stance: Cautious defense protects you from wounds even on defeat."
            },
            {
                code: "U2",
                name: "Mighty Monster (Mythical Fiends)",
                cat: "Hunting",
                img: "assets/tiles/u2_monstrum.png",
                art: "assets/tiles/u2_monstrum.jpg",
                cost: "—",
                action: "Battle Chimeras, Trolls, and Golems. Reward: <strong>2,600 g.</strong>, <strong>+1.5 to +2.5 💖</strong>, and 65% trophy drop chance. Tactical retreat available for 400 g.",
                tip: "Check monster weaknesses in the Bestiary for an automatic +2 power bonus."
            },
            {
                code: "U3",
                name: "Dragon Lair (Legendary Dragons)",
                cat: "Dragon Slayers",
                img: "assets/tiles/u3_drak.png",
                art: "assets/tiles/u3_drak.jpg",
                cost: "—",
                action: "Duel for honor against one of 20 unique dragons! Reward: <strong>6,000 g.</strong>, <strong>+2.5 to +5.0 💖</strong>, and guaranteed dragon trophy. <strong>Slaying 2 dragons = instant game triumph!</strong>",
                tip: "Tactical retreat costs 800 g. Retreat if your Combat power and weapons are insufficient."
            },
            {
                code: "MERCHANT",
                name: "Royal Market",
                cat: "Market",
                img: "assets/tiles/merchant.png",
                art: "assets/tiles/merchant.jpg",
                cost: "By purchase",
                action: "Buy equipment packages (weapons, armor, gowns, jewels). Voluntarily sell possessions to the Crown (items for 50% value, estates for 100%).",
                tip: "Prioritize gear aligned with your chosen victory strategy."
            },
            {
                code: "KOVARNA",
                name: "Guild Forge",
                cat: "Market",
                img: "assets/tiles/kovarna.png",
                art: "assets/tiles/kovarna.jpg",
                cost: "By weapon",
                action: "Craft and purchase swords, axes, lances, and plate armor. Weapons boost Combat and give tactical advantages against specific dragons.",
                tip: "Lances counter Water dragons; heavy armor protects against flame."
            },
            {
                code: "KREJCI",
                name: "Court Tailor",
                cat: "Market",
                img: "assets/tiles/krejci.png",
                art: "assets/tiles/krejci.jpg",
                cost: "By garment",
                action: "Tailor courtly gowns and brocade robes. Boosts Dance and Charisma, vital for triumph at the Castle Ball.",
                tip: "Attire grants an automatic +2 score bonus at the Castle Ball."
            },
            {
                code: "TAVERN",
                name: "Golden Tankard Tavern",
                cat: "Services",
                img: "assets/tiles/tavern.png",
                art: "assets/tiles/tavern.jpg",
                cost: "500 g.",
                action: "Rest and hospitality. Round of mead for 500 g. Skilled dancers (Dance ≥ 2) earn court admiration and <strong>+1.0 💖</strong> for charming entertainment.",
                tip: "Diplomats and courtiers convert modest coins into precious hearts here."
            },
            {
                code: "TAX",
                name: "Royal Tax Collector",
                cat: "Economy",
                img: "assets/tiles/tax.png",
                art: "assets/tiles/tax.jpg",
                cost: "—",
                action: "Collect feudal rents: Villages (500/900/1,400 g.), Towns (1,200 g.), Castles (2,500 g.), and livestock (sheep +120, pig +150, cow +200 g.).",
                tip: "Knights holding Knightly Patronage (3 master seals) are exempt from all royal tithes."
            },
            {
                code: "PRISON",
                name: "Castle Dungeon",
                cat: "Penalty",
                img: "assets/tiles/prison.png",
                art: "assets/tiles/prison.jpg",
                cost: "1,000 g. bail",
                action: "Imprisoned for 1 round. Escape options: pay 1,000 g. bail, roll a 6, or immediately play <strong>Royal Amnesty</strong> scroll from your pouch.",
                tip: "A Royal Amnesty scroll frees you immediately without losing a turn or gold."
            },
            {
                code: "HOSPITAL",
                name: "Royal Infirmary",
                cat: "Healing",
                img: "assets/tiles/hospital.png",
                art: "assets/tiles/hospital.jpg",
                cost: "1,000 g.",
                action: "Recover from critical wounds. Healing elixir for 1,000 g. permanently increases Combat by +1 (if Combat < 2), grants <strong>+0.5 💖 for bravery</strong>, and a protective ward!",
                tip: "Holders of Knightly Patronage (3 master seals) receive free medical care."
            },
            {
                code: "JESTER",
                name: "Court Jester & Fool",
                cat: "Special",
                img: "assets/tiles/jester.png",
                art: "assets/tiles/jester.jpg",
                cost: "2,000 g. (Jester)",
                action: "Courtly entertainment. Jester composes satirical ballads against rivals; Fool rewards skilled dancers with <strong>+200 g. × Dance rank</strong>.",
                tip: "High Dance skill turns a Fool's visit into a handsome royal stipend."
            },
            {
                code: "CHANCE",
                name: "Chance & Royal Boon",
                cat: "Fate",
                img: "assets/tiles/chance.png",
                art: "assets/tiles/chance.jpg",
                cost: "—",
                action: "Draw a fate card from the realm deck: royal grants, tournament challenges, brigands, riding tests, or <strong>tactical scrolls for your pouch</strong>.",
                tip: "Pouch holds up to 3 tactical scrolls to play anytime on your turn."
            }
        ] : [
            {
                code: "START",
                name: "Královský START",
                cat: "Speciální",
                img: "assets/tiles/start.png",
                art: "assets/tiles/castle.jpg",
                cost: "—",
                action: "Žold <strong>+3 000 zl.</strong> (nemajetní bezzemci <strong>+5 000 zl.</strong>). Šlechtici, majitelé Města/Hradu nebo zkušení tanečníci (Tanec ≥ 2 a šaty) navíc získávají <strong>audienci u krále (+0,5 až +1,0 💖)</strong>.",
                tip: "Využij včasný zisk šatů k čerpání královské přízně při každém oběhu plánu."
            },
            {
                code: "VESNICE",
                name: "Poddanská vesnice (V1–V12)",
                cat: "Panství",
                img: "assets/tiles/village.png",
                art: "assets/tiles/village.jpg",
                cost: "1 500 zl.",
                action: "Koupě panství a výběr nájmu (100–300 zl.) od projíždějících rytířů. Možnost rozvoje: 1★ Vesnice → 2★ Městečko (+1 500 zl.) → 3★ Velká osada (+1 500 zl.). Plně rozvinutá vesnice dává trvale <strong>+0,5 💖</strong> a chová dobytek.",
                tip: "Vesnice jsou základem stabilního příjmu. Na 3★ generují vysoký nájem a automatická stáda."
            },
            {
                code: "MĚSTO",
                name: "Královské město (M1–M4)",
                cat: "Panství",
                img: "assets/tiles/town.png",
                art: "assets/tiles/town.jpg",
                cost: "4 000 zl.",
                action: "Bohaté sídlo s vysokým nájmem (500 zl.) a stálou prestiží: majiteli uděluje trvale <strong>+0,5 💖</strong> a přináší <strong>+1 200 zl.</strong> při návštěvě Výběrčího daní.",
                tip: "Město rozšiřuje kapacitu stád o +2 a zaručuje královskou audienci na STARTu."
            },
            {
                code: "HRAD",
                name: "Šlechtický hrad (H1–H4)",
                cat: "Panství",
                img: "assets/tiles/castle.png",
                art: "assets/tiles/castle.jpg",
                cost: "7 000 zl.",
                action: "Vrchol feudální moci: trvale <strong>+1,0 💖</strong> a <strong>+1 Charisma</strong> pro majitele! Nájem 1 000 zl., výnos u Výběrčího daní činí celých <strong>+2 500 zl.</strong>",
                tip: "Nejrychlejší způsob, jak si trvale pojistit srdce a získat převahu na královském dvoře."
            },
            {
                code: "KŮŇ",
                name: "Chov koní (K1–K12)",
                cat: "Zvířata",
                img: "assets/tiles/kun.png",
                art: "assets/tiles/kun.jpg",
                cost: "600 × úroveň zl.",
                action: "Koupě koně. Zpřístupňuje <strong>koňský pohyb (klus, cval, trysk)</strong>, umožňuje obranu obratností v duelech a je nutnou podmínkou účasti ve <strong>Velkém závodě</strong>.",
                tip: "Kůň je klíč k rychlému pohybu po mapě. V kombinaci se psem a sokolem tvoří Chovnou sadu (+1,5 💖)."
            },
            {
                code: "PES",
                name: "Lovecký pes (P1–P12)",
                cat: "Zvířata",
                img: "assets/tiles/pes.png",
                art: "assets/tiles/pes.jpg",
                cost: "500 × úroveň zl.",
                action: "Koupě loveckého psa. Věrný společník ti dává taktickou výhodu v aréně draků – při těsné prohře o 1–2 body získáš <strong>🎲 Taktický reroll 1 kostky</strong> zdarma!",
                tip: "Pes ti zachrání život v aréně draků a chrání tě před převozem do Lazaretu."
            },
            {
                code: "SOKOL",
                name: "Lovecký sokol (S1–S12)",
                cat: "Zvířata",
                img: "assets/tiles/sokol.png",
                art: "assets/tiles/sokol.jpg",
                cost: "400 × úroveň zl.",
                action: "Koupě dravce. Umožňuje <strong>Sokolí navigaci (±1 pole)</strong> při taktickém manévrování pěšky, čímž ti dovolí přesně dosednout na cíl nebo se vyhnout pasti.",
                tip: "Sokolí navigace nefunguje při plném koňském cvalu a trysku – kůň letí kupředu příliš rychle."
            },
            {
                code: "STAJE",
                name: "Královské stáje & Dobytčí trh",
                cat: "Ekonomika",
                img: "assets/tiles/kun.png",
                art: "assets/tiles/kun.jpg",
                cost: "Dle druhu",
                action: "Nákup hospodářského dobytka: <strong>🐑 Ovce (500 zl.)</strong>, <strong>🐖 Prase (600 zl.)</strong> a <strong>🐄 Skot (800 zl.)</strong>. Stáda zvyšují nájmy vesnic a generují pasivní výnos u Výběrčího daní.",
                tip: "Kapacita stád závisí na počtu tvých vesnic a měst. Stáje samy o sobě přidávají +4 místa."
            },
            {
                code: "MISTR",
                name: "Sídlo Mistra (MB, MJ, MT, MCH, VM)",
                cat: "Výcvik",
                img: "assets/tiles/master.png",
                art: "assets/tiles/master.jpg",
                cost: "1 000–5 000 zl.",
                action: "Trénink ctností (Boj, Jízda, Tanec, Charisma). Hod kostkou: 1–3 = nepřijat, 4–6 = přijat k výcviku. Úspěšný trénink uděluje <strong>Pečeť mistra</strong>. 3 různé pečetě = <strong>Rytířská záštita</strong>!",
                tip: "Velmistr (VM) učí jakoukoliv vlastnost dle tvé volby. Investuj do své primární ctnosti co nejdříve."
            },
            {
                code: "FESTIVAL",
                name: "Královská slavnost (♡ ♡ ♡)",
                cat: "Soutěž",
                img: "assets/tiles/festival.png",
                art: "assets/tiles/festival.jpg",
                cost: "—",
                action: "Turnaj (Boj + Jízda), Zámecký ples (Tanec + Charisma) nebo Velký závod (Jízda + koně). Hlavní zdroj srdcí ve hře! Vítěz získá <strong>až +5 💖 a 1 200 zl.</strong>",
                tip: "Při účasti méně než 2 rytířů se slavnost nekoná, ale pořadatel dostane útěchu +800 zl. a +0,5 💖."
            },
            {
                code: "U1",
                name: "Běžná stvůra (Lesní dravci)",
                cat: "Lov",
                img: "assets/tiles/u1_zver.png",
                art: "assets/tiles/u1_zver.jpg",
                cost: "—",
                action: "Lov vlků, medvědů a divočáků. Vítězství přináší <strong>1 000–2 500 zl.</strong> a <strong>+0,5 až +1,5 💖</strong>. Skvělý bezpečný trénink pro začínající válečníky.",
                tip: "Použij Taktický postoj: Opatrná obrana tě ochrání před zraněním i v případě prohry."
            },
            {
                code: "U2",
                name: "Mocné monstrum (Bájní netvoři)",
                cat: "Lov",
                img: "assets/tiles/u2_monstrum.png",
                art: "assets/tiles/u2_monstrum.jpg",
                cost: "—",
                action: "Boj s Chimérami, Trolly a Golemy. Odměna <strong>2 600 zl.</strong>, <strong>+1,5 až +2,5 💖</strong> a 65% šance na unikátní trofej. Lze uplatnit taktický ústup za 400 zl.",
                tip: "Před bojem zkontroluj slabinu monstra v Bestiáři pro automatický bonus +2 k síle."
            },
            {
                code: "U3",
                name: "Dračí sluj (Legendární draci)",
                cat: "Drakobijci",
                img: "assets/tiles/u3_drak.png",
                art: "assets/tiles/u3_drak.jpg",
                cost: "—",
                action: "Souboj o čest s jedním z 20 unikátních draků! Odměna <strong>6 000 zl.</strong>, <strong>+2,5 až +5,0 💖</strong> a garantovaná dračí trofej. <strong>Skolení 2 draků = okamžitá výhra v celé hře!</strong>",
                tip: "Taktický ústup z dračí sluje stojí 800 zl. Pokud nemáš dostatečný Boj a zbraně, raději ustup."
            },
            {
                code: "MERCHANT",
                name: "Královský obchodník",
                cat: "Trh",
                img: "assets/tiles/merchant.png",
                art: "assets/tiles/merchant.jpg",
                cost: "Dle nákupu",
                action: "Nákup balíčků výstroje (zbraně, zbroje, plesové šaty, klenoty). Možnost dobrovolného odprodeje majetku bance (věci za 50 % ceny, nemovitosti za 100 %).",
                tip: "Nakupuj přednostně věci, které odpovídají tvé zvolené cestě k vítězství."
            },
            {
                code: "KOVARNA",
                name: "Cechovní kovárna",
                cat: "Trh",
                img: "assets/tiles/kovarna.png",
                art: "assets/tiles/kovarna.jpg",
                cost: "Dle zbraně",
                action: "Výroba a nákup mečů, seker, kopí a brnění. Zbraně zvyšují Boj a poskytují taktickou výhodu proti specifickým drakům.",
                tip: "Kopí platí na Vodní draky, těžké brnění na ohnivé plameny."
            },
            {
                code: "KREJCI",
                name: "Zámecký krejčí",
                cat: "Trh",
                img: "assets/tiles/krejci.png",
                art: "assets/tiles/krejci.jpg",
                cost: "Dle oděvu",
                action: "Ušití dvorských šatů a brokátových rouch. Poskytuje bonusy k Tanci a Charismatu, zásadní pro vítězství na Zámeckém plese.",
                tip: "Šaty ti na Zámeckém plese přinášejí automatický bonus +2 ke skóre."
            },
            {
                code: "TAVERN",
                name: "Krčma U Zlatého korbelu",
                cat: "Služby",
                img: "assets/tiles/tavern.png",
                art: "assets/tiles/tavern.jpg",
                cost: "500 zl.",
                action: "Odpočinek a pohoštění. Runda medoviny za 500 zl. Pro zkušené tanečníky (Tanec ≥ 2) přináší dvorní obdiv a zisk <strong>+1,0 💖</strong> za okouzlující zábavu.",
                tip: "Diplomaté a tanečníci zde proměňují drobné mince v cenná srdce."
            },
            {
                code: "TAX",
                name: "Výběrčí daní",
                cat: "Ekonomika",
                img: "assets/tiles/tax.png",
                art: "assets/tiles/tax.jpg",
                cost: "—",
                action: "Výplata feudálních rent: Vesnice (500/900/1 400 zl.), Města (1 200 zl.), Hrady (2 500 zl.) a dobytek (ovce +120, prase +150, kráva +200 zl.).",
                tip: "Rytíř s Rytířskou záštitou (3 pečetě mistrů) je navíc osvobozen od všech plateb královských desátků."
            },
            {
                code: "PRISON",
                name: "Hradní šatlava",
                cat: "Trest",
                img: "assets/tiles/prison.png",
                art: "assets/tiles/prison.jpg",
                cost: "Kauce 1 000 zl.",
                action: "Uvěznění na 1 kolo. Možnosti záchrany: zaplacení kauce 1 000 zl., úspěšný útěk (hod kostkou 6), nebo okamžité zahrání svitku <strong>Královská amnestie</strong> z brašny.",
                tip: "Pokud máš v brašně svitek Královské amnestie, jsi propuštěn okamžitě bez ztráty tahu i peněz."
            },
            {
                code: "HOSPITAL",
                name: "Královský lazaret",
                cat: "Léčení",
                img: "assets/tiles/hospital.png",
                art: "assets/tiles/hospital.jpg",
                cost: "1 000 zl.",
                action: "Zotavení po těžkém zranění. Hojivý elixír za 1 000 zl. trvale zvýší Boj o +1 (pokud Boj < 2), udělí <strong>+0,5 💖 za statečnost</strong> a ochranný amulet proti dalšímu převozu!",
                tip: "Držitelé Rytířské záštity (3 pečetě mistrů) jsou v lazaretu ošetřeni zcela zdarma."
            },
            {
                code: "JESTER",
                name: "Dvorní Kejklíř & Šašek",
                cat: "Speciální",
                img: "assets/tiles/jester.png",
                art: "assets/tiles/jester.jpg",
                cost: "2 000 zl. (Kejklíř)",
                action: "Zábava u dvora. Kejklíř skládá posměšnou baladu na protivníky; Šašek odměňuje zkušené tanečníky královským darem <strong>+200 zl. × stupeň Tance</strong>.",
                tip: "Vysoký Tanec promění návštěvu Šaška ve štědrou královskou rentu."
            },
            {
                code: "CHANCE",
                name: "Náhoda & Královský dar",
                cat: "Osud",
                img: "assets/tiles/chance.png",
                art: "assets/tiles/chance.jpg",
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
                '  <img src="' + t.img + '" alt="' + t.name + '" class="atlas-tile-thumb" onerror="this.src=\'assets/tiles/castle.png\';" />' +
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

        var isEn = (typeof window !== "undefined" && window.PRS_I18n && window.PRS_I18n.getLanguage() === "en");
        var codeLabel = isEn ? "Code: " : "Kód: ";
        var catLabel = isEn ? "Category: " : "Kategorie: ";
        var costLabel = isEn ? "Acquisition Cost / Value: " : "Pořizovací hodnota / Náklad: ";
        var tipLabel = isEn ? "<strong>👑 Royal Advisor's Tip:</strong> " : "<strong>👑 Doporučení Královského rádce:</strong> ";
        var guideBtn = isEn ? "📖 Open Guide Chapter" : "📖 Otevřít kapitolu v Průvodci";
        var closeBtn = isEn ? "✕ Close" : "✕ Zavřít";

        if (content) {
            content.innerHTML = '<div class="tile-atlas-modal-box">' +
                '  <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; flex-shrink:0;">' +
                '    <img src="' + t.img + '" alt="' + t.name + '" class="tile-atlas-modal-img" onerror="this.src=\'assets/tiles/castle.png\';" />' +
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

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en';
        var curr = (window.PRS_I18n && window.PRS_I18n.t("ui.currency")) || (isEn ? "g." : "zl.");
        var locale = isEn ? "en-US" : "cs-CZ";
        var rows = "";
        for (var i = 0; i < filtered.length; i++) {
            var it = filtered[i];
            var tierTag = "";
            if (it.slot === "trophy") {
                var tLabel = isEn ? ((it.tier === 3) ? "Dragon Trophy U3" : ("Trophy U" + it.tier)) : ((it.tier === 3) ? "Dračí trofej U3" : ("Trofej U" + it.tier));
                var tBg = (it.tier === 3)
                    ? "background:linear-gradient(135deg, #b91c1c, #7f1d1d); border-color:#f87171;"
                    : (it.tier === 2 ? "background:linear-gradient(135deg, #7c3aed, #4c1d95); border-color:#c084fc;" : "background:linear-gradient(135deg, #15803d, #14532d); border-color:#86efac;");
                tierTag = "<span class='tier-badge' style='" + tBg + " font-size:0.7rem; padding:2px 7px;'>" + tLabel + "</span>";
            } else {
                var itTierLabel = isEn ? ("Tier " + it.tier) : ("Věci " + it.tier);
                tierTag = "<span class='tier-badge tier-" + it.tier + "'>" + itTierLabel + "</span>";
            }

            var nameExtra = it.source ? (" <small style='color:#94a3b8; font-weight:normal; display:block; font-size:0.75rem;'>" + (isEn ? "Source: " : "Zdroj: ") + this.escapeHtml(it.source) + "</small>") : "";

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

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en';
        var curr = (window.PRS_I18n && window.PRS_I18n.t("ui.currency")) || (isEn ? "g." : "zl.");
        var locale = isEn ? "en-US" : "cs-CZ";
        var rewardLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.reward")) || "Odměna:";
        var heartsLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.hearts")) || (isEn ? "Hearts" : "Srdcí");
        var diffLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.difficulty")) || (isEn ? "Difficulty" : "Obtížnost");
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
            html.push('    <img src="' + d.img + '" alt="' + this.escapeHtml(d.name) + '" class="card-media-img" loading="lazy" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.png\';" />');
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

            if (d.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + d.img + '\', \'' + d.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; margin-top:0.4rem; width:100%; cursor:pointer;">' + flipLabel + '</button>');
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

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en';
        var curr = (window.PRS_I18n && window.PRS_I18n.t("ui.currency")) || (isEn ? "g." : "zl.");
        var locale = isEn ? "en-US" : "cs-CZ";
        var elemLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.element_label")) || (isEn ? "Element:" : "Živel:");
        var priceLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.price_label")) || (isEn ? "Price:" : "Cena:");
        var benefitHtml = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.castle_benefit")) || (isEn ? "🏰 <strong>Estate Benefit:</strong> Tax income +2,500 g., rent 1,500 g., permanent +1 Charisma and audience with the Princess." : "🏰 <strong>Výhoda panství:</strong> Výnos daní +2 500 zl., nájem 1 500 zl., trvale +1 Charisma a audience u princezny.");
        var flipCastleLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.catalog.flip_castle")) || (isEn ? "🔄 Flip Castle View" : "🔄 Otočit pohled na hrad");

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

            html.push('<div class="castle-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + c.img + '\', \'' + this.escapeHtml(c.name) + '\', \'' + this.escapeHtml(c.desc) + '\')" title="Klikni pro zvětšení ilustrace">');
            html.push('    <img src="' + c.img + '" alt="' + this.escapeHtml(c.name) + '" class="card-media-img" loading="lazy" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + col + '; color:' + col + ';">' + elemLabel + ' ' + (c.element ? c.element.toUpperCase() : (isEn ? 'ROYAL' : 'KRÁLOVSKÝ')) + '</span>');
            html.push('    <span class="card-media-badge-right" style="border-color:var(--gold); color:var(--gold-light);">' + priceLabel + ' 8 000 ' + curr + '</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + c.icon + ' ' + this.escapeHtml(c.name) + '</div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(c.desc) + '</div>');
            html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.3); color:#fef08a;">');
            html.push('      ' + benefitHtml);
            html.push('    </div>');
            if (c.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + c.img + '\', \'' + c.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; margin-top:0.4rem; width:100%; cursor:pointer;">' + flipCastleLabel + '</button>');
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

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en';
        var curr = (window.PRS_I18n && window.PRS_I18n.t("ui.currency")) || (isEn ? "g." : "zl.");
        var locale = isEn ? "en-US" : "cs-CZ";
        var sCombat = window.PRS_SKILLS ? window.PRS_SKILLS.getName("combat") : "Boj";
        var sRiding = window.PRS_SKILLS ? window.PRS_SKILLS.getName("riding") : "Jízda";
        var sDance = window.PRS_SKILLS ? window.PRS_SKILLS.getName("dance") : "Tanec";
        var sCharisma = window.PRS_SKILLS ? window.PRS_SKILLS.getName("charisma") : "Charisma";
        var slotLabel = (window.PRS_I18n && window.PRS_I18n.t("ui.slots.trophy")) || (isEn ? "Trophy" : "Trofej");

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

        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var categoryLabels = isEn ? {
            vegetation: "Forests & Trees",
            terrain: "Rocks & Mountains",
            agriculture: "Agriculture & Fields",
            settlement: "Settlements & Buildings",
            civilization: "Fortifications & Guards",
            water: "Water & Swamps",
            magic: "Magic & Ruins",
            quest_lair: "Lairs & Caves"
        } : {
            vegetation: "Lesy & Vegetace",
            terrain: "Skály & Hory",
            agriculture: "Zemědělství",
            settlement: "Sídla & Stavby",
            civilization: "Opevnění & Stráže",
            water: "Voda & Močály",
            magic: "Magie & Ruiny",
            quest_lair: "Doupata & Sluje"
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

            var decorLang = (isEn && window.PRS_I18N && window.PRS_I18N.en && window.PRS_I18N.en.decorations && window.PRS_I18N.en.decorations[k]) ? window.PRS_I18N.en.decorations[k] : null;
            var dName = decorLang ? decorLang.name : d.name;
            var desc = decorLang ? decorLang.desc : (d.desc || (isEn ? "Picturesque element enlivening the kingdom board." : "Malebný prvek oživující herní plochu království."));
            var clearanceLabel = isEn ? "🏷️ Clearance Zone:" : "🏷️ Bezpečná zóna (Clearance):";
            var flipBtnText = isEn ? "🔄 Mirror Orientation" : "🔄 Otočit zrcadlení";
            var zoomTitle = isEn ? "Click to enlarge illustration" : "Klikni pro zvětšení ilustrace";

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

            if (d.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + d.img + '\', \'' + d.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; width:100%; cursor:pointer;">' + flipBtnText + '</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- INTERAKTIVNÍ ZRCADLENÍ ILUSTRACÍ V KARTÁCH (LÍC / RUB) ---
    toggleCardFlip: function (btn, normalSrc, flipSrc) {
        var card = btn.closest(".bestiary-card, .castle-card, .decor-card");
        if (!card) return;
        var img = card.querySelector(".card-media-img");
        if (!img) return;
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        if (img.getAttribute("data-is-flipped") === "true") {
            img.src = normalSrc;
            img.setAttribute("data-is-flipped", "false");
            btn.textContent = isEn ? "🔄 Mirror Orientation" : "🔄 Otočit zrcadlení";
        } else {
            img.src = flipSrc || normalSrc;
            img.setAttribute("data-is-flipped", "true");
            btn.textContent = isEn ? "↩️ Original Facing" : "↩️ Původní směr";
        }
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
        }
    },

    closeImageModal: function () {
        var m = document.getElementById("image-lightbox-modal");
        if (m) { m.style.display = "none"; this.updateBodyModalClass(); }
    },

    openSketchModal: function (imgSrc, caption) {
        this.openImageModal(imgSrc, "Archivní ruční nákres z roku 2016", caption);
    },

    closeSketchModal: function () {
        this.closeImageModal();
    },

    // --- BALANCOVACÍ STUDIO & SIMULÁTOR NOVÉ EKONOMIKY (V ADMINISTRACI) ---
    renderBalanceStudioInputs: function () {
        var c = this.activeConfig || window.PRS_DEFAULT_CONFIG;
        if (!c.estates) c.estates = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.estates);
        if (!c.livestock) c.livestock = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.livestock || {});
        if (!c.animalBasePrices) c.animalBasePrices = { sokol: 400, pes: 500, kun: 600 };
        if (!c.animalRentRatios) c.animalRentRatios = { single: 0.20, pair: 0.40, fullSet: 0.80 };
        if (!c.itemPackPrices) c.itemPackPrices = { tier1: 2500, tier2: 7000, tier3: 12000 };
        if (!c.quests) c.quests = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.quests);

        // 1. Makroekonomika
        this.setInputValue("cfg-targetHearts", c.targetHearts || 30);
        this.setInputValue("cfg-startGold", c.startGold || 10000);
        this.setInputValue("cfg-passStartGold", c.passStartGold || 3000);
        this.setInputValue("cfg-passStartGoldLandless", c.passStartGoldLandless || 5000);
        this.setInputValue("cfg-landlessPenalty", (c.estates && c.estates.landlessTaxPenalty !== undefined) ? c.estates.landlessTaxPenalty : 500);

        // 2. Panství (Vesnice, Města, Hrady)
        var vp = c.estates.villagePrices || [2000, 1500, 1500];
        var vt = c.estates.villageTaxYield || [500, 900, 1400];
        var vr = c.estates.villageRent || [300, 500, 800];
        this.setInputValue("cfg-villagePrice", vp[0] || 2000);
        this.setInputValue("cfg-villageUpgPrice", vp[1] || 1500);
        this.setInputValue("cfg-villageTax1", vt[0] || 500);
        this.setInputValue("cfg-villageTax2", vt[1] || 900);
        this.setInputValue("cfg-villageTax3", vt[2] || 1400);
        this.setInputValue("cfg-villageRent1", vr[0] || 300);
        this.setInputValue("cfg-villageRent2", vr[1] || 500);
        this.setInputValue("cfg-villageRent3", vr[2] || 800);
        this.setInputValue("cfg-townPrice", c.estates.townPrice || 4500);
        this.setInputValue("cfg-townTax", c.estates.townTaxYield || 1200);
        this.setInputValue("cfg-townRent", c.estates.townRent || 700);
        this.setInputValue("cfg-castlePrice", c.estates.castlePrice || 8000);
        this.setInputValue("cfg-castleTax", c.estates.castleTaxYield || 2500);
        this.setInputValue("cfg-castleRent", c.estates.castleRent || 1500);

        // 3. Dobytčí trh & Pastviny
        var ls = c.livestock || {};
        this.setInputValue("cfg-sheepPrice", ls.sheepPrice !== undefined ? ls.sheepPrice : 500);
        this.setInputValue("cfg-sheepTax", ls.sheepTax !== undefined ? ls.sheepTax : 120);
        this.setInputValue("cfg-sheepRent", ls.sheepRent !== undefined ? ls.sheepRent : 50);
        this.setInputValue("cfg-pigsPrice", ls.pigsPrice !== undefined ? ls.pigsPrice : 600);
        this.setInputValue("cfg-pigsTax", ls.pigsTax !== undefined ? ls.pigsTax : 150);
        this.setInputValue("cfg-pigsRent", ls.pigsRent !== undefined ? ls.pigsRent : 75);
        this.setInputValue("cfg-cattlePrice", ls.cattlePrice !== undefined ? ls.cattlePrice : 800);
        this.setInputValue("cfg-cattleTax", ls.cattleTax !== undefined ? ls.cattleTax : 200);
        this.setInputValue("cfg-cattleRent", ls.cattleRent !== undefined ? ls.cattleRent : 100);
        this.setInputValue("cfg-capVillage", ls.capacityPerVillage !== undefined ? ls.capacityPerVillage : 3);
        this.setInputValue("cfg-capTown", ls.capacityPerTown !== undefined ? ls.capacityPerTown : 2);
        this.setInputValue("cfg-capStaje", ls.capacityPerStaje !== undefined ? ls.capacityPerStaje : 4);

        // 4. Ušlechtilá zvířata, Zbrojnice & Výpravy
        this.setInputValue("cfg-sokol", c.animalBasePrices.sokol || 400);
        this.setInputValue("cfg-pes", c.animalBasePrices.pes || 500);
        this.setInputValue("cfg-kun", c.animalBasePrices.kun || 600);
        this.setInputValue("cfg-rentSingle", Math.round((c.animalRentRatios.single || 0.20) * 100));
        this.setInputValue("cfg-rentPair", Math.round((c.animalRentRatios.pair || 0.40) * 100));
        this.setInputValue("cfg-rentSet", Math.round((c.animalRentRatios.fullSet || 0.80) * 100));
        this.setInputValue("cfg-pack1", c.itemPackPrices.tier1 || 2500);
        this.setInputValue("cfg-pack2", c.itemPackPrices.tier2 || 7000);
        this.setInputValue("cfg-pack3", c.itemPackPrices.tier3 || 12000);
        this.setInputValue("cfg-u1Diff", c.quests.u1BaseDiff || 5);
        this.setInputValue("cfg-u1Gold", c.quests.u1GoldReward || 1500);
        this.setInputValue("cfg-u2Diff", c.quests.u2BaseDiff || 9);
        this.setInputValue("cfg-u2Gold", c.quests.u2GoldReward || 3500);
        this.setInputValue("cfg-u2Hearts", c.quests.u2HeartReward !== undefined ? c.quests.u2HeartReward : 1.0);
        this.setInputValue("cfg-u3Diff", c.quests.u3BaseDiff || 13);
        this.setInputValue("cfg-u3Gold", c.quests.u3GoldReward || 8000);
        this.setInputValue("cfg-u3Hearts", c.quests.u3HeartReward !== undefined ? c.quests.u3HeartReward : 3.0);
    },

    setInputValue: function (id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    },

    getInputNum: function (id, fallback) {
        var el = document.getElementById(id);
        if (!el || el.value === "") return fallback;
        var n = Number(el.value);
        return isNaN(n) ? fallback : n;
    },

    readBalanceStudioInputs: function () {
        var c = window.PRS_GameEngine.deepClone(this.activeConfig || window.PRS_DEFAULT_CONFIG);
        if (!c.estates) c.estates = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.estates);
        if (!c.livestock) c.livestock = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.livestock || {});
        if (!c.animalBasePrices) c.animalBasePrices = {};
        if (!c.animalRentRatios) c.animalRentRatios = {};
        if (!c.itemPackPrices) c.itemPackPrices = {};
        if (!c.quests) c.quests = {};

        c.targetHearts = this.getInputNum("cfg-targetHearts", 30);
        c.startGold = this.getInputNum("cfg-startGold", 10000);
        c.passStartGold = this.getInputNum("cfg-passStartGold", 3000);
        c.passStartGoldLandless = this.getInputNum("cfg-passStartGoldLandless", 5000);
        c.estates.landlessTaxPenalty = this.getInputNum("cfg-landlessPenalty", 500);

        var upgPrice = this.getInputNum("cfg-villageUpgPrice", 1500);
        c.estates.villagePrices = [
            this.getInputNum("cfg-villagePrice", 2000),
            upgPrice,
            upgPrice
        ];
        c.estates.villageTaxYield = [
            this.getInputNum("cfg-villageTax1", 500),
            this.getInputNum("cfg-villageTax2", 900),
            this.getInputNum("cfg-villageTax3", 1400)
        ];
        c.estates.villageRent = [
            this.getInputNum("cfg-villageRent1", 300),
            this.getInputNum("cfg-villageRent2", 500),
            this.getInputNum("cfg-villageRent3", 800)
        ];
        c.estates.townPrice = this.getInputNum("cfg-townPrice", 4500);
        c.estates.townTaxYield = this.getInputNum("cfg-townTax", 1200);
        c.estates.townRent = this.getInputNum("cfg-townRent", 700);
        c.estates.castlePrice = this.getInputNum("cfg-castlePrice", 8000);
        c.estates.castleTaxYield = this.getInputNum("cfg-castleTax", 2500);
        c.estates.castleRent = this.getInputNum("cfg-castleRent", 1500);

        c.livestock.sheepPrice = this.getInputNum("cfg-sheepPrice", 500);
        c.livestock.sheepTax = this.getInputNum("cfg-sheepTax", 120);
        c.livestock.sheepRent = this.getInputNum("cfg-sheepRent", 50);
        c.livestock.pigsPrice = this.getInputNum("cfg-pigsPrice", 600);
        c.livestock.pigsTax = this.getInputNum("cfg-pigsTax", 150);
        c.livestock.pigsRent = this.getInputNum("cfg-pigsRent", 75);
        c.livestock.cattlePrice = this.getInputNum("cfg-cattlePrice", 800);
        c.livestock.cattleTax = this.getInputNum("cfg-cattleTax", 200);
        c.livestock.cattleRent = this.getInputNum("cfg-cattleRent", 100);
        c.livestock.capacityPerVillage = this.getInputNum("cfg-capVillage", 3);
        c.livestock.capacityPerTown = this.getInputNum("cfg-capTown", 2);
        c.livestock.capacityPerStaje = this.getInputNum("cfg-capStaje", 4);

        c.animalBasePrices.sokol = this.getInputNum("cfg-sokol", 400);
        c.animalBasePrices.pes = this.getInputNum("cfg-pes", 500);
        c.animalBasePrices.kun = this.getInputNum("cfg-kun", 600);
        c.animalRentRatios.single = Math.max(0.05, this.getInputNum("cfg-rentSingle", 20) / 100);
        c.animalRentRatios.pair = Math.max(0.10, this.getInputNum("cfg-rentPair", 40) / 100);
        c.animalRentRatios.fullSet = Math.max(0.20, this.getInputNum("cfg-rentSet", 80) / 100);

        c.itemPackPrices.tier1 = this.getInputNum("cfg-pack1", 2500);
        c.itemPackPrices.tier2 = this.getInputNum("cfg-pack2", 7000);
        c.itemPackPrices.tier3 = this.getInputNum("cfg-pack3", 12000);

        c.quests.u1BaseDiff = this.getInputNum("cfg-u1Diff", 5);
        c.quests.u1GoldReward = this.getInputNum("cfg-u1Gold", 1500);
        c.quests.u2BaseDiff = this.getInputNum("cfg-u2Diff", 9);
        c.quests.u2GoldReward = this.getInputNum("cfg-u2Gold", 3500);
        c.quests.u2HeartReward = this.getInputNum("cfg-u2Hearts", 1.0);
        c.quests.u3BaseDiff = this.getInputNum("cfg-u3Diff", 13);
        c.quests.u3GoldReward = this.getInputNum("cfg-u3Gold", 8000);
        c.quests.u3HeartReward = this.getInputNum("cfg-u3Hearts", 3.0);

        this.activeConfig = c;
        if (this.state && this.state.config) {
            this.state.config = window.PRS_GameEngine.deepClone(c);
        }
        return c;
    },

    resetBalanceToDefaults: function () {
        this.activeConfig = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG);
        if (this.state && this.state.config) {
            this.state.config = window.PRS_GameEngine.deepClone(this.activeConfig);
        }
        this.renderBalanceStudioInputs();
        var msgEl = document.getElementById("save-config-feedback");
        if (msgEl) msgEl.textContent = "↺ Obnoveny původní výchozí hodnoty královské ekonomiky.";
    },

    runEconomySimulation: function (numGames) {
        var cfg = this.readBalanceStudioInputs();
        var simBoardSel = document.getElementById("sim-board-select");
        var simScenSel = document.getElementById("sim-scenario-select");
        var simDiffSel = document.getElementById("sim-diff-select");
        var simPlSel = document.getElementById("sim-players-select");

        var bCode = simBoardSel ? simBoardSel.value : "classic_96";
        var simOpts = {
            scenario: simScenSel ? simScenSel.value : "standard",
            difficultyMode: simDiffSel ? simDiffSel.value : "normal",
            playerCount: simPlSel ? Number(simPlSel.value) : 4
        };

        var result = window.PRS_GameEngine.simulateGames(numGames || 30, cfg, bCode, simOpts);
        var outBox = document.getElementById("sim-results-box");
        if (!outBox) return;

        var hb = result.avgWinnerHeartsBreakdown;
        var wt = result.winsByType || {};
        var botLabels = [
            { key: "Bot_Aggressive", name: "⚔️ Válečník (Boj & Draci)", color: "#f87171" },
            { key: "Bot_Breeder", name: "🌾 Chovatel (Sady & Dobytek)", color: "#4ade80" },
            { key: "Bot_Noble", name: "👑 Šlechtic (Panství & Plesy)", color: "#facc15" },
            { key: "Bot_Balanced", name: "⚖️ Všestranný rytíř", color: "#38bdf8" },
            { key: "Bot_Easy", name: "🛡️ Opatrný panoš", color: "#cbd5e1" }
        ];
        var winRowsHtml = "";
        for (var bi = 0; bi < botLabels.length; bi++) {
            var bl = botLabels[bi];
            var wins = wt[bl.key] || 0;
            var pct = Math.round((wins / result.gamesSimulated) * 100);
            winRowsHtml +=
                '<div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem; font-size:0.8rem;">' +
                '  <div style="width:190px; color:' + bl.color + '; font-weight:600;">' + bl.name + '</div>' +
                '  <div style="flex:1; height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">' +
                '    <div style="width:' + pct + '%; height:100%; background:' + bl.color + ';"></div>' +
                '  </div>' +
                '  <div style="width:85px; text-align:right; color:#f8fafc; font-weight:700;">' + wins + '× (' + pct + ' %)</div>' +
                '</div>';
        }

        outBox.innerHTML =
            '<div class="sim-metrics-grid" style="margin-bottom:0.9rem;">' +
            '  <div class="sim-metric-card">' +
            '    <span>⏱️ Odhad stolní herní doby (' + result.playerCount + ' hráči)</span>' +
            '    <strong>' + result.estTabletopHoursText + '</strong>' +
            '    <small>(' + result.estTabletopMinutes + ' min u stolu | ' + result.gamesSimulated + ' her)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🔄 Průměrná délka partie</span>' +
            '    <strong>' + result.avgRounds + ' kol</strong>' +
            '    <small>(celkem ' + result.avgTurns + ' jednotlivých tahů)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>💰 Hotovost &amp; Celkové jmění vítěze</span>' +
            '    <strong>' + result.avgWinnerGold.toLocaleString("cs-CZ") + ' zl.</strong>' +
            '    <small>Čisté jmění vč. panství: ' + (result.avgWinnerNetWorth || 0).toLocaleString("cs-CZ") + ' zl.</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🏛️ Výběr daní &amp; Nájemného vítěze</span>' +
            '    <strong>+' + (result.avgTaxesCollected || 0).toLocaleString("cs-CZ") + ' zl. daně</strong>' +
            '    <small>Vybrané mýtné od soupeřů: +' + (result.avgRentCollected || 0).toLocaleString("cs-CZ") + ' zl.</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🏰 Panství vítěze na konci hry</span>' +
            '    <strong>' + result.avgWinnerVillages + ' 🏘️ | ' + result.avgWinnerTowns + ' 🏙️ | ' + result.avgWinnerCastles + ' 🏯</strong>' +
            '    <small>Vesnice / Města / Hrady v držení vítěze</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🌾 Chov dobytka &amp; Skolení draci</span>' +
            '    <strong>' + result.avgWinnerLivestock + ' ks dobytka | ' + result.avgDragonsSlain + ' 🐉</strong>' +
            '    <small>Přikoupená stáda na pastvinách &amp; draci (Bankroty: ' + result.avgEliminations + ')</small>' +
            '  </div>' +
            '  <div class="sim-metric-card" style="grid-column: span 2;">' +
            '    <span>💖 Odkud plynou vítězná Srdce princezny</span>' +
            '    <strong>Slavnosti: ' + hb.festivals + ' 💖 &nbsp;|&nbsp; Výpravy (U2/U3): ' + hb.quests + ' 💖 &nbsp;|&nbsp; Chov &amp; Sady: ' + hb.breeding + ' 💖</strong>' +
            '    <small>Karty Náhody, Rytířské duely a Přípitky: ' + hb.chance + ' 💖</small>' +
            '  </div>' +
            '</div>' +
            '<div style="background:rgba(0,0,0,0.38); border:1px solid rgba(212,175,55,0.25); border-radius:10px; padding:0.85rem 1rem;">' +
            '  <div style="font-weight:700; color:var(--gold-light); font-size:0.86rem; margin-bottom:0.55rem;">🏆 Úspěšnost strategií (Win-Rate archetypů za ' + result.gamesSimulated + ' her)</div>' +
            winRowsHtml +
            '</div>';

        if (window.PRS_Api) {
            PRS_Api.post("log-telemetry", {
                eventType: "SimulationRun",
                turnNumber: Math.round(result.avgRounds),
                message: "Simulace " + result.gamesSimulated + " her [" + bCode + "/" + simOpts.scenario + "] (" + result.estTabletopHoursText + ")",
                payloadJson: JSON.stringify(result)
            }).catch(function (err) { console.warn("[KiDesky] telemetry log failed:", err); });
        }
    },

    saveConfigToServer: function () {
        var cfg = this.readBalanceStudioInputs();
        var msgEl = document.getElementById("save-config-feedback");
        if (msgEl) msgEl.textContent = "⏳ Ukládám konfiguraci do databáze [prs].[prs_GameConfigs]...";

        PRS_Api.post("save-config", {
            versionName: "v2.0-nova-ekonomika",
            targetHearts: cfg.targetHearts,
            startGold: cfg.startGold,
            passStartGold: cfg.passStartGold,
            configJson: JSON.stringify(cfg),
            notes: "Uloženo z Administrace – Balancovací studio v2.0"
        })
            .then(function (res) {
                if (msgEl) {
                    if (res && res.ok) {
                        msgEl.textContent = "✅ Konfigurace uložena do DB a aktivována pro všechny nové hry!";
                    } else {
                        msgEl.textContent = "⚠️ " + ((res && res.message) || (window.PRS_I18n ? window.PRS_I18n.t("auth.admin_required") : "Tato akce vyžaduje aktivní administrátorské přihlášení."));
                    }
                }
            })
            .catch(function () {
                if (msgEl) msgEl.textContent = "⚠️ " + (window.PRS_I18n ? window.PRS_I18n.t("auth.network_error") : "Chyba připojení k serveru.");
            });
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

        if (scoreEl) scoreEl.textContent = score + " bodů";

        var standing = "🥇 1. Místo (Vysoká šance na triumf)";
        var rewardStr = "+" + r1Heart.toFixed(1) + " 💖 a +" + r1Gold + " zl.";
        if (score < 8) {
            standing = "🥉 3. Místo (Bude to tuhý boj)";
            rewardStr = "+" + r3Heart.toFixed(1) + " 💖 a +" + r3Gold + " zl.";
        } else if (score < 12) {
            standing = "🥈 2. Místo (Přední příčky království)";
            rewardStr = "+" + r2Heart.toFixed(1) + " 💖 a +" + r2Gold + " zl.";
        }

        if (outcomeEl) outcomeEl.textContent = standing;
        if (rewardEl) rewardEl.innerHTML = rewardStr;
    }
    });
})();
