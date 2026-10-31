"use client";

import { useEffect, useRef } from "react";
import { gsap, finePointer, motionOK } from "@/lib/motion/gsap";

const WORDS = ["SAY", "HELLO"];

/**
 * Giant letter-split headline. Each letter reacts to cursor proximity through
 * Archivo's variable width + weight axes (and rises in on scroll).
 */
export function SayHello() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-letter]"));
    if (!motionOK()) return;

    // entrance
    const st = gsap.from(letters, {
      yPercent: 105,
      duration: 1.2,
      ease: "expo",
      stagger: 0.04,
      scrollTrigger: { trigger: root, start: "top 85%", once: true },
    });

    if (!finePointer()) return () => st.scrollTrigger?.kill();

    const setters = letters.map((el) => ({
      el,
      w: gsap.quickTo(el, "--wdth", { duration: 0.6, ease: "power3" }),
      g: gsap.quickTo(el, "--wght", { duration: 0.6, ease: "power3" }),
    }));
    let raf = 0;
    let px = -1e4;
    let py = -1e4;
    const update = () => {
      raf = 0;
      const radius = Math.max(window.innerWidth * 0.22, 220);
      for (const s of setters) {
        const r = s.el.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / radius);
        const e = k * k * (3 - 2 * k);
        s.w(62 + e * 63); // 62% → 125%
        s.g(900 - e * 520); // 900 → 380
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const leave = () => {
      px = py = -1e4;
      if (!raf) raf = requestAnimationFrame(update);
    };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      st.scrollTrigger?.kill();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="flex select-none flex-col overflow-hidden px-gutter pb-4 pt-6">
      {WORDS.map((word, w) => (
        <div key={word} className={`flex overflow-hidden ${w === 0 ? "self-start" : "self-end"}`}>
          {word.split("").map((ch, i) => (
            <span
              key={i}
              data-letter
              className="inline-block font-display uppercase leading-[0.8] text-fg"
              style={
                {
                  "--wdth": 62,
                  "--wght": 900,
                  fontSize: "clamp(5rem, 21.5vw, 30rem)",
                  letterSpacing: "-0.04em",
                  fontVariationSettings: '"wdth" var(--wdth), "wght" var(--wght)',
                } as React.CSSProperties
              }
            >
              {ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
