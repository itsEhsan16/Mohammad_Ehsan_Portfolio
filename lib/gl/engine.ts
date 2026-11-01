"use client";

import { Geometry, Mesh, Program, RenderTarget, Renderer, Texture, Triangle, type OGLRenderingContext } from "ogl";
import { gsap } from "@/lib/motion/gsap";
import { scrollVelocity } from "@/lib/motion/lenis";
import { whenVisible } from "@/lib/transition";
import {
  getFieldBackdrop,
  getInkHost,
  getPlanes,
  onFieldBackdrop,
  onInkHost,
  onPlanes,
  type FieldBackdropState,
  type PlaneSpec,
} from "./registry";
import { backdropFieldFrag, backdropFrag, inkFrag, planeFrag, planeVert, simFrag, simVert } from "./shaders";
import { posterCanvas, textMaskCanvas } from "./poster";

/** OGL context; the engine only runs on WebGL2, so WebGL2 constants are safe. */
type GL = OGLRenderingContext & WebGL2RenderingContext;
type Rect = { left: number; top: number; width: number; height: number };

const VARIANT = { blueprint: 0, plain: 1, halftone: 1, stamp: 2 } as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v || "0b0b0a", 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    bg: hexToRgb(cs.getPropertyValue("--bg") || "#0b0b0a"),
    fg: hexToRgb(cs.getPropertyValue("--fg") || "#edeae4"),
    signal: hexToRgb(cs.getPropertyValue("--signal") || "#ff4d00"),
  };
}

function capDpr(w: number, h: number) {
  return Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(3.7e6 / Math.max(1, w * h)));
}

function gridGeometry(gl: GL, seg = 1) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const x = i / seg;
    pos.push(x, 0, x, 1);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  return new Geometry(gl, {
    position: { size: 2, data: new Float32Array(pos) },
    index: { data: new Uint16Array(idx) },
  });
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ───────────────────────── planes ───────────────────────── */

class Plane {
  spec: PlaneSpec;
  mesh: Mesh;
  program: Program;
  texture: Texture;
  ready = false;
  doc: Rect = { left: 0, top: 0, width: 0, height: 0 };
  state = { progress: 0, hover: 0, alpha: 0, mx: 0.5, my: 0.5 };
  hidden = false;
  /** When set, the plane is drawn at this rect instead of its element (morph floater). */
  override: Rect | null = null;
  private off: (() => void)[] = [];

  constructor(
    private engine: Engine,
    spec: PlaneSpec,
    geometry: Geometry,
    shared?: Texture,
  ) {
    const gl = engine.gl;
    this.spec = spec;
    this.texture = shared ?? new Texture(gl, { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
    this.program = new Program(gl, {
      vertex: planeVert,
      fragment: planeFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        tMap: { value: this.texture },
        uRect: { value: [0, 0, 1, 1] },
        uViewport: { value: [1, 1] },
        uBend: { value: 0 },
        uImage: { value: [1, 1] },
        uPlane: { value: [1, 1] },
        uDpr: { value: 1 },
        uVariant: { value: VARIANT[spec.variant] ?? 0 },
        uProgress: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: [0.5, 0.5] },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
        uAlpha: { value: 0 },
        uInk: { value: engine.colors.bg },
        uBone: { value: engine.colors.fg },
        uSignal: { value: engine.colors.signal },
      },
    });
    this.mesh = new Mesh(gl, { geometry, program: this.program });
    if (shared) {
      this.ready = true;
      this.state.alpha = 1;
    } else {
      void this.load();
    }
    this.bindHover();
    this.measure();
  }

