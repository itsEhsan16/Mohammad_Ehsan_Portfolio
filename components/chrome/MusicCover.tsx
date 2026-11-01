"use client";

import { useId } from "react";
import type { Track } from "@/content/music";

/** Composition per built-in track: where the orb sits, how big, and the motif behind it. */
const LOOK: Record<string, { cx: number; cy: number; r: number; motif: "grid" | "rings" | "scan" }> = {
  blueprint: { cx: 58, cy: 62, r: 46, motif: "grid" },
  signal: { cx: 104, cy: 52, r: 40, motif: "rings" },
  render: { cx: 80, cy: 108, r: 52, motif: "scan" },
};

/**
 * Cover art. A real image when the track has one; otherwise a generated cover
 * in the site's language — a halftone orb in signal orange on ink, with a
 * blueprint grid, signal rings or scan lines behind it.
 */
export function MusicCover({ track, className }: { track: Track; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (track.cover) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={track.cover} alt="" className={className} draggable={false} />;
  }
  const L = LOOK[track.id] ?? { cx: 80, cy: 80, r: 46, motif: "grid" as const };
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <defs>
        <pattern id={`dots-${id}`} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.7" fill="#ff4d00" />
        </pattern>
        <radialGradient id={`fade-${id}`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`orb-${id}`}>
          <circle cx={L.cx} cy={L.cy} r={L.r * 1.25} fill={`url(#fade-${id})`} />
        </mask>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0" stopColor="#ff4d00" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff4d00" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="160" fill="#0b0b0a" />
      {L.motif === "grid" && (
        <g stroke="#edeae4" strokeOpacity="0.09" strokeWidth="0.6">
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${i * 20} 0V160M0 ${i * 20}H160`} />
          ))}
        </g>
      )}
      {L.motif === "rings" && (
        <g fill="none" stroke="#edeae4" strokeOpacity="0.12" strokeWidth="0.7">
          {[60, 76, 92, 108, 124].map((r) => (
            <circle key={r} cx={L.cx} cy={L.cy} r={r} />
          ))}
        </g>
      )}
      {L.motif === "scan" && (
        <g stroke="#edeae4" strokeOpacity="0.08" strokeWidth="0.6">
          {Array.from({ length: 40 }, (_, i) => (
            <path key={i} d={`M0 ${i * 4 + 1}H160`} />
          ))}
        </g>
      )}
      <circle cx={L.cx} cy={L.cy} r={L.r * 1.4} fill={`url(#glow-${id})`} />
      <circle cx={L.cx} cy={L.cy} r={L.r * 1.25} fill={`url(#dots-${id})`} mask={`url(#orb-${id})`} />
      <rect x="10" y="140" width="22" height="2.4" fill="#ff4d00" />
    </svg>
  );
}
