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
            this.activeTool = "select";
            this.selectedNodeId = null;
            this.selectedEdge = null;
            this.selectedRiverIdx = 0;
            this.selectedRiverPtIdx = null;
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
                } else if (e.key === "Escape") {
                    e.preventDefault();
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
            } else if (toolName === "castle") {
                if (this.board) this.getRoyalCastleLandmark();
                this.selectedNodeId = null;
                this.selectedEdge = null;
                this.inspectorMode = "castle";
            } else if (toolName !== "link") {
                if (this.inspectorMode === "river" || this.inspectorMode === "castle") {
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
            } else if (this.activeTool === "add" || this.activeTool === "river") {
                svg.style.cursor = "crosshair";
            } else {
                svg.style.cursor = "pointer";
            }
        },

        updateToolButtons: function () {
            var tools = ["select", "add", "swap", "link", "river", "castle", "pan", "move"];
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
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var text = "";
            if (this.activeTool === "select") {
                text = isEn
                    ? "👆 <strong>Inspector &amp; Move:</strong> Click on a tile, <strong>path</strong>, or <strong>Royal Castle</strong> to edit parameters and directions, or <strong>drag to move</strong> elements."
                    : "👆 <strong>Inspektor &amp; Přesun:</strong> Klikni na políčko, <strong>cestu</strong> nebo <strong>Hlavní hrad</strong> pro úpravu parametrů a směrů, případně prvek <strong>tažením přemísti</strong>.";
            } else if (this.activeTool === "pan") {
                text = isEn
                    ? "🧭 <strong>Pan Map:</strong> Drag canvas anywhere to pan the board. Use mouse wheel to zoom in and out."
                    : "🧭 <strong>Posun mapy:</strong> Chytni plátno myší/prstem kdekoliv a tažením posouvej celou herní desku. Kolečkem myši přibližuj a oddaluj.";
            } else if (this.activeTool === "move") {
                text = isEn
                    ? "📍 <strong>Move Mode:</strong> Grab any tile or the Royal Castle and drag it to desired position. Paths and bridges will adapt automatically."
                    : "📍 <strong>Režim přesunu:</strong> Chytni kterékoliv políčko nebo Hlavní hrad a tažením ho přemísti na požadovanou pozici. Cesty i mosty se přizpůsobí.";
            } else if (this.activeTool === "add") {
                text = isEn
                    ? "➕ <strong>Add Tile:</strong> Click anywhere on the map to place a new tile. If a previous tile is selected, it connects automatically."
                    : "➕ <strong>Přidat pole:</strong> Klikni kamkoliv na mapu pro umístění nového políčka. Pokud je vybráno předchozí pole, automaticky se propojí.";
            } else if (this.activeTool === "swap") {
                if (this.swapSourceNodeId === null) {
                    text = isEn
                        ? "🔄 <strong>Swap:</strong> Step 1/2 – Click on the FIRST tile to swap."
                        : "🔄 <strong>Prohození:</strong> Krok 1/2 – Klikni na PRVNÍ políčko, které chceš prohodit.";
                } else {
                    text = isEn
                        ? "🔄 <strong>Swap:</strong> Step 2/2 – Now click on the SECOND tile to swap contents."
                        : "🔄 <strong>Prohození:</strong> Krok 2/2 – Nyní klikni na DRUHÉ políčko pro vzájemné prohození obsahu.";
                }
            } else if (this.activeTool === "link") {
                if (this.linkSourceNodeId === null) {
                    text = isEn
                        ? "🔗 <strong>Paths &amp; Directions:</strong> Click on an <strong>existing path line</strong> to reverse direction or delete, OR click 2 tiles sequentially to create/remove connection."
                        : "🔗 <strong>Cesty &amp; Směry:</strong> Klikni na <strong>existující čáru cesty</strong> pro otočení směru či smazání, NEBO klikni postupně na 2 políčka pro vytvoření/zrušení spojení.";
                } else {
                    text = isEn
                        ? ("🔗 <strong>Paths &amp; Directions:</strong> Step 2/2 – Now click on the target tile to create a path from #" + this.linkSourceNodeId + " (or remove existing).")
                        : ("🔗 <strong>Cesty &amp; Směry:</strong> Krok 2/2 – Nyní klikni na cílové políčko pro vytvoření cesty z #" + this.linkSourceNodeId + " (nebo zrušení existující).");
                }
            } else if (this.activeTool === "river") {
                text = isEn
                    ? "🌊 <strong>River Editor:</strong> Drag <strong style='color:#38bdf8;'>blue nodes</strong> (meanders) or <strong style='color:#facc15;'>yellow curve handles</strong>. Hold <kbd>Alt</kbd> to move node independently; bridges will recalculate upon release."
                    : "🌊 <strong>Editor řeky:</strong> Chytni a táhni <strong style='color:#38bdf8;'>modré uzly</strong> (meandry) nebo <strong style='color:#facc15;'>žlutá táhla</strong> křivek. Podržením <kbd>Alt</kbd> posuneš uzel bez jeho táhel; mosty se po puštění přepočítají.";
            } else if (this.activeTool === "castle") {
                text = isEn
                    ? "🏰 <strong>Royal Castle:</strong> Drag the Royal Castle landmark to any spot on the map and adjust its appearance, scale, and rotation in the bottom-right panel."
                    : "🏰 <strong>Hlavní hrad:</strong> Tažením myší přesuň dominantu Královského hradu na libovolné místo mapy a v panelu vpravo dole uprav jeho vzhled, velikost i otočení.";
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

            // 2. Biomy (pokud existují)
            if (board.biomes) {
                for (var bm = 0; bm < board.biomes.length; bm++) {
                    var bio = board.biomes[bm];
                    out.push('  <path d="' + bio.path + '" fill="' + (bio.fill || "rgba(255,255,255,0.06)") + '" opacity="0.45"/>');
                }
            }

            // 3. Řeka Doubravka (interaktivní výběr i editace Beziérových bodů)
            var isRiverEditMode = (this.activeTool === "river" || this.inspectorMode === "river");
            if (board.rivers) {
                for (var r = 0; r < board.rivers.length; r++) {
                    var riv = board.rivers[r];
                    var rw = (riv.customWidth && riv.width) ? riv.width : ((riv.width && riv.width >= 28) ? riv.width : (riv.isTributary ? 24 : 38));
                    var isSelectedRiver = (isRiverEditMode && this.selectedRiverIdx === r);
                    if (isSelectedRiver) {
                        out.push('  <path class="me-river-sel" data-river-idx="' + r + '" d="' + riv.path + '" stroke="rgba(250,204,21,0.55)" stroke-width="' + (rw + 22) + '" fill="none" stroke-linecap="round" stroke-dasharray="10,6" pointer-events="none"/>');
                    }
                    out.push('  <path class="me-river-bank" data-river-idx="' + r + '" d="' + riv.path + '" stroke="#dfbe86" stroke-width="' + (rw + 14) + '" fill="none" opacity="0.85" stroke-linecap="round" pointer-events="none"/>');
                    out.push('  <path class="me-river-water" data-river-idx="' + r + '" d="' + riv.path + '" stroke="#0369a1" stroke-width="' + rw + '" fill="none" opacity="0.95" stroke-linecap="round" pointer-events="none"/>');
                    out.push('  <path class="me-river-foam" data-river-idx="' + r + '" d="' + riv.path + '" stroke="#38bdf8" stroke-width="' + (rw * 0.5) + '" fill="none" opacity="0.9" stroke-linecap="round" pointer-events="none"/>');
                    out.push('  <path class="me-river-path" data-river-idx="' + r + '" d="' + riv.path + '" stroke="transparent" stroke-width="' + Math.max(rw + 18, 44) + '" fill="none" stroke-linecap="round" style="cursor:pointer;" onclick="PRS_MapEditor.onRiverPathClick(event, ' + r + ')"/>');
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
                var rcImg = rc.image || rc.img || "assets/castles/castle_royal.png";
                if (rc.isFlipped && rcImg.indexOf("_flip.png") === -1) {
                    rcImg = rcImg.replace(".png", "_flip.png");
                }
                var rcScale = rc.scale || 1;
                var isCastleSelected = (this.inspectorMode === "castle" || this.activeTool === "castle");
                out.push('  <g id="me-royal-castle-g" class="me-royal-castle-hit" transform="translate(' + rc.x + ',' + rc.y + ') scale(' + rcScale + ')" style="cursor:grab;" onpointerdown="PRS_MapEditor.onRoyalCastlePointerDown(event)">');
                out.push('    <circle class="me-royal-castle-aura" cx="0" cy="0" r="44" fill="rgba(212,175,55,0.16)" stroke="' + (isCastleSelected ? '#facc15' : 'rgba(212,175,55,0.65)') + '" stroke-width="' + (isCastleSelected ? '3' : '2') + '"' + (isCastleSelected ? ' stroke-dasharray="6,4"' : '') + '/>');
                out.push('    <image href="' + rcImg + '" x="-42" y="-48" width="84" height="84" preserveAspectRatio="xMidYMid meet" pointer-events="none"/>');
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
            if (isRiverEditMode && board.rivers && board.rivers[this.selectedRiverIdx]) {
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

            out.push('</svg>');

            container.innerHTML = out.join("\n");

            // Registrace událostí na SVG pro posun plátna a zoom
            var svgEl = document.getElementById("me-svg-canvas");
            if (svgEl) {
                var self = this;
                svgEl.onpointerdown = function (e) { self.onSvgPointerDown(e); };
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
                    lm.image = lm.image || lm.img || "assets/castles/castle_royal.png";
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
                image: "assets/castles/castle_royal.png",
                img: "assets/castles/castle_royal.png",
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
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var catalog = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ALL_CASTLES) || [];
            var rawName = rc.name || "";
            if (isEn) {
                var cEnMap = {
                    "Královský hrad": "Royal Castle (Seat of the Crown)",
                    "Lesní hrad Doubrava": "Forest Castle Doubrava",
                    "Ledový palác Věčného mrazu": "Ice Palace of Eternal Frost",
                    "Sopečná pevnost Lávový chřtán": "Volcanic Stronghold Lava Maw",
                    "Křišťálový zámek Ametyst": "Crystal Castle Amethyst",
                    "Větrný vzdušný zámek Boreas": "Wind Citadel Boreas",
                    "Vodní citadela Oceán": "Water Citadel Ocean",
                    "Pouštní pískovcový palác": "Desert Sandstone Palace",
                    "Bažinná tvrz Černá tůň": "Swamp Fortress Black Mere",
                    "Temný hrad Erebus": "Dark Nether Keep Erebus"
                };
                for (var k in cEnMap) {
                    if (rawName.indexOf(k) !== -1) return cEnMap[k];
                }
                for (var i = 0; i < catalog.length; i++) {
                    var c = catalog[i];
                    if (c.id === rc.skinId || c.id === rc.selectedKey || c.name === rawName || (c.img && (rc.image === c.img || rc.img === c.img))) {
                        return c.nameEn || c.name || "Royal Castle";
                    }
                }
                return rawName.replace(/^Královský hrad/i, "Royal Castle");
            }
            return rawName || "Královský hrad";
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
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (!rc.customNameEdited) rc.name = isEn ? (found.nameEn || found.name) : found.name;
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
            return {
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
                    { path: "M 760 410 C 980 470, 1180 560, 1440 520", width: 30, isTributary: true, customWidth: true },
                    { path: "M 640 420 C 860 590, 1100 720, 1440 760", width: 28, isTributary: true, customWidth: true }
                ],
                none: []
            };
        },

        applyRiverPreset: function (presetKey) {
            if (!this.board) return;
            var presets = this.buildRiverPresetList();
            if (!presets[presetKey]) return;

            this.pushUndo();
            this.board.rivers = JSON.parse(JSON.stringify(presets[presetKey]));
            this.selectedRiverIdx = 0;
            this.selectedRiverPtIdx = null;
            this.board._decorDirty = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show("🌊 Použita šablona řeky: " + presetKey, "good");
            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        selectRiverIndex: function (rivIdx) {
            if (!this.board || !Array.isArray(this.board.rivers)) return;
            if (rivIdx < 0 || rivIdx >= this.board.rivers.length) return;
            this.selectedRiverIdx = rivIdx;
            this.selectedRiverPtIdx = null;
            this.inspectorMode = "river";
            this.renderCanvas();
            this.updateInspectorUI();
        },

        addRiverMeander: function () {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var pts = this.parseRiverPathPoints(riv.path);
            if (!pts || pts.length < 4) return;

            // Najdeme nejdelší Beziérův segment a rozdělíme ho De Casteljauovým krokem
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

        applyRiverWidth: function (w) {
            if (!this.board || !Array.isArray(this.board.rivers) || !this.board.rivers[this.selectedRiverIdx]) return;
            var riv = this.board.rivers[this.selectedRiverIdx];
            var clampedW = Math.max(10, Math.min(56, parseInt(w, 10) || 36));
            if (riv.width === clampedW && riv.customWidth) return;

            this.pushUndo();
            riv.width = clampedW;
            riv.customWidth = true;
            this.recomputeBridgesSafe();
            this.renderCanvas();
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

            var bodyNode = document.getElementById("me-insp-body-node");
            var bodyEdge = document.getElementById("me-insp-body-edge");
            var bodyCastle = document.getElementById("me-insp-body-castle");
            var bodyRiver = document.getElementById("me-insp-body-river");
            var titleEl = document.getElementById("me-insp-title");
            var idEl = document.getElementById("me-insp-id");
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";

            var hideAll = function () {
                if (bodyNode) bodyNode.style.display = "none";
                if (bodyEdge) bodyEdge.style.display = "none";
                if (bodyCastle) bodyCastle.style.display = "none";
                if (bodyRiver) bodyRiver.style.display = "none";
            };

            var mode = this.inspectorMode;
            if (!mode) {
                if (this.selectedEdge) mode = "edge";
                else if (this.selectedNodeId !== null) mode = "node";
                else if (this.activeTool === "castle") mode = "castle";
                else if (this.activeTool === "river") mode = "river";
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
                if (titleEl) titleEl.textContent = isEn ? "🔗 Path Inspector" : "🔗 Inspektor cesty";
                if (idEl) idEl.textContent = "#" + nFrom.id + " ➔ #" + nTo.id;

                if (bodyEdge) {
                    var idxInNext = nFrom.next.indexOf(nTo.id);
                    var isJunc = nFrom.next.length >= 2;
                    var roleTxt = isJunc
                        ? (idxInNext === 0
                            ? (isEn ? "🔵 Primary direction (dice 1–3)" : "🔵 Hlavní směr (kostka 1–3)")
                            : (idxInNext === 1
                                ? (isEn ? "🟠 Side branch (dice 4–6)" : "🟠 Boční větev (kostka 4–6)")
                                : (isEn ? "⚪ Secondary link" : "⚪ Vedlejší propojení")))
                        : (isEn ? "Single outgoing path" : "Jediná výstupní cesta");
                    var html = [];
                    html.push('<div style="font-size:0.74rem; color:#e2e8f0; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.25); border-radius:6px; padding:0.45rem; margin-bottom:0.45rem;">');
                    html.push('  <div style="margin-bottom:3px;"><strong>' + (isEn ? 'From:' : 'Od:') + '</strong> #' + nFrom.id + ' ' + this.escapeXml(nFrom.name || nFrom.code || "") + '</div>');
                    html.push('  <div style="margin-bottom:4px;"><strong>' + (isEn ? 'To:' : 'Do:') + '</strong> #' + nTo.id + ' ' + this.escapeXml(nTo.name || nTo.code || "") + '</div>');
                    html.push('  <div style="font-size:0.7rem; color:#fde68a;">' + roleTxt + '</div>');
                    html.push('</div>');
                    html.push('<div style="display:flex; flex-direction:column; gap:0.35rem;">');
                    html.push('  <button type="button" class="btn-secondary" style="font-size:0.73rem; padding:0.3rem 0.5rem;" onclick="PRS_MapEditor.reverseEdgeDirection(' + nFrom.id + ', ' + nTo.id + ')">' + (isEn ? ('🔄 Reverse direction (#' + nTo.id + ' ➔ #' + nFrom.id + ')') : ('🔄 Obrátit směr (#' + nTo.id + ' ➔ #' + nFrom.id + ')')) + '</button>');
                    if (isJunc) {
                        html.push('  <button type="button" class="btn-secondary" style="font-size:0.73rem; padding:0.3rem 0.5rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.swapJunctionBranchPriority(' + nFrom.id + ')">' + (isEn ? '🔀 Swap junction priority (1–3 ⇄ 4–6)' : '🔀 Prohodit prioritu rozcestí (1–3 ⇄ 4–6)') + '</button>');
                    }
                    html.push('  <button type="button" class="btn-icon-danger" style="font-size:0.73rem; padding:0.3rem 0.5rem;" onclick="PRS_MapEditor.removeEdge(' + nFrom.id + ', ' + nTo.id + ')">' + (isEn ? '✂️ Remove path (Delete)' : '✂️ Odebrat cestu (Delete)') + '</button>');
                    html.push('  <button type="button" class="btn-zoom" style="font-size:0.72rem; padding:0.28rem 0.5rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.autoOrientSideBranches()">' + (isEn ? '🧭 Auto-orient branches' : '🧭 Automaticky srovnat větve') + '</button>');
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
                if (titleEl) titleEl.textContent = isEn ? "🏰 Royal Castle" : "🏰 Hlavní hrad";
                if (idEl) idEl.textContent = isEn ? "Royal" : "Královský";

                if (bodyCastle) {
                    var catalog = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ALL_CASTLES) || [];
                    var opts = [];
                    for (var ci = 0; ci < catalog.length; ci++) {
                        var c = catalog[ci];
                        var isSelSkin = (rc.skinId === c.id || rc.selectedKey === c.id || rc.image === c.img || rc.img === c.img);
                        var cName = isEn ? (c.nameEn || c.name) : c.name;
                        opts.push('<option value="' + c.id + '"' + (isSelSkin ? ' selected' : '') + '>' + this.escapeXml((c.icon || "🏰") + " " + cName) + '</option>');
                    }
                    var scalePct = Math.round((rc.scale || 1) * 100);
                    var cHtml = [];
                    cHtml.push('<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#cbd5e1; background:rgba(0,0,0,0.4); border-radius:6px; padding:4px 8px; margin-bottom:0.4rem;">');
                    cHtml.push('  <span>' + (isEn ? 'Map coordinates:' : 'Souřadnice na mapě:') + '</span>');
                    cHtml.push('  <strong id="me-insp-castle-coords" style="color:#fde68a; font-family:monospace;">[' + Math.round(rc.x) + ', ' + Math.round(rc.y) + ']</strong>');
                    cHtml.push('</div>');
                    cHtml.push('<div style="margin-bottom:0.35rem;">');
                    cHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Castle appearance (skin):' : 'Podoba (skin) hradu:') + '</label>');
                    cHtml.push('  <select class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyRoyalCastleSkin(this.value)">' + opts.join("") + '</select>');
                    cHtml.push('</div>');
                    cHtml.push('<div style="margin-bottom:0.35rem;">');
                    cHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Castle name:' : 'Název hradu:') + '</label>');
                    cHtml.push('  <input type="text" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.4rem;" value="' + this.escapeXml(this.getCastleDisplayName(rc)) + '" onchange="PRS_MapEditor.applyRoyalCastleName(this.value)" />');
                    cHtml.push('</div>');
                    cHtml.push('<div style="margin-bottom:0.45rem;">');
                    cHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:2px;"><span>' + (isEn ? 'Castle scale:' : 'Velikost hradu:') + '</span><strong id="me-insp-castle-scale-val" style="color:#fef08a;">' + scalePct + '%</strong></label>');
                    cHtml.push('  <input type="range" min="0.75" max="1.30" step="0.05" value="' + (rc.scale || 1) + '" style="width:100%;" oninput="var el=document.getElementById(\'me-insp-castle-scale-val\'); if(el) el.textContent=Math.round(this.value*100)+\'%\';" onchange="PRS_MapEditor.applyRoyalCastleScale(this.value)" />');
                    cHtml.push('</div>');
                    cHtml.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; margin-bottom:0.35rem;">');
                    cHtml.push('  <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.toggleRoyalCastleFlip()">' + (isEn ? ('↔️ Flip ' + (rc.isFlipped ? '(✓)' : '')) : ('↔️ Zrcadlit ' + (rc.isFlipped ? '(✓)' : ''))) + '</button>');
                    cHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.resetRoyalCastlePosition()">' + (isEn ? '🎯 Map center' : '🎯 Střed mapy') + '</button>');
                    cHtml.push('</div>');
                    cHtml.push('<button type="button" class="btn-zoom" style="width:100%; font-size:0.72rem; padding:0.28rem 0.4rem; border-color:#22c55e; color:#bbf7d0;" onclick="PRS_MapEditor.regenerateDecorAndBridges()">' + (isEn ? '🌿 Recalculate Bridges & Decors' : '🌿 Přepočítat mosty & dekorace') + '</button>');
                    bodyCastle.innerHTML = cHtml.join("\n");
                }
                return;
            }

            // 3. Režim Řeky
            if (mode === "river") {
                box.style.display = "block";
                hideAll();
                if (bodyRiver) bodyRiver.style.display = "block";
                if (titleEl) titleEl.textContent = isEn ? "🌊 River Editor" : "🌊 Editor řeky";
                var rivers = (this.board && Array.isArray(this.board.rivers)) ? this.board.rivers : [];
                if (idEl) idEl.textContent = rivers.length > 0 ? ((isEn ? "Branch " : "Větev ") + (this.selectedRiverIdx + 1) + "/" + rivers.length) : (isEn ? "No river" : "Bez řeky");

                if (bodyRiver) {
                    var rHtml = [];
                    rHtml.push('<div style="margin-bottom:0.4rem;">');
                    rHtml.push('  <div style="font-size:0.68rem; color:#cbd5e1; margin-bottom:3px;">' + (isEn ? 'Quick course presets:' : 'Rychlé šablony toku:') + '</div>');
                    rHtml.push('  <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;">');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'single\')">' + (isEn ? '🌊 Main' : '🌊 Hlavní') + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'dual\')">' + (isEn ? '🌿 Confluence' : '🌿 Soutok') + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'island\')">' + (isEn ? '🏝️ Island' : '🏝️ Ostrov') + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px;" onclick="PRS_MapEditor.applyRiverPreset(\'delta\')">' + (isEn ? '🔻 Delta' : '🔻 Delta') + '</button>');
                    rHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 4px; border-color:#64748b; color:#94a3b8;" onclick="PRS_MapEditor.applyRiverPreset(\'none\')">' + (isEn ? '🏜️ No River' : '🏜️ Bez řeky') + '</button>');
                    rHtml.push('  </div>');
                    rHtml.push('</div>');

                    if (rivers.length > 0) {
                        var curRiv = rivers[this.selectedRiverIdx] || rivers[0];
                        var curW = curRiv ? (curRiv.width || 38) : 38;

                        rHtml.push('<div style="display:flex; gap:3px; margin-bottom:0.4rem; overflow-x:auto;">');
                        for (var ri = 0; ri < rivers.length; ri++) {
                            var isActiveRiv = (ri === this.selectedRiverIdx);
                            var bName = (rivers[ri].isTributary ? (isEn ? 'Tributary ' : 'Přítok ') : (isEn ? 'River ' : 'Řeka ')) + (ri + 1);
                            rHtml.push('<button type="button" class="btn-zoom" style="font-size:0.66rem; padding:2px 6px;' + (isActiveRiv ? ' border-color:#facc15; background:rgba(250,204,21,0.18); color:#fef08a;' : '') + '" onclick="PRS_MapEditor.selectRiverIndex(' + ri + ')">' + bName + '</button>');
                        }
                        rHtml.push('</div>');

                        rHtml.push('<div id="me-insp-river-pt-info" style="font-size:0.68rem; color:#bae6fd; background:rgba(14,165,233,0.12); border-radius:5px; padding:3px 6px; margin-bottom:0.35rem;">' + (isEn ? 'Drag blue anchors (with Alt without handles) or yellow curve handles.' : 'Táhni modré kotvy (s Alt bez táhel) nebo žluté úchyty.') + '</div>');
                        rHtml.push('<div style="margin-bottom:0.4rem;">');
                        rHtml.push('  <label style="font-size:0.7rem; color:#cbd5e1; display:flex; justify-content:space-between; margin-bottom:2px;"><span>' + (isEn ? 'Selected course width:' : 'Šířka vybraného toku:') + '</span><strong id="me-insp-river-w-val" style="color:#38bdf8;">' + curW + ' px</strong></label>');
                        rHtml.push('  <input type="range" min="24" max="54" step="2" value="' + Math.max(24, Math.min(54, curW)) + '" style="width:100%;" oninput="var el=document.getElementById(\'me-insp-river-w-val\'); if(el) el.textContent=this.value+\' px\';" onchange="PRS_MapEditor.applyRiverWidth(this.value)" />');
                        rHtml.push('</div>');

                        rHtml.push('<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; margin-bottom:0.35rem;">');
                        rHtml.push('  <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.addRiverMeander()">' + (isEn ? '〰️ Add Meander' : '〰️ Přidat zákrut') + '</button>');
                        rHtml.push('  <button type="button" class="btn-secondary" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.addRiverTributary()">' + (isEn ? '➕ Add Tributary' : '➕ Přidat přítok') + '</button>');
                        rHtml.push('  <button type="button" class="btn-zoom" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.flipSelectedRiverHorizontally()">' + (isEn ? '↔️ Flip X' : '↔️ Překlopit X') + '</button>');
                        rHtml.push('  <button type="button" class="btn-icon-danger" style="font-size:0.7rem; padding:0.26rem 0.4rem;" onclick="PRS_MapEditor.deleteSelectedRiver()">' + (isEn ? '🗑️ Delete Branch' : '🗑️ Smazat větev') + '</button>');
                        rHtml.push('</div>');
                    } else {
                        rHtml.push('<button type="button" class="btn-secondary" style="width:100%; font-size:0.72rem; padding:0.3rem; margin-bottom:0.35rem;" onclick="PRS_MapEditor.addRiverTributary()">' + (isEn ? '➕ Create New River Bed' : '➕ Založit nové koryto řeky') + '</button>');
                    }
                    rHtml.push('<button type="button" class="btn-zoom" style="width:100%; font-size:0.72rem; padding:0.28rem 0.4rem; border-color:#22c55e; color:#bbf7d0;" onclick="PRS_MapEditor.regenerateDecorAndBridges()">' + (isEn ? '🌿 Recalculate Bridges & Decors' : '🌿 Přepočítat mosty & dekorace') + '</button>');
                    bodyRiver.innerHTML = rHtml.join("\n");
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
            if (titleEl) titleEl.textContent = isEn ? "⚙️ Tile Inspector" : "⚙️ Inspektor políčka";

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
                        tierSel.innerHTML += '<option value="' + a + '"' + ((node.animalLevel || 1) === a ? ' selected' : '') + '>' + (isEn ? ('Level ' + a) : ('Úroveň ' + a)) + '</option>';
                    }
                } else if (isMaster) {
                    tierWrap.style.display = "block";
                    tierSel.innerHTML = '<option value="1"' + ((node.masterTier || 1) === 1 ? ' selected' : '') + '>' + (isEn ? 'Tier I (Basic +1)' : 'Stupeň I (Základní +1)') + '</option>' +
                                        '<option value="2"' + ((node.masterTier || 1) === 2 ? ' selected' : '') + '>' + (isEn ? 'Tier II (Advanced +2)' : 'Stupeň II (Pokročilý +2)') + '</option>' +
                                        '<option value="3"' + ((node.masterTier || 1) === 3 ? ' selected' : '') + '>' + (isEn ? 'Tier III (Seals & Aegis)' : 'Stupeň III (Pečetě & Záštita)') + '</option>' +
                                        '<option value="4"' + ((node.masterTier || 1) === 4 ? ' selected' : '') + '>' + (isEn ? 'Tier IV (Duels for 1.5 💖)' : 'Stupeň IV (Duely o 1.5 💖)') + '</option>';
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
                eHtml.push('    <span style="font-size:0.7rem; color:#fde68a; font-weight:bold;">' + (isEn ? '🛤️ Node Paths & Directions' : '🛤️ Cesty a směry uzlu') + '</span>');
                eHtml.push('    <button type="button" class="btn-zoom" style="font-size:0.65rem; padding:1px 5px; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.autoOrientSideBranches()" title="' + (isEn ? 'Automatically align side branches and junctions' : 'Automaticky srovnat boční větve a rozcestí') + '">' + (isEn ? '🧭 Align' : '🧭 Srovnat') + '</button>');
                eHtml.push('  </div>');

                if (outList.length === 0) {
                    eHtml.push('  <div style="font-size:0.68rem; color:#fca5a5; background:rgba(153,27,27,0.35); border:1px solid rgba(248,113,113,0.5); border-radius:5px; padding:3px 6px; margin-bottom:4px;">' + (isEn ? '⚠️ Dead end — tile has no outgoing direction!' : '⚠️ Slepá cesta — pole nemá žádný výstupní směr!') + '</div>');
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
                        eHtml.push('      <button type="button" class="btn-zoom" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.reverseEdgeDirection(' + node.id + ', ' + tgt.id + ')" title="' + (isEn ? 'Reverse direction' : 'Obrátit směr') + '">🔄</button>');
                        eHtml.push('      <button type="button" class="btn-icon-danger" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.removeEdge(' + node.id + ', ' + tgt.id + ')" title="' + (isEn ? 'Remove path' : 'Odebrat cestu') + '">🗑️</button>');
                        eHtml.push('    </span>');
                        eHtml.push('  </div>');
                    }
                    if (isNodeJunc) {
                        eHtml.push('  <button type="button" class="btn-secondary" style="width:100%; font-size:0.69rem; padding:0.22rem 0.4rem; margin-bottom:4px; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.swapJunctionBranchPriority(' + node.id + ')">' + (isEn ? '🔀 Swap 1–3 ⇄ 4–6' : '🔀 Prohodit 1–3 ⇄ 4–6') + '</button>');
                    }
                }

                for (var ii = 0; ii < inList.length; ii++) {
                    var inc = inList[ii];
                    eHtml.push('  <div style="display:flex; justify-content:space-between; align-items:center; gap:4px; font-size:0.67rem; color:#94a3b8; background:rgba(0,0,0,0.25); padding:2px 5px; border-radius:4px; margin-bottom:3px;">');
                    eHtml.push('    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + (isEn ? '⬅️ from #' : '⬅️ z #') + inc.id + ' ' + this.escapeXml(inc.name || inc.code || "") + '</span>');
                    eHtml.push('    <span style="display:flex; gap:3px; flex-shrink:0;">');
                    eHtml.push('      <button type="button" class="btn-zoom" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.reverseEdgeDirection(' + inc.id + ', ' + node.id + ')" title="' + (isEn ? 'Reverse direction' : 'Obrátit směr') + '">🔄</button>');
                    eHtml.push('      <button type="button" class="btn-icon-danger" style="font-size:0.65rem; padding:1px 4px;" onclick="PRS_MapEditor.removeEdge(' + inc.id + ', ' + node.id + ')" title="' + (isEn ? 'Remove path' : 'Odebrat cestu') + '">🗑️</button>');
                    eHtml.push('    </span>');
                    eHtml.push('  </div>');
                }

                eHtml.push('  <button type="button" class="btn-zoom" style="width:100%; font-size:0.69rem; padding:0.22rem 0.4rem;" onclick="PRS_MapEditor.setTool(\'link\'); PRS_MapEditor.linkSourceNodeId = ' + node.id + '; PRS_MapEditor.updateStatusHelp(); PRS_MapEditor.renderCanvas();">' + (isEn ? ('🔗 Add / remove path from #' + node.id) : ('🔗 Přidat / odebrat cestu z #' + node.id)) + '</button>');
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
            if (this.activeTool === "castle" || this.activeTool === "river") {
                this.activeTool = "select";
                this.updateToolButtons();
                this.updateStatusHelp();
                this.updateCursor();
            }
            this.updateInspectorUI();
            this.renderCanvas();
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
                if (board._decorDirty && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
                    window.PRS_BoardBuilder.generateBoardDecorations(board, board.seed || 4242);
                    board._decorDirty = false;
                }
            }
        },

        saveToMyTemplates: function () {
            if (!this.board) return;
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            this.refreshBoardDerivedLayers(this.board);
            this.normalizeBoardForEngine(this.board);
            var customName = prompt(isEn ? "Enter a name for this custom board template:" : "Zadej název této upravené šablony plánu:", this.board.name || (isEn ? "My Custom Board" : "Můj ručně upravený plán"));
            if (!customName || !customName.trim()) return;

            this.board.name = customName.trim();
            if (window.PRS_App && typeof window.PRS_App.saveBoardAsTemplate === "function") {
                window.PRS_App.saveBoardAsTemplate(this.board, customName.trim());
                if (window.KiDeskyToast) {
                    window.KiDeskyToast.show(isEn ? ("⭐ Template „" + customName.trim() + "“ saved to Your Boards!") : ("⭐ Šablona „" + customName.trim() + "“ byla uložena do Tvých plánů!"), "good");
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
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (!container) return;

            var html = [
                '<div style="display:flex; flex-direction:column; width:100%; height:100%; gap:0.5rem; min-height:0;">',
                '  <!-- HORNÍ LIŠTA NÁSTROJŮ -->',
                '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; background:rgba(0,0,0,0.5); padding:0.45rem 0.75rem; border-radius:8px; border:1px solid rgba(212,175,55,0.25);">',
                '    <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">',
                '      <span style="font-size:0.75rem; color:#fde68a; font-weight:bold; margin-right:0.25rem;">' + (isEn ? 'Tools:' : 'Nástroje:') + '</span>',
                '      <button type="button" id="me-tool-select" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'select\')" title="' + (isEn ? 'Select tile and drag to move' : 'Vybrat políčko a tažením přesouvat') + '">' + (isEn ? '👆 Inspector &amp; Move' : '👆 Inspektor &amp; Přesun') + '</button>',
                '      <button type="button" id="me-tool-add" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'add\')" title="' + (isEn ? 'Click anywhere on map to add a new tile' : 'Kliknutím kamkoliv do mapy přidáš nové políčko') + '">' + (isEn ? '➕ Add Tile' : '➕ Přidat pole') + '</button>',
                '      <button type="button" id="me-tool-swap" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'swap\')" title="' + (isEn ? 'Swap contents of two tiles' : 'Vzájemné prohození obsahu dvou polí') + '">' + (isEn ? '🔄 Swap 2 Tiles' : '🔄 Prohodit 2 pole') + '</button>',
                '      <button type="button" id="me-tool-link" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'link\')" title="' + (isEn ? 'Create/remove paths between tiles or adjust directions' : 'Vytvořit / odebrat cestu mezi dvěma poli nebo upravit směry') + '">' + (isEn ? '🔗 Paths &amp; Directions' : '🔗 Cesty &amp; Směry') + '</button>',
                '      <button type="button" id="me-tool-river" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'river\')" title="' + (isEn ? 'Adjust river path, meanders, tributaries, and bridges' : 'Upravit tok řeky, meandry, přítoky a mosty') + '">' + (isEn ? '🌊 River' : '🌊 Řeka') + '</button>',
                '      <button type="button" id="me-tool-castle" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'castle\')" title="' + (isEn ? 'Move Royal Castle and pick appearance' : 'Přemístit Hlavní hrad a zvolit jeho vzhled') + '">' + (isEn ? '🏰 Royal Castle' : '🏰 Hlavní hrad') + '</button>',
                '      <button type="button" id="me-btn-route-shape" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_MapEditor.openRouteShapeModal()" title="' + (isEn ? 'Procedurally regenerate route by 7 archetypes (with Undo history)' : 'Procedurálně přegenerovat trasu podle 7 archetypů (s historií Undo)') + '">' + (isEn ? '🧭 Route Shape' : '🧭 Tvar trasy') + '</button>',
                '      <button type="button" id="me-tool-pan" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'pan\')" title="' + (isEn ? 'Pan entire map (mouse drag / touch)' : 'Posouvat celou mapu (tažením myši / prstem)') + '">' + (isEn ? '🧭 Pan Map' : '🧭 Posun mapy') + '</button>',
                '      <button type="button" id="me-btn-undo" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#64748b;" onclick="PRS_MapEditor.undo()" title="' + (isEn ? 'Undo last change (Ctrl+Z)' : 'Vrátit poslední změnu zpět (Ctrl+Z)') + '" disabled>' + (isEn ? '↩️ Undo' : '↩️ Zpět') + '</button>',
                '    </div>',
                '    <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">',
                '      <!-- ZOOM OVLÁDÁNÍ -->',
                '      <div style="display:flex; align-items:center; gap:2px; background:rgba(0,0,0,0.55); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:2px 4px;">',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(0.82)" title="' + (isEn ? 'Zoom Out (−)' : 'Oddálit (−)') + '">−</button>',
                '        <span id="me-zoom-label" style="font-family:monospace; font-size:0.75rem; color:#fef08a; min-width:44px; text-align:center; cursor:pointer;" onclick="PRS_MapEditor.resetZoom()" title="' + (isEn ? 'Reset to 100%' : 'Resetovat na 100%') + '">100%</span>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(1.22)" title="' + (isEn ? 'Zoom In (+)' : 'Přiblížit (+)') + '">+</button>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.72rem;" onclick="PRS_MapEditor.fitToScreen()" title="' + (isEn ? 'Reset view to center' : 'Resetovat pohled na střed') + '">' + (isEn ? '🎯 Full' : '🎯 Celá') + '</button>',
                '      </div>',
                '      <button type="button" class="btn-secondary" style="font-size:0.76rem; padding:0.25rem 0.75rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.saveToMyTemplates()">' + (isEn ? '⭐ Save Template' : '⭐ Uložit šablonu') + '</button>',
                '      <button type="button" class="btn-gold-lg" style="font-size:0.76rem; padding:0.25rem 0.85rem;" onclick="PRS_MapEditor.playOnThisBoard()">' + (isEn ? '⚔️ Play Edited Map →' : '⚔️ Hrát upravenou mapu →') + '</button>',
                '    </div>',
                '  </div>',
                '',
                '  <!-- STAVOVÁ NÁPOVĚDA -->',
                '  <div id="me-status-help" style="font-size:0.76rem; color:#cbd5e1; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2); padding:0.3rem 0.75rem; border-radius:6px;">' +
                (isEn
                    ? '👆 <strong>Inspector &amp; Move:</strong> Click on a tile to view details and change parameters, or <strong>drag to move</strong> to a new location.'
                    : '👆 <strong>Inspektor &amp; Přesun:</strong> Klikni na políčko pro zobrazení detailu a změnu parametrů, nebo ho <strong>tažením přemísti</strong> na nové místo.') +
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
                '          <span id="me-insp-title" style="font-size:0.8rem; font-weight:bold; color:var(--gold-light); font-family:\'Cinzel\',serif;">' + (isEn ? '⚙️ Inspector' : '⚙️ Inspektor') + '</span>',
                '          <span id="me-insp-id" style="font-size:0.7rem; color:#94a3b8; font-family:monospace;">#0</span>',
                '        </div>',
                '        <div style="display:flex; gap:3px;">',
                '          <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:1px 6px;" onclick="PRS_MapEditor.toggleInspectorCorner()" title="' + (isEn ? 'Toggle panel corner (bottom-right / top / left)' : 'Přepnout roh panelu (vpravo dole / nahoře / vlevo)') + '">' + (isEn ? '↕️ Corner' : '↕️ Roh') + '</button>',
                '          <button type="button" class="btn-icon-danger" style="font-size:0.68rem; padding:1px 6px;" onclick="PRS_MapEditor.closeInspector()" title="' + (isEn ? 'Close inspector' : 'Zavřít inspektor') + '">✕</button>',
                '        </div>',
                '      </div>',
                '',
                '      <div id="me-insp-body-node">',
                '        <!-- Rychlá navigace mezi uzly trasy -->',
                '        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; background:rgba(0,0,0,0.4); border-radius:6px; padding:2px 4px;">',
                '          <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:2px 6px;" onclick="PRS_MapEditor.selectNextNode(-1)" title="' + (isEn ? 'Previous tile' : 'Předchozí pole') + '">' + (isEn ? '⬅️ Prev' : '⬅️ Předchozí') + '</button>',
                '          <span style="font-size:0.68rem; color:#94a3b8;">' + (isEn ? 'Position:' : 'Pozice:') + ' <strong id="me-insp-coords" style="color:#e2e8f0;">[0, 0]</strong></span>',
                '          <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:2px 6px;" onclick="PRS_MapEditor.selectNextNode(1)" title="' + (isEn ? 'Next tile' : 'Následující pole') + '">' + (isEn ? 'Next ➡️' : '➡️ Další') + '</button>',
                '        </div>',
                '',
                '        <div style="margin-bottom:0.35rem;">',
                '          <label for="me-insp-type" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Tile Kind &amp; Type:' : 'Druh a typ pole:') + '</label>',
                '          <select id="me-insp-type" class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyNodeTypeChange(this.value)">',
                '            <optgroup label="' + (isEn ? 'Settlements &amp; Landmarks' : 'Sídla a Dominanty') + '">',
                '              <option value="castle">' + (isEn ? '🏰 Castle (Feudal Estate)' : '🏰 Hrad (Feudální panství)') + '</option>',
                '              <option value="town">' + (isEn ? '🏙️ Town' : '🏙️ Město') + '</option>',
                '              <option value="village">' + (isEn ? '🏘️ Village' : '🏘️ Vesnice') + '</option>',
                '              <option value="start">' + (isEn ? '🚩 Royal Start Crossroads' : '🚩 Startovní hradní rozcestí') + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + (isEn ? 'Animals (Breeding Sets)' : 'Zvířata (Chovné sady)') + '">',
                '              <option value="animal_horse">' + (isEn ? '🐎 Horse (Equestrian)' : '🐎 Kůň (Jezdecký chov)') + '</option>',
                '              <option value="animal_dog">' + (isEn ? '🐕 Dog (Hunting Hound)' : '🐕 Pes (Lovecký chov)') + '</option>',
                '              <option value="animal_falcon">' + (isEn ? '🦅 Falcon (Falconry)' : '🦅 Sokol (Sokolnický chov)') + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + (isEn ? 'Dragon Arenas &amp; Beasts' : 'Dračí arény &amp; Bestie') + '">',
                '              <option value="dragon">' + (isEn ? '🐲 Dragon Lair (Dreaded Dragon T3)' : '🐲 Dračí sluj (Obávaný drak U3)') + '</option>',
                '              <option value="monster_u2">' + (isEn ? '🐺 Cave Monster (T2)' : '🐺 Jeskynní nestvůra (U2)') + '</option>',
                '              <option value="monster_u1">' + (isEn ? '🐗 Wild Forest Beast (T1)' : '🐗 Divoká lesní zvěř (U1)') + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + (isEn ? 'Virtue Masters' : 'Mistři ctností') + '">',
                '              <option value="master_combat">' + (isEn ? '⚔️ Master of Combat (MC)' : '⚔️ Mistr Boje (MB)') + '</option>',
                '              <option value="master_ride">' + (isEn ? '🏇 Master of Riding (MR)' : '🏇 Mistr Jízdy (MJ)') + '</option>',
                '              <option value="master_dance">' + (isEn ? '💃 Master of Dance (MD)' : '💃 Mistr Tance (MT)') + '</option>',
                '              <option value="master_charisma">' + (isEn ? '👑 Master of Charisma (MCH)' : '👑 Mistr Charismatu (MCH)') + '</option>',
                '              <option value="master_grand">' + (isEn ? '🧙‍♂️ Royal Grandmaster (GM)' : '🧙‍♂️ Královský Velmistr (VM)') + '</option>',
                '            </optgroup>',
                '            <optgroup label="' + (isEn ? 'Services &amp; Kingdom Sites' : 'Služby a Místa království') + '">',
                '              <option value="festival">' + (isEn ? '🎪 Royal Festival / Tournament' : '🎪 Královská slavnost / Turnaj') + '</option>',
                '              <option value="tavern">' + (isEn ? '🍺 Tavern' : '🍺 Krčma') + '</option>',
                '              <option value="trade">' + (isEn ? '⚖️ Merchant &amp; Cattle Market' : '⚖️ Obchodník &amp; Dobytčí trh') + '</option>',
                '              <option value="craft">' + (isEn ? '⚒️ Blacksmith &amp; Armory' : '⚒️ Kovárna &amp; Zbrojírna') + '</option>',
                '              <option value="jester">' + (isEn ? '🃏 Royal Jester' : '🃏 Královský Šašek') + '</option>',
                '              <option value="tax">' + (isEn ? '💰 Tax Collector' : '💰 Výběrčí daní') + '</option>',
                '              <option value="prison">' + (isEn ? '⛓️ Royal Dungeon' : '⛓️ Královská Šatlava') + '</option>',
                '              <option value="hospital">' + (isEn ? '🏥 Royal Infirmary' : '🏥 Lazaret') + '</option>',
                '              <option value="chance">' + (isEn ? '📜 Royal Chance' : '📜 Královská náhoda') + '</option>',
                '              <option value="bonus">' + (isEn ? '💎 Forgotten Treasure' : '💎 Zapomenutý poklad') + '</option>',
                '            </optgroup>',
                '          </select>',
                '        </div>',
                '',
                '        <!-- Úroveň zvířete / Stupeň mistra (podmíněně) -->',
                '        <div id="me-insp-tier-wrap" style="display:none; margin-bottom:0.35rem;">',
                '          <label for="me-insp-tier" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Level / Tier:' : 'Úroveň / Stupeň:') + '</label>',
                '          <select id="me-insp-tier" class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyNodeTierChange(this.value)"></select>',
                '        </div>',
                '',
                '        <div style="margin-bottom:0.35rem;">',
                '          <label for="me-insp-name" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Custom Tile Name:' : 'Vlastní název pole:') + '</label>',
                '          <input type="text" id="me-insp-name" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.4rem;" oninput="PRS_MapEditor.applyNodeNameChange(this.value)" placeholder="' + (isEn ? 'e.g. Highpeak Castle' : 'Např. Hrad Bezděz') + '" />',
                '        </div>',
                '',
                '        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; margin-bottom:0.5rem;">',
                '          <div>',
                '            <label for="me-insp-price" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Price (g.):' : 'Cena (zl.):') + '</label>',
                '            <input type="number" id="me-insp-price" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodePriceChange(this.value)" step="100" min="0" />',
                '          </div>',
                '          <div>',
                '            <label for="me-insp-rent" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">' + (isEn ? 'Rent (g.):' : 'Nájem (zl.):') + '</label>',
                '            <input type="number" id="me-insp-rent" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodeRentChange(this.value)" step="50" min="0" />',
                '          </div>',
                '        </div>',
                '',
                '        <!-- Cesty a priority rozcestí uzlu -->',
                '        <div id="me-insp-node-edges"></div>',
                '',
                '        <!-- Akční tlačítka pro uzel -->',
                '        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem;">',
                '          <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.setTool(\'swap\'); PRS_MapEditor.swapSourceNodeId = PRS_MapEditor.selectedNodeId; PRS_MapEditor.updateStatusHelp(); PRS_MapEditor.renderCanvas();" title="' + (isEn ? 'Swap content with another tile' : 'Prohodit obsah s jiným polem') + '">' + (isEn ? '🔄 Swap' : '🔄 Prohodit') + '</button>',
                '          <button type="button" class="btn-icon-danger" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.deleteSelectedNode()" title="' + (isEn ? 'Delete this tile and bypass route' : 'Smazat toto pole a přemostit trasu') + '">' + (isEn ? '🗑️ Delete' : '🗑️ Smazat') + '</button>',
                '        </div>',
                '      </div>',
                '',
                '      <div id="me-insp-body-edge" style="display:none;"></div>',
                '      <div id="me-insp-body-castle" style="display:none;"></div>',
                '      <div id="me-insp-body-river" style="display:none;"></div>',
                '    </div>',
                '  </div>',
                '</div>'
            ];

            container.innerHTML = html.join("\n");
        },

        openRouteShapeModal: function () {
            var self = this;
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var archetypes = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES)
                ? window.KiDeskyMapGenerator.ROUTE_ARCHETYPES
                : {};
            var keys = Object.keys(archetypes);

            var optionsHtml = "";
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var a = archetypes[k];
                var aName = isEn ? (a.nameEn || a.name) : a.name;
                var aDesc = isEn ? (a.descEn || a.desc) : a.desc;
                optionsHtml += '<button type="button" class="btn-gold-lg" style="text-align:left; padding:0.5rem 0.8rem; display:flex; flex-direction:column; gap:2px;" onclick="PRS_MapEditor.applyProceduralShape(\'' + k + '\')">' +
                    '<div style="font-weight:700; color:#fef08a;">' + aName + '</div>' +
                    '<div style="font-size:0.72rem; color:#cbd5e1; opacity:0.85;">' + aDesc + '</div>' +
                    '</button>';
            }

            var modal = (window.PRS_App && window.PRS_App.getGenericModal) ? window.PRS_App.getGenericModal() : document.getElementById("generic-modal");
            if (!modal) return;

            modal.innerHTML = '<div class="tactical-modal-box" style="padding:1.4rem; max-width:480px; margin:auto; background:linear-gradient(180deg, #1e1b4b, #0f172a); border:2px solid #38bdf8; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">' +
                '<div style="font-size:1.8rem; text-align:center; margin-bottom:0.3rem;">🧭 🎲</div>' +
                '<h3 style="font-family:\'Cinzel\',serif; color:#7dd3fc; margin:0 0 0.4rem 0; text-align:center;">' + (isEn ? 'Procedural Route Generator' : 'Procedurální generátor trasy') + '</h3>' +
                '<div style="font-size:0.82rem; color:#cbd5e1; text-align:center; margin-bottom:1rem;">' + (isEn ? 'Choose a curve archetype for this game board. All existing tile properties, names, and prices are preserved, and tiles are smoothly arranged with guaranteed spacing. This step can be undone anytime with ↩️ Undo (Ctrl+Z).' : 'Vyber si archetyp křivky pro tento herní plán. Všechny stávající vlastnosti, názvy a ceny polí zůstanou zachovány, políčka se plynule rozmístí s garantovaným rozestupem. Krok lze kdykoliv vrátit pomocí ↩️ Zpět (Ctrl+Z).') + '</div>' +
                '<div style="display:flex; flex-direction:column; gap:0.45rem; max-height:360px; overflow-y:auto; padding-right:4px;">' +
                optionsHtml +
                '</div>' +
                '<div style="display:flex; justify-content:flex-end; margin-top:1rem;">' +
                '  <button type="button" class="btn-secondary" onclick="document.getElementById(\'generic-modal\').style.display=\'none\'">' + (isEn ? 'Close' : 'Zavřít') + '</button>' +
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

            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            this.pushUndoState("Změna tvaru trasy na " + shapeKey);
            window.KiDeskyMapGenerator.applyArchetypeToNodes(this.board, shapeKey);
            this.board.routeShape = shapeKey;
            this.refreshBoardDerivedLayers(this.board);
            this.renderCanvas();

            var aObj = (window.KiDeskyMapGenerator.ROUTE_ARCHETYPES && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES[shapeKey]) || {};
            var aName = isEn ? (aObj.nameEn || aObj.name || shapeKey) : (aObj.name || shapeKey);
            if (window.KiDeskyToast) {
                window.KiDeskyToast.show(isEn ? ("✨ New route (" + aName + ") generated! Can be reverted via ↩️ Undo (Ctrl+Z)") : ("✨ Nová trasa (" + aName + ") vygenerována! Lze vrátit pomocí ↩️ Zpět (Ctrl+Z)"), "good");
            }
        },

        undo: function () {
            if (this.undoStack.length === 0) return;
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
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
                window.KiDeskyToast.show(isEn ? "↩️ Step reverted" : "↩️ Krok vrácen zpět", "good");
            }
        }
    };

    window.PRS_MapEditor = Editor;
})();
