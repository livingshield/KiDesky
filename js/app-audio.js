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
