export type CameraShot =
  | 'wide'
  | 'follow'
  | 'side'
  | 'behind-goal'
  | 'close'
  | 'dribble'
  | 'keeper-pov'
  | 'crowd-pan'
  | 'cable-cam';

export type Waypoint = {
  x: number;
  z: number;
  label: string;
  camera: CameraShot;
  arc?: number;
  endY?: number;
  duration?: number;
  isGoal?: boolean;
  dribble?: boolean;   // single player carrying ball — trail rendered as dotted run
};

export type Goal = {
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
    stadium?: string;
    lighting?: 'day' | 'night' | 'golden' | 'dusk' | 'overcast';
    weather?: 'clear' | 'rain';
    /** Player who assisted the goal (last pass before the strike). */
    assister?: string;
    /** Expected goals value for the shot (StatsBomb xG, 0–1). */
    xg?: number;
    /** Special broadcast moments — applied only to standout goals so they stay rare. */
    specials?: Array<'flyIn' | 'keeperPov' | 'crowdPan' | 'cableCam'>;
  };
  buildup: Waypoint[];
  scorer: string;
  options: string[];
  fact: string;
};
