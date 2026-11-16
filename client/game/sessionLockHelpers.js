// ==========================================
// Cross-Tab Session Lock & Boot Surface Routing Helpers
// ==========================================
// Rule:
//   - Browsing the Landing Page or Skill Guides is passive and MUST be allowed alongside
//     an active game/loadout tab without claiming or triggering "Session Active in Another Window".
//   - Only Hero Loadout (frontpage.isOpen) and In-Game (hasEnteredWorld / netConnected)
//     participate in the single-session cross-tab lock.

const LANDING_TAB_ALIASES = {
  'prologue-hero': 'overview',
  'game-encyclopedia': 'systems',
  'skill-guides': 'skills',
  'lore-chronicle': 'atlas',
  'tcg-cards': 'armory',
  arena: 'atlas',
};

export function normalizeLandingTabId(rawTab) {
  if (!rawTab) return null;
  const clean = String(rawTab).trim();
  if (!clean) return null;
  return LANDING_TAB_ALIASES[clean] || clean;
}

export function isActiveGameOrLoadoutTab({
  hasEnteredWorld = false,
  isFrontpageOpen = false,
  isLandingOpen = false,
  netConnected = false,
} = {}) {
  if (isLandingOpen && !hasEnteredWorld && !isFrontpageOpen) {
    return false;
  }
  return Boolean(hasEnteredWorld || isFrontpageOpen || netConnected);
}

export function shouldShowSessionSupersededForClaim(state = {}) {
  return isActiveGameOrLoadoutTab(state);
}

export function shouldReconnectOnReclaim({
  isSinglePlayer = true,
  hasEnteredWorld = false,
  frontpagePlayMode = 'singleplayer',
} = {}) {
  return Boolean(!isSinglePlayer && (hasEnteredWorld || frontpagePlayMode === 'multiplayer'));
}

export function resolveBootSurface({
  startOnLoadout = false,
  search = '',
  pathname = '',
  hash = '',
  pendingPlayOnBoot = false,
} = {}) {
  const params = new URLSearchParams(String(search || ''));
  const requestedTab = normalizeLandingTabId(params.get('tab'));
  const isLandingPath =
    String(pathname || '').startsWith('/landing') || String(hash || '') === '#landing';
  const forceLanding =
    params.get('landing') === '1' || Boolean(requestedTab) || isLandingPath;
  const forceLoadout =
    params.get('loadout') === '1' ||
    params.get('autostart') === '1' ||
    Boolean(pendingPlayOnBoot);

  const surface =
    forceLoadout || (startOnLoadout && !forceLanding) ? 'loadout' : 'landing';

  return {
    surface,
    requestedTab,
    forceLanding,
    forceLoadout,
  };
}
