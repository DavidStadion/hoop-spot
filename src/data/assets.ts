// Maps display names to static asset paths served from /assets/ via publicDir

// Explicit team crest mapping. Names match both our hand-authored data and
// the team names StatsBomb uses in their open data feeds.
const TEAM_CRESTS: Record<string, string> = {
  // Hand-authored set
  'Liverpool':            '/crests/Team=Liverpool.svg',
  'Bayern Munich':        '/crests/Team=FC Bayern Munich.svg',
  'Man United':           '/crests/Team=Manchester United.svg',
  'Manchester United':    '/crests/Team=Manchester United.svg',
  'Argentina':            '/crests/Team=Argentina.svg',
  'England':              '/crests/Team=England.svg',
  'Brazil':               '/crests/Team=Brazil.svg',
  'Germany':              '/crests/Team=Germany.svg',
  'Real Madrid':          '/crests/Team=Real Madrid.svg',
  'Man City':             '/crests/Team=Manchester City.svg',
  'Manchester City':      '/crests/Team=Manchester City.svg',
  'Barcelona':            '/crests/Team=Barca.svg',
  'Getafe':               '/crests/Team=Getafe.svg',

  // StatsBomb common teams (Property 1= folder)
  'Juventus':             '/crests/Property 1=Juventus - White.svg',
  'Atletico Madrid':      '/crests/Property 1=Athletico Madrid.svg',
  'Atlético Madrid':      '/crests/Property 1=Athletico Madrid.svg',
  'Athletico Madrid':     '/crests/Property 1=Athletico Madrid.svg',
  'Boca Juniors':         '/crests/Property 1=BOCA Juniors.svg',
  'Benfica':              '/crests/Property 1=Benefica.svg',
  'Benefica':             '/crests/Property 1=Benefica.svg',
  'Borussia Dortmund':    '/crests/Property 1=Borussia.svg',
  'Borussia M\'gladbach': '/crests/Property 1=Borussia.svg',
  'Botafogo':             '/crests/Property 1=Botafogo.svg',
  'River Plate':          '/crests/Property 1=CA River Plate.svg',
  'Chelsea':              '/crests/Property 1=Chelsea.svg',
  'Club León':            '/crests/Property 1=Club Leon.svg',
  'Club Leon':            '/crests/Property 1=Club Leon.svg',
  'Porto':                '/crests/Property 1=FC Porto.svg',
  'FC Porto':             '/crests/Property 1=FC Porto.svg',
  'Flamengo':             '/crests/Property 1=Flamengo Braz.svg',
  'Fluminense':           '/crests/Property 1=Fluminense.svg',
  'Inter Miami':          '/crests/Property 1=Inter Miami.svg',
  'Inter':                '/crests/Property 1=Internazionale Milano.svg',
  'Inter Milan':          '/crests/Property 1=Internazionale Milano.svg',
  'Internazionale':       '/crests/Property 1=Internazionale Milano.svg',
  'Paris Saint-Germain':  '/crests/Property 1=PSG.svg',
  'PSG':                  '/crests/Property 1=PSG.svg',
  'Palmeiras':            '/crests/Property 1=Palmeiras.svg',
  'Pachuca':              '/crests/Property 1=Pachuca Tuzos.svg',
  'Red Bull Salzburg':    '/crests/Property 1=Red Bull Salzburg.svg',
  'RB Salzburg':          '/crests/Property 1=Red Bull Salzburg.svg',
  'Al Ahly':              '/crests/Property 1=Al Ahly.svg',
  'Al Hilal':             '/crests/Property 1=Al Hilal White.svg',
};

/** Look up a team crest. Falls back to partial substring match for variants
 *  ("Manchester City" → "Man City" etc.) so StatsBomb naming doesn't lose. */
export function getCrest(team: string): string | null {
  if (!team) return null;
  const exact = TEAM_CRESTS[team];
  if (exact) return exact;
  // Fuzzy: substring match either way
  const lower = team.toLowerCase();
  for (const key of Object.keys(TEAM_CRESTS)) {
    const k = key.toLowerCase();
    if (TEAM_CRESTS[key] && (lower.includes(k) || k.includes(lower))) {
      return TEAM_CRESTS[key];
    }
  }
  return null;
}

// ─── Competition logos ───────────────────────────────────────────
const COMP_LOGOS: Array<[RegExp, string]> = [
  [/champions league/i,         '/competitions/Property 1=Champions League, Colour=White.svg'],
  [/europa league/i,            '/competitions/Property 1=Europa League, Colour=Colour.svg'],
  [/premier league/i,           '/competitions/Property 1=Premier League Logo Mark, Colour=Colour.svg'],
  [/la liga/i,                  '/competitions/Property 1=laliga.svg'],
  [/serie a/i,                  '/competitions/Property 1=SerieA.svg'],
  [/bundesliga/i,               '/competitions/Property 1=Bundesliga.svg'],
  [/ligue 1/i,                  '/competitions/Property 1=Ligue1-White.svg'],
  [/fa cup/i,                   '/competitions/Property 1=Emirates FA Cup, Colour=Colour.svg'],
  [/carabao/i,                  '/competitions/Property 1=Carabao Cup, Colour=Colour.svg'],
  [/world cup 26|wc 26/i,       '/competitions/Competition=WC 26.svg'],
  [/women.*champions league/i,  '/competitions/Property 1=Womens Champions League, Colour=Colour.svg'],
  [/women.*super league/i,      '/competitions/Property 1=NEW Womens Super League - Stacked, Colour=Colour.svg'],
  [/uefa euro/i,                '/competitions/Property 1=Champions League, Colour=White.svg'], // fallback to UEFA branding
  [/world cup/i,                '/competitions/Competition=WC 26.svg'],
  [/copa del rey/i,             '/competitions/Property 1=laliga.svg'],
];

export function getCompLogo(comp: string): string | null {
  if (!comp) return null;
  for (const [re, path] of COMP_LOGOS) {
    if (re.test(comp)) return path;
  }
  return null;
}
