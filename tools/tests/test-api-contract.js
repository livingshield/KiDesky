#!/usr/bin/env node
/**
 * KiDesky Etapa 6 — Regression Suite: API Contract, Routing & Security Guards
 * Modes:
 *   node tools/tests/test-api-contract.js          (local static + csc compilation)
 *   node tools/tests/test-api-contract.js --live   (also runs live API security + 4C handler suite)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LIVE = process.argv.includes('--live');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walkJsFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkJsFiles(full, out);
    else if (e.name.endsWith('.js')) out.push(full);
  }
  return out;
}

function runSubScript(relScript, args = []) {
  const full = path.join(ROOT, relScript);
  execFileSync(process.execPath, [full, ...args], {
    cwd: ROOT,
    stdio: 'inherit'
  });
}

function main() {
  console.log(`=== KiDesky Regression: API Contract & Security (${LIVE ? 'LOCAL + LIVE' : 'LOCAL'}) ===`);
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

  runTest('1. C# backend compile (KiDeskyCore.cs + 5 .ashx, /warnaserror+, 0 secrets)', () => {
    runSubScript('tools/test-backend-compile.js');
    return 'compiled cleanly';
  });

  runTest('2. 100% frontend PRS_Api actions registered in api.ashx router', () => {
    const apiTxt = fs.readFileSync(path.join(ROOT, 'api.ashx'), 'utf8');
    const backendRoutes = new Set(['hello', 'status', 'default']);
    for (const m of apiTxt.matchAll(/\{\s*"([a-z0-9_\-]+)"\s*,\s*"api-/gi)) {
      backendRoutes.add(m[1]);
    }

    const jsFiles = walkJsFiles(path.join(ROOT, 'js'));
    const frontendActions = new Set();
    for (const jf of jsFiles) {
      const txt = fs.readFileSync(jf, 'utf8');
      for (const m of txt.matchAll(/PRS_Api\.(?:get|post|upload)\(\s*['"]([a-z0-9_\-]+)['"]/gi)) {
        frontendActions.add(m[1]);
      }
    }

    assert(frontendActions.size >= 30, `Unexpectedly low PRS_Api actions count: ${frontendActions.size}`);
    const missing = [...frontendActions].filter(a => !backendRoutes.has(a));
    assert(missing.length === 0, `Frontend actions missing in api.ashx: ${missing.join(', ')}`);
    return `${frontendActions.size} frontend actions mapped across ${backendRoutes.size} backend routes`;
  });

  runTest('3. web.config security headers, hiddenSegments & WebP MIME enforced', () => {
    const webCfg = fs.readFileSync(path.join(ROOT, 'web.config'), 'utf8');
    assert(/<customErrors\s+mode="RemoteOnly"/i.test(webCfg), 'Missing customErrors mode="RemoteOnly"');
    assert(/<hiddenSegments>[\s\S]*?<add\s+segment="backend"/i.test(webCfg), 'Missing hiddenSegments for backend');
    assert(/name="X-Content-Type-Options"\s+value="nosniff"/i.test(webCfg), 'Missing X-Content-Type-Options nosniff');
    assert(/name="X-Frame-Options"\s+value="SAMEORIGIN"/i.test(webCfg), 'Missing X-Frame-Options SAMEORIGIN');
    assert(/name="Cross-Origin-Opener-Policy"\s+value="same-origin-allow-popups"/i.test(webCfg), 'Missing Cross-Origin-Opener-Policy');
    assert(/fileExtension="\.webp"\s+mimeType="image\/webp"/i.test(webCfg), 'Missing .webp MIME mapping');
    return 'RemoteOnly, hiddenSegments(backend), COOP, headers & WebP MIME verified';
  });

  runTest('4. api-auth.ashx hardening (no admin-prefix escalation or unverified Base64 JWT)', () => {
    const authTxt = fs.readFileSync(path.join(ROOT, 'api-auth.ashx'), 'utf8');
    assert(!/StartsWith\(\s*"admin"/i.test(authTxt), 'Forbidden StartsWith("admin") role escalation found!');
    assert(!/FromBase64String/i.test(authTxt), 'Forbidden unverified Base64 JWT decoding found!');
    assert(/oauth2\.googleapis\.com\/tokeninfo\?id_token=/i.test(authTxt), 'Missing Google tokeninfo verification');
    return 'tokeninfo verification active, 0 bypass regressions';
  });

  if (LIVE) {
    runTest('5. LIVE API security smoke (tools/test-api-security.js)', () => {
      runSubScript('tools/test-api-security.js');
      return 'live security assertions passed';
    });

    runTest('6. LIVE backend handler & routing checks (tools/test-etapa4c.js --live)', () => {
      runSubScript('tools/test-etapa4c.js', ['--live']);
      return 'live handler & CORS checks passed';
    });
  }

  console.log(`\n=== Výsledek test-api-contract: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exit(1);
}

main();
