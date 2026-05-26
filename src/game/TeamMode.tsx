import { useEffect, useState, useMemo } from 'react';
import {
  getTeams, getRoster, getSeasonAverages, currentBDLSeason,
  type BDLTeam, type BDLPlayer, type BDLSeasonAverages,
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

// ─── Team detail ────────────────────────────────────────────────────
function TeamDetail({ team }: { team: BDLTeam }) {
  const [roster, setRoster] = useState<Loadable<BDLPlayer[]>>({ state: 'loading' });
  const [averages, setAverages] = useState<Loadable<BDLSeasonAverages[]>>({ state: 'loading' });
  const season = currentBDLSeason();
  const crest = getCrest(team.full_name) ?? getCrest(team.name);

  useEffect(() => {
    let cancelled = false;
    setRoster({ state: 'loading' });
    setAverages({ state: 'loading' });
    getRoster(team.id)
      .then(async data => {
        if (cancelled) return;
        setRoster({ state: 'ok', data });
        try {
          const avg = await getSeasonAverages(data.map(p => p.id), season);
          if (!cancelled) setAverages({ state: 'ok', data: avg });
        } catch (err) {
          if (!cancelled) setAverages({ state: 'error', message: (err as Error).message });
        }
      })
      .catch(err => { if (!cancelled) setRoster({ state: 'error', message: err.message }); });
    return () => { cancelled = true; };
  }, [team.id, season]);

  if (roster.state !== 'ok') {
    if (roster.state === 'error') {
      return <div className={styles.errorBox}><strong>Couldn't load roster.</strong><p>{roster.message}</p></div>;
    }
    return <div className={styles.loading}><div className={styles.spinner} /><span>Loading roster…</span></div>;
  }

  // Join roster + averages, sort by PPG desc, take top 8
  const rosterData: BDLPlayer[] = roster.data;
  const playersWithStats = rosterData.map(p => {
    const stat = averages.state === 'ok' ? averages.data.find(a => a.player_id === p.id) : null;
    return { player: p, stat };
  });
  const topScorers = [...playersWithStats]
    .sort((a, b) => (b.stat?.pts ?? -1) - (a.stat?.pts ?? -1))
    .slice(0, 8);

  return (
    <div className={styles.detailScroll}>
      <div className={styles.teamHero}>
        {crest && <img src={crest} alt="" className={styles.heroCrest} />}
        <div className={styles.heroText}>
          <span className={styles.heroEyebrow}>{team.conference} · {team.division}</span>
          <h2 className={styles.heroName}>{team.full_name}</h2>
          <span className={styles.heroMeta}>{season}–{String(season + 1).slice(2)} season · {rosterData.length} active players</span>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Top scorers this season</h3>
      {averages.state === 'loading' && <div className={styles.loadingInline}>Loading stats…</div>}
      {averages.state === 'error' && (
        <div className={styles.errorInline}>Stats unavailable — {averages.message}</div>
      )}
      <ul className={styles.playerList}>
        {topScorers.map(({ player, stat }, i) => (
          <li key={player.id} className={styles.playerRow}>
            <span className={styles.rank}>{i + 1}</span>
            <div className={styles.playerName}>
              <span className={styles.playerFirst}>{player.first_name}</span>
              <span className={styles.playerLast}>{player.last_name}</span>
              <span className={styles.playerPos}>{player.position || '—'}</span>
            </div>
            {stat ? (
              <div className={styles.statBlock}>
                <span className={styles.statMain}>{stat.pts.toFixed(1)}<span className={styles.statUnit}>PPG</span></span>
                <span className={styles.statSub}>{stat.reb.toFixed(1)} RPG · {stat.ast.toFixed(1)} APG</span>
              </div>
            ) : (
              <div className={styles.statBlock}>
                <span className={styles.statMissing}>No games yet</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
