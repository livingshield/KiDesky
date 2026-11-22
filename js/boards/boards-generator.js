// ============================================================================
// KiDesky: Princeznino srdce - Kompilátor receptů a procedurální generátor map (KiDeskyMapGenerator)
// ============================================================================

(function () {
    "use strict";
    if (!window.KiDeskyMapGenerator) window.KiDeskyMapGenerator = {};

    Object.assign(window.KiDeskyMapGenerator, {

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
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.webp", x: 1085, y: 625, w: 140, h: 120 }
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
        if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
            window.PRS_BoardBuilder.computeRiverBridges(boardObj);
        }
        if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
            window.PRS_BoardBuilder.generateBoardDecorations(boardObj, seed);
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
            { id: "dragonLair", name: "Dračí sluj (U3)", icon: "🐲", image: "assets/landmarks/dragon.webp", x: 1085, y: 625, w: 140, h: 120 }
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
    });
})();
