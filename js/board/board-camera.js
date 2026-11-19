// ============================================================================
// KiDesky: Princeznino srdce - Kamera herního plánu (Pan & Zoom), bitmapy a grafická konfigurace
// ============================================================================

(function () {
    "use strict";
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

        window.addEventListener("resize", function () {
            self.clampViewportPan();
            self.applyViewportTransform();
        });

    },

    
    clampViewportPan: function () {

        var wrap = document.getElementById("board-viewport-wrap");

        var svgEl = document.getElementById("prs-board-svg");

        if (!wrap) return;

        var w = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);

        var h = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);
        var svgRatioX = 1400 / Math.max(1, w);
        var svgRatioY = 860 / Math.max(1, h);

        // Pojistka minimálního měřítka (minScale = 1.0) - zamezí zmenšení desky pod velikost herní plochy
        var minS = (this.viewport && this.viewport.minScale) ? this.viewport.minScale : 1.0;
        var maxS = (this.viewport && this.viewport.maxScale) ? this.viewport.maxScale : 3.5;
        this.viewport.scale = Math.min(maxS, Math.max(minS, this.viewport.scale));

        var s = this.viewport.scale;

        // V SVG souřadnicích (viewBox 0 0 1400 860):
        // Deska má rozměry 1400 x 860.
        // Hranice posunu jsou přesně zarovnány s okrajem desky, aby okolo nikdy nevzniklo černé místo:
        // - Levý okraj nesmí jít vpravo od 0 (maxTx = 0)
        // - Pravý okraj nesmí jít vlevo od 1400 (minTx = 1400 * (1 - s))
        // - Horní okraj nesmí jít pod 0 (maxTy = 0)
        // - Dolní okraj nesmí jít nad 860 (minTy = 860 * (1 - s))
        var minTx = 1400 * (1 - s);
        var maxTx = 0;
        var minTy = 860 * (1 - s);
        var maxTy = 0;

        if (minTx > maxTx) minTx = maxTx;
        if (minTy > maxTy) minTy = maxTy;

        var minPanX = minTx / svgRatioX;
        var maxPanX = maxTx / svgRatioX;
        var minPanY = minTy / svgRatioY;
        var maxPanY = maxTy / svgRatioY;

        this.viewport.panX = Math.min(maxPanX, Math.max(minPanX, this.viewport.panX));
        this.viewport.panY = Math.min(maxPanY, Math.max(minPanY, this.viewport.panY));

    },

    
    applyViewportTransform: function (smooth) {

        var g = document.getElementById("prs-board-stage");

        var lbl = document.getElementById("zoom-pct-label");

        var wrap = document.getElementById("board-viewport-wrap");

        var svgEl = document.getElementById("prs-board-svg");

        var minS = 1.0;
        var maxS = (this.viewport && this.viewport.maxScale) ? this.viewport.maxScale : 3.5;
        this.viewport.minScale = minS;
        this.viewport.scale = Math.min(maxS, Math.max(minS, this.viewport.scale || 1.0));
        var s = this.viewport.scale;

        if (lbl) {
            lbl.textContent = Math.round(s * 100) + " %";
        }

        if (!g || !wrap) return;

        if (smooth) {
            g.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
            setTimeout(function () {
                if (g) g.style.transition = "";
            }, 480);
        } else if (!this.viewport.isDragging && !this.viewport.isPinching) {
            g.style.transition = "";
        }

        // Převod pixelového posunu na souřadnice SVG (1400 x 860) měřený z reálné velikosti SVG
        var svgW = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);
        var svgH = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);

        var svgRatioX = 1400 / Math.max(1, svgW);
        var svgRatioY = 860 / Math.max(1, svgH);

        // Striktní hranice v souřadnicích SVG (1400 x 860):
        // Deska nikdy nesmí odkrýt černé okraje:
        // tx nesmí být > 0 ani < 1400 * (1 - s)
        // ty nesmí být > 0 ani < 860 * (1 - s)
        var minTx = 1400 * (1 - s);
        var maxTx = 0;
        var minTy = 860 * (1 - s);
        var maxTy = 0;

        var tx = (this.viewport.panX || 0) * svgRatioX;
        var ty = (this.viewport.panY || 0) * svgRatioY;

        tx = Math.min(maxTx, Math.max(minTx, tx));
        ty = Math.min(maxTy, Math.max(minTy, ty));

        this.viewport.panX = tx / svgRatioX;
        this.viewport.panY = ty / svgRatioY;

        var finalTx = Math.round(tx * 10) / 10;
        var finalTy = Math.round(ty * 10) / 10;

        g.setAttribute("transform", "translate(" + finalTx + "," + finalTy + ") scale(" + s.toFixed(3) + ")");

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

    
    centerOnActivePlayer: function (preserveScale, smooth) {

        if (!this.state) return;

        var p = this.state.players[this.state.currentPlayerIndex];
        if (!p) return;

        var nd = this.state.board.nodes[p.nodeId];

        var wrap = document.getElementById("board-viewport-wrap");

        if (!nd || !wrap) return;

        var isMobile = (this.deviceProfile && this.deviceProfile.device === "mobile");

        var targetScale;
        if (preserveScale && this.viewport && this.viewport.scale > 0.5) {
            targetScale = this.viewport.scale;
        } else {
            targetScale = isMobile ? Math.max(1.20, Math.min(1.85, this.viewport.scale)) : Math.max(1.45, this.viewport.scale);
        }

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

        this.applyViewportTransform(smooth);

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

                    if (!this.graphicsConfig.tileBitmapsByType.START || this.graphicsConfig.tileBitmapsByType.START.indexOf(".jpg") !== -1 || this.graphicsConfig.tileBitmapsByType.START.indexOf("castle.png") !== -1) {

                        this.graphicsConfig.tileBitmapsByType.START = "assets/tiles/start.png";

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

        // 1. Explicitní bitmapa hradu definovaná na uzlu plánu (z generátoru)
        if (node.castleImg && typeof node.castleImg === "string") {
            var cImg = node.castleImg;
            if (node.x > 700 && cImg.indexOf("_flip") === -1) {
                return cImg.replace(".png", "_flip.png");
            }
            return cImg;
        }

        // 2. Přímé mapování podle kódu políčka
        if (this.graphicsConfig.tileBitmapsByCode && this.graphicsConfig.tileBitmapsByCode[node.code]) {

            return this.graphicsConfig.tileBitmapsByCode[node.code];

        }

        // 3. Specifická tematická mapa pro políčka hradů (H1..H9)
        if (node.type === "CASTLE") {
            var castleMap = {
                H1: "assets/castles/castle_forest.png",
                H2: "assets/castles/castle_wind.png",
                H3: "assets/castles/castle_crystal.png",
                H4: "assets/castles/castle_lava.png",
                H5: "assets/castles/castle_water.png",
                H6: "assets/castles/castle_dark.png",
                H7: "assets/castles/castle_desert.png",
                H8: "assets/castles/castle_swamp.png",
                H9: "assets/castles/castle_ice.png"
            };
            var cUrl = (node.estateId && castleMap[node.estateId]) || (node.code && castleMap[node.code]);
            if (cUrl && typeof cUrl === "string") {
                if (node.x > 700 && cUrl.indexOf("_flip") === -1) return cUrl.replace(".png", "_flip.png");
                return cUrl;
            }
        }

        var byType = this.graphicsConfig.tileBitmapsByType || {};

        var url = "";

        // Normalizace klíče podtypu (česky i anglicky)
        var subKey = (node.subtype || "").toLowerCase();
        if (subKey === "kun") subKey = "horse";
        else if (subKey === "pes") subKey = "dog";
        else if (subKey === "sokol") subKey = "falcon";

        // Pokud je uzel zvíře, ale chybí nebo nesedí subtype, odvodíme z kódu / jména
        var isAnimalType = ((node.type || "").toUpperCase() === "ANIMAL" || node.type === "animal");
        if (isAnimalType && (!subKey || (subKey !== "falcon" && subKey !== "dog" && subKey !== "horse"))) {
            var c = (node.code || "").toUpperCase();
            var n = (node.name || "").toLowerCase();
            if (c.indexOf("S") === 0 || n.indexOf("sokol") !== -1 || n.indexOf("pták") !== -1 || n.indexOf("poštolka") !== -1) subKey = "falcon";
            else if (c.indexOf("P") === 0 || c.indexOf("D") === 0 || n.indexOf("pes") !== -1 || n.indexOf("dog") !== -1 || n.indexOf("ohař") !== -1 || n.indexOf("chrt") !== -1 || n.indexOf("bígl") !== -1) subKey = "dog";
            else subKey = "horse";
        }

        if (subKey && byType[subKey]) {
            url = byType[subKey];
        } else if (node.subtype && byType[node.subtype]) {
            url = byType[node.subtype];
        } else if (node.type && byType[node.type]) {
            url = byType[node.type];
        } else if (node.type && byType[String(node.type).toUpperCase()]) {
            url = byType[String(node.type).toUpperCase()];
        }

        // Záchranný fallback pro zvířata
        if (!url && isAnimalType) {
            url = (subKey === "falcon") ? "assets/tiles/sokol.png" : ((subKey === "dog") ? "assets/tiles/pes.png" : "assets/tiles/kun.png");
        }

        if (!url && (node.type === "START" || node.type === "CASTLE" || node.code === "START" || (node.type || "").toUpperCase() === "START")) {

            url = (node.type === "START" || node.code === "START" || (node.type || "").toUpperCase() === "START") ? "assets/tiles/start.png" : "assets/tiles/castle.png";

        }

        if (url && typeof url === "string") {

            if (url.endsWith(".jpg")) url = url.replace(".jpg", ".png");

            // Na pravé polovině plánu zrcadlit směrová zvířata, hrady a draky
            if (node.x > 700 && (subKey === "horse" || subKey === "dog" || subKey === "falcon" || node.subtype === "horse" || node.subtype === "dog" || node.subtype === "falcon" || node.subtype === "U3" || node.type === "CASTLE")) {

                var flipUrl = url.replace(".png", "_flip.png");

                return flipUrl;

            }

        }

        return url;

    }
    });
})();
