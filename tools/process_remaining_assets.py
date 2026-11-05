import os
import sys
import io
import math

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

BRAIN_DIR = r"C:\Users\janky\.gemini\antigravity\brain\0b3f595b-e898-468b-ad67-4c4c041080bb"
MONSTERS_DIR = "assets/monsters"
TILES_DIR = "assets/tiles"

try:
    import rembg
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False

def flip_horizontal(img: Image.Image) -> Image.Image:
    return img.transpose(Image.FLIP_LEFT_RIGHT)

def trim_transparent(img: Image.Image, padding: int = 4) -> Image.Image:
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    bbox = img.getbbox()
    if not bbox:
        return img
    w, h = img.size
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(w, bbox[2] + padding)
    bottom = min(h, bbox[3] + padding)
    return img.crop((left, top, right, bottom))

def process_monster(src_filename, out_basename):
    src_path = os.path.join(BRAIN_DIR, src_filename)
    if not os.path.exists(src_path):
        print(f"Skipping {src_filename}, not found in brain.")
        return

    dst_path = os.path.join(MONSTERS_DIR, f"{out_basename}.png")
    dst_flip = os.path.join(MONSTERS_DIR, f"{out_basename}_flip.png")

    print(f"-> Processing monster: {src_filename} -> {out_basename}.png")
    with open(src_path, "rb") as f:
        raw_bytes = f.read()

    if HAS_REMBG:
        out_bytes = rembg.remove(raw_bytes)
        img = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    else:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")

    img = trim_transparent(img)

    # Scale to max 600px
    w, h = img.size
    max_dim = 600
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)

    img.save(dst_path, format="PNG", optimize=True)
    flipped = flip_horizontal(img)
    flipped.save(dst_flip, format="PNG", optimize=True)
    print(f"   [OK] Monster {out_basename} saved ({img.size[0]}x{img.size[1]})")

def process_tile_crop(src_filename, out_basename):
    src_path = os.path.join(BRAIN_DIR, src_filename)
    if not os.path.exists(src_path):
        print(f"Skipping tile {src_filename}, not found in brain.")
        return

    dst_path = os.path.join(TILES_DIR, f"{out_basename}.png")
    dst_flip = os.path.join(TILES_DIR, f"{out_basename}_flip.png")

    print(f"-> Processing tile: {src_filename} -> {out_basename}.png")
    img = Image.open(src_path).convert("RGB")
    img = img.resize((384, 384), Image.Resampling.LANCZOS)
    img.save(dst_path, format="PNG", optimize=True)
    flipped = flip_horizontal(img)
    flipped.save(dst_flip, format="PNG", optimize=True)
    print(f"   [OK] Tile {out_basename} saved (384x384)")

def create_circular_medallion(bg_color_inner, bg_color_outer, emblem_draw_fn, out_basename):
    """Vytvoří 384x384 luxusní kruhový medailon ve stejném stylu jako ostatní políčka."""
    size = 384
    img = Image.new("RGBA", (size, size), (228, 192, 137, 255)) # Pergamenový podklad
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    r_outer = 178
    r_gold_rim = 172
    r_inner_gold = 158
    r_art = 152

    # 1. Zlatý vnější reliéf
    for i in range(12):
        shade = int(180 + 70 * math.cos(i * 0.5))
        draw.ellipse([cx - r_outer + i, cy - r_outer + i, cx + r_outer - i, cy + r_outer - i], outline=(shade, int(shade * 0.8), int(shade * 0.3)), width=2)

    # 2. Vnitřní perlový / rytý kruh
    for deg in range(0, 360, 15):
        rad = math.radians(deg)
        px = cx + math.cos(rad) * 165
        py = cy + math.sin(rad) * 165
        draw.ellipse([px - 3, py - 3, px + 3, py + 3], fill=(255, 235, 160), outline=(120, 90, 30))

    # 3. Pozadí uvnitř medailonu (radiální gradient)
    for r in range(r_art, 0, -2):
        t = r / r_art
        cr = int(bg_color_inner[0] * (1 - t) + bg_color_outer[0] * t)
        cg = int(bg_color_inner[1] * (1 - t) + bg_color_outer[1] * t)
        cb = int(bg_color_inner[2] * (1 - t) + bg_color_outer[2] * t)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(cr, cg, cb))

    # 4. Heraldický motiv
    emblem_draw_fn(draw, cx, cy)

    # 5. Vnitřní zlatá obruba přes grafiku
    draw.ellipse([cx - r_inner_gold, cy - r_inner_gold, cx + r_inner_gold, cy + r_inner_gold], outline=(234, 179, 8), width=3)
    draw.ellipse([cx - r_art, cy - r_art, cx + r_art, cy + r_art], outline=(161, 98, 7), width=2)

    # Převod na RGB pro kompatibilitu s ostatními dlaždicemi
    final_img = img.convert("RGB")
    dst_path = os.path.join(TILES_DIR, f"{out_basename}.png")
    dst_flip = os.path.join(TILES_DIR, f"{out_basename}_flip.png")
    final_img.save(dst_path, format="PNG", optimize=True)
    flipped = flip_horizontal(final_img)
    flipped.save(dst_flip, format="PNG", optimize=True)
    print(f"   [OK] Procedural tile {out_basename} generated (384x384)")

