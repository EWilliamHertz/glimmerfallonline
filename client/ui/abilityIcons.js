// ==========================================
// GlimmerFall Online — Bespoke High-Craft Combat Ability & Faction Crest Vector Icons
// Crisp multi-layered 36x36 vector emblems with metallic bevels, specular facets & elemental glow.
// Uses pure inline fills/strokes (zero <defs> IDs) so simultaneous slots never collide on gradient IDs.
// ==========================================

const SVG_OPEN = '<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">';
const SVG_CLOSE = '</svg>';

const FACTION_PALETTES = {
  Solari: {
    bg: '#1c1506',
    frame: '#b45309',
    dark: '#78350f',
    mid: '#f59e0b',
    bright: '#facc15',
    hi: '#fef08a',
    core: '#ffffff',
    accent: '#38bdf8',
  },
  Umbri: {
    bg: '#120722',
    frame: '#6b21a8',
    dark: '#3b0764',
    mid: '#9333ea',
    bright: '#c084fc',
    hi: '#f3e8ff',
    core: '#ffffff',
    accent: '#f43f5e',
  },
  Terra: {
    bg: '#061b0e',
    frame: '#15803d',
    dark: '#14532d',
    mid: '#16a34a',
    bright: '#4ade80',
    hi: '#dcfce7',
    core: '#fef08a',
    accent: '#a3e635',
  },
  Aether: {
    bg: '#06182c',
    frame: '#0284c7',
    dark: '#075985',
    mid: '#0ea5e9',
    bright: '#38bdf8',
    hi: '#e0f2fe',
    core: '#ffffff',
    accent: '#fde047',
  },
  All: {
    bg: '#0f172a',
    frame: '#6366f1',
    dark: '#312e81',
    mid: '#a855f7',
    bright: '#38bdf8',
    hi: '#f3e8ff',
    core: '#ffffff',
    accent: '#fde047',
  },
};

function normalizeFaction(faction) {
  const f = String(faction || '').trim().toLowerCase();
  if (f === 'solari' || f === 'sun') return 'Solari';
  if (f === 'umbri' || f === 'shadow' || f === 'void') return 'Umbri';
  if (f === 'terra' || f === 'terro' || f === 'earth' || f === 'root') return 'Terra';
  if (f === 'aether' || f === 'magic' || f === 'arcane') return 'Aether';
  return 'All';
}

function getPalette(faction, overrideColor = null) {
  const base = FACTION_PALETTES[normalizeFaction(faction)] || FACTION_PALETTES.All;
  if (!overrideColor || typeof overrideColor !== 'string') return base;
  return { ...base, bright: overrideColor };
}

function wrapSvg(inner) {
  return `${SVG_OPEN}${inner}${SVG_CLOSE}`;
}

function medalPlate(p, accentStroke = null) {
  const stroke = accentStroke || p.frame;
  return `
    <circle cx="18" cy="18" r="16" fill="${p.bg}" stroke="${stroke}" stroke-opacity="0.55" stroke-width="1.2"/>
    <circle cx="18" cy="18" r="13" fill="${p.dark}" fill-opacity="0.28"/>
  `;
}

