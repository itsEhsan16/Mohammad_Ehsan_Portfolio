import Image from "next/image";
import { stageSkyline } from "@/lib/gl/terrain";
import type { HeroFigure } from "@/lib/gl/figure";

/**
 * The skyline from the live scene's camera, as a mask and an outline (built at
 * render time on the server). `fitTop` remaps it into its own box, so the
 * peaks start at that share of the box height.
 */
function ridge(aspect: number, fitTop?: number) {
  let sky = stageSkyline(96, aspect);
  if (fitTop !== undefined) {
    const lo = Math.min(...sky);
    sky = sky.map((y) => fitTop + ((y - lo) / (1 - lo)) * (1 - fitTop));
  }
  const pts = sky.map((y, i) => `${((i / (sky.length - 1)) * 1000).toFixed(1)},${(y * 1000).toFixed(1)}`);
  const top = (Math.min(...sky) * 1000).toFixed(0);
  // denser toward the viewer, like the dither in the live scene
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000' preserveAspectRatio='none'>` +
    `<defs><linearGradient id='g' gradientUnits='userSpaceOnUse' x1='0' y1='${top}' x2='0' y2='1000'>` +
    `<stop offset='0' stop-opacity='.3'/><stop offset='.55' stop-opacity='.5'/><stop offset='.8' stop-opacity='.85'/><stop offset='1'/>` +
    `</linearGradient></defs><path d='M0,1000 L${pts.join(" L")} L1000,1000 Z' fill='url(#g)'/></svg>`;
  return { mask: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, line: `M${pts.join(" L")}` };
}

function Ground({ aspect, fitTop, className }: { aspect: number; fitTop?: number; className: string }) {
  const { mask, line } = ridge(aspect, fitTop);
  return (
    <div className={className}>
      <div className="stage-dots absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }} />
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={line} fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/**
 * What the home stage shows without WebGL: phones, tablets, reduced motion,
 * and desktops until the scene's first frame. It has the same skyline as a
 * dot screen, and your cut-out still once it exists. Wide screens get the
 * scene's own framing; tall ones a narrower slice kept to the lower part of the
 * screen, clear of the text. The scene fades it out (`data-gl-on`) when it
 * takes over.
 */
export function StageFallback({ still }: { still: HeroFigure["still"] }) {
  return (
    <div aria-hidden="true" data-stage-fallback className="gl-media pointer-events-none absolute inset-0 -z-[1] text-fg">
      <Ground aspect={1.6} className="absolute inset-0 hidden md:block" />
      <Ground aspect={0.75} fitTop={0.12} className="absolute inset-x-0 bottom-0 h-[42%] md:hidden" />
      {still && (
        <Image
          src={still.src}
          width={still.w}
          height={still.h}
          alt=""
          priority
          sizes="40vh"
          className="absolute bottom-[24%] left-1/2 h-[40%] w-auto max-w-none -translate-x-1/2 md:bottom-[15%] md:h-[60%]"
        />
      )}
    </div>
  );
}
