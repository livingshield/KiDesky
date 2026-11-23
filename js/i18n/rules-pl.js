/**
 * KiDesky: Princeznino srdce
 * Przewodnik po grze i słowniczek pojęć – Polski (pl)
 */
(function (window) {
    'use strict';
    window.PRS_I18N_RULES = window.PRS_I18N_RULES || {};
    window.PRS_I18N_RULES["pl"] = {
        guide: [
        {
                "id": "rule-acc-legend",
                "title": "<span>👑</span> 0. Legenda o Sercu Księżniczki i Cel wyprawy",
                "badge": "Fabuła & Zwycięstwo",
                "body": "<p style=\"margin:0 0 0.6rem; line-height:1.55;\">Gdy smok wdarł się przez okno na audiencję królewską i porwał księżniczkę, w królestwie nastał czas próby. Królowa płacze, a z zamku wyruszają najdzielniejsi rycerze. Każdy rycerz ma wiernego giermka, sokoła i psa – lecz tylko ten, kto wykaże się prawdziwymi cnotami, zdobędzie rękę księżniczki.</p>\n<ul style=\"margin:0; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Cel gry:</strong> Zdobyć jako pierwszy <strong>30 💖 Serc Księżniczki</strong> (w scenariuszu Sprint: 15 💖).</li>\n    <li><strong>Źródła Serc:</strong> Serca zdobywa się za pełne zestawy zwierząt (+4 💖 / zestaw), zwycięstwa w zadaniach bojowych z potworami (U1–U3), wygrane w pojedynkach rycerskich, bale i turnieje tańca oraz karty Szansy.</li>\n    <li><strong>Scenariusze alternatywne:</strong> W Rytierskiej gospodzie można wybrać scenariusz <em>Pogromcy Smoków</em> (cel: zabić 2 smoki) lub <em>Feudalny Magnat</em> (cel: 3 miasta i 1 zamek).</li>\n</ul>"
        },
        {
                "id": "rule-acc-board",
                "title": "<span>⏱️</span> 1. Przebieg rundy i fazy tury rycerza",
                "badge": "Fazy tury",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>1. Rzut kostką:</strong> Wybierz tempo marszu (Pieszy 1–6, Ostrożny 1–4 lub Galop 2k6 przy posiadaniu konia) i rzuć królewską kostką.</li>\n    <li><strong>2. Ruch pionka:</strong> Pionek przemieszcza się po polach planszy zgodnie z ruchem wskazówek zegara (lub wybiera odgałęzienia na skrzyżowaniach).</li>\n    <li><strong>3. Akcja na polu:</strong> Rozpatrz efekt pola docelowego (zakup posiadłości, zadanie bojowe, wizyta w karczmie, szansa itp.).</li>\n    <li><strong>4. Zakończenie tury:</strong> Możesz ulepszyć swoje wioski, dokupić inwentarz, a następnie kliknąć 'Zakończ turę', przekazując kostkę kolejnemu graczowi.</li>\n</ul>"
        },
        {
                "id": "rule-acc-movement",
                "title": "<span>🚶</span> 2. Ruch pieszy, Koński galop i Sokola nawigacja",
                "badge": "Ruch & Manewry",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Marsz pieszy (1k6):</strong> Standardowy rzut jedną kostką w zakresie 1–6 pól. Dostępny dla każdego rycerza od początku gry.</li>\n    <li><strong>Krok ostrożny (1–4):</strong> Bezpieczny manewr pozwalający uniknąć pułapek, lochów czy pól poborcy podatków. Maksymalny rzut wynosi 4.</li>\n    <li><strong>Koński galop (2k6):</strong> Wymaga co najmniej 1 konia w stajni. Rycerz rzuca dwiema kostkami i może wybrać: pełny cwał (suma oczek d1+d2 przy Jeździe ≥ 2) lub manewr taktyczny (wybór jednej z kostek).</li>\n    <li><strong>Sokola nawigacja (±1 pole):</strong> Jeśli posiadasz sokoła łowczego, możesz po rzucie skorygować ruch o 1 pole w przód lub w tył, aby idealnie trafić w pożądane pole.</li>\n</ul>"
        },
        {
                "id": "rule-acc-estates",
                "title": "<span>🏰</span> 3. Posiadłości feudalne, Dobra i Poborca podatków",
                "badge": "Ekonomia & Czynsz",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Zakup posiadłości:</strong> Wolne pola wiosek, miast, zamków i zwierząt można kupić stając na nich, płacąc cenę w złocie.</li>\n    <li><strong>Pobieranie czynszu (myta):</strong> Gdy inny rycerz stanie na twoim polu, płaci ci czynsz zależny od poziomu posiadłości i posiadanych zwierząt.</li>\n    <li><strong>Poborca podatków (PP):</strong> Za każdym razem, gdy jakikolwiek rycerz stanie na polu Poborcy podatków, wszyscy właściciele posiadłości otrzymują wypłatę podatków za każdą wioskę, miasto, zamek i stado bydła! Rycerz bez ziemi płaci karę bezzemka.</li>\n    <li><strong>Ulepszanie wiosek (★ 1–3):</strong> Wioski można ulepszać za złoto: 1★ (Wioska) → 2★ (Miasteczko) → 3★ (Duża osada), co zwiększa czynsz i podatki.</li>\n</ul>"
        },
        {
                "id": "rule-acc-animals",
                "title": "<span>🐎</span> 4. Zestawy zwierząt, Inwentarz gospodarski i Premia hodowlana",
                "badge": "Hodowla & Zestawy",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Szlachecki tercet (Koń + Pies + Sokół):</strong> Zebranie kompletu 3 zwierząt z tego samego zestawu daje stały bonus <strong>+1 💖 Serce Księżniczki</strong> oraz premię hodowlaną.</li>\n    <li><strong>Konie (K1–K14):</strong> Umożliwiają Koński galop 2k6 oraz udział w Wyścigach konnych na Festynie.</li>\n    <li><strong>Psy myśliwskie (P1–P14):</strong> Dają bonus bojowy przeciw zwierzynie leśnej (zadania U1) i wspomagają obronę.</li>\n    <li><strong>Sokoły łowcze (S1–S14):</strong> Zapewniają Sokolą nawigację (±1 pole) i zwiad szlaków.</li>\n    <li><strong>Inwentarz gospodarski (Owce, Świnie, Bydło):</strong> Zwiększa dochody u Poborcy podatków i czynsz w wioskach. Można go dokupić na pastwiskach lub zdobyć z kart Szansy.</li>\n</ul>"
        },
        {
                "id": "rule-acc-virtues",
                "title": "<span>🥋</span> 5. Cztery cnoty rycerskie, Mistrzowie i Tarcza rycerska",
                "badge": "Cnoty & Trening",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Cztery cnoty:</strong> ⚔️ Walka (pokonywanie potworów), 🏇 Jazda (szybki ruch i turnieje), 💃 Taniec (bale i popisy dworskie), ✨ Charyzma (rabaty i wpływy polityczne).</li>\n    <li><strong>Mistrzowie rzemiosł:</strong> Wizyta na polu mistrza pozwala podnieść poziom cnoty za opłatą w złocie.</li>\n    <li><strong>Pojedynek z mistrzem:</strong> Zamiast opłaty możesz wyzwać mistrza na pojedynek honorowy – wygrana daje awans cnoty za darmo i pieczęć mistrza!</li>\n    <li><strong>Tarcza rycerska:</strong> Zebranie pieczęci mistrzów zapewnia zwolnienie z podatków wojennych i darmowe leczenie w szpitalu.</li>\n</ul>"
        },
        {
                "id": "rule-acc-combat",
                "title": "<span>⚔️</span> 6. Walka, Legowiska potworów i Smocze jaskinie",
                "badge": "Walka & Trofea",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Stopnie trudności walki:</strong> U1 Zwierzyna leśna (łatwe), U2 Potwory i bestie (średnie), U3 Smoki i legendarne zmory (trudne, śmiertelnie groźne).</li>\n    <li><strong>Przebieg starcia:</strong> Rycerz i potwór rzucają kośćmi. Do wyniku rycerza dodaje się cnotę Walki ⚔️, bonusy z ekwipunku, psów myśliwskich i zwojów.</li>\n    <li><strong>Zwycięstwo:</strong> Przynosi sowite złoto, cenne trofeum łowieckie, wpis do kroniki oraz Serce Księżniczki!</li>\n    <li><strong>Porażka:</strong> Rycerz traci siły i zostaje odesłany do Królewskiego lazaretu na leczenie.</li>\n</ul>"
        },
        {
                "id": "rule-acc-festivals",
                "title": "<span>💃</span> 7. Królewskie Festyny, Bale dworskie i Dary serca",
                "badge": "Dwór & Sława",
                "body": "<p style=\"margin:0 0 0.5rem; line-height:1.5;\">Gdy rycerz zatrzyma się na polu Festynu Królewskiego, dwór świętuje, a księżniczka spogląda z balkonu. To doskonała okazja do zdobycia jej względów!</p>\n<ul style=\"margin:0; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Turniej tańca:</strong> Próba cnoty Tańca 💃. Zachwycający występ nagradzany jest Sercem Księżniczki 💖.</li>\n    <li><strong>Dar dla księżniczki:</strong> Rycerz może złożyć hołd i ofiarować dar w złocie (1 000 zł.), zdobywając wdzięczność dworu.</li>\n    <li><strong>Uczta i biesiada:</strong> Odpoczynek, darmowy posiłek i regeneracja sił przed dalszą wyprawą.</li>\n</ul>"
        },
        {
                "id": "rule-acc-scrolls",
                "title": "<span>📜</span> 8. Karty Szansy, Skarby i Magiczne zwoje",
                "badge": "Los & Przedmioty",
                "body": "<ul style=\"margin:0 0 0.6rem; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Karty Szansy:</strong> Wejście na pole ze znakiem zapytania uruchamia losowanie karty losu. Może to być królewski dar, znalezienie skarbu, lecz także zasadzka zbójców!</li>\n    <li><strong>Torba na pergaminy (do 3 miejsc):</strong> Przydatne zwoje można zachować w torbie i użyć w idealnym momencie taktycznym.</li>\n    <li><strong>Typy zwojów:</strong> Bonus do rzutu kością (+1–3), gwarantowany rzut, ochrona przed czynszem, podwojenie hodowli czy wzmocnienie w walce.</li>\n</ul>"
        },
        {
                "id": "rule-acc-locations",
                "title": "<span>🏥</span> 9. Królewski lazaret, Lochy, Kuglarz i Karczma",
                "badge": "Miejsca specjalne",
                "body": "<ul style=\"margin:0; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>🏥 Królewski lazaret:</strong> Leczy rany po przegranej walce. Opłata wynosi 300 zł. (posiadacze Tarczy rycerskiej leczą się bezpłatnie).</li>\n    <li><strong>⛓️ Królewskie lochy:</strong> Trafiasz tu za karę lub z pechowej karty Szansy. Ucieczka wymaga wyrzucenia 6 oczek na kostce lub zapłacenia 500 zł. kaucji.</li>\n    <li><strong>🃏 Królewski kuglarz:</strong> Gra losowa: rzut kostką mnoży stawkę przez 100 zł., przynosząc zysk lub stratę.</li>\n    <li><strong>🍺 Karczma Pod Złotym Dzbanem:</strong> Miejsce odpoczynku, plotek dworskich i gry w kości z karczmarzem o podwojenie stawki.</li>\n</ul>"
        },
        {
                "id": "rule-acc-online",
                "title": "<span>🌐</span> 10. Stół online, Tryb wieloosobowy i Zarządzanie miejscami",
                "badge": "Multiplayer",
                "body": "<ul style=\"margin:0; padding-left:1.2rem; line-height:1.55;\">\n    <li><strong>Kod stołu (6 znaków):</strong> Załóż stół online i przekaż kod przyjaciołom. Każdy gracz może dołączyć ze swojego komputera lub telefonu.</li>\n    <li><strong>Miejsca botów i graczy:</strong> Gospodarz stołu może obsadzić wolne miejsca sztuczną inteligencją (botami) lub pozwolić graczom zajmować miejsca botów w trakcie gry.</li>\n    <li><strong>Emotki i reakcje:</strong> Wysyłaj królewskie okrzyki, fanfary i emotki w czasie rzeczywistym do wszystkich rycerzy przy stole!</li>\n</ul>"
        }
],
        glossary: [
        {
                "id": "masters_virtues",
                "title": "🥋 Skróty Mistrzów i Cnót",
                "content": "<div class=\"glossary-category-card\" style=\"background:rgba(18,14,10,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;\">\n    <div style=\"font-weight:bold; color:var(--gold-light); margin-bottom:0.3rem;\">Królewscy Mistrzowie &amp; Atrybuty</div>\n    <div style=\"font-size:0.8rem; line-height:1.5; color:#cbd5e1;\">\n        <strong>MB:</strong> Mistrz Walki (zwiększa cnotę Walki ⚔️)<br>\n        <strong>MJ:</strong> Mistrz Jazdy (zwiększa cnotę Jazdy konnej 🏇)<br>\n        <strong>MT:</strong> Mistrz Tańca (zwiększa cnotę Tańca dworskiego 💃)<br>\n        <strong>MCH:</strong> Mistrz Charyzmy (zwiększa cnotę Charyzmy ✨)<br>\n        <strong>Pieczęć Mistrza:</strong> Odznaka zdobywana za zwycięstwo w pojedynku z mistrzem. Komplet 3 pieczęci odblokowuje Tarczę rycerską!\n    </div>\n</div>"
        },
        {
                "id": "symbols_currencies",
                "title": "✨ Kluczowe symbole i waluty",
                "content": "<div class=\"glossary-category-card\" style=\"background:rgba(18,14,10,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;\">\n    <div style=\"font-weight:bold; color:var(--gold-light); margin-bottom:0.3rem;\">Złoto, Serca i Kredyty</div>\n    <div style=\"font-size:0.8rem; line-height:1.5; color:#cbd5e1;\">\n        <strong>zł. (Złote monety):</strong> Główna waluta gry do zakupu posiadłości, treningu cnót, ulepszeń wiosek i opłat.<br>\n        <strong>💖 (Serce Księżniczki):</strong> Punkty zwycięstwa. Pierwszy rycerz z 30 💖 wygrywa wyprawę!<br>\n        <strong>💎 (Królewskie kryształy / Kredyty):</strong> Waluta profilowa zdobywana za zwycięstwa, służąca do odblokowywania unikalnych pionków rycerskich w Garderobie.\n    </div>\n</div>"
        },
        {
                "id": "combat_quests",
                "title": "⚔️ Zadania bojowe i Bestiariusz",
                "content": "<div class=\"glossary-category-card\" style=\"background:rgba(18,14,10,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;\">\n    <div style=\"font-weight:bold; color:var(--gold-light); margin-bottom:0.3rem;\">Klasy zadań bojowych (U1–U3)</div>\n    <div style=\"font-size:0.8rem; line-height:1.5; color:#cbd5e1;\">\n        <strong>U1 (Łowiectwo leśne):</strong> Dzik, wilk, niedźwiedź. Łatwe zadania z bonusem od psów myśliwskich.<br>\n        <strong>U2 (Potwory i bestie):</strong> Golem, harpia, mantykora, potwór morski. Wymaga dobrego oręża i cnoty Walki.<br>\n        <strong>U3 (Smocze leża):</strong> Czerwony, Szmaragdowy, Złoty i Czarny smok. Najniebezpieczniejsze starcia o najwyższe honory i Serce księżniczki.\n    </div>\n</div>"
        },
        {
                "id": "animals_breeding",
                "title": "🐎 Zwierzęta szlacheckie i Inwentarz",
                "content": "<div class=\"glossary-category-card\" style=\"background:rgba(18,14,10,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;\">\n    <div style=\"font-weight:bold; color:var(--gold-light); margin-bottom:0.3rem;\">Szlachecki tercet &amp; Gospodarka</div>\n    <div style=\"font-size:0.8rem; line-height:1.5; color:#cbd5e1;\">\n        <strong>Koń (K):</strong> Rumak bojowy. Umożliwia Koński galop (2k6).<br>\n        <strong>Pies (P):</strong> Pies gończy. Daje bonus w zadaniach U1 i chroni majątek.<br>\n        <strong>Sokół (S):</strong> Ptak łowczy. Zapewnia manewr Sokolej nawigacji (±1 pole).<br>\n        <strong>Zestaw K+P+S:</strong> Komplet 3 zwierząt o tym samym numerze sady daje +1 💖 i stałą premię hodowlaną.<br>\n        <strong>Bydło, Owce, Świnie:</strong> Inwentarz gospodarczy podnoszący dochody u Poborcy podatków.\n    </div>\n</div>"
        },
        {
                "id": "estates_domain",
                "title": "🏰 Porządek feudalny i posiadłości",
                "content": "<div class=\"glossary-category-card\" style=\"background:rgba(18,14,10,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;\">\n    <div style=\"font-weight:bold; color:var(--gold-light); margin-bottom:0.3rem;\">Struktura dóbr ziemskich</div>\n    <div style=\"font-size:0.8rem; line-height:1.5; color:#cbd5e1;\">\n        <strong>Wioska (1–3★):</strong> Podstawa majątku. Generuje stały czynsz i podatki.<br>\n        <strong>Miasto królewskie:</strong> Ośrodek handlu i rzemiosła przynoszący wysoki dochód podatkowy (1 200 zł.).<br>\n        <strong>Zamek obronny:</strong> Dumna forteca dająca stałe +1 do cnoty Charyzmy i 2 500 zł. podatku.<br>\n        <strong>Poborca podatków (PP):</strong> Wypłaca podatki ze wszystkich posiadłości w królestwie.\n    </div>\n</div>"
        },
        {
                "id": "card_decks",
                "title": "📜 Karty Szansy i Zwoje w torbie",
                "content": "<div class=\"glossary-category-card\" style=\"background:rgba(18,14,10,0.85); border:1px solid rgba(212,175,55,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:0.5rem;\">\n    <div style=\"font-weight:bold; color:var(--gold-light); margin-bottom:0.3rem;\">Losy &amp; Magiczne pergaminy</div>\n    <div style=\"font-size:0.8rem; line-height:1.5; color:#cbd5e1;\">\n        <strong>Karty Szansy:</strong> Wydarzenia losowe (pozytywne dary losu, królewskie dekrety, zdrady zbójców).<br>\n        <strong>Torba na zwoje:</strong> Przechowuje do 3 zwojów do wykorzystania w dowolnej turze przed rzutem kostką.<br>\n        <strong>Zwoje taktyczne:</strong> Zwiększają rzut, gwarantują określony wynik kości, chronią przed mytem lub podwajają zyski.\n    </div>\n</div>"
        }
]
    };
})(typeof window !== 'undefined' ? window : global);
