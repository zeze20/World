import { create } from "zustand";
import type { Geodetic } from "../geo/index.js";

export interface Bookmark {
  id: string;
  name: string;
  position: Geodetic;
  createdAt: number;
}

export interface MeasurePoint {
  position: Geodetic;
  cartesian?: unknown;
}

interface AppState {
  cameraPosition: Geodetic | null;
  bookmarks: Bookmark[];
  measurePoints: MeasurePoint[];
  measureDistanceM: number | null;
  measureActive: boolean;
  language: "tr" | "en";
  showHelp: boolean;
  isFlying: boolean;

  setCameraPosition: (p: Geodetic | null) => void;
  addBookmark: (name: string, position: Geodetic) => void;
  removeBookmark: (id: string) => void;
  setMeasureActive: (v: boolean) => void;
  addMeasurePoint: (p: MeasurePoint) => void;
  clearMeasure: () => void;
  setMeasureDistance: (m: number | null) => void;
  setLanguage: (l: "tr" | "en") => void;
  setShowHelp: (v: boolean) => void;
  setIsFlying: (v: boolean) => void;
}

const BOOKMARKS_KEY = "aetherglobe.bookmarks";

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

function saveBookmarks(list: Bookmark[]) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch {
    // quota or private mode – ignore
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  cameraPosition: null,
  bookmarks: loadBookmarks(),
  measurePoints: [],
  measureDistanceM: null,
  measureActive: false,
  language: "tr",
  showHelp: false,
  isFlying: false,

  setCameraPosition: (p) => set({ cameraPosition: p }),

  addBookmark: (name, position) => {
    const b: Bookmark = {
      id: crypto.randomUUID(),
      name,
      position,
      createdAt: Date.now(),
    };
    const next = [...get().bookmarks, b];
    saveBookmarks(next);
    set({ bookmarks: next });
  },

  removeBookmark: (id) => {
    const next = get().bookmarks.filter((b) => b.id !== id);
    saveBookmarks(next);
    set({ bookmarks: next });
  },

  setMeasureActive: (v) =>
    set({
      measureActive: v,
      measurePoints: v ? [] : get().measurePoints,
      measureDistanceM: v ? null : get().measureDistanceM,
    }),

  addMeasurePoint: (p) => {
    const points = [...get().measurePoints, p].slice(-2);
    set({ measurePoints: points });
  },

  clearMeasure: () =>
    set({ measurePoints: [], measureDistanceM: null, measureActive: false }),

  setMeasureDistance: (m) => set({ measureDistanceM: m }),

  setLanguage: (l) => set({ language: l }),

  setShowHelp: (v) => set({ showHelp: v }),

  setIsFlying: (v) => set({ isFlying: v }),
}));
