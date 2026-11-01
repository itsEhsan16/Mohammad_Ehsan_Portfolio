/**
 * What the home scene shows as the figure, decided at build time by
 * `heroFigure()` in lib/media.ts. Client-safe: types and the dev overrides only.
 */
export interface HeroFigure {
  /** the GLB in /public with a content hash, or null to use the stand-in */
  src: string | null;
  /** cut-out still for phones and no-WebGL visitors (feet on the bottom edge) */
  still: { src: string; w: number; h: number } | null;
  /** extra turn (degrees) when the model doesn't face the camera */
  yaw: number;
  /** height after normalising, in metres */
  height: number;
  /** name of the animation clip to play; otherwise "idle", else the first */
  clip: string | null;
}

/**
 * Dev-only overrides (ignored in production builds):
 *   ?figure=standin             the procedural mannequin even when a GLB exists
 *   ?figure=still               export the cut-out still for phones
 *   ?figure=/media/hero/x.glb   try another GLB (e.g. one in /media/hero/_test/)
 */
export function figureOverride(): { mode: "standin" | "still" | "src"; src?: string } | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("figure");
  if (!v) return null;
  if (v === "standin" || v === "still") return { mode: v };
  if (/^\/media\/[\w./-]+\.glb$/.test(v)) return { mode: "src", src: v };
  return null;
}
