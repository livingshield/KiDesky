// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Web Audio syntezátor (zvukové efekty kostek, mincí, mečů, fanfár)
// ============================================================================

window.PRS_Audio = {
    ctx: null,
    muted: false,
    bgmAudio: null,
    bgmVolume: 0.35,
    sfxVolume: 0.70,
    isMusicPlaying: false,
    currentTrackIndex: 0,
    proceduralTimer: null,
    proceduralStep: 0,
    playlist: [
        { id: "court", title: "Královská audience (Dvůr)", author: "Dvorská loutna & flétna", src: "assets/audio/bgm_court.mp3" },
        { id: "tavern", title: "U Zlatého korbelu (Krčma)", author: "Hospodský rej & tamburína", src: "assets/audio/bgm_tavern.mp3" },
        { id: "tournament", title: "Rytířské klání (Turnaj)", author: "Turnajový pochod & fanfáry", src: "assets/audio/bgm_tournament.mp3" },
        { id: "procedural", title: "Živá improvizace (Web Audio)", author: "Generovaná renesanční loutna", src: null, isProcedural: true }
    ],

    init: function () {
        if (typeof localStorage !== "undefined") {
            var savedMute = localStorage.getItem("kidesky_sound_muted");
            if (savedMute !== null) this.muted = (savedMute === "true");
            var savedBgmVol = localStorage.getItem("kidesky_bgm_volume");
            if (savedBgmVol !== null) this.bgmVolume = Math.max(0, Math.min(1, parseFloat(savedBgmVol)));
            var savedSfxVol = localStorage.getItem("kidesky_sfx_volume");
            if (savedSfxVol !== null) this.sfxVolume = Math.max(0, Math.min(1, parseFloat(savedSfxVol)));
        }
        this._ensureBgmAudio();
    },

    _ensureBgmAudio: function () {
        if (!this.bgmAudio && typeof document !== "undefined") {
            var existing = document.getElementById("prs-bgm-audio");
            if (existing) {
                this.bgmAudio = existing;
            } else {
                this.bgmAudio = document.createElement("audio");
                this.bgmAudio.id = "prs-bgm-audio";
                this.bgmAudio.loop = true;
                document.body.appendChild(this.bgmAudio);
            }
            this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume;
            var self = this;
            this.bgmAudio.addEventListener("ended", function () {
                self.nextTrack();
            });
            this.bgmAudio.addEventListener("error", function () {
                if (self.isMusicPlaying) {
                    console.warn("BGM file load failed, switching to procedural lute fallback.");
                    self.startProceduralLute();
                }
            });
        }
    },

    ensureContext: function () {
        if (!this.ctx && typeof window !== "undefined") {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    },

    toggleMute: function () {
        this.muted = !this.muted;
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("kidesky_sound_muted", String(this.muted));
        }
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume;
        }
        if (this.muted && this.proceduralTimer) {
            this.stopProceduralLute();
        } else if (!this.muted && this.isMusicPlaying && this.getCurrentTrack().isProcedural) {
            this.startProceduralLute();
        }
        return this.muted;
    },

    // --- HUDEBNÍ PŘEHRÁVAČ (BGM PLAYER) ---
    getCurrentTrack: function () {
        return this.playlist[this.currentTrackIndex] || this.playlist[0];
    },

    playTrack: function (idx) {
        if (idx !== undefined && idx >= 0 && idx < this.playlist.length) {
            this.currentTrackIndex = idx;
        }
        var tr = this.getCurrentTrack();
        this._ensureBgmAudio();
        this.stopProceduralLute();

        if (tr.isProcedural) {
            if (this.bgmAudio) this.bgmAudio.pause();
            this.isMusicPlaying = true;
            this.startProceduralLute();
        } else if (tr.src && this.bgmAudio) {
            this.bgmAudio.src = tr.src;
            this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume;
            this.isMusicPlaying = true;
            var playProm = this.bgmAudio.play();
            if (playProm !== undefined) {
                playProm.catch(function (e) {
                    console.log("Audio play blocked by browser policy, waiting for user click.", e);
                });
            }
        }
        if (window.PRS_App && window.PRS_App.updateMusicUI) {
            window.PRS_App.updateMusicUI();
        }
    },

    pauseTrack: function () {
        this.isMusicPlaying = false;
        if (this.bgmAudio) this.bgmAudio.pause();
        this.stopProceduralLute();
        if (window.PRS_App && window.PRS_App.updateMusicUI) {
            window.PRS_App.updateMusicUI();
        }
    },

    toggleMusic: function () {
        if (this.isMusicPlaying) {
            this.pauseTrack();
        } else {
            this.playTrack();
        }
        return this.isMusicPlaying;
    },

    nextTrack: function () {
        var nxt = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playTrack(nxt);
    },

    prevTrack: function () {
        var prv = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playTrack(prv);
    },

    setBgmVolume: function (vol) {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("kidesky_bgm_volume", String(this.bgmVolume));
        }
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.muted ? 0 : this.bgmVolume;
        }
    },

    setSfxVolume: function (vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("kidesky_sfx_volume", String(this.sfxVolume));
        }
    },

    addCustomTrack: function (file) {
        if (!file) return;
        var url = URL.createObjectURL(file);
        var custom = {
            id: "custom_" + Date.now(),
            title: file.name.replace(/\.[^/.]+$/, ""),
            author: "Vlastní nahrávka (Lokální)",
            src: url,
            isCustom: true
        };
        this.playlist.push(custom);
        this.playTrack(this.playlist.length - 1);
    },

    startProceduralLute: function () {
        this.stopProceduralLute();
        this.ensureContext();
        var self = this;
        var chordNotes = [
            [146.83, 220.00, 293.66, 349.23, 440.00],
            [130.81, 196.00, 261.63, 329.63, 392.00],
            [116.54, 174.61, 233.08, 293.66, 349.23],
            [110.00, 164.81, 220.00, 261.63, 329.63]
        ];

        this.proceduralStep = 0;
        this.proceduralTimer = setInterval(function () {
            if (self.muted || !self.isMusicPlaying) return;
            self.ensureContext();
            if (!self.ctx) return;
            var chordIdx = Math.floor(self.proceduralStep / 4) % chordNotes.length;
            var currentChord = chordNotes[chordIdx];
            var noteFreq = currentChord[self.proceduralStep % currentChord.length];
            var now = self.ctx.currentTime;
            self._playPluckedLute(now, noteFreq, 1.4, 0.18 * self.bgmVolume);
            self.proceduralStep = (self.proceduralStep + 1) % 32;
        }, 620);
    },

    stopProceduralLute: function () {
        if (this.proceduralTimer) {
            clearInterval(this.proceduralTimer);
            this.proceduralTimer = null;
        }
    },

    _playPluckedLute: function (startTime, freq, duration, vol) {
        try {
            var osc = this.ctx.createOscillator();
            var osc2 = this.ctx.createOscillator();
            var filter = this.ctx.createBiquadFilter();
            var gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, startTime);
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(freq * 2, startTime);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(1800, startTime);
            filter.frequency.exponentialRampToValueAtTime(320, startTime + 0.4);

            gain.gain.setValueAtTime(vol, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc2.start(startTime);
            osc.stop(startTime + duration);
            osc2.stop(startTime + duration);
        } catch (e) { }
    },

    // --- ZVUKOVÉ EFEKTY (SFX) ---
    playDice: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        for (var i = 0; i < 4; i++) {
            var delay = i * 0.065 + (Math.random() * 0.025);
            this._playWoodTap(now + delay, 220 + Math.random() * 140, 0.045);
        }
    },

    _playWoodTap: function (startTime, freq, duration) {
        try {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(70, startTime + duration);
            gain.gain.setValueAtTime(0.25 * this.sfxVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) { }
    },

    playCoin: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        this._playChime(now, 1760, 0.22, 0.16 * this.sfxVolume);
        this._playChime(now + 0.07, 2640, 0.26, 0.14 * this.sfxVolume);
        this._playChime(now + 0.14, 3520, 0.32, 0.11 * this.sfxVolume);
    },

    _playChime: function (startTime, freq, duration, maxVol) {
        try {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(maxVol, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        } catch (e) { }
    },

    playSword: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        try {
            var bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
            var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.035));
            }
            var noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            var filter = this.ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.setValueAtTime(2600, now);
            filter.Q.setValueAtTime(3.5, now);
            var noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(now);

            this._playChime(now, 988, 0.32, 0.13 * this.sfxVolume);
            this._playChime(now + 0.02, 1976, 0.38, 0.11 * this.sfxVolume);
        } catch (e) { }
    },

    playFanfare: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        var notes = [
            { f: 523.25, start: 0, dur: 0.14 },
            { f: 659.25, start: 0.13, dur: 0.14 },
            { f: 783.99, start: 0.26, dur: 0.18 },
            { f: 1046.50, start: 0.44, dur: 0.65 }
        ];
        var self = this;
        notes.forEach(function (n) {
            try {
                var osc = self.ctx.createOscillator();
                var gain = self.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(n.f, now + n.start);
                gain.gain.setValueAtTime(0.22 * self.sfxVolume, now + n.start);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);
                osc.connect(gain);
                gain.connect(self.ctx.destination);
                osc.start(now + n.start);
                osc.stop(now + n.start + n.dur);
            } catch (e) { }
        });
    },

    playStep: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        this._playWoodTap(now, 380, 0.035);
    },

    playNotice: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        this._playChime(now, 1046.5, 0.16, 0.14 * this.sfxVolume);
        this._playChime(now + 0.09, 1318.5, 0.24, 0.16 * this.sfxVolume);
    },

    playItem: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        this._playWoodTap(now, 520, 0.04);
        this._playChime(now + 0.02, 1480, 0.12, 0.09 * this.sfxVolume);
    },

    playOminous: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        this._playChime(now, 220, 0.8, 0.24 * this.sfxVolume);
        this._playChime(now + 0.1, 164.8, 1.0, 0.28 * this.sfxVolume);
    }
};

// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Hlavní aplikační kontroler, SVG mapa, Zoom/Pan
// a správa bitmapových políček / prostředí
// ============================================================================

