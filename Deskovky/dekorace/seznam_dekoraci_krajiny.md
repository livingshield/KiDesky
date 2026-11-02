# Katalog a kontrolní seznam grafických prvků krajiny 🌲🏰

Tento dokument slouží jako ucelený **seznam a specifikace grafických prvků** pro oživení herních plánů deskové hry **KiDesky: Princeznino srdce**.

Celkem katalog obsahuje **34 unikátních typů dekorací** (včetně oboustranných zrcadlených variant `*_flip.png`, celkem přes 68 připravených transparentních herních assetů). Všechny jsou plně integrovány do herního enginu (`js/game-data.js`), kde se dynamicky kotví k herním políčkům nebo přirozeně rozmisťují v izometrické krajině.

---

## 🎨 Technické a vizuální parametry assetů

> [!IMPORTANT]
> **Vlastnosti herních dekorací:**
> 1. **Formát:** Čistý 32bitový PNG s alfa průhledností (`RGBA`, bez bílo-šedých šachovnic v pozadí).
> 2. **Perspektiva a styl:** Mírně vyvýšený izometrický 2D pohled (pohádkový ink-and-watercolor akvarelový styl ladící s hrady a draky).
> 3. **Spodní hrana:** Přirozené zakončení u země s jemným měkkým stínem.
> 4. **Obousměrnost:** Každý prvek má vygenerovanou i otočenou variantu `*_flip.png` pro přirozenou variabilitu pohledů zleva i zprava.
> 5. **Umístění na disku:** Zdrojové předlohy v `Deskovky/dekorace/*.jpg`, optimalizované webové assety v `assets/decorations/*.png`.

---

## 📋 Přehled dekorací podle kategorií (34 prvků)

### 1. Lesy a stromy (Vegetace)

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `tree_oak.png` | **Listnatý dub** | Louky, mírné pahorky, okolí cest | ✅ PNG aktivní (+flip) |
| `tree_pine.png` | **Horská borovice / smrk** | Podhůří, lovecké revíry, severní hory | ✅ PNG aktivní (+flip) |
| `tree_birch.png` | **Bělostná bříza** | Světlé háje, pastviny koní | ✅ PNG aktivní (+flip) |
| `grove_oak.png` | **Dubový hájek** | Volné plochy mezi trasami | ✅ PNG aktivní (+flip) |
| `grove_pine.png` | **Borový lesík** | Hvozdy v rozích a u Dračí sluje | ✅ PNG aktivní (+flip) |
| `grove_pine2.png` | **Hluboký borový hvozd** | Husté lesní celky na severu a východě | ✅ PNG aktivní (+flip) |
| `orchad_apple.png` | **Jabloňový sad** | Roviny a svahy u vesnic | ✅ PNG aktivní (+flip) |
| `orchad_plum.png` | **Švestkový sad** | Okraje vesnic a pahorkatiny | ✅ PNG aktivní (+flip) |
| `hruskovy_sad.png` | **Hruškový sad** | Slunné stráně | ✅ PNG aktivní (+flip) |
| `bush.png` | **Hustý keř** | Lemování cest a břehů | ✅ PNG aktivní (+flip) |

---

### 2. Terén a geologie

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `rock_boulder.png` | **Mechem porostlý balvan** | Skalnaté úseky, okraje cest, úkoly U2/U3 | ✅ PNG aktivní (+flip) |
| `mountain_peaks.png` | **Zasněžený horský hřeben** | Severní horizont a odlehlé rohy mapy | ✅ PNG aktivní (+flip) |

---

### 3. Zemědělství a venkov

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `farm_field.png` | **Lán pšeničného pole** | Roviny v okolí vesnic a měst | ✅ PNG aktivní (+flip) |
| `pasture_fence.png` | **Pastvina s dřevěným plůtkem** | Ukotveno k chovům koní a stájím | ✅ PNG aktivní (+flip) |
| `windmill.png` | **Středověký větrný mlýn** | Otevřené větrné pláně u vesnic | ✅ PNG aktivní (+flip) |
| `watermill.png` | **Vodní mlýn s náhonem** | Říční toky, rybníky a kovářské osady | ✅ PNG aktivní (+flip) |

---

