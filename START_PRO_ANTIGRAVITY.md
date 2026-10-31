# Startovní prompt pro Google Antigravity

Pracujeme na aplikaci pro český a vícejazyčný přepis audia a videa a lokální AI shrnutí. Přiložený dokument `ZADANI_ANTIGRAVITY_PREPIS_A_B.md` je hlavní technické zadání; přečti jej celý, zejména sekce o variantách A/B, hostingu ASPone, bezpečnosti, datovém kontraktu a etapách realizace.

**Nyní implementuj pouze Etapu 0 a Etapu 1.** Vytvoř kostru repozitáře a reprodukovatelný Python CLI prototyp Faster-Whisper pro Windows 11. Nejprve CPU `int8` s českým vícejazyčným modelem `small`, poté ověř GPU na NVIDIA RTX 4050 (6 GB VRAM); při neúspěchu GPU zachovej funkční CPU cestu. Zajisti vstup WAV/MP3 a MP4 dle reálné podpory dekodéru, JSON dle návrhu, UTF-8 TXT, SRT a VTT, časové značky, testy exportu a jasné logy. Vytvoř `README.md` s přesnými PowerShell příkazy, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` a `docs/BENCHMARKS.md`.

Postupuj iterativně. Každou část skutečně spusť a otestuj, nezaměňuj mock za dokončenou implementaci. Modely, přihlašovací údaje, osobní audio a tajemství nesmějí být commitované. Nevytvářej zatím ASPone backend, databázovou migraci, browser AI, žádnou placenou AI integraci ani shrnování. Nevyžaduj od uživatele hesla k hostingu. Před přechodem na Etapu 2 shrň, co funguje, co nebylo možné ověřit a jaké konkrétní testy byly provedeny.
