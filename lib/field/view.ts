"use client";

/**
 * Which /work view is showing: the title list, the title wheel or the grid (the
 * endless field). The pre-paint script in app/layout.tsx sets
 * `html[data-workview]` from localStorage (grid by default; list for reduced
 * motion and crawlers; `?view=` overrides), so the static list can be hidden
 * before first paint and React reads the mode as an external store. The server
 * renders "static": the plain accessible list, with no interactive view yet.
 */
export type WorkViewMode = "grid" | "list" | "wheel";
export const WORK_VIEWS: WorkViewMode[] = ["list", "wheel", "grid"];

const KEY = "me:workview";

export function subscribeWorkView(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-workview"] });
  return () => mo.disconnect();
}

export const getWorkView = (): WorkViewMode | "static" => {
  const v = document.documentElement.dataset.workview;
  return v === "grid" || v === "list" || v === "wheel" ? v : "static";
};

export const getServerWorkView = (): WorkViewMode | "static" => "static";

export function setWorkView(mode: WorkViewMode) {
  document.documentElement.dataset.workview = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
}