### 4. Lidská sídla, kultura a rekvizity

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `cottage_timber.png` | **Roubená venkovská chalupa** | Ukotveno bezprostředně k políčkům Vesnic | ✅ PNG aktivní (+flip) |
| `village_well.png` | **Kamenná návesní studna** | Návsi vesnic a městská náměstí | ✅ PNG aktivní (+flip) |
| `merchant_wagon.png` | **Kupecký krytý povoz** | U krámků, tržišť a kovářů | ✅ PNG aktivní (+flip) |
| `tournament_tent.png` | **Turnajový královský stan** | Slavnostní louka u Královské slavnosti | ✅ PNG aktivní (+flip) |
| `signpost.png` | **Dřevěný rozcestník** | Rozcestí a křižovatky tras | ✅ PNG aktivní (+flip) |
| `signpost2.png` | **Kamenný rozcestník** | Křižovatky horských a kamenných cest | ✅ PNG aktivní (+flip) |
| `wooden_watchtower.png` | **Dřevěná strážní věž** | Pomezí hranic, výběrčí daní, hrady | ✅ PNG aktivní (+flip) |
| `hrad.png` | **Strážní hrad** | Obranné vyvýšeniny | ✅ PNG aktivní (+flip) |

---

### 5. Vodní toky, mosty a močály

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `lake_pond.png` | **Modré lesní jezírko s lekníny** | Přírodní prohlubně v krajině | ✅ PNG aktivní (+flip) |
| `swamp_bridge.png` | **Dřevěná lávka přes močál** | Pěšiny přes močály a tůně | ✅ PNG aktivní (+flip) |
| `pegasus_pond.png` | **Pegas u lesní studánky** | Skryté prameny a posvátná zvířata | ✅ PNG aktivní (+flip) |

---

### 6. Magická místa, posvátné háje a ruiny

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `fairy_ring_mushrooms.png` | **Vílí houbový kruh** | Náhoda, kejklíři a magické mýtiny | ✅ PNG aktivní (+flip) |
| `druid_monoliths.png` | **Druidské menhiry a megalit** | Tajemná místa moci a osudu | ✅ PNG aktivní (+flip) |
| `dryad_sacred_oak.png` | **Posvátný dub s lesní dryádou** | Starobylé hvozdy a ochránci přírody | ✅ PNG aktivní (+flip) |
| `unicorn_grove.png` | **Kouzelný háj s jednorožcem** | Chovy bájných zvířat a mírumilovné luhy | ✅ PNG aktivní (+flip) |
| `ancient_ruins.png` | **Zarostlé kamenné zříceniny** | Opuštěné pevnosti a staré cesty | ✅ PNG aktivní (+flip) |
| `ancient_graveyard.png` | **Tajemný starý hřbitov** | Okolí lazaretů a stinná údolí | ✅ PNG aktivní (+flip) |
| `witch_hut.png` | **Perníková chaloupka ježibaby** | Hluboké hvozdy a tajemná setkání | ✅ PNG aktivní (+flip) |

---

### 7. Doupata nestvůr a sluje (Quest Lairs)

| Kód prvku | Název | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- |
| `cave_bear_den.png` | **Medvědí jeskyně** | Lovecké výpravy a divočina (U1) | ✅ PNG aktivní (+flip) |
| `bandit_cave.png` | **Loupežnická jeskyně s pokladem** | Skryté rokle a bandití stezky | ✅ PNG aktivní (+flip) |
| `dragon_cave.png` | **Spící drak ve sluji** | Vrcholné dračí výzvy a zlaté poklady | ✅ PNG aktivní (+flip) |
| `basilisk_cave.png` | **Jeskyně baziliška** | Skalní rozsedliny a nebezpečné zkoušky | ✅ PNG aktivní (+flip) |
| `snow_troll_cave.png` | **Ledová jeskyně sněžného trolla** | Severní zasněžené štíty | ✅ PNG aktivní (+flip) |
| `swamp_troll.png` | **Bažinný troll u tůně** | Zrádné močály a temné vody | ✅ PNG aktivní (+flip) |
| `swamp_hydra.png` | **Pětihlavá bažinná hydra** | Hluboké bažiny a legendární nestvůry | ✅ PNG aktivní (+flip) |
