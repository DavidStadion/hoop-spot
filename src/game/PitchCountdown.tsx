import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import styles from './PitchCountdown.module.css';

export function PitchCountdown() {
  const phase = useGameStore((s) => s.phase);
  const startPlay = useGameStore((s) => s.startPlay);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== 'countdown') { setCount(null); return; }
    setCount(3);
  }, [phase]);

  useEffect(() => {
    if (count === null) return;
    if (count === 0) {
      startPlay();
      return;
    }
    const t = setTimeout(() => setCount((c) => (c ?? 1) - 1), 850);
    return () => clearTimeout(t);
  }, [count]);

  if (phase !== 'countdown' || count === null) return null;

  return (
    <div className={styles.overlay}>
      <span key={count} className={styles.num}>{count}</span>
    </div>
  );
}
