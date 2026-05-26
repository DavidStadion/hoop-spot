import { useEffect } from 'react';
import { useSettingsStore, type Settings } from '../store/settingsStore';
import styles from './Settings.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Item = {
  key: keyof Settings;
  label: string;
  description: string;
};

const ITEMS: Item[] = [
  { key: 'audio',        label: 'Sound',                  description: 'Crowd ambient, ball kicks, kickoff whistle, goal roar.' },
  { key: 'cinematic',    label: 'Cinematic goal moment',  description: 'Slow-mo on the strike + black letterbox bars top and bottom.' },
  { key: 'goalStinger',  label: 'GOAL! text burst',       description: 'Huge "GOAL!" graphic that pops on the screen when the ball hits the net.' },
  { key: 'weather',      label: 'Weather effects',        description: 'Rain on the wet-day goals (Beckham, Rooney, Ronaldinho, Bergkamp).' },
  { key: 'lighting',     label: 'Stadium lighting',       description: 'Night / dusk / golden / overcast palettes per goal. Off = neutral daylight.' },
  { key: 'whipPan',      label: 'Whip-pan transitions',   description: 'Camera swings between shots like a broadcast.' },
  { key: 'crowdFlashes', label: 'Crowd camera flashes',   description: 'Twinkling phone-camera flashes in the stands.' },
  { key: 'dribbleCam',   label: 'Dribble chase camera',   description: 'Tight low chase angle for single-player dribble waypoints.' },
  { key: 'dribbleTrail', label: 'Dribble dust trail',     description: 'Small particle puffs kicked up behind the ball during dribbles.' },
];

export function Settings({ open, onClose }: Props) {
  const settings = useSettingsStore();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div
      className={`${styles.backdrop} ${open ? styles.open : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-hidden={!open}
    >
      <div className={styles.drawer} role="dialog" aria-label="Settings">
        <div className={styles.handle} />
        <div className={styles.head}>
          <h2 className={styles.title}>Settings</h2>
          <span className={styles.subtitle}>Toggle effects to test what plays best</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.list}>
          {ITEMS.map((item) => (
            <label key={item.key} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowLabel}>{item.label}</span>
                <span className={styles.rowDesc}>{item.description}</span>
              </div>
              <input
                type="checkbox"
                className={styles.switchInput}
                checked={settings[item.key]}
                onChange={() => settings.toggle(item.key)}
                aria-label={item.label}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
            </label>
          ))}
        </div>

        <button className={styles.resetBtn} onClick={() => settings.reset()}>
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
