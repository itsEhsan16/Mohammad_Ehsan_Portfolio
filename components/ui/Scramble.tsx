"use client";

import { useEffect, useRef } from "react";
import { gsap, SCRAMBLE_CHARS, reducedMotion } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
  /** Scramble whenever the pointer enters the closest link/button (or the element). */
  hover?: boolean;
  /** Scramble once when it first scrolls into view. */
  onView?: boolean;
  duration?: number;
}

/** Text that decodes itself (GSAP ScrambleText). The real text is always rendered for SSR/a11y. */
export function Scramble({ text, className, hover, onView, duration = 0.8 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const run = () =>
      gsap.to(el, {
        duration,
        ease: "none",
        scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.6, revealDelay: 0.1 },
        overwrite: true,
      });

    const cleanups: (() => void)[] = [];
    if (hover) {
      const host = (el.closest("a,button") as HTMLElement | null) ?? el;
      host.addEventListener("mouseenter", run);
      cleanups.push(() => host.removeEventListener("mouseenter", run));
    }
    if (onView) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            run();
            io.disconnect();
          }
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }
    return () => cleanups.forEach((c) => c());
  }, [text, hover, onView, duration]);

  return (
    <span ref={ref} className={cn("inline-block whitespace-pre", className)}>
      {text}
    </span>
  );
}
