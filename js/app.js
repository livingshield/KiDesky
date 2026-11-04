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

    lobbyPlayers: [

        { name: "Host (Ty)", type: "Human" },

        { name: "Černý Baron (PC)", type: "Bot_Aggressive" },

        { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder" },

        { name: "Kněžna Eliška (PC)", type: "Bot_Noble" }

    ],
    getDefaultPlayerName: function () {

        // 1. Zkontrolujeme ručně uloženou rytířskou přezdívku z dřívějších her

        try {

            var savedNick = (localStorage.getItem("prs_player_nickname") || "").trim();

            if (savedNick && savedNick.toLowerCase() !== "host" && savedNick.toLowerCase() !== "admin") {

                return savedNick.replace(/\s*\(Ty\)$/i, "") + " (Ty)";

            }

        } catch (e) { }

        // 2. Přihlášený uživatel (DisplayName / hezky upravený login)

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

        // 3. Výchozí rytířské jméno pro nového hráče

        return "Lord Filip (Ty)";

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

        minScale: 0.65,

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

        this.loadActiveHeroVideo();

        this.loadAnnouncement();

        this.startNewGame(false);

        this.startOnlinePollingLoop();

        // Odložené naplnění skrytých záložek, kontrola ?room= v URL a načtení síťového stavu

        setTimeout(function () {

            self.renderRulesAndCatalog();

            self.renderBalanceStudioInputs();

            self.fetchServerStatusAndSessions();

            self.checkUrlRoomParam();

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

            var icon = tr.isProcedural ? "🪕" : (tr.isCustom ? "📁" : "🎵");

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

        this.activeTab = tabId;

        var tabs = ["lobby", "board", "rules", "balance", "admin"];

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

        // Přepnutí levého horního tlačítka: na Landing Page ukazuje "← Zpět na KikiAI", jinde "🏰 ← Zpět na Landing Page"

        var backKikiEl = document.getElementById("topbar-back-kikiai");

        var backLandEl = document.getElementById("topbar-back-landing");

        if (backKikiEl) backKikiEl.style.display = (tabId === "lobby") ? "inline-block" : "none";

        if (backLandEl) backLandEl.style.display = (tabId === "lobby") ? "none" : "inline-block";

        // Pokud odcházíme z Landing Page, pozastavíme případné promo video

        if (tabId !== "lobby") {

            var vid = document.getElementById("lp-promo-video");

            if (vid && !vid.paused) {

                try { vid.pause(); } catch (e) { }

            }

        } else {

            this.fetchServerStatusAndSessions();

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

    currentHeroVideo: null,

    getYoutubeEmbedUrl: function (url) {
        if (!url) return "";
        var match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
        if (match && match[1]) {
            return "https://www.youtube-nocookie.com/embed/" + match[1] + "?autoplay=1&rel=0";
        }
        return url;
    },

    loadActiveHeroVideo: function () {
        var self = this;
        fetch("api.ashx?action=hero-video")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res && res.ok && res.hero) {
                    self.currentHeroVideo = res.hero;
                    var btnVideo = document.getElementById("lp-tab-btn-video");
                    if (btnVideo && res.hero.title) {
                        btnVideo.innerHTML = "🎬 " + self.escapeHtml(res.hero.title);
                    }
                    var videoEl = document.getElementById("lp-promo-video");
                    if (videoEl && res.hero.videoType === "mp4" && res.hero.url) {
                        videoEl.src = res.hero.url;
                        if (res.hero.posterUrl) videoEl.poster = res.hero.posterUrl;
                    }
                }
            })
            .catch(function () { });
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
                        banner.style.display = "flex";
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

            var videoTitle = (this.currentHeroVideo && this.currentHeroVideo.title) ? this.currentHeroVideo.title : "Královská upoutávka";
            if (statusLbl) statusLbl.textContent = "🎬 " + videoTitle;

            if (this.currentHeroVideo && this.currentHeroVideo.videoType === "youtube") {
                if (vid) { vid.style.display = "none"; try { vid.pause(); } catch (e) { } }
                if (yt) {
                    yt.style.display = "block";
                    var embedUrl = this.getYoutubeEmbedUrl(this.currentHeroVideo.url);
                    if (yt.src !== embedUrl) yt.src = embedUrl;
                }
            } else {
                if (yt) { yt.style.display = "none"; yt.src = ""; }
                if (vid) {
                    vid.style.display = "block";
                    if (this.currentHeroVideo && this.currentHeroVideo.url && vid.currentSrc !== this.currentHeroVideo.url) {
                        vid.src = this.currentHeroVideo.url;
                    }
                    try { vid.play(); } catch (e) { }
                }
            }
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
            this.initLandingLiveCanvas();
        }
    },

    initLandingLiveCanvas: function () {
        var canvas = document.getElementById("lp-live-preview-canvas");
        if (!canvas || !canvas.getContext) return;
        if (this._landingCanvasRunning) return;
        this._landingCanvasRunning = true;

        var ctx = canvas.getContext("2d");

        // Klíčové textury pro živou animaci s bezpečnými zálohami
        var bgImg = new Image();
        bgImg.src = "assets/board/parchment_board_bg.jpg";

        var castleImg = new Image();
        castleImg.src = "assets/landmarks/royal_castle.png";

        var tileSources = [
            { rx: 0.16, ry: 0.62, label: "Chov Koní", color: "#f59e0b", icon: "🐎", src: "assets/tiles/kun.jpg" },
            { rx: 0.33, ry: 0.38, label: "Vesnice", color: "#22c55e", icon: "🏡", src: "assets/tiles/village.jpg" },
            { rx: 0.50, ry: 0.60, label: "Krčma", color: "#fbbf24", icon: "🍺", src: "assets/tiles/tavern.jpg" },
            { rx: 0.68, ry: 0.35, label: "Hrad", color: "#38bdf8", icon: "🏰", src: "assets/tiles/castle.png" },
            { rx: 0.85, ry: 0.62, label: "Slavnosti 💖", color: "#ec4899", icon: "💖", src: "assets/tiles/festival.jpg" }
        ];

        for (var i = 0; i < tileSources.length; i++) {
            var im = new Image();
            im.src = tileSources[i].src;
            tileSources[i].img = im;
        }

        var t = 0;
        var sparks = [];
        for (var s = 0; s < 28; s++) {
            sparks.push({
                x: Math.random() * 640,
                y: Math.random() * 360,
                r: 1.2 + Math.random() * 2.2,
                vy: -0.35 - Math.random() * 0.5,
                vx: (Math.random() - 0.5) * 0.4,
                alpha: 0.3 + Math.random() * 0.7
            });
        }

        var renderLoop = function () {
            try {
                t += 0.016;

                // Automatické dynamické škálování plátna podle jeho reálného vykreslení v DOMu
                var rect = canvas.getBoundingClientRect();
                var dw = Math.round(rect.width) || 640;
                var dh = Math.round(rect.height) || 360;
                if (canvas.width !== dw || canvas.height !== dh) {
                    canvas.width = dw;
                    canvas.height = dh;
                }
                var w = canvas.width;
                var h = canvas.height;

                ctx.clearRect(0, 0, w, h);

                // 1. Teplé královské pergamenové pozadí
                var bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
                bgGrad.addColorStop(0, "#4a301a");
                bgGrad.addColorStop(0.6, "#2c1a0e");
                bgGrad.addColorStop(1, "#140c06");
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, w, h);

                // Kreslení pergamenu s jemným posunem kamery (pokud je načten)
                if (bgImg.complete && bgImg.naturalWidth > 0) {
                    try {
                        var panX = Math.sin(t * 0.35) * 16;
                        var panY = Math.cos(t * 0.25) * 9;
                        ctx.save();
                        ctx.globalAlpha = 0.65;
                        ctx.drawImage(bgImg, -25 + panX, -15 + panY, w + 50, h + 30);
                        ctx.restore();
                    } catch (e) { }
                }

                // Silueta královského hradu na pozadí
                if (castleImg.complete && castleImg.naturalWidth > 0) {
                    try {
                        ctx.save();
                        ctx.globalAlpha = 0.25;
                        ctx.drawImage(castleImg, w * 0.5 - 80, h * 0.08, 160, 160);
                        ctx.restore();
                    } catch (e) { }
                }

                // Zlatá královská cesta propojující medailonky
                ctx.save();
                ctx.beginPath();
                for (var i = 0; i < tileSources.length; i++) {
                    var nd = tileSources[i];
                    var nx = nd.rx * w;
                    var ny = nd.ry * h;
                    if (i === 0) ctx.moveTo(nx, ny);
                    else ctx.lineTo(nx, ny);
                }
                ctx.strokeStyle = "rgba(212, 175, 55, 0.45)";
                ctx.lineWidth = 7;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();

                ctx.strokeStyle = "rgba(254, 240, 138, 0.9)";
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = -t * 26;
                ctx.stroke();
                ctx.restore();

                // 3. Kruhové medailonky políček
                var baseRad = Math.min(w, h) * 0.10;
                for (var j = 0; j < tileSources.length; j++) {
                    var tile = tileSources[j];
                    var tx = tile.rx * w;
                    var ty = tile.ry * h;
                    var pulse = 1 + Math.sin(t * 2.2 + j) * 0.04;
                    var rad = baseRad * pulse;

                    // Záře pod medailonkem
                    var glow = ctx.createRadialGradient(tx, ty, rad * 0.5, tx, ty, rad * 1.4);
                    glow.addColorStop(0, tile.color);
                    glow.addColorStop(1, "rgba(0,0,0,0)");
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(tx, ty, rad * 1.35, 0, Math.PI * 2);
                    ctx.fill();

                    // Pozadí a obrázek medailonku
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(tx, ty, rad, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    ctx.fillStyle = "#2b1d10";
                    ctx.fillRect(tx - rad, ty - rad, rad * 2, rad * 2);

                    var drawn = false;
                    if (tile.img && tile.img.complete && tile.img.naturalWidth > 0) {
                        try {
                            ctx.drawImage(tile.img, tx - rad, ty - rad, rad * 2, rad * 2);
                            drawn = true;
                        } catch (e) { }
                    }
                    if (!drawn) {
                        // Heraldická ikona jako záloha
                        ctx.fillStyle = "#fef08a";
                        ctx.font = "bold " + Math.round(rad * 0.9) + "px sans-serif";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillText(tile.icon, tx, ty);
                    }
                    ctx.restore();

                    // Zlatá obroučka
                    ctx.beginPath();
                    ctx.arc(tx, ty, rad, 0, Math.PI * 2);
                    ctx.strokeStyle = tile.color;
                    ctx.lineWidth = 3.5;
                    ctx.stroke();

                    // Popisek pod medailonkem
                    var boxW = Math.max(90, rad * 2.2);
                    var boxH = 19;
                    ctx.fillStyle = "rgba(15, 10, 6, 0.88)";
                    ctx.fillRect(tx - boxW * 0.5, ty + rad + 4, boxW, boxH);
                    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(tx - boxW * 0.5, ty + rad + 4, boxW, boxH);

                    ctx.fillStyle = "#fef08a";
                    ctx.font = "bold 11px Outfit, sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "alphabetic";
                    ctx.fillText(tile.label, tx, ty + rad + 17);
                }

                // 4. Animovaný žeton rytíře putujícího po královské cestě
                var segCount = tileSources.length - 1;
                var prog = (t * 0.38) % segCount;
                var segIdx = Math.floor(prog);
                var segFrac = prog - segIdx;
                var pA = tileSources[segIdx] || tileSources[0];
                var pB = tileSources[segIdx + 1] || tileSources[segCount];
                var ax = pA.rx * w;
                var ay = pA.ry * h;
                var bx = pB.rx * w;
                var by = pB.ry * h;
                var kx = ax + (bx - ax) * segFrac;
                var ky = ay + (by - ay) * segFrac - Math.abs(Math.sin(segFrac * Math.PI)) * 22;

                // Žeton rytíře
                ctx.beginPath();
                ctx.arc(kx, ky, 15, 0, Math.PI * 2);
                ctx.fillStyle = "#dc2626";
                ctx.fill();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#fef08a";
                ctx.stroke();

                ctx.fillStyle = "#fff";
                ctx.font = "14px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("⚔️", kx, ky);

                // 5. Zlaté jiskry a srdíčka
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
                    ctx.fillStyle = "rgba(250, 204, 21, " + sp.alpha + ")";
                    ctx.fill();
                }
            } catch (frameErr) {
                console.warn("Live canvas frame err:", frameErr);
            }

            requestAnimationFrame(renderLoop);
        };

        requestAnimationFrame(renderLoop);
    },

    quickStartSoloGame: function (preset) {

        var myName = this.getDefaultPlayerName();

        this.lobbyPlayers = [

            { name: myName, type: "Human" },

            { name: "Černý Baron (PC)", type: "Bot_Aggressive" },

            { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder" },

            { name: "Kněžna Eliška (PC)", type: "Bot_Noble" }

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

        this.startNewGame(true);

    },

    createOnlineMultiplayerRoom: function () {

        var self = this;

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

                    self.fetchServerStatusAndSessions();

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

                }

            }

        } catch (e) { }

        this.updateUserUI();

    },

    updateUserUI: function () {

        var badgeEl = document.getElementById("user-status-badge");

        var isGuest = (!this.currentUser || this.currentUser.role === "Guest");

        var savedNick = "";

        try { savedNick = (localStorage.getItem("prs_player_nickname") || "").trim(); } catch (e) { }

        var rawName = isGuest ? "Host" : (savedNick || this.currentUser.displayName || this.currentUser.username || "Hráč");

        if (rawName && rawName.indexOf("@") !== -1) {

            rawName = rawName.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); }).trim();

        } else if (rawName && rawName.toLowerCase() === "admin") {

            rawName = "Rytíř Admin";

        }

        var nameStr = this.escapeHtml(rawName);

        var roleIcon = isGuest ? "👤 Host" : (this.currentUser.role === "Admin" ? "👑 Admin" : "🛡️ Hráč");

        if (badgeEl) {

            badgeEl.innerHTML = roleIcon + ": <strong>" + nameStr + "</strong>";

        }

        var adminNav = document.getElementById("nav-btn-admin");

        if (adminNav) {

            adminNav.style.display = (this.currentUser && this.currentUser.role === "Admin") ? "inline-flex" : "none";

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

    },

    // --- LOBBY & NASTAVENÍ NOVÉ HRY ---,

    renderLobbyPlayers: function () {

        var container = document.getElementById("lobby-players-list");

        if (!container) return;

        var html = "";

        for (var i = 0; i < this.lobbyPlayers.length; i++) {

            var p = this.lobbyPlayers[i];

            var col = window.PRS_GameEngine.PLAYER_COLORS[i % window.PRS_GameEngine.PLAYER_COLORS.length];

            var placeholder = (i === 0) ? ' placeholder="Tvoje rytířská přezdívka (např. Sir Gawain)" title="Zadej svou herní přezdívku (jméno rytíře u stolu)"' : ' placeholder="Jméno hráče / PC bota"';

            html += '<div class="lobby-player-row">' +

                '<span class="player-color-dot" style="background:' + col.hex + '">' + col.badge + '</span>' +

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

        if (this.lobbyPlayers[idx]) this.lobbyPlayers[idx].type = val;

    },

    addLobbyPlayer: function () {

        if (this.lobbyPlayers.length >= 6) return;

        var idx = this.lobbyPlayers.length;

        var col = window.PRS_GameEngine.PLAYER_COLORS[idx];

        this.lobbyPlayers.push({ name: col.name, type: "Bot_Balanced" });

        this.renderLobbyPlayers();

    },

    removeLobbyPlayer: function (idx) {

        if (this.lobbyPlayers.length <= 2) return;

        this.lobbyPlayers.splice(idx, 1);

        this.renderLobbyPlayers();

    },

    changeBoardTemplateLive: function (boardCode) {

        if (this.state && this.state.turnNumber > 0) {

            var conf = confirm("V rozehrané partii nelze měnit mapu bez restartu hry.\nPřeješ si opravdu ukončit aktuální partii a začít novou hru na zvoleném plánu?");

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

    startNewGame: function (switchToBoard) {

        this.victoryModalShown = false;

        this.closeVictoryModal();

        if (this.autoBotTimer) {

            clearTimeout(this.autoBotTimer);

            this.autoBotTimer = null;

        }

        var boardSel = document.getElementById("lobby-board-select");

        var scenSel = document.getElementById("lobby-game-scenario");

        var diffSel = document.getElementById("lobby-difficulty-mode");

        var boardCode = boardSel ? boardSel.value : "classic_96";

        var scenario = scenSel ? scenSel.value : (this.selectedGameScenario || "classic");

        var difficultyMode = diffSel ? diffSel.value : (this.selectedDifficultyMode || "standard");

        this.selectedGameScenario = scenario;

        this.selectedDifficultyMode = difficultyMode;

        var targetHearts = 30;

        if (scenario === "sprint") targetHearts = 15;

        else if (scenario === "classic") targetHearts = 30;

        else if (scenario === "slayer") targetHearts = 20;

        else if (scenario === "tycoon") targetHearts = 25;

        else if (scenario === "epic") targetHearts = 45;

        this.state = window.PRS_GameEngine.createGame({

            config: this.activeConfig,

            boardCode: boardCode,

            scenario: scenario,

            difficultyMode: difficultyMode,

            targetHearts: targetHearts,

            players: this.lobbyPlayers

        });

        this.selectedNodeId = 0;

        this.lastKnownTurnNumber = 1;

        this.isBoardStaticDirty = true;

        this.resetZoomAndPan();

        this.renderGameScreen();

        if (switchToBoard) {

            if (window.PRS_Audio) window.PRS_Audio.playNotice();

            this.switchTab("board");

            this.scheduleBotTurnIfNeeded();

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

        this.renderLogs();

        this.updateMobileDock();

    },

    initKeyboardShortcuts: function () {

        var self = this;

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

    // INTERAKCE MEZI HRÁČI (Duel, Přípitek, Výkup sad, Intriky, Pakt, Výzva)

    // ========================================================================
};
