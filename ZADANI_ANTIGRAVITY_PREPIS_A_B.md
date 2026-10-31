# Zadání pro Google Antigravity: Přepis audia a videa s lokální AI (režimy A + B)

**Verze zadání:** 1.0  
**Datum:** 24. 10. 2026  
**Jazyk aplikace i dokumentace:** čeština  
**Charakter projektu:** soukromá webová aplikace, později rozšiřitelná pro více uživatelů  
**Klíčové omezení:** žádná placená AI API, žádné účtování AI tokenů a žádná povinná závislost na externí inferenční službě

> **Pokyn vývojovému agentovi:** Neimplementuj celý systém najednou. Postupuj po etapách se samostatnými funkčními prototypy, testy a kontrolními body. Neslibuj implementovanou funkci bez skutečného ověření. Neodhaduj podporu hostingu, WebGPU ani GPU ovladačů: co nelze ověřit, zapiš jako otevřený bod. Nedoplňuj do kódu skutečné přístupy ani tajemství, pokud nebyly výslovně a bezpečně poskytnuty. Po každé etapě zanech běžící aplikaci, návod na spuštění, testovací protokol a soupis dalších kroků.

---

## 1. Cíl projektu

Vyvinout responzivní webovou aplikaci, která převádí českou i cizojazyčnou řeč z audio/video souborů na text, umožňuje text opravovat, prohledávat a exportovat a volitelně z něj vytváří strukturované shrnutí.

Uživatel si bude moci zvolit **dva nezávislé inferenční režimy**:

- **A — AI v prohlížeči (Browser AI):** převod řeči na text se odehraje na počítači uživatele pomocí WebGPU nebo ověřeného CPU/WASM fallbacku. Soubor ani přepis se do serveru **neodesílá**, pokud uživatel explicitně nezvolí synchronizaci či uložení. Web je distribuován jako statická aplikace (ideálně PWA). Pro shrnutí lze později doplnit WebLLM, jen na podporovaných zařízeních.
- **B — vlastní AI Worker:** ASP.NET Core na ASPone zajišťuje přihlášení, uživatelské rozhraní, historii, soubory a frontu úloh. Samostatný Python Worker běžící na uživatelově Windows notebooku s NVIDIA RTX 4050 (6 GB VRAM, 32 GB RAM) periodicky stahuje úlohy pomocí **odchozích HTTPS** požadavků a zpracuje je lokálně přes Faster-Whisper. Pro shrnutí může použít existující lokální Unsloth/llama.cpp či Ollama API. Po zpracování pošle výsledek na ASPone.

**Varianta C (samostatný AI server/VPS)** se nyní NEIMPLEMENTUJE; architektura pouze dovolí v budoucnu Worker přesunout bez změny uživatelského rozhraní a datového kontraktu.

**Důležité upřesnění:** Režim A odlehčí CPU/RAM ASPone, ale **sám o sobě není zálohou při úplném výpadku webhostingu**, protože web se stále musí načíst. Pro skutečnou zálohu naplánovat volitelný statický mirror/PWA cache. Offline režim funguje pouze tehdy, když se předem úspěšně uloží potřebné součásti a model do prohlížeče; prohlížeč může cache později smazat.

## 2. Zjištěné prostředí a tvrdé limity

### 2.1 ASPone — sdílený webhosting, nikoli vlastní dedikovaný server

- Poskytovatel: ASPone, tarif Developer (dle poskytnutých snímků).
- Windows Server 2022, IIS 10, ASP.NET Core, MSSQL 2019.
- Aplikační pool konkrétního webu má **limit 300 MB RAM** (v okamžiku snímku 71 MB využito); nejde o celkovou RAM serveru.
- Tarif inzeruje webový prostor přibližně 10 GB a databázový prostor 3× 1 GB, skutečné využití a kvóty je nutné zkontrolovat.
- Na snímku už jsou tři MSSQL databáze: 150 MB, 1024 MB, 1024 MB; **nepředpokládat automaticky volný databázový slot**.
- Na ASPone NESPOUŠTĚT Whisper, lokální LLM, FFmpeg transkódování velkých videí, background workery ani trvale běžící AI procesy.
- Verze dostupného .NET runtime, práva k IIS requestLimits, možnost HTTPS certifikátu, práva zápisu, limit počtu requestů a dostupnost plánovače úloh je třeba před nasazením ověřit u poskytovatele či experimentálně.
- Pokud ASP.NET Core na hostingu nejde stabilně spustit nebo překročí paměťový limit, zachovat variantu A jako samostatně publikovatelný statický frontend; B může zůstat dočasně pouze lokální.

### 2.2 Výpočetní notebook

- Windows 11, AMD Ryzen 7 7445HS, 32 GB RAM, NVIDIA GeForce RTX 4050 Laptop GPU, 6 GB VRAM.
- Uživatel používá Python, VS Code, Unsloth, llama.cpp / lokální modely; později možné napojení Ollama.
- GPU rozpočet 6 GB nepředpokládá současné načtení velkého Whisper a LLM; inference a shrnování zpočátku **sekvenčně**, s řízenou správou paměti.
- Python Worker nesmí vyžadovat placené API klíče. Pokud rozhraní lokálního llama.cpp požaduje lokální bearer token, slouží pouze k autentizaci (nejde o účtované AI tokeny).

## 3. Produktové požadavky a priority

### P0 — nezbytná první použitelná verze

