/**
 * Sequence-aware client movement prediction, input normalization, directional facing stability,
 * and smooth interpolation helpers.
 * Zero DOM globals so Node tests can exercise all reconciliation and input contracts directly.
 */

const CODE_TO_INPUT = Object.freeze({
  KeyW: 'w',
  KeyA: 'a',
  KeyS: 's',
  KeyD: 'd',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ShiftLeft: 'shift',
  ShiftRight: 'shift',
});

const KEY_TO_INPUT = Object.freeze({
  w: 'w',
  a: 'a',
  s: 's',
  d: 'd',
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  shift: 'shift',
});

/**
 * Create mutable sequence/ack tracking state for client movement reconciliation.
 */
export function createMoveSyncState() {
  return {
    moveSeq: 0,
    lastAckedSeq: 0,
    lastAckedOverrideSeq: null,
    lastSentAt: 0,
    lastMovedAt: 0,
    lastStoppedAt: 0,
  };
}

/**
 * Allocate the next monotonic movement sequence number.
 */
export function nextMoveSequence(state, nowMs = Date.now(), isMoving = false) {
  if (!state) return 1;
  state.moveSeq = (state.moveSeq || 0) + 1;
  state.lastSentAt = nowMs;
  if (isMoving) state.lastMovedAt = nowMs;
  else state.lastStoppedAt = nowMs;
  return state.moveSeq;
}

/**
 * Reset client movement reconciliation state on room entry / teleport / respawn.
 */
export function resetMoveSyncOnRoomJoin(state, serverAckSeq = null, serverOverrideSeq = null) {
  if (!state) return;
  if (Number.isFinite(serverAckSeq)) {
    state.lastAckedSeq = Math.max(0, serverAckSeq);
    state.moveSeq = Math.max(state.moveSeq || 0, state.lastAckedSeq);
  }
  if (Number.isFinite(serverOverrideSeq)) {
    state.lastAckedOverrideSeq = Math.max(state.lastAckedOverrideSeq || 0, serverOverrideSeq);
  }
}

/**
 * Resolve canonical input field ('w'|'a'|'s'|'d'|'up'|'down'|'left'|'right'|'shift'|null)
 * using physical `e.code` first so modifier changes (Shift/Caps/Alt/Dead keys) never
 * leave directional movement stuck on keyup.
 */
export function mapInputEventToAction(e) {
  if (!e) return null;
  if (e.code && CODE_TO_INPUT[e.code]) {
    return CODE_TO_INPUT[e.code];
  }
  const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
  return KEY_TO_INPUT[key] || null;
}

/**
 * Zero all directional and modifier movement state cleanly.
 */
export function resetDirectionalInputs(inputs) {
  if (!inputs) return inputs;
  inputs.w = false;
  inputs.a = false;
  inputs.s = false;
  inputs.d = false;
  inputs.up = false;
  inputs.down = false;
  inputs.left = false;
  inputs.right = false;
  inputs.shift = false;
  inputs.axisX = 0;
  inputs.axisY = 0;
  return inputs;
}

/**
 * Compute cardinal sprite facing ('up'|'down'|'left'|'right') from movement vector (mx, my)
 * with diagonal hysteresis so touch stick noise or diagonal release never spins the sprite.
 */
export function computeStableFacingDir(mx, my, prevDir = 'down', deadzone = 0.08) {
  const safePrev = prevDir === 'up' || prevDir === 'down' || prevDir === 'left' || prevDir === 'right'
    ? prevDir
    : 'down';
  const mag = Math.hypot(mx || 0, my || 0);
  if (!Number.isFinite(mag) || mag < deadzone) return safePrev;

  const absX = Math.abs(mx);
  const absY = Math.abs(my);

  // Pure or near-pure cardinal input switches immediately with zero lag
  if (absY < 0.02) return mx >= 0 ? 'right' : 'left';
  if (absX < 0.02) return my >= 0 ? 'down' : 'up';

  const horizontalActive = safePrev === 'left' || safePrev === 'right';
  const verticalActive = safePrev === 'up' || safePrev === 'down';

  if (horizontalActive) {
    // Switch to vertical only when Y clearly dominates X by hysteresis margin
    if (absY > absX * 1.18 + 0.04) {
      return my >= 0 ? 'down' : 'up';
    }
    return mx >= 0 ? 'right' : 'left';
  }

  if (verticalActive) {
    // Switch to horizontal only when X clearly dominates Y by hysteresis margin
    if (absX > absY * 1.18 + 0.04) {
      return mx >= 0 ? 'right' : 'left';
    }
    return my >= 0 ? 'down' : 'up';
  }

  return absX > absY ? (mx >= 0 ? 'right' : 'left') : (my >= 0 ? 'down' : 'up');
}

/**
 * Frame-rate-independent exponential smoothing alpha in [0, 1].
 */
