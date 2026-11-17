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
                       .replace(/^Kněžna Eliška/i, "Princess Eliška");
        } else {
            name = name.replace(/\s*\(You\)$/i, " (Ty)").replace(/\s*\(AI\)$/i, " (PC)");
            name = name.replace(/^Black Baron/i, "Černý Baron")
                       .replace(/^Sigismund the Breeder/i, "Zikmund z Chovu")
                       .replace(/^Princess Eliška/i, "Kněžna Eliška");
        }
        return name;
    },

    init: function () {

        if (this._initialized) return;

        this._initialized = true;

        var self = this;

        this.activeConfig = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG);

        this.graphicsConfig = window.PRS_GameEngine.deepClone(window.PRS_GRAPHICS_CONFIG);

        this.loadSavedGraphicsConfig();

        this.loadSavedUser();

        this.checkEmailConfirmationUrl();

        this.isBoardStaticDirty = true;

        this.initTheme();

        this.detectDeviceProfile();

        this.renderLobbyPlayers();

        this.initMapPanAndZoom();

        this.initKeyboardShortcuts();

        this.initAmbientCanvas();

        window.addEventListener("resize", function () {

            self.detectDeviceProfile();

        });

        window.addEventListener("orientationchange", function () {

            setTimeout(function () { self.detectDeviceProfile(); }, 160);

        });

        // Automatické zachování stavu rozehrané hry před jakýmkoliv obnovením (F5, Ctrl+F5) nebo zavřením
        window.addEventListener("beforeunload", function () {
            if (self.hasGameStarted && self.state && self.state.phase !== "GAME_OVER") {
                if (typeof self.saveActiveGameAutosave === "function") {
                    self.saveActiveGameAutosave();
                }
            }
        });

        // Reakce na změnu jazyka hry (i18n)
        window.addEventListener("prs:lang-change", function (e) {
            self.onLanguageChanged(e && e.detail ? e.detail.language : null);
        });

        if (window.PRS_Audio) {

            window.PRS_Audio.init();

            this.updateAudioButtonUI();

            this.updateMusicUI();

        }

        // Spustíme výchozí ukázkovou partii (na pozadí pro okamžitý přechod ke stolu)

        this.initLandingLiveCanvas();
        this.renderHeroVideosSection();
        this.loadActiveHeroVideo();

        this.loadAnnouncement();

        this.initPwa();

        this.hasGameStarted = false;

        this.startOnlinePollingLoop();

        // Automatická obnova rozehrané hry z autosavu při F5 / Ctrl+F5
        var curSearch = (window.location && window.location.search) ? window.location.search : "";
        var forceWelcome = (curSearch.indexOf("welcome=1") !== -1 || curSearch.indexOf("new=1") !== -1);
        var restoredOk = false;

        if (!forceWelcome && curSearch.indexOf("room=") === -1) {
            if (typeof this.tryRestoreActiveGameAutosave === "function") {
                restoredOk = this.tryRestoreActiveGameAutosave();
            }
        }

        // Výchozí záložka při startu: pokud máme rozehranou hru, zůstáváme přímo u stolu!
        var initialTab = "welcome";
        if (restoredOk && this.hasGameStarted && this.state) {
            initialTab = "board";
        } else {
            try {
                var sTab = sessionStorage.getItem("prs_active_tab");
                if (sTab && (sTab === "lobby" || sTab === "rules" || sTab === "admin")) {
                    initialTab = sTab;
                }
            } catch (eInit) { }
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

            self.renderRulesAndCatalog();

            self.renderBalanceStudioInputs();

            self.fetchServerStatusAndSessions();
            if (self.updateSavedGamesUI) self.updateSavedGamesUI();
            if (self.refreshBoardTemplateSelects) self.refreshBoardTemplateSelects();

            self.checkUrlRoomParam();
            if (self.loadBoardTemplatesFromServer) self.loadBoardTemplatesFromServer();

            fetch("api.ashx?action=get-config")
                .then(function (r) { return r.json(); })
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
                                self.renderBalanceStudioInputs();
                            }
                        } catch (e) { }
                    }
                })
                .catch(function () { });

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

            light: "assets/castles/castle_royal.png",

            fire: "assets/castles/castle_lava.png",

            water: "assets/castles/castle_water.png",

            earth: "assets/castles/castle_forest.png",

            air: "assets/castles/castle_wind.png"

        };

        var themeDragons = {

            light: "assets/dragons/dragon_gold.png",

            fire: "assets/dragons/dragon_volcano.png",

            water: "assets/dragons/dragon_ice.png",

            earth: "assets/dragons/dragon_green.png",

            air: "assets/dragons/dragon_wind.png"

        };

        if (this.graphicsConfig && this.graphicsConfig.landmarkBitmaps) {

            this.graphicsConfig.landmarkBitmaps.royalCastle = themeCastles[themeName] || "assets/castles/castle_royal.jpg";

            this.graphicsConfig.landmarkBitmaps.dragonLair = themeDragons[themeName] || "assets/dragons/dragon_volcano.jpg";

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
        var topBtn = document.getElementById('topbar-pwa-install-btn');
        var setStatus = document.getElementById('settings-pwa-status');
        var setBtn = document.getElementById('settings-pwa-install-btn');

        this.checkPwaInstalledStatus();

        // Pokud nejsme v standalone režimu a už máme prompt, aktualizujeme UI
        if (window._pwaDeferredPrompt) {
            if (topBtn) topBtn.style.display = 'inline-flex';
            if (setStatus) setStatus.textContent = 'Aplikace je připravena k rychlé instalaci na jedno kliknutí.';
            if (setBtn) {
                setBtn.style.display = 'inline-flex';
                setBtn.innerHTML = '📲 Nainstalovat na plochu';
            }
        } else if (topBtn && !window._pwaIsInstalled) {
            topBtn.style.display = 'inline-flex';
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
            }).catch(function () {});
        }
    },

    updatePwaUiForInstalled: function () {
        var topBtn = document.getElementById('topbar-pwa-install-btn');
        if (topBtn) topBtn.style.display = 'none';
        var setStatus = document.getElementById('settings-pwa-status');
        if (setStatus) setStatus.innerHTML = '✅ <strong style="color:#4ade80;">Hra je úspěšně nainstalována na tomto zařízení!</strong>';
        var setBtn = document.getElementById('settings-pwa-install-btn');
        if (setBtn) {
            setBtn.innerHTML = '✅ Nainstalováno na ploše';
            setBtn.style.background = 'rgba(16, 185, 129, 0.2)';
            setBtn.style.borderColor = '#10b981';
        }
    },

    promptPwaInstall: function () {
        var self = this;
        var isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
        if (isStandalone || window._pwaIsInstalled) {
            if (this.showToast) {
                this.showToast('✅ KiDesky již běží jako nainstalovaná aplikace na tvém zařízení!', 'good');
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
                        self.showToast('📲 KiDesky se instaluje na tvou plochu...', 'success');
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
                                    self.showToast('ℹ️ KiDesky je již na tomto počítači nainstalována! Spustit ji můžeš z nabídky Start nebo ikony v adresním řádku.', 'info');
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
            toast.innerHTML = message;
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

        if (this.activeTab === "board" && typeof this.renderActionPanel === "function") {

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

    onLanguageChanged: function (lang) {
        if (window.PRS_I18n) {
            window.PRS_I18n.translateDOM();
            window.PRS_I18n.syncUi();
        }

        if (typeof this.renderAnnouncement === "function") {
            try { this.renderAnnouncement(); } catch (raErr) {}
        }
        if (typeof this.refreshLobbySettingsSelects === "function") {
            try { this.refreshLobbySettingsSelects(); } catch (lselErr) {}
        }
        if (typeof this.updateSavedGamesUI === "function") {
            try { this.updateSavedGamesUI(); } catch (sErr) {}
        }
        if (typeof this.renderHeroVideosSection === "function") {
            try { this.renderHeroVideosSection(); } catch (hvsErr) {}
        }

        if (typeof this.refreshBoardTemplateSelects === "function") {
            try { this.refreshBoardTemplateSelects(); } catch (selErr) {}
        }

        // Pokud existuje renderer desky, překreslíme dominanty a nápisy
        if (typeof this.renderBoard === "function") {
            try { this.renderBoard(); } catch (bErr) {}
        } else if (this.boardRenderer && typeof this.boardRenderer.renderBoard === "function") {
            try { this.boardRenderer.renderBoard(); } catch (bErr) {}
        } else if (window.PRS_Board && typeof window.PRS_Board.renderBoard === "function") {
            try { window.PRS_Board.renderBoard(); } catch (bErr) {}
        }

        // Překreslíme lobby hráče a aktivní banner
        if (typeof this.renderLobbyPlayers === "function") {
            try { this.renderLobbyPlayers(); } catch (lErr) {}
        }
        var activeRound = document.getElementById("gamehall-active-round-info");
        if (activeRound && this.state) {
            var roundTxt = window.PRS_I18n ? window.PRS_I18n.t("lobby.active_game_info", { round: this.state.roundNumber || 1, count: this.state.players ? this.state.players.length : 4 }) : ("Kolo " + (this.state.roundNumber || 1) + " • " + (this.state.players ? this.state.players.length : 4) + " Rytířů");
            activeRound.textContent = roundTxt;
        }

        // Okamžitě překreslíme herní HUD, detail pole a spodní dashboard
        if (this.state) {
            try {
                if (typeof this.renderTopPlayersHud === "function") this.renderTopPlayersHud();
                if (typeof this.renderHeartTrack === "function") this.renderHeartTrack();
                if (typeof this.renderLowerKnightDetail === "function") this.renderLowerKnightDetail();
                if (typeof this.updateHudTurnInfo === "function") this.updateHudTurnInfo();
                if (typeof this.renderStandingTileDetail === "function") this.renderStandingTileDetail();
                if (typeof this.renderActivePlayerPanel === "function") this.renderActivePlayerPanel();
                if (typeof this.renderActionPanel === "function") this.renderActionPanel();
                if (typeof this.renderStandingNodeCard === "function") this.renderStandingNodeCard();
                if (typeof this.updateMobileDock === "function") this.updateMobileDock();
                if (typeof this.renderKnightEmotesHud === "function") this.renderKnightEmotesHud();
                if (typeof this.renderCardDecksRow === "function") this.renderCardDecksRow();
                if (typeof this.syncSettingsSoundLabel === "function") this.syncSettingsSoundLabel();
                if (typeof this.syncSettingsDeviceLabel === "function") this.syncSettingsDeviceLabel();
            } catch (e) {
                console.warn("[PRS_App] Chyba při přerenderování HUDu po změně jazyka:", e);
            }
        }

        // Pokud je k dispozici katalog/pravidla, přerenderujeme tabulky a galerie
        if (window.PRS_Catalog) {
            try {
                if (typeof window.PRS_Catalog.renderRulesItemsTable === "function") window.PRS_Catalog.renderRulesItemsTable();
                if (typeof window.PRS_Catalog.renderBestiary === "function") window.PRS_Catalog.renderBestiary();
                if (typeof window.PRS_Catalog.renderCastlesGallery === "function") window.PRS_Catalog.renderCastlesGallery();
                if (typeof window.PRS_Catalog.renderTrophiesHall === "function") window.PRS_Catalog.renderTrophiesHall();
            } catch (catErr) {
                console.warn("[PRS_App] Chyba při přerenderování katalogu po změně jazyka:", catErr);
            }
        }
    },

    // --- HUDEBNÍ PŘEHRÁVAČ & BGM KONTROLER ---,

    toggleMusicPopup: function () {

        var modal = document.getElementById("prs-music-modal");

        if (!modal) return;

        var isShown = modal.style.display === "flex";

        if (isShown) {

            this.closeMusicPopup();

        } else {

            this.openMusicPopup();

        }

    },

    openMusicPopup: function () {

        var modal = document.getElementById("prs-music-modal");

        if (!modal) return;

        modal.style.display = "flex";

        this.renderMusicPlaylistOptions();

        this.updateMusicUI();

        if (this._musicModalTimer) clearInterval(this._musicModalTimer);

        var self = this;

        this._musicModalTimer = setInterval(function () {

            var m = document.getElementById("prs-music-modal");

            if (m && m.style.display === "flex") self.updateMusicProgressUI();

            else { clearInterval(self._musicModalTimer); self._musicModalTimer = null; }

        }, 500);

    },

    closeMusicPopup: function () {

        var modal = document.getElementById("prs-music-modal");

        if (modal) modal.style.display = "none";

        if (this._musicModalTimer) {

            clearInterval(this._musicModalTimer);

            this._musicModalTimer = null;

        }

    },

    renderMusicPlaylistOptions: function () {

        var sel = document.getElementById("music-playlist-select");

        if (!sel || !window.PRS_Audio) return;

        var pl = window.PRS_Audio.playlist;

        var curIdx = window.PRS_Audio.currentTrackIndex;

        var html = "";

        for (var i = 0; i < pl.length; i++) {

            var tr = pl[i];

            var icon = tr.isProcedural ? "🪕" : (tr.isYoutube ? "▶️" : (tr.isCustom ? "📁" : "🎵"));

            html += '<option value="' + i + '" ' + (i === curIdx ? "selected" : "") + '>' + icon + ' ' + this.escapeHtml(tr.title) + ' (' + this.escapeHtml(tr.author) + ')</option>';

        }

        sel.innerHTML = html;

    },

    toggleMusic: function () {

        if (!window.PRS_Audio) return;

        window.PRS_Audio.toggleMusic();

        this.updateMusicUI();

    },

    nextMusicTrack: function () {

        if (!window.PRS_Audio) return;

        window.PRS_Audio.nextTrack();

        this.renderMusicPlaylistOptions();

        this.updateMusicUI();

    },

    prevMusicTrack: function () {

        if (!window.PRS_Audio) return;

        window.PRS_Audio.prevTrack();

        this.renderMusicPlaylistOptions();

        this.updateMusicUI();

    },

    selectMusicTrack: function (idx) {

        if (!window.PRS_Audio) return;

        window.PRS_Audio.playTrack(Number(idx));

        this.renderMusicPlaylistOptions();

        this.updateMusicUI();

    },

    handleBgmVolumeChange: function (val) {

        if (!window.PRS_Audio) return;

        var num = Number(val) / 100.0;

        window.PRS_Audio.setBgmVolume(num);

        var lbl = document.getElementById("music-vol-label");

        if (lbl) lbl.textContent = Math.round(num * 100) + "%";

    },

    handleSfxVolumeChange: function (val) {

        if (!window.PRS_Audio) return;

        var num = Number(val) / 100.0;

        window.PRS_Audio.setSfxVolume(num);

        var lbl = document.getElementById("music-sfx-label");

        if (lbl) lbl.textContent = Math.round(num * 100) + "%";

        window.PRS_Audio.playCoin();

    },

    handleCustomAudioUpload: function (input) {

        if (!input || !input.files || input.files.length === 0) return;

        var file = input.files[0];

        if (!window.PRS_Audio) return;

        window.PRS_Audio.addCustomTrack(file);

        this.renderMusicPlaylistOptions();

        this.updateMusicUI();

        this.addLog("🎵 Nahrána vlastní skladba: " + file.name, "action");

    },

    updateMusicUI: function () {

        if (!window.PRS_Audio) return;

        var isPlaying = window.PRS_Audio.isMusicPlaying;

        var tr = window.PRS_Audio.getCurrentTrack();

        // 1. Tlačítko v záhlaví

        var headBtnLabel = document.getElementById("music-btn-label");

        if (headBtnLabel) {

            headBtnLabel.textContent = isPlaying ? "Hudba: " + tr.title : "Hudba: Vyp";

        }

        var headBtn = document.getElementById("music-player-btn");

        if (headBtn) {

            headBtn.style.color = isPlaying ? "#38bdf8" : "#94a3b8";

            headBtn.style.borderColor = isPlaying ? "#38bdf8" : "rgba(255,255,255,0.15)";

        }

        // 2. Modální prvky

        var modTitle = document.getElementById("music-modal-title");

        var modAuthor = document.getElementById("music-modal-author");

        var modPlayBtn = document.getElementById("music-modal-play-btn");

        var discAnim = document.getElementById("music-disc-anim");

        if (modTitle) modTitle.textContent = tr.title;

        if (modAuthor) modAuthor.textContent = tr.author;

        if (modPlayBtn) {

            modPlayBtn.innerHTML = isPlaying ? "⏸️ Pozastavit" : "▶️ Přehrát";

            modPlayBtn.className = isPlaying ? "btn-secondary" : "btn-primary";

        }

        if (discAnim) {

            if (isPlaying) discAnim.classList.add("playing");

            else discAnim.classList.remove("playing");

        }

        var volSlider = document.getElementById("music-bgm-slider");

        var volLbl = document.getElementById("music-vol-label");

        if (volSlider) volSlider.value = Math.round(window.PRS_Audio.bgmVolume * 100);

        if (volLbl) volLbl.textContent = Math.round(window.PRS_Audio.bgmVolume * 100) + "%";

        var sfxSlider = document.getElementById("music-sfx-slider");

        var sfxLbl = document.getElementById("music-sfx-label");

        if (sfxSlider) sfxSlider.value = Math.round(window.PRS_Audio.sfxVolume * 100);

        if (sfxLbl) sfxLbl.textContent = Math.round(window.PRS_Audio.sfxVolume * 100) + "%";

        this.updateMusicProgressUI();

    },

    _musicSeeking: false,

    handleMusicSeekInput: function (val) {

        if (!window.PRS_Audio || !window.PRS_Audio.getPlaybackProgress) return;

        var prog = window.PRS_Audio.getPlaybackProgress();

        if (!prog.supported) return;

        this._musicSeeking = true;

        var target = (Number(val) / 1000) * prog.duration;

        var curEl = document.getElementById("music-time-cur");

        if (curEl) curEl.textContent = window.PRS_Audio.formatTime(target);

    },

    handleMusicSeekCommit: function (val) {

        this._musicSeeking = false;

        if (!window.PRS_Audio || !window.PRS_Audio.getPlaybackProgress || !window.PRS_Audio.seekTo) return;

        var prog = window.PRS_Audio.getPlaybackProgress();

        if (!prog.supported) return;

        var target = (Number(val) / 1000) * prog.duration;

        window.PRS_Audio.seekTo(target);

        this.updateMusicProgressUI();

        if (window.PRS_MusicWidget && window.PRS_MusicWidget.refresh) window.PRS_MusicWidget.refresh();

    },

    updateMusicProgressUI: function () {

        if (!window.PRS_Audio || !window.PRS_Audio.getPlaybackProgress) return;

        var prog = window.PRS_Audio.getPlaybackProgress();

        var slider = document.getElementById("music-seek-slider");

        var curEl = document.getElementById("music-time-cur");

        var durEl = document.getElementById("music-time-dur");

        if (slider) {

            slider.disabled = !prog.supported;

            if (!prog.supported) {

                slider.value = 0;

            } else if (!this._musicSeeking) {

                slider.value = Math.round((prog.currentTime / prog.duration) * 1000);

            }

        }

        if (curEl) {

            if (prog.isProcedural) curEl.textContent = "∞";

            else if (!this._musicSeeking) curEl.textContent = window.PRS_Audio.formatTime(prog.currentTime);

        }

        if (durEl) {

            if (prog.isProcedural) durEl.textContent = "Živě";

            else durEl.textContent = prog.supported ? window.PRS_Audio.formatTime(prog.duration) : "--:--";

        }

    },

    // --- VÍTĚZNÝ CEREMONIÁL & KRÁLOVSKÁ SVATBA (MODAL) ---,

    updateBodyModalClass: function () {

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
            } else if (annBanner.dataset.hasMessage === "true") {
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

        }

        if (tabId === "lobby") {

            this.fetchServerStatusAndSessions();
            this.updateGameHallUI();

        }

        if (tabId === "rules") {

            this.renderRulesAndCatalog();

        }

        if (tabId === "admin") {

            if (this.initAdminSection) this.initAdminSection();

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

        // --- LANDING PAGE INTERAKTIVNÍ PRVKY (VIDEO / YOUTUBE / ŽIVÁ ANIMACE / MEDAILONKY) ---,

    heroVideosList: [],
    currentHeroVideoIndex: 0,
    currentHeroVideo: null,
    _likedVideoIds: {},

    isYoutubeVideo: function (video) {
        if (!video) return false;
        var type = (video.videoType || "").toLowerCase();
        if (type === "youtube") return true;
        var url = (video.url || "").toLowerCase();
        return url.indexOf("youtube.com") !== -1 || url.indexOf("youtu.be") !== -1;
    },

    getYoutubeId: function (url) {
        if (!url) return "";
        var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
        return (match && match[1]) ? match[1] : "";
    },

    getYoutubeEmbedUrl: function (url, autoplay) {
        var videoId = this.getYoutubeId(url);
        if (videoId) {
            var autoParam = autoplay ? "1" : "0";
            return "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=" + autoParam + "&rel=0&enablejsapi=1&playsinline=1";
        }
        return url || "";
    },

    loadActiveHeroVideo: function () {
        var self = this;
        fetch("api.ashx?action=list-videos")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && Array.isArray(res.videos)) {
                    // Intro videa pro Landing Page: bereme pouze videa aktivovaná správcem (isHeroActive)
                    var activeHeroes = res.videos.filter(function (v) {
                        return !!v.isHeroActive;
                    });
                    // Fallback pokud žádné video nemá explicitní IsHeroActive = true
                    if (activeHeroes.length === 0) {
                        activeHeroes = res.videos.filter(function (v) {
                            return v.category === "trailer";
                        });
                    }
                    if (activeHeroes.length === 0 && res.videos.length > 0) {
                        activeHeroes = [res.videos[0]];
                    }

                    self.heroVideosList = activeHeroes;

                    var activeIdx = activeHeroes.findIndex(function (v) { return v.isHeroActive; });
                    if (activeIdx < 0) activeIdx = 0;
                    self.currentHeroVideoIndex = activeIdx;
                    self.currentHeroVideo = activeHeroes[activeIdx] || null;

                    self.renderHeroVideoControls();
                    self.renderHeroVideosSection();
                } else {
                    self.fetchSingleHeroFallback();
                }
            })
            .catch(function () {
                self.fetchSingleHeroFallback();
            });
    },

    fetchSingleHeroFallback: function () {
        var self = this;
        fetch("api.ashx?action=hero-video")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.hero) {
                    self.heroVideosList = [res.hero];
                    self.currentHeroVideoIndex = 0;
                    self.currentHeroVideo = res.hero;
                    self.renderHeroVideoControls();
                    self.renderHeroVideosSection();
                }
            })
            .catch(function () { });
    },

    renderHeroVideoControls: function () {
        var v = this.currentHeroVideo;
        var list = this.heroVideosList || [];
        var total = list.length;
        var idx = this.currentHeroVideoIndex;
        var isVideoMode = (this.currentLandingMedia === "video");

        // Dynamická aktualizace horních záložek médií (umožňuje přepínat mezi videi přímo v záložkách)
        var tabsContainer = document.getElementById("lp-media-tabs");
        if (tabsContainer) {
            if (total > 1) {
                var html = '<button id="lp-tab-btn-anim" class="lp-media-tab-btn ' + (!isVideoMode ? 'active' : '') + '" onclick="PRS_App.switchLandingMedia(\'anim\')">✨ Živá animace</button>';
                for (var i = 0; i < total; i++) {
                    var isAct = isVideoMode && (i === idx);
                    var t = (list[i] && list[i].title) ? list[i].title : ("Intro " + (i + 1));
                    html += '<button id="lp-tab-btn-video-' + i + '" class="lp-media-tab-btn lp-media-tab-video ' + (isAct ? 'active' : '') + '" onclick="PRS_App.selectHeroVideoAndSwitch(' + i + ')" title="' + this.escapeHtml(t) + '">🎬 ' + this.escapeHtml(t) + '</button>';
                }
                tabsContainer.innerHTML = html;
            } else {
                var singleTitle = (v && v.title) ? v.title : "Video upoutávka";
                tabsContainer.innerHTML =
                    '<button id="lp-tab-btn-anim" class="lp-media-tab-btn ' + (!isVideoMode ? 'active' : '') + '" onclick="PRS_App.switchLandingMedia(\'anim\')">✨ Živá animace království</button>' +
                    '<button id="lp-tab-btn-video" class="lp-media-tab-btn ' + (isVideoMode ? 'active' : '') + '" onclick="PRS_App.switchLandingMedia(\'video\')">🎬 ' + this.escapeHtml(singleTitle) + '</button>';
            }
        }

        // Tlačítka cyklování zobrazujeme VÝHRADNĚ v režimu videa a pouze pokud je aktivních více videí
        var prevBtn = document.getElementById("lp-video-prev-btn");
        var nextBtn = document.getElementById("lp-video-next-btn");
        if (prevBtn && nextBtn) {
            var showArrows = isVideoMode && (total > 1);
            prevBtn.style.display = showArrows ? "flex" : "none";
            nextBtn.style.display = showArrows ? "flex" : "none";
        }

        var bar = document.getElementById("lp-video-interaction-bar");
        if (bar) {
            if (isVideoMode && v) {
                bar.style.display = "flex";
            } else {
                bar.style.display = "none";
            }

            var titleEl = document.getElementById("lp-video-active-title");
            if (titleEl && v) {
                var prefix = total > 1 ? ("(" + (idx + 1) + "/" + total + ") ") : "";
                titleEl.textContent = prefix + (v.title || "Intro video");
                titleEl.title = v.title || "";
            }

            var dotsEl = document.getElementById("lp-video-counter-dots");
            if (dotsEl) {
                dotsEl.innerHTML = "";
                if (total > 1) {
                    var self = this;
                    for (var i = 0; i < total; i++) {
                        var dot = document.createElement("span");
                        dot.className = "lp-video-dot" + (i === idx ? " active" : "");
                        dot.title = (list[i] && list[i].title) ? list[i].title : ("Video " + (i + 1));
                        (function (targetIdx) {
                            dot.addEventListener("click", function () {
                                self.selectHeroVideo(targetIdx);
                            });
                        })(i);
                        dotsEl.appendChild(dot);
                    }
                }
            }

            var likeCountEl = document.getElementById("lp-like-count");
            var likeBtn = document.getElementById("lp-btn-like-video");
            if (likeCountEl && v) {
                likeCountEl.textContent = v.likesCount || 0;
            }
            if (likeBtn && v) {
                if (this._likedVideoIds[v.id]) {
                    likeBtn.classList.add("liked");
                    likeBtn.title = "Tomuto videu jsi již dal like! 👍";
                } else {
                    likeBtn.classList.remove("liked");
                    likeBtn.title = "Líbí se mi toto video";
                }
            }

            var subBtn = document.getElementById("lp-btn-yt-sub");
            var ytWatchBtn = document.getElementById("lp-btn-yt-watch");
            var isYt = this.isYoutubeVideo(v);
            var ytid = isYt ? this.getYoutubeId(v ? v.url : "") : "";

            if (subBtn) {
                if (isYt && ytid) {
                    subBtn.href = "https://www.youtube.com/watch?v=" + ytid + "&sub_confirmation=1";
                    subBtn.style.display = "inline-flex";
                } else {
                    subBtn.style.display = "none";
                }
            }
            if (ytWatchBtn) {
                if (isYt && ytid) {
                    ytWatchBtn.href = "https://www.youtube.com/watch?v=" + ytid;
                    ytWatchBtn.style.display = "inline-flex";
                } else {
                    ytWatchBtn.style.display = "none";
                }
            }
        }
    },

    nextHeroVideo: function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        var list = this.heroVideosList || [];
        if (list.length <= 1) return;
        var nextIdx = (this.currentHeroVideoIndex + 1) % list.length;
        this.selectHeroVideo(nextIdx);
    },

    prevHeroVideo: function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        var list = this.heroVideosList || [];
        if (list.length <= 1) return;
        var prevIdx = (this.currentHeroVideoIndex - 1 + list.length) % list.length;
        this.selectHeroVideo(prevIdx);
    },

    selectHeroVideo: function (index) {
        var list = this.heroVideosList || [];
        if (index < 0 || index >= list.length) return;
        this.currentHeroVideoIndex = index;
        this.currentHeroVideo = list[index];

        this.renderHeroVideoControls();
        if (this.currentLandingMedia === "video") {
            this.applyHeroVideoChange(true);
        }
    },

    selectHeroVideoAndSwitch: function (index) {
        this.selectHeroVideo(index);
        if (this.currentLandingMedia !== "video") {
            this.switchLandingMedia("video");
        }
    },

    applyHeroVideoChange: function (autoPlay) {
        var v = this.currentHeroVideo;
        if (!v) return;

        var vid = document.getElementById("lp-promo-video");
        var yt = document.getElementById("lp-hero-youtube-player");
        var statusLbl = document.getElementById("lp-media-status-label");

        if (statusLbl) {
            statusLbl.textContent = "🎬 " + (v.title || "Královská upoutávka");
        }

        var isYt = this.isYoutubeVideo(v);

        if (isYt) {
            if (vid) {
                vid.style.display = "none";
                try { vid.pause(); } catch (e) { }
            }
            if (yt) {
                yt.style.display = "block";
                var embedUrl = this.getYoutubeEmbedUrl(v.url, autoPlay);
                if (yt.src !== embedUrl) {
                    yt.src = embedUrl;
                }
            }
        } else {
            if (yt) {
                yt.src = "";
                yt.style.display = "none";
            }
            if (vid) {
                vid.style.display = "block";
                if (v.posterUrl) vid.poster = v.posterUrl;
                if (vid.src !== v.url) {
                    vid.src = v.url;
                }
                if (autoPlay) {
                    try { vid.play(); } catch (e) { }
                }
            }
        }
    },

    likeCurrentHeroVideo: function () {
        var v = this.currentHeroVideo;
        if (!v || !v.id) return;
        if (this._likedVideoIds[v.id]) {
            this.showToast("Tomuto videu jsi již vyjádřil rytířskou přízeň! 👍", "info");
            return;
        }

        var self = this;
        var likeBtn = document.getElementById("lp-btn-like-video");
        var likeCountEl = document.getElementById("lp-like-count");

        fetch("api.ashx?action=like-video&id=" + encodeURIComponent(v.id), { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok) {
                    self._likedVideoIds[v.id] = true;
                    v.likesCount = res.likesCount;
                    if (likeCountEl) likeCountEl.textContent = v.likesCount;
                    if (likeBtn) likeBtn.classList.add("liked");
                    self.showToast("💖 Děkujeme za like! Video má nyní " + res.likesCount + " lajků.", "success");
                }
            })
            .catch(function () {
                self._likedVideoIds[v.id] = true;
                v.likesCount = (v.likesCount || 0) + 1;
                if (likeCountEl) likeCountEl.textContent = v.likesCount;
                if (likeBtn) likeBtn.classList.add("liked");
                self.showToast("💖 Like byl započítán!", "success");
            });
    },

    renderHeroVideosSection: function () {
        var container = document.getElementById("lp-two-videos-grid");
        if (!container) return;

        var list = this.heroVideosList || [];
        var videos = [];
        if (list.length >= 2) {
            videos = [list[0], list[1]];
        } else if (list.length === 1) {
            videos = [list[0]];
        } else {
            // Výchozí dvojice oficiálních videí deskové hry
            videos = [
                {
                    id: 4,
                    title: "Intro první princezna - youtube",
                    url: "https://www.youtube.com/watch?v=sO-MnlHy_O4",
                    likesCount: 14,
                    description: "Oficiální příběhová upoutávka: záchrana princezny, dračí sluj a královské slavnosti."
                },
                {
                    id: 5,
                    title: "Intro první princezna - youtube multi",
                    url: "https://www.youtube.com/watch?v=fPyG8yeCHas",
                    likesCount: 9,
                    description: "Ukázka deskového plánu, herní mechaniky, budování panství a online výpravy."
                }
            ];
        }

        var html = [];
        for (var i = 0; i < videos.length; i++) {
            var v = videos[i];
            var isYt = this.isYoutubeVideo(v);
            var ytid = isYt ? this.getYoutubeId(v.url) : "";
            var embedUrl = "";
            if (isYt && ytid) {
                embedUrl = "https://www.youtube-nocookie.com/embed/" + ytid + "?rel=0&enablejsapi=1&playsinline=1";
            } else if (v.url) {
                embedUrl = v.url;
            }

            var isLiked = !!(this._likedVideoIds && this._likedVideoIds[v.id]);
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var badgeText = (i === 0) ? (isEn ? "🎬 Story Intro" : "🎬 Příběhové intro") : (isEn ? "⚔️ Gameplay & Rules" : "⚔️ Hratelnost & Pravidla");

            html.push('<div class="lp-video-cinema-card">');
            html.push('  <div class="lp-video-card-header">');
            html.push('    <h3 class="lp-video-card-title">' + this.escapeHtml(v.title || ("Video " + (i + 1))) + '</h3>');
            html.push('    <span class="lp-video-card-badge">' + badgeText + '</span>');
            html.push('  </div>');

            html.push('  <div class="lp-video-player-frame">');
            if (isYt && ytid) {
                html.push('    <iframe src="' + embedUrl + '" title="' + this.escapeHtml(v.title || "") + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>');
            } else if (v.url && v.url.match(/\.(mp4|webm)($|\?)/i)) {
                html.push('    <video controls preload="metadata" style="width:100%; height:100%; object-fit:cover; border-radius:10px;"><source src="' + this.escapeHtml(v.url) + '" type="video/mp4"></video>');
            } else {
                html.push('    <iframe src="' + embedUrl + '" title="' + this.escapeHtml(v.title || "") + '" frameborder="0" allowfullscreen loading="lazy"></iframe>');
            }
            html.push('  </div>');

            if (v.description) {
                html.push('  <p class="lp-video-card-desc">' + this.escapeHtml(v.description) + '</p>');
            }

            html.push('  <div class="lp-video-card-footer">');
            html.push('    <button type="button" class="lp-video-btn-action ' + (isLiked ? 'liked' : '') + '" onclick="PRS_App.likeVideoById(' + v.id + ', this)" title="' + (isLiked ? 'Tomuto videu jsi již dal like! 👍' : 'Dát videu to se mi líbí') + '">');
            html.push('      <span class="like-heart">👍</span> <span class="like-num">' + (v.likesCount || 0) + '</span>');
            html.push('    </button>');

            if (isYt && ytid) {
                html.push('    <a href="https://www.youtube.com/watch?v=' + ytid + '" target="_blank" rel="noopener noreferrer" class="lp-video-btn-action" title="' + (window.PRS_I18n && window.PRS_I18n.getLanguage() === "en" ? "Play video on YouTube" : "Přehrát video na YouTube") + '">');
                var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
                html.push('      <span>📺 ' + (isEn ? "Play on YouTube" : "Přehrát na YouTube") + '</span>');
                html.push('    </a>');
            }
            html.push('  </div>');
            html.push('</div>');
        }

        container.innerHTML = html.join("");
    },

    likeVideoById: function (id, btn) {
        if (!id) return;
        if (!this._likedVideoIds) this._likedVideoIds = {};
        if (this._likedVideoIds[id]) {
            this.showToast("Tomuto videu jsi již vyjádřil rytířskou přízeň! 👍", "info");
            return;
        }

        var self = this;
        this._likedVideoIds[id] = true;
        try {
            localStorage.setItem("kidesky_liked_videos", JSON.stringify(this._likedVideoIds));
        } catch (e) { }

        if (btn) {
            btn.classList.add("liked");
            btn.title = "Tomuto videu jsi již dal like! 👍";
            var numEl = btn.querySelector(".like-num");
            if (numEl) {
                var cur = parseInt(numEl.textContent, 10) || 0;
                numEl.textContent = cur + 1;
            }
        }

        fetch("api.ashx?action=like-video&id=" + encodeURIComponent(id), { method: "POST" })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && typeof res.likesCount === "number" && btn) {
                    var numEl = btn.querySelector(".like-num");
                    if (numEl) numEl.textContent = res.likesCount;
                    self.showToast("💖 Děkujeme za like! Video má nyní " + res.likesCount + " lajků.", "success");
                }
            })
            .catch(function () {
                self.showToast("💖 Like byl započítán!", "success");
            });
    },

    loadAnnouncement: function () {
        var self = this;
        fetch("api.ashx?action=get-announcement")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.announcement && res.announcement.message) {
                    self._lastAnnouncement = res.announcement;
                    self.renderAnnouncement();
                }
            })
            .catch(function () { });
    },

    renderAnnouncement: function () {
        if (!this._lastAnnouncement) return;
        var banner = document.getElementById("topbar-announcement-banner");
        var txt = document.getElementById("announcement-message-text");
        var lnk = document.getElementById("announcement-link-btn");
        if (banner && txt) {
            var msg = this._lastAnnouncement.message;
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (isEn && (msg.indexOf("Vítejte v království KiDesky") !== -1 || msg.indexOf("Otestujte své rytířské ctnosti") !== -1)) {
                msg = window.PRS_I18n ? window.PRS_I18n.t("announcement.text") : "Welcome to the realm of KiDesky: The Princess's Heart! Test your knightly virtues in royal tournaments.";
                if (this._lastAnnouncement.linkUrl) {
                    msg = msg.replace(/\s*(Learn more|More info|Více informací)\s*(&rarr;|→)?\s*$/i, "");
                }
            }
            txt.textContent = msg;
            if (this._lastAnnouncement.linkUrl) {
                lnk.href = this._lastAnnouncement.linkUrl;
                lnk.style.display = "inline-flex";
            } else {
                lnk.style.display = "none";
            }
            banner.dataset.hasMessage = "true";
            if (this.activeTab !== "board") {
                banner.style.display = "flex";
            } else {
                banner.style.display = "none";
            }
        }
    },

    dismissAnnouncement: function () {
        var banner = document.getElementById("topbar-announcement-banner");
        if (banner) banner.style.display = "none";
    },

    switchLandingMedia: function (mode) {
        this.currentLandingMedia = (mode === "video") ? "video" : "anim";
        var animWrap = document.getElementById("lp-media-anim-wrap");
        var videoWrap = document.getElementById("lp-media-video-wrap");
        var btnAnim = document.getElementById("lp-tab-btn-anim");
        var btnVideo = document.getElementById("lp-tab-btn-video");
        var statusLbl = document.getElementById("lp-media-status-label");
        var vid = document.getElementById("lp-promo-video");
        var yt = document.getElementById("lp-hero-youtube-player");

        if (this.currentLandingMedia === "video") {
            if (animWrap) animWrap.style.display = "none";
            if (videoWrap) videoWrap.style.display = "block";
            if (btnAnim) btnAnim.classList.remove("active");
            if (btnVideo) btnVideo.classList.add("active");

            this.applyHeroVideoChange(true);
            this.renderHeroVideoControls();
        } else {
            if (vid && !vid.paused) {
                try { vid.pause(); } catch (e) { }
            }
            if (yt) { yt.src = ""; yt.style.display = "none"; }
            if (videoWrap) videoWrap.style.display = "none";
            if (animWrap) animWrap.style.display = "block";
            if (btnVideo) btnVideo.classList.remove("active");
            if (btnAnim) btnAnim.classList.add("active");
            if (statusLbl) statusLbl.textContent = "✨ Plynulá ukázka herních medailonků, rytířů a slavností";
            var bar = document.getElementById("lp-video-interaction-bar");
            if (bar) bar.style.display = "none";
            var prevBtn = document.getElementById("lp-video-prev-btn");
            var nextBtn = document.getElementById("lp-video-next-btn");
            if (prevBtn) prevBtn.style.display = "none";
            if (nextBtn) nextBtn.style.display = "none";
            this.renderHeroVideoControls();
            this.initLandingLiveCanvas();
        }
    },

    initLandingLiveCanvas: function () {
        var canvas = document.getElementById("lp-live-preview-canvas");
        if (!canvas || !canvas.getContext) return;
        if (this._landingCanvasRunning) return;
        this._landingCanvasRunning = true;

        var ctx = canvas.getContext("2d");

        // 1. Textury herního plánu a dominant
        var bgImg = new Image();
        bgImg.src = "assets/board/parchment_board_bg.jpg";

        var castleImg = new Image();
        castleImg.src = "assets/landmarks/royal_castle.png";

        // 2. Královský drak (Červený ohnivý drak U3) pro Dračí sluj
        var dragonImg = new Image();
        dragonImg.src = "assets/dragons/dragon_red.png";

        // 3. Nová 2.5D figurka rytíře
        var knightPawnImg = new Image();
        knightPawnImg.src = "assets/pawns/pawn_knight_valiant.png";

        // 4. Harmonická pětice medailonků na královské pouti
        var questTiles = [
            { rx: 0.12, ry: 0.58, label: "Start", labelEn: "Start", color: "#10b981", icon: "🚩", src: "assets/tiles/start.png", story: "🚩 1. Startovní rozcestí: Rytíř vyráží s 10 000 zlaťáky do světa", storyEn: "🚩 1. Crossroads Start: Knight departs with 10,000 gold into the realm" },
            { rx: 0.31, ry: 0.40, label: "Chov koní", labelEn: "Horse Breeding", color: "#f59e0b", icon: "🐎", src: "assets/tiles/kun.jpg", story: "🐎 2. Chov koní & stáje: Budování panství, zvířata a výběr nájmů", storyEn: "🐎 2. Horse Breeding & Stables: Estate building, animals & rent collection" },
            { rx: 0.50, ry: 0.58, label: "Hrad & Turnaj", labelEn: "Castle & Joust", color: "#0ea5e9", icon: "🏰", src: "assets/tiles/castle.png", story: "🏰 3. Královský turnaj: Klání mistrů ve 4 královských ctnostech", storyEn: "🏰 3. Royal Tournament: Clash of masters in the 4 knightly virtues" },
            { rx: 0.69, ry: 0.40, label: "Dračí sluj", labelEn: "Dragon Lair", color: "#ef4444", icon: "🐉", src: "assets/tiles/u3_drak.jpg", story: "🐉 4. Dračí sluj: Epický souboj s ohnivým drakem o slavný poklad", storyEn: "🐉 4. Dragon's Lair: Epic battle with the fire dragon for legendary loot" },
            { rx: 0.88, ry: 0.58, label: "Slavnosti 💖", labelEn: "Celebrations 💖", color: "#ec4899", icon: "💖", src: "assets/tiles/festival.jpg", story: "💖 5. Královské slavnosti: Zisk 30 Princezniných srdcí a vítězství!", storyEn: "💖 5. Royal Celebrations: Claiming 30 Princess Hearts and victory!" }
        ];

        for (var i = 0; i < questTiles.length; i++) {
            var im = new Image();
            im.src = questTiles[i].src;
            questTiles[i].img = im;
        }

        var t = 0;
        var lastStoryIdx = -1;

        // Magické jiskry a srdíčka
        var sparks = [];
        for (var s = 0; s < 26; s++) {
            sparks.push({
                x: Math.random() * 640,
                y: Math.random() * 360,
                r: 1.2 + Math.random() * 2.0,
                vy: -0.3 - Math.random() * 0.45,
                vx: (Math.random() - 0.5) * 0.35,
                alpha: 0.25 + Math.random() * 0.65,
                type: Math.random() > 0.3 ? "gold" : "rose"
            });
        }

        // Ohnivé jiskřičky u Dračí sluje
        var dragonEmbers = [];
        for (var de = 0; de < 12; de++) {
            dragonEmbers.push({
                offsetAngle: Math.random() * Math.PI * 2,
                dist: 10 + Math.random() * 32,
                speed: 0.4 + Math.random() * 0.8,
                r: 1.2 + Math.random() * 2.0,
                life: Math.random()
            });
        }

        var tickerEl = document.getElementById("lp-live-quest-ticker");

        var drawRoundedRect = function (c, x, y, width, height, radius) {
            c.beginPath();
            c.moveTo(x + radius, y);
            c.lineTo(x + width - radius, y);
            c.arcTo(x + width, y, x + width, y + radius, radius);
            c.lineTo(x + width, y + height - radius);
            c.arcTo(x + width, y + height, x + width - radius, y + height, radius);
            c.lineTo(x + radius, y + height);
            c.arcTo(x, y + height, x, y + height - radius, radius);
            c.lineTo(x, y + radius);
            c.arcTo(x, y, x + radius, y, radius);
            c.closePath();
        };

        var renderLoop = function () {
            try {
                t += 0.016;

                var rect = canvas.getBoundingClientRect();
                var dw = Math.round(rect.width) || (canvas.parentElement ? canvas.parentElement.clientWidth : 0) || 640;
                var dh = Math.round(rect.height) || (canvas.parentElement ? canvas.parentElement.clientHeight : 0) || 360;
                if (canvas.width !== dw || canvas.height !== dh) {
                    canvas.width = dw;
                    canvas.height = dh;
                }
                var w = Math.max(100, canvas.width);
                var h = Math.max(100, canvas.height);

                ctx.clearRect(0, 0, w, h);

                // --- 1. Atmosférické pergamenové pozadí ---
                var bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
                bgGrad.addColorStop(0, "#3a2312");
                bgGrad.addColorStop(0.65, "#201208");
                bgGrad.addColorStop(1, "#0d0703");
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                if (bgImg.complete && bgImg.naturalWidth > 0) {
                    try {
                        var panX = Math.sin(t * 0.2) * 10;
                        var panY = Math.cos(t * 0.16) * 6;
                        ctx.save();
                        ctx.globalAlpha = 0.50;
                        ctx.drawImage(bgImg, -16 + panX, -10 + panY, w + 32, h + 20);
                        ctx.restore();
                    } catch (e) { }
                }

                // --- 2. Královský hrad uprostřed na pozadí ---
                if (castleImg.complete && castleImg.naturalWidth > 0) {
                    try {
                        ctx.save();
                        ctx.globalAlpha = 0.18;
                        var castleW = Math.min(160, w * 0.25);
                        var castleH = castleW * (castleImg.naturalHeight / castleImg.naturalWidth);
                        ctx.drawImage(castleImg, w * 0.5 - castleW * 0.5, h * 0.12, castleW, castleH);
                        ctx.restore();
                    } catch (e) { }
                }

                // --- 3. Zlatá královská cesta (Hladká sinusová křivka) ---
                var segCount = questTiles.length - 1;

                var nodePoints = [];
                for (var ni = 0; ni < questTiles.length; ni++) {
                    nodePoints.push({ x: questTiles[ni].rx * w, y: questTiles[ni].ry * h });
                }

                // Široká záře cesty
                ctx.save();
                ctx.beginPath();
                for (var ci = 0; ci < segCount; ci++) {
                    var p0 = nodePoints[ci];
                    var p1 = nodePoints[ci + 1];
                    var mx = (p0.x + p1.x) * 0.5;
                    var my = (p0.y + p1.y) * 0.5;
                    if (ci === 0) ctx.moveTo(p0.x, p0.y);
                    ctx.quadraticCurveTo(p0.x * 0.25 + mx * 0.75, my, p1.x, p1.y);
                }
                ctx.strokeStyle = "rgba(212, 175, 55, 0.22)";
                ctx.lineWidth = 10;
                ctx.lineCap = "round";
                ctx.stroke();

                // Plná zlatá linka cesty
                ctx.strokeStyle = "rgba(212, 175, 55, 0.65)";
                ctx.lineWidth = 4;
                ctx.stroke();

                // Animované zářící úseky
                ctx.strokeStyle = "rgba(254, 240, 138, 0.95)";
                ctx.lineWidth = 2.5;
                ctx.setLineDash([8, 12]);
                ctx.lineDashOffset = -t * 26;
                ctx.stroke();
                ctx.restore();

                // Šlápoty / stepping stones mezi uzly
                ctx.save();
                for (var si = 0; si < segCount; si++) {
                    var sA = nodePoints[si];
                    var sB = nodePoints[si + 1];
                    var sMid = { x: (sA.x + sB.x) * 0.5, y: (sA.y + sB.y) * 0.5 };
                    for (var st = 1; st <= 2; st++) {
                        var frac = st / 3;
                        var stX = (1 - frac) * (1 - frac) * sA.x + 2 * (1 - frac) * frac * (sA.x * 0.25 + sMid.x * 0.75) + frac * frac * sB.x;
                        var stY = (1 - frac) * (1 - frac) * sA.y + 2 * (1 - frac) * frac * sMid.y + frac * frac * sB.y;
                        ctx.beginPath();
                        ctx.arc(stX, stY, 3, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(254, 240, 138, 0.55)";
                        ctx.fill();
                    }
                }
                ctx.restore();

                // --- 4. Zmenšený strážce Dračí sluje (vkusně nad 4. medailonkem) ---
                var dLairX = nodePoints[3].x;
                var dLairY = nodePoints[3].y;
                if (dragonImg.complete && dragonImg.naturalWidth > 0) {
                    try {
                        ctx.save();
                        var dScale = Math.min(76, Math.max(50, w * 0.12));
                        var dHoverY = dLairY - dScale * 0.95 + Math.sin(t * 1.8) * 4;
                        var dTilt = Math.sin(t * 1.2) * 0.04;

                        var dRadGlow = ctx.createRadialGradient(dLairX, dHoverY, 5, dLairX, dHoverY, dScale * 0.7);
                        dRadGlow.addColorStop(0, "rgba(239, 68, 68, 0.35)");
                        dRadGlow.addColorStop(0.7, "rgba(245, 158, 11, 0.15)");
                        dRadGlow.addColorStop(1, "rgba(0,0,0,0)");
                        ctx.fillStyle = dRadGlow;
                        ctx.beginPath();
                        ctx.arc(dLairX, dHoverY, dScale * 0.7, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.translate(dLairX, dHoverY);
                        ctx.rotate(dTilt);
                        ctx.shadowColor = "rgba(0,0,0,0.7)";
                        ctx.shadowBlur = 10;
                        ctx.shadowOffsetY = 4;
                        ctx.drawImage(dragonImg, -dScale * 0.5, -dScale * 0.5, dScale, dScale);
                        ctx.restore();
                    } catch (e) { }
                }

                // Jiskry z dračí sluje
                for (var dei = 0; dei < dragonEmbers.length; dei++) {
                    var deItem = dragonEmbers[dei];
                    deItem.life += 0.02;
                    if (deItem.life > 1) deItem.life = 0;
                    var deAng = deItem.offsetAngle + t * 0.6;
                    var deDist = deItem.dist * deItem.life;
                    var deX = dLairX + Math.cos(deAng) * deDist;
                    var deY = (dLairY - 45) + Math.sin(deAng) * deDist * 0.6 - deItem.life * 14;
                    var deAlpha = Math.sin(deItem.life * Math.PI) * 0.7;
                    ctx.beginPath();
                    ctx.arc(deX, deY, deItem.r, 0, Math.PI * 2);
                    ctx.fillStyle = (dei % 2 === 0) ? ("rgba(251, 191, 36, " + deAlpha + ")") : ("rgba(239, 68, 68, " + deAlpha + ")");
                    ctx.fill();
                }

                // --- 5. Královské medailonky políček ---
                var baseRad = Math.min(w, h) * 0.10;
                for (var tj = 0; tj < questTiles.length; tj++) {
                    var tile = questTiles[tj];
                    var tx = nodePoints[tj].x;
                    var ty = nodePoints[tj].y;
                    var pulse = 1 + Math.sin(t * 2.2 + tj * 1.2) * 0.035;
                    var rad = baseRad * pulse;

                    var glow = ctx.createRadialGradient(tx, ty, rad * 0.4, tx, ty, rad * 1.45);
                    glow.addColorStop(0, tile.color);
                    glow.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(tx, ty, rad * 1.45, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(tx, ty, rad, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    ctx.fillStyle = "#1e130a";
                    ctx.fillRect(tx - rad, ty - rad, rad * 2, rad * 2);

                    var drawn = false;
                    if (tile.img && tile.img.complete && tile.img.naturalWidth > 0) {
                        try {
                            ctx.drawImage(tile.img, tx - rad, ty - rad, rad * 2, rad * 2);
                            drawn = true;
                        } catch (e) { }
                    }
                    if (!drawn) {
                        ctx.fillStyle = "#fef08a";
                        ctx.font = "bold " + Math.round(rad * 0.85) + "px sans-serif";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(tile.icon, tx, ty);
                    }
                    ctx.restore();

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(tx, ty, rad, 0, Math.PI * 2);
                    ctx.strokeStyle = tile.color;
                    ctx.lineWidth = 3.5;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(tx, ty, rad - 2.5, 0, Math.PI * 2);
                    ctx.strokeStyle = "rgba(254, 240, 138, 0.75)";
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();

                    // Elegantní zaoblený štítek pod medailonkem
                    var labelW = Math.max(78, rad * 2.2);
                    var labelH = 18;
                    var labelX = tx - labelW * 0.5;
                    var labelY = ty + rad + 5;

                    ctx.save();
                    ctx.fillStyle = "rgba(16, 11, 7, 0.85)";
                    drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 6);
                    ctx.fill();

                    ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
                    ctx.lineWidth = 1;
                    drawRoundedRect(ctx, labelX, labelY, labelW, labelH, 6);
                    ctx.stroke();

                    ctx.fillStyle = "#fef08a";
                    ctx.font = "600 11px Outfit, sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    var canvasTileLbl = (window.PRS_I18n && window.PRS_I18n.getLanguage() === "en") ? (tile.labelEn || tile.label) : tile.label;
                ctx.fillText(canvasTileLbl, tx, labelY + labelH * 0.5);
                    ctx.restore();
                }

                // --- 6. Nová 2.5D figurka rytíře plynule putujícího po trase ---
                var questProgress = (t * 0.42) % segCount;
                var currSeg = Math.floor(questProgress);
                var segFrac = questProgress - currSeg;

                if (currSeg !== lastStoryIdx && questTiles[currSeg]) {
                    lastStoryIdx = currSeg;
                    if (tickerEl) {
                        var isEnStory = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
                        tickerEl.textContent = isEnStory ? (questTiles[currSeg].storyEn || questTiles[currSeg].story) : questTiles[currSeg].story;
                    }
                }

                var pA = nodePoints[currSeg];
                var pB = nodePoints[currSeg + 1];
                var midX = (pA.x + pB.x) * 0.5;
                var midY = (pA.y + pB.y) * 0.5;
                var ctrlX = pA.x * 0.25 + midX * 0.75;
                var ctrlY = midY;

                var kX = (1 - segFrac) * (1 - segFrac) * pA.x + 2 * (1 - segFrac) * segFrac * ctrlX + segFrac * segFrac * pB.x;
                var kGroundY = (1 - segFrac) * (1 - segFrac) * pA.y + 2 * (1 - segFrac) * segFrac * ctrlY + segFrac * segFrac * pB.y;
                var hop = Math.abs(Math.sin(segFrac * Math.PI)) * 10;
                var kY = kGroundY - hop;

                var pawnH = Math.min(54, Math.max(38, h * 0.16));
                var pawnW = pawnH * 0.64;

                ctx.save();
                ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
                ctx.beginPath();
                ctx.ellipse(kX, kGroundY, pawnW * 0.55, pawnW * 0.22, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = "#fbbf24";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(kX, kGroundY, pawnW * 0.5, pawnW * 0.2, 0, 0, Math.PI * 2);
                ctx.stroke();

                if (knightPawnImg.complete && knightPawnImg.naturalWidth > 0) {
                    try {
                        ctx.shadowColor = "rgba(0,0,0,0.75)";
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetY = 3;
                        ctx.drawImage(knightPawnImg, kX - pawnW * 0.5, kY - pawnH, pawnW, pawnH);
                    } catch (e) { }
                } else {
                    ctx.beginPath();
                    ctx.arc(kX, kY - pawnH * 0.5, 14, 0, Math.PI * 2);
                    ctx.fillStyle = "#dc2626";
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#fef08a";
                    ctx.stroke();
                }
                ctx.restore();

                // --- 7. Zlaté a růžové magické jiskry ---
                for (var k = 0; k < sparks.length; k++) {
                    var sp = sparks[k];
                    sp.x += sp.vx;
                    sp.y += sp.vy;
                    if (sp.y < -10) {
                        sp.y = h + 8;
                        sp.x = Math.random() * w;
                    }
                    ctx.beginPath();
                    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
                    ctx.fillStyle = (sp.type === "gold") ? ("rgba(250, 204, 21, " + sp.alpha + ")") : ("rgba(244, 114, 182, " + sp.alpha + ")");
                    ctx.fill();
                }

            } catch (frameErr) {
                console.warn("Live canvas frame err:", frameErr);
            }

            requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    },

    ensurePlayerNameForGame: async function () {
        // Pokud je uživatel přihlášený (Admin / Hráč s profilem), použijeme jeho přihlášené jméno
        if (this.currentUser && this.currentUser.role !== "Guest") {
            return this.getDefaultPlayerName();
        }

        // Hráč hraje v režimu Host: zeptáme se na jméno pro tuto partii
        var prevNick = "";
        try { prevNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }
        if (!prevNick || prevNick.toLowerCase() === "host" || prevNick.toLowerCase() === "admin") {
            prevNick = "Lord Filip";
        }

        var entered = await KiDeskyDialog.prompt("Zadej své rytířské jméno u stolu pro tuto výpravu královstvím:", prevNick, {
            title: "Rytířská registrace k výpravě",
            icon: "⚔️",
            placeholder: "Zadej rytířské jméno",
            confirmText: "⚔️ Vstoupit ke stolu",
            cancelText: "Zrušit"
        });
        if (entered === null) {
            // Uživatel kliknul na Zrušit / Storno -> nestartujeme hru
            return null;
        }

        entered = entered.trim();
        if (!entered) entered = prevNick || "Lord Filip";

        try { localStorage.setItem("prs_player_nickname", entered); } catch (e) { }

        var formatted = entered.replace(/\s*\(Ty\)$/i, "") + " (Ty)";
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = formatted;
            this.renderLobbyPlayers();
        }
        return formatted;
    },

    quickStartSoloGame: async function (preset) {

        var myName = await this.ensurePlayerNameForGame();
        if (!myName) return;

        this.lobbyPlayers = [

            { name: myName, type: "Human", pawnId: this.selectedPawnId || "knight_valiant" },

            { name: "Černý Baron (PC)", type: "Bot_Aggressive", pawnId: "bot_aggressive" },

            { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder", pawnId: "bot_breeder" },

            { name: "Kněžna Eliška (PC)", type: "Bot_Noble", pawnId: "bot_noble" }

        ];

        this.renderLobbyPlayers();

        var boardSel = document.getElementById("lobby-board-select");

        var targetSel = document.getElementById("lobby-target-hearts");

        var diffSel = document.getElementById("lobby-difficulty-mode");

        var scenSel = document.getElementById("lobby-game-scenario");

        if (preset === "fast") {

            if (boardSel) boardSel.value = "compact_48";

            if (scenSel) scenSel.value = "sprint";

            if (diffSel) diffSel.value = "standard";

            this.handleDifficultyChange("standard");

        } else if (preset === "ultimate") {

            if (boardSel) boardSel.value = "classic_96";

            if (scenSel) scenSel.value = "classic";

            if (diffSel) diffSel.value = "ultimate";

            this.handleDifficultyChange("ultimate");

        } else {

            if (boardSel) boardSel.value = "classic_96";

            if (scenSel) scenSel.value = "classic";

            if (diffSel) diffSel.value = "standard";

            this.handleDifficultyChange("standard");

        }

        this._skipNamePromptOnce = true;
        this.startNewGame(true);

    },

    createOnlineMultiplayerRoom: async function () {

        var self = this;

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            alert("🔒 Založit novou online místnost mohou pouze přihlášení rytíři.\n\nJako Host se můžeš připojit k jakémukoliv stolu zadáním 6místného kódu od kamaráda.\n\nPro založení vlastního online stolu se stačí bezplatně přihlásit nebo zaregistrovat!");
            this.openAuthModal();
            return;
        }

        var myName = await this.ensurePlayerNameForGame();
        if (!myName) return;
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = myName;
            this.renderLobbyPlayers();
        }
        this._skipNamePromptOnce = true;

        var btn = document.getElementById("btn-create-online-room");

        var origText = btn ? btn.innerHTML : "";

        if (btn) {

            btn.disabled = true;

            btn.innerHTML = "⏳ Zakládám online stůl na serveru...";

        }

        this.startNewGame(false);

        if (!this.state) {

            if (btn) { btn.disabled = false; btn.innerHTML = origText; }

            return;

        }

        // Hostitel automaticky hraje za hráče č. 0

        this.myOnlinePlayerIndex = 0;

        if (this.state.players && this.state.players[0]) {

            this.state.players[0].isOnlineHost = true;

            this.state.players[0].type = "Human";

            var hostDispName = (this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username))

                ? (this.currentUser.displayName || this.currentUser.username)

                : "Host";

            this.state.players[0].name = hostDispName + " (Hostitel)";

        }

        var title = "Online stůl (" + ((this.currentUser && this.currentUser.role !== "Guest" && (this.currentUser.displayName || this.currentUser.username)) ? (this.currentUser.displayName || this.currentUser.username) : "Host") + ")";

        fetch("api.ashx?action=save-session", {

            method: "POST",

            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

                sessionGuid: this.state.sessionGuid || "",

                roomCode: this.state.roomCode || "",

                title: title,

                hostUsername: (this.currentUser && this.currentUser.role !== "Guest") ? (this.currentUser.username || this.currentUser.displayName || "Admin") : "Guest",

                boardCode: (this.state.board && this.state.board.code) ? this.state.board.code : "classic_96",

                targetHearts: (this.state.config && this.state.config.targetHearts) ? this.state.config.targetHearts : 30,

                turnNumber: this.state.turnNumber || 1,

                expectedTurnNumber: 0,

                stateJson: JSON.stringify(this.state),

                players: this.state.players

            })

        })

            .then(function (r) {

                if (!r.ok) {

                    throw new Error("Server vrátil HTTP " + r.status);

                }

                return r.json();

            })

            .then(function (res) {

                if (btn) { btn.disabled = false; btn.innerHTML = origText; }

                if (res && res.ok) {

                    self.state.sessionGuid = res.sessionGuid;

                    self.state.roomCode = res.roomCode;

                    self.lastKnownTurnNumber = self.state.turnNumber;

                    try {

                        localStorage.setItem("prs_slot_" + res.roomCode, "0");

                    } catch (e) { }

                    var codeInput = document.getElementById("join-room-code-input");

                    if (codeInput) codeInput.value = res.roomCode;

                    self.hasGameStarted = true;
                    self.updateUserUI();
                    self.fetchServerStatusAndSessions();
            if (self.updateSavedGamesUI) self.updateSavedGamesUI();

                    self.switchTab("board");

                    self.renderGameScreen();

                    self.addLog("🌐 Založena nová Online místnost! Pošli přátelům 6místný kód stolu: " + res.roomCode, "win");

                    if (window.PRS_Audio) window.PRS_Audio.playFanfare();

                    self.copyRoomInviteLink();

                    alert("🎉 Online stůl byl úspěšně založen!\n\nKód místnosti: " + res.roomCode + "\n\nOdkaz pro přátele byl zkopírován do schránky.");

                } else {

                    alert("Nepodařilo se založit online stůl: " + (res && res.error ? res.error : "Neznámá chyba serveru."));

                    self.switchTab("board");

                }

            })

            .catch(function (err) {

                if (btn) { btn.disabled = false; btn.innerHTML = origText; }

                alert("Chyba při zakládání místnosti na serveru: " + (err && err.message ? err.message : err));

                self.switchTab("board");

            });

    },

    // --- UŽIVATELSKÝ ÚČET (Guest / Player / Admin) ---,

    loadSavedUser: function () {

        try {

            var raw = localStorage.getItem("prs_user");

            if (raw) {

                this.currentUser = JSON.parse(raw);

                if (this.currentUser && (this.currentUser.role === "Guest" || !this.currentUser.role)) {

                    this.currentUser.username = "Host";

                    this.currentUser.displayName = "Host";

                    this.currentUser.role = "Guest";

                    this.currentUser.credits = 0;

                }

                if (this.currentUser && typeof this.currentUser.credits === "number" && this.currentUser.role !== "Guest") {

                    this.userCredits = this.currentUser.credits;

                }

                if (this.currentUser && this.currentUser.selectedPawnId) {

                    this.selectedPawnId = this.currentUser.selectedPawnId;

                }

                if (this.currentUser && this.currentUser.unlockedPawnsJson && this.currentUser.role !== "Guest") {

                    try {

                        var arr = JSON.parse(this.currentUser.unlockedPawnsJson);

                        if (Array.isArray(arr) && arr.length > 0) this.unlockedPawns = arr;

                    } catch (e2) { }

                }

            }

            var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
            if (isGuest) {
                // Host má VŽDY 0 modrých krystalů a pouze 6 základních figurek zdarma
                this.userCredits = 0;
                this.unlockedPawns = ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"];
                var basicPawns = ["knight_valiant", "knight_tourney", "lady_huntress", "lord_diplomat", "knight_warden", "lady_sorceress"];
                if (!this.selectedPawnId || basicPawns.indexOf(this.selectedPawnId) === -1) {
                    this.selectedPawnId = "knight_valiant";
                }
                try { localStorage.removeItem("prs_guest_credits"); } catch (e) { }
                try { localStorage.removeItem("prs_unlocked_pawns"); } catch (e) { }
            } else {
                var locPawn = localStorage.getItem("prs_selected_pawn");
                if (locPawn) this.selectedPawnId = locPawn;
            }

        } catch (e) { }

        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].pawnId = this.selectedPawnId || "knight_valiant";
        }

        this.updateUserUI();

    },

    checkEmailConfirmationUrl: function () {
        var self = this;
        var search = window.location.search;
        if (!search || search.indexOf("confirmEmail") === -1) return;

        var token = "";
        try {
            var params = new URLSearchParams(search);
            token = params.get("confirmEmail") || "";
        } catch (e) {
            var m = search.match(/[?&]confirmEmail=([^&]+)/);
            if (m && m[1]) token = decodeURIComponent(m[1]);
        }
        if (!token) return;

        fetch("api.ashx?action=confirm-email&token=" + encodeURIComponent(token))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.user) {
                    self.currentUser = res.user;
                    if (typeof res.user.credits === "number") self.userCredits = res.user.credits;
                    if (res.user.selectedPawnId) self.selectedPawnId = res.user.selectedPawnId;
                    if (res.user.unlockedPawnsJson) {
                        try {
                            var unl = JSON.parse(res.user.unlockedPawnsJson);
                            if (Array.isArray(unl) && unl.length > 0) self.unlockedPawns = unl;
                        } catch (e2) { }
                    }
                    localStorage.setItem("prs_user", JSON.stringify(self.currentUser));
                    self.updateUserUI();
                    if (window.history && window.history.replaceState) {
                        var cleanUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
                    }
                    if (window.PRS_Audio && window.PRS_Audio.playFanfare) {
                        window.PRS_Audio.playFanfare();
                    }
                    alert("👑 " + (res.message || "Tvůj e-mail byl úspěšně potvrzen! Vítej v království jako plnohodnotný rytíř."));
                } else {
                    alert("⚠️ " + ((res && res.message) ? res.message : "Ověření e-mailu selhalo."));
                }
            })
            .catch(function () {
                alert("⚠️ Chyba sítě při ověřování e-mailu.");
            });
    },

    updateUserUI: function () {

        var badgeEl = document.getElementById("user-status-badge");

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        var isUnconfirmed = (this.currentUser && this.currentUser.emailConfirmed === false && this.currentUser.role === "Guest");

        var savedNick = "";

        try { savedNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }

        var rawName = "";
        if (isGuest) {
            rawName = "Host";
        } else {
            rawName = (this.currentUser.displayName || "").trim() || (this.currentUser.username || "").trim() || "Hráč";
        }

        if (rawName && rawName.indexOf("@") !== -1) {

            rawName = rawName.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();

        } else if (rawName && rawName.toLowerCase() === "admin") {

            rawName = "Rytíř Admin";

        }

        var nameStr = this.escapeHtml(rawName);

        var roleIcon = isGuest ? (isUnconfirmed ? "👤 Host (Čeká na e-mail ✉️)" : "👤 Host") : (this.currentUser.role === "Admin" ? "👑 Admin" : "🛡️ Hráč");

        if (badgeEl) {
            if (isGuest) {
                badgeEl.innerHTML = roleIcon;
                badgeEl.title = isUnconfirmed ? "Účet čeká na potvrzení e-mailu. Kliknutím otevřeš podrobnosti." : "Hraješ volně jako Host. Kliknutím se můžeš přihlásit.";
            } else {
                badgeEl.innerHTML = roleIcon + ": <strong>" + nameStr + "</strong>";
                badgeEl.title = "Klepnutím otevřete správu rytířského účtu";
            }
        }

        var unconfBox = document.getElementById("auth-unconfirmed-box");
        if (unconfBox) {
            unconfBox.style.display = isUnconfirmed ? "block" : "none";
        }

        var adminNav = document.getElementById("nav-btn-admin");
        if (adminNav) {
            adminNav.style.display = (this.currentUser && this.currentUser.role === "Admin") ? "inline-flex" : "none";
        }

        // Tlačítka přihlášení a odhlášení v horní liště
        var loginBtn = document.getElementById("topbar-login-btn");
        var logoutBtn = document.getElementById("topbar-logout-btn");
        var creditsBtn = document.getElementById("topbar-credits-btn");

        if (loginBtn) loginBtn.style.display = isGuest ? "inline-flex" : "none";
        if (logoutBtn) logoutBtn.style.display = isGuest ? "none" : "inline-flex";
        if (creditsBtn) creditsBtn.style.display = isGuest ? "none" : "inline-flex";

        var navBoardBtn = document.getElementById("nav-btn-board");
        if (navBoardBtn) navBoardBtn.style.display = this.hasGameStarted ? "inline-flex" : "none";

        // Aktualizace dvoustavového Auth modálu
        var loggedView = document.getElementById("auth-logged-view");
        var guestView = document.getElementById("auth-guest-view");
        if (loggedView && guestView) {
            if (isGuest) {
                loggedView.style.display = "none";
                guestView.style.display = "block";
            } else {
                loggedView.style.display = "block";
                guestView.style.display = "none";

                var pNameInput = document.getElementById("auth-profile-displayname-input");
                if (pNameInput) pNameInput.value = rawName;
                var pBadge = document.getElementById("auth-profile-role-badge");
                if (pBadge) pBadge.textContent = roleIcon;
                var pUser = document.getElementById("auth-profile-username-val");
                if (pUser) pUser.textContent = (this.currentUser && this.currentUser.username) || "rytir";
                var pEmail = document.getElementById("auth-profile-email-val");
                if (pEmail) pEmail.textContent = (this.currentUser && this.currentUser.email) || "Neuveden";
                var pCredits = document.getElementById("auth-profile-credits-val");
                if (pCredits) pCredits.textContent = String(this.userCredits || 0) + " 💎";
            }
        }

        // Aktualizace výchozího hráče č. 0 v lobby

        var defaultPlayerName = this.getDefaultPlayerName();

        if (this.lobbyPlayers && this.lobbyPlayers.length > 0) {

            var curName = this.lobbyPlayers[0].name;

            if (!curName || curName === "Lord Filip (Ty)" || curName === "Host (Ty)" || curName === "Královský Host (Ty)" || curName.endsWith(" (Ty)")) {

                this.lobbyPlayers[0].name = defaultPlayerName;

                this.renderLobbyPlayers();

            }

        }

        // Aktualizace uvítacího pásu na Landing Page

        var lpText = document.getElementById("lp-user-banner-text");

        var lpAct = document.getElementById("lp-user-banner-actions");

        if (lpText) {

            if (isGuest) {

                lpText.innerHTML = "👤 <strong>Vstup bez bariér:</strong> Hraješ jako <strong>Host</strong>. Můžeš ihned hrát proti PC nebo se připojit ke stolu přes kód.";

            } else {

                lpText.innerHTML = roleIcon + " <strong>Vítej v království, " + nameStr + "!</strong> Tvé rozehrané partie a statistiky jsou propojené s databází.";

            }

        }

        if (lpAct) {

            if (isGuest) {

                lpAct.innerHTML = '<button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem;" onclick="PRS_App.openAuthModal()">🔑 Přihlásit se / Registrovat</button>';

            } else {

                lpAct.innerHTML = '<button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem;" onclick="PRS_App.openAuthModal()">👤 Změnit účet / Odhlásit</button>';

            }

        }

        var credEl = document.getElementById("top-user-credits");
        if (credEl) {
            if (isGuest) {
                this.userCredits = 0;
                if (this.currentUser) this.currentUser.credits = 0;
            } else if (this.currentUser && typeof this.currentUser.credits === "number") {
                this.userCredits = this.currentUser.credits;
            }
            credEl.textContent = String(this.userCredits || 0);
        }

        this.updateGameHallUI();

    },

    enterGameHall: function () {
        if (this.refreshLobbySettingsSelects) this.refreshLobbySettingsSelects();
        this.switchTab("lobby");
        this.switchGameHallRoom("custom");
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { }
    },

    setGuestModeAndEnter: function () {
        this.setGuestMode();
        this.enterGameHall();
    },

    activeGameHallRoom: "custom",

    switchGameHallRoom: function (roomId) {
        this.activeGameHallRoom = roomId || "custom";
        var rooms = ["custom", "online", "saves"];
        for (var i = 0; i < rooms.length; i++) {
            var r = rooms[i];
            var el = document.getElementById("room-gh-" + r);
            var btn = document.getElementById("btn-gh-" + r);
            if (el) el.style.display = (r === this.activeGameHallRoom) ? "block" : "none";
            if (btn) {
                if (r === this.activeGameHallRoom) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }
        if (roomId === "online") {
            this.fetchServerStatusAndSessions();
        } else if (roomId === "saves") {
            if (typeof this.renderSavedGamesList === "function") {
                this.renderSavedGamesList();
            }
            var roomEl = document.getElementById("room-gh-saves");
            if (roomEl) {
                try {
                    var rect = roomEl.getBoundingClientRect();
                    if (rect.top < 60 || rect.top > window.innerHeight * 0.7) {
                        roomEl.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                } catch (e) { }
            }
        }
    },

    promptEditNickname: async function () {
        var cur = (this.currentUser && this.currentUser.displayName) || "";
        if (!cur) {
            try { cur = localStorage.getItem("prs_player_nickname") || ""; } catch (e) { }
        }
        if (!cur || cur.toLowerCase() === "host" || cur.toLowerCase() === "admin") cur = "Lord Filip";
        var newNick = await KiDeskyDialog.prompt("Zadej své nové rytířské jméno u stolu:", cur, {
            title: "Úprava rytířského jména",
            icon: "⚔️",
            placeholder: "např. Lord Filip",
            confirmText: "⚔️ Uložit jméno",
            cancelText: "Zrušit"
        });
        if (newNick === null) return;
        newNick = newNick.trim();
        if (!newNick) return;
        if (this.currentUser && this.currentUser.role !== "Guest") {
            this.currentUser.displayName = newNick;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
            fetch("api.ashx?action=update_nickname", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this.currentUser.id, nickname: newNick })
            }).catch(function () { });
        }
        try { localStorage.setItem("prs_player_nickname", newNick); } catch (e) { }
        this.updateUserUI();
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = this.getDefaultPlayerName();
            this.renderLobbyPlayers();
        }
    },

    scrollToSection: function (id) {
        var el = document.getElementById(id);
        if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    },

    updateGameHallUI: function () {
        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        var savedNick = "";
        try { savedNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }
        var rawName = isGuest ? (savedNick || "Host") : ((this.currentUser && this.currentUser.displayName) || (this.currentUser && this.currentUser.username) || savedNick || "Hráč");
        if (rawName && rawName.indexOf("@") !== -1) {
            rawName = rawName.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();
        } else if (rawName && rawName.toLowerCase() === "admin") {
            rawName = "Rytíř Admin";
        }
        var roleLabel = isGuest ? "👤 Host" : (this.currentUser.role === "Admin" ? "👑 Admin" : "🛡️ Hráč");

        // 1. Karta vstupu na Úvodní bráně (tab-welcome)
        var guestView = document.getElementById("welcome-entry-guest-view");
        var userView = document.getElementById("welcome-entry-user-view");
        var wName = document.getElementById("welcome-user-name");
        var wRole = document.getElementById("welcome-user-role-badge");
        var wCredits = document.getElementById("welcome-user-credits");
        if (guestView && userView) {
            if (isGuest) {
                guestView.style.display = "block";
                userView.style.display = "none";
            } else {
                guestView.style.display = "none";
                userView.style.display = "block";
                if (wName) wName.textContent = rawName;
                if (wRole) wRole.textContent = roleLabel;
                if (wCredits) wCredits.textContent = String(this.userCredits || 0);
            }
        }

        // 2. Šlechtická karta v Rytířské herně (tab-lobby)
        var ghName = document.getElementById("gamehall-player-name");
        if (ghName) ghName.textContent = isGuest ? "Host" : rawName;
        var ghRole = document.getElementById("gamehall-role-badge");
        if (ghRole) ghRole.textContent = roleLabel;
        var ghCredits = document.getElementById("gamehall-credits");
        if (ghCredits) ghCredits.textContent = String(this.userCredits || 0);
        var ghCreditsWrap = ghCredits ? ghCredits.parentElement : null;
        if (ghCreditsWrap) {
            ghCreditsWrap.style.display = isGuest ? "none" : "inline-flex";
        }

        // 3. Avatar v herně (opravená cesta k img!)
        var activePawnId = this.selectedPawnId || (this.currentUser && this.currentUser.selectedPawnId) || "knight_valiant";
        var pData = (window.PRS_getPawnById ? window.PRS_getPawnById(activePawnId) : null);
        var ghAvatar = document.getElementById("gamehall-pawn-avatar");
        if (ghAvatar && pData) {
            ghAvatar.src = pData.img || pData.avatarUrl || pData.image || "assets/pawns/pawn_knight_valiant.png";
            ghAvatar.alt = pData.name || "Figurka";
        }

        // 4. Rychlý pás figurek v herně (miniatury odemčených figurek)
        var strip = document.getElementById("gamehall-quick-pawns-strip");
        if (strip && window.PRS_PAWNS_CATALOG) {
            var self = this;
            var htmlPawns = "";
            for (var pi = 0; pi < window.PRS_PAWNS_CATALOG.length; pi++) {
                var pw = window.PRS_PAWNS_CATALOG[pi];
                var isUnl = self.isPawnUnlocked(pw.id);
                if (isUnl) {
                    var isAct = (pw.id === activePawnId);
                    htmlPawns += '<div class="gamehall-pawn-chip ' + (isAct ? 'active' : '') + '" onclick="PRS_App.selectPawnForSlot(\'' + pw.id + '\'); PRS_App.updateUserUI();" title="' + self.escapeHtml(pw.name + ' (' + pw.title + ')') + '">';
                    htmlPawns += '<img src="' + pw.img + '" alt="' + self.escapeHtml(pw.name) + '" />';
                    htmlPawns += '</div>';
                }
            }
            strip.innerHTML = htmlPawns;
        }

        // 5. Banner rozehrané hry (pouze pokud byla hra skutečně zahájena)
        var activeBanner = document.getElementById("gamehall-active-game-banner");
        var activeRound = document.getElementById("gamehall-active-round-info");
        if (activeBanner) {
            var hasActiveGame = (this.hasGameStarted === true && this.state !== null);
            activeBanner.style.display = hasActiveGame ? "flex" : "none";
            if (activeRound && this.state) {
                var roundTxt = window.PRS_I18n ? window.PRS_I18n.t("lobby.active_game_info", { round: this.state.roundNumber || 1, count: this.state.players ? this.state.players.length : 4 }) : ("Kolo " + (this.state.roundNumber || 1) + " • " + (this.state.players ? this.state.players.length : 4) + " Rytířů");
                activeRound.textContent = roundTxt;
            }
        }

        // 6. Tlačítko pro založení online místnosti (Host se může připojit, ale nemůže ji založit)
        var createRoomBtn = document.getElementById("btn-create-online-room");
        if (createRoomBtn) {
            var isEnNow = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            if (isGuest) {
                createRoomBtn.innerHTML = isEnNow ? "🔒 Create New Online Room (Sign-in required)" : "🔒 Založit novou Online místnost (vyžaduje přihlášení)";
                createRoomBtn.style.borderColor = "rgba(212,175,55,0.45)";
                createRoomBtn.style.color = "var(--gold-light)";
                createRoomBtn.title = isEnNow ? "As a Guest you can join a friend's table via 6-digit code. Sign in to host a table." : "Jako Host se můžeš připojit ke stolu kamaráda přes 6místný kód. Pro založení nového stolu se přihlas.";
            } else {
                createRoomBtn.innerHTML = isEnNow ? "☁️ Create New Online Room & get friend invite code" : "☁️ Založit novou Online místnost a získat kód pro přátele";
                createRoomBtn.style.borderColor = "#38bdf8";
                createRoomBtn.style.color = "#bae6fd";
                createRoomBtn.title = isEnNow ? "Creates a new online game and generates a 6-digit invite code" : "Založí novou online hru a vygeneruje 6místný kód pro přátele";
            }
        }

        // 7. Rodový erb rytíře v herně
        this.updateGameHallCrestUI();

        // 8. Aktualizace posledních rozehraných / uložených výprav
        if (typeof this.updateSavedGamesUI === "function") {
            this.updateSavedGamesUI();
        }
        if (this.activeGameHallRoom === "saves" && typeof this.renderSavedGamesList === "function") {
            this.renderSavedGamesList();
        }
    },

    updateGameHallCrestUI: function () {
        var crestInfo = this.getPlayerCrest();
        var crestWrap = document.getElementById("gamehall-crest-wrap");
        if (crestWrap && window.PRS_renderCrestBadgeHTML) {
            crestWrap.innerHTML = window.PRS_renderCrestBadgeHTML(crestInfo.crestId, crestInfo.tincture, 34);
        }
        var setCrestPreview = document.getElementById("settings-crest-preview");
        if (setCrestPreview && window.PRS_renderCrestBadgeHTML) {
            var cObj = window.PRS_getCrestById(crestInfo.crestId);
            var tObj = window.PRS_getTinctureByKey(crestInfo.tincture);
            setCrestPreview.innerHTML = window.PRS_renderCrestBadgeHTML(crestInfo.crestId, crestInfo.tincture, 44) +
                '<div style="margin-left:0.5rem;"><div style="font-weight:700; color:' + tObj.text + '; font-size:0.92rem;">' + this.escapeHtml(cObj.name) + '</div>' +
                '<div style="font-size:0.75rem; color:#cbd5e1; font-style:italic;">„' + this.escapeHtml(cObj.motto) + '“</div></div>';
        }
    },

    getPlayerCrest: function () {
        var crestId = "lion";
        var tincture = "gold";
        try {
            crestId = localStorage.getItem("kidesky_player_crest_id") || "lion";
            tincture = localStorage.getItem("kidesky_player_crest_tincture") || "gold";
        } catch (e) { }
        return { crestId: crestId, tincture: tincture };
    },

    setPlayerCrest: function (crestId, tincture) {
        crestId = crestId || "lion";
        tincture = tincture || "gold";
        try {
            localStorage.setItem("kidesky_player_crest_id", crestId);
            localStorage.setItem("kidesky_player_crest_tincture", tincture);
        } catch (e) { }
        this.updateGameHallCrestUI();
        if (this.state && this.state.players) {
            var myIdx = (typeof this.myOnlinePlayerIndex === "number") ? this.myOnlinePlayerIndex : 0;
            if (this.state.players[myIdx]) {
                this.state.players[myIdx].crestId = crestId;
                this.state.players[myIdx].crestColor = tincture;
            }
        }
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].crestId = crestId;
            this.lobbyPlayers[0].crestColor = tincture;
        }
    },

    openCrestPickerModal: function () {
        var modal = document.getElementById("crest-picker-modal");
        if (!modal) return;
        var cur = this.getPlayerCrest();
        this._pickerSelectedCrest = cur.crestId;
        this._pickerSelectedTincture = cur.tincture;
        this.renderCrestPickerModal();
        modal.style.display = "flex";
        this.updateBodyModalClass();
    },

    closeCrestPickerModal: function () {
        var modal = document.getElementById("crest-picker-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    selectCrestInPicker: function (crestId) {
        this._pickerSelectedCrest = crestId;
        this.renderCrestPickerModal();
    },

    selectTinctureInPicker: function (tKey) {
        this._pickerSelectedTincture = tKey;
        this.renderCrestPickerModal();
    },

    confirmCrestSelection: function () {
        var cId = this._pickerSelectedCrest || "lion";
        var tKey = this._pickerSelectedTincture || "gold";
        this.setPlayerCrest(cId, tKey);
        this.closeCrestPickerModal();
        if (window.PRS_Audio && typeof window.PRS_Audio.playItem === "function") {
            window.PRS_Audio.playItem();
        }
    },

    renderCrestPickerModal: function () {
        var grid = document.getElementById("crest-picker-grid");
        var tincturesWrap = document.getElementById("crest-tinctures-strip");
        var previewWrap = document.getElementById("crest-live-preview-box");
        if (!grid || !window.PRS_HERALDRY_CATALOG) return;

        var curCrest = this._pickerSelectedCrest || "lion";
        var curTincture = this._pickerSelectedTincture || "gold";

        // 1. Grid of crests
        var htmlGrid = [];
        for (var i = 0; i < window.PRS_HERALDRY_CATALOG.length; i++) {
            var cr = window.PRS_HERALDRY_CATALOG[i];
            var isSel = (cr.id === curCrest);
            htmlGrid.push(
                '<div class="crest-card-opt ' + (isSel ? 'selected' : '') + '" onclick="PRS_App.selectCrestInPicker(\'' + cr.id + '\')">' +
                '  <div style="font-size:2rem; margin-bottom:2px;">' + cr.icon + '</div>' +
                '  <div style="font-family:\'Cinzel\',serif; font-size:0.82rem; font-weight:700; color:' + (isSel ? '#fef08a' : '#e2e8f0') + ';">' + this.escapeHtml(cr.name) + '</div>' +
                '  <div style="font-size:0.68rem; color:#94a3b8; line-height:1.2;">' + this.escapeHtml(cr.motto) + '</div>' +
                '</div>'
            );
        }
        grid.innerHTML = htmlGrid.join("\n");

        // 2. Tinctures
        if (tincturesWrap && window.PRS_HERALDRY_TINCTURES) {
            var htmlTinc = [];
            for (var t = 0; t < window.PRS_HERALDRY_TINCTURES.length; t++) {
                var tc = window.PRS_HERALDRY_TINCTURES[t];
                var isTSel = (tc.key === curTincture);
                htmlTinc.push(
                    '<div class="crest-tincture-swatch ' + (isTSel ? 'selected' : '') + '" style="background:' + tc.bg + '; border-color:' + (isTSel ? '#fff' : tc.border) + ';" onclick="PRS_App.selectTinctureInPicker(\'' + tc.key + '\')" title="' + this.escapeHtml(tc.name) + '"></div>'
                );
            }
            tincturesWrap.innerHTML = htmlTinc.join("\n");
        }

        // 3. Live preview
        if (previewWrap && window.PRS_renderCrestBadgeHTML) {
            var cObj = window.PRS_getCrestById(curCrest);
            var tObj = window.PRS_getTinctureByKey(curTincture);
            previewWrap.innerHTML =
                '<div style="display:flex; align-items:center; gap:1.1rem; background:rgba(0,0,0,0.45); border:1px solid rgba(212,175,55,0.3); border-radius:10px; padding:0.75rem 1.15rem;">' +
                '  ' + window.PRS_renderCrestBadgeHTML(curCrest, curTincture, 52) +
                '  <div>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.1rem; font-weight:700; color:' + tObj.text + ';">' + this.escapeHtml(cObj.name) + '</div>' +
                '    <div style="font-size:0.8rem; color:#fde68a; font-style:italic; margin-top:2px;">„' + this.escapeHtml(cObj.motto) + '“</div>' +
                '    <div style="font-size:0.72rem; color:#94a3b8; margin-top:3px;">Heraldická tinktura: <strong>' + this.escapeHtml(tObj.name) + '</strong></div>' +
                '  </div>' +
                '</div>';
        }
    },

    logoutUser: function () {
        this.setGuestMode();
        if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
        this.closeAuthModal();
        this.updateUserUI();
        var outMsg = window.PRS_I18n ? window.PRS_I18n.t("auth.logout_success") : "Byl jsi úspěšně odhlášen. Nyní pokračuješ volně v režimu Hosta."; if (window.KiDeskyToast) { KiDeskyToast.show(outMsg, "info"); } else { alert(outMsg); }
    },

    showAuthLoginForm: function () {
        var loggedView = document.getElementById("auth-logged-view");
        var guestView = document.getElementById("auth-guest-view");
        if (loggedView) loggedView.style.display = "none";
        if (guestView) guestView.style.display = "block";
    },

    saveProfileNickname: function () {
        var input = document.getElementById("auth-profile-displayname-input");
        if (!input) return;
        var newNick = input.value.trim();
        if (!newNick) return;
        if (this.currentUser && this.currentUser.role !== "Guest") {
            this.currentUser.displayName = newNick;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
            fetch("api.ashx?action=update_nickname", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: this.currentUser.id, nickname: newNick })
            }).catch(function () { });
        }
        try { localStorage.setItem("prs_player_nickname", newNick); } catch (e) { }
        this.updateUserUI();
        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].name = this.getDefaultPlayerName();
            this.renderLobbyPlayers();
        }
        alert("Rytířské jméno bylo uloženo: " + newNick);
    },

    // --- LOBBY & NASTAVENÍ NOVÉ HRY ---,

    renderLobbyPlayers: function () {

        var container = document.getElementById("lobby-players-list");

        if (!container) return;

        var html = "";

        for (var i = 0; i < this.lobbyPlayers.length; i++) {

            var p = this.lobbyPlayers[i];

            var col = window.PRS_GameEngine.PLAYER_COLORS[i % window.PRS_GameEngine.PLAYER_COLORS.length];

            if (!p.pawnId && window.PRS_getDefaultPawnIdForPlayer) {
                p.pawnId = window.PRS_getDefaultPawnIdForPlayer(p, i);
            }
            var pawnObj = window.PRS_getPawnById ? window.PRS_getPawnById(p.pawnId) : null;
            var pawnImg = pawnObj ? pawnObj.img : "assets/pawns/pawn_knight_valiant.png";
            var pawnTitle = pawnObj ? pawnObj.name : "Zvolit figurku";

            var optHuman = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.human") : "👤 Člověk (u stolu)";
            var optAggressive = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_aggressive") : "⚔️ PC Válečník (Lovec draků)";
            var optBreeder = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_breeder") : "🐎 PC Chovatel (Sady zvířat)";
            var optNoble = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_noble") : "👑 PC Dvořan (Diplomacie & Ples)";
            var optBalanced = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_balanced") : "⚖️ PC Rytíř (Vyvážený)";
            var optEasy = window.PRS_I18n ? window.PRS_I18n.t("lobby.player_types.bot_easy") : "🌱 PC Panoš (Opatrný)";

            var pDisplayName = (window.PRS_App && window.PRS_App.getPlayerDisplayName) ? window.PRS_App.getPlayerDisplayName(p) : p.name;

            var placeholder = (i === 0) 
                ? (' placeholder="' + (window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en' ? 'Your knight nickname (e.g. Sir Gawain)' : 'Tvoje rytířská přezdívka (např. Sir Gawain)') + '" title="' + (window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en' ? 'Enter your knight name at the table' : 'Zadej svou herní přezdívku (jméno rytíře u stolu)') + '"')
                : (' placeholder="' + (window.PRS_I18n && window.PRS_I18n.getLanguage() === 'en' ? 'Player name / AI bot' : 'Jméno hráče / PC bota') + '"');

            html += '<div class="lobby-player-row">' +

                '<button type="button" class="lobby-pawn-btn" onclick="PRS_App.openPawnShopModal(' + i + ')" title="Figurka: ' + this.escapeHtml(pawnTitle) + ' (klepni pro změnu figurky)" style="width:36px; height:36px; border-radius:50%; padding:0; background:radial-gradient(circle, ' + col.hex + ' 0%, #1a0f0a 85%); border:2px solid #ffd86b; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; position:relative; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.65);">' +
                '  <img src="' + pawnImg + '" alt="" style="width:105%; height:105%; object-fit:contain; border-radius:50%;"/>' +
                '  <span style="position:absolute; bottom:-3px; right:-3px; background:#1e130c; border:1px solid #ffd86b; border-radius:50%; width:14px; height:14px; font-size:8px; display:flex; align-items:center; justify-content:center; color:#ffd86b;">🎭</span>' +
                '</button>' +

                '<input type="text" class="prs-input" value="' + this.escapeHtml(pDisplayName) + '"' + placeholder + ' oninput="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" onchange="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" />' +

                '<select class="prs-select" onchange="PRS_App.updateLobbyPlayerType(' + i + ', this.value)">' +

                '  <option value="Human" ' + (p.type === "Human" ? "selected" : "") + '>' + optHuman + '</option>' +

                '  <option value="Bot_Aggressive" ' + (p.type === "Bot_Aggressive" ? "selected" : "") + '>' + optAggressive + '</option>' +

                '  <option value="Bot_Breeder" ' + (p.type === "Bot_Breeder" ? "selected" : "") + '>' + optBreeder + '</option>' +

                '  <option value="Bot_Noble" ' + (p.type === "Bot_Noble" ? "selected" : "") + '>' + optNoble + '</option>' +

                '  <option value="Bot_Balanced" ' + (p.type === "Bot_Balanced" ? "selected" : "") + '>' + optBalanced + '</option>' +

                '  <option value="Bot_Easy" ' + (p.type === "Bot_Easy" ? "selected" : "") + '>' + optEasy + '</option>' +

                '</select>' +

                (this.lobbyPlayers.length > 2

                    ? '<button class="btn-icon-danger" onclick="PRS_App.removeLobbyPlayer(' + i + ')" title="Odebrat hráče">✕</button>'

                    : '') +

                '</div>';

        }

        container.innerHTML = html;

    },

    updateLobbyPlayerName: function (idx, val) {

        if (this.lobbyPlayers[idx]) {

            this.lobbyPlayers[idx].name = val;

            if (idx === 0) {

                var cleanNick = (val || "").replace(/\s*\(Ty\)$/i, "").trim();

                if (cleanNick && cleanNick.toLowerCase() !== "host") {

                    try {

                        localStorage.setItem("prs_player_nickname", cleanNick);

                        if (this.currentUser && this.currentUser.role !== "Guest") {

                            this.currentUser.displayName = cleanNick;

                            localStorage.setItem("prs_user", JSON.stringify(this.currentUser));

                            if (this.currentUser.username) {

                                fetch("api.ashx?action=update_nickname", {

                                    method: "POST",

                                    headers: { "Content-Type": "application/json" },

                                    body: JSON.stringify({ username: this.currentUser.username, displayName: cleanNick })

                                }).catch(function () { });

                            }

                        }

                    } catch (e) { }

                }

            }

        }

    },

    updateLobbyPlayerType: function (idx, val) {

        if (this.lobbyPlayers[idx]) {
            this.lobbyPlayers[idx].type = val;
            if (window.PRS_getDefaultPawnIdForPlayer) {
                this.lobbyPlayers[idx].pawnId = window.PRS_getDefaultPawnIdForPlayer({ type: val }, idx);
            }
            this.renderLobbyPlayers();
        }

    },

    addLobbyPlayer: function () {

        if (this.lobbyPlayers.length >= 6) return;

        var idx = this.lobbyPlayers.length;

        var col = window.PRS_GameEngine.PLAYER_COLORS[idx];

        this.lobbyPlayers.push({ name: col.name, type: "Bot_Balanced", pawnId: "bot_balanced" });

        this.renderLobbyPlayers();

    },

    // --- KRÁLOVSKÁ ŠATNA A KLENOTNICE FIGUREK (#pawn-shop-modal) ---
    isPawnUnlocked: function (pawnId) {
        var pObj = window.PRS_getPawnById ? window.PRS_getPawnById(pawnId) : null;
        if (!pObj) return false;

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            // Host má k dispozici VÝHRADNĚ 6 základních bezplatných rytířů
            return pObj.category === "basic";
        }

        // Administrátor má odemčeny všechny figurky v království
        if (this.currentUser && this.currentUser.role === "Admin") {
            return true;
        }

        // Běžný přihlášený hráč: základní jsou zdarma, ostatní podle profilu
        if (pObj.category === "basic") return true;

        return Array.isArray(this.unlockedPawns) && this.unlockedPawns.indexOf(pawnId) !== -1;
    },

    openPawnShopModal: function (slotIdx) {
        if (typeof slotIdx === "number" && slotIdx >= 0) {
            this.pawnPickerTargetSlot = slotIdx;
        } else {
            this.pawnPickerTargetSlot = 0;
        }
        var modal = document.getElementById("pawn-shop-modal");
        if (!modal) return;
        this.renderPawnShopModal();
        modal.style.display = "flex";
        this.updateBodyModalClass();
    },

    closePawnShopModal: function () {
        var modal = document.getElementById("pawn-shop-modal");
        if (modal) modal.style.display = "none";
        this.updateBodyModalClass();
    },

    setPawnShopCategory: function (cat) {
        this.pawnShopActiveCategory = cat || "all";
        this.renderPawnShopModal();
    },

    renderPawnShopModal: function () {
        var grid = document.getElementById("pawn-shop-grid");
        var credEl = document.getElementById("pawn-shop-credits-val");
        var slotInfoEl = document.getElementById("pawn-shop-slot-info");
        if (!grid) return;

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            this.userCredits = 0;
        }

        if (credEl) credEl.textContent = String(this.userCredits || 0);

        var slotIdx = this.pawnPickerTargetSlot || 0;
        var targetPlayer = (this.lobbyPlayers && this.lobbyPlayers[slotIdx]) ? this.lobbyPlayers[slotIdx] : null;
        var currentPawnId = targetPlayer ? (targetPlayer.pawnId || this.selectedPawnId) : this.selectedPawnId;

        if (slotInfoEl) {
            if (isGuest) {
                slotInfoEl.innerHTML = '👤 Hraješ jako <strong>Host</strong>: máš zdarma k dispozici <strong>6 základních rytířů</strong>. Prémiové figurky a krystaly 💎 jsou pro přihlášené účty.';
            } else if (targetPlayer) {
                slotInfoEl.innerHTML = 'Vybíráš figurku pro slot <strong>#' + (slotIdx + 1) + ': ' + this.escapeHtml(targetPlayer.name) + '</strong>';
            } else {
                slotInfoEl.innerHTML = 'Vybíráš svou hlavní osobní figurku';
            }
        }

        var cat = this.pawnShopActiveCategory || "all";
        var tabs = ["all", "basic", "premium", "bot"];
        for (var t = 0; t < tabs.length; t++) {
            var btn = document.getElementById("pawn-tab-" + tabs[t]);
            if (btn) {
                if (tabs[t] === cat) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }

        var catalog = window.PRS_PAWNS_CATALOG || [];
        var html = [];
        for (var i = 0; i < catalog.length; i++) {
            var pw = catalog[i];
            if (cat !== "all" && pw.category !== cat) continue;

            var unlocked = this.isPawnUnlocked(pw.id);
            var isSelected = (currentPawnId === pw.id);
            var isPrem = (pw.category === "premium");
            var isBot = (pw.category === "bot");

            var catBadge = "";
            if (isPrem) {
                catBadge = '<span class="pawn-card-badge premium">💎 Prémiová</span>';
            } else if (isBot) {
                catBadge = '<span class="pawn-card-badge bot">🤖 PC Bot</span>';
            } else {
                catBadge = '<span class="pawn-card-badge basic">🛡️ Základní</span>';
            }

            var actionBtn = "";
            if (isSelected) {
                actionBtn = '<button type="button" class="btn-gold-lg" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; background:linear-gradient(135deg,#16a34a,#15803d); color:#fff; border-color:#86efac;">✅ Právě zvoleno</button>';
            } else if (unlocked) {
                actionBtn = '<button type="button" class="btn-secondary" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.selectPawnForSlot(&quot;' + pw.id + '&quot;)">🎭 Zvolit figurku</button>';
            } else if (isGuest) {
                actionBtn = '<button type="button" class="btn-secondary" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; opacity:0.85; border-color:rgba(212,175,55,0.4);" onclick="PRS_App.unlockPremiumPawn(&quot;' + pw.id + '&quot;)">🔒 Pro přihlášené</button>';
            } else {
                var canAfford = (this.userCredits >= pw.priceCredits);
                actionBtn = '<button type="button" class="btn-gold-lg" style="width:100%; padding:0.35rem 0.5rem; font-size:0.78rem; ' + (!canAfford ? 'opacity:0.65;' : '') + '" onclick="PRS_App.unlockPremiumPawn(&quot;' + pw.id + '&quot;)">🔓 Odemknout (' + pw.priceCredits + ' 💎)</button>';
            }

            var statusBadge = "";
            if (unlocked) {
                statusBadge = '<span style="font-size:0.72rem; color:#86efac;">✓ Odemčeno</span>';
            } else if (isBot) {
                statusBadge = '<span style="font-size:0.72rem; color:#9ca3af;">🔒 Pouze pro PC</span>';
            } else {
                statusBadge = '<span style="font-size:0.74rem; color:#fde047; font-weight:700;">🔒 ' + (pw.priceCredits || 150) + ' 💎</span>';
            }

            html.push('<div class="pawn-shop-card ' + (isSelected ? 'selected' : '') + ' ' + (isPrem ? 'premium-card' : '') + '" style="border-color:' + (isSelected ? '#22c55e' : (isPrem ? pw.accentColor : 'rgba(212,175,55,0.3)')) + ';">');
            html.push('  <div class="pawn-card-top">' + catBadge + statusBadge + '</div>');
            html.push('  <div class="pawn-card-figure-wrap" onclick="PRS_App.selectPawnOrUnlock(&quot;' + pw.id + '&quot;)">');
            html.push('    <div class="pawn-card-aura" style="background:radial-gradient(circle, ' + (pw.accentColor || '#d4af37') + ' 0%, transparent 70%);"></div>');
            html.push('    <img src="' + pw.img + '" alt="' + this.escapeHtml(pw.name) + '" class="pawn-card-img"/>');
            html.push('  </div>');
            html.push('  <div class="pawn-card-name">' + this.escapeHtml(pw.name) + '</div>');
            html.push('  <div class="pawn-card-title">' + this.escapeHtml(pw.title || "") + '</div>');
            html.push('  <div class="pawn-card-desc">' + this.escapeHtml(pw.desc || "") + '</div>');
            html.push('  <div class="pawn-card-action">' + actionBtn + '</div>');
            html.push('</div>');
        }
        grid.innerHTML = html.join("\n");
    },

    selectPawnOrUnlock: function (pawnId) {
        if (this.isPawnUnlocked(pawnId)) {
            this.selectPawnForSlot(pawnId);
        } else {
            this.unlockPremiumPawn(pawnId);
        }
    },

    selectPawnForSlot: function (pawnId) {
        if (!this.isPawnUnlocked(pawnId)) {
            this.unlockPremiumPawn(pawnId);
            return;
        }
        var slotIdx = this.pawnPickerTargetSlot || 0;
        if (this.lobbyPlayers && this.lobbyPlayers[slotIdx]) {
            this.lobbyPlayers[slotIdx].pawnId = pawnId;
        }
        if (slotIdx === 0) {
            this.selectedPawnId = pawnId;
            try { localStorage.setItem("prs_selected_pawn", pawnId); } catch (e) { }
            if (this.currentUser) {
                this.currentUser.selectedPawnId = pawnId;
                try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }
                if (this.currentUser.role !== "Guest" && this.currentUser.username) {
                    fetch("api.ashx?action=save-user-pawn", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: this.currentUser.username, selectedPawnId: pawnId })
                    }).catch(function () { });
                }
            }
        }
        // Pokud už běží partie, aktualizujeme figurku i v živé hře!
        if (this.state && this.state.players && this.state.players[slotIdx]) {
            if (!this.state.roomCode || this.myOnlinePlayerIndex === slotIdx || slotIdx === 0) {
                var targetLiveIdx = (this.state.roomCode && this.myOnlinePlayerIndex >= 0) ? this.myOnlinePlayerIndex : slotIdx;
                if (this.state.players[targetLiveIdx]) {
                    this.state.players[targetLiveIdx].pawnId = pawnId;
                    this.renderGameScreen();
                    if (this.state.roomCode && this.saveCurrentSessionToCloud) {
                        this.saveCurrentSessionToCloud();
                    }
                }
            }
        }
        this.renderLobbyPlayers();
        this.renderPawnShopModal();
        if (this.renderOnlineRolePawnPicker) this.renderOnlineRolePawnPicker();
    },

    awardCredits: function (amount, reason, isWin) {
        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            // Host nezískává krystaly (krystaly 💎 jsou vyhrazeny pro registrované rytíře)
            this.userCredits = 0;
            return;
        }
        if (typeof amount !== "number" || amount <= 0) return;
        this.userCredits = (this.userCredits || 0) + amount;

        if (this.currentUser) {
            this.currentUser.credits = this.userCredits;
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }

            if (this.currentUser.role !== "Guest" && this.currentUser.username) {
                var self = this;
                fetch("api.ashx?action=award-credits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: this.currentUser.username,
                        amount: amount,
                        isWin: !!isWin
                    })
                })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok && typeof res.credits === "number") {
                        self.userCredits = res.credits;
                        self.currentUser.credits = res.credits;
                        try { localStorage.setItem("prs_user", JSON.stringify(self.currentUser)); } catch (e2) { }
                        self.updateUserUI();
                    }
                })
                .catch(function () { });
            }
        }
        this.updateUserUI();
    },

    unlockPremiumPawn: async function (pawnId) {
        var self = this;
        var pw = window.PRS_getPawnById ? window.PRS_getPawnById(pawnId) : null;
        if (!pw) return;
        if (this.isPawnUnlocked(pawnId)) {
            this.selectPawnForSlot(pawnId);
            return;
        }

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");
        if (isGuest) {
            alert("🔒 Tato figurka je uzamčena pro registrované rytíře.\n\nJako Host máš zdarma k dispozici 6 základních rytířů a 0 krystalů (💎).\n\nChceš-li získávat krystaly za vítězství a odemykat prémiové šampiony se speciální aurou, stačí se bezplatně přihlásit nebo zaregistrovat!");
            this.openAuthModal();
            return;
        }

        if (pw.category === "bot") {
            alert("🤖 Figurky PC Botů jsou vyhrazeny pro počítačové soupeře u stolu.");
            return;
        }

        var price = pw.priceCredits || 150;
        if (this.userCredits < price) {
            alert("Nemáš dostatek kreditů (💎) k odemčení této prémiové figurky!\n\nPotřebuješ: " + price + " 💎\nTvůj zůstatek: " + this.userCredits + " 💎\n\nTip: Kredity získáš za vítězství v partiích nebo od správce v administraci.");
            return;
        }
        var conf = await KiDeskyDialog.confirm("Přeješ si trvale odemknout sběratelskou prémiovou figurku:\n\n✨ " + pw.name + " (" + pw.title + ")\nCena: " + price + " 💎 kreditů?", {
            title: "Odemknutí šampiona",
            icon: "💎",
            confirmText: "💎 Odemknout figurku",
            cancelText: "Zpět"
        });
        if (!conf) return;

        this.userCredits -= price;
        if (!Array.isArray(this.unlockedPawns)) this.unlockedPawns = [];
        if (this.unlockedPawns.indexOf(pawnId) === -1) this.unlockedPawns.push(pawnId);

        if (this.currentUser) {
            this.currentUser.credits = this.userCredits;
            this.currentUser.unlockedPawnsJson = JSON.stringify(this.unlockedPawns);
            try { localStorage.setItem("prs_user", JSON.stringify(this.currentUser)); } catch (e) { }

            if (this.currentUser.role !== "Guest" && this.currentUser.username) {
                fetch("api.ashx?action=unlock-pawn", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: this.currentUser.username,
                        pawnId: pawnId,
                        priceCredits: price
                    })
                })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res && res.ok) {
                        if (typeof res.credits === "number") {
                            self.userCredits = res.credits;
                            self.currentUser.credits = res.credits;
                        }
                        if (res.unlockedPawnsJson) {
                            self.currentUser.unlockedPawnsJson = res.unlockedPawnsJson;
                            try { self.unlockedPawns = JSON.parse(res.unlockedPawnsJson); } catch (e2) { }
                        }
                        try { localStorage.setItem("prs_user", JSON.stringify(self.currentUser)); } catch (e3) { }
                        self.updateUserUI();
                        self.renderPawnShopModal();
                    }
                })
                .catch(function () { });
            }
        }

        if (window.PRS_Audio && window.PRS_Audio.playFanfare) window.PRS_Audio.playFanfare();
        this.updateUserUI();
        this.selectPawnForSlot(pawnId);
    },

    // --- RYTÍŘSKÉ STATISTIKY & SÍŇ SLÁVY (ETAPA 4) ---
    recordGameStats: function (statsPayload) {
        if (!statsPayload) return;
        var self = this;
        var u = (this.currentUser && this.currentUser.username) || statsPayload.username;
        if (!u) return;

        fetch("api.ashx?action=record-game-stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: u,
                isWin: !!statsPayload.isWin,
                hearts: statsPayload.hearts || 0,
                dragons: statsPayload.dragons || 0,
                castles: statsPayload.castles || 0,
                herds: statsPayload.herds || 0,
                festivalHearts: statsPayload.festivalHearts || 0
            })
        })
        .then(function (r) { return r.json(); })
        .then(function (res) {
            if (res && res.ok && res.stats) {
                if (self.currentUser) {
                    self.currentUser.gamesPlayed = res.stats.gamesPlayed;
                    self.currentUser.gamesWon = res.stats.gamesWon;
                    self.currentUser.dragonsSlain = res.stats.dragonsSlain;
                    self.currentUser.totalHeartsEarned = res.stats.totalHeartsEarned;
                    self.currentUser.highestScore = res.stats.highestScore;
                    self.currentUser.achievementsJson = JSON.stringify(res.stats.achievements);
                    try { localStorage.setItem("prs_user", JSON.stringify(self.currentUser)); } catch (e) { }
                }
                if (res.stats.newlyUnlocked && res.stats.newlyUnlocked.length > 0) {
                    var names = {
                        first_game: "🥉 První krok",
                        slayer: "🐉 Drakobijce",
                        castle_lord: "🏰 Pán hradů",
                        breeder: "🐎 Velkochovatel",
                        ball_master: "💃 Mistr bálů",
                        champion: "👑 Královský vítěz",
                        grandmaster: "🌟 Dračí legenda"
                    };
                    var unlNames = res.stats.newlyUnlocked.map(function (k) { return names[k] || k; }).join(", ");
                    if (window.PRS_Audio) window.PRS_Audio.playFanfare();
                    setTimeout(function () {
                        KiDeskyDialog.alert("Gratulujeme! Získal jsi nový královský odznak:<br><br><strong style='color:#fde68a; font-size:1.15rem;'>" + unlNames + "</strong><br><br>Najdeš ho ve své Rytířské síni slávy.", {
                            title: "Nový královský odznak",
                            icon: "🏆"
                        });
                    }, 1200);
                }
            }
        })
        .catch(function () { });
    },

    openAchievementsModal: function () {
        var m = document.getElementById("achievements-modal");
        if (!m) return;
        m.style.display = "flex";
        this.renderAchievementsModalContent();
    },

    closeAchievementsModal: function () {
        var m = document.getElementById("achievements-modal");
        if (m) m.style.display = "none";
    },

    
    getItemDisplayName: function (it) {
        if (!it) return "";
        var id = (typeof it === "string") ? it : (it.id || it.code || "");
        if (window.PRS_I18n) {
            if (id) {
                var trItem = window.PRS_I18n.t("items." + id + ".name");
                if (trItem && trItem !== ("items." + id + ".name")) return trItem;
                var trTrophy = window.PRS_I18n.t("trophies." + id + ".name");
                if (trTrophy && trTrophy !== ("trophies." + id + ".name")) return trTrophy;
            }
        }
        return (typeof it === "object" && it.name) ? it.name : id;
    },

    getNodeDisplayName: function (node) {
        if (!node) return "";
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        if (!isEn) return node.name || "";

        var type = node.type;
        var name = node.name || "";
        var code = node.code || "";

        if (type === "START" || code === "START") {
            return "Royal Castle Start";
        }

        if (type === "ANIMAL") {
            var setId = node.setId || (code && code.match(/\d+/) ? parseInt(code.match(/\d+/)[0], 10) : 1);
            var subtype = node.subtype || "";
            var animalType = (subtype === "horse" || code.startsWith("K")) ? "Horse" : ((subtype === "dog" || code.startsWith("P")) ? "Dog" : "Falcon");
            var breedsEn = {
                1: { horse: "Dapple Gray", falcon: "Kestrel", dog: "Pointer" },
                2: { horse: "Bay Horse", falcon: "Sparrowhawk", dog: "Beagle" },
                3: { horse: "Black Steed", falcon: "Hobby", dog: "Greyhound" },
                4: { horse: "Chestnut", falcon: "Saker", dog: "Bloodhound" },
                5: { horse: "White Steed", falcon: "Royal Hobby", dog: "Tracker" },
                6: { horse: "Dun Horse", falcon: "Peregrine Falcon", dog: "Wolfhound" },
                7: { horse: "Dappled Gray", falcon: "Kite", dog: "Great Dane" },
                8: { horse: "Friesian", falcon: "Osprey", dog: "Hound King" },
                9: { horse: "Andalusian", falcon: "Goshawk", dog: "Hunting Hound" },
                10: { horse: "Warhorse", falcon: "Royal Falcon", dog: "Royal Hound" },
                11: { horse: "Star Stallion", falcon: "White Saker", dog: "Silver Pointer" },
                12: { horse: "Sovereign Steed", falcon: "Phoenix Falcon", dog: "Golden Hound" },
                13: { horse: "Golden Palomino", falcon: "Golden Eagle", dog: "Northern Wolfhound" },
                14: { horse: "Shadow Steed", falcon: "Night Falcon", dog: "Castle Gargoyle" }
            };
            var bInfo = breedsEn[setId] || breedsEn[1];
            var breedStr = (subtype === "horse" || code.startsWith("K")) ? bInfo.horse : ((subtype === "dog" || code.startsWith("P")) ? bInfo.dog : bInfo.falcon);
            return animalType + " " + setId + " (" + breedStr + ")";
        }

        if (type === "VILLAGE") {
            var vMap = {
                "Králova Lhota": "King's Lhota", "Lhotka": "Little Lhota", "Březová": "Birchwood", "Dubina": "Oak Vale",
                "Skalice": "Rockford", "Meziříčí": "Riverbend", "Slunečná": "Sunny", "Podhradí": "Castlefold",
                "Větrná": "Windy", "Zlatá Olešnice": "Golden Alder", "Rovensko": "Flatland", "Chlumec": "Hillcrest",
                "Lipnice": "Lindendale", "Studánka": "Springfield", "Osek": "Ashwood", "Hvozd": "Deep Forest",
                "Kamenice": "Stoney", "Jabloňov": "Applegrove", "Borová": "Pinewood", "Blatná": "Marshfield",
                "Dobříš": "Goodhaven", "Rožmitál": "Rosendale", "Třeboňsko": "Lakehurst", "Bystřička": "Brookside"
            };
            var match = name.match(/Vesnice\s+(\d+)\s*\(([^)]+)\)/);
            if (match) {
                var num = match[1];
                var czName = match[2];
                var enName = vMap[czName] || czName;
                return "Village " + num + " (" + enName + ")";
            }
            return name.replace(/^Vesnice/i, "Village");
        }

        if (type === "TOWN") {
            var tMap = {
                "Královo Pole": "King's Field", "Stříbratec": "Silverton", "Zlatov": "Goldtown", "Mečov": "Swordhaven",
                "Železný Brod": "Ironford", "Korunní Město": "Crown City", "Sokolov": "Falconreach", "Hvězdomír": "Starwatch",
                "Lví Brod": "Lionford", "Sluneční Hradec": "Sun Keep", "Velehrad": "Grand Stronghold", "Křišťálov": "Crystaltown",
                "Jantarové Město": "Amber City", "Bílý Kámen": "Whitestone"
            };
            var matchT = name.match(/Město\s+(\d+)\s*\(([^)]+)\)/);
            if (matchT) {
                var numT = matchT[1];
                var czNameT = matchT[2];
                var enNameT = tMap[czNameT] || czNameT;
                return "Town " + numT + " (" + enNameT + ")";
            }
            return name.replace(/^Město/i, "Town");
        }

        if (type === "CASTLE") {
            var cMap = {
                "Doubrava": "Doubrava Castle",
                "Věčného mrazu": "Eternal Frost",
                "Lávový chřtán": "Lava Maw",
                "Ametyst": "Amethyst",
                "Boreas": "Boreas",
                "Oceán": "Ocean",
                "Pískovcový": "Sandstone",
                "Černá tůň": "Black Mere",
                "Erebus": "Erebus",
                "Královský hrad": "Royal Castle",
                "Královská citadela": "Royal Citadel"
            };
            var matchC = name.match(/Hrad\s+(\d+)\s*\(([^)]+)\)/);
            if (matchC) {
                var numC = matchC[1];
                var czC = matchC[2];
                for (var ck in cMap) {
                    if (czC.indexOf(ck) !== -1) return "Castle " + numC + " (" + cMap[ck] + ")";
                }
                return "Castle " + numC + " (" + czC + ")";
            }
            return name.replace(/^Hrad/i, "Castle");
        }

        if (type === "MASTER") {
            if (name.indexOf("Boje") !== -1) return "Master of Combat";
            if (name.indexOf("Jízdy") !== -1) return "Master of Riding";
            if (name.indexOf("Tance") !== -1) return "Master of Dance";
            if (name.indexOf("Charismatu") !== -1) return "Master of Charisma";
            if (name.indexOf("Velmistr") !== -1) return "Grandmaster";
            return name;
        }

        if (type === "BUILDING") {
            if (name.indexOf("stáje") !== -1) return "Royal Stables";
            if (name.indexOf("kovárna") !== -1) return "Guild Forge";
            if (name.indexOf("sokolník") !== -1) return "Royal Falconer";
            if (name.indexOf("Psovod") !== -1) return "Dog Handler & Pack";
            if (name.indexOf("krejčí") !== -1) return "Court Tailor";
            return name;
        }

        if (type === "FESTIVAL") {
            if (name.indexOf("Turnaj") !== -1) return "FESTIVAL: Royal Tournament ♡";
            if (name.indexOf("Ples") !== -1) return "FESTIVAL: Castle Ball ♡";
            if (name.indexOf("Závod") !== -1) return "FESTIVAL: Grand Race ♡";
            return name;
        }

        if (type === "JESTER") {
            return name.replace(/^Kejklíř/i, "Jester");
        }

        if (type === "TAX") return "Tax Collector";
        if (type === "MERCHANT") return "Royal Market";
        if (type === "CHANCE") return "Card of Chance";
        if (type === "PRISON") return "Royal Dungeon";
        if (type === "HOSPITAL") return "Royal Infirmary";
        if (type === "TAVERN") return "Golden Tankard Tavern";

        return name;
    },

    renderAchievementsModalContent: function () {
        var body = document.getElementById("achievements-modal-body");
        if (!body) return;
        var u = this.currentUser || { displayName: "Host", role: "Guest", credits: 0 };
        var played = u.gamesPlayed || 0;
        var won = u.gamesWon || 0;
        var dragons = u.dragonsSlain || 0;
        var hearts = u.totalHeartsEarned || 0;
        var highest = u.highestScore || 0;
        var achList = [];
        try {
            if (u.achievementsJson) achList = JSON.parse(u.achievementsJson);
        } catch (e) { }

        var badges = [
            { id: "first_game", icon: "🥉", title: "První krok", desc: "Zahraj svou první partii v království Princeznina srdce." },
            { id: "slayer", icon: "🐉", title: "Drakobijce", desc: "Skol obávaného draka v jeho nebezpečné sluji." },
            { id: "castle_lord", icon: "🏰", title: "Pán hradů", desc: "Postav alespoň 2 majestátní hrady na svých panstvích." },
            { id: "breeder", icon: "🐎", title: "Velkochovatel", desc: "Vlastni kompletní sadu koní a alespoň 3 stáda užitkového dobytka." },
            { id: "ball_master", icon: "💃", title: "Mistr bálů", desc: "Získej na jedněch Slavnostech přes 15 Princezniných srdcí." },
            { id: "champion", icon: "👑", title: "Královský vítěz", desc: "Zvítěz v partii a získej ruku princezny i královskou korunu." },
            { id: "grandmaster", icon: "🌟", title: "Dračí legenda", desc: "Dosáhni alespoň 3 slavných vítězství nebo skol 3 draky." }
        ];

        var activeTab = this._achievementsSubtab || "badges";
        var hist = [];
        try {
            hist = JSON.parse(localStorage.getItem("prs_game_history") || "[]");
        } catch (e) { }

        var html = '<div class="achievements-profile-header">' +
            '  <div class="achievements-avatar-badge">' + (u.role === "Admin" ? '👑' : '🛡️') + '</div>' +
            '  <div>' +
            '    <div style="font-family:\'Cinzel\',serif; font-size:1.25rem; font-weight:700; color:var(--gold-light);">' + this.escapeHtml(u.displayName || u.username || "Host") + '</div>' +
            '    <div style="font-size:0.8rem; color:#94a3b8; display:flex; gap:0.5rem; align-items:center; margin-top:0.15rem;">' +
            '      <span>Titul: <strong style="color:#fde68a;">' + (won >= 3 ? "Dračí velmistr" : (won >= 1 ? "Rytíř šampion" : "Čestný panoš")) + '</strong></span> • ' +
            '      <span>Pokladnice: <strong style="color:#38bdf8;">' + (u.credits || 0) + ' 💎</strong></span>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        html += '<div class="achievements-stats-grid">' +
            '  <div class="ach-stat-box"><div class="ach-stat-val">' + played + '</div><div class="ach-stat-lbl">Partií</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#22c55e;">' + won + '</div><div class="ach-stat-lbl">Vítězství</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#f97316;">' + dragons + '</div><div class="ach-stat-lbl">Draků</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#ec4899;">' + (Math.round(hearts * 10) / 10) + '</div><div class="ach-stat-lbl">Srdcí celkem</div></div>' +
            '  <div class="ach-stat-box"><div class="ach-stat-val" style="color:#38bdf8;">' + (Math.round(highest * 10) / 10) + '</div><div class="ach-stat-lbl">Rekord partie</div></div>' +
            '</div>';

        // Přepínač podzáložek: Odznaky vs. Historie výprav
        html += '<div style="display:flex; gap:0.5rem; margin:1rem 0 0.85rem; border-bottom:1px solid rgba(212,175,55,0.25); padding-bottom:0.55rem;">' +
            '  <button type="button" class="rules-subnav-btn ' + (activeTab === "badges" ? "active" : "") + '" onclick="PRS_App.setAchievementsSubtab(\'badges\')" style="padding:0.35rem 0.85rem; font-size:0.84rem;">🏆 Královské odznaky (' + achList.length + ' / ' + badges.length + ')</button>' +
            '  <button type="button" class="rules-subnav-btn ' + (activeTab === "history" ? "active" : "") + '" onclick="PRS_App.setAchievementsSubtab(\'history\')" style="padding:0.35rem 0.85rem; font-size:0.84rem;">📜 Historie výprav (' + hist.length + ')</button>' +
            '</div>';

        if (activeTab === "history") {
            if (hist.length === 0) {
                html += '<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.9rem; background:rgba(0,0,0,0.25); border-radius:8px; border:1px dashed rgba(212,175,55,0.2);">' +
                    '  <div style="font-size:2rem; margin-bottom:0.4rem;">📜</div>' +
                    '  <strong style="color:var(--gold-light);">Žádná zaznamenaná historie partií</strong>' +
                    '  <div style="margin-top:0.25rem;">Odehraj partii na herním stole a tvoje výsledky i slavnostní diplomy se uloží sem do kroniky království.</div>' +
                    '</div>';
            } else {
                html += '<div style="display:flex; flex-direction:column; gap:0.75rem; max-height:48vh; overflow-y:auto; padding-right:0.35rem;">';
                for (var hi = hist.length - 1; hi >= 0; hi--) {
                    var hItem = hist[hi];
                    html += '<div style="background:rgba(0,0,0,0.4); border:1px solid rgba(212,175,55,0.25); border-radius:8px; padding:0.75rem 0.95rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.6rem;">' +
                        '  <div>' +
                        '    <div style="display:flex; align-items:center; gap:0.45rem;">' +
                        '      <span style="font-size:1.1rem;">👑</span>' +
                        '      <strong style="color:' + (hItem.winnerColor || 'var(--gold-light)') + '; font-size:0.96rem;">' + (hItem.winnerBadge || '🛡️') + ' ' + this.escapeHtml(hItem.winnerName || 'Vítěz') + '</strong>' +
                        '      <span style="font-size:0.82rem; color:#ec4899; font-weight:700;">' + hItem.winnerHearts + ' 💖</span>' +
                        '    </div>' +
                        '    <div style="font-size:0.78rem; color:#94a3b8; margin-top:0.2rem;">' +
                        '      <span>📅 ' + this.escapeHtml(hItem.date) + '</span> • ' +
                        '      <span>🗺️ ' + this.escapeHtml(hItem.boardName) + '</span> • ' +
                        '      <span>⏳ ' + hItem.roundNumber + ' kol</span>' +
                        '    </div>' +
                        '  </div>' +
                        '  <button type="button" class="btn-secondary" style="font-size:0.78rem; padding:0.3rem 0.65rem; border-color:var(--gold); color:var(--gold-light);" onclick="PRS_App.openWinnerDiplomaModal(' + hi + ')">📜 Královský diplom</button>' +
                        '</div>';
                }
                html += '</div>';
            }
        } else {
            html += '<div class="achievements-badges-grid">';
            for (var bi = 0; bi < badges.length; bi++) {
                var b = badges[bi];
                var isUnl = achList.indexOf(b.id) !== -1;
                html += '<div class="ach-badge-card ' + (isUnl ? 'unlocked' : 'locked') + '">' +
                    '  <div class="ach-badge-icon">' + b.icon + '</div>' +
                    '  <div style="flex:1;">' +
                    '    <div class="ach-badge-title">' + b.title + '</div>' +
                    '    <div class="ach-badge-desc">' + b.desc + '</div>' +
                    '    <div class="ach-badge-status ' + (isUnl ? 'unlocked-tag' : 'locked-tag') + '">' + (isUnl ? (isEn ? '✨ Unlocked' : '✨ Odemčeno') : (isEn ? '🔒 Locked' : '🔒 Zamčeno')) + '</div>' +
                    '  </div>' +
                    '</div>';
            }
            html += '</div>';
        }

        body.innerHTML = html;
    },

    setAchievementsSubtab: function (tab) {
        this._achievementsSubtab = tab;
        this.renderAchievementsModalContent();
    },

    // --- KATALOG AUTORSKÝCH HER (ETAPA 5) ---
    openGameCatalogPreview: function (gameKey) {
        var m = document.getElementById("catalog-game-modal");
        if (!m) return;
        m.style.display = "flex";
        var body = document.getElementById("catalog-game-modal-body");
        if (!body) return;

        if (gameKey === "dragon_dungeon") {
            body.innerHTML = '<div class="catalog-modal-banner" style="background-image:linear-gradient(to top, rgba(10,7,4,0.95), rgba(10,7,4,0.2)), url(\'assets/landmarks/dragon.jpg\');">' +
                '  <div class="catalog-modal-banner-overlay"></div>' +
                '  <div style="position:relative; z-index:2;">' +
                '    <span class="lp-kicker-badge" style="background:rgba(249,115,22,0.25); border-color:#fb923c; color:#fed7aa;">🔨 V přípravě • Edice KiDesky</span>' +
                '    <h2 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.6rem; margin:0.35rem 0 0.15rem;">🐉 Dobytí Dračí Hory</h2>' +
                '    <div style="font-size:0.85rem; color:#fde68a;">Kooperativní dungeon crawler pro 1–4 hráče</div>' +
                '  </div>' +
                '</div>' +
                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.1rem;">' +
                '  <span class="catalog-feature-pill">👥 1–4 Hrdinové (Kooperace)</span>' +
                '  <span class="catalog-feature-pill">⏱️ 60–90 minut</span>' +
                '  <span class="catalog-feature-pill">🗺️ Modulární podzemní deska</span>' +
                '  <span class="catalog-feature-pill">🎲 Kostkové taktické souboje</span>' +
                '</div>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">Příběhové pozadí &amp; Pravidla</h4>' +
                '<p style="font-size:0.88rem; line-height:1.5; color:#cbd5e1; margin-bottom:0.9rem;">Hluboko v nitru Černé skály procitl prastarý drak Vermithrax a jeho služebníci zamořili okolní kraje. Hráči netvoří soupeře, nýbrž společnou družinu odvážných hrdinů. Každý hráč si volí unikátní třídu: <strong>Válečníka</strong> (tank a drtivé údery), <strong>Kouzelníka</strong> (plošná magie ohně a blesků), <strong>Zlodějku</strong> (odemykání truhel a kritické zásahy) nebo <strong>Klerika</strong> (léčení a posvátná ochrana).</p>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">Herní mechaniky</h4>' +
                '<ul style="font-size:0.86rem; line-height:1.5; color:#cbd5e1; margin-left:1.2rem; margin-bottom:1.2rem;">' +
                '  <li><strong>Modulární podzemí:</strong> Každé sestoupení do sluje náhodně generuje nové sály, pasti a truhly s relikviemi.</li>' +
                '  <li><strong>Boss fight s drakem:</strong> Vícefázový závěrečný souboj vyžadující sehranou týmovou strategii.</li>' +
                '  <li><strong>Sdílená zásoba životů:</strong> Padne-li jeden hrdina a není včas oživen, celá výprava prohrává!</li>' +
                '</ul>' +
                '<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">' +
                '  <button class="btn-gold-lg" style="flex:1; padding:0.65rem;" onclick="PRS_App.subscribeGameNewsletter(\'dragon_dungeon\')">🔔 Sledovat vývoj &amp; Získat přístup do Beta testu</button>' +
                '  <button class="btn-secondary" style="padding:0.65rem 1rem;" onclick="PRS_App.closeGameCatalogPreview()">Zavřít náhled</button>' +
                '</div>';
        } else {
            body.innerHTML = '<div class="catalog-modal-banner" style="background-image:linear-gradient(to top, rgba(10,7,4,0.95), rgba(10,7,4,0.2)), url(\'assets/tiles/merchant.jpg\');">' +
                '  <div class="catalog-modal-banner-overlay"></div>' +
                '  <div style="position:relative; z-index:2;">' +
                '    <span class="lp-kicker-badge" style="background:rgba(56,189,248,0.25); border-color:#38bdf8; color:#bae6fd;">📐 Koncept v návrhu • Edice KiDesky</span>' +
                '    <h2 style="font-family:\'Cinzel\',serif; color:var(--gold-light); font-size:1.6rem; margin:0.35rem 0 0.15rem;">⚖️ Obchodníci Království</h2>' +
                '    <div style="font-size:0.85rem; color:#bae6fd;">Strategická ekonomická desková hra pro 2–5 kupců</div>' +
                '  </div>' +
                '</div>' +
                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1.1rem;">' +
                '  <span class="catalog-feature-pill">👥 2–5 Kupců</span>' +
                '  <span class="catalog-feature-pill">⏱️ 45–75 minut</span>' +
                '  <span class="catalog-feature-pill">⛵ Obchodní stezky &amp; Cechy</span>' +
                '  <span class="catalog-feature-pill">🪙 Fluktuace tržních cen</span>' +
                '</div>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">Příběhové pozadí &amp; Pravidla</h4>' +
                '<p style="font-size:0.88rem; line-height:1.5; color:#cbd5e1; margin-bottom:0.9rem;">Rozlehlé říše propojují karavanní stezky a námořní konvoje. Jako představený kupeckého cechu nakupuješ levně hedvábí, jantar, vzácné koření a královská vína v přístavech a prodáváš je za násobky ve vnitrozemských metropolích s vysokou poptávkou.</p>' +
                '<h4 style="font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.4rem;">Herní mechaniky</h4>' +
                '<ul style="font-size:0.86rem; line-height:1.5; color:#cbd5e1; margin-left:1.2rem; margin-bottom:1.2rem;">' +
                '  <li><strong>Živý trh s nabídkou a poptávkou:</strong> Jakmile kupec zaplaví město kořením, jeho cena klesá pro všechny!</li>' +
                '  <li><strong>Výstavba cechovních skladů:</strong> Možnost stavět faktorie podél obchodních tras a vybírat celní poplatky od soupeřů.</li>' +
                '  <li><strong>Piráti a loupeživí rytíři:</strong> Riziko na cestách snižované najímáním žoldnéřských eskort.</li>' +
                '</ul>' +
                '<div style="display:flex; gap:0.6rem; flex-wrap:wrap;">' +
                '  <button class="btn-gold-lg" style="flex:1; padding:0.65rem;" onclick="PRS_App.subscribeGameNewsletter(\'merchants\')">🔔 Sledovat vývoj &amp; Získat přístup do Beta testu</button>' +
                '  <button class="btn-secondary" style="padding:0.65rem 1rem;" onclick="PRS_App.closeGameCatalogPreview()">Zavřít náhled</button>' +
                '</div>';
        }
    },

    closeGameCatalogPreview: function () {
        var m = document.getElementById("catalog-game-modal");
        if (m) m.style.display = "none";
    },

    subscribeGameNewsletter: function (gameKey) {
        var gName = (gameKey === "dragon_dungeon") ? "Dobytí Dračí Hory" : "Obchodníci Království";
        if (window.PRS_Audio) window.PRS_Audio.playCoin();
        KiDeskyDialog.alert("Děkujeme za tvůj zájem o hru <strong>" + gName + "</strong>!<br><br>Tvůj rytířský profil byl zaznamenán mezi přednostní zájemce pro nadcházející uzavřené Beta testování.", {
            title: "Přihláška k testování přijata",
            icon: "📜"
        });
    },

    // --- TAHOVÝ ČASOVAČ (TURN TIMER) ---
    startTurnTimer: function () {
        this.stopTurnTimer();
        if (!this.state || !this.state.config || !this.state.config.turnTimerSeconds || this.state.config.turnTimerSeconds <= 0) return;
        if (this.state.phase === "GAME_OVER") return;

        var total = this.state.config.turnTimerSeconds;
        this.turnTimerRemaining = total;
        this.turnTimerTotal = total;
        this.updateTurnTimerUI();

        var self = this;
        this.turnTimerInterval = setInterval(function () {
            if (!self.state || self.state.phase === "GAME_OVER") {
                self.stopTurnTimer();
                return;
            }
            self.turnTimerRemaining--;
            self.updateTurnTimerUI();

            var isMyTurn = (self.myOnlinePlayerIndex < 0 || self.state.currentPlayerIndex === self.myOnlinePlayerIndex);
            if (self.turnTimerRemaining === 10 && isMyTurn && window.PRS_Audio) {
                window.PRS_Audio.playNotice();
            }

            if (self.turnTimerRemaining <= 0) {
                self.stopTurnTimer();
                self.handleTurnTimeout();
            }
        }, 1000);
    },

    stopTurnTimer: function () {
        if (this.turnTimerInterval) {
            clearInterval(this.turnTimerInterval);
            this.turnTimerInterval = null;
        }
    },

    updateTurnTimerUI: function () {
        var el = document.getElementById("turn-timer-hud");
        if (!el) return;
        if (!this.state || !this.state.config || !this.state.config.turnTimerSeconds || this.state.config.turnTimerSeconds <= 0 || this.state.phase === "GAME_OVER") {
            el.innerHTML = "";
            return;
        }
        var total = this.state.config.turnTimerSeconds;
        var rem = Math.max(0, this.turnTimerRemaining !== undefined ? this.turnTimerRemaining : total);
        var pct = Math.max(0, Math.min(100, Math.round((rem / total) * 100)));
        var color = (rem <= 10) ? '#ef4444' : (rem <= 25 ? '#f59e0b' : '#10b981');
        var isUrgent = (rem <= 10);

        el.innerHTML = '<div class="turn-timer-bar-wrap">' +
            '  <div class="turn-timer-header">' +
            '    <span>⏱️ Limit tahu: <strong style="color:' + color + ';">' + rem + 's</strong> / ' + total + 's</span>' +
            (isUrgent ? '    <span class="timer-pulse-warning">⚠️ Vyprší za chvíli!</span>' : '') +
            '  </div>' +
            '  <div class="turn-timer-track">' +
            '    <div class="turn-timer-fill" style="width:' + pct + '%; background:' + color + ';"></div>' +
            '  </div>' +
            '</div>';
    },

    handleTurnTimeout: function () {
        if (!this.state || this.state.phase === "GAME_OVER") return;
        var curIdx = this.state.currentPlayerIndex;
        var curP = this.state.players[curIdx];
        var isMyTurn = (this.myOnlinePlayerIndex < 0 || curIdx === this.myOnlinePlayerIndex);

        if (isMyTurn && curP && curP.type === "Human") {
            this.addLog("⏱️ Časový limit pro tvůj tah vypršel – akce byla provedena automaticky.", "danger");
            if (this.state.phase === "ROLL") {
                this.handleRollDice();
            } else {
                this.handleEndTurn();
            }
        } else if (this.state.roomCode && !isMyTurn && curP && curP.type === "Human") {
            this.addLog("⏱️ Hráč " + curP.name + " nestihl svůj tah v časovém limitu.", "danger");
            var actEl = document.getElementById("turn-action-panel");
            if (actEl) {
                var btn = document.getElementById("afk-takeover-btn");
                if (!btn) {
                    var notice = document.createElement("div");
                    notice.style.marginTop = "0.6rem";
                    notice.innerHTML = '<button id="afk-takeover-btn" class="btn-primary" style="width:100%; background:#dc2626; border-color:#f87171; font-weight:700; padding:0.6rem;" onclick="PRS_App.takeOverAfkTurnAsBot()">⚡ Hráč neodpovídá - Předat tah královskému botovi</button>';
                    actEl.appendChild(notice);
                }
            }
        }
    },

        renderKnightEmotesHud: function () {
        var el = document.getElementById("knight-emotes-hud");
        if (!el) return;
        if (!this.state || this.state.phase === "GAME_OVER") {
            el.innerHTML = "";
            return;
        }
        var t = window.PRS_I18n ? function (k, d) { return window.PRS_I18n.t(k, null, d); } : function (k, d) { return d; };
        el.innerHTML = '<div class="knight-emotes-bar">' +
            '  <span class="emotes-label">' + t("reactions.label", "💬 Reakce:") + '</span>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'⚔️\', \'' + t("reactions.to_arms", "Do zbraně!") + '\')" title="' + t("reactions.to_arms", "Do zbraně!") + '">⚔️</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'👑\', \'' + t("reactions.hail_king", "Sláva králi!") + '\')" title="' + t("reactions.hail_king", "Sláva králi!") + '">👑</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🛡️\', \'' + t("reactions.on_guard", "Držím stráž!") + '\')" title="' + t("reactions.on_guard", "Držím stráž!") + '">🛡️</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🍷\', \'' + t("reactions.cheers", "Na zdraví!") + '\')" title="' + t("reactions.cheers", "Na zdraví!") + '">🍷</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🐉\', \'' + t("reactions.beware_dragon", "Pozor na draka!") + '\')" title="' + t("reactions.beware_dragon", "Pozor na draka!") + '">🐉</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'👏\', \'' + t("reactions.great_move", "Skvělý tah!") + '\')" title="' + t("reactions.great_move", "Skvělý tah!") + '">👏</button>' +
            '</div>';
    },

    toggleEmotePicker: function (e) {
        if (e && e.stopPropagation) e.stopPropagation();
        var hudEl = document.getElementById("knight-emotes-hud");
        if (hudEl) {
            if (hudEl.style.display === "none") {
                hudEl.style.display = "block";
            } else {
                hudEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    },

    removeLobbyPlayer: function (idx) {

        if (this.lobbyPlayers.length <= 2) return;

        this.lobbyPlayers.splice(idx, 1);

        this.renderLobbyPlayers();

    },

    rerollProceduralMap: async function () {
        var newSeed = Math.floor(Math.random() * 899999 + 100000);
        this.currentBoardSeed = newSeed;
        this.mapStudioSeed = newSeed;
        if (this.mapStudioOptions) this.mapStudioOptions.seed = newSeed;

        var lobbySel = document.getElementById("lobby-board-select");
        if (lobbySel) lobbySel.value = "procedural";

        var bSel = document.getElementById("board-template-select");
        if (bSel) bSel.value = "procedural";

        if (this.state && this.state.turnNumber > 0) {
            var conf = await KiDeskyDialog.confirm("Generování nového světa vyžaduje novou partii.\nPřeješ si vygenerovat nové království (Seed #" + newSeed + ") a začít novou hru?", {
                title: "Nové království",
                icon: "🎲",
                confirmText: "🎲 Vygenerovat a začít",
                cancelText: "Zpět k partii"
            });
            if (!conf) return;
        }

        this.startNewGame(true);
        if (this.state && this.state.board) {
            var name = this.state.board.name || ("Království osudu #" + newSeed);
            if (this.showPawnToast) {
                this.showPawnToast(this.state.currentPlayerIndex, name, "🎲", "#38bdf8", "rgba(15, 23, 42, 0.96)");
            }
        }
    },

    handleLobbyBoardSelectChange: function (boardCode) {
        if (boardCode === "custom_dynamic") {
            this.openMapStudioModal();
        } else if (boardCode && String(boardCode).indexOf("saved_map_") === 0) {
            var idx = parseInt(String(boardCode).replace("saved_map_", ""), 10);
            this.applySavedFavoriteMap(idx);
        }
    },

    loadBoardTemplatesFromServer: function (cb) {
        var self = this;
        fetch("api.ashx?action=list-board-templates")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && Array.isArray(res.templates)) {
                    if (window.PRS_BoardBuilder && window.PRS_BoardBuilder.registerDbTemplates) {
                        window.PRS_BoardBuilder.registerDbTemplates(res.templates);
                    }
                    self.refreshBoardTemplateSelects();
                }
                if (typeof cb === "function") cb(res);
            })
            .catch(function () {
                if (typeof cb === "function") cb(null);
            });
    },

    refreshBoardTemplateSelects: function () {
        var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
        var t = window.PRS_I18n ? function (k, p, d) { return window.PRS_I18n.t(k, p, d); } : function (k, p, d) { return d; };
        var tilesWord = isEn ? "tiles" : "polí";

        var defaultTemplates = isEn ? [
            { templateCode: "classic_96", name: "Royal Wilderness 96 (Grand Map)", nodeCount: 96 },
            { templateCode: "dragon_4598", name: "Dragon Trail (Medium Map – 64 tiles)", nodeCount: 64 },
            { templateCode: "delta_84", name: "Royal Delta & Islands (Map – 84 tiles)", nodeCount: 84 },
            { templateCode: "compact_48", name: "Knight's Jousting Grounds (Fast Game – 48 tiles)", nodeCount: 48 }
        ] : [
            { templateCode: "classic_96", name: "Královská divočina 96 (Velký plán)", nodeCount: 96 },
            { templateCode: "dragon_4598", name: "Dračí stezka (Střední plán – 64 polí)", nodeCount: 64 },
            { templateCode: "delta_84", name: "Královská delta & Ostrovy (Plán – 84 polí)", nodeCount: 84 },
            { templateCode: "compact_48", name: "Rytířské kolbiště (Rychlá hra – 48 polí)", nodeCount: 48 }
        ];

        var list = (window.PRS_BoardBuilder && window.PRS_BoardBuilder.getActiveTemplatesList) ? window.PRS_BoardBuilder.getActiveTemplatesList() : defaultTemplates;
        var lobbySel = document.getElementById("lobby-board-select");
        var boardSel = document.getElementById("board-template-select");
        var simSel = document.getElementById("sim-board-select");

        var savedMaps = [];
        try { savedMaps = JSON.parse(localStorage.getItem("prs_saved_maps") || "[]"); } catch (e) { savedMaps = []; }

        var self = this;
        function populateSelect(sel, prefix) {
            if (!sel) return;
            var curVal = sel.value || "classic_96";
            var html = "";

            // 1. Předdefinované / systémové plány
            html += '<optgroup label="' + self.escapeHtml(t("ui.board_bar.preset_group", null, "👑 Předdefinované herní plány:")) + '">';
            for (var i = 0; i < list.length; i++) {
                var tmpl = list[i];
                var tName = tmpl.name;
                if (isEn) {
                    if (tmpl.templateCode === "classic_96") tName = "Royal Wilderness 96 (Grand Map)";
                    else if (tmpl.templateCode === "dragon_4598") tName = "Dragon Trail (Medium Map – 64 tiles)";
                    else if (tmpl.templateCode === "delta_84") tName = "Royal Delta & Islands (Map – 84 tiles)";
                    else if (tmpl.templateCode === "compact_48") tName = "Knight's Jousting Grounds (Fast Game – 48 tiles)";
                }
                var label = (prefix ? (prefix + tName) : tName) + (tmpl.nodeCount ? (" (" + tmpl.nodeCount + " " + tilesWord + ")") : "");
                html += '<option value="' + self.escapeHtml(tmpl.templateCode) + '">' + self.escapeHtml(label) + '</option>';
            }
            html += '</optgroup>';

            // 2. Moje uložené dynamické plány z Map Studia
            if (savedMaps.length > 0) {
                html += '<optgroup label="' + self.escapeHtml(t("ui.board_bar.saved_group", null, "⭐ Moje uložené dynamické plány:")) + '">';
                for (var s = 0; s < savedMaps.length; s++) {
                    var sm = savedMaps[s];
                    var smName = sm.name || ((isEn ? "Custom Map #" : "Vlastní plán #") + (sm.seed || s + 1));
                    var smLabel = (prefix ? prefix : "") + "⭐ " + smName + " (" + (sm.nodeCount || 96) + " " + tilesWord + ")";
                    html += '<option value="saved_map_' + s + '">' + self.escapeHtml(smLabel) + '</option>';
                }
                html += '</optgroup>';
            }

            // 3. Tvůrce & Generátor
            html += '<optgroup label="' + self.escapeHtml(t("ui.board_bar.studio_group", null, "🛠️ Tvůrce & Generátor:")) + '">';
            var dynName = t("ui.board_bar.custom_dynamic", null, "🛠️ Vlastní dynamický plán (Map Studio)");
            var rndName = t("ui.board_bar.random_realm", null, "🎲 Náhodné království (Procedurální)");
            html += '<option value="custom_dynamic">' + (prefix ? (prefix + (isEn ? "Custom Dynamic (Map Studio)" : "Vlastní dynamický (Map Studio)")) : dynName) + '</option>';
            html += '<option value="procedural">' + (prefix ? (prefix + (isEn ? "Random Realm" : "Náhodné království")) : rndName) + '</option>';
            html += '</optgroup>';

            sel.innerHTML = html;
            var exists = false;
            for (var j = 0; j < sel.options.length; j++) {
                if (sel.options[j].value === curVal) { exists = true; break; }
            }
            sel.value = exists ? curVal : (sel.options[0] ? sel.options[0].value : "classic_96");
        }

        var mapPfx = t("ui.board_bar.map_prefix", null, "Plán: ");
        populateSelect(lobbySel, "");
        populateSelect(boardSel, mapPfx);
        populateSelect(simSel, "🗺️ " + mapPfx);
    },

    changeBoardTemplateLive: async function (boardCode) {
        if (boardCode === "custom_dynamic") {
            this.openMapStudioModal();
            return;
        }

        if (this.state && this.state.turnNumber > 0) {

            var conf = await KiDeskyDialog.confirm("V rozehrané partii nelze měnit mapu bez restartu hry.\nPřeješ si opravdu ukončit aktuální partii a začít novou hru na zvoleném plánu?", {
                title: "Změna mapy království",
                icon: "🗺️",
                confirmText: "🗺️ Změnit mapu",
                cancelText: "Ponechat stávající"
            });

            if (!conf) {

                var s = document.getElementById("board-template-select");

                if (s && this.state.config && this.state.config.boardTemplate) {

                    s.value = this.state.config.boardTemplate;

                }

                return;

            }

        }

        if (boardCode && String(boardCode).indexOf("saved_map_") === 0) {
            var idx = parseInt(String(boardCode).replace("saved_map_", ""), 10);
            this.applySavedFavoriteMap(idx);
        }

        var lobbySel = document.getElementById("lobby-board-select");

        if (lobbySel) lobbySel.value = boardCode;

        this.startNewGame(false);

    },

    startNewGame: async function (switchToBoard) {

        if (switchToBoard) {
            if (!this._skipNamePromptOnce) {
                var myName = await this.ensurePlayerNameForGame();
                if (!myName) return;
                if (this.lobbyPlayers && this.lobbyPlayers[0]) {
                    this.lobbyPlayers[0].name = myName;
                    this.renderLobbyPlayers();
                }
            }
            this._skipNamePromptOnce = false;
        }

        this.victoryModalShown = false;

        this.closeVictoryModal();

        if (this.autoBotTimer) {

            clearTimeout(this.autoBotTimer);

            this.autoBotTimer = null;

        }

        var boardSel = document.getElementById("lobby-board-select");

        var scenSel = document.getElementById("lobby-game-scenario");

        var diffSel = document.getElementById("lobby-difficulty-mode");

        var timerSel = document.getElementById("lobby-turn-timer");

        var turnTimerSec = timerSel ? parseInt(timerSel.value, 10) : 0;

        var royalSel = document.getElementById("lobby-royal-castle");
        var royalCastle = royalSel ? royalSel.value : (this.selectedRoyalCastle || "auto");
        this.selectedRoyalCastle = royalCastle;

        var boardCode = boardSel ? boardSel.value : "classic_96";

        var scenario = scenSel ? scenSel.value : (this.selectedGameScenario || "classic");

        var difficultyMode = diffSel ? diffSel.value : (this.selectedDifficultyMode || "standard");

        this.selectedGameScenario = scenario;

        this.selectedDifficultyMode = difficultyMode;

        var targetHearts = 30;

        if (scenario === "sprint") targetHearts = 15;

        else if (scenario === "classic") targetHearts = 30;

        else if (scenario === "slayer") targetHearts = 30;

        else if (scenario === "tycoon") targetHearts = 30;

        else if (scenario === "epic") targetHearts = 45;

        if (this.lobbyPlayers && this.lobbyPlayers[0]) {
            this.lobbyPlayers[0].pawnId = this.selectedPawnId || this.lobbyPlayers[0].pawnId || "knight_valiant";
            var myCrest = (typeof this.getPlayerCrest === "function") ? this.getPlayerCrest() : { crestId: "lion", tincture: "gold" };
            this.lobbyPlayers[0].crestId = myCrest.crestId;
            this.lobbyPlayers[0].crestColor = myCrest.tincture;
        }

        var isDynamicOrProc = (boardCode === "procedural" || boardCode === "custom_dynamic" || (boardCode && String(boardCode).indexOf("saved_map_") === 0));
        var activeSeed = isDynamicOrProc ? (this.currentBoardSeed || (this.currentBoardSeed = Math.floor(Math.random() * 899999 + 100000))) : null;
        var customRec = (boardCode === "custom_dynamic" || (boardCode && String(boardCode).indexOf("saved_map_") === 0)) ? this.customBoardRecipe : null;

        this.state = window.PRS_GameEngine.createGame({

            config: this.activeConfig,

            boardCode: boardCode,
            boardSeed: activeSeed,
            seed: activeSeed,
            royalCastle: royalCastle,
            customRecipe: customRec,
            customBoard: (boardCode === "custom_dynamic" || (boardCode && String(boardCode).indexOf("saved_map_") === 0)) ? this._customProceduralBoard : null,

            scenario: scenario,

            difficultyMode: difficultyMode,

            targetHearts: targetHearts,

            players: this.lobbyPlayers

        });

        if (this.state && this.state.config) {
            this.state.config.turnTimerSeconds = turnTimerSec;
        }

        if (this.state) {
            this.state.roomCode = null;
            this.state.sessionGuid = null;
        }
        this.roomCode = null;
        this.sessionGuid = null;

        try {
            localStorage.removeItem("prs_active_online_room");
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, "", window.location.pathname);
            }
        } catch (e) { }

        this.selectedNodeId = 0;

        this.lastKnownTurnNumber = 1;

        if (isDynamicOrProc && typeof fetch === "function") {
            try {
                fetch("api.ashx?action=log-telemetry", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        eventType: "WorldGenerated",
                        turnNumber: 1,
                        message: "Vygenerováno království #" + this.currentBoardSeed + " (" + (this.state.board ? this.state.board.name : "Neznámé") + ")",
                        payloadJson: JSON.stringify({
                            seed: this.currentBoardSeed,
                            scenario: scenario,
                            difficulty: difficultyMode,
                            playerCount: this.state.players.length
                        })
                    })
                }).catch(function () { });
            } catch (e) { }
        }

        this.isBoardStaticDirty = true;

        this.resetZoomAndPan();

        this.renderGameScreen();

        if (switchToBoard) {

            this.hasGameStarted = true;
            this.updateUserUI();
            if (this.saveActiveGameAutosave) this.saveActiveGameAutosave();
            if (this.updateSavedGamesUI) this.updateSavedGamesUI();

            if (window.PRS_Audio) window.PRS_Audio.playNotice();

            this.switchTab("board");

            this.scheduleBotTurnIfNeeded();

            this.startTurnTimer();

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

            // Ignorujeme, pokud uživatel píše do formulářového pole

            var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";

            if (tag === "input" || tag === "textarea" || tag === "select") return;

            // 1. ESC -> Zavření libovolného modálu

            if (e.key === "Escape" || e.code === "Escape") {

                self.closeAllModals();

                return;

            }

            // 1b. T / t -> Otevřít / Zavřít Rychlý tahák do kapsy
            if (e.key === "t" || e.key === "T") {
                var csM = document.getElementById("cheatsheet-modal");
                if (csM && csM.style.display !== "none") {
                    if (self.closeCheatSheetModal) self.closeCheatSheetModal();
                } else {
                    if (self.openCheatSheetModal) self.openCheatSheetModal();
                }
                return;
            }

            // 2. MEZERNÍK -> Primární akce

            if (e.key === " " || e.code === "Space") {

                var duelModal = document.getElementById("quest-duel-modal");

                if (duelModal && duelModal.style.display !== "none") {

                    e.preventDefault();

                    self.executeDuelRoll();

                    return;

                }

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

    },

    // --- FÁZE 4 & 5: MULTIPLAYER, EMOTES, TUTORIÁL & SCÉNÁŘE ---

    myOnlinePlayerIndex: 0,

    onlinePollingTimer: null,

    isEmotePickerOpen: false,

    tutorialCurrentStep: 0,

    selectedGameScenario: "classic",

    _lastSeenEmoteTime: 0,

    handleScenarioChange: function (scenarioKey) {

        this.selectedGameScenario = scenarioKey;

        if (window.PRS_Audio) window.PRS_Audio.playStep();

    },

    handleRoyalCastleChange: function (castleKey) {

        this.selectedRoyalCastle = castleKey;

        if (typeof localStorage !== "undefined") {
            try { localStorage.setItem("kidesky_royal_castle", castleKey); } catch (e) { }
        }

        if (window.PRS_Audio) window.PRS_Audio.playItem();

    },

    handleDifficultyChange: function (mode) {
        this.selectedDifficultyMode = mode;
        var infoEl = document.getElementById("lobby-difficulty-info");
        var btn = document.getElementById("lobby-start-game-btn");
        var mKey = (mode === "easy" || mode === "hard" || mode === "ultimate") ? mode : "standard";
        if (infoEl) {
            infoEl.innerHTML = window.PRS_I18n ? window.PRS_I18n.t("lobby.difficulty_info." + mKey) : "";
        }
        if (btn) {
            btn.innerHTML = window.PRS_I18n ? window.PRS_I18n.t("lobby.start_btn." + mKey) : "🎲 Rozdat 10 000 zl. a zahájit partii!";
        }
        if (window.PRS_Audio) window.PRS_Audio.playStep();
    },

    refreshLobbySettingsSelects: function () {
        if (!window.PRS_I18n) return;
        var t = function (k, d) { return window.PRS_I18n.t(k, null, d); };

        var scenEl = document.getElementById("lobby-game-scenario");
        if (scenEl) {
            var curScen = scenEl.value;
            scenEl.innerHTML = 
                '<option value="sprint">' + t("lobby.scenarios.sprint", "⚡ Rychlovka (15 💖)") + '</option>' +
                '<option value="classic">' + t("lobby.scenarios.classic", "💖 Klasika (30 💖)") + '</option>' +
                '<option value="slayer">' + t("lobby.scenarios.slayer", "🐉 Lovci draků (2 draci)") + '</option>' +
                '<option value="tycoon">' + t("lobby.scenarios.tycoon", "🏰 Magnát (3 města+hrad)") + '</option>' +
                '<option value="epic">' + t("lobby.scenarios.epic", "👑 Epické (45 💖)") + '</option>';
            if (curScen) scenEl.value = curScen;
        }

        var diffEl = document.getElementById("lobby-difficulty-mode");
        if (diffEl) {
            var curDiff = diffEl.value || this.selectedDifficultyMode || "standard";
            diffEl.innerHTML =
                '<option value="easy">' + t("lobby.difficulties.easy", "🌿 Pohádkový (Easy)") + '</option>' +
                '<option value="standard">' + t("lobby.difficulties.standard", "👑 Standardní (50% sazby)") + '</option>' +
                '<option value="hard">' + t("lobby.difficulties.hard", "⚔️ Rytířská výzva (Hard)") + '</option>' +
                '<option value="ultimate">' + t("lobby.difficulties.ultimate", "💀 Na život a smrt (Ultimate)") + '</option>';
            diffEl.value = curDiff;
        }

        var timerEl = document.getElementById("lobby-turn-timer");
        if (timerEl) {
            var curTimer = timerEl.value;
            timerEl.innerHTML =
                '<option value="0">' + t("lobby.timers.unlimited", "♾️ Bez limitu (volné tempo)") + '</option>' +
                '<option value="60">' + t("lobby.timers.fast_60", "⏱️ Rychlý tah (60 vteřin)") + '</option>' +
                '<option value="90">' + t("lobby.timers.standard_90", "⏳ Standardní (90 vteřin)") + '</option>' +
                '<option value="45">' + t("lobby.timers.blitz_45", "⚡ Bleskový (45 vteřin)") + '</option>';
            if (curTimer) timerEl.value = curTimer;
        }

        var castleEl = document.getElementById("lobby-royal-castle");
        if (castleEl) {
            var curCastle = castleEl.value;
            castleEl.innerHTML =
                '<option value="auto">' + t("lobby.castles.auto", "🎲 Pestré (při každé hře jiné)") + '</option>' +
                '<option value="castle_royal">' + t("lobby.castles.castle_royal", "👑 Královský hrad (Sídlo koruny)") + '</option>' +
                '<option value="castle_forest">' + t("lobby.castles.castle_forest", "🌲 Lesní hrad Doubrava") + '</option>' +
                '<option value="castle_ice">' + t("lobby.castles.castle_ice", "❄️ Ledový palác Věčného mrazu") + '</option>' +
                '<option value="castle_lava">' + t("lobby.castles.castle_lava", "🌋 Sopečná pevnost Lávový chřtán") + '</option>' +
                '<option value="castle_crystal">' + t("lobby.castles.castle_crystal", "💎 Křišťálový zámek Ametyst") + '</option>' +
                '<option value="castle_wind">' + t("lobby.castles.castle_wind", "☁️ Větrný vzdušný zámek Boreas") + '</option>' +
                '<option value="castle_water">' + t("lobby.castles.castle_water", "🌊 Vodní citadela Oceán") + '</option>' +
                '<option value="castle_desert">' + t("lobby.castles.castle_desert", "🏜️ Pouštní pískovcový palác") + '</option>' +
                '<option value="castle_swamp">' + t("lobby.castles.castle_swamp", "🌫️ Bažinná tvrz Černá tůň") + '</option>' +
                '<option value="castle_dark">' + t("lobby.castles.castle_dark", "🌑 Temný podzemní hrad Erebus") + '</option>';
            if (curCastle) castleEl.value = curCastle;
        }

        this.handleDifficultyChange(this.selectedDifficultyMode || "standard");
    },

    toggleEmotePicker: function () {

        this.isEmotePickerOpen = !this.isEmotePickerOpen;

        this.renderOnlineRoomBar();

    },

    sendPlayerEmote: function (emoji, label) {

        this.isEmotePickerOpen = false;

        var pIdx = (typeof this.myOnlinePlayerIndex === "number") ? this.myOnlinePlayerIndex : this.state.currentPlayerIndex;

        this.showPawnToast(pIdx, label, emoji, "#fef08a", "rgba(30, 20, 15, 0.96)");

        if (window.PRS_Audio) window.PRS_Audio.playStep();

        if (this.state && this.state.roomCode) {

            this.state.lastEmote = { playerIndex: pIdx, emoji: emoji, label: label, timestamp: Date.now() };

            this.saveSessionAuto();

        }

        this.renderOnlineRoomBar();

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
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            btn.innerHTML = window.PRS_Audio.muted 
                ? (isEn ? "🔇 Sound: Off" : "🔇 Zvuk: Vyp")
                : (isEn ? "🔊 Sound: On" : "🔊 Zvuk: Zap");
        }
    },

    syncSettingsDeviceLabel: function () {
        var btn = document.getElementById("settings-device-btn");
        if (btn && this.deviceProfile) {
            var cur = this.deviceProfile.override;
            var isEn = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en";
            var icon = (this.deviceProfile.device === "mobile") ? "📱" : ((this.deviceProfile.device === "tablet") ? "📟" : "💻");
            var devLabel = (this.deviceProfile.device === "mobile" ? (isEn ? "Mobile" : "Mobil") : (this.deviceProfile.device === "tablet" ? "Tablet" : "PC"));
            var modeAuto = isEn ? "Mode: Auto (" : "Režim: Auto (";
            var modePrefix = isEn ? "Mode: " : "Režim: ";
            btn.textContent = (!cur) ? (icon + " " + modeAuto + devLabel + ")") : (icon + " " + modePrefix + (cur === "mobile" ? (isEn ? "Mobile" : "Mobil") : "PC"));
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

    // ========================================================================
    // KRÁLOVSKÉ MAP STUDIO (DYNAMICKÝ SESTAVOVAČ HERNÍHO PLÁNU 2.0)
    // ========================================================================
    mapStudioSeed: 4598,
    mapStudioOptions: null,
    customBoardRecipe: null,
    _currentMapStudioBoard: null,

    MAP_STUDIO_COUNTERS_DEF: [
        { key: "villages", label: "🏘️ Vesnice (V)", min: 0, max: 24 },
        { key: "towns", label: "🏙️ Města (M)", min: 0, max: 14 },
        { key: "castles", label: "🏯 Hrady (H)", min: 0, max: 9 },
        { key: "jesters", label: "🃏 Kejklíři (KE)", min: 0, max: 12 },
        { key: "buildings", label: "⚒️ Cechovní živnosti", min: 0, max: 12 },
        { key: "questsU1", label: "🐗 Zvěř (U1)", min: 0, max: 16 },
        { key: "questsU2", label: "👹 Monstra (U2)", min: 0, max: 14 },
        { key: "questsU3", label: "🐲 Dračí sluje (U3)", min: 0, max: 10 },
        { key: "masters", label: "🧙‍♂️ Mistři ctností", min: 0, max: 20 },
        { key: "merchants", label: "⚖️ Obchodníci", min: 0, max: 10 },
        { key: "festivals", label: "💖 Slavnosti", min: 0, max: 12 },
        { key: "chances", label: "❓ Pole Náhody (N)", min: 0, max: 24 },
        { key: "taxes", label: "👑 Výběrčí daní", min: 0, max: 8 },
        { key: "prisons", label: "⛓️ Šatlava", min: 0, max: 4 },
        { key: "hospitals", label: "🏥 Lazaret", min: 0, max: 4 },
        { key: "taverns", label: "🍺 Krčma", min: 0, max: 6 }
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

    openMapStudioModal: function (initialSeed, initialRecipe) {
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
        var ribbonColors = {
            1: "#2563eb", 2: "#059669", 3: "#d97706", 4: "#7c3aed",
            5: "#dc2626", 6: "#0891b2", 7: "#ea580c", 8: "#4f46e5",
            9: "#16a34a", 10: "#db2777", 11: "#ca8a04", 12: "#0d9488",
            13: "#9333ea", 14: "#475569"
        };
        var setsCatalog = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ANIMAL_SETS) ? window.KiDeskyMapGenerator.ANIMAL_SETS : [];
        var html = "";
        for (var lvl = 1; lvl <= 14; lvl++) {
            var isSelected = activeLevels.indexOf(lvl) !== -1;
            var sDef = setsCatalog[lvl - 1] || { horse: "Kůň " + lvl, falcon: "Sokol " + lvl, dog: "Pes " + lvl };
            var col = ribbonColors[lvl] || "#2563eb";
            var bg = isSelected ? "rgba(16,185,129,0.18)" : "rgba(15,23,42,0.55)";
            var border = isSelected ? "#34d399" : "rgba(255,255,255,0.12)";
            var textCol = isSelected ? "#f8fafc" : "#94a3b8";

            html += '<div onclick="PRS_App.toggleMapStudioAnimalLevel(' + lvl + ')" style="display:flex; align-items:center; justify-content:space-between; gap:4px; background:' + bg + '; border:1px solid ' + border + '; border-radius:6px; padding:4px 6px; cursor:pointer; user-select:none; transition:all 0.15s;" title="Level ' + lvl + ': ' + this.escapeHtml(sDef.horse + ' • ' + sDef.falcon + ' • ' + sDef.dog) + ' (Cena ' + (lvl * 400) + '/' + (lvl * 500) + '/' + (lvl * 600) + ' zl.)">' +
                '<div style="display:flex; align-items:center; gap:5px; min-width:0;">' +
                    '<span style="width:14px; height:14px; border-radius:50%; background:' + col + '; color:#fff; font-size:0.62rem; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; border:1px solid rgba(255,255,255,0.5);">' + lvl + '</span>' +
                    '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.7rem; color:' + textCol + '; font-weight:' + (isSelected ? '700' : '500') + ';">' +
                        this.escapeHtml(sDef.horse) + ' <span style="opacity:0.7; font-size:0.64rem;">(+S+P)</span>' +
                    '</div>' +
                '</div>' +
                '<span style="font-size:0.74rem; color:' + (isSelected ? '#4ade80' : '#475569') + '; font-weight:bold; flex-shrink:0;">' + (isSelected ? '✓ 3' : '○') + '</span>' +
            '</div>';
        }
        grid.innerHTML = html;

        var sumBadge = document.getElementById("ms-animal-summary-badge");
        if (sumBadge) {
            var isEnA = window.PRS_I18n && window.PRS_I18n.getLanguage() === "en"; sumBadge.textContent = isEnA ? (activeLevels.length + " trios = " + (activeLevels.length * 3) + " tiles") : (activeLevels.length + " trojic = " + (activeLevels.length * 3) + " polí");
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
        if (item.recipe && window.KiDeskyMapGenerator) {
            this.customBoardRecipe = window.KiDeskyMapGenerator.normalizeRecipe(item.recipe, this.mapStudioSeed);
            if (item.name) this.customBoardRecipe.customName = item.name;
            this._currentMapStudioBoard = window.KiDeskyMapGenerator.compileDynamicRecipe(this.customBoardRecipe, this.mapStudioSeed);
            this._customProceduralBoard = this._currentMapStudioBoard;
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
            var conf = await KiDeskyDialog.confirm("Spuštění výpravy na šabloně „" + (item.name || "Vlastní plán") + "“ vyžaduje restart partie.\nPřeješ si začít hrát?", {
                title: "Zahájení výpravy na vybraném plánu",
                icon: "🗺️",
                confirmText: "⚔️ Zahájit hru",
                cancelText: "Zpět"
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

        if (elTitle) elTitle.textContent = board.name || ("Vlastní království #" + this.mapStudioSeed);
        if (elBadge) {
            var aCnt = (this.customBoardRecipe.animalLevels || []).length;
            var shapeObj = (window.KiDeskyMapGenerator && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES && window.KiDeskyMapGenerator.ROUTE_ARCHETYPES[board.routeShape]);
            var shapeName = shapeObj ? shapeObj.name : "Procedurální trasa";
            elBadge.textContent = board.nodes.length + " polí • " + aCnt + " trojic zvířat • " + (this.customBoardRecipe.branches || 0) + " větví • " + shapeName;
        }
        if (elInput && document.activeElement !== elInput) {
            elInput.value = String(this.mapStudioSeed);
        }

        if (elStats) {
            var r = this.customBoardRecipe;
            var brCnt = (board.bridges && board.bridges.length) ? board.bridges.length : 0;
            var tTierLabel = (r.masterTier === 5) ? "RPG I→IV" : ("Stupeň " + (["I", "II", "III", "IV"][(r.masterTier || 2) - 1] || "II"));

            var warnings = [];
            if (r.questsU3 < 2) warnings.push("Pro scénář Lovci draků doporučeno alespoň 2× Drak U3");
            if (r.towns < 3 || r.castles < 1) warnings.push("Pro scénář Magnát doporučeno 3× Město + 1× Hrad");

            var validHtml = warnings.length === 0
                ? ' • <span style="color:#4ade80; font-weight:700;">✓ Všechny scénáře splnitelné</span>'
                : ' • <span style="color:#fbbf24; font-weight:600;" title="' + this.escapeHtml(warnings.join(" | ")) + '">⚠️ ' + this.escapeHtml(warnings[0]) + '</span>';

            elStats.innerHTML =
                "🏯 <strong>" + r.castles + "</strong> Hrady • " +
                "🏙️ <strong>" + r.towns + "</strong> Města • " +
                "🏘️ <strong>" + r.villages + "</strong> Vesnice • " +
                "🃏 <strong>" + r.jesters + "</strong> Kejklíři • " +
                "⚒️ <strong>" + r.buildings + "</strong> Živnosti • " +
                "🐗 <strong>" + r.questsU1 + "</strong> U1 • " +
                "👹 <strong>" + r.questsU2 + "</strong> U2 • " +
                "🐲 <strong>" + r.questsU3 + "</strong> Draci U3 • " +
                "🧙‍♂️ <strong>" + r.masters + "</strong> Mistři (" + tTierLabel + ") • " +
                "💖 <strong>" + r.festivals + "</strong> Slavnosti • " +
                "🌊 <strong>" + brCnt + "</strong> mostů" +
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
            var conf = await KiDeskyDialog.confirm("Spuštění nové výpravy na vlastním dynamickém plánu vyžaduje restart partie.\nPřeješ si začít hrát na plánu „" + (this._currentMapStudioBoard.name || newSeed) + "“ (" + this._currentMapStudioBoard.nodes.length + " polí)?", {
                title: "Zahájení výpravy na vlastním plánu",
                icon: "🗺️",
                confirmText: "⚔️ Zahájit hru na tomto plánu",
                cancelText: "Zpět k partii"
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
