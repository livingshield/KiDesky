// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Datová definice hry, karet, grafiky a plánů
// ============================================================================

window.PRS_DEFAULT_CONFIG = {
    versionName: "v1.1-original-plan",
    targetHearts: 30,
    startGold: 10000,
    passStartGold: 3000,
    passStartGoldLandless: 5000,
    branchBonuses: { b200: 200, b300: 300, b400: 400 },
    masterCosts: [1000, 2000, 3000, 4000, 5000],
    masterMinRoll: 4, // 4, 5, 6 cvičí
    animalBasePrices: {
        falcon: 400, // F_n = 400 * n
        dog: 500,    // D_n = 500 * n
        horse: 600   // H_n = 600 * n
    },
    animalRentRatios: {
        single: 0.20,
        pair: 0.40,
        fullSet: 0.80
    },
    animalBreedingHearts: [4, 2.5, 1.5],
    estates: {
        villagePrices: [2000, 1500, 1500], // malá, +střední, +velká
        villageTaxYield: [500, 900, 1400],
        villageRent: [300, 500, 800],
        townPrice: 4500,
        townTaxYield: 1200,
        townRent: 700,
        castlePrice: 8000,
        castleTaxYield: 2500,
        castleRent: 1500,
        castleCharismaBonus: 1,
        landlessTaxPenalty: 500
    },
    livestock: {
        sheepPrice: 500,
        sheepTax: 120,
        sheepRent: 50,
        pigsPrice: 600,
        pigsTax: 150,
        pigsRent: 75,
        cattlePrice: 800,
        cattleTax: 200,
        cattleRent: 100,
        capacityPerVillage: 3,
        capacityPerTown: 2,
        capacityPerStables: 4
    },
    jesterPrice: 2000,
    jesterRentMultiplier: 100, // hod kostkou * 100 * počet kejklířů
    buildingPrice: 3000,
    buildingFeePerItem: 400,
    itemPackPrices: {
        tier1: 2500,
        tier2: 7000,
        tier3: 12000
    },
    itemFormula: {
        plusValue: 1000,
        minusValue: 500
    },
    sellRates: {
        merchantItem: 0.50,
        merchantBuilding: 1.00,
        anywhereItem: 0.25,
        anywhereBuilding: 0.50,
        forcedLiquidation: 0.60
    },
    quests: {
        u1BaseDiff: 5,
        u2BaseDiff: 9,
        u3BaseDiff: 13,
        u1GoldReward: 1500,
        u1FailCost: 500,
        u2GoldReward: 2600,
        u2HeartReward: 1.0,
        u3GoldReward: 6000,
        u3HeartReward: 3.0
    },
    festivalGoldPrizes: {
        tournament: [1500, 800, 400],
        ball: [1000, 500, 250],
        race: [1200, 600, 300],
        lov: [1400, 700, 350]
    }
};

// ============================================================================
// KONFIGURACE GRAFIKY, BITMAP POLÍČEK, DOMINANT A HERNÍHO PROSTŘEDÍ
// Připraveno pro snadné nahrazení jednotlivých kruhových políček, dominant a
// pozadí vlastními bitmapami (.png / .webp / .jpg).
// ============================================================================
window.PRS_GRAPHICS_CONFIG = {
    useBitmapMedallions: true,
    sketchOverlayOpacity: 0.0, // 0.0 = vypnuto, 0.35 = prosvícení originálního nákresu pod mapou
    environmentBgUrl: "assets/env/table_bg.jpg",      // Teplé dřevěné pozadí stolu při svíčkách
    boardBgUrl: "assets/board/parchment_board_bg.jpg",// Královský pergamen s mapou království
    tileRadius: 19,
    majorTileRadius: 24,
    // Cesty k bitmapám podle typu/podtypu políčka (pokud je prázdné, použije se generovaný erbovní medailon)
    tileBitmapsByType: {
        START: "assets/tiles/start.png",
        horse: "assets/tiles/kun.png",
        dog: "assets/tiles/pes.png",
        falcon: "assets/tiles/sokol.png",
        VILLAGE: "assets/tiles/village.png",
        TOWN: "assets/tiles/town.png",
        CASTLE: "assets/tiles/castle.png",
        MASTER: "assets/tiles/master.png",
        MERCHANT: "assets/tiles/merchant.png",
        TAX: "assets/tiles/tax.png",
        JESTER: "assets/tiles/jester.png",
        stables: "assets/tiles/kun.jpg",
        forge: "assets/tiles/kovarna.png",
        tailor: "assets/tiles/krejci.png",
        falconer: "assets/tiles/sokol.jpg",
        doghandler: "assets/tiles/pes.jpg",
        U1: "assets/tiles/u1_zver.png",
        U2: "assets/tiles/u2_monstrum.png",
        U3: "assets/tiles/u3_drak.png",
        FESTIVAL: "assets/tiles/festival.png",
        PRISON: "assets/tiles/prison.png",
        HOSPITAL: "assets/tiles/hospital.png",
        TAVERN: "assets/tiles/tavern.png",
        CHANCE: "assets/tiles/chance.png",
        BONUS: "assets/tiles/bonus.png"
    },
    // Možnost přiřadit unikátní bitmapu konkrétnímu kódu políčka (např. "H1", "H2")
    tileBitmapsByCode: {
        "H1": "assets/castles/castle_forest.png",
        "H2": "assets/castles/castle_wind.png",
        "H3": "assets/castles/castle_crystal.png"
    },
    // Cesty k bitmapám herních dominant (hrady, drak, lesní věž, erb)
    landmarkBitmaps: {
        royalCastle: "assets/landmarks/royal_castle.png",
        castle1: "assets/castles/castle_forest.png",
        castle2: "assets/castles/castle_wind.png",
        dragonLair: "assets/landmarks/dragon.png",
        forestTower: "assets/castles/castle_swamp.png",
        knightShield: ""
    },
    decorBitmaps: {
        tree_oak: "assets/decorations/tree_oak.png",
        tree_pine: "assets/decorations/tree_pine.png",
        tree_birch: "assets/decorations/tree_birch.png?v=202611021708",
        grove_oak: "assets/decorations/grove_oak.png",
        grove_pine: "assets/decorations/grove_pine.png",
        grove_pine2: "assets/decorations/grove_pine2.png",
        rock_boulder: "assets/decorations/rock_boulder.png",
        mountain_peaks: "assets/decorations/mountain_peaks.png",
        farm_field: "assets/decorations/farm_field.png",
        pasture_fence: "assets/decorations/pasture_fence.png",
        windmill: "assets/decorations/windmill.png",
        cottage_timber: "assets/decorations/cottage_timber.png",
        village_well: "assets/decorations/village_well.png",
        merchant_wagon: "assets/decorations/merchant_wagon.png",
        tournament_tent: "assets/decorations/tournament_tent.png",
        signpost: "assets/decorations/signpost.png",
        signpost2: "assets/decorations/signpost2.png",
        lake_pond: "assets/decorations/lake_pond.png",
        orchad_apple: "assets/decorations/orchad_apple.png",
        orchad_plum: "assets/decorations/orchad_plum.png",
        hruskovy_sad: "assets/decorations/hruskovy_sad.png",
        bush: "assets/decorations/bush.png",
        hrad: "assets/decorations/hrad.png",
        watermill: "assets/decorations/watermill.png",
        wooden_watchtower: "assets/decorations/wooden_watchtower.png",
        witch_hut: "assets/decorations/witch_hut.png",
        fairy_ring_mushrooms: "assets/decorations/fairy_ring_mushrooms.png",
        druid_monoliths: "assets/decorations/druid_monoliths.png",
        ancient_ruins: "assets/decorations/ancient_ruins.png",
        ancient_graveyard: "assets/decorations/ancient_graveyard.png",
        cave_bear_den: "assets/decorations/cave_bear_den.png",
        bandit_cave: "assets/decorations/bandit_cave.png",
        dragon_cave: "assets/decorations/dragon_cave.png",
        basilisk_cave: "assets/decorations/basilisk_cave.png",
        snow_troll_cave: "assets/decorations/snow_troll_cave.png",
        swamp_troll: "assets/decorations/swamp_troll.png",
        swamp_hydra: "assets/decorations/swamp_hydra.png",
        swamp_bridge: "assets/decorations/swamp_bridge.png",
        dryad_sacred_oak: "assets/decorations/dryad_sacred_oak.png",
        unicorn_grove: "assets/decorations/unicorn_grove.png",
        pegasus_pond: "assets/decorations/pegasus_pond.png"
    }
};

// ============================================================================
// KATALOG DEKORACÍ KRAJINY (TERRAIN & PROP DECOR ENGINE)
// 16 procedurálních i bitmapových prvků oživujících herní plochu
// ============================================================================

window.PRS_CASTLES = {
    royal: {
        id: "castle_royal",
        name: "Královský hrad (Sídlo koruny)",
        element: "light",
        icon: "👑",
        img: "assets/castles/castle_royal.png",
        imgFlip: "assets/castles/castle_royal_flip.png",
        desc: "Majestátní středověký hrad s robustními hradbami a červenými věžemi. Centrum moci a královského dvora."
    },
    forest: {
        id: "castle_forest",
        name: "Lesní hrad Doubrava",
        element: "earth",
        icon: "🌲",
        img: "assets/castles/castle_forest.png",
        imgFlip: "assets/castles/castle_forest_flip.png",
        desc: "Přírodní pevnost obrostlá mechem a břečťanem. Poskytuje rytířům slevu na trénink Jízdy u mistra."
    },
    desert: {
        id: "castle_desert",
        name: "Pouštní pískovcový palác",
        element: "earth",
        icon: "🏜️",
        img: "assets/castles/castle_desert.png",
        imgFlip: "assets/castles/castle_desert_flip.png",
        desc: "Zlatavý pískovcový zámek s orientálními kopulemi a oázou palem. Centrum dálkových karavan."
    },
    swamp: {
        id: "castle_swamp",
        name: "Bažinná tvrz Černá tůň",
        element: "water",
        icon: "🌫️",
        img: "assets/castles/castle_swamp.png",
        imgFlip: "assets/castles/castle_swamp_flip.png",
        desc: "Pochmurný hrad z tmavého zvětralého kamene obklopený hlubokým močálem a lekníny."
    },
    lava: {
        id: "castle_lava",
        name: "Sopečná pevnost Lávový chřtán",
        element: "fire",
        icon: "🌋",
        img: "assets/castles/castle_lava.png",
        imgFlip: "assets/castles/castle_lava_flip.png",
        desc: "Děsivá pevnost vytesaná z černého obsidiánu obklopená kaskádami žhavé lávy a rudými krystaly."
    },
    dark: {
        id: "castle_dark",
        name: "Temný podzemní hrad Erebus",
        element: "dark",
        icon: "🌑",
        img: "assets/castles/castle_dark.png",
        imgFlip: "assets/castles/castle_dark_flip.png",
        desc: "Hrad z fialového a černého kamene s trnitými věžemi a magickými runami střežícími podzemní sluje."
    },
    crystal: {
        id: "castle_crystal",
        name: "Křišťálový zámek Ametyst",
        element: "crystal",
        icon: "💎",
        img: "assets/castles/castle_crystal.png",
        imgFlip: "assets/castles/castle_crystal_flip.png",
        desc: "Oslnivý zámek vytesaný z obřích průsvitných drahokamů a ametystových geod, které lámou světlo."
    },
    water: {
        id: "castle_water",
        name: "Vodní citadela Oceán",
        element: "water",
        icon: "🌊",
        img: "assets/castles/castle_water.png",
        imgFlip: "assets/castles/castle_water_flip.png",
        desc: "Pohádková mořská tvrz s kaskádami vodopádů, funkčním mlýnem a modro-stříbrnými prapory."
    },
    wind: {
        id: "castle_wind",
        name: "Větrný vzdušný zámek Boreas",
        element: "air",
        icon: "☁️",
        img: "assets/castles/castle_wind.png",
        imgFlip: "assets/castles/castle_wind_flip.png",
        desc: "Lehká citadela z bílého kamene vznášející se vysoko v oblacích, poháněná rotujícími mechanismy."
    },
    ice: {
        id: "castle_ice",
        name: "Ledový palác Věčného mrazu",
        element: "ice",
        icon: "❄️",
        img: "assets/castles/castle_ice.png?v=202611021708",
        imgFlip: "assets/castles/castle_ice_flip.png?v=202611021708",
        desc: "Zámek vytesaný z průsvitného ledu a rampouchů, obklopený zamrzlými vodopády a zasněženými skalami."
    }
};

// Definice rytířských vlastností a ctností (Boj, Jízda, Tanec, Charisma)
window.PRS_SKILLS = {
    combat:   { id: "combat",   name: "Boj",      accusative: "Boj",      icon: "⚔️", label: "⚔️ Boj" },
    riding:   { id: "riding",   name: "Jízda",    accusative: "Jízdu",    icon: "🏇", label: "🏇 Jízda" },
    dance:    { id: "dance",    name: "Tanec",    accusative: "Tanec",    icon: "💃", label: "💃 Tanec" },
    charisma: { id: "charisma", name: "Charisma", accusative: "Charisma", icon: "✨", label: "✨ Charisma" },
    any:      { id: "any",      name: "Libovolná vlastnost", accusative: "Libovolnou vlastnost", icon: "🧙‍♂️", label: "🧙‍♂️ Libovolná vlastnost" }
};

window.PRS_SKILLS.normalizeKey = function (key) {
    if (!key) return "charisma";
    var k = String(key).toLowerCase().trim();
    if (k === "combat" || k === "boj" || k === "mb") return "combat";
    if (k === "riding" || k === "jizda" || k === "jízda" || k === "mj") return "riding";
    if (k === "dance" || k === "tanec" || k === "mt") return "dance";
    if (k === "charisma" || k === "mch") return "charisma";
    if (k === "any" || k === "vm") return "any";
    return k;
};

window.PRS_SKILLS.getName = function (key, withIcon, accusative) {
    var norm = window.PRS_SKILLS.normalizeKey(key);
    var def = window.PRS_SKILLS[norm];
    if (!def) return String(key || "");
    var txt;
    if (window.PRS_I18n) {
        var i18nKey = "skills." + norm + (accusative ? "_acc" : "");
        txt = window.PRS_I18n.t(i18nKey, null, accusative ? def.accusative : def.name);
    } else {
        txt = accusative ? def.accusative : def.name;
    }
    return withIcon ? (def.icon + " " + txt) : txt;
};

