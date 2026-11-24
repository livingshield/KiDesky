// ============================================================================
// KiDesky: Princeznino srdce - Říční systémy, meandry, ostrovy, slepá ramena, delty a mosty
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    // ========================================================================
    // ŘEKA 2.0 - proměnlivá šířka toku, ručně kreslený břeh, pergamenový styl,
    // pramen, vegetace u břehu (rákosí, vrby, kameny)
    // ========================================================================
    sampleRiverPath: function (d, step) {
        try {
            var svg = document.getElementById("prs-board-svg") || (document.querySelector && document.querySelector("svg"));
            var p = (document.createElementNS && document.createElementNS("http://www.w3.org/2000/svg", "path"));
            if (p && typeof p.getTotalLength === "function") {
                p.setAttribute("d", d);
                var attached = false;
                if (svg && svg.appendChild) {
                    p.style.display = "none";
                    svg.appendChild(p);
                    attached = true;
                }
                var len = p.getTotalLength();
                if (len > 20) {
                    var n = Math.max(14, Math.ceil(len / step));
                    var pts = [], i;
                    for (i = 0; i <= n; i++) {
                        var pt = p.getPointAtLength(len * i / n);
                        pts.push({ x: pt.x, y: pt.y, t: i / n, s: len * i / n });
                    }
                    if (attached && p.parentNode) p.parentNode.removeChild(p);
                    for (i = 0; i <= n; i++) {
                        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
                        var dx = b.x - a.x, dy = b.y - a.y;
                        var l = Math.sqrt(dx * dx + dy * dy) || 1;
                        pts[i].tx = dx / l; pts[i].ty = dy / l;
                        pts[i].nx = -dy / l; pts[i].ny = dx / l;
                    }
                    for (i = 0; i <= n; i++) {
                        var a2 = pts[Math.max(0, i - 3)], b2 = pts[Math.min(n, i + 3)];
                        var cross = a2.tx * b2.ty - a2.ty * b2.tx;
                        pts[i].curv = Math.max(-1, Math.min(1, cross * 2.2));
                    }
                    return { pts: pts, len: len };
                }
                if (attached && p.parentNode) p.parentNode.removeChild(p);
            }
        } catch (e) { }

        // Analytický fallback (pro případ, že prohlížeč ještě nemá vložené SVG nebo pro testovací běh)
        var sRPS = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.sampleRiverPathSimple) ||
                   (window.PRS_BoardBuilder && window.PRS_BoardBuilder.sampleRiverPathSimple);
        if (sRPS) {
            var rawPts = sRPS(d);
            if (rawPts && rawPts.length > 5) {
                var totalLen = 0;
                var cumulative = [0];
                for (var ci = 1; ci < rawPts.length; ci++) {
                    var cdx = rawPts[ci].x - rawPts[ci - 1].x;
                    var cdy = rawPts[ci].y - rawPts[ci - 1].y;
                    totalLen += Math.sqrt(cdx * cdx + cdy * cdy);
                    cumulative.push(totalLen);
                }
                var ptsArr = [];
                for (var pi = 0; pi < rawPts.length; pi++) {
                    var frac = (totalLen > 0) ? (cumulative[pi] / totalLen) : (pi / (rawPts.length - 1));
                    ptsArr.push({
                        x: rawPts[pi].x,
                        y: rawPts[pi].y,
                        t: frac,
                        s: cumulative[pi]
                    });
                }
                var nPts = ptsArr.length;
                for (var ni = 0; ni < nPts; ni++) {
                    var pA = ptsArr[Math.max(0, ni - 1)], pB = ptsArr[Math.min(nPts - 1, ni + 1)];
                    var dX = pB.x - pA.x, dY = pB.y - pA.y;
                    var distL = Math.sqrt(dX * dX + dY * dY) || 1;
                    ptsArr[ni].tx = dX / distL; ptsArr[ni].ty = dY / distL;
                    ptsArr[ni].nx = -dY / distL; ptsArr[ni].ny = dX / distL;
                }
                for (var ni2 = 0; ni2 < nPts; ni2++) {
                    var pA2 = ptsArr[Math.max(0, ni2 - 3)], pB2 = ptsArr[Math.min(nPts - 1, ni2 + 3)];
                    var crs = pA2.tx * pB2.ty - pA2.ty * pB2.tx;
                    ptsArr[ni2].curv = Math.max(-1, Math.min(1, crs * 2.2));
                }
                return { pts: ptsArr, len: totalLen };
            }
        }
        return null;
    },

    
    riverPolyPath: function (L, R) {
        function smooth(arr, first) {
            var s = first + " " + arr[0].x.toFixed(1) + " " + arr[0].y.toFixed(1);
            for (var i = 1; i < arr.length - 1; i++) {
                var mx = (arr[i].x + arr[i + 1].x) / 2, my = (arr[i].y + arr[i + 1].y) / 2;
                s += " Q " + arr[i].x.toFixed(1) + " " + arr[i].y.toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
            }
            var e = arr[arr.length - 1];
            return s + " L " + e.x.toFixed(1) + " " + e.y.toFixed(1);
        }
        var Rr = R.slice().reverse();
        return smooth(L, "M") + " " + smooth(Rr, "L") + " Z";
    },

    
    riverClosedPolygonPath: function (arr) {
        if (!arr || arr.length < 3) return "";
        var s = "M " + arr[0].x.toFixed(1) + " " + arr[0].y.toFixed(1);
        for (var i = 1; i < arr.length; i++) {
            var next = arr[(i + 1) % arr.length];
            var mx = (arr[i].x + next.x) / 2, my = (arr[i].y + next.y) / 2;
            s += " Q " + arr[i].x.toFixed(1) + " " + arr[i].y.toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
        }
        return s + " Z";
    },

    
    riverBankPath: function (arr) {
        if (!arr || arr.length === 0) return "";
        var s = "M " + arr[0].x.toFixed(1) + " " + arr[0].y.toFixed(1);
        for (var i = 1; i < arr.length - 1; i++) {
            var mx = (arr[i].x + arr[i + 1].x) / 2, my = (arr[i].y + arr[i + 1].y) / 2;
            s += " Q " + arr[i].x.toFixed(1) + " " + arr[i].y.toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
        }
        var e = arr[arr.length - 1];
        return s + " L " + e.x.toFixed(1) + " " + e.y.toFixed(1);
    },

    
    isDecorCollidingWithRivers: function (dec, rivers) {
        if (!dec || !rivers || rivers.length === 0) return false;
        if (!this._cachedRiverPoints) {
            var rpts = [];
            for (var r = 0; r < rivers.length; r++) {
                var riv = rivers[r];
                var rw = riv.width || 14;
                var smp = this.sampleRiverPath(riv.path, 10);
                if (smp && smp.pts) {
                    for (var p = 0; p < smp.pts.length; p++) {
                        rpts.push({ x: smp.pts[p].x, y: smp.pts[p].y, halfW: rw / 2 });
                    }
                }
            }
            this._cachedRiverPoints = rpts;
        }
        var rptsList = this._cachedRiverPoints;
        if (!rptsList || rptsList.length === 0) return false;
        var radius = dec.clearance || Math.max(dec.w || 50, dec.h || 50) * 0.35;
        var isWatermill = Boolean(dec.catalogId && dec.catalogId.indexOf("watermill") !== -1);
        var isBuilding = Boolean(dec.catalogId && !isWatermill && (
            dec.catalogId.indexOf("tower") !== -1 ||
            dec.catalogId.indexOf("castle") !== -1 ||
            dec.catalogId.indexOf("hut") !== -1 ||
            dec.catalogId.indexOf("mill") !== -1 ||
            dec.catalogId.indexOf("ruins") !== -1 ||
            dec.catalogId.indexOf("watchtower") !== -1
        ));
        var extraClear = isWatermill ? 8 : (isBuilding ? 28 : 14);
        for (var i = 0; i < rptsList.length; i++) {
            var rp = rptsList[i];
            var dx = rp.x - dec.x, dy = rp.y - dec.y;
            var safeDist = radius + rp.halfW + extraClear;
            if (dx * dx + dy * dy < safeDist * safeDist) {
                return true;
            }
        }
        return false;
    },

    
    // ========================================================================
    // ŽIVLOVÉ PALETY ŘEKY A VODNÍ SÍTĚ (VÝRAZNÉ, KONTRASTNÍ & SYTÉ)
    // ========================================================================
    RIVER_THEMES: {
        light: {
            waterGradient: [
                { offset: "0%", color: "#63a3a8" },
                { offset: "25%", color: "#3e8291" },
                { offset: "62%", color: "#265e75" },
                { offset: "100%", color: "#1a4259" }
            ],
            deepWaterColor: "rgba(12, 38, 56, 0.42)",
            meadowColor: "rgba(76, 112, 50, 0.28)",
            bankColor: "#c4a676",
            bankOpacity: 0.88,
            wetBankColor: "rgba(76, 58, 38, 0.44)",
            bankInkColor: "rgba(48, 34, 20, 0.56)",
            streamColor1: "rgba(236, 249, 252, 0.52)",
            streamColor2: "rgba(182, 224, 234, 0.36)",
            springColor: "#8ec3c8",
            bridgeStoneBody: "#78716c",
            bridgeStoneRoad: "#e7e5e4",
            bridgeArch: "#44403c"
        },
        fire: {
            waterGradient: [
                { offset: "0%", color: "#fde08a" },
                { offset: "22%", color: "#ea6a1a" },
                { offset: "58%", color: "#c84412" },
                { offset: "100%", color: "#6e1b14" }
            ],
            deepWaterColor: "rgba(254, 232, 130, 0.36)",
            meadowColor: "rgba(148, 48, 16, 0.30)",
            bankColor: "#2e2724",
            bankOpacity: 0.92,
            wetBankColor: "rgba(24, 14, 10, 0.64)",
            bankInkColor: "rgba(218, 96, 28, 0.72)",
            streamColor1: "rgba(254, 236, 148, 0.72)",
            streamColor2: "rgba(248, 138, 56, 0.52)",
            springColor: "#fef08a",
            bridgeStoneBody: "#1c1917",
            bridgeStoneRoad: "#44403c",
            bridgeArch: "#0c0a09"
        },
        water: {
            waterGradient: [
                { offset: "0%", color: "#7bcce0" },
                { offset: "28%", color: "#2995b8" },
                { offset: "65%", color: "#186b99" },
                { offset: "100%", color: "#163a6e" }
            ],
            deepWaterColor: "rgba(10, 36, 86, 0.44)",
            meadowColor: "rgba(30, 116, 128, 0.28)",
            bankColor: "#9ab8cf",
            bankOpacity: 0.82,
            wetBankColor: "rgba(28, 66, 94, 0.44)",
            bankInkColor: "rgba(18, 62, 92, 0.62)",
            streamColor1: "rgba(240, 250, 255, 0.65)",
            streamColor2: "rgba(180, 224, 248, 0.44)",
            springColor: "#a5f3fc",
            bridgeStoneBody: "#64748b",
            bridgeStoneRoad: "#cbd5e1",
            bridgeArch: "#334155"
        },
        earth: {
            waterGradient: [
                { offset: "0%", color: "#7dc7a8" },
                { offset: "28%", color: "#3a9c7a" },
                { offset: "65%", color: "#1b6e56" },
                { offset: "100%", color: "#144734" }
            ],
            deepWaterColor: "rgba(10, 42, 26, 0.42)",
            meadowColor: "rgba(52, 100, 38, 0.32)",
            bankColor: "#8b683b",
            bankOpacity: 0.86,
            wetBankColor: "rgba(42, 52, 28, 0.46)",
            bankInkColor: "rgba(36, 26, 14, 0.60)",
            streamColor1: "rgba(232, 250, 240, 0.52)",
            streamColor2: "rgba(176, 230, 200, 0.36)",
            springColor: "#6ee7b7",
            bridgeStoneBody: "#57534e",
            bridgeStoneRoad: "#a8a29e",
            bridgeArch: "#292524"
        },
        air: {
            waterGradient: [
                { offset: "0%", color: "#cbd5f5" },
                { offset: "30%", color: "#9eaee6" },
                { offset: "65%", color: "#6778c8" },
                { offset: "100%", color: "#3c4396" }
            ],
            deepWaterColor: "rgba(34, 30, 86, 0.38)",
            meadowColor: "rgba(96, 102, 186, 0.24)",
            bankColor: "#b6bede",
            bankOpacity: 0.80,
            wetBankColor: "rgba(66, 72, 124, 0.38)",
            bankInkColor: "rgba(48, 46, 108, 0.58)",
            streamColor1: "rgba(248, 250, 255, 0.68)",
            streamColor2: "rgba(216, 224, 250, 0.46)",
            springColor: "#e0e7ff",
            bridgeStoneBody: "#94a3b8",
            bridgeStoneRoad: "#e2e8f0",
            bridgeArch: "#64748b"
        }
    },

    
    renderBoardRiversHTML: function (board) {
        if (!board || !board.rivers || board.rivers.length === 0) return "";
        var out = [];
        var nodes = board.nodes || [];
        var bridges = board.bridges || [];
        var activeTheme = (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-theme")) ||
                          (typeof localStorage !== "undefined" && localStorage && localStorage.getItem("kidesky_element_theme")) || "light";
        var rTheme = this.RIVER_THEMES[activeTheme] || this.RIVER_THEMES.light;
        var gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var bankBlurAttr = (gQuality === "high") ? ' filter="url(#riverBankBlur)"' : '';
        var wobbleAttr = (gQuality === "high") ? ' filter="url(#riverWobble)"' : '';
        var softAttr = (gQuality === "high") ? ' filter="url(#riverSoft)"' : '';
        out.push('  <g id="prs-rivers-layer">');

        // 1. Vzorkování všech řek v království
        var sampledRivers = [];
        for (var r = 0; r < board.rivers.length; r++) {
            var riv = board.rivers[r];
            var isTrib = Boolean(riv.id === "tributary_river" || riv.isTributary || (board.rivers.length > 1 && r > 0 && riv.id !== "main_river" && riv.id !== "river_classic"));
            var rw = (riv.width && riv.width >= 28) ? riv.width : (isTrib ? 24 : 38);
            var smp = this.sampleRiverPath(riv.path, 6.5);
            if (!smp) continue;

            var pts = smp.pts, n = pts.length;
            var seedBase = Math.round(smp.len * 7.31 + pts[0].x * 3.7 + pts[0].y * 1.9);
            function ph(k) { var v = Math.sin(seedBase * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v)) * 6.2832; }
            var p1 = ph(1), p2 = ph(2), p3 = ph(3), p4 = ph(4), p5 = ph(5), p6 = ph(6);
            function noise(s, a, b) { return 0.5 * Math.sin(s / 41 + a) + 0.3 * Math.sin(s / 19 + b) + 0.2 * Math.sin(s / 9.3 + a + b); }

            var halfW = [];
            for (var i = 0; i < n; i++) {
                var t = pts[i].t;
                var prof = 0.56 + 0.82 * Math.pow(t, 0.85) + 0.32 * Math.pow(Math.max(0, (t - 0.75) / 0.25), 2);
                if (isTrib && t > 0.75) {
                    prof *= (1 + 0.40 * ((t - 0.75) / 0.25)); // plynulé trychtýřové rozšíření ústí přítoku
                }
                var w = rw * prof * (1 + 0.12 * noise(pts[i].s, p1, p2));
                halfW.push(Math.max(3.5, w / 2));
            }

            sampledRivers.push({
                riv: riv,
                idx: r,
                rw: rw,
                isTributary: isTrib,
                smp: smp,
                pts: pts,
                n: n,
                len: smp.len,
                seedBase: seedBase,
                p1: p1, p2: p2, p3: p3, p4: p4, p5: p5, p6: p6,
                halfW: halfW
            });
        }

        if (sampledRivers.length === 0) return "";

        // Pomocná funkce pro generování břehů
        function getSides(sData, extra, scale, bankJit) {
            var pts = sData.pts, n = sData.n, halfW = sData.halfW;
            var L = [], R = [];
            function noise(s, a, b) { return 0.5 * Math.sin(s / 41 + a) + 0.3 * Math.sin(s / 19 + b) + 0.2 * Math.sin(s / 9.3 + a + b); }

            for (var k = 0; k < n; k++) {
                var pt = pts[k];
                var t = pt.t;
                var extraFade = (sData.isTributary && extra > 0) ? Math.min(1, Math.max(0, (n - 1 - k) / 5)) : 1;
                var hw = halfW[k] * scale + extra * extraFade;

                if (sData.isTributary && scale < 0.8 && extra === 0 && t > 0.75) {
                    hw *= Math.max(0, 1 - (t - 0.75) / 0.25);
                }

                var shift = pt.curv * 0.16 * halfW[k];
                var jl = bankJit * noise(pt.s * 1.3, sData.p3, sData.p4);
                var jr = bankJit * noise(pt.s * 1.3, sData.p5, sData.p6);
                var lx = pt.x + pt.nx * (hw + shift + jl);
                var ly = pt.y + pt.ny * (hw + shift + jl);
                var rx = pt.x - pt.nx * (hw - shift + jr);
                var ry = pt.y - pt.ny * (hw - shift + jr);

                // Prodloužení začátku a konce za rám mapy pro plynulé plynutí bez useknutí
                if (k === 0 && (pt.y < 35 || pt.x < 35 || pt.x > 1365)) {
                    lx -= pt.tx * 25; ly -= pt.ty * 25;
                    rx -= pt.tx * 25; ry -= pt.ty * 25;
                }
                if (k === n - 1 && !sData.isTributary && (pt.y > 820 || pt.x < 35 || pt.x > 1365)) {
                    lx += pt.tx * 25; ly += pt.ty * 25;
                    rx += pt.tx * 25; ry += pt.ty * 25;
                }

                L.push({ x: lx, y: ly });
                R.push({ x: rx, y: ry });
            }
            return { L: L, R: R };
        }

        // Předpočítání břehů pro všechny řeky
        for (var sr = 0; sr < sampledRivers.length; sr++) {
            var s = sampledRivers[sr];
            s.sides1 = getSides(s, 22, 1, 1.4);   // Sytá vlhká louka podél toku
            s.sides2 = getSides(s, 8.5, 1, 1.7);  // Písčito-štěrkový břeh
            s.sides3 = getSides(s, 0, 1, 0.6);    // Hladina vody
            s.sides4 = getSides(s, 0, 0.52, 0);   // Hluboký střed toku
        }

        // 2. Detekce soutoku a vytvoření sjednocené sítě
        var confluences = [];
        for (var tIdx = 0; tIdx < sampledRivers.length; tIdx++) {
            var trib = sampledRivers[tIdx];
            if (!trib.isTributary) continue;
            var tLast = trib.pts[trib.n - 1];

            for (var mIdx = 0; mIdx < sampledRivers.length; mIdx++) {
                if (mIdx === tIdx) continue;
                var mRiver = sampledRivers[mIdx];
                var bestD2 = 999999, bestK = -1;
                for (var k = 0; k < mRiver.n; k++) {
                    var ddx = mRiver.pts[k].x - tLast.x, ddy = mRiver.pts[k].y - tLast.y;
                    var d2 = ddx * ddx + ddy * ddy;
                    if (d2 < bestD2) { bestD2 = d2; bestK = k; }
                }
                if (bestD2 < 85 * 85 && bestK !== -1) {
                    var mPt = mRiver.pts[bestK];
                    var tBefore = trib.pts[Math.max(0, trib.n - 4)];
                    // Spolehlivá geometrická detekce břehu podle vzdálenosti
                    var dL = (tBefore.x - mRiver.sides3.L[bestK].x) * (tBefore.x - mRiver.sides3.L[bestK].x) +
                             (tBefore.y - mRiver.sides3.L[bestK].y) * (tBefore.y - mRiver.sides3.L[bestK].y);
                    var dR = (tBefore.x - mRiver.sides3.R[bestK].x) * (tBefore.x - mRiver.sides3.R[bestK].x) +
                             (tBefore.y - mRiver.sides3.R[bestK].y) * (tBefore.y - mRiver.sides3.R[bestK].y);
                    var confSide = (dL < dR) ? "L" : "R";
                    var mouthRad = Math.max(trib.halfW[trib.n - 1] * 1.5 + 8, 26);

                    confluences.push({
                        tribIdx: tIdx,
                        mainIdx: mIdx,
                        mainConfIdx: bestK,
                        confSide: confSide,
                        mouthRadius: mouthRad,
                        mouthX: mPt.x,
                        mouthY: mPt.y
                    });
                }
            }
        }

        // 3. Společný master gradient pro vodní hladinu podle živlu
        out.push('    <defs>');
        out.push('      <linearGradient id="prsMasterRiverWater" gradientUnits="userSpaceOnUse" x1="1260" y1="20" x2="680" y2="880">');
        for (var gi = 0; gi < rTheme.waterGradient.length; gi++) {
            var stp = rTheme.waterGradient[gi];
            out.push('        <stop offset="' + stp.offset + '" stop-color="' + stp.color + '"/>');
        }
        out.push('      </linearGradient>');
        out.push('    </defs>');

        // Funkce pro sestavení sjednocené sítě dvou spojených řek
        var self = this;
        function buildUnifiedNetwork(conf, sidesKey) {
            var mRiver = sampledRivers[conf.mainIdx];
            var tRiver = sampledRivers[conf.tribIdx];
            var ptsM = mRiver.pts, nM = ptsM.length;
            var ptsT = tRiver.pts, nT = ptsT.length;
            var bestK = conf.mainConfIdx;
            var mouthLen = conf.mouthRadius;

            var mConfBank = (conf.confSide === "L" ? mRiver[sidesKey].L : mRiver[sidesKey].R).slice();
            var mOppBank  = (conf.confSide === "L" ? mRiver[sidesKey].R : mRiver[sidesKey].L).slice();

            var kUp = bestK, kDown = bestK;
            while (kUp > 1 && (ptsM[bestK].s - ptsM[kUp].s) < mouthLen) kUp--;
            while (kDown < nM - 2 && (ptsM[kDown].s - ptsM[bestK].s) < mouthLen) kDown++;

            var pMainUp = mConfBank[kUp];
            var pMainDown = mConfBank[kDown];

            var tL = tRiver[sidesKey].L.slice();
            var tR = tRiver[sidesKey].R.slice();

            var d1 = (tL[nT - 1].x - pMainUp.x) * (tL[nT - 1].x - pMainUp.x) + (tL[nT - 1].y - pMainUp.y) * (tL[nT - 1].y - pMainUp.y) +
                     (tR[nT - 1].x - pMainDown.x) * (tR[nT - 1].x - pMainDown.x) + (tR[nT - 1].y - pMainDown.y) * (tR[nT - 1].y - pMainDown.y);
            var d2 = (tR[nT - 1].x - pMainUp.x) * (tR[nT - 1].x - pMainUp.x) + (tR[nT - 1].y - pMainUp.y) * (tR[nT - 1].y - pMainUp.y) +
                     (tL[nT - 1].x - pMainDown.x) * (tL[nT - 1].x - pMainDown.x) + (tL[nT - 1].y - pMainDown.y) * (tL[nT - 1].y - pMainDown.y);

            var tUpBank = (d1 <= d2) ? tL : tR;
            var tDownBank = (d1 <= d2) ? tR : tL;

            // Hladký přechod břehů přítoku přímo do břehů hlavní řeky (žádná useknutá hrana!)
            var blendN = Math.min(5, nT - 1);
            for (var b = 0; b <= blendN; b++) {
                var frac = b / blendN;
                var idx = nT - 1 - (blendN - b);
                tUpBank[idx] = {
                    x: tUpBank[idx].x * (1 - frac) + pMainUp.x * frac,
                    y: tUpBank[idx].y * (1 - frac) + pMainUp.y * frac
                };
                tDownBank[idx] = {
                    x: tDownBank[idx].x * (1 - frac) + pMainDown.x * frac,
                    y: tDownBank[idx].y * (1 - frac) + pMainDown.y * frac
                };
            }

            // Sjednocený uzavřený polygon
            var poly = [];
            for (var i = 0; i < nM; i++) poly.push(mOppBank[i]);
            for (var i = nM - 1; i >= kDown; i--) poly.push(mConfBank[i]);
            for (var i = nT - 1; i >= 0; i--) poly.push(tDownBank[i]);
            for (var i = 0; i < nT; i++) poly.push(tUpBank[i]);
            for (var i = kUp; i >= 0; i--) poly.push(mConfBank[i]);

            // Hladké inkoustové břehy bez přerušení
            var bankOppArr = mOppBank.slice();
            var bankUpArr = [];
            for (var i = 0; i <= kUp; i++) bankUpArr.push(mConfBank[i]);
            for (var i = nT - 1; i >= 0; i--) bankUpArr.push(tUpBank[i]);

            var bankDownArr = [];
            for (var i = 0; i < nT; i++) bankDownArr.push(tDownBank[i]);
            for (var i = kDown; i < nM; i++) bankDownArr.push(mConfBank[i]);

            return {
                poly: poly,
                bankOpp: bankOppArr,
                bankUp: bankUpArr,
                bankDown: bankDownArr
            };
        }

        var activeConf = (confluences.length > 0) ? confluences[0] : null;

        // PASS 1: Vlhká louka kolem toku (měkký rozptyl podle živlu)
        if (activeConf) {
            var net1 = buildUnifiedNetwork(activeConf, "sides1");
            out.push('    <path d="' + this.riverClosedPolygonPath(net1.poly) + '" fill="' + rTheme.meadowColor + '"' + bankBlurAttr + '/>');
        } else {
            for (var i1 = 0; i1 < sampledRivers.length; i1++) {
                out.push('    <path d="' + this.riverPolyPath(sampledRivers[i1].sides1.L, sampledRivers[i1].sides1.R) + '" fill="' + rTheme.meadowColor + '"' + bankBlurAttr + '/>');
            }
        }

        // PASS 2: Písčito-bahnitý / čedičový břeh (pod vodou)
        if (activeConf) {
            var net2 = buildUnifiedNetwork(activeConf, "sides2");
            out.push('    <path d="' + this.riverClosedPolygonPath(net2.poly) + '" fill="' + rTheme.bankColor + '" opacity="' + rTheme.bankOpacity + '"' + wobbleAttr + '/>');
        } else {
            for (var i2 = 0; i2 < sampledRivers.length; i2++) {
                out.push('    <path d="' + this.riverPolyPath(sampledRivers[i2].sides2.L, sampledRivers[i2].sides2.R) + '" fill="' + rTheme.bankColor + '" opacity="' + rTheme.bankOpacity + '"' + wobbleAttr + '/>');
            }
        }

        // PASS 3: Hladina vody (jeden souvislý polygon se živlovým gradientem a vlhkým okrajem břehu)
        var wetRimColor = rTheme.wetBankColor || "rgba(68,52,36,0.42)";
        var net3 = activeConf ? buildUnifiedNetwork(activeConf, "sides3") : null;
        if (net3) {
            out.push('    <path d="' + this.riverClosedPolygonPath(net3.poly) + '" fill="url(#prsMasterRiverWater)" stroke="' + wetRimColor + '" stroke-width="3.4" stroke-linejoin="round"' + wobbleAttr + '/>');
        } else {
            for (var i3 = 0; i3 < sampledRivers.length; i3++) {
                var waterD = this.riverPolyPath(sampledRivers[i3].sides3.L, sampledRivers[i3].sides3.R);
                out.push('    <path d="' + waterD + '" fill="url(#prsMasterRiverWater)" stroke="' + wetRimColor + '" stroke-width="3.4" stroke-linejoin="round"' + wobbleAttr + '/>');
            }
        }

        // PASS 4: Hlubší střed toku (hloubkové stínování koryta)
        for (var i4 = 0; i4 < sampledRivers.length; i4++) {
            out.push('    <path d="' + this.riverPolyPath(sampledRivers[i4].sides4.L, sampledRivers[i4].sides4.R) + '" fill="' + rTheme.deepWaterColor + '"' + softAttr + '/>');
        }

        // PASS 4.5: Zelené ostrůvky v toku řeky
        out.push(this.renderRiverIslandsHTML(sampledRivers, board, rTheme, activeTheme, gQuality));

        // PASS 4.6: Jezírka v meandrech (mrtvá ramena)
        out.push(this.renderOxbowLakesHTML(sampledRivers, board, rTheme, activeTheme, gQuality));

        // PASS 4.7: Ústí v deltě (rozvětvená delta a naplavené ostrovy)
        out.push(this.renderRiverDeltaHTML(sampledRivers, board, rTheme, activeTheme, gQuality));

        // PASS 5: Inkoustové břehy řeky s přirozeným soutokovým rozvětvením
        if (net3) {
            out.push('    <path d="' + this.riverBankPath(net3.bankOpp) + '" fill="none" stroke="' + rTheme.bankInkColor + '" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"' + wobbleAttr + '/>');
            out.push('    <path d="' + this.riverBankPath(net3.bankUp) + '" fill="none" stroke="' + rTheme.bankInkColor + '" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"' + wobbleAttr + '/>');
            out.push('    <path d="' + this.riverBankPath(net3.bankDown) + '" fill="none" stroke="' + rTheme.bankInkColor + '" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"' + wobbleAttr + '/>');
        } else {
            for (var i5 = 0; i5 < sampledRivers.length; i5++) {
                var rivObj = sampledRivers[i5];
                out.push('    <path d="' + this.riverBankPath(rivObj.sides3.L) + '" fill="none" stroke="' + rTheme.bankInkColor + '" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"' + wobbleAttr + '/>');
                out.push('    <path d="' + this.riverBankPath(rivObj.sides3.R) + '" fill="none" stroke="' + rTheme.bankInkColor + '" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"' + wobbleAttr + '/>');
            }
        }

        // PASS 5.5: Soutokové náplavky a víry na soutocích přítoků
        var ink5 = rTheme.bankInkColor || "rgba(45,26,14,0.92)";
        for (var ci = 0; ci < confluences.length; ci++) {
            var cnf = confluences[ci];
            var mRiv = sampledRivers[cnf.mainIdx];
            var tRiv = sampledRivers[cnf.tribIdx];
            var cPoint = mRiv.pts[cnf.mainConfIdx];
            var tEnd = tRiv.pts[tRiv.n - 1];
            var tBeforeMouth = tRiv.pts[Math.max(0, tRiv.n - 4)];
            var sAngle = Math.atan2(tEnd.y - tBeforeMouth.y, tEnd.x - tBeforeMouth.x) * 180 / Math.PI;

            out.push('    <g class="river-confluence-detail" transform="translate(' + cnf.mouthX.toFixed(1) + ',' + cnf.mouthY.toFixed(1) + ')" pointer-events="none">');
            var sSide = (cnf.confSide === "L") ? -1 : 1;
            var spX = (cPoint.nx * sSide * 16).toFixed(1);
            var spY = (cPoint.ny * sSide * 16).toFixed(1);
            out.push('      <ellipse cx="' + spX + '" cy="' + spY + '" rx="12" ry="7" transform="rotate(' + (sAngle + 20) + ' ' + spX + ' ' + spY + ')" fill="' + rTheme.bankColor + '" stroke="' + ink5 + '" stroke-width="1.0"' + wobbleAttr + '/>');
            out.push('      <circle cx="' + (parseFloat(spX) + 2).toFixed(1) + '" cy="' + (parseFloat(spY) - 1).toFixed(1) + '" r="2.2" fill="#8d877d"/>');
            out.push('      <circle cx="' + (parseFloat(spX) - 3).toFixed(1) + '" cy="' + (parseFloat(spY) + 1).toFixed(1) + '" r="1.6" fill="#a8a29e"/>');
            out.push('      <path d="M -7 -3 Q 0 -7 7 -4 Q 10 2 4 7" fill="none" stroke="' + (rTheme.streamColor1 || "rgba(255,255,255,0.8)") + '" stroke-width="1.1" stroke-linecap="round" opacity="0.85"/>');
            out.push('    </g>');
        }

        // PASS 6: Organický proud vody (proudnice / meandry), pramen, pobřežní vegetace
        function hashVal(seed, k) { var v = Math.sin((seed + k) * 91.345) * 23421.631; return v - Math.floor(v); }

        for (var i6 = 0; i6 < sampledRivers.length; i6++) {
            var rData = sampledRivers[i6];
            var pts6 = rData.pts, n6 = rData.n, first6 = pts6[0], rw6 = rData.rw;

            // Plynulé podélné proudnice (streamlines) podél osy toku
            var streamPts1 = [], streamPts2 = [];
            for (var stIdx = 2; stIdx < n6 - 2; stIdx++) {
                var pst = pts6[stIdx];
                if (rData.isTributary && pst.t > 0.88) continue; // v ústí se proud vlije do hlavní řeky
                var wOff = Math.sin(pst.s * 0.05 + rData.p1) * rData.halfW[stIdx] * 0.35;
                streamPts1.push({
                    x: pst.x + pst.nx * (wOff - 2.5),
                    y: pst.y + pst.ny * (wOff - 2.5)
                });
                if (stIdx % 2 === 0) {
                    streamPts2.push({
                        x: pst.x - pst.nx * (wOff + 2.0),
                        y: pst.y - pst.ny * (wOff + 2.0)
                    });
                }
            }

            if (streamPts1.length > 3) {
                out.push('    <path class="prs-river-stream prs-river-stream-1" d="' + this.riverBankPath(streamPts1) + '" fill="none" stroke="' + rTheme.streamColor1 + '" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="38,24,68,32" pointer-events="none"/>');
            }
            if (streamPts2.length > 3) {
                out.push('    <path class="prs-river-stream prs-river-stream-2" d="' + this.riverBankPath(streamPts2) + '" fill="none" stroke="' + rTheme.streamColor2 + '" stroke-width="0.9" stroke-linecap="round" stroke-dasharray="24,35,48,28" pointer-events="none"/>');
            }

            // Horský pramen (pouze pokud začíná uvnitř mapy a není za rámem)
            if (first6.y > 40 && first6.x > 40 && first6.x < 1360) {
                out.push('    <ellipse cx="' + first6.x.toFixed(1) + '" cy="' + (first6.y + 2).toFixed(1) + '" rx="' + (rw6 * 0.72).toFixed(1) + '" ry="' + (rw6 * 0.50).toFixed(1) + '" fill="' + rTheme.springColor + '" stroke="' + rTheme.bankInkColor + '" stroke-width="1"' + wobbleAttr + '/>');
                var spr = [[-1.0, -0.2, 3.6], [0.9, -0.7, 3.0], [0.2, 0.9, 2.6], [-0.5, 0.8, 2.2]];
                for (var sp = 0; sp < spr.length; sp++) {
                    var sx = first6.x + spr[sp][0] * rw6 * 0.75, sy = first6.y + 2 + spr[sp][1] * rw6 * 0.5;
                    var sprCol = (activeTheme === "fire") ? "#44403c" : "#8d877d";
                    out.push('    <ellipse cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" rx="' + spr[sp][2] + '" ry="' + (spr[sp][2] * 0.72).toFixed(1) + '" fill="' + sprCol + '" stroke="' + rTheme.bankInkColor + '" stroke-width="0.8"/>');
                }
            }

            if (gQuality !== "low") {
            // Pobřežní vegetace a kamínky
            var nextVeg = 18, side = 1;
            for (var vIdx = 0; vIdx < n6; vIdx++) {
                var pv = pts6[vIdx];
                if (pv.s < nextVeg || pv.t > 0.96) continue;
                nextVeg = pv.s + 26 + hashVal(rData.seedBase, vIdx + 100) * 30;
                side = -side;
                var dist = rData.halfW[vIdx] + 8 + hashVal(rData.seedBase, vIdx + 200) * 10;
                var vx = pv.x + pv.nx * dist * side, vy = pv.y + pv.ny * dist * side;
                if (vx < 34 || vx > 1366 || vy < 34 || vy > 826) continue;
                if (this.riverNearBridge(pv, bridges, 38)) continue;
                var clash = false;
                for (var q = 0; q < nodes.length; q++) {
                    var ddx = nodes[q].x - vx, ddy = nodes[q].y - vy;
                    if (ddx * ddx + ddy * ddy < 34 * 34) { clash = true; break; }
                }
                if (clash) continue;
                out.push(this.riverVegetationSVG(vx, vy, hashVal(rData.seedBase, vIdx + 300), activeTheme));
            }

            // Lekníny a jemné hladinové detaily u klidnějších břehů
            var nextDetail = 52, dSide = -1;
            for (var dIdx = 2; dIdx < n6 - 2; dIdx++) {
                var pd = pts6[dIdx];
                if (pd.s < nextDetail || pd.t > 0.90) continue;
                nextDetail = pd.s + 75 + hashVal(rData.seedBase, dIdx + 400) * 40;
                dSide = -dSide;
                if (rData.halfW[dIdx] < 10) continue;
                var dOff = rData.halfW[dIdx] * 0.52;
                var wx = pd.x + pd.nx * dOff * dSide, wy = pd.y + pd.ny * dOff * dSide;
                if (wx < 34 || wx > 1366 || wy < 34 || wy > 826) continue;
                if (this.riverNearBridge(pd, bridges, 42)) continue;
                var wClash = false;
                for (var wq = 0; wq < nodes.length; wq++) {
                    var wdx = nodes[wq].x - wx, wdy = nodes[wq].y - wy;
                    if (wdx * wdx + wdy * wdy < 32 * 32) { wClash = true; break; }
                }
                if (wClash) continue;
                out.push(this.riverWaterDetailSVG(wx, wy, hashVal(rData.seedBase, dIdx + 500), activeTheme));
            }
            }
        }
        out.push('  </g>');
        return out.join("\n");
    },

    
    renderRiverIslandsHTML: function (sampledRivers, board, rTheme, activeTheme, gQuality) {
        if (!sampledRivers || sampledRivers.length === 0) return "";
        if (!gQuality) gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var wobbleAttr = (gQuality === "high") ? ' filter="url(#riverWobble)"' : '';
        var softAttr = (gQuality === "high") ? ' filter="url(#riverSoft)"' : '';
        var out = [];
        var nodes = (board && board.nodes) || [];
        var bridges = (board && board.bridges) || [];
        var ink = rTheme.bankInkColor || "rgba(45,26,14,0.92)";

        for (var sr = 0; sr < sampledRivers.length; sr++) {
            var rivData = sampledRivers[sr];
            if (rivData.isTributary || rivData.len < 260) continue;

            // Robustní skenování celé trasy řeky pro nalezení nejvolnějších meandrů
            var candidates = [];
            var step = Math.max(3, Math.floor(rivData.n * 0.035));
            var startIdx = Math.floor(rivData.n * 0.16);
            var endIdx = Math.floor(rivData.n * 0.84);

            for (var idx = startIdx; idx <= endIdx; idx += step) {
                var pt = rivData.pts[idx];
                var hw = rivData.halfW[idx];
                if (hw < 10) continue;

                // Minimální vzdálenost k herním uzlům (poloměr uzlu je 22px, takže 36px dává 14px čistého odstupu)
                var minNodeDist = 9999;
                for (var q = 0; q < nodes.length; q++) {
                    var ndx = nodes[q].x - pt.x, ndy = nodes[q].y - pt.y;
                    var d = Math.sqrt(ndx * ndx + ndy * ndy);
                    if (d < minNodeDist) minNodeDist = d;
                }
                if (minNodeDist < 36) continue;

                // Minimální vzdálenost k mostům (most má délku cca 50px, odstup 40px je bezpečný)
                var minBridgeDist = 9999;
                for (var b = 0; b < bridges.length; b++) {
                    var bdx = bridges[b].x - pt.x, bdy = bridges[b].y - pt.y;
                    var bd = Math.sqrt(bdx * bdx + bdy * bdy);
                    if (bd < minBridgeDist) minBridgeDist = bd;
                }
                if (minBridgeDist < 42) continue;

                candidates.push({
                    idx: idx,
                    pt: pt,
                    hw: hw,
                    score: Math.min(minNodeDist, minBridgeDist)
                });
            }

            if (candidates.length === 0) continue;

            // Seřadíme kandidáty podle největšího volného prostoru
            candidates.sort(function (a, b) { return b.score - a.score; });

            // Vybereme až 2 nejlepší nekolidující ostrovy
            var chosen = [candidates[0]];
            if (rivData.len > 480) {
                for (var c = 1; c < candidates.length; c++) {
                    var cPt = candidates[c].pt;
                    var d0x = cPt.x - chosen[0].pt.x, d0y = cPt.y - chosen[0].pt.y;
                    if (Math.sqrt(d0x * d0x + d0y * d0y) >= 160) {
                        chosen.push(candidates[c]);
                        break;
                    }
                }
            }

            for (var ci = 0; ci < chosen.length; ci++) {
                var isl = chosen[ci];
                var pt = isl.pt;
                var hw = isl.hw;
                var angleDeg = Math.atan2(pt.ty, pt.tx) * 180 / Math.PI;

                // Zřetelná a majestátní velikost ostrova
                var islRx = Math.min(28, Math.max(16, hw * 0.74));
                var islRy = Math.min(13, Math.max(7, hw * 0.38));

                out.push('    <g class="river-island" transform="translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ') rotate(' + angleDeg.toFixed(1) + ')" pointer-events="none">');
                
                // 1. Měkký stín ostrova v korytu řeky
                out.push('      <ellipse cx="0" cy="3" rx="' + (islRx + 4).toFixed(1) + '" ry="' + (islRy + 3.5).toFixed(1) + '" fill="' + (rTheme.deepWaterColor || "rgba(0,0,0,0.30)") + '"' + softAttr + '/>');

                // 2. Bílá příbojová vlna lámající se o špici ostrova proti proudu
                var bowWaveW = (islRx + 7).toFixed(1);
                out.push('      <path d="M -' + bowWaveW + ' -4 Q -' + (islRx + 1).toFixed(1) + ' 0 -' + bowWaveW + ' 4" fill="none" stroke="' + (rTheme.streamColor1 || "rgba(255,255,255,0.85)") + '" stroke-width="1.6" stroke-linecap="round"/>');

                // 3. Písčito-štěrková pláž ostrova s texturovaným okrajem
                out.push('      <ellipse cx="0" cy="0" rx="' + islRx.toFixed(1) + '" ry="' + islRy.toFixed(1) + '" fill="' + (rTheme.bankColor || "#dfbe86") + '" stroke="' + ink + '" stroke-width="1.3"' + wobbleAttr + '/>');

                // 4. Vyvýšený zelený travnatý kopec / čedičový val
                var lawnFill = (activeTheme === "fire") ? "#451a03" : (activeTheme === "earth" ? "#166534" : (activeTheme === "water" ? "#0369a1" : (activeTheme === "air" ? "#6366f1" : "#5d8438")));
                out.push('      <ellipse cx="-1" cy="0" rx="' + (islRx * 0.70).toFixed(1) + '" ry="' + (islRy * 0.65).toFixed(1) + '" fill="' + lawnFill + '" opacity="0.92"/>');

                // 5. Přírodní dominanta ostrova (strom, balvany, květy)
                if (activeTheme === "fire") {
                    out.push('      <ellipse cx="2" cy="0" rx="4.5" ry="2.8" fill="#1c1917" stroke="rgba(249,115,22,0.9)" stroke-width="0.9"/>');
                    out.push('      <circle cx="-3" cy="-1" r="2.2" fill="#ea580c"/>');
                    out.push('      <circle cx="5" cy="1" r="1.5" fill="#fef08a"/>');
                } else if (activeTheme === "air") {
                    out.push('      <polygon points="0,-7 3,2 -3,2" fill="#e0e7ff" stroke="#4f46e5" stroke-width="0.7"/>');
                    out.push('      <circle cx="4" cy="0" r="2.5" fill="#c7d2fe"/>');
                } else {
                    // Majestátní smuteční vrba a balvan
                    out.push('      <circle cx="2" cy="-1.5" r="4.2" fill="#4d7c2a" stroke="' + ink + '" stroke-width="0.7"/>');
                    out.push('      <circle cx="4" cy="-2.5" r="2.8" fill="#65a30d"/>');
                    out.push('      <ellipse cx="-5" cy="1" rx="3.2" ry="2.0" fill="#8d877d" stroke="' + ink + '" stroke-width="0.6"/>');
                    out.push('      <path d="M 6 -1 L 10 -4 M 7 0 L 11 -2 M -7 2 L -10 4" stroke="#6b7d3a" stroke-width="1.2" stroke-linecap="round"/>');
                }

                // 6. Plynulé vlnové proudnice po obou stranách ostrova (wake waves)
                var sternWaveStart = (islRx + 2).toFixed(1);
                var sternWaveMid = (islRx + 10).toFixed(1);
                var sternWaveEnd = (islRx + 18).toFixed(1);
                out.push('      <path d="M ' + sternWaveStart + ' -4 Q ' + sternWaveMid + ' 0 ' + sternWaveEnd + ' 0 M ' + sternWaveStart + ' 4 Q ' + sternWaveMid + ' 0 ' + sternWaveEnd + ' 0" fill="none" stroke="' + (rTheme.streamColor2 || "rgba(255,255,255,0.6)") + '" stroke-width="1.2" stroke-linecap="round"/>');

                out.push('    </g>');
            }
        }
        return out.join("\n");
    },

    
    renderOxbowLakesHTML: function (sampledRivers, board, rTheme, activeTheme, gQuality) {
        if (!sampledRivers || sampledRivers.length === 0) return "";
        if (!gQuality) gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var bankBlurAttr = (gQuality === "high") ? ' filter="url(#riverBankBlur)"' : '';
        var wobbleAttr = (gQuality === "high") ? ' filter="url(#riverWobble)"' : '';
        var softAttr = (gQuality === "high") ? ' filter="url(#riverSoft)"' : '';
        var out = [];
        var nodes = (board && board.nodes) || [];
        var bridges = (board && board.bridges) || [];
        var ink = rTheme.bankInkColor || "rgba(45,26,14,0.92)";

        var lakes = (board && board.oxbowLakes && board.oxbowLakes.length > 0) ? board.oxbowLakes.slice() : [];

        if (lakes.length === 0) {
            for (var sr = 0; sr < sampledRivers.length; sr++) {
                var rivData = sampledRivers[sr];
                if (rivData.isTributary && rivData.len < 280) continue;
                var pts = rivData.pts;
                var candidates = [];

                for (var i = 12; i < pts.length - 18; i += 4) {
                    var pt = pts[i];
                    var nx = pt.nx, ny = pt.ny;
                    var sidesToTest = [-1, 1];

                    for (var sIdx = 0; sIdx < sidesToTest.length; sIdx++) {
                        var side = sidesToTest[sIdx];
                        for (var dist = 52; dist <= 78; dist += 13) {
                            var cx = pt.x + nx * side * dist;
                            var cy = pt.y + ny * side * dist;
                            if (cx < 65 || cx > 1335 || cy < 65 || cy > 815) continue;

                            var minNodeD = 9999;
                            for (var q = 0; q < nodes.length; q++) {
                                var nd = Math.hypot(nodes[q].x - cx, nodes[q].y - cy);
                                if (nd < minNodeD) minNodeD = nd;
                            }
                            if (minNodeD < 42) continue;

                            var minBridgeD = 9999;
                            for (var b = 0; b < bridges.length; b++) {
                                var bd = Math.hypot(bridges[b].x - cx, bridges[b].y - cy);
                                if (bd < minBridgeD) minBridgeD = bd;
                            }
                            if (minBridgeD < 50) continue;

                            var minRivD = 9999;
                            for (var rp = 0; rp < pts.length; rp += 2) {
                                var rd = Math.hypot(pts[rp].x - cx, pts[rp].y - cy);
                                if (rd < minRivD) minRivD = rd;
                            }
                            if (minRivD < 34 || minRivD > 92) continue;

                            candidates.push({
                                cx: cx,
                                cy: cy,
                                rx: Math.round(19 + Math.abs(pt.curv) * 12),
                                ry: Math.round(11 + Math.abs(pt.curv) * 6),
                                angle: Math.round(Math.atan2(pt.ty, pt.tx) * 180 / Math.PI + (side * 18)),
                                score: minNodeD + minBridgeD + (Math.abs(pt.curv) * 120),
                                seed: Math.round(cx * 3.1 + cy * 7.7)
                            });
                        }
                    }
                }

                if (candidates.length > 0) {
                    candidates.sort(function (a, b) { return b.score - a.score; });
                    var selected = [candidates[0]];
                    for (var c = 1; c < candidates.length && selected.length < 2; c++) {
                        var can = candidates[c];
                        var dPrev = Math.hypot(can.cx - selected[0].cx, can.cy - selected[0].cy);
                        if (dPrev >= 180) {
                            selected.push(can);
                        }
                    }
                    for (var s = 0; s < selected.length; s++) {
                        lakes.push(selected[s]);
                    }
                }
            }
        }

        if (lakes.length === 0) return "";

        for (var li = 0; li < lakes.length; li++) {
            var lk = lakes[li];
            var lcx = lk.cx, lcy = lk.cy;
            var lrx = lk.rx || 22, lry = lk.ry || 13;
            var rot = lk.angle || 0;

            out.push('    <g class="meander-oxbow-lake" transform="translate(' + lcx.toFixed(1) + ',' + lcy.toFixed(1) + ') rotate(' + rot + ')" pointer-events="none">');

            // 1. Vlhká louka / rašeliniště kolem jezírka
            out.push('      <ellipse cx="0" cy="0" rx="' + (lrx + 16).toFixed(1) + '" ry="' + (lry + 13).toFixed(1) + '" fill="' + rTheme.meadowColor + '"' + bankBlurAttr + ' opacity="0.85"/>');

            // 2. Písčito-štěrkový břeh s texturovaným vlněním
            out.push('      <ellipse cx="0" cy="0" rx="' + (lrx + 5).toFixed(1) + '" ry="' + (lry + 4).toFixed(1) + '" fill="' + rTheme.bankColor + '" opacity="' + rTheme.bankOpacity + '" stroke="' + ink + '" stroke-width="1.1"' + wobbleAttr + '/>');

            // 3. Klidná zrcadlová hladina jezírka
            out.push('      <ellipse cx="0" cy="0" rx="' + lrx.toFixed(1) + '" ry="' + lry.toFixed(1) + '" fill="url(#prsMasterRiverWater)"' + wobbleAttr + '/>');

            // 4. Hluboké jádro mrtvého ramene
            out.push('      <ellipse cx="-1" cy="0" rx="' + (lrx * 0.62).toFixed(1) + '" ry="' + (lry * 0.58).toFixed(1) + '" fill="' + rTheme.deepWaterColor + '"' + softAttr + '/>');

            // 5. Jemné kruhy čeření / odlesk hladiny
            out.push('      <ellipse cx="' + (lrx * 0.25).toFixed(1) + '" cy="' + (-lry * 0.2).toFixed(1) + '" rx="' + (lrx * 0.35).toFixed(1) + '" ry="' + (lry * 0.25).toFixed(1) + '" fill="none" stroke="' + (rTheme.streamColor1 || "rgba(255,255,255,0.7)") + '" stroke-width="0.9" stroke-dasharray="8,5" opacity="0.8"/>');
            out.push('      <circle cx="' + (-lrx * 0.3).toFixed(1) + '" cy="' + (lry * 0.15).toFixed(1) + '" r="2.2" fill="none" stroke="' + (rTheme.streamColor2 || "rgba(255,255,255,0.5)") + '" stroke-width="0.7"/>');

            // 6. Přírodní detaily podle vybraného živlu
            if (activeTheme === "fire") {
                out.push('      <ellipse cx="' + (-lrx * 0.45).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" rx="5.5" ry="3.2" fill="#1c1917" stroke="' + ink + '" stroke-width="0.7"/>');
                out.push('      <circle cx="' + (-lrx * 0.45).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" r="2.2" fill="#ea580c"/>');
                out.push('      <circle cx="' + (-lrx * 0.45).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" r="1.1" fill="#fef08a"/>');
                out.push('      <polygon points="' + (lrx * 0.4).toFixed(1) + ',' + (lry * 0.3).toFixed(1) + ' ' + (lrx * 0.52).toFixed(1) + ',' + (-lry * 0.6).toFixed(1) + ' ' + (lrx * 0.62).toFixed(1) + ',' + (lry * 0.35).toFixed(1) + '" fill="#f97316"/>');
                out.push('      <circle cx="' + (lrx * 0.52).toFixed(1) + '" cy="' + (-lry * 0.6).toFixed(1) + '" r="1.4" fill="#fef08a"/>');
            } else if (activeTheme === "water") {
                out.push('      <polygon points="' + (-lrx * 0.5).toFixed(1) + ',' + (-lry * 0.2).toFixed(1) + ' ' + (-lrx * 0.3).toFixed(1) + ',' + (-lry * 0.55).toFixed(1) + ' ' + (-lrx * 0.1).toFixed(1) + ',' + (-lry * 0.3).toFixed(1) + ' ' + (-lrx * 0.25).toFixed(1) + ',0" fill="#e0f2fe" stroke="#38bdf8" stroke-width="0.8"/>');
                out.push('      <circle cx="' + (-lrx * 0.3).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" r="1.2" fill="#fff"/>');
                out.push('      <polygon points="' + (lrx * 0.35).toFixed(1) + ',' + (lry * 0.2).toFixed(1) + ' ' + (lrx * 0.55).toFixed(1) + ',' + (-lry * 0.3).toFixed(1) + ' ' + (lrx * 0.68).toFixed(1) + ',' + (lry * 0.25).toFixed(1) + '" fill="#bae6fd" stroke="#0284c7" stroke-width="0.6"/>');
            } else if (activeTheme === "air") {
                out.push('      <polygon points="' + (-lrx * 0.35).toFixed(1) + ',' + (-lry * 0.6).toFixed(1) + ' ' + (-lrx * 0.25).toFixed(1) + ',' + (-lry * 0.35).toFixed(1) + ' ' + (-lrx * 0.35).toFixed(1) + ',-' + (-lry * 0.1).toFixed(1) + ' ' + (-lrx * 0.45).toFixed(1) + ',' + (-lry * 0.35).toFixed(1) + '" fill="#c084fc" stroke="#f3e8ff" stroke-width="0.7"/>');
                out.push('      <circle cx="' + (-lrx * 0.35).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" r="1.2" fill="#ffffff"/>');
                out.push('      <circle cx="' + (lrx * 0.45).toFixed(1) + '" cy="' + (lry * 0.15).toFixed(1) + '" r="2.0" fill="#ede9fe" opacity="0.8"/>');
            } else {
                out.push('      <ellipse cx="' + (-lrx * 0.45).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" rx="4.5" ry="3.0" fill="#2d6a4f" stroke="' + ink + '" stroke-width="0.5"/>');
                out.push('      <ellipse cx="' + (-lrx * 0.35).toFixed(1) + '" cy="' + (-lry * 0.55).toFixed(1) + '" rx="3.6" ry="2.4" fill="#40916c"/>');
                out.push('      <circle cx="' + (-lrx * 0.45).toFixed(1) + '" cy="' + (-lry * 0.35).toFixed(1) + '" r="1.3" fill="#fbcfe8"/>');

                out.push('      <path d="M ' + (lrx * 0.55).toFixed(1) + ' ' + (lry * 0.3).toFixed(1) + ' L ' + (lrx * 0.62).toFixed(1) + ' ' + (-lry * 0.7).toFixed(1) + ' M ' + (lrx * 0.70).toFixed(1) + ' ' + (lry * 0.4).toFixed(1) + ' L ' + (lrx * 0.78).toFixed(1) + ' ' + (-lry * 0.85).toFixed(1) + '" stroke="#606c38" stroke-width="1.3" stroke-linecap="round"/>');
                out.push('      <ellipse cx="' + (lrx * 0.62).toFixed(1) + '" cy="' + (-lry * 0.7).toFixed(1) + '" rx="1.2" ry="2.6" fill="#4a2810" stroke="' + ink + '" stroke-width="0.4"/>');
                out.push('      <ellipse cx="' + (lrx * 0.78).toFixed(1) + '" cy="' + (-lry * 0.85).toFixed(1) + '" rx="1.1" ry="2.3" fill="#4a2810" stroke="' + ink + '" stroke-width="0.4"/>');

                var boatX = (lrx * 0.30).toFixed(1);
                var boatY = (lry * 0.45).toFixed(1);
                out.push('      <g transform="translate(' + boatX + ',' + boatY + ') rotate(-22)">');
                out.push('        <ellipse cx="0" cy="1" rx="6.5" ry="2.6" fill="rgba(0,0,0,0.28)"/>');
                out.push('        <path d="M -6.5 0 Q 0 -2.4 6.5 0 Q 0 2.4 -6.5 0 Z" fill="#854d0e" stroke="' + ink + '" stroke-width="0.8"/>');
                out.push('        <line x1="-3" y1="0" x2="3" y2="0" stroke="#ca8a04" stroke-width="0.6"/>');
                out.push('        <line x1="0" y1="-2" x2="0" y2="2" stroke="#713f12" stroke-width="0.7"/>');
                out.push('        <circle cx="7.2" cy="0.6" r="0.9" fill="#78350f"/>');
                out.push('        <line x1="6" y1="0" x2="7.2" y2="0.6" stroke="#fef08a" stroke-width="0.5"/>');
                out.push('      </g>');
            }

            out.push('    </g>');
        }
        return out.join("\n");
    },

    
    renderRiverDeltaHTML: function (sampledRivers, board, rTheme, activeTheme, gQuality) {
        if (!sampledRivers || sampledRivers.length === 0) return "";
        if (!gQuality) gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var bankBlurAttr = (gQuality === "high") ? ' filter="url(#riverBankBlur)"' : '';
        var wobbleAttr = (gQuality === "high") ? ' filter="url(#riverWobble)"' : '';
        var out = [];
        var ink = rTheme.bankInkColor || "rgba(45,26,14,0.92)";

        for (var sr = 0; sr < sampledRivers.length; sr++) {
            var rData = sampledRivers[sr];
            if (rData.isTributary) continue;
            var pts = rData.pts, n = pts.length;
            if (n < 20) continue;

            var lastPt = pts[n - 1];
            var isDeltaZone = (lastPt.y >= 780 || lastPt.x <= 70 || lastPt.x >= 1330 || (board && board.riverMode === "delta"));
            if (!isDeltaZone) continue;

            var forkIdx = Math.max(0, Math.floor(n * 0.80));
            var forkPt = pts[forkIdx];
            var fHw = rData.halfW[forkIdx];

            var leftBranchEnd = {
                x: lastPt.x - (rData.rw * 1.8 + 26),
                y: Math.min(895, lastPt.y + 25)
            };
            var leftMid = {
                x: (forkPt.x + leftBranchEnd.x) / 2 - 12,
                y: (forkPt.y + leftBranchEnd.y) / 2
            };

            var rightBranchEnd = {
                x: lastPt.x + (rData.rw * 1.8 + 26),
                y: Math.min(895, lastPt.y + 25)
            };
            var rightMid = {
                x: (forkPt.x + rightBranchEnd.x) / 2 + 12,
                y: (forkPt.y + rightBranchEnd.y) / 2
            };

            var dLeft = "M " + forkPt.x.toFixed(1) + " " + forkPt.y.toFixed(1) +
                        " Q " + leftMid.x.toFixed(1) + " " + leftMid.y.toFixed(1) + " " + leftBranchEnd.x.toFixed(1) + " " + leftBranchEnd.y.toFixed(1);
            var dRight = "M " + forkPt.x.toFixed(1) + " " + forkPt.y.toFixed(1) +
                         " Q " + rightMid.x.toFixed(1) + " " + rightMid.y.toFixed(1) + " " + rightBranchEnd.x.toFixed(1) + " " + rightBranchEnd.y.toFixed(1);

            out.push('    <g class="river-delta-system" pointer-events="none">');

            var deltaFanPoly = [
                { x: forkPt.x - fHw * 1.6, y: forkPt.y },
                { x: leftBranchEnd.x - 28, y: leftBranchEnd.y },
                { x: rightBranchEnd.x + 28, y: rightBranchEnd.y },
                { x: forkPt.x + fHw * 1.6, y: forkPt.y }
            ];
            out.push('      <polygon points="' + deltaFanPoly.map(function(p){ return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '" fill="' + rTheme.meadowColor + '"' + bankBlurAttr + ' opacity="0.75"/>');

            out.push('      <path d="' + dLeft + '" fill="none" stroke="' + rTheme.bankColor + '" stroke-width="' + (rData.rw * 0.85).toFixed(1) + '" stroke-linecap="round" opacity="' + rTheme.bankOpacity + '"' + wobbleAttr + '/>');
            out.push('      <path d="' + dRight + '" fill="none" stroke="' + rTheme.bankColor + '" stroke-width="' + (rData.rw * 0.85).toFixed(1) + '" stroke-linecap="round" opacity="' + rTheme.bankOpacity + '"' + wobbleAttr + '/>');

            out.push('      <path d="' + dLeft + '" fill="none" stroke="url(#prsMasterRiverWater)" stroke-width="' + (rData.rw * 0.62).toFixed(1) + '" stroke-linecap="round"' + wobbleAttr + '/>');
            out.push('      <path d="' + dRight + '" fill="none" stroke="url(#prsMasterRiverWater)" stroke-width="' + (rData.rw * 0.62).toFixed(1) + '" stroke-linecap="round"' + wobbleAttr + '/>');

            out.push('      <path d="' + dLeft + '" fill="none" stroke="' + ink + '" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="14,2,26,4"/>');
            out.push('      <path d="' + dRight + '" fill="none" stroke="' + ink + '" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="14,2,26,4"/>');

            out.push('      <path d="' + dLeft + '" fill="none" stroke="' + (rTheme.streamColor1 || "rgba(255,255,255,0.7)") + '" stroke-width="1.0" stroke-linecap="round" stroke-dasharray="24,18,36,22"/>');
            out.push('      <path d="' + dRight + '" fill="none" stroke="' + (rTheme.streamColor1 || "rgba(255,255,255,0.7)") + '" stroke-width="1.0" stroke-linecap="round" stroke-dasharray="20,16,40,24"/>');

            var island1X = (forkPt.x + leftBranchEnd.x + lastPt.x) / 3;
            var island1Y = (forkPt.y + leftBranchEnd.y + lastPt.y) / 3;
            var island2X = (forkPt.x + rightBranchEnd.x + lastPt.x) / 3;
            var island2Y = (forkPt.y + rightBranchEnd.y + lastPt.y) / 3;

            out.push('      <ellipse cx="' + island1X.toFixed(1) + '" cy="' + island1Y.toFixed(1) + '" rx="18" ry="9.5" fill="' + rTheme.bankColor + '" stroke="' + ink + '" stroke-width="1.1"' + wobbleAttr + '/>');
            out.push('      <ellipse cx="' + (island1X - 1).toFixed(1) + '" cy="' + island1Y.toFixed(1) + '" rx="13" ry="6.5" fill="' + (activeTheme === "fire" ? "#451a03" : "#5d8438") + '" opacity="0.9"/>');
            out.push('      <path d="M ' + (island1X - 6).toFixed(1) + ' ' + (island1Y - 2).toFixed(1) + ' L ' + (island1X - 7).toFixed(1) + ' ' + (island1Y - 9).toFixed(1) + ' M ' + (island1X - 2).toFixed(1) + ' ' + island1Y.toFixed(1) + ' L ' + (island1X - 2).toFixed(1) + ' ' + (island1Y - 8).toFixed(1) + '" stroke="#606c38" stroke-width="1.3" stroke-linecap="round"/>');

            out.push('      <ellipse cx="' + island2X.toFixed(1) + '" cy="' + island2Y.toFixed(1) + '" rx="16" ry="8.5" fill="' + rTheme.bankColor + '" stroke="' + ink + '" stroke-width="1.1"' + wobbleAttr + '/>');
            out.push('      <ellipse cx="' + island2X.toFixed(1) + '" cy="' + island2Y.toFixed(1) + '" rx="11" ry="5.8" fill="' + (activeTheme === "fire" ? "#451a03" : "#5d8438") + '" opacity="0.9"/>');

            var surfY1 = Math.min(880, lastPt.y + 12);
            var surfY2 = Math.min(890, lastPt.y + 22);
            out.push('      <path class="prs-river-stream prs-river-stream-2" d="M ' + (leftBranchEnd.x - 22).toFixed(1) + ' ' + surfY1 + ' Q ' + lastPt.x.toFixed(1) + ' ' + (surfY1 - 4) + ' ' + (rightBranchEnd.x + 22).toFixed(1) + ' ' + surfY1 + '" fill="none" stroke="' + (rTheme.streamColor1 || "rgba(255,255,255,0.75)") + '" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="18,12,32,16"/>');
            out.push('      <path class="prs-river-stream prs-river-stream-2" d="M ' + (leftBranchEnd.x - 30).toFixed(1) + ' ' + surfY2 + ' Q ' + lastPt.x.toFixed(1) + ' ' + (surfY2 - 3) + ' ' + (rightBranchEnd.x + 30).toFixed(1) + ' ' + surfY2 + '" fill="none" stroke="' + (rTheme.streamColor2 || "rgba(255,255,255,0.5)") + '" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="24,14,40,18"/>');

            out.push('      <line x1="' + island1X.toFixed(1) + '" y1="' + (island1Y - 2).toFixed(1) + '" x2="' + island1X.toFixed(1) + '" y2="' + (island1Y - 14).toFixed(1) + '" stroke="#78350f" stroke-width="1.6" stroke-linecap="round"/>');
            out.push('      <polygon points="' + island1X.toFixed(1) + ',' + (island1Y - 14).toFixed(1) + ' ' + (island1X + 4).toFixed(1) + ',' + (island1Y - 12).toFixed(1) + ' ' + island1X.toFixed(1) + ',' + (island1Y - 10).toFixed(1) + '" fill="#ea580c"/>');

            out.push('    </g>');
        }
        return out.join("\n");
    },

    
    riverNearBridge: function (pt, bridges, radius) {
        for (var b = 0; b < bridges.length; b++) {
            var dx = bridges[b].x - pt.x, dy = bridges[b].y - pt.y;
            if (dx * dx + dy * dy < radius * radius) return true;
        }
        return false;
    },

    
    riverVegetationSVG: function (x, y, h, activeTheme) {
        var ink = "rgba(45,26,14,0.85)";
        var g = '    <g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')" pointer-events="none">';
        
        if (activeTheme === "fire") {
            // Sopečný a lávový biom
            if (h < 0.40) {
                // Žhavé uhlíky a kouřící trsy
                g += '<circle cx="0" cy="0" r="4.2" fill="#ea580c" opacity="0.85"/>' +
                     '<circle cx="2" cy="-2" r="2.2" fill="#fef08a"/>' +
                     '<path d="M-4 3 L-5 -7 M0 3 L1 -10 M4 3 L6 -6" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/>';
            } else if (h < 0.70) {
                // Čedičové balvany se žhavými prasklinami
                g += '<ellipse cx="0" cy="1" rx="7" ry="4.2" fill="#1c1917" stroke="#ea580c" stroke-width="1"/>' +
                     '<path d="M-3 1 L1 -1 L4 2" stroke="#fbbf24" stroke-width="0.9"/>';
            } else {
                // Lávový obelisk / vyhaslý kmen
                g += '<path d="M-3 5 L0 -11 L3 5 Z" fill="#292524" stroke="#b45309" stroke-width="1"/>' +
                     '<circle cx="0" cy="-11" r="2" fill="#f97316"/>';
            }
        } else if (activeTheme === "water") {
            // Vodní a safírový biom
            if (h < 0.45) {
                // Lekníny a modré vodní květy
                g += '<ellipse cx="0" cy="1" rx="8" ry="4.5" fill="#047857" opacity="0.9"/>' +
                     '<circle cx="1" cy="-1" r="3.2" fill="#38bdf8" stroke="#ffffff" stroke-width="0.7"/>';
            } else if (h < 0.72) {
                // Oblé říční valouny s perletí
                g += '<ellipse cx="0" cy="1" rx="6.5" ry="4" fill="#64748b" stroke="#cbd5e1" stroke-width="0.9"/>' +
                     '<ellipse cx="6" cy="2.5" rx="4" ry="2.6" fill="#94a3b8"/>';
            } else {
                // Vodní vrba
                g += '<path d="M0 8 L0 -5" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>' +
                     '<circle cx="0" cy="-9" r="8.5" fill="#0284c7" stroke="' + ink + '" stroke-width="0.8"/>' +
                     '<path d="M-6 -6 Q-9 3 -6 7 M-1 -2 Q-3 5 -1 8 M4 -2 Q5 5 4 8 M8 -6 Q10 3 8 7" stroke="#38bdf8" stroke-width="1.3" fill="none"/>';
            }
        } else if (activeTheme === "earth") {
            // Zemský mechový hvozd
            if (h < 0.45) {
                // Mechové rákosí
                g += '<path d="M-5 4 L-6 -9 M0 4 L0 -13 M5 4 L6 -8" stroke="#22c55e" stroke-width="1.6" stroke-linecap="round" fill="none"/>' +
                     '<ellipse cx="0" cy="-13" rx="1.8" ry="3.6" fill="#365314"/>';
            } else if (h < 0.75) {
                // Zelené mechem porostlé balvany
                g += '<ellipse cx="0" cy="1" rx="7" ry="4.5" fill="#3f6212" stroke="#14532d" stroke-width="1"/>' +
                     '<circle cx="-1" cy="0" r="3.2" fill="#65a30d"/>';
            } else {
                // Husté kapradí a keř
                g += '<ellipse cx="0" cy="4" rx="9" ry="3" fill="rgba(0,0,0,0.22)"/>' +
                     '<circle cx="-4" cy="0" r="5.8" fill="#15803d" stroke="' + ink + '" stroke-width="0.8"/>' +
                     '<circle cx="4" cy="1" r="5.2" fill="#166534" stroke="' + ink + '" stroke-width="0.8"/>';
            }
        } else if (activeTheme === "air") {
            // Vzdušný éterický biom
            if (h < 0.45) {
                // Stříbrné křehké rákosí
                g += '<path d="M-5 4 L-5 -10 M0 4 L1 -14 M5 4 L4 -9" stroke="#93c5fd" stroke-width="1.5" stroke-linecap="round"/>' +
                     '<circle cx="1" cy="-14" r="2" fill="#e0e7ff"/>';
            } else if (h < 0.75) {
                // Krystalové stříbrné kameny
                g += '<polygon points="-5,4 0,-6 5,4" fill="#c7d2fe" stroke="#6366f1" stroke-width="0.9"/>' +
                     '<polygon points="3,4 7,-3 10,4" fill="#e0e7ff" stroke="#818cf8" stroke-width="0.8"/>';
            } else {
                // Větrný stříbrný strom
                g += '<path d="M0 8 L0 -5" stroke="#64748b" stroke-width="2.4" stroke-linecap="round"/>' +
                     '<circle cx="0" cy="-9" r="8" fill="#a5b4fc" stroke="#4f46e5" stroke-width="0.8"/>';
            }
        } else {
            // Výchozí klasický královský biom (Světlo / Doubravka)
            if (h < 0.42) {
                // Rákosí s palicemi a obloukovými stébly
                g += '<path d="M-7 5 Q-9 -2 -10 -7 M-4 4 Q-5 -3 -6 -11 M0 4 Q0 -5 0 -14 M4 4 Q5 -2 6 -9 M7 5 Q9 -1 10 -6" stroke="#53682b" stroke-width="1.45" stroke-linecap="round" fill="none"/>' +
                     '<ellipse cx="0" cy="-14" rx="1.5" ry="3.3" fill="#5c3a1e" stroke="' + ink + '" stroke-width="0.45"/>' +
                     '<ellipse cx="6" cy="-9" rx="1.35" ry="2.6" fill="#5c3a1e" stroke="' + ink + '" stroke-width="0.45"/>';
            } else if (h < 0.68) {
                // Říční balvany na pláži
                g += '<ellipse cx="0" cy="1" rx="6.5" ry="4.2" fill="#8d877d" stroke="' + ink + '" stroke-width="1"/>' +
                     '<ellipse cx="7" cy="2.8" rx="4" ry="2.7" fill="#a39d92" stroke="' + ink + '" stroke-width="0.8"/>';
            } else if (h < 0.88) {
                // Smuteční vrba sklánějící se k vodě
                g += '<ellipse cx="0" cy="7" rx="10" ry="3.2" fill="rgba(0,0,0,0.22)"/>' +
                     '<path d="M0 8 L0 -5" stroke="#5a4028" stroke-width="2.8" stroke-linecap="round"/>' +
                     '<circle cx="0" cy="-10" r="9" fill="#5f8a3c" stroke="' + ink + '" stroke-width="0.9"/>' +
                     '<path d="M-7 -8 Q-10 2 -7 6 M-2 -3 Q-3 5 -2 8 M3 -3 Q5 5 4 8 M8 -8 Q11 2 9 6" stroke="#84cc16" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
            } else {
                // Pobřežní keř
                g += '<ellipse cx="0" cy="5" rx="9" ry="2.8" fill="rgba(0,0,0,0.20)"/>' +
                     '<circle cx="-4" cy="0" r="5.6" fill="#58803a" stroke="' + ink + '" stroke-width="0.8"/>' +
                     '<circle cx="4" cy="1" r="5.2" fill="#6a9644" stroke="' + ink + '" stroke-width="0.8"/>';
            }
        }
        return g + '</g>';
    },

    riverWaterDetailSVG: function (x, y, h, activeTheme) {
        var rot = Math.round((h * 360) % 360);
        var g = '    <g class="prs-river-lily" transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + rot + ')" pointer-events="none">';
        if (activeTheme === "fire") {
            // Plovoucí sopečná struska a žhavá jiskra
            g += '<ellipse cx="0" cy="0" rx="3.2" ry="2.0" fill="#292524" opacity="0.72"/>' +
                 '<ellipse cx="4.5" cy="1.8" rx="1.9" ry="1.3" fill="#292524" opacity="0.65"/>';
            if (h < 0.45) {
                g += '<circle cx="1.0" cy="-0.4" r="1.2" fill="#fb923c" opacity="0.9"/>';
            }
        } else if (activeTheme === "air") {
            // Jemné mlžné vlnky na hladině
            g += '<path d="M-5 0 Q-1 -2 3 0 M-2 2.8 Q2 1 6 2.6" fill="none" stroke="#e0e7ff" stroke-width="0.9" stroke-linecap="round" opacity="0.58"/>';
        } else {
            // Skupinka 2-3 leknínových listů s výřezem a volitelným kvítkem
            g += '<path d="M 0,0 L 3.8,-1.4 A 4.0,2.8 0 1,1 3.1,-2.2 Z" fill="#2f6b3e" stroke="rgba(22,44,24,0.65)" stroke-width="0.55" opacity="0.9"/>' +
                 '<path d="M -5.4,2.4 L -2.6,1.5 A 3.0,2.1 0 1,1 -3.0,0.8 Z" fill="#3e7d4a" stroke="rgba(22,44,24,0.60)" stroke-width="0.5" opacity="0.88"/>';
            if (h > 0.62) {
                g += '<ellipse cx="5.2" cy="2.6" rx="2.3" ry="1.6" fill="#2f6b3e" stroke="rgba(22,44,24,0.55)" stroke-width="0.45" opacity="0.84"/>';
            }
            if (h < 0.45) {
                var bloom = (activeTheme === "water") ? "#bae6fd" : (h < 0.22 ? "#f9a8d4" : "#fef3c7");
                g += '<circle cx="0.6" cy="-0.3" r="1.55" fill="' + bloom + '" stroke="rgba(90,60,40,0.45)" stroke-width="0.35"/>';
            }
        }
        return g + '</g>';
    },

    
    renderBoardBridgesHTML: function (board, gQuality) {
        if (!board || !board.bridges || board.bridges.length === 0) return "";
        if (!gQuality) gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var softAttr = (gQuality === "high") ? ' filter="url(#riverSoft)"' : '';
        var out = [];
        var ink = "rgba(40,24,14,0.92)";
        var activeTheme = (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-theme")) ||
                          (typeof localStorage !== "undefined" && localStorage && localStorage.getItem("kidesky_element_theme")) || "light";
        var th = (this.RIVER_THEMES && this.RIVER_THEMES[activeTheme]) || (this.RIVER_THEMES && this.RIVER_THEMES.light) || {};
        var nodes = board.nodes || [];

        out.push('  <g id="prs-bridges-layer">');
        for (var b = 0; b < board.bridges.length; b++) {
            var brg = board.bridges[b];
            var nA = null, nB = null;
            if (brg.nodeAId !== undefined && brg.nodeBId !== undefined) {
                for (var ni = 0; ni < nodes.length; ni++) {
                    if (nodes[ni].id === brg.nodeAId) nA = nodes[ni];
                    if (nodes[ni].id === brg.nodeBId) nB = nodes[ni];
                }
            }

            // Automatická inteligentní volba typu přechodu
            var cType = brg.crossingType;
            if (!cType) {
                var isGrand = (nA && (nA.type === "castle" || nA.type === "town" || nA.type === "start")) ||
                              (nB && (nB.type === "castle" || nB.type === "town" || nB.type === "start"));
                var isVillage = (nA && (nA.type === "village" || nA.type === "tavern" || nA.type === "trade" || nA.type === "craft")) ||
                                (nB && (nB.type === "village" || nB.type === "tavern" || nB.type === "trade" || nB.type === "craft"));
                if (isGrand) {
                    cType = "stone_arch";
                } else if (isVillage) {
                    cType = "wood_plank";
                } else {
                    cType = (b % 2 === 0) ? "stone_ford" : "wood_plank";
                }
            }

            out.push('    <g class="board-bridge-item board-crossing-' + cType + '" transform="translate(' + brg.x + ',' + brg.y + ') rotate(' + brg.angle + ')">');

            if (cType === "wood_plank") {
                // ============================================================
                // TYP 2: DŘEVĚNÁ TRÁMOVÁ LÁVKA (DÉLKA 54 PX, ŠÍŘKA 22 PX)
                // ============================================================
                // Hluboký stín lávky na hladině
                out.push('      <rect x="-27" y="-9" width="54" height="22" rx="7" fill="rgba(8,20,32,0.42)"' + softAttr + '/>');
                // Tři podélné nosné dubové trámy přes řeku
                var beamCol = (activeTheme === "fire") ? "#1c1917" : "#3e240f";
                out.push('      <rect x="-28" y="-8.5" width="56" height="3.2" rx="1.5" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.7"/>');
                out.push('      <rect x="-28" y="-1.6" width="56" height="3.2" rx="1.5" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.7"/>');
                out.push('      <rect x="-28" y="5.3" width="56" height="3.2" rx="1.5" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.7"/>');
                // Příčná dřevěná prkna (fošny) se zřetelnými spárami
                var plankColors = (activeTheme === "fire")
                    ? ["#44403c", "#57534e", "#292524", "#3f3f46"]
                    : ["#8a5d34", "#7b5029", "#96673b", "#6f4722", "#84572f"];
                for (var pk = -25; pk <= 23; pk += 4.2) {
                    var pCol = plankColors[Math.abs(Math.round(pk * 3)) % plankColors.length];
                    var extraLen = (Math.sin(pk * 7) * 1.8);
                    out.push('      <rect x="' + pk.toFixed(1) + '" y="' + (-9.5 - extraLen * 0.4).toFixed(1) + '" width="3.5" height="' + (19 + extraLen).toFixed(1) + '" rx="1" fill="' + pCol + '" stroke="rgba(30,18,10,0.8)" stroke-width="0.6"/>');
                    out.push('      <circle cx="' + (pk + 1.7).toFixed(1) + '" cy="-6.5" r="0.5" fill="#1c1108"/>');
                    out.push('      <circle cx="' + (pk + 1.7).toFixed(1) + '" cy="6.5" r="0.5" fill="#1c1108"/>');
                }
                // Sloupky zábradlí a dřevěné madlo
                var postCol = (activeTheme === "fire") ? "#78350f" : "#b08552";
                out.push('      <circle cx="-25" cy="-9" r="2.2" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.8"/>');
                out.push('      <circle cx="25" cy="-9" r="2.2" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.8"/>');
                out.push('      <circle cx="-25" cy="9" r="2.2" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.8"/>');
                out.push('      <circle cx="25" cy="9" r="2.2" fill="' + beamCol + '" stroke="' + ink + '" stroke-width="0.8"/>');
                out.push('      <line x1="-25" y1="-9" x2="25" y2="-9" stroke="' + postCol + '" stroke-width="1.8" stroke-linecap="round"/>');
                out.push('      <line x1="-25" y1="9" x2="25" y2="9" stroke="' + postCol + '" stroke-width="1.8" stroke-linecap="round"/>');

            } else if (cType === "stone_ford") {
                // ============================================================
                // TYP 3: PŘÍRODNÍ KAMENNÝ BROD (7 VELKÝCH ŠLAPÁKŮ VE VODĚ)
                // ============================================================
                var stones = [
                    { x: -22, y: -3.5, rx: 5.6, ry: 4.4, rot: 15 },
                    { x: -15, y: 3.8,  rx: 5.2, ry: 4.2, rot: -18 },
                    { x: -7,  y: -2.0, rx: 6.2, ry: 4.8, rot: 8 },
                    { x: 0,   y: 4.0,  rx: 6.0, ry: 4.6, rot: -12 },
                    { x: 8,   y: -3.0, rx: 6.4, ry: 5.0, rot: 14 },
                    { x: 15,  y: 3.2,  rx: 5.4, ry: 4.2, rot: -16 },
                    { x: 22,  y: -2.5, rx: 5.8, ry: 4.5, rot: 20 }
                ];
                var rockBase = (activeTheme === "fire") ? "#1c1917" : "#57534e";
                var rockTop  = (activeTheme === "fire") ? "#44403c" : "#a8a29e";
                var frothCol = (activeTheme === "fire") ? "rgba(251,146,60,0.85)" : "rgba(255,255,255,0.90)";

                for (var si = 0; si < stones.length; si++) {
                    var st = stones[si];
                    out.push('      <g transform="translate(' + st.x + ',' + st.y + ') rotate(' + st.rot + ')">');
                    out.push('        <ellipse cx="1" cy="2.5" rx="' + (st.rx + 2.5).toFixed(1) + '" ry="' + (st.ry + 2.5).toFixed(1) + '" fill="rgba(8,20,32,0.40)"' + softAttr + '/>');
                    out.push('        <path d="M -' + (st.rx + 2.8).toFixed(1) + ' 0 Q 0 ' + (st.ry + 4.5).toFixed(1) + ' ' + (st.rx + 2.8).toFixed(1) + ' 0" fill="none" stroke="' + frothCol + '" stroke-width="1.4" stroke-linecap="round"/>');
                    out.push('        <ellipse cx="0" cy="0" rx="' + st.rx + '" ry="' + st.ry + '" fill="' + rockBase + '" stroke="' + ink + '" stroke-width="1"/>');
                    out.push('        <ellipse cx="-1" cy="-0.8" rx="' + (st.rx * 0.65).toFixed(1) + '" ry="' + (st.ry * 0.62).toFixed(1) + '" fill="' + rockTop + '"/>');
                    if (activeTheme !== "fire") {
                        out.push('        <path d="M -' + (st.rx * 0.6).toFixed(1) + ' ' + (st.ry * 0.3).toFixed(1) + ' Q 0 ' + (st.ry * 0.6).toFixed(1) + ' ' + (st.rx * 0.5).toFixed(1) + ' ' + (st.ry * 0.3).toFixed(1) + '" fill="none" stroke="#65a30d" stroke-width="1" stroke-linecap="round"/>');
                    } else {
                        out.push('        <path d="M -' + (st.rx * 0.5).toFixed(1) + ' 0 L ' + (st.rx * 0.5).toFixed(1) + ' 0" stroke="#f97316" stroke-width="1"/>');
                    }
                    out.push('      </g>');
                }

            } else {
                // ============================================================
                // TYP 1: KRÁLOVSKÝ KAMENNÝ OBLOUKOVÝ MOST (DÉLKA 56 PX, ŠÍŘKA 26 PX)
                // ============================================================
                var bodyCol = th.bridgeStoneBody || "#78716c";
                var roadCol = th.bridgeStoneRoad || "#e7e5e4";
                var archCol = th.bridgeArch || "#44403c";

                // Hluboký stín mostovky na vodě
                out.push('      <rect x="-28" y="-11" width="56" height="26" rx="10" fill="rgba(4,18,36,0.40)"' + softAttr + '/>');
                // Masivní vystupující klenbové oblouky a pilíře ve vodě (proti i po proudu)
                out.push('      <path d="M-16 13 A16 9 0 0 0 16 13 Z" fill="' + archCol + '" stroke="' + ink + '" stroke-width="1.1"/>');
                out.push('      <path d="M-16 -13 A16 9 0 0 1 16 -13 Z" fill="' + archCol + '" stroke="' + ink + '" stroke-width="1.1"/>');
                // Těleso mostu s kamennou obrubou
                out.push('      <rect x="-28" y="-12" width="56" height="24" rx="7" fill="' + bodyCol + '" stroke="' + ink + '" stroke-width="1.4"/>');
                // Dlážděná světlá vozovka
                out.push('      <rect x="-27" y="-7.5" width="54" height="15" rx="3.5" fill="' + roadCol + '"/>');
                // Spáry kamenné dlažby vozovky
                out.push('      <path d="M-18 -7.5 L-18 7.5 M-9 -7.5 L-9 7.5 M0 -7.5 L0 7.5 M9 -7.5 L9 7.5 M18 -7.5 L18 7.5" stroke="rgba(80,60,40,0.6)" stroke-width="1"/>');
                out.push('      <path d="M-27 0 L27 0" stroke="rgba(80,60,40,0.45)" stroke-width="0.8" stroke-dasharray="4,4"/>');
                if (activeTheme === "fire") {
                    out.push('      <path d="M-22 0 L22 0" stroke="rgba(249,115,22,0.75)" stroke-width="1.3" stroke-dasharray="4,4"/>');
                }
                // Masivní kamenné parapety (zábradlí)
                out.push('      <rect x="-28" y="-12" width="56" height="4.5" rx="2" fill="' + archCol + '" stroke="' + ink + '" stroke-width="1"/>');
                out.push('      <rect x="-28" y="7.5" width="56" height="4.5" rx="2" fill="' + archCol + '" stroke="' + ink + '" stroke-width="1"/>');
                // 4 rohové heraldické patníky / sloupky
                out.push('      <circle cx="-27" cy="-9.8" r="3.8" fill="' + bodyCol + '" stroke="' + ink + '" stroke-width="1.1"/>');
                out.push('      <circle cx="27" cy="-9.8" r="3.8" fill="' + bodyCol + '" stroke="' + ink + '" stroke-width="1.1"/>');
                out.push('      <circle cx="-27" cy="9.8" r="3.8" fill="' + bodyCol + '" stroke="' + ink + '" stroke-width="1.1"/>');
                out.push('      <circle cx="27" cy="9.8" r="3.8" fill="' + bodyCol + '" stroke="' + ink + '" stroke-width="1.1"/>');
            }

            out.push('    </g>');
        }
        out.push('  </g>');
        return out.join("\n");
    }
    });
})();
