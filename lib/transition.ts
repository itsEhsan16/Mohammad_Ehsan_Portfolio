"use client";

import { getState, setState, subscribe } from "./store";
import { scrollTo } from "./motion/lenis";
import { ScrollTrigger } from "./motion/gsap";
import { whoosh } from "./audio";

export interface TransitionOptions {
  /** Text shown in the overlay, e.g. "/work/seva". */
  label?: string;
  /** Element whose WebGL plane should morph into the next page (shared-element transition). */
  morphFrom?: HTMLElement | null;
}

export interface TransitionHooks {
  cover(opts: TransitionOptions): Promise<void>;
  reveal(opts: TransitionOptions): Promise<void>;
}

type Router = { push: (href: string, opts?: { scroll?: boolean }) => void };

let hooks: TransitionHooks | null = null;
let busy = false;
let currentPath = typeof window === "undefined" ? "/" : window.location.pathname;
const pathWaiters = new Set<(path: string) => void>();

export function setTransitionHooks(h: TransitionHooks | null) {
  hooks = h;
}

export function isTransitioning() {
  return busy;
}

/** Called by <RouteWatcher/> after every committed route change. */
export function notifyPathChange(path: string) {
  currentPath = path;
  pathWaiters.forEach((w) => w(path));
}

function waitForPath(path: string, timeout = 5000) {
  return new Promise<void>((resolve) => {
    if (currentPath === path) return resolve();
    const done = () => {
      pathWaiters.delete(check);
      window.clearTimeout(timer);
      resolve();
    };
    const check = (p: string) => p === path && done();
    const timer = window.setTimeout(done, timeout);
    pathWaiters.add(check);
  });
}

const raf2 = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([p, new Promise<void>((r) => window.setTimeout(r, ms))]);
}

export function scrollToHash(hash: string, immediate = false) {
  if (!hash) return;
  const el = document.getElementById(decodeURIComponent(hash.replace(/^#/, "")));
  if (el) scrollTo(el, { immediate, offset: 0 });
}

/**
 * Animated client navigation: cover → push → wait for the new route to commit →
 * reset scroll → reveal. Falls back to a plain push when nothing is registered.
 */
export async function transitionTo(router: Router, href: string, opts: TransitionOptions = {}) {
  const url = new URL(href, window.location.href);
  if (busy) return;
  if (!hooks || document.documentElement.classList.contains("reduce")) {
    router.push(href, { scroll: true });
    return;
  }
  busy = true;
  setState({ transitioning: true, menuOpen: false, cmdOpen: false });
  whoosh();
  try {
    await withTimeout(hooks.cover({ label: url.pathname, ...opts }), 1600);
    router.push(url.pathname + url.search + url.hash, { scroll: false });
    await waitForPath(url.pathname);
    await raf2();
    scrollTo(0, { immediate: true });
    ScrollTrigger.refresh();
    if (url.hash) scrollToHash(url.hash, true);
    const reveal = hooks.reveal({ label: url.pathname, ...opts });
    // let page intros start while the overlay lifts
    setState({ transitioning: false });
    await withTimeout(reveal, 2000);
  } finally {
    busy = false;
    if (getState().transitioning) setState({ transitioning: false });
  }
}

/** Resolve when the app is ready and no transition covers the screen. */
export function whenVisible(cb: () => void) {
  const ok = () => getState().ready && !getState().transitioning;
  if (ok()) {
    cb();
    return () => {};
  }
  let fired = false;
  const unsub = subscribe(() => {
    if (!fired && ok()) {
      fired = true;
      unsub();
      cb();
    }
  });
  return () => {
    fired = true;
    unsub();
  };
}
