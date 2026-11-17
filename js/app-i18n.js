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
    var SUPPORTED_LANGS = ['cs', 'en'];

    var PRS_I18n = {
        _lang: DEFAULT_LANG,
        _listeners: [],
        _initialized: false,

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

            if (savedLang && SUPPORTED_LANGS.indexOf(savedLang) !== -1) {
                this._lang = savedLang;
            } else {
                // Autodetekce z jazyka prohlížeče
                var navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
                if (navLang.indexOf('en') === 0) {
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
         * Vrátí aktuálně nastavený jazyk ('cs' | 'en')
         */
        getLanguage: function () {
            return this._lang || DEFAULT_LANG;
        },

        /**
         * Nastaví nový jazyk hry a aktualizuje UI
         */
        setLanguage: function (lang) {
            if (SUPPORTED_LANGS.indexOf(lang) === -1) {
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
            } catch (evErr) {}

            // Pokud existuje HUD, překreslíme ho
            if (window.PRS_HUD && typeof window.PRS_HUD.render === 'function') {
                try {
                    window.PRS_HUD.render();
                } catch (e) {}
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

            // 1. Tlačítko v horní liště
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