// Shared layered vector kind builders (parameterized by faction palette so unknown/future spells match seamlessly)
const KIND_BUILDERS = {
  melee_cleave: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M5 27C10 31 24 29 31 14" stroke="${p.mid}" stroke-opacity="0.35" stroke-width="6" stroke-linecap="round"/>
    <path d="M6 25C12 29 24 27 30 12" stroke="${p.bright}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M9 27L28 8L31 5L29 10L11 29Z" fill="${p.hi}" stroke="${p.core}" stroke-width="1" stroke-linejoin="round"/>
    <path d="M11 27L29 9" stroke="${p.core}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M7 22L14 29" stroke="${p.bright}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="6" cy="29" r="1.8" fill="${p.bright}"/>
    <circle cx="29" cy="7" r="1.5" fill="${p.core}"/>
  `),

  shield: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M8 6H28V18C28 25.5 23 30.2 18 33C13 30.2 8 25.5 8 18V6Z" fill="${p.dark}" stroke="${p.bright}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M10.5 8.5H25.5V17.6C25.5 23.5 21.6 27.4 18 29.8C14.4 27.4 10.5 23.5 10.5 17.6V8.5Z" fill="${p.mid}" fill-opacity="0.55" stroke="${p.hi}" stroke-opacity="0.65" stroke-width="1"/>
    <polygon points="18,10.5 22.5,18 18,25.5 13.5,18" fill="${p.bright}" stroke="${p.core}" stroke-width="1"/>
    <polygon points="18,13 20.5,18 18,23 15.5,18" fill="${p.core}" fill-opacity="0.85"/>
  `),

  thornbark: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M9 7H27V18.5C27 25 22.5 29.5 18 32C13.5 29.5 9 25 9 18.5V7Z" fill="#3f2311" stroke="${p.bright}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M13 10V25M18 8V29M23 10V25" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M8 12L4 9M8 19L3 20M28 12L32 9M28 19L33 20M18 6L18 2" stroke="${p.hi}" stroke-width="2" stroke-linecap="round"/>
    <polygon points="18,12 21.5,18 18,24 14.5,18" fill="${p.bright}" stroke="${p.core}" stroke-width="1"/>
  `),

  dash: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M4 13H15M3 18H12M5 23H14" stroke="${p.mid}" stroke-width="2" stroke-linecap="round"/>
    <polygon points="13,10 23,18 13,26 17,18" fill="${p.mid}" stroke="${p.hi}" stroke-width="1.2" stroke-linejoin="round"/>
    <polygon points="20,8 32,18 20,28 24.5,18" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="29" cy="18" r="1.8" fill="${p.core}"/>
  `),

  shadow_step: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="11" cy="13" r="3" fill="${p.mid}" fill-opacity="0.5"/>
    <path d="M6 27C6 21 9 17 12 17C15 17 16 21 16 27" fill="${p.dark}" stroke="${p.mid}" stroke-width="1.2"/>
    <path d="M13 18L19 13L17 18L24 13" stroke="${p.hi}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="25" cy="11" r="3.2" fill="${p.bright}" stroke="${p.core}" stroke-width="1.2"/>
    <path d="M20 28C20 21 22.5 16 25.5 16C28.5 16 30.5 21 30.5 28Z" fill="${p.bright}" fill-opacity="0.85" stroke="${p.core}" stroke-width="1.2"/>
  `),

  stealth: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="11" stroke="${p.mid}" stroke-dasharray="3 2.5" stroke-width="1.3"/>
    <path d="M8 29C9 21 12 11 18 7C24 11 27 21 28 29C24 27 21 27 18 29C15 27 12 27 8 29Z" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M13 16C15 13 21 13 23 16C21 20 15 20 13 16Z" fill="#030712" stroke="${p.mid}" stroke-width="1"/>
    <circle cx="15.8" cy="16.2" r="1.2" fill="${p.hi}"/>
    <circle cx="20.2" cy="16.2" r="1.2" fill="${p.hi}"/>
  `),

  cast_beam: (p) => wrapSvg(`
    ${medalPlate(p)}
    <ellipse cx="18" cy="29" rx="11" ry="3.5" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.4"/>
    <polygon points="11,4 25,4 22,29 14,29" fill="${p.mid}" fill-opacity="0.65"/>
    <polygon points="14.5,3 21.5,3 20,29 16,29" fill="${p.bright}"/>
    <rect x="16.8" y="3" width="2.4" height="26" fill="${p.core}"/>
    <circle cx="18" cy="28" r="3" fill="${p.core}"/>
    <path d="M7 10L11 14M29 10L25 14M8 20L12 22M28 20L24 22" stroke="${p.hi}" stroke-width="1.6" stroke-linecap="round"/>
  `),

  projectile: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M5 29L17 17M8 31L20 19M4 25L14 15" stroke="${p.mid}" stroke-width="2" stroke-linecap="round"/>
    <polygon points="14,19 29,6 24,22 19,21" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3" stroke-linejoin="round"/>
    <polygon points="18,17 28,7 22,19" fill="${p.core}" fill-opacity="0.85"/>
    <circle cx="27" cy="8" r="2.2" fill="${p.core}"/>
    <circle cx="12" cy="25" r="1.3" fill="${p.hi}"/>
  `),

  ground_zone: (p) => wrapSvg(`
    ${medalPlate(p)}
    <ellipse cx="18" cy="23" rx="13" ry="6.5" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.8"/>
    <ellipse cx="18" cy="23" rx="8.5" ry="4" fill="${p.mid}" fill-opacity="0.45" stroke="${p.hi}" stroke-width="1"/>
    <path d="M12 22V13M18 24V8M24 22V14" stroke="${p.bright}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="11" r="1.5" fill="${p.core}"/>
    <circle cx="18" cy="7" r="2" fill="${p.core}"/>
    <circle cx="24" cy="12" r="1.5" fill="${p.core}"/>
  `),

  heal: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="12" fill="${p.dark}" fill-opacity="0.6" stroke="${p.bright}" stroke-width="1.6"/>
    <path d="M15 8H21V15H28V21H21V28H15V21H8V15H15V8Z" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M16.5 10H19.5V16.5H26V19.5H19.5V26H16.5V19.5H10V16.5H16.5V10Z" fill="${p.hi}" fill-opacity="0.55"/>
    <circle cx="18" cy="18" r="2.2" fill="${p.core}"/>
    <circle cx="9" cy="9" r="1.3" fill="${p.hi}"/><circle cx="27" cy="27" r="1.3" fill="${p.hi}"/>
  `),

  nova: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="12.5" stroke="${p.mid}" stroke-width="1.6" stroke-dasharray="3.5 2"/>
    <polygon points="18,3 21.5,13 32,12 23.5,19 30,28 20,23.5 18,33 16,23.5 6,28 12.5,19 4,12 14.5,13" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="18" cy="18" r="4.5" fill="${p.hi}"/>
    <circle cx="18" cy="18" r="2.2" fill="${p.core}"/>
  `),

  drain_beam: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="27" cy="10" r="4.5" fill="${p.dark}" stroke="${p.accent}" stroke-width="1.5"/>
    <circle cx="9" cy="26" r="5" fill="${p.mid}" stroke="${p.core}" stroke-width="1.5"/>
    <path d="M24 13C18 13 18 23 12 23" stroke="${p.accent}" stroke-width="3" stroke-linecap="round"/>
    <path d="M23 14C17 15 19 21 13 22" stroke="${p.core}" stroke-width="1.3" stroke-linecap="round"/>
    <polygon points="10,21 15,24 11,27" fill="${p.hi}"/>
    <circle cx="18" cy="18" r="1.8" fill="${p.accent}"/>
  `),

  execute_beam: (p) => wrapSvg(`
    ${medalPlate(p)}
    <polygon points="18,4 29,18 18,32 7,18" fill="${p.dark}" stroke="${p.accent}" stroke-width="1.8"/>
    <path d="M18 3V33M4 18H32" stroke="${p.accent}" stroke-width="2.2" stroke-linecap="round"/>
    <polygon points="18,9 23,18 18,27 13,18" fill="${p.bright}" stroke="${p.core}" stroke-width="1.2"/>
    <path d="M13 13L23 23M23 13L13 23" stroke="${p.core}" stroke-width="1.8" stroke-linecap="round"/>
  `),

  timeloop: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M11 8H25L18 17.5L25 28H11L18 17.5L11 8Z" fill="${p.dark}" stroke="${p.hi}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M14 26H22L18 20L14 26Z" fill="${p.accent}"/>
    <path d="M7 18C7 11.5 12 6.5 18.5 6.5" stroke="${p.bright}" stroke-width="2" stroke-linecap="round"/>
    <polygon points="18,4 22,6.5 18,9" fill="${p.core}"/>
    <path d="M29 18C29 24.5 24 29.5 17.5 29.5" stroke="${p.bright}" stroke-width="2" stroke-linecap="round"/>
    <polygon points="18,27 14,29.5 18,32" fill="${p.core}"/>
  `),

  frost_nova: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="11" stroke="${p.hi}" stroke-opacity="0.6" stroke-width="1.2"/>
    <path d="M18 4V32M6 11L30 25M30 11L6 25" stroke="${p.bright}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M15 7L18 10L21 7M15 29L18 26L21 29M8 14L11 13L10 10M28 22L25 23L26 26M26 10L25 13L28 14M10 26L11 23L8 22" stroke="${p.core}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="18,13 22.5,18 18,23 13.5,18" fill="${p.hi}" stroke="${p.core}" stroke-width="1.2"/>
  `),

  archon_form: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M5 17C5 10 10 8 15 15M31 17C31 10 26 8 21 15" stroke="${p.bright}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M7 22C7 16 11 14 15 19M29 22C29 16 25 14 21 19" stroke="${p.hi}" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 14L10 8L15 11L18 5L21 11L26 8L24 14Z" fill="${p.bright}" stroke="${p.core}" stroke-width="1.2" stroke-linejoin="round"/>
    <polygon points="18,15 23,22 18,30 13,22" fill="${p.mid}" stroke="${p.core}" stroke-width="1.4"/>
    <circle cx="18" cy="21" r="2.2" fill="${p.core}"/>
  `),

  voidform: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M7 10L12 18L6 25M29 10L24 18L30 25" stroke="${p.bright}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11 8C11 13 14 15 18 15C22 15 25 13 25 8C23 11 20 12 18 12C16 12 13 11 11 8Z" fill="${p.hi}"/>
    <polygon points="18,14 24,22 18,31 12,22" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.8"/>
    <circle cx="15.5" cy="21" r="1.4" fill="${p.accent}"/>
    <circle cx="20.5" cy="21" r="1.4" fill="${p.accent}"/>
  `),

  treant_form: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M12 14C9 10 7 6 10 4M14 13C13 9 14 6 16 4M24 14C27 10 29 6 26 4M22 13C23 9 22 6 20 4" stroke="${p.bright}" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 14H24L26 24L22 31H14L10 24Z" fill="#451a03" stroke="${p.bright}" stroke-width="1.8" stroke-linejoin="round"/>
    <polygon points="18,16 22,22 18,28 14,22" fill="${p.bright}" stroke="${p.core}" stroke-width="1.1"/>
    <circle cx="15" cy="18" r="1.2" fill="${p.core}"/>
    <circle cx="21" cy="18" r="1.2" fill="${p.core}"/>
  `),

  apotheosis: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="13" stroke="${p.bright}" stroke-width="1.6"/>
    <ellipse cx="18" cy="18" rx="13" ry="5.5" transform="rotate(-28 18 18)" stroke="${p.hi}" stroke-width="1.4"/>
    <ellipse cx="18" cy="18" rx="13" ry="5.5" transform="rotate(28 18 18)" stroke="${p.accent}" stroke-width="1.4"/>
    <polygon points="18,9 22,18 18,27 14,18" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3"/>
    <circle cx="18" cy="18" r="2.4" fill="${p.core}"/>
  `),

  harvest: (p) => wrapSvg(`
    ${medalPlate(p)}
    <ellipse cx="18" cy="28" rx="10" ry="3.2" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.4"/>
    <polygon points="18,7 24,16 21,27 15,27 12,16" fill="${p.mid}" stroke="${p.hi}" stroke-width="1.6" stroke-linejoin="round"/>
    <polygon points="18,9.5 21.5,16 19.5,25 18,25" fill="${p.hi}" fill-opacity="0.7"/>
    <circle cx="18" cy="5" r="1.6" fill="${p.accent}"/>
    <circle cx="10" cy="13" r="1.4" fill="${p.core}"/>
    <circle cx="26" cy="13" r="1.4" fill="${p.core}"/>
  `),

  reactive_barrier: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M9 8H27V19C27 25.5 22.5 30 18 32C13.5 30 9 25.5 9 19V8Z" fill="${p.dark}" stroke="${p.bright}" stroke-width="2"/>
    <path d="M4 13L12 17L7 22M32 13L24 17L29 22" stroke="${p.hi}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="18" cy="18" r="4" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3"/>
  `),

  cleanse_sprint: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M5 24C11 24 13 13 21 13H30" stroke="${p.bright}" stroke-width="2.6" stroke-linecap="round"/>
    <polygon points="26,8 33,13 26,18" fill="${p.core}"/>
    <path d="M8 14L14 14M6 19L11 19" stroke="${p.hi}" stroke-width="1.8" stroke-linecap="round"/>
    <polygon points="15,20 17,24 21,26 17,28 15,32 13,28 9,26 13,24" fill="${p.core}"/>
  `),

  heal_glimmer: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="19" r="10" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.8"/>
    <path d="M18 12V26M11 19H25" stroke="${p.hi}" stroke-width="3" stroke-linecap="round"/>
    <polygon points="18,4 20.5,8.5 25,11 20.5,13.5 18,18 15.5,13.5 11,11 15.5,8.5" fill="${p.core}" stroke="${p.bright}" stroke-width="1"/>
  `),

  stealth_burst: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="11" fill="${p.dark}" stroke="${p.mid}" stroke-width="1.5" stroke-dasharray="4 2"/>
    <path d="M8 21C11 13 25 13 28 21C24 26 12 26 8 21Z" fill="#030712" stroke="${p.bright}" stroke-width="1.6"/>
    <circle cx="14.5" cy="19" r="1.4" fill="${p.hi}"/>
    <circle cx="21.5" cy="19" r="1.4" fill="${p.hi}"/>
    <circle cx="10" cy="10" r="1.6" fill="${p.accent}"/>
    <circle cx="26" cy="26" r="1.6" fill="${p.accent}"/>
  `),

  dash_cleave: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M5 24C10 12 22 7 31 12C24 14 17 20 14 30Z" fill="${p.bright}" stroke="${p.core}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M5 12L14 12M3 17L10 17" stroke="${p.hi}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="28" cy="12" r="2" fill="${p.core}"/>
  `),

  scythe_wave: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M6 26C10 10 23 5 31 13C24 13 15 18 11 29Z" fill="${p.mid}" stroke="${p.hi}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M10 29C14 17 22 13 30 17" stroke="${p.core}" stroke-width="2" stroke-linecap="round"/>
  `),

  singularity_collapse: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="12" stroke="${p.mid}" stroke-width="1.5" stroke-dasharray="3 2"/>
    <circle cx="18" cy="18" r="7.5" fill="#020617" stroke="${p.bright}" stroke-width="2"/>
    <path d="M5 8L12 14M31 8L24 14M5 28L12 22M31 28L24 22" stroke="${p.hi}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="2.2" fill="${p.core}"/>
  `),

  iron_fortify: (p) => wrapSvg(`
    ${medalPlate(p)}
    <rect x="8" y="8" width="20" height="20" rx="3" fill="${p.dark}" stroke="${p.bright}" stroke-width="2"/>
    <path d="M12 8V28M24 8V28M8 15H28M8 22H28" stroke="${p.hi}" stroke-opacity="0.55" stroke-width="1.4"/>
    <circle cx="18" cy="18" r="3.5" fill="${p.bright}" stroke="${p.core}" stroke-width="1.2"/>
  `),

  bramble_burst: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="9" stroke="${p.mid}" stroke-width="2.5"/>
    <path d="M18 4L20 11M18 32L16 25M4 18L11 16M32 18L25 20M8 8L13 13M28 28L23 23M28 8L23 13M8 28L13 23" stroke="${p.hi}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="3.5" fill="${p.bright}" stroke="${p.core}" stroke-width="1.2"/>
  `),

  colossus_stomp: (p) => wrapSvg(`
    ${medalPlate(p)}
    <rect x="11" y="5" width="14" height="14" rx="2.5" fill="${p.mid}" stroke="${p.hi}" stroke-width="1.8"/>
    <path d="M6 25L12 22L18 27L24 22L30 25" stroke="${p.bright}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 30H32" stroke="${p.core}" stroke-width="1.8" stroke-linecap="round"/>
  `),

  fissure_line: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M5 30L13 21L16 24L23 14L26 17L31 6" stroke="${p.core}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="10,20 14,13 17,19" fill="${p.bright}"/>
    <polygon points="18,14 23,7 25,14" fill="${p.hi}"/>
  `),

  continental_quake: (p) => wrapSvg(`
    ${medalPlate(p)}
    <polygon points="5,26 11,12 17,22 24,9 31,26" fill="${p.dark}" stroke="${p.bright}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M4 28L12 25L18 30L25 25L32 28" stroke="${p.core}" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="18" cy="11" r="2.2" fill="${p.hi}"/>
  `),

  ethereal_jaunt: (p) => wrapSvg(`
    ${medalPlate(p)}
    <ellipse cx="18" cy="18" rx="11" ry="11" stroke="${p.hi}" stroke-dasharray="3 3" stroke-width="1.6"/>
    <path d="M12 27C12 19 14 10 18 8C22 10 24 19 24 27C21 25 15 25 12 27Z" fill="${p.bright}" fill-opacity="0.55" stroke="${p.core}" stroke-width="1.5"/>
    <circle cx="18" cy="15" r="2" fill="${p.core}"/>
  `),

  rift_teleport: (p) => wrapSvg(`
    ${medalPlate(p)}
    <ellipse cx="18" cy="18" rx="6.5" ry="12" fill="${p.dark}" stroke="${p.bright}" stroke-width="2"/>
    <ellipse cx="18" cy="18" rx="3" ry="8" fill="${p.hi}" fill-opacity="0.65"/>
    <path d="M5 18H13M23 18H31" stroke="${p.core}" stroke-width="2" stroke-linecap="round"/>
  `),

  supernova: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="12" stroke="${p.bright}" stroke-width="1.4"/>
    <circle cx="18" cy="18" r="8" stroke="${p.hi}" stroke-width="1.4" stroke-dasharray="2.5 2"/>
    <polygon points="18,4 20.8,15.2 32,18 20.8,20.8 18,32 15.2,20.8 4,18 15.2,15.2" fill="${p.core}" stroke="${p.bright}" stroke-width="1.2"/>
  `),

  stasis_bubble: (p) => wrapSvg(`
    ${medalPlate(p)}
    <circle cx="18" cy="18" r="12" fill="${p.dark}" fill-opacity="0.75" stroke="${p.bright}" stroke-width="2"/>
    <circle cx="18" cy="18" r="8" stroke="${p.hi}" stroke-opacity="0.7" stroke-width="1.2"/>
    <path d="M18 12V18L22 21" stroke="${p.core}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="1.4" fill="${p.core}"/>
  `),

  shardburst: (p) => wrapSvg(`
    ${medalPlate(p)}
    <polygon points="18,4 21,14 15,14" fill="${p.bright}" stroke="${p.core}" stroke-width="1.1"/>
    <polygon points="32,18 22,21 22,15" fill="${p.bright}" stroke="${p.core}" stroke-width="1.1"/>
    <polygon points="18,32 21,22 15,22" fill="${p.mid}" stroke="${p.hi}" stroke-width="1.1"/>
    <polygon points="4,18 14,21 14,15" fill="${p.mid}" stroke="${p.hi}" stroke-width="1.1"/>
    <polygon points="28,8 22,17 19,14" fill="${p.hi}"/>
    <polygon points="8,28 17,22 14,19" fill="${p.hi}"/>
    <circle cx="18" cy="18" r="2.8" fill="${p.core}"/>
  `),

  tempest_thorns: (p) => wrapSvg(`
    ${medalPlate(p)}
    <path d="M8 11H28L24 18H12L22 25H14L18 31" stroke="${p.bright}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7 14L4 11M29 14L32 11M25 22L30 22M11 22L6 22" stroke="${p.accent}" stroke-width="1.8" stroke-linecap="round"/>
  `),
};