  private async load() {
    const { spec } = this;
    const key = spec.src ?? `poster:${spec.index}:${spec.title}`;
    const cached = this.engine.textures.get(key);
    if (cached) {
      this.texture = cached.texture;
      this.program.uniforms.tMap.value = cached.texture;
      this.program.uniforms.uImage.value = [cached.w, cached.h];
      this.ready = true;
      gsap.to(this.state, { alpha: 1, duration: 0.4, ease: "power2.out" });
      spec.el.querySelectorAll<HTMLElement>(".gl-media").forEach((m) => (m.dataset.glOn = "1"));
      return;
    }
    let source: TexImageSource | null = null;
    let w = 1600;
    let h = 1000;
    if (spec.src) {
      const domImg = spec.el.querySelector("img");
      const url = (domImg?.currentSrc || domImg?.src || spec.src) as string;
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      try {
        await img.decode();
        source = img;
        w = img.naturalWidth;
        h = img.naturalHeight;
      } catch {
        source = null;
      }
    }
    if (!source) {
      await document.fonts.ready;
      const c = posterCanvas(spec);
      source = c;
      w = c.width;
      h = c.height;
    }
    if (this.engine.destroyed) return;
    this.engine.queueUpload(() => {
      this.texture.image = source as HTMLImageElement;
      this.texture.needsUpdate = true;
      this.program.uniforms.uImage.value = [w, h];
      this.engine.textures.set(key, { texture: this.texture, w, h });
      this.ready = true;
      gsap.to(this.state, { alpha: 1, duration: 0.6, ease: "power2.out" });
      spec.el.querySelectorAll<HTMLElement>(".gl-media").forEach((m) => (m.dataset.glOn = "1"));
    });
  }

  private bindHover() {
    const host = (this.spec.el.closest("a,button") as HTMLElement | null) ?? this.spec.el;
    const enter = () => gsap.to(this.state, { hover: 1, duration: 1.1, ease: "expo" });
    const leave = () => gsap.to(this.state, { hover: 0, duration: 0.9, ease: "expo" });
    const move = (e: PointerEvent) => {
      const r = this.spec.el.getBoundingClientRect();
      this.state.mx = (e.clientX - r.left) / Math.max(1, r.width);
      this.state.my = 1 - (e.clientY - r.top) / Math.max(1, r.height);
    };
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointermove", move);
    host.addEventListener("focusin", enter);
    host.addEventListener("focusout", leave);
    this.off.push(() => {
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("focusin", enter);
      host.removeEventListener("focusout", leave);
    });
  }

  measure() {
    const r = this.spec.el.getBoundingClientRect();
    this.doc = { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
  }

  rect(scrollY: number): Rect {
    if (this.override) return this.override;
    if (this.spec.sync === "live") {
      const r = this.spec.el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }
    return { left: this.doc.left - window.scrollX, top: this.doc.top - scrollY, width: this.doc.width, height: this.doc.height };
  }

  draw(renderer: Renderer, scrollY: number, W: number, H: number, t: number, dt: number, velocity: number) {
    if (!this.ready || this.hidden) return;
    const r = this.rect(scrollY);
    if (r.width < 2 || r.height < 2) return;
    if (r.top > H + 80 || r.top + r.height < -80 || r.left > W + 80 || r.left + r.width < -80) return;

    // visible fraction drives the blueprint → render sweep
    const visW = Math.max(0, Math.min(r.left + r.width, W) - Math.max(r.left, 0));
    const visH = Math.max(0, Math.min(r.top + r.height, H) - Math.max(r.top, 0));
    const vis = (visW * visH) / (r.width * r.height);
    const target = this.override ? 1 : smooth(0.25, 0.92, vis);
    const k = 1 - Math.pow(0.93, dt * 60);
    this.state.progress += (target - this.state.progress) * k;

    const u = this.program.uniforms;
    u.uRect.value = [r.left, r.top, r.width, r.height];
    u.uViewport.value = [W, H];
    u.uPlane.value = [r.width, r.height];
    u.uDpr.value = this.engine.dpr;
    u.uBend.value = this.override ? 0 : gsap.utils.clamp(-60, 60, -velocity * 1.4);
    u.uProgress.value = this.state.progress;
    u.uHover.value = this.state.hover;
    u.uMouse.value = [this.state.mx, this.state.my];
    u.uVelocity.value = velocity;
    u.uTime.value = t;
    u.uAlpha.value = this.state.alpha;
    renderer.render({ scene: this.mesh, clear: false, frustumCull: false, sort: false });
  }

  setColors(c: Engine["colors"]) {
    this.program.uniforms.uInk.value = c.bg;
    this.program.uniforms.uBone.value = c.fg;
    this.program.uniforms.uSignal.value = c.signal;
  }

  destroy() {
    this.off.forEach((f) => f());
    gsap.killTweensOf(this.state);
    this.spec.el.querySelectorAll<HTMLElement>(".gl-media").forEach((m) => delete m.dataset.glOn);
  }
}

/* ───────────────────────── hero ink field ───────────────────────── */

class InkField {
  host: HTMLElement;
  mesh: Mesh;
  program: Program;
  mask: Texture;
  sim: Mesh;
  simProgram: Program;
  rtA: RenderTarget;
  rtB: RenderTarget;
  reveal = { v: 0 };
  ripples: { x: number; y: number; t0: number }[] = [];
  private p0 = { x: -1, y: -1 };
  private p1 = { x: -1, y: -1 };
  private force = 0;
  private lastInput = -1e9;
  private maskDirty = true;
  private off: (() => void)[] = [];
  private rect: Rect = { left: 0, top: 0, width: 1, height: 1 };

