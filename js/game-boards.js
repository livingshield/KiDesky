// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Herní plány, Generátor mapy a Katalog dekorací
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
        img: "assets/decorations/tree_oak.png",
        imgFlip: "assets/decorations/tree_oak_flip.png",
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
        img: "assets/decorations/tree_pine.png",
        imgFlip: "assets/decorations/tree_pine_flip.png",
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
        img: "assets/decorations/tree_birch.png?v=202611021708",
        imgFlip: "assets/decorations/tree_birch_flip.png?v=202611021708",
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
        img: "assets/decorations/grove_oak.png",
        imgFlip: "assets/decorations/grove_oak_flip.png",
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
        img: "assets/decorations/grove_pine.png",
        imgFlip: "assets/decorations/grove_pine_flip.png",
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
        img: "assets/decorations/rock_boulder.png",
        imgFlip: "assets/decorations/rock_boulder_flip.png",
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
        img: "assets/decorations/mountain_peaks.png",
        imgFlip: "assets/decorations/mountain_peaks_flip.png",
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
        img: "assets/decorations/farm_field.png",
        imgFlip: "assets/decorations/farm_field_flip.png",
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
        img: "assets/decorations/pasture_fence.png",
        imgFlip: "assets/decorations/pasture_fence_flip.png",
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
        img: "assets/decorations/windmill.png",
        imgFlip: "assets/decorations/windmill_flip.png",
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
        img: "assets/decorations/cottage_timber.png",
        imgFlip: "assets/decorations/cottage_timber_flip.png",
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
        img: "assets/decorations/village_well.png",
        imgFlip: "assets/decorations/village_well_flip.png",
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
        img: "assets/decorations/merchant_wagon.png",
        imgFlip: "assets/decorations/merchant_wagon_flip.png",
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
        img: "assets/decorations/tournament_tent.png",
        imgFlip: "assets/decorations/tournament_tent_flip.png",
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
        img: "assets/decorations/signpost.png",
        imgFlip: "assets/decorations/signpost_flip.png",
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
        img: "assets/decorations/lake_pond.png",
        imgFlip: "assets/decorations/lake_pond_flip.png",
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
        img: "assets/decorations/orchad_apple.png",
        imgFlip: "assets/decorations/orchad_apple_flip.png"
    },
    hruskovy_sad: {
        id: "hruskovy_sad",
        name: "Hruškový sad",
        icon: "🍐",
        desc: "Slunný ovocný sad se šťavnatými žlutými hruškami na mírných pahorcích královského panství.",
        category: "vegetation",
        w: 96, h: 76, clearance: 44,
        img: "assets/decorations/hruskovy_sad.png",
        imgFlip: "assets/decorations/hruskovy_sad_flip.png"
    },
    orchad_plum: {
        id: "orchad_plum",
        name: "Švestkový sad",
        icon: "🫐",
        desc: "Sad starých švestkových stromů s modrými plody, ze kterých vesničané vaří vyhlášená povidla.",
        category: "vegetation",
        w: 96, h: 76, clearance: 44,
        img: "assets/decorations/orchad_plum.png",
        imgFlip: "assets/decorations/orchad_plum_flip.png"
    },
    bush: {
        id: "bush",
        name: "Hustý keř",
        icon: "🌿",
        desc: "Hustý kvetoucí keř oživující okraje cest a poskytující bezpečný úkryt pro drobnou lesní zvěř.",
        category: "vegetation",
        w: 48, h: 42, clearance: 22,
        img: "assets/decorations/bush.png",
        imgFlip: "assets/decorations/bush_flip.png"
    },
    signpost2: {
        id: "signpost2",
        name: "Kamenný rozcestník",
        icon: "🗿",
        desc: "Otesaný kamenný rozcestník s vyrytými rodovými erby a směry na křižovatkách horských cest.",
        category: "settlement",
        w: 44, h: 54, clearance: 20,
        img: "assets/decorations/signpost2.png",
        imgFlip: "assets/decorations/signpost2_flip.png"
    },
    grove_pine2: {
        id: "grove_pine2",
        name: "Hluboký borový hvozd",
        icon: "🌲",
        desc: "Hluboký a neprostupný borový hvozd, v jehož větvích se ozývá tajemné houkání sov a šumění větru.",
        category: "vegetation",
        w: 92, h: 80, clearance: 42,
        img: "assets/decorations/grove_pine2.png",
        imgFlip: "assets/decorations/grove_pine2_flip.png"
    },
    hrad: {
        id: "hrad",
        name: "Strážní hrad",
        icon: "🏰",
        desc: "Kamenný strážní hrádek s cimbuřím a střílnami, střežící zemské hranice před nájezdy banditů.",
        category: "civilization",
        w: 80, h: 80, clearance: 40,
        img: "assets/decorations/hrad.png",
        imgFlip: "assets/decorations/hrad_flip.png"
    },
    // --- 6. Vodní toky a mosty ---
    watermill: {
        id: "watermill",
        name: "Vodní mlýn s náhonem",
        icon: "⚙️",
        desc: "Klapající roubený vodní mlýn s proudem vody stékajícím po lopatkách velkého dřevěného kola na zurčícím potoce.",
        category: "agriculture",
        w: 78, h: 84, clearance: 38,
        img: "assets/decorations/watermill.png",
        imgFlip: "assets/decorations/watermill_flip.png"
    },
    swamp_bridge: {
        id: "swamp_bridge",
        name: "Dřevěná lávka přes močál",
        icon: "🌉",
        desc: "Dřevěná lávka klenoucí se přes zrádný močál mezi orobincem, lekníny a tančícími bludičkami.",
        category: "water",
        w: 84, h: 57, clearance: 38,
        img: "assets/decorations/swamp_bridge.png",
        imgFlip: "assets/decorations/swamp_bridge_flip.png"
    },
    lake_nymphs: {
        id: "lake_nymphs",
        name: "Jezerní rusalky na molu",
        icon: "🧜‍♀️",
        desc: "Tajemné jezerní rusalky a vodní víly odpočívající na dřevěném molu uprostřed leknínů, lákající pocestné svým líbezným zpěvem.",
        category: "water",
        w: 88, h: 52, clearance: 38,
        img: "assets/decorations/lake_nymphs.png",
        imgFlip: "assets/decorations/lake_nymphs_flip.png"
    },
    vodnik_pond: {
        id: "vodnik_pond",
        name: "Vodník u tůně",
        icon: "🐸",
        desc: "Zelený hastrman bafající z dýmky na vyvrácené vrbě nad temnou tůní, schovávající hrníčky s dušičkami a chytající ryby do sítě.",
        category: "water",
        w: 88, h: 53, clearance: 38,
        img: "assets/decorations/vodnik_pond.png",
        imgFlip: "assets/decorations/vodnik_pond_flip.png"
    },
    // --- 7. Strážní objekty a tajemná obydlí ---
    wooden_watchtower: {
        id: "wooden_watchtower",
        name: "Dřevěná strážní věž",
        icon: "🗼",
        desc: "Vysoká dřevěná trámová pozorovatelna s žebříkem a pochodní, odkud královské hlídky střeží obchodní stezky a hranice panství.",
        category: "civilization",
        w: 66, h: 84, clearance: 36,
        img: "assets/decorations/wooden_watchtower.png",
        imgFlip: "assets/decorations/wooden_watchtower_flip.png"
    },
    ancient_tower_ruin: {
        id: "ancient_tower_ruin",
        name: "Zřícenina kamenné věže",
        icon: "🏰",
        desc: "Opuštěná kamenná věž obrostlá břečťanem a mohutnými kořeny prastarého stromu, střežící tajemství dávných dynastií.",
        category: "civilization",
        w: 64, h: 84, clearance: 36,
        img: "assets/decorations/ancient_tower_ruin.png",
        imgFlip: "assets/decorations/ancient_tower_ruin_flip.png"
    },
    witch_hut: {
        id: "witch_hut",
        name: "Perníková chaloupka ježibaby",
        icon: "🧙‍♀️",
        desc: "Perníková chaloupka s cukrovou polevou a křivým komínem, ze kterého stoupá fialový kouř od bublajícího čarodějného lektvaru.",
        category: "settlement",
        w: 74, h: 84, clearance: 38,
        img: "assets/decorations/witch_hut.png",
        imgFlip: "assets/decorations/witch_hut_flip.png"
    },
    // --- 8. Magická místa, ruiny a posvátné bytosti ---
    fairy_ring_mushrooms: {
        id: "fairy_ring_mushrooms",
        name: "Vílí houbový kruh",
        icon: "🍄",
        desc: "Magický kruh světélkujících hub na lesní mýtině se třpytivým vílím prachem, kde za svitu měsíce tančí lesní víly a bludičky.",
        category: "magic",
        w: 84, h: 67, clearance: 36,
        img: "assets/decorations/fairy_ring_mushrooms.png",
        imgFlip: "assets/decorations/fairy_ring_mushrooms_flip.png"
    },
    druid_monoliths: {
        id: "druid_monoliths",
        name: "Druidské menhiry a megalit",
        icon: "🪨",
        desc: "Kruh starobylých mechem obrostlých menhirů s vyrytými zářícími runami a kamenným oltářem, které pulzují zemskou magií.",
        category: "magic",
        w: 84, h: 72, clearance: 38,
        img: "assets/decorations/druid_monoliths.png",
        imgFlip: "assets/decorations/druid_monoliths_flip.png"
    },
    crystal_golem: {
        id: "crystal_golem",
        name: "Krystalový golem",
        icon: "💎",
        desc: "Monumentální kamenný golem protkaný zářícími magickými krystaly a runovými žilami, probuzený ze staletého spánku v hlubinách země.",
        category: "magic",
        w: 79, h: 84, clearance: 38,
        img: "assets/decorations/crystal_golem.png",
        imgFlip: "assets/decorations/crystal_golem_flip.png"
    },
    phoenix_nest: {
        id: "phoenix_nest",
        name: "Hnízdo ohnivého Fénixe",
        icon: "🔥",
        desc: "Starobylý kamenný pilíř s hnízdem plným žhnoucího popela a magických vajec, v němž plane vznešený ohnivý pták Fénix.",
        category: "magic",
        w: 82, h: 84, clearance: 38,
        img: "assets/decorations/phoenix_nest.png",
        imgFlip: "assets/decorations/phoenix_nest_flip.png"
    },
    ancient_ruins: {
        id: "ancient_ruins",
        name: "Zarostlé kamenné zříceniny",
        icon: "🏛️",
        desc: "Zarostlé kamenné zříceniny s gotickým obloukem, rozpadlými zdmi a polozakopanou truhlou, skrývající dávno zapomenuté poklady.",
        category: "terrain",
        w: 84, h: 79, clearance: 38,
        img: "assets/decorations/ancient_ruins.png",
        imgFlip: "assets/decorations/ancient_ruins_flip.png"
    },
    ancient_graveyard: {
        id: "ancient_graveyard",
        name: "Tajemný starý hřbitov",
        icon: "🪦",
        desc: "Starobylý tajemný hřbitov s kamennou zídkou, náhrobky a uschlým stromem opředený rytířskými legendami.",
        category: "settlement",
        w: 84, h: 60, clearance: 38,
        img: "assets/decorations/ancient_graveyard.png",
        imgFlip: "assets/decorations/ancient_graveyard_flip.png"
    },
    dryad_sacred_oak: {
        id: "dryad_sacred_oak",
        name: "Posvátný dub s lesní dryádou",
        icon: "🧚‍♀️",
        desc: "Posvátný dub prastarých věků, z jehož kmene vystupuje ochranitelská lesní dryáda obklopená světélky.",
        category: "vegetation",
        w: 65, h: 84, clearance: 36,
        img: "assets/decorations/dryad_sacred_oak.png",
        imgFlip: "assets/decorations/dryad_sacred_oak_flip.png"
    },
    forest_ent: {
        id: "forest_ent",
        name: "Prastarý lesní ent",
        icon: "🌲",
        desc: "Probuzený strážce hvozdu v podobě obřího oživlého stromu s parožím a mechovým vousem, chránící posvátné lesy království.",
        category: "vegetation",
        w: 66, h: 84, clearance: 36,
        img: "assets/decorations/forest_ent.png",
        imgFlip: "assets/decorations/forest_ent_flip.png"
    },
    unicorn_grove: {
        id: "unicorn_grove",
        name: "Kouzelný háj s jednorožcem",
        icon: "🦄",
        desc: "Stříbřitá mýtina v hlubokém hvozdu, kde se prochází bájný bílý jednorožec se zlatou hřívou.",
        category: "vegetation",
        w: 84, h: 75, clearance: 38,
        img: "assets/decorations/unicorn_grove.png",
        imgFlip: "assets/decorations/unicorn_grove_flip.png"
    },
    pegasus_pond: {
        id: "pegasus_pond",
        name: "Pegas u lesní studánky",
        icon: "🪽",
        desc: "Kouzelná lesní studánka, k níž slétá pít sněhobílý okřídlený Pegas s rozpjatými křídly.",
        category: "water",
        w: 84, h: 62, clearance: 38,
        img: "assets/decorations/pegasus_pond.png",
        imgFlip: "assets/decorations/pegasus_pond_flip.png"
    },
    // --- 9. Doupata a nebezpečné nestvůry ---
    cave_bear_den: {
        id: "cave_bear_den",
        name: "Medvědí jeskyně",
        icon: "🐻",
        desc: "Skalní jeskyně plná kostí a trofejí, sloužící jako brloh obrovského divokého medvěda střežícího vstup do jeskyně.",
        category: "quest_lair",
        w: 84, h: 84, clearance: 38,
        img: "assets/decorations/cave_bear_den.png",
        imgFlip: "assets/decorations/cave_bear_den_flip.png"
    },
    bandit_cave: {
        id: "bandit_cave",
        name: "Loupežnická jeskyně s pokladem",
        icon: "💰",
        desc: "Loupežnické doupě osvětlené plápolajícími pochodněmi, plné otevřených truhel se zlaťáky, drahokamy a zcizenými cennostmi.",
        category: "quest_lair",
        w: 84, h: 82, clearance: 38,
        img: "assets/decorations/bandit_cave.png",
        imgFlip: "assets/decorations/bandit_cave_flip.png"
    },
    griffin_nest: {
        id: "griffin_nest",
        name: "Hnízdo skalního gryfa",
        icon: "🦅",
        desc: "Vysoký skalní masiv s obřím hnízdem z větví a kostí, kde na vejcích sedí hrdý skalní gryf střežící blýskavé poklady.",
        category: "quest_lair",
        w: 64, h: 84, clearance: 38,
        img: "assets/decorations/griffin_nest.png",
        imgFlip: "assets/decorations/griffin_nest_flip.png"
    },
    fire_salamander: {
        id: "fire_salamander",
        name: "Ohnivý salamandr",
        icon: "🦎",
        desc: "Mystický lávový salamandr vyhřívající se na žhnoucích balvanech u ohořelého stromu, chrlící drobné plaménky a jiskry.",
        category: "quest_lair",
        w: 80, h: 84, clearance: 38,
        img: "assets/decorations/fire_salamander.png",
        imgFlip: "assets/decorations/fire_salamander_flip.png"
    },
    dragon_cave: {
        id: "dragon_cave",
        name: "Spící drak ve sluji",
        icon: "🐉",
        desc: "Monumentální skalní jeskyně, v jejímž nitru tvrdě spí červený drak svinutý na obrovské hromadě zlaťáků, pohárů a zbraní padlých rytířů.",
        category: "quest_lair",
        w: 88, h: 61, clearance: 38,
        img: "assets/decorations/dragon_cave.png",
        imgFlip: "assets/decorations/dragon_cave_flip.png"
    },
    basilisk_cave: {
        id: "basilisk_cave",
        name: "Jeskyně baziliška",
        icon: "🦎",
        desc: "Zlověstná skalní rozsedlina plná zkamenělých těl dobrodruhů, střežená smrtícím ještěřím baziliškem.",
        category: "quest_lair",
        w: 84, h: 57, clearance: 38,
        img: "assets/decorations/basilisk_cave.png",
        imgFlip: "assets/decorations/basilisk_cave_flip.png"
    },
    snow_troll_cave: {
        id: "snow_troll_cave",
        name: "Ledová jeskyně sněžného trolla",
        icon: "❄️",
        desc: "Mrazivá ledová jeskyně s obřími rampouchy, kde se v závějích ukrývá mocný sněžný troll s kyjem.",
        category: "quest_lair",
        w: 84, h: 56, clearance: 38,
        img: "assets/decorations/snow_troll_cave.png",
        imgFlip: "assets/decorations/snow_troll_cave_flip.png"
    },
    swamp_troll: {
        id: "swamp_troll",
        name: "Bažinný troll u tůně",
        icon: "🧌",
        desc: "Zavalitý bažinný troll porostlý řasami, který líně odpočívá pod kořeny u kalné tůně.",
        category: "quest_lair",
        w: 84, h: 62, clearance: 38,
        img: "assets/decorations/swamp_troll.png",
        imgFlip: "assets/decorations/swamp_troll_flip.png"
    },
    swamp_hydra: {
        id: "swamp_hydra",
        name: "Pětihlavá bažinná hydra",
        icon: "🐍",
        desc: "Děsivá pětihlavá ještěří hydra vynořující se z hlubin močálu a chrlící jedovatou mlhu.",
        category: "quest_lair",
        w: 84, h: 56, clearance: 38,
        img: "assets/decorations/swamp_hydra.png",
        imgFlip: "assets/decorations/swamp_hydra_flip.png"
    }
};

// ============================================================================
// 10 TEMATICKÝCH IZOMETRICKÝCH ZÁMKŮ (Královská a rodová sídla)
// ============================================================================


// ============================================================================
// DYNAMICKÝ GENERÁTOR MAPY A BIOMŮ (KiDeskyMapGenerator)
// Plnohodnotná procedurální syntéza topologie grafu, cest, biomů a terénu
// ============================================================================

