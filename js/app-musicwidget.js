// ============================================================================
// KiDesky: Plovoucí hudební ovladač (mini přehrávač přímo na herní ploše)
// - kulatá ikonka 🎵 v rohu, po kliknutí se rozbalí kompaktní panel
// - ▶/⏸, předchozí/další skladba, hlasitost hudby a efektů, rychlé ztlumení všeho
// ============================================================================
(function () {
    "use strict";

    var W = window.PRS_MusicWidget = {
        open: false,
        el: null,
        timer: null,

        init: function () {
            if (this.el || !document.body) return;
            this._injectStyles();
            var root = document.createElement("div");
            root.id = "prs-mw";
            root.innerHTML =
                '<div id="prs-mw-panel" class="prs-mw-panel" style="display:none;">' +
                '  <div class="prs-mw-head">' +
                '    <div class="prs-mw-disc" id="prs-mw-disc">💿</div>' +
                '    <div class="prs-mw-info">' +
                '      <div class="prs-mw-title" id="prs-mw-title">Hudba</div>' +
                '      <div class="prs-mw-author" id="prs-mw-author"></div>' +
                '    </div>' +
                '    <button class="prs-mw-x" onclick="PRS_MusicWidget.toggle(false)" title="Sbalit">✕</button>' +
                '  </div>' +
                '  <div class="prs-mw-ctrl">' +
                '    <button class="prs-mw-btn" onclick="PRS_MusicWidget.prev()" title="Předchozí skladba">⏮</button>' +
                '    <button class="prs-mw-btn prs-mw-play" id="prs-mw-play" onclick="PRS_MusicWidget.playPause()" title="Přehrát / pozastavit hudbu">▶</button>' +
                '    <button class="prs-mw-btn" onclick="PRS_MusicWidget.next()" title="Další skladba">⏭</button>' +
                '    <button class="prs-mw-btn prs-mw-mute" id="prs-mw-mute" onclick="PRS_MusicWidget.toggleMute()" title="Zapnout / vypnout veškerý zvuk">🔊</button>' +
                '  </div>' +
                '  <label class="prs-mw-row"><span>🎵 Hudba</span>' +
                '    <input type="range" min="0" max="100" id="prs-mw-bgm" oninput="PRS_MusicWidget.setBgm(this.value)"><b id="prs-mw-bgm-l">35%</b></label>' +
                '  <label class="prs-mw-row"><span>🎲 Efekty</span>' +
                '    <input type="range" min="0" max="100" id="prs-mw-sfx" oninput="PRS_MusicWidget.setSfx(this.value)"><b id="prs-mw-sfx-l">70%</b></label>' +
                '  <button class="prs-mw-more" onclick="PRS_MusicWidget.toggle(false); PRS_App.openMusicPopup();">📜 Celý seznam skladeb…</button>' +
                '</div>' +
                '<button id="prs-mw-fab" class="prs-mw-fab" onclick="PRS_MusicWidget.toggle()" title="Hudba a zvuky">' +
                '  <span id="prs-mw-fab-icon">🎵</span>' +
                '</button>';
            document.body.appendChild(root);
            this.el = root;

            var self = this;
            document.addEventListener("click", function (ev) {
                if (self.open && self.el && !self.el.contains(ev.target)) self.toggle(false);
            });

            // synchronizace s existujícím UI přehrávače
            if (window.PRS_App && window.PRS_App.updateMusicUI && !window.PRS_App._mwWrapped) {
                var orig = window.PRS_App.updateMusicUI;
                window.PRS_App.updateMusicUI = function () {
                    var r = orig.apply(this, arguments);
                    try { W.refresh(); } catch (e) { }
                    return r;
                };
                window.PRS_App._mwWrapped = true;
            }
            this.refresh();
            this.timer = setInterval(function () { if (self.open) self.refresh(); }, 1000);
        },

        toggle: function (force) {
            this.open = (typeof force === "boolean") ? force : !this.open;
            var p = document.getElementById("prs-mw-panel");
            if (p) p.style.display = this.open ? "block" : "none";
            if (this.open) this.refresh();
        },

        _A: function () { return window.PRS_Audio; },

        playPause: function () {
            var A = this._A(); if (!A) return;
            if (A.muted) { A.toggleMute(); }
            A.toggleMusic();
            this._syncApp();
        },
        next: function () { var A = this._A(); if (!A) return; if (!A.isMusicPlaying && A.muted) A.toggleMute(); A.nextTrack(); this._syncApp(); },
        prev: function () { var A = this._A(); if (!A) return; if (!A.isMusicPlaying && A.muted) A.toggleMute(); A.prevTrack(); this._syncApp(); },

        toggleMute: function () {
            var A = this._A(); if (!A) return;
            A.toggleMute();
            if (window.PRS_App && window.PRS_App.updateAudioButtonUI) window.PRS_App.updateAudioButtonUI();
            this.refresh();
        },

        setBgm: function (v) {
            var A = this._A(); if (!A) return;
            A.setBgmVolume(Number(v) / 100);
            var l = document.getElementById("prs-mw-bgm-l"); if (l) l.textContent = v + "%";
        },
        setSfx: function (v) {
            var A = this._A(); if (!A) return;
            A.setSfxVolume(Number(v) / 100);
            var l = document.getElementById("prs-mw-sfx-l"); if (l) l.textContent = v + "%";
        },

        _syncApp: function () {
            if (window.PRS_App) {
                if (window.PRS_App.renderMusicPlaylistOptions) window.PRS_App.renderMusicPlaylistOptions();
            }
            this.refresh();
        },

        refresh: function () {
            var A = this._A(); if (!A || !this.el) return;
            var tr = A.getCurrentTrack() || {};
            var playing = !!A.isMusicPlaying && !A.muted;
            var set = function (id, fn) { var e = document.getElementById(id); if (e) fn(e); };
            set("prs-mw-title", function (e) { e.textContent = tr.title || "Hudba"; });
            set("prs-mw-author", function (e) { e.textContent = tr.author || ""; });
            set("prs-mw-play", function (e) { e.textContent = A.isMusicPlaying ? "⏸" : "▶"; });
            set("prs-mw-mute", function (e) { e.textContent = A.muted ? "🔇" : "🔊"; e.classList.toggle("off", !!A.muted); });
            set("prs-mw-disc", function (e) { e.classList.toggle("playing", playing); });
            set("prs-mw-fab", function (e) { e.classList.toggle("playing", playing); e.classList.toggle("muted", !!A.muted); });
            set("prs-mw-fab-icon", function (e) { e.textContent = A.muted ? "🔇" : (A.isMusicPlaying ? "🎶" : "🎵"); });
            var bv = Math.round(A.bgmVolume * 100), sv = Math.round(A.sfxVolume * 100);
            set("prs-mw-bgm", function (e) { if (document.activeElement !== e) e.value = bv; });
            set("prs-mw-sfx", function (e) { if (document.activeElement !== e) e.value = sv; });
            set("prs-mw-bgm-l", function (e) { e.textContent = bv + "%"; });
            set("prs-mw-sfx-l", function (e) { e.textContent = sv + "%"; });
        },

        _injectStyles: function () {
            var css =
                "#prs-mw{position:fixed;left:14px;bottom:14px;z-index:1500;font-family:'Outfit',sans-serif;}" +
                "body[data-device='mobile'] #prs-mw{bottom:150px;left:10px;}" +
                ".prs-mw-fab{width:46px;height:46px;border-radius:50%;border:2px solid var(--gold,#d4af37);background:radial-gradient(circle at 30% 30%,#3a2a14,#150d07);color:#fde68a;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;transition:transform .15s;}" +
                ".prs-mw-fab:hover{transform:scale(1.08);}" +
                ".prs-mw-fab.playing{animation:prsMwPulse 2s infinite;}" +
                ".prs-mw-fab.muted{border-color:#64748b;color:#94a3b8;}" +
                "@keyframes prsMwPulse{0%,100%{box-shadow:0 4px 14px rgba(0,0,0,.6),0 0 0 0 rgba(212,175,55,.5);}50%{box-shadow:0 4px 14px rgba(0,0,0,.6),0 0 0 9px rgba(212,175,55,0);}}" +
                ".prs-mw-panel{position:absolute;left:0;bottom:56px;width:290px;background:linear-gradient(135deg,#1c150f,#110c08);border:2px solid var(--gold,#d4af37);border-radius:14px;padding:.75rem;box-shadow:0 14px 34px rgba(0,0,0,.85);color:#f1f5f9;}" +
                ".prs-mw-head{display:flex;align-items:center;gap:.6rem;margin-bottom:.6rem;}" +
                ".prs-mw-disc{font-size:1.6rem;}" +
                ".prs-mw-disc.playing{animation:prsMwSpin 3s linear infinite;}" +
                "@keyframes prsMwSpin{to{transform:rotate(360deg);}}" +
                ".prs-mw-info{flex:1;min-width:0;}" +
                ".prs-mw-title{font-weight:700;font-size:.88rem;color:var(--gold-light,#fde68a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
                ".prs-mw-author{font-size:.72rem;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
                ".prs-mw-x{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1rem;}" +
                ".prs-mw-ctrl{display:flex;gap:.4rem;justify-content:center;margin-bottom:.6rem;}" +
                ".prs-mw-btn{flex:1;height:38px;border-radius:9px;border:1px solid rgba(212,175,55,.45);background:rgba(255,255,255,.07);color:#fde68a;font-size:1.05rem;cursor:pointer;}" +
                ".prs-mw-btn:hover{background:rgba(212,175,55,.2);}" +
                ".prs-mw-play{flex:1.6;background:linear-gradient(135deg,#b45309,#d97706);color:#fff;border-color:#fbbf24;}" +
                ".prs-mw-mute.off{background:rgba(239,68,68,.25);border-color:#ef4444;}" +
                ".prs-mw-row{display:flex;align-items:center;gap:.5rem;font-size:.78rem;margin-bottom:.4rem;}" +
                ".prs-mw-row span{width:62px;color:#cbd5e1;}" +
                ".prs-mw-row input{flex:1;min-width:0;}" +
                ".prs-mw-row b{width:34px;text-align:right;color:var(--gold-light,#fde68a);font-weight:600;}" +
                ".prs-mw-more{width:100%;margin-top:.2rem;padding:.35rem;border-radius:8px;border:1px dashed rgba(212,175,55,.5);background:none;color:#fde68a;font-size:.76rem;cursor:pointer;}";
            var st = document.createElement("style");
            st.textContent = css;
            document.head.appendChild(st);
        }
    };

    var boot = function () {
        var tries = 0;
        var t = setInterval(function () {
            tries++;
            if (window.PRS_App && window.PRS_Audio) { clearInterval(t); W.init(); }
            else if (tries > 50) clearInterval(t);
        }, 200);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
