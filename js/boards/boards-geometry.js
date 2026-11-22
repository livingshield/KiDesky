// ============================================================================
// KiDesky: Princeznino srdce - Geometrie map, křivky řek, předvolby a hrady (KiDeskyMapGenerator)
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
        { id: "castle_royal", name: "Královský hrad (Sídlo koruny)", nameEn: "Royal Castle (Seat of Crown)", icon: "👑", img: "assets/castles/castle_royal.webp", biome: "golden_plains", element: "light" },
        { id: "castle_forest", name: "Lesní hrad Doubrava", nameEn: "Forest Castle Doubrava", icon: "🌲", img: "assets/castles/castle_forest.webp", biome: "forest_realm", element: "earth" },
        { id: "castle_ice", name: "Ledový palác Věčného mrazu", nameEn: "Ice Palace of Eternal Frost", icon: "❄️", img: "assets/castles/castle_ice.webp", biome: "mountain", element: "water" },
        { id: "castle_lava", name: "Sopečná pevnost Lávový chřtán", nameEn: "Volcanic Stronghold Lava Maw", icon: "🌋", img: "assets/castles/castle_lava.webp", biome: "dragon_peaks", element: "fire" },
        { id: "castle_crystal", name: "Křišťálový zámek Ametyst", nameEn: "Crystal Castle Amethyst", icon: "💎", img: "assets/castles/castle_crystal.webp", biome: "magic", element: "light" },
        { id: "castle_wind", name: "Větrný vzdušný zámek Boreas", nameEn: "Wind Citadel Boreas", icon: "☁️", img: "assets/castles/castle_wind.webp", biome: "golden_plains", element: "air" },
        { id: "castle_water", name: "Vodní citadela Oceán", nameEn: "Water Citadel Ocean", icon: "🌊", img: "assets/castles/castle_water.webp", biome: "river_delta", element: "water" },
        { id: "castle_desert", name: "Pouštní pískovcový palác", nameEn: "Desert Sandstone Palace", icon: "🏜️", img: "assets/castles/castle_desert.webp", biome: "golden_plains", element: "earth" },
        { id: "castle_swamp", name: "Bažinná tvrz Černá tůň", nameEn: "Swamp Fortress Black Mere", icon: "🌫️", img: "assets/castles/castle_swamp.webp", biome: "swamp", element: "earth" },
        { id: "castle_dark", name: "Temný hrad Erebus", nameEn: "Dark Nether Keep Erebus", icon: "🌑", img: "assets/castles/castle_dark.webp", biome: "magic", element: "fire" }
    ],


    // Seznam 9 tematických hradů z katalogu pro procedurální přiřazení
    THEMATIC_CASTLES: [
        { id: "castle_forest", name: "Lesní hrad Doubrava", nameEn: "Forest Castle Doubrava", icon: "🌲", img: "assets/castles/castle_forest.webp", biome: "forest" },
        { id: "castle_ice", name: "Ledový palác Věčného mrazu", nameEn: "Ice Palace of Eternal Frost", icon: "❄️", img: "assets/castles/castle_ice.webp", biome: "mountain" },
        { id: "castle_lava", name: "Sopečná pevnost Lávový chřtán", nameEn: "Volcanic Stronghold Lava Maw", icon: "🌋", img: "assets/castles/castle_lava.webp", biome: "mountain" },
        { id: "castle_crystal", name: "Křišťálový zámek Ametyst", nameEn: "Crystal Castle Amethyst", icon: "💎", img: "assets/castles/castle_crystal.webp", biome: "magic" },
        { id: "castle_wind", name: "Větrný vzdušný zámek Boreas", nameEn: "Wind Citadel Boreas", icon: "☁️", img: "assets/castles/castle_wind.webp", biome: "plains" },
        { id: "castle_water", name: "Vodní citadela Oceán", nameEn: "Water Citadel Ocean", icon: "🌊", img: "assets/castles/castle_water.webp", biome: "water" },
        { id: "castle_desert", name: "Pouštní pískovcový palác", nameEn: "Desert Sandstone Palace", icon: "🏜️", img: "assets/castles/castle_desert.webp", biome: "plains" },
        { id: "castle_swamp", name: "Bažinná tvrz Černá tůň", nameEn: "Swamp Fortress Black Mere", icon: "🌫️", img: "assets/castles/castle_swamp.webp", biome: "swamp" },
        { id: "castle_dark", name: "Temný hrad Erebus", nameEn: "Dark Nether Keep Erebus", icon: "🌑", img: "assets/castles/castle_dark.webp", biome: "magic" }
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
    }
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
    if (window.KiDeskyMapGenerator) {
        wrapCastleList(window.KiDeskyMapGenerator.ALL_CASTLES);
        wrapCastleList(window.KiDeskyMapGenerator.THEMATIC_CASTLES);
    }
    if (window.PRS_GameBoardBuilder) {
        wrapCastleList(window.PRS_GameBoardBuilder.ALL_CASTLES);
        wrapCastleList(window.PRS_GameBoardBuilder.THEMATIC_CASTLES);
    }
})();
