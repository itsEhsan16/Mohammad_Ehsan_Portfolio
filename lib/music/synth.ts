"use client";

/**
 * Three short original pieces, played live with Web Audio — no audio files.
 *
 * Each piece is a 16th-note step sequence with a fixed arrangement, so it has a
 * real length and can start from any point (seek). A look-ahead scheduler puts
 * notes on the audio clock a little before they are due, so timing never
 * drifts with the main thread.
 */

export type PieceId = "blueprint" | "signal" | "render";

type Inst = "pad" | "bass" | "keys" | "pluck" | "bell" | "kick" | "hat" | "rim";
interface Ev {
  i: Inst;
  /** MIDI notes */
  n?: number[];
  /** length in steps */
  d?: number;
  /** level 0..1 */
  v?: number;
  /** filter brightness (Hz) for plucks/pads */
  c?: number;
}
interface Piece {
  bpm: number;
  bars: number;
  /** delay of every odd 8th, as a share of a 16th (0 = straight) */
  swing: number;
  reverb: number;
  delay: number;
  /** delay time in steps */
  delaySteps: number;
  events(step: number): Ev[];
}

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
/** stable pseudo-random number per step and salt */
const rnd = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/* ───────────── pieces ───────────── */

// Blueprint — slow pads in D minor, a soft sub, sparse pentatonic bells
const BLUEPRINT_CHORDS = [
  [50, 53, 57, 60, 64], // Dm9
  [46, 50, 53, 57, 64], // Bbmaj7(#11)
  [41, 57, 60, 64, 67], // Fmaj9
  [48, 52, 55, 57, 62], // C6/9
];
const D_PENTA = [74, 77, 79, 81, 84, 86, 89];
const blueprint: Piece = {
  bpm: 72,
  bars: 44,
  swing: 0,
  reverb: 0.55,
  delay: 0.28,
  delaySteps: 6,
  events(s) {
    const bar = Math.floor(s / 16);
    const out: Ev[] = [];
    const chord = BLUEPRINT_CHORDS[Math.floor(bar / 2) % 4];
    const intro = bar < 8;
    const outro = bar >= 40;
    const breakdown = bar >= 24 && bar < 32;
    if (s % 32 === 0) {
      out.push({ i: "pad", n: chord, d: 34, v: intro || outro ? 0.7 : 1, c: breakdown ? 900 : 1500 });
      if (!intro && !outro && !breakdown) out.push({ i: "bass", n: [chord[0] - 12], d: 30, v: 0.9 });
    }
    if (!intro && !outro && s % 2 === 0 && rnd(s, 1) < (breakdown ? 0.22 : 0.14)) {
      out.push({ i: "bell", n: [D_PENTA[Math.floor(rnd(s, 2) * D_PENTA.length)]], v: 0.5 + rnd(s, 3) * 0.5 });
    }
    return out;
  },
};

