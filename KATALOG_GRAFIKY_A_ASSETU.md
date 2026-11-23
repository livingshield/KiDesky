# 🎨 Komplexní katalog grafiky a herních assetů KiDesky: Princeznino srdce

Tento dokument je **oficiálním a úplným katalogem všech grafických prvků, ilustrací a vizuálních assetů** deskové hry **KiDesky: Princeznino srdce**. Slouží jako centrální technická a výtvarná dokumentace pro herní engine, grafiky, autory obsahu i hráče.

---

## 🧭 Architektonické a výtvarné standardy

> [!IMPORTANT]
> **Vizuální a technická pravidla grafiky KiDesky:**
> 1. **Výtvarný styl:** Jemná akvarelová perokresba (*ink-and-watercolor storybook aesthetic*) s pohádkově realistickými detaily, ladící s pergamenovým podkladem království.
> 2. **Perspektiva:** Izometrický 2D pohled mírně shora (úhel ~30°), se spodním ukotvením a měkkým stínem.
> 3. **Formáty souborů:**
>    - **Master předlohy:** `Deskovky/<sekce>/*.jpg`
>    - **Webové transparentní sprity:** `assets/<sekce>/*.png` (čistý 32bitový `RGBA` kanál s oříznutými prázdnými okraji).
>    - **Zrcadlené varianty (`*_flip.png`):** Každý asset disponuje horizontálně převrácenou variantou, aby se draci, stavby i stromy mohly přirozeně dívat na obě strany herního plánu.
> 4. **Pravidla nasazování (ASPONE Hosting):** Přísný zákaz nahrávání jakýchkoliv `.exe` spustitelných souborů. Všechny nástroje a konvertory běží lokálně v Pythonu (`rembg`, `Pillow`) a nasazují se výhradně webové assety (`.png`, `.jpg`, `.js`, `.css`).

---

## 🐉 Kapitola 1: Draci & Bestiář (20 draků pro úkol U3)

Draci představují nejvyšší výzvu královských rytířů na políčkách **Úkol 3 (U3)**. Jsou rozděleni do tří výkonnostních kategorií (Tierů). Každý drak má specifickou slabinu, odměnu ve zlatě, zisk **Princezniných srdcí (💖)** a zanechává po sobě unikátní **trofej** do 5. slotu výbavy.

### Přehledová tabulka draků

