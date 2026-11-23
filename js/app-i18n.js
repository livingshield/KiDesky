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
        _switchSeq: 0,
        _bootPromise: null,

        /**
         * Dynamicky zjistí všechny dostupné jazyky z manifestu window.PRS_I18N_LANGUAGES
         * i ze slovníků již načtených přímo ve window.PRS_I18N.
         * Umožňuje přidat nový jazyk zápisem do languages.js a vložením souboru do js/i18n/.
         */
        getAvailableLanguages: function () {
            var langs = [];
            var seen = {};
            var pushEntry = function (code, meta) {
                if (!code || seen[code]) return;
                seen[code] = true;
                meta = meta || {};
                var flag = meta.flag || '🌐';
                var name = meta.name || code.toUpperCase();
                langs.push({
                    code: code,
                    name: name,
                    flag: flag,
                    short: meta.short || code.toUpperCase(),
                    label: (flag ? flag + ' ' : '') + name
                });
            };

            if (window.PRS_I18N_LANGUAGES && Array.isArray(window.PRS_I18N_LANGUAGES)) {
                for (var i = 0; i < window.PRS_I18N_LANGUAGES.length; i++) {
                    var item = window.PRS_I18N_LANGUAGES[i];
                    if (item && item.code) {
                        var loadedMeta = (window.PRS_I18N && window.PRS_I18N[item.code] && window.PRS_I18N[item.code].meta) || null;
                        pushEntry(item.code, loadedMeta || item);
                    }
                }
            }

            if (window.PRS_I18N && typeof window.PRS_I18N === 'object') {
                for (var code in window.PRS_I18N) {
                    if (Object.prototype.hasOwnProperty.call(window.PRS_I18N, code)) {
                        var dictObj = window.PRS_I18N[code];
                        if (dictObj && typeof dictObj === 'object') {
                            pushEntry(code, dictObj.meta || {});
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
         * Zajistí asynchronní načtení požadovaného jazykového slovníku
         */
        ensureLanguageLoaded: function (lang) {
            var code = lang || this._lang || DEFAULT_LANG;
            if (window.PRS_I18N && window.PRS_I18N[code]) {
                return Promise.resolve(code);
            }
            if (window.PRS_ModuleLoader && typeof window.PRS_ModuleLoader.ensureLanguage === 'function') {
                return window.PRS_ModuleLoader.ensureLanguage(code);
            }
            return Promise.resolve(code);
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

            var self = this;
            var isSyncDict = !!(window.PRS_I18N && window.PRS_I18N[this._lang]);
            this._bootPromise = isSyncDict
                ? Promise.resolve(this._lang)
                : this.ensureLanguageLoaded(this._lang).catch(function (err) {
                    console.warn('[PRS_I18n] Initial language load failed for ' + self._lang + ':', err);
                    return self._lang;
                });

            var runDomTranslation = function () {
                self.translateDOM();
                self.syncUi();
            };

            if (isSyncDict) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', runDomTranslation);
                } else {
                    runDomTranslation();
                }
            } else {
                this._bootPromise.then(function () {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', runDomTranslation);
                    } else {
                        runDomTranslation();
                    }
                });
            }
        },

        /**
         * Vrátí aktuálně nastavený jazyk ('cs' | 'en' | ...)
         */
        getLanguage: function () {
            return this._lang || DEFAULT_LANG;
        },

        /**
         * Interní aplikace již načteného jazyka do DOM a posluchačů
         */
        _applyLanguage: function (lang) {
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
         * Nastaví nový jazyk hry (při prvním zvolení stáhne slovník dynamicky) a aktualizuje UI
         */
        setLanguage: function (lang) {
            if (!this.isSupportedLanguage(lang)) {
                console.warn('[PRS_I18n] Nepodporovaný jazyk:', lang);
                return Promise.resolve(this._lang);
            }

            var dictReady = !!(window.PRS_I18N && window.PRS_I18N[lang]);
            var rulesNeeded = !!(window.PRS_App && window.PRS_App._rulesBundleLoaded);
            var rulesReady = !rulesNeeded || !!(window.PRS_I18N_RULES && window.PRS_I18N_RULES[lang]);

            if (dictReady && rulesReady) {
                this._switchSeq++;
                this._applyLanguage(lang);
                return Promise.resolve(lang);
            }

            var self = this;
            var seq = ++this._switchSeq;
            var tasks = [this.ensureLanguageLoaded(lang)];
            if (rulesNeeded && !rulesReady && window.PRS_ModuleLoader && typeof window.PRS_ModuleLoader.ensureRulesLanguage === 'function') {
                tasks.push(window.PRS_ModuleLoader.ensureRulesLanguage(lang));
            }

            return Promise.all(tasks).then(function () {
                if (self._switchSeq !== seq) return self._lang;
                self._applyLanguage(lang);
                return lang;
            }).catch(function (err) {
                console.warn('[PRS_I18n] Failed to lazy-load language "' + lang + '":', err);
                if (self._switchSeq === seq) {
                    self.syncUi();
                    if (window.KiDeskyToast && typeof window.KiDeskyToast.show === 'function') {
                        window.KiDeskyToast.show(self.t('ui.loading_module_error', null, '⚠️ Nepodařilo se načíst modul.'), 'warning');
                    }
                }
                return self._lang;
            });
        },

        /**
         * Přepne na další dostupný jazyk ze registrovaných slovníků
         */
        toggleLanguage: function () {
            var avail = this.getAvailableLanguages();
            var nextLang = 'en';
            if (avail.length > 0) {
                var idx = -1;
                for (var i = 0; i < avail.length; i++) {
                    if (avail[i].code === this._lang) { idx = i; break; }
                }
                nextLang = avail[(idx + 1) % avail.length].code;
            }
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
         * Získá BCP 47 kód lokalizace pro aktivní jazyk
         */
        getLocale: function () {
            var locMap = { 'cs': 'cs-CZ', 'sk': 'sk-SK', 'pl': 'pl-PL', 'en': 'en-US' };
            return locMap[this._lang] || 'cs-CZ';
        },

        /**
         * Zformátuje číslo podle aktivního jazyka (oddělovače tisíců)
         * @param {number} num
         */
        formatNumber: function (num) {
            if (typeof num !== 'number' || isNaN(num)) return num;
            return num.toLocaleString(this.getLocale());
        },

        /**
         * Zformátuje datum podle aktivního jazyka
         * @param {Date|string|number} date
         */
        formatDate: function (date) {
            var d = date ? (date instanceof Date ? date : new Date(date)) : new Date();
            return d.toLocaleDateString(this.getLocale());
        },

        /**
         * Zformátuje částku ve zlatých s jednotkou podle aktivního jazyka
         * @param {number} amount
         */
        formatGold: function (amount) {
            var curr = this.t('common.gold_symbol', null, (this._lang === 'en' ? 'g.' : (this._lang === 'pl' ? 'zł.' : 'zl.')));
            return this.formatNumber(amount) + ' ' + curr;
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
         * @param {Object} forms - pro CS/SK/PL: {one, few, many}, pro EN: {one, other}
         */
        plural: function (count, forms) {
            if (!forms) return '';
            var num = Math.abs(Number(count) || 0);

            if (this._lang === 'cs' || this._lang === 'sk') {
                if (num === 1) return forms.one || forms.other || '';
                if (num >= 2 && num <= 4) return forms.few || forms.other || forms.many || '';
                return forms.many || forms.other || '';
            } else if (this._lang === 'pl') {
                if (num === 1) return forms.one || forms.other || '';
                var mod10 = num % 10;
                var mod100 = num % 100;
                if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
                    return forms.few || forms.other || forms.many || '';
                }
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

            // 5. Titulek dokumentu
            if (el === document && document.title !== undefined) {
                var pageTitle = this.t('app.page_title', null, '');
                if (pageTitle && pageTitle !== 'app.page_title') {
                    document.title = pageTitle;
                }
            }
        },

        /**
         * Synchronizuje vizuální stav přepínačů jazyka v rozhraní
         */
        syncUi: function () {
            var lang = this._lang;

            // 0. Dynamické naplnění a synchronizace všech dropdown výběrů jazyka (.prs-lang-select)
            var selects = document.querySelectorAll('.prs-lang-select, #global-lang-select, #settings-lang-select, #mobile-dock-lang-select');
            var avail = this.getAvailableLanguages();
            for (var s = 0; s < selects.length; s++) {
                var sel = selects[s];
                if (!sel || sel.tagName !== 'SELECT') continue;
                var isCompact = (sel.id === 'mobile-dock-lang-select' || sel.id === 'global-lang-select');
                var needsRebuild = (sel.options.length !== avail.length);
                if (!needsRebuild) {
                    for (var o = 0; o < avail.length; o++) {
                        var expectedTxt = isCompact
                            ? ((avail[o].flag ? avail[o].flag + ' ' : '') + avail[o].short)
                            : avail[o].label;
                        if (sel.options[o].value !== avail[o].code || sel.options[o].textContent !== expectedTxt) {
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
                        opt.textContent = isCompact
                            ? ((avail[a].flag ? avail[a].flag + ' ' : '') + avail[a].short)
                            : avail[a].label;
                        sel.appendChild(opt);
                    }
                }
                sel.value = lang;
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

    // Bezpečnostní síť proti ReferenceError pro starší kontexty a legacy proměnné
    var legacyFlags = ['isEn', 'isEnAction', 'isHudEn', 'isEnBotTurn', 'isEnSeats', 'isEnDip', 'isEnEndless', 'isEnAdv', 'isEnInsp', 'isEnEnc', 'isEnGameOver'];
    legacyFlags.forEach(function (flag) {
        try {
            if (!(flag in window)) {
                Object.defineProperty(window, flag, {
                    get: function () {
                        return window.PRS_I18n ? window.PRS_I18n._lang === 'en' : false;
                    },
                    set: function () {},
                    configurable: true
                });
            }
        } catch (e) {
            window[flag] = false;
        }
    });

})(window);