// Signal — a soft lo-fi pulse in A minor: keys, bass, swung kit
const SIGNAL_CHORDS = [
  [57, 60, 64, 67, 71], // Am9
  [53, 57, 60, 64], // Fmaj7
  [48, 55, 59, 64], // Cmaj7
  [55, 59, 62, 64], // G6
];
const A_PENTA = [69, 72, 74, 76, 79, 81];
const signal: Piece = {
  bpm: 84,
  bars: 44,
  swing: 0.28,
  reverb: 0.32,
  delay: 0.2,
  delaySteps: 3,
  events(s) {
    const bar = Math.floor(s / 16);
    const st = s % 16;
    const chord = SIGNAL_CHORDS[bar % 4];
    const intro = bar < 4;
    const brk = bar >= 20 && bar < 24;
    const outro = bar >= 40;
    const out: Ev[] = [];
    // keys: a stab on 1 and a lift on the "and" of 2 and 4
    if (st === 0) out.push({ i: "keys", n: chord, d: 7, v: 0.8 });
    if (st === 6 || st === 14) out.push({ i: "keys", n: chord.slice(1), d: 3, v: 0.45 });
    if (st === 0 && (brk || outro)) out.push({ i: "pad", n: chord, d: 18, v: 0.6, c: 1100 });
    if (!intro && !brk && !outro) {
      if (st === 0) out.push({ i: "bass", n: [chord[0] - 12], d: 5, v: 1 });
      if (st === 10) out.push({ i: "bass", n: [chord[0] - 5], d: 3, v: 0.8 });
      if (st === 0 || st === 10) out.push({ i: "kick", v: st === 0 ? 1 : 0.75 });
      if (st === 4 || st === 12) out.push({ i: "rim", v: 0.8 });
    }
    if (!brk && !outro && st % 2 === 0) out.push({ i: "hat", v: st % 4 === 0 ? 0.7 : 0.45 });
    // a small melody in the second half
    if (bar >= 24 && bar < 40 && st % 2 === 0 && rnd(s, 7) < 0.18) {
      out.push({ i: "bell", n: [A_PENTA[Math.floor(rnd(s, 8) * A_PENTA.length)]], v: 0.55 });
    }
    return out;
  },
};

// Render — a minimal E-minor pentatonic arpeggio with a slow filter sweep
const RENDER_ROOTS = [52, 48, 55, 50]; // E, C, G, D
const RENDER_ARP = [0, 3, 7, 10, 12, 10, 7, 3]; // over each root (minor-pentatonic-ish shape)
const render: Piece = {
  bpm: 108,
  bars: 64,
  swing: 0,
  reverb: 0.3,
  delay: 0.3,
  delaySteps: 3,
  events(s) {
    const bar = Math.floor(s / 16);
    const st = s % 16;
    const root = RENDER_ROOTS[Math.floor(bar / 2) % 4];
    const out: Ev[] = [];
    const sweep = 0.5 - 0.5 * Math.cos((bar / 64) * Math.PI * 2); // 0 → 1 → 0 across the piece
    const full = bar >= 16 && bar < 48;
    // arpeggio on every 16th
    const deg = RENDER_ARP[st % RENDER_ARP.length] + (st >= 8 ? 12 : 0);
    out.push({ i: "pluck", n: [root + 12 + deg], d: 2, v: 0.55 + (st % 4 === 0 ? 0.25 : 0), c: 700 + sweep * 2600 });
    if (s % 32 === 0) out.push({ i: "pad", n: [root, root + 7, root + 12, root + 15], d: 34, v: 0.55, c: 800 + sweep * 900 });
    if (bar >= 8 && bar < 56 && st % 2 === 0) out.push({ i: "bass", n: [root - 12 + (st % 4 === 2 ? 12 : 0)], d: 1, v: 0.75 });
    if (full) {
      if (st % 4 === 0) out.push({ i: "kick", v: 0.85 });
      if (st % 4 === 2) out.push({ i: "hat", v: 0.6 });
    }
    return out;
  },
};

const PIECES: Record<PieceId, Piece> = { blueprint, signal, render };

export function pieceDuration(id: PieceId) {
  const p = PIECES[id];
  return (p.bars * 16 * 60) / p.bpm / 4;
}

/* ───────────── instruments ───────────── */

let noise: AudioBuffer | null = null;
function noiseBuffer(ctx: BaseAudioContext) {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}

function env(ctx: BaseAudioContext, dest: AudioNode, t: number, peak: number, a: number, hold: number, r: number) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
  g.connect(dest);
  return { g, end: t + a + hold + r + 0.05 };
}

