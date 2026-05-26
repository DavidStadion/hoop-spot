// BallDontLie client — calls our /api/bdl proxy so the API key stays on the
// server. All responses are the upstream BDL v1 schema verbatim.

export type BDLTeam = {
  id: number;
  conference: 'East' | 'West';
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

export type BDLPlayer = {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: BDLTeam;
};

export type BDLSeasonAverages = {
  player_id: number;
  season: number;
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
};

type BDLList<T> = { data: T[]; meta?: { next_cursor?: number; per_page: number } };

async function bdl<T>(path: string, params?: Record<string, string | number | (string | number)[]>): Promise<T> {
  const url = new URL(`/api/bdl/${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        // BDL expects array params as `key[]=v1&key[]=v2`
        for (const v of value) url.searchParams.append(`${key}[]`, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`BDL ${path} → ${res.status}: ${detail.slice(0, 160)}`);
  }
  return res.json() as Promise<T>;
}

export async function getTeams(): Promise<BDLTeam[]> {
  const out = await bdl<BDLList<BDLTeam>>('teams');
  // BDL returns 30 NBA teams + a few historical/other entries. Keep only the
  // current 30 by filtering on division being present.
  return out.data.filter(t => t.conference === 'East' || t.conference === 'West');
}

/** Active players for a team (paginated; we just take the first page — fine
 *  for showing a roster snapshot).
 *
 *  NOTE: Requires the paid BDL "ALL-STAR" tier. Free tier users will hit
 *  Unauthorized — TeamMode no longer uses this. */
export async function getRoster(teamId: number, perPage = 25): Promise<BDLPlayer[]> {
  const out = await bdl<BDLList<BDLPlayer>>('players/active', {
    'team_ids': [teamId],
    'per_page': perPage,
  });
  return out.data;
}

/** Season averages for a list of players in a given season.
 *  Also paid-tier — kept for future upgrade. */
export async function getSeasonAverages(
  playerIds: number[],
  season: number,
): Promise<BDLSeasonAverages[]> {
  if (playerIds.length === 0) return [];
  const out = await bdl<BDLList<BDLSeasonAverages>>('season_averages', {
    season,
    player_ids: playerIds,
  });
  return out.data;
}

// ─── Games (free tier) ───────────────────────────────────────────────
export type BDLGame = {
  id: number;
  date: string;            // YYYY-MM-DD
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: BDLTeam;
  visitor_team: BDLTeam;
};

/** Recent games for a team in a given season. Most-recent first. */
export async function getGames(teamId: number, season: number, perPage = 12): Promise<BDLGame[]> {
  const out = await bdl<BDLList<BDLGame>>('games', {
    'team_ids': [teamId],
    'seasons': [season],
    'per_page': perPage,
  });
  // BDL returns oldest-first; sort newest-first so the UI shows recent games up top.
  return [...out.data].sort((a, b) => b.date.localeCompare(a.date));
}

/** Win-loss record from a games list (relative to the given team). */
export function computeRecord(games: BDLGame[], teamId: number): { wins: number; losses: number } {
  let wins = 0, losses = 0;
  for (const g of games) {
    if (g.status !== 'Final') continue;
    const isHome = g.home_team.id === teamId;
    const teamScore = isHome ? g.home_team_score : g.visitor_team_score;
    const oppScore  = isHome ? g.visitor_team_score : g.home_team_score;
    if (teamScore > oppScore) wins++;
    else if (teamScore < oppScore) losses++;
  }
  return { wins, losses };
}

/** Resolve the most recent season we should query for. BDL exposes seasons
 *  by the starting year, so the 2024-25 season is season=2024. We pick the
 *  most recent September boundary. */
export function currentBDLSeason(now = new Date()): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0=Jan
  // After September (month >= 9), a new season has tipped off.
  return month >= 9 ? year : year - 1;
}