  constructor(
    private engine: Engine,
    host: HTMLElement,
  ) {
    const gl = engine.gl;
    this.host = host;
    this.mask = new Texture(gl, { generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR });
    const r0 = host.getBoundingClientRect();
    const scale = Math.min(1, 512 / Math.max(r0.width, r0.height, 1));
    const w = Math.max(64, Math.round(r0.width * scale));
    const h = Math.max(32, Math.round(r0.height * scale));
    this.rtA = engine.makeTarget(w, h);
    this.rtB = engine.makeTarget(w, h);

    this.simProgram = new Program(gl, {
      vertex: simVert,
      fragment: simFrag,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        tPrev: { value: this.rtA.texture },
        uTexel: { value: [1 / w, 1 / h] },
        uP0: { value: [-1, -1] },
        uP1: { value: [-1, -1] },
        uForce: { value: 0 },
        uRadius: { value: 0.065 },
        uDecay: { value: 0.965 },
        uAspect: { value: w / h },
        uAdvect: { value: 0 },
      },
    });
    this.sim = new Mesh(gl, { geometry: new Triangle(gl), program: this.simProgram });

    this.program = new Program(gl, {
      vertex: planeVert,
      fragment: inkFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        tMask: { value: this.mask },
        tTrail: { value: this.rtA.texture },
        uRect: { value: [0, 0, 1, 1] },
        uViewport: { value: [1, 1] },
        uBend: { value: 0 },
        uPlane: { value: [1, 1] },
        uDpr: { value: 1 },
        uPitch: { value: 7 },
        uReveal: { value: 0 },
        uTime: { value: 0 },
        uDot: { value: engine.colors.fg },
        uSignal: { value: engine.colors.signal },
        uRipples: { value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      },
    });
    this.mesh = new Mesh(gl, { geometry: gridGeometry(gl, 1), program: this.program });