1. Nahrát lokální soubor: WAV, MP3, M4A; MP4/MKV po ověření dekódování.
2. Rozpoznat češtinu (pevná volba `cs`) a nabídnout automatické rozpoznání jazyka.
3. Zobrazit přepis po segmentech s časovými značkami a průběhem zpracování.
4. Přehrát lokální audio/video; kliknutím na segment skočit na příslušný čas (pokud formát prohlížeč přehraje).
5. Editovat text segmentů, vyhledávat v nich, uchovávat původní i opravenou verzi.
6. Exportovat UTF-8 TXT, SRT, WebVTT a strukturované JSON; formáty a výstup sjednotit v A i B.
7. Režim B: jeden přihlášený uživatel, fronta MSSQL, spolehlivý Worker a historie.
8. Režim A: fungující browser-only přepis alespoň krátkého českého zvukového záznamu na podporovaném zařízení, bez uploadu.
9. Jasně zobrazit, kde se soubor zpracovává a jestli se někam odesílá.
10. Žádné placené služby pro AI inferenci.

### P1 — po ověření P0

1. Shrnutí a časově označené klíčové body přes lokální LLM Workeru.
2. Přepínání A/B, detekce dostupného Workeru a kompatibility WebGPU.
3. Lokální autosave režimu A (IndexedDB jen se souhlasem); smazání lokálních dat.
4. Opakovaný pokus při chybě, obnovení přerušeného uploadu, obnovení expirované úlohy.
5. Dávkový přepis několika souborů (omezení souběhu na Workeru = 1).
6. Volitelné lokální shrnutí v prohlížeči přes WebLLM, pokud je zařízení kompatibilní a model je dostupný.

### P2 — mimo první verzi

- Rozlišení mluvčích (diarizace), diktování v reálném čase, zpracování URL/YouTube, překlad do jiného jazyka, rozšířené role, anotace, export DOCX/PDF, více paralelních Workerů, integrace varianty C.
- Rozpoznání mluvčích neimplementovat, dokud není ověřena licence a zvolen konkrétní model.
- URL import zatím neimplementovat (autorská práva, pravidla platforem a ochrana proti SSRF).

## 4. Doporučený stack

| Vrstva | Doporučení | Poznámky |
|---|---|---|
| Web UI | TypeScript + Vite + HTML/CSS, klidně bez těžkého UI frameworku | Responzivní; bez nutnosti React, pokud to nezjednoduší práci |
| Browser ASR (A) | `@huggingface/transformers`, Whisper ONNX + WebGPU | Použít vícejazyčný `onnx-community/whisper-tiny`, **ne** `whisper-tiny.en`; ověřit kvalitativně i `base` |
| Browser fallback (A) | WASM/CPU jen po měření | Nevyvozovat výkon z podpory samotné; při selhání zobrazit jasnou chybu/přepnutí B |
| Browser shrnutí | `@mlc-ai/web-llm` | P1 experiment, ne povinný předpoklad |
| Hosting/API | ASP.NET Core Minimal APIs nebo Controllers | Doporučený cíl .NET 10 LTS, **jen pokud ASPone runtime povoluje** |
| SQL | MSSQL 2019 + EF Core SQL Server | Migrace; veškeré dotazy parametrizované |
| Worker (B) | Python 3.11+; `faster-whisper`, `httpx`, `pydantic`, `PyAV` | Virtualenv, explicitní zamčení závislostí |
| Video/audio dekódování | PyAV; volitelný FFmpeg | PyAV obvykle FFmpeg knihovny obsahuje; FFmpeg CLI jen tam, kde je to potřebné |
| Lokální shrnutí (B) | Ollama / OpenAI-kompatibilní lokální llama.cpp server | Oddělený adaptér podle backendu |
| Testy | `pytest`, Vitest/Playwright, xUnit | Unit, integrace a test reálné instalace na ASPone |
| Vydání | statický frontend + publikovaný ASP.NET Core web na IIS; Worker na Windows | Worker pouze s odchozími požadavky |

**.NET poznámka:** .NET 8 LTS končí podporu v listopadu 2026; pro nový projekt preferuj .NET 10 LTS (podpora do 2028). Není-li .NET 10 dostupné na ASPone, nejdřív ověř jiný podporovaný způsob publikace a vyžádej si potvrzení poskytovatele. Nepřecházej automaticky na nepodporovaný runtime.

**GPU poznámka:** Faster-Whisper na NVIDIA používá CTranslate2; současné vydání vyžaduje pro GPU kompatibilní CUDA 12/cuBLAS a cuDNN 9. Ověřit instalaci a kompatibilitu na Windows; musí existovat CPU `int8` fallback. Pro notebook zkusit `small` a `medium` a změřit kvalitu, VRAM, RTF a dobu; 6 GB VRAM není garance libovolného modelu ani paralelismu.

## 5. Architektura a hranice odpovědností

```text
          [ Prohlížeč: společné UI ]
             |               |
          režim A          režim B
             |               |
      [Web Worker TS]    HTTPS /api
             |               |
      [WebGPU + ONNX]   [ASP.NET Core / ASPone] -- [MSSQL]
             |               |         |
      [Transcript JSON]   [Dočasné soubory]
             |               ^
       [TXT/SRT/VTT]         |  HTTPS polling/pull/upload
                             |
                      [Python Worker / Windows]
                         |           |
                   [Faster-Whisper] [Lokální LLM]
                             |
                      [Transcript JSON + Summary]
```

**Frontend:** jedna sada komponent, pouze různé adaptéry `BrowserTranscriptionProvider` a `RemoteJobTranscriptionProvider` implementující sdílené rozhraní. Výsledná data mají stejnou strukturu.

**Server ASPone:** pouze CRUD, autentizace, validace souborů, skladování, fronta, stav úlohy, výdej souboru Workeru, příjem výsledků a export. Žádné CPU-intenzivní audio operace.

