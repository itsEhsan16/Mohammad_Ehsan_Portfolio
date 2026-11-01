"use client";

import { setState } from "./store";

/**
 * The macOS-style pointer set lives in public/cursors as native CSS image
 * cursors (exact and lag-free); app/globals.css decides which one shows where,
 * under `html.mac-cursor`, which the pre-paint script in app/layout.tsx adds for
 * mouse/trackpad users unless they chose the system cursor (⌘K).
 *
 * Hotspots, in css px of the 1x file — keep in sync with app/globals.css:
 *   arrow 3 2 · hand 8 2 · ibeam 5 11 · grab 12 11 · grabbing 12 10 · crosshair 11 11 · copy 3 2
 */
export const CURSOR_KEY = "me:cursor";

/** Shake to find: horizontal direction reversals, each leg long and fast enough, inside a short window. */
export const SHAKE = { flips: 4, windowMs: 650, minLeg: 24, minSpeed: 0.5, holdMs: 350, scale: 4.5 } as const;

/** A mouse or trackpad, and not forced colours (custom cursors would override the user's high-contrast ones). */
export const cursorCapable = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine) and (hover: hover)").matches &&
  !window.matchMedia("(forced-colors: active)").matches;

export const macCursorOn = () => typeof document !== "undefined" && document.documentElement.classList.contains("mac-cursor");

/** Switch between the Mac pointer and the system one; remembered across visits. */
export function setMacCursor(on: boolean) {
  try {
    localStorage.setItem(CURSOR_KEY, on ? "mac" : "system");
  } catch {}
  const html = document.documentElement;
  const active = on && cursorCapable();
  html.classList.toggle("mac-cursor", active);
  if (!active) html.classList.remove("cursor-dragging", "cursor-busy", "cursor-shake");
  setState({ macCursor: active });
}

/** The closed hand everywhere while something is being dragged (beats inline styles and whatever is under the pointer). */
export function setDragging(on: boolean) {
  document.documentElement.classList.toggle("cursor-dragging", on);
}
