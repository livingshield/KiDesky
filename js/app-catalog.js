// ============================================================================
// KiDesky: PRINCEZNINO SRDCE - Encyklopedie, Bestiář, Galerie hradů a Balancovací studio
// ============================================================================

(function () {
    if (!window.PRS_App) window.PRS_App = {};

    Object.assign(window.PRS_App, {
// --- PRAVIDLA, ENCYKLOPEDIE, BESTIÁŘ, HRADY A TROFEJE ---
    switchRulesSubtab: function (subtabId) {
        this.rulesSubtab = subtabId;
        var subtabs = ["rules", "dragons", "castles", "trophies", "decorations"];
        for (var i = 0; i < subtabs.length; i++) {
            var s = subtabs[i];
            var el = document.getElementById("rules-subtab-" + s);
            var btn = document.getElementById("rules-subtab-btn-" + s);
            if (el) el.style.display = (s === subtabId) ? "block" : "none";
            if (btn) {
                if (s === subtabId) btn.classList.add("active");
                else btn.classList.remove("active");
            }
        }
        if (subtabId === "dragons") this.renderBestiary();
        else if (subtabId === "castles") this.renderCastlesGallery();
        else if (subtabId === "trophies") this.renderTrophiesHall();
        else if (subtabId === "decorations") this.renderDecorationsGallery();
    },

    renderRulesAndCatalog: function () {
        // 1. Základní katalog výbavy (pouze běžné předměty, trofeje mají vlastní Síň)
        var itemsBox = document.getElementById("catalog-items-table");
        if (itemsBox) {
            var rows = "";
            var basicItems = (window.PRS_ITEMS || []).filter(function (it) { return it.slot !== "trophy"; });
            for (var i = 0; i < basicItems.length; i++) {
                var it = basicItems[i];
                rows += "<tr>" +
                    "<td><span class='tier-badge tier-" + it.tier + "'>Věci " + it.tier + "</span></td>" +
                    "<td>" + it.icon + " <strong>" + this.escapeHtml(it.name) + "</strong></td>" +
                    "<td>" + (it.boj ? (it.boj > 0 ? "+" + it.boj : it.boj) : "—") + "</td>" +
                    "<td>" + (it.jizda ? (it.jizda > 0 ? "+" + it.jizda : it.jizda) : "—") + "</td>" +
                    "<td>" + (it.tanec ? (it.tanec > 0 ? "+" + it.tanec : it.tanec) : "—") + "</td>" +
                    "<td>" + (it.charisma ? (it.charisma > 0 ? "+" + it.charisma : it.charisma) : "—") + "</td>" +
                    "<td><strong>" + it.price.toLocaleString("cs-CZ") + " zl.</strong></td>" +
                    "</tr>";
            }
            itemsBox.innerHTML = rows;
        }

        // 2. Bestiář, hrady a trofeje
        this.renderBestiary();
        this.renderCastlesGallery();
        this.renderTrophiesHall();
        this.renderDecorationsGallery();
    },

    // --- DRAČÍ BESTIÁŘ (20 DRAKŮ) ---
    setBestiaryTier: function (tier) {
        this.bestiaryActiveTier = tier;
        var btns = document.querySelectorAll(".bestiary-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-tier") === tier) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderBestiary();
    },

    renderBestiary: function () {
        var container = document.getElementById("bestiary-grid-container");
        if (!container || !window.PRS_QUESTS) return;

        var tierFilter = this.bestiaryActiveTier || "all";
        var listToFilter = [];

        if (tierFilter === "u1") {
            listToFilter = window.PRS_QUESTS.U1 || [];
        } else if (tierFilter === "u2") {
            var fullU2 = window.PRS_QUESTS.U2 || [];
            listToFilter = fullU2.slice(0, 16);
        } else if (tierFilter === "u2_epic") {
            var fullU2b = window.PRS_QUESTS.U2 || [];
            listToFilter = fullU2b.slice(16);
        } else {
            listToFilter = window.PRS_QUESTS.U3 || [];
        }

        var filtered = listToFilter.filter(function (d) {
            if (tierFilter === "all" || tierFilter === "u1" || tierFilter === "u2" || tierFilter === "u2_epic") return true;
            return d.tierGroup === tierFilter;
        });

        var wMap = {
            dogs: "Lovečtí psi odlákají pozornost (+2 k síle se psy v chovu nebo taktikou smečky)",
            falcon: "Sokol útočí na zranitelná místa (+2 k síle se sokolem v chovu)",
            animals: "Pes i sokol matou draka v boji (+2 k síle při vlastnictví psa a sokola)",
            horse: "Útok z plné jízdy na koni (+2 k síle s koněm v chovu nebo taktikou nájezdu)",
            dance: "Hravého draka lze okouzlit tancem (+2 k síle s Tancem ≥ 2 nebo slavnostním šatem)",
            elixir: "Hojivý lektvar neutralizuje dech (+2 k síle s lektvarem / taktikou pojistky)",
            water_armor: "Vodní perla či pevná zbroj tlumí žár (+2 k síle se zbrojí či vodní relikvií)",
            ice: "Mrazivé zbraně oslabují sopečného draka (+2 k síle s mrazivou zbraní / relikvií)",
            fire: "Oheň taví led a krystaly (+2 k síle s ohnivou zbraní / relikvií / tématem)",
            armor: "Pevná rytířská zbroj svádí blesky (+2 k síle s nasazenou zbrojí)",
            light: "Posvěcené relikvie rozhánějí temnotu (+2 k síle se světelnou relikvií / klenotem)",
            charisma: "Vznešené charisma draka uchlácholí (+2 k síle s Charismatem ≥ 3 nebo klenotem)",
            holy: "Svaté relikvie zaženou nemrtvého (+2 k síle s posvátnou relikvií)",
            courage: "Pevná vůle a odvaha pronikne mlhou (+2 k síle s Bojem ≥ 3 či Jízdou ≥ 3)",
            mastery: "Zkouška všech 4 ctností (+2 k síle při všech ctnostech ≥ 2)",
            animals_and_spear: "Koordinace koně, zvířat a kopí (+2 k síle s koněm, zvířaty a kopím)"
        };

        var html = [];
        for (var i = 0; i < filtered.length; i++) {
            var d = filtered[i];
            var tierTitle = (d.id && d.id.indexOf("u1_") === 0) ? "Tier U1 (Lesní zvěř)" :
                            (d.id && d.id.indexOf("u2_") === 0 && d.difficulty >= 12 ? "Tier U2+ (Mýtický titán)" :
                            (d.id && d.id.indexOf("u2_") === 0 ? "Tier U2 (Bájné monstrum)" :
                            (d.tierGroup === "young" ? "Tier A (Mladý drak)" :
                            (d.tierGroup === "elemental" ? "Tier B (Živlový drak)" : "Tier C (Legendární Boss)"))));
            var tierColor = (d.id && d.id.indexOf("u1_") === 0) ? "#10b981" :
                            (d.id && d.id.indexOf("u2_") === 0 && d.difficulty >= 12 ? "#ec4899" :
                            (d.id && d.id.indexOf("u2_") === 0 ? "#f59e0b" :
                            (d.tierGroup === "young" ? "#60a5fa" :
                            (d.tierGroup === "elemental" ? "#a855f7" : "#e11d48"))));
            var trophyDef = d.trophyId && window.PRS_TROPHIES ? window.PRS_TROPHIES[d.trophyId] : null;

            html.push('<div class="bestiary-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + d.img + '\', \'' + this.escapeHtml(d.name) + '\', \'' + this.escapeHtml(d.desc) + '\')" title="Klikni pro zvětšení ilustrace">');
            html.push('    <img src="' + d.img + '" alt="' + this.escapeHtml(d.name) + '" class="card-media-img" loading="lazy" onerror="this.onerror=null; this.src=\'assets/landmarks/dragon.png\';" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + tierColor + '; color:' + tierColor + ';">' + tierTitle + '</span>');
            html.push('    <span class="card-media-badge-right">⚔️ Obtížnost ' + d.difficulty + '</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + d.icon + ' ' + this.escapeHtml(d.name) + '</div>');
            html.push('    <div style="font-size:0.84rem; color:var(--gold-light); margin-bottom:0.4rem; font-weight:bold;">');
            html.push('      💰 Odměna: +' + d.gold.toLocaleString("cs-CZ") + ' zl. &nbsp;|&nbsp; 💖 +' + d.hearts + ' Srdcí');
            html.push('    </div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(d.desc) + '</div>');

            if (d.weakness && wMap[d.weakness]) {
                html.push('    <div class="card-callout-box" style="border-color:rgba(253,224,71,0.35); color:#fef08a; background:rgba(212,175,55,0.12); font-size:0.8rem;">');
                html.push('      🎯 <strong>Využitelná slabina (+2 k síle):</strong> ' + wMap[d.weakness]);
                html.push('    </div>');
            }

            if (trophyDef) {
                var statsBonus = [];
                if (trophyDef.boj) statsBonus.push("⚔️+" + trophyDef.boj);
                if (trophyDef.jizda) statsBonus.push("🏇+" + trophyDef.jizda);
                if (trophyDef.tanec) statsBonus.push("💃+" + trophyDef.tanec);
                if (trophyDef.charisma) statsBonus.push("✨+" + trophyDef.charisma);
                html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.4); color:var(--gold-light); margin-top:4px;">');
                html.push('      🏆 <strong>Trofej po porážce:</strong> ' + trophyDef.icon + ' ' + this.escapeHtml(trophyDef.name) + ' (' + statsBonus.join(" ") + ')');
                html.push('    </div>');
            }

            if (d.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + d.img + '\', \'' + d.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; margin-top:0.4rem; width:100%; cursor:pointer;">🔄 Otočit směr pohledu draka</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- GALERIE HRADŮ (10 TEMATICKÝCH ZÁMKŮ) ---
    renderCastlesGallery: function () {
        var container = document.getElementById("castles-grid-container");
        if (!container || !window.PRS_CASTLES) return;

        var castles = window.PRS_CASTLES;
        var elemColors = {
            light: "#fbbf24",
            fire: "#f87171",
            water: "#38bdf8",
            earth: "#4ade80",
            air: "#cbd5e1",
            ice: "#93c5fd",
            crystal: "#c084fc",
            dark: "#a855f7"
        };

        var html = [];
        for (var k in castles) {
            if (!castles.hasOwnProperty(k)) continue;
            var c = castles[k];
            var col = elemColors[c.element] || "var(--gold-light)";

            html.push('<div class="castle-card">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + c.img + '\', \'' + this.escapeHtml(c.name) + '\', \'' + this.escapeHtml(c.desc) + '\')" title="Klikni pro zvětšení ilustrace">');
            html.push('    <img src="' + c.img + '" alt="' + this.escapeHtml(c.name) + '" class="card-media-img" loading="lazy" />');
            html.push('    <span class="card-media-badge-left" style="border-color:' + col + '; color:' + col + ';">Živel: ' + (c.element ? c.element.toUpperCase() : 'KRÁLOVSKÝ') + '</span>');
            html.push('    <span class="card-media-badge-right" style="border-color:var(--gold); color:var(--gold-light);">Cena: 8 000 zl.</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body">');
            html.push('    <div class="card-media-title">' + c.icon + ' ' + this.escapeHtml(c.name) + '</div>');
            html.push('    <div class="card-media-desc">' + this.escapeHtml(c.desc) + '</div>');
            html.push('    <div class="card-callout-box" style="border-color:rgba(212,175,55,0.3); color:#fef08a;">');
            html.push('      🏰 <strong>Výhoda panství:</strong> Výnos daní +2 500 zl., nájem 1 500 zl., trvale +1 Charisma a audience u princezny.');
            html.push('    </div>');
            if (c.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + c.img + '\', \'' + c.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; margin-top:0.4rem; width:100%; cursor:pointer;">🔄 Otočit pohled na hrad</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- SÍŇ TROFEJÍ A RELIKVIÍ (29 TROFEJÍ) ---
    setTrophiesCategory: function (cat) {
        this.trophiesActiveCategory = cat;
        var btns = document.querySelectorAll(".trophy-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-cat") === cat) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderTrophiesHall();
    },

    renderTrophiesHall: function () {
        var container = document.getElementById("trophies-grid-container");
        if (!container || !window.PRS_TROPHIES) return;

        var trophies = window.PRS_TROPHIES;
        var filter = this.trophiesActiveCategory || "all";

        var list = [];
        for (var k in trophies) {
            if (!trophies.hasOwnProperty(k)) continue;
            var t = trophies[k];
            if (filter === "beasts" && t.source.indexOf("U1") === -1) continue;
            if (filter === "monsters" && t.source.indexOf("U2") === -1 && t.source.indexOf("Náhoda") === -1) continue;
            if (filter === "dragons" && t.source.indexOf("U3") === -1) continue;
            list.push(t);
        }

        var html = [];
        for (var i = 0; i < list.length; i++) {
            var tr = list[i];
            var tierClass = "tier-" + (tr.tier || 1);
            var statChips = [];
            if (tr.boj) statChips.push('<span class="armory-stat-chip ' + (tr.boj > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">⚔️ ' + (tr.boj > 0 ? '+' : '') + tr.boj + ' Boj</span>');
            if (tr.jizda) statChips.push('<span class="armory-stat-chip ' + (tr.jizda > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">🏇 ' + (tr.jizda > 0 ? '+' : '') + tr.jizda + ' Jízda</span>');
            if (tr.tanec) statChips.push('<span class="armory-stat-chip ' + (tr.tanec > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">💃 ' + (tr.tanec > 0 ? '+' : '') + tr.tanec + ' Tanec</span>');
            if (tr.charisma) statChips.push('<span class="armory-stat-chip ' + (tr.charisma > 0 ? 'armory-stat-pos' : 'armory-stat-neg') + '">✨ ' + (tr.charisma > 0 ? '+' : '') + tr.charisma + ' Charisma</span>');

            html.push('<div class="trophy-item-card ' + tierClass + '">');
            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">');
            html.push('    <span class="armory-badge-tier" style="background:rgba(212,175,55,0.18); color:var(--gold-light); font-size:0.75rem;">' + (tr.tier || 1) + '. stupeň</span>');
            html.push('    <span style="font-size:0.75rem; color:#9ca3af; font-style:italic;">' + this.escapeHtml(tr.source || 'Boj') + '</span>');
            html.push('  </div>');

            html.push('  <div style="font-weight:bold; font-size:0.95rem; color:#f8fafc; margin-bottom:0.35rem;">' + tr.icon + ' ' + this.escapeHtml(tr.name) + '</div>');
            html.push('  <div style="font-size:0.8rem; color:#d1d5db; line-height:1.35; margin-bottom:0.6rem; flex:1;">' + this.escapeHtml(tr.desc) + '</div>');

            html.push('  <div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.6rem;">' + statChips.join("") + '</div>');

            html.push('  <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.4rem; font-size:0.82rem;">');
            html.push('    <span style="color:var(--text-muted);">Slot: <strong>🏆 Trofej</strong></span>');
            html.push('    <span style="color:var(--gold-light); font-weight:bold;">' + tr.price.toLocaleString("cs-CZ") + ' zl.</span>');
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- ATLAS DEKORACÍ A KRAJINY (34+ PRVKŮ) ---
    setDecorationsCategory: function (cat) {
        this.decorationsActiveCategory = cat;
        var btns = document.querySelectorAll(".decor-filter-btn");
        btns.forEach(function (b) {
            if (b.getAttribute("data-cat") === cat) b.classList.add("active");
            else b.classList.remove("active");
        });
        this.renderDecorationsGallery();
    },

    renderDecorationsGallery: function () {
        var container = document.getElementById("decorations-grid-container");
        if (!container || !window.PRS_DECOR_CATALOG) return;

        var catalog = window.PRS_DECOR_CATALOG;
        var filter = this.decorationsActiveCategory || "all";

        var categoryLabels = {
            vegetation: "Lesy & Vegetace",
            terrain: "Skály & Hory",
            agriculture: "Zemědělství",
            settlement: "Sídla & Stavby",
            civilization: "Opevnění & Stráže",
            water: "Voda & Močály",
            magic: "Magie & Ruiny",
            quest_lair: "Doupata & Sluje"
        };

        var categoryColors = {
            vegetation: "#4ade80",
            terrain: "#a8a29e",
            agriculture: "#facc15",
            settlement: "#fb923c",
            civilization: "#94a3b8",
            water: "#38bdf8",
            magic: "#c084fc",
            quest_lair: "#f87171"
        };

        var html = [];
        for (var k in catalog) {
            if (!catalog.hasOwnProperty(k)) continue;
            var d = catalog[k];
            var cat = d.category || "vegetation";

            // Filtrování
            if (filter !== "all") {
                if (filter === "vegetation" && cat !== "vegetation") continue;
                if (filter === "settlement" && cat !== "settlement" && cat !== "agriculture" && cat !== "civilization") continue;
                if (filter === "water" && cat !== "water") continue;
                if (filter === "magic" && cat !== "magic") continue;
                if (filter === "quest_lair" && cat !== "quest_lair" && cat !== "terrain") continue;
            }

            var col = categoryColors[cat] || "var(--gold-light)";
            var catName = categoryLabels[cat] || cat.toUpperCase();
            var icon = d.icon || "🌲";
            var desc = d.desc || "Malebný prvek oživující herní plochu království.";

            html.push('<div class="decor-card" style="background:var(--card-bg, #1a1625); border:1px solid rgba(212,175,55,0.25); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 4px 14px rgba(0,0,0,0.4);">');
            html.push('  <div class="card-media-header" onclick="PRS_App.openImageModal(\'' + d.img + '\', \'' + this.escapeHtml(d.name) + '\', \'' + this.escapeHtml(desc) + '\')" title="Klikni pro zvětšení ilustrace" style="position:relative; background:radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.5) 100%); padding:1rem 0.5rem; display:flex; justify-content:center; align-items:center; min-height:160px; cursor:pointer;">');
            html.push('    <img src="' + d.img + '" alt="' + this.escapeHtml(d.name) + '" class="card-media-img" loading="lazy" style="max-height:130px; max-width:85%; object-fit:contain; filter:drop-shadow(0 6px 10px rgba(0,0,0,0.6)); transition:transform 0.2s;" />');
            html.push('    <span class="card-media-badge-left" style="position:absolute; top:8px; left:8px; font-size:0.7rem; font-weight:bold; border:1px solid ' + col + '; color:' + col + '; background:rgba(0,0,0,0.75); padding:2px 6px; border-radius:4px;">' + catName + '</span>');
            html.push('    <span class="card-media-badge-right" style="position:absolute; top:8px; right:8px; font-size:0.7rem; font-weight:bold; border:1px solid rgba(255,255,255,0.2); color:#cbd5e1; background:rgba(0,0,0,0.75); padding:2px 6px; border-radius:4px;">📐 ' + d.w + '×' + d.h + ' px</span>');
            html.push('  </div>');

            html.push('  <div class="card-media-body" style="padding:0.75rem; display:flex; flex-direction:column; flex:1;">');
            html.push('    <div class="card-media-title" style="font-family:\'Cinzel\',serif; font-size:0.95rem; font-weight:bold; color:var(--gold-light, #fef08a); margin-bottom:0.35rem;">' + icon + ' ' + this.escapeHtml(d.name) + '</div>');
            html.push('    <div class="card-media-desc" style="font-size:0.8rem; color:#94a3b8; line-height:1.35; flex:1; margin-bottom:0.5rem;">' + this.escapeHtml(desc) + '</div>');
            html.push('    <div style="font-size:0.72rem; color:#64748b; margin-bottom:0.4rem;">🏷️ Bezpečná zóna (Clearance): <strong>' + (d.clearance || 35) + ' px</strong></div>');

            if (d.imgFlip) {
                html.push('    <button class="rules-subnav-btn" onclick="event.stopPropagation(); PRS_App.toggleCardFlip(this, \'' + d.img + '\', \'' + d.imgFlip + '\')" style="font-size:0.75rem; padding:4px 8px; width:100%; cursor:pointer;">🔄 Otočit zrcadlení</button>');
            }
            html.push('  </div>');
            html.push('</div>');
        }
        container.innerHTML = html.join("");
    },

    // --- INTERAKTIVNÍ ZRCADLENÍ ILUSTRACÍ V KARTÁCH (LÍC / RUB) ---
    toggleCardFlip: function (btn, normalSrc, flipSrc) {
        var card = btn.closest(".bestiary-card, .castle-card, .decor-card");
        if (!card) return;
        var img = card.querySelector(".card-media-img");
        if (!img) return;
        if (img.getAttribute("data-is-flipped") === "true") {
            img.src = normalSrc;
            img.setAttribute("data-is-flipped", "false");
            btn.textContent = "🔄 Otočit zrcadlení";
        } else {
            img.src = flipSrc || normalSrc;
            img.setAttribute("data-is-flipped", "true");
            btn.textContent = "↩️ Původní směr";
        }
    },

    // --- UNIVERZÁLNÍ LIGHTBOX PRO OBRÁZKY (DRAKY, ZÁMKY, NÁKRESY) ---
    openImageModal: function (imgSrc, title, desc) {
        var m = document.getElementById("image-lightbox-modal");
        var img = document.getElementById("image-lightbox-img");
        var tEl = document.getElementById("image-lightbox-title");
        var cEl = document.getElementById("image-lightbox-caption");
        if (m && img) {
            img.src = imgSrc || "";
            if (tEl) tEl.textContent = title || "Královská ilustrace";
            if (cEl) cEl.textContent = desc || "";
            m.style.display = "flex";
        }
    },

    closeImageModal: function () {
        var m = document.getElementById("image-lightbox-modal");
        if (m) { m.style.display = "none"; this.updateBodyModalClass(); }
    },

    openSketchModal: function (imgSrc, caption) {
        this.openImageModal(imgSrc, "Archivní ruční nákres z roku 2016", caption);
    },

    closeSketchModal: function () {
        this.closeImageModal();
    },

    // --- BALANCOVACÍ STUDIO & SIMULÁTOR EKONOMIKY ---
    renderBalanceStudioInputs: function () {
        var c = this.activeConfig;
        this.setInputValue("cfg-targetHearts", c.targetHearts);
        this.setInputValue("cfg-startGold", c.startGold);
        this.setInputValue("cfg-passStartGold", c.passStartGold);
        this.setInputValue("cfg-sokol", c.animalBasePrices.sokol);
        this.setInputValue("cfg-pes", c.animalBasePrices.pes);
        this.setInputValue("cfg-kun", c.animalBasePrices.kun);
        this.setInputValue("cfg-villagePrice", c.estates.villagePrices[0]);
        this.setInputValue("cfg-townPrice", c.estates.townPrice);
        this.setInputValue("cfg-castlePrice", c.estates.castlePrice);
        this.setInputValue("cfg-pack1", c.itemPackPrices.tier1);
        this.setInputValue("cfg-pack2", c.itemPackPrices.tier2);
        this.setInputValue("cfg-pack3", c.itemPackPrices.tier3);
        this.setInputValue("cfg-u1Diff", c.quests ? (c.quests.u1BaseDiff || 5) : 5);
        this.setInputValue("cfg-u2Diff", c.quests ? (c.quests.u2BaseDiff || 9) : 9);
        this.setInputValue("cfg-u3Diff", c.quests ? (c.quests.u3BaseDiff || 13) : 13);
    },

    setInputValue: function (id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    },

    readBalanceStudioInputs: function () {
        var c = window.PRS_GameEngine.deepClone(this.activeConfig);
        c.targetHearts = Number(document.getElementById("cfg-targetHearts").value) || 30;
        c.startGold = Number(document.getElementById("cfg-startGold").value) || 10000;
        c.passStartGold = Number(document.getElementById("cfg-passStartGold").value) || 3000;
        c.animalBasePrices.sokol = Number(document.getElementById("cfg-sokol").value) || 400;
        c.animalBasePrices.pes = Number(document.getElementById("cfg-pes").value) || 500;
        c.animalBasePrices.kun = Number(document.getElementById("cfg-kun").value) || 600;
        c.estates.villagePrices[0] = Number(document.getElementById("cfg-villagePrice").value) || 2000;
        c.estates.townPrice = Number(document.getElementById("cfg-townPrice").value) || 4500;
        c.estates.castlePrice = Number(document.getElementById("cfg-castlePrice").value) || 8000;
        c.itemPackPrices.tier1 = Number(document.getElementById("cfg-pack1").value) || 2500;
        c.itemPackPrices.tier2 = Number(document.getElementById("cfg-pack2").value) || 7000;
        c.itemPackPrices.tier3 = Number(document.getElementById("cfg-pack3").value) || 12000;
        if (!c.quests) c.quests = {};
        c.quests.u1BaseDiff = Number(document.getElementById("cfg-u1Diff").value) || 5;
        c.quests.u2BaseDiff = Number(document.getElementById("cfg-u2Diff").value) || 9;
        c.quests.u3BaseDiff = Number(document.getElementById("cfg-u3Diff").value) || 13;
        this.activeConfig = c;
        return c;
    },

    runEconomySimulation: function (numGames) {
        var cfg = this.readBalanceStudioInputs();
        var simBoardSel = document.getElementById("sim-board-select");
        var bCode = simBoardSel ? simBoardSel.value : "classic_96";

        var result = window.PRS_GameEngine.simulateGames(numGames || 30, cfg, bCode);
        var outBox = document.getElementById("sim-results-box");
        if (!outBox) return;

        var hb = result.avgWinnerHeartsBreakdown;
        outBox.innerHTML =
            '<div class="sim-metrics-grid">' +
            '  <div class="sim-metric-card">' +
            '    <span>⏱️ Odhad stolní herní doby (4 hráči)</span>' +
            '    <strong>' + result.estTabletopHoursText + '</strong>' +
            '    <small>(' + result.estTabletopMinutes + ' minut u stolu s kostkami)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🔄 Průměrný počet kol do ' + result.targetHearts + ' 💖</span>' +
            '    <strong>' + result.avgRounds + ' kol</strong>' +
            '    <small>(celkem ' + result.avgTurns + ' jednotlivých tahů)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>💰 Průměrná hotovost vítěze</span>' +
            '    <strong>' + result.avgWinnerGold.toLocaleString("cs-CZ") + ' zl.</strong>' +
            '    <small>Testováno na ' + result.gamesSimulated + ' partiích</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>💖 Odkud plynou vítězná Srdce</span>' +
            '    <strong>Slavnosti: ' + hb.festivals + ' | Úkoly: ' + hb.quests + '</strong>' +
            '    <small>Chov zvířat: ' + hb.breeding + ' 💖 | Náhoda: ' + hb.chance + ' 💖</small>' +
            '  </div>' +
            '</div>';

        fetch("api.ashx?action=log-telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventType: "SimulationRun",
                turnNumber: Math.round(result.avgRounds),
                message: "Simulace " + result.gamesSimulated + " her (" + result.estTabletopHoursText + ")",
                payloadJson: JSON.stringify(result)
            })
        }).catch(function () { });
    },

    saveConfigToServer: function () {
        var cfg = this.readBalanceStudioInputs();
        var msgEl = document.getElementById("save-config-feedback");
        if (msgEl) msgEl.textContent = "Ukládám konfiguraci do databáze [prs].[prs_GameConfigs]...";

        fetch("api.ashx?action=save-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                versionName: "v1.1-upraveny-balanc",
                targetHearts: cfg.targetHearts,
                startGold: cfg.startGold,
                passStartGold: cfg.passStartGold,
                configJson: JSON.stringify(cfg),
                notes: "Uloženo z Balancovacího studia"
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (msgEl) {
                    msgEl.textContent = (res && res.ok)
                        ? "✅ Konfigurace úspěšně uložena do databáze a aktivována pro nové hry!"
                        : "✅ Konfigurace aktivována pro tuto relaci.";
                }
            })
            .catch(function () {
                if (msgEl) msgEl.textContent = "✅ Konfigurace aktivována lokálně.";
            });
    }
    });
})();
