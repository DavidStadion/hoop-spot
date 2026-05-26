// StatsBomb Open Data integration — fetches event data from their public CDN
// and converts each goal in a match into our internal Goal shape.
//
// Open data is MIT-licensed and lives at:
//   https://github.com/statsbomb/open-data
// We fetch via jsDelivr because GitHub raw has flaky CORS.

import type { Goal, Waypoint, CameraShot } from '../data/types';

const CDN = 'https://cdn.jsdelivr.net/gh/statsbomb/open-data@master/data';

// ─── StatsBomb types (only the bits we use) ──────────────────────
export interface SBCompetition {
  competition_id: number;
  season_id: number;
  competition_name: string;
  season_name: string;
  country_name: string;
}

export interface SBMatch {
  match_id: number;
  match_date: string;
  kick_off?: string;
  home_team: { home_team_name: string; home_team_id: number };
  away_team: { away_team_name: string; away_team_id: number };
  home_score: number;
  away_score: number;
  competition: { competition_name: string };
  season: { season_name: string };
  stadium?: { name: string };
}

interface SBEvent {
  id: string;
  index: number;
  timestamp: string;          // "00:54:18.123"
  minute: number;
  second: number;
  type: { name: string };
  possession?: number;
  possession_team?: { id: number; name: string };
  team: { id: number; name: string };
  player?: { id: number; name: string };
  location?: [number, number];
  period: number;
  pass?: {
    end_location: [number, number];
    length: number;
    height: { name: string };       // Ground Pass | Low Pass | High Pass
    type?: { name: string };        // Corner | Free Kick | Throw-in | etc
    recipient?: { name: string };
    outcome?: { name: string };
    cross?: boolean;
  };
  carry?: { end_location: [number, number] };
  shot?: {
    end_location: [number, number] | [number, number, number];
    outcome: { name: string };
    body_part?: { name: string };
    statsbomb_xg?: number;
    type?: { name: string };
  };
}

// ─── Cache ──────────────────────────────────────────────────────
const cache = new Map<string, Promise<unknown>>();
function fetchJSON<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then(r => {
      if (!r.ok) throw new Error(`Fetch failed: ${url} (${r.status})`);
      return r.json();
    }));
  }
  return cache.get(url) as Promise<T>;
}

// ─── Public fetchers ─────────────────────────────────────────────
export async function listCompetitions(): Promise<SBCompetition[]> {
  return fetchJSON<SBCompetition[]>(`${CDN}/competitions.json`);
}

export async function listMatches(competitionId: number, seasonId: number): Promise<SBMatch[]> {
  return fetchJSON<SBMatch[]>(`${CDN}/matches/${competitionId}/${seasonId}.json`);
}

async function fetchEvents(matchId: number): Promise<SBEvent[]> {
  return fetchJSON<SBEvent[]>(`${CDN}/events/${matchId}.json`);
}

// ─── Coordinate conversion ───────────────────────────────────────
// StatsBomb pitch: 120 long × 80 wide; attacking always left → right.
// Goal Spot pitch: x ∈ [-55, 55], z ∈ [-30, 30]; we make every goal attack +55.
function toGameXZ(loc: [number, number]): { x: number; z: number } {
  const [sx, sy] = loc;
  return {
    x: ((sx - 60) / 60) * 55,
    z: ((sy - 40) / 40) * 30,
  };
}

// ─── Camera shot heuristic ───────────────────────────────────────
function pickCamera(event: SBEvent, isFirst: boolean, isGoal: boolean, prev?: SBEvent): CameraShot {
  if (isFirst)       return 'wide';
  if (isGoal)        return 'close';
  if (event.type.name === 'Carry') return 'follow';
  if (event.pass?.cross || event.pass?.height?.name === 'High Pass') return 'behind-goal';
  // Inside the final third → behind-goal feels right
  if (event.location && event.location[0] > 90) return 'behind-goal';
  if (prev && event.location && prev.location) {
    const dx = event.location[0] - prev.location[0];
    if (dx > 25) return 'behind-goal';
  }
  return 'follow';
}

function pickArc(event: SBEvent, isGoal: boolean): number | undefined {
  if (isGoal) return undefined; // let isGoal default kick in
  const h = event.pass?.height?.name;
  if (event.pass?.cross) return 3.5;
  if (h === 'High Pass') return 3.5;
  if (h === 'Low Pass')  return 1.2;
  return 0.3;
}

// Build a short label for the waypoint
function buildLabel(event: SBEvent, isFirst: boolean): string {
  if (isFirst) {
    if (event.pass?.type?.name === 'Corner') return 'Corner';
    if (event.pass?.type?.name === 'Free Kick') return 'Free kick';
    if (event.pass?.type?.name === 'Throw-in') return 'Throw-in';
    if (event.pass?.type?.name === 'Goal Kick') return 'Goal kick';
    if (event.pass?.type?.name === 'Kick Off')  return 'Kick-off';
    return event.player?.name?.split(' ').slice(-1)[0] ?? 'Build-up';
  }
  if (event.type.name === 'Carry') return event.player?.name?.split(' ').slice(-1)[0] ?? 'Carry';
  if (event.type.name === 'Shot')  return 'Goal';
  if (event.pass?.cross)           return 'Cross';
  return event.player?.name?.split(' ').slice(-1)[0] ?? 'Pass';
}

