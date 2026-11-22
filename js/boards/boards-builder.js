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
        if (!board.decorations || board.decorations.length === 0 || board.decorationsVersion !== 4) {
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
                var sRPS = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple) || (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.sampleRiverPathSimple);
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
        
            function isPositionClear(x, y, radius, allowClusterOverlap, minDistFromDecor) {
                if (x - radius < 35 || x + radius > 1365 || y - radius < 35 || y + radius > 825) return false;
        
                for (var rp = 0; rp < riverClearancePoints.length; rp++) {
                    var rpt = riverClearancePoints[rp];
                    var rdx = rpt.x - x;
                    var rdy = rpt.y - y;
                    var minRDist = radius + rpt.halfW + 16;
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
                    var reqDist = minDistFromDecor || radius;
                    for (var d = 0; d < decorList.length; d++) {
                        var dec = decorList[d];
                        var ddx = dec.x - x;
                        var ddy = dec.y - y;
                        var dDist = Math.sqrt(ddx * ddx + ddy * ddy);
                        var sep = minDistFromDecor ? (minDistFromDecor + (dec.clearance || 20) * 0.4) : (radius + dec.clearance);
                        if (dDist < sep) {
                            return false;
                        }
                    }
                }
        
                return true;
            }
        
            function findClearSpot(cx, cy, radius, maxOffsets) {
                if (isPositionClear(cx, cy, radius, false)) return { x: cx, y: cy };
                var offsets = [
                    { x: 35, y: 0 }, { x: -35, y: 0 }, { x: 0, y: 35 }, { x: 0, y: -35 },
                    { x: 30, y: 30 }, { x: -30, y: 30 }, { x: 30, y: -30 }, { x: -30, y: -30 },
                    { x: 55, y: 0 }, { x: -55, y: 0 }, { x: 0, y: 55 }, { x: 0, y: -55 },
                    { x: 65, y: 35 }, { x: -65, y: 35 }, { x: 65, y: -35 }, { x: -65, y: -35 },
                    { x: 80, y: 0 }, { x: -80, y: 0 }, { x: 0, y: 80 }, { x: 0, y: -80 }
                ];
                var lim = maxOffsets || offsets.length;
                for (var o = 0; o < lim; o++) {
                    var tx = cx + offsets[o].x;
                    var ty = cy + offsets[o].y;
                    if (isPositionClear(tx, ty, radius, false)) return { x: tx, y: ty };
                }
                return null;
            }
        
            // 1. Shlukové lesní hvozdy (Forest Thickets)
            function spawnForestThicket(cx, cy, type) {
                var groveKey = (type === "pine") ? "grove_pine" : (type === "birch" ? "grove_oak" : "grove_oak");
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
                    isFlipped: rnd() < 0.5,
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
                            isFlipped: rnd() < 0.5,
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
                            isFlipped: rnd() < 0.5,
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
        
                var mainFlipped = rnd() < 0.5;
                decorList.push({
                    id: "ridge_m1_" + cx + "_" + cy,
                    catalogId: "mountain_peaks",
                    x: cx,
                    y: cy,
                    w: mItem.w,
                    h: mItem.h,
                    clearance: mItem.clearance,
                    scale: 1.0,
                    isFlipped: mainFlipped,
                    anchoredNodeId: null
                });
        
                // Alternujeme směr bočního masivu (vlevo/vpravo s mírným náhodným posunem)
                var ridgeDir = (rnd() < 0.5 ? 1 : -1);
                var ox = cx + ridgeDir * (42 + Math.round(rnd() * 8));
                var oy = cy + (rnd() < 0.5 ? -8 : 8);
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
                        isFlipped: !mainFlipped,
                        anchoredNodeId: null
                    });
                }
        
                if (catalog["rock_boulder"]) {
                    var rDir = (rnd() < 0.5 ? 1 : -1);
                    var rx = cx + rDir * (20 + Math.round(rnd() * 15));
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
                            isFlipped: rnd() < 0.5,
                            anchoredNodeId: null
                        });
                    }
                }
            }
        
            // 2b. Zemědělský / vesnický shluk (Farm / Meadow Cluster)
            function spawnFarmCluster(cx, cy) {
                if (!catalog["farm_field"]) return;
                var fItem = catalog["farm_field"];
                var spot = findClearSpot(cx, cy, fItem.clearance);
                if (!spot) return;
                cx = spot.x; cy = spot.y;
        
                decorList.push({
                    id: "farm_c1_" + cx + "_" + cy,
                    catalogId: "farm_field",
                    x: cx,
                    y: cy,
                    w: fItem.w,
                    h: fItem.h,
                    clearance: fItem.clearance,
                    scale: 1.0,
                    isFlipped: rnd() < 0.5,
                    anchoredNodeId: null
                });
        
                // Přidáme větrný mlýn nebo chalupu poblíž - střídáme směr umístění i otočení
                var prop = (rnd() < 0.5 && catalog["windmill"]) ? "windmill" : (catalog["cottage_timber"] ? "cottage_timber" : null);
                if (prop) {
                    var pItem = catalog[prop];
                    var farmDir = (rnd() < 0.5 ? 1 : -1);
                    var px = cx + farmDir * (40 + Math.round(rnd() * 10));
                    var py = cy + (rnd() < 0.5 ? -20 : 20);
                    if (isPositionClear(px, py, 20, true)) {
                        decorList.push({
                            id: "farm_p_" + px + "_" + py,
                            catalogId: prop,
                            x: px,
                            y: py,
                            w: pItem.w,
                            h: pItem.h,
                            clearance: 20,
                            scale: 0.9,
                            isFlipped: rnd() < 0.5,
                            anchoredNodeId: null
                        });
                    }
                }
            }
        
            // DYNAMICKÁ ANALÝZA VOLNÉ PLOCHY PLÁNU:
            // Najdeme všechny volné oblasti na mapě s dostatečným odstupem od cest a řek
            function evaluateClearance(x, y) {
                if (x < 65 || x > 1335 || y < 65 || y > 795) return 0;
                var minD = 9999;
                for (var ni = 0; ni < nodes.length; ni++) {
                    var n = nodes[ni];
                    var d = Math.hypot(n.x - x, n.y - y);
                    if (d < minD) minD = d;
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
            for (var sx = 90; sx <= 1310; sx += 50) {
                for (var sy = 90; sy <= 770; sy += 50) {
                    var clr = evaluateClearance(sx, sy);
                    if (clr >= 60) {
                        openCells.push({ x: sx, y: sy, clr: clr });
                    }
                }
            }
            // Setřídíme podle největšího volného prostoru
            openCells.sort(function (a, b) { return b.clr - a.clr; });
        
            // Zkusíme klasické pozice (pro retro-kompatibilitu s classic_96)
            var fixedMountains = [[1210, 260], [1250, 490], [1180, 680]];
            var spawnedMtn = 0;
            for (var fm = 0; fm < fixedMountains.length; fm++) {
                var spot = findClearSpot(fixedMountains[fm][0], fixedMountains[fm][1], 55, 6);
                if (spot) {
                    spawnMountainRidge(spot.x, spot.y);
                    spawnedMtn++;
                }
            }
            // Pokud se nepodařilo umístit alespoň 2 horské masivy, umístíme je do nejlepších volných buněk u okrajů
            for (var ci = 0; ci < openCells.length && spawnedMtn < 3; ci++) {
                var cell = openCells[ci];
                if (cell.y < 350 || cell.x > 1050 || cell.x < 350) {
                    var mSpot = findClearSpot(cell.x, cell.y, 52);
                    if (mSpot) {
                        spawnMountainRidge(mSpot.x, mSpot.y);
                        spawnedMtn++;
                    }
                }
            }
        
            // Lesní hvozdy: zkusíme klasická místa, pak volné buňky
            var fixedForests = [
                [310, 160, "oak"], [200, 240, "oak"], [380, 290, "birch"],
                [180, 460, "oak"], [480, 710, "pine"], [890, 720, "pine"], [1040, 660, "pine"]
            ];
            var spawnedForests = 0;
            for (var ff = 0; ff < fixedForests.length; ff++) {
                var fSpot = findClearSpot(fixedForests[ff][0], fixedForests[ff][1], 44, 6);
                if (fSpot) {
                    spawnForestThicket(fSpot.x, fSpot.y, fixedForests[ff][2]);
                    spawnedForests++;
                }
            }
            // Doplníme další lesy a farmy do největších volných buněk
            var fTypes = ["pine", "oak", "birch", "pine"];
            for (var ci2 = 0; ci2 < openCells.length && spawnedForests < 7; ci2++) {
                var oCell = openCells[ci2];
                if (oCell.clr >= 75) {
                    var fSp = findClearSpot(oCell.x, oCell.y, 44);
                    if (fSp) {
                        if (spawnedForests % 3 === 0 && oCell.y > 300) {
                            spawnFarmCluster(fSp.x, fSp.y);
                        } else {
                            var fType = fTypes[spawnedForests % fTypes.length];
                            spawnForestThicket(fSp.x, fSp.y, fType);
                        }
                        spawnedForests++;
                    }
                }
            }
        
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
                    var placed = false;
                    var testDistances = [58, 72, 86];
                    for (var td = 0; td < testDistances.length && !placed; td++) {
                        var testDist = testDistances[td];
                        var startAngle = (rnd() * Math.PI * 2);
                        for (var a = 0; a < 8; a++) {
                            // Střídáme směr testování úhlů (po / proti směru ručiček)
                            var stepDir = (nIdx % 2 === 0) ? 1 : -1;
                            var ang = startAngle + stepDir * (a * Math.PI / 4);
                            var px = Math.round(node.x + Math.cos(ang) * testDist);
                            var py = Math.round(node.y + Math.sin(ang) * testDist);
                            if (isPositionClear(px, py, catItem.clearance * 0.85, false, 28)) {
                                decorList.push({
                                    id: "prop_" + nIdx + "_" + propKey,
                                    catalogId: propKey,
                                    x: px,
                                    y: py,
                                    w: catItem.w,
                                    h: catItem.h,
                                    clearance: catItem.clearance,
                                    scale: Math.round((0.9 + rnd() * 0.2) * 100) / 100,
                                    isFlipped: rnd() < 0.5,
                                    anchoredNodeId: nIdx
                                });
                                placed = true;
                                break;
                            }
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
        
            // Použijeme jemnější krok mřížky (42px místo 60px) s přirozeným rozptylem
            for (var gx = 70; gx <= 1330; gx += 42) {
                for (var gy = 70; gy <= 790; gy += 42) {
                    var jx = Math.round(gx + (rnd() - 0.5) * 32);
                    var jy = Math.round(gy + (rnd() - 0.5) * 32);
        
                    var pickKey;
                    if (jy < 180 && (jx < 350 || jx > 1050) && rnd() < 0.45) {
                        pickKey = "mountain_peaks";
                    } else if (rnd() < 0.08) {
                        var waterPicks = ["lake_pond", "lake_nymphs", "vodnik_pond", "pegasus_pond"];
                        pickKey = waterPicks[Math.floor(rnd() * waterPicks.length)];
                    } else if (rnd() < 0.12) {
                        pickKey = (rnd() < 0.5) ? "farm_field" : ((rnd() < 0.5) ? "orchad_apple" : "hruskovy_sad");
                    } else {
                        pickKey = scatterPool[Math.floor(rnd() * scatterPool.length)];
                    }
        
                    var itemDef = catalog[pickKey];
                    if (itemDef) {
                        // Přirozená tolerance rozestupu pro lehkou vegetaci a stromy
                        var isLightFlora = (pickKey.indexOf("tree_") === 0 || pickKey === "bush" || pickKey === "rock_boulder");
                        var minDecorDist = isLightFlora ? 26 : (itemDef.clearance * 0.8);
                        if (isPositionClear(jx, jy, Math.round(itemDef.clearance * 0.65), false, minDecorDist)) {
                            var sc = (pickKey === "mountain_peaks" || pickKey === "lake_pond" || pickKey === "farm_field")
                                ? 1.0 : (Math.round((0.82 + rnd() * 0.3) * 100) / 100);
                            decorList.push({
                                id: "scatter_" + jx + "_" + jy,
                                catalogId: pickKey,
                                x: jx,
                                y: jy,
                                w: Math.round(itemDef.w * sc),
                                h: Math.round(itemDef.h * sc),
                                clearance: Math.round(itemDef.clearance * sc),
                                scale: sc,
                                isFlipped: rnd() < 0.5,
                                anchoredNodeId: null
                            });
                        }
                    }
                }
            }
        
            // Izometrické řazení dle souřadnice Y (Painter's algorithm)
            decorList.sort(function (a, b) {
                return a.y - b.y;
            });
        
            board.decorations = decorList;
            board.decorationsVersion = 4;
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
