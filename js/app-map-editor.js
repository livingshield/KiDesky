// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Královské Map Studio: Vizuální WYSIWYG Editor 2.0
// Umožňuje kompletní vizuální úpravu hracího plánu klikáním a tažením:
// 1. Plynulý Drag & Drop uzlů přímo na plátně (60 FPS, bez blikání a zadrhávání)
// 2. Inspektor políček (Změna typu, názvu, nákupní ceny, nájmu i úrovně/stupně)
// 3. Nástroj ➕ Přidat pole (vytvoření nového políčka klikem do mapy)
// 4. Nástroj 🗑️ Smazat pole (s bezpečným přemostěním trasy a ochranou STARTu)
// 5. Nástroj 🔄 Prohození dvou polí (Swap pro okamžité vyvážení plánu)
// 6. Nástroj 🔗 Spojení / rozpojení cest (Link / Unlink)
// 7. Krok zpět (Undo), zoom & pan plátna, uložení do šablon a přímé spuštění hry
// ============================================================================

(function () {
    if (!window.PRS_MapEditor) window.PRS_MapEditor = {};

    var Editor = {
        board: null,
        activeTool: "select", // "select" | "pan" | "move" | "add" | "swap" | "link" | "river" | "castle"
        selectedNodeId: null,
        selectedEdge: null, // { from: number, to: number }
        selectedRiverIdx: 0,
        selectedRiverPtIdx: null,
        isDrawingRiver: false,
        drawRiverPoints: [],
        activeBiomeBrush: "forest",
        biomeBrushRadius: 110,
        _isPaintingBiome: false,
        inspectorMode: "node", // "node" | "edge" | "river" | "castle"
        swapSourceNodeId: null,
        linkSourceNodeId: null,
        isDragging: false,
        dragNodeId: null,
        pendingDrag: null,
        undoStack: [],
        maxUndo: 20,
        _keyHandlerAttached: false,
        viewport: {
            x: 0,
            y: 0,
            zoom: 1.0,
            isPanning: false,
            hasPanned: false,
            startMouseX: 0,
            startMouseY: 0,
            startViewX: 0,
            startViewY: 0
        },

        // Inicializace editoru s daným plánem
        init: function (board) {
            if (!board) {
                if (window.PRS_App && window.PRS_App._currentMapStudioBoard) {
                    board = window.PRS_App._currentMapStudioBoard;
                } else if (window.PRS_App && window.PRS_App.mapStudioBoard) {
                    board = window.PRS_App.mapStudioBoard;
                } else if (window.PRS_App && window.PRS_App.state && window.PRS_App.state.board) {
                    board = window.PRS_App.state.board;
                }
            }
            if (!board) return;

            // Samostatná hluboká kopie pro editaci
            this.board = JSON.parse(JSON.stringify(board));
            this.syncNodeBranches(this.board, !this.board._branchesSynced);
            this.board._branchesSynced = true;
            this.normalizeBoardForEngine(this.board);
            this.refreshBoardDerivedLayers(this.board);
            this.activeTool = "select";
            this.selectedNodeId = null;
            this.selectedEdge = null;
            this.selectedRiverIdx = 0;
            this.selectedRiverPtIdx = null;
            this.isDrawingRiver = false;
            this.drawRiverPoints = [];
            this._isPaintingBiome = false;
            this.inspectorMode = "node";
            this.swapSourceNodeId = null;
            this.linkSourceNodeId = null;
            this.isDragging = false;
            this.dragNodeId = null;
            this.pendingDrag = null;
            this.undoStack = [];
            this.viewport = {
                x: 0,
                y: 0,
                zoom: 1.0,
                isPanning: false,
                hasPanned: false,
                startMouseX: 0,
                startMouseY: 0,
                startViewX: 0,
                startViewY: 0
            };

            this.renderEditorUI();
            this.renderCanvas();
            this.updateInspectorUI();
            this.updateToolButtons();
            this.applyViewport();
            this.attachKeyboardShortcuts();
        },

        attachKeyboardShortcuts: function () {
            if (this._keyHandlerAttached) return;
            var self = this;
            window.addEventListener("keydown", function (e) {
                // Pouze pokud je editor zobrazen
                var eView = document.getElementById("ms-editor-view");
                if (!eView || eView.style.display === "none") return;

                // Nekolidovat se psaním do inputu
                var tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "");
                if (tag === "input" || tag === "select" || tag === "textarea") return;

                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                    e.preventDefault();
                    self.undo();
                } else if (e.key === "Delete" || e.key === "Backspace") {
                    if (self.inspectorMode === "edge" && self.selectedEdge) {
                        e.preventDefault();
                        self.removeEdge(self.selectedEdge.from, self.selectedEdge.to);
                    } else if (self.selectedNodeId !== null) {
                        e.preventDefault();
                        self.deleteSelectedNode();
                    }
                } else if (e.key === "Enter" && self.activeTool === "river" && self.isDrawingRiver) {
                    e.preventDefault();
                    self.finishDrawRiver();
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    if (self.isDrawingRiver) {
                        self.cancelDrawRiver();
                        return;
                    }
                    self.selectedNodeId = null;
                    self.selectedEdge = null;
                    self.selectedRiverPtIdx = null;
                    self.swapSourceNodeId = null;
                    self.linkSourceNodeId = null;
                    self.inspectorMode = "node";
                    self.updateStatusHelp();
                    self.updateInspectorUI();
                    self.renderCanvas();
                } else if (e.key === "+" || e.key === "=") {
                    e.preventDefault();
                    self.zoomBy(1.2);
                } else if (e.key === "-") {
                    e.preventDefault();
                    self.zoomBy(0.8);
                } else if (e.key === "0") {
                    e.preventDefault();
                    self.resetZoom();
                }
            });
            this._keyHandlerAttached = true;
        },

        // Uložení stavu do historie kroků zpět (Undo)
        pushUndo: function () {
            if (!this.board) return;
            var snap = JSON.stringify(this.board);
            this.undoStack.push(snap);
            if (this.undoStack.length > this.maxUndo) {
                this.undoStack.shift();
            }
            this.board.isCustomWysiwyg = true;
            var btnUndo = document.getElementById("me-btn-undo");
            if (btnUndo) btnUndo.disabled = false;
        },

        // Vrátit krok zpět (Undo)
        undo: function () {
            if (this.undoStack.length === 0) return;
            var prev = this.undoStack.pop();
            try {
                this.board = JSON.parse(prev);
                this.selectedNodeId = null;
                this.selectedEdge = null;
                this.selectedRiverPtIdx = null;
                this.swapSourceNodeId = null;
                this.linkSourceNodeId = null;
                if (this.inspectorMode !== "river" && this.inspectorMode !== "castle") {
                    this.inspectorMode = "node";
                }
                this.renderCanvas();
                this.updateInspectorUI();
                if (window.KiDeskyToast) window.KiDeskyToast.show("↩️ Krok vrácen zpět", "turn");
            } catch (e) {
                console.error("Undo error:", e);
            }
            var btnUndo = document.getElementById("me-btn-undo");
            if (btnUndo) btnUndo.disabled = (this.undoStack.length === 0);
        },

        // Přepnutí aktivního nástroje
        setTool: function (toolName) {
            if (toolName !== "river" && this.isDrawingRiver) {
                this.isDrawingRiver = false;
                this.drawRiverPoints = [];
            }
            this.activeTool = toolName;
            this.swapSourceNodeId = null;
            this.linkSourceNodeId = null;
            this.selectedRiverPtIdx = null;

            if (toolName === "river") {
                if (this.board && !Array.isArray(this.board.rivers)) this.board.rivers = [];
                this.selectedNodeId = null;
                this.selectedEdge = null;
                this.inspectorMode = "river";
                if (this.board && this.selectedRiverIdx >= this.board.rivers.length) {
                    this.selectedRiverIdx = 0;
                }
            } else if (toolName === "biome") {
                if (this.board && !Array.isArray(this.board.biomeZones)) this.board.biomeZones = [];
                this.selectedNodeId = null;
                this.selectedEdge = null;
                this.inspectorMode = "biome";
            } else if (toolName === "castle") {
                if (this.board) this.getRoyalCastleLandmark();
                this.selectedNodeId = null;
                this.selectedEdge = null;
                this.inspectorMode = "castle";
            } else if (toolName !== "link") {
                if (this.inspectorMode === "river" || this.inspectorMode === "castle" || this.inspectorMode === "biome") {
                    this.inspectorMode = this.selectedEdge ? "edge" : "node";
                }
            }

            this.updateToolButtons();
            this.updateStatusHelp();
            this.updateCursor();
            this.updateInspectorUI();
            this.renderCanvas();
        },

        updateCursor: function () {
            var svg = document.getElementById("me-svg-canvas");
            if (!svg) return;
            if (this.activeTool === "pan") {
                svg.style.cursor = (this.viewport && this.viewport.isPanning) ? "grabbing" : "grab";
            } else if (this.activeTool === "move" || this.activeTool === "castle") {
                svg.style.cursor = "move";
            } else if (this.activeTool === "add" || this.activeTool === "biome" || (this.activeTool === "river" && this.isDrawingRiver)) {
                svg.style.cursor = "crosshair";
            } else if (this.activeTool === "river") {
                svg.style.cursor = "pointer";
            } else {
                svg.style.cursor = "pointer";
            }
        },

        updateToolButtons: function () {
            var tools = ["select", "add", "swap", "link", "river", "biome", "castle", "pan", "move"];
            for (var i = 0; i < tools.length; i++) {
                var btn = document.getElementById("me-tool-" + tools[i]);
                if (btn) {
                    if (tools[i] === this.activeTool) {
                        btn.style.background = "linear-gradient(135deg, #f59e0b, #d97706)";
                        btn.style.color = "#fff";
                        btn.style.borderColor = "#fef08a";
                        btn.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.5)";
                    } else {
                        btn.style.background = "rgba(0,0,0,0.45)";
                        btn.style.color = "#cbd5e1";
                        btn.style.borderColor = "rgba(212,175,55,0.3)";
                        btn.style.boxShadow = "none";
                    }
                }
            }
        },

        updateStatusHelp: function () {
            var helpEl = document.getElementById("me-status-help");
            if (!helpEl) return;
            var tSt = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var text = "";
            if (this.activeTool === "select") {
                text = tSt("map_editor.status.select", null, "👆 <strong>Inspektor &amp; Přesun:</strong> Klikni na políčko, <strong>cestu</strong> nebo <strong>Hlavní hrad</strong> pro úpravu parametrů a směrů, případně prvek <strong>tažením přemísti</strong>.");
            } else if (this.activeTool === "pan") {
                text = tSt("map_editor.status.pan", null, "🧭 <strong>Posun mapy:</strong> Chytni plátno myší/prstem kdekoliv a tažením posouvej celou herní desku. Kolečkem myši přibližuj a oddaluj.");
            } else if (this.activeTool === "move") {
                text = tSt("map_editor.status.move", null, "📍 <strong>Režim přesunu:</strong> Chytni kterékoliv políčko nebo Hlavní hrad a tažením ho přemísti na požadovanou pozici. Cesty i mosty se přizpůsobí.");
            } else if (this.activeTool === "add") {
                text = tSt("map_editor.status.add", null, "➕ <strong>Přidat pole:</strong> Klikni kamkoliv na mapu pro umístění nového políčka. Pokud je vybráno předchozí pole, automaticky se propojí.");
            } else if (this.activeTool === "swap") {
                if (this.swapSourceNodeId === null) {
                    text = tSt("map_editor.status.swap_step1", null, "🔄 <strong>Prohození:</strong> Krok 1/2 – Klikni na PRVNÍ políčko, které chceš prohodit.");
                } else {
                    text = tSt("map_editor.status.swap_step2", null, "🔄 <strong>Prohození:</strong> Krok 2/2 – Nyní klikni na DRUHÉ políčko pro vzájemné prohození obsahu.");
                }
            } else if (this.activeTool === "link") {
                if (this.linkSourceNodeId === null) {
                    text = tSt("map_editor.status.link_step1", null, "🔗 <strong>Cesty &amp; Směry:</strong> Klikni na <strong>existující čáru cesty</strong> pro otočení směru či smazání, NEBO klikni postupně na 2 políčka pro vytvoření/zrušení spojení.");
                } else {
                    text = tSt("map_editor.status.link_step2", { id: this.linkSourceNodeId }, "🔗 <strong>Cesty &amp; Směry:</strong> Krok 2/2 – Nyní klikni na cílové políčko pro vytvoření cesty z #" + this.linkSourceNodeId + " (nebo zrušení existující).");
                }
            } else if (this.activeTool === "river") {
                if (this.isDrawingRiver) {
                    text = tSt("map_editor.status.river_draw", null, "✏️ <strong>Kreslení nové řeky:</strong> Klikej po mapě body trasy od pramene po ústí. Dvojklikem, klávesou <kbd>Enter</kbd> nebo tlačítkem <strong>Dokončit tok</strong> křivku uzavřeš.");
                } else {
                    text = tSt("map_editor.status.river", null, "🌊 <strong>Editor řeky:</strong> Táhni <strong style='color:#38bdf8;'>modré uzly</strong> nebo <strong style='color:#facc15;'>žlutá táhla</strong>, případně klikni na <strong>Nakreslit vlastní tok</strong>.");
                }
            } else if (this.activeTool === "biome") {
                text = tSt("map_editor.status.biome", null, "🎨 <strong>Štětec biomů:</strong> Vyber v inspektoru biom (nebo gumu) a kliknutím či tažením maluj krajinu. Poté přepočti dekorace.");
            } else if (this.activeTool === "castle") {
                text = tSt("map_editor.status.castle", null, "🏰 <strong>Hlavní hrad:</strong> Tažením myší přesuň dominantu Královského hradu na libovolné místo mapy a v panelu vpravo dole uprav jeho vzhled, velikost i otočení.");
            }
            helpEl.innerHTML = text;
        },

        getCurrentViewBox: function () {
            if (!this.viewport) {
                this.viewport = { x: 0, y: 0, zoom: 1.0 };
            }
            var z = this.viewport.zoom || 1.0;
            var w = 1400 / z;
            var h = 860 / z;
            return {
                x: this.viewport.x || 0,
                y: this.viewport.y || 0,
                w: w,
                h: h
            };
        },

        applyViewport: function () {
            var svg = document.getElementById("me-svg-canvas");
            if (!svg) return;
            var vb = this.getCurrentViewBox();
            svg.setAttribute("viewBox", vb.x.toFixed(1) + " " + vb.y.toFixed(1) + " " + vb.w.toFixed(1) + " " + vb.h.toFixed(1));
            var zoomPct = Math.round((this.viewport.zoom || 1.0) * 100);
            var lbl = document.getElementById("me-zoom-label");
            if (lbl) lbl.textContent = zoomPct + "%";
        },

        resetZoom: function () {
            if (!this.viewport) this.viewport = {};
            this.viewport.x = 0;
            this.viewport.y = 0;
            this.viewport.zoom = 1.0;
            this.applyViewport();
        },

        fitToScreen: function () {
            this.resetZoom();
        },

        zoomBy: function (factor) {
            var svg = document.getElementById("me-svg-canvas");
            if (!svg) return;
            var rect = svg.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;
            this.zoomAtPoint(cx, cy, factor);
        },

        zoomAtPoint: function (clientX, clientY, factor) {
            var svg = document.getElementById("me-svg-canvas");
            if (!svg) return;
            var rect = svg.getBoundingClientRect();
            if (!this.viewport) this.viewport = { x: 0, y: 0, zoom: 1.0 };

            var curVb = this.getCurrentViewBox();
            var relX = (clientX - rect.left) / rect.width;
            var relY = (clientY - rect.top) / rect.height;
            var svgX = curVb.x + relX * curVb.w;
            var svgY = curVb.y + relY * curVb.h;

            var oldZoom = this.viewport.zoom || 1.0;
            var newZoom = Math.max(0.45, Math.min(3.5, oldZoom * factor));
            this.viewport.zoom = newZoom;

            var newW = 1400 / newZoom;
            var newH = 860 / newZoom;

            this.viewport.x = svgX - relX * newW;
            this.viewport.y = svgY - relY * newH;

            this.applyViewport();
        },

        // ====================================================================
        // VYKRESLENÍ SVG PLÁTNA EDITORU
        // ====================================================================
        renderCanvas: function () {
            var container = document.getElementById("me-canvas-container");
            if (!container || !this.board || !this.board.nodes) return;

            var board = this.board;
            var nodes = board.nodes;
            var out = [];

            var vb = this.getCurrentViewBox();
            var cursorStyle = (this.activeTool === "pan" ? "grab" : (this.activeTool === "move" ? "move" : (this.activeTool === "add" ? "crosshair" : "pointer")));

            out.push('<svg id="me-svg-canvas" viewBox="' + vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1) + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#140d07; border-radius:10px; display:block; user-select:none; touch-action:none; cursor:' + cursorStyle + ';" xmlns="http://www.w3.org/2000/svg">');

            // 0. Pozadí pro plynulý posun i mimo základní rámec
            out.push('  <rect id="me-bg-rect" x="-2500" y="-2000" width="6400" height="4860" fill="#140d07"/>');

            // 1. Pergamenový podklad
            out.push('  <rect x="10" y="10" width="1380" height="840" rx="16" fill="#1b130c" stroke="#d4af37" stroke-width="2.5"/>');

            // 2. Biomy (výchozí + ručně malované zóny)
            var isBiomeEditMode = (this.activeTool === "biome" || this.inspectorMode === "biome");
            if (board.biomes) {
                for (var bm = 0; bm < board.biomes.length; bm++) {
                    var bio = board.biomes[bm];
                    out.push('  <path d="' + bio.path + '" fill="' + (bio.fill || "rgba(255,255,255,0.06)") + '" opacity="0.38" pointer-events="none"/>');
                }
            }
            var biomePalette = {
                forest:   { fill: "rgba(21, 128, 61, 0.42)",  stroke: "#4ade80", icon: "🌲" },
                meadow:   { fill: "rgba(132, 204, 22, 0.36)", stroke: "#bef264", icon: "🌿" },
                farmland: { fill: "rgba(234, 179, 8, 0.38)",  stroke: "#fde047", icon: "🌾" },
                rocky:    { fill: "rgba(120, 113, 108, 0.48)",stroke: "#d6d3d1", icon: "⛰️" },
                wetland:  { fill: "rgba(14, 165, 233, 0.42)", stroke: "#7dd3fc", icon: "🌊" }
            };
            out.push('  <g id="me-biome-zones-layer" pointer-events="none">');
            if (Array.isArray(board.biomeZones)) {
                for (var bzi = 0; bzi < board.biomeZones.length; bzi++) {
                    var bz = board.biomeZones[bzi];
                    if (!bz || !bz.biome) continue;
                    var bp = biomePalette[bz.biome] || biomePalette.meadow;
                    var bzDash = isBiomeEditMode ? ' stroke="' + bp.stroke + '" stroke-width="1.6" stroke-dasharray="6,4"' : '';
                    out.push('    <circle cx="' + Math.round(bz.x) + '" cy="' + Math.round(bz.y) + '" r="' + Math.round(bz.r || 90) + '" fill="' + bp.fill + '" opacity="' + (isBiomeEditMode ? "0.75" : "0.48") + '"' + bzDash + '/>');
                    if (isBiomeEditMode) {
                        out.push('    <text x="' + Math.round(bz.x) + '" y="' + (Math.round(bz.y) + 5) + '" text-anchor="middle" font-size="15" opacity="0.85">' + bp.icon + '</text>');
                    }
                }
            }
            out.push('  </g>');

            // 3. Řeka Doubravka (víceprůchodově pro přirozené soutoky a křížení už v editoru)
            var isRiverEditMode = (this.activeTool === "river" || this.inspectorMode === "river");
            if (board.rivers && board.rivers.length > 0) {
                var rivSpecs = [];
                for (var r = 0; r < board.rivers.length; r++) {
                    var riv = board.rivers[r];
                    var rw = (riv.customWidth && riv.width) ? Math.max(10, Math.min(64, riv.width)) : ((riv.width && riv.width >= 28) ? riv.width : (riv.isTributary ? 24 : 38));
                    rivSpecs.push({ idx: r, riv: riv, rw: rw, selected: (isRiverEditMode && this.selectedRiverIdx === r) });
                }
                for (var rs0 = 0; rs0 < rivSpecs.length; rs0++) {
                    if (rivSpecs[rs0].selected) {
                        out.push('  <path class="me-river-sel" data-river-idx="' + rivSpecs[rs0].idx + '" d="' + rivSpecs[rs0].riv.path + '" stroke="rgba(250,204,21,0.55)" stroke-width="' + (rivSpecs[rs0].rw + 22) + '" fill="none" stroke-linecap="round" stroke-dasharray="10,6" pointer-events="none"/>');
                    }
                }
                for (var rs1 = 0; rs1 < rivSpecs.length; rs1++) {
                    out.push('  <path class="me-river-bank" data-river-idx="' + rivSpecs[rs1].idx + '" d="' + rivSpecs[rs1].riv.path + '" stroke="#dfbe86" stroke-width="' + (rivSpecs[rs1].rw + 14) + '" fill="none" opacity="0.85" stroke-linecap="round" pointer-events="none"/>');
                }
                for (var rs2 = 0; rs2 < rivSpecs.length; rs2++) {
                    out.push('  <path class="me-river-water" data-river-idx="' + rivSpecs[rs2].idx + '" d="' + rivSpecs[rs2].riv.path + '" stroke="#0369a1" stroke-width="' + rivSpecs[rs2].rw + '" fill="none" opacity="0.96" stroke-linecap="round" pointer-events="none"/>');
                }
                for (var rs3 = 0; rs3 < rivSpecs.length; rs3++) {
                    out.push('  <path class="me-river-foam" data-river-idx="' + rivSpecs[rs3].idx + '" d="' + rivSpecs[rs3].riv.path + '" stroke="#38bdf8" stroke-width="' + Math.max(4, rivSpecs[rs3].rw * 0.45).toFixed(1) + '" fill="none" opacity="0.85" stroke-linecap="round" pointer-events="none"/>');
                }
                if (!this.isDrawingRiver) {
                    for (var rs4 = 0; rs4 < rivSpecs.length; rs4++) {
                        out.push('  <path class="me-river-path" data-river-idx="' + rivSpecs[rs4].idx + '" d="' + rivSpecs[rs4].riv.path + '" stroke="transparent" stroke-width="' + Math.max(rivSpecs[rs4].rw + 18, 44) + '" fill="none" stroke-linecap="round" style="cursor:pointer;" onclick="PRS_MapEditor.onRiverPathClick(event, ' + rivSpecs[rs4].idx + ')"/>');
                    }
                }
            }

            // 4. Cesty (hrany grafu) se směrovými šipkami, štítky rozcestí (1-3 / 4-6) a klikatelnou oblastí
            for (var i = 0; i < nodes.length; i++) {
                var nA = nodes[i];
                var tgts = nA.next || [];
                var isJunctionNode = tgts.length >= 2;
                for (var t = 0; t < tgts.length; t++) {
                    var nB = this.getNodeById(tgts[t]);
                    if (!nB) continue;

                    var isSelectedEdge = !!(this.selectedEdge && this.selectedEdge.from === nA.id && this.selectedEdge.to === nB.id);
                    var isLinkCandidate = (this.activeTool === "link" && (nA.id === this.linkSourceNodeId || nB.id === this.linkSourceNodeId));
                    var isSideBranchEdge = (isJunctionNode && t === 1);
                    var isMainBranchEdge = (isJunctionNode && t === 0);

                    var strokeCol = isSelectedEdge ? "#facc15" : (isLinkCandidate ? "#38bdf8" : (isSideBranchEdge ? "rgba(245,158,11,0.88)" : (isMainBranchEdge ? "rgba(56,189,248,0.88)" : "rgba(212,175,55,0.68)")));
                    var strokeW = isSelectedEdge ? 7 : (isLinkCandidate ? 6 : 4.5);
                    var strokeDash = isLinkCandidate ? 'stroke-dasharray="8,5"' : (isSideBranchEdge ? 'stroke-dasharray="9,4"' : '');

                    out.push('  <line class="me-path-line" data-from="' + nA.id + '" data-to="' + nB.id + '" x1="' + nA.x + '" y1="' + nA.y + '" x2="' + nB.x + '" y2="' + nB.y + '" stroke="' + strokeCol + '" stroke-width="' + strokeW + '" stroke-linecap="round" ' + strokeDash + ' pointer-events="none"/>');

                    // Směrová šipka uprostřed hrany (ukazuje směr nA -> nB)
                    var dx = nB.x - nA.x;
                    var dy = nB.y - nA.y;
                    var segLen = Math.sqrt(dx * dx + dy * dy);
                    var midX = (nA.x + nB.x) * 0.5;
                    var midY = (nA.y + nB.y) * 0.5;
                    var angDeg = Math.atan2(dy, dx) * 180 / Math.PI;
                    var arrowFill = isSelectedEdge ? "#facc15" : (isSideBranchEdge ? "#f59e0b" : (isMainBranchEdge ? "#38bdf8" : "#fde68a"));
                    out.push('  <g class="me-path-arrow" data-from="' + nA.id + '" data-to="' + nB.id + '" transform="translate(' + midX.toFixed(1) + ',' + midY.toFixed(1) + ') rotate(' + angDeg.toFixed(1) + ')" pointer-events="none"' + (segLen < 18 ? ' opacity="0.2"' : '') + '>');
                    out.push('    <polygon points="7,0 -5,-5 -2,0 -5,5" fill="' + arrowFill + '" stroke="#0f172a" stroke-width="1"/>');
                    out.push('  </g>');

                    // Štítek priority rozcestí (1-3 modrý hlavní vs 4-6 jantarový boční) ve 34 % délky hrany
                    if (isJunctionNode && (t === 0 || t === 1)) {
                        var bx = nA.x + dx * 0.34;
                        var by = nA.y + dy * 0.34;
                        var bLabel = (t === 0) ? "1–3" : "4–6";
                        var bBg = (t === 0) ? "#0284c7" : "#d97706";
                        out.push('  <g class="me-path-jbadge" data-from="' + nA.id + '" data-to="' + nB.id + '" transform="translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')" pointer-events="none">');
                        out.push('    <rect x="-13" y="-8" width="26" height="16" rx="5" fill="' + bBg + '" stroke="#fef08a" stroke-width="1"/>');
                        out.push('    <text x="0" y="3" text-anchor="middle" fill="#ffffff" font-size="8.5" font-weight="bold" font-family="sans-serif">' + bLabel + '</text>');
                        out.push('  </g>');
                    }

                    // Průhledná klikatelná oblast pro výběr / odebrání / obrácení hrany přímo na plátně
                    out.push('  <line class="me-path-hit" data-from="' + nA.id + '" data-to="' + nB.id + '" x1="' + nA.x + '" y1="' + nA.y + '" x2="' + nB.x + '" y2="' + nB.y + '" stroke="transparent" stroke-width="18" stroke-linecap="round" style="cursor:pointer;" onclick="PRS_MapEditor.onEdgeClick(event, ' + nA.id + ', ' + nB.id + ')"/>');
                }
            }

            // 5. Mosty
            if (board.bridges) {
                for (var b = 0; b < board.bridges.length; b++) {
                    var br = board.bridges[b];
                    out.push('  <g pointer-events="none" transform="translate(' + br.x + ',' + br.y + ') rotate(' + (br.angle || 0) + ')">');
                    out.push('    <rect x="-18" y="-10" width="36" height="20" rx="6" fill="#78716c" stroke="#fbbf24" stroke-width="1.8"/>');
                    out.push('    <rect x="-16" y="-6" width="32" height="12" rx="3" fill="#cdbb98"/>');
                    out.push('  </g>');
                }
            }

            // 6. Královské dominanty a interaktivní Hlavní hrad
            if (board.landmarks) {
                for (var lmIdx = 0; lmIdx < board.landmarks.length; lmIdx++) {
                    var lmk = board.landmarks[lmIdx];
                    if (lmk && !lmk.isRoyalCastle && lmk.id !== "royalCastle" && lmk.id !== "royal_castle" && lmk.x && lmk.y) {
                        out.push('  <g pointer-events="none" opacity="0.35" transform="translate(' + lmk.x + ',' + lmk.y + ')">');
                        out.push('    <circle cx="0" cy="0" r="18" fill="rgba(15,23,42,0.55)" stroke="rgba(212,175,55,0.45)" stroke-width="1"/>');
                        out.push('    <text x="0" y="6" text-anchor="middle" font-size="16">' + this.escapeXml(lmk.icon || "🏛️") + '</text>');
                        out.push('  </g>');
                    }
                }
            }
            var rc = this.getRoyalCastleLandmark();
            if (rc) {
                var rcRawImg = rc.image || rc.img || "assets/castles/castle_royal.webp";
                var rcWasFlip = window.PRS_isFlippedAssetUrl ? window.PRS_isFlippedAssetUrl(rcRawImg) : false;
                var rcImg = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(rcRawImg) : rcRawImg;
                var rcScale = rc.scale || 1;
                var rcFlipAttr = (rc.isFlipped || rcWasFlip) ? ' transform="scale(-1, 1)"' : '';
                var isCastleSelected = (this.inspectorMode === "castle" || this.activeTool === "castle");
                out.push('  <g id="me-royal-castle-g" class="me-royal-castle-hit" transform="translate(' + rc.x + ',' + rc.y + ') scale(' + rcScale + ')" style="cursor:grab;" onpointerdown="PRS_MapEditor.onRoyalCastlePointerDown(event)">');
                out.push('    <circle class="me-royal-castle-aura" cx="0" cy="0" r="44" fill="rgba(212,175,55,0.16)" stroke="' + (isCastleSelected ? '#facc15' : 'rgba(212,175,55,0.65)') + '" stroke-width="' + (isCastleSelected ? '3' : '2') + '"' + (isCastleSelected ? ' stroke-dasharray="6,4"' : '') + '/>');
                out.push('    <image href="' + rcImg + '" x="-42" y="-48" width="84" height="84" preserveAspectRatio="xMidYMid meet" pointer-events="none"' + rcFlipAttr + '/>');
                out.push('    <rect x="-56" y="34" width="112" height="16" rx="5" fill="rgba(10,7,5,0.9)" stroke="' + (isCastleSelected ? '#facc15' : 'rgba(212,175,55,0.6)') + '" stroke-width="1" pointer-events="none"/>');
                out.push('    <text x="0" y="45" text-anchor="middle" fill="#fde68a" font-size="9.5" font-weight="bold" font-family="sans-serif" pointer-events="none">' + this.escapeXml(this.getCastleDisplayName(rc)) + '</text>');
                out.push('    <circle class="me-royal-castle-hit" cx="0" cy="0" r="48" fill="transparent"/>');
                out.push('  </g>');
            }

            // 7. Uzly (Herní políčka s interakcí)
            for (var j = 0; j < nodes.length; j++) {
                var nd = nodes[j];
                var isSelected = (nd.id === this.selectedNodeId);
                var isSwapSource = (nd.id === this.swapSourceNodeId);
                var isLinkSource = (nd.id === this.linkSourceNodeId);

                var visual = this.getNodeVisualConfig(nd);
                var rad = visual.rad;
                var col = visual.color;

                out.push('  <g class="me-node" id="me-node-g-' + nd.id + '" data-node-id="' + nd.id + '" transform="translate(' + nd.x + ',' + nd.y + ')" style="cursor:pointer;" onpointerdown="PRS_MapEditor.onNodePointerDown(' + nd.id + ', event)">');

                // Vnější pulzující zvýraznění pro výběr / zdroj prohození / slepou cestu
                var isDeadEnd = (!nd.next || nd.next.length === 0);
                if (isSelected) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 8) + '" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="4,3"/>');
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 14) + '" fill="none" stroke="#eab308" stroke-width="1.5" opacity="0.7"/>');
                } else if (isSwapSource) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 9) + '" fill="none" stroke="#c084fc" stroke-width="3.5" stroke-dasharray="6,4"/>');
                } else if (isLinkSource) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 8) + '" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="5,3"/>');
                } else if (isDeadEnd) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 7) + '" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-dasharray="3,2"/>');
                }

                // Stín políčka
                out.push('    <circle cx="1.5" cy="2.5" r="' + (rad + 1) + '" fill="rgba(0,0,0,0.65)"/>');

                // Základní kruhový medailonek
                out.push('    <circle cx="0" cy="0" r="' + rad + '" fill="' + col + '" stroke="' + (isSelected ? '#fff' : '#0a0705') + '" stroke-width="' + (isSelected ? 2.5 : 1.8) + '"/>');

                // Ikona uvnitř políčka
                out.push('    <text x="0" y="' + visual.iconY + '" text-anchor="middle" font-size="' + visual.iconSize + '" pointer-events="none">' + visual.icon + '</text>');

                // Číslo uzlu nahoře
                out.push('    <rect x="-11" y="' + (-rad - 9) + '" width="22" height="11" rx="3.5" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.4)" stroke-width="0.7"/>');
                out.push('    <text x="0" y="' + (-rad - 1) + '" text-anchor="middle" fill="#fef3c7" font-size="7.5" font-family="monospace" font-weight="bold" pointer-events="none">' + nd.id + '</text>');

                // Upozornění na slepou cestu bez výstupní hrany
                if (isDeadEnd) {
                    out.push('    <circle cx="' + (rad + 2) + '" cy="' + (-rad - 2) + '" r="7" fill="#991b1b" stroke="#fca5a5" stroke-width="1" pointer-events="none"/>');
                    out.push('    <text x="' + (rad + 2) + '" y="' + (-rad + 1) + '" text-anchor="middle" font-size="8.5" pointer-events="none">⚠️</text>');
                }

                // Stručný štítek názvu pod uzlem (pokud je vybráno nebo je to klíčový bod)
                if (isSelected || nd.type === "castle" || nd.type === "town" || nd.type === "start" || (nd.type === "quest" && nd.subtype === "U3")) {
                    var label = nd.name || visual.title;
                    if (label.length > 20) label = label.substring(0, 18) + "…";
                    out.push('    <rect x="-38" y="' + (rad + 2) + '" width="76" height="13" rx="4" fill="rgba(10,7,5,0.88)" stroke="' + (isSelected ? '#f59e0b' : 'rgba(212,175,55,0.5)') + '" stroke-width="1"/>');
                    out.push('    <text x="0" y="' + (rad + 11.5) + '" text-anchor="middle" fill="' + (isSelected ? '#fef08a' : '#e2e8f0') + '" font-size="8" font-family="sans-serif" font-weight="bold" pointer-events="none">' + this.escapeXml(label) + '</text>');
                }

                out.push('  </g>');
            }

            // 8. Interaktivní Beziérovy body a táhla pro vybranou větev řeky
            if (isRiverEditMode && !this.isDrawingRiver && board.rivers && board.rivers[this.selectedRiverIdx]) {
                var selRiv = board.rivers[this.selectedRiverIdx];
                var pts = this.parseRiverPathPoints(selRiv.path);
                if (pts && pts.length > 0) {
                    for (var pi = 0; pi < pts.length; pi++) {
                        if (pi % 3 === 0) {
                            if (pi - 1 >= 0) {
                                out.push('  <line class="me-river-guide" data-anchor="' + pi + '" data-handle="' + (pi - 1) + '" x1="' + pts[pi].x + '" y1="' + pts[pi].y + '" x2="' + pts[pi - 1].x + '" y2="' + pts[pi - 1].y + '" stroke="rgba(253,224,71,0.75)" stroke-width="1.5" stroke-dasharray="4,3" pointer-events="none"/>');
                            }
                            if (pi + 1 < pts.length) {
                                out.push('  <line class="me-river-guide" data-anchor="' + pi + '" data-handle="' + (pi + 1) + '" x1="' + pts[pi].x + '" y1="' + pts[pi].y + '" x2="' + pts[pi + 1].x + '" y2="' + pts[pi + 1].y + '" stroke="rgba(253,224,71,0.75)" stroke-width="1.5" stroke-dasharray="4,3" pointer-events="none"/>');
                            }
                        }
                    }
                    for (var pj = 0; pj < pts.length; pj++) {
                        var isAnchor = (pj % 3 === 0);
                        var isPtSel = (this.selectedRiverPtIdx === pj);
                        var ptRad = isAnchor ? 8.5 : 6;
                        var ptFill = isAnchor ? "#0ea5e9" : "#facc15";
                        var ptStroke = isPtSel ? "#ffffff" : "#0f172a";
                        out.push('  <circle class="me-river-pt" data-riv-idx="' + this.selectedRiverIdx + '" data-pt-idx="' + pj + '" cx="' + pts[pj].x + '" cy="' + pts[pj].y + '" r="' + ptRad + '" fill="' + ptFill + '" stroke="' + ptStroke + '" stroke-width="' + (isPtSel ? 2.5 : 1.8) + '" style="cursor:grab;" onpointerdown="PRS_MapEditor.onRiverPointPointerDown(event, ' + this.selectedRiverIdx + ', ' + pj + ')"/>');
                    }
                }
            }

            // 9. Živý náhled kreslené řeky
            if (isRiverEditMode && this.isDrawingRiver && Array.isArray(this.drawRiverPoints) && this.drawRiverPoints.length > 0) {
                if (this.drawRiverPoints.length >= 2) {
                    var previewD = this.catmullRomToCubicBezierPath(this.drawRiverPoints);
                    out.push('  <path d="' + previewD + '" fill="none" stroke="rgba(56,189,248,0.85)" stroke-width="22" stroke-linecap="round" stroke-dasharray="10,6" pointer-events="none"/>');
                    out.push('  <path d="' + previewD + '" fill="none" stroke="#fef08a" stroke-width="2.5" stroke-dasharray="6,4" pointer-events="none"/>');
                }
                for (var dp = 0; dp < this.drawRiverPoints.length; dp++) {
                    var dpt = this.drawRiverPoints[dp];
                    out.push('  <circle cx="' + Math.round(dpt.x) + '" cy="' + Math.round(dpt.y) + '" r="8" fill="#0ea5e9" stroke="#fef08a" stroke-width="2" pointer-events="none"/>');
                    out.push('  <text x="' + Math.round(dpt.x) + '" y="' + (Math.round(dpt.y) + 3) + '" text-anchor="middle" fill="#ffffff" font-size="8.5" font-weight="bold" pointer-events="none">' + (dp + 1) + '</text>');
                }
            }

            // 10. Kruhový kurzor štětce biomů
            if (isBiomeEditMode) {
                var curStroke = (this.activeBiomeBrush === "erase") ? "#f87171" : ((biomePalette[this.activeBiomeBrush] && biomePalette[this.activeBiomeBrush].stroke) || "#fde047");
                out.push('  <circle id="me-biome-cursor-ring" cx="-9999" cy="-9999" r="' + Math.round(this.biomeBrushRadius || 110) + '" fill="none" stroke="' + curStroke + '" stroke-width="2.2" stroke-dasharray="7,4" pointer-events="none"/>');
            }

            out.push('</svg>');

            container.innerHTML = out.join("\n");

            // Registrace událostí na SVG pro posun plátna, náhled štětce a zoom
            var svgEl = document.getElementById("me-svg-canvas");
            if (svgEl) {
                var self = this;
                svgEl.onpointerdown = function (e) { self.onSvgPointerDown(e); };
                svgEl.onpointermove = function (e) {
                    if (self.activeTool === "biome") {
                        var ring = document.getElementById("me-biome-cursor-ring");
                        if (ring) {
                            var cur = self.getSvgCoordinates(e, svgEl);
                            ring.setAttribute("cx", Math.round(cur.x));
                            ring.setAttribute("cy", Math.round(cur.y));
                        }
                    }
                };
                svgEl.onpointerleave = function () {
                    var ring = document.getElementById("me-biome-cursor-ring");
                    if (ring) { ring.setAttribute("cx", "-9999"); ring.setAttribute("cy", "-9999"); }
                };
                svgEl.oncontextmenu = function (e) { e.preventDefault(); };
                svgEl.onwheel = function (e) {
                    e.preventDefault();
                    var factor = (e.deltaY < 0) ? 1.15 : 0.87;
                    self.zoomAtPoint(e.clientX, e.clientY, factor);
                };
            }
        },

        // Vizuální konfigurace pro různé typy polí
        getNodeVisualConfig: function (nd) {
            var type = (nd.type || "").toLowerCase();
            var sub = (nd.subtype || "").toUpperCase();
            var code = (nd.code || "").toUpperCase();
            var name = (nd.name || "").toLowerCase();

            if (type === "start" || code === "START") return { color: "#ef4444", rad: 16, icon: "🚩", iconSize: 15, iconY: 5.5, title: "Start" };
            if (type === "castle" || (code.indexOf("H") === 0 && !isNaN(parseInt(code.slice(1))))) return { color: "#a855f7", rad: 14, icon: "🏰", iconSize: 15, iconY: 5.5, title: "Hrad" };
            if (type === "town" || (code.indexOf("M") === 0 && !isNaN(parseInt(code.slice(1))))) return { color: "#3b82f6", rad: 13, icon: "🏙️", iconSize: 13, iconY: 5, title: "Město" };
            if (type === "village" || (code.indexOf("V") === 0 && !isNaN(parseInt(code.slice(1))))) return { color: "#22c55e", rad: 11, icon: "🏘️", iconSize: 12, iconY: 4.5, title: "Vesnice" };
            if (type === "festival" || code.indexOf("SLAV") !== -1) return { color: "#ec4899", rad: 12, icon: "🎪", iconSize: 12, iconY: 4.5, title: "Slavnost" };
            if (type === "quest" || code.indexOf("U") === 0) {
                if (sub === "U3" || code.indexOf("U3") !== -1) return { color: "#dc2626", rad: 15, icon: "🐲", iconSize: 16, iconY: 5.5, title: "Drak (U3)" };
                if (sub === "U2" || code.indexOf("U2") !== -1) return { color: "#ea580c", rad: 12, icon: "🐺", iconSize: 13, iconY: 4.5, title: "Bestie (U2)" };
                return { color: "#84cc16", rad: 11, icon: "🐗", iconSize: 12, iconY: 4, title: "Zvěř (U1)" };
            }
            if (type === "master" || code.indexOf("MB") === 0 || code.indexOf("MJ") === 0 || code.indexOf("MT") === 0 || code.indexOf("MCH") === 0 || code.indexOf("VM") === 0) {
                if (sub === "MB" || code.indexOf("MB") === 0) return { color: "#ef4444", rad: 12, icon: "⚔️", iconSize: 12, iconY: 4, title: "Mistr Boje" };
                if (sub === "MJ" || code.indexOf("MJ") === 0) return { color: "#eab308", rad: 12, icon: "🏇", iconSize: 12, iconY: 4.5, title: "Mistr Jízdy" };
                if (sub === "MT" || code.indexOf("MT") === 0) return { color: "#ec4899", rad: 12, icon: "💃", iconSize: 12, iconY: 4.5, title: "Mistr Tance" };
                if (sub === "MCH" || code.indexOf("MCH") === 0) return { color: "#8b5cf6", rad: 12, icon: "👑", iconSize: 12, iconY: 4, title: "Mistr Charismatu" };
                return { color: "#a855f7", rad: 13, icon: "🧙‍♂️", iconSize: 13, iconY: 4.5, title: "Velmistr" };
            }
            // Zvířata: Kůň, Sokol, Pes
            var isAnimal = (type === "animal" || type === "horse" || type === "dog" || type === "falcon" || sub === "KUN" || sub === "PES" || sub === "SOKOL" || sub === "HORSE" || sub === "DOG" || sub === "FALCON" || (code.indexOf("K") === 0 && !isNaN(parseInt(code.slice(1)))) || (code.indexOf("S") === 0 && !isNaN(parseInt(code.slice(1)))) || (code.indexOf("P") === 0 && !isNaN(parseInt(code.slice(1)))));
            if (isAnimal) {
                var aIcon = "🐎";
                var aKind = "Kůň";
                if (type === "falcon" || sub === "FALCON" || sub === "SOKOL" || sub === "SOK" || (code.indexOf("S") === 0 && !isNaN(parseInt(code.slice(1)))) || name.indexOf("sokol") !== -1 || name.indexOf("pták") !== -1 || name.indexOf("poštolka") !== -1) {
                    aIcon = "🦅";
                    aKind = "Sokol";
                } else if (type === "dog" || sub === "DOG" || sub === "PES" || sub === "PSOV" || (code.indexOf("P") === 0 && !isNaN(parseInt(code.slice(1)))) || name.indexOf("pes") !== -1 || name.indexOf("ohař") !== -1 || name.indexOf("bígl") !== -1 || name.indexOf("chrt") !== -1) {
                    aIcon = "🐕";
                    aKind = "Pes";
                }
                var lvl = nd.animalLevel || nd.setId || (code && code.match(/\d+/) ? parseInt(code.match(/\d+/)[0]) : 1);
                return { color: "#10b981", rad: 10, icon: aIcon, iconSize: 11, iconY: 4, title: aKind + " L" + lvl };
            }
            if (type === "jester" || code.indexOf("KE") === 0) return { color: "#f59e0b", rad: 11, icon: "🃏", iconSize: 12, iconY: 4.5, title: "Šašek" };
            if (type === "tax" || code.indexOf("VD") === 0) return { color: "#64748b", rad: 11, icon: "💰", iconSize: 11, iconY: 4, title: "Výběrčí daní" };
            if (type === "prison" || code.indexOf("SATL") === 0) return { color: "#475569", rad: 11, icon: "⛓️", iconSize: 11, iconY: 4, title: "Šatlava" };
            if (type === "hospital" || code.indexOf("HOSP") === 0) return { color: "#ef4444", rad: 11, icon: "🏥", iconSize: 11, iconY: 4, title: "Lazaret" };
            if (type === "tavern" || code.indexOf("KRCMA") === 0) return { color: "#b45309", rad: 11, icon: "🍺", iconSize: 11, iconY: 4, title: "Krčma" };
            if (type === "merchant" || type === "trade" || code.indexOf("OBCHOD") === 0) return { color: "#0284c7", rad: 11, icon: "⚖️", iconSize: 11, iconY: 4, title: "Obchodník" };
            if (type === "building" || type === "craft" || code.indexOf("KOV") === 0) return { color: "#78716c", rad: 11, icon: "⚒️", iconSize: 11, iconY: 4, title: "Kovárna" };
            if (type === "chance" || code.indexOf("N") === 0) return { color: "#d97706", rad: 10.5, icon: "📜", iconSize: 11, iconY: 4, title: "Náhoda" };
            if (type === "bonus" || code.indexOf("B") === 0) return { color: "#059669", rad: 10.5, icon: "💎", iconSize: 11, iconY: 4, title: "Poklad" };

            return { color: "#d4af37", rad: 10, icon: (nd.icon || "⚪"), iconSize: 9, iconY: 3.5, title: (nd.name || ("Pole #" + nd.id)) };
        },

        // ====================================================================
        // INTERAKTIVNÍ OVLÁDÁNÍ: KLIK A TAHÁNÍ UZLŮ (DRAG & DROP)
        // ====================================================================
        onNodePointerDown: function (nodeId, evt) {
            // Speciální nástroje mají přednost (swap, link, add)
            if (this.activeTool === "swap" || this.activeTool === "link") {
                this.onNodeClick(nodeId, evt);
                return;
            }
            if (this.activeTool === "add") {
                // Přidání pole řeší klik do plátna
                return;
            }

            if (evt.button !== 0) return; // Pouze levé tlačítko / primární dotyk
            evt.preventDefault();
            evt.stopPropagation();

            var node = this.getNodeById(nodeId);
            if (!node) return;

            var self = this;
            this.pendingDrag = {
                nodeId: nodeId,
                startX: evt.clientX,
                startY: evt.clientY,
                origX: node.x,
                origY: node.y,
                started: false
            };

            function onWinPointerMove(e) {
                if (!self.pendingDrag) return;
                var dx = e.clientX - self.pendingDrag.startX;
                var dy = e.clientY - self.pendingDrag.startY;

                if (!self.pendingDrag.started) {
                    if (Math.hypot(dx, dy) >= 4) {
                        self.pendingDrag.started = true;
                        self.pushUndo();
                        self.isDragging = true;
                        self.dragNodeId = self.pendingDrag.nodeId;
                        self.selectedNodeId = self.pendingDrag.nodeId;
                        self.selectedEdge = null;
                        self.inspectorMode = "node";
                        self.updateInspectorUI();
                    }
                }

                if (self.pendingDrag.started) {
                    e.preventDefault();
                    var svg = document.getElementById("me-svg-canvas");
                    if (!svg) return;
                    var pt = self.getSvgCoordinates(e, svg);
                    var clampedX = Math.max(35, Math.min(1365, Math.round(pt.x)));
                    var clampedY = Math.max(35, Math.min(825, Math.round(pt.y)));

                    var targetNode = self.getNodeById(self.pendingDrag.nodeId);
                    if (targetNode) {
                        targetNode.x = clampedX;
                        targetNode.y = clampedY;

                        // Rychlá aktualizace transformu uzlu bez innerHTML přepisování
                        var nodeG = document.getElementById("me-node-g-" + targetNode.id);
                        if (nodeG) {
                            nodeG.setAttribute("transform", "translate(" + clampedX + "," + clampedY + ")");
                        }

                        // Rychlá aktualizace napojených čar, hit-zón, šipek a štítků rozcestí
                        var fromLines = svg.querySelectorAll('.me-path-line[data-from="' + targetNode.id + '"], .me-path-hit[data-from="' + targetNode.id + '"]');
                        for (var fl = 0; fl < fromLines.length; fl++) {
                            fromLines[fl].setAttribute("x1", clampedX);
                            fromLines[fl].setAttribute("y1", clampedY);
                        }
                        var toLines = svg.querySelectorAll('.me-path-line[data-to="' + targetNode.id + '"], .me-path-hit[data-to="' + targetNode.id + '"]');
                        for (var tl = 0; tl < toLines.length; tl++) {
                            toLines[tl].setAttribute("x2", clampedX);
                            toLines[tl].setAttribute("y2", clampedY);
                        }
                        if (typeof self.refreshConnectedEdgeMarkers === "function") {
                            self.refreshConnectedEdgeMarkers(svg, targetNode.id);
                        }

                        self.updateInspectorCoordinates(clampedX, clampedY);
                    }
                }
            }

            function onWinPointerUp(e) {
                window.removeEventListener("pointermove", onWinPointerMove);
                window.removeEventListener("pointerup", onWinPointerUp);
                window.removeEventListener("pointercancel", onWinPointerUp);

                if (!self.pendingDrag) return;
                var hadStarted = self.pendingDrag.started;
                var draggedId = self.pendingDrag.nodeId;
                self.pendingDrag = null;

                if (hadStarted) {
                    self.isDragging = false;
                    self.dragNodeId = null;
                    if (self.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                        window.PRS_BoardBuilder.computeRiverBridges(self.board);
                    }
                    self.renderCanvas();
                    if (window.PRS_Audio) window.PRS_Audio.playStep();
                } else {
                    // Čisté kliknutí na uzel bez posunu
                    self.onNodeClick(draggedId, e);
                }
            }

            window.addEventListener("pointermove", onWinPointerMove);
            window.addEventListener("pointerup", onWinPointerUp);
            window.addEventListener("pointercancel", onWinPointerUp);
        },

        // Kliknutí na uzel (výběr / prohození / link)
        onNodeClick: function (nodeId, evt) {
            if (evt) evt.stopPropagation();
            var node = this.getNodeById(nodeId);
            if (!node) return;

            if (this.activeTool === "swap") {
                if (this.swapSourceNodeId === null) {
                    this.swapSourceNodeId = nodeId;
                    this.updateStatusHelp();
                    this.renderCanvas();
                    if (window.PRS_Audio) window.PRS_Audio.playStep();
                } else if (this.swapSourceNodeId === nodeId) {
                    this.swapSourceNodeId = null;
                    this.updateStatusHelp();
                    this.renderCanvas();
                } else {
                    this.executeSwap(this.swapSourceNodeId, nodeId);
                    this.swapSourceNodeId = null;
                    this.updateStatusHelp();
                    this.renderCanvas();
                }
            } else if (this.activeTool === "link") {
                if (this.linkSourceNodeId === null) {
                    this.linkSourceNodeId = nodeId;
                    this.updateStatusHelp();
                    this.renderCanvas();
                    if (window.PRS_Audio) window.PRS_Audio.playStep();
                } else if (this.linkSourceNodeId === nodeId) {
                    this.linkSourceNodeId = null;
                    this.updateStatusHelp();
                    this.renderCanvas();
                } else {
                    this.executeToggleLink(this.linkSourceNodeId, nodeId);
                    this.linkSourceNodeId = null;
                    this.updateStatusHelp();
                    this.renderCanvas();
                }
            } else {
                // Select i Move nástroj vyberou uzel a otevřou inspektor
                this.selectedNodeId = nodeId;
                this.selectedEdge = null;
                this.inspectorMode = "node";
                this.renderCanvas();
                this.updateInspectorUI();
                if (window.PRS_Audio) window.PRS_Audio.playStep();
            }
        },

        // Stisk ukazatele na pozadí plátna (posun celé mapy nebo přidání uzlu)
        onSvgPointerDown: function (evt) {
            if (evt.button === 2) {
                evt.preventDefault();
            }

            var target = evt.target;
            // 0A. Režim kreslení nové řeky klikáním bodů trasy
            if (this.activeTool === "river" && this.isDrawingRiver && evt.button === 0 && !evt.altKey && !evt.spaceKey) {
                evt.preventDefault();
                var svgRiv = document.getElementById("me-svg-canvas");
                if (svgRiv) {
                    var ptRiv = this.getSvgCoordinates(evt, svgRiv);
                    var lastDrawPt = (this.drawRiverPoints && this.drawRiverPoints.length > 0) ? this.drawRiverPoints[this.drawRiverPoints.length - 1] : null;
                    if (this.drawRiverPoints && this.drawRiverPoints.length >= 2 && (evt.detail >= 2 || (lastDrawPt && Math.hypot(ptRiv.x - lastDrawPt.x, ptRiv.y - lastDrawPt.y) < 14))) {
                        this.finishDrawRiver();
                    } else {
                        this.addDrawRiverPoint(ptRiv.x, ptRiv.y);
                    }
                    return;
                }
            }

            // 0B. Režim štětce biomů (malování / guma po mapě klikem i tažením)
            if (this.activeTool === "biome" && evt.button === 0 && !evt.altKey && !evt.spaceKey) {
                evt.preventDefault();
                var svgBio = document.getElementById("me-svg-canvas");
                if (svgBio) {
                    var selfB = this;
                    var ptBio = this.getSvgCoordinates(evt, svgBio);
                    this.pushUndo();
                    this._isPaintingBiome = true;
                    var lastStamp = { x: ptBio.x, y: ptBio.y };
                    this.applyBiomeBrushAt(ptBio.x, ptBio.y);
                    var minStep = Math.max(18, Math.round((this.biomeBrushRadius || 110) * 0.42));

                    function onBiomeMove(ev) {
                        if (!selfB._isPaintingBiome) return;
                        ev.preventDefault();
                        var sEl = document.getElementById("me-svg-canvas");
                        if (!sEl) return;
                        var cPt = selfB.getSvgCoordinates(ev, sEl);
                        var ring = document.getElementById("me-biome-cursor-ring");
                        if (ring) {
                            ring.setAttribute("cx", Math.round(cPt.x));
                            ring.setAttribute("cy", Math.round(cPt.y));
                        }
                        if (Math.hypot(cPt.x - lastStamp.x, cPt.y - lastStamp.y) >= minStep) {
                            lastStamp = { x: cPt.x, y: cPt.y };
                            selfB.applyBiomeBrushAt(cPt.x, cPt.y);
                        }
                    }
                    function onBiomeUp() {
                        window.removeEventListener("pointermove", onBiomeMove);
                        window.removeEventListener("pointerup", onBiomeUp);
                        window.removeEventListener("pointercancel", onBiomeUp);
                        selfB._isPaintingBiome = false;
                        selfB.renderCanvas();
                        selfB.updateInspectorUI();
                    }
                    window.addEventListener("pointermove", onBiomeMove);
                    window.addEventListener("pointerup", onBiomeUp);
                    window.addEventListener("pointercancel", onBiomeUp);
                    return;
                }
            }

            var nodeEl = target && target.closest ? (target.closest(".me-node") || target.closest(".me-node-group") || target.closest(".me-river-pt") || target.closest(".me-royal-castle-hit")) : null;

            // 1. Režim přidání pole: kliknutím na prázdné místo plátna vytvoříme nový uzel
            if (this.activeTool === "add" && !nodeEl) {
                var svgAdd = document.getElementById("me-svg-canvas");
                if (svgAdd) {
                    var ptAdd = this.getSvgCoordinates(evt, svgAdd);
                    this.addNodeAtPosition(ptAdd.x, ptAdd.y);
                    return;
                }
            }

            // Pokud jsme klikli na políčko, bod řeky nebo hrad, obsluhuje je příslušný handler
            if (nodeEl) return;

            var isPanTool = (this.activeTool === "pan");
            var isMiddleOrRight = (evt.button === 1 || evt.button === 2);
            var isSpace = (evt.spaceKey || evt.altKey);

            // Posun mapy (pan)
            if (isPanTool || isMiddleOrRight || isSpace || !nodeEl) {
                evt.preventDefault();
                var svg = document.getElementById("me-svg-canvas");
                this.viewport.isPanning = true;
                this.viewport.hasPanned = false;
                this.viewport.startMouseX = evt.clientX;
                this.viewport.startMouseY = evt.clientY;
                this.viewport.startViewX = this.viewport.x || 0;
                this.viewport.startViewY = this.viewport.y || 0;

                if (svg) {
                    svg.style.cursor = "grabbing";
                }

                var self = this;
                function onPanMove(e) {
                    if (!self.viewport || !self.viewport.isPanning) return;
                    e.preventDefault();
                    var svgEl = document.getElementById("me-svg-canvas");
                    if (!svgEl) return;
                    var rect = svgEl.getBoundingClientRect();
                    var vb = self.getCurrentViewBox();
                    var scaleX = vb.w / (rect.width || 1400);
                    var scaleY = vb.h / (rect.height || 860);

                    var dx = (e.clientX - self.viewport.startMouseX) * scaleX;
                    var dy = (e.clientY - self.viewport.startMouseY) * scaleY;

                    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                        self.viewport.hasPanned = true;
                    }

                    self.viewport.x = self.viewport.startViewX - dx;
                    self.viewport.y = self.viewport.startViewY - dy;
                    self.applyViewport();
                }

                function onPanUp() {
                    window.removeEventListener("pointermove", onPanMove);
                    window.removeEventListener("pointerup", onPanUp);
                    window.removeEventListener("pointercancel", onPanUp);

                    if (self.viewport) {
                        self.viewport.isPanning = false;
                        setTimeout(function () {
                            if (self.viewport) self.viewport.hasPanned = false;
                        }, 60);
                    }
                    self.updateCursor();
                }

                window.addEventListener("pointermove", onPanMove);
                window.addEventListener("pointerup", onPanUp);
                window.addEventListener("pointercancel", onPanUp);
            }
        },

        getSvgCoordinates: function (evt, svg) {
            if (!svg) svg = document.getElementById("me-svg-canvas");
            if (!svg) return { x: 0, y: 0 };
            var rect = svg.getBoundingClientRect();
            var vb = this.getCurrentViewBox();
            var relX = (evt.clientX - rect.left) / (rect.width || 1);
            var relY = (evt.clientY - rect.top) / (rect.height || 1);
            return {
                x: vb.x + relX * vb.w,
                y: vb.y + relY * vb.h
            };
        },

        // ====================================================================
        // OPERACE: PŘIDÁNÍ NOVÉHO UZLU
        // ====================================================================
        addNodeAtPosition: function (x, y) {
            if (!this.board || !this.board.nodes) return;
            this.pushUndo();

            var clampedX = Math.max(35, Math.min(1365, Math.round(x)));
            var clampedY = Math.max(35, Math.min(825, Math.round(y)));

            // Zjistíme nejvyšší ID
            var maxId = 0;
            for (var i = 0; i < this.board.nodes.length; i++) {
                if (this.board.nodes[i].id > maxId) maxId = this.board.nodes[i].id;
            }
            var newId = maxId + 1;

            var newNode = {
                id: newId,
                code: "V" + newId,
                x: clampedX,
                y: clampedY,
                type: "VILLAGE",
                subtype: null,
                icon: "🏘️",
                estateId: "V" + newId,
                name: "Vesnice #" + newId,
                price: 1400,
                rent: 350,
                villageLevel: 1,
                next: []
            };

            // Pokud bylo předtím vybráno políčko, automaticky novou trasu napojíme
            if (this.selectedNodeId !== null) {
                var prevNode = this.getNodeById(this.selectedNodeId);
                if (prevNode) {
                    if (!Array.isArray(prevNode.next)) prevNode.next = [];
                    if (prevNode.next.indexOf(newId) === -1) {
                        prevNode.next.push(newId);
                    }
                    this.recomputeNodeJunctionState(prevNode);
                }
            }

            this.board.nodes.push(newNode);
            this.selectedNodeId = newId;
            this.selectedEdge = null;
            this.inspectorMode = "node";

            if (this.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                window.PRS_BoardBuilder.computeRiverBridges(this.board);
            }

            this.setTool("select"); // po přidání přepneme zpět na inspektor pro úpravu detailu
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) window.KiDeskyToast.show("➕ Vytvořeno nové pole #" + newId + " (" + newNode.name + ")", "good");
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
        },

        // ====================================================================
        // OPERACE: SMAZÁNÍ UZLU
        // ====================================================================
        deleteSelectedNode: function () {
            if (this.selectedNodeId === null) return;
            var idToDelete = this.selectedNodeId;
            var nodeToDelete = this.getNodeById(idToDelete);
            if (!nodeToDelete) return;

            if (idToDelete === 0 || (nodeToDelete.type || "").toLowerCase() === "start") {
                if (window.KiDeskyToast) window.KiDeskyToast.show("⚠️ Startovní pole #0 je klíčové pro chod hry a nelze ho smazat!", "warning");
                return;
            }

            this.pushUndo();

            var targetNext = nodeToDelete.next || [];

            // Převedení příchozích cest tak, aby překlenuly smazané pole (reconnect)
            for (var i = 0; i < this.board.nodes.length; i++) {
                var n = this.board.nodes[i];
                if (n.id === idToDelete) continue;

                var touched = false;
                if (Array.isArray(n.next)) {
                    var idx = n.next.indexOf(idToDelete);
                    if (idx !== -1) {
                        n.next.splice(idx, 1);
                        for (var tn = 0; tn < targetNext.length; tn++) {
                            if (targetNext[tn] !== n.id && n.next.indexOf(targetNext[tn]) === -1) {
                                n.next.push(targetNext[tn]);
                            }
                        }
                        touched = true;
                    }
                }
                if (n.branchHigh === idToDelete) {
                    n.branchHigh = targetNext.length > 0 ? targetNext[0] : null;
                    touched = true;
                }
                if (n.branchLow === idToDelete) {
                    n.branchLow = targetNext.length > 0 ? targetNext[0] : null;
                    touched = true;
                }
                if (touched) {
                    this.recomputeNodeJunctionState(n);
                }
            }

            // Odstranění uzlu ze seznamu
            this.board.nodes = this.board.nodes.filter(function (n) { return n.id !== idToDelete; });

            if (this.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                window.PRS_BoardBuilder.computeRiverBridges(this.board);
            }

            this.selectedNodeId = null;
            this.selectedEdge = null;
            if (this.inspectorMode === "node") this.inspectorMode = null;
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) window.KiDeskyToast.show("🗑️ Pole #" + idToDelete + " bylo smazáno a trasa byla přepojena.", "turn");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        // ====================================================================
        // OPERACE: KROKOVÁNÍ MEZI POLÍČKY (PŘEDCHOZÍ / DALŠÍ)
        // ====================================================================
        selectNextNode: function (step) {
            if (!this.board || !this.board.nodes || this.board.nodes.length === 0) return;
            if (this.selectedNodeId === null) {
                this.selectedNodeId = this.board.nodes[0].id;
            } else {
                var curIdx = -1;
                for (var i = 0; i < this.board.nodes.length; i++) {
                    if (this.board.nodes[i].id === this.selectedNodeId) {
                        curIdx = i;
                        break;
                    }
                }
                if (curIdx === -1) curIdx = 0;
                var nextIdx = (curIdx + step + this.board.nodes.length) % this.board.nodes.length;
                this.selectedNodeId = this.board.nodes[nextIdx].id;
            }
            this.selectedEdge = null;
            this.inspectorMode = "node";
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        // ====================================================================
        // OPERACE: PROHOZENÍ DVOU POLÍ (SWAP)
        // ====================================================================
        executeSwap: function (idA, idB) {
            var nA = this.getNodeById(idA);
            var nB = this.getNodeById(idB);
            if (!nA || !nB) return;

            this.pushUndo();

            // Vyměníme herní obsah uzlů, ale ponecháme jejich souřadnice a cesty
            var props = ["type", "subtype", "name", "price", "rent", "animalLevel", "villageLevel", "masterTier", "masterType", "badge", "icon", "themeBadge", "tag"];
            for (var p = 0; p < props.length; p++) {
                var k = props[p];
                var tmp = nA[k];
                nA[k] = nB[k];
                nB[k] = tmp;
            }

            this.selectedNodeId = idB;
            this.updateInspectorUI();

            if (window.KiDeskyToast) {
                window.KiDeskyToast.show("🔄 Pole #" + idA + " a #" + idB + " byla úspěšně prohozena!", "good");
            }
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
        },

        recomputeBridgesSafe: function () {
            if (this.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                window.PRS_BoardBuilder.computeRiverBridges(this.board);
            }
        },

        // ====================================================================
        // SYNCHRONIZACE VĚTVÍ ROZCESTÍ (next[] <-> branchLow / branchHigh / isJunction)
        // ====================================================================
        recomputeNodeJunctionState: function (nd) {
            if (!nd) return;
            if (!Array.isArray(nd.next)) nd.next = [];

            // Odstranit duplicity a neplatné hodnoty, zachovat pořadí [1-3, 4-6, ...]
            var cleaned = [];
            for (var i = 0; i < nd.next.length; i++) {
                var tid = nd.next[i];
                if (tid === null || tid === undefined || tid === nd.id) continue;
                if (cleaned.indexOf(tid) === -1) cleaned.push(tid);
            }
            nd.next = cleaned;

            if (nd.next.length >= 2) {
                nd.branchLow = nd.next[0];
                nd.branchHigh = nd.next[1];
                nd.isJunction = true;
            } else {
                nd.branchLow = null;
                nd.branchHigh = null;
                nd.isJunction = false;
            }
        },

        syncNodeBranches: function (board, includeLegacyBranchFields) {
            if (!board || !Array.isArray(board.nodes)) return;
            var idMap = {};
            for (var k = 0; k < board.nodes.length; k++) {
                idMap[board.nodes[k].id] = true;
            }
            for (var i = 0; i < board.nodes.length; i++) {
                var nd = board.nodes[i];
                if (!Array.isArray(nd.next)) nd.next = [];

                if (includeLegacyBranchFields) {
                    if (nd.branchLow !== null && nd.branchLow !== undefined && idMap[nd.branchLow]) {
                        if (nd.next.indexOf(nd.branchLow) === -1) {
                            nd.next.unshift(nd.branchLow);
                        }
                    }
                    if (nd.branchHigh !== null && nd.branchHigh !== undefined && idMap[nd.branchHigh]) {
                        if (nd.next.indexOf(nd.branchHigh) === -1) {
                            nd.next.push(nd.branchHigh);
                        }
                    }
                }

                // Ponechat jen existující cílové uzly
                var validNext = [];
                for (var n = 0; n < nd.next.length; n++) {
                    var tid = nd.next[n];
                    if (idMap[tid] && tid !== nd.id && validNext.indexOf(tid) === -1) {
                        validNext.push(tid);
                    }
                }
                nd.next = validNext;
                this.recomputeNodeJunctionState(nd);
            }
            board._branchesSynced = true;
        },

        refreshConnectedEdgeMarkers: function (svg, nodeId) {
            if (!svg) return;
            var idStr = String(nodeId);
            var markers = svg.querySelectorAll('.me-path-arrow[data-from="' + idStr + '"], .me-path-arrow[data-to="' + idStr + '"], .me-path-jbadge[data-from="' + idStr + '"], .me-path-jbadge[data-to="' + idStr + '"]');
            for (var m = 0; m < markers.length; m++) {
                var el = markers[m];
                var fromId = parseInt(el.getAttribute("data-from"), 10);
                var toId = parseInt(el.getAttribute("data-to"), 10);
                var nA = this.getNodeById(fromId);
                var nB = this.getNodeById(toId);
                if (!nA || !nB) continue;
                var dx = nB.x - nA.x;
                var dy = nB.y - nA.y;
                if (el.classList.contains("me-path-arrow")) {
                    var midX = (nA.x + nB.x) * 0.5;
                    var midY = (nA.y + nB.y) * 0.5;
                    var angDeg = Math.atan2(dy, dx) * 180 / Math.PI;
                    el.setAttribute("transform", "translate(" + midX.toFixed(1) + "," + midY.toFixed(1) + ") rotate(" + angDeg.toFixed(1) + ")");
                } else {
                    var bx = nA.x + dx * 0.34;
                    var by = nA.y + dy * 0.34;
                    el.setAttribute("transform", "translate(" + bx.toFixed(1) + "," + by.toFixed(1) + ")");
                }
            }
        },

        // ====================================================================
        // OPERACE: SPOJENÍ / ODPOJENÍ CESTY, SMĚRY A ROZCESTÍ
        // ====================================================================
        executeToggleLink: function (idA, idB) {
            if (idA === idB) return;
            var nA = this.getNodeById(idA);
            var nB = this.getNodeById(idB);
            if (!nA || !nB) return;

            if (!Array.isArray(nA.next)) nA.next = [];
            if (!Array.isArray(nB.next)) nB.next = [];

            // Odebrat hranu bez ohledu na pořadí kliknutí (A->B nebo B->A)
            if (nA.next.indexOf(idB) !== -1) {
                this.removeEdge(idA, idB);
                return;
            }
            if (nB.next.indexOf(idA) !== -1) {
                this.removeEdge(idB, idA);
                return;
            }

            this.pushUndo();
            nA.next.push(idB);
            this.recomputeNodeJunctionState(nA);
            this.selectedEdge = { from: idA, to: idB };
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) window.KiDeskyToast.show("🔗 Vytvořena nová cesta z #" + idA + " do #" + idB + "!", "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        onEdgeClick: function (evt, fromId, toId) {
            if (evt) evt.stopPropagation();
            this.selectedEdge = { from: fromId, to: toId };
            this.selectedNodeId = null;
            this.inspectorMode = "edge";
            this.updateStatusHelp();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        removeEdge: function (fromId, toId, skipUndo) {
            var nA = this.getNodeById(fromId);
            if (!nA) return false;
            if (!Array.isArray(nA.next)) nA.next = [];

            var idx = nA.next.indexOf(toId);
            var hadLegacy = (nA.branchHigh === toId || nA.branchLow === toId);
            if (idx === -1 && !hadLegacy) return false;

            if (!skipUndo) this.pushUndo();
            if (idx !== -1) nA.next.splice(idx, 1);
            if (nA.branchHigh === toId) nA.branchHigh = null;
            if (nA.branchLow === toId) nA.branchLow = null;
            this.recomputeNodeJunctionState(nA);

            if (this.selectedEdge && this.selectedEdge.from === fromId && this.selectedEdge.to === toId) {
                this.selectedEdge = null;
                if (this.inspectorMode === "edge") this.inspectorMode = null;
            }

            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();

            if (!skipUndo && window.KiDeskyToast) {
                window.KiDeskyToast.show("✂️ Cesta #" + fromId + " ➔ #" + toId + " byla odstraněna.", "turn");
            }
            if (!skipUndo && window.PRS_Audio) window.PRS_Audio.playStep();
            return true;
        },

        reverseEdgeDirection: function (fromId, toId) {
            var nA = this.getNodeById(fromId);
            var nB = this.getNodeById(toId);
            if (!nA || !nB || !Array.isArray(nA.next)) return false;

            var idx = nA.next.indexOf(toId);
            if (idx === -1) return false;

            this.pushUndo();
            nA.next.splice(idx, 1);
            if (nA.branchHigh === toId) nA.branchHigh = null;
            if (nA.branchLow === toId) nA.branchLow = null;
            this.recomputeNodeJunctionState(nA);

            if (!Array.isArray(nB.next)) nB.next = [];
            if (nB.next.indexOf(fromId) === -1) {
                nB.next.push(fromId);
            }
            this.recomputeNodeJunctionState(nB);

            if (this.inspectorMode === "edge" || (this.selectedEdge && this.selectedEdge.from === fromId && this.selectedEdge.to === toId)) {
                this.selectedEdge = { from: toId, to: fromId };
            }

            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) window.KiDeskyToast.show("🔄 Směr cesty obrácen: #" + toId + " ➔ #" + fromId, "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
            return true;
        },

        swapJunctionBranchPriority: function (nodeId) {
            var nd = this.getNodeById(nodeId);
            if (!nd || !Array.isArray(nd.next) || nd.next.length < 2) return false;

            this.pushUndo();
            var tmp = nd.next[0];
            nd.next[0] = nd.next[1];
            nd.next[1] = tmp;
            this.recomputeNodeJunctionState(nd);

            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) {
                window.KiDeskyToast.show("🔀 Rozcestí #" + nodeId + ": prohozeno 1–3 (#" + nd.next[0] + ") ⇄ 4–6 (#" + nd.next[1] + ").", "good");
            }
            if (window.PRS_Audio) window.PRS_Audio.playStep();
            return true;
        },

        autoOrientSideBranches: function () {
            if (!this.board || !Array.isArray(this.board.nodes) || this.board.nodes.length === 0) return { fixedEdges: 0, fixedJunctions: 0 };
            this.pushUndo();

            var nodes = this.board.nodes;
            this.syncNodeBranches(this.board, !this.board._branchesSynced);

            var idMap = {};
            var undir = {};
            var cx = 0;
            var cy = 0;
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                idMap[n.id] = n;
                undir[n.id] = [];
                cx += n.x;
                cy += n.y;
            }
            var centroid = { x: cx / nodes.length, y: cy / nodes.length };

            var startNode = idMap[0] || nodes.find(function (nd) { return (nd.type || "").toLowerCase() === "start"; }) || nodes[0];
            var startId = startNode.id;

            // Neorientovaná mapa sousedů + vzdálenost od Startu v neorientovaném grafu
            for (var i2 = 0; i2 < nodes.length; i2++) {
                var na = nodes[i2];
                var nxt = na.next || [];
                for (var t = 0; t < nxt.length; t++) {
                    var tb = nxt[t];
                    if (!idMap[tb] || tb === na.id) continue;
                    if (undir[na.id].indexOf(tb) === -1) undir[na.id].push(tb);
                    if (undir[tb].indexOf(na.id) === -1) undir[tb].push(na.id);
                }
            }

            var distFromStart = {};
            var q = [startId];
            distFromStart[startId] = 0;
            for (var qi = 0; qi < q.length; qi++) {
                var cur = q[qi];
                var nb = undir[cur] || [];
                for (var ni = 0; ni < nb.length; ni++) {
                    if (distFromStart[nb[ni]] === undefined) {
                        distFromStart[nb[ni]] = distFromStart[cur] + 1;
                        q.push(nb[ni]);
                    }
                }
            }

            var hasEdge = function (u, v) {
                var nu = idMap[u];
                return !!(nu && Array.isArray(nu.next) && nu.next.indexOf(v) !== -1);
            };
            var flipEdgeInternal = function (u, v) {
                var nu = idMap[u];
                var nv = idMap[v];
                if (!nu || !nv) return false;
                var idx = (nu.next || []).indexOf(v);
                if (idx === -1) return false;
                nu.next.splice(idx, 1);
                if (!Array.isArray(nv.next)) nv.next = [];
                if (nv.next.indexOf(u) === -1) nv.next.push(u);
                return true;
            };

            // 1. Najít všechny neorientované řetězce mezi křižovatkami / slepými konci (uzly se stupněm != 2) a opravit protichůdné hrany
            var fixedEdges = 0;
            var visitedChainKey = {};
            for (var si = 0; si < nodes.length; si++) {
                var root = nodes[si];
                if (undir[root.id].length === 2) continue;

                var rootNeighbors = undir[root.id];
                for (var rn = 0; rn < rootNeighbors.length; rn++) {
                    var firstStep = rootNeighbors[rn];
                    var chain = [root.id, firstStep];
                    var prev = root.id;
                    var curr = firstStep;
                    while (undir[curr].length === 2 && curr !== root.id) {
                        var nbs = undir[curr];
                        var nextStep = (nbs[0] === prev) ? nbs[1] : nbs[0];
                        chain.push(nextStep);
                        prev = curr;
                        curr = nextStep;
                        if (chain.length > nodes.length + 2) break;
                    }
                    if (chain.length < 2) continue;

                    var startEnd = chain[0];
                    var finishEnd = chain[chain.length - 1];
                    var chainKey = (startEnd < finishEnd ? startEnd + "-" + finishEnd : finishEnd + "-" + startEnd) + ":" + chain[1] + ":" + chain[chain.length - 2];
                    if (visitedChainKey[chainKey]) continue;
                    visitedChainKey[chainKey] = true;

                    // Určení požadovaného směru řetězce (forward = startEnd -> finishEnd, nebo obráceně)
                    var fwdVote = 0;
                    var revVote = 0;
                    var startOut = hasEdge(chain[0], chain[1]);
                    var finishIn = hasEdge(chain[chain.length - 2], chain[chain.length - 1]);
                    if (startOut) fwdVote += 2; else revVote += 2;
                    if (finishIn) fwdVote += 2; else revVote += 2;

                    // Pokud se koncové šipky rozchází (shoda 2:2), rozhodne vzdálenost od Startu nebo slepý konec
                    var orientForward = true;
                    if (fwdVote !== revVote) {
                        orientForward = (fwdVote > revVote);
                    } else {
                        var dA = distFromStart[startEnd] !== undefined ? distFromStart[startEnd] : 99999;
                        var dB = distFromStart[finishEnd] !== undefined ? distFromStart[finishEnd] : 99999;
                        if (undir[finishEnd].length === 1 && undir[startEnd].length > 1) orientForward = true;
                        else if (undir[startEnd].length === 1 && undir[finishEnd].length > 1) orientForward = false;
                        else orientForward = (dA <= dB);
                    }

                    var ordered = orientForward ? chain : chain.slice().reverse();
                    for (var ci = 0; ci < ordered.length - 1; ci++) {
                        var u = ordered[ci];
                        var v = ordered[ci + 1];
                        if (!hasEdge(u, v) && hasEdge(v, u)) {
                            if (flipEdgeInternal(v, u)) fixedEdges++;
                        }
                    }
                }
            }

            // Re-sync všech větví po opravě hran
            this.syncNodeBranches(this.board, false);

            // 2. U rozcestí ověřit, která větev je hlavní okruh (1-3) a která boční větev (4-6)
            var fixedJunctions = 0;
            var inspectBranch = function (jId, firstTgtId) {
                var path = [];
                var seen = {};
                var curId = firstTgtId;
                var reachesStartWithoutJ = false;
                var steps = 0;
                while (curId !== null && curId !== undefined && idMap[curId] && !seen[curId] && steps <= nodes.length) {
                    if (curId === jId) break;
                    seen[curId] = true;
                    path.push(curId);
                    if (curId === startId) {
                        reachesStartWithoutJ = true;
                        break;
                    }
                    var ndObj = idMap[curId];
                    if (!ndObj.next || ndObj.next.length === 0) break;
                    curId = ndObj.next[0];
                    steps++;
                }
                return {
                    path: path,
                    seen: seen,
                    reachesStartWithoutJ: reachesStartWithoutJ,
                    hitsDeadEnd: (path.length === 0) || (!reachesStartWithoutJ && (!idMap[path[path.length - 1]].next || idMap[path[path.length - 1]].next.length === 0))
                };
            };

            for (var ji = 0; ji < nodes.length; ji++) {
                var jn = nodes[ji];
                if (!jn.next || jn.next.length < 2) continue;

                var t0 = jn.next[0];
                var t1 = jn.next[1];
                var info0 = inspectBranch(jn.id, t0);
                var info1 = inspectBranch(jn.id, t1);

                var preferSecond = false;
                if (info1.reachesStartWithoutJ && !info0.reachesStartWithoutJ) {
                    preferSecond = true;
                } else if (info0.hitsDeadEnd && !info1.hitsDeadEnd) {
                    preferSecond = true;
                } else if (info0.reachesStartWithoutJ === info1.reachesStartWithoutJ) {
                    var seq0 = (Math.abs(t0 - jn.id) === 1 || t0 === startId) ? 1 : 0;
                    var seq1 = (Math.abs(t1 - jn.id) === 1 || t1 === startId) ? 1 : 0;
                    if (seq1 !== seq0) {
                        preferSecond = (seq1 > seq0);
                    } else {
                        // Průměrná vzdálenost před prvním společným uzlem (vnější delší okruh vs vnitřní zkratka)
                        var mergeId = null;
                        for (var p0 = 0; p0 < info0.path.length; p0++) {
                            if (info1.seen[info0.path[p0]]) {
                                mergeId = info0.path[p0];
                                break;
                            }
                        }
                        var avgRad = function (arr) {
                            var cnt = 0;
                            var radSum = 0;
                            for (var ai = 0; ai < arr.length; ai++) {
                                if (arr[ai] === mergeId) break;
                                var pt = idMap[arr[ai]];
                                if (pt) {
                                    radSum += Math.hypot(pt.x - centroid.x, pt.y - centroid.y);
                                    cnt++;
                                }
                            }
                            return { len: cnt, avgRadius: cnt > 0 ? radSum / cnt : 0 };
                        };
                        var stat0 = avgRad(info0.path);
                        var stat1 = avgRad(info1.path);
                        if (stat1.len !== stat0.len) {
                            preferSecond = (stat1.len > stat0.len);
                        } else if (stat1.avgRadius > stat0.avgRadius + 15) {
                            preferSecond = true;
                        }
                    }
                }

                if (preferSecond) {
                    jn.next[0] = t1;
                    jn.next[1] = t0;
                    this.recomputeNodeJunctionState(jn);
                    fixedJunctions++;
                }
            }

            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) {
                if (fixedEdges + fixedJunctions > 0) {
                    window.KiDeskyToast.show("🧭 Opraveno cest: " + fixedEdges + ", srovnáno rozcestí: " + fixedJunctions + ".", "good");
                } else {
                    window.KiDeskyToast.show("🧭 Všechny boční větve a rozcestí už mají správný směr.", "turn");
                }
            }
            if (window.PRS_Audio) window.PRS_Audio.playStep();
            return { fixedEdges: fixedEdges, fixedJunctions: fixedJunctions };
        },

        // ====================================================================
        // HLAVNÍ HRAD (UMÍSTĚNÍ, SKIN, NÁZEV, VELIKOST, ZRCADLENÍ)
        // ====================================================================
        getRoyalCastleLandmark: function () {
            if (!this.board) return null;
            if (!Array.isArray(this.board.landmarks)) this.board.landmarks = [];
            for (var i = 0; i < this.board.landmarks.length; i++) {
                var lm = this.board.landmarks[i];
                if (lm && (lm.id === "royalCastle" || lm.isRoyalCastle || lm.id === "royal_castle")) {
                    lm.id = "royalCastle";
                    if (lm.x === undefined) lm.x = 700;
                    if (lm.y === undefined) lm.y = 365;
                    var rawLmImg = lm.image || lm.img || "assets/castles/castle_royal.webp";
                    if (window.PRS_isFlippedAssetUrl && window.PRS_isFlippedAssetUrl(rawLmImg)) {
                        lm.isFlipped = true;
                    }
                    lm.image = window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(rawLmImg) : rawLmImg;
                    lm.img = lm.image;
                    lm.baseW = lm.baseW || lm.w || 220;
                    lm.baseH = lm.baseH || lm.h || 180;
                    if (!lm.w) lm.w = lm.baseW;
                    if (!lm.h) lm.h = lm.baseH;
                    if (!lm.scale) lm.scale = 1;
                    return lm;
                }
            }
            var created = {
                id: "royalCastle",
                isRoyalCastle: true,
                x: 700,
                y: 365,
                w: 220,
                h: 180,
                baseW: 220,
                baseH: 180,
                name: "Královský hrad",
                icon: "👑",
                image: "assets/castles/castle_royal.webp",
                img: "assets/castles/castle_royal.webp",
                scale: 1,
                isFlipped: false,
                customPositioned: false
            };
            this.board.landmarks.push(created);
            return created;
        },

        onRoyalCastlePointerDown: function (evt) {
            if (evt.button !== 0) return;
            evt.preventDefault();
            evt.stopPropagation();

            var rc = this.getRoyalCastleLandmark();
            if (!rc) return;

            var self = this;
            var dragState = {
                startX: evt.clientX,
                startY: evt.clientY,
                started: false
            };

            function onMove(e) {
                var dx = e.clientX - dragState.startX;
                var dy = e.clientY - dragState.startY;
                if (!dragState.started) {
                    if (Math.hypot(dx, dy) < 4) return;
                    dragState.started = true;
                    self.pushUndo();
                    self.selectedNodeId = null;
                    self.selectedEdge = null;
                    self.inspectorMode = "castle";
                    self.updateInspectorUI();
                }

                e.preventDefault();
                var svg = document.getElementById("me-svg-canvas");
                if (!svg) return;
                var pt = self.getSvgCoordinates(e, svg);
                var cx = Math.max(120, Math.min(1280, Math.round(pt.x)));
                var cy = Math.max(100, Math.min(760, Math.round(pt.y)));

                rc.x = cx;
                rc.y = cy;
                rc.customPositioned = true;
                if (self.board) self.board._decorDirty = true;

                var g = document.getElementById("me-royal-castle-g");
                if (g) {
                    g.setAttribute("transform", "translate(" + cx + "," + cy + ") scale(" + (rc.scale || 1) + ")");
                }
                var coordsEl = document.getElementById("me-insp-castle-coords");
                if (coordsEl) coordsEl.textContent = "[" + cx + ", " + cy + "]";
            }

            function onUp() {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);

                self.selectedNodeId = null;
                self.selectedEdge = null;
                self.inspectorMode = "castle";
                self.updateStatusHelp();
                self.renderCanvas();
                self.updateInspectorUI();
                if (window.PRS_Audio) window.PRS_Audio.playStep();
            }

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        },

        getCastleDisplayName: function (rc) {
            if (!rc) return "";
            var catalog = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ALL_CASTLES) || [];
            var rawName = rc.name || "";
            for (var i = 0; i < catalog.length; i++) {
                var c = catalog[i];
                if (c.id === rc.skinId || c.id === rc.selectedKey || c.name === rawName || (c.img && (rc.image === c.img || rc.img === c.img))) {
                    return c.name || rawName;
                }
            }
            return rawName || (window.PRS_I18n ? window.PRS_I18n.t("custom_names.castles.castle_royal", null, "Královský hrad") : "Královský hrad");
        },

        applyRoyalCastleSkin: function (castleId) {
            var rc = this.getRoyalCastleLandmark();
            if (!rc) return;
            var catalog = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ALL_CASTLES) || [];
            var found = null;
            for (var i = 0; i < catalog.length; i++) {
                if (catalog[i].id === castleId || catalog[i].id === "castle_" + castleId) {
                    found = catalog[i];
                    break;
                }
            }
            if (!found) return;

            this.pushUndo();
            rc.skinId = found.id;
            rc.selectedKey = found.id;
            rc.image = found.img;
            rc.img = found.img;
            rc.icon = found.icon || "👑";
            if (!rc.customNameEdited) rc.name = found.name;
            rc.customPositioned = true;
            if (this.board) this.board.royalCastle = found.id;
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        applyRoyalCastleName: function (val) {
            var rc = this.getRoyalCastleLandmark();
            if (!rc) return;
            this.pushUndo();
            rc.name = String(val || "").trim() || "Královský hrad";
            rc.customNameEdited = true;
            rc.customPositioned = true;
            this.renderCanvas();
        },

        applyRoyalCastleScale: function (scaleVal) {
            var rc = this.getRoyalCastleLandmark();
            if (!rc) return;
            this.pushUndo();
            var clamped = Math.max(0.75, Math.min(1.3, parseFloat(scaleVal) || 1));
            rc.scale = Math.round(clamped * 100) / 100;
            rc.w = Math.round((rc.baseW || 220) * rc.scale);
            rc.h = Math.round((rc.baseH || 180) * rc.scale);
            rc.customPositioned = true;
            this.renderCanvas();
            this.updateInspectorUI();
        },

        toggleRoyalCastleFlip: function () {
            var rc = this.getRoyalCastleLandmark();
            if (!rc) return;
            this.pushUndo();
            rc.isFlipped = !rc.isFlipped;
            rc.customPositioned = true;
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        resetRoyalCastlePosition: function () {
            var rc = this.getRoyalCastleLandmark();
            if (!rc) return;
            this.pushUndo();
            rc.x = 700;
            rc.y = 365;
            rc.scale = 1;
            rc.w = rc.baseW || 220;
            rc.h = rc.baseH || 180;
            rc.isFlipped = false;
            rc.customPositioned = false;
            if (this.board) this.board._decorDirty = true;
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show("🏰 Hlavní hrad vrácen doprostřed mapy [700, 365].", "turn");
        },

        // ====================================================================
        // EDITACE TOKU ŘEKY (BEZIÉROVY KŘIVKY, PŘEDVOLBY, MEANDRY, MOSTY)
        // ====================================================================
        parseRiverPathPoints: function (pathStr) {
            if (!pathStr || typeof pathStr !== "string") return [];
            var tokens = pathStr.match(/[A-Za-z]|[-+]?\d*\.?\d+/g);
            if (!tokens || tokens.length === 0) return [];

            var pts = [];
            var cur = { x: 0, y: 0 };
            var i = 0;
            var cmd = "";
            var num = function () { return parseFloat(tokens[i++]); };

            while (i < tokens.length) {
                if (/^[A-Za-z]$/.test(tokens[i])) {
                    cmd = tokens[i++];
                }
                if (cmd === "M" || cmd === "m") {
                    if (i + 1 >= tokens.length) break;
                    var mx = num();
                    var my = num();
                    if (cmd === "m") { mx += cur.x; my += cur.y; }
                    cur = { x: mx, y: my };
                    if (pts.length === 0) pts.push({ x: cur.x, y: cur.y });
                    cmd = (cmd === "m") ? "l" : "L";
                } else if (cmd === "C" || cmd === "c") {
                    if (i + 5 >= tokens.length) break;
                    var x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
                    if (cmd === "c") {
                        x1 += cur.x; y1 += cur.y;
                        x2 += cur.x; y2 += cur.y;
                        x3 += cur.x; y3 += cur.y;
                    }
                    if (pts.length === 0) pts.push({ x: cur.x, y: cur.y });
                    pts.push({ x: x1, y: y1 }, { x: x2, y: y2 }, { x: x3, y: y3 });
                    cur = { x: x3, y: y3 };
                } else if (cmd === "Q" || cmd === "q") {
                    if (i + 3 >= tokens.length) break;
                    var qx = num(), qy = num(), ex = num(), ey = num();
                    if (cmd === "q") { qx += cur.x; qy += cur.y; ex += cur.x; ey += cur.y; }
                    if (pts.length === 0) pts.push({ x: cur.x, y: cur.y });
                    var c1x = cur.x + (2 / 3) * (qx - cur.x);
                    var c1y = cur.y + (2 / 3) * (qy - cur.y);
                    var c2x = ex + (2 / 3) * (qx - ex);
                    var c2y = ey + (2 / 3) * (qy - ey);
                    pts.push({ x: c1x, y: c1y }, { x: c2x, y: c2y }, { x: ex, y: ey });
                    cur = { x: ex, y: ey };
                } else if (cmd === "L" || cmd === "l") {
                    if (i + 1 >= tokens.length) break;
                    var lx = num(), ly = num();
                    if (cmd === "l") { lx += cur.x; ly += cur.y; }
                    if (pts.length === 0) pts.push({ x: cur.x, y: cur.y });
                    pts.push(
                        { x: cur.x + (lx - cur.x) / 3, y: cur.y + (ly - cur.y) / 3 },
                        { x: cur.x + (2 * (lx - cur.x)) / 3, y: cur.y + (2 * (ly - cur.y)) / 3 },
                        { x: lx, y: ly }
                    );
                    cur = { x: lx, y: ly };
                } else {
                    i++;
                }
            }
            return pts;
        },

        buildRiverPathFromPoints: function (pts) {
            if (!pts || pts.length === 0) return "";
            var parts = ["M " + Math.round(pts[0].x) + " " + Math.round(pts[0].y)];
            for (var i = 1; i + 2 < pts.length; i += 3) {
                parts.push(
                    "C " + Math.round(pts[i].x) + " " + Math.round(pts[i].y) +
                    ", " + Math.round(pts[i + 1].x) + " " + Math.round(pts[i + 1].y) +
                    ", " + Math.round(pts[i + 2].x) + " " + Math.round(pts[i + 2].y)
                );
            }
            return parts.join(" ");
        },

        onRiverPathClick: function (evt, rivIdx) {
            if (evt) evt.stopPropagation();
            this.selectedRiverIdx = rivIdx;
            this.selectedRiverPtIdx = null;
            this.selectedNodeId = null;
            this.selectedEdge = null;
            this.inspectorMode = "river";
            this.updateStatusHelp();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        onRiverPointPointerDown: function (evt, rivIdx, ptIdx) {
            if (evt.button !== 0) return;
            evt.preventDefault();
            evt.stopPropagation();

            var riv = this.board && this.board.rivers && this.board.rivers[rivIdx];
            if (!riv) return;
            var pts = this.parseRiverPathPoints(riv.path);
            if (!pts || !pts[ptIdx]) return;

            var self = this;
            var dragState = {
                startX: evt.clientX,
                startY: evt.clientY,
                started: false
            };

            function syncPtDom(svg, idxToSync) {
                var ptObj = pts[idxToSync];
                if (!ptObj) return;
                var c = svg.querySelector('.me-river-pt[data-riv-idx="' + rivIdx + '"][data-pt-idx="' + idxToSync + '"]');
                if (c) {
                    c.setAttribute("cx", ptObj.x);
                    c.setAttribute("cy", ptObj.y);
                }
                if (idxToSync % 3 === 0) {
                    var gOut = svg.querySelectorAll('.me-river-guide[data-anchor="' + idxToSync + '"]');
                    for (var go = 0; go < gOut.length; go++) {
                        gOut[go].setAttribute("x1", ptObj.x);
                        gOut[go].setAttribute("y1", ptObj.y);
                    }
                } else {
                    var gIn = svg.querySelector('.me-river-guide[data-handle="' + idxToSync + '"]');
                    if (gIn) {
                        gIn.setAttribute("x2", ptObj.x);
                        gIn.setAttribute("y2", ptObj.y);
                    }
                }
            }

            function onMove(e) {
                var dx = e.clientX - dragState.startX;
                var dy = e.clientY - dragState.startY;
                if (!dragState.started) {
                    if (Math.hypot(dx, dy) < 3) return;
                    dragState.started = true;
                    self.pushUndo();
                    self.selectedRiverIdx = rivIdx;
                    self.selectedRiverPtIdx = ptIdx;
                    self.selectedNodeId = null;
                    self.selectedEdge = null;
                    self.inspectorMode = "river";
                }

                e.preventDefault();
                var svg = document.getElementById("me-svg-canvas");
                if (!svg) return;
                var curPt = self.getSvgCoordinates(e, svg);
                var nx = Math.max(-80, Math.min(1480, Math.round(curPt.x)));
                var ny = Math.max(-80, Math.min(940, Math.round(curPt.y)));
                var ddx = nx - pts[ptIdx].x;
                var ddy = ny - pts[ptIdx].y;

                pts[ptIdx].x = nx;
                pts[ptIdx].y = ny;

                // Při tažení kotvy (násobek 3) bez klávesy Alt posuneme plynule i přilehlá táhla
                if (ptIdx % 3 === 0 && !e.altKey) {
                    if (ptIdx - 1 >= 0) {
                        pts[ptIdx - 1].x += ddx;
                        pts[ptIdx - 1].y += ddy;
                        syncPtDom(svg, ptIdx - 1);
                    }
                    if (ptIdx + 1 < pts.length) {
                        pts[ptIdx + 1].x += ddx;
                        pts[ptIdx + 1].y += ddy;
                        syncPtDom(svg, ptIdx + 1);
                    }
                }
                syncPtDom(svg, ptIdx);

                riv.path = self.buildRiverPathFromPoints(pts);
                if (self.board) self.board._decorDirty = true;

                var rivPaths = svg.querySelectorAll('path[data-river-idx="' + rivIdx + '"]');
                for (var rp = 0; rp < rivPaths.length; rp++) {
                    rivPaths[rp].setAttribute("d", riv.path);
                }

                var ptInfo = document.getElementById("me-insp-river-pt-info");
                if (ptInfo) ptInfo.textContent = "Bod #" + ptIdx + (ptIdx % 3 === 0 ? " (kotva)" : " (táhlo)") + ": [" + nx + ", " + ny + "]";
            }

            function onUp() {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);

                self.selectedRiverIdx = rivIdx;
                self.selectedRiverPtIdx = ptIdx;
                self.inspectorMode = "river";
                self.recomputeBridgesSafe();
                self.renderCanvas();
                self.updateInspectorUI();
                if (dragState.started && window.PRS_Audio) window.PRS_Audio.playStep();
            }

            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        },

        buildRiverPresetList: function () {
            var defs = {
                standard: [
                    { path: "M -40 180 C 260 120, 420 520, 700 420 C 980 320, 1140 680, 1440 600", width: 38, isTributary: false, customWidth: true }
                ],
                dual: [
                    { path: "M -40 240 C 310 180, 520 540, 860 360 C 1100 230, 1240 460, 1440 420", width: 38, isTributary: false, customWidth: true },
                    { path: "M 540 -40 C 580 180, 680 300, 860 360 C 980 420, 1160 720, 1280 900", width: 28, isTributary: true, customWidth: true }
                ],
                island: [
                    { path: "M -40 420 C 260 220, 540 160, 700 180 C 940 210, 1160 300, 1440 420", width: 36, isTributary: false, customWidth: true },
                    { path: "M -40 420 C 260 620, 540 680, 700 660 C 940 630, 1160 540, 1440 420", width: 34, isTributary: false, customWidth: true }
                ],
                delta: [
                    { path: "M -40 380 C 320 300, 520 480, 760 410 C 980 340, 1180 280, 1440 180", width: 40, isTributary: false, customWidth: true },
                    { path: "M 760 410 C 980 470, 1180 560, 1440 520", width: 30, isTributary: true, isDeltaBranch: true, customWidth: true },
                    { path: "M 640 420 C 860 590, 1100 720, 1440 760", width: 28, isTributary: true, isDeltaBranch: true, customWidth: true }
                ],
                none: []
            };
            defs.single = defs.standard;
            return defs;
        },

        applyRiverPreset: function (presetKey) {
            if (!this.board) return;
            var tEd = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var presets = this.buildRiverPresetList();
            if (!presets[presetKey]) return;

            this.pushUndo();
            this.isDrawingRiver = false;
            this.drawRiverPoints = [];
            this.board.rivers = JSON.parse(JSON.stringify(presets[presetKey]));
            this.selectedRiverIdx = 0;
            this.selectedRiverPtIdx = null;
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show(tEd("map_editor.river_toast_preset", { key: presetKey }, "🌊 Použita šablona řeky: " + presetKey), "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        selectRiverIndex: function (rivIdx) {
            if (!this.board || !Array.isArray(this.board.rivers)) return;
            if (rivIdx < 0 || rivIdx >= this.board.rivers.length) return;
            this.selectedRiverIdx = rivIdx;
            this.selectedRiverPtIdx = null;
            this.isDrawingRiver = false;
            this.drawRiverPoints = [];
            this.inspectorMode = "river";
            this.renderCanvas();
            this.updateInspectorUI();
        },

        startDrawRiver: function () {
            this.activeTool = "river";
            this.inspectorMode = "river";
            this.isDrawingRiver = true;
            this.drawRiverPoints = [];
            this.selectedRiverPtIdx = null;
            this.updateToolButtons();
            this.updateStatusHelp();
            this.updateCursor();
            this.updateInspectorUI();
            this.renderCanvas();
        },

        cancelDrawRiver: function () {
            this.isDrawingRiver = false;
            this.drawRiverPoints = [];
            this.updateStatusHelp();
            this.updateCursor();
            this.updateInspectorUI();
            this.renderCanvas();
        },

        addDrawRiverPoint: function (x, y) {
            if (!this.drawRiverPoints) this.drawRiverPoints = [];
            var cx = Math.max(-40, Math.min(1440, Math.round(x)));
            var cy = Math.max(-40, Math.min(900, Math.round(y)));
            this.drawRiverPoints.push({ x: cx, y: cy });
            this.updateInspectorUI();
            this.renderCanvas();
        },

        catmullRomToCubicBezierPath: function (pts) {
            if (!pts || pts.length < 2) return "";
            var d = "M " + Math.round(pts[0].x) + " " + Math.round(pts[0].y);
            for (var i = 0; i < pts.length - 1; i++) {
                var p0 = pts[Math.max(0, i - 1)];
                var p1 = pts[i];
                var p2 = pts[i + 1];
                var p3 = pts[Math.min(pts.length - 1, i + 2)];
                var cp1x = Math.round(p1.x + (p2.x - p0.x) / 6);
                var cp1y = Math.round(p1.y + (p2.y - p0.y) / 6);
                var cp2x = Math.round(p2.x - (p3.x - p1.x) / 6);
                var cp2y = Math.round(p2.y - (p3.y - p1.y) / 6);
                d += " C " + cp1x + " " + cp1y + ", " + cp2x + " " + cp2y + ", " + Math.round(p2.x) + " " + Math.round(p2.y);
            }
            return d;
        },

        finishDrawRiver: function () {
            var tEd = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            if (!this.board || !this.drawRiverPoints || this.drawRiverPoints.length < 2) {
                this.cancelDrawRiver();
                return;
            }
            if (!Array.isArray(this.board.rivers)) this.board.rivers = [];
            var pathStr = this.catmullRomToCubicBezierPath(this.drawRiverPoints);
            var isFirst = (this.board.rivers.length === 0);
            this.pushUndo();
            this.board.rivers.push({
                path: pathStr,
                width: isFirst ? 36 : 26,
                isTributary: !isFirst,
                customWidth: true
            });
            this.selectedRiverIdx = this.board.rivers.length - 1;
            this.selectedRiverPtIdx = null;
            this.isDrawingRiver = false;
            this.drawRiverPoints = [];
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.updateStatusHelp();
            this.updateCursor();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show(tEd("map_editor.river_toast_drawn", null, "🌊 Nový vlastní tok byl vytvořen a mosty přepočítány."), "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        addRiverMeander: function () {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var pts = this.parseRiverPathPoints(riv.path);
            if (!pts || pts.length < 4) return;

            var bestSegIdx = 0;
            var bestLen = -1;
            for (var s = 0; s + 3 < pts.length; s += 3) {
                var d = Math.hypot(pts[s + 3].x - pts[s].x, pts[s + 3].y - pts[s].y);
                if (d > bestLen) {
                    bestLen = d;
                    bestSegIdx = s;
                }
            }

            var p0 = pts[bestSegIdx];
            var p1 = pts[bestSegIdx + 1];
            var p2 = pts[bestSegIdx + 2];
            var p3 = pts[bestSegIdx + 3];
            var midPt = function (a, b) { return { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 }; };
            var q0 = midPt(p0, p1);
            var q1 = midPt(p1, p2);
            var q2 = midPt(p2, p3);
            var r0 = midPt(q0, q1);
            var r1 = midPt(q1, q2);
            var m = midPt(r0, r1);

            var dx = p3.x - p0.x;
            var dy = p3.y - p0.y;
            var len = Math.hypot(dx, dy) || 1;
            var nx = -dy / len;
            var ny = dx / len;
            var sign = ((bestSegIdx / 3) % 2 === 0) ? 1 : -1;
            var wave = 42 * sign;

            r0.x += nx * wave; r0.y += ny * wave;
            m.x += nx * wave;  m.y += ny * wave;
            r1.x += nx * wave; r1.y += ny * wave;

            this.pushUndo();
            pts.splice(bestSegIdx + 1, 2, q0, r0, m, r1, q2);
            riv.path = this.buildRiverPathFromPoints(pts);
            this.selectedRiverPtIdx = bestSegIdx + 3;
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) window.KiDeskyToast.show("〰️ Přidán nový zákrut (meandr) vybrané větve řeky.", "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        addRiverTributary: function () {
            if (!this.board) return;
            if (!Array.isArray(this.board.rivers)) this.board.rivers = [];

            var targetPt = { x: 700, y: 420 };
            if (this.board.rivers.length > 0) {
                var mainPts = this.parseRiverPathPoints(this.board.rivers[0].path);
                if (mainPts.length > 3) {
                    var midIdx = Math.floor(mainPts.length / 2);
                    midIdx = midIdx - (midIdx % 3);
                    if (mainPts[midIdx]) targetPt = mainPts[midIdx];
                }
            }

            var startX = Math.max(80, Math.min(1320, Math.round(targetPt.x - 180)));
            var startY = targetPt.y > 430 ? 900 : -40;
            var c1x = Math.round(startX + 40);
            var c1y = Math.round((startY + targetPt.y) * 0.45);
            var c2x = Math.round(targetPt.x - 60);
            var c2y = Math.round(targetPt.y + (startY < 0 ? -90 : 90));

            this.pushUndo();
            this.board.rivers.push({
                path: "M " + startX + " " + startY + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + Math.round(targetPt.x) + " " + Math.round(targetPt.y),
                width: 28,
                isTributary: true,
                customWidth: true
            });
            this.selectedRiverIdx = this.board.rivers.length - 1;
            this.selectedRiverPtIdx = null;
            this.inspectorMode = "river";
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();

            if (window.KiDeskyToast) window.KiDeskyToast.show("➕ Přidán nový přítok / rameno řeky.", "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        flipSelectedRiverHorizontally: function () {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var pts = this.parseRiverPathPoints(riv.path);
            if (!pts || pts.length === 0) return;

            this.pushUndo();
            for (var i = 0; i < pts.length; i++) {
                pts[i].x = 1400 - pts[i].x;
            }
            riv.path = this.buildRiverPathFromPoints(pts);
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        toggleSelectedRiverTributary: function () {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            this.pushUndo();
            var riv = this.board.rivers[this.selectedRiverIdx];
            riv.isTributary = !riv.isTributary;
            this.renderCanvas();
            this.updateInspectorUI();
        },

        deleteSelectedRiverAnchor: function () {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            if (this.selectedRiverPtIdx === null || this.selectedRiverPtIdx % 3 !== 0) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var pts = this.parseRiverPathPoints(riv.path);
            if (!pts || pts.length <= 4) return;
            this.pushUndo();
            var idx = this.selectedRiverPtIdx;
            if (idx === 0) {
                pts.splice(0, 3);
            } else if (idx >= pts.length - 1) {
                pts.splice(pts.length - 3, 3);
            } else {
                pts.splice(idx - 1, 3);
            }
            riv.path = this.buildRiverPathFromPoints(pts);
            this.selectedRiverPtIdx = null;
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();
        },

        applyRiverWidthLive: function (w) {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var clampedW = Math.max(10, Math.min(64, parseInt(w, 10) || 36));
            riv.width = clampedW;
            riv.customWidth = true;
            var lbl = document.getElementById("me-insp-river-w-val");
            if (lbl) lbl.textContent = clampedW + " px";
            var svg = document.getElementById("me-svg-canvas");
            if (svg) {
                var idx = this.selectedRiverIdx;
                var upd = function (sel, sw) {
                    var el = svg.querySelector(sel + '[data-river-idx="' + idx + '"]');
                    if (el) el.setAttribute("stroke-width", sw);
                };
                upd(".me-river-sel", clampedW + 22);
                upd(".me-river-bank", clampedW + 14);
                upd(".me-river-water", clampedW);
                upd(".me-river-foam", Math.max(4, clampedW * 0.45).toFixed(1));
            }
        },

        applyRiverWidth: function (w) {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var clampedW = Math.max(10, Math.min(64, parseInt(w, 10) || 36));
            this.pushUndo();
            riv.width = clampedW;
            riv.customWidth = true;
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();
        },

        setBiomeBrush: function (biomeKey) {
            this.activeBiomeBrush = biomeKey || "forest";
            this.updateStatusHelp();
            this.updateInspectorUI();
            this.renderCanvas();
        },

        setBiomeBrushRadius: function (r) {
            var rad = Math.max(50, Math.min(220, parseInt(r, 10) || 110));
            this.biomeBrushRadius = rad;
            var lbl = document.getElementById("me-insp-biome-r-val");
            if (lbl) lbl.textContent = rad + " px";
            var ring = document.getElementById("me-biome-cursor-ring");
            if (ring) ring.setAttribute("r", rad);
        },

        applyBiomeBrushAt: function (x, y) {
            if (!this.board) return;
            if (!Array.isArray(this.board.biomeZones)) this.board.biomeZones = [];
            var cx = Math.max(0, Math.min(1400, Math.round(x)));
            var cy = Math.max(0, Math.min(860, Math.round(y)));
            var r = Math.max(50, Math.min(220, parseInt(this.biomeBrushRadius, 10) || 110));

            if (this.activeBiomeBrush === "erase") {
                this.board.biomeZones = this.board.biomeZones.filter(function (bz) {
                    var thresh = Math.max(r, (bz.r || 90) * 0.65);
                    return Math.hypot(bz.x - cx, bz.y - cy) > thresh;
                });
                this.board._decorDirty = true;
                this.renderCanvas();
                return;
            }

            if (this.board.biomeZones.length >= 160) {
                this.board.biomeZones.shift();
            }
            this.board.biomeZones.push({
                id: "bz_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
                biome: this.activeBiomeBrush || "forest",
                x: cx,
                y: cy,
                r: r
            });
            this.board._decorDirty = true;

            // Rychlé přidání kruhu do živého SVG bez překreslování celé mapy během tažení
            var layer = document.getElementById("me-biome-zones-layer");
            if (layer && document.createElementNS) {
                var pal = {
                    forest:   { fill: "rgba(21, 128, 61, 0.42)",  stroke: "#4ade80" },
                    meadow:   { fill: "rgba(132, 204, 22, 0.36)", stroke: "#bef264" },
                    farmland: { fill: "rgba(234, 179, 8, 0.38)",  stroke: "#fde047" },
                    rocky:    { fill: "rgba(120, 113, 108, 0.48)",stroke: "#d6d3d1" },
                    wetland:  { fill: "rgba(14, 165, 233, 0.42)", stroke: "#7dd3fc" }
                };
                var pCol = pal[this.activeBiomeBrush] || pal.meadow;
                var cir = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                cir.setAttribute("cx", cx);
                cir.setAttribute("cy", cy);
                cir.setAttribute("r", r);
                cir.setAttribute("fill", pCol.fill);
                cir.setAttribute("opacity", "0.75");
                cir.setAttribute("stroke", pCol.stroke);
                cir.setAttribute("stroke-width", "1.6");
                cir.setAttribute("stroke-dasharray", "6,4");
                layer.appendChild(cir);
            }
        },

        clearCustomBiomeZones: function () {
            if (!this.board) return;
            var tEd = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            this.pushUndo();
            this.board.biomeZones = [];
            this.board._decorDirty = true;
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show(tEd("map_editor.biome_toast_cleared", null, "🧹 Vlastní biomy byly vymazány."), "turn");
        },

        deleteSelectedRiver: function () {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            this.pushUndo();
            this.board.rivers.splice(this.selectedRiverIdx, 1);
            this.selectedRiverIdx = Math.max(0, Math.min(this.selectedRiverIdx, this.board.rivers.length - 1));
            this.selectedRiverPtIdx = null;
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show("🗑️ Větev řeky byla odstraněna.", "turn");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        regenerateDecorAndBridges: function () {
            if (!this.board) return;
            this.recomputeBridgesSafe();
            if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
                var seed = this.board.seed || 4242;
                window.PRS_BoardBuilder.generateBoardDecorations(this.board, seed);
            }
            this.board._decorDirty = false;
            this.renderCanvas();
            if (window.KiDeskyToast) window.KiDeskyToast.show("🌿 Mosty a přírodní dekorace byly přepočítány podle nové řeky a hradu.", "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        // ====================================================================
        // INSPEKTOR POLÍČKA (EDITACE TYPU, NÁZVU, CENY A NÁJMU)
        // ====================================================================
        updateInspectorUI: function () {
            var box = document.getElementById("me-inspector-panel");
            if (!box) return;
            var tEd = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

            var bodyNode = document.getElementById("me-insp-body-node");
            var bodyEdge = document.getElementById("me-insp-body-edge");
            var bodyCastle = document.getElementById("me-insp-body-castle");
            var bodyRiver = document.getElementById("me-insp-body-river");
            var bodyBiome = document.getElementById("me-insp-body-biome");
            var titleEl = document.getElementById("me-insp-title");
            var idEl = document.getElementById("me-insp-id");

            var hideAll = function () {
                if (bodyNode) bodyNode.style.display = "none";
                if (bodyEdge) bodyEdge.style.display = "none";
                if (bodyCastle) bodyCastle.style.display = "none";
                if (bodyRiver) bodyRiver.style.display = "none";
                if (bodyBiome) bodyBiome.style.display = "none";
            };

            var mode = this.inspectorMode;
            if (!mode) {
                if (this.selectedEdge) mode = "edge";
                else if (this.selectedNodeId !== null) mode = "node";
                else if (this.activeTool === "castle") mode = "castle";
                else if (this.activeTool === "river") mode = "river";
                else if (this.activeTool === "biome") mode = "biome";
            }

            if (!mode) {
                box.style.display = "none";
                return;
            }

            // 1. Režim Cesty / Hrany
            if (mode === "edge" && this.selectedEdge) {
                var nFrom = this.getNodeById(this.selectedEdge.from);
                var nTo = this.getNodeById(this.selectedEdge.to);
                if (!nFrom || !nTo || !Array.isArray(nFrom.next) || nFrom.next.indexOf(nTo.id) === -1) {
                    this.selectedEdge = null;
                    this.inspectorMode = null;
                    box.style.display = "none";
                    return;
                }
                box.style.display = "block";
                hideAll();
                if (bodyEdge) bodyEdge.style.display = "block";
                if (titleEl) titleEl.textContent = tEd("map_editor.path_inspector_title", null, "🔗 Inspektor cesty");
                if (idEl) idEl.textContent = "#" + nFrom.id + " ➔ #" + nTo.id;

                if (bodyEdge) {
                    var idxInNext = nFrom.next.indexOf(nTo.id);
                    var isJunc = nFrom.next.length >= 2;
                    var roleTxt = isJunc
                        ? (idxInNext === 0
                            ? tEd("map_editor.path_primary_dir", null, "🔵 Hlavní směr (kostka 1–3)")
                            : (idxInNext === 1
                                ? tEd("map_editor.path_side_branch", null, "🟠 Boční větev (kostka 4–6)")
                                : tEd("map_editor.path_secondary_link", null, "⚪ Vedlejší propojení")))
                        : tEd("map_editor.path_single_outgoing", null, "Jediná výstupní cesta");
                    var html = [];
                    html.push('<div style="font-size:0.74rem; color:#e2e8f0; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.25); border-radius:6px; padding:0.45rem; margin-bottom:0.45rem;">');
                    html.push('  <div style="margin-bottom:3px;"><strong>' + tEd("map_editor.path_from", null, "Od:") + '</strong> #' + nFrom.id + ' ' + this.escapeXml(nFrom.name || nFrom.code || "") + '</div>');
                    html.push('  <div style="margin-bottom:4px;"><strong>' + tEd("map_editor.path_to", null, "Do:") + '</strong> #' + nTo.id + ' ' + this.escapeXml(nTo.name || nTo.code || "") + '</div>');
                    html.push('  <div style="font-size:0.7rem; color:#fde68a;">' + roleTxt + '</div>');
                    html.push('</div>');
                    html.push('<div style="display:flex; flex-direction:column; gap:0.35rem;">');
                    html.push('  <button type="button" class="btn-secondary" style="font-size:0.73rem; padding:0.3rem 0.5rem;" onclick="PRS_MapEditor.reverseEdgeDirection(' + nFrom.id + ', ' + nTo.id + ')">' + tEd("map_editor.path_reverse_btn", { from: nFrom.id, to: nTo.id }, "🔄 Obrátit směr (#" + nTo.id + " ➔ #" + nFrom.id + ")") + '</button>');
                    if (isJunc) {
                        html.push('  <button type="button" class="btn-secondary" style="font-size:0.73rem; padding:0.3rem 0.5rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.swapJunctionBranchPriority(' + nFrom.id + ')">' + tEd("map_editor.path_swap_junc_btn", null, "🔀 Prohodit prioritu rozcestí (1–3 ⇄ 4–6)") + '</button>');
                    }
                    html.push('  <button type="button" class="btn-icon-danger" style="font-size:0.73rem; padding:0.3rem 0.5rem;" onclick="PRS_MapEditor.removeEdge(' + nFrom.id + ', ' + nTo.id + ')">' + tEd("map_editor.path_remove_btn", null, "✂️ Odebrat cestu (Delete)") + '</button>');
                    html.push('  <button type="button" class="btn-zoom" style="font-size:0.72rem; padding:0.28rem 0.5rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.autoOrientSideBranches()">' + tEd("map_editor.path_auto_orient_btn", null, "🧭 Automaticky srovnat větve") + '</button>');
                    html.push('</div>');
                    bodyEdge.innerHTML = html.join("\n");
                }
                return;
            }

            // 2. Režim Hlavního hradu
            if (mode === "castle") {
                var rc = this.getRoyalCastleLandmark();
                if (!rc) {
                    box.style.display = "none";
                    return;
                }
                box.style.display = "block";
                hideAll();
                if (bodyCastle) bodyCastle.style.display = "block";
                if (titleEl) titleEl.textContent = tEd("map_editor.castle_inspector_title", null, "🏰 Hlavní hrad");
                if (idEl) idEl.textContent = tEd("map_editor.castle_badge_royal", null, "Královský");

                if (bodyCastle) {
                    var catalog = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ALL_CASTLES) || [];
                    var opts = [];
                    for (var ci = 0; ci < catalog.length; ci++) {
                        var c = catalog[ci];
                        var isSelSkin = (rc.skinId === c.id || rc.selectedKey === c.id || rc.image === c.img || rc.img === c.img);
                        var cName = c.name;
                        opts.push('<option value="' + c.id + '"' + (isSelSkin ? ' selected' : '') + '>' + this.escapeXml((c.icon || "🏰") + " " + cName) + '</option>');
                    }
                    var scalePct = Math.round((rc.scale || 1) * 100);
                    var cHtml = [];
                    cHtml.push('<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#cbd5e1; background:rgba(0,0,0,0.4); border-radius:6px; padding:4px 8px; margin-bottom:0.4rem;">');
                    cHtml.push('  <span>' + tEd("map_editor.castle_coords_label", null, "Souřadnice na mapě:") + '</span>');
                    cHtml.push('  <strong id="me-insp-castle-coords" style="color:#fde68a; font-family:monospace;">[' + Math.round(rc.x) + ', ' + Math.round(rc.y) + ']</strong>');
                    cHtml.push('</div>');
                    cHtml.push('<div style="margin-bottom:0.35rem;">');
                    cHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.castle_skin_label", null, "Podoba (skin) hradu:") + '</label>');
                    cHtml.push('  <select class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyRoyalCastleSkin(this.value)">' + opts.join("") + '</select>');
                    cHtml.push('</div>');
                    cHtml.push('<div style="margin-bottom:0.35rem;">');
                    cHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.castle_name_label", null, "Název hradu:") + '</label>');
                    cHtml.push('  <input type="text" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.4rem;" value="' + this.escapeXml(this.getCastleDisplayName(rc)) + '" onchange="PRS_MapEditor.applyRoyalCastleName(this.value)" />');
                    cHtml.push('</div>');
                    cHtml.push('<div style="margin-bottom:0.45rem;">');
                    cHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:2px;"><span>' + tEd("map_editor.castle_scale_label", null, "Velikost hradu:") + '</span><strong id="me-insp-castle-scale-val" style="color:#fef08a;">' + scalePct + '%</strong></label>');
                    cHtml.push('  <input type="range" min="0.75" max="1.30" step="0.05" value="' + (rc.scale || 1) + '" style="width:100%;" oninput="var el=document.getElementById(\'me-insp-castle-scale-val\'); if(el) el.textContent=Math.round(this.value*100)+\'%\';" onchange="PRS_MapEditor.applyRoyalCastleScale(this.value)" />');
                    cHtml.push('</div>');
                    cHtml.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; margin-bottom:0.35rem;">');
                    cHtml.push('  <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.toggleRoyalCastleFlip()">' + tEd("map_editor.castle_flip_btn", { checked: (rc.isFlipped ? "(✓)" : "") }, "↔️ Zrcadlit " + (rc.isFlipped ? "(✓)" : "")) + '</button>');
                    cHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.resetRoyalCastlePosition()">' + tEd("map_editor.castle_center_btn", null, "🎯 Střed mapy") + '</button>');
                    cHtml.push('</div>');
                    cHtml.push('<button type="button" class="btn-zoom" style="width:100%; font-size:0.72rem; padding:0.28rem 0.4rem; border-color:#22c55e; color:#bbf7d0;" onclick="PRS_MapEditor.regenerateDecorAndBridges()">' + tEd("map_editor.castle_recalc_decor_btn", null, "🌿 Přepočítat mosty & dekorace") + '</button>');
                    bodyCastle.innerHTML = cHtml.join("\n");
                }
                return;
            }

            // 3. Režim Řeky
            if (mode === "river") {
                box.style.display = "block";
                hideAll();
                if (bodyRiver) bodyRiver.style.display = "block";
                if (titleEl) titleEl.textContent = tEd("map_editor.river_inspector_title", null, "🌊 Editor řeky");
                var rivers = (this.board && Array.isArray(this.board.rivers)) ? this.board.rivers : [];
                if (idEl) idEl.textContent = rivers.length > 0 ? tEd("map_editor.river_branch_label", { current: this.selectedRiverIdx + 1, total: rivers.length }, "Větev " + (this.selectedRiverIdx + 1) + "/" + rivers.length) : tEd("map_editor.river_no_river", null, "Bez řeky");

                if (bodyRiver) {
                    var rHtml = [];
                    if (this.isDrawingRiver) {
                        var dCount = (this.drawRiverPoints || []).length;
                        rHtml.push('<div style="font-size:0.71rem; color:#bae6fd; background:rgba(14,165,233,0.18); border:1px solid rgba(56,189,248,0.45); border-radius:6px; padding:0.45rem; margin-bottom:0.4rem;">');
                        rHtml.push('  <div style="margin-bottom:4px;">' + tEd("map_editor.river_draw_points", { count: dCount }, "Naklikaných bodů: <strong>" + dCount + "</strong> (min. 2)") + '</div>');
                        rHtml.push('  <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">');
                        rHtml.push('    <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:0.28rem 0.4rem; border-color:#22c55e; color:#bbf7d0;" onclick="PRS_MapEditor.finishDrawRiver()"' + (dCount < 2 ? ' disabled' : '') + '>' + tEd("map_editor.river_btn_finish_draw", null, "✅ Dokončit tok") + '</button>');
                        rHtml.push('    <button type="button" class="btn-icon-danger" style="font-size:0.7rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.cancelDrawRiver()">' + tEd("map_editor.river_btn_cancel_draw", null, "✕ Zrušit") + '</button>');
                        rHtml.push('  </div>');
                        rHtml.push('</div>');
                    } else {
                        rHtml.push('<button type="button" class="btn-secondary" style="width:100%; font-size:0.73rem; padding:0.32rem 0.4rem; margin-bottom:0.4rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.startDrawRiver()">' + tEd("map_editor.river_btn_start_draw", null, "✏️ Nakreslit vlastní tok") + '</button>');
                    }

                    rHtml.push('<div style="margin-bottom:0.4rem;">');
                    rHtml.push('  <div style="font-size:0.68rem; color:#cbd5e1; margin-bottom:3px;">' + tEd("map_editor.river_presets_label", null, "Rychlé šablony toku:") + '</div>');
                    rHtml.push('  <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;">');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'standard\')">' + tEd("map_editor.river_preset_main", null, "🌊 Hlavní") + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'dual\')">' + tEd("map_editor.river_preset_confluence", null, "🌿 Soutok") + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'island\')">' + tEd("map_editor.river_preset_island", null, "🏝️ Ostrov") + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'delta\')">' + tEd("map_editor.river_preset_delta", null, "🔻 Delta") + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px; border-color:#64748b; color:#94a3b8;" onclick="PRS_MapEditor.applyRiverPreset(\'none\')">' + tEd("map_editor.river_preset_none", null, "🏜️ Bez řeky") + '</button>');
                    rHtml.push('  </div>');
                    rHtml.push('</div>');

                    if (rivers.length > 0) {
                        var curRiv = rivers[this.selectedRiverIdx] || rivers[0];
                        var curW = curRiv ? (curRiv.width || 38) : 38;
                        var rivPts = curRiv ? this.parseRiverPathPoints(curRiv.path) : [];
                        var canDelPt = (this.selectedRiverPtIdx !== null && this.selectedRiverPtIdx % 3 === 0 && rivPts.length > 4);

                        rHtml.push('<div style="display:flex; gap:3px; margin-bottom:0.4rem; overflow-x:auto;">');
                        for (var ri = 0; ri < rivers.length; ri++) {
                            var isActiveRiv = (ri === this.selectedRiverIdx);
                            var bName = rivers[ri].isTributary ? tEd("map_editor.river_tab_tributary", { num: ri + 1 }, "Přítok " + (ri + 1)) : tEd("map_editor.river_tab_river", { num: ri + 1 }, "Řeka " + (ri + 1));
                            rHtml.push('<button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 6px;' + (isActiveRiv ? ' border-color:#facc15; background:rgba(250,204,21,0.18); color:#fef08a;' : '') + '" onclick="PRS_MapEditor.selectRiverIndex(' + ri + ')">' + bName + '</button>');
                        }
                        rHtml.push('</div>');

                        rHtml.push('<div id="me-insp-river-pt-info" style="font-size:0.68rem; color:#bae6fd; background:rgba(14,165,233,0.12); border-radius:5px; padding:3px 6px; margin-bottom:0.35rem;">' + tEd("map_editor.river_hint_drag", null, "Táhni modré kotvy (s Alt bez táhel) nebo žluté úchyty.") + '</div>');
                        rHtml.push('<div style="margin-bottom:0.35rem;">');
                        rHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:2px;"><span>' + tEd("map_editor.river_width_label", null, "Šířka vybraného toku:") + '</span><strong id="me-insp-river-w-val" style="color:#38bdf8;">' + curW + ' px</strong></label>');
                        rHtml.push('  <input type="range" min="10" max="64" step="2" value="' + Math.max(10, Math.min(64, curW)) + '" style="width:100%;" oninput="PRS_MapEditor.applyRiverWidthLive(this.value)" onchange="PRS_MapEditor.applyRiverWidth(this.value)" />');
                        rHtml.push('  <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-top:3px;">');
                        rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.64rem; padding:2px 3px;" onclick="PRS_MapEditor.applyRiverWidth(16)">' + tEd("map_editor.river_size_stream", null, "Potok 16") + '</button>');
                        rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.64rem; padding:2px 3px;" onclick="PRS_MapEditor.applyRiverWidth(34)">' + tEd("map_editor.river_size_river", null, "Řeka 34") + '</button>');
                        rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.64rem; padding:2px 3px;" onclick="PRS_MapEditor.applyRiverWidth(54)">' + tEd("map_editor.river_size_major", null, "Veletok 54") + '</button>');
                        rHtml.push('  </div>');
                        rHtml.push('</div>');

                        rHtml.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; margin-bottom:0.35rem;">');
                        rHtml.push('  <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.addRiverMeander()">' + tEd("map_editor.river_btn_meander", null, "〰️ Přidat zákrut") + '</button>');
                        rHtml.push('  <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.addRiverTributary()">' + tEd("map_editor.river_btn_tributary", null, "➕ Přidat přítok") + '</button>');
                        rHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.toggleSelectedRiverTributary()">' + (curRiv.isTributary ? tEd("map_editor.river_btn_make_main", null, "🌊 Hlavní tok") : tEd("map_editor.river_btn_make_trib", null, "↪️ Přítok")) + '</button>');
                        rHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.flipSelectedRiverHorizontally()">' + tEd("map_editor.river_btn_flip", null, "↔️ Překlopit X") + '</button>');
                        rHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.deleteSelectedRiverAnchor()"' + (canDelPt ? '' : ' disabled') + '>' + tEd("map_editor.river_btn_del_pt", null, "➖ Odebrat bod") + '</button>');
                        rHtml.push('  <button type="button" class="btn-icon-danger" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.deleteSelectedRiver()">' + tEd("map_editor.river_btn_delete", null, "🗑️ Smazat větev") + '</button>');
                        rHtml.push('</div>');
                    } else {
                        rHtml.push('<button type="button" class="btn-secondary" style="width:100%; font-size:0.72rem; padding:0.3rem; margin-bottom:0.35rem;" onclick="PRS_MapEditor.addRiverTributary()">' + tEd("map_editor.river_btn_create_bed", null, "➕ Založit nové koryto řeky") + '</button>');
                    }
                    rHtml.push('<button type="button" class="btn-zoom" style="width:100%; font-size:0.72rem; padding:0.28rem 0.4rem; border-color:#22c55e; color:#bbf7d0;" onclick="PRS_MapEditor.regenerateDecorAndBridges()">' + tEd("map_editor.river_btn_recalc", null, "🌿 Přepočítat mosty & dekorace") + '</button>');
                    bodyRiver.innerHTML = rHtml.join("\n");
                }
                return;
            }

            // 3B. Režim Štětce biomů
            if (mode === "biome") {
                box.style.display = "block";
                hideAll();
                if (bodyBiome) bodyBiome.style.display = "block";
                if (titleEl) titleEl.textContent = tEd("map_editor.biome_inspector_title", null, "🎨 Štětec biomů");
                var bZones = (this.board && Array.isArray(this.board.biomeZones)) ? this.board.biomeZones : [];
                if (idEl) idEl.textContent = tEd("map_editor.biome_zones_count", { count: bZones.length }, bZones.length + " zón");
                if (bodyBiome) {
                    var bBtns = [
                        { key: "forest",   label: tEd("map_editor.biome_forest", null, "🌲 Les"),     col: "#4ade80" },
                        { key: "meadow",   label: tEd("map_editor.biome_meadow", null, "🌿 Louka"),   col: "#bef264" },
                        { key: "farmland", label: tEd("map_editor.biome_farmland", null, "🌾 Pole"),  col: "#fde047" },
                        { key: "rocky",    label: tEd("map_editor.biome_rocky", null, "⛰️ Skály"),   col: "#d6d3d1" },
                        { key: "wetland",  label: tEd("map_editor.biome_wetland", null, "🌊 Mokřad"),col: "#7dd3fc" },
                        { key: "erase",    label: tEd("map_editor.biome_erase", null, "🧽 Guma"),    col: "#fca5a5" }
                    ];
                    var bHtml = [];
                    bHtml.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:0.45rem;">');
                    for (var bi = 0; bi < bBtns.length; bi++) {
                        var bb = bBtns[bi];
                        var activeB = (this.activeBiomeBrush === bb.key);
                        bHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.71rem; padding:0.3rem 0.4rem; border-color:' + (activeB ? bb.col : 'rgba(255,255,255,0.18)') + '; color:' + bb.col + ';' + (activeB ? ' background:rgba(255,255,255,0.14); font-weight:bold;' : '') + '" onclick="PRS_MapEditor.setBiomeBrush(\'' + bb.key + '\')">' + bb.label + '</button>');
                    }
                    bHtml.push('</div>');
                    var curR = this.biomeBrushRadius || 110;
                    bHtml.push('<div style="margin-bottom:0.45rem;">');
                    bHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:2px;"><span>' + tEd("map_editor.biome_brush_size", null, "Velikost štětce:") + '</span><strong id="me-insp-biome-r-val" style="color:#fde047;">' + curR + ' px</strong></label>');
                    bHtml.push('  <input type="range" min="50" max="220" step="10" value="' + Math.max(50, Math.min(220, curR)) + '" style="width:100%;" oninput="PRS_MapEditor.setBiomeBrushRadius(this.value)" />');
                    bHtml.push('</div>');
                    bHtml.push('<button type="button" class="btn-icon-danger" style="width:100%; font-size:0.71rem; padding:0.28rem 0.4rem; margin-bottom:0.35rem;" onclick="PRS_MapEditor.clearCustomBiomeZones()"' + (bZones.length === 0 ? ' disabled' : '') + '>' + tEd("map_editor.biome_btn_clear", null, "🧹 Vymazat vlastní biomy") + '</button>');
                    bHtml.push('<button type="button" class="btn-zoom" style="width:100%; font-size:0.72rem; padding:0.28rem 0.4rem; border-color:#22c55e; color:#bbf7d0;" onclick="PRS_MapEditor.regenerateDecorAndBridges()">' + tEd("map_editor.biome_btn_recalc", null, "🌿 Přepočítat dekorace podle biomů") + '</button>');
                    bodyBiome.innerHTML = bHtml.join("\n");
                }
                return;
            }

            // 4. Režim Políčka
            if (this.selectedNodeId === null) {
                box.style.display = "none";
                return;
            }

            var node = this.getNodeById(this.selectedNodeId);
            if (!node) {
                box.style.display = "none";
                return;
            }

            box.style.display = "block";
            hideAll();
            if (bodyNode) bodyNode.style.display = "block";
            if (titleEl) titleEl.textContent = tEd("map_editor.tile_inspector_title", null, "⚙️ Inspektor políčka");

            var coordsEl = document.getElementById("me-insp-coords");
            var typeSel = document.getElementById("me-insp-type");
            var nameInp = document.getElementById("me-insp-name");
            var priceInp = document.getElementById("me-insp-price");
            var rentInp = document.getElementById("me-insp-rent");
            var tierWrap = document.getElementById("me-insp-tier-wrap");
            var tierSel = document.getElementById("me-insp-tier");

            if (idEl) idEl.textContent = "#" + node.id;
            if (coordsEl) coordsEl.textContent = "[" + Math.round(node.x) + ", " + Math.round(node.y) + "]";

            if (nameInp) nameInp.value = node.name || "";
            if (priceInp) priceInp.value = node.price !== undefined ? node.price : 0;
            if (rentInp) rentInp.value = node.rent !== undefined ? node.rent : 0;

            if (typeSel) {
                var curVal = this.getSelectValueForNode(node);
                typeSel.value = curVal;
            }

            // Úroveň / Stupeň (zvířata nebo mistři)
            var isAnimal = (node.type === "animal" || node.type === "horse" || node.type === "dog" || node.type === "falcon");
            var isMaster = (node.type === "master");
            if (tierWrap && tierSel) {
                if (isAnimal) {
                    tierWrap.style.display = "block";
                    tierSel.innerHTML = "";
                    for (var a = 1; a <= 14; a++) {
                        tierSel.innerHTML += '<option value="' + a + '"' + ((node.animalLevel || 1) === a ? ' selected' : '') + '>' + tEd("map_editor.tile_level_opt", { level: a }, "Úroveň " + a) + '</option>';
                    }
                } else if (isMaster) {
                    tierWrap.style.display = "block";
                    tierSel.innerHTML = '<option value="1"' + ((node.masterTier || 1) === 1 ? ' selected' : '') + '>' + tEd("map_editor.tile_master_tier1", null, "Stupeň I (Základní +1)") + '</option>' +
                                        '<option value="2"' + ((node.masterTier || 1) === 2 ? ' selected' : '') + '>' + tEd("map_editor.tile_master_tier2", null, "Stupeň II (Pokročilý +2)") + '</option>' +
                                        '<option value="3"' + ((node.masterTier || 1) === 3 ? ' selected' : '') + '>' + tEd("map_editor.tile_master_tier3", null, "Stupeň III (Pečetě & Záštita)") + '</option>' +
                                        '<option value="4"' + ((node.masterTier || 1) === 4 ? ' selected' : '') + '>' + tEd("map_editor.tile_master_tier4", null, "Stupeň IV (Duely o 1.5 💖)") + '</option>';
                } else {
                    tierWrap.style.display = "none";
                }
            }

            // Napojené cesty a priority rozcestí uzlu
            var edgesWrap = document.getElementById("me-insp-node-edges");
            if (edgesWrap && this.board && Array.isArray(this.board.nodes)) {
                var eHtml = [];
                var outList = Array.isArray(node.next) ? node.next : [];
                var inList = [];
                for (var ni = 0; ni < this.board.nodes.length; ni++) {
                    var candidate = this.board.nodes[ni];
                    if (candidate.id !== node.id && Array.isArray(candidate.next) && candidate.next.indexOf(node.id) !== -1) {
                        inList.push(candidate);
                    }
                }

                eHtml.push('<div style="border-top:1px solid rgba(212,175,55,0.2); padding-top:0.35rem; margin-bottom:0.4rem;">');
                eHtml.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">');
                eHtml.push('    <span style="font-size:0.7rem; color:#fde68a; font-weight:bold;">' + tEd("map_editor.tile_paths_title", null, "🛤️ Cesty a směry uzlu") + '</span>');
                eHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.65rem; padding:1px 5px; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.autoOrientSideBranches()" title="' + tEd("map_editor.tile_paths_align_title", null, "Automaticky srovnat boční větve a rozcestí") + '">' + tEd("map_editor.tile_paths_align_btn", null, "🧭 Srovnat") + '</button>');
                eHtml.push('  </div>');

                if (outList.length === 0) {
                    eHtml.push('  <div style="font-size:0.68rem; color:#fca5a5; background:rgba(153,27,27,0.35); border:1px solid rgba(248,113,113,0.5); border-radius:5px; padding:3px 6px; margin-bottom:4px;">' + tEd("map_editor.tile_dead_end_warn", null, "⚠️ Slepá cesta — pole nemá žádný výstupní směr!") + '</div>');
                } else {
                    var isNodeJunc = outList.length >= 2;
                    for (var oi = 0; oi < outList.length; oi++) {
                        var tgt = this.getNodeById(outList[oi]);
                        if (!tgt) continue;
                        var jBadge = isNodeJunc
                            ? (oi === 0 ? '<span style="background:#0284c7;color:#fff;padding:0 4px;border-radius:3px;font-size:0.64rem;margin-right:3px;">1–3</span>' : (oi === 1 ? '<span style="background:#d97706;color:#fff;padding:0 4px;border-radius:3px;font-size:0.64rem;margin-right:3px;">4–6</span>' : ''))
                            : '';
                        eHtml.push('  <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; font-size:0.68rem; color:#e2e8f0; background:rgba(0,0,0,0.38); padding:2px 5px; border-radius:4px; margin-bottom:3px;">');
                        eHtml.push('    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + jBadge + '➔ #' + tgt.id + ' ' + this.escapeXml(tgt.name || tgt.code || "") + '</span>');
                        eHtml.push('    <span style="display:flex; gap:3px; flex-shrink:0;">');
                        eHtml.push('      <button type="button" class="btn-zoom" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.reverseEdgeDirection(' + node.id + ', ' + tgt.id + ')" title="' + tEd("map_editor.tile_reverse_title", null, "Obrátit směr") + '">🔄</button>');
                        eHtml.push('      <button type="button" class="btn-icon-danger" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.removeEdge(' + node.id + ', ' + tgt.id + ')" title="' + tEd("map_editor.tile_remove_title", null, "Odebrat cestu") + '">🗑️</button>');
                        eHtml.push('    </span>');
                        eHtml.push('  </div>');
                    }
                    if (isNodeJunc) {
                        eHtml.push('  <button type="button" class="btn-secondary" style="width:100%; font-size:0.69rem; padding:0.22rem 0.4rem; margin-bottom:4px; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.swapJunctionBranchPriority(' + node.id + ')">' + tEd("map_editor.tile_swap_priority_btn", null, "🔀 Prohodit 1–3 ⇄ 4–6") + '</button>');
                    }
                }

                for (var ii = 0; ii < inList.length; ii++) {
                    var inc = inList[ii];
                    eHtml.push('  <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; font-size:0.67rem; color:#94a3b8; background:rgba(0,0,0,0.25); padding:2px 5px; border-radius:4px; margin-bottom:3px;">');
                    eHtml.push('    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + tEd("map_editor.tile_incoming_from", null, "⬅️ z #") + inc.id + ' ' + this.escapeXml(inc.name || inc.code || "") + '</span>');
                    eHtml.push('    <span style="display:flex; gap:3px; flex-shrink:0;">');
                    eHtml.push('      <button type="button" class="btn-zoom" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.reverseEdgeDirection(' + inc.id + ', ' + node.id + ')" title="' + tEd("map_editor.tile_reverse_title", null, "Obrátit směr") + '">🔄</button>');
                    eHtml.push('      <button type="button" class="btn-icon-danger" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.removeEdge(' + inc.id + ', ' + node.id + ')" title="' + tEd("map_editor.tile_remove_title", null, "Odebrat cestu") + '">🗑️</button>');
                    eHtml.push('    </span>');
                    eHtml.push('  </div>');
                }

                eHtml.push('  <button type="button" class="btn-zoom" style="width:100%; font-size:0.69rem; padding:0.22rem 0.4rem;" onclick="PRS_MapEditor.setTool(\'link\'); PRS_MapEditor.linkSourceNodeId = ' + node.id + '; PRS_MapEditor.updateStatusHelp(); PRS_MapEditor.renderCanvas();">' + tEd("map_editor.tile_link_toggle_btn", { id: node.id }, "🔗 Přidat / odebrat cestu z #" + node.id) + '</button>');
                eHtml.push('</div>');
                edgesWrap.innerHTML = eHtml.join("\n");
            }
        },

        updateInspectorCoordinates: function (x, y) {
            var coordsEl = document.getElementById("me-insp-coords");
            if (coordsEl) coordsEl.textContent = "[" + x + ", " + y + "]";
        },

        getNextAvailableAnimalLevel: function (animalSubtype) {
            var used = {};
            if (this.board && this.board.nodes) {
                for (var i = 0; i < this.board.nodes.length; i++) {
                    var n = this.board.nodes[i];
                    var sub = (n.subtype || "").toLowerCase();
                    if (sub === "falcon") sub = "falcon";
                    else if (sub === "dog") sub = "dog";
                    else if (sub === "horse") sub = "horse";
                    if (sub === animalSubtype) {
                        var lvl = n.setId || n.animalLevel;
                        if (!lvl && n.code && n.code.match(/\d+/)) lvl = parseInt(n.code.match(/\d+/)[0], 10);
                        if (lvl) used[lvl] = true;
                    }
                }
            }
            for (var l = 1; l <= 14; l++) {
                if (!used[l]) return l;
            }
            return 1;
        },

        getSelectValueForNode: function (node) {
            var t = (node.type || "").toLowerCase();
            var sub = (node.subtype || "").toUpperCase();
            var code = (node.code || "").toUpperCase();
            var name = (node.name || "").toLowerCase();

            if (t === "start" || code === "START") return "start";
            if (t === "castle" || (code.indexOf("H") === 0 && !isNaN(parseInt(code.slice(1))))) return "castle";
            if (t === "town" || (code.indexOf("M") === 0 && !isNaN(parseInt(code.slice(1))))) return "town";
            if (t === "village" || (code.indexOf("V") === 0 && !isNaN(parseInt(code.slice(1))))) return "village";
            if (t === "festival" || code.indexOf("SLAV") !== -1) return "festival";
            if (t === "quest" || code.indexOf("U") === 0) {
                if (sub === "U3" || code.indexOf("U3") !== -1) return "dragon";
                if (sub === "U2" || code.indexOf("U2") !== -1) return "monster_u2";
                return "monster_u1";
            }
            if (t === "master" || code.indexOf("MB") === 0 || code.indexOf("MJ") === 0 || code.indexOf("MT") === 0 || code.indexOf("MCH") === 0 || code.indexOf("VM") === 0) {
                if (sub === "MC" || sub === "MB" || code.indexOf("MC") === 0 || code.indexOf("MB") === 0) return "master_combat";
                if (sub === "MJ" || code.indexOf("MJ") === 0) return "master_ride";
                if (sub === "MT" || code.indexOf("MT") === 0) return "master_dance";
                if (sub === "MCH" || code.indexOf("MCH") === 0) return "master_charisma";
                return "master_grand";
            }
            // Zvířata: Sokol, Pes, Kůň
            if (t === "falcon" || sub === "FALCON" || sub === "SOKOL" || sub === "SOK" || (code.indexOf("S") === 0 && !isNaN(parseInt(code.slice(1)))) || name.indexOf("sokol") !== -1 || name.indexOf("pták") !== -1 || name.indexOf("poštolka") !== -1) return "animal_falcon";
            if (t === "dog" || sub === "DOG" || sub === "PES" || sub === "PSOV" || (code.indexOf("P") === 0 && !isNaN(parseInt(code.slice(1)))) || name.indexOf("pes") !== -1 || name.indexOf("ohař") !== -1 || name.indexOf("bígl") !== -1 || name.indexOf("chrt") !== -1) return "animal_dog";
            if (t === "horse" || sub === "HORSE" || sub === "KUN" || sub === "STAJE" || (code.indexOf("K") === 0 && !isNaN(parseInt(code.slice(1)))) || name.indexOf("kůň") !== -1 || name.indexOf("hřebec") !== -1 || name.indexOf("oř") !== -1) return "animal_horse";

            if (t === "jester" || code.indexOf("KE") === 0) return "jester";
            if (t === "tax" || code.indexOf("VD") === 0) return "tax";
            if (t === "prison" || code.indexOf("SATL") === 0) return "prison";
            if (t === "hospital" || code.indexOf("HOSP") === 0) return "hospital";
            if (t === "tavern" || code.indexOf("KRCMA") === 0) return "tavern";
            if (t === "merchant" || t === "trade" || code.indexOf("OBCHOD") === 0) return "trade";
            if (t === "building" || t === "craft" || code.indexOf("KOV") === 0) return "craft";
            if (t === "chance" || code.indexOf("N") === 0) return "chance";
            if (t === "bonus" || code.indexOf("B") === 0) return "bonus";

            return "village";
        },

        // Uložení změny typu pole z dropdownu
        applyNodeTypeChange: function (selectVal) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;

            this.pushUndo();
            var catalog = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.ANIMAL_SETS_CATALOG) || [];

            if (selectVal === "start") {
                // Zajistit unikátnost pole START - pouze 1 START na celé desce
                for (var si = 0; si < this.board.nodes.length; si++) {
                    var other = this.board.nodes[si];
                    if (other.id !== node.id && (String(other.type).toUpperCase() === "START" || other.code === "START")) {
                        other.type = "VILLAGE";
                        other.subtype = null;
                        other.code = "V" + other.id;
                        other.estateId = other.code;
                        other.name = "Vesnice #" + other.id;
                        other.icon = "🏘️";
                        other.villageLevel = 1;
                        other.price = 1400;
                        other.rent = 350;
                    }
                }
                node.type = "START";
                node.subtype = null;
                node.code = "START";
                node.icon = "🚩";
                node.name = "Královský START (+3 000 zl.)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "castle") {
                node.type = "CASTLE";
                node.subtype = null;
                node.code = "H" + node.id;
                node.estateId = node.code;
                node.icon = "🏯";
                node.price = 4500;
                node.rent = 1200;
                node.name = "Hrad #" + node.id;
            } else if (selectVal === "town") {
                node.type = "TOWN";
                node.subtype = null;
                node.code = "M" + node.id;
                node.estateId = node.code;
                node.icon = "🏙️";
                node.price = 2800;
                node.rent = 750;
                node.name = "Město #" + node.id;
            } else if (selectVal === "village") {
                node.type = "VILLAGE";
                node.subtype = null;
                node.code = "V" + node.id;
                node.estateId = node.code;
                node.icon = "🏘️";
                node.villageLevel = 1;
                node.price = 1400;
                node.rent = 350;
                node.name = "Vesnice #" + node.id;
            } else if (selectVal === "festival") {
                node.type = "FESTIVAL";
                node.subtype = "tournament";
                node.code = "SLAV_" + node.id;
                node.icon = "🎪";
                node.name = "Rytířský Turnaj ctností";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "dragon") {
                node.type = "QUEST";
                node.subtype = "U3";
                node.code = "U3_" + node.id;
                node.icon = "🐲";
                node.name = "Dračí sluj (Obávaný drak U3)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "monster_u2") {
                node.type = "QUEST";
                node.subtype = "U2";
                node.code = "U2_" + node.id;
                node.icon = "🐺";
                node.name = "Brloh krvelačných vlků (U2)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "monster_u1") {
                node.type = "QUEST";
                node.subtype = "U1";
                node.code = "U1_" + node.id;
                node.icon = "🐗";
                node.name = "Lesní kanec (U1)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "master_combat") {
                node.type = "MASTER";
                node.subtype = "MB";
                node.skill = "combat";
                node.code = "MB" + node.id;
                node.icon = "⚔️";
                node.masterTier = node.masterTier || 2;
                node.name = "Mistr Boje (MB)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "master_ride") {
                node.type = "MASTER";
                node.subtype = "MJ";
                node.skill = "riding";
                node.code = "MJ" + node.id;
                node.icon = "🏇";
                node.masterTier = node.masterTier || 2;
                node.name = "Mistr Jízdy (MJ)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "master_dance") {
                node.type = "MASTER";
                node.subtype = "MT";
                node.skill = "dance";
                node.code = "MT" + node.id;
                node.icon = "💃";
                node.masterTier = node.masterTier || 2;
                node.name = "Mistr Tance (MT)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "master_charisma") {
                node.type = "MASTER";
                node.subtype = "MCH";
                node.skill = "charisma";
                node.code = "MCH" + node.id;
                node.icon = "👑";
                node.masterTier = node.masterTier || 2;
                node.name = "Mistr Charismatu (MCH)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "master_grand") {
                node.type = "MASTER";
                node.subtype = "VM";
                node.skill = "any";
                node.code = "VM" + node.id;
                node.icon = "🧙‍♂️";
                node.masterTier = node.masterTier || 3;
                node.name = "Královský Velmistr (VM)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "animal_horse") {
                var nextLvlH = this.getNextAvailableAnimalLevel("horse");
                node.type = "ANIMAL";
                node.subtype = "horse";
                node.animalLevel = nextLvlH;
                node.setId = nextLvlH;
                node.code = "K" + nextLvlH;
                node.icon = "🐎";
                var cEntryH = catalog[nextLvlH - 1];
                node.name = (cEntryH && cEntryH.horse) ? cEntryH.horse : ("Kůň " + nextLvlH);
                node.price = 600 * nextLvlH;
                node.rent = 150 * nextLvlH;
            } else if (selectVal === "animal_dog") {
                var nextLvlD = this.getNextAvailableAnimalLevel("dog");
                node.type = "ANIMAL";
                node.subtype = "dog";
                node.animalLevel = nextLvlD;
                node.setId = nextLvlD;
                node.code = "P" + nextLvlD;
                node.icon = "🐕";
                var cEntryD = catalog[nextLvlD - 1];
                node.name = (cEntryD && cEntryD.dog) ? cEntryD.dog : ("Pes " + nextLvlD);
                node.price = 500 * nextLvlD;
                node.rent = 120 * nextLvlD;
            } else if (selectVal === "animal_falcon") {
                var nextLvlF = this.getNextAvailableAnimalLevel("falcon");
                node.type = "ANIMAL";
                node.subtype = "falcon";
                node.animalLevel = nextLvlF;
                node.setId = nextLvlF;
                node.code = "S" + nextLvlF;
                node.icon = "🦅";
                var cEntryF = catalog[nextLvlF - 1];
                node.name = (cEntryF && cEntryF.falcon) ? cEntryF.falcon : ("Sokol " + nextLvlF);
                node.price = 400 * nextLvlF;
                node.rent = 100 * nextLvlF;
            } else if (selectVal === "jester") {
                node.type = "JESTER";
                node.subtype = null;
                node.code = "KE" + node.id;
                node.icon = "🃏";
                node.name = "Královský Šašek";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "tax") {
                node.type = "TAX";
                node.subtype = null;
                node.code = "VD" + node.id;
                node.icon = "💰";
                node.name = "Výběrčí daní (VD)";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "prison") {
                node.type = "PRISON";
                node.subtype = null;
                node.code = "SATL" + node.id;
                node.icon = "⛓️";
                node.name = "Královská Šatlava";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "hospital") {
                node.type = "HOSPITAL";
                node.subtype = null;
                node.code = "HOSP" + node.id;
                node.icon = "🏥";
                node.name = "Královský Lazaret";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "tavern") {
                node.type = "TAVERN";
                node.subtype = null;
                node.code = "KRCMA" + node.id;
                node.icon = "🍺";
                node.name = "Krčma U Černého orla";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "trade") {
                node.type = "MERCHANT";
                node.subtype = null;
                node.code = "OBCHOD" + node.id;
                node.icon = "⚖️";
                node.name = "Kupecký dům & Dobytčí trh";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "craft") {
                node.type = "BUILDING";
                node.subtype = "forge";
                node.code = "KOV" + node.id;
                node.icon = "⚒️";
                node.name = "Rytířská zbrojírna & Kovárna";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "chance") {
                node.type = "CHANCE";
                node.subtype = null;
                node.code = "N" + node.id;
                node.icon = "📜";
                node.name = "Královská náhoda";
                node.price = 0;
                node.rent = 0;
            } else if (selectVal === "bonus") {
                node.type = "BONUS";
                node.subtype = null;
                node.code = "B" + node.id;
                node.icon = "💎";
                node.name = "Zapomenutá truhlice zlata";
                node.price = 0;
                node.rent = 0;
            }

            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show("✨ Pole #" + node.id + " změněno na: " + node.name, "good");
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
        },

        // Uložení změny úrovně / stupně
        applyNodeTierChange: function (newTier) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;
            var val = parseInt(newTier, 10);
            if (isNaN(val)) return;

            this.pushUndo();
            var isAnimal = ((node.type || "").toUpperCase() === "ANIMAL" || node.subtype === "kun" || node.subtype === "pes" || node.subtype === "sokol");
            var catalog = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.ANIMAL_SETS_CATALOG) || [];

            if (isAnimal) {
                node.animalLevel = val;
                node.setId = val;
                var sub = (node.subtype || "horse").toLowerCase();
                if (sub === "falcon") sub = "falcon";
                else if (sub === "dog") sub = "dog";
                else if (sub === "horse") sub = "horse";
                node.subtype = sub;

                var basePrice = (sub === "horse" ? 600 : (sub === "dog" ? 500 : 400));
                node.price = basePrice * val;
                node.rent = Math.round(basePrice * 0.25 * val);

                var prefix = (sub === "falcon" ? "S" : (sub === "dog" ? "P" : "K"));
                node.code = prefix + val;
                node.icon = (sub === "falcon" ? "🦅" : (sub === "dog" ? "🐕" : "🐎"));

                var catEntry = catalog[val - 1];
                if (catEntry && catEntry[sub]) {
                    node.name = catEntry[sub];
                } else {
                    node.name = (sub === "falcon" ? "Sokol " : (sub === "dog" ? "Pes " : "Kůň ")) + val;
                }

                // Kontrola duplicitního čísla sady zvířat
                var dupCount = 0;
                for (var i = 0; i < this.board.nodes.length; i++) {
                    var other = this.board.nodes[i];
                    if (other.id !== node.id && (String(other.type).toUpperCase() === "ANIMAL") && (String(other.subtype).toLowerCase() === sub) && (other.setId === val || other.animalLevel === val)) {
                        dupCount++;
                    }
                }
                if (dupCount > 0 && window.KiDeskyToast) {
                    window.KiDeskyToast.show("⚠️ Upozornění: " + (sub === "falcon" ? "Sokol " : (sub === "dog" ? "Pes " : "Kůň ")) + val + " je na plánu vícekrát!", "warning");
                }
            } else if ((node.type || "").toUpperCase() === "MASTER") {
                node.masterTier = val;
                var mNames = { MB: "Mistr Boje", MJ: "Mistr Jízdy", MT: "Mistr Tance", MCH: "Mistr Charismatu", VM: "Královský Velmistr" };
                var mSub = node.subtype || "MB";
                node.name = (mNames[mSub] || "Mistr") + " Stupeň " + ["I", "II", "III", "IV"][Math.max(0, Math.min(3, val - 1))];
            }

            this.renderCanvas();
            this.updateInspectorUI();
        },

        // Uložení změny názvu pole
        applyNodeNameChange: function (newName) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;
            node.name = newName.trim();

            // Rychlá aktualizace popisku pod uzlem bez ztráty focusu inputu
            var nodeG = document.getElementById("me-node-g-" + node.id);
            if (nodeG) {
                var textEl = nodeG.querySelector("text:last-of-type");
                if (textEl) {
                    var label = node.name || "Pole #" + node.id;
                    if (label.length > 20) label = label.substring(0, 18) + "…";
                    textEl.textContent = label;
                }
            }
        },

        // Uložení změny ceny pole
        applyNodePriceChange: function (newPrice) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;
            var p = parseInt(newPrice, 10);
            if (!isNaN(p)) {
                node.price = Math.max(0, p);
            }
        },

        // Uložení změny nájmu pole
        applyNodeRentChange: function (newRent) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;
            var r = parseInt(newRent, 10);
            if (!isNaN(r)) {
                node.rent = Math.max(0, r);
            }
        },

        closeInspector: function () {
            this.selectedNodeId = null;
            this.selectedEdge = null;
            this.inspectorMode = null;
            this.isDrawingRiver = false;
            this.drawRiverPoints = [];
            if (this.activeTool === "castle" || this.activeTool === "river" || this.activeTool === "biome") {
                this.activeTool = "select";
                this.updateToolButtons();
                this.updateStatusHelp();
                this.updateCursor();
            }
            this.updateInspectorUI();
            this.renderCanvas();
        },

        toggleInspectorCorner: function () {
            return this.toggleInspectorPosition();
        },

        toggleInspectorPosition: function () {
            var p = document.getElementById("me-inspector-panel");
            if (!p) return;
            this._inspCorner = (this._inspCorner || 0) + 1;
            if (this._inspCorner > 3) this._inspCorner = 0;

            p.style.top = "";
            p.style.bottom = "";
            p.style.left = "";
            p.style.right = "";

            if (this._inspCorner === 0) {
                p.style.bottom = "12px";
                p.style.right = "12px";
            } else if (this._inspCorner === 1) {
                p.style.top = "12px";
                p.style.right = "12px";
            } else if (this._inspCorner === 2) {
                p.style.top = "12px";
                p.style.left = "12px";
            } else {
                p.style.bottom = "12px";
                p.style.left = "12px";
            }
        },

        // ====================================================================
        // ULOŽENÍ A SPUŠTĚNÍ HRY S VLASTNÍM PLÁNEM
        // ====================================================================
        refreshBoardDerivedLayers: function (board) {
            if (!board) return;
            board.isCustomWysiwyg = true;
            if (window.PRS_BoardBuilder) {
                if (typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                    window.PRS_BoardBuilder.computeRiverBridges(board);
                }
                if ((!board.decorations || board.decorations.length === 0 || board._decorDirty) && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
                    window.PRS_BoardBuilder.generateBoardDecorations(board, board.seed || 4242);
                    board._decorDirty = false;
                }
            }
        },

        saveToMyTemplates: function () {
            if (!this.board) return;
            var tTpl = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            this.refreshBoardDerivedLayers(this.board);
            this.normalizeBoardForEngine(this.board);
            this.refreshBoardDerivedLayers(this.board);
            var customName = prompt(tTpl("map_editor.modals.prompt_save_template", null, "Zadej název této upravené šablony plánu:"), this.board.name || tTpl("map_editor.modals.default_template_name", null, "Můj ručně upravený plán"));
            if (!customName || !customName.trim()) return;

            this.board.name = customName.trim();
            if (window.PRS_App && typeof window.PRS_App.saveBoardAsTemplate === "function") {
                window.PRS_App.saveBoardAsTemplate(this.board, customName.trim());
                if (window.KiDeskyToast) {
                    window.KiDeskyToast.show(tTpl("map_editor.modals.toast_template_saved", { name: customName.trim() }, "⭐ Šablona „" + customName.trim() + "“ byla uložena do Tvých plánů!"), "good");
                }
            }
        },

        playOnThisBoard: function () {
            if (!this.board) return;
            try {
                localStorage.removeItem("prs_active_online_room");
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, "", window.location.pathname);
                }
            } catch (e) { }
            this.refreshBoardDerivedLayers(this.board);
            this.normalizeBoardForEngine(this.board);
            this.refreshBoardDerivedLayers(this.board);
            if (window.PRS_App) {
                var cloned = JSON.parse(JSON.stringify(this.board));
                delete cloned._decorDirty;
                this.normalizeBoardForEngine(cloned);
                window.PRS_App.mapStudioBoard = cloned;
                window.PRS_App._currentMapStudioBoard = cloned;
                window.PRS_App._customProceduralBoard = cloned;
                window.PRS_App.customBoardRecipe = cloned.recipe || { nodeCount: cloned.nodes.length, customName: cloned.name };

                // Zamezení nekonečné rekurze a přímé spuštění hry
                window.PRS_App._mapStudioActiveTab = "recipe";
                window.PRS_App.applyMapStudioBoardAndStart(true);
            }
        },

        normalizeBoardForEngine: function (board) {
            if (!board || !Array.isArray(board.nodes)) return board;

            var nodes = board.nodes;
            var catalog = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.ANIMAL_SETS_CATALOG) || [];

            // 1. Zajištění existence právě jednoho pole START (ochrana proti duplicitnímu STARTu)
            var startFound = false;
            for (var s = 0; s < nodes.length; s++) {
                var sn = nodes[s];
                var isSt = (String(sn.type).toUpperCase() === "START" || sn.code === "START");
                if (isSt) {
                    if (!startFound) {
                        startFound = true;
                        sn.type = "START";
                        sn.code = "START";
                        sn.subtype = null;
                        sn.icon = "🚩";
                        if (!sn.name) sn.name = "Královský START (+3 000 zl.)";
                    } else {
                        // Duplicitní START přeměníme na vesnici
                        sn.type = "VILLAGE";
                        sn.code = "V" + sn.id;
                        sn.estateId = sn.code;
                        sn.subtype = null;
                        sn.icon = "🏘️";
                        sn.name = "Vesnice #" + sn.id;
                        sn.price = 1400;
                        sn.rent = 350;
                        sn.villageLevel = 1;
                    }
                }
            }
            if (!startFound && nodes.length > 0) {
                // Pokud žádný START nebyl nalezen, uzel #0 (nebo první uzel) se stává STARTem
                var targetStart = nodes[0];
                for (var z = 0; z < nodes.length; z++) {
                    if (nodes[z].id === 0) { targetStart = nodes[z]; break; }
                }
                targetStart.type = "START";
                targetStart.code = "START";
                targetStart.subtype = null;
                targetStart.icon = "🚩";
                targetStart.name = "Královský START (+3 000 zl.)";
            }

            // 2. Normalizace všech uzlů pro bezchybný chod enginu a SVG rendereru
            for (var i = 0; i < nodes.length; i++) {
                var nd = nodes[i];

                // Typ vždy velkými písmeny pro kompatibilitu s enginem
                var rawType = String(nd.type || "VILLAGE").toUpperCase();
                nd.type = rawType;

                // Zvířata: Sokol, Kůň, Pes
                var subLow = String(nd.subtype || "").toLowerCase();
                var isAnimal = (rawType === "ANIMAL" || subLow === "horse" || subLow === "dog" || subLow === "falcon" || subLow === "kun" || subLow === "pes" || subLow === "sokol" || subLow === "horse" || subLow === "dog" || subLow === "falcon" || (nd.code && (nd.code.indexOf("K") === 0 || nd.code.indexOf("S") === 0 || nd.code.indexOf("P") === 0) && !isNaN(parseInt(nd.code.slice(1)))));
                if (isAnimal) {
                    nd.type = "ANIMAL";
                    var sub = subLow;
                    if (sub === "falcon") sub = "falcon";
                    else if (sub === "dog") sub = "dog";
                    else if (sub === "horse") sub = "horse";

                    // Pokud chybí subtype, odvodíme z kódu nebo názvu
                    if (!sub || (sub !== "falcon" && sub !== "dog" && sub !== "horse")) {
                        var cUpper = String(nd.code || "").toUpperCase();
                        var nLower = String(nd.name || "").toLowerCase();
                        if (cUpper.indexOf("S") === 0 || nLower.indexOf("sokol") !== -1 || nLower.indexOf("pták") !== -1 || nLower.indexOf("poštolka") !== -1) sub = "falcon";
                        else if (cUpper.indexOf("P") === 0 || nLower.indexOf("pes") !== -1 || nLower.indexOf("ohař") !== -1 || nLower.indexOf("bígl") !== -1 || nLower.indexOf("chrt") !== -1) sub = "dog";
                        else sub = "horse";
                    }
                    nd.subtype = sub;

                    var lvl = nd.setId || nd.animalLevel || 1;
                    if (nd.code && nd.code.match(/\d+/)) {
                        lvl = parseInt(nd.code.match(/\d+/)[0], 10) || lvl;
                    }
                    lvl = Math.max(1, Math.min(14, lvl));
                    nd.animalLevel = lvl;
                    nd.setId = lvl;

                    var pfx = (sub === "falcon" ? "S" : (sub === "dog" ? "P" : "K"));
                    nd.code = pfx + lvl;
                    nd.icon = (sub === "falcon" ? "🦅" : (sub === "dog" ? "🐕" : "🐎"));

                    var catEntry = catalog[lvl - 1];
                    if (!nd.name || nd.name.indexOf("#") !== -1 || nd.name.indexOf("Zvíře") !== -1) {
                        nd.name = (catEntry && catEntry[sub]) ? catEntry[sub] : ((sub === "falcon" ? "Sokol " : (sub === "dog" ? "Pes " : "Kůň ")) + lvl);
                    }
                    if (!nd.price) nd.price = (sub === "falcon" ? 400 : (sub === "dog" ? 500 : 600)) * lvl;
                    if (!nd.rent) nd.rent = (sub === "falcon" ? 100 : (sub === "dog" ? 120 : 150)) * lvl;
                }
                // Sídla: Vesnice, Město, Hrad
                else if (rawType === "VILLAGE") {
                    if (!nd.code) nd.code = "V" + nd.id;
                    if (!nd.estateId) nd.estateId = nd.code;
                    if (!nd.icon) nd.icon = "🏘️";
                    if (!nd.villageLevel) nd.villageLevel = 1;
                    if (!nd.price) nd.price = 1400;
                    if (!nd.rent) nd.rent = 350;
                }
                else if (rawType === "TOWN") {
                    if (!nd.code) nd.code = "M" + nd.id;
                    if (!nd.estateId) nd.estateId = nd.code;
                    if (!nd.icon) nd.icon = "🏙️";
                    if (!nd.price) nd.price = 2800;
                    if (!nd.rent) nd.rent = 750;
                }
                else if (rawType === "CASTLE") {
                    if (!nd.code) nd.code = "H" + nd.id;
                    if (!nd.estateId) nd.estateId = nd.code;
                    if (!nd.icon) nd.icon = "🏯";
                    if (!nd.price) nd.price = 4500;
                    if (!nd.rent) nd.rent = 1200;
                }
                // Výpravy & Netvoři
                else if (rawType === "QUEST") {
                    var qSub = String(nd.subtype || "U1").toUpperCase();
                    nd.subtype = qSub;
                    if (!nd.code) nd.code = qSub + "_" + nd.id;
                    if (!nd.icon) nd.icon = (qSub === "U3" ? "🐲" : (qSub === "U2" ? "🐺" : "🐗"));
                }
                // Mistři ctností
                else if (rawType === "MASTER") {
                    var mSub = String(nd.subtype || "MB").toUpperCase();
                    nd.subtype = mSub;
                    if (!nd.code) nd.code = mSub + nd.id;
                    if (!nd.skill) {
                        nd.skill = (mSub === "MB" ? "boj" : (mSub === "MJ" ? "jizda" : (mSub === "MT" ? "tanec" : (mSub === "MCH" ? "charisma" : "any"))));
                    }
                    if (!nd.icon) nd.icon = (mSub === "MB" ? "⚔️" : (mSub === "MJ" ? "🏇" : (mSub === "MT" ? "💃" : (mSub === "MCH" ? "👑" : "🧙‍♂️"))));
                    if (!nd.masterTier) nd.masterTier = 1;
                }
                // Slavnost
                else if (rawType === "FESTIVAL") {
                    if (!nd.subtype) nd.subtype = "tournament";
                    if (!nd.code) nd.code = "SLAV_" + nd.id;
                    if (!nd.icon) nd.icon = "🎪";
                }
                // Ostatní systémová pole
                else {
                    if (!nd.code) nd.code = rawType.substring(0, 3) + nd.id;
                    if (!nd.icon) {
                        var vCfg = this.getNodeVisualConfig(nd);
                        nd.icon = vCfg.icon || "⚪";
                    }
                }
            }

            board.isCustomWysiwyg = true;
            this.syncNodeBranches(board, !board._branchesSynced);
            board._branchesSynced = true;
            if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks === "function") {
                window.PRS_BoardBuilder.sanitizeAndAnchorLandmarks(board);
            }

            return board;
        },

        getNodeById: function (id) {
            if (!this.board || !this.board.nodes) return null;
            for (var i = 0; i < this.board.nodes.length; i++) {
                if (this.board.nodes[i].id === id) return this.board.nodes[i];
            }
            return null;
        },

        escapeXml: function (str) {
            if (!str) return "";
            return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        },

        // ====================================================================
        // VYKRESLENÍ KOSTRY UI EDITORU
        // ====================================================================
        renderEditorUI: function () {
            var container = document.getElementById("ms-editor-view");
            if (!container) return;
            var tEd = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };

            var html = [
                '<div style="display:flex; flex-direction:column; width:100%; height:100%; gap:0.5rem; min-height:0;">',
                '  <!-- HORNÍ LIŠTA NÁSTROJŮ -->',
                '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; background:rgba(0,0,0,0.5); padding:0.45rem 0.75rem; border-radius:8px; border:1px solid rgba(212,175,55,0.25);">',
                '    <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">',
                '      <span style="font-size:0.75rem; color:#fde68a; font-weight:bold; margin-right:0.25rem;">' + tEd("map_editor.tools.label", "Nástroje:") + '</span>',
                '      <button type="button" id="me-tool-select" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'select\')" title="' + tEd("map_editor.tools.select_title", "Vybrat políčko a tažením přesouvat") + '">' + tEd("map_editor.tools.select", "👆 Inspektor & Přesun") + '</button>',
                '      <button type="button" id="me-tool-add" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'add\')" title="' + tEd("map_editor.tools.add_title", "Kliknutím kamkoliv do mapy přidáš nové políčko") + '">' + tEd("map_editor.tools.add", "➕ Přidat pole") + '</button>',
                '      <button type="button" id="me-tool-swap" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'swap\')" title="' + tEd("map_editor.tools.swap_title", "Vzájemné prohození obsahu dvou polí") + '">' + tEd("map_editor.tools.swap", "🔄 Prohodit 2 pole") + '</button>',
                '      <button type="button" id="me-tool-link" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'link\')" title="' + tEd("map_editor.tools.link_title", "Vytvořit / odebrat cestu mezi dvěma poli nebo upravit směry") + '">' + tEd("map_editor.tools.link", "🔗 Cesty & Směry") + '</button>',
                                '      <button type="button" id="me-tool-river" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'river\')" title="' + tEd("map_editor.tools.river_title", "Upravit tok řeky, meandry, přítoky a mosty") + '">' + tEd("map_editor.tools.river", "🌊 Řeka") + '</button>',
                '      <button type="button" id="me-tool-biome" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'biome\')" title="' + tEd("map_editor.tools.biome_title", "Malovat zóny biomů štětcem pro terén a dekorace") + '">' + tEd("map_editor.tools.biome", "🎨 Biomy") + '</button>',
                '      <button type="button" id="me-tool-castle" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'castle\')" title="' + tEd("map_editor.tools.castle_title", "Přemístit Hlavní hrad a zvolit jeho vzhled") + '">' + tEd("map_editor.tools.castle", "🏰 Hlavní hrad") + '</button>',
                '      <button type="button" id="me-btn-route-shape" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.openRouteShapeModal()" title="' + tEd("map_editor.tools.route_shape_title", "Procedurálně přegenerovat trasu podle 7 archetypů (s historií Undo)") + '">' + tEd("map_editor.tools.route_shape", "🧭 Tvar trasy") + '</button>',
                '      <button type="button" id="me-tool-pan" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'pan\')" title="' + tEd("map_editor.tools.pan_title", "Posouvat celou mapu (tažením myši / prstem)") + '">' + tEd("map_editor.tools.pan", "🧭 Posun mapy") + '</button>',
                '      <button type="button" id="me-btn-undo" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#64748b;" onclick="PRS_MapEditor.undo()" title="' + tEd("map_editor.tools.undo_title", "Vrátit poslední změnu zpět (Ctrl+Z)") + '" disabled>' + tEd("map_editor.tools.undo", "↩️ Zpět") + '</button>',
                '    </div>',
                '    <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">',
                '      <!-- ZOOM OVLÁDÁNÍ -->',
                '      <div style="display:flex; align-items:center; gap:2px; background:rgba(0,0,0,0.55); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:2px 4px;">',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(0.82)" title="' + tEd("map_editor.tools.zoom_out", "Oddálit (−)") + '">−</button>',
                '        <span id="me-zoom-label" style="font-family:monospace; font-size:0.75rem; color:#fef08a; min-width:44px; text-align:center; cursor:pointer;" onclick="PRS_MapEditor.resetZoom()" title="' + tEd("map_editor.tools.zoom_reset", "Resetovat na 100%") + '">100%</span>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(1.22)" title="' + tEd("map_editor.tools.zoom_in", "Přiblížit (+)") + '">+</button>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.72rem;" onclick="PRS_MapEditor.fitToScreen()" title="' + tEd("map_editor.tools.fit_title", "Resetovat pohled na střed") + '">' + tEd("map_editor.tools.fit", "🎯 Celá") + '</button>',
                '      </div>',
                '      <button type="button" class="btn-secondary" style="font-size:0.76rem; padding:0.25rem 0.75rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.saveToMyTemplates()">' + tEd("map_editor.tools.save_template", "⭐ Uložit šablonu") + '</button>',
                '      <button type="button" class="btn-gold-lg" style="font-size:0.76rem; padding:0.25rem 0.85rem;" onclick="PRS_MapEditor.playOnThisBoard()">' + tEd("map_editor.tools.play_board", "⚔️ Hrát upravenou mapu →") + '</button>',
                '    </div>',
                '  </div>',
                '',
                '  <!-- STAVOVÁ NÁPOVĚDA -->',
                '  <div id="me-status-help" style="font-size:0.76rem; color:#cbd5e1; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2); padding:0.3rem 0.75rem; border-radius:6px;">' +
                tEd("map_editor.status.select", "👆 <strong>Inspektor &amp; Přesun:</strong> Klikni na políčko pro zobrazení detailu a změnu parametrů, nebo ho <strong>tažením přemísti</strong> na nové místo.") +
                '  </div>',
                '',
                '  <!-- HLAVNÍ PLOCHA S PLÁTNEM A PLOVOUCÍM INSPEKTOREM -->',
                '  <div id="me-canvas-wrapper" style="position:relative; flex:1; min-height:280px; height:100%; overflow:hidden; border-radius:10px; border:1px solid rgba(212,175,55,0.35); background:#120c08;">',
                '    <div id="me-canvas-container" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; touch-action:none;"></div>',
                '',
                '    <!-- PLOVOUCÍ INSPEKTOR POLÍČKA -->',
                '    <div id="me-inspector-panel" style="display:none; position:absolute; bottom:12px; right:12px; width:295px; max-width:calc(100% - 24px); max-height:calc(100% - 24px); overflow-y:auto; background:rgba(15,23,42,0.95); border:1px solid rgba(212,175,55,0.5); border-radius:10px; padding:0.65rem; box-shadow:0 8px 24px rgba(0,0,0,0.7); backdrop-filter:blur(6px); z-index:20;">',
                '      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem; border-bottom:1px solid rgba(212,175,55,0.25); padding-bottom:0.35rem;">',
                '        <div style="display:flex; align-items:center; gap:6px;">',
                '          <span id="me-insp-title" style="font-size:0.8rem; font-weight:bold; color:var(--gold-light); font-family:\'Cinzel\',serif;">' + tEd("map_editor.inspector.default_title", "⚙️ Inspektor") + '</span>',
                '          <span id="me-insp-id" style="font-size:0.7rem; color:#94a3b8; font-family:monospace;">#0</span>',
                '        </div>',
                '        <div style="display:flex; gap:3px;">',
                '          <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:1px 6px;" onclick="PRS_MapEditor.toggleInspectorCorner()" title="' + tEd("map_editor.inspector.btn_corner_title", "Přepnout roh panelu (vpravo dole / nahoře / vlevo)") + '">' + tEd("map_editor.inspector.btn_corner", "↕️ Roh") + '</button>',
                '          <button type="button" class="btn-icon-danger" style="font-size:0.68rem; padding:1px 6px;" onclick="PRS_MapEditor.closeInspector()" title="' + tEd("map_editor.inspector.btn_close_title", "Zavřít inspektor") + '">✕</button>',
                '        </div>',
                '      </div>',
                '',
                '      <div id="me-insp-body-node">',
                '        <!-- Rychlá navigace mezi uzly trasy -->',
                '        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; background:rgba(0,0,0,0.4); border-radius:6px; padding:2px 4px;">',
                '          <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:2px 6px;" onclick="PRS_MapEditor.selectNextNode(-1)" title="' + tEd("map_editor.inspector.btn_prev_title", "Předchozí pole") + '">' + tEd("map_editor.inspector.btn_prev", "⬅️ Předchozí") + '</button>',
                '          <span style="font-size:0.68rem; color:#94a3b8;">' + tEd("map_editor.inspector.position", "Pozice:") + ' <strong id="me-insp-coords" style="color:#e2e8f0;">[0, 0]</strong></span>',
                '          <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:2px 6px;" onclick="PRS_MapEditor.selectNextNode(1)" title="' + tEd("map_editor.inspector.btn_next_title", "Následující pole") + '">' + tEd("map_editor.inspector.btn_next", "Další ➡️") + '</button>',
                '        </div>',
                '',
                '        <div style="margin-bottom:0.35rem;">',
                '          <label for="me-insp-type" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.inspector.field_type", "Druh a typ pole:") + '</label>',
                '          <select id="me-insp-type" class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyNodeTypeChange(this.value)">',
                '            <optgroup label="' + tEd("map_editor.inspector.groups.settlements", "Sídla a Dominanty") + '">',
                '              <option value="castle">' + tEd("map_editor.inspector.options.castle", "🏰 Hrad (Feudální panství)") + '</option>',
                '              <option value="town">' + tEd("map_editor.inspector.options.town", "🏙️ Město") + '</option>',
                '              <option value="village">' + tEd("map_editor.inspector.options.village", "🏘️ Vesnice") + '</option>',
                '              <option value="start">' + tEd("map_editor.inspector.options.start", "🚩 Startovní hradní rozcestí") + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + tEd("map_editor.inspector.groups.animals", "Zvířata (Chovné sady)") + '">',
                '              <option value="animal_horse">' + tEd("map_editor.inspector.options.animal_horse", "🐎 Kůň (Jezdecký chov)") + '</option>',
                '              <option value="animal_dog">' + tEd("map_editor.inspector.options.animal_dog", "🐕 Pes (Lovecký chov)") + '</option>',
                '              <option value="animal_falcon">' + tEd("map_editor.inspector.options.animal_falcon", "🦅 Sokol (Sokolnický chov)") + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + tEd("map_editor.inspector.groups.quests", "Dračí arény & Bestie") + '">',
                '              <option value="dragon">' + tEd("map_editor.inspector.options.dragon", "🐲 Dračí sluj (Obávaný drak U3)") + '</option>',
                '              <option value="monster_u2">' + tEd("map_editor.inspector.options.monster_u2", "👹 Jeskynní nestvůra (U2)") + '</option>',
                '              <option value="monster_u1">' + tEd("map_editor.inspector.options.monster_u1", "🐗 Divoká lesní zvěř (U1)") + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + tEd("map_editor.inspector.groups.masters", "Mistři ctností") + '">',
                '              <option value="master_combat">' + tEd("map_editor.inspector.options.master_combat", "⚔️ Mistr Boje (MB)") + '</option>',
                '              <option value="master_ride">' + tEd("map_editor.inspector.options.master_ride", "🏇 Mistr Jízdy (MJ)") + '</option>',
                '              <option value="master_dance">' + tEd("map_editor.inspector.options.master_dance", "💃 Mistr Tance (MT)") + '</option>',
                '              <option value="master_charisma">' + tEd("map_editor.inspector.options.master_charisma", "👑 Mistr Charismatu (MCH)") + '</option>',
                '              <option value="master_grand">' + tEd("map_editor.inspector.options.master_grand", "🧙‍♂️ Královský Velmistr (VM)") + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + tEd("map_editor.inspector.groups.services", "Služby a Místa království") + '">',
                '              <option value="festival">' + tEd("map_editor.inspector.options.festival", "🎪 Královská slavnost / Turnaj") + '</option>',
                '              <option value="tavern">' + tEd("map_editor.inspector.options.tavern", "🍺 Krčma") + '</option>',
                '              <option value="trade">' + tEd("map_editor.inspector.options.trade", "⚖️ Obchodník & Dobytčí trh") + '</option>',
                '              <option value="craft">' + tEd("map_editor.inspector.options.craft", "⚒️ Kovárna & Zbrojírna") + '</option>',
                '              <option value="jester">' + tEd("map_editor.inspector.options.jester", "🃏 Královský Šašek") + '</option>',
                '              <option value="tax">' + tEd("map_editor.inspector.options.tax", "💰 Výběrčí daní") + '</option>',
                '              <option value="prison">' + tEd("map_editor.inspector.options.prison", "⛓️ Královská Šatlava") + '</option>',
                '              <option value="hospital">' + tEd("map_editor.inspector.options.hospital", "🏥 Lazaret") + '</option>',
                '              <option value="chance">' + tEd("map_editor.inspector.options.chance", "📜 Královská náhoda") + '</option>',
                '              <option value="bonus">' + tEd("map_editor.inspector.options.bonus", "💎 Zapomenutý poklad") + '</option>',
                '            </optgroup>',
                '          </select>',
                '        </div>',
                '',
                '        <!-- Úroveň zvířete / Stupeň mistra (podmíněně) -->',
                '        <div id="me-insp-tier-wrap" style="display:none; margin-bottom:0.35rem;">',
                '          <label for="me-insp-tier" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.inspector.tier_level", "Úroveň / Stupeň:") + '</label>',
                '          <select id="me-insp-tier" class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyNodeTierChange(this.value)"></select>',
                '        </div>',
                '',
                '        <div style="margin-bottom:0.35rem;">',
                '          <label for="me-insp-name" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.inspector.custom_name", "Vlastní název pole:") + '</label>',
                '          <input type="text" id="me-insp-name" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.4rem;" oninput="PRS_MapEditor.applyNodeNameChange(this.value)" placeholder="' + tEd("map_editor.inspector.name_placeholder", "Např. Hrad Bezděz") + '" />',
                '        </div>',
                '',
                '        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; margin-bottom:0.5rem;">',
                '          <div>',
                '            <label for="me-insp-price" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.inspector.price", "Cena (zl.):") + '</label>',
                '            <input type="number" id="me-insp-price" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodePriceChange(this.value)" step="100" min="0" />',
                '          </div>',
                '          <div>',
                '            <label for="me-insp-rent" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + tEd("map_editor.inspector.rent", "Nájem (zl.):") + '</label>',
                '            <input type="number" id="me-insp-rent" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodeRentChange(this.value)" step="50" min="0" />',
                '          </div>',
                '        </div>',
                '',
                '        <!-- Cesty a priority rozcestí uzlu -->',
                '        <div id="me-insp-node-edges"></div>',
                '',
                '        <!-- Akční tlačítka pro uzel -->',
                '        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem;">',
                '          <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.setTool(\'swap\'); PRS_MapEditor.swapSourceNodeId = PRS_MapEditor.selectedNodeId; PRS_MapEditor.updateStatusHelp(); PRS_MapEditor.renderCanvas();" title="' + tEd("map_editor.inspector.btn_swap_node_title", "Prohodit obsah s jiným polem") + '">' + tEd("map_editor.inspector.btn_swap_node", "🔄 Prohodit") + '</button>',
                '          <button type="button" class="btn-icon-danger" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.deleteSelectedNode()" title="' + tEd("map_editor.inspector.btn_delete_node_title", "Smazat toto pole a přemostit trasu") + '">' + tEd("map_editor.inspector.btn_delete_node", "🗑️ Smazat") + '</button>',
                '        </div>',
                '      </div>',
                '',
                '      <div id="me-insp-body-edge" style="display:none;"></div>',
                '      <div id="me-insp-body-castle" style="display:none;"></div>',
                                '      <div id="me-insp-body-river" style="display:none;"></div>',
                '      <div id="me-insp-body-biome" style="display:none;"></div>',
                '    </div>',
                '  </div>',
                '</div>'
            ];

            container.innerHTML = html.join("\n");
        },

        openRouteShapeModal: function () {
            var self = this;
            var archetypes = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES)
                ? window.KiDeskyMapGenerator.ROUTE_ARCHETYPES
                : {};
            var keys = Object.keys(archetypes);

            var optionsHtml = "";
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var a = archetypes[k];
                var aName = a.name;
                var aDesc = a.desc;
                optionsHtml += '<button type="button" class="btn-gold-lg" style="text-align:left; padding:0.5rem 0.8rem; display:flex; flex-direction:column; gap:2px;" onclick="PRS_MapEditor.applyProceduralShape(\'' + k + '\')">' +
                    '<div style="font-weight:700; color:#fef08a;">' + aName + '</div>' +
                    '<div style="font-size:0.72rem; color:#cbd5e1; opacity:0.85;">' + aDesc + '</div>' +
                    '</button>';
            }

            var modal = (window.PRS_App && window.PRS_App.getGenericModal) ? window.PRS_App.getGenericModal() : document.getElementById("generic-modal");
            if (!modal) return;
            var tMod = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };

            modal.innerHTML = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:480px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +
                '<div style="font-size:1.8rem; text-align:center; margin-bottom:0.3rem;">🧭 🎲</div>' +
                '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.4rem 0; text-align:center;">' + tMod("map_editor.modals.route_shape_title", null, "Procedurální generátor trasy") + '</h3>' +
                '<div style="font-size:0.82rem; color:#cbd5e1; text-align:center; margin-bottom:1rem;">' + tMod("map_editor.modals.route_shape_desc", null, "Vyber si archetyp křivky pro tento herní plán. Všechny stávající vlastnosti, názvy a ceny polí zůstanou zachovány, políčka se plynule rozmístí s garantovaným rozestupem. Krok lze kdykoliv vrátit pomocí ↩️ Zpět (Ctrl+Z).") + '</div>' +
                '<div style="display:flex; flex-direction:column; gap:0.45rem; max-height:360px; overflow-y:auto; padding-right:4px;">' +
                optionsHtml +
                '</div>' +
                '<div style="display:flex; justify-content:flex-end; margin-top:1rem;">' +
                '  <button type="button" class="btn-secondary" onclick="document.getElementById(\'generic-modal\').style.display=\'none\'">' + tMod("map_editor.modals.btn_close", null, "Zavřít") + '</button>' +
                '</div>' +
                '</div>';
            modal.style.display = "flex";
        },

        // Aplikace zvoleného procedurálního tvaru trasy s uložením do Undo
        applyProceduralShape: function (shapeKey) {
            var modal = (window.PRS_App && window.PRS_App.getGenericModal) ? window.PRS_App.getGenericModal() : document.getElementById("generic-modal");
            if (modal) modal.style.display = "none";
            if (!this.board || !this.board.nodes || this.board.nodes.length < 3) return;
            if (!window.KiDeskyMapGenerator || typeof window.KiDeskyMapGenerator.applyArchetypeToNodes !== "function") return;

            var tShape = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            this.pushUndoState("Změna tvaru trasy na " + shapeKey);
            window.KiDeskyMapGenerator.applyArchetypeToNodes(this.board, shapeKey);
            this.board.routeShape = shapeKey;
            this.refreshBoardDerivedLayers(this.board);
            this.renderCanvas();

            var aObj = (window.KiDeskyMapGenerator.ROUTE_ARCHETYPES && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES[shapeKey]) || {};
            var aName = aObj.name || shapeKey;
            if (window.KiDeskyToast) {
                window.KiDeskyToast.show(tShape("map_editor.modals.toast_shape_applied", { name: aName }, "✨ Nová trasa (" + aName + ") vygenerována! Lze vrátit pomocí ↩️ Zpět (Ctrl+Z)"), "good");
            }
        },

        undo: function () {
            if (this.undoStack.length === 0) return;
            var tUndo = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var snap = this.undoStack.pop();
            this.board = JSON.parse(snap.boardJson);
            this.selectedNodeId = null;
            this.selectedEdge = null;
            this.selectedRiverIdx = 0;
            this.selectedRiverPtIdx = null;
            this.refreshBoardDerivedLayers(this.board);
            this.renderCanvas();
            this.updateUndoButton();
            this.updateInspectorUI();
            if (window.KiDeskyToast) {
                window.KiDeskyToast.show(tUndo("map_editor.modals.toast_undo", null, "↩️ Krok vrácen zpět"), "good");
            }
        }
    };

    window.PRS_MapEditor = Editor;
})();
