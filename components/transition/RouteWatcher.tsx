"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { notifyPathChange, isTransitioning, scrollToHash } from "@/lib/transition";
import { ScrollTrigger } from "@/lib/motion/gsap";
import { scrollTo } from "@/lib/motion/lenis";

/** Tells the transition manager when a route has committed; handles back/forward. */
export function RouteWatcher() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    notifyPathChange(pathname);
    if (first.current) {
      first.current = false;
      if (window.location.hash) {
        const hash = window.location.hash;
        window.setTimeout(() => scrollToHash(hash, true), 60);
      }
      return;
    }
    if (!isTransitioning()) {
      // browser back/forward or a plain push: just make sure measurements are fresh
      requestAnimationFrame(() => {
        if (!window.location.hash) scrollTo(0, { immediate: true });
        ScrollTrigger.refresh();
      });
    }
  }, [pathname]);

  return null;
}
