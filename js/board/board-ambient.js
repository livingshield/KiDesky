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

        function loop() {

            var tabBoard = document.getElementById("tab-board");

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
        var isNight = Boolean(this.isNightMode || (typeof document !== "undefined" && document && document.documentElement && document.documentElement.getAttribute("data-time") === "night"));

        function atmoHash(a, b) {
            var v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
            return v - Math.floor(v);
        }

        out.push('  <g id="prs-atmosphere-layer" clip-path="url(#prsBoardInnerClip)" pointer-events="none">');

        // A. Denní teplá sluneční vinětace a stíny mraků (pouze ve dne)
        if (!isNight) {
            out.push('    <rect x="18" y="18" width="1364" height="824" fill="url(#atmoSunWarmth)" opacity="0.55"/>');
            out.push('    <g id="prs-cloud-shadows" style="mix-blend-mode:multiply;">');
            out.push('      <ellipse class="prs-cloud-shadow prs-cloud-1" cx="240" cy="180" rx="220" ry="82" fill="rgba(12,18,24,0.16)" filter="url(#cloudShadowBlur)"/>');
            out.push('      <ellipse class="prs-cloud-shadow prs-cloud-2" cx="780" cy="460" rx="260" ry="95" fill="rgba(10,16,22,0.14)" filter="url(#cloudShadowBlur)"/>');
            out.push('      <ellipse class="prs-cloud-shadow prs-cloud-3" cx="480" cy="690" rx="190" ry="72" fill="rgba(12,18,24,0.15)" filter="url(#cloudShadowBlur)"/>');
            out.push('    </g>');
        }

        // C. Kouř stoupající z komínů chalup, čarodějných chýší a sídel
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

        // E. Třpytivé odlesky na hladině řeky (ve dne teplé, v noci měsíční stříbro)
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

        // F. Dvě malá hejna ptáků plachtící nad mapou (pouze ve dne)
        if (!isNight) {
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
            var lanCount = 0;
            for (var ln = 0; ln < nodes.length && lanCount < 24; ln++) {
                var lnd = nodes[ln];
                if (!lnd) continue;
                if (lnd.type === "CASTLE" || lnd.type === "TOWN" || lnd.type === "VILLAGE" || lnd.type === "TAVERN" || lnd.type === "BLACKSMITH" || lnd.type === "START" || lnd.type === "FESTIVAL") {
                    var isMajorL = (lnd.type === "CASTLE" || lnd.type === "START" || lnd.type === "FESTIVAL");
                    var lr = isMajorL ? 54 : 34;
                    var coreR = isMajorL ? 15 : 10;
                    var lDel = (atmoHash(lnd.x, lnd.y) * 2.2).toFixed(2);
                    out.push('        <g transform="translate(' + Math.round(lnd.x) + ',' + Math.round(lnd.y) + ')">');
                    out.push('          <circle cx="0" cy="0" r="' + lr + '" fill="url(#dayNightTorchGlow)"/>');
                    out.push('          <circle class="prs-torch-flicker" style="animation-delay:-' + lDel + 's;" cx="0" cy="0" r="' + coreR + '" fill="url(#dayNightTorchGlow)"/>');
                    out.push('        </g>');
                    lanCount++;
                }
            }
            for (var ld = 0; ld < decs.length && lanCount < 36; ld++) {
                var ldc = decs[ld];
                if (!ldc || (ldc.catalogId !== "cottage_timber" && ldc.catalogId !== "witch_hut")) continue;
                if (typeof this.isDecorCollidingWithRivers === "function" && this.isDecorCollidingWithRivers(ldc, rivers)) continue;
                var gradId = (ldc.catalogId === "witch_hut") ? "nightArcaneGlow" : "dayNightTorchGlow";
                var dDel = (atmoHash(ldc.x, ldc.y) * 2.2).toFixed(2);
                out.push('        <g transform="translate(' + Math.round(ldc.x) + ',' + Math.round(ldc.y + 3) + ')">');
                out.push('          <circle cx="0" cy="0" r="36" fill="url(#' + gradId + ')"/>');
                out.push('          <circle class="prs-torch-flicker" style="animation-delay:-' + dDel + 's;" cx="0" cy="0" r="11" fill="url(#' + gradId + ')"/>');
                out.push('        </g>');
                lanCount++;
            }
            out.push('      </g>');

            // Světlušky tančící nad noční krajinou
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
            out.push('    </g>');
        }

        out.push('  </g>');
        return out.join("\n");
    }
    });
})();
