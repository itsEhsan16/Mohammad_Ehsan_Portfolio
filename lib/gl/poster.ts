"use client";

import type { PlaneSpec } from "./registry";

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Procedural "poster" used as the texture for projects without a cover image yet:
 * graphite card, blueprint grid, crosshairs, a giant condensed title and mono labels.
 * The blueprint shader then treats it exactly like a photo.
 */
export function posterCanvas(spec: PlaneSpec, width = 1600, height = 1000) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d");
  if (!x) return c;
  const display = cssVar("--font-archivo") || "Arial Narrow, Arial, sans-serif";
  const mono = cssVar("--font-geist-mono") || "monospace";

  x.fillStyle = "#161615";
  x.fillRect(0, 0, width, height);

  // grid
  x.strokeStyle = "rgba(237,234,228,0.07)";
  x.lineWidth = 1;
  for (let gx = 0; gx <= width; gx += 40) {
    x.beginPath();
    x.moveTo(gx + 0.5, 0);
    x.lineTo(gx + 0.5, height);
    x.stroke();
  }
  for (let gy = 0; gy <= height; gy += 40) {
    x.beginPath();
    x.moveTo(0, gy + 0.5);
    x.lineTo(width, gy + 0.5);
    x.stroke();
  }

  // crosshairs
  x.strokeStyle = "rgba(237,234,228,0.55)";
  x.lineWidth = 2;
  const m = 48;
  const arm = 22;
  for (const [cx, cy] of [
    [m, m],
    [width - m, m],
    [m, height - m],
    [width - m, height - m],
  ]) {
    x.beginPath();
    x.moveTo(cx - arm, cy);
    x.lineTo(cx + arm, cy);
    x.moveTo(cx, cy - arm);
    x.lineTo(cx, cy + arm);
    x.stroke();
  }

  // big circle motif
  x.strokeStyle = "rgba(255,77,0,0.55)";
  x.lineWidth = 2;
  x.beginPath();
  x.arc(width * 0.72, height * 0.42, height * 0.3, 0, Math.PI * 2);
  x.stroke();

  // title — fit to 82% width, up to two lines
  const words = spec.title.toUpperCase().split(" ");
  const lines = words.length > 1 && spec.title.length > 9 ? [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")] : [spec.title.toUpperCase()];
  x.fillStyle = "#EDEAE4";
  x.textBaseline = "alphabetic";
  let size = 400;
  const fontFor = (s: number) => `900 ${s}px ${display}`;
  const ctx = x as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
  ctx.fontStretch = "condensed";
  x.font = fontFor(size);
  const widest = Math.max(...lines.map((l) => x.measureText(l).width));
  size = Math.min(size * ((width * 0.82) / widest), (height * 0.5) / lines.length / 0.82);
  x.font = fontFor(size);
  const lh = size * 0.84;
  const blockH = lh * lines.length;
  let y = height / 2 - blockH / 2 + size * 0.74;
  for (const line of lines) {
    const w = x.measureText(line).width;
    x.fillText(line, (width - w) / 2, y);
    y += lh;
  }
  // signal bar
  x.fillStyle = "#FF4D00";
  x.fillRect(width * 0.09, y - lh + size * 0.16, width * 0.12, Math.max(6, size * 0.045));

  // labels
  x.fillStyle = "rgba(237,234,228,0.7)";
  x.font = `500 26px ${mono}`;
  const n = String(spec.index ?? 0).padStart(2, "0");
  x.fillText(`N°${n} — ${(spec.kind ?? "").toUpperCase()}`, m + 36, m + 10);
  const right = "BLUEPRINT // RENDER PENDING";
  x.fillText(right, width - m - 36 - x.measureText(right).width, height - m + 8);
  return c;
}

/**
 * Rasterize the hero name from live DOM metrics so canvas text lines up with the
 * DOM exactly: computed font, a baseline probe, and a per-line scaleX fit
 * (canvas can't express font-stretch: 78%).
 */
export function textMaskCanvas(host: HTMLElement, dpr: number) {
  const hr = host.getBoundingClientRect();
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(hr.width * dpr));
  c.height = Math.max(1, Math.round(hr.height * dpr));
  const x = c.getContext("2d") as (CanvasRenderingContext2D & { letterSpacing?: string; fontStretch?: string }) | null;
  if (!x) return c;
  x.scale(dpr, dpr);
  x.fillStyle = "#fff";
  x.textBaseline = "alphabetic";
  host.querySelectorAll<HTMLElement>("[data-fit]").forEach((span) => {
    const r = span.getBoundingClientRect();
    const cs = getComputedStyle(span);
    const raw = span.textContent ?? "";
    const text = cs.textTransform === "uppercase" ? raw.toUpperCase() : raw;
    x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ("letterSpacing" in x) x.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
    span.appendChild(probe);
    const baseline = probe.getBoundingClientRect().top;
    probe.remove();
    const w = x.measureText(text).width;
    const sx = w > 0 ? r.width / w : 1;
    x.save();
    x.translate(r.left - hr.left, baseline - hr.top);
    x.scale(sx, 1);
    x.fillText(text, 0, 0);
    x.restore();
  });
  return c;
}