export const ABILITY_ICON_SVGS = {
  // ==========================================
  // SOLARI — Current Catalog (15)
  // ==========================================
  flare_strike: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M6 24C11 30 24 29 31 15" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M7 23C13 28 24 27 30 13" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M10 27L28 9L32 5L27 7L8 25Z" fill="#facc15" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M12 24L29 7" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M6 21L14 29" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="6" cy="29" r="1.8" fill="#fde047"/>
    <circle cx="22" cy="9" r="1.3" fill="#fef08a"/>
    <circle cx="29" cy="16" r="1.2" fill="#ffffff"/>
  `),

  radiant_bulwark: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#38bdf8')}
    <path d="M8 6H28V18.5C28 25.5 23 30.2 18 33C13 30.2 8 25.5 8 18.5V6Z" fill="#0c2d5c" stroke="#facc15" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M10.5 8.5H25.5V18C25.5 23.6 21.6 27.6 18 29.9C14.4 27.6 10.5 23.6 10.5 18V8.5Z" fill="#0284c7" fill-opacity="0.65" stroke="#bae6fd" stroke-width="1"/>
    <polygon points="18,10.5 20.5,16 26,16.5 21.5,20 23,25.5 18,22.2 13,25.5 14.5,20 10,16.5 15.5,16" fill="#fde047" stroke="#ffffff" stroke-width="0.9"/>
    <circle cx="18" cy="18" r="2" fill="#ffffff"/>
  `),

  solar_intervene: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M4 14H14M4 21H12" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    <path d="M11 26L23 8L19 17H27L15 30L18 20H11Z" fill="#facc15" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M23 19H31V24.5C31 28 28.5 30.2 27 31.5C25.5 30.2 23 28 23 24.5V19Z" fill="#0284c7" stroke="#fef08a" stroke-width="1.3"/>
  `),

  blinding_radiance: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#bae6fd')}
    <path d="M18 3V10M18 26V33M3 18H10M26 18H33M7.5 7.5L12.5 12.5M23.5 23.5L28.5 28.5M28.5 7.5L23.5 12.5M12.5 23.5L7.5 28.5" stroke="#fde047" stroke-width="2.1" stroke-linecap="round"/>
    <polygon points="18,9 22,14 27,18 22,22 18,27 14,22 9,18 14,14" fill="#bae6fd" stroke="#ffffff" stroke-width="1.4"/>
    <circle cx="18" cy="18" r="3.6" fill="#ffffff"/>
  `),

  sun_aegis_rebuke: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M9 7H27V18.5C27 25 22.8 29.8 18 32C13.2 29.8 9 25 9 18.5V7Z" fill="#78350f" stroke="#facc15" stroke-width="2"/>
    <circle cx="18" cy="18" r="5.5" fill="#f59e0b" stroke="#fef08a" stroke-width="1.4"/>
    <path d="M4 12L10 16L5 20M32 12L26 16L31 20" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="18" cy="18" r="2.2" fill="#ffffff"/>
  `),

  aurora_stride: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#7dd3fc')}
    <path d="M4 25C10 25 13 12 22 12H31" stroke="#38bdf8" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M6 29C12 29 15 17 24 17H30" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
    <polygon points="26,7 33,12 26,17" fill="#fef08a" stroke="#ffffff" stroke-width="1"/>
    <path d="M12 11L17 8L15 14" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  `),

  solar_ascension: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M4 15C5 8 11 7 15 15M32 15C31 8 25 7 21 15" stroke="#fde047" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M6 21C7 15 11 14 15 19M30 21C29 15 25 14 21 19" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 13L10 6L15 10L18 4L21 10L26 6L24 13Z" fill="#facc15" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
    <polygon points="18,14 23,22 18,31 13,22" fill="#f59e0b" stroke="#fef08a" stroke-width="1.4"/>
    <circle cx="18" cy="21" r="2.5" fill="#ffffff"/>
  `),

  solar_flare: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <ellipse cx="18" cy="29" rx="11" ry="3.5" fill="#78350f" stroke="#fbbf24" stroke-width="1.5"/>
    <polygon points="11,3 25,3 22,29 14,29" fill="#f59e0b" fill-opacity="0.7"/>
    <polygon points="14,3 22,3 20.5,29 15.5,29" fill="#fde047"/>
    <rect x="16.8" y="3" width="2.4" height="26" fill="#ffffff"/>
    <path d="M8 10L12 14M28 10L24 14M7 22L12 24M29 22L24 24" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>
  `),

  judgement_of_the_sun: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M9 28L23 14" stroke="#92400e" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="17" y="6" width="12" height="8" rx="1.6" transform="rotate(42 23 10)" fill="#facc15" stroke="#ffffff" stroke-width="1.4"/>
    <path d="M7 13C11 6 22 4 29 9" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.5 2"/>
    <circle cx="24" cy="11" r="2" fill="#ffffff"/>
  `),

  blessing_of_dawn: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#4ade80')}
    <path d="M11 15H25L23 23C22 25.5 20 27 18 27C16 27 14 25.5 13 23Z" fill="#f59e0b" stroke="#fef08a" stroke-width="1.5"/>
    <path d="M14 29H22M18 27V29" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M18 6V13M14.5 9.5H21.5" stroke="#4ade80" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="10" cy="10" r="1.4" fill="#fef08a"/><circle cx="26" cy="10" r="1.4" fill="#86efac"/>
  `),

  consecrated_ground: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#fb923c')}
    <ellipse cx="18" cy="24" rx="13" ry="6" fill="#431407" stroke="#fb923c" stroke-width="1.8"/>
    <polygon points="18,19 25,24 18,29 11,24" fill="none" stroke="#fde047" stroke-width="1.3"/>
    <path d="M12 22C11 17 13 13 14 10C15.5 13 16 17 15 22M18 23C17 16 18 10 19.5 6C21 10 21 16 19.5 23M23 22C22 17 24 13 25 11C26 14 26 17 25 22" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="18" cy="9" r="1.6" fill="#ffffff"/>
  `),

  decree_of_the_sun: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <rect x="9" y="8" width="18" height="20" rx="2" fill="#422006" stroke="#fde047" stroke-width="1.8"/>
    <path d="M12 13H24M12 17H21" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="18" cy="23" r="4.5" fill="#facc15" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="18" cy="23" r="1.8" fill="#ffffff"/>
    <path d="M5 18H8M28 18H31" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
  `),

  daybreak: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M4 25L12 18L18 23L25 17L32 25V30H4Z" fill="#78350f" stroke="#f59e0b" stroke-width="1.4"/>
    <path d="M10 21C10 16.5 13.5 13 18 13C22.5 13 26 16.5 26 21" fill="#fde047" stroke="#ffffff" stroke-width="1.5"/>
    <path d="M18 4V10M9 8L12.5 11.5M27 8L23.5 11.5M5 15H9M27 15H31" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>
  `),

  wrath_of_the_daystar: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <circle cx="18" cy="18" r="12" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="3 2"/>
    <polygon points="18,3 21.5,13.5 32,10 24,18 32,26 21.5,22.5 18,33 14.5,22.5 4,26 12,18 4,10 14.5,13.5" fill="#facc15" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="18" cy="18" r="4" fill="#ffffff"/>
  `),

  corona_cataclysm: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <circle cx="18" cy="11" r="6.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.6"/>
    <polygon points="12,15 24,15 27,32 9,32" fill="#facc15" fill-opacity="0.72"/>
    <polygon points="15,15 21,15 22.5,32 13.5,32" fill="#ffffff"/>
    <path d="M6 11H10M26 11H30M9 5L12 8M27 5L24 8" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
    <ellipse cx="18" cy="31" rx="11" ry="2.8" stroke="#fde047" stroke-width="1.4"/>
  `),

  // ==========================================
  // UMBRI — Current Catalog (13)
  // ==========================================
  whisper_of_the_void: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <path d="M6 26C9 14 19 8 29 7C21 12 16 19 14 29Z" fill="#a855f7" stroke="#f3e8ff" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M30 26C27 14 17 8 7 7C15 12 20 19 22 29Z" fill="#7e22ce" fill-opacity="0.85" stroke="#e879f9" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="18" cy="15" r="2.2" fill="#ffffff"/>
  `),

  graveglass_ward: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <polygon points="18,4 28,11 26,25 18,32 10,25 8,11" fill="#2e1065" stroke="#c084fc" stroke-width="2" stroke-linejoin="round"/>
    <polygon points="18,8 24,13 22.5,23 18,28 13.5,23 12,13" fill="#9333ea" fill-opacity="0.65" stroke="#f3e8ff" stroke-width="1.1"/>
    <polygon points="18,12 21,18 18,24 15,18" fill="#ffffff" fill-opacity="0.85"/>
  `),

  veil_of_dusk: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <path d="M7 29C8 19 12 8 18 6C24 8 28 19 29 29C24 26 21 26 18 29C15 26 12 26 7 29Z" fill="#1e0538" stroke="#c084fc" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M12 17C14.5 13.5 21.5 13.5 24 17C21.5 20.5 14.5 20.5 12 17Z" fill="#030712"/>
    <circle cx="15.5" cy="17" r="1.4" fill="#e879f9"/>
    <circle cx="20.5" cy="17" r="1.4" fill="#e879f9"/>
    <path d="M5 14C7 11 9 11 10 13M26 13C27 11 29 11 31 14" stroke="#9333ea" stroke-width="1.5" stroke-linecap="round"/>
  `),

  shadow_step: KIND_BUILDERS.shadow_step(FACTION_PALETTES.Umbri),

  abyssal_shroud: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <circle cx="18" cy="18" r="12" fill="#1e0538" stroke="#9333ea" stroke-width="1.6" stroke-dasharray="4 2.5"/>
    <path d="M8 22C11 14 15 11 18 11C21 11 25 14 28 22C24 25 12 25 8 22Z" fill="#090514" stroke="#c084fc" stroke-width="1.6"/>
    <circle cx="14.5" cy="17.5" r="1.5" fill="#f43f5e"/>
    <circle cx="21.5" cy="17.5" r="1.5" fill="#f43f5e"/>
    <circle cx="9" cy="11" r="1.5" fill="#c084fc"/><circle cx="27" cy="26" r="1.5" fill="#4ade80"/>
  `),

  eclipse_reap: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <circle cx="16" cy="16" r="8" fill="#030712" stroke="#c084fc" stroke-width="1.8"/>
    <path d="M19 8.5C22.5 10 24.5 13 24.5 16.5C24.5 20 22 23 18.5 24" stroke="#fde047" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M6 29L27 8C30 13 28 21 19 25L12 31Z" fill="#a855f7" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round"/>
  `),

  avatar_of_the_void: KIND_BUILDERS.voidform(FACTION_PALETTES.Umbri),

  soul_tithe: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <circle cx="18" cy="17" r="8" fill="#581c87" stroke="#e879f9" stroke-width="1.8"/>
    <circle cx="18" cy="17" r="4" fill="#e879f9"/>
    <circle cx="18" cy="17" r="1.8" fill="#ffffff"/>
    <path d="M8 10C12 6 24 6 28 10M9 26C14 30 22 30 27 26" stroke="#c084fc" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="7" cy="20" r="1.5" fill="#f3e8ff"/><circle cx="29" cy="14" r="1.5" fill="#f3e8ff"/>
  `),

  siphon_soul: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri, '#f43f5e')}
    <circle cx="27" cy="10" r="4.8" fill="#3b0764" stroke="#f43f5e" stroke-width="1.5"/>
    <circle cx="9" cy="26" r="5" fill="#881337" stroke="#fda4af" stroke-width="1.5"/>
    <path d="M24 13C19 13 18 22 13 23" stroke="#f43f5e" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M23 14C19 15 18 21 13 22" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="18.5" cy="18" r="1.8" fill="#fda4af"/>
  `),

  nightfall_plague: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <ellipse cx="18" cy="26" rx="12" ry="4.5" fill="#2e1065" stroke="#9333ea" stroke-width="1.6"/>
    <path d="M12 18C12 13 15 10 18 10C21 10 24 13 24 18V21H12Z" fill="#581c87" stroke="#e9d5ff" stroke-width="1.4"/>
    <circle cx="15.5" cy="16" r="1.4" fill="#4ade80"/><circle cx="20.5" cy="16" r="1.4" fill="#4ade80"/>
    <circle cx="9" cy="12" r="1.6" fill="#a855f7"/><circle cx="27" cy="13" r="1.4" fill="#4ade80"/>
  `),

  unmake: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri, '#e11d48')}
    <polygon points="16,6 9,18 16,30" fill="#581c87" stroke="#c084fc" stroke-width="1.5"/>
    <polygon points="20,6 27,18 20,30" fill="#881337" stroke="#fb7185" stroke-width="1.5"/>
    <path d="M18 3V33" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M13 18H23" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
  `),

  eclipse_harvester: KIND_BUILDERS.scythe_wave(FACTION_PALETTES.Umbri),

  void_annihilation: KIND_BUILDERS.singularity_collapse(FACTION_PALETTES.Umbri),

  // ==========================================
  // TERRA — Current Catalog (14)
  // ==========================================
  tectonic_slam: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M8 29L21 16" stroke="#78350f" stroke-width="3.2" stroke-linecap="round"/>
    <rect x="16" y="6" width="12" height="9" rx="2" transform="rotate(42 22 10)" fill="#57534e" stroke="#4ade80" stroke-width="1.7"/>
    <path d="M5 27L12 24L18 29L25 24L31 28" stroke="#a3e635" stroke-width="2" stroke-linecap="round"/>
    <circle cx="26" cy="10" r="1.6" fill="#bef264"/>
  `),

  barkskin_infusion: KIND_BUILDERS.thornbark(FACTION_PALETTES.Terra),

  rooted_bastion: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M10 7H26V21C26 26 22 29.5 18 31.5C14 29.5 10 26 10 21V7Z" fill="#14532d" stroke="#4ade80" stroke-width="2"/>
    <path d="M6 31C9 27 11 25 13 21M30 31C27 27 25 25 23 21M18 32V23" stroke="#a16207" stroke-width="2.4" stroke-linecap="round"/>
    <polygon points="18,11 22,17 18,22 14,17" fill="#4ade80" stroke="#dcfce7" stroke-width="1"/>
  `),

  wildshape_surge: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M5 13C12 9 20 11 29 19M6 20C14 16 21 18 28 25M9 26C16 23 22 24 26 29" stroke="#86efac" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M11 8L20 15L29 8" stroke="#4ade80" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="28" cy="19" r="2" fill="#fef08a"/>
  `),

  bramble_reversal: KIND_BUILDERS.bramble_burst(FACTION_PALETTES.Terra),

  ironwood_colossus: KIND_BUILDERS.colossus_stomp(FACTION_PALETTES.Terra),

  avatar_of_the_ironwood: KIND_BUILDERS.treant_form(FACTION_PALETTES.Terra),

  ancient_boulder: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M4 26L11 21M5 30L13 26" stroke="#a3e635" stroke-width="1.8" stroke-linecap="round"/>
    <polygon points="12,11 20,6 29,11 30,21 22,27 13,24" fill="#57534e" stroke="#a3e635" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M16 13L21 10L25 15L21 20" stroke="#4ade80" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="21" cy="15" r="1.8" fill="#fef08a"/>
  `),

  briar_snare: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <ellipse cx="18" cy="27" rx="11" ry="4" fill="#052e16" stroke="#22c55e" stroke-width="1.6"/>
    <path d="M10 27C10 19 26 21 26 14C26 10 20 8 15 11M26 27C26 19 10 21 10 14" stroke="#4ade80" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M12 19L8 17M24 16L29 14M18 11L18 6" stroke="#bef264" stroke-width="1.8" stroke-linecap="round"/>
  `),

  verdant_renewal: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M18 29C12 25 8 18 11 11C15 13 17 17 18 21C19 17 21 13 25 11C28 18 24 25 18 29Z" fill="#16a34a" stroke="#86efac" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M18 7C15 11 15 16 18 21C21 16 21 11 18 7Z" fill="#f472b6" stroke="#fce7f3" stroke-width="1.2"/>
    <circle cx="18" cy="14" r="1.8" fill="#fef08a"/>
  `),

  overwhelm_roar: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <circle cx="14" cy="18" r="7" fill="#14532d" stroke="#bef264" stroke-width="1.8"/>
    <path d="M12 16H16M14 14V20" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M23 12C26 15 26 21 23 24M27 8C32 13 32 23 27 28" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round"/>
  `),

  earthshatter: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <polygon points="18,5 22,19 14,19" fill="#84cc16" stroke="#fef08a" stroke-width="1.3"/>
    <polygon points="9,12 15,22 7,24" fill="#4ade80" stroke="#dcfce7" stroke-width="1.2"/>
    <polygon points="27,12 29,24 21,22" fill="#4ade80" stroke="#dcfce7" stroke-width="1.2"/>
    <path d="M5 27L13 24L18 29L23 24L31 27" stroke="#a3e635" stroke-width="2.2" stroke-linecap="round"/>
  `),

  tectonic_fissure: KIND_BUILDERS.fissure_line(FACTION_PALETTES.Terra),

  wrath_of_gaia: KIND_BUILDERS.continental_quake(FACTION_PALETTES.Terra),

  // ==========================================
  // AETHER — Current Catalog (13)
  // ==========================================
  reality_fracture: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <path d="M7 28L16 19L13 15L23 7L29 6L21 16L24 20L12 29Z" fill="#0ea5e9" stroke="#e0f2fe" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M8 8L28 28" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="2.6" fill="#ffffff"/>
  `),

  arcane_bolt: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <path d="M5 29L16 18" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="14" cy="22" rx="4" ry="2" transform="rotate(-45 14 22)" stroke="#bae6fd" stroke-width="1.2"/>
    <polygon points="15,17 29,6 22,22" fill="#38bdf8" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="24" cy="12" r="2.2" fill="#ffffff"/>
  `),

  mirror_barrier: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <polygon points="18,4 28,11 28,25 18,32 8,25 8,11" fill="#075985" stroke="#7dd3fc" stroke-width="2"/>
    <polygon points="18,4 28,11 18,18 8,11" fill="#38bdf8" fill-opacity="0.5"/>
    <polygon points="18,18 28,25 18,32" fill="#bae6fd" fill-opacity="0.45"/>
    <path d="M12 13L22 23M16 10L24 18" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  `),

  chrono_shift: KIND_BUILDERS.dash(FACTION_PALETTES.Aether),

  frost_nova: KIND_BUILDERS.frost_nova(FACTION_PALETTES.Aether),

  phase_shift: KIND_BUILDERS.ethereal_jaunt(FACTION_PALETTES.Aether),

  chrono_rift: KIND_BUILDERS.rift_teleport(FACTION_PALETTES.Aether),

  temporal_apotheosis: KIND_BUILDERS.apotheosis(FACTION_PALETTES.Aether),

  astral_convergence: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <path d="M8 6L15 28M18 4V31M28 6L21 28" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M18 4V31" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <ellipse cx="18" cy="29" rx="10" ry="3" fill="#075985" stroke="#bae6fd" stroke-width="1.4"/>
    <circle cx="8" cy="6" r="1.8" fill="#fef08a"/><circle cx="18" cy="4" r="2" fill="#ffffff"/><circle cx="28" cy="6" r="1.8" fill="#fef08a"/>
  `),

  gravity_well: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <circle cx="18" cy="18" r="12" stroke="#0ea5e9" stroke-width="1.6" stroke-dasharray="4 2"/>
    <path d="M18 7C24 7 28 12 27 18C26 23 21 26 16 25C12 24 10 20 11 16C12 13 15 11 18 12" stroke="#7dd3fc" stroke-width="2.1" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="3.8" fill="#020617" stroke="#ffffff" stroke-width="1.4"/>
  `),

  time_loop_paradox: KIND_BUILDERS.timeloop(FACTION_PALETTES.Aether),

  supernova_collapse: KIND_BUILDERS.supernova(FACTION_PALETTES.Aether),

  chrono_stasis_singularity: KIND_BUILDERS.stasis_bubble(FACTION_PALETTES.Aether),

  // ==========================================
  // CORE (1)
  // ==========================================
  harvest: KIND_BUILDERS.harvest(FACTION_PALETTES.All),

  // ==========================================
  // NEW CLASS-SIGNATURE ABILITIES (32)
  // ==========================================
  // --- Solari Vanguard (4) ---
  aegis_slam: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M10 6H26V18C26 23.5 22 27.5 18 29.5C14 27.5 10 23.5 10 18V6Z" fill="#b45309" stroke="#fef08a" stroke-width="2"/>
    <polygon points="18,10 21.5,17 18,23 14.5,17" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
    <path d="M4 26L11 29L18 33L25 29L32 26" stroke="#facc15" stroke-width="2.2" stroke-linecap="round"/>
  `),

  sunfire_lance: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M5 31L27 9" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
    <polygon points="22,6 32,4 30,14 26,10" fill="#fde047" stroke="#ffffff" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M11 21L7 19M15 25L17 29" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
    <circle cx="29" cy="7" r="1.8" fill="#ffffff"/>
  `),

  bastion_banner: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#38bdf8')}
    <path d="M10 4V32" stroke="#e2e8f0" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M10 7H27L23 13.5L27 20H10Z" fill="#b45309" stroke="#facc15" stroke-width="1.7" stroke-linejoin="round"/>
    <circle cx="17.5" cy="13.5" r="3.2" fill="#fde047" stroke="#ffffff" stroke-width="1"/>
    <path d="M5 28C9 25 27 25 31 28" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/>
  `),

  judgement_verdict: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <path d="M18 5V28M10 10H26" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 17L10 10L12 17ZM24 17L26 10L28 17Z" stroke="#fef08a" stroke-width="1.2"/>
    <path d="M6 17H14C13 20 7 20 6 17ZM22 17H30C29 20 23 20 22 17Z" fill="#facc15"/>
    <polygon points="18,12 20,25 18,32 16,25" fill="#ffffff" stroke="#f59e0b" stroke-width="1"/>
  `),

  // --- Aurora Marshal (4) ---
  starlight_mend: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#4ade80')}
    <path d="M9 21C11 26 14 29 18 29C22 29 25 26 27 21" stroke="#fde047" stroke-width="2.4" stroke-linecap="round"/>
    <polygon points="18,6 20.4,13.6 28,16 20.4,18.4 18,26 15.6,18.4 8,16 15.6,13.6" fill="#86efac" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="18" cy="16" r="2.2" fill="#ffffff"/>
  `),

  aurora_beam: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#38bdf8')}
    <path d="M5 27L31 9" stroke="#38bdf8" stroke-width="5.5" stroke-opacity="0.55" stroke-linecap="round"/>
    <path d="M5 27L31 9" stroke="#fde047" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M6 26.3L31 9" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M10 10C15 7 22 7 27 11" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>
  `),

  purifying_halo: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari, '#bae6fd')}
    <ellipse cx="18" cy="18" rx="12" ry="7" transform="rotate(-15 18 18)" stroke="#fde047" stroke-width="2.6"/>
    <ellipse cx="18" cy="18" rx="12" ry="7" transform="rotate(-15 18 18)" stroke="#ffffff" stroke-width="0.9"/>
    <path d="M18 7V29M12 18H24" stroke="#bae6fd" stroke-width="2" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="2.6" fill="#ffffff"/>
  `),

  solaris_apotheosis: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Solari)}
    <circle cx="18" cy="18" r="13" stroke="#fde047" stroke-width="1.5" stroke-dasharray="3 2"/>
    <path d="M6 19C6 11 11 10 15 17M30 19C30 11 25 10 21 17" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round"/>
    <polygon points="18,6 22.5,18 18,30 13.5,18" fill="#facc15" stroke="#ffffff" stroke-width="1.4"/>
    <circle cx="18" cy="18" r="3" fill="#ffffff"/>
  `),

  // --- Umbral Assassin (4) ---
  serrated_mutilate: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <path d="M8 28L26 7L29 9L25 15L22 14L20 19L17 18L11 30Z" fill="#c084fc" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M28 28L10 7L7 9L11 15L14 14L16 19L19 18L25 30Z" fill="#7e22ce" stroke="#e879f9" stroke-width="1.1" stroke-linejoin="round"/>
    <circle cx="18" cy="19" r="2" fill="#f43f5e"/>
  `),

  crimson_rupture: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri, '#f43f5e')}
    <path d="M8 9L25 27M14 7L29 22M6 15L21 30" stroke="#e11d48" stroke-width="3" stroke-linecap="round"/>
    <path d="M9 10L24 26M15 8L28 21" stroke="#fda4af" stroke-width="1.1" stroke-linecap="round"/>
    <circle cx="26" cy="10" r="2" fill="#f43f5e"/><circle cx="10" cy="27" r="1.8" fill="#fb7185"/>
  `),

  smoke_bomb: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <circle cx="14" cy="15" r="6" fill="#475569" stroke="#c084fc" stroke-width="1.3"/>
    <circle cx="23" cy="14" r="5" fill="#334155" stroke="#9333ea" stroke-width="1.3"/>
    <circle cx="18" cy="21" r="6.5" fill="#1e293b" stroke="#e9d5ff" stroke-width="1.5"/>
    <circle cx="18" cy="22" r="3" fill="#0f172a" stroke="#c084fc" stroke-width="1.2"/>
    <path d="M18 16L20 12" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="21" cy="11" r="1.4" fill="#fde047"/>
  `),

  phantom_sever: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <circle cx="18" cy="14" r="4" fill="#3b0764" stroke="#c084fc" stroke-width="1.3"/>
    <path d="M12 28C12 22 14 19 18 19C22 19 24 22 24 28Z" fill="#3b0764" fill-opacity="0.7"/>
    <path d="M5 10L31 26M31 10L5 26" stroke="#f43f5e" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M7 11L29 25M29 11L7 25" stroke="#ffffff" stroke-width="1" stroke-linecap="round"/>
  `),

  // --- Graveglass Oracle (4) ---
  hex_of_frailty: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <path d="M5 18C9 11 27 11 31 18C27 25 9 25 5 18Z" fill="#1e0538" stroke="#c084fc" stroke-width="1.8"/>
    <circle cx="18" cy="18" r="4" fill="#e11d48" stroke="#ffffff" stroke-width="1.1"/>
    <path d="M12 10L16 17L14 23L20 27" stroke="#f3e8ff" stroke-width="1.4" stroke-linecap="round"/>
  `),

  graveglass_shardburst: KIND_BUILDERS.shardburst(FACTION_PALETTES.Umbri),

  soul_covenant: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri, '#f43f5e')}
    <circle cx="13" cy="18" r="6.5" stroke="#c084fc" stroke-width="2.2"/>
    <circle cx="23" cy="18" r="6.5" stroke="#f43f5e" stroke-width="2.2"/>
    <polygon points="18,14 20.5,18 18,22 15.5,18" fill="#ffffff"/>
  `),

  harbingers_requiem: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Umbri)}
    <path d="M18 7C13 7 11 12 10 21H26C25 12 23 7 18 7Z" fill="#581c87" stroke="#e879f9" stroke-width="1.7"/>
    <circle cx="18" cy="24" r="2.2" fill="#f43f5e"/>
    <path d="M7 14C5 17 5 21 7 24M29 14C31 17 31 21 29 24" stroke="#c084fc" stroke-width="2" stroke-linecap="round"/>
  `),

  // --- Forest Warden (4) ---
  gale_spear: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M5 30L28 7" stroke="#86efac" stroke-width="2.6" stroke-linecap="round"/>
    <polygon points="23,5 32,4 31,13 26,10" fill="#4ade80" stroke="#ffffff" stroke-width="1.2"/>
    <path d="M8 17C14 14 17 22 23 19M11 26C17 23 20 29 26 26" stroke="#a3e635" stroke-width="1.8" stroke-linecap="round"/>
  `),

  spore_volley: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <circle cx="12" cy="23" r="4" fill="#16a34a" stroke="#bef264" stroke-width="1.5"/>
    <circle cx="23" cy="12" r="4.5" fill="#84cc16" stroke="#fef08a" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="3.5" fill="#22c55e" stroke="#dcfce7" stroke-width="1.4"/>
    <circle cx="11" cy="11" r="2.4" fill="#bef264"/>
    <circle cx="18" cy="18" r="2" fill="#ffffff"/>
  `),

  pack_hunt: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M7 23L11 11L15 15L18 10L21 15L25 11L29 23L24 27H12Z" fill="#14532d" stroke="#4ade80" stroke-width="1.7" stroke-linejoin="round"/>
    <circle cx="14.5" cy="19" r="1.4" fill="#fef08a"/><circle cx="21.5" cy="19" r="1.4" fill="#fef08a"/>
    <path d="M12 6C16 4 20 4 24 6" stroke="#86efac" stroke-width="1.6" stroke-linecap="round"/>
  `),

  tempest_of_thorns: KIND_BUILDERS.tempest_thorns(FACTION_PALETTES.Terra),

  // --- Stonekin Elder (4) ---
  seismic_taunt: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra, '#f59e0b')}
    <path d="M9 22L22 10C26 12 28 16 26 21L13 27Z" fill="#78350f" stroke="#facc15" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M27 10C31 14 31 20 27 24M30 7C35 13 35 21 30 27" stroke="#4ade80" stroke-width="1.8" stroke-linecap="round"/>
  `),

  monolith_wall: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <rect x="6" y="11" width="7" height="19" rx="1" fill="#44403c" stroke="#86efac" stroke-width="1.5"/>
    <rect x="14.5" y="6" width="7" height="24" rx="1" fill="#57534e" stroke="#4ade80" stroke-width="1.8"/>
    <rect x="23" y="11" width="7" height="19" rx="1" fill="#44403c" stroke="#86efac" stroke-width="1.5"/>
    <path d="M18 11V24M16 15H20" stroke="#bef264" stroke-width="1.5" stroke-linecap="round"/>
  `),

  earthen_grasp: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra)}
    <path d="M11 30V18L8 12L12 10L15 16V8L19 8V16L22 9L26 11L24 19V30Z" fill="#57534e" stroke="#4ade80" stroke-width="1.7" stroke-linejoin="round"/>
    <path d="M13 24H23" stroke="#a3e635" stroke-width="2" stroke-linecap="round"/>
  `),

  tectonic_cataclysm: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Terra, '#fb923c')}
    <polygon points="5,26 12,11 17,22" fill="#44403c" stroke="#4ade80" stroke-width="1.6" stroke-linejoin="round"/>
    <polygon points="31,26 24,11 19,22" fill="#44403c" stroke="#4ade80" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M18 6V29M14 14L18 18L22 14" stroke="#f97316" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="18" cy="29" r="2.2" fill="#fef08a"/>
  `),

  // --- Chronomancer Sage (4) ---
  temporal_anchor: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <circle cx="18" cy="10" r="3" stroke="#fde047" stroke-width="1.8"/>
    <path d="M18 13V29M12 16H24M9 22C10 27 14 30 18 30C22 30 26 27 27 22" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>
    <polygon points="8,23 11,20 12,24" fill="#bae6fd"/><polygon points="28,23 25,20 24,24" fill="#bae6fd"/>
  `),

  sands_of_lethargy: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether, '#fde047')}
    <g transform="rotate(18 18 18)">
      <path d="M12 7H24L18 17.5L24 28H12L18 17.5Z" fill="#075985" stroke="#bae6fd" stroke-width="1.6" stroke-linejoin="round"/>
      <polygon points="14.5,26.5 21.5,26.5 18,21" fill="#fde047"/>
    </g>
    <circle cx="17" cy="29" r="1.4" fill="#fde047"/><circle cx="22" cy="30" r="1.2" fill="#38bdf8"/>
  `),

  echoing_paradox: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <polygon points="14,7 22,18 14,29 6,18" fill="#0284c7" fill-opacity="0.65" stroke="#bae6fd" stroke-width="1.6"/>
    <polygon points="22,7 30,18 22,29 14,18" fill="#38bdf8" fill-opacity="0.65" stroke="#ffffff" stroke-width="1.6"/>
    <circle cx="18" cy="18" r="2.2" fill="#fde047"/>
  `),

  fractured_timeline: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <path d="M6 18H16L26 8M16 18H30M16 18L26 28" stroke="#38bdf8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="16" cy="18" r="2.8" fill="#ffffff" stroke="#0ea5e9" stroke-width="1.2"/>
    <circle cx="27" cy="8" r="2" fill="#fde047"/><circle cx="30" cy="18" r="2" fill="#bae6fd"/><circle cx="27" cy="28" r="2" fill="#c084fc"/>
  `),

  // --- Nexus Weaver (4) ---
  glacial_spike: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <polygon points="18,3 24,16 20,31 16,31 12,16" fill="#0ea5e9" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
    <polygon points="18,6 21,16 18.5,29 18,29" fill="#e0f2fe" fill-opacity="0.8"/>
    <polygon points="7,29 11,20 13,29" fill="#38bdf8"/>
    <polygon points="29,29 25,20 23,29" fill="#38bdf8"/>
  `),

  arcane_tether: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <circle cx="9" cy="25" r="4" fill="#0284c7" stroke="#e0f2fe" stroke-width="1.6"/>
    <circle cx="27" cy="11" r="4" fill="#6366f1" stroke="#fde047" stroke-width="1.6"/>
    <path d="M12 22L16 15L20 20L24 13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  `),

  meteor_constellation: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <path d="M8 9L19 7L27 16" stroke="#7dd3fc" stroke-dasharray="2 2" stroke-width="1.3"/>
    <path d="M6 15L14 7M15 21L26 10M18 30L30 18" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="12" cy="15" r="2.6" fill="#fde047" stroke="#ffffff" stroke-width="1"/>
    <circle cx="20" cy="20" r="3" fill="#38bdf8" stroke="#ffffff" stroke-width="1.1"/>
    <circle cx="25" cy="12" r="2.2" fill="#ffffff"/>
  `),

  astral_supernova: wrapSvg(`
    ${medalPlate(FACTION_PALETTES.Aether)}
    <circle cx="18" cy="18" r="12" stroke="#38bdf8" stroke-width="1.6"/>
    <circle cx="18" cy="18" r="8" stroke="#fde047" stroke-width="1.4" stroke-dasharray="2.5 2"/>
    <polygon points="18,4 21,15 32,18 21,21 18,32 15,21 4,18 15,15" fill="#ffffff" stroke="#38bdf8" stroke-width="1.3"/>
    <circle cx="18" cy="18" r="3" fill="#fde047"/>
  `),

  // ==========================================
  // KIND FALLBACK TEMPLATES (Guaranteed non-emoji fallback for every kind)
  // ==========================================
  melee_cleave: KIND_BUILDERS.melee_cleave(FACTION_PALETTES.All),
  shield: KIND_BUILDERS.shield(FACTION_PALETTES.All),
  thornbark: KIND_BUILDERS.thornbark(FACTION_PALETTES.Terra),
  dash: KIND_BUILDERS.dash(FACTION_PALETTES.All),
  shadow_step: KIND_BUILDERS.shadow_step(FACTION_PALETTES.Umbri),
  stealth: KIND_BUILDERS.stealth(FACTION_PALETTES.Umbri),
  cast_beam: KIND_BUILDERS.cast_beam(FACTION_PALETTES.All),
  projectile: KIND_BUILDERS.projectile(FACTION_PALETTES.All),
  ground_zone: KIND_BUILDERS.ground_zone(FACTION_PALETTES.All),
  heal: KIND_BUILDERS.heal(FACTION_PALETTES.Terra),
  nova: KIND_BUILDERS.nova(FACTION_PALETTES.All),
  drain_beam: KIND_BUILDERS.drain_beam(FACTION_PALETTES.Umbri),
  execute_beam: KIND_BUILDERS.execute_beam(FACTION_PALETTES.Umbri),
  timeloop: KIND_BUILDERS.timeloop(FACTION_PALETTES.Aether),
  frost_nova: KIND_BUILDERS.frost_nova(FACTION_PALETTES.Aether),
  archon_form: KIND_BUILDERS.archon_form(FACTION_PALETTES.Solari),
  voidform: KIND_BUILDERS.voidform(FACTION_PALETTES.Umbri),
  treant_form: KIND_BUILDERS.treant_form(FACTION_PALETTES.Terra),
  apotheosis: KIND_BUILDERS.apotheosis(FACTION_PALETTES.Aether),
  reactive_barrier: KIND_BUILDERS.reactive_barrier(FACTION_PALETTES.Solari),
  cleanse_sprint: KIND_BUILDERS.cleanse_sprint(FACTION_PALETTES.Solari),
  heal_glimmer: KIND_BUILDERS.heal_glimmer(FACTION_PALETTES.Solari),
  stealth_burst: KIND_BUILDERS.stealth_burst(FACTION_PALETTES.Umbri),
  dash_cleave: KIND_BUILDERS.dash_cleave(FACTION_PALETTES.Umbri),
  scythe_wave: KIND_BUILDERS.scythe_wave(FACTION_PALETTES.Umbri),
  singularity_collapse: KIND_BUILDERS.singularity_collapse(FACTION_PALETTES.Umbri),
  iron_fortify: KIND_BUILDERS.iron_fortify(FACTION_PALETTES.Terra),
  bramble_burst: KIND_BUILDERS.bramble_burst(FACTION_PALETTES.Terra),
  colossus_stomp: KIND_BUILDERS.colossus_stomp(FACTION_PALETTES.Terra),
  fissure_line: KIND_BUILDERS.fissure_line(FACTION_PALETTES.Terra),
  continental_quake: KIND_BUILDERS.continental_quake(FACTION_PALETTES.Terra),
  ethereal_jaunt: KIND_BUILDERS.ethereal_jaunt(FACTION_PALETTES.Aether),
  rift_teleport: KIND_BUILDERS.rift_teleport(FACTION_PALETTES.Aether),
  supernova: KIND_BUILDERS.supernova(FACTION_PALETTES.Aether),
  stasis_bubble: KIND_BUILDERS.stasis_bubble(FACTION_PALETTES.Aether),
  shardburst: KIND_BUILDERS.shardburst(FACTION_PALETTES.Umbri),
  tempest_thorns: KIND_BUILDERS.tempest_thorns(FACTION_PALETTES.Terra),
  default: KIND_BUILDERS.nova(FACTION_PALETTES.All),
};

const FACTION_CREST_SVGS = {
  Solari: wrapSvg(`
    <polygon points="11,2 25,2 34,11 34,25 25,34 11,34 2,25 2,11" fill="#1c1506" stroke="#facc15" stroke-width="2.2"/>
    <circle cx="18" cy="18" r="10.5" stroke="#f59e0b" stroke-opacity="0.55" stroke-width="1"/>
    <path d="M18 4.5V8.5M18 27.5V31.5M4.5 18H8.5M27.5 18H31.5M8.5 8.5L11.5 11.5M24.5 24.5L27.5 27.5M27.5 8.5L24.5 11.5M11.5 24.5L8.5 27.5" stroke="#fde047" stroke-width="1.9" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="6" fill="#f59e0b" stroke="#ffffff" stroke-width="1.3"/>
    <polygon points="18,13.5 21,18 18,22.5 15,18" fill="#ffffff"/>
  `),
  Umbri: wrapSvg(`
    <path d="M7 5H29V18.5C29 26 23.5 31 18 33.5C12.5 31 7 26 7 18.5V5Z" fill="#120722" stroke="#c084fc" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M22 10.5C16.5 10.5 12.5 14 12.5 18.5C12.5 23 16.5 26.5 22 26.5C18.5 24.5 17 21.8 17 18.5C17 15.2 18.5 12.5 22 10.5Z" fill="#c084fc" stroke="#f3e8ff" stroke-width="1"/>
    <polygon points="22.5,14 24.5,18.5 22.5,23 20.5,18.5" fill="#f43f5e" stroke="#ffffff" stroke-width="0.9"/>
  `),
  Terra: wrapSvg(`
    <path d="M7 6H29V18.5C29 25.5 23.5 30.5 18 33C12.5 30.5 7 25.5 7 18.5V6Z" fill="#061b0e" stroke="#4ade80" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M18 28V11M18 21C13 19 11 16 11 12C14 13 17 15 18 19M18 21C23 19 25 16 25 12C22 13 19 15 18 19" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polygon points="18,8 21,12 18,16 15,12" fill="#bef264" stroke="#ffffff" stroke-width="0.9"/>
  `),
  Aether: wrapSvg(`
    <circle cx="18" cy="18" r="15" fill="#06182c" stroke="#38bdf8" stroke-width="2.2"/>
    <ellipse cx="18" cy="18" rx="12" ry="5" transform="rotate(-32 18 18)" stroke="#7dd3fc" stroke-width="1.5"/>
    <ellipse cx="18" cy="18" rx="12" ry="5" transform="rotate(32 18 18)" stroke="#fde047" stroke-width="1.3"/>
    <polygon points="18,9 22,18 18,27 14,18" fill="#0ea5e9" stroke="#ffffff" stroke-width="1.3"/>
    <circle cx="18" cy="18" r="2.1" fill="#ffffff"/>
  `),
  All: wrapSvg(`
    <circle cx="18" cy="18" r="15" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
    <polygon points="18,6 21,15 30,18 21,21 18,30 15,21 6,18 15,15" fill="#facc15" stroke="#ffffff" stroke-width="1.2"/>
    <circle cx="18" cy="18" r="2.4" fill="#ffffff"/>
  `),
};

function resolveRawAbilitySvg(spec) {
  if (typeof spec === 'string') {
    const key = spec.trim();
    if (ABILITY_ICON_SVGS[key]) return ABILITY_ICON_SVGS[key];
    return ABILITY_ICON_SVGS.default;
  }

  const obj = spec && typeof spec === 'object' ? spec : {};
  if (obj.id && ABILITY_ICON_SVGS[obj.id]) {
    return ABILITY_ICON_SVGS[obj.id];
  }

  const kind = obj.kind || (obj.tcgType?.includes('Flash') ? 'dash' : 'cast_beam');
  const builder = KIND_BUILDERS[kind];
  if (builder) {
    const palette = getPalette(obj.faction, obj.color);
    return builder(palette);
  }

  if (obj.kind && ABILITY_ICON_SVGS[obj.kind]) {
    return ABILITY_ICON_SVGS[obj.kind];
  }

  return KIND_BUILDERS.nova(getPalette(obj.faction, obj.color));
}

function injectSvgSize(rawSvg, size, extraStyle = '') {
  const s = Math.max(8, Math.round(Number(size) || 24));
  const styleAttr = `width:${s}px;height:${s}px;display:block;${extraStyle}`;
  return String(rawSvg)
    .trim()
    .replace(/<svg\b/i, `<svg width="${s}" height="${s}" style="${styleAttr}"`);
}

/**
 * Render a bespoke high-craft vector icon wrapped in `.ability-svg-icon`.
 * Resolves by exact ability `id` first, then smart `kind` + `faction` tinting so no ability ever uses raw OS emoji.
 * @param {object|string} spec - Ability spec from ABILITIES_CATALOG or ability id string
 * @param {number} [size=24] - Icon size in pixels
 * @returns {string} HTML string
 */
export function getAbilityIconHtml(spec, size = 24) {
  const s = Math.max(8, Math.round(Number(size) || 24));
  const svg = injectSvgSize(resolveRawAbilitySvg(spec), s);
  return `<span class="ability-svg-icon" style="width:${s}px;height:${s}px;">${svg}</span>`;
}

/**
 * Render a crisp vector Faction Crest SVG emblem (Solari / Umbri / Terra / Aether).
 * @param {string} faction - Faction name
 * @param {number} [size=18] - Crest size in pixels
 * @returns {string} Inline SVG string
 */
export function getFactionCrestSvg(faction, size = 18) {
  const s = Math.max(8, Math.round(Number(size) || 18));
  const key = normalizeFaction(faction);
  const raw = FACTION_CREST_SVGS[key] || FACTION_CREST_SVGS.All;
  return injectSvgSize(
    raw,
    s,
    'display:inline-block;vertical-align:middle;flex-shrink:0;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.85));'
  );
}

if (typeof window !== 'undefined') {
  window.ABILITY_ICON_SVGS = ABILITY_ICON_SVGS;
  window.getAbilityIconHtml = getAbilityIconHtml;
  window.getFactionCrestSvg = getFactionCrestSvg;
}
