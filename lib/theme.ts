"use client";

import { getState, setState, type Theme } from "./store";

/** Apply a theme with a circular reveal from (x, y) when the View Transitions API is available. */
export function applyTheme(next: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const commit = () => {
    root.dataset.theme = next;
    try {
      localStorage.setItem("me:theme", next);
    } catch {}
    setState({ theme: next });
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };

  const reduce = root.classList.contains("reduce");
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
  if (!doc.startViewTransition || reduce || !origin) {
    commit();
    return;
  }
  const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
  const vt = doc.startViewTransition(commit);
  vt.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.83, 0, 0.17, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
}

export function toggleTheme(origin?: { x: number; y: number }) {
  applyTheme(getState().theme === "ink" ? "paper" : "ink", origin);
}

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "paper" ? "paper" : "ink";
}
