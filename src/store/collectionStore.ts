// Local "saved goals" — goals the user has imported from StatsBomb mode
// and marked as worth keeping. Merged into the main random rotation.

import { create } from 'zustand';
import type { Goal } from '../data/types';

const STORAGE_KEY = 'goalspot.collection';

type State = {
  saved: Goal[];
  add: (goal: Goal) => void;
  remove: (id: string) => void;
  isSaved: (id: string) => boolean;
  clear: () => void;
};

function load(): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Goal[];
  } catch {
    return [];
  }
}

function persist(arr: Goal[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch { /* noop */ }
}

export const useCollectionStore = create<State>((set, get) => ({
  saved: load(),

  add: (goal) => {
    const cur = get().saved;
    if (cur.some(g => g.id === goal.id)) return;
    const next = [...cur, goal];
    set({ saved: next });
    persist(next);
  },

  remove: (id) => {
    const next = get().saved.filter(g => g.id !== id);
    set({ saved: next });
    persist(next);
  },

  isSaved: (id) => get().saved.some(g => g.id === id),

  clear: () => {
    set({ saved: [] });
    persist([]);
  },
}));

export function getSavedGoals(): Goal[] {
  return useCollectionStore.getState().saved;
}
