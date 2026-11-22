#!/usr/bin/env node
/**
 * KiDesky Etapa 5B Media (Audio & Video) Verification (LOCAL + optional --live)
 * Usage:
 *   node tools/test-etapa5b-media.js
 *   node tools/test-etapa5b-media.js --live
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIVE = process.argv.includes('--live');
const LIVE_BASE = 'https://www.ekobio.org/apps/KiDesky/';

const EXPECTED_AUDIO_FILES = [
  'Flight_of_the_High_Queen.mp3',
  'adventure_fantasy_music.mp3',
  'army_of_light.mp3',
  'heavenly_warrior.mp3',
  'i_will_do_everything.mp3',
  'together.mp3',
  'tomorrow_is_here.mp3',
  'we_fight_as_one.mp3',
  'kingdom_majestic_fantasy_mix.mp3',
  'symphonic_rage.mp3',
  'beauty_of_epic_music_vol2.mp3'
];

const EXPECTED_VIDEO_FILES = [
  'RuzeProDanielku.mp4',
  'ps_intro_04.mp4'
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function findGitBin() {
  for (const c of ['git', 'C:\\Program Files\\Git\\cmd\\git.exe', 'C:\\Program Files\\Git\\bin\\git.exe']) {
    if (c === 'git') {
      try { execFileSync('git', ['--version'], { stdio: 'ignore' }); return 'git'; } catch (_) {}
    } else if (fs.existsSync(c)) {
      return c;
    }
  }
  throw new Error('git executable not found');
}

async function fetchWithRetry(url, opts = {}, retries = 3) {
  let lastErr;
  for (let i = 1; i <= retries; i++) {
    try {
      return await fetch(url, { ...opts, signal: AbortSignal.timeout(20000) });
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise(r => setTimeout(r, 700));
    }
  }
  throw lastErr;
}

async function main() {
  console.log(`=== KiDesky Etapa 5B Media Verification (${LIVE ? 'LOCAL + LIVE: ' + LIVE_BASE : 'LOCAL'}) ===`);
  let pass = 0;
  let fail = 0;

  async function test(label, fn) {
    try {
      const detail = await fn();
      console.log(`[PASS] ${label}${detail ? ' — ' + detail : ''}`);
      pass++;
    } catch (err) {
      console.error(`[FAIL] ${label} — ${err.message}`);
      fail++;
    }
  }

  await test('1. assets/audio/ has 11 canonical .mp3 files, 0 in big/, total < 320 MB', async () => {
    const audioDir = path.join(ROOT, 'assets', 'audio');
    const bigDir = path.join(audioDir, 'big');
    assert(!fs.existsSync(bigDir), 'assets/audio/big/ directory still exists');
    const mp3s = fs.readdirSync(audioDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    assert(mp3s.length === EXPECTED_AUDIO_FILES.length, `Expected ${EXPECTED_AUDIO_FILES.length} MP3s, found ${mp3s.length}: ${mp3s.join(', ')}`);
    for (const exp of EXPECTED_AUDIO_FILES) {
      assert(mp3s.includes(exp), `Missing canonical MP3: ${exp}`);
    }
    const totalBytes = mp3s.reduce((s, f) => s + fs.statSync(path.join(audioDir, f)).size, 0);
    const totalMb = totalBytes / (1024 * 1024);
    assert(totalMb < 320.0, `Total audio size ${totalMb.toFixed(2)} MB >= 320 MB`);
    return `${mp3s.length} MP3 files (${totalMb.toFixed(2)} MB), 0 in big/`;
  });

  await test('2. assets/video/ has exactly RuzeProDanielku.mp4 and ps_intro_04.mp4, total < 25 MB', async () => {
    const videoDir = path.join(ROOT, 'assets', 'video');
    const files = fs.readdirSync(videoDir).filter(f => !f.startsWith('.')).sort();
    assert(files.length === 2, `Expected 2 files in assets/video/, found ${files.length}: ${files.join(', ')}`);
    for (const exp of EXPECTED_VIDEO_FILES) {
      assert(files.includes(exp), `Missing expected video: ${exp}`);
    }
    const totalBytes = files.reduce((s, f) => s + fs.statSync(path.join(videoDir, f)).size, 0);
    const totalMb = totalBytes / (1024 * 1024);
    assert(totalMb < 25.0, `Total video size ${totalMb.toFixed(2)} MB >= 25 MB`);
    return `${files.join(' + ')} (${totalMb.toFixed(2)} MB)`;
  });

  await test('3. Git index tracks 0 .mp3 and 0 .mp4 files under assets/audio/ & assets/video/', async () => {
    const git = findGitBin();
    const out = execFileSync(git, ['ls-files', 'assets/audio/', 'assets/video/'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const lines = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const mediaTracked = lines.filter(l => /\.(mp3|mp4)$/i.test(l));
    assert(mediaTracked.length === 0, `Large media files still tracked by Git: ${mediaTracked.join(', ')}`);
    return `tracked files: [${lines.join(', ') || 'none'}]`;
  });

  if (LIVE) {
    await test('4. LIVE list-audio: all 12 DB tracks HTTP 200 (audio/mpeg) & optimized sizes', async () => {
      const r = await fetchWithRetry(LIVE_BASE + 'api.ashx?action=list-audio');
      assert(r.status === 200, `list-audio returned HTTP ${r.status}`);
      const data = await r.json();
      assert(data && data.ok && Array.isArray(data.tracks) && data.tracks.length >= 12, 'Invalid list-audio payload');

      const maxLimitsMb = {
        'assets/audio/symphonic_rage.mp3': 120,
        'assets/audio/beauty_of_epic_music_vol2.mp3': 95,
        'assets/audio/kingdom_majestic_fantasy_mix.mp3': 60,
        'assets/audio/adventure_fantasy_music.mp3': 25
      };

      const checked = [];
      for (const tr of data.tracks) {
        const h = await fetchWithRetry(LIVE_BASE + tr.url, { method: 'HEAD' });
        assert(h.status === 200, `HEAD ${tr.url} returned ${h.status}`);
        const ct = (h.headers.get('content-type') || '').toLowerCase();
        assert(ct.includes('audio/mpeg') || ct.includes('audio/mp3'), `Unexpected Content-Type for ${tr.url}: ${ct}`);
        const lenMb = parseInt(h.headers.get('content-length') || '0', 10) / (1024 * 1024);
        assert(lenMb > 0, `Empty content-length for ${tr.url}`);
        if (maxLimitsMb[tr.url] !== undefined) {
          assert(lenMb < maxLimitsMb[tr.url], `${tr.url} size ${lenMb.toFixed(2)} MB >= ${maxLimitsMb[tr.url]} MB`);
        }
        checked.push(`${path.posix.basename(tr.url)}=${lenMb.toFixed(1)}MB`);
      }
      return `${data.tracks.length} DB tracks 200 (${checked.slice(0, 4).join(', ')}...)`;
    });

    await test('5. LIVE fallback BGM tracks (app-audio.js) HTTP 200', async () => {
      for (const rel of ['assets/audio/bgm_court.mp3', 'assets/audio/bgm_tavern.mp3', 'assets/audio/bgm_tournament.mp3']) {
        const h = await fetchWithRetry(LIVE_BASE + rel, { method: 'HEAD' });
        assert(h.status === 200, `HEAD ${rel} returned ${h.status}`);
      }
      return '3/3 fallback BGM tracks HTTP 200';
    });

    await test('6. LIVE list-videos: active MP4 entries HTTP 200 (video/mp4) & ps_intro_04 < 25 MB', async () => {
      const r = await fetchWithRetry(LIVE_BASE + 'api.ashx?action=list-videos');
      assert(r.status === 200, `list-videos returned HTTP ${r.status}`);
      const data = await r.json();
      assert(data && data.ok && Array.isArray(data.videos), 'Invalid list-videos payload');
      const mp4s = data.videos.filter(v => v.videoType === 'mp4');
      assert(mp4s.length >= 2, `Expected >= 2 MP4 DB records, got ${mp4s.length}`);
      const summary = [];
      for (const v of mp4s) {
        const h = await fetchWithRetry(LIVE_BASE + v.url, { method: 'HEAD' });
        assert(h.status === 200, `HEAD ${v.url} returned ${h.status}`);
        const ct = (h.headers.get('content-type') || '').toLowerCase();
        assert(ct.includes('video/mp4'), `Unexpected Content-Type for ${v.url}: ${ct}`);
        const lenMb = parseInt(h.headers.get('content-length') || '0', 10) / (1024 * 1024);
        if (v.url.endsWith('ps_intro_04.mp4')) {
          assert(lenMb < 25.0, `ps_intro_04.mp4 is ${lenMb.toFixed(2)} MB >= 25 MB`);
        }
        summary.push(`${path.posix.basename(v.url)}=${lenMb.toFixed(2)}MB`);
      }
      return summary.join(', ');
    });

    await test('7. LIVE orphan videos deleted (ps_intro_02.mp4 & ps_intro_03.mp4 -> HTTP 404)', async () => {
      for (const rel of ['assets/video/ps_intro_02.mp4', 'assets/video/ps_intro_03.mp4']) {
        const h = await fetchWithRetry(LIVE_BASE + rel, { method: 'HEAD' });
        assert(h.status === 404, `Orphan video ${rel} still returns HTTP ${h.status}`);
      }
      return 'ps_intro_02.mp4 & ps_intro_03.mp4 return HTTP 404';
    });
  }

  console.log(`\n=== Výsledek test-etapa5b-media: ${pass} PASS, ${fail} FAIL ===`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
