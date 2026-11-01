"use client";

/**
 * Tiny synthesized UI sound kit (no audio files). Off by default; the
 * preference is stored in localStorage. Everything is created lazily on the
 * first user gesture after the user turns sound on.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let lastTick = 0;

function ensure() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem("me:sound", on ? "1" : "0");
  } catch {}
  if (on) {
    ensure();
    chime();
  }
}

export function soundEnabled() {
  return enabled;
}

export function initSound() {
  try {
    enabled = localStorage.getItem("me:sound") === "1";
  } catch {}
  return enabled;
}

function env(c: AudioContext, gain: number, attack: number, release: number) {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  g.connect(master!);
  return g;
}

/** Short high click for hovers. */
export function tick() {
  if (!enabled) return;
  const now = performance.now();
  if (now - lastTick < 45) return;
  lastTick = now;
  const c = ensure();
  if (!c) return;
  const o = c.createOscillator();
  o.type = "square";
  o.frequency.setValueAtTime(2600, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(1400, c.currentTime + 0.03);
  o.connect(env(c, 0.05, 0.002, 0.035));
  o.start();
  o.stop(c.currentTime + 0.06);
}

/** Soft low thump for presses. */
export function click() {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(220, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.12);
  o.connect(env(c, 0.5, 0.004, 0.14));
  o.start();
  o.stop(c.currentTime + 0.2);
}

/** Filtered noise sweep for page transitions. */
export function whoosh(duration = 0.7) {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(300, c.currentTime);
  bp.frequency.exponentialRampToValueAtTime(3800, c.currentTime + duration * 0.8);
  src.connect(bp).connect(env(c, 0.35, 0.08, duration - 0.08));
  src.start();
}

/** Two-tone confirmation (copy, send). */
export function chime() {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;
  [880, 1320].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    const t = c.currentTime + i * 0.09;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    g.connect(master!);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.4);
  });
}
