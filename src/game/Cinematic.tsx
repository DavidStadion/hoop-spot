import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { computeGoalStats, xgLabel } from '../lib/goal-stats';
import styles from './Cinematic.module.css';

export function Cinematic() {
  const cinematicEnabled  = useSettingsStore((s) => s.cinematic);
  const stingerEnabled    = useSettingsStore((s) => s.goalStinger);
  const cinematic = useGameStore((s) => s.cinematic) && cinematicEnabled;
  const stingerKey = useGameStore((s) => s.goalStingerKey);
  const goal = useGameStore((s) => s.goal);
  const [stingerOn, setStingerOn] = useState(false);
  const stingerTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (stingerKey === 0 || !stingerEnabled) return;
    setStingerOn(false);
    // next frame so the animation can restart
    const raf = requestAnimationFrame(() => setStingerOn(true));
    if (stingerTimerRef.current) window.clearTimeout(stingerTimerRef.current);
    stingerTimerRef.current = window.setTimeout(() => setStingerOn(false), 1800);
    return () => {
      cancelAnimationFrame(raf);
      if (stingerTimerRef.current) window.clearTimeout(stingerTimerRef.current);
    };
  }, [stingerKey, stingerEnabled]);

  return (
    <>
      {/* Letterbox bars */}
      <div className={`${styles.bar} ${styles.barTop} ${cinematic ? styles.barIn : ''}`} aria-hidden="true" />
      <div className={`${styles.bar} ${styles.barBottom} ${cinematic ? styles.barIn : ''}`} aria-hidden="true" />

      {/* Goal stinger */}
      {stingerOn && (() => {
        const stats = computeGoalStats(goal);
        const tag = xgLabel(goal.meta.xg);
        return (
          <div className={styles.stinger} aria-hidden="true">
            <span className={styles.stingerText}>GOAL!</span>
            {tag && (
              <span className={styles.stingerTag}>
                {tag}
                {goal.meta.xg != null && <span className={styles.stingerXg}> · xG {goal.meta.xg.toFixed(2)}</span>}
              </span>
            )}
            <span className={styles.statChip}>
              <span className={styles.statItem}>
                <strong>{stats.passes}</strong> passes
              </span>
              <span className={styles.statDivider}>·</span>
              <span className={styles.statItem}>
                <strong>{stats.durationSec.toFixed(1)}</strong>s
              </span>
              <span className={styles.statDivider}>·</span>
              <span className={styles.statItem}>
                <strong>{Math.round(stats.distanceM)}</strong>m
              </span>
            </span>
          </div>
        );
      })()}
    </>
  );
}