    const onMove = (e: PointerEvent) => {
      const r = this.rect;
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < -0.1 || x > 1.1 || y < -0.15 || y > 1.15) {
        this.p1 = { x: -1, y: -1 };
        return;
      }
      this.lastInput = performance.now();
      if (this.p1.x < -0.5) this.p1 = { x, y };
      const speed = Math.hypot((x - this.p1.x) * r.width, (y - this.p1.y) * r.height);
      this.p0 = { ...this.p1 };
      this.p1 = { x, y };
      this.force = Math.min(0.85, 0.12 + speed * 0.018);
    };
    const onDown = (e: PointerEvent) => {
      const r = this.rect;
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      this.ripples.push({ x, y, t0: performance.now() / 1000 });
      if (this.ripples.length > 3) this.ripples.shift();
      this.force = 1;
    };
    const onFit = () => (this.maskDirty = true);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    host.addEventListener("namefit", onFit);
    const ro = new ResizeObserver(onFit);
    ro.observe(host);
    this.off.push(() => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      host.removeEventListener("namefit", onFit);
      ro.disconnect();
    });

    // print-in once the page is visible
    this.off.push(
      whenVisible(() => {
        gsap.to(this.reveal, { v: 1, duration: 1.8, ease: "power2.inOut", delay: 0.1 });
      }),
    );
  }

  private rebuildMask() {
    this.maskDirty = false;
    const c = textMaskCanvas(this.host, this.engine.dpr);
    this.engine.queueUpload(() => {
      this.mask.image = c;
      this.mask.needsUpdate = true;
      this.host.querySelectorAll<HTMLElement>(".gl-media").forEach((m) => (m.dataset.glOn = "1"));
    });
  }

  draw(renderer: Renderer, W: number, H: number, t: number, dt: number) {
    const r = this.host.getBoundingClientRect();
    this.rect = { left: r.left, top: r.top, width: Math.max(1, r.width), height: Math.max(1, r.height) };
    if (r.bottom < -50 || r.top > H + 50) return;
    if (this.maskDirty) this.rebuildMask();

    // idle autopilot: a slow signature curve across the name
    const now = performance.now();
    if (now - this.lastInput > 2600) {
      const k = t * 0.55;
      const x = 0.5 + 0.42 * Math.sin(k * 0.9) * Math.cos(k * 0.31);
      const y = 0.5 + 0.34 * Math.sin(k * 1.37 + 0.6);
      if (this.p1.x < -0.5) this.p1 = { x, y };
      this.p0 = { ...this.p1 };
      this.p1 = { x, y };
      this.force = Math.max(this.force, 0.22);
    }

    // simulation step
    const su = this.simProgram.uniforms;
    su.tPrev.value = this.rtA.texture;
    su.uP0.value = [this.p0.x, this.p0.y];
    su.uP1.value = [this.p1.x, this.p1.y];
    su.uForce.value = this.force;
    su.uDecay.value = Math.pow(0.968, dt * 60);
    renderer.render({ scene: this.sim, target: this.rtB, clear: false, frustumCull: false, sort: false });
    [this.rtA, this.rtB] = [this.rtB, this.rtA];
    this.p0 = { ...this.p1 };
    this.force *= 0.6;

    // composite
    const rip: number[] = [];
    const ts = now / 1000;
    for (let i = 0; i < 3; i++) {
      const R = this.ripples[i];
      if (!R) {
        rip.push(0, 0, 0, 0);
        continue;
      }
      const age = ts - R.t0;
      rip.push(R.x, R.y, age * 520, Math.max(0, 1 - age / 1.3));
    }
    this.ripples = this.ripples.filter((R) => ts - R.t0 < 1.4);

    const u = this.program.uniforms;
    u.tTrail.value = this.rtA.texture;
    u.uRect.value = [r.left, r.top, r.width, r.height];
    u.uViewport.value = [W, H];
    u.uPlane.value = [r.width, r.height];
    u.uDpr.value = this.engine.dpr;
    u.uPitch.value = Math.max(5, Math.min(9, r.width / 180));
    u.uReveal.value = this.reveal.v;
    u.uTime.value = t;
    u.uRipples.value = rip;
    renderer.render({ scene: this.mesh, clear: false, frustumCull: false, sort: false });
  }

  setColors(c: Engine["colors"]) {
    this.program.uniforms.uDot.value = c.fg;
    this.program.uniforms.uSignal.value = c.signal;
  }

  destroy() {
    this.off.forEach((f) => f());
    gsap.killTweensOf(this.reveal);
    this.host.querySelectorAll<HTMLElement>(".gl-media").forEach((m) => delete m.dataset.glOn);
  }
}

/* ───────────────────────── /work field backdrop ───────────────────────── */

