/**
 * KiDesky: Princeznino srdce
 * Jednotný správce modálních oken (PRS_ModalManager)
 *
 * Zajišťuje:
 * - LIFO zásobník otevřených modálů (.modal-backdrop)
 * - Automatické ARIA atributy (role="dialog", aria-modal="true", aria-labelledby)
 * - Uložení a návrat fokusu + Focus Trap (Tab / Shift+Tab) v horním modálu
 * - Zavírání nejvyššího modálu klávesou Escape (i při fokusu ve vstupním poli)
 * - Koexistenci s KiDeskyDialog (#kd-dialog-root má vždy přednost)
 * - Synchronizaci třídy body.modal-open
 */
(function (window, document) {
    'use strict';

    var CLOSE_METHOD_MAP = {
        'online-role-modal': 'closeOnlineRoleModal',
        'victory-modal': 'closeVictoryModal',
        'diploma-modal': 'closeWinnerDiplomaModal',
        'armory-modal': 'closeArmoryModal',
        'graphics-modal': 'closeGraphicsModal',
        'auth-modal': 'closeAuthModal',
        'prs-music-modal': 'closeMusicPopup',
        'image-lightbox-modal': 'closeImageModal',
        'tutorial-onboarding-modal': 'closeTutorialModal',
        'knight-duel-modal': 'closeKnightDuelModal',
        'quest-duel-modal': 'closeQuestDuelModal',
        'chance-card-modal': 'closeChanceModal',
        'card-deck-inspector-modal': 'closeDeckModal',
        'card-detail-preview-modal': 'closeCardPreviewModal',
        'tile-atlas-modal': 'closeTileAtlasModal',
        'game-settings-modal': 'closeSettingsModal',
        'festival-modal': 'closeFestivalModal',
        'crest-picker-modal': 'closeCrestPickerModal',
        'admin-video-modal': 'closeAdminVideoModal',
        'admin-user-modal': 'closeAdminUserModal',
        'admin-audio-modal': 'closeAdminAudioModal',
        'pawn-shop-modal': 'closePawnShopModal',
        'save-game-modal': 'closeSaveGameModal',
        'online-seats-modal': 'closeOnlineSeatsModal',
        'achievements-modal': 'closeAchievementsModal',
        'cheatsheet-modal': 'closeCheatSheetModal',
        'catalog-game-modal': 'closeGameCatalogPreview',
        'map-studio-modal': 'closeMapStudioModal',
        'admin-board-modal': 'closeAdminBoardModal',
        'pwa-install-modal': 'closePwaInstallModal'
    };

    var FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    function isElementVisible(el) {
        if (!el || !el.style) return false;
        var inlineDisplay = (el.style.display || '').trim().toLowerCase();
        if (inlineDisplay === 'none') return false;
        if (inlineDisplay && inlineDisplay !== 'none') return true;
        if (typeof window.getComputedStyle === 'function') {
            try {
                var cs = window.getComputedStyle(el);
                if (cs && cs.display) {
                    return cs.display !== 'none';
                }
            } catch (e) { /* fallback */ }
        }
        return !!(el.classList && (el.classList.contains('open') || el.classList.contains('show') || el.classList.contains('active')));
    }

    function isFocusableVisible(el, modalEl) {
        if (!el || el.disabled) return false;
        if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
        // Walk up until modalEl to ensure no hidden ancestor wrapper (e.g. tab/step display:none)
        var cur = el;
        while (cur && cur !== modalEl) {
            if (cur.style && (cur.style.display || '').trim().toLowerCase() === 'none') return false;
            cur = cur.parentNode;
        }
        if (typeof window.getComputedStyle === 'function') {
            try {
                var cs = window.getComputedStyle(el);
                if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
            } catch (e) { /* ignore */ }
        }
        return true;
    }

    var PRS_ModalManager = {
        _initialized: false,
        _stack: [],
        _customHandlers: {},
        _observer: null,
        _keydownBound: false,
        _backdropGuardBound: false,
        _mouseDownBackdrop: null,
        _syncScheduled: false,

        init: function () {
            if (this._initialized || !document) return;
            this._initialized = true;

            this.syncAll();
            this._bindKeydown();
            this._bindBackdropClickGuard();
            this._observeMutations();
        },

        registerCloseHandler: function (modalId, fn) {
            if (modalId && typeof fn === 'function') {
                this._customHandlers[modalId] = fn;
            }
        },

        ensureA11yAttributes: function (modalEl) {
            if (!modalEl || !modalEl.setAttribute) return;
            if (!modalEl.getAttribute('role')) modalEl.setAttribute('role', 'dialog');
            if (!modalEl.getAttribute('aria-modal')) modalEl.setAttribute('aria-modal', 'true');
            if (!modalEl.hasAttribute('tabindex')) modalEl.setAttribute('tabindex', '-1');

            if (!modalEl.getAttribute('aria-labelledby') && modalEl.querySelector) {
                var heading = modalEl.querySelector('h1, h2, h3');
                if (heading) {
                    if (!heading.id && modalEl.id) {
                        heading.id = modalEl.id + '-heading';
                    }
                    if (heading.id) {
                        modalEl.setAttribute('aria-labelledby', heading.id);
                    }
                }
            }
        },

        syncAll: function () {
            if (!document || !document.querySelectorAll) return;
            var backdrops = document.querySelectorAll('.modal-backdrop');
            var openSet = [];
            var i;

            for (i = 0; i < backdrops.length; i++) {
                var el = backdrops[i];
                this.ensureA11yAttributes(el);
                if (isElementVisible(el)) {
                    openSet.push(el);
                }
            }

            // 1. Remove modals from stack that are no longer visible
            var closedEntries = [];
            for (i = this._stack.length - 1; i >= 0; i--) {
                var entry = this._stack[i];
                var stillOpen = openSet.indexOf(entry.el) !== -1;
                if (!stillOpen) {
                    closedEntries.push(entry);
                    this._stack.splice(i, 1);
                }
            }

            // 2. Push newly opened modals to top of LIFO stack
            var newlyOpened = [];
            for (i = 0; i < openSet.length; i++) {
                var openEl = openSet[i];
                if (this._indexInStack(openEl) === -1) {
                    var prevFocus = (document.activeElement && document.activeElement !== document.body)
                        ? document.activeElement
                        : null;
                    var newEntry = {
                        id: openEl.id || ('modal-' + i),
                        el: openEl,
                        previousFocus: prevFocus
                    };
                    this._stack.push(newEntry);
                    newlyOpened.push(newEntry);
                }
            }

            // 3. Sort stack by computed z-index when multiple open modals exist (only promote explicit higher z-index)
            if (this._stack.length > 1) {
                this._stack.sort(function (a, b) {
                    var za = parseInt((a.el.style && a.el.style.zIndex) || '0', 10) || 0;
                    var zb = parseInt((b.el.style && b.el.style.zIndex) || '0', 10) || 0;
                    return za - zb;
                });
            }

            // 4. Sync body.modal-open class
            if (document.body && document.body.classList) {
                if (this._stack.length > 0) {
                    document.body.classList.add('modal-open');
                } else {
                    document.body.classList.remove('modal-open');
                }
            }

            // 5. Focus management
            if (newlyOpened.length > 0) {
                var topModal = this.getTopModal();
                if (topModal && (!document.activeElement || !topModal.contains(document.activeElement))) {
                    this._focusInsideModal(topModal);
                }
            } else if (closedEntries.length > 0) {
                var remainingTop = this.getTopModal();
                if (remainingTop) {
                    if (!document.activeElement || !remainingTop.contains(document.activeElement)) {
                        this._focusInsideModal(remainingTop);
                    }
                } else {
                    // Restore focus from the closed modal
                    var restoreTarget = closedEntries[0] && closedEntries[0].previousFocus;
                    if (restoreTarget && typeof restoreTarget.focus === 'function') {
                        var connected = (restoreTarget.isConnected !== undefined)
                            ? restoreTarget.isConnected
                            : (document.contains ? document.contains(restoreTarget) : true);
                        if (connected) {
                            try { restoreTarget.focus({ preventScroll: true }); } catch (e) {
                                try { restoreTarget.focus(); } catch (e2) { /* ignore */ }
                            }
                        }
                    }
                }
            }
        },

        _indexInStack: function (el) {
            for (var i = 0; i < this._stack.length; i++) {
                if (this._stack[i].el === el) return i;
            }
            return -1;
        },

        _getFocusableElements: function (modalEl) {
            if (!modalEl || !modalEl.querySelectorAll) return [];
            var raw = modalEl.querySelectorAll(FOCUSABLE_SELECTOR);
            var out = [];
            for (var i = 0; i < raw.length; i++) {
                if (isFocusableVisible(raw[i], modalEl)) {
                    out.push(raw[i]);
                }
            }
            return out;
        },

        _focusInsideModal: function (modalEl) {
            if (!modalEl) return;
            var self = this;
            var applyFocus = function () {
                if (!isElementVisible(modalEl)) return;
                if (document.activeElement && modalEl.contains(document.activeElement) && document.activeElement !== modalEl) {
                    return;
                }
                var focusables = self._getFocusableElements(modalEl);
                var target = null;
                var i;
                for (i = 0; i < focusables.length; i++) {
                    var el = focusables[i];
                    var tag = el.tagName ? el.tagName.toLowerCase() : '';
                    var type = (el.type || '').toLowerCase();
                    if (tag === 'textarea' || tag === 'select' || (tag === 'input' && type !== 'hidden' && type !== 'file' && type !== 'checkbox' && type !== 'radio' && type !== 'button' && type !== 'submit' && type !== 'reset')) {
                        target = el;
                        break;
                    }
                }
                if (!target) {
                    for (i = 0; i < focusables.length; i++) {
                        var elBtn = focusables[i];
                        var isCloseBtn = elBtn.classList && (elBtn.classList.contains('modal-close') || elBtn.classList.contains('btn-icon-danger'));
                        if (!isCloseBtn) {
                            target = elBtn;
                            break;
                        }
                    }
                }
                if (!target) {
                    target = focusables.length > 0 ? focusables[0] : modalEl;
                }
                if (target && typeof target.focus === 'function') {
                    try { target.focus({ preventScroll: true }); } catch (e) {
                        try { target.focus(); } catch (e2) { /* ignore */ }
                    }
                }
            };
            if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(applyFocus);
            } else {
                applyFocus();
            }
        },

        isAnyOpen: function () {
            this.syncAll();
            return this._stack.length > 0;
        },

        getTopModal: function () {
            if (this._stack.length === 0) return null;
            return this._stack[this._stack.length - 1].el;
        },

        getStack: function () {
            return this._stack.map(function (item) { return item.id; });
        },

        closeModal: function (modalIdOrEl) {
            var el = (typeof modalIdOrEl === 'string')
                ? document.getElementById(modalIdOrEl)
                : modalIdOrEl;
            if (!el) return false;

            var id = el.id || '';
            var closedViaHandler = false;

            if (id && typeof this._customHandlers[id] === 'function') {
                try {
                    this._customHandlers[id](el);
                    closedViaHandler = !isElementVisible(el);
                } catch (e) {
                    console.warn('[ModalManager] Custom close handler error for ' + id + ':', e);
                }
            }

            if (!closedViaHandler && id && CLOSE_METHOD_MAP[id] && window.PRS_App && typeof window.PRS_App[CLOSE_METHOD_MAP[id]] === 'function') {
                try {
                    window.PRS_App[CLOSE_METHOD_MAP[id]]();
                    closedViaHandler = !isElementVisible(el);
                } catch (e2) {
                    console.warn('[ModalManager] PRS_App.' + CLOSE_METHOD_MAP[id] + ' error:', e2);
                }
            }

            if (!closedViaHandler && el.style) {
                el.style.display = 'none';
                if (el.classList) el.classList.remove('open', 'show', 'active');
            }

            this.syncAll();
            return true;
        },

        closeTop: function () {
            this.syncAll();
            var topEl = this.getTopModal();
            if (!topEl) return false;
            return this.closeModal(topEl);
        },

        closeAll: function () {
            this.syncAll();
            var guard = 0;
            while (this._stack.length > 0 && guard < 40) {
                guard++;
                if (!this.closeTop()) break;
            }
            // Defensively ensure no backdrop stayed visible
            if (document && document.querySelectorAll) {
                var all = document.querySelectorAll('.modal-backdrop');
                for (var i = 0; i < all.length; i++) {
                    if (isElementVisible(all[i])) {
                        this.closeModal(all[i]);
                    }
                }
            }
            this.syncAll();
        },

        _bindKeydown: function () {
            if (this._keydownBound || typeof window.addEventListener !== 'function') return;
            this._keydownBound = true;
            var self = this;

            window.addEventListener('keydown', function (e) {
                // KiDeskyDialog has its own priority when active
                if (document.getElementById('kd-dialog-root')) return;

                if (!self.isAnyOpen()) return;
                var topModal = self.getTopModal();
                if (!topModal) return;

                if (e.key === 'Escape' || e.code === 'Escape') {
                    e.preventDefault();
                    if (typeof e.stopPropagation === 'function') e.stopPropagation();
                    self.closeTop();
                    return;
                }

                if (e.key === 'Tab' || e.code === 'Tab') {
                    var focusables = self._getFocusableElements(topModal);
                    if (focusables.length === 0) {
                        e.preventDefault();
                        if (typeof topModal.focus === 'function') topModal.focus();
                        return;
                    }
                    var first = focusables[0];
                    var last = focusables[focusables.length - 1];
                    var active = document.activeElement;
                    if (e.shiftKey) {
                        if (!topModal.contains(active) || active === first || active === topModal) {
                            e.preventDefault();
                            last.focus();
                        }
                    } else {
                        if (!topModal.contains(active) || active === last) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            }, true);
        },

        _bindBackdropClickGuard: function () {
            if (this._backdropGuardBound || !document || typeof document.addEventListener !== 'function') return;
            this._backdropGuardBound = true;
            var self = this;

            document.addEventListener('mousedown', function (e) {
                var target = e && e.target;
                self._mouseDownBackdrop = (target && target.classList && target.classList.contains('modal-backdrop'))
                    ? target
                    : null;
            }, true);

            document.addEventListener('click', function (e) {
                var target = e && e.target;
                if (!target || !target.classList || !target.classList.contains('modal-backdrop')) {
                    self._mouseDownBackdrop = null;
                    return;
                }

                var startedOnBackdrop = (self._mouseDownBackdrop === target);
                self._mouseDownBackdrop = null;

                var hasSelection = false;
                try {
                    if (typeof window.getSelection === 'function') {
                        var sel = window.getSelection();
                        if (sel && String(sel.toString() || '').length > 0) {
                            hasSelection = true;
                        }
                    }
                } catch (err) { /* ignore selection probe failure */ }

                if (!startedOnBackdrop || hasSelection) {
                    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
                    if (typeof e.stopPropagation === 'function') e.stopPropagation();
                    if (typeof e.preventDefault === 'function') e.preventDefault();
                }
            }, true);
        },

        _scheduleSync: function () {
            if (this._syncScheduled) return;
            this._syncScheduled = true;
            var self = this;
            var run = function () {
                self._syncScheduled = false;
                self.syncAll();
            };
            if (typeof Promise === 'function') {
                Promise.resolve().then(run);
            } else {
                setTimeout(run, 0);
            }
        },

        _observeMutations: function () {
            if (this._observer || typeof MutationObserver !== 'function' || !document.body) return;
            var self = this;
            this._observer = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    if (m.type === 'attributes') {
                        if (m.target && m.target.classList && m.target.classList.contains('modal-backdrop')) {
                            self.syncAll();
                            return;
                        }
                    } else if (m.type === 'childList') {
                        self._scheduleSync();
                        return;
                    }
                }
            });
            this._observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    };

    window.PRS_ModalManager = PRS_ModalManager;

    if (document) {
        if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
            document.addEventListener('DOMContentLoaded', function () {
                PRS_ModalManager.init();
            });
        } else {
            PRS_ModalManager.init();
        }
    }
})(window, typeof document !== 'undefined' ? document : null);
