// ============================================================================
// KiDesky: Princeznino srdce - Královské Map Studio (dynamický sestavovač map a oblíbené plány)
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
    // ========================================================================
    // KRÁLOVSKÉ MAP STUDIO (DYNAMICKÝ SESTAVOVAČ HERNÍHO PLÁNU 2.0)
    // ========================================================================
    mapStudioSeed: 4598,

    mapStudioOptions: null,

    customBoardRecipe: null,

    _currentMapStudioBoard: null,

    MAP_STUDIO_COUNTERS_DEF: [
        { key: "villages", label: "🏘️ Vesnice (V)", labelEn: "🏘️ Villages (V)", min: 0, max: 24 },
        { key: "towns", label: "🏙️ Města (M)", labelEn: "🏙️ Towns (M)", min: 0, max: 14 },
        { key: "castles", label: "🏯 Hrady (H)", labelEn: "🏯 Castles (C)", min: 0, max: 9 },
        { key: "jesters", label: "🃏 Kejklíři (KE)", labelEn: "🃏 Jesters (J)", min: 0, max: 12 },
        { key: "buildings", label: "⚒️ Cechovní živnosti", labelEn: "⚒️ Guild Crafts", min: 0, max: 12 },
        { key: "questsU1", label: "🐗 Zvěř (U1)", labelEn: "🐗 Beasts (T1)", min: 0, max: 16 },
        { key: "questsU2", label: "👹 Monstra (U2)", labelEn: "👹 Monsters (T2)", min: 0, max: 14 },
        { key: "questsU3", label: "🐲 Dračí sluje (U3)", labelEn: "🐲 Dragon Lairs (T3)", min: 0, max: 10 },
        { key: "masters", label: "🧙‍♂️ Mistři ctností", labelEn: "🧙‍♂️ Masters of Virtues", min: 0, max: 20 },
        { key: "merchants", label: "⚖️ Obchodníci", labelEn: "⚖️ Royal Market / Shops", min: 0, max: 10 },
        { key: "festivals", label: "💖 Slavnosti", labelEn: "💖 Royal Festivals", min: 0, max: 12 },
        { key: "chances", label: "❓ Pole Náhody (N)", labelEn: "❓ Chance Tiles (N)", min: 0, max: 24 },
        { key: "taxes", label: "👑 Výběrčí daní", labelEn: "👑 Tax Collector", min: 0, max: 8 },
        { key: "prisons", label: "⛓️ Šatlava", labelEn: "⛓️ Royal Dungeon", min: 0, max: 4 },
        { key: "hospitals", label: "🏥 Lazaret", labelEn: "🏥 Royal Infirmary", min: 0, max: 4 },
        { key: "taverns", label: "🍺 Krčma", labelEn: "🍺 Golden Tavern", min: 0, max: 6 }
    ],

    ensureMapStudioRecipe: function () {
        if (!window.KiDeskyMapGenerator) return;
        if (!this.customBoardRecipe) {
            this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(window.KiDeskyMapGenerator.DEFAULT_RECIPE, this.mapStudioSeed);
        } else {
            this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(this.customBoardRecipe, this.mapStudioSeed);
        }
    },

    switchMapStudioTab: function (tab) {
        this._mapStudioActiveTab = tab;
        var rView = document.getElementById("ms-recipe-view");
        var eView = document.getElementById("ms-editor-view");
        var footer = document.getElementById("ms-modal-footer");
        var btnR = document.getElementById("ms-tab-btn-recipe");
        var btnE = document.getElementById("ms-tab-btn-editor");
        if (!rView || !eView) return;

        if (tab === "editor") {
            rView.style.display = "none";
            eView.style.display = "flex";
            if (footer) {
                footer.style.setProperty("display", "none", "important");
                footer.classList.add("hidden");
            }
            if (btnR) {
                btnR.style.background = "rgba(0,0,0,0.4)";
                btnR.style.borderColor = "rgba(212,175,55,0.3)";
                btnR.style.color = "#cbd5e1";
            }
            if (btnE) {
                btnE.style.background = "linear-gradient(135deg, #a855f7, #7e22ce)";
                btnE.style.borderColor = "#c084fc";
                btnE.style.color = "#fff";
            }
            if (window.PRS_MapEditor) {
                var boardToEdit = this._currentMapStudioBoard || this.mapStudioBoard;
                window.PRS_MapEditor.init(boardToEdit);
            } else {
                var selfMs = this;
                var tEdLoad = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
                eView.innerHTML = '<div style="padding:2rem; text-align:center; color:var(--gold-light); font-size:0.95rem;">' + tEdLoad("ui.loading_module", "⏳ Načítám modul...") + '</div>';
                this.ensureMapEditorLoaded().then(function () {
                    if (selfMs._mapStudioActiveTab === "editor" && window.PRS_MapEditor) {
                        var bEdit = selfMs._currentMapStudioBoard || selfMs.mapStudioBoard;
                        window.PRS_MapEditor.init(bEdit);
                    }
                }).catch(function () {
                    eView.innerHTML = '<div style="padding:2rem; text-align:center; color:#fca5a5; font-size:0.9rem;">' + tEdLoad("ui.loading_module_error", "⚠️ Nepodařilo se načíst modul. Zkontroluj připojení a zkus to znovu.") + '</div>';
                });
            }
        } else {
            eView.style.display = "none";
            rView.style.display = "grid";
            if (footer) {
                footer.style.removeProperty("display");
                footer.style.display = "flex";
                footer.classList.remove("hidden");
            }
            if (btnR) {
                btnR.style.background = "linear-gradient(135deg, #d4af37, #b45309)";
                btnR.style.borderColor = "#fde047";
                btnR.style.color = "#fff";
            }
            if (btnE) {
                btnE.style.background = "rgba(0,0,0,0.4)";
                btnE.style.borderColor = "rgba(168,85,247,0.4)";
                btnE.style.color = "#e9d5ff";
            }
        }
    },

    refreshMapStudioSelectOptions: function () {

        var updateSelect = function (id, mapping) {
            var sel = document.getElementById(id);
            if (!sel || !window.PRS_I18n) return;
            var curVal = sel.value;
            for (var i = 0; i < sel.options.length; i++) {
                var opt = sel.options[i];
                var key = mapping[opt.value];
                if (key) {
                    var tr = window.PRS_I18n.t("map_studio.select_options." + key);
                    if (!tr || tr === ("map_studio.select_options." + key)) {
                        tr = window.PRS_I18n.t("lobby.castles." + opt.value);
                    }
                    if (tr && tr !== ("lobby.castles." + opt.value) && tr !== ("map_studio.select_options." + key)) {
                        opt.textContent = tr;
                    }
                }
            }
            sel.value = curVal;
        };

        updateSelect("ms-route-shape", {
            auto: "shape_auto",
            organic_meander: "shape_organic_meander",
            figure_eight: "shape_figure_eight",
            spiral_citadel: "shape_spiral_citadel",
            twin_valleys: "shape_twin_valleys",
            serpentine: "shape_serpentine",
            star_crossroads: "shape_star_crossroads",
            classic_ring: "shape_classic_ring"
        });

        updateSelect("ms-branches", {
            "0": "branches_0",
            "1": "branches_1",
            "2": "branches_2",
            "3": "branches_3",
            "4": "branches_4"
        });

        updateSelect("ms-river-mode", {
            none: "river_none",
            single: "river_single",
            dual: "river_dual",
            island: "river_island",
            delta: "river_delta"
        });

        updateSelect("ms-master-tier", {
            "1": "tier_1",
            "2": "tier_2",
            "3": "tier_3",
            "4": "tier_4",
            "5": "tier_5"
        });

        updateSelect("ms-biome-theme", {
            balanced: "biome_balanced",
            dragon_peaks: "biome_dragon_peaks",
            forest_realm: "biome_forest_realm",
            river_delta: "biome_river_delta",
            golden_plains: "biome_golden_plains"
        });

        updateSelect("ms-royal-castle", {
            auto: "castle_auto",
            castle_royal: "castle_royal",
            castle_forest: "castle_forest",
            castle_ice: "castle_ice",
            castle_lava: "castle_lava",
            castle_crystal: "castle_crystal",
            castle_wind: "castle_wind",
            castle_water: "castle_water",
            castle_desert: "castle_desert",
            castle_swamp: "castle_swamp",
            castle_dark: "castle_dark"
        });
    },

    openMapStudioModal: function (initialSeed, initialRecipe) {
        this.refreshMapStudioSelectOptions();
        this.mapStudioSeed = initialSeed || this.currentBoardSeed || Math.floor(Math.random() * 899999 + 100000);
        if (initialRecipe && window.KiDeskyMapGenerator) {
            this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(initialRecipe, this.mapStudioSeed);
        } else {
            this.ensureMapStudioRecipe();
        }
        var modal = document.getElementById("map-studio-modal");
        if (modal) {
            modal.style.display = "flex";
            var adminBtn = document.getElementById("btn-ms-admin-save-template");
            if (adminBtn) {
                adminBtn.style.display = (this.currentUser && this.currentUser.role === "Admin") ? "inline-flex" : "none";
            }
            this.syncMapStudioInputsFromRecipe();
            this.renderSavedMapsInStudio();
            this.updateMapStudioPreview();
            this.switchMapStudioTab("recipe");
        }
    },

    closeMapStudioModal: function () {
        var modal = document.getElementById("map-studio-modal");
        if (modal) modal.style.display = "none";
    },

    syncMapStudioInputsFromRecipe: function () {
        this.ensureMapStudioRecipe();
        var r = this.customBoardRecipe;
        if (!r) return;

        var elShape = document.getElementById("ms-route-shape");
        var elBranches = document.getElementById("ms-branches");
        var elTier = document.getElementById("ms-master-tier");
        var elRiver = document.getElementById("ms-river-mode");
        var elBiome = document.getElementById("ms-biome-theme");
        var elRoyal = document.getElementById("ms-royal-castle");
        var elName = document.getElementById("ms-custom-name");
        var elSeed = document.getElementById("ms-seed-input");

        if (elShape) elShape.value = r.routeShape || "auto";
        if (elBranches) elBranches.value = String(r.branches !== undefined ? r.branches : 3);
        if (elTier) elTier.value = String(r.masterTier || 2);
        if (elRiver) elRiver.value = r.riverMode || "single";
        if (elBiome) elBiome.value = r.biomeTheme || "balanced";
        if (elRoyal) elRoyal.value = r.royalCastle || "auto";
        if (elName) elName.value = r.customName || "";
        if (elSeed) elSeed.value = String(this.mapStudioSeed || r.seed || 4598);

        this.renderMapStudioAnimalLevels();
        this.renderMapStudioCounters();
    },

    renderMapStudioAnimalLevels: function () {
        var grid = document.getElementById("ms-animal-levels-grid");
        if (!grid || !this.customBoardRecipe) return;
        var activeLevels = this.customBoardRecipe.animalLevels || [1, 2, 3, 4, 5, 6];
        var trioHint = (window.PRS_I18n ? window.PRS_I18n.t("map_studio.trio_hint", null, "(+S+P)") : "(+S+P)");
        var ribbonColors = {
            1: "#2563eb", 2: "#059669", 3: "#d97706", 4: "#7c3aed",
            5: "#dc2626", 6: "#0891b2", 7: "#ea580c", 8: "#4f46e5",
            9: "#16a34a", 10: "#db2777", 11: "#ca8a04", 12: "#0d9488",
            13: "#9333ea", 14: "#475569"
        };
        var setsCatalog = (window.KiDeskyMapGenerator && (window.KiDeskyMapGenerator.ANIMAL_SETS_CATALOG || window.KiDeskyMapGenerator.ANIMAL_SETS))
            ? (window.KiDeskyMapGenerator.ANIMAL_SETS_CATALOG || window.KiDeskyMapGenerator.ANIMAL_SETS)
            : [];
        var tMs = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var curr = tMs("common.gold_short", null, "zl.");
        var html = "";
        for (var lvl = 1; lvl <= 14; lvl++) {
            var isSelected = activeLevels.indexOf(lvl) !== -1;
            var sDef = setsCatalog[lvl - 1] || {
                horse: "Kůň " + lvl, falcon: "Sokol " + lvl, dog: "Pes " + lvl
            };
            var horseName = tMs("custom_names.node_names." + sDef.horse, null, sDef.horse);
            var falconName = tMs("custom_names.node_names." + sDef.falcon, null, sDef.falcon);
            var dogName = tMs("custom_names.node_names." + sDef.dog, null, sDef.dog);
            var priceText = tMs("map_studio.animal_price_fmt", {
                p1: lvl * 400, p2: lvl * 500, p3: lvl * 600, curr: curr
            }, "Cena " + (lvl * 400) + "/" + (lvl * 500) + "/" + (lvl * 600) + " " + curr);
            var col = ribbonColors[lvl] || "#2563eb";
            var bg = isSelected ? "rgba(16,185,129,0.18)" : "rgba(15,23,42,0.55)";
            var border = isSelected ? "#34d399" : "rgba(255,255,255,0.12)";
            var textCol = isSelected ? "#f8fafc" : "#94a3b8";

            html += '<div onclick="PRS_App.toggleMapStudioAnimalLevel(' + lvl + ')" style="display:flex; align-items:center; justify-content:space-between; gap:4px; background:' + bg + '; border:1px solid ' + border + '; border-radius:6px; padding:4px 6px; cursor:pointer; user-select:none; transition:all 0.15s;" title="' + this.escapeHtml(tMs("map_studio.animal_level_prefix", { lvl: lvl }, "Level " + lvl) + ': ' + horseName + ' • ' + falconName + ' • ' + dogName + ' (' + priceText + ')') + '">' +
                '<div style="display:flex; align-items:center; gap:5px; min-width:0;">' +
                    '<span style="width:14px; height:14px; border-radius:50%; background:' + col + '; color:#fff; font-size:0.62rem; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; border:1px solid rgba(255,255,255,0.5);">' + lvl + '</span>' +
                    '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.7rem; color:' + textCol + '; font-weight:' + (isSelected ? '700' : '500') + ';">' +
                        this.escapeHtml(horseName) + ' <span style="opacity:0.7; font-size:0.64rem;">' + trioHint + '</span>' +
                    '</div>' +
                '</div>' +
                '<span style="font-size:0.74rem; color:' + (isSelected ? '#4ade80' : '#475569') + '; font-weight:bold; flex-shrink:0;">' + (isSelected ? '✓ 3' : '○') + '</span>' +
            '</div>';
        }
        grid.innerHTML = html;

        var sumBadge = document.getElementById("ms-animal-summary-badge");
        if (sumBadge) {
            sumBadge.textContent = tMs("map_studio.animal_summary_badge", { count: activeLevels.length, tiles: activeLevels.length * 3 }, activeLevels.length + " trojic = " + (activeLevels.length * 3) + " polí");
        }
    },

    renderMapStudioCounters: function () {
        var grid = document.getElementById("ms-counters-grid");
        if (!grid || !this.customBoardRecipe) return;
        var r = this.customBoardRecipe;
        var defs = this.MAP_STUDIO_COUNTERS_DEF;
        var html = "";
        for (var i = 0; i < defs.length; i++) {
            var d = defs[i];
            var val = (r[d.key] !== undefined) ? r[d.key] : 0;
            var dLabel = (window.PRS_I18n && d.key) ? window.PRS_I18n.t("map_studio.counters." + d.key, null, d.label) : d.label;
            html += '<div style="display:flex; align-items:center; justify-content:space-between; gap:4px; background:rgba(15,23,42,0.55); border:1px solid rgba(212,175,55,0.18); border-radius:6px; padding:3px 6px;">' +
                '<span style="font-size:0.71rem; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="' + this.escapeHtml(dLabel) + '">' + dLabel + '</span>' +
                '<div style="display:flex; align-items:center; gap:2px; flex-shrink:0;">' +
                    '<button type="button" class="btn-zoom" style="padding:1px 6px; font-size:0.72rem; line-height:1.1;" onclick="PRS_App.changeMapStudioCount(\'' + d.key + '\', -1)">−</button>' +
                    '<input type="number" min="' + d.min + '" max="' + d.max + '" value="' + val + '" onchange="PRS_App.setMapStudioCount(\'' + d.key + '\', this.value)" style="width:36px; text-align:center; background:rgba(0,0,0,0.6); color:#fef08a; border:1px solid rgba(212,175,55,0.3); border-radius:4px; font-size:0.73rem; font-weight:700; padding:1px 2px;" />' +
                    '<button type="button" class="btn-zoom" style="padding:1px 6px; font-size:0.72rem; line-height:1.1;" onclick="PRS_App.changeMapStudioCount(\'' + d.key + '\', 1)">+</button>' +
                '</div>' +
            '</div>';
        }
        grid.innerHTML = html;
    },

    toggleMapStudioAnimalLevel: function (lvl) {
        this.ensureMapStudioRecipe();
        var arr = (this.customBoardRecipe.animalLevels || []).slice();
        var idx = arr.indexOf(lvl);
        if (idx !== -1) {
            if (arr.length <= 1) {
                KiDeskyToast.show("🐾 Na mapě musí zůstat alespoň 1 trojice zvířat.", "warning");
                return;
            }
            arr.splice(idx, 1);
        } else {
            arr.push(lvl);
            arr.sort(function (a, b) { return a - b; });
        }
        this.customBoardRecipe.animalLevels = arr;
        this.renderMapStudioAnimalLevels();
        this.updateMapStudioPreview();
    },

    selectMapStudioAnimalRange: function (mode) {
        this.ensureMapStudioRecipe();
        var arr = [];
        if (mode === "1-6") arr = [1, 2, 3, 4, 5, 6];
        else if (mode === "1-9") arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        else if (mode === "1-12") arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        else if (mode === "all") arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        else if (mode === "odd") arr = [1, 3, 5, 7, 9, 11, 13];
        else if (mode === "even") arr = [2, 4, 6, 8, 10, 12, 14];
        else arr = [1, 2, 3, 4, 5, 6];

        this.customBoardRecipe.animalLevels = arr;
        this.renderMapStudioAnimalLevels();
        this.updateMapStudioPreview();
    },

    changeMapStudioCount: function (key, delta) {
        this.ensureMapStudioRecipe();
        var cur = parseInt(this.customBoardRecipe[key], 10) || 0;
        this.setMapStudioCount(key, cur + delta);
    },

    setMapStudioCount: function (key, rawVal) {
        this.ensureMapStudioRecipe();
        var def = null;
        for (var i = 0; i < this.MAP_STUDIO_COUNTERS_DEF.length; i++) {
            if (this.MAP_STUDIO_COUNTERS_DEF[i].key === key) {
                def = this.MAP_STUDIO_COUNTERS_DEF[i];
                break;
            }
        }
        var minV = def ? def.min : 0;
        var maxV = def ? def.max : 24;
        var v = parseInt(rawVal, 10);
        if (isNaN(v)) v = minV;
        v = Math.max(minV, Math.min(maxV, v));
        this.customBoardRecipe[key] = v;
        this.renderMapStudioCounters();
        this.updateMapStudioPreview();
    },

    onMapStudioTopOptionChange: function () {
        this.ensureMapStudioRecipe();
        var elShape = document.getElementById("ms-route-shape");
        var elBranches = document.getElementById("ms-branches");
        var elTier = document.getElementById("ms-master-tier");
        var elRiver = document.getElementById("ms-river-mode");
        var elBiome = document.getElementById("ms-biome-theme");
        var elRoyal = document.getElementById("ms-royal-castle");
        var elName = document.getElementById("ms-custom-name");

        if (elShape) this.customBoardRecipe.routeShape = elShape.value;
        if (elBranches) this.customBoardRecipe.branches = parseInt(elBranches.value, 10);
        if (elTier) this.customBoardRecipe.masterTier = parseInt(elTier.value, 10);
        if (elRiver) this.customBoardRecipe.riverMode = elRiver.value;
        if (elBiome) this.customBoardRecipe.biomeTheme = elBiome.value;
        if (elRoyal) this.customBoardRecipe.royalCastle = elRoyal.value;
        if (elName) this.customBoardRecipe.customName = elName.value.trim();

        this.updateMapStudioPreview();
    },

    resetMapStudioRecipeToDefault: function () {
        if (!window.KiDeskyMapGenerator) return;
        this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(window.KiDeskyMapGenerator.DEFAULT_RECIPE, this.mapStudioSeed);
        this.syncMapStudioInputsFromRecipe();
        this.updateMapStudioPreview();
        KiDeskyToast.show("↺ Sestava plánu byla obnovena na výchozích 96 polí.", "info");
    },

    applyMapStudioPreset: function (presetKey) {
        if (!window.KiDeskyMapGenerator || !window.KiDeskyMapGenerator.PRESETS) return;
        var p = window.KiDeskyMapGenerator.PRESETS[presetKey];
        if (!p) return;

        if (p.recipe) {
            this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(p.recipe, this.mapStudioSeed);
        }
        this.syncMapStudioInputsFromRecipe();
        this.updateMapStudioPreview();
        KiDeskyToast.show("👑 Aplikována přednastavená sestava: " + (p.name || presetKey), "good");
    },

    rerollMapStudioSeed: function () {
        this.mapStudioSeed = Math.floor(Math.random() * 899999 + 100000);
        if (this.customBoardRecipe) this.customBoardRecipe.seed = this.mapStudioSeed;
        var elSeed = document.getElementById("ms-seed-input");
        if (elSeed) elSeed.value = String(this.mapStudioSeed);
        this.updateMapStudioPreview();
    },

    copyMapStudioSeed: function () {
        var inp = document.getElementById("ms-seed-input");
        var val = (this._currentMapStudioBoard && this._currentMapStudioBoard.seedCode) || (inp && inp.value) || String(this.mapStudioSeed);
        if (!val) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(val).then(function () {
                KiDeskyToast.show("📋 Kód mapy (" + val + ") zkopírován do schránky!", "info");
            });
        } else if (inp) {
            inp.select();
            document.execCommand("copy");
            KiDeskyToast.show("📋 Kód mapy zkopírován do schránky!", "info");
        }
    },

    loadMapStudioFromInputSeed: function () {
        var inp = document.getElementById("ms-seed-input");
        if (!inp || !inp.value) return;
        var raw = inp.value.trim();
        if (/^\d+$/.test(raw)) {
            this.mapStudioSeed = parseInt(raw, 10);
            if (this.customBoardRecipe) this.customBoardRecipe.seed = this.mapStudioSeed;
            this.updateMapStudioPreview();
            return;
        }
        this.applySeedCodeToStudio(raw);
    },

    applySeedCodeToStudio: function (seedStr) {
        if (!window.KiDeskyMapGenerator || !window.KiDeskyMapGenerator.parseSeedCode) return;
        var parsed = window.KiDeskyMapGenerator.parseSeedCode(seedStr);
        if (parsed) {
            if (parsed.seed) this.mapStudioSeed = parsed.seed;
            this.ensureMapStudioRecipe();
            if (parsed.branches !== undefined) this.customBoardRecipe.branches = parsed.branches;
            if (parsed.masterTier) this.customBoardRecipe.masterTier = parsed.masterTier;
            if (parsed.riverMode) this.customBoardRecipe.riverMode = parsed.riverMode;
            if (parsed.biomeTheme) this.customBoardRecipe.biomeTheme = parsed.biomeTheme;
            if (parsed.royalCastle) this.customBoardRecipe.royalCastle = parsed.royalCastle;
            if (parsed.animalSetCount) {
                var lvls = [];
                for (var i = 1; i <= parsed.animalSetCount; i++) lvls.push(i);
                this.customBoardRecipe.animalLevels = lvls;
            }
            this.syncMapStudioInputsFromRecipe();
            this.updateMapStudioPreview();
            KiDeskyToast.show("🗺️ Kód mapy načten a aplikován!", "good");
        } else {
            KiDeskyToast.show("⚠️ Neplatný formát kódu mapy.", "warning");
        }
    },

    saveCurrentMapToFavorites: async function () {
        if (!this._currentMapStudioBoard || !this.customBoardRecipe) return;
        var code = this._currentMapStudioBoard.seedCode || ("KID-" + this.mapStudioSeed);
        var defaultName = (this.customBoardRecipe && this.customBoardRecipe.customName) || this._currentMapStudioBoard.name || ("Vlastní plán #" + this.mapStudioSeed);
        var chosenName = defaultName;

        if (window.KiDeskyDialog && typeof window.KiDeskyDialog.prompt === "function") {
            var promptRes = await window.KiDeskyDialog.prompt("Zadej název pro tuto šablonu plánu:", defaultName, {
                title: "Uložit šablonu do mých plánů",
                icon: "⭐",
                confirmText: "💾 Uložit šablonu",
                cancelText: "Zrušit"
            });
            if (promptRes === null) return; // Uživatel zrušil
            if (promptRes && promptRes.trim()) chosenName = promptRes.trim();
        }

        var list = [];
        try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }

        var clonedRecipe = JSON.parse(JSON.stringify(this.customBoardRecipe));
        clonedRecipe.seed = this.mapStudioSeed;
        clonedRecipe.customName = chosenName;
        this._currentMapStudioBoard.name = chosenName;

        // Pokud již existuje plán se stejným názvem nebo seedem, aktualizujeme jej
        var existingIdx = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i].name === chosenName || (list[i].seed === this.mapStudioSeed && list[i].nodeCount === (this._currentMapStudioBoard.nodes ? this._currentMapStudioBoard.nodes.length : 96))) {
                existingIdx = i;
                break;
            }
        }

        var entry = {
            id: (existingIdx !== -1) ? list[existingIdx].id : ("map_" + Date.now()),
            seedCode: code,
            seed: this.mapStudioSeed,
            name: chosenName,
            nodeCount: this._currentMapStudioBoard.nodes ? this._currentMapStudioBoard.nodes.length : 96,
            recipe: clonedRecipe,
            savedAt: new Date().toLocaleDateString("cs-CZ")
        };

        if (existingIdx !== -1) {
            list[existingIdx] = entry;
        } else {
            list.unshift(entry);
        }

        if (list.length > 25) list = list.slice(0, 25);
        try { localStorage.setItem("prs_saved_maps", JSON.stringify(list)); } catch (e) { }
        this.renderSavedMapsInStudio();
        this.refreshBoardTemplateSelects();
        var lSel = document.getElementById("lobby-board-select");
        if (lSel) lSel.value = "saved_map_0";
        var bSel = document.getElementById("board-template-select");
        if (bSel) bSel.value = "saved_map_0";
        if (this.updateSavedGamesUI) this.updateSavedGamesUI();
        if (this.renderSavedGamesList) this.renderSavedGamesList();
        if (window.KiDeskyToast) {
            window.KiDeskyToast.show("⭐ Šablona „" + chosenName + "“ byla uložena a nastavena pro hru!", "good");
        }
    },

    applySavedFavoriteMap: function (idx) {
        var list = [];
        try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }
        var item = list[idx];
        if (!item) return;
        if (item.seed) this.mapStudioSeed = item.seed;
        this.currentBoardSeed = this.mapStudioSeed;
        if (item.customBoard) {
            this._customProceduralBoard = JSON.parse(JSON.stringify(item.customBoard));
            this._currentMapStudioBoard = this._customProceduralBoard;
            if (window.PRS_BoardBuilder) {
                if (typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                    window.PRS_BoardBuilder.computeRiverBridges(this._customProceduralBoard);
                }
                if ((!this._customProceduralBoard.decorations || this._customProceduralBoard.decorations.length === 0) && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
                    window.PRS_BoardBuilder.generateBoardDecorations(this._customProceduralBoard, this.mapStudioSeed);
                }
            }
            if (item.recipe && window.KiDeskyMapGenerator) {
                this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(item.recipe, this.mapStudioSeed);
                if (item.name) this.customBoardRecipe.customName = item.name;
                this.syncMapStudioInputsFromRecipe();
            }
            if (window.PRS_MapEditor && typeof window.PRS_MapEditor.normalizeBoardForEngine === "function") {
                window.PRS_MapEditor.normalizeBoardForEngine(this._customProceduralBoard);
                window.PRS_MapEditor.normalizeBoardForEngine(this._currentMapStudioBoard);
            }
            this.updateMapStudioPreview();
            KiDeskyToast.show("🗺️ Načtena vlastní šablona: " + (item.name || item.seedCode), "good");
        } else if (item.recipe && window.KiDeskyMapGenerator) {
            this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(item.recipe, this.mapStudioSeed);
            if (item.name) this.customBoardRecipe.customName = item.name;
            this._currentMapStudioBoard = window.KiDeskyMapGenerator.compileDynamicRecipe(this.customBoardRecipe, this.mapStudioSeed);
            this._customProceduralBoard = this._currentMapStudioBoard;
        if (window.PRS_BoardBuilder) {
            if (typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                window.PRS_BoardBuilder.computeRiverBridges(this._customProceduralBoard);
            }
            if ((!this._customProceduralBoard.decorations || this._customProceduralBoard.decorations.length === 0) && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
                window.PRS_BoardBuilder.generateBoardDecorations(this._customProceduralBoard, newSeed);
            }
        }
        if (window.PRS_MapEditor && typeof window.PRS_MapEditor.normalizeBoardForEngine === "function") {
            window.PRS_MapEditor.normalizeBoardForEngine(this._customProceduralBoard);
            window.PRS_MapEditor.normalizeBoardForEngine(this._currentMapStudioBoard);
        }
            this.syncMapStudioInputsFromRecipe();
            this.updateMapStudioPreview();
            KiDeskyToast.show("🗺️ Načtena vlastní šablona: " + (item.name || item.seedCode), "good");
        } else if (item.seedCode) {
            this.applySeedCodeToStudio(item.seedCode);
        }
    },

    playOnSavedFavoriteMap: async function (idx) {
        var list = [];
        try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }
        var item = list[idx];
        if (!item) return;
        this.applySavedFavoriteMap(idx);
        var lobbySel = document.getElementById("lobby-board-select");
        if (lobbySel) lobbySel.value = "saved_map_" + idx;
        var bSel = document.getElementById("board-template-select");
        if (bSel) bSel.value = "saved_map_" + idx;

        if (this.state && this.state.turnNumber > 0) {
            var tmplName = item.name || (window.PRS_I18n ? window.PRS_I18n.t("map_studio.default_custom_map_name", null, "Vlastní plán") : "Vlastní plán");
            var msg = window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_template_msg", { name: tmplName }) : ("Spuštění výpravy na šabloně „" + tmplName + "“ vyžaduje restart partie.\nPřeješ si začít hrát?");
            var conf = await KiDeskyDialog.confirm(msg, {
                title: window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_template_title", null, "Zahájení výpravy na vybraném plánu") : "Zahájení výpravy na vybraném plánu",
                icon: "🗺️",
                confirmText: window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_template_confirm", null, "⚔️ Zahájit hru") : "⚔️ Zahájit hru",
                cancelText: window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_template_cancel", null, "Zpět") : "Zpět"
            });
            if (!conf) return;
        }

        this.startNewGame(true);
        if (this.showPawnToast && this.state) {
            this.showPawnToast(this.state.currentPlayerIndex, "Vítej na plánu " + (item.name || ("#" + item.seed)), "🗺️", "#a855f7", "rgba(15, 23, 42, 0.96)");
        }
    },

    editSavedFavoriteMapInStudio: function (idx) {
        var list = [];
        try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }
        var item = list[idx];
        if (!item) return;
        this.openMapStudioModal(item.seed, item.recipe);
    },

    deleteSavedFavoriteMap: function (idx, ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        var list = [];
        try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }
        if (idx >= 0 && idx < list.length) {
            list.splice(idx, 1);
            try { localStorage.setItem("prs_saved_maps", JSON.stringify(list)); } catch (e) { }
            this.renderSavedMapsInStudio();
            this.refreshBoardTemplateSelects();
            if (this.updateSavedGamesUI) this.updateSavedGamesUI();
            if (this.renderSavedGamesList) this.renderSavedGamesList();
            KiDeskyToast.show("🗑️ Šablona plánu byla odebrána.", "neutral");
        }
    },

    renderSavedMapsInStudio: function () {
        var wrap = document.getElementById("ms-saved-maps-list");
        if (!wrap) return;
        var list = [];
        try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }
        if (!list.length) {
            wrap.innerHTML = '<span style="font-size:0.7rem; color:#64748b;">Zatím žádné uložené vlastní sestavy.</span>';
            return;
        }
        var html = "";
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var shortName = this.escapeHtml(item.name || item.seedCode);
            html += '<span style="display:inline-flex; align-items:center; gap:4px; background:rgba(212,175,55,0.14); border:1px solid rgba(212,175,55,0.38); border-radius:6px; padding:2px 6px; font-size:0.7rem; color:#fef08a; cursor:pointer;" onclick="PRS_App.applySavedFavoriteMap(' + i + ')" title="Načíst uloženou sestavu">' +
                '⭐ ' + shortName + ' (' + (item.nodeCount || 78) + ')' +
                '<span onclick="PRS_App.deleteSavedFavoriteMap(' + i + ', event)" style="color:#f87171; font-weight:bold; margin-left:3px;" title="Odebrat">×</span>' +
                '</span>';
        }
        wrap.innerHTML = html;
    },

    updateMapStudioPreview: function () {
        if (!window.KiDeskyMapGenerator) return;
        this.ensureMapStudioRecipe();
        this.customBoardRecipe.seed = this.mapStudioSeed;

        var board = window.KiDeskyMapGenerator.compileDynamicRecipe(this.customBoardRecipe, this.mapStudioSeed);
        this._currentMapStudioBoard = board;
        this.mapStudioOptions = board.generatorOptions || {};

        // Vykreslení živého SVG minináhledu
        var container = document.getElementById("ms-preview-container");
        if (container && window.KiDeskyMapGenerator.renderMiniPreviewSVG) {
            container.innerHTML = window.KiDeskyMapGenerator.renderMiniPreviewSVG(board, 580, 360);
        }

        // Titulek a odznaky
        var elTitle = document.getElementById("ms-preview-title");
        var elBadge = document.getElementById("ms-preview-badge");
        var elStats = document.getElementById("ms-preview-stats");
        var elInput = document.getElementById("ms-seed-input");

        if (elTitle) {
            var rawName = board.name || ("Vlastní království #" + this.mapStudioSeed);
            if (this.formatBoardDisplayName) {
                elTitle.textContent = this.formatBoardDisplayName(rawName);
            } else if (window.PRS_App && window.PRS_App.formatBoardDisplayName) {
                elTitle.textContent = window.PRS_App.formatBoardDisplayName(rawName);
            } else {
                elTitle.textContent = rawName;
            }
        }
        var tMsPrev = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        if (elBadge) {
            var aCnt = (this.customBoardRecipe.animalLevels || []).length;
            var shapeObj = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES[board.routeShape]);
            var shapeKey = board.routeShape ? ("map_studio.select_options.shape_" + board.routeShape) : null;
            var shapeFallback = shapeObj ? shapeObj.name : tMsPrev("map_studio.procedural_route", null, "Procedurální trasa");
            var shapeName = (shapeKey && window.PRS_I18n && window.PRS_I18n.t(shapeKey) !== shapeKey)
                ? window.PRS_I18n.t(shapeKey)
                : shapeFallback;
            elBadge.textContent = board.nodes.length + " " + tMsPrev("map_studio.stats.tiles", null, "polí") +
                " • " + aCnt + " " + tMsPrev("map_studio.stats.trios", null, "trojic zvířat") +
                " • " + (this.customBoardRecipe.branches || 0) + " " + tMsPrev("map_studio.stats.branches", null, "větví") +
                " • " + shapeName;
        }
        if (elInput && document.activeElement !== elInput) {
            elInput.value = String(this.mapStudioSeed);
        }

        if (elStats) {
            var r = this.customBoardRecipe;
            var brCnt = (board.bridges && board.bridges.length) ? board.bridges.length : 0;
            var romanTiers = ["I", "II", "III", "IV"];
            var tTierLabel = (r.masterTier === 5) ? "RPG I→IV" : (tMsPrev("map_studio.stats.tier_prefix", null, "Stupeň") + " " + (romanTiers[(r.masterTier || 2) - 1] || "II"));

            var warnings = [];
            if (r.questsU3 < 2) warnings.push(tMsPrev("map_studio.stats.warn_slayer", null, "Pro scénář Lovci draků doporučeno alespoň 2× Drak U3"));
            if (r.towns < 3 || r.castles < 1) warnings.push(tMsPrev("map_studio.stats.warn_tycoon", null, "Pro scénář Magnát doporučeno 3× Město + 1× Hrad"));

            var validHtml = warnings.length === 0
                ? (' • <span style="color:#4ade80; font-weight:700;">✓ ' + tMsPrev("map_studio.stats.all_scenarios", null, "Všechny scénáře splnitelné") + '</span>')
                : (' • <span style="color:#f87171;" title="' + this.escapeHtml(warnings.join(" | ")) + '">⚠️ ' + tMsPrev("map_studio.stats.warn_badge", null, "Upozornění ke scénářům") + '</span>');

            elStats.innerHTML =
                '<span>🏯 ' + r.castles + ' ' + tMsPrev("map_studio.stats.castles", null, "Hrady") + '</span> • ' +
                '<span>🏙️ ' + r.towns + ' ' + tMsPrev("map_studio.stats.towns", null, "Města") + '</span> • ' +
                '<span>🏘️ ' + r.villages + ' ' + tMsPrev("map_studio.stats.villages", null, "Vesnice") + '</span> • ' +
                '<span>🃏 ' + r.jesters + ' ' + tMsPrev("map_studio.stats.jesters", null, "Kejklíři") + '</span> • ' +
                '<span>⚒️ ' + r.buildings + ' ' + tMsPrev("map_studio.stats.buildings", null, "Živnosti") + '</span> • ' +
                '<span>🐗 ' + r.questsU1 + ' U1</span> • ' +
                '<span>👹 ' + r.questsU2 + ' U2</span> • ' +
                '<span>🐲 ' + r.questsU3 + ' ' + tMsPrev("map_studio.stats.dragons", null, "Draci U3") + '</span> • ' +
                '<span>🧙‍♂️ ' + r.masters + ' ' + tMsPrev("map_studio.stats.masters", null, "Mistři") + ' (' + tTierLabel + ')</span> • ' +
                '<span>💖 ' + r.festivals + ' ' + tMsPrev("map_studio.stats.festivals", null, "Slavnosti") + '</span> • ' +
                '<span>🌉 ' + brCnt + ' ' + tMsPrev("map_studio.stats.bridges", null, "mostů") + '</span>' +
                validHtml;
        }
    },

    applyMapStudioBoardAndStart: async function (fromEditor) {
        if (!fromEditor && this._mapStudioActiveTab === "editor" && window.PRS_MapEditor && window.PRS_MapEditor.board) {
            window.PRS_MapEditor.playOnThisBoard();
            return;
        }
        if (!this._currentMapStudioBoard || !this.customBoardRecipe) return;
        this.closeMapStudioModal();

        var newSeed = this.mapStudioSeed;
        this.currentBoardSeed = newSeed;
        this.customBoardRecipe.seed = newSeed;

        if (this.state && this.state.turnNumber > 0) {
            var bName = this._currentMapStudioBoard.name || newSeed;
            var nodeCount = this._currentMapStudioBoard.nodes ? this._currentMapStudioBoard.nodes.length : 96;
            var msg = window.PRS_I18n
                ? window.PRS_I18n.t("map_studio.start_quest_dyn_msg", { name: bName, count: nodeCount })
                : ("Spuštění nové výpravy na vlastním dynamickém plánu vyžaduje restart partie.\nPřeješ si začít hrát na plánu „" + bName + "“ (" + nodeCount + " polí)?");
            var conf = await KiDeskyDialog.confirm(msg, {
                title: window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_dyn_title", null, "Zahájení výpravy na vlastním plánu") : "Zahájení výpravy na vlastním plánu",
                icon: "🗺️",
                confirmText: window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_dyn_confirm", null, "⚔️ Zahájit hru na tomto plánu") : "⚔️ Zahájit hru na tomto plánu",
                cancelText: window.PRS_I18n ? window.PRS_I18n.t("map_studio.start_quest_dyn_cancel", null, "Zpět k partii") : "Zpět k partii"
            });
            if (!conf) return;
        }

        this._customProceduralBoard = this._currentMapStudioBoard;
        if (window.PRS_MapEditor && typeof window.PRS_MapEditor.normalizeBoardForEngine === "function") {
            window.PRS_MapEditor.normalizeBoardForEngine(this._customProceduralBoard);
            window.PRS_MapEditor.normalizeBoardForEngine(this._currentMapStudioBoard);
        }

        // Automaticky zajistit, aby byl plán uložen i v mých šablonách (prs_saved_maps)
        if (this.saveBoardAsTemplate) {
            var activeName = (this.customBoardRecipe && this.customBoardRecipe.customName) || this._currentMapStudioBoard.name || ("Vlastní plán #" + newSeed);
            this.saveBoardAsTemplate(this._currentMapStudioBoard, activeName);
        }

        var bSel = document.getElementById("board-template-select");
        if (bSel) bSel.value = "saved_map_0";
        var lobbySel = document.getElementById("lobby-board-select");
        if (lobbySel) lobbySel.value = "saved_map_0";

        try {
            localStorage.removeItem("prs_active_online_room");
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, "", window.location.pathname);
            }
        } catch (e) { }

        await this.startNewGame(true);
        if (this.showPawnToast && this.state) {
            this.showPawnToast(this.state.currentPlayerIndex, "Vítej na plánu " + (this._currentMapStudioBoard.name || ("#" + newSeed)), "🗺️", "#a855f7", "rgba(15, 23, 42, 0.96)");
        }
    }
    });
})();
