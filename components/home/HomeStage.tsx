"use client";

import { Fragment, useEffect, useRef } from "react";
import { site } from "@/content/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Rich } from "@/components/ui/Rich";
import { Magnetic } from "@/components/ui/Magnetic";
import { Icon } from "@/components/ui/Icon";
import { LocalTime } from "@/components/chrome/FooterBits";
import { gsap, useGSAP, motionOK } from "@/lib/motion/gsap";
import { whenVisible } from "@/lib/transition";
import { setInkHost, setSceneHost } from "@/lib/gl/registry";
import type { HeroFigure } from "@/lib/gl/figure";

/**
 * Fit each name line to the available width, then shrink the pair if it would
 * take more than `maxShare` of the stage height. Runs after fonts load and on
 * resize.
 */
function useFitLines(container: React.RefObject<HTMLElement | null>, stage: React.RefObject<HTMLElement | null>, maxShare = 0.34) {
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const lines = Array.from(host.querySelectorAll<HTMLElement>("[data-fit]"));
    const fit = () => {
      const width = host.clientWidth;
      const sizes = lines.map((line) => {
        const ratio = Number(line.dataset.fit || 1);
        line.style.fontSize = "100px";
        const natural = line.offsetWidth;
        return natural > 0 ? (100 * width * ratio) / natural : 100;
      });
      lines.forEach((line, i) => (line.style.fontSize = `${sizes[i]}px`));
      const room = (stage.current?.clientHeight || window.innerHeight) * maxShare;
      const h = host.offsetHeight;
      if (h > room) lines.forEach((line, i) => (line.style.fontSize = `${(sizes[i] * room) / h}px`));
      host.dispatchEvent(new CustomEvent("namefit"));
    };
    let ro: ResizeObserver | null = null;
    document.fonts.ready.then(() => {
      fit();
      ro = new ResizeObserver(fit);
      ro.observe(host);
      if (stage.current) ro.observe(stage.current);
    });
    return () => ro?.disconnect();
  }, [container, stage, maxShare]);
}

/** Live render readouts, filled in by the WebGL scene (`data-hud`). Decorative. */
function Readout({ figure }: { figure: HeroFigure }) {
  const rows: [string, string, string][] = [
    ["az", "Az", "—"],
    ["el", "El", "—"],
    ["dist", "Dist", "—"],
    ["tris", "Tris", "—"],
    ["fig", "Figure", figure.src ? "me.glb" : "Stand-in"],
    ["clip", "Clip", "—"],
  ];
  return (
    <dl aria-hidden="true" className="stage-readout t-label mt-5 hidden w-[12rem] grid-cols-[4.2rem_1fr] gap-y-1 text-[10px] text-muted md:grid">
      {rows.map(([k, label, v]) => (
        <Fragment key={k}>
          <dt>{label}</dt>
          <dd className="tabular-nums text-fg/85" data-hud={k}>
            {v}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

/**
 * The home page: one stage. Your name, intro and the way into every page are
 * real HTML. On desktop WebGL the scene behind them draws you standing on a
 * dithered ridge, with the name painted into the sky.
 */
export function HomeStage({ figure, fallback, index }: { figure: HeroFigure; fallback: React.ReactNode; index: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  useFitLines(name, root);

  // the paint trail spans the whole stage, so the cursor renders the figure too
  const figureRef = useRef(figure);
  useEffect(() => {
    const stage = root.current;
    setInkHost(name.current, { domain: stage });
    setSceneHost(stage ? { el: stage, figure: figureRef.current } : null);
    return () => {
      setSceneHost(null);
      setInkHost(null);
    };
  }, []);

  // The giant name is never hidden (it's the LCP candidate). The intro animates
  // the supporting UI; on desktop the WebGL layer "prints" the name in on top.
  useGSAP(
    () => {
      if (!motionOK()) return;
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-hero-fade]"), { autoAlpha: 0, y: 16 });
      return whenVisible(() => {
        gsap.to(q("[data-hero-fade]"), { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.07, ease: "expo", delay: 0.15 });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="stage"
      aria-label="Introduction"
      data-cursor="drag"
      className="relative isolate flex min-h-[100svh] flex-col px-gutter pb-5 pt-[calc(var(--hud-h)+4.25rem)]"
    >
      {fallback}

      <div className="flex items-start justify-between gap-6" data-hero-fade>
        <div>
          <SectionLabel index="01" title="Index" />
          <Readout figure={figure} />
        </div>
        <div className="max-w-[34ch] text-right">
          <p className="t-label text-muted">{site.role}</p>
          <p className="mt-3 hidden text-[clamp(1rem,1.25vw,1.3rem)] leading-snug text-fg/90 sm:block">
            <Rich text={site.hero.subline} />
          </p>
        </div>
      </div>

      <div className="relative mt-[2.5vh]">
        <h1 aria-label={`${site.name} — ${site.role}`}>
          <span ref={name} data-ink-host data-cursor="paint" className="relative block">
            <span className="block overflow-hidden">
              <span data-fit="1" className="gl-media t-display inline-block whitespace-nowrap leading-[0.82] text-fg" style={{ fontSize: "18.6vw" }}>
                {site.firstName}
              </span>
            </span>
            <span className="block overflow-hidden text-right">
              <span data-fit="0.6" className="gl-media t-display inline-block whitespace-nowrap leading-[0.82] text-fg" style={{ fontSize: "20.4vw" }}>
                {site.lastName}
              </span>
            </span>
          </span>
        </h1>
        <p className="mt-6 text-lg leading-snug text-fg/90 sm:hidden" data-hero-fade>
          <Rich text={site.hero.subline} />
        </p>
      </div>

      <div className="mt-auto grid grid-cols-1 items-end gap-4 pt-8 md:grid-cols-12" data-hero-fade>
        <div className="flex flex-wrap items-center gap-2 md:col-span-6 lg:col-span-5">
          <p className="t-label inline-flex items-center gap-2 rounded-full bg-fg px-3.5 py-2 text-[10px] text-bg">
            <span className="live-dot" /> {site.availability.label}
          </p>
          <p className="t-label rounded-full bg-fg px-3.5 py-2 text-[10px] text-bg">
            {site.location.label} · <LocalTime />
          </p>
          <Magnetic>
            <a
              href={site.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="t-label inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-[10px] font-semibold text-ink"
            >
              Résumé <Icon name="arrow-up-right" size={12} />
            </a>
          </Magnetic>
          <p className="stage-hint t-label hidden w-full pt-1 text-[10px] text-muted md:block">
            Drag to look around · move over the name or the figure to render it
          </p>
        </div>
        <div className="md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-9">{index}</div>
      </div>
    </section>
  );
}
