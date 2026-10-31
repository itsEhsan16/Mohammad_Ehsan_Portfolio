"use client";

import { useEffect, useRef } from "react";
import { glAllowed } from "@/lib/motion/gsap";
import { setEngine } from "@/lib/gl/registry";
import { setState } from "@/lib/store";
import type { Engine } from "@/lib/gl/engine";

/**
 * The single WebGL canvas, fixed behind the DOM. The engine chunk is loaded
 * lazily and only when the pre-paint policy allows GL (desktop pointer, motion
 * OK, WebGL2 with hardware acceleration — or ?gl=force for testing).
 */
export function GLCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!glAllowed()) return;
    const force = new URLSearchParams(window.location.search).get("gl") === "force";
    let engine: Engine | null = null;
    let cancelled = false;

    const start = async () => {
      const mod = await import("@/lib/gl/engine");
      if (cancelled || !ref.current) return;
      engine = mod.createEngine(ref.current, force);
      if (!engine) {
        document.documentElement.classList.add("no-gl");
        return;
      }
      setEngine(engine);
      setState({ gl: true });
    };

    const first = document.documentElement.dataset.boot === "run";
    let idle = 0;
    let timer = 0;
    if (first) void start();
    else if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(() => void start(), { timeout: 1200 });
    else timer = window.setTimeout(() => void start(), 300);

    const restart = () => {
      engine?.destroy(false);
      engine = null;
      setEngine(null);
      void start();
    };
    window.addEventListener("gl:restart", restart);

    return () => {
      cancelled = true;
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      window.removeEventListener("gl:restart", restart);
      engine?.destroy();
      setEngine(null);
      setState({ gl: false });
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 block h-screen w-screen" />;
}
