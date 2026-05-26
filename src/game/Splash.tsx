import styles from './Splash.module.css';

type Props = {
  onStart: () => void;
  exiting?: boolean;
};

export function Splash({ onStart, exiting }: Props) {
  return (
    <div className={`${styles.shell} ${exiting ? styles.exiting : ''}`}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.content}>
        <h1 className={styles.name}>Hoop Spot</h1>
        <p className={styles.tagline}>Five famous baskets. Four names. One scorer.</p>

        <div className={styles.btnStack}>
          <button className={`${styles.actionBtn} ${styles.primary}`} onClick={onStart}>
            Start playing
          </button>
        </div>
      </div>

      <span className={styles.credit}>Made by Dave</span>
    </div>
  );
}
