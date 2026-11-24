// ============================================================================
// KiDesky: Princeznino srdce - Jednorázová bitmapová cache statického pozadí
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    var ASSET_DATA_URI_CACHE = {};
    var BACKDROP_SCALE_BY_QUALITY = {
        low: 1.0,
        medium: 1.5,
        high: 2.0
    };

    function isInlinableAssetUrl(url) {
        if (!url || typeof url !== "string") return false;
        if (url.indexOf("data:") === 0 || url.indexOf("blob:") === 0 || url.indexOf("#") === 0) return false;
        return true;
    }

    function fetchAsDataUri(url) {
        if (ASSET_DATA_URI_CACHE[url]) {
            return Promise.resolve(ASSET_DATA_URI_CACHE[url]);
        }
        return fetch(url)
            .then(function (resp) {
                if (!resp || !resp.ok) return null;
                return resp.blob();
            })
            .then(function (blob) {
                if (!blob || typeof FileReader === "undefined") return null;
                return new Promise(function (resolve) {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        var res = (typeof reader.result === "string") ? reader.result : null;
                        if (res) ASSET_DATA_URI_CACHE[url] = res;
                        resolve(res);
                    };
                    reader.onerror = function () { resolve(null); };
                    reader.readAsDataURL(blob);
                });
            })
            .catch(function () {
                return null;
            });
    }

    function inlineSvgImageHrefs(svgMarkup) {
        var uniqueMap = {};
        var urls = [];
        var hrefRe = /\b(?:xlink:)?href="([^"]+)"/g;
        var match;
        while ((match = hrefRe.exec(svgMarkup)) !== null) {
            var u = match[1];
            if (isInlinableAssetUrl(u) && !uniqueMap[u]) {
                uniqueMap[u] = true;
                urls.push(u);
            }
        }
        if (urls.length === 0) {
            return Promise.resolve(svgMarkup);
        }
        return Promise.all(urls.map(fetchAsDataUri)).then(function () {
            return svgMarkup.replace(/(\b(?:xlink:)?href=")([^"]+)(")/g, function (full, p1, u, p3) {
                return ASSET_DATA_URI_CACHE[u] ? (p1 + ASSET_DATA_URI_CACHE[u] + p3) : full;
            });
        });
    }

    function resolveBoardFilterCss() {
        if (typeof getComputedStyle === "function" && typeof document !== "undefined" && document.documentElement) {
            var v = getComputedStyle(document.documentElement).getPropertyValue("--board-filter");
            if (v && v.trim()) return v.trim();
        }
        return "none";
    }

    function stripSvgAnimations(svgMarkup) {
        return svgMarkup
            .replace(/<animate(?:Transform|Motion|Color)?\b[^>]*\/>/gi, "")
            .replace(/<animate(?:Transform|Motion|Color)?\b[^>]*>[\s\S]*?<\/animate(?:Transform|Motion|Color)?>/gi, "");
    }

    function revokeBlobSafe(url) {
        if (url && typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
            try { URL.revokeObjectURL(url); } catch (e) {}
        }
    }

    Object.assign(window.PRS_App, {
        isDesktopHighCrispMode: function () {
            var q = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
            if (q !== "high") return false;
            if (this.deviceProfile && this.deviceProfile.device === "mobile") return false;
            var bodyDev = (typeof document !== "undefined" && document.body && typeof document.body.getAttribute === "function")
                ? document.body.getAttribute("data-device")
                : null;
            if (bodyDev === "mobile") return false;
            if (bodyDev === "desktop" || bodyDev === "tablet") return true;
            if (this.deviceProfile && (this.deviceProfile.device === "desktop" || this.deviceProfile.device === "tablet")) return true;
            if (typeof window !== "undefined" && typeof window.innerWidth === "number") {
                return window.innerWidth >= 768;
            }
            return true;
        },

        getBackdropResolutionScale: function (quality) {
            var q = quality || (typeof this.getGraphicsQuality === "function" ? this.getGraphicsQuality() : "high");
            return BACKDROP_SCALE_BY_QUALITY[q] || 1.5;
        },

        getBackdropCacheKey: function () {
            var board = this.state && this.state.board;
            var cfg = this.state && this.state.config;
            var th = this.currentTheme || "light";
            var night = this.isNightMode ? "night" : "day";
            var qual = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";
            var seed = (board && (board.seed || board.id)) || "static";
            var decLen = (board && board.decorations) ? board.decorations.length : 0;
            var hearts = (cfg && cfg.targetHearts) || 0;
            var lang = (typeof window !== "undefined" && window.PRS_I18n && typeof window.PRS_I18n.getLanguage === "function")
                ? window.PRS_I18n.getLanguage()
                : "cs";
            var bgUrl = (this.graphicsConfig && this.graphicsConfig.boardBgUrl) || "";
            return [th, night, qual, seed, decLen, hearts, lang, bgUrl].join("|");
        },

        renderBakedBackdropImageHTML: function (blobUrl) {
            var safeUrl = (typeof this.escapeHtml === "function") ? this.escapeHtml(blobUrl) : String(blobUrl || "");
            return '<image id="prs-baked-backdrop-img" href="' + safeUrl + '" x="0" y="0" width="1400" height="860" preserveAspectRatio="none" onclick="PRS_App.handleBakedBackdropClick(event)" style="cursor:pointer;"/>';
        },

        disposeBackdropCache: function () {
            this._backdropBakeSeq = (this._backdropBakeSeq || 0) + 1;
            this._backdropBakeInFlightKey = null;
            this._lastUnbakedBackdrop = null;
            if (this._bakedBackdrop && this._bakedBackdrop.blobUrl) {
                revokeBlobSafe(this._bakedBackdrop.blobUrl);
            }
            this._bakedBackdrop = null;
        },

        applyBakedBackdropToDOM: function () {
            if (typeof document === "undefined") return false;
            if (this.isDesktopHighCrispMode()) {
                this.disposeBackdropCache();
                return false;
            }
            var baked = this._bakedBackdrop;
            if (!baked || !baked.blobUrl || baked.key !== this.getBackdropCacheKey()) return false;
            var container = document.getElementById("prs-static-backdrop");
            if (!container) return false;
            container.innerHTML = this.renderBakedBackdropImageHTML(baked.blobUrl);
            return true;
        },

        scheduleBackdropBake: function (bakeKey, defsSvg, backdropInnerSvg, quality) {
            if (this.isDesktopHighCrispMode()) {
                this.disposeBackdropCache();
                return;
            }
            if (typeof document === "undefined" || typeof fetch !== "function" ||
                typeof Blob === "undefined" || typeof Image === "undefined" ||
                typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
                return;
            }
            if (!bakeKey || !backdropInnerSvg) return;
            if (this._bakedBackdrop && this._bakedBackdrop.key === bakeKey && this._bakedBackdrop.blobUrl) {
                this.applyBakedBackdropToDOM();
                return;
            }
            if (this._backdropBakeInFlightKey === bakeKey) return;

            var self = this;
            var seq = (this._backdropBakeSeq || 0) + 1;
            this._backdropBakeSeq = seq;
            this._backdropBakeInFlightKey = bakeKey;

            var scale = this.getBackdropResolutionScale(quality);
            var targetW = Math.round(1400 * scale);
            var targetH = Math.round(860 * scale);
            var boardFilter = resolveBoardFilterCss();

            var rawStandaloneSvg =
                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1400 860" width="' + targetW + '" height="' + targetH + '">' +
                (defsSvg || "") +
                stripSvgAnimations(backdropInnerSvg).replace(/var\(--board-filter,\s*none\)/g, boardFilter) +
                '</svg>';

            inlineSvgImageHrefs(rawStandaloneSvg).then(function (inlinedSvg) {
                if (seq !== self._backdropBakeSeq || self.getBackdropCacheKey() !== bakeKey) {
                    if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
                    return;
                }

                var svgBlob = new Blob([inlinedSvg], { type: "image/svg+xml;charset=utf-8" });
                var svgUrl = URL.createObjectURL(svgBlob);
                var img = new Image();

                img.onload = function () {
                    revokeBlobSafe(svgUrl);
                    if (seq !== self._backdropBakeSeq || self.getBackdropCacheKey() !== bakeKey) {
                        if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
                        return;
                    }

                    var canvas = document.createElement("canvas");
                    canvas.width = targetW;
                    canvas.height = targetH;
                    var ctx = canvas.getContext ? canvas.getContext("2d") : null;
                    if (!ctx || typeof canvas.toBlob !== "function") {
                        canvas.width = 0;
                        canvas.height = 0;
                        if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
                        return;
                    }

                    try {
                        ctx.drawImage(img, 0, 0, targetW, targetH);
                    } catch (drawErr) {
                        canvas.width = 0;
                        canvas.height = 0;
                        if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
                        return;
                    }

                    var finishWithBlob = function (outBlob) {
                        canvas.width = 0;
                        canvas.height = 0;
                        if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
                        if (!outBlob || seq !== self._backdropBakeSeq || self.getBackdropCacheKey() !== bakeKey) {
                            return;
                        }
                        var bitmapUrl = URL.createObjectURL(outBlob);
                        if (self._bakedBackdrop && self._bakedBackdrop.blobUrl && self._bakedBackdrop.blobUrl !== bitmapUrl) {
                            revokeBlobSafe(self._bakedBackdrop.blobUrl);
                        }
                        self._bakedBackdrop = {
                            key: bakeKey,
                            blobUrl: bitmapUrl,
                            width: targetW,
                            height: targetH,
                            quality: quality || "high"
                        };
                        self.applyBakedBackdropToDOM();
                    };

                    canvas.toBlob(function (webpBlob) {
                        if (webpBlob) {
                            finishWithBlob(webpBlob);
                        } else {
                            canvas.toBlob(finishWithBlob, "image/png");
                        }
                    }, "image/webp", 0.90);
                };

                img.onerror = function () {
                    revokeBlobSafe(svgUrl);
                    if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
                };

                img.src = svgUrl;
            }).catch(function () {
                if (self._backdropBakeInFlightKey === bakeKey) self._backdropBakeInFlightKey = null;
            });
        },

        handleBakedBackdropClick: function (evt) {
            if (!evt || (this.viewport && this.viewport.dragMoved)) return;
            var board = this.state && this.state.board;
            var decs = (board && board.decorations) ? board.decorations : [];
            var svgEl = (typeof document !== "undefined") ? document.getElementById("prs-board-svg") : null;
            if (!svgEl || typeof svgEl.getBoundingClientRect !== "function") return;

            var rect = svgEl.getBoundingClientRect();
            if (!rect || rect.width <= 0 || rect.height <= 0) return;

            var sx = (evt.clientX - rect.left) * (1400 / rect.width);
            var sy = (evt.clientY - rect.top) * (860 / rect.height);
            var gQuality = (typeof this.getGraphicsQuality === "function") ? this.getGraphicsQuality() : "high";

            for (var d = decs.length - 1; d >= 0; d--) {
                var dec = decs[d];
                if (!dec) continue;
                if (typeof this.isDecorCollidingWithRivers === "function" && this.isDecorCollidingWithRivers(dec, board.rivers)) {
                    continue;
                }
                var cat = (typeof window !== "undefined" && window.PRS_DECOR_CATALOG) ? window.PRS_DECOR_CATALOG[dec.catalogId] : null;
                var catType = (cat && cat.category) || "vegetation";
                if (gQuality === "low" && catType === "vegetation" && (d % 2 === 1)) {
                    continue;
                }
                var sc = dec.scale || 1;
                var dw = (dec.w || (cat && cat.w) || 48) * sc;
                var dh = (dec.h || (cat && cat.h) || 48) * sc;
                if (Math.abs(sx - dec.x) <= dw * 0.45 && Math.abs(sy - dec.y) <= dh * 0.45) {
                    if (typeof this.handleDecorClick === "function") {
                        this.handleDecorClick(dec.catalogId, dec.x, dec.y, evt);
                    }
                    return;
                }
            }

            if (this.activeDecorTooltip && typeof this.dismissDecorTooltip === "function") {
                this.dismissDecorTooltip(evt);
            }
        }
    });

    if (typeof window.addEventListener === "function") {
        window.addEventListener("beforeunload", function () {
            if (window.PRS_App && typeof window.PRS_App.disposeBackdropCache === "function") {
                window.PRS_App.disposeBackdropCache();
            }
        });
    }
})();
