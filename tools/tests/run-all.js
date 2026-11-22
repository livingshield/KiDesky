#!/usr/bin/env node
/**
 * KiDesky Unified Regression Runner (Etapa 6)
 * Executes all 8 regression test suites sequentially and prints a timing summary.
 * Usage:
 *   node tools/tests/run-all.js
 *   node tools/tests/run-all.js --live
 */
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const LIVE = process.argv.includes('--live');

const SUITES = [
  { name: 'predeploy-check', script: 'tools/predeploy-check.js', liveArg: false },
  { name: 'test-i18n', script: 'tools/tests/test-i18n.js', liveArg: false },
  { name: 'test-board-generator', script: 'tools/tests/test-board-generator.js', liveArg: false },
  { name: 'test-engine-simulation', script: 'tools/tests/test-engine-simulation.js', liveArg: false },
  { name: 'test-api-contract', script: 'tools/tests/test-api-contract.js', liveArg: true },
  { name: 'test-auth-logout-autosave', script: 'tools/test-auth-logout-autosave.js', liveArg: false },
  { name: 'test-etapa5-assets', script: 'tools/test-etapa5-assets.js', liveArg: true },
  { name: 'test-etapa5b-media', script: 'tools/test-etapa5b-media.js', liveArg: true }
];

function main() {
  console.log(`================================================================`);
  console.log(`  KiDesky Unified Regression Suite (${LIVE ? 'LOCAL + LIVE' : 'LOCAL'})`);
  console.log(`================================================================\n`);

  const results = [];
  for (const s of SUITES) {
    const args = [path.join(ROOT, s.script)];
    if (LIVE && s.liveArg) args.push('--live');

    console.log(`\n>>> Running ${s.script}${args.includes('--live') ? ' --live' : ''} ...`);
    const t0 = Date.now();
    const res = spawnSync(process.execPath, args, {
      cwd: ROOT,
      stdio: 'inherit'
    });
    const elapsedMs = Date.now() - t0;
    const ok = res.status === 0;
    results.push({ name: s.name, ok, elapsedMs });
  }

  console.log(`\n================================================================`);
  console.log(`  SUMMARY (${results.filter(r => r.ok).length}/${results.length} PASSED)`);
  console.log(`================================================================`);
  for (const r of results) {
    const status = r.ok ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${r.name.padEnd(28)} ${String(r.elapsedMs).padStart(6)} ms`);
  }

  const failedCount = results.filter(r => !r.ok).length;
  console.log(`================================================================`);
  process.exit(failedCount > 0 ? 1 : 0);
}

main();
