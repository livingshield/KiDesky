# Komplexní analýza stavu projektu KiDesky: Princeznino srdce (Handoff pro nový chat)

> **Datum vyhotovení:** 5. 11. 2026  
> **Aktuální verze cache-busteru:** `?v=202611050074`  
> **Poslední Git commit:** `7a49cb5` (`feat(biome-audio, chronicle, content): add procedural footsteps & bridge sounds, river Doubravka chronicle events, telemetry, 4th festival (Lov), and chance cards ch_51-ch_57`)  
> **Produkční URL:** https://www.ekobio.org/apps/KiDesky/  
> **Lokální pracovní adresář:** `c:\Users\janky\.gemini\antigravity\scratch\KiDesky`

---

## 1. KRITICKÁ PRAVIDLA PROJEKTU (ASPONE HOSTING)

> [!CAUTION]
> **PŘÍSNÝ ZÁKAZ NAHRÁVÁNÍ SOUBORŮ `.EXE` NA FTP ASPONE:**
> 1. Na FTP server `windows11.aspone.cz` (ani žádný jiný server poskytovatele ASPONE) se **za žádných okolností nesmí nahrávat soubory s příponou `.exe`** (ani přejmenované jako `*.exe.bak`).
> 2. Backend této aplikace běží jako čistý ASP.NET WebHandler (`api.ashx`, C# 5 kompatibilní inline kód kompilovaný za běhu IIS) bez jakýchkoliv `.exe` binárek.
> 3. Veškeré nasazovací skripty (`deploy_code_update.ps1` apod.) obsahují explicitní bezpečnostní filtr proti `.exe` a stejný filtr je i v endpointu `HandleUploadVideo` v `api.ashx`.
> 4. **Dvojitý webroot na serveru ASPONE:** Na FTP serveru existují dvě paralelní cesty:
>    - `/www/apps/KiDesky/`
>    - `/www/wwwroot/apps/KiDesky/`
>    Všechny deploy skripty i serverový upload (`HandleUploadVideo`) proto vždy zapisují/synchronizují soubory do **obou** těchto adresářů.

---

## 2. ARCHITEKTURA PROJEKTU A STRUKTURA SOUBORŮ

Projekt je postaven jako rychlá, modulární Single-Page Web Application (Vanilla ES5/ES6 JavaScript + HTML5 + CSS3 + SVG) napojená na ASP.NET (`api.ashx`) a produkční databázi **Microsoft SQL Server (`db4937`)**.

### 2.1 Kořenové soubory a konfigurace
| Soubor | Velikost | Popis a role v systému |
| :--- | :--- | :--- |
| [`index.html`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/index.html) | ~145 KB | Hlavní kostra aplikace: Landing Page s živou 16:9 canvas animací a přepínatelným MP4/YouTube videem, Lobby, Herní obrazovka (SVG herní plán, HUD panely, mobilní dok), Katalog & Bestiář, Královská administrace a 20+ modálních oken. |
| [`api.ashx`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/api.ashx) | ~85 KB | Kompletní C# backend handler (UTF-8 s BOM). Zajišťuje automatickou migraci DB schématu `prs`, autentizaci, správu herních místností (online multiplayer), telemetrii, upload videí/plakátů a 7 sekcí Královské administrace. |
| [`web.config`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/web.config) | ~0.8 KB | Konfigurace IIS: UTF-8 globalizace (`cs-CZ`), `<customErrors mode="Off" />`, navýšené limity pro upload MP4 videí (`maxRequestLength="524288"` KB / `maxAllowedContentLength="536870912"` B = 512 MB, `executionTimeout="600"`) a MIME typy `.mp4` / `.webm`. |
| [`deploy_code_update.ps1`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/deploy_code_update.ps1) | ~4.3 KB | Hlavní nasazovací PowerShell skript, který nahraje HTML, `web.config`, `api.ashx`, CSS, JS a assety do obou větví na FTP (`/www/apps/KiDesky/` i `/www/wwwroot/apps/KiDesky/`). |
| [`PRAVIDLA_PRINCEZNINO_SRDCE.md`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/PRAVIDLA_PRINCEZNINO_SRDCE.md) | ~22 KB | Kompletní referenční dokumentace pravidel deskové hry *Princeznino srdce*. |
| [`KATALOG_GRAFIKY_A_ASSETU.md`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/KATALOG_GRAFIKY_A_ASSETU.md) | ~16.7 KB | Dokumentace grafických podkladů a vizuálního stylu. |

### 2.2 Stylopisy (`css/`)
| Soubor | Velikost | Popis |
| :--- | :--- | :--- |
| [`css/main.css`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/css/main.css) | ~27.5 KB | Globální proměnné, typografie (`Cinzel`, `Inter`), hlavička, ticker Královského posla, Landing Page (hero sekce, živá animace, přepínač videa), Lobby a pódium vítězů. |
| [`css/board.css`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/css/board.css) | ~52 KB | Vzhled herní obrazovky, horní lišty hráčů (`Top Players HUD`), SVG herního plánu, políček, figurek, dekorací, pravého akčního panelu a pokladnice. |
| [`css/modals.css`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/css/modals.css) | ~54.5 KB | Styly všech modálních oken: souboje s monstry/draky (`#quest-duel-modal`) s kompaktní horizontální kartou trofeje bez scrollbaru, rytířský duel cti (`#knight-duel-modal`), slavnosti, katalog, administrace a karta náhody (`#chance-card-modal`). |
| [`css/mobile.css`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/css/mobile.css) | ~35.2 KB | Kompletní responzivní adaptace pro mobily a tablety: spodní akční dok, mobilní vyskakovací karta hráče se zavíracím tlačítkem a tap-outside zavíráním, optimalizace modálů pro malé obrazovky. |

### 2.3 JavaScriptové moduly (`js/`)
Architektura je čistě rozdělena do 12 specializovaných modulů (načítaných v přesném pořadí v `index.html`):

1. [`js/game-data.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/game-data.js) (~86 KB)
   - `window.PRS_DEFAULT_CONFIG`: Ekonomické konstanty, ceny panství, zvířat, předmětů a odměn.
   - `window.PRS_GRAPHICS_CONFIG`: Cesty k bitmapovým medailonům políček, hradům a dekoracím.
   - `window.PRS_CASTLES`: 10 unikátních hradů s živlovými bonusy.
   - `window.PRS_ITEMS` & `window.PRS_TROPHIES`: 20 základních předmětů (3 stupně, 4 sloty) + **63 unikátních trofejí a relikvií** (přiřazených do 5. slotu `"trophy"`).
   - `window.PRS_QUESTS`: Kompletní bestiář rozdělený na **U1** (14 druhů zvěře), **U2 / U2+** (24 monster a bájných titánů) a **U3** (20 draků ve 3 tierech: Mladí, Živloví, Vícehlavé saně/Bossové).
   - `window.PRS_CHANCE_CARDS`: 50 vyvážených karet Náhody & Osudu (25 pozitivních, 13 negativních, 12 interaktivních dilemat s volbou A/B).
2. [`js/game-boards.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/game-boards.js) (~81 KB)
   - Definice herních map/plánů (Klasický královský plán, Rozšířené království atd.), souřadnice políček, propojení křižovatek a rozmístění dekorací krajiny.
3. [`js/game-engine.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/game-engine.js) (~102 KB)
   - Deterministický herní engine (`KiDeskyGameEngine`): správa stavu hry, hráčů, tahů, 4 obtížností (`easy`, `standard`, `hard`, `ultimate`), pohybových postojů, cvalu s koněm, sokolí navigace, křižovatek, nákupů panství/zvířat/výbavy, daní, špitálu, vězení a podmínek vítězství (vč. scénáře Drakobijce).
4. [`js/game-combat-ai.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/game-combat-ai.js) (~69 KB)
   - Rozšíření enginu o soubojový systém (bojové postoje: Opatrný, Vyvážený, Zuřivý; taktické přehody kostkou; vyhodnocení slabin draků a monster s bonusem `+2` k síle; Rytířský duel cti mezi hráči) a rozhodovací logiku AI protivníků.
5. [`js/app-audio.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-audio.js) (~15.6 KB)
   - WebAudio syntetizér zvukových efektů (kostky, mince, fanfáry, meče, srdce) + přehrávač hudby na pozadí (`bgm_court.mp3`, `bgm_tavern.mp3`, `bgm_tournament.mp3`).
6. [`js/app.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app.js) (~64.5 KB)
   - Jádro klientské aplikace (`window.KiDeskyApp`): inicializace, přepínání obrazovek, autentizace (`login`, `register`, správa přezdívky `displayName`), nastavení lobby, živá canvas animace na Landing Page a přepínání Hero videa.
7. [`js/app-board.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-board.js) (~114.5 KB)
   - Vykreslování interaktivního SVG herního plánu, zoom & pan (vč. potlačení nativního dragování obrázků), nekolizní formace figurek na políčkách, animace skoků figurky, automatické centrování kamery na aktivního hráče a interaktivní tooltipy dekorací.
8. [`js/app-hud.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-hud.js) (~167 KB)
   - Vykreslování horního přehledu hráčů (`Top Players HUD`), pravého akčního panelu s pokladnicí, mobilního doku, mobilní vyskakovací karty hráče (`dismissMobilePlayerCard`), automatické synchronizace fokusu na aktivního hráče na začátku tahu/kola a obsluhy karet Náhody.
9. [`js/app-modals.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-modals.js) (~107 KB)
   - Veškerá modální okna: Soubojová aréna (`#quest-duel-modal`), Rytířský duel cti (`#knight-duel-modal`), Slavnosti (Turnaj, Ples, Dostihy), Trénink u mistra, Kupec, Pravidla, Nastavení a dedikovaný modál Karty náhody (`#chance-card-modal`).
10. [`js/app-online.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-online.js) (~37 KB)
    - Online synchronizace herních místností (vytvoření místnosti, připojení přes kód, polling stavu, ukládání do MSSQL).
11. [`js/app-catalog.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-catalog.js) (~30.5 KB)
    - Vizuální katalog a Bestiář všech hradů, draků, monster, trofejí a dekorací s filtrováním a náhledem detailů.
12. [`js/app-admin.js`](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/js/app-admin.js) (~47.6 KB)
    - Kompletní klientská logika pro Královskou administraci (správa videí s uploadem a progress barem, správa uživatelů, správa herních relací, Královský posel, editor pravidel/balance, telemetrie a diagnostika).

---

## 3. DATABÁZOVÉ SCHÉMA A BACKEND API (`api.ashx`)

### 3.1 Databázové tabulky (MSSQL `db4937`, schéma `[prs]`)
Všechny tabulky používají schéma `prs` a prefix `prs_`. Jsou automaticky vytvářeny a migrovány při startu přes `EnsureDatabaseSchema()` a `EnsureExtendedAdminSchema()`:

1. **`[prs].[prs_Users]`** – Registrovaní uživatelé (`Id`, `Username`, `DisplayName`, `Email`, `PasswordHash`, `Role` [`Admin`/`Player`], `IsActive`, `GamesPlayed`, `GamesWon`, `CreatedAt`, `LastLoginAt`).
   - *Pozn.:* Účty `admin`, `rytir_jan` a `jan.kytyr@seznam.cz` mají automaticky garantovanou roli `Admin`.
2. **`[prs].[prs_GameSessions]`** – Online a uložené herní relace (`Id`, `SessionGuid`, `RoomCode`, `SessionName`, `HostUsername`, `GameMode`, `Status`, `CurrentRound`, `ActivePlayerIndex`, `WinnerName`, `StateJson`, `CreatedAt`, `UpdatedAt`).
3. **`[prs].[prs_SessionPlayers]`** – Hráči v jednotlivých relacích (`Id`, `SessionGuid`, `PlayerIndex`, `PlayerName`, `IsAi`, `Color`, `Hearts`, `Gold`, `IsWinner`).
4. **`[prs].[prs_GameConfigs]`** – Uložené konfigurace herního balancu (`Id`, `VersionName`, `IsActive`, `ConfigJson`, `UpdatedBy`, `UpdatedAt`).
5. **`[prs].[prs_TelemetryLogs]`** – Záznamy událostí a chyb (`Id`, `SessionGuid`, `EventType`, `PlayerName`, `RoundNumber`, `TileCode`, `PayloadJson`, `CreatedAt`).
6. **`[prs].[prs_BoardTemplates]`** – Šablony herních plánů (`Id`, `TemplateCode`, `TemplateName`, `BoardJson`, `IsDefault`, `UpdatedAt`).
7. **`[prs].[prs_Videos]`** – Videa a upoutávky pro Landing Page (`Id`, `Title`, `Description`, `VideoType` [`mp4`/`youtube`], `Url`, `PosterUrl`, `Category`, `IsHeroActive`, `SortOrder`, `CreatedAt`).
8. **`[prs].[prs_Announcements]`** – Zprávy v horní liště Královského posla (`Id`, `Message`, `LinkUrl`, `IsActive`, `CreatedAt`).

### 3.2 Přehled všech 30 endpointů v `api.ashx?action=...`
- **Systém & Status:** `hello`, `status`, `admin-stats`, `admin-system-info`
- **Uživatelé & Profil:** `register`, `login`, `update-profile`, `admin-list-users`, `admin-update-user`, `admin-reset-password`, `admin-delete-user`
- **Videa & Upload:** `list-videos`, `hero-video`, `upload-video` (alias `admin-upload-video`), `admin-save-video`, `admin-delete-video`, `admin-set-hero-video`
- **Královský posel (Oznámení):** `get-announcement`, `admin-save-announcement`
- **Herní konfigurace:** `get-config`, `save-config`
- **Herní místnosti & Telemetrie:** `save-session`, `list-sessions`, `check-session`, `load-session`, `admin-list-sessions`, `admin-close-session`, `admin-purge-sessions`, `log-telemetry`

---

## 4. PŘEHLED NEDÁVNO DOKONČENÝCH OPRAV A FUNKCÍ

1. **Královská administrace (7 sekcí) + Upload videí na server:**
   - Administrátor může v sekci **Videa & Multimédia** přímo ze svého počítače vybrat `.mp4`/`.webm`/`.mov` soubor (nebo obrázek plakátu `.jpg`/`.png`/`.webp`).
   - Soubor se nahraje přes `XMLHttpRequest` s živým ukazatelem průběhu (%) na server do `assets/video/` (resp. `assets/board/`), automaticky se zrcadlí do obou webroot složek (`/www/apps/KiDesky/` i `/www/wwwroot/apps/KiDesky/`) a předvyplní URL pole.
   - Pro YouTube odkazy funguje tlačítko **Načíst z YT**, které přes oEmbed API automaticky vyplní název videa a URL náhledového plakátu.
2. **Oprava češtiny a kódování UTF-8 v administraci a databázi:**
   - Opravena syntaktická chyba v `api.ashx` (chybějící uzavírací závorka v `HandleUploadVideo`).
   - Zajištěn korektní UTF-8 BOM v `api.ashx` a `js/app-admin.js`, přidána direktiva `<globalization fileEncoding="utf-8" ... />` v `web.config`.
   - V `EnsureExtendedAdminSchema` doplněn automatický čistící SQL dotaz, který opravil poškozenou diakritiku (Mojibake) v tabulkách `prs_Videos`, `prs_Announcements` a `prs_Users`. Ověřeno živě na produkci.
3. **Automatický přechod fokusu a kamery na aktivního hráče:**
   - Při ukončení tahu nebo kola se `selectedPlayerId` v HUDu automaticky přepne na aktuálně hrajícího lidského hráče (nebo hráče na tahu) a kamera herního plánu se na něj plynule vycentruje (`centerBoardOnTile`).
4. **Mobilní vylepšení – Zrušitelná info tabulka hráče:**
   - V mobilním režimu má plovoucí karta označeného hráče tlačítko `✕ Zavřít` v hlavičce, spodní tlačítko `Zavřít detail rytíře` a globální posluchač pro klepnutí mimo kartu (tap-outside), takže nikdy nezablokuje výhled na mapu.
5. **Mobilní vylepšení – Dedikovaný modál Karty náhody (`#chance-card-modal`):**
   - Při stoupnutí na políčko Náhoda (`CHANCE`) nebo klepnutí na balíček karet se na mobilu automaticky otevře přehledný modál s plným textem karty, případnými tlačítky dilematu (Volba A / Volba B) a tlačítkem pro pokračování/ukončení tahu.
6. **Kompaktní soubojový modál bez scrollbaru (`#quest-duel-modal` a `#knight-duel-modal`):**
   - Výsledková ceremonie po souboji s monstrem/drakem byla přepracována: karta získané trofeje (`.quest-trophy-ceremony-card`) má nyní kompaktní horizontální rozvržení (ikona vlevo, popis a tlačítko nasazení vpravo), zmenšeny vertikální rozestupy a bannery, takže se celý výsledek i tlačítko **Pokračovat ve hře** pohodlně vejde do okna bez posuvníku na desktopu i mobilu.

---

## 5. ZBÝVAJÍCÍ / OTEVŘENÉ ÚKOLY PRO DALŠÍ CHAT

Při kontrole grafických assetů (`KATALOG_GRAFIKY_A_ASSETU.md` a `js/game-data.js`) byly identifikovány dvě volitelné grafické oblasti, které lze v novém chatu dogenerovat:

### 5.1 Dogenerování 8 unikátních ilustrací pro původní bytosti (U1 a U2)
Všechny nově přidané příšery (34 monster v `assets/monsters/` a 20 draků v `assets/dragons/`) již mají své vlastní průhledné PNG ilustrace i zrcadlové `_flip.png` varianty. První 4 zvířata v `U1` a první 4 protivníci v `U2` však zatím v `js/game-data.js` (řádky 830–833 a 847–850) dočasně odkazují na obrázky dekorací z `assets/decorations/`:

1. **`u1_1` – Divoký kňour** (aktuálně používá `assets/decorations/cave_bear_den.png`) -> vytvořit `assets/monsters/monster_boar.png` + `_flip.png`
2. **`u1_2` – Smečka šedých vlků** (aktuálně používá `assets/decorations/bandit_cave.png`) -> vytvořit `assets/monsters/monster_wolf_pack.png` + `_flip.png`
3. **`u1_3` – Horský medvěd** (aktuálně používá `assets/decorations/snow_troll_cave.png`) -> vytvořit `assets/monsters/monster_bear.png` + `_flip.png`
4. **`u1_4` – Královský bílý jelen** (aktuálně používá `assets/decorations/unicorn_grove.png`) -> vytvořit `assets/monsters/monster_white_stag.png` + `_flip.png`
5. **`u2_1` – Skalní obr** (aktuálně používá `assets/decorations/swamp_troll.png`) -> vytvořit `assets/monsters/monster_rock_giant.png` + `_flip.png`
6. **`u2_2` – Temný černokněžník** (aktuálně používá `assets/decorations/witch_hut.png`) -> vytvořit `assets/monsters/monster_warlock.png` + `_flip.png`
7. **`u2_3` – Černý loupeživý rytíř** (aktuálně používá `assets/decorations/ancient_ruins.png`) -> vytvořit `assets/monsters/monster_black_knight.png` + `_flip.png`
8. **`u2_4` – Jeskynní vlkodlak** (aktuálně používá `assets/decorations/basilisk_cave.png`) -> vytvořit `assets/monsters/monster_cave_werewolf.png` + `_flip.png`

### 5.2 Dogenerování 7 bitmapových medailonů políček (`assets/tiles/`)
V `window.PRS_GRAPHICS_CONFIG.tileBitmapsByType` (`js/game-data.js`, řádky 97–115) mají následující typy políček prázdnou cestu `""` a používají procedurální vektorový SVG medailon:
1. **`MASTER`** (Cvičební mistr rytířských ctností) -> `assets/tiles/master.png`
2. **`TAX`** (Královský výběrčí daní / Výnos panství) -> `assets/tiles/tax.png`
3. **`JESTER`** (Královský šašek / Kejklíř) -> `assets/tiles/jester.png`
4. **`kovarna`** (Mistr kovář / Zbrojíř) -> `assets/tiles/kovarna.png`
5. **`krejci`** (Dvorní krejčí) -> `assets/tiles/krejci.png`
6. **`CHANCE`** (Karta Náhody & Osudu – otazník / svitek) -> `assets/tiles/chance.png`
7. **`BONUS`** (Rozcestní prémie +200 / +300 / +400 zl.) -> `assets/tiles/bonus.png`

### 5.3 Implementace přirozeného terénu a dynamického procedurálního generátoru mapy (DOKONČENO)
1. **Deterministický procedurální generátor (`window.KiDeskyMapGenerator`):**
   - Vytvořen parametrický LCG generátor podle `seed`, který syntetizuje topologii grafu (112 uzlů: 78 vnějších + 3 strategické vnitřní větvy: Dračí stezka 13 uzlů, Most Slavností 14 uzlů, Hradní smyčka 7 uzlů).
   - Náhodný výběr 2 tematických hradů ze seznamu 9 hradů (`THEMATIC_CASTLES`) pro políčka `H1` a `H2`.
   - Všechny uzly mají garantované herní parametry (`code`, `type`, `subtype`, `setId`, `estateId`, `hasRoof`, `isJunction`, `branchLow`, `branchHigh`).
2. **Přirozený terén a akvarelové biomy:**
   - 4 sémantické biomy (Hluboký hvozd, Dračí pohoří, Zlaté lučiny, Vodní mokřady) s měkkým rozostřením `url(#biomeBlur)` a vrstevnicemi pro hory.
   - Meandrující řeka Doubravka se stínem břehů, leskem hladiny a automatickými kamennými mosty na všech kříženích s cestami.
   - Ekosystémové shluky stromů a pohoří (`spawnForestThicket`, `spawnMountainRidge`), stromy se přirozeně překrývají a netvoří izolované tečky.
   - Zušlechtění 8 balíčků karet: pergamenový poloprůsvitný podklad `url(#cardParchmentGrad)` se zlatým filigránovým kováním, který již nedusí střed mapy.
3. **UI a živé ovládání:**
   - V herní liště i v Lobby přidáno tlačítko `🎲 Nová mapa (Seed)` s možností rerollu mapy.
   - Integrace do `index.html` (cache-buster `?v=202611050074`), `js/game-boards.js`, `js/app-board.js`, `js/game-engine.js`, `js/app.js`.
   - Otestováno a nasazeno na produkci (HTTP 200 OK na `https://www.ekobio.org/apps/KiDesky/`).

### 5.4 Audio biomů, kronika přechodu mostů a hradů, telemetrie a rozšíření karet (DOKONČENO)
1. **Audio a ambientní atmosféra podle biomu (`js/app-audio.js` & `js/app-hud.js`):**
   - Implementovány syntetické procedurální Web Audio efekty: `playBiomeStep(biome)` (měkký došlap v lese, křupání štěrku v horách, šplouchání u vody, mramorová dlažba v hradu, šustění trávy na lučinách).
   - `playBridgeCrossing()`: zvuk přechodu dřevěného/kamenného mostu s ozvěnou vody a dvojím klapnutím podkov.
   - `playCastleArrival()`: fanfára kvinty a oktávy při příjezdu k hradním branám.
2. **Královská kronika a telemetrie (`js/game-engine.js` & `js/app.js`):**
   - V kronice se automaticky zaznamenává přechod mostu přes řeku Doubravku i slavnostní příjezd a koupě hradu.
   - Při vygenerování nového procedurálního světa se automaticky odesílá telemetrie `WorldGenerated` na `api.ashx?action=log-telemetry` se všemi parametry (seed, scénář, hráči).
3. **Herní obsah a 4. slavnost (`js/game-data.js`):**
   - Přidána 4. královská slavnost: **Královský hon** (`lov: [1400, 700, 350] zl.`).
   - Přidáno 7 nových karet Náhody (`ch_51` až `ch_57`): *Zlatá rybka z řeky Doubravky* (+1 💖), *Přízeň hradního pána* (+2 000 zl.), *Tajemství starého mostu* (Předmět 1. stupně zdarma), *Mýtné na mostě Doubravka* (-800 zl.), *Horská vichřice z Dračích skal* (-1 000 zl.), *Dilema: Převozník u soutoku Doubravky* a *Dilema: Potulný alchymista z Křišťálového zámku*.

---

## 6. DOPORUČENÝ STARTOVNÍ PROMPT PRO NOVÝ CHAT

Pro plynulé navázání v novém okně konverzace stačí zkopírovat a vložit následující prompt:

```text
Pokračujeme ve vývoji projektu KiDesky: Princeznino srdce v adresáři c:\Users\janky\.gemini\antigravity\scratch\KiDesky.
Nejprve si přečti kompletní handoff dokument ANALYZA_STAVU_PROJEKTU_PRO_NOVY_CHAT.md a pravidla v AGENTS.md (přísný zákaz nahrávání .exe souborů na FTP ASPONE).
Zkontroluj aktuální stav a dej mi vědět, že jsi připraven pokračovat.
```
