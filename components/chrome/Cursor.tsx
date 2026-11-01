"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { tick } from "@/lib/audio";
import { useApp } from "@/lib/store";
import { SHAKE } from "@/lib/cursor";

const LABELS: Record<string, string> = {
  view: "View",
  open: "Open",
  next: "Next",
  copy: "Copy",
  drag: "Drag",
  paint: "Paint",
  play: "Play",
};

/** Tooltip position relative to the pointer's hotspot (clear of the arrow and the hand). */
const TIP = { x: 16, y: 22 };

/**
 * The pointer itself is a native CSS image cursor (app/globals.css, public/cursors), so it never lags.
 * This adds the three things CSS can't do:
 *  - a small tooltip beside the pointer from `data-cursor` (View, Open, Drag, Paint, Next, Copy);
 *  - a spinning pinwheel beside the arrow while a page transition runs;
 *  - shake to find: shake the mouse and the pointer grows for a moment, like macOS.
 * Only with the Mac cursor on (mouse/trackpad, not opted out in ⌘K).
 */
export function Cursor() {
  const mac = useApp((s) => s.macCursor);
  const busy = useApp((s) => s.transitioning);
  const tip = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const big = useRef<SVGSVGElement>(null);
  const pos = useRef({ x: -200, y: -200, in: false });
  const recheck = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!mac) return;
    const html = document.documentElement;
    const t = tip.current;
    const w = wheel.current;
    const g = big.current;
    if (!t || !w || !g) return;
    const reduced = html.classList.contains("reduce");
    let label = "";
    let width = 0;
    let raf = 0;
    let scrollRaf = 0;
    // shake to find
    let lastX = 0;
    let lastT = 0;
    let dir = 0;
    let legX = 0;
    let legT = 0;
    let flips: number[] = [];
    let shaking = false;
    let endTimer = 0;
    let hideOnMove = false;
    const scale = { s: 1 };

    const place = () => {
      raf = 0;
      const { x, y } = pos.current;
      if (label) {
        const tx = x + TIP.x + width > window.innerWidth - 8 ? x - 10 - width : x + TIP.x;
        const ty = y + TIP.y + 22 > window.innerHeight - 8 ? y - 30 : y + TIP.y;
        t.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      }
      w.style.translate = `${x + 12}px ${y + 12}px`;
      g.style.translate = `${x - 3}px ${y - 2}px`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    const showTip = () => t.classList.toggle("is-on", !!label && !shaking && !html.classList.contains("cursor-busy"));

    const setLabel = (next: string) => {
      if (next === label) return;
      label = next;
      if (next) {
        t.textContent = next;
        width = t.offsetWidth;
        tick();
      }
      showTip();
      schedule();
    };
    const labelFor = (el: Element | null) => {
      const k = el?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? "";
      if (k === "paint" && !html.classList.contains("gl-ready")) return "";
      return LABELS[k] ?? "";
    };
    recheck.current = () => {
      if (!pos.current.in) return;
      setLabel(labelFor(document.elementFromPoint(pos.current.x, pos.current.y)));
      showTip();
    };

    const startShake = () => {
      shaking = true;
      html.classList.add("cursor-shake");
      showTip();
      g.style.visibility = "visible";
      gsap.to(scale, { s: SHAKE.scale, duration: 0.5, ease: "spring", overwrite: true, onUpdate: () => void (g.style.scale = String(scale.s)) });
    };
    const endShake = () => {
      gsap.to(scale, {
        s: 1,
        duration: 0.35,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => void (g.style.scale = String(scale.s)),
        onComplete: () => {
          shaking = false;
          html.classList.remove("cursor-shake");
          // Safari only shows the real cursor again once the mouse moves, so the copy stays until then
          hideOnMove = true;
          showTip();
        },
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos.current = { x: e.clientX, y: e.clientY, in: true };
      if (hideOnMove) {
        hideOnMove = false;
        g.style.visibility = "hidden";
      }
      schedule();
      if (reduced || e.buttons) return;
      const now = performance.now();
      const d = Math.sign(e.clientX - lastX);
      if (d && d !== dir) {
        // a leg ended: count it as a shake if it was long and quick enough
        const leg = Math.abs(lastX - legX);
        if (dir && leg >= SHAKE.minLeg && leg / Math.max(1, lastT - legT) >= SHAKE.minSpeed) {
          flips.push(now);
          if (shaking) {
            window.clearTimeout(endTimer);
            endTimer = window.setTimeout(endShake, SHAKE.holdMs);
          }
        }
        dir = d;
        legX = lastX;
        legT = lastT;
      }
      lastX = e.clientX;
      lastT = now;
      flips = flips.filter((f) => now - f < SHAKE.windowMs);
      if (!shaking && flips.length >= SHAKE.flips) {
        startShake();
        window.clearTimeout(endTimer);
        endTimer = window.setTimeout(endShake, SHAKE.holdMs);
      }
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setLabel(labelFor(e.target as Element | null));
    };
    // smooth scrolling moves content under a still pointer
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        recheck.current?.();
      });
    };
    const onLeave = () => {
      pos.current.in = false;
      setLabel("");
      w.classList.remove("is-on");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    html.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("scroll", onScroll);
      html.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      window.clearTimeout(endTimer);
      gsap.killTweensOf(scale);
      html.classList.remove("cursor-shake");
      t.classList.remove("is-on");
      g.style.visibility = "hidden";
      recheck.current = null;
    };
  }, [mac]);

  // busy: the arrow (CSS) plus a spinning pinwheel while a page transition runs
  useEffect(() => {
    const html = document.documentElement;
    const on = mac && busy;
    html.classList.toggle("cursor-busy", on);
    wheel.current?.classList.toggle("is-on", on && pos.current.in);
    if (on) tip.current?.classList.remove("is-on");
    else recheck.current?.();
    return () => html.classList.remove("cursor-busy");
  }, [mac, busy]);

  return (
    <div aria-hidden="true">
      <div ref={tip} className="cur-tip" />
      <div ref={wheel} className="cur-wheel" />
      <svg ref={big} className="cur-big" viewBox="0 0 20 26" width="20" height="26">
        <path
          d="M3 2 L3 19.5 L7 15.5 L10 22.5 L13 21.5 L10 14.5 L15.5 14.5 Z"
          fill="#0B0B0A"
          stroke="#FF4D00"
          strokeWidth="2"
          strokeLinejoin="round"
          paintOrder="stroke"
        />
      </svg>
    </div>
  );
}
