"use client";

import { useEffect, useRef } from "react";
import { gsap, SCRAMBLE_CHARS, finePointer, motionOK } from "@/lib/motion/gsap";
import { tick } from "@/lib/audio";

const LABELS: Record<string, string> = {
  view: "View",
  open: "Open",
  drag: "Drag",
  copy: "Copy",
  play: "Play",
  paint: "Paint",
  next: "Next",
};

/**
 * Dot + ring cursor with contextual labels driven by `data-cursor` attributes.
 * Only on fine pointers without reduced motion; the native cursor is hidden via `html.has-cursor`.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!finePointer() || !motionOK() || window.matchMedia("(forced-colors: active)").matches) return;
    if (!dot.current || !ring.current || !label.current) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const d = dot.current;
    const r = ring.current;
    const l = label.current;
    gsap.set([d, r], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const dx = gsap.quickTo(d, "x", { duration: 0.12, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.12, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3" });

    let mode = "";
    let visible = false;

    const setMode = (next: string) => {
      if (next === mode) return;
      mode = next;
      const text = LABELS[next];
      if (next === "hide") {
        gsap.to([d, r], { scale: 0, duration: 0.3, ease: "expo" });
        return;
      }
      if (text) {
        gsap.to(r, { width: 84, height: 84, backgroundColor: "var(--signal)", borderColor: "transparent", duration: 0.5, ease: "expo" });
        gsap.to(d, { scale: 0, duration: 0.3 });
        gsap.to(l, { opacity: 1, duration: 0.2 });
        gsap.to(l, { duration: 0.5, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.8 } });
        tick();
      } else if (next === "link") {
        gsap.to(r, { width: 52, height: 52, backgroundColor: "transparent", borderColor: "var(--fg)", scale: 1, duration: 0.5, ease: "expo" });
        gsap.to(d, { scale: 1, duration: 0.3 });
        gsap.to(l, { opacity: 0, duration: 0.15 });
      } else {
        gsap.to(r, { width: 32, height: 32, backgroundColor: "transparent", borderColor: "color-mix(in oklab, var(--fg) 45%, transparent)", scale: 1, duration: 0.5, ease: "expo" });
        gsap.to(d, { scale: 1, duration: 0.3 });
        gsap.to(l, { opacity: 0, duration: 0.15 });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        gsap.to([d, r], { autoAlpha: 1, duration: 0.3 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const host = t?.closest<HTMLElement>("[data-cursor]");
      if (host) return setMode(host.dataset.cursor || "");
      if (t?.closest("a,button,[role=button],label,select")) return setMode("link");
      setMode("");
    };
    const onDown = () => gsap.to(r, { scale: 0.8, duration: 0.2 });
    const onUp = () => gsap.to(r, { scale: 1, duration: 0.4, ease: "spring" });
    const onLeave = () => {
      visible = false;
      gsap.to([d, r], { autoAlpha: 0, duration: 0.3 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[100] hidden fine:block">
      <div
        ref={ring}
        className="invisible fixed left-0 top-0 grid h-8 w-8 place-items-center rounded-full border border-fg/45 opacity-0"
      >
        <span ref={label} className="t-label text-[10px] font-semibold text-ink opacity-0" />
      </div>
      <div ref={dot} className="invisible fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-fg opacity-0 mix-blend-difference" />
    </div>
  );
}
