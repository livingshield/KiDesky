// ============================================================================
// KiDesky: Princeznino srdce - Katalog dekorací herního plánu (PRS_DECOR_CATALOG)
//
// ŠABLONA PRO PŘIDÁVÁNÍ NOVÉ DEKORACE:
//   1. Vložte záznam do PRS_DECOR_CATALOG + zápis do placementOverrides níže:
//      - biomes:       ["forest", "meadow", "farmland", "rocky", "wetland"]
//      - layer:        "ground" (voda, pole, houby, most) | "standing" (stromy, stavby, hory, bytosti)
//      - anchorY:      0.15 (ploché) .. 0.45 (vysoké stavby/stromy) -> footY = y + h * anchorY
//      - roadPolicy:   "avoid" (plný odstup) | "edge" (u okraje cesty) | "overhang" (pata mimo, vrch smí přesahovat)
//      - maxPerMap:    číslo (např. 1 pro unikáty, 2..5 pro stavby) | null (bez limitu)
//      - overlapGroup: "canopy" (stromy) | "ridge" (hory/skály) | "exclusive" (ostatní samostatné)
//      - weight:       relativní váha výběru (výchozí 1.0)
//   2. Čistý RGBA WebP sprite (<= 512 px, bez travnatého ostrůvku a vrženého stínu) -> assets/decorations/<id>.webp
//      a footFadeOverrides[<id>] = 0.
// ============================================================================

