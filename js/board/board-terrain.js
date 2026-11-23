// ============================================================================
// KiDesky: Princeznino srdce - Souvisly namalovany teren (HoMM styl) + sumove masky
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    var TERRAIN_ASSETS = {
        grass: "assets/terrain/grass.webp",
        meadow: "assets/terrain/meadow.webp",
        forest_floor: "assets/terrain/forest_floor.webp",
        rock: "assets/terrain/rock.webp",
        dirt: "assets/terrain/dirt.webp",
        ash: "assets/terrain/ash.webp",
        snow: "assets/terrain/snow.webp",
        mist: "assets/terrain/mist.webp"
    };

    var THEME_CONFIGS = {
        light: {
            base: "grass",
            overlays: ["meadow", "forest_floor", "rock", "dirt"],
            opacities: { meadow: 0.90, forest_floor: 0.94, rock: 0.92, dirt: 0.88 },
            glaze: "rgba(254, 243, 199, 0.06)"
        },
        earth: {
            base: "grass",
            overlays: ["meadow", "forest_floor", "rock", "dirt"],
            opacities: { meadow: 0.86, forest_floor: 0.95, rock: 0.92, dirt: 0.86 },
            glaze: "rgba(6, 78, 59, 0.14)"
        },
        fire: {
            base: "ash",
            overlays: ["rock", "dirt"],
            opacities: { rock: 0.90, dirt: 0.84 },
            glaze: "rgba(124, 45, 18, 0.12)"
        },
        water: {
            base: "snow",
            overlays: ["rock", "meadow", "dirt"],
            opacities: { rock: 0.88, meadow: 0.52, dirt: 0.78 },
            glaze: "rgba(7, 89, 133, 0.11)"
        },
        air: {
            base: "mist",
            overlays: ["meadow", "rock", "dirt"],
            opacities: { meadow: 0.65, rock: 0.86, dirt: 0.78 },
            glaze: "rgba(76, 29, 149, 0.10)"
        }
    };

    var FOREST_DECOR_IDS = {
        tree_oak: 1, tree_pine: 1, tree_birch: 1,
        grove_oak: 1, grove_pine: 1, grove_pine2: 1,
        bush: 1, dryad_sacred_oak: 1, forest_ent: 1,
        witch_hut: 1, fairy_ring_mushrooms: 1
    };

    var ROCK_DECOR_IDS = {
        mountain_peaks: 1, rock_boulder: 1, dragon_cave: 1,
        cave_bear_den: 1, bandit_cave: 1, snow_troll_cave: 1,
        crystal_golem: 1, basilisk_cave: 1, griffin_nest: 1,
        fire_salamander: 1, ancient_ruins: 1, ancient_tower_ruin: 1
    };

    var MEADOW_DECOR_IDS = {
        farm_field: 1, orchad_apple: 1, hruskovy_sad: 1,
        orchad_plum: 1, windmill: 1, pasture_fence: 1,
        unicorn_grove: 1
    };

    var SETTLEMENT_DECOR_IDS = {
        cottage_timber: 1, village_well: 1, merchant_wagon: 1,
        tournament_tent: 1, signpost: 1, signpost2: 1
    };

    function resolveThemeKey(app, themeOverride) {
        var th = themeOverride || (app && app.currentTheme);
        if (!th && typeof document !== "undefined" && document && document.documentElement) {
            th = document.documentElement.getAttribute("data-theme");
        }
        if (!th && typeof localStorage !== "undefined" && localStorage) {
            th = localStorage.getItem("kidesky_element_theme");
        }
        return THEME_CONFIGS[th] ? th : "light";
    }

    function computeRoadMaskPaths(nodes) {
        if (!nodes || !nodes.length) return "";
        var out = [];
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (!n) continue;
            out.push('<circle cx="' + n.x + '" cy="' + n.y + '" r="34" fill="#ffffff"/>');

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
                out.push('<path d="M ' + n.x + ' ' + n.y + ' Q ' + qx + ' ' + qy + ' ' + tn.x + ' ' + tn.y + '" stroke="#ffffff" stroke-width="46" stroke-linecap="round" fill="none"/>');
            }
        }
        return out.join("");
    }

    function buildMaskShapesByType(board) {
        var shapes = {
            meadow: [],
            forest_floor: [],
            rock: [],
            dirt: []
        };
        if (!board) return shapes;

        var biomes = board.biomes || [];
        for (var b = 0; b < biomes.length; b++) {
            var bm = biomes[b];
            if (!bm || !bm.path) continue;
            var id = bm.id || "";
            if (id.indexOf("forest") !== -1) {
                shapes.forest_floor.push('<path d="' + bm.path + '" fill="#ffffff"/>');
            } else if (id.indexOf("mountain") !== -1) {
                shapes.rock.push('<path d="' + bm.path + '" fill="#ffffff"/>');
            } else if (id.indexOf("meadow") !== -1) {
                shapes.meadow.push('<path d="' + bm.path + '" fill="#ffffff"/>');
            }
        }

        var decs = board.decorations || [];
        for (var d = 0; d < decs.length; d++) {
            var dec = decs[d];
            if (!dec || !dec.catalogId) continue;
            var sizeR = Math.round(Math.max(dec.w || 48, dec.h || 48) * 0.72);
            if (FOREST_DECOR_IDS[dec.catalogId]) {
                shapes.forest_floor.push('<circle cx="' + dec.x + '" cy="' + (dec.y + 4) + '" r="' + sizeR + '" fill="#ffffff"/>');
            } else if (ROCK_DECOR_IDS[dec.catalogId]) {
                shapes.rock.push('<circle cx="' + dec.x + '" cy="' + (dec.y + 4) + '" r="' + Math.round(sizeR * 1.05) + '" fill="#ffffff"/>');
            } else if (MEADOW_DECOR_IDS[dec.catalogId]) {
                shapes.meadow.push('<circle cx="' + dec.x + '" cy="' + dec.y + '" r="' + Math.round(sizeR * 1.1) + '" fill="#ffffff"/>');
            } else if (SETTLEMENT_DECOR_IDS[dec.catalogId]) {
                shapes.dirt.push('<circle cx="' + dec.x + '" cy="' + (dec.y + 6) + '" r="' + Math.round(sizeR * 0.75) + '" fill="#ffffff"/>');
            }
        }

        var landmarks = board.landmarks || [];
        for (var l = 0; l < landmarks.length; l++) {
            var lm = landmarks[l];
            if (!lm) continue;
            if (lm.id === "royalCastle") {
                shapes.meadow.push('<ellipse cx="' + lm.x + '" cy="' + (lm.y + 12) + '" rx="175" ry="120" fill="#ffffff"/>');
                shapes.dirt.push('<ellipse cx="' + lm.x + '" cy="' + (lm.y + 28) + '" rx="95" ry="52" fill="#ffffff"/>');
            } else if (lm.id === "dragon" || (lm.id && lm.id.indexOf("dragon") !== -1)) {
                shapes.rock.push('<ellipse cx="' + lm.x + '" cy="' + (lm.y + 14) + '" rx="115" ry="82" fill="#ffffff"/>');
            } else if (lm.id && lm.id.indexOf("castle") !== -1) {
                shapes.rock.push('<ellipse cx="' + lm.x + '" cy="' + (lm.y + 18) + '" rx="90" ry="62" fill="#ffffff"/>');
            }
        }

        var roadDirt = computeRoadMaskPaths(board.nodes);
        if (roadDirt) shapes.dirt.push(roadDirt);

        return shapes;
    }

    Object.assign(window.PRS_App, {
        getBoardTerrainDefsSVG: function (board, themeOverride) {
            var th = resolveThemeKey(this, themeOverride);
            var cfg = THEME_CONFIGS[th];
            var seed = (board && board.seed) || 4599;
            var escapeFn = this.escapeHtml ? this.escapeHtml.bind(this) : function (s) { return String(s || ""); };
            var normFn = (typeof window !== "undefined" && window.PRS_normalizeAssetUrl)
                ? window.PRS_normalizeAssetUrl
                : function (u) { return u; };

            var usedTypes = [cfg.base].concat(cfg.overlays);
            var out = [];

            for (var i = 0; i < usedTypes.length; i++) {
                var key = usedTypes[i];
                var url = normFn(TERRAIN_ASSETS[key] || TERRAIN_ASSETS.grass);
                out.push(
                    '<pattern id="terrainPat_' + key + '" patternUnits="userSpaceOnUse" width="256" height="256">' +
                    '  <image href="' + escapeFn(url) + '" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid slice"/>' +
                    '</pattern>'
                );
            }

            out.push(
                '<filter id="terrainEdgeFilter" x="-12%" y="-12%" width="124%" height="124%">' +
                '  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="' + seed + '" result="tn"/>' +
                '  <feDisplacementMap in="SourceGraphic" in2="tn" scale="34" xChannelSelector="R" yChannelSelector="G"/>' +
                '  <feGaussianBlur stdDeviation="5"/>' +
                '</filter>'
            );

            out.push(
                '<filter id="terrainFrameBlur" x="-10%" y="-10%" width="120%" height="120%">' +
                '  <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="' + (seed + 13) + '" result="tf"/>' +
                '  <feDisplacementMap in="SourceGraphic" in2="tf" scale="20" xChannelSelector="R" yChannelSelector="G"/>' +
                '  <feGaussianBlur stdDeviation="16"/>' +
                '</filter>' +
                '<mask id="terrainInnerMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1400" height="860">' +
                '  <rect x="0" y="0" width="1400" height="860" fill="#000000"/>' +
                '  <rect x="44" y="36" width="1312" height="788" rx="48" fill="#ffffff" filter="url(#terrainFrameBlur)"/>' +
                '</mask>'
            );

            var maskShapes = buildMaskShapesByType(board);
            for (var oi = 0; oi < cfg.overlays.length; oi++) {
                var ovKey = cfg.overlays[oi];
                var body = (maskShapes[ovKey] || []).join("");
                out.push(
                    '<mask id="terrainMask_' + ovKey + '" maskUnits="userSpaceOnUse" x="0" y="0" width="1400" height="860">' +
                    '  <rect x="0" y="0" width="1400" height="860" fill="#000000"/>' +
                    (body ? ('  <g filter="url(#terrainEdgeFilter)">' + body + '</g>') : '') +
                    '</mask>'
                );
            }

            return out.join("");
        },

        renderBoardTerrainHTML: function (board) {
            var th = resolveThemeKey(this, null);
            var cfg = THEME_CONFIGS[th];
            var maskShapes = buildMaskShapesByType(board);
            var out = [];

            out.push('  <g id="prs-terrain-layer" mask="url(#terrainInnerMask)" pointer-events="none">');
            out.push('    <rect x="0" y="0" width="1400" height="860" fill="url(#terrainPat_' + cfg.base + ')"/>');

            for (var i = 0; i < cfg.overlays.length; i++) {
                var ovKey = cfg.overlays[i];
                if (!maskShapes[ovKey] || maskShapes[ovKey].length === 0) continue;
                var op = (cfg.opacities && cfg.opacities[ovKey]) || 0.88;
                out.push('    <rect x="0" y="0" width="1400" height="860" fill="url(#terrainPat_' + ovKey + ')" mask="url(#terrainMask_' + ovKey + ')" opacity="' + op + '"/>');
            }

            if (cfg.glaze) {
                out.push('    <rect x="0" y="0" width="1400" height="860" fill="' + cfg.glaze + '"/>');
            }
            out.push('  </g>');

            return out.join("\n");
        }
    });
})();
