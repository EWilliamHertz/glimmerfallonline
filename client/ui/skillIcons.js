// ==========================================
// GlimmerFall Online — Bespoke High-Quality Skill & Mastery Crest Icons
// Crisp multi-layered vector emblems with metallic trims, rich gradients & elemental glow
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

  // Entity Level Crest — Crossed Vanguard Blades & Crimson-Gold Crown Shield
  entity_crest: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gfEntShield" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#991b1b"/>
          <stop offset="45%" stop-color="#7f1d1d"/>
          <stop offset="100%" stop-color="#2a0808"/>
        </linearGradient>
        <linearGradient id="gfEntTrim" x1="4" y1="3" x2="32" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="45%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="gfBlade" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="60%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
      </defs>
      <!-- Crossed Greatswords Behind Shield -->
      <path d="M4 32L32 4" stroke="url(#gfBlade)" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M32 32L4 4" stroke="url(#gfBlade)" stroke-width="2.8" stroke-linecap="round"/>
      <!-- Sword Guards & Pommels -->
      <path d="M5 26L11 32M31 26L25 32" stroke="#facc15" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="4" cy="32" r="1.6" fill="#fde047"/>
      <circle cx="32" cy="32" r="1.6" fill="#fde047"/>
      <!-- Layered Heater Shield -->
      <path d="M8 7H28V18.5C28 25.5 23 30.5 18 33C13 30.5 8 25.5 8 18.5V7Z" fill="url(#gfEntShield)" stroke="url(#gfEntTrim)" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M10.5 9.5H25.5V18C25.5 23.5 21.5 27.8 18 30C14.5 27.8 10.5 23.5 10.5 18V9.5Z" fill="none" stroke="#fca5a5" stroke-opacity="0.3" stroke-width="1"/>
      <!-- Radiant Vanguard Star Emblem -->
      <polygon points="18,11 20.3,16.2 26,16.8 21.6,20.5 23,26 18,22.8 13,26 14.4,20.5 10,16.8 15.7,16.2" fill="#fde047" stroke="#78350f" stroke-width="1"/>
      <circle cx="18" cy="18.5" r="2.2" fill="#ffffff"/>
    </svg>
  `,

  // Total Skill Level Crest — Grandmaster Laurel Wreath & Seven-Pointed Astral Crown
  total_crest: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gfTotGold" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#facc15"/>
          <stop offset="85%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <linearGradient id="gfCrown" x1="8" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="60%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="15" fill="#060c1c" stroke="url(#gfTotGold)" stroke-width="2.2"/>
      <circle cx="18" cy="18" r="12.5" fill="none" stroke="#38bdf8" stroke-opacity="0.3" stroke-width="1"/>
      <!-- Golden Laurel Branches -->
      <path d="M10 28C6.5 23.5 6 15.5 10.5 10" stroke="#facc15" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M26 28C29.5 23.5 30 15.5 25.5 10" stroke="#facc15" stroke-width="2.4" stroke-linecap="round"/>
      <!-- Sovereign 5-Point Crown -->
      <path d="M11 23L9.5 14L14.5 18L18 11.5L21.5 18L26.5 14L25 23H11Z" fill="url(#gfCrown)" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>
      <rect x="10.5" y="23.5" width="15" height="3" rx="1.2" fill="#0284c7" stroke="#38bdf8" stroke-width="0.8"/>
      <!-- Crown Jewels -->
      <circle cx="18" cy="25" r="1.1" fill="#fde047"/>
      <circle cx="14" cy="25" r="0.9" fill="#ef4444"/>
      <circle cx="22" cy="25" r="0.9" fill="#22c55e"/>
      <circle cx="18" cy="12" r="1.2" fill="#fff"/>
    </svg>
  `,

  // 1. Combat Mastery (Red #ef4444) — Masterwork Broadswords, Crimson Heater Shield & Golden Lion Crest
  combat_mastery: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cmShieldBg" x1="8" y1="5" x2="28" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#b91c1c"/>
          <stop offset="50%" stop-color="#7f1d1d"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </linearGradient>
        <linearGradient id="cmSteel" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="50%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#64748b"/>
        </linearGradient>
        <linearGradient id="cmGold" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <!-- Crossed Heavy War-Blades Behind Shield -->
      <path d="M4 32L32 4" stroke="url(#cmSteel)" stroke-width="3" stroke-linecap="round"/>
      <path d="M32 32L4 4" stroke="url(#cmSteel)" stroke-width="3" stroke-linecap="round"/>
      <!-- Sword Crossguards & Pommels -->
      <path d="M5 25L12 32M31 25L24 32" stroke="url(#cmGold)" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="4" cy="32" r="1.8" fill="#fde047"/>
      <circle cx="32" cy="32" r="1.8" fill="#fde047"/>
      <!-- Crimson & Gold Vanguard Shield -->
      <path d="M8 7H28V18.5C28 25.5 23 30.5 18 33C13 30.5 8 25.5 8 18.5V7Z" fill="url(#cmShieldBg)" stroke="url(#cmGold)" stroke-width="2" stroke-linejoin="round"/>
      <path d="M10.5 9.5H25.5V17.5C25.5 23.5 21.5 27.5 18 29.5C14.5 27.5 10.5 23.5 10.5 17.5V9.5Z" fill="none" stroke="#f87171" stroke-opacity="0.35" stroke-width="1"/>
      <!-- Central Golden Lionhead / Phoenix Insignia -->
      <polygon points="18,11.5 21,17 26,17.5 22,21 23.5,26.5 18,23.5 12.5,26.5 14,21 10,17.5 15,17" fill="#fde047" stroke="#78350f" stroke-width="0.9"/>
      <circle cx="18" cy="18" r="2" fill="#ef4444" stroke="#fff" stroke-width="0.8"/>
    </svg>
  `,

  // 2. Rites (Amber #f59e0b) — Solar-Gold Channeled Scepter, Radiant Halo & Channeled Invocations
  rites: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rtSun" x1="8" y1="4" x2="28" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <radialGradient id="rtGlow" cx="18" cy="14" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fde047" stop-opacity="0.8"/>
          <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#b45309" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Radiating Solar Aura Ring -->
      <circle cx="18" cy="14" r="12" fill="url(#rtGlow)"/>
      <circle cx="18" cy="14" r="11" stroke="#f59e0b" stroke-opacity="0.6" stroke-width="1.2" stroke-dasharray="3 2"/>
      <!-- 8-Point Sunburst Rays -->
      <path d="M18 1.5V5M18 23V26.5M5.5 14H9M27 14H30.5M9 5L11.8 7.8M24.2 20.2L27 23M27 5L24.2 7.8M11.8 20.2L9 23" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
      <!-- Ornate Scepter Shaft -->
      <path d="M18 19V34" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
      <path d="M18 20V33" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Scepter Crosswing Guards -->
      <path d="M13 24.5H23" stroke="#facc15" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="13" cy="24.5" r="1.3" fill="#fde047"/>
      <circle cx="23" cy="24.5" r="1.3" fill="#fde047"/>
      <!-- Blazing Central Sun Core & Facets -->
      <circle cx="18" cy="14" r="6.5" fill="url(#rtSun)" stroke="#fff" stroke-width="1.5"/>
      <polygon points="18,9.5 21.5,14 18,18.5 14.5,14" fill="#ffffff" fill-opacity="0.85"/>
      <circle cx="18" cy="14" r="2.2" fill="#fff"/>
    </svg>
  `,

  // 3. Flashes (Cyan #06b6d4) — Supersonic Lightning Blades, Chrono-Dial & Kinetic Flash
  flashes: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="flBolt" x1="6" y1="2" x2="30" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="30%" stop-color="#67e8f9"/>
          <stop offset="70%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#0e7490"/>
        </linearGradient>
        <linearGradient id="flRing" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#cffafe"/>
          <stop offset="50%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
      </defs>
      <!-- Chrono Speed Arcs -->
      <path d="M4 21C6 11 14 5 23 5" stroke="url(#flRing)" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 15C30 25 22 31 13 31" stroke="url(#flRing)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="23" cy="5" r="1.6" fill="#cffafe"/>
      <circle cx="13" cy="31" r="1.6" fill="#cffafe"/>
      <!-- Twin Jagged Lightning Strike Blades -->
      <polygon points="21,2 8,18 16,18 13,34 28,16 19,16" fill="url(#flBolt)" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- Inner Electric Core Highlight -->
      <polygon points="20,6 11.5,17 16.5,17 14.5,27 24,17 18.5,17" fill="#ffffff" fill-opacity="0.9"/>
      <!-- Speed Shards -->
      <path d="M28 8L33 13M3 23L8 28" stroke="#38bdf8" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `,

  // 4. Resonance Extraction (Sky Blue #38bdf8) — Prismatic Leyline Cluster, Star-Pickaxe & Crystal Bedrock
  resonance_extraction: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="reCryMain" x1="10" y1="3" x2="26" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="35%" stop-color="#7dd3fc"/>
          <stop offset="75%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#082f49"/>
        </linearGradient>
        <linearGradient id="rePick" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
      </defs>
      <!-- Bedrock Base Shards -->
      <polygon points="4,32 11,26 25,26 32,32 18,34" fill="#0f172a" stroke="#334155" stroke-width="1.4"/>
      <!-- Flanking Crystalline Shards -->
      <polygon points="8,28 5,16 10,11 13,26" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.3"/>
      <polygon points="28,28 31,16 26,11 23,26" fill="#0284c7" stroke="#7dd3fc" stroke-width="1.3"/>
      <!-- Tall Central Prismatic Leyline Crystal -->
      <polygon points="18,3 24.5,12 22,29 14,29 11.5,12" fill="url(#reCryMain)" stroke="#e0f2fe" stroke-width="1.8" stroke-linejoin="round"/>
      <polygon points="18,6 21.5,12.5 19.8,27 18,27" fill="#ffffff" fill-opacity="0.8"/>
      <!-- Surveyor Star-Pickaxe Striking the Apex -->
      <path d="M12 21L29 4" stroke="#78350f" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M23 2C27 2.5 30.5 6 31 10" stroke="url(#rePick)" stroke-width="2.8" stroke-linecap="round"/>
      <!-- Radiant Impact Sparks -->
      <circle cx="18" cy="3" r="1.8" fill="#fef08a"/>
      <circle cx="13" cy="6" r="1.3" fill="#e0f2fe"/>
      <circle cx="23" cy="7" r="1.3" fill="#ffffff"/>
    </svg>
  `,

  // 5. Relic-Forging (Orange #f97316) — Molten Star-Anvil, Forgemaster Hammer & Volcanic Sparks
  relic_forging: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rfAnvil" x1="4" y1="16" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ea580c"/>
          <stop offset="50%" stop-color="#c2410c"/>
          <stop offset="100%" stop-color="#431407"/>
        </linearGradient>
        <linearGradient id="rfHammer" x1="10" y1="2" x2="30" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
      </defs>
      <!-- Heavy Forgemaster Warhammer -->
      <path d="M13 15L27 3" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
      <rect x="22" y="1" width="9" height="5.5" rx="1.2" transform="rotate(38 22 1)" fill="url(#rfHammer)" stroke="#ffffff" stroke-width="1.3"/>
      <!-- Incandescent Sparks & Rising Embers -->
      <circle cx="12" cy="9" r="1.6" fill="#fde047"/>
      <circle cx="17" cy="11" r="1.3" fill="#fb923c"/>
      <circle cx="8" cy="14" r="1.2" fill="#fef08a"/>
      <circle cx="21" cy="7" r="1.4" fill="#ffffff"/>
      <!-- Molten Star-Anvil with Horn & Waist -->
      <path d="M4 19H30C32.5 19 33.5 21 30.5 23L25 25V28.5H28V32.5H8V28.5H11V25L4 22V19Z" fill="url(#rfAnvil)" stroke="#fed7aa" stroke-width="1.8" stroke-linejoin="round"/>
      <!-- Glowing Red-Hot Ingot on Anvil Surface -->
      <rect x="11" y="20" width="14" height="2.2" rx="1" fill="#fef08a" stroke="#f97316" stroke-width="0.8"/>
      <circle cx="18" cy="21.1" r="1" fill="#ffffff"/>
    </svg>
  `,

  // 6. Rite-Binding (Purple #a855f7) — Runic Grimoire, Swirling Aether Alembic Phial & Astral Dust
  rite_binding: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rbBook" x1="4" y1="8" x2="32" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#581c87"/>
          <stop offset="50%" stop-color="#3b0764"/>
          <stop offset="100%" stop-color="#1e0538"/>
        </linearGradient>
        <linearGradient id="rbPhial" x1="12" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f3e8ff"/>
          <stop offset="45%" stop-color="#c084fc"/>
          <stop offset="100%" stop-color="#9333ea"/>
        </linearGradient>
      </defs>
      <!-- Open Arcane Grimoire Backplate -->
      <path d="M4 10C8.5 8.5 14 9.5 18 12C22 9.5 27.5 8.5 32 10V28C27.5 26.5 22 27.5 18 30C14 27.5 8.5 26.5 4 28V10Z" fill="url(#rbBook)" stroke="#c084fc" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M18 12V30" stroke="#e9d5ff" stroke-width="1.4"/>
      <!-- Mystical Page Lines -->
      <path d="M7 15H15M7 19H14M7 23H15M21 15H29M22 19H29M21 23H29" stroke="#a855f7" stroke-opacity="0.6" stroke-width="1" stroke-linecap="round"/>
      <!-- Glowing Aetherial Alembic Flask -->
      <path d="M15 5H21V10L26 18.5C27 20.5 25.8 23 23.5 23H12.5C10.2 23 9 20.5 10 18.5L15 10V5Z" fill="url(#rbPhial)" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
      <!-- Bubbling Elixir Fluid -->
      <path d="M11.5 18.5H24.5L23.5 21.5H12.5L11.5 18.5Z" fill="#f0abfc"/>
      <circle cx="18" cy="15" r="1.4" fill="#fef08a"/>
      <circle cx="15" cy="18" r="1.1" fill="#ffffff"/>
      <circle cx="21" cy="18" r="0.9" fill="#ffffff"/>
      <!-- Floating Arcane Motes -->
      <circle cx="18" cy="3" r="1.3" fill="#e9d5ff"/>
      <circle cx="26" cy="7" r="1.1" fill="#fbcfe8"/>
    </svg>
  `,

  // 7. Glimmerweaving (Green #22c55e) — Celestial Emerald Loom Spindle, Golden Needle & Starlight Silk
  glimmerweaving: `
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gwSpool" x1="10" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="50%" stop-color="#16a34a"/>
          <stop offset="100%" stop-color="#14532d"/>
        </linearGradient>
        <linearGradient id="gwSilk" x1="4" y1="12" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#bbf7d0"/>
          <stop offset="50%" stop-color="#4ade80"/>
          <stop offset="100%" stop-color="#22c55e"/>
        </linearGradient>
        <linearGradient id="gwGold" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <!-- Flowing S-Curve Starlight Silk Ribbon -->
      <path d="M4 26C9 16 16 30 22 19C25 13 29 14 32 10" stroke="url(#gwSilk)" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M5 30C11 21 18 32 25 22C28 17 30 17 33 14" stroke="#dcfce7" stroke-opacity="0.6" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Masterwork Emerald Spindle -->
      <rect x="9" y="7" width="12" height="3.5" rx="1.5" fill="url(#gwGold)" stroke="#fef08a" stroke-width="1"/>
      <rect x="11" y="10.5" width="8" height="11" rx="1.2" fill="url(#gwSpool)" stroke="#bbf7d0" stroke-width="1.4"/>
      <!-- Thread Lines On Spindle -->
      <path d="M11 13.5H19M11 16H19M11 18.5H19" stroke="#dcfce7" stroke-width="1.2"/>
      <rect x="9" y="21.5" width="12" height="3.5" rx="1.5" fill="url(#gwGold)" stroke="#fef08a" stroke-width="1"/>
      <!-- Golden Tailor's Needle Weaving Through Silk -->
      <path d="M20 28L30 4" stroke="url(#gwGold)" stroke-width="2.4" stroke-linecap="round"/>
      <ellipse cx="28.8" cy="6.8" rx="1" ry="1.6" transform="rotate(22 28.8 6.8)" fill="#052e16"/>
      <circle cx="31" cy="4" r="1.4" fill="#ffffff"/>
    </svg>
  `,
};

export function getSkillIconSvg(skillId, size = 26) {
  const raw = SKILL_ICON_SVGS[skillId] || SKILL_ICON_SVGS.skills_medallion;
  return `<span class="gf-skill-svg-wrap" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${raw}</span>`;
}
