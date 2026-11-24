// ============================================================================
// KiDesky: Princeznino srdce - Stavitel herních plánů, mosty a krajinné dekorace (PRS_BoardBuilder)
// ============================================================================

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
        return { name: "Královský Hrad", icon: "👑", img: "assets/castles/castle_royal.webp" };
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
                } catch (e) { console.warn("[Boards] Invalid dbTpl.graphJson:", e); }
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
        if (!board.decorations || board.decorations.length === 0 || board.decorationsVersion !== 5) {
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
    UNIQUE_POI_IDS: [
        "unicorn_grove", "pegasus_pond", "dryad_sacred_oak", "forest_ent",
        "crystal_golem", "phoenix_nest", "lake_nymphs", "vodnik_pond",
        "druid_monoliths", "fairy_ring_mushrooms", "witch_hut",
        "ancient_ruins", "ancient_tower_ruin", "ancient_graveyard",
        "dragon_cave", "cave_bear_den", "bandit_cave", "basilisk_cave",
        "snow_troll_cave", "swamp_troll", "swamp_hydra", "griffin_nest",
        "fire_salamander", "swamp_bridge"
    ],

    sampleRoadCorridor: function (nodes) {
        var pts = [];
        if (!nodes || !nodes.length) return pts;
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n) continue;
            var targets = [];
            if (n.branchLow !== null && n.branchLow !== undefined && n.branchHigh !== null && n.branchHigh !== undefined) {
                targets.push({ id: n.branchLow, isBranch: true });
                targets.push({ id: n.branchHigh, isBranch: true });
            } else if (n.next && n.next.length > 0) {
                targets.push({ id: n.next[0], isBranch: false });
            }
            for (var t = 0; t < targets.length; t++) {
                var tn = nodes[targets[t].id];
                if (!tn) continue;
                var dx = tn.x - n.x;
                var dy = tn.y - n.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) continue;
                var mx = (n.x + tn.x) / 2;
                var my = (n.y + tn.y) / 2;
                var perpX = -dy / dist;
                var perpY = dx / dist;
                var dotCenter = perpX * (700 - mx) + perpY * (430 - my);
                var curveSign = (dotCenter >= 0 ? 1 : -1);
                if (targets[t].isBranch) curveSign = -curveSign;
                var bend = Math.min(10, Math.max(3, dist * 0.065)) * curveSign;
                var qx = Math.round((mx + perpX * bend) * 10) / 10;
                var qy = Math.round((my + perpY * bend) * 10) / 10;
                var steps = Math.max(4, Math.ceil(dist / 14));
                for (var s = 0; s <= steps; s++) {
                    var u = s / steps;
                    var inv = 1 - u;
                    pts.push({
                        x: inv * inv * n.x + 2 * inv * u * qx + u * u * tn.x,
                        y: inv * inv * n.y + 2 * inv * u * qy + u * u * tn.y
                    });
                }
            }
        }
        return pts;
    },

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

        var uniquePoiSet = {};
        var uList = this.UNIQUE_POI_IDS || [];
        for (var ui = 0; ui < uList.length; ui++) {
            uniquePoiSet[uList[ui]] = true;
        }
        var usedUniqueIds = {};

        // Deterministický 2D šum pro přirozené ekosystémové zóny
        function hash2D(ix, iy) {
            var v = Math.sin(ix * 127.1 + iy * 311.7 + seed * 0.713) * 43758.5453;
            return v - Math.floor(v);
        }
        function valueNoise2D(nx, ny) {
            var ix = Math.floor(nx);
            var iy = Math.floor(ny);
            var fx = nx - ix;
            var fy = ny - iy;
            var sx = fx * fx * (3 - 2 * fx);
            var sy = fy * fy * (3 - 2 * fy);
            var a = hash2D(ix, iy);
            var b = hash2D(ix + 1, iy);
            var c = hash2D(ix, iy + 1);
            var d = hash2D(ix + 1, iy + 1);
            return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sy;
        }
        function noise2D(x, y) {
            return 0.65 * valueNoise2D(x / 180, y / 180) + 0.35 * valueNoise2D(x / 95 + 13.7, y / 95 + 7.3);
        }

        // Vzorkování říční sítě a cestních koridorů
        var riverClearancePoints = [];
        if (board.rivers && board.rivers.length > 0) {
            var sRPS = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple) ||
                       (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.sampleRiverPathSimple);
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
        var roadSamples = this.sampleRoadCorridor ? this.sampleRoadCorridor(nodes) : [];

        var villageCenters = [];
        for (var vi = 0; vi < nodes.length; vi++) {
            var vn = nodes[vi];
            if (vn && (vn.type === "VILLAGE" || vn.type === "MERCHANT" || vn.subtype === "stables")) {
                villageCenters.push({ x: vn.x, y: vn.y });
            }
        }

        function isPositionClear(x, y, radius, allowClusterOverlap, minDistFromDecor) {
            if (x - radius < 42 || x + radius > 1358 || y - radius < 42 || y + radius > 818) return false;

            for (var rp = 0; rp < riverClearancePoints.length; rp++) {
                var rpt = riverClearancePoints[rp];
                var rdx = rpt.x - x;
                var rdy = rpt.y - y;
                var minRDist = radius + rpt.halfW + 16;
                if (rdx * rdx + rdy * rdy < minRDist * minRDist) return false;
            }

            for (var rs = 0; rs < roadSamples.length; rs++) {
                var rsdx = roadSamples[rs].x - x;
                var rsdy = roadSamples[rs].y - y;
                var minRoadDist = Math.max(36, radius + 12);
                if (rsdx * rsdx + rsdy * rsdy < minRoadDist * minRoadDist) return false;
            }

            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                var dx = n.x - x;
                var dy = n.y - y;
                var minNodeDist = Math.max(radius + 20, 38);
                if (dx * dx + dy * dy < minNodeDist * minNodeDist) return false;
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
                var lx1 = lm.x - lm.w / 2 - 16;
                var lx2 = lm.x + lm.w / 2 + 16;
                var ly1 = lm.y - lm.h / 2 - 16;
                var ly2 = lm.y + lm.h / 2 + 16;
                if (x + radius > lx1 && x - radius < lx2 && y + radius > ly1 && y - radius < ly2) return false;
            }

            for (var d = 0; d < decorList.length; d++) {
                var dec = decorList[d];
                var ddx = dec.x - x;
                var ddy = dec.y - y;
                var dDist = Math.sqrt(ddx * ddx + ddy * ddy);
                if (allowClusterOverlap) {
                    var clusterSep = minDistFromDecor || 15;
                    if (dDist < clusterSep) return false;
                } else {
                    var sep = minDistFromDecor ? (minDistFromDecor + (dec.clearance || 20) * 0.4) : (radius + dec.clearance);
                    if (dDist < sep) return false;
                }
            }
            return true;
        }

        function pushDecor(idPrefix, catalogId, x, y, scale, clearanceOverride, anchoredNodeId) {
            var item = catalog[catalogId];
            if (!item) return false;
            if (uniquePoiSet[catalogId]) {
                if (usedUniqueIds[catalogId]) return false;
                usedUniqueIds[catalogId] = true;
            }
            var sc = scale || 1.0;
            decorList.push({
                id: idPrefix + "_" + x + "_" + y,
                catalogId: catalogId,
                x: x,
                y: y,
                w: Math.round(item.w * sc),
                h: Math.round(item.h * sc),
                clearance: clearanceOverride || Math.round((item.clearance || 20) * sc),
                scale: Math.round(sc * 100) / 100,
                isFlipped: rnd() < 0.5,
                anchoredNodeId: (anchoredNodeId !== undefined) ? anchoredNodeId : null
            });
            return true;
        }

        function classifyZone(x, y) {
            for (var rp = 0; rp < riverClearancePoints.length; rp++) {
                var rpt = riverClearancePoints[rp];
                var rdx = rpt.x - x;
                var rdy = rpt.y - y;
                if (rdx * rdx + rdy * rdy < 90 * 90) return "wetland";
            }
            if ((x > 1060 || y < 160 || (x < 210 && y > 630)) && noise2D(x + 410, y + 190) > 0.32) {
                return "rocky";
            }
            for (var vi = 0; vi < villageCenters.length; vi++) {
                var vdx = villageCenters[vi].x - x;
                var vdy = villageCenters[vi].y - y;
                if (vdx * vdx + vdy * vdy < 165 * 165 && noise2D(x + 920, y + 530) > 0.36) {
                    return "farmland";
                }
            }
            if (x > 160 && x < 640 && y > 580 && noise2D(x + 920, y + 530) > 0.34) {
                return "farmland";
            }
            if (noise2D(x, y) > 0.52 || (x < 650 && y < 310 && noise2D(x * 1.2, y * 1.2) > 0.34)) {
                return "forest";
            }
            return "meadow";
        }

        function findClearSpot(cx, cy, radius, maxOffsets) {
            if (isPositionClear(cx, cy, radius, false)) return { x: cx, y: cy };
            var offsets = [
                { x: 35, y: 0 }, { x: -35, y: 0 }, { x: 0, y: 35 }, { x: 0, y: -35 },
                { x: 32, y: 32 }, { x: -32, y: 32 }, { x: 32, y: -32 }, { x: -32, y: -32 },
                { x: 58, y: 0 }, { x: -58, y: 0 }, { x: 0, y: 58 }, { x: 0, y: -58 },
                { x: 68, y: 36 }, { x: -68, y: 36 }, { x: 68, y: -36 }, { x: -68, y: -36 },
                { x: 88, y: 0 }, { x: -88, y: 0 }, { x: 0, y: 88 }, { x: 0, y: -88 }
            ];
            var lim = maxOffsets || offsets.length;
            for (var o = 0; o < lim; o++) {
                var tx = cx + offsets[o].x;
                var ty = cy + offsets[o].y;
                if (isPositionClear(tx, ty, radius, false)) return { x: tx, y: ty };
            }
            return null;
        }

        // 1. Husté lesní masivy (HoMM styl — překrývající se koruny vytvářejí souvislé lesy)
        function spawnForestMassif(cx, cy, type) {
            var groveKey = (type === "pine") ? "grove_pine" : "grove_oak";
            var treeKeys = (type === "pine") ? ["tree_pine", "tree_pine", "tree_birch"] : ["tree_oak", "tree_oak", "tree_birch"];
            if (!catalog[groveKey]) return 0;
            var gItem = catalog[groveKey];
            var spot = findClearSpot(cx, cy, gItem.clearance);
            if (!spot) return 0;
            cx = spot.x; cy = spot.y;

            pushDecor("massif_g", groveKey, cx, cy, 1.0, gItem.clearance);

            // Sekundární hájek pro velké masivy
            var g2Ang = rnd() * Math.PI * 2;
            var g2x = Math.round(cx + Math.cos(g2Ang) * 34);
            var g2y = Math.round(cy + Math.sin(g2Ang) * 26);
            var placedTrees = 1;
            if (isPositionClear(g2x, g2y, 18, true, 24)) {
                pushDecor("massif_g2", groveKey, g2x, g2y, 0.85, 22);
                placedTrees++;
            }

            // Husté Poissonovské prstence stromů (8-15 stromů, min. odstup 15 px, měřítko 0.62-1.02)
            var targetTrees = 10 + Math.floor(rnd() * 6);
            var tries = targetTrees * 3;
            for (var t = 0; t < tries && placedTrees < targetTrees + 2; t++) {
                var ang = rnd() * Math.PI * 2;
                var dist = 18 + rnd() * 54;
                var tx = Math.round(cx + Math.cos(ang) * dist);
                var ty = Math.round(cy + Math.sin(ang) * dist * 0.85);
                var tKey = treeKeys[Math.floor(rnd() * treeKeys.length)];
                if (catalog[tKey] && isPositionClear(tx, ty, 14, true, 16)) {
                    var sc = 0.64 + rnd() * 0.36;
                    if (pushDecor("massif_t", tKey, tx, ty, sc, 15)) {
                        placedTrees++;
                    }
                }
            }

            if (rnd() < 0.7 && catalog["bush"]) {
                var bx = Math.round(cx + (rnd() - 0.5) * 48);
                var by = Math.round(cy + 24 + rnd() * 18);
                if (isPositionClear(bx, by, 12, true, 16)) {
                    pushDecor("massif_b", "bush", bx, by, 0.85, 10);
                }
            }
            return placedTrees;
        }

        // 2. Řetězené horské hřebeny (3-5 vrcholů podél linie + balvany v podhůří)
        function spawnMountainRidge(cx, cy) {
            if (!catalog["mountain_peaks"]) return 0;
            var mItem = catalog["mountain_peaks"];
            var spot = findClearSpot(cx, cy, mItem.clearance);
            if (!spot) return 0;
            cx = spot.x; cy = spot.y;

            var ridgeLen = 3 + Math.floor(rnd() * 3); // 3-5 vrcholů
            var baseAng = (rnd() < 0.5 ? 1.1 : -1.1) + (rnd() - 0.5) * 0.6;
            var placed = 0;

            for (var p = 0; p < ridgeLen; p++) {
                var off = (p - (ridgeLen - 1) / 2) * 42;
                var px = Math.round(cx + Math.cos(baseAng) * off + (rnd() - 0.5) * 10);
                var py = Math.round(cy + Math.sin(baseAng) * off * 0.75 + (rnd() - 0.5) * 10);
                var rad = (p === 1 || p === 2) ? 24 : 20;
                if (isPositionClear(px, py, rad, p > 0, 26)) {
                    var sc = (p === Math.floor(ridgeLen / 2)) ? (0.95 + rnd() * 0.12) : (0.76 + rnd() * 0.22);
                    if (pushDecor("ridge_m", "mountain_peaks", px, py, sc, rad)) {
                        placed++;
                    }
                }
            }

            if (catalog["rock_boulder"]) {
                var bCount = 2 + Math.floor(rnd() * 2);
                for (var bi = 0; bi < bCount; bi++) {
                    var ang = rnd() * Math.PI * 2;
                    var dist = 34 + rnd() * 28;
                    var rx = Math.round(cx + Math.cos(ang) * dist);
                    var ry = Math.round(cy + Math.sin(ang) * dist);
                    if (isPositionClear(rx, ry, 14, true, 20)) {
                        pushDecor("ridge_r", "rock_boulder", rx, ry, 0.78 + rnd() * 0.24, 14);
                    }
                }
            }
            return placed;
        }

        // 3. Zemědělské a vesnické shluky (lánské pole + mlýn/chalupa + sad)
        function spawnFarmCluster(cx, cy) {
            if (!catalog["farm_field"]) return 0;
            var fItem = catalog["farm_field"];
            var spot = findClearSpot(cx, cy, fItem.clearance);
            if (!spot) return 0;
            cx = spot.x; cy = spot.y;

            pushDecor("farm_c", "farm_field", cx, cy, 0.96, fItem.clearance);
            var count = 1;

            var prop = (rnd() < 0.45 && catalog["windmill"]) ? "windmill" : (catalog["cottage_timber"] ? "cottage_timber" : null);
            if (prop) {
                var dir = rnd() < 0.5 ? 1 : -1;
                var px = Math.round(cx + dir * (40 + rnd() * 10));
                var py = Math.round(cy + (rnd() < 0.5 ? -18 : 18));
                if (isPositionClear(px, py, 20, true, 24)) {
                    pushDecor("farm_p", prop, px, py, 0.9, 20);
                    count++;
                }
            }

            var orchards = ["orchad_apple", "hruskovy_sad", "orchad_plum"];
            var oKey = orchards[Math.floor(rnd() * orchards.length)];
            if (rnd() < 0.7 && catalog[oKey]) {
                var ox = Math.round(cx + (rnd() - 0.5) * 48);
                var oy = Math.round(cy + 34 + rnd() * 10);
                if (isPositionClear(ox, oy, 18, true, 24)) {
                    pushDecor("farm_o", oKey, ox, oy, 0.85, 18);
                    count++;
                }
            }
            return count;
        }

        // Analýza volných buněk pro strategické umístění masivů a zón
        function evaluateClearance(x, y) {
            if (x < 65 || x > 1335 || y < 65 || y > 795) return 0;
            var minD = 9999;
            for (var ni = 0; ni < nodes.length; ni++) {
                var d = Math.hypot(nodes[ni].x - x, nodes[ni].y - y);
                if (d < minD) minD = d;
            }
            for (var rci = 0; rci < roadSamples.length; rci++) {
                var rcd = Math.hypot(roadSamples[rci].x - x, roadSamples[rci].y - y);
                if (rcd < minD) minD = rcd;
            }
            for (var li = 0; li < landmarks.length; li++) {
                var lm = landmarks[li];
                var ld = Math.hypot(lm.x - x, lm.y - y) - (lm.w || 90) * 0.5;
                if (ld < minD) minD = Math.max(0, ld);
            }
            for (var ri = 0; ri < riverClearancePoints.length; ri++) {
                var rp = riverClearancePoints[ri];
                var rd = Math.hypot(rp.x - x, rp.y - y) - rp.halfW;
                if (rd < minD) minD = Math.max(0, rd);
            }
            return minD;
        }

        var openCells = [];
        for (var sx = 85; sx <= 1315; sx += 44) {
            for (var sy = 85; sy <= 775; sy += 44) {
                var clr = evaluateClearance(sx, sy);
                if (clr >= 48) {
                    openCells.push({ x: sx, y: sy, clr: clr, zone: classifyZone(sx, sy) });
                }
            }
        }
        openCells.sort(function (a, b) { return b.clr - a.clr; });

        // A) Horská pásma
        var mtnSeeds = [[1215, 250], [1255, 495], [1180, 685]];
        var spawnedMtn = 0;
        for (var fm = 0; fm < mtnSeeds.length; fm++) {
            if (spawnMountainRidge(mtnSeeds[fm][0], mtnSeeds[fm][1]) > 0) spawnedMtn++;
        }
        for (var ci = 0; ci < openCells.length && spawnedMtn < 3; ci++) {
            var mc = openCells[ci];
            if (mc.clr >= 55 && (mc.zone === "rocky" || mc.y < 260 || mc.x > 1060 || mc.x < 300)) {
                if (spawnMountainRidge(mc.x, mc.y) > 0) spawnedMtn++;
            }
        }

        // B) Lesní masivy (nejprve preferované oblasti a pak top volné lesní buňky)
        var fixedForests = [
            [305, 165, "oak"], [195, 255, "oak"], [400, 295, "oak"],
            [175, 470, "oak"], [470, 710, "pine"], [885, 725, "pine"], [1045, 665, "pine"]
        ];
        var spawnedForests = 0;
        for (var ff = 0; ff < fixedForests.length; ff++) {
            if (spawnForestMassif(fixedForests[ff][0], fixedForests[ff][1], fixedForests[ff][2]) > 0) {
                spawnedForests++;
            }
        }
        for (var ci2 = 0; ci2 < openCells.length && spawnedForests < 6; ci2++) {
            var fc = openCells[ci2];
            if (fc.clr >= 64 && (fc.zone === "forest" || spawnedForests < 3)) {
                var fType = (fc.y > 460 || fc.x > 750) ? "pine" : "oak";
                if (spawnForestMassif(fc.x, fc.y, fType) > 0) spawnedForests++;
            }
        }

        // C) Zemědělské osady a lány v nížinách
        var spawnedFarms = 0;
        for (var ci3 = 0; ci3 < openCells.length && spawnedFarms < 4; ci3++) {
            var ac = openCells[ci3];
            if (ac.clr >= 58 && ac.zone === "farmland") {
                if (spawnFarmCluster(ac.x, ac.y) > 0) spawnedFarms++;
            }
        }

        // D) Ukotvené rekvizity u políček (s respektem ke 35px cestnímu koridoru a unikátnímu limitu)
        var nonUniqueQuestFallbacks = ["rock_boulder", "mountain_peaks"];
        for (var nIdx = 0; nIdx < nodes.length; nIdx++) {
            var node = nodes[nIdx];
            var propKey = null;

            if (node.type === "VILLAGE") {
                propKey = (nIdx % 3 === 0) ? "cottage_timber" : (nIdx % 3 === 1 ? "village_well" : "watermill");
            } else if (node.type === "ANIMAL") {
                if (node.setId === 2 && !usedUniqueIds["unicorn_grove"]) propKey = "unicorn_grove";
                else if (node.setId === 3 && !usedUniqueIds["pegasus_pond"]) propKey = "pegasus_pond";
                else if (node.setId === 4 && !usedUniqueIds["dryad_sacred_oak"]) propKey = "dryad_sacred_oak";
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
                for (var qp = 0; qp < questProps.length; qp++) {
                    var cand = questProps[(nIdx + qp) % questProps.length];
                    if (!usedUniqueIds[cand]) { propKey = cand; break; }
                }
                if (!propKey) propKey = nonUniqueQuestFallbacks[nIdx % nonUniqueQuestFallbacks.length];
            } else if (node.type === "CHANCE" || node.type === "JESTER") {
                var magicProps = ["fairy_ring_mushrooms", "druid_monoliths", "witch_hut", "ancient_ruins", "crystal_golem", "forest_ent", "ancient_tower_ruin"];
                for (var mp = 0; mp < magicProps.length; mp++) {
                    var mcand = magicProps[(nIdx + mp) % magicProps.length];
                    if (!usedUniqueIds[mcand]) { propKey = mcand; break; }
                }
            } else if (node.type === "TAX") {
                propKey = "wooden_watchtower";
            } else if (node.type === "HOSPITAL" && !usedUniqueIds["ancient_graveyard"]) {
                propKey = "ancient_graveyard";
            } else if (node.isJunction && nIdx % 2 === 0) {
                propKey = (nIdx % 4 === 0) ? "signpost" : "signpost2";
            }

            if (propKey && catalog[propKey]) {
                var catItem = catalog[propKey];
                var placed = false;
                var testDistances = [58, 70, 84];
                for (var td = 0; td < testDistances.length && !placed; td++) {
                    var testDist = testDistances[td];
                    var startAngle = (rnd() * Math.PI * 2);
                    for (var a = 0; a < 12; a++) {
                        var stepDir = (nIdx % 2 === 0) ? 1 : -1;
                        var ang = startAngle + stepDir * (a * Math.PI / 6);
                        var px = Math.round(node.x + Math.cos(ang) * testDist);
                        var py = Math.round(node.y + Math.sin(ang) * testDist);
                        if (isPositionClear(px, py, Math.max(16, catItem.clearance * 0.72), false, 28)) {
                            placed = pushDecor("prop_" + nIdx, propKey, px, py, 0.9 + rnd() * 0.16, catItem.clearance, nIdx);
                            break;
                        }
                    }
                }
            }
        }

        // E) Rozmístění unikátních bodů zájmu do jejich přirozených biomů (max 1x na mapu)
        var poiByZone = {
            forest: ["unicorn_grove", "dryad_sacred_oak", "forest_ent", "fairy_ring_mushrooms", "druid_monoliths", "witch_hut"],
            rocky: ["crystal_golem", "ancient_ruins", "ancient_tower_ruin", "phoenix_nest"],
            wetland: ["lake_nymphs", "vodnik_pond", "pegasus_pond", "swamp_bridge"]
        };
        for (var ci4 = 0; ci4 < openCells.length; ci4++) {
            var pc = openCells[ci4];
            if (pc.clr < 54) continue;
            var zPool = poiByZone[pc.zone];
            if (!zPool) continue;
            var pickedPoi = null;
            for (var zp = 0; zp < zPool.length; zp++) {
                var zCand = zPool[(ci4 + zp) % zPool.length];
                if (!usedUniqueIds[zCand] && catalog[zCand]) { pickedPoi = zCand; break; }
            }
            if (pickedPoi) {
                var pItem = catalog[pickedPoi];
                var pRad = Math.max(18, Math.round((pItem.clearance || 26) * 0.75));
                if (isPositionClear(pc.x, pc.y, pRad, false, pRad)) {
                    pushDecor("poi_" + pc.zone, pickedPoi, pc.x, pc.y, 0.94, pItem.clearance);
                }
            }
        }

        // F) Doplnění krajiny podle zón: v lese malé hájky, na loukách vzduch, u vody jezírka
        for (var ci5 = 0; ci5 < openCells.length; ci5++) {
            var scell = openCells[ci5];
            var jx = Math.round(scell.x + (rnd() - 0.5) * 20);
            var jy = Math.round(scell.y + (rnd() - 0.5) * 20);
            var z = scell.zone;

            if (z === "forest" && rnd() < 0.55) {
                var copseGrove = (jy > 450 || jx > 750) ? "grove_pine" : "grove_oak";
                var copseTree = (jy > 450 || jx > 750) ? "tree_pine" : ((rnd() < 0.35) ? "tree_birch" : "tree_oak");
                if (catalog[copseGrove] && isPositionClear(jx, jy, 24, false, 30)) {
                    pushDecor("f_copse", copseGrove, jx, jy, 0.9, 26);
                    for (var ct = 0; ct < 3; ct++) {
                        var ca = (ct / 3) * Math.PI * 2 + rnd() * 0.7;
                        var tx = Math.round(jx + Math.cos(ca) * (20 + rnd() * 14));
                        var ty = Math.round(jy + Math.sin(ca) * (18 + rnd() * 12));
                        if (catalog[copseTree] && isPositionClear(tx, ty, 14, true, 16)) {
                            pushDecor("f_tree", copseTree, tx, ty, 0.7 + rnd() * 0.25, 15);
                        }
                    }
                }
            } else if (z === "rocky" && rnd() < 0.45 && catalog["rock_boulder"]) {
                if (isPositionClear(jx, jy, 18, false, 26)) {
                    pushDecor("r_rock", "rock_boulder", jx, jy, 0.85 + rnd() * 0.2, 20);
                }
            } else if (z === "wetland" && rnd() < 0.32 && catalog["lake_pond"]) {
                if (isPositionClear(jx, jy, 22, false, 32)) {
                    pushDecor("w_pond", "lake_pond", jx, jy, 0.9, 26);
                }
            } else if (z === "farmland" && rnd() < 0.28 && catalog["farm_field"]) {
                if (isPositionClear(jx, jy, 22, false, 32)) {
                    pushDecor("a_field", "farm_field", jx, jy, 0.92, 26);
                }
            } else if (z === "meadow" && rnd() < 0.14) {
                // Vzdušná louka — jen občasný remízek (háj + 2 stromy) nebo keř
                if (rnd() < 0.45 && catalog["bush"] && isPositionClear(jx, jy, 14, false, 28)) {
                    pushDecor("m_bush", "bush", jx, jy, 0.85, 16);
                } else if (catalog["grove_oak"] && isPositionClear(jx, jy, 26, false, 34)) {
                    pushDecor("m_copse", "grove_oak", jx, jy, 0.88, 28);
                    for (var mt = 0; mt < 2; mt++) {
                        var ma = rnd() * Math.PI * 2;
                        var mtx = Math.round(jx + Math.cos(ma) * 22);
                        var mty = Math.round(jy + Math.sin(ma) * 18);
                        if (catalog["tree_oak"] && isPositionClear(mtx, mty, 14, true, 16)) {
                            pushDecor("m_tree", "tree_oak", mtx, mty, 0.72 + rnd() * 0.18, 15);
                        }
                    }
                }
            }
        }

        // Izometrické řazení dle souřadnice Y (Painter's algorithm)
        decorList.sort(function (a, b) {
            return a.y - b.y;
        });

        board.decorations = decorList;
        board.decorationsVersion = 5;
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
            image: "assets/castles/castle_royal.webp"
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
                        image: royalDef.image || royalDef.img || "assets/castles/castle_royal.webp",
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
                        image: royalDef.image || royalDef.img || "assets/castles/castle_royal.webp",
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
                        image: "assets/landmarks/dragon.webp",
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
            royalImgBase = (royalDef.image || royalDef.img || "assets/castles/castle_royal.webp").toLowerCase();
        }

        var allCastlesCatalog = this.ALL_CASTLES || [];
        var freeThematicCastles = allCastlesCatalog.filter(function (c) {
            if (!royalImgBase) return true;
            var cKey = c.id.replace("castle_", "").toLowerCase();
            return royalImgBase.indexOf(cKey) === -1 && royalImgBase.indexOf(c.id.toLowerCase()) === -1;
        });
        if (freeThematicCastles.length === 0) freeThematicCastles = allCastlesCatalog.slice(0);

        var defaultCastleMap = {
            H1: "assets/castles/castle_forest.webp",
            H2: "assets/castles/castle_wind.webp",
            H3: "assets/castles/castle_crystal.webp",
            H4: "assets/castles/castle_desert.webp",
            H5: "assets/castles/castle_water.webp",
            H6: "assets/castles/castle_ice.webp",
            H7: "assets/castles/castle_lava.webp",
            H8: "assets/castles/castle_swamp.webp",
            H9: "assets/castles/castle_dark.webp"
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
            var isDup = !cImg || (royalImgBase && royalImgBase.indexOf(cImg.toLowerCase().replace("assets/castles/", "").replace(/\.(?:png|jpe?g|webp)$/i, "").replace("_flip", "")) !== -1);
            if (isDup) {
                var prefImg = defaultCastleMap[cKey];
                var prefDup = prefImg && royalImgBase && royalImgBase.indexOf(prefImg.toLowerCase().replace("assets/castles/", "").replace(/\.(?:png|jpe?g|webp)$/i, "")) !== -1;
                if (prefImg && !prefDup) {
                    cImg = prefImg;
                } else {
                    var poolPick = freeThematicCastles[ci % freeThematicCastles.length];
                    cImg = poolPick ? poolPick.img : "assets/castles/castle_forest.webp";
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
                    var mKey = cImg.match(/castle_([a-z0-9_]+?)(?:_flip)?\.(?:png|jpe?g|webp)/i);
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
    }
};

window.PRS_BoardBuilder.sampleRiverPathSimple = function (p) {
    return window.KiDeskyMapGenerator.sampleRiverPathSimple(p);
};

window.KiDeskyMapGenerator.sanitizeAndAnchorLandmarks = function (b) {
    return window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks(b);
};
