"use client";

import { useSyncExternalStore } from "react";

export type Theme = "ink" | "paper";

export interface AppState {
  /** Preloader finished (or skipped) — page intros may run. */
  ready: boolean;
  menuOpen: boolean;
  cmdOpen: boolean;
  sound: boolean;
  theme: Theme;
  /** A page transition is covering the screen. */
  transitioning: boolean;
  /** WebGL engine is running. */
  gl: boolean;
  /** The /work field fills the screen (no footer, no page scroll). */
  field: boolean;
}

const initial: AppState = {
  ready: false,
  menuOpen: false,
  cmdOpen: false,
  sound: false,
  theme: "ink",
  transitioning: false,
  gl: false,
  field: false,
};

let state: AppState = initial;
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<AppState>) {
  let changed = false;
  for (const key in patch) {
    const k = key as keyof AppState;
    if (state[k] !== patch[k]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Select a primitive slice of app state. */
export function useApp<T extends AppState[keyof AppState]>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

/** Run `cb` once the app is ready (immediately if it already is). Returns a disposer. */
export function onReady(cb: () => void) {
  if (state.ready) {
    cb();
    return () => {};
  }
  let done = false;
  const unsub = subscribe(() => {
    if (!done && state.ready) {
      done = true;
      unsub();
      cb();
    }
  });
  return () => {
    done = true;
    unsub();
  };
}
