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
  { key: 'audio',        label: 'Sound',                  description: 'Crowd ambient, shot release, tip-off whistle, crowd roar.' },
  { key: 'cinematic',    label: 'Cinematic basket moment',description: 'Slow-mo on the shot + black letterbox bars top and bottom.' },
  { key: 'goalStinger',  label: 'BUCKET! text burst',     description: 'Huge "BUCKET!" graphic that pops on the screen when the ball drops through.' },
  { key: 'weather',      label: 'Weather effects',        description: 'Legacy outdoor-mode toggle. Indoor arenas keep skies clear.' },
  { key: 'lighting',     label: 'Arena lighting',         description: 'Night / dusk / golden / overcast palettes per play. Off = neutral arena light.' },
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