**Worker:** lokální Python CLI/služba, která si sama vyzvedává úlohy. Žádné port-forwarding ani veřejné naslouchání na notebooku. Poll např. jednou za 5–15 s (konfigurovat), chybové backoff + jitter. Počet paralelních úloh = 1. Ve výchozím stavu lze Worker ukončit bez poškození fronty.

**Soukromí A:** prohlížeč načítá běhové knihovny/model (z vlastního statického hostingu nebo z důvěryhodného zdroje); samotný zvolený audio/video soubor nepřenášet mimo zařízení. Telemetrie třetích stran vypnuta.

## 6. Klíčové datové kontrakty

Definuj JSON Schema / OpenAPI a sdílené typy; nepoužívej volně odlišná datová pole v A a B.

### 6.1 Výsledek přepisu (návrh, lze rozšířit)

```json
{
  "schemaVersion": "1.0",
  "id": "uuid",
  "sourceFileName": "prednaska.mp4",
  "durationSeconds": 123.4,
  "language": "cs",
  "engine": "faster-whisper",
  "model": "small",
  "mode": "B",
  "segments": [
    {"id":"uuid-segment-1", "start":0.4, "end":3.1,
     "originalText":"Dobrý den všem.", "editedText":null}
  ],
  "summary": null,
  "createdAtUtc": "2026-10-24T09:00:00Z"
}
```

Pravidla: `start` a `end` jsou sekundy, `0 <= start <= end`, segmenty vzestupně, jednotlivé ID stabilní i při editaci. `editedText = null` znamená bez úpravy; prázdný řetězec znamená vědomé smazání textu. Text vždy UTF-8. Časové značky jsou přibližné a export musí fungovat i bez word-level timestamps. V databázi ukládat raw i edited text.

### 6.2 Stavy úloh B

`Created` → `Uploading` → `Queued` → `Claimed` → `Downloading` → `Transcribing` → [`Summarizing`] → `Completed`

Vedlejší koncové stavy: `Failed`, `Canceled`, `Expired` (případně návrat do `Queued` dle počtu pokusů).

Každá změna je validovaná stavovým automatem, s `UpdatedAtUtc`, `AttemptCount`, `LeaseUntilUtc`, `WorkerId`, `ErrorCode`, `ErrorMessageSanitized`. Worker po obnovení notebooku může zpracování bezpečně obnovit/retry; starý Worker nesmí přepsat výsledek nového pokusu. Vázat zápisy na ID pokusu/lease token (fencing token).

## 7. Databáze MSSQL — návrh pro P0/P1

Použít EF Core migrace, omezené indexy, žádné video/audio binárně v MSSQL.

- **AppUsers:** základ ASP.NET Core Identity (uzavřená registrace, první účet administrátora vytvořit bezpečně přes konfigurační bootstrap či CLI).
- **TranscriptionJobs:** Id GUID PK; OwnerUserId; OriginalFileName; NormalizedFileType; FileSizeBytes; DurationSeconds nullable; LanguageRequested; EngineRequested; Status; StorageKey; ContentSha256; CreatedAtUtc; UpdatedAtUtc; LeaseUntilUtc; WorkerId; AttemptCount; ProgressPercent; ErrorCode; DeletedAtUtc.
- **TranscriptSegments:** Id GUID PK; JobId FK; Sequence; StartSeconds; EndSeconds; OriginalText NVARCHAR(MAX); EditedText NVARCHAR(MAX) nullable.
- **Summaries:** Id GUID PK; JobId FK; Model; PromptVersion; SummaryJson NVARCHAR(MAX); CreatedAtUtc; UpdatedAtUtc.
- **Workers:** Id; DisplayName; LastSeenAtUtc; CapabilitiesJson; ActiveJobId nullable; Enabled; TokenFingerprint (nikoli token v plaintextu).
- **JobEvents:** audit vytvoření/převzetí/dokončení/selhání; minimum metadat, nepřidávat obsah nahrávek ani tajemství.

Indexy podle běžných dotazů: `(OwnerUserId, CreatedAtUtc DESC)`, `(Status, CreatedAtUtc)`, `(LeaseUntilUtc)`.

**Vlastnictví:** veškeré uživatelské endpointy filtrují `OwnerUserId`; přihlášený uživatel nesmí číst cizí úlohy ani jejich přílohy. Režim A nevyžaduje SQL připojení, dokud uživatel explicitně neuloží výsledek na server.

## 8. API kontrakt pro režim B

Definovat OpenAPI; JSON chyby s `code`, `message`, `requestId`; verze API `/api/v1`.

### Uživatelské endpointy (cookie login + anti-CSRF, pouze HTTPS)

| Metoda | Cesta | Funkce |
|---|---|---|
| GET | `/api/v1/capabilities` | Zjištění stavu Workeru, podporovaných funkcí, limitů a případně browser fallbacku |
| POST | `/api/v1/jobs` | Vytvoření prázdné úlohy, nastavení jazyka a shrnutí |
| POST | `/api/v1/jobs/{id}/uploads/init` | Zahájit limitovaný upload, vygenerovat upload session |
| PUT | `/api/v1/jobs/{id}/uploads/{sessionId}/chunks/{index}` | Bezpečný upload malého bloku dat |
| POST | `/api/v1/jobs/{id}/uploads/{sessionId}/complete` | Validace délky, SHA-256, typu a přesun do `Queued` |
| GET | `/api/v1/jobs` | Stránkovaný seznam vlastních úloh |
| GET | `/api/v1/jobs/{id}` | Stav, průběh, metadata; polling 3–5 s při aktivní úloze |
| GET | `/api/v1/jobs/{id}/transcript` | Segmenty a revize přepisu |
| PATCH | `/api/v1/jobs/{id}/segments/{segmentId}` | Opravit segment s kontrolou souběžné editace |
| GET | `/api/v1/jobs/{id}/export?format=txt` | TXT/SRT/VTT/JSON; server generuje stream |
| POST | `/api/v1/jobs/{id}/cancel` | Požadavek na zrušení |
| DELETE | `/api/v1/jobs/{id}` | Smazání a bezpečný cleanup |

