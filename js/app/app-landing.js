// ============================================================================
// KiDesky: Princeznino srdce - Úvodní stránka, video galerie, královský posel a živé plátno
// ============================================================================

(function () {
    "use strict";
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
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
        PRS_Api.get("list-videos")
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
        PRS_Api.get("hero-video")
            .then(function (res) {
                if (res && res.ok && res.hero) {
                    self.heroVideosList = [res.hero];
                    self.currentHeroVideoIndex = 0;
                    self.currentHeroVideo = res.hero;
                    self.renderHeroVideoControls();
                    self.renderHeroVideosSection();
                }
            })
            .catch(function (err) { console.warn("[KiDesky] list-videos failed:", err); });
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
                if (v.posterUrl) vid.poster = (window.PRS_normalizeAssetUrl ? window.PRS_normalizeAssetUrl(v.posterUrl) : v.posterUrl);
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

        PRS_Api.post("like-video", null, { params: { id: v.id } })
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

        var tStory = function (key, fb) {
            return (window.PRS_I18n && typeof window.PRS_I18n.t === "function")
                ? window.PRS_I18n.t(key, null, fb)
                : fb;
        };

        var list = this.heroVideosList || [];
        var videos = [];
        if (list.length > 0) {
            videos = list.slice(0, 3);
        } else {
            // Výchozí trojice oficiálních příběhových videí
            videos = [
                {
                    id: 4,
                    title: tStory("story.video_ch1_title", "Sokolí poselství & Dračí souboj"),
                    url: "https://www.youtube.com/watch?v=sO-MnlHy_O4",
                    likesCount: 14,
                    description: tStory("story.video_ch1_desc", "")
                },
                {
                    id: 6,
                    title: tStory("story.video_ch2_title", "Čtyři šampioni nad herním plánem"),
                    url: "https://www.youtube.com/watch?v=TTXwxA90gPk",
                    likesCount: 9,
                    description: tStory("story.video_ch2_desc", "")
                },
                {
                    id: 7,
                    title: tStory("story.video_ch3_title", "Únos princezny & Návrat s fanfárami"),
                    url: "https://www.youtube.com/watch?v=BoDAksZugus",
                    likesCount: 7,
                    description: tStory("story.video_ch3_desc", "")
                }
            ];
        }

        var resolveChapter = function (v, idx) {
            var u = (v && v.url) ? String(v.url) : "";
            if (u.indexOf("sO-MnlHy_O4") !== -1) return 1;
            if (u.indexOf("TTXwxA90gPk") !== -1) return 2;
            if (u.indexOf("BoDAksZugus") !== -1 || u.indexOf("fPyG8yeCHas") !== -1) return 3;
            return (idx % 3) + 1;
        };

        var html = [];
        for (var i = 0; i < videos.length; i++) {
            var v = videos[i];
            var ch = resolveChapter(v, i);
            var isYt = this.isYoutubeVideo(v);
            var ytid = isYt ? this.getYoutubeId(v.url) : "";
            var embedUrl = "";
            if (isYt && ytid) {
                embedUrl = "https://www.youtube-nocookie.com/embed/" + ytid + "?rel=0&enablejsapi=1&playsinline=1";
            } else if (v.url) {
                embedUrl = v.url;
            }

            var isLiked = !!(this._likedVideoIds && this._likedVideoIds[v.id]);
            var badgeText = tStory("story.video_ch" + ch + "_badge", "🎬 Kapitola " + ch);

            var rawTitle = (v.title || "").trim();
            var isGenericTitle = !rawTitle ||
                /^královská upoutávka/i.test(rawTitle) ||
                /^princeznino srdce - intro/i.test(rawTitle) ||
                /^intro první princezna/i.test(rawTitle);
            var vTitle = isGenericTitle ? tStory("story.video_ch" + ch + "_title", rawTitle || ("Video " + (i + 1))) : rawTitle;

            var rawDesc = (v.description || "").trim();
            var isGenericDesc = !rawDesc ||
                /^oficiální videopředstavení/i.test(rawDesc) ||
                /^princeznino srdce - intro/i.test(rawDesc) ||
                /^oficiální příběhová upoutávka/i.test(rawDesc) ||
                /^ukázka deskového plánu/i.test(rawDesc);
            var vDesc = isGenericDesc ? tStory("story.video_ch" + ch + "_desc", rawDesc) : rawDesc;

            html.push('<div class="lp-video-cinema-card">');
            html.push('  <div class="lp-video-card-header">');
            html.push('    <h3 class="lp-video-card-title">' + this.escapeHtml(vTitle) + '</h3>');
            html.push('    <span class="lp-video-card-badge">' + this.escapeHtml(badgeText) + '</span>');
            html.push('  </div>');

            html.push('  <div class="lp-video-player-frame">');
            if (isYt && ytid) {
                html.push('    <iframe src="' + embedUrl + '" title="' + this.escapeHtml(vTitle) + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>');
            } else if (v.url && v.url.match(/\.(mp4|webm)($|\?)/i)) {
                html.push('    <video controls preload="metadata" style="width:100%; height:100%; object-fit:cover; border-radius:10px;"><source src="' + this.escapeHtml(v.url) + '" type="video/mp4"></video>');
            } else {
                html.push('    <iframe src="' + embedUrl + '" title="' + this.escapeHtml(vTitle) + '" frameborder="0" allowfullscreen loading="lazy"></iframe>');
            }
            html.push('  </div>');

            if (vDesc) {
                html.push('  <p class="lp-video-card-desc">' + this.escapeHtml(vDesc) + '</p>');
            }

            html.push('  <div class="lp-video-card-footer">');
            html.push('    <button type="button" class="lp-video-btn-action ' + (isLiked ? 'liked' : '') + '" onclick="PRS_App.likeVideoById(' + v.id + ', this)" title="' + this.escapeHtml(isLiked ? tStory("story.video_like_done", "👍") : tStory("story.video_like_title", "👍")) + '">');
            html.push('      <span class="like-heart">👍</span> <span class="like-num">' + (v.likesCount || 0) + '</span>');
            html.push('    </button>');

            if (isYt && ytid) {
                html.push('    <a href="https://www.youtube.com/watch?v=' + ytid + '" target="_blank" rel="noopener noreferrer" class="lp-video-btn-action" title="' + this.escapeHtml(tStory("story.video_watch_yt", "YouTube")) + '">');
                html.push('      <span>' + this.escapeHtml(tStory("story.video_watch_yt", "📺 YouTube")) + '</span>');
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

        PRS_Api.post("like-video", null, { params: { id: id } })
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
        PRS_Api.get("get-announcement")
            .then(function (res) {
                if (res && res.ok && res.announcement && res.announcement.message) {
                    self._lastAnnouncement = res.announcement;
                    self.renderAnnouncement();
                }
            })
            .catch(function (err) { console.warn("[KiDesky] get-announcement failed:", err); });
    },

    renderAnnouncement: function () {
        if (!this._lastAnnouncement) return;
        var banner = document.getElementById("topbar-announcement-banner");
        var txt = document.getElementById("announcement-message-text");
        var lnk = document.getElementById("announcement-link-btn");
        if (banner && txt) {
            var msg = this._lastAnnouncement.message;
            if (msg.indexOf("Vítejte v království KiDesky") !== -1 || msg.indexOf("Otestujte své rytířské ctnosti") !== -1) {
                msg = window.PRS_I18n ? window.PRS_I18n.t("announcement.text", null, msg) : msg;
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
        bgImg.src = "assets/board/parchment_board_bg.webp";

        var castleImg = new Image();
        castleImg.src = "assets/landmarks/royal_castle.webp";

        // 2. Královský drak (Červený ohnivý drak U3) pro Dračí sluj
        var dragonImg = new Image();
        dragonImg.src = "assets/dragons/dragon_red.webp";

        // 3. Nová 2.5D figurka rytíře
        var knightPawnImg = new Image();
        knightPawnImg.src = "assets/pawns/pawn_knight_valiant.webp";

        // 4. Harmonická pětice medailonků na královské pouti
        var questTiles = [
            { key: "start", rx: 0.12, ry: 0.58, label: "Start", color: "#10b981", icon: "🚩", src: "assets/tiles/start.webp", story: "🚩 1. Startovní rozcestí: Rytíř vyráží s 10 000 zlaťáky do světa" },
            { key: "horses", rx: 0.31, ry: 0.40, label: "Chov koní", color: "#f59e0b", icon: "🐎", src: "assets/tiles/kun.webp", story: "🐎 2. Chov koní & stáje: Budování panství, zvířata a výběr nájmů" },
            { key: "castle", rx: 0.50, ry: 0.58, label: "Hrad & Turnaj", color: "#0ea5e9", icon: "🏰", src: "assets/tiles/castle.webp", story: "🏰 3. Královský turnaj: Klání mistrů ve 4 královských ctnostech" },
            { key: "dragon", rx: 0.69, ry: 0.40, label: "Dračí sluj", color: "#ef4444", icon: "🐉", src: "assets/tiles/u3_drak.webp", story: "🐉 4. Dračí sluj: Epický souboj s ohnivým drakem o slavný poklad" },
            { key: "festival", rx: 0.88, ry: 0.58, label: "Slavnosti 💖", color: "#ec4899", icon: "💖", src: "assets/tiles/festival.webp", story: "💖 5. Královské slavnosti: Zisk 30 Princezniných srdcí a vítězství!" }
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
                    var canvasTileLbl = (window.PRS_I18n && tile.key) ? window.PRS_I18n.t("welcome.showcase_tiles." + tile.key + ".label", null, tile.label) : tile.label;
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
                        var tileKey = questTiles[currSeg].key;
                        tickerEl.textContent = (window.PRS_I18n && tileKey) ? window.PRS_I18n.t("welcome.showcase_tiles." + tileKey + ".story", null, questTiles[currSeg].story) : questTiles[currSeg].story;
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
    }
    });
})();
