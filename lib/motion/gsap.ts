"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

let registered = false;

function register() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, ScrambleTextPlugin, useGSAP);
  // Motion tokens (mirrors --ease-* in globals.css)
  CustomEase.create("expo", "0.16,1,0.3,1");
  CustomEase.create("spring", "0.34,1.56,0.64,1");
  CustomEase.create("quint", "0.83,0,0.17,1");
  CustomEase.create("soft", "0.65,0,0.35,1");
  gsap.defaults({ ease: "expo", duration: 1 });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

register();

export const SCRAMBLE_CHARS = "01<>/\\[]{}—=+*^?#_";

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, useGSAP };

/** Motion preference as decided by the pre-paint script (OS setting or stored override). */
export const reducedMotion = () => typeof document !== "undefined" && document.documentElement.classList.contains("reduce");
export const motionOK = () => !reducedMotion();

/** Fine pointer with hover (mouse/trackpad). */
export const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: fine) and (hover: hover)").matches;

/** WebGL allowed by the pre-paint policy (desktop pointer, motion OK, not forced-colors / save-data). */
export const glAllowed = () => typeof document !== "undefined" && !document.documentElement.classList.contains("no-gl");
