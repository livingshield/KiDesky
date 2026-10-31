# Katalog a kontrolní seznam grafických prvků krajiny 🌲🏰

Tento dokument slouží jako přehledný **seznam a specifikace grafických prvků** pro oživení herních plánů deskové hry **KiDesky: Princeznino srdce**. 

Herní engine již obsahuje **procedurální rozvrhovač a vektorové SVG modely** pro všech 16 prvků – herní plocha je tedy již nyní plně oživená, bez prázdných míst a s nulovými kolizemi s políčky či cestami. Jakmile dodáte jakýkoliv obrázek v PNG, systém jej okamžitě začne používat namísto SVG vektoru.

---

## 🎨 Technické a vizuální požadavky na obrázky

> [!IMPORTANT]
> **Pravidla pro dodávané obrázky:**
> 1. **Formát:** Čistý 32bitový PNG s alfa průhledností (`RGBA`, bez bílo-šedých šachovnic v pozadí).
> 2. **Perspektiva a styl:** Mírně vyvýšený izometrický 2D pohled (stejný úhel a pohádkově realistický styl jako u stávajících hradů a draků).
> 3. **Spodní hrana:** Přirozené zakončení u země s jemným měkkým stínem.
> 4. **Cílová složka na disku:** `assets/decor/<nazev_souboru>.png` (nebo `Deskovky/decor/`).

---

## 📋 Přehled 16 prvků krajiny podle kategorií

### 1. Lesy a stromy (Vegetace)

| Kód prvku | Název | Doporučené rozlišení | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- | :--- |
| `tree_oak.png` | **Listnatý dub** | 256 × 256 px | Louky, mírné pahorky, okolí cest | *SVG aktivní* (čeká na PNG) |
| `tree_pine.png` | **Horská borovice / smrk** | 256 × 256 px | Podhůří, lovecké revíry (U1), severní část | *SVG aktivní* (čeká na PNG) |
| `tree_birch.png` | **Bělostná bříza** | 256 × 256 px | Světlé háje, pastviny koní | *SVG aktivní* (čeká na PNG) |
| `grove_oak.png` | **Dubový hájek (skupinka 3 dubů)** | 384 × 256 px | Větší volné plochy mezi trasami | *SVG aktivní* (čeká na PNG) |
| `grove_pine.png` | **Borový lesík** | 384 × 256 px | Husté hvozdy v rozích a u Dračí sluje | *SVG aktivní* (čeká na PNG) |

---

### 2. Terén a geologie

| Kód prvku | Název | Doporučené rozlišení | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- | :--- |
| `rock_boulder.png` | **Mechem porostlý balvan** | 256 × 256 px | Skalnaté úseky, okraje cest, úkoly U2/U3 | *SVG aktivní* (čeká na PNG) |
| `mountain_peaks.png` | **Zasněžený horský hřeben** | 512 × 256 px | Severní horizont a odlehlé rohy mapy | *SVG aktivní* (čeká na PNG) |

---

### 3. Zemědělství a venkov

| Kód prvku | Název | Doporučené rozlišení | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- | :--- |
| `farm_field.png` | **Lán pšeničného pole** | 384 × 256 px | Roviny v okolí vesnic a měst | *SVG aktivní* (čeká na PNG) |
| `pasture_fence.png` | **Pastvina s dřevěným plůtkem** | 384 × 256 px | Ukotveno k chovům koní (políčka ANIMAL) | *SVG aktivní* (čeká na PNG) |
| `windmill.png` | **Středověký větrný mlýn** | 256 × 384 px | Otevřené větrné pláně u vesnic | *SVG aktivní* (čeká na PNG) |

---

### 4. Lidská sídla, kultura a rekvizity

| Kód prvku | Název | Doporučené rozlišení | Umístění na herním plánu | Stav |
| :--- | :--- | :--- | :--- | :--- |
| `cottage_timber.png` | **Roubená venkovská chalupa** | 256 × 256 px | Ukotveno bezprostředně k políčkům Vesnic | *SVG aktivní* (čeká na PNG) |
| `village_well.png` | **Kamenná návesní studna** | 256 × 256 px | Návsi vesnic a městská náměstí | *SVG aktivní* (čeká na PNG) |
| `merchant_wagon.png` | **Kupecký krytý povoz** | 384 × 256 px | U krámků, tržišť a kovářů | *SVG aktivní* (čeká na PNG) |
| `tournament_tent.png` | **Turnajový královský stan** | 384 × 256 px | Slavnostní louka u políčka Královské slavnosti | *SVG aktivní* (čeká na PNG) |
| `signpost.png` | **Dřevěný rozcestník** | 256 × 256 px | Rozcestí a křižovatky (volby 1–3 vs 4–6) | *SVG aktivní* (čeká na PNG) |
| `lake_pond.png` | **Modré lesní jezírko s lekníny** | 384 × 256 px | Přírodní prohlubně v krajině | *SVG aktivní* (čeká na PNG) |

---

## 🚀 Jak postupovat

1. Kterékoliv obrázky ze seznamu, které máte připravené nebo chcete dodat, můžete nahrát do složky `assets/decor/` pod výše uvedeným názvem souboru (např. `assets/decor/windmill.png`).
2. Ty položky, které nebudete chtít dodávat ručně, na vaše přání kdykoliv vygenerujeme ve stejném výtvarném stylu, jaký mají stávající hrady a draci.
3. Herní plocha již v této chvíli vykresluje všechny tyto prvky pomocí lehkých izometrických vektorů, takže hra je okamžitě vizuálně bohatá a živá.
