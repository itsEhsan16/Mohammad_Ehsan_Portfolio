"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { gsap, SplitText, useGSAP, motionOK } from "@/lib/motion/gsap";

const highlight = new Set(site.manifestoHighlights.map((w) => w.toLowerCase()));

/**
 * Bio as a scroll-scrubbed word-by-word reveal (DOVV-style). Words are rendered
 * server-side as plain text; on the client GSAP splits them (aria:"none" keeps
 * the paragraph readable) and scrubs each word's --lit from 0 to 1 with scroll.
 * CSS turns that into opacity, starting from the theme's --dim (app/globals.css):
 * the faintest level that still passes large-text contrast.
 */
export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const para = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!motionOK() || !para.current) return;
      const el = para.current;
      let split: SplitText | null = null;
      let cancelled = false;
      document.fonts.ready.then(() => {
        if (cancelled) return;
        split = SplitText.create(el, {
          type: "words",
          tag: "span",
          aria: "none",
          autoSplit: true,
          wordsClass: "manifesto-word",
          onSplit(self) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 },
            });
            tl.fromTo(self.words, { "--lit": 0 }, { "--lit": 1, stagger: 0.08, ease: "none", duration: 1 }, 0);
            const marks = el.querySelectorAll(".is-mark");
            if (marks.length) tl.fromTo(marks, { "--mark": 0 }, { "--mark": 1, stagger: 0.08, ease: "none", duration: 0.6 }, 0.3);
            return tl;
          },
        });
      });
      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="intro" aria-labelledby="intro-label" className="relative px-gutter py-[clamp(6rem,14vw,12rem)]">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel id="intro-label" index="01.1" title="Intro" className="lg:sticky lg:top-32" />
        </div>
        <div className="col-span-12 lg:col-span-9">
          <p
            ref={para}
            className="manifesto text-[clamp(1.65rem,3.55vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.025em] text-fg"
          >
            {site.manifesto.split(/(\s+)/).map((tok, i) =>
              highlight.has(tok.toLowerCase()) ? (
                <span key={i} className="is-mark">
                  {tok}
                </span>
              ) : (
                tok
              ),
            )}
          </p>

          <dl className="mt-[clamp(3rem,6vw,6rem)] grid grid-cols-1 gap-px overflow-hidden rounded-[6px] border border-line bg-line sm:grid-cols-3">
            {[
              { k: "Shipping since", v: String(site.since), d: "Freelance and in-house roles" },
              { k: "Selected projects", v: "05", d: "Shipped and in development" },
              { k: "Based in", v: site.location.tzLabel, d: `${site.location.country} · UTC+05:30 · remote-friendly` },
            ].map((s) => (
              <div key={s.k} className="bg-bg p-5 sm:p-6">
                <dt className="t-label text-muted">{s.k}</dt>
                <dd className="mt-3">
                  <span className="t-display block text-[clamp(3rem,6vw,5.5rem)] leading-none">{s.v}</span>
                  <span className="mt-2 block text-sm text-muted">{s.d}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
