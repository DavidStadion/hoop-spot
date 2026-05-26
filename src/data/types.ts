export type CameraShot =
  | 'wide'
  | 'follow'
  | 'side'
  | 'baseline'      // behind the hoop, looking out
  | 'close'
  | 'dribble'
  | 'swish-cam'     // inside / just under the rim, looking up
  | 'crowd-pan'
  | 'cable-cam';

export type ShotType =
  | 'pass'
  | 'dribble'
  | 'jumpShot'
  | 'layup'
  | 'dunk'
  | 'three'
  | 'freeThrow';

export type Waypoint = {
  x: number;
  z: number;
  label: string;
  camera: CameraShot;
  /** Override the auto arc-height (metres). */
  arc?: number;
  /** Settle height (metres). For a made basket through the rim, use 3.05. */
  endY?: number;
  duration?: number;
  /** Final waypoint of a made basket — triggers swish, stinger, points. */
  isBasket?: boolean;
  /** Legacy alias for isBasket (kept while engine call-sites migrate). */
  isGoal?: boolean;
  /** Movement style — defaults to 'pass' for non-terminal waypoints. */
  shotType?: ShotType;
  /** Legacy alias for shotType==='dribble'. */
  dribble?: boolean;
};

export type Play = {
  id: string;
  meta: {
    year: string;
    comp: string;
    team: string;
    clock: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    homeColor: string;
    awayColor: string;
    arena?: string;
    /** Point value of the made basket — 2 (default), 3, or 1 (FT). */
    points?: 2 | 3 | 1;
    /** Assister (last pass before the basket). */
    assister?: string;
    /** Special broadcast moments. */
    specials?: Array<'flyIn' | 'swishCam' | 'crowdPan' | 'cableCam'>;
    // ── Legacy fields kept for inherited engine code (atmosphere, poster). ──
    stadium?: string;
    lighting?: 'day' | 'night' | 'golden' | 'dusk' | 'overcast';
    weather?: 'clear' | 'rain';
    xg?: number;
  };
  buildup: Waypoint[];
  scorer: string;
  options: string[];
  fact: string;
};

// ── Compatibility shims ───────────────────────────────────────────────
// The rest of the engine still imports `Goal` in many places. Treat them
// as aliases until the foundation-rename pass.
export type Goal = Play;
