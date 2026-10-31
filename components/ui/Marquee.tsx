"use client";

import { useRef } from "react";
import { gsap, useGSAP, motionOK } from "@/lib/motion/gsap";
import { scrollVelocity } from "@/lib/motion/lenis";
import { cn } from "@/lib/utils";

/** Infinite marquee whose speed and direction follow scroll velocity. */
export function Marquee({ items, className, separator = "✳" }: { items: readonly string[]; className?: string; separator?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionOK() || !track.current) return;
      const loop = gsap.to(track.current, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
      let dir = 1;
      const update = () => {
        const v = scrollVelocity();
        if (Math.abs(v) > 0.2) dir = v > 0 ? 1 : -1;
        const target = dir * (1 + Math.min(Math.abs(v) * 0.12, 6));
        loop.timeScale(gsap.utils.interpolate(loop.timeScale(), target, 0.08));
        gsap.set(track.current, { skewX: gsap.utils.clamp(-8, 8, -v * 0.35) });
      };
      gsap.ticker.add(update);
      return () => {
        gsap.ticker.remove(update);
        loop.kill();
      };
    },
    { scope: root },
  );

  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((it) => (
        <span key={it} className="flex items-center">
          <span className="px-[0.35em]">{it}</span>
          <span className="px-[0.35em] text-signal" aria-hidden="true">
            {separator}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={root} className={cn("overflow-hidden whitespace-nowrap", className)}>
      <p className="sr-only">{items.join(", ")}</p>
      <div ref={track} className="flex w-max will-change-transform" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  );
}
