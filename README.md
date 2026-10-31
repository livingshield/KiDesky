# KiDesky

> Digitální herní studio a online herní prostor pro deskové hry v rámci ekosystému **KikiAI / ekobio.org**.

## Přehled projektu
KiDesky se zaměřují na tvorbu moderních deskových her a jejich digitálních/online variant:
1. **Digitalizace & Herní plán** – Převod fyzických herních plánů na interaktivní 2D/3D plátno.
2. **Stavový automat & Pravidla** – Deterministický herní engine, správa tahů, kontrola legálnosti tahů a fází kol.
3. **Komponenty** – Virtuální balíčky karet, polyhedrální kostky, figurky a inventáře hráčů.
4. **Online Multiplayer & Lokální hra** – Možnost sdíleného hraní na jednom zařízení (hotseat) i online herních místností přes server `ekobio.org`.
5. **AI Oponenti & Asistence** – Rádce pravidel a autonomní spoluhráči pohánění Gemini AI.

## Struktura projektu
- [`index.html`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/index.html): Úvodní hello page projektu s interaktivním prototypem hodu kostkami.
- [`assets/`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/assets): Grafické podklady (hero obrázek `kidesky-hero.png` generovaný pro portál).
- [`Deskovky/`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/Deskovky): Originální fotografické podklady pravidel a komponent hry (`IMG_4594.HEIC` až `IMG_4600.HEIC`).

## Integrace s KikiAI (Landing Page)
- Karta projektu zařazena v portálu [`Kiki Cross Road`](file:///c:/Users/janky/.gemini/antigravity/scratch/KikiAI/KikiAI/wwwroot/index.html) (`APPS_DATA`).
- Položka přidána v navigačním menu `OSTATNÍ PROJEKTY` s odkazem na `/apps/KiDesky/`.
