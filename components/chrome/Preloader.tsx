"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { gsap, SCRAMBLE_CHARS } from "@/lib/motion/gsap";
import { getState, setState, subscribe } from "@/lib/store";
import { wipeReveal, wipeSet } from "@/lib/wipe";

const LOG = [
  "> next build --render",
  "✓ fonts — Archivo · Geist · Instrument Serif",
  `✓ compiled ${projects.length} case studies`,
  "✓ shaders linked — ink · halftone · blueprint",
  `✓ timezone — ${site.location.timeZone}`,
  "→ ready to render",
];

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function waitForGL(timeout: number) {
  if (document.documentElement.classList.contains("no-gl")) return Promise.resolve();
  return new Promise<void>((resolve) => {
    if (getState().gl) return resolve();
    const unsub = subscribe(() => {
      if (getState().gl) {
        unsub();
        resolve();
      }
    });
    window.setTimeout(() => {
      unsub();
      resolve();
    }, timeout);
  });
}

/**
 * Boot sequence: a mono build log and a giant counter. Shown only when the
 * pre-paint script set data-boot="run" (first visit this session, not a bot);
 * hidden by default so no-JS visitors never see it. Exits through the dither wipe.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = document.documentElement;
    const mode = d.dataset.boot;
    const el = root.current;
    if (!el || (mode !== "run" && mode !== "fade")) {
      setState({ ready: true });
      return;
    }
    try {
      sessionStorage.setItem("me:booted", "1");
    } catch {}
    let finished = false;

    const finish = async () => {
      if (finished) return;
      finished = true;
      wipeSet();
      el.style.display = "none";
      d.dataset.boot = "done";
      setState({ ready: true });
      await wipeReveal(0.9);
    };

    if (mode === "fade") {
      gsap.to(el, {
        autoAlpha: 0,
        duration: 0.35,
        onComplete: () => {
          el.style.display = "none";
          d.dataset.boot = "done";
          setState({ ready: true });
        },
      });
      return;
    }

    const counter = el.querySelector<HTMLElement>("[data-count]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const lines = el.querySelectorAll<HTMLElement>("[data-log]");
    const n = { v: 0 };
    const render = () => {
      counter.textContent = String(Math.round(n.v)).padStart(3, "0");
      bar.style.transform = `scaleX(${n.v / 100})`;
    };
    const start = performance.now();

    gsap.fromTo(lines, { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, stagger: 0.17, duration: 0.3, ease: "power2.out" });
    gsap.to(n, { v: 84, duration: 1.15, ease: "power2.out", onUpdate: render });

    const ready = Promise.race([Promise.all([document.fonts.ready, waitForGL(1500)]), wait(2200)]);
    void ready.then(async () => {
      const elapsed = performance.now() - start;
      if (elapsed < 1250) await wait(1250 - elapsed);
      if (finished) return;
      await new Promise<void>((r) => gsap.to(n, { v: 100, duration: 0.3, ease: "power1.out", onUpdate: render, onComplete: r }));
      await new Promise<void>((r) =>
        gsap.to(counter, { duration: 0.45, scrambleText: { text: "RUN", chars: SCRAMBLE_CHARS, speed: 1 }, onComplete: r }),
      );
      await finish();
    });

    const skip = () => void finish();
    window.addEventListener("keydown", skip, { once: true });
    el.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("keydown", skip);
      el.removeEventListener("pointerdown", skip);
    };
  }, []);

  return (
    <div
      ref={root}
      className="preloader fixed inset-0 z-[100] flex-col justify-between bg-bg px-gutter pb-6 pt-5 text-fg"
      aria-hidden="true"
      data-nosnippet
    >
      <div className="t-label flex items-center justify-between text-muted">
        <span className="text-fg">{site.handle}</span>
        <span>Portfolio — v2.0 · press any key to skip</span>
      </div>
      <div className="flex flex-col-reverse items-start justify-between gap-10 md:flex-row md:items-end">
        <ol className="t-label space-y-1.5 text-[11px] text-muted">
          {LOG.map((l) => (
            <li key={l} data-log className={l.startsWith("→") ? "text-signal-text" : l.startsWith(">") ? "text-fg" : ""}>
              {l}
            </li>
          ))}
        </ol>
        <div className="w-full md:w-auto">
          <p data-count className="t-display text-right text-[clamp(7rem,26vw,30rem)] leading-[0.78] tabular-nums">
            000
          </p>
        </div>
      </div>
      <span className="absolute inset-x-0 bottom-0 block h-[3px] overflow-hidden bg-line">
        <span data-bar className="block h-full origin-left scale-x-0 bg-signal" />
      </span>
    </div>
  );
}
