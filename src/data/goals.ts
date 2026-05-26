import type { Play } from './types';

function validate(plays: Play[]): Play[] {
  for (const p of plays) {
    const last = p.buildup[p.buildup.length - 1];
    if (!last?.isBasket) throw new Error(`Play ${p.id}: last waypoint must have isBasket: true`);
    if (p.options.length !== 4) throw new Error(`Play ${p.id}: options must have 4 entries`);
    if (!p.options.includes(p.scorer)) throw new Error(`Play ${p.id}: options must include scorer`);
  }
  return plays;
}

// NBA court — every play attacks the RIGHT hoop (rim centre at x = +12.75, height 3.05 m).
// Coordinates: x ∈ [-14.325, 14.325], z ∈ [-7.62, 7.62].
// Final waypoint: x ≈ 12.75, z ≈ 0, endY 3.05, isBasket: true.
export const GOALS: Play[] = validate([
  // ── 1. Ray Allen — 2013 NBA Finals Game 6 ──────────────────────────
  {
    id: 'ray-allen-2013',
    meta: {
      year: '2013', comp: 'NBA Finals Game 6', team: 'Miami Heat', clock: '0:05.2',
      homeTeam: 'Heat', awayTeam: 'Spurs', homeScore: 95, awayScore: 95,
      homeColor: '#98002E', awayColor: '#000000', arena: 'American Airlines Arena',
      points: 3, assister: 'Chris Bosh',
      specials: ['flyIn'],
    },
    buildup: [
      { x:  -3,    z:  3.0, label: 'LeBron miss',  camera: 'wide' },
      { x:   8,    z:  4.0, label: 'Bosh rebound', camera: 'follow', shotType: 'pass' },
      { x:   8,    z: -6.4, label: 'Kick to Ray',  camera: 'baseline', shotType: 'pass' },
      { x:  12.75, z:  0.0, label: 'Corner 3',     camera: 'close', shotType: 'three', isBasket: true, duration: 1100 },
    ],
    scorer: 'Ray Allen',
    options: ['Ray Allen', 'LeBron James', 'Dwyane Wade', 'Chris Bosh'],
    fact: "Heat 95-95 Spurs. Bosh's offensive board, kicked to the corner — Ray's heels millimetres from the line, OT, championship saved.",
  },

  // ── 2. Damian Lillard — 2019 R1 Game 5 over PG ────────────────────
  {
    id: 'dame-time-2019',
    meta: {
      year: '2019', comp: 'NBA Playoffs R1 Game 5', team: 'Portland Trail Blazers', clock: '0:00.0',
      homeTeam: 'Blazers', awayTeam: 'Thunder', homeScore: 118, awayScore: 115,
      homeColor: '#E03A3E', awayColor: '#007AC1', arena: 'Moda Center',
      points: 3, specials: ['cableCam', 'flyIn'],
    },
    buildup: [
      { x: -10.5, z:  4.5, label: 'Inbound', camera: 'wide' },
      { x:  -7.0, z:  2.0, label: 'Cross',   camera: 'dribble', shotType: 'dribble' },
      { x:  -2.5, z:  0.5, label: 'Step back', camera: 'follow', shotType: 'dribble', duration: 1000 },
      { x:  12.75, z: 0.0, label: 'Wave bye', camera: 'close', shotType: 'three', arc: 5.6, isBasket: true, duration: 1350 },
    ],
    scorer: 'Damian Lillard',
    options: ['Damian Lillard', 'CJ McCollum', 'Russell Westbrook', 'Paul George'],
    fact: "Blazers 118-115 Thunder. 37-footer over Paul George at the buzzer — Dame stared the Thunder bench down and waved goodbye.",
  },

  // ── 3. Michael Jordan — The Shot, 1989 vs Cleveland ───────────────
  {
    id: 'mj-the-shot-1989',
    meta: {
      year: '1989', comp: 'NBA Playoffs R1 Game 5', team: 'Chicago Bulls', clock: '0:00.0',
      homeTeam: 'Cavs', awayTeam: 'Bulls', homeScore: 100, awayScore: 101,
      homeColor: '#860038', awayColor: '#CE1141', arena: 'Richfield Coliseum',
      points: 2, assister: 'Brad Sellers',
      specials: ['swishCam'],
    },
    buildup: [
      { x:  -2.0, z: -6.4, label: 'Sellers inbound', camera: 'wide' },
      { x:   0.0, z: -1.5, label: 'MJ catches',      camera: 'follow', shotType: 'pass' },
      { x:   4.0, z:  1.0, label: 'Drive right',     camera: 'dribble', shotType: 'dribble', duration: 700 },
      { x:  12.75, z: 0.0, label: 'Hangs · Ehlo',    camera: 'close', shotType: 'jumpShot', arc: 4.4, isBasket: true, duration: 1250 },
    ],
    scorer: 'Michael Jordan',
    options: ['Michael Jordan', 'Scottie Pippen', 'Brad Sellers', 'Craig Ehlo'],
    fact: "Cavs 100-101 Bulls. Jordan caught it on the run, hung above Ehlo for a beat too long, then released — Bulls win the series.",
  },

  // ── 4. Kawhi Leonard — 2019 R2 Game 7 bouncer ─────────────────────
  {
    id: 'kawhi-bouncer-2019',
    meta: {
      year: '2019', comp: 'NBA Playoffs R2 Game 7', team: 'Toronto Raptors', clock: '0:00.0',
      homeTeam: 'Raptors', awayTeam: '76ers', homeScore: 92, awayScore: 90,
      homeColor: '#CE1141', awayColor: '#006BB6', arena: 'Scotiabank Arena',
      points: 2, specials: ['swishCam', 'flyIn'],
    },
    buildup: [
      { x:  -1.0, z: -6.0, label: 'Inbound',     camera: 'wide' },
      { x:   2.5, z: -5.5, label: 'Kawhi drives', camera: 'dribble', shotType: 'dribble' },
      { x:   8.0, z: -6.8, label: 'Corner pull',  camera: 'follow', shotType: 'dribble', duration: 900 },
      { x:  12.75, z: 0.0, label: 'Bounce · in',  camera: 'close', shotType: 'jumpShot', arc: 4.6, isBasket: true, duration: 1400 },
    ],
    scorer: 'Kawhi Leonard',
    options: ['Kawhi Leonard', 'Kyle Lowry', 'Pascal Siakam', 'Joel Embiid'],
    fact: "Raptors 92-90 76ers. Kawhi from the corner over Embiid — four bounces on the rim before falling. Only buzzer-beater Game 7 in NBA history.",
  },

  // ── 5. Stephen Curry — 30 ft logo three ───────────────────────────
  {
    id: 'curry-logo-three',
    meta: {
      year: '2016', comp: 'Regular Season vs OKC', team: 'Golden State Warriors', clock: '0:00.7',
      homeTeam: 'Thunder', awayTeam: 'Warriors', homeScore: 118, awayScore: 121,
      homeColor: '#007AC1', awayColor: '#1D428A', arena: 'Chesapeake Energy Arena',
      points: 3, specials: ['cableCam'],
    },
    buildup: [
      { x: -11.5, z:  6.0, label: 'Inbound',    camera: 'wide' },
      { x:  -8.0, z:  3.0, label: 'Curry pace', camera: 'dribble', shotType: 'dribble' },
      { x:  -2.5, z:  1.0, label: 'From the logo', camera: 'follow', shotType: 'dribble', duration: 900 },
      { x:  12.75, z: 0.0, label: 'Bang!',      camera: 'close', shotType: 'three', arc: 6.2, isBasket: true, duration: 1500 },
    ],
    scorer: 'Stephen Curry',
    options: ['Stephen Curry', 'Klay Thompson', 'Kevin Durant', 'Russell Westbrook'],
    fact: "Thunder 118-121 Warriors OT. Curry pulled up from 32 feet — Mike Breen's voice cracked. Set the NBA single-season three-point record that night.",
  },
]);
