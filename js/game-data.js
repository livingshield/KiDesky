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
        sokol: 400, // S_n = 400 * n
        pes: 500,   // P_n = 500 * n
        kun: 600    // K_n = 600 * n
    },
    animalRentRatios: {
        single: 0.20,
        pair: 0.40,
        fullSet: 0.80
    },
    animalBreedingHearts: [3, 2, 1],
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
        u2GoldReward: 3500,
        u2HeartReward: 1.0,
        u3GoldReward: 8000,
        u3HeartReward: 3.0
    },
    festivalGoldPrizes: {
        turnaj: [1500, 800, 400],
        ples: [1000, 500, 250],
        zavod: [1200, 600, 300]
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
        START: "assets/tiles/castle.png",
        kun: "assets/tiles/kun.png",
        pes: "assets/tiles/pes.png",
        sokol: "assets/tiles/sokol.png",
        VILLAGE: "assets/tiles/village.png",
        TOWN: "assets/tiles/town.png",
        CASTLE: "assets/tiles/castle.png",
        MASTER: "",
        MERCHANT: "assets/tiles/merchant.png",
        TAX: "",
        JESTER: "",
        staje: "assets/tiles/kun.jpg",
        kovarna: "",
        krejci: "",
        sokolnik: "assets/tiles/sokol.jpg",
        psovod: "assets/tiles/pes.jpg",
        U1: "assets/tiles/u1_zver.png",
        U2: "assets/tiles/u2_monstrum.png",
        U3: "assets/tiles/u3_drak.png",
        FESTIVAL: "assets/tiles/festival.png",
        PRISON: "assets/tiles/prison.png",
        HOSPITAL: "assets/tiles/hospital.png",
        TAVERN: "assets/tiles/tavern.png",
        CHANCE: "",
        BONUS: ""
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

// Katalog předmětů: VĚCI 1, VĚCI 2, VĚCI 3
// Cena = počet plusů * 1000 - počet mínusů * 500
window.PRS_ITEMS = [
    // --- 1. STUPEŇ (VĚCI 1) ---
    { id: "it1_1", name: "Lovecký tesák", tier: 1, slot: "weapon", icon: "🗡️", boj: 2, jizda: 0, tanec: 0, charisma: 0, pluses: 2, minuses: 0, price: 2000 },
    { id: "it1_2", name: "Těžký rytířský palcát", tier: 1, slot: "weapon", icon: "🔨", boj: 3, jizda: 0, tanec: -1, charisma: 0, pluses: 3, minuses: 1, price: 2500 },
    { id: "it1_3", name: "Jezdecké kopí", tier: 1, slot: "weapon", icon: "🔱", boj: 2, jizda: 1, tanec: 0, charisma: 0, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_4", name: "Prošívaná zbroj", tier: 1, slot: "armor", icon: "🛡️", boj: 2, jizda: 1, tanec: 0, charisma: 0, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_5", name: "Kroužková košile", tier: 1, slot: "armor", icon: "⛓️", boj: 3, jizda: 0, tanec: -1, charisma: 0, pluses: 3, minuses: 1, price: 2500 },
    { id: "it1_6", name: "Hedvábný kabátec", tier: 1, slot: "dress", icon: "🧥", boj: 0, jizda: 0, tanec: 2, charisma: 1, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_7", name: "Sametový plášť", tier: 1, slot: "dress", icon: "🧣", boj: 0, jizda: 0, tanec: 1, charisma: 2, pluses: 3, minuses: 0, price: 3000 },
    { id: "it1_8", name: "Postříbřené ostruhy", tier: 1, slot: "jewel", icon: "👢", boj: 0, jizda: 3, tanec: -1, charisma: 0, pluses: 3, minuses: 1, price: 2500 },
    { id: "it1_9", name: "Zlatá spona s erbem", tier: 1, slot: "jewel", icon: "🎗️", boj: 0, jizda: 1, tanec: 1, charisma: 1, pluses: 3, minuses: 0, price: 3000 },

    // --- 2. STUPEŇ (VĚCI 2) ---
    { id: "it2_1", name: "Damaškový meč", tier: 2, slot: "weapon", icon: "⚔️", boj: 4, jizda: 1, tanec: 0, charisma: 2, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_2", name: "Turnajové dřevce šampionů", tier: 2, slot: "weapon", icon: "🏇", boj: 4, jizda: 4, tanec: -1, charisma: 0, pluses: 8, minuses: 1, price: 7500 },
    { id: "it2_3", name: "Plátová rytířská zbroj", tier: 2, slot: "armor", icon: "🛡️", boj: 5, jizda: 1, tanec: -2, charisma: 2, pluses: 8, minuses: 2, price: 7000 },
    { id: "it2_4", name: "Stříbrný erbovní štít", tier: 2, slot: "armor", icon: "🛡️", boj: 4, jizda: 2, tanec: 0, charisma: 1, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_5", name: "Brokátová dvorská róba", tier: 2, slot: "dress", icon: "👗", boj: 0, jizda: 0, tanec: 4, charisma: 3, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_6", name: "Slavnostní hermelínový šat", tier: 2, slot: "dress", icon: "👑", boj: 0, jizda: 0, tanec: 3, charisma: 4, pluses: 7, minuses: 0, price: 7000 },
    { id: "it2_7", name: "Rubínový pečetní prsten", tier: 2, slot: "jewel", icon: "💍", boj: 1, jizda: 1, tanec: 2, charisma: 3, pluses: 7, minuses: 0, price: 7000 },

    // --- 3. STUPEŇ (VĚCI 3) ---
    { id: "it3_1", name: "Meč Dračího bijce", tier: 3, slot: "weapon", icon: "🗡️", boj: 7, jizda: 3, tanec: 0, charisma: 2, pluses: 12, minuses: 0, price: 12000 },
    { id: "it3_2", name: "Královská zlatá zbroj", tier: 3, slot: "armor", icon: "🛡️", boj: 6, jizda: 4, tanec: -2, charisma: 3, pluses: 13, minuses: 2, price: 12000 },
    { id: "it3_3", name: "Velkolepý knížecí šat", tier: 3, slot: "dress", icon: "👘", boj: 0, jizda: 0, tanec: 6, charisma: 6, pluses: 12, minuses: 0, price: 12000 },
    { id: "it3_4", name: "Korunovační klenot předků", tier: 3, slot: "jewel", icon: "💎", boj: 3, jizda: 3, tanec: 3, charisma: 4, pluses: 13, minuses: 0, price: 13000 }
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
        boj: 2, jizda: 0, tanec: 0, charisma: 0,
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
        boj: 1, jizda: 1, tanec: 0, charisma: 0,
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
        boj: 2, jizda: 1, tanec: -1, charisma: 0,
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
        boj: 0, jizda: 1, tanec: 1, charisma: 2,
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
        boj: 4, jizda: 1, tanec: -2, charisma: 0,
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
        boj: 2, jizda: 0, tanec: 1, charisma: 3,
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
        boj: 4, jizda: 2, tanec: 0, charisma: 1,
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
        boj: 3, jizda: 3, tanec: 0, charisma: 1,
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
        boj: 2, jizda: 0, tanec: 0, charisma: 1,
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
        boj: 3, jizda: 3, tanec: 0, charisma: 1,
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
        boj: 4, jizda: 1, tanec: 0, charisma: 1,
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
        boj: 1, jizda: 1, tanec: 4, charisma: 3,
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
        boj: 2, jizda: 2, tanec: 1, charisma: 4,
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
        boj: 2, jizda: 4, tanec: 2, charisma: 1,
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
        boj: 5, jizda: 2, tanec: 0, charisma: 3,
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
        boj: 6, jizda: 1, tanec: -1, charisma: 2,
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
        boj: 4, jizda: 4, tanec: 0, charisma: 2,
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
        boj: 5, jizda: 3, tanec: 1, charisma: 2,
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
        boj: 5, jizda: 2, tanec: 0, charisma: 3,
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
        boj: 3, jizda: 2, tanec: 3, charisma: 5,
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
        boj: 6, jizda: 2, tanec: -2, charisma: 2,
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
        boj: 3, jizda: 2, tanec: 4, charisma: 6,
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
        boj: 4, jizda: 3, tanec: 1, charisma: 4,
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
        boj: 5, jizda: 4, tanec: 0, charisma: 3,
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
        boj: 6, jizda: 3, tanec: 2, charisma: 5,
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
        boj: 5, jizda: 4, tanec: 1, charisma: 4,
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
        boj: 5, jizda: 5, tanec: 4, charisma: 5,
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
        boj: 6, jizda: 3, tanec: 2, charisma: 5,
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
        boj: 7, jizda: 4, tanec: 3, charisma: 6,
        pluses: 20, minuses: 0, price: 22000,
        desc: "Ultimátní trofej ze samotného dračího císaře! Žezlo ze zlata a obsidiánu zaručující věčnou slávu."
    },
    // ========================================================================
    // 34 NOVÝCH UNIKÁTNÍCH TROFEJÍ Z BÁJNÝCH MONSTER A ŠELEM (5. SLOT ZBROJNICE)
    // ========================================================================
    // --- U1 Trofeje ze zvěře a lesních dravců ---
    trophy_lynx: {
        id: "trophy_lynx", name: "Ostrý rysí zrak", tier: 1, slot: "trophy", icon: "🐱",
        source: "Rys ostrovid (U1)", boj: 1, jizda: 1, tanec: 0, charisma: 0, pluses: 2, minuses: 0, price: 2000,
        desc: "Vyčiněný amulet s rysími drápy a lístky kapradí. Zlepšuje postřeh v nočním lese."
    },
    trophy_bison: {
        id: "trophy_bison", name: "Zubří rohovina", tier: 1, slot: "trophy", icon: "🦬",
        source: "Zuřivý pralesní zubr (U1)", boj: 2, jizda: 0, tanec: -1, charisma: 0, pluses: 2, minuses: 1, price: 2200,
        desc: "Hladce vyleštěný roh pralesního obra. Dává nositeli nezlomnou průbojnost."
    },
    trophy_panther: {
        id: "trophy_panther", name: "Plášť z panteří kůže", tier: 1, slot: "trophy", icon: "🐆",
        source: "Černý královský panter (U1)", boj: 0, jizda: 1, tanec: 1, charisma: 1, pluses: 3, minuses: 0, price: 2500,
        desc: "Hebká ebenová kožešina královské šelmy. Dodává rytíři neslyšný krok a vznešenou auru."
    },
    trophy_spider: {
        id: "trophy_spider", name: "Jedový váček pavouka", tier: 1, slot: "trophy", icon: "🕷️",
        source: "Obří lesní pavouk (U1)", boj: 1, jizda: 0, tanec: 0, charisma: 1, pluses: 2, minuses: 0, price: 2300,
        desc: "Krystalizovaný kapkovitý váček se třpytivým jedem. Nošen na opasku budí respekt lapků."
    },
    trophy_croc: {
        id: "trophy_croc", name: "Pancéřový opasek z krokodýla", tier: 1, slot: "trophy", icon: "🐊",
        source: "Jezerní krokodýl (U1)", boj: 2, jizda: 1, tanec: 0, charisma: 0, pluses: 3, minuses: 0, price: 2600,
        desc: "Opasek z hrubé šupinaté kůže jezerní bestie. Chrání před zákeřnými výpady zblízka."
    },
    trophy_eagle: {
        id: "trophy_eagle", name: "Péro orlího krále", tier: 1, slot: "trophy", icon: "🦅",
        source: "Skalní orel (U1)", boj: 0, jizda: 2, tanec: 0, charisma: 1, pluses: 3, minuses: 0, price: 3000,
        desc: "Zlatohnědé pero horského dravce zdobící chochol přilbice. Zvyšuje rychlost a přehled v sedle."
    },
    trophy_boar_lone: {
        id: "trophy_boar_lone", name: "Válečný tesák Samotáře", tier: 1, slot: "trophy", icon: "🐗",
        source: "Hvozdný divočák Samotář (U1)", boj: 2, jizda: 1, tanec: -1, charisma: 0, pluses: 3, minuses: 1, price: 2700,
        desc: "Zahnutý tesák ze starého kance. Důkaz odvahy rytíře, který svedl boj muž proti muži."
    },
    trophy_wolverine: {
        id: "trophy_wolverine", name: "Hřejivá rosomáčí hučka", tier: 1, slot: "trophy", icon: "🦡",
        source: "Severní vlkobijec (U1)", boj: 2, jizda: 0, tanec: 0, charisma: 1, pluses: 3, minuses: 0, price: 2800,
        desc: "Nezničitelná hučka ze severského dravce. Žádný mráz ani bouře rytíře nezlomí."
    },
    trophy_pike: {
        id: "trophy_pike", name: "Jezerní stříbrná šupina", tier: 1, slot: "trophy", icon: "🐟",
        source: "Obří jezerní štika (U1)", boj: 1, jizda: 0, tanec: 1, charisma: 2, pluses: 4, minuses: 0, price: 3200,
        desc: "Obrovská zrcadlová šupina ulovená v hlubokých tůních. Odráží měsíční svit a těší dvůr."
    },
    trophy_unicorn: {
        id: "trophy_unicorn", name: "Roh čistoty a světla", tier: 1, slot: "trophy", icon: "🦄",
        source: "Magický bílý jednorožec (U1)", boj: 0, jizda: 1, tanec: 2, charisma: 2, pluses: 5, minuses: 0, price: 3800,
        desc: "Spirálovitý perleťový roh posvátné bytosti. Princezna na plese zatají dech úžasem."
    },

    // --- U2 Trofeje z bájných monster a protivníků ---
    trophy_basilisk: {
        id: "trophy_basilisk", name: "Zkamenělé baziliščí oko", tier: 2, slot: "trophy", icon: "🦎",
        source: "Zkamenělý bazilišek (U2)", boj: 2, jizda: 0, tanec: 0, charisma: 3, pluses: 5, minuses: 0, price: 6500,
        desc: "Klenot ze ztuhlého jantaru a smaragdu. Soupeři při pohledu do něj znejistí."
    },
    trophy_wisp: {
        id: "trophy_wisp", name: "Lucerna bludiček", tier: 2, slot: "trophy", icon: "🕯️",
        source: "Močálová jezinka (U2)", boj: 0, jizda: 1, tanec: 2, charisma: 3, pluses: 6, minuses: 0, price: 6800,
        desc: "Mosazná lucerna s věčně tančícím modrým plamínkem. Ukazuje bezpečnou cestu mlhou."
    },
    trophy_troll: {
        id: "trophy_troll", name: "Kamenné srdce trolla", tier: 2, slot: "trophy", icon: "🧌",
        source: "Horský kamenný troll (U2)", boj: 4, jizda: 1, tanec: -2, charisma: 0, pluses: 5, minuses: 2, price: 6500,
        desc: "Těžký křemencový kámen tepající horskou silou. Rytíř získá údernost skalního balvanu."
    },
    trophy_minotaur: {
        id: "trophy_minotaur", name: "Zlatý kroužek Minotaura", tier: 2, slot: "trophy", icon: "🐂",
        source: "Minotaurus z labyrintu (U2)", boj: 4, jizda: 2, tanec: -1, charisma: 1, pluses: 7, minuses: 1, price: 7200,
        desc: "Masivní tepaný kroužek pána labyrintu. Propůjčuje neomylný orientační smysl a hrubou sílu."
    },
    trophy_manticore: {
        id: "trophy_manticore", name: "Trn z ocasu mantikory", tier: 2, slot: "trophy", icon: "🦁",
        source: "Pralesní mantikora (U2)", boj: 3, jizda: 2, tanec: 0, charisma: 2, pluses: 7, minuses: 0, price: 7400,
        desc: "Kostěný osten z bájné mantikory. Přidělán k jílcové záštitě meče vzbuzuje posvátnou hrůzu."
    },
    trophy_griffin: {
        id: "trophy_griffin", name: "Gryfí letka a spáry", tier: 2, slot: "trophy", icon: "🦅",
        source: "Skalní gryf (U2)", boj: 2, jizda: 4, tanec: 0, charisma: 1, pluses: 7, minuses: 0, price: 7500,
        desc: "Obruby štítu zdobené zlatým gryfím peřím a spárem. Zvyšují rychlost rytíře při zteči."
    },
    trophy_siren: {
        id: "trophy_siren", name: "Kouzelná mušle mořské sirény", tier: 2, slot: "trophy", icon: "🧜‍♀️",
        source: "Zrádná siréna (U2)", boj: 0, jizda: 0, tanec: 4, charisma: 3, pluses: 7, minuses: 0, price: 7600,
        desc: "Duhová perleťová ulita znějící zpěvem vln. Kdo ji přiloží k uchu, tančí s lehkostí vánku."
    },
    trophy_ghost_knight: {
        id: "trophy_ghost_knight", name: "Prokletá rytířská pečeť", tier: 2, slot: "trophy", icon: "💀",
        source: "Kostlivý přízrak (U2)", boj: 3, jizda: 1, tanec: 0, charisma: 2, pluses: 6, minuses: 0, price: 7500,
        desc: "Zrezivělá stříbrná pečeť dávného turnajového vítěze. Osvobozena od temnoty, slouží novému hrdinovi."
    },
    trophy_lesovik: {
        id: "trophy_lesovik", name: "Kouzelná větev Lesovika", tier: 2, slot: "trophy", icon: "👺",
        source: "Lesní hejkal (U2)", boj: 2, jizda: 2, tanec: 2, charisma: 1, pluses: 7, minuses: 0, price: 7800,
        desc: "Rostlá dubová hůlka z nitra kouzelného hvozdu. Zvířata v lese rytíře poslouchají na slovo."
    },
    trophy_ghoul: {
        id: "trophy_ghoul", name: "Amulet věčného odpočinku", tier: 2, slot: "trophy", icon: "🧟",
        source: "Hřbitovní ghúl (U2)", boj: 2, jizda: 0, tanec: 1, charisma: 4, pluses: 7, minuses: 0, price: 8000,
        desc: "Stříbrný medailon se svěcenou vodou. Zajišťuje přízeň kněží a uznání královského dvora."
    },
    trophy_golem: {
        id: "trophy_golem", name: "Šém hliněného Golema", tier: 2, slot: "trophy", icon: "🗿",
        source: "Magický hliněný Golem (U2)", boj: 4, jizda: 0, tanec: -2, charisma: 3, pluses: 7, minuses: 2, price: 8200,
        desc: "Zlatá destička s posvátnými runami vyňatá z čela obra. Zaručuje železnou pevnost v obraně."
    },
    trophy_harpy: {
        id: "trophy_harpy", name: "Ostrý pařát skalní harpyje", tier: 2, slot: "trophy", icon: "🪶",
        source: "Skalní krvežíznivá Harpyje (U2)", boj: 3, jizda: 2, tanec: 1, charisma: 0, pluses: 6, minuses: 0, price: 7500,
        desc: "Zahnutý pařát z horských štítů. Rytíř s ním snadno zdolá strmé průsmyky i úskoky nepřátel."
    },
    trophy_alpha_werewolf: {
        id: "trophy_alpha_werewolf", name: "Stříbrem kovaný tesák Alfy", tier: 2, slot: "trophy", icon: "🐺",
        source: "Alfa vlkodlak noční smečky (U2)", boj: 4, jizda: 2, tanec: 0, charisma: 1, pluses: 7, minuses: 0, price: 8500,
        desc: "Masivní tesák vůdce vlkodlačí smečky zasazený ve stříbře. Celé království uznává tvou autoritu."
    },

    // --- U2+/U3 Trofeje z legendárních titánů a bájných monster ---
    trophy_kraken: {
        id: "trophy_kraken", name: "Chapadlo z mořských hlubin", tier: 3, slot: "trophy", icon: "🐙",
        source: "Mořský kraken (U2+)", boj: 4, jizda: 2, tanec: 0, charisma: 3, pluses: 9, minuses: 0, price: 11000,
        desc: "Fosilní zkamenělé chapadlo mořské saňe. Svědectví o vítězství nad samotným oceánem."
    },
    trophy_sphinx: {
        id: "trophy_sphinx", name: "Smaragdové oko sfingy", tier: 3, slot: "trophy", icon: "🦁",
        source: "Královská sfinga (U2+)", boj: 1, jizda: 2, tanec: 2, charisma: 6, pluses: 11, minuses: 0, price: 12000,
        desc: "Zářivý klenot z roucha moudré strážkyně pouště. Propůjčuje nepřekonatelné vladařské Charisma."
    },
    trophy_yeti: {
        id: "trophy_yeti", name: "Kožešina sněžného yettiho", tier: 3, slot: "trophy", icon: "❄️",
        source: "Sněžný yetti (U2+)", boj: 4, jizda: 3, tanec: -1, charisma: 2, pluses: 9, minuses: 1, price: 11500,
        desc: "Bělostná nepromokavá srst vládce velehor. Žádný mrazivý dech nestvůry rytíře neohrozí."
    },
    trophy_phoenix: {
        id: "trophy_phoenix", name: "Zlaté pero věčného Fénixe", tier: 3, slot: "trophy", icon: "🪶",
        source: "Ohnivý pták Fénix (U2+)", boj: 2, jizda: 2, tanec: 4, charisma: 5, pluses: 13, minuses: 0, price: 13000,
        desc: "Pero planoucí teplým zlatavým ohněm, které nikdy nevyhasne. Přináší věčné štěstí a slávu."
    },
    trophy_chimera: {
        id: "trophy_chimera", name: "Štít z chiméří lebky", tier: 3, slot: "trophy", icon: "🐐",
        source: "Tříhlavá chiméra (U2+)", boj: 5, jizda: 2, tanec: 0, charisma: 2, pluses: 9, minuses: 0, price: 12500,
        desc: "Štít pobitý bronzem a rohy chiméry. Odráží plameny i jedovaté kousance."
    },
    trophy_cerberus: {
        id: "trophy_cerberus", name: "Železný obojek podsvětí", tier: 3, slot: "trophy", icon: "🐕‍🦺",
        source: "Kerberos (U2+)", boj: 4, jizda: 1, tanec: 0, charisma: 4, pluses: 9, minuses: 0, price: 12000,
        desc: "Těžký kovaný obojek strážce temných bran. Nošený jako nátepník dodává nadlidskou sílu."
    },
    trophy_centaur: {
        id: "trophy_centaur", name: "Tětiva z hřívy kentaura", tier: 3, slot: "trophy", icon: "🏹",
        source: "Urozený kentaur (U2+)", boj: 4, jizda: 4, tanec: 0, charisma: 2, pluses: 10, minuses: 0, price: 13500,
        desc: "Nezlomná hedvábná tětiva z hřívy lesního šampiona. Zaručuje neomylnou mušku a mistrovskou jízdu."
    },
    trophy_titan: {
        id: "trophy_titan", name: "Hromový blesk titánů", tier: 3, slot: "trophy", icon: "⚡",
        source: "Hromovládný titán bouří (U2+)", boj: 6, jizda: 2, tanec: -1, charisma: 3, pluses: 11, minuses: 1, price: 14000,
        desc: "Ztuhlý hromoklín z modrého meteoru. Srší z něj blesky a otřásá bojištěm."
    },
    trophy_skeleton_king: {
        id: "trophy_skeleton_king", name: "Zlatá koruna padlého vladaře", tier: 3, slot: "trophy", icon: "👑",
        source: "Král kostlivců na trůně (U2+)", boj: 4, jizda: 1, tanec: 2, charisma: 6, pluses: 13, minuses: 0, price: 15000,
        desc: "Starobylá královská koruna posázená safíry. Princezna v ní spatřuje právoplatného panovníka."
    },
    trophy_shadow_demon: {
        id: "trophy_shadow_demon", name: "Krystal temného vykoupení", tier: 3, slot: "trophy", icon: "👿",
        source: "Stínový démon z propasti (U2+)", boj: 4, jizda: 3, tanec: 3, charisma: 3, pluses: 13, minuses: 0, price: 15500,
        desc: "Fialově pulzující kámen očištěný od zla. Dokonalá harmonie všech čtyř ctností rytířského stavu."
    },
    trophy_behemoth: {
        id: "trophy_behemoth", name: "Kly bájného Behemota", tier: 3, slot: "trophy", icon: "🦣",
        source: "Bájný obří Behemot (U2+)", boj: 6, jizda: 1, tanec: -2, charisma: 2, pluses: 9, minuses: 2, price: 14500,
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
        { id: "u1_1", name: "Divoký kňour", icon: "🐗", difficulty: 4, diffOffset: -1, gold: 1200, hearts: 0.5, trophyId: "trophy_boar", img: "assets/decorations/cave_bear_den.png", imgFlip: "assets/decorations/cave_bear_den_flip.png", weakness: "dogs", desc: "V hlubokém lese na tebe vyrazil rozzuřený kanec. Lovečtí psi snadno odlákají jeho pozornost!" },
        { id: "u1_2", name: "Smečka šedých vlků", icon: "🐺", difficulty: 5, diffOffset: 0, gold: 1500, hearts: 0.5, trophyId: "trophy_wolf", img: "assets/decorations/bandit_cave.png", imgFlip: "assets/decorations/bandit_cave_flip.png", weakness: "spear", desc: "Vlčí smečka ohrožuje kupecké vozy u vesnice. Dlouhé kopí udrží vlky v bezpečném odstupu." },
        { id: "u1_3", name: "Horský medvěd", icon: "🐻", difficulty: 5, diffOffset: 0, gold: 1800, hearts: 0.5, trophyId: "trophy_bear", img: "assets/decorations/snow_troll_cave.png", imgFlip: "assets/decorations/snow_troll_cave_flip.png", weakness: "horse", desc: "Obrovský medvěd brání průsmyk ke hradu. Rychlý útok na koni zaskočí jeho těžkopádnost." },
        { id: "u1_4", name: "Královský bílý jelen", icon: "🦌", difficulty: 6, diffOffset: 1, gold: 2200, hearts: 1.0, trophyId: "trophy_stag", img: "assets/decorations/unicorn_grove.png", imgFlip: "assets/decorations/unicorn_grove_flip.png", weakness: "falcons", desc: "Vzácný jelen v kouzelném háji. Lovecký sokol vystopuje jeho stopy v houštinách." },
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
        { id: "u2_1", name: "Skalní obr", icon: "👹", difficulty: 8, diffOffset: -1, gold: 3000, hearts: 1.0, itemTier: 1, trophyId: "trophy_giant", img: "assets/decorations/swamp_troll.png", imgFlip: "assets/decorations/swamp_troll_flip.png", weakness: "horse", desc: "Obr s obřím kyjem vybírá mýto u mostu. Rychlý kůň dovolí rytíři manévrovat kolem jeho úderů." },
        { id: "u2_2", name: "Temný černokněžník", icon: "🧙‍♂️", difficulty: 9, diffOffset: 0, gold: 3500, hearts: 1.0, itemTier: 1, trophyId: "trophy_warlock", img: "assets/decorations/witch_hut.png", imgFlip: "assets/decorations/witch_hut_flip.png", weakness: "spear", desc: "Zlý čaroděj sesílá kletby ze své chatrče. Dlouhé kopí probodne jeho magické bariéry." },
        { id: "u2_3", name: "Černý loupeživý rytíř", icon: "⚔️", difficulty: 9, diffOffset: 0, gold: 4000, hearts: 1.5, itemTier: 2, trophyId: "trophy_black_knight", img: "assets/decorations/ancient_ruins.png", imgFlip: "assets/decorations/ancient_ruins_flip.png", weakness: "armor", desc: "Obávaný rytíř ve starých ruinách tě vyzval na souboj. Pevná plátová zbroj odrazí jeho úder." },
        { id: "u2_4", name: "Jeskynní vlkodlak", icon: "🐺", difficulty: 10, diffOffset: 1, gold: 4500, hearts: 1.5, itemTier: 2, trophyId: "trophy_werewolf", img: "assets/decorations/basilisk_cave.png", imgFlip: "assets/decorations/basilisk_cave_flip.png", weakness: "dogs", desc: "V tajemné jeskyni číhá bestie. Lovecká smečka vycítí pach vlkodlaka a pomůže v boji." },
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
            { id: "opt_keep_horse", title: "Přivlastnit si hřebce", icon: "🏇", costGold: 1000, effect: "gain_jizda", desc: "Zaplatíš 1 000 zl. podkoním za ututlání cejchu a získáš +1 k Jízdě na koni!" },
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
            { id: "opt_tavern_fencer", title: "Pozvat ho na korbel piva", icon: "🍺", costGold: 400, effect: "gain_boj", desc: "Zaplatíš 400 zl. za hostinu v krčmě a šermíř tě naučí tajné bojové finty (+1 Boj)!" }
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
    }
];
