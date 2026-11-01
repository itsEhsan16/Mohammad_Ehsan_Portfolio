"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { setLenis } from "@/lib/motion/lenis";
import { setState } from "@/lib/store";
import { readTheme } from "@/lib/theme";
import { initSound } from "@/lib/audio";

/**
 * Global client runtime: one GSAP ticker drives Lenis (and later the GL engine),
 * theme/sound state is hydrated from the DOM, and global shortcuts are bound.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setState({ theme: readTheme(), sound: initSound(), macCursor: document.documentElement.classList.contains("mac-cursor") });

    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);
    const reduced = () => document.documentElement.classList.contains("reduce");

    const start = () => {
      if (reduced() || lenis) return;
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.095,
        smoothWheel: true,
        syncTouch: false,
        stopInertiaOnNavigate: true,
        prevent: (node) => node.closest?.("[data-lenis-prevent],[cmdk-list]") != null,
      });
      lenis.on("scroll", ScrollTrigger.update);
      setLenis(lenis);
      // prioritize: scroll resolves first each tick, before tweens, triggers and the GL engine
      gsap.ticker.add(tick, false, true);
    };
    const stop = () => {
      if (!lenis) return;
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenis = null;
      setLenis(null);
    };

    gsap.ticker.lagSmoothing(0);
    start();
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
    // refresh trigger positions when the document height changes (images, fonts, accordions)
    let rto = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rto);
      rto = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(document.body);

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setState({ cmdOpen: true, menuOpen: false });
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setState({ cmdOpen: true, menuOpen: false });
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      stop();
    };
  }, []);

  return <>{children}</>;
}
