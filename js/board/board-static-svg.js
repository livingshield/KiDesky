// ============================================================================
// KiDesky: Princeznino srdce - Statická SVG vrstva plánu, biomy, siluety polí a definice filtrů
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    getBoardDefsSVG: function () {

        var th = this.currentTheme ||
                 (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-theme")) ||
                 (typeof localStorage !== "undefined" && localStorage && localStorage.getItem("kidesky_element_theme")) || "light";

        var themePalettes = {
            light: {
                c0: "#fef08a", c1: "#d4af37", c2: "#854d0e", stroke: "#d4af37", glow: "rgba(250,204,21,0.55)",
                parchment: ["#3d3423", "#31291b", "#251e14", "#17120c"],
                heartland: { c0: "#4d7c0f", c1: "#3f6212", c2: "#365314" },
                forest:    { c0: "#14532d", c1: "#166534", c2: "#15803d" },
                mountain:  { c0: "#57534e", c1: "#44403c", c2: "#292524" },
                meadows:   { c0: "#a16207", c1: "#65a30d", c2: "#4d7c0f" },
                water:     { c0: "#0f766e", c1: "#0369a1", c2: "#155e75" },
                groundMoss:  "rgba(34,84,42,0.64)",
                groundEarth: "rgba(120,82,40,0.58)",
                groundStone: "rgba(87,83,78,0.62)",
                groundWater: "rgba(14,116,144,0.58)",
                groundMagic: "rgba(52,105,68,0.60)"
            },
            fire: {
                c0: "#fed7aa", c1: "#f97316", c2: "#9a3412", stroke: "#ea580c", glow: "rgba(239,68,68,0.65)",
                parchment: ["#2d120a", "#220c06", "#170703", "#0d0402"],
                heartland: { c0: "#7c2d12", c1: "#431407", c2: "#290d05" },
                forest:    { c0: "#451a03", c1: "#290e02", c2: "#1c0901" },
                mountain:  { c0: "#44403c", c1: "#292524", c2: "#1c1917" },
                meadows:   { c0: "#c2410c", c1: "#9a3412", c2: "#7c2d12" },
                water:     { c0: "#ea580c", c1: "#b91c1c", c2: "#7f1d1d" },
                groundMoss:  "rgba(154,52,18,0.64)",
                groundEarth: "rgba(124,45,18,0.58)",
                groundStone: "rgba(68,64,60,0.72)",
                groundWater: "rgba(234,88,12,0.65)",
                groundMagic: "rgba(220,38,38,0.60)"
            },
            water: {
                c0: "#bae6fd", c1: "#38bdf8", c2: "#0369a1", stroke: "#0284c7", glow: "rgba(14,165,233,0.65)",
                parchment: ["#0e2a47", "#091d33", "#061322", "#030a13"],
                heartland: { c0: "#075985", c1: "#0c4a6e", c2: "#082f49" },
                forest:    { c0: "#0f766e", c1: "#115e59", c2: "#134e4a" },
                mountain:  { c0: "#64748b", c1: "#475569", c2: "#334155" },
                meadows:   { c0: "#0284c7", c1: "#0369a1", c2: "#075985" },
                water:     { c0: "#38bdf8", c1: "#0284c7", c2: "#0369a1" },
                groundMoss:  "rgba(15,118,110,0.64)",
                groundEarth: "rgba(12,74,110,0.58)",
                groundStone: "rgba(71,85,105,0.65)",
                groundWater: "rgba(14,165,233,0.62)",
                groundMagic: "rgba(56,189,248,0.60)"
            },
            earth: {
                c0: "#a7f3d0", c1: "#10b981", c2: "#065f46", stroke: "#059669", glow: "rgba(34,197,94,0.65)",
                parchment: ["#1f331b", "#162613", "#0e1a0c", "#070e06"],
                heartland: { c0: "#15803d", c1: "#166534", c2: "#14532d" },
                forest:    { c0: "#064e3b", c1: "#065f46", c2: "#047857" },
                mountain:  { c0: "#44403c", c1: "#3f3f46", c2: "#27272a" },
                meadows:   { c0: "#4d7c0f", c1: "#3f6212", c2: "#365314" },
                water:     { c0: "#047857", c1: "#065f46", c2: "#064e3b" },
                groundMoss:  "rgba(22,101,52,0.68)",
                groundEarth: "rgba(113,63,18,0.58)",
                groundStone: "rgba(63,63,70,0.65)",
                groundWater: "rgba(5,150,105,0.60)",
                groundMagic: "rgba(16,185,129,0.60)"
            },
            air: {
                c0: "#ede9fe", c1: "#c084fc", c2: "#6b21a8", stroke: "#9333ea", glow: "rgba(168,85,247,0.65)",
                parchment: ["#241b4b", "#1a1338", "#120d26", "#090615"],
                heartland: { c0: "#5b21b6", c1: "#4c1d95", c2: "#3b0764" },
                forest:    { c0: "#4338ca", c1: "#3730a3", c2: "#312e81" },
                mountain:  { c0: "#6b7280", c1: "#4b5563", c2: "#374151" },
                meadows:   { c0: "#7c3aed", c1: "#6d28d9", c2: "#5b21b6" },
                water:     { c0: "#a855f7", c1: "#9333ea", c2: "#7e22ce" },
                groundMoss:  "rgba(76,29,149,0.64)",
                groundEarth: "rgba(67,56,202,0.58)",
                groundStone: "rgba(75,85,99,0.65)",
                groundWater: "rgba(168,85,247,0.62)",
                groundMagic: "rgba(192,132,252,0.60)"
            }
        };

        var activePalette = themePalettes[th] || themePalettes.light;

        return '<defs>' +
            '<filter id="biomeBlur" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="34" /></filter>' +
            '<filter id="mistBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="32" /></filter>' +
            '<filter id="riverBankBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>' +
            '<filter id="riverSoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" /></filter>' +
            '<filter id="groundCushionBlur" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="4.5" /></filter>' +
            '<filter id="riverWobble" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="rn"/><feDisplacementMap in="SourceGraphic" in2="rn" scale="3.4" xChannelSelector="R" yChannelSelector="G"/></filter>' +
            '<filter id="riverGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            '<filter id="roadVergeBlur" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur stdDeviation="2.2" /></filter>' +
            '<linearGradient id="signpostWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '  <stop offset="0%" stop-color="#9a6f42" />' +
            '  <stop offset="50%" stop-color="#734d28" />' +
            '  <stop offset="100%" stop-color="#4e3218" />' +
            '</linearGradient>' +
            '<clipPath id="prsBoardInnerClip"><rect x="18" y="18" width="1364" height="824" rx="18"/></clipPath>' +
            '<filter id="cloudShadowBlur" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="28"/></filter>' +
            '<radialGradient id="atmoSunWarmth" cx="32%" cy="28%" r="72%">' +
            '  <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.14" />' +
            '  <stop offset="55%" stop-color="#fde68a" stop-opacity="0.02" />' +
            '  <stop offset="100%" stop-color="#0f0a06" stop-opacity="0.22" />' +
            '</radialGradient>' +
            '<radialGradient id="dayNightTorchGlow" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="#fff7cc" stop-opacity="0.90" />' +
            '  <stop offset="30%" stop-color="#fbbf24" stop-opacity="0.62" />' +
            '  <stop offset="65%" stop-color="#ea580c" stop-opacity="0.24" />' +
            '  <stop offset="100%" stop-color="#ea580c" stop-opacity="0" />' +
            '</radialGradient>' +
            '<radialGradient id="nightArcaneGlow" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="#e9d5ff" stop-opacity="0.85" />' +
            '  <stop offset="45%" stop-color="#a855f7" stop-opacity="0.40" />' +
            '  <stop offset="100%" stop-color="#6b21a8" stop-opacity="0" />' +
            '</radialGradient>' +
            '<radialGradient id="nightMoonVeilGrad" cx="62%" cy="32%" r="76%">' +
            '  <stop offset="0%" stop-color="' + (th === "fire" ? "rgba(46,18,30,0.52)" : "rgba(34,58,128,0.52)") + '" />' +
            '  <stop offset="55%" stop-color="' + (th === "fire" ? "rgba(32,12,24,0.64)" : "rgba(14,28,72,0.66)") + '" />' +
            '  <stop offset="100%" stop-color="' + (th === "fire" ? "rgba(22,10,22,0.72)" : "rgba(6,12,34,0.80)") + '" />' +
            '</radialGradient>' +
            '<radialGradient id="nightMoonbeamGrad" cx="76%" cy="16%" r="56%">' +
            '  <stop offset="0%" stop-color="rgba(186,222,255,0.16)" />' +
            '  <stop offset="55%" stop-color="rgba(148,196,255,0.05)" />' +
            '  <stop offset="100%" stop-color="rgba(148,196,255,0)" />' +
            '</radialGradient>' +
            '<radialGradient id="heartlandBiomeGrad" cx="50%" cy="48%" r="58%">' +
            '  <stop offset="0%" stop-color="' + activePalette.heartland.c0 + '" stop-opacity="0.58" />' +
            '  <stop offset="55%" stop-color="' + activePalette.heartland.c1 + '" stop-opacity="0.46" />' +
            '  <stop offset="100%" stop-color="' + activePalette.heartland.c2 + '" stop-opacity="0.18" />' +
            '</radialGradient>' +
            '<linearGradient id="forestBiomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '  <stop offset="0%" stop-color="' + activePalette.forest.c0 + '" stop-opacity="0.76" />' +
            '  <stop offset="55%" stop-color="' + activePalette.forest.c1 + '" stop-opacity="0.64" />' +
            '  <stop offset="100%" stop-color="' + activePalette.forest.c2 + '" stop-opacity="0.48" />' +
            '</linearGradient>' +
            '<linearGradient id="mountainBiomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '  <stop offset="0%" stop-color="' + activePalette.mountain.c0 + '" stop-opacity="0.82" />' +
            '  <stop offset="50%" stop-color="' + activePalette.mountain.c1 + '" stop-opacity="0.72" />' +
            '  <stop offset="100%" stop-color="' + activePalette.mountain.c2 + '" stop-opacity="0.58" />' +
            '</linearGradient>' +
            '<linearGradient id="meadowsBiomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '  <stop offset="0%" stop-color="' + activePalette.meadows.c0 + '" stop-opacity="0.58" />' +
            '  <stop offset="55%" stop-color="' + activePalette.meadows.c1 + '" stop-opacity="0.52" />' +
            '  <stop offset="100%" stop-color="' + activePalette.meadows.c2 + '" stop-opacity="0.42" />' +
            '</linearGradient>' +
            '<linearGradient id="waterBiomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '  <stop offset="0%" stop-color="' + activePalette.water.c0 + '" stop-opacity="0.52" />' +
            '  <stop offset="50%" stop-color="' + activePalette.water.c1 + '" stop-opacity="0.46" />' +
            '  <stop offset="100%" stop-color="' + activePalette.water.c2 + '" stop-opacity="0.36" />' +
            '</linearGradient>' +
            '<radialGradient id="decorShadowGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="rgba(8,6,4,0.68)" />' +
            '  <stop offset="58%" stop-color="rgba(12,9,6,0.36)" />' +
            '  <stop offset="100%" stop-color="rgba(12,9,6,0)" />' +
            '</radialGradient>' +
            '<radialGradient id="groundMossGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="' + activePalette.groundMoss + '" />' +
            '  <stop offset="65%" stop-color="' + activePalette.groundMoss.replace(/[\d\.]+\)$/, '0.34)') + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.groundMoss.replace(/[\d\.]+\)$/, '0)') + '" />' +
            '</radialGradient>' +
            '<radialGradient id="groundEarthGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="' + activePalette.groundEarth + '" />' +
            '  <stop offset="65%" stop-color="' + activePalette.groundEarth.replace(/[\d\.]+\)$/, '0.30)') + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.groundEarth.replace(/[\d\.]+\)$/, '0)') + '" />' +
            '</radialGradient>' +
            '<radialGradient id="groundStoneGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="' + activePalette.groundStone + '" />' +
            '  <stop offset="65%" stop-color="' + activePalette.groundStone.replace(/[\d\.]+\)$/, '0.32)') + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.groundStone.replace(/[\d\.]+\)$/, '0)') + '" />' +
            '</radialGradient>' +
            '<radialGradient id="groundWaterGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="' + activePalette.groundWater + '" />' +
            '  <stop offset="65%" stop-color="' + activePalette.groundWater.replace(/[\d\.]+\)$/, '0.32)') + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.groundWater.replace(/[\d\.]+\)$/, '0)') + '" />' +
            '</radialGradient>' +
            '<radialGradient id="groundMagicGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="' + activePalette.groundMagic + '" />' +
            '  <stop offset="65%" stop-color="' + activePalette.groundMagic.replace(/[\d\.]+\)$/, '0.28)') + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.groundMagic.replace(/[\d\.]+\)$/, '0)') + '" />' +
            '</radialGradient>' +
            '<radialGradient id="mistSoftGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="' + (th === "fire" ? "rgba(254,215,170,0.22)" : (th === "water" ? "rgba(186,230,253,0.35)" : (th === "earth" ? "rgba(167,243,208,0.25)" : (th === "air" ? "rgba(237,233,254,0.30)" : "rgba(224,242,254,0.32)")))) + '" />' +
            '  <stop offset="60%" stop-color="' + (th === "fire" ? "rgba(249,115,22,0.10)" : (th === "water" ? "rgba(56,189,248,0.14)" : (th === "earth" ? "rgba(34,197,94,0.12)" : (th === "air" ? "rgba(192,132,252,0.14)" : "rgba(186,230,253,0.15)")))) + '" />' +
            '  <stop offset="100%" stop-color="rgba(0,0,0,0)" />' +
            '</radialGradient>' +
            '<linearGradient id="cardParchmentGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '  <stop offset="0%" stop-color="rgba(34,25,18,0.85)" />' +
            '  <stop offset="100%" stop-color="rgba(18,12,8,0.92)" />' +
            '</linearGradient>' +
            '<radialGradient id="parchmentGrad" cx="50%" cy="46%" r="74%">' +
            '  <stop offset="0%" stop-color="' + activePalette.parchment[0] + '" />' +
            '  <stop offset="45%" stop-color="' + activePalette.parchment[1] + '" />' +
            '  <stop offset="78%" stop-color="' + activePalette.parchment[2] + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.parchment[3] + '" />' +
            '</radialGradient>' +

            '<linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +

            '  <stop offset="0%" stop-color="' + activePalette.c0 + '" />' +

            '  <stop offset="50%" stop-color="' + activePalette.c1 + '" />' +

            '  <stop offset="100%" stop-color="' + activePalette.c2 + '" />' +

            '</linearGradient>' +

            '<linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +

            '  <stop offset="0%" stop-color="#cbd5e1" />' +

            '  <stop offset="50%" stop-color="#64748b" />' +

            '  <stop offset="100%" stop-color="#1e293b" />' +

            '</linearGradient>' +

            '<filter id="glowFilter" x="-25%" y="-25%" width="150%" height="150%">' +

            '  <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#000" flood-opacity="0.78"/>' +

            '</filter>' +

            '<radialGradient id="vignetteMaskGrad" cx="50%" cy="50%" r="50%">' +

            '  <stop offset="65%" stop-color="#ffffff" stop-opacity="1" />' +

            '  <stop offset="85%" stop-color="#ffffff" stop-opacity="0.75" />' +

            '  <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />' +

            '</radialGradient>' +

            '<mask id="vignetteMask" maskContentUnits="objectBoundingBox">' +

            '  <rect x="0" y="0" width="1" height="1" rx="0.1" fill="url(#vignetteMaskGrad)" />' +

            '</mask>' +

            '<clipPath id="clipNormalTile" clipPathUnits="objectBoundingBox">' +

            '  <circle cx="0.5" cy="0.5" r="0.5" />' +

            '</clipPath>' +
            '<clipPath id="clipShieldTile" clipPathUnits="objectBoundingBox"><path d="M 0.05 0.05 L 0.95 0.05 L 0.95 0.52 C 0.95 0.82 0.65 0.97 0.5 1 C 0.35 0.97 0.05 0.82 0.05 0.52 Z" /></clipPath>' +
            '<clipPath id="clipHeartTile" clipPathUnits="objectBoundingBox"><path d="M 0.5 0.96 C 0.08 0.65 0 0.44 0 0.28 C 0 0.08 0.16 0 0.34 0 C 0.44 0 0.48 0.05 0.5 0.16 C 0.52 0.05 0.56 0 0.66 0 C 0.84 0 1 0.08 1 0.28 C 1 0.44 0.92 0.65 0.5 0.96 Z" /></clipPath>' +
            '<clipPath id="clipOctagonTile" clipPathUnits="objectBoundingBox"><polygon points="0.29,0.02 0.71,0.02 0.98,0.29 0.98,0.71 0.71,0.98 0.29,0.98 0.02,0.71 0.02,0.29" /></clipPath>' +
            '<clipPath id="clipStarTile" clipPathUnits="objectBoundingBox"><polygon points="0.5,0.02 0.64,0.36 0.98,0.5 0.64,0.64 0.5,0.98 0.36,0.64 0.02,0.5 0.36,0.36" /></clipPath>' +
            '<clipPath id="clipHexTile" clipPathUnits="objectBoundingBox"><polygon points="0.25,0.05 0.75,0.05 0.98,0.5 0.75,0.95 0.25,0.95 0.02,0.5" /></clipPath>' +
            '<clipPath id="clipSquareTile" clipPathUnits="objectBoundingBox"><rect x="0.04" y="0.04" width="0.92" height="0.92" rx="0.16" /></clipPath>' +
            '<clipPath id="clipHospitalTile" clipPathUnits="objectBoundingBox"><path d="M 0.08 0.08 L 0.92 0.08 L 0.92 0.52 C 0.92 0.80 0.64 0.96 0.5 1 C 0.36 0.96 0.08 0.80 0.08 0.52 Z" /></clipPath>' +
            '<linearGradient id="tileGlassGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.08"/><stop offset="100%" stop-color="#000000" stop-opacity="0.28"/></linearGradient>' +
            '<radialGradient id="tileInnerShadow" cx="50%" cy="50%" r="50%"><stop offset="70%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.55"/></radialGradient>' +
            '<filter id="dragonFireGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            '<filter id="goldAuraGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
            '<linearGradient id="decorFootFadeGrad_strong" x1="0" y1="0" x2="0" y2="1">' +
            '  <stop offset="0%" stop-color="#ffffff"/><stop offset="68%" stop-color="#ffffff"/><stop offset="86%" stop-color="#bbbbbb"/><stop offset="100%" stop-color="#000000"/>' +
            '</linearGradient>' +
            '<mask id="decorFootFadeMask_strong" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#decorFootFadeGrad_strong)"/></mask>' +
            '<linearGradient id="decorFootFadeGrad_soft" x1="0" y1="0" x2="0" y2="1">' +
            '  <stop offset="0%" stop-color="#ffffff"/><stop offset="74%" stop-color="#ffffff"/><stop offset="89%" stop-color="#cccccc"/><stop offset="100%" stop-color="#000000"/>' +
            '</linearGradient>' +
            '<mask id="decorFootFadeMask_soft" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#decorFootFadeGrad_soft)"/></mask>' +
            '<linearGradient id="decorFootFadeGrad_light" x1="0" y1="0" x2="0" y2="1">' +
            '  <stop offset="0%" stop-color="#ffffff"/><stop offset="84%" stop-color="#ffffff"/><stop offset="94%" stop-color="#cccccc"/><stop offset="100%" stop-color="#000000"/>' +
            '</linearGradient>' +
            '<mask id="decorFootFadeMask_light" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#decorFootFadeGrad_light)"/></mask>' +
            '<radialGradient id="decorCastShadowGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="0%" stop-color="rgba(10,12,8,0.40)"/><stop offset="62%" stop-color="rgba(10,12,8,0.16)"/><stop offset="100%" stop-color="rgba(10,12,8,0)"/>' +
            '</radialGradient>' +
            '<filter id="decorColorHarmonize">' +
            '  <feColorMatrix type="matrix" values="1.01 0.02 0 0 0  0.01 0.99 0 0 0  0 0.01 0.94 0 0  0 0 0 1 0"/>' +
            '</filter>' +
            (typeof this.getBoardTerrainDefsSVG === "function" ? this.getBoardTerrainDefsSVG(this.state && this.state.board, th) : "") +

            '</defs>';

    },

    
    renderBoardSVG: function () {

        var svg = document.getElementById("prs-board-svg");

        if (!svg || !this.state) return;

        var stage = document.getElementById("prs-board-stage");

        var staticLayer = document.getElementById("prs-static-layer");

        var tokensLayer = document.getElementById("prs-tokens-layer");

        var gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var defsKey = (this.currentTheme || "light") + "|" + (this.isNightMode ? "night" : "day") + "|" + gQuality + "|" + ((this.state && this.state.board && (this.state.board.seed || this.state.board.id)) || "static");

        if (!stage || !staticLayer || !tokensLayer) {
            var s = Math.max(1.0, this.viewport.scale || 1.0);
            this.viewport.scale = s;
            this.clampViewportPan();

            var wrap = document.getElementById("board-viewport-wrap");
            var svgW = (svg && svg.clientWidth > 0) ? svg.clientWidth : (wrap ? wrap.clientWidth : 1000);
            var svgH = (svg && svg.clientHeight > 0) ? svg.clientHeight : (wrap ? wrap.clientHeight : 620);
            var svgRatioX = 1400 / Math.max(1, svgW);
            var svgRatioY = 860 / Math.max(1, svgH);

            var minTx = 1400 * (1 - s);
            var minTy = 860 * (1 - s);
            var tx = (this.viewport.panX || 0) * svgRatioX;
            var ty = (this.viewport.panY || 0) * svgRatioY;
            tx = Math.min(0, Math.max(minTx, tx));
            ty = Math.min(0, Math.max(minTy, ty));
            this.viewport.panX = tx / svgRatioX;
            this.viewport.panY = ty / svgRatioY;

            var finalTx = Math.round(tx * 10) / 10;
            var finalTy = Math.round(ty * 10) / 10;

            svg.innerHTML = this.getBoardDefsSVG() +
                '<g id="prs-board-stage">' +
                '  <g id="prs-static-layer"></g>' +
                '  <g id="prs-tokens-layer"></g>' +
                '</g>';

            this._lastDefsKey = defsKey;
            staticLayer = document.getElementById("prs-static-layer");

            tokensLayer = document.getElementById("prs-tokens-layer");

        } else {

            var defsEl = svg.querySelector("defs");

            if (defsEl && (this._lastDefsKey !== defsKey || this.isBoardStaticDirty)) {

                var tempDiv = document.createElement("div");

                tempDiv.innerHTML = '<svg>' + this.getBoardDefsSVG() + '</svg>';

                var newDefs = tempDiv.querySelector("defs");

                if (newDefs) defsEl.innerHTML = newDefs.innerHTML;

                this._lastDefsKey = defsKey;

            }

        }

        if (staticLayer && (this.isBoardStaticDirty || !staticLayer.hasChildNodes())) {

            staticLayer.innerHTML = this.renderBoardStaticHTML();

            this.isBoardStaticDirty = false;

        }

        this.renderBoardTokens();

        if (typeof this._invalidateBoardSize === "function") this._invalidateBoardSize();

        if (typeof this.applyViewportTransform === "function") this.applyViewportTransform(false);

    },

    
    
    renderBoardBiomesHTML: function (board) {
        if (!board || !board.biomes || board.biomes.length === 0) return "";
        var gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var hasTexturedTerrain = (gQuality !== "low") && (typeof this.renderBoardTerrainHTML === "function");
        var baseOpacityScale = hasTexturedTerrain ? 0.32 : 1.0;
        var heartlandOp = hasTexturedTerrain ? "0.20" : "0.55";
        var biomeBlurAttr = (gQuality === "high") ? ' filter="url(#biomeBlur)"' : '';
        var out = [];
        out.push('  <g id="prs-biomes-layer" pointer-events="none">');
        // Celkový teplý podkladový akvarelový přeliv krajiny
        out.push('    <ellipse cx="690" cy="430" rx="640" ry="380" fill="url(#heartlandBiomeGrad)" opacity="' + heartlandOp + '"' + biomeBlurAttr + '/>');
        for (var b = 0; b < board.biomes.length; b++) {
            var bm = board.biomes[b];
            var fillVal = bm.fillGrad ? ("url(#" + bm.fillGrad + ")") : bm.fill;
            out.push('    <g class="biome-region" data-biome-id="' + bm.id + '">');
            out.push('      <path d="' + bm.path + '" fill="' + fillVal + '" opacity="' + (Math.round(((bm.opacity || 0.78) * baseOpacityScale) * 100) / 100) + '"' + biomeBlurAttr + '/>');
            if (bm.contours && bm.contours.length > 0) {
                for (var c = 0; c < bm.contours.length; c++) {
                    out.push('      <path d="' + bm.contours[c] + '" fill="none" stroke="' + (bm.contourStroke || 'rgba(251,191,36,0.32)') + '" stroke-width="1.15" stroke-dasharray="' + (bm.contourDash || '7,5') + '"' + (hasTexturedTerrain ? ' opacity="0.55"' : '') + '/>');
                }
            }
            out.push('    </g>');
        }
        out.push(this.renderNaturalTerrainDetailsHTML(board));
        out.push('  </g>');
        return out.join("\n");
    },

    
    renderNaturalTerrainDetailsHTML: function (board) {
        var seed = (board && board.seed) || 4599;
        var activeTheme = this.currentTheme ||
                          (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-theme")) ||
                          (typeof localStorage !== "undefined" && localStorage && localStorage.getItem("kidesky_element_theme")) || "light";
        var out = [];
        out.push('    <g id="prs-micro-terrain" opacity="0.78">');
        function hVal(idx) {
            var v = Math.sin((seed + idx * 17) * 12.9898) * 43758.5453;
            return v - Math.floor(v);
        }
        // Trsy trávy, kamínky, kvítky, uhlíky či sníh rozprostřené po mapě podle zvoleného živlu
        var k = 1;
        for (var gx = 70; gx <= 1330; gx += 68) {
            for (var gy = 70; gy <= 790; gy += 64) {
                k++;
                var tx = Math.round(gx + (hVal(k) - 0.5) * 48);
                var ty = Math.round(gy + (hVal(k + 100) - 0.5) * 44);
                if (tx < 45 || tx > 1355 || ty < 45 || ty > 815) continue;

                var kind = hVal(k + 200);

                if (activeTheme === "fire") {
                    if (tx > 970) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + ty + '" rx="4.5" ry="2.2" fill="rgba(28,25,23,0.7)"/>');
                        out.push('      <line x1="' + (tx - 3) + '" y1="' + ty + '" x2="' + (tx + 3) + '" y2="' + (ty + 1) + '" stroke="#ea580c" stroke-width="0.8"/>');
                        if (kind > 0.5) {
                            out.push('      <circle cx="' + (tx + 3) + '" cy="' + (ty - 1) + '" r="1.3" fill="rgba(249,115,22,0.85)"/>');
                        }
                    } else if (tx < 560 && ty < 450) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.5) + '" rx="8.5" ry="3.8" fill="rgba(41,13,5,0.45)"/>');
                        out.push('      <circle cx="' + (tx - 2) + '" cy="' + (ty - 2) + '" r="1.4" fill="rgba(254,240,138,0.85)"/>');
                        out.push('      <circle cx="' + (tx + 3) + '" cy="' + (ty - 1) + '" r="1.1" fill="rgba(249,115,22,0.8)"/>');
                    } else {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.2) + '" rx="7.0" ry="3.0" fill="rgba(67,20,7,0.35)"/>');
                        if (kind > 0.45) {
                            var emberCol = (kind > 0.75) ? "rgba(254,240,138,0.9)" : "rgba(249,115,22,0.85)";
                            out.push('      <circle cx="' + tx + '" cy="' + (ty - 3) + '" r="1.2" fill="' + emberCol + '"/>');
                        }
                    }
                } else if (activeTheme === "water") {
                    if (tx > 970) {
                        out.push('      <polygon points="' + tx + ',' + (ty - 3) + ' ' + (tx + 3) + ',' + (ty + 1) + ' ' + (tx - 3) + ',' + (ty + 1) + '" fill="rgba(186,230,253,0.7)"/>');
                        if (kind > 0.5) {
                            out.push('      <circle cx="' + (tx + 4) + '" cy="' + ty + '" r="1.2" fill="rgba(224,242,254,0.8)"/>');
                        }
                    } else if (tx < 560 && ty < 450) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.5) + '" rx="8.5" ry="4.0" fill="rgba(15,118,110,0.3)"/>');
                        out.push('      <path d="M ' + (tx - 3) + ' ' + ty + ' L ' + (tx - 6) + ' ' + (ty - 5) + ' M ' + tx + ' ' + ty + ' L ' + tx + ' ' + (ty - 7) + ' M ' + (tx + 3) + ' ' + ty + ' L ' + (tx + 6) + ' ' + (ty - 5) + '" stroke="rgba(186,230,253,0.6)" stroke-width="1.1" stroke-linecap="round"/>');
                    } else {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.2) + '" rx="7.5" ry="3.0" fill="rgba(14,165,233,0.2)"/>');
                        if (kind > 0.5) {
                            out.push('      <circle cx="' + (tx - 2) + '" cy="' + (ty - 3) + '" r="1.3" fill="rgba(255,255,255,0.85)"/>');
                            out.push('      <circle cx="' + (tx + 3) + '" cy="' + (ty - 2) + '" r="1.0" fill="rgba(186,230,253,0.75)"/>');
                        }
                    }
                } else if (activeTheme === "air") {
                    if (tx > 970) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + ty + '" rx="4.0" ry="2.0" fill="rgba(107,33,168,0.5)"/>');
                        if (kind > 0.5) {
                            out.push('      <circle cx="' + (tx + 3) + '" cy="' + (ty - 2) + '" r="1.3" fill="rgba(237,233,254,0.85)"/>');
                        }
                    } else if (tx < 560 && ty < 450) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.5) + '" rx="8.5" ry="4.0" fill="rgba(67,56,202,0.3)"/>');
                        out.push('      <path d="M ' + (tx - 3) + ' ' + ty + ' Q ' + (tx - 5) + ' ' + (ty - 5) + ' ' + (tx - 7) + ' ' + (ty - 6) + ' M ' + tx + ' ' + ty + ' Q ' + tx + ' ' + (ty - 6) + ' ' + (tx + 1) + ' ' + (ty - 8) + ' M ' + (tx + 3) + ' ' + ty + ' Q ' + (tx + 5) + ' ' + (ty - 5) + ' ' + (tx + 7) + ' ' + (ty - 6) + '" stroke="rgba(192,132,252,0.5)" stroke-width="1.1" stroke-linecap="round" fill="none"/>');
                    } else {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.2) + '" rx="7.0" ry="3.0" fill="rgba(124,58,237,0.2)"/>');
                        if (kind > 0.5) {
                            var starCol = (kind > 0.78) ? "rgba(237,233,254,0.9)" : "rgba(192,132,252,0.75)";
                            out.push('      <circle cx="' + (tx - 2) + '" cy="' + (ty - 3) + '" r="1.3" fill="' + starCol + '"/>');
                        }
                    }
                } else {
                    if (tx > 970) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + ty + '" rx="4.2" ry="2.2" fill="rgba(41,37,36,0.45)"/>');
                        out.push('      <ellipse cx="' + (tx - 1.2) + '" cy="' + (ty - 0.6) + '" rx="2.6" ry="1.4" fill="rgba(168,162,158,0.42)"/>');
                        if (kind > 0.5) {
                            out.push('      <circle cx="' + (tx + 4) + '" cy="' + (ty + 1.2) + '" r="1.3" fill="rgba(120,113,108,0.48)"/>');
                        }
                    } else if (tx < 560 && ty < 450) {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.5) + '" rx="9" ry="4.2" fill="rgba(20,83,45,0.28)"/>');
                        out.push('      <path d="M ' + (tx - 3) + ' ' + ty + ' Q ' + (tx - 5) + ' ' + (ty - 5) + ' ' + (tx - 7) + ' ' + (ty - 6) + ' M ' + tx + ' ' + ty + ' Q ' + tx + ' ' + (ty - 6) + ' ' + (tx + 1) + ' ' + (ty - 8) + ' M ' + (tx + 3) + ' ' + ty + ' Q ' + (tx + 5) + ' ' + (ty - 5) + ' ' + (tx + 7) + ' ' + (ty - 6) + '" stroke="rgba(74,222,128,0.38)" stroke-width="1.15" stroke-linecap="round" fill="none"/>');
                    } else {
                        out.push('      <ellipse cx="' + tx + '" cy="' + (ty + 1.2) + '" rx="7.5" ry="3.2" fill="rgba(63,98,18,0.24)"/>');
                        out.push('      <path d="M ' + (tx - 2.5) + ' ' + ty + ' L ' + (tx - 4.5) + ' ' + (ty - 5) + ' M ' + tx + ' ' + ty + ' L ' + tx + ' ' + (ty - 6.5) + ' M ' + (tx + 2.5) + ' ' + ty + ' L ' + (tx + 4.8) + ' ' + (ty - 4.8) + '" stroke="rgba(163,230,53,0.40)" stroke-width="1.1" stroke-linecap="round"/>');
                        if (kind > 0.62) {
                            var flCol = (kind > 0.82) ? "rgba(253,224,71,0.65)" : "rgba(244,114,182,0.58)";
                            out.push('      <circle cx="' + (tx - 3.5) + '" cy="' + (ty - 4.5) + '" r="1.3" fill="' + flCol + '"/>');
                            out.push('      <circle cx="' + (tx + 3.8) + '" cy="' + (ty - 3.5) + '" r="1.1" fill="rgba(254,240,138,0.65)"/>');
                        }
                    }
                }
            }
        }
        out.push('    </g>');
        return out.join("\n");
    },

    
    renderBoardStaticHTML: function () {

        var nodes = this.state.board.nodes;

        var cardZones = this.state.board.cardZones || [];

        var landmarks = this.state.board.landmarks || [];

        var out = [];

        var th = this.currentTheme || "light";
        var gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";

        var themePalettes = {

            light: { stroke: "#d4af37" },

            fire:  { stroke: "#ea580c" },

            water: { stroke: "#0284c7" },

            earth: { stroke: "#059669" },

            air:   { stroke: "#9333ea" }

        };

        var activePalette = themePalettes[th] || themePalettes.light;

        // 1. Podklad herní desky (pergamen nebo vlastní bitmapa)

        out.push('  <rect x="0" y="0" width="1400" height="860" rx="22" fill="url(#parchmentGrad)" stroke="' + activePalette.stroke + '" stroke-width="3.5"/>');

        if (this.graphicsConfig && this.graphicsConfig.boardBgUrl) {
            var boardBgHref = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(this.graphicsConfig.boardBgUrl) : this.graphicsConfig.boardBgUrl;
            out.push('  <image href="' + this.escapeHtml(boardBgHref) + '" x="4" y="4" width="1392" height="852" preserveAspectRatio="xMidYMid slice" opacity="0.88" style="filter: var(--board-filter, none);" />');
        }

        // Rohové kování desky

        var corners = [[18, 18], [1382, 18], [18, 842], [1382, 842]];

        for (var ci = 0; ci < corners.length; ci++) {

            var ccx = corners[ci][0];

            var ccy = corners[ci][1];

            out.push('  <circle cx="' + ccx + '" cy="' + ccy + '" r="7" fill="' + activePalette.stroke + '" stroke="#000" stroke-width="1.2"/>');

            out.push('  <circle cx="' + ccx + '" cy="' + ccy + '" r="2" fill="#fff" opacity="0.8"/>');

        }

        // Kartografický dvojitý rám královské mapy (bez umělých čárkovaných přehybů)
        out.push('  <rect x="10" y="10" width="1380" height="840" rx="18" fill="none" stroke="rgba(212,175,55,0.34)" stroke-width="1.3"/>');
        out.push('  <rect x="16" y="16" width="1368" height="828" rx="14" fill="none" stroke="rgba(212,175,55,0.22)" stroke-width="1.0" stroke-dasharray="14,6,3,6"/>');

        // 1a. Souvislý namalovaný terén (bezešvé textury se šumovými maskami)
        if (gQuality !== "low" && typeof this.renderBoardTerrainHTML === "function" && this.state.board) {
            out.push(this.renderBoardTerrainHTML(this.state.board));
        }

        // 1b. Sémantické akvarelové biomy a vrstevnice
        if (this.state.board && this.state.board.biomes && this.state.board.biomes.length > 0) {
            out.push(this.renderBoardBiomesHTML(this.state.board));
        }

        // 1c. Meandrující říční síť a vodní toky
        if (this.state.board && this.state.board.rivers && this.state.board.rivers.length > 0) {
            out.push(this.renderBoardRiversHTML(this.state.board));
        }

        // 1d. Architektonické mosty přes řeku na křížení cest
        if (this.state.board && this.state.board.bridges && this.state.board.bridges.length > 0) {
            // mosty presunuty za cesty aby je neprekryval asfalt
        }

        // 1e. Plovoucí ranní mlha nad horami a hvozdem (Atmosférický opar - pouze HIGH)
        if (gQuality === "high") {
            out.push('  <g id="prs-mist-layer" pointer-events="none" opacity="0.65">');
            out.push('    <g>');
            out.push('      <animateTransform attributeName="transform" type="translate" values="0,0; 32,-12; 0,0" dur="22s" repeatCount="indefinite" />');
            out.push('      <ellipse cx="1160" cy="320" rx="200" ry="110" fill="url(#mistSoftGrad)" filter="url(#mistBlur)"/>');
            out.push('      <ellipse cx="320" cy="180" rx="220" ry="120" fill="url(#mistSoftGrad)" filter="url(#mistBlur)"/>');
            out.push('      <ellipse cx="880" cy="540" rx="170" ry="95" fill="url(#mistSoftGrad)" filter="url(#mistBlur)"/>');
            out.push('    </g>');
            out.push('  </g>');
        }

        // 2. Balíčky karet přesunuty z plánu do přehledné řady pod herním plánem (mezi detail rytíře a kroniku)

        // 3. Dominanty království (Královský Hrad, Drak, Hrady a Citadely)

        for (var lm = 0; lm < landmarks.length; lm++) {

            var lmk = landmarks[lm];

            var rawLmUrl = "";
            if (lmk.id === "royalCastle") {
                if (this.currentTheme && this.currentTheme !== "light" && this.graphicsConfig && this.graphicsConfig.landmarkBitmaps && this.graphicsConfig.landmarkBitmaps.royalCastle) {
                    rawLmUrl = this.graphicsConfig.landmarkBitmaps.royalCastle;
                } else {
                    rawLmUrl = lmk.image || (this.graphicsConfig && this.graphicsConfig.landmarkBitmaps && this.graphicsConfig.landmarkBitmaps.royalCastle) || "assets/castles/castle_royal.webp";
                }
            } else {
                rawLmUrl = lmk.image || ((this.graphicsConfig && this.graphicsConfig.landmarkBitmaps && this.graphicsConfig.landmarkBitmaps[lmk.id]) ? this.graphicsConfig.landmarkBitmaps[lmk.id] : "");
            }

            var wasFlipUrl = window.PRS_isFlippedAssetUrl ? window.PRS_isFlippedAssetUrl(rawLmUrl) : false;
            var customLmUrl = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(rawLmUrl) : rawLmUrl;
            var shouldFlipLm = Boolean(wasFlipUrl || ((lmk.x > 700 || lmk.isFlipped) && customLmUrl && (customLmUrl.indexOf("dragon") !== -1 || lmk.id === "dragonLair" || customLmUrl.indexOf("castle") !== -1)));

            out.push('  <g class="board-landmark" transform="translate(' + (lmk.x - lmk.w / 2) + ',' + (lmk.y - lmk.h / 2) + ')">');

            if (customLmUrl) {
                // Přirozené terénní lůžko a kontaktní stín pod dominantou (hrad, citadela, dračí sluj)
                var lmBaseGrad = (lmk.id === "dragonLair" || customLmUrl.indexOf("dragon") !== -1) ? "groundStoneGrad" : "groundMossGrad";
                var lmCushBlurAttr = (gQuality === "high") ? ' filter="url(#groundCushionBlur)"' : '';
                out.push('    <ellipse cx="' + (lmk.w / 2) + '" cy="' + (lmk.h - 24) + '" rx="' + Math.round(lmk.w * 0.48) + '" ry="' + Math.round(lmk.h * 0.24) + '" fill="url(#' + lmBaseGrad + ')"' + lmCushBlurAttr + ' pointer-events="none"/>');
                out.push('    <ellipse cx="' + (lmk.w / 2) + '" cy="' + (lmk.h - 20) + '" rx="' + Math.round(lmk.w * 0.39) + '" ry="' + Math.round(lmk.h * 0.16) + '" fill="url(#decorShadowGrad)" pointer-events="none"/>');

                // Průsvitná 3D izometrická ilustrace hradu nebo draka (zrcadlení jen na <image>, popiska zůstává čitelná)
                var lmFlipAttr = shouldFlipLm ? (' transform="translate(' + lmk.w + ', 0) scale(-1, 1)"') : '';
                out.push('    <image href="' + this.escapeHtml(customLmUrl) + '" x="0" y="0" width="' + lmk.w + '" height="' + (lmk.h - 10) + '" preserveAspectRatio="xMidYMid meet"' + lmFlipAttr + '/>');

                if (lmk.id === "royalCastle") {

                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', 22)">');

                    out.push('      <circle cx="0" cy="0" r="14" fill="rgba(236,72,153,0.3)" stroke="#ec4899" stroke-width="1.4">');

                    out.push('        <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite"/>');

                    out.push('        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>');

                    out.push('      </circle>');

                    out.push('      <text x="0" y="5" text-anchor="middle" font-size="14">💖</text>');

                    out.push('    </g>');

                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', ' + (lmk.h - 14) + ')">');

                    var rcShadowAttr = (gQuality === "high") ? ' filter="drop-shadow(0 3px 6px rgba(0,0,0,0.7))"' : '';
                    out.push('      <rect x="-115" y="-13" width="230" height="26" rx="13" fill="rgba(18,12,8,0.92)" stroke="' + activePalette.stroke + '" stroke-width="1.6"' + rcShadowAttr + '/>');

                    var rcName = (this.getLandmarkDisplayName ? this.getLandmarkDisplayName(lmk) : lmk.name) || "Královský Hrad";
                    out.push('      <text x="0" y="5" text-anchor="middle" fill="#f472b6" font-size="11" font-weight="bold">♡ ' + this.escapeHtml(rcName) + ' (' + this.state.config.targetHearts + ' 💖) ♡</text>');

                    out.push('    </g>');

                } else {

                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', ' + (lmk.h - 12) + ')">');

                    var lmShadowAttr = (gQuality === "high") ? ' filter="drop-shadow(0 2px 6px rgba(0,0,0,0.7))"' : '';
                    out.push('      <rect x="-85" y="-11" width="170" height="22" rx="11" fill="rgba(16,10,6,0.90)" stroke="' + activePalette.stroke + '" stroke-width="1.2"' + lmShadowAttr + '/>');

                    var lmTitle = (this.getLandmarkDisplayName ? this.getLandmarkDisplayName(lmk) : lmk.name);
                    out.push('      <text x="0" y="4" text-anchor="middle" fill="#fef08a" font-family="Cinzel, serif" font-size="10" font-weight="bold">' + this.escapeHtml(lmTitle) + '</text>');

                    out.push('    </g>');

                }

            } else if (lmk.id === "royalCastle") {

                out.push('    <rect x="10" y="18" width="' + (lmk.w - 20) + '" height="' + (lmk.h - 24) + '" rx="16" fill="rgba(36,27,19,0.82)" stroke="rgba(212,175,55,0.48)" stroke-width="2"/>');

                out.push('    <polygon points="35,45 55,10 75,45" fill="#991b1b" stroke="#d4af37" stroke-width="1.5"/>');

                out.push('    <polygon points="' + (lmk.w / 2 - 28) + ',42 ' + (lmk.w / 2) + ',2 ' + (lmk.w / 2 + 28) + ',42" fill="#b91c1c" stroke="#d4af37" stroke-width="1.8"/>');

                out.push('    <polygon points="' + (lmk.w - 75) + ',45 ' + (lmk.w - 55) + ',10 ' + (lmk.w - 35) + ',45" fill="#991b1b" stroke="#d4af37" stroke-width="1.5"/>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="76" text-anchor="middle" font-size="36">🏰</text>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="102" text-anchor="middle" fill="#f3e5ab" font-family="Cinzel, serif" font-size="14" font-weight="bold">' + this.escapeHtml((window.PRS_I18n ? window.PRS_I18n.t("castles.royal.name", null, "KRÁLOVSKÝ HRAD") : "KRÁLOVSKÝ HRAD").toUpperCase()) + '</text>');

                var scn = (this.state.config && this.state.config.scenario) || "CLASSIC";
                var scnTitle = "♡ PRINCEZNINO SRDCE (" + this.state.config.targetHearts + " 💖) ♡";
                var scnColor = "#f472b6";
                if (scn === "DRAGON") {
                    scnTitle = "🐉 LOVCI DRAKŮ — Získejte Dračí korunu! 👑";
                    scnColor = "#f97316";
                } else if (scn === "TYCOON") {
                    scnTitle = "🏰 FEUDÁLNÍ MAGNÁT — Ovládněte města a cechy! 🪙";
                    scnColor = "#eab308";
                } else if (scn === "SPRINT") {
                    scnTitle = "⚡ KRÁLOVSKÝ SPRINT (15 💖)";
                    scnColor = "#38bdf8";
                }
                out.push('    <text x="' + (lmk.w / 2) + '" y="121" text-anchor="middle" fill="' + scnColor + '" font-size="10.5" font-weight="bold">' + scnTitle + '</text>');

            } else {

                out.push('    <rect x="4" y="4" width="' + (lmk.w - 8) + '" height="' + (lmk.h - 8) + '" rx="12" fill="rgba(28,22,16,0.65)" stroke="rgba(212,175,55,0.32)" stroke-width="1.4"/>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="' + (lmk.h / 2 + 2) + '" text-anchor="middle" font-size="28">' + lmk.icon + '</text>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="' + (lmk.h - 10) + '" text-anchor="middle" fill="#e7e5e4" font-family="Cinzel, serif" font-size="10" font-weight="bold">' + this.escapeHtml(lmk.name) + '</text>');

            }

            out.push('  </g>');

        }

        // 4. Organické dlážděné Bézierovy cesty, směrové šipky a heraldické milníky

        for (var i = 0; i < nodes.length; i++) {

            var n = nodes[i];

            var targets = [];

            if (n.branchLow !== null && n.branchLow !== undefined && n.branchHigh !== null && n.branchHigh !== undefined) {

                targets.push({ id: n.branchLow, label: "1–3", color: "#38bdf8", isBranch: true });

                targets.push({ id: n.branchHigh, label: "4–6", color: "#f59e0b", isBranch: true });

            } else if (n.next && n.next.length > 0) {

                targets.push({ id: n.next[0], label: null, color: "#d4af37", isBranch: false });

            }

            for (var t = 0; t < targets.length; t++) {

                var targetNode = nodes[targets[t].id];

                if (!targetNode) continue;

                var dx = targetNode.x - n.x;

                var dy = targetNode.y - n.y;

                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 1) continue;

                var mx = (n.x + targetNode.x) / 2;

                var my = (n.y + targetNode.y) / 2;

                var perpX = -dy / dist;

                var perpY = dx / dist;

                var toCenterX = 700 - mx;

                var toCenterY = 430 - my;

                var dotCenter = perpX * toCenterX + perpY * toCenterY;

                var curveSign = (dotCenter >= 0 ? 1 : -1);

                if (targets[t].isBranch) curveSign = -curveSign;

                var bend = Math.min(10, Math.max(3, dist * 0.065)) * curveSign;

                var qx = Math.round((mx + perpX * bend) * 10) / 10;

                var qy = Math.round((my + perpY * bend) * 10) / 10;

                var pthD = 'M ' + n.x + ' ' + n.y + ' Q ' + qx + ' ' + qy + ' ' + targetNode.x + ' ' + targetNode.y;

                // 4 tematické styly cest podle oblasti a větve
                var nCode = (n.code || "");
                var tCode = (targetNode.code || "");
                var isDragonPath = (nCode.indexOf("_R") !== -1 || tCode.indexOf("_R") !== -1 || n.subtype === "U3" || targetNode.subtype === "U3" || nCode.indexOf("U3") !== -1 || tCode.indexOf("U3") !== -1 || nCode.indexOf("H2") !== -1 || tCode.indexOf("H2") !== -1);
                var isFestivalPath = (nCode.indexOf("SLAV") !== -1 || tCode.indexOf("SLAV") !== -1 || nCode.indexOf("_BR") !== -1 || tCode.indexOf("_BR") !== -1 || n.type === "FESTIVAL" || targetNode.type === "FESTIVAL");
                var isForestPath = (nCode.indexOf("_L") !== -1 || tCode.indexOf("_L") !== -1 || ((n.type === "VILLAGE" || targetNode.type === "VILLAGE") && (n.x < 500 && targetNode.x < 500)));

                var rVerge = "rgba(68,50,28,0.40)";
                var rShoulder = "rgba(44,30,16,0.58)";
                var rSurface = "rgba(188,154,102,0.88)";
                var rCobble = "rgba(238,218,176,0.36)";
                var rCobbleDash = "2.2,4.4";
                var rTrack = targets[t].isBranch ? targets[t].color : "rgba(248,230,172,0.36)";
                var rTrackOpacity = targets[t].isBranch ? "0.62" : "1";
                var rTrackDash = targets[t].isBranch ? "5,5" : "5,7";

                if (isDragonPath) {
                    rVerge = "rgba(44,20,14,0.48)";
                    rShoulder = "rgba(26,14,12,0.68)";
                    rSurface = "rgba(92,76,72,0.88)";
                    rCobble = "rgba(234,110,48,0.34)";
                    rCobbleDash = "2.6,4.0";
                    rTrack = targets[t].isBranch ? targets[t].color : "rgba(249,135,52,0.46)";
                    rTrackDash = "5,5";
                } else if (isFestivalPath) {
                    rVerge = "rgba(62,34,46,0.42)";
                    rShoulder = "rgba(38,18,28,0.60)";
                    rSurface = "rgba(176,124,132,0.85)";
                    rCobble = "rgba(246,204,196,0.40)";
                    rCobbleDash = "3.4,2.6";
                    rTrack = targets[t].isBranch ? targets[t].color : "rgba(251,210,108,0.44)";
                    rTrackDash = "5,6";
                } else if (isForestPath) {
                    rVerge = "rgba(28,48,24,0.44)";
                    rShoulder = "rgba(20,34,18,0.58)";
                    rSurface = "rgba(136,146,94,0.84)";
                    rCobble = "rgba(204,224,158,0.32)";
                    rCobbleDash = "2.0,4.8";
                    rTrack = targets[t].isBranch ? targets[t].color : "rgba(218,196,132,0.40)";
                    rTrackDash = "5,6";
                }

                // 0. Měkký vyšlapaný okraj cesty rozpuštěný do terénu
                var vergeFilterAttr = (gQuality === "high") ? ' filter="url(#roadVergeBlur)"' : '';
                out.push('  <path d="' + pthD + '" stroke="' + rVerge + '" stroke-width="20" stroke-linecap="round" fill="none"' + vergeFilterAttr + '/>');

                // 1. Zemitá krajnice / stín příkopu
                out.push('  <path d="' + pthD + '" stroke="' + rShoulder + '" stroke-width="13.5" stroke-linecap="round" fill="none"/>');

                // 2. Uježděný malovaný povrch cesty
                out.push('  <path d="' + pthD + '" stroke="' + rSurface + '" stroke-width="10.2" stroke-linecap="round" fill="none"/>');

                // 2b. Jemná textura štěrku / dlažebních kamenů
                out.push('  <path d="' + pthD + '" stroke="' + rCobble + '" stroke-width="7.8" stroke-dasharray="' + rCobbleDash + '" stroke-linecap="round" fill="none"/>');

                // 3. Slabá vodicí linka uprostřed (čitelnost tahu bez rušivé vektorovosti)
                var trackWidth = targets[t].isBranch ? '2.2' : '1.8';
                out.push('  <path d="' + pthD + '" stroke="' + rTrack + '" stroke-opacity="' + rTrackOpacity + '" stroke-width="' + trackWidth + '" stroke-dasharray="' + rTrackDash + '" stroke-linecap="round" fill="none"/>');

                // Bod uprostřed křivky (t = 0.5)

                var midCurveX = Math.round(0.25 * n.x + 0.5 * qx + 0.25 * targetNode.x);

                var midCurveY = Math.round(0.25 * n.y + 0.5 * qy + 0.25 * targetNode.y);

                var angle = Math.round(Math.atan2(targetNode.y - n.y, targetNode.x - n.x) * 180 / Math.PI);

                // Směrové šipky na běžných cestách

                if (!targets[t].isBranch && dist > 35) {

                    out.push('  <g transform="translate(' + midCurveX + ',' + midCurveY + ') rotate(' + angle + ')">');

                    out.push('    <polygon points="-4,-3 3,0 -4,3" fill="rgba(252,235,165,0.72)" stroke="rgba(92,56,22,0.75)" stroke-width="0.65"/>');

                    out.push('  </g>');

                }

                // Středověký dřevěný rozcestník (1–3 vs 4–6)

                if (targets[t].label) {

                    out.push('  <g class="prs-road-signpost" transform="translate(' + midCurveX + ',' + midCurveY + ')">');

                    out.push('    <rect x="-2.2" y="5.5" width="4.4" height="7" rx="1" fill="#472b14" stroke="#241409" stroke-width="0.6"/>');

                    var spShadowAttr = (gQuality === "high") ? ' style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.68));"' : '';
    out.push('    <path d="M -20,-8.5 L 17,-8.5 L 22,0 L 17,8.5 L -20,8.5 Q -21.5,0 -20,-8.5 Z" fill="url(#signpostWoodGrad)" stroke="#2b190b" stroke-width="1.2"' + spShadowAttr + '/>');

                    out.push('    <line x1="-16" y1="-4.5" x2="14" y2="-4.5" stroke="rgba(255,232,190,0.18)" stroke-width="0.7"/>');

                    out.push('    <circle cx="-16.5" cy="0" r="1.2" fill="#292524" stroke="rgba(255,240,210,0.35)" stroke-width="0.4"/>');

                    out.push('    <text x="1" y="3.4" text-anchor="middle" fill="' + targets[t].color + '" font-size="8.8" font-weight="bold" style="paint-order:stroke;stroke:#1a1008;stroke-width:2.2px;stroke-linejoin:round;">' + (targets[t].label === "1–3" ? '⚀⚁⚂ ' : '⚃⚄⚅ ') + targets[t].label + '</text>');

                    out.push('  </g>');

                }

            }

        }

        // 4b. Architektonické mosty přes řeku na křížení cest (vykresleny NAD cestou)
        if (this.state.board && this.state.board.bridges && this.state.board.bridges.length > 0) {
            out.push(this.renderBoardBridgesHTML(this.state.board));
        }

        // Zvýraznění poslední ušlé cesty aktivního hráče s organickým Bézierovým průhybem

        if (this.state.lastPath && this.state.lastPath.length > 1) {

            for (var pIdx = 0; pIdx < this.state.lastPath.length - 1; pIdx++) {

                var nA = nodes[this.state.lastPath[pIdx]];

                var nB = nodes[this.state.lastPath[pIdx + 1]];

                if (nA && nB) {

                    var ldx = nB.x - nA.x;

                    var ldy = nB.y - nA.y;

                    var ldist = Math.sqrt(ldx * ldx + ldy * ldy);

                    var lmx = (nA.x + nB.x) / 2;

                    var lmy = (nA.y + nB.y) / 2;

                    var lperpX = -ldy / (ldist || 1);

                    var lperpY = ldx / (ldist || 1);

                    var ltoCenterX = 700 - lmx;

                    var ltoCenterY = 430 - lmy;

                    var ldot = lperpX * ltoCenterX + lperpY * ltoCenterY;

                    var lbend = Math.min(10, Math.max(3, ldist * 0.065)) * (ldot >= 0 ? 1 : -1);

                    var lqx = Math.round((lmx + lperpX * lbend) * 10) / 10;

                    var lqy = Math.round((lmy + lperpY * lbend) * 10) / 10;

                    out.push('  <path d="M ' + nA.x + ' ' + nA.y + ' Q ' + lqx + ' ' + lqy + ' ' + nB.x + ' ' + nB.y + '" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round" fill="none" opacity="0.9"/>');

                }

            }

        }

        // 4b. Dynamické dekorace krajiny (stromy, hájky, skály, mlýny, chalupy, pastviny, stany)

        if (this.state.board && this.state.board.decorations && this.state.board.decorations.length > 0) {

            var hasTexturedTerrain = (gQuality !== "low") && (typeof this.renderBoardTerrainHTML === "function");
            out.push((hasTexturedTerrain && gQuality === "high") ? '  <g id="prs-decor-layer" filter="url(#decorColorHarmonize)">' : '  <g id="prs-decor-layer">');

            this._cachedRiverPoints = null;
            var decs = this.state.board.decorations;

            for (var d = 0; d < decs.length; d++) {

                var dec = decs[d];
                if (this.isDecorCollidingWithRivers(dec, this.state.board.rivers)) {
                    continue;
                }

                var cat = window.PRS_DECOR_CATALOG ? window.PRS_DECOR_CATALOG[dec.catalogId] : null;
                var catType = (cat && cat.category) || "vegetation";
                if (gQuality === "low" && catType === "vegetation" && (d % 2 === 1)) continue;
                var cushionGrad = "groundMossGrad";
                if (catType === "settlement" || catType === "agriculture") cushionGrad = "groundEarthGrad";
                else if (catType === "terrain" || catType === "quest_lair" || catType === "civilization") cushionGrad = "groundStoneGrad";
                else if (catType === "water") cushionGrad = "groundWaterGrad";
                else if (catType === "magic") cushionGrad = "groundMagicGrad";

                var footY = Math.round(dec.h * 0.28);
                var cushRx = Math.round(dec.w * 0.48);
                var cushRy = Math.max(8, Math.round(dec.h * 0.21));
                var shadRx = Math.round(dec.w * 0.36);
                var shadRy = Math.max(5, Math.round(dec.h * 0.13));

                var rawDecorUrl = (this.graphicsConfig && this.graphicsConfig.decorBitmaps && this.graphicsConfig.decorBitmaps[dec.catalogId])
                    ? this.graphicsConfig.decorBitmaps[dec.catalogId]
                    : (cat && cat.img ? cat.img : "");
                var decorUrl = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(rawDecorUrl) : rawDecorUrl;
                var decorFlip = Boolean(dec.isFlipped || (window.PRS_isFlippedAssetUrl && window.PRS_isFlippedAssetUrl(rawDecorUrl)));

                if (decorUrl) {

                    var sc = dec.scale || 1;
                    var decFlipAttr = decorFlip ? ' transform="scale(-1, 1)"' : '';

                    out.push('    <g class="board-decor-item" data-catalog-id="' + dec.catalogId + '" transform="translate(' + dec.x + ',' + dec.y + ') scale(' + sc + ')" onclick="PRS_App.handleDecorClick(\'' + dec.catalogId + '\', ' + dec.x + ', ' + dec.y + ', event)" style="cursor:pointer;">');
                    var fFade = (cat && typeof cat.footFade === "number") ? cat.footFade : 0.25;
                    var sLen = (cat && typeof cat.shadowLen === "number") ? cat.shadowLen : 0.95;
                    if (hasTexturedTerrain) {
                        // Jednotný vržený stín ze slunce vlevo nahoře + kontaktní stín + měkké zapuštění podstavce do terénu
                        if (sLen > 0.25) {
                            var castRx = Math.round(dec.w * 0.38 * Math.min(1.4, Math.max(0.6, sLen)));
                            var castRy = Math.max(5, Math.round(dec.h * 0.14));
                            var castDx = Math.round(dec.w * 0.22 * sLen);
                            out.push('      <ellipse cx="0" cy="0" rx="' + castRx + '" ry="' + castRy + '" fill="url(#decorCastShadowGrad)" transform="translate(' + castDx + ',' + (footY + 3) + ') skewX(-28)" pointer-events="none"/>');
                        }
                        out.push('      <ellipse cx="0" cy="' + (footY + 1) + '" rx="' + Math.round(dec.w * 0.30) + '" ry="' + Math.max(4, Math.round(dec.h * 0.10)) + '" fill="url(#decorShadowGrad)" pointer-events="none"/>');
                        var fadeMaskName = (fFade >= 0.25) ? "decorFootFadeMask_strong" : (fFade >= 0.17 ? "decorFootFadeMask_soft" : (fFade > 0 ? "decorFootFadeMask_light" : ""));
                        var imgMaskAttr = (gQuality === "high" && fadeMaskName) ? (' mask="url(#' + fadeMaskName + ')"') : '';
                        out.push('      <image href="' + this.escapeHtml(decorUrl) + '" x="' + (-dec.w / 2) + '" y="' + (-dec.h / 2) + '" width="' + dec.w + '" height="' + dec.h + '" preserveAspectRatio="xMidYMid meet"' + imgMaskAttr + decFlipAttr + '/>');
                        out.push('    </g>');
                    } else {
                    if (gQuality === "high") {
                        out.push('      <ellipse cx="0" cy="' + footY + '" rx="' + cushRx + '" ry="' + cushRy + '" fill="url(#' + cushionGrad + ')" filter="url(#groundCushionBlur)" pointer-events="none"/>');
                    } else {
                        out.push('      <ellipse cx="0" cy="' + footY + '" rx="' + cushRx + '" ry="' + cushRy + '" fill="url(#' + cushionGrad + ')" pointer-events="none"/>');
                    }
                    out.push('      <ellipse cx="0" cy="' + (footY + 2) + '" rx="' + shadRx + '" ry="' + shadRy + '" fill="url(#decorShadowGrad)" pointer-events="none"/>');
                    out.push('      <image href="' + this.escapeHtml(decorUrl) + '" x="' + (-dec.w / 2) + '" y="' + (-dec.h / 2) + '" width="' + dec.w + '" height="' + dec.h + '" preserveAspectRatio="xMidYMid meet"' + decFlipAttr + '/>');
                    if (catType === "vegetation" || catType === "settlement" || catType === "agriculture") {
                        var tuftY = footY + Math.round(shadRy * 0.45);
                        var tuftX = Math.round(shadRx * 0.52);
                        out.push('      <path d="M ' + (-tuftX - 2) + ' ' + tuftY + ' L ' + (-tuftX - 4) + ' ' + (tuftY - 4.5) + ' M ' + (-tuftX) + ' ' + tuftY + ' L ' + (-tuftX) + ' ' + (tuftY - 5.5) + ' M ' + (tuftX - 1) + ' ' + (tuftY + 1) + ' L ' + (tuftX + 1) + ' ' + (tuftY - 4) + ' M ' + (tuftX + 1.5) + ' ' + (tuftY + 1) + ' L ' + (tuftX + 3.5) + ' ' + (tuftY - 3.5) + '" stroke="rgba(132,204,22,0.46)" stroke-width="1.15" stroke-linecap="round" pointer-events="none"/>');
                    }
                    out.push('    </g>');

                    }
                } else if (cat && cat.renderSVG) {

                    var sc = dec.scale || 1;

                    var scX = dec.isFlipped ? (-sc) : sc;
                    out.push('    <g class="board-decor-item" data-catalog-id="' + dec.catalogId + '" transform="translate(' + dec.x + ',' + dec.y + ') scale(' + sc + ')">');
                    if (hasTexturedTerrain) {
                        var sLenSvg = (cat && typeof cat.shadowLen === "number") ? cat.shadowLen : 0.95;
                        if (sLenSvg > 0.25) {
                            var castRxSvg = Math.round(dec.w * 0.38 * Math.min(1.4, Math.max(0.6, sLenSvg)));
                            var castRySvg = Math.max(5, Math.round(dec.h * 0.14));
                            var castDxSvg = Math.round(dec.w * 0.22 * sLenSvg);
                            out.push('      <ellipse cx="0" cy="0" rx="' + castRxSvg + '" ry="' + castRySvg + '" fill="url(#decorCastShadowGrad)" transform="translate(' + castDxSvg + ',' + (footY + 3) + ') skewX(-28)" pointer-events="none"/>');
                        }
                        out.push('      <ellipse cx="0" cy="' + (footY + 1) + '" rx="' + Math.round(dec.w * 0.30) + '" ry="' + Math.max(4, Math.round(dec.h * 0.10)) + '" fill="url(#decorShadowGrad)" pointer-events="none"/>');
                    } else {
                    if (gQuality === "high") {
                        out.push('      <ellipse cx="0" cy="' + footY + '" rx="' + cushRx + '" ry="' + cushRy + '" fill="url(#' + cushionGrad + ')" filter="url(#groundCushionBlur)" pointer-events="none"/>');
                    } else {
                        out.push('      <ellipse cx="0" cy="' + footY + '" rx="' + cushRx + '" ry="' + cushRy + '" fill="url(#' + cushionGrad + ')" pointer-events="none"/>');
                    }
                    out.push('      <ellipse cx="0" cy="' + (footY + 2) + '" rx="' + shadRx + '" ry="' + shadRy + '" fill="url(#decorShadowGrad)" pointer-events="none"/>');
                    }
                    out.push(dec.isFlipped ? ('      <g transform="scale(-1, 1)">' + cat.renderSVG() + '</g>') : cat.renderSVG());

                    out.push('    </g>');

                }

            }

            out.push('  </g>');

        }

        // 5. Tvarově odlišená herní políčka (erby, osmiúhelníky, kosočtverce, pečetě, stuhy zvířat a praporky)

        for (var j = 0; j < nodes.length; j++) {

            var nd = nodes[j];

            var fill = this.getNodeFillColor(nd);

            var stroke = "url(#goldRimGrad)";

            var strokeWidth = 2.0;

            if (nd.owner !== null && this.state.players[nd.owner]) {

                stroke = this.state.players[nd.owner].color;

                strokeWidth = 3.6;

            }

            var isMajor = (nd.type === "START" || nd.type === "FESTIVAL" || nd.type === "CASTLE" || (nd.type === "QUEST" && nd.subtype === "U3"));

            var r = isMajor ? 21 : 16.5;

            var bmpUrl = this.getTileBitmapUrl(nd);

            var shortCode = (nd.code && typeof nd.code === "string") ? nd.code.replace("BLD_", "").replace("SLAV_", "").replace("_OUT", "").replace("_BR1", "").replace("_BR2", "").replace("_R1", "").replace("_R2", "").replace("_L1", "") : (nd.name || nd.type || String(nd.id || ""));

            out.push('  <g class="board-node" style="cursor:pointer" onclick="PRS_App.handleNodeClick(' + nd.id + ')" onmouseenter="PRS_App.handleNodeMouseEnter(event, ' + nd.id + ')" onmouseleave="PRS_App.handleNodeMouseLeave()" onmousemove="PRS_App.handleNodeMouseMove(event)">');

            // Tvarová geometrie políčka (Silueta)

            out.push(this.renderNodeSilhouette(nd, r, fill, stroke, strokeWidth, isMajor, shortCode, bmpUrl));

            // Vizuální vývoj panství u vesnic (Úroveň 1: došková chalupa, Úroveň 2: kamenný statek, Úroveň 3: opevněná tvrz)

            if (nd.type === "VILLAGE") {

                var lvl = nd.villageLevel || 1;

                if (lvl === 1) {

                    out.push('    <polygon points="' + (nd.x - 14) + ',' + (nd.y - r - 1) + ' ' + nd.x + ',' + (nd.y - r - 12) + ' ' + (nd.x + 14) + ',' + (nd.y - r - 1) + '" fill="#b45309" stroke="#fcd34d" stroke-width="1.1"/>');

                } else if (lvl === 2) {

                    out.push('    <polygon points="' + (nd.x - 15) + ',' + (nd.y - r - 1) + ' ' + nd.x + ',' + (nd.y - r - 14) + ' ' + (nd.x + 15) + ',' + (nd.y - r - 1) + '" fill="#991b1b" stroke="#fef08a" stroke-width="1.2"/>');

                    out.push('    <rect x="' + (nd.x + 6) + '" y="' + (nd.y - r - 19) + '" width="3.5" height="6.5" fill="#57534e" stroke="#292524" stroke-width="0.6"/>');

                } else if (lvl >= 3) {

                    out.push('    <rect x="' + (nd.x - 14) + '" y="' + (nd.y - r - 15) + '" width="28" height="15" fill="#334155" stroke="#fbbf24" stroke-width="1.2"/>');

                    out.push('    <polygon points="' + (nd.x - 14) + ',' + (nd.y - r - 15) + ' ' + (nd.x - 10) + ',' + (nd.y - r - 19) + ' ' + (nd.x - 6) + ',' + (nd.y - r - 15) + ' ' + (nd.x - 2) + ',' + (nd.y - r - 19) + ' ' + (nd.x + 2) + ',' + (nd.y - r - 15) + ' ' + (nd.x + 6) + ',' + (nd.y - r - 19) + ' ' + (nd.x + 10) + ',' + (nd.y - r - 15) + ' ' + (nd.x + 14) + ',' + (nd.y - r - 19) + ' ' + (nd.x + 14) + ',' + (nd.y - r - 15) + '" fill="#cbd5e1"/>');

                }

                if (nd.owner !== null) {

                    var stars = "★".repeat(lvl);

                    out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r + 13) + ')">');

                    out.push('      <rect x="-16" y="-7" width="32" height="13" rx="4" fill="rgba(20,14,10,0.85)" stroke="#fbbf24" stroke-width="0.8"/>');

                    out.push('      <text x="0" y="3" text-anchor="middle" fill="#fbbf24" font-size="9.5" font-weight="bold">' + stars + '</text>');

                    out.push('    </g>');

                }

            }

            // Stráže u questových políček ve stylu HoMM

            if (nd.type === "QUEST") {

                var qGuardsU3 = ["assets/monsters/monster_chimera.webp", "assets/monsters/monster_manticore.webp", "assets/monsters/monster_rock_giant.webp"];

                var qGuardsU2 = ["assets/monsters/monster_troll.webp", "assets/monsters/monster_griffin.webp", "assets/monsters/monster_minotaur.webp", "assets/monsters/monster_black_knight.webp"];

                var qGuardsU1 = ["assets/monsters/monster_wolf_pack.webp", "assets/monsters/monster_boar.webp", "assets/monsters/monster_bear.webp"];

                var gPool = (nd.subtype === "U3") ? qGuardsU3 : ((nd.subtype === "U2") ? qGuardsU2 : qGuardsU1);

                var rawGuardUrl = gPool[Math.abs(nd.id || 0) % gPool.length];

                var guardUrl = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(rawGuardUrl) : rawGuardUrl;

                var guardSide = (nd.x > 700) ? -1 : 1;

                var gx = Math.max(26, Math.min(1374, Math.round(nd.x + guardSide * (r + 14))));

                var gy = Math.max(28, Math.min(832, Math.round(nd.y - 6)));

                var gw = (nd.subtype === "U3") ? 32 : 26;

                var gDelay = ((Math.abs(nd.id || 0) % 6) * 0.45).toFixed(2);

                out.push('    <g class="prs-quest-guard" transform="translate(' + gx + ',' + gy + ')" pointer-events="none">');

                out.push('      <ellipse cx="0" cy="11" rx="9" ry="3.4" fill="rgba(0,0,0,0.42)"/>');

                out.push('      <g class="prs-quest-guard-body" style="animation-delay:-' + gDelay + 's;">');

                out.push('        <image href="' + this.escapeHtml(guardUrl) + '" x="' + (-gw / 2) + '" y="' + (-gw / 2 - 2) + '" width="' + gw + '" height="' + gw + '" preserveAspectRatio="xMidYMid meet"/>');

                out.push('      </g>');

                out.push('    </g>');

            }

            // 3D Vlající praporek vlastnictví u obsazených políček v barvě daného hráče

            if (nd.owner !== null && this.state.players[nd.owner]) {

                var ownerP = this.state.players[nd.owner];

                var flagDelay = ((Math.abs(nd.id || 0) % 7) * 0.35).toFixed(2);

                out.push('    <g class="tile-ownership-flag" transform="translate(' + (nd.x + r - 3) + ',' + (nd.y - r - 8) + ')">');

                out.push('      <line x1="0" y1="-2" x2="0" y2="25" stroke="#fcd34d" stroke-width="2" stroke-linecap="round"/>');

                out.push('      <line x1="-0.8" y1="-2" x2="-0.8" y2="25" stroke="#78350f" stroke-width="0.8"/>');

                out.push('      <polygon points="0,-6 -2.5,-1 2.5,-1" fill="#fde047" stroke="#b45309" stroke-width="0.6"/>');

                out.push('      <g class="prs-flag-cloth" style="animation-delay:-' + flagDelay + 's;">');

                var flagShadowAttr = (gQuality === "high") ? ' style="filter:drop-shadow(0 3px 3px rgba(0,0,0,0.7));"' : '';
                out.push('        <path d="M 0 0 C 6 -3, 12 3, 19 0 L 15 7 L 19 14 C 12 11, 6 17, 0 14 Z" fill="' + ownerP.color + '" stroke="#ffffff" stroke-width="1.1"' + flagShadowAttr + '/>');

                out.push('        <path d="M 0 0 C 6 -3, 12 3, 19 0 L 15 3.5 L 0 3.5 Z" fill="rgba(255,255,255,0.25)"/>');

                out.push('        <text x="8" y="9.5" text-anchor="middle" fill="#ffffff" font-size="7.5" font-weight="bold" font-family="Cinzel, serif">' + (ownerP.index + 1) + '</text>');

                out.push('      </g>');

                out.push('    </g>');

            }

            out.push('  </g>');

        }

        if (typeof this.renderBoardAtmosphereHTML === "function") {

            out.push(this.renderBoardAtmosphereHTML(this.state.board));

        }

        return out.join("\n");

    },

    
    renderNodeSilhouette: function (nd, r, fill, stroke, strokeWidth, isMajor, shortCode, bmpUrl) {
        var out = [];

        // Volba přesného tvarového clip-pathu podle siluety uzlu
        var clipId = "clipNormalTile";
        if (nd.type === "START") {
            clipId = "clipShieldTile";
        } else if (nd.type === "FESTIVAL") {
            clipId = "clipHeartTile";
        } else if (nd.type === "CASTLE" || nd.type === "TOWN") {
            clipId = "clipOctagonTile";
        } else if (nd.type === "QUEST") {
            clipId = "clipStarTile";
        } else if (nd.type === "CHANCE" || nd.type === "JESTER" || nd.type === "TAX") {
            clipId = "clipHexTile";
        } else if (nd.type === "PRISON") {
            clipId = "clipSquareTile";
        } else if (nd.type === "HOSPITAL") {
            clipId = "clipHospitalTile";
        }

        // Taktická aura cílových uzlů podle aktivního scénáře
        if (this.state && this.state.config) {
            var curScn = this.state.config.scenario || "CLASSIC";
            var gQualNode = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
            var fireGlowAttr = (gQualNode === "high") ? ' filter="url(#dragonFireGlow)"' : '';
            var goldGlowAttr = (gQualNode === "high") ? ' filter="url(#goldAuraGlow)"' : '';
            if (curScn === "DRAGON" && nd.type === "QUEST" && nd.subtype === "U3") {
                out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 7) + '" fill="none" stroke="#ea580c" stroke-width="3" stroke-dasharray="4,3"' + fireGlowAttr + '><animate attributeName="stroke-width" values="2;4.5;2" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/></circle>');
            } else if (curScn === "TYCOON" && (nd.type === "TOWN" || nd.type === "CASTLE")) {
                out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 5.5) + '" fill="none" stroke="#facc15" stroke-width="2.5" stroke-dasharray="3,2"' + goldGlowAttr + '><animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite"/></circle>');
            }
        }

        var nodeGQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var majorGlowAttr = (nodeGQuality === "high") ? ' filter="url(#glowFilter)"' : '';

        if (nd.type === "START") {
            // Královský erbovní štít
            var startPth = 'M ' + (nd.x - 22) + ' ' + (nd.y - 20) + ' L ' + (nd.x + 22) + ' ' + (nd.y - 20) + ' L ' + (nd.x + 22) + ' ' + (nd.y + 4) + ' Q ' + (nd.x + 22) + ' ' + (nd.y + 24) + ' ' + nd.x + ' ' + (nd.y + 28) + ' Q ' + (nd.x - 22) + ' ' + (nd.y + 24) + ' ' + (nd.x - 22) + ' ' + (nd.y + 4) + ' Z';
            out.push('    <path d="' + startPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"' + majorGlowAttr + '/>');

        } else if (nd.type === "FESTIVAL") {
            // Zamilované srdcové turnajové pole
            var festPth = 'M ' + nd.x + ' ' + (nd.y + 20) + ' C ' + (nd.x - 25) + ' ' + (nd.y + 4) + ' ' + (nd.x - 24) + ' ' + (nd.y - 18) + ' ' + (nd.x - 10) + ' ' + (nd.y - 18) + ' C ' + (nd.x - 2) + ' ' + (nd.y - 18) + ' ' + nd.x + ' ' + (nd.y - 9) + ' ' + nd.x + ' ' + (nd.y - 8) + ' C ' + nd.x + ' ' + (nd.y - 9) + ' ' + (nd.x + 2) + ' ' + (nd.y - 18) + ' ' + (nd.x + 10) + ' ' + (nd.y - 18) + ' C ' + (nd.x + 24) + ' ' + (nd.y - 18) + ' ' + (nd.x + 25) + ' ' + (nd.y + 4) + ' ' + nd.x + ' ' + (nd.y + 20) + ' Z';
            out.push('    <path d="' + festPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"' + majorGlowAttr + '/>');

        } else if (nd.type === "CASTLE" || nd.type === "TOWN") {
            // Opevněný 8-úhelníkový hradní a městský polygon
            var octPts = [];
            var rad = (nd.type === "CASTLE") ? 22 : 18.5;
            for (var a = 0; a < 8; a++) {
                var ang = a * Math.PI / 4 + Math.PI / 8;
                octPts.push(Math.round(nd.x + Math.cos(ang) * rad) + ',' + Math.round(nd.y + Math.sin(ang) * rad));
            }
            var octGlowAttr = (nd.type === "CASTLE") ? majorGlowAttr : '';
            out.push('    <polygon points="' + octPts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"' + octGlowAttr + '/>');

        } else if (nd.type === "QUEST") {
            // Kosočtvercová 4-cípá rytířská hvězda
            var qRad = isMajor ? 24 : 19;
            var qPth = 'M ' + nd.x + ' ' + (nd.y - qRad - 3) + ' L ' + Math.round(nd.x + qRad * 0.6) + ' ' + Math.round(nd.y - qRad * 0.6) +
                       ' L ' + (nd.x + qRad + 3) + ' ' + nd.y + ' L ' + Math.round(nd.x + qRad * 0.6) + ' ' + Math.round(nd.y + qRad * 0.6) +
                       ' L ' + nd.x + ' ' + (nd.y + qRad + 3) + ' L ' + Math.round(nd.x - qRad * 0.6) + ' ' + Math.round(nd.y + qRad * 0.6) +
                       ' L ' + (nd.x - qRad - 3) + ' ' + nd.y + ' L ' + Math.round(nd.x - qRad * 0.6) + ' ' + Math.round(nd.y - qRad * 0.6) + ' Z';
            out.push('    <path d="' + qPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');

        } else if (nd.type === "ANIMAL") {
            // Medailon s barevnou závěsnou stuhou chovné sady (všech 14 heraldických barev)
            var ribbonColors = {
                1: "#2563eb", 2: "#059669", 3: "#d97706", 4: "#7c3aed",
                5: "#dc2626", 6: "#0891b2", 7: "#ea580c", 8: "#4f46e5",
                9: "#16a34a", 10: "#db2777", 11: "#ca8a04", 12: "#0d9488",
                13: "#9333ea", 14: "#475569"
            };
            var setNum = nd.setId || (nd.code && nd.code.match(/\d+/) ? nd.code.match(/\d+/)[0] : 1);
            var rColor = ribbonColors[setNum] || "#2563eb";

            // Indikátor zkompletované sady 3/3 (zlatá koruna) nebo pulz pro aktivního hráče (má 2/3)
            var activePlayer = (this.state.players && this.state.players[this.state.currentPlayerIndex]) ? this.state.players[this.state.currentPlayerIndex] : null;
            var animalSetOwners = {};
            if (this.state.board && this.state.board.nodes) {
                for (var an = 0; an < this.state.board.nodes.length; an++) {
                    var aNode = this.state.board.nodes[an];
                    if (aNode.type === "ANIMAL" && (aNode.setId == setNum || (aNode.code && aNode.code.match(/\d+/) && aNode.code.match(/\d+/)[0] == setNum))) {
                        if (aNode.owner !== null && aNode.owner !== undefined) {
                            animalSetOwners[aNode.owner] = (animalSetOwners[aNode.owner] || 0) + 1;
                        }
                    }
                }
            }
            var completedOwner = null;
            for (var pKey in animalSetOwners) {
                if (animalSetOwners[pKey] >= 3) { completedOwner = pKey; break; }
            }
            if (completedOwner === null && activePlayer && animalSetOwners[activePlayer.index] === 2 && nd.owner !== activePlayer.index) {
                out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 4) + '" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-dasharray="3,2"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite"/></circle>');
            }

            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');

        } else if (nd.type === "MASTER") {
            // Speciální ctnostní medailon Mistra s barevným prstencem
            var skill = nd.skill || "any";
            var mColor = "#8b5cf6";
            if (skill === "boj") { mColor = "#ef4444"; }
            else if (skill === "jizda") { mColor = "#f59e0b"; }
            else if (skill === "tanec") { mColor = "#d946ef"; }
            else if (skill === "charisma") { mColor = "#06b6d4"; }

            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');
            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 3.2) + '" fill="none" stroke="' + mColor + '" stroke-width="2.2" stroke-dasharray="4,2"/>');

        } else if (nd.type === "CHANCE" || nd.type === "JESTER" || nd.type === "TAX") {
            // Šestiúhelníková vosková pečeť
            var hexPts = [];
            var hexRad = 17.5;
            for (var ha = 0; ha < 6; ha++) {
                var hang = ha * Math.PI / 3;
                hexPts.push(Math.round(nd.x + Math.cos(hang) * hexRad) + ',' + Math.round(nd.y + Math.sin(hang) * hexRad));
            }
            out.push('    <polygon points="' + hexPts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');

        } else if (nd.type === "PRISON") {
            // Okovaný čtverec šatlavy
            out.push('    <rect x="' + (nd.x - 16) + '" y="' + (nd.y - 16) + '" width="32" height="32" rx="4" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');

        } else if (nd.type === "HOSPITAL") {
            // Křižácký erb špitálu
            var hospPth = 'M ' + (nd.x - 16) + ' ' + (nd.y - 16) + ' L ' + (nd.x + 16) + ' ' + (nd.y - 16) + ' L ' + (nd.x + 16) + ' ' + (nd.y + 2) + ' Q ' + (nd.x + 16) + ' ' + (nd.y + 18) + ' ' + nd.x + ' ' + (nd.y + 22) + ' Q ' + (nd.x - 16) + ' ' + (nd.y + 18) + ' ' + (nd.x - 16) + ' ' + (nd.y + 2) + ' Z';
            out.push('    <path d="' + hospPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');

        } else {
            // Standardní kruhový medailon
            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '"/>');
        }

        // Vložení bitmapy nebo procedurální heraldické kresby
        if (bmpUrl) {
            var dSize = r * 2 - 2;
            var flipTile = (typeof this.shouldFlipTileBitmap === "function") ? this.shouldFlipTileBitmap(nd) : false;
            if (flipTile) {
                out.push('    <g transform="translate(' + nd.x + ',' + nd.y + ') scale(-1, 1)">');
                out.push('      <image href="' + this.escapeHtml(bmpUrl) + '" x="' + (-dSize / 2) + '" y="' + (-dSize / 2) + '" width="' + dSize + '" height="' + dSize + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clipId + ')" />');
                out.push('    </g>');
            } else {
                out.push('    <image href="' + this.escapeHtml(bmpUrl) + '" x="' + (nd.x - dSize / 2) + '" y="' + (nd.y - dSize / 2) + '" width="' + dSize + '" height="' + dSize + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clipId + ')" />');
            }

            // 3D Medailonový reliéf přes bitmapu (korálkový lem, vnitřní stín a konvexní skleněný odlesk)
            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r - 1.2) + '" fill="url(#tileInnerShadow)" pointer-events="none"/>');
            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r - 2) + '" fill="none" stroke="rgba(255,223,128,0.50)" stroke-width="0.9" stroke-dasharray="1.5,2" pointer-events="none"/>');
            out.push('    <path d="M ' + (nd.x - r + 4) + ' ' + (nd.y - 1) + ' A ' + (r - 4) + ' ' + (r - 4) + ' 0 0 1 ' + (nd.x + r - 4) + ' ' + (nd.y - 1) + ' A ' + (r - 4) + ' ' + (r * 0.42) + ' 0 0 0 ' + (nd.x - r + 4) + ' ' + (nd.y - 1) + ' Z" fill="url(#tileGlassGrad)" pointer-events="none"/>');

            out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r - 3) + ')">');
            out.push('      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#0f0d0a" stroke="rgba(212,175,55,0.7)" stroke-width="0.8"/>');
            out.push('      <text x="0" y="2.5" text-anchor="middle" fill="#f8fafc" font-size="7" font-weight="bold">' + this.escapeHtml(shortCode) + '</text>');
            out.push('    </g>');

        } else {
            out.push(this.renderProceduralTileGraphic(nd, r, fill, stroke, strokeWidth, isMajor, shortCode));
        }

        // Vrchní heraldické odznaky (nad bitmapou medailonku) pro Zvířata a Mistry
        if (nd.type === "ANIMAL") {
            out.push('    <g transform="translate(' + (nd.x + r - 3) + ',' + (nd.y - r + 3) + ')" pointer-events="none">');
            out.push('      <circle cx="0" cy="0" r="6.5" fill="' + rColor + '" stroke="#fef08a" stroke-width="0.9"/>');
            out.push('      <text x="0" y="2.3" text-anchor="middle" fill="#ffffff" font-size="6.5" font-weight="bold">' + setNum + '</text>');
            out.push('    </g>');
            if (completedOwner !== null) {
                var crownShadowAttr = (nodeGQuality === "high") ? ' filter="drop-shadow(0 1px 2px rgba(0,0,0,0.85))"' : '';
                out.push('    <g transform="translate(' + nd.x + ',' + (nd.y - r - 6) + ')" pointer-events="none"><text x="0" y="0" text-anchor="middle" font-size="9.5"' + crownShadowAttr + '>👑</text></g>');
            }
        } else if (nd.type === "MASTER") {
            var mSkill = nd.skill || "any";
            var mCol = "#8b5cf6";
            var mIcon = "🧙‍♂️";
            if (mSkill === "boj") { mCol = "#ef4444"; mIcon = "⚔️"; }
            else if (mSkill === "jizda") { mCol = "#f59e0b"; mIcon = "🏇"; }
            else if (mSkill === "tanec") { mCol = "#d946ef"; mIcon = "💃"; }
            else if (mSkill === "charisma") { mCol = "#06b6d4"; mIcon = "✨"; }

            var mTierVal = nd.masterTier || (this.state && this.state.board && this.state.board.masterTier) || 1;
            var mRoman = ["I", "II", "III", "IV"][Math.max(0, Math.min(3, mTierVal - 1))] || "I";

            out.push('    <g transform="translate(' + (nd.x + r - 3) + ',' + (nd.y - r + 3) + ')" pointer-events="none">');
            out.push('      <circle cx="0" cy="0" r="7" fill="#140f0c" stroke="' + mCol + '" stroke-width="1.2"/>');
            out.push('      <text x="0" y="3" text-anchor="middle" font-size="8">' + mIcon + '</text>');
            out.push('    </g>');
            out.push('    <g transform="translate(' + (nd.x - r + 3) + ',' + (nd.y - r + 3) + ')" pointer-events="none">');
            out.push('      <circle cx="0" cy="0" r="6.2" fill="#140f0c" stroke="#d4af37" stroke-width="0.9"/>');
            out.push('      <text x="0" y="2.2" text-anchor="middle" fill="#fef08a" font-size="6.2" font-weight="bold">' + mRoman + '</text>');
            out.push('    </g>');
        }

        return out.join("\n");
    },

    
    getNodeFillColor: function (node) {

        switch (node.type) {

            case "START": return "#7c2d12";

            case "ANIMAL":

                if (node.subtype === "horse") return "#422006";

                if (node.subtype === "dog") return "#14532d";

                return "#1e3a8a";

            case "VILLAGE": return "#365314";

            case "TOWN": return "#1d4ed8";

            case "CASTLE": return "#581c87";

            case "MASTER": return "#701a75";

            case "MERCHANT": return "#854d0e";

            case "TAX": return "#991b1b";

            case "JESTER": return "#4c1d95";

            case "BUILDING": return "#334155";

            case "QUEST": return (node.subtype === "U3") ? "#7f1d1d" : "#451a03";

            case "FESTIVAL": return "#9d174d";

            case "BONUS": return "#065f46";

            case "PRISON": return "#18181b";

            case "HOSPITAL": return "#0369a1";

            case "TAVERN": return "#78350f";

            case "CHANCE": return "#854d0e";

            default: return "#27272a";

        }

    },

    
    renderProceduralTileGraphic: function (nd, r, fill, stroke, strokeWidth, isMajor, shortCode) {

        var out = [];

        // 1. Vnější ražený lem s korálkovým ornamentem (reprezentace ražené mince / žetonu)

        out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r - 1.8) + '" fill="none" stroke="rgba(255,223,128,0.45)" stroke-width="0.9" stroke-dasharray="1.5,2"/>');

        // 2. Vnitřní vybrání s mírným stínem pro 3D reliéf

        out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r - 3.2) + '" fill="rgba(0,0,0,0.18)" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>');

        // 3. 3D konvexní odlesk světla na horní polovině medailonu

        out.push('    <path d="M ' + (nd.x - r + 4.5) + ' ' + (nd.y - 1) + ' A ' + (r - 4.5) + ' ' + (r - 4.5) + ' 0 0 1 ' + (nd.x + r - 4.5) + ' ' + (nd.y - 1) + ' A ' + (r - 4.5) + ' ' + (r * 0.42) + ' 0 0 0 ' + (nd.x - r + 4.5) + ' ' + (nd.y - 1) + ' Z" fill="rgba(255,255,255,0.14)"/>');

        // 4. Specifická vektorová grafika podle typu a podtypu políčka

        if (nd.type === "START") {

            // Královská koruna a zlatý sluneční kotouč

            out.push('    <path d="M ' + (nd.x - 7.5) + ' ' + (nd.y + 4) + ' L ' + (nd.x - 8.5) + ' ' + (nd.y - 3) + ' L ' + (nd.x - 4) + ' ' + (nd.y) + ' L ' + nd.x + ' ' + (nd.y - 5.5) + ' L ' + (nd.x + 4) + ' ' + (nd.y) + ' L ' + (nd.x + 8.5) + ' ' + (nd.y - 3) + ' L ' + (nd.x + 7.5) + ' ' + (nd.y + 4) + ' Z" fill="#fbbf24" stroke="#d97706" stroke-width="0.8"/>');

            out.push('    <circle cx="' + (nd.x - 8.5) + '" cy="' + (nd.y - 3.8) + '" r="1" fill="#fff"/>');

            out.push('    <circle cx="' + nd.x + '" cy="' + (nd.y - 6.2) + '" r="1.3" fill="#ef4444"/>');

            out.push('    <circle cx="' + (nd.x + 8.5) + '" cy="' + (nd.y - 3.8) + '" r="1" fill="#fff"/>');

        } else if (nd.type === "VILLAGE") {

            // Hrázděný středověký domeček s komínem a oknem

            out.push('    <polygon points="' + (nd.x - 8.5) + ',' + (nd.y + 1) + ' ' + nd.x + ',' + (nd.y - 7.5) + ' ' + (nd.x + 8.5) + ',' + (nd.y + 1) + '" fill="#b45309" stroke="#fcd34d" stroke-width="0.8"/>');

            out.push('    <rect x="' + (nd.x - 7) + '" y="' + (nd.y + 1) + '" width="14" height="6" fill="#78350f" stroke="#f59e0b" stroke-width="0.6"/>');

            out.push('    <rect x="' + (nd.x - 2) + '" y="' + (nd.y + 2.5) + '" width="4" height="4.5" fill="#fef08a"/>');

            out.push('    <rect x="' + (nd.x + 3.5) + '" y="' + (nd.y - 6.5) + '" width="2.5" height="3.5" fill="#57534e"/>');

        } else if (nd.type === "TOWN") {

            // Kamenná opevněná brána se dvěma cimbuřími věžemi

            out.push('    <rect x="' + (nd.x - 8.5) + '" y="' + (nd.y - 5.5) + '" width="5" height="11.5" fill="#475569" stroke="#cbd5e1" stroke-width="0.6"/>');

            out.push('    <rect x="' + (nd.x + 3.5) + '" y="' + (nd.y - 5.5) + '" width="5" height="11.5" fill="#475569" stroke="#cbd5e1" stroke-width="0.6"/>');

            out.push('    <rect x="' + (nd.x - 4.5) + '" y="' + (nd.y - 2) + '" width="9" height="8" fill="#334155" stroke="#cbd5e1" stroke-width="0.6"/>');

            out.push('    <path d="M ' + (nd.x - 2.5) + ' ' + (nd.y + 6) + ' L ' + (nd.x - 2.5) + ' ' + (nd.y + 2) + ' A 2.5 2.5 0 0 1 ' + (nd.x + 2.5) + ' ' + (nd.y + 2) + ' L ' + (nd.x + 2.5) + ' ' + (nd.y + 6) + ' Z" fill="#0f172a"/>');

        } else if (nd.type === "CASTLE") {

            // Třívěžový majestátní kamenný hrad s prapory

            out.push('    <rect x="' + (nd.x - 10) + '" y="' + (nd.y - 5) + '" width="4.5" height="11" fill="#64748b" stroke="#e2e8f0" stroke-width="0.6"/>');

            out.push('    <rect x="' + (nd.x + 5.5) + '" y="' + (nd.y - 5) + '" width="4.5" height="11" fill="#64748b" stroke="#e2e8f0" stroke-width="0.6"/>');

            out.push('    <rect x="' + (nd.x - 4) + '" y="' + (nd.y - 8.5) + '" width="8" height="14.5" fill="#475569" stroke="#fbbf24" stroke-width="0.8"/>');

            out.push('    <polygon points="' + nd.x + ',' + (nd.y - 12) + ' ' + (nd.x + 4.5) + ',' + (nd.y - 10) + ' ' + nd.x + ',' + (nd.y - 8.5) + '" fill="#ef4444"/>');

            out.push('    <path d="M ' + (nd.x - 2) + ' ' + (nd.y + 6) + ' L ' + (nd.x - 2) + ' ' + (nd.y + 2) + ' A 2 2 0 0 1 ' + (nd.x + 2) + ' ' + (nd.y + 2) + ' L ' + (nd.x + 2) + ' ' + (nd.y + 6) + ' Z" fill="#0f172a"/>');

        } else if (nd.type === "MERCHANT") {

            // Zlaté váhy obchodu a peněžní závaží

            out.push('    <line x1="' + nd.x + '" y1="' + (nd.y - 6.5) + '" x2="' + nd.x + '" y2="' + (nd.y + 5) + '" stroke="#fbbf24" stroke-width="1.3"/>');

            out.push('    <line x1="' + (nd.x - 6.5) + '" y1="' + (nd.y - 4.5) + '" x2="' + (nd.x + 6.5) + '" y2="' + (nd.y - 4.5) + '" stroke="#fbbf24" stroke-width="1.2"/>');

            out.push('    <path d="M ' + (nd.x - 6.5) + ' ' + (nd.y - 4.5) + ' L ' + (nd.x - 8.5) + ' ' + (nd.y - 0.5) + ' L ' + (nd.x - 4.5) + ' ' + (nd.y - 0.5) + ' Z" fill="#d97706" stroke="#fbbf24" stroke-width="0.5"/>');

            out.push('    <path d="M ' + (nd.x + 6.5) + ' ' + (nd.y - 4.5) + ' L ' + (nd.x + 4.5) + ' ' + (nd.y - 0.5) + ' L ' + (nd.x + 8.5) + ' ' + (nd.y - 0.5) + ' Z" fill="#d97706" stroke="#fbbf24" stroke-width="0.5"/>');

            out.push('    <circle cx="' + (nd.x - 1) + '" cy="' + (nd.y + 3.8) + '" r="1.3" fill="#fef08a"/>');

            out.push('    <circle cx="' + (nd.x + 1.8) + '" cy="' + (nd.y + 4.2) + '" r="1.3" fill="#fbbf24"/>');

        } else if (nd.type === "TAX") {

            // Královská truhlice s kováním

            out.push('    <rect x="' + (nd.x - 6.5) + '" y="' + (nd.y - 3.5) + '" width="13" height="8.5" rx="1.5" fill="#713f12" stroke="#eab308" stroke-width="0.8"/>');

            out.push('    <line x1="' + (nd.x - 6.5) + '" y1="' + (nd.y - 0.5) + '" x2="' + (nd.x + 6.5) + '" y2="' + (nd.y - 0.5) + '" stroke="#ca8a04" stroke-width="0.8"/>');

            out.push('    <circle cx="' + nd.x + '" cy="' + (nd.y + 1.2) + '" r="1.1" fill="#fde047"/>');

        } else if (nd.type === "JESTER") {

            // Dvourohý šaškovský čepec s rolničkami

            out.push('    <path d="M ' + (nd.x - 6.5) + ' ' + (nd.y + 2.5) + ' Q ' + (nd.x - 8.5) + ' ' + (nd.y - 5.5) + ' ' + (nd.x - 3.5) + ' ' + (nd.y - 2.5) + ' Q ' + nd.x + ' ' + (nd.y - 6.5) + ' ' + (nd.x + 3.5) + ' ' + (nd.y - 2.5) + ' Q ' + (nd.x + 8.5) + ' ' + (nd.y - 5.5) + ' ' + (nd.x + 6.5) + ' ' + (nd.y + 2.5) + ' Z" fill="#a855f7" stroke="#f472b6" stroke-width="0.8"/>');

            out.push('    <circle cx="' + (nd.x - 7.5) + '" cy="' + (nd.y - 4.5) + '" r="1.2" fill="#fbbf24"/>');

            out.push('    <circle cx="' + (nd.x + 7.5) + '" cy="' + (nd.y - 4.5) + '" r="1.2" fill="#fbbf24"/>');

            out.push('    <circle cx="' + nd.x + '" cy="' + (nd.y + 3.8) + '" r="2.2" fill="#f43f5e"/>');

        } else if (nd.type === "MASTER") {

            // Kniha cechu a zkřížený brk

            out.push('    <rect x="' + (nd.x - 6) + '" y="' + (nd.y - 4.5) + '" width="12" height="9" rx="1" fill="#4c1d95" stroke="#c084fc" stroke-width="0.8"/>');

            out.push('    <line x1="' + nd.x + '" y1="' + (nd.y - 4.5) + '" x2="' + nd.x + '" y2="' + (nd.y + 4.5) + '" stroke="#e9d5ff" stroke-width="0.6"/>');

            out.push('    <line x1="' + (nd.x - 3.5) + '" y1="' + (nd.y + 3.5) + '" x2="' + (nd.x + 5.5) + '" y2="' + (nd.y - 5.5) + '" stroke="#fbbf24" stroke-width="1.1" stroke-linecap="round"/>');

        } else if (nd.type === "CHANCE") {

            // Zářící osmicípá hvězda osudu

            out.push('    <path d="M ' + nd.x + ' ' + (nd.y - 6.5) + ' L ' + (nd.x + 2) + ' ' + (nd.y - 2) + ' L ' + (nd.x + 6.5) + ' ' + nd.y + ' L ' + (nd.x + 2) + ' ' + (nd.y + 2) + ' L ' + nd.x + ' ' + (nd.y + 6.5) + ' L ' + (nd.x - 2) + ' ' + (nd.y + 2) + ' L ' + (nd.x - 6.5) + ' ' + nd.y + ' L ' + (nd.x - 2) + ' ' + (nd.y - 2) + ' Z" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>');

        } else if (nd.type === "PRISON") {

            // Mříže vězení a okovy

            out.push('    <rect x="' + (nd.x - 6.5) + '" y="' + (nd.y - 5.5) + '" width="13" height="11" rx="1.5" fill="#18181b" stroke="#71717a" stroke-width="0.8"/>');

            out.push('    <line x1="' + (nd.x - 3.5) + '" y1="' + (nd.y - 5.5) + '" x2="' + (nd.x - 3.5) + '" y2="' + (nd.y + 5.5) + '" stroke="#d4d4d8" stroke-width="0.8"/>');

            out.push('    <line x1="' + nd.x + '" y1="' + (nd.y - 5.5) + '" x2="' + nd.x + '" y2="' + (nd.y + 5.5) + '" stroke="#d4d4d8" stroke-width="0.8"/>');

            out.push('    <line x1="' + (nd.x + 3.5) + '" y1="' + (nd.y - 5.5) + '" x2="' + (nd.x + 3.5) + '" y2="' + (nd.y + 5.5) + '" stroke="#d4d4d8" stroke-width="0.8"/>');

            out.push('    <line x1="' + (nd.x - 6.5) + '" y1="' + nd.y + '" x2="' + (nd.x + 6.5) + '" y2="' + nd.y + '" stroke="#d4d4d8" stroke-width="0.8"/>');

        } else if (nd.type === "HOSPITAL") {

            // Rytířský štít s červeným křížem

            out.push('    <path d="M ' + (nd.x - 5.5) + ' ' + (nd.y - 5.5) + ' L ' + (nd.x + 5.5) + ' ' + (nd.y - 5.5) + ' L ' + (nd.x + 5.5) + ' ' + (nd.y - 1) + ' Q ' + (nd.x + 5.5) + ' ' + (nd.y + 5.5) + ' ' + nd.x + ' ' + (nd.y + 7) + ' Q ' + (nd.x - 5.5) + ' ' + (nd.y + 5.5) + ' ' + (nd.x - 5.5) + ' ' + (nd.y - 1) + ' Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>');

            out.push('    <rect x="' + (nd.x - 1.1) + '" y="' + (nd.y - 4) + '" width="2.2" height="8" fill="#dc2626"/>');

            out.push('    <rect x="' + (nd.x - 4) + '" y="' + (nd.y - 1.1) + '" width="8" height="2.2" fill="#dc2626"/>');

        } else if (nd.type === "TAVERN") {

            // Dřevěný korbel s pěnou

            out.push('    <rect x="' + (nd.x - 4.5) + '" y="' + (nd.y - 2.5) + '" width="9" height="8" rx="1.2" fill="#92400e" stroke="#fcd34d" stroke-width="0.8"/>');

            out.push('    <path d="M ' + (nd.x + 4.5) + ' ' + (nd.y - 0.5) + ' C ' + (nd.x + 7) + ' ' + (nd.y - 0.5) + ' ' + (nd.x + 7) + ' ' + (nd.y + 3.5) + ' ' + (nd.x + 4.5) + ' ' + (nd.y + 3.5) + '" fill="none" stroke="#fcd34d" stroke-width="1"/>');

            out.push('    <ellipse cx="' + nd.x + '" cy="' + (nd.y - 2.5) + '" rx="4.5" ry="2" fill="#fef08a"/>');

        } else {

            // Výchozí heraldická ikona s vrženým stínem

            var procGQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
            var procIconShadow = (procGQuality === "high") ? ' style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.85));"' : '';
            out.push('    <text x="' + nd.x + '" y="' + (nd.y - 0.5) + '" text-anchor="middle" font-size="' + (isMajor ? '14' : '11.5') + '"' + procIconShadow + '>' + nd.icon + '</text>');

        }

        // 5. Elegantní štítek s kódem políčka (černý pergamen se zlatým lemem pro perfektní čitelnost)

        out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r - 3) + ')">');

        out.push('      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#0f0d0a" stroke="rgba(212,175,55,0.7)" stroke-width="0.8"/>');

        out.push('      <text x="0" y="2.5" text-anchor="middle" fill="#f8fafc" font-size="7" font-weight="bold">' + this.escapeHtml(shortCode) + '</text>');

        out.push('    </g>');

        return out.join("\n");

    }
    });
})();