// Katalog předmětů: VĚCI 1, VĚCI 2, VĚCI 3
// Cena = počet plusů * 1000 - počet mínusů * 500
window.PRS_ITEMS = [
    // --- 1. STUPEŇ (VĚCI 1) ---
    { id: "it1_1", name: "Lovecký tesák", tier: 1, slot: "weapon", icon: "🗡️", combat: 2, riding: 0, dance: 0, charisma: 0, pluses: 2, minuses: 0, price: 2000 },
    { id: "it1_2", name: "Těžký rytířský palcát", tier: 1, slot: "weapon", icon: "🔨", combat: 3, riding: 0, dance: -1, charisma: 0, pluses: 3, minuses: 1, price: 2500 },
    { id: "it1_3", name: "Jezdecké kopí", tier: 1, slot: "weapon", icon: "🔱", combat: 2, riding: 1, dance: 0, charisma: 0, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_4", name: "Prošívaná zbroj", tier: 1, slot: "armor", icon: "🛡️", combat: 2, riding: 1, dance: 0, charisma: 0, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_5", name: "Kroužková košile", tier: 1, slot: "armor", icon: "⛓️", combat: 3, riding: 0, dance: -1, charisma: 0, pluses: 3, minuses: 1, price: 2500 },
    { id: "it1_6", name: "Hedvábný kabátec", tier: 1, slot: "dress", icon: "🧥", combat: 0, riding: 0, dance: 2, charisma: 1, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_7", name: "Sametový plášť", tier: 1, slot: "dress", icon: "🧣", combat: 0, riding: 0, dance: 1, charisma: 2, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_8", name: "Postříbřené ostruhy", tier: 1, slot: "jewel", icon: "👢", combat: 0, riding: 3, dance: -1, charisma: 0, pluses: 3, minuses: 1, price: 2500 },
    { id: "it1_9", name: "Zlatá spona s erbem", tier: 1, slot: "jewel", icon: "🎗️", combat: 0, riding: 1, dance: 1, charisma: 1, pluses: 3, minuses: 0, price: 3000 },

    // --- 2. STUPEŇ (VĚCI 2) ---
    { id: "it2_1", name: "Damaškový meč", tier: 2, slot: "weapon", icon: "⚔️", combat: 4, riding: 1, dance: 0, charisma: 2, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_2", name: "Turnajové dřevce šampionů", tier: 2, slot: "weapon", icon: "🏇", combat: 4, riding: 4, dance: -1, charisma: 0, pluses: 8, minuses: 1, price: 7500 },
    { id: "it2_3", name: "Plátová rytířská zbroj", tier: 2, slot: "armor", icon: "🛡️", combat: 5, riding: 1, dance: -2, charisma: 2, pluses: 8, minuses: 2, price: 7000 },
    { id: "it2_4", name: "Stříbrný erbovní štít", tier: 2, slot: "armor", icon: "🛡️", combat: 4, riding: 2, dance: 0, charisma: 1, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_5", name: "Brokátová dvorská róba", tier: 2, slot: "dress", icon: "👗", combat: 0, riding: 0, dance: 4, charisma: 3, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_6", name: "Slavnostní hermelínový šat", tier: 2, slot: "dress", icon: "👑", combat: 0, riding: 0, dance: 3, charisma: 4, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_7", name: "Rubínový pečetní prsten", tier: 2, slot: "jewel", icon: "💍", combat: 1, riding: 1, dance: 2, charisma: 3, pluses: 7, minuses: 0, price: 7000 },

    // --- 3. STUPEŇ (VĚCI 3) ---
    { id: "it3_1", name: "Meč Dračího bijce", tier: 3, slot: "weapon", icon: "🗡️", combat: 8, riding: 0, dance: 0, charisma: 2, pluses: 10, minuses: 0, price: 10000 },
    { id: "it3_2", name: "Královská zlatá zbroj", tier: 3, slot: "armor", icon: "🛡️", combat: 7, riding: 0, dance: -3, charisma: 3, pluses: 10, minuses: 3, price: 8500 },
    { id: "it3_3", name: "Velkolepý knížecí šat", tier: 3, slot: "dress", icon: "👘", combat: 0, riding: 0, dance: 6, charisma: 6, pluses: 12, minuses: 0, price: 12000 },
    { id: "it3_4", name: "Korunovační klenot předků", tier: 3, slot: "jewel", icon: "💎", combat: 3, riding: 3, dance: 3, charisma: 4, pluses: 13, minuses: 0, price: 13000 },
    { id: "it3_5", name: "Pegasovo královské sedlo", tier: 3, slot: "jewel", icon: "🏇", combat: 1, riding: 5, dance: 1, charisma: 3, pluses: 10, minuses: 0, price: 10000 }
];

// ============================================================================
// 29 UNIKÁTNÍCH TEMATICKÝCH TROFEJÍ A RELIKVIÍ (Zvěř, Monstra, Draci a Odpůrci)
// Každá trofej je samostatně nasaditelná do 5. slotu ("trophy") a poskytuje trvalé bonusy!
// ============================================================================
window.PRS_TROPHIES = {
    // --- U1: TROFEJE ZE ZVĚŘE (Stupeň 1) ---
    trophy_boar: {
        id: "trophy_boar",
        name: "Kly divokého kňoura",
        tier: 1,
        slot: "trophy",
        icon: "🐗",
        source: "Divoký kňour (U1)",
        combat: 2, riding: 0, dance: 0, charisma: 0,
        pluses: 2, minuses: 0, price: 2000,
        desc: "Ostré zahnité kly statného kňoura. Nošené na opasku dodávají kuráž v šarvátkách."
    },
    trophy_wolf: {
        id: "trophy_wolf",
        name: "Náhrdelník z vlčích tesáků",
        tier: 1,
        slot: "trophy",
        icon: "🐺",
        source: "Smečka šedých vlků (U1)",
        combat: 1, riding: 1, dance: 0, charisma: 0,
        pluses: 2, minuses: 0, price: 2200,
        desc: "Tesáky vůdce vlčí smečky navlečené na koženém řemínku. Zlepšují lovecké reflexy."
    },
    trophy_bear: {
        id: "trophy_bear",
        name: "Dráp horského medvěda",
        tier: 1,
        slot: "trophy",
        icon: "🐻",
        source: "Horský medvěd (U1)",
        combat: 2, riding: 1, dance: -1, charisma: 0,
        pluses: 3, minuses: 1, price: 2500,
        desc: "Masivní dráp medvěda z horského průsmyku. Důkaz obrovské fyzické síly lovce."
    },
    trophy_stag: {
        id: "trophy_stag",
        name: "Zlatavé paroží bílého jelena",
        tier: 1,
        slot: "trophy",
        icon: "🦌",
        source: "Královský bílý jelen (U1)",
        combat: 0, riding: 1, dance: 1, charisma: 2,
        pluses: 4, minuses: 0, price: 3500,
        desc: "Posvátná trofej královského jelena. Celý dvůr i princezna žasnou nad tvou ušlechtilostí."
    },

    // --- U2: TROFEJE Z MONSTER A ODPŮRCŮ (Stupeň 2) ---
    trophy_giant: {
        id: "trophy_giant",
        name: "Žulový kyj skalního obra",
        tier: 2,
        slot: "trophy",
        icon: "👹",
        source: "Skalní obr (U2)",
        combat: 4, riding: 1, dance: -2, charisma: 0,
        pluses: 5, minuses: 2, price: 6500,
        desc: "Zlomek kamenného kyje obra z horského mostu. Propůjčuje drtivou údernou sílu."
    },
    trophy_warlock: {
        id: "trophy_warlock",
        name: "Magický krystal černokněžníka",
        tier: 2,
        slot: "trophy",
        icon: "🧙‍♂️",
        source: "Temný černokněžník (U2)",
        combat: 2, riding: 0, dance: 1, charisma: 3,
        pluses: 6, minuses: 0, price: 7000,
        desc: "Tajemně pulzující krystal vytržený z čarodějovy hole. Chránil jeho kletby, nyní slouží tobě."
    },
    trophy_black_knight: {
        id: "trophy_black_knight",
        name: "Znak Černého loupeživého rytíře",
        tier: 2,
        slot: "trophy",
        icon: "⚔️",
        source: "Černý loupeživý rytíř (U2)",
        combat: 4, riding: 2, dance: 0, charisma: 1,
        pluses: 7, minuses: 0, price: 7500,
        desc: "Kovaný emblém z přilby poraženého padoucha. Rytíři uznávají tvé válečnické mistrovství."
    },
    trophy_werewolf: {
        id: "trophy_werewolf",
        name: "Měsíční totem jeskynního vlkodlaka",
        tier: 2,
        slot: "trophy",
        icon: "🐺",
        source: "Jeskynní vlkodlak (U2)",
        combat: 3, riding: 3, dance: 0, charisma: 1,
        pluses: 7, minuses: 0, price: 7000,
        desc: "Děsivý fetiš obávaného nočního dravce, který dává divokou vytrvalost v jezdeckém sedle."
    },
    trophy_robbers: {
        id: "trophy_robbers",
        name: "Prsten loupeživého hejtmana",
        tier: 1,
        slot: "trophy",
        icon: "🗡️",
        source: "Přepadení loupežníky (Náhoda)",
        combat: 2, riding: 0, dance: 0, charisma: 1,
        pluses: 3, minuses: 0, price: 3000,
        desc: "Zlatý pečetní prsten ukořistěný veliteli lesních banditů, kteří tě zkusili přepadnout."
    },

    // --- U3: TIER A – MLADÍ A DIVOCÍ DRACI (Stupeň 2) ---
    trophy_green: {
        id: "trophy_green",
        name: "Pralesní šupina zeleného draka",
        tier: 2,
        slot: "trophy",
        icon: "🌲",
        source: "Zelený lesní drak (U3)",
        combat: 3, riding: 3, dance: 0, charisma: 1,
        pluses: 7, minuses: 0, price: 8000,
        desc: "Tvrzená šupina pokrytá zkamenělou kůrou a mechem. Odolává šípům i čepelím v hvozdech."
    },
    trophy_swamp: {
        id: "trophy_swamp",
        name: "Jedový bodec bažinného draka",
        tier: 2,
        slot: "trophy",
        icon: "🐊",
        source: "Bažinný jedový drak (U3)",
        combat: 4, riding: 1, dance: 0, charisma: 1,
        pluses: 6, minuses: 0, price: 8500,
        desc: "Ostrý bodec napuštěný tlejícím jedem z močálů. Nepřátelé před tebou v souboji couvají."
    },
    trophy_fairy: {
        id: "trophy_fairy",
        name: "Duhový prach vílího draka",
        tier: 2,
        slot: "trophy",
        icon: "🦋",
        source: "Pohádkový pestrý drak (U3)",
        combat: 1, riding: 1, dance: 4, charisma: 3,
        pluses: 9, minuses: 0, price: 9000,
        desc: "Třpytivá lahvička plná motýlího kouzelného prachu. Rytíř s tímto prachem exceluje na plesech!"
    },
    trophy_water: {
        id: "trophy_water",
        name: "Perla jezerního draka",
        tier: 2,
        slot: "trophy",
        icon: "🌊",
        source: "Vodní jezerní drak (U3)",
        combat: 2, riding: 2, dance: 1, charisma: 4,
        pluses: 9, minuses: 0, price: 9000,
        desc: "Zářivá mořská perla vylovená ze zatopené truhlice. Oslňuje svým leskem celý královský dvůr."
    },
    trophy_wind: {
        id: "trophy_wind",
        name: "Větrné brko nebeského draka",
        tier: 2,
        slot: "trophy",
        icon: "🌪️",
        source: "Větrný nebeský drak (U3)",
        combat: 2, riding: 4, dance: 2, charisma: 1,
        pluses: 9, minuses: 0, price: 9000,
        desc: "Lehoučké pero vznášející se v průvanu. Dodává koni neuvěřitelnou rychlost v závodech."
    },

    // --- U3: TIER B – ŽIVLOVÍ A PRASTAŘÍ DRACI (Stupeň 3) ---
    trophy_red: {
        id: "trophy_red",
        name: "Plamenné srdce ohnivého draka",
        tier: 3,
        slot: "trophy",
        icon: "🐉",
        source: "Červený ohnivý drak (U3)",
        combat: 5, riding: 2, dance: 0, charisma: 3,
        pluses: 10, minuses: 0, price: 13000,
        desc: "Žhnoucí drahokam vyňatý z nitra červeného draka. Hřeje věčným plamenem a dává velkou bojovou sílu."
    },
    trophy_volcano: {
        id: "trophy_volcano",
        name: "Lávový obsidián sopečného draka",
        tier: 3,
        slot: "trophy",
        icon: "🌋",
        source: "Sopečný lávový drak (U3)",
        combat: 6, riding: 1, dance: -1, charisma: 2,
        pluses: 9, minuses: 1, price: 13500,
        desc: "Kus ztvrdlé sopečné lávy naplněné žárem. Roztaví i nejpevnější ocel protivníka."
    },
    trophy_ice: {
        id: "trophy_ice",
        name: "Ledový krystal věčného mrazu",
        tier: 3,
        slot: "trophy",
        icon: "❄️",
        source: "Mrazivý ledový drak (U3)",
        combat: 4, riding: 4, dance: 0, charisma: 2,
        pluses: 10, minuses: 0, price: 13000,
        desc: "Neroztajitelný krystal ledu z mrazivých skal. Zpomaluje údery protivníků v turnajích."
    },
    trophy_lightning: {
        id: "trophy_lightning",
        name: "Hromová šupina bleskového draka",
        tier: 3,
        slot: "trophy",
        icon: "⚡",
        source: "Bouřný bleskový drak (U3)",
        combat: 5, riding: 3, dance: 1, charisma: 2,
        pluses: 11, minuses: 0, price: 14000,
        desc: "Šupina sršící statickou elektřinou. Každý tvůj útok doprovází hrozivý zvuk hromu."
    },
    trophy_black: {
        id: "trophy_black",
        name: "Stínový dráp černého draka",
        tier: 3,
        slot: "trophy",
        icon: "🌑",
        source: "Černý stínový drak (U3)",
        combat: 5, riding: 2, dance: 0, charisma: 3,
        pluses: 10, minuses: 0, price: 13500,
        desc: "Ostrý černofialový dráp, z něhož uniká magický kouř. Vzbuzuje posvátnou hrůzu."
    },
    trophy_crystal: {
        id: "trophy_crystal",
        name: "Ametystové oko křišťálového draka",
        tier: 3,
        slot: "trophy",
        icon: "💎",
        source: "Křišťálový drahokamový drak (U3)",
        combat: 3, riding: 2, dance: 3, charisma: 5,
        pluses: 13, minuses: 0, price: 15000,
        desc: "Pohádkový drahokam nesmírné hodnoty. Jeho záře z tebe učiní nejvýraznější osobnost dvora."
    },
    trophy_bone: {
        id: "trophy_bone",
        name: "Lebka kostěného nemrtvého draka",
        tier: 3,
        slot: "trophy",
        icon: "💀",
        source: "Kostěný nemrtvý drak (U3)",
        combat: 6, riding: 2, dance: -2, charisma: 2,
        pluses: 10, minuses: 2, price: 13000,
        desc: "Děsivá lebka dýchající zelenofialový plamen. Důkaz, že ani smrt nezastaví tvé hrdinství."
    },
    trophy_gold: {
        id: "trophy_gold",
        name: "Zlaté rouno královského draka",
        tier: 3,
        slot: "trophy",
        icon: "👑",
        source: "Zlatý královský drak (U3)",
        combat: 3, riding: 2, dance: 4, charisma: 6,
        pluses: 15, minuses: 0, price: 16000,
        desc: "Tkanina ze zlatých šupin nejbohatšího draka světa. Princezně vyrazí dech svou nádherou."
    },
    trophy_shadow: {
        id: "trophy_shadow",
        name: "Amulet přízračného draka stínů",
        tier: 3,
        slot: "trophy",
        icon: "👻",
        source: "Přízračný drak stínů (U3)",
        combat: 4, riding: 3, dance: 1, charisma: 4,
        pluses: 12, minuses: 0, price: 14000,
        desc: "Mlžný klenot z jiné dimenze. Umožňuje rytíři pohybovat se neslyšně a elegantně."
    },

    // --- U3: TIER C – LEGENDÁRNÍ BOSSOVÉ A VÍCEHLAVÉ SANĚ (Stupeň 3) ---
    trophy_2headed: {
        id: "trophy_2headed",
        name: "Rohy dvouhlavého strážného draka",
        tier: 3,
        slot: "trophy",
        icon: "🐉",
        source: "Dvouhlavý strážný drak (U3)",
        combat: 5, riding: 4, dance: 0, charisma: 3,
        pluses: 12, minuses: 0, price: 15500,
        desc: "Dvojice propletených rohových výrůstků. Poskytuje dvojnásobnou bdělost a reflexy."
    },
    trophy_3headed: {
        id: "trophy_3headed",
        name: "Královská koruna tříhlavé saně",
        tier: 3,
        slot: "trophy",
        icon: "🐲",
        source: "Tříhlavá královská saň (U3)",
        combat: 6, riding: 3, dance: 2, charisma: 5,
        pluses: 16, minuses: 0, price: 17500,
        desc: "Zlatá koruna ze středu hlav legendární saně. Kdo ji nosí, stává se živoucí legendou království!"
    },
    trophy_hydra: {
        id: "trophy_hydra",
        name: "Regenerační šupina pralesní hydry",
        tier: 3,
        slot: "trophy",
        icon: "🐍",
        source: "Prastará lesní hydra (U3)",
        combat: 5, riding: 4, dance: 1, charisma: 4,
        pluses: 14, minuses: 0, price: 16500,
        desc: "Šupina pulzující neutuchající přírodní silou. Zaručuje nevídanou výdrž v jakémkoliv klání."
    },
    trophy_elemental: {
        id: "trophy_elemental",
        name: "Klenot čtyř živlů elementárního draka",
        tier: 3,
        slot: "trophy",
        icon: "🔮",
        source: "Čtyřhlavý živelný drak (U3)",
        combat: 5, riding: 5, dance: 4, charisma: 5,
        pluses: 19, minuses: 0, price: 19000,
        desc: "Mystický klenot spojující Oheň, Led, Jed i Blesk. Posiluje všechny čtyři rytířské ctnosti!"
    },
    trophy_shadow_multi: {
        id: "trophy_shadow_multi",
        name: "Amulet věčné stínové nicoty",
        tier: 3,
        slot: "trophy",
        icon: "🖤",
        source: "Temný stínový vícehlavý drak (U3)",
        combat: 6, riding: 3, dance: 2, charisma: 5,
        pluses: 16, minuses: 0, price: 18500,
        desc: "Posvátný klenot temnot. Zažene jakékoliv zlé kouzlo a dává nositeli respekt mocných pánů."
    },
    trophy_5headed: {
        id: "trophy_5headed",
        name: "Císařské žezlo pětihlavého draka Zkázy",
        tier: 3,
        slot: "trophy",
        icon: "👑",
        source: "Pětihlavý drak Zkázy (U3)",
        combat: 7, riding: 4, dance: 3, charisma: 6,
        pluses: 20, minuses: 0, price: 22000,
        desc: "Ultimátní trofej ze samotného dračího císaře! Žezlo ze zlata a obsidiánu zaručující věčnou slávu."
    },
    // ========================================================================
    // 34 NOVÝCH UNIKÁTNÍCH TROFEJÍ Z BÁJNÝCH MONSTER A ŠELEM (5. SLOT ZBROJNICE)
    // ========================================================================
    // --- U1 Trofeje ze zvěře a lesních dravců ---
    trophy_lynx: {
        id: "trophy_lynx", name: "Ostrý rysí zrak", tier: 1, slot: "trophy", icon: "🐱",
        source: "Rys ostrovid (U1)", combat: 1, riding: 1, dance: 0, charisma: 0, pluses: 2, minuses: 0, price: 2000,
        desc: "Vyčiněný amulet s rysími drápy a lístky kapradí. Zlepšuje postřeh v nočním lese."
    },
    trophy_bison: {
        id: "trophy_bison", name: "Zubří rohovina", tier: 1, slot: "trophy", icon: "🦬",
        source: "Zuřivý pralesní zubr (U1)", combat: 2, riding: 0, dance: -1, charisma: 0, pluses: 2, minuses: 1, price: 2200,
        desc: "Hladce vyleštěný roh pralesního obra. Dává nositeli nezlomnou průbojnost."
    },
    trophy_panther: {
        id: "trophy_panther", name: "Plášť z panteří kůže", tier: 1, slot: "trophy", icon: "🐆",
        source: "Černý královský panter (U1)", combat: 0, riding: 1, dance: 1, charisma: 1, pluses: 3, minuses: 0, price: 2500,
        desc: "Hebká ebenová kožešina královské šelmy. Dodává rytíři neslyšný krok a vznešenou auru."
    },
    trophy_spider: {
        id: "trophy_spider", name: "Jedový váček pavouka", tier: 1, slot: "trophy", icon: "🕷️",
        source: "Obří lesní pavouk (U1)", combat: 1, riding: 0, dance: 0, charisma: 1, pluses: 2, minuses: 0, price: 2300,
        desc: "Krystalizovaný kapkovitý váček se třpytivým jedem. Nošen na opasku budí respekt lapků."
    },
    trophy_croc: {
        id: "trophy_croc", name: "Pancéřový opasek z krokodýla", tier: 1, slot: "trophy", icon: "🐊",
        source: "Jezerní krokodýl (U1)", combat: 2, riding: 1, dance: 0, charisma: 0, pluses: 3, minuses: 0, price: 2600,
        desc: "Opasek z hrubé šupinaté kůže jezerní bestie. Chrání před zákeřnými výpady zblízka."
    },
    trophy_eagle: {
        id: "trophy_eagle", name: "Péro orlího krále", tier: 1, slot: "trophy", icon: "🦅",
        source: "Skalní orel (U1)", combat: 0, riding: 2, dance: 0, charisma: 1, pluses: 3, minuses: 0, price: 3000,
        desc: "Zlatohnědé pero horského dravce zdobící chochol přilbice. Zvyšuje rychlost a přehled v sedle."
    },
    trophy_boar_lone: {
        id: "trophy_boar_lone", name: "Válečný tesák Samotáře", tier: 1, slot: "trophy", icon: "🐗",
        source: "Hvozdný divočák Samotář (U1)", combat: 2, riding: 1, dance: -1, charisma: 0, pluses: 3, minuses: 1, price: 2700,
        desc: "Zahnutý tesák ze starého kance. Důkaz odvahy rytíře, který svedl boj muž proti muži."
    },
    trophy_wolverine: {
        id: "trophy_wolverine", name: "Hřejivá rosomáčí hučka", tier: 1, slot: "trophy", icon: "🦡",
        source: "Severní vlkobijec (U1)", combat: 2, riding: 0, dance: 0, charisma: 1, pluses: 3, minuses: 0, price: 2800,
        desc: "Nezničitelná hučka ze severského dravce. Žádný mráz ani bouře rytíře nezlomí."
    },
    trophy_pike: {
        id: "trophy_pike", name: "Jezerní stříbrná šupina", tier: 1, slot: "trophy", icon: "🐟",
        source: "Obří jezerní štika (U1)", combat: 1, riding: 0, dance: 1, charisma: 2, pluses: 4, minuses: 0, price: 3200,
        desc: "Obrovská zrcadlová šupina ulovená v hlubokých tůních. Odráží měsíční svit a těší dvůr."
    },
    trophy_unicorn: {
        id: "trophy_unicorn", name: "Roh čistoty a světla", tier: 1, slot: "trophy", icon: "🦄",
        source: "Magický bílý jednorožec (U1)", combat: 0, riding: 1, dance: 2, charisma: 2, pluses: 5, minuses: 0, price: 3800,
        desc: "Spirálovitý perleťový roh posvátné bytosti. Princezna na plese zatají dech úžasem."
    },

    // --- U2 Trofeje z bájných monster a protivníků ---
    trophy_basilisk: {
        id: "trophy_basilisk", name: "Zkamenělé baziliščí oko", tier: 2, slot: "trophy", icon: "🦎",
        source: "Zkamenělý bazilišek (U2)", combat: 2, riding: 0, dance: 0, charisma: 3, pluses: 5, minuses: 0, price: 6500,
        desc: "Klenot ze ztuhlého jantaru a smaragdu. Soupeři při pohledu do něj znejistí."
    },
    trophy_wisp: {
        id: "trophy_wisp", name: "Lucerna bludiček", tier: 2, slot: "trophy", icon: "🕯️",
        source: "Močálová jezinka (U2)", combat: 0, riding: 1, dance: 2, charisma: 3, pluses: 6, minuses: 0, price: 6800,
        desc: "Mosazná lucerna s věčně tančícím modrým plamínkem. Ukazuje bezpečnou cestu mlhou."
    },
    trophy_troll: {
        id: "trophy_troll", name: "Kamenné srdce trolla", tier: 2, slot: "trophy", icon: "🧌",
        source: "Horský kamenný troll (U2)", combat: 4, riding: 1, dance: -2, charisma: 0, pluses: 5, minuses: 2, price: 6500,
        desc: "Těžký křemencový kámen tepající horskou silou. Rytíř získá údernost skalního balvanu."
    },
    trophy_minotaur: {
        id: "trophy_minotaur", name: "Zlatý kroužek Minotaura", tier: 2, slot: "trophy", icon: "🐂",
        source: "Minotaurus z labyrintu (U2)", combat: 4, riding: 2, dance: -1, charisma: 1, pluses: 7, minuses: 1, price: 7200,
        desc: "Masivní tepaný kroužek pána labyrintu. Propůjčuje neomylný orientační smysl a hrubou sílu."
    },
    trophy_manticore: {
        id: "trophy_manticore", name: "Trn z ocasu mantikory", tier: 2, slot: "trophy", icon: "🦁",
        source: "Pralesní mantikora (U2)", combat: 3, riding: 2, dance: 0, charisma: 2, pluses: 7, minuses: 0, price: 7400,
        desc: "Kostěný osten z bájné mantikory. Přidělán k jílcové záštitě meče vzbuzuje posvátnou hrůzu."
    },
    trophy_griffin: {
        id: "trophy_griffin", name: "Gryfí letka a spáry", tier: 2, slot: "trophy", icon: "🦅",
        source: "Skalní gryf (U2)", combat: 2, riding: 4, dance: 0, charisma: 1, pluses: 7, minuses: 0, price: 7500,
        desc: "Obruby štítu zdobené zlatým gryfím peřím a spárem. Zvyšují rychlost rytíře při zteči."
    },
    trophy_siren: {
        id: "trophy_siren", name: "Kouzelná mušle mořské sirény", tier: 2, slot: "trophy", icon: "🧜‍♀️",
        source: "Zrádná siréna (U2)", combat: 0, riding: 0, dance: 4, charisma: 3, pluses: 7, minuses: 0, price: 7600,
        desc: "Duhová perleťová ulita znějící zpěvem vln. Kdo ji přiloží k uchu, tančí s lehkostí vánku."
    },
    trophy_ghost_knight: {
        id: "trophy_ghost_knight", name: "Prokletá rytířská pečeť", tier: 2, slot: "trophy", icon: "💀",
        source: "Kostlivý přízrak (U2)", combat: 3, riding: 1, dance: 0, charisma: 2, pluses: 6, minuses: 0, price: 7500,
        desc: "Zrezivělá stříbrná pečeť dávného turnajového vítěze. Osvobozena od temnoty, slouží novému hrdinovi."
    },
    trophy_lesovik: {
        id: "trophy_lesovik", name: "Kouzelná větev Lesovika", tier: 2, slot: "trophy", icon: "👺",
        source: "Lesní hejkal (U2)", combat: 2, riding: 2, dance: 2, charisma: 1, pluses: 7, minuses: 0, price: 7800,
        desc: "Rostlá dubová hůlka z nitra kouzelného hvozdu. Zvířata v lese rytíře poslouchají na slovo."
    },
    trophy_ghoul: {
        id: "trophy_ghoul", name: "Amulet věčného odpočinku", tier: 2, slot: "trophy", icon: "🧟",
        source: "Hřbitovní ghúl (U2)", combat: 2, riding: 0, dance: 1, charisma: 4, pluses: 7, minuses: 0, price: 8000,
        desc: "Stříbrný medailon se svěcenou vodou. Zajišťuje přízeň kněží a uznání královského dvora."
    },
    trophy_golem: {
        id: "trophy_golem", name: "Šém hliněného Golema", tier: 2, slot: "trophy", icon: "🗿",
        source: "Magický hliněný Golem (U2)", combat: 4, riding: 0, dance: -2, charisma: 3, pluses: 7, minuses: 2, price: 8200,
        desc: "Zlatá destička s posvátnými runami vyňatá z čela obra. Zaručuje železnou pevnost v obraně."
    },
    trophy_harpy: {
        id: "trophy_harpy", name: "Ostrý pařát skalní harpyje", tier: 2, slot: "trophy", icon: "🪶",
        source: "Skalní krvežíznivá Harpyje (U2)", combat: 3, riding: 2, dance: 1, charisma: 0, pluses: 6, minuses: 0, price: 7500,
        desc: "Zahnutý pařát z horských štítů. Rytíř s ním snadno zdolá strmé průsmyky i úskoky nepřátel."
    },
    trophy_alpha_werewolf: {
        id: "trophy_alpha_werewolf", name: "Stříbrem kovaný tesák Alfy", tier: 2, slot: "trophy", icon: "🐺",
        source: "Alfa vlkodlak noční smečky (U2)", combat: 4, riding: 2, dance: 0, charisma: 1, pluses: 7, minuses: 0, price: 8500,
        desc: "Masivní tesák vůdce vlkodlačí smečky zasazený ve stříbře. Celé království uznává tvou autoritu."
    },

    // --- U2+/U3 Trofeje z legendárních titánů a bájných monster ---
    trophy_kraken: {
        id: "trophy_kraken", name: "Chapadlo z mořských hlubin", tier: 3, slot: "trophy", icon: "🐙",
        source: "Mořský kraken (U2+)", combat: 4, riding: 2, dance: 0, charisma: 3, pluses: 9, minuses: 0, price: 11000,
        desc: "Fosilní zkamenělé chapadlo mořské saňe. Svědectví o vítězství nad samotným oceánem."
    },
    trophy_sphinx: {
        id: "trophy_sphinx", name: "Smaragdové oko sfingy", tier: 3, slot: "trophy", icon: "🦁",
        source: "Královská sfinga (U2+)", combat: 1, riding: 2, dance: 2, charisma: 6, pluses: 11, minuses: 0, price: 12000,
        desc: "Zářivý klenot z roucha moudré strážkyně pouště. Propůjčuje nepřekonatelné vladařské Charisma."
    },
    trophy_yeti: {
        id: "trophy_yeti", name: "Kožešina sněžného yettiho", tier: 3, slot: "trophy", icon: "❄️",
        source: "Sněžný yetti (U2+)", combat: 4, riding: 3, dance: -1, charisma: 2, pluses: 9, minuses: 1, price: 11500,
        desc: "Bělostná nepromokavá srst vládce velehor. Žádný mrazivý dech nestvůry rytíře neohrozí."
    },
    trophy_phoenix: {
        id: "trophy_phoenix", name: "Zlaté pero věčného Fénixe", tier: 3, slot: "trophy", icon: "🪶",
        source: "Ohnivý pták Fénix (U2+)", combat: 2, riding: 2, dance: 4, charisma: 5, pluses: 13, minuses: 0, price: 13000,
        desc: "Pero planoucí teplým zlatavým ohněm, které nikdy nevyhasne. Přináší věčné štěstí a slávu."
    },
    trophy_chimera: {
        id: "trophy_chimera", name: "Štít z chiméří lebky", tier: 3, slot: "trophy", icon: "🐐",
        source: "Tříhlavá chiméra (U2+)", combat: 5, riding: 2, dance: 0, charisma: 2, pluses: 9, minuses: 0, price: 12500,
        desc: "Štít pobitý bronzem a rohy chiméry. Odráží plameny i jedovaté kousance."
    },
    trophy_cerberus: {
        id: "trophy_cerberus", name: "Železný obojek podsvětí", tier: 3, slot: "trophy", icon: "🐕‍🦺",
        source: "Kerberos (U2+)", combat: 4, riding: 1, dance: 0, charisma: 4, pluses: 9, minuses: 0, price: 12000,
        desc: "Těžký kovaný obojek strážce temných bran. Nošený jako nátepník dodává nadlidskou sílu."
    },
    trophy_centaur: {
        id: "trophy_centaur", name: "Tětiva z hřívy kentaura", tier: 3, slot: "trophy", icon: "🏹",
        source: "Urozený kentaur (U2+)", combat: 4, riding: 4, dance: 0, charisma: 2, pluses: 10, minuses: 0, price: 13500,
        desc: "Nezlomná hedvábná tětiva z hřívy lesního šampiona. Zaručuje neomylnou mušku a mistrovskou jízdu."
    },
    trophy_titan: {
        id: "trophy_titan", name: "Hromový blesk titánů", tier: 3, slot: "trophy", icon: "⚡",
        source: "Hromovládný titán bouří (U2+)", combat: 6, riding: 2, dance: -1, charisma: 3, pluses: 11, minuses: 1, price: 14000,
        desc: "Ztuhlý hromoklín z modrého meteoru. Srší z něj blesky a otřásá bojištěm."
    },
    trophy_skeleton_king: {
        id: "trophy_skeleton_king", name: "Zlatá koruna padlého vladaře", tier: 3, slot: "trophy", icon: "👑",
        source: "Král kostlivců na trůně (U2+)", combat: 4, riding: 1, dance: 2, charisma: 6, pluses: 13, minuses: 0, price: 15000,
        desc: "Starobylá královská koruna posázená safíry. Princezna v ní spatřuje právoplatného panovníka."
    },
    trophy_shadow_demon: {
        id: "trophy_shadow_demon", name: "Krystal temného vykoupení", tier: 3, slot: "trophy", icon: "👿",
        source: "Stínový démon z propasti (U2+)", combat: 4, riding: 3, dance: 3, charisma: 3, pluses: 13, minuses: 0, price: 15500,
        desc: "Fialově pulzující kámen očištěný od zla. Dokonalá harmonie všech čtyř ctností rytířského stavu."
    },
    trophy_behemoth: {
        id: "trophy_behemoth", name: "Kly bájného Behemota", tier: 3, slot: "trophy", icon: "🦣",
        source: "Bájný obří Behemot (U2+)", combat: 6, riding: 1, dance: -2, charisma: 2, pluses: 9, minuses: 2, price: 14500,
        desc: "Monstrózní kly prastarého pozemního titána. Žádná hradba ani zbroj jim neodolá."
    }

};

// Automatické zařazení všech 29 trofejí mezi herní předměty
(function () {
    for (var k in window.PRS_TROPHIES) {
        if (window.PRS_TROPHIES.hasOwnProperty(k)) {
            window.PRS_ITEMS.push(window.PRS_TROPHIES[k]);
        }
    }
})();

// Katalog úkolů a monster: U1 (Zvěř: 4–6), U2 (Monstra: 8–10), U3 (Draci: 12–14)
window.PRS_QUESTS = {
    U1: [
        { id: "u1_1", name: "Divoký kňour", icon: "🐗", difficulty: 4, diffOffset: -1, gold: 1200, hearts: 0.5, trophyId: "trophy_boar", img: "assets/monsters/monster_boar.png", imgFlip: "assets/monsters/monster_boar_flip.png", weakness: "dogs", desc: "V hlubokém lese na tebe vyrazil rozzuřený kanec. Lovečtí psi snadno odlákají jeho pozornost!" },
        { id: "u1_2", name: "Smečka šedých vlků", icon: "🐺", difficulty: 5, diffOffset: 0, gold: 1500, hearts: 0.5, trophyId: "trophy_wolf", img: "assets/monsters/monster_wolf_pack.png", imgFlip: "assets/monsters/monster_wolf_pack_flip.png", weakness: "spear", desc: "Vlčí smečka ohrožuje kupecké vozy u vesnice. Dlouhé kopí udrží vlky v bezpečném odstupu." },
        { id: "u1_3", name: "Horský medvěd", icon: "🐻", difficulty: 5, diffOffset: 0, gold: 1800, hearts: 0.5, trophyId: "trophy_bear", img: "assets/monsters/monster_bear.png", imgFlip: "assets/monsters/monster_bear_flip.png", weakness: "horse", desc: "Obrovský medvěd brání průsmyk ke hradu. Rychlý útok na koni zaskočí jeho těžkopádnost." },
        { id: "u1_4", name: "Královský bílý jelen", icon: "🦌", difficulty: 6, diffOffset: 1, gold: 2200, hearts: 1.0, trophyId: "trophy_stag", img: "assets/monsters/monster_white_stag.png", imgFlip: "assets/monsters/monster_white_stag_flip.png", weakness: "falcons", desc: "Vzácný jelen v kouzelném háji. Lovecký sokol vystopuje jeho stopy v houštinách." },
        // --- Nová zvěř a lesní strážci (Tier U1) ---
        { id: "u1_lynx", name: "Rys ostrovid", icon: "🐱", difficulty: 4, diffOffset: -1, gold: 1100, hearts: 0.5, trophyId: "trophy_lynx", img: "assets/monsters/monster_lynx.png", imgFlip: "assets/monsters/monster_lynx_flip.png", weakness: "falcons", desc: "Opatrný rys číhající ve větvích dubu. Lovecký sokol vystopuje jeho úkryt v korunách stromů." },
        { id: "u1_bison", name: "Zuřivý pralesní zubr", icon: "🦬", difficulty: 5, diffOffset: 0, gold: 1400, hearts: 0.5, trophyId: "trophy_bison", img: "assets/monsters/monster_bison.png", imgFlip: "assets/monsters/monster_bison_flip.png", weakness: "horse", desc: "Těžký zubr střežící pralesní mýtinu. Rychlý nájezd na koni vyvede mohutné zvíře z rovnováhy." },
        { id: "u1_panther", name: "Černý královský panter", icon: "🐆", difficulty: 5, diffOffset: 0, gold: 1600, hearts: 0.5, trophyId: "trophy_panther", img: "assets/monsters/monster_panther.png", imgFlip: "assets/monsters/monster_panther_flip.png", weakness: "dogs", desc: "Hbitá šelma ze stínů skalního převisu. Smečka loveckých psů zažene pantera do úzkých." },
        { id: "u1_spider", name: "Obří lesní pavouk", icon: "🕷️", difficulty: 5, diffOffset: 0, gold: 1500, hearts: 0.5, trophyId: "trophy_spider", img: "assets/monsters/monster_spider.png", imgFlip: "assets/monsters/monster_spider_flip.png", weakness: "fire", desc: "Nestvůrný pavouk spřádající lepkavé sítě přes lesní stezku. Žár pochodní a oheň spálí jeho pavučiny." },
        { id: "u1_croc", name: "Jezerní krokodýl (Chňapal)", icon: "🐊", difficulty: 6, diffOffset: 1, gold: 1800, hearts: 0.5, trophyId: "trophy_croc", img: "assets/monsters/monster_croc.png", imgFlip: "assets/monsters/monster_croc_flip.png", weakness: "spear", desc: "Obrněný plaz z močálových tůní. Dlouhé kopí probodne jeho tvrdý hřbetní krunýř." },
        { id: "u1_eagle", name: "Skalní orel skalnatý", icon: "🦅", difficulty: 6, diffOffset: 1, gold: 2000, hearts: 1.0, trophyId: "trophy_eagle", img: "assets/monsters/monster_eagle.png", imgFlip: "assets/monsters/monster_eagle_flip.png", weakness: "falcons", desc: "Majestátní orel bránící hnízdo na horském štítu. Vycvičený sokol svede vzdušný souboj." },
        { id: "u1_boar_lone", name: "Hvozdný divočák Samotář", icon: "🐗", difficulty: 6, diffOffset: 1, gold: 1900, hearts: 1.0, trophyId: "trophy_boar_lone", img: "assets/monsters/monster_boar_lone.png", imgFlip: "assets/monsters/monster_boar_lone_flip.png", weakness: "spear", desc: "Prastarý divočák s mohutnými kly. Pevné jezdecké kopí zastaví jeho drtivý čelní rozběh." },
        { id: "u1_wolverine", name: "Severní vlkobijec (Rosomák)", icon: "🦡", difficulty: 6, diffOffset: 1, gold: 2100, hearts: 1.0, trophyId: "trophy_wolverine", img: "assets/monsters/monster_wolverine.png", imgFlip: "assets/monsters/monster_wolverine_flip.png", weakness: "armor", desc: "Zuřivý a houževnatý dravý seveřan. Pevná rytířská zbroj odrazí jeho zběsilé kousance." },
        { id: "u1_pike", name: "Obří jezerní štika", icon: "🐟", difficulty: 7, diffOffset: 2, gold: 2300, hearts: 1.0, trophyId: "trophy_pike", img: "assets/monsters/monster_pike.png", imgFlip: "assets/monsters/monster_pike_flip.png", weakness: "spear", desc: "Monstrózní štika ohrožující rybářské bárky na jezeře. Rytířské kopí pronikne pod hladinu." },
        { id: "u1_unicorn", name: "Magický bílý jednorožec", icon: "🦄", difficulty: 7, diffOffset: 2, gold: 2600, hearts: 1.5, trophyId: "trophy_unicorn", img: "assets/monsters/monster_unicorn.png", imgFlip: "assets/monsters/monster_unicorn_flip.png", weakness: "dance", desc: "Bájný jednorožec z kouzelného háje. Lze jej zkrotit pouze vznešeným tancem, čistotou a šaty!" }
    ],
    U2: [
        { id: "u2_1", name: "Skalní obr", icon: "👹", difficulty: 8, diffOffset: -1, gold: 3000, hearts: 1.0, itemTier: 1, trophyId: "trophy_giant", img: "assets/monsters/monster_rock_giant.png", imgFlip: "assets/monsters/monster_rock_giant_flip.png", weakness: "horse", desc: "Obr s obřím kyjem vybírá mýto u mostu. Rychlý kůň dovolí rytíři manévrovat kolem jeho úderů." },
        { id: "u2_2", name: "Temný černokněžník", icon: "🧙‍♂️", difficulty: 9, diffOffset: 0, gold: 3500, hearts: 1.0, itemTier: 1, trophyId: "trophy_warlock", img: "assets/monsters/monster_warlock.png", imgFlip: "assets/monsters/monster_warlock_flip.png", weakness: "spear", desc: "Zlý čaroděj sesílá kletby ze své chatrče. Dlouhé kopí probodne jeho magické bariéry." },
        { id: "u2_3", name: "Černý loupeživý rytíř", icon: "⚔️", difficulty: 9, diffOffset: 0, gold: 4000, hearts: 1.5, itemTier: 2, trophyId: "trophy_black_knight", img: "assets/monsters/monster_black_knight.png", imgFlip: "assets/monsters/monster_black_knight_flip.png", weakness: "armor", desc: "Obávaný rytíř ve starých ruinách tě vyzval na souboj. Pevná plátová zbroj odrazí jeho úder." },
        { id: "u2_4", name: "Jeskynní vlkodlak", icon: "🐺", difficulty: 10, diffOffset: 1, gold: 4500, hearts: 1.5, itemTier: 2, trophyId: "trophy_werewolf", img: "assets/monsters/monster_cave_werewolf.png", imgFlip: "assets/monsters/monster_cave_werewolf_flip.png", weakness: "dogs", desc: "V tajemné jeskyni číhá bestie. Lovecká smečka vycítí pach vlkodlaka a pomůže v boji." },
        // --- Nová bájná monstra a protivníci (Tier U2 • Obtížnost 8–11) ---
        { id: "u2_basilisk", name: "Zkamenělý bazilišek", icon: "🦎", difficulty: 8, diffOffset: -1, gold: 3200, hearts: 1.0, itemTier: 1, trophyId: "trophy_basilisk", img: "assets/monsters/monster_basilisk.png", imgFlip: "assets/monsters/monster_basilisk_flip.png", weakness: "armor", desc: "Plaz s vražedným pohledem číhající v jeskyni. Vyleštěný štít a pevná zbroj odrazí jeho zkázonosný zrak." },
        { id: "u2_wisp", name: "Močálová jezinka / Bludička", icon: "🕯️", difficulty: 8, diffOffset: -1, gold: 3400, hearts: 1.0, itemTier: 1, trophyId: "trophy_wisp", img: "assets/monsters/monster_wisp.png", imgFlip: "assets/monsters/monster_wisp_flip.png", weakness: "light", desc: "Zákeřný přelud lákající pocestné do bezedného bahna. Svaté světlo relikvií rozežene její klamná světla." },
        { id: "u2_troll", name: "Horský kamenný troll", icon: "🧌", difficulty: 9, diffOffset: 0, gold: 3800, hearts: 1.5, itemTier: 1, trophyId: "trophy_troll", img: "assets/monsters/monster_troll.png", imgFlip: "assets/monsters/monster_troll_flip.png", weakness: "fire", desc: "Těžkopádný troll s kůží tvrdou jako žula. Žhavý oheň a plamenné zbraně zabrání jeho regeneraci." },
        { id: "u2_minotaur", name: "Minotaurus z labyrintu", icon: "🐂", difficulty: 9, diffOffset: 0, gold: 4000, hearts: 1.5, itemTier: 2, trophyId: "trophy_minotaur", img: "assets/monsters/monster_minotaur.png", imgFlip: "assets/monsters/monster_minotaur_flip.png", weakness: "horse", desc: "Rohatý kolos střežící kamenný labyrint. Rychlý nájezd na koni nedovolí bestii zaměřit obří sekeru." },
        { id: "u2_manticore", name: "Pralesní mantikora", icon: "🦁", difficulty: 9, diffOffset: 0, gold: 4200, hearts: 1.5, itemTier: 2, trophyId: "trophy_manticore", img: "assets/monsters/monster_manticore.png", imgFlip: "assets/monsters/monster_manticore_flip.png", weakness: "elixir", desc: "Lví bestie s netopýřími křídly a škorpióním ocasem. Hojivý lektvar z Lazaretu neutralizuje její smrtící jed." },
        { id: "u2_griffin", name: "Skalní gryf", icon: "🦅", difficulty: 10, diffOffset: 1, gold: 4500, hearts: 1.5, itemTier: 2, trophyId: "trophy_griffin", img: "assets/monsters/monster_griffin.png", imgFlip: "assets/monsters/monster_griffin_flip.png", weakness: "horse", desc: "Hrdý kříženec lva a orla hnízdící na útesech. Útok z plné jízdy na koni vyrovná jeho vzdušnou převahu." },
        { id: "u2_siren", name: "Zrádná siréna ze zátoky", icon: "🧜‍♀️", difficulty: 10, diffOffset: 1, gold: 4600, hearts: 2.0, itemTier: 2, trophyId: "trophy_siren", img: "assets/monsters/monster_siren.png", imgFlip: "assets/monsters/monster_siren_flip.png", weakness: "dance", desc: "Mořská víla svádějící rytíře do hlubin svým zpěvem. Vznešený dvorský tanec a rytmus zlomí její kouzlo." },
        { id: "u2_ghost_knight", name: "Kostlivý rytířský přízrak", icon: "💀", difficulty: 10, diffOffset: 1, gold: 4800, hearts: 2.0, itemTier: 2, trophyId: "trophy_ghost_knight", img: "assets/monsters/monster_ghost_knight.png", imgFlip: "assets/monsters/monster_ghost_knight_flip.png", weakness: "holy", desc: "Přízračný šampion v rezavé zbroji bloudící po bojištích. Posvěcená čepel a čistá víra zničí jeho kletbu." },
        { id: "u2_lesovik", name: "Lesní hejkal (Lesovik)", icon: "👺", difficulty: 11, diffOffset: 1, gold: 5000, hearts: 2.0, itemTier: 2, trophyId: "trophy_lesovik", img: "assets/monsters/monster_lesovik.png", imgFlip: "assets/monsters/monster_lesovik_flip.png", weakness: "courage", desc: "Starobylý duch hvozdu děsící pocestné ohlušujícím křikem. Pevná rytířská odvaha přemůže jeho lesní magii." },
        { id: "u2_ghoul", name: "Hřbitovní ghúl / Nekromant", icon: "🧟", difficulty: 11, diffOffset: 1, gold: 5200, hearts: 2.0, itemTier: 2, trophyId: "trophy_ghoul", img: "assets/monsters/monster_ghoul.png", imgFlip: "assets/monsters/monster_ghoul_flip.png", weakness: "light", desc: "Ohavný vykradač hrobek vyvolávající temné síly. Zářící světlo posvátných klenotů spálí jeho hnilobné kouzlo." },
        { id: "u2_golem", name: "Magický hliněný Golem", icon: "🗿", difficulty: 11, diffOffset: 1, gold: 5300, hearts: 2.0, itemTier: 2, trophyId: "trophy_golem", img: "assets/monsters/monster_golem.png", imgFlip: "assets/monsters/monster_golem_flip.png", weakness: "spear", desc: "Oživený hliněný obr střežící alchymistickou dílnu. Dlouhé kopí pronikne mezi kamenné spáry a zasáhne šém." },
        { id: "u2_harpy", name: "Skalní krvežíznivá Harpyje", icon: "🪶", difficulty: 11, diffOffset: 1, gold: 4900, hearts: 1.5, itemTier: 2, trophyId: "trophy_harpy", img: "assets/monsters/monster_harpy.png", imgFlip: "assets/monsters/monster_harpy_flip.png", weakness: "falcons", desc: "Dravá okřídlená stvůra napadající rytíře ze skalisek. Lovecký sokol bleskově zmaří její střemhlavý útok." },
        { id: "u2_alpha_werewolf", name: "Alfa vlkodlak noční smečky", icon: "🐺", difficulty: 11, diffOffset: 2, gold: 5500, hearts: 2.0, itemTier: 2, trophyId: "trophy_alpha_werewolf", img: "assets/monsters/monster_alpha_werewolf.png", imgFlip: "assets/monsters/monster_alpha_werewolf_flip.png", weakness: "dogs", desc: "Hrozivý vůdce vlkodlaků s očima planoucíma rudým žárem. Vycvičená psí smečka roztrhá jeho noční převahu." },

        // --- Legendární titáni a epická monstra (Tier U2+ • Obtížnost 12–15) ---
        { id: "u2_kraken", name: "Mořský kraken (Hlubinný běs)", icon: "🐙", difficulty: 12, diffOffset: 2, gold: 6500, hearts: 2.5, itemTier: 3, trophyId: "trophy_kraken", img: "assets/monsters/monster_kraken.png", imgFlip: "assets/monsters/monster_kraken_flip.png", weakness: "water_armor", desc: "Obrovské chapadlovité monstrum z hlubin moře. Vodní perla a rytířská zbroj ochrání před stažením pod vodu." },
        { id: "u2_sphinx", name: "Pouštní královská sfinga", icon: "🦁", difficulty: 12, diffOffset: 2, gold: 7000, hearts: 3.0, itemTier: 3, trophyId: "trophy_sphinx", img: "assets/monsters/monster_sphinx.png", imgFlip: "assets/monsters/monster_sphinx_flip.png", weakness: "charisma", desc: "Moudrá a nebezpečná bytost střežící královské hrobky. Její prastaré hádanky rozluští pouze vysoké Charisma!" },
        { id: "u2_yeti", name: "Sněžný yetti (Vládce velehor)", icon: "❄️", difficulty: 12, diffOffset: 2, gold: 6800, hearts: 2.5, itemTier: 3, trophyId: "trophy_yeti", img: "assets/monsters/monster_yeti.png", imgFlip: "assets/monsters/monster_yeti_flip.png", weakness: "fire", desc: "Ledový kolos obývající zamrzlé horské průsmyky. Žár sopečných pochodní a oheň rozežene jeho ledový dech." },
        { id: "u2_phoenix", name: "Ohnivý pták Fénix", icon: "🪶", difficulty: 13, diffOffset: 3, gold: 8000, hearts: 3.5, itemTier: 3, trophyId: "trophy_phoenix", img: "assets/monsters/monster_phoenix.png", imgFlip: "assets/monsters/monster_phoenix_flip.png", weakness: "ice", desc: "Bájný pták znovuzrozený ze žhavého popela. Mrazivá zbraň a ledové relikvie zchladí jeho spalující plamen." },
        { id: "u2_chimera", name: "Tříhlavá chiméra", icon: "🐐", difficulty: 13, diffOffset: 3, gold: 8500, hearts: 3.5, itemTier: 3, weakness: "animals", trophyId: "trophy_chimera", img: "assets/monsters/monster_chimera.png", imgFlip: "assets/monsters/monster_chimera_flip.png", desc: "Nestvůra s tělem lva, hlavy kozy a hadím ocasem. Smečka vycvičených psů a sokol rozdělí pozornost tří hlav." },
        { id: "u2_cerberus", name: "Kerberos (Strážce podsvětí)", icon: "🐕‍🦺", difficulty: 13, diffOffset: 3, gold: 8200, hearts: 3.5, itemTier: 3, trophyId: "trophy_cerberus", img: "assets/monsters/monster_cerberus.png", imgFlip: "assets/monsters/monster_cerberus_flip.png", weakness: "dogs", desc: "Trojhlavý pekelný pes střežící bránu zatracení. Znalost kynologie a přítomnost psů v chovu šelmu uchlácholí." },
        { id: "u2_centaur", name: "Urozený kentaur – Pán luků", icon: "🏹", difficulty: 14, diffOffset: 3, gold: 9500, hearts: 4.0, itemTier: 3, trophyId: "trophy_centaur", img: "assets/monsters/monster_centaur.png", imgFlip: "assets/monsters/monster_centaur_flip.png", weakness: "spear", desc: "Hrdý lesní válečník, napůl člověk a napůl kůň. Útok těžkým turnajovým dřevcem v plné jízdě přetne jeho střelbu." },
        { id: "u2_titan", name: "Hromovládný titán bouří", icon: "⚡", difficulty: 14, diffOffset: 4, gold: 10000, hearts: 4.5, itemTier: 3, trophyId: "trophy_titan", img: "assets/monsters/monster_titan.png", imgFlip: "assets/monsters/monster_titan_flip.png", weakness: "armor", desc: "Obří titán vládnoucí bleskům z bouřkových mračen. Masivní pozlacená rytířská zbroj bezpečně svede elektrické výboje." },
        { id: "u2_skeleton_king", name: "Král kostlivců na trůně", icon: "👑", difficulty: 15, diffOffset: 4, gold: 11000, hearts: 5.0, itemTier: 3, trophyId: "trophy_skeleton_king", img: "assets/monsters/monster_skeleton_king.png", imgFlip: "assets/monsters/monster_skeleton_king_flip.png", weakness: "holy", desc: "Prastarý vladař povstalý z krypty s diamantovým žezlem. Posvěcená královská relikvie navrátí jeho duši klid." },
        { id: "u2_shadow_demon", name: "Stínový démon z propasti", icon: "👿", difficulty: 15, diffOffset: 4, gold: 12000, hearts: 5.0, itemTier: 3, trophyId: "trophy_shadow_demon", img: "assets/monsters/monster_shadow_demon.png", imgFlip: "assets/monsters/monster_shadow_demon_flip.png", weakness: "mastery", desc: "Netvorný pán temnoty vystupující z puklin země. Dokonalé mistrovství všech čtyř rytířských ctností zaručí triumf!" },
        { id: "u2_behemoth", name: "Bájný obří Behemot", icon: "🦣", difficulty: 15, diffOffset: 4, gold: 11500, hearts: 4.5, itemTier: 3, trophyId: "trophy_behemoth", img: "assets/monsters/monster_behemoth.png", imgFlip: "assets/monsters/monster_behemoth_flip.png", weakness: "spear", desc: "Pravěký pozemní gigant otřásající zemí každým krokem. Dlouhé kopí šampionů najde skulinu pod krunýřem." }
    ],
    U3: [
        // --- TIER A: Mladí a divocí draci (Obtížnost 11–12) ---
        { id: "u3_green", name: "Zelený lesní drak", icon: "🌲", tierGroup: "young", difficulty: 11, diffOffset: -2, gold: 6500, hearts: 2.5, itemTier: 2, trophyId: "trophy_green", img: "assets/dragons/dragon_green.png",
        imgFlip: "assets/dragons/dragon_green_flip.png", weakness: "dogs", desc: "Drak s šupinami z kůry a mechu. Lovečtí psi snadno odlákají jeho pozornost!" },
        { id: "u3_swamp", name: "Bažinný jedový drak", icon: "🐊", tierGroup: "young", difficulty: 11, diffOffset: -2, gold: 7000, hearts: 2.5, itemTier: 2, trophyId: "trophy_swamp", img: "assets/dragons/dragon_swamp.png",
        imgFlip: "assets/dragons/dragon_swamp_flip.png", weakness: "elixir", desc: "Těžkopádný drak z močálu chrlící jedovatý dým. Hojivý lektvar z Lazaretu ti pomůže přežít." },
        { id: "u3_fairy", name: "Pohádkový pestrý drak", icon: "🦋", tierGroup: "young", difficulty: 11, diffOffset: -2, gold: 6000, hearts: 3.0, itemTier: 2, trophyId: "trophy_fairy", img: "assets/dragons/dragon_fairy.png",
        imgFlip: "assets/dragons/dragon_fairy_flip.png", weakness: "dance", desc: "Hravý drak s motýlími křídly vyfukující kouzelný prach. Lze jej okouzlit Tancem a Charismatem!" },
        { id: "u3_water", name: "Vodní jezerní drak", icon: "🌊", tierGroup: "young", difficulty: 12, diffOffset: -1, gold: 7500, hearts: 3.0, itemTier: 2, trophyId: "trophy_water", img: "assets/dragons/dragon_water.png?v=202611021708",
        imgFlip: "assets/dragons/dragon_water_flip.png?v=202611021708", weakness: "spear", desc: "Drak z hlubokých jezer s ploutvemi a vodní tříští. Střeží potopenou truhlu s perlami." },
        { id: "u3_wind", name: "Větrný nebeský drak", icon: "🌪️", tierGroup: "young", difficulty: 12, diffOffset: -1, gold: 7500, hearts: 3.0, itemTier: 2, trophyId: "trophy_wind", img: "assets/dragons/dragon_wind.png?v=202611021708",
        imgFlip: "assets/dragons/dragon_wind_flip.png?v=202611021708", weakness: "horse", desc: "Elegantní drak vznášející se v oblacích. Útok z plné jízdy na koni ti dá převahu!" },

        // --- TIER B: Věkovití živloví draci (Obtížnost 13–14) ---
        { id: "u3_red", name: "Červený ohnivý drak", icon: "🐉", tierGroup: "elemental", difficulty: 13, diffOffset: 0, gold: 8500, hearts: 4.0, itemTier: 3, trophyId: "trophy_red", img: "assets/dragons/dragon_red.png",
        imgFlip: "assets/dragons/dragon_red_flip.png", weakness: "water_armor", desc: "Dravý drak se zlatavými šupinami na skalním útesu s bohatou hromadou zlaťáků." },
        { id: "u3_volcano", name: "Sopečný lávový drak", icon: "🌋", tierGroup: "elemental", difficulty: 13, diffOffset: 0, gold: 9000, hearts: 4.0, itemTier: 3, trophyId: "trophy_volcano", img: "assets/dragons/dragon_volcano.png",
        imgFlip: "assets/dragons/dragon_volcano_flip.png", weakness: "ice", desc: "Mohutný drak chrlící žhavou lávu. Jeho poklad se třpytí v rudém žáru sopečných puklin." },
        { id: "u3_ice", name: "Mrazivý ledový drak", icon: "❄️", tierGroup: "elemental", difficulty: 13, diffOffset: 0, gold: 8500, hearts: 4.0, itemTier: 3, trophyId: "trophy_ice", img: "assets/dragons/dragon_ice.png?v=202611021708",
        imgFlip: "assets/dragons/dragon_ice_flip.png?v=202611021708", weakness: "fire", desc: "Ledový drak s křídly z rampouchů a geod. Zmrazí každého nepřipraveného rytíře." },
        { id: "u3_lightning", name: "Bouřný bleskový drak", icon: "⚡", tierGroup: "elemental", difficulty: 14, diffOffset: 1, gold: 10000, hearts: 4.5, itemTier: 3, trophyId: "trophy_lightning", img: "assets/dragons/dragon_lightning.png",
        imgFlip: "assets/dragons/dragon_lightning_flip.png", weakness: "armor", desc: "Drak sršící elektrickými výboji mezi bouřkovými mraky. Vyžaduje pevnou zbroj a rychlé reflexy." },
        { id: "u3_black", name: "Černý stínový drak", icon: "🌑", tierGroup: "elemental", difficulty: 14, diffOffset: 1, gold: 9500, hearts: 4.5, itemTier: 3, trophyId: "trophy_black", img: "assets/dragons/dragon_black.png?v=202611021708",
        imgFlip: "assets/dragons/dragon_black_flip.png?v=202611021708", weakness: "light", desc: "Hrozivý trnitý drak v uhelně černém hávu. Z tlamy mu stoupá magicky fialový dým." },
        { id: "u3_crystal", name: "Křišťálový drahokamový drak", icon: "💎", tierGroup: "elemental", difficulty: 14, diffOffset: 1, gold: 11000, hearts: 4.5, itemTier: 3, trophyId: "trophy_crystal", img: "assets/dragons/dragon_crystal.png?v=202611021708",
        imgFlip: "assets/dragons/dragon_crystal_flip.png?v=202611021708", weakness: "charisma", desc: "Nádherná bestie z tisíců drahokamů. Vítěz získá obrovské ložisko rubínů a ametystů." },
        { id: "u3_bone", name: "Kostěný nemrtvý drak", icon: "💀", tierGroup: "elemental", difficulty: 14, diffOffset: 1, gold: 9000, hearts: 4.0, itemTier: 3, trophyId: "trophy_bone", img: "assets/dragons/dragon_bone.png",
        imgFlip: "assets/dragons/dragon_bone_flip.png", weakness: "holy", desc: "Prastarý kostlivec oživený fialovo-zeleným plamenem. Střeží zbraně padlých reků." },
        { id: "u3_gold", name: "Zlatý královský drak", icon: "👑", tierGroup: "elemental", difficulty: 14, diffOffset: 1, gold: 12500, hearts: 5.0, itemTier: 3, trophyId: "trophy_gold", img: "assets/dragons/dragon_gold.png?v=202611021708",
        imgFlip: "assets/dragons/dragon_gold_flip.png?v=202611021708", weakness: "charisma", desc: "Majestátní drak ze zářivého zlata. Obývá největší přetékající hromadu mincí v království!" },
        { id: "u3_shadow", name: "Přízračný drak stínů", icon: "👻", tierGroup: "elemental", difficulty: 14, diffOffset: 1, gold: 10000, hearts: 4.5, itemTier: 3, trophyId: "trophy_shadow", img: "assets/dragons/dragon_shadow.png",
        imgFlip: "assets/dragons/dragon_shadow_flip.png", weakness: "courage", desc: "Napůl nehmotný drak tvořený temnou mlhou. Zkouší odvahu a pevnost rytířského srdce." },

        // --- TIER C: Legendární vícehlavé saně a bossové (Obtížnost 15–17) ---
        { id: "u3_2headed", name: "Dvouhlavý strážný drak", icon: "🐉", tierGroup: "boss", difficulty: 15, diffOffset: 2, gold: 11500, hearts: 5.0, itemTier: 3, trophyId: "trophy_2headed", img: "assets/dragons/dragon_2headed.png",
        imgFlip: "assets/dragons/dragon_2headed_flip.png", weakness: "falcon", desc: "Robustní dvouhlavý drak. Zatímco jedna hlava spí, druhá ostražitě střeží poklad." },
        { id: "u3_3headed", name: "Tříhlavá královská saň", icon: "🐲", tierGroup: "boss", difficulty: 16, diffOffset: 3, gold: 13500, hearts: 5.5, itemTier: 3, trophyId: "trophy_3headed", img: "assets/dragons/dragon_3headed.png",
        imgFlip: "assets/dragons/dragon_3headed_flip.png", weakness: "animals", desc: "Legendární tříhlavá saň království! Každá její hlava cení zuby jiným směrem. Zisk +5.5 💖!" },
        { id: "u3_hydra", name: "Prastará lesní hydra", icon: "🐍", tierGroup: "boss", difficulty: 16, diffOffset: 3, gold: 13000, hearts: 5.5, itemTier: 3, trophyId: "trophy_hydra", img: "assets/dragons/dragon_hydra.png",
        imgFlip: "assets/dragons/dragon_hydra_flip.png", weakness: "fire", desc: "Hadovitá hydra s mnoha krky prorostlá pralesním mechem. Kdo ji skolí, stane se hrdinou bájí." },
        { id: "u3_elemental", name: "Čtyřhlavý živelný drak", icon: "🔮", tierGroup: "boss", difficulty: 17, diffOffset: 4, gold: 15000, hearts: 6.0, itemTier: 3, trophyId: "trophy_elemental", img: "assets/dragons/dragon_elemental.png",
        imgFlip: "assets/dragons/dragon_elemental_flip.png", weakness: "mastery", desc: "Unikátní drak ovládající Oheň, Led, Jed i Blesk! Ultimátní zkouška čtyř rytířských ctností (+6.0 💖)!" },
        { id: "u3_shadow_multi", name: "Temný stínový vícehlavý drak", icon: "🖤", tierGroup: "boss", difficulty: 17, diffOffset: 4, gold: 15500, hearts: 6.0, itemTier: 3, trophyId: "trophy_shadow_multi", img: "assets/dragons/dragon_shadow_multi.png",
        imgFlip: "assets/dragons/dragon_shadow_multi_flip.png", weakness: "light", desc: "Přízračná tříhlavá saň vystupující z temnot. Její porážka zažene stín z celého království." },
        { id: "u3_5headed", name: "Pětihlavý drak Zkázy", icon: "👑", tierGroup: "boss", difficulty: 17, diffOffset: 4, gold: 16000, hearts: 6.0, itemTier: 3, trophyId: "trophy_5headed", img: "assets/dragons/dragon_5headed.png",
        imgFlip: "assets/dragons/dragon_5headed_flip.png", weakness: "animals_and_spear", desc: "Nejobávanější nestvůra všech dob s pěti kroutícími se krky! Zisk legendárního pokladu a 6 💖 Princezniných srdcí!" }
    ]
};

// ============================================================================
// KARTY NÁHODY & OSUDU (N) - Celkem 50 vyvážených karet (50% pozitivní, 25% negativní, 25% volby/dilemata)
// ============================================================================
window.PRS_CHANCE_CARDS = [
    // --- 1. POZITIVNÍ KARTY (25 karet / 50 %) ---
    { id: "ch_1", category: "positive", title: "Královská přízeň", icon: "💖", effect: "hearts", value: 1.0, text: "Princezna ocenila tvé galantní vystupování u dvora. Získáváš +1 💖!" },
    { id: "ch_2", category: "positive", title: "Bohatá úroda na panství", icon: "🌾", effect: "estate_bonus", value: 500, text: "Tvé osady vzkvétají! Za každou svou Vesnici, Město a Hrad získáváš +500 zl. (minimálně však +1 000 zl.)." },
    { id: "ch_3", category: "positive", title: "Turnajové sázky", icon: "🎲", effect: "gold_gain", value: 1500, text: "Vsadil sis na vítěze rytířského klání a vyhrál jsi 1 500 zl.!" },
    { id: "ch_4", category: "positive", title: "Nález královského prstenu", icon: "💍", effect: "gold_gain", value: 2000, text: "Našel jsi ztracený královský pečetní prsten a vrátil jej kancléři. Odměna činí +2 000 zl.!" },
    { id: "ch_5", category: "positive", title: "Dar od zbrojíře", icon: "🎁", effect: "free_item_1", value: 1, text: "Starý mistr zbrojíř ti věnoval předmět 1. stupně zdarma!" },
    { id: "ch_6", category: "positive", title: "Lekce u dvorního mistra", icon: "📜", effect: "free_skill", value: 1, text: "Získáváš +1 stupeň v libovolné své nejnižší ctnosti zdarma!" },
    { id: "ch_7", category: "positive", title: "Měšec na rozcestí", icon: "💰", effect: "gold_gain", value: 1800, text: "V mechu na starém rozcestí jsi našel ztracený kupecký měšec s 1 800 zl.!" },
    { id: "ch_8", category: "positive", title: "Milostný sonet pro princeznu", icon: "🎶", effect: "hearts", value: 1.5, text: "Tvůj trubadúr složil dojemnou píseň o tvých činech pod okny princezny. Získáváš +1,5 💖!" },
    { id: "ch_9", category: "positive", title: "Královská milost a dotace", icon: "👑", effect: "gold_gain", value: 2200, text: "Král ocenil tvou věrnost korunce a věnuje ti královskou dotaci +2 200 zl.!" },
    { id: "ch_10", category: "positive", title: "Věrný stopařský ohař", icon: "🐕", effect: "hearts", value: 0.5, text: "Tvůj lovecký pes vystopoval ztraceného panoše v bažinách. Získáváš vděk dvora a +0,5 💖!" },
    { id: "ch_11", category: "positive", title: "Vítězná fanfára z turnaje", icon: "🎺", effect: "hearts", value: 1.0, text: "Pověst o tvé rytířské cti se nese celým krajem. Získáváš +1 💖!" },
    { id: "ch_12", category: "positive", title: "Klenot od královny matky", icon: "💎", effect: "free_item_1", value: 1, text: "Královna matka ti věnovala vzácný dvorský klenot do tvé výbavy!" },
    { id: "ch_13", category: "positive", title: "Požehnání lesního poustevníka", icon: "🧙‍♂️", effect: "free_skill", value: 1, text: "Starý světec ti předal moudrost předků. Získáváš +1 stupeň k ctnosti zdarma!" },
    { id: "ch_14", category: "positive", title: "Královský spěšný kurýr", icon: "🏇", effect: "gold_gain", value: 1400, text: "Doručil jsi tajnou královskou depeši na hrad. Odměna činí +1 400 zl.!" },
    { id: "ch_15", category: "positive", title: "Nález v ruinách hradu", icon: "🗝️", effect: "gold_gain", value: 2500, text: "V rozpadlé hradní věži jsi našel starobylou železnou pokladnici se 2 500 zl.!" },
    { id: "ch_16", category: "positive", title: "Svatební veselí na panství", icon: "🏘️", effect: "village_bonus", value: 600, text: "Ve tvých vesnicích se slaví svatba. Každá tvá vesnice ti přináší svatební dar +600 zl. (min. +1 000 zl.)!" },
    { id: "ch_17", category: "positive", title: "Vroucí láska poddaných", icon: "❤️", effect: "hearts", value: 1.0, text: "Lid v celém království provolává tvou slávu. Princezna ti posílá hedvábný kapesníček (+1 💖)!" },
    { id: "ch_18", category: "positive", title: "Královský glejt cti", icon: "📜", effect: "gold_gain", value: 1200, text: "Obdržel jsi královský glejt stvrzující tvé šlechtické výsady (+1 200 zl.)!" },
    { id: "ch_19", category: "positive", title: "Dědictví po bohatém strýci", icon: "🏰", effect: "gold_gain", value: 3000, text: "Královský notář ti vyplatil šlechtické dědictví ve výši +3 000 zl.!" },
    { id: "ch_20", category: "positive", title: "Zlatý poklad z potopeného člunu", icon: "⛵", effect: "gold_gain", value: 1800, text: "Při brodění řekou jsi z vraku člunu vylovil truhličku mincí (+1 800 zl.)!" },
    { id: "ch_21", category: "positive", title: "Přízeň dvorních dam", icon: "🪞", effect: "hearts", value: 1.0, text: "Dvorní dámy si špitají o tvém šarmu a eleganci. Získáváš +1 💖!" },
    { id: "ch_22", category: "positive", title: "Vynikající chov v hřebčíně", icon: "🐴", effect: "gold_gain", value: 1500, text: "Královský nákupčí ocenil tvůj chov koní a vyplatil ti prémii +1 500 zl.!" },
    { id: "ch_23", category: "positive", title: "Požehnání poutního chrámu", icon: "✨", effect: "free_skill", value: 1, text: "Modlitba u posvátného oltáře ti vyjasnila mysl. Získáváš +1 stupeň ctnosti zdarma!" },
    { id: "ch_24", category: "positive", title: "Rytířské vavříny ze slavnosti", icon: "🌿", effect: "hearts", value: 1.0, text: "Při slavnostním defilé ti lidé házeli květy pod nohy. Získáváš +1 💖!" },
    { id: "ch_25", category: "positive", title: "Vzácná alchymistická tinktura", icon: "🧪", effect: "free_item_1", value: 1, text: "Lékárník z Lazaretu ti věnoval ochranný lektvar do tvé výbavy!" },

    // --- 2. NEGATIVNÍ KARTY (13 karet / 26 %) ---
    { id: "ch_26", category: "negative", title: "Rozvodněná řeka a stržený most", icon: "🌊", effect: "gold_loss", value: 1200, text: "Přívalový déšť rozvodnil řeku a poškodil tvůj povoz s výstrojí. Oprava kovářem tě stojí 1 200 zl." },
    { id: "ch_27", category: "negative", title: "Mimořádná válečná daň", icon: "⚔️", effect: "gold_loss", value: 1500, text: "Král vyhlásil mimořádnou zemskou daň na opevnění hranic. Odvádíš 1 500 zl. do královské pokladnice." },
    { id: "ch_28", category: "negative", title: "Noční krádež v hostinci", icon: "🗡️", effect: "gold_loss", value: 1400, text: "Zatímco jsi spal v zájezdním hostinci, prohnaný zloděj ti prořízl měšec a odcizil 1 400 zl.!" },
    { id: "ch_29", category: "negative", title: "Mor dobytka a koní", icon: "🐂", effect: "gold_loss", value: 1000, text: "Nákaza ve stájích si vyžádala přísnou ranhojičskou karanténu. Náklady činí 1 000 zl." },
    { id: "ch_30", category: "negative", title: "Zkažené zásoby a horečka", icon: "🤢", effect: "gold_loss", value: 800, text: "Zkažené zásoby na cestách tě upoutaly na lůžko. Ošetření ve špitále sv. Lazara tě stojí 800 zl." },
    { id: "ch_31", category: "negative", title: "Poškozená zbroj po pádu", icon: "🔨", effect: "gold_loss", value: 900, text: "Kůň na kluzkém kamení zakopl a pláty tvé zbroje povolily. Platíš 900 zl. platnéři za opravu." },
    { id: "ch_32", category: "negative", title: "Pomluva záštiplného barona", icon: "🍷", effect: "intrigue", value: 1.0, text: "Závistiví rivalové tě zkusili očernit u princeznina stolu. Pokud má tvůj rytíř Charisma alespoň 3, vtipem zvítězíš (+1 💖)! Jinak platíš 1 000 zl. za urovnání pomluv." },
    { id: "ch_33", category: "negative", title: "Kletba lesní ježibaby", icon: "🧙‍♀️", effect: "curse", value: 1200, text: "Zlá jezinka u močálu uvalila na tvou družinu kletbu! Obětuješ 1 200 zl. knězi na posvěcení, jinak by tvůj rytíř ztratil sílu." },
    { id: "ch_34", category: "negative", title: "Útěk koně do hlubokých hvozdů", icon: "🌲", effect: "gold_loss", value: 700, text: "Tvůj kůň se lekl divokého kňoura a uprchl do lesa. Najmutí psovodů na jeho vypátrání tě stojí 700 zl." },
    { id: "ch_35", category: "negative", title: "Přepadení zemskými lapky", icon: "🦹", effect: "robbers", value: 1200, text: "V úzké soutěsce tě přepadla tlupa lapků! Pokud je tvůj Boj alespoň 3, zaženeš je a získáš 1 200 zl. Jinak tě oberou o 1 200 zl." },
    { id: "ch_36", category: "negative", title: "Soudní spor o hranice panství", icon: "⚖️", effect: "gold_loss", value: 1100, text: "Sousední šlechtic napadl tvé pozemky. Královský rychtář vyměřil soudní poplatek 1 100 zl." },
    { id: "ch_37", category: "negative", title: "Prohraná turnajová sázka", icon: "🎯", effect: "gold_loss", value: 1000, text: "Tvůj favorit byl v klání sražen z koně hned v prvním kole. Prohráváš svou sázku 1 000 zl." },
    { id: "ch_38", category: "negative", title: "Léčení zraněného sokola", icon: "🦅", effect: "gold_loss", value: 600, text: "Tvůj lovecký dravčík byl poraněn při lovu. Péče královského sokolníka tě stojí 600 zl." },

    // --- 3. DILEMATA A VOLBY (12 karet / 24 %) ---
    {
        id: "ch_39", category: "dilemma", title: "Zraněný rytíř na rozcestí", icon: "🩺",
        text: "Na rozcestí sténá zraněný poutník v potrhané zbroji. Jak se zachováš?",
        options: [
            { id: "opt_help", title: "Ošetřit raněného", icon: "❤️", costGold: 800, gainHearts: 1.0, desc: "Daruješ mu lektvar a 800 zl. Princezna ocení tvé milosrdenství (+1 💖)!" },
            { id: "opt_loot", title: "Obrat ho o cennosti", icon: "💰", gainGold: 1500, lossHearts: 0.5, desc: "Sebereš mu zbroj a váček (+1 500 zl.), ale u dvora se šíří zvěsti o tvé chamtivosti (-0,5 💖)." }
        ]
    },
    {
        id: "ch_40", category: "dilemma", title: "Tajemný potulný alchymista", icon: "🧪",
        text: "Podivný alchymista v kápi ti nabízí bublající flakón, nebo odkoupí tvé zásoby bylin.",
        options: [
            { id: "opt_drink", title: "Vypít neznámý lektvar", icon: "✨", costGold: 500, effect: "alchemist_gamble", desc: "Zaplatíš 500 zl. (60% šance na trvalé +1 k náhodné ctnosti / 40% nevolnost a útrata v lazaretu)." },
            { id: "opt_sell", title: "Prodat léčivé byliny", icon: "🌿", gainGold: 600, desc: "Odmítneš pochybný nápoj a bezpečně prodáš byliny z lesa (+600 zl.)." }
        ]
    },
    {
        id: "ch_41", category: "dilemma", title: "Sázka v královské herně", icon: "🎲",
        text: "V panském salonu se hraje o vysoké sumy. Přisedneš k hracímu stolu?",
        options: [
            { id: "opt_gamble", title: "Vsadit 1 500 zl. do kostek", icon: "🎲", costGold: 1500, effect: "dice_gamble", desc: "Hodíš kostkou: při 4-6 vyhráváš 3 500 zl. (+2 000 zl. čistého)! Při 1-3 prohráváš vklad." },
            { id: "opt_chess", title: "Šachová partie s dvořanem", icon: "♟️", gainHearts: 0.5, desc: "Místo hazardu předvedeš bystrý rozum v šachu. Získáváš uznání dvořanů (+0,5 💖)." }
        ]
    },
    {
        id: "ch_42", category: "dilemma", title: "Zlatý kompromis u dvora", icon: "⚖️",
        text: "Zahraniční vyslanci ti nabízejí tučný dar za to, že se přimluvíš u princezny za jejich obchod.",
        options: [
            { id: "opt_bribe", title: "Přijmout dar vyslanců", icon: "💰", gainGold: 2500, lossHearts: 1.0, desc: "Inkasuješ bohatých +2 500 zl., ale princezna prohlédne tvůj úskok (-1,0 💖)." },
            { id: "opt_honor", title: "Hrdě odmítnout úplatek", icon: "👑", gainHearts: 1.5, desc: "Ubráníš čest království! Princezna tě za tvou ryzí poctivost odmění (+1,5 💖)!" }
        ]
    },
    {
        id: "ch_43", category: "dilemma", title: "Zbloudilý panský hřebec", icon: "🐎",
        text: "V bučině jsi narazil na nádherného opuštěného koně s panským cejchem sousedního hrabství.",
        options: [
            { id: "opt_keep_horse", title: "Přivlastnit si hřebce", icon: "🏇", costGold: 1000, effect: "gain_riding", desc: "Zaplatíš 1 000 zl. podkoním za ututlání cejchu a získáš +1 k Jízdě na koni!" },
            { id: "opt_return_horse", title: "Vrátit koně majiteli", icon: "🤝", gainGold: 500, gainHearts: 0.5, desc: "Pán ti vyplatí nálezné +500 zl. a tvá pověst poctivce roste (+0,5 💖)." }
        ]
    },
    {
        id: "ch_44", category: "dilemma", title: "Zapečetěná runová truhlice", icon: "📦",
        text: "V hradních sklepeních jsi odkryl těžkou truhlici zapečetěnou prastarou pečetí.",
        options: [
            { id: "opt_force_open", title: "Vypáčit pečeť silou", icon: "🗝️", costGold: 600, effect: "open_chest_loot", desc: "Páčení tě stojí 600 zl., ale uvnitř nalezneš vzácnou zbraň či zbroj do výbavy!" },
            { id: "opt_sell_chest", title: "Prodat truhlu klenotníkovi", icon: "💎", gainGold: 1400, desc: "Nechceš riskovat magickou past a zapečetěnou truhlici prodáš vcelku (+1 400 zl.)." }
        ]
    },
    {
        id: "ch_45", category: "dilemma", title: "Pomoc hladovějícím poddaným", icon: "🍞",
        text: "Tvé osady zasáhlo krupobití a vesničané prosí o úlevu z panských poplatků.",
        options: [
            { id: "opt_feed_poor", title: "Odpustit daně & nakoupit obilí", icon: "🌾", costGold: 1200, gainHearts: 1.0, desc: "Zaplatíš 1 200 zl. ze své pokladnice. Vděk poddaných dojme princeznu (+1,0 💖)!" },
            { id: "opt_strict_tax", title: "Vybrat plný nájem bez milosti", icon: "🪙", gainGold: 1200, desc: "Trváš na smlouvě a vybereš veškeré zlato (+1 200 zl.), lid však skřípe zuby." }
        ]
    },
    {
        id: "ch_46", category: "dilemma", title: "Výzva potulného šermíře", icon: "🤺",
        text: "U mostu tě zastavil vyhlášený potulný šermíř a vyzývá tě k rytířskému měření sil.",
        options: [
            { id: "opt_duel_fencer", title: "Přijmout šermířský souboj", icon: "⚔️", effect: "fencer_duel", desc: "Pokud je tvůj Boj alespoň 3, mistra porazíš (+1 💖 a 600 zl.). Jinak tě ošetření stojí 600 zl." },
            { id: "opt_tavern_fencer", title: "Pozvat ho na korbel piva", icon: "🍺", costGold: 400, effect: "gain_combat", desc: "Zaplatíš 400 zl. za hostinu v krčmě a šermíř tě naučí tajné bojové finty (+1 Boj)!" }
        ]
    },
    {
        id: "ch_47", category: "dilemma", title: "Dražba vzácného klenotu", icon: "💎",
        text: "Na zámeckém nádvoří probíhá dražba zabaveného klenotu bývalého královského pokladníka.",
        options: [
            { id: "opt_buy_gem", title: "Vydražit klenot za 1 800 zl.", icon: "💍", costGold: 1800, effect: "free_item_1", desc: "Zaplatíš 1 800 zl. a získáš vzácný dvorský šperk do své rytířské výbavy!" },
            { id: "opt_skip_gem", title: "Ponechat si zlato v měšci", icon: "💰", desc: "Neutratíš nic a ušetříš peníze na nákup hradů či drahé výstroje." }
        ]
    },
    {
        id: "ch_48", category: "dilemma", title: "Zbloudilý lesní poutník", icon: "🚶",
        text: "V hlubokém hvozdu potkáš mladého zbloudilého poutníka, který hledá své poslání.",
        options: [
            { id: "opt_hire_squire", title: "Vzít ho za svého panoše", icon: "🛡️", costGold: 600, effect: "free_skill", desc: "Vybavíš ho za 600 zl. a jeho věrná služba ti trvale zvedne tvou nejnižší ctnost (+1)!" },
            { id: "opt_guide_city", title: "Poslat ho k rychtáři do města", icon: "📜", gainGold: 300, desc: "Za bezpečné nasměrování poutníka ti městský rychtář vyplatí +300 zl." }
        ]
    },
    {
        id: "ch_49", category: "dilemma", title: "Investice do kupecké karavany", icon: "🐪",
        text: "Zámořský kupec hledá rytíře, který by zafinancoval nákup drahého hedvábí na trhu.",
        options: [
            { id: "opt_invest_trade", title: "Investovat 1 000 zl. do zboží", icon: "📈", costGold: 1000, effect: "trade_caravan", desc: "Vložíš 1 000 zl. a kupec ti obratem vyplatí zisk 2 200 zl. (+1 200 zl. čistého zisku)!" },
            { id: "opt_safe_trade", title: "Odmítnout kupecký risk", icon: "🛡️", desc: "Nenecháš se zlákat obchodem a své peníze si pevně ponecháš." }
        ]
    },
    {
        id: "ch_50", category: "dilemma", title: "Záhadná vědma u svatyně", icon: "🔮",
        text: "Stará vědma u kapličky nabízí věštbu budoucnosti a kouzelný amulet štěstí.",
        options: [
            { id: "opt_witch_fortune", title: "Zaplatit 500 zl. za věštbu", icon: "✨", costGold: 500, gainHearts: 1.0, desc: "Vědma ti požehná a předpoví tvůj triumf u princezny (+1,0 💖)!" },
            { id: "opt_witch_refuse", title: "Spoléhat na vlastní meč a rozum", icon: "⚔️", gainHearts: 0.5, desc: "Odmítneš pověry. Princezna oceňuje tvou chladnou hlavu a střídmost (+0,5 💖)." }
        ]
    },

    // --- 4. EXPANDOVANÉ KARTY PRO NOVÁ KRÁLOVSTVÍ, ŘEKU A HRADY (ch_51 až ch_57) ---
    { id: "ch_51", category: "positive", title: "Zlatá rybka z řeky Doubravky", icon: "🐟", effect: "hearts", value: 1.0, text: "Při odpočinku u meandrů Doubravky vytáhl tvůj panoš třpytivou rybku. Za její propuštění zpět do vln získáváš přízeň princezny (+1 💖)!" },
    { id: "ch_52", category: "positive", title: "Přízeň hradního pána", icon: "🏰", effect: "gold_gain", value: 2000, text: "Vládce sousední pevnosti ocenil tvou udatnost a posílá ti čestný dar +2 000 zl. na rozvoj družiny!" },
    { id: "ch_53", category: "positive", title: "Tajemství starého mostu", icon: "🌉", effect: "free_item_1", value: 1, text: "V dutině kamenného pilíře mostu jsi nalezl starou zbrojířskou relikvii (Předmět 1. stupně zdarma do tvé výbavy)!" },
    { id: "ch_54", category: "negative", title: "Mýtné na mostě Doubravka", icon: "🪙", effect: "gold_loss", value: 800, text: "Rychtář vybírá mimořádné mýto na zpevnění říčních pilířů po jarních záplavách. Platíš 800 zl." },
    { id: "ch_55", category: "negative", title: "Horská vichřice z Dračích skal", icon: "🏔️", effect: "gold_loss", value: 1000, text: "Ledový poryv větru z horských štítů potrhal tvé slavnostní korouhve. Obnova tě stojí 1 000 zl." },
    {
        id: "ch_56", category: "dilemma", title: "Převozník u soutoku Doubravky", icon: "⛵",
        text: "Řeka je rozvodněná a starý převozník nabízí bezpečný převoz tvého povozu. Jak se rozhodneš?",
        options: [
            { id: "opt_ferry", title: "Zaplatit bezpečný převoz", icon: "🛡️", costGold: 600, gainHearts: 0.5, desc: "Zaplatíš převozníkovi 600 zl. Princezna ocení tvou rozvahu a péči o družinu (+0,5 💖)." },
            { id: "opt_ford", title: "Riskantně přebrodit dravý proud", icon: "🌊", gainGold: 1400, lossHearts: 0.5, desc: "Ušetříš za mýto a získáš nalezené sudy (+1 400 zl.), avšak riskuješ pověst rytíře (-0,5 💖)." }
        ]
    },
    {
        id: "ch_57", category: "dilemma", title: "Potulný alchymista z Křišťálového zámku", icon: "🧪",
        text: "Před branami hradu tě oslovil tajemný učenec a nabízí flakón s elixírem vznešenosti.",
        options: [
            { id: "opt_potion", title: "Zakoupit elixír charismatu", icon: "✨", costGold: 1000, gainHearts: 0.5, desc: "Zaplatíš 1 000 zl. Získáváš lekci dvorní etikety a přízeň dvora (+0,5 💖)!" },
            { id: "opt_alms", title: "Podarovat chudé v podhradí", icon: "🤲", costGold: 400, gainHearts: 1.0, desc: "Místo lektvaru rozdáš 400 zl. poddaným. Lid tě velebí a princezna ti posílá vzkaz (+1,0 💖)!" }
        ]
    },
    // --- KARTY PRO TANEC & SPOLEČENSKÝ ŽIVOT (4 karty) ---
    { id: "ch_ball_1", category: "positive", title: "Dvorský bál v Růžovém sále", icon: "👗", effect: "ball", value: 1.0, text: "Královna uspořádala tajný dvorský bál! Kdo má společenské šaty nebo Tanec ≥ 2, získá +1 💖! Bez šatů a tance zaplatí 400 zl. komorníkovi za nevhodný oděv." },
    { id: "ch_ball_2", category: "positive", title: "Zámecká slavnost světel", icon: "✨", effect: "ball", value: 1.5, text: "Oslňující slavnost pod hvězdnou oblohou. Rytíři odění v róbě či zdatní tanečníci (Tanec ≥ 2) získávají +1.5 💖 za obdiv dvora (jinak pokuta 400 zl.)." },
    { id: "ch_ball_3", category: "positive", title: "Plesový menuet s princeznou", icon: "💃", effect: "ball", value: 1.0, text: "Princezna tě vyzvala k čestnému tanci! Máš-li šaty nebo Tanec ≥ 2, okouzlíš sál (+1 💖). Jinak šlápneš do vlečky a zaplatíš 400 zl. omluvného." },
    { id: "ch_ball_4", category: "positive", title: "Maškarní bál vévody", icon: "🎭", effect: "ball", value: 1.0, text: "Tajemný maškarní ples aristokracie! Se šaty či Tancem ≥ 2 sklízíš ovace a +1 💖. V těžké zbroji bez tance zaplatíš 400 zl. za nevhodné vystupování." },

    // --- KARTY PRO JEZDECTVÍ & RYCHLOST (3 karty) ---
    { id: "ch_ride_1", category: "positive", title: "Královská jezdecká přehlídka", icon: "🐎", effect: "riding", value: 1.0, text: "Vladař vyhlásil čestnou jezdeckou přehlídku! Rytíř s koněm ve stáji nebo Jízdou ≥ 2 předvede bravurní drezuru (+1 💖). Pěší jezdec bez cviku ztrácí 300 zl." },
    { id: "ch_ride_2", category: "positive", title: "Bleskový posel z hranic", icon: "🏇", effect: "riding", value: 1.5, text: "Je třeba bleskově doručit královskou zprávu! V sedle koně nebo s Jízdou ≥ 2 dorazíš včas (+1.5 💖 a 500 zl.). Bez koně tě předběhne konkurent a ztratíš 300 zl." },
    { id: "ch_ride_3", category: "positive", title: "Štvanice na divočáka", icon: "🐗", effect: "riding", value: 1.0, text: "Trubači troubí k honu! S koněm či Jízdou ≥ 2 vedeš štvanici a získáváš trofejní poctu (+1 💖). Jinak se zdržíš v hloží a zaplatíš 300 zl. hajnému." },

    // --- 5. TAKTICKÉ PERGAMENY DO INVENTÁŘE RYTÍŘE (Lze uložit do brašny a zahrát z ruky) ---
    {
        id: "scroll_speed",
        category: "scroll",
        title: "Pergamen bleskového cvalu",
        icon: "📜⚡",
        isScroll: true,
        storable: true,
        scrollType: "speed_boost",
        text: "Starodávný svitek větru. Ulož do brašny rytíře a zahraj před hodem kostkou: přidá +3 k hodu!"
    },
    {
        id: "scroll_amnesty",
        category: "scroll",
        title: "Královský glejt amnestie",
        icon: "📜👑",
        isScroll: true,
        storable: true,
        scrollType: "rent_amnesty",
        text: "Pečeť purkrabího. Ulož do brašny: odpustí placení nájmu na cizím panství nebo kauci v šatlavě."
    },
    {
        id: "scroll_strength",
        category: "scroll",
        title: "Alchymistický lektvar síly",
        icon: "📜🧪",
        isScroll: true,
        storable: true,
        scrollType: "combat_boost",
        text: "Elixír dračí síly. Ulož do brašny a zahraj před bojem, turnajem či lovem: přidá +2 k Boji!"
    },
    {
        id: "scroll_fleece",
        category: "scroll",
        title: "Svitek zlatého rouna",
        icon: "📜🐑",
        isScroll: true,
        storable: true,
        scrollType: "breeding_double",
        text: "Zemědělský svitek. Ulož do brašny: zdvojnásobí zisk z chovu stád (+100% srdcí) a daruje +1 000 zl."
    },
    {
        id: "scroll_fortune",
        category: "scroll",
        title: "Hvězdná konjunkce štěstěny",
        icon: "📜⭐",
        isScroll: true,
        storable: true,
        scrollType: "fortune_favor",
        text: "Astrologický svitek. Ulož do brašny: zaručí hod 6 na kostce a ochrání před lapky na celou 1 cestu."
    }
];

// ============================================================================
// 5. KATALOG HRÁČSKÝCH, BOTOVSKÝCH A PRÉMIOVÝCH FIGUREK (PRS_PAWNS_CATALOG)
// ============================================================================
window.PRS_PAWNS_CATALOG = [
    // --- A) ZÁKLADNÍ SADA PRO HRÁČE (Zdarma - 6 archetypů) ---
    {
        id: "knight_valiant",
        name: "Sir Roland",
        title: "Rytíř Královské Koruny",
        category: "basic",
        priceCredits: 0,
        icon: "🛡️",
        img: "assets/pawns/pawn_knight_valiant.png",
        auraType: null,
        accentColor: "#3b82f6",
        desc: "Ušlechtilý královský paladin v zářivé zlatostříbrné zbroji se lvím erbem na rameni.",
        nameEn: "Sir Roland",
        titleEn: "Knight of the Royal Crown",
        descEn: "Noble royal paladin in radiant gold-and-silver armor bearing the lion crest upon his shoulder."
    },
    {
        id: "knight_tourney",
        name: "Baron z Růže",
        title: "Turnajový Šampion",
        category: "basic",
        priceCredits: 0,
        icon: "🌹",
        img: "assets/pawns/pawn_knight_tourney.png",
        auraType: null,
        accentColor: "#ef4444",
        desc: "Neporažený mistr klání na dřevce s chocholem z rudých růží a zdobenou přilbicí.",
        nameEn: "Baron of the Rose",
        titleEn: "Tournament Champion",
        descEn: "Undefeated master of jousting with a plume of red roses and an ornate tournament helm."
    },
    {
        id: "lady_huntress",
        name: "Lady Sylva",
        title: "Královská Lovkyně",
        category: "basic",
        priceCredits: 0,
        icon: "🦅",
        img: "assets/pawns/pawn_lady_huntress.png",
        auraType: null,
        accentColor: "#10b981",
        desc: "Vznešená paní hvozdů v zeleném sametu s loveckým sokolem na rameni a lukem.",
        nameEn: "Lady Sylva",
        titleEn: "Royal Huntress",
        descEn: "Noble mistress of the deep woods in green velvet with a hunting falcon upon her shoulder and bow."
    },
    {
        id: "lord_diplomat",
        name: "Vévoda Armand",
        title: "Mistr Královské Dvorany",
        category: "basic",
        priceCredits: 0,
        icon: "👑",
        img: "assets/pawns/pawn_lord_diplomat.png",
        auraType: null,
        accentColor: "#a855f7",
        desc: "Charismatický dvořan a diplomat v purpurovém plášti se zlatým řetězem a kordem.",
        nameEn: "Duke Armand",
        titleEn: "Master of the Royal Court",
        descEn: "Charismatic courtier and diplomat in a purple cloak with golden chain and ceremonial rapier."
    },
    {
        id: "knight_warden",
        name: "Strážce Hvozdů",
        title: "Smaragdový Rytíř",
        category: "basic",
        priceCredits: 0,
        icon: "🦌",
        img: "assets/pawns/pawn_knight_warden.png",
        auraType: null,
        accentColor: "#22c55e",
        desc: "Prastarý ochránce královských lesů s korunou z jeleního paroží a dubovým pláštěm.",
        nameEn: "Warden of the Wilds",
        titleEn: "Emerald Knight",
        descEn: "Vigilant guardian of frontier forests clad in hardened moss-green scale armor."
    },
    {
        id: "lady_sorceress",
        name: "Čarodějka Astrida",
        title: "Hvězdná Dáma",
        category: "basic",
        priceCredits: 0,
        icon: "🔮",
        img: "assets/pawns/pawn_lady_sorceress.png",
        auraType: null,
        accentColor: "#6366f1",
        desc: "Tajemná šlechtična a hvězdopravkyně s diadémem souhvězdí a zářícím křišťálem.",
        nameEn: "Astrida the Sorceress",
        titleEn: "Star Lady",
        descEn: "Mystic astronomer reading celestial signs, weaving starlight into defensive charms."
    },

    // --- B) FIGURKY PRO PC BOTY (Automatické pro AI soupeře - 5 archetypů) ---
    {
        id: "bot_aggressive",
        name: "Černý Baron",
        title: "PC Válečník (Lovec draků)",
        category: "bot",
        botType: "Bot_Aggressive",
        priceCredits: 0,
        icon: "⚔️",
        img: "assets/pawns/pawn_bot_aggressive.png",
        auraType: null,
        accentColor: "#dc2626",
        desc: "Obávaný železný baron v rohaté černé přilbici s rudě žhnoucím hledím.",
        nameEn: "Black Baron",
        titleEn: "AI Warrior (Dragon Slayer)",
        descEn: "Ferocious armored warlord hunting beasts and dragons with ruthless precision."
    },
    {
        id: "bot_breeder",
        name: "Zikmund z Chovu",
        title: "PC Chovatel (Pán hřebčínů)",
        category: "bot",
        botType: "Bot_Breeder",
        priceCredits: 0,
        icon: "📯",
        img: "assets/pawns/pawn_bot_breeder.png",
        auraType: null,
        accentColor: "#d97706",
        desc: "Bohatý správce královských obor v kožešinovém plášti se zlatým loveckým rohem.",
        nameEn: "Sigismund the Breeder",
        titleEn: "AI Breeder (Lord of Stables)",
        descEn: "Master equestrian amassing noble studs, falcons, and hound kennels for passive rent dominance."
    },
    {
        id: "bot_noble",
        name: "Kněžna Eliška",
        title: "PC Dvořan (Diplomacie & Ples)",
        category: "bot",
        botType: "Bot_Noble",
        priceCredits: 0,
        icon: "🪭",
        img: "assets/pawns/pawn_bot_noble.png",
        auraType: null,
        accentColor: "#ec4899",
        desc: "Hrdá vévodkyně s vysokou zlatou korunou, perlami a krajkovým dvorním vějířem.",
        nameEn: "Princess Eliška",
        titleEn: "AI Courtier (Diplomacy & Ball)",
        descEn: "Court lady focusing on grand balls, audiences, and social graces to gather Princess's Hearts."
    },
    {
        id: "bot_balanced",
        name: "Železný Strážce",
        title: "PC Rytíř (Královský automat)",
        category: "bot",
        botType: "Bot_Balanced",
        priceCredits: 0,
        icon: "⚙️",
        img: "assets/pawns/pawn_bot_balanced.png",
        auraType: null,
        accentColor: "#94a3b8",
        desc: "Mechanický rytířský golem z tepané mosazi a oceli poháněný královskými runami.",
        nameEn: "Iron Sentinel",
        titleEn: "AI Knight (Royal Automaton)",
        descEn: "Balanced tactical knight building steady estate holdings and adapting to dice outcomes."
    },
    {
        id: "bot_easy",
        name: "Panoš Vítek",
        title: "PC Panoš (Opatrný nováček)",
        category: "bot",
        botType: "Bot_Easy",
        priceCredits: 0,
        icon: "🛡️",
        img: "assets/pawns/pawn_bot_easy.png",
        auraType: null,
        accentColor: "#84cc16",
        desc: "Mladý usměvavý panoš v prošívanici s dřevěným štítem a železným kloboukem nakřivo.",
        nameEn: "Squire Vítek",
        titleEn: "AI Squire (Cautious Novice)",
        descEn: "Cautious beginner knight focusing on simple village trades and safe movement."
    },

    // --- C) PRÉMIOVÉ A LEGENDÁRNÍ FIGURKY ZA KREDITY 💎 (6 exkluzivních figurek s aurou) ---
    {
        id: "prem_dragon_lord",
        name: "Dračí Vojevůdce",
        title: "Legendární Pán Plamenů",
        category: "premium",
        priceCredits: 500,
        icon: "🐉",
        img: "assets/pawns/pawn_prem_dragon_lord.png",
        auraType: "fire",
        accentColor: "#f97316",
        desc: "Epický vojevůdce v dračí šupinové zbroji s ohnivými křídly a planoucí aurou na herním plánu.",
        nameEn: "Dragon Warlord",
        titleEn: "Legendary Flame Master",
        descEn: "Ancient warlord bonded with primordial fire, radiating molten ember aura."
    },
    {
        id: "prem_ice_queen",
        name: "Ledová Královna",
        title: "Panovnice Severních Štítů",
        category: "premium",
        priceCredits: 500,
        icon: "❄️",
        img: "assets/pawns/pawn_prem_ice_queen.png",
        auraType: "ice",
        accentColor: "#38bdf8",
        desc: "Majestátní královna s korunou z ledových krystalů, obklopená mrazivou krystalovou září.",
        nameEn: "Frost Queen",
        titleEn: "Sovereign of the Northern Peaks",
        descEn: "Majestic monarch of eternal ice adorned in glacier crystal crown and glacial aura."
    },
    {
        id: "prem_shadow_assassin",
        name: "Rytíř Stínů",
        title: "Přízračný Mistr Noci",
        category: "premium",
        priceCredits: 600,
        icon: "🌑",
        img: "assets/pawns/pawn_prem_shadow_assassin.png",
        auraType: "shadow",
        accentColor: "#c084fc",
        desc: "Tajemný bojovník zahalený v temné kápi s fialovou přízračnou mlhou a runovými dýkami.",
        nameEn: "Shadow Knight",
        titleEn: "Phantom Master of Night",
        descEn: "Silent prowler enveloped in swirling obsidian mist and phantom daggers."
    },
    {
        id: "prem_golden_king",
        name: "Zlatý Král Slunce",
        title: "Svrchovaný Panovník",
        category: "premium",
        priceCredits: 750,
        icon: "☀️",
        img: "assets/pawns/pawn_prem_golden_king.png",
        auraType: "sun",
        accentColor: "#fbbf24",
        desc: "Oslnivý panovník v celozlaté zbroji se svatozáří slunečních paprsků a zlatým třpytem.",
        nameEn: "Golden Sun King",
        titleEn: "Sovereign Monarch",
        descEn: "Radiant ruler in pure polished solar gold, surrounded by blinding divine corona."
    },
    {
        id: "prem_unicorn_rider",
        name: "Jezdec na Jednorožci",
        title: "Nebeský Šampion",
        category: "premium",
        priceCredits: 800,
        icon: "🦄",
        img: "assets/pawns/pawn_prem_unicorn_rider.png",
        auraType: "star",
        accentColor: "#f472b6",
        desc: "Stříbrný paladin doprovázený bájným jednorožcem s duhovou hvězdnou aurou.",
        nameEn: "Unicorn Cavalier",
        titleEn: "Celestial Champion",
        descEn: "Pure-hearted champion atop a blessed unicorn radiating prismatic starlight."
    },
    {
        id: "prem_phoenix_paladin",
        name: "Paladin Fénixe",
        title: "Nesmrtelný Strážce Srdce",
        category: "premium",
        priceCredits: 1000,
        icon: "🔥",
        img: "assets/pawns/pawn_prem_phoenix_paladin.png",
        auraType: "phoenix",
        accentColor: "#facc15",
        desc: "Nejvyšší prémiová figurka se zlatými křídly ohnivého fénixe a královskou jiskřící korónou.",
        nameEn: "Phoenix Paladin",
        titleEn: "Immortal Heart Guardian",
        descEn: "Holy crusader imbued with rebirth flames, sporting glorious incandescent wings."
    }
];

window.PRS_PAWNS_BY_ID = {};
for (var _pi = 0; _pi < window.PRS_PAWNS_CATALOG.length; _pi++) {
    var _pItem = window.PRS_PAWNS_CATALOG[_pi];
    window.PRS_PAWNS_BY_ID[_pItem.id] = _pItem;
}

window.PRS_getPawnById = function (pawnId) {
    if (pawnId && window.PRS_PAWNS_BY_ID[pawnId]) {
        return window.PRS_PAWNS_BY_ID[pawnId];
    }
    return window.PRS_PAWNS_BY_ID["knight_valiant"] || window.PRS_PAWNS_CATALOG[0];
};

window.PRS_getDefaultPawnIdForPlayer = function (pDef, index) {
    if (pDef && pDef.pawnId && window.PRS_PAWNS_BY_ID[pDef.pawnId]) {
        return pDef.pawnId;
    }
    var pType = (pDef && pDef.type) ? pDef.type : "Human";
    if (pType !== "Human") {
        var botMap = {
            "Bot_Aggressive": "bot_aggressive",
            "Bot_Breeder": "bot_breeder",
            "Bot_Noble": "bot_noble",
            "Bot_Balanced": "bot_balanced",
            "Bot_Easy": "bot_easy"
        };
        return botMap[pType] || "bot_balanced";
    }
    var basicIds = ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"];
    return basicIds[(index || 0) % basicIds.length];
};

// ============================================================================
// HERALDIKA: Šlechtické rody, erby a rodové tinktury (pro profil, stůl a chat)
// ============================================================================

window.PRS_HERALDRY_CATALOG = [
    { id: "lion", name: "Zlatý lev", icon: "🦁", motto: "Odvaha & Vznešenost", title: "Lev královského rodu" },
    { id: "griffin", name: "Královský gryf", icon: "🦅", motto: "Rychlost & Bdělost", title: "Gryf skalních výšin" },
    { id: "wolf", name: "Stříbrný vlk", icon: "🐺", motto: "Vytrvalost & Síla rodu", title: "Vlk severních hvozdů" },
    { id: "dragon", name: "Rudý drak", icon: "🐉", motto: "Plamen & Válečná moc", title: "Drak dračího pohoří" },
    { id: "stag", name: "Bílý jelen", icon: "🦌", motto: "Moudrost & Čest", title: "Jelen posvátného háje" },
    { id: "phoenix", name: "Ohnivý fénix", icon: "🔥", motto: "Znovuzrození & Magie", title: "Fénix věčného plamene" },
    { id: "crown", name: "Královská koruna", icon: "👑", motto: "Vladařská autorita", title: "Koruna koruny království" },
    { id: "helm", name: "Rytířský helmíř", icon: "🛡️", motto: "Věrnost přísaze & Obrana", title: "Štít neohrožených" },
    { id: "swords", name: "Zkřížené meče", icon: "⚔️", motto: "Mistr duelů & turnajů", title: "Čepel turnajového vítěze" },
    { id: "falcon", name: "Sokolí peruť", icon: "🪶", motto: "Bystrý zrak & Lov", title: "Křídlo větrného pána" },
    { id: "tower", name: "Kamenná bašta", icon: "🏰", motto: "Nezlomnost & Pevnost", title: "Tvrz nezdolného kamene" },
    { id: "oak", name: "Posvátný dub", icon: "🌳", motto: "Život & Starobylé kořeny", title: "Dub starých věků" }
];

window.PRS_HERALDRY_TINCTURES = [
    { key: "gold", name: "Královské zlato", bg: "linear-gradient(135deg, #f59e0b, #b45309)", border: "#fef08a", text: "#fef08a" },
    { key: "ruby", name: "Rubínová červeň", bg: "linear-gradient(135deg, #dc2626, #7f1d1d)", border: "#fca5a5", text: "#fca5a5" },
    { key: "emerald", name: "Smaragdová zeleň", bg: "linear-gradient(135deg, #059669, #064e3b)", border: "#a7f3d0", text: "#a7f3d0" },
    { key: "sapphire", name: "Safírová modř", bg: "linear-gradient(135deg, #2563eb, #1e3a8a)", border: "#93c5fd", text: "#93c5fd" },
    { key: "amethyst", name: "Ametystová purpura", bg: "linear-gradient(135deg, #9333ea, #581c87)", border: "#d8b4fe", text: "#d8b4fe" },
    { key: "ebony", name: "Ebenová čerň", bg: "linear-gradient(135deg, #374151, #111827)", border: "#e5e7eb", text: "#e5e7eb" }
];

window.PRS_HERALDRY_BY_ID = {};
for (var _hi = 0; _hi < window.PRS_HERALDRY_CATALOG.length; _hi++) {
    var _hItem = window.PRS_HERALDRY_CATALOG[_hi];
    window.PRS_HERALDRY_BY_ID[_hItem.id] = _hItem;
}

window.PRS_getCrestById = function (crestId) {
    if (crestId && window.PRS_HERALDRY_BY_ID[crestId]) {
        return window.PRS_HERALDRY_BY_ID[crestId];
    }
    return window.PRS_HERALDRY_CATALOG[0];
};

window.PRS_getTinctureByKey = function (tKey) {
    if (tKey) {
        for (var _ti = 0; _ti < window.PRS_HERALDRY_TINCTURES.length; _ti++) {
            if (window.PRS_HERALDRY_TINCTURES[_ti].key === tKey) return window.PRS_HERALDRY_TINCTURES[_ti];
        }
    }
    return window.PRS_HERALDRY_TINCTURES[0];
};

// Vykreslení gotického heraldického štítu s erbem
window.PRS_renderCrestBadgeHTML = function (crestId, tinctureKey, size) {
    size = size || 32;
    var crest = window.PRS_getCrestById(crestId);
    var tinc = window.PRS_getTinctureByKey(tinctureKey);
    var fontSize = Math.round(size * 0.54);
    var h = Math.round(size * 1.18);
    var bRadius = Math.round(size * 0.52);
    return '<span class="prs-crest-badge" style="display:inline-flex; align-items:center; justify-content:center; width:' + size + 'px; height:' + h + 'px; background:' + tinc.bg + '; border:1.6px solid ' + tinc.border + '; border-radius:3px 3px ' + bRadius + 'px ' + bRadius + 'px; box-shadow:0 3px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.35); font-size:' + fontSize + 'px; line-height:1; flex-shrink:0;" title="' + crest.name + ' (' + crest.motto + ')">' + crest.icon + '</span>';
};

// ============================================================================
// BILINGVÁLNÍ DYNAMICKÉ PŘEKLADY KATALOGŮ (i18n Getters pro KiDesky)
// ============================================================================
function makeTranslatableItem(item) {
    if (!item || !item.id) return item;
    var rawName = item.name;
    var rawDesc = item.desc || "";
    var id = item.id;
    var isTrophy = item.slot === "trophy" || (typeof id === "string" && id.indexOf("trophy_") === 0);

    Object.defineProperty(item, 'name', {
        get: function () {
            if (window.PRS_I18n) {
                if (isTrophy) {
                    var trVal = window.PRS_I18n.t('trophies.' + id + '.name');
                    if (trVal && trVal !== ('trophies.' + id + '.name')) return trVal;
                }
                var itVal = window.PRS_I18n.t('items.' + id + '.name');
                if (itVal && itVal !== ('items.' + id + '.name')) return itVal;
            }
            return rawName;
        },
        set: function (v) { rawName = v; },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(item, 'desc', {
        get: function () {
            if (window.PRS_I18n) {
                if (isTrophy) {
                    var trDesc = window.PRS_I18n.t('trophies.' + id + '.desc');
                    if (trDesc && trDesc !== ('trophies.' + id + '.desc')) return trDesc;
                }
                var itDesc = window.PRS_I18n.t('items.' + id + '.desc');
                if (itDesc && itDesc !== ('items.' + id + '.desc')) return itDesc;
            }
            return rawDesc;
        },
        set: function (v) { rawDesc = v; },
        configurable: true,
        enumerable: true
    });

    return item;
}

function makeTranslatableQuest(quest) {
    if (!quest || !quest.id) return quest;
    var rawName = quest.name;
    var rawDesc = quest.desc || "";
    var id = quest.id;

    Object.defineProperty(quest, 'name', {
        get: function () {
            if (window.PRS_I18n) {
                var val = window.PRS_I18n.t('quests.' + id + '.name');
                if (val && val !== ('quests.' + id + '.name')) return val;
            }
            return rawName;
        },
        set: function (v) { rawName = v; },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(quest, 'desc', {
        get: function () {
            if (window.PRS_I18n) {
                var val = window.PRS_I18n.t('quests.' + id + '.desc');
                if (val && val !== ('quests.' + id + '.desc')) return val;
            }
            return rawDesc;
        },
        set: function (v) { rawDesc = v; },
        configurable: true,
        enumerable: true
    });

    return quest;
}

function makeTranslatableCard(card) {
    if (!card || !card.id) return card;
    var rawTitle = card.title;
    var rawText = card.text || "";
    var id = card.id;

    Object.defineProperty(card, 'title', {
        get: function () {
            if (window.PRS_I18n) {
                var val = window.PRS_I18n.t('cards.' + id + '.title');
                if (val && val !== ('cards.' + id + '.title')) return val;
            }
            return rawTitle;
        },
        set: function (v) { rawTitle = v; },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(card, 'text', {
        get: function () {
            if (window.PRS_I18n) {
                var val = window.PRS_I18n.t('cards.' + id + '.text');
                if (val && val !== ('cards.' + id + '.text')) return val;
            }
            return rawText;
        },
        set: function (v) { rawText = v; },
        configurable: true,
        enumerable: true
    });

    if (card.options && card.options.length) {
        card.options.forEach(function (opt, idx) {
            var rawOptTitle = opt.title;
            var rawOptDesc = opt.desc || "";

            Object.defineProperty(opt, 'title', {
                get: function () {
                    if (window.PRS_I18n) {
                        var val = window.PRS_I18n.t('cards.' + id + '.options.' + idx + '.title');
                        if (val && val !== ('cards.' + id + '.options.' + idx + '.title')) return val;
                    }
                    return rawOptTitle;
                },
                set: function (v) { rawOptTitle = v; },
                configurable: true,
                enumerable: true
            });

            Object.defineProperty(opt, 'desc', {
                get: function () {
                    if (window.PRS_I18n) {
                        var val = window.PRS_I18n.t('cards.' + id + '.options.' + idx + '.desc');
                        if (val && val !== ('cards.' + id + '.options.' + idx + '.desc')) return val;
                    }
                    return rawOptDesc;
                },
                set: function (v) { rawOptDesc = v; },
                configurable: true,
                enumerable: true
            });
        });
    }

    return card;
}

function makeTranslatableCastle(c, k) {
    if (!c) return c;
    var rawName = c.name;
    var rawDesc = c.desc || "";
    var key = k || c.id;

    Object.defineProperty(c, 'name', {
        get: function () {
            if (window.PRS_I18n) {
                var val = window.PRS_I18n.t('castles.' + key + '.name');
                if (val && val !== ('castles.' + key + '.name')) return val;
            }
            return rawName;
        },
        set: function (v) { rawName = v; },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(c, 'desc', {
        get: function () {
            if (window.PRS_I18n) {
                var val = window.PRS_I18n.t('castles.' + key + '.desc');
                if (val && val !== ('castles.' + key + '.desc')) return val;
            }
            return rawDesc;
        },
        set: function (v) { rawDesc = v; },
        configurable: true,
        enumerable: true
    });

    return c;
}

window.PRS_makeTranslatableItem = makeTranslatableItem;
window.PRS_makeTranslatableQuest = makeTranslatableQuest;
window.PRS_makeTranslatableCard = makeTranslatableCard;
window.PRS_makeTranslatableCastle = makeTranslatableCastle;

// Inicializace translatable obálek pro existující katalogy
(function setupI18nCatalogs() {
    if (window.PRS_ITEMS && window.PRS_ITEMS.length) {
        window.PRS_ITEMS.forEach(makeTranslatableItem);
    }
    if (window.PRS_TROPHIES) {
        for (var k in window.PRS_TROPHIES) {
            if (window.PRS_TROPHIES.hasOwnProperty(k)) {
                makeTranslatableItem(window.PRS_TROPHIES[k]);
            }
        }
    }
    if (window.PRS_QUESTS) {
        ['U1', 'U2', 'U3'].forEach(function (tier) {
            if (window.PRS_QUESTS[tier]) {
                window.PRS_QUESTS[tier].forEach(makeTranslatableQuest);
            }
        });
    }
    if (window.PRS_CHANCE_CARDS && window.PRS_CHANCE_CARDS.length) {
        window.PRS_CHANCE_CARDS.forEach(makeTranslatableCard);
    }
    if (window.PRS_CASTLES) {
        for (var ck in window.PRS_CASTLES) {
            if (window.PRS_CASTLES.hasOwnProperty(ck)) {
                makeTranslatableCastle(window.PRS_CASTLES[ck], ck);
            }
        }
    }
})();

