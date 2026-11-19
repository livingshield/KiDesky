#!/usr/bin/env node
/**
 * KiDesky Live Production Smoke Verification
 * Verifies deployed version, service worker cache name, core assets, and API status.
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
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const swSrc = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
  const vMatch = indexHtml.match(/js\/app\.js\?v=([^"']+)/) || indexHtml.match(/\?v=([0-9]{8,})/);
  const cacheMatch = swSrc.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  return {
    localVer: vMatch ? vMatch[1] : null,
    cacheName: cacheMatch ? cacheMatch[1] : null
  };
}

async function runCheck(label, fn) {
  try {
    const detail = await fn();
    console.log(`[OK]   ${label} — ${detail}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${label} — ${err.message}`);
    return false;
  }
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
  const { localVer, cacheName } = getLocalVersions();

  if (!localVer || !cacheName) {
    console.error('Nelze načíst lokální ?v= nebo CACHE_NAME.');
    process.exit(1);
  }

  console.log(`=== KiDesky Live Verification (${baseUrl}) ===`);
  console.log(`Lokální verze: ?v=${localVer} | CACHE_NAME=${cacheName}`);

  let allOk = true;

  allOk = (await runCheck('GET index.html', async () => {
    const res = await fetchWithTimeout(`${baseUrl}index.html`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    if (!body.includes(`?v=${localVer}`)) {
      throw new Error(`Chybí očekávané ?v=${localVer} v živém index.html`);
    }
    return `HTTP 200, obsahuje ?v=${localVer}`;
  })) && allOk;

  allOk = (await runCheck('GET service-worker.js', async () => {
    const res = await fetchWithTimeout(`${baseUrl}service-worker.js`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    if (!body.includes(cacheName)) {
      throw new Error(`Chybí očekávané CACHE_NAME=${cacheName} v živém service-worker.js`);
    }
    return `HTTP 200, obsahuje ${cacheName}`;
  })) && allOk;

  allOk = (await runCheck(`HEAD js/app.js?v=${localVer}`, async () => {
    const res = await fetchWithTimeout(`${baseUrl}js/app.js?v=${localVer}`, { method: 'HEAD' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return 'HTTP 200';
  })) && allOk;

  allOk = (await runCheck(`HEAD css/main.css?v=${localVer}`, async () => {
    const res = await fetchWithTimeout(`${baseUrl}css/main.css?v=${localVer}`, { method: 'HEAD' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return 'HTTP 200';
  })) && allOk;

  allOk = (await runCheck('GET api.ashx?action=status', async () => {
    const res = await fetchWithTimeout(`${baseUrl}api.ashx?action=status`, { cache: 'no-store' });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const json = JSON.parse(text);
    return `HTTP 200, validní JSON (${Object.keys(json).slice(0, 5).join(', ')})`;
  })) && allOk;

  console.log(allOk ? '=== Live verifikace PROŠLA ===' : '=== Live verifikace SELHALA ===');
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error('Neočekávaná chyba verifikace:', err);
  process.exit(1);
});
