// NBA team + competition logo lookup.
// Logos are served from ESPN's public CDN — same URL pattern espn.com uses
// for its own scoreboard. Each is a transparent-PNG 500×500.
const ESPN_TEAM = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;

const TEAM_CRESTS: Record<string, string> = {
  // ── Plays we ship today ──────────────────────────────────────────
  'Heat':       ESPN_TEAM('mia'),
  'Miami Heat': ESPN_TEAM('mia'),
  'Spurs':      ESPN_TEAM('sa'),
  'San Antonio Spurs': ESPN_TEAM('sa'),
  'Blazers':    ESPN_TEAM('por'),
  'Portland Trail Blazers': ESPN_TEAM('por'),
  'Thunder':    ESPN_TEAM('okc'),
  'Oklahoma City Thunder': ESPN_TEAM('okc'),
  'Cavs':       ESPN_TEAM('cle'),
  'Cavaliers':  ESPN_TEAM('cle'),
  'Cleveland Cavaliers': ESPN_TEAM('cle'),
  'Bulls':      ESPN_TEAM('chi'),
  'Chicago Bulls': ESPN_TEAM('chi'),
  'Raptors':    ESPN_TEAM('tor'),
  'Toronto Raptors': ESPN_TEAM('tor'),
  '76ers':      ESPN_TEAM('phi'),
  'Sixers':     ESPN_TEAM('phi'),
  'Philadelphia 76ers': ESPN_TEAM('phi'),
  'Warriors':   ESPN_TEAM('gs'),
  'Golden State Warriors': ESPN_TEAM('gs'),

  // ── Full league — pre-populated so any future play "just works" ──
  'Hawks':      ESPN_TEAM('atl'),
  'Atlanta Hawks': ESPN_TEAM('atl'),
  'Celtics':    ESPN_TEAM('bos'),
  'Boston Celtics': ESPN_TEAM('bos'),
  'Nets':       ESPN_TEAM('bkn'),
  'Brooklyn Nets': ESPN_TEAM('bkn'),
  'Hornets':    ESPN_TEAM('cha'),
  'Charlotte Hornets': ESPN_TEAM('cha'),
  'Mavericks':  ESPN_TEAM('dal'),
  'Mavs':       ESPN_TEAM('dal'),
  'Dallas Mavericks': ESPN_TEAM('dal'),
  'Nuggets':    ESPN_TEAM('den'),
  'Denver Nuggets': ESPN_TEAM('den'),
  'Pistons':    ESPN_TEAM('det'),
  'Detroit Pistons': ESPN_TEAM('det'),
  'Rockets':    ESPN_TEAM('hou'),
  'Houston Rockets': ESPN_TEAM('hou'),
  'Pacers':     ESPN_TEAM('ind'),
  'Indiana Pacers': ESPN_TEAM('ind'),
  'Clippers':   ESPN_TEAM('lac'),
  'LA Clippers': ESPN_TEAM('lac'),
  'Lakers':     ESPN_TEAM('lal'),
  'Los Angeles Lakers': ESPN_TEAM('lal'),
  'Grizzlies':  ESPN_TEAM('mem'),
  'Memphis Grizzlies': ESPN_TEAM('mem'),
  'Bucks':      ESPN_TEAM('mil'),
  'Milwaukee Bucks': ESPN_TEAM('mil'),
  'Timberwolves': ESPN_TEAM('min'),
  'Wolves':     ESPN_TEAM('min'),
  'Minnesota Timberwolves': ESPN_TEAM('min'),
  'Pelicans':   ESPN_TEAM('no'),
  'New Orleans Pelicans': ESPN_TEAM('no'),
  'Knicks':     ESPN_TEAM('ny'),
  'New York Knicks': ESPN_TEAM('ny'),
  'Magic':      ESPN_TEAM('orl'),
  'Orlando Magic': ESPN_TEAM('orl'),
  'Suns':       ESPN_TEAM('phx'),
  'Phoenix Suns': ESPN_TEAM('phx'),
  'Kings':      ESPN_TEAM('sac'),
  'Sacramento Kings': ESPN_TEAM('sac'),
  'Jazz':       ESPN_TEAM('utah'),
  'Utah Jazz':  ESPN_TEAM('utah'),
  'Wizards':    ESPN_TEAM('wsh'),
  'Washington Wizards': ESPN_TEAM('wsh'),
};

/** Look up a team crest. Substring fallback so variants resolve. */
export function getCrest(team: string): string | null {
  if (!team) return null;
  const exact = TEAM_CRESTS[team];
  if (exact) return exact;
  const lower = team.toLowerCase();
  for (const key of Object.keys(TEAM_CRESTS)) {
    const k = key.toLowerCase();
    if (lower.includes(k) || k.includes(lower)) {
      return TEAM_CRESTS[key];
    }
  }
  return null;
}

// ─── Competition logos ───────────────────────────────────────────
const NBA_LEAGUE = 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png';

const COMP_LOGOS: Array<[RegExp, string]> = [
  [/nba finals/i,    NBA_LEAGUE],
  [/nba playoffs/i,  NBA_LEAGUE],
  [/nba|regular season|playoff/i, NBA_LEAGUE],
];

export function getCompLogo(comp: string): string | null {
  if (!comp) return null;
  for (const [re, path] of COMP_LOGOS) {
    if (re.test(comp)) return path;
  }
  return null;
}
