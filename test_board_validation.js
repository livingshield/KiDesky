const testBoard = () => {
    const rawNodes = [
        { code: "START", type: "START", name: "START (+3 000 zl.)", icon: "🏰", x: 700, y: 68, next: [1] },
        { code: "OBCHOD1", type: "MERCHANT", name: "Obchodník", icon: "⚖️", x: 810, y: 80, next: [2] },
        { code: "S1", type: "ANIMAL", subtype: "sokol", setId: 1, name: "Sokol 1", icon: "🦅", x: 910, y: 105, next: [3] },
        { code: "P1", type: "ANIMAL", subtype: "pes", setId: 1, name: "Pes 1", icon: "🐕", x: 1005, y: 140, next: [4] },
        { code: "N1", type: "CHANCE", name: "Náhoda", icon: "❓", x: 1090, y: 185, next: [5] },
        { code: "VD1", type: "TAX", name: "Výběrčí daní – Odbočka k věži", icon: "👑", isJunction: true, x: 1160, y: 240, branchLow: 6, branchHigh: 13 },
        { code: "K1", type: "ANIMAL", subtype: "kun", setId: 1, name: "Kůň 1", icon: "🐎", x: 1240, y: 315, next: [7] },
        { code: "V1", type: "VILLAGE", estateId: "V1", name: "Vesnice 1", icon: "🏘️", hasRoof: true, x: 1275, y: 405, next: [8] },
        { code: "K10", type: "ANIMAL", subtype: "kun", setId: 10, name: "Kůň 10", icon: "🐎", x: 1285, y: 495, next: [9] },
        { code: "P10", type: "ANIMAL", subtype: "pes", setId: 10, name: "Pes 10", icon: "🐕", x: 1265, y: 585, next: [10] },
        { code: "S10", type: "ANIMAL", subtype: "sokol", setId: 10, name: "Sokol 10", icon: "🦅", x: 1220, y: 670, next: [11] },
        { code: "U1_1", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 1150, y: 740, next: [12] },
        { code: "K2", type: "ANIMAL", subtype: "kun", setId: 2, name: "Kůň 2", icon: "🐎", x: 1060, y: 785, next: [21] },
        { code: "BON_200", type: "BONUS", bonusGold: 200, name: "Lesní věž (+200 zl.)", icon: "⛲", x: 1075, y: 260, next: [14] },
        { code: "MT1", type: "MASTER", skill: "tanec", name: "Mistr Tance", icon: "💃", x: 1030, y: 325, next: [15] },
        { code: "M1", type: "TOWN", estateId: "M1", name: "Město 1", icon: "🏙️", x: 995, y: 395, next: [16] },
        { code: "P9", type: "ANIMAL", subtype: "pes", setId: 9, name: "Pes 9", icon: "🐕", x: 975, y: 470, next: [17] },
        { code: "N_DIAG", type: "CHANCE", name: "Náhoda v lese", icon: "❓", x: 965, y: 545, next: [18] },
        { code: "MB2", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️", x: 975, y: 620, next: [19] },
        { code: "U2_1", type: "QUEST", subtype: "U2", name: "Souboj s monstrem (U2)", icon: "👹", x: 1000, y: 690, next: [20] },
        { code: "K8", type: "ANIMAL", subtype: "kun", setId: 8, name: "Kůň 8", icon: "🐎", x: 1035, y: 745, next: [21] },
        { code: "N2", type: "CHANCE", name: "Náhoda", icon: "❓", x: 970, y: 805, next: [22] },
        { code: "OBCHOD2", type: "MERCHANT", name: "Obchodník", icon: "⚖️", x: 880, y: 818, next: [23] },
        { code: "KE1", type: "JESTER", jesterId: 1, name: "Kejklíř 1 – Odbočka ke Slavnosti", icon: "🃏", isJunction: true, x: 790, y: 820, branchLow: 24, branchHigh: 28 },
        { code: "V2", type: "VILLAGE", estateId: "V2", name: "Vesnice 2", icon: "🏘️", hasRoof: true, x: 700, y: 825, next: [25] },
        { code: "VD2", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 610, y: 822, next: [26] },
        { code: "U1_2", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 520, y: 815, next: [27] },
        { code: "P2", type: "ANIMAL", subtype: "pes", setId: 2, name: "Pes 2", icon: "🐕", x: 430, y: 805, next: [33] },
        { code: "U1_BR", type: "QUEST", subtype: "U1", name: "Lov u mostu (U1)", icon: "🐗", x: 800, y: 725, next: [29] },
        { code: "SLAV_TURNAJ", type: "FESTIVAL", subtype: "turnaj", name: "SLAVNOST: Turnaj ♡", icon: "💖", x: 735, y: 655, next: [30] },
        { code: "SLAV_PLES", type: "FESTIVAL", subtype: "ples", name: "SLAVNOST: Ples ♡", icon: "💖", x: 665, y: 645, next: [31] },
        { code: "SLAV_ZAVOD", type: "FESTIVAL", subtype: "zavod", name: "SLAVNOST: Závod ♡", icon: "💖", x: 595, y: 655, next: [32] },
        { code: "BON_400", type: "BONUS", bonusGold: 400, name: "Královská cesta (+400 zl.)", icon: "🏛️", x: 515, y: 720, next: [33] },
        { code: "V3", type: "VILLAGE", estateId: "V3", name: "Vesnice 3", icon: "🏘️", hasRoof: true, x: 350, y: 785, next: [34] },
        { code: "P3", type: "ANIMAL", subtype: "pes", setId: 3, name: "Pes 3", icon: "🐕", x: 265, y: 745, next: [35] },
        { code: "MB1", type: "MASTER", skill: "boj", name: "Mistr Boje", icon: "⚔️", x: 195, y: 680, next: [36] },
        { code: "S2", type: "ANIMAL", subtype: "sokol", setId: 2, name: "Sokol 2", icon: "🦅", x: 145, y: 600, next: [37] },
        { code: "V7", type: "VILLAGE", estateId: "V7", name: "Vesnice 7 – Odbočka k drakovi", icon: "🏘️", hasRoof: true, isJunction: true, x: 118, y: 510, branchLow: 38, branchHigh: 42 },
        { code: "N3", type: "CHANCE", name: "Náhoda", icon: "❓", x: 110, y: 420, next: [39] },
        { code: "K3", type: "ANIMAL", subtype: "kun", setId: 3, name: "Kůň 3", icon: "🐎", x: 125, y: 330, next: [40] },
        { code: "VD3", type: "TAX", name: "Výběrčí daní", icon: "👑", x: 165, y: 250, next: [41] },
        { code: "U1_3", type: "QUEST", subtype: "U1", name: "Lov zvěře (U1)", icon: "🐗", x: 225, y: 185, next: [48] },
        { code: "BON_300", type: "BONUS", bonusGold: 300, name: "Dračí stezka (+300 zl.)", icon: "⛩️", x: 200, y: 490, next: [43] },
        { code: "MCH1", type: "MASTER", skill: "charisma", name: "Mistr Charismatu", icon: "✨", x: 265, y: 445, next: [44] },
        { code: "H1", type: "CASTLE", estateId: "H1", name: "Hrad 1", icon: "🏯", x: 305, y: 390, next: [45] },
        { code: "U3_DRAK", type: "QUEST", subtype: "U3", name: "Tříhlavá saň (U3)", icon: "🐲", x: 315, y: 320, next: [46] },
        { code: "VM1", type: "MASTER", skill: "any", name: "Velmistr", icon: "🧙‍♂️", x: 295, y: 245, next: [47] },
        { code: "K12", type: "ANIMAL", subtype: "kun", setId: 12, name: "Kůň 12", icon: "🐎", x: 260, y: 180, next: [48] },
        { code: "K6", type: "ANIMAL", subtype: "kun", setId: 6, name: "Kůň 6", icon: "🐎", x: 320, y: 115, next: [49] },
        { code: "S6", type: "ANIMAL", subtype: "sokol", setId: 6, name: "Sokol 6", icon: "🦅", x: 410, y: 85, next: [50] },
        { code: "V6", type: "VILLAGE", estateId: "V6", name: "Vesnice 6", icon: "🏘️", hasRoof: true, x: 510, y: 72, next: [51] },
        { code: "P7", type: "ANIMAL", subtype: "pes", setId: 7, name: "Pes 7", icon: "🐕", x: 610, y: 68, next: [0] }
    ];

    const nodes = rawNodes.map((n, i) => ({
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
    }));

    console.log("Validated total nodes:", nodes.length);
    nodes.forEach(n => {
        if (n.branchLow !== null) {
            console.log(`Branch ${n.id} (${n.code}): Low->${n.branchLow} (${nodes[n.branchLow].code}), High->${n.branchHigh} (${nodes[n.branchHigh].code})`);
        }
        n.next.forEach(nxt => {
            if (!nodes[nxt]) console.error(`Broken next from ${n.id} to ${nxt}`);
        });
    });
};

testBoard();
