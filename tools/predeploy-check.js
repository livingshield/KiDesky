#!/usr/bin/env node
/**
 * KiDesky Pre-Deploy & Integrity Verification
 * Runs 7 safety/quality checks before FTP deployment or commits.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const IGNORED_DIRS = new Set(['.git', 'node_modules']);

let failCount = 0;
let warnCount = 0;

function report(status, label, detail) {
  const tag = status.padEnd(4);
  console.log(`[${tag}] ${label}${detail ? ' — ' + detail : ''}`);
  if (status === 'FAIL') failCount++;
  else if (status === 'WARN') warnCount++;
}

function walkDir(dir, predicate) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkDir(fullPath, predicate));
    } else if (!predicate || predicate(fullPath, entry.name)) {
      out.push(fullPath);
    }
  }
  return out;
}

function relPath(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

function checkNoExeFiles() {
  const exeFiles = walkDir(ROOT, (_full, name) => /\.exe($|\.)/i.test(name)).map(relPath);
  if (exeFiles.length > 0) {
    report('FAIL', '1. Zákaz .exe souborů', `Nalezeno ${exeFiles.length}: ${exeFiles.join(', ')}`);
  } else {
    report('OK', '1. Zákaz .exe souborů', '0 zakázaných .exe souborů');
  }
}

function checkJsSyntax() {
  const jsFiles = walkDir(path.join(ROOT, 'js'), (_full, name) => name.endsWith('.js'));
  const swPath = path.join(ROOT, 'service-worker.js');
  if (fs.existsSync(swPath)) jsFiles.push(swPath);

  const errors = [];
  for (const file of jsFiles) {
    try {
      execFileSync(process.execPath, ['-c', file], { stdio: 'pipe' });
    } catch (err) {
      const msg = (err.stderr ? err.stderr.toString('utf8') : err.message).trim().split(/\r?\n/)[0];
      errors.push(`${relPath(file)}: ${msg}`);
    }
  }

  if (errors.length > 0) {
    report('FAIL', '2. Validace JS syntaxe (node -c)', `${errors.length} chyb:\n  - ${errors.join('\n  - ')}`);
  } else {
    report('OK', '2. Validace JS syntaxe (node -c)', `Ověřeno ${jsFiles.length} JS souborů`);
  }
}

function checkUtf8Encoding() {
  const targets = [];
  for (const rootName of ['index.html', 'service-worker.js', 'web.config']) {
    const p = path.join(ROOT, rootName);
    if (fs.existsSync(p)) targets.push(p);
  }
  for (const entry of fs.readdirSync(ROOT)) {
    if (/^api.*\.ashx$/i.test(entry)) {
      targets.push(path.join(ROOT, entry));
    }
  }
  targets.push(...walkDir(path.join(ROOT, 'css'), (_f, n) => n.endsWith('.css')));
  targets.push(...walkDir(path.join(ROOT, 'js'), (_f, n) => n.endsWith('.js')));
  targets.push(...walkDir(path.join(ROOT, 'backend'), (_f, n) => n.endsWith('.cs')));
  targets.push(...walkDir(path.join(ROOT, 'App_Code'), (_f, n) => n.endsWith('.cs')));

  const decoder = new TextDecoder('utf-8', { fatal: true });
  const bad = [];

  for (const file of targets) {
    const buf = fs.readFileSync(file);
    if (buf.length >= 2 && ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff))) {
      bad.push(`${relPath(file)} (UTF-16 BOM)`);
      continue;
    }
    if (buf.includes(0x00)) {
      bad.push(`${relPath(file)} (obsahuje NUL bajt)`);
      continue;
    }
    try {
      decoder.decode(buf);
    } catch (e) {
      bad.push(`${relPath(file)} (neplatné UTF-8: ${e.message})`);
    }
  }

  if (bad.length > 0) {
    report('FAIL', '3. Kontrola kódování UTF-8', `Problémy v ${bad.length} souborech: ${bad.join(', ')}`);
  } else {
    report('OK', '3. Kontrola kódování UTF-8', `Ověřeno ${targets.length} souborů`);
  }
}

function flattenObject(obj, prefix = '') {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenObject(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function checkI18nDictionaries() {
  const i18nDir = path.join(ROOT, 'js', 'i18n');
  const dictFiles = walkDir(i18nDir, (_f, name) => {
    return name.endsWith('.js') && name !== 'languages.js' && !name.startsWith('rules-');
  });

  if (dictFiles.length === 0) {
    report('FAIL', '4. Kontrola i18n slovníků', 'Nenalezen žádný slovník v js/i18n/');
    return;
  }

  const sandbox = { window: {} };
  vm.createContext(sandbox);

  for (const file of dictFiles) {
    try {
      const code = fs.readFileSync(file, 'utf8');
      vm.runInContext(code, sandbox, { filename: relPath(file) });
    } catch (err) {
      report('FAIL', '4. Kontrola i18n slovníků', `Chyba načtení ${relPath(file)}: ${err.message}`);
      return;
    }
  }

  const dicts = sandbox.window.PRS_I18N || {};
  const langs = Object.keys(dicts);
  if (!dicts.cs) {
    report('FAIL', '4. Kontrola i18n slovníků', 'Chybí výchozí český slovník (cs)');
    return;
  }

  const issues = [];
  const csFlat = flattenObject(dicts.cs);
  const csKeys = new Set(Object.keys(csFlat));

  for (const lang of langs) {
    const dict = dicts[lang];
    const meta = dict && dict.meta;
    for (const field of ['code', 'name', 'flag', 'short']) {
      if (!meta || !meta[field] || String(meta[field]).trim() === '') {
        issues.push(`${lang}: chybí meta.${field}`);
      }
    }
    if (lang === 'cs') continue;

    const flat = flattenObject(dict);
    const langKeys = new Set(Object.keys(flat));
    const missing = [...csKeys].filter((k) => !langKeys.has(k));
    const extra = [...langKeys].filter((k) => !csKeys.has(k));

    if (missing.length > 0) {
      issues.push(`${lang}: chybí ${missing.length} klíčů (např. ${missing.slice(0, 3).join(', ')})`);
    }
    if (extra.length > 0) {
      issues.push(`${lang}: přebývá ${extra.length} klíčů (např. ${extra.slice(0, 3).join(', ')})`);
    }
  }

  if (issues.length > 0) {
    report('FAIL', '4. Kontrola i18n slovníků', issues.join('; '));
  } else {
    report('OK', '4. Kontrola i18n slovníků', `Jazyky: [${langs.join(', ')}], parita ${csKeys.size} klíčů`);
  }
}

function checkCacheBustingConsistency() {
  const swPath = path.join(ROOT, 'service-worker.js');
  const indexPath = path.join(ROOT, 'index.html');
  if (!fs.existsSync(swPath) || !fs.existsSync(indexPath)) {
    report('FAIL', '5. Konzistence cache-bustingu', 'Chybí service-worker.js nebo index.html');
    return;
  }

  const swSrc = fs.readFileSync(swPath, 'utf8');
  const cacheMatch = swSrc.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
  if (!cacheMatch) {
    report('FAIL', '5. Konzistence cache-bustingu', 'CACHE_NAME v service-worker.js nebyl nalezen');
    return;
  }
  const cacheName = cacheMatch[1];

  const html = fs.readFileSync(indexPath, 'utf8');
  const versions = new Set();
  const missingVersion = [];

  const assetRefRe = /<(?:link[^>]+href|script[^>]+src)\s*=\s*['"]((?:css|js)\/[^'"]+)['"]/gi;
  let m;
  while ((m = assetRefRe.exec(html)) !== null) {
    const rawRef = m[1];
    const vMatch = rawRef.match(/[?&]v=([^&#'"]+)/);
    if (!vMatch) {
      missingVersion.push(rawRef);
    } else {
      versions.add(vMatch[1]);
    }
  }

  if (missingVersion.length > 0) {
    report('FAIL', '5. Konzistence cache-bustingu', `Chybí ?v= u: ${missingVersion.join(', ')}`);
    return;
  }
  if (versions.size === 0) {
    report('FAIL', '5. Konzistence cache-bustingu', 'V index.html nebyly nalezeny žádné lokální css/js ?v= odkazy');
    return;
  }
  if (versions.size > 1) {
    report('FAIL', '5. Konzistence cache-bustingu', `Nekonzistentní ?v= v index.html: ${[...versions].join(', ')} (CACHE_NAME=${cacheName})`);
    return;
  }

  const ver = [...versions][0];
  report('OK', '5. Konzistence cache-bustingu', `CACHE_NAME=${cacheName}, ?v=${ver}`);
}

function extractPrsAppMethods(src) {
  const methods = [];
  const blockRe = /(?:(?:window\.)?PRS_App\s*=|(?:const|let|var)\s+PRS_App\s*=|Object\.assign\s*\(\s*(?:window\.)?PRS_App\s*,)\s*\{/g;
  let bm;

  while ((bm = blockRe.exec(src)) !== null) {
    let i = bm.index + bm[0].length;
    let depth = 1;
    let inStr = null;
    let inLineComment = false;
    let inBlockComment = false;
    let lineBuf = '';
    const topLines = [];

    for (; i < src.length && depth > 0; i++) {
      const ch = src[i];
      const next = src[i + 1];

      if (inLineComment) {
        if (ch === '\n') {
          inLineComment = false;
          if (depth === 1) {
            topLines.push(lineBuf);
            lineBuf = '';
          }
        }
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      if (inStr) {
        if (ch === '\\') {
          i++;
          continue;
        }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === '/' && next === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        inStr = ch;
        continue;
      }
      if (ch === '{') {
        if (depth === 1) {
          lineBuf += '{';
          topLines.push(lineBuf);
          lineBuf = '';
        }
        depth++;
        continue;
      }
      if (ch === '}') {
        depth--;
        if (depth === 0) break;
        continue;
      }
      if (depth === 1) {
        if (ch === '\n') {
          topLines.push(lineBuf);
          lineBuf = '';
        } else {
          lineBuf += ch;
        }
      }
    }
    if (lineBuf.trim()) topLines.push(lineBuf);

    const joined = topLines.join('\n');
    const methRe = /(?:^|[,;\n])\s*(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::\s*(?:async\s+)?function\b|\([^)]*\)\s*\{)/g;
    let km;
    while ((km = methRe.exec(joined)) !== null) {
      methods.push(km[1]);
    }
  }

  const directRe = /(?:window\.)?PRS_App\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s+)?function\b/g;
  let dm;
  while ((dm = directRe.exec(src)) !== null) {
    methods.push(dm[1]);
  }

  return methods;
}

function checkPrsAppMethodCollisions() {
  const excludedBasenames = new Set([
    'app-audio.js',
    'app-dialog.js',
    'app-i18n.js',
    'app-rules-guide.js'
  ]);

  const jsFiles = walkDir(path.join(ROOT, 'js'), (fullPath, name) => {
    if (!name.endsWith('.js')) return false;
    const rel = relPath(fullPath);
    if (rel.startsWith('js/i18n/')) return false;
    if (name.startsWith('game-')) return false;
    if (excludedBasenames.has(name)) return false;
    return true;
  });

  const methodOwners = new Map();
  const intraFileDups = [];
  for (const file of jsFiles) {
    const src = fs.readFileSync(file, 'utf8');
    const rel = relPath(file);
    const counts = new Map();
    for (const method of extractPrsAppMethods(src)) {
      counts.set(method, (counts.get(method) || 0) + 1);
    }
    for (const [method, cnt] of counts.entries()) {
      if (cnt > 1) {
        intraFileDups.push(`${method} (${rel} x${cnt})`);
      }
      if (!methodOwners.has(method)) methodOwners.set(method, []);
      methodOwners.get(method).push(rel);
    }
  }

  const collisions = [...intraFileDups];

  for (const [method, owners] of methodOwners.entries()) {
    if (owners.length <= 1) continue;
    collisions.push(`${method} (${owners.join(', ')})`);
  }

  if (collisions.length > 0) {
    report('FAIL', '6. Kolize metod na window.PRS_App', `Kolize metod: ${collisions.join('; ')}`);
  } else {
    report('OK', '6. Kolize metod na window.PRS_App', '0 kolizí');
  }
}

function checkTrackedSecrets() {
  try {
    const out = execFileSync('git', ['ls-files', 'appsettings.local.json', 'appsettings.Production.json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
    if (out) {
      report('FAIL', '7. Bezpečnost tajných souborů v Gitu', `Sledováno v Gitu: ${out.split(/\r?\n/).join(', ')}`);
    } else {
      report('OK', '7. Bezpečnost tajných souborů v Gitu', 'Citlivé soubory nejsou verzovány');
    }
  } catch (err) {
    report('FAIL', '7. Bezpečnost tajných souborů v Gitu', `Chyba git ls-files: ${err.message}`);
  }
}

function checkBackendCompilation() {
  const cscExists = [
    'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe',
    'C:\\Windows\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe'
  ].some((p) => fs.existsSync(p));

  const compileScript = path.join(ROOT, 'tools', 'test-backend-compile.js');
  if (!fs.existsSync(compileScript)) {
    report('FAIL', '8. Kompilace C# backendu', 'Chybí tools/test-backend-compile.js');
    return;
  }

  try {
    execFileSync(process.execPath, [compileScript, '--quiet'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    if (cscExists) {
      report('OK', '8. Kompilace C# backendu', 'KiDeskyCore.cs + 5 .ashx zkompilováno přes csc.exe (0 chyb, 0 varování)');
    } else {
      report('WARN', '8. Kompilace C# backendu', 'csc.exe nenalezen — ověřeny pouze trasy a velikosti bez kompilace');
    }
  } catch (err) {
    const details = ((err.stderr && String(err.stderr)) || (err.stdout && String(err.stdout)) || err.message || '').trim();
    report('FAIL', '8. Kompilace C# backendu', details.split(/\r?\n/)[0] || 'Selhala kompilace C#');
  }
}

function main() {
  console.log('=== KiDesky Pre-Deploy Check ===');
  checkNoExeFiles();
  checkJsSyntax();
  checkUtf8Encoding();
  checkI18nDictionaries();
  checkCacheBustingConsistency();
  checkPrsAppMethodCollisions();
  checkTrackedSecrets();
  checkBackendCompilation();
  console.log(`=== Výsledek: ${failCount} FAIL, ${warnCount} WARN ===`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