window.KiDeskyMapGenerator = {
    // Výchozí recept pro Vlastní dynamický plán (Klasická vyvážená hra)
    DEFAULT_RECIPE: {
        animalLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        villages: 10,
        towns: 5,
        castles: 3,
        jesters: 4,
        buildings: 5,
        questsU1: 4,
        questsU2: 3,
        questsU3: 2,
        masters: 7,
        merchants: 3,
        festivals: 3,
        chances: 6,
        taxes: 2,
        prisons: 1,
        hospitals: 1,
        taverns: 1,
        branches: 3,
        masterTier: 5,
        riverMode: "single",
        biomeTheme: "balanced",
        royalCastle: "auto",
        routeShape: "auto",
        seed: 4598,
        customName: ""
    },

    // 5 Přednastavených královských šablon map (Presety Map Studia s přesným receptem polí)
    PRESETS: {
        royal_balance: {
            id: "royal_balance",
            name: "👑 Královská rovnováha",
            desc: "Vyvážený plán s 3 větvemi, 8 chovnými sadami (levely 1–8) a bohatou ekonomií.",
            nodeCount: 75,
            branches: 3,
            masterTier: 5,
            animalSetCount: 8,
            riverMode: "single",
            dangerLevel: "standard",
            biomeTheme: "balanced",
            routeShape: "auto",
            recipe: {
                animalLevels: [1, 2, 3, 4, 5, 6, 7, 8],
                villages: 8, towns: 4, castles: 2, jesters: 3, buildings: 5,
                questsU1: 4, questsU2: 3, questsU3: 2, masters: 6, merchants: 3,
                festivals: 3, chances: 5, taxes: 2, prisons: 1, hospitals: 1, taverns: 1,
                branches: 3, masterTier: 5, riverMode: "single", biomeTheme: "balanced", routeShape: "auto"
            }
        },
        dragon_chasm: {
            id: "dragon_chasm",
            name: "🐉 Dračí soutěska",
            desc: "Drsné sopečné podhůří, 4 dračí sluje, 5 monster, 3 hrady a dvojitý říční soutok.",
            nodeCount: 84,
            branches: 2,
            masterTier: 3,
            animalSetCount: 8,
            riverMode: "dual",
            dangerLevel: "high",
            biomeTheme: "dragon_peaks",
            routeShape: "twin_valleys",
            recipe: {
                animalLevels: [1, 2, 4, 6, 8, 10, 12, 14],
                villages: 7, towns: 4, castles: 3, jesters: 3, buildings: 5,
                questsU1: 4, questsU2: 5, questsU3: 4, masters: 7, merchants: 3,
                festivals: 3, chances: 6, taxes: 2, prisons: 1, hospitals: 2, taverns: 1,
                branches: 2, masterTier: 3, riverMode: "dual", biomeTheme: "dragon_peaks", routeShape: "twin_valleys"
            }
        },
        lightning_sprint: {
            id: "lightning_sprint",
            name: "⚡ Bleskový turnaj",
            desc: "Kompaktní 48-políčkový okruh navržený pro rychlou a dynamickou partii (30–40 min).",
            nodeCount: 48,
            branches: 1,
            masterTier: 1,
            animalSetCount: 5,
            riverMode: "single",
            dangerLevel: "low",
            biomeTheme: "golden_plains",
            routeShape: "classic_ring",
            recipe: {
                animalLevels: [1, 2, 3, 4, 5],
                villages: 5, towns: 3, castles: 2, jesters: 2, buildings: 3,
                questsU1: 2, questsU2: 2, questsU3: 2, masters: 4, merchants: 2,
                festivals: 3, chances: 3, taxes: 1, prisons: 1, hospitals: 1, taverns: 1,
                branches: 1, masterTier: 1, riverMode: "single", biomeTheme: "golden_plains"
            }
        },
        four_masters: {
            id: "four_masters",
            name: "🧙‍♂️ Turnaj čtyř mistrů",
            desc: "Velkolepý epický svět se 4 větvemi, říčním ostrovem, 10 sadami zvířat a 10 mistry.",
            nodeCount: 102,
            branches: 4,
            masterTier: 4,
            animalSetCount: 10,
            riverMode: "island",
            dangerLevel: "high",
            biomeTheme: "balanced",
            routeShape: "figure_eight",
            recipe: {
                animalLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                villages: 10, towns: 6, castles: 4, jesters: 4, buildings: 5,
                questsU1: 5, questsU2: 4, questsU3: 3, masters: 10, merchants: 4,
                festivals: 3, chances: 8, taxes: 2, prisons: 1, hospitals: 1, taverns: 1,
                branches: 4, masterTier: 4, riverMode: "island", biomeTheme: "balanced"
            }
        },
        pasture_kingdom: {
            id: "pasture_kingdom",
            name: "🌲 Ráj chovatelů (Všech 14 sad)",
            desc: "Rozlehlé lesní království zasvěcené chovu všech 14 sad zvířat (42 polí zvířat) a cechům.",
            nodeCount: 98,
            branches: 3,
            masterTier: 5,
            animalSetCount: 14,
            riverMode: "dual",
            dangerLevel: "standard",
            biomeTheme: "forest_realm",
            routeShape: "serpentine",
            recipe: {
                animalLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                villages: 9, towns: 5, castles: 3, jesters: 4, buildings: 6,
                questsU1: 3, questsU2: 2, questsU3: 2, masters: 6, merchants: 3,
                festivals: 3, chances: 5, taxes: 1, prisons: 1, hospitals: 1, taverns: 1,
                branches: 3, masterTier: 5, riverMode: "dual", biomeTheme: "forest_realm", routeShape: "serpentine"
            }
        }
    },

    // 7 Procedurálních archetypů tvaru trasy (Map Studio & WYSIWYG editor)
    ROUTE_ARCHETYPES: {
        auto: { id: "auto", name: "🎲 Podle seedu (Automatický mix)", nameEn: "🎲 By seed (Automatic mix)", desc: "Dynamický výběr tvaru trasy podle seedu mapy", descEn: "Dynamic route shape selection based on map seed", icon: "🎲" },
        organic_meander: { id: "organic_meander", name: "🌿 Organický meandr", nameEn: "🌿 Organic Meander", desc: "Plynulé přírodní vlnění krajinou s malebnými zátočinami a výběžky", descEn: "Smooth natural winding through the landscape with picturesque bays", icon: "🌿" },
        figure_eight: { id: "figure_eight", name: "♾️ Osmička (Křížený okruh)", nameEn: "♾️ Figure Eight (Cross loop)", desc: "Dva ladné okruhy protínající se uprostřed království", descEn: "Two graceful loops intersecting in the center of the kingdom", icon: "♾️" },
        spiral_citadel: { id: "spiral_citadel", name: "🌀 Spirálová citadela", nameEn: "🌀 Spiral Citadel", desc: "Vnější okruh spirálovitě obtéká vnitřní citadelu královského hradu", descEn: "Outer loop spirals around the inner royal castle citadel", icon: "🌀" },
        twin_valleys: { id: "twin_valleys", name: "🏔️ Dvojí údolí", nameEn: "🏔️ Twin Valleys", desc: "Západní a východní kotlina propojená horským hřebenem", descEn: "Western and eastern basins connected by a mountain ridge", icon: "🏔️" },
        serpentine: { id: "serpentine", name: "🐍 Hadovitá magistrála", nameEn: "🐍 Serpentine Highway", desc: "Táhlé esovité zákruty kopírující říční tok napříč celou říší", descEn: "Sweeping S-curves following the river flow across the entire realm", icon: "🐍" },
        star_crossroads: { id: "star_crossroads", name: "⭐ Hvězdicová křižovatka", nameEn: "⭐ Star Crossroads", desc: "Dynamický okruh s výběžky a radiálními průrvami", descEn: "Dynamic ring with promontories and radial gaps", icon: "⭐" },
        classic_ring: { id: "classic_ring", name: "⭕ Klasický ovál", nameEn: "⭕ Classic Oval", desc: "Tradiční obvodový prstenec po okrajích království", descEn: "Traditional perimeter ring along the edges of the realm", icon: "⭕" }
    },

    // Katalog 14 ušlechtilých chovných sad (Kůň, Sokol, Pes)
    ANIMAL_SETS_CATALOG: [
        { setId: 1, horse: "Kůň 1 (Grošák)", horseEn: "Horse 1 (Dapple Grey)", falcon: "Sokol 1 (Poštolka)", falconEn: "Falcon 1 (Kestrel)", dog: "Pes 1 (Ohař)", dogEn: "Dog 1 (Pointer)" },
        { setId: 2, horse: "Kůň 2 (Hnědák)", horseEn: "Horse 2 (Bay Horse)", falcon: "Sokol 2 (Krahujec)", falconEn: "Falcon 2 (Sparrowhawk)", dog: "Pes 2 (Bígl)", dogEn: "Dog 2 (Beagle)" },
        { setId: 3, horse: "Kůň 3 (Vraník)", horseEn: "Horse 3 (Black Steed)", falcon: "Sokol 3 (Ostříž)", falconEn: "Falcon 3 (Hobby)", dog: "Pes 3 (Chrt)", dogEn: "Dog 3 (Greyhound)" },
        { setId: 4, horse: "Kůň 4 (Ryzák)", horseEn: "Horse 4 (Chestnut)", falcon: "Sokol 4 (Raroh)", falconEn: "Falcon 4 (Saker Falcon)", dog: "Pes 4 (Barvář)", dogEn: "Dog 4 (Bloodhound)" },
        { setId: 5, horse: "Kůň 5 (Bělouš)", horseEn: "Horse 5 (White Steed)", falcon: "Sokol 5 (Královský ostříž)", falconEn: "Falcon 5 (Royal Hobby)", dog: "Pes 5 (Slídič)", dogEn: "Dog 5 (Tracker)" },
        { setId: 6, horse: "Kůň 6 (Plavák)", horseEn: "Horse 6 (Dun Horse)", falcon: "Sokol 6 (Sokol stěhovavý)", falconEn: "Falcon 6 (Peregrine Falcon)", dog: "Pes 6 (Vlkodav)", dogEn: "Dog 6 (Wolfhound)" },
        { setId: 7, horse: "Kůň 7 (Šiml)", horseEn: "Horse 7 (Grey Horse)", falcon: "Sokol 7 (Luňák)", falconEn: "Falcon 7 (Red Kite)", dog: "Pes 7 (Doga)", dogEn: "Dog 7 (Great Dane)" },
        { setId: 8, horse: "Kůň 8 (Fríský oř)", horseEn: "Horse 8 (Friesian Steed)", falcon: "Sokol 8 (Orlovec)", falconEn: "Falcon 8 (Osprey)", dog: "Pes 8 (Chrtí král)", dogEn: "Dog 8 (King Greyhound)" },
        { setId: 9, horse: "Kůň 9 (Andaluský hřebec)", horseEn: "Horse 9 (Andalusian Stallion)", falcon: "Sokol 9 (Jestřáb)", falconEn: "Falcon 9 (Goshawk)", dog: "Pes 9 (Lovecký chrt)", dogEn: "Dog 9 (Hunting Hound)" },
        { setId: 10, horse: "Kůň 10 (Válečný oř)", horseEn: "Horse 10 (Warhorse)", falcon: "Sokol 10 (Sokol královský)", falconEn: "Falcon 10 (King Falcon)", dog: "Pes 10 (Královský chrt)", dogEn: "Dog 10 (Royal Greyhound)" },
        { setId: 11, horse: "Kůň 11 (Hvězdný hřebec)", horseEn: "Horse 11 (Astral Stallion)", falcon: "Sokol 11 (Bílý raroh)", falconEn: "Falcon 11 (White Saker)", dog: "Pes 11 (Stříbrný ohař)", dogEn: "Dog 11 (Silver Hound)" },
        { setId: 12, horse: "Kůň 12 (Královský oř)", horseEn: "Horse 12 (Royal Steed)", falcon: "Sokol 12 (Fénixův sokol)", falconEn: "Falcon 12 (Phoenix Falcon)", dog: "Pes 12 (Zlatý chrt)", dogEn: "Dog 12 (Golden Greyhound)" },
        { setId: 13, horse: "Kůň 13 (Zlatý palomino)", horseEn: "Horse 13 (Golden Palomino)", falcon: "Sokol 13 (Skalní orel)", falconEn: "Falcon 13 (Golden Eagle)", dog: "Pes 13 (Severní vlkodav)", dogEn: "Dog 13 (Northern Wolfhound)" },
        { setId: 14, horse: "Kůň 14 (Stínový oř)", horseEn: "Horse 14 (Shadow Steed)", falcon: "Sokol 14 (Noční raroh)", falconEn: "Falcon 14 (Night Falcon)", dog: "Pes 14 (Hradní chrlič)", dogEn: "Dog 14 (Castle Gargoyle)" }
    ],

    // Převod textového seed kódu např. KID-78-3B-M2-A6-R1-D2-T0-X1-S4598 nebo KID-78-3B-M2-S4598 zpět na parametry
    parseSeedCode: function (code) {
        if (!code || typeof code !== "string") return null;
        var clean = code.trim().toUpperCase();

        var shapeMap = { "0": "auto", "1": "organic_meander", "2": "figure_eight", "3": "spiral_citadel", "4": "twin_valleys", "5": "serpentine", "6": "star_crossroads", "7": "classic_ring" };

        // 1. Nejnovější plný formát s tvarem trasy (-X): KID-78-3B-M2-A6-R1-D2-T0-X1-S4598
        var mShape = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-A(\d+)-R([01234])-D([123])-T([01234])-X([0-7])-S(\d+)$/);
        if (mShape) {
            var rMapS = { "0": "none", "1": "single", "2": "dual", "3": "island", "4": "delta" };
            var dMapS = { "1": "low", "2": "standard", "3": "high" };
            var tMapS = { "0": "balanced", "1": "dragon_peaks", "2": "forest_realm", "3": "river_delta", "4": "golden_plains" };
            return {
                nodeCount: parseInt(mShape[1], 10),
                branches: parseInt(mShape[2], 10),
                masterTier: parseInt(mShape[3], 10),
                animalSetCount: parseInt(mShape[4], 10),
                riverMode: rMapS[mShape[5]] || "single",
                dangerLevel: dMapS[mShape[6]] || "standard",
                biomeTheme: tMapS[mShape[7]] || "balanced",
                routeShape: shapeMap[mShape[8]] || "auto",
                seed: parseInt(mShape[9], 10),
                valid: true
            };
        }

        // 2. Rozšířený formát: KID-78-3B-M2-A6-R1-D2-T0-S4598
        var mExt = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-A(\d+)-R([01234])-D([123])-T([01234])-S(\d+)$/);
        if (mExt) {
            var rMap = { "0": "none", "1": "single", "2": "dual", "3": "island", "4": "delta" };
            var dMap = { "1": "low", "2": "standard", "3": "high" };
            var tMap = { "0": "balanced", "1": "dragon_peaks", "2": "forest_realm", "3": "river_delta", "4": "golden_plains" };
            return {
                nodeCount: parseInt(mExt[1], 10),
                branches: parseInt(mExt[2], 10),
                masterTier: parseInt(mExt[3], 10),
                animalSetCount: parseInt(mExt[4], 10),
                riverMode: rMap[mExt[5]] || "single",
                dangerLevel: dMap[mExt[6]] || "standard",
                biomeTheme: tMap[mExt[7]] || "balanced",
                routeShape: "auto",
                seed: parseInt(mExt[8], 10),
                valid: true
            };
        }

        // 3. Střední formát: KID-78-3B-M2-A6-S4598
        var mMid = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-A(\d+)-S(\d+)$/);
        if (mMid) {
            return {
                nodeCount: parseInt(mMid[1], 10),
                branches: parseInt(mMid[2], 10),
                masterTier: parseInt(mMid[3], 10),
                animalSetCount: parseInt(mMid[4], 10),
                routeShape: "auto",
                seed: parseInt(mMid[5], 10),
                valid: true
            };
        }

        // 4. Krátký zpětně kompatibilní formát: KID-78-3B-M2-S4598
        var match = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-S(\d+)$/);
        if (match) {
            return {
                nodeCount: parseInt(match[1], 10),
                branches: parseInt(match[2], 10),
                masterTier: parseInt(match[3], 10),
                routeShape: "auto",
                seed: parseInt(match[4], 10),
                valid: true
            };
        }

        var num = parseInt(clean.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > 0) {
            return { seed: num, valid: true };
        }
        return null;
    },

    // Formátování sdílitelného seed kódu
    formatSeedCode: function (seed, options) {
        options = options || {};
        var n = options.nodeCount || 78;
        var b = (options.branches !== undefined) ? options.branches : 3;
        var m = options.masterTier || 2;
        var a = options.animalSetCount || 6;
        var rCode = options.riverMode === "none" ? "0" : (options.riverMode === "dual" ? "2" : (options.riverMode === "island" ? "3" : (options.riverMode === "delta" ? "4" : "1")));
        var dCode = options.dangerLevel === "low" ? "1" : (options.dangerLevel === "high" ? "3" : "2");
        var tMap = { balanced: "0", dragon_peaks: "1", forest_realm: "2", river_delta: "3", golden_plains: "4" };
        var tCode = tMap[options.biomeTheme || "balanced"] || "0";
        var shapeRevMap = { auto: "0", organic_meander: "1", figure_eight: "2", spiral_citadel: "3", twin_valleys: "4", serpentine: "5", star_crossroads: "6", classic_ring: "7" };
        var xCode = shapeRevMap[options.routeShape || "auto"] || "0";
        var s = Math.abs(Number(seed) || 12345) % 1000000;
        return "KID-" + n + "-" + b + "B-M" + m + "-A" + a + "-R" + rCode + "-D" + dCode + "-T" + tCode + "-X" + xCode + "-S" + s;
    },

    // Rychlý SVG minináhled pro Map Studio
    renderMiniPreviewSVG: function (board, width, height) {
        width = width || 560;
        height = height || 344;
        if (!board || !board.nodes) return '<svg width="' + width + '" height="' + height + '"><rect width="100%" height="100%" fill="#140f0c"/></svg>';

        var out = [];
        out.push('<svg viewBox="0 0 1400 860" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" style="background:#140e09; border-radius:10px; box-shadow:inset 0 0 28px rgba(0,0,0,0.9); display:block;">');

        // Pergamenový podklad
        out.push('  <rect x="10" y="10" width="1380" height="840" rx="16" fill="#1d150e" stroke="#d4af37" stroke-width="2"/>');

        // Biomy
        if (board.biomes) {
            for (var bm = 0; bm < board.biomes.length; bm++) {
                var bio = board.biomes[bm];
                out.push('  <path d="' + bio.path + '" fill="' + (bio.fill || "rgba(255,255,255,0.06)") + '" opacity="0.55"/>');
            }
        }

        // Řeky
        if (board.rivers) {
            for (var r = 0; r < board.rivers.length; r++) {
                out.push('  <path d="' + board.rivers[r].path + '" stroke="#0369a1" stroke-width="22" fill="none" opacity="0.7" stroke-linecap="round"/>');
                out.push('  <path d="' + board.rivers[r].path + '" stroke="#38bdf8" stroke-width="9" fill="none" opacity="0.9" stroke-linecap="round"/>');
            }
        }

        // Cesty (rozlišené podle větví)
        var nodes = board.nodes;
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            var tgts = n.next || [];
            if (n.branchLow !== null && n.branchLow !== undefined) {
                tgts = [n.branchLow, n.branchHigh];
            }
            for (var t = 0; t < tgts.length; t++) {
                var nB = nodes[tgts[t]];
                if (!nB) continue;
                var strokeCol = "rgba(212,175,55,0.55)";
                var strokeW = 5.5;
                if (n.branchTag === "dragon" || nB.branchTag === "dragon") { strokeCol = "rgba(248,113,113,0.75)"; strokeW = 5; }
                else if (n.branchTag === "festival" || nB.branchTag === "festival") { strokeCol = "rgba(244,114,182,0.75)"; strokeW = 5; }
                else if (n.branchTag === "forest" || nB.branchTag === "forest") { strokeCol = "rgba(74,222,128,0.75)"; strokeW = 5; }
                else if (n.branchTag === "ridge" || nB.branchTag === "ridge") { strokeCol = "rgba(192,132,252,0.75)"; strokeW = 5; }
                out.push('  <line x1="' + n.x + '" y1="' + n.y + '" x2="' + nB.x + '" y2="' + nB.y + '" stroke="' + strokeCol + '" stroke-width="' + strokeW + '" stroke-linecap="round"/>');
            }
        }

        // Mosty (nad cestami!)
        if (board.bridges) {
            for (var b = 0; b < board.bridges.length; b++) {
                var br = board.bridges[b];
                out.push('  <g transform="translate(' + br.x + ',' + br.y + ') rotate(' + (br.angle || 0) + ')">');
                out.push('    <rect x="-12" y="-8" width="24" height="16" rx="4" fill="#78716c" stroke="#fbbf24" stroke-width="2"/>');
                out.push('  </g>');
            }
        }

        // Uzly jako barevné medailonky
        for (var j = 0; j < nodes.length; j++) {
            var nd = nodes[j];
            var col = "#d4af37";
            var rad = 8;
            if (nd.type === "START") { col = "#ef4444"; rad = 14; }
            else if (nd.type === "CASTLE") { col = "#a855f7"; rad = 12.5; }
            else if (nd.type === "TOWN") { col = "#3b82f6"; rad = 10.5; }
            else if (nd.type === "FESTIVAL") { col = "#ec4899"; rad = 10.5; }
            else if (nd.type === "QUEST") { col = (nd.subtype === "U3") ? "#dc2626" : (nd.subtype === "U2" ? "#f97316" : "#84cc16"); rad = (nd.subtype === "U3") ? 12.5 : 9.5; }
            else if (nd.type === "MASTER") { col = "#8b5cf6"; rad = 9.5; }
            else if (nd.type === "ANIMAL") { col = "#10b981"; rad = 7.5; }
            else if (nd.type === "VILLAGE") { col = "#a3e635"; rad = 8; }
            else if (nd.type === "JESTER") { col = "#f59e0b"; rad = 8.5; }
            else if (nd.type === "PRISON" || nd.type === "TAX") { col = "#64748b"; rad = 8.5; }

            out.push('  <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + rad + '" fill="' + col + '" stroke="#090604" stroke-width="1.6"/>');
            if (nd.isJunction) {
                out.push('  <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (rad + 3.5) + '" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="3,2"/>');
            }
        }

        // Královský hrad uprostřed
        out.push('  <circle cx="700" cy="365" r="34" fill="rgba(212,175,55,0.14)" stroke="rgba(212,175,55,0.5)" stroke-width="1.5"/>');
        out.push('  <text x="700" y="374" text-anchor="middle" font-size="28">🏰</text>');

        // Legenda v pravém horním rohu
        out.push('  <rect x="975" y="20" width="400" height="44" rx="8" fill="rgba(0,0,0,0.68)" stroke="rgba(212,175,55,0.35)" stroke-width="1"/>');
        out.push('  <text x="990" y="47" fill="#e2e8f0" font-size="13.5" font-family="sans-serif">🔴Start  🟣Hrad/Mistr  🔵Město  🟢Zvíře  🟠Úkol/Drak  🩷Slavnost</text>');

        // Název mapy v levém horním rohu
        out.push('  <rect x="24" y="20" width="540" height="58" rx="8" fill="rgba(0,0,0,0.68)" stroke="rgba(212,175,55,0.35)" stroke-width="1"/>');
        out.push('  <text x="38" y="46" fill="#fef08a" font-family="Cinzel, serif" font-size="19" font-weight="bold">' + (board.name || "Království") + '</text>');
        out.push('  <text x="38" y="67" fill="#93c5fd" font-size="13" font-family="monospace">' + (board.seedCode || board.seed) + ' • ' + nodes.length + ' polí</text>');

        out.push('</svg>');
        return out.join("\n");
    },

    // Deterministický generátor pseudonáhodných čísel (LCG)
    createRNG: function (seed) {
        var s = (Number(seed) || 12345) % 2147483647;
        if (s <= 0) s += 2147483646;
        return function () {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    },

    // Detekce křížení dvou úseček (silnice vs. řeka -> automatický most)
    lineIntersection: function (p1, p2, p3, p4) {
        var x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y;
        var x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
        var denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (Math.abs(denom) < 1e-6) return null;
        var ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        var ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0) {
            return {
                x: Math.round(x1 + ua * (x2 - x1)),
                y: Math.round(y1 + ua * (y2 - y1)),
                angle: Math.round(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI)
            };
        }
        return null;
    },

    // Vzorkování hladké kubické Bézierovy křivky
    sampleBezier: function (p0, p1, p2, p3, count, includeEnd) {
        var pts = [];
        if (count <= 0) return pts;
        if (count === 1) return [{ x: Math.round((p0.x + p3.x) / 2), y: Math.round((p0.y + p3.y) / 2) }];
        var denom = includeEnd ? Math.max(1, count - 1) : count;
        for (var i = 0; i < count; i++) {
            var t = i / denom;
            var u = 1 - t;
            var x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
            var y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
            pts.push({ x: Math.round(x), y: Math.round(y) });
        }
        return pts;
    },

    sampleRiverPathSimple: function (path) {
        if (!path) return [];
        var nums = path.match(/[-+]?\d*\.?\d+/g);
        if (!nums || nums.length < 8) return [];
        var pts = [];
        var start = { x: parseFloat(nums[0]), y: parseFloat(nums[1]) };
        var idx = 2;
        while (idx + 5 < nums.length) {
            var cp1 = { x: parseFloat(nums[idx]), y: parseFloat(nums[idx + 1]) };
            var cp2 = { x: parseFloat(nums[idx + 2]), y: parseFloat(nums[idx + 3]) };
            var end = { x: parseFloat(nums[idx + 4]), y: parseFloat(nums[idx + 5]) };
            for (var s = (idx === 2 ? 0 : 1); s <= 20; s++) {
                var t = s / 20;
                var it = 1 - t;
                var bx = it * it * it * start.x + 3 * it * it * t * cp1.x + 3 * it * t * t * cp2.x + t * t * t * end.x;
                var by = it * it * it * start.y + 3 * it * it * t * cp1.y + 3 * it * t * t * cp2.y + t * t * t * end.y;
                pts.push({ x: Math.round(bx), y: Math.round(by) });
            }
            start = end;
            idx += 6;
        }
        return pts;
    },

    // Vzorkování uzavřené Catmull-Rom spline křivky
    sampleCatmullRomLoop: function (pts, segSamples) {
        var out = [];
        if (!pts || pts.length === 0) return out;
        segSamples = segSamples || 50;
        var K = pts.length;
        for (var i = 0; i < K; i++) {
            var p0 = pts[(i - 1 + K) % K];
            var p1 = pts[i];
            var p2 = pts[(i + 1) % K];
            var p3 = pts[(i + 2) % K];
            for (var s = 0; s < segSamples; s++) {
                var t = s / segSamples;
                var t2 = t * t;
                var t3 = t2 * t;
                var x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
                var y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
                out.push({ x: x, y: y });
            }
        }
        return out;
    },

    // Ekvidistantní reparametrizace křivky podle délky oblouku (Arc-length reparameterization)
    reparameterizeByArcLength: function (curvePts, count) {
        if (!curvePts || curvePts.length === 0 || count <= 0) return [];
        var dists = [0];
        var totalLen = 0;
        for (var i = 1; i < curvePts.length; i++) {
            var dx = curvePts[i].x - curvePts[i - 1].x;
            var dy = curvePts[i].y - curvePts[i - 1].y;
            totalLen += Math.sqrt(dx * dx + dy * dy);
            dists.push(totalLen);
        }
        var dx0 = curvePts[0].x - curvePts[curvePts.length - 1].x;
        var dy0 = curvePts[0].y - curvePts[curvePts.length - 1].y;
        var loopCloseDist = Math.sqrt(dx0 * dx0 + dy0 * dy0);
        totalLen += loopCloseDist;
        dists.push(totalLen);
        var extendedCurve = curvePts.concat([curvePts[0]]);

        var step = totalLen / count;
        var outNodes = [];
        var searchIdx = 0;

        for (var n = 0; n < count; n++) {
            var targetDist = n * step;
            while (searchIdx < dists.length - 1 && dists[searchIdx + 1] < targetDist) {
                searchIdx++;
            }
            var segStartDist = dists[searchIdx];
            var segEndDist = dists[searchIdx + 1] || totalLen;
            var segSpan = segEndDist - segStartDist;
            var factor = segSpan > 0.0001 ? (targetDist - segStartDist) / segSpan : 0;
            var pA = extendedCurve[searchIdx];
            var pB = extendedCurve[searchIdx + 1] || extendedCurve[0];
            outNodes.push({
                x: Math.round(pA.x + (pB.x - pA.x) * factor),
                y: Math.round(pA.y + (pB.y - pA.y) * factor)
            });
        }
        return outNodes;
    },

    // 7 Řídících polygonů tras se seed-based mikrovariací
    getArchetypeControlPoints: function (shapeKey, rnd) {
        rnd = rnd || Math.random;
        var jx = function (scale) { return (rnd() - 0.5) * (scale || 26); };
        var jy = function (scale) { return (rnd() - 0.5) * (scale || 22); };

        switch (shapeKey) {
            case "figure_eight":
                return [
                    { x: 420 + jx(), y: 95 + jy() },
                    { x: 740 + jx(), y: 350 + jy() },
                    { x: 1080 + jx(), y: 690 + jy() },
                    { x: 1260 + jx(), y: 440 + jy() },
                    { x: 1040 + jx(), y: 110 + jy() },
                    { x: 660 + jx(), y: 490 + jy() },
                    { x: 300 + jx(), y: 730 + jy() },
                    { x: 130 + jx(), y: 430 + jy() }
                ];

            case "spiral_citadel":
                return [
                    { x: 500 + jx(), y: 85 + jy() },
                    { x: 1080 + jx(), y: 100 + jy() },
                    { x: 1280 + jx(), y: 380 + jy() },
                    { x: 1240 + jx(), y: 720 + jy() },
                    { x: 720 + jx(), y: 780 + jy() },
                    { x: 180 + jx(), y: 730 + jy() },
                    { x: 120 + jx(), y: 380 + jy() },
                    { x: 260 + jx(), y: 160 + jy() },
                    { x: 620 + jx(), y: 220 + jy() },
                    { x: 920 + jx(), y: 280 + jy() },
                    { x: 980 + jx(), y: 560 + jy() },
                    { x: 480 + jx(), y: 610 + jy() },
                    { x: 340 + jx(), y: 400 + jy() }
                ];

            case "twin_valleys":
                return [
                    { x: 700 + jx(), y: 190 + jy() },
                    { x: 1040 + jx(), y: 95 + jy() },
                    { x: 1285 + jx(), y: 340 + jy() },
                    { x: 1100 + jx(), y: 480 + jy() },
                    { x: 1260 + jx(), y: 690 + jy() },
                    { x: 960 + jx(), y: 775 + jy() },
                    { x: 700 + jx(), y: 640 + jy() },
                    { x: 440 + jx(), y: 775 + jy() },
                    { x: 140 + jx(), y: 690 + jy() },
                    { x: 300 + jx(), y: 480 + jy() },
                    { x: 115 + jx(), y: 340 + jy() },
                    { x: 360 + jx(), y: 95 + jy() }
                ];

            case "serpentine":
                return [
                    { x: 250 + jx(), y: 100 + jy() },
                    { x: 720 + jx(), y: 90 + jy() },
                    { x: 1160 + jx(), y: 110 + jy() },
                    { x: 1290 + jx(), y: 310 + jy() },
                    { x: 920 + jx(), y: 380 + jy() },
                    { x: 460 + jx(), y: 430 + jy() },
                    { x: 130 + jx(), y: 550 + jy() },
                    { x: 360 + jx(), y: 765 + jy() },
                    { x: 800 + jx(), y: 775 + jy() },
                    { x: 1250 + jx(), y: 720 + jy() },
                    { x: 1280 + jx(), y: 540 + jy() },
                    { x: 1000 + jx(), y: 220 + jy() },
                    { x: 130 + jx(), y: 280 + jy() }
                ];

            case "star_crossroads":
                return [
                    { x: 700 + jx(), y: 80 + jy() },
                    { x: 960 + jx(), y: 210 + jy() },
                    { x: 1280 + jx(), y: 190 + jy() },
                    { x: 1120 + jx(), y: 440 + jy() },
                    { x: 1280 + jx(), y: 700 + jy() },
                    { x: 950 + jx(), y: 660 + jy() },
                    { x: 700 + jx(), y: 785 + jy() },
                    { x: 450 + jx(), y: 660 + jy() },
                    { x: 120 + jx(), y: 700 + jy() },
                    { x: 280 + jx(), y: 440 + jy() },
                    { x: 120 + jx(), y: 190 + jy() },
                    { x: 440 + jx(), y: 210 + jy() }
                ];

            case "organic_meander":
                return [
                    { x: 480 + jx(), y: 80 + jy() },
                    { x: 860 + jx(), y: 105 + jy() },
                    { x: 1220 + jx(), y: 125 + jy() },
                    { x: 1290 + jx(), y: 450 + jy() },
                    { x: 1060 + jx(), y: 540 + jy() },
                    { x: 1160 + jx(), y: 745 + jy() },
                    { x: 720 + jx(), y: 775 + jy() },
                    { x: 560 + jx(), y: 590 + jy() },
                    { x: 360 + jx(), y: 760 + jy() },
                    { x: 125 + jx(), y: 670 + jy() },
                    { x: 110 + jx(), y: 310 + jy() },
                    { x: 280 + jx(), y: 340 + jy() },
                    { x: 240 + jx(), y: 115 + jy() }
                ];

            case "classic_ring":
            default:
                return [
                    { x: 500 + jx(), y: 78 + jy() },
                    { x: 860 + jx(), y: 72 + jy() },
                    { x: 1160 + jx(), y: 108 + jy() },
                    { x: 1315 + jx(), y: 380 + jy() },
                    { x: 1250 + jx(), y: 660 + jy() },
                    { x: 1050 + jx(), y: 775 + jy() },
                    { x: 680 + jx(), y: 785 + jy() },
                    { x: 320 + jx(), y: 775 + jy() },
                    { x: 115 + jx(), y: 660 + jy() },
                    { x: 90 + jx(), y: 380 + jy() },
                    { x: 160 + jx(), y: 130 + jy() },
                    { x: 300 + jx(), y: 82 + jy() }
                ];
        }
    },

    // Fyzikální relaxace a kolizní model (Force-directed relaxation)
    relaxNodePositions: function (nodes, edges, options) {
        options = options || {};
        var minClearance = options.minClearance || 55;
        var iterations = options.iterations || 45;
        var minX = (options.bounds && options.bounds.minX) || 82;
        var maxX = (options.bounds && options.bounds.maxX) || 1318;
        var minY = (options.bounds && options.bounds.minY) || 74;
        var maxY = (options.bounds && options.bounds.maxY) || 786;
        var fixedIndices = options.fixedIndices || {};

        var N = nodes.length;
        var pos = nodes.map(function (n) { return { x: n.x, y: n.y }; });

        var sumEdgeDist = 0;
        var edgeCount = 0;
        edges = edges || [];
        for (var e = 0; e < edges.length; e++) {
            var u0 = edges[e][0], v0 = edges[e][1];
            if (u0 < N && v0 < N) {
                sumEdgeDist += Math.hypot(pos[u0].x - pos[v0].x, pos[u0].y - pos[v0].y);
                edgeCount++;
            }
        }
        var targetDist = Math.max(52, options.targetDist || (edgeCount > 0 ? sumEdgeDist / edgeCount : 55));

        for (var iter = 0; iter < iterations; iter++) {
            var forces = pos.map(function () { return { fx: 0, fy: 0 }; });

            // 1. Všichni proti všem: Repulze při nedodržení minimální světlosti
            for (var i = 0; i < N; i++) {
                for (var j = i + 1; j < N; j++) {
                    var dx = pos[i].x - pos[j].x;
                    var dy = pos[i].y - pos[j].y;
                    var distSq = dx * dx + dy * dy;
                    if (distSq < minClearance * minClearance && distSq > 0.0001) {
                        var d = Math.sqrt(distSq);
                        var overlap = (minClearance - d);
                        var f = (overlap / d) * 0.75;
                        forces[i].fx += dx * f;
                        forces[i].fy += dy * f;
                        forces[j].fx -= dx * f;
                        forces[j].fy -= dy * f;
                    }
                }
            }

            // 2. Pružinové tahy podél hran cesty
            for (var ed = 0; ed < edges.length; ed++) {
                var u = edges[ed][0];
                var v = edges[ed][1];
                if (u >= N || v >= N) continue;
                var edx = pos[v].x - pos[u].x;
                var edy = pos[v].y - pos[u].y;
                var edist = Math.sqrt(edx * edx + edy * edy);
                if (edist > 0.0001) {
                    var diff = edist - targetDist;
                    var sf = (diff / edist) * 0.12;
                    forces[u].fx += edx * sf;
                    forces[u].fy += edy * sf;
                    forces[v].fx -= edx * sf;
                    forces[v].fy -= edy * sf;
                }
            }

            // Tlumení a posun
            var damping = 1.0 - (iter / iterations) * 0.35;
            for (var k = 0; k < N; k++) {
                if (fixedIndices[k]) continue;
                var mx = forces[k].fx * damping;
                var my = forces[k].fy * damping;
                var maxStep = 18;
                var stepLen = Math.hypot(mx, my);
                if (stepLen > maxStep) {
                    mx = (mx / stepLen) * maxStep;
                    my = (my / stepLen) * maxStep;
                }
                pos[k].x = Math.max(minX, Math.min(maxX, pos[k].x + mx));
                pos[k].y = Math.max(minY, Math.min(maxY, pos[k].y + my));
            }
        }

                // Garantovaný doběh světlosti: přímý posun všech párů pod 48px
        for (var pass = 0; pass < 3; pass++) {
            for (var pi = 0; pi < N; pi++) {
                for (var pj = pi + 1; pj < N; pj++) {
                    var pdx = pos[pi].x - pos[pj].x;
                    var pdy = pos[pi].y - pos[pj].y;
                    var pd = Math.hypot(pdx, pdy);
                    if (pd < 48 && pd > 0.0001) {
                        var push = (48 - pd) / 2;
                        var pnx = pdx / pd;
                        var pny = pdy / pd;
                        pos[pi].x = Math.max(minX, Math.min(maxX, pos[pi].x + pnx * push));
                        pos[pi].y = Math.max(minY, Math.min(maxY, pos[pi].y + pny * push));
                        pos[pj].x = Math.max(minX, Math.min(maxX, pos[pj].x - pnx * push));
                        pos[pj].y = Math.max(minY, Math.min(maxY, pos[pj].y - pny * push));
                    }
                }
            }
        }
        return pos.map(function (p) { return { x: Math.round(p.x), y: Math.round(p.y) }; });
    },

    // Hledání největší volné kapsy pro Královský hrad
    findLargestOpenPocket: function (nodes, rivers, w, h) {
        w = w || 220;
        h = h || 180;
        var r = Math.min(w, h) * 0.38;
        var sRPS = (this.sampleRiverPathSimple || (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple));
        var riverPolys = [];
        if (rivers && rivers.length > 0 && sRPS) {
            for (var ri = 0; ri < rivers.length; ri++) {
                var rp = sRPS(rivers[ri].path);
                if (rp && rp.length > 0) riverPolys.push({ pts: rp, width: rivers[ri].width || 28 });
            }
        }

        var bestCandidate = null;
        var bestScore = -999999;

        for (var gx = 320; gx <= 1080; gx += 35) {
            for (var gy = 200; gy <= 680; gy += 35) {
                var minNodeDist = 9999;
                for (var n = 0; n < nodes.length; n++) {
                    var nd = nodes[n];
                    var d = Math.hypot(nd.x - gx, nd.y - gy);
                    if (d < minNodeDist) minNodeDist = d;
                }
                if (minNodeDist < r + 22) continue;

                var hitRiver = false;
                for (var rIdx = 0; rIdx < riverPolys.length; rIdx++) {
                    var rObj = riverPolys[rIdx];
                    var rHalf = (rObj.width || 28) / 2;
                    for (var pi = 0; pi < rObj.pts.length; pi++) {
                        var rd = Math.hypot(rObj.pts[pi].x - gx, rObj.pts[pi].y - gy);
                        if (rd < r + rHalf + 10) {
                            hitRiver = true;
                            break;
                        }
                    }
                    if (hitRiver) break;
                }
                if (hitRiver) continue;

                var centerDist = Math.hypot(gx - 700, gy - 430);
                var score = minNodeDist - centerDist * 0.15;
                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = { x: gx, y: gy, w: w, h: h, clearance: minNodeDist };
                }
            }
        }

        return bestCandidate;
    },

    // Procedurální přegenerování geometrie existujícího plánu (např. pro WYSIWYG editor se zachováním definic polí)
    regenerateBoardGeometry: function (board, shapeKey, seed) {
        if (!board || !board.nodes || board.nodes.length === 0) return board;
        shapeKey = shapeKey || board.routeShape || "auto";
        if (shapeKey === "auto") {
            var autoList = ["organic_meander", "figure_eight", "spiral_citadel", "twin_valleys", "serpentine", "star_crossroads", "classic_ring"];
            var sNum = (typeof seed === "number" && !isNaN(seed)) ? Math.abs(seed) : Math.floor(Math.random() * 1000);
            shapeKey = autoList[sNum % autoList.length];
        }

        var rnd = this.createRNG(seed || board.seed || 12345);

        // 1. Rozdělení na hlavní okruh a větve
        var mainNodes = [];
        var branchGroups = {};

        for (var i = 0; i < board.nodes.length; i++) {
            var n = board.nodes[i];
            var tag = n.branchTag || "main";
            if (tag === "main") {
                mainNodes.push(n);
            } else {
                if (!branchGroups[tag]) branchGroups[tag] = [];
                branchGroups[tag].push(n);
            }
        }

        if (mainNodes.length < 24) {
            mainNodes = board.nodes.slice(0, Math.min(board.nodes.length, 60));
        }

        var mainLen = mainNodes.length;

        // 2. Spline a reparametrizace hlavní trasy
        var ctrlPts = this.getArchetypeControlPoints(shapeKey, rnd);
        var denseCurve = this.sampleCatmullRomLoop(ctrlPts, 60);
        var mainPts = this.reparameterizeByArcLength(denseCurve, mainLen);

        for (var m = 0; m < mainLen; m++) {
            mainNodes[m].x = mainPts[m].x;
            mainNodes[m].y = mainPts[m].y;
        }

        var cx = 0, cy = 0;
        for (var ci = 0; ci < mainLen; ci++) { cx += mainNodes[ci].x; cy += mainNodes[ci].y; }
        cx /= mainLen; cy /= mainLen;

        // 3. Spojnice a pozicování větví
        var edges = [];
        for (var me = 0; me < mainLen; me++) {
            edges.push([mainNodes[me].id, mainNodes[(me + 1) % mainLen].id]);
        }

        var branchKeys = Object.keys(branchGroups);
        for (var bk = 0; bk < branchKeys.length; bk++) {
            var bTag = branchKeys[bk];
            var bNodes = branchGroups[bTag];
            if (bNodes.length === 0) continue;

            var startNode = null;
            for (var si = 0; si < board.nodes.length; si++) {
                if (board.nodes[si].isJunction && board.nodes[si].branchHigh === bNodes[0].id) {
                    startNode = board.nodes[si];
                    break;
                }
            }
            if (!startNode) startNode = mainNodes[Math.floor(mainLen * (0.2 + bk * 0.25)) % mainLen];

            var lastBNode = bNodes[bNodes.length - 1];
            var endId = (lastBNode.next && lastBNode.next[0] !== undefined) ? lastBNode.next[0] : (startNode.id + 6) % mainLen;
            var endNode = board.nodes[endId] || mainNodes[(startNode.id + 6) % mainLen];

            var chordX = endNode.x - startNode.x;
            var chordY = endNode.y - startNode.y;
            var chordLen = Math.hypot(chordX, chordY) || 1;
            var nx = -chordY / chordLen;
            var ny = chordX / chordLen;

            var midX = (startNode.x + endNode.x) / 2;
            var midY = (startNode.y + endNode.y) / 2;
            var dot = nx * (cx - midX) + ny * (cy - midY);
            var sign = (dot >= 0) ? 1 : -1;
            if (bTag === "dragon" && Math.abs(midX - 700) > 180) sign = -sign;

            var bulge = Math.min(180, Math.max(80, chordLen * 0.42)) * sign;
            var cp1 = { x: startNode.x + chordX * 0.3 + nx * bulge, y: startNode.y + chordY * 0.3 + ny * bulge };
            var cp2 = { x: startNode.x + chordX * 0.7 + nx * bulge, y: startNode.y + chordY * 0.7 + ny * bulge };

            for (var bi = 0; bi < bNodes.length; bi++) {
                var t = (bi + 1) / (bNodes.length + 1);
                var it = 1 - t;
                var bx = it * it * it * startNode.x + 3 * it * it * t * cp1.x + 3 * it * t * t * cp2.x + t * t * t * endNode.x;
                var by = it * it * it * startNode.y + 3 * it * it * t * cp1.y + 3 * it * t * t * cp2.y + t * t * t * endNode.y;
                bNodes[bi].x = Math.round(bx);
                bNodes[bi].y = Math.round(by);

                if (bi === 0) {
                    edges.push([startNode.id, bNodes[0].id]);
                } else {
                    edges.push([bNodes[bi - 1].id, bNodes[bi].id]);
                }
            }
            edges.push([lastBNode.id, endNode.id]);
        }

        // 4. Fyzikální relaxace celého grafu
        var relaxed = this.relaxNodePositions(board.nodes, edges, { minClearance: 52, iterations: 35 });
        for (var ri = 0; ri < board.nodes.length; ri++) {
            board.nodes[ri].x = relaxed[ri].x;
            board.nodes[ri].y = relaxed[ri].y;
        }

        board.routeShape = shapeKey;
        if (board.recipe) board.recipe.routeShape = shapeKey;

        // 5. Aktualizace mostů a dominant
        if (typeof this.sanitizeAndAnchorLandmarks === "function") {
            this.sanitizeAndAnchorLandmarks(board);
        }
        if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
            window.PRS_BoardBuilder.computeRiverBridges(board);
        }

        return board;
    },

    // Kompletní katalog 10 královských a feudálních hradů
    ALL_CASTLES: [
        { id: "castle_royal", name: "Královský hrad (Sídlo koruny)", icon: "👑", img: "assets/castles/castle_royal.png", biome: "golden_plains", element: "light" },
        { id: "castle_forest", name: "Lesní hrad Doubrava", icon: "🌲", img: "assets/castles/castle_forest.png", biome: "forest_realm", element: "earth" },
        { id: "castle_ice", name: "Ledový palác Věčného mrazu", icon: "❄️", img: "assets/castles/castle_ice.png", biome: "mountain", element: "water" },
        { id: "castle_lava", name: "Sopečná pevnost Lávový chřtán", icon: "🌋", img: "assets/castles/castle_lava.png", biome: "dragon_peaks", element: "fire" },
        { id: "castle_crystal", name: "Křišťálový zámek Ametyst", icon: "💎", img: "assets/castles/castle_crystal.png", biome: "magic", element: "light" },
        { id: "castle_wind", name: "Větrný vzdušný zámek Boreas", icon: "☁️", img: "assets/castles/castle_wind.png", biome: "golden_plains", element: "air" },
        { id: "castle_water", name: "Vodní citadela Oceán", icon: "🌊", img: "assets/castles/castle_water.png", biome: "river_delta", element: "water" },
        { id: "castle_desert", name: "Pouštní pískovcový palác", icon: "🏜️", img: "assets/castles/castle_desert.png", biome: "golden_plains", element: "earth" },
        { id: "castle_swamp", name: "Bažinná tvrz Černá tůň", icon: "🌫️", img: "assets/castles/castle_swamp.png", biome: "swamp", element: "earth" },
        { id: "castle_dark", name: "Temný hrad Erebus", icon: "🌑", img: "assets/castles/castle_dark.png", biome: "magic", element: "fire" }
    ],

    // Seznam 9 tematických hradů z katalogu pro procedurální přiřazení
    THEMATIC_CASTLES: [
        { id: "castle_forest", name: "Lesní hrad Doubrava", icon: "🌲", img: "assets/castles/castle_forest.png", biome: "forest" },
        { id: "castle_ice", name: "Ledový palác Věčného mrazu", icon: "❄️", img: "assets/castles/castle_ice.png", biome: "mountain" },
        { id: "castle_lava", name: "Sopečná pevnost Lávový chřtán", icon: "🌋", img: "assets/castles/castle_lava.png", biome: "mountain" },
        { id: "castle_crystal", name: "Křišťálový zámek Ametyst", icon: "💎", img: "assets/castles/castle_crystal.png", biome: "magic" },
        { id: "castle_wind", name: "Větrný vzdušný zámek Boreas", icon: "☁️", img: "assets/castles/castle_wind.png", biome: "plains" },
        { id: "castle_water", name: "Vodní citadela Oceán", icon: "🌊", img: "assets/castles/castle_water.png", biome: "water" },
        { id: "castle_desert", name: "Pouštní pískovcový palác", icon: "🏜️", img: "assets/castles/castle_desert.png", biome: "plains" },
        { id: "castle_swamp", name: "Bažinná tvrz Černá tůň", icon: "🌫️", img: "assets/castles/castle_swamp.png", biome: "swamp" },
        { id: "castle_dark", name: "Temný hrad Erebus", icon: "🌑", img: "assets/castles/castle_dark.png", biome: "magic" }
    ],

    // Vybere dominantní královský hrad podle volby, biomu nebo seedu
    resolveRoyalCastle: function (royalCastleKey, biomeTheme, seed) {
        var all = this.ALL_CASTLES;
        // 1. Explicitní volba uživatele z Map Studia nebo Lobby
        if (royalCastleKey && royalCastleKey !== "auto" && royalCastleKey !== "random") {
            for (var i = 0; i < all.length; i++) {
                if (all[i].id === royalCastleKey || all[i].id === "castle_" + royalCastleKey) {
                    return all[i];
                }
            }
        }
        // 2. Podle rázovitého biomu krajiny
        if (biomeTheme === "dragon_peaks") {
            return this.getCastleById("castle_lava") || all[3];
        } else if (biomeTheme === "forest_realm" || biomeTheme === "forest") {
            return this.getCastleById("castle_forest") || all[1];
        } else if (biomeTheme === "river_delta" || biomeTheme === "water") {
            return this.getCastleById("castle_water") || all[6];
        } else if (biomeTheme === "mountain" || biomeTheme === "ice") {
            return this.getCastleById("castle_ice") || all[2];
        }
        // 3. Deterministický pestrý výběr ze seedu
        var s = (typeof seed === "number" && !isNaN(seed)) ? Math.abs(seed) : Math.floor(Math.random() * 1000);
        return all[s % all.length];
    },

    getCastleById: function (id) {
        if (!id) return null;
        for (var i = 0; i < this.ALL_CASTLES.length; i++) {
            if (this.ALL_CASTLES[i].id === id || this.ALL_CASTLES[i].id === "castle_" + id) {
                return this.ALL_CASTLES[i];
            }
        }
        return null;
    },

    // ========================================================================
    // KOMPILÁTOR VLASTNÍHO DYNAMICKÉHO RECEPTU POLÍČEK (CUSTOM BOARD RECIPE)
    // ========================================================================
    normalizeRecipe: function (raw, customSeed) {
        var def = this.DEFAULT_RECIPE;
        var r = (raw && typeof raw === "object") ? raw : {};

        // 1. Aktivní levely trojic zvířat (1 až 14)
        var levels = [];
        if (Array.isArray(r.animalLevels)) {
            for (var i = 0; i < r.animalLevels.length; i++) {
                var lv = parseInt(r.animalLevels[i], 10);
                if (lv >= 1 && lv <= 14 && levels.indexOf(lv) === -1) {
                    levels.push(lv);
                }
            }
            levels.sort(function (a, b) { return a - b; });
        } else if (r.animalSetCount !== undefined) {
            var cnt = Math.max(0, Math.min(14, parseInt(r.animalSetCount, 10) || 8));
            for (var s = 1; s <= cnt; s++) levels.push(s);
        } else {
            levels = def.animalLevels.slice();
        }

        function clampInt(val, fallback, minV, maxV) {
            var n = (val !== undefined && val !== null && val !== "") ? parseInt(val, 10) : fallback;
            if (isNaN(n)) n = fallback;
            return Math.max(minV, Math.min(maxV, n));
        }

        var norm = {
            animalLevels: levels,
            villages: clampInt(r.villages, def.villages, 0, 24),
            towns: clampInt(r.towns, def.towns, 0, 14),
            castles: clampInt(r.castles, def.castles, 0, 9),
            jesters: clampInt(r.jesters, def.jesters, 0, 12),
            buildings: clampInt(r.buildings, def.buildings, 0, 12),
            questsU1: clampInt(r.questsU1, def.questsU1, 0, 16),
            questsU2: clampInt(r.questsU2, def.questsU2, 0, 14),
            questsU3: clampInt(r.questsU3, def.questsU3, 0, 10),
            masters: clampInt(r.masters, def.masters, 0, 20),
            merchants: clampInt(r.merchants, def.merchants, 0, 10),
            festivals: clampInt(r.festivals, def.festivals, 0, 12),
            chances: clampInt(r.chances, def.chances, 0, 24),
            taxes: clampInt(r.taxes, def.taxes, 0, 8),
            prisons: clampInt(r.prisons, def.prisons, 0, 4),
            hospitals: clampInt(r.hospitals, def.hospitals, 0, 4),
            taverns: clampInt(r.taverns, def.taverns, 0, 6),
            branches: clampInt(r.branches, def.branches, 0, 4),
            masterTier: clampInt(r.masterTier, def.masterTier, 1, 5),
            riverMode: r.riverMode || def.riverMode || "single",
            biomeTheme: r.biomeTheme || def.biomeTheme || "balanced",
            royalCastle: r.royalCastle || def.royalCastle || "auto",
            routeShape: (r.routeShape && this.ROUTE_ARCHETYPES && this.ROUTE_ARCHETYPES[r.routeShape]) ? r.routeShape : (def.routeShape || "auto"),
            seed: Math.abs(Number(customSeed || r.seed || def.seed || 4598)) % 1000000 || 4598,
            customName: (r.customName || "").trim()
        };

        norm.totalNodes = this.calculateRecipeTotalNodes(norm);
        return norm;
    },

    calculateRecipeTotalNodes: function (r) {
        if (!r) return 0;
        var animCount = Array.isArray(r.animalLevels) ? (r.animalLevels.length * 3) : 0;
        var otherCount =
            (Number(r.villages) || 0) +
            (Number(r.towns) || 0) +
            (Number(r.castles) || 0) +
            (Number(r.jesters) || 0) +
            (Number(r.buildings) || 0) +
            (Number(r.questsU1) || 0) +
            (Number(r.questsU2) || 0) +
            (Number(r.questsU3) || 0) +
            (Number(r.masters) || 0) +
            (Number(r.merchants) || 0) +
            (Number(r.festivals) || 0) +
            (Number(r.chances) || 0) +
            (Number(r.taxes) || 0) +
            (Number(r.prisons) || 0) +
            (Number(r.hospitals) || 0) +
            (Number(r.taverns) || 0);
        return 1 + animCount + otherCount; // 1 = START
    },

    compileDynamicRecipe: function (rawRecipe, customSeed) {
        var r = this.normalizeRecipe(rawRecipe, customSeed);
        var seed = r.seed;
        var rnd = this.createRNG(seed);
        var chosenMasterTier = r.masterTier;
        var riverMode = r.riverMode;
        var biomeTheme = r.biomeTheme;

        function resolveMasterNodeTier(progressRatio, isGrandmaster) {
            if (isGrandmaster) return 4;
            if (chosenMasterTier === 5) {
                if (progressRatio < 0.28) return 1;
                if (progressRatio < 0.58) return 2;
                if (progressRatio < 0.85) return 3;
                return 4;
            }
            return Math.max(1, Math.min(4, chosenMasterTier));
        }

        // 1. Sestavení přesných seznamů polí podle uživatelského receptu
        var villageNames = [
            "Králova Lhota", "Lhotka", "Březová", "Dubina", "Skalice", "Meziříčí",
            "Slunečná", "Podhradí", "Větrná", "Zlatá Olešnice", "Rovensko", "Chlumec",
            "Lipnice", "Studánka", "Osek", "Hvozd", "Kamenice", "Jabloňov", "Borová", "Blatná",
            "Dobříš", "Rožmitál", "Třeboňsko", "Bystřička"
        ];
        var townNames = [
            "Královo Pole", "Stříbratec", "Zlatov", "Mečov", "Železný Brod",
            "Korunní Město", "Sokolov", "Hvězdomír", "Lví Brod", "Sluneční Hradec",
            "Velehrad", "Křišťálov", "Jantarové Město", "Bílý Kámen"
        ];
        var buildingTemplates = [
            { subtype: "stables", name: "Královské stáje", icon: "🏠", codePrefix: "STAJE" },
            { subtype: "forge", name: "Cechovní kovárna", icon: "⚒️", codePrefix: "KOV" },
            { subtype: "falconer", name: "Královský sokolník", icon: "🦅", codePrefix: "SOK" },
            { subtype: "doghandler", name: "Psovod a smečka", icon: "🦴", codePrefix: "PSOV" },
            { subtype: "tailor", name: "Dvorní krejčí", icon: "🧵", codePrefix: "KREJ" }
        ];
        var masterTemplates = [
            { skill: "combat", name: "Mistr Boje", icon: "⚔️", codePrefix: "MB" },
            { skill: "riding", name: "Mistr Jízdy", icon: "🏇", codePrefix: "MJ" },
            { skill: "dance", name: "Mistr Tance", icon: "💃", codePrefix: "MT" },
            { skill: "charisma", name: "Mistr Charismatu", icon: "✨", codePrefix: "MCH" },
            { skill: "any", name: "Velmistr", icon: "🧙‍♂️", codePrefix: "VM" }
        ];
        var festivalTemplates = [
            { subtype: "tournament", name: "SLAVNOST: Královský Turnaj ♡", icon: "💖", baseCode: "SLAV_TURNAJ" },
            { subtype: "ball", name: "SLAVNOST: Zámecký Ples ♡", icon: "💖", baseCode: "SLAV_PLES" },
            { subtype: "race", name: "SLAVNOST: Velký Závod ♡", icon: "💖", baseCode: "SLAV_ZAVOD" }
        ];

        // Zamíchání tematických hradů podle seedu a určení královského sídla
        var royalDef = this.resolveRoyalCastle(r.royalCastle, biomeTheme, seed);
        var castlePool = this.ALL_CASTLES.filter(function (c) { return c.id !== royalDef.id; });
        for (var cIdx = castlePool.length - 1; cIdx > 0; cIdx--) {
            var swapIdx = Math.floor(rnd() * (cIdx + 1));
            var tmpC = castlePool[cIdx];
            castlePool[cIdx] = castlePool[swapIdx];
            castlePool[swapIdx] = tmpC;
        }
        var castleH1 = castlePool[0];
        var castleH2 = castlePool[1] || castlePool[0];

        var listVillages = [], listTowns = [], listCastles = [], listJesters = [], listBuildings = [];
        var listU1 = [], listU2 = [], listU3 = [], listMasters = [], listMerchants = [];
        var listFestivals = [], listChances = [], listTaxes = [], listPrisons = [], listHospitals = [], listTaverns = [];

        for (var iv = 0; iv < r.villages; iv++) {
            var vName = villageNames[iv % villageNames.length];
            listVillages.push({ code: "V" + (iv + 1), type: "VILLAGE", estateId: "V" + (iv + 1), name: "Vesnice " + (iv + 1) + " (" + vName + ")", icon: "🏘️", hasRoof: (iv % 2 === 0) });
        }
        for (var it = 0; it < r.towns; it++) {
            var tName = townNames[it % townNames.length];
            listTowns.push({ code: "M" + (it + 1), type: "TOWN", estateId: "M" + (it + 1), name: "Město " + (it + 1) + " (" + tName + ")", icon: "🏙️" });
        }
        for (var ic = 0; ic < r.castles; ic++) {
            var cDef = castlePool[ic % castlePool.length];
            listCastles.push({ code: "H" + (ic + 1), type: "CASTLE", estateId: "H" + (ic + 1), name: "Hrad " + (ic + 1) + " (" + cDef.name + ")", icon: cDef.icon || "🏯", castleImg: cDef.img });
        }
        for (var ij = 0; ij < r.jesters; ij++) {
            listJesters.push({ code: "KE" + (ij + 1), type: "JESTER", jesterId: ij + 1, name: "Kejklíř " + (ij + 1), icon: "🃏" });
        }
        for (var ib = 0; ib < r.buildings; ib++) {
            var bDef = buildingTemplates[ib % buildingTemplates.length];
            listBuildings.push({ code: bDef.codePrefix + (Math.floor(ib / 5) + 1), type: "BUILDING", subtype: bDef.subtype, name: bDef.name, icon: bDef.icon });
        }
        for (var iu1 = 0; iu1 < r.questsU1; iu1++) {
            listU1.push({ code: "U1_" + (iu1 + 1), type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" });
        }
        for (var iu2 = 0; iu2 < r.questsU2; iu2++) {
            listU2.push({ code: "U2_" + (iu2 + 1), type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" });
        }
        for (var iu3 = 0; iu3 < r.questsU3; iu3++) {
            listU3.push({ code: "U3_" + (iu3 + 1), type: "QUEST", subtype: "U3", name: (iu3 % 2 === 0 ? "Dračí sluj (U3)" : "Tříhlavá saň (U3)"), icon: (iu3 % 2 === 0 ? "🐉" : "🐲") });
        }
        for (var im = 0; im < r.masters; im++) {
            var mDef = masterTemplates[im % masterTemplates.length];
            listMasters.push({ code: mDef.codePrefix + (Math.floor(im / 5) + 1), type: "MASTER", skill: mDef.skill, name: mDef.name, icon: mDef.icon });
        }
        for (var imer = 0; imer < r.merchants; imer++) {
            listMerchants.push({ code: "OBCHOD" + (imer + 1), type: "MERCHANT", name: "Královský obchodník", icon: "⚖️" });
        }
        for (var ifest = 0; ifest < r.festivals; ifest++) {
            var fDef = festivalTemplates[ifest % festivalTemplates.length];
            var fCode = (ifest < 3) ? fDef.baseCode : (fDef.baseCode + "_" + (ifest + 1));
            listFestivals.push({ code: fCode, type: "FESTIVAL", subtype: fDef.subtype, name: fDef.name, icon: fDef.icon });
        }
        for (var ich = 0; ich < r.chances; ich++) {
            listChances.push({ code: "N" + (ich + 1), type: "CHANCE", name: "Náhoda", icon: "❓" });
        }
        for (var itx = 0; itx < r.taxes; itx++) {
            listTaxes.push({ code: "VD" + (itx + 1), type: "TAX", name: "Výběrčí daní", icon: "👑" });
        }
        for (var ipr = 0; ipr < r.prisons; ipr++) {
            listPrisons.push({ code: "SATL" + (ipr > 0 ? (ipr + 1) : ""), type: "PRISON", name: "Královská šatlava", icon: "⛓️" });
        }
        for (var ihp = 0; ihp < r.hospitals; ihp++) {
            listHospitals.push({ code: "HOSP" + (ihp > 0 ? (ihp + 1) : ""), type: "HOSPITAL", name: "Královský lazaret", icon: "🏥" });
        }
        for (var itav = 0; itav < r.taverns; itav++) {
            listTaverns.push({ code: "KRCMA" + (itav > 0 ? (itav + 1) : ""), type: "TAVERN", name: "Krčma U Zlatého korbelu", icon: "🍺" });
        }

        // Pojistka pro extrémně malý počet polí (< 20), aby šel vytvořit uzavřený okruh
        var rawTotal = r.totalNodes;
        while (rawTotal < 20) {
            listChances.push({ code: "N_PAD_" + rawTotal, type: "CHANCE", name: "Náhoda", icon: "❓" });
            rawTotal++;
        }

        var remainingAnimalLevels = r.animalLevels.slice();
        var branchCount = r.branches;
        if (rawTotal < 32) branchCount = 0;
        else if (rawTotal < 44 && branchCount > 1) branchCount = 1;
        else if (rawTotal < 56 && branchCount > 2) branchCount = 2;

        // 2. Rozdělení polí do větví (pouze z reálně naklikaných zásob uživatele!)
        var b1Defs = [], b2Defs = [], b3Defs = [], b4Defs = [];
        var maxBranchBudget = Math.max(0, rawTotal - 24); // Garantujeme min. 24 polí na hlavním okruhu

        function takeFrom(arr, maxItems) {
            var taken = [];
            while (taken.length < maxItems && arr.length > 0 && maxBranchBudget > 0) {
                taken.push(arr.shift());
                maxBranchBudget--;
            }
            return taken;
        }

        function takeAnimalTripletForBranch() {
            if (remainingAnimalLevels.length >= 5 && maxBranchBudget >= 3) {
                var lvl = remainingAnimalLevels.pop();
                var cat = this.ANIMAL_SETS_CATALOG[lvl - 1] || this.ANIMAL_SETS_CATALOG[0];
                maxBranchBudget -= 3;
                return [
                    { code: "K" + lvl, type: "ANIMAL", subtype: "horse", setId: lvl, name: cat.horse, icon: "🐎" },
                    { code: "S" + lvl, type: "ANIMAL", subtype: "falcon", setId: lvl, name: cat.falcon, icon: "🦅" },
                    { code: "P" + lvl, type: "ANIMAL", subtype: "dog", setId: lvl, name: cat.dog, icon: "🐕" }
                ];
            }
            return [];
        }

        // Větev 1: Most Slavností
        if (branchCount >= 1 && maxBranchBudget >= 3) {
            b1Defs = b1Defs.concat(takeFrom(listFestivals, Math.min(3, listFestivals.length)));
            if (listTowns.length > 1) b1Defs = b1Defs.concat(takeFrom(listTowns, 1));
            if (listVillages.length > 2) b1Defs = b1Defs.concat(takeFrom(listVillages, 1));
            if (listMasters.length > 2) b1Defs = b1Defs.concat(takeFrom(listMasters, 1));
            if (listChances.length > 2) b1Defs = b1Defs.concat(takeFrom(listChances, 1));
        }

        // Větev 2: Pravá Dračí stezka
        if (branchCount >= 2 && maxBranchBudget >= 3) {
            b2Defs = b2Defs.concat(takeFrom(listU3, Math.min(2, listU3.length)));
            if (listCastles.length > 0) b2Defs = b2Defs.concat(takeFrom(listCastles, 1));
            if (listU2.length > 1) b2Defs = b2Defs.concat(takeFrom(listU2, 1));
            b2Defs = b2Defs.concat(takeAnimalTripletForBranch.call(this));
            if (listMasters.length > 1) b2Defs = b2Defs.concat(takeFrom(listMasters, 1));
        }

        // Větev 3: Levá Lesní smyčka
        if (branchCount >= 3 && maxBranchBudget >= 3) {
            if (listCastles.length > 0) b3Defs = b3Defs.concat(takeFrom(listCastles, 1));
            b3Defs = b3Defs.concat(takeAnimalTripletForBranch.call(this));
            if (listU2.length > 0) b3Defs = b3Defs.concat(takeFrom(listU2, 1));
            if (listU1.length > 1) b3Defs = b3Defs.concat(takeFrom(listU1, 1));
            if (listBuildings.length > 2) b3Defs = b3Defs.concat(takeFrom(listBuildings, 1));
        }

        // Větev 4: Severní Královská hřebenovka
        if (branchCount >= 4 && maxBranchBudget >= 3) {
            if (listCastles.length > 0) b4Defs = b4Defs.concat(takeFrom(listCastles, 1));
            else if (listTowns.length > 1) b4Defs = b4Defs.concat(takeFrom(listTowns, 1));
            b4Defs = b4Defs.concat(takeAnimalTripletForBranch.call(this));
            if (listMasters.length > 0) b4Defs = b4Defs.concat(takeFrom(listMasters, 1));
            if (listMerchants.length > 1) b4Defs = b4Defs.concat(takeFrom(listMerchants, 1));
        }

        // 3. Rovnoměrné proložení všech zbývajících ne-zvířecích polí na hlavní okruh
        var buckets = [
            listVillages, listMasters, listChances, listBuildings,
            listTowns, listU1, listJesters, listMerchants,
            listU2, listFestivals, listTaxes, listCastles,
            listU3, listHospitals, listPrisons, listTaverns
        ];
        var outerNonAnimals = [];
        var stillHasItems = true;
        while (stillHasItems) {
            stillHasItems = false;
            for (var bk = 0; bk < buckets.length; bk++) {
                if (buckets[bk].length > 0) {
                    outerNonAnimals.push(buckets[bk].shift());
                    stillHasItems = true;
                }
            }
        }

        // 4. Složení hlavního okruhu: START + proložené trojice zvířat (každý vybraný level K+S+P drží u sebe!) + outerNonAnimals
        var outerDefs = [{ code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰" }];
        var naCursor = 0;
        var outerSetsCount = remainingAnimalLevels.length;

        if (outerSetsCount > 0) {
            for (var sIdx = 0; sIdx < outerSetsCount; sIdx++) {
                var lvlId = remainingAnimalLevels[sIdx];
                var cat = this.ANIMAL_SETS_CATALOG[lvlId - 1] || this.ANIMAL_SETS_CATALOG[0];
                var remSets = outerSetsCount - sIdx;
                var remNA = outerNonAnimals.length - naCursor;
                var chunkNA = Math.floor(remNA / remSets);

                // 1. Kůň daného levelu
                outerDefs.push({ code: "K" + lvlId, type: "ANIMAL", subtype: "horse", setId: lvlId, name: cat.horse, icon: "🐎" });
                // Max 1 mezilehlé pole uvnitř chovného revíru
                if (chunkNA > 0 && naCursor < outerNonAnimals.length) {
                    outerDefs.push(outerNonAnimals[naCursor++]);
                    chunkNA--;
                }
                // 2. Sokol/Pták daného levelu
                outerDefs.push({ code: "S" + lvlId, type: "ANIMAL", subtype: "falcon", setId: lvlId, name: cat.falcon, icon: "🦅" });
                // 3. Pes daného levelu
                outerDefs.push({ code: "P" + lvlId, type: "ANIMAL", subtype: "dog", setId: lvlId, name: cat.dog, icon: "🐕" });

                while (chunkNA > 0 && naCursor < outerNonAnimals.length) {
                    outerDefs.push(outerNonAnimals[naCursor++]);
                    chunkNA--;
                }
            }
        }
        while (naCursor < outerNonAnimals.length) {
            outerDefs.push(outerNonAnimals[naCursor++]);
        }

        var outerLen = outerDefs.length;

        // 5. Geometrie hlavního okruhu (5 Bézierových segmentů přizpůsobených délce outerLen)
        var sTop = Math.max(4, Math.round(outerLen * 0.18));
        var sRight = Math.max(4, Math.round(outerLen * 0.23));
        var sBottom = Math.max(5, Math.round(outerLen * 0.26));
        var sLeft1 = Math.max(4, Math.round(outerLen * 0.19));
        var sLeft2 = Math.max(3, outerLen - (sTop + sRight + sBottom + sLeft1));
        while (sTop + sRight + sBottom + sLeft1 + sLeft2 > outerLen) {
            if (sBottom > 4) sBottom--;
            else if (sRight > 4) sRight--;
            else if (sLeft1 > 3) sLeft1--;
            else break;
        }

        var topWarp = (rnd() - 0.5) * 52;
        var rightWarp = (rnd() - 0.5) * 44;
        var bottomWarp = (rnd() - 0.5) * 50;
        // 5. Procedurální geometrie trasy (7 Archetypů + Catmull-Rom spline + Arc-length reparametrizace)
        var shapeKey = r.routeShape || "auto";
        if (shapeKey === "auto") {
            var autoShapes = ["organic_meander", "figure_eight", "spiral_citadel", "twin_valleys", "serpentine", "star_crossroads", "classic_ring"];
            var autoIdx = Math.abs(Number(seed) || 12345) % autoShapes.length;
            shapeKey = autoShapes[autoIdx];
        }

        var ctrlPts = this.getArchetypeControlPoints(shapeKey, rnd);
        var denseCurve = this.sampleCatmullRomLoop(ctrlPts, 60);
        var mainPts = this.reparameterizeByArcLength(denseCurve, outerLen);

        var nodes = [];
        var edges = [];

        for (var i = 0; i < outerLen; i++) {
            var d = outerDefs[i];
            var pt = mainPts[i] || { x: 500, y: 74 };
            var prog = i / outerLen;
            var mTierVal = (d.type === "MASTER") ? resolveMasterNodeTier(prog, d.skill === "any") : null;
            nodes.push({
                id: i,
                code: d.code,
                type: d.type,
                subtype: d.subtype || null,
                setId: d.setId || null,
                estateId: d.estateId || null,
                castleImg: d.castleImg || null,
                castleId: d.castleId || null,
                jesterId: d.jesterId || null,
                skill: d.skill || null,
                masterTier: mTierVal,
                hasRoof: !!d.hasRoof,
                isJunction: false,
                branchTag: "main",
                name: d.name,
                icon: d.icon,
                x: pt.x,
                y: pt.y,
                next: [(i + 1) % outerLen],
                branchLow: null,
                branchHigh: null
            });
            edges.push([i, (i + 1) % outerLen]);
        }

        // 6. Dynamické připojení odboček a větví podle geometrie archetypu
        var self = this;
        var cx = 0, cy = 0;
        for (var ci = 0; ci < outerLen; ci++) { cx += nodes[ci].x; cy += nodes[ci].y; }
        cx /= outerLen; cy /= outerLen;

        function attachBranchProcedural(jStartIdx, jEndIdx, bDefs, tag, outward) {
            if (!bDefs || bDefs.length === 0) return;
            var nStart = nodes[jStartIdx];
            var nEnd = nodes[jEndIdx];
            if (!nStart || !nEnd) return;

            var chordX = nEnd.x - nStart.x;
            var chordY = nEnd.y - nStart.y;
            var chordLen = Math.hypot(chordX, chordY) || 1;
            var nx = -chordY / chordLen;
            var ny = chordX / chordLen;

            var midX = (nStart.x + nEnd.x) / 2;
            var midY = (nStart.y + nEnd.y) / 2;
            var outX = midX - cx, outY = midY - cy;
            var dot = nx * outX + ny * outY;
            var sign = (dot >= 0) ? (outward ? 1 : -1) : (outward ? -1 : 1);

            var bulge = Math.min(220, Math.max(120, chordLen * 0.50)) * sign;
            var cp1 = { x: Math.round(nStart.x + chordX * 0.3 + nx * bulge), y: Math.round(nStart.y + chordY * 0.3 + ny * bulge) };
            var cp2 = { x: Math.round(nStart.x + chordX * 0.7 + nx * bulge), y: Math.round(nStart.y + chordY * 0.7 + ny * bulge) };

            var firstId = nodes.length;
            for (var k = 0; k < bDefs.length; k++) {
                var bd = bDefs[k];
                var t = (k + 1) / (bDefs.length + 1);
                var it = 1 - t;
                var bx = it * it * it * nStart.x + 3 * it * it * t * cp1.x + 3 * it * t * t * cp2.x + t * t * t * nEnd.x;
                var by = it * it * it * nStart.y + 3 * it * it * t * cp1.y + 3 * it * t * t * cp2.y + t * t * t * nEnd.y;
                var nid = nodes.length;
                var mTierVal = (bd.type === "MASTER") ? resolveMasterNodeTier(0.75, bd.skill === "any") : null;
                nodes.push({
                    id: nid,
                    code: bd.code,
                    type: bd.type,
                    subtype: bd.subtype || null,
                    setId: bd.setId || null,
                    estateId: bd.estateId || null,
                    castleImg: bd.castleImg || null,
                    castleId: bd.castleId || null,
                    jesterId: bd.jesterId || null,
                    skill: bd.skill || null,
                    masterTier: mTierVal,
                    hasRoof: !!bd.hasRoof,
                    isJunction: false,
                    branchTag: tag,
                    name: bd.name,
                    icon: bd.icon,
                    x: Math.round(bx),
                    y: Math.round(by),
                    next: [k < bDefs.length - 1 ? nid + 1 : jEndIdx],
                    branchLow: null,
                    branchHigh: null
                });

                if (k === 0) {
                    edges.push([jStartIdx, nid]);
                } else {
                    edges.push([nid - 1, nid]);
                }
            }
            edges.push([nodes.length - 1, jEndIdx]);

            nStart.isJunction = true;
            nStart.branchLow = (jStartIdx + 1) % outerLen;
            nStart.branchHigh = firstId;
            nStart.next = [nStart.branchLow, nStart.branchHigh];
        }

        var j1Start = Math.max(3, Math.min(outerLen - 6, Math.round(outerLen * 0.46)));
        var j1End = Math.max(j1Start + 3, Math.min(outerLen - 3, Math.round(outerLen * 0.65)));
        var j2Start = Math.max(2, Math.min(j1Start - 2, Math.round(outerLen * 0.16)));
        var j2End = Math.max(j2Start + 3, Math.min(j1Start - 1, Math.round(outerLen * 0.38)));
        var j3Start = Math.max(j1End + 3, Math.min(outerLen - 2, Math.round(outerLen * 0.92)));
        var j3End = Math.max(j1End + 2, Math.min(j3Start - 2, Math.round(outerLen * 0.78)));
        var j4Start = Math.max(2, Math.min(j2Start - 2, Math.round(outerLen * 0.05)));
        var j4End = Math.max(j2Start + 2, Math.min(j2End - 2, Math.round(outerLen * 0.25)));

        var activeBranchCount = 0;
        if (b1Defs.length > 0) {
            attachBranchProcedural(j1Start, j1End, b1Defs, "festival", false);
            activeBranchCount++;
        }
        if (b2Defs.length > 0) {
            attachBranchProcedural(j2Start, j2End, b2Defs, "dragon", true);
            activeBranchCount++;
        }
        if (b3Defs.length > 0) {
            attachBranchProcedural(j3Start, j3End, b3Defs, "forest", false);
            activeBranchCount++;
        }
        if (b4Defs.length > 0) {
            attachBranchProcedural(j4Start, j4End, b4Defs, "ridge", true);
            activeBranchCount++;
        }

        // 6b. Fyzikální relaxace celého grafu (35 iterací repulze & pružin pro garanci min. rozestupu 52px)
        var relaxed = this.relaxNodePositions(nodes, edges, { minClearance: 52, iterations: 35 });
        for (var rk = 0; rk < nodes.length; rk++) {
            nodes[rk].x = relaxed[rk].x;
            nodes[rk].y = relaxed[rk].y;
        }

        // 7. Řeky a mosty
        var rivers = [];
        var riverPolylines = [];
        if (riverMode !== "none") {
            var m1 = (rnd() - 0.5) * 45;
            var m2 = (rnd() - 0.5) * 55;
            var m3 = (rnd() - 0.5) * 40;
            var r1Pts = [
                { x: Math.round(1225 + (rnd() - 0.5) * 25), y: 15 },
                { x: Math.round(1185 + m1 * 0.5), y: 125 },
                { x: Math.round(1115 - m1 * 0.4), y: 275 },
                { x: Math.round(1025 + m2), y: 415 },
                { x: Math.round(915 - m2 * 0.5), y: 560 },
                { x: Math.round(775 + m3), y: 705 },
                { x: Math.round(695 + (rnd() - 0.5) * 20), y: 875 }
            ];
            var r1Path = "M " + r1Pts[0].x + " " + r1Pts[0].y + " " +
                "C " + r1Pts[1].x + " " + r1Pts[1].y + ", " + r1Pts[2].x + " " + r1Pts[2].y + ", " + r1Pts[3].x + " " + r1Pts[3].y + " " +
                "C " + r1Pts[4].x + " " + r1Pts[4].y + ", " + r1Pts[5].x + " " + r1Pts[5].y + ", " + r1Pts[6].x + " " + r1Pts[6].y;
            rivers.push({ id: "main_river", name: "Královská řeka Doubravka", width: 14, color: "#0284c7", path: r1Path });
            riverPolylines.push(
                this.sampleBezier(r1Pts[0], r1Pts[1], r1Pts[2], r1Pts[3], 20, false)
                    .concat(this.sampleBezier(r1Pts[3], r1Pts[4], r1Pts[5], r1Pts[6], 20, true))
            );

            if (riverMode === "dual") {
                var r2Pts = [
                    { x: Math.round(270 + (rnd() - 0.5) * 40), y: 25 },
                    { x: Math.round(410 + (rnd() - 0.5) * 35), y: 175 },
                    { x: Math.round(r1Pts[3].x - 110 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[3].y - 85) },
                    { x: r1Pts[3].x, y: r1Pts[3].y }
                ];
                var r2Path = "M " + r2Pts[0].x + " " + r2Pts[0].y + " C " + r2Pts[1].x + " " + r2Pts[1].y + ", " + r2Pts[2].x + " " + r2Pts[2].y + ", " + r2Pts[3].x + " " + r2Pts[3].y;
                rivers.push({ id: "tributary_river", name: "Horská bystřina Bystřice", width: 9, isTributary: true, color: "#0369a1", path: r2Path });
                riverPolylines.push(this.sampleBezier(r2Pts[0], r2Pts[1], r2Pts[2], r2Pts[3], 22, true));
            } else if (riverMode === "island") {
                var rIslPts = [{ x: r1Pts[1].x, y: r1Pts[1].y }, { x: 520, y: 210 }, { x: 460, y: 510 }, { x: r1Pts[4].x, y: r1Pts[4].y }];
                var rIslPath = "M " + rIslPts[0].x + " " + rIslPts[0].y + " C " + rIslPts[1].x + " " + rIslPts[1].y + ", " + rIslPts[2].x + " " + rIslPts[2].y + ", " + rIslPts[3].x + " " + rIslPts[3].y;
                rivers.push({ id: "island_branch", name: "Zámecké říční rameno", width: 8, color: "#0284c7", path: rIslPath });
                riverPolylines.push(this.sampleBezier(rIslPts[0], rIslPts[1], rIslPts[2], rIslPts[3], 24, true));
            } else if (riverMode === "delta") {
                // Rozvětvené ústí (Delta řeky Doubravky do jižního moře / zátoky)
                var dLeftPts = [
                    { x: r1Pts[4].x, y: r1Pts[4].y },
                    { x: Math.round(r1Pts[5].x - 65 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[5].y - 20) },
                    { x: Math.round(r1Pts[6].x - 85 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[6].y - 30) },
                    { x: Math.round(r1Pts[6].x - 110 + (rnd() - 0.5) * 25), y: Math.round(r1Pts[6].y) }
                ];
                var dLeftPath = "M " + dLeftPts[0].x + " " + dLeftPts[0].y + " C " + dLeftPts[1].x + " " + dLeftPts[1].y + ", " + dLeftPts[2].x + " " + dLeftPts[2].y + ", " + dLeftPts[3].x + " " + dLeftPts[3].y;
                rivers.push({ id: "delta_left", name: "Západní rameno delty", width: 9, isDeltaBranch: true, color: "#0284c7", path: dLeftPath });
                riverPolylines.push(this.sampleBezier(dLeftPts[0], dLeftPts[1], dLeftPts[2], dLeftPts[3], 20, true));

                var dRightPts = [
                    { x: Math.round((r1Pts[4].x + r1Pts[5].x) / 2), y: Math.round((r1Pts[4].y + r1Pts[5].y) / 2) },
                    { x: Math.round(r1Pts[5].x + 55 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[5].y + 20) },
                    { x: Math.round(r1Pts[6].x + 70 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[6].y - 20) },
                    { x: Math.round(r1Pts[6].x + 95 + (rnd() - 0.5) * 25), y: Math.round(r1Pts[6].y) }
                ];
                var dRightPath = "M " + dRightPts[0].x + " " + dRightPts[0].y + " C " + dRightPts[1].x + " " + dRightPts[1].y + ", " + dRightPts[2].x + " " + dRightPts[2].y + ", " + dRightPts[3].x + " " + dRightPts[3].y;
                rivers.push({ id: "delta_right", name: "Východní rameno delty", width: 9, isDeltaBranch: true, color: "#0284c7", path: dRightPath });
                riverPolylines.push(this.sampleBezier(dRightPts[0], dRightPts[1], dRightPts[2], dRightPts[3], 20, true));
            }
        }

        var bridges = [];
        for (var ndIdx = 0; ndIdx < nodes.length; ndIdx++) {
            var nA = nodes[ndIdx];
            var tgts = nA.next ? nA.next.slice() : [];
            if (nA.branchHigh !== null && nA.branchHigh !== undefined && tgts.indexOf(nA.branchHigh) === -1) tgts.push(nA.branchHigh);
            for (var tg = 0; tg < tgts.length; tg++) {
                var nB = nodes[tgts[tg]];
                if (!nB) continue;
                for (var pIdx = 0; pIdx < riverPolylines.length; pIdx++) {
                    var rPoly = riverPolylines[pIdx];
                    var foundHit = false;
                    for (var rp = 0; rp < rPoly.length - 1; rp++) {
                        var hit = this.lineIntersection(nA, nB, rPoly[rp], rPoly[rp + 1]);
                        if (hit) {
                            var tooClose = false;
                            for (var eb = 0; eb < bridges.length; eb++) {
                                var dx = bridges[eb].x - hit.x, dy = bridges[eb].y - hit.y;
                                if (dx * dx + dy * dy < 625) { tooClose = true; break; }
                            }
                            if (!tooClose) {
                                var cType = "stone_arch";
                                var hasTownOrCastle = (nA && (nA.type === "castle" || nA.type === "town" || nA.type === "start")) ||
                                                      (nB && (nB.type === "castle" || nB.type === "town" || nB.type === "start"));
                                var hasVillage = (nA && (nA.type === "village" || nA.type === "tavern" || nA.type === "trade" || nA.type === "craft")) ||
                                                 (nB && (nB.type === "village" || nB.type === "tavern" || nB.type === "trade" || nB.type === "craft"));
                                if (hasTownOrCastle) cType = "stone_arch";
                                else if (hasVillage) cType = "wood_plank";
                                else cType = (bridges.length % 2 === 0) ? "stone_ford" : "wood_plank";
                                bridges.push({ x: hit.x, y: hit.y, angle: hit.angle, nodeAId: nA.id, nodeBId: nB.id, crossingType: cType });
                            }
                            foundHit = true;
                            break;
                        }
                    }
                    if (foundHit) break;
                }
            }
        }

        // 8. Biomy a dominanty
        var mtnFill = (biomeTheme === "dragon_peaks") ? "rgba(127, 29, 29, 0.58)" : "rgba(68, 64, 60, 0.55)";
        var fstFill = (biomeTheme === "forest_realm") ? "rgba(20, 83, 45, 0.62)" : "rgba(22, 101, 52, 0.50)";
        var mdwFill = (biomeTheme === "golden_plains") ? "rgba(217, 119, 6, 0.54)" : "rgba(202, 138, 4, 0.42)";
        var wtrFill = (biomeTheme === "river_delta") ? "rgba(3, 105, 161, 0.58)" : "rgba(14, 116, 144, 0.48)";

        var biomes = [
            { id: "mountain_ridge", name: "Dračí pohoří & Skalní srázy", fillGrad: "mountainBiomeGrad", fill: mtnFill, opacity: 0.82, path: "M 960 60 C 1150 40 1350 180 1370 420 C 1380 620 1250 780 1080 770 C 1040 550 1020 320 960 60 Z", contours: ["M 1040 120 Q 1200 90 1280 260 Q 1320 450 1240 650", "M 1080 180 Q 1220 160 1270 340 Q 1280 520 1190 680"], contourStroke: "rgba(251,191,36,0.38)", contourDash: "8,5" },
            { id: "forest_deep", name: "Královský hvozd Doubrava", fillGrad: "forestBiomeGrad", fill: fstFill, opacity: 0.78, path: "M 280 60 C 460 50 680 70 660 220 C 520 280 320 320 150 280 C 100 160 180 70 280 60 Z", contours: ["M 260 90 Q 420 80 560 180 Q 450 240 280 250", "M 180 150 Q 320 160 480 210"], contourStroke: "rgba(134,239,172,0.30)", contourDash: "6,6" },
            { id: "meadows_valley", name: "Královské louky a lánová pole", fillGrad: "meadowsBiomeGrad", fill: mdwFill, opacity: 0.75, path: "M 180 620 C 350 560 600 580 620 780 C 500 830 280 840 150 790 C 120 720 130 650 180 620 Z", contours: ["M 220 660 Q 380 610 540 680", "M 260 720 Q 410 670 510 750"], contourStroke: "rgba(253,224,71,0.32)", contourDash: "5,5" }
        ];

        var cardZones = [
            { code: "VECI_1", title: "VĚCI 1", subtitle: "2 500 zl.", icon: "🗡️", color: "#60a5fa", x: 440, y: 155, w: 90, h: 96, actionTier: 1, count: 9 },
            { code: "VECI_2", title: "VĚCI 2", subtitle: "7 000 zl.", icon: "⚔️", color: "#a855f7", x: 550, y: 155, w: 90, h: 96, actionTier: 2, count: 7 },
            { code: "VECI_3", title: "VĚCI 3", subtitle: "12 000 zl.", icon: "👑", color: "#f59e0b", x: 660, y: 155, w: 90, h: 96, actionTier: 3, count: 4 },
            { code: "ZVER_U1", title: "ZVĚŘ", subtitle: "Obtížnost 4–6", icon: "🐗", color: "#4ade80", x: 920, y: 165, w: 100, h: 78, count: 14 },
            { code: "MONSTRA_U2", title: "MONSTRA", subtitle: "Obtížnost 8–15", icon: "👹", color: "#fb923c", x: 950, y: 265, w: 100, h: 78, count: 22 },
            { code: "DRACI_U3", title: "DRACI", subtitle: "Obtížnost 11–17", icon: "🐉", color: "#f43f5e", x: 980, y: 365, w: 100, h: 78, count: 20 },
            { code: "NAHODA_N", title: "NÁHODA", subtitle: "Karty osudu", icon: "❓", color: "#eab308", x: 250, y: 395, w: 76, h: 96, count: 24 },
            { code: "SLAVNOST_S", title: "SLAVNOSTI", subtitle: "Turnaj & ples", icon: "🎪", color: "#ec4899", x: 505, y: 415, w: 76, h: 86, count: 3 }
        ];

        var landmarks = [
            { id: "royalCastle", name: royalDef.name, icon: royalDef.icon || "👑", image: royalDef.img, x: 700, y: 380, w: 220, h: 180 },
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.png", x: 1085, y: 625, w: 140, h: 120 }
        ];

        var normalizedOpts = {
            nodeCount: nodes.length,
            branches: activeBranchCount,
            masterTier: chosenMasterTier,
            animalSetCount: r.animalLevels.length,
            riverMode: riverMode,
            dangerLevel: (r.questsU3 >= 3 ? "high" : (r.questsU3 === 0 ? "low" : "standard")),
            biomeTheme: biomeTheme,
            royalCastle: r.royalCastle || "auto",
            seed: seed
        };
        var boardSeedCode = this.formatSeedCode(seed, normalizedOpts);
        var displayName = r.customName || ("Dynamické království #" + seed + " (" + nodes.length + " polí)");

        normalizedOpts.routeShape = shapeKey;
        var boardObj = {
            code: "custom_dynamic",
            seedCode: boardSeedCode,
            routeShape: shapeKey,
            masterTier: (chosenMasterTier === 5 ? 2 : chosenMasterTier),
            graduatedMasters: (chosenMasterTier === 5),
            recipe: r,
            options: normalizedOpts,
            stats: {
                totalNodes: nodes.length,
                outerNodes: outerLen,
                branches: activeBranchCount,
                animalSets: r.animalLevels.length,
                animalLevels: r.animalLevels.slice(),
                castles: r.castles,
                towns: r.towns,
                villages: r.villages,
                jesters: r.jesters,
                buildings: r.buildings,
                masters: r.masters,
                merchants: r.merchants,
                festivals: r.festivals,
                chances: r.chances,
                questsU1: r.questsU1,
                questsU2: r.questsU2,
                dragons: r.questsU3,
                bridges: bridges.length,
                estMinutes: Math.round(nodes.length * 0.65),
                scenariosValid: (r.castles >= 1 && (r.towns + r.villages) >= 3 && r.questsU3 >= 1)
            },
            name: displayName,
            seed: seed,
            nodes: nodes,
            cardZones: cardZones,
            landmarks: landmarks,
            biomes: biomes,
            rivers: rivers,
            bridges: bridges
        };

        if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks === "function") {
            window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks(boardObj);
        }
        return boardObj;
    },

    // ========================================================================
    // HLAVNÍ METODA PARAMETRICKÉHO GENERÁTORU MAP 2.0
    // ========================================================================
    generate: function (customSeed, options) {
        options = options || {};
        if (options.generatorOptions && typeof options.generatorOptions === "object") {
            for (var k in options.generatorOptions) {
                if (options[k] === undefined) options[k] = options.generatorOptions[k];
            }
        }
        if (options.customRecipe && typeof options.customRecipe === "object") {
            return this.compileDynamicRecipe(options.customRecipe, customSeed || options.seed);
        }
        if (Array.isArray(options.animalLevels) || options.villages !== undefined || options.jesters !== undefined) {
            return this.compileDynamicRecipe(options, customSeed || options.seed);
        }

        var seed = Math.abs(Number(customSeed || options.seed || Math.floor(Math.random() * 899999 + 100000))) % 1000000 || 4598;
        var rnd = this.createRNG(seed);

        var targetNodes = Math.max(40, Math.min(136, Number(options.nodeCount) || 78));
        var branchCount = (options.branches !== undefined) ? Math.max(1, Math.min(4, Number(options.branches))) : 3;
        var chosenMasterTier = Number(options.masterTier) || 2; // 1..4, nebo 5 = Stupňovaný RPG I-IV
        var animalSetCount = Math.max(4, Math.min(14, Number(options.animalSetCount) || 6));
        var riverMode = options.riverMode || "single"; // "none" | "single" | "dual" | "island"
        var dangerLevel = options.dangerLevel || "standard"; // "low" | "standard" | "high"
        var biomeTheme = options.biomeTheme || "balanced"; // "balanced" | "dragon_peaks" | "forest_realm" | "river_delta" | "golden_plains"

        // Max počet sad zvířat omezený velikostí mapy, aby zbylo místo na hrady, města, mistry a úkoly
        var maxPossibleSets = Math.max(4, Math.floor((targetNodes - 24) / 3));
        if (animalSetCount > maxPossibleSets) {
            animalSetCount = maxPossibleSets;
        }

        // 1. VÝPOČET DÉLEK VĚTVÍ A HLAVNÍHO OKRUHU (Přesný součet = targetNodes)
        var scaleF = targetNodes / 96;
        var b1Len = (branchCount >= 1) ? Math.max(6, Math.round(11 * scaleF)) : 0; // Střední Most Slavností
        var b2Len = (branchCount >= 2) ? Math.max(6, Math.round(11 * scaleF)) : 0; // Pravá Dračí stezka
        var b3Len = (branchCount >= 3) ? Math.max(5, Math.round(7 * scaleF)) : 0;  // Levá Lesní smyčka
        var b4Len = (branchCount >= 4) ? Math.max(5, Math.round(8 * scaleF)) : 0;  // Severní Královská hřebenovka

        var totalBranchLen = b1Len + b2Len + b3Len + b4Len;
        var outerLen = targetNodes - totalBranchLen;
        if (outerLen < 30) {
            var deficit = 30 - outerLen;
            while (deficit > 0 && (b1Len > 4 || b2Len > 4 || b3Len > 3 || b4Len > 3)) {
                if (b2Len > 4 && deficit > 0) { b2Len--; deficit--; }
                if (b1Len > 4 && deficit > 0) { b1Len--; deficit--; }
                if (b4Len > 3 && deficit > 0) { b4Len--; deficit--; }
                if (b3Len > 3 && deficit > 0) { b3Len--; deficit--; }
            }
            outerLen = targetNodes - (b1Len + b2Len + b3Len + b4Len);
        }

        // Rozdělení outerLen do 5 segmentů po obvodu
        var sTop = Math.max(6, Math.round(outerLen * 0.18));
        var sRight = Math.max(7, Math.round(outerLen * 0.23));
        var sBottom = Math.max(8, Math.round(outerLen * 0.26));
        var sLeft1 = Math.max(6, Math.round(outerLen * 0.19));
        var sLeft2 = Math.max(4, outerLen - (sTop + sRight + sBottom + sLeft1));

        // 2. GEOMETRIE HLAVNÍHO OKRUHU (Se zvlněním podle seedu)
        var topWarp = (rnd() - 0.5) * 56;
        var rightWarp = (rnd() - 0.5) * 46;
        var bottomWarp = (rnd() - 0.5) * 54;
        var leftWarp = (rnd() - 0.5) * 46;

        var pStart = { x: 500, y: Math.round(74 + topWarp * 0.2) };
        var pTopRight = { x: Math.round(1150 + rightWarp * 0.3), y: Math.round(108 + topWarp * 0.3) };
        var pBottomRight = { x: Math.round(1145 + rightWarp * 0.4), y: Math.round(772 + bottomWarp * 0.3) };
        var pBottomLeft = { x: Math.round(250 - leftWarp * 0.3), y: Math.round(782 + bottomWarp * 0.2) };
        var pTopLeft = { x: Math.round(98 - leftWarp * 0.4), y: 340 };
        var pBackToStart = { x: 445, y: Math.round(74 + topWarp * 0.2) };

        var segTopPts = this.sampleBezier(pStart, { x: 740, y: Math.round(68 + topWarp) }, { x: 970, y: Math.round(72 + topWarp) }, pTopRight, sTop, false);
        var segRightPts = this.sampleBezier(pTopRight, { x: Math.round(1345 + rightWarp), y: 310 }, { x: Math.round(1340 + rightWarp), y: 615 }, pBottomRight, sRight, false);
        var segBottomPts = this.sampleBezier(pBottomRight, { x: 840, y: Math.round(802 + bottomWarp) }, { x: 540, y: Math.round(802 + bottomWarp) }, pBottomLeft, sBottom, false);
        var segLeft1Pts = this.sampleBezier(pBottomLeft, { x: Math.round(68 - leftWarp), y: 730 }, { x: Math.round(68 - leftWarp), y: 500 }, pTopLeft, sLeft1, false);
        var segLeft2Pts = this.sampleBezier(pTopLeft, { x: 120, y: 105 }, { x: 285, y: 72 }, pBackToStart, sLeft2, true);

        var mainPts = segTopPts.concat(segRightPts).concat(segBottomPts).concat(segLeft1Pts).concat(segLeft2Pts);
        outerLen = mainPts.length;

        // 3. VÝBĚR KRÁLOVSKÉHO SÍDLA A TEMATICKÝCH HRADŮ
        var royalDef = this.resolveRoyalCastle(options.royalCastle, biomeTheme, seed);
        var pool = this.ALL_CASTLES.filter(function (c) { return c.id !== royalDef.id; });
        for (var cIdx = pool.length - 1; cIdx > 0; cIdx--) {
            var swapIdx = Math.floor(rnd() * (cIdx + 1));
            var temp = pool[cIdx];
            pool[cIdx] = pool[swapIdx];
            pool[swapIdx] = temp;
        }
        var castleH1 = pool[0];
        var castleH2 = pool[1] || pool[0];

        // 4. INDEXY KŘIŽOVATEK PRO 1..4 VĚTVE NA HLAVNÍM OKRUHU
        // Větev 1 (Most Slavností): z pravého dolního kvadrantu do levého dolního kvadrantu
        var j1Start = Math.max(4, Math.min(outerLen - 6, Math.round(outerLen * 0.47)));
        var j1End = Math.max(j1Start + 3, Math.min(outerLen - 3, Math.round(outerLen * 0.66)));

        // Větev 2 (Dračí stezka): z pravého horního rohu do pravého dolního rohu
        var j2Start = Math.max(2, Math.min(j1Start - 2, Math.round(outerLen * 0.17)));
        var j2End = Math.max(j2Start + 3, Math.min(j1Start - 1, Math.round(outerLen * 0.40)));

        // Větev 3 (Levá Lesní smyčka): z levého horního oblouku zpět do levého středu
        var j3Start = Math.max(j1End + 3, Math.min(outerLen - 2, Math.round(outerLen * 0.93)));
        var j3End = Math.max(j1End + 2, Math.min(j3Start - 2, Math.round(outerLen * 0.81)));

        // Větev 4 (Severní Královská hřebenovka): kousek za STARTem do pravého horního středu
        var j4Start = Math.max(2, Math.min(j2Start - 2, Math.round(outerLen * 0.06)));
        var j4End = Math.max(j2Start + 2, Math.min(j2End - 2, Math.round(outerLen * 0.27)));

        // Pomocná funkce pro přiřazení stupně Mistra podle zvoleného režimu (1..4 nebo 5 = Stupňovaný RPG)
        function resolveMasterNodeTier(progressRatio, isGrandmaster) {
            if (isGrandmaster) return 4;
            if (chosenMasterTier === 5) {
                if (progressRatio < 0.28) return 1;
                if (progressRatio < 0.58) return 2;
                if (progressRatio < 0.85) return 3;
                return 4;
            }
            return Math.max(1, Math.min(4, chosenMasterTier));
        }

        // 5. SESTAVENÍ OBSAHU POLÍČEK (CONSTRAINT SOLVER)
        // Rozdělíme chovné sady mezi hlavní okruh a aktivní větve tak, aby každá trojice (K, S, P) držela pohromadě!
        var branchSets = [];
        var outerSetsCount = animalSetCount;
        if (branchCount >= 2 && animalSetCount >= 5) {
            branchSets.push({ branch: 2, setId: animalSetCount });
            outerSetsCount--;
        }
        if (branchCount >= 3 && animalSetCount >= 6) {
            branchSets.push({ branch: 3, setId: outerSetsCount });
            outerSetsCount--;
        }
        if (branchCount >= 4 && animalSetCount >= 8) {
            branchSets.push({ branch: 4, setId: outerSetsCount });
            outerSetsCount--;
        }

        // Sestavení fronty speciálních polí pro hlavní okruh (mimo START a chovné sady)
        var outerSlotCount = outerLen - 1; // uzel 0 je vždy START
        var outerAnimalNodesCount = outerSetsCount * 3;

        // Garantované jádro infrastruktury, měst, vesnic, mistrů a úkolů na hlavním okruhu
        var corePool = [
            { code: "HOSP", type: "HOSPITAL", name: "Královský lazaret", icon: "🏥" },
            { code: "SATL", type: "PRISON", name: "Královská šatlava", icon: "⛓️" },
            { code: "KRCMA", type: "TAVERN", name: "Krčma U Zlatého korbelu", icon: "🍺" },
            { code: "VD1", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "M2", type: "TOWN", estateId: "M2", name: "Město 2 (Stříbratec)", icon: "🏙️" },
            { code: "M3", type: "TOWN", estateId: "M3", name: "Město 3 (Zlatov)", icon: "🏙️" },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true },
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2 (Lhotka)", icon: "🏘️", hasRoof: true },
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️", hasRoof: false },
            { code: "V5", type: "VILLAGE", estateId: "V5", name: "Vesnice 5 (Skalice)", icon: "🏘️", hasRoof: true },
            { code: "V6", type: "VILLAGE", estateId: "V6", name: "Vesnice 6 (Meziříčí)", icon: "🏘️", hasRoof: false },
            { code: "MB1", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️" },
            { code: "MJ1", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃" },
            { code: "MCH1", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️" },
            { code: "STAJE1", type: "BUILDING", subtype: "stables", name: "Královské stáje", icon: "🏠" },
            { code: "KOV1", type: "BUILDING", subtype: "forge", name: "Cechovní kovárna", icon: "⚒️" },
            { code: "SOK1", type: "BUILDING", subtype: "falconer", name: "Královský sokolník", icon: "🦅" },
            { code: "PSOV1", type: "BUILDING", subtype: "doghandler", name: "Psovod a smečka", icon: "🦴" },
            { code: "KREJ1", type: "BUILDING", subtype: "tailor", name: "Dvorní krejčí", icon: "🧵" },
            { code: "OBCHOD1", type: "MERCHANT", name: "Královský obchodník", icon: "⚖️" },
            { code: "OBCHOD2", type: "MERCHANT", name: "Kupecký trh", icon: "⚖️" },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1", icon: "🃏" },
            { code: "KE2", type: "JESTER", jesterId: 2, name: "Kejklíř 2", icon: "🃏" },
            { code: "KE3", type: "JESTER", jesterId: 3, name: "Kejklíř 3", icon: "🃏" },
            { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "U2_1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" }
        ];

        // Pokud není aktivní Větev 2 (Dračí), garantujeme Hrad 2, Město 4 a 2 Dračí sluje přímo na hlavním okruhu!
        if (branchCount < 2) {
            corePool.unshift(
                { code: "H2", type: "CASTLE", estateId: "H2", name: castleH2.name, icon: castleH2.icon, castleImg: castleH2.img },
                { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
                { code: "U3_1", type: "QUEST", subtype: "U3", name: "Dračí sluj I (U3)", icon: "🐉" },
                { code: "U3_2", type: "QUEST", subtype: "U3", name: "Tříhlavý drak II (U3)", icon: "🐲" }
            );
        }
        // Pokud není aktivní Větev 3 (Levá), garantujeme Hrad 1 na hlavním okruhu!
        if (branchCount < 3) {
            corePool.unshift(
                { code: "H1", type: "CASTLE", estateId: "H1", name: castleH1.name, icon: castleH1.icon, castleImg: castleH1.img }
            );
        }

        // Škálování nebezpečí (dangerLevel)
        if (dangerLevel === "high") {
            corePool.push(
                { code: "U2_H1", type: "QUEST", subtype: "U2", name: "Bájné monstrum (U2)", icon: "👹" },
                { code: "U2_H2", type: "QUEST", subtype: "U2", name: "Titán divočiny (U2)", icon: "👹" },
                { code: "U3_H1", type: "QUEST", subtype: "U3", name: "Prastará dračí sluj (U3)", icon: "🐉" }
            );
        } else if (dangerLevel === "standard") {
            corePool.push(
                { code: "U1_S1", type: "QUEST", subtype: "U1", name: "Lesní revír (U1)", icon: "🐗" },
                { code: "U2_S1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" }
            );
        }

        // Doplňková pole pro větší mapy (96, 112, 128)
        var extraFillerPool = [
            { code: "V8", type: "VILLAGE", estateId: "V8", name: "Vesnice 8 (Podhradí)", icon: "🏘️", hasRoof: false },
            { code: "OBCHOD3", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "STAJE2", type: "BUILDING", subtype: "stables", name: "Stáje 2", icon: "🏠" },
            { code: "KOV2", type: "BUILDING", subtype: "forge", name: "Kovárna 2", icon: "⚒️" },
            { code: "KE4", type: "JESTER", jesterId: 4, name: "Kejklíř 4", icon: "🃏" },
            { code: "MJ2", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "MCH2", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "OBCHOD4", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "SOK2", type: "BUILDING", subtype: "falconer", name: "Sokolník 2", icon: "🦅" },
            { code: "KE5", type: "JESTER", jesterId: 5, name: "Kejklíř 5", icon: "🃏" },
            { code: "U1_3", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" }
        ];

        var nonAnimalNeeded = Math.max(8, outerSlotCount - outerAnimalNodesCount);
        var selectedNonAnimals = corePool.slice(0, nonAnimalNeeded);
        var fIdx = 0;
        var chanceCounter = 1;
        while (selectedNonAnimals.length < nonAnimalNeeded) {
            if (fIdx < extraFillerPool.length && rnd() > 0.35) {
                selectedNonAnimals.push(extraFillerPool[fIdx++]);
            } else {
                selectedNonAnimals.push({ code: "N" + (chanceCounter++), type: "CHANCE", name: "Náhoda", icon: "❓" });
            }
        }

        // Proložíme ucelené trojice zvířat (setId 1..outerSetsCount) mezi selectedNonAnimals
        // Každá sada K-S-P je vložena blízko sebe (s 1 vloženým polem uprostřed), takže tvoří kompaktní chovný revír!
        var outerDefs = [{ code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰" }];
        var naCursor = 0;
        for (var sId = 1; sId <= outerSetsCount; sId++) {
            var cat = this.ANIMAL_SETS_CATALOG[sId - 1];
            var remainingSets = outerSetsCount - sId + 1;
            var remainingNA = selectedNonAnimals.length - naCursor;
            var chunkNA = Math.max(1, Math.floor(remainingNA / remainingSets));

            // 1. Zvíře sady (Kůň)
            outerDefs.push({ code: "K" + sId, type: "ANIMAL", subtype: "horse", setId: sId, name: cat.horse, icon: "🐎" });
            // Vložíme 1 ne-zvířecí pole mezi Koně a Sokola
            if (naCursor < selectedNonAnimals.length) {
                outerDefs.push(selectedNonAnimals[naCursor++]);
                chunkNA--;
            }
            // 2. Zvíře sady (Sokol)
            outerDefs.push({ code: "S" + sId, type: "ANIMAL", subtype: "falcon", setId: sId, name: cat.falcon, icon: "🦅" });
            // 3. Zvíře sady (Pes)
            outerDefs.push({ code: "P" + sId, type: "ANIMAL", subtype: "dog", setId: sId, name: cat.dog, icon: "🐕" });

            // Zbytek přídělu ne-zvířecích polí za sadou
            while (chunkNA > 0 && naCursor < selectedNonAnimals.length) {
                outerDefs.push(selectedNonAnimals[naCursor++]);
                chunkNA--;
            }
        }
        while (naCursor < selectedNonAnimals.length && outerDefs.length < outerLen) {
            outerDefs.push(selectedNonAnimals[naCursor++]);
        }
        while (outerDefs.length < outerLen) {
            outerDefs.push({ code: "N" + (chanceCounter++), type: "CHANCE", name: "Náhoda", icon: "❓" });
        }
        outerDefs = outerDefs.slice(0, outerLen);

        // Vytvoření uzlů hlavního okruhu
        var nodes = [];
        for (var i = 0; i < outerLen; i++) {
            var d = outerDefs[i];
            var pt = mainPts[i];
            var prog = i / outerLen;
            var mTierVal = (d.type === "MASTER") ? resolveMasterNodeTier(prog, d.skill === "any") : null;
            nodes.push({
                id: i,
                code: d.code,
                type: d.type,
                subtype: d.subtype || null,
                setId: d.setId || null,
                estateId: d.estateId || null,
                castleImg: d.castleImg || null,
                castleId: d.castleId || null,
                jesterId: d.jesterId || null,
                skill: d.skill || null,
                masterTier: mTierVal,
                hasRoof: !!d.hasRoof,
                isJunction: false,
                branchTag: "main",
                name: d.name,
                icon: d.icon,
                x: pt.x,
                y: pt.y,
                next: [(i + 1) % outerLen],
                branchLow: null,
                branchHigh: null
            });
        }

        // Pomocná funkce pro stavbu vnitřní větve mezi uzly jStart -> jEnd
        var self = this;
        function attachBranch(jStartIdx, jEndIdx, cp1, cp2, bDefs, tag) {
            if (!bDefs || bDefs.length === 0) return;
            var nStart = nodes[jStartIdx];
            var nEnd = nodes[jEndIdx];
            var p0 = { x: Math.round(nStart.x * 0.85 + cp1.x * 0.15), y: Math.round(nStart.y * 0.85 + cp1.y * 0.15) };
            var p3 = { x: Math.round(nEnd.x * 0.85 + cp2.x * 0.15), y: Math.round(nEnd.y * 0.85 + cp2.y * 0.15) };
            var pts = self.sampleBezier(p0, cp1, cp2, p3, bDefs.length, true);

            var firstId = nodes.length;
            for (var k = 0; k < bDefs.length; k++) {
                var bd = bDefs[k];
                var bpt = pts[k];
                var nid = nodes.length;
                var mTierVal = (bd.type === "MASTER") ? resolveMasterNodeTier(0.75, bd.skill === "any") : null;
                nodes.push({
                    id: nid,
                    code: bd.code,
                    type: bd.type,
                    subtype: bd.subtype || null,
                    setId: bd.setId || null,
                    estateId: bd.estateId || null,
                    castleImg: bd.castleImg || null,
                    castleId: bd.castleId || null,
                    jesterId: bd.jesterId || null,
                    skill: bd.skill || null,
                    masterTier: mTierVal,
                    hasRoof: !!bd.hasRoof,
                    isJunction: false,
                    branchTag: tag,
                    name: bd.name,
                    icon: bd.icon,
                    x: bpt.x,
                    y: bpt.y,
                    next: [k < bDefs.length - 1 ? nid + 1 : jEndIdx],
                    branchLow: null,
                    branchHigh: null
                });
            }
            nStart.isJunction = true;
            nStart.branchLow = (jStartIdx + 1) % outerLen;
            nStart.branchHigh = firstId;
        }

        // VĚTEV 1: Střední Most Slavností (vždy přítomná při branches >= 1)
        if (branchCount >= 1 && b1Len > 0) {
            var b1Template = [
                { code: "SLAV_BRANA", type: "CHANCE", name: "Slavnostní brána", icon: "🎪" },
                { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️" },
                { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "tournament", name: "SLAVNOST: Královský Turnaj ♡", icon: "💖" },
                { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ball", name: "SLAVNOST: Zámecký Ples ♡", icon: "💖" },
                { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "race", name: "SLAVNOST: Velký Závod ♡", icon: "💖" },
                { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 (Slunečná)", icon: "🏘️", hasRoof: true },
                { code: "MT_BR", type: "MASTER", skill: "tanec", name: "Mistr Dvorního Tance", icon: "💃" },
                { code: "KREJ_BR", type: "BUILDING", subtype: "tailor", name: "Slavnostní krejčí", icon: "🧵" },
                { code: "U1_BR", type: "QUEST", subtype: "U1", name: "Lov zvěře v oboře (U1)", icon: "🐗" },
                { code: "U2_BR", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
                { code: "KRCMA_BR", type: "TAVERN", name: "Hradní šenk", icon: "🍺" },
                { code: "MCH_BR", type: "MASTER", skill: "charisma", name: "Mistr Dvornosti", icon: "✨" },
                { code: "N_BR1", type: "CHANCE", name: "Náhoda u mostu", icon: "❓" },
                { code: "N_BR2", type: "CHANCE", name: "Náhoda pod hradem", icon: "❓" }
            ];
            while (b1Template.length < b1Len) {
                b1Template.push({ code: "N_BR" + b1Template.length, type: "CHANCE", name: "Náhoda", icon: "❓" });
            }
            attachBranch(
                j1Start,
                j1End,
                { x: Math.round(740 + (rnd() - 0.5) * 45), y: 545 },
                { x: Math.round(450 + (rnd() - 0.5) * 45), y: 545 },
                b1Template.slice(0, b1Len),
                "festival"
            );
        }

        // VĚTEV 2: Pravá Dračí stezka & Hrad 2 (při branches >= 2)
        if (branchCount >= 2 && b2Len > 0) {
            var b2Set = null;
            for (var bs2 = 0; bs2 < branchSets.length; bs2++) {
                if (branchSets[bs2].branch === 2) b2Set = this.ANIMAL_SETS_CATALOG[branchSets[bs2].setId - 1];
            }
            var b2Template = [
                { code: "U3_1", type: "QUEST", subtype: "U3", name: "Dračí sluj I (U3)", icon: "🐉" },
                { code: "U3_2", type: "QUEST", subtype: "U3", name: "Tříhlavý drak II (U3)", icon: "🐲" },
                { code: "H2", type: "CASTLE", estateId: "H2", name: castleH2.name, icon: castleH2.icon, castleImg: castleH2.img },
                { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
                { code: "VM2", type: "MASTER", skill: "any", name: "Velmistr Dračího řádu", icon: "🧙‍♂️" },
                { code: "U2_R1", type: "QUEST", subtype: "U2", name: "Horské monstrum (U2)", icon: "👹" }
            ];
            if (b2Set) {
                b2Template.splice(1, 0,
                    { code: "P" + b2Set.setId, type: "ANIMAL", subtype: "dog", setId: b2Set.setId, name: b2Set.dog, icon: "🐕" },
                    { code: "S" + b2Set.setId, type: "ANIMAL", subtype: "falcon", setId: b2Set.setId, name: b2Set.falcon, icon: "🦅" },
                    { code: "K" + b2Set.setId, type: "ANIMAL", subtype: "horse", setId: b2Set.setId, name: b2Set.horse, icon: "🐎" }
                );
            }
            b2Template.push(
                { code: "KOV_R", type: "BUILDING", subtype: "forge", name: "Hradní zbrojíř", icon: "⚒️" },
                { code: "U2_R2", type: "QUEST", subtype: "U2", name: "Strážce průsmyku (U2)", icon: "👹" },
                { code: "MB_R", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️" },
                { code: "N_R1", type: "CHANCE", name: "Horská náhoda", icon: "❓" }
            );
            while (b2Template.length < b2Len) {
                b2Template.push({ code: "N_R" + b2Template.length, type: "CHANCE", name: "Náhoda", icon: "❓" });
            }
            attachBranch(
                j2Start,
                j2End,
                { x: Math.round(1045 + (rnd() - 0.5) * 40), y: 315 },
                { x: Math.round(1155 + (rnd() - 0.5) * 40), y: 525 },
                b2Template.slice(0, b2Len),
                "dragon"
            );
        }

        // VĚTEV 3: Levá Lesní smyčka & Hrad 1 (při branches >= 3)
        if (branchCount >= 3 && b3Len > 0) {
            var b3Set = null;
            for (var bs3 = 0; bs3 < branchSets.length; bs3++) {
                if (branchSets[bs3].branch === 3) b3Set = this.ANIMAL_SETS_CATALOG[branchSets[bs3].setId - 1];
            }
            var b3Template = [
                { code: "H1", type: "CASTLE", estateId: "H1", name: castleH1.name, icon: castleH1.icon, castleImg: castleH1.img },
                { code: "U2_L1", type: "QUEST", subtype: "U2", name: "Lesní monstrum (U2)", icon: "👹" },
                { code: "SOK_L", type: "BUILDING", subtype: "falconer", name: "Lesní sokolník", icon: "🦅" },
                { code: "MT_L", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃" }
            ];
            if (b3Set) {
                b3Template.splice(1, 0,
                    { code: "S" + b3Set.setId, type: "ANIMAL", subtype: "falcon", setId: b3Set.setId, name: b3Set.falcon, icon: "🦅" },
                    { code: "K" + b3Set.setId, type: "ANIMAL", subtype: "horse", setId: b3Set.setId, name: b3Set.horse, icon: "🐎" },
                    { code: "P" + b3Set.setId, type: "ANIMAL", subtype: "dog", setId: b3Set.setId, name: b3Set.dog, icon: "🐕" }
                );
            }
            while (b3Template.length < b3Len) {
                b3Template.push({ code: "U1_L" + b3Template.length, type: "QUEST", subtype: "U1", name: "Hluboký hvozd (U1)", icon: "🐗" });
            }
            attachBranch(
                j3Start,
                j3End,
                { x: Math.round(350 + (rnd() - 0.5) * 35), y: 225 },
                { x: Math.round(235 + (rnd() - 0.5) * 35), y: 310 },
                b3Template.slice(0, b3Len),
                "forest"
            );
        }

        // VĚTEV 4: Severní Královská Hřebenovka (při branches >= 4)
        if (branchCount >= 4 && b4Len > 0) {
            var b4Set = null;
            for (var bs4 = 0; bs4 < branchSets.length; bs4++) {
                if (branchSets[bs4].branch === 4) b4Set = this.ANIMAL_SETS_CATALOG[branchSets[bs4].setId - 1];
            }
            var b4Template = [
                { code: "VM_N", type: "MASTER", skill: "any", name: "Severní Velmistr", icon: "🧙‍♂️" },
                { code: "U2_N1", type: "QUEST", subtype: "U2", name: "Strážce hřebene (U2)", icon: "👹" },
                { code: "OBCHOD_N", type: "MERCHANT", name: "Horský kupec", icon: "⚖️" },
                { code: "V9", type: "VILLAGE", estateId: "V8", name: "Vesnice 9 (Větrná)", icon: "🏘️", hasRoof: true }
            ];
            if (b4Set) {
                b4Template.splice(1, 0,
                    { code: "K" + b4Set.setId, type: "ANIMAL", subtype: "horse", setId: b4Set.setId, name: b4Set.horse, icon: "🐎" },
                    { code: "S" + b4Set.setId, type: "ANIMAL", subtype: "falcon", setId: b4Set.setId, name: b4Set.falcon, icon: "🦅" },
                    { code: "P" + b4Set.setId, type: "ANIMAL", subtype: "dog", setId: b4Set.setId, name: b4Set.dog, icon: "🐕" }
                );
            }
            while (b4Template.length < b4Len) {
                b4Template.push({ code: "N_N" + b4Template.length, type: "CHANCE", name: "Náhoda na hřebeni", icon: "❓" });
            }
            attachBranch(
                j4Start,
                j4End,
                { x: Math.round(620 + (rnd() - 0.5) * 40), y: 185 },
                { x: Math.round(920 + (rnd() - 0.5) * 40), y: 215 },
                b4Template.slice(0, b4Len),
                "ridge"
            );
        }

        // 6. PROCEDURÁLNÍ VODNÍ SÍŤ A AUTOMATICKÉ KAMENNÉ MOSTY (none | single | dual | island)
        var rivers = [];
        var riverPolylines = [];

        if (riverMode !== "none") {
            // Hlavní královská řeka Doubravka
            var m1 = (rnd() - 0.5) * 45;
            var m2 = (rnd() - 0.5) * 55;
            var m3 = (rnd() - 0.5) * 40;
            var r1Pts = [
                { x: Math.round(1225 + (rnd() - 0.5) * 25), y: 15 },
                { x: Math.round(1185 + m1 * 0.5), y: 125 },
                { x: Math.round(1115 - m1 * 0.4), y: 275 },
                { x: Math.round(1025 + m2), y: 415 },
                { x: Math.round(915 - m2 * 0.5), y: 560 },
                { x: Math.round(775 + m3), y: 705 },
                { x: Math.round(695 + (rnd() - 0.5) * 20), y: 875 }
            ];
            var r1Path = "M " + r1Pts[0].x + " " + r1Pts[0].y + " " +
                "C " + r1Pts[1].x + " " + r1Pts[1].y + ", " + r1Pts[2].x + " " + r1Pts[2].y + ", " + r1Pts[3].x + " " + r1Pts[3].y + " " +
                "C " + r1Pts[4].x + " " + r1Pts[4].y + ", " + r1Pts[5].x + " " + r1Pts[5].y + ", " + r1Pts[6].x + " " + r1Pts[6].y;

            rivers.push({
                id: "main_river",
                name: "Královská řeka Doubravka",
                width: 14,
                color: "#0284c7",
                path: r1Path
            });

            var poly1 = this.sampleBezier(r1Pts[0], r1Pts[1], r1Pts[2], r1Pts[3], 20, false)
                .concat(this.sampleBezier(r1Pts[3], r1Pts[4], r1Pts[5], r1Pts[6], 20, true));
            riverPolylines.push(poly1);

            if (riverMode === "dual") {
                // Druhá řeka: Horská bystřina Bystřice vlévající se do Doubravky
                var r2Pts = [
                    { x: Math.round(270 + (rnd() - 0.5) * 40), y: 25 },
                    { x: Math.round(410 + (rnd() - 0.5) * 35), y: 175 },
                    { x: Math.round(r1Pts[3].x - 110 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[3].y - 85) },
                    { x: r1Pts[3].x, y: r1Pts[3].y }
                ];
                var r2Path = "M " + r2Pts[0].x + " " + r2Pts[0].y + " " +
                    "C " + r2Pts[1].x + " " + r2Pts[1].y + ", " + r2Pts[2].x + " " + r2Pts[2].y + ", " + r2Pts[3].x + " " + r2Pts[3].y;

                rivers.push({
                    id: "tributary_river",
                    name: "Horská bystřina Bystřice",
                    width: 9,
                    isTributary: true,
                    color: "#0369a1",
                    path: r2Path
                });
                riverPolylines.push(this.sampleBezier(r2Pts[0], r2Pts[1], r2Pts[2], r2Pts[3], 22, true));
            } else if (riverMode === "island") {
                // Říční ostrov obepínající střed království
                var rIslPts = [
                    { x: r1Pts[1].x, y: r1Pts[1].y },
                    { x: 520, y: 210 },
                    { x: 460, y: 510 },
                    { x: r1Pts[4].x, y: r1Pts[4].y }
                ];
                var rIslPath = "M " + rIslPts[0].x + " " + rIslPts[0].y + " " +
                    "C " + rIslPts[1].x + " " + rIslPts[1].y + ", " + rIslPts[2].x + " " + rIslPts[2].y + ", " + rIslPts[3].x + " " + rIslPts[3].y;

                rivers.push({
                    id: "island_branch",
                    name: "Zámecké říční rameno",
                    width: 8,
                    color: "#0284c7",
                    path: rIslPath
                });
                riverPolylines.push(this.sampleBezier(rIslPts[0], rIslPts[1], rIslPts[2], rIslPts[3], 24, true));
            } else if (riverMode === "delta") {
                // Rozvětvené ústí (Delta řeky Doubravky do jižního moře / zátoky)
                var dLeftPts = [
                    { x: r1Pts[4].x, y: r1Pts[4].y },
                    { x: Math.round(r1Pts[5].x - 65 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[5].y - 20) },
                    { x: Math.round(r1Pts[6].x - 85 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[6].y - 30) },
                    { x: Math.round(r1Pts[6].x - 110 + (rnd() - 0.5) * 25), y: Math.round(r1Pts[6].y) }
                ];
                var dLeftPath = "M " + dLeftPts[0].x + " " + dLeftPts[0].y + " " +
                    "C " + dLeftPts[1].x + " " + dLeftPts[1].y + ", " + dLeftPts[2].x + " " + dLeftPts[2].y + ", " + dLeftPts[3].x + " " + dLeftPts[3].y;

                rivers.push({
                    id: "delta_left",
                    name: "Západní rameno delty",
                    width: 9,
                    isDeltaBranch: true,
                    color: "#0284c7",
                    path: dLeftPath
                });
                riverPolylines.push(this.sampleBezier(dLeftPts[0], dLeftPts[1], dLeftPts[2], dLeftPts[3], 20, true));

                var dRightPts = [
                    { x: Math.round((r1Pts[4].x + r1Pts[5].x) / 2), y: Math.round((r1Pts[4].y + r1Pts[5].y) / 2) },
                    { x: Math.round(r1Pts[5].x + 55 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[5].y + 20) },
                    { x: Math.round(r1Pts[6].x + 70 + (rnd() - 0.5) * 20), y: Math.round(r1Pts[6].y - 20) },
                    { x: Math.round(r1Pts[6].x + 95 + (rnd() - 0.5) * 25), y: Math.round(r1Pts[6].y) }
                ];
                var dRightPath = "M " + dRightPts[0].x + " " + dRightPts[0].y + " " +
                    "C " + dRightPts[1].x + " " + dRightPts[1].y + ", " + dRightPts[2].x + " " + dRightPts[2].y + ", " + dRightPts[3].x + " " + dRightPts[3].y;

                rivers.push({
                    id: "delta_right",
                    name: "Východní rameno delty",
                    width: 9,
                    isDeltaBranch: true,
                    color: "#0284c7",
                    path: dRightPath
                });
                riverPolylines.push(this.sampleBezier(dRightPts[0], dRightPts[1], dRightPts[2], dRightPts[3], 20, true));
            }
        }

        // Výpočet kamenných mostů na všech průsečících cest s aktivními řekami
        var bridges = [];
        for (var ndIdx = 0; ndIdx < nodes.length; ndIdx++) {
            var nA = nodes[ndIdx];
            var tgts = nA.next ? nA.next.slice() : [];
            if (nA.branchHigh !== null && nA.branchHigh !== undefined && tgts.indexOf(nA.branchHigh) === -1) {
                tgts.push(nA.branchHigh);
            }
            for (var tg = 0; tg < tgts.length; tg++) {
                var nB = nodes[tgts[tg]];
                if (!nB) continue;
                for (var pIdx = 0; pIdx < riverPolylines.length; pIdx++) {
                    var rPoly = riverPolylines[pIdx];
                    var foundHit = false;
                    for (var rp = 0; rp < rPoly.length - 1; rp++) {
                        var hit = this.lineIntersection(nA, nB, rPoly[rp], rPoly[rp + 1]);
                        if (hit) {
                            // Zamezíme duplicitním mostům příliš blízko u sebe
                            var tooClose = false;
                            for (var eb = 0; eb < bridges.length; eb++) {
                                var dx = bridges[eb].x - hit.x;
                                var dy = bridges[eb].y - hit.y;
                                if (dx * dx + dy * dy < 625) { tooClose = true; break; }
                            }
                            if (!tooClose) {
                                var cType = "stone_arch";
                                var hasTownOrCastle = (nA && (nA.type === "castle" || nA.type === "town" || nA.type === "start")) ||
                                                      (nB && (nB.type === "castle" || nB.type === "town" || nB.type === "start"));
                                var hasVillage = (nA && (nA.type === "village" || nA.type === "tavern" || nA.type === "trade" || nA.type === "craft")) ||
                                                 (nB && (nB.type === "village" || nB.type === "tavern" || nB.type === "trade" || nB.type === "craft"));
                                if (hasTownOrCastle) cType = "stone_arch";
                                else if (hasVillage) cType = "wood_plank";
                                else cType = (bridges.length % 2 === 0) ? "stone_ford" : "wood_plank";
                                bridges.push({
                                    x: hit.x,
                                    y: hit.y,
                                    angle: hit.angle,
                                    nodeAId: nA.id,
                                    nodeBId: nB.id,
                                    crossingType: cType
                                });
                            }
                            foundHit = true;
                            break;
                        }
                    }
                    if (foundHit) break;
                }
            }
        }

        // 7. DYNAMICKÉ AKVARELOVÉ BIOMY PODLE ZVOLENÉHO TÉMATU KRAJINY
        var mtnFill = (biomeTheme === "dragon_peaks") ? "rgba(127, 29, 29, 0.58)" : "rgba(68, 64, 60, 0.55)";
        var fstFill = (biomeTheme === "forest_realm") ? "rgba(20, 83, 45, 0.62)" : "rgba(22, 101, 52, 0.50)";
        var mdwFill = (biomeTheme === "golden_plains") ? "rgba(217, 119, 6, 0.54)" : "rgba(202, 138, 4, 0.42)";
        var wtrFill = (biomeTheme === "river_delta") ? "rgba(3, 105, 161, 0.58)" : "rgba(14, 116, 144, 0.48)";

        var biomes = [
            {
                id: "mountain_ridge",
                name: "Dračí pohoří & Skalní srázy",
                fillGrad: "mountainBiomeGrad",
                fill: mtnFill,
                opacity: 0.82,
                path: "M 960 60 C 1150 40 1350 180 1370 420 C 1380 620 1250 780 1080 770 C 1040 550 1020 320 960 60 Z",
                contours: [
                    "M 1040 120 Q 1200 90 1280 260 Q 1320 450 1240 650",
                    "M 1080 180 Q 1220 160 1270 340 Q 1280 520 1190 680"
                ],
                contourStroke: "rgba(251,191,36,0.38)",
                contourDash: "8,5"
            },
            {
                id: "forest_deep",
                name: "Královský hvozd Doubrava",
                fillGrad: "forestBiomeGrad",
                fill: fstFill,
                opacity: 0.78,
                path: "M 280 60 C 460 50 680 70 660 220 C 520 280 320 320 150 280 C 100 160 180 70 280 60 Z",
                contours: [
                    "M 260 90 Q 420 80 560 180 Q 450 240 280 250",
                    "M 180 150 Q 320 160 480 210"
                ],
                contourStroke: "rgba(134,239,172,0.30)",
                contourDash: "6,6"
            },
            {
                id: "meadows_valley",
                name: "Královské louky a lánová pole",
                fillGrad: "meadowsBiomeGrad",
                fill: mdwFill,
                opacity: 0.75,
                path: "M 180 620 C 350 560 600 580 620 780 C 500 830 280 840 150 790 C 120 720 130 650 180 620 Z",
                contours: [
                    "M 220 660 Q 380 610 540 680",
                    "M 260 720 Q 410 670 510 750"
                ],
                contourStroke: "rgba(253,224,71,0.32)",
                contourDash: "5,5"
            }
        ];

        // 8. ZÓNY BALÍČKŮ KARET & DOMINANTY KRAJINY
        var cardZones = [
            { code: "VECI_1", title: "VĚCI 1", subtitle: "2 500 zl.", icon: "🗡️", color: "#60a5fa", x: 440, y: 155, w: 90, h: 96, actionTier: 1, count: 9 },
            { code: "VECI_2", title: "VĚCI 2", subtitle: "7 000 zl.", icon: "⚔️", color: "#a855f7", x: 550, y: 155, w: 90, h: 96, actionTier: 2, count: 7 },
            { code: "VECI_3", title: "VĚCI 3", subtitle: "12 000 zl.", icon: "👑", color: "#f59e0b", x: 660, y: 155, w: 90, h: 96, actionTier: 3, count: 4 },
            { code: "ZVER_U1", title: "ZVĚŘ", subtitle: "Obtížnost 4–6", icon: "🐗", color: "#4ade80", x: 920, y: 165, w: 100, h: 78, count: 14 },
            { code: "MONSTRA_U2", title: "MONSTRA", subtitle: "Obtížnost 8–15", icon: "👹", color: "#fb923c", x: 950, y: 265, w: 100, h: 78, count: 22 },
            { code: "DRACI_U3", title: "DRACI", subtitle: "Obtížnost 11–17", icon: "🐉", color: "#f43f5e", x: 980, y: 365, w: 100, h: 78, count: 20 },
            { code: "NAHODA_N", title: "NÁHODA", subtitle: "Karty osudu", icon: "❓", color: "#eab308", x: 250, y: 395, w: 76, h: 96, count: 24 },
            { code: "SLAVNOST_S", title: "SLAVNOSTI", subtitle: "Turnaj & ples", icon: "🎪", color: "#ec4899", x: 505, y: 415, w: 76, h: 86, count: 3 }
        ];

        var landmarks = [
            { id: "royalCastle", name: royalDef.name, icon: royalDef.icon || "👑", image: royalDef.img, x: 700, y: 380, w: 220, h: 180 },
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.png", x: 1085, y: 625, w: 140, h: 120 }
        ];

        // 9. STATISTIKY A VALIDACE MAPY PRO KONTROLNÍ PANEL
        var statCastles = 0, statTowns = 0, statVillages = 0, statMasters = 0, statDragons = 0;
        for (var st = 0; st < nodes.length; st++) {
            var nt = nodes[st].type;
            if (nt === "CASTLE") statCastles++;
            else if (nt === "TOWN") statTowns++;
            else if (nt === "VILLAGE") statVillages++;
            else if (nt === "MASTER") statMasters++;
            else if (nt === "QUEST" && nodes[st].subtype === "U3") statDragons++;
        }

        var normalizedOpts = {
            nodeCount: nodes.length,
            branches: branchCount,
            masterTier: chosenMasterTier,
            animalSetCount: animalSetCount,
            riverMode: riverMode,
            dangerLevel: dangerLevel,
            biomeTheme: biomeTheme,
            seed: seed
        };
        var boardSeedCode = this.formatSeedCode(seed, normalizedOpts);

        return {
            code: "procedural_" + seed,
            seedCode: boardSeedCode,
            masterTier: (chosenMasterTier === 5 ? 2 : chosenMasterTier),
            graduatedMasters: (chosenMasterTier === 5),
            options: normalizedOpts,
            stats: {
                totalNodes: nodes.length,
                outerNodes: outerLen,
                branches: branchCount,
                animalSets: animalSetCount,
                castles: statCastles,
                towns: statTowns,
                villages: statVillages,
                masters: statMasters,
                dragons: statDragons,
                bridges: bridges.length,
                estMinutes: Math.round(nodes.length * 0.65),
                scenariosValid: (statCastles >= 2 && statTowns >= 3 && statDragons >= 2)
            },
            name: "Království #" + seed + " (" + castleH1.name + " & " + castleH2.name + ")",
            seed: seed,
            nodes: nodes,
            cardZones: cardZones,
            landmarks: landmarks,
            biomes: biomes,
            rivers: rivers,
            bridges: bridges
        };

        if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks === "function") {
            window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks(boardObj);
        }
        return boardObj;
    }
};

window.PRS_BoardBuilder = {
    dbTemplates: [],
    dbTemplatesMap: {},

    get ALL_CASTLES() {
        return window.KiDeskyMapGenerator ? window.KiDeskyMapGenerator.ALL_CASTLES : [];
    },

    resolveRoyalCastle: function (key, theme, seed) {
        if (window.KiDeskyMapGenerator && typeof window.KiDeskyMapGenerator.resolveRoyalCastle === "function") {
            return window.KiDeskyMapGenerator.resolveRoyalCastle(key, theme, seed);
        }
        return { name: "Královský Hrad", icon: "👑", img: "assets/castles/castle_royal.png" };
    },

    getCastleById: function (id) {
        if (window.KiDeskyMapGenerator && typeof window.KiDeskyMapGenerator.getCastleById === "function") {
            return window.KiDeskyMapGenerator.getCastleById(id);
        }
        return null;
    },

    registerDbTemplates: function (list) {
        if (!Array.isArray(list)) return;
        this.dbTemplates = list.slice();
        this.dbTemplatesMap = {};
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (t && t.templateCode) {
                this.dbTemplatesMap[t.templateCode] = t;
            }
        }
    },

    getActiveTemplatesList: function () {
        if (this.dbTemplates && this.dbTemplates.length > 0) {
            return this.dbTemplates.filter(function (t) { return t.isActive !== false; });
        }
        return [
            { id: 1, templateCode: "classic_96", name: "Královská divočina 96 (Velký plán)", description: "Klasická velká herní deska s 96 poli, 4 vnitřními větvemi a 12 chovnými sadami zvířat.", nodeCount: 96, isBuiltIn: true, isActive: true },
            { id: 2, templateCode: "dragon_4598", name: "Dračí stezka (Střední plán – 64 polí)", description: "Středně velký královský plán se 64 poli, řekou Doubravkou a 8 sadami zvířat.", nodeCount: 64, isBuiltIn: true, isActive: true },
            { id: 3, templateCode: "compact_48", name: "Rytířské kolbiště (Rychlá hra – 48 polí)", description: "Kompaktní herní plán s 48 poli pro svižnější partie plné přímých střetů.", nodeCount: 48, isBuiltIn: true, isActive: true }
        ];
    },

    createBoard: function (templateCode, options) {
        options = options || {};
        var seed = options.seed || options.boardSeed || Math.floor(Math.random() * 1000000);
        var board = null;
        var dbTpl = (templateCode && this.dbTemplatesMap) ? this.dbTemplatesMap[templateCode] : null;

        // 0. Pokud je přímo předán hotový objekt vlastního plánu (např. z WYSIWYG editoru)
        if (options.customBoard) {
            board = JSON.parse(JSON.stringify(options.customBoard));
            board.code = templateCode || "custom_dynamic";
            return board;
        }

        // 1. Pokud je předán vlastní dynamický recept (custom_dynamic nebo options.customRecipe)
        if (templateCode === "custom_dynamic" || options.customRecipe) {
            var recipeObj = options.customRecipe || (window.PRS_App && window.PRS_App.customBoardRecipe) || window.KiDeskyMapGenerator.DEFAULT_RECIPE;
            if (typeof recipeObj === "string") {
                try { recipeObj = JSON.parse(recipeObj); } catch (e) { recipeObj = window.KiDeskyMapGenerator.DEFAULT_RECIPE; }
            }
            seed = recipeObj.seed || seed;
            board = window.KiDeskyMapGenerator.compileDynamicRecipe(recipeObj, seed);
            board.code = "custom_dynamic";
            if (recipeObj.customName) {
                board.name = recipeObj.customName;
            }
        }
        // 1b. Pokud jde o uložený dynamický plán z mých šablon (saved_map_X)
        else if (templateCode && String(templateCode).indexOf("saved_map_") === 0) {
            var sIdx = parseInt(String(templateCode).replace("saved_map_", ""), 10);
            var savedList = [];
            try { savedList = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { savedList = []; }
            var savedItem = savedList[sIdx];
            if (savedItem) {
                if (savedItem.customBoard) {
                    board = JSON.parse(JSON.stringify(savedItem.customBoard));
                    board.code = templateCode;
                    board.name = savedItem.name || board.name;
                } else if (savedItem.recipe && window.KiDeskyMapGenerator) {
                    var sSeed = savedItem.seed || seed;
                    board = window.KiDeskyMapGenerator.compileDynamicRecipe(savedItem.recipe, sSeed);
                    board.code = templateCode;
                    board.name = savedItem.name || board.name;
                }
            }
        }
        // 2. Pokud jde o administrátorem uložený předdefinovaný plán v databázi (není vestavěný)
        else if (dbTpl && !dbTpl.isBuiltIn) {
            seed = dbTpl.seed || seed;
            var parsedGraph = null;
            if (dbTpl.graphJson && typeof dbTpl.graphJson === "string" && dbTpl.graphJson.length > 20) {
                try {
                    var g = JSON.parse(dbTpl.graphJson);
                    if (g && Array.isArray(g.nodes) && g.nodes.length > 0) parsedGraph = g;
                } catch (e) { }
            } else if (dbTpl.graphJson && typeof dbTpl.graphJson === "object" && Array.isArray(dbTpl.graphJson.nodes)) {
                parsedGraph = JSON.parse(JSON.stringify(dbTpl.graphJson));
            }

            if (parsedGraph) {
                board = parsedGraph;
                board.code = dbTpl.templateCode;
                board.name = dbTpl.name || board.name;
            } else if (dbTpl.recipeJson) {
                var dbRec = dbTpl.recipeJson;
                if (typeof dbRec === "string") {
                    try { dbRec = JSON.parse(dbRec); } catch (e) { dbRec = window.KiDeskyMapGenerator.DEFAULT_RECIPE; }
                }
                board = window.KiDeskyMapGenerator.compileDynamicRecipe(dbRec, seed);
                board.code = dbTpl.templateCode;
                board.name = dbTpl.name || board.name;
            }
        }

        // 3. Standardní a procedurální plány
        if (!board) {
            if (templateCode === "dragon_4598" || templateCode === "dragon_4595") {
                board = this.buildDragon4598Board(options);
            } else if (templateCode === "compact_48") {
                board = this.buildCompactBoard(options);
            } else if (templateCode === "procedural" || templateCode === "dynamic") {
                board = this.buildProceduralBoard(seed, options);
            } else {
                board = this.buildClassic4599Board(options);
            }
            if (options && options.royalCastle) {
                board.royalCastle = options.royalCastle;
            }
            // Pokud byl vestavěný plán v DB administrátorem přejmenován, propíšeme nový název
            if (dbTpl && dbTpl.name) {
                board.name = dbTpl.name;
            }
        }

        // Automatické generické ověření a bezpečné ukotvení dominant bez kolizí
        this.sanitizeAndAnchorLandmarks(board);
        // Automatický výpočet mostů na křížení řeky a cest, pokud ještě nejsou definovány
        if (board.rivers && board.rivers.length > 0 && (!board.bridges || board.bridges.length === 0)) {
            this.computeRiverBridges(board);
        }
        // Generování procedurálních a ukotvených dekorací krajiny s ekosystémovými shluky
        if (!board.decorations || board.decorations.length === 0) {
            this.generateBoardDecorations(board, seed);
        }
        return board;
    },

    computeRiverBridges: function (board) {
        if (!board || !board.nodes || !board.rivers) return [];
        var nodes = board.nodes;
        var bridges = [];

        var sRPS = (this.sampleRiverPathSimple || (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.sampleRiverPathSimple) || (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple));
        var riverPolys = [];

        for (var ri = 0; ri < board.rivers.length; ri++) {
            var rObj = board.rivers[ri];
            if (rObj && rObj.path && sRPS) {
                var smp = sRPS(rObj.path);
                if (smp && smp.length > 1) {
                    riverPolys.push(smp);
                }
            }
        }

        // Fallback pro klasickou desku, pokud by vzorkování selhalo
        if (riverPolys.length === 0) {
            riverPolys.push([
                { x: 1225, y: 15 }, { x: 1205, y: 60 }, { x: 1177, y: 127 },
                { x: 1160, y: 170 }, { x: 1130, y: 220 }, { x: 1107, y: 281 },
                { x: 1075, y: 355 }, { x: 1025, y: 415 }, { x: 965, y: 470 },
                { x: 900, y: 535 }, { x: 835, y: 605 }, { x: 779, y: 676 },
                { x: 752, y: 710 }, { x: 734, y: 756 }, { x: 720, y: 802 },
                { x: 711, y: 832 }, { x: 703, y: 874 }, { x: 695, y: 915 }
            ]);
        }

        for (var n = 0; n < nodes.length; n++) {
            var nA = nodes[n];
            var tgts = nA.next || [];
            if (nA.branchHigh !== null && nA.branchHigh !== undefined && tgts.indexOf(nA.branchHigh) === -1) {
                tgts = tgts.concat([nA.branchHigh]);
            }
            for (var t = 0; t < tgts.length; t++) {
                var nB = nodes[tgts[t]];
                if (!nB) continue;
                for (var polyI = 0; polyI < riverPolys.length; polyI++) {
                    var riverPoly = riverPolys[polyI];
                    var hitFound = false;
                    for (var r = 0; r < riverPoly.length - 1; r++) {
                        var hit = window.KiDeskyMapGenerator.lineIntersection(nA, nB, riverPoly[r], riverPoly[r + 1]);
                        if (hit) {
                            var tooClose = false;
                            for (var eb = 0; eb < bridges.length; eb++) {
                                var bdx = bridges[eb].x - hit.x, bdy = bridges[eb].y - hit.y;
                                if (bdx * bdx + bdy * bdy < 625) { tooClose = true; break; }
                            }
                            if (!tooClose) {
                                var cType = "stone_arch";
                                var hasTownOrCastle = (nA && (nA.type === "castle" || nA.type === "town" || nA.type === "start")) ||
                                                      (nB && (nB.type === "castle" || nB.type === "town" || nB.type === "start"));
                                var hasVillage = (nA && (nA.type === "village" || nA.type === "tavern" || nA.type === "trade" || nA.type === "craft")) ||
                                                 (nB && (nB.type === "village" || nB.type === "tavern" || nB.type === "trade" || nB.type === "craft"));
                                if (hasTownOrCastle) cType = "stone_arch";
                                else if (hasVillage) cType = "wood_plank";
                                else cType = (bridges.length % 2 === 0) ? "stone_ford" : "wood_plank";

                                bridges.push({
                                    x: hit.x,
                                    y: hit.y,
                                    angle: hit.angle,
                                    nodeAId: nA.id,
                                    nodeBId: nB.id,
                                    crossingType: cType
                                });
                            }
                            hitFound = true;
                            break;
                        }
                    }
                    if (hitFound) break;
                }
            }
        }
        board.bridges = bridges;
        return bridges;
    },

    // ========================================================================
    // PROCEDURÁLNÍ DEKORACE KRAJINY (EKOSYSTÉMOVÉ SHLUKY & PAINTER'S ALGORITHM)
    // Skládá husté lesní hvozdy, horské hřebeny a vesnická diorámata
    // ========================================================================
    generateBoardDecorations: function (board, customSeed) {
        if (!board || !board.nodes) return [];
        var seed = customSeed || board.seed || (board.code === "dragon_4598" ? 4598 : (board.code === "compact_48" ? 4848 : 4599));

        var rnd = (function (s) {
            var a = s;
            return function () {
                var t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };
        })(seed);

        var nodes = board.nodes;
        var cardZones = board.cardZones || [];
        var landmarks = board.landmarks || [];
        var catalog = window.PRS_DECOR_CATALOG || {};
        var decorList = [];

        var riverClearancePoints = [];
        if (board.rivers && board.rivers.length > 0) {
            var sRPS = (this.sampleRiverPathSimple || (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple));
            if (sRPS) {
                for (var ri = 0; ri < board.rivers.length; ri++) {
                    var rObj = board.rivers[ri];
                    var rWidth = rObj.width || 14;
                    var smpPts = sRPS(rObj.path);
                    for (var sp = 0; sp < smpPts.length; sp++) {
                        riverClearancePoints.push({ x: smpPts[sp].x, y: smpPts[sp].y, halfW: rWidth / 2 });
                    }
                }
            }
        }

        function isPositionClear(x, y, radius, allowClusterOverlap) {
            if (x - radius < 35 || x + radius > 1365 || y - radius < 35 || y + radius > 825) return false;

            for (var rp = 0; rp < riverClearancePoints.length; rp++) {
                var rpt = riverClearancePoints[rp];
                var rdx = rpt.x - x;
                var rdy = rpt.y - y;
                var minRDist = radius + rpt.halfW + 18;
                if (rdx * rdx + rdy * rdy < minRDist * minRDist) {
                    return false;
                }
            }

            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var dx = n.x - x;
                var dy = n.y - y;
                var distSq = dx * dx + dy * dy;
                var minDist = radius + 20;
                if (distSq < minDist * minDist) return false;
            }

            for (var z = 0; z < cardZones.length; z++) {
                var cz = cardZones[z];
                if (x + radius > cz.x - 10 && x - radius < cz.x + cz.w + 10 &&
                    y + radius > cz.y - 10 && y - radius < cz.y + cz.h + 10) {
                    return false;
                }
            }

            for (var l = 0; l < landmarks.length; l++) {
                var lm = landmarks[l];
                var lx1 = lm.x - lm.w / 2 - 14;
                var lx2 = lm.x + lm.w / 2 + 14;
                var ly1 = lm.y - lm.h / 2 - 14;
                var ly2 = lm.y + lm.h / 2 + 14;
                if (x + radius > lx1 && x - radius < lx2 && y + radius > ly1 && y - radius < ly2) {
                    return false;
                }
            }

            if (!allowClusterOverlap) {
                for (var d = 0; d < decorList.length; d++) {
                    var dec = decorList[d];
                    var ddx = dec.x - x;
                    var ddy = dec.y - y;
                    var dDist = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (dDist < (radius + dec.clearance)) {
                        return false;
                    }
                }
            }

            return true;
        }

        function findClearSpot(cx, cy, radius) {
            if (isPositionClear(cx, cy, radius, false)) return { x: cx, y: cy };
            var offsets = [
                { x: 35, y: 0 }, { x: -35, y: 0 }, { x: 0, y: 35 }, { x: 0, y: -35 },
                { x: 30, y: 30 }, { x: -30, y: 30 }, { x: 30, y: -30 }, { x: -30, y: -30 },
                { x: 55, y: 0 }, { x: -55, y: 0 }, { x: 0, y: 55 }, { x: 0, y: -55 }
            ];
            for (var o = 0; o < offsets.length; o++) {
                var tx = cx + offsets[o].x;
                var ty = cy + offsets[o].y;
                if (isPositionClear(tx, ty, radius, false)) return { x: tx, y: ty };
            }
            return null;
        }

        // 1. Shlukové lesní hvozdy (Forest Thickets)
        function spawnForestThicket(cx, cy, type) {
            var groveKey = (type === "pine") ? "grove_pine" : "grove_oak";
            var treeKeys = (type === "pine") ? ["tree_pine", "tree_pine", "tree_birch"] : ["tree_oak", "tree_birch", "tree_oak"];
            if (!catalog[groveKey]) return;
            var gItem = catalog[groveKey];
            var spot = findClearSpot(cx, cy, gItem.clearance);
            if (!spot) return;
            cx = spot.x; cy = spot.y;

            decorList.push({
                id: "cluster_g_" + cx + "_" + cy,
                catalogId: groveKey,
                x: cx,
                y: cy,
                w: gItem.w,
                h: gItem.h,
                clearance: gItem.clearance,
                scale: 1.0,
                anchoredNodeId: null
            });

            var treeCount = 3 + Math.floor(rnd() * 3);
            for (var t = 0; t < treeCount; t++) {
                var ang = (t / treeCount) * Math.PI * 2 + (rnd() - 0.5) * 0.4;
                var dist = 22 + rnd() * 20;
                var tx = Math.round(cx + Math.cos(ang) * dist);
                var ty = Math.round(cy + Math.sin(ang) * dist);
                var tKey = treeKeys[Math.floor(rnd() * treeKeys.length)];
                var tItem = catalog[tKey];
                if (tItem && isPositionClear(tx, ty, 14, true)) {
                    var sc = Math.round((0.8 + rnd() * 0.25) * 100) / 100;
                    decorList.push({
                        id: "cluster_t_" + tx + "_" + ty,
                        catalogId: tKey,
                        x: tx,
                        y: ty,
                        w: Math.round(tItem.w * sc),
                        h: Math.round(tItem.h * sc),
                        clearance: Math.round(tItem.clearance * 0.5),
                        scale: sc,
                        anchoredNodeId: null
                    });
                }
            }

            if (rnd() < 0.75 && catalog["bush"]) {
                var bx = Math.round(cx + (rnd() - 0.5) * 44);
                var by = Math.round(cy + 26 + rnd() * 14);
                if (isPositionClear(bx, by, 10, true)) {
                    decorList.push({
                        id: "cluster_b_" + bx + "_" + by,
                        catalogId: "bush",
                        x: bx,
                        y: by,
                        w: 44,
                        h: 38,
                        clearance: 10,
                        scale: 0.9,
                        anchoredNodeId: null
                    });
                }
            }
        }

        // 2. Horský hřeben (Mountain Ridge)
        function spawnMountainRidge(cx, cy) {
            if (!catalog["mountain_peaks"]) return;
            var mItem = catalog["mountain_peaks"];
            var spot = findClearSpot(cx, cy, mItem.clearance);
            if (!spot) return;
            cx = spot.x; cy = spot.y;

            decorList.push({
                id: "ridge_m1_" + cx + "_" + cy,
                catalogId: "mountain_peaks",
                x: cx,
                y: cy,
                w: mItem.w,
                h: mItem.h,
                clearance: mItem.clearance,
                scale: 1.0,
                anchoredNodeId: null
            });

            var ox = cx + 46;
            var oy = cy - 8;
            if (isPositionClear(ox, oy, 22, true)) {
                decorList.push({
                    id: "ridge_m2_" + ox + "_" + oy,
                    catalogId: "mountain_peaks",
                    x: ox,
                    y: oy,
                    w: Math.round(mItem.w * 0.85),
                    h: Math.round(mItem.h * 0.85),
                    clearance: 22,
                    scale: 0.85,
                    isFlipped: true,
                    anchoredNodeId: null
                });
            }

            if (catalog["rock_boulder"]) {
                var rx = cx - 22 + Math.round((rnd() - 0.5) * 25);
                var ry = cy + 28;
                if (isPositionClear(rx, ry, 12, true)) {
                    decorList.push({
                        id: "ridge_r_" + rx + "_" + ry,
                        catalogId: "rock_boulder",
                        x: rx,
                        y: ry,
                        w: 50,
                        h: 38,
                        clearance: 12,
                        scale: 0.9,
                        anchoredNodeId: null
                    });
                }
            }
        }

        // Generování ekosystémových shluků v klíčových zónách
        spawnMountainRidge(1210, 260);
        spawnMountainRidge(1250, 490);
        spawnMountainRidge(1180, 680);
        spawnForestThicket(310, 160, "oak");
        spawnForestThicket(200, 240, "oak");
        spawnForestThicket(380, 290, "birch");
        spawnForestThicket(180, 460, "oak");
        spawnForestThicket(480, 710, "pine");
        spawnForestThicket(890, 720, "pine");
        spawnForestThicket(1040, 660, "pine");

        // 3. Ukotvené rekvizity k políčkům (Node-Anchored Props)
        for (var nIdx = 0; nIdx < nodes.length; nIdx++) {
            var node = nodes[nIdx];
            var propKey = null;

            if (node.type === "VILLAGE") {
                propKey = (nIdx % 3 === 0) ? "cottage_timber" : (nIdx % 3 === 1 ? "village_well" : "watermill");
            } else if (node.type === "ANIMAL") {
                if (node.setId === 1) propKey = "pasture_fence";
                else if (node.setId === 2) propKey = "unicorn_grove";
                else if (node.setId === 3) propKey = "pegasus_pond";
                else if (node.setId === 4) propKey = "dryad_sacred_oak";
                else propKey = "pasture_fence";
            } else if (node.type === "MERCHANT" || node.type === "SHOP") {
                propKey = "merchant_wagon";
            } else if (node.type === "FESTIVAL") {
                propKey = "tournament_tent";
            } else if (node.type === "BUILDING" && node.subtype === "forge") {
                propKey = "watermill";
            } else if (node.type === "BUILDING" && (node.subtype === "stables" || node.subtype === "doghandler")) {
                propKey = "pasture_fence";
            } else if (node.type === "QUEST") {
                var questProps = ["dragon_cave", "cave_bear_den", "bandit_cave", "basilisk_cave", "snow_troll_cave", "swamp_hydra", "swamp_troll", "griffin_nest", "phoenix_nest", "fire_salamander"];
                propKey = questProps[nIdx % questProps.length];
            } else if (node.type === "CHANCE" || node.type === "JESTER") {
                var magicProps = ["fairy_ring_mushrooms", "druid_monoliths", "witch_hut", "ancient_ruins", "crystal_golem", "forest_ent", "ancient_tower_ruin"];
                propKey = magicProps[nIdx % magicProps.length];
            } else if (node.type === "TAX" || node.type === "HOSPITAL") {
                propKey = (node.type === "TAX") ? "wooden_watchtower" : "ancient_graveyard";
            } else if (node.isJunction && nIdx % 2 === 0) {
                propKey = (nIdx % 4 === 0) ? "signpost" : "signpost2";
            }

            if (propKey && catalog[propKey]) {
                var catItem = catalog[propKey];
                var startAngle = (rnd() * Math.PI * 2);
                for (var a = 0; a < 8; a++) {
                    var ang = startAngle + (a * Math.PI / 4);
                    var testDist = 66;
                    var px = Math.round(node.x + Math.cos(ang) * testDist);
                    var py = Math.round(node.y + Math.sin(ang) * testDist);
                    if (isPositionClear(px, py, catItem.clearance, false)) {
                        decorList.push({
                            id: "prop_" + nIdx + "_" + propKey,
                            catalogId: propKey,
                            x: px,
                            y: py,
                            w: catItem.w,
                            h: catItem.h,
                            clearance: catItem.clearance,
                            scale: Math.round((0.9 + rnd() * 0.2) * 100) / 100,
                            anchoredNodeId: nIdx
                        });
                        break;
                    }
                }
            }
        }

        // 4. Rozptýlená krajina (Scatter Terrain)
        var scatterPool = [
            "tree_oak", "tree_oak", "tree_pine", "tree_pine", "tree_birch",
            "grove_oak", "grove_pine", "grove_pine2", "rock_boulder", "rock_boulder",
            "farm_field", "windmill", "lake_pond", "mountain_peaks",
            "orchad_apple", "hruskovy_sad", "orchad_plum", "bush", "bush",
            "watermill", "wooden_watchtower", "ancient_ruins", "ancient_tower_ruin",
            "druid_monoliths", "fairy_ring_mushrooms", "swamp_bridge", "unicorn_grove",
            "pegasus_pond", "dryad_sacred_oak", "forest_ent", "crystal_golem",
            "lake_nymphs", "vodnik_pond"
        ];

        for (var gx = 75; gx <= 1325; gx += 60) {
            for (var gy = 75; gy <= 785; gy += 60) {
                var jx = Math.round(gx + (rnd() - 0.5) * 40);
                var jy = Math.round(gy + (rnd() - 0.5) * 40);

                var pickKey;
                if (jy < 180 && (jx < 350 || jx > 1050) && rnd() < 0.45) {
                    pickKey = "mountain_peaks";
                } else if (rnd() < 0.08) {
                    var waterPicks = ["lake_pond", "lake_nymphs", "vodnik_pond", "pegasus_pond"];
                    pickKey = waterPicks[Math.floor(rnd() * waterPicks.length)];
                } else if (rnd() < 0.12) {
                    pickKey = "farm_field";
                } else {
                    pickKey = scatterPool[Math.floor(rnd() * scatterPool.length)];
                }

                var itemDef = catalog[pickKey];
                if (itemDef && isPositionClear(jx, jy, itemDef.clearance, false)) {
                    var sc = (pickKey === "mountain_peaks" || pickKey === "lake_pond" || pickKey === "farm_field")
                        ? 1.0 : (Math.round((0.85 + rnd() * 0.3) * 100) / 100);
                    decorList.push({
                        id: "scatter_" + jx + "_" + jy,
                        catalogId: pickKey,
                        x: jx,
                        y: jy,
                        w: Math.round(itemDef.w * sc),
                        h: Math.round(itemDef.h * sc),
                        clearance: Math.round(itemDef.clearance * sc),
                        scale: sc,
                        anchoredNodeId: null
                    });
                }
            }
        }

        // Izometrické řazení dle souřadnice Y (Painter's algorithm)
        decorList.sort(function (a, b) {
            return a.y - b.y;
        });

        board.decorations = decorList;
        return decorList;
    },

    sanitizeAndAnchorLandmarks: function (board) {
        if (!board || !board.nodes) return;
        var nodes = board.nodes;
        var cardZones = board.cardZones || [];

        function getClearance(cx, cy, w, h) {
            var r = Math.min(w, h) * 0.42;
            var minNodeDist = 9999;
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var dist = Math.sqrt((n.x - cx) * (n.x - cx) + (n.y - cy) * (n.y - cy));
                if (dist < minNodeDist) minNodeDist = dist;
                if (dist < (r + 26)) {
                    return -1;
                }
            }
            var lx1 = cx - w / 2, lx2 = cx + w / 2;
            var ly1 = cy - h / 2, ly2 = cy + h / 2;
            for (var z = 0; z < cardZones.length; z++) {
                var cz = cardZones[z];
                var ox = Math.max(0, Math.min(lx2, cz.x + cz.w) - Math.max(lx1, cz.x));
                var oy = Math.max(0, Math.min(ly2, cz.y + cz.h) - Math.max(ly1, cz.y));
                if (ox > 0 && oy > 0) {
                    return -2;
                }
            }
            if (board.rivers && board.rivers.length > 0) {
                var sRPS2 = (this.sampleRiverPathSimple || (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple));
                if (sRPS2) {
                    for (var rIndex = 0; rIndex < board.rivers.length; rIndex++) {
                        var riverItem = board.rivers[rIndex];
                        var rHalfW = (riverItem.width || 14) / 2;
                        var rPts = sRPS2(riverItem.path);
                        for (var pi = 0; pi < rPts.length; pi++) {
                            var rdx = rPts[pi].x - cx;
                            var rdy = rPts[pi].y - cy;
                            var safeR = r + rHalfW + 22;
                            if (rdx * rdx + rdy * rdy < safeR * safeR) {
                                return -3;
                            }
                        }
                    }
                }
            }
            return minNodeDist;
        }

        var validLandmarks = [];
        if (board.landmarks && board.landmarks.length > 0) {
            for (var l = 0; l < board.landmarks.length; l++) {
                var lm = board.landmarks[l];
                var clr = getClearance(lm.x, lm.y, lm.w, lm.h);
                if (clr > 0) {
                    validLandmarks.push(lm);
                }
            }
        }

        var hasCastle = false;
        var origRoyal = null;
        if (board.landmarks && board.landmarks.length > 0) {
            for (var ol = 0; ol < board.landmarks.length; ol++) {
                if (board.landmarks[ol].id === "royalCastle") {
                    origRoyal = board.landmarks[ol];
                    break;
                }
            }
        }
        var targetRoyalKey = board.royalCastle || (board.recipe && board.recipe.royalCastle) || (origRoyal && origRoyal.selectedKey);
        var royalDef = (targetRoyalKey && this.resolveRoyalCastle ? this.resolveRoyalCastle(targetRoyalKey, board.biomeTheme, board.seed) : null) || origRoyal || (this.resolveRoyalCastle ? this.resolveRoyalCastle("auto", board.biomeTheme, board.seed) : null) || {
            name: "Královský Hrad",
            icon: "👑",
            image: "assets/castles/castle_royal.png"
        };

        for (var v = 0; v < validLandmarks.length; v++) {
            if (validLandmarks[v].id === "royalCastle") {
                hasCastle = true;
                // Pokud bylo vybráno specifické královské sídlo nebo je nastaveno dynamicky, aktualizujeme grafiku
                if (royalDef && (royalDef.img || royalDef.image)) {
                    validLandmarks[v].image = royalDef.img || royalDef.image;
                    validLandmarks[v].name = royalDef.name || validLandmarks[v].name;
                    validLandmarks[v].icon = royalDef.icon || validLandmarks[v].icon;
                }
                break;
            }
        }
        if (!hasCastle) {
            var candidates = [
                { x: 700, y: 390, w: 220, h: 180 },
                { x: 700, y: 320, w: 240, h: 200 },
                { x: 675, y: 405, w: 230, h: 190 },
                { x: 700, y: 430, w: 220, h: 180 }
            ];
            for (var c = 0; c < candidates.length; c++) {
                var cand = candidates[c];
                if (getClearance(cand.x, cand.y, cand.w, cand.h) > 0) {
                    validLandmarks.unshift({
                        id: "royalCastle",
                        name: royalDef.name || "Královský Hrad",
                        icon: royalDef.icon || "👑",
                        image: royalDef.image || royalDef.img || "assets/castles/castle_royal.png",
                        x: cand.x,
                        y: cand.y,
                        w: cand.w,
                        h: cand.h
                    });
                    hasCastle = true;
                    break;
                }
            }
            if (!hasCastle) {
                var pocket = (window.KiDeskyMapGenerator && typeof window.KiDeskyMapGenerator.findLargestOpenPocket === "function")
                    ? window.KiDeskyMapGenerator.findLargestOpenPocket(nodes, board.rivers, 220, 180)
                    : null;
                if (pocket) {
                    validLandmarks.unshift({
                        id: "royalCastle",
                        name: royalDef.name || "Královský Hrad",
                        icon: royalDef.icon || "👑",
                        image: royalDef.image || royalDef.img || "assets/castles/castle_royal.png",
                        x: pocket.x,
                        y: pocket.y,
                        w: pocket.w || 220,
                        h: pocket.h || 180
                    });
                    hasCastle = true;
                }
            }
        }

        var hasDragon = false;
        for (var d = 0; d < validLandmarks.length; d++) {
            if (validLandmarks[d].id === "dragonLair") { hasDragon = true; break; }
        }
        if (!hasDragon) {
            var u3Node = null;
            for (var u = 0; u < nodes.length; u++) {
                if (nodes[u].subtype === "U3" || (nodes[u].code && nodes[u].code.indexOf("U3") !== -1) || nodes[u].type === "QUEST") {
                    u3Node = nodes[u];
                    break;
                }
            }
            if (u3Node) {
                var angles = [180, 225, 135, 270, 90, 0, 315, 45];
                var bestSpot = null;
                var maxClearance = -1;
                var dw = 145, dh = 125;
                for (var a = 0; a < angles.length; a++) {
                    var rad = (angles[a] * Math.PI) / 180;
                    var testDist = 115;
                    var tx = Math.round(u3Node.x + Math.cos(rad) * testDist);
                    var ty = Math.round(u3Node.y + Math.sin(rad) * testDist);
                    if (tx < 110 || tx > 1290 || ty < 90 || ty > 770) continue;
                    var cDist = getClearance(tx, ty, dw, dh);
                    if (cDist > maxClearance) {
                        maxClearance = cDist;
                        bestSpot = { x: tx, y: ty };
                    }
                }
                if (bestSpot && maxClearance > 70) {
                    validLandmarks.push({
                        id: "dragonLair",
                        name: "Dračí sluj (U3)",
                        icon: "🐲",
                        image: "assets/landmarks/dragon.png",
                        x: bestSpot.x,
                        y: bestSpot.y,
                        w: dw,
                        h: dh
                    });
                }
            }
        }

        // 3. Dynamické kotvení tematických hradů vedle políček CASTLE (H1, H2, H3...)
        // Vyloučíme Královský hrad, aby se na mapě žádný hrad neopakoval
        var royalImgBase = "";
        for (var vl = 0; vl < validLandmarks.length; vl++) {
            if (validLandmarks[vl].id === "royalCastle") {
                royalImgBase = (validLandmarks[vl].image || "").toLowerCase();
                break;
            }
        }
        if (!royalImgBase && royalDef) {
            royalImgBase = (royalDef.image || royalDef.img || "assets/castles/castle_royal.png").toLowerCase();
        }

        var allCastlesCatalog = this.ALL_CASTLES || [];
        var freeThematicCastles = allCastlesCatalog.filter(function (c) {
            if (!royalImgBase) return true;
            var cKey = c.id.replace("castle_", "").toLowerCase();
            return royalImgBase.indexOf(cKey) === -1 && royalImgBase.indexOf(c.id.toLowerCase()) === -1;
        });
        if (freeThematicCastles.length === 0) freeThematicCastles = allCastlesCatalog.slice(0);

        var defaultCastleMap = {
            H1: "assets/castles/castle_forest.png",
            H2: "assets/castles/castle_wind.png",
            H3: "assets/castles/castle_crystal.png",
            H4: "assets/castles/castle_desert.png",
            H5: "assets/castles/castle_water.png",
            H6: "assets/castles/castle_ice.png",
            H7: "assets/castles/castle_lava.png",
            H8: "assets/castles/castle_swamp.png",
            H9: "assets/castles/castle_dark.png"
        };

        var castleNodes = [];
        for (var cn = 0; cn < nodes.length; cn++) {
            if (nodes[cn].type === "CASTLE") {
                castleNodes.push(nodes[cn]);
            }
        }

        var maxCastlesToAnchor = Math.min(4, castleNodes.length);
        for (var ci = 0; ci < maxCastlesToAnchor; ci++) {
            var cNode = castleNodes[ci];
            var cKey = cNode.estateId || cNode.code || ("H" + (ci + 1));
            var cId = "castle_" + cKey;

            // Výběr unikátního hradu bez kolize s Královským hradem
            var cImg = cNode.castleImg;
            var isDup = !cImg || (royalImgBase && royalImgBase.indexOf(cImg.toLowerCase().replace("assets/castles/", "").replace(".png", "").replace("_flip", "")) !== -1);
            if (isDup) {
                var prefImg = defaultCastleMap[cKey];
                var prefDup = prefImg && royalImgBase && royalImgBase.indexOf(prefImg.toLowerCase().replace("assets/castles/", "").replace(".png", "")) !== -1;
                if (prefImg && !prefDup) {
                    cImg = prefImg;
                } else {
                    var poolPick = freeThematicCastles[ci % freeThematicCastles.length];
                    cImg = poolPick ? poolPick.img : "assets/castles/castle_forest.png";
                }
            }
            cNode.castleImg = cImg;

            var exists = false;
            for (var vlIdx = 0; vlIdx < validLandmarks.length; vlIdx++) {
                if (validLandmarks[vlIdx].id === cId || validLandmarks[vlIdx].id === ("castleH" + (ci + 1))) {
                    validLandmarks[vlIdx].image = cImg;
                    exists = true;
                    break;
                }
            }
            if (exists) continue;

            var cAngles = [0, 45, 90, 135, 180, 225, 270, 315];
            var cDists = [105, 125, 90, 140];
            var bestCSpot = null;
            var maxCClearance = -1;
            var cw = 125, ch = 110;
            for (var cd = 0; cd < cDists.length; cd++) {
                var testDist = cDists[cd];
                for (var ca = 0; ca < cAngles.length; ca++) {
                    var rad = (cAngles[ca] * Math.PI) / 180;
                    var tx = Math.round(cNode.x + Math.cos(rad) * testDist);
                    var ty = Math.round(cNode.y + Math.sin(rad) * testDist);
                    if (tx < 90 || tx > 1310 || ty < 70 || ty > 790) continue;
                    var cDist = getClearance(tx, ty, cw, ch);
                    if (cDist > maxCClearance) {
                        maxCClearance = cDist;
                        bestCSpot = { x: tx, y: ty };
                    }
                }
                if (bestCSpot && maxCClearance > 45) break;
            }
            if (bestCSpot && maxCClearance > 45) {
                var detectedCastleKey = "";
                if (cImg) {
                    var mKey = cImg.match(/castle_([a-z0-9_]+?)(?:_flip)?\.(?:png|jpg)/i);
                    if (mKey) detectedCastleKey = mKey[1];
                }
                if (!detectedCastleKey && cKey) {
                    detectedCastleKey = cKey.toLowerCase().replace("castle_", "");
                }
                cNode.castleKey = detectedCastleKey;
                validLandmarks.push({
                    id: cId,
                    castleKey: detectedCastleKey,
                    name: cNode.name || ("Hrad " + (ci + 1)),
                    icon: cNode.icon || "🏯",
                    image: cImg,
                    x: bestCSpot.x,
                    y: bestCSpot.y,
                    w: cw,
                    h: ch,
                    isFlipped: (bestCSpot.x > 700)
                });
            }
        }

        board.landmarks = validLandmarks;
    },

    sampleBezier: function (p0, p1, p2, p3, count, includeEnd) {
        var pts = [];
        var denom = includeEnd ? Math.max(1, count - 1) : count;
        for (var i = 0; i < count; i++) {
            var t = i / denom;
            var u = 1 - t;
            var x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
            var y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
            pts.push({ x: Math.round(x), y: Math.round(y) });
        }
        return pts;
    },

    buildClassic4599Board: function (options) {
        options = options || {};
        var seed = (options.seed !== undefined && options.seed !== null) ? options.seed : (options.boardSeed || Math.floor(Math.random() * 1000000));
        var royalKey = options.royalCastle || (options.recipe && options.recipe.royalCastle) || "auto";
        var royalDef = this.resolveRoyalCastle(royalKey, options.biomeTheme, seed);

        // Dynamická variabilita hradů H1 a H2 bez duplicit s královským hradem
        var allCastles = this.ALL_CASTLES || [];
        var remainingCastles = allCastles.filter(function (c) {
            return c.id !== royalDef.id && c.img !== royalDef.img;
        });
        var h1Idx = Math.abs(seed * 7 + 3) % Math.max(1, remainingCastles.length);
        var castleDefH1 = remainingCastles[h1Idx] || allCastles[1];
        var remainingForH2 = remainingCastles.filter(function (c) { return c.id !== castleDefH1.id; });
        var h2Idx = Math.abs(seed * 13 + 5) % Math.max(1, remainingForH2.length);
        var castleDefH2 = remainingForH2[h2Idx] || allCastles[5];
        // A) Hlavní obvodový okruh (74 polí, plynule zaoblený přesně podle IMG_4599)
        // Sekce 1: Horní rovinka od STARTu (x=500, y=72) doprava k P2 (x=1145, y=108) -> 14 polí (indexy 0..13)
        var topDefs = [
            { code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰" },
            { code: "K1", type: "ANIMAL", subtype: "horse", setId: 1, name: "Kůň 1 (Grošák)", icon: "🐎" },
            { code: "S1", type: "ANIMAL", subtype: "falcon", setId: 1, name: "Sokol 1 (Poštolka)", icon: "🦅" },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "STAJE1", type: "BUILDING", subtype: "stables", name: "Stáje 1", icon: "🏠" },
            { code: "P1", type: "ANIMAL", subtype: "dog", setId: 1, name: "Pes 1 (Ohař)", icon: "🐕" },
            { code: "OBCHOD1", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "VD1", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "HOSP", type: "HOSPITAL", name: "Královský lazaret", icon: "🏥" },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1", icon: "🃏" },
            { code: "K2", type: "ANIMAL", subtype: "horse", setId: 2, name: "Kůň 2 (Hnědák)", icon: "🐎" },
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2 (Lhotka)", icon: "🏘️", hasRoof: true },
            { code: "S2", type: "ANIMAL", subtype: "falcon", setId: 2, name: "Sokol 2 (Krahujec)", icon: "🦅" },
            { code: "P2", type: "ANIMAL", subtype: "dog", setId: 2, name: "Pes 2 (Bígl) – Odbočka", icon: "🐕", isJunction: true }
        ];
        var topPts = this.sampleBezier([500, 72], [730, 70], [980, 70], [1148, 108], topDefs.length, true);

        // Sekce 2: Pravý oblouk od Kovárny 1 (za P2) dolů k P4 a N (indexy 14..31, 18 polí)
        var rightDefs = [
            { code: "KOV1", type: "BUILDING", subtype: "forge", name: "Kovárna 1", icon: "⚒️" },
            { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "K3", type: "ANIMAL", subtype: "horse", setId: 3, name: "Kůň 3 (Vraník)", icon: "🐎" },
            { code: "N3", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "MJ2", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "SOK1", type: "BUILDING", subtype: "falconer", name: "Sokolník 1", icon: "🦅" },
            { code: "S3", type: "ANIMAL", subtype: "falcon", setId: 3, name: "Sokol 3 (Ostříž)", icon: "🦅" },
            { code: "N4", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P3", type: "ANIMAL", subtype: "dog", setId: 3, name: "Pes 3 (Chrt)", icon: "🐕" },
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true },
            { code: "OBCHOD2", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "M3_R", type: "TOWN", estateId: "M3", name: "Město 3 (Zlatov)", icon: "🏙️" },
            { code: "K4", type: "ANIMAL", subtype: "horse", setId: 4, name: "Kůň 4 (Ryzák)", icon: "🐎" },
            { code: "KE2", type: "JESTER", jesterId: 2, name: "Kejklíř 2", icon: "🃏" },
            { code: "S4", type: "ANIMAL", subtype: "falcon", setId: 4, name: "Sokol 4 (Raroh)", icon: "🦅" },
            { code: "MCH1", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "P4", type: "ANIMAL", subtype: "dog", setId: 4, name: "Pes 4 (Barvář)", icon: "🐕" },
            { code: "N5", type: "CHANCE", name: "Náhoda (Soutok u Hradu 2)", icon: "❓" }
        ];
        var rightPts = this.sampleBezier([1188, 134], [1365, 290], [1365, 650], [1160, 782], rightDefs.length, true);

        // Sekce 3: Dolní rovinka zprava doleva od Kovárny 2 přes odbočku na most SLAVNOSTÍ až k S7 (indexy 32..51, 20 polí)
        var bottomDefs = [
            { code: "KOV2", type: "BUILDING", subtype: "forge", name: "Kovárna 2", icon: "⚒️" },
            { code: "K5", type: "ANIMAL", subtype: "horse", setId: 5, name: "Kůň 5 (Bělouš)", icon: "🐎" },
            { code: "S5", type: "ANIMAL", subtype: "falcon", setId: 5, name: "Sokol 5 (Královský ostříž)", icon: "🦅" },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️" },
            { code: "P5", type: "ANIMAL", subtype: "dog", setId: 5, name: "Pes 5 (Slídič)", icon: "🐕" },
            { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "S6", type: "ANIMAL", subtype: "falcon", setId: 6, name: "Sokol 6 – Odbočka ke Slavnosti", icon: "🦅", isJunction: true },
            { code: "U1_3", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "K6", type: "ANIMAL", subtype: "horse", setId: 6, name: "Kůň 6 (Plavák)", icon: "🐎" },
            { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "KE3", type: "JESTER", jesterId: 3, name: "Kejklíř 3", icon: "🃏" },
            { code: "SATL", type: "PRISON", name: "Královská šatlava", icon: "⛓️" },
            { code: "OBCHOD3", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "STAJE2", type: "BUILDING", subtype: "stables", name: "Stáje 2", icon: "🏠" },
            { code: "P6", type: "ANIMAL", subtype: "dog", setId: 6, name: "Pes 6 (Vlkodav)", icon: "🐕" },
            { code: "MB1", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️" },
            { code: "V5", type: "VILLAGE", estateId: "V5", name: "Vesnice 5 (Skalice)", icon: "🏘️", hasRoof: true },
            { code: "M2", type: "TOWN", estateId: "M2", name: "Město 2 (Stříbratec)", icon: "🏙️" },
            { code: "K7", type: "ANIMAL", subtype: "horse", setId: 7, name: "Kůň 7 (Šiml)", icon: "🐎" },
            { code: "S7", type: "ANIMAL", subtype: "falcon", setId: 7, name: "Sokol 7 (Luňák)", icon: "🦅" }
        ];
        var bottomPts = this.sampleBezier([1110, 795], [820, 804], [520, 804], [255, 795], bottomDefs.length, true);

        // Sekce 4: Levý oblouk zdola od Psovodu 2 nahoru přes V8, K9, M3, V1, Obchod 5 a P10 zpět do STARTu (indexy 52..75, 24 polí)
        var leftDefs = [
            { code: "PSOV2", type: "BUILDING", subtype: "doghandler", name: "Psovod 2", icon: "🦴" },
            { code: "N7", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P7", type: "ANIMAL", subtype: "dog", setId: 7, name: "Pes 7 (Doga)", icon: "🐕" },
            { code: "V6", type: "VILLAGE", estateId: "V6", name: "Vesnice 6 (Meziříčí)", icon: "🏘️" },
            { code: "N8", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "S8", type: "ANIMAL", subtype: "falcon", setId: 8, name: "Sokol 8 (Orlovec)", icon: "🦅" },
            { code: "KE4", type: "JESTER", jesterId: 4, name: "Kejklíř 4", icon: "🃏" },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️" },
            { code: "K8", type: "ANIMAL", subtype: "horse", setId: 8, name: "Kůň 8 (Fríský oř)", icon: "🐎" },
            { code: "N9", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P8", type: "ANIMAL", subtype: "dog", setId: 8, name: "Pes 8 (Chrtí král)", icon: "🐕" },
            { code: "S9", type: "ANIMAL", subtype: "falcon", setId: 9, name: "Sokol 9 (Jestřáb)", icon: "🦅" },
            { code: "OBCHOD4", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "P9", type: "ANIMAL", subtype: "dog", setId: 9, name: "Pes 9 (Lovecký chrt)", icon: "🐕" },
            { code: "V8", type: "VILLAGE", estateId: "V8", name: "Vesnice 8 (Podhradí)", icon: "🏘️" },
            { code: "K9", type: "ANIMAL", subtype: "horse", setId: 9, name: "Kůň 9 (Andaluský hřebec)", icon: "🐎" },
            { code: "M3", type: "TOWN", estateId: "M3", name: "Město 3 (Zlatov)", icon: "🏙️" },
            { code: "KRCMA", type: "TAVERN", name: "Krčma U Zlatého korbelu", icon: "🍺" },
            { code: "KE5", type: "JESTER", jesterId: 5, name: "Kejklíř 5", icon: "🃏" },
            { code: "S10", type: "ANIMAL", subtype: "falcon", setId: 10, name: "Sokol 10 (Sokol královský)", icon: "🦅" },
            { code: "KREJ2", type: "BUILDING", subtype: "tailor", name: "Krejčí 2", icon: "🧵" },
            { code: "K10", type: "ANIMAL", subtype: "horse", setId: 10, name: "Kůň 10 (Válečný oř)", icon: "🐎" },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true },
            { code: "N11", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "OBCHOD5", type: "MERCHANT", name: "Obchodník – Odbočka k Hradu 1", icon: "⚖️", isJunction: true },
            { code: "P10", type: "ANIMAL", subtype: "dog", setId: 10, name: "Pes 10 (Královský chrt)", icon: "🐕" }
        ];

        // Rozložíme levý oblouk do dvou navazujících Bézierových křivek (spodní levý oblouk -> horní levý oblouk k STARTu)
        var leftPart1Pts = this.sampleBezier([212, 790], [52, 760], [52, 520], [72, 345], 16, true);
        var leftPart2Pts = this.sampleBezier([82, 295], [105, 100], [275, 72], [456, 72], 10, true);
        var leftPts = leftPart1Pts.concat(leftPart2Pts);

        var allOuterDefs = topDefs.concat(rightDefs).concat(bottomDefs).concat(leftDefs);
        var allOuterPts = topPts.concat(rightPts).concat(bottomPts).concat(leftPts);

        var nodes = [];
        var totalOuter = allOuterDefs.length;
        for (var i = 0; i < totalOuter; i++) {
            var d = allOuterDefs[i];
            var pt = allOuterPts[i];
            nodes.push({
                id: i,
                code: d.code,
                type: d.type,
                subtype: d.subtype || null,
                setId: d.setId || null,
                estateId: d.estateId || null,
                castleImg: d.castleImg || null,
                castleId: d.castleId || null,
                jesterId: d.jesterId || null,
                skill: d.skill || null,
                hasRoof: !!d.hasRoof,
                isJunction: !!d.isJunction,
                name: d.name,
                icon: d.icon,
                x: pt.x,
                y: pt.y,
                next: [(i + 1) % totalOuter],
                branchLow: null,
                branchHigh: null
            });
        }

        // B) VNITŘNÍ VĚTEV 1 (PRAVÁ): Odbočka z P2 (uzel 13) kolem Zvěře/Monster/Draků a Hradu 2 -> návrat do N5 (uzel 31)
        var rightBranchDefs = [
            { code: "P11", type: "ANIMAL", subtype: "dog", setId: 11, name: "Pes 11 (Stříbrný ohař)", icon: "🐕" },
            { code: "MJ1", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "MCH2", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "S11", type: "ANIMAL", subtype: "falcon", setId: 11, name: "Sokol 11 (Bílý raroh)", icon: "🦅" },
            { code: "KOV_R", type: "BUILDING", subtype: "forge", name: "Hradní zbrojíř", icon: "⚒️" },
            { code: "U2_R1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
            { code: "K11", type: "ANIMAL", subtype: "horse", setId: 11, name: "Kůň 11 (Hvězdný hřebec)", icon: "🐎" },
            { code: "VM2", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️" },
            { code: "U2_R2", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "U3_1", type: "QUEST", subtype: "U3", name: "Dračí sluj I (U3)", icon: "🐉" },
            { code: "U3_2", type: "QUEST", subtype: "U3", name: "Tříhlavý drak II (U3)", icon: "🐲" },
            { code: "H2", type: "CASTLE", estateId: "H2", name: "Hrad 2 (" + castleDefH2.name + ")", icon: castleDefH2.icon || "☁️", castleImg: castleDefH2.img }
        ];
        var rightBranchPts = this.sampleBezier([1095, 165], [1085, 360], [1235, 510], [1185, 725], rightBranchDefs.length, true);
        var rbStart = nodes.length;
        for (var r = 0; r < rightBranchDefs.length; r++) {
            var rbd = rightBranchDefs[r];
            var rpt = rightBranchPts[r];
            var rid = nodes.length;
            nodes.push({
                id: rid,
                code: rbd.code,
                type: rbd.type,
                subtype: rbd.subtype || null,
                setId: rbd.setId || null,
                estateId: rbd.estateId || null,
                castleImg: rbd.castleImg || null,
                skill: rbd.skill || null,
                name: rbd.name,
                icon: rbd.icon,
                x: rpt.x,
                y: rpt.y,
                next: [r < rightBranchDefs.length - 1 ? rid + 1 : 31],
                branchLow: null,
                branchHigh: null
            });
        }
        nodes[13].branchLow = 14;
        nodes[13].branchHigh = rbStart;

        // C) VNITŘNÍ VĚTEV 2 (STŘEDNÍ MOST SLAVNOSTÍ POD HRADEM):
        var bridgeDefs = [
            { code: "SLAV_BRANA", type: "CHANCE", name: "Slavnostní brána", icon: "🎪" },
            { code: "N_BR1", type: "CHANCE", name: "Náhoda u mostu", icon: "❓" },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️" },
            { code: "KREJ1", type: "BUILDING", subtype: "tailor", name: "Krejčí 1", icon: "🧵" },
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "tournament", name: "SLAVNOST: Královský Turnaj ♡", icon: "💖" },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ball", name: "SLAVNOST: Zámecký Ples ♡", icon: "💖" },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "race", name: "SLAVNOST: Velký Závod ♡", icon: "💖" },
            { code: "N_BR2", type: "CHANCE", name: "Náhoda pod hradem", icon: "❓" },
            { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃" },
            { code: "U1_BR", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "U2_BR", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 (Slunečná)", icon: "🏘️", hasRoof: true },
            { code: "KRCMA_BR", type: "TAVERN", name: "Hradní šenk", icon: "🍺" },
            { code: "MCH_BR", type: "MASTER", skill: "charisma", name: "Mistr Dvornosti", icon: "✨" }
        ];
        var bridgePts = this.sampleBezier([845, 745], [690, 540], [430, 540], [275, 745], bridgeDefs.length, true);
        var brStart = nodes.length;
        for (var b = 0; b < bridgeDefs.length; b++) {
            var bdf = bridgeDefs[b];
            var bpt = bridgePts[b];
            var bid = nodes.length;
            nodes.push({
                id: bid,
                code: bdf.code,
                type: bdf.type,
                subtype: bdf.subtype || null,
                setId: bdf.setId || null,
                estateId: bdf.estateId || null,
                skill: bdf.skill || null,
                hasRoof: !!bdf.hasRoof,
                name: bdf.name,
                icon: bdf.icon,
                x: bpt.x,
                y: bpt.y,
                next: [b < bridgeDefs.length - 1 ? bid + 1 : 51],
                branchLow: null,
                branchHigh: null
            });
        }
        nodes[37].branchLow = 38;
        nodes[37].branchHigh = brStart;

        // D) VNITŘNÍ VĚTEV 3 (LEVÁ SMYČKA KOLEM HRADU 1):
        var leftBranchDefs = [
            { code: "S12", type: "ANIMAL", subtype: "falcon", setId: 12, name: "Sokol 12 (Fénixův sokol)", icon: "🦅" },
            { code: "SOK2", type: "BUILDING", subtype: "falconer", name: "Sokolník 2", icon: "🦅" },
            { code: "U2_L1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "K12", type: "ANIMAL", subtype: "horse", setId: 12, name: "Kůň 12 (Královský oř)", icon: "🐎" },
            { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1 (" + castleDefH1.name + ")", icon: castleDefH1.icon || "🌲", castleImg: castleDefH1.img },
            { code: "P12", type: "ANIMAL", subtype: "dog", setId: 12, name: "Pes 12 (Zlatý chrt)", icon: "🐕" },
            { code: "MT2", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃" }
        ];
        var leftBranchPts = this.sampleBezier([412, 132], [355, 235], [250, 295], [140, 310], leftBranchDefs.length, true);
        var lbStart = nodes.length;
        for (var l = 0; l < leftBranchDefs.length; l++) {
            var lbd = leftBranchDefs[l];
            var lpt = leftBranchPts[l];
            var lid = nodes.length;
            nodes.push({
                id: lid,
                code: lbd.code,
                type: lbd.type,
                subtype: lbd.subtype || null,
                setId: lbd.setId || null,
                estateId: lbd.estateId || null,
                castleImg: lbd.castleImg || null,
                skill: lbd.skill || null,
                name: lbd.name,
                icon: lbd.icon,
                x: lpt.x,
                y: lpt.y,
                next: [l < leftBranchDefs.length - 1 ? lid + 1 : 67], // 67 = K9 na levém boku
                branchLow: null,
                branchHigh: null
            });
        }
        nodes[76].branchLow = 77; // 77 = P10 -> START
        nodes[76].branchHigh = lbStart;

        // Dekorativní zóny pro balíčky karet a dominanty přesně dle IMG_4599
        var cardZones = [
            { code: "VECI_1", title: "VĚCI 1", subtitle: "2 500 zl.", icon: "🗡️", color: "#60a5fa", x: 440, y: 155, w: 90, h: 96, actionTier: 1, count: 9 },
            { code: "VECI_2", title: "VĚCI 2", subtitle: "7 000 zl.", icon: "⚔️", color: "#a855f7", x: 550, y: 155, w: 90, h: 96, actionTier: 2, count: 7 },
            { code: "VECI_3", title: "VĚCI 3", subtitle: "12 000 zl.", icon: "👑", color: "#f59e0b", x: 660, y: 155, w: 90, h: 96, actionTier: 3, count: 4 },
            { code: "ZVER_U1", title: "ZVĚŘ", subtitle: "Obtížnost 4–6", icon: "🐗", color: "#4ade80", x: 920, y: 165, w: 100, h: 78, count: 4 },
            { code: "MONSTRA_U2", title: "MONSTRA", subtitle: "Obtížnost 8–10", icon: "👹", color: "#fb923c", x: 950, y: 265, w: 100, h: 78, count: 4 },
            { code: "DRACI_U3", title: "DRACI", subtitle: "Obtížnost 11–17", icon: "🐉", color: "#f43f5e", x: 980, y: 365, w: 100, h: 78, count: 20 },
            { code: "NAHODA_N", title: "NÁHODA", subtitle: "Karty osudu", icon: "❓", color: "#eab308", x: 250, y: 395, w: 76, h: 96, count: 24 },
            { code: "SLAVNOST_S", title: "SLAVNOSTI", subtitle: "Turnaj & ples", icon: "🎪", color: "#ec4899", x: 505, y: 415, w: 76, h: 86, count: 3 }
        ];

        var biomes = [
            {
                id: "mountain_ridge",
                name: "Dračí pohoří & Skalní srázy",
                fillGrad: "mountainBiomeGrad",
                fill: "rgba(68, 64, 60, 0.55)",
                opacity: 0.82,
                path: "M 960 60 C 1150 40 1350 180 1370 420 C 1380 620 1250 780 1080 770 C 1040 550 1020 320 960 60 Z",
                contours: [
                    "M 1040 120 Q 1200 90 1280 260 Q 1320 450 1240 650",
                    "M 1080 180 Q 1220 160 1270 340 Q 1280 520 1190 680"
                ],
                contourStroke: "rgba(251,191,36,0.38)",
                contourDash: "8,5"
            },
            {
                id: "forest_deep",
                name: "Královský hvozd Doubrava",
                fillGrad: "forestBiomeGrad",
                fill: "rgba(22, 101, 52, 0.50)",
                opacity: 0.78,
                path: "M 280 60 C 460 50 680 70 660 220 C 520 280 320 320 150 280 C 100 160 180 70 280 60 Z",
                contours: [
                    "M 260 90 Q 420 80 560 180 Q 450 240 280 250",
                    "M 180 150 Q 320 160 480 210"
                ],
                contourStroke: "rgba(134,239,172,0.30)",
                contourDash: "6,6"
            },
            {
                id: "meadows_valley",
                name: "Královské louky a lánová pole",
                fillGrad: "meadowsBiomeGrad",
                fill: "rgba(202, 138, 4, 0.42)",
                opacity: 0.75,
                path: "M 180 620 C 350 560 600 580 620 780 C 500 830 280 840 150 790 C 120 720 130 650 180 620 Z",
                contours: [
                    "M 220 660 Q 380 610 540 680",
                    "M 260 720 Q 410 670 510 750"
                ],
                contourStroke: "rgba(253,224,71,0.32)",
                contourDash: "5,5"
            }
        ];

        var rivers = [
            {
                id: "river_classic",
                name: "Královská řeka Doubravka",
                width: 14,
                color: "#0284c7",
                path: "M 1225 15 C 1205 60, 1190 95, 1177 127 C 1160 170, 1130 220, 1107 281 C 1075 355, 1025 415, 965 470 C 900 535, 835 605, 779 676 C 752 710, 734 756, 720 802 C 711 832, 703 874, 695 915"
            }
        ];

        var landmarks = [
            { id: "royalCastle", name: royalDef.name || "Královský Hrad", icon: royalDef.icon || "👑", image: royalDef.img || "assets/castles/castle_royal.png", x: 700, y: 390, w: 220, h: 180 },
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.png", x: 1085, y: 625, w: 140, h: 120 }
        ];

        return {
            code: "classic_96",
            name: "Klasický trojdílný plán (96 polí)",
            nodes: nodes,
            cardZones: cardZones,
            landmarks: landmarks,
            biomes: biomes,
            rivers: rivers
        };
    },

    // ========================================================================
    // 2. ILUSTROVANÝ PLÁN S DRAKEM A LESNÍ VĚŽÍ (1:1 dle originálu IMG_4598)
    // ========================================================================
    buildDragon4598Board: function () {
        var rawNodes = [
            // Horní okraj od STARTu doprava k odbočce u Výběrčího daní (uzly 0..5)
            { code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰", x: 700, y: 68, next: [1] },
            { code: "OBCHOD1", type: "MERCHANT", name: "Obchodník", icon: "⚖️", x: 810, y: 80, next: [2] },
            { code: "S1", type: "ANIMAL", subtype: "falcon", setId: 1, name: "Sokol 1 (Poštolka)", icon: "🦅", x: 910, y: 105, next: [3] },
            { code: "P1", type: "ANIMAL", subtype: "dog", setId: 1, name: "Pes 1 (Ohař)", icon: "🐕", x: 1005, y: 140, next: [4] },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓", x: 1090, y: 185, next: [5] },
            { code: "VD1", type: "TAX", name: "Výběrčí daní – Odbočka k věži", icon: "👑", isJunction: true, x: 1160, y: 240, branchLow: 6, branchHigh: 13 },

            // 1. Vnější okruh vpravo dolů (1–3) k uzlu N2 (uzly 6..12)
            { code: "K1", type: "ANIMAL", subtype: "horse", setId: 1, name: "Kůň 1 (Grošák)", icon: "🐎", x: 1240, y: 315, next: [7] },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true, x: 1275, y: 405, next: [8] },
            { code: "K2", type: "ANIMAL", subtype: "horse", setId: 2, name: "Kůň 2 (Hnědák)", icon: "🐎", x: 1285, y: 495, next: [9] },
            { code: "S2", type: "ANIMAL", subtype: "falcon", setId: 2, name: "Sokol 2 (Krahujec)", icon: "🦅", x: 1265, y: 585, next: [10] },
            { code: "P2", type: "ANIMAL", subtype: "dog", setId: 2, name: "Pes 2 (Bígl)", icon: "🐕", x: 1220, y: 670, next: [11] },
            { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 1150, y: 740, next: [12] },
            { code: "STAJE1", type: "BUILDING", subtype: "stables", name: "Stáje 1", icon: "🏠", x: 1060, y: 785, next: [21] },

            // 1. Vnitřní větev přes Lesní věž (+200 zl.) a Mistry (4–6) k uzlu N2 (uzly 13..20)
            { code: "BON_200", type: "BONUS", bonusGold: 200, name: "Lesní věž (+200 zl.)", icon: "⛲", x: 1075, y: 260, next: [14] },
            { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃", x: 1030, y: 325, next: [15] },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️", x: 995, y: 395, next: [16] },
            { code: "KREJ1", type: "BUILDING", subtype: "tailor", name: "Krejčí 1", icon: "🧵", x: 975, y: 470, next: [17] },
            { code: "HOSP", type: "HOSPITAL", name: "Lesní lazaret", icon: "🏥", x: 965, y: 545, next: [18] },
            { code: "MB2", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️", x: 975, y: 620, next: [19] },
            { code: "U2_1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹", x: 1000, y: 690, next: [20] },
            { code: "MJ1", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇", x: 1035, y: 745, next: [21] },

            // Spodní spojnice k odbočce na most Slavností (uzly 21..23)
            { code: "KRCMA", type: "TAVERN", name: "Zájezdní hostinec", icon: "🍺", x: 970, y: 805, next: [22] },
            { code: "OBCHOD2", type: "MERCHANT", name: "Obchodník", icon: "⚖️", x: 880, y: 818, next: [23] },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1 – Odbočka ke Slavnosti", icon: "🃏", isJunction: true, x: 790, y: 820, branchLow: 24, branchHigh: 28 },

            // 2. Spodní bezpečná cesta pod hradem (1–3) k Vesnici 3 (uzly 24..27)
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2 (Lhotka)", icon: "🏘️", hasRoof: true, x: 700, y: 825, next: [25] },
            { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 610, y: 822, next: [26] },
            { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 520, y: 815, next: [27] },
            { code: "K3", type: "ANIMAL", subtype: "horse", setId: 3, name: "Kůň 3 (Vraník)", icon: "🐎", x: 430, y: 805, next: [33] },

            // 2. Most Slavností ♡ ♡ ♡ pod Královským hradem (4–6) k Vesnici 3 (uzly 28..32)
            { code: "K4", type: "ANIMAL", subtype: "horse", setId: 4, name: "Kůň 4 (Ryzák)", icon: "🐎", x: 800, y: 725, next: [29] },
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "tournament", name: "SLAVNOST: Turnaj ♡ – Východ na hod 1–3", icon: "💖", isJunction: true, x: 735, y: 655, branchLow: 25, branchHigh: 30 },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ball", name: "SLAVNOST: Ples ♡", icon: "💖", x: 665, y: 645, next: [31] },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "race", name: "SLAVNOST: Závod ♡", icon: "💖", x: 595, y: 655, next: [32] },
            { code: "S4", type: "ANIMAL", subtype: "falcon", setId: 4, name: "Sokol 4 (Raroh)", icon: "🦅", x: 515, y: 720, next: [33] },

            // Levá stoupající cesta k Dračí odbočce (uzly 33..37)
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true, x: 350, y: 785, next: [34] },
            { code: "P3", type: "ANIMAL", subtype: "dog", setId: 3, name: "Pes 3 (Chrt)", icon: "🐕", x: 265, y: 745, next: [35] },
            { code: "P4", type: "ANIMAL", subtype: "dog", setId: 4, name: "Pes 4 (Barvář)", icon: "🐕", x: 195, y: 680, next: [36] },
            { code: "S3", type: "ANIMAL", subtype: "falcon", setId: 3, name: "Sokol 3 (Ostříž)", icon: "🦅", x: 145, y: 600, next: [37] },
            { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 – Odbočka k drakovi", icon: "🏘️", hasRoof: true, isJunction: true, x: 118, y: 510, branchLow: 38, branchHigh: 42 },

            // 3. Levá bezpečná cesta podél útesu (1–3) ke Koni 6 (uzly 38..41)
            { code: "SATL", type: "PRISON", name: "Hradní žalář", icon: "⛓️", x: 110, y: 420, next: [39] },
            { code: "K5", type: "ANIMAL", subtype: "horse", setId: 5, name: "Kůň 5 (Bělouš)", icon: "🐎", x: 125, y: 330, next: [40] },
            { code: "VD3", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 165, y: 250, next: [41] },
            { code: "S5", type: "ANIMAL", subtype: "falcon", setId: 5, name: "Sokol 5 (Královský ostříž)", icon: "🦅", x: 225, y: 185, next: [48] },

            // 3. Dračí stezka (+300 zl.) do sluje Tříhlavé saně (4–6) ke Koni 6 (uzly 42..47)
            { code: "BON_300", type: "BONUS", bonusGold: 300, name: "Dračí stezka (+300 zl.)", icon: "⛩️", x: 200, y: 490, next: [43] },
            { code: "P5", type: "ANIMAL", subtype: "dog", setId: 5, name: "Pes 5 (Slídič)", icon: "🐕", x: 265, y: 445, next: [44] },
            { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1 (Dračí Hrad)", icon: "🏯", x: 305, y: 390, next: [45] },
            { code: "U3_DRAK", type: "QUEST", subtype: "U3", name: "Tříhlavá saň (U3)", icon: "🐲", x: 315, y: 320, next: [46] },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️", x: 295, y: 245, next: [47] },
            { code: "K6", type: "ANIMAL", subtype: "horse", setId: 6, name: "Kůň 6 (Plavák)", icon: "🐎", x: 260, y: 180, next: [48] },

            // Návratová cesta podél hradeb zpět ke STARTu (uzly 48..51)
            { code: "S6", type: "ANIMAL", subtype: "falcon", setId: 6, name: "Sokol 6 (Jestřábník)", icon: "🦅", x: 320, y: 115, next: [49] },
            { code: "P6", type: "ANIMAL", subtype: "dog", setId: 6, name: "Pes 6 (Vlkodav)", icon: "🐕", x: 410, y: 85, next: [50] },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️", hasRoof: true, x: 510, y: 72, next: [51] },
            { code: "KOV1", type: "BUILDING", subtype: "forge", name: "Kovárna 1", icon: "⚒️", x: 610, y: 68, next: [0] }
        ];

        var nodes = rawNodes.map(function (n, i) {
            return {
                id: i,
                code: n.code,
                type: n.type,
                subtype: n.subtype || null,
                setId: n.setId || null,
                estateId: n.estateId || null,
                jesterId: n.jesterId || null,
                skill: n.skill || null,
                bonusGold: n.bonusGold || 0,
                isJunction: !!n.isJunction,
                hasRoof: !!n.hasRoof,
                name: n.name,
                icon: n.icon,
                x: n.x,
                y: n.y,
                next: n.next || [],
                branchLow: n.branchLow !== undefined ? n.branchLow : null,
                branchHigh: n.branchHigh !== undefined ? n.branchHigh : null
            };
        });

        return {
            code: "dragon_4598",
            name: "Ilustrovaný plán s Tříhlavým drakem a Lesní věží",
            nodes: nodes,
            cardZones: [
                { code: "VECI_1", title: "VĚCI 1", subtitle: "2 500 zl.", icon: "🗡️", color: "#60a5fa", x: 255, y: 180, w: 110, h: 115, actionTier: 1, count: 9 },
                { code: "VECI_2", title: "VĚCI 2", subtitle: "7 000 zl.", icon: "⚔️", color: "#a855f7", x: 380, y: 180, w: 110, h: 115, actionTier: 2, count: 7 },
                { code: "NAHODA_N", title: "NÁHODA", subtitle: "Karty osudu", icon: "❓", color: "#eab308", x: 915, y: 495, w: 90, h: 110, count: 24 },
                { code: "DRACI_U3", title: "DRACI", subtitle: "Obtížnost 11–17", icon: "🐉", color: "#f43f5e", x: 1025, y: 495, w: 120, h: 110, count: 20 }
            ],
            landmarks: [
                { id: "royalCastle", name: "Trojvěžový Královský Hrad", icon: "🏰", image: "assets/landmarks/royal_castle.png", x: 675, y: 405, w: 230, h: 190 },
                { id: "dragonLair", name: "Tříhlavá Saň (U3)", icon: "🐲", image: "assets/dragons/dragon_3headed.png", x: 425, y: 330, w: 145, h: 125 },
                { id: "forestTower", name: "Lesní Bašta (+200 zl.)", icon: "🌲", image: "assets/castles/castle_forest.png", x: 1140, y: 95, w: 130, h: 115 }
            ],
            biomes: this.buildClassic4599Board().biomes,
            rivers: this.buildClassic4599Board().rivers
        };
    },

    // Zpětná kompatibilita pro původní kód
    buildDragon4595Board: function () {
        return this.buildDragon4598Board();
    },

    // ========================================================================
    // 3. ZKRÁCENÝ RYTÍŘSKÝ PLÁN (Pro rychlé testování ~40 min)
    // ========================================================================
    buildCompactBoard: function () {
        var full = this.buildClassic4599Board();
        var outerDefs = [
            { code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰" },
            { code: "K1", type: "ANIMAL", subtype: "horse", setId: 1, name: "Kůň 1 (Grošák)", icon: "🐎" },
            { code: "S1", type: "ANIMAL", subtype: "falcon", setId: 1, name: "Sokol 1 (Poštolka)", icon: "🦅" },
            { code: "P1", type: "ANIMAL", subtype: "dog", setId: 1, name: "Pes 1 (Ohař)", icon: "🐕" },
            { code: "STAJE1", type: "BUILDING", subtype: "stables", name: "Stáje 1", icon: "🏠" },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true },
            { code: "OBCHOD1", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "VD1", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "K2", type: "ANIMAL", subtype: "horse", setId: 2, name: "Kůň 2 (Hnědák)", icon: "🐎" },
            { code: "S2", type: "ANIMAL", subtype: "falcon", setId: 2, name: "Sokol 2 (Krahujec)", icon: "🦅" },
            { code: "P2", type: "ANIMAL", subtype: "dog", setId: 2, name: "Pes 2 (Bígl)", icon: "🐕" },
            { code: "PSOV1", type: "BUILDING", subtype: "doghandler", name: "Psovod 1", icon: "🦴" },
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2 (Lhotka)", icon: "🏘️", hasRoof: true },
            { code: "HOSP", type: "HOSPITAL", name: "Královský lazaret", icon: "🏥" },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1", icon: "🃏" },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️" },
            { code: "K3", type: "ANIMAL", subtype: "horse", setId: 3, name: "Kůň 3 (Vraník)", icon: "🐎" },
            { code: "S3", type: "ANIMAL", subtype: "falcon", setId: 3, name: "Sokol 3 (Ostříž)", icon: "🦅" },
            { code: "P3", type: "ANIMAL", subtype: "dog", setId: 3, name: "Pes 3 (Chrt)", icon: "🐕" },
            { code: "SOK1", type: "BUILDING", subtype: "falconer", name: "Sokolník 1", icon: "🦅" },
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true },
            { code: "N2", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "KOV1", type: "BUILDING", subtype: "forge", name: "Kovárna 1", icon: "⚒️" },
            { code: "SATL", type: "PRISON", name: "Královská šatlava", icon: "⛓️" },
            { code: "K4", type: "ANIMAL", subtype: "horse", setId: 4, name: "Kůň 4 (Ryzák) – Odbočka", icon: "🐎", isJunction: true },
            { code: "S4", type: "ANIMAL", subtype: "falcon", setId: 4, name: "Sokol 4 (Raroh)", icon: "🦅" },
            { code: "P4", type: "ANIMAL", subtype: "dog", setId: 4, name: "Pes 4 (Barvář)", icon: "🐕" },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️", hasRoof: true },
            { code: "M2", type: "TOWN", estateId: "M2", name: "Město 2 (Stříbratec)", icon: "🏙️" },
            { code: "KRCMA", type: "TAVERN", name: "Krčma U Zlatého korbelu", icon: "🍺" },
            { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1 (Královský hrad)", icon: "🏰" },
            { code: "OBCHOD2", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "N3", type: "CHANCE", name: "Náhoda", icon: "❓" }
        ];

        var compactNodes = [];
        var outerCount = outerDefs.length;
        for (var i = 0; i < outerCount; i++) {
            var src = outerDefs[i];
            var angle = (i / outerCount) * Math.PI * 2 - Math.PI / 2;
            var rx = 560, ry = 330;
            compactNodes.push({
                id: i,
                code: src.code,
                type: src.type,
                subtype: src.subtype || null,
                setId: src.setId || null,
                estateId: src.estateId || null,
                jesterId: src.jesterId || null,
                skill: src.skill || null,
                hasRoof: !!src.hasRoof,
                isJunction: !!src.isJunction,
                name: src.name,
                icon: src.icon,
                x: Math.round(700 + Math.cos(angle) * rx),
                y: Math.round(430 + Math.sin(angle) * ry),
                next: [(i + 1) % outerCount],
                branchLow: null,
                branchHigh: null
            });
        }

        var bridge = [
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "tournament", name: "SLAVNOST: Turnaj ♡ – Východ na hod 1–3", icon: "💖", isJunction: true, x: 520, y: 520 },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ball", name: "SLAVNOST: Ples ♡", icon: "💖", x: 640, y: 520 },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "race", name: "SLAVNOST: Závod ♡", icon: "💖", x: 760, y: 520 },
            { code: "U3_1", type: "QUEST", subtype: "U3", name: "Dračí sluj (U3)", icon: "🐲", x: 880, y: 520 }
        ];
        var bStart = compactNodes.length;
        for (var b = 0; b < bridge.length; b++) {
            var bn = bridge[b];
            var id = compactNodes.length;
            compactNodes.push({
                id: id,
                code: bn.code,
                type: bn.type,
                subtype: bn.subtype,
                isJunction: !!bn.isJunction,
                name: bn.name,
                icon: bn.icon,
                x: bn.x,
                y: bn.y,
                next: [b < bridge.length - 1 ? id + 1 : 9],
                branchLow: null,
                branchHigh: null
            });
        }
        compactNodes[25].isJunction = true;
        compactNodes[25].branchLow = 26;
        compactNodes[25].branchHigh = bStart;

        // Východ z Turnaje na hod kostkou 1, 2, 3 zpět na hlavní okruh
        compactNodes[bStart].isJunction = true;
        compactNodes[bStart].branchLow = 26;
        compactNodes[bStart].branchHigh = bStart + 1;

        return {
            code: "compact_48",
            name: "Zkrácený královský okruh (Rychlá hra)",
            nodes: compactNodes,
            cardZones: [
                { code: "VECI_1", title: "VĚCI 1", subtitle: "2 500 zl.", icon: "🗡️", color: "#60a5fa", x: 380, y: 165, w: 105, h: 110, actionTier: 1, count: 9 },
                { code: "VECI_2", title: "VĚCI 2", subtitle: "7 000 zl.", icon: "⚔️", color: "#a855f7", x: 500, y: 165, w: 105, h: 110, actionTier: 2, count: 7 },
                { code: "NAHODA_N", title: "NÁHODA", subtitle: "Karty osudu", icon: "❓", color: "#eab308", x: 620, y: 165, w: 85, h: 110, count: 24 }
            ],
            landmarks: [
                { id: "royalCastle", name: "Královský Hrad", icon: "🏰", image: "assets/landmarks/royal_castle.png", x: 700, y: 320, w: 240, h: 200 },
                { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.png", x: 990, y: 430, w: 150, h: 130 }
            ],
            biomes: full.biomes,
            rivers: full.rivers
        };
    },

    // ========================================================================
    // 4. PROCEDURÁLNĚ GENEROVANÝ PLÁN
    // ========================================================================
    

    buildProceduralBoard: function (seed, options) {
        options = options || {};
        if (window.PRS_App && window.PRS_App.mapStudioOptions) {
            for (var k in window.PRS_App.mapStudioOptions) {
                if (options[k] === undefined) options[k] = window.PRS_App.mapStudioOptions[k];
            }
        }
        return window.KiDeskyMapGenerator.generate(seed, options);
    }
};

window.PRS_BoardBuilder.sampleRiverPathSimple = function (p) {
    return window.KiDeskyMapGenerator.sampleRiverPathSimple(p);
};

window.KiDeskyMapGenerator.sanitizeAndAnchorLandmarks = function (b) {
    return window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks(b);
};

// Helper pro dynamickou lokalizaci názvů hradů v katalozích game-boards
(function () {
    function wrapCastleList(list) {
        if (!list || !Array.isArray(list)) return;
        for (var i = 0; i < list.length; i++) {
            (function (c) {
                if (!c || c._i18nWrapped) return;
                var defName = c.name;
                var cKey = c.id ? c.id.replace("castle_", "") : "";
                Object.defineProperty(c, "name", {
                    get: function () {
                        return (window.PRS_I18n ? window.PRS_I18n.t("castles." + cKey + ".name", null, defName) : defName);
                    },
                    set: function (val) {
                        defName = val;
                    },
                    configurable: true,
                    enumerable: true
                });
                c._i18nWrapped = true;
            })(list[i]);
        }
    }
    if (window.PRS_GameBoardBuilder) {
        wrapCastleList(window.PRS_GameBoardBuilder.ALL_CASTLES);
        wrapCastleList(window.PRS_GameBoardBuilder.THEMATIC_CASTLES);
    }
})();
