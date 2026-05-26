import { useEffect, useState } from 'react';
import {
  listCompetitions, listMatches, importGoalsFromMatch,
  type SBCompetition, type SBMatch,
} from '../lib/statsbomb';
import { useGameStore } from '../store/gameStore';
import { getCrest, getCompLogo } from '../data/assets';
import type { Goal } from '../data/types';
import styles from './StatsBombMode.module.css';

interface Props {
  onBack: () => void;
  onPlay: () => void;
}

// Curated featured competitions — full StatsBomb open data has 30+ entries,
// these are the most recognisable for testing.
const FEATURED_COMPS = new Set([
  'FIFA World Cup',
  'Champions League',
  'UEFA Euro',
  'UEFA Women\'s Euro',
  'Women\'s World Cup',
  'La Liga',
  'Premier League',
  'Copa America',
  'African Cup of Nations',
  'Copa del Rey',
]);

type Screen = 'comp' | 'matches' | 'goals';

function CompCrest({ name }: { name: string }) {
  const src = getCompLogo(name);
  if (src) return <img src={src} alt="" className={styles.compLogo} />;
  return <span className={styles.compLogoPlaceholder} aria-hidden="true" />;
}

function TeamCrest({ name }: { name: string }) {
  const src = getCrest(name);
  if (src) return <img src={src} alt="" className={styles.teamCrest} />;
  return <span className={styles.teamCrestPlaceholder} aria-hidden="true">{(name || '?').slice(0, 1)}</span>;
}

export function StatsBombMode({ onBack, onPlay }: Props) {
  const [screen, setScreen] = useState<Screen>('comp');
  const [competitions, setCompetitions] = useState<SBCompetition[] | null>(null);
  const [selectedComp, setSelectedComp] = useState<SBCompetition | null>(null);
  const [matches, setMatches] = useState<SBMatch[] | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<SBMatch | null>(null);
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const playCustom = useGameStore((s) => s.playCustom);

  // Load competitions on mount
  useEffect(() => {
    if (competitions) return;
    setLoading(true);
    listCompetitions()
      .then((all) => {
        // Filter to featured + sort by season name desc (newest first)
        const featured = all
          .filter((c) => FEATURED_COMPS.has(c.competition_name))
          .sort((a, b) => {
            // Sort by competition name, then newest season first within
            const compCmp = a.competition_name.localeCompare(b.competition_name);
            if (compCmp !== 0) return compCmp;
            return b.season_name.localeCompare(a.season_name);
          });
        setCompetitions(featured);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [competitions]);

  async function pickCompetition(c: SBCompetition) {
    setSelectedComp(c);
    setMatches(null);
    setError(null);
    setLoading(true);
    try {
      const m = await listMatches(c.competition_id, c.season_id);
      setMatches(m.sort((a, b) => (b.match_date || '').localeCompare(a.match_date || '')));
      setScreen('matches');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function pickMatch(m: SBMatch) {
    setSelectedMatch(m);
    setGoals(null);
    setError(null);
    setLoading(true);
    try {
      const g = await importGoalsFromMatch(m.match_id, m);
      setGoals(g);
      setScreen('goals');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function playGoal(g: Goal) {
    playCustom(g);
    onPlay();
  }

  function back() {
    if (screen === 'goals') { setScreen('matches'); setGoals(null); return; }
    if (screen === 'matches') { setScreen('comp'); setMatches(null); setSelectedComp(null); return; }
    onBack();
  }

  return (
    <div className={styles.shell}>
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <header className={styles.header}>
        <button className={styles.backBtn} onClick={back} aria-label="Back">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>StatsBomb Mode · Experimental</span>
          <h1 className={styles.title}>
            {screen === 'comp'    && 'Pick a competition'}
            {screen === 'matches' && selectedComp?.competition_name}
            {screen === 'goals'   && `${selectedMatch?.home_team.home_team_name} ${selectedMatch?.home_score}–${selectedMatch?.away_score} ${selectedMatch?.away_team.away_team_name}`}
          </h1>
          {screen === 'matches' && selectedComp && (
            <span className={styles.subtitle}>{selectedComp.season_name}</span>
          )}
          {screen === 'goals' && selectedMatch && (
            <span className={styles.subtitle}>
              {(selectedMatch.match_date || '').slice(0, 10)} · {selectedMatch.stadium?.name ?? '—'}
            </span>
          )}
        </div>
      </header>

      <div className={styles.body}>
        {error && <div className={styles.error}>Couldn't load: {error}</div>}
        {loading && <div className={styles.loading}><div className={styles.spinner} /><span>Loading from StatsBomb…</span></div>}

        {/* ── Competition list ───────────────────────────────── */}
        {!loading && screen === 'comp' && competitions && (
          <div className={styles.list}>
            {competitions.map((c) => (
              <button
                key={`${c.competition_id}-${c.season_id}`}
                className={styles.row}
                onClick={() => pickCompetition(c)}
              >
                <CompCrest name={c.competition_name} />
                <span className={styles.rowMain}>
                  <strong>{c.competition_name}</strong>
                  <span className={styles.rowSub}>{c.season_name} · {c.country_name}</span>
                </span>
                <span className={styles.arrow}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Match list ─────────────────────────────────────── */}
        {!loading && screen === 'matches' && matches && (
          <div className={styles.list}>
            {matches.map((m) => (
              <button
                key={m.match_id}
                className={styles.row}
                onClick={() => pickMatch(m)}
              >
                <span className={styles.matchCol}>
                  <span className={styles.matchTeams}>
                    <TeamCrest name={m.home_team.home_team_name} />
                    <span className={styles.matchTeamsBody}>
                      <strong>{m.home_team.home_team_name}</strong>
                      <span className={styles.score}>{m.home_score}–{m.away_score}</span>
                      <strong>{m.away_team.away_team_name}</strong>
                    </span>
                    <TeamCrest name={m.away_team.away_team_name} />
                  </span>
                  <span className={styles.matchMeta}>
                    {(m.match_date || '').slice(0, 10)}{m.stadium ? ` · ${m.stadium.name}` : ''}
                  </span>
                </span>
                <span className={styles.arrow}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Goals list — scorer hidden until you play ──────── */}
        {!loading && screen === 'goals' && goals && (
          <div className={styles.list}>
            {goals.length === 0 && (
              <div className={styles.empty}>No goals were parsed from this match. Try another.</div>
            )}
            {goals.map((g, i) => (
              <button
                key={g.id}
                className={styles.row}
                onClick={() => playGoal(g)}
              >
                <span className={styles.goalNum}>{i + 1}</span>
                <span className={styles.rowMain}>
                  <strong className={styles.goalRowTitle}>Goal {i + 1} <span className={styles.mystery}>· who scored?</span></strong>
                  <span className={styles.rowSub}>
                    <TeamCrest name={g.meta.team} />
                    {g.meta.team} · {g.meta.clock} · {g.buildup.length} touches
                  </span>
                </span>
                <span className={styles.arrow}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
