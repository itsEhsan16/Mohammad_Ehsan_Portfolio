"use client";

import { useRef } from "react";
import { site } from "@/content/site";
import { gsap, SplitText, useGSAP, motionOK } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

const highlight = new Set(site.manifestoHighlights.map((w) => w.toLowerCase()));

/**
 * The bio as a scroll-scrubbed word-by-word reveal (DOVV-style), on the home
 * intro and leading /about. Words are rendered server-side as plain text; on
 * the client GSAP splits them (aria:"none" keeps the paragraph readable) and
 * scrubs each word's --lit from 0 to 1 between `start` and `end`. CSS turns that
 * into opacity, starting from the theme's --dim (app/globals.css): the faintest
 * level that still passes large-text contrast. The defaults suit /about, where
 * the paragraph sits near the top, so the first lines are lit on load.
 */
export function Manifesto({
  className = "text-[clamp(1.6rem,3vw,3rem)] leading-[1.1]",
  start = "top 95%",
  end = "bottom 40%",
}: {
  className?: string;
  start?: string;
  end?: string;
}) {
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
              scrollTrigger: { trigger: el, start, end, scrub: 0.6 },
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
    { scope: para },
  );

  return (
    <p ref={para} className={cn("manifesto font-medium tracking-[-0.025em] text-fg", className)}>
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
  );
}