| ID draka | Název | Živel / Ikona | Tier | Obtížnost | Odměna (zl. / 💖) | Klíčová slabina | Spojená trofej |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `u3_green` | **Větrný útesový drak** | 🌬️ Vzduch | A (Mladý) | 11 | 6 500 / +2.5 💖 | Lovečtí psi (`dogs`) | Větrná šupina útesového draka |
| `u3_swamp` | **Bažinný jedový drak** | 🐊 Voda/Jed | A (Mladý) | 11 | 7 000 / +2.5 💖 | Lektvar z lazaretu (`elixir`) | Jedový váček z močálu |
| `u3_fairy` | **Pohádkový pestrý drak** | 🦋 Magie | A (Mladý) | 11 | 6 000 / +3.0 💖 | Tanec & Charisma (`dance`) | Pyl kouzelného motýlodraka |
| `u3_water` | **Vodní jezerní drak** | 🌊 Voda | A (Mladý) | 12 | 7 500 / +3.0 💖 | Jezdecké kopí (`spear`) | Perla jezerního draka |
| `u3_wind` | **Větrný nebeský drak** | 🌪️ Vzduch | A (Mladý) | 12 | 7 500 / +3.0 💖 | Rychlý kůň (`horse`) | Péro větrného draka |
| `u3_red` | **Červený ohnivý drak** | 🐉 Oheň | B (Živlový) | 13 | 8 500 / +4.0 💖 | Chladivá zbroj (`water_armor`) | Ohnivá dračí šupina |
| `u3_volcano` | **Sopečný lávový drak** | 🌋 Láva | B (Živlový) | 13 | 9 000 / +4.0 💖 | Mrazivé zbraně (`ice`) | Žhavé magma z chřtánu |
| `u3_ice` | **Mrazivý ledový drak** | ❄️ Led | B (Živlový) | 13 | 8 500 / +4.0 💖 | Oheň a plamen (`fire`) | Rampouch Věčného mrazu |
| `u3_lightning` | **Bouřný bleskový drak** | ⚡ Blesk | B (Živlový) | 14 | 10 000 / +4.5 💖 | Pevná zbroj (`armor`) | Bleskový spár bouří |
| `u3_black` | **Černý stínový drak** | 🌑 Temnota | B (Živlový) | 14 | 9 500 / +4.5 💖 | Světlo a víra (`light`) | Černý roh zhouby |
| `u3_crystal` | **Křišťálový drahokamový drak** | 💎 Krystal | B (Živlový) | 14 | 11 000 / +4.5 💖 | Vysoké Charisma (`charisma`) | Krystalové srdce draka |
| `u3_bone` | **Kostěný nemrtvý drak** | 💀 Nemrtvý | B (Živlový) | 14 | 9 000 / +4.0 💖 | Posvěcené zbraně (`holy`) | Kostěná relikvie předků |
| `u3_gold` | **Zlatý královský drak** | 👑 Světlo | B (Živlový) | 14 | 12 500 / +5.0 💖 | Rytířská čest (`charisma`) | Zlatá královská korouhev |
| `u3_shadow` | **Přízračný drak stínů** | 👻 Stín | B (Živlový) | 14 | 10 000 / +4.5 💖 | Odvaha a vůle (`courage`) | Stínový závoj mlh |
| `u3_2headed` | **Dvouhlavý strážný drak** | 🐉 Strážce | C (Boss) | 15 | 11 500 / +5.0 💖 | Lovecký sokol (`falcon`) | Dvojitý tesák strážců |
| `u3_3headed` | **Tříhlavá královská saň** | 🐲 Legenda | C (Boss) | 16 | 13 500 / +5.5 💖 | Koordinace zvěře (`animals`) | Koruna tříhlavé saně |
| `u3_hydra` | **Prastará lesní hydra** | 🐍 Močál | C (Boss) | 16 | 13 000 / +5.5 💖 | Oheň na rány (`fire`) | Hlava pralesní hydry |
| `u3_elemental` | **Čtyřhlavý živelný drak** | 🔮 4 Živly | C (Boss) | 17 | 15 000 / +6.0 💖 | Mistrovství 4 ctností (`mastery`) | Žezlo čtyř živlů |
| `u3_shadow_multi` | **Temný stínový vícehlavý drak** | 🖤 Prázdnota | C (Boss) | 17 | 15 500 / +6.0 💖 | Posvátné světlo (`light`) | Temný klenot nicoty |
| `u3_5headed` | **Pětihlavý drak Zkázy** | 👑 Vládce | C (Boss) | 17 | 16 000 / +6.0 💖 | Zvěř & kopí (`animals_and_spear`) | Císařské žezlo Zkázy |

### Detailní výtvarné popisy vybraných draků

1. **Červený ohnivý drak (`dragon_red.png`):**
   - *Vzhled:* Hrdý drak se sytě červenými a zlatavými šupinami, mohutnými blanitými křídly a ostrými trny na hřbetě. Z nozder stoupá plamínek a dým.
   - *Podstavec:* Tmavý skalnatý útes s mechem, u jehož paty se třpytí hromada zlatých pohárů a mincí.
2. **Křišťálový drahokamový drak (`dragon_crystal.png`):**
   - *Vzhled:* Oslnivá ještěří bytost složená z ametystových a růžových prizmatických krystalů, které lámou paprsky světla do duhových odlesků.
   - *Podstavec:* Skalní ostrov prorostlý třpytivými ametystovými geodami a svítícími minerály.
3. **Pětihlavý drak Zkázy (`dragon_5headed.png`):**
   - *Vzhled:* Kolosální saň s pěti samostatnými krky, z nichž každá hlava cení zuby a vydechuje jiný magický živel.
   - *Podstavec:* Monumentální rozeklaný sopečný trůn z černého obsidiánu obklopený největším královským pokladem.

