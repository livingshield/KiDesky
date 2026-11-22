import os
import re
import shutil
import subprocess
import sys
import imageio_ffmpeg

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
AUDIO_DIR = os.path.join(ROOT, 'assets', 'audio')
VIDEO_DIR = os.path.join(ROOT, 'assets', 'video')

AUDIO_MAP = [
    ('adventure fantasy music', 'adventure_fantasy_music.mp3'),
    ('army of light', 'army_of_light.mp3'),
    ('heavenly warrior', 'heavenly_warrior.mp3'),
    ('i will do everything', 'i_will_do_everything.mp3'),
    ('together', 'together.mp3'),
    ('tomorrow is here', 'tomorrow_is_here.mp3'),
    ('we fight as one', 'we_fight_as_one.mp3'),
    ('kingdom', 'kingdom_majestic_fantasy_mix.mp3'),
    ('symphonic rage', 'symphonic_rage.mp3'),
    ('the beauty of epic music', 'beauty_of_epic_music_vol2.mp3'),
]

UNUSED_VIDEOS = [
    '01.mp4',
    '1104.mp4',
    'ps_intro_01.mp4',
    'ps_intro_02.mp4',
    'ps_intro_03.mp4',
    'ps_intro_04_low.mp4',
]

DUR_RE = re.compile(r'Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)')


def probe_media(ff, path):
    res = subprocess.run([ff, '-i', path], capture_output=True, text=True, encoding='utf-8', errors='replace')
    stderr = res.stderr or ''
    m = DUR_RE.search(stderr)
    dur_s = None
    if m:
        dur_s = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    return dur_s, stderr


def dir_total(folder, ext):
    cnt = 0
    total = 0
    for r, _, fs in os.walk(folder):
        for f in fs:
            if f.lower().endswith(ext):
                cnt += 1
                total += os.path.getsize(os.path.join(r, f))
    return cnt, total


def find_audio_sources():
    candidates = []
    for r, _, fs in os.walk(AUDIO_DIR):
        for f in sorted(fs):
            if f.lower().endswith('.mp3'):
                candidates.append(os.path.join(r, f))
    return candidates


