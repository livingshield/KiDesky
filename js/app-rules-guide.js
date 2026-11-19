/**
 * KiDesky: Princeznino srdce
 * Renderer Herního průvodce a Slovníčku pojmů.
 * Obsah kapitol a karet slovníčku je uložen v js/i18n/rules-<lang>.js (window.PRS_I18N_RULES).
 */
(function (window) {
    'use strict';

    function getRulesBundle(lang) {
        var rulesMap = window.PRS_I18N_RULES || {};
        var targetLang = lang || (window.PRS_I18n && window.PRS_I18n.getLanguage()) || 'cs';
        return rulesMap[targetLang] || rulesMap.cs || { guide: [], glossary: [] };
    }

    function syncCompatGlobals() {
        var rulesMap = window.PRS_I18N_RULES || {};
        if (!window.PRS_RULES_GUIDE_DATA) window.PRS_RULES_GUIDE_DATA = {};
        if (!window.PRS_GLOSSARY_DATA) window.PRS_GLOSSARY_DATA = {};
        for (var code in rulesMap) {
            if (Object.prototype.hasOwnProperty.call(rulesMap, code) && rulesMap[code]) {
                window.PRS_RULES_GUIDE_DATA[code] = rulesMap[code].guide || [];
                window.PRS_GLOSSARY_DATA[code] = rulesMap[code].glossary || [];
            }
        }
    }

    function attachGuideMethods() {
        syncCompatGlobals();
        window.PRS_App = window.PRS_App || {};

        window.PRS_App.renderRuleGuide = function () {
            var container = document.getElementById('rules-guide-accordion-container');
            if (!container) return;

            var bundle = getRulesBundle();
            var chapters = bundle.guide || [];
            if (!chapters.length) return;

            var openIds = {};
            var existingAccs = container.querySelectorAll('.rule-accordion');
            existingAccs.forEach(function (acc) {
                if (acc.classList.contains('open')) {
                    openIds[acc.id] = true;
                }
            });
            if (Object.keys(openIds).length === 0) {
                openIds['rule-acc-board'] = true;
            }

            var html = '';
            for (var i = 0; i < chapters.length; i++) {
                var ch = chapters[i];
                var isOpen = !!openIds[ch.id];
                var accClass = 'rule-accordion' + (isOpen ? ' open' : '');
                var shortId = String(ch.id || '').replace('rule-acc-', '');

                html += '<div class="' + accClass + '" id="' + ch.id + '">' +
                    '  <div class="rule-acc-header" onclick="PRS_App.toggleRuleAccordion(\'' + shortId + '\')">' +
                    '    <h3>' + ch.title + '</h3>' +
                    '    <span class="rule-acc-icon-arrow">' + (isOpen ? '▲' : '▼') + '</span>' +
                    '  </div>' +
                    '  <div class="rule-acc-body">' + ch.body + '</div>' +
                    '</div>';
            }

            container.innerHTML = html;

            if (typeof window.PRS_App.updateFestivalCalculator === 'function') {
                window.PRS_App.updateFestivalCalculator();
            }
        };

        window.PRS_App.renderGlossary = function () {
            var container = document.getElementById('glossary-cards-container');
            if (!container) return;

            var bundle = getRulesBundle();
            var cards = bundle.glossary || [];
            if (!cards.length) return;

            var html = '';
            for (var i = 0; i < cards.length; i++) {
                html += cards[i].content;
            }

            container.innerHTML = html;

            var searchInput = document.getElementById('glossary-search-input');
            if (searchInput && searchInput.value && typeof window.PRS_App.filterGlossaryTerms === 'function') {
                window.PRS_App.filterGlossaryTerms(searchInput.value);
            }
        };

        var guideContainer = document.getElementById('rules-guide-accordion-container');
        if (guideContainer && guideContainer.children && guideContainer.children.length === 0) {
            window.PRS_App.renderRuleGuide();
        }
    }

    attachGuideMethods();

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachGuideMethods);
        }
    }
})(window);
