// ============================================================================
// KiDesky: KRÁLOVSKÝ DIALOGOVÝ SYSTÉM (Custom Alert, Confirm & Prompt)
// ============================================================================
(function (window, document) {
    'use strict';

    var backdropEl = null;
    var currentResolver = null;
    var keyListener = null;

    function ensureDOM() {
        if (backdropEl && document.body.contains(backdropEl)) return backdropEl;

        backdropEl = document.createElement('div');
        backdropEl.id = 'kd-dialog-root';
        backdropEl.className = 'kd-dialog-backdrop';
        backdropEl.setAttribute('role', 'dialog');
        backdropEl.setAttribute('aria-modal', 'true');

        backdropEl.innerHTML = 
            '<div class="kd-dialog-card" id="kd-dialog-card">' +
                '<div class="kd-dialog-icon-badge" id="kd-dialog-icon">👑</div>' +
                '<h3 class="kd-dialog-title" id="kd-dialog-title">Královské poselství</h3>' +
                '<div class="kd-dialog-message" id="kd-dialog-message"></div>' +
                '<div class="kd-dialog-input-wrap" id="kd-dialog-input-wrap" style="display:none;">' +
                    '<input type="text" class="kd-dialog-input" id="kd-dialog-input" autocomplete="off" />' +
                '</div>' +
                '<div class="kd-dialog-actions" id="kd-dialog-actions"></div>' +
            '</div>';

        document.body.appendChild(backdropEl);

        backdropEl.addEventListener('click', function (e) {
            if (e.target === backdropEl) {
                if (backdropEl.dataset.type === 'confirm') {
                    dismiss(false);
                } else if (backdropEl.dataset.type === 'prompt') {
                    dismiss(null);
                } else {
                    dismiss(true);
                }
            }
        });

        return backdropEl;
    }

    function dismiss(result) {
        if (!backdropEl) return;
        backdropEl.classList.remove('kd-dialog-active');
        if (keyListener) {
            document.removeEventListener('keydown', keyListener);
            keyListener = null;
        }
        var resolve = currentResolver;
        currentResolver = null;
        setTimeout(function () {
            if (backdropEl) backdropEl.style.display = 'none';
            if (resolve) resolve(result);
        }, 220);
    }

    function setDialogContent(el, msgStr) {
        if (!el) return;
        var s = String(msgStr || "");
        if (/<[a-z][\s\S]*>/i.test(s)) {
            el.innerHTML = s;
        } else {
            el.innerHTML = s
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br>");
        }
    }

    var Dialog = {
        alert: function (message, options) {
            options = options || {};
            var title = options.title || "Královské poselství";
            var icon = options.icon || "👑";
            var btnText = options.buttonText || "👑 Rozumím";

            var msgStr = String(message || "");
            // Extract leading emoji if present for the badge
            var emojiMatch = msgStr.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2705|\u274C|\u26A0\uFE0F|\u2139\uFE0F|\u2728|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/);
            if (emojiMatch && !options.icon) {
                icon = emojiMatch[1];
                msgStr = msgStr.substring(emojiMatch[0].length).trim();
            }

            return new Promise(function (resolve) {
                var root = ensureDOM();
                root.dataset.type = 'alert';
                currentResolver = resolve;

                var iconEl = document.getElementById('kd-dialog-icon');
                var titleEl = document.getElementById('kd-dialog-title');
                var msgEl = document.getElementById('kd-dialog-message');
                var inputWrap = document.getElementById('kd-dialog-input-wrap');
                var actions = document.getElementById('kd-dialog-actions');

                if (iconEl) iconEl.textContent = icon;
                if (titleEl) titleEl.textContent = title;
                if (msgEl) setDialogContent(msgEl, msgStr);
                if (inputWrap) inputWrap.style.display = 'none';

                if (actions) {
                    actions.innerHTML = '<button type="button" class="kd-dialog-btn kd-dialog-btn-primary" id="kd-dialog-ok-btn">' + btnText + '</button>';
                }

                var okBtn = document.getElementById('kd-dialog-ok-btn');
                if (okBtn) {
                    okBtn.onclick = function () {
                        if (window.PRS_Audio && window.PRS_Audio.playDiceRoll) {
                            try { window.PRS_Audio.playDiceRoll(); } catch (e) {}
                        }
                        dismiss(true);
                    };
                }

                keyListener = function (e) {
                    if (e.key === 'Escape' || e.key === 'Enter') {
                        e.preventDefault();
                        dismiss(true);
                    }
                };
                document.addEventListener('keydown', keyListener);

                root.style.display = 'flex';
                root.offsetHeight; // reflow
                root.classList.add('kd-dialog-active');
                if (okBtn) okBtn.focus();

                if (window.PRS_Audio && window.PRS_Audio.playNotice) {
                    try { window.PRS_Audio.playNotice(); } catch (e) {}
                }
            });
        },

        confirm: function (message, options) {
            options = options || {};
            var title = options.title || "Královské rozhodnutí";
            var icon = options.icon || "⚔️";
            var confirmText = options.confirmText || "Ano, provést";
            var cancelText = options.cancelText || "Zrušit";
            var isDanger = !!options.isDanger;

            var msgStr = String(message || "");
            var emojiMatch = msgStr.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2705|\u274C|\u26A0\uFE0F|\u2139\uFE0F|\u2728|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/);
            if (emojiMatch && !options.icon) {
                icon = emojiMatch[1];
                msgStr = msgStr.substring(emojiMatch[0].length).trim();
            }

            return new Promise(function (resolve) {
                var root = ensureDOM();
                root.dataset.type = 'confirm';
                currentResolver = resolve;

                var iconEl = document.getElementById('kd-dialog-icon');
                var titleEl = document.getElementById('kd-dialog-title');
                var msgEl = document.getElementById('kd-dialog-message');
                var inputWrap = document.getElementById('kd-dialog-input-wrap');
                var actions = document.getElementById('kd-dialog-actions');

                if (iconEl) iconEl.textContent = icon;
                if (titleEl) titleEl.textContent = title;
                if (msgEl) setDialogContent(msgEl, msgStr);
                if (inputWrap) inputWrap.style.display = 'none';

                var confirmBtnClass = isDanger ? 'kd-dialog-btn kd-dialog-btn-danger' : 'kd-dialog-btn kd-dialog-btn-primary';
                if (actions) {
                    actions.innerHTML = 
                        '<button type="button" class="kd-dialog-btn kd-dialog-btn-secondary" id="kd-dialog-cancel-btn">' + cancelText + '</button>' +
                        '<button type="button" class="' + confirmBtnClass + '" id="kd-dialog-confirm-btn">' + confirmText + '</button>';
                }

                var confirmBtn = document.getElementById('kd-dialog-confirm-btn');
                var cancelBtn = document.getElementById('kd-dialog-cancel-btn');

                if (confirmBtn) {
                    confirmBtn.onclick = function () {
                        if (window.PRS_Audio && window.PRS_Audio.playDiceRoll) {
                            try { window.PRS_Audio.playDiceRoll(); } catch (e) {}
                        }
                        dismiss(true);
                    };
                }
                if (cancelBtn) {
                    cancelBtn.onclick = function () {
                        dismiss(false);
                    };
                }

                keyListener = function (e) {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        dismiss(false);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        dismiss(true);
                    }
                };
                document.addEventListener('keydown', keyListener);

                root.style.display = 'flex';
                root.offsetHeight;
                root.classList.add('kd-dialog-active');
                if (confirmBtn) confirmBtn.focus();

                if (window.PRS_Audio && window.PRS_Audio.playNotice) {
                    try { window.PRS_Audio.playNotice(); } catch (e) {}
                }
            });
        },

        prompt: function (message, defaultValue, options) {
            options = options || {};
            var title = options.title || "Královská otázka";
            var icon = options.icon || "✍️";
            var confirmText = options.confirmText || "Potvrdit";
            var cancelText = options.cancelText || "Zrušit";
            var placeholder = options.placeholder || "";
            var inputType = options.inputType || "text";

            var msgStr = String(message || "");
            var emojiMatch = msgStr.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2705|\u274C|\u26A0\uFE0F|\u2139\uFE0F|\u2728|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/);
            if (emojiMatch && !options.icon) {
                icon = emojiMatch[1];
                msgStr = msgStr.substring(emojiMatch[0].length).trim();
            }

            return new Promise(function (resolve) {
                var root = ensureDOM();
                root.dataset.type = 'prompt';
                currentResolver = resolve;

                var iconEl = document.getElementById('kd-dialog-icon');
                var titleEl = document.getElementById('kd-dialog-title');
                var msgEl = document.getElementById('kd-dialog-message');
                var inputWrap = document.getElementById('kd-dialog-input-wrap');
                var inp = document.getElementById('kd-dialog-input');
                var actions = document.getElementById('kd-dialog-actions');

                if (iconEl) iconEl.textContent = icon;
                if (titleEl) titleEl.textContent = title;
                if (msgEl) setDialogContent(msgEl, msgStr);

                if (inputWrap) inputWrap.style.display = 'block';
                if (inp) {
                    inp.type = inputType;
                    inp.value = (defaultValue !== undefined && defaultValue !== null) ? defaultValue : "";
                    inp.placeholder = placeholder;
                }

                if (actions) {
                    actions.innerHTML = 
                        '<button type="button" class="kd-dialog-btn kd-dialog-btn-secondary" id="kd-dialog-cancel-btn">' + cancelText + '</button>' +
                        '<button type="button" class="kd-dialog-btn kd-dialog-btn-primary" id="kd-dialog-confirm-btn">' + confirmText + '</button>';
                }

                var confirmBtn = document.getElementById('kd-dialog-confirm-btn');
                var cancelBtn = document.getElementById('kd-dialog-cancel-btn');

                function submitValue() {
                    var val = inp ? inp.value : "";
                    if (window.PRS_Audio && window.PRS_Audio.playDiceRoll) {
                        try { window.PRS_Audio.playDiceRoll(); } catch (e) {}
                    }
                    dismiss(val);
                }

                if (confirmBtn) confirmBtn.onclick = submitValue;
                if (cancelBtn) cancelBtn.onclick = function () { dismiss(null); };

                if (inp) {
                    inp.onkeydown = function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            submitValue();
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            dismiss(null);
                        }
                    };
                }

                keyListener = function (e) {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        dismiss(null);
                    }
                };
                document.addEventListener('keydown', keyListener);

                root.style.display = 'flex';
                root.offsetHeight;
                root.classList.add('kd-dialog-active');
                if (inp) {
                    inp.focus();
                    inp.select();
                }

                if (window.PRS_Audio && window.PRS_Audio.playNotice) {
                    try { window.PRS_Audio.playNotice(); } catch (e) {}
                }
            });
        },

        choice: function (message, choices, options) {
            options = options || {};
            var title = options.title || "Královská volba";
            var icon = options.icon || "👑";

            return new Promise(function (resolve) {
                var root = ensureDOM();
                root.dataset.type = 'choice';
                currentResolver = resolve;

                var titleEl = document.getElementById('kd-dialog-title');
                var msgEl = document.getElementById('kd-dialog-message');
                var iconEl = document.getElementById('kd-dialog-icon');
                var inputWrap = document.getElementById('kd-dialog-input-wrap');
                var actions = document.getElementById('kd-dialog-actions');

                if (titleEl) titleEl.textContent = title;
                if (iconEl) iconEl.textContent = icon;
                if (inputWrap) inputWrap.style.display = 'none';

                setDialogContent(msgEl, message);

                var btnsHtml = [];
                (choices || []).forEach(function (c, idx) {
                    var cls = c.isPrimary ? 'kd-dialog-btn kd-dialog-btn-primary' : (c.isDanger ? 'kd-dialog-btn kd-dialog-btn-danger' : 'kd-dialog-btn kd-dialog-btn-secondary');
                    var extraStyle = c.style || 'width:100%; text-align:left; justify-content:flex-start; padding:0.6rem 0.85rem; font-size:0.86rem; box-sizing:border-box; margin-bottom:0.25rem;';
                    btnsHtml.push('<button type="button" class="' + cls + '" id="kd-dialog-choice-' + idx + '" style="' + extraStyle + '">' + c.label + (c.description ? ('<div style="font-size:0.75rem; opacity:0.82; font-weight:normal; margin-top:3px; line-height:1.25;">' + c.description + '</div>') : '') + '</button>');
                });
                btnsHtml.push('<button type="button" class="kd-dialog-btn kd-dialog-btn-secondary" id="kd-dialog-choice-cancel" style="margin-top:0.35rem; width:100%; justify-content:center;">Zrušit</button>');

                if (actions) {
                    actions.style.flexDirection = 'column';
                    actions.style.gap = '0.4rem';
                    actions.innerHTML = btnsHtml.join('\n');
                }

                (choices || []).forEach(function (c, idx) {
                    var b = document.getElementById('kd-dialog-choice-' + idx);
                    if (b) {
                        b.onclick = function () {
                            if (window.PRS_Audio && window.PRS_Audio.playDiceRoll) {
                                try { window.PRS_Audio.playDiceRoll(); } catch (e) {}
                            }
                            if (actions) { actions.style.flexDirection = ''; actions.style.gap = ''; }
                            dismiss(c.id);
                        };
                    }
                });

                var cancelBtn = document.getElementById('kd-dialog-choice-cancel');
                if (cancelBtn) {
                    cancelBtn.onclick = function () {
                        if (actions) { actions.style.flexDirection = ''; actions.style.gap = ''; }
                        dismiss(null);
                    };
                }

                keyListener = function (e) {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        if (actions) { actions.style.flexDirection = ''; actions.style.gap = ''; }
                        dismiss(null);
                    }
                };
                document.addEventListener('keydown', keyListener);

                root.style.display = 'flex';
                root.offsetHeight;
                root.classList.add('kd-dialog-active');

                if (window.PRS_Audio && window.PRS_Audio.playNotice) {
                    try { window.PRS_Audio.playNotice(); } catch (e) {}
                }
            });
        }
    };

    window.KiDeskyDialog = Dialog;
    if (!window.PRS_App) window.PRS_App = {};
    window.PRS_App.dialog = Dialog;

    // Globální override pro alert, aby každé volání v celém projektu okamžitě využívalo královský vizuál
    window.alert = function (msg) {
        return Dialog.alert(msg);
    };

})(window, document);
