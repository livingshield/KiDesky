#!/usr/bin/env node
/**
 * KiDesky Etapa 6 — Regression Suite: 10 Deterministic AI-vs-AI Game Simulations
 * Uses seeded Mulberry32 PRNG inside isolated Node VM sandboxes:
 *  - Runs 10 complete matches (up to GAME_OVER or 400 bot turns) across built-in & procedural boards and scenarios
 *  - Checks per-turn player/state invariants (gold, non-negative hearts, valid nodeId)
 *  - Invokes getRoyalAdvisorAdvice() on every turn to prevent HUD regressions (e.g. PRISON undefined rent)
 *  - Verifies bit-exact determinism for identical PRNG + board seeds
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');

const BOT_POOL = [
  { name: 'Černý Baron', type: 'Bot_Aggressive' },
  { name: 'Rytíř Vyvážený', type: 'Bot_Balanced' },
  { name: 'Zikmund z Chovu', type: 'Bot_Breeder' },
  { name: 'Kněžna Eliška', type: 'Bot_Noble' }
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function makeMulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createSimulationSandbox(prngSeed) {
  const rng = makeMulberry32(prngSeed);
  const seededMath = Object.create(Math);
  seededMath.random = rng;

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
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    PRS_App: {
      selectedMovementMode: 'standard',
      escapeHtml(s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }
    },
    addEventListener() {},
    dispatchEvent() {},
    CustomEvent: function (n, o) { this.type = n; this.detail = o ? o.detail : null; },
    console
  };
  win.window = win;

  const ctx = vm.createContext({
    window: win,
    document: doc,
    navigator: win.navigator,
    localStorage: win.localStorage,
    PRS_App: win.PRS_App,
    CustomEvent: win.CustomEvent,
    console,
    Math: seededMath,
    Date,
    JSON,
    Array,
    Object,
    Number,
    String,
    parseInt,
    parseFloat,
    isNaN,
    setTimeout,
    clearTimeout
  });

  const files = [
    'js/i18n/languages.js',
    'js/core/module-loader.js',
    'js/i18n/cs.js',
    'js/app-i18n.js',
    'js/game-data.js',
    'js/boards/boards-decor-catalog.js',
    'js/boards/boards-geometry.js',
    'js/boards/boards-generator.js',
    'js/boards/boards-builder.js',
    'js/boards/boards-presets.js',
    'js/engine/engine-state.js',
    'js/engine/engine-movement.js',
    'js/engine/engine-economy.js',
    'js/engine/engine-actions.js',
    'js/game-combat-ai.js',
    'js/hud/hud-advisor.js'
  ];
  for (const rel of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  }
  return win;
}

function assertStepInvariants(win, state, label) {
  assert(state && Array.isArray(state.players) && state.players.length >= 2, `${label}: invalid players`);
  assert(Number.isFinite(state.roundNumber) && state.roundNumber >= 1, `${label}: invalid roundNumber ${state.roundNumber}`);
  assert(Number.isFinite(state.turnNumber) && state.turnNumber >= 0, `${label}: invalid turnNumber ${state.turnNumber}`);

  const nodeCount = state.board.nodes.length;
  for (const p of state.players) {
    assert(Number.isFinite(p.gold), `${label}: non-finite gold for ${p.name}: ${p.gold}`);
    assert(Number.isFinite(p.totalHearts) && p.totalHearts >= 0, `${label}: invalid hearts for ${p.name}: ${p.totalHearts}`);
    assert(Number.isInteger(p.nodeId) && p.nodeId >= 0 && p.nodeId < nodeCount, `${label}: invalid nodeId ${p.nodeId}`);
  }

  // Exercise Royal Advisor on the active player at current step
  const curPlayer = state.players[state.currentPlayerIndex || 0];
  const curNode = state.board.nodes[curPlayer.nodeId];
  win.PRS_App.state = state;
  win.PRS_App.getRoyalAdvisorAdvice(curPlayer, state.phase, state.pendingAction, curNode);
}

function runMatch(spec, maxSteps = 400) {
  const win = createSimulationSandbox(spec.prngSeed);
  const engine = win.PRS_GameEngine;
  const players = BOT_POOL.slice(0, spec.botCount || 4);
  const createOpts = {
    boardCode: spec.boardCode,
    scenario: spec.scenario,
    difficultyMode: spec.difficultyMode || 'standard',
    players
  };
  if (spec.seed !== undefined) createOpts.seed = spec.seed;
  if (spec.customRecipe) createOpts.customRecipe = spec.customRecipe;

  const state = engine.createGame(createOpts);
  assertStepInvariants(win, state, `${spec.label} init`);

  let step = 0;
  while (state.phase !== 'GAME_OVER' && step < maxSteps) {
    engine.executeBotTurn(state);
    step++;
    assertStepInvariants(win, state, `${spec.label} step ${step}`);
  }

  assert(state.turnNumber >= 20, `${spec.label}: expected turnNumber >= 20, got ${state.turnNumber}`);
  return {
    state,
    step,
    snapshot: {
      roundNumber: state.roundNumber,
      turnNumber: state.turnNumber,
      phase: state.phase,
      players: state.players.map(p => ({ nodeId: p.nodeId, gold: p.gold, totalHearts: p.totalHearts }))
    }
  };
}

function main() {
  console.log('=== KiDesky Regression: 10 Deterministic AI-vs-AI Simulations ===');

  const specs = [
    { label: '01. classic_96 (classic, 4 bots)', boardCode: 'classic_96', scenario: 'classic', botCount: 4, prngSeed: 101 },
    { label: '02. classic_96 (slayer, 4 bots)', boardCode: 'classic_96', scenario: 'slayer', botCount: 4, prngSeed: 202 },
    { label: '03. classic_96 (tycoon, 3 bots)', boardCode: 'classic_96', scenario: 'tycoon', botCount: 3, prngSeed: 303 },
    { label: '04. dragon_4598 (slayer, 3 bots)', boardCode: 'dragon_4598', scenario: 'slayer', botCount: 3, prngSeed: 404 },
    { label: '05. dragon_4598 (classic, 4 bots)', boardCode: 'dragon_4598', scenario: 'classic', botCount: 4, prngSeed: 505 },
    { label: '06. compact_48 (sprint, 2 bots)', boardCode: 'compact_48', scenario: 'sprint', botCount: 2, prngSeed: 606 },
    { label: '07. compact_48 (classic, 3 bots)', boardCode: 'compact_48', scenario: 'classic', botCount: 3, prngSeed: 707 },
    { label: '08. proc dual #4599 (classic, 4 bots)', boardCode: 'custom_dynamic', seed: 4599, customRecipe: { seed: 4599, riverMode: 'dual', castles: 3, towns: 6, villages: 8, questsU3: 2 }, scenario: 'classic', botCount: 4, prngSeed: 808 },
    { label: '09. proc delta #8123 (slayer, 4 bots)', boardCode: 'custom_dynamic', seed: 8123, customRecipe: { seed: 8123, riverMode: 'delta', castles: 2, towns: 5, villages: 10, questsU3: 2 }, scenario: 'slayer', botCount: 4, prngSeed: 909 },
    { label: '10. proc single #1337 (tycoon, 3 bots)', boardCode: 'custom_dynamic', seed: 1337, customRecipe: { seed: 1337, riverMode: 'single', castles: 2, towns: 4, villages: 6, questsU3: 1 }, scenario: 'tycoon', botCount: 3, prngSeed: 1010 }
  ];

  let pass = 0;
  let fail = 0;

  for (const spec of specs) {
    try {
      const { step, snapshot } = runMatch(spec, 400);
      console.log(`[PASS] ${spec.label} — steps=${step}, rounds=${snapshot.roundNumber}, turns=${snapshot.turnNumber}, phase=${snapshot.phase}`);
      pass++;
    } catch (err) {
      console.error(`[FAIL] ${spec.label} — ${err.message}`);
      fail++;
    }
  }

  // Determinism check on 50 steps of dual #4599
  try {
    const detSpec = { ...specs[7], prngSeed: 123456 };
    const r1 = runMatch(detSpec, 50);
    const r2 = runMatch(detSpec, 50);
    assert(JSON.stringify(r1.snapshot) === JSON.stringify(r2.snapshot), 'Determinism mismatch between identical runs!');
    console.log(`[PASS] 11. Bit-exact determinism check (dual #4599, 50 steps) — turns=${r1.snapshot.turnNumber}, round=${r1.snapshot.roundNumber}`);
    pass++;
  } catch (err) {
    console.error(`[FAIL] 11. Bit-exact determinism check — ${err.message}`);
    fail++;
  }

  console.log(`\n=== Výsledek test-engine-simulation: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exit(1);
}

main();
