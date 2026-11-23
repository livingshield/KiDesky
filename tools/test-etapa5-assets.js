#!/usr/bin/env node
/**
 * KiDesky Etapa 5 Assets & SVG/CSS Flip Verification (LOCAL + optional --live)
 * Usage:
 *   node tools/test-etapa5-assets.js
 *   node tools/test-etapa5-assets.js --live
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const LIVE = process.argv.includes('--live');
const LIVE_BASE = 'https://www.ekobio.org/apps/KiDesky/';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walkAssetsImages() {
  const results = [];
  const assetsDir = path.join(ROOT, 'assets');
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (rel === 'assets/audio' || rel === 'assets/video') continue;
        walk(full);
      } else if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(e.name)) {
        results.push({ rel, full, name: e.name, size: fs.statSync(full).size });
      }
    }
  }
  walk(assetsDir);
  return results;
}

function collectCodeFiles() {
  const out = [];
  for (const rootFile of ['index.html', 'manifest.json', 'service-worker.js']) {
    const p = path.join(ROOT, rootFile);
    if (fs.existsSync(p)) out.push({ rel: rootFile, full: p });
  }
  function walk(dirRel) {
    const d = path.join(ROOT, dirRel);
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const subRel = dirRel + '/' + e.name;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(subRel);
      else if (/\.(js|css)$/i.test(e.name)) out.push({ rel: subRel, full });
    }
  }
  walk('css');
  walk('js');
  return out;
}

async function runHeadWithRetry(url, retries = 3) {
  let lastErr;
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      return res;
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise(r => setTimeout(r, 600));
    }
  }
  throw lastErr;
}

async function main() {
  console.log(`=== KiDesky Etapa 5 Assets Verification (${LIVE ? 'LOCAL + LIVE: ' + LIVE_BASE : 'LOCAL'}) ===`);
  let pass = 0;
  let fail = 0;

  async function test(label, fn) {
    try {
      const detail = await fn();
      console.log(`[PASS] ${label}${detail ? ' — ' + detail : ''}`);
      pass++;
    } catch (err) {
      console.error(`[FAIL] ${label} — ${err.message}`);
      fail++;
    }
  }

  const images = walkAssetsImages();

  await test('1. Zero *_flip.* files in assets/', async () => {
    const flips = images.filter(x => /_flip\./i.test(x.name));
    assert(flips.length === 0, `Found leftover flip files: ${flips.map(f => f.rel).join(', ')}`);
    return `${images.length} image files scanned, 0 _flip files`;
  });

  await test('2. Zero duplicate image stems in assets/ (png+jpg/webp)', async () => {
    const byStem = new Map();
    for (const im of images) {
      const ext = path.extname(im.rel).toLowerCase();
      const stem = im.rel.slice(0, -ext.length);
      if (!byStem.has(stem)) byStem.set(stem, []);
      byStem.get(stem).push(im.rel);
    }
    const dupes = [...byStem.entries()].filter(([, arr]) => arr.length > 1);
    assert(dupes.length === 0, `Duplicate stems found: ${dupes.map(([k, v]) => `${k}: [${v.join(', ')}]`).join('; ')}`);
    return `${byStem.size} unique stems, 0 duplicates`;
  });

  await test('3. Total graphics size in assets/ < 25 MB', async () => {
    const totalBytes = images.reduce((s, x) => s + x.size, 0);
    const totalMb = totalBytes / (1024 * 1024);
    assert(totalMb < 25.0, `Total graphics size ${totalMb.toFixed(2)} MB exceeds 25 MB limit`);
    return `${totalMb.toFixed(2)} MB across ${images.length} files`;
  });

  await test('4. Every literal assets/ image ref in code exists on disk', async () => {
    const IGNORED_PLACEHOLDERS = new Set([
      'assets/env/table-oak.webp',
      'assets/board/kingdom-map.webp'
    ]);
    const codeFiles = collectCodeFiles();
    const refs = new Map();
    const refRe = /(?:["'`(\s]|\/apps\/KiDesky\/)(assets\/(?:backgrounds|board|castles|decorations|dragons|env|icons|landmarks|monsters|pawns|terrain|tiles)\/[A-Za-z0-9_\-\.]+\.(?:png|jpe?g|webp|gif|svg|ico))/gi;
    for (const cf of codeFiles) {
      const txt = fs.readFileSync(cf.full, 'utf8');
      let m;
      while ((m = refRe.exec(txt)) !== null) {
        const assetRel = m[1];
        if (IGNORED_PLACEHOLDERS.has(assetRel)) continue;
        if (!refs.has(assetRel)) refs.set(assetRel, []);
        refs.get(assetRel).push(cf.rel);
      }
    }
    const missing = [];
    for (const [assetRel, files] of refs.entries()) {
      const full = path.join(ROOT, assetRel.split('/').join(path.sep));
      if (!fs.existsSync(full)) {
        missing.push(`${assetRel} (in ${[...new Set(files)].slice(0, 3).join(', ')})`);
      }
    }
    assert(missing.length === 0, `Missing disk assets: ${missing.join('; ')}`);
    return `${refs.size} unique image references verified on disk across ${codeFiles.length} code files`;
  });

  await test('5. VM unit test: PRS_normalizeAssetUrl, shouldFlipTileBitmap & renderBoardStaticHTML', async () => {
    const doc = {
      documentElement: { getAttribute: () => 'light' },
      createElement: () => ({ innerHTML: '', querySelector: () => null })
    };
    const win = {
      document: doc,
      PRS_App: {
        escapeHtml: (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
        getLandmarkDisplayName: (l) => (l && l.name) || '',
        renderBoardRiversHTML: () => '',
        renderBoardBridgesHTML: () => '',
        isDecorCollidingWithRivers: () => false,
        currentTheme: 'light',
        graphicsConfig: {
          boardBgUrl: 'assets/board/parchment_board_bg.jpg',
          landmarkBitmaps: {},
          decorBitmaps: {},
          tileBitmapsByType: {
            horse: 'assets/tiles/kun.jpg',
            CASTLE: 'assets/tiles/castle_flip.png'
          }
        }
      },
      PRS_I18n: { t: (_k, _p, d) => d }
    };
    const ctx = vm.createContext({
      window: win,
      document: doc,
      localStorage: { getItem: () => null },
      console
    });

    for (const rel of [
      'js/core/module-loader.js',
      'js/boards/boards-decor-catalog.js',
      'js/board/board-camera.js',
      'js/board/board-static-svg.js'
    ]) {
      vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
    }

    assert(win.PRS_normalizeAssetUrl('assets/castles/castle_royal_flip.png?v=1') === 'assets/castles/castle_royal.webp?v=1', 'Failed castle _flip.png normalization');
    assert(win.PRS_normalizeAssetUrl('assets/board/parchment_board_bg.jpg') === 'assets/board/parchment_board_bg.webp', 'Failed parchment_board_bg.jpg normalization');
    assert(win.PRS_normalizeAssetUrl('assets/icons/icon-192.png') === 'assets/icons/icon-192.png', 'PWA icon should remain .png');
    assert(win.PRS_isFlippedAssetUrl('assets/dragons/dragon_red_flip.png') === true, 'Failed _flip detection');
    assert(win.PRS_isFlippedAssetUrl('assets/dragons/dragon_red.webp') === false, 'False positive on non-flip asset');

    const app = win.PRS_App;
    assert(app.shouldFlipTileBitmap({ id: 1, x: 950, type: 'ANIMAL', subtype: 'horse' }) === true, 'Right-side animal tile should flip');
    assert(app.shouldFlipTileBitmap({ id: 2, x: 350, type: 'ANIMAL', subtype: 'horse' }) === false, 'Left-side animal tile should not flip');
    assert(app.shouldFlipTileBitmap({ id: 3, x: 350, type: 'CASTLE', castleImg: 'assets/castles/castle_ice_flip.png' }) === true, 'Legacy _flip castleImg should trigger flip');

    app.state = {
      currentPlayerIndex: 0,
      players: [{ index: 0, name: 'Test', color: '#ef4444' }],
      config: { targetHearts: 30, scenario: 'CLASSIC' },
      board: {
        landmarks: [
          { id: 'castle_H2', name: 'Boreas', image: 'assets/castles/castle_wind_flip.png', x: 950, y: 300, w: 120, h: 110 }
        ],
        decorations: [
          { catalogId: 'tree_oak', x: 500, y: 300, w: 56, h: 68, scale: 1, isFlipped: true }
        ],
        nodes: [
          { id: 0, code: 'START', name: 'Start', type: 'START', icon: '👑', x: 300, y: 400, next: [1], owner: null },
          { id: 1, code: 'K1', name: 'Kůň', type: 'ANIMAL', subtype: 'horse', icon: '🐎', x: 950, y: 400, next: [0], owner: null }
        ],
        rivers: [],
        bridges: []
      }
    };

    const svgHtml = app.renderBoardStaticHTML();
    assert(!svgHtml.includes('_flip.png'), 'Rendered SVG still contains _flip.png!');
    assert(!svgHtml.includes('parchment_board_bg.jpg'), 'Rendered SVG still contains parchment_board_bg.jpg!');
    assert(svgHtml.includes('assets/board/parchment_board_bg.webp'), 'Rendered SVG missing parchment_board_bg.webp');
    assert(svgHtml.includes('assets/castles/castle_wind.webp'), 'Rendered SVG missing normalized castle_wind.webp');
    assert(svgHtml.includes('assets/decorations/tree_oak.webp'), 'Rendered SVG missing tree_oak.webp');
    assert(svgHtml.includes('assets/tiles/kun.webp'), 'Rendered SVG missing normalized kun.webp');
    assert(svgHtml.includes('translate(120, 0) scale(-1, 1)'), 'Missing landmark <image> scale(-1, 1) transform');
    assert(svgHtml.includes('transform="scale(-1, 1)"'), 'Missing decoration <image> scale(-1, 1) transform');
    assert(svgHtml.includes('translate(950,400) scale(-1, 1)'), 'Missing right-half tile <g> scale(-1, 1) transform');

    return 'normalizer, shouldFlipTileBitmap & SVG flip transforms verified';
  });

  if (LIVE) {
    const liveWebpSamples = [
      'assets/castles/castle_royal.webp',
      'assets/decorations/tree_oak.webp',
      'assets/dragons/dragon_red.webp',
      'assets/landmarks/dragon.webp',
      'assets/monsters/monster_bear.webp',
      'assets/pawns/pawn_knight_valiant.webp',
      'assets/tiles/start.webp',
      'assets/backgrounds/bg_theme_fire.webp',
      'assets/board/parchment_board_bg.webp',
      'assets/terrain/grass.webp',
      'assets/env/table_bg.webp'
    ];

    for (const rel of liveWebpSamples) {
      await test(`6. LIVE HEAD ${rel} (200 + image/webp)`, async () => {
        const res = await runHeadWithRetry(LIVE_BASE + rel);
        assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        assert(ct.includes('image/webp'), `Expected image/webp Content-Type, got "${ct}"`);
        return `HTTP 200 (${ct})`;
      });
    }

    await test('7. LIVE HEAD assets/icons/icon-192.png (200)', async () => {
      const res = await runHeadWithRetry(LIVE_BASE + 'assets/icons/icon-192.png');
      assert(res.status === 200, `Expected HTTP 200, got ${res.status}`);
      return `HTTP 200 (${res.headers.get('content-type')})`;
    });
  }

  console.log(`\n=== Výsledek test-etapa5-assets: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
