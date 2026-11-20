#!/usr/bin/env node
/**
 * KiDesky Regression Test: Logout & Ctrl+F5 Autosave Isolation
 * Verifies:
 *  1. Logged-in user autosave stamps ownerKey ("user:<name>").
 *  2. logoutUser() clears live game state, timers, prs_active_autosave, prs_active_online_room,
 *     prs_saved_game, prs_slot_* keys, sessionStorage prs_active_tab and leaves active tab "welcome".
 *  3. Subsequent beforeunload (Ctrl+F5) does NOT rewrite previous player's game back into storage.
 *  4. Guest or another account cannot restore or see the previous account's autosave.
 *  5. Logged-in owner CAN restore their own autosave, and a Guest who plays as Guest CAN restore their own Guest autosave.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function createStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() { return map.size; },
    key(i) { return Array.from(map.keys())[i] || null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(String(k), String(v)); },
    removeItem(k) { map.delete(String(k)); },
    _dump() { return Object.fromEntries(map.entries()); }
  };
}

function createEnv(localSeed = {}, sessionSeed = {}) {
  const listeners = {};
  const localStorage = createStorage(localSeed);
  const sessionStorage = createStorage(sessionSeed);
  const elements = {
    'welcome-resume-game-banner': { style: { display: 'none' } },
    'welcome-resume-game-desc': { innerHTML: '' }
  };
  let replacedUrl = null;

  const doc = {
    documentElement: { lang: 'cs' },
    readyState: 'complete',
    body: { classList: { add() {}, remove() {}, toggle() {} } },
    querySelectorAll() { return []; },
    getElementById(id) { return elements[id] || null; },
    addEventListener(ev, fn) { (listeners['doc:' + ev] = listeners['doc:' + ev] || []).push(fn); },
    dispatchEvent() {}
  };

  const win = {
    document: doc,
    navigator: { language: 'cs-CZ' },
    location: { pathname: '/apps/KiDesky/', search: '?room=ABC123' },
    history: { replaceState(_s, _t, u) { replacedUrl = u; } },
    localStorage,
    sessionStorage,
    addEventListener(ev, fn) { (listeners['win:' + ev] = listeners['win:' + ev] || []).push(fn); },
    dispatchEvent() {},
    CustomEvent: function (name, opts) { this.type = name; this.detail = opts ? opts.detail : null; },
    KiDeskyToast: { show() {} },
    PRS_Api: {
      post() { return Promise.resolve({ ok: true }); },
      clearAuthToken() { localStorage.removeItem('prs_auth_token'); },
      getAuthToken() { return localStorage.getItem('prs_auth_token'); }
    },
    PRS_Audio: { playNotice() {} },
    console
  };
  win.window = win;

  const ctx = vm.createContext({
    window: win,
    document: doc,
    navigator: win.navigator,
    location: win.location,
    history: win.history,
    localStorage,
    sessionStorage,
    CustomEvent: win.CustomEvent,
    PRS_Api: win.PRS_Api,
    PRS_Audio: win.PRS_Audio,
    KiDeskyToast: win.KiDeskyToast,
    alert() {},
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
    clearTimeout,
    setInterval,
    clearInterval
  });

  for (const rel of [
    'js/app.js',
    'js/app/app-profile-cosmetics.js',
    'js/app-online.js',
    'js/app-saves.js'
  ]) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, ctx, { filename: rel });
  }

  // Register stub UI helpers not needed in headless test
  ctx.window.PRS_App.updateUserUI = function () {};
  ctx.window.PRS_App.closeAuthModal = function () {};
  ctx.window.PRS_App.closeAllModals = function () {};
  ctx.window.PRS_App.renderLobbyPlayers = function () {};
  ctx.window.PRS_App.switchTab = function (tabId) {
    this.activeTab = tabId;
    try { sessionStorage.setItem('prs_active_tab', tabId); } catch (e) {}
  };
  ctx.window.PRS_App.sanitizeRestoredState = function () {};

  return {
    app: ctx.window.PRS_App,
    localStorage,
    sessionStorage,
    elements,
    listeners,
    getReplacedUrl: () => replacedUrl
  };
}

function makeSampleState(hostUsername = 'lordkikin') {
  return {
    phase: 'ROLL',
    roundNumber: 4,
    turnNumber: 12,
    currentPlayerIndex: 0,
    roomCode: 'XYZ99',
    hostUsername,
    board: { code: 'classic_96', name: 'Královská divočina', seed: 4599, nodes: [{ id: 0, name: 'Start' }] },
    config: { targetHearts: 30 },
    players: [
      { id: 0, name: 'Lord Kikin', type: 'Human', color: '#ef4444', gold: 900, totalHearts: 8, nodeId: 0 },
      { id: 1, name: 'Černý Baron', type: 'Bot_Aggressive', color: '#3b82f6', gold: 700, totalHearts: 5, nodeId: 0 }
    ]
  };
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${name} — ${err.message}`);
    return false;
  }
}

function main() {
  console.log('=== KiDesky Auth Logout & Ctrl+F5 Autosave Regression Suite ===');
  let ok = true;

  ok &= runTest('1. Logged-in user autosave stamps ownerKey', () => {
    const env = createEnv();
    env.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    env.app.hasGameStarted = true;
    env.app.state = makeSampleState('LordKikin');
    env.app.activeTab = 'board';
    env.app.saveActiveGameAutosave();

    const saved = JSON.parse(env.localStorage.getItem('prs_active_autosave'));
    assert(saved && saved.ownerKey === 'user:lordkikin', `Expected ownerKey "user:lordkikin", got ${saved && saved.ownerKey}`);
  });

  ok &= runTest('2. logoutUser() wipes active game state, room & storage keys and leaves board tab', () => {
    const env = createEnv({
      prs_auth_token: 'tok123',
      prs_active_online_room: 'XYZ99',
      prs_saved_game: '{}',
      prs_slot_XYZ99: '0'
    }, { prs_active_tab: 'board' });
    env.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    env.app.hasGameStarted = true;
    env.app.state = makeSampleState('LordKikin');
    env.app.activeTab = 'board';
    env.app.saveActiveGameAutosave();

    env.app.logoutUser();

    assert(env.app.hasGameStarted === false, 'hasGameStarted should be false after logout');
    assert(env.app.state === null, 'state should be null after logout');
    assert(env.app.currentUser.role === 'Guest', 'currentUser should be Guest after logout');
    assert(env.localStorage.getItem('prs_active_autosave') === null, 'prs_active_autosave not cleared');
    assert(env.localStorage.getItem('prs_active_online_room') === null, 'prs_active_online_room not cleared');
    assert(env.localStorage.getItem('prs_saved_game') === null, 'prs_saved_game not cleared');
    assert(env.localStorage.getItem('prs_slot_XYZ99') === null, 'prs_slot_XYZ99 not cleared');
    assert(env.sessionStorage.getItem('prs_active_tab') === 'welcome', `Expected welcome tab, got ${env.sessionStorage.getItem('prs_active_tab')}`);
    assert(env.getReplacedUrl() === '/apps/KiDesky/', 'Expected ?room= query stripped on logout');
  });

  ok &= runTest('3. Simulated Ctrl+F5 (beforeunload + reload as Guest) after logout does NOT restore previous game', () => {
    const env = createEnv();
    env.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    env.app.hasGameStarted = true;
    env.app.state = makeSampleState('LordKikin');
    env.app.activeTab = 'board';
    env.app.saveActiveGameAutosave();

    env.app.logoutUser();

    // Simulate browser Ctrl+F5 beforeunload handler running from js/app.js
    const simBeforeUnload = function () {
      if (env.app.hasGameStarted && env.app.state && env.app.state.phase !== 'GAME_OVER') {
        env.app.saveActiveGameAutosave();
      }
    };
    simBeforeUnload();

    assert(env.localStorage.getItem('prs_active_autosave') === null, 'beforeunload rewrote autosave after logout!');

    // Fresh reload as unauthenticated Guest with persisted storage
    const reloadEnv = createEnv(env.localStorage._dump(), env.sessionStorage._dump());
    reloadEnv.app.currentUser = { id: null, username: 'Host', displayName: 'Host', role: 'Guest' };
    assert(reloadEnv.app.tryRestoreActiveGameAutosave() === false, 'Guest unexpectedly restored autosave');
    assert(reloadEnv.app.getActiveAutosaveMeta() === null, 'Guest unexpectedly saw active autosave meta');
  });

  ok &= runTest('4. Account isolation: owner=user:lordkikin blocked for Guest and other user, allowed for LordKikin', () => {
    const env = createEnv();
    env.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    env.app.hasGameStarted = true;
    env.app.state = makeSampleState('LordKikin');
    env.app.saveActiveGameAutosave();

    // Another user tries to load/banner
    env.app.currentUser = { id: 9, username: 'Petr', displayName: 'Petr', role: 'Player' };
    env.app.hasGameStarted = false;
    env.app.state = null;
    assert(env.app.tryRestoreActiveGameAutosave() === false, 'Other user restored LordKikin autosave');
    assert(env.app.getActiveAutosaveMeta() === null, 'Other user saw LordKikin autosave meta');
    env.app.updateResumeGameButtonUI();
    assert(env.elements['welcome-resume-game-banner'].style.display === 'none', 'Resume banner visible for wrong user');

    // Guest tries to load/banner
    env.app.currentUser = { id: null, username: 'Host', displayName: 'Host', role: 'Guest' };
    assert(env.app.tryRestoreActiveGameAutosave() === false, 'Guest restored LordKikin autosave');
    assert(env.app.getActiveAutosaveMeta() === null, 'Guest saw LordKikin autosave meta');

    // Original owner logs back in -> allowed!
    env.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    assert(env.app.getActiveAutosaveMeta() !== null, 'Owner could not see own autosave meta');
    assert(env.app.tryRestoreActiveGameAutosave() === true, 'Owner could not restore own autosave');
  });

  ok &= runTest('5. Guest who genuinely starts a game as Guest restores it across F5', () => {
    const env = createEnv();
    env.app.currentUser = { id: null, username: 'Host', displayName: 'Host', role: 'Guest' };
    env.app.hasGameStarted = true;
    env.app.state = makeSampleState('Host (Ty)');
    env.app.saveActiveGameAutosave();

    const reloadEnv = createEnv(env.localStorage._dump(), env.sessionStorage._dump());
    reloadEnv.app.currentUser = { id: null, username: 'Host', displayName: 'Host', role: 'Guest' };
    assert(reloadEnv.app.tryRestoreActiveGameAutosave() === true, 'Guest could not restore own Guest game');
    assert(reloadEnv.app.state && reloadEnv.app.state.roundNumber === 4, 'Guest state corrupted on restore');
  });

  ok &= runTest('6. Legacy autosave without ownerKey belonging to registered user is rejected for Guest', () => {
    // Simulate legacy storage payload where ownerKey was never set and player is Lord Kikin
    const legacyPayload = {
      timestamp: Date.now() - 50000,
      stateJson: JSON.stringify(makeSampleState('lordkikin'))
    };
    const env = createEnv({
      prs_active_autosave: JSON.stringify(legacyPayload)
    });
    env.app.currentUser = { id: null, username: 'Host', displayName: 'Host', role: 'Guest' };
    assert(env.app.tryRestoreActiveGameAutosave() === false, 'Guest restored legacy save belonging to Lord Kikin');
    assert(env.app.getActiveAutosaveMeta() === null, 'Guest saw active meta for Lord Kikin legacy save');
  });

  ok &= runTest('7. Cold reload with restored game stays on "welcome" tab if user was not on "board"', () => {
    const env = createEnv();
    env.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    env.app.hasGameStarted = true;
    env.app.state = makeSampleState('LordKikin');
    env.app.saveActiveGameAutosave();

    // User was on welcome tab before F5 / Ctrl+F5
    const reloadEnv = createEnv(env.localStorage._dump(), { prs_active_tab: 'welcome' });
    reloadEnv.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };

    // Simulate js/app.js init() tab determination
    const curSearch = '';
    const forceWelcome = false;
    let restoredOk = false;
    let sTab = null;
    try { sTab = reloadEnv.sessionStorage.getItem('prs_active_tab'); } catch (e) {}

    if (!forceWelcome && curSearch.indexOf('room=') === -1) {
      if (typeof reloadEnv.app.tryRestoreActiveGameAutosave === 'function') {
        restoredOk = reloadEnv.app.tryRestoreActiveGameAutosave();
      }
    }

    let initialTab = 'welcome';
    if (restoredOk && reloadEnv.app.hasGameStarted && reloadEnv.app.state && sTab === 'board') {
      initialTab = 'board';
    } else {
      if (sTab && (sTab === 'lobby' || sTab === 'rules' || sTab === 'admin')) {
        initialTab = sTab;
      }
    }

    assert(restoredOk === true, 'Autosave should restore in memory for owner');
    assert(initialTab === 'welcome', `Expected initialTab "welcome" because sTab was "welcome", got "${initialTab}"`);

    // Now test if sTab was "board", initialTab goes to "board"
    const reloadBoardEnv = createEnv(env.localStorage._dump(), { prs_active_tab: 'board' });
    reloadBoardEnv.app.currentUser = { id: 7, username: 'LordKikin', displayName: 'Lord Kikin', role: 'Player' };
    let sTabBoard = reloadBoardEnv.sessionStorage.getItem('prs_active_tab');
    let restoredBoardOk = reloadBoardEnv.app.tryRestoreActiveGameAutosave();
    let initialTabBoard = 'welcome';
    if (restoredBoardOk && reloadBoardEnv.app.hasGameStarted && reloadBoardEnv.app.state && sTabBoard === 'board') {
      initialTabBoard = 'board';
    }
    assert(initialTabBoard === 'board', `Expected initialTab "board" when sTab is "board", got "${initialTabBoard}"`);
  });

  if (!ok) process.exit(1);
  console.log('\n=== Výsledek test-auth-logout-autosave: 7 PASS, 0 FAIL ===');
}

main();
