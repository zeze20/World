import { create } from "zustand";
import type { Geodetic } from "./geo/index.js";
import { LAYER_REGISTRY } from "./layers/registry";

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
  online: boolean;
  showTelemetry: boolean;
  layersEnabled: Record<string, boolean>;
  errorMessage: string | null;

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
  setOnline: (v: boolean) => void;
  setShowTelemetry: (v: boolean) => void;
  toggleLayer: (id: string) => void;
  setLayerEnabled: (id: string, enabled: boolean) => void;
  setErrorMessage: (msg: string | null) => void;
}

const BOOKMARKS_KEY = "aetherglobe.bookmarks";
const LAYERS_KEY = "aetherglobe.layers";

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
    /* quota */
  }
}

function defaultLayers(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const l of LAYER_REGISTRY) map[l.id] = l.defaultEnabled;
  return map;
}

function loadLayers(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LAYERS_KEY);
    if (!raw) return defaultLayers();
    return { ...defaultLayers(), ...(JSON.parse(raw) as Record<string, boolean>) };
  } catch {
    return defaultLayers();
  }
}

function saveLayers(map: Record<string, boolean>) {
  try {
    localStorage.setItem(LAYERS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
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
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  showTelemetry: false,
  layersEnabled: loadLayers(),
  errorMessage: null,

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
  setOnline: (v) => set({ online: v }),
  setShowTelemetry: (v) => set({ showTelemetry: v }),

  toggleLayer: (id) => {
    const next = {
      ...get().layersEnabled,
      [id]: !get().layersEnabled[id],
    };
    saveLayers(next);
    set({ layersEnabled: next });
  },

  setLayerEnabled: (id, enabled) => {
    const next = { ...get().layersEnabled, [id]: enabled };
    saveLayers(next);
    set({ layersEnabled: next });
  },

  setErrorMessage: (msg) => set({ errorMessage: msg }),
}));
