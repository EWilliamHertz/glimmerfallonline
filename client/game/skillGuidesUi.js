// ==========================================
// GlimmerFall Online — Milestone Skill Guides & How-to-Train Modals
// ==========================================

import {
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  getTotalProfessionLevel,
  getXpForProfessionLevel,
  calcEntityLevel,
  getEntityCombatArchetype,
} from '../../shared/protocol.js';
import { getSkillIconSvg, SKILL_ICON_SVGS } from '../ui/skillIcons.js';
import { getUnlockIconSvg } from '../ui/unlockIcons.js';

export function setupSkillGuidesUi({ getProg, audio, toggleModal }) {
  let currentSkillGuideId = 'resonance_extraction';
  let currentSkillGuideFilter = 'all';
  let currentSkillsModalFilter = 'all';

  window.toggleSkillsTab = function () {
    const modal = document.getElementById('skills-modal');
    if (modal) {
      const isVisible = modal.style.display !== 'none';
      if (isVisible) {
        modal.style.display = 'none';
      } else {
        window.renderSkillsModal();
        toggleModal('skills-modal');
        audio.playChime?.();
      }
      return;
    }

    // Fallback to popup if modal not in DOM
    const el = document.getElementById('skills-tab-popup');
    if (!el) return;
    const isVisible = el.style.display !== 'none' && el.classList.contains('active');
    if (isVisible) {
      el.classList.remove('active');
      el.style.display = 'none';
    } else {
      window.renderSkillsTabUI();
      el.style.display = 'flex';
      el.classList.add('active');
      audio.playChime?.();
    }
  };

  window.openSkillsModal = function () {
    window.renderSkillsModal();
    toggleModal('skills-modal');
  };

  window.filterSkillsModal = function (category = 'all') {
    currentSkillsModalFilter = category;
    const tabs = document.querySelectorAll('.skills-filter-tab');
    tabs.forEach((tab) => {
      const f = tab.getAttribute('data-filter') || 'all';
      if (f === category) tab.classList.add('active');
      else tab.classList.remove('active');
    });
    window.renderSkillsModal();
  };

  window.renderSkillsModal = function () {
    const gridEl = document.getElementById('skills-modal-grid');
    const prog = getProg();
    if (!prog.professions) {
      prog.professions = {
        resonance_extraction: { xp: 0, level: 1 },
        relic_forging: { xp: 0, level: 1 },
        rite_binding: { xp: 0, level: 1 },
        glimmerweaving: { xp: 0, level: 1 },
        combat_mastery: { xp: 0, level: 1 },
        rites: { xp: 0, level: 1 },
        flashes: { xp: 0, level: 1 },
      };
    }

    // Header Medallion
    const iconHeader = document.getElementById('skills-modal-icon');
    if (iconHeader) {
      iconHeader.innerHTML = getSkillIconSvg('skills_medallion', 30);
    }

    // 1. Entity Level Box (Entity Combat Level Matrix)
    const entLvl = calcEntityLevel(prog);
    const archetype = getEntityCombatArchetype(prog);
    const entValEl = document.getElementById('skills-entity-level-val');
    const entArchEl = document.getElementById('skills-entity-archetype');
    const entCrestWrap = document.getElementById('entity-crest-wrap');
    const entBreakdownEl = document.getElementById('skills-entity-breakdown');

    if (entValEl) entValEl.innerText = `${entLvl}`;
    if (entArchEl) entArchEl.innerText = archetype;
    if (entCrestWrap) {
      entCrestWrap.innerHTML = getSkillIconSvg('entity_crest', 44);
    }
    if (entBreakdownEl) {
      const profs = prog.professions;
      const combatMax = Math.max(
        profs.combat_mastery?.level || 1,
        profs.rites?.level || 1,
        profs.flashes?.level || 1
      );
      const baseArm = Math.floor((prog.level || 1) * 3.25) + (profs.relic_forging?.level || 1) + (profs.resonance_extraction?.level || 1);
      const artSyn = (profs.rite_binding?.level || 1) + (profs.glimmerweaving?.level || 1);
      entBreakdownEl.innerText = `Defense: ${baseArm} • Offense Max: ${combatMax} • Synergy: ${artSyn}`;
    }

    // 2. Total Level Box
    const totalLevel = getTotalProfessionLevel(prog.professions);
    const maxTotalLevel = Object.keys(PROFESSIONS_CATALOG).length * 99; // 7 * 99 = 693
    const totalValEl = document.getElementById('skills-total-level-val');
    const totalCrestWrap = document.getElementById('total-crest-wrap');
    const totalFillEl = document.getElementById('skills-total-bar-fill');
    const totalXpEl = document.getElementById('skills-total-xp-txt');

    if (totalValEl) {
      totalValEl.innerHTML = `${totalLevel} <span class="skills-total-max">/ ${maxTotalLevel}</span>`;
    }
    if (totalCrestWrap) {
      totalCrestWrap.innerHTML = getSkillIconSvg('total_crest', 44);
    }

    let sumXp = 0;
    for (const p of Object.values(prog.professions)) {
      sumXp += p.xp || 0;
    }
    if (totalXpEl) totalXpEl.innerText = `${sumXp.toLocaleString()} TOTAL XP`;
    if (totalFillEl) {
      const totalPct = Math.min(100, Math.max(1, (totalLevel / maxTotalLevel) * 100));
      totalFillEl.style.width = `${totalPct.toFixed(1)}%`;
    }

    // 3. Grid of 7 Skills
    if (gridEl) {
      let html = '';
      for (const [profId, meta] of Object.entries(PROFESSIONS_CATALOG)) {
        const isCombat = ['combat_mastery', 'rites', 'flashes'].includes(profId);
        if (currentSkillsModalFilter === 'combat' && !isCombat) continue;
        if (currentSkillsModalFilter === 'artisan' && isCombat) continue;

        const state = prog.professions[profId] || { xp: 0, level: 1 };
        const curLvl = state.level || 1;
        const isMaxed = curLvl >= 99;
        const curLvlXp = getXpForProfessionLevel(curLvl);
        const nextLvlXp = isMaxed ? curLvlXp : getXpForProfessionLevel(curLvl + 1);
        const xpInLevel = Math.max(0, state.xp - curLvlXp);
        const xpNeededForLevel = Math.max(1, nextLvlXp - curLvlXp);
        const pct = isMaxed ? 100 : Math.min(100, Math.floor((xpInLevel / xpNeededForLevel) * 100));
        const cape = PROFESSION_MASTERY_CAPES[profId];
        const iconSvg = getSkillIconSvg(profId, 36);

        html += `
          <div class="skills-card ${isMaxed ? 'skills-card-mastered' : ''}" style="--skill-color: ${meta.color}; border-left-color: ${meta.color};" onclick="window.openSkillGuide('${profId}')">
            <div class="skills-card-left">
              <div class="skills-card-crest-frame" style="border-color:${meta.color}55; background:${meta.color}18;">
                ${iconSvg}
              </div>
            </div>
            <div class="skills-card-main">
              <div class="skills-card-header">
                <div class="skills-card-name-group">
                  <span class="skills-card-name" style="color:${meta.color};">${meta.name}</span>
                  <span class="skills-card-category-badge">${isCombat ? 'COMBAT & MAGIC' : 'ARTISAN & HARVEST'}</span>
                </div>
                <div class="skills-card-level-badge ${isMaxed ? 'mastered' : ''}">
                  ${isMaxed ? '👑 MASTERY 99' : `LVL ${curLvl} <span style="font-size:9.5px; opacity:0.65;">/ 99</span>`}
                </div>
              </div>
              <div class="skills-card-role">${meta.role || ''}</div>
              <div class="skills-card-bar-wrap">
                <div class="skills-card-bar-fill" style="width:${pct}%; background:linear-gradient(90deg, ${meta.color}aa, ${meta.color});"></div>
              </div>
              <div class="skills-card-stats-row">
                <span class="skills-card-xp-cur">${state.xp.toLocaleString()} XP</span>
                <span class="skills-card-xp-next">${isMaxed ? '👑 MAXED' : `${pct}% • ${(nextLvlXp - state.xp).toLocaleString()} XP to Lv.${curLvl + 1}`}</span>
              </div>
              ${isMaxed && cape ? `
                <div class="skills-card-cape-banner">
                  ✨ Skillcape: <b>${cape.name}</b> (${cape.perk})
                </div>
              ` : ''}
              <div class="skills-card-actions">
                <button class="skills-card-guide-btn" onclick="event.stopPropagation(); window.openSkillGuide('${profId}')">
                  📖 View ${meta.name} Unlocks →
                </button>
              </div>
            </div>
          </div>
        `;
      }
      gridEl.innerHTML = html;
    }
  };

  window.renderSkillsTabUI = function () {
    window.renderSkillsModal();

    const container = document.getElementById('skills-list-container');
    const totalBadge = document.getElementById('skills-total-badge');
    if (!container) return;

    const prog = getProg();
    if (!prog.professions) {
      prog.professions = {
        resonance_extraction: { xp: 0, level: 1 },
        relic_forging: { xp: 0, level: 1 },
        rite_binding: { xp: 0, level: 1 },
        glimmerweaving: { xp: 0, level: 1 },
        combat_mastery: { xp: 0, level: 1 },
        rites: { xp: 0, level: 1 },
        flashes: { xp: 0, level: 1 },
      };
    }

    const totalLevel = getTotalProfessionLevel(prog.professions);
    if (totalBadge) totalBadge.innerText = `TOTAL LVL: ${totalLevel}`;

    let html = '';
    for (const [profId, pDef] of Object.entries(PROFESSIONS_CATALOG)) {
      const state = prog.professions[profId] || { xp: 0, level: 1 };
      const curLvl = state.level || 1;
      const isMaxed = curLvl >= 99;
      const curLvlXp = getXpForProfessionLevel(curLvl);
      const nextLvlXp = isMaxed ? curLvlXp : getXpForProfessionLevel(curLvl + 1);
      const xpInLevel = Math.max(0, state.xp - curLvlXp);
      const xpNeededForLevel = Math.max(1, nextLvlXp - curLvlXp);
      const pct = isMaxed ? 100 : Math.min(100, Math.floor((xpInLevel / xpNeededForLevel) * 100));
      const cape = PROFESSION_MASTERY_CAPES[profId];
      const iconSvg = getSkillIconSvg(profId, 24);

      html += `
        <div class="skill-row" onclick="window.openSkillGuide('${profId}')" title="Click to view progression milestone unlocks for ${pDef.name}">
          <div class="skill-icon-cell" style="background:${pDef.color}22; border:1px solid ${pDef.color}66;">
            ${iconSvg}
          </div>
          <div class="skill-meta-cell">
            <div class="skill-meta-header">
              <span class="skill-name" style="color:${pDef.color};">${pDef.name}</span>
              <span class="skill-level ${isMaxed ? 'skill-level-max' : ''}">
                ${curLvl} <span style="font-size:9px; color:#78716c; font-weight:normal;">/ 99</span>
              </span>
            </div>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width:${pct}%; background:linear-gradient(90deg, ${pDef.color}aa, ${pDef.color});"></div>
            </div>
            <div class="skill-xp-text">
              <span>${state.xp.toLocaleString()} XP</span>
              <span>${isMaxed ? '👑 MASTERY' : `${pct}% (${(nextLvlXp - state.xp).toLocaleString()} to ${curLvl + 1})`}</span>
            </div>
            ${isMaxed && cape ? `
              <div style="font-size:8px; color:#facc15; margin-top:2px; font-weight:bold;">
                ✨ Mastery Cape: ${cape.name}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  };

  window.openSkillTrainingGuide = function () {
    window.renderSkillTrainingGuide();
    const targetModal = document.getElementById('skill-training-modal');
    if (targetModal) {
      document.querySelectorAll('.modal').forEach((m) => {
        if (m !== targetModal) m.style.display = 'none';
      });
      targetModal.style.display = 'block';
    } else {
      toggleModal('skill-training-modal');
    }
  };

  window.renderSkillTrainingGuide = function () {
    const listEl = document.getElementById('skill-training-body') || document.getElementById('skill-training-list');
    if (!listEl) return;
    const prog = getProg();
    const profs = prog.professions || {};

    listEl.innerHTML = Object.entries(PROFESSIONS_CATALOG).map(([profId, meta]) => {
      const state = profs[profId] || { level: 1, xp: 0 };
      const curLvl = state.level || 1;
      const isMax = curLvl >= 99;
      const curLvlXp = getXpForProfessionLevel(curLvl);
      const nextLvlXp = isMax ? curLvlXp : getXpForProfessionLevel(curLvl + 1);
      const pct = isMax ? 100 : Math.min(100, Math.floor(((state.xp - curLvlXp) / Math.max(1, nextLvlXp - curLvlXp)) * 100));
      const train = meta.training || {};
      const cape = PROFESSION_MASTERY_CAPES[profId];

      return `
        <div class="skill-training-card" style="border-left: 4px solid ${meta.color};">
          <div class="skill-training-head">
            <div class="skill-training-identity">
              <span class="skill-training-icon" style="background:${meta.color}22; border-color:${meta.color}66; display:inline-flex; align-items:center; justify-content:center; padding:2px;">${getSkillIconSvg(profId, 28)}</span>
              <div>
                <div class="skill-training-name" style="color:${meta.color};">${meta.name}</div>
                <div class="skill-training-role">${meta.role}</div>
              </div>
            </div>
            <div class="skill-training-stats">
              <span class="skill-training-level">Lv. ${curLvl} <span style="font-size:10px; color:#78716c;">/ 99</span></span>
              <span class="skill-training-xp">${state.xp.toLocaleString()} XP</span>
              <button class="skill-view-guide-btn" onclick="window.openSkillGuide('${profId}')">
                📖 View Unlock Table
              </button>
            </div>
          </div>
          <div class="skill-progress-bar" style="margin: 6px 0 10px 0;">
            <div class="skill-progress-fill" style="width:${pct}%; background:linear-gradient(90deg, ${meta.color}88, ${meta.color});"></div>
          </div>
          <div class="skill-training-body">
            <div class="skill-training-sec">
              <span class="skill-training-label">How to Train &amp; Level Up</span>
              <div class="skill-training-text">${train.howTo}</div>
            </div>
            <div class="skill-training-sec">
              <span class="skill-training-label">Interactive Nodes &amp; Stations</span>
              <div class="skill-training-text">${train.interactive}</div>
            </div>
            <div class="skill-training-sec">
              <span class="skill-training-label">Milestones &amp; Unlocks</span>
              <div class="skill-training-text">${train.milestones}</div>
            </div>
            <div class="skill-training-sec">
              <span class="skill-training-label">Best World Locations</span>
              <div class="skill-training-text">${train.where}</div>
            </div>
            ${cape ? `
              <div class="skill-training-cape-box" style="border-color:${meta.color}44;">
                <span class="skill-training-cape-badge">👑 Level 99 Skillcape</span>
                <b style="color:#fde047;">${cape.name}</b>
                <span style="color:#94a3b8; font-size:10px;">— ${cape.perk}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  };

  const SKILL_TRAINING_GUIDES = {
    resonance_extraction: {
      categories: ['All', 'Fonts & Shrines', 'Leyline Veins', 'Ancient Flora', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'font_channeling', cat: 'Fonts & Shrines', title: 'Grand Glimmer Font Channeling', desc: 'Channel raw cosmic essence from pulsating fonts in Sanctuary Hub and Continental biomes for steady XP and Glimmer Shards.', method: 'Grand Glimmer Font (Sanctuary / Warzone)', xp: '+100 XP / cycle', icon: '✨' },
        { level: 1, iconKey: 'copper_vein', cat: 'Leyline Veins', title: 'Sun Copper Veins', desc: 'Mine surface copper veins scattered across the sunlit terraces of Solari Citadel.', method: 'Sun Copper Vein (Solari Citadel)', xp: '+25 XP', icon: '⛏️' },
        { level: 5, iconKey: 'sunbloom_herb', cat: 'Ancient Flora', title: 'Sunbloom Herb Patches', desc: 'Harvest radiant golden flora blooming throughout the Golden Citadel.', method: 'Sunbloom Patch (Solari Citadel)', xp: '+25 XP', icon: '🌿' },
        { level: 10, iconKey: 'leyline_shrine', cat: 'Fonts & Shrines', title: 'Ancient Leyline Shrines', desc: 'Attune to ancient stone monoliths across the continent to unlock ancient power and harvest leyline dust.', method: 'Leyline Shrines (Biomes)', xp: '+45 XP', icon: '⛩️' },
        { level: 15, iconKey: 'tin_outcrop', cat: 'Leyline Veins', title: 'Star Tin Mineral Outcrops', desc: 'Extract star-touched tin nodes from the crags of the Nexus Warzone and Solari outskirts.', method: 'Star Tin Outcrop', xp: '+45 XP', icon: '⛏️' },
        { level: 25, iconKey: 'umbral_coal', cat: 'Leyline Veins', title: 'Umbral Coal Deposits', desc: 'Mine dense void-infused coal deposits in the subterranean depths of the Umbri Undercity.', method: 'Umbral Coal Seam (Umbri)', xp: '+70 XP', icon: '🌑' },
        { level: 30, iconKey: 'void_lily', cat: 'Ancient Flora', title: 'Void Lily Harvest', desc: 'Gather shadowy luminescent petals flourishing in the damp shadows of Umbri.', method: 'Void Lily (Umbri Undercity)', xp: '+70 XP', icon: '🪻' },
        { level: 45, iconKey: 'mithril_vein', cat: 'Leyline Veins', title: 'Mithril Astral Veins', desc: 'Chip high-resonance astral ore from the elevated balconies of the Aether Spire.', method: 'Mithril Astral Vein (Aether Spire)', xp: '+110 XP', icon: '💠' },
        { level: 50, iconKey: 'terra_clover', cat: 'Ancient Flora', title: 'Terra Clover Gathering', desc: 'Forage resilient 4-leaf clover clusters rich in natural warding essence from Terra Orchard.', method: 'Terra Clover (Terra Orchard)', xp: '+110 XP', icon: '🍀' },
        { level: 65, iconKey: 'adamant_vein', cat: 'Leyline Veins', title: 'Adamant Terra Formations', desc: 'Quarry hardened tectonic minerals along the ancient roots of the Terra Orchard.', method: 'Adamant Terra Vein (Terra Orchard)', xp: '+165 XP', icon: '🪨' },
        { level: 75, iconKey: 'aether_lotus', cat: 'Ancient Flora', title: 'Aether Lotus Blossom', desc: 'Collect delicate floating lotus petals steeped in pure chronoflux from Aether Spire ponds.', method: 'Aether Lotus (Aether Spire)', xp: '+175 XP', icon: '🪷' },
        { level: 85, iconKey: 'runite_asteroid', cat: 'Leyline Veins', title: 'Celestial Runite Asteroids', desc: 'Mine glowing cosmic runite shards from fallen astral fragments in Starfall Crater and the Celestial Ascent.', method: 'Celestial Runite Vein (Starfall Crater / Ascent)', xp: '+260 XP', icon: '🌌' },
        { level: 90, iconKey: 'empyrean_starleaf', cat: 'Ancient Flora', title: 'Empyrean Starleaf Flora', desc: 'Pluck apex botanical leaves resonating with stellar fire from deep inside Abyssal Rift and the high Ascent.', method: 'Empyrean Starleaf (Ascent / Abyssal Rift)', xp: '+290 XP', icon: '🌟' },
        { level: 99, iconKey: 'cape_extractor', cat: 'Skillcape', title: 'Skillcape of the Grand Extractor', desc: 'Equip the legendary 99 Mastery Cape. Grants 15% bonus extraction yield and +100 Max Glimmer.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    relic_forging: {
      categories: ['All', 'Smelting', 'Equipment', 'Reforging', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'bronze_bar', cat: 'Smelting', title: 'Bronze Cosmic Bar Smelting', desc: 'Combine 1 Sun Copper Ore and 1 Star Tin Mineral at any Cosmic Artisan Anvil into Bronze Bars.', method: 'Cosmic Artisan Anvil', xp: '+30 XP / bar', icon: '🔥' },
        { level: 5, iconKey: 'star_scimitar', cat: 'Equipment', title: 'Novice Star-Iron Scimitar', desc: 'Forge a lightweight slashing scimitar with swift swing speed and baseline Power.', method: 'Cosmic Artisan Anvil', xp: '+65 XP', icon: '⚔️' },
        { level: 15, iconKey: 'bronze_breastplate', cat: 'Equipment', title: 'Reinforced Bronze Breastplate', desc: 'Hammer sturdy torso armor providing solid early-game Bastion defense.', method: 'Cosmic Artisan Anvil', xp: '+95 XP', icon: '🛡️' },
        { level: 30, iconKey: 'umbral_bar', cat: 'Smelting', title: 'Umbral Steel Smelting', desc: 'Smelt iron ore and umbral coal into hardened dark steel bars.', method: 'Cosmic Artisan Anvil', xp: '+85 XP / bar', icon: '🔥' },
        { level: 40, iconKey: 'umbral_platebody', cat: 'Equipment', title: 'Umbral Steel Platebody', desc: 'Craft mid-tier platebody fortified with shadow-dampening wards.', method: 'Cosmic Artisan Anvil', xp: '+160 XP', icon: '🛡️' },
        { level: 55, iconKey: 'mithril_bar', cat: 'Smelting', title: 'Astral Mithril Smelting', desc: 'Infuse raw mithril with starlight dust at high heat.', method: 'Cosmic Artisan Anvil', xp: '+140 XP / bar', icon: '🔥' },
        { level: 60, iconKey: 'mithril_greatsword', cat: 'Equipment', title: 'Astral Mithril Greatsword', desc: 'Forge a devastating two-handed broad blade favored by Vanguard champions.', method: 'Cosmic Artisan Anvil', xp: '+240 XP', icon: '⚔️' },
        { level: 75, iconKey: 'adamant_shield', cat: 'Equipment', title: 'Adamant Bulwark Shield', desc: 'Craft an impenetrable heavy fortress shield from tectonic adamant ingots.', method: 'Cosmic Artisan Anvil', xp: '+320 XP', icon: '🛡️' },
        { level: 85, iconKey: 'runite_bar', cat: 'Smelting', title: 'Celestial Runite Smelting', desc: 'Refine raw runite ore into luminescent star-metal bars capable of cutting void entities.', method: 'Cosmic Artisan Anvil', xp: '+280 XP / bar', icon: '🔥' },
        { level: 90, iconKey: 'cosmos_set', cat: 'Equipment', title: 'Starmetal Cosmos Blade & Plate', desc: 'Forge apex legendary weapons and armor radiating cosmic constellation power.', method: 'Cosmic Artisan Anvil', xp: '+550 XP', icon: '🌌' },
        { level: 99, iconKey: 'cape_smith', cat: 'Skillcape', title: 'Skillcape of the Master Smith', desc: 'Equip the legendary 99 Forging Cape. Has a 20% chance to duplicate forged ingots and gear.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    rite_binding: {
      categories: ['All', 'Infusions', 'Gemcutting', 'Runic Codex', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'healing_salve', cat: 'Infusions', title: 'Minor Healing Salve', desc: 'Brew restoring salves from botanical herbs and pure spring water at the Aetherial Crucible.', method: 'Aetherial Crucible', xp: '+25 XP', icon: '🧪' },
        { level: 10, iconKey: 'glimmer_draught', cat: 'Infusions', title: 'Glimmer Draught', desc: 'Distill liquid glimmer essence into mana-restoring draughts.', method: 'Aetherial Crucible', xp: '+40 XP', icon: '💧' },
        { level: 25, iconKey: 'cut_ruby_sapphire', cat: 'Gemcutting', title: 'Cut Solar Ruby & Void Sapphire', desc: 'Chisel rough gems into flawless faceted stones socketable into gear.', method: 'Aetherial Crucible', xp: '+90 XP', icon: '💎' },
        { level: 40, iconKey: 'vitality_elixir', cat: 'Infusions', title: 'Major Vitality Elixir', desc: 'Concoct high-tier rejuvenating draughts for intense boss encounters.', method: 'Aetherial Crucible', xp: '+130 XP', icon: '🍷' },
        { level: 55, iconKey: 'cut_emerald_diamond', cat: 'Gemcutting', title: 'Cut Terra Emerald & Aether Diamond', desc: 'Cut high-resonance jewels providing substantial Bastion and Resonance stat bonuses.', method: 'Aetherial Crucible', xp: '+180 XP', icon: '💎' },
        { level: 70, iconKey: 'battle_tonic', cat: 'Runic Codex', title: 'Astral Battle Tonic', desc: 'Brew surging tonics granting +20% Critical Strike Chance and Spell Echo amplification.', method: 'Aetherial Crucible', xp: '+250 XP', icon: '⚡' },
        { level: 85, iconKey: 'chrono_draught', cat: 'Runic Codex', title: 'Chrono-Overdrive Draught', desc: 'Create exotic draughts drastically accelerating rite cast speed and cooldown recovery.', method: 'Aetherial Crucible', xp: '+380 XP', icon: '⏳' },
        { level: 92, iconKey: 'leyline_rune', cat: 'Runic Codex', title: 'Inscribe Ancient Leyline Runes', desc: 'Inscribe socketable ancient runes (Sol, Umb, Ter, Aet, Zod) to unleash 3-socket Runewords.', method: 'Aetherial Crucible', xp: '+480 XP', icon: '📜' },
        { level: 99, iconKey: 'cape_binder', cat: 'Skillcape', title: 'Skillcape of the Grand Binder', desc: 'Equip the legendary 99 Rite Binding Cape. All crafted consumables restore 25% more HP/Glimmer.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    glimmerweaving: {
      categories: ['All', 'Spinning', 'Robes & Cowls', 'Cloaks', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'fiber_yarn', cat: 'Spinning', title: 'Spin Coarse Fiber Yarn', desc: 'Spin wild botanical fibers at the Celestial Loom into durable thread.', method: 'Celestial Loom', xp: '+25 XP', icon: '🧵' },
        { level: 10, iconKey: 'acolyte_robes', cat: 'Robes & Cowls', title: 'Initiate Acolyte Robes', desc: 'Weave lightweight cotton robes that enhance baseline magical Resonance.', method: 'Celestial Loom', xp: '+55 XP', icon: '👘' },
        { level: 25, iconKey: 'wanderer_cloak', cat: 'Cloaks', title: 'Wanderer Travel Cloak', desc: 'Stitch protective traveler capes providing movement stability.', method: 'Celestial Loom', xp: '+85 XP', icon: '🧣' },
        { level: 40, iconKey: 'duskveil_silk', cat: 'Spinning', title: 'Duskveil Silk Spinning', desc: 'Spin void-tainted spider silks from Umbri caverns into gossamer cloth.', method: 'Celestial Loom', xp: '+120 XP', icon: '🕸️' },
        { level: 55, iconKey: 'duskveil_hood', cat: 'Robes & Cowls', title: 'Duskveil Silk Mantle & Hood', desc: 'Tailor stealthy assassin cowls and flowing shadows shrouding the wearer.', method: 'Celestial Loom', xp: '+210 XP', icon: '🥷' },
        { level: 70, iconKey: 'mystic_vestments', cat: 'Robes & Cowls', title: 'Mystic Leystrand Vestments', desc: 'Weave high-resonance robes channelled directly from leyline currents.', method: 'Celestial Loom', xp: '+310 XP', icon: '✨' },
        { level: 85, iconKey: 'gossamer_cloak', cat: 'Cloaks', title: 'Celestial Gossamer Cloak', desc: 'Craft ethereal glowing cloaks radiating protective starlight shields.', method: 'Celestial Loom', xp: '+440 XP', icon: '🌟' },
        { level: 99, iconKey: 'cape_weaver', cat: 'Skillcape', title: 'Skillcape of the Master Weaver', desc: 'Equip the legendary 99 Glimmerweaving Cape. Adds +12% Dodge chance and reduces robe damage taken by 8%.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    combat_mastery: {
      categories: ['All', 'Wild Beasts', 'Dungeon Sentinels', 'World Bosses', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'training_dummy', cat: 'Wild Beasts', title: 'Sanctuary Practice Dummies & Scuttlers', desc: 'Practice weapon rotations on training dummies and shoreline crabs.', method: 'Sanctuary Shoreline', xp: '+35 XP / kill', icon: '🦀' },
        { level: 5, iconKey: 'faction_patrol', cat: 'Dungeon Sentinels', title: 'Faction Outpost Patrols', desc: 'Defeat Solari Golden Sentinels, Umbri Shadow Stalkers, Terra Wardens, and Aether Golems.', method: 'Faction Biomes', xp: '+65-80 XP', icon: '🛡️' },
        { level: 15, iconKey: 'dungeon_boss', cat: 'World Bosses', title: 'Sub-Zone Mini-Bosses', desc: 'Slay dungeon champions in the Forgotten Ruins, Sunken Vault, and Shadow Labyrinth.', method: 'Sub-Zone Dungeons', xp: '+180-260 XP', icon: '💀' },
        { level: 25, iconKey: 'nexus_siege', cat: 'World Bosses', title: 'Shattered Nexus Outpost Guardians', desc: 'Participate in the 30-minute scheduled Nexus Siege event in the Warzone.', method: 'Nexus Warzone', xp: '+350 XP', icon: '⚔️' },
        { level: 40, iconKey: 'elite_champion', cat: 'Dungeon Sentinels', title: 'Affixed Elite Champions', desc: 'Overcome rare golden elites spawning with lethal affixes (Molten, Vampiric, Shocking, Void).', method: 'World-Wide Spawns', xp: '+320 XP', icon: '🔥' },
        { level: 60, iconKey: 'world_boss', cat: 'World Bosses', title: 'Continental Faction World Bosses', desc: 'Defeat Solari Sun-Lord, Umbri Void Matron, Terra Behemoth, and Aether Chrono-Archon.', method: 'Faction Citadel Basements', xp: '+650 XP', icon: '👑' },
        { level: 75, iconKey: 'mythic_keystone', cat: 'World Bosses', title: 'Mythic+ Keystone Raids', desc: 'Scale infinitely scaling dungeons against the clock with affixes like Fortified, Volcanic, and Tyrannical.', method: 'Keystone Altars', xp: 'Scaled (Up to +2,500 XP)', icon: '🗝️' },
        { level: 88, iconKey: 'void_singularity', cat: 'World Bosses', title: 'Starfall Crater & Abyssal Rift Bosses', desc: 'Vanquish the Star-Eater Chimera and the Void Singularity Xal\'Korath in the outer realms.', method: 'Starfall Crater / Abyssal Rift', xp: '+1,200 XP', icon: '🌌' },
        { level: 99, iconKey: 'cape_champion', cat: 'Skillcape', title: 'Skillcape of the Continental Champion', desc: 'Equip the legendary 99 Combat Mastery Cape. Grants +25 Attack Power, +15 Bastion, and +5% Life Leech.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    rites: {
      categories: ['All', 'Channeled Rites', 'Invocations', 'Ritual Mastery', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'smite_rite', cat: 'Channeled Rites', title: 'Solar Smite & Umbral Ruin Rites', desc: 'Channel focused radiant energy or shadow threads against enemies. Earns XP whenever a Rite is channeled.', method: 'Cast Rites in Combat', xp: '+25 XP / cast', icon: '☀️' },
        { level: 10, iconKey: 'channel_focus', cat: 'Channeled Rites', title: 'Channeled Focus: Pushback Resistance', desc: 'Reduces cast-time pushback when sustaining enemy damage by 20%.', method: 'Passive Mastery', xp: 'Level 10 Unlock', icon: '🛡️' },
        { level: 25, iconKey: 'radiant_cascade', cat: 'Invocations', title: 'Radiant Cascade & Void Eruption', desc: 'Channel devastating multi-strike area-of-effect rites that overwhelm target clusters.', method: 'Equip Tier 2 Rites', xp: '+45 XP / cast', icon: '✨' },
        { level: 40, iconKey: 'resonance_amp', cat: 'Invocations', title: 'Astral Resonance Amplification', desc: 'Increases all spell damage from channeled rites by 12%.', method: 'Passive Mastery', xp: 'Level 40 Unlock', icon: '⚡' },
        { level: 55, iconKey: 'terra_quake', cat: 'Channeled Rites', title: 'Terra Quake & Chrono Singularity Rites', desc: 'Channel seismic fissures and temporal gravitational vortexes in dungeon boss battles.', method: 'High-Tier Evocations', xp: '+85 XP / cast', icon: '🌀' },
        { level: 70, iconKey: 'channel_cadence', cat: 'Ritual Mastery', title: 'Arch-Hierophant Channeling Cadence', desc: 'Drastically accelerates rite channel time by 15%, speeding up heavy damage cycles.', method: 'Passive Mastery', xp: 'Level 70 Unlock', icon: '⏳' },
        { level: 85, iconKey: 'solar_nova', cat: 'Invocations', title: 'Cataclysmic Solar Nova & Void Collapse', desc: 'Summon continental-tier celestial flares incinerating high-level bosses.', method: 'Mythic Raids / Outer Biomes', xp: '+160 XP / cast', icon: '🌌' },
        { level: 92, iconKey: 'overchannel_surge', cat: 'Ritual Mastery', title: 'Prismatic Overchanneling Surge', desc: 'Grants +25% Critical Strike Chance to fully channeled Rites.', method: 'Apex Spellcraft', xp: 'Level 92 Unlock', icon: '🔮' },
        { level: 99, iconKey: 'cape_hierophant', cat: 'Skillcape', title: 'Skillcape of the Arch-Hierophant', desc: 'Equip the legendary 99 Rites Cape. Grants +5 All Stats, -20% Rite channel time, and makes channeled spells immune to interrupt.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    flashes: {
      categories: ['All', 'Instant Strikes', 'Mobility & Escapes', 'Counter-Reflexes', 'Skillcape'],
      unlocks: [
        { level: 1, iconKey: 'flare_strike', cat: 'Instant Strikes', title: 'Flare Strike & Quick Strikes', desc: 'Trigger instant flash abilities during weapon swings and spell cooldowns.', method: 'Use Flashes in Combat', xp: '+20 XP / flash', icon: '⚡' },
        { level: 10, iconKey: 'fleetfoot', cat: 'Mobility & Escapes', title: 'Fleetfoot Reaction Stance', desc: 'Gain +6% Movement Speed for 2.5s immediately after activating any Flash.', method: 'Passive Mastery', xp: 'Level 10 Unlock', icon: '💨' },
        { level: 25, iconKey: 'phantom_blink', cat: 'Mobility & Escapes', title: 'Phantom Blink & Shadow Step', desc: 'Instantly warp short distances through enemies or ground hazards to reposition.', method: 'Equip Mobility Flashes', xp: '+40 XP / flash', icon: '✨' },
        { level: 40, iconKey: 'counter_deflect', cat: 'Counter-Reflexes', title: 'Counter-Ward Deflection', desc: 'Deflect incoming spells if a flash ability is activated within 0.3s of impact.', method: 'Combat Reflex Timing', xp: 'Level 40 Unlock', icon: '🛡️' },
        { level: 55, iconKey: 'tempest_flurry', cat: 'Instant Strikes', title: 'Tempest Flurry & Whirlwind Blitz', desc: 'Unleash rapid consecutive flash strikes that critically strike bleeding foes.', method: 'High-Speed Rotations', xp: '+75 XP / flash', icon: '🌪️' },
        { level: 70, iconKey: 'chrono_snap', cat: 'Counter-Reflexes', title: 'Chrono-Snap Cooldown Recovery', desc: 'Reduces all Flash ability cooldowns across your entire action bar by 20%.', method: 'Passive Mastery', xp: 'Level 70 Unlock', icon: '⏱️' },
        { level: 85, iconKey: 'horizon_blitz', cat: 'Instant Strikes', title: 'Horizon Blitz Behind Striking', desc: 'Instantly dash behind a target and land a guaranteed critical strike.', method: 'Outer Continent / Dungeons', xp: '+140 XP / flash', icon: '🗡️' },
        { level: 92, iconKey: 'hyper_reflex', cat: 'Counter-Reflexes', title: 'Hyper-Reflex Surge Reset', desc: 'Defeating an enemy or successfully dodging a boss mechanic resets Flash cooldowns.', method: 'Apex Reflex Mastery', xp: 'Level 92 Unlock', icon: '⚡' },
        { level: 99, iconKey: 'cape_tempest', cat: 'Skillcape', title: 'Skillcape of the Tempest Flash', desc: 'Equip the legendary 99 Flashes Cape. Grants +5 All Stats, +1 Flash charge, and 15% flash CDR.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
  };

  window.openSkillGuide = function (skillId = 'resonance_extraction', filter = 'all') {
    currentSkillGuideId = skillId;
    currentSkillGuideFilter = filter;
    window.renderSkillGuide(skillId, filter);
    const targetModal = document.getElementById('skill-guide-modal');
    if (targetModal) {
      document.querySelectorAll('.modal').forEach((m) => {
        if (m !== targetModal) m.style.display = 'none';
      });
      targetModal.style.display = 'block';
    } else {
      toggleModal('skill-guide-modal');
    }
  };

  window.renderSkillGuide = function (skillId = currentSkillGuideId, filter = currentSkillGuideFilter) {
    currentSkillGuideId = skillId;
    currentSkillGuideFilter = filter;

    const modal = document.getElementById('skill-guide-modal');
    if (!modal) return;

    const prog = getProg();
    const prof = prog.professions?.[skillId] || { level: 1, xp: 0 };
    const curLevel = prof.level || 1;
    const pDef = PROFESSIONS_CATALOG[skillId];
    const guideData = SKILL_TRAINING_GUIDES[skillId];
    if (!pDef || !guideData) return;

    const iconEl = document.getElementById('skill-guide-icon');
    const titleEl = document.getElementById('skill-guide-title');
    const levelEl = document.getElementById('skill-guide-level');
    const xpEl = document.getElementById('skill-guide-xp');
    const howtoEl = document.getElementById('skill-guide-howto');
    const navEl = document.getElementById('skill-guide-filters');
    const listEl = document.getElementById('skill-guide-unlocks-container');

    if (iconEl) iconEl.innerHTML = getSkillIconSvg(skillId, 28);
    if (titleEl) {
      titleEl.innerText = `${pDef.name.toUpperCase()} — SKILL GUIDE & UNLOCKS`;
      titleEl.style.color = pDef.color;
    }
    if (levelEl) levelEl.innerText = `LEVEL ${curLevel} / 99`;
    if (xpEl) xpEl.innerText = `${prof.xp.toLocaleString()} TOTAL XP`;
    if (howtoEl && pDef.training) {
      howtoEl.innerHTML = `
        <div style="background:#090e1d; border:1px solid ${pDef.color}44; border-left:3px solid ${pDef.color}; padding:8px 10px; border-radius:4px; font-size:10px; line-height:1.45; display:flex; flex-direction:column; gap:4px;">
          <div><b style="color:${pDef.color};">HOW TO TRAIN:</b> <span style="color:#e2e8f0;">${pDef.training.howTo}</span></div>
          <div><b style="color:#fde047;">NODES &amp; ACTIVITIES:</b> <span style="color:#cbd5e1;">${pDef.training.interactive}</span> • <b style="color:#38bdf8;">LOCATIONS:</b> <span style="color:#94a3b8;">${pDef.training.where}</span></div>
        </div>
      `;
    }

    // Active tab in skill selection header
    const tabBtns = document.querySelectorAll('.sg-tab-btn');
    tabBtns.forEach((btn) => {
      if (btn.id === `sg-tab-${skillId}`) {
        btn.classList.add('active');
        btn.style.borderColor = pDef.color;
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = '';
      }
    });

    if (navEl) {
      navEl.innerHTML = guideData.categories.map((cat) => {
        const isActive = cat.toLowerCase() === filter.toLowerCase();
        return `
          <button class="skill-filter-btn ${isActive ? 'active' : ''}" style="${isActive ? `border-color:${pDef.color}; color:${pDef.color}; font-weight:bold;` : ''}" onclick="window.renderSkillGuide('${skillId}', '${cat.toLowerCase()}')">
            ${cat}
          </button>
        `;
      }).join('');
    }

    if (listEl) {
      const filteredUnlocks = guideData.unlocks.filter((u) => {
        if (filter === 'all') return true;
        return u.cat.toLowerCase() === filter.toLowerCase();
      });

      listEl.innerHTML = filteredUnlocks.map((u) => {
        const isUnlocked = curLevel >= u.level;
        return `
          <div class="skill-unlock-card ${isUnlocked ? 'skill-unlocked' : 'skill-locked'}" style="border-left: 3px solid ${isUnlocked ? pDef.color : '#334155'};">
            <div class="skill-unlock-badge-col">
              <div class="skill-unlock-emblem-box ${isUnlocked ? 'is-unlocked' : 'is-locked'}" style="border-color:${isUnlocked ? pDef.color + 'aa' : '#334155'};">
                <div class="skill-unlock-icon-stage">
                  ${getUnlockIconSvg(u.iconKey || u.title, 36)}
                </div>
                <div class="skill-unlock-level-tag ${isUnlocked ? 'is-unlocked' : 'is-locked'}" style="${isUnlocked ? `background:${pDef.color}; color:#050811; border-top:1px solid #fef08a;` : ''}">
                  LVL ${u.level}
                </div>
              </div>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div class="skill-unlock-title">
                <span style="${isUnlocked ? 'color:#f8fafc;' : 'color:#cbd5e1;'}">${u.title}</span>
              </div>
              <div class="skill-unlock-desc">${u.desc}</div>
              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:4px;">
                <span class="skill-xp-badge" style="color:${pDef.color};">${u.xp}</span>
                <span style="font-size:9px; color:#94a3b8;">Station / Method: <b style="color:#e2e8f0;">${u.method}</b></span>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="skill-status-badge ${isUnlocked ? 'skill-status-unlocked' : 'skill-status-locked'}">
                ${isUnlocked ? '✓ UNLOCKED' : `🔒 REQ. LV. ${u.level}`}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  };
}
