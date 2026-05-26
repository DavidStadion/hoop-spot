import { useGameStore, ROUND_SIZE } from '../store/gameStore';
import styles from './RoundComplete.module.css';

function getMessage(score: number): string {
  if (score === 5) return 'Perfect round. You know your football history.';
  if (score >= 4) return 'Nearly perfect — great knowledge.';
  if (score >= 3) return 'Decent. You know your goals.';
  if (score >= 2) return 'Keep playing — it gets easier.';
  return 'Brush up on the classics.';
}

export function RoundComplete({ onQuit }: { onQuit: () => void }) {
  const { phase, score, roundResults, resetRound } = useGameStore();

  if (phase !== 'finished') return null;

  return (
    <div className={styles.overlay}>
      <p className={styles.label}>Round complete</p>

      <div className={styles.scoreDisplay}>
        <span className={styles.scoreNum}>{score}</span>
        <span className={styles.scoreDenom}>/{ROUND_SIZE}</span>
      </div>

      <div className={styles.emojis}>
        {roundResults.map((correct, i) => (
          <span key={i} className={correct ? styles.hit : styles.miss}>
            {correct ? '⚽' : '○'}
          </span>
        ))}
      </div>

      <p className={styles.message}>{getMessage(score)}</p>

      <div className={styles.actions}>
        <button className={styles.playAgain} onClick={resetRound}>
          Play again →
        </button>
        <button className={styles.quitBtn} onClick={onQuit}>
          Quit
        </button>
      </div>
    </div>
  );
}
