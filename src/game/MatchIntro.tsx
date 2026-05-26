import { useState, useEffect } from 'react';
import { useGameStore, ROUND_SIZE } from '../store/gameStore';
import { getCrest, getCompLogo } from '../data/assets';
import styles from './MatchIntro.module.css';

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

type BadgeProps = { team: string; color: string };

function TeamBadge({ team, color }: BadgeProps) {
  const crest = getCrest(team);
  if (crest) {
    return (
      <div className={styles.badge} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <img src={crest} alt={team} className={styles.crestImg} />
      </div>
    );
  }
  return (
    <div className={styles.badge} style={{ background: color }}>
      {initials(team)}
    </div>
  );
}

export function MatchIntro() {
  const phase = useGameStore((s) => s.phase);
  const goal = useGameStore((s) => s.goal);
  const queueIdx = useGameStore((s) => s.queueIdx);
  const startCountdown = useGameStore((s) => s.startCountdown);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (phase === 'idle') setLeaving(false);
  }, [phase]);

  if (phase !== 'idle') return null;

  const { homeTeam, awayTeam, homeScore, awayScore, homeColor, awayColor, comp, year, clock } = goal.meta;
  const compLogo = getCompLogo(comp);

  function handleWatch() {
    setLeaving(true);
    setTimeout(() => startCountdown(), 420);
  }

  return (
    <div className={`${styles.overlay} ${leaving ? styles.leaving : ''}`}>
      <p className={styles.roundLabel}>Hoop {queueIdx + 1} of {ROUND_SIZE}</p>

      {compLogo ? (
        <img src={compLogo} alt={comp} className={styles.compLogo} />
      ) : (
        <p className={styles.comp}>{comp} &middot; {year}</p>
      )}
      {compLogo && <p className={styles.compYear}>{year}</p>}

      <div className={styles.matchRow}>
        <div className={styles.team}>
          <TeamBadge team={homeTeam} color={homeColor} />
          <span className={styles.teamName}>{homeTeam}</span>
        </div>

        <div className={styles.scoreWrap}>
          <div className={styles.score}>
            <span>{homeScore}</span>
            <span className={styles.scoreSep}> – </span>
            <span>{awayScore}</span>
          </div>
          <span className={styles.clock}>&#9201; {clock}</span>
        </div>

        <div className={styles.team}>
          <TeamBadge team={awayTeam} color={awayColor} />
          <span className={styles.teamName}>{awayTeam}</span>
        </div>
      </div>

      <button className={styles.watchBtn} onClick={handleWatch}>
        Watch build-up →
      </button>
    </div>
  );
}
