"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/content/types";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { ProjectMedia } from "./ProjectMedia";
import { gsap, ScrollTrigger, useGSAP, motionOK } from "@/lib/motion/gsap";
import { transitionTo, isTransitioning } from "@/lib/transition";

/**
 * "Next project" zone. Scrolling through it fills a signal line; reaching the end
 * opens the next case study. The plain link is always there (keyboard, touch, reduced motion).
 */
export function NextProject({ next }: { next: Project }) {
  const root = useRef<HTMLElement>(null);
  const line = useRef<HTMLSpanElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  useGSAP(
    () => {
      if (!motionOK() || !window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches) return;
      let fired = false;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate(self) {
          if (line.current) line.current.style.transform = `scaleX(${self.progress})`;
          if (pct.current) pct.current.textContent = String(Math.round(self.progress * 100)).padStart(3, "0");
          if (self.progress > 0.995 && !fired && !isTransitioning()) {
            fired = true;
            void transitionTo(router, `/work/${next.slug}`);
          }
        },
      });
      gsap.from("[data-next-title]", {
        yPercent: 100,
        duration: 1.2,
        ease: "expo",
        scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
      });
      return () => st.kill();
    },
    { scope: root, dependencies: [next.slug] },
  );

  return (
    <section ref={root} aria-label="Next project" className="next-zone relative border-t border-line">
      <div className="next-sticky flex flex-col justify-between px-gutter py-10">
        <div className="t-label flex items-center justify-between text-muted">
          <span>Next project — N°{String(next.index).padStart(2, "0")}</span>
          <span className="hidden lg:inline">
            Keep scrolling · <span ref={pct}>000</span>%
          </span>
        </div>
        <TransitionLink href={`/work/${next.slug}`} morph data-cursor="next" className="group my-10 block">
          <span className="block overflow-hidden">
            <span data-next-title className="t-display block text-huge leading-[0.84] transition-colors group-hover:text-signal-text">
              {next.title}
            </span>
          </span>
          <span className="t-serif mt-2 block text-[clamp(1.4rem,2.4vw,2.4rem)] text-fg/80">{next.tagline}</span>
          <span className="mt-8 block max-w-[min(100%,720px)]">
            <ProjectMedia project={next} morphKey={`/work/${next.slug}`} sizes="720px" />
          </span>
        </TransitionLink>
        <span className="relative block h-px w-full overflow-hidden bg-line" aria-hidden="true">
          <span ref={line} className="absolute inset-0 origin-left scale-x-0 bg-signal" />
        </span>
      </div>
    </section>
  );
}
