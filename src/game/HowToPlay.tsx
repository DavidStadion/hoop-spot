import { useState } from 'react';
import styles from './HowToPlay.module.css';

interface Props {
  onClose: () => void;
}

const STORAGE_KEY = 'goalspot.skipHowTo';

export function shouldSkipHowToPlay(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

export function resetHowToPlayPreference(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

export function HowToPlay({ onClose }: Props) {
  const [dontShow, setDontShow] = useState(false);

  function handleClose() {
    if (dontShow) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    }
    onClose();
  }

  return (
    <div className={styles.shell}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <div className={styles.content}>
        <h1 className={styles.title}>How to play</h1>
        <p className={styles.subtitle}>Five famous goals. Four names. One scorer.</p>

        <ol className={styles.steps}>
          <li className={styles.step}>
            <span className={styles.stepIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            <div className={styles.stepText}>
              <strong>Watch the build-up</strong>
              <span>Each goal is recreated on a 3D pitch — passes, runs and the finish.</span>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 9a2.5 2.5 0 1 1 3 2.45c-.83.2-1.5.94-1.5 1.8V14" />
                <circle cx="11" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div className={styles.stepText}>
              <strong>Guess the scorer</strong>
              <span>Pick from four names. Stuck? Tap "Don't know" to skip.</span>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <polyline points="21 4 21 9 16 9" />
              </svg>
            </span>
            <div className={styles.stepText}>
              <strong>Replay or explore</strong>
              <span>Replay the build-up, or drag to orbit the pitch in 3D.</span>
            </div>
          </li>

          <li className={styles.step}>
            <span className={styles.stepIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </span>
            <div className={styles.stepText}>
              <strong>Build a streak</strong>
              <span>Five goals per round. Get them all right for a perfect streak.</span>
            </div>
          </li>
        </ol>

        <label className={styles.skipRow}>
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className={styles.skipCheckbox}
          />
          <span className={styles.skipBox} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className={styles.skipLabel}>Don't show this again</span>
        </label>

        <button className={styles.cta} onClick={handleClose}>
          Let's play
        </button>
      </div>
    </div>
  );
}