def main():
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    enc_out = subprocess.run([ff, '-encoders'], capture_output=True, text=True, encoding='utf-8', errors='replace').stdout
    if 'libmp3lame' not in enc_out or 'libx264' not in enc_out:
        print('ERROR: Missing libmp3lame or libx264 in ffmpeg!', file=sys.stderr)
        sys.exit(2)

    aud_before_cnt, aud_before_bytes = dir_total(AUDIO_DIR, '.mp3')
    vid_before_cnt, vid_before_bytes = dir_total(VIDEO_DIR, '.mp4')

    print('=== 1. AUDIO TRANSCODING (128 kbps MP3) ===')
    all_mp3s = find_audio_sources()
    for needle, target_name in AUDIO_MAP:
        target_path = os.path.join(AUDIO_DIR, target_name)
        matches = [p for p in all_mp3s if os.path.basename(p).lower().startswith(needle)]
        if not matches:
            if os.path.isfile(target_path):
                print(f'[SKIP] Already normalized: {target_name}')
                continue
            raise RuntimeError(f'Source MP3 not found for pattern "{needle}" -> {target_name}')
        if len(matches) > 1:
            raise RuntimeError(f'Ambiguous MP3 match for "{needle}": {matches}')
        src_path = matches[0]
        src_dur, _ = probe_media(ff, src_path)
        src_mb = os.path.getsize(src_path) / (1024 * 1024)
        tmp_path = target_path + '.tmp.mp3'

        print(f'[AUDIO] Converting {os.path.basename(src_path)} ({src_mb:.2f} MB) -> {target_name} ...', flush=True)
        cmd = [
            ff, '-y', '-i', src_path,
            '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2',
            '-map_metadata', '0', '-write_xing', '1',
            tmp_path
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if proc.returncode != 0 or not os.path.isfile(tmp_path) or os.path.getsize(tmp_path) == 0:
            raise RuntimeError(f'ffmpeg failed for {src_path}:\n{proc.stderr[-800:]}')

        new_dur, _ = probe_media(ff, tmp_path)
        if src_dur is not None and (new_dur is None or abs(new_dur - src_dur) > 2.0):
            raise RuntimeError(f'Duration mismatch for {target_name}: src={src_dur}s new={new_dur}s')

        new_mb = os.path.getsize(tmp_path) / (1024 * 1024)
        os.replace(tmp_path, target_path)
        if os.path.abspath(src_path) != os.path.abspath(target_path) and os.path.isfile(src_path):
            os.remove(src_path)
        print(f'        Done: {new_mb:.2f} MB (dur {new_dur:.1f}s)', flush=True)

    big_dir = os.path.join(AUDIO_DIR, 'big')
    if os.path.isdir(big_dir):
        leftover = os.listdir(big_dir)
        if leftover:
            raise RuntimeError(f'assets/audio/big/ still has files: {leftover}')
        os.rmdir(big_dir)
        print('[CLEAN] Removed empty assets/audio/big/')

    print('\n=== 2. VIDEO TRANSCODING & CLEANUP ===')
    ps4_path = os.path.join(VIDEO_DIR, 'ps_intro_04.mp4')
    if os.path.isfile(ps4_path):
        old_dur, info = probe_media(ff, ps4_path)
        old_mb = os.path.getsize(ps4_path) / (1024 * 1024)
        tmp_vid = os.path.join(VIDEO_DIR, 'ps_intro_04.tmp.mp4')
        print(f'[VIDEO] Transcoding ps_intro_04.mp4 ({old_mb:.2f} MB) -> H.264 720p CRF 24 ...', flush=True)
        cmd = [
            ff, '-y', '-i', ps4_path,
            '-c:v', 'libx264', '-crf', '26', '-preset', 'medium', '-pix_fmt', 'yuv420p',
            '-vf', "scale='min(1280,iw)':-2",
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            tmp_vid
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if proc.returncode != 0 or not os.path.isfile(tmp_vid) or os.path.getsize(tmp_vid) == 0:
            raise RuntimeError(f'ffmpeg video failed:\n{proc.stderr[-800:]}')

        new_dur, new_info = probe_media(ff, tmp_vid)
        new_mb = os.path.getsize(tmp_vid) / (1024 * 1024)
        if 'h264' not in new_info.lower():
            raise RuntimeError(f'Expected h264 stream in {tmp_vid}, got:\n{new_info}')
        if old_dur is not None and (new_dur is None or abs(new_dur - old_dur) > 2.0):
            raise RuntimeError(f'Video duration mismatch: old={old_dur}s new={new_dur}s')
        if new_mb >= 25.0:
            raise RuntimeError(f'Transcoded ps_intro_04.mp4 is too large: {new_mb:.2f} MB >= 25 MB')

        os.replace(tmp_vid, ps4_path)
        print(f'        Done: {new_mb:.2f} MB (h264, dur {new_dur:.1f}s)', flush=True)

    for uname in UNUSED_VIDEOS:
        upath = os.path.join(VIDEO_DIR, uname)
        if os.path.isfile(upath):
            sz_mb = os.path.getsize(upath) / (1024 * 1024)
            os.remove(upath)
            print(f'[UNUSED] Deleted assets/video/{uname} ({sz_mb:.2f} MB)')

    aud_after_cnt, aud_after_bytes = dir_total(AUDIO_DIR, '.mp3')
    vid_after_cnt, vid_after_bytes = dir_total(VIDEO_DIR, '.mp4')

    print('\n=== ETAPA 5B MEDIA OPTIMIZATION REPORT ===')
    for label, b_cnt, b_b, a_cnt, a_b in [
        ('Audio (.mp3)', aud_before_cnt, aud_before_bytes, aud_after_cnt, aud_after_bytes),
        ('Video (.mp4)', vid_before_cnt, vid_before_bytes, vid_after_cnt, vid_after_bytes),
        ('TOTAL MEDIA', aud_before_cnt + vid_before_cnt, aud_before_bytes + vid_before_bytes, aud_after_cnt + vid_after_cnt, aud_after_bytes + vid_after_bytes),
    ]:
        b_mb = b_b / (1024 * 1024)
        a_mb = a_b / (1024 * 1024)
        pct = (1.0 - a_b / b_b) * 100 if b_b else 0.0
        print(f'{label:14s} | Before: {b_cnt:2d} files ({b_mb:7.2f} MB) -> After: {a_cnt:2d} files ({a_mb:7.2f} MB) | Saved: {pct:5.1f}%')


if __name__ == '__main__':
    main()