window.PRS_DECOR_CATALOG = {
    // --- 1. Stromy a lesní porosty ---
    tree_oak: {
        id: "tree_oak",
        name: "Listnatý dub",
        icon: "🌳",
        desc: "Mohutný solitérní dub s hustou zelenou korunou, poskytující stín pocestným a rytířům na královských loukách.",
        category: "vegetation",
        w: 56, h: 68, clearance: 28,
        img: "assets/decorations/tree_oak.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<path d="M-5,14 Q-7,32 -10,36 L10,36 Q7,32 5,14 Z" fill="#6d4c41" stroke="#3e2723" stroke-width="1.2"/>' +
                '<circle cx="-12" cy="2" r="15" fill="#2e7d32" opacity="0.95"/>' +
                '<circle cx="12" cy="4" r="14" fill="#388e3c" opacity="0.95"/>' +
                '<circle cx="0" cy="-10" r="18" fill="#4caf50"/>' +
                '<circle cx="-3" cy="-12" r="12" fill="#81c784" opacity="0.55"/>';
        }
    },

    tree_pine: {
        id: "tree_pine",
        name: "Horská borovice",
        icon: "🌲",
        desc: "Štíhlá jehličnatá borovice odolávající drsným horským větrům v podhůří i na skalnatých srázech.",
        category: "vegetation",
        w: 48, h: 72, clearance: 25,
        img: "assets/decorations/tree_pine.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<rect x="-3" y="16" width="6" height="18" fill="#5d4037" stroke="#3e2723" stroke-width="1"/>' +
                '<polygon points="0,2 -24,20 24,20" fill="#2e7d32"/>' +
                '<polygon points="0,-12 -21,6 21,6" fill="#388e3c"/>' +
                '<polygon points="0,-26 -16,-8 16,-8" fill="#4caf50"/>' +
                '<polygon points="0,-26 -4,-8 0,-8" fill="#a5d6a7" opacity="0.4"/>';
        }
    },

    tree_birch: {
        id: "tree_birch",
        name: "Bělostná bříza",
        icon: "🌿",
        desc: "Půvabná bělostná bříza se stříbřitou kůrou a jemným listovím, oblíbená v hájích u koňských pastvin.",
        category: "vegetation",
        w: 44, h: 64, clearance: 22,
        img: "assets/decorations/tree_birch.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<path d="M-2,12 L-3,32 L3,32 L2,12 Z" fill="#f5f5f4" stroke="#44403c" stroke-width="1"/>' +
                '<line x1="-3" y1="20" x2="1" y2="20" stroke="#292524" stroke-width="1.2"/>' +
                '<line x1="-1" y1="26" x2="3" y2="26" stroke="#292524" stroke-width="1.2"/>' +
                '<ellipse cx="0" cy="-6" rx="16" ry="20" fill="#84cc16"/>' +
                '<ellipse cx="-4" cy="-8" rx="10" ry="14" fill="#bef264" opacity="0.55"/>';
        }
    },

    grove_oak: {
        id: "grove_oak",
        name: "Dubový hájek",
        icon: "🌳",
        desc: "Malebné seskupení tří starých dubů tvořící přirozený stinný předěl mezi jednotlivými stezkami.",
        category: "vegetation",
        w: 92, h: 76, clearance: 44,
        img: "assets/decorations/grove_oak.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<g transform="translate(-18,-2) scale(0.85)">' +
                '  <path d="M-4,14 Q-6,30 -8,34 L8,34 Q6,30 4,14 Z" fill="#6d4c41"/>' +
                '  <circle cx="0" cy="-6" r="15" fill="#2e7d32"/>' +
                '</g>' +
                '<g transform="translate(18,-2) scale(0.85)">' +
                '  <path d="M-4,14 Q-6,30 -8,34 L8,34 Q6,30 4,14 Z" fill="#6d4c41"/>' +
                '  <circle cx="0" cy="-6" r="15" fill="#388e3c"/>' +
                '</g>' +
                '<g transform="translate(0,6)">' +
                '  <path d="M-5,14 Q-7,32 -10,36 L10,36 Q7,32 5,14 Z" fill="#6d4c41"/>' +
                '  <circle cx="0" cy="-10" r="18" fill="#4caf50"/>' +
                '  <circle cx="-3" cy="-12" r="12" fill="#81c784" opacity="0.55"/>' +
                '</g>';
        }
    },

    grove_pine: {
        id: "grove_pine",
        name: "Borový lesík",
        icon: "🌲",
        desc: "Hustý borový lesík vonící jehličím a pryskyřicí, lemující odlehlejší kouty a stezky k Dračí sluji.",
        category: "vegetation",
        w: 86, h: 80, clearance: 42,
        img: "assets/decorations/grove_pine.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<g transform="translate(-16,-4) scale(0.85)">' +
                '  <rect x="-3" y="16" width="6" height="18" fill="#5d4037"/>' +
                '  <polygon points="0,2 -20,18 20,18" fill="#1b5e20"/>' +
                '  <polygon points="0,-12 -17,4 17,4" fill="#2e7d32"/>' +
                '  <polygon points="0,-24 -14,-10 14,-10" fill="#388e3c"/>' +
                '</g>' +
                '<g transform="translate(16,-4) scale(0.85)">' +
                '  <rect x="-3" y="16" width="6" height="18" fill="#5d4037"/>' +
                '  <polygon points="0,2 -20,18 20,18" fill="#1b5e20"/>' +
                '  <polygon points="0,-12 -17,4 17,4" fill="#2e7d32"/>' +
                '  <polygon points="0,-24 -14,-10 14,-10" fill="#388e3c"/>' +
                '</g>' +
                '<g transform="translate(0,6)">' +
                '  <rect x="-3" y="16" width="6" height="18" fill="#5d4037"/>' +
                '  <polygon points="0,2 -22,20 22,20" fill="#2e7d32"/>' +
                '  <polygon points="0,-12 -19,6 19,6" fill="#388e3c"/>' +
                '  <polygon points="0,-26 -15,-8 15,-8" fill="#4caf50"/>' +
                '</g>';
        }
    },


    // --- 2. Skály a horské hřebeny ---
    rock_boulder: {
        id: "rock_boulder",
        name: "Mechem porostlý balvan",
        icon: "🪨",
        desc: "Prastarý žulový balvan obrostlý mechem a lišejníky, označující skalnaté úseky a stezky odvahy.",
        category: "terrain",
        w: 52, h: 40, clearance: 24,
        img: "assets/decorations/rock_boulder.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<polygon points="-22,10 -16,-6 4,-14 22,-2 18,12 -8,14" fill="#78716c" stroke="#44403c" stroke-width="1.4"/>' +
                '<polygon points="-16,-6 4,-14 10,-2 -6,4" fill="#a8a29e" opacity="0.6"/>' +
                '<path d="M-14,-4 Q-6,-12 4,-12 Q14,-8 18,-2 Q10,4 0,2 Q-10,0 -14,-4 Z" fill="#65a30d" opacity="0.85"/>';
        }
    },

    mountain_peaks: {
        id: "mountain_peaks",
        name: "Zasněžený horský štít",
        icon: "🏔️",
        desc: "Monumentální horský masiv s věčným sněhem na vrcholcích, tvořící velkolepý severní horizont království.",
        category: "terrain",
        w: 120, h: 74, clearance: 55,
        img: "assets/decorations/mountain_peaks.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<polygon points="-40,26 -20,-22 6,26" fill="#475569" stroke="#1e293b" stroke-width="1.5"/>' +
                '<polygon points="-8,26 22,-28 50,26" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>' +
                '<polygon points="-20,-22 -26,-8 -20,-4 -14,-8" fill="#f8fafc"/>' +
                '<polygon points="22,-28 15,-12 22,-6 30,-12" fill="#f8fafc"/>' +
                '<line x1="-20" y1="-4" x2="-14" y2="26" stroke="#334155" stroke-width="1.2"/>' +
                '<line x1="22" y1="-6" x2="26" y2="26" stroke="#1e293b" stroke-width="1.2"/>';
        }
    },


    // --- 3. Zemědělství a venkov ---
    farm_field: {
        id: "farm_field",
        name: "Pšeničné lánové pole",
        icon: "🌾",
        desc: "Zlatavý lán zralého pšeničného obilí s úrodnými brázdami, symbol blahobytu a míru v podhradí.",
        category: "agriculture",
        w: 105, h: 60, clearance: 48,
        img: "assets/decorations/farm_field.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<polygon points="-44,4 0,-18 44,-4 0,18" fill="#eab308" stroke="#a16207" stroke-width="1.2" opacity="0.75"/>' +
                '<line x1="-30" y1="2" x2="14" y2="-12" stroke="#ca8a04" stroke-width="2"/>' +
                '<line x1="-15" y1="9" x2="29" y2="-5" stroke="#ca8a04" stroke-width="2"/>' +
                '<line x1="0" y1="16" x2="44" y2="2" stroke="#ca8a04" stroke-width="2"/>';
        }
    },

    pasture_fence: {
        id: "pasture_fence",
        name: "Pastvina s dřevěnou ohradou",
        icon: "🐎",
        desc: "Trámová dřevěná ohrada lemující šťavnaté pastviny, kde se chovají ušlechtilí královští koně a lovečtí psi.",
        category: "agriculture",
        w: 78, h: 48, clearance: 36,
        img: "assets/decorations/pasture_fence.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<rect x="-30" y="-8" width="4" height="22" fill="#854d0e" rx="1"/>' +
                '<rect x="-2" y="-10" width="4" height="24" fill="#854d0e" rx="1"/>' +
                '<rect x="26" y="-8" width="4" height="22" fill="#854d0e" rx="1"/>' +
                '<line x1="-32" y1="-4" x2="28" y2="-4" stroke="#a16207" stroke-width="2.2"/>' +
                '<line x1="-32" y1="6" x2="28" y2="6" stroke="#a16207" stroke-width="2.2"/>';
        }
    },

    windmill: {
        id: "windmill",
        name: "Větrný mlýn",
        icon: "💨",
        desc: "Dřevěný větrný mlýn s mohutnými plachtovými lopatkami, který mele zrno na otevřených větrných pláních.",
        category: "agriculture",
        w: 68, h: 88, clearance: 34,
        img: "assets/decorations/windmill.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<polygon points="-14,34 -8,-4 8,-4 14,34" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>' +
                '<rect x="-4" y="18" width="8" height="16" fill="#451a03" rx="1"/>' +
                '<polygon points="-12,-4 0,-20 12,-4" fill="#b45309" stroke="#78350f" stroke-width="1.2"/>' +
                '<circle cx="0" cy="-6" r="3" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>' +
                '<line x1="-24" y1="-30" x2="24" y2="18" stroke="#fef08a" stroke-width="2.2"/>' +
                '<line x1="-24" y1="18" x2="24" y2="-30" stroke="#fef08a" stroke-width="2.2"/>' +
                '<line x1="-24" y1="-30" x2="-18" y2="-24" stroke="#d97706" stroke-width="1.5"/>' +
                '<line x1="24" y1="18" x2="18" y2="12" stroke="#d97706" stroke-width="1.5"/>' +
                '<line x1="-24" y1="18" x2="-18" y2="12" stroke="#d97706" stroke-width="1.5"/>' +
                '<line x1="24" y1="-30" x2="18" y2="-24" stroke="#d97706" stroke-width="1.5"/>';
        }
    },


    // --- 4. Lidská sídla a kultura (rekvizity) ---
    cottage_timber: {
        id: "cottage_timber",
        name: "Roubená chalupa",
        icon: "🏡",
        desc: "Pohádková roubená chalupa s kamennou podezdívkou a šindelovou střechou v srdci královských vsí.",
        category: "settlement",
        w: 70, h: 64, clearance: 35,
        img: "assets/decorations/cottage_timber.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<rect x="-22" y="2" width="44" height="24" rx="2" fill="#fef3c7" stroke="#78350f" stroke-width="1.4"/>' +
                '<polygon points="-28,4 0,-18 28,4" fill="#b45309" stroke="#78350f" stroke-width="1.6"/>' +
                '<rect x="-5" y="12" width="10" height="14" fill="#78350f"/>' +
                '<rect x="8" y="8" width="8" height="8" fill="#38bdf8" stroke="#78350f" stroke-width="1"/>' +
                '<line x1="-22" y1="2" x2="0" y2="26" stroke="#78350f" stroke-width="1.4"/>' +
                '<line x1="22" y1="2" x2="0" y2="26" stroke="#78350f" stroke-width="1.4"/>' +
                '<rect x="14" y="-14" width="5" height="10" fill="#57534e"/>';
        }
    },

    village_well: {
        id: "village_well",
        name: "Kamenná studna s rumpálem",
        icon: "🪣",
        desc: "Hluboká návesní studna z kamene s poctivým dřevěným rumpálem a okovem křišťálově čisté vody.",
        category: "settlement",
        w: 42, h: 46, clearance: 22,
        img: "assets/decorations/village_well.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<ellipse cx="0" cy="12" rx="14" ry="7" fill="#64748b" stroke="#334155" stroke-width="1.4"/>' +
                '<ellipse cx="0" cy="10" rx="10" ry="4" fill="#0284c7"/>' +
                '<line x1="-10" y1="10" x2="-10" y2="-6" stroke="#854d0e" stroke-width="2.5"/>' +
                '<line x1="10" y1="10" x2="10" y2="-6" stroke="#854d0e" stroke-width="2.5"/>' +
                '<polygon points="-14,-4 0,-16 14,-4" fill="#a16207" stroke="#713f12" stroke-width="1.2"/>' +
                '<rect x="-2" y="-1" width="4" height="5" fill="#78350f"/>';
        }
    },

    merchant_wagon: {
        id: "merchant_wagon",
        name: "Kupecký krytý vůz",
        icon: "🛒",
        desc: "Krytý povoz potulného kupce se sudy a truhlami, nabízející zbraně, vzácná sukna a lektvary z dalekých zemí.",
        category: "settlement",
        w: 68, h: 52, clearance: 32,
        img: "assets/decorations/merchant_wagon.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<circle cx="-16" cy="14" r="6" fill="#78350f" stroke="#451a03" stroke-width="1.4"/>' +
                '<circle cx="16" cy="14" r="6" fill="#78350f" stroke="#451a03" stroke-width="1.4"/>' +
                '<rect x="-22" y="6" width="44" height="8" fill="#92400e" stroke="#451a03" stroke-width="1.2"/>' +
                '<path d="M-20,6 Q-20,-14 0,-14 Q20,-14 20,6 Z" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.4"/>' +
                '<line x1="-20" y1="6" x2="-20" y2="-2" stroke="#ca8a04" stroke-width="1.2"/>' +
                '<line x1="20" y1="6" x2="20" y2="-2" stroke="#ca8a04" stroke-width="1.2"/>';
        }
    },

    tournament_tent: {
        id: "tournament_tent",
        name: "Královský turnajový pavilon",
        icon: "🎪",
        desc: "Nádherný královský pavilon v purpurových a zlatých barvách koruny, připravený pro šlechtická klání a slavnosti.",
        category: "settlement",
        w: 78, h: 70, clearance: 38,
        img: "assets/decorations/tournament_tent.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<polygon points="-26,22 -22,4 22,4 26,22" fill="#991b1b" stroke="#7f1d1d" stroke-width="1.4"/>' +
                '<polygon points="-24,4 0,-18 24,4" fill="#dc2626" stroke="#b91c1c" stroke-width="1.4"/>' +
                '<line x1="-12" y1="4" x2="0" y2="-18" stroke="#facc15" stroke-width="2"/>' +
                '<line x1="12" y1="4" x2="0" y2="-18" stroke="#facc15" stroke-width="2"/>' +
                '<polygon points="0,-18 12,-22 0,-26" fill="#facc15"/>';
        }
    },

    signpost: {
        id: "signpost",
        name: "Dřevěný rozcestník",
        icon: "🪧",
        desc: "Dřevěný rozcestník se směrovkami ukazujícími cesty k hradům, vesnicím a nebezpečným stezkám.",
        category: "settlement",
        w: 32, h: 44, clearance: 18,
        img: "assets/decorations/signpost.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<rect x="-2" y="-12" width="4" height="26" fill="#78350f"/>' +
                '<polygon points="-12,-8 6,-8 11,-5 6,-2 -12,-2" fill="#d97706" stroke="#92400e" stroke-width="0.9"/>' +
                '<polygon points="-10,2 8,2 3,5 8,8 -10,8" fill="#b45309" stroke="#78350f" stroke-width="0.9"/>';
        }
    },

    lake_pond: {
        id: "lake_pond",
        name: "Modré lesní jezírko",
        icon: "💧",
        desc: "Klidná lesní tůňka s kvetoucími lekníny, rákosím a průzračnou vodou, kde se zrcadlí koruny stromů.",
        category: "water",
        w: 96, h: 58, clearance: 46,
        img: "assets/decorations/lake_pond.webp",
        canFlip: true,
        renderSVG: function () {
            return '' +
                '<path d="M-38,0 C-38,-16 -10,-22 16,-18 C38,-14 42,-2 36,10 C30,22 6,24 -18,20 C-34,16 -38,8 -38,0 Z" fill="#0284c7" stroke="#0369a1" stroke-width="1.8" opacity="0.85"/>' +
                '<ellipse cx="-6" cy="2" rx="16" ry="5" fill="none" stroke="#e0f2fe" stroke-width="1" opacity="0.65"/>' +
                '<circle cx="-14" cy="4" r="4.5" fill="#15803d"/>' +
                '<circle cx="12" cy="-3" r="3.5" fill="#15803d"/>' +
                '<circle cx="13" cy="-4" r="1.5" fill="#f43f5e"/>';
        }
    },

    // --- 5. Nové sady, keře a rozcestníky ---
    orchad_apple: {
        id: "orchad_apple",
        name: "Jabloňový sad",
        icon: "🍎",
        desc: "Pravidelně vysázený sad obsypaný sladkými červenými jablky přinášející osvěžení putujícím družinám.",
        category: "vegetation",
        w: 96, h: 76, clearance: 44,
        img: "assets/decorations/orchad_apple.webp",
        canFlip: true
    },

    hruskovy_sad: {
        id: "hruskovy_sad",
        name: "Hruškový sad",
        icon: "🍐",
        desc: "Slunný ovocný sad se šťavnatými žlutými hruškami na mírných pahorcích královského panství.",
        category: "vegetation",
        w: 96, h: 76, clearance: 44,
        img: "assets/decorations/hruskovy_sad.webp",
        canFlip: true
    },

    orchad_plum: {
        id: "orchad_plum",
        name: "Švestkový sad",
        icon: "🫐",
        desc: "Sad starých švestkových stromů s modrými plody, ze kterých vesničané vaří vyhlášená povidla.",
        category: "vegetation",
        w: 96, h: 76, clearance: 44,
        img: "assets/decorations/orchad_plum.webp",
        canFlip: true
    },

    bush: {
        id: "bush",
        name: "Hustý keř",
        icon: "🌿",
        desc: "Hustý kvetoucí keř oživující okraje cest a poskytující bezpečný úkryt pro drobnou lesní zvěř.",
        category: "vegetation",
        w: 48, h: 42, clearance: 22,
        img: "assets/decorations/bush.webp",
        canFlip: true
    },

    signpost2: {
        id: "signpost2",
        name: "Kamenný rozcestník",
        icon: "🗿",
        desc: "Otesaný kamenný rozcestník s vyrytými rodovými erby a směry na křižovatkách horských cest.",
        category: "settlement",
        w: 44, h: 54, clearance: 20,
        img: "assets/decorations/signpost2.webp",
        canFlip: true
    },

    grove_pine2: {
        id: "grove_pine2",
        name: "Hluboký borový hvozd",
        icon: "🌲",
        desc: "Hluboký a neprostupný borový hvozd, v jehož větvích se ozývá tajemné houkání sov a šumění větru.",
        category: "vegetation",
        w: 92, h: 80, clearance: 42,
        img: "assets/decorations/grove_pine2.webp",
        canFlip: true
    },

    hrad: {
        id: "hrad",
        name: "Strážní hrad",
        icon: "🏰",
        desc: "Kamenný strážní hrádek s cimbuřím a střílnami, střežící zemské hranice před nájezdy banditů.",
        category: "civilization",
        w: 80, h: 80, clearance: 40,
        img: "assets/decorations/hrad.webp",
        canFlip: true
    },

    // --- 6. Vodní toky a mosty ---
    watermill: {
        id: "watermill",
        name: "Vodní mlýn s náhonem",
        icon: "⚙️",
        desc: "Klapající roubený vodní mlýn s proudem vody stékajícím po lopatkách velkého dřevěného kola na zurčícím potoce.",
        category: "agriculture",
        w: 78, h: 84, clearance: 38,
        img: "assets/decorations/watermill.webp",
        canFlip: true
    },

    swamp_bridge: {
        id: "swamp_bridge",
        name: "Dřevěná lávka přes močál",
        icon: "🌉",
        desc: "Dřevěná lávka klenoucí se přes zrádný močál mezi orobincem, lekníny a tančícími bludičkami.",
        category: "water",
        w: 84, h: 57, clearance: 38,
        img: "assets/decorations/swamp_bridge.webp",
        canFlip: true
    },

    lake_nymphs: {
        id: "lake_nymphs",
        name: "Jezerní rusalky na molu",
        icon: "🧜‍♀️",
        desc: "Tajemné jezerní rusalky a vodní víly odpočívající na dřevěném molu uprostřed leknínů, lákající pocestné svým líbezným zpěvem.",
        category: "water",
        w: 88, h: 52, clearance: 38,
        img: "assets/decorations/lake_nymphs.webp",
        canFlip: true
    },

    vodnik_pond: {
        id: "vodnik_pond",
        name: "Vodník u tůně",
        icon: "🐸",
        desc: "Zelený hastrman bafající z dýmky na vyvrácené vrbě nad temnou tůní, schovávající hrníčky s dušičkami a chytající ryby do sítě.",
        category: "water",
        w: 88, h: 53, clearance: 38,
        img: "assets/decorations/vodnik_pond.webp",
        canFlip: true
    },

    // --- 7. Strážní objekty a tajemná obydlí ---
    wooden_watchtower: {
        id: "wooden_watchtower",
        name: "Dřevěná strážní věž",
        icon: "🗼",
        desc: "Vysoká dřevěná trámová pozorovatelna s žebříkem a pochodní, odkud královské hlídky střeží obchodní stezky a hranice panství.",
        category: "civilization",
        w: 66, h: 84, clearance: 36,
        img: "assets/decorations/wooden_watchtower.webp",
        canFlip: true
    },

    ancient_tower_ruin: {
        id: "ancient_tower_ruin",
        name: "Zřícenina kamenné věže",
        icon: "🏰",
        desc: "Opuštěná kamenná věž obrostlá břečťanem a mohutnými kořeny prastarého stromu, střežící tajemství dávných dynastií.",
        category: "civilization",
        w: 64, h: 84, clearance: 36,
        img: "assets/decorations/ancient_tower_ruin.webp",
        canFlip: true
    },

    witch_hut: {
        id: "witch_hut",
        name: "Perníková chaloupka ježibaby",
        icon: "🧙‍♀️",
        desc: "Perníková chaloupka s cukrovou polevou a křivým komínem, ze kterého stoupá fialový kouř od bublajícího čarodějného lektvaru.",
        category: "settlement",
        w: 74, h: 84, clearance: 38,
        img: "assets/decorations/witch_hut.webp",
        canFlip: true
    },

    // --- 8. Magická místa, ruiny a posvátné bytosti ---
    fairy_ring_mushrooms: {
        id: "fairy_ring_mushrooms",
        name: "Vílí houbový kruh",
        icon: "🍄",
        desc: "Magický kruh světélkujících hub na lesní mýtině se třpytivým vílím prachem, kde za svitu měsíce tančí lesní víly a bludičky.",
        category: "magic",
        w: 84, h: 67, clearance: 36,
        img: "assets/decorations/fairy_ring_mushrooms.webp",
        canFlip: true
    },

    druid_monoliths: {
        id: "druid_monoliths",
        name: "Druidské menhiry a megalit",
        icon: "🪨",
        desc: "Kruh starobylých mechem obrostlých menhirů s vyrytými zářícími runami a kamenným oltářem, které pulzují zemskou magií.",
        category: "magic",
        w: 84, h: 72, clearance: 38,
        img: "assets/decorations/druid_monoliths.webp",
        canFlip: true
    },

    crystal_golem: {
        id: "crystal_golem",
        name: "Krystalový golem",
        icon: "💎",
        desc: "Monumentální kamenný golem protkaný zářícími magickými krystaly a runovými žilami, probuzený ze staletého spánku v hlubinách země.",
        category: "magic",
        w: 79, h: 84, clearance: 38,
        img: "assets/decorations/crystal_golem.webp",
        canFlip: true
    },

    phoenix_nest: {
        id: "phoenix_nest",
        name: "Hnízdo ohnivého Fénixe",
        icon: "🔥",
        desc: "Starobylý kamenný pilíř s hnízdem plným žhnoucího popela a magických vajec, v němž plane vznešený ohnivý pták Fénix.",
        category: "magic",
        w: 82, h: 84, clearance: 38,
        img: "assets/decorations/phoenix_nest.webp",
        canFlip: true
    },

    ancient_ruins: {
        id: "ancient_ruins",
        name: "Zarostlé kamenné zříceniny",
        icon: "🏛️",
        desc: "Zarostlé kamenné zříceniny s gotickým obloukem, rozpadlými zdmi a polozakopanou truhlou, skrývající dávno zapomenuté poklady.",
        category: "terrain",
        w: 84, h: 79, clearance: 38,
        img: "assets/decorations/ancient_ruins.webp",
        canFlip: true
    },

    ancient_graveyard: {
        id: "ancient_graveyard",
        name: "Tajemný starý hřbitov",
        icon: "🪦",
        desc: "Starobylý tajemný hřbitov s kamennou zídkou, náhrobky a uschlým stromem opředený rytířskými legendami.",
        category: "settlement",
        w: 84, h: 60, clearance: 38,
        img: "assets/decorations/ancient_graveyard.webp",
        canFlip: true
    },

    dryad_sacred_oak: {
        id: "dryad_sacred_oak",
        name: "Posvátný dub s lesní dryádou",
        icon: "🧚‍♀️",
        desc: "Posvátný dub prastarých věků, z jehož kmene vystupuje ochranitelská lesní dryáda obklopená světélky.",
        category: "vegetation",
        w: 65, h: 84, clearance: 36,
        img: "assets/decorations/dryad_sacred_oak.webp",
        canFlip: true
    },

    forest_ent: {
        id: "forest_ent",
        name: "Prastarý lesní ent",
        icon: "🌲",
        desc: "Probuzený strážce hvozdu v podobě obřího oživlého stromu s parožím a mechovým vousem, chránící posvátné lesy království.",
        category: "vegetation",
        w: 66, h: 84, clearance: 36,
        img: "assets/decorations/forest_ent.webp",
        canFlip: true
    },

    unicorn_grove: {
        id: "unicorn_grove",
        name: "Kouzelný háj s jednorožcem",
        icon: "🦄",
        desc: "Stříbřitá mýtina v hlubokém hvozdu, kde se prochází bájný bílý jednorožec se zlatou hřívou.",
        category: "vegetation",
        w: 84, h: 75, clearance: 38,
        img: "assets/decorations/unicorn_grove.webp",
        canFlip: true
    },

    pegasus_pond: {
        id: "pegasus_pond",
        name: "Pegas u lesní studánky",
        icon: "🪽",
        desc: "Kouzelná lesní studánka, k níž slétá pít sněhobílý okřídlený Pegas s rozpjatými křídly.",
        category: "water",
        w: 84, h: 62, clearance: 38,
        img: "assets/decorations/pegasus_pond.webp",
        canFlip: true
    },

    // --- 9. Doupata a nebezpečné nestvůry ---
    cave_bear_den: {
        id: "cave_bear_den",
        name: "Medvědí jeskyně",
        icon: "🐻",
        desc: "Skalní jeskyně plná kostí a trofejí, sloužící jako brloh obrovského divokého medvěda střežícího vstup do jeskyně.",
        category: "quest_lair",
        w: 84, h: 84, clearance: 38,
        img: "assets/decorations/cave_bear_den.webp",
        canFlip: true
    },

    bandit_cave: {
        id: "bandit_cave",
        name: "Loupežnická jeskyně s pokladem",
        icon: "💰",
        desc: "Loupežnické doupě osvětlené plápolajícími pochodněmi, plné otevřených truhel se zlaťáky, drahokamy a zcizenými cennostmi.",
        category: "quest_lair",
        w: 84, h: 82, clearance: 38,
        img: "assets/decorations/bandit_cave.webp",
        canFlip: true
    },

    griffin_nest: {
        id: "griffin_nest",
        name: "Hnízdo skalního gryfa",
        icon: "🦅",
        desc: "Vysoký skalní masiv s obřím hnízdem z větví a kostí, kde na vejcích sedí hrdý skalní gryf střežící blýskavé poklady.",
        category: "quest_lair",
        w: 64, h: 84, clearance: 38,
        img: "assets/decorations/griffin_nest.webp",
        canFlip: true
    },

    fire_salamander: {
        id: "fire_salamander",
        name: "Ohnivý salamandr",
        icon: "🦎",
        desc: "Mystický lávový salamandr vyhřívající se na žhnoucích balvanech u ohořelého stromu, chrlící drobné plaménky a jiskry.",
        category: "quest_lair",
        w: 80, h: 84, clearance: 38,
        img: "assets/decorations/fire_salamander.webp",
        canFlip: true
    },

    dragon_cave: {
        id: "dragon_cave",
        name: "Spící drak ve sluji",
        icon: "🐉",
        desc: "Monumentální skalní jeskyně, v jejímž nitru tvrdě spí červený drak svinutý na obrovské hromadě zlaťáků, pohárů a zbraní padlých rytířů.",
        category: "quest_lair",
        w: 88, h: 61, clearance: 38,
        img: "assets/decorations/dragon_cave.webp",
        canFlip: true
    },

    basilisk_cave: {
        id: "basilisk_cave",
        name: "Jeskyně baziliška",
        icon: "🦎",
        desc: "Zlověstná skalní rozsedlina plná zkamenělých těl dobrodruhů, střežená smrtícím ještěřím baziliškem.",
        category: "quest_lair",
        w: 84, h: 57, clearance: 38,
        img: "assets/decorations/basilisk_cave.webp",
        canFlip: true
    },

    snow_troll_cave: {
        id: "snow_troll_cave",
        name: "Ledová jeskyně sněžného trolla",
        icon: "❄️",
        desc: "Mrazivá ledová jeskyně s obřími rampouchy, kde se v závějích ukrývá mocný sněžný troll s kyjem.",
        category: "quest_lair",
        w: 84, h: 56, clearance: 38,
        img: "assets/decorations/snow_troll_cave.webp",
        canFlip: true
    },

    swamp_troll: {
        id: "swamp_troll",
        name: "Bažinný troll u tůně",
        icon: "🧌",
        desc: "Zavalitý bažinný troll porostlý řasami, který líně odpočívá pod kořeny u kalné tůně.",
        category: "quest_lair",
        w: 84, h: 62, clearance: 38,
        img: "assets/decorations/swamp_troll.webp",
        canFlip: true
    },

    swamp_hydra: {
        id: "swamp_hydra",
        name: "Pětihlavá bažinná hydra",
        icon: "🐍",
        desc: "Děsivá pětihlavá ještěří hydra vynořující se z hlubin močálu a chrlící jedovatou mlhu.",
        category: "quest_lair",
        w: 84, h: 56, clearance: 38,
        img: "assets/decorations/swamp_hydra.webp",
        canFlip: true
    }
};