### Worker endpointy (oddělená autentizace `Authorization: Bearer ...`)

| Metoda | Cesta | Funkce |
|---|---|---|
| POST | `/api/v1/worker/heartbeat` | Identifikace, schopnosti, verze, stav |
| POST | `/api/v1/worker/claim` | **Atomicky** převzít další čekající úlohu nebo vrátit HTTP 204 |
| GET | `/api/v1/worker/jobs/{id}/source` | Stream zdroje jen pro vlastní platný lease |
| POST | `/api/v1/worker/jobs/{id}/progress` | Průběh + heartbeat/obnova lease |
| POST | `/api/v1/worker/jobs/{id}/complete` | Výsledek + kontrola schema, stavu a lease tokenu |
| POST | `/api/v1/worker/jobs/{id}/fail` | Sanitizované selhání, volitelný retry |

**Spolehlivost:** Atomické `claim` musí být řešeno jednou transakcí v MSSQL (např. `UPDATE ... OUTPUT` se zamykacími hinty `UPDLOCK`, `READPAST` podle konkrétního isolation level; otestovat souběh). `Claim` a `complete` musí být idempotentní. Žádná fronta pouze v paměti IIS poolu. Pokud Worker ztratí spojení, po lease timeout může následovat nový pokus. Omezit maximální počet pokusů a nekonečný requeue. Worker nikdy nedostává SQL connection string; používá výhradně HTTPS API.

## 9. Manipulace se soubory na sdíleném hostingu

1. **Neukládat média do databáze.** Binárky v dočasném privátním adresáři mimo `wwwroot`, se zakázaným přímým HTTP přístupem.
2. Nahrávání streamovat na disk po blocích; neskládat celé video do RAM ASP.NET Core.
3. Výchozí blok uploadu např. 4 MiB; konfigurovatelný po testu na ASPone. IIS často omezuje jeden request přibližně na 30 MB; nezaměňovat s maximální velikostí celé nahrávky.
4. První testovací limit celé úlohy **25 MB**, následně zvýšit (např. 100 MB) **jen po úspěšném testu diskové kvóty, IIS, času a průchodnosti**. Nezaručovat velké MP4 do ověření.
5. Resumable upload: unikátní ID, index bloku, kontrola offsetu, SHA-256, limit aktivních uploadů a expirační cleanup.
6. Nepoužívat dodané jméno souboru jako diskovou cestu; generovat náhodný interní název. Kontrolovat formát podle obsahu, nejen přípony/MIME.
7. Zakázat spouštění nahraných souborů, zip-bombs a přístup k cestám mimo úložiště. Formáty povolit whitelistováním.
8. Po zpracování surový upload standardně smazat (např. po 24 hodinách od `Completed`, nastavitelně), pokud uživatel výslovně nepožádá o archivaci; neukládat nepotřebné soukromé nahrávky.
9. V režimu B u dlouhých MP4 doporučit jako P1 **extrakci/kompresi audia na straně klienta**, aby se neposílaly desítky či stovky MB obrazu. Lze zkoumat FFmpeg.wasm; je náročný na RAM a není automaticky vhodný pro všechna zařízení. Nejprve otestovat.
10. Přenos a přístup k médiím pouze přes autorizované endpointy; žádné přímé veřejné URL souborů.

## 10. Režim A — browser-only inference

### 10.1 PoC technologie

- Vyzkoušet `@huggingface/transformers` a ONNX model `onnx-community/whisper-tiny` (multilingual) s `device: 'webgpu'`.
- Nepoužívat `whisper-tiny.en` pro češtinu; je pouze anglický.
- Funkci `navigator.gpu` chápat jen jako předběžný signál; skutečnou kompatibilitu potvrdit až při vytvoření modelu a inferenci.
- Audio převést na podporovanou vzorkovací frekvenci (Whisper 16 kHz mono), neztratit časový posun u jednotlivých bloků. Neimplementovat vlastní ASR algoritmus.
- Inferenci přes Web Worker, neblokovat hlavní UI thread. Pro delší nahrávky rozdělit audio na bloky s kontrolovaným překryvem, správně odstraňovat duplicity a přepočítávat globální čas.
- Krátký český test přepisovat s explicitním nastavením češtiny nebo ověřeným parametrem modelu; ověřit API podle nainstalované verze knihovny.
- Změřit nejmenší funkční model, kvalitu, rychlost, GPU obsazení a paměť. Následně porovnat vícejazyčný `base` (pokud bude v dostupném ONNX/WebGPU balení).
- Při nepodporovaném WebGPU nejprve vyzkoušet CPU/WASM pouze na krátké nahrávce a ukázat odhad omezení, anebo zobrazit, že režim A na zařízení není dostupný.

### 10.2 Offline režim a distribuce

- V první verzi stačí web dostupný přes HTTPS, model se může jednorázově stáhnout z důvěryhodného repozitáře. Zdokumentovat, že to **není plně offline od prvního spuštění**.
- PWA/Service Worker až po ověření PoC; při volbě offline balíčku transparentně ukázat velikost modelu a stav stahování/cache.
- Pracovat s omezenou životností browser cache a možným vymazáním dat.
- Browser-only režim nesmí bez souhlasu nahrávat audio/video, přepis ani shrnutí na API ASPone.
- Pro skutečný nouzový přístup při nedostupném ASPone lze *později* publikovat stejný čistě statický build i na jiném statickém hostingu / PWA cache; bez toho A pouze šetří prostředky ASPone.

