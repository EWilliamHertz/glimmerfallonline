// ==========================================
// GlimmerFall Online — OSRS-Style Milestone Skill Guides & How-to-Train Modals
// ==========================================

import {
  PROFESSIONS_CATALOG,
  PROFESSION_MASTERY_CAPES,
  getTotalProfessionLevel,
  getXpForProfessionLevel,
} from '../../shared/protocol.js';

export function setupSkillGuidesUi({ getProg, audio, toggleModal }) {
  let currentSkillGuideId = 'resonance_extraction';
  let currentSkillGuideFilter = 'all';

  window.toggleSkillsTab = function () {
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

  window.renderSkillsTabUI = function () {
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

      html += `
        <div class="skill-row" onclick="window.openSkillGuide('${profId}')" title="Click to view full OSRS-style milestone unlocks for ${pDef.name}">
          <div class="skill-icon-cell" style="background:${pDef.color}22; border:1px solid ${pDef.color}66;">
            ${pDef.icon}
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
    toggleModal('skill-training-modal');
  };

  window.renderSkillTrainingGuide = function () {
    const listEl = document.getElementById('skill-training-list');
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
              <span class="skill-training-icon" style="background:${meta.color}22; border-color:${meta.color}66;">${meta.icon}</span>
              <div>
                <div class="skill-training-name" style="color:${meta.color};">${meta.name}</div>
                <div class="skill-training-role">${meta.role}</div>
              </div>
            </div>
            <div class="skill-training-stats">
              <span class="skill-training-level">Lv. ${curLvl} <span style="font-size:10px; color:#78716c;">/ 99</span></span>
              <span class="skill-training-xp">${state.xp.toLocaleString()} XP</span>
              <button class="osrs-view-guide-btn" onclick="window.openSkillGuide('${profId}')">
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
        { level: 1, cat: 'Fonts & Shrines', title: 'Grand Glimmer Font Channeling', desc: 'Channel raw cosmic essence from pulsating fonts in Sanctuary Hub and Continental biomes for steady XP and Glimmer Shards.', method: 'Grand Glimmer Font (Sanctuary / Warzone)', xp: '+100 XP / cycle', icon: '✨' },
        { level: 1, cat: 'Leyline Veins', title: 'Sun Copper Veins', desc: 'Mine surface copper veins scattered across the sunlit terraces of Solari Citadel.', method: 'Sun Copper Vein (Solari Citadel)', xp: '+25 XP', icon: '⛏️' },
        { level: 5, cat: 'Ancient Flora', title: 'Sunbloom Herb Patches', desc: 'Harvest radiant golden flora blooming throughout the Golden Citadel.', method: 'Sunbloom Patch (Solari Citadel)', xp: '+25 XP', icon: '🌿' },
        { level: 10, cat: 'Fonts & Shrines', title: 'Ancient Leyline Shrines', desc: 'Attune to ancient stone monoliths across the continent to unlock ancient power and harvest leyline dust.', method: 'Leyline Shrines (Biomes)', xp: '+45 XP', icon: '⛩️' },
        { level: 15, cat: 'Leyline Veins', title: 'Star Tin Mineral Outcrops', desc: 'Extract star-touched tin nodes from the crags of the Nexus Warzone and Solari outskirts.', method: 'Star Tin Outcrop', xp: '+45 XP', icon: '⛏️' },
        { level: 25, cat: 'Leyline Veins', title: 'Umbral Coal Deposits', desc: 'Mine dense void-infused coal deposits in the subterranean depths of the Umbri Undercity.', method: 'Umbral Coal Seam (Umbri)', xp: '+70 XP', icon: '🌑' },
        { level: 30, cat: 'Ancient Flora', title: 'Void Lily Harvest', desc: 'Gather shadowy luminescent petals flourishing in the damp shadows of Umbri.', method: 'Void Lily (Umbri Undercity)', xp: '+70 XP', icon: '🪻' },
        { level: 45, cat: 'Leyline Veins', title: 'Mithril Astral Veins', desc: 'Chip high-resonance astral ore from the elevated balconies of the Aether Spire.', method: 'Mithril Astral Vein (Aether Spire)', xp: '+110 XP', icon: '💠' },
        { level: 50, cat: 'Ancient Flora', title: 'Terra Clover Gathering', desc: 'Forage resilient 4-leaf clover clusters rich in natural warding essence from Terra Orchard.', method: 'Terra Clover (Terra Orchard)', xp: '+110 XP', icon: '🍀' },
        { level: 65, cat: 'Leyline Veins', title: 'Adamant Terra Formations', desc: 'Quarry hardened tectonic minerals along the ancient roots of the Terra Orchard.', method: 'Adamant Terra Vein (Terra Orchard)', xp: '+165 XP', icon: '🪨' },
        { level: 75, cat: 'Ancient Flora', title: 'Aether Lotus Blossom', desc: 'Collect delicate floating lotus petals steeped in pure chronoflux from Aether Spire ponds.', method: 'Aether Lotus (Aether Spire)', xp: '+175 XP', icon: '🪷' },
        { level: 85, cat: 'Leyline Veins', title: 'Celestial Runite Asteroids', desc: 'Mine glowing cosmic runite shards from fallen astral fragments in Starfall Crater and the Celestial Ascent.', method: 'Celestial Runite Vein (Starfall Crater / Ascent)', xp: '+260 XP', icon: '🌌' },
        { level: 90, cat: 'Ancient Flora', title: 'Empyrean Starleaf Flora', desc: 'Pluck apex botanical leaves resonating with stellar fire from deep inside Abyssal Rift and the high Ascent.', method: 'Empyrean Starleaf (Ascent / Abyssal Rift)', xp: '+290 XP', icon: '🌟' },
        { level: 99, cat: 'Skillcape', title: 'Skillcape of the Grand Extractor', desc: 'Equip the legendary 99 Mastery Cape. Grants 15% bonus extraction yield and +100 Max Glimmer.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    relic_forging: {
      categories: ['All', 'Smelting', 'Equipment', 'Reforging', 'Skillcape'],
      unlocks: [
        { level: 1, cat: 'Smelting', title: 'Bronze Cosmic Bar Smelting', desc: 'Combine 1 Sun Copper Ore and 1 Star Tin Mineral at any Cosmic Artisan Anvil into Bronze Bars.', method: 'Cosmic Artisan Anvil', xp: '+30 XP / bar', icon: '🔥' },
        { level: 5, cat: 'Equipment', title: 'Novice Star-Iron Scimitar', desc: 'Forge a lightweight slashing scimitar with swift swing speed and baseline Power.', method: 'Cosmic Artisan Anvil', xp: '+65 XP', icon: '⚔️' },
        { level: 15, cat: 'Equipment', title: 'Reinforced Bronze Breastplate', desc: 'Hammer sturdy torso armor providing solid early-game Bastion defense.', method: 'Cosmic Artisan Anvil', xp: '+95 XP', icon: '🛡️' },
        { level: 30, cat: 'Smelting', title: 'Umbral Steel Smelting', desc: 'Smelt iron ore and umbral coal into hardened dark steel bars.', method: 'Cosmic Artisan Anvil', xp: '+85 XP / bar', icon: '🔥' },
        { level: 40, cat: 'Equipment', title: 'Umbral Steel Platebody', desc: 'Craft mid-tier platebody fortified with shadow-dampening wards.', method: 'Cosmic Artisan Anvil', xp: '+160 XP', icon: '🛡️' },
        { level: 55, cat: 'Smelting', title: 'Astral Mithril Smelting', desc: 'Infuse raw mithril with starlight dust at high heat.', method: 'Cosmic Artisan Anvil', xp: '+140 XP / bar', icon: '🔥' },
        { level: 60, cat: 'Equipment', title: 'Astral Mithril Greatsword', desc: 'Forge a devastating two-handed broad blade favored by Vanguard champions.', method: 'Cosmic Artisan Anvil', xp: '+240 XP', icon: '⚔️' },
        { level: 75, cat: 'Equipment', title: 'Adamant Bulwark Shield', desc: 'Craft an impenetrable heavy fortress shield from tectonic adamant ingots.', method: 'Cosmic Artisan Anvil', xp: '+320 XP', icon: '🛡️' },
        { level: 85, cat: 'Smelting', title: 'Celestial Runite Smelting', desc: 'Refine raw runite ore into luminescent star-metal bars capable of cutting void entities.', method: 'Cosmic Artisan Anvil', xp: '+280 XP / bar', icon: '🔥' },
        { level: 90, cat: 'Equipment', title: 'Starmetal Cosmos Blade & Plate', desc: 'Forge apex legendary weapons and armor radiating cosmic constellation power.', method: 'Cosmic Artisan Anvil', xp: '+550 XP', icon: '🌌' },
        { level: 99, cat: 'Skillcape', title: 'Skillcape of the Master Smith', desc: 'Equip the legendary 99 Forging Cape. Has a 20% chance to duplicate forged ingots and gear.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    rite_binding: {
      categories: ['All', 'Infusions', 'Gemcutting', 'Runic Codex', 'Skillcape'],
      unlocks: [
        { level: 1, cat: 'Infusions', title: 'Minor Healing Salve', desc: 'Brew restoring salves from botanical herbs and pure spring water at the Aetherial Crucible.', method: 'Aetherial Crucible', xp: '+25 XP', icon: '🧪' },
        { level: 10, cat: 'Infusions', title: 'Glimmer Draught', desc: 'Distill liquid glimmer essence into mana-restoring draughts.', method: 'Aetherial Crucible', xp: '+40 XP', icon: '💧' },
        { level: 25, cat: 'Gemcutting', title: 'Cut Solar Ruby & Void Sapphire', desc: 'Chisel rough gems into flawless faceted stones socketable into gear.', method: 'Aetherial Crucible', xp: '+90 XP', icon: '💎' },
        { level: 40, cat: 'Infusions', title: 'Major Vitality Elixir', desc: 'Concoct high-tier rejuvenating draughts for intense boss encounters.', method: 'Aetherial Crucible', xp: '+130 XP', icon: '🍷' },
        { level: 55, cat: 'Gemcutting', title: 'Cut Terra Emerald & Aether Diamond', desc: 'Cut high-resonance jewels providing substantial Bastion and Resonance stat bonuses.', method: 'Aetherial Crucible', xp: '+180 XP', icon: '💎' },
        { level: 70, cat: 'Runic Codex', title: 'Astral Battle Tonic', desc: 'Brew surging tonics granting +20% Critical Strike Chance and Spell Echo amplification.', method: 'Aetherial Crucible', xp: '+250 XP', icon: '⚡' },
        { level: 85, cat: 'Runic Codex', title: 'Chrono-Overdrive Draught', desc: 'Create exotic draughts drastically accelerating rite cast speed and cooldown recovery.', method: 'Aetherial Crucible', xp: '+380 XP', icon: '⏳' },
        { level: 92, cat: 'Runic Codex', title: 'Inscribe Ancient Leyline Runes', desc: 'Inscribe socketable ancient runes (Sol, Umb, Ter, Aet, Zod) to unleash 3-socket Runewords.', method: 'Aetherial Crucible', xp: '+480 XP', icon: '📜' },
        { level: 99, cat: 'Skillcape', title: 'Skillcape of the Grand Binder', desc: 'Equip the legendary 99 Rite Binding Cape. All crafted consumables restore 25% more HP/Glimmer.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    glimmerweaving: {
      categories: ['All', 'Spinning', 'Robes & Cowls', 'Cloaks', 'Skillcape'],
      unlocks: [
        { level: 1, cat: 'Spinning', title: 'Spin Coarse Fiber Yarn', desc: 'Spin wild botanical fibers at the Celestial Loom into durable thread.', method: 'Celestial Loom', xp: '+25 XP', icon: '🧵' },
        { level: 10, cat: 'Robes & Cowls', title: 'Initiate Acolyte Robes', desc: 'Weave lightweight cotton robes that enhance baseline magical Resonance.', method: 'Celestial Loom', xp: '+55 XP', icon: '👘' },
        { level: 25, cat: 'Cloaks', title: 'Wanderer Travel Cloak', desc: 'Stitch protective traveler capes providing movement stability.', method: 'Celestial Loom', xp: '+85 XP', icon: '🧣' },
        { level: 40, cat: 'Spinning', title: 'Duskveil Silk Spinning', desc: 'Spin void-tainted spider silks from Umbri caverns into gossamer cloth.', method: 'Celestial Loom', xp: '+120 XP', icon: '🕸️' },
        { level: 55, cat: 'Robes & Cowls', title: 'Duskveil Silk Mantle & Hood', desc: 'Tailor stealthy assassin cowls and flowing shadows shrouding the wearer.', method: 'Celestial Loom', xp: '+210 XP', icon: '🥷' },
        { level: 70, cat: 'Robes & Cowls', title: 'Mystic Leystrand Vestments', desc: 'Weave high-resonance robes channelled directly from leyline currents.', method: 'Celestial Loom', xp: '+310 XP', icon: '✨' },
        { level: 85, cat: 'Cloaks', title: 'Celestial Gossamer Cloak', desc: 'Craft ethereal glowing cloaks radiating protective starlight shields.', method: 'Celestial Loom', xp: '+440 XP', icon: '🌟' },
        { level: 99, cat: 'Skillcape', title: 'Skillcape of the Master Weaver', desc: 'Equip the legendary 99 Glimmerweaving Cape. Adds +12% Dodge chance and reduces robe damage taken by 8%.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
    combat_mastery: {
      categories: ['All', 'Wild Beasts', 'Dungeon Sentinels', 'World Bosses', 'Skillcape'],
      unlocks: [
        { level: 1, cat: 'Wild Beasts', title: 'Sanctuary Practice Dummies & Scuttlers', desc: 'Practice weapon rotations on training dummies and shoreline crabs.', method: 'Sanctuary Shoreline', xp: '+35 XP / kill', icon: '🦀' },
        { level: 5, cat: 'Dungeon Sentinels', title: 'Faction Outpost Patrols', desc: 'Defeat Solari Golden Sentinels, Umbri Shadow Stalkers, Terra Wardens, and Aether Golems.', method: 'Faction Biomes', xp: '+65-80 XP', icon: '🛡️' },
        { level: 15, cat: 'World Bosses', title: 'Sub-Zone Mini-Bosses', desc: 'Slay dungeon champions in the Forgotten Ruins, Sunken Vault, and Shadow Labyrinth.', method: 'Sub-Zone Dungeons', xp: '+180-260 XP', icon: '💀' },
        { level: 25, cat: 'World Bosses', title: 'Shattered Nexus Outpost Guardians', desc: 'Participate in the 30-minute scheduled Nexus Siege event in the Warzone.', method: 'Nexus Warzone', xp: '+350 XP', icon: '⚔️' },
        { level: 40, cat: 'Dungeon Sentinels', title: 'Affixed Elite Champions', desc: 'Overcome rare golden elites spawning with lethal affixes (Molten, Vampiric, Shocking, Void).', method: 'World-Wide Spawns', xp: '+320 XP', icon: '🔥' },
        { level: 60, cat: 'World Bosses', title: 'Continental Faction World Bosses', desc: 'Defeat Solari Sun-Lord, Umbri Void Matron, Terra Behemoth, and Aether Chrono-Archon.', method: 'Faction Citadel Basements', xp: '+650 XP', icon: '👑' },
        { level: 75, cat: 'World Bosses', title: 'Mythic+ Keystone Raids', desc: 'Scale infinitely scaling dungeons against the clock with affixes like Fortified, Volcanic, and Tyrannical.', method: 'Keystone Altars', xp: 'Scaled (Up to +2,500 XP)', icon: '🗝️' },
        { level: 88, cat: 'World Bosses', title: 'Starfall Crater & Abyssal Rift Bosses', desc: 'Vanquish the Star-Eater Chimera and the Void Singularity Xal\'Korath in the outer realms.', method: 'Starfall Crater / Abyssal Rift', xp: '+1,200 XP', icon: '🌌' },
        { level: 99, cat: 'Skillcape', title: 'Skillcape of the Continental Champion', desc: 'Equip the legendary 99 Combat Mastery Cape. Grants +25 Attack Power, +15 Bastion, and +5% Life Leech.', method: 'Mastery Vendor / Auto-awarded', xp: 'Level 99 Mastery', icon: '👑' },
      ],
    },
  };

  window.openSkillGuide = function (skillId = 'resonance_extraction', filter = 'all') {
    currentSkillGuideId = skillId;
    currentSkillGuideFilter = filter;
    window.renderSkillGuide(skillId, filter);
    toggleModal('osrs-skill-guide-modal');
  };

  window.renderSkillGuide = function (skillId = currentSkillGuideId, filter = currentSkillGuideFilter) {
    currentSkillGuideId = skillId;
    currentSkillGuideFilter = filter;

    const modal = document.getElementById('osrs-skill-guide-modal');
    if (!modal) return;

    const prog = getProg();
    const prof = prog.professions?.[skillId] || { level: 1, xp: 0 };
    const curLevel = prof.level || 1;
    const pDef = PROFESSIONS_CATALOG[skillId];
    const guideData = SKILL_TRAINING_GUIDES[skillId];
    if (!pDef || !guideData) return;

    const iconEl = document.getElementById('osrs-guide-icon');
    const titleEl = document.getElementById('osrs-guide-title');
    const levelEl = document.getElementById('osrs-guide-level');
    const xpEl = document.getElementById('osrs-guide-xp');
    const navEl = document.getElementById('osrs-guide-nav');
    const listEl = document.getElementById('osrs-guide-list');

    if (iconEl) iconEl.innerText = pDef.icon;
    if (titleEl) {
      titleEl.innerText = pDef.name.toUpperCase();
      titleEl.style.color = pDef.color;
    }
    if (levelEl) levelEl.innerText = `LEVEL ${curLevel} / 99`;
    if (xpEl) xpEl.innerText = `${prof.xp.toLocaleString()} TOTAL XP`;

    if (navEl) {
      navEl.innerHTML = guideData.categories.map((cat) => {
        const isActive = cat.toLowerCase() === filter.toLowerCase();
        return `
          <button class="osrs-filter-btn ${isActive ? 'active' : ''}" onclick="window.renderSkillGuide('${skillId}', '${cat.toLowerCase()}')">
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
          <div class="osrs-unlock-card ${isUnlocked ? 'osrs-unlocked' : 'osrs-locked'}">
            <div class="osrs-level-badge ${isUnlocked ? 'osrs-badge-unlocked' : 'osrs-badge-locked'}">
              ${u.level}
            </div>
            <div>
              <div class="osrs-unlock-title">
                <span>${u.icon}</span>
                <span style="${isUnlocked ? 'color:#f8fafc;' : 'color:#cbd5e1;'}">${u.title}</span>
              </div>
              <div class="osrs-unlock-desc">${u.desc}</div>
              <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:4px;">
                <span class="osrs-xp-badge">${u.xp}</span>
                <span style="font-size:9px; color:#94a3b8;">Station / Method: <b style="color:#e2e8f0;">${u.method}</b></span>
              </div>
            </div>
            <div style="text-align:right;">
              <span class="osrs-status-badge ${isUnlocked ? 'osrs-status-unlocked' : 'osrs-status-locked'}">
                ${isUnlocked ? '✓ UNLOCKED' : `🔒 REQ. LV. ${u.level}`}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  };
}
