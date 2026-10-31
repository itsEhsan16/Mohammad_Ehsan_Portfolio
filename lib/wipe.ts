"use client";

import { gsap } from "./motion/gsap";

/**
 * Ordered-dither block wipe on a plain 2D canvas (works with or without WebGL).
 * Each block has a threshold = 0.55·bayer + 0.3·x + 0.15·noise; progress is
 * quantised into steps for a "compiling" stutter.
 */
let canvas: HTMLCanvasElement | null = null;
let label: HTMLElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let thresholds: Float32Array = new Float32Array(0);
let cols = 0;
let rows = 0;
const CELL = 24;
const STEPS = 16;

const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35,
  11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

function rand(i: number, j: number) {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function layout() {
  if (!canvas) return;
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  cols = Math.ceil(W / CELL);
  rows = Math.ceil(H / CELL);
  thresholds = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const b = BAYER8[(j % 8) * 8 + (i % 8)] / 64;
      thresholds[j * cols + i] = 0.55 * b + 0.3 * (i / Math.max(1, cols - 1)) + 0.15 * rand(i, j);
    }
  }
}

function color() {
  return getComputedStyle(document.documentElement).getPropertyValue("--signal").trim() || "#ff4d00";
}

/** mode "cover": blocks with threshold ≤ p are filled. mode "reveal": blocks with threshold > p stay. */
function draw(p: number, mode: "cover" | "reveal") {
  if (!ctx || !canvas) return;
  const q = Math.round(p * STEPS) / STEPS;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color();
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t = thresholds[j * cols + i];
      const on = mode === "cover" ? t <= q * 1.001 : t > q;
      if (on) ctx.fillRect(i * CELL, j * CELL, CELL, CELL);
    }
  }
}

export function registerWipe(c: HTMLCanvasElement | null, l: HTMLElement | null) {
  canvas = c;
  label = l;
  ctx = c?.getContext("2d") ?? null;
  if (c) layout();
}

export function relayoutWipe() {
  layout();
}

function setLabel(text: string | null) {
  if (!label) return;
  if (text == null) {
    gsap.to(label, { autoAlpha: 0, duration: 0.2 });
    return;
  }
  label.querySelector("[data-wipe-path]")!.textContent = text;
  gsap.to(label, { autoAlpha: 1, duration: 0.2 });
}

export function wipeCover(text?: string, duration = 0.75) {
  return new Promise<void>((resolve) => {
    if (!canvas) return resolve();
    canvas.style.visibility = "visible";
    const s = { p: 0 };
    gsap.to(s, {
      p: 1.02,
      duration,
      ease: "power2.in",
      onUpdate: () => draw(s.p, "cover"),
      onComplete: () => {
        draw(1.1, "cover");
        if (text) setLabel(text);
        resolve();
      },
    });
  });
}

/** Instantly cover (e.g. the preloader exit or browser back/forward). */
export function wipeSet() {
  if (!canvas) return;
  canvas.style.visibility = "visible";
  draw(1.1, "cover");
}

export function wipeReveal(duration = 0.85) {
  return new Promise<void>((resolve) => {
    if (!canvas) return resolve();
    setLabel(null);
    const s = { p: 0 };
    gsap.to(s, {
      p: 1.02,
      duration,
      ease: "power2.out",
      onUpdate: () => draw(s.p, "reveal"),
      onComplete: () => {
        ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
        canvas!.style.visibility = "hidden";
        resolve();
      },
    });
  });
}
