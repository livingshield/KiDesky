# Analýza stavu projektu KiDesky – Princeznino srdce

**Aktualizováno k:** 05.11.2026 (Live Produkce: `v=202611050080`)  
**Produkční URL:** `https://www.ekobio.org/apps/KiDesky/`  
**Pracovní adresář:** `c:\Users\janky\.gemini\antigravity\scratch\KiDesky`

---

## 1. Poslední vyřešené úkoly a stavy

### A. YouTube přehrávání, Like, Odběr a Cyklování intro videí (v=202611050080) – HOTOVO
- **YouTube přehrávání:** Automatická detekce YouTube odkazů v adminu i v DB (vynucení `videoType = 'youtube'`), správný embed URL přes `youtube-nocookie.com` s parametry `autoplay=1&enablejsapi=1&playsinline=1` a atributy `allow="... web-share" referrerpolicy="strict-origin-when-cross-origin"`.
- **Like a Odběr kanálu:**
  - Přidán sloupec `[LikesCount]` v `prs_Videos` a endpoint `api.ashx?action=like-video&id=...`.
  - Tlačítko `👍 Líbí se mi` s počítadlem a animací.
  - Tlačítko `🔔 Odebírat` pro přímé přihlášení odběru na YouTube (`sub_confirmation=1`).
  - Tlačítko `📺 YouTube` pro zobrazení na YouTube s komentáři.
- **Cyklování videí (Carousel):**
  - Pokud je nahráno více intro videí, na přehrávači se zobrazují plovoucí navigační šipky `❮` / `❯` a pod přehrávačem indikační tečky s názvem videa `(1/3)`.
  - Plynulé přepínání mezi MP4 `<video>` a YouTube `<iframe>`.

### B. Panství, chovy, nájmy za kolo a hospodářská zvířata (v=202611050079 / b4669cd) – HOTOVO
- Opraveny počty panství a chovů v inventáři rytíře.
- Opraven výpočet zlaťáků za kolo a zobrazení nájmů na panstvích.
- Plně integrován chov hospodářských zvířat (krávy, ovce, prasata) bez zobrazení `undefined`.

### C. Oprava modálního okna správy videa (v=202611050077) – HOTOVO
- **Problém:** Modál `➕ Přidat nové video` / `🎬 Správa videa` (`#admin-video-modal`) byl příliš vysoký, spodní tlačítka (`Zrušit`, `💾 Uložit video`) byla odříznuta pod spodním okrajem obrazovky a v okně vyskakoval svislý scrollbar. Křížek `✕` navíc padal na samostatný řádek.
- **Implementované řešení:**
  1. **Globální modálová architektura (`css/modals.css`):**
     - Přidány flexibilní třídy `.modal-header`, `.modal-close`, `.modal-body` a `.modal-footer`.
     - `#admin-video-modal .modal-box` a `#admin-user-modal .modal-box` nastaveny na `display: flex !important; flex-direction: column !important; max-height: 92vh !important; overflow: hidden !important;`.
     - `.modal-header` i `.modal-footer` jsou ukotveny jako `flex-shrink: 0`, takže spodní tlačítka ("Zrušit", "Uložit video") i horní křížek jsou **vždy 100% viditelná a nikdy nezmizí pod oknem**.
     - Vnitřní `.modal-body` má `flex: 1 1 auto; overflow-y: auto;` se zlatým tenkým posuvníkem pouze v případě, že se na extrémně nízkých displejích celý formulář nevejde.
  2. **Kompaktní responzivní formulář (`index.html`):**
     - Sloučen křížek `✕` do jednoho řádku s titulkem `🎬 Správa videa`.
     - Zmenšena vertikální odsazení polí z `0.75rem`/`0.85rem` na kompaktní `0.45rem`.
     - Upload box zmenšen z `padding: 0.75rem` na `0.45rem 0.65rem`.
     - Vše se nyní na standardních i notebookových displejích pohodlně vejde do zobrazení bez jakéhokoliv scrollbaru.
  3. **Deploy:** Úspěšně nahráno na ASPONE FTP do obou větví (`/www/apps/KiDesky/` i `/www/wwwroot/apps/KiDesky/`). Ověřeno HTTP 200 s `v=202611050077`.

---

## 2. Přísná pravidla projektu (AGENTS.md)
1. **ZÁKAZ .EXE SOUBORŮ:** Na FTP ASPONE se NIKDY nesmí nahrávat žádné `.exe` soubory.
2. **KÓDOVÁNÍ UTF-8 BEZ BOM:** Všechny soubory HTML, JS a CSS musí být upravovány výhradně v UTF-8 kódování, nikdy nepoužívat PowerShell `Set-Content` bez ověření.
3. **SYNCHRONNÍ DEPLOY:** Vždy nahrávat do obou FTP větví (`/www/apps/KiDesky/` a `/www/wwwroot/apps/KiDesky/`).
