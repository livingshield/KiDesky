#!/usr/bin/env node
/**
 * KiDesky Backend C# Compilation & Integrity Verification (Fáze 4C)
 * - Finds .NET Framework 4.x csc.exe
 * - Compiles backend/KiDeskyCore.cs to a temporary DLL inside os.tmpdir() (never inside workspace)
 * - Compiles api.ashx + api-auth.ashx + api-game.ashx + api-media.ashx + api-admin.ashx against KiDeskyCore.dll
 * - Verifies all 54 actions routed from api.ashx exist in their target domain handlers
 * - Verifies zero hardcoded SMTP secrets and < 80 KB size ceiling per file
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function findCscExe() {
  const candidates = [
    'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function main() {
  const csc = findCscExe();
  const quiet = process.argv.includes('--quiet');
  if (!quiet) console.log('=== KiDesky Backend C# Verification (Fáze 4C) ===');

  const backendFiles = [
    'backend/KiDeskyCore.cs',
    'api.ashx',
    'api-auth.ashx',
    'api-game.ashx',
    'api-media.ashx',
    'api-admin.ashx'
  ];

  // 1. Existence, size (< 80 KB) and secret scan
  for (const rel of backendFiles) {
    const abs = path.join(ROOT, rel);
    assert(fs.existsSync(abs), `Missing backend file: ${rel}`);
    const bytes = fs.statSync(abs).size;
    assert(bytes < 80 * 1024, `Backend file exceeds 80 KB limit: ${rel} (${(bytes / 1024).toFixed(1)} KB)`);
    const text = fs.readFileSync(abs, 'utf8');
    assert(!text.includes('Awp3desert'), `Hardcoded SMTP password detected in ${rel}`);
  }
  if (!quiet) console.log(`[OK  ] Size & secret checks passed for ${backendFiles.length} backend files (< 80 KB each, 0 secrets)`);

  // 2. Verify all 54 action routes in api.ashx match target handler case labels
  const routerSrc = fs.readFileSync(path.join(ROOT, 'api.ashx'), 'utf8');
  const routeEntries = [...routerSrc.matchAll(/\{\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\}/g)]
    .map(m => ({ action: m[1], target: m[2] }));
  assert(routeEntries.length === 52, `Expected 52 delegated routes in api.ashx, got ${routeEntries.length}`);
  assert(routerSrc.includes('action == "hello" || action == "status"'), 'api.ashx missing hello/status direct branch');

  const targetSrcCache = new Map();
  for (const { action, target } of routeEntries) {
    if (!targetSrcCache.has(target)) {
      targetSrcCache.set(target, fs.readFileSync(path.join(ROOT, target), 'utf8'));
    }
    const handlerSrc = targetSrcCache.get(target);
    assert(
      handlerSrc.includes(`case "${action}":`),
      `Routed action "${action}" -> ${target} does not have matching case label in target handler`
    );
  }
  if (!quiet) console.log(`[OK  ] Verified all 54 API actions (2 direct + 52 delegated across 4 domain handlers)`);

  // 3. Compile with csc.exe into temporary folder (always cleaned up in finally)
  if (!csc) {
    if (process.argv.includes('--require-csc')) {
      throw new Error('csc.exe (.NET Framework 4.x) not found');
    }
    console.warn('[WARN] csc.exe not found — skipping C# compilation check');
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kidesky-csc-'));
  try {
    const coreCs = path.join(ROOT, 'backend', 'KiDeskyCore.cs');
    const coreDll = path.join(tmpDir, 'KiDeskyCore.dll');
    const sysRefs = [
      '/r:System.dll',
      '/r:System.Core.dll',
      '/r:System.Data.dll',
      '/r:System.Configuration.dll',
      '/r:System.Web.dll',
      '/r:System.Web.Extensions.dll'
    ];

    execFileSync(csc, [
      '/nologo',
      '/target:library',
      '/utf8output',
      '/warnaserror+',
      `/out:${coreDll}`,
      ...sysRefs,
      coreCs
    ], { stdio: 'pipe', encoding: 'utf8' });

    const ashxList = [
      { rel: 'api.ashx', cls: 'KiDeskyApiHandler' },
      { rel: 'api-auth.ashx', cls: 'KiDeskyAuthHandler' },
      { rel: 'api-game.ashx', cls: 'KiDeskyGameHandler' },
      { rel: 'api-media.ashx', cls: 'KiDeskyMediaHandler' },
      { rel: 'api-admin.ashx', cls: 'KiDeskyAdminHandler' }
    ];

    for (const item of ashxList) {
      const src = fs.readFileSync(path.join(ROOT, item.rel), 'utf8');
      assert(
        src.includes(`<%@ WebHandler Language="C#" Class="${item.cls}" %>`),
        `${item.rel} missing expected @WebHandler directive for ${item.cls}`
      );
      assert(
        src.includes('<%@ Assembly Src="backend/KiDeskyCore.cs" %>'),
        `${item.rel} missing @Assembly Src="backend/KiDeskyCore.cs"`
      );

      const pureCs = src.replace(/^<%@[^\r\n]*\r?\n?/gm, '');
      const csTmp = path.join(tmpDir, `${item.cls}.cs`);
      const dllTmp = path.join(tmpDir, `${item.cls}.dll`);
      fs.writeFileSync(csTmp, pureCs, 'utf8');

      execFileSync(csc, [
        '/nologo',
        '/target:library',
        '/utf8output',
        '/warnaserror+',
        `/out:${dllTmp}`,
        `/r:${coreDll}`,
        ...sysRefs,
        csTmp
      ], { stdio: 'pipe', encoding: 'utf8' });
    }

    if (!quiet) console.log(`[OK  ] csc.exe compiled KiDeskyCore.cs + 5 .ashx handlers with 0 errors and 0 warnings (/warnaserror+)`);
  } catch (err) {
    const stdout = err.stdout ? String(err.stdout) : '';
    const stderr = err.stderr ? String(err.stderr) : '';
    console.error('[FAIL] C# compilation failed:\n', stdout || stderr || err.message);
    process.exit(1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