### 10.3 Shrnutí v režimu A

- WebLLM je P1 experiment. Kompatibilní model musí být schopen pracovat s českým textem, na dostupné GPU paměti.
- Při nedostatku WebGPU/RAM funkci **korektně vypnout** a nabídnout pouze přepis, případně shrnutí v režimu B.
- Nezaměňovat automatický výběr prvních vět za LLM shrnutí; pokud bude použit extraktivní přehled, označit jej správně.

## 11. Režim B — Python AI Worker

### 11.1 Lokální PoC dříve než server

1. Vytvořit izolované Python prostředí (`venv`), zamknout verze balíků (`requirements.txt` nebo `uv.lock`).
2. Nejdřív ověřit přepis WAV/MP3 souboru pomocí Faster-Whisper na CPU `int8`; výsledkem JSON ve společném schématu a TXT/SRT.
3. Teprve potom ověřit GPU (`cuda`, případně `float16` či `int8_float16`) včetně CUDA/cuDNN na Windows. Jakmile GPU selže, přepnout na CPU; nezamlčovat pád ani netvrdit, že běží GPU.
4. Modely `small`, `medium`, případně `large-v3-turbo` zkoušet po jednom s měřením VRAM. Při 6 GB VRAM není jisté, že libovolná kombinace backendu, kontextu a modelu bude vhodná.
5. Pro video ověřit dekódování PyAV; FFmpeg CLI instalovat jen pro operace, které samotný PyAV nezajistí.
6. `vad_filter` nastavitelné a testovat na tichých pasážích, minimalizovat halucinace. Zaznamenat skutečný jazyk, délku a počet segmentů.
7. Nejdříve provozovat Worker jako CLI (`python -m worker --once ...`), pak jako proces se smyčkou a teprve potom volitelně Windows Service přes wrapper nebo Task Scheduler; nevyžadovat administrátorská oprávnění pro základní vývoj.

### 11.2 Provozní pravidla Workeru

- Žádné naslouchání na veřejném portu, žádný SSH/RDP/port-forwarding pro uživatele.
- HTTPS TLS validace zapnutá; bearer klíč Workeru mimo repo, lokálně v bezpečném konfiguračním úložišti či environmentu.
- Exponenciální backoff při 429/5xx, rozlišení retryable vs permanent errors; korektní ukončení během úlohy.
- Průběh: download → decode → transcribe → summary (jen pokud je požadováno) → upload result; stavy hlásit serveru.
- Maximální souběh 1, stanovit diskovou cache, limity pracovních adresářů a mazání po dokončení.
- Při uspání notebooku a ztrátě spojení zůstane úloha v SQL se zajištěnou obnovou (lease expiration).
- Lokální přepisy nesmějí být omylem předávány do externích AI API.

## 12. Shrnování pomocí lokálního LLM

### 12.1 Dva adaptéry

- `OllamaSummaryProvider`: volat lokální Ollama API (`/api/chat`) bez externího cloudu.
- `OpenAICompatibleLocalSummaryProvider`: volat lokální server llama.cpp/Unsloth (`/v1/chat/completions`) s konfigurovaným lokálním klíčem, pokud ho vyžaduje.
- Model vybírat konfiguračně; Qwen2.5-Coder-7B může posloužit k integračnímu testu, ale na shrnování porovnat menší obecný instruction model s kvalitní češtinou.
- V GPU režimu zpočátku procesy sekvenčně, aby se oba modely nesnažily držet VRAM současně.

### 12.2 Bezpečné a věrné shrnutí

- Pro dlouhý přepis zpracovávat časově souvislé bloky s překryvem, nejprve souhrny částí (map), pak syntézu (reduce).
- Výstupní typy: `Stručné shrnutí`, `Podrobný přehled`, `Hlavní body`, `Úkoly/rozhodnutí` (poslední pouze pokud jsou ve vstupu skutečně uvedeny).
- Každý podstatný bod může uvádět časový odkaz `[mm:ss]`; používat pouze časové značky ze zdrojových segmentů, nikoli je generovat odhadem.
- Prompt: text přepisu je **nedůvěryhodný vstup**, ne instrukce. Zakázat modelu plnit povely vložené do nahrávky; nesmí domýšlet fakta, rozhodnutí ani úkoly.
- Zkoušet strukturovaný JSON výstup s validací schématu a omezeným opakováním při chybě. Originální přepis nikdy nepřepisovat shrnutím.
- Teplota nízká, označit text jako AI-generovaný, uživatel má možnost upravit shrnutí.

## 13. UI / UX návrh

**Jazyk:** čeština; funkční a nenápadný design, přístupné ovládání (klávesnice, kontrast, popisky). Desktop-first, na mobilu bez přetékání.

### Hlavní obrazovka

1. Horní lišta: `Nový přepis | Historie | Nastavení` a stav dostupnosti režimů.
2. Oblast drag-and-drop a tlačítko `Vybrat audio/video`.
3. Volba režimu: `Automaticky (doporučené) | V tomto prohlížeči (A) | Můj AI Worker (B)`; jednoznačně vysvětlit, zda soubor opustí zařízení.
4. Jazyk: `Čeština / Automaticky / další`; přepínač `Vytvořit shrnutí`, pokud backend dovoluje.
5. Po spuštění: postup/progress, čas trvání, název zvoleného enginu/modelu, chybové hlášky.
6. Výsledky: vlevo přehrávač a časová osa, vpravo seznam segmentů; na úzkém displeji svisle.
7. Akce: `Kopírovat`, `Opravit`, `Vyhledat`, `TXT`, `SRT`, `VTT`, `JSON`, `Smazat data`.

