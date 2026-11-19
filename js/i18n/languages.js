/**
 * KiDesky: Princeznino srdce
 * Manifest dostupných jazykových balíčků pro dynamické lazy-loading načítání.
 * Nový jazyk stačí přidat sem a vložit odpovídající soubory do js/i18n/.
 */
(function (window) {
    'use strict';

    window.PRS_I18N_LANGUAGES = [
        {
            code: 'cs',
            name: 'Čeština',
            flag: '🇨🇿',
            short: 'CZ',
            file: 'js/i18n/cs.js',
            rulesFile: 'js/i18n/rules-cs.js'
        },
        {
            code: 'en',
            name: 'English',
            flag: '🇬🇧',
            short: 'EN',
            file: 'js/i18n/en.js',
            rulesFile: 'js/i18n/rules-en.js'
        }
    ];
})(window);
