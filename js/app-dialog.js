// ============================================================================
// KiDesky: KRÁLOVSKÝ DIALOGOVÝ SYSTÉM (Custom Alert, Confirm, Prompt & Choice)
// ============================================================================
(function (window, document) {
    'use strict';

    var backdropEl = null;
    var currentResolver = null;
    var keyListener = null;

    function escapeHtml(str) {
        return String(str === null || str === undefined ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var ALLOWED_TAGS = {
        B: true,
        STRONG: true,
        I: true,
        EM: true,
        U: true,
        BR: true,
        CODE: true,
        SPAN: true,
        SMALL: true,
        P: true,
        UL: true,
        OL: true,
        LI: true
    };

    var DROP_TAGS = {
        SCRIPT: true,
        STYLE: true,
        IFRAME: true,
        OBJECT: true,
        EMBED: true,
        SVG: true,
        MATH: true,
        TEMPLATE: true,
        NOSCRIPT: true
    };

    function isSafeCssStyle(val) {
        var s = String(val || '');
        if (!s) return false;
        if (/url\s*\(|expression\s*\(|javascript:|vbscript:|behavior:|@import|-moz-binding/i.test(s)) {
            return false;
        }
        return true;
    }

    function serializeSafeNode(node) {
        if (!node) return '';
        if (node.nodeType === 3) {
            return escapeHtml(node.nodeValue || '');
        }
        if (node.nodeType !== 1) {
            return '';
        }
        var tag = String(node.tagName || '').toUpperCase();
        if (DROP_TAGS[tag]) {
            return '';
        }
        var inner = '';
        var children = node.childNodes || [];
        for (var i = 0; i < children.length; i++) {
            inner += serializeSafeNode(children[i]);
        }
        if (!ALLOWED_TAGS[tag]) {
            return inner;
        }
        var lowerTag = tag.toLowerCase();
        if (tag === 'BR') {
            return '<br>';
        }
        var attrs = '';
        if (node.attributes) {
            for (var j = 0; j < node.attributes.length; j++) {
                var attr = node.attributes[j];
                var aName = String(attr.name || '').toLowerCase();
                var aVal = String(attr.value || '');
                if (aName === 'class') {
                    attrs += ' class="' + escapeHtml(aVal) + '"';
                } else if (aName === 'style' && isSafeCssStyle(aVal)) {
                    attrs += ' style="' + escapeHtml(aVal) + '"';
                }
            }
        }
        return '<' + lowerTag + attrs + '>' + inner + '</' + lowerTag + '>';
    }

    function sanitizeSafeHtml(html) {
        var raw = String(html === null || html === undefined ? '' : html);
        if (!raw) return '';
        if (typeof DOMParser === 'function') {
            try {
                var doc = new DOMParser().parseFromString(raw, 'text/html');
                if (doc && doc.body) {
                    var out = '';
                    var kids = doc.body.childNodes || [];
                    for (var i = 0; i < kids.length; i++) {
                        out += serializeSafeNode(kids[i]);
                    }
                    return out;
                }
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('[KiDeskyDialog] HTML sanitize fallback:', e);
                }
            }
        }
        return escapeHtml(raw).replace(/\n/g, '<br>');
    }

    function cleanupPendingDialog() {
        if (keyListener) {
            document.removeEventListener('keydown', keyListener);
            keyListener = null;
        }
        if (currentResolver) {
            var prevResolve = currentResolver;
            currentResolver = null;
            var prevType = backdropEl ? backdropEl.dataset.type : 'alert';
            var fallback = (prevType === 'confirm') ? false : ((prevType === 'prompt' || prevType === 'choice') ? null : true);
            try {
                prevResolve(fallback);
            } catch (e) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('[KiDeskyDialog] pending resolver cleanup error:', e);
                }
            }
        }
    }

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
                } else if (backdropEl.dataset.type === 'prompt' || backdropEl.dataset.type === 'choice') {
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
            if (backdropEl && !currentResolver) {
                backdropEl.style.display = 'none';
                var actions = document.getElementById('kd-dialog-actions');
                if (actions) {
                    actions.style.flexDirection = '';
                    actions.style.gap = '';
                }
            }
            if (resolve) resolve(result);
        }, 220);
    }

    function setDialogContent(el, msgStr, allowHtml) {
        if (!el) return;
        var s = String(msgStr === null || msgStr === undefined ? '' : msgStr);
        if (allowHtml === true) {
            el.innerHTML = sanitizeSafeHtml(s);
        } else {
            el.innerHTML = escapeHtml(s).replace(/\n/g, '<br>');
        }
    }

    function createActionButton(id, className, label) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = className;
        if (id) btn.id = id;
        btn.textContent = String(label || '');
        return btn;
    }

    var Dialog = {
        escapeHtml: escapeHtml,
        sanitizeSafeHtml: sanitizeSafeHtml,

        alert: function (message, options) {
            options = options || {};
            var title = options.title || (window.PRS_I18n ? window.PRS_I18n.t("dialog.alert_title", null, "Královské poselství") : "Královské poselství");
            var icon = options.icon || "👑";
            var btnText = options.buttonText || (window.PRS_I18n ? window.PRS_I18n.t("dialog.ok", null, "👑 Rozumím") : "👑 Rozumím");

            var msgStr = String(message === null || message === undefined ? "" : message);
            var emojiMatch = msgStr.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2705|\u274C|\u26A0\uFE0F|\u2139\uFE0F|\u2728|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/);
            if (emojiMatch && !options.icon) {
                icon = emojiMatch[1];
                msgStr = msgStr.substring(emojiMatch[0].length).trim();
            }

            return new Promise(function (resolve) {
                cleanupPendingDialog();
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
                if (msgEl) setDialogContent(msgEl, msgStr, !!options.allowHtml);
                if (inputWrap) inputWrap.style.display = 'none';

                var okBtn = null;
                if (actions) {
                    actions.style.flexDirection = '';
                    actions.style.gap = '';
                    actions.innerHTML = '';
                    okBtn = createActionButton('kd-dialog-ok-btn', 'kd-dialog-btn kd-dialog-btn-primary', btnText);
                    actions.appendChild(okBtn);
                }

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
            var title = options.title || (window.PRS_I18n ? window.PRS_I18n.t("dialog.confirm_title", null, "Královské rozhodnutí") : "Královské rozhodnutí");
            var icon = options.icon || "⚔️";
            var confirmText = options.confirmText || (window.PRS_I18n ? window.PRS_I18n.t("dialog.confirm_btn", null, "Ano, provést") : "Ano, provést");
            var cancelText = options.cancelText || (window.PRS_I18n ? window.PRS_I18n.t("dialog.cancel_btn", null, "Zrušit") : "Zrušit");
            var isDanger = !!(options.isDanger || options.danger);

            var msgStr = String(message === null || message === undefined ? "" : message);
            var emojiMatch = msgStr.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2705|\u274C|\u26A0\uFE0F|\u2139\uFE0F|\u2728|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/);
            if (emojiMatch && !options.icon) {
                icon = emojiMatch[1];
                msgStr = msgStr.substring(emojiMatch[0].length).trim();
            }

            return new Promise(function (resolve) {
                cleanupPendingDialog();
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
                if (msgEl) setDialogContent(msgEl, msgStr, !!options.allowHtml);
                if (inputWrap) inputWrap.style.display = 'none';

                var confirmBtnClass = isDanger ? 'kd-dialog-btn kd-dialog-btn-danger' : 'kd-dialog-btn kd-dialog-btn-primary';
                var cancelBtn = null;
                var confirmBtn = null;
                if (actions) {
                    actions.style.flexDirection = '';
                    actions.style.gap = '';
                    actions.innerHTML = '';
                    cancelBtn = createActionButton('kd-dialog-cancel-btn', 'kd-dialog-btn kd-dialog-btn-secondary', cancelText);
                    confirmBtn = createActionButton('kd-dialog-confirm-btn', confirmBtnClass, confirmText);
                    actions.appendChild(cancelBtn);
                    actions.appendChild(confirmBtn);
                }

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
            var title = options.title || (window.PRS_I18n ? window.PRS_I18n.t("dialog.prompt_title", null, "Královská otázka") : "Královská otázka");
            var icon = options.icon || "✍️";
            var confirmText = options.confirmText || (window.PRS_I18n ? window.PRS_I18n.t("dialog.submit_btn", null, "Potvrdit") : "Potvrdit");
            var cancelText = options.cancelText || (window.PRS_I18n ? window.PRS_I18n.t("dialog.cancel_btn", null, "Zrušit") : "Zrušit");
            var placeholder = options.placeholder || "";
            var inputType = options.inputType || "text";

            var msgStr = String(message === null || message === undefined ? "" : message);
            var emojiMatch = msgStr.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\u2705|\u274C|\u26A0\uFE0F|\u2139\uFE0F|\u2728|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF])/);
            if (emojiMatch && !options.icon) {
                icon = emojiMatch[1];
                msgStr = msgStr.substring(emojiMatch[0].length).trim();
            }

            return new Promise(function (resolve) {
                cleanupPendingDialog();
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
                if (msgEl) setDialogContent(msgEl, msgStr, !!options.allowHtml);

                if (inputWrap) inputWrap.style.display = 'block';
                if (inp) {
                    inp.type = inputType;
                    inp.value = (defaultValue !== undefined && defaultValue !== null) ? defaultValue : "";
                    inp.placeholder = placeholder;
                }

                var cancelBtn = null;
                var confirmBtn = null;
                if (actions) {
                    actions.style.flexDirection = '';
                    actions.style.gap = '';
                    actions.innerHTML = '';
                    cancelBtn = createActionButton('kd-dialog-cancel-btn', 'kd-dialog-btn kd-dialog-btn-secondary', cancelText);
                    confirmBtn = createActionButton('kd-dialog-confirm-btn', 'kd-dialog-btn kd-dialog-btn-primary', confirmText);
                    actions.appendChild(cancelBtn);
                    actions.appendChild(confirmBtn);
                }

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
            var title = options.title || (window.PRS_I18n ? window.PRS_I18n.t("dialog.choice_title", null, "Královská volba") : "Královská volba");
            var icon = options.icon || "👑";
            var cancelText = options.cancelText || (window.PRS_I18n ? window.PRS_I18n.t("dialog.back_cancel", null, "Zpět / Zrušit") : "Zrušit");

            return new Promise(function (resolve) {
                cleanupPendingDialog();
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

                setDialogContent(msgEl, message, !!options.allowHtml);

                if (actions) {
                    actions.style.flexDirection = 'column';
                    actions.style.gap = '0.4rem';
                    actions.innerHTML = '';

                    (choices || []).forEach(function (c, idx) {
                        var cls = c.isPrimary ? 'kd-dialog-btn kd-dialog-btn-primary' : (c.isDanger ? 'kd-dialog-btn kd-dialog-btn-danger' : 'kd-dialog-btn kd-dialog-btn-secondary');
                        var extraStyle = c.style || 'width:100%; text-align:left; justify-content:flex-start; padding:0.6rem 0.85rem; font-size:0.86rem; box-sizing:border-box; margin-bottom:0.25rem;';
                        var b = document.createElement('button');
                        b.type = 'button';
                        b.className = cls;
                        b.id = 'kd-dialog-choice-' + idx;
                        b.style.cssText = extraStyle;
                        b.appendChild(document.createTextNode(String(c.label || '')));
                        if (c.description) {
                            var descEl = document.createElement('div');
                            descEl.style.cssText = 'font-size:0.75rem; opacity:0.82; font-weight:normal; margin-top:3px; line-height:1.25;';
                            descEl.textContent = String(c.description);
                            b.appendChild(descEl);
                        }
                        b.onclick = function () {
                            if (window.PRS_Audio && window.PRS_Audio.playDiceRoll) {
                                try { window.PRS_Audio.playDiceRoll(); } catch (e) {}
                            }
                            actions.style.flexDirection = '';
                            actions.style.gap = '';
                            dismiss(c.id);
                        };
                        actions.appendChild(b);
                    });

                    var cancelBtn = document.createElement('button');
                    cancelBtn.type = 'button';
                    cancelBtn.className = 'kd-dialog-btn kd-dialog-btn-secondary';
                    cancelBtn.id = 'kd-dialog-choice-cancel';
                    cancelBtn.style.cssText = 'margin-top:0.35rem; width:100%; justify-content:center;';
                    cancelBtn.textContent = String(cancelText || '');
                    cancelBtn.onclick = function () {
                        actions.style.flexDirection = '';
                        actions.style.gap = '';
                        dismiss(null);
                    };
                    actions.appendChild(cancelBtn);
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
