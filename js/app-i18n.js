/**
 * KiDesky: Princeznino srdce
 * Modul mezinárodní lokalizace (i18n)
 * 
 * Zajišťuje:
 * - Správu aktivního jazyka (cs / en) s perzistencí v localStorage.
 * - Překladový helper PRS_I18n.t(key, params, fallback).
 * - Automatický překlad DOM elementů s data-i18n atributy.
 * - Událost 'prs:lang-change' pro dynamické překreslení herních komponent.
 */

(function (window) {
    'use strict';

    var STORAGE_KEY = 'prs_lang';
    var DEFAULT_LANG = 'cs';

    var PRS_I18n = {
        _lang: DEFAULT_LANG,
        _listeners: [],
        _initialized: false,

        /**
         * Dynamicky zjistí všechny dostupné jazyky ze zaregistrovaných slovníků v window.PRS_I18N.
         * Každý slovník nese hlavičku meta: { code, name, flag, short }.
         * Umožňuje přidat nový jazyk pouhým vložením nového souboru s překlady (např. de.js, pl.js).
         */
        getAvailableLanguages: function () {
            var langs = [];
            if (window.PRS_I18N && typeof window.PRS_I18N === 'object') {
                for (var code in window.PRS_I18N) {
                    if (Object.prototype.hasOwnProperty.call(window.PRS_I18N, code)) {
                        var item = window.PRS_I18N[code];
                        if (item && typeof item === 'object') {
                            var meta = item.meta || {};
                            langs.push({
                                code: code,
                                name: meta.name || code.toUpperCase(),
                                flag: meta.flag || '🌐',
                                short: meta.short || code.toUpperCase(),
                                label: (meta.flag ? meta.flag + ' ' : '') + (meta.name || code.toUpperCase())
                            });
                        }
                    }
                }
            }
            if (langs.length === 0) {
                langs.push({ code: 'cs', name: 'Čeština', flag: '🇨🇿', short: 'CZ', label: '🇨🇿 Čeština' });
                langs.push({ code: 'en', name: 'English', flag: '🇬🇧', short: 'EN', label: '🇬🇧 English' });
            }
            return langs;
        },

        /**
         * Ověří, zda je daný jazyk podporován
         */
        isSupportedLanguage: function (lang) {
            if (!lang || typeof lang !== 'string') return false;
            var avail = this.getAvailableLanguages();
            for (var i = 0; i < avail.length; i++) {
                if (avail[i].code === lang) return true;
            }
            return false;
        },

        /**
         * Inicializace i18n subsystému
         */
        init: function () {
            if (this._initialized) return;

            var savedLang = null;
            try {
                savedLang = localStorage.getItem(STORAGE_KEY);
            } catch (e) {
                console.warn('[PRS_I18n] Nelze číst z localStorage:', e);
            }

            if (savedLang && this.isSupportedLanguage(savedLang)) {
                this._lang = savedLang;
            } else {
                // Autodetekce z jazyka prohlížeče
                var navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
                var detectedCode = navLang.split('-')[0];
                if (this.isSupportedLanguage(detectedCode)) {
                    this._lang = detectedCode;
                } else if (navLang.indexOf('en') === 0 && this.isSupportedLanguage('en')) {
                    this._lang = 'en';
                } else {
                    this._lang = DEFAULT_LANG;
                }
            }

            document.documentElement.lang = this._lang;
            this._initialized = true;

            // Přeložit DOM po načtení dokumentu
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function () {
                    PRS_I18n.translateDOM();
                    PRS_I18n.syncUi();
                });
            } else {
                this.translateDOM();
                this.syncUi();
            }
        },

        /**
         * Vrátí aktuálně nastavený jazyk ('cs' | 'en' | ...)
         */
        getLanguage: function () {
            return this._lang || DEFAULT_LANG;
        },

        /**
         * Nastaví nový jazyk hry a aktualizuje UI
         */
        setLanguage: function (lang) {
            if (!this.isSupportedLanguage(lang)) {
                console.warn('[PRS_I18n] Nepodporovaný jazyk:', lang);
                return;
            }

            this._lang = lang;
            try {
                localStorage.setItem(STORAGE_KEY, lang);
            } catch (e) {
                // ignorovat
            }

            document.documentElement.lang = lang;

            // Aktualizace DOM elementů
            this.translateDOM();
            this.syncUi();

            // Upozornit posluchače
            for (var i = 0; i < this._listeners.length; i++) {
                try {
                    this._listeners[i](lang);
                } catch (err) {
                    console.error('[PRS_I18n] Chyba v listeneru:', err);
                }
            }

            // Odeslat CustomEvent
            try {
                if (typeof CustomEvent === 'function') {
                    var event = new CustomEvent('prs:lang-change', { detail: { language: lang } });
                    if (window.dispatchEvent) window.dispatchEvent(event);
                    if (document.dispatchEvent) document.dispatchEvent(event);
                }
            } catch (evErr) { console.warn('[i18n] CustomEvent dispatch failed:', evErr); }

            // Pokud existuje HUD, překreslíme ho
            if (window.PRS_HUD && typeof window.PRS_HUD.render === 'function') {
                try {
                    window.PRS_HUD.render();
                } catch (e) { console.warn('[i18n] PRS_HUD.render failed:', e); }
            }
        },

        /**
         * Přepne mezi CS a EN
         */
        toggleLanguage: function () {
            var nextLang = this._lang === 'cs' ? 'en' : 'cs';
            this.setLanguage(nextLang);
            return nextLang;
        },

        /**
         * Vrátí aktuální překladový slovník pro aktuální jazyk
         */
        getDict: function () {
            return (window.PRS_I18N && window.PRS_I18N[this._lang]) || {};
        },

        /**
         * Překladový helper.
         * @param {string} key - tečková cesta ke klíči (např. 'ui.buttons.settings')
         * @param {Object} [params] - hodnoty k dosazení do řetězce {key: val}
         * @param {string} [fallback] - náhradní text, pokud klíč neexistuje
         */
        t: function (key, params, fallback) {
            if (!key) return '';

            var langData = (window.PRS_I18N && window.PRS_I18N[this._lang]) || {};
            var val = this._resolveKey(langData, key);

            // Fallback na češtinu, pokud v angličtině klíč chybí
            if (val === undefined && this._lang !== 'cs') {
                var csData = (window.PRS_I18N && window.PRS_I18N.cs) || {};
                val = this._resolveKey(csData, key);
            }

            if (val === undefined) {
                val = fallback !== undefined ? fallback : key;
            }

            // Dosazení parametrů {param}
            if (params && typeof params === 'object' && typeof val === 'string') {
                val = val.replace(/\{([a-zA-Z0-9_]+)\}/g, function (match, pKey) {
                    return params[pKey] !== undefined ? params[pKey] : match;
                });
            }

            return val;
        },

        /**
         * Pomocná funkce pro vyřešení vnořeného klíče v objektu
         */
        _resolveKey: function (obj, key) {
            if (!obj || !key) return undefined;
            var parts = key.split('.');
            var curr = obj;
            for (var i = 0; i < parts.length; i++) {
                if (curr === null || curr === undefined || typeof curr !== 'object') {
                    return undefined;
                }
                curr = curr[parts[i]];
            }
            return curr;
        },

        /**
         * Podpora pro množná čísla
         * @param {number} count
         * @param {Object} forms - pro CS: {one, few, many}, pro EN: {one, other}
         */
        plural: function (count, forms) {
            if (!forms) return '';
            var num = Math.abs(Number(count) || 0);

            if (this._lang === 'cs') {
                if (num === 1) return forms.one || forms.other || '';
                if (num >= 2 && num <= 4) return forms.few || forms.other || forms.many || '';
                return forms.many || forms.other || '';
            } else {
                if (num === 1) return forms.one || '';
                return forms.other || forms.many || forms.few || '';
            }
        },

        /**
         * Alias pro translateDOM pro zpětnou kompatibilitu
         */
        updateDOM: function (root) {
            return this.translateDOM(root);
        },

        /**
         * Automatický překlad DOM elementů s data-i18n atributy
         */
        translateDOM: function (root) {
            var el = root || document;
            if (!el || !el.querySelectorAll) return;

            // 1. Textový obsah: data-i18n="key" nebo data-i18n-html="key"
            var textNodes = el.querySelectorAll('[data-i18n], [data-i18n-html]');
            for (var i = 0; i < textNodes.length; i++) {
                var node = textNodes[i];
                var isHtml = node.hasAttribute('data-i18n-html');
                var htmlKey = isHtml ? node.getAttribute('data-i18n-html') : null;
                var key = (htmlKey && htmlKey.length > 0) ? htmlKey : node.getAttribute('data-i18n');
                if (key) {
                    var translation = this.t(key);
                    if (isHtml || translation.indexOf('<') !== -1 || translation.indexOf('&') !== -1) {
                        node.innerHTML = translation;
                    } else {
                        node.textContent = translation;
                    }
                }
            }

            // 2. Title atribut: data-i18n-title="key"
            var titleNodes = el.querySelectorAll('[data-i18n-title]');
            for (var j = 0; j < titleNodes.length; j++) {
                var tNode = titleNodes[j];
                var tKey = tNode.getAttribute('data-i18n-title');
                if (tKey) {
                    tNode.title = this.t(tKey);
                }
            }

            // 3. Placeholder atribut: data-i18n-placeholder="key"
            var phNodes = el.querySelectorAll('[data-i18n-placeholder]');
            for (var k = 0; k < phNodes.length; k++) {
                var phNode = phNodes[k];
                var phKey = phNode.getAttribute('data-i18n-placeholder');
                if (phKey) {
                    phNode.placeholder = this.t(phKey);
                }
            }

            // 4. Aria label: data-i18n-aria="key"
            var ariaNodes = el.querySelectorAll('[data-i18n-aria]');
            for (var m = 0; m < ariaNodes.length; m++) {
                var aNode = ariaNodes[m];
                var aKey = aNode.getAttribute('data-i18n-aria');
                if (aKey) {
                    aNode.setAttribute('aria-label', this.t(aKey));
                }
            }
        },

        /**
         * Synchronizuje vizuální stav přepínačů jazyka v rozhraní
         */
        syncUi: function () {
            var lang = this._lang;

            // 0. Dynamické naplnění a synchronizace všech dropdown výběrů jazyka (.prs-lang-select)
            var selects = document.querySelectorAll('.prs-lang-select, #global-lang-select, #board-bar-lang-select, #settings-lang-select, #mobile-dock-lang-select');
            var avail = this.getAvailableLanguages();
            for (var s = 0; s < selects.length; s++) {
                var sel = selects[s];
                if (!sel || sel.tagName !== 'SELECT') continue;
                var needsRebuild = (sel.options.length !== avail.length);
                if (!needsRebuild) {
                    for (var o = 0; o < avail.length; o++) {
                        if (sel.options[o].value !== avail[o].code) {
                            needsRebuild = true;
                            break;
                        }
                    }
                }
                if (needsRebuild) {
                    sel.innerHTML = '';
                    for (var a = 0; a < avail.length; a++) {
                        var opt = document.createElement('option');
                        opt.value = avail[a].code;
                        opt.textContent = avail[a].label;
                        sel.appendChild(opt);
                    }
                }
                sel.value = lang;
            }

            // 1. Tlačítko v horní liště (zpětná kompatibilita)
            var topBtn = document.getElementById('topbar-lang-btn');
            if (topBtn) {
                if (lang === 'cs') {
                    topBtn.innerHTML = '🇨🇿 <span class="hide-on-mobile">CZ</span>';
                    topBtn.title = 'Jazyk: Čeština (kliknutím přepneš na English)';
                } else {
                    topBtn.innerHTML = '🇬🇧 <span class="hide-on-mobile">EN</span>';
                    topBtn.title = 'Language: English (click to switch to Čeština)';
                }
            }

            // 1b. Tlačítko na plovoucí liště herního plánu
            var boardLabel = document.getElementById('board-bar-lang-label');
            var boardBtn = document.getElementById('board-bar-lang-btn');
            if (boardLabel) boardLabel.textContent = (lang === 'cs' ? 'CZ' : 'EN');
            if (boardBtn) boardBtn.title = (lang === 'cs' ? 'Přepnout jazyk (Čeština / English)' : 'Toggle language (English / Čeština)');

            // 1c. Tlačítko ve spodní mobilní liště (Mobile Dock)
            var dockLabel = document.getElementById('mobile-dock-lang-label');
            var dockBtn = document.getElementById('mobile-dock-lang-btn');
            if (dockLabel) dockLabel.textContent = (lang === 'cs' ? 'CZ' : 'EN');
            if (dockBtn) dockBtn.title = (lang === 'cs' ? 'Přepnout jazyk (Čeština / English)' : 'Toggle language (English / Čeština)');

            // 2. Tlačítka v nastavení
            var csBtn = document.getElementById('settings-lang-cs-btn');
            var enBtn = document.getElementById('settings-lang-en-btn');
            if (csBtn && enBtn) {
                if (lang === 'cs') {
                    csBtn.classList.add('active');
                    csBtn.style.borderColor = 'var(--gold)';
                    csBtn.style.background = 'rgba(212,175,55,0.25)';
                    enBtn.classList.remove('active');
                    enBtn.style.borderColor = 'rgba(255,255,255,0.2)';
                    enBtn.style.background = 'rgba(0,0,0,0.3)';
                } else {
                    enBtn.classList.add('active');
                    enBtn.style.borderColor = 'var(--gold)';
                    enBtn.style.background = 'rgba(212,175,55,0.25)';
                    csBtn.classList.remove('active');
                    csBtn.style.borderColor = 'rgba(255,255,255,0.2)';
                    csBtn.style.background = 'rgba(0,0,0,0.3)';
                }
            }

            // 7. Map Studio a Editor živá synchronizace při otevřeném modálu
            if (window.PRS_App && typeof window.PRS_App.refreshMapStudioSelectOptions === 'function') {
                try { window.PRS_App.refreshMapStudioSelectOptions(); } catch (e) { console.warn('[i18n] refreshMapStudioSelectOptions failed:', e); }
            }
            if (window.PRS_App && typeof window.PRS_App.renderMapStudioCounters === 'function' && document.getElementById('ms-counters-grid')) {
                try {
                    window.PRS_App.renderMapStudioCounters();
                    window.PRS_App.renderMapStudioAnimalLevels();
                    window.PRS_App.updateMapStudioPreview();
                } catch (e) { console.warn('[i18n] Map Studio UI sync failed:', e); }
            }
            if (window.PRS_MapEditor && typeof window.PRS_MapEditor.renderEditorUI === 'function') {
                var edView = document.getElementById('ms-editor-view');
                if (edView && edView.style.display !== 'none') {
                    try {
                        window.PRS_MapEditor.renderEditorUI();
                        window.PRS_MapEditor.updateStatusHelp();
                        window.PRS_MapEditor.updateInspectorUI();
                        window.PRS_MapEditor.renderCanvas();
                    } catch (e) { console.warn('[i18n] PRS_MapEditor UI sync failed:', e); }
                }
            }
        },

        /**
         * Registrace callbacku pro změnu jazyka
         */
        onLanguageChanged: function (callback) {
            if (typeof callback === 'function') {
                this._listeners.push(callback);
            }
        }
    };

    // Okamžitá iniciace objektu
    window.PRS_I18n = PRS_I18n;
    PRS_I18n.init();

})(window);
