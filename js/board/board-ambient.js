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

    }
    });
})();
