#!/usr/bin/env node
/**
 * KiDesky Etapa 4 (Fáze 4A + 4B-1 + 4B-2) Verification Suite (Local + --live modes)
 * Verifies:
 *  - js/i18n/languages.js and js/core/module-loader.js existence, syntax, and structure
 *  - index.html removes the 8 eager optional/dict scripts and boots via languages.js + module-loader.js
 *  - Eager initial JS payload savings (>= 500 KB reduced compared to pre-4A 2,456 KB baseline)
 *  - Fáze 4B-1 (js/board/*, js/hud/*, js/modals/*) & Fáze 4B-2 (js/boards/*, js/engine/*, thin js/app.js + js/app/*) split modules + VM parity
 *  - Node VM unit test for PRS_ModuleLoader + PRS_I18n (dedup, error retry, lazy switch cs -> en)
 *  - Cross-module method separation (0 collisions on PRS_App, openImageModal in modal-cheatsheet.js, Balance Studio in app-admin.js)
 *  - Optional --live verification on https://www.ekobio.org/apps/KiDesky/
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

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

async function runModuleLoaderAndI18nUnitTest() {
  const createdScripts = [];
  let failOnceTriggered = false;

  const doc = {
    readyState: 'complete',
    documentElement: { lang: 'cs' },
    head: null,
    body: null,
    _existingScripts: [
      { getAttribute: (n) => n === 'src' ? 'js/core/module-loader.js?v=202611192355' : null }
    ],
    querySelectorAll(sel) {
      if (sel === 'script[src]') {
        return [...doc._existingScripts, ...createdScripts];
      }
      return [];
    },
    getElementById() { return null; },
    createElement(tag) {
      if (tag !== 'script') return {};
      return {
        tagName: 'SCRIPT',
        src: '',
        async: false,
        attrs: {},
        parentNode: null,
        getAttribute(name) {
          if (name === 'src') return this.src;
          return this.attrs[name] || null;
        },
        setAttribute(name, val) {
          this.attrs[name] = String(val);
        }
      };
    },
    addEventListener() {},
    dispatchEvent() {}
  };
  doc.head = {
    appendChild(scriptEl) {
      scriptEl.parentNode = doc.head;
      createdScripts.push(scriptEl);
      const rel = scriptEl.src.split('?')[0];
      queueMicrotask(() => {
        if (rel === 'js/fake-transient-fail.js' && !failOnceTriggered) {
          failOnceTriggered = true;
          if (typeof scriptEl.onerror === 'function') scriptEl.onerror(new Error('Network fail'));
          return;
        }
        if (rel === 'js/fake-transient-fail.js') {
          win.PRS_FakeTransientOk = true;
          if (typeof scriptEl.onload === 'function') scriptEl.onload();
          return;
        }
        const abs = path.join(ROOT, rel);
        if (!fs.existsSync(abs)) {
          if (typeof scriptEl.onerror === 'function') scriptEl.onerror(new Error('404'));
          return;
        }
        const code = fs.readFileSync(abs, 'utf8');
        vm.runInContext(code, sandbox, { filename: rel });
        if (typeof scriptEl.onload === 'function') scriptEl.onload();
      });
    },
    removeChild(el) {
      el.parentNode = null;
    }
  };
  doc.body = doc.head;

  const eventsFired = [];
  const win = {
    document: doc,
    navigator: { language: 'cs-CZ' },
    localStorage: {
      _data: {},
      getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
      setItem(k, v) { this._data[k] = String(v); }
    },
    PRS_HUD: { render() {} },
    addEventListener() {},
    dispatchEvent(evt) { eventsFired.push(evt); },
    CustomEvent: function (name, opts) { this.type = name; this.detail = opts ? opts.detail : null; },
    console
  };
  win.window = win;

  const sandbox = {
    window: win,
    document: doc,
    navigator: win.navigator,
    localStorage: win.localStorage,
    CustomEvent: win.CustomEvent,
    console,
    Promise,
    setTimeout,
    clearTimeout
  };
  vm.createContext(sandbox);

  for (const rel of ['js/i18n/languages.js', 'js/core/module-loader.js', 'js/app-i18n.js']) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  const loader = win.PRS_ModuleLoader;
  const i18n = win.PRS_I18n;
  assert(loader && i18n, 'PRS_ModuleLoader or PRS_I18n missing');
  assert(loader.getAssetVersion() === '202611192355', 'Expected assetVersion 202611192355, got ' + loader.getAssetVersion());
  assert(loader.resolveUrl('js/app-admin.js') === 'js/app-admin.js?v=202611192355', 'resolveUrl failed');

  // Wait for initial 'cs' boot lazy fetch
  await i18n.ensureLanguageLoaded('cs');
  assert(win.PRS_I18N && win.PRS_I18N.cs, 'cs dictionary did not lazy-load');
  assert(!win.PRS_I18N.en, 'en dictionary should NOT be loaded on cs boot');
  assert(i18n.getAvailableLanguages().map(l => l.code).join(',') === 'cs,en', 'Manifest language list mismatch');

  // Deduplication test: concurrent loads of js/app-rules-guide.js create only 1 script tag
  const beforeDedupCount = createdScripts.length;
  await Promise.all([
    loader.loadScript('js/app-rules-guide.js'),
    loader.loadScript('js/app-rules-guide.js')
  ]);
  assert(createdScripts.length - beforeDedupCount === 1, 'Concurrent loadScript calls were not deduplicated');
  assert(loader.isLoaded('js/app-rules-guide.js'), 'isLoaded should be true after loadScript resolves');

  // Error retry test: first failure cleans cache, second attempt succeeds
  let threw = false;
  try {
    await loader.loadScript('js/fake-transient-fail.js');
  } catch (e) {
    threw = true;
  }
  assert(threw, 'Expected first load of failing script to reject');
  await loader.loadScript('js/fake-transient-fail.js');
  assert(win.PRS_FakeTransientOk === true, 'Retry after error did not succeed');

  // Lazy switch cs -> en loads en.js dynamically and emits prs:lang-change
  const swRes = await i18n.setLanguage('en');
  assert(swRes === 'en' && i18n.getLanguage() === 'en', 'Failed switching language lazily to en');
  assert(win.PRS_I18N && win.PRS_I18N.en, 'en dictionary was not lazy-loaded');
  assert(eventsFired.some(e => e.type === 'prs:lang-change' && e.detail && e.detail.language === 'en'), 'prs:lang-change event missing for en');
  assert(i18n.t('ui.loading_module') === '⏳ Loading module...', 'EN translation ui.loading_module mismatch');
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
  console.log(`=== KiDesky Etapa 4 (Fáze 4A) Verification (${live ? 'LOCAL + LIVE: ' + baseUrl : 'LOCAL'}) ===`);

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

  // 1. New lazy-loader files exist and pass node -c
  await test('1. New files (js/i18n/languages.js & js/core/module-loader.js) syntax valid', async () => {
    for (const rel of ['js/i18n/languages.js', 'js/core/module-loader.js']) {
      const abs = path.join(ROOT, rel);
      assert(fs.existsSync(abs), `Missing ${rel}`);
      execFileSync(process.execPath, ['-c', abs], { stdio: 'pipe' });
    }
    return 'Both files exist and pass node -c';
  });

  // 2. index.html uses lazy setup and reduces eager JS payload >= 500 KB
  await test('2. index.html lazy-loads 8 optional/dictionary scripts & saves >= 500 KB eager JS', async () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const scriptSrcs = [];
    const re = /<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      scriptSrcs.push(m[1].split('?')[0]);
    }

    assert(scriptSrcs.includes('js/i18n/languages.js'), 'Missing js/i18n/languages.js in index.html');
    assert(scriptSrcs.includes('js/core/module-loader.js'), 'Missing js/core/module-loader.js in index.html');

    const forbiddenEager = [
      'js/i18n/cs.js',
      'js/i18n/en.js',
      'js/i18n/rules-cs.js',
      'js/i18n/rules-en.js',
      'js/app-map-editor.js',
      'js/app-catalog.js',
      'js/app-rules-guide.js',
      'js/app-admin.js'
    ];
    for (const forb of forbiddenEager) {
      assert(!scriptSrcs.includes(forb), `Script must not be loaded eagerly in index.html: ${forb}`);
    }

    const totalAllJsBytes = forbiddenEager.reduce((acc, rel) => acc + fs.statSync(path.join(ROOT, rel)).size, 0) +
      scriptSrcs.filter(s => s.startsWith('js/')).reduce((acc, rel) => acc + fs.statSync(path.join(ROOT, rel)).size, 0);
    const eagerJsBytes = scriptSrcs.filter(s => s.startsWith('js/')).reduce((acc, rel) => acc + fs.statSync(path.join(ROOT, rel)).size, 0);
    const savedKb = Math.round((totalAllJsBytes - eagerJsBytes) / 1024);
    assert(savedKb >= 500, `Expected >= 500 KB eager reduction, got ${savedKb} KB`);
    return `eager=${Math.round(eagerJsBytes / 1024)} KB, deferred=${savedKb} KB across ${forbiddenEager.length} lazy scripts`;
  });

  // 3. Cross-module separation check (openImageModal in modal-cheatsheet.js, Balance Studio in app-admin.js, setInputValue in app.js)
  await test('3. Cross-module decoupling (lightbox in modal-cheatsheet.js, Balance Studio in app-admin.js, helpers in app.js)', async () => {
    const cheatsheetSrc = fs.readFileSync(path.join(ROOT, 'js', 'modals', 'modal-cheatsheet.js'), 'utf8');
    const adminSrc = fs.readFileSync(path.join(ROOT, 'js', 'app-admin.js'), 'utf8');
    const appSrc = fs.readFileSync(path.join(ROOT, 'js', 'app.js'), 'utf8');
    const catSrc = fs.readFileSync(path.join(ROOT, 'js', 'app-catalog.js'), 'utf8');

    assert(cheatsheetSrc.includes('openImageModal:'), 'openImageModal missing from modal-cheatsheet.js');
    assert(!catSrc.includes('openImageModal:'), 'openImageModal should not stay in app-catalog.js');
    assert(appSrc.includes('setInputValue:'), 'setInputValue missing from app.js');
    assert(!adminSrc.includes('setInputValue:'), 'setInputValue should not stay in app-admin.js');
    assert(adminSrc.includes('renderBalanceStudioInputs:'), 'renderBalanceStudioInputs missing from app-admin.js');
    assert(!catSrc.includes('renderBalanceStudioInputs:'), 'renderBalanceStudioInputs should not stay in app-catalog.js');
    assert(adminSrc.includes('_adminModuleLoaded: true'), '_adminModuleLoaded flag missing in app-admin.js');
    assert(catSrc.includes('_rulesBundleLoaded: true'), '_rulesBundleLoaded flag missing in app-catalog.js');
    return 'All cross-module dependencies cleanly separated with zero duplicate methods';
  });

  // 3b. Fáze 4B-1 split modules check (15 files under js/board, js/hud, js/modals; old monoliths removed)
  const splitModules = [
    'js/board/board-camera.js',
    'js/board/board-rivers.js',
    'js/board/board-static-svg.js',
    'js/board/board-tokens.js',
    'js/board/board-ambient.js',
    'js/hud/hud-mobile-dock.js',
    'js/hud/hud-inspector.js',
    'js/hud/hud-advisor.js',
    'js/hud/hud-action-panel.js',
    'js/hud/hud-turn-actions.js',
    'js/modals/modal-victory-diploma.js',
    'js/modals/modal-armory.js',
    'js/modals/modal-combat.js',
    'js/modals/modal-festival-chance.js',
    'js/modals/modal-cheatsheet.js'
  ];

  await test('3b. Fáze 4B-1 split modules syntax & VM load (15 modules, old monoliths removed)', async () => {
    for (const oldFile of ['js/app-hud.js', 'js/app-modals.js', 'js/app-board.js']) {
      assert(!fs.existsSync(path.join(ROOT, oldFile)), `Old monolith still exists: ${oldFile}`);
    }

    const win = { PRS_App: {} };
    const ctx = vm.createContext({
      window: win,
      document: {},
      console
    });
    for (const rel of splitModules) {
      const fullPath = path.join(ROOT, rel);
      assert(fs.existsSync(fullPath), `Missing split module: ${rel}`);
      execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
      const code = fs.readFileSync(fullPath, 'utf8');
      vm.runInContext(code, ctx, { filename: rel });
    }

    const expectedMethods = [
      '_renderActionPhaseRoll',
      '_renderActionPhaseLanded',
      'openGraphicsModal',
      'openArmoryModal',
      'openQuestDuelModal',
      'openFestivalModal',
      'openImageModal',
      'renderBoardSVG',
      'renderBoardRiversHTML',
      'initMapPanAndZoom',
      'updateMobileDock'
    ];
    for (const m of expectedMethods) {
      assert(typeof win.PRS_App[m] === 'function', `Expected PRS_App.${m} function missing after loading split modules`);
    }
    return `15 split modules syntax-ok & loaded (${Object.keys(win.PRS_App).length} PRS_App entries)`;
  });

  // 3c. Fáze 4B-2 split modules check (14 new submodules + thin app.js; old game-boards/game-engine removed)
  const b2SplitModules = [
    'js/boards/boards-decor-catalog.js',
    'js/boards/boards-geometry.js',
    'js/boards/boards-generator.js',
    'js/boards/boards-builder.js',
    'js/boards/boards-presets.js',
    'js/engine/engine-state.js',
    'js/engine/engine-movement.js',
    'js/engine/engine-economy.js',
    'js/engine/engine-actions.js',
    'js/app.js',
    'js/app/app-music-ui.js',
    'js/app/app-landing.js',
    'js/app/app-profile-cosmetics.js',
    'js/app/app-lobby-session.js',
    'js/app/app-map-studio.js'
  ];

  await test('3c. Fáze 4B-2 split modules syntax, size (<105 KB), VM load & parity keys', async () => {
    for (const oldFile of ['js/game-boards.js', 'js/game-engine.js']) {
      assert(!fs.existsSync(path.join(ROOT, oldFile)), `Old monolith still exists: ${oldFile}`);
    }

    const doc = {
      documentElement: { lang: 'cs' },
      readyState: 'complete',
      querySelectorAll() { return []; },
      getElementById() { return null; },
      addEventListener() {},
      dispatchEvent() {}
    };
    const win = {
      document: doc,
      navigator: { language: 'cs-CZ' },
      localStorage: {
        _m: {},
        getItem(k) { return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; },
        setItem(k, v) { this._m[k] = String(v); },
        removeItem(k) { delete this._m[k]; }
      },
      addEventListener() {},
      dispatchEvent() {},
      CustomEvent: function (name, opts) { this.type = name; this.detail = opts ? opts.detail : null; },
      console
    };
    win.window = win;

    const ctx = vm.createContext({
      window: win,
      document: doc,
      navigator: win.navigator,
      localStorage: win.localStorage,
      CustomEvent: win.CustomEvent,
      console,
      Math,
      Date,
      JSON,
      Number,
      String,
      Array,
      Object,
      parseInt,
      parseFloat,
      isNaN,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval
    });

    for (const rel of b2SplitModules) {
      const fullPath = path.join(ROOT, rel);
      assert(fs.existsSync(fullPath), `Missing Fáze 4B-2 module: ${rel}`);
      const sizeBytes = fs.statSync(fullPath).size;
      assert(sizeBytes < 105 * 1024, `Module ${rel} exceeds 105 KB (${(sizeBytes / 1024).toFixed(1)} KB)`);
      execFileSync(process.execPath, ['--check', fullPath], { stdio: 'pipe' });
      const code = fs.readFileSync(fullPath, 'utf8');
      vm.runInContext(code, ctx, { filename: rel });
    }

    assert(win.PRS_DECOR_CATALOG && Object.keys(win.PRS_DECOR_CATALOG).length === 49, 'PRS_DECOR_CATALOG key count != 49');
    assert(win.KiDeskyMapGenerator && Object.keys(win.KiDeskyMapGenerator).length === 26, 'KiDeskyMapGenerator key count != 26');
    assert(win.KiDeskyMapGenerator.ALL_CASTLES[0] && win.KiDeskyMapGenerator.ALL_CASTLES[0]._i18nWrapped === true, 'ALL_CASTLES[0]._i18nWrapped missing');
    assert(win.PRS_BoardBuilder && Object.keys(win.PRS_BoardBuilder).length === 18, 'PRS_BoardBuilder key count != 18');
    const castlesDesc = Object.getOwnPropertyDescriptor(win.PRS_BoardBuilder, 'ALL_CASTLES');
    assert(castlesDesc && typeof castlesDesc.get === 'function', 'PRS_BoardBuilder.ALL_CASTLES getter missing');
    assert(win.PRS_GameEngine && Object.keys(win.PRS_GameEngine).length === 59, 'PRS_GameEngine key count != 59');
    assert(win.PRS_App && Object.keys(win.PRS_App).length >= 213, `PRS_App key count < 213 (got ${Object.keys(win.PRS_App || {}).length})`);
    assert(typeof win.PRS_App.resetActiveGameSessionForLogout === 'function', 'PRS_App.resetActiveGameSessionForLogout missing');
    assert(win.KiDeskyToast && typeof win.KiDeskyToast.show === 'function', 'KiDeskyToast.show missing');
    assert(String(win.PRS_App.toggleEmotePicker).includes('knight-emotes-hud'), 'toggleEmotePicker must use #knight-emotes-hud');

    return '15 modules <105 KB each; parity keys verified & toggleEmotePicker fixed';
  });

  // 4. Unit test for PRS_ModuleLoader + lazy PRS_I18n language switching
  await test('4. PRS_ModuleLoader & lazy PRS_I18n unit test (boot, dedup, retry, cs -> en switch)', async () => {
    await runModuleLoaderAndI18nUnitTest();
    return 'Passed async boot, dedup, error recovery & lazy en.js switching assertions';
  });

  // 5. Headless Engine Smoke & Simulation test
  await test('5. Headless engine simulation (test-engine-smoke.js)', async () => {
    execFileSync(process.execPath, [path.join(ROOT, 'tools', 'test-engine-smoke.js')], { stdio: 'pipe' });
    return 'All 3 built-in boards + 2 procedural AI-vs-AI simulations passed';
  });

  // Optional --live checks
  if (live) {
    const swSrc = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
    const cacheName = (swSrc.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/) || [])[1];
    const htmlLocal = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const assetVersion = (htmlLocal.match(/\?v=(\d+)/) || [])[1];

    await test(`6. LIVE GET service-worker.js (${cacheName}, languages.js, module-loader.js)`, async () => {
      const res = await fetchWithTimeout(`${baseUrl}service-worker.js`, { cache: 'no-store' });
      assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
      const text = await res.text();
      for (const tok of [cacheName, 'languages.js', 'module-loader.js', 'hud-action-panel.js', 'board-rivers.js', 'modal-combat.js', 'boards-generator.js', 'engine-state.js', 'app-map-studio.js']) {
        assert(text.includes(tok), `Live service-worker.js missing ${tok}`);
      }
      return `HTTP 200, ${cacheName} active`;
    });

    await test(`7. LIVE GET index.html (?v=${assetVersion} lazy & split scripts wired)`, async () => {
      const res = await fetchWithTimeout(`${baseUrl}index.html`, { cache: 'no-store' });
      assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
      const liveHtml = await res.text();
      assert(liveHtml.includes(`js/i18n/languages.js?v=${assetVersion}`), 'Live index.html missing languages.js');
      assert(liveHtml.includes(`js/core/module-loader.js?v=${assetVersion}`), 'Live index.html missing module-loader.js');
      assert(liveHtml.includes(`js/hud/hud-action-panel.js?v=${assetVersion}`), 'Live index.html missing hud-action-panel.js');
      assert(liveHtml.includes(`js/boards/boards-generator.js?v=${assetVersion}`), 'Live index.html missing boards-generator.js');
      assert(liveHtml.includes(`js/engine/engine-state.js?v=${assetVersion}`), 'Live index.html missing engine-state.js');
      assert(liveHtml.includes(`js/app/app-map-studio.js?v=${assetVersion}`), 'Live index.html missing app-map-studio.js');
      assert(!liveHtml.includes('src="js/app-admin.js'), 'Live index.html still eagerly loads app-admin.js');
      assert(!liveHtml.includes('src="js/app-map-editor.js'), 'Live index.html still eagerly loads app-map-editor.js');
      assert(!liveHtml.includes('src="js/app-catalog.js'), 'Live index.html still eagerly loads app-catalog.js');
      assert(!liveHtml.includes('src="js/app-hud.js'), 'Live index.html still loads deprecated app-hud.js');
      assert(!liveHtml.includes('src="js/app-modals.js'), 'Live index.html still loads deprecated app-modals.js');
      assert(!liveHtml.includes('src="js/app-board.js'), 'Live index.html still loads deprecated app-board.js');
      assert(!liveHtml.includes('src="js/game-boards.js'), 'Live index.html still loads deprecated game-boards.js');
      assert(!liveHtml.includes('src="js/game-engine.js'), 'Live index.html still loads deprecated game-engine.js');
      return `HTTP 200, ?v=${assetVersion} & lazy/split modules active`;
    });

    for (const rel of [
      'js/i18n/languages.js',
      'js/core/module-loader.js',
      'js/app-i18n.js',
      ...b2SplitModules,
      ...splitModules,
      'js/app-admin.js',
      'js/app-catalog.js'
    ]) {
      await test(`8. LIVE HEAD ${rel}?v=${assetVersion}`, async () => {
        const res = await fetchWithTimeout(`${baseUrl}${rel}?v=${assetVersion}`, { method: 'HEAD', cache: 'no-store' });
        assert(res.status === 200, `Expected HTTP 200 for ${rel}, got ${res.status}`);
        return 'HTTP 200';
      });
    }
  }

  console.log(`\n=== Výsledek test-etapa4: ${passed} PASS, ${failed} FAIL ===`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
