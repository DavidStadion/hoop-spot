import { create } from 'zustand';

export type Settings = {
  audio: boolean;        // Crowd, kicks, whistle, goal roar
  cinematic: boolean;    // Slow-mo + letterbox bars on the strike
  goalStinger: boolean;  // Big "GOAL!" text burst when ball hits the net
  weather: boolean;      // Rain particles on the rainy goals
  lighting: boolean;     // Per-stadium lighting palettes (off = neutral 'day')
  whipPan: boolean;      // Boosted camera lerp on shot changes
  crowdFlashes: boolean; // Twinkling crowd-camera flashes
  dribbleCam: boolean;   // Tight chase camera for dribble waypoints
  dribbleTrail: boolean; // Particle dust kicked up during dribbles
};

type State = Settings & {
  set: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  toggle: (key: keyof Settings) => void;
  reset: () => void;
};

const STORAGE_KEY = 'goalspot.settings';

const DEFAULTS: Settings = {
  audio: false,       // muted by default — users opt in via header speaker
  cinematic: true,
  goalStinger: false, // big "GOAL!" text hidden by default — opt in via Settings
  weather: true,
  lighting: true,
  whipPan: true,
  crowdFlashes: true,
  dribbleCam: true,
  dribbleTrail: true,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function persist(s: Settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

export const useSettingsStore = create<State>((set, get) => ({
  ...load(),

  set: (key, value) => {
    set({ [key]: value } as Partial<State>);
    persist(get());
  },
  toggle: (key) => {
    set({ [key]: !get()[key] } as Partial<State>);
    persist(get());
  },
  reset: () => {
    set({ ...DEFAULTS });
    persist(DEFAULTS);
  },
}));

// Non-reactive accessor — for use inside scene-graph code that runs outside React.
export function getSettings(): Settings {
  return useSettingsStore.getState();
}
