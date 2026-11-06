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
        this.loadServerTracks();
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
            this.bgmAudio.loop = false;
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
        this._applyYoutubeVolume();
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
            this._stopYoutube();
            if (this.bgmAudio) this.bgmAudio.pause();
            this.isMusicPlaying = true;
            this.startProceduralLute();
        } else if (tr.isYoutube) {
            if (this.bgmAudio) this.bgmAudio.pause();
            this.isMusicPlaying = true;
            this._playYoutubeTrack(tr);
        } else if (tr.src && this.bgmAudio) {
            this._stopYoutube();
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
        this._stopYoutube();
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
        this._applyYoutubeVolume();
    },

    // --- SERVEROVÉ SKLADBY (spravované v administraci) + YOUTUBE ---
    loadServerTracks: function (done) {
        var self = this;
        if (typeof fetch === "undefined") return;
        fetch("api.ashx?action=list-audio")
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (!res || !res.ok || !res.tracks) return;
                var current = self.getCurrentTrack();
                var curId = current ? current.id : null;
                self.playlist = self.playlist.filter(function (t) { return !t.isServer; });
                var server = [];
                for (var i = 0; i < res.tracks.length; i++) {
                    var t = res.tracks[i];
                    var yt = (t.audioType === "youtube") ? self._extractYoutubeId(t.url) : null;
                    if (t.audioType === "youtube" && !yt) continue;
                    server.push({
                        id: "srv_" + t.id,
                        title: t.title,
                        author: t.author || "Královská kapela",
                        src: yt ? null : t.url,
                        isYoutube: !!yt,
                        youtubeId: yt,
                        isServer: true
                    });
                }
                var procIdx = -1;
                for (var p = 0; p < self.playlist.length; p++) { if (self.playlist[p].isProcedural) procIdx = p; }
                var head = procIdx >= 0 ? self.playlist.slice(0, procIdx) : self.playlist.slice();
                var tail = procIdx >= 0 ? self.playlist.slice(procIdx) : [];
                self.playlist = head.concat(server, tail);
                if (curId) {
                    for (var k = 0; k < self.playlist.length; k++) {
                        if (self.playlist[k].id === curId) { self.currentTrackIndex = k; break; }
                    }
                }
                if (!self.isMusicPlaying && server.length > 0) {
                    for (var f = 0; f < self.playlist.length; f++) {
                        if (self.playlist[f].isServer) { self.currentTrackIndex = f; break; }
                    }
                }
                if (window.PRS_App && window.PRS_App.renderMusicPlaylistOptions) window.PRS_App.renderMusicPlaylistOptions();
                if (done) done();
            })
            .catch(function (e) { console.warn("Načtení serverových skladeb selhalo", e); });
    },

    _extractYoutubeId: function (url) {
        var m = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
        return m ? m[1] : null;
    },

    _ytReady: false,
    _ytPlayer: null,
    _ytPending: null,

    _ensureYoutubeApi: function () {
        var self = this;
        if (this._ytPlayer || this._ytApiLoading) return;
        this._ytApiLoading = true;
        var holder = document.getElementById("prs-yt-holder");
        if (!holder) {
            holder = document.createElement("div");
            holder.id = "prs-yt-holder";
            holder.style.cssText = "position:fixed; width:1px; height:1px; left:-9999px; top:0; overflow:hidden; opacity:0; pointer-events:none;";
            holder.innerHTML = '<div id="prs-yt-player"></div>';
            document.body.appendChild(holder);
        }
        var create = function () {
            self._ytPlayer = new YT.Player("prs-yt-player", {
                height: "1", width: "1",
                playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
                events: {
                    onReady: function () {
                        self._ytReady = true;
                        self._applyYoutubeVolume();
                        if (self._ytPending) { var id = self._ytPending; self._ytPending = null; self._ytPlayer.loadVideoById(id); }
                    },
                    onStateChange: function (ev) {
                        if (ev.data === 0 && self.isMusicPlaying && self.getCurrentTrack().isYoutube) self.nextTrack();
                    },
                    onError: function () {
                        if (self.isMusicPlaying && self.getCurrentTrack().isYoutube) self.nextTrack();
                    }
                }
            });
        };
        if (window.YT && window.YT.Player) {
            create();
        } else {
            var prev = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = function () { if (prev) prev(); create(); };
            var s = document.createElement("script");
            s.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(s);
        }
    },

    _playYoutubeTrack: function (tr) {
        this._ensureYoutubeApi();
        if (this._ytReady && this._ytPlayer) {
            this._ytPlayer.loadVideoById(tr.youtubeId);
            this._applyYoutubeVolume();
        } else {
            this._ytPending = tr.youtubeId;
        }
    },

    _stopYoutube: function () {
        this._ytPending = null;
        if (this._ytReady && this._ytPlayer && this._ytPlayer.pauseVideo) {
            try { this._ytPlayer.pauseVideo(); } catch (e) { }
        }
    },

    _applyYoutubeVolume: function () {
        if (this._ytReady && this._ytPlayer && this._ytPlayer.setVolume) {
            try { this._ytPlayer.setVolume(this.muted ? 0 : Math.round(this.bgmVolume * 100)); } catch (e) { }
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
    },

    playWater: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        this._playChime(now, 587.3, 0.18, 0.12 * this.sfxVolume);
        this._playChime(now + 0.05, 880.0, 0.22, 0.10 * this.sfxVolume);
        this._playChime(now + 0.11, 739.9, 0.25, 0.09 * this.sfxVolume);
    },

    // --- BIOME AMBIENCE & PROCEDURAL ENVIRONMENT AUDIO ---
    currentBiome: "plains",
    isBiomeAmbientEnabled: true,

    setBiome: function (biome) {
        if (!biome) biome = "plains";
        if (this.currentBiome === biome) return;
        this.currentBiome = biome;
    },

    playBiomeStep: function (biome) {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        var b = biome || this.currentBiome || "plains";

        if (b === "forest") {
            // Šelest větvičky a měkký mechový krok
            this._playWoodTap(now, 260, 0.04);
            this._playChime(now + 0.015, 1850, 0.06, 0.04 * this.sfxVolume);
        } else if (b === "mountain") {
            // Křupnutí horského štěrku a ozvěna skály
            this._playWoodTap(now, 540, 0.025);
            this._playWoodTap(now + 0.02, 680, 0.02);
            this._playChime(now + 0.03, 920, 0.08, 0.05 * this.sfxVolume);
        } else if (b === "water") {
            // Šplouchnutí břehu řeky
            this.playWater();
        } else if (b === "castle") {
            // Kamenná hradní dlažba
            this._playWoodTap(now, 420, 0.04);
            this._playChime(now + 0.02, 659.2, 0.15, 0.08 * this.sfxVolume);
        } else {
            // Běžná polní cesta / lučiny
            this.playStep();
        }
    },

    playBridgeCrossing: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        // Dvojí zaklapání podkov po dřevěných prknech mostu + vodní ozvěna
        this._playWoodTap(now, 320, 0.045);
        this._playWoodTap(now + 0.08, 290, 0.045);
        this._playWoodTap(now + 0.16, 330, 0.04);
        this._playChime(now + 0.04, 880, 0.14, 0.06 * this.sfxVolume);
        this._playChime(now + 0.12, 1174.6, 0.18, 0.07 * this.sfxVolume);
    },

    playCastleArrival: function () {
        if (this.muted) return;
        this.ensureContext();
        if (!this.ctx) return;
        var now = this.ctx.currentTime;
        // Vznešený dvorský fanfárový souzvuk (kvinta a oktáva)
        this._playChime(now, 440.0, 0.45, 0.20 * this.sfxVolume);
        this._playChime(now + 0.08, 659.25, 0.55, 0.22 * this.sfxVolume);
        this._playChime(now + 0.16, 880.0, 0.70, 0.25 * this.sfxVolume);
    }
};

// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Hlavní aplikační kontroler, SVG mapa, Zoom/Pan
// a správa bitmapových políček / prostředí
// ============================================================================
