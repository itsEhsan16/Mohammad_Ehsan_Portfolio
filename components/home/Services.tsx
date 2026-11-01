"use client";

import { useRef } from "react";
import { offerings, process, servicesIntro } from "@/content/services";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Magnetic } from "@/components/ui/Magnetic";
import { Icon } from "@/components/ui/Icon";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { gsap, useGSAP, motionOK } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

const CARD_STYLES = [
  "bg-bone text-ink",
  "bg-orange text-ink",
  "bg-graphite text-bone border border-bone/15",
  "bg-transparent text-fg border border-fg/40",
];
const TILT = [-7, 4, -3, 6];

/** Freelance services: a deck of tilted process cards that fan out on scroll, plus offerings. No prices. */
export function Services() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!motionOK()) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]");
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        // start stacked & tilted in the middle, end spread out in a row
        gsap.fromTo(
          cards,
          {
            x: (i) => (1.5 - i) * (cards[0].offsetWidth + 24) * 0.82,
            y: (i) => 40 + i * 6,
            rotate: (i) => TILT[i] * 2.2,
          },
          {
            x: 0,
            y: 0,
            rotate: (i) => TILT[i] * 0.35,
            ease: "none",
            scrollTrigger: { trigger: "[data-deck]", start: "top 85%", end: "center 55%", scrub: 0.6 },
          },
        );
      });
      mm.add("(max-width: 1023px)", () => {
        cards.forEach((card, i) =>
          gsap.from(card, {
            y: 60,
            rotate: TILT[i] * 2,
            autoAlpha: 0,
            duration: 1.1,
            ease: "spring",
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          }),
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="services" aria-labelledby="services-title" className="relative px-gutter py-[clamp(6rem,12vw,11rem)]">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel index="04" title="Services" />
          <p className="t-label mt-3 flex items-center gap-2 text-muted">
            <span className="live-dot" /> Open for freelance
          </p>
        </div>
        <div className="col-span-12 lg:col-span-9">
          <SplitReveal as="h2" type="lines" id="services-title" className="t-display text-huge">
            {servicesIntro.title} <span className="t-serif normal-case text-signal-text">{servicesIntro.accent}</span>
          </SplitReveal>
          <p className="mt-6 max-w-[56ch] text-[17px] leading-relaxed text-fg/85">{servicesIntro.body}</p>
        </div>
      </div>

      <ol data-deck className="mt-[clamp(3.5rem,7vw,6rem)] grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {process.map((step, i) => (
          <li
            key={step.step}
            data-card
            className={cn("relative flex min-h-[340px] flex-col justify-between rounded-[22px] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,.55)]", CARD_STYLES[i])}
            style={{ rotate: `${TILT[i] * 0.35}deg` }}
          >
            <div className="flex items-start justify-between">
              <span className="t-label text-[11px] font-semibold">{step.step}</span>
              {step.tag && (
                <span
                  className={cn(
                    "t-label -mr-2 -mt-2 rotate-6 rounded-full px-3 py-1.5 text-[10px] font-semibold",
                    i === 1 ? "bg-ink text-bone" : "holo text-ink",
                  )}
                >
                  {step.tag}
                </span>
              )}
            </div>
            <div>
              <h3 className="t-display text-[clamp(2.6rem,3.6vw,3.6rem)] leading-[0.86]">{step.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed opacity-85">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-[clamp(4rem,8vw,7rem)] grid grid-cols-12 gap-6">
        <p className="t-label col-span-12 text-muted lg:col-span-3">What I can build for you</p>
        <ul className="col-span-12 grid grid-cols-1 border-t border-line sm:grid-cols-2 lg:col-span-9">
          {offerings.map((o, i) => (
            <li key={o.title} className="border-b border-line py-6 sm:odd:pr-6 sm:even:border-l sm:even:pl-6">
              <p className="t-label text-signal-text">0{i + 1}</p>
              <h3 className="mt-2 text-[clamp(1.35rem,2vw,1.9rem)] font-medium leading-tight tracking-tight">{o.title}</h3>
              <p className="mt-2 text-[15px] text-muted">{o.body}</p>
            </li>
          ))}
        </ul>
        <div className="col-span-12 flex flex-wrap items-center gap-4 lg:col-span-9 lg:col-start-4">
          <Magnetic>
            <TransitionLink
              href="/#contact"
              className="t-label inline-flex items-center gap-3 rounded-full bg-signal px-6 py-4 text-[12px] font-semibold text-ink"
            >
              Start a project <Icon name="arrow-right" size={14} />
            </TransitionLink>
          </Magnetic>
          <span className="t-label text-muted">Free intro call · scope &amp; timeline before anything starts</span>
        </div>
      </div>
    </section>
  );
}
