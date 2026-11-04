// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Herní Plán, Kamera, Zoom, SVG & Ambientní Částice
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    initMapPanAndZoom: function () {

        var self = this;

        var wrap = document.getElementById("board-viewport-wrap");

        if (!wrap) return;

                // Kolečko myši = plynulý zoom při Ctrl nebo při aktivním přiblížení; jinak přirozený posun stránky

        wrap.addEventListener("wheel", function (e) {

            var isZoomKey = e.ctrlKey || e.metaKey;

            var isZoomedIn = self.viewport.scale > (self.viewport.minScale + 0.03);

            if (!isZoomKey) {

                // Pokud je mapa v základním měřítku (100%) a točíme dolů, necháme stránku přirozeně scrollovat k hráčům pod deskou

                if (e.deltaY > 0 && !isZoomedIn) {

                    return;

                }

                // Pokud je stránka odscrollovaná dolů a točíme nahoru, necháme stránku přirozeně scrollovat nahoru k desce a liště

                if (e.deltaY < 0 && typeof window !== "undefined" && window.scrollY > 4) {

                    return;

                }

            }

            e.preventDefault();

            var rect = wrap.getBoundingClientRect();

            var mouseX = e.clientX - rect.left;

            var mouseY = e.clientY - rect.top;

            var delta = (e.deltaY < 0) ? 1.14 : 0.88;

            var newScale = Math.min(self.viewport.maxScale, Math.max(self.viewport.minScale, self.viewport.scale * delta));

            // Přepočet posunu tak, aby bod pod kurzorem zůstal na místě

            var scaleRatio = newScale / self.viewport.scale;

            self.viewport.panX = mouseX - (mouseX - self.viewport.panX) * scaleRatio;

            self.viewport.panY = mouseY - (mouseY - self.viewport.panY) * scaleRatio;

            self.viewport.scale = newScale;

            self.clampViewportPan();

            self.applyViewportTransform();

        }, { passive: false });

        wrap.addEventListener("dragstart", function (e) {

            e.preventDefault();

            return false;

        });

        // Tažení myší (Pan)

        wrap.addEventListener("mousedown", function (e) {

            if (e.button !== 0) return;

            // Zamezíme nativnímu drag&drop obrázků/textu prohlížečem

            if (e.target.tagName) {

                var tn = e.target.tagName.toLowerCase();

                if (tn === "image" || tn === "svg" || tn === "rect" || tn === "path" || tn === "line" || tn === "circle") {

                    e.preventDefault();

                }

            }

            self.viewport.isDragging = true;

            self.viewport.dragMoved = false;

            self.viewport.startX = e.clientX;

            self.viewport.startY = e.clientY;

            self.viewport.startPanX = self.viewport.panX;

            self.viewport.startPanY = self.viewport.panY;

            wrap.classList.add("is-panning");

        });

        window.addEventListener("mousemove", function (e) {

            if (!self.viewport.isDragging) return;

            var dx = e.clientX - self.viewport.startX;

            var dy = e.clientY - self.viewport.startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {

                self.viewport.dragMoved = true;

                if (e.cancelable) e.preventDefault();

            }

            self.viewport.panX = self.viewport.startPanX + dx;

            self.viewport.panY = self.viewport.startPanY + dy;

            self.clampViewportPan();

            self.applyViewportTransform();

        });

        window.addEventListener("mouseup", function () {

            if (self.viewport.isDragging) {

                self.viewport.isDragging = false;

                wrap.classList.remove("is-panning");

            }

        });

        // Podpora dotykového ovládání (mobil / tablet: Pan + Pinch-to-Zoom + Double-tap Focus)

        var lastTapTime = 0;

        wrap.addEventListener("touchstart", function (e) {

            if (e.touches.length === 1) {

                var now = Date.now();

                if (now - lastTapTime < 320) {

                    self.centerOnActivePlayer();

                    lastTapTime = 0;

                    if (e.cancelable) e.preventDefault();

                    return;

                }

                lastTapTime = now;

                self.viewport.isDragging = true;

                self.viewport.dragMoved = false;

                self.viewport.startX = e.touches[0].clientX;

                self.viewport.startY = e.touches[0].clientY;

                self.viewport.startPanX = self.viewport.panX;

                self.viewport.startPanY = self.viewport.panY;

            } else if (e.touches.length === 2) {

                self.viewport.isDragging = false;

                self.viewport.isPinching = true;

                var dx = e.touches[0].clientX - e.touches[1].clientX;

                var dy = e.touches[0].clientY - e.touches[1].clientY;

                self.viewport.pinchDist0 = Math.sqrt(dx * dx + dy * dy);

                self.viewport.pinchScale0 = self.viewport.scale;

                var rect = wrap.getBoundingClientRect();

                self.viewport.pinchCenterX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;

                self.viewport.pinchCenterY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;

                self.viewport.pinchPanX0 = self.viewport.panX;

                self.viewport.pinchPanY0 = self.viewport.panY;

                if (e.cancelable) e.preventDefault();

            }

        }, { passive: false });

        wrap.addEventListener("touchmove", function (e) {

            if (e.touches.length === 2 && self.viewport.isPinching) {

                if (e.cancelable) e.preventDefault();

                var dx = e.touches[0].clientX - e.touches[1].clientX;

                var dy = e.touches[0].clientY - e.touches[1].clientY;

                var dist1 = Math.sqrt(dx * dx + dy * dy);

                if (self.viewport.pinchDist0 > 0) {

                    var factor = dist1 / self.viewport.pinchDist0;

                    var newScale = Math.min(self.viewport.maxScale, Math.max(self.viewport.minScale, self.viewport.pinchScale0 * factor));

                    var ratio = newScale / self.viewport.pinchScale0;

                    var cx = self.viewport.pinchCenterX;

                    var cy = self.viewport.pinchCenterY;

                    self.viewport.panX = cx - (cx - self.viewport.pinchPanX0) * ratio;

                    self.viewport.panY = cy - (cy - self.viewport.pinchPanY0) * ratio;

                    self.viewport.scale = newScale;

                    self.clampViewportPan();

                    self.applyViewportTransform();

                }

            } else if (e.touches.length === 1 && self.viewport.isDragging) {

                var dx = e.touches[0].clientX - self.viewport.startX;

                var dy = e.touches[0].clientY - self.viewport.startY;

                if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {

                    self.viewport.dragMoved = true;

                    if (e.cancelable) e.preventDefault();

                }

                self.viewport.panX = self.viewport.startPanX + dx;

                self.viewport.panY = self.viewport.startPanY + dy;

                self.clampViewportPan();

                self.applyViewportTransform();

            }

        }, { passive: false });

        wrap.addEventListener("touchend", function (e) {

            if (e.touches.length < 2) {

                self.viewport.isPinching = false;

            }

            if (e.touches.length === 0) {

                self.viewport.isDragging = false;

            }

        });

    },

    clampViewportPan: function () {

        var wrap = document.getElementById("board-viewport-wrap");

        var svgEl = document.getElementById("prs-board-svg");

        if (!wrap) return;

        var w = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);

        var h = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);

        // Povolíme přirozené a velkorysé posouvání mapy myší do všech stran i při měřítku 100%

        var maxOffsetX = Math.max(500, w * Math.max(0.6, this.viewport.scale));

        var maxOffsetY = Math.max(350, h * Math.max(0.6, this.viewport.scale));

        this.viewport.panX = Math.min(maxOffsetX, Math.max(-maxOffsetX, this.viewport.panX));

        this.viewport.panY = Math.min(maxOffsetY, Math.max(-maxOffsetY, this.viewport.panY));

    },

    applyViewportTransform: function () {

        var g = document.getElementById("prs-board-stage");

        var lbl = document.getElementById("zoom-pct-label");

        var wrap = document.getElementById("board-viewport-wrap");

        var svgEl = document.getElementById("prs-board-svg");

        if (lbl) {

            lbl.textContent = Math.round(this.viewport.scale * 100) + " %";

        }

        if (!g || !wrap) return;

        // Převod pixelového posunu na souřadnice SVG (1400 x 860) měřený z reálné velikosti SVG

        var svgW = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);

        var svgH = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);

        var svgRatioX = 1400 / Math.max(1, svgW);

        var svgRatioY = 860 / Math.max(1, svgH);

        var tx = Math.round(this.viewport.panX * svgRatioX * 10) / 10;

        var ty = Math.round(this.viewport.panY * svgRatioY * 10) / 10;

        g.setAttribute("transform", "translate(" + tx + "," + ty + ") scale(" + this.viewport.scale.toFixed(3) + ")");

    },

    zoomBy: function (factor) {

        var wrap = document.getElementById("board-viewport-wrap");

        var cx = wrap ? wrap.clientWidth / 2 : 500;

        var cy = wrap ? wrap.clientHeight / 2 : 310;

        var newScale = Math.min(this.viewport.maxScale, Math.max(this.viewport.minScale, this.viewport.scale * factor));

        var ratio = newScale / this.viewport.scale;

        this.viewport.panX = cx - (cx - this.viewport.panX) * ratio;

        this.viewport.panY = cy - (cy - this.viewport.panY) * ratio;

        this.viewport.scale = newScale;

        this.clampViewportPan();

        this.applyViewportTransform();

    },

    resetZoomAndPan: function () {

        this.viewport.scale = 1.0;

        this.viewport.panX = 0;

        this.viewport.panY = 0;

        this.applyViewportTransform();

    },

    centerOnActivePlayer: function () {

        if (!this.state) return;

        var p = this.state.players[this.state.currentPlayerIndex];

        var nd = this.state.board.nodes[p.nodeId];

        var wrap = document.getElementById("board-viewport-wrap");

        if (!nd || !wrap) return;

        var isMobile = (this.deviceProfile && this.deviceProfile.device === "mobile");

        var targetScale = isMobile ? Math.max(1.20, Math.min(1.85, this.viewport.scale)) : Math.max(1.45, this.viewport.scale);

        this.viewport.scale = targetScale;

        var svgEl = document.getElementById("prs-board-svg");

        var svgW = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);

        var svgH = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);

        var svgRatioX = 1400 / Math.max(1, svgW);

        var svgRatioY = 860 / Math.max(1, svgH);

        // Bezpečné vycentrování na hráče s respektováním okrajů desky

        var tx = 700 - nd.x * targetScale;

        var ty = 430 - nd.y * targetScale;

        this.viewport.panX = tx / svgRatioX;

        this.viewport.panY = ty / svgRatioY;

        this.clampViewportPan();

        this.applyViewportTransform();

    },

    setSketchOverlayOpacity: function (val) {

        this.graphicsConfig.sketchOverlayOpacity = Number(val);

        var imgEl = document.getElementById("prs-sketch-overlay-img");

        if (imgEl) {

            imgEl.setAttribute("opacity", String(this.graphicsConfig.sketchOverlayOpacity));

        }

    },

    // ========================================================================

    // SPRÁVA BITMAP POLÍČEK, DOMINANT A HERNÍHO PROSTŘEDÍ

    // ========================================================================,

    loadSavedGraphicsConfig: function () {

        try {

            var raw = localStorage.getItem("prs_graphics_config");

            if (raw) {

                var parsed = JSON.parse(raw);

                if (parsed && typeof parsed === "object") {

                    if (parsed.environmentBgUrl) this.graphicsConfig.environmentBgUrl = parsed.environmentBgUrl;

                    if (parsed.boardBgUrl) this.graphicsConfig.boardBgUrl = parsed.boardBgUrl;

                    if (parsed.tileBitmapsByType) {

                        for (var k in parsed.tileBitmapsByType) {

                            var tVal = parsed.tileBitmapsByType[k];

                            if (tVal && typeof tVal === "string") {

                                if (tVal.endsWith(".jpg")) tVal = tVal.replace(".jpg", ".png");

                                this.graphicsConfig.tileBitmapsByType[k] = tVal;

                            }

                        }

                    }

                    if (!this.graphicsConfig.tileBitmapsByType.START || this.graphicsConfig.tileBitmapsByType.START.indexOf(".jpg") !== -1) {

                        this.graphicsConfig.tileBitmapsByType.START = "assets/tiles/castle.png";

                    }

                    if (!this.graphicsConfig.tileBitmapsByType.CASTLE || this.graphicsConfig.tileBitmapsByType.CASTLE.indexOf(".jpg") !== -1) {

                        this.graphicsConfig.tileBitmapsByType.CASTLE = "assets/tiles/castle.png";

                    }

                    if (parsed.landmarkBitmaps) {

                        for (var lk in parsed.landmarkBitmaps) {

                            var lVal = parsed.landmarkBitmaps[lk];

                            if (lVal && typeof lVal === "string") {

                                if (lVal.endsWith(".jpg")) lVal = lVal.replace(".jpg", ".png");

                                this.graphicsConfig.landmarkBitmaps[lk] = lVal;

                            }

                        }

                    }

                    if (parsed.decorBitmaps) {

                        if (!this.graphicsConfig.decorBitmaps) this.graphicsConfig.decorBitmaps = {};

                        for (var dk in parsed.decorBitmaps) {

                            this.graphicsConfig.decorBitmaps[dk] = parsed.decorBitmaps[dk];

                        }

                    }

                }

            }

        } catch (e) { }

        if (this.graphicsConfig && this.graphicsConfig.tileBitmapsByType) {

            if (!this.graphicsConfig.tileBitmapsByType.START || this.graphicsConfig.tileBitmapsByType.START.indexOf(".jpg") !== -1) {

                this.graphicsConfig.tileBitmapsByType.START = "assets/tiles/castle.png";

            }

            if (!this.graphicsConfig.tileBitmapsByType.CASTLE || this.graphicsConfig.tileBitmapsByType.CASTLE.indexOf(".jpg") !== -1) {

                this.graphicsConfig.tileBitmapsByType.CASTLE = "assets/tiles/castle.png";

            }

        }

        this.applyEnvironmentBackground();

    },

    applyEnvironmentBackground: function () {

        if (typeof document === "undefined" || !document.body) return;

        var envUrl = this.graphicsConfig.environmentBgUrl;

        if (envUrl && this.graphicsConfig.useCustomEnvBg) {

            document.body.style.backgroundImage = "linear-gradient(rgba(12,10,8,0.72), rgba(12,10,8,0.85)), url('" + envUrl + "')";

            document.body.style.backgroundSize = "cover";

            document.body.style.backgroundAttachment = "fixed";

        } else {

            document.body.style.backgroundImage = "";

        }

    },

    // Vrátí URL bitmapy pro konkrétní kruhové políčko (pokud je nastavena),

    getTileBitmapUrl: function (node) {

        if (!node || !this.graphicsConfig) return "";

        if (this.graphicsConfig.tileBitmapsByCode && this.graphicsConfig.tileBitmapsByCode[node.code]) {

            return this.graphicsConfig.tileBitmapsByCode[node.code];

        }

        var byType = this.graphicsConfig.tileBitmapsByType || {};

        var url = "";

        if (node.subtype && byType[node.subtype]) {

            url = byType[node.subtype];

        } else if (byType[node.type]) {

            url = byType[node.type];

        }

        if (!url && (node.type === "START" || node.type === "CASTLE" || node.code === "START")) {

            url = "assets/tiles/castle.png";

        }

        if (url && typeof url === "string") {

            if (url.endsWith(".jpg")) url = url.replace(".jpg", ".png");

            // Na pravé polovině plánu zrcadlit směrová zvířata a draky

            if (node.x > 700 && (node.subtype === "kun" || node.subtype === "pes" || node.subtype === "sokol" || node.subtype === "U3")) {

                var flipUrl = url.replace(".png", "_flip.png");

                return flipUrl;

            }

        }

        return url;

    },

    getBoardDefsSVG: function () {

        var th = this.currentTheme || "light";

        var themePalettes = {

            light: { c0: "#fef08a", c1: "#d4af37", c2: "#854d0e", stroke: "#d4af37", glow: "rgba(250,204,21,0.55)" },

            fire:  { c0: "#fed7aa", c1: "#f97316", c2: "#9a3412", stroke: "#ea580c", glow: "rgba(239,68,68,0.65)" },

            water: { c0: "#bae6fd", c1: "#38bdf8", c2: "#0369a1", stroke: "#0284c7", glow: "rgba(14,165,233,0.65)" },

            earth: { c0: "#a7f3d0", c1: "#10b981", c2: "#065f46", stroke: "#059669", glow: "rgba(34,197,94,0.65)" },

            air:   { c0: "#ede9fe", c1: "#c084fc", c2: "#6b21a8", stroke: "#9333ea", glow: "rgba(168,85,247,0.65)" }

        };

        var activePalette = themePalettes[th] || themePalettes.light;

        return '<defs>' +

            '<radialGradient id="parchmentGrad" cx="50%" cy="48%" r="72%">' +

            '  <stop offset="0%" stop-color="#32261b" />' +

            '  <stop offset="65%" stop-color="#221a12" />' +

            '  <stop offset="100%" stop-color="#140f0a" />' +

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

            '</defs>';

    },

    renderBoardSVG: function () {

        var svg = document.getElementById("prs-board-svg");

        if (!svg || !this.state) return;

        var stage = document.getElementById("prs-board-stage");

        var staticLayer = document.getElementById("prs-static-layer");

        var tokensLayer = document.getElementById("prs-tokens-layer");

        if (!stage || !staticLayer || !tokensLayer) {

            var wrap = document.getElementById("board-viewport-wrap");

            var svgRatioX = 1400 / Math.max(1, wrap ? wrap.clientWidth : 1000);

            var svgRatioY = 860 / Math.max(1, wrap ? wrap.clientHeight : 620);

            var tx = Math.round(this.viewport.panX * svgRatioX * 10) / 10;

            var ty = Math.round(this.viewport.panY * svgRatioY * 10) / 10;

            svg.innerHTML = this.getBoardDefsSVG() +

                '<g id="prs-board-stage" transform="translate(' + tx + ',' + ty + ') scale(' + this.viewport.scale.toFixed(3) + ')">' +

                '  <g id="prs-static-layer"></g>' +

                '  <g id="prs-tokens-layer"></g>' +

                '</g>';

            staticLayer = document.getElementById("prs-static-layer");

            tokensLayer = document.getElementById("prs-tokens-layer");

        } else {

            var defsEl = svg.querySelector("defs");

            if (defsEl) {

                var tempDiv = document.createElement("div");

                tempDiv.innerHTML = '<svg>' + this.getBoardDefsSVG() + '</svg>';

                var newDefs = tempDiv.querySelector("defs");

                if (newDefs) defsEl.innerHTML = newDefs.innerHTML;

            }

        }

        if (staticLayer && (this.isBoardStaticDirty || !staticLayer.hasChildNodes())) {

            staticLayer.innerHTML = this.renderBoardStaticHTML();

            this.isBoardStaticDirty = false;

        }

        this.renderBoardTokens();

    },

    renderBoardTokens: function () {

        var tokensLayer = document.getElementById("prs-tokens-layer");

        if (!tokensLayer || !this.state) return;

        tokensLayer.innerHTML = this.renderBoardTokensHTML();

    },

    renderBoardStaticHTML: function () {

        var nodes = this.state.board.nodes;

        var cardZones = this.state.board.cardZones || [];

        var landmarks = this.state.board.landmarks || [];

        var out = [];

        var th = this.currentTheme || "light";

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

            out.push('  <image href="' + this.escapeHtml(this.graphicsConfig.boardBgUrl) + '" x="4" y="4" width="1392" height="852" preserveAspectRatio="xMidYMid slice" opacity="0.88" style="filter: var(--board-filter, none);" />');

        }

        // Rohové kování desky

        var corners = [[18, 18], [1382, 18], [18, 842], [1382, 842]];

        for (var ci = 0; ci < corners.length; ci++) {

            var ccx = corners[ci][0];

            var ccy = corners[ci][1];

            out.push('  <circle cx="' + ccx + '" cy="' + ccy + '" r="7" fill="' + activePalette.stroke + '" stroke="#000" stroke-width="1.2"/>');

            out.push('  <circle cx="' + ccx + '" cy="' + ccy + '" r="2" fill="#fff" opacity="0.8"/>');

        }

        // Skládací přehyby trojdílného plánu

        out.push('  <line x1="466" y1="16" x2="466" y2="844" stroke="rgba(212,175,55,0.14)" stroke-width="1.5" stroke-dasharray="8,8" />');

        out.push('  <line x1="933" y1="16" x2="933" y2="844" stroke="rgba(212,175,55,0.14)" stroke-width="1.5" stroke-dasharray="8,8" />');

        out.push('  <rect x="14" y="14" width="1372" height="832" rx="16" fill="none" stroke="rgba(212,175,55,0.25)" stroke-width="1.5"/>');

        // 2. Plastické 3D balíčky karet na plánu (Interactive Card Decks)

        for (var cz = 0; cz < cardZones.length; cz++) {

            var z = cardZones[cz];

            var col = z.color || "#d4af37";

            var icon = z.icon || "🃏";

            var cnt = z.count || (z.actionTier ? (z.actionTier === 1 ? 9 : (z.actionTier === 2 ? 7 : 4)) : 10);

            out.push('  <g class="board-card-deck-3d" data-zone-code="' + z.code + '" transform="translate(' + z.x + ',' + z.y + ')" onclick="PRS_App.inspectCardZone(\'' + z.code + '\')" style="cursor:pointer;">');

            out.push('    <title>Klikni pro náhled a pravidla balíčku ' + this.escapeHtml(z.title) + '</title>');

            // 3D spodní stín a vrstvy karet pod balíčkem

            out.push('    <rect x="4" y="6" width="' + z.w + '" height="' + z.h + '" rx="9" fill="rgba(0,0,0,0.52)"/>');

            out.push('    <rect x="-3" y="3" width="' + z.w + '" height="' + z.h + '" rx="8" fill="#1c1612" stroke="#4a3728" stroke-width="1.2"/>');

            out.push('    <rect x="-1.5" y="1.5" width="' + z.w + '" height="' + z.h + '" rx="8" fill="#2d221a" stroke="#6b5038" stroke-width="1.2"/>');

            // Vrchní lícová karta balíčku

            out.push('    <rect class="deck-top-card" x="0" y="0" width="' + z.w + '" height="' + z.h + '" rx="8" fill="#241b16" stroke="' + col + '" stroke-width="1.8"/>');

            out.push('    <rect x="3.5" y="3.5" width="' + (z.w - 7) + '" height="' + (z.h - 7) + '" rx="5.5" fill="none" stroke="rgba(212,175,55,0.35)" stroke-width="0.9" stroke-dasharray="6,3"/>');

            // Středový erb / ikona balíčku

            var cyIcon = Math.round(z.h * 0.38);

            out.push('    <circle cx="' + (z.w / 2) + '" cy="' + cyIcon + '" r="19" fill="rgba(0,0,0,0.6)" stroke="' + col + '" stroke-width="1.3"/>');

            out.push('    <text x="' + (z.w / 2) + '" y="' + (cyIcon + 6) + '" text-anchor="middle" font-size="17" style="user-select:none;">' + icon + '</text>');

            // Název balíčku

            var cyTitle = Math.round(z.h * 0.68);

            out.push('    <text x="' + (z.w / 2) + '" y="' + cyTitle + '" text-anchor="middle" fill="#fef08a" font-family="Cinzel, serif" font-size="11.5" font-weight="bold">' + this.escapeHtml(z.title) + '</text>');

            // Podtitul / cena nebo obtížnost

            var cySub = Math.round(z.h - 10);

            out.push('    <rect x="' + Math.round(z.w / 2 - 40) + '" y="' + (cySub - 10) + '" width="80" height="14" rx="4" fill="rgba(0,0,0,0.65)" stroke="rgba(212,175,55,0.25)" stroke-width="0.8"/>');

            out.push('    <text x="' + (z.w / 2) + '" y="' + cySub + '" text-anchor="middle" fill="#cbd5e1" font-size="8.5" font-weight="600">' + this.escapeHtml(z.subtitle) + '</text>');

            // Odznak s počtem karet v balíčku (pravý horní roh)

            out.push('    <g transform="translate(' + (z.w - 12) + ', 7)">');

            out.push('      <rect x="-14" y="-5" width="22" height="12" rx="3.5" fill="#0f172a" stroke="' + col + '" stroke-width="0.9"/>');

            out.push('      <text x="-3" y="4" text-anchor="middle" fill="#f8fafc" font-size="7.5" font-weight="bold">' + cnt + '</text>');

            out.push('    </g>');

            out.push('  </g>');

        }

        // 3. Dominanty království (Královský Hrad, Drak, Hrady a Citadely)

        for (var lm = 0; lm < landmarks.length; lm++) {

            var lmk = landmarks[lm];

            var customLmUrl = lmk.image || ((this.graphicsConfig && this.graphicsConfig.landmarkBitmaps && this.graphicsConfig.landmarkBitmaps[lmk.id]) ? this.graphicsConfig.landmarkBitmaps[lmk.id] : "");

            if (customLmUrl && customLmUrl.indexOf(".jpg") !== -1) {

                customLmUrl = customLmUrl.replace(".jpg", ".png");

            }

            // Zrcadlení draka a dominant pokud stojí na pravé polovině plánu (pohled do středu)

            if ((lmk.x > 700 || lmk.isFlipped) && customLmUrl && customLmUrl.indexOf("_flip") === -1) {

                if (customLmUrl.indexOf("dragon") !== -1 || lmk.id === "dragonLair") {

                    customLmUrl = customLmUrl.replace(".png", "_flip.png");

                }

            }

            out.push('  <g class="board-landmark" transform="translate(' + (lmk.x - lmk.w / 2) + ',' + (lmk.y - lmk.h / 2) + ')">');

            if (customLmUrl) {

                // Průsvitná 3D izometrická ilustrace hradu nebo draka (přirozeně posazená na mapě bez plovoucího stínu)

                out.push('    <image href="' + this.escapeHtml(customLmUrl) + '" x="0" y="0" width="' + lmk.w + '" height="' + (lmk.h - 10) + '" preserveAspectRatio="xMidYMid contain"/>');

                if (lmk.id === "royalCastle") {

                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', 22)">');

                    out.push('      <circle cx="0" cy="0" r="14" fill="rgba(236,72,153,0.3)" stroke="#ec4899" stroke-width="1.4">');

                    out.push('        <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite"/>');

                    out.push('        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>');

                    out.push('      </circle>');

                    out.push('      <text x="0" y="5" text-anchor="middle" font-size="14">💖</text>');

                    out.push('    </g>');

                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', ' + (lmk.h - 14) + ')">');

                    out.push('      <rect x="-115" y="-13" width="230" height="26" rx="13" fill="rgba(18,12,8,0.92)" stroke="' + activePalette.stroke + '" stroke-width="1.6" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.7))"/>');

                    out.push('      <text x="0" y="5" text-anchor="middle" fill="#f472b6" font-size="11.5" font-weight="bold">♡ PRINCEZNINO SRDCE (' + this.state.config.targetHearts + ' 💖) ♡</text>');

                    out.push('    </g>');

                } else {

                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', ' + (lmk.h - 12) + ')">');

                    out.push('      <rect x="-85" y="-11" width="170" height="22" rx="11" fill="rgba(16,10,6,0.90)" stroke="' + activePalette.stroke + '" stroke-width="1.2" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.7))"/>');

                    out.push('      <text x="0" y="4" text-anchor="middle" fill="#fef08a" font-family="Cinzel, serif" font-size="10" font-weight="bold">' + this.escapeHtml(lmk.name) + '</text>');

                    out.push('    </g>');

                }

            } else if (lmk.id === "royalCastle") {

                out.push('    <rect x="10" y="18" width="' + (lmk.w - 20) + '" height="' + (lmk.h - 24) + '" rx="16" fill="rgba(36,27,19,0.82)" stroke="rgba(212,175,55,0.48)" stroke-width="2"/>');

                out.push('    <polygon points="35,45 55,10 75,45" fill="#991b1b" stroke="#d4af37" stroke-width="1.5"/>');

                out.push('    <polygon points="' + (lmk.w / 2 - 28) + ',42 ' + (lmk.w / 2) + ',2 ' + (lmk.w / 2 + 28) + ',42" fill="#b91c1c" stroke="#d4af37" stroke-width="1.8"/>');

                out.push('    <polygon points="' + (lmk.w - 75) + ',45 ' + (lmk.w - 55) + ',10 ' + (lmk.w - 35) + ',45" fill="#991b1b" stroke="#d4af37" stroke-width="1.5"/>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="76" text-anchor="middle" font-size="36">🏰</text>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="102" text-anchor="middle" fill="#f3e5ab" font-family="Cinzel, serif" font-size="14" font-weight="bold">KRÁLOVSKÝ HRAD</text>');

                out.push('    <text x="' + (lmk.w / 2) + '" y="121" text-anchor="middle" fill="#f472b6" font-size="11.5" font-weight="bold">♡ PRINCEZNINO SRDCE (' + this.state.config.targetHearts + ' 💖) ♡</text>');

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

                // 1. Spodní stín/příkop cesty

                out.push('  <path d="' + pthD + '" stroke="rgba(12,9,6,0.88)" stroke-width="13" stroke-linecap="round" fill="none"/>');

                // 2. Kamenný dlážděný pruh

                out.push('  <path d="' + pthD + '" stroke="rgba(180,140,85,0.48)" stroke-width="8.5" stroke-linecap="round" fill="none"/>');

                // 3. Vnitřní vyježděná stopa

                var trackColor = targets[t].isBranch ? targets[t].color : 'rgba(253,224,71,0.52)';

                var trackWidth = targets[t].isBranch ? '3.5' : '4.2';

                var trackDash = targets[t].isBranch ? '4,4' : '6,5';

                out.push('  <path d="' + pthD + '" stroke="' + trackColor + '" stroke-width="' + trackWidth + '" stroke-dasharray="' + trackDash + '" stroke-linecap="round" fill="none"/>');

                // Bod uprostřed křivky (t = 0.5)

                var midCurveX = Math.round(0.25 * n.x + 0.5 * qx + 0.25 * targetNode.x);

                var midCurveY = Math.round(0.25 * n.y + 0.5 * qy + 0.25 * targetNode.y);

                var angle = Math.round(Math.atan2(targetNode.y - n.y, targetNode.x - n.x) * 180 / Math.PI);

                // Směrové šipky na běžných cestách

                if (!targets[t].isBranch && dist > 35) {

                    out.push('  <g transform="translate(' + midCurveX + ',' + midCurveY + ') rotate(' + angle + ')">');

                    out.push('    <polygon points="-4,-3 3,0 -4,3" fill="rgba(253,224,71,0.85)" stroke="#78350f" stroke-width="0.7"/>');

                    out.push('  </g>');

                }

                // Heraldický milník rozcestníku (1–3 vs 4–6)

                if (targets[t].label) {

                    out.push('  <g transform="translate(' + midCurveX + ',' + midCurveY + ')">');

                    out.push('    <rect x="-18" y="-9.5" width="36" height="19" rx="5" fill="#14100c" stroke="' + targets[t].color + '" stroke-width="1.4" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.8));"/>');

                    out.push('    <text x="0" y="3.8" text-anchor="middle" fill="' + targets[t].color + '" font-size="9" font-weight="bold">' + (targets[t].label === "1–3" ? '⚀⚁⚂ ' : '⚃⚄⚅ ') + targets[t].label + '</text>');

                    out.push('  </g>');

                }

            }

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

            out.push('  <g id="prs-decor-layer">');

            var decs = this.state.board.decorations;

            for (var d = 0; d < decs.length; d++) {

                var dec = decs[d];

                var cat = window.PRS_DECOR_CATALOG ? window.PRS_DECOR_CATALOG[dec.catalogId] : null;

                var decorUrl = (this.graphicsConfig && this.graphicsConfig.decorBitmaps && this.graphicsConfig.decorBitmaps[dec.catalogId])

                    ? this.graphicsConfig.decorBitmaps[dec.catalogId]

                    : (cat ? (dec.isFlipped && cat.imgFlip ? cat.imgFlip : cat.img) : "");

                if (decorUrl) {

                    if (dec.isFlipped && decorUrl.indexOf("_flip") === -1 && cat && cat.imgFlip) {

                        decorUrl = cat.imgFlip;

                    }

                    var sc = dec.scale || 1;

                    out.push('    <g class="board-decor-item" data-catalog-id="' + dec.catalogId + '" transform="translate(' + dec.x + ',' + dec.y + ') scale(' + sc + ')" onclick="PRS_App.handleDecorClick(\'' + dec.catalogId + '\', ' + dec.x + ', ' + dec.y + ', event)" style="cursor:pointer;">');

                    out.push('      <image href="' + this.escapeHtml(decorUrl) + '" x="' + (-dec.w / 2) + '" y="' + (-dec.h / 2) + '" width="' + dec.w + '" height="' + dec.h + '" preserveAspectRatio="xMidYMid contain"/>');

                    out.push('    </g>');

                } else if (cat && cat.renderSVG) {

                    var sc = dec.scale || 1;

                    out.push('    <g class="board-decor-item" data-catalog-id="' + dec.catalogId + '" transform="translate(' + dec.x + ',' + dec.y + ') scale(' + sc + ')">');

                    out.push(cat.renderSVG());

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

            var shortCode = nd.code.replace("BLD_", "").replace("SLAV_", "").replace("_OUT", "").replace("_BR1", "").replace("_BR2", "").replace("_R1", "").replace("_R2", "").replace("_L1", "");

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

            // 3D Vlající praporek vlastnictví u obsazených políček v barvě daného hráče

            if (nd.owner !== null && this.state.players[nd.owner]) {

                var ownerP = this.state.players[nd.owner];

                out.push('    <g class="tile-ownership-flag" transform="translate(' + (nd.x + r - 3) + ',' + (nd.y - r - 8) + ')">');

                out.push('      <line x1="0" y1="-2" x2="0" y2="25" stroke="#fcd34d" stroke-width="2" stroke-linecap="round"/>');

                out.push('      <line x1="-0.8" y1="-2" x2="-0.8" y2="25" stroke="#78350f" stroke-width="0.8"/>');

                out.push('      <polygon points="0,-6 -2.5,-1 2.5,-1" fill="#fde047" stroke="#b45309" stroke-width="0.6"/>');

                out.push('      <path d="M 0 0 C 6 -3, 12 3, 19 0 L 15 7 L 19 14 C 12 11, 6 17, 0 14 Z" fill="' + ownerP.color + '" stroke="#ffffff" stroke-width="1.1" style="filter:drop-shadow(0 3px 3px rgba(0,0,0,0.7));"/>');

                out.push('      <path d="M 0 0 C 6 -3, 12 3, 19 0 L 15 3.5 L 0 3.5 Z" fill="rgba(255,255,255,0.25)"/>');

                out.push('      <text x="8" y="9.5" text-anchor="middle" fill="#ffffff" font-size="7.5" font-weight="bold" font-family="Cinzel, serif">' + (ownerP.index + 1) + '</text>');

                out.push('    </g>');

            }

            out.push('  </g>');

        }

        return out.join("\n");

    },

    renderBoardTokensHTML: function () {

        var nodes = this.state.board.nodes;

        var out = [];

        var activePlayer = (this.state.players && this.state.players[this.state.currentPlayerIndex]) ? this.state.players[this.state.currentPlayerIndex] : null;

        var activeNodeId = activePlayer ? activePlayer.nodeId : null;

        // 1. Zvýraznění vybraného / zkoumaného políčka (Inspected Node Halo)

        if (this.selectedNodeId !== null && this.selectedNodeId !== undefined && this.selectedNodeId !== activeNodeId) {

            var selNode = nodes[this.selectedNodeId];

            if (selNode) {

                var selMajor = (selNode.type === "START" || selNode.type === "FESTIVAL" || selNode.type === "CASTLE" || (selNode.type === "QUEST" && selNode.subtype === "U3"));

                var selR = selMajor ? 21 : 16.5;

                out.push('  <g class="inspected-tile-halo" style="pointer-events:none;">');

                out.push('    <circle cx="' + selNode.x + '" cy="' + selNode.y + '" r="' + (selR + 5.5) + '" fill="none" stroke="#38bdf8" stroke-width="3.2" stroke-dasharray="4,2"/>');

                out.push('  </g>');

            }

        }

        // 2. Pulzující zlatý lem a štítek "ZDE STOJÍŠ" pro políčko aktivního hráče

        if (activePlayer) {

            var standNode = nodes[activePlayer.nodeId];

            if (standNode) {

                var standMajor = (standNode.type === "START" || standNode.type === "FESTIVAL" || standNode.type === "CASTLE" || (standNode.type === "QUEST" && standNode.subtype === "U3"));

                var standR = standMajor ? 21 : 16.5;

                out.push('  <g class="active-standing-marker" style="pointer-events:none;">');

                out.push('    <circle cx="' + standNode.x + '" cy="' + standNode.y + '" r="' + (standR + 7.5) + '" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5,3" opacity="0.95">');

                out.push('      <animateTransform attributeName="transform" type="rotate" from="0 ' + standNode.x + ' ' + standNode.y + '" to="360 ' + standNode.x + ' ' + standNode.y + '" dur="12s" repeatCount="indefinite"/>');

                out.push('    </circle>');

                out.push('    <circle cx="' + standNode.x + '" cy="' + standNode.y + '" r="' + (standR + 4) + '" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.9"/>');

                out.push('    <g transform="translate(' + standNode.x + ',' + (standNode.y - standR - 15) + ')">');

                out.push('      <rect x="-24" y="-12" width="48" height="15" rx="5" fill="#b45309" stroke="#fbbf24" stroke-width="1.2"/>');

                out.push('      <text x="0" y="-1" text-anchor="middle" fill="#fff" font-size="8.5" font-weight="bold">ZDE STOJÍŠ</text>');

                out.push('      <polygon points="-4,3 0,7 4,3" fill="#fbbf24"/>');

                out.push('    </g>');

                out.push('  </g>');

            }

        }

        var playersByNode = {};

        for (var k = 0; k < this.state.players.length; k++) {

            var pl = this.state.players[k];

            if (!playersByNode[pl.nodeId]) playersByNode[pl.nodeId] = [];

            playersByNode[pl.nodeId].push(pl);

        }

        for (var nid in playersByNode) {

            var pList = playersByNode[nid];

            var hostNode = nodes[Number(nid)];

            if (!hostNode) continue;

            // Seřadíme figurky tak, aby aktivní hráč byl vykreslen jako poslední (v popředí a s plně viditelnou zlatou aurou)

            var actIdx = this.state.currentPlayerIndex;

            pList.sort(function (a, b) {

                if (a.index === actIdx) return 1;

                if (b.index === actIdx) return -1;

                return a.index - b.index;

            });

            var count = pList.length;

            for (var m = 0; m < count; m++) {

                var tokenPlayer = pList[m];

                var isAct = (tokenPlayer.index === actIdx);

                var isCurrentlyJumping = (this.isMoveAnimating && this.animatingPlayerIndex === tokenPlayer.index && this.animTokenPos);

                var txToken, tyToken, groundY;

                if (isCurrentlyJumping) {

                    txToken = this.animTokenPos.x;

                    tyToken = this.animTokenPos.y;

                    groundY = hostNode.y - 4;

                } else {

                    var dx = 0;

                    var dy = -16;

                    if (count === 1) {

                        dx = 0;

                        dy = -16;

                    } else if (count === 2) {

                        dx = (m === 0) ? -13.5 : 13.5;

                        dy = (m === 0) ? -17 : -15;

                    } else if (count === 3) {

                        if (m === 0) { dx = 0; dy = -25; }

                        else if (m === 1) { dx = -15; dy = -11; }

                        else { dx = 15; dy = -11; }

                    } else if (count === 4) {

                        if (m === 0) { dx = -14; dy = -24; }

                        else if (m === 1) { dx = 14; dy = -24; }

                        else if (m === 2) { dx = -14; dy = -8; }

                        else { dx = 14; dy = -8; }

                    } else {

                        var angle = (m / count) * Math.PI * 2;

                        dx = Math.cos(angle) * 20;

                        dy = -16 + Math.sin(angle) * 16;

                    }

                    txToken = Math.round(hostNode.x + dx);

                    tyToken = Math.round(hostNode.y + dy);

                    groundY = tyToken + 12;

                }

                out.push('  <g class="knight-token-group" data-player-index="' + tokenPlayer.index + '" style="pointer-events:auto; cursor:pointer;" ' +

                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + tokenPlayer.index + ')" ' +

                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +

                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +

                    'onclick="PRS_App.selectPlayerToInspect(' + tokenPlayer.index + ')">');

                out.push('    <title>' + this.escapeHtml(tokenPlayer.name) + ': ' + tokenPlayer.totalHearts + ' 💖 | ' + tokenPlayer.gold.toLocaleString("cs-CZ") + ' zl.</title>');

                // 1. Pozemní oválný stín pod figurkou

                var shadowRx = isCurrentlyJumping ? 7.0 : 10.5;

                var shadowRy = isCurrentlyJumping ? 3.0 : 4.5;

                out.push('    <ellipse cx="' + txToken + '" cy="' + groundY + '" rx="' + shadowRx + '" ry="' + shadowRy + '" fill="rgba(0,0,0,0.48)"/>');

                // 2. Rotující sluneční aura a královský ukazatel aktivního hráče

                if (isAct) {

                    out.push('    <g transform="translate(' + txToken + ',' + (tyToken - 4) + ')">');

                    out.push('      <circle cx="0" cy="0" r="21" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.95">');

                    out.push('        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>');

                    out.push('      </circle>');

                    out.push('      <circle cx="0" cy="0" r="16" fill="none" stroke="#f59e0b" stroke-width="1.2" opacity="0.6"/>');

                    out.push('      <g>');

                    out.push('        <polygon points="0,-27 -5,-21 5,-21" fill="#fbbf24" stroke="#d97706" stroke-width="0.8">');

                    out.push('          <animate attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="1.2s" repeatCount="indefinite"/>');

                    out.push('        </polygon>');

                    out.push('      </g>');

                    out.push('    </g>');

                }

                // 3. Kovový zkosený podstavec figurky

                out.push('    <ellipse cx="' + txToken + '" cy="' + (tyToken + 8) + '" rx="13" ry="5.5" fill="url(#pedestalGrad)" stroke="#d4af37" stroke-width="1.2"/>');

                // 4. Busta rytířské přilbice (uzavřené hledí s průzorem a chocholem v barvě hráče)

                out.push('    <path d="M ' + (txToken - 8) + ' ' + (tyToken + 5) + ' C ' + (txToken - 9) + ' ' + (tyToken - 4) + ' ' + (txToken - 6) + ' ' + (tyToken - 13) + ' ' + txToken + ' ' + (tyToken - 14) + ' C ' + (txToken + 6) + ' ' + (tyToken - 13) + ' ' + (txToken + 9) + ' ' + (tyToken - 4) + ' ' + (txToken + 8) + ' ' + (tyToken + 5) + ' Z" fill="#475569" stroke="#cbd5e1" stroke-width="1"/>');

                out.push('    <path d="M ' + (txToken - 5) + ' ' + (tyToken - 4) + ' Q ' + txToken + ' ' + (tyToken - 2) + ' ' + (txToken + 5) + ' ' + (tyToken - 4) + '" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>');

                // Vlající chochol (plume)

                out.push('    <path d="M ' + txToken + ' ' + (tyToken - 14) + ' Q ' + (txToken - 8) + ' ' + (tyToken - 23) + ' ' + (txToken - 1) + ' ' + (tyToken - 25) + ' Q ' + (txToken + 4) + ' ' + (tyToken - 20) + ' ' + (txToken + 1) + ' ' + (tyToken - 14) + '" fill="' + tokenPlayer.color + '" stroke="#ffffff" stroke-width="1" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5));"/>');

                // 5. Rytířský štít s číslem hráče v popředí

                var shXl = txToken - 8.5;

                var shXr = txToken + 8.5;

                var shXm = txToken;

                var shYtop = tyToken - 1;

                var shYmid = tyToken + 7;

                var shYcrv = tyToken + 13.5;

                var shYbot = tyToken + 16;

                out.push('    <path d="M ' + shXl + ' ' + shYtop + ' L ' + shXr + ' ' + shYtop + ' L ' + shXr + ' ' + shYmid + ' Q ' + shXr + ' ' + shYcrv + ' ' + shXm + ' ' + shYbot + ' Q ' + shXl + ' ' + shYcrv + ' ' + shXl + ' ' + shYmid + ' Z" fill="' + tokenPlayer.color + '" stroke="#ffffff" stroke-width="1.4" filter="url(#glowFilter)"/>');

                out.push('    <text x="' + txToken + '" y="' + (tyToken + 9.5) + '" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold" font-family="Cinzel, serif">' + (tokenPlayer.index + 1) + '</text>');

                out.push('  </g>');

            }

        }

        // 5. Aktivní plovoucí hláška nad figurkou (Toast Bubble)

        if (this.activePawnToast) {

            var t = this.activePawnToast;

            out.push('  <g class="pawn-toast-bubble" transform="translate(' + t.x + ',' + t.y + ')" style="pointer-events:none;">');

            out.push('    <rect x="-75" y="-22" width="150" height="26" rx="13" fill="' + t.bg + '" stroke="' + t.color + '" stroke-width="1.6" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.75))"/>');

            out.push('    <text x="0" y="-5" text-anchor="middle" fill="' + t.color + '" font-size="10.5" font-weight="bold" font-family="Cinzel, serif">' + this.escapeHtml(t.icon + ' ' + t.text) + '</text>');

            out.push('  </g>');

        }

        // 6. Aktivní bublina prozkoumané dekorace (Living Terrain Tooltip)

        if (this.activeDecorTooltip) {

            var dt = this.activeDecorTooltip;

            var bx = dt.x, by = dt.y;

            if (bx < 125) bx = 125;

            if (bx > 1275) bx = 1275;

            if (by < 70) by = 70;

            var descLines = this.wrapText(dt.desc, 44);

            var l1 = descLines[0] || "";

            var l2 = descLines[1] || "";

            var boxH = l2 ? 54 : 42;

            out.push('  <g class="board-decor-tooltip" transform="translate(' + bx + ',' + by + ')" style="cursor:pointer;" onclick="PRS_App.dismissDecorTooltip(event)">');

            out.push('    <rect x="-115" y="' + (-boxH) + '" width="230" height="' + boxH + '" rx="8" fill="rgba(20, 16, 12, 0.96)" stroke="#fbbf24" stroke-width="1.5"/>');

            out.push('    <polygon points="-6,0 0,6 6,0" fill="#fbbf24"/>');

            out.push('    <text x="0" y="' + (-boxH + 16) + '" text-anchor="middle" fill="#fef08a" font-family="Cinzel, serif" font-size="11" font-weight="bold">' + this.escapeHtml(dt.icon + ' ' + dt.name) + '</text>');

            out.push('    <text x="0" y="' + (-boxH + 30) + '" text-anchor="middle" fill="#cbd5e1" font-size="8.5">' + this.escapeHtml(l1) + '</text>');

            if (l2) {

                out.push('    <text x="0" y="' + (-boxH + 43) + '" text-anchor="middle" fill="#94a3b8" font-size="8">' + this.escapeHtml(l2) + '</text>');

            }

            out.push('  </g>');

        }

        return out.join("\n");

    },

    renderNodeSilhouette: function (nd, r, fill, stroke, strokeWidth, isMajor, shortCode, bmpUrl) {

        var out = [];

        if (nd.type === "START") {

            // Královský erbovní štít

            var startPth = 'M ' + (nd.x - 22) + ' ' + (nd.y - 20) + ' L ' + (nd.x + 22) + ' ' + (nd.y - 20) + ' L ' + (nd.x + 22) + ' ' + (nd.y + 4) + ' Q ' + (nd.x + 22) + ' ' + (nd.y + 24) + ' ' + nd.x + ' ' + (nd.y + 28) + ' Q ' + (nd.x - 22) + ' ' + (nd.y + 24) + ' ' + (nd.x - 22) + ' ' + (nd.y + 4) + ' Z';

            out.push('    <path d="' + startPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "FESTIVAL") {

            // Zamilované srdcové turnajové pole

            var festPth = 'M ' + nd.x + ' ' + (nd.y + 20) + ' C ' + (nd.x - 25) + ' ' + (nd.y + 4) + ' ' + (nd.x - 24) + ' ' + (nd.y - 18) + ' ' + (nd.x - 10) + ' ' + (nd.y - 18) + ' C ' + (nd.x - 2) + ' ' + (nd.y - 18) + ' ' + nd.x + ' ' + (nd.y - 9) + ' ' + nd.x + ' ' + (nd.y - 8) + ' C ' + nd.x + ' ' + (nd.y - 9) + ' ' + (nd.x + 2) + ' ' + (nd.y - 18) + ' ' + (nd.x + 10) + ' ' + (nd.y - 18) + ' C ' + (nd.x + 24) + ' ' + (nd.y - 18) + ' ' + (nd.x + 25) + ' ' + (nd.y + 4) + ' ' + nd.x + ' ' + (nd.y + 20) + ' Z';

            out.push('    <path d="' + festPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "CASTLE" || nd.type === "TOWN") {

            // Opevněný 8-úhelníkový hradní a městský polygon

            var octPts = [];

            var rad = (nd.type === "CASTLE") ? 22 : 18.5;

            for (var a = 0; a < 8; a++) {

                var ang = a * Math.PI / 4 + Math.PI / 8;

                octPts.push(Math.round(nd.x + Math.cos(ang) * rad) + ',' + Math.round(nd.y + Math.sin(ang) * rad));

            }

            out.push('    <polygon points="' + octPts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "QUEST") {

            // Kosočtvercová 4-cípá rytířská hvězda

            var qRad = isMajor ? 24 : 19;

            var qPth = 'M ' + nd.x + ' ' + (nd.y - qRad - 3) + ' L ' + Math.round(nd.x + qRad * 0.6) + ' ' + Math.round(nd.y - qRad * 0.6) +

                       ' L ' + (nd.x + qRad + 3) + ' ' + nd.y + ' L ' + Math.round(nd.x + qRad * 0.6) + ' ' + Math.round(nd.y + qRad * 0.6) +

                       ' L ' + nd.x + ' ' + (nd.y + qRad + 3) + ' L ' + Math.round(nd.x - qRad * 0.6) + ' ' + Math.round(nd.y + qRad * 0.6) +

                       ' L ' + (nd.x - qRad - 3) + ' ' + nd.y + ' L ' + Math.round(nd.x - qRad * 0.6) + ' ' + Math.round(nd.y - qRad * 0.6) + ' Z';

            out.push('    <path d="' + qPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "ANIMAL") {

            // Medailon s barevnou závěsnou stuhou chovné sady

            var ribbonColors = { 1: "#2563eb", 2: "#059669", 3: "#d97706", 4: "#7c3aed" };

            var setNum = nd.setId || (nd.code.match(/\d+/) || [1])[0];

            var rColor = ribbonColors[setNum] || "#2563eb";

            out.push('    <polygon points="' + (nd.x - 8) + ',' + (nd.y + r - 1) + ' ' + (nd.x + 8) + ',' + (nd.y + r - 1) + ' ' + (nd.x + 8) + ',' + (nd.y + r + 11) + ' ' + nd.x + ',' + (nd.y + r + 7) + ' ' + (nd.x - 8) + ',' + (nd.y + r + 11) + '" fill="' + rColor + '" stroke="#000" stroke-width="0.8"/>');

            out.push('    <text x="' + nd.x + '" y="' + (nd.y + r + 7) + '" text-anchor="middle" fill="#ffffff" font-size="6.5" font-weight="bold">' + setNum + '</text>');

            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "CHANCE" || nd.type === "JESTER" || nd.type === "TAX") {

            // Šestiúhelníková vosková pečeť

            var hexPts = [];

            var hexRad = 17.5;

            for (var ha = 0; ha < 6; ha++) {

                var hang = ha * Math.PI / 3;

                hexPts.push(Math.round(nd.x + Math.cos(hang) * hexRad) + ',' + Math.round(nd.y + Math.sin(hang) * hexRad));

            }

            out.push('    <polygon points="' + hexPts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "PRISON") {

            // Okovaný čtverec šatlavy

            out.push('    <rect x="' + (nd.x - 16) + '" y="' + (nd.y - 16) + '" width="32" height="32" rx="4" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else if (nd.type === "HOSPITAL") {

            // Křižácký erb špitálu

            var hospPth = 'M ' + (nd.x - 16) + ' ' + (nd.y - 16) + ' L ' + (nd.x + 16) + ' ' + (nd.y - 16) + ' L ' + (nd.x + 16) + ' ' + (nd.y + 2) + ' Q ' + (nd.x + 16) + ' ' + (nd.y + 18) + ' ' + nd.x + ' ' + (nd.y + 22) + ' Q ' + (nd.x - 16) + ' ' + (nd.y + 18) + ' ' + (nd.x - 16) + ' ' + (nd.y + 2) + ' Z';

            out.push('    <path d="' + hospPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        } else {

            // Standardní kruhový medailon

            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');

        }

        // Vložení bitmapy nebo procedurální heraldické kresby

        if (bmpUrl) {

            var dSize = r * 2 - 2;

            out.push('    <image href="' + this.escapeHtml(bmpUrl) + '" x="' + (nd.x - dSize / 2) + '" y="' + (nd.y - dSize / 2) + '" width="' + dSize + '" height="' + dSize + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipNormalTile)" />');

            out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r - 3) + ')">');

            out.push('      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#0f0d0a" stroke="rgba(212,175,55,0.7)" stroke-width="0.8"/>');

            out.push('      <text x="0" y="2.5" text-anchor="middle" fill="#f8fafc" font-size="7" font-weight="bold">' + this.escapeHtml(shortCode) + '</text>');

            out.push('    </g>');

        } else {

            out.push(this.renderProceduralTileGraphic(nd, r, fill, stroke, strokeWidth, isMajor, shortCode));

        }

        return out.join("\n");

    },

    getNodeFillColor: function (node) {

        switch (node.type) {

            case "START": return "#7c2d12";

            case "ANIMAL":

                if (node.subtype === "kun") return "#422006";

                if (node.subtype === "pes") return "#14532d";

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

            out.push('    <text x="' + nd.x + '" y="' + (nd.y - 0.5) + '" text-anchor="middle" font-size="' + (isMajor ? '14' : '11.5') + '" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.85));">' + nd.icon + '</text>');

        }

        // 5. Elegantní štítek s kódem políčka (černý pergamen se zlatým lemem pro perfektní čitelnost)

        out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r - 3) + ')">');

        out.push('      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#0f0d0a" stroke="rgba(212,175,55,0.7)" stroke-width="0.8"/>');

        out.push('      <text x="0" y="2.5" text-anchor="middle" fill="#f8fafc" font-size="7" font-weight="bold">' + this.escapeHtml(shortCode) + '</text>');

        out.push('    </g>');

        return out.join("\n");

    },

    handleNodeClick: function (nodeId) {

        // Pokud uživatel právě táhl mapou myší, neotvíráme detail políčka

        if (this.viewport.dragMoved) return;

        if (this.activeDecorTooltip) {

            this.activeDecorTooltip = null;

            this.renderBoardTokens();

        }

        this.inspectNode(nodeId);

    },

    handleNodeMouseEnter: function (evt, nodeId) {

        var tip = document.getElementById("prs-tile-tooltip");

        if (!tip || !this.state) return;

        var nd = this.state.board.nodes[nodeId];

        if (!nd) return;

        var activePlayer = this.state.players[this.state.currentPlayerIndex];

        var typeLabel = this.getNodeCategoryLabel(nd);

        var ownerText = "";

        if (nd.owner !== null && this.state.players[nd.owner]) {

            var ownerP = this.state.players[nd.owner];

            var curRent = window.PRS_GameEngine.calculateNodeRent(this.state, nd, activePlayer);

            ownerText = '<div class="prs-tooltip-meta">👑 Vlastník: <strong style="color:' + ownerP.color + '">' + this.escapeHtml(ownerP.name) + '</strong></div>' +

                        '<div class="prs-tooltip-rent">🛑 Vstupné / Nájem: <strong style="color:#f87171">' + curRent.toLocaleString("cs-CZ") + ' zl.</strong></div>';

        } else if (nd.price) {

            var priceRent = '💰 Cena: <strong>' + nd.price.toLocaleString("cs-CZ") + ' zl.</strong>';

            if (nd.rent) {

                var rentVal = Array.isArray(nd.rent) ? (nd.rent[nd.villageLevel || 1] || nd.rent[0]) : (typeof nd.rent === "object" ? nd.rent[nd.villageLevel || 1] : nd.rent);

                priceRent += ' | Základní nájem: <strong>' + (rentVal || 0) + ' zl.</strong>';

            }

            ownerText = '<div class="prs-tooltip-meta">' + priceRent + '</div>';

        }

        // Doplňkové informace podle typu políčka

        var extraInfoHtml = "";

        if (nd.type === "ANIMAL") {

            var setNum = nd.setId || (nd.code.match(/\d+/) || [1])[0];

            var myAnimals = [];

            for (var ani = 0; ani < this.state.board.nodes.length; ani++) {

                var anNode = this.state.board.nodes[ani];

                if (anNode && anNode.type === "ANIMAL") {

                    var anSet = anNode.setId || (anNode.code.match(/\d+/) || [1])[0];

                    if (anSet == setNum && activePlayer && activePlayer.ownedNodes.indexOf(anNode.id) !== -1) {

                        myAnimals.push(anNode);

                    }

                }

            }

            if (myAnimals.length === 3) {

                extraInfoHtml = '<div class="prs-tooltip-set prs-set-complete">✨ Vlastníš celou sadu č. ' + setNum + ' (3/3)! Nájem 80 % &amp; bonus +1,0 💖</div>';

            } else if (myAnimals.length > 0) {

                var myKinds = myAnimals.map(function(a){ return a.subtype === "kun" ? "Kůň" : (a.subtype === "pes" ? "Pes" : "Sokol"); }).join(", ");

                extraInfoHtml = '<div class="prs-tooltip-set prs-set-partial">🐾 V sadě č. ' + setNum + ' vlastníš: <strong>' + myAnimals.length + '/3 (' + myKinds + ')</strong></div>';

            } else {

                extraInfoHtml = '<div class="prs-tooltip-set">🐾 Sada č. ' + setNum + ' (Kůň, Pes, Sokol) – zatím z ní nic nevlastníš</div>';

            }

        } else if (nd.type === "VILLAGE") {

            var vLvl = nd.villageLevel || 1;

            var vStars = "★".repeat(vLvl);

            var taxYield = (vLvl === 1 ? 500 : (vLvl === 2 ? 900 : 1400));

            var upgInfo = (vLvl < 3) ? '<div class="prs-tooltip-meta" style="color:#86efac">🔨 Vylepšení na ' + (vLvl + 1) + '★ stojí 1 500 zl.</div>' : '<div class="prs-tooltip-meta" style="color:#cbd5e1">🏰 Plně opevněná tvrz (3★)</div>';

            extraInfoHtml = '<div class="prs-tooltip-meta">🏛️ Úroveň: <strong style="color:#fde047">' + vStars + ' (' + vLvl + '. st.)</strong> | Daň VD: <strong>+' + taxYield + ' zl.</strong></div>' + upgInfo;

        } else if (nd.type === "CASTLE") {

            extraInfoHtml = '<div class="prs-tooltip-meta" style="color:#e9d5ff">👑 Šlechtické sídlo | Daň VD: <strong>+2 500 zl.</strong> | Trvale <strong>+1 Charisma</strong> &amp; audience u krále!</div>';

        } else if (nd.type === "TOWN") {

            extraInfoHtml = '<div class="prs-tooltip-meta" style="color:#93c5fd">🏙️ Bohaté město | Daň VD: <strong>+1 200 zl.</strong> | Zajišťuje šlechtický titul a audienci!</div>';

        } else if (nd.type === "QUEST") {

            if (nd.subtype === "U3") {

                extraInfoHtml = '<div class="prs-tooltip-set prs-set-complete" style="background:rgba(220,38,38,0.25);border-color:#ef4444;color:#fca5a5;">🐉 Dračí sluj! Výhra: 8 000 – 12 000 zl., Věci 3 a <strong>+4 až +6 💖</strong>!</div>';

            } else if (nd.subtype === "U2") {

                extraInfoHtml = '<div class="prs-tooltip-set" style="color:#fdba74;">👹 Monstrum: Výhra 3 500 – 5 000 zl., Věci 1 a <strong>+1 💖</strong>.</div>';

            } else {

                extraInfoHtml = '<div class="prs-tooltip-set">🐗 Lov zvěře: Výhra 1 500 – 2 500 zl.</div>';

            }

        } else if (nd.type === "START") {

            extraInfoHtml = '<div class="prs-tooltip-set" style="color:#93c5fd;">🏁 Žold: <strong>+3 000 zl.</strong> (+5 000 zl. pro bezzemky) | Audience: +0,5 až +1,0 💖 (vyžaduje Hrad/Město)</div>';

        }

        tip.innerHTML = '<div class="prs-tooltip-header"><span>' + (nd.icon || '📍') + '</span> <span>' + this.escapeHtml(nd.name || nd.code) + '</span></div>' +

            '<div class="prs-tooltip-meta">' + typeLabel + ' (' + nd.code + ')</div>' +

            ownerText +

            extraInfoHtml +

            '<div class="prs-tooltip-body">' + this.getNodeTooltipSummary(nd) + '</div>';

        tip.classList.add("visible");

        this.handleNodeMouseMove(evt);

    },

    handleNodeMouseLeave: function () {

        var tip = document.getElementById("prs-tile-tooltip");

        if (tip) tip.classList.remove("visible");

    },

    handleNodeMouseMove: function (evt) {

        var tip = document.getElementById("prs-tile-tooltip");

        if (!tip || !tip.classList.contains("visible")) return;

        var mx = evt.clientX + 14;

        var my = evt.clientY + 14;

        var maxW = window.innerWidth - 290;

        var maxH = window.innerHeight - 150;

        if (mx > maxW) mx = evt.clientX - 260;

        if (my > maxH) my = evt.clientY - 130;

        tip.style.left = mx + "px";

        tip.style.top = my + "px";

    },

    getNodeCategoryLabel: function (nd) {

        switch (nd.type) {

            case "START": return "Královská audience (Cíl &amp; Start)";

            case "FESTIVAL": return "Královský turnaj a ples";

            case "VILLAGE": return "Panství - Vesnice (Úroveň " + (nd.villageLevel || 1) + "/3)";

            case "TOWN": return "Panství - Opevněné Město";

            case "CASTLE": return "Panství - Rytířský Hrad";

            case "ANIMAL":

                var animalKind = nd.subtype === "kun" ? "Kůň" : (nd.subtype === "pes" ? "Pes" : "Sokol");

                var setN = nd.setId || (nd.code.match(/\d+/) || [""])[0];

                return "Chovné zvíře - " + animalKind + " (Sada " + setN + ")";

            case "QUEST": return "Výprava &amp; Boj (" + (nd.subtype || "Běžný") + ")";

            case "MERCHANT": return "Královský trh a obchodník";

            case "MASTER": return "Mistr řemesel (Trénink dovedností)";

            case "CHANCE": return "Karta osudu a náhody";

            case "JESTER": return "Královský šašek";

            case "TAVERN": return "Hostinec U Zlatého kance";

            case "PRISON": return "Královská šatlava";

            case "HOSPITAL": return "Špitál sv. Lazara";

            case "TAX": return "Královská berně (Daň)";

            case "BONUS": return "Pokladnice a odměna";

            default: return "Herní pole";

        }

    },

    getNodeTooltipSummary: function (nd) {

        switch (nd.type) {

            case "START": return "Zde začíná pouť. Při průchodu či zastavení možnost audience u krále (+1 💖 za Charisma, vyžaduje šlechtický titul - vlastnictví Města či Hradu).";

            case "FESTIVAL": return "Soutěž v tanci a jezdeckém umění. Vítěz získává srdce dvorních dam (+1 až +2 💖) a turnajovou slávu.";

            case "VILLAGE": return "Základní venkovské panství. Výnosný nájem pro majitele, možnost vylepšení na kamenný statek a tvrz.";

            case "TOWN": return "Bohaté opevněné obchodní centrum. Přináší vysoké nájmy a opravňuje k audienci u krále.";

            case "CASTLE": return "Nedobytné panské sídlo. Symbol moci, obrovský nájem a šlechtický titul pro audienci.";

            case "ANIMAL": return "Zvíře do chovu. Komplet trojice Kůň + Pes + Sokol stejné sady přináší trvalý chovný bonus +1 💖 a body pro vítězství!";

            case "QUEST": return (nd.subtype === "U3") ? "Legendární tříhlavá saň či drak! Výhra: až 12 000 zl. a 6 💖 princeznina srdce! Vyžaduje vysoký Boj a zbraně." : "Výprava za zvěří či monstrem. Zisk zlaťáků, srdcí a slávy.";

            case "MERCHANT": return "Nákup zbraní, brnění a ořů za zvýhodněné ceny. Prodej za 70 % hodnoty.";

            case "MASTER": return "Trénink Boje, Jízdy, Tance a Charismatu za zlaťáky.";

            case "CHANCE": return "Vytáhni si kartu štěstěny. Může přinést nečekané bohatství i nástrahy.";

            case "JESTER": return "Rozvesel krále vtipem či obratností a získej odměnu.";

            case "TAVERN": return "Odpočinek, hazardní kostky a doplnění sil.";

            case "PRISON": return "Uvržen do žaláře! Vykup se kaucí nebo hoď 6 na kostce.";

            case "HOSPITAL": return "Léčení zranění z neúspěšných bojů za mírný poplatek.";

            case "TAX": return "Odevzdej královskou berni do státní pokladnice.";

            case "BONUS": return "Nečekaný nález zlaťáků na cestě.";

            default: return "Políčko království.";

        }

    },

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

    handleDecorClick: function (catalogId, x, y, evt) {

        if (evt) evt.stopPropagation();

        var cat = window.PRS_DECOR_CATALOG ? window.PRS_DECOR_CATALOG[catalogId] : null;

        if (!cat) return;

        // Pokud je tooltip teto dekorace jiz otevreny, kliknutim jej zavreme

        if (this.activeDecorTooltip && this.activeDecorTooltip.catalogId === catalogId) {

            this.dismissDecorTooltip(evt);

            return;

        }

        this.activeDecorTooltip = {

            catalogId: catalogId,

            name: cat.name,

            icon: cat.icon || "🌲",

            desc: cat.desc || "Malebná dekorace oživující krajinu království.",

            category: cat.category,

            x: x,

            y: y - (cat.h ? cat.h * 0.45 : 30) - 15,

            created: Date.now()

        };

        if (window.PRS_Audio) {

            if (cat.category === "water") {

                if (typeof window.PRS_Audio.playWater === "function") window.PRS_Audio.playWater();

                else window.PRS_Audio.playStep();

            } else if (cat.category === "quest_lair") {

                window.PRS_Audio.playOminous();

            } else if (cat.category === "magic") {

                window.PRS_Audio.playNotice();

            } else if (cat.category === "settlement" || cat.category === "civilization" || cat.category === "agriculture") {

                window.PRS_Audio.playItem();

            } else {

                window.PRS_Audio.playStep();

            }

        }

        this.renderBoardTokens();

        var self = this;

        if (this._decorTooltipTimer) clearTimeout(this._decorTooltipTimer);

        this._decorTooltipTimer = setTimeout(function () {

            if (self.activeDecorTooltip && self.activeDecorTooltip.catalogId === catalogId) {

                self.activeDecorTooltip = null;

                self.renderBoardTokens();

            }

        }, 4500);

    },

    dismissDecorTooltip: function (evt) {

        if (evt) evt.stopPropagation();

        if (this._decorTooltipTimer) clearTimeout(this._decorTooltipTimer);

        this.activeDecorTooltip = null;

        this.renderBoardTokens();

    },

    showPawnToast: function (playerIndex, text, icon, color, bg) {

        var pl = (this.state && this.state.players) ? this.state.players[playerIndex] : null;

        if (!pl) return;

        var node = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[pl.nodeId] : null;

        if (!node) return;

        this.activePawnToast = {

            playerIndex: playerIndex,

            text: text,

            icon: icon || "✨",

            color: color || "#fef08a",

            bg: bg || "rgba(24, 18, 12, 0.94)",

            x: node.x,

            y: node.y - 38,

            created: Date.now()

        };

        this.renderBoardTokens();

        var self = this;

        if (this._pawnToastTimer) clearTimeout(this._pawnToastTimer);

        this._pawnToastTimer = setTimeout(function () {

            self.activePawnToast = null;

            self.renderBoardTokens();

        }, 3200);

    },

    inspectCardZone: function (code) {

        var modal = document.getElementById("card-deck-inspector-modal");

        var titleEl = document.getElementById("card-deck-modal-title");

        var bodyEl = document.getElementById("card-deck-modal-body");

        if (!modal || !titleEl || !bodyEl) return;

        if (window.PRS_Audio) window.PRS_Audio.playItem();

        var info = this.getCardZoneInfo(code);

        titleEl.innerHTML = info.title;

        bodyEl.innerHTML = info.bodyHTML;

        modal.style.display = "flex";

        this.updateBodyModalClass();

    },

    closeDeckModal: function () {

        var modal = document.getElementById("card-deck-inspector-modal");

        if (modal) modal.style.display = "none";

        this.updateBodyModalClass();

    },

    getCardZoneInfo: function (code) {

        var title = "🃏 Balíček karet";

        var html = [];

        if (code === "VECI_1") {

            title = "🗡️ Balíček VĚCI 1 (Základní výbava)";

            var items1 = (window.PRS_ITEMS || []).filter(function (it) { return it.tier === 1; });

            html.push('<div style="margin-bottom:0.8rem; background:rgba(96,165,250,0.1); border:1px solid rgba(96,165,250,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Cena balíčku: 2 500 zl.</strong> | Obsahuje 9 základních zbraní, zbrojí a dvorských šperků.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Lze nakupovat u Kováře, Obchodníka nebo v záložce Zbrojnice. Poskytují bonusy k Boji (+2 až +3), Jízdě na koni či Tanci a Charismatu.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.4rem; color:var(--gold-light);">Přehled předmětů v balíčku:</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">');

            for (var i = 0; i < items1.length; i++) {

                var it = items1[i];

                html.push('<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.8rem;">' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong><br/><span style="color:#a8a29e; font-size:0.75rem;">' + (it.boj ? "Boj +" + it.boj + " " : "") + (it.jizda ? "Jízda +" + it.jizda + " " : "") + (it.tanec ? "Tanec +" + it.tanec + " " : "") + (it.charisma ? "Char. +" + it.charisma : "") + '</span></div>');

            }

            html.push('</div>');

        } else if (code === "VECI_2") {

            title = "⚔️ Balíček VĚCI 2 (Rytířská výzbroj)";

            var items2 = (window.PRS_ITEMS || []).filter(function (it) { return it.tier === 2; });

            html.push('<div style="margin-bottom:0.8rem; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Cena balíčku: 7 000 zl.</strong> | Obsahuje 7 elitních zbraní, plátových zbrojí a brokátových rouch.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Zásadní pro souboje s monstry U2 a prestiž u královského dvora. Dávají souhrnné bonusy až +7 k vlastnostem.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.4rem; color:var(--gold-light);">Přehled předmětů v balíčku:</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">');

            for (var i = 0; i < items2.length; i++) {

                var it = items2[i];

                html.push('<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.8rem;">' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong><br/><span style="color:#a8a29e; font-size:0.75rem;">' + (it.boj ? "Boj +" + it.boj + " " : "") + (it.jizda ? "Jízda +" + it.jizda + " " : "") + (it.tanec ? "Tanec +" + it.tanec + " " : "") + (it.charisma ? "Char. +" + it.charisma : "") + '</span></div>');

            }

            html.push('</div>');

        } else if (code === "VECI_3") {

            title = "👑 Balíček VĚCI 3 (Legendární královské relikvie)";

            var items3 = (window.PRS_ITEMS || []).filter(function (it) { return it.tier === 3 && it.slot !== "trophy"; });

            html.push('<div style="margin-bottom:0.8rem; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Cena balíčku: 12 000 zl.</strong> | Obsahuje 4 ultimátní klenoty a meče Dračích bijců.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Nejvzácnější královské relikvie dávající až +13 k celkovým vlastnostem, nezbytné pro porážku nejmocnějších draků U3.</p>');

            html.push('</div>');

            html.push('<div style="font-weight:bold; margin-bottom:0.4rem; color:var(--gold-light);">Přehled předmětů v balíčku:</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr; gap:0.45rem;">');

            for (var i = 0; i < items3.length; i++) {

                var it = items3[i];

                html.push('<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:0.5rem 0.75rem; font-size:0.85rem;">' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong> (' + it.price.toLocaleString("cs-CZ") + ' zl.)<br/><span style="color:#fef08a; font-size:0.8rem;">' + (it.boj ? "Boj +" + it.boj + " " : "") + (it.jizda ? "Jízda +" + it.jizda + " " : "") + (it.tanec ? "Tanec +" + it.tanec + " " : "") + (it.charisma ? "Char. +" + it.charisma : "") + '</span></div>');

            }

            html.push('</div>');

        } else if (code === "ZVER_U1") {

            title = "🐗 Balíček ZVĚŘ (Úkoly U1 - Lovecký revír)";

            var q1 = (window.PRS_QUESTS && window.PRS_QUESTS.U1) ? window.PRS_QUESTS.U1 : [];

            html.push('<div style="margin-bottom:0.8rem; background:rgba(74,222,128,0.1); border:1px solid rgba(74,222,128,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Obtížnost: 4–6</strong> | Odměna: 1 200 – 2 200 zl. + 0.5–1 💖 Srdce.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Lovečtí psi a sokoli usnadňují ulovení zvěře. Poražením každého zvířete získáte unikátní loveckou trofej do 5. slotu výbavy.</p>');

            html.push('</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < q1.length; i++) {

                var z = q1[i];

                html.push('<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.8rem;">' + z.icon + ' <strong>' + this.escapeHtml(z.name) + '</strong><br/><span style="color:#4ade80;">⚔️ Obtížnost ' + z.difficulty + '</span> | +' + z.gold + ' zl.</div>');

            }

            html.push('</div>');

        } else if (code === "MONSTRA_U2") {

            title = "👹 Balíček MONSTRA (Úkoly U2 - Nebezpečné zkoušky)";

            var q2 = (window.PRS_QUESTS && window.PRS_QUESTS.U2) ? window.PRS_QUESTS.U2 : [];

            html.push('<div style="margin-bottom:0.8rem; background:rgba(251,146,60,0.1); border:1px solid rgba(251,146,60,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Obtížnost: 8–10</strong> | Odměna: 3 000 – 4 500 zl. + 1–1.5 💖 + Předmět výbavy.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Skalní obři, vlkodlaci, loupeživí rytíři a čarodějové. Poražení vám přinese trvalé srdce princezny a mocnou relikvii.</p>');

            html.push('</div>');

            html.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.45rem;">');

            for (var i = 0; i < q2.length; i++) {

                var m = q2[i];

                html.push('<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.8rem;">' + m.icon + ' <strong>' + this.escapeHtml(m.name) + '</strong><br/><span style="color:#fb923c;">⚔️ Obtížnost ' + m.difficulty + '</span> | +' + m.gold + ' zl.</div>');

            }

            html.push('</div>');

        } else if (code === "DRACI_U3") {

            title = "🐉 Balíček DRACI (Úkoly U3 - Dračí sluje)";

            html.push('<div style="margin-bottom:0.8rem; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Obtížnost: 11–17</strong> | Odměna: 6 000 – 16 000 zl. + 2.5–6.0 💖 Srdcí princezny.');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Království ohrožuje 20 unikátních draků a saní. Každý má svou zranitelnost (kopí, psi, lektvary, oheň či mráz) a zanechává legendární poklad.</p>');

            html.push('</div>');

            html.push('<div style="text-align:center; margin-top:0.8rem;">');

            html.push('  <button class="rules-subnav-btn active" onclick="PRS_App.closeDeckModal(); PRS_App.switchTab(\'rules\'); PRS_App.switchRulesSubtab(\'dragons\');" style="cursor:pointer; padding:0.5rem 1rem;">🐉 Prohlédnout kompletní Dračí Bestiář (20)</button>');

            html.push('</div>');

        } else if (code === "NAHODA_N") {

            title = "❓ Balíček NÁHODA (24 karet královského osudu)";

            html.push('<div style="margin-bottom:0.8rem; background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Celkem 24 autentických královských událostí.</strong>');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Královská přízeň (+1 💖), loupežnická přepadení, milostné sonety, dary od královny matky, opravy zbrojí i nálezy pokladů na rozcestí.</p>');

            html.push('</div>');

            html.push('<p style="font-size:0.85rem; color:#94a3b8;">Karty se dobírají při vstupu na pole označené <strong>N</strong>. Efekt se vyhodnocuje okamžitě a karta se odloží na spodek balíčku.</p>');

        } else if (code === "SLAVNOST_S") {

            title = "🎪 Balíček SLAVNOSTI (Královská klání)";

            html.push('<div style="margin-bottom:0.8rem; background:rgba(236,72,153,0.1); border:1px solid rgba(236,72,153,0.3); border-radius:8px; padding:0.75rem;">');

            html.push('  <strong>Královský turnaj, Dvorský ples a Závod koní.</strong>');

            html.push('  <p style="margin:0.35rem 0 0; font-size:0.82rem; color:#cbd5e1;">Hráči porovnávají své ctnosti: Turnaj (Boj a Jízda), Ples (Tanec a Charisma), Závod (Jízda a Boj). Tři nejlepší získávají peněžité ceny až 1 500 zl.!</p>');

            html.push('</div>');

        }

        return { title: title, bodyHTML: html.join("") };

    },

    // --- FÁZE 2: SOUBOJOVÁ ARÉNA & DRAČÍ VÝPRAVA (QUEST DUEL ARENA) ---

    duelMonsterFlipped: false,

    selectedDuelTactic: "normal",

    isDuelRolling: false
    });
})();