class Backdrop {
  /** css px per dither cell */
  static CELL = 3;
  mesh: Mesh;
  program: Program;
  fieldMesh: Mesh;
  fieldProgram: Program;
  sim: Mesh;
  simProgram: Program;
  rtA!: RenderTarget;
  rtB!: RenderTarget;
  rtField!: RenderTarget;
  private size: [number, number] = [1, 1];
  private fade = { a: 0 };
  private dim = 0;
  private p0 = { x: -1, y: -1 };
  private p1 = { x: -1, y: -1 };
  private force = 0;
  private off: (() => void)[] = [];

  constructor(
    private engine: Engine,
    public state: FieldBackdropState,
  ) {
    const gl = engine.gl;
    const flat = { depthTest: false, depthWrite: false, cullFace: false } as const;
    this.simProgram = new Program(gl, {
      vertex: simVert,
      fragment: simFrag,
      ...flat,
      uniforms: {
        tPrev: { value: null },
        uTexel: { value: [1, 1] },
        uP0: { value: [-1, -1] },
        uP1: { value: [-1, -1] },
        uForce: { value: 0 },
        uRadius: { value: 0.062 },
        uDecay: { value: 0.955 },
        uAspect: { value: 1 },
        uAdvect: { value: 0 },
      },
    });
    this.sim = new Mesh(gl, { geometry: new Triangle(gl), program: this.simProgram });
    this.fieldProgram = new Program(gl, {
      vertex: simVert,
      fragment: backdropFieldFrag,
      ...flat,
      uniforms: {
        tTrail: { value: null },
        uView: { value: [1, 1] },
        uSize: { value: [1, 1] },
        uCell: { value: Backdrop.CELL },
        uPan: { value: [0, 0] },
        uTime: { value: 0 },
        uMove: { value: 0 },
        uDim: { value: 0 },
      },
    });
    this.fieldMesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.fieldProgram });
    this.program = new Program(gl, {
      vertex: simVert,
      fragment: backdropFrag,
      transparent: true,
      ...flat,
      uniforms: {
        tField: { value: null },
        uSize: { value: [1, 1] },
        uCell: { value: Backdrop.CELL },
        uRes: { value: [1, 1] },
        uDpr: { value: 1 },
        uAlpha: { value: 0 },
        uBg: { value: engine.colors.bg },
        uFg: { value: engine.colors.fg },
      },
    });
    this.mesh = new Mesh(gl, { geometry: new Triangle(gl), program: this.program });
    this.resize();

    const onMove = (e: PointerEvent) => {
      const x = e.clientX / Math.max(1, engine.width);
      const y = 1 - e.clientY / Math.max(1, engine.height);
      if (this.p1.x < -0.5) this.p1 = { x, y };
      const speed = Math.hypot((x - this.p1.x) * engine.width, (y - this.p1.y) * engine.height);
      this.p0 = { ...this.p1 };
      this.p1 = { x, y };
      this.force = Math.min(0.9, 0.16 + speed * 0.02);
    };
    const onLeave = () => (this.p1 = { x: -1, y: -1 });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    this.off.push(() => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    });
    gsap.to(this.fade, { a: 1, duration: 1.2, ease: "power2.out" });
  }

  /** The trail runs at a third of the screen; the density field at one texel per dither cell. */
  resize() {
    const gl = this.engine.gl;
    const W = Math.max(1, this.engine.width);
    const H = Math.max(1, this.engine.height);
    if (this.rtA) [this.rtA, this.rtB, this.rtField].forEach((rt) => this.engine.freeTarget(rt));
    const w = Math.max(64, Math.round(Math.min(480, W / 3)));
    const h = Math.max(32, Math.round((w * H) / W));
    this.rtA = this.engine.makeTarget(w, h);
    this.rtB = this.engine.makeTarget(w, h);
    this.simProgram.uniforms.uTexel.value = [1 / w, 1 / h];
    this.simProgram.uniforms.uAspect.value = w / h;
    this.size = [Math.ceil(W / Backdrop.CELL), Math.ceil(H / Backdrop.CELL)];
    this.rtField = new RenderTarget(gl, {
      width: this.size[0],
      height: this.size[1],
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
      depth: false,
    });
  }

  draw(renderer: Renderer, t: number, dt: number) {
    const gl = this.engine.gl;
    const s = this.state;

    // 1. cursor trail
    const su = this.simProgram.uniforms;
    su.tPrev.value = this.rtA.texture;
    su.uP0.value = [this.p0.x, this.p0.y];
    su.uP1.value = [this.p1.x, this.p1.y];
    su.uForce.value = this.p1.x < -0.5 ? 0 : this.force;
    su.uDecay.value = Math.pow(0.955, dt * 60);
    renderer.render({ scene: this.sim, target: this.rtB, clear: false, frustumCull: false, sort: false });
    [this.rtA, this.rtB] = [this.rtB, this.rtA];
    this.p0 = { ...this.p1 };
    this.force *= 0.5;

    // 2. density, one texel per cell
    this.dim += (s.dim - this.dim) * (1 - Math.pow(0.9, dt * 60));
    const fu = this.fieldProgram.uniforms;
    fu.tTrail.value = this.rtA.texture;
    fu.uView.value = [this.engine.width, this.engine.height];
    fu.uSize.value = this.size;
    fu.uPan.value = [s.panX, s.panY];
    fu.uTime.value = t;
    fu.uMove.value = s.moving;
    fu.uDim.value = this.dim;
    renderer.render({ scene: this.fieldMesh, target: this.rtField, clear: false, frustumCull: false, sort: false });

    // 3. dither to the screen
    const u = this.program.uniforms;
    u.tField.value = this.rtField.texture;
    u.uSize.value = this.size;
    u.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    u.uDpr.value = this.engine.dpr;
    u.uAlpha.value = this.fade.a;
    renderer.render({ scene: this.mesh, clear: false, frustumCull: false, sort: false });
  }

  setColors(c: Engine["colors"]) {
    this.program.uniforms.uBg.value = c.bg;
    this.program.uniforms.uFg.value = c.fg;
  }

  destroy() {
    this.off.forEach((f) => f());
    gsap.killTweensOf(this.fade);
    [this.rtA, this.rtB, this.rtField].forEach((rt) => this.engine.freeTarget(rt));
  }
}

