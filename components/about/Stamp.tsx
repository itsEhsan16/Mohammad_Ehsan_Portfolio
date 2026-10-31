"use client";

import Image from "next/image";
import { useRef } from "react";
import { site } from "@/content/site";
import { useGLPlane } from "@/lib/gl/useGLPlane";

/**
 * Portrait as a perforated postage stamp. With WebGL on, the photo renders as a
 * halftone "ink stamp" that develops to full colour around the cursor; without
 * it, a CSS duotone. Shows a typographic stamp until /public/media/portrait.jpg exists.
 */
export function Stamp({ src }: { src?: string }) {
  const media = useRef<HTMLDivElement>(null);
  useGLPlane(media, { src, title: site.name, variant: "stamp", kind: "Portrait" });

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div
        className="relative bg-bone p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,.7)]"
        style={{
          // perforated edge
          WebkitMaskImage:
            "radial-gradient(circle at 8px 8px, transparent 5px, #000 5.5px) -8px -8px / 16px 16px repeat",
          maskImage: "radial-gradient(circle at 8px 8px, transparent 5px, #000 5.5px) -8px -8px / 16px 16px repeat",
          rotate: "-3deg",
        }}
      >
        <div ref={media} data-gl-plane className="relative aspect-[4/5] overflow-hidden bg-graphite" data-cursor="view">
          <div className="gl-media absolute inset-0">
            {src ? (
              <Image src={src} alt={`Portrait of ${site.name}`} fill sizes="420px" className="object-cover grayscale contrast-125" priority />
            ) : (
              <div
                className="absolute inset-0 grid place-items-center text-bone"
                style={{
                  backgroundImage: "radial-gradient(circle, rgb(237 234 228 / .22) 1.2px, transparent 1.6px)",
                  backgroundSize: "8px 8px",
                }}
                role="img"
                aria-label="Portrait coming soon"
              >
                <span className="t-display text-[7rem] leading-none text-orange">ME</span>
              </div>
            )}
          </div>
        </div>
        <div className="t-label flex items-center justify-between px-1 pt-3 text-[10px] text-ink">
          <span>{site.name}</span>
          <span>{site.location.label}</span>
        </div>
      </div>

      {/* rotating postmark */}
      <svg
        viewBox="0 0 200 200"
        className="postmark pointer-events-none absolute -right-6 -top-8 h-36 w-36 text-signal-text"
        aria-hidden="true"
      >
        <defs>
          <path id="pm-circle" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
        </defs>
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
        <text fill="currentColor" fontFamily="var(--font-mono)" fontSize="13" letterSpacing="3">
          <textPath href="#pm-circle">INDIA · IST · SINCE {site.since} · OPEN TO WORK ·</textPath>
        </text>
        <text x="100" y="108" textAnchor="middle" fill="currentColor" fontFamily="var(--font-display)" fontSize="26" fontWeight="900">
          +5:30
        </text>
      </svg>
    </div>
  );
}
