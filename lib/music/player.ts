"use client";

import { playlist, type Track } from "@/content/music";
import { SynthPlayback, pieceDuration } from "./synth";

export interface MusicState {
  index: number;
  playing: boolean;
  /** true once anything has played (the audio context exists) */
  started: boolean;
}

const SERVER_STATE: MusicState = { index: 0, playing: false, started: false };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * One player for the whole site (it lives above the page transitions, so the
 * music keeps going between pages). Built-in tracks are scheduled Web Audio;
 * file tracks play through an <audio> element routed into the same graph, so
 * both feed the analyser behind the waveform. The audio context is only created
 * on the first play — browsers require a click or key press for that.
 */
class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private bins: Uint8Array<ArrayBuffer> | null = null;
  private synth: SynthPlayback | null = null;
  private audio: HTMLAudioElement | null = null;
  /** position to resume from, in seconds */
  private offset = 0;
  private state: MusicState = SERVER_STATE;
  private listeners = new Set<() => void>();

  readonly tracks: Track[] = playlist;

  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getState = () => this.state;
  getServerState = () => SERVER_STATE;

  get track() {
    return this.tracks[this.state.index];
  }

  get duration() {
    const t = this.track;
    if (t.synth) return pieceDuration(t.synth);
    const d = this.audio?.duration;
    return d && Number.isFinite(d) ? d : 0;
  }

  get position() {
    if (this.synth) return this.synth.position;
    if (this.track.src && this.audio && this.state.playing) return this.audio.currentTime;
    return this.offset;
  }

  play() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = this.track;
    this.stopSources();
    if (t.synth) {
      const run = new SynthPlayback(ctx, this.master, t.synth, () => this.next(true));
      run.start(this.offset);
      this.synth = run;
    } else if (t.src) {
      const a = this.fileElement(ctx);
      if (a.getAttribute("src") !== t.src) a.src = t.src;
      a.currentTime = this.offset;
      void a.play().catch(() => this.set({ playing: false }));
    }
    this.set({ playing: true, started: true });
    this.mediaSession();
  }

  pause() {
    if (!this.state.playing) return;
    this.offset = this.position;
    this.stopSources();
    this.set({ playing: false });
    this.mediaSession();
  }

  toggle() {
    if (this.state.playing) this.pause();
    else this.play();
  }

  seek(seconds: number) {
    this.offset = clamp(seconds, 0, Math.max(0, this.duration - 0.1));
    if (this.state.playing) this.play();
    else this.set({});
  }

  next(auto = false) {
    const resume = this.state.playing || auto;
    this.select((this.state.index + 1) % this.tracks.length, resume);
  }

  /** Back to the start of the track, or to the previous one when already near the start. */
  prev() {
    if (this.position > 3) {
      this.seek(0);
      return;
    }
    this.select((this.state.index - 1 + this.tracks.length) % this.tracks.length, this.state.playing);
  }

  select(index: number, play: boolean) {
    this.stopSources();
    this.offset = 0;
    this.set({ index, playing: false });
    if (play) this.play();
    else this.mediaSession();
  }

  /** Levels for the waveform: `n` bands, 0..1, low to high. Zeros when silent. */
  levels(n: number, out: number[]) {
    const a = this.analyser;
    if (!a || !this.state.playing) {
      for (let i = 0; i < n; i++) out[i] = 0;
      return out;
    }
    if (!this.bins) this.bins = new Uint8Array(new ArrayBuffer(a.frequencyBinCount));
    a.getByteFrequencyData(this.bins);
    const max = this.bins.length;
    for (let i = 0; i < n; i++) {
      // log-spaced bands across the useful range
      const lo = Math.floor(Math.pow(max * 0.6, i / n));
      const hi = Math.max(lo + 1, Math.floor(Math.pow(max * 0.6, (i + 1) / n)));
      let s = 0;
      for (let k = lo; k < hi; k++) s += this.bins[k];
      out[i] = s / (hi - lo) / 255;
    }
    return out;
  }

  private ensure() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      master.connect(comp).connect(analyser).connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
      this.analyser = analyser;
      this.mediaHandlers();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private fileElement(ctx: AudioContext) {
    if (!this.audio) {
      const a = new Audio();
      a.preload = "metadata";
      a.addEventListener("ended", () => this.next(true));
      a.addEventListener("loadedmetadata", () => this.set({}));
      ctx.createMediaElementSource(a).connect(this.master!);
      this.audio = a;
    }
    return this.audio;
  }

  private stopSources() {
    this.synth?.stop();
    this.synth = null;
    this.audio?.pause();
  }

  private set(patch: Partial<MusicState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  private mediaHandlers() {
    if (!("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const on = (a: MediaSessionAction, h: MediaSessionActionHandler) => {
      try {
        ms.setActionHandler(a, h);
      } catch {}
    };
    on("play", () => this.play());
    on("pause", () => this.pause());
    on("previoustrack", () => this.prev());
    on("nexttrack", () => this.next());
    on("seekto", (d) => {
      if (typeof d.seekTime === "number") this.seek(d.seekTime);
    });
  }

  private mediaSession() {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    const t = this.track;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      album: "Render sessions",
      artwork: [{ src: t.cover ?? "/icon.svg", sizes: "512x512", type: t.cover ? "image/jpeg" : "image/svg+xml" }],
    });
    navigator.mediaSession.playbackState = this.state.playing ? "playing" : "paused";
  }
}

export const music = new MusicPlayer();

export function formatTime(s: number) {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