**Chování automatického výběru:** pokud je online a má kapacitu vlastní Worker, preferovat B u delších videí. A nabídnout jako soukromější a serverově nezávislejší výpočet; na GPU kompatibilním zařízení lze A vybrat ručně. Pokud Worker není dostupný a WebGPU je kompatibilní, doporučit A. Pokud není dostupné nic, uživateli jasně říci proč — nepředstírat zpracování na ASPone.

**Respektovat soukromí:** při výběru A zobrazit `Soubor zůstane ve vašem zařízení`; při výběru B `Soubor se dočasně nahraje do vašeho webového úložiště a stáhne jej váš AI Worker`.

## 14. Bezpečnost a GDPR

- Veřejná registrace zakázaná, role admin/user pro budoucí rozšíření, robustní login, bezpečné cookies `Secure`, `HttpOnly`, `SameSite`, anti-CSRF a rate limits.
- Worker používá samostatný náhodný API klíč s omezeným rozsahem; klíče lze rotovat a zneplatnit. Nikdy neposílat Worker token do JS frontendu.
- HTTPS nutné před veřejným provozem, pro WebGPU/PWA navíc bezpečný kontext.
- Všechna URL a ID autorizovat, SQL parametry nepřijímat do dynamicky skládaného SQL, nepoužívat data z transkriptu jako HTML (`innerHTML` bez escapování).
- CORS pokud možno nepotřebovat (web a API stejného originu). Nepovolit wildcard CORS ani přístup z libovolné domény.
- Velikost dat, kvóty na uživatele, mazání expirovaných uploadů, nemožnost path traversal.
- Neposílat texty, audio, hesla, klíče, connection stringy a soukromé údaje do analytiky či logů.
- Audit stahování a změn; dokumentovat jak dlouho se nahrávky a přepisy uchovávají, a jednoduché trvalé smazání.
- Pokud aplikace bude dostupná dalším osobám, zhodnotit GDPR role a účel zpracování osobních údajů; u záznamů schůzek řešit oprávnění účastníků.
- Stahování modelu z internetu je jiné než odesílání nahrávek do cloudu; transparentně informovat.
- Dodržovat licence balíků i modelů, zejména při případné veřejné distribuci.

## 15. Observabilita, limit prostředků a provoz

- Strukturované logy: RequestId, JobId, status, worker id, délka souboru, model, elapsed time, peak RAM/VRAM u Workeru, retry count, bez obsahu nahrávek.
- ASPone: žádné časově náročné synchronní requesty, minimum paměti, stránkování; po publikaci změřit využití app poolu a ponechat rezervu pod limitem 300 MB.
- Na backendu nejprve použít krátký polling. WebSocket/SignalR nepřidávat, dokud není ověřeno, že ho sdílený hosting spolehlivě podporuje a že přináší přínos.
- Úklid souborů nesmí záviset na nepřetržitě běžícím `BackgroundService` v IIS. Preferovat ASPone plánovač úloh, opportunistic cleanup při obsluze požadavků s limitem práce nebo administrátorský ruční endpoint. Ověřit oprávnění.
- Při ztrátě serveru režim B dočasně nefunguje; samostatná statická A verze může fungovat dál, pokud je předem nasazena/cache.
- Žádné automatické nekonečné upload retry ani nekontrolované stahování modelů.

## 16. Návrh struktury repozitáře

```text
transcriber/
├── README.md
├── AGENTS.md
├── .gitignore
├── .env.example                 # pouze fiktivní hodnoty
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md
│   ├── DEPLOY_ASPONE.md
│   ├── SECURITY.md
│   ├── TEST_PLAN.md
│   └── BENCHMARKS.md
├── apps/
│   ├── web/                     # TypeScript/Vite, A i B UI
│   │   └── src/{components,providers,models,workers,export,storage}/
│   ├── api/                     # ASP.NET Core + EF Core MSSQL
│   │   └── src/{Endpoints,Auth,Data,Services,Contracts}/
│   └── worker/                  # Python CLI/worker
│       └── src/{asr,summary,api_client,jobs,export}/
├── contracts/
│   ├── openapi.yaml
│   └── transcript.schema.json
├── tests/
│   ├── fixtures/                # krátké legálně použitelné WAV soubory
│   ├── web/
│   ├── api/
│   ├── worker/
│   └── e2e/
└── deployment/
    ├── aspone/
    └── windows-worker/
```

Nemusí vzniknout všechny složky hned; pořadí podle etap. Modelové váhy, osobní nahrávky, hesla a výsledky nezařazovat do Git repozitáře.

## 17. Konkrétní realizační etapy a „Definition of Done“

### Etapa 0 — audit a rozhodnutí (bez produkčního kódu)

**Úkoly:** zmapovat IIS runtime a limity ASPone, kapacitu využitelných DB, ověřit HTTPS, způsob FTP publikace; zaznamenat verze Python/CUDA/NVIDIA; identifikovat vzorová legálně použitelná česká audio data; popsat rizika.

