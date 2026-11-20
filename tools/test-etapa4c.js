#!/usr/bin/env node
/**
 * KiDesky Etapa 4C (Backend Modularization) Verification Suite (Local + --live modes)
 * Verifies:
 *  - Local C# compilation via .NET Framework csc.exe (/warnaserror+) for backend/KiDeskyCore.cs & 5 .ashx handlers
 *  - Web.config hiddenSegments protection for backend/, deploy_code_update.ps1 inclusion, appsettings.json Smtp placeholder
 *  - Zero hardcoded SMTP passwords and < 80 KB size ceiling per backend file
 *  - Optional --live verification against https://www.ekobio.org/apps/KiDesky/:
 *      * GET backend/KiDeskyCore.cs blocked (HTTP 403/404, source never exposed)
 *      * api.ashx router delegates cleanly across all 4 domain handlers (status, get-config, get-announcement, hero-video, admin-stats->401, session-me->401)
 *      * Direct smoke checks against api-game.ashx, api-media.ashx, api-auth.ashx, api-admin.ashx
 */
'use strict';

const fs = require('fs');
const path = require('path');
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

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const { live, baseUrl } = parseArgs(process.argv.slice(2));
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      const detail = await fn();
      passed++;
      console.log(`[PASS] ${name}${detail ? ` — ${detail}` : ''}`);
    } catch (err) {
      failed++;
      console.error(`[FAIL] ${name} — ${err.message}`);
    }
  }

  console.log(`=== KiDesky Etapa 4C Backend Verification (${live ? 'LOCAL + LIVE: ' + baseUrl : 'LOCAL'}) ===`);

  // 1. Run C# compilation, route parity, size & secret check
  await test('1. C# backend compile (KiDeskyCore.cs + 5 .ashx), 54 routes, <80 KB & 0 secrets', async () => {
    const out = execFileSync(
      process.execPath,
      [path.join(ROOT, 'tools', 'test-backend-compile.js'), '--require-csc'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    assert(out.includes('compiled KiDeskyCore.cs + 5 .ashx handlers'), 'Missing csc compile confirmation');
    return 'KiDeskyCore.cs + 5 .ashx compiled (/warnaserror+), 54 actions mapped, 0 secrets';
  });

  // 2. Verify web.config, deploy_code_update.ps1 & appsettings.json Smtp placeholder
  await test('2. Config, hiddenSegments & deploy_code_update.ps1 wiring', async () => {
    const webConfig = fs.readFileSync(path.join(ROOT, 'web.config'), 'utf8');
    assert(/<hiddenSegments>[\s\S]*?<add\s+segment="backend"\s*\/>[\s\S]*?<\/hiddenSegments>/i.test(webConfig), 'web.config missing <hiddenSegments><add segment="backend" /></hiddenSegments>');

    const deployPs = fs.readFileSync(path.join(ROOT, 'deploy_code_update.ps1'), 'utf8');
    assert(deployPs.includes('Join-Path $localBase "backend"'), 'deploy_code_update.ps1 missing backend folder scan');

    const appSettings = JSON.parse(fs.readFileSync(path.join(ROOT, 'appsettings.json'), 'utf8'));
    assert(appSettings.Smtp && appSettings.Smtp.Host === 'YOUR_SMTP_HOST' && appSettings.Smtp.Password === 'YOUR_SMTP_PASSWORD', 'appsettings.json missing safe Smtp placeholder');
    return 'web.config blocks backend/, deploy includes backend/*.cs, appsettings.json has Smtp template';
  });

  // Optional --live checks
  if (live) {
    await test('3. LIVE GET backend/KiDeskyCore.cs blocked (403/404)', async () => {
      const res = await fetchWithTimeout(`${baseUrl}backend/KiDeskyCore.cs`, { cache: 'no-store' });
      const body = await res.text();
      assert(res.status === 403 || res.status === 404, `Expected HTTP 403 or 404 for backend/KiDeskyCore.cs, got ${res.status}`);
      assert(!body.includes('namespace KiDesky.Backend'), 'Source code leaked in HTTP response!');
      return `HTTP ${res.status} (hiddenSegments enforced)`;
    });

    const routedChecks = [
      { action: 'status', domain: 'api.ashx (direct)', expectStatus: 200, check: j => j.ok === true && j.dbConnected === true },
      { action: 'get-config', domain: 'api.ashx -> api-game.ashx', expectStatus: 200, check: j => j.status === 'success' && Boolean(j.gameCode) },
      { action: 'get-announcement', domain: 'api.ashx -> api-media.ashx', expectStatus: 200, check: j => j.ok === true },
      { action: 'hero-video', domain: 'api.ashx -> api-media.ashx', expectStatus: 200, check: j => j.ok === true },
      { action: 'session-me', domain: 'api.ashx -> api-auth.ashx', expectStatus: 401, check: j => j.ok === false && j.code === 'AUTH_REQUIRED' },
      { action: 'admin-stats', domain: 'api.ashx -> api-admin.ashx', expectStatus: 401, check: j => j.ok === false && j.code === 'AUTH_REQUIRED' }
    ];

    for (const rc of routedChecks) {
      await test(`4. LIVE GET api.ashx?action=${rc.action} (${rc.domain})`, async () => {
        const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=${rc.action}`, { cache: 'no-store' });
        assert(res.status === rc.expectStatus, `Expected HTTP ${rc.expectStatus}, got ${res.status}`);
        const json = await res.json();
        assert(rc.check(json), `Unexpected JSON payload for action=${rc.action}: ${JSON.stringify(json).slice(0, 120)}`);
        return `HTTP ${res.status}, JSON verified`;
      });
    }

    const directChecks = [
      { endpoint: 'api-game.ashx?action=list-sessions', expectStatus: 200, check: j => j.ok === true },
      { endpoint: 'api-media.ashx?action=list-videos', expectStatus: 200, check: j => j.ok === true },
      { endpoint: 'api-auth.ashx?action=session-me', expectStatus: 401, check: j => j.ok === false && j.code === 'AUTH_REQUIRED' },
      { endpoint: 'api-admin.ashx?action=admin-stats', expectStatus: 401, check: j => j.ok === false && j.code === 'AUTH_REQUIRED' }
    ];

    for (const dc of directChecks) {
      await test(`5. LIVE GET ${dc.endpoint} (direct domain handler + CORS)`, async () => {
        const res = await fetchWithTimeout(`${baseUrl}${dc.endpoint}`, {
          headers: { Origin: 'https://www.ekobio.org' },
          cache: 'no-store'
        });
        assert(res.status === dc.expectStatus, `Expected HTTP ${dc.expectStatus}, got ${res.status}`);
        const acao = res.headers.get('access-control-allow-origin');
        assert(acao === 'https://www.ekobio.org', `Expected single ACAO https://www.ekobio.org, got ${acao}`);
        const json = await res.json();
        assert(dc.check(json), `Unexpected JSON payload for ${dc.endpoint}: ${JSON.stringify(json).slice(0, 120)}`);
        return `HTTP ${res.status}, CORS & JSON verified`;
      });
    }
  }

  console.log(`\n=== Výsledek test-etapa4c: ${passed} PASS, ${failed} FAIL ===`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
