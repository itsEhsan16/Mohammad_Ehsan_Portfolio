"use client";

/**
 * The viewport as an external store ("WxH"), debounced on resize, for the /work
 * views. Fixed full-screen layers size to the document element's client box
 * (no classic scrollbar), which is what this reports.
 */
export function subscribeViewport(cb: () => void) {
  let t = 0;
  const on = () => {
    window.clearTimeout(t);
    t = window.setTimeout(cb, 140);
  };
  window.addEventListener("resize", on);
  return () => {
    window.removeEventListener("resize", on);
    window.clearTimeout(t);
  };
}
export const viewportSnapshot = () => `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`;
export const serverViewportSnapshot = () => "1440x900";
