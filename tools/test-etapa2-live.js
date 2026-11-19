#!/usr/bin/env node
/**
 * KiDesky Etapa 2 Live Verification Tests (100% read-only on production DB)
 * Dynamically reads expected CACHE_NAME and ?v= from local files and verifies
 * live SW, early beforeinstallprompt hook, DB-backed get-chat / check-session / load-session stateVersion & validation.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let baseUrl = 'https://www.ekobio.org/apps/KiDesky/';
  for (const arg of argv) {
    if (arg.startsWith('--base-url=')) {
      baseUrl = arg.slice('--base-url='.length);
    }
  }
  if (!baseUrl.endsWith('/')) baseUrl += '/';
  return { baseUrl };
}

function getLocalVersions() {
  const swSrc = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  const cacheMatch = swSrc.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const verMatch = indexHtml.match(/\?v=(\d+)/);
  if (!cacheMatch || !verMatch) {
    throw new Error('Could not parse local CACHE_NAME or ?v= version');
  }
  return { cacheName: cacheMatch[1], assetVersion: verMatch[1] };
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
  const { baseUrl } = parseArgs(process.argv.slice(2));
  const { cacheName, assetVersion } = getLocalVersions();
  console.log(`=== KiDesky Etapa 2 Live Verification (${baseUrl}, ${cacheName}, ?v=${assetVersion}) ===`);

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

  // 1. Service Worker checks
  await test(`1. GET service-worker.js (${cacheName}, api.ashx bypass, ignoreSearch)`, async () => {
    const res = await fetchWithTimeout(`${baseUrl}service-worker.js`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const text = await res.text();
    for (const token of [cacheName, 'api.ashx', 'ignoreSearch']) {
      if (!text.includes(token)) throw new Error(`Missing token in SW: ${token}`);
    }
    return 'HTTP 200, all required SW directives present';
  });

  // 2. index.html PWA hook & cache busting version
  await test(`2. GET index.html (beforeinstallprompt, ?v=${assetVersion})`, async () => {
    const res = await fetchWithTimeout(`${baseUrl}index.html`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('beforeinstallprompt')) throw new Error('Missing early beforeinstallprompt handler');
    if (!html.includes(`?v=${assetVersion}`)) throw new Error(`Missing ?v=${assetVersion}`);
    return `HTTP 200, PWA prompt capture + v${assetVersion} active`;
  });

  // 3. Updated JS assets accessible with new version query string
  for (const rel of ['js/app-dialog.js', 'js/app-musicwidget.js', 'js/app-online.js']) {
    await test(`3. HEAD ${rel}?v=${assetVersion}`, async () => {
      const res = await fetchWithTimeout(`${baseUrl}${rel}?v=${assetVersion}`, { method: 'HEAD', cache: 'no-store' });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      return `HTTP ${res.status}`;
    });
  }

  // 4. DB-backed get-chat read-only query
  await test('4. GET api.ashx?action=get-chat&code=VERIFYREADONLY', async () => {
    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=get-chat&code=VERIFYREADONLY`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data || data.ok !== true) throw new Error(`Expected ok === true, got ${JSON.stringify(data)}`);
    if (!Array.isArray(data.messages)) throw new Error('Expected messages array');
    return `HTTP 200, ok=true, messages=${data.messages.length}`;
  });

  // 5. list-sessions -> check-session & load-session stateVersion + DB arrays
  await test('5. Sessions stateVersion & DB chat/emotes check', async () => {
    const listRes = await fetchWithTimeout(`${baseUrl}api.ashx?action=list-sessions`, { cache: 'no-store' });
    if (listRes.status !== 200) throw new Error(`list-sessions HTTP ${listRes.status}`);
    const listData = await listRes.json();
    if (!listData || listData.ok !== true || !Array.isArray(listData.sessions)) {
      throw new Error('Unexpected list-sessions payload');
    }
    if (listData.sessions.length === 0) {
      return '0 sessions in DB (skipped room check gracefully)';
    }
    const roomCode = listData.sessions[0].roomCode;
    const chkRes = await fetchWithTimeout(`${baseUrl}api.ashx?action=check-session&code=${encodeURIComponent(roomCode)}&chatSince=0`, { cache: 'no-store' });
    if (chkRes.status !== 200) throw new Error(`check-session HTTP ${chkRes.status}`);
    const chkData = await chkRes.json();
    if (!chkData || chkData.ok !== true) throw new Error(`check-session failed: ${JSON.stringify(chkData)}`);
    if (typeof chkData.stateVersion !== 'number' || chkData.stateVersion < 1) {
      throw new Error(`Invalid check-session stateVersion: ${chkData.stateVersion}`);
    }
    if (!Array.isArray(chkData.emotes) || !Array.isArray(chkData.chat)) {
      throw new Error('Expected emotes and chat arrays in check-session');
    }

    const loadRes = await fetchWithTimeout(`${baseUrl}api.ashx?action=load-session&code=${encodeURIComponent(roomCode)}`, { cache: 'no-store' });
    if (loadRes.status !== 200) throw new Error(`load-session HTTP ${loadRes.status}`);
    const loadData = await loadRes.json();
    if (!loadData || loadData.ok !== true || !loadData.session) {
      throw new Error('Invalid load-session response');
    }
    if (typeof loadData.session.stateVersion !== 'number' || loadData.session.stateVersion < 1) {
      throw new Error(`Invalid load-session stateVersion: ${loadData.session.stateVersion}`);
    }
    if (!Array.isArray(loadData.chat)) {
      throw new Error('Expected chat array in load-session');
    }
    return `room=${roomCode}, check.stateVersion=${chkData.stateVersion}, load.stateVersion=${loadData.session.stateVersion}`;
  });

  // 6. POST send-chat with empty text (validation check, zero DB writes)
  await test('6. POST api.ashx?action=send-chat empty text rejected safely', async () => {
    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=send-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'VERIFYREADONLY', text: '' })
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data || data.ok !== false) throw new Error(`Expected ok === false, got ${JSON.stringify(data)}`);
    return `HTTP 200, ok=false (${data.message})`;
  });

  console.log(`=== Výsledek: ${passed} PASS, ${failed} FAIL ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
