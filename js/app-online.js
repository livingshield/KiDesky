// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Online multiplayer, synchronizace tahů a cloud ukládání
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
        // --- AUTENTIZACE & UŽIVATELSKÝ PROFIL ---
openAuthModal: function () {
        var m = document.getElementById("auth-modal");
        if (m) { m.style.display = "flex"; this.updateBodyModalClass(); }
    },

    closeAuthModal: function () {
        var m = document.getElementById("auth-modal");
        if (m) { m.style.display = "none"; this.updateBodyModalClass(); }
    },

    setGuestMode: function () {
        this.currentUser = {
            id: null,
            username: "Host",
            displayName: "Host",
            role: "Guest",
            token: null
        };
        localStorage.setItem("prs_user", JSON.stringify(this.currentUser));
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = "Host (Ty)";
            this.renderLobbyPlayers();
        }
        this.updateUserUI();
        this.closeAuthModal();
    },

    submitAuth: function (mode) {
        var self = this;
        var uInput = document.getElementById("auth-username");
        var pInput = document.getElementById("auth-password");
        var dInput = document.getElementById("auth-displayname");
        var msgEl = document.getElementById("auth-feedback");

        var username = uInput ? uInput.value.trim() : "";
        var password = pInput ? pInput.value : "";
        var displayName = dInput ? dInput.value.trim() : username;

        if (!username || !password) {
            if (msgEl) msgEl.textContent = "Vyplňte prosím přihlašovací jméno a heslo.";
            return;
        }

        fetch("api.ashx?action=" + mode, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password, displayName: displayName })
        })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data && data.ok && data.user) {
                    self.currentUser = data.user;
                    localStorage.setItem("prs_user", JSON.stringify(self.currentUser));
                    self.updateUserUI();
                    self.closeAuthModal();
                    self.fetchServerStatusAndSessions();
                } else {
                    var rawErr = (data && (data.error || data.message)) ? (data.error || data.message) : "Přihlášení se nezdařilo.";
                    if (rawErr.indexOf("Neplatn") !== -1 && rawErr.indexOf("heslo") !== -1) {
                        rawErr = "Neplatné jméno nebo heslo.";
                    }
                    if (msgEl) msgEl.textContent = rawErr;
                }
            })
            .catch(function () {
                var role = (username.toLowerCase() === "admin") ? "Admin" : "Player";
                self.currentUser = { id: 1, username: username, displayName: displayName || username, role: role, token: "local" };
                localStorage.setItem("prs_user", JSON.stringify(self.currentUser));
                self.updateUserUI();
                self.closeAuthModal();
            });
    },

