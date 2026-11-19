#!/usr/bin/env node
/**
 * KiDesky Backend Security & Public Flow Smoke Tests (non-destructive)
 * Verifies auth enforcement, Google JWT signature rejection, CORS whitelist,
 * security headers, and public guest endpoints against live or target URL.
 */
'use strict';

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

function b64Url(obj) {
  return Buffer.from(JSON.stringify(obj), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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
  console.log(`=== KiDesky API Security & Contract Test (${baseUrl}) ===`);

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

  // 1. Status endpoint
  await test('1. GET api.ashx?action=status', async () => {
    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=status`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data || data.ok !== true) throw new Error('Expected ok === true');
    return `HTTP 200, dbConnected=${data.dbConnected}`;
  });

  // 2. Unauthenticated calls to protected endpoints -> HTTP 401 + ok === false
  const protectedCalls = [
    { action: 'admin-list-users', method: 'GET' },
    { action: 'session-me', method: 'GET' },
    { action: 'admin-update-user', method: 'POST', body: { id: 999999, role: 'Admin' } },
    { action: 'admin-reset-password', method: 'POST', body: { id: 999999, newPassword: 'test' } },
    { action: 'admin-delete-user', method: 'POST', body: { id: 999999 } },
    { action: 'save-config', method: 'POST', body: { configJson: '{}' } },
    { action: 'upload-video', method: 'POST', body: {} },
    { action: 'upload-audio', method: 'POST', body: {} },
    { action: 'award-credits', method: 'POST', body: { username: 'admin', amount: 100 } },
    { action: 'unlock-pawn', method: 'POST', body: { pawnId: 'prem_dragon_lord' } },
    { action: 'update_nickname', method: 'POST', body: { displayName: 'Hacker' } },
    { action: 'record-game-stats', method: 'POST', body: { isWin: true } }
  ];

  for (const call of protectedCalls) {
    await test(`2. Unauth ${call.method} ${call.action} -> 401`, async () => {
      const opts = { method: call.method, cache: 'no-store' };
      if (call.method === 'POST') {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(call.body || {});
      }
      const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=${encodeURIComponent(call.action)}`, opts);
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      const data = await res.json();
      if (!data || data.ok !== false) throw new Error(`Expected ok === false, got ${JSON.stringify(data)}`);
      return `HTTP 401 (${data.code || data.status})`;
    });
  }

  // 3. Forged unsigned Google JWT rejection
  await test('3. Forged unsigned Google JWT rejected', async () => {
    const fakeHeader = b64Url({ alg: 'none', typ: 'JWT' });
    const fakePayload = b64Url({
      iss: 'https://accounts.google.com',
      aud: '335921016939-afepn3s6mpsep890pjr08bli6ufj0jub.apps.googleusercontent.com',
      sub: '12345',
      email: 'jan.kytyr@seznam.cz',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600
    });
    const forgedJwt = `${fakeHeader}.${fakePayload}.fakesig`;

    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: forgedJwt })
    });
    if (res.status !== 401 && res.status !== 400) {
      throw new Error(`Expected HTTP 401 or 400, got ${res.status}`);
    }
    const data = await res.json();
    if (!data || data.ok !== false) throw new Error('Expected ok === false for forged JWT');
    return `HTTP ${res.status} rejected (${data.message})`;
  });

  // 4. CORS whitelist check
  await test('4. CORS rejects untrusted Origin https://evil.example', async () => {
    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=status`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil.example',
        'Access-Control-Request-Method': 'POST'
      }
    });
    const acao = res.headers.get('access-control-allow-origin');
    if (acao === '*' || (acao && acao.toLowerCase().includes('evil.example'))) {
      throw new Error(`Unsafe Access-Control-Allow-Origin returned: ${acao}`);
    }
    return `HTTP ${res.status}, ACAO=${acao || '<absent>'}`;
  });

  // 5. Security headers on index.html
  await test('5. Security headers on GET index.html', async () => {
    const res = await fetchWithTimeout(`${baseUrl}index.html`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const nosniff = (res.headers.get('x-content-type-options') || '').toLowerCase();
    if (nosniff !== 'nosniff') {
      throw new Error(`Missing or invalid X-Content-Type-Options: ${nosniff || '<absent>'}`);
    }
    const coop = (res.headers.get('cross-origin-opener-policy') || '').toLowerCase();
    if (coop !== 'same-origin-allow-popups') {
      throw new Error(`Missing or invalid Cross-Origin-Opener-Policy: ${coop || '<absent>'}`);
    }
    return `HTTP 200, X-Content-Type-Options=${nosniff}, COOP=${coop}`;
  });

  // 6. Public guest endpoints remain operational
  const guestEndpoints = ['list-sessions', 'list-videos', 'list-audio', 'list-board-templates'];
  for (const action of guestEndpoints) {
    await test(`6. Public guest GET ${action}`, async () => {
      const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=${action}`, { cache: 'no-store' });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      if (!data || data.ok !== true) throw new Error(`Expected ok === true, got ${JSON.stringify(data).slice(0, 120)}`);
      return 'HTTP 200, valid JSON ok=true';
    });
  }

  // 7. Login query schema integrity regression (invalid creds -> HTTP 401, never HTTP 500)
  await test('7. POST api.ashx?action=login schema query returns 401 (no 500)', async () => {
    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '__nonexistent_probe_xyz__', password: 'wrong' })
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    const data = await res.json();
    if (!data || data.ok !== false) throw new Error(`Expected ok === false, got ${JSON.stringify(data)}`);
    return `HTTP 401 (${data.status})`;
  });

  console.log(`=== Výsledek: ${passed} PASS, ${failed} FAIL ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