---

## 🏰 Kapitola 2: Hrady, zámky & panství (10 sídel)

Hrady představují nejcennější nemovitosti na herním plánu. Hráč za jejich vlastnictví získává daňové výnosy, mýtné od soupeřů, prestiž a speciální pasivní schopnosti u královského dvora.

| ID hradu | Název | Živel / Ikona | Vizuální motiv | Schopnost / Bonus |
| :--- | :--- | :---: | :--- | :--- |
| `castle_royal` | **Královský hrad (Sídlo koruny)** | 👑 Světlo | Červené kuželové střechy, padací most, vlající korouhve | Centrum královské moci (+1 Charisma, prestiž) |
| `castle_forest` | **Lesní hrad Doubrava** | 🌲 Země | Kamenné zdivo obrostlé břečťanem, dřevěné ochozy | Sleva na výcvik Jízdy na koni u mistra |
| `castle_desert` | **Pouštní pískovcový palác** | 🏜️ Písek | Pískovcové kopule, oáza s palmami, orientální stany | Zvýšený výnos z tranzitních karavan |
| `castle_swamp` | **Bažinná tvrz Černá tůň** | 🌫️ Voda | Zvětralé kamenné věže v tůni, rákosí, lekníny | Odolnost proti nástrahám a loupežníkům |
| `castle_lava` | **Sopečná pevnost Lávový chřtán** | 🌋 Oheň | Černý obsidián, trhliny s tekoucí žhavou lávou | Sleva na nákup těžkých zbraní a kování |
| `castle_dark` | **Temný podzemní hrad Erebus** | 🌑 Temnota | Fialovo-černý kámen, trnité věže, runová brána | Ochrana před kletbami a intrikami soupeřů |
| `castle_crystal` | **Křišťálový zámek Ametyst** | 💎 Krystal | Věže z obřích ametystů a průsvitných drahokamů | Bonus ke všem klenotům a šperkům (+1 Tanec) |
| `castle_water` | **Vodní citadela Oceán** | 🌊 Voda | Mořská modř, kaskádovité vodopády, funkční mlýnské kolo | Bezpečný přístav pro lodní a jezerní obchod |
| `castle_wind` | **Větrný vzdušný zámek Boreas** | ☁️ Vzduch | Pevnost v oblacích, rotující větrné lopatky, stuhy | Pohybový bonus při hodu kostkou |
| `castle_ice` | **Ledový palác Věčného mrazu** | ❄️ Led | Průsvitný led, masivní rampouchy, zamrzlý vodopád | Mrazivá daň – znehybnění soupeře na 1 tah |

---

## 🌲 Kapitola 3: Dekorace krajiny a rekvizity (42 prvků)

Dekorace krajiny oživují prostor herního plánu mezi políčky. Herní engine využívá inteligentní rozvrhovač s **Poisson-disk distribucí**, který hlídá kolize s cestami, dominantami i kartami. Prvky jsou rozděleny na **ukotvené k políčkům** a **rozptýlené po krajině**. Každý prvek má i oboustrannou variantu `*_flip.png`.

### 1. Lesy a vegetace (11 prvků)
- `tree_oak.png` (Listnatý dub): 56×68 px, clearance 28 px. Klasický solitérní dub s hustou korunou na loukách.
- `tree_pine.png` (Horská borovice): 48×72 px, clearance 25 px. Jehličnatý strom podhůří a severních hor.
- `tree_birch.png` (Bělostná bříza): 44×64 px, clearance 22 px. Světlá bříza s bílou kůrou u pastvin koní.
- `grove_oak.png` (Dubový hájek): 92×76 px, clearance 44 px. Skupina tří vzrostlých dubů vyplňující větší volné plochy.
- `grove_pine.png` (Borový lesík): 86×80 px, clearance 42 px. Hustý lesík u Dračí sluje.
- `grove_pine2.png` (Hluboký borový hvozd): 92×80 px, clearance 42 px. Rozsáhlý temnější hvozd na severovýchodě.
- `orchad_apple.png` (Jabloňový sad): 96×76 px, clearance 44 px. Pravidelně vysázený sad obsypaný červenými jablky.
- `orchad_plum.png` (Švestkový sad): 96×76 px, clearance 44 px. Sad se zrajícími modrými švestkami.
- `hruskovy_sad.png` (Hruškový sad): 96×76 px, clearance 44 px. Sad se zralými žlutozelenými hruškami na slunných stráních.
- `bush.png` (Hustý keř): 48×42 px, clearance 22 px. Přírodní nízký podrost lemující křižovatky a potoky.
- `forest_ent.png` (Prastarý lesní ent): 66×84 px, clearance 36 px. Obří oživlý stromový strážce hvozdu s parožím a mechovým vousem.

