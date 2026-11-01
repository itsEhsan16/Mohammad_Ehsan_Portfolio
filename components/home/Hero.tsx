"use client";

import { useEffect, useRef } from "react";
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
import { scrollTo } from "@/lib/motion/lenis";

/** Fit each name line to the available width (runs after fonts load and on resize). */
function useFitLines(container: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    const lines = Array.from(host.querySelectorAll<HTMLElement>("[data-fit]"));
    const fit = () => {
      const width = host.clientWidth;
      for (const line of lines) {
        const ratio = Number(line.dataset.fit || 1);
        line.style.fontSize = "100px";
        const natural = line.offsetWidth;
        if (natural > 0) line.style.fontSize = `${(100 * width * ratio) / natural}px`;
      }
      host.dispatchEvent(new CustomEvent("namefit"));
    };
    let ro: ResizeObserver | null = null;
    document.fonts.ready.then(() => {
      fit();
      ro = new ResizeObserver(fit);
      ro.observe(host);
    });
    return () => ro?.disconnect();
  }, [container]);
}

/**
 * The home hero: your name as a giant halftone you paint with the cursor. On
 * desktop WebGL a dithered ridge sits behind it, and your model stands on it
 * once public/media/hero/me.glb exists (lib/gl/scene.ts). Without WebGL,
 * `fallback` draws the same ridge as a dot screen.
 */
export function Hero({ figure, fallback }: { figure: HeroFigure; fallback: React.ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  useFitLines(name);

  // the paint trail spans the whole hero, so the cursor reaches the ground (and the figure)
  const figureRef = useRef(figure);
  useEffect(() => {
    const hero = root.current;
    setInkHost(name.current, { domain: hero });
    setSceneHost(hero ? { el: hero, figure: figureRef.current } : null);
    return () => {
      setSceneHost(null);
      setInkHost(null);
    };
  }, []);

  // The giant name is never hidden (it's the LCP candidate). The intro animates the
  // supporting UI; on desktop the WebGL layer "prints" the name in on top.
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
      id="index"
      aria-label="Introduction"
      data-cursor="drag"
      className="relative isolate flex min-h-[100svh] flex-col justify-between px-gutter pb-6 pt-[calc(var(--hud-h)+5rem)]"
    >
      <div aria-hidden="true" className="guides pointer-events-none absolute inset-0 -z-10" />
      {fallback}

      <div className="flex items-start justify-between gap-6" data-hero-fade>
        <SectionLabel index="01" title="Index" />
        <p className="t-label hidden text-right text-muted sm:block">
          Portfolio — v2.0
          <br />
          {site.role}
        </p>
      </div>

      <div className="relative my-auto py-[3vh]">
        <h1 aria-label={`${site.name} — ${site.role}`}>
          <span ref={name} data-ink-host data-cursor="paint" className="relative block">
            <span data-hero-line className="block overflow-hidden">
              <span data-fit="1" className="gl-media t-display inline-block whitespace-nowrap leading-[0.82] text-fg" style={{ fontSize: "18.6vw" }}>
                {site.firstName}
              </span>
            </span>
            <span data-hero-line className="block overflow-hidden text-right">
              <span data-fit="0.6" className="gl-media t-display inline-block whitespace-nowrap leading-[0.82] text-fg" style={{ fontSize: "20.4vw" }}>
                {site.lastName}
              </span>
            </span>
          </span>
        </h1>
        <p
          className="absolute bottom-[calc(3vh+0.6vw)] left-0 -ml-2.5 hidden max-w-[32ch] rounded-[4px] bg-bg px-2.5 py-1.5 text-[clamp(1.05rem,1.45vw,1.5rem)] leading-snug text-fg/90 md:block"
          data-hero-fade
        >
          <Rich text={site.hero.subline} />
        </p>
        <p className="-mx-2 mt-6 w-fit rounded-[4px] bg-bg px-2 py-1 text-lg leading-snug text-fg/90 md:hidden" data-hero-fade>
          <Rich text={site.hero.subline} />
        </p>
      </div>

      <div className="grid grid-cols-2 items-end gap-4 md:grid-cols-12" data-hero-fade>
        <div className="t-label col-span-1 -ml-2.5 w-fit space-y-1 rounded-[4px] bg-bg px-2.5 py-2 text-muted md:col-span-4">
          <p className="flex items-center gap-2 text-fg/85">
            <span className="live-dot" /> {site.availability.label}
          </p>
          <p>
            {site.location.label} · <LocalTime />
          </p>
        </div>
        <p className="t-label col-span-1 hidden w-fit rounded-[4px] bg-bg px-2.5 py-2 text-muted md:col-span-4 md:block">
          Move your cursor over the name
          <br />
          to render it. Drag to look around.
        </p>
        <div className="col-span-1 flex items-center justify-end gap-3 md:col-span-4">
          <Magnetic>
            <a
              href={site.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="t-label inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-[11px] text-bg"
            >
              Résumé <Icon name="arrow-up-right" size={13} />
            </a>
          </Magnetic>
          <button
            type="button"
            onClick={() => scrollTo("#intro")}
            className="t-label hidden h-11 w-11 place-items-center rounded-full border border-line bg-bg text-fg sm:grid"
            aria-label="Scroll to introduction"
          >
            <Icon name="arrow-down" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
