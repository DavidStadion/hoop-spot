import { describe, it, expect } from 'vitest';
import { GOALS } from './goals';

describe('GOALS dataset', () => {
  it('has at least 5 goals', () => {
    expect(GOALS.length).toBeGreaterThanOrEqual(5);
  });

  it.each(GOALS)('$id — last waypoint is isGoal', (g) => {
    expect(g.buildup.at(-1)?.isGoal).toBe(true);
  });

  it.each(GOALS)('$id — exactly 4 options including scorer', (g) => {
    expect(g.options).toHaveLength(4);
    expect(g.options).toContain(g.scorer);
  });

  it.each(GOALS)('$id — unique options', (g) => {
    expect(new Set(g.options).size).toBe(4);
  });

  it.each(GOALS)('$id — buildup 3-5 waypoints', (g) => {
    expect(g.buildup.length).toBeGreaterThanOrEqual(3);
    expect(g.buildup.length).toBeLessThanOrEqual(5);
  });

  it.each(GOALS)('$id — x coordinates in range', (g) => {
    for (const wp of g.buildup) {
      expect(wp.x).toBeGreaterThanOrEqual(-55);
      expect(wp.x).toBeLessThanOrEqual(55);
    }
  });
});