def draw_krejci_emblem(draw, cx, cy):
    # Dvorní krejčí: luxusní sametové sukno + zlaté krejčovské nůžky + stříbrná jehla
    # Sametové skládané látky
    draw.polygon([(cx - 70, cy + 90), (cx - 10, cy + 30), (cx + 60, cy + 90), (cx, cy + 130)], fill=(120, 20, 45), outline=(180, 50, 80))
    draw.polygon([(cx - 50, cy + 80), (cx, cy + 40), (cx + 50, cy + 80), (cx, cy + 115)], fill=(150, 30, 60))
    # Zlaté nůžky (dvě zkřížená ramena a oka)
    # Čepele
    draw.line([(cx - 45, cy - 65), (cx + 35, cy + 25)], fill=(255, 235, 150), width=9)
    draw.line([(cx + 45, cy - 65), (cx - 35, cy + 25)], fill=(245, 215, 120), width=9)
    # Čepelové hroty (ostří)
    draw.polygon([(cx - 50, cy - 75), (cx - 40, cy - 60), (cx - 30, cy - 70)], fill=(255, 255, 200))
    draw.polygon([(cx + 50, cy - 75), (cx + 40, cy - 60), (cx + 30, cy - 70)], fill=(255, 255, 200))
    # Středový zlatý nýt
    draw.ellipse([cx - 7, cy - 20, cx + 7, cy - 6], fill=(255, 215, 0), outline=(140, 90, 10))
    # Držadla (oka nůžek)
    draw.ellipse([cx - 58, cy + 20, cx - 22, cy + 65], outline=(234, 179, 8), width=7)
    draw.ellipse([cx + 22, cy + 20, cx + 58, cy + 65], outline=(234, 179, 8), width=7)
    # Stříbrná jehla se zlatou nití
    draw.line([(cx + 55, cy - 40), (cx - 45, cy + 50)], fill=(240, 240, 250), width=3)
    draw.ellipse([cx + 53, cy - 44, cx + 59, cy - 36], fill=(220, 220, 230))
    # Zlatá vlnící se nit
    draw.arc([cx - 20, cy - 60, cx + 60, cy], start=180, end=350, fill=(255, 223, 0), width=2)
    draw.arc([cx - 60, cy - 20, cx + 20, cy + 40], start=40, end=210, fill=(255, 223, 0), width=2)

def draw_chance_emblem(draw, cx, cy):
    # Karta Náhody / Osudový svitek: pergamenový svitek s královskou pečetí a hvězdou osudu
    # Tělo svitku
    draw.polygon([(cx - 55, cy - 70), (cx + 55, cy - 60), (cx + 45, cy + 60), (cx - 65, cy + 50)], fill=(245, 230, 190), outline=(130, 90, 40))
    # Stíny a linky na svitku
    draw.line([(cx - 45, cy - 45), (cx + 45, cy - 35)], fill=(180, 150, 100), width=2)
    draw.line([(cx - 48, cy - 20), (cx + 42, cy - 10)], fill=(180, 150, 100), width=2)
    draw.line([(cx - 52, cy + 10), (cx + 38, cy + 20)], fill=(180, 150, 100), width=2)
    draw.line([(cx - 55, cy + 35), (cx + 35, cy + 45)], fill=(180, 150, 100), width=2)
    # Zatočené konce svitku
    draw.ellipse([cx - 70, cy - 80, cx - 40, cy - 60], fill=(225, 205, 160), outline=(130, 90, 40))
    draw.ellipse([cx + 35, cy + 45, cx + 65, cy + 65], fill=(225, 205, 160), outline=(130, 90, 40))
    # Královská pečeť (červený vosk uprostřed s hedvábnou stuhou)
    draw.polygon([(cx - 15, cy + 10), (cx - 5, cy + 65), (cx - 25, cy + 60)], fill=(160, 20, 30))
    draw.polygon([(cx + 15, cy + 10), (cx + 25, cy + 60), (cx + 5, cy + 65)], fill=(160, 20, 30))
    draw.ellipse([cx - 28, cy - 15, cx + 28, cy + 41], fill=(190, 25, 35), outline=(120, 15, 25), width=2)
    draw.ellipse([cx - 20, cy - 7, cx + 20, cy + 33], fill=(215, 35, 45))
    # Reliéfní otazník / koruna na vosku
    draw.arc([cx - 10, cy - 2, cx + 10, cy + 14], start=180, end=360, fill=(255, 225, 120), width=3)
    draw.line([(cx + 10, cy + 6), (cx, cy + 18)], fill=(255, 225, 120), width=3)
    draw.ellipse([cx - 2.5, cy + 22, cx + 2.5, cy + 27], fill=(255, 225, 120))
    # Magické zářící hvězdičky osudu
    for hx, hy in [(cx - 75, cy - 40), (cx + 70, cy - 25), (cx - 60, cy + 60), (cx + 65, cy + 40)]:
        draw.line([(hx - 6, hy), (hx + 6, hy)], fill=(255, 235, 150), width=2)
        draw.line([(hx, hy - 6), (hx, hy + 6)], fill=(255, 235, 150), width=2)

