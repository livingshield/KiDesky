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

        // Výchozí záložka při startu: Propagační Brána (welcome), při F5 obnovení uloženého stavu
        var initialTab = "welcome";
        try {
            var sTab = sessionStorage.getItem("prs_active_tab");
            if (sTab && (sTab === "lobby" || (sTab === "board" && this.hasGameStarted) || sTab === "rules" || sTab === "admin")) {
                initialTab = sTab;
            }
        } catch (eInit) { }
        var curSearch = (window.location && window.location.search) ? window.location.search : "";
        if (curSearch.indexOf("room=") !== -1) {
            initialTab = "lobby";
        }
        this.switchTab(initialTab);
        if (initialTab === "lobby" && curSearch.indexOf("room=") !== -1) {
            this.switchGameHallRoom("online");
        }

        // Odložené naplnění skrytých záložek, kontrola ?room= v URL a načtení síťového stavu

        setTimeout(function () {

            self.renderRulesAndCatalog();

            self.renderBalanceStudioInputs();

            self.fetchServerStatusAndSessions();
            if (self.updateSavedGamesUI) self.updateSavedGamesUI();

            self.checkUrlRoomParam();

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
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('./service-worker.js')
                    .then(function (reg) {
                        console.log('[PWA] Service Worker registrován se scope:', reg.scope);
                    })
                    .catch(function (err) {
                        console.warn('[PWA] Registrace Service Workeru selhala:', err);
                    });
            });
        }

        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            window._pwaDeferredPrompt = e;
            var topBtn = document.getElementById('topbar-pwa-install-btn');
            if (topBtn) topBtn.style.display = 'inline-flex';
            var setStatus = document.getElementById('settings-pwa-status');
            if (setStatus) setStatus.textContent = 'Aplikace je připravena k rychlé instalaci jedním kliknutím.';
            var setBtn = document.getElementById('settings-pwa-install-btn');
            if (setBtn) setBtn.style.display = 'inline-flex';
        });

        window.addEventListener('appinstalled', function () {
            window._pwaDeferredPrompt = null;
            var topBtn = document.getElementById('topbar-pwa-install-btn');
            if (topBtn) topBtn.style.display = 'none';
            var setStatus = document.getElementById('settings-pwa-status');
            if (setStatus) setStatus.innerHTML = '✅ <strong style="color:#4ade80;">Aplikace je úspěšně nainstalována na této ploše!</strong>';
            var setBtn = document.getElementById('settings-pwa-install-btn');
            if (setBtn) setBtn.style.display = 'none';
            if (self.showToast) {
                self.showToast('📲 KiDesky bylo úspěšně nainstalováno na tvou plochu!', 'success');
            }
        });
    },

    promptPwaInstall: function () {
        if (!window._pwaDeferredPrompt) {
            if (this.showToast) {
                this.showToast('ℹ️ Pro instalaci na mobilu použij volbu „Přidat na plochu“ v menu prohlížeče.', 'notice');
            }
            return;
        }
        window._pwaDeferredPrompt.prompt();
        window._pwaDeferredPrompt.userChoice.then(function (choiceResult) {
            if (choiceResult && choiceResult.outcome === 'accepted') {
                console.log('[PWA] Uživatel potvrdil instalaci aplikace.');
            }
            window._pwaDeferredPrompt = null;
        });
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

        if (w >= 900 && savedOverride === "mobile") {

            try { localStorage.removeItem("kidesky_device_override"); } catch (e) { }

            savedOverride = null;

        }

        var device = "desktop";

        if (savedOverride === "mobile" || savedOverride === "desktop") {

            device = savedOverride;

        } else {

            if (w < 768) {

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

    },

    closeMusicPopup: function () {

        var modal = document.getElementById("prs-music-modal");

        if (modal) modal.style.display = "none";

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
            var badgeText = (i === 0) ? "🎬 Příběhové intro" : "⚔️ Hratelnost & Pravidla";

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
                html.push('    <a href="https://www.youtube.com/watch?v=' + ytid + '" target="_blank" rel="noopener noreferrer" class="lp-video-btn-action" title="Přehrát video na YouTube">');
                html.push('      <span>📺 Přehrát na YouTube</span>');
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
        fetch("api.ashx?action=get-announcement")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.announcement && res.announcement.message) {
                    var banner = document.getElementById("topbar-announcement-banner");
                    var txt = document.getElementById("announcement-message-text");
                    var lnk = document.getElementById("announcement-link-btn");
                    if (banner && txt) {
                        txt.textContent = res.announcement.message;
                        if (res.announcement.linkUrl) {
                            lnk.href = res.announcement.linkUrl;
                            lnk.style.display = "inline-flex";
                        } else {
                            lnk.style.display = "none";
                        }
                        banner.dataset.hasMessage = "true";
                        // Královský posel nesmí být ve hře vůbec
                        if (self.activeTab !== "board") {
                            banner.style.display = "flex";
                        } else {
                            banner.style.display = "none";
                        }
                    }
                }
            })
            .catch(function () { });
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
            { rx: 0.12, ry: 0.58, label: "Start", color: "#10b981", icon: "🚩", src: "assets/tiles/start.png", story: "🚩 1. Startovní rozcestí: Rytíř vyráží s 10 000 zlaťáky do světa" },
            { rx: 0.31, ry: 0.40, label: "Chov koní", color: "#f59e0b", icon: "🐎", src: "assets/tiles/kun.jpg", story: "🐎 2. Chov koní & stáje: Budování panství, zvířata a výběr nájmů" },
            { rx: 0.50, ry: 0.58, label: "Hrad & Turnaj", color: "#0ea5e9", icon: "🏰", src: "assets/tiles/castle.png", story: "🏰 3. Královský turnaj: Klání mistrů ve 4 královských ctnostech" },
            { rx: 0.69, ry: 0.40, label: "Dračí sluj", color: "#ef4444", icon: "🐉", src: "assets/tiles/u3_drak.jpg", story: "🐉 4. Dračí sluj: Epický souboj s ohnivým drakem o slavný poklad" },
            { rx: 0.88, ry: 0.58, label: "Slavnosti 💖", color: "#ec4899", icon: "💖", src: "assets/tiles/festival.jpg", story: "💖 5. Královské slavnosti: Zisk 30 Princezniných srdcí a vítězství!" }
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
                    ctx.fillText(tile.label, tx, labelY + labelH * 0.5);
                    ctx.restore();
                }

                // --- 6. Nová 2.5D figurka rytíře plynule putujícího po trase ---
                var questProgress = (t * 0.42) % segCount;
                var currSeg = Math.floor(questProgress);
                var segFrac = questProgress - currSeg;

                if (currSeg !== lastStoryIdx && questTiles[currSeg]) {
                    lastStoryIdx = currSeg;
                    if (tickerEl) {
                        tickerEl.textContent = questTiles[currSeg].story;
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
                activeRound.textContent = "Kolo " + (this.state.roundNumber || 1) + " • " + (this.state.players ? this.state.players.length : 4) + " Rytířů";
            }
        }

        // 6. Tlačítko pro založení online místnosti (Host se může připojit, ale nemůže ji založit)
        var createRoomBtn = document.getElementById("btn-create-online-room");
        if (createRoomBtn) {
            if (isGuest) {
                createRoomBtn.innerHTML = "🔒 Založit novou Online místnost (vyžaduje přihlášení)";
                createRoomBtn.style.borderColor = "rgba(212,175,55,0.45)";
                createRoomBtn.style.color = "var(--gold-light)";
                createRoomBtn.title = "Jako Host se můžeš připojit ke stolu kamaráda přes 6místný kód. Pro založení nového stolu se přihlas.";
            } else {
                createRoomBtn.innerHTML = "☁️ Založit novou Online místnost a získat kód pro přátele";
                createRoomBtn.style.borderColor = "#38bdf8";
                createRoomBtn.style.color = "#bae6fd";
                createRoomBtn.title = "Založí novou online hru a vygeneruje 6místný kód pro přátele";
            }
        }
    },

    logoutUser: function () {
        this.setGuestMode();
        if (window.PRS_Audio && window.PRS_Audio.playNotice) window.PRS_Audio.playNotice();
        this.closeAuthModal();
        this.updateUserUI();
        alert("Byl jsi úspěšně odhlášen. Nyní pokračuješ volně v režimu Hosta.");
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

            var placeholder = (i === 0) ? ' placeholder="Tvoje rytířská přezdívka (např. Sir Gawain)" title="Zadej svou herní přezdívku (jméno rytíře u stolu)"' : ' placeholder="Jméno hráče / PC bota"';

            html += '<div class="lobby-player-row">' +

                '<button type="button" class="lobby-pawn-btn" onclick="PRS_App.openPawnShopModal(' + i + ')" title="Figurka: ' + this.escapeHtml(pawnTitle) + ' (klepni pro změnu figurky)" style="width:36px; height:36px; border-radius:50%; padding:0; background:radial-gradient(circle, ' + col.hex + ' 0%, #1a0f0a 85%); border:2px solid #ffd86b; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; position:relative; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.65);">' +
                '  <img src="' + pawnImg + '" alt="" style="width:105%; height:105%; object-fit:contain; border-radius:50%;"/>' +
                '  <span style="position:absolute; bottom:-3px; right:-3px; background:#1e130c; border:1px solid #ffd86b; border-radius:50%; width:14px; height:14px; font-size:8px; display:flex; align-items:center; justify-content:center; color:#ffd86b;">🎭</span>' +
                '</button>' +

                '<input type="text" class="prs-input" value="' + this.escapeHtml(p.name) + '"' + placeholder + ' oninput="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" onchange="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" />' +

                '<select class="prs-select" onchange="PRS_App.updateLobbyPlayerType(' + i + ', this.value)">' +

                '  <option value="Human" ' + (p.type === "Human" ? "selected" : "") + '>👤 Člověk (u stolu)</option>' +

                '  <option value="Bot_Aggressive" ' + (p.type === "Bot_Aggressive" ? "selected" : "") + '>⚔️ PC Válečník (Lovec draků)</option>' +

                '  <option value="Bot_Breeder" ' + (p.type === "Bot_Breeder" ? "selected" : "") + '>🐎 PC Chovatel (Sady zvířat)</option>' +

                '  <option value="Bot_Noble" ' + (p.type === "Bot_Noble" ? "selected" : "") + '>👑 PC Dvořan (Diplomacie & Ples)</option>' +

                '  <option value="Bot_Balanced" ' + (p.type === "Bot_Balanced" ? "selected" : "") + '>⚖️ PC Rytíř (Vyvážený)</option>' +

                '  <option value="Bot_Easy" ' + (p.type === "Bot_Easy" ? "selected" : "") + '>🌱 PC Panoš (Opatrný)</option>' +

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
                    '    <div class="ach-badge-status ' + (isUnl ? 'unlocked-tag' : 'locked-tag') + '">' + (isUnl ? '✨ Odemčeno' : '🔒 Zamčeno') + '</div>' +
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
        el.innerHTML = '<div class="knight-emotes-bar">' +
            '  <span class="emotes-label">💬 Reakce:</span>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'⚔️\', \'Do zbraně!\')" title="Do zbraně!">⚔️</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'👑\', \'Sláva králi!\')" title="Sláva králi!">👑</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🛡️\', \'Držím stráž!\')" title="Držím stráž!">🛡️</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🍷\', \'Na zdraví!\')" title="Na zdraví!">🍷</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'🐉\', \'Pozor na draka!\')" title="Pozor na draka!">🐉</button>' +
            '  <button type="button" class="emote-btn" onclick="PRS_App.sendKnightEmote(\'👏\', \'Skvělý tah!\')" title="Skvělý tah!">👏</button>' +
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

    changeBoardTemplateLive: async function (boardCode) {

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
        }

        this.state = window.PRS_GameEngine.createGame({

            config: this.activeConfig,

            boardCode: boardCode,
            boardSeed: (boardCode === "procedural" ? (this.currentBoardSeed || (this.currentBoardSeed = Math.floor(Math.random() * 899999 + 100000))) : null),
            seed: (boardCode === "procedural" ? (this.currentBoardSeed || (this.currentBoardSeed = Math.floor(Math.random() * 899999 + 100000))) : null),

            scenario: scenario,

            difficultyMode: difficultyMode,

            targetHearts: targetHearts,

            players: this.lobbyPlayers

        });

        if (this.state && this.state.config) {
            this.state.config.turnTimerSeconds = turnTimerSec;
        }

        try {
            localStorage.removeItem("prs_active_online_room");
            if (window.history && window.history.replaceState && !window.location.search.includes("room=")) {
                window.history.replaceState(null, "", window.location.pathname);
            }
        } catch (e) { }

        this.selectedNodeId = 0;

        this.lastKnownTurnNumber = 1;

        if (boardCode === "procedural" && typeof fetch === "function") {
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

            bSel.title = inGame ? "Plán nelze měnit v průběhu rozehrané partie" : "Přepnout rozložení plánu";

            if (this.state.config && this.state.config.boardTemplate) {

                bSel.value = this.state.config.boardTemplate;

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

    handleDifficultyChange: function (mode) {

        this.selectedDifficultyMode = mode;

        var infoEl = document.getElementById("lobby-difficulty-info");

        var btn = document.getElementById("lobby-start-game-btn");

        var text = "";

        if (mode === "easy") {

            text = "🌿 <strong>Pohádkový mód (Easy):</strong> 12 000 zl. do startu • žold 3 500 / 5 500 zl. • 70 % pozitivních karet • mírumilovný režim bez útočných duelů a intrik • výkup bance za 75 % • královská milost při bankrotu.";

            if (btn) btn.innerHTML = "🎲 Rozdat 12 000 zl. a zahájit partii! (Pohádkový)";

        } else if (mode === "hard") {

            text = "⚔️ <strong>Rytířská výzva (Hard):</strong> 8 000 zl. do startu • žold 2 500 / 4 500 zl. • tvrdší karty osudu • plné sazby duelů i ztráta srdcí (-0,5 💖) • výkup bance za 50 % • královská milost při bankrotu.";

            if (btn) btn.innerHTML = "🎲 Rozdat 8 000 zl. a zahájit partii! (Rytířská výzva)";

        } else if (mode === "ultimate") {

            text = "💀 <strong>Na život a smrt (Ultimate):</strong> 8 000 zl. do startu • žold 2 500 / 4 000 zl. • karty 35 % poz. / 35 % neg. • duely posílají poraženého do špitálu! • špitál i kauce 2× dražší (1 600 zl. / 2 000 zl.) • <strong>ELIMINACE při bankrotu!</strong>";

            if (btn) btn.innerHTML = "🎲 Rozdat 8 000 zl. a zahájit partii! (Na život a smrt 💀)";

        } else {

            text = "👑 <strong>Standardní mód:</strong> 10 000 zl. do startu • žold 3 000 / 5 000 zl. • vyvážené karty Náhody • 50% sazby duelů a intrik • královská milost při dluhu.";

            if (btn) btn.innerHTML = "🎲 Rozdat 10 000 zl. a zahájit partii!";

        }

        if (infoEl) infoEl.innerHTML = text;

        if (window.PRS_Audio) window.PRS_Audio.playStep();

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

            btn.innerHTML = window.PRS_Audio.muted ? "🔇 Zvuk: Vyp" : "🔊 Zvuk: Zap";

        }

    },

    syncSettingsDeviceLabel: function () {

        var btn = document.getElementById("settings-device-btn");

        if (btn && this.deviceProfile) {

            var cur = this.deviceProfile.override;

            var icon = (this.deviceProfile.device === "mobile") ? "📱" : ((this.deviceProfile.device === "tablet") ? "📟" : "💻");

            var devLabel = (this.deviceProfile.device === "mobile" ? "Mobil" : (this.deviceProfile.device === "tablet" ? "Tablet" : "PC"));

            btn.textContent = (!cur) ? (icon + " Režim: Auto (" + devLabel + ")") : (icon + " Režim: " + (cur === "mobile" ? "Mobil" : "PC"));

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
    // KRÁLOVSKÉ MAP STUDIO (GENERÁTOR MAP 2.0)
    // ========================================================================
    mapStudioSeed: 4598,
    _currentMapStudioBoard: null,

    openMapStudioModal: function (initialSeed) {
        this.mapStudioSeed = initialSeed || this.currentBoardSeed || Math.floor(Math.random() * 899999 + 100000);
        var modal = document.getElementById("map-studio-modal");
        if (modal) {
            modal.style.display = "flex";
            this.updateMapStudioPreview();
        }
    },

    closeMapStudioModal: function () {
        var modal = document.getElementById("map-studio-modal");
        if (modal) modal.style.display = "none";
    },

    applyMapStudioPreset: function (presetKey) {
        if (!window.KiDeskyMapGenerator || !window.KiDeskyMapGenerator.PRESETS) return;
        var p = window.KiDeskyMapGenerator.PRESETS[presetKey];
        if (!p) return;

        var elNodes = document.getElementById("ms-node-count");
        var elBranches = document.getElementById("ms-branches");
        var elTier = document.getElementById("ms-master-tier");
        var elAnimals = document.getElementById("ms-animal-sets");
        var elRiver = document.getElementById("ms-river-mode");

        if (elNodes) elNodes.value = String(p.nodeCount);
        if (elBranches) elBranches.value = String(p.branches);
        if (elTier) elTier.value = String(p.masterTier);
        if (elAnimals) elAnimals.value = String(p.animalSetCount);
        if (elRiver) elRiver.value = p.riverMode;

        this.updateMapStudioPreview();
    },

    rerollMapStudioSeed: function () {
        this.mapStudioSeed = Math.floor(Math.random() * 899999 + 100000);
        this.updateMapStudioPreview();
    },

    copyMapStudioSeed: function () {
        var inp = document.getElementById("ms-seed-input");
        if (!inp || !inp.value) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inp.value).then(function () {
                KiDeskyToast.show("📋 Kód mapy zkopírován do schránky!", "info");
            });
        } else {
            inp.select();
            document.execCommand("copy");
            KiDeskyToast.show("📋 Kód mapy zkopírován do schránky!", "info");
        }
    },

    loadMapStudioFromInputSeed: function () {
        var inp = document.getElementById("ms-seed-input");
        if (!inp || !inp.value) return;
        if (!window.KiDeskyMapGenerator || !window.KiDeskyMapGenerator.parseSeedCode) return;

        var parsed = window.KiDeskyMapGenerator.parseSeedCode(inp.value);
        if (parsed) {
            if (parsed.seed) this.mapStudioSeed = parsed.seed;
            var elNodes = document.getElementById("ms-node-count");
            var elBranches = document.getElementById("ms-branches");
            var elTier = document.getElementById("ms-master-tier");

            if (elNodes && parsed.nodeCount) elNodes.value = String(parsed.nodeCount);
            if (elBranches && parsed.branches) elBranches.value = String(parsed.branches);
            if (elTier && parsed.masterTier) elTier.value = String(parsed.masterTier);

            this.updateMapStudioPreview();
            KiDeskyToast.show("🗺️ Kód mapy načten a aplikován!", "good");
        } else {
            KiDeskyToast.show("⚠️ Neplatný formát kódu mapy.", "warning");
        }
    },

    updateMapStudioPreview: function () {
        if (!window.KiDeskyMapGenerator) return;

        var elNodes = document.getElementById("ms-node-count");
        var elBranches = document.getElementById("ms-branches");
        var elTier = document.getElementById("ms-master-tier");
        var elAnimals = document.getElementById("ms-animal-sets");
        var elRiver = document.getElementById("ms-river-mode");

        var options = {
            nodeCount: elNodes ? parseInt(elNodes.value, 10) : 78,
            branches: elBranches ? parseInt(elBranches.value, 10) : 3,
            masterTier: elTier ? parseInt(elTier.value, 10) : 2,
            animalSetCount: elAnimals ? parseInt(elAnimals.value, 10) : 6,
            riverMode: elRiver ? elRiver.value : "single",
            seed: this.mapStudioSeed
        };

        var board = window.KiDeskyMapGenerator.generate(this.mapStudioSeed, options);
        this._currentMapStudioBoard = board;

        // Vykreslení minináhledu
        var container = document.getElementById("ms-preview-container");
        if (container && window.KiDeskyMapGenerator.renderMiniPreviewSVG) {
            container.innerHTML = window.KiDeskyMapGenerator.renderMiniPreviewSVG(board, 560, 344);
        }

        // Titulek a odznaky
        var elTitle = document.getElementById("ms-preview-title");
        var elBadge = document.getElementById("ms-preview-badge");
        var elStats = document.getElementById("ms-preview-stats");
        var elInput = document.getElementById("ms-seed-input");

        if (elTitle) elTitle.textContent = board.name || ("Království osudu #" + this.mapStudioSeed);
        if (elBadge) elBadge.textContent = board.nodes.length + " polí • " + options.branches + " větve";
        if (elInput) elInput.value = board.seedCode || window.KiDeskyMapGenerator.formatSeedCode(this.mapStudioSeed, options);

        if (elStats) {
            var brCnt = (board.bridges && board.bridges.length) ? board.bridges.length : 0;
            var tTierRoman = ["I", "II", "III", "IV"][options.masterTier - 1] || "II";
            elStats.textContent = "🏰 2 Tematické hrady • 🏙️ 4 Města • 🐎 " + options.animalSetCount + " chovných sad • 🌊 " + brCnt + " mostů přes řeku • ⚔️ Mistři Stupeň " + tTierRoman;
        }
    },

    applyMapStudioBoardAndStart: async function () {
        if (!this._currentMapStudioBoard) return;
        this.closeMapStudioModal();

        var newSeed = this.mapStudioSeed;
        this.currentBoardSeed = newSeed;

        if (this.state && this.state.turnNumber > 0) {
            var conf = await KiDeskyDialog.confirm("Spuštění nové výpravy v Map Studiu vyžaduje restart partii.\nPřeješ si začít hrát na mapě " + (this._currentMapStudioBoard.seedCode || newSeed) + "?", {
                title: "Zahájení výpravy v Map Studiu",
                icon: "🗺️",
                confirmText: "⚔️ Zahájit hru na mapě",
                cancelText: "Zpět k partii"
            });
            if (!conf) return;
        }

        // Nastavíme vygenerovaný plán jako aktivní desku
        this._customProceduralBoard = this._currentMapStudioBoard;
        var bSel = document.getElementById("board-template-select");
        if (bSel) bSel.value = "procedural";
        var lobbySel = document.getElementById("lobby-board-select");
        if (lobbySel) lobbySel.value = "procedural";

        this.startNewGame(true);
        if (this.showPawnToast) {
            this.showPawnToast(this.state.currentPlayerIndex, "Vítej v království " + (this._currentMapStudioBoard.seedCode || newSeed), "🗺️", "#a855f7", "rgba(15, 23, 42, 0.96)");
        }
    },

    handleMasterDuel: function () {
        if (!this.state || !window.PRS_GameEngine || !window.PRS_GameEngine.resolveMasterDuel) return;
        window.PRS_GameEngine.resolveMasterDuel(this.state, this.state.currentPlayerIndex);
        if (this.renderAll) this.renderAll();
        if (this.renderTurnActionPanel) this.renderTurnActionPanel();
    }
};