### 2. Terén a geologie (2 prvky)
- `rock_boulder.png` (Mechem porostlý balvan): 52×40 px, clearance 24 px. Puklý žulový balvan s mechovým kobercem.
- `mountain_peaks.png` (Zasněžený horský hřeben): 120×74 px, clearance 55 px. Impozantní masiv se zasněženými vrcholky.

### 3. Zemědělství a venkov (4 prvky)
- `farm_field.png` (Lán pšeničného pole): 105×60 px, clearance 48 px. Zlatavý obdélníkový lán dozrávající pšenice s brázdami.
- `pasture_fence.png` (Pastvina s dřevěným plůtkem): 78×48 px, clearance 36 px. Oplocený travnatý výběh kotvený k políčkům zvířat.
- `windmill.png` (Středověký větrný mlýn): 68×88 px, clearance 34 px. Dřevěný holandský mlýn s otáčivými lopatkami.
- `watermill.png` (Vodní mlýn s náhonem): 78×84 px, clearance 38 px. Roubený mlýn s mohutným vodním kolem a proudem vody.

### 4. Lidská sídla, kultura a rekvizity (9 prvků)
- `cottage_timber.png` (Roubená chalupa): 70×64 px, clearance 35 px. Tradiční podstávková chalupa se šindelovou střechou.
- `village_well.png` (Kamenná studna): 42×46 px, clearance 22 px. Návesní studna s rumpálem, stříškou a okovem s vodou.
- `merchant_wagon.png` (Kupecký krytý vůz): 68×52 px, clearance 32 px. Trhový povoz s plachtou a loukoťovými koly u obchodníka.
- `tournament_tent.png` (Turnajový královský stan): 78×70 px, clearance 38 px. Červeno-zlatý pavilon s korouhví pro rytířská klání.
- `signpost.png` (Dřevěný rozcestník): 32×44 px, clearance 18 px. Rozcestník se šipkami označující směry na rozcestích.
- `signpost2.png` (Kamenný rozcestník): 44×54 px, clearance 20 px. Otesaný kamenný milník s vytesanými erby a směry.
- `wooden_watchtower.png` (Dřevěná strážní věž): 66×84 px, clearance 36 px. Pohraniční dřevěná pozorovatelna s žebříkem a pochodní.
- `ancient_tower_ruin.png` (Zřícenina kamenné věže): 64×84 px, clearance 36 px. Stará kamenná věž prorostlá větvemi mohutného stromu.
- `hrad.png` (Strážní hrad): 80×80 px, clearance 40 px. Malý kamenný donjon kotvený na vyvýšeninách.

### 5. Vodní toky, mosty a močály (5 prvků)
- `lake_pond.png` (Modré lesní jezírko): 96×58 px, clearance 46 px. Průzračná tůň s lekníny, rákosím a vodními vlnkami.
- `swamp_bridge.png` (Dřevěná lávka přes močál): 84×57 px, clearance 38 px. Polorozpadlá dřevěná lávka přes kalnou tůň s bludičkami.
- `pegasus_pond.png` (Pegas u lesní studánky): 84×62 px, clearance 38 px. Sněhobílý okřídlený kůň pijící z posvátného pramene.
- `lake_nymphs.png` (Jezerní rusalky na molu): 88×52 px, clearance 38 px. Půvabné jezerní víly a rusalky vyhřívající se na dřevěném molu.
- `vodnik_pond.png` (Vodník u tůně): 88×53 px, clearance 38 px. Zelený vodník kouřící fajfku na vrbě nad temnou tůní se síťkou a hrníčky.