// --- ONLINE MÍSTNOSTI, SDÍLENÍ POZVÁNKY (?room=), ZÁMEK SLOTU & AUTO-POLLING ---
    renderOnlineRoomBar: function () {
        var barEl = document.getElementById("online-room-bar");
        if (!barEl || !this.state) return;

        var code = this.state.roomCode || "";
        if (!code) {
            barEl.innerHTML = '<div class="online-room-banner" style="background:rgba(24,20,14,0.75); border-color:rgba(212,175,55,0.28);">' +
                '<div style="display:flex; align-items:center; gap:0.55rem; font-size:0.84rem; color:var(--text-muted);">' +
                '  <span>🛋️ <strong>Lokální partie</strong> (Hot-Seat u jednoho PC / Solo proti PC)</span>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">' +
                '  <button class="btn-secondary" style="font-size:0.78rem; padding:0.28rem 0.65rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.saveCurrentSessionToCloud()">🌐 Proměnit v Online místnost &amp; získat kód pro přátele</button>' +
                '</div>' +
                '</div>';
            return;
        }

        // Načtení uloženého slotu pro tuto místnost z localStorage
        try {
            var savedSlot = localStorage.getItem("prs_slot_" + code);
            if (savedSlot !== null && savedSlot !== undefined && savedSlot !== "") {
                this.myOnlinePlayerIndex = parseInt(savedSlot, 10);
            }
        } catch (e) { }

        var myPl = (this.myOnlinePlayerIndex >= 0 && this.state.players[this.myOnlinePlayerIndex])
            ? this.state.players[this.myOnlinePlayerIndex]
            : null;

        var myRoleText = myPl
            ? '🛡️ Hraješ za: <strong style="color:' + myPl.color + ';">' + myPl.badge + ' ' + this.escapeHtml(myPl.name) + '</strong>'
            : '🛋️ Všichni hráči (Hot-Seat bez zámku)';

        var optionsHtml = '<option value="-1" ' + (this.myOnlinePlayerIndex === -1 ? 'selected' : '') + '>🛋️ Všichni hráči u 1 PC (Hot-Seat bez zámku)</option>';
        for (var i = 0; i < this.state.players.length; i++) {
            var pl = this.state.players[i];
            var typeTag = (pl.type === "Human") ? "Hráč" : "PC";
            optionsHtml += '<option value="' + i + '" ' + (this.myOnlinePlayerIndex === i ? 'selected' : '') + '>🛡️ ' + pl.badge + ' ' + (i + 1) + '. ' + this.escapeHtml(pl.name) + ' (' + typeTag + ')</option>';
        }

        barEl.innerHTML = '<div class="online-room-banner">' +
            '<div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">' +
            '  <span class="online-pulse-dot" title="Online místnost je aktivní"></span>' +
            '  <span style="font-size:0.88rem; color:#f0f9ff;">🌐 Online Stůl: <strong style="color:var(--gold-light); letter-spacing:1px; font-size:0.98rem;">' + this.escapeHtml(code) + '</strong></span>' +
            '  <button class="btn-secondary" style="font-size:0.76rem; padding:0.22rem 0.55rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.copyRoomInviteLink()">📋 Kopírovat odkaz pro přátele</button>' +
            '  <span id="online-copy-feedback" style="font-size:0.76rem; color:#86efac;"></span>' +
            '</div>' +
            '<div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">' +
            '  <span style="font-size:0.82rem; background:rgba(0,0,0,0.3); border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:0.22rem 0.55rem;">' + myRoleText + '</span>' +
            '  <button class="btn-gold-lg" style="font-size:0.76rem; padding:0.24rem 0.6rem;" onclick="PRS_App.openOnlineRoleModal()" title="Zvolit si rytíře pro tuto online partii">👤 Zvolit / změnit rytíře</button>' +
            '  <button class="btn-secondary" style="font-size:0.75rem; padding:0.22rem 0.5rem;" onclick="PRS_App.pollOnlineSessionNow(true)" title="Okamžitě zkontrolovat tah ze serveru">🔄 Sync (Tah #' + (this.state.turnNumber || 1) + ')</button>' +
            '</div>' +
            '</div>';
    },

    setMyOnlinePlayerSlot: function (val) {
        var idx = parseInt(val, 10);
        if (isNaN(idx)) idx = -1;
        this.claimOnlineRole(idx);
    },

    // --- MODAL VÝBĚRU POSTAVY PRO ONLINE MULTIPLAYER ---
    openOnlineRoleModal: function () {
        var modal = document.getElementById("online-role-modal");
        if (!modal || !this.state) return;

        var infoEl = document.getElementById("online-role-room-info");
        if (infoEl) {
            infoEl.innerHTML = 'Kód místnosti: <strong style="color:var(--gold-light); letter-spacing:1px;">' + this.escapeHtml(this.state.roomCode || "") + '</strong> | Cíl: <strong>' + (this.state.config.targetHearts || 30) + ' 💖</strong> | Kolo: #' + this.state.roundNumber;
        }

        var nameInput = document.getElementById("online-player-custom-name");
        if (nameInput) {
            var pref = (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username))
                ? (this.currentUser.displayName || this.currentUser.username)
                : "Host";
            nameInput.value = pref;
        }

        this.renderOnlineRoleGrid();
        modal.style.display = "flex";
    },

    closeOnlineRoleModal: function () {
        var modal = document.getElementById("online-role-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    renderOnlineRoleGrid: function () {
        var grid = document.getElementById("online-role-players-grid");
        if (!grid || !this.state || !this.state.players) return;

        var html = [];
        for (var i = 0; i < this.state.players.length; i++) {
            var pl = this.state.players[i];
            var isHost = (i === 0 || !!pl.isOnlineHost);
            var isHuman = (pl.type === "Human");
            var isMyCurrentSlot = (this.myOnlinePlayerIndex === i);
            var st = window.PRS_GameEngine ? window.PRS_GameEngine.getEffectiveStats(this.state, pl) : pl.skills;

            var roleTag = '';
            if (isMyCurrentSlot) {
                roleTag = '<span style="background:#22c55e; color:#fff; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">✅ Tvoje role</span>';
            } else if (isHost) {
                roleTag = '<span style="background:rgba(234,179,8,0.2); color:#fbbf24; border:1px solid #fbbf24; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">👑 Hostitel</span>';
            } else if (isHuman) {
                roleTag = '<span style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #38bdf8; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">👤 Jiný hráč</span>';
            } else {
                roleTag = '<span style="background:rgba(34,197,94,0.18); color:#86efac; border:1px solid #22c55e; padding:2px 7px; border-radius:5px; font-size:0.72rem; font-weight:bold;">✨ Volné (PC)</span>';
            }

            html.push('<div class="podium-card" style="background:rgba(20,15,10,0.92); border:1.5px solid ' + (isMyCurrentSlot ? '#22c55e' : pl.color) + '; width:100%; box-sizing:border-box; padding:0.85rem; text-align:center;">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
            html.push('    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:bold;">#' + (i + 1) + '</span>');
            html.push('    ' + roleTag);
            html.push('  </div>');

            html.push('  <div style="font-size:1.8rem; margin:0.2rem 0;">' + pl.badge + '</div>');
            html.push('  <div style="font-size:1rem; font-weight:bold; color:' + pl.color + '; margin-bottom:0.2rem;">' + this.escapeHtml(pl.name) + '</div>');
            html.push('  <div style="font-size:0.85rem; color:#f472b6; font-weight:bold; margin-bottom:0.5rem;">' + pl.totalHearts + ' 💖 • ' + pl.gold.toLocaleString("cs-CZ") + ' zl.</div>');

            html.push('  <div style="display:flex; justify-content:center; gap:0.4rem; font-size:0.76rem; margin-bottom:0.75rem; color:var(--text-muted); background:rgba(0,0,0,0.3); border-radius:6px; padding:0.25rem;">');
            html.push('    <span>⚔️' + (st.boj || 0) + '</span>');
            html.push('    <span>🏇' + (st.jizda || 0) + '</span>');
            html.push('    <span>💃' + (st.tanec || 0) + '</span>');
            html.push('    <span>✨' + (st.charisma || 0) + '</span>');
            html.push('  </div>');

            if (isMyCurrentSlot) {
                html.push('  <button class="btn-secondary" disabled style="width:100%; font-size:0.82rem; opacity:0.8; cursor:default;">✓ Hraješ za tohoto rytíře</button>');
            } else {
                html.push('  <button class="btn-gold-lg" style="width:100%; font-size:0.84rem; padding:0.4rem 0.5rem;" onclick="PRS_App.claimOnlineRole(' + i + ')">⚔️ Hrát za ' + this.escapeHtml(pl.name.replace(" (PC)", "").replace(" (Ty)", "")) + '</button>');
            }
            html.push('</div>');
        }
        grid.innerHTML = html.join("\n");
    },

    claimOnlineRole: function (selIdx) {
        if (!this.state) return;
        var nameInput = document.getElementById("online-player-custom-name");
        var customName = nameInput ? nameInput.value.trim() : "";

        if (selIdx >= 0 && selIdx < this.state.players.length) {
            var pl = this.state.players[selIdx];
            pl.type = "Human"; // Povýšení na lidského hráče, aby za něj netahal automatický bot!
            if (customName) {
                pl.name = customName;
            } else if (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username)) {
                pl.name = this.currentUser.displayName || this.currentUser.username;
            } else {
                pl.name = "Host";
            }
            this.myOnlinePlayerIndex = selIdx;
            if (this.state.roomCode) {
                try {
                    localStorage.setItem("prs_slot_" + this.state.roomCode, String(selIdx));
                } catch (e) { }
            }
            this.addLog("🛡️ Připojil ses k online stolu jako **" + pl.badge + " " + pl.name + "**!", "win");
        } else {
            this.myOnlinePlayerIndex = -1;
            if (this.state.roomCode) {
                try {
                    localStorage.setItem("prs_slot_" + this.state.roomCode, "-1");
                } catch (e) { }
            }
            this.addLog("🛋️ Hraješ v režimu Hot-Seat (všechny postavy u 1 PC).", "turn");
        }

        this.closeOnlineRoleModal();
        this.saveCurrentSessionToCloud();
        this.renderGameScreen();
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
    },

    copyRoomInviteLink: function () {
        if (!this.state || !this.state.roomCode) return;
        var baseUrl = window.location.origin + window.location.pathname;
        var inviteUrl = baseUrl + "?room=" + encodeURIComponent(this.state.roomCode);
        var fb = document.getElementById("online-copy-feedback");
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inviteUrl).then(function () {
                if (fb) {
                    fb.textContent = "✓ Odkaz zkopírován do schránky!";
                    setTimeout(function () { fb.textContent = ""; }, 3500);
                }
            }).catch(function () {
                window.prompt("Zkopíruj tento odkaz a pošli ho spoluhráčům:", inviteUrl);
            });
        } else {
            window.prompt("Zkopíruj tento odkaz a pošli ho spoluhráčům:", inviteUrl);
        }
    },

    checkUrlRoomParam: function () {
        try {
            var search = window.location.search || "";
            var match = search.match(/[?&]room=([A-Za-z0-9_-]+)/);
            if (match && match[1]) {
                var code = match[1].toUpperCase();
                var inp = document.getElementById("join-room-code-input");
                if (inp) inp.value = code;
                this.loadSessionFromCloud(code);
            }
        } catch (e) { }
    },

    startOnlinePollingLoop: function () {
        var self = this;
        if (this.onlinePollTimer) clearInterval(this.onlinePollTimer);
        this.onlinePollTimer = setInterval(function () {
            if (self.activeTab === "board" && self.onlinePollingEnabled && self.state && self.state.roomCode && !self.isMoveAnimating && !self.isOnlineSyncing) {
                self.pollOnlineSessionNow(false);
            }
        }, 3000);
    },

    pollOnlineSessionNow: function (manual) {
        var self = this;
        if (!this.state || !this.state.roomCode || this.isMoveAnimating || this.state.phase === "GAME_OVER") return;
        if (this.isActionProcessing || this.isSavingSession) return;
        this.isOnlineSyncing = true;

        var roomCode = this.state.roomCode;

        // Pomocná funkce pro plné stažení a aplikaci herního stavu
        var fetchFullSession = function () {
            fetch("api.ashx?action=load-session&code=" + encodeURIComponent(roomCode))
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    self.isOnlineSyncing = false;
                    if (res && res.ok && res.session && res.session.stateJson) {
                        var remoteState = JSON.parse(res.session.stateJson);
                        if (!remoteState || !remoteState.players) return;

                        self.lastKnownUpdatedAt = res.session.updatedAt;

                        var localSig = (self.state.turnNumber || 1) + ":" + self.state.currentPlayerIndex + ":" + self.state.phase + ":" + (self.state.logs ? self.state.logs.length : 0);
                        var remoteSig = (remoteState.turnNumber || 1) + ":" + remoteState.currentPlayerIndex + ":" + remoteState.phase + ":" + (remoteState.logs ? remoteState.logs.length : 0);

                        // Pokud jsem na tahu a remote má stejné číslo tahu, remote nesmí přepsat můj čerstvý lokální tah starším stavem
                        var isMyTurn = (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex);
                        if (isMyTurn && remoteState.turnNumber === self.state.turnNumber) {
                            var localLogs = self.state.logs ? self.state.logs.length : 0;
                            var remoteLogs = remoteState.logs ? remoteState.logs.length : 0;
                            if (remoteLogs <= localLogs) {
                                return;
                            }
                        }

                        if ((remoteState.turnNumber > self.state.turnNumber) || (remoteState.turnNumber === self.state.turnNumber && remoteSig !== localSig)) {
                            var prevPlayerIdx = self.state.currentPlayerIndex;
                            self.state = remoteState;
                            self.state.sessionGuid = res.session.sessionGuid;
                            self.state.roomCode = res.session.roomCode;
                            self.lastKnownTurnNumber = self.state.turnNumber;
                            self.selectedNodeId = self.state.players[self.state.currentPlayerIndex].nodeId;
                            self.renderGameScreen();

                            if (window.PRS_Audio) window.PRS_Audio.playNotice();
                            if (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex && prevPlayerIdx !== self.myOnlinePlayerIndex) {
                                self.addLog("🔔 Jsi na tahu! Spoluhráč dokončil svůj tah.", "win");
                            }
                            self.scheduleBotTurnIfNeeded();
                        } else if (manual) {
                            self.renderOnlineRoomBar();
                        }
                    }
                })
                .catch(function () {
                    self.isOnlineSyncing = false;
                });
        };

        // Manuální stisk tlačítka Sync vynutí okamžité plné načtení
        if (manual) {
            fetchFullSession();
            return;
        }

        // Automatický polling: Odlehčený Headless Turn-Check (~180 bajtů namísto ~100 kB JSONu)
        fetch("api.ashx?action=check-session&code=" + encodeURIComponent(roomCode))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    var needsFullFetch = false;

                    // 1. Změnilo se číslo tahu?
                    if (res.turnNumber !== self.state.turnNumber) {
                        needsFullFetch = true;
                    }
                    // 2. Změnil se aktivní hráč na tahu?
                    else if (res.currentPlayerIndex !== self.state.currentPlayerIndex) {
                        needsFullFetch = true;
                    }
                    // 3. Byla hra mezitím dokončena?
                    else if (res.gameStatus === "Finished" && self.state.phase !== "GAME_OVER") {
                        needsFullFetch = true;
                    }
                    // 4. Došlo k uložení na serveru s novým časovým razítkem (a já nejsem zrovna na tahu)?
                    else if (self.lastKnownUpdatedAt && res.updatedAt && res.updatedAt !== self.lastKnownUpdatedAt) {
                        var isMyTurnNow = (self.myOnlinePlayerIndex >= 0 && self.state.currentPlayerIndex === self.myOnlinePlayerIndex);
                        if (!isMyTurnNow) {
                            needsFullFetch = true;
                        }
                    }

                    if (needsFullFetch) {
                        fetchFullSession();
                    } else {
                        self.isOnlineSyncing = false;
                        self.lastKnownUpdatedAt = res.updatedAt;
                    }
                } else {
                    // Fallback na plný load při neočekávané odpovědi
                    fetchFullSession();
                }
            })
            .catch(function () {
                self.isOnlineSyncing = false;
            });
    },

    saveCurrentSessionToCloud: function () {
        var self = this;
        if (!this.state) return;
        var statusEl = document.getElementById("cloud-save-status");
        if (statusEl) statusEl.textContent = "Ukládám hru do databáze...";

        var payload = {
            sessionGuid: this.state.sessionGuid || "",
            roomCode: this.state.roomCode || "",
            title: "Princeznino srdce – Kolo " + this.state.roundNumber,
            boardCode: this.state.board ? this.state.board.code : "classic_96",
            status: this.state.phase === "GAME_OVER" ? "Finished" : "Active",
            currentTurnPlayer: this.state.currentPlayerIndex,
            turnNumber: this.state.turnNumber,
            expectedTurnNumber: (this.lastKnownTurnNumber !== undefined) ? this.lastKnownTurnNumber : -1,
            targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,
            winnerName: (this.state.winner ? this.state.winner.name : null),
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        };

        var isNewRoom = !this.state.roomCode;
        if (isNewRoom && this.myOnlinePlayerIndex < 0) {
            this.myOnlinePlayerIndex = 0;
            if (this.state.players && this.state.players[0]) {
                this.state.players[0].isOnlineHost = true;
                this.state.players[0].type = "Human";
            }
        }

        fetch("api.ashx?action=save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(function (r) {
                if (r.status === 409) {
                    return r.json().then(function (conf) {
                        if (statusEl) statusEl.innerHTML = "⚠️ Konflikt: Tah byl odehrán na jiném zařízení.";
                        self.handleTurnConflict(conf);
                    });
                }
                if (!r.ok) {
                    throw new Error("HTTP " + r.status);
                }
                return r.json().then(function (res) {
                    if (res && res.ok) {
                        self.state.sessionGuid = res.sessionGuid;
                        self.state.roomCode = res.roomCode;
                        self.lastKnownTurnNumber = self.state.turnNumber;
                        if (isNewRoom) {
                            try {
                                localStorage.setItem("prs_slot_" + res.roomCode, "0");
                            } catch (e) { }
                            if (window.PRS_Audio) window.PRS_Audio.playFanfare();
                            self.copyRoomInviteLink();
                            alert("🌐 Hra byla úspěšně převedena na Online stůl!\n\nKód místnosti: " + res.roomCode + "\n\nOdkaz pro přátele byl zkopírován do schránky.");
                        }
                        if (statusEl) statusEl.innerHTML = "✅ Uloženo! Kód místnosti: <strong>" + res.roomCode + "</strong>";
                        self.renderOnlineRoomBar();
                        self.fetchServerStatusAndSessions();
                        self.addLog("☁️ Hra uložena do cloudu! Kód online místnosti: " + res.roomCode, "turn");
                    } else {
                        if (statusEl) statusEl.textContent = "⚠️ Uloženo lokálně v prohlížeči.";
                        localStorage.setItem("prs_saved_game", JSON.stringify(self.state));
                    }
                });
            })
            .catch(function (err) {
                localStorage.setItem("prs_saved_game", JSON.stringify(self.state));
                if (statusEl) statusEl.textContent = "💾 Uloženo do lokální paměti prohlížeče.";
                alert("Nepodařilo se synchronizovat online místnost se serverem (" + (err && err.message ? err.message : err) + "). Hra je uložena lokálně v prohlížeči.");
            });
    },

    saveSessionAuto: function () {
        var self = this;
        if (!this.state || !this.state.sessionGuid) return Promise.resolve();
        this.isSavingSession = true;

        var payload = {
            sessionGuid: this.state.sessionGuid,
            roomCode: this.state.roomCode || this.state.sessionGuid.substring(0, 6).toUpperCase(),
            title: "Princeznino srdce – Kolo " + this.state.roundNumber,
            boardCode: this.state.board ? this.state.board.code : "classic_96",
            status: this.state.phase === "GAME_OVER" ? "Finished" : "Active",
            currentTurnPlayer: this.state.currentPlayerIndex,
            turnNumber: this.state.turnNumber,
            expectedTurnNumber: (this.lastKnownTurnNumber !== undefined) ? this.lastKnownTurnNumber : (this.state.turnNumber - 1),
            targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,
            winnerName: (this.state.winner ? this.state.winner.name : null),
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        };

        return fetch("api.ashx?action=save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(function (r) {
                if (r.status === 409) {
                    return r.json().then(function (conf) {
                        self.handleTurnConflict(conf);
                    });
                }
                return r.json().then(function (res) {
                    if (res && res.ok) {
                        self.lastKnownTurnNumber = self.state.turnNumber;
                    }
                });
            })
            .catch(function () {
                // Tichý fallback při síťových výpadcích
            })
            .finally(function () {
                self.isSavingSession = false;
            });
    },

    handleTurnConflict: function (res) {
        if (!res) return;
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        var msg = "⚠️ Konflikt tahů: jiný hráč již odehrál svůj tah na serveru (tah #" + (res.serverTurnNumber || "?") + "). Herní plán byl synchronizován.";
        this.addLog(msg, "warning");
        if (res.stateJson) {
            try {
                var newState = JSON.parse(res.stateJson);
                if (newState && newState.players) {
                    this.state = newState;
                    this.lastKnownTurnNumber = this.state.turnNumber;
                    this.renderGameScreen();
                }
            } catch (e) {
                console.error("Chyba při synchronizaci stavu hry po konfliktu:", e);
            }
        }
    },

    fetchServerStatusAndSessions: function () {
        var self = this;
        fetch("api.ashx?action=list-sessions")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.sessions) {
                    self.renderSavedSessionsList(res.sessions);
                }
            })
            .catch(function () { });
    },

    renderSavedSessionsList: function (sessions) {
        var box = document.getElementById("saved-sessions-list");
        if (!box) return;
        if (!sessions || sessions.length === 0) {
            box.innerHTML = '<div class="empty-note">Zatím žádné uložené rozehrané partie na serveru.</div>';
            return;
        }
        var html = "";
        for (var i = 0; i < sessions.length; i++) {
            var s = sessions[i];
            html += '<div class="saved-session-row">' +
                '<div><strong>' + this.escapeHtml(s.title) + '</strong> <span class="room-code-pill">Kód: ' + s.roomCode + '</span><br/><small>Tah ' + s.turnNumber + ' | Cíl: ' + s.targetHearts + ' 💖 | ' + s.updatedAt + '</small></div>' +
                '<button class="btn-action-buy" onclick="PRS_App.loadSessionFromCloud(\'' + s.roomCode + '\')">▶️ Načíst</button>' +
                '</div>';
        }
        box.innerHTML = html;
    },

    loadSessionFromCloud: function (codeOrGuid) {
        var self = this;
        var inputEl = document.getElementById("join-room-code-input");
        var code = codeOrGuid || (inputEl ? inputEl.value.trim().toUpperCase() : "");
        if (!code) return;

        fetch("api.ashx?action=load-session&code=" + encodeURIComponent(code))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.session && res.session.stateJson) {
                    self.state = JSON.parse(res.session.stateJson);
                    self.state.sessionGuid = res.session.sessionGuid;
                    self.state.roomCode = res.session.roomCode;
                    self.lastKnownTurnNumber = self.state.turnNumber;
                    self.switchTab("board");

                    // Zjistíme, zda už má tento hráč v prohlížeči pro tuto místnost vybranou postavu
                    var savedSlot = null;
                    try {
                        savedSlot = localStorage.getItem("prs_slot_" + self.state.roomCode);
                    } catch (e) { }

                    if (savedSlot !== null && savedSlot !== undefined && savedSlot !== "" && savedSlot !== "-1") {
                        self.myOnlinePlayerIndex = parseInt(savedSlot, 10);
                        self.renderGameScreen();
                    } else {
                        // Nově připojený hráč si musí ihned vybrat postavu, za kterou chce hrát!
                        self.myOnlinePlayerIndex = -1;
                        self.renderGameScreen();
                        self.openOnlineRoleModal();
                    }

                    self.addLog("☁️ Hra byla úspěšně načtena ze serveru (Kód: " + res.session.roomCode + ", tah #" + self.state.turnNumber + ").", "turn");
                    if (window.PRS_Audio) window.PRS_Audio.playNotice();
                }
            })
            .catch(function () { });
    }
    });
})();
