// ============================================================================
// KiDesky: Princeznino srdce - Ambientní částicové plátno a textové pomůcky
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    
    resizeAmbientCanvas: function () {

        var canvas = document.getElementById("prs-ambient-canvas");

        var wrap = document.getElementById("board-viewport-wrap");

        if (canvas && wrap && wrap.clientWidth > 0 && wrap.clientHeight > 0) {

            canvas.width = wrap.clientWidth;

            canvas.height = wrap.clientHeight;

        }

    },

    
    initAmbientCanvas: function () {

        var canvas = document.getElementById("prs-ambient-canvas");

        var wrap = document.getElementById("board-viewport-wrap");

        if (!canvas || !wrap) return;

        var ctx = canvas.getContext("2d");

        if (!ctx) return;

        var self = this;

        function resize() {

            if (!wrap || !canvas) return;

            if (wrap.clientWidth > 0 && wrap.clientHeight > 0) {

                canvas.width = wrap.clientWidth;

                canvas.height = wrap.clientHeight;

            }

        }

        resize();

        window.addEventListener("resize", resize);

        // 36 ambientních částic reagujících na zvolený živel (Gold, Fire, Water, Earth, Air)

        var particles = [];

        var count = 36;

        for (var i = 0; i < count; i++) {

            particles.push({

                x: Math.random() * (canvas.width || 1200),

                y: Math.random() * (canvas.height || 750),

                vx: (Math.random() - 0.5) * 0.5,

                vy: -0.2 - Math.random() * 0.45,

                size: 1.2 + Math.random() * 2.8,

                rot: Math.random() * Math.PI * 2,

                vrot: (Math.random() - 0.5) * 0.05,

                alpha: 0.2 + Math.random() * 0.55,

                baseAlpha: 0.2 + Math.random() * 0.55,

                phase: Math.random() * Math.PI * 2

            });

        }

        var hadDrawn = false;

        var vpWrap = document.getElementById("board-viewport-wrap");

        function loop() {

            var tabBoard = document.getElementById("tab-board");

            var gQual = (typeof self.getGraphicsQuality === "function") ? self.getGraphicsQuality() : "high";

            var isMobileDev = (typeof document !== "undefined" && document.body && document.body.getAttribute("data-device") === "mobile");

            var reducedMotion = (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

            var isInteracting = Boolean(
                (vpWrap && (vpWrap.classList.contains("is-panning") || vpWrap.classList.contains("is-interacting"))) ||
                (typeof document !== "undefined" && document.body && (document.body.classList.contains("prs-board-panning") || document.body.classList.contains("prs-board-interacting")))
            );

            var shouldPauseCanvas = !tabBoard || tabBoard.style.display === "none" || gQual === "low" || gQual === "medium" || isMobileDev || reducedMotion || isInteracting;

            if (shouldPauseCanvas) {

                if (hadDrawn) {

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    hadDrawn = false;

                }

                setTimeout(function () { requestAnimationFrame(loop); }, 450);

                return;

            }

            hadDrawn = true;

            if (tabBoard && tabBoard.style.display !== "none") {

                if (canvas.width === 0 || canvas.height === 0) {

                    resize();

                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                var th = self.currentTheme || "light";

                for (var i = 0; i < particles.length; i++) {

                    var p = particles[i];

                    p.phase += 0.035;

                    p.rot += p.vrot;

                    var curAlpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.phase));

                    if (th === "fire") {

                        // Oheň: stoupající žhavé uhlíky s mihotáním do stran

                        p.y += p.vy * 1.35;

                        p.x += Math.sin(p.phase * 2) * 0.75 + p.vx * 0.5;

                        if (p.y < -15) {

                            p.y = canvas.height + 15;

                            p.x = Math.random() * canvas.width;

                        }

                        ctx.beginPath();

                        ctx.arc(p.x, p.y, p.size * (0.8 + 0.3 * Math.sin(p.phase)), 0, Math.PI * 2);

                        ctx.fillStyle = (Math.sin(p.phase) > 0.2) ? "rgba(251, 146, 60, " + curAlpha.toFixed(2) + ")" : "rgba(239, 68, 68, " + curAlpha.toFixed(2) + ")";

                        ctx.shadowBlur = 10;

                        ctx.shadowColor = "#f97316";

                        ctx.fill();

                    } else if (th === "water") {

                        // Voda: plovoucí bublinky a světelné caustics

                        p.y += p.vy * 0.65;

                        p.x += Math.sin(p.phase) * 0.6;

                        if (p.y < -15) {

                            p.y = canvas.height + 15;

                            p.x = Math.random() * canvas.width;

                        }

                        ctx.beginPath();

                        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);

                        ctx.fillStyle = "rgba(56, 189, 248, " + curAlpha.toFixed(2) + ")";

                        ctx.shadowBlur = 9;

                        ctx.shadowColor = "#0284c7";

                        ctx.fill();

                    } else if (th === "earth") {

                        // Země: padající a vířící podzimní lístky

                        p.y += (0.35 + Math.abs(p.vy * 0.6));

                        p.x += Math.cos(p.phase) * 0.85;

                        if (p.y > canvas.height + 15) {

                            p.y = -15;

                            p.x = Math.random() * canvas.width;

                        }

                        ctx.save();

                        ctx.translate(p.x, p.y);

                        ctx.rotate(p.rot);

                        ctx.beginPath();

                        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);

                        ctx.fillStyle = "rgba(52, 211, 153, " + curAlpha.toFixed(2) + ")";

                        ctx.shadowBlur = 6;

                        ctx.shadowColor = "#059669";

                        ctx.fill();

                        ctx.restore();

                    } else if (th === "air") {

                        // Vzduch: elektrické mikro-jiskry a fialové záblesky

                        p.y += p.vy * 1.1;

                        p.x += p.vx * 1.3 + Math.sin(p.phase * 3) * 0.8;

                        if (p.y < -15) {

                            p.y = canvas.height + 15;

                            p.x = Math.random() * canvas.width;

                        }

                        ctx.beginPath();

                        ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);

                        ctx.fillStyle = "rgba(192, 132, 252, " + curAlpha.toFixed(2) + ")";

                        ctx.shadowBlur = 12;

                        ctx.shadowColor = "#c084fc";

                        ctx.fill();

                    } else {

                        // Zlato (Light): zlatý hvězdný prach s třpytivým pulzem

                        p.y += p.vy;

                        p.x += p.vx + Math.sin(p.phase) * 0.35;

                        if (p.y < -15) {

                            p.y = canvas.height + 15;

                            p.x = Math.random() * canvas.width;

                        }

                        ctx.beginPath();

                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                        ctx.fillStyle = "rgba(251, 191, 36, " + curAlpha.toFixed(2) + ")";

                        ctx.shadowBlur = 9;

                        ctx.shadowColor = "#f59e0b";

                        ctx.fill();

                    }

                }

            }

            requestAnimationFrame(loop);

        }

        requestAnimationFrame(loop);

    },

    
    // ========================================================================

    // FÁZE 1: INTERAKTIVNÍ KRAJINA, 3D BALÍČKY A PLOVOUCÍ HLÁŠKY

    // ========================================================================,

    wrapText: function (str, maxChars) {

        if (!str) return [""];
        if (typeof str !== "string") str = String(str);

        if (str.length <= maxChars) return [str];

        var words = str.split(" ");

        var l1 = "", l2 = "";

        for (var i = 0; i < words.length; i++) {

            var w = words[i];

            if ((l1 + " " + w).trim().length <= maxChars && !l2) {

                l1 = (l1 + " " + w).trim();

            } else {

                l2 = (l2 + " " + w).trim();

            }

        }

        if (l2.length > maxChars) {

            l2 = l2.substring(0, maxChars - 2) + "...";

        }

        return [l1, l2];
    },

    // ========================================================================
    // FÁZE 5: ŽIVÝ SVĚT — ATMOSFÉRA, MRAKY, KOUŘ, MLÝNY, PTÁCI A DRAMATICKÁ NOC
    // ========================================================================
    renderBoardAtmosphereHTML: function (board) {
        if (!board) return "";
        var out = [];
        var decs = Array.isArray(board.decorations) ? board.decorations : [];
        var nodes = Array.isArray(board.nodes) ? board.nodes : [];
        var rivers = Array.isArray(board.rivers) ? board.rivers : [];
        var th = this.currentTheme || (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-theme")) || "light";
        var gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
        var isNight = Boolean(this.isNightMode || (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-time") === "night"));
        if (gQuality === "low" && !isNight) return "";

        function atmoHash(a, b) {
            var v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
            return v - Math.floor(v);
        }

        out.push('  <g id="prs-atmosphere-layer" clip-path="url(#prsBoardInnerClip)" pointer-events="none">');

        // A. Denní teplá sluneční vinětace a stíny mraků (pouze ve dne)
        if (!isNight && gQuality !== "low") {
            out.push('    <rect x="18" y="18" width="1364" height="824" fill="url(#atmoSunWarmth)" opacity="0.55"/>');
            if (gQuality === "high") {
                out.push('    <g id="prs-cloud-shadows" style="mix-blend-mode:multiply;">');
                out.push('      <ellipse class="prs-cloud-shadow prs-cloud-1" cx="240" cy="180" rx="220" ry="82" fill="rgba(12,18,24,0.16)" filter="url(#cloudShadowBlur)"/>');
                out.push('      <ellipse class="prs-cloud-shadow prs-cloud-2" cx="780" cy="460" rx="260" ry="95" fill="rgba(10,16,22,0.14)" filter="url(#cloudShadowBlur)"/>');
                out.push('      <ellipse class="prs-cloud-shadow prs-cloud-3" cx="480" cy="690" rx="190" ry="72" fill="rgba(12,18,24,0.15)" filter="url(#cloudShadowBlur)"/>');
                out.push('    </g>');
            }
        }

        // C. Kouř stoupající z komínů chalup, čarodějných chýší a sídel (pouze na vysoké kvalitě)
        if (gQuality === "high") {
        var smokeEmitters = [];
        for (var i = 0; i < decs.length && smokeEmitters.length < 10; i++) {
            var d = decs[i];
            if (!d || (d.catalogId !== "cottage_timber" && d.catalogId !== "witch_hut")) continue;
            if (typeof this.isDecorCollidingWithRivers === "function" && this.isDecorCollidingWithRivers(d, rivers)) continue;
            var sc = d.scale || 1;
            var flipSign = d.isFlipped ? -1 : 1;
            var sx, sy, sCol;
            if (d.catalogId === "witch_hut") {
                sx = Math.round(d.x + d.w * 0.19 * sc * flipSign);
                sy = Math.round(d.y - d.h * 0.31 * sc);
                sCol = isNight ? "rgba(216,180,254,0.34)" : "rgba(212,186,246,0.46)";
            } else {
                sx = Math.round(d.x - d.w * 0.07 * sc * flipSign);
                sy = Math.round(d.y - d.h * 0.45 * sc);
                sCol = isNight ? "rgba(190,204,226,0.30)" : "rgba(236,232,226,0.44)";
            }
            smokeEmitters.push({ x: sx, y: sy, color: sCol, phase: atmoHash(d.x, d.y) * 4.5 });
        }
        for (var ni = 0; ni < nodes.length && smokeEmitters.length < 14; ni++) {
            var nd = nodes[ni];
            if (!nd) continue;
            if ((nd.type === "VILLAGE" && (nd.villageLevel || 1) >= 2) || nd.type === "TOWN" || nd.type === "TAVERN" || nd.type === "BLACKSMITH") {
                smokeEmitters.push({ x: Math.round(nd.x + 8), y: Math.round(nd.y - 24), color: isNight ? "rgba(186,198,220,0.28)" : "rgba(234,230,224,0.42)", phase: atmoHash(nd.x, nd.y) * 4.5 });
            }
        }
        out.push('    <g id="prs-chimney-smoke">');
        for (var se = 0; se < smokeEmitters.length; se++) {
            var em = smokeEmitters[se];
            for (var p = 0; p < 3; p++) {
                var delay = (em.phase + p * 1.73).toFixed(2);
                out.push('      <circle class="prs-smoke-puff" cx="' + em.x + '" cy="' + em.y + '" r="3.2" fill="' + em.color + '" style="animation-delay:-' + delay + 's;"/>');
            }
        }
        out.push('    </g>');

        // D. Větrné víry kolem lopatek větrných mlýnů
        out.push('    <g id="prs-windmill-anim">');
        var millCount = 0;
        for (var wi = 0; wi < decs.length && millCount < 8; wi++) {
            var wd = decs[wi];
            if (!wd || wd.catalogId !== "windmill") continue;
            if (typeof this.isDecorCollidingWithRivers === "function" && this.isDecorCollidingWithRivers(wd, rivers)) continue;
            var wsc = wd.scale || 1;
            var wFlip = wd.isFlipped ? -1 : 1;
            var hubX = Math.round(wd.x + wd.w * 0.13 * wsc * wFlip);
            var hubY = Math.round(wd.y - wd.h * 0.14 * wsc);
            var rr = Math.max(9, Math.round(14 * wsc));
            var wDelay = (atmoHash(wd.x, wd.y) * 9).toFixed(2);
            var arcCol = isNight ? "rgba(196,220,255,0.34)" : "rgba(255,248,220,0.48)";
            var arcCol2 = isNight ? "rgba(196,220,255,0.28)" : "rgba(255,248,220,0.42)";
            out.push('      <g transform="translate(' + hubX + ',' + hubY + ')">');
            out.push('        <g class="prs-windmill-rotor" style="animation-delay:-' + wDelay + 's;">');
            out.push('          <path d="M 0,-' + rr + ' A ' + rr + ',' + rr + ' 0 0,1 ' + Math.round(rr * 0.72) + ',-' + Math.round(rr * 0.68) + '" fill="none" stroke="' + arcCol + '" stroke-width="1.2" stroke-linecap="round"/>');
            out.push('          <path d="M ' + rr + ',0 A ' + rr + ',' + rr + ' 0 0,1 ' + Math.round(rr * 0.68) + ',' + Math.round(rr * 0.72) + '" fill="none" stroke="' + arcCol2 + '" stroke-width="1.1" stroke-linecap="round"/>');
            out.push('          <path d="M 0,' + rr + ' A ' + rr + ',' + rr + ' 0 0,1 -' + Math.round(rr * 0.72) + ',' + Math.round(rr * 0.68) + '" fill="none" stroke="' + arcCol + '" stroke-width="1.2" stroke-linecap="round"/>');
            out.push('          <path d="M -' + rr + ',0 A ' + rr + ',' + rr + ' 0 0,1 -' + Math.round(rr * 0.68) + ',-' + Math.round(rr * 0.72) + '" fill="none" stroke="' + arcCol2 + '" stroke-width="1.1" stroke-linecap="round"/>');
            out.push('          <line x1="-' + Math.round(rr * 0.45) + '" y1="0" x2="' + Math.round(rr * 0.45) + '" y2="0" stroke="rgba(253,230,138,0.28)" stroke-width="0.9" stroke-linecap="round"/>');
            out.push('          <line x1="0" y1="-' + Math.round(rr * 0.45) + '" x2="0" y2="' + Math.round(rr * 0.45) + '" stroke="rgba(253,230,138,0.28)" stroke-width="0.9" stroke-linecap="round"/>');
            out.push('        </g>');
            out.push('        <circle cx="0" cy="0" r="2.0" fill="' + (isNight ? "rgba(219,234,254,0.65)" : "rgba(254,243,199,0.72)") + '"/>');
            out.push('      </g>');
            millCount++;
        }
        out.push('    </g>');

        } // konec C/D pro high

        // E. Třpytivé odlesky na hladině řeky (ve dne teplé, v noci měsíční stříbro)
        if (gQuality !== "low") {
        out.push('    <g id="prs-water-sparkles">');
        if (rivers.length > 0 && typeof this.sampleRiverPath === "function") {
            var spCol = isNight
                ? ((th === "fire") ? "rgba(253,186,116,0.85)" : "rgba(196,228,255,0.88)")
                : ((th === "fire") ? "rgba(254,240,138,0.90)" : ((th === "air") ? "rgba(224,231,255,0.88)" : "rgba(255,255,255,0.86)"));
            var spPlaced = 0;
            for (var rIdx = 0; rIdx < rivers.length && spPlaced < 16; rIdx++) {
                var rsmp = this.sampleRiverPath(rivers[rIdx].path, 55);
                if (!rsmp || !rsmp.pts) continue;
                for (var ptIdx = 1; ptIdx < rsmp.pts.length - 1 && spPlaced < 16; ptIdx++) {
                    var rpt = rsmp.pts[ptIdx];
                    var off = (atmoHash(rpt.x, rpt.y) - 0.5) * 14;
                    var spX = Math.round(rpt.x + (rpt.nx || 0) * off);
                    var spY = Math.round(rpt.y + (rpt.ny || 0) * off);
                    if (spX < 36 || spX > 1364 || spY < 36 || spY > 824) continue;
                    var spDelay = (atmoHash(spX, spY) * 4.4).toFixed(2);
                    out.push('      <g transform="translate(' + spX + ',' + spY + ')">');
                    out.push('        <path class="prs-water-sparkle" style="animation-delay:-' + spDelay + 's;" d="M 0,-3.2 L 0.8,-0.8 L 3.2,0 L 0.8,0.8 L 0,3.2 L -0.8,0.8 L -3.2,0 L -0.8,-0.8 Z" fill="' + spCol + '"/>');
                    out.push('      </g>');
                    spPlaced++;
                }
            }
        }
        out.push('    </g>');

        } // konec E pro medium/high

        // F. Dvě malá hejna ptáků plachtící nad mapou (pouze ve dne a na vysoké kvalitě)
        if (!isNight && gQuality === "high") {
            var birdCol = (th === "fire") ? "rgba(48,20,14,0.68)" : "rgba(36,28,22,0.62)";
            out.push('    <g id="prs-bird-flocks">');
            out.push('      <g class="prs-bird-flock prs-bird-flock-1">');
            var flock1 = [[0, 0, "0s"], [-14, -9, "0.22s"], [-12, 10, "0.41s"], [-26, -15, "0.15s"]];
            for (var b1 = 0; b1 < flock1.length; b1++) {
                out.push('        <g transform="translate(' + flock1[b1][0] + ',' + flock1[b1][1] + ')"><path class="prs-bird-wing" style="animation-delay:' + flock1[b1][2] + ';" d="M -4.2,1.2 Q -2,-2.2 0,0.4 Q 2,-2.2 4.2,1.2" fill="none" stroke="' + birdCol + '" stroke-width="1.25" stroke-linecap="round"/></g>');
            }
            out.push('      </g>');
            out.push('      <g class="prs-bird-flock prs-bird-flock-2">');
            var flock2 = [[0, 0, "0.10s"], [-13, 8, "0.33s"], [-15, -7, "0.52s"]];
            for (var b2 = 0; b2 < flock2.length; b2++) {
                out.push('        <g transform="translate(' + flock2[b2][0] + ',' + flock2[b2][1] + ')"><path class="prs-bird-wing" style="animation-delay:' + flock2[b2][2] + ';" d="M -3.8,1.0 Q -1.8,-1.8 0,0.4 Q 1.8,-1.8 3.8,1.0" fill="none" stroke="' + birdCol + '" stroke-width="1.15" stroke-linecap="round"/></g>');
            }
            out.push('      </g>');
            out.push('    </g>');
        }

        // G. Dramatická noční atmosféra pro varianty *_night
        if (isNight) {
            out.push('    <g id="prs-night-atmosphere">');
            out.push('      <rect x="18" y="18" width="1364" height="824" fill="url(#nightMoonVeilGrad)" style="mix-blend-mode:multiply;"/>');
            out.push('      <rect x="18" y="18" width="1364" height="824" fill="url(#nightMoonbeamGrad)" style="mix-blend-mode:screen;"/>');
            out.push('      <g id="prs-night-lanterns" style="mix-blend-mode:screen;">');
            var landmarks = Array.isArray(board.landmarks) ? board.landmarks : [];
            var lanCount = 0;

            function pushNightPool(kind, gx, gy, gradId, rx, ry, ox, oy, tiltDeg, delaySec, details) {
                var rot = tiltDeg ? (' rotate(' + tiltDeg.toFixed(1) + ')') : '';
                out.push('        <g data-light-kind="' + kind + '" transform="translate(' + Math.round(gx) + ',' + Math.round(gy) + ')">');
                out.push('          <ellipse cx="' + ox + '" cy="' + oy + '" rx="' + rx + '" ry="' + ry + '"' + (rot ? (' transform="' + rot.trim() + '"') : '') + ' fill="url(#' + gradId + ')"/>');
                if (gQuality !== "low" && details && details.halos) {
                    for (var hi = 0; hi < details.halos.length; hi++) {
                        var hl = details.halos[hi];
                        out.push('          <ellipse class="prs-torch-flicker" style="animation-delay:-' + (delaySec + hi * 0.43).toFixed(2) + 's;" cx="' + hl[0] + '" cy="' + hl[1] + '" rx="' + hl[2] + '" ry="' + hl[3] + '" fill="url(#' + (hl[4] || gradId) + ')"/>');
                    }
                }
                if (details && details.wins) {
                    for (var wi2 = 0; wi2 < details.wins.length; wi2++) {
                        var wn = details.wins[wi2];
                        out.push('          <rect x="' + wn[0] + '" y="' + wn[1] + '" width="' + wn[2] + '" height="' + wn[3] + '" rx="0.6" fill="' + (wn[4] || '#fef08a') + '" opacity="' + (wn[5] || '0.88') + '"/>');
                    }
                }
                if (details && details.dots) {
                    for (var di = 0; di < details.dots.length; di++) {
                        var dt = details.dots[di];
                        var dotCls = (gQuality !== "low" && dt[4]) ? (' class="prs-torch-flicker" style="animation-delay:-' + (delaySec + di * 0.37).toFixed(2) + 's;"') : '';
                        out.push('          <circle' + dotCls + ' cx="' + dt[0] + '" cy="' + dt[1] + '" r="' + dt[2] + '" fill="' + dt[3] + '"/>');
                    }
                }
                out.push('        </g>');
            }

            // 1. Dominanty království (Královský hrad, Dračí sluj, Citadely)
            for (var lmIdx = 0; lmIdx < landmarks.length && lmIdx < 6; lmIdx++) {
                var lmk = landmarks[lmIdx];
                if (!lmk) continue;
                var lmDel = atmoHash(lmk.x, lmk.y) * 2.4;
                var lmId = String(lmk.id || "");
                if (lmId === "royalCastle") {
                    pushNightPool("royal_castle", lmk.x, lmk.y, "nightRoyalGlow", 74, 36, 0, 18, 0, lmDel, {
                        halos: [[-18, 6, 16, 10, "dayNightTorchGlow"], [18, 6, 16, 10, "dayNightTorchGlow"]],
                        wins: [[-12, -16, 2.4, 3.2], [-3, -21, 2.4, 3.4], [5, -18, 2.4, 3.2], [11, -11, 2.2, 3.0]],
                        dots: [[-18, 5, 1.9, "#fde047", true], [18, 5, 1.9, "#fde047", true]]
                    });
                } else if (lmId === "dragonLair" || lmId.indexOf("dragon") !== -1) {
                    pushNightPool("dragon_lair", lmk.x, lmk.y, "nightEmberGlow", 60, 28, 2, 14, -6, lmDel, {
                        halos: [[2, 10, 18, 10, "nightEmberGlow"]],
                        dots: [[2, 9, 2.3, "#fb923c", true], [-5, 12, 1.4, "#fde047", true]]
                    });
                } else {
                    pushNightPool("castle_landmark", lmk.x, lmk.y, "dayNightTorchGlow", 54, 28, 0, 14, 0, lmDel, {
                        halos: [[-12, 6, 14, 9, "dayNightTorchGlow"]],
                        wins: [[-7, -13, 2.2, 3.0], [3, -15, 2.2, 3.0], [9, -8, 2.0, 2.8]],
                        dots: [[-12, 5, 1.8, "#fde047", true]]
                    });
                }
            }

            // 2. Herní uzly rozlišené podle typu osady / lokace
            for (var ln = 0; ln < nodes.length && lanCount < 28; ln++) {
                var lnd = nodes[ln];
                if (!lnd) continue;
                var lDel = atmoHash(lnd.x, lnd.y) * 2.4;
                var tilt = (atmoHash(lnd.y, lnd.x) - 0.5) * 16;
                if (lnd.type === "CASTLE") {
                    pushNightPool("castle", lnd.x, lnd.y, "dayNightTorchGlow", 44, 25, 0, 6, 0, lDel, {
                        halos: [[-15, -3, 12, 8], [15, -3, 12, 8]],
                        wins: [[-6, -12, 2.2, 3.0], [1, -14, 2.2, 3.0], [7, -10, 2.0, 2.8]],
                        dots: [[-15, -4, 1.7, "#fde047", true], [15, -4, 1.7, "#fde047", true]]
                    });
                    lanCount++;
                } else if (lnd.type === "TOWN") {
                    pushNightPool("town", lnd.x, lnd.y, "dayNightTorchGlow", 35, 20, 0, 5, tilt, lDel, {
                        halos: [[-11, 4, 10, 6], [12, 2, 10, 6]],
                        wins: [[-8, -7, 2.0, 2.4], [-2, -10, 2.0, 2.4], [5, -8, 2.0, 2.4], [9, -2, 2.0, 2.4]],
                        dots: [[-11, 3, 1.5, "#fde047", true], [12, 2, 1.4, "#fbbf24", true]]
                    });
                    lanCount++;
                } else if (lnd.type === "VILLAGE") {
                    var vLvl = lnd.villageLevel || 1;
                    var vrx = 22 + vLvl * 3;
                    var vry = Math.round(vrx * 0.56);
                    var vWins = vLvl >= 2 ? [[-5, -4, 1.9, 2.1], [3, -2, 1.9, 2.1]] : [[-2, -3, 1.9, 2.1]];
                    var vDots = vLvl >= 3 ? [[9, 3, 1.4, "#fde047", true]] : [];
                    pushNightPool("village", lnd.x, lnd.y, "dayNightTorchGlow", vrx, vry, 0, 4, tilt, lDel, {
                        halos: vLvl >= 3 ? [[9, 3, 9, 5]] : null,
                        wins: vWins,
                        dots: vDots
                    });
                    lanCount++;
                } else if (lnd.type === "TAVERN") {
                    pushNightPool("tavern", lnd.x, lnd.y, "dayNightTorchGlow", 28, 15, 3, 6, 0, lDel, {
                        halos: [[-9, -2, 9, 6]],
                        wins: [[1, -2, 2.4, 3.2, "#fde68a", "0.92"]],
                        dots: [[-9, -3, 1.8, "#fde047", true]]
                    });
                    lanCount++;
                } else if (lnd.type === "BLACKSMITH") {
                    pushNightPool("blacksmith", lnd.x, lnd.y, "nightEmberGlow", 30, 17, 2, 5, 0, lDel, {
                        halos: [[5, 2, 11, 7, "nightEmberGlow"]],
                        dots: [[5, 1, 2.2, "#fb923c", true], [2, 3, 1.3, "#fef08a", true]]
                    });
                    lanCount++;
                } else if (lnd.type === "FESTIVAL") {
                    pushNightPool("festival", lnd.x, lnd.y, "nightRoyalGlow", 40, 22, 0, 5, 0, lDel, {
                        halos: [[-10, -4, 10, 6, "dayNightTorchGlow"], [10, -4, 10, 6, "nightRoyalGlow"]],
                        dots: [[-12, -5, 1.7, "#fef08a", true], [0, -9, 1.8, "#f9a8d4", true], [12, -5, 1.7, "#fef08a", true]]
                    });
                    lanCount++;
                } else if (lnd.type === "START") {
                    pushNightPool("start", lnd.x, lnd.y, "dayNightTorchGlow", 40, 22, 0, 6, 0, lDel, {
                        halos: [[-14, -4, 11, 7], [14, -4, 11, 7]],
                        wins: [[-4, -13, 2.2, 3.0], [3, -13, 2.2, 3.0]],
                        dots: [[-14, -5, 1.7, "#fde047", true], [14, -5, 1.7, "#fde047", true]]
                    });
                    lanCount++;
                }
            }

            // 3. Dekorační stavby (chalupy, čarodějné chýše, strážní věže, turnajové stany)
            var decLanCount = 0;
            for (var ld = 0; ld < decs.length && decLanCount < 18; ld++) {
                var ldc = decs[ld];
                if (!ldc) continue;
                var cId = ldc.catalogId;
                if (cId !== "cottage_timber" && cId !== "witch_hut" && cId !== "wooden_watchtower" && cId !== "tournament_tent") continue;
                if (typeof this.isDecorCollidingWithRivers === "function" && this.isDecorCollidingWithRivers(ldc, rivers)) continue;
                var dDel = atmoHash(ldc.x, ldc.y) * 2.4;
                var dFlip = ldc.isFlipped ? -1 : 1;
                if (cId === "witch_hut") {
                    pushNightPool("witch_hut", ldc.x, ldc.y, "nightArcaneGlow", 24, 13, -2 * dFlip, 3, 0, dDel, {
                        halos: [[2 * dFlip, -2, 8, 5, "nightArcaneGlow"]],
                        dots: [[2 * dFlip, -3, 1.6, "#c4b5fd", true], [-4 * dFlip, -1, 1.2, "#a5f3fc", false]]
                    });
                } else if (cId === "wooden_watchtower") {
                    pushNightPool("watchtower", ldc.x, ldc.y, "dayNightTorchGlow", 16, 9, 0, 6, 0, dDel, {
                        halos: [[0, -10, 9, 6]],
                        dots: [[0, -10, 1.7, "#fde047", true]]
                    });
                } else if (cId === "tournament_tent") {
                    pushNightPool("tournament_tent", ldc.x, ldc.y, "nightRoyalGlow", 22, 12, 0, 4, 0, dDel, {
                        halos: [[0, 0, 8, 5, "dayNightTorchGlow"]],
                        dots: [[0, 1, 1.5, "#fef08a", true]]
                    });
                } else {
                    pushNightPool("cottage", ldc.x, ldc.y, "dayNightTorchGlow", 18, 10, 2 * dFlip, 4, 0, dDel, {
                        wins: [[2 * dFlip - 1, -2, 2.0, 2.2, "#fde68a", "0.90"]]
                    });
                }
                decLanCount++;
            }
            out.push('      </g>');

            // Světlušky tančící nad noční krajinou (medium/high)
            if (gQuality !== "low") {
            var ffCol = (th === "fire") ? "#fb923c" : ((th === "water" || th === "air") ? "#bae6fd" : "#fef08a");
            out.push('      <g id="prs-night-fireflies">');
            for (var ff = 0; ff < 22; ff++) {
                var fx = Math.round(70 + atmoHash(ff + 1, 13.7) * 1260);
                var fy = Math.round(65 + atmoHash(ff + 7, 29.3) * 730);
                var ffDel = (atmoHash(fx, fy) * 5.2).toFixed(2);
                var ffR = (1.6 + atmoHash(fy, fx) * 1.3).toFixed(1);
                out.push('        <g transform="translate(' + fx + ',' + fy + ')"><circle class="prs-firefly" style="animation-delay:-' + ffDel + 's;" cx="0" cy="0" r="' + ffR + '" fill="' + ffCol + '"/></g>');
            }
            out.push('      </g>');
            }
            out.push('    </g>');
        }

        out.push('  </g>');
        return out.join("\n");
    }
    });
})();
