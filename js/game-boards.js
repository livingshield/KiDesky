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


// ============================================================================
// DYNAMICKÝ GENERÁTOR MAPY A BIOMŮ (KiDeskyMapGenerator)
// Plnohodnotná procedurální syntéza topologie grafu, cest, biomů a terénu
// ============================================================================

window.KiDeskyMapGenerator = {
    // 5 Přednastavených královských šablon map (Presety Map Studia)
    PRESETS: {
        royal_balance: {
            id: "royal_balance",
            name: "👑 Královská rovnováha",
            desc: "Plnohodnotný trojdílný plán s 3 větvemi, 6 chovnými sadami a vyváženou ekonomií.",
            nodeCount: 78,
            branches: 3,
            masterTier: 2,
            animalSetCount: 6,
            riverMode: "single",
            dangerLevel: "standard",
            biomeTheme: "balanced"
        },
        dragon_chasm: {
            id: "dragon_chasm",
            name: "🐉 Dračí soutěska",
            desc: "Drsné sopečné podhůří, 2 větve s hlubokou dračí slují a dvojitým říčním soutokem.",
            nodeCount: 96,
            branches: 2,
            masterTier: 3,
            animalSetCount: 6,
            riverMode: "dual",
            dangerLevel: "high",
            biomeTheme: "dragon_peaks"
        },
        lightning_sprint: {
            id: "lightning_sprint",
            name: "⚡ Bleskový turnaj",
            desc: "Kompaktní 48-políčkový okruh navržený pro rychlou a dynamickou partii (30–40 min).",
            nodeCount: 48,
            branches: 1,
            masterTier: 1,
            animalSetCount: 4,
            riverMode: "single",
            dangerLevel: "low",
            biomeTheme: "golden_plains"
        },
        four_masters: {
            id: "four_masters",
            name: "🧙‍♂️ Turnaj čtyř mistrů",
            desc: "Velkolepý epický svět (112 uzlů) se 4 větvemi, říčním ostrovem a duely s mistry.",
            nodeCount: 112,
            branches: 4,
            masterTier: 4,
            animalSetCount: 10,
            riverMode: "island",
            dangerLevel: "high",
            biomeTheme: "balanced"
        },
        pasture_kingdom: {
            id: "pasture_kingdom",
            name: "🌲 Ráj chovatelů",
            desc: "Rozlehlé lesní království zasvěcené chovu ušlechtilých zvířat (12 sad) a cechům.",
            nodeCount: 96,
            branches: 3,
            masterTier: 5,
            animalSetCount: 12,
            riverMode: "dual",
            dangerLevel: "standard",
            biomeTheme: "forest_realm"
        }
    },

    // Katalog 14 ušlechtilých chovných sad (Kůň, Sokol, Pes)
    ANIMAL_SETS_CATALOG: [
        { setId: 1, kun: "Kůň 1 (Grošák)", sokol: "Sokol 1 (Poštolka)", pes: "Pes 1 (Ohař)" },
        { setId: 2, kun: "Kůň 2 (Hnědák)", sokol: "Sokol 2 (Krahujec)", pes: "Pes 2 (Bígl)" },
        { setId: 3, kun: "Kůň 3 (Vraník)", sokol: "Sokol 3 (Ostříž)", pes: "Pes 3 (Chrt)" },
        { setId: 4, kun: "Kůň 4 (Ryzák)", sokol: "Sokol 4 (Raroh)", pes: "Pes 4 (Barvář)" },
        { setId: 5, kun: "Kůň 5 (Bělouš)", sokol: "Sokol 5 (Královský ostříž)", pes: "Pes 5 (Slídič)" },
        { setId: 6, kun: "Kůň 6 (Plavák)", sokol: "Sokol 6 (Sokol stěhovavý)", pes: "Pes 6 (Vlkodav)" },
        { setId: 7, kun: "Kůň 7 (Šiml)", sokol: "Sokol 7 (Luňák)", pes: "Pes 7 (Doga)" },
        { setId: 8, kun: "Kůň 8 (Fríský oř)", sokol: "Sokol 8 (Orlovec)", pes: "Pes 8 (Chrtí král)" },
        { setId: 9, kun: "Kůň 9 (Andaluský hřebec)", sokol: "Sokol 9 (Jestřáb)", pes: "Pes 9 (Lovecký chrt)" },
        { setId: 10, kun: "Kůň 10 (Válečný oř)", sokol: "Sokol 10 (Sokol královský)", pes: "Pes 10 (Královský chrt)" },
        { setId: 11, kun: "Kůň 11 (Hvězdný hřebec)", sokol: "Sokol 11 (Bílý raroh)", pes: "Pes 11 (Stříbrný ohař)" },
        { setId: 12, kun: "Kůň 12 (Královský oř)", sokol: "Sokol 12 (Fénixův sokol)", pes: "Pes 12 (Zlatý chrt)" },
        { setId: 13, kun: "Kůň 13 (Zlatý palomino)", sokol: "Sokol 13 (Skalní orel)", pes: "Pes 13 (Severní vlkodav)" },
        { setId: 14, kun: "Kůň 14 (Stínový oř)", sokol: "Sokol 14 (Noční raroh)", pes: "Pes 14 (Hradní chrlič)" }
    ],

    // Převod textového seed kódu např. KID-78-3B-M2-A6-R1-D2-T0-S4598 nebo KID-78-3B-M2-S4598 zpět na parametry
    parseSeedCode: function (code) {
        if (!code || typeof code !== "string") return null;
        var clean = code.trim().toUpperCase();

        // Rozšířený formát: KID-78-3B-M2-A6-R1-D2-T0-S4598
        var mExt = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-A(\d+)-R([0123])-D([123])-T([01234])-S(\d+)$/);
        if (mExt) {
            var rMap = { "0": "none", "1": "single", "2": "dual", "3": "island" };
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
                seed: parseInt(mExt[8], 10),
                valid: true
            };
        }

        // Střední formát: KID-78-3B-M2-A6-S4598
        var mMid = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-A(\d+)-S(\d+)$/);
        if (mMid) {
            return {
                nodeCount: parseInt(mMid[1], 10),
                branches: parseInt(mMid[2], 10),
                masterTier: parseInt(mMid[3], 10),
                animalSetCount: parseInt(mMid[4], 10),
                seed: parseInt(mMid[5], 10),
                valid: true
            };
        }

        // Krátký zpětně kompatibilní formát: KID-78-3B-M2-S4598
        var match = clean.match(/^KID-(\d+)-(\d+)B-M(\d+)-S(\d+)$/);
        if (match) {
            return {
                nodeCount: parseInt(match[1], 10),
                branches: parseInt(match[2], 10),
                masterTier: parseInt(match[3], 10),
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
        var rCode = options.riverMode === "none" ? "0" : (options.riverMode === "dual" ? "2" : (options.riverMode === "island" ? "3" : "1"));
        var dCode = options.dangerLevel === "low" ? "1" : (options.dangerLevel === "high" ? "3" : "2");
        var tMap = { balanced: "0", dragon_peaks: "1", forest_realm: "2", river_delta: "3", golden_plains: "4" };
        var tCode = tMap[options.biomeTheme || "balanced"] || "0";
        var s = Math.abs(Number(seed) || 12345) % 1000000;
        return "KID-" + n + "-" + b + "B-M" + m + "-A" + a + "-R" + rCode + "-D" + dCode + "-T" + tCode + "-S" + s;
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

        // 3. VÝBĚR 2 TEMATICKÝCH HRADŮ ZE SEZNAMU
        var pool = this.THEMATIC_CASTLES.slice();
        for (var cIdx = pool.length - 1; cIdx > 0; cIdx--) {
            var swapIdx = Math.floor(rnd() * (cIdx + 1));
            var temp = pool[cIdx];
            pool[cIdx] = pool[swapIdx];
            pool[swapIdx] = temp;
        }
        var castleH1 = pool[0];
        var castleH2 = pool[1];

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
            { code: "STAJE1", type: "BUILDING", subtype: "staje", name: "Královské stáje", icon: "🏠" },
            { code: "KOV1", type: "BUILDING", subtype: "kovarna", name: "Cechovní kovárna", icon: "⚒️" },
            { code: "SOK1", type: "BUILDING", subtype: "sokolnik", name: "Královský sokolník", icon: "🦅" },
            { code: "PSOV1", type: "BUILDING", subtype: "psovod", name: "Psovod a smečka", icon: "🦴" },
            { code: "KREJ1", type: "BUILDING", subtype: "krejci", name: "Dvorní krejčí", icon: "🧵" },
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
                { code: "H2", type: "CASTLE", estateId: "H2", name: castleH2.name, icon: castleH2.icon },
                { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
                { code: "U3_1", type: "QUEST", subtype: "U3", name: "Dračí sluj I (U3)", icon: "🐉" },
                { code: "U3_2", type: "QUEST", subtype: "U3", name: "Tříhlavý drak II (U3)", icon: "🐲" }
            );
        }
        // Pokud není aktivní Větev 3 (Levá), garantujeme Hrad 1 na hlavním okruhu!
        if (branchCount < 3) {
            corePool.unshift(
                { code: "H1", type: "CASTLE", estateId: "H1", name: castleH1.name, icon: castleH1.icon }
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
            { code: "STAJE2", type: "BUILDING", subtype: "staje", name: "Stáje 2", icon: "🏠" },
            { code: "KOV2", type: "BUILDING", subtype: "kovarna", name: "Kovárna 2", icon: "⚒️" },
            { code: "KE4", type: "JESTER", jesterId: 4, name: "Kejklíř 4", icon: "🃏" },
            { code: "MJ2", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "MCH2", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "OBCHOD4", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "SOK2", type: "BUILDING", subtype: "sokolnik", name: "Sokolník 2", icon: "🦅" },
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
            outerDefs.push({ code: "K" + sId, type: "ANIMAL", subtype: "kun", setId: sId, name: cat.kun, icon: "🐎" });
            // Vložíme 1 ne-zvířecí pole mezi Koně a Sokola
            if (naCursor < selectedNonAnimals.length) {
                outerDefs.push(selectedNonAnimals[naCursor++]);
                chunkNA--;
            }
            // 2. Zvíře sady (Sokol)
            outerDefs.push({ code: "S" + sId, type: "ANIMAL", subtype: "sokol", setId: sId, name: cat.sokol, icon: "🦅" });
            // 3. Zvíře sady (Pes)
            outerDefs.push({ code: "P" + sId, type: "ANIMAL", subtype: "pes", setId: sId, name: cat.pes, icon: "🐕" });

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
                { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "turnaj", name: "SLAVNOST: Královský Turnaj ♡", icon: "💖" },
                { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ples", name: "SLAVNOST: Zámecký Ples ♡", icon: "💖" },
                { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "zavod", name: "SLAVNOST: Velký Závod ♡", icon: "💖" },
                { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 (Slunečná)", icon: "🏘️", hasRoof: true },
                { code: "MT_BR", type: "MASTER", skill: "tanec", name: "Mistr Dvorního Tance", icon: "💃" },
                { code: "KREJ_BR", type: "BUILDING", subtype: "krejci", name: "Slavnostní krejčí", icon: "🧵" },
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
                { code: "H2", type: "CASTLE", estateId: "H2", name: castleH2.name, icon: castleH2.icon },
                { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
                { code: "VM2", type: "MASTER", skill: "any", name: "Velmistr Dračího řádu", icon: "🧙‍♂️" },
                { code: "U2_R1", type: "QUEST", subtype: "U2", name: "Horské monstrum (U2)", icon: "👹" }
            ];
            if (b2Set) {
                b2Template.splice(1, 0,
                    { code: "P" + b2Set.setId, type: "ANIMAL", subtype: "pes", setId: b2Set.setId, name: b2Set.pes, icon: "🐕" },
                    { code: "S" + b2Set.setId, type: "ANIMAL", subtype: "sokol", setId: b2Set.setId, name: b2Set.sokol, icon: "🦅" },
                    { code: "K" + b2Set.setId, type: "ANIMAL", subtype: "kun", setId: b2Set.setId, name: b2Set.kun, icon: "🐎" }
                );
            }
            b2Template.push(
                { code: "KOV_R", type: "BUILDING", subtype: "kovarna", name: "Hradní zbrojíř", icon: "⚒️" },
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
                { code: "H1", type: "CASTLE", estateId: "H1", name: castleH1.name, icon: castleH1.icon },
                { code: "U2_L1", type: "QUEST", subtype: "U2", name: "Lesní monstrum (U2)", icon: "👹" },
                { code: "SOK_L", type: "BUILDING", subtype: "sokolnik", name: "Lesní sokolník", icon: "🦅" },
                { code: "MT_L", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃" }
            ];
            if (b3Set) {
                b3Template.splice(1, 0,
                    { code: "S" + b3Set.setId, type: "ANIMAL", subtype: "sokol", setId: b3Set.setId, name: b3Set.sokol, icon: "🦅" },
                    { code: "K" + b3Set.setId, type: "ANIMAL", subtype: "kun", setId: b3Set.setId, name: b3Set.kun, icon: "🐎" },
                    { code: "P" + b3Set.setId, type: "ANIMAL", subtype: "pes", setId: b3Set.setId, name: b3Set.pes, icon: "🐕" }
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
                    { code: "K" + b4Set.setId, type: "ANIMAL", subtype: "kun", setId: b4Set.setId, name: b4Set.kun, icon: "🐎" },
                    { code: "S" + b4Set.setId, type: "ANIMAL", subtype: "sokol", setId: b4Set.setId, name: b4Set.sokol, icon: "🦅" },
                    { code: "P" + b4Set.setId, type: "ANIMAL", subtype: "pes", setId: b4Set.setId, name: b4Set.pes, icon: "🐕" }
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
            var r1Pts = [
                { x: Math.round(1215 + (rnd() - 0.5) * 45), y: 30 },
                { x: Math.round(1130 + (rnd() - 0.5) * 35), y: 220 },
                { x: Math.round(1010 + (rnd() - 0.5) * 35), y: 410 },
                { x: Math.round(850 + (rnd() - 0.5) * 35), y: 585 },
                { x: Math.round(735 + (rnd() - 0.5) * 35), y: 730 },
                { x: Math.round(695 + (rnd() - 0.5) * 40), y: 855 }
            ];
            var r1Path = "M " + r1Pts[0].x + " " + r1Pts[0].y + " " +
                "C " + r1Pts[1].x + " " + r1Pts[1].y + ", " + r1Pts[2].x + " " + r1Pts[2].y + ", " + r1Pts[3].x + " " + r1Pts[3].y + " " +
                "S " + r1Pts[4].x + " " + r1Pts[4].y + ", " + r1Pts[5].x + " " + r1Pts[5].y;

            rivers.push({
                id: "main_river",
                name: "Královská řeka Doubravka",
                width: 10,
                color: "#0284c7",
                path: r1Path
            });

            var poly1 = this.sampleBezier(r1Pts[0], r1Pts[1], r1Pts[2], r1Pts[3], 18, false)
                .concat(this.sampleBezier(r1Pts[3], r1Pts[4], r1Pts[4], r1Pts[5], 14, true));
            riverPolylines.push(poly1);

            if (riverMode === "dual") {
                // Druhá řeka: Horská bystřina Bystřice vlévající se do Doubravky
                var r2Pts = [
                    { x: Math.round(255 + (rnd() - 0.5) * 45), y: 30 },
                    { x: Math.round(370 + (rnd() - 0.5) * 35), y: 230 },
                    { x: Math.round(520 + (rnd() - 0.5) * 35), y: 440 },
                    { x: r1Pts[3].x, y: r1Pts[3].y }
                ];
                var r2Path = "M " + r2Pts[0].x + " " + r2Pts[0].y + " " +
                    "C " + r2Pts[1].x + " " + r2Pts[1].y + ", " + r2Pts[2].x + " " + r2Pts[2].y + ", " + r2Pts[3].x + " " + r2Pts[3].y;

                rivers.push({
                    id: "tributary_river",
                    name: "Horská bystřina Bystřice",
                    width: 8,
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
                                bridges.push({
                                    x: hit.x,
                                    y: hit.y,
                                    angle: hit.angle,
                                    nodeAId: nA.id,
                                    nodeBId: nB.id
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

        if (riverMode !== "none") {
            biomes.push({
                id: "water_wetlands",
                name: "Meandry řeky a jezerní tůně",
                fillGrad: "waterBiomeGrad",
                fill: wtrFill,
                opacity: 0.72,
                path: "M 1120 100 C 1050 280 920 480 800 640 C 720 760 680 840 760 840 C 860 740 1000 520 1180 280 Z",
                contours: [
                    "M 1100 160 Q 990 350 860 520 Q 770 660 720 780",
                    "M 1150 220 Q 1040 410 910 580"
                ],
                contourStroke: "rgba(56,189,248,0.35)",
                contourDash: "7,5"
            });
        }

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
            { id: "royalCastle", name: "Královský Hrad", icon: "🏰", image: "assets/landmarks/royal_castle.png", x: 700, y: 380, w: 220, h: 180 },
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.png", x: 1085, y: 625, w: 140, h: 120 },
            { id: "castleH1", name: castleH1.name, icon: castleH1.icon, image: castleH1.img, x: 260, y: 220, w: 130, h: 115 },
            { id: "castleH2", name: castleH2.name, icon: castleH2.icon, image: castleH2.img, x: 1140, y: 700, w: 130, h: 115 }
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
    }
};

window.PRS_BoardBuilder = {
    createBoard: function (templateCode, options) {
        options = options || {};
        var seed = options.seed || options.boardSeed || Math.floor(Math.random() * 1000000);
        var board;
        if (templateCode === "dragon_4598" || templateCode === "dragon_4595") {
            board = this.buildDragon4598Board();
        } else if (templateCode === "compact_48") {
            board = this.buildCompactBoard();
        } else if (templateCode === "procedural" || templateCode === "dynamic") {
            board = this.buildProceduralBoard(seed, options);
        } else {
            board = this.buildClassic4599Board();
        }
        // Automatické generické ověření a bezpečné ukotvení dominant bez kolizí
        this.sanitizeAndAnchorLandmarks(board);
        // Automatický výpočet mostů na křížení řeky a cest, pokud ještě nejsou definovány
        if (board.rivers && board.rivers.length > 0 && (!board.bridges || board.bridges.length === 0)) {
            this.computeRiverBridges(board);
        }
        // Generování procedurálních a ukotvených dekorací krajiny s ekosystémovými shluky
        this.generateBoardDecorations(board, seed);
        return board;
    },

    computeRiverBridges: function (board) {
        if (!board || !board.nodes || !board.rivers) return [];
        var nodes = board.nodes;
        var bridges = [];

        // Přibližný polygon pro hlavní řeku
        var riverPoly = [
            { x: 1220, y: 35 }, { x: 1180, y: 120 }, { x: 1140, y: 220 },
            { x: 1090, y: 310 }, { x: 1040, y: 400 }, { x: 950, y: 490 },
            { x: 860, y: 580 }, { x: 790, y: 660 }, { x: 740, y: 730 },
            { x: 705, y: 855 }
        ];

        for (var n = 0; n < nodes.length; n++) {
            var nA = nodes[n];
            var tgts = nA.next || [];
            for (var t = 0; t < tgts.length; t++) {
                var nB = nodes[tgts[t]];
                if (!nB) continue;
                for (var r = 0; r < riverPoly.length - 1; r++) {
                    var hit = window.KiDeskyMapGenerator.lineIntersection(nA, nB, riverPoly[r], riverPoly[r + 1]);
                    if (hit) {
                        bridges.push({
                            x: hit.x,
                            y: hit.y,
                            angle: hit.angle,
                            nodeAId: nA.id,
                            nodeBId: nB.id
                        });
                        break;
                    }
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

        function isPositionClear(x, y, radius, allowClusterOverlap) {
            if (x - radius < 35 || x + radius > 1365 || y - radius < 35 || y + radius > 825) return false;

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
            "watermill", "wooden_watchtower", "ancient_ruins", "druid_monoliths",
            "fairy_ring_mushrooms", "swamp_bridge", "unicorn_grove", "pegasus_pond",
            "dryad_sacred_oak"
        ];

        for (var gx = 75; gx <= 1325; gx += 60) {
            for (var gy = 75; gy <= 785; gy += 60) {
                var jx = Math.round(gx + (rnd() - 0.5) * 40);
                var jy = Math.round(gy + (rnd() - 0.5) * 40);

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
            { code: "MJ2", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "SOK1", type: "BUILDING", subtype: "sokolnik", name: "Sokolník 1", icon: "🦅" },
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

        // Sekce 3: Dolní rovinka zprava doleva od Kovárny 2 přes odbočku na most SLAVNOSTÍ až k S7 (indexy 32..51, 20 polí)
        var bottomDefs = [
            { code: "KOV2", type: "BUILDING", subtype: "kovarna", name: "Kovárna 2", icon: "⚒️" },
            { code: "K5", type: "ANIMAL", subtype: "kun", setId: 5, name: "Kůň 5 (Bělouš)", icon: "🐎" },
            { code: "S5", type: "ANIMAL", subtype: "sokol", setId: 5, name: "Sokol 5 (Královský ostříž)", icon: "🦅" },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️" },
            { code: "P5", type: "ANIMAL", subtype: "pes", setId: 5, name: "Pes 5 (Slídič)", icon: "🐕" },
            { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "S6", type: "ANIMAL", subtype: "sokol", setId: 6, name: "Sokol 6 – Odbočka ke Slavnosti", icon: "🦅", isJunction: true },
            { code: "U1_3", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗" },
            { code: "K6", type: "ANIMAL", subtype: "kun", setId: 6, name: "Kůň 6 (Plavák)", icon: "🐎" },
            { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "KE3", type: "JESTER", jesterId: 3, name: "Kejklíř 3", icon: "🃏" },
            { code: "SATL", type: "PRISON", name: "Královská šatlava", icon: "⛓️" },
            { code: "OBCHOD3", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "STAJE2", type: "BUILDING", subtype: "staje", name: "Stáje 2", icon: "🏠" },
            { code: "P6", type: "ANIMAL", subtype: "pes", setId: 6, name: "Pes 6 (Vlkodav)", icon: "🐕" },
            { code: "MB1", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️" },
            { code: "V5", type: "VILLAGE", estateId: "V5", name: "Vesnice 5 (Skalice)", icon: "🏘️", hasRoof: true },
            { code: "M2", type: "TOWN", estateId: "M2", name: "Město 2 (Stříbratec)", icon: "🏙️" },
            { code: "K7", type: "ANIMAL", subtype: "kun", setId: 7, name: "Kůň 7 (Šiml)", icon: "🐎" },
            { code: "S7", type: "ANIMAL", subtype: "sokol", setId: 7, name: "Sokol 7 (Luňák)", icon: "🦅" }
        ];
        var bottomPts = this.sampleBezier([1110, 795], [820, 804], [520, 804], [255, 795], bottomDefs.length, true);

        // Sekce 4: Levý oblouk zdola od Psovodu 2 nahoru přes V8, K9, M3, V1, Obchod 5 a P10 zpět do STARTu (indexy 52..75, 24 polí)
        var leftDefs = [
            { code: "PSOV2", type: "BUILDING", subtype: "psovod", name: "Psovod 2", icon: "🦴" },
            { code: "N7", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P7", type: "ANIMAL", subtype: "pes", setId: 7, name: "Pes 7 (Doga)", icon: "🐕" },
            { code: "V6", type: "VILLAGE", estateId: "V6", name: "Vesnice 6 (Meziříčí)", icon: "🏘️" },
            { code: "N8", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "S8", type: "ANIMAL", subtype: "sokol", setId: 8, name: "Sokol 8 (Orlovec)", icon: "🦅" },
            { code: "KE4", type: "JESTER", jesterId: 4, name: "Kejklíř 4", icon: "🃏" },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️" },
            { code: "K8", type: "ANIMAL", subtype: "kun", setId: 8, name: "Kůň 8 (Fríský oř)", icon: "🐎" },
            { code: "N9", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "P8", type: "ANIMAL", subtype: "pes", setId: 8, name: "Pes 8 (Chrtí král)", icon: "🐕" },
            { code: "S9", type: "ANIMAL", subtype: "sokol", setId: 9, name: "Sokol 9 (Jestřáb)", icon: "🦅" },
            { code: "OBCHOD4", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "P9", type: "ANIMAL", subtype: "pes", setId: 9, name: "Pes 9 (Lovecký chrt)", icon: "🐕" },
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
        var rightBranchDefs = [
            { code: "P11", type: "ANIMAL", subtype: "pes", setId: 11, name: "Pes 11 (Stříbrný ohař)", icon: "🐕" },
            { code: "MJ1", type: "MASTER", skill: "jizda", name: "Mistr Jízdy", icon: "🏇" },
            { code: "MCH2", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨" },
            { code: "S11", type: "ANIMAL", subtype: "sokol", setId: 11, name: "Sokol 11 (Bílý raroh)", icon: "🦅" },
            { code: "KOV_R", type: "BUILDING", subtype: "kovarna", name: "Hradní zbrojíř", icon: "⚒️" },
            { code: "U2_R1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "M4", type: "TOWN", estateId: "M4", name: "Město 4 (Mečov)", icon: "🏙️" },
            { code: "K11", type: "ANIMAL", subtype: "kun", setId: 11, name: "Kůň 11 (Hvězdný hřebec)", icon: "🐎" },
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
        var bridgeDefs = [
            { code: "SLAV_BRANA", type: "CHANCE", name: "Slavnostní brána", icon: "🎪" },
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
            { code: "S12", type: "ANIMAL", subtype: "sokol", setId: 12, name: "Sokol 12 (Fénixův sokol)", icon: "🦅" },
            { code: "SOK2", type: "BUILDING", subtype: "sokolnik", name: "Sokolník 2", icon: "🦅" },
            { code: "U2_L1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹" },
            { code: "K12", type: "ANIMAL", subtype: "kun", setId: 12, name: "Kůň 12 (Královský oř)", icon: "🐎" },
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
            },
            {
                id: "water_wetlands",
                name: "Meandry řeky Doubravky",
                fillGrad: "waterBiomeGrad",
                fill: "rgba(14, 116, 144, 0.48)",
                opacity: 0.72,
                path: "M 1120 100 C 1050 280 920 480 800 640 C 720 760 680 840 760 840 C 860 740 1000 520 1180 280 Z",
                contours: [
                    "M 1100 160 Q 990 350 860 520 Q 770 660 720 780",
                    "M 1150 220 Q 1040 410 910 580"
                ],
                contourStroke: "rgba(56,189,248,0.35)",
                contourDash: "7,5"
            }
        ];

        var rivers = [
            {
                id: "river_classic",
                name: "Královská řeka Doubravka",
                width: 12,
                color: "#0284c7",
                path: "M 1220 35 C 1140 220, 1040 400, 860 580 S 740 730, 705 855"
            }
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
            { code: "S1", type: "ANIMAL", subtype: "sokol", setId: 1, name: "Sokol 1 (Poštolka)", icon: "🦅", x: 910, y: 105, next: [3] },
            { code: "P1", type: "ANIMAL", subtype: "pes", setId: 1, name: "Pes 1 (Ohař)", icon: "🐕", x: 1005, y: 140, next: [4] },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓", x: 1090, y: 185, next: [5] },
            { code: "VD1", type: "TAX", name: "Výběrčí daní – Odbočka k věži", icon: "👑", isJunction: true, x: 1160, y: 240, branchLow: 6, branchHigh: 13 },

            // 1. Vnější okruh vpravo dolů (1–3) k uzlu N2 (uzly 6..12)
            { code: "K1", type: "ANIMAL", subtype: "kun", setId: 1, name: "Kůň 1 (Grošák)", icon: "🐎", x: 1240, y: 315, next: [7] },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true, x: 1275, y: 405, next: [8] },
            { code: "K2", type: "ANIMAL", subtype: "kun", setId: 2, name: "Kůň 2 (Hnědák)", icon: "🐎", x: 1285, y: 495, next: [9] },
            { code: "S2", type: "ANIMAL", subtype: "sokol", setId: 2, name: "Sokol 2 (Krahujec)", icon: "🦅", x: 1265, y: 585, next: [10] },
            { code: "P2", type: "ANIMAL", subtype: "pes", setId: 2, name: "Pes 2 (Bígl)", icon: "🐕", x: 1220, y: 670, next: [11] },
            { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 1150, y: 740, next: [12] },
            { code: "STAJE1", type: "BUILDING", subtype: "staje", name: "Stáje 1", icon: "🏠", x: 1060, y: 785, next: [21] },

            // 1. Vnitřní větev přes Lesní věž (+200 zl.) a Mistry (4–6) k uzlu N2 (uzly 13..20)
            { code: "BON_200", type: "BONUS", bonusGold: 200, name: "Lesní věž (+200 zl.)", icon: "⛲", x: 1075, y: 260, next: [14] },
            { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃", x: 1030, y: 325, next: [15] },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️", x: 995, y: 395, next: [16] },
            { code: "KREJ1", type: "BUILDING", subtype: "krejci", name: "Krejčí 1", icon: "🧵", x: 975, y: 470, next: [17] },
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
            { code: "K3", type: "ANIMAL", subtype: "kun", setId: 3, name: "Kůň 3 (Vraník)", icon: "🐎", x: 430, y: 805, next: [33] },

            // 2. Most Slavností ♡ ♡ ♡ pod Královským hradem (4–6) k Vesnici 3 (uzly 28..32)
            { code: "K4", type: "ANIMAL", subtype: "kun", setId: 4, name: "Kůň 4 (Ryzák)", icon: "🐎", x: 800, y: 725, next: [29] },
            { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "turnaj", name: "SLAVNOST: Turnaj ♡ – Východ na hod 1–3", icon: "💖", isJunction: true, x: 735, y: 655, branchLow: 25, branchHigh: 30 },
            { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ples", name: "SLAVNOST: Ples ♡", icon: "💖", x: 665, y: 645, next: [31] },
            { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "zavod", name: "SLAVNOST: Závod ♡", icon: "💖", x: 595, y: 655, next: [32] },
            { code: "S4", type: "ANIMAL", subtype: "sokol", setId: 4, name: "Sokol 4 (Raroh)", icon: "🦅", x: 515, y: 720, next: [33] },

            // Levá stoupající cesta k Dračí odbočce (uzly 33..37)
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true, x: 350, y: 785, next: [34] },
            { code: "P3", type: "ANIMAL", subtype: "pes", setId: 3, name: "Pes 3 (Chrt)", icon: "🐕", x: 265, y: 745, next: [35] },
            { code: "P4", type: "ANIMAL", subtype: "pes", setId: 4, name: "Pes 4 (Barvář)", icon: "🐕", x: 195, y: 680, next: [36] },
            { code: "S3", type: "ANIMAL", subtype: "sokol", setId: 3, name: "Sokol 3 (Ostříž)", icon: "🦅", x: 145, y: 600, next: [37] },
            { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 – Odbočka k drakovi", icon: "🏘️", hasRoof: true, isJunction: true, x: 118, y: 510, branchLow: 38, branchHigh: 42 },

            // 3. Levá bezpečná cesta podél útesu (1–3) ke Koni 6 (uzly 38..41)
            { code: "SATL", type: "PRISON", name: "Hradní žalář", icon: "⛓️", x: 110, y: 420, next: [39] },
            { code: "K5", type: "ANIMAL", subtype: "kun", setId: 5, name: "Kůň 5 (Bělouš)", icon: "🐎", x: 125, y: 330, next: [40] },
            { code: "VD3", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 165, y: 250, next: [41] },
            { code: "S5", type: "ANIMAL", subtype: "sokol", setId: 5, name: "Sokol 5 (Královský ostříž)", icon: "🦅", x: 225, y: 185, next: [48] },

            // 3. Dračí stezka (+300 zl.) do sluje Tříhlavé saně (4–6) ke Koni 6 (uzly 42..47)
            { code: "BON_300", type: "BONUS", bonusGold: 300, name: "Dračí stezka (+300 zl.)", icon: "⛩️", x: 200, y: 490, next: [43] },
            { code: "P5", type: "ANIMAL", subtype: "pes", setId: 5, name: "Pes 5 (Slídič)", icon: "🐕", x: 265, y: 445, next: [44] },
            { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1 (Dračí Hrad)", icon: "🏯", x: 305, y: 390, next: [45] },
            { code: "U3_DRAK", type: "QUEST", subtype: "U3", name: "Tříhlavá saň (U3)", icon: "🐲", x: 315, y: 320, next: [46] },
            { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️", x: 295, y: 245, next: [47] },
            { code: "K6", type: "ANIMAL", subtype: "kun", setId: 6, name: "Kůň 6 (Plavák)", icon: "🐎", x: 260, y: 180, next: [48] },

            // Návratová cesta podél hradeb zpět ke STARTu (uzly 48..51)
            { code: "S6", type: "ANIMAL", subtype: "sokol", setId: 6, name: "Sokol 6 (Jestřábník)", icon: "🦅", x: 320, y: 115, next: [49] },
            { code: "P6", type: "ANIMAL", subtype: "pes", setId: 6, name: "Pes 6 (Vlkodav)", icon: "🐕", x: 410, y: 85, next: [50] },
            { code: "V4", type: "VILLAGE", estateId: "V4", name: "Vesnice 4 (Dubina)", icon: "🏘️", hasRoof: true, x: 510, y: 72, next: [51] },
            { code: "KOV1", type: "BUILDING", subtype: "kovarna", name: "Kovárna 1", icon: "⚒️", x: 610, y: 68, next: [0] }
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
            { code: "K1", type: "ANIMAL", subtype: "kun", setId: 1, name: "Kůň 1 (Grošák)", icon: "🐎" },
            { code: "S1", type: "ANIMAL", subtype: "sokol", setId: 1, name: "Sokol 1 (Poštolka)", icon: "🦅" },
            { code: "P1", type: "ANIMAL", subtype: "pes", setId: 1, name: "Pes 1 (Ohař)", icon: "🐕" },
            { code: "STAJE1", type: "BUILDING", subtype: "staje", name: "Stáje 1", icon: "🏠" },
            { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1 (Králova Lhota)", icon: "🏘️", hasRoof: true },
            { code: "OBCHOD1", type: "MERCHANT", name: "Obchodník", icon: "⚖️" },
            { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "VD1", type: "TAX", name: "Výběrčí daní", icon: "👑" },
            { code: "K2", type: "ANIMAL", subtype: "kun", setId: 2, name: "Kůň 2 (Hnědák)", icon: "🐎" },
            { code: "S2", type: "ANIMAL", subtype: "sokol", setId: 2, name: "Sokol 2 (Krahujec)", icon: "🦅" },
            { code: "P2", type: "ANIMAL", subtype: "pes", setId: 2, name: "Pes 2 (Bígl)", icon: "🐕" },
            { code: "PSOV1", type: "BUILDING", subtype: "psovod", name: "Psovod 1", icon: "🦴" },
            { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2 (Lhotka)", icon: "🏘️", hasRoof: true },
            { code: "HOSP", type: "HOSPITAL", name: "Královský lazaret", icon: "🏥" },
            { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1", icon: "🃏" },
            { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1 (Královo Pole)", icon: "🏙️" },
            { code: "K3", type: "ANIMAL", subtype: "kun", setId: 3, name: "Kůň 3 (Vraník)", icon: "🐎" },
            { code: "S3", type: "ANIMAL", subtype: "sokol", setId: 3, name: "Sokol 3 (Ostříž)", icon: "🦅" },
            { code: "P3", type: "ANIMAL", subtype: "pes", setId: 3, name: "Pes 3 (Chrt)", icon: "🐕" },
            { code: "SOK1", type: "BUILDING", subtype: "sokolnik", name: "Sokolník 1", icon: "🦅" },
            { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3 (Březová)", icon: "🏘️", hasRoof: true },
            { code: "N2", type: "CHANCE", name: "Náhoda", icon: "❓" },
            { code: "KOV1", type: "BUILDING", subtype: "kovarna", name: "Kovárna 1", icon: "⚒️" },
            { code: "SATL", type: "PRISON", name: "Královská šatlava", icon: "⛓️" },
            { code: "K4", type: "ANIMAL", subtype: "kun", setId: 4, name: "Kůň 4 (Ryzák) – Odbočka", icon: "🐎", isJunction: true },
            { code: "S4", type: "ANIMAL", subtype: "sokol", setId: 4, name: "Sokol 4 (Raroh)", icon: "🦅" },
            { code: "P4", type: "ANIMAL", subtype: "pes", setId: 4, name: "Pes 4 (Barvář)", icon: "🐕" },
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
