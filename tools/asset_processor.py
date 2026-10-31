"""
KiDesky Asset Processor
=======================
Automatizovaný nástroj pro:
1. Převod obrázků (JPG/PNG) a odstranění pozadí do čistého průhledného PNG (RGBA).
2. Horizontální zrcadlení (otočení vlevo/vpravo: *_flip.png), aby se draci,
   hrady i dekorace mohly dívat a směřovat na obě strany plánu.
3. Přípravu dekorací z Deskovky/dekorace do assets/decorations.
4. Dávkové vytvoření otočených variant pro všechny existující herní assety.
"""

import os
import sys
import argparse
import io
from PIL import Image

# Zajištění UTF-8 výstupu v konzoli Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import rembg
    HAS_REMBG = True
except ImportError:
    HAS_REMBG = False
    print("VAROVÁNÍ: Balíček rembg není dostupný, odstranění pozadí bude omezeno.")


def trim_transparent_borders(img: Image.Image, padding: int = 4) -> Image.Image:
    """Ořízne přebytečné průhledné okraje okolo objektu s malým paddingem."""
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


def remove_background(image_input, post_trim: bool = True) -> Image.Image:
    """Odstraní pozadí z obrázku pomocí rembg a vrátí RGBA Image."""
    if isinstance(image_input, str):
        with open(image_input, "rb") as f:
            raw_bytes = f.read()
    elif isinstance(image_input, bytes):
        raw_bytes = image_input
    elif isinstance(image_input, Image.Image):
        buf = io.BytesIO()
        image_input.save(buf, format="PNG")
        raw_bytes = buf.getvalue()
    else:
        raise ValueError("Nepodporovaný vstup pro remove_background")

    if HAS_REMBG:
        out_bytes = rembg.remove(raw_bytes)
        img = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    else:
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")

    if post_trim:
        img = trim_transparent_borders(img)
    return img


def flip_horizontal(img: Image.Image) -> Image.Image:
    """Vrátí horizontálně převrácený (zrcadlený) obrázek."""
    return img.transpose(Image.FLIP_LEFT_RIGHT)


def optimize_image(img: Image.Image, max_dim: int = 600) -> Image.Image:
    """Zmenší rozlišení pro webové použití při zachování ostrosti a poměru stran."""
    w, h = img.size
    if max(w, h) > max_dim:
        scale = max_dim / max(w, h)
        new_w = max(1, int(w * scale))
        new_h = max(1, int(h * scale))
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    return img


def sanitize_filename(filename: str) -> str:
    """Převede název souboru na bezpečný tvar pro webové assety."""
    base, _ = os.path.splitext(filename)
    clean = base.strip().lower()
    clean = clean.replace(" ", "_").replace("-", "_")
    # Odstranění běžné diakritiky pro konzistentní asset URL
    accent_map = {
        "á": "a", "č": "c", "ď": "d", "é": "e", "ě": "e",
        "í": "i", "ň": "n", "ó": "o", "ř": "r", "š": "s",
        "ť": "t", "ú": "u", "ů": "u", "ý": "y", "ž": "z"
    }
    for k, v in accent_map.items():
        clean = clean.replace(k, v)
    return clean + ".png"


def process_file_single(input_path: str, output_path: str, make_flip: bool = True, max_dim: int = 600):
    """Zpracuje jeden soubor: odstraní pozadí, uloží PNG a vygeneruje _flip variantu."""
    print(f"-> Zpracovávám: {input_path}")
    img_rgba = remove_background(input_path, post_trim=True)
    img_opt = optimize_image(img_rgba, max_dim=max_dim)
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img_opt.save(output_path, format="PNG", optimize=True)
    print(f"   [OK] Uloženo: {output_path} ({img_opt.size[0]}x{img_opt.size[1]})")

    if make_flip:
        base, ext = os.path.splitext(output_path)
        flip_path = f"{base}_flip{ext}"
        flipped_img = flip_horizontal(img_opt)
        flipped_img.save(flip_path, format="PNG", optimize=True)
        print(f"   [OK] Uloženo zrcadlení: {flip_path}")