// Doplnění sjednocených parametrů umístění (biomes, layer, anchorY, roadPolicy, maxPerMap, overlapGroup, weight)
// a vizuálního zapuštění (footFade, shadowLen) pro všech 49 dekorací
(function () {
    "use strict";
    var cat = window.PRS_DECOR_CATALOG;
    if (!cat) return;

    var VALID_BIOMES = ["forest", "meadow", "farmland", "rocky", "wetland"];

    var categoryDefaults = {
        water:        { footFade: 0.14, shadowLen: 0.20, layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 2,    overlapGroup: "exclusive", weight: 1.0, biomes: ["wetland", "meadow"] },
        agriculture:  { footFade: 0.20, shadowLen: 0.50, layer: "standing", anchorY: 0.36, roadPolicy: "avoid",    maxPerMap: 4,    overlapGroup: "exclusive", weight: 1.0, biomes: ["farmland", "meadow"] },
        settlement:   { footFade: 0.24, shadowLen: 1.05, layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0, biomes: ["farmland", "meadow", "forest"] },
        civilization: { footFade: 0.24, shadowLen: 1.05, layer: "standing", anchorY: 0.44, roadPolicy: "avoid",    maxPerMap: 2,    overlapGroup: "exclusive", weight: 1.0, biomes: ["rocky", "meadow", "farmland"] },
        quest_lair:   { footFade: 0.24, shadowLen: 1.05, layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0, biomes: ["rocky", "forest"] },
        vegetation:   { footFade: 0.26, shadowLen: 0.95, layer: "standing", anchorY: 0.44, roadPolicy: "edge",     maxPerMap: null, overlapGroup: "canopy",    weight: 1.0, biomes: ["forest", "meadow"] },
        terrain:      { footFade: 0.26, shadowLen: 0.95, layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: null, overlapGroup: "ridge",     weight: 1.0, biomes: ["rocky", "forest", "meadow"] },
        magic:        { footFade: 0.26, shadowLen: 0.95, layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0, biomes: ["forest", "meadow"] }
    };

    var placementOverrides = {
        // 1. Stromy a porosty
        tree_oak:             { biomes: ["forest", "meadow"],            layer: "standing", anchorY: 0.45, roadPolicy: "edge",     maxPerMap: null, overlapGroup: "canopy",    weight: 1.2 },
        tree_pine:            { biomes: ["forest", "rocky"],             layer: "standing", anchorY: 0.45, roadPolicy: "edge",     maxPerMap: null, overlapGroup: "canopy",    weight: 1.2 },
        tree_birch:           { biomes: ["forest", "meadow", "wetland"], layer: "standing", anchorY: 0.45, roadPolicy: "edge",     maxPerMap: null, overlapGroup: "canopy",    weight: 1.0 },
        grove_oak:            { biomes: ["forest", "meadow"],            layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: null, overlapGroup: "canopy",    weight: 1.0 },
        grove_pine:           { biomes: ["forest", "rocky"],             layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: null, overlapGroup: "canopy",    weight: 1.0 },
        grove_pine2:          { biomes: ["forest", "rocky"],             layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: null, overlapGroup: "canopy",    weight: 0.9 },
        bush:                 { biomes: ["forest", "meadow", "wetland"], layer: "standing", anchorY: 0.35, roadPolicy: "edge",     maxPerMap: null, overlapGroup: "canopy",    weight: 1.0 },
        orchad_apple:         { biomes: ["farmland", "meadow"],          layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 3,    overlapGroup: "canopy",    weight: 1.0 },
        hruskovy_sad:         { biomes: ["farmland", "meadow"],          layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 3,    overlapGroup: "canopy",    weight: 1.0 },
        orchad_plum:          { biomes: ["farmland", "meadow"],          layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 3,    overlapGroup: "canopy",    weight: 1.0 },
        dryad_sacred_oak:     { biomes: ["forest", "meadow"],            layer: "standing", anchorY: 0.45, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        forest_ent:           { biomes: ["forest", "meadow"],            layer: "standing", anchorY: 0.44, roadPolicy: "overhang", maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        unicorn_grove:        { biomes: ["forest", "meadow"],            layer: "standing", anchorY: 0.42, roadPolicy: "overhang", maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },

        // 2. Skály a ruiny
        rock_boulder:         { biomes: ["rocky", "forest", "meadow"],   layer: "standing", anchorY: 0.35, roadPolicy: "avoid",    maxPerMap: null, overlapGroup: "ridge",     weight: 1.0 },
        mountain_peaks:       { biomes: ["rocky"],                       layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: null, overlapGroup: "ridge",     weight: 1.0 },
        ancient_ruins:        { biomes: ["rocky", "forest", "meadow"],   layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        ancient_tower_ruin:   { biomes: ["rocky", "forest", "meadow"],   layer: "standing", anchorY: 0.45, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },

        // 3. Zemědělství a osady
        farm_field:           { biomes: ["farmland", "meadow"],          layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 5,    overlapGroup: "exclusive", weight: 1.0 },
        pasture_fence:        { biomes: ["farmland", "meadow"],          layer: "standing", anchorY: 0.35, roadPolicy: "edge",     maxPerMap: 4,    overlapGroup: "exclusive", weight: 1.0 },
        windmill:             { biomes: ["farmland", "meadow"],          layer: "standing", anchorY: 0.45, roadPolicy: "avoid",    maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0 },
        watermill:            { biomes: ["wetland", "farmland", "meadow"], layer: "standing", anchorY: 0.44, roadPolicy: "avoid",  maxPerMap: 2,    overlapGroup: "exclusive", weight: 1.0 },
        cottage_timber:       { biomes: ["farmland", "meadow", "forest"], layer: "standing", anchorY: 0.42, roadPolicy: "avoid",   maxPerMap: 4,    overlapGroup: "exclusive", weight: 1.0 },
        village_well:         { biomes: ["farmland", "meadow", "forest"], layer: "standing", anchorY: 0.40, roadPolicy: "edge",    maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0 },
        merchant_wagon:       { biomes: ["farmland", "meadow", "forest"], layer: "standing", anchorY: 0.38, roadPolicy: "edge",    maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0 },
        tournament_tent:      { biomes: ["farmland", "meadow", "forest"], layer: "standing", anchorY: 0.42, roadPolicy: "edge",    maxPerMap: 2,    overlapGroup: "exclusive", weight: 1.0 },
        signpost:             { biomes: ["farmland", "meadow", "forest"], layer: "standing", anchorY: 0.45, roadPolicy: "edge",    maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0 },
        signpost2:            { biomes: ["farmland", "meadow", "forest"], layer: "standing", anchorY: 0.45, roadPolicy: "edge",    maxPerMap: 2,    overlapGroup: "exclusive", weight: 1.0 },
        hrad:                 { biomes: ["rocky", "meadow", "farmland"],  layer: "standing", anchorY: 0.44, roadPolicy: "avoid",   maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        wooden_watchtower:    { biomes: ["rocky", "meadow", "farmland"],  layer: "standing", anchorY: 0.45, roadPolicy: "avoid",   maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0 },
        ancient_graveyard:    { biomes: ["forest", "meadow", "rocky"],   layer: "standing", anchorY: 0.38, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        witch_hut:            { biomes: ["forest", "wetland"],           layer: "standing", anchorY: 0.44, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },

        // 4. Voda (vrstva "ground" vždy pod stojícími objekty)
        lake_pond:            { biomes: ["wetland", "meadow"],           layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 3,    overlapGroup: "exclusive", weight: 1.0 },
        lake_nymphs:          { biomes: ["wetland", "meadow"],           layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        vodnik_pond:          { biomes: ["wetland", "forest"],           layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        pegasus_pond:         { biomes: ["wetland", "meadow"],           layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        swamp_bridge:         { biomes: ["wetland", "forest"],           layer: "ground",   anchorY: 0.15, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },

        // 5. Magie a unikátní bytosti
        fairy_ring_mushrooms: { biomes: ["forest", "meadow"],            layer: "ground",   anchorY: 0.18, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        druid_monoliths:      { biomes: ["forest", "meadow", "rocky"],   layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        crystal_golem:        { biomes: ["rocky"],                       layer: "standing", anchorY: 0.44, roadPolicy: "overhang", maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        phoenix_nest:         { biomes: ["rocky"],                       layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },

        // 6. Questová doupata
        cave_bear_den:        { biomes: ["rocky", "forest"],             layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        bandit_cave:          { biomes: ["rocky", "forest"],             layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        basilisk_cave:        { biomes: ["rocky", "forest"],             layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        griffin_nest:         { biomes: ["rocky"],                       layer: "standing", anchorY: 0.44, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        fire_salamander:      { biomes: ["rocky"],                       layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        dragon_cave:          { biomes: ["rocky"],                       layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        snow_troll_cave:      { biomes: ["rocky"],                       layer: "standing", anchorY: 0.40, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        swamp_troll:          { biomes: ["wetland", "forest"],           layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 },
        swamp_hydra:          { biomes: ["wetland", "forest"],           layer: "standing", anchorY: 0.42, roadPolicy: "avoid",    maxPerMap: 1,    overlapGroup: "exclusive", weight: 1.0 }
    };

    var shadowOverrides = {
        windmill: 1.35,
        wooden_watchtower: 1.35,
        ancient_tower_ruin: 1.30,
        mountain_peaks: 1.25,
        tree_pine: 1.20,
        tree_birch: 1.15,
        tree_oak: 1.10,
        grove_pine: 1.10,
        grove_pine2: 1.10,
        grove_oak: 1.00,
        cottage_timber: 1.05,
        orchad_apple: 0.90,
        hruskovy_sad: 0.90,
        orchad_plum: 0.90,
        rock_boulder: 0.70,
        bush: 0.60,
        farm_field: 0.35
    };

    var footFadeOverrides = {
        tree_oak: 0,
        tree_pine: 0,
        tree_birch: 0,
        grove_oak: 0,
        grove_pine: 0,
        grove_pine2: 0,
        bush: 0,
        rock_boulder: 0,
        mountain_peaks: 0,
        farm_field: 0,
        windmill: 0,
        cottage_timber: 0,
        orchad_apple: 0,
        hruskovy_sad: 0,
        orchad_plum: 0,
        // Etapa 5 — Vlna A
        fairy_ring_mushrooms: 0,
        druid_monoliths: 0,
        watermill: 0,
        wooden_watchtower: 0,
        witch_hut: 0,
        tournament_tent: 0,
        ancient_ruins: 0,
        lake_pond: 0,
        merchant_wagon: 0,
        unicorn_grove: 0,
        village_well: 0,
        pasture_fence: 0,
        // Etapa 5 — Vlny B a C (všech 49 dekorací s footFade: 0)
        ancient_tower_ruin: 0,
        hrad: 0,
        ancient_graveyard: 0,
        swamp_bridge: 0,
        lake_nymphs: 0,
        vodnik_pond: 0,
        pegasus_pond: 0,
        dryad_sacred_oak: 0,
        forest_ent: 0,
        crystal_golem: 0,
        phoenix_nest: 0,
        cave_bear_den: 0,
        bandit_cave: 0,
        griffin_nest: 0,
        fire_salamander: 0,
        dragon_cave: 0,
        basilisk_cave: 0,
        snow_troll_cave: 0,
        swamp_troll: 0,
        swamp_hydra: 0,
        signpost: 0,
        signpost2: 0
    };

    var keys = Object.keys(cat);
    for (var i = 0; i < keys.length; i++) {
        var id = keys[i];
        var item = cat[id];
        if (!item) continue;
        var def = categoryDefaults[item.category] || categoryDefaults.vegetation;
        var ov = placementOverrides[id] || {};

        if (typeof item.footFade !== "number") {
            item.footFade = (typeof footFadeOverrides[id] === "number") ? footFadeOverrides[id] : def.footFade;
        }
        if (typeof item.shadowLen !== "number") {
            item.shadowLen = (typeof shadowOverrides[id] === "number") ? shadowOverrides[id] : def.shadowLen;
        }
        if (!Array.isArray(item.biomes) || item.biomes.length === 0) {
            var bSrc = Array.isArray(ov.biomes) ? ov.biomes : (def.biomes || VALID_BIOMES);
            item.biomes = bSrc.slice();
        }
        if (item.layer !== "ground" && item.layer !== "standing") {
            item.layer = ov.layer || def.layer || "standing";
        }
        if (typeof item.anchorY !== "number") {
            item.anchorY = (typeof ov.anchorY === "number") ? ov.anchorY : (typeof def.anchorY === "number" ? def.anchorY : 0.42);
        }
        if (item.roadPolicy !== "avoid" && item.roadPolicy !== "edge" && item.roadPolicy !== "overhang") {
            item.roadPolicy = ov.roadPolicy || def.roadPolicy || "avoid";
        }
        if (item.maxPerMap === undefined) {
            item.maxPerMap = (ov.maxPerMap !== undefined) ? ov.maxPerMap : (def.maxPerMap !== undefined ? def.maxPerMap : null);
        }
        if (item.overlapGroup !== "canopy" && item.overlapGroup !== "ridge" && item.overlapGroup !== "exclusive") {
            item.overlapGroup = ov.overlapGroup || def.overlapGroup || "exclusive";
        }
        if (typeof item.weight !== "number" || item.weight <= 0) {
            item.weight = (typeof ov.weight === "number" && ov.weight > 0) ? ov.weight : (def.weight || 1.0);
        }
    }

    window.PRS_DECOR_SCHEMA_DEFAULTS = {
        validBiomes: VALID_BIOMES.slice(),
        categoryDefaults: categoryDefaults
    };

    window.PRS_getDecorSortMetrics = function (dec, catMap) {
        var c = (catMap && dec && dec.catalogId) ? catMap[dec.catalogId] : null;
        var layerName = (dec && (dec.layer === "ground" || dec.layer === "standing"))
            ? dec.layer
            : ((c && c.layer) || "standing");
        var layerRank = (layerName === "ground") ? 0 : 1;
        var anchorY = (c && typeof c.anchorY === "number") ? c.anchorY : (layerRank === 0 ? 0.15 : 0.42);
        var hVal = (dec && typeof dec.h === "number") ? dec.h : ((c && c.h) || 60);
        var yVal = (dec && typeof dec.y === "number") ? dec.y : 0;
        var footY = (dec && typeof dec.footY === "number") ? dec.footY : (yVal + hVal * anchorY);
        return { layerRank: layerRank, footY: footY };
    };
})();
