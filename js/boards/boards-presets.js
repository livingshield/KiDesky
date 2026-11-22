// ============================================================================
// KiDesky: Princeznino srdce - Vestavěné herní plány a procedurální wrapper (PRS_BoardBuilder)
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_BoardBuilder) window.PRS_BoardBuilder = {};

    Object.assign(window.PRS_BoardBuilder, {

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
            { id: "royalCastle", name: royalDef.name || "Královský Hrad", icon: royalDef.icon || "👑", image: royalDef.img || "assets/castles/castle_royal.webp", x: 700, y: 390, w: 220, h: 180 },
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.webp", x: 1085, y: 625, w: 140, h: 120 }
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
                { id: "royalCastle", name: "Trojvěžový Královský Hrad", icon: "🏰", image: "assets/landmarks/royal_castle.webp", x: 675, y: 405, w: 230, h: 190 },
                { id: "dragonLair", name: "Tříhlavá Saň (U3)", icon: "🐲", image: "assets/dragons/dragon_3headed.webp", x: 425, y: 330, w: 145, h: 125 },
                { id: "forestTower", name: "Lesní Bašta (+200 zl.)", icon: "🌲", image: "assets/castles/castle_forest.webp", x: 1140, y: 95, w: 130, h: 115 }
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
                { id: "royalCastle", name: "Královský Hrad", icon: "🏰", image: "assets/landmarks/royal_castle.webp", x: 700, y: 320, w: 240, h: 200 },
                { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.webp", x: 990, y: 430, w: 150, h: 130 }
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
    });
})();