/* ───────────────────────── engine ───────────────────────── */

export class Engine {
  renderer: Renderer;
  gl: GL;
  dpr = 1;
  colors = readColors();
  destroyed = false;
  private planes = new Map<PlaneSpec, Plane>();
  private ink: InkField | null = null;
  private backdrop: Backdrop | null = null;
  private geo: Geometry;
  private uploads: (() => void)[] = [];
  /** Uploaded textures by source key — reused across routes and by morph targets. */
  textures = new Map<string, { texture: Texture; w: number; h: number }>();
  private floater: Plane | null = null;
  private off: (() => void)[] = [];
  private lost = false;
  private W = 0;
  private H = 0;
  private t0 = performance.now();
  private floatTarget: Rect | null = null;

  constructor(public canvas: HTMLCanvasElement) {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.dpr = capDpr(this.W, this.H);
    this.renderer = new Renderer({
      canvas,
      webgl: 2,
      dpr: this.dpr,
      alpha: false,
      depth: false,
      antialias: false,
      premultipliedAlpha: false,
      autoClear: false,
      powerPreference: "high-performance",
    });
    this.gl = this.renderer.gl as GL;
    this.renderer.setSize(this.W, this.H);
    this.geo = gridGeometry(this.gl, 24);

    getPlanes().forEach((s) => this.add(s));
    this.off.push(
      onPlanes((type, spec) => (type === "add" ? this.add(spec) : this.remove(spec))),
      onInkHost((el) => this.setInk(el)),
      onFieldBackdrop((st) => this.setBackdrop(st)),
    );
    this.setInk(getInkHost());
    this.setBackdrop(getFieldBackdrop());

    const onResize = () => {
      this.W = window.innerWidth;
      this.H = window.innerHeight;
      this.dpr = capDpr(this.W, this.H);
      this.renderer.dpr = this.dpr;
      this.renderer.setSize(this.W, this.H);
      this.backdrop?.resize();
      this.remeasure();
    };
    const onTheme = () => {
      this.colors = readColors();
      this.planes.forEach((p) => p.setColors(this.colors));
      this.ink?.setColors(this.colors);
      this.backdrop?.setColors(this.colors);
      this.floater?.setColors(this.colors);
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      this.lost = true;
      document.documentElement.classList.remove("gl-ready");
      document.querySelectorAll<HTMLElement>("[data-gl-on]").forEach((m) => delete m.dataset.glOn);
    };
    const onRestored = () => window.dispatchEvent(new CustomEvent("gl:restart"));
    window.addEventListener("resize", onResize);
    window.addEventListener("themechange", onTheme);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    const ro = new ResizeObserver(() => this.remeasure());
    ro.observe(document.body);
    this.off.push(() => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("themechange", onTheme);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      ro.disconnect();
    });

