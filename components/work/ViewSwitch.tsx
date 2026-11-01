"use client";

import { useLayoutEffect, useRef } from "react";
import { WORK_VIEWS, type WorkViewMode } from "@/lib/field/view";
import { tick } from "@/lib/audio";
import { cn } from "@/lib/utils";

/** LIST · WHEEL · GRID — a segmented control with a pill that slides to the chosen view. */
export function ViewSwitch({ mode, onChange }: { mode: WorkViewMode; onChange: (m: WorkViewMode) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const w = wrap.current;
    const p = pill.current;
    const b = w?.querySelector<HTMLElement>(`[data-mode="${mode}"]`);
    if (!w || !p || !b) return;
    p.style.width = `${b.offsetWidth}px`;
    p.style.transform = `translateX(${b.offsetLeft}px)`;
    // no slide on the first placement
    requestAnimationFrame(() => w.classList.add("is-ready"));
  }, [mode]);

  return (
    <div ref={wrap} role="group" aria-label="View" className="view-switch">
      <span ref={pill} aria-hidden="true" className="view-switch__pill" />
      {WORK_VIEWS.map((m) => (
        <button
          key={m}
          type="button"
          data-mode={m}
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          onMouseEnter={tick}
          className={cn("view-switch__btn", mode === m && "is-on")}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
