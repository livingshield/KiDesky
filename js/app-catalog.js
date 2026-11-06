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

    // --- BALANCOVACÍ STUDIO & SIMULÁTOR NOVÉ EKONOMIKY (V ADMINISTRACI) ---
    renderBalanceStudioInputs: function () {
        var c = this.activeConfig || window.PRS_DEFAULT_CONFIG;
        if (!c.estates) c.estates = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.estates);
        if (!c.livestock) c.livestock = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.livestock || {});
        if (!c.animalBasePrices) c.animalBasePrices = { sokol: 400, pes: 500, kun: 600 };
        if (!c.animalRentRatios) c.animalRentRatios = { single: 0.20, pair: 0.40, fullSet: 0.80 };
        if (!c.itemPackPrices) c.itemPackPrices = { tier1: 2500, tier2: 7000, tier3: 12000 };
        if (!c.quests) c.quests = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.quests);

        // 1. Makroekonomika
        this.setInputValue("cfg-targetHearts", c.targetHearts || 30);
        this.setInputValue("cfg-startGold", c.startGold || 10000);
        this.setInputValue("cfg-passStartGold", c.passStartGold || 3000);
        this.setInputValue("cfg-passStartGoldLandless", c.passStartGoldLandless || 5000);
        this.setInputValue("cfg-landlessPenalty", (c.estates && c.estates.landlessTaxPenalty !== undefined) ? c.estates.landlessTaxPenalty : 500);

        // 2. Panství (Vesnice, Města, Hrady)
        var vp = c.estates.villagePrices || [2000, 1500, 1500];
        var vt = c.estates.villageTaxYield || [500, 900, 1400];
        var vr = c.estates.villageRent || [300, 500, 800];
        this.setInputValue("cfg-villagePrice", vp[0] || 2000);
        this.setInputValue("cfg-villageUpgPrice", vp[1] || 1500);
        this.setInputValue("cfg-villageTax1", vt[0] || 500);
        this.setInputValue("cfg-villageTax2", vt[1] || 900);
        this.setInputValue("cfg-villageTax3", vt[2] || 1400);
        this.setInputValue("cfg-villageRent1", vr[0] || 300);
        this.setInputValue("cfg-villageRent2", vr[1] || 500);
        this.setInputValue("cfg-villageRent3", vr[2] || 800);
        this.setInputValue("cfg-townPrice", c.estates.townPrice || 4500);
        this.setInputValue("cfg-townTax", c.estates.townTaxYield || 1200);
        this.setInputValue("cfg-townRent", c.estates.townRent || 700);
        this.setInputValue("cfg-castlePrice", c.estates.castlePrice || 8000);
        this.setInputValue("cfg-castleTax", c.estates.castleTaxYield || 2500);
        this.setInputValue("cfg-castleRent", c.estates.castleRent || 1500);

        // 3. Dobytčí trh & Pastviny
        var ls = c.livestock || {};
        this.setInputValue("cfg-sheepPrice", ls.sheepPrice !== undefined ? ls.sheepPrice : 500);
        this.setInputValue("cfg-sheepTax", ls.sheepTax !== undefined ? ls.sheepTax : 120);
        this.setInputValue("cfg-sheepRent", ls.sheepRent !== undefined ? ls.sheepRent : 50);
        this.setInputValue("cfg-pigsPrice", ls.pigsPrice !== undefined ? ls.pigsPrice : 600);
        this.setInputValue("cfg-pigsTax", ls.pigsTax !== undefined ? ls.pigsTax : 150);
        this.setInputValue("cfg-pigsRent", ls.pigsRent !== undefined ? ls.pigsRent : 75);
        this.setInputValue("cfg-cattlePrice", ls.cattlePrice !== undefined ? ls.cattlePrice : 800);
        this.setInputValue("cfg-cattleTax", ls.cattleTax !== undefined ? ls.cattleTax : 200);
        this.setInputValue("cfg-cattleRent", ls.cattleRent !== undefined ? ls.cattleRent : 100);
        this.setInputValue("cfg-capVillage", ls.capacityPerVillage !== undefined ? ls.capacityPerVillage : 3);
        this.setInputValue("cfg-capTown", ls.capacityPerTown !== undefined ? ls.capacityPerTown : 2);
        this.setInputValue("cfg-capStaje", ls.capacityPerStaje !== undefined ? ls.capacityPerStaje : 4);

        // 4. Ušlechtilá zvířata, Zbrojnice & Výpravy
        this.setInputValue("cfg-sokol", c.animalBasePrices.sokol || 400);
        this.setInputValue("cfg-pes", c.animalBasePrices.pes || 500);
        this.setInputValue("cfg-kun", c.animalBasePrices.kun || 600);
        this.setInputValue("cfg-rentSingle", Math.round((c.animalRentRatios.single || 0.20) * 100));
        this.setInputValue("cfg-rentPair", Math.round((c.animalRentRatios.pair || 0.40) * 100));
        this.setInputValue("cfg-rentSet", Math.round((c.animalRentRatios.fullSet || 0.80) * 100));
        this.setInputValue("cfg-pack1", c.itemPackPrices.tier1 || 2500);
        this.setInputValue("cfg-pack2", c.itemPackPrices.tier2 || 7000);
        this.setInputValue("cfg-pack3", c.itemPackPrices.tier3 || 12000);
        this.setInputValue("cfg-u1Diff", c.quests.u1BaseDiff || 5);
        this.setInputValue("cfg-u1Gold", c.quests.u1GoldReward || 1500);
        this.setInputValue("cfg-u2Diff", c.quests.u2BaseDiff || 9);
        this.setInputValue("cfg-u2Gold", c.quests.u2GoldReward || 3500);
        this.setInputValue("cfg-u2Hearts", c.quests.u2HeartReward !== undefined ? c.quests.u2HeartReward : 1.0);
        this.setInputValue("cfg-u3Diff", c.quests.u3BaseDiff || 13);
        this.setInputValue("cfg-u3Gold", c.quests.u3GoldReward || 8000);
        this.setInputValue("cfg-u3Hearts", c.quests.u3HeartReward !== undefined ? c.quests.u3HeartReward : 3.0);
    },

    setInputValue: function (id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    },

    getInputNum: function (id, fallback) {
        var el = document.getElementById(id);
        if (!el || el.value === "") return fallback;
        var n = Number(el.value);
        return isNaN(n) ? fallback : n;
    },

    readBalanceStudioInputs: function () {
        var c = window.PRS_GameEngine.deepClone(this.activeConfig || window.PRS_DEFAULT_CONFIG);
        if (!c.estates) c.estates = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.estates);
        if (!c.livestock) c.livestock = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG.livestock || {});
        if (!c.animalBasePrices) c.animalBasePrices = {};
        if (!c.animalRentRatios) c.animalRentRatios = {};
        if (!c.itemPackPrices) c.itemPackPrices = {};
        if (!c.quests) c.quests = {};

        c.targetHearts = this.getInputNum("cfg-targetHearts", 30);
        c.startGold = this.getInputNum("cfg-startGold", 10000);
        c.passStartGold = this.getInputNum("cfg-passStartGold", 3000);
        c.passStartGoldLandless = this.getInputNum("cfg-passStartGoldLandless", 5000);
        c.estates.landlessTaxPenalty = this.getInputNum("cfg-landlessPenalty", 500);

        var upgPrice = this.getInputNum("cfg-villageUpgPrice", 1500);
        c.estates.villagePrices = [
            this.getInputNum("cfg-villagePrice", 2000),
            upgPrice,
            upgPrice
        ];
        c.estates.villageTaxYield = [
            this.getInputNum("cfg-villageTax1", 500),
            this.getInputNum("cfg-villageTax2", 900),
            this.getInputNum("cfg-villageTax3", 1400)
        ];
        c.estates.villageRent = [
            this.getInputNum("cfg-villageRent1", 300),
            this.getInputNum("cfg-villageRent2", 500),
            this.getInputNum("cfg-villageRent3", 800)
        ];
        c.estates.townPrice = this.getInputNum("cfg-townPrice", 4500);
        c.estates.townTaxYield = this.getInputNum("cfg-townTax", 1200);
        c.estates.townRent = this.getInputNum("cfg-townRent", 700);
        c.estates.castlePrice = this.getInputNum("cfg-castlePrice", 8000);
        c.estates.castleTaxYield = this.getInputNum("cfg-castleTax", 2500);
        c.estates.castleRent = this.getInputNum("cfg-castleRent", 1500);

        c.livestock.sheepPrice = this.getInputNum("cfg-sheepPrice", 500);
        c.livestock.sheepTax = this.getInputNum("cfg-sheepTax", 120);
        c.livestock.sheepRent = this.getInputNum("cfg-sheepRent", 50);
        c.livestock.pigsPrice = this.getInputNum("cfg-pigsPrice", 600);
        c.livestock.pigsTax = this.getInputNum("cfg-pigsTax", 150);
        c.livestock.pigsRent = this.getInputNum("cfg-pigsRent", 75);
        c.livestock.cattlePrice = this.getInputNum("cfg-cattlePrice", 800);
        c.livestock.cattleTax = this.getInputNum("cfg-cattleTax", 200);
        c.livestock.cattleRent = this.getInputNum("cfg-cattleRent", 100);
        c.livestock.capacityPerVillage = this.getInputNum("cfg-capVillage", 3);
        c.livestock.capacityPerTown = this.getInputNum("cfg-capTown", 2);
        c.livestock.capacityPerStaje = this.getInputNum("cfg-capStaje", 4);

        c.animalBasePrices.sokol = this.getInputNum("cfg-sokol", 400);
        c.animalBasePrices.pes = this.getInputNum("cfg-pes", 500);
        c.animalBasePrices.kun = this.getInputNum("cfg-kun", 600);
        c.animalRentRatios.single = Math.max(0.05, this.getInputNum("cfg-rentSingle", 20) / 100);
        c.animalRentRatios.pair = Math.max(0.10, this.getInputNum("cfg-rentPair", 40) / 100);
        c.animalRentRatios.fullSet = Math.max(0.20, this.getInputNum("cfg-rentSet", 80) / 100);

        c.itemPackPrices.tier1 = this.getInputNum("cfg-pack1", 2500);
        c.itemPackPrices.tier2 = this.getInputNum("cfg-pack2", 7000);
        c.itemPackPrices.tier3 = this.getInputNum("cfg-pack3", 12000);

        c.quests.u1BaseDiff = this.getInputNum("cfg-u1Diff", 5);
        c.quests.u1GoldReward = this.getInputNum("cfg-u1Gold", 1500);
        c.quests.u2BaseDiff = this.getInputNum("cfg-u2Diff", 9);
        c.quests.u2GoldReward = this.getInputNum("cfg-u2Gold", 3500);
        c.quests.u2HeartReward = this.getInputNum("cfg-u2Hearts", 1.0);
        c.quests.u3BaseDiff = this.getInputNum("cfg-u3Diff", 13);
        c.quests.u3GoldReward = this.getInputNum("cfg-u3Gold", 8000);
        c.quests.u3HeartReward = this.getInputNum("cfg-u3Hearts", 3.0);

        this.activeConfig = c;
        if (this.state && this.state.config) {
            this.state.config = window.PRS_GameEngine.deepClone(c);
        }
        return c;
    },

    resetBalanceToDefaults: function () {
        this.activeConfig = window.PRS_GameEngine.deepClone(window.PRS_DEFAULT_CONFIG);
        if (this.state && this.state.config) {
            this.state.config = window.PRS_GameEngine.deepClone(this.activeConfig);
        }
        this.renderBalanceStudioInputs();
        var msgEl = document.getElementById("save-config-feedback");
        if (msgEl) msgEl.textContent = "↺ Obnoveny původní výchozí hodnoty královské ekonomiky.";
    },

    runEconomySimulation: function (numGames) {
        var cfg = this.readBalanceStudioInputs();
        var simBoardSel = document.getElementById("sim-board-select");
        var simScenSel = document.getElementById("sim-scenario-select");
        var simDiffSel = document.getElementById("sim-diff-select");
        var simPlSel = document.getElementById("sim-players-select");

        var bCode = simBoardSel ? simBoardSel.value : "classic_96";
        var simOpts = {
            scenario: simScenSel ? simScenSel.value : "standard",
            difficultyMode: simDiffSel ? simDiffSel.value : "normal",
            playerCount: simPlSel ? Number(simPlSel.value) : 4
        };

        var result = window.PRS_GameEngine.simulateGames(numGames || 30, cfg, bCode, simOpts);
        var outBox = document.getElementById("sim-results-box");
        if (!outBox) return;

        var hb = result.avgWinnerHeartsBreakdown;
        var wt = result.winsByType || {};
        var botLabels = [
            { key: "Bot_Aggressive", name: "⚔️ Válečník (Boj & Draci)", color: "#f87171" },
            { key: "Bot_Breeder", name: "🌾 Chovatel (Sady & Dobytek)", color: "#4ade80" },
            { key: "Bot_Noble", name: "👑 Šlechtic (Panství & Plesy)", color: "#facc15" },
            { key: "Bot_Balanced", name: "⚖️ Všestranný rytíř", color: "#38bdf8" },
            { key: "Bot_Easy", name: "🛡️ Opatrný panoš", color: "#cbd5e1" }
        ];
        var winRowsHtml = "";
        for (var bi = 0; bi < botLabels.length; bi++) {
            var bl = botLabels[bi];
            var wins = wt[bl.key] || 0;
            var pct = Math.round((wins / result.gamesSimulated) * 100);
            winRowsHtml +=
                '<div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.35rem; font-size:0.8rem;">' +
                '  <div style="width:190px; color:' + bl.color + '; font-weight:600;">' + bl.name + '</div>' +
                '  <div style="flex:1; height:8px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">' +
                '    <div style="width:' + pct + '%; height:100%; background:' + bl.color + ';"></div>' +
                '  </div>' +
                '  <div style="width:85px; text-align:right; color:#f8fafc; font-weight:700;">' + wins + '× (' + pct + ' %)</div>' +
                '</div>';
        }

        outBox.innerHTML =
            '<div class="sim-metrics-grid" style="margin-bottom:0.9rem;">' +
            '  <div class="sim-metric-card">' +
            '    <span>⏱️ Odhad stolní herní doby (' + result.playerCount + ' hráči)</span>' +
            '    <strong>' + result.estTabletopHoursText + '</strong>' +
            '    <small>(' + result.estTabletopMinutes + ' min u stolu | ' + result.gamesSimulated + ' her)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🔄 Průměrná délka partie</span>' +
            '    <strong>' + result.avgRounds + ' kol</strong>' +
            '    <small>(celkem ' + result.avgTurns + ' jednotlivých tahů)</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>💰 Hotovost &amp; Celkové jmění vítěze</span>' +
            '    <strong>' + result.avgWinnerGold.toLocaleString("cs-CZ") + ' zl.</strong>' +
            '    <small>Čisté jmění vč. panství: ' + (result.avgWinnerNetWorth || 0).toLocaleString("cs-CZ") + ' zl.</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🏛️ Výběr daní &amp; Nájemného vítěze</span>' +
            '    <strong>+' + (result.avgTaxesCollected || 0).toLocaleString("cs-CZ") + ' zl. daně</strong>' +
            '    <small>Vybrané mýtné od soupeřů: +' + (result.avgRentCollected || 0).toLocaleString("cs-CZ") + ' zl.</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🏰 Panství vítěze na konci hry</span>' +
            '    <strong>' + result.avgWinnerVillages + ' 🏘️ | ' + result.avgWinnerTowns + ' 🏙️ | ' + result.avgWinnerCastles + ' 🏯</strong>' +
            '    <small>Vesnice / Města / Hrady v držení vítěze</small>' +
            '  </div>' +
            '  <div class="sim-metric-card">' +
            '    <span>🌾 Chov dobytka &amp; Skolení draci</span>' +
            '    <strong>' + result.avgWinnerLivestock + ' ks dobytka | ' + result.avgDragonsSlain + ' 🐉</strong>' +
            '    <small>Přikoupená stáda na pastvinách &amp; draci (Bankroty: ' + result.avgEliminations + ')</small>' +
            '  </div>' +
            '  <div class="sim-metric-card" style="grid-column: span 2;">' +
            '    <span>💖 Odkud plynou vítězná Srdce princezny</span>' +
            '    <strong>Slavnosti: ' + hb.festivals + ' 💖 &nbsp;|&nbsp; Výpravy (U2/U3): ' + hb.quests + ' 💖 &nbsp;|&nbsp; Chov &amp; Sady: ' + hb.breeding + ' 💖</strong>' +
            '    <small>Karty Náhody, Rytířské duely a Přípitky: ' + hb.chance + ' 💖</small>' +
            '  </div>' +
            '</div>' +
            '<div style="background:rgba(0,0,0,0.38); border:1px solid rgba(212,175,55,0.25); border-radius:10px; padding:0.85rem 1rem;">' +
            '  <div style="font-weight:700; color:var(--gold-light); font-size:0.86rem; margin-bottom:0.55rem;">🏆 Úspěšnost strategií (Win-Rate archetypů za ' + result.gamesSimulated + ' her)</div>' +
            winRowsHtml +
            '</div>';

        fetch("api.ashx?action=log-telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                eventType: "SimulationRun",
                turnNumber: Math.round(result.avgRounds),
                message: "Simulace " + result.gamesSimulated + " her [" + bCode + "/" + simOpts.scenario + "] (" + result.estTabletopHoursText + ")",
                payloadJson: JSON.stringify(result)
            })
        }).catch(function () { });
    },

    saveConfigToServer: function () {
        var cfg = this.readBalanceStudioInputs();
        var msgEl = document.getElementById("save-config-feedback");
        if (msgEl) msgEl.textContent = "⏳ Ukládám konfiguraci do databáze [prs].[prs_GameConfigs]...";

        fetch("api.ashx?action=save-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                versionName: "v2.0-nova-ekonomika",
                targetHearts: cfg.targetHearts,
                startGold: cfg.startGold,
                passStartGold: cfg.passStartGold,
                configJson: JSON.stringify(cfg),
                notes: "Uloženo z Administrace – Balancovací studio v2.0"
            })
        })
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (msgEl) {
                    msgEl.textContent = (res && res.ok)
                        ? "✅ Konfigurace uložena do DB a aktivována pro všechny nové hry!"
                        : "✅ Konfigurace aktivována pro tuto relaci.";
                }
            })
            .catch(function () {
                if (msgEl) msgEl.textContent = "✅ Konfigurace aktivována lokálně.";
            });
    }
    });
})();
