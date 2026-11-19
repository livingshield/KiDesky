/**
 * KiDesky Central API Client (PRS_Api)
 * Handles authenticated requests to api.ashx, token persistence, timeouts, and 401 session expiry.
 */
(function (window) {
    'use strict';

    var TOKEN_KEY = 'prs_auth_token';
    var AUTH_EXEMPT_ACTIONS = {
        'login': true,
        'register': true,
        'google-login': true,
        'confirm-email': true,
        'logout': true
    };
    var _lastExpiryHandledAt = 0;

    function notifySessionExpired() {
        var now = Date.now();
        if (now - _lastExpiryHandledAt < 3000) return;
        _lastExpiryHandledAt = now;
        if (window.PRS_App && typeof window.PRS_App.handleSessionExpired === 'function') {
            try {
                window.PRS_App.handleSessionExpired();
            } catch (e) {
                console.warn('handleSessionExpired err:', e);
            }
        }
    }

    function parseJsonResponse(status, text) {
        if (!text || !text.trim()) {
            return {
                ok: status >= 200 && status < 300,
                status: (status >= 200 && status < 300) ? 'success' : 'error',
                message: (status >= 200 && status < 300) ? '' : ('HTTP ' + status),
                _httpStatus: status
            };
        }
        try {
            var parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') {
                parsed._httpStatus = status;
                return parsed;
            }
            return { ok: false, status: 'error', data: parsed, _httpStatus: status };
        } catch (err) {
            return {
                ok: false,
                status: 'error',
                message: 'Invalid server response (HTTP ' + status + ')',
                _httpStatus: status
            };
        }
    }

    var PRS_Api = {
        TOKEN_KEY: TOKEN_KEY,

        getAuthToken: function () {
            try {
                var stored = localStorage.getItem(TOKEN_KEY);
                if (stored && stored !== 'local') return stored;
            } catch (e) { }
            var u = window.PRS_App && window.PRS_App.currentUser;
            if (u && u.authToken && u.authToken !== 'local') {
                return u.authToken;
            }
            return null;
        },

        setAuthToken: function (token) {
            var clean = (typeof token === 'string') ? token.trim() : '';
            if (!clean || clean === 'local') {
                this.clearAuthToken();
                return;
            }
            try {
                localStorage.setItem(TOKEN_KEY, clean);
            } catch (e) { }
            if (window.PRS_App && window.PRS_App.currentUser && typeof window.PRS_App.currentUser === 'object') {
                window.PRS_App.currentUser.authToken = clean;
            }
        },

        clearAuthToken: function () {
            try {
                localStorage.removeItem(TOKEN_KEY);
            } catch (e) { }
            if (window.PRS_App && window.PRS_App.currentUser && typeof window.PRS_App.currentUser === 'object') {
                delete window.PRS_App.currentUser.authToken;
            }
        },

        buildUrl: function (action, params) {
            var url = 'api.ashx?action=' + encodeURIComponent(action || 'status');
            if (params && typeof params === 'object') {
                var keys = Object.keys(params);
                for (var i = 0; i < keys.length; i++) {
                    var k = keys[i];
                    var v = params[k];
                    if (v === undefined || v === null) continue;
                    url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(String(v));
                }
            }
            return url;
        },

        request: function (action, options) {
            var opts = options || {};
            var method = (opts.method || 'GET').toUpperCase();
            var url = this.buildUrl(action, opts.params);
            var headers = {};

            if (opts.headers && typeof opts.headers === 'object') {
                var hk = Object.keys(opts.headers);
                for (var i = 0; i < hk.length; i++) {
                    headers[hk[i]] = opts.headers[hk[i]];
                }
            }

            var token = this.getAuthToken();
            if (token && !headers['X-KiDesky-Auth']) {
                headers['X-KiDesky-Auth'] = token;
            }

            var fetchOpts = {
                method: method,
                headers: headers
            };

            if (opts.body !== undefined && opts.body !== null) {
                if (typeof FormData !== 'undefined' && opts.body instanceof FormData) {
                    fetchOpts.body = opts.body;
                } else if (typeof opts.body === 'string') {
                    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
                    fetchOpts.body = opts.body;
                } else {
                    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
                    fetchOpts.body = JSON.stringify(opts.body);
                }
            }

            var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            var timeoutMs = (typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0) ? opts.timeoutMs : 20000;
            var timerId = null;
            if (controller) {
                fetchOpts.signal = controller.signal;
                timerId = setTimeout(function () {
                    try { controller.abort(); } catch (e) { }
                }, timeoutMs);
            }

            var normAction = String(action || '').toLowerCase();
            var silentAuth = !!opts.silentAuth;

            return fetch(url, fetchOpts)
                .then(function (res) {
                    if (timerId) clearTimeout(timerId);
                    return res.text().then(function (txt) {
                        var data = parseJsonResponse(res.status, txt);
                        if (res.status === 401 && !silentAuth && !AUTH_EXEMPT_ACTIONS[normAction]) {
                            notifySessionExpired();
                        }
                        return data;
                    });
                })
                .catch(function (err) {
                    if (timerId) clearTimeout(timerId);
                    throw err;
                });
        },

        get: function (action, params, options) {
            var opts = options ? Object.assign({}, options) : {};
            opts.method = 'GET';
            if (params !== undefined) opts.params = params;
            return this.request(action, opts);
        },

        post: function (action, body, options) {
            var opts = options ? Object.assign({}, options) : {};
            opts.method = 'POST';
            if (body !== undefined) opts.body = body;
            return this.request(action, opts);
        },

        upload: function (action, formData, options) {
            var opts = options || {};
            var url = this.buildUrl(action, opts.params);
            var token = this.getAuthToken();
            var silentAuth = !!opts.silentAuth;
            var normAction = String(action || '').toLowerCase();

            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                if (token) {
                    xhr.setRequestHeader('X-KiDesky-Auth', token);
                }
                if (typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0) {
                    xhr.timeout = opts.timeoutMs;
                }

                if (typeof opts.onProgress === 'function') {
                    xhr.upload.onprogress = function (ev) {
                        var pct = ev.lengthComputable && ev.total > 0
                            ? Math.round((ev.loaded / ev.total) * 100)
                            : 0;
                        try {
                            opts.onProgress(pct, ev.loaded, ev.total, ev);
                        } catch (e) { }
                    };
                }

                xhr.onload = function () {
                    var data = parseJsonResponse(xhr.status, xhr.responseText);
                    if (xhr.status === 401 && !silentAuth && !AUTH_EXEMPT_ACTIONS[normAction]) {
                        notifySessionExpired();
                    }
                    resolve(data);
                };

                xhr.onerror = function () {
                    reject(new Error('Network error during upload'));
                };

                xhr.ontimeout = function () {
                    reject(new Error('Upload timed out'));
                };

                xhr.send(formData);
            });
        }
    };

    window.PRS_Api = PRS_Api;
})(window);
