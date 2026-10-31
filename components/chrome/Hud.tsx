"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { useFps, useLocalTime } from "@/lib/time";
import { scrollY } from "@/lib/motion/lenis";
import { gsap } from "@/lib/motion/gsap";

const sha = process.env.NEXT_PUBLIC_BUILD_SHA || "local";

function Chip({ k, children, className = "" }: { k: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`}>
      <span className="text-faint">{k}::</span>
      <span className="text-fg/80 tabular-nums">{children}</span>
    </span>
  );
}

/** Telemetry strip — local time, availability, FPS, build and scroll progress. */
export function Hud() {
  const time = useLocalTime(true);
  const fps = useFps();
  const scrollRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let last = -1;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.round((scrollY() / max) * 100) : 0;
      if (p !== last && scrollRef.current) {
        last = p;
        scrollRef.current.textContent = String(Math.min(100, Math.max(0, p))).padStart(3, "0") + "%";
      }
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <div
      className="t-label pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-[var(--hud-h)] items-center justify-between gap-4 px-gutter text-[10px] text-muted"
      aria-hidden="true"
    >
      <div className="flex items-center gap-4">
        <Chip k={site.location.tzLabel}>{time}</Chip>
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <span className="live-dot" />
          <span className="text-fg/80">{site.availability.open ? site.availability.label : "Booked"}</span>
        </span>
        <Chip k="FPS" className="hidden sm:inline-flex">
          {fps ?? "--"}
        </Chip>
      </div>
      <div className="hidden items-center gap-4 md:flex">
        <Chip k="BASE">{site.location.country}</Chip>
        <Chip k="BUILD">{sha}</Chip>
        <Chip k="SCROLL">
          <span ref={scrollRef}>000%</span>
        </Chip>
      </div>
    </div>
  );
}
