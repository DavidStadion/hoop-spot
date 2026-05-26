import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { audio } from '../lib/audio';
import styles from './Game.module.css';

const LETTERS = ['A', 'B', 'C', 'D'];

export function ScorerOptions() {
  const { goal, phase, answered, guess, skip } = useGameStore();

  function handleGuess(name: string) {
    if (useSettingsStore.getState().audio) {
      if (name === goal.scorer) audio.correctPing();
      else audio.wrongBuzz();
    }
    guess(name);
  }

  if (phase !== 'guessing' && phase !== 'correct' && phase !== 'wrong') return null;

  const resolved = phase === 'correct' || phase === 'wrong';

  return (
    <div className={styles.optionsWrap}>
      {phase === 'guessing' && (
        <p className={styles.optionsQuestion}>Who scored?</p>
      )}
      <div className={styles.optionsGrid}>
        {goal.options.map((name, i) => {
          let cls = styles.optionBtn;
          if (resolved) {
            if (name === goal.scorer) cls += ` ${styles.correct}`;
            else if (name === answered) cls += ` ${styles.wrong}`;
            else cls += ` ${styles.dim}`;
          }
          return (
            <button
              key={name}
              className={cls}
              disabled={resolved}
              onClick={() => handleGuess(name)}
            >
              <span className={styles.optionLetter}>{LETTERS[i]}</span>
              <span className={styles.optionName}>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Don't know — full width below the grid */}
      {!resolved && (
        <button className={`${styles.optionBtn} ${styles.dontKnow}`} onClick={skip}>
          <span className={styles.optionName}>Don't know</span>
        </button>
      )}
      {resolved && answered === '__skip__' && (
        <button className={`${styles.optionBtn} ${styles.dontKnow} ${styles.dim}`} disabled>
          <span className={styles.optionName}>Don't know</span>
        </button>
      )}

    </div>
  );
}
