#!/usr/bin/env node
/**
 * KiDesky Engine Headless Smoke & Simulation Verification (Etapa 4)
 * Runs pure game engine + AI bot simulations in a clean Node VM with zero DOM rendering:
 *  - Verifies engine boots independently of UI modules (rules/admin/map-editor/hud)
 *  - Runs full AI-vs-AI simulations across all 3 built-in boards (classic_96, dragon_4598, compact_48)
 *  - Compiles 2 procedural dynamic maps (different seeds & river modes) and executes 80+ AI bot turns
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function createHeadlessSandbox() {
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
      _map: {},
      getItem(k) { return Object.prototype.hasOwnProperty.call(this._map, k) ? this._map[k] : null; },
      setItem(k, v) { this._map[k] = String(v); },
      removeItem(k) { delete this._map[k]; }
    },
    addEventListener() {},
    dispatchEvent() {},
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
    clearTimeout
  };
  vm.createContext(sandbox);

  const engineFiles = [
    'js/i18n/languages.js',
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
    'js/game-combat-ai.js'
  ];

  for (const rel of engineFiles) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

function assertValidStateInvariants(state, contextLabel) {
  assert(state && Array.isArray(state.players) && state.players.length >= 2, `${contextLabel}: invalid players`);
  assert(state.board && Array.isArray(state.board.nodes) && state.board.nodes.length >= 20, `${contextLabel}: invalid board nodes`);
  assert(Number.isFinite(state.roundNumber) && state.roundNumber >= 1, `${contextLabel}: invalid roundNumber ${state.roundNumber}`);
  assert(Number.isFinite(state.turnNumber) && state.turnNumber >= 0, `${contextLabel}: invalid turnNumber ${state.turnNumber}`);

  const nodeIds = new Set(state.board.nodes.map(n => n.id));
  for (const p of state.players) {
    assert(Number.isFinite(p.gold), `${contextLabel}: non-finite gold for ${p.name}: ${p.gold}`);
    assert(Number.isFinite(p.totalHearts) && p.totalHearts >= 0, `${contextLabel}: invalid hearts for ${p.name}: ${p.totalHearts}`);
    assert(nodeIds.has(p.nodeId), `${contextLabel}: invalid nodeId ${p.nodeId} for ${p.name}`);
  }
}

function main() {
  console.log('=== KiDesky Engine Smoke & Simulation Verification ===');
  const sb = createHeadlessSandbox();
  const engine = sb.window.PRS_GameEngine;
  const gen = sb.window.KiDeskyMapGenerator;

  assert(engine && typeof engine.createGame === 'function', 'PRS_GameEngine.createGame missing');
  assert(typeof engine.executeBotTurn === 'function', 'PRS_GameEngine.executeBotTurn missing');
  assert(typeof engine.simulateGames === 'function', 'PRS_GameEngine.simulateGames missing');
  assert(gen && typeof gen.compileDynamicRecipe === 'function', 'KiDeskyMapGenerator.compileDynamicRecipe missing');

  const bots = [
    { name: 'Bořivoj (Bot)', type: 'Bot_Aggressive' },
    { name: 'Zikmund (Bot)', type: 'Bot_Breeder' },
    { name: 'Eliška (Bot)', type: 'Bot_Noble' },
    { name: 'Vladislav (Bot)', type: 'Bot_Balanced' }
  ];

  // 1. Simulate complete AI vs AI matches on all 3 built-in boards
  for (const boardCode of ['classic_96', 'dragon_4598', 'compact_48']) {
    const simRes = engine.simulateGames(1, { targetHearts: 20 }, boardCode, { playerCount: 4 });
    assert(simRes && simRes.gamesSimulated === 1, `simulateGames(${boardCode}) did not complete`);
    assert(simRes.avgRounds > 0 && simRes.avgTurns > 0, `simulateGames(${boardCode}) invalid stats: rounds=${simRes.avgRounds}, turns=${simRes.avgTurns}`);
    console.log(`[PASS] Built-in board simulation (${boardCode}) — avgRounds=${simRes.avgRounds}, avgTurns=${simRes.avgTurns}`);
  }

  // 2. Step through createGame + executeBotTurn directly with invariant checks on procedural maps
  const proceduralConfigs = [
    {
      label: 'procedural-dual-4599',
      seed: 459912,
      recipe: {
        seed: 459912,
        riverMode: 'dual',
        castles: 3,
        towns: 6,
        villages: 8,
        questsU3: 2
      }
    },
    {
      label: 'procedural-delta-8123',
      seed: 812345,
      recipe: {
        seed: 812345,
        riverMode: 'delta',
        castles: 2,
        towns: 5,
        villages: 10,
        questsU3: 2
      }
    }
  ];

  for (const cfg of proceduralConfigs) {
    const state = engine.createGame({
      boardCode: 'custom_dynamic',
      customRecipe: cfg.recipe,
      seed: cfg.seed,
      players: bots
    });
    assertValidStateInvariants(state, cfg.label + ' init');

    let step = 0;
    while (state.phase !== 'GAME_OVER' && step < 100) {
      engine.executeBotTurn(state);
      step++;
      assertValidStateInvariants(state, `${cfg.label} step ${step}`);
    }
    assert(state.turnNumber > 0, `${cfg.label}: turnNumber did not advance`);
    console.log(`[PASS] Procedural AI-vs-AI match (${cfg.label}) — steps=${step}, rounds=${state.roundNumber}, turns=${state.turnNumber}, phase=${state.phase}`);
  }

  console.log('=== Výsledek test-engine-smoke: 5 PASS, 0 FAIL ===');
}

try {
  main();
} catch (err) {
  console.error('[FAIL]', err);
  process.exit(1);
}
