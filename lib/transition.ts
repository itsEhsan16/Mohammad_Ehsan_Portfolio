"use client";

import { getState, setState, subscribe } from "./store";
import { getLenis, scrollTo } from "./motion/lenis";
import { ScrollTrigger } from "./motion/gsap";
import { whoosh } from "./audio";

export interface TransitionOptions {
  /** Pathname being navigated to, e.g. "/work/seva". */
  label?: string;
  /** Element whose WebGL plane should morph into the next page (shared-element transition). */
  morphFrom?: HTMLElement | null;
}

export interface TransitionHooks {
  /** Cover the screen. Resolves when the old page can be swapped. Returns the kind actually used. */
  cover(opts: TransitionOptions): Promise<"wipe" | "morph">;
  /** Uncover. */
  reveal(opts: TransitionOptions & { kind: "wipe" | "morph" }): Promise<void>;
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

function waitForPath(path: string, timeout: number) {
  return new Promise<boolean>((resolve) => {
    if (currentPath === path) return resolve(true);
    const done = (ok: boolean) => {
      pathWaiters.delete(check);
      window.clearTimeout(timer);
      resolve(ok);
    };
    const check = (p: string) => p === path && done(true);
    const timer = window.setTimeout(() => done(false), timeout);
    pathWaiters.add(check);
  });
}

const raf2 = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function scrollToHash(hash: string, immediate = false) {
  if (!hash) return;
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const el = id === "top" ? document.body : document.getElementById(id);
  if (el) scrollTo(id === "top" ? 0 : el, { immediate, offset: 0 });
}

function focusHeading() {
  const h1 = document.querySelector<HTMLElement>("main h1");
  const main = document.getElementById("main");
  const target = h1 ?? main;
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

/**
 * Animated client navigation:
 * cover → reset scroll (under the cover) → push → wait for the route to commit →
 * settle (fonts, layout, triggers) → reveal → focus the new heading.
 * Falls back to a plain push with reduced motion, and to a hard navigation if
 * the new route doesn't commit within 4 s.
 */
export async function transitionTo(router: Router, href: string, opts: Omit<TransitionOptions, "label"> = {}) {
  const url = new URL(href, window.location.href);
  if (busy) return;
  if (!hooks || document.documentElement.classList.contains("reduce")) {
    router.push(url.pathname + url.search + url.hash, { scroll: true });
    return;
  }
  busy = true;
  const main = document.getElementById("main");
  setState({ transitioning: true, menuOpen: false, cmdOpen: false });
  whoosh();
  getLenis()?.stop();
  if (main) main.inert = true;
  try {
    const kind = await Promise.race([hooks.cover({ label: url.pathname, ...opts }), wait(1800).then(() => "wipe" as const)]);
    getLenis()?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    router.push(url.pathname + url.search + url.hash, { scroll: false });
    const arrived = await waitForPath(url.pathname, 4000);
    if (!arrived) {
      window.location.assign(href);
      return;
    }
    await document.fonts.ready;
    await raf2();
    getLenis()?.resize();
    ScrollTrigger.refresh();
    if (url.hash) scrollToHash(url.hash, true);
    getLenis()?.start();
    // page intros start while the overlay lifts
    setState({ transitioning: false });
    await Promise.race([hooks.reveal({ label: url.pathname, ...opts, kind }), wait(2400)]);
    focusHeading();
  } finally {
    busy = false;
    const newMain = document.getElementById("main");
    if (newMain) newMain.inert = false;
    if (main) main.inert = false;
    getLenis()?.start();
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
