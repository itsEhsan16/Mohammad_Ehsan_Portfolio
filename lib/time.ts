"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: site.location.timeZone, hour12: false, ...opts });

const hms = fmt({ hour: "2-digit", minute: "2-digit", second: "2-digit" });
const hm = fmt({ hour: "2-digit", minute: "2-digit" });

/** Live local time in the owner's timezone. Renders a placeholder until mounted (no hydration mismatch). */
export function useLocalTime(withSeconds = true) {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const f = withSeconds ? hms : hm;
    const update = () => setNow(f.format(new Date()));
    update();
    const id = window.setInterval(update, withSeconds ? 1000 : 15000);
    return () => window.clearInterval(id);
  }, [withSeconds]);
  return now ?? (withSeconds ? "--:--:--" : "--:--");
}

/** Throttled frames-per-second meter. */
export function useFps() {
  const [fps, setFps] = useState<number | null>(null);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}