window.PRS_App = {
    state: null,
    activeConfig: null,
    graphicsConfig: null,
    armoryActiveTab: "all",
    currentUser: {
        id: null,
        username: "Host (Nepřihlášený)",
        displayName: "Královský Host",
        role: "Guest",
        token: null
    },
    lobbyPlayers: [
        { name: "Lord Filip (Ty)", type: "Human" },
        { name: "Černý Baron (PC)", type: "Bot_Aggressive" },
        { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder" },
        { name: "Kněžna Eliška (PC)", type: "Bot_Noble" }
    ],
    selectedNodeId: null,
    autoBotTimer: null,
    autoBotEnabled: true,
    isMoveAnimating: false,
    animatingPlayerIndex: null,
    animTokenPos: null,
    fastAnim: false,
    currentTheme: "light",

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
        var self = this;
        this.activeConfig = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG);
        this.graphicsConfig = window.PRS_GameEngine.deepClone(window.PRS_GRAPHICS_CONFIG);
        this.loadSavedGraphicsConfig();
        this.loadSavedUser();
        this.initTheme();
        this.detectDeviceProfile();
        this.renderLobbyPlayers();
        this.initMapPanAndZoom();
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
        this.startNewGame(false);
        this.initLandingLiveCanvas();
        this.startOnlinePollingLoop();

        // Odložené naplnění skrytých záložek, kontrola ?room= v URL a načtení síťového stavu
        setTimeout(function () {
            self.renderRulesAndCatalog();
            self.renderBalanceStudioInputs();
            self.fetchServerStatusAndSessions();
            self.checkUrlRoomParam();
        }, 60);
    },

    // ========================================================================
    // 5 ELEMENTÁRNÍCH BAREVNÝCH TÉMAT (ŽIVLŮ)
    // ========================================================================
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
            this.renderBoardSVG();
        }
    },

    // ========================================================================
    // DETEKCE ZAŘÍZENÍ A MOBILNÍ / TABLETOVÁ ERGONOMIE (MOBILE HUD)
    // ========================================================================
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
    },

    // --- AKTUALIZACE SPODNÍHO MOBILNÍHO DOCKU (STICKY THUMB HUD) ---
    updateMobileDock: function () {
        var dock = document.getElementById("mobile-action-dock");
        if (!dock) return;

        var shouldShow = (this.activeTab === "board" && this.deviceProfile && this.deviceProfile.device === "mobile" && this.deviceProfile.orientation === "portrait");
        dock.style.display = shouldShow ? "flex" : "none";
        if (!shouldShow || !this.state) return;

        var player = this.state.players[this.state.currentPlayerIndex];
        if (!player) return;

        // 1. Stavový řádek hráče
        var nameEl = document.getElementById("mobile-dock-player-name");
        var badgeEl = document.getElementById("mobile-dock-player-badge");
        var pillEl = document.getElementById("mobile-dock-player-pill");
        if (nameEl) nameEl.textContent = player.name;
        if (badgeEl) badgeEl.textContent = player.badge;
        if (pillEl) pillEl.style.color = player.color || "var(--gold-light)";

        var goldEl = document.getElementById("mobile-dock-gold");
        if (goldEl) goldEl.textContent = "🪙 " + player.gold.toLocaleString("cs-CZ") + " zl.";

        var heartsEl = document.getElementById("mobile-dock-hearts");
        if (heartsEl) heartsEl.textContent = "💖 " + player.totalHearts + "/" + this.state.config.targetHearts;

        var tileEl = document.getElementById("mobile-dock-tile");
        var curNd = this.state.board.nodes[player.nodeId];
        if (tileEl && curNd) {
            tileEl.textContent = (curNd.icon || "📍") + " " + curNd.code;
        }

        // 2. Odznaky na tlačítkách (počet věcí, počet sídel)
        var invBadge = document.getElementById("mobile-badge-inventory");
        if (invBadge) {
            var itCount = player.items ? player.items.length : 0;
            invBadge.style.display = itCount > 0 ? "flex" : "none";
            invBadge.textContent = itCount;
        }
        var estBadge = document.getElementById("mobile-badge-estates");
        if (estBadge) {
            var estCount = player.ownedNodes ? player.ownedNodes.length : 0;
            estBadge.style.display = estCount > 0 ? "flex" : "none";
            estBadge.textContent = estCount;
        }

        // 3. Primární akční tlačítko pod palcem
        var mainBtnWrap = document.getElementById("mobile-dock-primary-btn-wrap");
        if (!mainBtnWrap) return;

        var isBot = (player.type !== "Human");
        var isOnlineLock = (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot);

        if (this.state.phase === "GAME_OVER") {
            mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff;" onclick="PRS_App.openVictoryModal()">👑 KRÁLOVSKÁ SVATBA (VÝHRA)</button>';
            return;
        }

        if (isOnlineLock) {
            mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" disabled style="background:#1e293b; color:#94a3b8; border-color:#334155; font-size:0.86rem;">⏳ Čeká se na tah: ' + this.escapeHtml(player.name) + '</button>';
            return;
        }

        if (this.state.phase === "ROLL") {
            if (isBot) {
                if (this.autoBotEnabled) {
                    mainBtnWrap.innerHTML = '<div style="display:flex; gap:6px; width:100%;">' +
                        '<button class="mobile-btn-primary" disabled style="flex:1.4; background:#1e293b; color:#94a3b8; border-color:#334155; font-size:0.83rem;">🤖 Hraje ' + this.escapeHtml(player.name) + '...</button>' +
                        '<button class="mobile-btn-primary" style="flex:1; background:rgba(212,175,55,0.22); border-color:var(--gold); color:var(--gold-light); font-size:0.79rem;" onclick="PRS_App.skipToNextHumanTurn()">⚡ Můj tah</button>' +
                        '</div>';
                } else {
                    mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:#fff;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.stepBotNow()">🤖 ODEHRÁT TAH PC (' + this.escapeHtml(player.name) + ')</button>';
                }
            } else {
                mainBtnWrap.innerHTML = '<button class="mobile-btn-primary" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.handleRollDice()">🎲 HODIT KOSTKOU (1–6)</button>';
            }
            return;
        }

        // Fáze ACTION
        var pa = this.state.pendingAction || {};
        var htmlBtns = [];

        if (pa.canResolveQuest && pa.questCard) {
            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #ef4444, #b91c1c); color:#fff; border-color:#fca5a5;" onclick="PRS_App.handleResolveQuest()">⚔️ ZAÚTOČIT NA BESTII (' + this.escapeHtml(pa.questCard.name) + ')</button>');
        } else if (pa.canResolveFestival) {
            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border-color:#fbcfe8;" onclick="PRS_App.handleResolveFestival()">🏆 VYHODNOTIT SLAVNOST (💖)</button>');
        } else if (pa.chanceCard) {
            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; border-color:#fef08a;" onclick="PRS_App.toggleChanceCardFlip(\'' + pa.chanceCard.id + '\')">📜 OTOČIT KARTU NÁHODY</button>');
        } else if (pa.debt) {
            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #b45309, #78350f); color:#fff; border-color:#fbbf24;" onclick="PRS_App.handleAutoLiquidateDebt()">⚖️ UHRADIT DLUH (' + pa.debt.remainingDebt + ' zl.)</button>');
        } else if (pa.isImprisoned || pa.canPayPrisonBail || pa.canAttemptPrisonEscape) {
            htmlBtns.push('<button class="mobile-btn-primary" style="background:linear-gradient(135deg, #52525b, #27272a); color:#f4f4f5; border-color:#71717a;" onclick="PRS_App.toggleMobileSheet(\'action\')">⛓️ VOLBY ŽALÁŘE (KAUCE / ÚTĚK)</button>');
        } else if (pa.canBuyNode) {
            var canAfford = player.gold >= pa.buyPrice;
            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +
                '<button class="mobile-btn-primary" style="flex:1.4;" ' + (!canAfford ? 'disabled' : '') + ' onclick="PRS_App.handleBuyNode()">🛒 KOUPIT (' + pa.buyPrice + ' zl.)</button>' +
                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +
                '</div>');
        } else if (pa.canUpgradeVillage) {
            var canAffordUpg = player.gold >= pa.upgradeCost;
            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +
                '<button class="mobile-btn-primary" style="flex:1.4;" ' + (!canAffordUpg ? 'disabled' : '') + ' onclick="PRS_App.handleUpgradeVillage(' + pa.nodeId + ')">🏘️ POVÝŠIT (' + pa.upgradeCost + ' zl.)</button>' +
                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +
                '</div>');
        } else if (pa.canShopMerchant) {
            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +
                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #b45309, #d97706); color:#fff;" onclick="PRS_App.openArmoryModal()">🛒 TRH & ZBROJNICE</button>' +
                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +
                '</div>');
        } else if (pa.canTrainMaster) {
            htmlBtns.push('<div style="display:flex; gap:6px; width:100%;">' +
                '<button class="mobile-btn-primary" style="flex:1.4; background:linear-gradient(135deg, #4f46e5, #4338ca); color:#fff;" onclick="PRS_App.toggleMobileSheet(\'action\')">🎓 CVIČIT U MISTRA</button>' +
                '<button class="mobile-btn-primary" style="flex:1; background:rgba(255,255,255,0.12); border-color:var(--border-gold); color:var(--text-main);" onclick="PRS_App.handleEndTurn()">➡️ Konec tahu</button>' +
                '</div>');
        } else {
            htmlBtns.push('<button class="mobile-btn-primary" onclick="PRS_App.handleEndTurn()">➡️ UKONČIT TAH</button>');
        }

        mainBtnWrap.innerHTML = htmlBtns.join("");

        // Pokud je otevřený vysouvací šuplík, aktualizujeme jeho obsah live
        if (this.activeMobileSheet) {
            this.renderMobileSheetContent();
        }
    },

    handleMobilePrimaryAction: function () {
        if (!this.state || this.isMoveAnimating) return;
        var p = this.state.players[this.state.currentPlayerIndex];
        if (!p) return;

        var isBot = (p.type !== "Human");
        if (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot) {
            this.pollOnlineSessionNow(true);
            return;
        }

        if (this.state.phase === "GAME_OVER") {
            this.openVictoryModal();
            return;
        }

        if (this.state.phase === "ROLL") {
            if (isBot) {
                this.stepBotNow();
            } else {
                this.handleRollDice();
            }
            return;
        }

        var pa = this.state.pendingAction || {};
        if (pa.canResolveQuest && pa.questCard) {
            this.handleResolveQuest();
            return;
        }
        if (pa.canResolveFestival) {
            this.handleResolveFestival();
            return;
        }
        if (pa.chanceCard) {
            this.toggleChanceCardFlip(pa.chanceCard.id);
            return;
        }
        if (pa.debt) {
            this.handleAutoLiquidateDebt();
            return;
        }
        if (pa.canBuyNode && p.gold >= pa.buyPrice) {
            this.handleBuyNode();
            return;
        }
        if (pa.canUpgradeVillage && p.gold >= pa.upgradeCost) {
            this.handleUpgradeVillage(pa.nodeId);
            return;
        }
        if (pa.isImprisoned || pa.canPayPrisonBail || pa.canAttemptPrisonEscape) {
            this.toggleMobileSheet("action");
            return;
        }
        if (pa.canShopMerchant) {
            this.openArmoryModal();
            return;
        }
        if (pa.canTrainMaster) {
            this.toggleMobileSheet("action");
            return;
        }

        this.handleEndTurn();
    },

    // --- OVLÁDÁNÍ VYSOUVACÍHO ŠUPLÍKU (BOTTOM SHEET) ---
    toggleMobileSheet: function (sheetType) {
        if (this.activeMobileSheet === sheetType) {
            this.closeMobileSheet();
        } else {
            this.openMobileSheet(sheetType);
        }
    },

    openMobileSheet: function (sheetType) {
        this.activeMobileSheet = sheetType;
        var sheet = document.getElementById("mobile-bottom-sheet");
        var backdrop = document.getElementById("mobile-sheet-backdrop");
        var titleEl = document.getElementById("mobile-sheet-title");
        if (!sheet || !backdrop) return;

        var titles = {
            inventory: "🎒 Královský batoh & Výbava",
            estates: "🏰 Držená panství & Sídla",
            logs: "📜 Královská kronika událostí",
            tile: "ℹ️ Detail políčka na plánu",
            action: "⚡ Královské akce a volby"
        };
        if (titleEl) titleEl.textContent = titles[sheetType] || "Detail";

        this.renderMobileSheetContent();

        backdrop.style.display = "block";
        sheet.style.display = "flex";
        setTimeout(function () {
            backdrop.classList.add("active");
            sheet.classList.add("open");
        }, 10);

        if (window.PRS_Audio) window.PRS_Audio.playStep();
    },

    closeMobileSheet: function () {
        var sheet = document.getElementById("mobile-bottom-sheet");
        var backdrop = document.getElementById("mobile-sheet-backdrop");
        this.activeMobileSheet = null;
        if (sheet) sheet.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
        setTimeout(function () {
            if (sheet) sheet.style.display = "none";
            if (backdrop) backdrop.style.display = "none";
        }, 280);
    },

    renderMobileSheetContent: function () {
        var contentEl = document.getElementById("mobile-sheet-content");
        if (!contentEl || !this.state) return;
        var p = this.state.players[this.state.currentPlayerIndex];
        if (!p) return;

        var html = "";
        var sheetType = this.activeMobileSheet;

        if (sheetType === "inventory") {
            var stats = window.PRS_GameEngine.getEffectiveStats(this.state, p);
            html += '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; margin-bottom:12px; background:rgba(0,0,0,0.35); padding:8px; border-radius:10px; text-align:center;">' +
                '<div><small style="color:var(--text-muted);">⚔️ Boj</small><div style="font-weight:bold; font-size:1.1rem; color:#f87171;">' + stats.boj + '</div></div>' +
                '<div><small style="color:var(--text-muted);">🏇 Jízda</small><div style="font-weight:bold; font-size:1.1rem; color:#60a5fa;">' + stats.jizda + '</div></div>' +
                '<div><small style="color:var(--text-muted);">💃 Tanec</small><div style="font-weight:bold; font-size:1.1rem; color:#f472b6;">' + stats.tanec + '</div></div>' +
                '<div><small style="color:var(--text-muted);">✨ Charisma</small><div style="font-weight:bold; font-size:1.1rem; color:#fbbf24;">' + stats.charisma + '</div></div>' +
                '</div>';

            html += '<h4 style="font-size:0.9rem; margin-bottom:6px; color:var(--gold-light);">🎒 Předměty a zbraně (' + p.items.length + '):</h4>';
            if (p.items.length === 0) {
                html += '<p style="color:var(--text-muted); font-size:0.84rem;">Batoh je prázdný. Zastav se u Kupce nebo v Královské zbrojnici.</p>';
            } else {
                html += '<div style="display:flex; flex-direction:column; gap:6px;">';
                for (var i = 0; i < p.items.length; i++) {
                    var it = p.items[i];
                    html += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:6px 10px; border-radius:8px; border:1px solid rgba(212,175,55,0.2);">' +
                        '<div>' + (it.icon || '📦') + ' <strong>' + this.escapeHtml(it.name) + '</strong> <small style="color:var(--gold-light); font-weight:600;">' + (it.slot ? ('[' + this.formatSlotLabel(it.slot, true) + ']') : '') + '</small></div>' +
                        '<div style="font-weight:600; color:var(--gold-light); font-size:0.82rem;">' + (it.bonusText || (it.price + ' zl.')) + '</div>' +
                        '</div>';
                }
                html += '</div>';
            }
            html += '<button class="btn-action-buy" style="width:100%; margin-top:12px;" onclick="PRS_App.openArmoryModal()">🛒 Otevřít Královskou zbrojnici & Trh</button>';

        } else if (sheetType === "estates") {
            html += '<h4 style="font-size:0.9rem; margin-bottom:6px; color:var(--gold-light);">🏰 Vlastněná panství a chovy (' + p.ownedNodes.length + '):</h4>';
            if (p.ownedNodes.length === 0) {
                html += '<p style="color:var(--text-muted); font-size:0.84rem;">Zatím nevlastníš žádnou vesnici, město ani hřebčín. Skupuj prázdná pole při průchodu!</p>';
            } else {
                html += '<div style="display:flex; flex-direction:column; gap:6px;">';
                for (var n = 0; n < p.ownedNodes.length; n++) {
                    var ndId = p.ownedNodes[n];
                    var ndObj = this.state.board.nodes[ndId];
                    if (!ndObj) continue;
                    var rent = window.PRS_GameEngine.calculateNodeRent(this.state, ndObj, p);
                    html += '<div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 10px; border-radius:8px; border:1px solid rgba(212,175,55,0.2);">' +
                        '<div>' + (ndObj.icon || '📍') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> <small style="color:var(--text-muted);">(' + ndObj.code + ')' + (ndObj.villageLevel > 1 ? (' ★' + ndObj.villageLevel) : '') + '</small></div>' +
                        '<div style="font-weight:bold; color:#86efac; font-size:0.84rem;">Mýtné: ' + rent.toLocaleString("cs-CZ") + ' zl.</div>' +
                        '</div>';
                }
                html += '</div>';
            }

        } else if (sheetType === "logs") {
            html += '<div class="log-box" style="max-height:55vh;">';
            for (var l = 0; l < Math.min(30, this.state.logs.length); l++) {
                var lg = this.state.logs[l];
                html += '<div class="log-item ' + (lg.type || '') + '" style="font-size:0.82rem; padding:4px 0;">' +
                    '<span class="log-time" style="color:var(--text-muted); margin-right:4px;">[' + lg.time + ']</span>' +
                    this.formatGameText(lg.text) +
                    '</div>';
            }
            html += '</div>';

        } else if (sheetType === "tile") {
            var tileCardEl = document.getElementById("player-standing-tile-card");
            if (tileCardEl) {
                html = tileCardEl.innerHTML;
            } else {
                html = '<div class="empty-note">Žádné políčko ke zkoumání.</div>';
            }
        } else if (sheetType === "action") {
            var actPanelEl = document.getElementById("turn-action-panel");
            if (actPanelEl) {
                html = actPanelEl.innerHTML;
            }
        }

        contentEl.innerHTML = html;
    },

    // ========================================================================
    // INTERAKTIVNÍ ZOOM A POSOUVÁNÍ MAPY (PAN & ZOOM)
    // ========================================================================
    initMapPanAndZoom: function () {
        var self = this;
        var wrap = document.getElementById("board-viewport-wrap");
        if (!wrap) return;

                // Kolečko myši = plynulý zoom při Ctrl nebo při aktivním přiblížení; jinak přirozený posun stránky
        wrap.addEventListener("wheel", function (e) {
            var isZoomKey = e.ctrlKey || e.metaKey;
            var isZoomedIn = self.viewport.scale > (self.viewport.minScale + 0.03);

            if (!isZoomKey) {
                // Pokud je mapa v základním měřítku (100%) a točíme dolů, necháme stránku přirozeně scrollovat k hráčům pod deskou
                if (e.deltaY > 0 && !isZoomedIn) {
                    return;
                }
                // Pokud je stránka odscrollovaná dolů a točíme nahoru, necháme stránku přirozeně scrollovat nahoru k desce a liště
                if (e.deltaY < 0 && typeof window !== "undefined" && window.scrollY > 4) {
                    return;
                }
            }

            e.preventDefault();
            var rect = wrap.getBoundingClientRect();
            var mouseX = e.clientX - rect.left;
            var mouseY = e.clientY - rect.top;

            var delta = (e.deltaY < 0) ? 1.14 : 0.88;
            var newScale = Math.min(self.viewport.maxScale, Math.max(self.viewport.minScale, self.viewport.scale * delta));

            // Přepočet posunu tak, aby bod pod kurzorem zůstal na místě
            var scaleRatio = newScale / self.viewport.scale;
            self.viewport.panX = mouseX - (mouseX - self.viewport.panX) * scaleRatio;
            self.viewport.panY = mouseY - (mouseY - self.viewport.panY) * scaleRatio;
            self.viewport.scale = newScale;

            self.clampViewportPan();
            self.applyViewportTransform();
        }, { passive: false });

        // Tažení myší (Pan)
        wrap.addEventListener("mousedown", function (e) {
            if (e.button !== 0) return;
            self.viewport.isDragging = true;
            self.viewport.dragMoved = false;
            self.viewport.startX = e.clientX;
            self.viewport.startY = e.clientY;
            self.viewport.startPanX = self.viewport.panX;
            self.viewport.startPanY = self.viewport.panY;
            wrap.classList.add("is-panning");
        });

        window.addEventListener("mousemove", function (e) {
            if (!self.viewport.isDragging) return;
            var dx = e.clientX - self.viewport.startX;
            var dy = e.clientY - self.viewport.startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                self.viewport.dragMoved = true;
            }
            self.viewport.panX = self.viewport.startPanX + dx;
            self.viewport.panY = self.viewport.startPanY + dy;
            self.clampViewportPan();
            self.applyViewportTransform();
        });

        window.addEventListener("mouseup", function () {
            if (self.viewport.isDragging) {
                self.viewport.isDragging = false;
                wrap.classList.remove("is-panning");
            }
        });

        // Podpora dotykového ovládání (mobil / tablet: Pan + Pinch-to-Zoom + Double-tap Focus)
        var lastTapTime = 0;
        wrap.addEventListener("touchstart", function (e) {
            if (e.touches.length === 1) {
                var now = Date.now();
                if (now - lastTapTime < 320) {
                    self.centerOnActivePlayer();
                    lastTapTime = 0;
                    if (e.cancelable) e.preventDefault();
                    return;
                }
                lastTapTime = now;

                self.viewport.isDragging = true;
                self.viewport.dragMoved = false;
                self.viewport.startX = e.touches[0].clientX;
                self.viewport.startY = e.touches[0].clientY;
                self.viewport.startPanX = self.viewport.panX;
                self.viewport.startPanY = self.viewport.panY;
            } else if (e.touches.length === 2) {
                self.viewport.isDragging = false;
                self.viewport.isPinching = true;
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                self.viewport.pinchDist0 = Math.sqrt(dx * dx + dy * dy);
                self.viewport.pinchScale0 = self.viewport.scale;
                var rect = wrap.getBoundingClientRect();
                self.viewport.pinchCenterX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
                self.viewport.pinchCenterY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
                self.viewport.pinchPanX0 = self.viewport.panX;
                self.viewport.pinchPanY0 = self.viewport.panY;
                if (e.cancelable) e.preventDefault();
            }
        }, { passive: false });

        wrap.addEventListener("touchmove", function (e) {
            if (e.touches.length === 2 && self.viewport.isPinching) {
                if (e.cancelable) e.preventDefault();
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                var dist1 = Math.sqrt(dx * dx + dy * dy);
                if (self.viewport.pinchDist0 > 0) {
                    var factor = dist1 / self.viewport.pinchDist0;
                    var newScale = Math.min(self.viewport.maxScale, Math.max(self.viewport.minScale, self.viewport.pinchScale0 * factor));
                    var ratio = newScale / self.viewport.pinchScale0;
                    var cx = self.viewport.pinchCenterX;
                    var cy = self.viewport.pinchCenterY;
                    self.viewport.panX = cx - (cx - self.viewport.pinchPanX0) * ratio;
                    self.viewport.panY = cy - (cy - self.viewport.pinchPanY0) * ratio;
                    self.viewport.scale = newScale;
                    self.clampViewportPan();
                    self.applyViewportTransform();
                }
            } else if (e.touches.length === 1 && self.viewport.isDragging) {
                var dx = e.touches[0].clientX - self.viewport.startX;
                var dy = e.touches[0].clientY - self.viewport.startY;
                if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                    self.viewport.dragMoved = true;
                    if (e.cancelable) e.preventDefault();
                }
                self.viewport.panX = self.viewport.startPanX + dx;
                self.viewport.panY = self.viewport.startPanY + dy;
                self.clampViewportPan();
                self.applyViewportTransform();
            }
        }, { passive: false });

        wrap.addEventListener("touchend", function (e) {
            if (e.touches.length < 2) {
                self.viewport.isPinching = false;
            }
            if (e.touches.length === 0) {
                self.viewport.isDragging = false;
            }
        });
    },

    clampViewportPan: function () {
        var wrap = document.getElementById("board-viewport-wrap");
        var svgEl = document.getElementById("prs-board-svg");
        if (!wrap) return;
        var w = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);
        var h = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);
        var maxOffsetX = Math.max(160, w * Math.max(0.2, this.viewport.scale - 0.7) * 0.85);
        var maxOffsetY = Math.max(120, h * Math.max(0.2, this.viewport.scale - 0.7) * 0.85);
        this.viewport.panX = Math.min(maxOffsetX * 0.55, Math.max(-maxOffsetX, this.viewport.panX));
        this.viewport.panY = Math.min(maxOffsetY * 0.55, Math.max(-maxOffsetY, this.viewport.panY));
    },

    applyViewportTransform: function () {
        var g = document.getElementById("prs-board-stage");
        var lbl = document.getElementById("zoom-pct-label");
        var wrap = document.getElementById("board-viewport-wrap");
        var svgEl = document.getElementById("prs-board-svg");
        if (lbl) {
            lbl.textContent = Math.round(this.viewport.scale * 100) + " %";
        }
        if (!g || !wrap) return;
        // Převod pixelového posunu na souřadnice SVG (1400 x 860) měřený z reálné velikosti SVG
        var svgW = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);
        var svgH = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);
        var svgRatioX = 1400 / Math.max(1, svgW);
        var svgRatioY = 860 / Math.max(1, svgH);
        var tx = Math.round(this.viewport.panX * svgRatioX * 10) / 10;
        var ty = Math.round(this.viewport.panY * svgRatioY * 10) / 10;
        g.setAttribute("transform", "translate(" + tx + "," + ty + ") scale(" + this.viewport.scale.toFixed(3) + ")");
    },

    zoomBy: function (factor) {
        var wrap = document.getElementById("board-viewport-wrap");
        var cx = wrap ? wrap.clientWidth / 2 : 500;
        var cy = wrap ? wrap.clientHeight / 2 : 310;
        var newScale = Math.min(this.viewport.maxScale, Math.max(this.viewport.minScale, this.viewport.scale * factor));
        var ratio = newScale / this.viewport.scale;
        this.viewport.panX = cx - (cx - this.viewport.panX) * ratio;
        this.viewport.panY = cy - (cy - this.viewport.panY) * ratio;
        this.viewport.scale = newScale;
        this.clampViewportPan();
        this.applyViewportTransform();
    },

    resetZoomAndPan: function () {
        this.viewport.scale = 1.0;
        this.viewport.panX = 0;
        this.viewport.panY = 0;
        this.applyViewportTransform();
    },

    centerOnActivePlayer: function () {
        if (!this.state) return;
        var p = this.state.players[this.state.currentPlayerIndex];
        var nd = this.state.board.nodes[p.nodeId];
        var wrap = document.getElementById("board-viewport-wrap");
        if (!nd || !wrap) return;

        var isMobile = (this.deviceProfile && this.deviceProfile.device === "mobile");
        var targetScale = isMobile ? Math.max(1.20, Math.min(1.85, this.viewport.scale)) : Math.max(1.45, this.viewport.scale);
        this.viewport.scale = targetScale;
        var svgEl = document.getElementById("prs-board-svg");
        var svgW = (svgEl && svgEl.clientWidth > 0) ? svgEl.clientWidth : (wrap.clientWidth || 1000);
        var svgH = (svgEl && svgEl.clientHeight > 0) ? svgEl.clientHeight : (wrap.clientHeight || 620);
        var svgRatioX = 1400 / Math.max(1, svgW);
        var svgRatioY = 860 / Math.max(1, svgH);

        // Bezpečné vycentrování na hráče s respektováním okrajů desky
        var tx = 700 - nd.x * targetScale;
        var ty = 430 - nd.y * targetScale;
        this.viewport.panX = tx / svgRatioX;
        this.viewport.panY = ty / svgRatioY;
        this.clampViewportPan();
        this.applyViewportTransform();
    },

    setSketchOverlayOpacity: function (val) {
        this.graphicsConfig.sketchOverlayOpacity = Number(val);
        var imgEl = document.getElementById("prs-sketch-overlay-img");
        if (imgEl) {
            imgEl.setAttribute("opacity", String(this.graphicsConfig.sketchOverlayOpacity));
        }
    },

    // ========================================================================
    // SPRÁVA BITMAP POLÍČEK, DOMINANT A HERNÍHO PROSTŘEDÍ
    // ========================================================================
    loadSavedGraphicsConfig: function () {
        try {
            var raw = localStorage.getItem("prs_graphics_config");
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    if (parsed.environmentBgUrl) this.graphicsConfig.environmentBgUrl = parsed.environmentBgUrl;
                    if (parsed.boardBgUrl) this.graphicsConfig.boardBgUrl = parsed.boardBgUrl;
                    if (parsed.tileBitmapsByType) {
                        for (var k in parsed.tileBitmapsByType) {
                            var tVal = parsed.tileBitmapsByType[k];
                            if (tVal && typeof tVal === "string") {
                                if (tVal.endsWith(".jpg")) tVal = tVal.replace(".jpg", ".png");
                                this.graphicsConfig.tileBitmapsByType[k] = tVal;
                            }
                        }
                    }
                    if (!this.graphicsConfig.tileBitmapsByType.START || this.graphicsConfig.tileBitmapsByType.START.indexOf(".jpg") !== -1) {
                        this.graphicsConfig.tileBitmapsByType.START = "assets/tiles/castle.png";
                    }
                    if (!this.graphicsConfig.tileBitmapsByType.CASTLE || this.graphicsConfig.tileBitmapsByType.CASTLE.indexOf(".jpg") !== -1) {
                        this.graphicsConfig.tileBitmapsByType.CASTLE = "assets/tiles/castle.png";
                    }
                    if (parsed.landmarkBitmaps) {
                        for (var lk in parsed.landmarkBitmaps) {
                            var lVal = parsed.landmarkBitmaps[lk];
                            if (lVal && typeof lVal === "string") {
                                if (lVal.endsWith(".jpg")) lVal = lVal.replace(".jpg", ".png");
                                this.graphicsConfig.landmarkBitmaps[lk] = lVal;
                            }
                        }
                    }
                    if (parsed.decorBitmaps) {
                        if (!this.graphicsConfig.decorBitmaps) this.graphicsConfig.decorBitmaps = {};
                        for (var dk in parsed.decorBitmaps) {
                            this.graphicsConfig.decorBitmaps[dk] = parsed.decorBitmaps[dk];
                        }
                    }
                }
            }
        } catch (e) { }
        if (this.graphicsConfig && this.graphicsConfig.tileBitmapsByType) {
            if (!this.graphicsConfig.tileBitmapsByType.START || this.graphicsConfig.tileBitmapsByType.START.indexOf(".jpg") !== -1) {
                this.graphicsConfig.tileBitmapsByType.START = "assets/tiles/castle.png";
            }
            if (!this.graphicsConfig.tileBitmapsByType.CASTLE || this.graphicsConfig.tileBitmapsByType.CASTLE.indexOf(".jpg") !== -1) {
                this.graphicsConfig.tileBitmapsByType.CASTLE = "assets/tiles/castle.png";
            }
        }
        this.applyEnvironmentBackground();
    },

    applyEnvironmentBackground: function () {
        if (typeof document === "undefined" || !document.body) return;
        var envUrl = this.graphicsConfig.environmentBgUrl;
        if (envUrl && this.graphicsConfig.useCustomEnvBg) {
            document.body.style.backgroundImage = "linear-gradient(rgba(12,10,8,0.72), rgba(12,10,8,0.85)), url('" + envUrl + "')";
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundAttachment = "fixed";
        } else {
            document.body.style.backgroundImage = "";
        }
    },

    // Vrátí URL bitmapy pro konkrétní kruhové políčko (pokud je nastavena)
    getTileBitmapUrl: function (node) {
        if (!node || !this.graphicsConfig) return "";
        if (this.graphicsConfig.tileBitmapsByCode && this.graphicsConfig.tileBitmapsByCode[node.code]) {
            return this.graphicsConfig.tileBitmapsByCode[node.code];
        }
        var byType = this.graphicsConfig.tileBitmapsByType || {};
        var url = "";
        if (node.subtype && byType[node.subtype]) {
            url = byType[node.subtype];
        } else if (byType[node.type]) {
            url = byType[node.type];
        }
        if (!url && (node.type === "START" || node.type === "CASTLE" || node.code === "START")) {
            url = "assets/tiles/castle.png";
        }
        if (url && typeof url === "string") {
            if (url.endsWith(".jpg")) url = url.replace(".jpg", ".png");
            // Na pravé polovině plánu zrcadlit směrová zvířata a draky
            if (node.x > 700 && (node.subtype === "kun" || node.subtype === "pes" || node.subtype === "sokol" || node.subtype === "U3")) {
                var flipUrl = url.replace(".png", "_flip.png");
                return flipUrl;
            }
        }
        return url;
    },

    openGraphicsModal: function () {
        var m = document.getElementById("graphics-modal");
        if (!m) return;
        this.setInputValue("gfx-env-bg", this.graphicsConfig.environmentBgUrl || "");
        this.setInputValue("gfx-board-bg", this.graphicsConfig.boardBgUrl || "");
        this.setInputValue("gfx-tile-kun", this.graphicsConfig.tileBitmapsByType.kun || "");
        this.setInputValue("gfx-tile-pes", this.graphicsConfig.tileBitmapsByType.pes || "");
        this.setInputValue("gfx-tile-sokol", this.graphicsConfig.tileBitmapsByType.sokol || "");
        this.setInputValue("gfx-tile-village", this.graphicsConfig.tileBitmapsByType.VILLAGE || "");
        this.setInputValue("gfx-tile-town", this.graphicsConfig.tileBitmapsByType.TOWN || "");
        this.setInputValue("gfx-tile-castle", this.graphicsConfig.tileBitmapsByType.CASTLE || "");
        this.setInputValue("gfx-tile-festival", this.graphicsConfig.tileBitmapsByType.FESTIVAL || "");
        this.setInputValue("gfx-landmark-castle", this.graphicsConfig.landmarkBitmaps.royalCastle || "");
        m.style.display = "flex";
    },

    closeGraphicsModal: function () {
        var m = document.getElementById("graphics-modal");
        if (m) m.style.display = "none";
    },

    saveGraphicsSettings: function () {
        this.graphicsConfig.environmentBgUrl = document.getElementById("gfx-env-bg").value.trim();
        this.graphicsConfig.boardBgUrl = document.getElementById("gfx-board-bg").value.trim();
        this.graphicsConfig.tileBitmapsByType.kun = document.getElementById("gfx-tile-kun").value.trim();
        this.graphicsConfig.tileBitmapsByType.pes = document.getElementById("gfx-tile-pes").value.trim();
        this.graphicsConfig.tileBitmapsByType.sokol = document.getElementById("gfx-tile-sokol").value.trim();
        this.graphicsConfig.tileBitmapsByType.VILLAGE = document.getElementById("gfx-tile-village").value.trim();
        this.graphicsConfig.tileBitmapsByType.TOWN = document.getElementById("gfx-tile-town").value.trim();
        this.graphicsConfig.tileBitmapsByType.CASTLE = document.getElementById("gfx-tile-castle").value.trim();
        this.graphicsConfig.tileBitmapsByType.FESTIVAL = document.getElementById("gfx-tile-festival").value.trim();
        this.graphicsConfig.landmarkBitmaps.royalCastle = document.getElementById("gfx-landmark-castle").value.trim();

        localStorage.setItem("prs_graphics_config", JSON.stringify(this.graphicsConfig));
        this.applyEnvironmentBackground();
        this.renderBoardSVG();
        this.closeGraphicsModal();
    },

    // --- OVLÁDÁNÍ ZVUKŮ (Web Audio API) ---
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
    },

    // --- HUDEBNÍ PŘEHRÁVAČ & BGM KONTROLER ---
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

    // --- VÍTĚZNÝ CEREMONIÁL & KRÁLOVSKÁ SVATBA (MODAL) ---
    victoryModalShown: false,

    openVictoryModal: function () {
        var modal = document.getElementById("victory-modal");
        if (!modal || !this.state) return;
        if (modal.style.display === "flex") return; // Zabraňuje problikávání a opakovanému překreslování
        if (window.PRS_Audio) window.PRS_Audio.playFanfare();

        var winIdx = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;
        var winner = this.state.players[winIdx];

        var subEl = document.getElementById("victory-winner-subtitle");
        if (subEl) {
            subEl.innerHTML = 'Rytíř <strong style="color:' + winner.color + '; font-size:1.15rem;">' + winner.badge + ' ' + this.escapeHtml(winner.name) + '</strong> dosáhl cílových <strong>' + winner.totalHearts + ' 💖</strong> a v ' + this.state.roundNumber + '. kole získává ruku princezny!';
        }

        var ranked = this.state.players.slice().sort(function (a, b) {
            if (b.totalHearts !== a.totalHearts) return b.totalHearts - a.totalHearts;
            return b.gold - a.gold;
        });

        var podEl = document.getElementById("victory-podium-content");
        if (podEl) {
            var podHtml = [];
            var ranks = [
                { rank: 1, title: "🏆 VÍTĚZ", cls: "podium-rank-1", badgeCls: "#fbbf24" },
                { rank: 2, title: "🥈 2. MÍSTO", cls: "podium-rank-2", badgeCls: "#94a3b8" },
                { rank: 3, title: "🥉 3. MÍSTO", cls: "podium-rank-3", badgeCls: "#d97706" }
            ];

            for (var r = 0; r < Math.min(3, ranked.length); r++) {
                var rp = ranked[r];
                var rInfo = ranks[r];
                podHtml.push('<div class="podium-card ' + rInfo.cls + '">');
                podHtml.push('  <span class="podium-rank-badge" style="background:rgba(212,175,55,0.2); color:' + rInfo.badgeCls + ';">' + rInfo.title + '</span>');
                podHtml.push('  <div style="font-size:2rem; margin:0.2rem 0;">' + rp.badge + '</div>');
                podHtml.push('  <div style="font-weight:bold; font-size:1.05rem; color:' + rp.color + '; margin-bottom:0.25rem;">' + this.escapeHtml(rp.name) + '</div>');
                podHtml.push('  <div style="font-size:1.35rem; font-weight:bold; color:#f472b6;">' + rp.totalHearts + ' 💖</div>');
                podHtml.push('  <small style="color:var(--text-muted); font-size:0.75rem;">' + rp.gold.toLocaleString("cs-CZ") + ' zl.</small>');
                podHtml.push('</div>');
            }
            podEl.innerHTML = podHtml.join("\n");
        }

        var tblEl = document.getElementById("victory-table-el");
        if (tblEl) {
            var tHtml = [];
            tHtml.push('<thead><tr>');
            tHtml.push('  <th>Pořadí</th>');
            tHtml.push('  <th>Rytíř</th>');
            tHtml.push('  <th style="color:#f472b6;">Srdce celkem</th>');
            tHtml.push('  <th>Slavnosti</th>');
            tHtml.push('  <th>Bojové úkoly</th>');
            tHtml.push('  <th>Chov zvířat</th>');
            tHtml.push('  <th>Měšec</th>');
            tHtml.push('  <th>Majetek celkem</th>');
            tHtml.push('</tr></thead><tbody>');

            for (var i = 0; i < ranked.length; i++) {
                var p = ranked[i];
                var wealth = p.gold;
                for (var it = 0; it < p.items.length; it++) wealth += (p.items[it].price || 0);
                for (var nd = 0; nd < p.ownedNodes.length; nd++) {
                    var nObj = this.state.board.nodes[p.ownedNodes[nd]];
                    if (nObj) wealth += window.PRS_GameEngine.getNodeInvestedValue(this.state, nObj);
                }

                tHtml.push('<tr>');
                tHtml.push('  <td><strong>#' + (i + 1) + '</strong></td>');
                tHtml.push('  <td><strong style="color:' + p.color + ';">' + p.badge + ' ' + this.escapeHtml(p.name) + '</strong> <small style="color:var(--text-muted);">(' + p.type + ')</small></td>');
                tHtml.push('  <td><strong style="color:#f472b6; font-size:1.05rem;">' + p.totalHearts + ' 💖</strong></td>');
                tHtml.push('  <td>' + p.stats.heartsFromFestivals + ' 💖 (' + p.stats.festivalsWon + 'x výhra)</td>');
                tHtml.push('  <td>' + p.stats.heartsFromQuests + ' 💖 (' + p.stats.questsWon + 'x skoleno)</td>');
                tHtml.push('  <td>' + (p.breedingHearts || 0) + ' 💖</td>');
                tHtml.push('  <td><strong style="color:var(--gold-light);">' + p.gold.toLocaleString("cs-CZ") + ' zl.</strong></td>');
                tHtml.push('  <td>' + wealth.toLocaleString("cs-CZ") + ' zl.</td>');
                tHtml.push('</tr>');
            }
            tHtml.push('</tbody>');
            tblEl.innerHTML = tHtml.join("\n");
        }

        var fb = document.getElementById("victory-cloud-feedback");
        if (fb) fb.textContent = "";

        modal.style.display = "flex";
    },

    closeVictoryModal: function () {
        var modal = document.getElementById("victory-modal");
        if (modal) modal.style.display = "none";
    },

    saveVictoryToCloud: function () {
        var self = this;
        var fb = document.getElementById("victory-cloud-feedback");
        var btn = document.getElementById("btn-save-hall-of-fame");
        if (fb) fb.textContent = "Zapisuji vítězství do Síně slávy na MSSQL databázi...";
        if (btn) btn.disabled = true;

        var winIdx = (this.state.winnerIndex !== null) ? this.state.winnerIndex : 0;
        var winner = this.state.players[winIdx];

        var payload = {
            sessionGuid: this.state.sessionGuid || ("v_" + Date.now()),
            roomCode: (this.state.sessionGuid ? this.state.sessionGuid.substring(0, 6).toUpperCase() : "VICTORY"),
            title: "Princeznino srdce - Vítězství: " + winner.name,
            boardCode: this.state.board.code,
            status: "Finished",
            currentTurnPlayer: winIdx,
            turnNumber: this.state.turnNumber,
            targetHearts: this.state.config.targetHearts,
            winnerName: winner.name,
            stateJson: JSON.stringify(this.state),
            players: this.state.players
        };

        fetch("api.ashx?action=save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (btn) btn.disabled = false;
                if (fb) {
                    fb.innerHTML = (res && res.ok)
                        ? "✅ <strong>Skvělé! Vítězství bylo trvale zapsáno do Síně slávy na serveru (kód: " + (res.roomCode || "ULOŽENO") + ").</strong>"
                        : "✅ Partie uložena do databáze.";
                }
            })
            .catch(function () {
                if (btn) btn.disabled = false;
                if (fb) fb.textContent = "✅ Partie zaznamenána lokálně.";
            });
    },

    // --- KRÁLOVSKÁ ZBROJNICE A TRŽIŠTĚ (MODAL) ---
    openArmoryModal: function () {
        var modal = document.getElementById("armory-modal");
        if (!modal) return;
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
        this.renderArmoryModalContent();
        modal.style.display = "flex";
    },

    closeArmoryModal: function () {
        var modal = document.getElementById("armory-modal");
        if (modal) modal.style.display = "none";
    },

    setArmoryTab: function (tab) {
        this.armoryActiveTab = tab;
        var btns = document.querySelectorAll(".armory-tab-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-armtab") === tab) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderArmoryGrid();
    },

        // Převod kódů slotů do přehledné češtiny pro zbrojnici, obchod i inventář
    formatSlotLabel: function (slot, withIcon) {
        var s = (slot || "").toLowerCase();
        switch (s) {
            case "weapon": return withIcon ? "🗡️ Zbraň" : "Zbraň";
            case "armor": return withIcon ? "🛡️ Zbroj" : "Zbroj";
            case "dress": return withIcon ? "👗 Šaty & Plášť" : "Šaty & Plášť";
            case "jewel": return withIcon ? "💍 Klenot" : "Klenot";
            case "trophy": return withIcon ? "🏆 Trofej" : "Trofej";
            default: return withIcon ? "📦 Vybavení" : "Vybavení";
        }
    },

    renderArmoryModalContent: function () {
        if (!this.state || !this.state.players) return;
        var player = this.state.players[this.state.currentPlayerIndex];
        var currNode = this.state.board ? this.state.board.nodes[player.nodeId] : null;
        var isAtMerchant = currNode && currNode.type === "MERCHANT";
        var pa = this.state.pendingAction;
        var canShop = isAtMerchant && pa && pa.canShopMerchant;

        // Informace o rytíři a měšci
        var infoEl = document.getElementById("armory-player-info");
        if (infoEl) {
            infoEl.innerHTML = 'Rytíř: <strong style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</strong> &nbsp;|&nbsp; V měšci: <strong style="color:var(--gold-light); font-size:1.05rem;">' + player.gold.toLocaleString("cs-CZ") + ' zl.</strong>';
        }

        // Status obchodníka
        var statusEl = document.getElementById("armory-merchant-status-badge");
        if (statusEl) {
            if (canShop) {
                statusEl.innerHTML = '<span style="color:#86efac; font-weight:bold; background:rgba(34,197,94,0.18); border:1px solid #22c55e; padding:3px 9px; border-radius:6px;">🏪 Stojíš u Obchodníka – Nákup i výkup aktivní!</span>';
            } else if (isAtMerchant) {
                statusEl.innerHTML = '<span style="color:#fde047; background:rgba(234,179,8,0.18); border:1px solid #eab308; padding:3px 9px; border-radius:6px;">⚖️ Jsi na poli Obchodníka</span>';
            } else {
                statusEl.innerHTML = '<span style="color:#94a3b8; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:3px 9px; border-radius:6px;">👀 Prohlídka katalogu (k nákupu musíš vstoupit na pole Obchodník)</span>';
            }
        }

        this.setArmoryTab(this.armoryActiveTab || "all");
    },

    renderArmoryGrid: function () {
        var grid = document.getElementById("armory-items-grid");
        if (!grid || !this.state) return;
        var player = this.state.players[this.state.currentPlayerIndex];
        var currNode = this.state.board ? this.state.board.nodes[player.nodeId] : null;
        var isAtMerchant = currNode && currNode.type === "MERCHANT";
        var pa = this.state.pendingAction;
        var canShop = isAtMerchant && pa && pa.canShopMerchant;
        var tab = this.armoryActiveTab || "all";

        var html = [];

        // 1. ZÁLOŽKA VÝKUP MAJETKU (Prodej věcí za 50% / budov za 100% u obchodníka)
        if (tab === "sell") {
            var rates = this.state.config.sellRates;
            var itemRatio = isAtMerchant ? rates.merchantItem : rates.anywhereItem;
            var bldRatio = isAtMerchant ? rates.merchantBuilding : rates.anywhereBuilding;

            html.push('<div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">');
            html.push('  <div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.2); border-radius:8px; padding:0.6rem 0.8rem; font-size:0.83rem;">');
            html.push('    <strong>Kurz výkupu:</strong> ' + (isAtMerchant ? '🌟 Zlatý kurz na trhu: <strong>' + Math.round(itemRatio * 100) + ' %</strong> z ceny předmětů, <strong>' + Math.round(bldRatio * 100) + ' %</strong> z investic do budov!' : 'Běžný výkup na cestě: ' + Math.round(itemRatio * 100) + ' % věci, ' + Math.round(bldRatio * 100) + ' % budovy.'));
            html.push('  </div>');
            html.push('</div>');

            if (player.items.length === 0 && player.ownedNodes.length === 0) {
                html.push('<div style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-muted);">Tvůj inventář je prázdný, nemáš co prodat.</div>');
            } else {
                // Seznam předmětů k prodeji
                for (var i = 0; i < player.items.length; i++) {
                    var it = player.items[i];
                    var sellPrice = Math.round(it.price * itemRatio);
                    html.push('<div class="armory-card armory-card-tier-' + (it.tier || 1) + '">');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
                    html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + (it.tier || 1) + '. stupeň</span>');
                    html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(it.slot, true) + '</span>');
                    html.push('  </div>');
                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + it.icon + ' ' + this.escapeHtml(it.name) + '</div>');
                    html.push('  <div style="margin-bottom:0.6rem;">');
                    if (it.boj) html.push('<span class="armory-stat-chip ' + (it.boj > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (it.boj > 0 ? '+' : '') + it.boj + ' Boj</span> ');
                    if (it.jizda) html.push('<span class="armory-stat-chip ' + (it.jizda > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (it.jizda > 0 ? '+' : '') + it.jizda + ' Jízda</span> ');
                    if (it.tanec) html.push('<span class="armory-stat-chip ' + (it.tanec > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (it.tanec > 0 ? '+' : '') + it.tanec + ' Tanec</span> ');
                    if (it.charisma) html.push('<span class="armory-stat-chip ' + (it.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (it.charisma > 0 ? '+' : '') + it.charisma + ' Charisma</span> ');
                    html.push('  </div>');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');
                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + sellPrice.toLocaleString("cs-CZ") + ' zl.</span>');
                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'item\', \'' + it.id + '\')">💰 Prodat</button>');
                    html.push('  </div>');
                    html.push('</div>');
                }

                // Nemovitosti k prodeji
                for (var b = 0; b < player.ownedNodes.length; b++) {
                    var bNode = this.state.board.nodes[player.ownedNodes[b]];
                    if (!bNode) continue;
                    var invested = window.PRS_GameEngine.getNodeInvestedValue(this.state, bNode);
                    var bSellPrice = Math.round(invested * bldRatio);
                    html.push('<div class="armory-card" style="border-top:3.5px solid #22c55e;">');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
                    html.push('    <span class="armory-badge-tier" style="background:rgba(34,197,94,0.18); color:#86efac;">Nemovitost</span>');
                    html.push('    <span style="font-size:0.75rem; color:var(--text-muted);">' + bNode.code + '</span>');
                    html.push('  </div>');
                    html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + bNode.icon + ' ' + this.escapeHtml(bNode.name) + '</div>');
                    html.push('  <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.6rem;">Investováno celkem: ' + invested.toLocaleString("cs-CZ") + ' zl.</div>');
                    html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">');
                    html.push('    <span style="font-size:0.85rem; color:#86efac; font-weight:bold;">+' + bSellPrice.toLocaleString("cs-CZ") + ' zl.</span>');
                    html.push('    <button class="btn-action-buy" style="background:#b45309; border-color:#f59e0b; padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="PRS_App.handleSellAssetFromArmory(\'node\', ' + bNode.id + ')">🏦 Prodat</button>');
                    html.push('  </div>');
                    html.push('</div>');
                }
            }
            grid.innerHTML = html.join("\n");
            return;
        }

        // 2. ZÁLOŽKA TAJEMNÉ BALÍČKY
        if (tab === "packs") {
            var packs = this.state.config.itemPackPrices;
            var packDefs = [
                { tier: 1, name: "Balíček Věci 1. stupně", icon: "🎒", price: packs.tier1, desc: "Základní rytířská výzbroj (tesáky, prošívané zbroje, kabátce, ostruhy)." },
                { tier: 2, name: "Balíček Věci 2. stupně", icon: "⚔️", price: packs.tier2, desc: "Turnajové dřevce, damaškové meče, plátová zbroj, brokátové róby." },
                { tier: 3, name: "Balíček Věci 3. stupně", icon: "👑", price: packs.tier3, desc: "Královské legendární předměty: Meč dračího bijce, zlatá zbroj, knížecí šat." }
            ];

            for (var p = 0; p < packDefs.length; p++) {
                var pk = packDefs[p];
                var canAfford = player.gold >= pk.price;

                html.push('<div class="armory-card armory-card-tier-' + pk.tier + '">');
                html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">');
                html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + pk.tier + '. STUPEŇ</span>');
                html.push('    <span style="font-size:0.8rem; color:#fde047; font-weight:bold;">' + pk.price.toLocaleString("cs-CZ") + ' zl.</span>');
                html.push('  </div>');
                html.push('  <div style="font-size:1.1rem; font-weight:bold; color:#fff; margin-bottom:0.35rem;">' + pk.icon + ' ' + pk.name + '</div>');
                html.push('  <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.85rem;">' + pk.desc + '</p>');
                html.push('  <div style="margin-top:auto;">');
                if (!canShop) {
                    html.push('    <button class="btn-secondary" disabled style="width:100%; opacity:0.45; font-size:0.82rem;">Jen u Obchodníka</button>');
                } else if (!canAfford) {
                    html.push('    <button class="btn-action-buy" disabled style="width:100%; opacity:0.4; font-size:0.82rem;">Nedostatek zlata</button>');
                } else {
                    html.push('    <button class="btn-action-buy" style="width:100%; font-size:0.85rem;" onclick="PRS_App.handleBuyPackFromArmory(' + pk.tier + ')">🎁 Koupit balíček (' + pk.price.toLocaleString("cs-CZ") + ' zl.)</button>');
                }
                html.push('  </div>');
                html.push('</div>');
            }
            grid.innerHTML = html.join("\n");
            return;
        }

        // 3. KATALOG JEDNOTLIVÝCH PŘEDMĚTŮ (Zbraně, Zbroje, Šaty, Klenoty)
        var items = window.PRS_ITEMS || [];
        var filtered = items.filter(function (it) {
            if (tab === "all") return it.slot !== "trophy";
            return it.slot === tab;
        });

        // Mapování vlastněných předmětů
        var ownedIds = {};
        for (var o = 0; o < player.items.length; o++) {
            ownedIds[player.items[o].id] = true;
        }

        for (var k = 0; k < filtered.length; k++) {
            var item = filtered[k];
            var isOwned = !!ownedIds[item.id];
            var canAfford = player.gold >= item.price;

            html.push('<div class="armory-card armory-card-tier-' + (item.tier || 1) + '">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
            html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light);">' + (item.tier || 1) + '. stupeň</span>');
            html.push('    <span class="armory-slot-badge">' + this.formatSlotLabel(item.slot, true) + '</span>');
            html.push('  </div>');

            html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.4rem;">' + item.icon + ' ' + this.escapeHtml(item.name) + '</div>');

            html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.3rem; margin-bottom:0.75rem;">');
            if (item.boj) html.push('<span class="armory-stat-chip ' + (item.boj > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (item.boj > 0 ? '+' : '') + item.boj + ' Boj</span>');
            if (item.jizda) html.push('<span class="armory-stat-chip ' + (item.jizda > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (item.jizda > 0 ? '+' : '') + item.jizda + ' Jízda</span>');
            if (item.tanec) html.push('<span class="armory-stat-chip ' + (item.tanec > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (item.tanec > 0 ? '+' : '') + item.tanec + ' Tanec</span>');
            if (item.charisma) html.push('<span class="armory-stat-chip ' + (item.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">👑 ' + (item.charisma > 0 ? '+' : '') + item.charisma + ' Charisma</span>');
            html.push('  </div>');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.06);">');
            html.push('    <span style="font-size:0.92rem; color:var(--gold-light); font-weight:bold;">' + item.price.toLocaleString("cs-CZ") + ' zl.</span>');

            if (isOwned) {
                html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.65; cursor:default;">✓ Vlastníš</button>');
            } else if (!canShop) {
                html.push('    <button class="btn-secondary" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.45;">Jen na trhu</button>');
            } else if (!canAfford) {
                html.push('    <button class="btn-action-buy" disabled style="padding:0.3rem 0.65rem; font-size:0.78rem; opacity:0.4;">Málo zlata</button>');
            } else {
                html.push('    <button class="btn-action-buy" style="padding:0.32rem 0.7rem; font-size:0.82rem;" onclick="PRS_App.handleBuySpecificItem(\'' + item.id + '\')">🛒 Koupit</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }

        grid.innerHTML = html.join("\n");
    },

    handleBuySpecificItem: function (itemId) {
        var bought = window.PRS_GameEngine.buySpecificItem(this.state, itemId);
        if (bought) {
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
            this.renderArmoryModalContent();
            this.renderGameScreen();
        }
    },

    handleBuyPackFromArmory: function (tier) {
        var bought = window.PRS_GameEngine.buyItemPack(this.state, tier);
        if (bought) {
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
            this.renderArmoryModalContent();
            this.renderGameScreen();
        }
    },

    handleSellAssetFromArmory: function (assetType, assetId) {
        var ok = window.PRS_GameEngine.sellAsset(this.state, assetType, assetId);
        if (ok) {
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
            this.renderArmoryModalContent();
            this.renderGameScreen();
        }
    },

    // --- PŘEPÍNÁNÍ ZÁLOŽEK ---
    activeTab: "lobby",
    rulesSubtab: "rules",
    bestiaryActiveTier: "all",
    trophiesActiveCategory: "all",
    currentLandingMedia: "anim",
    landingCanvasTimer: null,
    myOnlinePlayerIndex: -1,
    onlinePollingEnabled: true,
    onlinePollTimer: null,
    isOnlineSyncing: false,

    switchTab: function (tabId) {
        this.activeTab = tabId;
        var tabs = ["lobby", "board", "rules", "balance"];
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

    // --- LANDING PAGE INTERAKTIVNÍ PRVKY (VIDEO / ŽIVÁ ANIMACE / MEDAILONKY / MULTIPLAYER) ---
    switchLandingMedia: function (mode) {
        this.currentLandingMedia = (mode === "video") ? "video" : "anim";
        var animWrap = document.getElementById("lp-media-anim-wrap");
        var videoWrap = document.getElementById("lp-media-video-wrap");
        var btnAnim = document.getElementById("lp-tab-btn-anim");
        var btnVideo = document.getElementById("lp-tab-btn-video");
        var statusLbl = document.getElementById("lp-media-status-label");
        var vid = document.getElementById("lp-promo-video");

        if (this.currentLandingMedia === "video") {
            if (animWrap) animWrap.style.display = "none";
            if (videoWrap) videoWrap.style.display = "block";
            if (btnAnim) btnAnim.classList.remove("active");
            if (btnVideo) btnVideo.classList.add("active");
            if (statusLbl) statusLbl.textContent = "🎬 Video upoutávka: RuzeProDanielku.mp4";
            if (vid) {
                try { vid.play(); } catch (e) { }
            }
        } else {
            if (vid && !vid.paused) {
                try { vid.pause(); } catch (e) { }
            }
            if (videoWrap) videoWrap.style.display = "none";
            if (animWrap) animWrap.style.display = "block";
            if (btnVideo) btnVideo.classList.remove("active");
            if (btnAnim) btnAnim.classList.add("active");
            if (statusLbl) statusLbl.textContent = "✨ Plynulá ukázka herních medailonků, rytířů a slavností";
        }
    },

    inspectLandingMedallion: function (key, el) {
        var descriptions = {
            kun: "🐎 <strong>Šlechtický chov Koní (1 000 zl.):</strong> Kupuj hřebčíny po království. Čím více koní vlastníš, tím vyšší mýtné platí soupeři a tím vyšší rentu inkasuješ na Mýtě!",
            sokol: "🦅 <strong>Královský chov Sokolů (1 500 zl.):</strong> Vzácné lovecké ptactvo. Kompletní sada sokolů přináší obrovské mýtné od ostatních rytířů a zisk při průchodu Mýtem.",
            village: "🏡 <strong>Vesnice (2 000 zl. • příjem +300 zl.):</strong> Základ tvého feudálního panství. Kdykoliv vstoupíš na svou vesnici, můžeš ji povýšit na Město!",
            castle: "🏰 <strong>Hrad (povýšení za 4 000 zl. • příjem +1 200 zl.):</strong> Nedobytná pevnost šlechtice. Přináší královskou rentu a nejvyšší prestiž v celém království.",
            tavern: "🍺 <strong>Středověká Krčma:</strong> Místo odpočinku, sázek v kostkách a verbování družiny. Pozor však na příliš bujaré oslavy, ať neztratíš tah!",
            drak: "🐉 <strong>Doubrava Draka (Úkol 3. stupně):</strong> Ultimátní zkouška rytíře! Hoď kostkou + přičti svůj Boj. Při vítězství získáš <strong>4 000 zl. a +3 💖 Princeznina srdce</strong>!",
            festival: "💖 <strong>Královské slavnosti:</strong> Vrchol hry! Předveď princezně své 4 ctnosti (Boj, Jízdu, Tanec, Charisma) a proměň je v drahocenná <strong>Princeznina srdce 💖</strong>!"
        };
        var box = document.getElementById("lp-medallion-desc-box");
        if (box && descriptions[key]) {
            box.innerHTML = descriptions[key];
        }
        if (el && el.parentElement) {
            var items = el.parentElement.querySelectorAll(".lp-medallion-item");
            for (var i = 0; i < items.length; i++) {
                items[i].classList.remove("active");
            }
            el.classList.add("active");
        }
    },

    initLandingLiveCanvas: function () {
        var canvas = document.getElementById("lp-live-preview-canvas");
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext("2d");

        // Načtení klíčových textur pro živou animaci (již v cache prohlížeče)
        var bgImg = new Image();
        bgImg.src = "assets/board/parchment_board_bg.jpg";
        var castleImg = new Image();
        castleImg.src = "assets/landmarks/royal_castle.png";
        var tileSources = [
            { x: 95, y: 195, label: "Chov Koní", color: "#f59e0b", src: "assets/tiles/kun.jpg" },
            { x: 185, y: 115, label: "Vesnice", color: "#22c55e", src: "assets/tiles/village.jpg" },
            { x: 290, y: 175, label: "Krčma", color: "#fbbf24", src: "assets/tiles/tavern.jpg" },
            { x: 390, y: 95, label: "Hrad", color: "#38bdf8", src: "assets/tiles/castle.png" },
            { x: 475, y: 185, label: "Slavnosti 💖", color: "#ec4899", src: "assets/tiles/festival.jpg" }
        ];
        for (var i = 0; i < tileSources.length; i++) {
            var im = new Image();
            im.src = tileSources[i].src;
            tileSources[i].img = im;
        }

        var t = 0;
        var sparks = [];
        for (var s = 0; s < 22; s++) {
            sparks.push({
                x: Math.random() * 560,
                y: Math.random() * 290,
                r: 1.2 + Math.random() * 2.2,
                vy: -0.35 - Math.random() * 0.5,
                vx: (Math.random() - 0.5) * 0.4,
                alpha: 0.3 + Math.random() * 0.7
            });
        }

        var renderLoop = function () {
            t += 0.016;
            var w = canvas.width;
            var h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            // 1. Pozadí pergamenu s jemným pohybem kamery
            if (bgImg.complete && bgImg.naturalWidth > 0) {
                var panX = Math.sin(t * 0.35) * 18;
                var panY = Math.cos(t * 0.25) * 10;
                ctx.drawImage(bgImg, -25 + panX, -15 + panY, w + 50, h + 30);
            } else {
                ctx.fillStyle = "#1e150c";
                ctx.fillRect(0, 0, w, h);
            }

            // Ztmavující viněta pro kontrast
            var grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 40, w * 0.5, h * 0.5, w * 0.65);
            grad.addColorStop(0, "rgba(20, 14, 8, 0.25)");
            grad.addColorStop(1, "rgba(10, 7, 4, 0.78)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            // 2. Zlatá královská cesta propojující medailonky
            ctx.save();
            ctx.beginPath();
            for (var i = 0; i < tileSources.length; i++) {
                var nd = tileSources[i];
                if (i === 0) ctx.moveTo(nd.x, nd.y);
                else ctx.lineTo(nd.x, nd.y);
            }
            ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
            ctx.lineWidth = 6;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();

            ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -t * 22;
            ctx.stroke();
            ctx.restore();

            // 3. Kruhové medailonky políček
            for (var j = 0; j < tileSources.length; j++) {
                var tile = tileSources[j];
                var pulse = 1 + Math.sin(t * 2.2 + j) * 0.04;
                var rad = 29 * pulse;

                ctx.save();
                ctx.beginPath();
                ctx.arc(tile.x, tile.y, rad, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                if (tile.img && tile.img.complete && tile.img.naturalWidth > 0) {
                    ctx.drawImage(tile.img, tile.x - rad, tile.y - rad, rad * 2, rad * 2);
                } else {
                    ctx.fillStyle = "#2b1d10";
                    ctx.fillRect(tile.x - rad, tile.y - rad, rad * 2, rad * 2);
                }
                ctx.restore();

                // Zlatá obroučka
                ctx.beginPath();
                ctx.arc(tile.x, tile.y, rad, 0, Math.PI * 2);
                ctx.strokeStyle = tile.color;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Popisek pod medailonkem
                ctx.fillStyle = "rgba(15, 10, 6, 0.82)";
                ctx.fillRect(tile.x - 40, tile.y + rad + 4, 80, 16);
                ctx.fillStyle = "#fef08a";
                ctx.font = "bold 10px Outfit, sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(tile.label, tile.x, tile.y + rad + 15);
            }

            // 4. Animované figurky rytířů putující po cestě
            var segCount = tileSources.length - 1;
            var prog = (t * 0.42) % segCount;
            var segIdx = Math.floor(prog);
            var segFrac = prog - segIdx;
            var a = tileSources[segIdx];
            var b = tileSources[segIdx + 1];
            var kx = a.x + (b.x - a.x) * segFrac;
            var ky = a.y + (b.y - a.y) * segFrac - Math.abs(Math.sin(segFrac * Math.PI)) * 18;

            // Stín a žeton rytíře
            ctx.beginPath();
            ctx.arc(kx, ky, 13, 0, Math.PI * 2);
            ctx.fillStyle = "#dc2626";
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#fef08a";
            ctx.stroke();
            ctx.fillStyle = "#fff";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚔️", kx, ky + 4);

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

            requestAnimationFrame(renderLoop);
        };
        requestAnimationFrame(renderLoop);
    },

    quickStartSoloGame: function (preset) {
        var myName = (this.currentUser && this.currentUser.role !== "Guest" && this.currentUser.displayName)
            ? this.currentUser.displayName
            : "Lord Filip (Ty)";

        this.lobbyPlayers = [
            { name: myName, type: "Human" },
            { name: "Černý Baron (PC)", type: "Bot_Aggressive" },
            { name: "Zikmund z Chovu (PC)", type: "Bot_Breeder" },
            { name: "Kněžna Eliška (PC)", type: "Bot_Noble" }
        ];
        this.renderLobbyPlayers();

        var boardSel = document.getElementById("lobby-board-select");
        var targetSel = document.getElementById("lobby-target-hearts");

        if (preset === "fast") {
            if (boardSel) boardSel.value = "compact_48";
            if (targetSel) targetSel.value = "20";
        } else {
            if (boardSel) boardSel.value = "classic_96";
            if (targetSel) targetSel.value = "30";
        }

        this.startNewGame(true);
    },

    createOnlineMultiplayerRoom: function () {
        var self = this;
        this.startNewGame(false);
        if (!this.state) return;

        // Hostitel automaticky hraje za hráče č. 0
        this.myOnlinePlayerIndex = 0;
        if (this.state.players && this.state.players[0]) {
            this.state.players[0].isOnlineHost = true;
            this.state.players[0].type = "Human";
            var hostDispName = (this.currentUser && this.currentUser.displayName && this.currentUser.displayName !== "Královský Host")
                ? this.currentUser.displayName
                : (this.state.players[0].name.replace(" (Ty)", "") || "Lord Filip");
            this.state.players[0].name = hostDispName + " (Hostitel)";
        }

        var title = "Online stůl (" + (this.currentUser.displayName || "Královský Host") + ")";
        fetch("api.ashx?action=save-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                sessionGuid: this.state.sessionGuid || "",
                roomCode: this.state.roomCode || "",
                title: title,
                boardCode: this.state.config.boardCode || "classic_96",
                targetHearts: this.state.config.targetHearts || 30,
                turnNumber: this.state.turnNumber || 1,
                expectedTurnNumber: 0,
                stateJson: JSON.stringify(this.state)
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
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
                }
            })
            .catch(function () {
                self.switchTab("board");
            });
    },

    // --- UŽIVATELSKÝ ÚČET (Guest / Player / Admin) ---
    loadSavedUser: function () {
        try {
            var raw = localStorage.getItem("prs_user");
            if (raw) {
                this.currentUser = JSON.parse(raw);
            }
        } catch (e) { }
        this.updateUserUI();
    },

    updateUserUI: function () {
        var badgeEl = document.getElementById("user-status-badge");
        var nameStr = this.escapeHtml(this.currentUser.displayName || this.currentUser.username);
        var roleIcon = (this.currentUser.role === "Admin") ? "👑 Admin" : (this.currentUser.role === "Player" ? "🛡️ Hráč" : "👤 Host");
        if (badgeEl) {
            badgeEl.innerHTML = roleIcon + ": <strong>" + nameStr + "</strong>";
        }

        // Aktualizace uvítacího pásu na Landing Page
        var lpText = document.getElementById("lp-user-banner-text");
        var lpAct = document.getElementById("lp-user-banner-actions");
        if (lpText) {
            if (this.currentUser.role === "Guest") {
                lpText.innerHTML = "👤 <strong>Vstup bez bariér:</strong> Hraješ jako <strong>Královský Host</strong>. Můžeš ihned hrát proti PC nebo se připojit ke stolu přes kód.";
            } else {
                lpText.innerHTML = roleIcon + " <strong>Vítej v království, " + nameStr + "!</strong> Tvé rozehrané partie a statistiky jsou propojené s databází.";
            }
        }
        if (lpAct) {
            if (this.currentUser.role === "Guest") {
                lpAct.innerHTML = '<button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem;" onclick="PRS_App.openAuthModal()">🔑 Přihlásit se / Registrovat</button>';
            } else {
                lpAct.innerHTML = '<button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.7rem;" onclick="PRS_App.openAuthModal()">👤 Změnit účet / Odhlásit</button>';
            }
        }
    },

    openAuthModal: function () {
        var m = document.getElementById("auth-modal");
        if (m) m.style.display = "flex";
    },

    closeAuthModal: function () {
        var m = document.getElementById("auth-modal");
        if (m) m.style.display = "none";
    },

    setGuestMode: function () {
        this.currentUser = {
            id: null,
            username: "Host",
            displayName: "Královský Host",
            role: "Guest",
            token: null
        };
        localStorage.setItem("prs_user", JSON.stringify(this.currentUser));
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

    // --- LOBBY & NASTAVENÍ NOVÉ HRY ---
    renderLobbyPlayers: function () {
        var container = document.getElementById("lobby-players-list");
        if (!container) return;
        var html = "";
        for (var i = 0; i < this.lobbyPlayers.length; i++) {
            var p = this.lobbyPlayers[i];
            var col = window.PRS_GameEngine.PLAYER_COLORS[i % window.PRS_GameEngine.PLAYER_COLORS.length];
            html += '<div class="lobby-player-row">' +
                '<span class="player-color-dot" style="background:' + col.hex + '">' + col.badge + '</span>' +
                '<input type="text" class="prs-input" value="' + this.escapeHtml(p.name) + '" onchange="PRS_App.updateLobbyPlayerName(' + i + ', this.value)" />' +
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
        if (this.lobbyPlayers[idx]) this.lobbyPlayers[idx].name = val;
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
        var targetSel = document.getElementById("lobby-target-hearts");
        var boardCode = boardSel ? boardSel.value : "classic_96";
        var targetHearts = targetSel ? Number(targetSel.value) : this.activeConfig.targetHearts;

        this.state = window.PRS_GameEngine.createGame({
            config: this.activeConfig,
            boardCode: boardCode,
            targetHearts: targetHearts,
            players: this.lobbyPlayers
        });

        this.selectedNodeId = 0;
        this.lastKnownTurnNumber = 1;
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
    // ========================================================================
    renderGameScreen: function () {
        if (!this.state) return;
        this.renderOnlineRoomBar();
        this.renderHeartTrack();
        this.renderPlayersStandings();
        this.renderBoardSVG();
        this.renderStandingNodeCard();
        this.renderPlayersStandings();
        this.renderActivePlayerPanel();
        this.renderLowerKnightDetail();
        this.renderActionPanel();
        this.renderLogs();
        this.updateMobileDock();
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
            if (this.currentUser && this.currentUser.displayName && this.currentUser.displayName !== "Královský Host") {
                nameInput.value = this.currentUser.displayName;
            } else if (this.currentUser && this.currentUser.username && this.currentUser.username !== "Host (Nepřihlášený)") {
                nameInput.value = this.currentUser.username;
            } else if (!nameInput.value) {
                nameInput.value = "";
            }
        }

        this.renderOnlineRoleGrid();
        modal.style.display = "flex";
    },

    closeOnlineRoleModal: function () {
        var modal = document.getElementById("online-role-modal");
        if (modal) modal.style.display = "none";
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
            } else if (this.currentUser && this.currentUser.displayName && this.currentUser.displayName !== "Královský Host") {
                pl.name = this.currentUser.displayName;
            } else {
                pl.name = pl.name.replace(" (PC)", "").replace(" (Ty)", "");
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
        this.isOnlineSyncing = true;

        fetch("api.ashx?action=load-session&code=" + encodeURIComponent(this.state.roomCode))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                self.isOnlineSyncing = false;
                if (res && res.ok && res.session && res.session.stateJson) {
                    var remoteState = JSON.parse(res.session.stateJson);
                    if (!remoteState || !remoteState.players) return;

                    var localSig = (self.state.turnNumber || 1) + ":" + self.state.currentPlayerIndex + ":" + self.state.phase + ":" + (self.state.logs ? self.state.logs.length : 0);
                    var remoteSig = (remoteState.turnNumber || 1) + ":" + remoteState.currentPlayerIndex + ":" + remoteState.phase + ":" + (remoteState.logs ? remoteState.logs.length : 0);

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
    },

    renderHeartTrack: function () {
        var raceEl = document.getElementById("princess-race-container");
        var el = document.getElementById("heart-track-bar");
        if (!this.state) return;
        var target = this.state.config.targetHearts;
        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;

        // 1. Závod o Princeznino srdce (Race Track)
        if (raceEl) {
            var raceHtml = '<div class="princess-race-header">' +
                '<span>🏆 ZÁVOD O PRINCEZNINO SRDCE</span>' +
                '<span style="color:#f472b6;">Cíl: ' + target + ' ❤️</span>' +
                '</div>' +
                '<div class="princess-race-track">' +
                '  <div class="race-milestones">';
            
            var stepCount = 5;
            for (var m = 0; m <= stepCount; m++) {
                var stepVal = Math.round((target / stepCount) * m);
                raceHtml += '<div class="race-milestone"><div class="race-milestone-tick"></div><span>' + stepVal + ' ❤️</span></div>';
            }
            raceHtml += '  </div>';

            for (var rIdx = 0; rIdx < this.state.players.length; rIdx++) {
                var plTrack = this.state.players[rIdx];
                var isActTrack = (rIdx === this.state.currentPlayerIndex);
                var isInspTrack = (rIdx === inspIdx);
                var pctTrack = Math.min(94, Math.max(3, (plTrack.totalHearts / target) * 88 + 3));
                raceHtml += '<div class="race-token ' + (isInspTrack ? 'inspected-race-token' : '') + '" ' +
                    'style="left:' + pctTrack + '%;background:' + plTrack.color + ';border-color:' + (isActTrack ? '#fbbf24' : (isInspTrack ? '#38bdf8' : '#ffffff')) + ';box-shadow:0 0 ' + (isActTrack ? '14px #fbbf24' : (isInspTrack ? '12px #38bdf8' : '6px rgba(0,0,0,0.6)')) + '; cursor:pointer;" ' +
                    'onclick="PRS_App.selectPlayerToInspect(' + rIdx + ')" ' +
                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + rIdx + ')" ' +
                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                    'title="' + this.escapeHtml(plTrack.name) + ': ' + plTrack.totalHearts + ' ❤️ (' + plTrack.gold.toLocaleString("cs-CZ") + ' zl.) - Klepni pro zobrazení statistik">' + (rIdx + 1) + '</div>';
            }

            raceHtml += '  <div class="race-finish-crown" title="Královský hrad &amp; Princezna">👑🏰</div>' +
                '</div>';
            raceEl.innerHTML = raceHtml;
        }

        // 2. Detailní karty rytířů u stolu (kliknutím nebo najetím se zobrazí statistiky)
        if (el) {
            var html = "";
            for (var i = 0; i < this.state.players.length; i++) {
                var p = this.state.players[i];
                var isCurrent = (i === this.state.currentPlayerIndex);
                var isInspected = (i === inspIdx);
                var pct = Math.min(100, Math.round((p.totalHearts / target) * 100));
                html += '<div class="heart-player-pill ' + (isCurrent ? 'active-turn' : '') + ' ' + (isInspected ? 'inspected-player' : '') + '" ' +
                    'style="border-color:' + p.color + ';" ' +
                    'onclick="PRS_App.selectPlayerToInspect(' + i + ')" ' +
                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + i + ')" ' +
                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                    'title="Kliknutím zobrazíš podrobné statistiky a výbavu rytíře ' + this.escapeHtml(p.name) + '">' +
                    '<div class="hp-header">' +
                    '  <span class="hp-name-wrap">' + p.badge + ' <strong class="hp-name-txt">' + this.escapeHtml(p.name) + '</strong> ' + (p.type !== "Human" ? '<small class="bot-tag">PC</small>' : '<small class="bot-tag" style="background:#0284c7;color:#fff;">Hráč</small>') + (isInspected ? ' <span style="font-size:0.72rem; color:#fde047; font-weight:600; margin-left:4px;">👁️ Zobrazen</span>' : '') + '</span>' +
                    '  <span class="hp-hearts">' + p.totalHearts + ' / ' + target + ' ❤️</span>' +
                    '</div>' +
                    '<div class="hp-progress-bg"><div class="hp-progress-fill" style="width:' + pct + '%;background:' + p.color + '"></div></div>' +
                    '<div class="hp-sub">' +
                    '  <span>💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</span>' +
                    '  <span>🐎 Chov: +' + p.breedingHearts + ' ❤️</span>' +
                    '  <span>⚔️' + p.skills.boj + ' 🏇' + p.skills.jizda + ' 💃' + p.skills.tanec + ' 👑' + p.skills.charisma + '</span>' +
                    '</div>' +
                    '</div>';
            }
            el.innerHTML = html;
        }
        this.renderLowerKnightDetail();
    },

    getBoardDefsSVG: function () {
        var th = this.currentTheme || "light";
        var themePalettes = {
            light: { c0: "#fef08a", c1: "#d4af37", c2: "#854d0e", stroke: "#d4af37", glow: "rgba(250,204,21,0.55)" },
            fire:  { c0: "#fed7aa", c1: "#f97316", c2: "#9a3412", stroke: "#ea580c", glow: "rgba(239,68,68,0.65)" },
            water: { c0: "#bae6fd", c1: "#38bdf8", c2: "#0369a1", stroke: "#0284c7", glow: "rgba(14,165,233,0.65)" },
            earth: { c0: "#a7f3d0", c1: "#10b981", c2: "#065f46", stroke: "#059669", glow: "rgba(34,197,94,0.65)" },
            air:   { c0: "#ede9fe", c1: "#c084fc", c2: "#6b21a8", stroke: "#9333ea", glow: "rgba(168,85,247,0.65)" }
        };
        var activePalette = themePalettes[th] || themePalettes.light;

        return '<defs>' +
            '<radialGradient id="parchmentGrad" cx="50%" cy="48%" r="72%">' +
            '  <stop offset="0%" stop-color="#32261b" />' +
            '  <stop offset="65%" stop-color="#221a12" />' +
            '  <stop offset="100%" stop-color="#140f0a" />' +
            '</radialGradient>' +
            '<linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '  <stop offset="0%" stop-color="' + activePalette.c0 + '" />' +
            '  <stop offset="50%" stop-color="' + activePalette.c1 + '" />' +
            '  <stop offset="100%" stop-color="' + activePalette.c2 + '" />' +
            '</linearGradient>' +
            '<linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '  <stop offset="0%" stop-color="#cbd5e1" />' +
            '  <stop offset="50%" stop-color="#64748b" />' +
            '  <stop offset="100%" stop-color="#1e293b" />' +
            '</linearGradient>' +
            '<filter id="glowFilter" x="-25%" y="-25%" width="150%" height="150%">' +
            '  <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#000" flood-opacity="0.78"/>' +
            '</filter>' +
            '<radialGradient id="vignetteMaskGrad" cx="50%" cy="50%" r="50%">' +
            '  <stop offset="65%" stop-color="#ffffff" stop-opacity="1" />' +
            '  <stop offset="85%" stop-color="#ffffff" stop-opacity="0.75" />' +
            '  <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />' +
            '</radialGradient>' +
            '<mask id="vignetteMask" maskContentUnits="objectBoundingBox">' +
            '  <rect x="0" y="0" width="1" height="1" rx="0.1" fill="url(#vignetteMaskGrad)" />' +
            '</mask>' +
            '<clipPath id="clipNormalTile" clipPathUnits="objectBoundingBox">' +
            '  <circle cx="0.5" cy="0.5" r="0.5" />' +
            '</clipPath>' +
            '</defs>';
    },

    renderBoardSVG: function () {
        var svg = document.getElementById("prs-board-svg");
        if (!svg || !this.state) return;

        var stage = document.getElementById("prs-board-stage");
        var staticLayer = document.getElementById("prs-static-layer");
        var tokensLayer = document.getElementById("prs-tokens-layer");

        if (!stage || !staticLayer || !tokensLayer) {
            var wrap = document.getElementById("board-viewport-wrap");
            var svgRatioX = 1400 / Math.max(1, wrap ? wrap.clientWidth : 1000);
            var svgRatioY = 860 / Math.max(1, wrap ? wrap.clientHeight : 620);
            var tx = Math.round(this.viewport.panX * svgRatioX * 10) / 10;
            var ty = Math.round(this.viewport.panY * svgRatioY * 10) / 10;

            svg.innerHTML = this.getBoardDefsSVG() +
                '<g id="prs-board-stage" transform="translate(' + tx + ',' + ty + ') scale(' + this.viewport.scale.toFixed(3) + ')">' +
                '  <g id="prs-static-layer"></g>' +
                '  <g id="prs-tokens-layer"></g>' +
                '</g>';
            staticLayer = document.getElementById("prs-static-layer");
            tokensLayer = document.getElementById("prs-tokens-layer");
        } else {
            var defsEl = svg.querySelector("defs");
            if (defsEl) {
                var tempDiv = document.createElement("div");
                tempDiv.innerHTML = '<svg>' + this.getBoardDefsSVG() + '</svg>';
                var newDefs = tempDiv.querySelector("defs");
                if (newDefs) defsEl.innerHTML = newDefs.innerHTML;
            }
        }

        if (staticLayer) {
            staticLayer.innerHTML = this.renderBoardStaticHTML();
        }
        this.renderBoardTokens();
    },

    renderBoardTokens: function () {
        var tokensLayer = document.getElementById("prs-tokens-layer");
        if (!tokensLayer || !this.state) return;
        tokensLayer.innerHTML = this.renderBoardTokensHTML();
    },

    renderBoardStaticHTML: function () {
        var nodes = this.state.board.nodes;
        var cardZones = this.state.board.cardZones || [];
        var landmarks = this.state.board.landmarks || [];
        var out = [];

        var th = this.currentTheme || "light";
        var themePalettes = {
            light: { stroke: "#d4af37" },
            fire:  { stroke: "#ea580c" },
            water: { stroke: "#0284c7" },
            earth: { stroke: "#059669" },
            air:   { stroke: "#9333ea" }
        };
        var activePalette = themePalettes[th] || themePalettes.light;

        // 1. Podklad herní desky (pergamen nebo vlastní bitmapa)
        out.push('  <rect x="0" y="0" width="1400" height="860" rx="22" fill="url(#parchmentGrad)" stroke="' + activePalette.stroke + '" stroke-width="3.5"/>');
        if (this.graphicsConfig && this.graphicsConfig.boardBgUrl) {
            out.push('  <image href="' + this.escapeHtml(this.graphicsConfig.boardBgUrl) + '" x="4" y="4" width="1392" height="852" preserveAspectRatio="xMidYMid slice" opacity="0.88" style="filter: var(--board-filter, none);" />');
        }

        // Rohové kování desky
        var corners = [[18, 18], [1382, 18], [18, 842], [1382, 842]];
        for (var ci = 0; ci < corners.length; ci++) {
            var ccx = corners[ci][0];
            var ccy = corners[ci][1];
            out.push('  <circle cx="' + ccx + '" cy="' + ccy + '" r="7" fill="' + activePalette.stroke + '" stroke="#000" stroke-width="1.2"/>');
            out.push('  <circle cx="' + ccx + '" cy="' + ccy + '" r="2" fill="#fff" opacity="0.8"/>');
        }

        // Skládací přehyby trojdílného plánu
        out.push('  <line x1="466" y1="16" x2="466" y2="844" stroke="rgba(212,175,55,0.14)" stroke-width="1.5" stroke-dasharray="8,8" />');
        out.push('  <line x1="933" y1="16" x2="933" y2="844" stroke="rgba(212,175,55,0.14)" stroke-width="1.5" stroke-dasharray="8,8" />');
        out.push('  <rect x="14" y="14" width="1372" height="832" rx="16" fill="none" stroke="rgba(212,175,55,0.25)" stroke-width="1.5"/>');

        // 2. Balíčky karet na plánu
        for (var cz = 0; cz < cardZones.length; cz++) {
            var z = cardZones[cz];
            out.push('  <g class="board-card-zone" transform="translate(' + z.x + ',' + z.y + ')">');
            out.push('    <rect x="0" y="0" width="' + z.w + '" height="' + z.h + '" rx="10" fill="rgba(20,16,12,0.58)" stroke="rgba(212,175,55,0.42)" stroke-width="1.6" stroke-dasharray="5,3"/>');
            out.push('    <rect x="5" y="5" width="' + (z.w - 10) + '" height="' + (z.h - 10) + '" rx="7" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.18)" stroke-width="1"/>');
            out.push('    <text x="' + (z.w / 2) + '" y="' + (z.h / 2 - 4) + '" text-anchor="middle" fill="#f3e5ab" font-family="Cinzel, serif" font-size="14" font-weight="bold">' + this.escapeHtml(z.title) + '</text>');
            out.push('    <text x="' + (z.w / 2) + '" y="' + (z.h / 2 + 15) + '" text-anchor="middle" fill="#a8a29e" font-size="10.5">' + this.escapeHtml(z.subtitle) + '</text>');
            out.push('  </g>');
        }

        // 3. Dominanty království (Královský Hrad, Drak, Hrady a Citadely)
        for (var lm = 0; lm < landmarks.length; lm++) {
            var lmk = landmarks[lm];
            var customLmUrl = lmk.image || ((this.graphicsConfig && this.graphicsConfig.landmarkBitmaps && this.graphicsConfig.landmarkBitmaps[lmk.id]) ? this.graphicsConfig.landmarkBitmaps[lmk.id] : "");
            if (customLmUrl && customLmUrl.indexOf(".jpg") !== -1) {
                customLmUrl = customLmUrl.replace(".jpg", ".png");
            }
            // Zrcadlení draka a dominant pokud stojí na pravé polovině plánu (pohled do středu)
            if ((lmk.x > 700 || lmk.isFlipped) && customLmUrl && customLmUrl.indexOf("_flip") === -1) {
                if (customLmUrl.indexOf("dragon") !== -1 || lmk.id === "dragonLair") {
                    customLmUrl = customLmUrl.replace(".png", "_flip.png");
                }
            }

            out.push('  <g class="board-landmark" transform="translate(' + (lmk.x - lmk.w / 2) + ',' + (lmk.y - lmk.h / 2) + ')">');
            if (customLmUrl) {
                // Průsvitná 3D izometrická ilustrace hradu nebo draka (přirozeně posazená na mapě bez plovoucího stínu)
                out.push('    <image href="' + this.escapeHtml(customLmUrl) + '" x="0" y="0" width="' + lmk.w + '" height="' + (lmk.h - 10) + '" preserveAspectRatio="xMidYMid contain"/>');

                if (lmk.id === "royalCastle") {
                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', 22)">');
                    out.push('      <circle cx="0" cy="0" r="14" fill="rgba(236,72,153,0.3)" stroke="#ec4899" stroke-width="1.4">');
                    out.push('        <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite"/>');
                    out.push('        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>');
                    out.push('      </circle>');
                    out.push('      <text x="0" y="5" text-anchor="middle" font-size="14">💖</text>');
                    out.push('    </g>');
                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', ' + (lmk.h - 14) + ')">');
                    out.push('      <rect x="-115" y="-13" width="230" height="26" rx="13" fill="rgba(18,12,8,0.92)" stroke="' + activePalette.stroke + '" stroke-width="1.6" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.7))"/>');
                    out.push('      <text x="0" y="5" text-anchor="middle" fill="#f472b6" font-size="11.5" font-weight="bold">♡ PRINCEZNINO SRDCE (' + this.state.config.targetHearts + ' 💖) ♡</text>');
                    out.push('    </g>');
                } else {
                    out.push('    <g transform="translate(' + (lmk.w / 2) + ', ' + (lmk.h - 12) + ')">');
                    out.push('      <rect x="-85" y="-11" width="170" height="22" rx="11" fill="rgba(16,10,6,0.90)" stroke="' + activePalette.stroke + '" stroke-width="1.2" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.7))"/>');
                    out.push('      <text x="0" y="4" text-anchor="middle" fill="#fef08a" font-family="Cinzel, serif" font-size="10" font-weight="bold">' + this.escapeHtml(lmk.name) + '</text>');
                    out.push('    </g>');
                }
            } else if (lmk.id === "royalCastle") {
                out.push('    <rect x="10" y="18" width="' + (lmk.w - 20) + '" height="' + (lmk.h - 24) + '" rx="16" fill="rgba(36,27,19,0.82)" stroke="rgba(212,175,55,0.48)" stroke-width="2"/>');
                out.push('    <polygon points="35,45 55,10 75,45" fill="#991b1b" stroke="#d4af37" stroke-width="1.5"/>');
                out.push('    <polygon points="' + (lmk.w / 2 - 28) + ',42 ' + (lmk.w / 2) + ',2 ' + (lmk.w / 2 + 28) + ',42" fill="#b91c1c" stroke="#d4af37" stroke-width="1.8"/>');
                out.push('    <polygon points="' + (lmk.w - 75) + ',45 ' + (lmk.w - 55) + ',10 ' + (lmk.w - 35) + ',45" fill="#991b1b" stroke="#d4af37" stroke-width="1.5"/>');
                out.push('    <text x="' + (lmk.w / 2) + '" y="76" text-anchor="middle" font-size="36">🏰</text>');
                out.push('    <text x="' + (lmk.w / 2) + '" y="102" text-anchor="middle" fill="#f3e5ab" font-family="Cinzel, serif" font-size="14" font-weight="bold">KRÁLOVSKÝ HRAD</text>');
                out.push('    <text x="' + (lmk.w / 2) + '" y="121" text-anchor="middle" fill="#f472b6" font-size="11.5" font-weight="bold">♡ PRINCEZNINO SRDCE (' + this.state.config.targetHearts + ' 💖) ♡</text>');
            } else {
                out.push('    <rect x="4" y="4" width="' + (lmk.w - 8) + '" height="' + (lmk.h - 8) + '" rx="12" fill="rgba(28,22,16,0.65)" stroke="rgba(212,175,55,0.32)" stroke-width="1.4"/>');
                out.push('    <text x="' + (lmk.w / 2) + '" y="' + (lmk.h / 2 + 2) + '" text-anchor="middle" font-size="28">' + lmk.icon + '</text>');
                out.push('    <text x="' + (lmk.w / 2) + '" y="' + (lmk.h - 10) + '" text-anchor="middle" fill="#e7e5e4" font-family="Cinzel, serif" font-size="10" font-weight="bold">' + this.escapeHtml(lmk.name) + '</text>');
            }
            out.push('  </g>');
        }

        // 4. Organické dlážděné Bézierovy cesty, směrové šipky a heraldické milníky
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            var targets = [];
            if (n.branchLow !== null && n.branchLow !== undefined && n.branchHigh !== null && n.branchHigh !== undefined) {
                targets.push({ id: n.branchLow, label: "1–3", color: "#38bdf8", isBranch: true });
                targets.push({ id: n.branchHigh, label: "4–6", color: "#f59e0b", isBranch: true });
            } else if (n.next && n.next.length > 0) {
                targets.push({ id: n.next[0], label: null, color: "#d4af37", isBranch: false });
            }

            for (var t = 0; t < targets.length; t++) {
                var targetNode = nodes[targets[t].id];
                if (!targetNode) continue;

                var dx = targetNode.x - n.x;
                var dy = targetNode.y - n.y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) continue;

                var mx = (n.x + targetNode.x) / 2;
                var my = (n.y + targetNode.y) / 2;

                var perpX = -dy / dist;
                var perpY = dx / dist;

                var toCenterX = 700 - mx;
                var toCenterY = 430 - my;
                var dotCenter = perpX * toCenterX + perpY * toCenterY;

                var curveSign = (dotCenter >= 0 ? 1 : -1);
                if (targets[t].isBranch) curveSign = -curveSign;
                var bend = Math.min(10, Math.max(3, dist * 0.065)) * curveSign;

                var qx = Math.round((mx + perpX * bend) * 10) / 10;
                var qy = Math.round((my + perpY * bend) * 10) / 10;

                var pthD = 'M ' + n.x + ' ' + n.y + ' Q ' + qx + ' ' + qy + ' ' + targetNode.x + ' ' + targetNode.y;

                // 1. Spodní stín/příkop cesty
                out.push('  <path d="' + pthD + '" stroke="rgba(12,9,6,0.88)" stroke-width="13" stroke-linecap="round" fill="none"/>');
                // 2. Kamenný dlážděný pruh
                out.push('  <path d="' + pthD + '" stroke="rgba(180,140,85,0.48)" stroke-width="8.5" stroke-linecap="round" fill="none"/>');
                // 3. Vnitřní vyježděná stopa
                var trackColor = targets[t].isBranch ? targets[t].color : 'rgba(253,224,71,0.52)';
                var trackWidth = targets[t].isBranch ? '3.5' : '4.2';
                var trackDash = targets[t].isBranch ? '4,4' : '6,5';
                out.push('  <path d="' + pthD + '" stroke="' + trackColor + '" stroke-width="' + trackWidth + '" stroke-dasharray="' + trackDash + '" stroke-linecap="round" fill="none"/>');

                // Bod uprostřed křivky (t = 0.5)
                var midCurveX = Math.round(0.25 * n.x + 0.5 * qx + 0.25 * targetNode.x);
                var midCurveY = Math.round(0.25 * n.y + 0.5 * qy + 0.25 * targetNode.y);
                var angle = Math.round(Math.atan2(targetNode.y - n.y, targetNode.x - n.x) * 180 / Math.PI);

                // Směrové šipky na běžných cestách
                if (!targets[t].isBranch && dist > 35) {
                    out.push('  <g transform="translate(' + midCurveX + ',' + midCurveY + ') rotate(' + angle + ')">');
                    out.push('    <polygon points="-4,-3 3,0 -4,3" fill="rgba(253,224,71,0.85)" stroke="#78350f" stroke-width="0.7"/>');
                    out.push('  </g>');
                }

                // Heraldický milník rozcestníku (1–3 vs 4–6)
                if (targets[t].label) {
                    out.push('  <g transform="translate(' + midCurveX + ',' + midCurveY + ')">');
                    out.push('    <rect x="-18" y="-9.5" width="36" height="19" rx="5" fill="#14100c" stroke="' + targets[t].color + '" stroke-width="1.4" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.8));"/>');
                    out.push('    <text x="0" y="3.8" text-anchor="middle" fill="' + targets[t].color + '" font-size="9" font-weight="bold">' + (targets[t].label === "1–3" ? '⚀⚁⚂ ' : '⚃⚄⚅ ') + targets[t].label + '</text>');
                    out.push('  </g>');
                }
            }
        }

        // Zvýraznění poslední ušlé cesty aktivního hráče s organickým Bézierovým průhybem
        if (this.state.lastPath && this.state.lastPath.length > 1) {
            for (var pIdx = 0; pIdx < this.state.lastPath.length - 1; pIdx++) {
                var nA = nodes[this.state.lastPath[pIdx]];
                var nB = nodes[this.state.lastPath[pIdx + 1]];
                if (nA && nB) {
                    var ldx = nB.x - nA.x;
                    var ldy = nB.y - nA.y;
                    var ldist = Math.sqrt(ldx * ldx + ldy * ldy);
                    var lmx = (nA.x + nB.x) / 2;
                    var lmy = (nA.y + nB.y) / 2;
                    var lperpX = -ldy / (ldist || 1);
                    var lperpY = ldx / (ldist || 1);
                    var ltoCenterX = 700 - lmx;
                    var ltoCenterY = 430 - lmy;
                    var ldot = lperpX * ltoCenterX + lperpY * ltoCenterY;
                    var lbend = Math.min(10, Math.max(3, ldist * 0.065)) * (ldot >= 0 ? 1 : -1);
                    var lqx = Math.round((lmx + lperpX * lbend) * 10) / 10;
                    var lqy = Math.round((lmy + lperpY * lbend) * 10) / 10;
                    out.push('  <path d="M ' + nA.x + ' ' + nA.y + ' Q ' + lqx + ' ' + lqy + ' ' + nB.x + ' ' + nB.y + '" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round" fill="none" opacity="0.9"/>');
                }
            }
        }

        // 4b. Dynamické dekorace krajiny (stromy, hájky, skály, mlýny, chalupy, pastviny, stany)
        if (this.state.board && this.state.board.decorations && this.state.board.decorations.length > 0) {
            out.push('  <g id="prs-decor-layer">');
            var decs = this.state.board.decorations;
            for (var d = 0; d < decs.length; d++) {
                var dec = decs[d];
                var cat = window.PRS_DECOR_CATALOG ? window.PRS_DECOR_CATALOG[dec.catalogId] : null;
                var decorUrl = (this.graphicsConfig && this.graphicsConfig.decorBitmaps && this.graphicsConfig.decorBitmaps[dec.catalogId])
                    ? this.graphicsConfig.decorBitmaps[dec.catalogId]
                    : (cat ? (dec.isFlipped && cat.imgFlip ? cat.imgFlip : cat.img) : "");

                if (decorUrl) {
                    if (dec.isFlipped && decorUrl.indexOf("_flip") === -1 && cat && cat.imgFlip) {
                        decorUrl = cat.imgFlip;
                    }
                    var sc = dec.scale || 1;
                    out.push('    <g class="board-decor-item" data-catalog-id="' + dec.catalogId + '" transform="translate(' + dec.x + ',' + dec.y + ') scale(' + sc + ')">');
                    out.push('      <image href="' + this.escapeHtml(decorUrl) + '" x="' + (-dec.w / 2) + '" y="' + (-dec.h / 2) + '" width="' + dec.w + '" height="' + dec.h + '" preserveAspectRatio="xMidYMid contain"/>');
                    out.push('    </g>');
                } else if (cat && cat.renderSVG) {
                    var sc = dec.scale || 1;
                    out.push('    <g class="board-decor-item" data-catalog-id="' + dec.catalogId + '" transform="translate(' + dec.x + ',' + dec.y + ') scale(' + sc + ')">');
                    out.push(cat.renderSVG());
                    out.push('    </g>');
                }
            }
            out.push('  </g>');
        }

        // 5. Tvarově odlišená herní políčka (erby, osmiúhelníky, kosočtverce, pečetě, stuhy zvířat a praporky)
        for (var j = 0; j < nodes.length; j++) {
            var nd = nodes[j];
            var fill = this.getNodeFillColor(nd);
            var stroke = "url(#goldRimGrad)";
            var strokeWidth = 2.0;

            var activePlayer = (this.state.players && this.state.players[this.state.currentPlayerIndex]) ? this.state.players[this.state.currentPlayerIndex] : null;
            var isCurrentPlayerStandingTile = (activePlayer && nd.id === activePlayer.nodeId);
            var isInspectedTile = (this.selectedNodeId !== null && nd.id === this.selectedNodeId && !isCurrentPlayerStandingTile);

            if (nd.owner !== null && this.state.players[nd.owner]) {
                stroke = this.state.players[nd.owner].color;
                strokeWidth = 3.6;
            }
            if (isInspectedTile) {
                stroke = "#38bdf8";
                strokeWidth = 4.0;
            }
            if (isCurrentPlayerStandingTile) {
                stroke = "#fbbf24";
                strokeWidth = 4.2;
            }

            var isMajor = (nd.type === "START" || nd.type === "FESTIVAL" || nd.type === "CASTLE" || (nd.type === "QUEST" && nd.subtype === "U3"));
            var r = isMajor ? 21 : 16.5;
            var bmpUrl = this.getTileBitmapUrl(nd);
            var shortCode = nd.code.replace("BLD_", "").replace("SLAV_", "").replace("_OUT", "").replace("_BR1", "").replace("_BR2", "").replace("_R1", "").replace("_R2", "").replace("_L1", "");

            out.push('  <g class="board-node" style="cursor:pointer" onclick="PRS_App.handleNodeClick(' + nd.id + ')" onmouseenter="PRS_App.handleNodeMouseEnter(event, ' + nd.id + ')" onmouseleave="PRS_App.handleNodeMouseLeave()" onmousemove="PRS_App.handleNodeMouseMove(event)">');

            // Pulzující zlatý lem a štítek "ZDE STOJÍŠ" pro políčko aktivního hráče
            if (isCurrentPlayerStandingTile) {
                out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 7.5) + '" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="5,3" opacity="0.95">');
                out.push('      <animateTransform attributeName="transform" type="rotate" from="0 ' + nd.x + ' ' + nd.y + '" to="360 ' + nd.x + ' ' + nd.y + '" dur="12s" repeatCount="indefinite"/>');
                out.push('    </circle>');
                out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 4) + '" fill="none" stroke="#f59e0b" stroke-width="2" opacity="0.9"/>');
                out.push('    <g transform="translate(' + nd.x + ',' + (nd.y - r - 15) + ')">');
                out.push('      <rect x="-24" y="-12" width="48" height="15" rx="5" fill="#b45309" stroke="#fbbf24" stroke-width="1.2"/>');
                out.push('      <text x="0" y="-1" text-anchor="middle" fill="#fff" font-size="8.5" font-weight="bold">ZDE STOJÍŠ</text>');
                out.push('      <polygon points="-4,3 0,7 4,3" fill="#fbbf24"/>');
                out.push('    </g>');
            } else if (isInspectedTile) {
                out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r + 5.5) + '" fill="none" stroke="#38bdf8" stroke-width="2.6" stroke-dasharray="4,2"/>');
            }

            // Tvarová geometrie políčka (Silueta)
            out.push(this.renderNodeSilhouette(nd, r, fill, stroke, strokeWidth, isMajor, shortCode, bmpUrl));

            // Vizuální vývoj panství u vesnic (Úroveň 1: došková chalupa, Úroveň 2: kamenný statek, Úroveň 3: opevněná tvrz)
            if (nd.type === "VILLAGE") {
                var lvl = nd.villageLevel || 1;
                if (lvl === 1) {
                    out.push('    <polygon points="' + (nd.x - 14) + ',' + (nd.y - r - 1) + ' ' + nd.x + ',' + (nd.y - r - 12) + ' ' + (nd.x + 14) + ',' + (nd.y - r - 1) + '" fill="#b45309" stroke="#fcd34d" stroke-width="1.1"/>');
                } else if (lvl === 2) {
                    out.push('    <polygon points="' + (nd.x - 15) + ',' + (nd.y - r - 1) + ' ' + nd.x + ',' + (nd.y - r - 14) + ' ' + (nd.x + 15) + ',' + (nd.y - r - 1) + '" fill="#991b1b" stroke="#fef08a" stroke-width="1.2"/>');
                    out.push('    <rect x="' + (nd.x + 6) + '" y="' + (nd.y - r - 19) + '" width="3.5" height="6.5" fill="#57534e" stroke="#292524" stroke-width="0.6"/>');
                } else if (lvl >= 3) {
                    out.push('    <rect x="' + (nd.x - 14) + '" y="' + (nd.y - r - 15) + '" width="28" height="15" fill="#334155" stroke="#fbbf24" stroke-width="1.2"/>');
                    out.push('    <polygon points="' + (nd.x - 14) + ',' + (nd.y - r - 15) + ' ' + (nd.x - 10) + ',' + (nd.y - r - 19) + ' ' + (nd.x - 6) + ',' + (nd.y - r - 15) + ' ' + (nd.x - 2) + ',' + (nd.y - r - 19) + ' ' + (nd.x + 2) + ',' + (nd.y - r - 15) + ' ' + (nd.x + 6) + ',' + (nd.y - r - 19) + ' ' + (nd.x + 10) + ',' + (nd.y - r - 15) + ' ' + (nd.x + 14) + ',' + (nd.y - r - 19) + ' ' + (nd.x + 14) + ',' + (nd.y - r - 15) + '" fill="#cbd5e1"/>');
                }
                if (nd.owner !== null) {
                    var stars = "★".repeat(lvl);
                    out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r + 13) + ')">');
                    out.push('      <rect x="-16" y="-7" width="32" height="13" rx="4" fill="rgba(20,14,10,0.85)" stroke="#fbbf24" stroke-width="0.8"/>');
                    out.push('      <text x="0" y="3" text-anchor="middle" fill="#fbbf24" font-size="9.5" font-weight="bold">' + stars + '</text>');
                    out.push('    </g>');
                }
            }

            // 3D Vlající praporek vlastnictví u obsazených políček v barvě daného hráče
            if (nd.owner !== null && this.state.players[nd.owner]) {
                var ownerP = this.state.players[nd.owner];
                out.push('    <g class="tile-ownership-flag" transform="translate(' + (nd.x + r - 3) + ',' + (nd.y - r - 8) + ')">');
                out.push('      <line x1="0" y1="-2" x2="0" y2="25" stroke="#fcd34d" stroke-width="2" stroke-linecap="round"/>');
                out.push('      <line x1="-0.8" y1="-2" x2="-0.8" y2="25" stroke="#78350f" stroke-width="0.8"/>');
                out.push('      <polygon points="0,-6 -2.5,-1 2.5,-1" fill="#fde047" stroke="#b45309" stroke-width="0.6"/>');
                out.push('      <path d="M 0 0 C 6 -3, 12 3, 19 0 L 15 7 L 19 14 C 12 11, 6 17, 0 14 Z" fill="' + ownerP.color + '" stroke="#ffffff" stroke-width="1.1" style="filter:drop-shadow(0 3px 3px rgba(0,0,0,0.7));"/>');
                out.push('      <path d="M 0 0 C 6 -3, 12 3, 19 0 L 15 3.5 L 0 3.5 Z" fill="rgba(255,255,255,0.25)"/>');
                out.push('      <text x="8" y="9.5" text-anchor="middle" fill="#ffffff" font-size="7.5" font-weight="bold" font-family="Cinzel, serif">' + (ownerP.index + 1) + '</text>');
                out.push('    </g>');
            }

            out.push('  </g>');
        }

        return out.join("\n");
    },

    renderBoardTokensHTML: function () {
        var nodes = this.state.board.nodes;
        var out = [];

        var playersByNode = {};
        for (var k = 0; k < this.state.players.length; k++) {
            var pl = this.state.players[k];
            if (!playersByNode[pl.nodeId]) playersByNode[pl.nodeId] = [];
            playersByNode[pl.nodeId].push(pl);
        }

        for (var nid in playersByNode) {
            var pList = playersByNode[nid];
            var hostNode = nodes[Number(nid)];
            if (!hostNode) continue;
            for (var m = 0; m < pList.length; m++) {
                var tokenPlayer = pList[m];
                var isAct = (tokenPlayer.index === this.state.currentPlayerIndex);
                var isCurrentlyJumping = (this.isMoveAnimating && this.animatingPlayerIndex === tokenPlayer.index && this.animTokenPos);

                var txToken, tyToken, groundY;
                if (isCurrentlyJumping) {
                    txToken = this.animTokenPos.x;
                    tyToken = this.animTokenPos.y;
                    groundY = hostNode.y - 12;
                } else {
                    var offsetAngle = (m / pList.length) * Math.PI * 2;
                    var dist = (pList.length === 1) ? 0 : 13;
                    txToken = Math.round(hostNode.x + Math.cos(offsetAngle) * dist);
                    tyToken = Math.round(hostNode.y - 16 + Math.sin(offsetAngle) * dist);
                    groundY = hostNode.y - 4;
                }

                out.push('  <g class="knight-token-group" data-player-index="' + tokenPlayer.index + '" style="pointer-events:auto; cursor:pointer;" ' +
                    'onmouseenter="PRS_App.showPlayerTooltip(event, ' + tokenPlayer.index + ')" ' +
                    'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                    'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                    'onclick="PRS_App.selectPlayerToInspect(' + tokenPlayer.index + ')">');
                out.push('    <title>' + this.escapeHtml(tokenPlayer.name) + ': ' + tokenPlayer.totalHearts + ' 💖 | ' + tokenPlayer.gold.toLocaleString("cs-CZ") + ' zl.</title>');

                // 1. Pozemní oválný stín pod figurkou
                var shadowRx = isCurrentlyJumping ? 7.0 : 10.5;
                var shadowRy = isCurrentlyJumping ? 3.0 : 4.5;
                out.push('    <ellipse cx="' + txToken + '" cy="' + groundY + '" rx="' + shadowRx + '" ry="' + shadowRy + '" fill="rgba(0,0,0,0.48)"/>');

                // 2. Rotující sluneční aura a královský ukazatel aktivního hráče
                if (isAct) {
                    out.push('    <g transform="translate(' + txToken + ',' + (tyToken - 4) + ')">');
                    out.push('      <circle cx="0" cy="0" r="21" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="6,4" opacity="0.95">');
                    out.push('        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/>');
                    out.push('      </circle>');
                    out.push('      <circle cx="0" cy="0" r="16" fill="none" stroke="#f59e0b" stroke-width="1.2" opacity="0.6"/>');
                    out.push('      <g>');
                    out.push('        <polygon points="0,-27 -5,-21 5,-21" fill="#fbbf24" stroke="#d97706" stroke-width="0.8">');
                    out.push('          <animate attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="1.2s" repeatCount="indefinite"/>');
                    out.push('        </polygon>');
                    out.push('      </g>');
                    out.push('    </g>');
                }

                // 3. Kovový zkosený podstavec figurky
                out.push('    <ellipse cx="' + txToken + '" cy="' + (tyToken + 8) + '" rx="13" ry="5.5" fill="url(#pedestalGrad)" stroke="#d4af37" stroke-width="1.2"/>');

                // 4. Busta rytířské přilbice (uzavřené hledí s průzorem a chocholem v barvě hráče)
                out.push('    <path d="M ' + (txToken - 8) + ' ' + (tyToken + 5) + ' C ' + (txToken - 9) + ' ' + (tyToken - 4) + ' ' + (txToken - 6) + ' ' + (tyToken - 13) + ' ' + txToken + ' ' + (tyToken - 14) + ' C ' + (txToken + 6) + ' ' + (tyToken - 13) + ' ' + (txToken + 9) + ' ' + (tyToken - 4) + ' ' + (txToken + 8) + ' ' + (tyToken + 5) + ' Z" fill="#475569" stroke="#cbd5e1" stroke-width="1"/>');
                out.push('    <path d="M ' + (txToken - 5) + ' ' + (tyToken - 4) + ' Q ' + txToken + ' ' + (tyToken - 2) + ' ' + (txToken + 5) + ' ' + (tyToken - 4) + '" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>');
                // Vlající chochol (plume)
                out.push('    <path d="M ' + txToken + ' ' + (tyToken - 14) + ' Q ' + (txToken - 8) + ' ' + (tyToken - 23) + ' ' + (txToken - 1) + ' ' + (tyToken - 25) + ' Q ' + (txToken + 4) + ' ' + (tyToken - 20) + ' ' + (txToken + 1) + ' ' + (tyToken - 14) + '" fill="' + tokenPlayer.color + '" stroke="#ffffff" stroke-width="1" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5));"/>');

                // 5. Rytířský štít s číslem hráče v popředí
                var shXl = txToken - 8.5;
                var shXr = txToken + 8.5;
                var shXm = txToken;
                var shYtop = tyToken - 1;
                var shYmid = tyToken + 7;
                var shYcrv = tyToken + 13.5;
                var shYbot = tyToken + 16;
                out.push('    <path d="M ' + shXl + ' ' + shYtop + ' L ' + shXr + ' ' + shYtop + ' L ' + shXr + ' ' + shYmid + ' Q ' + shXr + ' ' + shYcrv + ' ' + shXm + ' ' + shYbot + ' Q ' + shXl + ' ' + shYcrv + ' ' + shXl + ' ' + shYmid + ' Z" fill="' + tokenPlayer.color + '" stroke="#ffffff" stroke-width="1.4" filter="url(#glowFilter)"/>');
                out.push('    <text x="' + txToken + '" y="' + (tyToken + 9.5) + '" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="bold" font-family="Cinzel, serif">' + (tokenPlayer.index + 1) + '</text>');
                out.push('  </g>');
            }
        }

        return out.join("\n");
    },

    renderNodeSilhouette: function (nd, r, fill, stroke, strokeWidth, isMajor, shortCode, bmpUrl) {
        var out = [];

        if (nd.type === "START") {
            // Královský erbovní štít
            var startPth = 'M ' + (nd.x - 22) + ' ' + (nd.y - 20) + ' L ' + (nd.x + 22) + ' ' + (nd.y - 20) + ' L ' + (nd.x + 22) + ' ' + (nd.y + 4) + ' Q ' + (nd.x + 22) + ' ' + (nd.y + 24) + ' ' + nd.x + ' ' + (nd.y + 28) + ' Q ' + (nd.x - 22) + ' ' + (nd.y + 24) + ' ' + (nd.x - 22) + ' ' + (nd.y + 4) + ' Z';
            out.push('    <path d="' + startPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "FESTIVAL") {
            // Zamilované srdcové turnajové pole
            var festPth = 'M ' + nd.x + ' ' + (nd.y + 20) + ' C ' + (nd.x - 25) + ' ' + (nd.y + 4) + ' ' + (nd.x - 24) + ' ' + (nd.y - 18) + ' ' + (nd.x - 10) + ' ' + (nd.y - 18) + ' C ' + (nd.x - 2) + ' ' + (nd.y - 18) + ' ' + nd.x + ' ' + (nd.y - 9) + ' ' + nd.x + ' ' + (nd.y - 8) + ' C ' + nd.x + ' ' + (nd.y - 9) + ' ' + (nd.x + 2) + ' ' + (nd.y - 18) + ' ' + (nd.x + 10) + ' ' + (nd.y - 18) + ' C ' + (nd.x + 24) + ' ' + (nd.y - 18) + ' ' + (nd.x + 25) + ' ' + (nd.y + 4) + ' ' + nd.x + ' ' + (nd.y + 20) + ' Z';
            out.push('    <path d="' + festPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "CASTLE" || nd.type === "TOWN") {
            // Opevněný 8-úhelníkový hradní a městský polygon
            var octPts = [];
            var rad = (nd.type === "CASTLE") ? 22 : 18.5;
            for (var a = 0; a < 8; a++) {
                var ang = a * Math.PI / 4 + Math.PI / 8;
                octPts.push(Math.round(nd.x + Math.cos(ang) * rad) + ',' + Math.round(nd.y + Math.sin(ang) * rad));
            }
            out.push('    <polygon points="' + octPts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "QUEST") {
            // Kosočtvercová 4-cípá rytířská hvězda
            var qRad = isMajor ? 24 : 19;
            var qPth = 'M ' + nd.x + ' ' + (nd.y - qRad - 3) + ' L ' + Math.round(nd.x + qRad * 0.6) + ' ' + Math.round(nd.y - qRad * 0.6) +
                       ' L ' + (nd.x + qRad + 3) + ' ' + nd.y + ' L ' + Math.round(nd.x + qRad * 0.6) + ' ' + Math.round(nd.y + qRad * 0.6) +
                       ' L ' + nd.x + ' ' + (nd.y + qRad + 3) + ' L ' + Math.round(nd.x - qRad * 0.6) + ' ' + Math.round(nd.y + qRad * 0.6) +
                       ' L ' + (nd.x - qRad - 3) + ' ' + nd.y + ' L ' + Math.round(nd.x - qRad * 0.6) + ' ' + Math.round(nd.y - qRad * 0.6) + ' Z';
            out.push('    <path d="' + qPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "ANIMAL") {
            // Medailon s barevnou závěsnou stuhou chovné sady
            var ribbonColors = { 1: "#2563eb", 2: "#059669", 3: "#d97706", 4: "#7c3aed" };
            var setNum = nd.setId || (nd.code.match(/\d+/) || [1])[0];
            var rColor = ribbonColors[setNum] || "#2563eb";
            out.push('    <polygon points="' + (nd.x - 8) + ',' + (nd.y + r - 1) + ' ' + (nd.x + 8) + ',' + (nd.y + r - 1) + ' ' + (nd.x + 8) + ',' + (nd.y + r + 11) + ' ' + nd.x + ',' + (nd.y + r + 7) + ' ' + (nd.x - 8) + ',' + (nd.y + r + 11) + '" fill="' + rColor + '" stroke="#000" stroke-width="0.8"/>');
            out.push('    <text x="' + nd.x + '" y="' + (nd.y + r + 7) + '" text-anchor="middle" fill="#ffffff" font-size="6.5" font-weight="bold">' + setNum + '</text>');
            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "CHANCE" || nd.type === "JESTER" || nd.type === "TAX") {
            // Šestiúhelníková vosková pečeť
            var hexPts = [];
            var hexRad = 17.5;
            for (var ha = 0; ha < 6; ha++) {
                var hang = ha * Math.PI / 3;
                hexPts.push(Math.round(nd.x + Math.cos(hang) * hexRad) + ',' + Math.round(nd.y + Math.sin(hang) * hexRad));
            }
            out.push('    <polygon points="' + hexPts.join(' ') + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "PRISON") {
            // Okovaný čtverec šatlavy
            out.push('    <rect x="' + (nd.x - 16) + '" y="' + (nd.y - 16) + '" width="32" height="32" rx="4" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else if (nd.type === "HOSPITAL") {
            // Křižácký erb špitálu
            var hospPth = 'M ' + (nd.x - 16) + ' ' + (nd.y - 16) + ' L ' + (nd.x + 16) + ' ' + (nd.y - 16) + ' L ' + (nd.x + 16) + ' ' + (nd.y + 2) + ' Q ' + (nd.x + 16) + ' ' + (nd.y + 18) + ' ' + nd.x + ' ' + (nd.y + 22) + ' Q ' + (nd.x - 16) + ' ' + (nd.y + 18) + ' ' + (nd.x - 16) + ' ' + (nd.y + 2) + ' Z';
            out.push('    <path d="' + hospPth + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        } else {
            // Standardní kruhový medailon
            out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" filter="url(#glowFilter)"/>');
        }

        // Vložení bitmapy nebo procedurální heraldické kresby
        if (bmpUrl) {
            var dSize = r * 2 - 2;
            out.push('    <image href="' + this.escapeHtml(bmpUrl) + '" x="' + (nd.x - dSize / 2) + '" y="' + (nd.y - dSize / 2) + '" width="' + dSize + '" height="' + dSize + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipNormalTile)" />');
            out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r - 3) + ')">');
            out.push('      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#0f0d0a" stroke="rgba(212,175,55,0.7)" stroke-width="0.8"/>');
            out.push('      <text x="0" y="2.5" text-anchor="middle" fill="#f8fafc" font-size="7" font-weight="bold">' + this.escapeHtml(shortCode) + '</text>');
            out.push('    </g>');
        } else {
            out.push(this.renderProceduralTileGraphic(nd, r, fill, stroke, strokeWidth, isMajor, shortCode));
        }

        return out.join("\n");
    },

    getNodeFillColor: function (node) {
        switch (node.type) {
            case "START": return "#7c2d12";
            case "ANIMAL":
                if (node.subtype === "kun") return "#422006";
                if (node.subtype === "pes") return "#14532d";
                return "#1e3a8a";
            case "VILLAGE": return "#365314";
            case "TOWN": return "#1d4ed8";
            case "CASTLE": return "#581c87";
            case "MASTER": return "#701a75";
            case "MERCHANT": return "#854d0e";
            case "TAX": return "#991b1b";
            case "JESTER": return "#4c1d95";
            case "BUILDING": return "#334155";
            case "QUEST": return (node.subtype === "U3") ? "#7f1d1d" : "#451a03";
            case "FESTIVAL": return "#9d174d";
            case "BONUS": return "#065f46";
            case "PRISON": return "#18181b";
            case "HOSPITAL": return "#0369a1";
            case "TAVERN": return "#78350f";
            case "CHANCE": return "#854d0e";
            default: return "#27272a";
        }
    },

    renderProceduralTileGraphic: function (nd, r, fill, stroke, strokeWidth, isMajor, shortCode) {
        var out = [];

        // 1. Vnější ražený lem s korálkovým ornamentem (reprezentace ražené mince / žetonu)
        out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r - 1.8) + '" fill="none" stroke="rgba(255,223,128,0.45)" stroke-width="0.9" stroke-dasharray="1.5,2"/>');

        // 2. Vnitřní vybrání s mírným stínem pro 3D reliéf
        out.push('    <circle cx="' + nd.x + '" cy="' + nd.y + '" r="' + (r - 3.2) + '" fill="rgba(0,0,0,0.18)" stroke="rgba(0,0,0,0.3)" stroke-width="0.6"/>');

        // 3. 3D konvexní odlesk světla na horní polovině medailonu
        out.push('    <path d="M ' + (nd.x - r + 4.5) + ' ' + (nd.y - 1) + ' A ' + (r - 4.5) + ' ' + (r - 4.5) + ' 0 0 1 ' + (nd.x + r - 4.5) + ' ' + (nd.y - 1) + ' A ' + (r - 4.5) + ' ' + (r * 0.42) + ' 0 0 0 ' + (nd.x - r + 4.5) + ' ' + (nd.y - 1) + ' Z" fill="rgba(255,255,255,0.14)"/>');

        // 4. Specifická vektorová grafika podle typu a podtypu políčka
        if (nd.type === "START") {
            // Královská koruna a zlatý sluneční kotouč
            out.push('    <path d="M ' + (nd.x - 7.5) + ' ' + (nd.y + 4) + ' L ' + (nd.x - 8.5) + ' ' + (nd.y - 3) + ' L ' + (nd.x - 4) + ' ' + (nd.y) + ' L ' + nd.x + ' ' + (nd.y - 5.5) + ' L ' + (nd.x + 4) + ' ' + (nd.y) + ' L ' + (nd.x + 8.5) + ' ' + (nd.y - 3) + ' L ' + (nd.x + 7.5) + ' ' + (nd.y + 4) + ' Z" fill="#fbbf24" stroke="#d97706" stroke-width="0.8"/>');
            out.push('    <circle cx="' + (nd.x - 8.5) + '" cy="' + (nd.y - 3.8) + '" r="1" fill="#fff"/>');
            out.push('    <circle cx="' + nd.x + '" cy="' + (nd.y - 6.2) + '" r="1.3" fill="#ef4444"/>');
            out.push('    <circle cx="' + (nd.x + 8.5) + '" cy="' + (nd.y - 3.8) + '" r="1" fill="#fff"/>');
        } else if (nd.type === "VILLAGE") {
            // Hrázděný středověký domeček s komínem a oknem
            out.push('    <polygon points="' + (nd.x - 8.5) + ',' + (nd.y + 1) + ' ' + nd.x + ',' + (nd.y - 7.5) + ' ' + (nd.x + 8.5) + ',' + (nd.y + 1) + '" fill="#b45309" stroke="#fcd34d" stroke-width="0.8"/>');
            out.push('    <rect x="' + (nd.x - 7) + '" y="' + (nd.y + 1) + '" width="14" height="6" fill="#78350f" stroke="#f59e0b" stroke-width="0.6"/>');
            out.push('    <rect x="' + (nd.x - 2) + '" y="' + (nd.y + 2.5) + '" width="4" height="4.5" fill="#fef08a"/>');
            out.push('    <rect x="' + (nd.x + 3.5) + '" y="' + (nd.y - 6.5) + '" width="2.5" height="3.5" fill="#57534e"/>');
        } else if (nd.type === "TOWN") {
            // Kamenná opevněná brána se dvěma cimbuřími věžemi
            out.push('    <rect x="' + (nd.x - 8.5) + '" y="' + (nd.y - 5.5) + '" width="5" height="11.5" fill="#475569" stroke="#cbd5e1" stroke-width="0.6"/>');
            out.push('    <rect x="' + (nd.x + 3.5) + '" y="' + (nd.y - 5.5) + '" width="5" height="11.5" fill="#475569" stroke="#cbd5e1" stroke-width="0.6"/>');
            out.push('    <rect x="' + (nd.x - 4.5) + '" y="' + (nd.y - 2) + '" width="9" height="8" fill="#334155" stroke="#cbd5e1" stroke-width="0.6"/>');
            out.push('    <path d="M ' + (nd.x - 2.5) + ' ' + (nd.y + 6) + ' L ' + (nd.x - 2.5) + ' ' + (nd.y + 2) + ' A 2.5 2.5 0 0 1 ' + (nd.x + 2.5) + ' ' + (nd.y + 2) + ' L ' + (nd.x + 2.5) + ' ' + (nd.y + 6) + ' Z" fill="#0f172a"/>');
        } else if (nd.type === "CASTLE") {
            // Třívěžový majestátní kamenný hrad s prapory
            out.push('    <rect x="' + (nd.x - 10) + '" y="' + (nd.y - 5) + '" width="4.5" height="11" fill="#64748b" stroke="#e2e8f0" stroke-width="0.6"/>');
            out.push('    <rect x="' + (nd.x + 5.5) + '" y="' + (nd.y - 5) + '" width="4.5" height="11" fill="#64748b" stroke="#e2e8f0" stroke-width="0.6"/>');
            out.push('    <rect x="' + (nd.x - 4) + '" y="' + (nd.y - 8.5) + '" width="8" height="14.5" fill="#475569" stroke="#fbbf24" stroke-width="0.8"/>');
            out.push('    <polygon points="' + nd.x + ',' + (nd.y - 12) + ' ' + (nd.x + 4.5) + ',' + (nd.y - 10) + ' ' + nd.x + ',' + (nd.y - 8.5) + '" fill="#ef4444"/>');
            out.push('    <path d="M ' + (nd.x - 2) + ' ' + (nd.y + 6) + ' L ' + (nd.x - 2) + ' ' + (nd.y + 2) + ' A 2 2 0 0 1 ' + (nd.x + 2) + ' ' + (nd.y + 2) + ' L ' + (nd.x + 2) + ' ' + (nd.y + 6) + ' Z" fill="#0f172a"/>');
        } else if (nd.type === "MERCHANT") {
            // Zlaté váhy obchodu a peněžní závaží
            out.push('    <line x1="' + nd.x + '" y1="' + (nd.y - 6.5) + '" x2="' + nd.x + '" y2="' + (nd.y + 5) + '" stroke="#fbbf24" stroke-width="1.3"/>');
            out.push('    <line x1="' + (nd.x - 6.5) + '" y1="' + (nd.y - 4.5) + '" x2="' + (nd.x + 6.5) + '" y2="' + (nd.y - 4.5) + '" stroke="#fbbf24" stroke-width="1.2"/>');
            out.push('    <path d="M ' + (nd.x - 6.5) + ' ' + (nd.y - 4.5) + ' L ' + (nd.x - 8.5) + ' ' + (nd.y - 0.5) + ' L ' + (nd.x - 4.5) + ' ' + (nd.y - 0.5) + ' Z" fill="#d97706" stroke="#fbbf24" stroke-width="0.5"/>');
            out.push('    <path d="M ' + (nd.x + 6.5) + ' ' + (nd.y - 4.5) + ' L ' + (nd.x + 4.5) + ' ' + (nd.y - 0.5) + ' L ' + (nd.x + 8.5) + ' ' + (nd.y - 0.5) + ' Z" fill="#d97706" stroke="#fbbf24" stroke-width="0.5"/>');
            out.push('    <circle cx="' + (nd.x - 1) + '" cy="' + (nd.y + 3.8) + '" r="1.3" fill="#fef08a"/>');
            out.push('    <circle cx="' + (nd.x + 1.8) + '" cy="' + (nd.y + 4.2) + '" r="1.3" fill="#fbbf24"/>');
        } else if (nd.type === "TAX") {
            // Královská truhlice s kováním
            out.push('    <rect x="' + (nd.x - 6.5) + '" y="' + (nd.y - 3.5) + '" width="13" height="8.5" rx="1.5" fill="#713f12" stroke="#eab308" stroke-width="0.8"/>');
            out.push('    <line x1="' + (nd.x - 6.5) + '" y1="' + (nd.y - 0.5) + '" x2="' + (nd.x + 6.5) + '" y2="' + (nd.y - 0.5) + '" stroke="#ca8a04" stroke-width="0.8"/>');
            out.push('    <circle cx="' + nd.x + '" cy="' + (nd.y + 1.2) + '" r="1.1" fill="#fde047"/>');
        } else if (nd.type === "JESTER") {
            // Dvourohý šaškovský čepec s rolničkami
            out.push('    <path d="M ' + (nd.x - 6.5) + ' ' + (nd.y + 2.5) + ' Q ' + (nd.x - 8.5) + ' ' + (nd.y - 5.5) + ' ' + (nd.x - 3.5) + ' ' + (nd.y - 2.5) + ' Q ' + nd.x + ' ' + (nd.y - 6.5) + ' ' + (nd.x + 3.5) + ' ' + (nd.y - 2.5) + ' Q ' + (nd.x + 8.5) + ' ' + (nd.y - 5.5) + ' ' + (nd.x + 6.5) + ' ' + (nd.y + 2.5) + ' Z" fill="#a855f7" stroke="#f472b6" stroke-width="0.8"/>');
            out.push('    <circle cx="' + (nd.x - 7.5) + '" cy="' + (nd.y - 4.5) + '" r="1.2" fill="#fbbf24"/>');
            out.push('    <circle cx="' + (nd.x + 7.5) + '" cy="' + (nd.y - 4.5) + '" r="1.2" fill="#fbbf24"/>');
            out.push('    <circle cx="' + nd.x + '" cy="' + (nd.y + 3.8) + '" r="2.2" fill="#f43f5e"/>');
        } else if (nd.type === "MASTER") {
            // Kniha cechu a zkřížený brk
            out.push('    <rect x="' + (nd.x - 6) + '" y="' + (nd.y - 4.5) + '" width="12" height="9" rx="1" fill="#4c1d95" stroke="#c084fc" stroke-width="0.8"/>');
            out.push('    <line x1="' + nd.x + '" y1="' + (nd.y - 4.5) + '" x2="' + nd.x + '" y2="' + (nd.y + 4.5) + '" stroke="#e9d5ff" stroke-width="0.6"/>');
            out.push('    <line x1="' + (nd.x - 3.5) + '" y1="' + (nd.y + 3.5) + '" x2="' + (nd.x + 5.5) + '" y2="' + (nd.y - 5.5) + '" stroke="#fbbf24" stroke-width="1.1" stroke-linecap="round"/>');
        } else if (nd.type === "CHANCE") {
            // Zářící osmicípá hvězda osudu
            out.push('    <path d="M ' + nd.x + ' ' + (nd.y - 6.5) + ' L ' + (nd.x + 2) + ' ' + (nd.y - 2) + ' L ' + (nd.x + 6.5) + ' ' + nd.y + ' L ' + (nd.x + 2) + ' ' + (nd.y + 2) + ' L ' + nd.x + ' ' + (nd.y + 6.5) + ' L ' + (nd.x - 2) + ' ' + (nd.y + 2) + ' L ' + (nd.x - 6.5) + ' ' + nd.y + ' L ' + (nd.x - 2) + ' ' + (nd.y - 2) + ' Z" fill="#facc15" stroke="#ca8a04" stroke-width="0.8"/>');
        } else if (nd.type === "PRISON") {
            // Mříže vězení a okovy
            out.push('    <rect x="' + (nd.x - 6.5) + '" y="' + (nd.y - 5.5) + '" width="13" height="11" rx="1.5" fill="#18181b" stroke="#71717a" stroke-width="0.8"/>');
            out.push('    <line x1="' + (nd.x - 3.5) + '" y1="' + (nd.y - 5.5) + '" x2="' + (nd.x - 3.5) + '" y2="' + (nd.y + 5.5) + '" stroke="#d4d4d8" stroke-width="0.8"/>');
            out.push('    <line x1="' + nd.x + '" y1="' + (nd.y - 5.5) + '" x2="' + nd.x + '" y2="' + (nd.y + 5.5) + '" stroke="#d4d4d8" stroke-width="0.8"/>');
            out.push('    <line x1="' + (nd.x + 3.5) + '" y1="' + (nd.y - 5.5) + '" x2="' + (nd.x + 3.5) + '" y2="' + (nd.y + 5.5) + '" stroke="#d4d4d8" stroke-width="0.8"/>');
            out.push('    <line x1="' + (nd.x - 6.5) + '" y1="' + nd.y + '" x2="' + (nd.x + 6.5) + '" y2="' + nd.y + '" stroke="#d4d4d8" stroke-width="0.8"/>');
        } else if (nd.type === "HOSPITAL") {
            // Rytířský štít s červeným křížem
            out.push('    <path d="M ' + (nd.x - 5.5) + ' ' + (nd.y - 5.5) + ' L ' + (nd.x + 5.5) + ' ' + (nd.y - 5.5) + ' L ' + (nd.x + 5.5) + ' ' + (nd.y - 1) + ' Q ' + (nd.x + 5.5) + ' ' + (nd.y + 5.5) + ' ' + nd.x + ' ' + (nd.y + 7) + ' Q ' + (nd.x - 5.5) + ' ' + (nd.y + 5.5) + ' ' + (nd.x - 5.5) + ' ' + (nd.y - 1) + ' Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="0.8"/>');
            out.push('    <rect x="' + (nd.x - 1.1) + '" y="' + (nd.y - 4) + '" width="2.2" height="8" fill="#dc2626"/>');
            out.push('    <rect x="' + (nd.x - 4) + '" y="' + (nd.y - 1.1) + '" width="8" height="2.2" fill="#dc2626"/>');
        } else if (nd.type === "TAVERN") {
            // Dřevěný korbel s pěnou
            out.push('    <rect x="' + (nd.x - 4.5) + '" y="' + (nd.y - 2.5) + '" width="9" height="8" rx="1.2" fill="#92400e" stroke="#fcd34d" stroke-width="0.8"/>');
            out.push('    <path d="M ' + (nd.x + 4.5) + ' ' + (nd.y - 0.5) + ' C ' + (nd.x + 7) + ' ' + (nd.y - 0.5) + ' ' + (nd.x + 7) + ' ' + (nd.y + 3.5) + ' ' + (nd.x + 4.5) + ' ' + (nd.y + 3.5) + '" fill="none" stroke="#fcd34d" stroke-width="1"/>');
            out.push('    <ellipse cx="' + nd.x + '" cy="' + (nd.y - 2.5) + '" rx="4.5" ry="2" fill="#fef08a"/>');
        } else {
            // Výchozí heraldická ikona s vrženým stínem
            out.push('    <text x="' + nd.x + '" y="' + (nd.y - 0.5) + '" text-anchor="middle" font-size="' + (isMajor ? '14' : '11.5') + '" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.85));">' + nd.icon + '</text>');
        }

        // 5. Elegantní štítek s kódem políčka (černý pergamen se zlatým lemem pro perfektní čitelnost)
        out.push('    <g transform="translate(' + nd.x + ',' + (nd.y + r - 3) + ')">');
        out.push('      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#0f0d0a" stroke="rgba(212,175,55,0.7)" stroke-width="0.8"/>');
        out.push('      <text x="0" y="2.5" text-anchor="middle" fill="#f8fafc" font-size="7" font-weight="bold">' + this.escapeHtml(shortCode) + '</text>');
        out.push('    </g>');

        return out.join("\n");
    },

    handleNodeClick: function (nodeId) {
        // Pokud uživatel právě táhl mapou myší, neotvíráme detail políčka
        if (this.viewport.dragMoved) return;
        this.inspectNode(nodeId);
    },

    handleNodeMouseEnter: function (evt, nodeId) {
        var tip = document.getElementById("prs-tile-tooltip");
        if (!tip || !this.state) return;
        var nd = this.state.board.nodes[nodeId];
        if (!nd) return;

        var activePlayer = this.state.players[this.state.currentPlayerIndex];
        var typeLabel = this.getNodeCategoryLabel(nd);
        var ownerText = "";
        if (nd.owner !== null && this.state.players[nd.owner]) {
            var ownerP = this.state.players[nd.owner];
            var curRent = window.PRS_GameEngine.calculateNodeRent(this.state, nd, activePlayer);
            ownerText = '<div class="prs-tooltip-meta">👑 Vlastník: <strong style="color:' + ownerP.color + '">' + this.escapeHtml(ownerP.name) + '</strong></div>' +
                        '<div class="prs-tooltip-rent">🛑 Vstupné / Nájem: <strong style="color:#f87171">' + curRent.toLocaleString("cs-CZ") + ' zl.</strong></div>';
        } else if (nd.price) {
            var priceRent = '💰 Cena: <strong>' + nd.price.toLocaleString("cs-CZ") + ' zl.</strong>';
            if (nd.rent) {
                var rentVal = Array.isArray(nd.rent) ? (nd.rent[nd.villageLevel || 1] || nd.rent[0]) : (typeof nd.rent === "object" ? nd.rent[nd.villageLevel || 1] : nd.rent);
                priceRent += ' | Základní nájem: <strong>' + (rentVal || 0) + ' zl.</strong>';
            }
            ownerText = '<div class="prs-tooltip-meta">' + priceRent + '</div>';
        }

        // Doplňkové informace podle typu políčka
        var extraInfoHtml = "";
        if (nd.type === "ANIMAL") {
            var setNum = nd.setId || (nd.code.match(/\d+/) || [1])[0];
            var myAnimals = [];
            for (var ani = 0; ani < this.state.board.nodes.length; ani++) {
                var anNode = this.state.board.nodes[ani];
                if (anNode && anNode.type === "ANIMAL") {
                    var anSet = anNode.setId || (anNode.code.match(/\d+/) || [1])[0];
                    if (anSet == setNum && activePlayer && activePlayer.ownedNodes.indexOf(anNode.id) !== -1) {
                        myAnimals.push(anNode);
                    }
                }
            }
            if (myAnimals.length === 3) {
                extraInfoHtml = '<div class="prs-tooltip-set prs-set-complete">✨ Vlastníš celou sadu č. ' + setNum + ' (3/3)! Nájem 80 % &amp; bonus +1,0 💖</div>';
            } else if (myAnimals.length > 0) {
                var myKinds = myAnimals.map(function(a){ return a.subtype === "kun" ? "Kůň" : (a.subtype === "pes" ? "Pes" : "Sokol"); }).join(", ");
                extraInfoHtml = '<div class="prs-tooltip-set prs-set-partial">🐾 V sadě č. ' + setNum + ' vlastníš: <strong>' + myAnimals.length + '/3 (' + myKinds + ')</strong></div>';
            } else {
                extraInfoHtml = '<div class="prs-tooltip-set">🐾 Sada č. ' + setNum + ' (Kůň, Pes, Sokol) – zatím z ní nic nevlastníš</div>';
            }
        } else if (nd.type === "VILLAGE") {
            var vLvl = nd.villageLevel || 1;
            var vStars = "★".repeat(vLvl);
            var taxYield = (vLvl === 1 ? 500 : (vLvl === 2 ? 900 : 1400));
            var upgInfo = (vLvl < 3) ? '<div class="prs-tooltip-meta" style="color:#86efac">🔨 Vylepšení na ' + (vLvl + 1) + '★ stojí 1 500 zl.</div>' : '<div class="prs-tooltip-meta" style="color:#cbd5e1">🏰 Plně opevněná tvrz (3★)</div>';
            extraInfoHtml = '<div class="prs-tooltip-meta">🏛️ Úroveň: <strong style="color:#fde047">' + vStars + ' (' + vLvl + '. st.)</strong> | Daň VD: <strong>+' + taxYield + ' zl.</strong></div>' + upgInfo;
        } else if (nd.type === "CASTLE") {
            extraInfoHtml = '<div class="prs-tooltip-meta" style="color:#e9d5ff">👑 Šlechtické sídlo | Daň VD: <strong>+2 500 zl.</strong> | Trvale <strong>+1 Charisma</strong> &amp; audience u krále!</div>';
        } else if (nd.type === "TOWN") {
            extraInfoHtml = '<div class="prs-tooltip-meta" style="color:#93c5fd">🏙️ Bohaté město | Daň VD: <strong>+1 200 zl.</strong> | Zajišťuje šlechtický titul a audienci!</div>';
        } else if (nd.type === "QUEST") {
            if (nd.subtype === "U3") {
                extraInfoHtml = '<div class="prs-tooltip-set prs-set-complete" style="background:rgba(220,38,38,0.25);border-color:#ef4444;color:#fca5a5;">🐉 Dračí sluj! Výhra: 8 000 – 12 000 zl., Věci 3 a <strong>+4 až +6 💖</strong>!</div>';
            } else if (nd.subtype === "U2") {
                extraInfoHtml = '<div class="prs-tooltip-set" style="color:#fdba74;">👹 Monstrum: Výhra 3 500 – 5 000 zl., Věci 1 a <strong>+1 💖</strong>.</div>';
            } else {
                extraInfoHtml = '<div class="prs-tooltip-set">🐗 Lov zvěře: Výhra 1 500 – 2 500 zl.</div>';
            }
        } else if (nd.type === "START") {
            extraInfoHtml = '<div class="prs-tooltip-set" style="color:#93c5fd;">🏁 Žold: <strong>+3 000 zl.</strong> (+5 000 zl. pro bezzemky) | Audience: +0,5 až +1,0 💖 (vyžaduje Hrad/Město)</div>';
        }

        tip.innerHTML = '<div class="prs-tooltip-header"><span>' + (nd.icon || '📍') + '</span> <span>' + this.escapeHtml(nd.name || nd.code) + '</span></div>' +
            '<div class="prs-tooltip-meta">' + typeLabel + ' (' + nd.code + ')</div>' +
            ownerText +
            extraInfoHtml +
            '<div class="prs-tooltip-body">' + this.getNodeTooltipSummary(nd) + '</div>';
        
        tip.classList.add("visible");
        this.handleNodeMouseMove(evt);
    },

    handleNodeMouseLeave: function () {
        var tip = document.getElementById("prs-tile-tooltip");
        if (tip) tip.classList.remove("visible");
    },

    handleNodeMouseMove: function (evt) {
        var tip = document.getElementById("prs-tile-tooltip");
        if (!tip || !tip.classList.contains("visible")) return;
        var mx = evt.clientX + 14;
        var my = evt.clientY + 14;
        var maxW = window.innerWidth - 290;
        var maxH = window.innerHeight - 150;
        if (mx > maxW) mx = evt.clientX - 260;
        if (my > maxH) my = evt.clientY - 130;
        tip.style.left = mx + "px";
        tip.style.top = my + "px";
    },

    getNodeCategoryLabel: function (nd) {
        switch (nd.type) {
            case "START": return "Královská audience (Cíl &amp; Start)";
            case "FESTIVAL": return "Královský turnaj a ples";
            case "VILLAGE": return "Panství - Vesnice (Úroveň " + (nd.villageLevel || 1) + "/3)";
            case "TOWN": return "Panství - Opevněné Město";
            case "CASTLE": return "Panství - Rytířský Hrad";
            case "ANIMAL":
                var animalKind = nd.subtype === "kun" ? "Kůň" : (nd.subtype === "pes" ? "Pes" : "Sokol");
                var setN = nd.setId || (nd.code.match(/\d+/) || [""])[0];
                return "Chovné zvíře - " + animalKind + " (Sada " + setN + ")";
            case "QUEST": return "Výprava &amp; Boj (" + (nd.subtype || "Běžný") + ")";
            case "MERCHANT": return "Královský trh a obchodník";
            case "MASTER": return "Mistr řemesel (Trénink dovedností)";
            case "CHANCE": return "Karta osudu a náhody";
            case "JESTER": return "Královský šašek";
            case "TAVERN": return "Hostinec U Zlatého kance";
            case "PRISON": return "Královská šatlava";
            case "HOSPITAL": return "Špitál sv. Lazara";
            case "TAX": return "Královská berně (Daň)";
            case "BONUS": return "Pokladnice a odměna";
            default: return "Herní pole";
        }
    },

    getNodeTooltipSummary: function (nd) {
        switch (nd.type) {
            case "START": return "Zde začíná pouť. Při průchodu či zastavení možnost audience u krále (+1 💖 za Charisma, vyžaduje šlechtický titul - vlastnictví Města či Hradu).";
            case "FESTIVAL": return "Soutěž v tanci a jezdeckém umění. Vítěz získává srdce dvorních dam (+1 až +2 💖) a turnajovou slávu.";
            case "VILLAGE": return "Základní venkovské panství. Výnosný nájem pro majitele, možnost vylepšení na kamenný statek a tvrz.";
            case "TOWN": return "Bohaté opevněné obchodní centrum. Přináší vysoké nájmy a opravňuje k audienci u krále.";
            case "CASTLE": return "Nedobytné panské sídlo. Symbol moci, obrovský nájem a šlechtický titul pro audienci.";
            case "ANIMAL": return "Zvíře do chovu. Komplet trojice Kůň + Pes + Sokol stejné sady přináší trvalý chovný bonus +1 💖 a body pro vítězství!";
            case "QUEST": return (nd.subtype === "U3") ? "Legendární tříhlavá saň či drak! Výhra: až 12 000 zl. a 6 💖 princeznina srdce! Vyžaduje vysoký Boj a zbraně." : "Výprava za zvěří či monstrem. Zisk zlaťáků, srdcí a slávy.";
            case "MERCHANT": return "Nákup zbraní, brnění a ořů za zvýhodněné ceny. Prodej za 70 % hodnoty.";
            case "MASTER": return "Trénink Boje, Jízdy, Tance a Charismatu za zlaťáky.";
            case "CHANCE": return "Vytáhni si kartu štěstěny. Může přinést nečekané bohatství i nástrahy.";
            case "JESTER": return "Rozvesel krále vtipem či obratností a získej odměnu.";
            case "TAVERN": return "Odpočinek, hazardní kostky a doplnění sil.";
            case "PRISON": return "Uvržen do žaláře! Vykup se kaucí nebo hoď 6 na kostce.";
            case "HOSPITAL": return "Léčení zranění z neúspěšných bojů za mírný poplatek.";
            case "TAX": return "Odevzdej královskou berni do státní pokladnice.";
            case "BONUS": return "Nečekaný nález zlaťáků na cestě.";
            default: return "Políčko království.";
        }
    },

    resizeAmbientCanvas: function () {
        var canvas = document.getElementById("prs-ambient-canvas");
        var wrap = document.getElementById("board-viewport-wrap");
        if (canvas && wrap && wrap.clientWidth > 0 && wrap.clientHeight > 0) {
            canvas.width = wrap.clientWidth;
            canvas.height = wrap.clientHeight;
        }
    },

    initAmbientCanvas: function () {
        var canvas = document.getElementById("prs-ambient-canvas");
        var wrap = document.getElementById("board-viewport-wrap");
        if (!canvas || !wrap) return;

        var ctx = canvas.getContext("2d");
        if (!ctx) return;

        var self = this;
        function resize() {
            if (!wrap || !canvas) return;
            if (wrap.clientWidth > 0 && wrap.clientHeight > 0) {
                canvas.width = wrap.clientWidth;
                canvas.height = wrap.clientHeight;
            }
        }
        resize();
        window.addEventListener("resize", resize);

        // 36 ambientních částic reagujících na zvolený živel (Gold, Fire, Water, Earth, Air)
        var particles = [];
        var count = 36;
        for (var i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * (canvas.width || 1200),
                y: Math.random() * (canvas.height || 750),
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.2 - Math.random() * 0.45,
                size: 1.2 + Math.random() * 2.8,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.05,
                alpha: 0.2 + Math.random() * 0.55,
                baseAlpha: 0.2 + Math.random() * 0.55,
                phase: Math.random() * Math.PI * 2
            });
        }

        function loop() {
            var tabBoard = document.getElementById("tab-board");
            if (tabBoard && tabBoard.style.display !== "none") {
                if (canvas.width === 0 || canvas.height === 0) {
                    resize();
                }
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                var th = self.currentTheme || "light";

                for (var i = 0; i < particles.length; i++) {
                    var p = particles[i];
                    p.phase += 0.035;
                    p.rot += p.vrot;

                    var curAlpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.phase));

                    if (th === "fire") {
                        // Oheň: stoupající žhavé uhlíky s mihotáním do stran
                        p.y += p.vy * 1.35;
                        p.x += Math.sin(p.phase * 2) * 0.75 + p.vx * 0.5;
                        if (p.y < -15) {
                            p.y = canvas.height + 15;
                            p.x = Math.random() * canvas.width;
                        }
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * (0.8 + 0.3 * Math.sin(p.phase)), 0, Math.PI * 2);
                        ctx.fillStyle = (Math.sin(p.phase) > 0.2) ? "rgba(251, 146, 60, " + curAlpha.toFixed(2) + ")" : "rgba(239, 68, 68, " + curAlpha.toFixed(2) + ")";
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = "#f97316";
                        ctx.fill();
                    } else if (th === "water") {
                        // Voda: plovoucí bublinky a světelné caustics
                        p.y += p.vy * 0.65;
                        p.x += Math.sin(p.phase) * 0.6;
                        if (p.y < -15) {
                            p.y = canvas.height + 15;
                            p.x = Math.random() * canvas.width;
                        }
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(56, 189, 248, " + curAlpha.toFixed(2) + ")";
                        ctx.shadowBlur = 9;
                        ctx.shadowColor = "#0284c7";
                        ctx.fill();
                    } else if (th === "earth") {
                        // Země: padající a vířící podzimní lístky
                        p.y += (0.35 + Math.abs(p.vy * 0.6));
                        p.x += Math.cos(p.phase) * 0.85;
                        if (p.y > canvas.height + 15) {
                            p.y = -15;
                            p.x = Math.random() * canvas.width;
                        }
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rot);
                        ctx.beginPath();
                        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(52, 211, 153, " + curAlpha.toFixed(2) + ")";
                        ctx.shadowBlur = 6;
                        ctx.shadowColor = "#059669";
                        ctx.fill();
                        ctx.restore();
                    } else if (th === "air") {
                        // Vzduch: elektrické mikro-jiskry a fialové záblesky
                        p.y += p.vy * 1.1;
                        p.x += p.vx * 1.3 + Math.sin(p.phase * 3) * 0.8;
                        if (p.y < -15) {
                            p.y = canvas.height + 15;
                            p.x = Math.random() * canvas.width;
                        }
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(192, 132, 252, " + curAlpha.toFixed(2) + ")";
                        ctx.shadowBlur = 12;
                        ctx.shadowColor = "#c084fc";
                        ctx.fill();
                    } else {
                        // Zlato (Light): zlatý hvězdný prach s třpytivým pulzem
                        p.y += p.vy;
                        p.x += p.vx + Math.sin(p.phase) * 0.35;
                        if (p.y < -15) {
                            p.y = canvas.height + 15;
                            p.x = Math.random() * canvas.width;
                        }
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(251, 191, 36, " + curAlpha.toFixed(2) + ")";
                        ctx.shadowBlur = 9;
                        ctx.shadowColor = "#f59e0b";
                        ctx.fill();
                    }
                }
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    },

    inspectNode: function (nodeId) {
        this.selectedNodeId = nodeId;
        this.renderBoardSVG();
        this.renderStandingNodeCard();
        var node = this.state.board.nodes[nodeId];
        var box = document.getElementById("inspected-node-box");
        if (!box || !node) return;

        var price = window.PRS_GameEngine.getNodePrice(this.state, node);
        var ownerText = "Nikdo (Volné)";
        if (node.owner !== null && this.state.players[node.owner]) {
            ownerText = this.state.players[node.owner].badge + " " + this.escapeHtml(this.state.players[node.owner].name);
        }

        var extra = "";
        if (node.type === "ANIMAL") {
            extra = "Sada zvířat č. <strong>" + node.setId + "</strong> | Cena: <strong>" + price + " zl.</strong> | Nájem: 20 % / 40 % (pár) / 80 % (celá sada)";
        } else if (node.type === "VILLAGE") {
            extra = "Cena: <strong>" + price + " zl.</strong> | Úroveň: <strong>" + (node.villageLevel || 1) + "/3</strong> | Daňový výnos u Výběrčího: 500 / 900 / 1 400 zl.";
        } else if (node.type === "TOWN" || node.type === "CASTLE") {
            extra = "Cena: <strong>" + price + " zl.</strong> | Vlastník: " + ownerText;
        } else if (price > 0) {
            extra = "Cena: <strong>" + price + " zl.</strong> | Vlastník: " + ownerText;
        } else {
            extra = "Speciální událost na trase";
        }

        box.innerHTML = '<div class="inspect-title">' + node.icon + ' <strong>' + this.escapeHtml(node.name) + '</strong> <small>(' + node.code + ')</small></div>' +
            '<div class="inspect-sub">' + extra + '</div>';
    },

    // --- PROMINENTNÍ KARTA: POLÍČKO, NA KTERÉM HRÁČ STOJÍ / KTERÉ ZKOUMÁ (BEZ SCROLLOVÁNÍ) ---
    renderStandingNodeCard: function () {
        var el = document.getElementById("player-standing-tile-card");
        if (!el || !this.state) return;
        var p = this.state.players[this.state.currentPlayerIndex];
        if (!p) return;

        var inspectId = (this.selectedNodeId !== null && this.selectedNodeId !== undefined) ? this.selectedNodeId : p.nodeId;
        var node = this.state.board.nodes[inspectId];
        if (!node) return;

        var isMyCurrentStandingTile = (inspectId === p.nodeId);
        var bmpUrl = this.getTileBitmapUrl(node);
        if (!bmpUrl && (node.type === "START" || node.type === "CASTLE" || node.code === "START" || (node.code && node.code.indexOf("START") !== -1))) {
            bmpUrl = "assets/tiles/castle.png";
        }
        var price = window.PRS_GameEngine.getNodePrice(this.state, node);

        var ownerText = "Volné (Nikdo nevlastní)";
        var ownerBadge = "";
        var isOwnedByMe = false;
        var isOwnedByOther = false;
        if (node.owner !== null && this.state.players[node.owner]) {
            var ownerPlayer = this.state.players[node.owner];
            ownerText = ownerPlayer.badge + " " + this.escapeHtml(ownerPlayer.name);
            ownerBadge = '<span style="color:' + ownerPlayer.color + '; font-weight:bold;">' + ownerText + '</span>';
            if (node.owner === this.state.currentPlayerIndex) isOwnedByMe = true;
            else isOwnedByOther = true;
        }

        var description = "";
        var statusPill = "";

        if (node.type === "START") {
            description = "Královský hradní Start. Při průchodu nebo vstupu získáváš královský žold <strong>+3 000 zl.</strong> a zotavuješ se z úmrtí.";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">👑 Královská brána</span>';
        } else if (node.type === "ANIMAL") {
            var animalName = (node.subtype === "kun" ? "Kůň" : (node.subtype === "pes" ? "Pes" : "Sokol"));
            if (isOwnedByMe) {
                description = "Tvé zvíře (" + animalName + " ze sady č. " + node.setId + "). Pokud na něj vstoupí soupeř, zaplatí ti nájemné 20 % / 40 % / 80 % ceny sady.";
                statusPill = '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac; border-color:#22c55e;">🛡️ Tvé zvíře</span>';
            } else if (isOwnedByOther) {
                var rent = Math.round(price * 0.2);
                description = "Zvíře vlastní " + ownerBadge + ". Za stoupnutí na toto pole platíš majiteli nájemné (cca <strong>" + rent + " zl.</strong>).";
                statusPill = '<span class="standing-tile-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5; border-color:#ef4444;">💸 Cizí majetek</span>';
            } else {
                description = "Volné zvíře (" + animalName + " ze sady č. " + node.setId + "). Kůň je nutný pro Závod a Turnaj, Pes a Sokol pro Turnaj a chovatelskou prémii (až +3 💖).";
                statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">🛒 Koupě: ' + price + ' zl.</span>';
            }
        } else if (node.type === "VILLAGE") {
            var lvl = node.villageLevel || 1;
            if (isOwnedByMe) {
                description = "Tvá vesnice na úrovni <strong>" + lvl + "/3</strong> (" + "★".repeat(lvl) + "). Při návštěvě Výběrčího daní (VD) ti přináší stálý výnos <strong>" + (lvl === 1 ? '500' : (lvl === 2 ? '900' : '1 400')) + " zl.</strong>";
                statusPill = '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac; border-color:#22c55e;">🏘️ Tvá vesnice</span>';
            } else if (isOwnedByOther) {
                description = "Vesnici vlastní " + ownerBadge + ". Přináší majiteli zlaťáky pokaždé, když kdokoliv stoupne na Výběrčího daní.";
                statusPill = '<span class="standing-tile-badge" style="background:rgba(239,68,68,0.25); color:#fca5a5; border-color:#ef4444;">🏘️ Panství soupeře</span>';
            } else {
                description = "Volná vesnice. Lze ji koupit za <strong>" + price + " zl.</strong> a následně dvakrát povýšit. Daňový výnos: 500 / 900 / 1 400 zl.";
                statusPill = '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25);">🛒 Koupě: ' + price + ' zl.</span>';
            }
        } else if (node.type === "TOWN") {
            description = isOwnedByMe ? "Tvé opevněné město. Přináší stálý daňový výnos <strong>1 200 zl.</strong> u Výběrčího daní." : "Královské město. Cena: " + price + " zl., výnos: 1 200 zl. Vlastník: " + (ownerBadge || "Nikdo");
            statusPill = isOwnedByMe ? '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac;">🏙️ Tvé město</span>' : '<span class="standing-tile-badge">🏙️ Město: ' + price + ' zl.</span>';
        } else if (node.type === "CASTLE") {
            description = "Pevný hrad. Přináší daňový výnos <strong>2 500 zl.</strong> a majiteli trvale propůjčuje <strong>+1 Charisma</strong>. Vlastník: " + (ownerBadge || "Nikdo");
            statusPill = isOwnedByMe ? '<span class="standing-tile-badge" style="background:rgba(34,197,94,0.25); color:#86efac;">🏯 Tvůj hrad</span>' : '<span class="standing-tile-badge">🏯 Hrad: ' + price + ' zl.</span>';
        } else if (node.type === "MASTER") {
            var skName = (node.skill === "boj" ? "Boj ⚔️" : (node.skill === "jizda" ? "Jízda 🏇" : (node.skill === "tanec" ? "Tanec 💃" : (node.skill === "charisma" ? "Charisma ✨" : "Libovolná vlastnost (Velmistr)"))));
            description = "Sídlo Mistra (" + skName + "). Pokud hodíš <strong>4, 5 nebo 6</strong>, mistr tě přijme do výcviku na další úroveň (1 000–5 000 zl.).";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(147,51,234,0.25); color:#d8b4fe; border-color:#a855f7;">🎓 Výcvik (hod 4–6)</span>';
        } else if (node.type === "MERCHANT") {
            description = "Královský trh. Můžeš zde nakupovat balíčky Věcí 1., 2. a 3. stupně (zbraně, zbroj, šaty) a prodávat nepotřebný majetek za výhodnější kurz (1/2 za věci, 100 % za budovy).";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(16,185,129,0.25); color:#6ee7b7; border-color:#10b981;">⚖️ Královský trh</span>';
        } else if (node.type === "QUEST") {
            description = "Bojový úkol (" + node.name + "). Zde se utkáš v souboji kostkou se zvěří, monstrem nebo drakem. Vítězství přináší zlato a zápis do kroniky.";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(220,38,38,0.25); color:#fca5a5; border-color:#ef4444;">⚔️ Bojový úkol</span>';
        } else if (node.type === "FESTIVAL") {
            description = "Místo konání Královských Slavností (Turnaj, Ples, Závod). Zde získáváš nejvíce <strong>Srdcí princezny 💖</strong> do Bodové osy!";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(236,72,153,0.25); color:#fbcfe8; border-color:#ec4899;">💖 Slavnost princezny</span>';
        } else if (node.type === "TAX") {
            description = "Královský výběrčí daní. Hráč, který sem vstoupí, okamžitě získá zlaťáky ze všech svých vesnic, měst a hradů!";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a; border-color:#eab308;">👑 Výběr daní</span>';
        } else if (node.type === "BONUS") {
            description = "Královská prémiová cesta. Hráč při vstupu okamžitě získává bonus <strong>+" + (node.bonusGold || 200) + " zl.</strong>";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a;">💰 Bonus +' + (node.bonusGold || 200) + ' zl.</span>';
        } else if (node.type === "JESTER") {
            description = "Kejklíř (" + node.name + "). Každý vlastněný kejklíř zvyšuje nájemné, které ti soupeři platí při vstupu na tvé kejklíře.";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(168,85,247,0.25); color:#e9d5ff;">🃏 Kejklíř: ' + price + ' zl.</span>';
        } else if (node.type === "CHANCE") {
            description = "Pole osudu (Náhoda). Taháš náhodnou kartu s nečekanou událostí nebo královským ediktem.";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(59,130,246,0.25); color:#bfdbfe;">❓ Karta Náhody</span>';
        } else if (node.type === "PRISON") {
            description = "Královská šatlava. Zadržení rytíři zde musí složit kauci 1 000 zl., pokusit se o útěk (kostka 6), nebo si odsedět trest.";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(113,113,122,0.25); color:#e4e4e7; border-color:#71717a;">⛓️ Královská šatlava</span>';
        } else if (node.type === "HOSPITAL") {
            description = "Královský lazaret (Špitál). Zde se léčí rytíři po těžkých soubojích s monstry a drakem, a mohou zakoupit Hojivý lektvar (+1 Boj, +0.5 💖 za 800 zl.).";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(2,132,199,0.25); color:#7dd3fc; border-color:#0284c7;">🏥 Královský lazaret</span>';
        } else if (node.type === "TAVERN") {
            description = "Hostinec U Zlatého korbelu. Rytíři zde hrají kostky s krčmářem o zlaťáky (sázka 500 zl.) nebo zvou společnost na rundu pro zvýšení slávy (+0.5 💖 za 400 zl.).";
            statusPill = '<span class="standing-tile-badge" style="background:rgba(217,119,6,0.25); color:#fde68a; border-color:#d97706;">🍺 Krčma U Korbelu</span>';
        } else {
            description = "Speciální místo na královské trase.";
            statusPill = '<span class="standing-tile-badge">' + node.code + '</span>';
        }

        var headerTag = isMyCurrentStandingTile
            ? '<span class="standing-tile-badge" style="background:rgba(212,175,55,0.25); color:var(--gold-light); border-color:var(--gold);">📍 ZDE PRÁVĚ STOJÍŠ (' + node.code + ')</span>'
            : '<div style="display:flex; justify-content:space-between; align-items:center; width:100%;">' +
                '<span class="standing-tile-badge" style="background:rgba(56,189,248,0.2); color:#7dd3fc; border-color:#38bdf8;">🔍 PROZKOUMÁVÁŠ POLE (' + node.code + ')</span>' +
                '<button class="btn-secondary" style="padding:0.12rem 0.45rem; font-size:0.75rem;" onclick="PRS_App.inspectNode(' + p.nodeId + ')">🎯 Zpět na mé pole</button>' +
              '</div>';

        var imgHtml = bmpUrl
            ? '<img src="' + this.escapeHtml(bmpUrl) + '" alt="' + this.escapeHtml(node.name) + '" onerror="this.onerror=null; this.src=\'assets/tiles/castle.png\';" />'
            : ((node.type === "START" || node.type === "CASTLE" || node.code === "START")
                ? '<img src="assets/tiles/castle.png" alt="' + this.escapeHtml(node.name) + '" />'
                : '<span class="emoji-icon">' + node.icon + '</span>');

        var merchantBtnHtml = (node.type === "MERCHANT")
            ? '<button class="btn-action-buy" style="margin-top:0.45rem; width:100%; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:0.4rem;" onclick="PRS_App.openArmoryModal()">🛒 Otevřít Královskou zbrojnici &amp; Trh</button>'
            : '';

        el.innerHTML = '<div class="standing-tile-card" style="' + (isMyCurrentStandingTile ? '' : 'border-color:#38bdf8; box-shadow:0 6px 20px rgba(56,189,248,0.25);') + '">' +
            '  <div class="standing-tile-header">' +
            '    <div class="standing-tile-medallion">' + imgHtml + '</div>' +
            '    <div class="standing-tile-meta">' +
            '      ' + headerTag +
            '      <div class="standing-tile-title">' + node.icon + ' ' + this.escapeHtml(node.name) + '</div>' +
            '    </div>' +
            '  </div>' +
            '  <div class="standing-tile-body">' +
            '    <div style="margin-bottom:0.35rem;">' + description + '</div>' +
            '    <div class="standing-tile-status-row">' +
            '      <span>' + statusPill + '</span>' +
            '      <span style="color:var(--text-muted); font-size:0.78rem;">Pozice: ' + (node.id + 1) + ' / ' + this.state.board.nodes.length + '</span>' +
            '    </div>' +
            merchantBtnHtml +
            '  </div>' +
            '</div>';
    },