function play(ctx: BaseAudioContext, dest: AudioNode, ev: Ev, t: number, stepDur: number) {
  const v = ev.v ?? 1;
  const dur = (ev.d ?? 1) * stepDur;
  switch (ev.i) {
    case "pad": {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.Q.value = 0.4;
      const c = ev.c ?? 1400;
      f.frequency.setValueAtTime(c * 0.45, t);
      f.frequency.linearRampToValueAtTime(c, t + Math.min(2.5, dur * 0.4));
      const { g, end } = env(ctx, dest, t, 0.05 * v, 1.6, Math.max(0, dur - 1.6), 2.6);
      f.connect(g);
      for (const m of ev.n ?? []) {
        for (const det of [-7, 7]) {
          const o = ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = midi(m);
          o.detune.value = det;
          o.connect(f);
          o.start(t);
          o.stop(end);
        }
      }
      break;
    }
    case "bass": {
      const m = (ev.n ?? [36])[0];
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 420;
      const { g, end } = env(ctx, dest, t, 0.22 * v, 0.012, Math.max(0.05, dur - 0.2), 0.25);
      f.connect(g);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = midi(m);
      o.connect(f);
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = midi(m);
      const g2 = ctx.createGain();
      g2.gain.value = 0.35;
      o2.connect(g2).connect(f);
      o.start(t);
      o2.start(t);
      o.stop(end);
      o2.stop(end);
      break;
    }
    case "keys": {
      // electric-piano-ish: a sine with a quick bell partial, soft tremolo
      const { g, end } = env(ctx, dest, t, 0.045 * v, 0.008, 0.05, Math.max(0.6, dur * 1.4));
      for (const m of ev.n ?? []) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = midi(m);
        o.connect(g);
        const b = ctx.createOscillator();
        b.type = "sine";
        b.frequency.value = midi(m) * 4;
        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0.18, t);
        bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        b.connect(bg).connect(g);
        o.start(t);
        b.start(t);
        o.stop(end);
        b.stop(t + 0.3);
      }
      break;
    }
    case "pluck": {
      const m = (ev.n ?? [64])[0];
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.Q.value = 2;
      const c = ev.c ?? 2400;
      f.frequency.setValueAtTime(c, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(200, c * 0.18), t + 0.28);
      const { g, end } = env(ctx, dest, t, 0.05 * v, 0.004, 0.02, 0.45);
      f.connect(g);
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = midi(m);
      o.connect(f);
      const o2 = ctx.createOscillator();
      o2.type = "square";
      o2.frequency.value = midi(m);
      const g2 = ctx.createGain();
      g2.gain.value = 0.25;
      o2.connect(g2).connect(f);
      o.start(t);
      o2.start(t);
      o.stop(end);
      o2.stop(end);
      break;
    }
    case "bell": {
      const m = (ev.n ?? [76])[0];
      const base = midi(m);
      [
        [1, 0.05, 2.6],
        [2.76, 0.016, 1.1],
        [5.4, 0.006, 0.6],
      ].forEach(([ratio, peak, decay]) => {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = base * ratio;
        const { g, end } = env(ctx, dest, t, peak * v, 0.004, 0, decay);
        o.connect(g);
        o.start(t);
        o.stop(end);
      });
      break;
    }
    case "kick": {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const { g, end } = env(ctx, dest, t, 0.55 * v, 0.003, 0.02, 0.32);
      o.connect(g);
      o.start(t);
      o.stop(end);
      break;
    }
    case "hat": {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7500;
      const { g, end } = env(ctx, dest, t, 0.05 * v, 0.002, 0.005, 0.045);
      src.connect(hp).connect(g);
      src.start(t, Math.random() * 0.5);
      src.stop(end);
      break;
    }
    case "rim": {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1900;
      bp.Q.value = 1.2;
      const { g, end } = env(ctx, dest, t, 0.09 * v, 0.002, 0.01, 0.11);
      src.connect(bp).connect(g);
      src.start(t, Math.random() * 0.5);
      src.stop(end);
      break;
    }
  }
}