    gsap.ticker.add(this.tick);
    document.documentElement.classList.add("gl-ready");
  }

  makeTarget(width: number, height: number) {
    const gl = this.gl;
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (ext) {
      const rt = new RenderTarget(gl, {
        width,
        height,
        type: gl.HALF_FLOAT,
        internalFormat: gl.RGBA16F,
        format: gl.RGBA,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        depth: false,
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, rt.buffer);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (ok) return rt;
    }
    return new RenderTarget(gl, { width, height, minFilter: gl.LINEAR, magFilter: gl.LINEAR, depth: false });
  }

  get width() {
    return this.W;
  }

  get height() {
    return this.H;
  }

  freeTarget(rt: RenderTarget) {
    const gl = this.gl;
    gl.deleteFramebuffer(rt.buffer);
    gl.deleteTexture(rt.texture.texture);
  }

  queueUpload(fn: () => void) {
    this.uploads.push(fn);
  }

  private add(spec: PlaneSpec) {
    if (this.planes.has(spec)) return;
    this.planes.set(spec, new Plane(this, spec, this.geo));
  }

  private remove(spec: PlaneSpec) {
    const p = this.planes.get(spec);
    if (!p) return;
    p.destroy();
    this.planes.delete(spec);
  }

  private setBackdrop(state: FieldBackdropState | null) {
    if (this.backdrop && this.backdrop.state === state) return;
    this.backdrop?.destroy();
    this.backdrop = state ? new Backdrop(this, state) : null;
  }

  private setInk(el: HTMLElement | null) {
    if (this.ink && this.ink.host === el) return;
    this.ink?.destroy();
    this.ink = el ? new InkField(this, el) : null;
  }

  remeasure() {
    this.planes.forEach((p) => p.measure());
  }

  /* ── shared-element morph ── */
  morphCapture(from: HTMLElement): boolean {
    const plane = Array.from(this.planes.values()).find((p) => p.ready && (from === p.spec.el || from.contains(p.spec.el)));
    if (!plane) return this.captureImage(from);
    const r = plane.spec.el.getBoundingClientRect();
    const floater = new Plane(this, { ...plane.spec, sync: "cached" }, this.geo, plane.texture);
    floater.program.uniforms.uImage.value = plane.program.uniforms.uImage.value;
    floater.state.progress = 1;
    floater.override = { left: r.left, top: r.top, width: r.width, height: r.height };
    this.floater?.destroy();
    this.floater = floater;
    plane.hidden = true;
    return true;
  }

  /**
   * Morph from a plain <img> that isn't a registered plane (the /work field's
   * open picture): upload it on the spot and float it from where it sits.
   * Prefers the sharp copy once it has loaded.
   */
  private captureImage(from: HTMLElement): boolean {
    const imgs = Array.from(from.querySelectorAll<HTMLImageElement>("img[data-morph-image]")).filter(
      (i) => i.complete && i.naturalWidth > 0 && (i.dataset.morphImage !== "hi" || i.classList.contains("is-loaded")),
    );
    const img = imgs.find((i) => i.dataset.morphImage === "hi") ?? imgs[0];
    if (!img) return false;
    const r = img.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const gl = this.gl;
    const texture = new Texture(gl, { image: img, generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
    const spec: PlaneSpec = { el: img, src: img.currentSrc || img.src, title: img.alt, variant: "blueprint", sync: "cached" };
    const floater = new Plane(this, spec, this.geo, texture);
    floater.program.uniforms.uImage.value = [img.naturalWidth, img.naturalHeight];
    floater.state.progress = 1;
    floater.override = { left: r.left, top: r.top, width: r.width, height: r.height };
    this.floater?.destroy();
    this.floater = floater;
    return true;
  }

  /** Grow the floater to fill the viewport (cover phase). */
  morphExpand(duration = 0.9) {
    const f = this.floater;
    if (!f || !f.override) return Promise.resolve();
    return new Promise<void>((resolve) => {
      gsap.to(f.override, {
        left: 0,
        top: 0,
        width: this.W,
        height: this.H,
        duration,
        ease: "quint",
        onComplete: resolve,
      });
    });
  }

  /** After navigation: fly the floater into the plane registered with `key` and hand over. */
  morphLand(key: string, duration = 1.0) {
    const f = this.floater;
    if (!f || !f.override) return Promise.resolve();
    const target = Array.from(this.planes.values()).find((p) => p.spec.morphKey === key && p !== f);
    if (!target) {
      return new Promise<void>((resolve) => {
        gsap.to(f.state, {
          alpha: 0,
          duration: 0.5,
          onComplete: () => {
            this.clearFloater();
            resolve();
          },
        });
      });
    }
    target.hidden = true;
    target.state.progress = 1;
    const r = target.spec.el.getBoundingClientRect();
    this.floatTarget = { left: r.left, top: r.top, width: r.width, height: r.height };
    return new Promise<void>((resolve) => {
      gsap.to(f.override, {
        ...this.floatTarget!,
        duration,
        ease: "expo",
        onComplete: () => {
          target.hidden = false;
          this.clearFloater();
          resolve();
        },
      });
    });
  }

  clearFloater() {
    if (!this.floater) return;
    this.floater.destroy();
    this.floater = null;
    this.planes.forEach((p) => (p.hidden = false));
  }

  hasFloater() {
    return !!this.floater;
  }

  private tick = () => {
    if (this.lost || this.destroyed || document.hidden) return;
    const gl = this.gl;
    const now = performance.now();
    const t = (now - this.t0) / 1000;
    const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);
    const y = window.scrollY;
    const velocity = scrollVelocity();

    // one texture upload per frame keeps the main thread smooth
    const up = this.uploads.shift();
    if (up) up();

    this.renderer.bindFramebuffer();
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const [r, g, b] = this.colors.bg;
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.backdrop?.draw(this.renderer, t, dt);
    this.planes.forEach((p) => p.draw(this.renderer, y, this.W, this.H, t, dt, velocity));
    this.ink?.draw(this.renderer, this.W, this.H, t, dt);
    this.floater?.draw(this.renderer, y, this.W, this.H, t, dt, 0);
  };

  destroy(loseContext = true) {
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.off.forEach((f) => f());
    this.planes.forEach((p) => p.destroy());
    this.planes.clear();
    this.ink?.destroy();
    this.backdrop?.destroy();
    this.floater?.destroy();
    document.documentElement.classList.remove("gl-ready");
    if (loseContext) this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/** Create the engine, or return null when WebGL2 is unavailable / software-only (unless forced). */
export function createEngine(canvas: HTMLCanvasElement, force = false): Engine | null {
  const attrs: WebGLContextAttributes = {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: !force,
  };
  const probe = canvas.getContext("webgl2", attrs);
  if (!probe) return null;
  try {
    return new Engine(canvas);
  } catch (e) {
    console.warn("WebGL engine failed to start", e);
    return null;
  }
}
