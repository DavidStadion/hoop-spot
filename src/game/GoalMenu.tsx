import { useEffect, useRef } from 'react';
import { GOALS } from '../data/goals';
import { useGameStore } from '../store/gameStore';
import { getCrest } from '../data/assets';
import styles from './GoalMenu.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

function TeamBadge({ team, color }: { team: string; color: string }) {
  const crest = getCrest(team);
  if (crest) return <img src={crest} alt={team} className={styles.crest} />;
  return <span className={styles.dot} style={{ background: color }} />;
}

// Group goals by competition
function groupByComp(goals: typeof GOALS) {
  const map = new Map<string, typeof GOALS>();
  for (const g of goals) {
    const key = g.meta.comp;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(g);
  }
  // Sort groups by earliest year
  return Array.from(map.entries()).sort(([, a], [, b]) =>
    parseInt(a[0].meta.year) - parseInt(b[0].meta.year)
  );
}

export function GoalMenu({ open, onClose }: Props) {
  const { playSpecific } = useGameStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const groups = groupByComp([...GOALS].sort((a, b) => parseInt(b.meta.year) - parseInt(a.meta.year)));

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Trap focus / close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function handleSelect(id: string) {
    playSpecific(id);
    onClose();
  }

  return (
    <div
      className={`${styles.backdrop} ${open ? styles.open : ''}`}
      onClick={handleBackdrop}
      aria-hidden={!open}
    >
      <div className={styles.drawer} ref={drawerRef} role="dialog" aria-label="All hoops">
        <div className={styles.handle} />
        <div className={styles.drawerHead}>
          <h2 className={styles.drawerTitle}>All Hoops</h2>
          <span className={styles.drawerCount}>{GOALS.length} moments</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.list}>
          {groups.map(([comp, goals]) => (
            <div key={comp} className={styles.group}>
              <div className={styles.groupLabel}>{comp}</div>
              {goals.map(g => (
                <button
                  key={g.id}
                  className={styles.row}
                  onClick={() => handleSelect(g.id)}
                >
                  <span className={styles.year}>{g.meta.year}</span>
                  <span className={styles.teams}>
                    <TeamBadge team={g.meta.homeTeam} color={g.meta.homeColor} />
                    <span className={styles.teamNames}>
                      <span className={styles.teamName}>{g.meta.homeTeam}</span>
                      <span className={styles.score}>{g.meta.homeScore}–{g.meta.awayScore}</span>
                      <span className={styles.teamName}>{g.meta.awayTeam}</span>
                    </span>
                    <TeamBadge team={g.meta.awayTeam} color={g.meta.awayColor} />
                  </span>
                  <span className={styles.arrow}>›</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
