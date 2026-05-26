import { useState } from 'react';
import { useGameStore, ROUND_SIZE } from '../store/gameStore';
import { useCollectionStore } from '../store/collectionStore';
import { computeGoalStats } from '../lib/goal-stats';
import { PosterPreview } from './PosterPreview';
import styles from './ResultReveal.module.css';

export function ResultReveal() {
  const { goal, phase, queueIdx, next, answered } = useGameStore();
  const [posterOpen, setPosterOpen] = useState(false);
  const isSaved = useCollectionStore((s) => s.isSaved(goal.id));
  const addToCollection = useCollectionStore((s) => s.add);
  const removeFromCollection = useCollectionStore((s) => s.remove);

  const isStatsBombGoal = goal.id.startsWith('sb-');

  if (phase !== 'correct' && phase !== 'wrong') return null;

  const correct = phase === 'correct';
  const skipped = answered === '__skip__';
  const isLastGoal = queueIdx + 1 >= ROUND_SIZE;
  const stats = computeGoalStats(goal);
  const pts = goal.meta.points ?? 2;
  const ptsLabel = pts === 3 ? '3PT' : pts === 1 ? 'FT' : '2PT';

  return (
    <>
      <div className={styles.backdrop} />
      <div className={`${styles.sheet} ${correct ? styles.sheetCorrect : styles.sheetWrong}`} role="dialog">
        {/* ── Verdict row ─────────────────────────────────────── */}
        <div className={styles.verdictRow}>
          <div className={`${styles.iconWrap} ${correct ? styles.iconCorrect : styles.iconWrong}`}>
            {correct ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className={styles.verdictText}>
            <span className={`${styles.verdict} ${correct ? styles.verdictCorrect : styles.verdictWrong}`}>
              {correct ? 'Correct!' : skipped ? 'Skipped' : 'Wrong'}
            </span>
            <span className={styles.verdictSub}>
              {correct ? 'Nice spot.' : skipped ? 'No worries — moving on.' : "Don't worry — here's the answer."}
            </span>
          </div>
          <span className={styles.xgPill}>
            {ptsLabel}
            <span className={styles.xgValue}>+{pts}</span>
          </span>
        </div>

        {/* ── Scorer card ─────────────────────────────────────── */}
        <div className={styles.scorerCard}>
          <span className={styles.scorerEyebrow}>Scored by</span>
          <span className={styles.scorerName}>{goal.scorer}</span>
          {goal.meta.assister && (
            <span className={styles.assisterLine}>
              <span className={styles.assistLabel}>ASSIST</span>
              {goal.meta.assister}
            </span>
          )}
        </div>

        {/* ── Stat strip ──────────────────────────────────────── */}
        <div className={styles.statStrip}>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{stats.passes}</span>
            <span className={styles.statLabel}>{stats.passes === 1 ? 'pass' : 'passes'}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{stats.durationSec.toFixed(1)}<span className={styles.statUnit}>s</span></span>
            <span className={styles.statLabel}>build-up</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statValue}>{Math.round(stats.distanceM)}<span className={styles.statUnit}>m</span></span>
            <span className={styles.statLabel}>travelled</span>
          </div>
        </div>

        {/* ── Fact ────────────────────────────────────────────── */}
        <p className={styles.fact}>{goal.fact}</p>

        {/* ── Secondary action chips ──────────────────────────── */}
        <div className={styles.chipRow}>
          {isStatsBombGoal && (
            <button
              className={`${styles.chipBtn} ${styles.saveChip} ${isSaved ? styles.saved : ''}`}
              onClick={() => isSaved ? removeFromCollection(goal.id) : addToCollection(goal)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12,2 15,9 22,9 16.5,13.5 19,21 12,16.5 5,21 7.5,13.5 2,9 9,9" />
              </svg>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}
          <button className={`${styles.chipBtn} ${styles.posterChip}`} onClick={() => setPosterOpen(true)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
            <span>Get poster</span>
          </button>
        </div>

        {/* ── Primary CTA ─────────────────────────────────────── */}
        <button className={styles.nextBtn} onClick={next}>
          {isLastGoal ? 'See results' : 'Next hoop'}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <PosterPreview goal={goal} open={posterOpen} onClose={() => setPosterOpen(false)} />
    </>
  );
}