def process_decorations_dir(
    src_dir: str = "Deskovky/dekorace",
    dst_dir: str = "assets/decorations",
    max_dim: int = 600
):
    """Převede všechny obrázky dekorací z Deskovky/dekorace do assets/decorations s průhledností a otočením."""
    if not os.path.exists(src_dir):
        print(f"Chyba: Zdrojový adresář {src_dir} neexistuje.")
        return

    os.makedirs(dst_dir, exist_ok=True)
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    files = [f for f in sorted(os.listdir(src_dir)) if os.path.splitext(f)[1].lower() in valid_exts]
    
    print(f"\n=== ZPRACOVÁNÍ DEKORACÍ ({len(files)} souborů) ===")
    for f in files:
        src_path = os.path.join(src_dir, f)
        target_name = sanitize_filename(f)
        dst_path = os.path.join(dst_dir, target_name)
        process_file_single(src_path, dst_path, make_flip=True, max_dim=max_dim)
    print(f"=== HOTOVO: Dekorace připraveny v {dst_dir} ===\n")


def process_directory_flips_only(dir_path: str):
    """Pro všechny PNG soubory v daném adresáři vytvoří chybějící *_flip.png varianty."""
    if not os.path.exists(dir_path):
        return

    files = sorted(os.listdir(dir_path))
    count = 0
    print(f"\n--- Generování otočených variant pro {dir_path} ---")
    for f in files:
        if not f.lower().endswith(".png"):
            continue
        if "_flip" in f.lower():
            continue

        base, ext = os.path.splitext(f)
        flip_name = f"{base}_flip{ext}"
        flip_path = os.path.join(dir_path, flip_name)

        if not os.path.exists(flip_path):
            src_path = os.path.join(dir_path, f)
            try:
                with Image.open(src_path) as im:
                    im_flipped = flip_horizontal(im)
                    im_flipped.save(flip_path, format="PNG", optimize=True)
                print(f"   [+] Vytvořeno zrcadlení: {flip_name}")
                count += 1
            except Exception as ex:
                print(f"   [!] Chyba při zrcadlení {f}: {ex}")
        else:
            # Již existuje
            pass
    print(f"Adresář {dir_path}: nově vytvořeno {count} otočených souborů.")


def process_all_game_assets():
    """Kompletní zpracování: dekorace + zrcadlení všech existujících draků, hradů a dominant."""
    # 1. Dekorace
    process_decorations_dir("Deskovky/dekorace", "assets/decorations", max_dim=600)

    # 2. Draci
    process_directory_flips_only("assets/dragons")

    # 3. Hrady
    process_directory_flips_only("assets/castles")

    # 4. Dominanty a ikony
    process_directory_flips_only("assets/landmarks")
    process_directory_flips_only("assets/tiles")
    process_directory_flips_only("assets/decorations")


def main():
    parser = argparse.ArgumentParser(description="KiDesky Asset & Flip Processor")
    parser.add_argument("--decorations", action="store_true", help="Zpracovat dekorace z Deskovky/dekorace")
    parser.add_argument("--flip-all", action="store_true", help="Vytvořit otočené varianty (_flip.png) pro všechny assety")
    parser.add_argument("--all", action="store_true", help="Spustit kompletní proces (dekorace + flip pro vše)")
    parser.add_argument("--file", type=str, help="Zpracovat jednotlivý soubor")
    parser.add_argument("--out", type=str, help="Cílová cesta pro jednotlivý soubor")

    args = parser.parse_args()

    if args.file:
        out = args.out or sanitize_filename(os.path.basename(args.file))
        process_file_single(args.file, out, make_flip=True)
    elif args.decorations:
        process_decorations_dir()
    elif args.flip_all:
        for d in ["assets/dragons", "assets/castles", "assets/landmarks", "assets/tiles", "assets/decorations"]:
            process_directory_flips_only(d)
    elif args.all or len(sys.argv) == 1:
        process_all_game_assets()


if __name__ == "__main__":
    main()