def draw_bonus_emblem(draw, cx, cy):
    # Rozcestní prémie / Pokladnice na milníku (+200 / +400 zl.)
    # Otevřená kovaná truhla s překypujícími zlaťáky
    # Tělo truhly
    draw.polygon([(cx - 65, cy + 15), (cx + 65, cy + 15), (cx + 55, cy + 80), (cx - 55, cy + 80)], fill=(75, 42, 20), outline=(35, 20, 10), width=2)
    # Zlaté kování rohů truhly
    draw.rectangle([cx - 65, cy + 15, cx - 52, cy + 80], fill=(202, 138, 4))
    draw.rectangle([cx + 52, cy + 15, cx + 65, cy + 80], fill=(202, 138, 4))
    draw.rectangle([cx - 10, cy + 15, cx + 10, cy + 80], fill=(234, 179, 8))
    # Zámková deska
    draw.ellipse([cx - 8, cy + 30, cx + 8, cy + 46], fill=(255, 225, 120), outline=(130, 90, 20))
    # Otevřené víko truhly
    draw.polygon([(cx - 68, cy + 12), (cx + 68, cy + 12), (cx + 50, cy - 45), (cx - 50, cy - 45)], fill=(95, 55, 25), outline=(45, 25, 10), width=2)
    draw.polygon([(cx - 48, cy - 42), (cx + 48, cy - 42), (cx + 62, cy + 10), (cx - 62, cy + 10)], fill=(65, 35, 15))
    # Halda třpytivých zlatých mincí
    for mx, my, mr in [
        (cx, cy - 5, 14), (cx - 25, cy + 5, 12), (cx + 25, cy + 5, 12),
        (cx - 15, cy - 15, 11), (cx + 15, cy - 15, 11), (cx, cy - 25, 12),
        (cx - 38, cy + 12, 10), (cx + 38, cy + 12, 10), (cx - 5, cy + 8, 11)
    ]:
        draw.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(255, 215, 0), outline=(180, 130, 10), width=2)
        draw.ellipse([mx - mr + 3, my - mr + 3, mx + mr - 3, my + mr - 3], outline=(255, 245, 170), width=1)
    # Zářivé drahokamy mezi mincemi
    # Rubín
    draw.polygon([(cx - 20, cy - 2), (cx - 12, cy - 12), (cx - 4, cy - 2), (cx - 12, cy + 6)], fill=(220, 20, 60), outline=(255, 100, 120))
    # Smaragd
    draw.polygon([(cx + 12, cy - 2), (cx + 20, cy - 12), (cx + 28, cy - 2), (cx + 20, cy + 6)], fill=(16, 185, 129), outline=(110, 231, 183))
    # Třpytky
    for sx, sy in [(cx - 45, cy - 35), (cx + 40, cy - 30), (cx, cy - 45)]:
        draw.line([(sx - 5, sy), (sx + 5, sy)], fill=(255, 255, 210), width=2)
        draw.line([(sx, sy - 5), (sx, sy + 5)], fill=(255, 255, 210), width=2)

def main():
    print("=== Zpracování assetů pro KiDesky: Princeznino srdce ===")

    # 1. Monstra
    monsters = [
        ("monster_boar_1793873137817.jpg", "monster_boar"),
        ("monster_wolf_pack_1793873152835.jpg", "monster_wolf_pack"),
        ("monster_bear_1793873170877.jpg", "monster_bear"),
        ("monster_white_stag_1793873187457.jpg", "monster_white_stag"),
        ("monster_rock_giant_1793873142927.jpg", "monster_rock_giant"),
        ("monster_warlock_1793873160146.jpg", "monster_warlock"),
        ("monster_black_knight_1793873180616.jpg", "monster_black_knight"),
        ("monster_cave_werewolf_1793873197773.jpg", "monster_cave_werewolf")
    ]
    for src, out in monsters:
        process_monster(src, out)

    # 2. Dlaždice z brain dir
    tiles_brain = [
        ("tile_master_1793873161863.jpg", "master"),
        ("tile_tax_1793873177176.jpg", "tax"),
        ("tile_jester_1793873197504.jpg", "jester"),
        ("tile_kovarna_1793873239010.jpg", "kovarna")
    ]
    for src, out in tiles_brain:
        process_tile_crop(src, out)

    # 3. Chybějící dlaždice: krejci, chance, bonus
    create_circular_medallion((90, 15, 30), (25, 5, 10), draw_krejci_emblem, "krejci")
    create_circular_medallion((55, 20, 80), (18, 5, 30), draw_chance_emblem, "chance")
    create_circular_medallion((20, 60, 40), (8, 25, 15), draw_bonus_emblem, "bonus")

    print("=== Všechny assety úspěšně připraveny! ===")

if __name__ == "__main__":
    main()
