"use client";

import type Lenis from "lenis";

/** Module-level handle so non-React code (GL engine, transitions) can read scroll state. */
let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenis = l;
}

export function getLenis() {
  return lenis;
}

/** Current scroll position, smooth when Lenis runs, native otherwise. */
export function scrollY() {
  return lenis ? lenis.scroll : typeof window === "undefined" ? 0 : window.scrollY;
}

/** Scroll velocity in px/frame (0 without Lenis). */
export function scrollVelocity() {
  return lenis ? lenis.velocity : 0;
}

export function scrollTo(target: number | string | HTMLElement, opts: { immediate?: boolean; offset?: number } = {}) {
  if (lenis) {
    lenis.scrollTo(target, { immediate: opts.immediate, offset: opts.offset ?? 0, duration: 1.4 });
    return;
  }
  const behavior: ScrollBehavior = opts.immediate ? "instant" : "smooth";
  if (typeof target === "number") window.scrollTo({ top: target, behavior });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
      window.scrollTo({ top, behavior });
    }
  }
}
