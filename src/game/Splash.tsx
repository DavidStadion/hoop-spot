import styles from './Splash.module.css';

type Props = {
  onStart: () => void;
  onStatsBomb: () => void;
  onPickClub: () => void;
  exiting?: boolean;
};

export function Splash({ onStart, onStatsBomb, onPickClub, exiting }: Props) {
  return (
    <div className={`${styles.shell} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.content}>
        <h1 className={styles.name}>Goal Spot</h1>

        <div className={styles.btnStack}>
          <button className={`${styles.actionBtn} ${styles.primary}`} onClick={onStart}>
            Start playing
          </button>
          <button className={`${styles.actionBtn} ${styles.outline}`} onClick={onPickClub}>
            Pick your club
          </button>
          <button className={`${styles.actionBtn} ${styles.ghost}`} onClick={onStatsBomb}>
            StatsBomb
          </button>
        </div>
      </div>

      <span className={styles.credit}>Made by Dave</span>
    </div>
  );
}
