import { useGameStore } from '../store/gameStore';
import styles from './Game.module.css';

export function StartOverlay() {
  const phase = useGameStore((s) => s.phase);
  const startPlay = useGameStore((s) => s.startPlay);

  if (phase !== 'idle') return null;

  return (
    <div className={styles.startOverlay}>
      <button className={styles.playBtn} onClick={startPlay}>
        Watch the build-up
      </button>
    </div>
  );
}