// ========================================================================
    // ŽEBŘÍČEK VŠECH HRÁČŮ, STATISTIKY A HOVER TOOLTIPY
    // ========================================================================
    inspectedPlayerIndex: null,
    activePlayerTab: "none", // "none" | "items" | "fiefs"
    toggleActivePlayerTab: function(tabName) {
        if (this.activePlayerTab === tabName) {
            this.activePlayerTab = "none";
        } else {
            this.activePlayerTab = tabName;
        }
        this.renderActivePlayerPanel();
    },

    selectPlayerToInspect: function (pIdx) {
        if (!this.state || !this.state.players[pIdx]) return;
        this.inspectedPlayerIndex = pIdx;
        this.renderHeartTrack();
        this.renderPlayersStandings();
        this.renderActivePlayerPanel();
        this.renderLowerKnightDetail();
        if (this.state.players[pIdx]) {
            this.inspectNode(this.state.players[pIdx].nodeId);
        }
    },

    // --- DETAILNÍ KARTA STATISTIK ZVOLENÉHO RYTÍŘE V DOLNÍM SÁLU ---
    renderLowerKnightDetail: function () {
        var el = document.getElementById("lower-inspected-knight-detail");
        if (!el || !this.state) return;

        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;
        var p = this.state.players[inspIdx];
        if (!p) return;

        var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);
        var targetHearts = this.state.config.targetHearts;
        var currNode = this.state.board.nodes[p.nodeId];
        var isTurn = (inspIdx === this.state.currentPlayerIndex);
        var eqItems = window.PRS_GameEngine.getEquippedItems(p);

        var html = '<div style="border-left: 4.5px solid ' + p.color + '; padding-left: 0.85rem;">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.75rem; border-bottom:1px solid rgba(212,175,55,0.22); padding-bottom:0.75rem; margin-bottom:0.85rem;">' +
            '  <div>' +
            '    <div style="display:flex; align-items:center; gap:0.65rem;">' +
            '      <span style="font-size:1.8rem;">' + p.badge + '</span>' +
            '      <div>' +
            '        <h3 style="margin:0; font-family:\'Cinzel\',serif; color:' + p.color + '; font-size:1.25rem;">' + this.escapeHtml(p.name) + ' ' + (p.type !== "Human" ? '<small class="bot-tag">PC</small>' : '<small class="bot-tag" style="background:#0284c7;color:#fff;">Hráč</small>') + '</h3>' +
            '        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">' +
            (isTurn ? '<strong style="color:#fbbf24;">⚔️ Právě na tahu</strong> • ' : '') +
            'Stojí na poli: <strong>' + (currNode ? this.escapeHtml(currNode.name) : "Neznámé") + '</strong> (Pole #' + p.nodeId + ')' +
            '        </div>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '  <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">' +
            '    <div style="text-align:right;">' +
            '      <div style="font-size:1.08rem; font-weight:700; color:#f472b6;">' + p.totalHearts + ' / ' + targetHearts + ' ❤️</div>' +
            '      <div style="font-size:0.85rem; color:#facc15; font-weight:600;">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</div>' +
            '    </div>' +
            '    <button class="btn-secondary" style="font-size:0.8rem; padding:0.35rem 0.8rem; border-color:var(--gold); color:var(--gold-light);" onclick="window.scrollTo({top:0, behavior:\'smooth\'}); PRS_App.centerOnActivePlayer();" title="Přejít nahoru k hernímu plánu a ukázat figurku">' +
            '      🎯 Ukázat na desce ↑' +
            '    </button>' +
            '  </div>' +
            '</div>';

        // 4 Cnosti rytíře
        html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:0.55rem; margin-bottom:0.95rem;">' +
            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +
            '    <div style="font-size:0.74rem; color:var(--text-muted);">⚔️ Bojová síla</div>' +
            '    <div style="font-size:1.15rem; font-weight:bold; color:#fca5a5;">' + st.boj + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.boj + '/5)</small></div>' +
            '  </div>' +
            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +
            '    <div style="font-size:0.74rem; color:var(--text-muted);">🏇 Jezdecké umění</div>' +
            '    <div style="font-size:1.15rem; font-weight:bold; color:#7dd3fc;">' + st.jizda + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.jizda + '/5)</small></div>' +
            '  </div>' +
            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(244,114,182,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +
            '    <div style="font-size:0.74rem; color:var(--text-muted);">💃 Dvorní tanec</div>' +
            '    <div style="font-size:1.15rem; font-weight:bold; color:#f472b6;">' + st.tanec + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.tanec + '/5)</small></div>' +
            '  </div>' +
            '  <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(250,204,21,0.3); border-radius:8px; padding:0.45rem 0.65rem; text-align:center;">' +
            '    <div style="font-size:0.74rem; color:var(--text-muted);">👑 Charisma</div>' +
            '    <div style="font-size:1.15rem; font-weight:bold; color:#fef08a;">' + st.charisma + ' <small style="font-size:0.73rem; color:var(--text-muted); font-weight:normal;">(' + p.skills.charisma + '/5)</small></div>' +
            '  </div>' +
            '</div>';

        // 2 sloupce: Výbava & Panství
        html += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:0.75rem;">';

        // Sloupec 1: Výbava
        var itemsList = p.items || [];
        html += '<div style="background:rgba(0,0,0,0.25); border:1px solid rgba(212,175,55,0.18); border-radius:10px; padding:0.7rem;">' +
            '  <div style="font-size:0.85rem; font-weight:700; color:var(--gold-light); margin-bottom:0.45rem; display:flex; justify-content:space-between;">' +
            '    <span>🛡️ Rytířská výbava (' + itemsList.length + ')</span>' +
            '  </div>';
        if (itemsList.length === 0) {
            html += '  <div style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">Zatím žádná výbava. Lze zakoupit v Obchodě.</div>';
        } else {
            html += '  <div style="display:flex; flex-direction:column; gap:0.3rem;">';
            for (var itIdx = 0; itIdx < itemsList.length; itIdx++) {
                var it = itemsList[itIdx];
                var isEq = (it.isEquipped === true || (it.isEquipped !== false && eqItems[it.slot] && eqItems[it.slot].id === it.id));
                html += '    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); border-radius:6px; padding:0.25rem 0.45rem; font-size:0.8rem;">' +
                    '      <span>' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong> <small style="color:var(--text-muted);">(' + (it.slot || "předmět") + ')</small></span>' +
                    '      <span style="color:' + (isEq ? '#86efac' : 'var(--text-muted)') + '; font-size:0.73rem;">' + (isEq ? '✓ Nasazeno' : 'V brašně') + '</span>' +
                    '    </div>';
            }
            html += '  </div>';
        }
        html += '</div>';

        // Sloupec 2: Panství a zvířata
        var ownedNodesList = p.ownedNodes || [];
        html += '<div style="background:rgba(0,0,0,0.25); border:1px solid rgba(212,175,55,0.18); border-radius:10px; padding:0.7rem;">' +
            '  <div style="font-size:0.85rem; font-weight:700; color:var(--gold-light); margin-bottom:0.45rem; display:flex; justify-content:space-between;">' +
            '    <span>🏰 Panství, chov a stavby (' + ownedNodesList.length + ')</span>' +
            '    <span style="font-size:0.76rem; color:#f472b6;">Chov: +' + p.breedingHearts + ' ❤️</span>' +
            '  </div>';
        if (ownedNodesList.length === 0) {
            html += '  <div style="font-size:0.78rem; color:var(--text-muted); font-style:italic;">Zatím žádné panství ani chov.</div>';
        } else {
            html += '  <div style="display:flex; flex-direction:column; gap:0.3rem;">';
            for (var asIdx = 0; asIdx < ownedNodesList.length; asIdx++) {
                var ndId = ownedNodesList[asIdx];
                var ndObj = this.state.board.nodes[ndId];
                if (!ndObj) continue;
                var rent = window.PRS_GameEngine.calculateNodeRent(this.state, ndObj, p);
                html += '    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); border-radius:6px; padding:0.25rem 0.45rem; font-size:0.8rem;">' +
                    '      <span>' + (ndObj.icon || '🏡') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> <small style="color:var(--text-muted);">(' + ndObj.code + ')' + (ndObj.villageLevel > 1 ? (' v' + ndObj.villageLevel) : '') + '</small></span>' +
                    '      <span style="color:#86efac; font-size:0.75rem;">Mýtné: ' + rent.toLocaleString("cs-CZ") + ' zl.</span>' +
                    '    </div>';
            }
            html += '  </div>';
        }
        html += '</div>';

        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
    },

    renderPlayersStandings: function () {
        var el = document.getElementById("all-players-standings-box");
        if (!el || !this.state) return;
        var target = this.state.config.targetHearts;
        var curIdx = this.state.currentPlayerIndex;
        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : curIdx;

        var html = '<div class="standings-card">' +
            '  <div class="standings-header">' +
            '    <span>🏆 STAV RYTÍŘŮ &amp; ZÁVOD</span>' +
            '    <span style="color:#f472b6;">Cíl: ' + target + ' 💖</span>' +
            '  </div>' +
            '  <div class="standings-list">';

        for (var i = 0; i < this.state.players.length; i++) {
            var p = this.state.players[i];
            var isTurn = (i === curIdx);
            var isInspected = (i === inspIdx);
            var pct = Math.min(100, Math.round((p.totalHearts / target) * 100));

            html += '<div class="standing-player-row ' + (isTurn ? 'active-turn' : '') + ' ' + (isInspected ? 'inspected-player' : '') + '" ' +
                'onmouseenter="PRS_App.showPlayerTooltip(event, ' + i + ')" ' +
                'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                'onclick="PRS_App.selectPlayerToInspect(' + i + ')" ' +
                'title="Najetím zobrazíš statistiky, kliknutím otevřeš detail výbavy">';

            html += '  <div class="sp-info">' +
                '    <span class="sp-badge" style="background:' + p.color + ';"></span>' +
                '    <span class="sp-name" style="' + (isTurn ? 'color:#fef08a; font-weight:700;' : '') + '">' +
                (isTurn ? '👑 ' : '') + this.escapeHtml(p.name) +
                '</span>' +
                '  </div>' +
                '  <div class="sp-hearts-col">' +
                '    <span class="sp-hearts-val">' + p.totalHearts + ' / ' + target + ' 💖</span>' +
                '    <div class="sp-bar-bg"><div class="sp-bar-fill" style="width:' + pct + '%; background:' + p.color + ';"></div></div>' +
                '  </div>' +
                '</div>';
        }

        html += '  </div>' +
            '</div>';

        el.innerHTML = html;
    },

    showPlayerTooltip: function (e, playerIndex) {
        var tip = document.getElementById("player-hover-tooltip");
        if (!tip || !this.state || !this.state.players[playerIndex]) return;
        var p = this.state.players[playerIndex];
        var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);
        var target = this.state.config.targetHearts;
        var currNode = this.state.board.nodes[p.nodeId];

        var eqList = [];
        var eqItems = window.PRS_GameEngine.getEquippedItems(p);
        for (var k in eqItems) {
            if (eqItems[k]) eqList.push(eqItems[k].icon + " " + eqItems[k].name);
        }
        var eqText = eqList.length > 0 ? eqList.join(", ") : "Žádná výbava";

        var html = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; border-bottom:1px solid rgba(212,175,55,0.3); padding-bottom:0.35rem;">' +
            '  <span style="font-weight:700; color:' + p.color + '; font-size:0.95rem;">' + p.badge + ' ' + this.escapeHtml(p.name) + '</span>' +
            '  <span style="font-size:0.75rem; color:var(--text-muted);">' + (p.type === "Human" ? "Člověk" : "PC") + '</span>' +
            '</div>' +
            '<div style="display:flex; justify-content:space-between; margin-bottom:0.45rem;">' +
            '  <span style="color:#f472b6; font-weight:700; font-size:0.92rem;">💖 ' + p.totalHearts + ' / ' + target + ' Srdcí</span>' +
            '  <span style="color:#facc15; font-weight:700; font-size:0.92rem;">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</span>' +
            '</div>' +
            '<div style="font-size:0.78rem; color:#bae6fd; margin-bottom:0.45rem;">' +
            '  📍 Pozice: <strong>' + (currNode ? this.escapeHtml(currNode.name) : "-") + '</strong>' +
            '</div>' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem; font-size:0.8rem; background:rgba(0,0,0,0.45); padding:0.45rem; border-radius:6px; margin-bottom:0.45rem;">' +
            '  <div>⚔️ Boj: <strong>' + st.boj + '</strong> <small style="color:var(--text-muted);">(' + p.skills.boj + '/5)</small></div>' +
            '  <div>🏇 Jízda: <strong>' + st.jizda + '</strong> <small style="color:var(--text-muted);">(' + p.skills.jizda + '/5)</small></div>' +
            '  <div>💃 Tanec: <strong>' + st.tanec + '</strong> <small style="color:var(--text-muted);">(' + p.skills.tanec + '/5)</small></div>' +
            '  <div>✨ Charisma: <strong>' + st.charisma + '</strong> <small style="color:var(--text-muted);">(' + p.skills.charisma + '/5)</small></div>' +
            '</div>' +
            '<div style="font-size:0.78rem; color:#e2e8f0; margin-bottom:0.3rem;">' +
            '  🏰 Panství &amp; Chovy: <strong>' + p.ownedNodes.length + '</strong> (Bonus chovu: +' + p.breedingHearts + ' 💖)' +
            '</div>' +
            '<div style="font-size:0.76rem; color:var(--text-muted); white-space:normal; line-height:1.35;">' +
            '  🎒 Aktivní výbava: ' + this.escapeHtml(eqText) +
            '</div>';

        tip.innerHTML = html;
        tip.style.display = "block";
        this.movePlayerTooltip(e);
    },

    movePlayerTooltip: function (e) {
        var tip = document.getElementById("player-hover-tooltip");
        if (!tip || tip.style.display === "none") return;
        var x = e.clientX + 16;
        var y = e.clientY + 16;
        if (x + 310 > window.innerWidth) x = Math.max(10, e.clientX - 320);
        if (y + 240 > window.innerHeight) y = Math.max(10, e.clientY - 250);
        tip.style.left = x + "px";
        tip.style.top = y + "px";
    },

    hidePlayerTooltip: function () {
        var tip = document.getElementById("player-hover-tooltip");
        if (tip) tip.style.display = "none";
    },

    // --- PANEL AKTIVNÍHO HRÁČE A AKCÍ TAHU ---
    renderActivePlayerPanel: function () {
        var el = document.getElementById("active-player-sheet");
        if (!el || !this.state) return;
        var inspIdx = (this.inspectedPlayerIndex !== null && this.inspectedPlayerIndex !== undefined) ? this.inspectedPlayerIndex : this.state.currentPlayerIndex;
        var p = this.state.players[inspIdx];
        if (!p) p = this.state.players[this.state.currentPlayerIndex];
        var targetHearts = this.state.config.targetHearts;
        var st = window.PRS_GameEngine.getEffectiveStats(this.state, p);
        var currNode = this.state.board.nodes[p.nodeId];
        var atMerchant = currNode && currNode.type === "MERCHANT";
        var isCurTurn = (inspIdx === this.state.currentPlayerIndex);
        var heartsPct = Math.min(100, Math.round((p.totalHearts / targetHearts) * 100));

        // 1. Přehledná 2x2 mřížka volby rytířů u stolu
        var selectorHtml = '<div class="knight-selector-grid">';
        for (var tIdx = 0; tIdx < this.state.players.length; tIdx++) {
            var plTab = this.state.players[tIdx];
            var isSel = (tIdx === inspIdx);
            var isTurnPl = (tIdx === this.state.currentPlayerIndex);
            var shortName = this.escapeHtml(plTab.name.replace(" (PC)", "").replace(" (Ty)", ""));
            var kGoldStr = (plTab.gold >= 1000) ? (Math.round(plTab.gold / 1000) + "k") : plTab.gold;

            selectorHtml += '<div class="ks-pill ' + (isSel ? 'active' : '') + ' ' + (isTurnPl ? 'turn-now' : '') + '" ' +
                'style="border-left: 3.5px solid ' + plTab.color + ';" ' +
                'onclick="PRS_App.selectPlayerToInspect(' + tIdx + ')" ' +
                'onmouseenter="PRS_App.showPlayerTooltip(event, ' + tIdx + ')" ' +
                'onmousemove="PRS_App.movePlayerTooltip(event)" ' +
                'onmouseleave="PRS_App.hidePlayerTooltip()" ' +
                'title="' + this.escapeHtml(plTab.name) + ': ' + plTab.totalHearts + ' 💖 (' + plTab.gold.toLocaleString("cs-CZ") + ' zl.)">' +
                '<div class="ks-pill-top">' +
                '  <span class="ks-avatar" style="background:' + plTab.color + ';">' + plTab.badge + '</span>' +
                '  <span class="ks-name">' + shortName + '</span>' +
                (isTurnPl ? '<span class="ks-crown" title="Hráč na tahu">👑</span>' : '') +
                '</div>' +
                '<div class="ks-pill-bottom">' +
                '  <span class="ks-hearts">' + plTab.totalHearts + ' 💖</span>' +
                '  <span class="ks-gold">' + kGoldStr + ' zl.</span>' +
                '</div>' +
                '</div>';
        }
        selectorHtml += '</div>';

        // 2. Rytířské ctnosti: pomocník pro vykreslení teček (pipů)
        function renderPips(current, max) {
            var out = '';
            for (var pi = 0; pi < max; pi++) {
                if (pi < current) out += '<span class="virtue-pip filled">●</span>';
                else out += '<span class="virtue-pip empty">○</span>';
            }
            return out;
        }

        // 3. Výbava rytíře (Armory Rack)
        var itemsHtml = '';
        var eqItems = window.PRS_GameEngine.getEquippedItems(p);
        if (p.items.length === 0) {
            itemsHtml = '<div class="equipment-rack">' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">🗡️</span> <span class="eq-name">Zbraň (volno)</span></div>' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">🛡️</span> <span class="eq-name">Zbroj (volno)</span></div>' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">💍</span> <span class="eq-name">Klenot (volno)</span></div>' +
                '<div class="eq-slot-pill empty"><span class="eq-icon">🏆</span> <span class="eq-name">Trofej (volno)</span></div>' +
                '</div>';
        } else {
            itemsHtml = '<div class="asset-list">';
            for (var i = 0; i < p.items.length; i++) {
                var it = p.items[i];
                if (!it.uid) {
                    it.uid = (it.id || "item") + "_" + (i + 1) + "_" + Math.random().toString(36).substring(2, 7);
                }
                var isEq = (it.isEquipped === true || (it.isEquipped !== false && eqItems[it.slot] === it));
                var isTrophy = (it.slot === "trophy");
                var slotLabel = this.formatSlotLabel(it.slot, true);
                var sellRatio = atMerchant ? this.state.config.sellRates.merchantItem : this.state.config.sellRates.anywhereItem;
                var sellVal = Math.round(it.price * sellRatio);
                itemsHtml += '<div class="asset-chip ' + (isEq ? 'chip-equipped' : 'chip-in-bag') + '">' +
                    '<span><small class="slot-badge ' + (isTrophy ? 'slot-badge-trophy' : '') + '">' + slotLabel + '</small> ' + it.icon + ' <strong>' + this.escapeHtml(it.name) + '</strong> <small>(⚔️' + it.boj + ' 🏇' + it.jizda + ' 💃' + it.tanec + ' ✨' + it.charisma + ')</small></span>' +
                    '<div style="display:flex;align-items:center;">' +
                    '  <button class="btn-equip-toggle ' + (isEq ? 'equipped' : 'in-bag') + '" onclick="PRS_App.handleToggleEquip(\'' + it.uid + '\', ' + i + ', ' + inspIdx + ')" title="' + (isEq ? 'Uložit do batohu' : 'Nasadit do aktivní výstroje') + '">' + (isEq ? '⚔️ Nasazeno' : '🎒 V batohu') + '</button>' +
                    '  <button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'item\', \'' + it.uid + '\', ' + i + ', ' + inspIdx + ')">Prodat +' + sellVal + ' zl.</button>' +
                    '</div>' +
                    '</div>';
            }
            itemsHtml += '</div>';
        }

        // 4. Panství a chovy zvířat
        var horseCount = 0, dogCount = 0, falconCount = 0, villageCount = 0, castleCount = 0;
        var nodesHtml = '';
        if (p.ownedNodes.length > 0) {
            nodesHtml = '<div class="asset-list">';
            for (var j = 0; j < p.ownedNodes.length; j++) {
                var nd = this.state.board.nodes[p.ownedNodes[j]];
                if (!nd) continue;
                if (nd.type === "ANIMAL") {
                    if (nd.setId === 1) horseCount++;
                    else if (nd.setId === 2) dogCount++;
                    else falconCount++;
                } else if (nd.type === "VILLAGE" || nd.type === "TOWN") {
                    villageCount++;
                } else if (nd.type === "CASTLE") {
                    castleCount++;
                }
                var inv = window.PRS_GameEngine.getNodeInvestedValue(this.state, nd);
                var bRatio = atMerchant ? this.state.config.sellRates.merchantBuilding : this.state.config.sellRates.anywhereBuilding;
                var bSellVal = Math.round(inv * bRatio);
                var upgBtn = "";
                if (nd.type === "VILLAGE" && nd.villageLevel < 3) {
                    var uCost = this.state.config.estates.villagePrices[nd.villageLevel] || 1500;
                    upgBtn = '<button class="btn-upg-mini" onclick="PRS_App.handleUpgradeVillage(' + nd.id + ')">★ Povýšit (' + uCost + ' zl.)</button>';
                }
                nodesHtml += '<div class="asset-chip">' +
                    '<span>' + nd.icon + ' <strong>' + this.escapeHtml(nd.name) + '</strong>' + (nd.type === "VILLAGE" ? ' (Úr. ' + nd.villageLevel + '/3)' : '') + '</span>' +
                    '<div>' + upgBtn + '<button class="btn-sell-mini" onclick="PRS_App.handleSellAsset(\'node\', ' + nd.id + ')">Prodat +' + bSellVal + ' zl.</button></div>' +
                    '</div>';
            }
            nodesHtml += '</div>';
        } else {
            nodesHtml = '<div class="fiefs-empty-hint">🏰 Rytíř zatím nevlastní panství ani stáje. Kupuj pole po království!</div>';
        }

        // 5. Sestavení odlehčeného, kompaktního profilu rytíře na tahu
        var curTab = this.activePlayerTab || "none";
        var tabContentHtml = "";
        if (curTab === "items") {
            tabContentHtml = '<div style="margin-top:0.45rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.2);">' +
                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">🎒 Rytířská výbava:</div>' +
                itemsHtml +
                '</div>';
        } else if (curTab === "fiefs") {
            tabContentHtml = '<div style="margin-top:0.45rem; padding-top:0.45rem; border-top:1px solid rgba(212,175,55,0.2);">' +
                '<div style="font-size:0.78rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">🏰 Panství a chovy:</div>' +
                '<div class="fiefs-summary-pills" style="margin-bottom:0.4rem;">' +
                '  <span class="fief-pill ' + (horseCount > 0 ? 'active' : '') + '">🐎 ' + horseCount + '</span>' +
                '  <span class="fief-pill ' + (dogCount > 0 ? 'active' : '') + '">🐕 ' + dogCount + '</span>' +
                '  <span class="fief-pill ' + (falconCount > 0 ? 'active' : '') + '">🦅 ' + falconCount + '</span>' +
                '  <span class="fief-pill ' + (villageCount > 0 ? 'active' : '') + '">🏡 ' + villageCount + '</span>' +
                '  <span class="fief-pill ' + (castleCount > 0 ? 'active' : '') + '">🏰 ' + castleCount + '</span>' +
                '</div>' +
                nodesHtml +
                '</div>';
        }

        el.innerHTML = '<div class="compact-knight-card" style="border-left: 4px solid ' + p.color + ';">' +
            '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">' +
            '    <div style="display:flex; align-items:center; gap:0.45rem;">' +
            '      <span class="ks-avatar" style="background:' + p.color + '; width:28px; height:28px; font-size:0.95rem; display:inline-flex; align-items:center; justify-content:center; border-radius:50%;">' + p.badge + '</span>' +
            '      <strong style="color:var(--text-main); font-size:0.92rem;">' + this.escapeHtml(p.name) + '</strong>' +
            (isCurTurn ? '<span class="tag-on-turn" style="font-size:0.68rem; padding:1px 5px;">👑 Na tahu</span>' : '') +
            '    </div>' +
            '    <div style="text-align:right;">' +
            '      <div style="font-size:0.88rem; font-weight:bold; color:var(--gold-light);">💰 ' + p.gold.toLocaleString("cs-CZ") + ' zl.</div>' +
            '      <div style="font-size:0.8rem; font-weight:bold; color:#f472b6;">💖 ' + p.totalHearts + ' / ' + targetHearts + '</div>' +
            '    </div>' +
            '  </div>' +

            '  <!-- 4 ctnosti v jednom kompaktním horizontálním řádku -->' +
            '  <div class="compact-virtues-row">' +
            '    <span class="cv-item" title="Boj: ' + st.boj + ' (výcvik ' + p.skills.boj + '/5)">⚔️ <strong>' + st.boj + '</strong></span>' +
            '    <span class="cv-item" title="Jízda: ' + st.jizda + ' (výcvik ' + p.skills.jizda + '/5)">🏇 <strong>' + st.jizda + '</strong></span>' +
            '    <span class="cv-item" title="Tanec: ' + st.tanec + ' (výcvik ' + p.skills.tanec + '/5)">💃 <strong>' + st.tanec + '</strong></span>' +
            '    <span class="cv-item" title="Charisma: ' + st.charisma + ' (výcvik ' + p.skills.charisma + '/5)">✨ <strong>' + st.charisma + '</strong></span>' +
            '  </div>' +

            '  <!-- Rychlé záložky pro zobrazení batohu a panství -->' +
            '  <div style="display:flex; gap:0.4rem; margin-top:0.4rem;">' +
            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "items" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;items&quot;)">' +
            '      🎒 Výbava (' + p.items.length + ')' + (curTab === "items" ? ' ▲' : ' ▼') +
            '    </button>' +
            '    <button class="btn-secondary" style="flex:1; padding:0.25rem 0.45rem; font-size:0.75rem; ' + (curTab === "fiefs" ? 'background:rgba(212,175,55,0.22); border-color:var(--gold); color:#fff;' : '') + '" onclick="PRS_App.toggleActivePlayerTab(&quot;fiefs&quot;)">' +
            '      🏰 Panství (' + p.ownedNodes.length + ')' + (curTab === "fiefs" ? ' ▲' : ' ▼') +
            '    </button>' +
            '  </div>' +
            tabContentHtml +
            '</div>';
    },

    renderActionPanel: function () {
        var el = document.getElementById("turn-action-panel");
        if (!el || !this.state) return;

        if (this.state.phase === "GAME_OVER") {
            var winP = this.state.players[this.state.winnerIndex || 0];
            if (!this.victoryModalShown) {
                this.victoryModalShown = true;
                var self = this;
                setTimeout(function () { self.openVictoryModal(); }, 400);
            }
            el.innerHTML = '<div class="action-card victory-banner">' +
                '<h3>👑 Královská svatba! Vítězem je ' + winP.badge + ' ' + this.escapeHtml(winP.name) + '!</h3>' +
                '<p>Získal celkem <strong>' + winP.totalHearts + ' 💖</strong> za ' + this.state.roundNumber + ' kol a získává ruku princezny.</p>' +
                '<div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.6rem;">' +
                '  <button class="btn-gold-lg" onclick="PRS_App.openVictoryModal()">👑 Otevřít ceremoniál &amp; Síň slávy</button>' +
                '  <button class="btn-secondary" onclick="PRS_App.startNewGame(true)">🔄 Nová partie</button>' +
                '</div>' +
                '</div>';
            return;
        }

        var player = this.state.players[this.state.currentPlayerIndex];
        var isBot = (player.type !== "Human");

        // Pokud jsme v Online místnosti s uzamčenou rolí (myOnlinePlayerIndex >= 0) a na tahu je jiný lidský hráč:
        if (this.state.roomCode && this.myOnlinePlayerIndex >= 0 && this.state.currentPlayerIndex !== this.myOnlinePlayerIndex && !isBot) {
            var myP = this.state.players[this.myOnlinePlayerIndex];
            var myName = myP ? myP.name : "Tvůj rytíř";
            el.innerHTML = '<div class="waiting-turn-card">' +
                '<div style="font-size:1.5rem; margin-bottom:0.35rem;">⏳</div>' +
                '<div style="font-family:\'Cinzel\',serif; font-size:1.05rem; color:var(--gold-light); font-weight:700; margin-bottom:0.35rem;">' +
                '  Čeká se na tah spoluhráče: <span style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</span>' +
                '</div>' +
                '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:0.75rem;">' +
                '  Tvůj zvolený rytíř u stolu je <strong>' + this.escapeHtml(myName) + '</strong>. Herní plán se automaticky synchronizuje každé 3 sekundy.' +
                '</p>' +
                '<div style="display:flex; justify-content:center; gap:0.5rem; flex-wrap:wrap;">' +
                '  <button class="btn-secondary" style="font-size:0.8rem; border-color:#38bdf8; color:#bae6fd;" onclick="PRS_App.pollOnlineSessionNow(true)">🔄 Zkontrolovat tah hned</button>' +
                '  <button class="btn-secondary" style="font-size:0.78rem;" onclick="PRS_App.setMyOnlinePlayerSlot(-1)">🔓 Odemknout (hrát za všechny u 1 PC)</button>' +
                '</div>' +
                '</div>';
            return;
        }

        if (this.state.phase === "ROLL") {
            var lastRollVal = this.state.lastRoll;
            var diceGlyph = this.getDiceGlyph(lastRollVal || 1);
            var diceStatus = lastRollVal ? ("Minulý hod: <strong>" + lastRollVal + "</strong>") : "Připrav kostku k hodu";

            if (isBot && this.autoBotEnabled) {
                el.innerHTML = '<div class="action-card" style="border-color:rgba(212,175,55,0.4);">' +
                    '<div class="turn-indicator">Na tahu je: <span style="color:' + player.color + ';">' + player.badge + ' <strong>' + this.escapeHtml(player.name) + '</strong></span></div>' +
                    '<div class="bot-auto-status" style="text-align:center; padding:0.9rem 0.6rem; background:rgba(0,0,0,0.35); border-radius:10px; margin:0.6rem 0; border:1px solid rgba(212,175,55,0.22);">' +
                    '  <div style="font-size:1.02rem; font-family:\'Cinzel\',serif; color:var(--gold-light); margin-bottom:0.35rem;">🤖 ' + this.escapeHtml(player.name) + ' provádí tah...</div>' +
                    '  <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">Tah počítače běží automaticky. Můžeš jej nechat proběhnout nebo přeskočit rovnou na svůj hod.</div>' +
                    '  <button class="btn-gold-lg" style="width:100%; font-size:0.86rem; padding:0.48rem 0.85rem;" onclick="PRS_App.skipToNextHumanTurn()">⚡ Přeskočit přímo na můj tah</button>' +
                    '</div>' +
                    '</div>';
                return;
            }

            el.innerHTML = '<div class="action-card">' +
                '<div class="turn-indicator">Na tahu je: <span style="color:' + player.color + ';">' + player.badge + ' <strong>' + this.escapeHtml(player.name) + '</strong></span></div>' +
                '<div class="dice-showcase-box">' +
                '  <div>' +
                '    <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:2px;">Královská hrací kostka</div>' +
                '    <div style="font-size:0.92rem; color:var(--gold-light);">' + diceStatus + '</div>' +
                '  </div>' +
                '  <div id="dice-cube-el" class="dice-cube clickable-dice" onclick="PRS_App.handleRollDice()" title="Klepni na kostku pro hod!">' + diceGlyph + '</div>' +
                '</div>' +
                (isBot
                    ? '<button class="btn-gold-lg" style="width:100%;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.stepBotNow()">🤖 Odehrát tah PC (' + this.escapeHtml(player.name) + ')</button>'
                    : '<button class="btn-gold-lg" style="width:100%;" ' + (this.isMoveAnimating ? 'disabled' : '') + ' onclick="PRS_App.handleRollDice()">🎲 HODIT KOSTKOU (1–6)</button>') +
                '</div>';
            return;
        }

        var pa = this.state.pendingAction || {};
        var btns = [];

        if (pa.canBuyNode) {
            var canAfford = player.gold >= pa.buyPrice;
            btns.push('<button class="btn-action-buy" ' + (!canAfford ? 'disabled' : '') + ' onclick="PRS_App.handleBuyNode()">📜 Koupit toto pole (' + pa.buyPrice + ' zl.)</button>');
        }

        if (pa.canUpgradeVillage) {
            var canAffordUpg = player.gold >= pa.upgradeCost;
            btns.push('<button class="btn-action-buy" ' + (!canAffordUpg ? 'disabled' : '') + ' onclick="PRS_App.handleUpgradeVillage(' + pa.nodeId + ')">🏘️ Povýšit vesnici (' + pa.upgradeCost + ' zl.)</button>');
        }

        if (pa.canTrainMaster) {
            if (pa.skill === "any") {
                var skList = [
                    { k: "boj", label: "⚔️ Boj" },
                    { k: "jizda", label: "🏇 Jízda" },
                    { k: "tanec", label: "💃 Tanec" },
                    { k: "charisma", label: "✨ Charisma" }
                ];
                for (var s = 0; s < skList.length; s++) {
                    var skKey = skList[s].k;
                    var curLvl = player.skills[skKey] || 0;
                    if (curLvl < 5) {
                        var cCost = this.state.config.masterCosts[curLvl];
                        btns.push('<button class="btn-action-skill" ' + (player.gold < cCost ? 'disabled' : '') + ' onclick="PRS_App.handleTrainMaster(\'' + skKey + '\')">🎓 Cvičit ' + skList[s].label + ' na ' + (curLvl + 1) + ' (' + cCost + ' zl.)</button>');
                    }
                }
            } else {
                var lvl = player.skills[pa.skill] || 0;
                if (lvl < 5) {
                    var cost = this.state.config.masterCosts[lvl];
                    btns.push('<button class="btn-action-skill" ' + (player.gold < cost ? 'disabled' : '') + ' onclick="PRS_App.handleTrainMaster(\'' + pa.skill + '\')">🎓 Vycvičit ' + pa.skill.toUpperCase() + ' na ' + (lvl + 1) + '/5 (' + cost + ' zl.)</button>');
                }
            }
        }

        if (pa.canShopMerchant) {
            var p1 = this.state.config.itemPackPrices.tier1;
            var p2 = this.state.config.itemPackPrices.tier2;
            var p3 = this.state.config.itemPackPrices.tier3;
            btns.push('<button class="btn-action-buy" onclick="PRS_App.openArmoryModal()" style="width:100%; font-weight:bold; background:linear-gradient(135deg, #b45309, #d97706); border-color:#fbbf24; padding:0.6rem; margin-bottom:0.4rem;">🛒 Otevřít Královskou zbrojnici &amp; Trh</button>');
            btns.push('<button class="btn-action-buy" ' + (player.gold < p1 ? 'disabled' : '') + ' onclick="PRS_App.handleBuyPack(1)">🎒 Koupit balíček Věcí 1 (' + p1 + ' zl.)</button>');
            btns.push('<button class="btn-action-buy" ' + (player.gold < p2 ? 'disabled' : '') + ' onclick="PRS_App.handleBuyPack(2)">⚔️ Koupit balíček Věcí 2 (' + p2 + ' zl.)</button>');
            btns.push('<button class="btn-action-buy" ' + (player.gold < p3 ? 'disabled' : '') + ' onclick="PRS_App.handleBuyPack(3)">👑 Koupit balíček Věcí 3 (' + p3 + ' zl.)</button>');
        }

        var specialCardHtml = "";

        if (pa.canResolveQuest && pa.questCard) {
            var q = pa.questCard;
            var stats = window.PRS_GameEngine.getEffectiveStats(this.state, player);
            var animalBonus = 0;
            if (q.questTier === "U1" && (stats.dogs > 0 || stats.falcons > 0)) {
                animalBonus = 1;
            } else if (q.questTier === "U3" && (stats.dogs > 0 || stats.falcons > 0)) {
                animalBonus = (stats.dogs > 0 && stats.falcons > 0) ? 2 : 1;
            }
            var horseBonus = (q.questTier !== "U1" && stats.horses > 0) ? (1 + Math.floor(stats.jizda / 2)) : 0;
            var basePower = stats.boj + animalBonus + horseBonus;
            var neededRoll = Math.max(1, q.difficulty - basePower);
            var winRate = (neededRoll > 6) ? 0 : Math.round(((7 - Math.max(1, neededRoll)) / 6) * 100);
            var qImg = q.img || ((q.questTier === "U1") ? "assets/tiles/u1_zver.jpg" : ((q.questTier === "U2") ? "assets/tiles/u2_monstrum.jpg" : "assets/tiles/u3_drak.jpg"));
            var tierTitle = (q.questTier === "U1") ? "Lesní zvířena" : ((q.questTier === "U2") ? "Temný netvor" : (q.tierGroup === "boss" ? "Legendární Dračí Saň" : "Drak království"));
            var tierColor = (q.questTier === "U1") ? "#f59e0b" : ((q.questTier === "U2") ? "#ef4444" : "#dc2626");

            var weaknessHtml = "";
            if (q.weakness) {
                var wMap = {
                    dogs: "🐕 Psi snadno odlákají pozornost draka",
                    falcon: "🦅 Sokol zaútočí na oči",
                    animals: "🐕+🦅 Zvířecí pomocníci snižují obtížnost",
                    horse: "🏇 Útok z plné jízdy na koni dává bonus",
                    dance: "💃 Hravého draka lze okouzlit tancem a charismatem",
                    elixir: "🧪 Hojivý lektvar z Lazaretu pomáhá přežít",
                    water_armor: "🛡️ Vodní či chladivá zbroj tlumí žár",
                    ice: "❄️ Ledové a mrazivé zbraně oslabují sopečného draka",
                    fire: "🔥 Oheň taví led a krystaly",
                    armor: "🛡️ Pevná plátová zbroj svádí blesky",
                    light: "✨ Zářící a posvěcené zbraně rozhánějí temnotu",
                    charisma: "👑 Vysoké Charisma umožňuje draka uchlácholit bez boje",
                    holy: "⚡ Prastarý kostlivec se bojí čisté rytířské cti",
                    courage: "💖 Pevné rytířské srdce zažene přízrak",
                    mastery: "🔮 Čtyřhlavý drak vyžaduje mistrovství ve všech 4 ctnostech",
                    animals_and_spear: "🏇+🐕 Pětihlavý drak vyžaduje koordinaci koně i smečky"
                };
                if (wMap[q.weakness]) {
                    weaknessHtml = '<div style="font-size:0.78rem; color:#fde68a; background:rgba(0,0,0,0.45); border:1px solid rgba(253,224,71,0.25); padding:4px 8px; border-radius:6px; margin-top:6px; margin-bottom:6px;">💡 Taktika: ' + wMap[q.weakness] + '</div>';
                }
            }
            if (q.trophyId && window.PRS_TROPHIES && window.PRS_TROPHIES[q.trophyId]) {
                var trDef = window.PRS_TROPHIES[q.trophyId];
                var statParts = [];
                if (trDef.boj) statParts.push("⚔️+" + trDef.boj);
                if (trDef.jizda) statParts.push("🏇+" + trDef.jizda);
                if (trDef.tanec) statParts.push("💃+" + trDef.tanec);
                if (trDef.charisma) statParts.push("✨+" + trDef.charisma);
                weaknessHtml += '<div style="font-size:0.78rem; color:#fef08a; background:rgba(212,175,55,0.18); border:1px solid rgba(212,175,55,0.4); padding:4px 8px; border-radius:6px; margin-bottom:6px;">🏆 Kořist vítěze: <strong>' + trDef.icon + ' ' + this.escapeHtml(trDef.name) + '</strong> <small style="color:#e7e5e4;">(' + statParts.join(" ") + ')</small></div>';
            }

            specialCardHtml = '<div class="combat-duel-card">' +
                '<div class="duel-card-header">' +
                '  <span class="duel-tier-badge" style="background:rgba(239,68,68,0.22); border-color:' + tierColor + '; color:' + tierColor + ';">⚔️ SOUBOJ: ' + q.questTier + ' (' + tierTitle + ')</span>' +
                '  <span class="duel-reward-pill">🏆 +' + q.gold.toLocaleString("cs-CZ") + ' zl.' + (q.hearts > 0 ? ' &nbsp;💖 +' + q.hearts : '') + '</span>' +
                '</div>' +
                '<div class="duel-monster-portrait-wrap">' +
                '  <img src="' + qImg + '" alt="' + this.escapeHtml(q.name) + '" class="duel-monster-art" />' +
                '  <div class="duel-monster-overlay">' +
                '    <div class="duel-monster-name">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>' +
                '    <div class="duel-monster-sub">' + this.escapeHtml(q.desc || (q.questTier === "U3" ? 'Obávaná dračí bestie království' : 'Divoký protivník v temných hvozdech')) + '</div>' +
                '  </div>' +
                '</div>' +
                '<div class="duel-arena-grid">' +
                '  <div class="duel-combatant" style="border-color:' + player.color + ';">' +
                '    <div class="duel-fighter-role" style="color:' + player.color + ';">' + player.badge + ' ' + this.escapeHtml(player.name) + '</div>' +
                '    <div class="duel-fighter-stat">⚔️ ' + basePower + ' <small>stálá síla</small></div>' +
                '    <div class="duel-fighter-sub">' +
                '      Boj ' + stats.boj +
                (horseBonus > 0 ? ' + Kůň ' + horseBonus : '') +
                (animalBonus > 0 ? (' + ' + (q.questTier === 'U3' ? 'Odlákání draka ' : 'Zvíře ') + animalBonus) : '') +
                '    </div>' +
                '  </div>' +
                '  <div class="duel-vs-badge">VS</div>' +
                '  <div class="duel-combatant">' +
                '    <div class="duel-fighter-role" style="color:#f87171;">' + q.icon + ' ' + this.escapeHtml(q.name) + '</div>' +
                '    <div class="duel-fighter-stat" style="color:#ef4444;">🛡️ ' + q.difficulty + ' <small>obtížnost</small></div>' +
                '    <div class="duel-fighter-sub">Potřebný hod: 🎲 <strong>' + (neededRoll <= 1 ? '1+' : (neededRoll <= 6 ? neededRoll + '+' : 'nelze bez tréninku')) + '</strong></div>' +
                '  </div>' +
                '</div>' +
                '<div class="duel-odds-container">' +
                '  <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">' +
                '    <span>Pravděpodobnost vítězství:</span>' +
                '    <strong style="color:' + (winRate >= 50 ? '#86efac' : '#fca5a5') + ';">' + winRate + ' %</strong>' +
                '  </div>' +
                '  <div class="duel-odds-bar-track">' +
                '    <div class="duel-odds-bar-fill" style="width:' + winRate + '%; background:' + (winRate >= 65 ? 'linear-gradient(90deg, #10b981, #22c55e)' : (winRate >= 35 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #dc2626, #ef4444)')) + ';"></div>' +
                '  </div>' +
                '</div>' +
                weaknessHtml +
                '<button id="btn-duel-attack" class="duel-attack-action-btn" onclick="PRS_App.handleResolveQuest()">' +
                '  ⚔️ HODIT KOSTKOU A ZAÚTOČIT!' +
                '</button>' +
                '</div>';
        }

        if (pa.canResolveFestival) {
            var fType = pa.festivalType || "turnaj";
            var fTitle = (fType === "turnaj" ? "Královský Turnaj 🏇" : (fType === "ples" ? "Zámecký Ples 💃" : "Velký Závod 🐎"));
            specialCardHtml = '<div class="festival-encounter-card">' +
                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.45rem;">' +
                '  <div class="standing-tile-medallion" style="border-color:#ec4899;"><img src="assets/tiles/festival.jpg" alt="Slavnost" /></div>' +
                '  <div>' +
                '    <span class="standing-tile-badge" style="background:rgba(236,72,153,0.25); color:#fbcfe8; border-color:#ec4899;">💖 Královské klání</span>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#fdf2f8;">' + fTitle + '</div>' +
                '  </div>' +
                '</div>' +
                '<p style="font-size:0.83rem; color:#fce7f3; margin-bottom:0.5rem;">Hraje se o prestižní <strong>Srdce princezny 💖</strong>! Klání se zúčastní všichni způsobilí rytíři království.</p>' +
                '<button class="btn-action-festival" style="width:100%; font-size:0.95rem; padding:0.6rem;" onclick="PRS_App.handleResolveFestival()">🏆 VYHODNOTIT SLAVNOST A ROZDAT SRDCE!</button>' +
                '</div>';
        }

        // Karta Náhody s 3D otáčením a pečetí
        if (pa.chanceCard) {
            var c = pa.chanceCard;
            var isFlipped = (this.flippedChanceCardId === c.id);
            var effColor = (c.effect === "gold_loss" || c.effect === "robbers") ? "#fca5a5" : ((c.effect === "hearts" || c.effect === "ball") ? "#f472b6" : "#fde047");
            specialCardHtml += '<div class="chance-card-box">' +
                '  <div id="chance-card-inner" class="chance-card-inner ' + (isFlipped ? 'flipped' : '') + '" onclick="PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">' +
                '    <div class="chance-card-face chance-card-back">' +
                '      <div class="chance-seal">👑</div>' +
                '      <div style="font-family:\'Cinzel\',serif; font-size:1.15rem; font-weight:bold; color:var(--gold-light); margin-bottom:0.25rem;">KRÁLOVSKÝ PERGAMEN OSUDU</div>' +
                '      <p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.6rem;">Stoupnul jsi na pole Náhody! Klepnutím prolomíš pečeť a odhalíš vůli osudu.</p>' +
                '      <button class="btn-action-tavern" style="font-size:0.85rem; padding:0.35rem 0.85rem;" onclick="event.stopPropagation(); PRS_App.toggleChanceCardFlip(\'' + c.id + '\')">📜 OTOČIT KARTU NÁHODY</button>' +
                '    </div>' +
                '    <div class="chance-card-face chance-card-front">' +
                '      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem; border-bottom:1px solid rgba(250,204,21,0.3); padding-bottom:0.3rem;">' +
                '        <span class="standing-tile-badge" style="background:rgba(234,179,8,0.25); color:#fef08a; border-color:#eab308;">❓ KARTA NÁHODY</span>' +
                '        <span style="font-size:0.8rem; color:#fef08a;">' + c.id + '</span>' +
                '      </div>' +
                '      <div style="font-family:\'Cinzel\',serif; font-size:1.1rem; font-weight:bold; color:#fef08a; margin-bottom:0.35rem;">' + this.escapeHtml(c.title) + '</div>' +
                '      <p style="font-size:0.86rem; color:#f8fafc; line-height:1.35; margin-bottom:0.45rem;">' + this.escapeHtml(c.text) + '</p>' +
                '      <div style="margin-top:auto; font-size:0.83rem; font-weight:bold; color:' + effColor + '; background:rgba(0,0,0,0.45); padding:0.35rem 0.6rem; border-radius:6px;">' +
                '        ⚡ ' + this.formatGameText(pa.summary || c.text) +
                '      </div>' +
                '    </div>' +
                '  </div>' +
                '</div>';
        }

        // Šatlava (Vězení)
        if (pa.canPayPrisonBail || pa.canAttemptPrisonEscape || pa.canServeSentence) {
            var canAffordBail = player.gold >= (pa.bailCost || 1000);
            specialCardHtml += '<div class="prison-encounter-card">' +
                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +
                '  <div class="standing-tile-medallion" style="border-color:#71717a; background:#18181b;"><span style="font-size:1.6rem;">⛓️</span></div>' +
                '  <div>' +
                '    <span class="standing-tile-badge" style="background:rgba(113,113,122,0.3); color:#e4e4e7; border-color:#71717a;">⛓️ Žalář &amp; Vězení</span>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#f4f4f5;">Královská Šatlava</div>' +
                '  </div>' +
                '</div>' +
                '<p style="font-size:0.84rem; color:#d4d4d8; margin-bottom:0.6rem;">Rytíř je uvězněn! Vyber si způsob propuštění:</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +
                '  <button class="btn-action-prison" ' + (!canAffordBail ? 'disabled' : '') + ' onclick="PRS_App.handlePayPrisonBail()">🔓 Složit kauci (' + (pa.bailCost || 1000) + ' zl.) – Okamžité propuštění</button>' +
                '  <button class="btn-action-prison" onclick="PRS_App.handlePrisonEscape()">🏃‍♂️ Pokus o noční útěk (Hoď 🎲 6 – zisk +500 zl. / jinak zůstáváš)</button>' +
                '  <button class="btn-action-prison" style="background:#27272a; border-color:#52525b;" onclick="PRS_App.handleServePrisonSentence()">⚖️ Odpykat trest (královský rychtář tě propustí)</button>' +
                '</div>' +
                '</div>';
        }

        // Špitál (Lazaret)
        if (pa.canBuyHospitalElixir || pa.canRestHospital) {
            var canAffordElix = player.gold >= (pa.elixirCost || 800);
            specialCardHtml += '<div class="hospital-encounter-card">' +
                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +
                '  <div class="standing-tile-medallion" style="border-color:#38bdf8; background:#0c4a6e;"><span style="font-size:1.6rem;">🏥</span></div>' +
                '  <div>' +
                '    <span class="standing-tile-badge" style="background:rgba(2,132,199,0.3); color:#7dd3fc; border-color:#0284c7;">🏥 Lazaret</span>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#f0f9ff;">Královský Lazaret &amp; Ranhojič</div>' +
                '  </div>' +
                '</div>' +
                '<p style="font-size:0.84rem; color:#bae6fd; margin-bottom:0.6rem;">Zranění rytíři zde nabírají síly do dalších klání:</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +
                '  <button class="btn-action-hospital" ' + (!canAffordElix ? 'disabled' : '') + ' onclick="PRS_App.handleBuyHospitalElixir()">🧪 Zakoupit Hojivý lektvar (+1 Boj, +0.5 💖 za ' + (pa.elixirCost || 800) + ' zl.)</button>' +
                '  <button class="btn-action-hospital" style="background:#0369a1; border-color:#0284c7;" onclick="PRS_App.handleRestHospital()">🌿 Zdarma odpočívat u bylinkáře</button>' +
                '</div>' +
                '</div>';
        }

        // Krčma (Hostinec)
        if (pa.canTavernGamble || pa.canBuyTavernRound) {
            var canAffordBet = player.gold >= (pa.gambleBet || 500);
            var canAffordRound = player.gold >= (pa.roundCost || 400);
            specialCardHtml += '<div class="tavern-encounter-card">' +
                '<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem;">' +
                '  <div class="standing-tile-medallion" style="border-color:#f59e0b; background:#451a03;"><span style="font-size:1.6rem;">🍺</span></div>' +
                '  <div>' +
                '    <span class="standing-tile-badge" style="background:rgba(217,119,6,0.3); color:#fde68a; border-color:#d97706;">🍺 Hostinec</span>' +
                '    <div style="font-family:\'Cinzel\',serif; font-size:1.05rem; font-weight:bold; color:#fef3c7;">Krčma U Zlatého korbelu</div>' +
                '  </div>' +
                '</div>' +
                '<p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.6rem;">U krbu sedí veselá chasa i záletní kupci. Vyber si zábavu:</p>' +
                '<div style="display:flex; flex-direction:column; gap:0.4rem;">' +
                '  <button class="btn-action-tavern" ' + (!canAffordBet ? 'disabled' : '') + ' onclick="PRS_App.handleTavernGamble()">🎲 Kostky s krčmářem (Sázka ' + (pa.gambleBet || 500) + ' zl. – hod 2 kostkami)</button>' +
                '  <button class="btn-action-tavern" ' + (!canAffordRound ? 'disabled' : '') + ' onclick="PRS_App.handleBuyTavernRound()">🍻 Runda medoviny pro celou hospodu (+0.5 💖 za ' + (pa.roundCost || 400) + ' zl.)</button>' +
                '</div>' +
                '</div>';
        }

        // Nucené vyrovnání dluhu (Dražba majetku za 60 %)
        if (pa.debt) {
            var creditor = this.state.players[pa.debt.creditorIndex];
            var credName = creditor ? creditor.name : "věřiteli";
            var rate = (this.state.config.sellRates && this.state.config.sellRates.forcedLiquidation) || 0.60;
            var assetsRows = "";

            // 1. Předměty v inventáři
            for (var itIdx = 0; itIdx < player.items.length; itIdx++) {
                var itObj = player.items[itIdx];
                var itLiq = Math.round(itObj.price * rate);
                assetsRows += '<div class="debt-asset-row">' +
                    '<span>' + itObj.icon + ' <strong>' + this.escapeHtml(itObj.name) + '</strong> (' + (itObj.isEquipped === false ? '🎒 v batohu' : '⚔️ nasazeno') + ')</span>' +
                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'item\', \'' + itObj.id + '\')">Odprodat za +' + itLiq + ' zl.</button>' +
                    '</div>';
            }

            // 2. Vlastněná panství a zvířata
            for (var ndIdx = 0; ndIdx < player.ownedNodes.length; ndIdx++) {
                var ndObj = this.state.board.nodes[player.ownedNodes[ndIdx]];
                if (!ndObj) continue;
                if (ndObj.type === "VILLAGE" && (ndObj.villageLevel || 1) > 1) {
                    var downCost = (this.state.config.estates.villagePrices && this.state.config.estates.villagePrices[ndObj.villageLevel - 1]) || 1500;
                    var downLiq = Math.round(downCost * rate);
                    assetsRows += '<div class="debt-asset-row">' +
                        '<span>🏘️ Snížit vesnici <strong>' + this.escapeHtml(ndObj.name) + '</strong> z ' + ndObj.villageLevel + '★ na ' + (ndObj.villageLevel - 1) + '★</span>' +
                        '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'village_downgrade\', ' + ndObj.id + ')">Snížit za +' + downLiq + ' zl.</button>' +
                        '</div>';
                }
                var investVal = window.PRS_GameEngine.getNodeInvestedValue(this.state, ndObj);
                var ndLiq = Math.round(investVal * rate);
                assetsRows += '<div class="debt-asset-row">' +
                    '<span>' + (ndObj.icon || '📍') + ' <strong>' + this.escapeHtml(ndObj.name) + '</strong> (' + ndObj.code + ')</span>' +
                    '<button class="btn-liquidate-mini" onclick="PRS_App.handleLiquidateAsset(\'node\', ' + ndObj.id + ')">Odprodat za +' + ndLiq + ' zl.</button>' +
                    '</div>';
            }

            specialCardHtml += '<div class="debt-encounter-card">' +
                '<span class="debt-badge">⚖️ Královská dražba &amp; Vyrovnání dluhu</span>' +
                '<div class="debt-title">Zbývá doplatit: <span style="color:#ef4444;">' + pa.debt.remainingDebt + ' zl.</span></div>' +
                '<p style="font-size:0.84rem; color:#fde68a; margin-bottom:0.5rem;">Hotovost nestačila na úhradu nájmu hráči <strong>' + this.escapeHtml(credName) + '</strong>. K vyrovnání závazku musíš odprodat část majetku Královské komoře za 60 % pořizovací ceny:</p>' +
                '<div class="debt-assets-list">' + (assetsRows || '<div class="empty-note">Žádný majetek k odprodeji.</div>') + '</div>' +
                '<div style="margin-top:0.6rem; display:flex; gap:0.5rem; flex-wrap:wrap;">' +
                '  <button class="btn-action-buy" style="background:#b45309; border-color:#fbbf24; font-weight:bold; width:100%;" onclick="PRS_App.handleAutoLiquidateDebt()">⚡ Automaticky vybrat a uhradit dluh</button>' +
                '</div>' +
                '</div>';
        }

        var mustCompleteFirst = pa.canResolveQuest || pa.canResolveFestival || pa.isImprisoned || pa.debt;
        if (!mustCompleteFirst) {
            btns.push('<button class="btn-end-turn" onclick="PRS_App.handleEndTurn()">➡️ Ukončit tah</button>');
        }

        var rollVal = this.state.lastRoll || 1;
        var rollGlyph = this.getDiceGlyph(rollVal);
        var landedNode = (this.state.board && this.state.board.nodes) ? this.state.board.nodes[player.nodeId] : null;

        var landedLocHtml = "";
        if (landedNode) {
            landedLocHtml = '<div class="dice-landed-loc">' +
                '<span class="loc-label">Vstup na pole:</span> ' +
                '<span class="loc-name">' + (landedNode.icon || "📍") + ' <strong>' + this.escapeHtml(landedNode.name) + '</strong></span>' +
                (landedNode.code ? ' <span class="loc-code">(' + this.escapeHtml(landedNode.code) + ')</span>' : '') +
                '</div>';
        }

        var encounterHtml = this.parseTurnEncounter(pa.summary || "");

        el.innerHTML = specialCardHtml +
            '<div class="action-card">' +
            '<div class="dice-badge-row">' +
            '  <div class="dice-cube-mini" title="Hod: ' + rollVal + '">' + rollGlyph + '</div>' +
            '  <div class="dice-badge-content">' +
            '    <div class="dice-roll-badge">🎲 Hod kostkou: <strong>' + rollVal + '</strong></div>' +
            landedLocHtml +
            '  </div>' +
            '</div>' +
            encounterHtml +
            '<div class="action-buttons-wrap">' + btns.join(" ") + '</div>' +
            '</div>';
    },

    formatGameText: function (rawText) {
        if (!rawText) return "";
        var s = String(rawText);
        // 1. Escapování základních HTML znaků pro bezpečnost
        s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // 2. Odstranění zbytečné desetinné nuly u celých čísel srdcí (+1,0 💖 -> +1 💖)
        s = s.replace(/([+-]?\d+),0\s*(💖|srdce)/gi, "$1 $2");
        // 3. Převod markdown tučného písma **text** na stylizovaný span
        s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="hl-bold">$1</strong>');
        // 4. Zlaté zvýraznění zlaťáků (+1 500 zl., -800 zl., 2 000 zl.)
        s = s.replace(/([+-]\s*[0-9]+(?:\s*[0-9]+)*\s*zl\.)/g, '<span class="hl-gold">$1</span>');
        // 5. Růžové zářící zvýraznění Princezniných srdcí (+1 💖, +0,5 💖)
        s = s.replace(/(\+[0-9]+(?:,[0-9]+)?\s*💖)/g, '<span class="hl-heart">$1</span>');
        return s;
    },

    parseTurnEncounter: function (summary) {
        if (!summary) return "";
        var s = String(summary).trim();

        // Detekce strukturovaného formátu: Tag – **Title**: Lore / Text
        var m = s.match(/^(.*?)\s*–\s*\*\*(.*?)\*\*:\s*(.*)$/);
        if (m) {
            var tag = m[1].trim();
            var title = m[2].trim();
            var rest = m[3].trim();

            var rewardMatch = rest.match(/(Získáváš\s+[^.!?]+[.!?]|Ztrácíš\s+[^.!?]+[.!?]|Zaplatíš\s+[^.!?]+[.!?]|Získáno\s+[^.!?]+[.!?]|\+[0-9]+(?:,[0-9]+)?\s*💖[^.!?]*|\+[0-9\s]+\s*zl\.[^.!?]*)/i);
            var lore = rest;
            var rewardHtml = "";

            if (rewardMatch) {
                var rewardStr = rewardMatch[0];
                var idx = rest.indexOf(rewardStr);
                if (idx > 0) {
                    lore = rest.substring(0, idx).trim();
                }
                rewardHtml = '<div class="encounter-reward-badge">✨ ' + this.formatGameText(rewardStr) + '</div>';
            }

            return '<div class="turn-encounter-card encounter-chance">' +
                '  <div class="encounter-header">' +
                '    <span class="encounter-type-tag">' + this.formatGameText(tag) + '</span>' +
                '    <div class="encounter-title">' + this.formatGameText(title) + '</div>' +
                '  </div>' +
                '  <div class="encounter-lore">' + this.formatGameText(lore) + '</div>' +
                rewardHtml +
                '</div>';
        }

        // Běžná událost (nákup, mýtné, návštěva krčmy, výcvik)
        return '<div class="turn-encounter-card">' +
            '  <div class="turn-summary-text">' + this.formatGameText(s) + '</div>' +
            '</div>';
    },

    addLog: function (text, type) {
        if (!this.state) return;
        window.PRS_GameEngine.addLog(this.state, text, type || "action");
        this.renderLogs();
    },

    renderLogs: function () {
        var el = document.getElementById("game-log-list");
        if (!el || !this.state) return;
        var html = "";
        for (var i = 0; i < Math.min(30, this.state.logs.length); i++) {
            var l = this.state.logs[i];
            html += '<div class="log-entry log-' + l.type + '"><span class="log-turn">[Kolo ' + l.round + ']</span> ' + this.formatGameText(l.text) + '</div>';
        }
        el.innerHTML = html;
    },

    // --- HERNÍ AKCE Z UI & ANIMACE KROKOVÁNÍ ---
    getDiceGlyph: function (roll) {
        var glyphs = { 1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };
        return glyphs[roll] || "🎲";
    },

    animatePlayerMove: function (playerIndex, path, onComplete) {
        var self = this;
        if (!path || path.length <= 1) {
            self.isMoveAnimating = false;
            self.animatingPlayerIndex = null;
            self.animTokenPos = null;
            if (onComplete) onComplete();
            return;
        }

        self.isMoveAnimating = true;
        self.animatingPlayerIndex = playerIndex;
        var nodes = self.state.board.nodes;
        var stepIndex = 0;
        var movingPlayer = (self.state.players && self.state.players[playerIndex]) ? self.state.players[playerIndex] : null;
        var isBotMoving = movingPlayer && movingPlayer.type !== "Human";
        var stepDuration = isBotMoving ? 65 : (self.fastAnim ? 75 : 125);

        function runNextStep() {
            if (stepIndex >= path.length - 1) {
                self.isMoveAnimating = false;
                self.animatingPlayerIndex = null;
                self.animTokenPos = null;
                if (onComplete) onComplete();
                return;
            }

            var startNode = nodes[path[stepIndex]];
            var endNode = nodes[path[stepIndex + 1]];
            if (!startNode || !endNode) {
                stepIndex++;
                runNextStep();
                return;
            }

            var startX = startNode.x;
            var startY = startNode.y - 15;
            var endX = endNode.x;
            var endY = endNode.y - 15;

            var startTime = performance.now();

            function frame(now) {
                var elapsed = now - startTime;
                var t = Math.min(1, elapsed / stepDuration);
                var easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

                var curX = startX + (endX - startX) * easeT;
                var hop = Math.sin(t * Math.PI) * 16;
                var curY = startY + (endY - startY) * easeT - hop;

                self.animTokenPos = { x: Math.round(curX), y: Math.round(curY) };
                self.renderBoardTokens();

                if (t < 1) {
                    requestAnimationFrame(frame);
                } else {
                    if (window.PRS_Audio) window.PRS_Audio.playStep();
                    self.renderBoardTokens();
                    stepIndex++;
                    var hopPause = isBotMoving ? 12 : (self.fastAnim ? 15 : 25);
                    setTimeout(runNextStep, hopPause);
                }
            }

            requestAnimationFrame(frame);
        }

        runNextStep();
    },

    executeRollAndAnimateMove: function (player, onFinish) {
        var self = this;
        if (self.isMoveAnimating || !self.state) return;
        self.isMoveAnimating = true;

        // Bezpečnostní watchdog: pokud by animace selhala nebo se zasekla, po 3 s uvolníme zámek
        clearTimeout(self.moveAnimationWatchdog);
        self.moveAnimationWatchdog = setTimeout(function () {
            if (self.isMoveAnimating) {
                self.isMoveAnimating = false;
                self.animatingPlayerIndex = null;
                self.animTokenPos = null;
                self.renderGameScreen();
                if (onFinish) onFinish();
            }
        }, 3200);

        if (window.PRS_Audio) window.PRS_Audio.playDice();

        var isBot = (player.type !== "Human");
        var diceEl = document.getElementById("dice-cube-el");
        if (diceEl) {
            diceEl.classList.add("dice-rolling");
        }

        var shuffleCount = 0;
        var shuffleLimit = isBot ? 2 : 6;
        var shuffleInterval = setInterval(function () {
            shuffleCount++;
            var tempVal = Math.floor(Math.random() * 6) + 1;
            if (diceEl) diceEl.textContent = self.getDiceGlyph(tempVal);
            if (shuffleCount >= shuffleLimit) {
                clearInterval(shuffleInterval);
            }
        }, isBot ? 40 : 60);

        var preMoveDelay = isBot ? 100 : 380;
        setTimeout(function () {
            var res = window.PRS_GameEngine.rollAndMove(self.state);
            if (!res) {
                self.isMoveAnimating = false;
                clearTimeout(self.moveAnimationWatchdog);
                if (onFinish) onFinish();
                return;
            }

            if (diceEl) {
                diceEl.classList.remove("dice-rolling");
                diceEl.textContent = self.getDiceGlyph(res.roll);
            }

            self.animatePlayerMove(player.index, res.path, function () {
                clearTimeout(self.moveAnimationWatchdog);
                self.selectedNodeId = player.nodeId;
                self.renderGameScreen();
                self.inspectNode(player.nodeId);
                self.saveSessionAuto();
                if (self.deviceProfile && self.deviceProfile.device === "mobile") {
                    if (self.viewport.scale > 1.05) {
                        self.centerOnActivePlayer();
                    }
                }
                if (onFinish) onFinish();
            });
        }, preMoveDelay);
    },

    handleRollDice: function () {
        var self = this;
        if (!self.state) return;
        if (self.isMoveAnimating) return;
        var player = self.state.players[self.state.currentPlayerIndex];
        if (!player || player.type !== "Human") return;

        self.executeRollAndAnimateMove(player);
    },

    handleBuyNode: function () {
        var ok = window.PRS_GameEngine.buyCurrentNode(this.state);
        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    handleUpgradeVillage: function (nodeId) {
        var ok = window.PRS_GameEngine.upgradeVillage(this.state, nodeId);
        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    handleTrainMaster: function (skill) {
        var ok = window.PRS_GameEngine.trainAtMaster(this.state, skill);
        if (ok && window.PRS_Audio) window.PRS_Audio.playNotice();
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    handleBuyPack: function (tier) {
        var ok = window.PRS_GameEngine.buyItemPack(this.state, tier);
        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    handleToggleEquip: function (itemId, itemIndex, playerIndex) {
        if (!this.state) return;
        var res = window.PRS_GameEngine.toggleEquipItem(this.state, itemId, itemIndex, playerIndex);
        if (!res.ok) {
            if (this.addLog) this.addLog(res.message, "action");
            return;
        }
        if (window.PRS_Audio) window.PRS_Audio.playItem();
        this.renderLogs();
        this.renderPlayersStandings();
        this.renderActivePlayerPanel();
        this.renderHeartTrack();
        this.renderStandingNodeCard();
        this.saveSessionAuto();
    },

    handleSellAsset: function (assetType, assetId, itemIndex, playerIndex) {
        var ok = window.PRS_GameEngine.sellAsset(this.state, assetType, assetId, itemIndex, playerIndex);
        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();
        this.renderGameScreen();
    },

    handleLiquidateAsset: function (assetType, assetId) {
        if (!this.state) return;
        var res = window.PRS_GameEngine.liquidateAssetForDebt(this.state, assetType, assetId);
        if (res && res.ok) {
            if (window.PRS_Audio) window.PRS_Audio.playCoin();
        } else if (res && res.message) {
            this.addLog(res.message, "action");
        }
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    handleAutoLiquidateDebt: function () {
        if (!this.state) return;
        var p = this.state.players[this.state.currentPlayerIndex];
        window.PRS_GameEngine.autoLiquidateDebt(this.state, p);
        if (window.PRS_Audio) window.PRS_Audio.playCoin();
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    handleResolveQuest: function () {
        var btn = document.getElementById("btn-duel-attack");
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = "🎲 Vrhám kostku do souboje...";
        }
        if (window.PRS_Audio) window.PRS_Audio.playSword();

        var self = this;
        setTimeout(function () {
            var res = window.PRS_GameEngine.resolveQuest(self.state);
            if (res && res.won) {
                if (window.PRS_Audio) window.PRS_Audio.playFanfare();
            } else {
                if (window.PRS_Audio) window.PRS_Audio.playOminous();
            }
            self.renderGameScreen();
            self.saveSessionAuto();
        }, 450);
    },

    handleResolveFestival: function () {
        if (window.PRS_Audio) window.PRS_Audio.playFanfare();
        window.PRS_GameEngine.resolveFestival(this.state);
        this.renderGameScreen();
        this.saveSessionAuto();
    },

    // --- INTERAKTIVNÍ KARTA NÁHODY (3D OTOČENÍ) ---
    toggleChanceCardFlip: function (cardId) {
        if (this.flippedChanceCardId === cardId) {
            this.flippedChanceCardId = null;
        } else {
            this.flippedChanceCardId = cardId;
            if (window.PRS_Audio) window.PRS_Audio.playItem();
        }
        this.renderActionPanel();
    },

    // --- SPECIÁLNÍ POLE: ŠATLAVA (PRISON) ---
    handlePayPrisonBail: function () {
        var ok = window.PRS_GameEngine.payPrisonBail(this.state);
        if (ok && window.PRS_Audio) window.PRS_Audio.playCoin();
        this.renderGameScreen();
    },

    handlePrisonEscape: function () {
        if (window.PRS_Audio) window.PRS_Audio.playDice();
        var res = window.PRS_GameEngine.attemptPrisonEscape(this.state);
        if (res && res.success) {
            if (window.PRS_Audio) {
                setTimeout(function () {
                    window.PRS_Audio.playFanfare();
                }, 350);
            }
        } else {
            if (window.PRS_Audio) window.PRS_Audio.playSword();
        }
        this.renderGameScreen();
    },

    handleServePrisonSentence: function () {
        window.PRS_GameEngine.servePrisonSentence(this.state);
        if (window.PRS_Audio) window.PRS_Audio.playStep();
        this.renderGameScreen();
    },

    // --- SPECIÁLNÍ POLE: ŠPITÁL (HOSPITAL) ---
    handleBuyHospitalElixir: function () {
        var ok = window.PRS_GameEngine.buyHospitalElixir(this.state);
        if (ok && window.PRS_Audio) {
            window.PRS_Audio.playCoin();
            setTimeout(function () {
                window.PRS_Audio.playFanfare();
            }, 300);
        }
        this.renderGameScreen();
    },

    handleRestHospital: function () {
        window.PRS_GameEngine.restInHospital(this.state);
        if (window.PRS_Audio) window.PRS_Audio.playStep();
        this.renderGameScreen();
    },

    // --- SPECIÁLNÍ POLE: KRČMA (TAVERN) ---
    handleTavernGamble: function () {
        if (window.PRS_Audio) window.PRS_Audio.playDice();
        var res = window.PRS_GameEngine.gambleInTavern(this.state);
        if (res && res.win && window.PRS_Audio) {
            setTimeout(function () {
                window.PRS_Audio.playCoin();
            }, 300);
        }
        this.renderGameScreen();
    },

    handleBuyTavernRound: function () {
        var ok = window.PRS_GameEngine.buyTavernRound(this.state);
        if (ok && window.PRS_Audio) {
            window.PRS_Audio.playCoin();
            setTimeout(function () {
                window.PRS_Audio.playFanfare();
            }, 300);
        }
        this.renderGameScreen();
    },

    handleEndTurn: function () {
        if (window.PRS_Audio) window.PRS_Audio.playStep();
        this.isMoveAnimating = false;
        this.animatingPlayerIndex = null;
        this.animTokenPos = null;
        if (this.autoBotTimer) {
            clearTimeout(this.autoBotTimer);
            this.autoBotTimer = null;
        }
        window.PRS_GameEngine.endTurn(this.state);
        this.selectedNodeId = this.state.players[this.state.currentPlayerIndex].nodeId;
        this.renderGameScreen();
        this.saveSessionAuto();
        this.scheduleBotTurnIfNeeded();
    },

    skipToNextHumanTurn: function () {
        if (!this.state || this.state.phase === "GAME_OVER") return;
        if (this.autoBotTimer) {
            clearTimeout(this.autoBotTimer);
            this.autoBotTimer = null;
        }
        this.isMoveAnimating = false;
        this.animatingPlayerIndex = null;
        this.animTokenPos = null;

        var safetyLimit = 16;
        while (safetyLimit-- > 0) {
            var cur = this.state.players[this.state.currentPlayerIndex];
            if (!cur || cur.type === "Human" || this.state.phase === "GAME_OVER") break;
            window.PRS_GameEngine.executeBotTurn(this.state);
        }

        var activeP = this.state.players[this.state.currentPlayerIndex];
        if (activeP) {
            this.selectedNodeId = activeP.nodeId;
        }
        this.renderGameScreen();
        this.saveSessionAuto();
        if (window.PRS_Audio) window.PRS_Audio.playNotice();
    },

    stepBotNow: function () {
        var self = this;
        if (!self.state || self.state.phase === "GAME_OVER") return;
        var bot = self.state.players[self.state.currentPlayerIndex];
        if (!bot || bot.type === "Human") return;

        if (self.isMoveAnimating) {
            if (self.autoBotTimer) clearTimeout(self.autoBotTimer);
            self.autoBotTimer = setTimeout(function () {
                self.stepBotNow();
            }, 80);
            return;
        }

        if (self.state.phase === "ROLL") {
            self.executeRollAndAnimateMove(bot, function () {
                window.PRS_GameEngine.executeBotTurn(self.state);
                self.selectedNodeId = bot.nodeId;
                self.renderGameScreen();
                self.saveSessionAuto();
                self.scheduleBotTurnIfNeeded();
            });
        } else {
            window.PRS_GameEngine.executeBotTurn(self.state);
            self.selectedNodeId = bot.nodeId;
            self.renderGameScreen();
            self.saveSessionAuto();
            self.scheduleBotTurnIfNeeded();
        }
    },

    toggleAutoBots: function (checked) {
        this.autoBotEnabled = checked;
        if (checked) this.scheduleBotTurnIfNeeded();
    },

    toggleFastAnim: function (checked) {
        this.fastAnim = checked;
    },

    scheduleBotTurnIfNeeded: function () {
        var self = this;
        if (this.autoBotTimer) {
            clearTimeout(this.autoBotTimer);
            this.autoBotTimer = null;
        }
        if (!this.autoBotEnabled || !this.state || this.state.phase === "GAME_OVER") return;
        // V online místnosti tahá za boty pouze neuzamčený stůl (-1) nebo hostitel (hráč č. 0), aby dva prohlížeče netahaly za bota současně
        if (this.state.roomCode && this.myOnlinePlayerIndex > 0) return;

        var currentP = this.state.players[this.state.currentPlayerIndex];
        if (currentP && currentP.type !== "Human") {
            var delay = self.isMoveAnimating ? 220 : 130;
            this.autoBotTimer = setTimeout(function () {
                self.stepBotNow();
            }, delay);
        }
    },

    // --- UKLÁDÁNÍ A NAČÍTÁNÍ HRY DO DATABÁZE ([prs].[prs_GameSessions]) S OPTIMISTICKÝM ZÁMKEM ---
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
                return r.json().then(function (res) {
                    if (res && res.ok) {
                        self.state.sessionGuid = res.sessionGuid;
                        self.state.roomCode = res.roomCode;
                        self.lastKnownTurnNumber = self.state.turnNumber;
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
            .catch(function () {
                localStorage.setItem("prs_saved_game", JSON.stringify(self.state));
                if (statusEl) statusEl.textContent = "💾 Uloženo do lokální paměti prohlížeče.";
            });
    },

    saveSessionAuto: function () {
        var self = this;
        if (!this.state || !this.state.sessionGuid) return;

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

        fetch("api.ashx?action=save-session", {
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
    },

    // --- PRAVIDLA, ENCYKLOPEDIE, BESTIÁŘ, HRADY A TROFEJE ---
    switchRulesSubtab: function (subtabId) {
        this.rulesSubtab = subtabId;
        var subtabs = ["rules", "dragons", "castles", "trophies"];
        for (var i = 0; i < subtabs.length; i++) {
            var s = subtabs[i];
            var el = document.getElementById("rules-subtab-" + s);
            var btn = document.getElementById("rules-subtab-btn-" + s);
            if (el) el.style.display = (s === subtabId) ? "block" : "none";
            if (btn) {
                if (s === subtabId) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }
        if (subtabId === "dragons") this.renderBestiary();
        else if (subtabId === "castles") this.renderCastlesGallery();
        else if (subtabId === "trophies") this.renderTrophiesHall();
    },

    renderRulesAndCatalog: function () {
        // 1. Základní katalog výbavy (pouze běžné předměty, trofeje mají vlastní Síň)
        var itemsBox = document.getElementById("catalog-items-table");
        if (itemsBox) {
            var rows = "";
            var basicItems = (window.PRS_ITEMS || []).filter(function (it) { return it.slot !== "trophy"; });
            for (var i = 0; i < basicItems.length; i++) {
                var it = basicItems[i];
                rows += "<tr>" +
                    "<td><span class='tier-badge tier-" + it.tier + "'>Věci " + it.tier + "</span></td>" +
                    "<td>" + it.icon + " <strong>" + this.escapeHtml(it.name) + "</strong></td>" +
                    "<td>" + (it.boj ? (it.boj > 0 ? "+" + it.boj : it.boj) : "—") + "</td>" +
                    "<td>" + (it.jizda ? (it.jizda > 0 ? "+" + it.jizda : it.jizda) : "—") + "</td>" +
                    "<td>" + (it.tanec ? (it.tanec > 0 ? "+" + it.tanec : it.tanec) : "—") + "</td>" +
                    "<td>" + (it.charisma ? (it.charisma > 0 ? "+" + it.charisma : it.charisma) : "—") + "</td>" +
                    "<td><strong>" + it.price.toLocaleString("cs-CZ") + " zl.</strong></td>" +
                    "</tr>";
            }
            itemsBox.innerHTML = rows;
        }

        // 2. Bestiář, hrady a trofeje
        this.renderBestiary();
        this.renderCastlesGallery();
        this.renderTrophiesHall();
    },

    // --- DRAČÍ BESTIÁŘ (20 DRAKŮ) ---
    setBestiaryTier: function (tier) {
        this.bestiaryActiveTier = tier;
        var btns = document.querySelectorAll(".bestiary-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-tier") === tier) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderBestiary();
    },

    renderBestiary: function () {
        var container = document.getElementById("bestiary-grid-container");
        if (!container || !window.PRS_QUESTS || !window.PRS_QUESTS.U3) return;

        var dragons = window.PRS_QUESTS.U3;
        var tierFilter = this.bestiaryActiveTier || "all";
        var filtered = dragons.filter(function (d) {
            if (tierFilter === "all") return true;
            return d.tierGroup === tierFilter;
        });

        var wMap = {
            dogs: "Lovečtí psi snadno odlákají jeho pozornost",
            falcon: "Sokol útočí na zranitelná místa",
            animals: "Pes i sokol matou draka v boji",
            horse: "Útok z plné jízdy na koni dává převahu",
            dance: "Hravého draka lze okouzlit tancem a charismatem",
            elixir: "Lektvar z Lazaretu ti pomůže přežít",
            water_armor: "Vodní/chladivá zbroj tlumí žár",
            ice: "Mrazivé zbraně oslabují sopečného draka",
            fire: "Oheň taví led a krystaly",
            armor: "Pevná zbroj svádí blesky",
            light: "Posvěcené zbraně rozhánějí temnotu",
            charisma: "Vysoké Charisma umožňuje draka uchlácholit",
            holy: "Čisté rytířské srdce zažene nemrtvého",
            courage: "Pevná vůle pronikne mlhou stínů",
            mastery: "Zkouška všech 4 rytířských ctností",
            animals_and_spear: "Koordinace koně, psa a kopí"
        };

        var html = [];
        for (var i = 0; i < filtered.length; i++) {
            var d = filtered[i];
            var tierTitle = (d.tierGroup === "young") ? "Tier A (Mladý drak)" :
                            (d.tierGroup === "elemental" ? "Tier B (Živlový drak)" : "Tier C (Legendární Boss)");
            var tierColor = (d.tierGroup === "young") ? "#60a5fa" :
                            (d.tierGroup === "elemental" ? "#a855f7" : "#f59e0b");
            var trophyDef = d.trophyId && window.PRS_TROPHIES ? window.PRS_TROPHIES[d.trophyId] : null;

            html.push('<div class="bestiary-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + d.img + '\', \'' + this.escapeHtml(d.name) + '\', \'' + this.escapeHtml(d.desc) + '\')" title="Klikni pro zvětšení ilustrace">');
            html.push('    <img src="' + d.img + '" alt="' + this.escapeHtml(d.name) + '" class="card-media-img" loading="lazy" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + tierColor + '; color:' + tierColor + ';">' + tierTitle + '</span>');
            html.push('    <span class="card-media-badge-right">⚔️ Obtížnost ' + d.difficulty + '</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + d.icon + ' ' + this.escapeHtml(d.name) + '</div>');
            html.push('    <div style="font-size:0.84rem; color:var(--gold-light); margin-bottom:0.4rem; font-weight:bold;">');
            html.push('      💰 Odměna: +' + d.gold.toLocaleString("cs-CZ") + ' zl. &nbsp;|&nbsp; 💖 +' + d.hearts + ' Srdcí');
            html.push('    </div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(d.desc) + '</div>');

            if (d.weakness && wMap[d.weakness]) {
                html.push('    <div class="card-callout-box" style="border-color:rgba(253,224,71,0.25); color:#fef08a;">');
                html.push('      💡 <strong>Taktika / Slabina:</strong> ' + wMap[d.weakness]);
                html.push('    </div>');
            }

            if (trophyDef) {
                var statsBonus = [];
                if (trophyDef.boj) statsBonus.push("⚔️+" + trophyDef.boj);
                if (trophyDef.jizda) statsBonus.push("🏇+" + trophyDef.jizda);
                if (trophyDef.tanec) statsBonus.push("💃+" + trophyDef.tanec);
                if (trophyDef.charisma) statsBonus.push("✨+" + trophyDef.charisma);
                html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.4); color:var(--gold-light); margin-top:4px;">');
                html.push('      🏆 <strong>Trofej po porážce:</strong> ' + trophyDef.icon + ' ' + this.escapeHtml(trophyDef.name) + ' (' + statsBonus.join(" ") + ')');
                html.push('    </div>');
            }

            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- GALERIE HRADŮ (10 TEMATICKÝCH ZÁMKŮ) ---
    renderCastlesGallery: function () {
        var container = document.getElementById("castles-grid-container");
        if (!container || !window.PRS_CASTLES) return;

        var castles = window.PRS_CASTLES;
        var elemColors = {
            light: "#fbbf24",
            fire: "#f87171",
            water: "#38bdf8",
            earth: "#4ade80",
            air: "#cbd5e1",
            ice: "#93c5fd",
            crystal: "#c084fc",
            dark: "#a855f7"
        };

        var html = [];
        for (var k in castles) {
            if (!castles.hasOwnProperty(k)) continue;
            var c = castles[k];
            var col = elemColors[c.element] || "var(--gold-light)";

            html.push('<div class="castle-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + c.img + '\', \'' + this.escapeHtml(c.name) + '\', \'' + this.escapeHtml(c.desc) + '\')" title="Klikni pro zvětšení ilustrace">');
            html.push('    <img src="' + c.img + '" alt="' + this.escapeHtml(c.name) + '" class="card-media-img" loading="lazy" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + col + '; color:' + col + ';">Živel: ' + (c.element ? c.element.toUpperCase() : 'KRÁLOVSKÝ') + '</span>');
            html.push('    <span class="card-media-badge-right" style="border-color:var(--gold); color:var(--gold-light);">Cena: 8 000 zl.</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + c.icon + ' ' + this.escapeHtml(c.name) + '</div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(c.desc) + '</div>');
            html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.3); color:#fef08a;">');
            html.push('      🏰 <strong>Výhoda panství:</strong> Výnos daní +2 500 zl., nájem 1 500 zl., trvale +1 Charisma a audience u princezny.');
            html.push('    </div>');
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- SÍŇ TROFEJÍ A RELIKVIÍ (29 TROFEJÍ) ---
    setTrophiesCategory: function (cat) {
        this.trophiesActiveCategory = cat;
        var btns = document.querySelectorAll(".trophy-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-cat") === cat) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderTrophiesHall();
    },

    renderTrophiesHall: function () {
        var container = document.getElementById("trophies-grid-container");
        if (!container || !window.PRS_TROPHIES) return;

        var trophies = window.PRS_TROPHIES;
        var filter = this.trophiesActiveCategory || "all";

        var list = [];
        for (var k in trophies) {
            if (!trophies.hasOwnProperty(k)) continue;
            var t = trophies[k];
            if (filter === "beasts" && t.source.indexOf("U1") === -1) continue;
            if (filter === "monsters" && t.source.indexOf("U2") === -1 && t.source.indexOf("Náhoda") === -1) continue;
            if (filter === "dragons" && t.source.indexOf("U3") === -1) continue;
            list.push(t);
        }

        var html = [];
        for (var i = 0; i < list.length; i++) {
            var tr = list[i];
            var tierClass = "tier-" + (tr.tier || 1);
            var statChips = [];
            if (tr.boj) statChips.push('<span class="armory-stat-chip ' + (tr.boj > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (tr.boj > 0 ? '+' : '') + tr.boj + ' Boj</span>');
            if (tr.jizda) statChips.push('<span class="armory-stat-chip ' + (tr.jizda > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (tr.jizda > 0 ? '+' : '') + tr.jizda + ' Jízda</span>');
            if (tr.tanec) statChips.push('<span class="armory-stat-chip ' + (tr.tanec > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (tr.tanec > 0 ? '+' : '') + tr.tanec + ' Tanec</span>');
            if (tr.charisma) statChips.push('<span class="armory-stat-chip ' + (tr.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">✨ ' + (tr.charisma > 0 ? '+' : '') + tr.charisma + ' Charisma</span>');

            html.push('<div class="trophy-item-card ' + tierClass + '">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
            html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light); font-size:0.75rem;">' + (tr.tier || 1) + '. stupeň</span>');
            html.push('    <span style="font-size:0.75rem; color:#9ca3af; font-style:italic;">' + this.escapeHtml(tr.source || 'Boj') + '</span>');
            html.push('  </div>');

            html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + tr.icon + ' ' + this.escapeHtml(tr.name) + '</div>');
            html.push('  <div style="font-size:0.8rem; color:#d1d5db; line-height:1.35; margin-bottom:0.6rem; flex:1;">' + this.escapeHtml(tr.desc) + '</div>');

            html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.6rem;">' + statChips.join("") + '</div>');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.4rem; font-size:0.82rem;">');
            html.push('    <span style="color:var(--text-muted);">Slot: <strong>🏆 Trofej</strong></span>');
            html.push('    <span style="color:var(--gold-light); font-weight:bold;">' + tr.price.toLocaleString("cs-CZ") + ' zl.</span>');
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- UNIVERZÁLNÍ LIGHTBOX PRO OBRÁZKY (DRAKY, ZÁMKY, NÁKRESY) ---
    openImageModal: function (imgSrc, title, desc) {
        var m = document.getElementById("image-lightbox-modal");
        var img = document.getElementById("image-lightbox-img");
        var tEl = document.getElementById("image-lightbox-title");
        var cEl = document.getElementById("image-lightbox-caption");
        if (m && img) {
            img.src = imgSrc || "";
            if (tEl) tEl.textContent = title || "Královská ilustrace";
            if (cEl) cEl.textContent = desc || "";
            m.style.display = "flex";
        }
    },

    closeImageModal: function () {
        var m = document.getElementById("image-lightbox-modal");
        if (m) m.style.display = "none";
    },

    openSketchModal: function (imgSrc, caption) {
        this.openImageModal(imgSrc, "Archivní ruční nákres z roku 2016", caption);
    },

    closeSketchModal: function () {
        this.closeImageModal();
    },

    // --- BALANCOVACÍ STUDIO & SIMULÁTOR EKONOMIKY ---
    renderBalanceStudioInputs: function () {
        var c = this.activeConfig;
        this.setInputValue("cfg-targetHearts", c.targetHearts);
        this.setInputValue("cfg-startGold", c.startGold);
        this.setInputValue("cfg-passStartGold", c.passStartGold);
        this.setInputValue("cfg-sokol", c.animalBasePrices.sokol);
        this.setInputValue("cfg-pes", c.animalBasePrices.pes);
        this.setInputValue("cfg-kun", c.animalBasePrices.kun);
        this.setInputValue("cfg-villagePrice", c.estates.villagePrices[0]);
        this.setInputValue("cfg-townPrice", c.estates.townPrice);
        this.setInputValue("cfg-castlePrice", c.estates.castlePrice);
        this.setInputValue("cfg-pack1", c.itemPackPrices.tier1);
        this.setInputValue("cfg-pack2", c.itemPackPrices.tier2);
        this.setInputValue("cfg-pack3", c.itemPackPrices.tier3);
        this.setInputValue("cfg-u1Diff", c.quests ? (c.quests.u1BaseDiff || 5) : 5);
        this.setInputValue("cfg-u2Diff", c.quests ? (c.quests.u2BaseDiff || 9) : 9);
        this.setInputValue("cfg-u3Diff", c.quests ? (c.quests.u3BaseDiff || 13) : 13);
    },

    setInputValue: function (id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    },

    readBalanceStudioInputs: function () {
        var c = window.PRS_GameEngine.deepClone(this.activeConfig);
        c.targetHearts = Number(document.getElementById("cfg-targetHearts").value) || 30;
        c.startGold = Number(document.getElementById("cfg-startGold").value) || 10000;
        c.passStartGold = Number(document.getElementById("cfg-passStartGold").value) || 3000;
        c.animalBasePrices.sokol = Number(document.getElementById("cfg-sokol").value) || 400;
        c.animalBasePrices.pes = Number(document.getElementById("cfg-pes").value) || 500;
        c.animalBasePrices.kun = Number(document.getElementById("cfg-kun").value) || 600;
        c.estates.villagePrices[0] = Number(document.getElementById("cfg-villagePrice").value) || 2000;
        c.estates.townPrice = Number(document.getElementById("cfg-townPrice").value) || 4500;
        c.estates.castlePrice = Number(document.getElementById("cfg-castlePrice").value) || 8000;
        c.itemPackPrices.tier1 = Number(document.getElementById("cfg-pack1").value) || 2500;
        c.itemPackPrices.tier2 = Number(document.getElementById("cfg-pack2").value) || 7000;
        c.itemPackPrices.tier3 = Number(document.getElementById("cfg-pack3").value) || 12000;
        if (!c.quests) c.quests = {};
        c.quests.u1BaseDiff = Number(document.getElementById("cfg-u1Diff").value) || 5;
        c.quests.u2BaseDiff = Number(document.getElementById("cfg-u2Diff").value) || 9;
        c.quests.u3BaseDiff = Number(document.getElementById("cfg-u3Diff").value) || 13;
        this.activeConfig = c;
        return c;
    },

    runEconomySimulation: function (numGames) {
        var cfg = this.readBalanceStudioInputs();
        var simBoardSel = document.getElementById("sim-board-select");
        var bCode = simBoardSel ? simBoardSel.value : "classic_96";

        var result = window.PRS_GameEngine.simulateGames(numGames || 30, cfg, bCode);
        var outBox = document.getElementById("sim-results-box");
        if (!outBox) return;

        var hb = result.avgWinnerHeartsBreakdown;
        outBox.innerHTML =
            '<div class="sim-metrics-grid">' +
            '  <div class="sim-metric-card">' +
            '    <span>⏱️ Odhad stolní herní doby (4 hráči)</span>' +
            '    <strong>' + result.estTabletopHoursText + '</strong>' +
            '    <small>(' + result.estTabletopMinutes + ' minut u stolu s kostkami)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🔄 Průměrný počet kol do ' + result.targetHearts + ' 💖</span>' +
            '    <strong>' + result.avgRounds + ' kol</strong>' +
            '    <small>(celkem ' + result.avgTurns + ' jednotlivých tahů)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>💰 Průměrná hotovost vítěze</span>' +
            '    <strong>' + result.avgWinnerGold.toLocaleString("cs-CZ") + ' zl.</strong>' +
            '    <small>Testováno na ' + result.gamesSimulated + ' partiích</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>💖 Odkud plynou vítězná Srdce</span>' +
            '    <strong>Slavnosti: ' + hb.festivals + ' | Úkoly: ' + hb.quests + '</strong>' +
            '    <small>Chov zvířat: ' + hb.breeding + ' 💖 | Náhoda: ' + hb.chance + ' 💖</small>' +
            '  </div>' +
            '</div>';

        fetch("api.ashx?action=log-telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventType: "SimulationRun",
                turnNumber: Math.round(result.avgRounds),
                message: "Simulace " + result.gamesSimulated + " her (" + result.estTabletopHoursText + ")",
                payloadJson: JSON.stringify(result)
            })
        }).catch(function () { });
    },

    saveConfigToServer: function () {
        var cfg = this.readBalanceStudioInputs();
        var msgEl = document.getElementById("save-config-feedback");
        if (msgEl) msgEl.textContent = "Ukládám konfiguraci do databáze [prs].[prs_GameConfigs]...";

        fetch("api.ashx?action=save-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                versionName: "v1.1-upraveny-balanc",
                targetHearts: cfg.targetHearts,
                startGold: cfg.startGold,
                passStartGold: cfg.passStartGold,
                configJson: JSON.stringify(cfg),
                notes: "Uloženo z Balancovacího studia"
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (msgEl) {
                    msgEl.textContent = (res && res.ok)
                        ? "✅ Konfigurace úspěšně uložena do databáze a aktivována pro nové hry!"
                        : "✅ Konfigurace aktivována pro tuto relaci.";
                }
            })
            .catch(function () {
                if (msgEl) msgEl.textContent = "✅ Konfigurace aktivována lokálně.";
            });
    },

    escapeHtml: function (str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
};

window.addEventListener("DOMContentLoaded", function () {
    window.PRS_App.init();
});