// ─── Convert one goal event chain into a Goal ────────────────────
function buildGoalEntry(
  match: SBMatch,
  events: SBEvent[],
  shotEvent: SBEvent,
  shotIndex: number,
  squadByTeam: Map<number, string[]>,
): Goal | null {
  // Walk backwards through events with the same possession + scoring team
  const possession = shotEvent.possession;
  const teamId = shotEvent.team.id;
  if (possession == null) return null;

  const chain: SBEvent[] = [shotEvent];
  for (let i = shotIndex - 1; i >= 0 && chain.length < 7; i--) {
    const e = events[i];
    if (e.possession !== possession) break;
    if (e.team.id !== teamId) continue;
    // Only events with positions
    if (!e.location) continue;
    // Only meaningful actions
    if (e.type.name === 'Pass') {
      // Skip failed passes
      if (e.pass?.outcome) continue;
      chain.unshift(e);
    } else if (e.type.name === 'Carry') {
      // Filter out tiny carries (< 2m)
      const start = e.location;
      const end = e.carry?.end_location;
      if (start && end) {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        if (Math.hypot(dx, dy) >= 2) chain.unshift(e);
      }
    } else if (e.type.name === 'Ball Recovery' || e.type.name === 'Duel') {
      chain.unshift(e);
    }
  }
  if (chain.length < 2) return null;

  // Detect attacking direction from the shot — every team in StatsBomb attacks
  // left-to-right, so shot.location.x is roughly > 100. If it's < 60 the team is
  // shooting at their own goal (won't happen) — just sanity check.
  const buildup: Waypoint[] = chain.map((e, idx) => {
    const isLast = idx === chain.length - 1;
    const loc = e.location!;
    const target = isLast ? loc : (e.pass?.end_location ?? e.carry?.end_location ?? loc);
    const { x, z } = toGameXZ(target);

    const camera = pickCamera(e, idx === 0, isLast, chain[idx - 1]);
    const arc = pickArc(e, isLast);
    const dribble = e.type.name === 'Carry';
    const label = buildLabel(e, idx === 0);

    const wp: Waypoint = { x, z, label, camera };
    if (arc != null) wp.arc = arc;
    if (dribble)     wp.dribble = true;
    if (isLast) {
      wp.isGoal = true;
      // Shot end-z (height) — index 2 of shot.end_location
      const end = e.shot?.end_location as number[] | undefined;
      const sbHeight = end && end.length === 3 ? end[2] : undefined;
      // StatsBomb z is 0–height-of-goal (2.67m). Map to Goal Spot endY.
      if (sbHeight != null) {
        wp.endY = Math.max(0.32, Math.min(2.4, 0.32 + sbHeight * 0.8));
      } else {
        wp.endY = 0.6;
      }
      wp.arc = 0.5;
      wp.duration = 800;
    }
    return wp;
  });

  // Force final waypoint inside the net
  const lastWp = buildup[buildup.length - 1];
  lastWp.x = 54.2;
  // keep the z derived from the shot trajectory so left/right of goal is preserved
  lastWp.z = Math.max(-3.5, Math.min(3.5, lastWp.z));

  const scorer = shotEvent.player?.name ?? 'Unknown';
  // Build 4 options from the scorer's teammates (squad by team)
  const teammates = (squadByTeam.get(teamId) ?? []).filter(n => n !== scorer);
  const distractors = shuffle(teammates).slice(0, 3);
  const options = shuffle([scorer, ...distractors]);

  // Assister = the player on the last successful pass in the chain (the event
  // immediately before the shot, if it was a pass by a teammate to the scorer).
  let assister: string | undefined;
  for (let i = chain.length - 2; i >= 0; i--) {
    const e = chain[i];
    if (e.type.name === 'Pass' && e.player?.name && e.player.name !== scorer) {
      assister = e.player.name;
      break;
    }
  }

  const xg = shotEvent.shot?.statsbomb_xg;

  const clockMin = String(shotEvent.minute).padStart(2, '0');
  const clockSec = String(shotEvent.second).padStart(2, '0');

  // Derive home/away colours from team names — fallback to brand
  const homeTeamName = match.home_team.home_team_name;
  const awayTeamName = match.away_team.away_team_name;
  const teamName = shotEvent.team.name;

  return {
    id: `sb-${match.match_id}-${shotEvent.id.slice(0, 8)}`,
    meta: {
      year: (match.match_date || '').slice(0, 4),
      comp: match.competition.competition_name,
      team: teamName,
      clock: `${clockMin}:${clockSec}`,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeScore: match.home_score,
      awayScore: match.away_score,
      homeColor: '#3B82F6',
      awayColor: '#EF4444',
      stadium: match.stadium?.name,
      lighting: 'day',
      weather: 'clear',
      assister,
      xg,
    },
    buildup,
    scorer,
    options,
    fact: `${scorer} for ${teamName} — ${match.competition.competition_name} ${(match.match_date || '').slice(0, 4)}.`,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Public: import all goals from a match ───────────────────────
export async function importGoalsFromMatch(matchId: number, match: SBMatch): Promise<Goal[]> {
  const events = await fetchEvents(matchId);

  // Build a per-team squad list for the options selector
  const squadByTeam = new Map<number, Set<string>>();
  for (const ev of events) {
    if (ev.player && ev.team) {
      if (!squadByTeam.has(ev.team.id)) squadByTeam.set(ev.team.id, new Set());
      squadByTeam.get(ev.team.id)!.add(ev.player.name);
    }
  }
  const squadAsArrays = new Map<number, string[]>();
  squadByTeam.forEach((set, tid) => squadAsArrays.set(tid, [...set]));

  const goals: Goal[] = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.type.name === 'Shot' && ev.shot?.outcome?.name === 'Goal') {
      const goal = buildGoalEntry(match, events, ev, i, squadAsArrays);
      if (goal) goals.push(goal);
    }
  }
  return goals;
}
