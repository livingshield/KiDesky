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

            var defaultTitle = modeName + " – Kolo " + roundNum + " (" + new Date().toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" }) + ")";
            if (titleInput) {
                titleInput.value = defaultTitle;
                setTimeout(function () { titleInput.select(); }, 100);
            }

            if (infoEl) {
                var playersHtml = [];
                for (var i = 0; i < (this.state.players || []).length; i++) {
                    var pl = this.state.players[i];
                    playersHtml.push(
                        '<span class="save-game-player-chip" style="border-left:3px solid ' + (pl.color || '#d4af37') + ';">' +
                        this.escapeHtml(pl.name) + ' (' + (pl.totalHearts || 0) + ' 💖, ' + (pl.gold || 0).toLocaleString("cs-CZ") + ' zl.)' +
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

            this.saveCurrentGame(title);
            this.closeSaveGameModal();
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

            var saveEntry = {
                id: saveId,
                title: title,
                mode: mode,
                roomCode: this.state.roomCode || null,
                sessionGuid: this.state.sessionGuid || null,
                boardCode: (this.state.board && this.state.board.code) ? this.state.board.code : "classic_96",
                targetHearts: (this.state.config && this.state.config.targetHearts) || 30,
                roundNumber: this.state.roundNumber || 1,
                turnNumber: this.state.turnNumber || 0,
                currentPlayerIndex: this.state.currentPlayerIndex || 0,
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
                if (typeof this.saveOnlineSessionState === "function") {
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

                // Sanitizace obnoveného stavu (zpětná kompatibilita pro starší savy)
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
                if (restoredState.board && restoredState.board.rivers && restoredState.board.rivers.length > 0 && (!restoredState.board.bridges || restoredState.board.bridges.length === 0)) {
                    if (window.PRS_BoardBuilder && typeof window.PRS_BoardBuilder.computeRiverBridges === "function") {
                        window.PRS_BoardBuilder.computeRiverBridges(restoredState.board);
                    }
                }

                this.state = restoredState;
                this.hasGameStarted = true;
                this.isBoardStaticDirty = true;
                this.isMoveAnimating = false;
                this.animatingPlayerIndex = null;
                this.animTokenPos = null;

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

        // Načtení online multiplayerové hry a otevření dialogu křesel
        loadOnlineSavedGame: function (saveEntry) {
            var self = this;
            var roomCode = saveEntry.roomCode;

            // Pokusíme se stáhnout nejčerstvější stav ze serveru, případně použijeme uložený JSON jako fallback
            fetch("api.ashx?action=load-session&code=" + encodeURIComponent(roomCode))
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && res.session && res.session.stateJson) {
                        self.state = JSON.parse(res.session.stateJson);
                        self.state.sessionGuid = res.session.sessionGuid;
                        self.state.roomCode = res.session.roomCode;
                        self.lastKnownTurnNumber = self.state.turnNumber;
                    } else {
                        // Fallback z lokálního uložení
                        self.state = JSON.parse(saveEntry.stateJson);
                    }

                    self.hasGameStarted = true;
                    self.isBoardStaticDirty = true;

                    // Otevřeme správu křesel u stolu (možnost poslat znovu odkaz nebo nahradit boty)
                    self.openOnlineSeatsModal();
                })
                .catch(function () {
                    // Fallback
                    self.state = JSON.parse(saveEntry.stateJson);
                    self.hasGameStarted = true;
                    self.isBoardStaticDirty = true;
                    self.openOnlineSeatsModal();
                });
        },

        // Přepne filtr uložených her v herně
        setSavedGamesFilter: function (filter) {
            this.savedGamesFilter = filter || "all";
            var tabs = ["all", "solo", "online"];
            for (var i = 0; i < tabs.length; i++) {
                var btn = document.getElementById("save-tab-" + tabs[i]);
                if (btn) {
                    if (tabs[i] === this.savedGamesFilter) btn.classList.add("active");
                    else btn.classList.remove("active");
                }
            }
            this.renderSavedGamesList();
        },

        // Vykreslí seznam uložených her v Rytířské herně
        renderSavedGamesList: function () {
            var container = document.getElementById("saved-games-container");
            if (!container) return;

            var saves = this.getSavedGames();
            var filter = this.savedGamesFilter || "all";

            if (filter === "solo") {
                saves = saves.filter(function (s) { return s.mode !== "Online"; });
            } else if (filter === "online") {
                saves = saves.filter(function (s) { return s.mode === "Online"; });
            }

            if (saves.length === 0) {
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

            var html = [];
            for (var i = 0; i < saves.length; i++) {
                var s = saves[i];
                var isOnline = (s.mode === "Online");
                var badgeLabel = isOnline ? "🌐 Online (Kód: " + (s.roomCode || "—") + ")" : (s.mode === "HotSeat" ? "🛋️ Hot-Seat" : "⚡ Solo AI");
                var badgeClass = isOnline ? "lp-mode-badge" : "user-pill";

                var playersPills = [];
                for (var p = 0; p < (s.playersSummary || []).length; p++) {
                    var pl = s.playersSummary[p];
                    var isBot = (pl.type !== "Human");
                    playersPills.push(
                        '<span class="save-game-player-chip" style="border-left:3px solid ' + (pl.color || '#d4af37') + ';">' +
                        (isBot ? '🤖 ' : '👤 ') + this.escapeHtml(pl.name) + ' (' + (pl.hearts || 0) + ' 💖, ' + (pl.gold || 0).toLocaleString("cs-CZ") + ' zl.)' +
                        '</span>'
                    );
                }

                html.push(
                    '<div class="save-game-card">' +
                    '  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; gap:0.5rem; flex-wrap:wrap;">' +
                    '    <div>' +
                    '      <h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.05rem; margin:0 0 0.25rem;">' + this.escapeHtml(s.title) + '</h4>' +
                    '      <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.76rem; color:var(--text-muted);">' +
                    '        <span class="' + badgeClass + '" style="font-size:0.7rem; padding:1px 6px;">' + badgeLabel + '</span>' +
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

            container.innerHTML = html.join("\n");
        },

        // Aktualizuje počítadlo a rychlý odkaz v postranním panelu herny
        updateSavedGamesUI: function () {
            var saves = this.getSavedGames();
            var countEl = document.getElementById("gh-saved-count");
            if (countEl) countEl.textContent = String(saves.length);

            var recentBox = document.getElementById("gamehall-recent-save-box");
            if (recentBox) {
                if (saves.length > 0) {
                    var latest = saves[0];
                    recentBox.style.display = "block";
                    recentBox.innerHTML =
                        '<div style="background:rgba(212,175,55,0.08); border:1px solid var(--gold); border-radius:10px; padding:0.6rem 0.8rem; margin-top:0.75rem;">' +
                        '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">' +
                        '    <span style="font-size:0.74rem; color:var(--gold-light); font-weight:700; text-transform:uppercase;">💾 Poslední uložená hra</span>' +
                        '    <span style="font-size:0.72rem; color:var(--text-muted);">' + (latest.savedAtFormatted || "") + '</span>' +
                        '  </div>' +
                        '  <div style="font-size:0.84rem; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.45rem;">' +
                        this.escapeHtml(latest.title) +
                        '  </div>' +
                        '  <button class="btn-gold-lg" style="width:100%; font-size:0.8rem; padding:0.35rem 0.65rem;" onclick="PRS_App.loadSavedGame(\'' + latest.id + '\')">' +
                        '    ▶️ Pokračovat ve hře (Kolo ' + (latest.roundNumber || 1) + ')' +
                        '  </button>' +
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
        convertSeatToBot: function (slotIndex) {
            if (!this.state || !this.state.players || !this.state.players[slotIndex]) return;

            var selectEl = document.getElementById("bot-type-select-" + slotIndex);
            var botType = selectEl ? selectEl.value : "Bot_Balanced";

            var botNameTag = "";
            var botPawnId = "bot_balanced";
            if (botType === "Bot_Aggressive") { botNameTag = "Válečník"; botPawnId = "bot_aggressive"; }
            else if (botType === "Bot_Breeder") { botNameTag = "Chovatel"; botPawnId = "bot_breeder"; }
            else if (botType === "Bot_Noble") { botNameTag = "Dvořan"; botPawnId = "bot_noble"; }
            else { botNameTag = "Vyvážený"; botPawnId = "bot_balanced"; }

            var p = this.state.players[slotIndex];
            p.type = botType;
            p.pawnId = botPawnId;
            var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").replace(/\s*\(Hostitel\)/gi, "").trim();
            p.name = cleanName + " (PC " + botNameTag + ")";

            // Uložíme aktualizovaný stav do cloudu i lokálně
            if (typeof this.saveOnlineSessionState === "function") {
                this.saveOnlineSessionState(null, false);
            }
            this.saveCurrentGame(this.state.title || ("Online – Kolo " + this.state.roundNumber));

            this.addLog("🤖 Křeslo #" + (slotIndex + 1) + " převzal PC Bot (" + botNameTag + ").", "turn");
            this.renderOnlineSeatsModal();
        },

        // Uvolní slot zpět pro živého hráče
        convertSeatToHuman: function (slotIndex) {
            if (!this.state || !this.state.players || !this.state.players[slotIndex]) return;

            var p = this.state.players[slotIndex];
            p.type = "Human";
            p.pawnId = "knight_valiant";
            var cleanName = p.name.replace(/\s*\(PC.*?\)/gi, "").trim();
            p.name = cleanName;

            if (typeof this.saveOnlineSessionState === "function") {
                this.saveOnlineSessionState(null, false);
            }
            this.saveCurrentGame(this.state.title || ("Online – Kolo " + this.state.roundNumber));

            this.addLog("👤 Křeslo #" + (slotIndex + 1) + " bylo uvolněno pro živého hráče.", "turn");
            this.renderOnlineSeatsModal();
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
        }

    });
})();
