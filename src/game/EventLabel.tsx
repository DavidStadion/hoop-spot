import { useGameStore } from '../store/gameStore';
import styles from './Game.module.css';

export function EventLabel() {
  const label = useGameStore((s) => s.label);
  if (!label) return null;
  return <div className={styles.eventLabel}>{label}</div>;
}
