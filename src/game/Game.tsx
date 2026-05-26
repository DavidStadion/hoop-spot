import { useState, useEffect } from 'react';
import { useGameStore, ROUND_SIZE } from '../store/gameStore';
import { getCrest } from '../data/assets';
import { SceneCanvas } from './SceneCanvas';
import { MatchIntro } from './MatchIntro';
import { RoundComplete } from './RoundComplete';
import { EventLabel } from './EventLabel';
import { ScorerOptions } from './ScorerOptions';
import { ResultReveal } from './ResultReveal';
import { StreakToast } from './StreakToast';
import { PitchCountdown } from './PitchCountdown';
import { GoalMenu } from './GoalMenu';
import { Cinematic } from './Cinematic';
import { Settings } from './Settings';
import { useSettingsStore } from '../store/settingsStore';
import styles from './Game.module.css';

const MAX_PIPS = ROUND_SIZE;

// Fuzzy match so `Manchester United` matches `Man United` in side names.
function isScoringTeam(scoringTeam: string, sideName: string): boolean {
  const a = scoringTeam.toLowerCase();
  const b = sideName.toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function TeamIcon({ team, color }: { team: string; color: string }) {
  const crest = getCrest(team);
  if (crest) return <img src={crest} alt={team} className={styles.teamCrestSmall} />;
  return <span className={styles.teamDot} style={{ background: color }} />;
}

export function Game({ onQuit }: { onQuit: () => void }) {
  const { goal, score, queueIdx, phase, roundResults, exploring, setExploring, replay } = useGameStore();
  const { homeTeam, awayTeam, homeScore, awayScore, homeColor, awayColor, comp, year, clock } = goal.meta;
  const round = queueIdx + 1;
  const [justLitIdx, setJustLitIdx] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const audioOn = useSettingsStore((s) => s.audio);
  const toggleAudio = useSettingsStore((s) => s.toggle);

  useEffect(() => {
    if (phase === 'correct') {
      setJustLitIdx(score - 1);
      const t = setTimeout(() => setJustLitIdx(-1), 600);
      return () => clearTimeout(t);
    }
  }, [phase, score]);

  return (
    <div className={styles.shell}>
      <MatchIntro />
      <RoundComplete onQuit={onQuit} />
      <StreakToast />

      <GoalMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <header className={styles.header}>
        <button className={styles.iconBtn} onClick={onQuit} aria-label="Quit">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
        <span className={styles.wordmark}>Hoop Spot</span>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtn}
            onClick={() => toggleAudio('audio')}
            aria-label={audioOn ? 'Mute sound' : 'Unmute sound'}
            aria-pressed={audioOn}
          >
            {audioOn ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H3v6h3l5 4z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5a9 9 0 0 1 0 14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5L6 9H3v6h3l5 4z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
          <button className={styles.iconBtn} onClick={() => setSettingsOpen(true)} aria-label="Settings">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button className={styles.iconBtn} onClick={() => setMenuOpen(true)} aria-label="Browse all hoops">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      <div className={styles.progressBar}>
        <span className={styles.roundCounter}>Hoop {round} of {MAX_PIPS}</span>
        <div className={styles.scoreWrap}>
          {Array.from({ length: MAX_PIPS }).map((_, i) => {
            const played = i < roundResults.length;
            const correct = played && roundResults[i];
            const wrong = played && !roundResults[i];
            return (
              <span
                key={i}
                className={[
                  styles.scorePip,
                  correct ? styles.lit : '',
                  wrong ? styles.wrongPip : '',
                  i === justLitIdx ? styles.justLit : '',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.stageWrap}>
        <SceneCanvas />
        <PitchCountdown />
        <EventLabel />
        <Cinematic />
      </div>

      {!exploring && (() => {
        const controlsEnabled = phase === 'guessing' || phase === 'correct' || phase === 'wrong';
        return (
          <div className={styles.pitchControls}>
            <button
              className={styles.pitchCtrlBtn}
              onClick={replay}
              disabled={!controlsEnabled}
              aria-disabled={!controlsEnabled}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Replay
            </button>
            <button
              className={styles.pitchCtrlBtn}
              onClick={() => setExploring(true)}
              disabled={!controlsEnabled}
              aria-disabled={!controlsEnabled}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9V5a1 1 0 0 1 1-1h4" />
                <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
                <path d="M4 15v4a1 1 0 0 0 1 1h4" />
                <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
              </svg>
              Explore
            </button>
          </div>
        );
      })()}

      <div className={styles.matchHeader}>
        <div className={styles.matchComp}>{comp} &middot; {year}</div>
        <div className={styles.matchTeams}>
          <div className={`${styles.matchTeam} ${isScoringTeam(goal.meta.team, homeTeam) ? styles.scoringTeam : ''}`}>
            <TeamIcon team={homeTeam} color={homeColor} />
            <span className={styles.teamName}>{homeTeam}</span>
          </div>
          <div className={styles.matchScore}>{homeScore}–{awayScore}</div>
          <div className={`${styles.matchTeam} ${styles.matchTeamRight} ${isScoringTeam(goal.meta.team, awayTeam) ? styles.scoringTeam : ''}`}>
            <TeamIcon team={awayTeam} color={awayColor} />
            <span className={styles.teamName}>{awayTeam}</span>
          </div>
        </div>
        <div className={styles.matchClock}>&#9201; {clock}</div>
        {(goal.meta.arena || goal.meta.stadium) && (
          <div className={styles.matchStadium}>{goal.meta.arena ?? goal.meta.stadium}</div>
        )}
      </div>

      <div className={styles.panel}>
        <ScorerOptions />
      </div>

      <ResultReveal />
    </div>
  );
}