/** A short generated room reverb. */
function impulse(ctx: BaseAudioContext, seconds = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

/* ───────────── playback ───────────── */

/**
 * One run of a piece from an offset. Owns its own bus (dry + reverb + tape-ish
 * delay), so stopping fades the bus out and cuts every note already scheduled.
 */
export class SynthPlayback {
  readonly duration: number;
  private piece: Piece;
  private bus: GainNode;
  private stepDur: number;
  private startTime = 0;
  private offset = 0;
  private nextStep = 0;
  private timer = 0;
  private stopped = false;
  private endTimer = 0;
  private fx: AudioNode[] = [];

  constructor(
    private ctx: AudioContext,
    out: AudioNode,
    id: PieceId,
    private onEnded: () => void,
  ) {
    this.piece = PIECES[id];
    this.stepDur = 60 / this.piece.bpm / 4;
    this.duration = this.piece.bars * 16 * this.stepDur;

    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    const dry = ctx.createGain();
    dry.gain.value = 0.9;
    const verb = ctx.createConvolver();
    verb.buffer = impulse(ctx);
    const verbSend = ctx.createGain();
    verbSend.gain.value = this.piece.reverb;
    const delay = ctx.createDelay(2);
    delay.delayTime.value = this.piece.delaySteps * this.stepDur;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 2400;
    const delaySend = ctx.createGain();
    delaySend.gain.value = this.piece.delay;
    this.bus.connect(dry).connect(out);
    this.bus.connect(verbSend).connect(verb).connect(out);
    this.bus.connect(delaySend).connect(delay).connect(tone).connect(out);
    tone.connect(fb).connect(delay);
    this.fx = [dry, verbSend, verb, delaySend, delay, tone, fb];
  }

  /** Start playing from `offset` seconds into the piece. */
  start(offset: number) {
    const ctx = this.ctx;
    this.offset = Math.max(0, Math.min(offset, this.duration - 0.01));
    this.startTime = ctx.currentTime + 0.06;
    const first = Math.ceil(this.offset / this.stepDur - 1e-6);
    this.nextStep = first;
    // long notes (pads, held bass) that began before the offset and are still sounding
    for (let s = Math.max(0, first - 40); s < first; s++) {
      for (const ev of this.piece.events(s)) {
        if ((ev.i === "pad" || ev.i === "bass") && s + (ev.d ?? 1) > first + 1) {
          play(ctx, this.bus, { ...ev, d: s + (ev.d ?? 1) - first }, this.startTime, this.stepDur);
        }
      }
    }
    const loop = () => {
      if (this.stopped) return;
      const ahead = document.hidden ? 1.6 : 0.14;
      const total = this.piece.bars * 16;
      while (this.nextStep < total) {
        const s = this.nextStep;
        let at = this.startTime + s * this.stepDur - this.offset;
        if (s % 4 === 2) at += this.piece.swing * this.stepDur;
        if (at > ctx.currentTime + ahead) break;
        if (at >= ctx.currentTime - 0.02) for (const ev of this.piece.events(s)) play(ctx, this.bus, ev, at, this.stepDur);
        this.nextStep++;
      }
    };
    loop();
    this.timer = window.setInterval(loop, 25);
    const remaining = this.duration - this.offset;
    this.endTimer = window.setTimeout(() => {
      if (!this.stopped) this.onEnded();
    }, remaining * 1000 + 120);
  }

  /** Seconds into the piece. */
  get position() {
    return Math.max(0, Math.min(this.duration, this.offset + (this.ctx.currentTime - this.startTime)));
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    window.clearInterval(this.timer);
    window.clearTimeout(this.endTimer);
    const t = this.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(this.bus.gain.value, t);
    this.bus.gain.linearRampToValueAtTime(0, t + 0.08);
    window.setTimeout(() => this.bus.disconnect(), 200);
    // let the reverb and delay tails ring out, then let the whole graph go
    window.setTimeout(() => this.fx.forEach((n) => n.disconnect()), 3200);
  }
}
