"use client";

import { useEffect, type RefObject } from "react";
import { addPlane, removePlane, type PlaneSpec, type PlaneVariant } from "./registry";

export type { PlaneVariant };

/** Register a DOM element as a WebGL plane for as long as the component is mounted. */
export function useGLPlane(
  ref: RefObject<HTMLElement | null>,
  opts: Omit<PlaneSpec, "el">,
) {
  const { src, title, index, kind, variant, sync, morphKey } = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spec: PlaneSpec = { el, src, title, index, kind, variant, sync, morphKey };
    addPlane(spec);
    return () => removePlane(spec);
  }, [ref, src, title, index, kind, variant, sync, morphKey]);
}
