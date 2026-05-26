import { create } from 'zustand';
import { GOALS } from '../data/goals';
import type { Goal } from '../data/types';
import { getSavedGoals } from './collectionStore';

export type Phase = 'idle' | 'countdown' | 'playing' | 'guessing' | 'correct' | 'wrong' | 'finished';

export const ROUND_SIZE = 5;

type State = {
  goal: Goal;
  queue: Goal[];
  queueIdx: number;
  phase: Phase;
  score: number;       // correct-count (drives ROUND_SIZE pip UI)
  points: number;      // basketball points scored for correct guesses
  streak: number;
  roundResults: boolean[];
  answered: string | null;
  label: string;
  birdsEye: boolean;
  exploring: boolean;
  cinematic: boolean;
  goalStingerKey: number;
  // actions
  startCountdown: () => void;
  startPlay: () => void;
  guess: (name: string) => void;
  skip: () => void;
  next: () => void;
  resetRound: () => void;
  playSpecific: (id: string) => void;
  playCustom: (goal: Goal) => void;
  replay: () => void;
  setLabel: (label: string) => void;
  setPhase: (phase: Phase) => void;
  setBirdsEye: (v: boolean) => void;
  setExploring: (v: boolean) => void;
  setCinematic: (v: boolean) => void;
  triggerGoalStinger: () => void;
};

// Proper Fisher-Yates shuffle — uniform random distribution.
// Array.sort with random comparator is non-uniform in V8 and tends to keep
// items near their original index, so we use Fisher-Yates instead.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(): Goal[] {
  // Merge the hand-authored set with anything the user has saved from StatsBomb mode
  const pool = [...GOALS, ...getSavedGoals()];
  return shuffle(pool).slice(0, ROUND_SIZE);
}

const initialQueue = buildQueue();

export const useGameStore = create<State>((set, get) => ({
  queue: initialQueue,
  queueIdx: 0,
  goal: initialQueue[0],
  phase: 'idle',
  score: 0,
  points: 0,
  streak: 0,
  roundResults: [],
  answered: null,
  label: '',
  birdsEye: false,
  exploring: false,
  cinematic: false,
  goalStingerKey: 0,

  startCountdown: () => set({ phase: 'countdown', answered: null, label: '', birdsEye: false }),
  startPlay: () => set({ phase: 'playing' }),

  guess: (name) => {
    const { goal, score, points, streak, roundResults } = get();
    const correct = name === goal.scorer;
    const earned = correct ? (goal.meta.points ?? 2) : 0;
    set({
      answered: name,
      phase: correct ? 'correct' : 'wrong',
      score: correct ? score + 1 : score,
      points: points + earned,
      streak: correct ? streak + 1 : 0,
      roundResults: [...roundResults, correct],
    });
  },

  skip: () => {
    const { roundResults, streak } = get();
    set({ answered: '__skip__', phase: 'wrong', roundResults: [...roundResults, false], streak: 0 });
  },

  next: () => {
    const { queue, queueIdx } = get();
    const nextIdx = queueIdx + 1;
    if (nextIdx >= ROUND_SIZE) {
      set({ phase: 'finished' });
    } else {
      set({
        goal: queue[nextIdx],
        queueIdx: nextIdx,
        phase: 'idle',
        answered: null,
        label: '',
        birdsEye: false,
      });
    }
  },

  resetRound: () => {
    const q = buildQueue();
    set({
      queue: q,
      queueIdx: 0,
      goal: q[0],
      phase: 'idle',
      score: 0,
      points: 0,
      streak: 0,
      roundResults: [],
      answered: null,
      label: '',
      birdsEye: false,
    });
  },

  replay: () => set({ phase: 'playing', answered: null, label: '', birdsEye: false }),

  playCustom: (goal) => {
    // For experimental / StatsBomb-imported goals: load a one-off goal as the
    // entire queue. ROUND_SIZE-style pips will just show 1/5 — that's fine for testing.
    set({
      queue: [goal],
      queueIdx: 0,
      goal,
      phase: 'idle',
      score: 0,
      points: 0,
      streak: 0,
      roundResults: [],
      answered: null,
      label: '',
      birdsEye: false,
    });
  },

  playSpecific: (id) => {
    const chosen = GOALS.find(g => g.id === id)!;
    const rest = [...GOALS].filter(g => g.id !== id).sort(() => Math.random() - 0.5).slice(0, ROUND_SIZE - 1);
    const q = [chosen, ...rest];
    set({ queue: q, queueIdx: 0, goal: chosen, phase: 'idle', score: 0, points: 0, streak: 0, roundResults: [], answered: null, label: '', birdsEye: false });
  },

  setLabel: (label) => set({ label }),
  setPhase: (phase) => set({ phase }),
  setBirdsEye: (v) => set({ birdsEye: v }),
  setExploring: (v) => set({ exploring: v }),
  setCinematic: (v) => set({ cinematic: v }),
  triggerGoalStinger: () => set({ goalStingerKey: get().goalStingerKey + 1 }),
}));
