// ==========================================
// RoomManager Timing Constants & Helpers
// ==========================================

export const SIEGE_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes per roadmap spec
export const ARENA_WAIT_MS = 45 * 1000; // Open 3v3 lobby waits this long before computer entities fill empty slots

export function nextThirtyMinBoundary(now = Date.now()) {
  const next = Math.ceil((now + 5000) / SIEGE_INTERVAL_MS) * SIEGE_INTERVAL_MS;
  return next - now < 45000 ? next + SIEGE_INTERVAL_MS : next;
}
