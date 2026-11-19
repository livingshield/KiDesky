# Instrukce projektu / Project Instructions

## Pravidla nasazování / Deployment Rules (ASPONE Hosting)

> [!CRITICAL]
> **PŘÍSNÝ ZÁKAZ NAHRÁVÁNÍ SOUBORŮ .EXE NA FTP ASPONE:**
> 1. Na FTP server ASPONE (windows11.aspone.cz ani jakýkoliv jiný server poskytovatele ASPONE) se **za žádných okolností nesmí nahrávat soubory s příponou .exe** (včetně přejmenovaných jako *.exe.bak apod.).
> 2. Poskytovatel hostingu ASPONE má přísná bezpečnostní pravidla zakazující přítomnost jakýchkoliv spustitelných .exe souborů.
> 3. **Pro .NET aplikace:** Na IIS hostingu ASPONE se aplikace spouští výhradně přes ASP.NET Core modul pomocí .dll knihoven. Výchozí konzolový launcher *.exe generovaný kompilátorem se na FTP **NIKDY** nenahrává.
> 4. **Pro externí nástroje (FFmpeg, yt-dlp apod.):** Na serveru se nespouští žádné .exe binárky. Vše musí běžet buď na straně klienta (např. WebAssembly v prohlížeči), nebo přes čisté .NET/C# knihovny (např. YoutubeExplode.dll).
> 5. **Deploy skripty:** Jakýkoliv nasazovací skript (PowerShell, bash, CI/CD) musí mít explicitní filtr vylučující jakékoliv *.exe soubory.

## Pravidla lokalizace a vícejazyčnosti (i18n / Multilingual Rules)

> [!IMPORTANT]
> **POVINNÉ ZOHLEDNĚNÍ VŠECH JAZYKŮ PŘI ÚPRAVĚ NEBO PŘIDÁVÁNÍ TEXTŮ:**
> 1. Veškeré uživatelsky viditelné texty (UI prvky, tlačítka, modální okna, hlášky herního enginu, logy, popisy karet, předmětů, nestvůr a dovedností) musí být lokalizovány pomocí centrálního i18n systému a jazykových zdrojů.
> 2. **Vždy při přidání nového textu nebo při úpravě existujícího textu v aplikaci musí být souběžně a povinně zohledněny a doplněny texty ve všech aktivně podporovaných jazycích** (aktuálně čeština `cs` a angličtina `en`).
> 3. Do zdrojového kódu (JS, HTML šablony) se nesmí vkládat nové nepřeložitelné textové řetězce "natvrdo". Každý text odkazuje na příslušný překladový klíč (`PRS_I18n.t(key, params)`).
> 4. **Architektura dynamických jazyků a výběr (dropdown select):** Jazyky v rozhraní nejsou binární přepínač, ale výběrový prvek (`<select class="prs-lang-select">`). Systém automaticky detekuje všechny dostupné jazyky ze zaregistrovaných slovníků v `window.PRS_I18N`. Každý soubor slovníku nese metadata `meta: { code, name, flag, short }`. Nový jazyk (např. `de`, `pl`, `sk`) se přidává pouhým přidáním nového souboru s překlady (např. `js/i18n/de.js`) bez nutnosti jakéhokoliv hardcodování v aplikačním kódu.
> 5. **Okamžité překreslení po změně jazyka:** Při změně jazyka se musí okamžitě a bez nutnosti přepínat záložky překreslit veškerý viditelný obsah včetně Pravidel & Katalogu (hrady, bestiář, trofeje, dekorace, tabulky výbavy, tahák, HUD a aktivní akční panel).
