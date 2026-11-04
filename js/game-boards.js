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
        desc: "Klapající roubený vodní mlýn s proudem vody stékajícím po lopatkách velkého dřevěného kola.",
        category: "agriculture",
        w: 64, h: 84, clearance: 36,
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
    // --- 7. Strážní objekty a tajemná obydlí ---
    wooden_watchtower: {
        id: "wooden_watchtower",
        name: "Dřevěná strážní věž",
        icon: "🗼",
        desc: "Vysoká dřevěná pozorovatelna s žebříkem a pochodní, odkud královské hlídky střeží obchodní stezky.",
        category: "civilization",
        w: 84, h: 50, clearance: 36,
        img: "assets/decorations/wooden_watchtower.png",
        imgFlip: "assets/decorations/wooden_watchtower_flip.png"
    },
    witch_hut: {
        id: "witch_hut",
        name: "Perníková chaloupka ježibaby",
        icon: "🧙‍♀️",
        desc: "Tajemná chaloupka s křivým komínem a bylinami, kde v kotlíku bublá podivuhodný lektvar.",
        category: "settlement",
        w: 84, h: 58, clearance: 38,
        img: "assets/decorations/witch_hut.png",
        imgFlip: "assets/decorations/witch_hut_flip.png"
    },
    // --- 8. Magická místa, ruiny a posvátné háje ---
    fairy_ring_mushrooms: {
        id: "fairy_ring_mushrooms",
        name: "Vílí houbový kruh",
        icon: "🍄",
        desc: "Magický kruh světélkujících hub na lesní mýtině, kde za svitu měsíce tančí víly a lesní bytosti.",
        category: "magic",
        w: 66, h: 84, clearance: 34,
        img: "assets/decorations/fairy_ring_mushrooms.png",
        imgFlip: "assets/decorations/fairy_ring_mushrooms_flip.png"
    },
    druid_monoliths: {
        id: "druid_monoliths",
        name: "Druidské menhiry a megalit",
        icon: "🪨",
        desc: "Kruh starobylých mechem obrostlých menhirů s vyrytými runami, které pulzují zemskou magií.",
        category: "magic",
        w: 79, h: 84, clearance: 38,
        img: "assets/decorations/druid_monoliths.png",
        imgFlip: "assets/decorations/druid_monoliths_flip.png"
    },
    ancient_ruins: {
        id: "ancient_ruins",
        name: "Zarostlé kamenné zříceniny",
        icon: "🏛️",
        desc: "Zarostlé kamenné zříceniny s gotickým obloukem a rozpadlými zdmi, skrývající dávno zapomenuté poklady.",
        category: "terrain",
        w: 80, h: 84, clearance: 38,
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
        desc: "Skalní jeskyně plná kostí a trofejí, sloužící jako brloh obrovského divokého medvěda.",
        category: "quest_lair",
        w: 64, h: 84, clearance: 38,
        img: "assets/decorations/cave_bear_den.png",
        imgFlip: "assets/decorations/cave_bear_den_flip.png"
    },
    bandit_cave: {
        id: "bandit_cave",
        name: "Loupežnická jeskyně s pokladem",
        icon: "💰",
        desc: "Loupežnické doupě osvětlené pochodněmi, plné otevřených truhel se zlaťáky a zcizenými cennostmi.",
        category: "quest_lair",
        w: 83, h: 84, clearance: 38,
        img: "assets/decorations/bandit_cave.png",
        imgFlip: "assets/decorations/bandit_cave_flip.png"
    },
    dragon_cave: {
        id: "dragon_cave",
        name: "Spící drak ve sluji",
        icon: "🐉",
        desc: "Monumentální jeskyně, v jejímž nitru tvrdě spí drak na obrovské hromadě královského zlata.",
        category: "quest_lair",
        w: 84, h: 51, clearance: 38,
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

window.PRS_BoardBuilder = {
    createBoard: function (templateCode) {
        var board;
        if (templateCode === "dragon_4598" || templateCode === "dragon_4595") {
            board = this.buildDragon4598Board();
        } else if (templateCode === "compact_48") {
            board = this.buildCompactBoard();
        } else if (templateCode === "procedural") {
            board = this.buildProceduralBoard();
        } else {
            board = this.buildClassic4599Board();
        }
        // Automatické generické ověření a bezpečné ukotvení dominant bez kolizí
        this.sanitizeAndAnchorLandmarks(board);
        // Generování procedurálních a ukotvených dekorací krajiny
        this.generateBoardDecorations(board);
        return board;
    },

    // ========================================================================
    // GENERICKÝ ROZVRHOVAČ & KOLIZNÍ VALIDÁTOR DOMINANT (LANDMARKS ENGINE)
    // Bezpečné ukotvení dominant pro pevné, procedurální i budoucí generické plány
    // ========================================================================
// ========================================================================
    // PROCEDURÁLNÍ DEKORACE KRAJINY (POISSON-SCATTER & NODE-ANCHORED PROPS)
    // Generuje bohatou krajinu bez kolizí s políčky, cestami a kartami
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

        function isPositionClear(x, y, radius) {
            if (x - radius < 40 || x + radius > 1360 || y - radius < 40 || y + radius > 820) return false;

            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var dx = n.x - x;
                var dy = n.y - y;
                var distSq = dx * dx + dy * dy;
                var minDist = radius + 36;
                if (distSq < minDist * minDist) return false;
            }

            for (var z = 0; z < cardZones.length; z++) {
                var cz = cardZones[z];
                if (x + radius > cz.x - 12 && x - radius < cz.x + cz.w + 12 &&
                    y + radius > cz.y - 12 && y - radius < cz.y + cz.h + 12) {
                    return false;
                }
            }

            for (var l = 0; l < landmarks.length; l++) {
                var lm = landmarks[l];
                var lx1 = lm.x - lm.w / 2 - 16;
                var lx2 = lm.x + lm.w / 2 + 16;
                var ly1 = lm.y - lm.h / 2 - 16;
                var ly2 = lm.y + lm.h / 2 + 16;
                if (x + radius > lx1 && x - radius < lx2 && y + radius > ly1 && y - radius < ly2) {
                    return false;
                }
            }

            for (var d = 0; d < decorList.length; d++) {
                var dec = decorList[d];
                var ddx = dec.x - x;
                var ddy = dec.y - y;
                var dDist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (dDist < (radius + dec.clearance)) {
                    return false;
                }
            }

            return true;
        }

        // A) Ukotvené rekvizity k políčkům (Node-Anchored Props)
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
            } else if (node.type === "BUILDING" && node.subtype === "kovarna") {
                propKey = "watermill";
            } else if (node.type === "BUILDING" && (node.subtype === "staje" || node.subtype === "psovod")) {
                propKey = "pasture_fence";
            } else if (node.type === "QUEST") {
                var questProps = ["dragon_cave", "cave_bear_den", "bandit_cave", "basilisk_cave", "snow_troll_cave", "swamp_hydra", "swamp_troll"];
                propKey = questProps[nIdx % questProps.length];
            } else if (node.type === "CHANCE" || node.type === "JESTER") {
                var magicProps = ["fairy_ring_mushrooms", "druid_monoliths", "witch_hut", "ancient_ruins"];
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
                    var testDist = 68;
                    var px = Math.round(node.x + Math.cos(ang) * testDist);
                    var py = Math.round(node.y + Math.sin(ang) * testDist);
                    if (isPositionClear(px, py, catItem.clearance)) {
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

        // B) Rozptýlená krajina (Scatter Terrain)
        var scatterPool = [
            "tree_oak", "tree_oak", "tree_pine", "tree_pine", "tree_birch",
            "grove_oak", "grove_pine", "grove_pine2", "rock_boulder", "rock_boulder",
            "farm_field", "windmill", "lake_pond", "mountain_peaks",
            "orchad_apple", "hruskovy_sad", "orchad_plum", "bush", "bush",
            "watermill", "wooden_watchtower", "ancient_ruins", "druid_monoliths",
            "fairy_ring_mushrooms", "swamp_bridge", "unicorn_grove", "pegasus_pond",
            "dryad_sacred_oak"
        ];

        for (var gx = 70; gx <= 1330; gx += 65) {
            for (var gy = 70; gy <= 790; gy += 65) {
                var jx = Math.round(gx + (rnd() - 0.5) * 45);
                var jy = Math.round(gy + (rnd() - 0.5) * 45);

                var pickKey;
                if (jy < 180 && (jx < 350 || jx > 1050) && rnd() < 0.45) {
                    pickKey = "mountain_peaks";
                } else if (rnd() < 0.08) {
                    pickKey = "lake_pond";
                } else if (rnd() < 0.12) {
                    pickKey = "farm_field";
                } else {
                    pickKey = scatterPool[Math.floor(rnd() * scatterPool.length)];
                }

                var itemDef = catalog[pickKey];
                if (itemDef && isPositionClear(jx, jy, itemDef.clearance)) {
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

        // Detekce kolize bodu/obdélníku s herními políčky a balíčky karet
        function getClearance(cx, cy, w, h) {
            var r = Math.min(w, h) * 0.42;
            var minNodeDist = 9999;
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var dist = Math.sqrt((n.x - cx) * (n.x - cx) + (n.y - cy) * (n.y - cy));
                if (dist < minNodeDist) minNodeDist = dist;
                if (dist < (r + 26)) {
                    return -1; // Kolize s uzlem trasy
                }
            }
            var lx1 = cx - w / 2, lx2 = cx + w / 2;
            var ly1 = cy - h / 2, ly2 = cy + h / 2;
            for (var z = 0; z < cardZones.length; z++) {
                var cz = cardZones[z];
                var ox = Math.max(0, Math.min(lx2, cz.x + cz.w) - Math.max(lx1, cz.x));
                var oy = Math.max(0, Math.min(ly2, cz.y + cz.h) - Math.max(ly1, cz.y));
                if (ox > 0 && oy > 0) {
                    return -2; // Kolize s balíčkem karet
                }
            }
            return minNodeDist;
        }

        // 1. Ověření explicitních dominant plánu a vyřazení kolizních
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

        // 2. Garance centrálního Královského hradu (cíl hry Princeznino srdce)
        var hasCastle = false;
        for (var v = 0; v < validLandmarks.length; v++) {
            if (validLandmarks[v].id === "royalCastle") { hasCastle = true; break; }
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
                        name: "Královský Hrad",
                        icon: "🏰",
                        image: "assets/landmarks/royal_castle.png",
                        x: cand.x,
                        y: cand.y,
                        w: cand.w,
                        h: cand.h
                    });
                    hasCastle = true;
                    break;
                }
            }
        }

        // 3. Garance logického ukotvení Dračího doupěte k Dračí sluji (U3)
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

        board.landmarks = validLandmarks;
    },

    // Pomocná funkce pro hladkou kubickou Bézierovu křivku (vrací N bodů mezi P0, P1, P2, P3)
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

    // ========================================================================
    // 1. KLASICKÝ TROJDÍLNÝ PLÁN (1:1 dle fotografie IMG_4599.jpg)
    // ========================================================================
    buildClassic4599Board: function () {
        // A) Hlavní obvodový okruh (74 polí, plynule zaoblený přesně podle IMG_4599)
        // Sekce 1: Horní rovinka od STARTu (x=500, y=72) doprava k P2 (x=1145, y=108) -> 14 polí (indexy 0..13)
        var topDefs = [
            { code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰" },
            { code: "K1", type: "ANIMAL", subtype: "kun", setId: 1, name: "Kůň 1 (Grošák)", icon: "🐎" },
            { code: "S1", type: "ANIMAL", subtype: "sokol", setId: 1, name: "Sokol 1 (Poštolka)", icon: "🦅" },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "STAJE1", type: "BUILDING", subtype: "staje", name: "Stáje 1", icon: "🏠" },
            { code: "P1", type: "ANIMAL", subtype: "pes", setId: 1, name: "Pes 1 (Ohař)", icon: "🐕" },
            { code: "OBCHOD1", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "VD1", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "HOSP", type: "HOSPITAL", name: "Královský lazaret", icon: "🏥" },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1", icon: "🃏" },
            { code: "K2", type: "ANIMAL", subtype: "kun", setId: 2, name: "Kůň 2 (Hnědák)", icon: "🐎" },
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2 (Lhotka)", icon: "🏘️", hasRoof: true },
            { code: "S2", type: "ANIMAL", subtype: "sokol", setId: 2, name: "Sokol 2 (Krahujec)", icon: "🦅" },
            { code: "P2", type: "ANIMAL", subtype: "pes", setId: 2, name: "Pes 2 (Bígl) – Odbočka", icon: "🐕", isJunction: true }
        ];
        var topPts = this.sampleBezier([500, 72], [730, 70], [980, 70], [1148, 108], topDefs.length, true);

        // Sekce 2: Pravý oblouk od Kovárny 1 (za P2) dolů k P4 a N (indexy 14..31, 18 polí)
        var rightDefs = [
            { code: "KOV1", type: "BUILDING", subtype: "kovarna", name: "Kovárna 1", icon: "⚒️" },
            { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "K3", type: "ANIMAL", subtype: "kun", setId: 3, name: "Kůň 3 (Vraník)", icon: "🐎" },
            { code: "N3", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "PSOV1", type: "BUILDING", subtype: "psovod", name: "Psovod 1", icon: "🦴" },
            { code: "S11_OUT", type: "ANIMAL", subtype: "sokol", setId: 11, name: "Sokol 11 (Raroh)", icon: "🦅" },
            { code: "S3", type: "ANIMAL", subtype: "sokol", setId: 3, name: "Sokol 3 (Ostříž)", icon: "🦅" },
            { code: "N4", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P3", type: "ANIMAL", subtype: "pes", setId: 3, name: "Pes 3 (Chrt)", icon: "🐕" },
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true },
            { code: "OBCHOD2", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "M3_R", type: "TOWN", estateId: "M3", name: "Město 3 (Zlatov)", icon: "🏙️" },
            { code: "K4", type: "ANIMAL", subtype: "kun", setId: 4, name: "Kůň 4 (Ryzák)", icon: "🐎" },
            { code: "KE2", type: "JESTER", jesterId: 2, name: "Kejklíř 2", icon: "🃏" },
            { code: "S4", type: "ANIMAL", subtype: "sokol", setId: 4, name: "Sokol 4 (Raroh)", icon: "🦅" },
            { code: "MCH1", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "P4", type: "ANIMAL", subtype: "pes", setId: 4, name: "Pes 4 (Barvář)", icon: "🐕" },
            { code: "N5", type: "CHANCE", name: "Náhoda (Soutok u Hradu 2)", icon: "❓" }
        ];
        var rightPts = this.sampleBezier([1188, 134], [1365, 290], [1365, 650], [1160, 782], rightDefs.length, true);

        // Sekce 3: Dolní rovinka zprava doleva od Kovárny 2 přes odbočku na most SLAVNOSTÍ až k S8 (indexy 32..51, 20 polí)
        var bottomDefs = [
            { code: "KOV2", type: "BUILDING", subtype: "kovarna", name: "Kovárna 2", icon: "⚒️" },
            { code: "K5", type: "ANIMAL", subtype: "kun", setId: 5, name: "Kůň 5 (Bělouš)", icon: "🐎" },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️" },
            { code: "P5", type: "ANIMAL", subtype: "pes", setId: 5, name: "Pes 5 (Slídič)", icon: "🐕" },
            { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "S6", type: "ANIMAL", subtype: "sokol", setId: 6, name: "Sokol 6 – Odbočka ke Slavnosti", icon: "🦅", isJunction: true },
            { code: "U1_3", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "K6", type: "ANIMAL", subtype: "kun", setId: 6, name: "Kůň 6 (Plavák)", icon: "🐎" },
            { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "U1_4", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "KE3", type: "JESTER", jesterId: 3, name: "Kejklíř 3", icon: "🃏" },
            { code: "SATL", type: "PRISON", name: "Královská šatlava", icon: "⛓️" },
            { code: "OBCHOD3", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "STAJE2", type: "BUILDING", subtype: "staje", name: "Stáje 2", icon: "🏠" },
            { code: "P6", type: "ANIMAL", subtype: "pes", setId: 6, name: "Pes 6 (Vlkodav)", icon: "🐕" },
            { code: "MB1", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️" },
            { code: "V5", type: "VILLAGE", estateId: "V5", name: "Vesnice 5 (Skalice)", icon: "🏘️", hasRoof: true },
            { code: "M2", type: "TOWN", estateId: "M2", name: "Město 2 (Stříbratec)", icon: "🏙️" },
            { code: "K7", type: "ANIMAL", subtype: "kun", setId: 7, name: "Kůň 7 (Šiml)", icon: "🐎" },
            { code: "S8", type: "ANIMAL", subtype: "sokol", setId: 8, name: "Sokol 8 (Orlovec)", icon: "🦅" }
        ];
        var bottomPts = this.sampleBezier([1110, 795], [820, 804], [520, 804], [255, 795], bottomDefs.length, true);

        // Sekce 4: Levý oblouk zdola od Psovodu 2 nahoru přes V8, K9, M3, V1, Obchod 5 a P10 zpět do STARTu (indexy 52..75, 24 polí)
        var leftDefs = [
            { code: "PSOV2", type: "BUILDING", subtype: "psovod", name: "Psovod 2", icon: "🦴" },
            { code: "N7", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P7", type: "ANIMAL", subtype: "pes", setId: 7, name: "Pes 7 (Doga)", icon: "🐕" },
            { code: "V6", type: "VILLAGE", estateId: "V6", name: "Vesnice 6 (Meziříčí)", icon: "🏘️" },
            { code: "N8", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "S12", type: "ANIMAL", subtype: "sokol", setId: 12, name: "Sokol 12 (Fénixův sokol)", icon: "🦅" },
            { code: "KE4", type: "JESTER", jesterId: 4, name: "Kejklíř 4", icon: "🃏" },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️" },
            { code: "K8", type: "ANIMAL", subtype: "kun", setId: 8, name: "Kůň 8 (Fríský oř)", icon: "🐎" },
            { code: "N9", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P8", type: "ANIMAL", subtype: "pes", setId: 8, name: "Pes 8 (Chrtí král)", icon: "🐕" },
            { code: "S9", type: "ANIMAL", subtype: "sokol", setId: 9, name: "Sokol 9 (Jestřáb)", icon: "🦅" },
            { code: "OBCHOD4", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "U1_5", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "V8", type: "VILLAGE", estateId: "V8", name: "Vesnice 8 (Podhradí)", icon: "🏘️" },
            { code: "K9", type: "ANIMAL", subtype: "kun", setId: 9, name: "Kůň 9 (Andaluský hřebec)", icon: "🐎" },
            { code: "M3", type: "TOWN", estateId: "M3", name: "Město 3 (Zlatov)", icon: "🏙️" },
            { code: "KRCMA", type: "TAVERN", name: "Krčma U Zlatého korbelu", icon: "🍺" },
            { code: "KE5", type: "JESTER", jesterId: 5, name: "Kejklíř 5", icon: "🃏" },
            { code: "S10", type: "ANIMAL", subtype: "sokol", setId: 10, name: "Sokol 10 (Sokol královský)", icon: "🦅" },
            { code: "KREJ2", type: "BUILDING", subtype: "krejci", name: "Krejčí 2", icon: "🧵" },
            { code: "K10", type: "ANIMAL", subtype: "kun", setId: 10, name: "Kůň 10 (Válečný oř)", icon: "🐎" },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true },
            { code: "N11", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "OBCHOD5", type: "MERCHANT", name: "Obchodník – Odbočka k Hradu 1", icon: "⚖️", isJunction: true },
            { code: "P10", type: "ANIMAL", subtype: "pes", setId: 10, name: "Pes 10 (Královský chrt)", icon: "🐕" }
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
        // Přesně podle pravého listu IMG_4599: P11 -> MJ -> MCH -> S11 -> Sokolník 1 -> U2 -> M4 -> K12 -> Mistr -> U2 -> U3 -> U3 -> Hrad 2
        var rightBranchDefs = [
            { code: "P11", type: "ANIMAL", subtype: "pes", setId: 11, name: "Pes 11 (Stříbrný ohař)", icon: "🐕" },
            { code: "MJ1", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "MCH2", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "S11", type: "ANIMAL", subtype: "sokol", setId: 11, name: "Sokol 11 (Bílý raroh)", icon: "🦅" },
            { code: "SOK1", type: "BUILDING", subtype: "sokolnik", name: "Sokolník 1", icon: "🦅" },
            { code: "U2_R1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
            { code: "K12", type: "ANIMAL", subtype: "kun", setId: 12, name: "Kůň 12 (Královský oř)", icon: "🐎" },
            { code: "VM2", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️" },
            { code: "U2_R2", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "U3_1", type: "QUEST", subtype: "U3", name: "Dračí sluj I (U3)", icon: "🐉" },
            { code: "U3_2", type: "QUEST", subtype: "U3", name: "Tříhlavý drak II (U3)", icon: "🐲" },
            { code: "H2", type: "CASTLE", estateId: "H2", name: "Hrad 2 (Orlí Hrad)", icon: "🏯" }
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
        // Odbočka ze S6 (uzel 37) obloukem přes S5 -> N -> M1 -> Krejčí 1 -> SLAVNOST (Turnaj, Ples, Závod) -> N -> MT -> U1 -> U2 -> V7 -> S7 -> M -> návrat do S8 (uzel 51)
        var bridgeDefs = [
            { code: "S5", type: "ANIMAL", subtype: "sokol", setId: 5, name: "Sokol 5 (Královský ostříž)", icon: "🦅" },
            { code: "N_BR1", type: "CHANCE", name: "Náhoda u mostu", icon: "❓" },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️" },
            { code: "KREJ1", type: "BUILDING", subtype: "krejci", name: "Krejčí 1", icon: "🧵" },
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "turnaj", name: "SLAVNOST: Královský Turnaj ♡", icon: "💖" },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ples", name: "SLAVNOST: Zámecký Ples ♡", icon: "💖" },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "zavod", name: "SLAVNOST: Velký Závod ♡", icon: "💖" },
            { code: "N_BR2", type: "CHANCE", name: "Náhoda pod hradem", icon: "❓" },
            { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃" },
            { code: "U1_BR", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "U2_BR", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 (Slunečná)", icon: "🏘️", hasRoof: true },
            { code: "S7", type: "ANIMAL", subtype: "sokol", setId: 7, name: "Sokol 7 (Luňák)", icon: "🦅" },
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
        // Přesně podle levého listu IMG_4599: odbočka z OBCHOD5 (uzel 76) dolů doleva přes P9 -> Sokolník 2 -> U2 -> K11 -> Hrad 1 -> P12 -> MT -> napojení do K9 (uzel 67)
        var leftBranchDefs = [
            { code: "P9", type: "ANIMAL", subtype: "pes", setId: 9, name: "Pes 9 (Lovecký chrt)", icon: "🐕" },
            { code: "SOK2", type: "BUILDING", subtype: "sokolnik", name: "Sokolník 2", icon: "🦅" },
            { code: "U2_L1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "K11", type: "ANIMAL", subtype: "kun", setId: 11, name: "Kůň 11 (Hvězdný hřebec)", icon: "🐎" },
            { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1 (Lví Hrad)", icon: "🏯" },
            { code: "P12", type: "ANIMAL", subtype: "pes", setId: 12, name: "Pes 12 (Zlatý chrt)", icon: "🐕" },
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
            { code: "VECI_1", title: "VĚCI 1", subtitle: "2 500 zl.", icon: "🗡️", color: "#60a5fa", x: 435, y: 145, w: 118, h: 125, actionTier: 1, count: 9 },
            { code: "VECI_2", title: "VĚCI 2", subtitle: "7 000 zl.", icon: "⚔️", color: "#a855f7", x: 580, y: 145, w: 125, h: 125, actionTier: 2, count: 7 },
            { code: "VECI_3", title: "VĚCI 3", subtitle: "12 000 zl.", icon: "👑", color: "#f59e0b", x: 732, y: 145, w: 125, h: 125, actionTier: 3, count: 4 },
            { code: "ZVER_U1", title: "ZVĚŘ", subtitle: "Obtížnost 4–6", icon: "🐗", color: "#4ade80", x: 935, y: 155, w: 125, h: 90, count: 4 },
            { code: "MONSTRA_U2", title: "MONSTRA", subtitle: "Obtížnost 8–10", icon: "👹", color: "#fb923c", x: 965, y: 275, w: 135, h: 95, count: 4 },
            { code: "DRACI_U3", title: "DRACI", subtitle: "Obtížnost 11–17", icon: "🐉", color: "#f43f5e", x: 1005, y: 398, w: 135, h: 95, count: 20 },
            { code: "NAHODA_N", title: "NÁHODA", subtitle: "Karty osudu", icon: "❓", color: "#eab308", x: 245, y: 410, w: 86, h: 115, count: 24 },
            { code: "SLAVNOST_S", title: "SLAVNOSTI", subtitle: "Turnaj & ples", icon: "🎪", color: "#ec4899", x: 495, y: 425, w: 88, h: 100, count: 3 }
        ];

        var landmarks = [
            { id: "royalCastle", name: "Královský Hrad", icon: "🏰", image: "assets/landmarks/royal_castle.png", x: 700, y: 390, w: 220, h: 180 },
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.png", x: 1085, y: 625, w: 140, h: 120 }
        ];

        return {
            code: "classic_96",
            name: "Klasický trojdílný plán (96 polí)",
            nodes: nodes,
            cardZones: cardZones,
            landmarks: landmarks
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
            { code: "S1", type: "ANIMAL", subtype: "sokol", setId: 1, name: "Sokol 1", icon: "🦅", x: 910, y: 105, next: [3] },
            { code: "P1", type: "ANIMAL", subtype: "pes", setId: 1, name: "Pes 1", icon: "🐕", x: 1005, y: 140, next: [4] },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓", x: 1090, y: 185, next: [5] },
            { code: "VD1", type: "TAX", name: "Výběrčí daní – Odbočka k věži", icon: "👑", isJunction: true, x: 1160, y: 240, branchLow: 6, branchHigh: 13 },

            // 1. Vnější okruh vpravo dolů (1–3) k uzlu N2 (uzly 6..12)
            { code: "K1", type: "ANIMAL", subtype: "kun", setId: 1, name: "Kůň 1", icon: "🐎", x: 1240, y: 315, next: [7] },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1", icon: "🏘️", hasRoof: true, x: 1275, y: 405, next: [8] },
            { code: "K10", type: "ANIMAL", subtype: "kun", setId: 10, name: "Kůň 10", icon: "🐎", x: 1285, y: 495, next: [9] },
            { code: "P10", type: "ANIMAL", subtype: "pes", setId: 10, name: "Pes 10", icon: "🐕", x: 1265, y: 585, next: [10] },
            { code: "S10", type: "ANIMAL", subtype: "sokol", setId: 10, name: "Sokol 10", icon: "🦅", x: 1220, y: 670, next: [11] },
            { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 1150, y: 740, next: [12] },
            { code: "K2", type: "ANIMAL", subtype: "kun", setId: 2, name: "Kůň 2", icon: "🐎", x: 1060, y: 785, next: [21] },

            // 1. Vnitřní větev přes Lesní věž (+200 zl.) a Mistry (4–6) k uzlu N2 (uzly 13..20)
            { code: "BON_200", type: "BONUS", bonusGold: 200, name: "Lesní věž (+200 zl.)", icon: "⛲", x: 1075, y: 260, next: [14] },
            { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃", x: 1030, y: 325, next: [15] },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1", icon: "🏙️", x: 995, y: 395, next: [16] },
            { code: "P9", type: "ANIMAL", subtype: "pes", setId: 9, name: "Pes 9", icon: "🐕", x: 975, y: 470, next: [17] },
            { code: "HOSP", type: "HOSPITAL", name: "Lesní lazaret", icon: "🏥", x: 965, y: 545, next: [18] },
            { code: "MB2", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️", x: 975, y: 620, next: [19] },
            { code: "U2_1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹", x: 1000, y: 690, next: [20] },
            { code: "K8", type: "ANIMAL", subtype: "kun", setId: 8, name: "Kůň 8", icon: "🐎", x: 1035, y: 745, next: [21] },

            // Spodní spojnice k odbočce na most Slavností (uzly 21..23)
            { code: "KRCMA", type: "TAVERN", name: "Zájezdní hostinec", icon: "🍺", x: 970, y: 805, next: [22] },
            { code: "OBCHOD2", type: "MERCHANT", name: "Obchodník", icon: "⚖️", x: 880, y: 818, next: [23] },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1 – Odbočka ke Slavnosti", icon: "🃏", isJunction: true, x: 790, y: 820, branchLow: 24, branchHigh: 28 },

            // 2. Spodní bezpečná cesta pod hradem (1–3) k Vesnici 3 (uzly 24..27)
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2", icon: "🏘️", hasRoof: true, x: 700, y: 825, next: [25] },
            { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 610, y: 822, next: [26] },
            { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 520, y: 815, next: [27] },
            { code: "P2", type: "ANIMAL", subtype: "pes", setId: 2, name: "Pes 2", icon: "🐕", x: 430, y: 805, next: [33] },

            // 2. Most Slavností ♡ ♡ ♡ pod Královským hradem (4–6) k Vesnici 3 (uzly 28..32)
            { code: "U1_BR", type: "QUEST", subtype: "U1", name: "Lov u mostu (U1)", icon: "🐗", x: 800, y: 725, next: [29] },
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "turnaj", name: "SLAVNOST: Turnaj ♡ – Východ na hod 1–3", icon: "💖", isJunction: true, x: 735, y: 655, branchLow: 25, branchHigh: 30 },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ples", name: "SLAVNOST: Ples ♡", icon: "💖", x: 665, y: 645, next: [31] },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "zavod", name: "SLAVNOST: Závod ♡", icon: "💖", x: 595, y: 655, next: [32] },
            { code: "BON_400", type: "BONUS", bonusGold: 400, name: "Královská cesta (+400 zl.)", icon: "🏛️", x: 515, y: 720, next: [33] },

            // Levá stoupající cesta k Dračí odbočce (uzly 33..37)
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3", icon: "🏘️", hasRoof: true, x: 350, y: 785, next: [34] },
            { code: "P3", type: "ANIMAL", subtype: "pes", setId: 3, name: "Pes 3", icon: "🐕", x: 265, y: 745, next: [35] },
            { code: "MB1", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️", x: 195, y: 680, next: [36] },
            { code: "S2", type: "ANIMAL", subtype: "sokol", setId: 2, name: "Sokol 2", icon: "🦅", x: 145, y: 600, next: [37] },
            { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 – Odbočka k drakovi", icon: "🏘️", hasRoof: true, isJunction: true, x: 118, y: 510, branchLow: 38, branchHigh: 42 },

            // 3. Levá bezpečná cesta podél útesu (1–3) ke Koni 6 (uzly 38..41)
            { code: "SATL", type: "PRISON", name: "Hradní žalář", icon: "⛓️", x: 110, y: 420, next: [39] },
            { code: "K3", type: "ANIMAL", subtype: "kun", setId: 3, name: "Kůň 3", icon: "🐎", x: 125, y: 330, next: [40] },
            { code: "VD3", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 165, y: 250, next: [41] },
            { code: "U1_3", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 225, y: 185, next: [48] },

            // 3. Dračí stezka (+300 zl.) do sluje Tříhlavé saně (4–6) ke Koni 6 (uzly 42..47)
            { code: "BON_300", type: "BONUS", bonusGold: 300, name: "Dračí stezka (+300 zl.)", icon: "⛩️", x: 200, y: 490, next: [43] },
            { code: "MCH1", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨", x: 265, y: 445, next: [44] },
            { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1", icon: "🏯", x: 305, y: 390, next: [45] },
            { code: "U3_DRAK", type: "QUEST", subtype: "U3", name: "Tříhlavá saň (U3)", icon: "🐲", x: 315, y: 320, next: [46] },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️", x: 295, y: 245, next: [47] },
            { code: "K12", type: "ANIMAL", subtype: "kun", setId: 12, name: "Kůň 12", icon: "🐎", x: 260, y: 180, next: [48] },

            // Návratová cesta podél hradeb zpět ke STARTu (uzly 48..51)
            { code: "K6", type: "ANIMAL", subtype: "kun", setId: 6, name: "Kůň 6", icon: "🐎", x: 320, y: 115, next: [49] },
            { code: "S6", type: "ANIMAL", subtype: "sokol", setId: 6, name: "Sokol 6", icon: "🦅", x: 410, y: 85, next: [50] },
            { code: "V6", type: "VILLAGE", estateId: "V6", name: "Vesnice 6", icon: "🏘️", hasRoof: true, x: 510, y: 72, next: [51] },
            { code: "P7", type: "ANIMAL", subtype: "pes", setId: 7, name: "Pes 7", icon: "🐕", x: 610, y: 68, next: [0] }
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
            ]
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
        var compactNodes = [];
        var outerCount = 34;
        for (var i = 0; i < outerCount; i++) {
            var src = full.nodes[(i * 2) % 68];
            var angle = (i / outerCount) * Math.PI * 2 - Math.PI / 2;
            var rx = 560, ry = 330;
            compactNodes.push({
                id: i,
                code: i === 0 ? "START" : src.code,
                type: i === 0 ? "START" : src.type,
                subtype: src.subtype,
                setId: src.setId,
                estateId: src.estateId,
                jesterId: src.jesterId,
                skill: src.skill,
                name: i === 0 ? "START (+3 000 zl.)" : src.name,
                icon: i === 0 ? "🏰" : src.icon,
                x: Math.round(700 + Math.cos(angle) * rx),
                y: Math.round(430 + Math.sin(angle) * ry),
                next: [(i + 1) % outerCount]
            });
        }

        var bridge = [
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "turnaj", name: "SLAVNOST: Turnaj ♡ – Východ na hod 1–3", icon: "💖", isJunction: true, x: 520, y: 520 },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ples", name: "SLAVNOST: Ples ♡", icon: "💖", x: 640, y: 520 },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "zavod", name: "SLAVNOST: Závod ♡", icon: "💖", x: 760, y: 520 },
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
            ]
        };
    },

    // ========================================================================
    // 4. PROCEDURÁLNĚ GENEROVANÝ PLÁN
    // ========================================================================
    buildProceduralBoard: function () {
        var base = this.buildClassic4599Board();
        var movableIndices = [];
        for (var i = 1; i < 75; i++) {
            if (!base.nodes[i].isJunction) movableIndices.push(i);
        }
        for (var j = movableIndices.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var idxA = movableIndices[j];
            var idxB = movableIndices[k];
            var keys = ["code", "type", "subtype", "setId", "estateId", "jesterId", "skill", "name", "icon"];
            for (var m = 0; m < keys.length; m++) {
                var key = keys[m];
                var tmp = base.nodes[idxA][key];
                base.nodes[idxA][key] = base.nodes[idxB][key];
                base.nodes[idxB][key] = tmp;
            }
        }
        base.code = "procedural";
        base.name = "Procedurálně generované království";
        base.seed = Math.floor(Math.random() * 1000000);
        return base;
    }
};
