import { useEffect, useState, useMemo } from 'react';
import {
  getTeams, getGames, computeRecord, currentBDLSeason,
  type BDLTeam, type BDLGame,
} from '../lib/bdl';
import { getCrest } from '../data/assets';
import styles from './TeamMode.module.css';

type Props = {
  onBack: () => void;
};

type Loadable<T> =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ok'; data: T };

export function TeamMode({ onBack }: Props) {
  const [teams, setTeams] = useState<Loadable<BDLTeam[]>>({ state: 'loading' });
  const [selected, setSelected] = useState<BDLTeam | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeams()
      .then(data => { if (!cancelled) setTeams({ state: 'ok', data }); })
      .catch(err => { if (!cancelled) setTeams({ state: 'error', message: err.message }); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={selected ? () => setSelected(null) : onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className={styles.title}>{selected ? selected.full_name : 'Pick your team'}</h1>
        <span />
      </header>

      {selected ? (
        <TeamDetail team={selected} />
      ) : (
        <TeamGrid teams={teams} onPick={setSelected} />
      )}
    </div>
  );
}

// ─── Team grid ───────────────────────────────────────────────────────
function TeamGrid({ teams, onPick }: { teams: Loadable<BDLTeam[]>; onPick: (t: BDLTeam) => void }) {
  if (teams.state === 'loading') {
    return <div className={styles.loading}><div className={styles.spinner} /><span>Loading teams…</span></div>;
  }
  if (teams.state === 'error') {
    return (
      <div className={styles.errorBox}>
        <strong>Couldn't load teams.</strong>
        <p>{teams.message}</p>
        <p className={styles.hint}>
          If you just deployed, the BDL_API_KEY env var might not be set in Vercel yet.
        </p>
      </div>
    );
  }
  if (teams.state !== 'ok') return null;

  // Group teams by conference → division for a familiar layout
  const grouped = useMemo(() => {
    const map = new Map<string, BDLTeam[]>();
    for (const t of teams.data) {
      const key = `${t.conference} · ${t.division}`;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.full_name.localeCompare(b.full_name));
    return [...map.entries()].sort();
  }, [teams.data]);

  return (
    <div className={styles.gridScroll}>
      {grouped.map(([heading, divTeams]) => (
        <section key={heading} className={styles.section}>
          <h2 className={styles.sectionTitle}>{heading}</h2>
          <div className={styles.grid}>
            {divTeams.map(team => {
              const crest = getCrest(team.full_name) ?? getCrest(team.name);
              return (
                <button key={team.id} className={styles.teamCard} onClick={() => onPick(team)}>
                  {crest ? (
                    <img src={crest} alt="" className={styles.crest} />
                  ) : (
                    <div className={styles.crestFallback}>{team.abbreviation}</div>
                  )}
                  <span className={styles.teamName}>{team.name}</span>
                  <span className={styles.teamCity}>{team.city}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Team detail (recent games) ─────────────────────────────────────
function TeamDetail({ team }: { team: BDLTeam }) {
  const [games, setGames] = useState<Loadable<BDLGame[]>>({ state: 'loading' });
  const season = currentBDLSeason();
  const crest = getCrest(team.full_name) ?? getCrest(team.name);

  useEffect(() => {
    let cancelled = false;
    setGames({ state: 'loading' });
    getGames(team.id, season, 12)
      .then(data => { if (!cancelled) setGames({ state: 'ok', data }); })
      .catch(err => { if (!cancelled) setGames({ state: 'error', message: err.message }); });
    return () => { cancelled = true; };
  }, [team.id, season]);

  if (games.state !== 'ok') {
    if (games.state === 'error') {
      return <div className={styles.errorBox}><strong>Couldn't load games.</strong><p>{games.message}</p></div>;
    }
    return <div className={styles.loading}><div className={styles.spinner} /><span>Loading games…</span></div>;
  }

  const record = computeRecord(games.data, team.id);
  const finalGames = games.data.filter(g => g.status === 'Final');
  const recent = finalGames.slice(0, 8);

  return (
    <div className={styles.detailScroll}>
      <div className={styles.teamHero}>
        {crest && <img src={crest} alt="" className={styles.heroCrest} />}
        <div className={styles.heroText}>
          <span className={styles.heroEyebrow}>{team.conference} · {team.division}</span>
          <h2 className={styles.heroName}>{team.full_name}</h2>
          <span className={styles.heroMeta}>
            {season}–{String(season + 1).slice(2)} · {record.wins}–{record.losses} in last {finalGames.length} shown
          </span>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Recent games</h3>
      {recent.length === 0 ? (
        <div className={styles.loadingInline}>No games found for the {season} season yet.</div>
      ) : (
        <ul className={styles.gameList}>
          {recent.map(g => {
            const isHome = g.home_team.id === team.id;
            const opponent = isHome ? g.visitor_team : g.home_team;
            const teamScore = isHome ? g.home_team_score : g.visitor_team_score;
            const oppScore  = isHome ? g.visitor_team_score : g.home_team_score;
            const won = teamScore > oppScore;
            const oppCrest = getCrest(opponent.full_name) ?? getCrest(opponent.name);
            return (
              <li key={g.id} className={styles.gameRow}>
                <span className={`${styles.wlPill} ${won ? styles.wPill : styles.lPill}`}>
                  {won ? 'W' : 'L'}
                </span>
                <div className={styles.gameOpp}>
                  {oppCrest && <img src={oppCrest} alt="" className={styles.oppCrest} />}
                  <div className={styles.gameOppText}>
                    <span className={styles.gameVs}>{isHome ? 'vs' : '@'}</span>
                    <span className={styles.gameOppName}>{opponent.name}</span>
                  </div>
                </div>
                <div className={styles.gameScore}>
                  <span className={styles.gameScoreLine}>{teamScore} – {oppScore}</span>
                  <span className={styles.gameDate}>{formatGameDate(g.date)}{g.postseason ? ' · Playoffs' : ''}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatGameDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
