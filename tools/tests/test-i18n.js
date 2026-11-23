#!/usr/bin/env node
/**
 * KiDesky Etapa 6 — Regression Suite: Multilingual i18n Integrity
 * Verifies:
 *  1. window.PRS_I18N_LANGUAGES manifest entries and referenced files exist
 *  2. 100% dictionary key parity, metadata & non-empty values across all registered languages
 *  3. 100% rules & glossary parity (guide >= 10 chapters, glossary >= 6 cards) + balanced HTML
 *  4. 100% resolution of all data-i18n* attributes in index.html across all languages
 *  5. Dynamic <select class="...prs-lang-select..."> controls (including #mobile-dock-lang-select)
 *  6. Ratchet guard on getLanguage() === occurrences in js/ (<= 56 baseline)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const MAX_HARDCODED_LANG_CHECKS = 56;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function flattenKeys(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenKeys(v, keyPath, out);
    } else {
      out.set(keyPath, v);
    }
  }
  return out;
}

function resolveKey(dict, keyPath) {
  let cur = dict;
  for (const part of keyPath.split('.')) {
    if (cur === null || cur === undefined || typeof cur !== 'object' || !(part in cur)) {
      return undefined;
    }
    cur = cur[part];
  }
  return cur;
}

function checkHtmlBalance(html, contextLabel) {
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const full = m[0];
    const tag = m[1].toLowerCase();
    if (voidTags.has(tag) || full.endsWith('/>')) continue;
    if (full.startsWith('</')) {
      assert(stack.length > 0, `${contextLabel}: Unexpected closing </${tag}>`);
      const top = stack.pop();
      assert(top === tag, `${contextLabel}: Mismatched closing </${tag}> (expected </${top}>)`);
    } else {
      stack.push(tag);
    }
  }
  assert(stack.length === 0, `${contextLabel}: Unclosed tags: ${stack.join(', ')}`);
}

function walkJsFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkJsFiles(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function main() {
  console.log('=== KiDesky Regression: i18n Multilingual Integrity ===');
  let pass = 0;
  let fail = 0;

  function runTest(label, fn) {
    try {
      const detail = fn();
      console.log(`[PASS] ${label}${detail ? ' — ' + detail : ''}`);
      pass++;
    } catch (err) {
      console.error(`[FAIL] ${label} — ${err.message}`);
      fail++;
    }
  }

  const langCtx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'i18n', 'languages.js'), 'utf8'), langCtx);
  const langs = langCtx.window.PRS_I18N_LANGUAGES || [];

  runTest('1. Language manifest entries & files exist', () => {
    assert(Array.isArray(langs) && langs.length >= 2, 'Expected >= 2 registered languages');
    for (const l of langs) {
      for (const field of ['code', 'name', 'flag', 'short', 'file', 'rulesFile']) {
        assert(typeof l[field] === 'string' && l[field].trim().length > 0, `Missing "${field}" in language manifest`);
      }
      assert(fs.existsSync(path.join(ROOT, l.file)), `Missing dictionary file: ${l.file}`);
      assert(fs.existsSync(path.join(ROOT, l.rulesFile)), `Missing rules file: ${l.rulesFile}`);
    }
    return `languages=[${langs.map(l => l.code).join(', ')}]`;
  });

  const dictWin = { window: { PRS_I18N: {} } };
  runTest('2. 100% dictionary key parity, metadata & non-empty values', () => {
    for (const l of langs) {
      vm.runInNewContext(fs.readFileSync(path.join(ROOT, l.file), 'utf8'), dictWin);
    }
    const baseCode = langs[0].code;
    const baseDict = dictWin.window.PRS_I18N[baseCode];
    const baseMap = flattenKeys(baseDict);

    for (const l of langs) {
      const d = dictWin.window.PRS_I18N[l.code];
      assert(d && d.meta, `Missing meta in ${l.code}`);
      for (const mf of ['code', 'name', 'flag', 'short']) {
        assert(typeof d.meta[mf] === 'string' && d.meta[mf].trim().length > 0, `Missing meta.${mf} in ${l.code}`);
      }
      assert(d.meta.code === l.code, `meta.code mismatch in ${l.code}: ${d.meta.code}`);

      const map = flattenKeys(d);
      const missing = [...baseMap.keys()].filter(k => !map.has(k));
      const extra = [...map.keys()].filter(k => !baseMap.has(k));
      assert(missing.length === 0, `${l.code} missing ${missing.length} keys vs ${baseCode}: ${missing.slice(0, 5).join(', ')}`);
      assert(extra.length === 0, `${l.code} has ${extra.length} extra keys vs ${baseCode}: ${extra.slice(0, 5).join(', ')}`);

      const empties = [...map.entries()].filter(([, v]) => typeof v === 'string' && v.trim() === '').map(([k]) => k);
      assert(empties.length === 0, `${l.code} has empty string keys: ${empties.slice(0, 5).join(', ')}`);
      for (const [k, v] of map.entries()) {
        assert(typeof v === typeof baseMap.get(k), `Type mismatch at ${l.code}.${k}`);
      }
    }
    return `${langs.length} languages, ${baseMap.size} keys matched 100%`;
  });

  runTest('3. Rules & Glossary parity + balanced HTML across all languages', () => {
    const rulesWin = { window: { PRS_I18N_RULES: {} } };
    for (const l of langs) {
      vm.runInNewContext(fs.readFileSync(path.join(ROOT, l.rulesFile), 'utf8'), rulesWin);
    }
    const baseCode = langs[0].code;
    const baseRules = rulesWin.window.PRS_I18N_RULES[baseCode];
    assert(baseRules && Array.isArray(baseRules.guide) && baseRules.guide.length >= 10, `Expected >= 10 chapters in ${baseCode}`);
    assert(Array.isArray(baseRules.glossary) && baseRules.glossary.length >= 6, `Expected >= 6 glossary cards in ${baseCode}`);
    const baseIds = baseRules.guide.map(c => c.id);

    for (const l of langs) {
      const r = rulesWin.window.PRS_I18N_RULES[l.code];
      assert(r && Array.isArray(r.guide) && r.guide.length === baseRules.guide.length, `Chapter count mismatch in ${l.code}`);
      assert(Array.isArray(r.glossary) && r.glossary.length === baseRules.glossary.length, `Glossary count mismatch in ${l.code}`);
      assert(JSON.stringify(r.guide.map(c => c.id)) === JSON.stringify(baseIds), `Chapter IDs mismatch in ${l.code}`);
      for (const ch of r.guide) {
        checkHtmlBalance(ch.body, `rules-${l.code}.guide[${ch.id}]`);
      }
    }
    return `${baseRules.guide.length} chapters + ${baseRules.glossary.length} glossary cards verified`;
  });

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  runTest('4. 100% of data-i18n* attributes in index.html resolve in all languages', () => {
    const re = /data-i18n(?:-(?:html|title|placeholder))?="([^"]+)"/g;
    const keys = new Set();
    let m;
    while ((m = re.exec(indexHtml)) !== null) {
      keys.add(m[1]);
    }
    assert(keys.size > 50, `Too few data-i18n* keys found: ${keys.size}`);
    for (const l of langs) {
      const d = dictWin.window.PRS_I18N[l.code];
      const missing = [...keys].filter(k => resolveKey(d, k) === undefined);
      assert(missing.length === 0, `${l.code} missing index.html keys: ${missing.slice(0, 8).join(', ')}`);
    }
    return `${keys.size} unique index.html data-i18n* keys resolved across all languages`;
  });

  runTest('5. Dynamic <select class="...prs-lang-select..."> elements exist in index.html', () => {
    const selects = indexHtml.match(/<select\b[^>]*class="[^"]*\bprs-lang-select\b[^"]*"[^>]*>/gi) || [];
    assert(selects.length >= 2, `Expected >= 2 .prs-lang-select elements, found ${selects.length}`);
    assert(/id="mobile-dock-lang-select"/.test(indexHtml), 'Missing #mobile-dock-lang-select in index.html');
    return `${selects.length} .prs-lang-select dropdowns verified`;
  });

  runTest(`6. Ratchet guard: getLanguage() === occurrences in js/ <= ${MAX_HARDCODED_LANG_CHECKS}`, () => {
    const jsFiles = walkJsFiles(path.join(ROOT, 'js'));
    let total = 0;
    const byFile = [];
    for (const f of jsFiles) {
      const txt = fs.readFileSync(f, 'utf8');
      const matches = txt.match(/getLanguage\(\)\s*===/g);
      if (matches && matches.length > 0) {
        total += matches.length;
        byFile.push(`${path.relative(ROOT, f).split(path.sep).join('/')}:${matches.length}`);
      }
    }
    assert(total <= MAX_HARDCODED_LANG_CHECKS, `getLanguage() === count grew from baseline ${MAX_HARDCODED_LANG_CHECKS} to ${total} (${byFile.join(', ')})`);
    return `count=${total}/${MAX_HARDCODED_LANG_CHECKS} (no regressions)`;
  });

  console.log(`\n=== Výsledek test-i18n: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exit(1);
}

main();
