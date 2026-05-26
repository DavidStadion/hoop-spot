import { useGameStore } from '../store/gameStore';
import styles from './StreakToast.module.css';

const MESSAGES: Record<number, string> = {
  2: '🔥 2 in a row!',
  3: '🔥🔥 3 in a row!',
  4: '🔥🔥🔥 On fire!',
  5: '🏆 Perfect round!',
};

export function StreakToast() {
  const streak = useGameStore((s) => s.streak);
  const phase = useGameStore((s) => s.phase);

  if (phase !== 'correct' || streak < 2) return null;

  const msg = MESSAGES[streak] ?? `🔥 ${streak} in a row!`;

  return (
    <div key={streak} className={styles.toast}>
      {msg}
    </div>
  );
}
