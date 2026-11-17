// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Správa uložených her (Save / Load)
// Podpora pro Solo AI, Hot-Seat i Online Multiplayer s možností substituce botů
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {

        savedGamesFilter: "all",

        // Načte seznam lokálně uložených her z localStorage
        getSavedGames: function () {
            try {
                var raw = localStorage.getItem("prs_saved_games");
                if (!raw) return [];
                var parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Chyba při čtení prs_saved_games:", e);
                return [];
            }
        },

        // Uloží seznam her do localStorage (max. 15 nejnovějších)
        persistSavedGames: function (saves) {
            try {
                if (!Array.isArray(saves)) saves = [];
                if (saves.length > 15) saves = saves.slice(0, 15);
                localStorage.setItem("prs_saved_games", JSON.stringify(saves));
            } catch (e) {
                console.error("Chyba při zápisu prs_saved_games:", e);
            }
        },

        // Otevře modální okno pro uložení aktuální hry
        formatBoardDisplayName: function (name) {
            if (!name) return "";
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (!isEn) return name;
            return name.replace(/Dračí království/gi, "Dragon Realm")
                       .replace(/Královská divočina/gi, "Royal Wilderness")
                       .replace(/Královská delta/gi, "Royal Delta")
                       .replace(/Rytířské kolbiště/gi, "Knight's Arena")
                       .replace(/Vlastní plán/gi, "Custom Map")
                       .replace(/Náhodné království/gi, "Procedural Realm")
                       .replace(/polí/gi, "tiles");
        },

        openSaveGameModal: function () {
            if (!this.state || !this.hasGameStarted) {
                alert("Zatím nebyla rozehrána žádná partie k uložení.");
                return;
            }

            var modal = document.getElementById("save-game-modal");
            if (!modal) return;

            var titleInput = document.getElementById("save-game-title-input");
            var infoEl = document.getElementById("save-game-state-summary");

            var isOnline = Boolean(this.state.roomCode);
            var isHotSeat = !isOnline && this.state.players && this.state.players.filter(function (p) { return p.type === "Human"; }).length > 1;
            var modeName = isOnline ? "Online Multiplayer" : (isHotSeat ? "Hot-Seat u stolu" : "Solo výprava proti PC");

            var roundNum = this.state.roundNumber || 1;
            var turnNum = this.state.turnNumber || 0;
            var activeP = (this.state.players && this.state.players[this.state.currentPlayerIndex]) ? this.state.players[this.state.currentPlayerIndex].name : "Neznámý";

            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var defaultTitle = modeName + (isEn ? " – Round " : " – Kolo ") + roundNum + " (" + new Date().toLocaleTimeString(isEn ? "en-US" : "cs-CZ", { hour: "2-digit", minute: "2-digit" }) + ")";
            if (titleInput) {
                titleInput.value = defaultTitle;
                setTimeout(function () { titleInput.select(); }, 100);
            }

            var tplInput = document.getElementById("save-game-template-name-input");
            var curBName = (this.state.board && this.state.board.name) ? this.state.board.name : "Vlastní plán";
            if (tplInput) {
                tplInput.value = curBName;
            }

            if (infoEl) {
                var playersHtml = [];
                for (var i = 0; i < (this.state.players || []).length; i++) {
                    var pl = this.state.players[i];
                    playersHtml.push(
                        '<span class="save-game-player-chip" style="border-left:3px solid ' + (pl.color || '#d4af37') + ';">' +
                        this.escapeHtml(this.getPlayerDisplayName ? this.getPlayerDisplayName(pl) : pl.name) + ' (' + (pl.totalHearts || 0) + ' 💖, ' + (pl.gold || 0).toLocaleString(isEn ? 'en-US' : 'cs-CZ') + ' ' + (isEn ? 'g.' : 'zl.') + ')' +
                        '</span>'
                    );
                }

                infoEl.innerHTML =
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.45rem; flex-wrap:wrap; gap:0.4rem;">' +
                    '  <span class="lp-mode-badge" style="margin:0;">' + (isOnline ? '🌐 ' : '🎲 ') + modeName + '</span>' +
                    '  <span style="color:var(--gold-light); font-weight:700; font-size:0.84rem;">Kolo ' + roundNum + ' • Tah #' + turnNum + '</span>' +
                    '</div>' +
                    '<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.5rem;">Na tahu: <strong style="color:#fff;">' + this.escapeHtml(activeP) + '</strong>' +
                    (isOnline ? ' | Kód stolu: <strong style="color:#38bdf8;">' + this.state.roomCode + '</strong>' : '') +
                    '</div>' +
                    '<div style="display:flex; gap:0.35rem; flex-wrap:wrap;">' + playersHtml.join("") + '</div>';
            }

            modal.style.display = "flex";
            this.updateBodyModalClass();
        },

        // Zavře modální okno pro uložení hry
        closeSaveGameModal: function () {
            var modal = document.getElementById("save-game-modal");
            if (modal) modal.style.display = "none";
            this.updateBodyModalClass();
        },

        // Potvrzení uložení hry
        confirmSaveGame: function () {
            var titleInput = document.getElementById("save-game-title-input");
            var title = titleInput ? titleInput.value.trim() : "";
            if (!title) {
                title = "Výprava " + new Date().toLocaleString("cs-CZ");
            }

            var tplCheck = document.getElementById("save-game-as-template-check");
            var tplInput = document.getElementById("save-game-template-name-input");
            if (tplCheck && tplCheck.checked && this.state && this.state.board) {
                var tplName = (tplInput && tplInput.value.trim()) ? tplInput.value.trim() : (this.state.board.name || "Vlastní plán");
                this.saveBoardAsTemplate(this.state.board, tplName);
            }

            this.saveCurrentGame(title);
            this.closeSaveGameModal();
        },

        // Uloží herní plán do stálých šablon (Map Studio / Moje plány)
        saveBoardAsTemplate: function (board, customName) {
            if (!board) return;
            var list = [];
            try { list = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { list = []; }

            var recipe = board.recipe || (this.customBoardRecipe ? JSON.parse(JSON.stringify(this.customBoardRecipe)) : null);
            if (!recipe && window.KiDeskyMapGenerator) {
                recipe = JSON.parse(JSON.stringify(window.KiDeskyMapGenerator.DEFAULT_RECIPE));
            }
            if (!recipe) recipe = { nodeCount: (board.nodes ? board.nodes.length : 96) };

            var seed = board.seed || (board.options && board.options.seed) || this.mapStudioSeed || 12345;
            var nodeCount = (board.nodes && board.nodes.length) ? board.nodes.length : (recipe.nodeCount || 96);
            var name = customName || recipe.customName || board.name || ("Vlastní plán #" + seed);
            recipe.customName = name;
            recipe.seed = seed;

            // Zkontrolujeme, zda již stejný plán (dle jména nebo seedu) neexistuje
            var existingIdx = -1;
            for (var i = 0; i < list.length; i++) {
                if (list[i].name === name || (list[i].seed === seed && list[i].nodeCount === nodeCount)) {
                    existingIdx = i;
                    break;
                }
            }

            var entry = {
                id: (existingIdx !== -1) ? list[existingIdx].id : ("map_" + Date.now()),
                code: board.seedCode || ("KID-" + seed),
                name: name,
                seed: seed,
                nodeCount: nodeCount,
                recipe: recipe,
                customBoard: JSON.parse(JSON.stringify(board)),
                savedAt: new Date().toLocaleString("cs-CZ")
            };

            if (existingIdx !== -1) {
                list.splice(existingIdx, 1);
            }
            list.unshift(entry);

            try { localStorage.setItem("prs_saved_maps", JSON.stringify(list)); } catch (e) { }

            if (this.refreshBoardTemplateSelects) this.refreshBoardTemplateSelects();
            if (this.renderSavedMapsInStudio) this.renderSavedMapsInStudio();
            if (this.updateSavedGamesUI) this.updateSavedGamesUI();
            if (this.renderSavedGamesList) this.renderSavedGamesList();

            if (window.KiDeskyToast) {
                window.KiDeskyToast.show("⭐ Šablona plánu „" + name + "“ byla uložena do mých plánů!", "good");
            }
        },

        // Provede samotné uložení stavu
        saveCurrentGame: function (customTitle) {
            if (!this.state || !this.hasGameStarted) return;

            var isOnline = Boolean(this.state.roomCode);
            var isHotSeat = !isOnline && this.state.players && this.state.players.filter(function (p) { return p.type === "Human"; }).length > 1;
            var mode = isOnline ? "Online" : (isHotSeat ? "HotSeat" : "Solo_AI");

            var title = customTitle || ("Výprava – Kolo " + (this.state.roundNumber || 1));
            var saveId = "save_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

            var playersSummary = [];
            for (var i = 0; i < (this.state.players || []).length; i++) {
                var p = this.state.players[i];
                playersSummary.push({
                    name: p.name,
                    type: p.type,
                    gold: p.gold || 0,
                    hearts: p.totalHearts || 0,
                    pawnId: p.pawnId || "knight_valiant",
                    color: p.color || "#d4af37"
                });
            }

            var boardName = (this.state.board && this.state.board.name) ? this.state.board.name : "Královský plán";
            var nodeCount = (this.state.board && this.state.board.nodes) ? this.state.board.nodes.length : 96;

            var saveEntry = {
                id: saveId,
                title: title,
                mode: mode,
                roomCode: this.state.roomCode || null,
                sessionGuid: this.state.sessionGuid || null,
                boardCode: (this.state.board && this.state.board.code) ? this.state.board.code : "classic_96",
                boardName: boardName,
                nodeCount: nodeCount,
                targetHearts: (this.state.config && this.state.config.targetHearts) || 30,
                roundNumber: this.state.roundNumber || 1,
                turnNumber: this.state.turnNumber || 0,
                currentPlayerIndex: this.state.currentPlayerIndex || 0,
                myOnlinePlayerIndex: (typeof this.myOnlinePlayerIndex === "number") ? this.myOnlinePlayerIndex : 0,
                savedAt: new Date().toISOString(),
                savedAtFormatted: new Date().toLocaleString("cs-CZ"),
                playersSummary: playersSummary,
                stateJson: JSON.stringify(this.state)
            };

            // Uloží do lokální historie uložených her
            var saves = this.getSavedGames();
            // Pokud již stejný roomCode existuje, aktualizujeme ho
            if (saveEntry.roomCode) {
                saves = saves.filter(function (s) { return s.roomCode !== saveEntry.roomCode; });
            }
            saves.unshift(saveEntry);
            this.persistSavedGames(saves);

            // Pokud je to online místnost, odešleme i na server
            if (isOnline) {
                if (typeof this.saveCurrentSessionToCloud === "function") {
                    this.saveCurrentSessionToCloud();
                } else if (typeof this.saveOnlineSessionState === "function") {
                    this.saveOnlineSessionState(null, false);
                }
            }

            // Oznámení pro hráče
            this.addLog("💾 Výprava „" + title + "“ byla úspěšně uložena.", "turn");
            if (window.PRS_Audio) window.PRS_Audio.playNotice();

            this.updateSavedGamesUI();
            alert("✅ Výprava byla úspěšně uložena!\n\nNázev: " + title + "\nNajdeš ji v Rytířské herně pod záložkou „Uložené výpravy“.");
        },

        // Smaže uloženou hru
        deleteSavedGame: async function (saveId) {
            var conf = await KiDeskyDialog.confirm("Opravdu si přeješ smazat tuto uloženou výpravu z paměti?", {
                title: "Smazat uloženou výpravu",
                icon: "🗑️",
                isDanger: true,
                confirmText: "🗑️ Ano, smazat",
                cancelText: "Ponechat"
            });
            if (!conf) return;

            var saves = this.getSavedGames().filter(function (s) { return s.id !== saveId; });
            this.persistSavedGames(saves);
            this.updateSavedGamesUI();
            this.renderSavedGamesList();
        },

        // Sanitizace obnoveného stavu (zpětná kompatibilita pro starší savy a autosave)
        sanitizeRestoredState: function (restoredState) {
            if (!restoredState) return;
            if (restoredState.pendingAction) {
                var pa = restoredState.pendingAction;
                if (pa.canUpgradeVillage && (typeof pa.upgradeCost !== "number" || isNaN(pa.upgradeCost))) {
                    var prices = (restoredState.config && restoredState.config.estates && restoredState.config.estates.villagePrices) ? restoredState.config.estates.villagePrices : [0, 1500, 3000];
                    var n = (restoredState.board && restoredState.board.nodes && pa.nodeId !== undefined) ? restoredState.board.nodes[pa.nodeId] : null;
                    var lv = (n && n.villageLevel) ? n.villageLevel : 1;
                    pa.upgradeCost = prices[lv] || 1500;
                }
                if (pa.canBuyNode && (typeof pa.buyPrice !== "number" || isNaN(pa.buyPrice))) {
                    var nBuy = (restoredState.board && restoredState.board.nodes && pa.nodeId !== undefined) ? restoredState.board.nodes[pa.nodeId] : null;
                    pa.buyPrice = (nBuy && nBuy.price) ? nBuy.price : 1000;
                }
            }
            if (Array.isArray(restoredState.players)) {
                for (var pi = 0; pi < restoredState.players.length; pi++) {
                    var plObj = restoredState.players[pi];
                    if (typeof plObj.gold !== "number" || isNaN(plObj.gold)) plObj.gold = 0;
                    if (typeof plObj.totalHearts !== "number" || isNaN(plObj.totalHearts)) plObj.totalHearts = 0;
                    if (!Array.isArray(plObj.ownedNodes)) plObj.ownedNodes = [];
                    if (!Array.isArray(plObj.inventory)) plObj.inventory = [];
                    if (!plObj.skills || typeof plObj.skills !== "object") plObj.skills = { combat: 0, riding: 0, dance: 0, charisma: 0 };
                }
            }
            if (restoredState.board && restoredState.board.rivers && restoredState.board.rivers.length > 0 && (!restoredState.board.bridges || restoredState.board.bridges.length === 0)) {
                if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                    window.PRS_BoardBuilder.computeRiverBridges(restoredState.board);
                }
            }
            if (restoredState.board && restoredState.board.nodes && restoredState.board.decorationsVersion !== 3) {
                if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.generateBoardDecorations === "function") {
                    window.PRS_BoardBuilder.generateBoardDecorations(restoredState.board, restoredState.board.seed || 1000);
                }
            }
        },

        // Pomocný objekt metadat pro poslední aktivní / automaticky uloženou hru
        getActiveAutosaveMeta: function () {
            try {
                var raw = localStorage.getItem("prs_active_autosave");
                var data = raw ? JSON.parse(raw) : null;
                var st = null;
                var ts = (data && typeof data.timestamp === "number") ? data.timestamp : 0;

                if (this.hasGameStarted && this.state && this.state.players && this.state.phase !== "GAME_OVER") {
                    st = this.state;
                    if (!ts) ts = Date.now();
                } else if (data && data.stateJson) {
                    st = JSON.parse(data.stateJson);
                }

                if (!st || !Array.isArray(st.players) || st.phase === "GAME_OVER") return null;

                var isOnline = Boolean(st.roomCode);
                var humanCount = 0;
                for (var i = 0; i < st.players.length; i++) {
                    if (st.players[i] && st.players[i].type === "Human") humanCount++;
                }
                var mode = isOnline ? "Online" : (humanCount > 1 ? "HotSeat" : "Solo AI");
                var curP = st.players[st.currentPlayerIndex || 0];

                return {
                    timestamp: ts,
                    savedAtFormatted: ts ? new Date(ts).toLocaleString("cs-CZ") : "Právě teď",
                    roundNumber: st.roundNumber || 1,
                    turnNumber: st.turnNumber || 0,
                    targetHearts: (st.config && st.config.targetHearts) || 30,
                    mode: mode,
                    roomCode: st.roomCode || null,
                    boardName: (st.board && st.board.name) ? st.board.name : ((st.board && st.board.code) || "Královský plán"),
                    currentPlayerName: curP ? (this.getPlayerDisplayName ? this.getPlayerDisplayName(curP) : curP.name) : "Rytíř",
                    players: st.players
                };
            } catch (e) {
                return null;
            }
        },

        // Uloží aktuální rozehranou hru do automatického autosavu (pro zachování při F5, Ctrl+F5)
        saveActiveGameAutosave: function () {
            if (!this.state || !this.hasGameStarted) return;
            if (this.state.phase === "GAME_OVER") {
                this.clearActiveGameAutosave();
                return;
            }
            try {
                var payload = {
                    timestamp: Date.now(),
                    currentBoardSeed: this.currentBoardSeed,
                    selectedRoyalCastle: this.selectedRoyalCastle,
                    selectedGameScenario: this.selectedGameScenario,
                    selectedDifficultyMode: this.selectedDifficultyMode,
                    customBoardRecipe: this.customBoardRecipe,
                    stateJson: JSON.stringify(this.state)
                };
                localStorage.setItem("prs_active_autosave", JSON.stringify(payload));
                if (!this.activeTab || this.activeTab === "board") {
                    sessionStorage.setItem("prs_active_tab", "board");
                }
                this.updateResumeGameButtonUI();
                if (this.updateSavedGamesUI) this.updateSavedGamesUI();
            } catch (e) {
                console.warn("[Autosave] Nelze zapsat autosave:", e);
            }
        },

        // Vymaže automatický autosave (při řádném skončení hry nebo potvrzeném novém začátku)
        clearActiveGameAutosave: function () {
            try {
                localStorage.removeItem("prs_active_autosave");
                sessionStorage.removeItem("prs_active_tab");
            } catch (e) { }
            this.updateResumeGameButtonUI();
        },

        // Pokusí se obnovit hru z autosavu
        tryRestoreActiveGameAutosave: function () {
            try {
                var raw = localStorage.getItem("prs_active_autosave");
                if (!raw) return false;
                var data = JSON.parse(raw);
                if (!data || !data.stateJson) return false;
                var restored = JSON.parse(data.stateJson);
                if (!restored || !restored.players || restored.phase === "GAME_OVER") {
                    this.clearActiveGameAutosave();
                    return false;
                }

                this.sanitizeRestoredState(restored);
                this.state = restored;
                this.hasGameStarted = true;
                this.currentBoardSeed = data.currentBoardSeed || (restored.board && restored.board.seed);
                this.selectedRoyalCastle = data.selectedRoyalCastle || "auto";
                this.selectedGameScenario = data.selectedGameScenario || "classic";
                this.selectedDifficultyMode = data.selectedDifficultyMode || "standard";
                if (data.customBoardRecipe) this.customBoardRecipe = data.customBoardRecipe;
                if (restored.board) {
                    this._customProceduralBoard = restored.board;
                    this._currentMapStudioBoard = restored.board;
                    this.mapStudioBoard = restored.board;
                }

                this.isBoardStaticDirty = true;
                this.isMoveAnimating = false;
                this.animatingPlayerIndex = null;
                this.animTokenPos = null;
                return true;
            } catch (e) {
                console.error("[Auto-Restore] Chyba při obnově autosavu:", e);
                return false;
            }
        },

        // Obnoví a vstoupí do rozehrané hry z tlačítka na Landing Page nebo v Rytířské herně
        resumeActiveAutosavedGame: function () {
            if (this.hasGameStarted && this.state && this.state.players && this.state.phase !== "GAME_OVER") {
                this.switchTab("board");
                this.renderGameScreen();
                this.updateUserUI();
                if (this.centerOnActivePlayer) this.centerOnActivePlayer();
                if (this.scheduleBotTurnIfNeeded) this.scheduleBotTurnIfNeeded();
                if (window.KiDeskyToast) {
                    window.KiDeskyToast.show("⚔️ Návrat ke stolu aktuální rozehrané výpravy!", "good");
                }
                return;
            }
            if (this.tryRestoreActiveGameAutosave()) {
                this.switchTab("board");
                this.renderGameScreen();
                this.updateUserUI();
                if (this.centerOnActivePlayer) this.centerOnActivePlayer();
                if (this.scheduleBotTurnIfNeeded) this.scheduleBotTurnIfNeeded();
                if (window.KiDeskyToast) {
                    window.KiDeskyToast.show("🛡️ Návrat ke stolu rozehrané výpravy!", "good");
                }
            } else {
                alert("Nebyly nalezeny žádné uložené kroky rozehrané partie.");
            }
        },

        // Zahodí rozehranou hru z autosavu z Landing Page
        discardActiveAutosavedGame: async function () {
            var conf = await KiDeskyDialog.confirm("Přeješ si definitivně zahodit rozehranou partii a začít novou výpravu od začátku?", {
                title: "Zahodit rozehranou partii",
                icon: "🗑️",
                isDanger: true,
                confirmText: "🗑️ Ano, zahodit",
                cancelText: "Ponechat hru"
            });
            if (!conf) return;
            this.clearActiveGameAutosave();
            this.hasGameStarted = false;
            this.state = null;
            if (window.KiDeskyToast) {
                window.KiDeskyToast.show("Rozehraná partie byla smazána.", "turn");
            }
        },

        // Aktualizuje vizuální stav banneru na Landing Page pro návrat do rozehrané hry
        updateResumeGameButtonUI: function () {
            var banner = document.getElementById("welcome-resume-game-banner");
            var desc = document.getElementById("welcome-resume-game-desc");
            if (!banner) return;

            try {
                var raw = localStorage.getItem("prs_active_autosave");
                if (!raw) {
                    banner.style.display = "none";
                    return;
                }
                var data = JSON.parse(raw);
                if (!data || !data.stateJson) {
                    banner.style.display = "none";
                    return;
                }
                var st = JSON.parse(data.stateJson);
                if (!st || !st.players || st.phase === "GAME_OVER") {
                    banner.style.display = "none";
                    return;
                }

                var roundNum = st.roundNumber || 1;
                var turnNum = st.turnNumber || 0;
                var curP = (st.players && st.players[st.currentPlayerIndex]) ? st.players[st.currentPlayerIndex].name : "Rytíř";
                var bName = (st.board && st.board.name) ? st.board.name : "Království";

                if (desc) {
                    desc.innerHTML = "Kolo " + roundNum + " (Tah #" + turnNum + ") • Na tahu: <strong>" + this.escapeHtml(curP) + "</strong> • Mapa: " + this.escapeHtml(bName);
                }
                banner.style.display = "block";
            } catch (e) {
                banner.style.display = "none";
            }
        },

        // Načte uloženou hru (Solo / Hot-Seat / Online)
        loadSavedGame: function (saveId) {
            var saves = this.getSavedGames();
            var target = null;
            for (var i = 0; i < saves.length; i++) {
                if (saves[i].id === saveId) {
                    target = saves[i];
                    break;
                }
            }

            if (!target) {
                alert("Uložená hra nebyla nalezena.");
                return;
            }

            // Pokud je to online místnost, nabídneme správu křesel u stolu
            if (target.mode === "Online" && target.roomCode) {
                this.loadOnlineSavedGame(target);
                return;
            }

            // Lokální obnova stavu pro Solo AI a Hot-Seat
            try {
                var restoredState = JSON.parse(target.stateJson);

                this.sanitizeRestoredState(restoredState);

                this.state = restoredState;
                this.hasGameStarted = true;
                this.isBoardStaticDirty = true;
                this.isMoveAnimating = false;
                this.animatingPlayerIndex = null;
                this.animTokenPos = null;

                // Uložíme i do aktivního autosavu
                this.saveActiveGameAutosave();

                // Přepneme na herní stůl
                this.switchTab("board");
                this.renderGameScreen();
                this.updateUserUI();

                this.addLog("📂 Načtena uložená výprava „" + target.title + "“ (Kolo " + (this.state.roundNumber || 1) + ").", "turn");
                if (window.PRS_Audio) window.PRS_Audio.playNotice();

                // Pokud je na tahu bot, spustíme jeho tah
                this.scheduleBotTurnIfNeeded();

            } catch (err) {
                console.error("Chyba při nahrávání uloženého stavu:", err);
                alert("Nastala chyba při načítání stavu hry: " + err.message);
            }
        },

        // Načtení online multiplayerové hry s volbou pokračování (Nové hostování, solo proti botům, nebo původní stůl)
        loadOnlineSavedGame: function (saveEntry) {
            var self = this;
            if (!saveEntry) return;

            var rCode = saveEntry.roomCode || "ONLINE";

            KiDeskyDialog.choice(
                "Tato uložená výprava pochází z <strong>Online multiplayeru</strong> (Původní stůl: <code>" + self.escapeHtml(rCode) + "</code>).<br><br>Jak si přeješ v této výpravě pokračovat?",
                [
                    {
                        id: "new_host",
                        label: "👑 Založit nový Online stůl (Být hostitelem)",
                        description: "Vytvoří novou online místnost ze stavu hry, kde budeš hostitelem Ty. Ostatní hráče můžeš nahradit přáteli nebo PC boty.",
                        isPrimary: true
                    },
                    {
                        id: "solo_bots",
                        label: "🤖 Hrát lokálně proti PC botům (Offline)",
                        description: "Odpojí partii ze sítě a převede ostatní lidské hráče na inteligentní PC boty. Můžeš hrát ihned offline.",
                        isPrimary: false
                    },
                    {
                        id: "original_room",
                        label: "🔄 Připojit se k původnímu stolu (" + self.escapeHtml(rCode) + ")",
                        description: "Pokusí se načíst aktuální živý stav původní online místnosti ze serveru.",
                        isPrimary: false
                    }
                ],
                {
                    title: "Načtení multiplayerové výpravy",
                    icon: "🏰"
                }
            ).then(function (chosenMode) {
                if (!chosenMode) return;

                if (chosenMode === "new_host") {
                    self.branchSavedGameToNewOnlineRoom(saveEntry);
                } else if (chosenMode === "solo_bots") {
                    self.branchSavedGameToSoloBots(saveEntry);
                } else if (chosenMode === "original_room") {
                    self.connectToOriginalOnlineRoom(saveEntry);
                }
            });
        },

        // Vytvoří novou online místnost, kde se načítající hráč stane hostitelem
        branchSavedGameToNewOnlineRoom: function (saveEntry) {
            var self = this;
            try {
                var newState = JSON.parse(saveEntry.stateJson);
                if (typeof this.sanitizeRestoredState === "function") {
                    this.sanitizeRestoredState(newState);
                }

                // Vymažeme původní identifikátory místnosti, aby vznikla nová
                newState.roomCode = null;
                newState.sessionGuid = null;

                var myClientId = (typeof this.getOnlineClientId === "function") ? this.getOnlineClientId() : "client_host";
                var targetSlot = 0;
                if (typeof saveEntry.myOnlinePlayerIndex === "number" && saveEntry.myOnlinePlayerIndex >= 0 && saveEntry.myOnlinePlayerIndex < (newState.players || []).length) {
                    targetSlot = saveEntry.myOnlinePlayerIndex;
                }

                if (newState.players && Array.isArray(newState.players)) {
                    for (var i = 0; i < newState.players.length; i++) {
                        var p = newState.players[i];
                        if (i === targetSlot) {
                            p.type = "Human";
                            p.isOnlineHost = true;
                            p.claimedBy = myClientId;
                            if (this.currentUser && this.currentUser.role !== "Guest") {
                                p.name = this.currentUser.displayName || this.currentUser.username || p.name;
                            }
                        } else {
                            delete p.isOnlineHost;
                            delete p.claimedBy;
                            p.type = "Bot_Balanced";
                            p.pawnId = "bot_balanced";
                            var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                            p.name = cleanName + " (PC)";
                        }
                    }
                }

                this.state = newState;
                this.myOnlinePlayerIndex = targetSlot;
                this.hasGameStarted = true;
                this.isBoardStaticDirty = true;
                this.isMoveAnimating = false;

                this.switchTab("board");
                this.renderGameScreen();
                this.updateUserUI();

                // Okamžitě zaregistrujeme nový online stůl na serveru a získáme nový kód místnosti
                if (typeof this.saveOnlineGameState === "function") {
                    this.saveOnlineGameState();
                } else if (typeof this.saveCurrentSessionToCloud === "function") {
                    this.saveCurrentSessionToCloud();
                }

                this.addLog("👑 Založil jsi nový online stůl z uložené výpravy! Jsi hostitelem hry.", "win");
            } catch (err) {
                console.error("Chyba při zakládání nového online stolu z uložené hry:", err);
                KiDeskyDialog.alert("Nepodařilo se vytvořit nový online stůl: " + err.message, { title: "Chyba", icon: "⚠️" });
            }
        },

        // Převede uloženou hru na čistě lokální hru proti inteligentním PC botům
        branchSavedGameToSoloBots: function (saveEntry) {
            var self = this;
            try {
                var newState = JSON.parse(saveEntry.stateJson);
                if (typeof this.sanitizeRestoredState === "function") {
                    this.sanitizeRestoredState(newState);
                }

                newState.roomCode = null;
                newState.sessionGuid = null;

                var targetSlot = 0;
                if (typeof saveEntry.myOnlinePlayerIndex === "number" && saveEntry.myOnlinePlayerIndex >= 0 && saveEntry.myOnlinePlayerIndex < (newState.players || []).length) {
                    targetSlot = saveEntry.myOnlinePlayerIndex;
                }

                if (newState.players && Array.isArray(newState.players)) {
                    for (var i = 0; i < newState.players.length; i++) {
                        var p = newState.players[i];
                        if (i === targetSlot) {
                            p.type = "Human";
                            delete p.isOnlineHost;
                            delete p.claimedBy;
                        } else {
                            p.type = "Bot_Balanced";
                            p.pawnId = "bot_balanced";
                            delete p.isOnlineHost;
                            delete p.claimedBy;
                            var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                            p.name = cleanName + " (PC)";
                        }
                    }
                }

                try {
                    localStorage.removeItem("prs_active_online_room");
                    if (window.history && window.history.replaceState) {
                        window.history.replaceState(null, "", window.location.pathname);
                    }
                } catch (e) { }

                this.state = newState;
                this.myOnlinePlayerIndex = targetSlot;
                this.hasGameStarted = true;
                this.isBoardStaticDirty = true;
                this.isMoveAnimating = false;

                if (typeof this.saveActiveGameAutosave === "function") {
                    this.saveActiveGameAutosave();
                }

                this.switchTab("board");
                this.renderGameScreen();
                this.updateUserUI();

                this.addLog("🤖 Pokračuješ v rozehrané výpravě lokálně proti PC botům.", "turn");
                if (window.PRS_Audio) window.PRS_Audio.playNotice();

                this.scheduleBotTurnIfNeeded();
            } catch (err) {
                console.error("Chyba při přechodu na solo hru:", err);
                KiDeskyDialog.alert("Nepodařilo se načíst hru proti botům: " + err.message, { title: "Chyba", icon: "⚠️" });
            }
        },

        // Připojí se k původnímu online stolu
        connectToOriginalOnlineRoom: function (saveEntry) {
            var self = this;
            var roomCode = saveEntry.roomCode;
            fetch("api.ashx?action=load-session&code=" + encodeURIComponent(roomCode))
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.session && res.session.stateJson) {
                        self.state = JSON.parse(res.session.stateJson);
                        self.state.sessionGuid = res.session.sessionGuid;
                        self.state.roomCode = res.session.roomCode;
                        self.lastKnownTurnNumber = self.state.turnNumber;
                    } else {
                        self.state = JSON.parse(saveEntry.stateJson);
                    }
                    self.hasGameStarted = true;
                    self.isBoardStaticDirty = true;
                    self.switchTab("board");
                    self.renderGameScreen();
                    self.openOnlineSeatsModal();
                })
                .catch(function () {
                    self.state = JSON.parse(saveEntry.stateJson);
                    self.hasGameStarted = true;
                    self.isBoardStaticDirty = true;
                    self.switchTab("board");
                    self.renderGameScreen();
                    self.openOnlineSeatsModal();
                });
        },

        // Přepne filtr uložených her v herně
        setSavedGamesFilter: function (filter) {
            this.savedGamesFilter = filter || "all";
            var tabs = ["all", "solo", "online", "maps"];
            for (var i = 0; i < tabs.length; i++) {
                var btn = document.getElementById("save-tab-" + tabs[i]);
                if (btn) {
                    if (tabs[i] === this.savedGamesFilter) btn.classList.add("active");
                    else btn.classList.remove("active");
                }
            }
            this.renderSavedGamesList();
        },

        // Vykreslí seznam uložených her a šablon plánů v Rytířské herně
        renderSavedGamesList: function () {
            var container = document.getElementById("saved-games-container");
            if (!container) return;

            var saves = this.getSavedGames();
            var savedMaps = [];
            try { savedMaps = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { savedMaps = []; }
            var filter = this.savedGamesFilter || "all";

            // 1. ZVLÁŠTNÍ POHLED: POUZE ŠABLONY PLÁNŮ
            if (filter === "maps") {
                if (savedMaps.length === 0) {
                    container.innerHTML =
                        '<div class="empty-note" style="padding:2rem 1rem; text-align:center;">' +
                        '  <div style="font-size:2.4rem; margin-bottom:0.5rem;">🗺️</div>' +
                        '  <strong style="color:var(--gold-light); font-size:1rem; display:block; margin-bottom:0.35rem;">Zatím nemáš žádné uložené šablony vlastních plánů</strong>' +
                        '  <p style="color:var(--text-muted); font-size:0.84rem; max-width:440px; margin:0 auto 1rem;">' +
                        '    V Královském Map Studiu si můžeš libovolně navolit zvířata, hrady, města, řeku i draky a sestavu uložit tlačítkem <strong>💾 Uložit do mých šablon</strong>.' +
                        '  </p>' +
                        '  <button class="btn-gold-lg" style="font-size:0.86rem; padding:0.45rem 1rem;" onclick="PRS_App.openMapStudioModal()">🛠️ Otevřít Map Studio a vytvořit plán</button>' +
                        '</div>';
                    return;
                }

                var mapsHtml = [];
                for (var m = 0; m < savedMaps.length; m++) {
                    var sm = savedMaps[m];
                    var r = sm.recipe || {};
                    var aCnt = Array.isArray(r.animalLevels) ? r.animalLevels.length : 12;
                    mapsHtml.push(
                        '<div class="save-game-card" style="border-color:rgba(168,85,247,0.45); background:rgba(88,28,135,0.14);">' +
                        '  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; gap:0.5rem; flex-wrap:wrap;">' +
                        '    <div>' +
                        '      <h4 style="font-family:\'Cinzel\',serif; color:#fef08a; font-size:1.05rem; margin:0 0 0.25rem;">' +
                        '        ⭐ ' + this.escapeHtml(sm.name || ("Vlastní plán #" + sm.seed)) +
                        '      </h4>' +
                        '      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.76rem; color:var(--text-muted);">' +
                        '        <span class="lp-mode-badge" style="background:rgba(168,85,247,0.25); color:#e9d5ff; border-color:#c084fc;">Dynamická šablona</span>' +
                        '        <span style="color:#fde047; font-weight:700;">📍 ' + (sm.nodeCount || 96) + ' polí</span>' +
                        '        <span>🎲 Seed #' + (sm.seed || "—") + '</span>' +
                        '        <span>🕒 ' + (sm.savedAt || "Uloženo") + '</span>' +
                        '      </div>' +
                        '    </div>' +
                        '    <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">' +
                        '      <button class="btn-gold-lg" style="font-size:0.8rem; padding:0.35rem 0.8rem;" onclick="PRS_App.playOnSavedFavoriteMap(' + m + ')">⚔️ Hrát na plánu</button>' +
                        '      <button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem; border-color:#a855f7; color:#e9d5ff;" onclick="PRS_App.editSavedFavoriteMapInStudio(' + m + ')">🛠️ Upravit</button>' +
                        '      <button class="btn-icon-danger" style="padding:0.3rem 0.55rem; font-size:0.85rem;" onclick="PRS_App.deleteSavedFavoriteMap(' + m + ', event)" title="Smazat tuto šablonu plánu">🗑️</button>' +
                        '    </div>' +
                        '  </div>' +
                        '  <div style="display:flex; gap:0.4rem; flex-wrap:wrap; font-size:0.73rem; color:#cbd5e1; margin-top:0.35rem; padding-top:0.35rem; border-top:1px solid rgba(168,85,247,0.2);">' +
                        '    <span>🐎 ' + aCnt + ' sad zvířat</span>' +
                        '    <span>🏰 ' + (r.castles !== undefined ? r.castles : 3) + ' hradů</span>' +
                        '    <span>🏙️ ' + (r.towns !== undefined ? r.towns : 6) + ' měst</span>' +
                        '    <span>🏘️ ' + (r.villages !== undefined ? r.villages : 8) + ' vesnic</span>' +
                        '    <span>🐲 ' + (r.questsU3 !== undefined ? r.questsU3 : 2) + ' draků</span>' +
                        '    <span>🌊 Řeka: ' + (r.riverMode === "none" ? "Bez řeky" : (r.riverMode === "dual" ? "Soutok 2 řek" : (r.riverMode === "island" ? "Říční ostrov" : (r.riverMode === "delta" ? "Říční delta" : "Královská")))) + '</span>' +
                        '  </div>' +
                        '</div>'
                    );
                }
                container.innerHTML = '<div class="saved-games-grid">' + mapsHtml.join("\n") + '</div>';
                return;
            }

            if (filter === "solo") {
                saves = saves.filter(function (s) { return s.mode !== "Online"; });
            } else if (filter === "online") {
                saves = saves.filter(function (s) { return s.mode === "Online"; });
            }

            var html = [];
            var saveCards = [];

            // 1b. Karta právě rozehrané výpravy z automatického uložení (vždy na 1. místě)
            var activeMeta = (typeof this.getActiveAutosaveMeta === "function") ? this.getActiveAutosaveMeta() : null;
            if (activeMeta) {
                var activeModeMatch = (filter === "all") ||
                    (filter === "solo" && activeMeta.mode !== "Online") ||
                    (filter === "online" && activeMeta.mode === "Online");
                if (activeModeMatch) {
                    var aOnline = (activeMeta.mode === "Online");
                    var aBadgeLabel = aOnline ? "🌐 Online (Kód: " + (activeMeta.roomCode || "—") + ")" : (activeMeta.mode === "HotSeat" ? "🛋️ Hot-Seat" : "⚡ Solo AI");
                    var aBadgeClass = aOnline ? "lp-mode-badge" : "user-pill";
                    var aPills = [];
                    for (var ap = 0; ap < activeMeta.players.length; ap++) {
                        var apl = activeMeta.players[ap];
                        var aIsBot = (apl.type !== "Human");
                        var aGold = (typeof apl.gold === "number" && !isNaN(apl.gold)) ? apl.gold : 0;
                        aPills.push(
                            '<span class="save-game-player-chip" style="border-left:3px solid ' + (apl.color || "#d4af37") + ';">' +
                            (aIsBot ? "🤖 " : "👤 ") + this.escapeHtml(apl.name) + " (" + (apl.totalHearts || 0) + " 💖, " + aGold.toLocaleString("cs-CZ") + " zl.)" +
                            "</span>"
                        );
                    }
                    saveCards.push(
                        '<div class="save-game-card" style="border:1.5px solid #4ade80; background:rgba(34,197,94,0.08);">' +
                        '  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; gap:0.5rem; flex-wrap:wrap;">' +
                        '    <div>' +
                        '      <h4 style="font-family:\'Cinzel\',serif; color:#86efac; font-size:1.05rem; margin:0 0 0.25rem;">🟢 Poslední rozehraná výprava (Automatické uložení)</h4>' +
                        '      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.76rem; color:var(--text-muted);">' +
                        '        <span class="' + aBadgeClass + '" style="font-size:0.7rem; padding:1px 6px;">' + aBadgeLabel + '</span>' +
                        '        <span style="font-size:0.7rem; background:rgba(168,85,247,0.2); border:1px solid rgba(168,85,247,0.4); color:#e9d5ff; padding:1px 6px; border-radius:4px;">🗺️ ' + this.escapeHtml(activeMeta.boardName) + '</span>' +
                        '        <span>🕒 ' + this.escapeHtml(activeMeta.savedAtFormatted) + '</span>' +
                        '        <span>🏆 Kolo ' + activeMeta.roundNumber + ' (Tah #' + activeMeta.turnNumber + ')</span>' +
                        '        <span>🎯 Cíl: ' + activeMeta.targetHearts + ' 💖</span>' +
                        '      </div>' +
                        '    </div>' +
                        '    <div style="display:flex; gap:0.4rem;">' +
                        '      <button class="btn-gold-lg" style="font-size:0.8rem; padding:0.35rem 0.85rem;" onclick="PRS_App.resumeActiveAutosavedGame()">▶️ Pokračovat ve hře</button>' +
                        '    </div>' +
                        '  </div>' +
                        '  <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.4rem; padding-top:0.45rem; border-top:1px solid rgba(74,222,128,0.22);">' +
                        aPills.join("") +
                        '  </div>' +
                        '</div>'
                    );
                }
            }

            // 2. HLAVIČKA ŠABLON PLÁNŮ PŘI ZOBRAZENÍ VŠECH ("all")
            if (filter === "all" && savedMaps.length > 0) {
                var mapChips = [];
                for (var k = 0; k < savedMaps.length; k++) {
                    var mItem = savedMaps[k];
                    mapChips.push(
                        '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(168,85,247,0.18); border:1px solid rgba(168,85,247,0.45); border-radius:6px; padding:3px 8px; font-size:0.75rem; color:#fef08a;">' +
                        '  <strong style="cursor:pointer;" onclick="PRS_App.playOnSavedFavoriteMap(' + k + ')" title="Zahájit hru na tomto plánu">⭐ ' + this.escapeHtml(mItem.name || ("Plán #" + mItem.seed)) + ' (' + (mItem.nodeCount || 96) + ' polí)</strong>' +
                        '  <button class="btn-zoom" style="font-size:0.65rem; padding:1px 5px; border-color:#a855f7; color:#e9d5ff;" onclick="PRS_App.editSavedFavoriteMapInStudio(' + k + ')" title="Upravit v Map Studiu">🛠️</button>' +
                        '  <span onclick="PRS_App.deleteSavedFavoriteMap(' + k + ', event)" style="color:#f87171; cursor:pointer; font-weight:bold; margin-left:2px;" title="Odebrat">×</span>' +
                        '</div>'
                    );
                }
                html.push(
                    '<div style="background:rgba(88,28,135,0.12); border:1px solid rgba(168,85,247,0.35); border-radius:10px; padding:0.65rem 0.85rem; margin-bottom:1rem;">' +
                    '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.4rem;">' +
                    '    <span style="font-size:0.8rem; color:#e9d5ff; font-weight:bold;">⭐ Moje uložené šablony herních plánů (' + savedMaps.length + ')</span>' +
                    '    <button class="btn-zoom" style="font-size:0.72rem; padding:2px 8px; border-color:#a855f7; color:#e9d5ff;" onclick="PRS_App.openMapStudioModal()">🛠️ Nový plán v Map Studiu</button>' +
                    '  </div>' +
                    '  <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">' +
                    mapChips.join("") +
                    '  </div>' +
                    '</div>'
                );
            }

            if (saves.length === 0 && saveCards.length === 0) {
                if (filter === "all" && savedMaps.length > 0) {
                    html.push(
                        '<div class="empty-note" style="padding:1.5rem 1rem; text-align:center;">' +
                        '  <strong style="color:var(--gold-light); font-size:0.95rem; display:block; margin-bottom:0.25rem;">Žádné rozehrané herní partie</strong>' +
                        '  <p style="color:var(--text-muted); font-size:0.82rem; margin:0 auto 0.75rem;">Můžeš zahájit novou výpravu na některé ze svých uložených šablon výše!</p>' +
                        '</div>'
                    );
                    container.innerHTML = html.join("\n");
                    return;
                }
                container.innerHTML =
                    '<div class="empty-note" style="padding:2rem 1rem; text-align:center;">' +
                    '  <div style="font-size:2.4rem; margin-bottom:0.5rem;">📜</div>' +
                    '  <strong style="color:var(--gold-light); font-size:1rem; display:block; margin-bottom:0.35rem;">Zatím nemáš žádné uložené výpravy</strong>' +
                    '  <p style="color:var(--text-muted); font-size:0.84rem; max-width:440px; margin:0 auto 1rem;">' +
                    '    Během kterékoliv partie (Solo AI, Hot-Seat i Online) klikni v horní liště herního stolu na tlačítko <strong>💾 Uložit hru</strong> a partii si můžeš kdykoliv načíst zpět.' +
                    '  </p>' +
                    '  <button class="btn-gold-lg" style="font-size:0.86rem; padding:0.45rem 1rem;" onclick="PRS_App.quickStartSoloGame(\'standard\')">⚡ Spustit novou Solo výpravu</button>' +
                    '</div>';
                return;
            }

            for (var i = 0; i < saves.length; i++) {
                var s = saves[i];
                var isOnline = (s.mode === "Online");
                var badgeLabel = isOnline ? "🌐 Online (Kód: " + (s.roomCode || "—") + ")" : (s.mode === "HotSeat" ? "🛋️ Hot-Seat" : "⚡ Solo AI");
                var badgeClass = isOnline ? "lp-mode-badge" : "user-pill";
                var boardBadge = s.boardName || s.boardCode || "Královský plán";

                var playersPills = [];
                for (var p = 0; p < (s.playersSummary || []).length; p++) {
                    var pl = s.playersSummary[p];
                    var isBot = (pl.type !== "Human");
                    var plGold = (typeof pl.gold === "number" && !isNaN(pl.gold)) ? pl.gold : 0;
                    playersPills.push(
                        '<span class="save-game-player-chip" style="border-left:3px solid ' + (pl.color || '#d4af37') + ';">' +
                        (isBot ? '🤖 ' : '👤 ') + this.escapeHtml(pl.name) + ' (' + (pl.hearts || 0) + ' 💖, ' + plGold.toLocaleString("cs-CZ") + ' zl.)' +
                        '</span>'
                    );
                }

                saveCards.push(
                    '<div class="save-game-card">' +
                    '  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; gap:0.5rem; flex-wrap:wrap;">' +
                    '    <div>' +
                    '      <h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.05rem; margin:0 0 0.25rem;">' + this.escapeHtml(s.title) + '</h4>' +
                    '      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.76rem; color:var(--text-muted);">' +
                    '        <span class="' + badgeClass + '" style="font-size:0.7rem; padding:1px 6px;">' + badgeLabel + '</span>' +
                    '        <span style="font-size:0.7rem; background:rgba(168,85,247,0.2); border:1px solid rgba(168,85,247,0.4); color:#e9d5ff; padding:1px 6px; border-radius:4px;">🗺️ ' + this.escapeHtml(boardBadge) + '</span>' +
                    '        <span>🕒 ' + (s.savedAtFormatted || "Neznámý čas") + '</span>' +
                    '        <span>🏆 Kolo ' + (s.roundNumber || 1) + ' (Tah #' + (s.turnNumber || 0) + ')</span>' +
                    '        <span>🎯 Cíl: ' + (s.targetHearts || 30) + ' 💖</span>' +
                    '      </div>' +
                    '    </div>' +
                    '    <div style="display:flex; gap:0.4rem;">' +
                    '      <button class="btn-gold-lg" style="font-size:0.8rem; padding:0.35rem 0.8rem;" onclick="PRS_App.loadSavedGame(\'' + s.id + '\')">▶️ Pokračovat</button>' +
                    '      <button class="btn-icon-danger" style="padding:0.3rem 0.55rem; font-size:0.85rem;" onclick="PRS_App.deleteSavedGame(\'' + s.id + '\')" title="Smazat tuto uloženou partii">🗑️</button>' +
                    '    </div>' +
                    '  </div>' +
                    '  <div style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.4rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.15);">' +
                    playersPills.join("") +
                    '  </div>' +
                    '</div>'
                );
            }

            if (saveCards.length > 0) {
                html.push('<div class="saved-games-grid">' + saveCards.join("\n") + '</div>');
            }

            container.innerHTML = html.join("\n");
        },

        // Aktualizuje počítadlo a rychlý odkaz v postranním panelu herny
        updateSavedGamesUI: function () {
            var saves = this.getSavedGames();
            var savedMaps = [];
            try { savedMaps = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { savedMaps = []; }
            var activeMeta = (typeof this.getActiveAutosaveMeta === "function") ? this.getActiveAutosaveMeta() : null;
            var totalCount = saves.length + savedMaps.length + (activeMeta ? 1 : 0);

            var countEl = document.getElementById("gh-saved-count");
            if (countEl) countEl.textContent = String(totalCount);

            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var recentBox = document.getElementById("gamehall-recent-save-box");
            if (recentBox) {
                var latestManual = (saves.length > 0) ? saves[0] : null;
                var latestManualTs = (latestManual && latestManual.savedAt) ? (new Date(latestManual.savedAt).getTime() || 0) : 0;
                var hasLiveActive = Boolean(this.hasGameStarted && this.state && this.state.players && this.state.phase !== "GAME_OVER");
                var useAutosave = Boolean(activeMeta && (hasLiveActive || !latestManual || activeMeta.timestamp >= latestManualTs));

                if (useAutosave) {
                    var curPlayerName = activeMeta.currentPlayerName || "";
                    if (isEn && curPlayerName.indexOf("(Ty)") !== -1) {
                        curPlayerName = curPlayerName.replace(/\s*\(Ty\)/gi, " (You)");
                    }
                    var headerTxt = isEn ? "⚔️ Last Played Game" : "⚔️ Poslední rozehraná hra";
                    var questTxt = isEn
                        ? ("Active Quest – Round " + activeMeta.roundNumber + " (Turn #" + activeMeta.turnNumber + ")")
                        : ("Rozehraná výprava – Kolo " + activeMeta.roundNumber + " (Tah #" + activeMeta.turnNumber + ")");
                    var mapTxt = isEn
                        ? ("🗺️ Map: " + this.escapeHtml(activeMeta.boardName) + " • Active: " + this.escapeHtml(curPlayerName))
                        : ("🗺️ Plán: " + this.escapeHtml(activeMeta.boardName) + " • Na tahu: " + this.escapeHtml(curPlayerName));
                    var btnContinueTxt = isEn
                        ? ("▶️ Continue Game (Round " + activeMeta.roundNumber + ")")
                        : ("▶️ Pokračovat ve hře (Kolo " + activeMeta.roundNumber + ")");
                    var btnAllTxt = isEn
                        ? ("Show all quests (" + totalCount + ") →")
                        : ("Zobrazit všechny výpravy (" + totalCount + ") →");

                    recentBox.style.display = "block";
                    recentBox.innerHTML =
                        '<div style="background:rgba(34,197,94,0.1); border:1px solid #4ade80; border-radius:10px; padding:0.6rem 0.8rem; margin-top:0.75rem;">' +
                        '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">' +
                        '    <span style="font-size:0.74rem; color:#86efac; font-weight:700; text-transform:uppercase;">' + headerTxt + '</span>' +
                        '    <span style="font-size:0.72rem; color:var(--text-muted);">' + this.escapeHtml(activeMeta.savedAtFormatted) + '</span>' +
                        '  </div>' +
                        '  <div style="font-size:0.84rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.2rem;">' +
                        questTxt +
                        '  </div>' +
                        '  <div style="font-size:0.72rem; color:#fde68a; margin-bottom:0.45rem;">' + mapTxt + '</div>' +
                        '  <button class="btn-gold-lg" style="width:100%; font-size:0.8rem; padding:0.35rem 0.65rem;" onclick="PRS_App.resumeActiveAutosavedGame()">' +
                        btnContinueTxt +
                        '  </button>' +
                        '  <div style="text-align:right; margin-top:0.35rem;">' +
                        '    <button type="button" style="background:none; border:none; color:var(--gold-light); font-size:0.73rem; cursor:pointer; text-decoration:underline;" onclick="PRS_App.switchGameHallRoom(\'saves\')">' + btnAllTxt + '</button>' +
                        '  </div>' +
                        '</div>';
                } else if (latestManual) {
                    var bLabel = latestManual.boardName || latestManual.boardCode || (isEn ? "Royal Map" : "Královský plán");
                    var mHeader = isEn ? "💾 Last Saved Game" : "💾 Poslední uložená hra";
                    var mBtnContinue = isEn
                        ? ("▶️ Continue Game (Round " + (latestManual.roundNumber || 1) + ")")
                        : ("▶️ Pokračovat ve hře (Kolo " + (latestManual.roundNumber || 1) + ")");
                    var mBtnAll = isEn
                        ? ("Show all quests (" + totalCount + ") →")
                        : ("Zobrazit všechny výpravy (" + totalCount + ") →");

                    recentBox.style.display = "block";
                    recentBox.innerHTML =
                        '<div style="background:rgba(212,175,55,0.08); border:1px solid var(--gold); border-radius:10px; padding:0.6rem 0.8rem; margin-top:0.75rem;">' +
                        '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">' +
                        '    <span style="font-size:0.74rem; color:var(--gold-light); font-weight:700; text-transform:uppercase;">' + mHeader + '</span>' +
                        '    <span style="font-size:0.72rem; color:var(--text-muted);">' + (latestManual.savedAtFormatted || "") + '</span>' +
                        '  </div>' +
                        '  <div style="font-size:0.84rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.2rem;">' +
                        this.escapeHtml(latestManual.title) +
                        '  </div>' +
                        '  <div style="font-size:0.72rem; color:#fde68a; margin-bottom:0.45rem;">🗺️ ' + (isEn ? "Map: " : "Plán: ") + this.escapeHtml(bLabel) + '</div>' +
                        '  <button class="btn-gold-lg" style="width:100%; font-size:0.8rem; padding:0.35rem 0.65rem;" onclick="PRS_App.loadSavedGame(\'' + latestManual.id + '\')">' +
                        mBtnContinue +
                        '  </button>' +
                        '  <div style="text-align:right; margin-top:0.35rem;">' +
                        '    <button type="button" style="background:none; border:none; color:var(--gold-light); font-size:0.73rem; cursor:pointer; text-decoration:underline;" onclick="PRS_App.switchGameHallRoom(\'saves\')">' + mBtnAll + '</button>' +
                        '  </div>' +
                        '</div>';
                } else if (savedMaps.length > 0) {
                    var latestMap = savedMaps[0];
                    var tHeader = isEn ? "⭐ Saved Map Template" : "⭐ Uložená šablona plánu";
                    var tPlay = isEn ? "⚔️ Play on this Map" : "⚔️ Hrát na tomto plánu";
                    var tAll = isEn ? ("Show templates (" + totalCount + ") →") : ("Zobrazit šablony (" + totalCount + ") →");
                    var tName = latestMap.name || (isEn ? "Custom Map" : "Vlastní plán");
                    var tNodes = isEn ? " tiles)" : " polí)";

                    recentBox.style.display = "block";
                    recentBox.innerHTML =
                        '<div style="background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.4); border-radius:10px; padding:0.6rem 0.8rem; margin-top:0.75rem;">' +
                        '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">' +
                        '    <span style="font-size:0.74rem; color:#e9d5ff; font-weight:700; text-transform:uppercase;">' + tHeader + '</span>' +
                        '    <span style="font-size:0.72rem; color:var(--text-muted);">' + (latestMap.savedAt || "") + '</span>' +
                        '  </div>' +
                        '  <div style="font-size:0.84rem; font-weight:600; color:#fef08a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.45rem;">' +
                        this.escapeHtml(tName) + ' (' + (latestMap.nodeCount || 96) + tNodes +
                        '  </div>' +
                        '  <button class="btn-gold-lg" style="width:100%; font-size:0.8rem; padding:0.35rem 0.65rem;" onclick="PRS_App.playOnSavedFavoriteMap(0)">' +
                        tPlay +
                        '  </button>' +
                        '  <div style="text-align:right; margin-top:0.35rem;">' +
                        '    <button type="button" style="background:none; border:none; color:#e9d5ff; font-size:0.73rem; cursor:pointer; text-decoration:underline;" onclick="PRS_App.switchGameHallRoom(\'saves\')">' + tAll + '</button>' +
                        '  </div>' +
                        '</div>';
                } else {
                    recentBox.style.display = "none";
                }
            }
        },

        // ====================================================================
        // SPRÁVA KŘESEL U ONLINE MULTIPLAYERU (RE-INVITE & NÁHRADA BOTY)
        // ====================================================================

        openOnlineSeatsModal: function () {
            var modal = document.getElementById("online-seats-modal");
            if (!modal) return;

            this.renderOnlineSeatsModal();
            modal.style.display = "flex";
            this.updateBodyModalClass();
        },

        closeOnlineSeatsModal: function () {
            var modal = document.getElementById("online-seats-modal");
            if (modal) modal.style.display = "none";
            this.updateBodyModalClass();
        },

        renderOnlineSeatsModal: function () {
            if (!this.state) return;

            var roomCode = this.state.roomCode || "ONLINE";
            var codeEl = document.getElementById("online-seats-room-code");
            var linkInput = document.getElementById("online-seats-share-link");
            var listEl = document.getElementById("online-seats-list");

            if (codeEl) codeEl.textContent = roomCode;

            var shareUrl = window.location.origin + window.location.pathname + "?room=" + encodeURIComponent(roomCode);
            if (linkInput) linkInput.value = shareUrl;

            if (!listEl) return;

            var html = [];
            var players = this.state.players || [];
            var myIdx = (typeof this.myOnlinePlayerIndex === "number") ? this.myOnlinePlayerIndex : 0;

            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                var isMe = (i === myIdx);
                var isBot = (p.type !== "Human");
                var botRoleLabel = "";
                if (p.type === "Bot_Aggressive") botRoleLabel = "⚔️ PC Válečník (Lovec draků)";
                else if (p.type === "Bot_Breeder") botRoleLabel = "🐎 PC Chovatel (Sady zvířat)";
                else if (p.type === "Bot_Noble") botRoleLabel = "👑 PC Dvořan (Diplomacie)";
                else if (p.type === "Bot_Balanced") botRoleLabel = "🛡️ PC Rytíř (Vyvážený)";

                html.push(
                    '<div class="seat-item-card" style="border-left:4px solid ' + (p.color || '#d4af37') + ';">' +
                    '  <div style="display:flex; align-items:center; gap:0.65rem;">' +
                    '    <span style="font-size:1.3rem;">' + (isBot ? '🤖' : (isMe ? '👑' : '👤')) + '</span>' +
                    '    <div>' +
                    '      <div style="display:flex; align-items:center; gap:0.4rem;">' +
                    '        <strong style="color:var(--gold-light); font-size:0.92rem;">' + this.escapeHtml(p.name) + '</strong>' +
                    (isMe ? ' <span class="lp-mode-badge" style="font-size:0.68rem; padding:1px 5px; margin:0;">Ty (Hostitel)</span>' : '') +
                    '      </div>' +
                    '      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">' +
                    '        ' + (isBot ? ('<span style="color:#fde047;">' + botRoleLabel + '</span>') : '<span style="color:#86efac;">👤 Živý hráč u stolu</span>') +
                    '        • 💖 ' + (p.totalHearts || 0) + ' srdcí • 🪙 ' + (p.gold || 0).toLocaleString("cs-CZ") + ' zl.' +
                    '      </div>' +
                    '    </div>' +
                    '  </div>' +
                    '  <div>' +
                    (!isMe ? (
                        isBot ? (
                            '<button class="btn-secondary" style="font-size:0.74rem; padding:0.25rem 0.6rem;" onclick="PRS_App.convertSeatToHuman(' + i + ')">' +
                            '  👤 Uvolnit pro člověka' +
                            '</button>'
                        ) : (
                            '<div style="display:flex; gap:0.3rem; align-items:center;">' +
                            '  <select id="bot-type-select-' + i + '" class="prs-select" style="font-size:0.74rem; padding:0.25rem 0.4rem; width:auto;">' +
                            '    <option value="Bot_Aggressive">⚔️ Válečník</option>' +
                            '    <option value="Bot_Breeder">🐎 Chovatel</option>' +
                            '    <option value="Bot_Noble">👑 Dvořan</option>' +
                            '    <option value="Bot_Balanced" selected>🛡️ Vyvážený</option>' +
                            '  </select>' +
                            '  <button class="btn-secondary" style="font-size:0.74rem; padding:0.25rem 0.6rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.convertSeatToBot(' + i + ')">' +
                            '    🤖 Nahradit botem' +
                            '  </button>' +
                            '</div>'
                        )
                    ) : '<span style="font-size:0.76rem; color:var(--gold-light); font-weight:600;">Tvůj slot</span>') +
                    '  </div>' +
                    '</div>'
                );
            }

            listEl.innerHTML = html.join("\n");
        },

        // Převede slot hráče na PC Bota
        convertSeatToBot: function (slotIndex, optionalBotType) {
            if (!this.state || !this.state.players || !this.state.players[slotIndex]) return;

            var selectEl = document.getElementById("bot-type-select-" + slotIndex);
            var botType = optionalBotType || (selectEl ? selectEl.value : "Bot_Balanced");

            var botNameTag = "";
            var botPawnId = "bot_balanced";
            if (botType === "Bot_Aggressive") { botNameTag = "Válečník"; botPawnId = "bot_aggressive"; }
            else if (botType === "Bot_Breeder") { botNameTag = "Chovatel"; botPawnId = "bot_breeder"; }
            else if (botType === "Bot_Noble") { botNameTag = "Dvořan"; botPawnId = "bot_noble"; }
            else { botNameTag = "Vyvážený"; botPawnId = "bot_balanced"; }

            var p = this.state.players[slotIndex];
            var oldName = p.name;
            p.type = botType;
            p.pawnId = botPawnId;
            delete p.claimedBy;
            delete p.isOnlineHost;
            var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
            p.name = cleanName + " (PC " + botNameTag + ")";

            // Uložíme aktualizovaný stav do cloudu i lokálně
            if (typeof this.saveCurrentSessionToCloud === "function") {
                this.saveCurrentSessionToCloud(true);
            } else if (typeof this.saveSessionAuto === "function") {
                this.saveSessionAuto();
            }
            if (typeof this.saveActiveGameAutosave === "function") {
                this.saveActiveGameAutosave();
            }
            this.saveCurrentGame(this.state.title || ("Online – Kolo " + this.state.roundNumber));

            this.addLog("🤖 Rytíř " + oldName + " (křeslo #" + (slotIndex + 1) + ") byl převeden na PC Bota (" + botNameTag + ").", "turn");

            if (this.renderOnlineSeatsModal) this.renderOnlineSeatsModal();
            if (this.renderOnlineRoleGrid) this.renderOnlineRoleGrid();
            this.renderGameScreen();

            // Pokud byl tento hráč právě na tahu, spustíme tah bota!
            if (this.state.currentPlayerIndex === slotIndex && typeof this.scheduleBotTurnIfNeeded === "function") {
                this.scheduleBotTurnIfNeeded();
            }
        },

        // Uvolní slot zpět pro živého hráče
        convertSeatToHuman: function (slotIndex) {
            if (!this.state || !this.state.players || !this.state.players[slotIndex]) return;

            var p = this.state.players[slotIndex];
            p.type = "Human";
            p.pawnId = "knight_valiant";
            delete p.claimedBy;
            delete p.isOnlineHost;
            var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
            p.name = cleanName;

            if (typeof this.saveCurrentSessionToCloud === "function") {
                this.saveCurrentSessionToCloud();
            } else if (typeof this.saveSessionAuto === "function") {
                this.saveSessionAuto();
            }
            if (typeof this.saveActiveGameAutosave === "function") {
                this.saveActiveGameAutosave();
            }
            this.saveCurrentGame(this.state.title || ("Online – Kolo " + this.state.roundNumber));

            this.addLog("👤 Křeslo #" + (slotIndex + 1) + " bylo uvolněno pro nového živého hráče.", "turn");

            if (this.renderOnlineSeatsModal) this.renderOnlineSeatsModal();
            if (this.renderOnlineRoleGrid) this.renderOnlineRoleGrid();
            this.renderGameScreen();
        },

        // Zkopíruje zvací odkaz do schránky
        copyOnlineSeatsInviteLink: function () {
            var inp = document.getElementById("online-seats-share-link");
            if (!inp) return;
            var text = inp.value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    alert("📋 Odkaz pro spoluhráče byl zkopírován do schránky!\n\n" + text);
                }).catch(function () {
                    inp.select();
                    document.execCommand("copy");
                    alert("📋 Odkaz zkopírován: " + text);
                });
            } else {
                inp.select();
                document.execCommand("copy");
                alert("📋 Odkaz zkopírován: " + text);
            }
        },

        // Vstoupí ke stolu a pokračuje v partii
        resumeOnlineGameFromSeats: function () {
            this.closeOnlineSeatsModal();
            this.switchTab("board");
            this.renderGameScreen();
            this.updateUserUI();

            this.addLog("⚔️ Pokračování v online výpravě u stolu (Místnost: " + this.state.roomCode + ").", "turn");
            if (window.PRS_Audio) window.PRS_Audio.playNotice();

            // Pokud je na tahu bot (např. právě dosazený), rovnou spustíme jeho tah
            this.scheduleBotTurnIfNeeded();
        },

        // Převede celou rozehranou online hru na čistě offline partii proti PC botům
        convertEntireGameToOfflineBots: async function () {
            if (!this.state || !this.state.players) return;
            var conf = await KiDeskyDialog.confirm(
                "Přeješ si odpojit hru ze sítě a převést všechny ostatní hráče na inteligentní PC boty?<br><br>V partii budeš moci ihned plynule pokračovat offline a celou ji dohrát sám.",
                {
                    title: "Převést na offline hru proti botům",
                    icon: "🤖",
                    confirmText: "🤖 Ano, hrát offline proti botům",
                    cancelText: "Zůstat online"
                }
            );
            if (!conf) return;

            var myIdx = (typeof this.myOnlinePlayerIndex === "number" && this.myOnlinePlayerIndex >= 0) ? this.myOnlinePlayerIndex : 0;
            this.state.roomCode = null;
            this.state.sessionGuid = null;

            if (this.state.players && Array.isArray(this.state.players)) {
                for (var i = 0; i < this.state.players.length; i++) {
                    var p = this.state.players[i];
                    if (i === myIdx) {
                        p.type = "Human";
                        delete p.isOnlineHost;
                        delete p.claimedBy;
                    } else {
                        p.type = "Bot_Balanced";
                        p.pawnId = "bot_balanced";
                        delete p.isOnlineHost;
                        delete p.claimedBy;
                        var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").replace(/\s*\(Ty\)/gi, "").trim();
                        p.name = cleanName + " (PC)";
                    }
                }
            }

            try {
                localStorage.removeItem("prs_active_online_room");
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, "", window.location.pathname);
                }
            } catch (e) { }

            this.closeOnlineSeatsModal();
            if (typeof this.stopOnlinePollingLoop === "function") {
                this.stopOnlinePollingLoop();
            }
            this.saveActiveGameAutosave();
            this.renderOnlineRoomBar();
            this.renderGameScreen();
            this.updateUserUI();

            this.addLog("🤖 Celá výprava byla odpojena ze sítě a převedena na hru proti PC botům. Můžeš nerušeně hrát offline!", "win");
            if (window.PRS_Audio && window.PRS_Audio.playFanfare) {
                window.PRS_Audio.playFanfare();
            }

            if (this.scheduleBotTurnIfNeeded) {
                this.scheduleBotTurnIfNeeded();
            }
        }

    });
})();
