"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion/gsap";
import { registerWipe, relayoutWipe, wipeCover, wipeReveal } from "@/lib/wipe";
import { setTransitionHooks } from "@/lib/transition";
import { getEngine } from "@/lib/gl/registry";

/**
 * Registers the page-transition hooks:
 *  - morph: when the clicked element has a WebGL plane, it detaches, grows to
 *    fill the screen while the page fades, then lands in the next page's hero;
 *  - wipe: an ordered-dither block wipe in signal orange with a "compiling" label.
 */
export function TransitionLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const label = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerWipe(canvas.current, label.current);
    const onResize = () => relayoutWipe();
    window.addEventListener("resize", onResize);

    setTransitionHooks({
      async cover(opts) {
        const engine = getEngine();
        const main = document.getElementById("main");
        if (opts.morphFrom && engine && engine.morphCapture(opts.morphFrom)) {
          // keep the incoming page hidden until the plane lands (CSS: html[data-morphing] #main)
          document.documentElement.dataset.morphing = "1";
          await Promise.all([
            engine.morphExpand(0.95),
            main ? gsap.to(main, { autoAlpha: 0, duration: 0.45, ease: "power2.out" }) : null,
          ]);
          return "morph";
        }
        await wipeCover(`COMPILING ${opts.label ?? ""}`);
        return "wipe";
      },
      async reveal(opts) {
        const engine = getEngine();
        if (opts.kind === "morph" && engine?.hasFloater()) {
          const main = document.getElementById("main");
          if (main) gsap.fromTo(main, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, ease: "power2.out", delay: 0.25 });
          delete document.documentElement.dataset.morphing;
          await engine.morphLand(opts.label ?? "", 1.05);
          return;
        }
        delete document.documentElement.dataset.morphing;
        await wipeReveal();
      },
    });

    return () => {
      window.removeEventListener("resize", onResize);
      setTransitionHooks(null);
      registerWipe(null, null);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70]">
      <canvas ref={canvas} className="invisible absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} />
      <div ref={label} className="invisible absolute inset-0 grid place-items-center opacity-0">
        <p className="t-label flex items-center gap-2 text-[12px] font-semibold text-ink">
          <span className="inline-block h-3 w-1.5 bg-ink motion-safe:animate-pulse" />
          <span data-wipe-path />
        </p>
      </div>
    </div>
  );
}
