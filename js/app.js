// ============================================================================
// KiDesky: Princeznino srdce - Hlavní aplikační jádro, stav, navigace, PWA a zkratky
// ============================================================================

window.PRS_App = {
    state: null,

    activeConfig: null,

    graphicsConfig: null,

    armoryActiveTab: "all",

    currentUser: {

        id: null,

        username: "Host",

        displayName: "Host",

        role: "Guest",

        token: null

    },

    userCredits: 250,

    selectedPawnId: "knight_valiant",

    unlockedPawns: ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"],

    pawnPickerTargetSlot: 0,

    pawnShopActiveCategory: "all",

    lobbyPlayers: [

        { name: "Host (Ty)", type: "Human", pawnId: "knight_valiant" },

        { name: "Černý Baron (PC)", type: "Bot_Aggressive", pawnId: "bot_aggressive" },

        { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder", pawnId: "bot_breeder" },

        { name: "Kněžna Eliška (PC)", type: "Bot_Noble", pawnId: "bot_noble" }

    ],

    getDefaultPlayerName: function () {
        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            return "Host (Ty)";
        }

        // 1. Přihlášený uživatel (DisplayName / hezky upravený login)
        if (this.currentUser && this.currentUser.role !== "Guest") {
            var d = (this.currentUser.displayName || "").trim();
            if (d && d.toLowerCase() !== "admin" && d.indexOf("@") === -1 && d.toLowerCase() !== "host") {
                return d.replace(/\s*\(Ty\)$/i, "") + " (Ty)";
            }
            var u = (this.currentUser.username || "").trim();
            if (u) {
                if (u.indexOf("@") !== -1) {
                    var localPart = u.split("@")[0].replace(/[._-]/g, " ");
                    var prettyNick = localPart.replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();
                    if (prettyNick) return prettyNick + " (Ty)";
                } else if (u.toLowerCase() === "admin") {
                    return "Rytíř Admin (Ty)";
                } else if (u.toLowerCase() !== "host") {
                    return u + " (Ty)";
                }
            }
        }

        return "Host (Ty)";
    },

    selectedNodeId: null,

    autoBotTimer: null,

    autoBotEnabled: true,

    isMoveAnimating: false,

    animatingPlayerIndex: null,

    animTokenPos: null,

    fastAnim: false,

    currentTheme: "light",

    isBoardStaticDirty: true,

    // Stav interaktivního Zoomu a Posouvání (Pan & Zoom) herní mapy

    viewport: {

        scale: 1.0,

        minScale: 1.0,

        maxScale: 3.5,

        panX: 0,

        panY: 0,

        isDragging: false,

        dragMoved: false,

        startX: 0,

        startY: 0,

        startPanX: 0,

        startPanY: 0,

        isPinching: false,

        pinchDist0: 0,

        pinchScale0: 1.0,

        pinchCenterX: 0,

        pinchCenterY: 0,

        pinchPanX0: 0,

        pinchPanY0: 0

    },

    // Stav detekce zařízení a mobilního vysouvacího šuplíku (Bottom Sheet)

    deviceProfile: {

        device: "desktop",

        orientation: "portrait",

        isTouch: false,

        override: null

    },

    activeMobileSheet: null,

    getPlayerDisplayName: function (player) {
        if (!player) return "";
        var name = (typeof player === "string") ? player : (player.name || "");
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        if (isEn) {
            name = name.replace(/\s*\(Ty\)$/i, " (You)").replace(/\s*\(PC\)$/i, " (AI)");
            name = name.replace(/^Černý Baron/i, "Black Baron")
                       .replace(/^Zikmund z Chovu/i, "Sigismund the Breeder")
                       .replace(/^Kněžna Eliška/i, "Princess Eliška")
                       .replace(/^Červený rytíř/i, "Red Knight")
                       .replace(/^Modrý rytíř/i, "Blue Knight")
                       .replace(/^Zelený rytíř/i, "Green Knight")
                       .replace(/^Zlatý rytíř/i, "Golden Knight")
                       .replace(/^Fialový rytíř/i, "Purple Knight")
                       .replace(/^Stříbrný rytíř/i, "Silver Knight")
                       .replace(/^Železný Strážce/i, "Iron Sentinel")
                       .replace(/^Baron z Růže/i, "Baron of the Rose")
                       .replace(/^Strážce Hvozdů/i, "Warden of the Wilds")
                       .replace(/^Čarodějka Astrida/i, "Astrida the Sorceress");
        } else {
            name = name.replace(/\s*\(You\)$/i, " (Ty)").replace(/\s*\(AI\)$/i, " (PC)");
            name = name.replace(/^Black Baron/i, "Černý Baron")
                       .replace(/^Sigismund the Breeder/i, "Zikmund z Chovu")
                       .replace(/^Princess Eliška/i, "Kněžna Eliška")
                       .replace(/^Red Knight/i, "Červený rytíř")
                       .replace(/^Blue Knight/i, "Modrý rytíř")
                       .replace(/^Green Knight/i, "Zelený rytíř")
                       .replace(/^Golden Knight/i, "Zlatý rytíř")
                       .replace(/^Purple Knight/i, "Fialový rytíř")
                       .replace(/^Silver Knight/i, "Stříbrný rytíř")
                       .replace(/^Iron Sentinel/i, "Železný Strážce")
                       .replace(/^Baron of the Rose/i, "Baron z Růže")
                       .replace(/^Warden of the Wilds/i, "Strážce Hvozdů")
                       .replace(/^Astrida the Sorceress/i, "Čarodějka Astrida");
        }
        return name;
    },

    init: function () {

        if (this._initialized) return;

        this._initialized = true;

        var self = this;

        try {
            this.activeConfig = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG);
        } catch (e) {
            console.warn("init activeConfig err:", e);
        }

        try {
            this.graphicsConfig = window.PRS_GameEngine.deepClone(window.PRS_GRAPHICS_CONFIG);
        } catch (e) {
            console.warn("init graphicsConfig err:", e);
        }

        try { this.loadSavedGraphicsConfig(); } catch (e) { console.warn("loadSavedGraphicsConfig err:", e); }

        try { this.loadSavedUser(); } catch (e) { console.warn("loadSavedUser err:", e); }

        try { this.checkEmailConfirmationUrl(); } catch (e) { console.warn("checkEmailConfirmationUrl err:", e); }

        this.isBoardStaticDirty = true;

        try { this.initTheme(); } catch (e) { console.warn("initTheme err:", e); }

        try { this.detectDeviceProfile(); } catch (e) { console.warn("detectDeviceProfile err:", e); }

        try { this.renderLobbyPlayers(); } catch (e) { console.warn("renderLobbyPlayers err:", e); }

        try { this.initMapPanAndZoom(); } catch (e) { console.warn("initMapPanAndZoom err:", e); }

        try { this.initKeyboardShortcuts(); } catch (e) { console.warn("initKeyboardShortcuts err:", e); }

        try { this.initAmbientCanvas(); } catch (e) { console.warn("initAmbientCanvas err:", e); }

        window.addEventListener("resize", function () {
            try { self.detectDeviceProfile(); } catch (e) { console.warn("[KiDesky] resize detectDeviceProfile err:", e); }
        });

        window.addEventListener("orientationchange", function () {
            setTimeout(function () {
                try { self.detectDeviceProfile(); } catch (e) { console.warn("[KiDesky] orientationchange detectDeviceProfile err:", e); }
            }, 160);
        });

        // Automatické zachování stavu rozehrané hry před jakýmkoliv obnovením (F5, Ctrl+F5) nebo zavřením
        window.addEventListener("beforeunload", function () {
            if (self.hasGameStarted && self.state && self.state.phase !== "GAME_OVER") {
                if (typeof self.saveActiveGameAutosave === "function") {
                    try { self.saveActiveGameAutosave(); } catch (e) { console.warn("[KiDesky] beforeunload autosave err:", e); }
                }
            }
        });

        // Reakce na změnu jazyka hry (i18n)
        window.addEventListener("prs:lang-change", function (e) {
            try { self.onLanguageChanged(e && e.detail ? e.detail.language : null); } catch (e) { console.warn(e); }
        });

        if (window.PRS_Audio) {
            try {
                window.PRS_Audio.init();
                this.updateAudioButtonUI();
                this.updateMusicUI();
            } catch (aErr) {
                console.warn("Audio init err:", aErr);
            }
        }

        // Spustíme výchozí ukázkovou partii (na pozadí pro okamžitý přechod ke stolu)
        try { this.initLandingLiveCanvas(); } catch (cErr) { console.warn("initLandingLiveCanvas err:", cErr); }
        try { this.renderHeroVideosSection(); } catch (vErr) { console.warn("renderHeroVideosSection err:", vErr); }
        try { this.loadActiveHeroVideo(); } catch (avErr) { console.warn("loadActiveHeroVideo err:", avErr); }

        try { this.loadAnnouncement(); } catch (e) { console.warn("[KiDesky] loadAnnouncement err:", e); }

        try { this.initPwa(); } catch (e) { console.warn("[KiDesky] initPwa err:", e); }

        this.hasGameStarted = false;

        try { this.startOnlinePollingLoop(); } catch (e) { console.warn("[KiDesky] startOnlinePollingLoop err:", e); }

        // Automatická obnova rozehrané hry z autosavu při F5 / Ctrl+F5
        var curSearch = (window.location && window.location.search) ? window.location.search : "";
        var forceWelcome = (curSearch.indexOf("welcome=1") !== -1 || curSearch.indexOf("new=1") !== -1);
        var restoredOk = false;

        if (!forceWelcome && curSearch.indexOf("room=") === -1) {
            if (typeof this.tryRestoreActiveGameAutosave === "function") {
                restoredOk = this.tryRestoreActiveGameAutosave();
            }
        }

        // Výchozí záložka při startu:
        // Ke stolu (tab-board) přecházíme POUZE pokud:
        // 1. Obnova z autosavu proběhla v pořádku (restoredOk && hasGameStarted && state)
        // 2. A ZÁROVEŇ byl hráč v tomto okně před obnovením prokazatelně u stolu (sTab === "board")!
        // Pokud byl hráč na Landing Page / Úvodu, nebo se odhlásil, zůstává na 'welcome' (s bannerem pokračovat).
        var sTab = null;
        try { sTab = sessionStorage.getItem("prs_active_tab"); } catch (eInit) { }

        var initialTab = "welcome";
        if (restoredOk && this.hasGameStarted && this.state && sTab === "board") {
            initialTab = "board";
        } else {
            if (sTab && (sTab === "lobby" || sTab === "rules" || sTab === "admin")) {
                initialTab = sTab;
            }
            if (curSearch.indexOf("room=") !== -1) {
                initialTab = "lobby";
            }
        }

        this.switchTab(initialTab);
        this.refreshBoardTemplateSelects();

        if (initialTab === "board" && restoredOk && this.state) {
            this.renderGameScreen();
            this.updateUserUI();
            this.addLog("🛡️ Rozehraná výprava (Kolo " + (this.state.roundNumber || 1) + ") byla po obnovení stránky zachována.", "turn");
            setTimeout(function () {
                if (self.centerOnActivePlayer) self.centerOnActivePlayer();
                if (self.scheduleBotTurnIfNeeded) self.scheduleBotTurnIfNeeded();
            }, 100);
        }

        if (initialTab === "lobby" && curSearch.indexOf("room=") !== -1) {
            this.switchGameHallRoom("online");
        }

        // Odložené naplnění skrytých záložek, kontrola ?room= v URL a načtení síťového stavu

        setTimeout(function () {

            self.fetchServerStatusAndSessions();
            if (self.updateSavedGamesUI) self.updateSavedGamesUI();
            if (window.PRS_I18n) {
                self.onLanguageChanged(window.PRS_I18n.getLanguage());
            }
            if (self.refreshBoardTemplateSelects) self.refreshBoardTemplateSelects();

            self.checkUrlRoomParam();
            if (self.loadBoardTemplatesFromServer) self.loadBoardTemplatesFromServer();

            PRS_Api.get("get-config")
                .then(function (res) {
                    if (res && res.ok && res.configJson) {
                        try {
                            var srvCfg = JSON.parse(res.configJson);
                            if (srvCfg && typeof srvCfg === "object") {
                                var merged = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG);
                                for (var k in srvCfg) {
                                    if (srvCfg.hasOwnProperty(k)) {
                                        if (srvCfg[k] && typeof srvCfg[k] === "object" && !Array.isArray(srvCfg[k]) && merged[k] && typeof merged[k] === "object") {
                                            for (var sk in srvCfg[k]) {
                                                if (srvCfg[k].hasOwnProperty(sk)) merged[k][sk] = srvCfg[k][sk];
                                            }
                                        } else {
                                            merged[k] = srvCfg[k];
                                        }
                                    }
                                }
                                self.activeConfig = merged;
                                if (typeof self.renderBalanceStudioInputs === "function") {
                                    self.renderBalanceStudioInputs();
                                }
                            }
                        } catch (e) { console.warn("[KiDesky] get-config apply err:", e); }
                    }
                })
                .catch(function (err) { console.warn("[KiDesky] get-config failed:", err); });

        }, 60);

        // Prevence nežádoucího autofillu prohlížeče (např. automatické vyplnění e-mailu do kódu stolu)

        var clearInvalidRoomCode = function () {

            var inp = document.getElementById("join-room-code-input");

            if (inp && inp.value && (inp.value.indexOf("@") !== -1 || inp.value.length > 8)) {

                inp.value = "";

            }

        };

        clearInvalidRoomCode();

        setTimeout(clearInvalidRoomCode, 250);

        setTimeout(clearInvalidRoomCode, 1000);

    },

    // ========================================================================

    // 5 ELEMENTÁRNÍCH BAREVNÝCH TÉMAT (ŽIVLŮ)

    // ========================================================================,

    initTheme: function () {

        var saved = (typeof localStorage !== "undefined") ? localStorage.getItem("kidesky_element_theme") : null;

        var theme = saved || "light";

        this.setElementTheme(theme, false);

        if (typeof localStorage !== "undefined") {
            var savedCastle = localStorage.getItem("kidesky_royal_castle");
            if (savedCastle) {
                this.selectedRoyalCastle = savedCastle;
                var rSel = document.getElementById("lobby-royal-castle");
                if (rSel) rSel.value = savedCastle;
            }
        }

    },

    setElementTheme: function (themeName, playSound) {

        var validThemes = ["light", "fire", "water", "earth", "air"];

        if (validThemes.indexOf(themeName) === -1) themeName = "light";

        this.currentTheme = themeName;

        if (typeof document !== "undefined") {

            if (document.documentElement) {

                document.documentElement.setAttribute("data-theme", themeName);

            }

            if (document.body) {

                if (playSound) {

                    document.body.classList.add("theme-transitioning");

                }

                document.body.setAttribute("data-theme", themeName);

            }

            // Aktualizace tlačítek přepínače
            var btns = document.querySelectorAll(".theme-btn");
            for (var b = 0; b < btns.length; b++) {
                var btn = btns[b];
                if (btn.getAttribute("data-theme-btn") === themeName) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            }

            // Synchronizace výběrových políček živlu (topbar a lobby)
            var globalSelect = document.getElementById("global-element-theme-select");
            if (globalSelect && globalSelect.value !== themeName) {
                globalSelect.value = themeName;
            }
            var lobbySelect = document.getElementById("lobby-element-theme-select");
            if (lobbySelect && lobbySelect.value !== themeName) {
                lobbySelect.value = themeName;
            }

        }

        // Trvalá paměť v prohlížeči

        if (typeof localStorage !== "undefined") {

            localStorage.setItem("kidesky_element_theme", themeName);

        }

        // Živlová adaptace dominantních zámků a draků na mapě

        var themeCastles = {

            light: "assets/castles/castle_royal.webp",

            fire: "assets/castles/castle_lava.webp",

            water: "assets/castles/castle_water.webp",

            earth: "assets/castles/castle_forest.webp",

            air: "assets/castles/castle_wind.webp"

        };

        var themeDragons = {

            light: "assets/dragons/dragon_gold.webp",

            fire: "assets/dragons/dragon_volcano.webp",

            water: "assets/dragons/dragon_ice.webp",

            earth: "assets/dragons/dragon_green.webp",

            air: "assets/dragons/dragon_wind.webp"

        };

        if (this.graphicsConfig && this.graphicsConfig.landmarkBitmaps) {

            this.graphicsConfig.landmarkBitmaps.royalCastle = themeCastles[themeName] || "assets/castles/castle_royal.webp";

            this.graphicsConfig.landmarkBitmaps.dragonLair = themeDragons[themeName] || "assets/dragons/dragon_volcano.webp";

        }

        // Zvukový efekt živlu při manuálním přepnutí

        if (playSound !== false && window.PRS_Audio) {

            window.PRS_Audio.playItem();

        }

        // Přebarvení SVG desky

        if (this.state) {

            this.isBoardStaticDirty = true;

            this.renderBoardSVG();

        }

    },

    // ========================================================================
    // PWA & MOBILNÍ INSTALACE (SERVICE WORKER & BEFOREINSTALLPROMPT)
    // ========================================================================
    initPwa: function () {
        var self = this;

        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && window.location) {
            var isSecureSw = (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            if (isSecureSw && !window._pwaSwRegistered) {
                window._pwaSwRegistered = true;
                navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).catch(function (err) {
                    window._pwaSwRegistered = false;
                    console.warn('[PWA] Service Worker registration failed:', err);
                });
            }
        }

        var topBtn = document.getElementById('topbar-pwa-install-btn');
        var setStatus = document.getElementById('settings-pwa-status');
        var setBtn = document.getElementById('settings-pwa-install-btn');

        this.checkPwaInstalledStatus();

        // Pokud nejsme v standalone režimu a už máme prompt, aktualizujeme UI
        if (window._pwaDeferredPrompt) {
            if (topBtn) topBtn.style.display = 'inline-flex';
            if (setStatus) setStatus.textContent = (window.PRS_I18n ? window.PRS_I18n.t("settings.pwa_status_ready") : "Aplikace je připravena k instalaci.");
            if (setBtn) {
                setBtn.style.display = 'inline-flex';
                setBtn.textContent = (window.PRS_I18n ? window.PRS_I18n.t("settings.pwa_btn") : "📲 Nainstalovat na plochu");
            }
        } else if (topBtn && !window._pwaIsInstalled) {
            topBtn.style.display = 'inline-flex';
        }
    },

    onPwaPromptReady: function () {
        var topBtn = document.getElementById('topbar-pwa-install-btn');
        var setStatus = document.getElementById('settings-pwa-status');
        var setBtn = document.getElementById('settings-pwa-install-btn');

        if (!window._pwaIsInstalled) {
            if (topBtn) topBtn.style.display = 'inline-flex';
            if (setStatus) setStatus.textContent = (window.PRS_I18n ? window.PRS_I18n.t("settings.pwa_status_ready") : "Aplikace je připravena k instalaci.");
            if (setBtn) {
                setBtn.style.display = 'inline-flex';
                setBtn.textContent = (window.PRS_I18n ? window.PRS_I18n.t("settings.pwa_btn") : "📲 Nainstalovat na plochu");
            }
        }

        if (window._pwaInstallRequested && window._pwaDeferredPrompt) {
            window._pwaInstallRequested = false;
            this.promptPwaInstall();
        }
    },

    checkPwaInstalledStatus: function () {
        var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
        if (isStandalone) {
            window._pwaIsInstalled = true;
            this.updatePwaUiForInstalled();
            return;
        }
        var self = this;
        if ('getInstalledRelatedApps' in navigator) {
            navigator.getInstalledRelatedApps().then(function (apps) {
                if (apps && apps.length > 0) {
                    window._pwaIsInstalled = true;
                    self.updatePwaUiForInstalled();
                }
            }).catch(function (err) {
                console.warn('[PWA] getInstalledRelatedApps check failed:', err);
            });
        }
    },

    updatePwaUiForInstalled: function () {
        var topBtn = document.getElementById('topbar-pwa-install-btn');
        if (topBtn) topBtn.style.display = 'none';
        var setStatus = document.getElementById('settings-pwa-status');
        if (setStatus) {
            setStatus.textContent = (window.PRS_I18n ? window.PRS_I18n.t("settings.pwa_status_installed") : "Aplikace je již nainstalována.");
            setStatus.style.color = '#4ade80';
            setStatus.style.fontWeight = '700';
        }
        var setBtn = document.getElementById('settings-pwa-install-btn');
        if (setBtn) {
            setBtn.textContent = (window.PRS_I18n ? window.PRS_I18n.t("pwa.installed_btn") : "✅ Nainstalováno na ploše");
            setBtn.style.background = 'rgba(16, 185, 129, 0.2)';
            setBtn.style.borderColor = '#10b981';
        }
    },

    promptPwaInstall: function () {
        var self = this;
        var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
        if (isStandalone || window._pwaIsInstalled) {
            if (this.showToast) {
                this.showToast((window.PRS_I18n ? window.PRS_I18n.t("pwa.already_installed") : "✅ KiDesky již běží jako nainstalovaná aplikace na tvém zařízení!"), 'good');
            }
            return;
        }

        // 1. Přímé spuštění nativního instalačního dialogu (1-klik v Chrome / Edge / Android)
        if (window._pwaDeferredPrompt) {
            var deferred = window._pwaDeferredPrompt;
            deferred.prompt();
            deferred.userChoice.then(function (choiceResult) {
                if (choiceResult && choiceResult.outcome === 'accepted') {
                    console.log('[PWA] Uživatel potvrdil instalaci aplikace.');
                    if (self.showToast) {
                        self.showToast((window.PRS_I18n ? window.PRS_I18n.t("pwa.installing") : "📲 KiDesky se instaluje na tvou plochu..."), 'success');
                    }
                    window._pwaDeferredPrompt = null;
                    self.updatePwaUiForInstalled();
                } else {
                    console.log('[PWA] Uživatel odložil instalaci.');
                }
            }).catch(function (err) {
                console.warn('[PWA] Chyba při vyvolání promptu:', err);
                self.openPwaInstallHelpModal();
            });
            return;
        }

        // 2. Pokud prompt zatím nedorazil na PC / Android (prohlížeč ještě inicializuje SW)
        var platform = this.detectPlatformForPwa();
        if (platform === 'pc' || platform === 'android') {
            if (this.showToast) {
                this.showToast((window.PRS_I18n ? window.PRS_I18n.t("pwa.opening") : "⏳ Otevírám instalaci aplikace pro tvůj prohlížeč..."), 'info');
            }
            window._pwaInstallRequested = true;

            // Počkáme 1.6s zda událost dorazí a automaticky vyvolá dialog
            setTimeout(function () {
                if (!window._pwaDeferredPrompt && window._pwaInstallRequested) {
                    window._pwaInstallRequested = false;
                    if ('getInstalledRelatedApps' in navigator) {
                        navigator.getInstalledRelatedApps().then(function (apps) {
                            if (apps && apps.length > 0) {
                                window._pwaIsInstalled = true;
                                self.updatePwaUiForInstalled();
                                if (self.showToast) {
                                    self.showToast((window.PRS_I18n ? window.PRS_I18n.t("pwa.already_installed_pc") : "ℹ️ KiDesky je již na tomto počítači nainstalována! Spustit ji můžeš z nabídky Start nebo ikony v adresním řádku."), 'info');
                                }
                                return;
                            }
                            self.openPwaInstallHelpModal();
                        }).catch(function () {
                            self.openPwaInstallHelpModal();
                        });
                    } else {
                        self.openPwaInstallHelpModal();
                    }
                }
            }, 1600);
            return;
        }

        // 3. Na iOS Safari (kde Apple nativní tlačítko nepodporuje) otevřeme srozumitelný návod
        this.openPwaInstallHelpModal();
    },

    detectPlatformForPwa: function () {
        var ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
        if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            return 'ios';
        }
        if (/Android/i.test(ua)) {
            return 'android';
        }
        return 'pc';
    },

    openPwaInstallHelpModal: function (forceTab) {
        var tab = forceTab || this.detectPlatformForPwa();
        this.setPwaInstallTab(tab);
        var modal = document.getElementById('pwa-install-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else if (this.showToast) {
            this.showToast((window.PRS_I18n ? window.PRS_I18n.t("pwa.mobile_hint") : "ℹ️ Pro instalaci na mobilu použij volbu „Přidat na plochu“ v nabídce prohlížeče."), 'info');
        }
    },

    closePwaInstallModal: function () {
        var modal = document.getElementById('pwa-install-modal');
        if (modal) modal.style.display = 'none';
    },

    setPwaInstallTab: function (tab) {
        var tabs = ['ios', 'android', 'pc'];
        tabs.forEach(function (t) {
            var btn = document.getElementById('pwa-tab-' + t);
            var content = document.getElementById('pwa-content-' + t);
            if (btn) {
                if (t === tab) {
                    btn.style.borderColor = 'rgba(212,175,55,0.7)';
                    btn.style.background = 'rgba(212,175,55,0.25)';
                    btn.style.color = '#fef3c7';
                } else {
                    btn.style.borderColor = 'rgba(255,255,255,0.12)';
                    btn.style.background = 'rgba(0,0,0,0.3)';
                    btn.style.color = '#94a3b8';
                }
            }
            if (content) {
                content.style.display = (t === tab) ? 'block' : 'none';
            }
        });
    },

    showToast: function (message, type) {
        try {
            var container = document.getElementById('kidesky-toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'kidesky-toast-container';
                container.style.cssText = 'position:fixed; top:24px; left:50%; transform:translateX(-50%); z-index:9999999; display:flex; flex-direction:column; gap:8px; pointer-events:none; width:min(90vw, 440px);';
                document.body.appendChild(container);
            }
            var toast = document.createElement('div');
            var bg = 'linear-gradient(135deg, rgba(30, 20, 15, 0.97), rgba(15, 10, 8, 0.98))';
            var border = '1px solid rgba(212, 175, 55, 0.6)';
            var color = '#fef3c7';
            if (type === 'good' || type === 'success') {
                border = '1px solid #10b981';
                color = '#a7f3d0';
            } else if (type === 'warning' || type === 'danger' || type === 'error') {
                border = '1px solid #f87171';
                color = '#fecaca';
            } else if (type === 'info' || type === 'notice') {
                border = '1px solid #38bdf8';
                color = '#bae6fd';
            }
            toast.style.cssText = 'background:' + bg + '; border:' + border + '; color:' + color + '; padding:10px 18px; border-radius:10px; font-family:"Outfit",sans-serif; font-size:0.88rem; box-shadow:0 10px 30px rgba(0,0,0,0.7); pointer-events:auto; text-align:center; transition:opacity 0.28s ease, transform 0.28s ease; opacity:0; transform:translateY(-12px); display:flex; align-items:center; justify-content:center; gap:8px; line-height:1.45; font-weight:500; backdrop-filter:blur(6px);';
            toast.textContent = String(message === null || message === undefined ? '' : message);
            container.appendChild(toast);
            requestAnimationFrame(function () {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
            setTimeout(function () {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-12px)';
                setTimeout(function () {
                    if (toast.parentNode) toast.parentNode.removeChild(toast);
                }, 300);
            }, 3800);
        } catch (e) {
            console.log('[Toast Error]', e);
        }
    },

    // ========================================================================

    // DETEKCE ZAŘÍZENÍ A MOBILNÍ / TABLETOVÁ ERGONOMIE (MOBILE HUD)

    // ========================================================================,

    detectDeviceProfile: function () {

        var w = window.innerWidth || 1200;

        var h = window.innerHeight || 800;

        var isTouch = (typeof window !== "undefined") && (

            (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||

            ('ontouchstart' in window) ||

            (navigator.maxTouchPoints > 0)

        );

        var orientation = (h >= w) ? "portrait" : "landscape";

        var savedOverride = (typeof localStorage !== "undefined") ? localStorage.getItem("kidesky_device_override") : null;

        if (w >= 1050 && h > 540 && savedOverride === "mobile") {

            try { localStorage.removeItem("kidesky_device_override"); } catch (e) { }

            savedOverride = null;

        }

        var isMobileLandscape = isTouch && (h <= 540) && (w < 1050);

        var device = "desktop";

        if (savedOverride === "mobile" || savedOverride === "desktop") {

            device = savedOverride;

        } else {

            if (w < 768 || isMobileLandscape) {

                device = "mobile";

            } else if (w < 1024) {

                device = "tablet";

            } else {

                device = "desktop";

            }

        }

        this.deviceProfile = {

            device: device,

            orientation: orientation,

            isTouch: isTouch,

            width: w,

            height: h,

            override: savedOverride

        };

        if (typeof document !== "undefined" && document.body) {

            document.body.setAttribute("data-device", device);

            document.body.setAttribute("data-orientation", orientation);

            document.body.setAttribute("data-touch", isTouch ? "true" : "false");

            if (this.activeTab === "board" && device === "mobile") {

                document.body.classList.add("on-board-tab");

            } else {

                document.body.classList.remove("on-board-tab");

            }

        }

        this.updateDeviceSwitcherUI();

        this.updateMobileDock();

        if (this.activeTab === "board" && typeof this.renderActionPanel === "function" && this.hasGameStarted && this.state && this.state.players && this.state.players[this.state.currentPlayerIndex]) {

            this.renderActionPanel();

        }

        return this.deviceProfile;

    },

    cycleDeviceMode: function () {

        var cur = (typeof localStorage !== "undefined") ? localStorage.getItem("kidesky_device_override") : null;

        var next = null;

        if (!cur) {

            next = "mobile";

        } else if (cur === "mobile") {

            next = "desktop";

        } else {

            next = null; // Zpět na automatiku

        }

        if (typeof localStorage !== "undefined") {

            if (next) localStorage.setItem("kidesky_device_override", next);

            else localStorage.removeItem("kidesky_device_override");

        }

        this.detectDeviceProfile();

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

    },

    updateDeviceSwitcherUI: function () {

        var btn = document.getElementById("device-mode-toggle-btn");

        if (!btn) return;

        var cur = this.deviceProfile.override;

        var icon = (this.deviceProfile.device === "mobile") ? "📱" : ((this.deviceProfile.device === "tablet") ? "📟" : "💻");

        var devLabel = (this.deviceProfile.device === "mobile" ? "Mobil" : (this.deviceProfile.device === "tablet" ? "Tablet" : "PC"));

        var label = (!cur) ? (icon + " Režim: Auto (" + devLabel + ")")

                           : (icon + " Režim: " + (cur === "mobile" ? "Mobil" : "PC"));

        btn.textContent = label;

        this.syncSettingsDeviceLabel();

    },

    // --- AKTUALIZACE SPODNÍHO MOBILNÍHO DOCKU (STICKY THUMB HUD) ---,

    toggleSound: function () {

        if (!window.PRS_Audio) return;

        var muted = window.PRS_Audio.toggleMute();

        this.updateAudioButtonUI();

        if (!muted) {

            window.PRS_Audio.playCoin();

        }

    },

    updateAudioButtonUI: function () {

        var btn = document.getElementById("audio-toggle-btn");

        if (btn && window.PRS_Audio) {

            var muted = window.PRS_Audio.muted;

            btn.innerHTML = muted ? "🔇 Zvuk: Vyp" : "🔊 Zvuk: Zap";

            btn.style.color = muted ? "#94a3b8" : "var(--gold-light)";

            btn.style.borderColor = muted ? "rgba(255,255,255,0.15)" : "var(--gold)";

        }

        this.syncSettingsSoundLabel();

    },

    _safeCall: function (label, fn, ctx) {
        if (typeof fn !== "function") return;
        try {
            fn.call(ctx || this);
        } catch (err) {
            console.warn("[KiDesky] " + label + " error:", err);
        }
    },

    ensureRulesLoaded: function () {
        var lang = (window.PRS_I18n && window.PRS_I18n.getLanguage()) || "cs";
        if (this._rulesBundleLoaded && window.PRS_I18N_RULES && window.PRS_I18N_RULES[lang]) {
            return Promise.resolve();
        }
        if (window.PRS_ModuleLoader && typeof window.PRS_ModuleLoader.ensureRulesBundle === "function") {
            return window.PRS_ModuleLoader.ensureRulesBundle(lang).catch(function (err) {
                if (window.KiDeskyToast && window.PRS_I18n) {
                    window.KiDeskyToast.show(window.PRS_I18n.t("ui.loading_module_error", null, "⚠️ Nepodařilo se načíst modul."), "warning");
                }
                throw err;
            });
        }
        return Promise.resolve();
    },

    ensureAdminLoaded: function () {
        if (this._adminModuleLoaded) {
            return Promise.resolve();
        }
        if (window.PRS_ModuleLoader && typeof window.PRS_ModuleLoader.ensureAdminBundle === "function") {
            return window.PRS_ModuleLoader.ensureAdminBundle().catch(function (err) {
                if (window.KiDeskyToast && window.PRS_I18n) {
                    window.KiDeskyToast.show(window.PRS_I18n.t("ui.loading_module_error", null, "⚠️ Nepodařilo se načíst modul."), "warning");
                }
                throw err;
            });
        }
        return Promise.resolve();
    },

    ensureMapEditorLoaded: function () {
        if (window.PRS_MapEditor) {
            return Promise.resolve(window.PRS_MapEditor);
        }
        if (window.PRS_ModuleLoader && typeof window.PRS_ModuleLoader.ensureMapEditor === "function") {
            return window.PRS_ModuleLoader.ensureMapEditor().catch(function (err) {
                if (window.KiDeskyToast && window.PRS_I18n) {
                    window.KiDeskyToast.show(window.PRS_I18n.t("ui.loading_module_error", null, "⚠️ Nepodařilo se načíst modul."), "warning");
                }
                throw err;
            });
        }
        return Promise.resolve(window.PRS_MapEditor || null);
    },

    openTileHelp: function (tileType, tileCode) {
        var self = this;
        return this.ensureRulesLoaded().then(function () {
            if (typeof self.openRulesHelpForTile === "function") {
                self.openRulesHelpForTile(tileType, tileCode);
            }
        });
    },

    openAdminSaveBoardModal: function () {
        var self = this;
        return this.ensureAdminLoaded().then(function () {
            if (typeof self.openSaveToPredefinedModal === "function") {
                self.openSaveToPredefinedModal();
            }
        });
    },

    onLanguageChanged: function (lang) {
        var self = this;
        if (window.PRS_I18n) {
            window.PRS_I18n.translateDOM();
            window.PRS_I18n.syncUi();
        }

        this._safeCall("renderAnnouncement", this.renderAnnouncement);
        this._safeCall("renderCurrentUserCard", this.renderCurrentUserCard);
        this._safeCall("updateUserUI", this.updateUserUI);
        this._safeCall("updateGameHallCrestUI", this.updateGameHallCrestUI);
        var crestModal = document.getElementById("crest-picker-modal");
        if (crestModal && crestModal.style.display !== "none") {
            this._safeCall("renderCrestPickerModal", this.renderCrestPickerModal);
        }
        this._safeCall("refreshMapStudioSelectOptions", this.refreshMapStudioSelectOptions);
        this._safeCall("syncMapStudioInputsFromRecipe", this.syncMapStudioInputsFromRecipe);
        this._safeCall("updateMapStudioPreview", this.updateMapStudioPreview);
        this._safeCall("renderCardDecksRow", this.renderCardDecksRow);
        this._safeCall("refreshLobbySettingsSelects", this.refreshLobbySettingsSelects);
        this._safeCall("updateSavedGamesUI", this.updateSavedGamesUI);
        this._safeCall("renderRuleGuide", this.renderRuleGuide);
        this._safeCall("renderGlossary", this.renderGlossary);
        this._safeCall("renderTilesAtlas", this.renderTilesAtlas);
        this._safeCall("renderSidebarQuickLogPanel", this.renderSidebarQuickLogPanel);
        if (this.lastSavedSessions && typeof this.renderSavedSessionsList === "function") {
            this._safeCall("renderSavedSessionsList", function () { self.renderSavedSessionsList(self.lastSavedSessions); });
        }
        var pawnModal = document.getElementById("pawn-shop-modal");
        if (pawnModal && pawnModal.style.display !== "none") {
            this._safeCall("renderPawnShopModal", this.renderPawnShopModal);
        }
        this._safeCall("renderHeroVideosSection", this.renderHeroVideosSection);
        this._safeCall("refreshBoardTemplateSelects", this.refreshBoardTemplateSelects);

        // Pokud existuje renderer desky, překreslíme dominanty a nápisy
        if (typeof this.renderBoard === "function") {
            this._safeCall("renderBoard", this.renderBoard);
        } else if (this.boardRenderer && typeof this.boardRenderer.renderBoard === "function") {
            this._safeCall("boardRenderer.renderBoard", this.boardRenderer.renderBoard, this.boardRenderer);
        } else if (window.PRS_Board && typeof window.PRS_Board.renderBoard === "function") {
            this._safeCall("PRS_Board.renderBoard", window.PRS_Board.renderBoard, window.PRS_Board);
        }

        // Překreslíme lobby hráče a aktivní banner
        this._safeCall("renderLobbyPlayers", this.renderLobbyPlayers);
        var activeRound = document.getElementById("gamehall-active-round-info");
        if (activeRound && this.state) {
            var roundTxt = window.PRS_I18n ? window.PRS_I18n.t("lobby.active_game_info", { round: this.state.roundNumber || 1, count: this.state.players ? this.state.players.length : 4 }) : ("Kolo " + (this.state.roundNumber || 1) + " • " + (this.state.players ? this.state.players.length : 4) + " Rytířů");
            activeRound.textContent = roundTxt;
        }

        // Okamžitě překreslíme herní HUD, detail pole a spodní dashboard
        this._safeCall("syncSettingsSoundLabel", this.syncSettingsSoundLabel);
        this._safeCall("syncSettingsDeviceLabel", this.syncSettingsDeviceLabel);

        if (this.state) {
            this._safeCall("renderTopPlayersHud", this.renderTopPlayersHud);
            this._safeCall("renderHeartTrack", this.renderHeartTrack);
            this._safeCall("renderLowerKnightDetail", this.renderLowerKnightDetail);
            this._safeCall("updateHudTurnInfo", this.updateHudTurnInfo);
            this._safeCall("renderStandingTileDetail", this.renderStandingTileDetail);
            this._safeCall("renderActivePlayerPanel", this.renderActivePlayerPanel);
            this._safeCall("renderActionPanel", this.renderActionPanel);
            this._safeCall("renderStandingNodeCard", this.renderStandingNodeCard);
            this._safeCall("updateMobileDock", this.updateMobileDock);
            this._safeCall("renderKnightEmotesHud", this.renderKnightEmotesHud);
            this._safeCall("renderCardDecksRow", this.renderCardDecksRow);
            if (this.state.roomCode) {
                this._safeCall("renderOnlineRoomBar", this.renderOnlineRoomBar);
            }
        }

        // Zajištění reference pro PRS_Catalog
        window.PRS_Catalog = this;

        // Okamžité přerenderování všech podzáložek Pravidel a Katalogu
        this._safeCall("renderRulesAndCatalog", this.renderRulesAndCatalog);
        this._safeCall("renderCastlesGallery", this.renderCastlesGallery);
        this._safeCall("renderBestiary", this.renderBestiary);
        this._safeCall("renderTrophiesHall", this.renderTrophiesHall);
        this._safeCall("renderDecorationsGallery", this.renderDecorationsGallery);
        this._safeCall("renderRulesItemsTable", this.renderRulesItemsTable);
        if (typeof this.switchRulesView === "function") {
            this._safeCall("switchRulesView", function () { self.switchRulesView(self.rulesCurrentView || "quick"); });
        }
        this._safeCall("renderCheatSheetContent", this.renderCheatSheetContent);
        var wModal = document.getElementById("wardrobe-modal");
        if (wModal && wModal.style.display !== "none") {
            this._safeCall("renderWardrobeModal", this.renderWardrobeModal);
        }
        var tutModal = document.getElementById("tutorial-onboarding-modal");
        if (tutModal && tutModal.style.display !== "none") {
            this._safeCall("renderTutorialStep", this.renderTutorialStep);
        }
        var achModal = document.getElementById("achievements-modal");
        if (achModal && achModal.style.display !== "none") {
            this._safeCall("renderAchievementsModalContent", this.renderAchievementsModalContent);
        }
        var armModal = document.getElementById("armory-modal");
        if (armModal && armModal.style.display !== "none") {
            this._safeCall("renderArmoryModalContent", this.renderArmoryModalContent);
        }
        var seatsModal = document.getElementById("online-seats-modal");
        if (seatsModal && seatsModal.style.display !== "none") {
            this._safeCall("renderOnlineSeatsModal", this.renderOnlineSeatsModal);
        }
        this._safeCall("renderChatMessagesList", this.renderChatMessagesList);
        var deniedBox = document.getElementById("admin-guest-denied");
        if (deniedBox && deniedBox.style.display !== "none" && this.activeTab === "admin") {
            var tAdmLang = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
            deniedBox.innerHTML = '<div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">' +
                '<div style="font-size:3rem; margin-bottom:1rem;">🛡️🔒</div>' +
                '<h2 style="color:var(--gold-light); font-family:\'Cinzel\',serif;">' + tAdmLang("admin.access_denied_title", "Přístup vyhrazen pro Administrátora") + '</h2>' +
                '<p style="max-width:500px; margin:0.8rem auto 1.5rem;">' + tAdmLang("admin.access_denied_desc", "Pro správu videí, uživatelských účtů a herních relací se prosím přihlaste jako <strong>admin</strong>.") + '</p>' +
                '<button class="btn-primary" onclick="PRS_App.openAuthModal()">' + tAdmLang("admin.access_denied_btn", "🔑 Přihlásit se jako Admin") + '</button>' +
                '</div>';
        }
    },

    // --- VÍTĚZNÝ CEREMONIÁL & KRÁLOVSKÁ SVATBA (MODAL) ---,

    updateBodyModalClass: function () {
        if (window.PRS_ModalManager && typeof window.PRS_ModalManager.syncAll === "function") {
            window.PRS_ModalManager.syncAll();
            return;
        }
        var anyOpen = false;
        var backdrops = document.querySelectorAll(".modal-backdrop");
        for (var i = 0; i < backdrops.length; i++) {
            var d = backdrops[i].style.display;
            if (d && d !== "none") {
                anyOpen = true;
                break;
            }
        }
        if (document.body) {
            if (anyOpen) document.body.classList.add("modal-open");
            else document.body.classList.remove("modal-open");
        }
    },

    victoryModalShown: false,

    switchTab: function (tabId) {

        if (typeof this.closeProfileMenu === "function") this.closeProfileMenu();

        if (tabId === "balance") {
            this.switchTab("admin");
            if (this.switchAdminSubtab) this.switchAdminSubtab("balance");
            return;
        }

        if (tabId === "board" && !this.hasGameStarted) {
            this.switchTab("lobby");
            if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
            alert("Hrací stůl je zatím prázdný. Zvol si v Rytířské herně rychlou výpravu nebo zahaj partii.");
            return;
        }

        this.activeTab = tabId;
        try { sessionStorage.setItem("prs_active_tab", tabId); } catch (e) { }
        try { document.body.setAttribute("data-active-tab", tabId); } catch (e) { }
        if (this.updateResumeGameButtonUI) this.updateResumeGameButtonUI();

        // Královský posel nesmí být ve hře vůbec
        var annBanner = document.getElementById("topbar-announcement-banner");
        if (annBanner) {
            if (tabId === "board") {
                annBanner.style.display = "none";
            } else if (annBanner.dataset && annBanner.dataset.hasMessage === "true") {
                annBanner.style.display = "flex";
            }
        }

        var tabs = ["welcome", "lobby", "board", "rules", "admin"];

        for (var i = 0; i < tabs.length; i++) {

            var t = tabs[i];

            var sec = document.getElementById("tab-" + t);

            var btn = document.getElementById("nav-btn-" + t);

            if (sec) sec.style.display = (t === tabId) ? "block" : "none";

            if (btn) {

                if (t === tabId) btn.classList.add("active");

                else btn.classList.remove("active");

            }

        }

        // Přepnutí levého horního tlačítka: na Úvodu ukazuje "← Zpět na KikiAI", jinde "🏰 ← Zpět na Úvod & Videa"

        var backKikiEl = document.getElementById("topbar-back-kikiai");

        var backLandEl = document.getElementById("topbar-back-landing");

        if (backKikiEl) backKikiEl.style.display = (tabId === "welcome") ? "inline-block" : "none";

        if (backLandEl) {
            backLandEl.style.display = (tabId === "welcome") ? "none" : "inline-block";
            backLandEl.innerHTML = "🏰 ← Zpět na Úvod &amp; Videa";
            backLandEl.onclick = function () { PRS_App.switchTab("welcome"); };
        }

        // Pokud odcházíme z Úvodní stránky s videem, pozastavíme případné promo video

        if (tabId !== "welcome") {

            var vid = document.getElementById("lp-promo-video");

            if (vid && !vid.paused) {

                try { vid.pause(); } catch (e) { }

            }

        } else {

            if (typeof this.renderHeroVideosSection === "function") {
                try { this.renderHeroVideosSection(); } catch (vErr) { console.warn("switchTab renderHeroVideosSection err:", vErr); }
            }
            if (typeof this.initLandingLiveCanvas === "function") {
                try { this.initLandingLiveCanvas(); } catch (cErr) { console.warn("switchTab initLandingLiveCanvas err:", cErr); }
            }

        }

        if (tabId === "lobby") {

            this.fetchServerStatusAndSessions();
            this.updateGameHallUI();

        }

        if (tabId === "rules") {
            var self = this;
            if (this._rulesBundleLoaded && typeof this.renderRulesAndCatalog === "function") {
                this.renderRulesAndCatalog();
            } else {
                var rulesTab = document.getElementById("tab-rules");
                var tLoad = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
                if (rulesTab && !document.getElementById("rules-lazy-loading-banner")) {
                    var rBanner = document.createElement("div");
                    rBanner.id = "rules-lazy-loading-banner";
                    rBanner.style.cssText = "padding:1rem; margin:0.5rem 0 1rem; text-align:center; background:rgba(15,23,42,0.85); border:1px solid rgba(212,175,55,0.4); border-radius:10px; color:var(--gold-light); font-size:0.95rem;";
                    rBanner.textContent = tLoad("ui.loading_module", "⏳ Načítám modul...");
                    rulesTab.insertBefore(rBanner, rulesTab.firstChild);
                }
                this.ensureRulesLoaded().then(function () {
                    var b = document.getElementById("rules-lazy-loading-banner");
                    if (b && b.parentNode) b.parentNode.removeChild(b);
                    if (self.renderRulesAndCatalog) self.renderRulesAndCatalog();
                    if (self.renderRuleGuide) self.renderRuleGuide();
                    if (self.renderGlossary) self.renderGlossary();
                    if (self.renderTilesAtlas) self.renderTilesAtlas();
                    if (self.switchRulesView) self.switchRulesView(self.rulesCurrentView || "quick");
                }).catch(function () {
                    var b = document.getElementById("rules-lazy-loading-banner");
                    if (b) {
                        b.style.color = "#fca5a5";
                        b.textContent = tLoad("ui.loading_module_error", "⚠️ Nepodařilo se načíst modul. Zkontroluj připojení a zkus to znovu.");
                    }
                });
            }
        }

        if (tabId === "admin") {
            var selfAdm = this;
            var isAdmin = Boolean(this.currentUser && this.currentUser.role === "Admin");
            var admTab = document.getElementById("tab-admin");
            var navBar = admTab ? admTab.querySelector(".admin-nav-bar") : null;
            var areaEl = document.getElementById("admin-content-area");
            var deniedBox = document.getElementById("admin-guest-denied");
            var tAdm = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };

            if (!isAdmin) {
                if (navBar) navBar.style.display = "none";
                if (areaEl) areaEl.style.display = "none";
                if (admTab) {
                    if (!deniedBox) {
                        deniedBox = document.createElement("div");
                        deniedBox.id = "admin-guest-denied";
                        admTab.appendChild(deniedBox);
                    }
                    deniedBox.style.display = "block";
                    deniedBox.innerHTML = '<div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">' +
                        '<div style="font-size:3rem; margin-bottom:1rem;">🛡️🔒</div>' +
                        '<h2 style="color:var(--gold-light); font-family:\'Cinzel\',serif;">' + tAdm("admin.access_denied_title", "Přístup vyhrazen pro Administrátora") + '</h2>' +
                        '<p style="max-width:500px; margin:0.8rem auto 1.5rem;">' + tAdm("admin.access_denied_desc", "Pro správu videí, uživatelských účtů a herních relací se prosím přihlaste jako <strong>admin</strong>.") + '</p>' +
                        '<button class="btn-primary" onclick="PRS_App.openAuthModal()">' + tAdm("admin.access_denied_btn", "🔑 Přihlásit se jako Admin") + '</button>' +
                        '</div>';
                }
            } else {
                if (deniedBox) deniedBox.style.display = "none";
                if (navBar) navBar.style.display = "flex";
                if (areaEl) areaEl.style.display = "block";
                if (this._adminModuleLoaded && typeof this.initAdminSection === "function") {
                    this.initAdminSection();
                } else {
                    if (admTab && !document.getElementById("admin-lazy-loading-banner")) {
                        var aBanner = document.createElement("div");
                        aBanner.id = "admin-lazy-loading-banner";
                        aBanner.style.cssText = "padding:1rem; margin:0.5rem 0 1rem; text-align:center; background:rgba(15,23,42,0.85); border:1px solid rgba(212,175,55,0.4); border-radius:10px; color:var(--gold-light); font-size:0.95rem;";
                        aBanner.textContent = tAdm("ui.loading_module", "⏳ Načítám modul...");
                        if (navBar && navBar.parentNode) {
                            navBar.parentNode.insertBefore(aBanner, navBar);
                        } else {
                            admTab.insertBefore(aBanner, admTab.firstChild);
                        }
                    }
                    if (!this._adminLoadingInProgress) {
                        this._adminLoadingInProgress = true;
                        this.ensureAdminLoaded().then(function () {
                            selfAdm._adminLoadingInProgress = false;
                            var b = document.getElementById("admin-lazy-loading-banner");
                            if (b && b.parentNode) b.parentNode.removeChild(b);
                            if (selfAdm.initAdminSection) selfAdm.initAdminSection();
                        }).catch(function () {
                            selfAdm._adminLoadingInProgress = false;
                            var b = document.getElementById("admin-lazy-loading-banner");
                            if (b) {
                                b.style.color = "#fca5a5";
                                b.textContent = tAdm("ui.loading_module_error", "⚠️ Nepodařilo se načíst modul. Zkontroluj připojení a zkus to znovu.");
                            }
                        });
                    }
                }
            }
        }

        if (tabId === "board") {

            if (typeof window !== "undefined") {

                try { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); } catch (e) { window.scrollTo(0, 0); }

            }

            if (document.body) document.body.classList.add("on-board-tab");

            this.resizeAmbientCanvas();

            this.renderGameScreen();

            this.updateMobileDock();

            if (this.deviceProfile && this.deviceProfile.device === "mobile") {

                // Na mobilu výchozí zobrazení ukazuje Celou mapu (100%), aby byla vidět celá deska bez ořezání a černé plochy

                this.resetZoomAndPan();

            }

        } else {

            if (document.body) document.body.classList.remove("on-board-tab");

            this.closeMobileSheet();

            var dock = document.getElementById("mobile-action-dock");

            if (dock) dock.style.display = "none";

        }

    },

    // ========================================================================

    // VYKRESLENÍ HRACÍHO STOLU (SVG MAPA S BITMAPOVÝMI POLÍČKY A ZOOMEM)

    // ========================================================================,

    renderGameScreen: function () {

        if (!this.state) return;

        var bSel = document.getElementById("board-template-select");

        if (bSel) {

            var inGame = Boolean(this.state && this.state.turnNumber > 0);

            bSel.disabled = inGame;

            var curBoardName = (this.state.board && this.state.board.name) ? this.state.board.name : "Královský plán";

            bSel.title = inGame ? ("Plán: " + curBoardName + " (nelze měnit v průběhu rozehrané partie)") : "Přepnout rozložení plánu";

            var curCode = (this.state.config && this.state.config.boardTemplate) || (this.state.board && this.state.board.code) || "classic_96";
            var optionFound = false;
            for (var oi = 0; oi < bSel.options.length; oi++) {
                if (bSel.options[oi].value === curCode) {
                    optionFound = true;
                    break;
                }
            }

            if (!optionFound && inGame && this.state.board) {
                var dynamicOpt = document.createElement("option");
                dynamicOpt.value = curCode;
                dynamicOpt.textContent = "Plán: " + curBoardName + " (" + (this.state.board.nodes ? this.state.board.nodes.length : 96) + " polí)";
                bSel.appendChild(dynamicOpt);
            }

            bSel.value = curCode;

            var optCustom = bSel.querySelector('option[value="custom_dynamic"]');
            if (optCustom && this.state.board && this.state.board.name) {
                optCustom.textContent = "Plán: " + this.state.board.name + " (" + (this.state.board.nodes ? this.state.board.nodes.length : 96) + " polí)";
            }

        }

        this.renderOnlineRoomBar();

        this.renderTopPlayersHud();

        this.renderHeartTrack();

        this.renderPlayersStandings();

        this.renderBoardSVG();

        this.renderStandingNodeCard();

        if (this.activeSidebarTab === "property") this.renderSidebarPropertyPanel();

        if (this.activeSidebarTab === "log") this.renderSidebarQuickLogPanel();

        this.renderActivePlayerPanel();

        this.renderLowerKnightDetail();
        this.renderCardDecksRow();

        this.renderActionPanel();

        this.renderKnightEmotesHud();

        this.updateTurnTimerUI();

        this.renderLogs();

        this.updateMobileDock();

    },

    initKeyboardShortcuts: function () {

        var self = this;

        // Klepnutí / kliknutí mimo vizitku rytíře ji automaticky zavře
        document.addEventListener("pointerdown", function (e) {
            var tip = document.getElementById("player-hover-tooltip");
            if (!tip || tip.style.display === "none") return;
            if (tip.contains(e.target)) return;
            if (e.target.closest && (e.target.closest('[onmouseenter*="showPlayerTooltip"]') || e.target.closest('[onclick*="showPlayerTooltip"]'))) {
                return;
            }
            self.hidePlayerTooltip();
        }, true);

        window.addEventListener("keydown", function (e) {
            // Pokud je otevřený KiDeskyDialog (#kd-dialog-root), nepřekrýváme jeho ovládání
            if (document.getElementById("kd-dialog-root")) return;

            var modalOpen = !!(window.PRS_ModalManager && window.PRS_ModalManager.isAnyOpen());

            // 1. ESC -> Nejprve necháme PRS_ModalManager zavřít horní modál; jinak zavřeme drawer / sheet
            if (e.key === "Escape" || e.code === "Escape") {
                if (e.defaultPrevented) return;
                if (modalOpen && window.PRS_ModalManager) {
                    e.preventDefault();
                    window.PRS_ModalManager.closeTop();
                    return;
                }
                var chatDrawer = document.getElementById("online-chat-drawer");
                if (chatDrawer && !chatDrawer.classList.contains("hidden") && typeof self.toggleChatDrawer === "function") {
                    e.preventDefault();
                    self.toggleChatDrawer(false);
                    return;
                }
                var mobileSheet = document.getElementById("mobile-bottom-sheet");
                if (mobileSheet && mobileSheet.classList.contains("open") && typeof self.closeMobileSheet === "function") {
                    e.preventDefault();
                    self.closeMobileSheet();
                    return;
                }
                return;
            }

            // Ignorujeme zkratky, pokud uživatel píše do formulářového pole nebo contentEditable
            var targetEl = e.target;
            var tag = (targetEl && targetEl.tagName) ? targetEl.tagName.toLowerCase() : "";
            if (tag === "input" || tag === "textarea" || tag === "select" || (targetEl && targetEl.isContentEditable)) return;

            // 1b. T / t nebo ? -> Otevřít / Zavřít Rychlý tahák do kapsy (jen když není otevřený jiný modál)
            if (e.key === "t" || e.key === "T" || e.key === "?") {
                var csM = document.getElementById("cheatsheet-modal");
                var csOpen = !!(csM && csM.style.display !== "none");
                var topModal = window.PRS_ModalManager ? window.PRS_ModalManager.getTopModal() : null;
                if (csOpen && (!topModal || topModal.id === "cheatsheet-modal")) {
                    e.preventDefault();
                    if (self.closeCheatSheetModal) self.closeCheatSheetModal();
                } else if (!modalOpen) {
                    e.preventDefault();
                    if (self.openCheatSheetModal) self.openCheatSheetModal();
                }
                return;
            }

            // 2. MEZERNÍK -> Pokud je nahoře quest-duel-modal a není focus na tlačítku/odkazu, hoď kostkou v aréně
            if (e.key === " " || e.code === "Space") {
                var topDuel = window.PRS_ModalManager ? window.PRS_ModalManager.getTopModal() : null;
                if (topDuel && topDuel.id === "quest-duel-modal" && tag !== "button" && tag !== "a") {
                    e.preventDefault();
                    self.executeDuelRoll();
                    return;
                }
            }

            // Všechny herní klávesové zkratky jsou aktivní POUZE na záložce Hrací stůl a bez otevřených modálů
            if (modalOpen || self.activeTab !== "board") return;

            if (e.key === " " || e.code === "Space") {
                if (self.state) {
                    if (self.state.phase === "ROLL") {
                        e.preventDefault();
                        self.handleRollDice();
                        return;
                    } else if (self.state.pendingAction) {
                        var pa = self.state.pendingAction;
                        if (pa.canResolveQuest && pa.questCard) {
                            e.preventDefault();
                            self.openQuestDuelModal();
                            return;
                        } else if (pa.canBuyNode) {
                            e.preventDefault();
                            self.handleBuyNode();
                            return;
                        }
                    }
                }
            }

            // 3. ENTER -> Konec tahu
            if (e.key === "Enter" || e.code === "Enter") {
                if (self.state && self.state.phase === "ACTION") {
                    e.preventDefault();
                    self.handleEndTurn();
                    return;
                }
            }

            // 4. Klávesy 1 až 4 -> Přepínání záložek postranního panelu
            if (e.key === "1") { self.switchSidebarTab("tile"); }
            else if (e.key === "2") { self.switchSidebarTab("knight"); }
            else if (e.key === "3") { self.switchSidebarTab("property"); }
            else if (e.key === "4") { self.switchSidebarTab("log"); }

            // 5. Klávesa F nebo C -> Vycentrovat na aktivního hráče
            if (e.key === "f" || e.key === "F" || e.key === "c" || e.key === "C") {
                if (!e.ctrlKey && !e.metaKey) {
                    self.centerOnActivePlayer();
                }
            }
        });

    },

    closeAllModals: function () {
        this.hidePlayerTooltip();
        if (window.PRS_ModalManager && typeof window.PRS_ModalManager.closeAll === "function") {
            window.PRS_ModalManager.closeAll();
        } else {
            this.closeChanceModal();
            this.closeQuestDuelModal();
            this.closeKnightDuelModal();
            this.closeDeckModal();
            this.closeArmoryModal();
            this.closeOnlineRoleModal();
            this.closeGraphicsModal();
            this.closeMusicPopup();
            this.closeImageModal();
            if (this.closeCheatSheetModal) this.closeCheatSheetModal();
            var authModal = document.getElementById("auth-modal");
            if (authModal) authModal.style.display = "none";
            this.updateBodyModalClass();
        }
        var chatDrawer = document.getElementById("online-chat-drawer");
        if (chatDrawer && !chatDrawer.classList.contains("hidden") && typeof this.toggleChatDrawer === "function") {
            this.toggleChatDrawer(false);
        }
        if (typeof this.closeMobileSheet === "function") {
            this.closeMobileSheet();
        }
    },

    openSettingsModal: function () {

        var modal = document.getElementById("game-settings-modal");

        if (!modal) return;

        this.syncSettingsThemeBtns();

        this.syncSettingsSoundLabel();

        this.syncSettingsDeviceLabel();

        if (window.PRS_I18n) window.PRS_I18n.syncUi();

        var fastChk = document.getElementById("settings-fast-anim-chk");

        if (fastChk) fastChk.checked = Boolean(this.fastAnimations);

        var botsChk = document.getElementById("settings-autobots-chk");

        if (botsChk) botsChk.checked = Boolean(this.autoBotsEnabled);

        modal.style.display = "flex";

        if (window.PRS_Audio) window.PRS_Audio.playNotice();

    },

    closeSettingsModal: function () {

        var modal = document.getElementById("game-settings-modal");

        if (modal) modal.style.display = "none";

    },

    syncSettingsThemeBtns: function () {

        var t = this.currentTheme || (document.documentElement ? document.documentElement.getAttribute("data-theme") : "light") || "light";

        var btns = document.querySelectorAll(".settings-theme-switcher .theme-btn");

        for (var i = 0; i < btns.length; i++) {

            if (btns[i].getAttribute("data-theme-btn") === t) btns[i].classList.add("active");

            else btns[i].classList.remove("active");

        }

    },

    syncSettingsSoundLabel: function () {
        var btn = document.getElementById("settings-audio-btn");
        if (btn && window.PRS_Audio) {
            var tSet = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
            btn.innerHTML = window.PRS_Audio.muted
                ? tSet("settings.sound_off", "🔇 Zvuk: Vyp")
                : tSet("settings.sound_on", "🔊 Zvuk: Zap");
        }
    },

    syncSettingsDeviceLabel: function () {
        var btn = document.getElementById("settings-device-btn");
        if (btn && this.deviceProfile) {
            var cur = this.deviceProfile.override;
            var tSet = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
            var icon = (this.deviceProfile.device === "mobile") ? "📱" : ((this.deviceProfile.device === "tablet") ? "📟" : "💻");
            var devLabel = (this.deviceProfile.device === "mobile"
                ? tSet("settings.device_mobile", null, "Mobil")
                : (this.deviceProfile.device === "tablet"
                    ? tSet("settings.device_tablet", null, "Tablet")
                    : tSet("settings.device_pc", null, "PC")));
            btn.textContent = (!cur)
                ? (icon + " " + tSet("settings.mode_auto_fmt", { device: devLabel }, "Režim: Auto (" + devLabel + ")"))
                : (icon + " " + (cur === "mobile" ? tSet("settings.mode_mobile", null, "Režim: Mobil") : tSet("settings.mode_pc", null, "Režim: PC")));
        }
    },

    // ========================================================================

    // MODÁL KRÁLOVSKÉ SLAVNOSTI, TURNAJE A PLESU (#festival-modal)

    // ========================================================================,

    toggleAutoBots: function (checked) {

        this.autoBotEnabled = checked;

        if (checked) this.scheduleBotTurnIfNeeded();

    },

    toggleFastAnim: function (checked) {

        this.fastAnim = checked;

    },

    escapeHtml: function (str) {

        if (str === null || str === undefined) return "";

        return String(str)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;");

    },

    setInputValue: function (id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    },

    getInputNum: function (id, fallback) {
        var el = document.getElementById(id);
        if (!el || el.value === "") return fallback;
        var n = Number(el.value);
        return isNaN(n) ? fallback : n;
    },

    handleMasterDuel: function () {
        if (!this.state || !window.PRS_GameEngine || !window.PRS_GameEngine.resolveMasterDuel) return;
        window.PRS_GameEngine.resolveMasterDuel(this.state, this.state.currentPlayerIndex);
        if (this.renderAll) this.renderAll();
        else if (this.renderGameScreen) this.renderGameScreen();
        if (this.renderTurnActionPanel) this.renderTurnActionPanel();
    }
};

window.KiDeskyToast = {
    show: function (message, type) {
        if (window.PRS_App && window.PRS_App.showToast) {
            window.PRS_App.showToast(message, type);
        } else {
            console.log('[Toast ' + (type || 'info') + ']', message);
        }
    }
};