### 6. Magická místa, posvátné háje a ruiny (9 prvků)
- `fairy_ring_mushrooms.png` (Vílí houbový kruh): 84×67 px, clearance 36 px. Kruh světélkujících hub se třpytivým vílím prachem v mechu.
- `druid_monoliths.png` (Druidské menhiry): 84×72 px, clearance 38 px. Kamenný kruh vztyčených menhirů s vyrytými zářícími runami a oltářem.
- `dryad_sacred_oak.png` (Posvátný dub s dryádou): 65×84 px, clearance 36 px. Prastarý košatý dub, z jehož kmene vystupuje lesní víla.
- `unicorn_grove.png` (Kouzelný háj s jednorožcem): 84×75 px, clearance 38 px. Ušlechtilý jednorožec ve stříbřité lesní mýtině.
- `ancient_ruins.png` (Zarostlé kamenné zříceniny): 84×79 px, clearance 38 px. Opuštěné hradní zdi s gotickým obloukem a polozakopanou truhlou.
- `ancient_graveyard.png` (Tajemný starý hřbitov): 84×60 px, clearance 38 px. Kamenná zídka, staré náhrobky, suchý strom a železná brána.
- `witch_hut.png` (Perníková chaloupka ježibaby): 74×84 px, clearance 38 px. Perníková chaloupka s polevou a fialovým kouřem z komína.
- `crystal_golem.png` (Krystalový golem): 79×84 px, clearance 38 px. Mohutný kamenný golem obrostlý mechem a fialovo-modrými krystaly.
- `phoenix_nest.png` (Hnízdo ohnivého Fénixe): 82×84 px, clearance 38 px. Planoucí ohnivý pták Fénix sedící v hnízdě na skalním pilíři.

### 7. Doupata nestvůr a sluje (9 prvků)
- `cave_bear_den.png` (Medvědí jeskyně): 84×84 px, clearance 38 px. Skalní jeskyně střežená obřím divokým medvědem u vchodu plného kostí.
- `bandit_cave.png` (Loupežnická jeskyně s pokladem): 84×82 px, clearance 38 px. Loupežnické doupě osvětlené pochodněmi s otevřenými truhlami zlaťáků.
- `griffin_nest.png` (Hnízdo skalního gryfa): 64×84 px, clearance 38 px. Skalní sloup s hnízdem, vejci a zlatem hlídaným okřídleným gryfem.
- `fire_salamander.png` (Ohnivý salamandr): 80×84 px, clearance 38 px. Magický ohnivý ještěr vyhřívající se na žhavých lávových kamenech.
- `dragon_cave.png` (Spící drak ve sluji): 88×61 px, clearance 38 px. Červený drak spící stočený na obří hromadě zlatých mincí a trofejí.
- `basilisk_cave.png` (Jeskyně baziliška): 84×57 px, clearance 38 px. Skalní rozsedlina plná zkamenělých těl střežená smrtícím ještěrem.
- `snow_troll_cave.png` (Ledová jeskyně sněžného trolla): 84×56 px, clearance 38 px. Ledové krápníky a doupě mocného bílého trolla s kyjem.
- `swamp_troll.png` (Bažinný troll u tůně): 84×62 px, clearance 38 px. Zavalitý bažinný troll odpočívající pod kořeny u kalné tůně.
- `swamp_hydra.png` (Pětihlavá bažinná hydra): 84×56 px, clearance 38 px. Děsivá pětihlavá zelená hydra vynořující se z hlubin bažiny.

---

## 🏛️ Kapitola 4: Dominanty herního plánu (Landmarks)

Dominanty jsou klíčové prostorové orientační body s pevnou herní pozicí a velkým měřítkem:

1. **Královský hrad (`assets/landmarks/royal_castle.png`):**
   - *Pozice:* Centrální oblast plánu (cílové nádvoří, kam rytíři přivádějí své družiny).
   - *Rozměry:* 190×160 px.
2. **Dračí sluj (`assets/landmarks/dragon.png`):**
   - *Pozice:* Severovýchodní skalnatý masiv u vrcholných políček U3.
   - *Rozměry:* 180×150 px.
3. **Královský erb a štít (`assets/landmarks/shield.png`):**
   - *Pozice:* Reprezentativní záhlaví desky se symbolem tří zlatých srdcí na modrém poli.

---

## 🔘 Kapitola 5: Medailony herních políček (18 typů)

Herní políčka jsou tvořena kruhovými erbovními medailony (`assets/tiles/*.png`):

| Kód pole | Název pole | Ikona / Popis medailonu |
| :--- | :--- | :--- |
| `START` | **Královský START** | `castle.png` – Zlatá brána královského města (+3 000 zl.) |
| `kun` | **Chov koní** | `kun.png` – Bělouš v postroji (1. až 4. stáj) |
| `pes` | **Chov psů** | `pes.png` – Stopařský lovecký ohař a chrt |
| `sokol` | **Sokolnictví** | `sokol.png` – Vzácný sokol a raroh na kožené rukavici |
| `VILLAGE` | **Královská vesnice** | `village.png` – Skupina venkovských domků s návsí |
| `TOWN` | **Hradní město** | `town.png` – Městské hradby, tržiště a radnice |
| `CASTLE` | **Šlechtický hrad** | `castle.png` – Rodové sídlo s věžemi a prapory |
| `MERCHANT` | **Kupecký krámek** | `merchant.png` – Kupec s váhami, klenoty a truhlicemi |
| `FESTIVAL` | **Královská slavnost** | `festival.png` – Rytířský turnaj, ples a dostihy |
| `PRISON` | **Královské vězení** | `prison.png` – Masivní mříže a kamenná kobka v hradu |
| `HOSPITAL` | **Královský lazaret** | `hospital.png` – Léčitelé, byliny a hojivé balzámy |
| `TAVERN` | **Zájezdní hostinec** | `tavern.png` – Dřevěný korbel piva, pečeně a hudebníci |
| `MASTER` | **Mistr rytířských ctností** | `master.png` – Mistr šermu a výcviku s cvičným mečem na nádvoří |
| `TAX` | **Královská berně (Daň)** | `tax.png` – Královský výběrčí s váhami a měšci zlata |
| `JESTER` | **Královský šašek** | `jester.png` – Kejklíř a šašek žonglující v paláci |
| `kovarna` | **Mistr kovář a zbrojíř** | `kovarna.png` – Kovář u kovadliny s žhavým mečem a jiskrami |
| `U1` | **Lov zvěře (U1)** | `u1_zver.png` – Kanec, jelen a vlk v hlubokém hvozdu |
| `U2` | **Zkouška udatnosti (U2)** | `u2_monstrum.png` – Skalní obr, černý rytíř a vlkodlak |
| `U3` | **Dračí sluj (U3)** | `u3_drak.png` – Zlatý a ohnivý drak chrlící plameny |

---

## 📜 Kapitola 6: Prostředí, stůl & pergamení desky

1. **Královský stůl svíček (`assets/env/table_bg.jpg`):**
   - Teplá textura tmavého masivního dubového dřeva se světlem svíček a jemnou patinou, která tvoří rám celé herní aplikace.
2. **Královský pergamen (`assets/board/parchment_board_bg.jpg`):**
   - Autentická textura starého pergamenu s jemnou kresbou řek, reliéfů a kompasových růžic, na které je rozkreslena herní síť tras a políček.
3. **Původní historické nákresy deskové hry:**
   - [IMG_4599.jpg](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/Deskovky/jpg/IMG_4599.jpg) a [IMG_4595.jpg](file:///c:/Users/janky/.gemini/antigravity/scratch/KiDesky/Deskovky/jpg/IMG_4595.jpg) sloužící jako geometrický a topologický etalon.
