/**
 * KiDesky: Princeznino srdce
 * Centrální dynamický loader volitelných modulů a jazykových slovníků (Etapa 4A).
 * Zajišťuje deduplikaci paralelních požadavků, zachování cache-busting ?v= parametru
 * a spolehlivou možnost opakování při výpadku sítě.
 */
(function (window, document) {
    'use strict';

    var _cache = {};
    var _loaded = {};

    function findAssetVersion() {
        if (!document || !document.querySelectorAll) return '';
        var scripts = document.querySelectorAll('script[src]');
        var i, src, m;
        for (i = 0; i < scripts.length; i++) {
            src = scripts[i].getAttribute('src') || '';
            if (src.indexOf('module-loader.js') !== -1) {
                m = src.match(/[?&]v=([^&#]+)/);
                if (m) return m[1];
            }
        }
        for (i = 0; i < scripts.length; i++) {
            src = scripts[i].getAttribute('src') || '';
            if (src.indexOf('js/') !== -1) {
                m = src.match(/[?&]v=([^&#]+)/);
                if (m) return m[1];
            }
        }
        return '';
    }

    var PRS_ModuleLoader = {
        getAssetVersion: function () {
            return findAssetVersion();
        },

        resolveUrl: function (relPath) {
            if (!relPath) return '';
            if (/[?&]v=/.test(relPath)) return relPath;
            var ver = this.getAssetVersion();
            if (!ver) return relPath;
            return relPath + (relPath.indexOf('?') === -1 ? '?v=' : '&v=') + ver;
        },

        isLoaded: function (relPath) {
            return !!_loaded[relPath];
        },

        loadScript: function (relPath) {
            if (!relPath) {
                return Promise.reject(new Error('PRS_ModuleLoader.loadScript: empty path'));
            }
            if (_loaded[relPath]) {
                return Promise.resolve(relPath);
            }
            if (_cache[relPath]) {
                return _cache[relPath];
            }

            if (!document || !document.createElement) {
                return Promise.reject(new Error('PRS_ModuleLoader.loadScript: document unavailable'));
            }

            var resolvedUrl = this.resolveUrl(relPath);
            var existing = document.querySelectorAll('script[src]');
            for (var i = 0; i < existing.length; i++) {
                var sSrc = existing[i].getAttribute('src') || '';
                if (sSrc === resolvedUrl || sSrc === relPath || sSrc.split('?')[0] === relPath.split('?')[0]) {
                    if (existing[i].getAttribute('data-loaded') === 'true') {
                        _loaded[relPath] = true;
                        return Promise.resolve(relPath);
                    }
                }
            }

            var promise = new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = resolvedUrl;
                script.async = false;
                script.onload = function () {
                    script.setAttribute('data-loaded', 'true');
                    _loaded[relPath] = true;
                    resolve(relPath);
                };
                script.onerror = function () {
                    delete _cache[relPath];
                    if (script.parentNode) {
                        try { script.parentNode.removeChild(script); } catch (e) { /* ignore */ }
                    }
                    reject(new Error('Failed to load script: ' + resolvedUrl));
                };
                var target = document.head || document.body || document.documentElement;
                target.appendChild(script);
            });

            _cache[relPath] = promise;
            return promise;
        },

        getLanguageMeta: function (lang) {
            var code = lang || 'cs';
            var list = (window.PRS_I18N_LANGUAGES && Array.isArray(window.PRS_I18N_LANGUAGES))
                ? window.PRS_I18N_LANGUAGES
                : [];
            for (var i = 0; i < list.length; i++) {
                if (list[i] && list[i].code === code) {
                    return list[i];
                }
            }
            return {
                code: code,
                name: code.toUpperCase(),
                flag: '🌐',
                short: code.toUpperCase(),
                file: 'js/i18n/' + code + '.js',
                rulesFile: 'js/i18n/rules-' + code + '.js'
            };
        },

        ensureLanguage: function (lang) {
            var code = lang || 'cs';
            if (window.PRS_I18N && window.PRS_I18N[code]) {
                return Promise.resolve(code);
            }
            var meta = this.getLanguageMeta(code);
            return this.loadScript(meta.file).then(function () {
                return code;
            });
        },

        ensureRulesLanguage: function (lang) {
            var code = lang || (window.PRS_I18n && window.PRS_I18n.getLanguage()) || 'cs';
            if (window.PRS_I18N_RULES && window.PRS_I18N_RULES[code]) {
                return Promise.resolve(code);
            }
            var meta = this.getLanguageMeta(code);
            return this.loadScript(meta.rulesFile).then(function () {
                return code;
            });
        },

        ensureRulesBundle: function (lang) {
            var self = this;
            var code = lang || (window.PRS_I18n && window.PRS_I18n.getLanguage()) || 'cs';
            return Promise.all([
                this.loadScript('js/app-catalog.js'),
                this.ensureRulesLanguage(code)
            ]).then(function () {
                return self.loadScript('js/app-rules-guide.js');
            });
        },

        ensureAdminBundle: function () {
            if (window.PRS_App && window.PRS_App._adminModuleLoaded) {
                return Promise.resolve(true);
            }
            return this.loadScript('js/app-admin.js').then(function () {
                return true;
            });
        },

        ensureMapEditor: function () {
            if (window.PRS_MapEditor) {
                return Promise.resolve(window.PRS_MapEditor);
            }
            return this.loadScript('js/app-map-editor.js').then(function () {
                return window.PRS_MapEditor;
            });
        },

        normalizeAssetUrl: normalizeAssetUrl,
        isFlippedAssetUrl: isFlippedAssetUrl
    };

    function normalizeAssetUrl(url) {
        if (!url || typeof url !== 'string') return url || '';
        var m = url.match(/^(?:\.\/)?assets\/(backgrounds|castles|decorations|dragons|env|landmarks|monsters|pawns|tiles)\/([^?#]+?)(?:_flip)?\.(?:png|jpe?g|webp)(\?[^#]*)?(#.*)?$/i);
        if (m) {
            return 'assets/' + m[1] + '/' + m[2] + '.webp' + (m[3] || '') + (m[4] || '');
        }
        var mb = url.match(/^(?:\.\/)?assets\/board\/parchment_board_bg\.(?:png|jpe?g)(\?[^#]*)?(#.*)?$/i);
        if (mb) {
            return 'assets/board/parchment_board_bg.webp' + (mb[1] || '') + (mb[2] || '');
        }
        return url;
    }

    function isFlippedAssetUrl(url) {
        return typeof url === 'string' && /_flip\.(?:png|jpe?g|webp)(?:[?#]|$)/i.test(url);
    }

    PRS_ModuleLoader.normalizeAssetUrl = normalizeAssetUrl;
    PRS_ModuleLoader.isFlippedAssetUrl = isFlippedAssetUrl;
    window.PRS_normalizeAssetUrl = normalizeAssetUrl;
    window.PRS_isFlippedAssetUrl = isFlippedAssetUrl;
    window.PRS_ModuleLoader = PRS_ModuleLoader;
})(window, typeof document !== 'undefined' ? document : null);
