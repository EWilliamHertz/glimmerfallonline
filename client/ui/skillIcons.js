// ==========================================
// GlimmerFall Online — Bespoke High-Quality Skill & Mastery Crest Icons
// Crisp multi-layered vector/pixel-inspired emblems with metallic rims & elemental glow
// ==========================================

export const SKILL_ICON_SVGS = {
  // Master HUD Crest — Octagonal Gilded Star-Shield with Crossed Pickaxe, Rune-Blade & Astral Gem
  skills_medallion: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gfMedBg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="55%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="gfMedGold" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="45%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="gfMedGem" x1="12" y1="10" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="50%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>
      <polygon points="11,2 25,2 34,11 34,25 25,34 11,34 2,25 2,11" fill="url(#gfMedBg)" stroke="url(#gfMedGold)" stroke-width="2.2"/>
      <polygon points="12.2,5 23.8,5 31,12.2 31,23.8 23.8,31 12.2,31 5,23.8 5,12.2" fill="none" stroke="#38bdf8" stroke-opacity="0.45" stroke-width="1"/>
      <!-- Crossed Pickaxe Handle & Blade -->
      <path d="M9 27L26 10" stroke="#92400e" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M21 7C24.5 7.5 27.5 10.5 28 14" stroke="#bae6fd" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Crossed Broadsword -->
      <path d="M27 27L10 10" stroke="#e2e8f0" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M22.5 25.5L26.5 21.5" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Central Faceted Starlight Prism -->
      <polygon points="18,9 24,18 18,27 12,18" fill="url(#gfMedGem)" stroke="#fef08a" stroke-width="1.4"/>
      <polygon points="18,12 21.2,18 18,24 14.8,18" fill="#bae6fd" fill-opacity="0.55"/>
      <circle cx="18" cy="6" r="1.4" fill="#fef08a"/>
      <circle cx="18" cy="30" r="1.4" fill="#fef08a"/>
    </svg>
  `,

  // Entity Level Crest — RuneScape-Inspired Crossed Vanguard Blades & Crimson-Gold Crown Shield
  entity_crest: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gfEntShield" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#7f1d1d"/>
          <stop offset="55%" stop-color="#450a0a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
        <linearGradient id="gfEntTrim" x1="4" y1="3" x2="32" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <!-- Crossed Greatswords Behind Shield -->
      <path d="M5 30L31 6" stroke="#f8fafc" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M31 30L5 6" stroke="#f8fafc" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M6 25L11 30M30 25L25 30" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Heater Shield -->
      <path d="M9 8H27V18.5C27 25 22.5 29.5 18 32C13.5 29.5 9 25 9 18.5V8Z" fill="url(#gfEntShield)" stroke="url(#gfEntTrim)" stroke-width="2"/>
      <!-- Radiant Star Emblem -->
      <polygon points="18,11 20.1,16.2 25.5,16.6 21.3,20.1 22.6,25.5 18,22.5 13.4,25.5 14.7,20.1 10.5,16.6 15.9,16.2" fill="#fde047" stroke="#78350f" stroke-width="0.9"/>
    </svg>
  `,

  // Total Skill Level Crest — Grandmaster Laurel Wreath & Seven-Pointed Astral Crown
  total_crest: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gfTotGold" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="14" fill="#081124" stroke="url(#gfTotGold)" stroke-width="2"/>
      <!-- Golden Laurel Branches -->
      <path d="M11 27C7.5 23.5 7 16.5 10.5 11.5" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M25 27C28.5 23.5 29 16.5 25.5 11.5" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Crown -->
      <path d="M11.5 22L10.5 14L15 17.5L18 12L21 17.5L25.5 14L24.5 22H11.5Z" fill="#facc15" stroke="#fef08a" stroke-width="1.1" stroke-linejoin="round"/>
      <rect x="11.5" y="23" width="13" height="2.4" rx="1" fill="#38bdf8"/>
      <circle cx="18" cy="17.5" r="1.5" fill="#0284c7"/>
    </svg>
  `,

  // 1. Combat Mastery — Crimson Vanguard Shield & Twin Crossed Blades
  combat_mastery: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 26L26 5" stroke="#e2e8f0" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M27 26L6 5" stroke="#cbd5e1" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M5 21L10 26M27 21L22 26" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M8.5 8H23.5V16.8C23.5 22.2 19.8 25.8 16 28C12.2 25.8 8.5 22.2 8.5 16.8V8Z" fill="#7f1d1d" stroke="#ef4444" stroke-width="1.8"/>
      <path d="M16 10.5L19.5 17.5L16 23.5L12.5 17.5L16 10.5Z" fill="#fca5a5" stroke="#fef08a" stroke-width="1"/>
    </svg>
  `,

  // 2. Rites — Solar-Gold Channeled Ritual Scepter & Sunburst Halo
  rites: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="14" r="9.5" stroke="#f59e0b" stroke-opacity="0.5" stroke-width="1.4" stroke-dasharray="2.5 2"/>
      <!-- Sunburst Rays -->
      <path d="M16 2.5V6M16 22V25.5M4.5 14H8M24 14H27.5M8 6L10.5 8.5M21.5 19.5L24 22M24 6L21.5 8.5M10.5 19.5L8 22" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Scepter Staff -->
      <path d="M16 18V29.5" stroke="#b45309" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M12.5 22H19.5" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
      <!-- Radiant Sun Core -->
      <circle cx="16" cy="14" r="5.5" fill="#f59e0b" stroke="#fef08a" stroke-width="1.8"/>
      <circle cx="16" cy="14" r="2.4" fill="#ffffff"/>
    </svg>
  `,

  // 3. Flashes — Electric Cyan Twin Lightning Reflex Blades & Chrono-Spark
  flashes: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Speed Arcs -->
      <path d="M5 18C6.5 10 13 5 21 5.5" stroke="#38bdf8" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M27 14C25.5 22 19 27 11 26.5" stroke="#818cf8" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Primary Lightning Bolt Blade -->
      <polygon points="18.5,2.5 8,16.5 15,16.5 12.5,29.5 24.5,14.5 17.2,14.5" fill="#06b6d4" stroke="#e0f2fe" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="17.2,7.5 11.8,15.2 15.8,15.2 14.5,23.5 21,15.6 16.6,15.6" fill="#cffafe"/>
    </svg>
  `,

  // 4. Resonance Extraction — Luminous Crystalline Leyline Cluster & Star-Pickaxe
  resonance_extraction: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Left & Right Leyline Shards -->
      <polygon points="8,26 5,15 9.5,11 12.5,24" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.2"/>
      <polygon points="24,26 27,15 22.5,11 19.5,24" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.2"/>
      <!-- Tall Central Leyline Crystal -->
      <polygon points="16,3 21.5,11.5 19.5,27 12.5,27 10.5,11.5" fill="#38bdf8" stroke="#e0f2fe" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="16,5.5 18.8,12 17.5,25 16,25" fill="#bae6fd" fill-opacity="0.7"/>
      <!-- Base Pedestal Glow -->
      <ellipse cx="16" cy="27.5" rx="9" ry="2" fill="#38bdf8" fill-opacity="0.45"/>
      <circle cx="7" cy="7" r="1.3" fill="#fef08a"/>
      <circle cx="25" cy="8" r="1.1" fill="#e0f2fe"/>
    </svg>
  `,

  // 5. Relic-Forging — Blazing Cosmic Star-Anvil & Forgemaster Hammer
  relic_forging: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Forgemaster Hammer Overhead -->
      <path d="M12 13L23 4" stroke="#92400e" stroke-width="2.6" stroke-linecap="round"/>
      <rect x="19.5" y="2.5" width="7.5" height="4.5" rx="1" transform="rotate(38 19.5 2.5)" fill="#cbd5e1" stroke="#f8fafc" stroke-width="1.1"/>
      <!--Forge Sparks -->
      <circle cx="11" cy="8" r="1.3" fill="#fde047"/>
      <circle cx="15" cy="10" r="1.1" fill="#fb923c"/>
      <circle cx="8" cy="12" r="1" fill="#fef08a"/>
      <!-- Cosmic Anvil -->
      <path d="M4 17H25.5C27.5 17 28.5 18.8 26 20.5L21.5 22V25.5H24.5V28.5H7.5V25.5H10.5V22L4 19.5V17Z" fill="#ea580c" stroke="#fed7aa" stroke-width="1.4" stroke-linejoin="round"/>
      <rect x="10" y="18.2" width="12" height="1.8" rx="0.8" fill="#fef08a"/>
    </svg>
  `,

  // 6. Rite-Binding — Arcane Runic Codex & Bubbling Aetherial Phial
  rite_binding: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Open Runic Tome Backplate -->
      <path d="M4.5 8.5C8.5 7.5 13 8.5 16 10.5C19 8.5 23.5 7.5 27.5 8.5V24.5C23.5 23.5 19 24.5 16 26.5C13 24.5 8.5 23.5 4.5 24.5V8.5Z" fill="#3b0764" stroke="#c084fc" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M16 10.5V26.5" stroke="#e9d5ff" stroke-width="1.2"/>
      <!-- Glowing Aetherial Potion Flask Center -->
      <path d="M14 5.5H18V9.5L22 16.5C22.8 18 21.8 20.5 19.8 20.5H12.2C10.2 20.5 9.2 18 10 16.5L14 9.5V5.5Z" fill="#9333ea" stroke="#f3e8ff" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M11.2 16.5H20.8L19.8 19H12.2L11.2 16.5Z" fill="#e879f9"/>
      <circle cx="16" cy="14" r="1.2" fill="#fef08a"/>
    </svg>
  `,

  // 7. Glimmerweaving — Emerald Celestial Spindle, Golden Needle & Starlight Weave
  glimmerweaving: `
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Flowing Starlight Silk Ribbon -->
      <path d="M5 23C9 15 15 26 20 17C23 11.5 26.5 12 28 9" stroke="#4ade80" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M6 26C11 19 17 28 23 19C25.5 15 27 15 28.5 13" stroke="#86efac" stroke-opacity="0.65" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Celestial Wooden/Emerald Spool -->
      <rect x="8" y="6" width="10" height="3" rx="1.2" fill="#ca8a04" stroke="#fef08a" stroke-width="1"/>
      <rect x="9.5" y="9" width="7" height="10" rx="1" fill="#16a34a" stroke="#bbf7d0" stroke-width="1.2"/>
      <path d="M9.5 12H16.5M9.5 15.5H16.5" stroke="#dcfce7" stroke-width="1.1"/>
      <rect x="8" y="19" width="10" height="3" rx="1.2" fill="#ca8a04" stroke="#fef08a" stroke-width="1"/>
      <!-- Golden Weaver Needle -->
      <path d="M18 25L26.5 5.5" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
      <circle cx="25.5" cy="7.5" r="1.2" fill="#052e16"/>
    </svg>
  `,
};

export function getSkillIconSvg(skillId, size = 26) {
  const raw = SKILL_ICON_SVGS[skillId] || SKILL_ICON_SVGS.skills_medallion;
  return `<span class="gf-skill-svg-wrap" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${raw}</span>`;
}
