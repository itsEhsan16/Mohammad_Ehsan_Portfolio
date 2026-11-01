"use client";

import { useRef, type ElementType } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, motionOK } from "@/lib/motion/gsap";
import { whenVisible } from "@/lib/transition";
import { cn } from "@/lib/utils";

type SplitType = "lines" | "words" | "chars";

interface Props {
  as?: ElementType;
  children: React.ReactNode;
  className?: string;
  type?: SplitType;
  /** "view": when scrolled into view. "load": as soon as the page is visible (after preloader/transition). */
  trigger?: "view" | "load";
  delay?: number;
  stagger?: number;
  duration?: number;
  start?: string;
  id?: string;
}

/**
 * Masked line/word/char rise using GSAP SplitText. Accessible: a heading gets an
 * aria-label with its split pieces aria-hidden; anything else is read straight
 * from its line pieces. Content is visible without JS; with JS and motion
 * enabled it is hidden until split (with a CSS failsafe).
 */
export function SplitReveal({
  as = "div",
  children,
  className,
  type = "lines",
  trigger = "view",
  delay = 0,
  stagger,
  duration = 1.15,
  start = "top 88%",
  id,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (!motionOK()) return;
      {
        let split: SplitText | null = null;
        let stopWait: (() => void) | null = null;
        let st: ScrollTrigger | null = null;
        let played = false;
        let cancelled = false;

        document.fonts.ready.then(() => {
          if (cancelled) return;
          split = SplitText.create(el, {
            type: type === "chars" ? "chars,words,lines" : type === "words" ? "words,lines" : "lines",
            mask: "lines",
            linesClass: "split-line",
            autoSplit: true,
            // aria-label isn't allowed on a <p>, so only headings take one
            aria: /^H[1-6]$/.test(el.tagName) ? "auto" : "none",
            onSplit(self) {
              st?.kill();
              stopWait?.();
              const targets = type === "chars" ? self.chars : type === "words" ? self.words : self.lines;
              el.dataset.revealed = "";
              const tween = gsap.from(targets, {
                yPercent: 115,
                rotate: type === "lines" ? 0 : 4,
                duration,
                ease: "expo",
                delay,
                stagger: stagger ?? (type === "chars" ? 0.022 : type === "words" ? 0.05 : 0.09),
                paused: true,
                onComplete: () => {
                  played = true;
                },
              });
              // re-splits (resize / font swap) must not replay the entrance
              if (played) return tween.progress(1);
              if (trigger === "load") stopWait = whenVisible(() => tween.play());
              else st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tween.play() });
              return tween;
            },
          });
        });

        return () => {
          cancelled = true;
          stopWait?.();
          st?.kill();
          split?.revert();
        };
      }
    },
    { scope: ref },
  );

  const Tag = as;
  return (
    <Tag ref={ref} id={id} className={cn(className)} data-reveal="">
      {children}
    </Tag>
  );
}
