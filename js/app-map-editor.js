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
        activeTool: "select", // "select" | "pan" | "move" | "add" | "swap" | "link"
        selectedNodeId: null,
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
            this.normalizeBoardForEngine(this.board);
            this.activeTool = "select";
            this.selectedNodeId = null;
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
                    if (self.selectedNodeId !== null) {
                        e.preventDefault();
                        self.deleteSelectedNode();
                    }
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    self.selectedNodeId = null;
                    self.swapSourceNodeId = null;
                    self.linkSourceNodeId = null;
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
                this.swapSourceNodeId = null;
                this.linkSourceNodeId = null;
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
            this.updateToolButtons();
            this.updateStatusHelp();
            this.updateCursor();
            this.renderCanvas();
        },

        updateCursor: function () {
            var svg = document.getElementById("me-svg-canvas");
            if (!svg) return;
            if (this.activeTool === "pan") {
                svg.style.cursor = (this.viewport && this.viewport.isPanning) ? "grabbing" : "grab";
            } else if (this.activeTool === "move") {
                svg.style.cursor = "move";
            } else if (this.activeTool === "add") {
                svg.style.cursor = "crosshair";
            } else {
                svg.style.cursor = "pointer";
            }
        },

        updateToolButtons: function () {
            var tools = ["select", "pan", "move", "add", "swap", "link"];
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
            var text = "";
            if (this.activeTool === "select") {
                text = "👆 <strong>Inspektor & Přesun:</strong> Klikni na políčko pro otevření detailu, nebo ho <strong>rovnou chytni a přetáhni</strong> na nové místo. <em>(Pozadím mapy posouváš plátno, kolečkem zoomuješ.)</em>";
            } else if (this.activeTool === "pan") {
                text = "🧭 <strong>Posun mapy:</strong> Chytni plátno myší/prstem kdekoliv a tažením posouvej celou herní desku. Kolečkem myši přibližuj a oddaluj.";
            } else if (this.activeTool === "move") {
                text = "📍 <strong>Režim přesunu:</strong> Chytni kterékoliv políčko a tažením ho přemísti na požadovanou pozici. Cesty i mosty se přizpůsobí.";
            } else if (this.activeTool === "add") {
                text = "➕ <strong>Přidat pole:</strong> Klikni kamkoliv na mapu pro umístění nového políčka. Pokud je vybráno předchozí pole, automaticky se propojí.";
            } else if (this.activeTool === "swap") {
                if (this.swapSourceNodeId === null) {
                    text = "🔄 <strong>Prohození:</strong> Krok 1/2 – Klikni na PRVNÍ políčko, které chceš prohodit.";
                } else {
                    text = "🔄 <strong>Prohození:</strong> Krok 2/2 – Nyní klikni na DRUHÉ políčko pro vzájemné prohození obsahu.";
                }
            } else if (this.activeTool === "link") {
                if (this.linkSourceNodeId === null) {
                    text = "🔗 <strong>Cesty:</strong> Krok 1/2 – Klikni na počáteční políčko cesty.";
                } else {
                    text = "🔗 <strong>Cesty:</strong> Krok 2/2 – Klikni na cílové políčko pro vytvoření či zrušení cesty.";
                }
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

            // 3. Řeka Doubravka
            if (board.rivers) {
                for (var r = 0; r < board.rivers.length; r++) {
                    var riv = board.rivers[r];
                    var rw = (riv.width && riv.width >= 28) ? riv.width : (riv.isTributary ? 22 : 36);
                    out.push('  <path d="' + riv.path + '" stroke="#dfbe86" stroke-width="' + (rw + 14) + '" fill="none" opacity="0.85" stroke-linecap="round"/>');
                    out.push('  <path d="' + riv.path + '" stroke="#0369a1" stroke-width="' + rw + '" fill="none" opacity="0.95" stroke-linecap="round"/>');
                    out.push('  <path d="' + riv.path + '" stroke="#38bdf8" stroke-width="' + (rw * 0.5) + '" fill="none" opacity="0.9" stroke-linecap="round"/>');
                }
            }

            // 4. Cesty (hrany grafu) s data atributy pro 60 FPS real-time tažení
            for (var i = 0; i < nodes.length; i++) {
                var nA = nodes[i];
                var tgts = nA.next || [];
                if (nA.branchHigh !== null && nA.branchHigh !== undefined && tgts.indexOf(nA.branchHigh) === -1) {
                    tgts = tgts.concat([nA.branchHigh]);
                }
                for (var t = 0; t < tgts.length; t++) {
                    var nB = this.getNodeById(tgts[t]);
                    if (!nB) continue;

                    var isLinkCandidate = (this.activeTool === "link" && (nA.id === this.linkSourceNodeId || nB.id === this.linkSourceNodeId));
                    var strokeCol = isLinkCandidate ? "#38bdf8" : "rgba(212,175,55,0.65)";
                    var strokeW = isLinkCandidate ? 6 : 4.5;
                    var strokeDash = isLinkCandidate ? 'stroke-dasharray="8,5"' : '';

                    out.push('  <line class="me-path-line" data-from="' + nA.id + '" data-to="' + nB.id + '" x1="' + nA.x + '" y1="' + nA.y + '" x2="' + nB.x + '" y2="' + nB.y + '" stroke="' + strokeCol + '" stroke-width="' + strokeW + '" stroke-linecap="round" ' + strokeDash + '/>');
                }
            }

            // 5. Mosty
            if (board.bridges) {
                for (var b = 0; b < board.bridges.length; b++) {
                    var br = board.bridges[b];
                    out.push('  <g transform="translate(' + br.x + ',' + br.y + ') rotate(' + (br.angle || 0) + ')">');
                    out.push('    <rect x="-18" y="-10" width="36" height="20" rx="6" fill="#78716c" stroke="#fbbf24" stroke-width="1.8"/>');
                    out.push('    <rect x="-16" y="-6" width="32" height="12" rx="3" fill="#cdbb98"/>');
                    out.push('  </g>');
                }
            }

            // 6. Královské dominanty (Hrad uprostřed)
            out.push('  <circle cx="700" cy="365" r="38" fill="rgba(212,175,55,0.18)" stroke="rgba(212,175,55,0.6)" stroke-width="2"/>');
            out.push('  <text x="700" y="377" text-anchor="middle" font-size="34">🏰</text>');

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

                // Vnější pulzující zvýraznění pro výběr / zdroj prohození
                if (isSelected) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 8) + '" fill="none" stroke="#fef08a" stroke-width="3" stroke-dasharray="4,3"/>');
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 14) + '" fill="none" stroke="#eab308" stroke-width="1.5" opacity="0.7"/>');
                } else if (isSwapSource) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 9) + '" fill="none" stroke="#c084fc" stroke-width="3.5" stroke-dasharray="6,4"/>');
                } else if (isLinkSource) {
                    out.push('    <circle cx="0" cy="0" r="' + (rad + 8) + '" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="5,3"/>');
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

                // Stručný štítek názvu pod uzlem (pokud je vybráno nebo je to klíčový bod)
                if (isSelected || nd.type === "castle" || nd.type === "town" || nd.type === "start" || (nd.type === "quest" && nd.subtype === "U3")) {
                    var label = nd.name || visual.title;
                    if (label.length > 20) label = label.substring(0, 18) + "…";
                    out.push('    <rect x="-38" y="' + (rad + 2) + '" width="76" height="13" rx="4" fill="rgba(10,7,5,0.88)" stroke="' + (isSelected ? '#f59e0b' : 'rgba(212,175,55,0.5)') + '" stroke-width="1"/>');
                    out.push('    <text x="0" y="' + (rad + 11.5) + '" text-anchor="middle" fill="' + (isSelected ? '#fef08a' : '#e2e8f0') + '" font-size="8" font-family="sans-serif" font-weight="bold" pointer-events="none">' + this.escapeXml(label) + '</text>');
                }

                out.push('  </g>');
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

                        // Rychlá aktualizace napojených čar
                        var fromLines = svg.querySelectorAll('.me-path-line[data-from="' + targetNode.id + '"]');
                        for (var fl = 0; fl < fromLines.length; fl++) {
                            fromLines[fl].setAttribute("x1", clampedX);
                            fromLines[fl].setAttribute("y1", clampedY);
                        }
                        var toLines = svg.querySelectorAll('.me-path-line[data-to="' + targetNode.id + '"]');
                        for (var tl = 0; tl < toLines.length; tl++) {
                            toLines[tl].setAttribute("x2", clampedX);
                            toLines[tl].setAttribute("y2", clampedY);
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
            var nodeEl = target && target.closest ? (target.closest(".me-node") || target.closest(".me-node-group")) : null;

            // 1. Režim přidání pole: kliknutím na prázdné místo plátna vytvoříme nový uzel
            if (this.activeTool === "add" && !nodeEl) {
                var svgAdd = document.getElementById("me-svg-canvas");
                if (svgAdd) {
                    var ptAdd = this.getSvgCoordinates(evt, svgAdd);
                    this.addNodeAtPosition(ptAdd.x, ptAdd.y);
                    return;
                }
            }

            // Pokud jsme klikli na políčko, obsluhuje ho onNodePointerDown
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
                }
            }

            this.board.nodes.push(newNode);
            this.selectedNodeId = newId;

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

                if (Array.isArray(n.next)) {
                    var idx = n.next.indexOf(idToDelete);
                    if (idx !== -1) {
                        n.next.splice(idx, 1);
                        for (var tn = 0; tn < targetNext.length; tn++) {
                            if (targetNext[tn] !== n.id && n.next.indexOf(targetNext[tn]) === -1) {
                                n.next.push(targetNext[tn]);
                            }
                        }
                    }
                }
                if (n.branchHigh === idToDelete) {
                    n.branchHigh = targetNext.length > 0 ? targetNext[0] : null;
                }
                if (n.branchLow === idToDelete) {
                    n.branchLow = targetNext.length > 0 ? targetNext[0] : null;
                }
            }

            // Odstranění uzlu ze seznamu
            this.board.nodes = this.board.nodes.filter(function (n) { return n.id !== idToDelete; });

            if (this.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                window.PRS_BoardBuilder.computeRiverBridges(this.board);
            }

            this.selectedNodeId = null;
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

        // ====================================================================
        // OPERACE: SPOJENÍ / ODPOJENÍ CESTY (LINK / UNLINK)
        // ====================================================================
        executeToggleLink: function (idA, idB) {
            var nA = this.getNodeById(idA);
            var nB = this.getNodeById(idB);
            if (!nA || !nB) return;

            this.pushUndo();

            if (!Array.isArray(nA.next)) nA.next = [];
            var idx = nA.next.indexOf(idB);

            if (idx !== -1) {
                // Odstranit cestu
                nA.next.splice(idx, 1);
                if (window.KiDeskyToast) window.KiDeskyToast.show("✂️ Cesta z #" + idA + " do #" + idB + " byla odstraněna.", "turn");
            } else {
                // Přidat cestu
                nA.next.push(idB);
                if (window.KiDeskyToast) window.KiDeskyToast.show("🔗 Vytvořena nová cesta z #" + idA + " do #" + idB + "!", "good");
            }

            // Přepočet mostů přes řeku
            if (this.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                window.PRS_BoardBuilder.computeRiverBridges(this.board);
            }

            if (window.PRS_Audio) window.PRS_Audio.playStep();
        },

        // ====================================================================
        // INSPEKTOR POLÍČKA (EDITACE TYPU, NÁZVU, CENY A NÁJMU)
        // ====================================================================
        updateInspectorUI: function () {
            var box = document.getElementById("me-inspector-panel");
            if (!box) return;

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

            var idEl = document.getElementById("me-insp-id");
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
                        tierSel.innerHTML += '<option value="' + a + '"' + ((node.animalLevel || 1) === a ? ' selected' : '') + '>Úroveň ' + a + '</option>';
                    }
                } else if (isMaster) {
                    tierWrap.style.display = "block";
                    tierSel.innerHTML = '<option value="1"' + ((node.masterTier || 1) === 1 ? ' selected' : '') + '>Stupeň I (Základní +1)</option>' +
                                        '<option value="2"' + ((node.masterTier || 1) === 2 ? ' selected' : '') + '>Stupeň II (Pokročilý +2)</option>' +
                                        '<option value="3"' + ((node.masterTier || 1) === 3 ? ' selected' : '') + '>Stupeň III (Pečetě & Záštita)</option>' +
                                        '<option value="4"' + ((node.masterTier || 1) === 4 ? ' selected' : '') + '>Stupeň IV (Duely o 1.5 💖)</option>';
                } else {
                    tierWrap.style.display = "none";
                }
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
        saveToMyTemplates: function () {
            if (!this.board) return;
            this.normalizeBoardForEngine(this.board);
            var customName = prompt("Zadej název této upravené šablony plánu:", this.board.name || "Můj ručně upravený plán");
            if (!customName || !customName.trim()) return;

            this.board.name = customName.trim();
            if (window.PRS_App && typeof window.PRS_App.saveBoardAsTemplate === "function") {
                window.PRS_App.saveBoardAsTemplate(this.board, customName.trim());
                if (window.KiDeskyToast) window.KiDeskyToast.show("⭐ Šablona „" + customName.trim() + "“ byla uložena do Tvých plánů!", "good");
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
            this.normalizeBoardForEngine(this.board);
            if (window.PRS_App) {
                // Přepočet mostů přes řeku
                if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                    window.PRS_BoardBuilder.computeRiverBridges(this.board);
                }

                var cloned = JSON.parse(JSON.stringify(this.board));
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

            var html = [
                '<div style="display:flex; flex-direction:column; width:100%; height:100%; gap:0.5rem; min-height:0;">',
                '  <!-- HORNÍ LIŠTA NÁSTROJŮ -->',
                '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; background:rgba(0,0,0,0.5); padding:0.45rem 0.75rem; border-radius:8px; border:1px solid rgba(212,175,55,0.25);">',
                '    <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">',
                '      <span style="font-size:0.75rem; color:#fde68a; font-weight:bold; margin-right:0.25rem;">Nástroje:</span>',
                '      <button type="button" id="me-tool-select" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'select\')" title="Vybrat políčko a tažením přesouvat">👆 Inspektor &amp; Přesun</button>',
                '      <button type="button" id="me-tool-add" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'add\')" title="Kliknutím kamkoliv do mapy přidáš nové políčko">➕ Přidat pole</button>',
                '      <button type="button" id="me-tool-swap" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'swap\')" title="Vzájemné prohození obsahu dvou polí">🔄 Prohodit 2 pole</button>',
                '      <button type="button" id="me-tool-link" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'link\')" title="Vytvořit nebo zrušit spojovací cestu mezi dvěma poli">🔗 Cesty</button>',
                '      <button type="button" id="me-tool-pan" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'pan\')" title="Posouvat celou mapu (tažením myši / prstem)">🧭 Posun mapy</button>',
                '      <button type="button" id="me-btn-undo" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#64748b;" onclick="PRS_MapEditor.undo()" title="Vrátit poslední změnu zpět (Ctrl+Z)" disabled>↩️ Zpět</button>',
                '    </div>',
                '    <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">',
                '      <!-- ZOOM OVLÁDÁNÍ -->',
                '      <div style="display:flex; align-items:center; gap:2px; background:rgba(0,0,0,0.55); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:2px 4px;">',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(0.82)" title="Oddálit (−)">−</button>',
                '        <span id="me-zoom-label" style="font-family:monospace; font-size:0.75rem; color:#fef08a; min-width:44px; text-align:center; cursor:pointer;" onclick="PRS_MapEditor.resetZoom()" title="Resetovat na 100%">100%</span>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(1.22)" title="Přiblížit (+)">+</button>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.72rem;" onclick="PRS_MapEditor.fitToScreen()" title="Resetovat pohled na střed">🎯 Celá</button>',
                '      </div>',
                '      <button type="button" class="btn-secondary" style="font-size:0.76rem; padding:0.25rem 0.75rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.saveToMyTemplates()">⭐ Uložit šablonu</button>',
                '      <button type="button" class="btn-gold-lg" style="font-size:0.76rem; padding:0.25rem 0.85rem;" onclick="PRS_MapEditor.playOnThisBoard()">⚔️ Hrát upravenou mapu →</button>',
                '    </div>',
                '  </div>',
                '',
                '  <!-- STAVOVÁ NÁPOVĚDA -->',
                '  <div id="me-status-help" style="font-size:0.76rem; color:#cbd5e1; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2); padding:0.3rem 0.75rem; border-radius:6px;">',
                '    👆 <strong>Inspektor &amp; Přesun:</strong> Klikni na políčko pro zobrazení detailu a změnu parametrů, nebo ho <strong>tažením přemísti</strong> na nové místo.',
                '  </div>',
                '',
                '  <!-- HLAVNÍ PLOCHA S PLÁTNEM A PLOVOUCÍM INSPEKTOREM -->',
                '  <div id="me-canvas-wrapper" style="position:relative; flex:1; min-height:280px; height:100%; overflow:hidden; border-radius:10px; border:1px solid rgba(212,175,55,0.35); background:#120c08;">',
                '    <div id="me-canvas-container" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; touch-action:none;"></div>',
                '',
                '    <!-- PLOVOUCÍ INSPEKTOR POLÍČKA -->',
                '    <div id="me-inspector-panel" style="display:none; position:absolute; bottom:12px; right:12px; width:295px; max-width:calc(100% - 24px); max-height:calc(100% - 24px); overflow-y:auto; overscroll-behavior:contain; box-sizing:border-box; background:rgba(18,12,8,0.97); border:1.5px solid #d4af37; border-radius:10px; padding:0.5rem 0.75rem; box-shadow:0 8px 24px rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:25; scrollbar-width:thin; scrollbar-color:#d4af37 rgba(0,0,0,0.5);">',
                '      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; border-bottom:1px solid rgba(212,175,55,0.25); padding-bottom:0.25rem;">',
                '        <div style="font-size:0.82rem; font-weight:bold; color:#fef08a; display:flex; align-items:center; gap:0.35rem;">',
                '          <span>⚙️ Inspektor políčka</span>',
                '          <span id="me-insp-id" style="font-family:monospace; color:#38bdf8; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); padding:1px 6px; border-radius:4px;">#0</span>',
                '        </div>',
                '        <div style="display:flex; gap:4px; align-items:center;">',
                '          <button type="button" class="btn-zoom" style="font-size:0.7rem; padding:1px 5px; line-height:1;" onclick="PRS_MapEditor.toggleInspectorPosition()" title="Přepnout roh panelu (vpravo dole / nahoře / vlevo)">↕️ Roh</button>',
                '          <button type="button" class="btn-icon-danger" style="font-size:0.68rem; padding:1px 6px;" onclick="PRS_MapEditor.closeInspector()" title="Zavřít inspektor">✕</button>',
                '        </div>',
                '      </div>',
                '',
                '      <!-- Rychlá navigace mezi uzly trasy -->',
                '      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; background:rgba(0,0,0,0.4); border-radius:6px; padding:2px 4px;">',
                '        <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:2px 6px;" onclick="PRS_MapEditor.selectNextNode(-1)" title="Předchozí pole">⬅️ Předchozí</button>',
                '        <span style="font-size:0.68rem; color:#94a3b8;">Pozice: <strong id="me-insp-coords" style="color:#e2e8f0;">[0, 0]</strong></span>',
                '        <button type="button" class="btn-zoom" style="font-size:0.68rem; padding:2px 6px;" onclick="PRS_MapEditor.selectNextNode(1)" title="Následující pole">➡️ Další</button>',
                '      </div>',
                '',
                '      <div style="margin-bottom:0.35rem;">',
                '        <label for="me-insp-type" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">Druh a typ pole:</label>',
                '        <select id="me-insp-type" class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyNodeTypeChange(this.value)">',
                '          <optgroup label="Sídla a Dominanty">',
                '            <option value="castle">🏰 Hrad (Feudální panství)</option>',
                '            <option value="town">🏙️ Město</option>',
                '            <option value="village">🏘️ Vesnice</option>',
                '            <option value="start">🚩 Startovní hradní rozcestí</option>',
                '          </optgroup>',
                '          <optgroup label="Zvířata (Chovné sady)">',
                '            <option value="animal_horse">🐎 Kůň (Jezdecký chov)</option>',
                '            <option value="animal_dog">🐕 Pes (Lovecký chov)</option>',
                '            <option value="animal_falcon">🦅 Sokol (Sokolnický chov)</option>',
                '          </optgroup>',
                '          <optgroup label="Dračí arény & Bestie">',
                '            <option value="dragon">🐲 Dračí sluj (Obávaný drak U3)</option>',
                '            <option value="monster_u2">🐺 Jeskynní nestvůra (U2)</option>',
                '            <option value="monster_u1">🐗 Divoká lesní zvěř (U1)</option>',
                '          </optgroup>',
                '          <optgroup label="Mistři ctností">',
                '            <option value="master_combat">⚔️ Mistr Boje (MB)</option>',
                '            <option value="master_ride">🏇 Mistr Jízdy (MJ)</option>',
                '            <option value="master_dance">💃 Mistr Tance (MT)</option>',
                '            <option value="master_charisma">👑 Mistr Charismatu (MCH)</option>',
                '            <option value="master_grand">🧙‍♂️ Královský Velmistr (VM)</option>',
                '          </optgroup>',
                '          <optgroup label="Služby a Místa království">',
                '            <option value="festival">🎪 Královská slavnost / Turnaj</option>',
                '            <option value="tavern">🍺 Krčma</option>',
                '            <option value="trade">⚖️ Obchodník & Dobytčí trh</option>',
                '            <option value="craft">⚒️ Kovárna & Zbrojírna</option>',
                '            <option value="jester">🃏 Královský Šašek</option>',
                '            <option value="tax">💰 Výběrčí daní</option>',
                '            <option value="prison">⛓️ Královská Šatlava</option>',
                '            <option value="hospital">🏥 Lazaret</option>',
                '            <option value="chance">📜 Královská náhoda</option>',
                '            <option value="bonus">💎 Zapomenutý poklad</option>',
                '          </optgroup>',
                '        </select>',
                '      </div>',
                '',
                '      <!-- Úroveň zvířete / Stupeň mistra (podmíněně) -->',
                '      <div id="me-insp-tier-wrap" style="display:none; margin-bottom:0.35rem;">',
                '        <label for="me-insp-tier" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">Úroveň / Stupeň:</label>',
                '        <select id="me-insp-tier" class="prs-select" style="width:100%; font-size:0.74rem; padding:0.25rem;" onchange="PRS_MapEditor.applyNodeTierChange(this.value)"></select>',
                '      </div>',
                '',
                '      <div style="margin-bottom:0.35rem;">',
                '        <label for="me-insp-name" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">Vlastní název pole:</label>',
                '        <input type="text" id="me-insp-name" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.4rem;" oninput="PRS_MapEditor.applyNodeNameChange(this.value)" placeholder="Např. Hrad Bezděz" />',
                '      </div>',
                '',
                '      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; margin-bottom:0.5rem;">',
                '        <div>',
                '          <label for="me-insp-price" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">Cena (zl.):</label>',
                '          <input type="number" id="me-insp-price" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodePriceChange(this.value)" step="100" min="0" />',
                '        </div>',
                '        <div>',
                '          <label for="me-insp-rent" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">Nájem (zl.):</label>',
                '          <input type="number" id="me-insp-rent" class="prs-input" style="width:100%; font-size:0.74rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodeRentChange(this.value)" step="50" min="0" />',
                '        </div>',
                '      </div>',
                '',
                '      <!-- Akční tlačítka pro uzel -->',
                '      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem;">',
                '        <button type="button" class="btn-secondary" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.setTool(\'swap\'); PRS_MapEditor.swapSourceNodeId = PRS_MapEditor.selectedNodeId; PRS_MapEditor.updateStatusHelp(); PRS_MapEditor.renderCanvas();" title="Prohodit obsah s jiným polem">🔄 Prohodit</button>',
                '        <button type="button" class="btn-icon-danger" style="font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.deleteSelectedNode()" title="Smazat toto pole a přemostit trasu">🗑️ Smazat</button>',
                '      </div>',
                '    </div>',
                '  </div>',
                '</div>'
            ];

            container.innerHTML = html.join("\n");
        }
    };

    window.PRS_MapEditor = Editor;
})();
