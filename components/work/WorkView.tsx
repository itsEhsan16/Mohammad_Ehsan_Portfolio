"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FieldItem, ReelProject } from "@/lib/field/types";
import { getServerWorkView, getWorkView, setWorkView, subscribeWorkView, type WorkViewMode } from "@/lib/field/view";
import { getState, setState } from "@/lib/store";
import { reducedMotion } from "@/lib/motion/gsap";
import { WorkField } from "./WorkField";
import { TitleReel } from "./TitleReel";
import { ViewSwitch } from "./ViewSwitch";

/**
 * /work: LIST · WHEEL · GRID. The server renders `children` — the heading and a
 * plain list of every project — which is the page without JS and for crawlers,
 * and stays in the accessibility tree afterwards as a list that appears when a
 * link in it has focus. With JS, the chosen view fills the screen: LIST and
 * WHEEL are one component that morphs between layouts; GRID is the field.
 */
export function WorkView({ items, projects, children }: { items: FieldItem[]; projects: ReelProject[]; children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeWorkView, getWorkView, getServerWorkView);
  const interactive = mode !== "static";
  const [leaving, setLeaving] = useState(false);
  const api = useRef<{ key(e: KeyboardEvent): boolean } | null>(null);
  const swap = useRef(0);

  // the views fill the screen: no page scroll, no footer, and the plain list becomes the keyboard shortcut list
  useLayoutEffect(() => {
    if (!interactive) return;
    const html = document.documentElement;
    html.dataset.workui = "";
    window.scrollTo(0, 0);
    setState({ field: true });
    return () => {
      delete html.dataset.workui;
      setState({ field: false });
    };
  }, [interactive]);

  // arrow keys and Enter reach the active view wherever focus rests, except on links, buttons and fields
  useEffect(() => {
    if (!interactive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      // the view switcher passes arrows through (a mouse click leaves focus there), but keeps Enter/Space for itself
      const onSwitch = !!t?.closest(".view-switch");
      if (onSwitch && !e.key.startsWith("Arrow")) return;
      if (!onSwitch && t?.closest("a,button,input,textarea,select,[contenteditable],[role=dialog]")) return;
      const s = getState();
      if (s.cmdOpen || s.menuOpen || s.transitioning || document.documentElement.dataset.lightbox !== undefined) return;
      if (api.current?.key(e)) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactive]);

  useEffect(() => () => window.clearTimeout(swap.current), []);

  const change = (next: WorkViewMode) => {
    if (!interactive || next === mode || leaving) return;
    // LIST ↔ WHEEL morphs in place; to or from GRID the current view fades out first
    const crossing = (mode === "grid") !== (next === "grid");
    if (!crossing || reducedMotion()) {
      setWorkView(next);
      return;
    }
    setLeaving(true);
    swap.current = window.setTimeout(() => {
      setWorkView(next);
      setLeaving(false);
    }, 280);
  };

  return (
    <>
      {children}
      {interactive && (
        <>
          {mode === "grid" ? (
            <WorkField items={items} apiRef={api} leaving={leaving} />
          ) : (
            <TitleReel projects={projects} layout={mode} apiRef={api} leaving={leaving} />
          )}
          <ViewSwitch mode={mode} onChange={change} />
        </>
      )}
    </>
  );
}
