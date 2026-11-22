import os
import sys
from collections import defaultdict
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ASSETS_DIR = os.path.join(ROOT, 'assets')

UNUSED_FILES = [
    'assets/kidesky-hero.jpg',
    'assets/kidesky-hero.png',
    'assets/decorations/grove_birch.png',
    'assets/decorations/grove_birch_flip.png',
    'assets/decorations/pasture_fencej.png',
    'assets/decorations/pasture_fencej_flip.png',
    'assets/decorations/real_dragon_cave.png',
    'assets/decorations/real_dragon_cave_flip.png',
]

FLIP_FOLDERS = ['castles', 'decorations', 'dragons', 'landmarks', 'monsters', 'tiles']

TARGET_FOLDERS = {
    'pawns': 256,
    'tiles': 384,
    'castles': 512,
    'decorations': 512,
    'dragons': 512,
    'landmarks': 512,
    'monsters': 512,
    'backgrounds': 1440,
    'board': 1440,
    'env': 1440,
}

IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.webp')


def dir_stats(folder_path):
    if not os.path.isdir(folder_path):
        return 0, 0
    cnt = 0
    total_bytes = 0
    for name in os.listdir(folder_path):
        p = os.path.join(folder_path, name)
        if os.path.isfile(p) and name.lower().endswith(IMAGE_EXTS):
            cnt += 1
            total_bytes += os.path.getsize(p)
    return cnt, total_bytes


def main():
    before_stats = {}
    for folder in list(TARGET_FOLDERS.keys()) + ['icons']:
        before_stats[folder] = dir_stats(os.path.join(ASSETS_DIR, folder))
    # Add root images
    root_imgs_before = [f for f in os.listdir(ASSETS_DIR) if os.path.isfile(os.path.join(ASSETS_DIR, f)) and f.lower().endswith(IMAGE_EXTS)]
    before_stats['(root)'] = (len(root_imgs_before), sum(os.path.getsize(os.path.join(ASSETS_DIR, f)) for f in root_imgs_before))

    # 1. Remove confirmed unused files
    deleted_unused = 0
    for rel in UNUSED_FILES:
        full = os.path.join(ROOT, rel.replace('/', os.sep))
        if os.path.isfile(full):
            os.remove(full)
            deleted_unused += 1
            print(f'[UNUSED] Deleted {rel}')

    # 2. Remove all *_flip.* files in FLIP_FOLDERS
    deleted_flips = 0
    for folder in FLIP_FOLDERS:
        d = os.path.join(ASSETS_DIR, folder)
        if not os.path.isdir(d):
            continue
        for name in list(os.listdir(d)):
            stem, ext = os.path.splitext(name)
            if ext.lower() in IMAGE_EXTS and stem.lower().endswith('_flip'):
                os.remove(os.path.join(d, name))
                deleted_flips += 1
    print(f'[FLIPS] Deleted {deleted_flips} *_flip.* files')

    # 3. Convert remaining unique images to .webp
    converted_count = 0
    for folder, max_dim in TARGET_FOLDERS.items():
        d = os.path.join(ASSETS_DIR, folder)
        if not os.path.isdir(d):
            continue
        by_stem = defaultdict(list)
        for name in sorted(os.listdir(d)):
            p = os.path.join(d, name)
            if not os.path.isfile(p):
                continue
            stem, ext = os.path.splitext(name)
            ext_low = ext.lower()
            if ext_low in IMAGE_EXTS:
                by_stem[stem].append((ext_low, p))

        for stem, entries in by_stem.items():
            # Always prefer .png as source if available (RGBA alpha), else .jpg/.jpeg, else .webp
            entries_map = {ext: p for ext, p in entries}
            src_ext = None
            for cand in ('.png', '.jpg', '.jpeg', '.webp'):
                if cand in entries_map:
                    src_ext = cand
                    break
            if not src_ext:
                continue
            src_path = entries_map[src_ext]
            webp_path = os.path.join(d, stem + '.webp')

            with Image.open(src_path) as im:
                # Preserve RGBA/RGB
                has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
                if has_alpha:
                    im = im.convert('RGBA')
                else:
                    im = im.convert('RGB')

                w, h = im.size
                if max(w, h) > max_dim:
                    if w >= h:
                        new_w = max_dim
                        new_h = max(1, round(h * (max_dim / w)))
                    else:
                        new_h = max_dim
                        new_w = max(1, round(w * (max_dim / h)))
                    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

                im.save(webp_path, format='WEBP', quality=84, method=6)

            # Verify saved webp
            if not os.path.isfile(webp_path) or os.path.getsize(webp_path) == 0:
                raise RuntimeError(f'Failed writing valid WebP: {webp_path}')
            with Image.open(webp_path) as chk:
                chk.verify()

            # Remove original non-webp files for this stem
            for ext, p in entries:
                if os.path.abspath(p) != os.path.abspath(webp_path) and os.path.isfile(p):
                    os.remove(p)
            converted_count += 1

    print(f'[WEBP] Converted/verified {converted_count} unique images\n')

    # 4. Print before/after stats
    print('=== ASSETS OPTIMIZATION REPORT ===')
    total_before_cnt = 0
    total_before_bytes = 0
    total_after_cnt = 0
    total_after_bytes = 0

    all_keys = list(TARGET_FOLDERS.keys()) + ['icons', '(root)']
    for k in all_keys:
        b_cnt, b_bytes = before_stats.get(k, (0, 0))
        if k == '(root)':
            root_imgs_after = [f for f in os.listdir(ASSETS_DIR) if os.path.isfile(os.path.join(ASSETS_DIR, f)) and f.lower().endswith(IMAGE_EXTS)]
            a_cnt, a_bytes = len(root_imgs_after), sum(os.path.getsize(os.path.join(ASSETS_DIR, f)) for f in root_imgs_after)
        else:
            a_cnt, a_bytes = dir_stats(os.path.join(ASSETS_DIR, k))

        total_before_cnt += b_cnt
        total_before_bytes += b_bytes
        total_after_cnt += a_cnt
        total_after_bytes += a_bytes

        b_mb = b_bytes / (1024 * 1024)
        a_mb = a_bytes / (1024 * 1024)
        print(f'{k:14s} | Before: {b_cnt:3d} files ({b_mb:6.2f} MB) -> After: {a_cnt:3d} files ({a_mb:6.2f} MB)')

    print('-' * 74)
    tot_b_mb = total_before_bytes / (1024 * 1024)
    tot_a_mb = total_after_bytes / (1024 * 1024)
    saved_pct = (1.0 - (total_after_bytes / total_before_bytes)) * 100 if total_before_bytes else 0
    print(f'{"TOTAL":14s} | Before: {total_before_cnt:3d} files ({tot_b_mb:6.2f} MB) -> After: {total_after_cnt:3d} files ({tot_a_mb:6.2f} MB) | Saved: {saved_pct:.1f}%')

    if tot_a_mb >= 25.0:
        print(f'WARNING: Total size {tot_a_mb:.2f} MB >= 25.0 MB!', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
