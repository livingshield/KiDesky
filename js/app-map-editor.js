// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Královské Map Studio: Vizuální WYSIWYG Editor
// Umožňuje přímou úpravu hracího plánu klikáním a tažením:
// 1. Inspektor políček (Změna typu, názvu, ceny a úrovně)
// 2. Prohození dvou polí (Swap Nodes pro vyvážení)
// 3. Přemístění uzlu tažením myší / prstem (Drag & Drop)
// 4. Spojení / rozpojení cest (Link / Unlink)
// 5. Krok zpět (Undo) a přímé uložení / spuštění hry
// ============================================================================

(function () {
    if (!window.PRS_MapEditor) window.PRS_MapEditor = {};

    var Editor = {
        board: null,
        activeTool: "select", // "select" | "pan" | "move" | "swap" | "link"
        selectedNodeId: null,
        swapSourceNodeId: null,
        linkSourceNodeId: null,
        isDragging: false,
        dragNodeId: null,
        dragStartPos: null,
        undoStack: [],
        maxUndo: 15,
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

            // Vytvoříme samostatnou hlubokou kopii pro editaci, abychom neponičili původní stav
            this.board = JSON.parse(JSON.stringify(board));
            this.activeTool = "select";
            this.selectedNodeId = null;
            this.swapSourceNodeId = null;
            this.linkSourceNodeId = null;
            this.isDragging = false;
            this.dragNodeId = null;
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
                svg.style.cursor = "crosshair";
            } else {
                svg.style.cursor = "pointer";
            }
        },

        updateToolButtons: function () {
            var tools = ["select", "pan", "move", "swap", "link"];
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
                text = "👆 <strong>Inspektor:</strong> Klikni na kterékoliv políčko pro zobrazení detailu a změnu jeho parametrů. <em>(Mapou posouváš tažením prázdného pozadí nebo kolečkem myši.)</em>";
            } else if (this.activeTool === "pan") {
                text = "🧭 <strong>Posun mapy:</strong> Chytni plátno myší kdekoliv a tažením posouvej celou herní desku. Kolečkem myši přibližuj a oddaluj.";
            } else if (this.activeTool === "move") {
                text = "📍 <strong>Přesun uzlu:</strong> Chytni konkrétní políčko a přetáhni ho na nové místo. Cesty i mosty se automaticky přizpůsobí.";
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

        // Výpočet aktuálního viewBoxu pro plynulý pan & zoom
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

        // Aplikace souřadnic viewBoxu do SVG elementu (60 FPS plynulost bez překreslování DOMu)
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

        // Vykreslení celého SVG plátna editoru
        renderCanvas: function () {
            var container = document.getElementById("me-canvas-container");
            if (!container || !this.board || !this.board.nodes) return;

            var board = this.board;
            var nodes = board.nodes;
            var out = [];

            var vb = this.getCurrentViewBox();
            var cursorStyle = (this.activeTool === "pan" ? "grab" : (this.activeTool === "move" ? "crosshair" : "pointer"));

            out.push('<svg id="me-svg-canvas" viewBox="' + vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1) + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="background:#140d07; border-radius:10px; display:block; user-select:none; touch-action:none; cursor:' + cursorStyle + ';" xmlns="http://www.w3.org/2000/svg">');

            // 0. Nekonečné pozadí pro plynulý posun i mimo základní rámec
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

            // 4. Cesty (hrany grafu)
            for (var i = 0; i < nodes.length; i++) {
                var nA = nodes[i];
                var tgts = nA.next || [];
                if (nA.branchHigh !== null && nA.branchHigh !== undefined && tgts.indexOf(nA.branchHigh) === -1) {
                    tgts = tgts.concat([nA.branchHigh]);
                }
                for (var t = 0; t < tgts.length; t++) {
                    var nB = nodes[tgts[t]];
                    if (!nB) continue;

                    var isLinkCandidate = (this.activeTool === "link" && (nA.id === this.linkSourceNodeId || nB.id === this.linkSourceNodeId));
                    var strokeCol = isLinkCandidate ? "#38bdf8" : "rgba(212,175,55,0.65)";
                    var strokeW = isLinkCandidate ? 6 : 4.5;
                    var strokeDash = isLinkCandidate ? 'stroke-dasharray="8,5"' : '';

                    out.push('  <line x1="' + nA.x + '" y1="' + nA.y + '" x2="' + nB.x + '" y2="' + nB.y + '" stroke="' + strokeCol + '" stroke-width="' + strokeW + '" stroke-linecap="round" ' + strokeDash + '/>');
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

                out.push('  <g class="me-node" id="me-node-g-' + nd.id + '" transform="translate(' + nd.x + ',' + nd.y + ')" style="cursor:pointer;" onmousedown="PRS_MapEditor.onNodeMouseDown(' + nd.id + ', event)" onclick="PRS_MapEditor.onNodeClick(' + nd.id + ', event)">');

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
                    if (label.length > 18) label = label.substring(0, 16) + "…";
                    out.push('    <rect x="-35" y="' + (rad + 2) + '" width="70" height="13" rx="4" fill="rgba(10,7,5,0.88)" stroke="' + (isSelected ? '#f59e0b' : 'rgba(212,175,55,0.5)') + '" stroke-width="1"/>');
                    out.push('    <text x="0" y="' + (rad + 11.5) + '" text-anchor="middle" fill="' + (isSelected ? '#fef08a' : '#e2e8f0') + '" font-size="8" font-family="sans-serif" font-weight="bold" pointer-events="none">' + this.escapeXml(label) + '</text>');
                }

                out.push('  </g>');
            }

            out.push('</svg>');

            container.innerHTML = out.join("\n");

            // Registrace událostí pro posun kamery (pan), kolečko zoomu a tahání políček
            var svgEl = document.getElementById("me-svg-canvas");
            if (svgEl) {
                var self = this;
                svgEl.onpointerdown = function (e) { self.onSvgPointerDown(e); };
                svgEl.onpointermove = function (e) { self.onSvgPointerMove(e); };
                svgEl.onpointerup = function (e) { self.onSvgPointerUp(e); };
                svgEl.onpointercancel = function (e) { self.onSvgPointerUp(e); };
                svgEl.onmousedown = function (e) { self.onSvgPointerDown(e); };
                svgEl.onmousemove = function (e) { self.onSvgPointerMove(e); };
                svgEl.onmouseup = function (e) { self.onSvgPointerUp(e); };
                svgEl.onmouseleave = function (e) { self.onSvgPointerUp(e); };
                svgEl.oncontextmenu = function (e) { e.preventDefault(); };
                svgEl.onwheel = function (e) {
                    e.preventDefault();
                    var factor = e.deltaY < 0 ? 1.15 : 0.87;
                    self.zoomAtPoint(e.clientX, e.clientY, factor);
                };
            }
        },

        // Vizuální konfigurace pro různé typy polí
        getNodeVisualConfig: function (nd) {
            var type = (nd.type || "").toLowerCase();
            var sub = (nd.subtype || "").toUpperCase();

            if (type === "start") return { color: "#ef4444", rad: 16, icon: "🚩", iconSize: 15, iconY: 5.5, title: "Start" };
            if (type === "castle") return { color: "#a855f7", rad: 14, icon: "🏰", iconSize: 15, iconY: 5.5, title: "Hrad" };
            if (type === "town") return { color: "#3b82f6", rad: 13, icon: "🏙️", iconSize: 13, iconY: 5, title: "Město" };
            if (type === "village") return { color: "#22c55e", rad: 11, icon: "🏘️", iconSize: 12, iconY: 4.5, title: "Vesnice" };
            if (type === "festival") return { color: "#ec4899", rad: 12, icon: "🎪", iconSize: 12, iconY: 4.5, title: "Slavnost" };
            if (type === "quest") {
                if (sub === "U3") return { color: "#dc2626", rad: 15, icon: "🐲", iconSize: 16, iconY: 5.5, title: "Drak (U3)" };
                if (sub === "U2") return { color: "#ea580c", rad: 12, icon: "🐺", iconSize: 13, iconY: 4.5, title: "Bestie (U2)" };
                return { color: "#84cc16", rad: 11, icon: "🐗", iconSize: 12, iconY: 4, title: "Tvor (U1)" };
            }
            if (type === "master") {
                if (sub === "MB") return { color: "#ef4444", rad: 12, icon: "⚔️", iconSize: 12, iconY: 4, title: "Mistr Boje" };
                if (sub === "MJ") return { color: "#eab308", rad: 12, icon: "🏇", iconSize: 12, iconY: 4.5, title: "Mistr Jízdy" };
                if (sub === "MT") return { color: "#ec4899", rad: 12, icon: "💃", iconSize: 12, iconY: 4.5, title: "Mistr Tance" };
                if (sub === "MCH") return { color: "#8b5cf6", rad: 12, icon: "👑", iconSize: 12, iconY: 4, title: "Mistr Charismatu" };
                return { color: "#a855f7", rad: 13, icon: "🧙‍♂️", iconSize: 13, iconY: 4.5, title: "Velmistr" };
            }
            if (type === "animal" || type === "horse" || type === "dog" || type === "falcon") {
                var aIcon = "🐎";
                if (type === "dog" || sub === "DOG") aIcon = "🐕";
                else if (type === "falcon" || sub === "FALCON") aIcon = "🦅";
                return { color: "#10b981", rad: 10, icon: aIcon, iconSize: 11, iconY: 4, title: "Zvíře L" + (nd.animalLevel || 1) };
            }
            if (type === "jester") return { color: "#f59e0b", rad: 11, icon: "🃏", iconSize: 12, iconY: 4.5, title: "Šašek" };
            if (type === "tax") return { color: "#64748b", rad: 11, icon: "💰", iconSize: 11, iconY: 4, title: "Výběrčí daní" };
            if (type === "prison") return { color: "#475569", rad: 11, icon: "⛓️", iconSize: 11, iconY: 4, title: "Šatlava" };
            if (type === "hospital") return { color: "#ef4444", rad: 11, icon: "🏥", iconSize: 11, iconY: 4, title: "Lazaret" };
            if (type === "tavern") return { color: "#b45309", rad: 11, icon: "🍺", iconSize: 11, iconY: 4, title: "Krčma" };
            if (type === "trade") return { color: "#0284c7", rad: 11, icon: "⚖️", iconSize: 11, iconY: 4, title: "Obchodník" };
            if (type === "craft") return { color: "#78716c", rad: 11, icon: "⚒️", iconSize: 11, iconY: 4, title: "Kovárna" };
            if (type === "chance") return { color: "#d97706", rad: 10.5, icon: "📜", iconSize: 11, iconY: 4, title: "Náhoda" };
            if (type === "bonus") return { color: "#059669", rad: 10.5, icon: "💎", iconSize: 11, iconY: 4, title: "Poklad" };

            return { color: "#d4af37", rad: 10, icon: "⚪", iconSize: 9, iconY: 3.5, title: "Pole #" + nd.id };
        },

        // Kliknutí na uzel podle aktivního nástroje
        onNodeClick: function (nodeId, evt) {
            if (evt) evt.stopPropagation();
            if (this.isDragging) return;
            if (this.viewport && (this.viewport.isPanning || this.viewport.hasPanned)) return;
            if (this.activeTool === "pan") return; // V režimu posunu mapy neotvírat inspektor

            var node = this.getNodeById(nodeId);
            if (!node) return;

            if (this.activeTool === "select") {
                this.selectedNodeId = nodeId;
                this.renderCanvas();
                this.updateInspectorUI();
                if (window.PRS_Audio) window.PRS_Audio.playStep();
            } else if (this.activeTool === "swap") {
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
            } else if (this.activeTool === "move") {
                this.selectedNodeId = nodeId;
                this.renderCanvas();
                this.updateInspectorUI();
            }
        },

        // Zahájení tahu uzlu (Drag & Drop konkrétního políčka)
        onNodeMouseDown: function (nodeId, evt) {
            if (this.activeTool !== "move") return;
            if (evt) {
                evt.preventDefault();
                evt.stopPropagation();
            }

            this.pushUndo();
            this.isDragging = true;
            this.dragNodeId = nodeId;
            this.selectedNodeId = nodeId;
            this.updateInspectorUI();
        },

        // Stisk ukazatele (myš / dotyk / stylus) na SVG plátně
        onSvgPointerDown: function (evt) {
            if (evt.button === 2) {
                evt.preventDefault();
            }

            if (this.isDragging) return;

            var target = evt.target;
            var nodeEl = target && target.closest ? (target.closest(".me-node") || target.closest(".me-node-group")) : null;

            // Pokud jsme klikli na políčko a aktivní nástroj je přesun (move), tah políčka řeší onNodeMouseDown
            if (nodeEl && this.activeTool === "move") {
                return;
            }

            var isPanTool = (this.activeTool === "pan");
            var isMiddleOrRight = (evt.button === 1 || evt.button === 2);
            var isSpace = (evt.spaceKey || evt.altKey);

            // Posun mapy: aktivní buď přes nástroj Posun, prostřední/pravé tlačítko, mezeru, nebo tažení pozadí
            if (isPanTool || isMiddleOrRight || isSpace || !nodeEl) {
                evt.preventDefault();
                var svg = document.getElementById("me-svg-canvas");
                this.viewport.isPanning = true;
                this.viewport.hasPanned = false;
                this.viewport.startMouseX = evt.clientX;
                this.viewport.startMouseY = evt.clientY;
                this.viewport.startViewX = this.viewport.x || 0;
                this.viewport.startViewY = this.viewport.y || 0;
                this.viewport.pointerId = evt.pointerId;

                if (svg) {
                    svg.style.cursor = "grabbing";
                    if (svg.setPointerCapture && evt.pointerId !== undefined) {
                        try { svg.setPointerCapture(evt.pointerId); } catch (e) { }
                    }
                }
            }
        },

        // Pohyb ukazatele po SVG (plynulý posun celé mapy nebo tah vybraného uzlu)
        onSvgPointerMove: function (evt) {
            // Posun kamery (pan mapy)
            if (this.viewport && this.viewport.isPanning) {
                evt.preventDefault();
                var svg = document.getElementById("me-svg-canvas");
                if (!svg) return;
                var rect = svg.getBoundingClientRect();
                var vb = this.getCurrentViewBox();
                var scaleX = vb.w / (rect.width || 1400);
                var scaleY = vb.h / (rect.height || 860);

                var dx = (evt.clientX - this.viewport.startMouseX) * scaleX;
                var dy = (evt.clientY - this.viewport.startMouseY) * scaleY;

                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    this.viewport.hasPanned = true;
                }

                this.viewport.x = this.viewport.startViewX - dx;
                this.viewport.y = this.viewport.startViewY - dy;
                this.applyViewport();
                return;
            }

            // Přesun konkrétního uzlu
            if (this.isDragging && this.dragNodeId !== null) {
                var svg2 = document.getElementById("me-svg-canvas");
                if (!svg2) return;

                var pt = this.getSvgCoordinates(evt, svg2);
                if (!pt) return;

                // Omezení do vnitřního rámce mapy
                var clampedX = Math.max(35, Math.min(1365, Math.round(pt.x)));
                var clampedY = Math.max(35, Math.min(825, Math.round(pt.y)));

                var node = this.getNodeById(this.dragNodeId);
                if (node) {
                    node.x = clampedX;
                    node.y = clampedY;
                    this.renderCanvas();
                    this.updateInspectorCoordinates(clampedX, clampedY);
                }
            }
        },

        // Uvolnění stisku (ukončení panu nebo tahu uzlu)
        onSvgPointerUp: function (evt) {
            var svg = document.getElementById("me-svg-canvas");
            if (this.viewport && this.viewport.isPanning) {
                this.viewport.isPanning = false;
                if (svg && svg.releasePointerCapture && evt && evt.pointerId !== undefined) {
                    try { svg.releasePointerCapture(evt.pointerId); } catch (e) { }
                }
                var self = this;
                setTimeout(function () {
                    if (self.viewport) self.viewport.hasPanned = false;
                }, 80);
                this.updateCursor();
            }

            if (this.isDragging) {
                this.isDragging = false;
                this.dragNodeId = null;
                // Přepočet mostů, pokud uzel pohnul cestu přes řeku
                if (this.board && window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                    window.PRS_BoardBuilder.computeRiverBridges(this.board);
                }
                this.renderCanvas();
            }
        },

        // Zpětná kompatibilita pro starší handlery
        onSvgMouseDown: function (evt) { this.onSvgPointerDown(evt); },
        onSvgMouseMove: function (evt) { this.onSvgPointerMove(evt); },
        onSvgMouseUp: function (evt) { this.onSvgPointerUp(evt); },

        // Převod klientských souřadnic na SVG souřadnice podle aktuálního viewBoxu (zoom & pan)
        getSvgCoordinates: function (evt, svg) {
            if (!svg) svg = document.getElementById("me-svg-canvas");
            if (!svg) return { x: 0, y: 0 };
            var rect = svg.getBoundingClientRect();
            var vb = this.getCurrentViewBox();
            var relX = (evt.clientX - rect.left) / rect.width;
            var relY = (evt.clientY - rect.top) / rect.height;
            return {
                x: vb.x + relX * vb.w,
                y: vb.y + relY * vb.h
            };
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
            var props = ["type", "subtype", "name", "price", "rent", "animalLevel", "villageLevel", "masterType", "badge", "icon", "themeBadge", "tag"];
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
        // INSPEKTOR POLÍČKA (EDITACE TYPU, NÁZVU A CENY)
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

            var titleEl = document.getElementById("me-insp-title");
            var idEl = document.getElementById("me-insp-id");
            var coordsEl = document.getElementById("me-insp-coords");
            var typeSel = document.getElementById("me-insp-type");
            var nameInp = document.getElementById("me-insp-name");
            var priceInp = document.getElementById("me-insp-price");

            if (titleEl) titleEl.textContent = "Pole #" + node.id + ": " + (node.name || node.type);
            if (idEl) idEl.textContent = "#" + node.id;
            if (coordsEl) coordsEl.textContent = "[" + Math.round(node.x) + ", " + Math.round(node.y) + "]";

            if (nameInp) nameInp.value = node.name || "";
            if (priceInp) priceInp.value = node.price || 0;

            if (typeSel) {
                var curVal = this.getSelectValueForNode(node);
                typeSel.value = curVal;
            }
        },

        updateInspectorCoordinates: function (x, y) {
            var coordsEl = document.getElementById("me-insp-coords");
            if (coordsEl) coordsEl.textContent = "[" + x + ", " + y + "]";
        },

        getSelectValueForNode: function (node) {
            var t = (node.type || "").toLowerCase();
            var sub = (node.subtype || "").toUpperCase();

            if (t === "start") return "start";
            if (t === "castle") return "castle";
            if (t === "town") return "town";
            if (t === "village") return "village";
            if (t === "festival") return "festival";
            if (t === "quest") {
                if (sub === "U3") return "dragon";
                if (sub === "U2") return "monster_u2";
                return "monster_u1";
            }
            if (t === "master") {
                if (sub === "MB") return "master_combat";
                if (sub === "MJ") return "master_ride";
                if (sub === "MT") return "master_dance";
                if (sub === "MCH") return "master_charisma";
                return "master_grand";
            }
            if (t === "horse" || (t === "animal" && sub === "HORSE")) return "animal_horse";
            if (t === "dog" || (t === "animal" && sub === "DOG")) return "animal_dog";
            if (t === "falcon" || (t === "animal" && sub === "FALCON")) return "animal_falcon";
            if (t === "jester") return "jester";
            if (t === "tax") return "tax";
            if (t === "prison") return "prison";
            if (t === "hospital") return "hospital";
            if (t === "tavern") return "tavern";
            if (t === "trade") return "trade";
            if (t === "craft") return "craft";
            if (t === "chance") return "chance";
            if (t === "bonus") return "bonus";

            return "village";
        },

        // Uložení změny typu pole z dropdownu
        applyNodeTypeChange: function (selectVal) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;

            this.pushUndo();

            if (selectVal === "start") {
                node.type = "start";
                node.subtype = null;
                node.name = node.name || "Královský START";
            } else if (selectVal === "castle") {
                node.type = "castle";
                node.subtype = null;
                node.price = 4500;
                node.rent = 1200;
                node.name = "Hrad " + (node.name || "Královský");
            } else if (selectVal === "town") {
                node.type = "town";
                node.subtype = null;
                node.price = 2800;
                node.rent = 750;
                node.name = "Město " + (node.name || "Královské");
            } else if (selectVal === "village") {
                node.type = "village";
                node.subtype = null;
                node.villageLevel = 1;
                node.price = 1400;
                node.rent = 350;
                node.name = "Vesnice " + (node.name || "Královská");
            } else if (selectVal === "festival") {
                node.type = "festival";
                node.subtype = "TOURNAMENT";
                node.name = "Rytířský Turnaj ctností";
            } else if (selectVal === "dragon") {
                node.type = "quest";
                node.subtype = "U3";
                node.name = "Dračí sluj (Obávaný drak)";
            } else if (selectVal === "monster_u2") {
                node.type = "quest";
                node.subtype = "U2";
                node.name = "Brloh krvelačných vlků";
            } else if (selectVal === "monster_u1") {
                node.type = "quest";
                node.subtype = "U1";
                node.name = "Lesní kanec";
            } else if (selectVal === "master_combat") {
                node.type = "master";
                node.subtype = "MB";
                node.name = "Mistr Boje (MB)";
            } else if (selectVal === "master_ride") {
                node.type = "master";
                node.subtype = "MJ";
                node.name = "Mistr Jízdy (MJ)";
            } else if (selectVal === "master_dance") {
                node.type = "master";
                node.subtype = "MT";
                node.name = "Mistr Tance (MT)";
            } else if (selectVal === "master_charisma") {
                node.type = "master";
                node.subtype = "MCH";
                node.name = "Mistr Charismatu (MCH)";
            } else if (selectVal === "master_grand") {
                node.type = "master";
                node.subtype = "VM";
                node.name = "Královský Velmistr (VM)";
            } else if (selectVal === "animal_horse") {
                node.type = "animal";
                node.subtype = "HORSE";
                node.animalLevel = node.animalLevel || 1;
                node.price = 600 * node.animalLevel;
                node.name = "Kůň L" + node.animalLevel;
            } else if (selectVal === "animal_dog") {
                node.type = "animal";
                node.subtype = "DOG";
                node.animalLevel = node.animalLevel || 1;
                node.price = 500 * node.animalLevel;
                node.name = "Pes L" + node.animalLevel;
            } else if (selectVal === "animal_falcon") {
                node.type = "animal";
                node.subtype = "FALCON";
                node.animalLevel = node.animalLevel || 1;
                node.price = 400 * node.animalLevel;
                node.name = "Sokol L" + node.animalLevel;
            } else if (selectVal === "jester") {
                node.type = "jester";
                node.name = "Královský Šašek";
            } else if (selectVal === "tax") {
                node.type = "tax";
                node.name = "Výběrčí daní (VD)";
            } else if (selectVal === "prison") {
                node.type = "prison";
                node.name = "Královská Šatlava";
            } else if (selectVal === "hospital") {
                node.type = "hospital";
                node.name = "Královský Lazaret";
            } else if (selectVal === "tavern") {
                node.type = "tavern";
                node.name = "Krčma U Černého orla";
            } else if (selectVal === "trade") {
                node.type = "trade";
                node.name = "Kupecký dům & Dobytčí trh";
            } else if (selectVal === "craft") {
                node.type = "craft";
                node.name = "Rytířská zbrojírna & Kovárna";
            } else if (selectVal === "chance") {
                node.type = "chance";
                node.name = "Královská náhoda";
            } else if (selectVal === "bonus") {
                node.type = "bonus";
                node.name = "Zapomenutá truhlice zlata";
            }

            this.renderCanvas();
            this.updateInspectorUI();
            if (window.KiDeskyToast) window.KiDeskyToast.show("✨ Pole #" + node.id + " změněno na: " + node.name, "good");
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
        },

        // Uložení změny názvu pole
        applyNodeNameChange: function (newName) {
            if (this.selectedNodeId === null) return;
            var node = this.getNodeById(this.selectedNodeId);
            if (!node) return;
            node.name = newName.trim();
            this.renderCanvas();
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
                // Vpravo dole
                p.style.bottom = "12px";
                p.style.right = "12px";
            } else if (this._inspCorner === 1) {
                // Vpravo nahoře
                p.style.top = "12px";
                p.style.right = "12px";
            } else if (this._inspCorner === 2) {
                // Vlevo nahoře
                p.style.top = "12px";
                p.style.left = "12px";
            } else {
                // Vlevo dole
                p.style.bottom = "12px";
                p.style.left = "12px";
            }
        },

        // ====================================================================
        // ULOŽENÍ A SPUŠTĚNÍ
        // ====================================================================
        saveToMyTemplates: function () {
            if (!this.board) return;
            var customName = prompt("Zadej název této upravené šablony plánu:", this.board.name || "Můj ručně upravený plán");
            if (!customName || !customName.trim()) return;

            this.board.name = customName.trim();
            if (window.PRS_App && typeof window.PRS_App.saveBoardAsTemplate === "function") {
                window.PRS_App.saveBoardAsTemplate(this.board, customName.trim());
            }
        },

        playOnThisBoard: function () {
            if (!this.board) return;
            if (window.PRS_App) {
                // Přepočet mostů přes řeku
                if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                    window.PRS_BoardBuilder.computeRiverBridges(this.board);
                }

                window.PRS_App.mapStudioBoard = JSON.parse(JSON.stringify(this.board));
                window.PRS_App._currentMapStudioBoard = JSON.parse(JSON.stringify(this.board));
                window.PRS_App.customBoardRecipe = this.board.recipe || { nodeCount: this.board.nodes.length, customName: this.board.name };

                window.PRS_App.applyMapStudioBoardAndStart();
            }
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

        // Vykreslí prázdnou kostru HTML do Map Studia (pokud ještě neexistuje)
        renderEditorUI: function () {
            var container = document.getElementById("ms-editor-view");
            if (!container) return;

            // HTML lišta nástrojů a layout
            var html = [
                '<div style="display:flex; flex-direction:column; width:100%; height:100%; gap:0.5rem; min-height:0;">',
                '  <!-- HORNÍ LIŠTA NÁSTROJŮ -->',
                '  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; background:rgba(0,0,0,0.5); padding:0.45rem 0.75rem; border-radius:8px; border:1px solid rgba(212,175,55,0.25);">',
                '    <div style="display:flex; gap:0.35rem; align-items:center; flex-wrap:wrap;">',
                '      <span style="font-size:0.75rem; color:#fde68a; font-weight:bold; margin-right:0.25rem;">Nástroje:</span>',
                '      <button type="button" id="me-tool-select" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'select\')">👆 Inspektor</button>',
                '      <button type="button" id="me-tool-pan" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'pan\')" title="Posouvat celou mapu (tažením myši / prstem)">🧭 Posun mapy</button>',
                '      <button type="button" id="me-tool-move" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'move\')" title="Chytit a přemístit konkrétní políčko">📍 Přesun uzlu</button>',
                '      <button type="button" id="me-tool-swap" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'swap\')">🔄 Prohodit 2 pole</button>',
                '      <button type="button" id="me-tool-link" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem;" onclick="PRS_MapEditor.setTool(\'link\')">🔗 Cesty</button>',
                '      <button type="button" id="me-btn-undo" class="btn-zoom" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#64748b;" onclick="PRS_MapEditor.undo()" title="Vrátit poslední změnu zpět" disabled>↩️ Zpět</button>',
                '    </div>',
                '    <div style="display:flex; gap:0.45rem; align-items:center; flex-wrap:wrap;">',
                '      <!-- ZOOM OVLÁDÁNÍ -->',
                '      <div style="display:flex; align-items:center; gap:2px; background:rgba(0,0,0,0.55); border:1px solid rgba(212,175,55,0.3); border-radius:6px; padding:2px 4px;">',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(0.82)" title="Oddálit (−)">−</button>',
                '        <span id="me-zoom-label" style="font-family:monospace; font-size:0.75rem; color:#fef08a; min-width:44px; text-align:center; cursor:pointer;" onclick="PRS_MapEditor.resetZoom()" title="Resetovat na 100%">100%</span>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.78rem; font-weight:bold;" onclick="PRS_MapEditor.zoomBy(1.22)" title="Přiblížit (+)">+</button>',
                '        <button type="button" class="btn-zoom" style="padding:2px 7px; font-size:0.72rem;" onclick="PRS_MapEditor.fitToScreen()" title="Zobrazit celou mapu">🎯 Celá</button>',
                '      </div>',
                '      <button type="button" class="btn-secondary" style="font-size:0.76rem; padding:0.25rem 0.75rem; border-color:#f59e0b; color:#fde68a;" onclick="PRS_MapEditor.saveToMyTemplates()">⭐ Uložit šablonu</button>',
                '      <button type="button" class="btn-gold-lg" style="font-size:0.76rem; padding:0.25rem 0.85rem;" onclick="PRS_MapEditor.playOnThisBoard()">⚔️ Hrát upravenou mapu →</button>',
                '    </div>',
                '  </div>',
                '',
                '  <!-- STAVOVÁ NÁPOVĚDA -->',
                '  <div id="me-status-help" style="font-size:0.76rem; color:#cbd5e1; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.2); padding:0.3rem 0.75rem; border-radius:6px;">',
                '    👆 <strong>Inspektor:</strong> Klikni na kterékoliv políčko pro zobrazení detailu a změnu jeho parametrů. <em>(Mapou posouváš tažením prázdného pozadí nebo kolečkem myši.)</em>',
                '  </div>',
                '',
                '  <!-- HLAVNÍ PLOCHA S PLÁTNEM A PLOVOUCÍM INSPEKTOREM -->',
                '  <div id="me-canvas-wrapper" style="position:relative; flex:1; min-height:280px; height:100%; overflow:hidden; border-radius:10px; border:1px solid rgba(212,175,55,0.35); background:#120c08;">',
                '    <div id="me-canvas-container" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; touch-action:none;"></div>',
                '',
                '    <!-- PLOVOUCÍ INSPEKTOR POLÍČKA -->',
                '    <div id="me-inspector-panel" style="display:none; position:absolute; bottom:10px; right:10px; width:280px; max-width:calc(100% - 20px); max-height:calc(100% - 20px); overflow-y:auto; overscroll-behavior:contain; box-sizing:border-box; background:rgba(18,12,8,0.97); border:1.5px solid #d4af37; border-radius:10px; padding:0.45rem 0.65rem; box-shadow:0 8px 24px rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:25; scrollbar-width:thin; scrollbar-color:#d4af37 rgba(0,0,0,0.5);">',
                '      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem; border-bottom:1px solid rgba(212,175,55,0.25); padding-bottom:0.2rem;">',
                '        <div style="font-size:0.8rem; font-weight:bold; color:#fef08a; display:flex; align-items:center; gap:0.35rem;">',
                '          <span>⚙️ Inspektor políčka</span>',
                '          <span id="me-insp-id" style="font-family:monospace; color:#38bdf8;">#0</span>',
                '        </div>',
                '        <div style="display:flex; gap:4px; align-items:center;">',
                '          <button type="button" class="btn-zoom" style="font-size:0.7rem; padding:1px 5px; line-height:1;" onclick="PRS_MapEditor.toggleInspectorPosition()" title="Přepnout roh panelu (vpravo dole / nahoře / vlevo)">↕️</button>',
                '          <button type="button" class="btn-icon-danger" style="font-size:0.68rem; padding:1px 5px;" onclick="PRS_MapEditor.closeInspector()" title="Zavřít inspektor">✕</button>',
                '        </div>',
                '      </div>',
                '      <div style="font-size:0.66rem; color:#94a3b8; margin-bottom:0.25rem;">Pozice na mapě: <strong id="me-insp-coords" style="color:#e2e8f0;">[0, 0]</strong></div>',
                '',
                '      <div style="margin-bottom:0.3rem;">',
                '        <label for="me-insp-type" style="font-size:0.7rem; color:#cbd5e1; display:block; margin-bottom:2px;">Druh a typ pole:</label>',
                '        <select id="me-insp-type" class="prs-select" style="width:100%; font-size:0.72rem; padding:0.2rem;" onchange="PRS_MapEditor.applyNodeTypeChange(this.value)">',
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
                '      <div style="margin-bottom:0.4rem;">',
                '        <label for="me-insp-name" style="font-size:0.72rem; color:#cbd5e1; display:block; margin-bottom:2px;">Vlastní název pole:</label>',
                '        <input type="text" id="me-insp-name" class="prs-input" style="width:100%; font-size:0.75rem; padding:0.25rem 0.4rem;" oninput="PRS_MapEditor.applyNodeNameChange(this.value)" placeholder="Např. Hrad Bezděz" />',
                '      </div>',
                '',
                '      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; margin-bottom:0.45rem;">',
                '        <div>',
                '          <label for="me-insp-price" style="font-size:0.72rem; color:#cbd5e1; display:block; margin-bottom:2px;">Cena (zl.):</label>',
                '          <input type="number" id="me-insp-price" class="prs-input" style="width:100%; font-size:0.75rem; padding:0.25rem 0.35rem;" oninput="PRS_MapEditor.applyNodePriceChange(this.value)" step="100" min="0" />',
                '        </div>',
                '        <div style="display:flex; align-items:flex-end;">',
                '          <button type="button" class="btn-secondary" style="width:100%; font-size:0.72rem; padding:0.28rem 0.4rem;" onclick="PRS_MapEditor.setTool(\'swap\'); PRS_MapEditor.swapSourceNodeId = PRS_MapEditor.selectedNodeId; PRS_MapEditor.updateStatusHelp(); PRS_MapEditor.renderCanvas();">🔄 Prohodit</button>',
                '        </div>',
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