**Výstupy:** `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, tabulka ověřených/neověřených omezení a návrh Milestone 1.

**Akceptace:** žádná domněnka o ASPone/GPU není vydávána za potvrzený fakt; jsou explicitně uvedeny blokery.

### Etapa 1 — Python CLI přepis pro režim B (offline)

**Úkoly:** instalace, CPU přepis `small`, JSON schema, TXT/SRT/VTT, měření; potom GPU pokus; parser audio a video; unit test exportů.

**Akceptace:** `python -m worker transcribe cesta_k_souboru --language cs --model small --output-dir ...` vytvoří funkční soubory; pro český test ověřena alespoň základní srozumitelnost ruční kontrolou. Evidován skutečný GPU/CPU backend.

### Etapa 2 — Browser A PoC (odděleně od serveru)

**Úkoly:** Vite demo, krátký český WAV, ONNX multilingual Whisper, Web Worker, detekce podporovaného WebGPU, segmenty + TXT, měření spotřeby paměti, ověření Chrome/Edge.

**Akceptace:** po stažení modelu lze lokálně přepsat alespoň jednu krátkou českou nahrávku bez uploadu (ověřit DevTools Network, žádný POST s daty souboru). Jestli PoC selže, jasně dokumentovat příčinu a neintegrovat nefunkční mock.

### Etapa 3 — sjednocené UI a datové kontrakty

**Úkoly:** společné `Transcript` schema, validační funkce, exporty, přehrávač, editace a vyhledávání; přepínač režimů s dočasným mockem pouze pro UI testy (označené).

**Akceptace:** stejné JSON vstupy z A i B renderují identický výsledek a exportují validní TXT/SRT/VTT; testy diakritiky, prázdných a překrývajících se segmentů.

### Etapa 4 — ASP.NET Core + MSSQL na lokálním vývojovém prostředí

**Úkoly:** autentizace, úlohy, databázové migrace, upload stream/chunk, API, oddělená Worker autentizace, end-to-end mock Worker. Použít lokální SQL nebo izolovanou vývojovou DB; nikdy nesmazat existující databáze na ASPone.

**Akceptace:** úlohu lze vytvořit, bezpečně nahrát, atomicky claimnout, označit dokončenou a exportovat; uživatel nemůže číst cizí úlohy. Žádný audio model na ASPone.

### Etapa 5 — propojit reálný Worker B a server

**Úkoly:** polling, leasing, download, inference, result upload, heartbeat, retry, cancel, reconnect, stav online/offline, konfigurace Workeru a lokálního API pro shrnutí.

**Akceptace:** přes browser nahrát soubor → ASP.NET Core SQL fronta → notebook Worker → přepis → výsledek na webu. Odpojení Workeru nepřijde o data; nové spuštění obnoví zpracování správně. Test dvou Workerů nesmí claimnout tutéž úlohu současně.

### Etapa 6 — shrnutí B a volitelné shrnutí A

**Úkoly:** Ollama/llama.cpp adaptéry, map-reduce pro dlouhé přepisy, český prompt, časové reference, JSON validace, test kvality. Pokud čas a hardware dovolí, WebLLM experiment; nesmí blokovat vydání.

**Akceptace:** 30–60min český přepis se shrne bez ztráty původního textu, body lze dohledat pomocí časových značek. Pokud není LLM, přepis pokračuje bez shrnutí s jasným stavem.

### Etapa 7 — nasazení na ASPone a robustnost

**Úkoly:** ověřit podporovaný .NET runtime, produkční HTTPS, FTP deployment, `web.config`, DB connection string mimo repo, hosting test RAM/IIS uploadů, cleanup, auth, záloha, logy; browser statický build; bezpečnostní a e2e testy.

**Akceptace:** v provozu ověřené malé a střední soubory, dostupnost /api, dostupnost A bez Workeru, dostupnost B s Workerem, exporty, zachování dat při recyklaci IIS poolu. Zmínit známé limity ve `README.md`.

### Etapa 8 — PWA + nezávislý statický mirror (volitelné)

**Úkoly:** robustní Service Worker cache, model assets, offline indikace, úplné lokální vymazání, případný mirror oddělený od ASPone. Prověřit kvóty browser storage.

**Akceptace:** na předem připraveném zařízení lze načíst statickou A aplikaci i při nedostupném backendu a pracovat s lokálním souborem. Zajistit transparentní hlášení, když model nebyl cacheován.

## 18. Testovací matice

| Test | A | B | Úspěšné chování |
|---|---|---|---|
| Čeština, čistá řeč, 1–3 min | ANO | ANO | Srozumitelný segmentovaný text, export |
| Čeština, více mluvčích, 10–15 min | Dle HW | ANO | Nepadat, zachovat časové značky; diarizace se nečeká |
| Čeština, šum/ticho/hudba | ANO | ANO | Přiměřené výsledky, bez nekonečné halucinace |
| Angličtina či polština, 3 min | ANO | ANO | Model skutečně vícejazyčný |
| MP4 s audiem | Po ověření dekódování | ANO | Rozpoznání zvukové stopy |
| 30–60 min nahrávka | Limitovaný experiment | ANO | Stabilní paměť, chunking, export |
| 404/500/429 z API | N/A | ANO | Chyba a řízený retry bez ztráty jobu |
| Notebook usne uprostřed úlohy | N/A | ANO | Lease retry, žádná korupce |
| IIS application pool restart | Web cache dle stavu | ANO | Jobs v MSSQL zůstávají |
| WebGPU nedostupné | ANO | N/A | Čitelná chyba/WASM nebo B; žádný falešný úspěch |
| 2 Workeři claimují stejnou úlohu | N/A | ANO | Předána jen jednomu Workeru |
| Nahrání nepovoleného souboru | ANO | ANO | Odmítnutí bez vykonání obsahu |
| Pokus číst cizí úlohu | N/A | ANO | HTTP 403/404 |
| Export české diakritiky | ANO | ANO | UTF-8, validní SRT/VTT |
| Odpojení od internetu při A | Po model cache | N/A | Soubor stále zůstává lokální |

Měřit minimálně: čas inicializace modelu, čas přepisu a **RTF = doba přepisu / délka audia**, maximum VRAM/RAM, počet chyb, objem uploadu, náklady provozu serveru (bez AI tokenů). Kvalitu češtiny lze měřit pomocí WER/CER na krátkém ručně zkontrolovaném referenčním textu; nevymýšlet předem cílovou přesnost bez dat.

## 19. Základní pravidla kódu a práce vývojového agenta

1. Používej TypeScript `strict`, C# nullable reference types, v Pythonu type hints + `ruff`, vhodné testy, konzistentní formátování.
2. Kód komentuj tam, kde vysvětluje rozhodnutí nebo algoritmus; nekomentuj zjevné kroky. Veřejné Python rozhraní docstring, C# veřejná API XML komentáře tam, kde dávají smysl; HTML/CSS strukturovaně a stručně.
3. Nikdy neumisťuj pravé přihlašovací údaje, klíče, `.env`, modelové váhy a soukromá média do repozitáře.
4. Dbej na malé a přehledné moduly, žádná jedna obrovská komponenta. Doménová logika exportů sdílená a testovaná, nezdvojovat v každém UI panelu.
5. Každý významný technický kompromis zapiš do `docs/DECISIONS.md`: volba, alternativa, odůvodnění, důsledky.
6. Po každé etapě proveď testy a zdokumentuj jejich výsledek; nepoužívej tvrzení „hotovo“, pokud se nepodařilo ověřit skutečné spuštění.
7. Nepřejdi k další etapě, pokud předchozí nemá funkční minimum; pokud blokuje hosting či HW, zapiš problém a dokonči nezávislou větev.
8. Instalace a spuštění musí být reprodukovatelné na Windows 11; příkazy PowerShell uvádět v `README.md`.
9. Výchozí vzhled jednoduchý a moderní, české texty, žádné cizojazyčné placeholdery v produkčním UI.
10. Nedělej destruktivní změny v existujících ASPone databázích; použij samostatné tabulky/migrace až po explicitním určení cílové DB a záloze.

## 20. První instrukce pro Antigravity (zpracuj jako **první samostatný úkol**)

> Prostuduj celý tento dokument a navrhni realizaci pouze **Etapy 0 a Etapy 1**. Nejprve vytvoř kostru repozitáře, technický audit prostředí a reprodukovatelný Python CLI prototyp Faster-Whisper s `small` multilingual modelem. Začni CPU `int8` a až po jeho funkčním ověření doplň GPU test s RTX 4050. Přímo navrhni konkrétní PowerShell příkazy, konfiguraci, strukturu souborů, testy a měření. Vytvoř dokumentaci a spustitelné příklady, pracuj s fiktivními daty, nevyžaduj přístupové údaje k ASPone. Nesnaž se v první iteraci implementovat backend, browser AI, API ani shrnutí. Po ukončení vypiš vytvořené soubory, skutečně spuštěné testy, jejich výsledky, nevyřešené problémy a další krok. Při případných rozhodnutích dbej na budoucí podporu režimů A a B a jednotný JSON formát výsledku.

## 21. Otevřené otázky k ověření během práce

- Jaký konkrétní `.NET` runtime umí ASPone aktuálně spustit a je na něm aktivní potřebný Hosting Bundle?
- Lze HTTPS certifikát na doméně/volené subdoméně použít bez dodatečného poplatku?
- Která z existujících MSSQL databází je vyhrazená pro tuto aplikaci a kolik skutečně zbývá prostoru? Je možné vytvořit novou?
- Lze používat IIS requestLimits a zápis do privátního adresáře mimo webroot? Jaké jsou limity souborových requestů a diskové kvóty?
- Jaká verze NVIDIA driveru a CUDA runtime je dostupná na notebooku a kolik paměti zabere zvolený model?
- Umožňuje cílový Chrome/Edge/WebGPU s konkrétní knihovnou a ONNX modelem český přepis, a s jakým skutečným výkonem?
- Jakou velikost souborů bude uživatel typicky potřebovat (např. desetiminutové MP3 vs hodinové MP4)?
- Jaký je požadovaný retenční režim a zda je nutná trvalá serverová historie u A (doporučené výchozí nastavení: ne)?

## 22. Ověřené technické zdroje

- ASPone Developer / parametry: https://www.aspone.cz/cz/Webhosting/Developer/
- ASPone přehled RAM/SQL tarifu: https://www.aspone.cz/cz/Webhosting/
- Faster-Whisper: https://github.com/SYSTRAN/faster-whisper
- Hugging Face Transformers.js / WebGPU: https://huggingface.co/docs/transformers.js/guides/webgpu
- Multilingual ONNX Whisper Tiny (bez `.en`): https://huggingface.co/onnx-community/whisper-tiny
- WebLLM: https://github.com/mlc-ai/web-llm
- ASP.NET Core file uploads a IIS request limits: https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads?view=aspnetcore-10.0
- Publikace ASP.NET Core na IIS: https://learn.microsoft.com/en-us/aspnet/core/tutorials/publish-to-iis
- Životní cyklus .NET: https://learn.microsoft.com/en-us/lifecycle/products/microsoft-net-and-net-core
- EF Core SQL Server: https://learn.microsoft.com/en-us/ef/core/providers/sql-server/

---

**Cíl první iterace:** kvalitní, ověřený přepis audio/video do TXT/SRT/JSON na notebooku s jednotným datovým kontraktem. Všechno další postupně přidávat jako oddělené režimy a služby. Prioritou je spolehlivost, bezpečnost, kvalita češtiny a nulová závislost na placených AI API.
