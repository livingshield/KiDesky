#!/usr/bin/env node
/**
 * KiDesky Etapa 3 Verification Suite (Local + --live modes)
 * Tests:
 *  - Rules externalization (rules-cs.js & rules-en.js chapter/glossary parity, balanced HTML, #calc-fest-type, .glossary-term-item)
 *  - index.html modal ARIA attributes (30/30), duplicate control removal, #mobile-dock-lang-select, 0 missing data-i18n* keys
 *  - Non-print CSS !important reduction (< 130)
 *  - PRS_ModalManager mock-DOM unit tests (LIFO Escape, Focus Trap, focus restore, KiDeskyDialog priority)
 *  - Optional --live verification against https://www.ekobio.org/apps/KiDesky/
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let live = false;
  let baseUrl = 'https://www.ekobio.org/apps/KiDesky/';
  for (const arg of argv) {
    if (arg === '--live') live = true;
    else if (arg.startsWith('--base-url=')) baseUrl = arg.slice('--base-url='.length);
  }
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  return { live, baseUrl };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkHtmlBalance(html, contextLabel) {
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const full = m[0];
    const tag = m[1].toLowerCase();
    if (voidTags.has(tag) || full.endsWith('/>')) continue;
    const isClose = full.startsWith('</');
    if (isClose) {
      if (stack.length === 0) {
        throw new Error(`${contextLabel}: Unexpected closing </${tag}>`);
      }
      const top = stack.pop();
      if (top !== tag) {
        throw new Error(`${contextLabel}: Mismatched closing </${tag}> (expected </${top}>)`);
      }
    } else {
      stack.push(tag);
    }
  }
  if (stack.length > 0) {
    throw new Error(`${contextLabel}: Unclosed tags: ${stack.join(', ')}`);
  }
}

function stripPrintMediaBlocks(cssText) {
  let out = '';
  let i = 0;
  while (i < cssText.length) {
    const idx = cssText.indexOf('@media', i);
    if (idx === -1) {
      out += cssText.slice(i);
      break;
    }
    const braceStart = cssText.indexOf('{', idx);
    if (braceStart === -1) {
      out += cssText.slice(i);
      break;
    }
    const header = cssText.slice(idx, braceStart);
    if (/\bprint\b/i.test(header)) {
      out += cssText.slice(i, idx);
      let depth = 1;
      let j = braceStart + 1;
      while (j < cssText.length && depth > 0) {
        if (cssText[j] === '{') depth++;
        else if (cssText[j] === '}') depth--;
        j++;
      }
      i = j;
    } else {
      out += cssText.slice(i, braceStart + 1);
      i = braceStart + 1;
    }
  }
  return out;
}

function resolveKey(dict, keyPath) {
  const parts = keyPath.split('.');
  let cur = dict;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object' || !(part in cur)) {
      return undefined;
    }
    cur = cur[part];
  }
  return cur;
}

function createMockElement(tagName, id, classes, ownerDoc) {
  const el = {
    tagName: tagName.toUpperCase(),
    id: id || '',
    className: (classes || []).join(' '),
    style: { display: '', zIndex: '' },
    attributes: {},
    children: [],
    parentNode: null,
    disabled: false,
    _doc: ownerDoc,
    classList: {
      add() {
        const set = new Set(el.className.split(/\s+/).filter(Boolean));
        for (const c of arguments) set.add(c);
        el.className = Array.from(set).join(' ');
      },
      remove() {
        const set = new Set(el.className.split(/\s+/).filter(Boolean));
        for (const c of arguments) set.delete(c);
        el.className = Array.from(set).join(' ');
      },
      contains(c) {
        return el.className.split(/\s+/).filter(Boolean).includes(c);
      }
    },
    appendChild(child) {
      child.parentNode = el;
      el.children.push(child);
      return child;
    },
    removeChild(child) {
      const idx = el.children.indexOf(child);
      if (idx !== -1) el.children.splice(idx, 1);
      child.parentNode = null;
      return child;
    },
    get isConnected() {
      let cur = el;
      while (cur) {
        if (cur === ownerDoc.body || cur === ownerDoc.documentElement) return true;
        cur = cur.parentNode;
      }
      return false;
    },
    contains(other) {
      let cur = other;
      while (cur) {
        if (cur === el) return true;
        cur = cur.parentNode;
      }
      return false;
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(el.attributes, name) ? el.attributes[name] : null;
    },
    setAttribute(name, val) {
      el.attributes[name] = String(val);
    },
    hasAttribute(name) {
      return Object.prototype.hasOwnProperty.call(el.attributes, name);
    },
    focus() {
      ownerDoc.activeElement = el;
    },
    matchesSimple(sel) {
      const s = sel.trim();
      if (s === 'a[href]') return el.tagName === 'A';
      if (s.startsWith('button')) return el.tagName === 'BUTTON' && !el.disabled;
      if (s.startsWith('input')) return el.tagName === 'INPUT' && !el.disabled;
      if (s.startsWith('select')) return el.tagName === 'SELECT' && !el.disabled;
      if (s.startsWith('textarea')) return el.tagName === 'TEXTAREA' && !el.disabled;
      if (s.startsWith('[tabindex]')) return el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
      if (s === '.modal-backdrop') return el.classList.contains('modal-backdrop');
      if (['h1', 'h2', 'h3'].includes(s)) return el.tagName === s.toUpperCase();
      return false;
    },
    querySelector(selector) {
      const parts = selector.split(',').map(x => x.trim()).filter(Boolean);
      for (const ch of el.children) {
        for (const part of parts) {
          if (ch.matchesSimple(part)) return ch;
        }
        const deep = ch.querySelector(selector);
        if (deep) return deep;
      }
      return null;
    },
    querySelectorAll(selector) {
      const parts = selector.split(',').map(x => x.trim()).filter(Boolean);
      const out = [];
      for (const ch of el.children) {
        for (const part of parts) {
          if (ch.matchesSimple(part)) {
            out.push(ch);
            break;
          }
        }
        out.push(...ch.querySelectorAll(selector));
      }
      return out;
    }
  };
  return el;
}

function runModalManagerUnitTests() {
  const doc = {
    readyState: 'complete',
    activeElement: null,
    documentElement: null,
    body: null,
    getElementById(id) {
      const walk = (node) => {
        if (node.id === id) return node;
        for (const c of node.children) {
          const found = walk(c);
          if (found) return found;
        }
        return null;
      };
      return walk(doc.body);
    },
    querySelectorAll(sel) {
      return doc.body.querySelectorAll(sel);
    },
    contains(node) {
      return doc.body.contains(node);
    },
    addEventListener() {}
  };

  doc.documentElement = createMockElement('html', '', [], doc);
  doc.body = createMockElement('body', '', [], doc);
  doc.documentElement.appendChild(doc.body);

  const triggerBtn = createMockElement('button', 'open-armory-btn', [], doc);
  doc.body.appendChild(triggerBtn);

  const modalA = createMockElement('div', 'armory-modal', ['modal-backdrop'], doc);
  modalA.style.display = 'none';
  const headingA = createMockElement('h2', '', [], doc);
  const btnA1 = createMockElement('button', 'a-btn-1', [], doc);
  const btnA2 = createMockElement('button', 'a-btn-2', [], doc);
  modalA.appendChild(headingA);
  modalA.appendChild(btnA1);
  modalA.appendChild(btnA2);
  doc.body.appendChild(modalA);

  const modalB = createMockElement('div', 'graphics-modal', ['modal-backdrop'], doc);
  modalB.style.display = 'none';
  const headingB = createMockElement('h3', '', [], doc);
  const btnB1 = createMockElement('button', 'b-btn-1', [], doc);
  const btnB2 = createMockElement('button', 'b-btn-2', [], doc);
  modalB.appendChild(headingB);
  modalB.appendChild(btnB1);
  modalB.appendChild(btnB2);
  doc.body.appendChild(modalB);

  const listeners = {};
  const winCtx = {
    document: doc,
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    requestAnimationFrame(cb) { cb(); },
    PRS_App: {
      closeArmoryModal() { modalA.style.display = 'none'; },
      closeGraphicsModal() { modalB.style.display = 'none'; }
    },
    console
  };
  winCtx.window = winCtx;

  const mmSrc = fs.readFileSync(path.join(ROOT, 'js', 'app-modal-manager.js'), 'utf8');
  vm.runInNewContext(mmSrc, winCtx);

  const mm = winCtx.PRS_ModalManager;
  assert(mm, 'window.PRS_ModalManager missing');
  assert(listeners.keydown && listeners.keydown.length === 1, 'keydown capture listener not registered');

  // Initial state: triggerBtn has focus
  triggerBtn.focus();
  assert(mm.isAnyOpen() === false, 'Expected no modal open initially');
  assert(modalA.getAttribute('role') === 'dialog', 'modalA role="dialog" missing');
  assert(modalA.getAttribute('aria-modal') === 'true', 'modalA aria-modal="true" missing');
  assert(Boolean(modalA.getAttribute('aria-labelledby')), 'modalA aria-labelledby missing');

  // Open Modal A -> focus moves inside Modal A, body.modal-open added
  modalA.style.display = 'flex';
  mm.syncAll();
  assert(mm.isAnyOpen() === true, 'Modal A should be open');
  assert(mm.getTopModal() === modalA, 'Top modal should be armory-modal');
  assert(doc.body.classList.contains('modal-open'), 'body.modal-open missing');
  assert(doc.activeElement === btnA1, 'Focus did not move into Modal A');

  // Stack Modal B -> getTopModal() === modalB
  modalB.style.display = 'flex';
  mm.syncAll();
  assert(mm.getStack().join(',') === 'armory-modal,graphics-modal', 'Unexpected stack order: ' + mm.getStack().join(','));
  assert(mm.getTopModal() === modalB, 'Top modal should be graphics-modal');
  assert(doc.activeElement === btnB1, 'Focus did not move into Modal B');

  // Focus trap Tab / Shift+Tab inside Modal B
  btnB2.focus();
  let tabEvt = { key: 'Tab', code: 'Tab', shiftKey: false, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  listeners.keydown[0](tabEvt);
  assert(tabEvt.prevented && doc.activeElement === btnB1, 'Tab wrap from last to first failed');

  let shiftTabEvt = { key: 'Tab', code: 'Tab', shiftKey: true, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  listeners.keydown[0](shiftTabEvt);
  assert(shiftTabEvt.prevented && doc.activeElement === btnB2, 'Shift+Tab wrap from first to last failed');

  // KiDeskyDialog priority: #kd-dialog-root suppresses ModalManager Escape
  const kdRoot = createMockElement('div', 'kd-dialog-root', [], doc);
  doc.body.appendChild(kdRoot);
  const escBlocked = { key: 'Escape', code: 'Escape', prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  listeners.keydown[0](escBlocked);
  assert(!escBlocked.prevented && mm.getTopModal() === modalB, 'ModalManager must yield to #kd-dialog-root');
  doc.body.removeChild(kdRoot);

  // First Escape closes only top modal (B)
  const esc1 = { key: 'Escape', code: 'Escape', prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  listeners.keydown[0](esc1);
  assert(esc1.prevented && modalB.style.display === 'none', 'First Escape did not close Modal B');
  assert(mm.getTopModal() === modalA && modalA.style.display === 'flex', 'Modal A should stay open as new top');

  // Second Escape closes Modal A and restores focus to triggerBtn
  const esc2 = { key: 'Escape', code: 'Escape', prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
  listeners.keydown[0](esc2);
  assert(esc2.prevented && mm.isAnyOpen() === false, 'Second Escape did not close Modal A');
  assert(!doc.body.classList.contains('modal-open'), 'body.modal-open not removed');
  assert(doc.activeElement === triggerBtn, 'Focus was not restored to opener button');
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const { live, baseUrl } = parseArgs(process.argv.slice(2));
  console.log(`=== KiDesky Etapa 3 Verification (${live ? 'LOCAL + LIVE: ' + baseUrl : 'LOCAL'}) ===`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      const detail = await fn();
      console.log(`[PASS] ${name}${detail ? ' — ' + detail : ''}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name} — ${err.message}`);
      failed++;
    }
  }

  // 1. Rules & Glossary externalization check
  await test('1. Rules externalization (rules-cs.js & rules-en.js parity + HTML balance)', async () => {
    const ctx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'i18n', 'rules-cs.js'), 'utf8'), ctx);
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'i18n', 'rules-en.js'), 'utf8'), ctx);
    const rules = ctx.window.PRS_I18N_RULES;
    assert(rules && rules.cs && rules.en, 'Missing cs/en bundles on window.PRS_I18N_RULES');
    assert(rules.cs.guide.length === 10 && rules.en.guide.length === 10, `Expected 10 chapters in CS/EN, got ${rules.cs.guide.length}/${rules.en.guide.length}`);
    assert(rules.cs.glossary.length === 6 && rules.en.glossary.length === 6, `Expected 6 glossary cards in CS/EN, got ${rules.cs.glossary.length}/${rules.en.glossary.length}`);

    for (const lang of ['cs', 'en']) {
      for (const ch of rules[lang].guide) {
        checkHtmlBalance(ch.body, `rules-${lang}.guide[${ch.id}]`);
      }
      for (const gl of rules[lang].glossary) {
        checkHtmlBalance(gl.content, `rules-${lang}.glossary[${gl.title}]`);
        assert(gl.content.includes('glossary-term-item'), `rules-${lang}.glossary[${gl.title}] missing .glossary-term-item`);
      }
      const allGuideHtml = rules[lang].guide.map(c => c.body).join('\n');
      assert(allGuideHtml.includes('id="calc-fest-type"'), `rules-${lang} missing #calc-fest-type Festival Calculator`);
    }
    return '10 chapters + 6 glossary cards in CS & EN, 0 HTML tag errors, calculator & search classes intact';
  });

  // 2. index.html modal ARIA, deduplication, dynamic mobile switcher & 0 missing i18n keys
  await test('2. index.html ARIA dialogs, deduplicated board toolbar, #mobile-dock-lang-select & i18n keys', async () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const modalTags = html.match(/<div\b[^>]*class="[^"]*\bmodal-backdrop\b[^"]*"[^>]*>/g) || [];
    assert(modalTags.length === 30, `Expected 30 .modal-backdrop tags, found ${modalTags.length}`);
    for (const tag of modalTags) {
      assert(tag.includes('role="dialog"') && tag.includes('aria-modal="true"'), `Modal tag missing ARIA dialog attrs: ${tag}`);
    }

    assert(!html.includes('id="mobile-dock-lang-btn"'), 'Old binary #mobile-dock-lang-btn still exists');
    assert(!html.includes('class="board-bar-lang-wrap"'), 'Duplicate .board-bar-lang-wrap still exists');
    assert(!html.includes('class="board-bar-lang-btn"'), 'Duplicate .board-bar-lang-btn still exists');

    const mobileSelectMatch = html.match(/<select\b[^>]*id="mobile-dock-lang-select"[^>]*>/);
    assert(mobileSelectMatch && mobileSelectMatch[0].includes('prs-lang-select'), 'Missing <select id="mobile-dock-lang-select" class="prs-lang-select">');

    const dictCtx = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'i18n', 'cs.js'), 'utf8'), dictCtx);
    vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'i18n', 'en.js'), 'utf8'), dictCtx);
    const cs = dictCtx.window.PRS_I18N.cs;
    const en = dictCtx.window.PRS_I18N.en;

    const attrRe = /data-i18n(?:-(?:html|title|placeholder|aria-label))?="([^"]+)"/g;
    const keys = new Set();
    let am;
    while ((am = attrRe.exec(html)) !== null) keys.add(am[1]);

    const missing = [];
    for (const k of keys) {
      if (resolveKey(cs, k) === undefined || resolveKey(en, k) === undefined) {
        missing.push(k);
      }
    }
    assert(missing.length === 0, `Missing dictionary keys for index.html: ${missing.join(', ')}`);
    return `30/30 ARIA dialogs, #mobile-dock-lang-select verified, ${keys.size} data-i18n* keys resolved in CS & EN`;
  });

  // 3. CSS non-print !important count < 130
  await test('3. CSS non-print !important count < 130', async () => {
    const files = ['main.css', 'board.css', 'modals.css', 'mobile.css'];
    const counts = {};
    let total = 0;
    for (const f of files) {
      const css = fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
      const nonPrint = stripPrintMediaBlocks(css);
      const cnt = (nonPrint.match(/!important/g) || []).length;
      counts[f] = cnt;
      total += cnt;
    }
    assert(total < 130, `Non-print !important count too high: ${total} (expected < 130)`);
    return `total=${total} (${files.map(f => `${f}:${counts[f]}`).join(', ')})`;
  });

  // 4. PRS_ModalManager mock-DOM unit tests
  await test('4. PRS_ModalManager unit test (LIFO stack, focus trap, Escape, focus restore, KiDeskyDialog priority)', async () => {
    runModalManagerUnitTests();
    return 'All stacked modal, focus trap, ESC LIFO, focus restoration & KiDeskyDialog assertions passed';
  });

  // Optional --live checks
  if (live) {
    const swSrc = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
    const cacheName = (swSrc.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
    const htmlLocal = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const assetVersion = (htmlLocal.match(/\?v=(\d+)/) || [])[1];

    await test(`5. LIVE GET service-worker.js (${cacheName} + Etapa 3 assets)`, async () => {
      const res = await fetchWithTimeout(`${baseUrl}service-worker.js`, { cache: 'no-store' });
      assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
      const text = await res.text();
      for (const tok of [cacheName, 'app-modal-manager.js', 'rules-cs.js', 'rules-en.js']) {
        assert(text.includes(tok), `Live service-worker.js missing ${tok}`);
      }
      return `HTTP 200, ${cacheName} and all Etapa 3 assets listed`;
    });

    await test(`6. LIVE GET index.html (?v=${assetVersion}, role="dialog", #mobile-dock-lang-select)`, async () => {
      const res = await fetchWithTimeout(`${baseUrl}index.html`, { cache: 'no-store' });
      assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
      const liveHtml = await res.text();
      assert(liveHtml.includes(`?v=${assetVersion}`), `Live index.html missing ?v=${assetVersion}`);
      assert(liveHtml.includes('role="dialog"') && liveHtml.includes('aria-modal="true"'), 'Live index.html missing modal ARIA attributes');
      assert(liveHtml.includes('id="mobile-dock-lang-select"') && !liveHtml.includes('id="mobile-dock-lang-btn"'), 'Live index.html mobile switcher mismatch');
      return `HTTP 200, ?v=${assetVersion}, ARIA & mobile language switcher active`;
    });

    for (const rel of [
      'js/app-modal-manager.js',
      'js/i18n/rules-cs.js',
      'js/i18n/rules-en.js',
      'js/app-rules-guide.js',
      'js/app-i18n.js'
    ]) {
      await test(`7. LIVE HEAD ${rel}?v=${assetVersion}`, async () => {
        const res = await fetchWithTimeout(`${baseUrl}${rel}?v=${assetVersion}`, { method: 'HEAD', cache: 'no-store' });
        assert(res.status === 200, `Expected HTTP 200 for ${rel}, got ${res.status}`);
        return 'HTTP 200';
      });
    }
  }

  console.log(`\n=== Výsledek test-etapa3: ${passed} PASS, ${failed} FAIL ===`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
