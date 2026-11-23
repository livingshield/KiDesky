// ============================================================================
// KiDesky: Princeznino srdce - Hudební popup, ovládání BGM/SFX a nahrávání vlastních skladeb
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
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

        if (window.PRS_I18n && window.PRS_I18n.translateDOM) {
            window.PRS_I18n.translateDOM(modal);
        }

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

            headBtnLabel.textContent = isPlaying
                ? (window.PRS_I18n ? window.PRS_I18n.t("music.label_playing", { title: tr.title }, "Hudba: " + tr.title) : ("Hudba: " + tr.title))
                : (window.PRS_I18n ? window.PRS_I18n.t("music.label_off", null, "Hudba: Vyp") : "Hudba: Vyp");

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

            modPlayBtn.innerHTML = isPlaying
                ? (window.PRS_I18n ? window.PRS_I18n.t("music.pause_btn", null, "⏸️ Pozastavit") : "⏸️ Pozastavit")
                : (window.PRS_I18n ? window.PRS_I18n.t("music.play_btn", null, "▶️ Přehrát") : "▶️ Přehrát");

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

        if (window.PRS_MusicWidget && typeof window.PRS_MusicWidget.refresh === "function") {
            try { window.PRS_MusicWidget.refresh(); } catch (mwErr) { console.warn("[KiDesky] MusicWidget refresh err:", mwErr); }
        }

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

    }
    });
})();
