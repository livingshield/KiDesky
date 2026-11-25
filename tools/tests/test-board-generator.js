#!/usr/bin/env node
/**
 * KiDesky Etapa 6 — Regression Suite: Board Presets & Procedural Generator Invariants
 * Verifies 3 built-in boards and 8 procedural dynamic maps across all river modes & seeds:
 *  - Finite coordinates within 1400x860 canvas
 *  - Valid graph exits & 100% BFS reachability from node 0
 *  - Minimum inter-node clearance (>= 25px preset, >= 35px procedural)
 *  - River mode counts & finite bridge coordinates
 *  - Normalized .webp landmark assets (no _flip/.png/.jpg) & valid decoration catalog IDs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function loadEngineSandbox() {
  const doc = { documentElement: { lang: 'cs' } };
  const win = {
    document: doc,
    navigator: { language: 'cs-CZ' },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    console
  };
  win.window = win;

  const ctx = vm.createContext({
    window: win,
    document: doc,
    navigator: win.navigator,
    localStorage: win.localStorage,
    console,
    Math,
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
    'js/core/module-loader.js',
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
  for (const rel of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  }
  return win;
}

function assertBoardInvariants(win, board, spec) {
  assert(board && Array.isArray(board.nodes) && board.nodes.length >= 20, `${spec.label}: invalid nodes array`);
  const nLen = board.nodes.length;

  // 1. Finite node coordinates & 2. Valid exits
  for (let i = 0; i < nLen; i++) {
    const nd = board.nodes[i];
    assert(Number.isFinite(nd.x) && nd.x >= 0 && nd.x <= 1400, `${spec.label}: node ${i} x out of bounds (${nd.x})`);
    assert(Number.isFinite(nd.y) && nd.y >= 0 && nd.y <= 860, `${spec.label}: node ${i} y out of bounds (${nd.y})`);

    const exits = [];
    if (Array.isArray(nd.next)) exits.push(...nd.next);
    if (nd.branchLow !== null && nd.branchLow !== undefined) exits.push(nd.branchLow);
    if (nd.branchHigh !== null && nd.branchHigh !== undefined) exits.push(nd.branchHigh);
    assert(exits.length >= 1, `${spec.label}: dead-end node ${i} (${nd.code})`);
    for (const targetId of exits) {
      assert(Number.isInteger(targetId) && targetId >= 0 && targetId < nLen, `${spec.label}: node ${i} points to invalid target ${targetId}`);
    }
  }

  // 3. BFS 100% reachability from start node 0
  const visited = new Set([0]);
  const queue = [0];
  while (queue.length > 0) {
    const cur = queue.shift();
    const nd = board.nodes[cur];
    const outs = [...(nd.next || [])];
    if (nd.branchLow !== null && nd.branchLow !== undefined) outs.push(nd.branchLow);
    if (nd.branchHigh !== null && nd.branchHigh !== undefined) outs.push(nd.branchHigh);
    for (const nxt of outs) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
  }
  assert(visited.size === nLen, `${spec.label}: BFS reached ${visited.size}/${nLen} nodes`);

  // 4. Minimum spacing between nodes
  let minDist = Infinity;
  let minPair = '';
  for (let i = 0; i < nLen; i++) {
    for (let j = i + 1; j < nLen; j++) {
      const d = Math.hypot(board.nodes[i].x - board.nodes[j].x, board.nodes[i].y - board.nodes[j].y);
      if (d < minDist) {
        minDist = d;
        minPair = `${i}-${j}`;
      }
    }
  }
  const minThreshold = spec.isProcedural ? 35 : 25;
  assert(minDist >= minThreshold, `${spec.label}: node spacing ${minDist.toFixed(1)}px (${minPair}) < ${minThreshold}px`);

  // 5. Rivers & bridges
  const rivers = board.rivers || [];
  if (spec.riverMode === 'none') assert(rivers.length === 0, `${spec.label}: expected 0 rivers for none, got ${rivers.length}`);
  else if (spec.riverMode === 'single') assert(rivers.length === 1, `${spec.label}: expected 1 river for single, got ${rivers.length}`);
  else if (spec.riverMode === 'dual') assert(rivers.length === 2, `${spec.label}: expected 2 rivers for dual, got ${rivers.length}`);
  else if (spec.riverMode === 'delta') assert(rivers.length >= 2, `${spec.label}: expected >= 2 rivers for delta, got ${rivers.length}`);

  const bridges = board.bridges || [];
  for (let bi = 0; bi < bridges.length; bi++) {
    const br = bridges[bi];
    assert(Number.isFinite(br.x) && br.x >= 0 && br.x <= 1400, `${spec.label}: bridge ${bi} x invalid (${br.x})`);
    assert(Number.isFinite(br.y) && br.y >= 0 && br.y <= 860, `${spec.label}: bridge ${bi} y invalid (${br.y})`);
  }

  // 6. Landmarks (>= 2 incl. royalCastle, finite geometry, normalized .webp assets)
  const landmarks = board.landmarks || [];
  assert(landmarks.length >= 2, `${spec.label}: expected >= 2 landmarks, got ${landmarks.length}`);
  assert(landmarks.some(l => l && l.id === 'royalCastle'), `${spec.label}: missing royalCastle landmark`);
  for (const lm of landmarks) {
    assert(Number.isFinite(lm.x) && Number.isFinite(lm.y) && Number.isFinite(lm.w) && Number.isFinite(lm.h), `${spec.label}: landmark ${lm.id} invalid geometry`);
    const imgUrl = lm.image || lm.img || '';
    if (imgUrl) {
      assert(!/_flip\./i.test(imgUrl) && !/\.(png|jpe?g)(\?|$)/i.test(imgUrl), `${spec.label}: unnormalized landmark image ${imgUrl}`);
      assert(/\.webp(\?|$)/i.test(imgUrl), `${spec.label}: landmark image should be .webp (${imgUrl})`);
    }
  }

  // 7. Decorations & Phase 3 landscape invariants
  const decors = board.decorations || [];
  assert(decors.length > 0, `${spec.label}: decorations list is empty`);
  const catalog = win.PRS_DECOR_CATALOG || {};
  const builder = win.PRS_BoardBuilder || {};
  const roadSamples = (typeof builder.sampleRoadCorridor === 'function') ? builder.sampleRoadCorridor(board.nodes) : [];
  const uniquePoiSet = new Set(builder.UNIQUE_POI_IDS || []);
  const uniqueCounts = {};
  const itemCounts = {};
  const treeSet = new Set(['tree_oak', 'tree_pine', 'tree_birch', 'grove_oak', 'grove_pine', 'grove_pine2']);
  const trees = [];
  let prevSortMetrics = null;

  for (let di = 0; di < decors.length; di++) {
    const dec = decors[di];
    const catItem = catalog[dec.catalogId];
    assert(dec.catalogId && catItem, `${spec.label}: decoration[${di}] unknown catalogId "${dec.catalogId}"`);
    assert(Number.isFinite(dec.x) && Number.isFinite(dec.y), `${spec.label}: decoration[${di}] non-finite coords`);

    itemCounts[dec.catalogId] = (itemCounts[dec.catalogId] || 0) + 1;
    if (typeof catItem.maxPerMap === 'number') {
      assert(itemCounts[dec.catalogId] <= catItem.maxPerMap, `${spec.label}: "${dec.catalogId}" appeared ${itemCounts[dec.catalogId]}x > maxPerMap ${catItem.maxPerMap}`);
    }
    if (dec.zone) {
      assert(Array.isArray(catItem.biomes) && catItem.biomes.includes(dec.zone), `${spec.label}: decoration "${dec.catalogId}" placed in disallowed biome "${dec.zone}" (allowed: ${catItem.biomes.join(',')})`);
    }
    if (typeof win.PRS_getDecorSortMetrics === 'function') {
      const curSort = win.PRS_getDecorSortMetrics(dec, catalog);
      if (prevSortMetrics) {
        const sortedOk = prevSortMetrics.layerRank < curSort.layerRank ||
          (prevSortMetrics.layerRank === curSort.layerRank && prevSortMetrics.footY <= curSort.footY + 0.01);
        assert(sortedOk, `${spec.label}: decoration[${di}] ${dec.catalogId} out of (layer, footY) order: prev=(${prevSortMetrics.layerRank},${prevSortMetrics.footY}) cur=(${curSort.layerRank},${curSort.footY})`);
      }
      prevSortMetrics = curSort;
    }

    if (uniquePoiSet.has(dec.catalogId)) {
      uniqueCounts[dec.catalogId] = (uniqueCounts[dec.catalogId] || 0) + 1;
      assert(uniqueCounts[dec.catalogId] <= 1, `${spec.label}: unique POI "${dec.catalogId}" appeared ${uniqueCounts[dec.catalogId]}x (max 1)`);
    }
    for (let ni = 0; ni < nLen; ni++) {
      const nd = board.nodes[ni];
      const ndDist = Math.hypot(dec.x - nd.x, dec.y - nd.y);
      assert(ndDist >= 34, `${spec.label}: decoration ${dec.catalogId}@(${dec.x},${dec.y}) too close to node ${ni}: ${ndDist.toFixed(1)}px < 34px`);
    }
    const minAvoidRoad = (catItem.roadPolicy === 'avoid')
      ? Math.max(34, Math.round(Math.max(dec.w || 60, dec.h || 60) * 0.44) + 10)
      : (catItem.roadPolicy === 'overhang' ? 38 : 34);
    for (let ri = 0; ri < roadSamples.length; ri++) {
      const rDist = Math.hypot(dec.x - roadSamples[ri].x, dec.y - roadSamples[ri].y);
      assert(rDist >= minAvoidRoad, `${spec.label}: decoration ${dec.catalogId}@(${dec.x},${dec.y}) (${catItem.roadPolicy}) intrudes on road clearing: ${rDist.toFixed(1)}px < ${minAvoidRoad}px`);
    }
    if (treeSet.has(dec.catalogId)) {
      trees.push(dec);
    }
  }

  assert(trees.length > 0, `${spec.label}: expected forest tree/grove decorations`);
  let totalNeighbors = 0;
  for (let ti = 0; ti < trees.length; ti++) {
    let nb = 0;
    for (let tj = 0; tj < trees.length; tj++) {
      if (ti === tj) continue;
      if (Math.hypot(trees[ti].x - trees[tj].x, trees[ti].y - trees[tj].y) <= 75) nb++;
    }
    totalNeighbors += nb;
  }
  const avgTreeNeighbors = totalNeighbors / trees.length;
  assert(avgTreeNeighbors >= 2.0, `${spec.label}: forest clustering avg neighbors ${avgTreeNeighbors.toFixed(2)} < 2.0`);

  return `nodes=${nLen}, reach=${visited.size}/${nLen}, minDist=${minDist.toFixed(1)}px, rivers=${rivers.length}, bridges=${bridges.length}, landmarks=${landmarks.length}, decors=${decors.length}, treeNb=${avgTreeNeighbors.toFixed(1)}`;
}

function validateCatalogPlacementSchema(win) {
  const cat = win.PRS_DECOR_CATALOG || {};
  const keys = Object.keys(cat);
  const validBiomes = new Set(['forest', 'rocky', 'wetland', 'farmland', 'meadow']);
  const validLayers = new Set(['ground', 'standing']);
  const validPolicies = new Set(['avoid', 'edge', 'overhang']);
  const validGroups = new Set(['canopy', 'ridge', 'exclusive']);
  assert(keys.length >= 49, `Catalog should have at least 49 entries, got ${keys.length}`);
  for (const id of keys) {
    const it = cat[id];
    assert(Array.isArray(it.biomes) && it.biomes.length > 0 && it.biomes.every(b => validBiomes.has(b)), `${id}: invalid biomes`);
    assert(validLayers.has(it.layer), `${id}: invalid layer "${it.layer}"`);
    assert(typeof it.anchorY === 'number' && it.anchorY >= 0 && it.anchorY <= 0.6, `${id}: invalid anchorY ${it.anchorY}`);
    assert(validPolicies.has(it.roadPolicy), `${id}: invalid roadPolicy "${it.roadPolicy}"`);
    assert(it.maxPerMap === null || (Number.isInteger(it.maxPerMap) && it.maxPerMap >= 1), `${id}: invalid maxPerMap ${it.maxPerMap}`);
    assert(validGroups.has(it.overlapGroup), `${id}: invalid overlapGroup "${it.overlapGroup}"`);
    assert(typeof it.weight === 'number' && it.weight > 0, `${id}: invalid weight ${it.weight}`);
  }
  return keys.length;
}

function main() {
  console.log('=== KiDesky Regression: Board Presets & Procedural Generator ===');
  const win = loadEngineSandbox();
  const catCount = validateCatalogPlacementSchema(win);
  console.log(`[PASS] Catalog schema: ${catCount} items validated (biomes/layer/anchorY/roadPolicy/maxPerMap/overlapGroup/weight)`);
  const engine = win.PRS_GameEngine;
  const players = [
    { name: 'Rytíř A', type: 'Bot_Balanced' },
    { name: 'Rytíř B', type: 'Bot_Aggressive' }
  ];

  const boardSpecs = [
    { label: 'Preset: classic_96', isProcedural: false, riverMode: 'single', opts: { boardCode: 'classic_96' } },
    { label: 'Preset: dragon_4598', isProcedural: false, riverMode: 'single', opts: { boardCode: 'dragon_4598' } },
    { label: 'Preset: compact_48', isProcedural: false, riverMode: 'single', opts: { boardCode: 'compact_48' } },
    { label: 'Procedural: dual #4599', isProcedural: true, riverMode: 'dual', opts: { boardCode: 'custom_dynamic', seed: 4599, customRecipe: { seed: 4599, riverMode: 'dual', castles: 3, towns: 6, villages: 8, questsU3: 2 } } },
    { label: 'Procedural: dual #2026', isProcedural: true, riverMode: 'dual', opts: { boardCode: 'custom_dynamic', seed: 2026, customRecipe: { seed: 2026, riverMode: 'dual', castles: 2, towns: 5, villages: 8, questsU3: 2 } } },
    { label: 'Procedural: delta #8123', isProcedural: true, riverMode: 'delta', opts: { boardCode: 'custom_dynamic', seed: 8123, customRecipe: { seed: 8123, riverMode: 'delta', castles: 2, towns: 5, villages: 10, questsU3: 2 } } },
    { label: 'Procedural: delta #9001', isProcedural: true, riverMode: 'delta', opts: { boardCode: 'custom_dynamic', seed: 9001, customRecipe: { seed: 9001, riverMode: 'delta', castles: 3, towns: 5, villages: 7, questsU3: 2 } } },
    { label: 'Procedural: single #1337', isProcedural: true, riverMode: 'single', opts: { boardCode: 'custom_dynamic', seed: 1337, customRecipe: { seed: 1337, riverMode: 'single', castles: 2, towns: 4, villages: 6, questsU3: 1 } } },
    { label: 'Procedural: single #31415', isProcedural: true, riverMode: 'single', opts: { boardCode: 'custom_dynamic', seed: 31415, customRecipe: { seed: 31415, riverMode: 'single', castles: 2, towns: 6, villages: 8, questsU3: 2 } } },
    { label: 'Procedural: none #777', isProcedural: true, riverMode: 'none', opts: { boardCode: 'custom_dynamic', seed: 777, customRecipe: { seed: 777, riverMode: 'none', castles: 2, towns: 4, villages: 6, questsU3: 1 } } },
    { label: 'Procedural: none #65432', isProcedural: true, riverMode: 'none', opts: { boardCode: 'custom_dynamic', seed: 65432, customRecipe: { seed: 65432, riverMode: 'none', castles: 3, towns: 5, villages: 9, questsU3: 2 } } }
  ];

  let pass = 0;
  let fail = 0;
  for (const spec of boardSpecs) {
    try {
      const state = engine.createGame({ ...spec.opts, players });
      const detail = assertBoardInvariants(win, state.board, spec);
      console.log(`[PASS] ${spec.label} — ${detail}`);
      pass++;
    } catch (err) {
      console.error(`[FAIL] ${spec.label} — ${err.message}`);
      fail++;
    }
  }

  // Determinism check for procedural decorations & landscape composition
  try {
    const detSpec = boardSpecs.find(s => s.label === 'Procedural: dual #4599');
    const st1 = engine.createGame({ ...detSpec.opts, players });
    const st2 = engine.createGame({ ...detSpec.opts, players });
    assert(JSON.stringify(st1.board.decorations) === JSON.stringify(st2.board.decorations), 'Decoration generation is not bit-exact deterministic for seed #4599');
    console.log(`[PASS] Determinism: dual #4599 decorations identical (${st1.board.decorations.length} items)`);
    pass++;
  } catch (err) {
    console.error(`[FAIL] Determinism: dual #4599 — ${err.message}`);
    fail++;
  }

  console.log(`\n=== Výsledek test-board-generator: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exit(1);
}

main();
