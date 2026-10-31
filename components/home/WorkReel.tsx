"use client";

import { useRef } from "react";
import type { Project } from "@/content/types";
import { statusLabel } from "@/content/projects";
import { SectionLabel, Chip } from "@/components/ui/SectionLabel";
import { ProjectMedia } from "@/components/work/ProjectMedia";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { gsap, ScrollTrigger, SCRAMBLE_CHARS, useGSAP, motionOK } from "@/lib/motion/gsap";
import { tick } from "@/lib/audio";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Selected work. Desktop with motion: a sticky viewport whose track slides
 * horizontally as you scroll (no ScrollTrigger pin — plain CSS sticky).
 * Touch / reduced motion: a vertical stack of the same slides.
 */
export function WorkReel({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const n = projects.length;

  useGSAP(
    () => {
      if (!motionOK()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const slides = gsap.utils.toArray<HTMLElement>("[data-slide]");
        let active = -1;
        const tween = gsap.to(track.current, {
          x: () => -(track.current!.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
            onUpdate(self) {
              const i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
              if (i !== active) {
                active = i;
                if (counter.current) {
                  gsap.to(counter.current, { duration: 0.5, scrambleText: { text: pad(i + 1), chars: "0123456789", speed: 1 } });
                }
                slides.forEach((s, k) => s.toggleAttribute("data-active", k === i));
              }
            },
          },
        });

        // titles decode as their slide reaches the centre
        slides.forEach((slide) => {
          const title = slide.querySelector<HTMLElement>("[data-title]");
          if (!title) return;
          const text = title.dataset.title || "";
          ScrollTrigger.create({
            trigger: slide,
            containerAnimation: tween,
            start: "left 70%",
            onEnter: () => gsap.to(title, { duration: 1, scrambleText: { text, chars: SCRAMBLE_CHARS, speed: 0.5, revealDelay: 0.2 } }),
          });
          gsap.from(slide.querySelectorAll("[data-slide-fade]"), {
            y: 40,
            autoAlpha: 0,
            stagger: 0.06,
            duration: 1,
            ease: "expo",
            scrollTrigger: { trigger: slide, containerAnimation: tween, start: "left 75%" },
          });
        });
        return () => tween.scrollTrigger?.kill();
      });
      mm.add("(max-width: 1023px)", () => {
        gsap.utils.toArray<HTMLElement>("[data-slide]").forEach((slide) => {
          gsap.from(slide.querySelectorAll("[data-slide-fade]"), {
            y: 30,
            autoAlpha: 0,
            stagger: 0.05,
            duration: 1,
            ease: "expo",
            scrollTrigger: { trigger: slide, start: "top 80%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="work"
      aria-labelledby="work-label"
      className="reel relative"
      style={{ "--n": n } as React.CSSProperties}
    >
      <div className="reel-sticky">
        <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--hud-h)+4.5rem)] z-10 hidden items-center justify-between px-gutter lg:flex">
          <SectionLabel id="work-label" index="02" title="Selected work" count={n} />
          <div className="t-label flex items-center gap-3 text-muted">
            <span>
              N°<span ref={counter}>01</span>/{pad(n)}
            </span>
            <span className="relative block h-px w-32 overflow-hidden bg-line">
              <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-signal" />
            </span>
          </div>
        </div>
        <SectionLabel index="02" title="Selected work" count={n} className="px-gutter pb-8 lg:hidden" />

        <div ref={track} className="reel-track">
          {projects.map((p) => (
            <article
              key={p.slug}
              data-slide
              aria-labelledby={`reel-${p.slug}`}
              className="reel-slide grid grid-cols-12 items-center gap-x-6 gap-y-6 px-gutter pb-20 lg:pb-0 lg:pt-16"
            >
              <div className="col-span-12 flex flex-col gap-5 lg:col-span-5 lg:pr-4">
                <p className="t-label text-muted" data-slide-fade>
                  N°{pad(p.index)} — {p.kind}
                </p>
                <h3 id={`reel-${p.slug}`} className="t-display text-[clamp(3rem,5.9vw,8rem)] leading-[0.86]">
                  <TransitionLink href={`/work/${p.slug}`} className="transition-colors hover:text-signal" onMouseEnter={tick}>
                    <span aria-hidden="true" data-title={p.title.toUpperCase()}>
                      {p.title}
                    </span>
                    <span className="sr-only">{p.title}</span>
                  </TransitionLink>
                </h3>
                <p className="t-serif text-[clamp(1.4rem,2.1vw,2.1rem)] leading-tight text-fg/90" data-slide-fade>
                  {p.tagline}
                </p>
                <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted" data-slide-fade>
                  {p.summary}
                </p>
                <div className="flex flex-wrap gap-1.5" data-slide-fade>
                  <Chip className={p.status === "in-development" ? "border-signal/60 text-signal-text" : ""}>
                    {statusLabel[p.status]}
                  </Chip>
                  {p.year && <Chip>{p.year}</Chip>}
                  {p.stack.slice(0, 4).map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
                <div data-slide-fade>
                  <TransitionLink
                    href={`/work/${p.slug}`}
                    morph
                    className="t-label group inline-flex items-center gap-3 text-[11px] text-fg"
                    onMouseEnter={tick}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-signal text-ink transition-transform duration-500 ease-[var(--ease-expo)] group-hover:rotate-[-45deg]">
                      <Icon name="arrow-right" size={14} />
                    </span>
                    View case study
                  </TransitionLink>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-7">
                <TransitionLink href={`/work/${p.slug}`} morph data-cursor="view" aria-label={`${p.title} — view case study`} className="block">
                  <ProjectMedia project={p} sync="live" morphKey={`/work/${p.slug}`} sizes="(min-width: 1024px) 56vw, 100vw" />
                </TransitionLink>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
