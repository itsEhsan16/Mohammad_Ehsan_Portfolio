"use client";

/**
 * Which /work view is showing — the field or the index. The pre-paint script in
 * app/layout.tsx sets `html[data-workview]` from localStorage (the field by
 * default; the index for reduced motion, bots and ?view=index), so the right
 * one is hidden before first paint and React reads it as an external store.
 */
export type WorkViewMode = "field" | "index";

const KEY = "me:workview";

export function subscribeWorkView(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-workview"] });
  return () => mo.disconnect();
}

export const getWorkView = (): WorkViewMode =>
  document.documentElement.dataset.workview === "field" ? "field" : "index";

export const getServerWorkView = (): WorkViewMode => "index";

export function setWorkView(mode: WorkViewMode) {
  document.documentElement.dataset.workview = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
}
