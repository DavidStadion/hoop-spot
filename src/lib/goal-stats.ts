import type { Goal } from '../data/types';

export interface GoalStats {
  passes: number;     // non-dribble segments (excluding the shot itself)
  carries: number;    // dribble segments
  touches: number;    // total events in the chain
  durationSec: number;
  distanceM: number;
}

/**
 * Compute stats from a Goal's buildup waypoints.
 * Pitch coordinates are in metres already (x ∈ [-55, 55] → 110m, z ∈ [-30, 30] → 60m).
 */
export function computeGoalStats(goal: Goal): GoalStats {
  const wps = goal.buildup;
  let passes = 0;
  let carries = 0;
  let totalDist = 0;
  let totalDur = 0;

  for (let i = 1; i < wps.length; i++) {
    const prev = wps[i - 1];
    const curr = wps[i];
    const isShot = !!curr.isGoal;
    const isDribble = !!curr.dribble;

    if (!isShot) {
      if (isDribble) carries++;
      else passes++;
    }

    const dx = curr.x - prev.x;
    const dz = curr.z - prev.z;
    totalDist += Math.hypot(dx, dz);

    // Default per-segment duration if not set (matches animator.ts default)
    const ms = curr.duration ?? 900;
    totalDur += ms;
  }

  return {
    passes,
    carries,
    touches: wps.length,
    durationSec: totalDur / 1000,
    distanceM: totalDist,
  };
}

/** Narrative tag for the goal's xG (StatsBomb's 0–1 scale). Returns null if no xG present. */
export function xgLabel(xg: number | undefined): string | null {
  if (xg == null) return null;
  if (xg < 0.04) return 'WONDER STRIKE';
  if (xg < 0.08) return 'LONG SHOT';
  if (xg < 0.15) return 'HALF CHANCE';
  if (xg < 0.30) return 'GOOD CHANCE';
  if (xg < 0.55) return 'BIG CHANCE';
  if (xg < 0.80) return 'SHOULD HAVE SCORED';
  return 'SITTER';
}