export function smoothLerpFactor(ratePerSec, dt) {
  const safeDt = Math.max(0, Math.min(0.25, Number(dt) || 0));
  const safeRate = Math.max(0.1, Number(ratePerSec) || 10);
  return 1 - Math.exp(-safeRate * safeDt);
}

/**
 * Determine whether and how to reconcile local predicted `(player.x, player.y)` against
 * an incoming server snapshot `sp`, taking in-flight `moveSeq` packets, `posOverrideSeq`
 * teleports/knockbacks, sprint speed, and RTT into account.
 *
 * Returns `{ action: 'ignore' | 'none' | 'snap' | 'blend', factor?: number, snapCamera?: boolean, reason: string }`.
 */
export function reconcilePlayerSnapshot({
  player,
  sp,
  state,
  isTransitioningZone = false,
  pingMs = 120,
  moveSpeedPxPerSec = 220,
  nowMs = Date.now(),
}) {
  if (!player || !sp) return { action: 'ignore', reason: 'missing_state' };
  if (isTransitioningZone) return { action: 'ignore', reason: 'zone_transition' };

  const dx = (Number(sp.x) || 0) - (Number(player.x) || 0);
  const dy = (Number(sp.y) || 0) - (Number(player.y) || 0);
  const errDist = Math.hypot(dx, dy);

  const serverOverrideSeq = Number.isFinite(sp.posOverrideSeq) ? Number(sp.posOverrideSeq) : 0;
  if (state && state.lastAckedOverrideSeq === null) {
    state.lastAckedOverrideSeq = serverOverrideSeq;
  }
  const knownOverrideSeq = state?.lastAckedOverrideSeq ?? 0;
  if (serverOverrideSeq > knownOverrideSeq) {
    if (state) state.lastAckedOverrideSeq = serverOverrideSeq;
    if (sp.isDead || errDist > 120) {
      return { action: 'snap', snapCamera: true, reason: 'server_override_snap' };
    }
    if (errDist > 3) {
      return { action: 'blend', factor: 0.45, reason: 'server_override_blend' };
    }
    return { action: 'none', reason: 'server_override_aligned' };
  }

  const rttSec = Math.min(1.5, Math.max(0.08, (Number(pingMs) || 120) / 1000));
  const speed = Math.max(120, Number(moveSpeedPxPerSec) || 220);
  const maxExpectedLead = Math.min(440, Math.max(145, speed * (rttSec + 0.28) + 85));

  const hasSeqAck = Number.isFinite(sp.lastMoveSeq);
  if (hasSeqAck && state) {
    const ackSeq = Math.max(0, Number(sp.lastMoveSeq));
    state.lastAckedSeq = Math.max(state.lastAckedSeq || 0, ackSeq);
    const unacked = Math.max(0, (state.moveSeq || 0) - state.lastAckedSeq);

    if (unacked > 0) {
      // Newer move/stop packets are still in flight: NEVER yank backward under normal RTT lead
      const hardCap = Math.max(360, maxExpectedLead * 1.9);
      if (errDist > hardCap) {
        return { action: 'snap', snapCamera: true, reason: 'in_flight_hard_desync' };
      }
      if (errDist > maxExpectedLead * 1.3) {
        return { action: 'blend', factor: 0.18, reason: 'in_flight_excess_lead' };
      }
      return { action: 'none', reason: 'in_flight_lead' };
    }

    // Server has processed up through our latest moveSeq
    const settleAgeMs = nowMs - (state.lastMovedAt || 0);
    if (errDist > Math.max(200, maxExpectedLead)) {
      return { action: 'snap', snapCamera: true, reason: 'acked_hard_snap' };
    }
    if (!player.isMoving && errDist > 10 && settleAgeMs > 85) {
      return { action: 'blend', factor: 0.28, reason: 'acked_idle_settle' };
    }
    if (player.isMoving && errDist > Math.max(95, maxExpectedLead * 0.72)) {
      return { action: 'blend', factor: 0.15, reason: 'acked_drift_correction' };
    }
    return { action: 'none', reason: 'acked_in_sync' };
  }

  // Fallback for legacy snapshots without lastMoveSeq
  const stopAgeMs = nowMs - (state?.lastMovedAt || 0);
  if (errDist > Math.max(220, maxExpectedLead * 1.25)) {
    return { action: 'snap', snapCamera: true, reason: 'legacy_hard_snap' };
  }
  if (!player.isMoving && errDist > 8 && stopAgeMs > Math.max(220, rttSec * 1200)) {
    return { action: 'blend', factor: 0.26, reason: 'legacy_idle_settle' };
  }
  if (player.isMoving && errDist > maxExpectedLead) {
    return { action: 'blend', factor: 0.14, reason: 'legacy_drift' };
  }
  return { action: 'none', reason: 'legacy_ok' };
}
