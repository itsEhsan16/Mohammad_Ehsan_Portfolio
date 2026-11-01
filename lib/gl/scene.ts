"use client";

import { Camera, Geometry, Mesh, Program, RenderTarget, Texture, Transform, type OGLRenderingContext, type Renderer } from "ogl";
import { gsap } from "@/lib/motion/gsap";
import { whenVisible } from "@/lib/transition";
import { setDragging } from "@/lib/cursor";
import type { SceneSpec } from "./registry";
import { STAGE, baseDistance, cameraPose, feetHeight, feetShift, heightAt } from "./terrain";
import { compositeFrag, figureFrag, sceneVert, terrainFrag } from "./scene-shaders";
import { planeVert } from "./shaders";
import { figureOverride } from "./figure";
import type { LoadedFigure } from "./figure-glb";

type GL = OGLRenderingContext & WebGL2RenderingContext;
type RGB = [number, number, number];

/** What the scene needs from the engine; structural, so this chunk never imports it. */
export interface SceneEngine {
  gl: GL;
  renderer: Renderer;
  dpr: number;
  colors: { bg: RGB; fg: RGB; signal: RGB };
  /** true once the context was lost: GPU objects are already gone */
  contextLost: boolean;
  freeTarget(rt: RenderTarget): void;
}

/** The figure in the scene: your loaded GLB. */
interface Figure {
  root: Transform;
  triangles: number;
  label: string;
  clip: string;
  update(t: number, dt: number, look: number): void;
  dispose(): void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (dt: number, tau: number) => 1 - Math.exp(-dt / tau);
/** At most this many pixels in the offscreen pass (it sets the dither's source detail). */
const MAX_PIXELS = 1.3e6;

/** Ground mesh: a polar grid around the figure, dense under the feet, out to the far range. */
function terrainGeometry(gl: GL) {
  const RINGS = 110;
  const SEG = 160;
  const R0 = 0.3;
  const R1 = 150;
  const count = RINGS * SEG + 1;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const put = (i: number, x: number, z: number) => {
    const y = heightAt(x, z);
    const e = Math.max(0.03, Math.hypot(x, z) * 0.008);
    const nx = heightAt(x - e, z) - heightAt(x + e, z);
    const nz = heightAt(x, z - e) - heightAt(x, z + e);
    const ny = 2 * e;
    const l = Math.hypot(nx, ny, nz) || 1;
    pos.set([x, y, z], i * 3);
    nor.set([nx / l, ny / l, nz / l], i * 3);
  };
  put(0, 0, 0);
  for (let r = 0; r < RINGS; r++) {
    const rad = R0 + (R1 - R0) * Math.pow(r / (RINGS - 1), 2.2);
    for (let s = 0; s < SEG; s++) {
      const a = (s / SEG) * Math.PI * 2;
      put(1 + r * SEG + s, Math.sin(a) * rad, Math.cos(a) * rad);
    }
  }
  const idx: number[] = [];
  for (let s = 0; s < SEG; s++) idx.push(0, 1 + s, 1 + ((s + 1) % SEG));
  for (let r = 0; r < RINGS - 1; r++) {
    for (let s = 0; s < SEG; s++) {
      const a = 1 + r * SEG + s;
      const b = 1 + r * SEG + ((s + 1) % SEG);
      const c = a + SEG;
      const d = b + SEG;
      idx.push(a, c, b, b, c, d);
    }
  }
  return {
    geometry: new Geometry(gl, {
      position: { size: 3, data: pos },
      normal: { size: 3, data: nor },
      index: { data: new Uint16Array(idx) },
    }),
    triangles: idx.length / 3,
  };
}

/** Unit quad (x, y 0..1) for planeVert. */
function quadGeometry(gl: GL) {
  return new Geometry(gl, {
    position: { size: 2, data: new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]) },
    index: { data: new Uint16Array([0, 1, 2, 1, 3, 2]) },
  });
}

/** Shader program for the figure's meshes. */
export function figureProgram(
  gl: GL,
  opts: { skinned?: boolean; uv?: boolean; alphaMask?: boolean; base?: [number, number, number, number]; map?: Texture | null; cutoff?: number },
) {
  return new Program(gl, {
    vertex: sceneVert({ skinned: opts.skinned, uv: opts.uv }),
    fragment: figureFrag({ uv: opts.uv, alphaMask: opts.alphaMask }),
    cullFace: false,
    uniforms: {
      uKey: { value: [-0.45, 0.62, 0.64] },
      uBase: { value: opts.base ?? [1, 1, 1, 1] },
      uAlphaCutoff: { value: opts.cutoff ?? 0.5 },
      ...(opts.uv ? { tBase: { value: opts.map ?? null }, uHasBase: { value: opts.map ? 1 : 0 } } : {}),
    },
  });
}

/**
 * The home hero in 3D: a dithered ridge behind your name, with your model
 * standing on it once one exists. Rendered offscreen and composited as dither:
 * the ground before the painted name, the figure after it.
 */
export class HeroScene {
  readonly spec: SceneSpec;
  private engine: SceneEngine;
  private gl: GL;
  private world = new Transform();
  private camera: Camera;
  private rt: RenderTarget | null = null;
  private quad: Mesh;
  private comp: Program;
  private terrain: Mesh;
  private terrainTris: number;
  private figure: Figure | null = null;
  private figureFade = { v: 0 };
  private reveal = { v: 0 };
  private blank: Texture;
  private off: (() => void)[] = [];
  private rect = { left: 0, top: 0, width: 1, height: 1 };
  private visible = false;
  private scale = 1;
  private slow = 0;
  private started = false;
  private hudAt = 0;
  private hud: Record<string, HTMLElement | null> = {};
  // camera state (degrees, metres)
  private cam = { az: 0, el: STAGE.elevation, dist: baseDistance() };
  private goal = { az: 0, el: STAGE.elevation, dist: baseDistance() };
  private hover = { x: 0, y: 0, tx: 0, ty: 0 };
  private velAz = 0;
  private lastInput = performance.now();
  private drag: { x: number; y: number; az: number; el: number; moved: boolean; lastX: number; lastT: number } | null = null;
  private destroyed = false;

  constructor(engine: SceneEngine, spec: SceneSpec) {
    this.engine = engine;
    this.spec = spec;
    const gl = (this.gl = engine.gl);

    this.camera = new Camera(gl, { fov: STAGE.fov, near: 0.2, far: 400 });
    this.blank = new Texture(gl, { image: new Uint8Array([0, 0, 0, 255]), width: 1, height: 1, generateMipmaps: false });

    const ground = terrainGeometry(gl);
    this.terrainTris = ground.triangles;
    this.terrain = new Mesh(gl, {
      geometry: ground.geometry,
      frustumCulled: false,
      program: new Program(gl, {
        vertex: sceneVert(),
        fragment: terrainFrag,
        cullFace: false,
        uniforms: {
          uSun: { value: normalize([-0.55, 0.42, -0.72]) },
          uFeetY: { value: feetHeight() },
          uContact: { value: 0 },
        },
      }),
    });
    this.terrain.setParent(this.world);

    this.comp = new Program(gl, {
      vertex: planeVert,
      fragment: compositeFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        tColor: { value: this.blank },
        tData: { value: this.blank },
        tTrail: { value: this.blank },
        uHasTrail: { value: 0 },
        tName: { value: this.blank },
        uHasName: { value: 0 },
        uNameMap: { value: [0, 0, 1, 1] },
        uRect: { value: [0, 0, 1, 1] },
        uViewport: { value: [1, 1] },
        uBend: { value: 0 },
        uPlane: { value: [1, 1] },
        uDpr: { value: 1 },
        uLayer: { value: 0 },
        uInvert: { value: 0 },
        uReveal: { value: 0 },
        uFigure: { value: 0 },
        uFg: { value: engine.colors.fg },
        uBg: { value: engine.colors.bg },
        uSignal: { value: engine.colors.signal },
      },
    });
    this.quad = new Mesh(gl, { geometry: quadGeometry(gl), program: this.comp, frustumCulled: false });
    this.setColors(engine.colors);

    this.spec.el.querySelectorAll<HTMLElement>("[data-hud]").forEach((el) => (this.hud[el.dataset.hud!] = el));
    this.bindInput();
    this.loadFigure();

    this.off.push(
      whenVisible(() => {
        gsap.to(this.reveal, { v: 1, duration: 1.8, ease: "power2.inOut", delay: 0.15 });
      }),
    );
  }

  /* ── figure ── */

  private place(f: Figure) {
    this.figure?.root.setParent(null);
    this.figure?.dispose();
    this.figure = f;
    f.root.position.set(0, feetHeight(), 0);
    f.root.setParent(this.world);
    if (this.hud.fig) this.hud.fig.textContent = f.label;
    if (this.hud.clip) this.hud.clip.textContent = f.clip;
    gsap.fromTo(this.figureFade, { v: 0 }, { v: 1, duration: 0.9, ease: "power2.out" });
    // dev: /?figure=still exports the phone still once textures are on the GPU
    if (figureOverride()?.mode === "still") window.setTimeout(() => this.exportStill(), 1500);
  }

  /**
   * Dev only (`/?figure=still`): renders the figure front-on as a colour
   * cut-out with a transparent background and downloads it as figure.webp, with
   * the feet on the bottom edge. Put the file in public/media/hero/ for phones
   * and other visitors without WebGL.
   */
  private exportStill() {
    const f = this.figure;
    if (!f || this.destroyed) return;
    const gl = this.gl;
    const W = 1200;
    const H = 1800;
    const rt = new RenderTarget(gl, { width: W, height: H, color: 2, depth: true, minFilter: gl.NEAREST, magFilter: gl.NEAREST });
    // front camera, level with the figure's middle, framing 1.9 m of height
    const feet = feetHeight();
    const dist = 8;
    const half = (STAGE.figureHeight * 1.04) / 2;
    const cam = new Camera(gl, { fov: (2 * Math.atan(half / dist) * 180) / Math.PI, aspect: W / H, near: 0.5, far: 40 });
    cam.position.set(0, feet + half - 0.01, dist);
    cam.lookAt([0, feet + half - 0.01, 0]);
    f.update(0, 0, 0);
    this.terrain.visible = false;
    const renderer = this.engine.renderer;
    renderer.bindFramebuffer(rt);
    renderer.setViewport(W, H);
    renderer.setDepthMask(true);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderer.render({ scene: this.world, camera: cam, target: rt, clear: false, sort: false, frustumCull: false });
    this.terrain.visible = true;
    const color = new Uint8Array(W * H * 4);
    const data = new Uint8Array(W * H * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rt.buffer);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, color);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    renderer.bindFramebuffer();
    this.engine.freeTarget(rt);
    // flip rows; alpha comes from the figure id
    const img = new ImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = ((H - 1 - y) * W + x) * 4;
        const o = (y * W + x) * 4;
        img.data[o] = color[i];
        img.data[o + 1] = color[i + 1];
        img.data[o + 2] = color[i + 2];
        img.data[o + 3] = data[i + 2] > 191 ? 255 : 0;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.getContext("2d")!.putImageData(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "figure.webp";
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        console.info("figure.webp exported — put it in public/media/hero/ for phones and no-WebGL visitors.");
      },
      "image/webp",
      0.9,
    );
  }

  /** Your model, when one exists; until then the scene is the ground alone. */
  private loadFigure() {
    const o = figureOverride();
    const src = o?.mode === "src" ? o.src! : this.spec.figure.src;
    if (!src) return;
    const { yaw, height, clip } = this.spec.figure;
    import("./figure-glb")
      .then((m) => m.loadFigure(this.gl, src, { yaw, height, clip, program: figureProgram }))
      .then((f: LoadedFigure) => {
        if (this.destroyed) return f.dispose();
        this.place({ ...f, label: src.split("?")[0].split("/").pop() || "me.glb" });
      })
      .catch((e) => console.warn("The hero model failed to load; showing the ground alone", e));
  }

  /* ── input ── */

  private bindInput() {
    const el = this.spec.el;
    const interactive = "a,button,input,textarea,select,label,summary,[role='slider'],[contenteditable]";
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === "touch") return;
      if ((e.target as Element | null)?.closest(interactive)) return;
      this.drag = { x: e.clientX, y: e.clientY, az: this.goal.az, el: this.goal.el, moved: false, lastX: e.clientX, lastT: performance.now() };
      this.velAz = 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = this.rect;
      this.hover.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      this.hover.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      this.lastInput = performance.now();
      const d = this.drag;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 4) {
        d.moved = true;
        setDragging(true);
        window.getSelection()?.removeAllRanges();
      }
      if (!d.moved) return;
      this.goal.az = d.az - dx * 0.28;
      this.goal.el = clamp(d.el + dy * 0.1, -8, 20);
      const now = performance.now();
      const ddt = Math.max(1, now - d.lastT);
      this.velAz = clamp((-(e.clientX - d.lastX) * 0.28 * 1000) / ddt, -240, 240);
      d.lastX = e.clientX;
      d.lastT = now;
    };
    const onUp = () => {
      if (this.drag?.moved) setDragging(false);
      else this.velAz = 0;
      this.drag = null;
    };
    const onWheel = (e: WheelEvent) => {
      // only when the page itself can't scroll (zoomed-in browsers can)
      if (document.documentElement.scrollHeight > window.innerHeight + 2) return;
      this.lastInput = performance.now();
      const d0 = baseDistance();
      this.goal.dist = clamp(this.goal.dist * Math.exp(e.deltaY * 0.0012), d0 * 0.75, d0 * 1.35);
      this.goal.az -= e.deltaX * 0.08;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    this.off.push(() => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      if (this.drag?.moved) setDragging(false);
    });
  }

  /* ── frame ── */

  private ensureTarget() {
    const { width, height } = this.rect;
    const s = Math.min(1, Math.sqrt(MAX_PIXELS / Math.max(1, width * height))) * this.scale;
    const w = Math.max(64, Math.round(width * s));
    const h = Math.max(64, Math.round(height * s));
    if (this.rt && this.rt.width === w && this.rt.height === h) return this.rt;
    if (this.rt) this.engine.freeTarget(this.rt);
    const gl = this.gl;
    this.rt = new RenderTarget(gl, { width: w, height: h, color: 2, depth: true, minFilter: gl.NEAREST, magFilter: gl.NEAREST });
    return this.rt;
  }

  /** Pass 1: terrain and figure into the offscreen target. Call before the canvas is cleared. */
  renderOffscreen(t: number, dt: number) {
    if (this.destroyed) return;
    const r = this.spec.el.getBoundingClientRect();
    this.rect = { left: r.left, top: r.top, width: Math.max(1, r.width), height: Math.max(1, r.height) };
    this.visible = r.bottom > 0 && r.top < window.innerHeight && r.width > 2;
    if (!this.visible) return;

    // adaptive quality: drop resolution if frames stay slow
    this.slow = dt > 0.022 ? this.slow + dt : Math.max(0, this.slow - dt * 0.5);
    if (this.slow > 2 && this.scale > 0.56) {
      this.scale = Math.max(0.55, this.scale * 0.8);
      this.slow = 0;
    }

    // camera: goal (drag / wheel) + hover parallax + idle drift
    const now = performance.now();
    if (!this.drag) {
      this.goal.az += this.velAz * dt;
      this.velAz *= Math.exp(-dt / 0.35);
    }
    const idle = now - this.lastInput > 4000 && !this.drag;
    const drift = idle ? 18 * Math.sin((t * Math.PI * 2) / 26) : 0;
    if (idle) {
      // left alone, the stage settles back to the hero framing (the nearest front view)
      const settle = ease(dt, 2.4);
      this.goal.az += (Math.round(this.goal.az / 360) * 360 - this.goal.az) * settle;
      this.goal.el += (STAGE.elevation - this.goal.el) * settle;
      this.goal.dist += (baseDistance() - this.goal.dist) * settle;
      this.velAz = 0;
    }
    this.hover.x += (this.hover.tx - this.hover.x) * ease(dt, 0.35);
    this.hover.y += (this.hover.ty - this.hover.y) * ease(dt, 0.35);
    const k = ease(dt, this.drag ? 0.06 : 0.14);
    this.cam.az += (this.goal.az + this.hover.x * 6 + (idle ? drift : 0) - this.cam.az) * (idle ? ease(dt, 1.2) : k);
    this.cam.el += (this.goal.el - this.hover.y * 2 - this.cam.el) * k;
    this.cam.dist += (this.goal.dist - this.cam.dist) * k;

    const pose = cameraPose(this.cam.az, this.cam.el, this.cam.dist);
    const cam = this.camera;
    cam.position.set(pose.eye[0], pose.eye[1], pose.eye[2]);
    cam.lookAt(pose.target);
    cam.perspective({ aspect: this.rect.width / this.rect.height });
    // off-axis shift keeps the feet at STAGE.feetAt of the stage height
    cam.projectionMatrix[9] = -feetShift(pose);

    this.figure?.update(t, dt, this.hover.x);
    this.terrain.program.uniforms.uContact.value = this.figure ? this.figureFade.v : 0;

    const rt = this.ensureTarget();
    const renderer = this.engine.renderer;
    const gl = this.gl;
    renderer.bindFramebuffer(rt);
    renderer.setViewport(rt.width, rt.height);
    renderer.setDepthMask(true);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderer.render({ scene: this.world, camera: cam, target: rt, clear: false, sort: false, frustumCull: false });

    if (now - this.hudAt > 125) {
      this.hudAt = now;
      this.writeHud();
    }
  }

  /**
   * Pass 2: dither onto the canvas. Layer 0 = ground (before the name), 1 = figure (after it).
   * `name` (the painted name's mask and box) lets the ground clear a halo around the letters.
   */
  composite(
    layer: 0 | 1,
    trail: Texture | null,
    W: number,
    H: number,
    name: { mask: Texture; rect: { left: number; top: number; width: number; height: number } } | null = null,
  ) {
    if (!this.visible || !this.rt || this.destroyed) return;
    const u = this.comp.uniforms;
    if (name && name.rect.width > 1) {
      const S = this.rect;
      const n = name.rect;
      u.tName.value = name.mask;
      u.uHasName.value = 1;
      u.uNameMap.value = [(S.left - n.left) / n.width, 1 - (S.top - n.top + S.height) / n.height, S.width / n.width, S.height / n.height];
    } else {
      u.tName.value = this.blank;
      u.uHasName.value = 0;
    }
    u.tColor.value = this.rt.textures[0];
    u.tData.value = this.rt.textures[1];
    u.tTrail.value = trail ?? this.blank;
    u.uHasTrail.value = trail ? 1 : 0;
    u.uRect.value = [this.rect.left, this.rect.top, this.rect.width, this.rect.height];
    u.uViewport.value = [W, H];
    u.uPlane.value = [this.rect.width, this.rect.height];
    u.uDpr.value = this.engine.dpr;
    u.uLayer.value = layer;
    u.uReveal.value = this.reveal.v;
    u.uFigure.value = this.figureFade.v;
    this.engine.renderer.render({ scene: this.quad, clear: false, frustumCull: false, sort: false });

    if (!this.started && layer === 1 && this.reveal.v > 0.02) {
      this.started = true;
      this.spec.el.querySelectorAll<HTMLElement>("[data-stage-fallback]").forEach((f) => (f.dataset.glOn = "1"));
    }
  }

  private writeHud() {
    const set = (k: string, v: string) => {
      const el = this.hud[k];
      if (el && el.textContent !== v) el.textContent = v;
    };
    const az = ((this.cam.az % 360) + 540) % 360 - 180;
    const sign = (v: number) => (v < 0 ? "−" : "+");
    set("az", `${sign(az)}${Math.abs(az).toFixed(1).padStart(5, "0")}°`);
    set("el", `${sign(this.cam.el)}${Math.abs(this.cam.el).toFixed(1).padStart(4, "0")}°`);
    set("dist", `${this.cam.dist.toFixed(2)} m`);
    set("tris", (this.terrainTris + (this.figure?.triangles ?? 0)).toLocaleString("en-US"));
  }

  setColors(c: SceneEngine["colors"]) {
    const u = this.comp.uniforms;
    u.uFg.value = c.fg;
    u.uBg.value = c.bg;
    u.uSignal.value = c.signal;
    const l = 0.299 * c.bg[0] + 0.587 * c.bg[1] + 0.114 * c.bg[2];
    u.uInvert.value = l > 0.5 ? 1 : 0;
  }

  destroy() {
    this.destroyed = true;
    this.off.forEach((f) => f());
    gsap.killTweensOf(this.reveal);
    gsap.killTweensOf(this.figureFade);
    if (!this.engine.contextLost) this.figure?.dispose();
    if (this.rt) this.engine.freeTarget(this.rt);
    this.rt = null;
    this.spec.el.querySelectorAll<HTMLElement>("[data-stage-fallback]").forEach((f) => delete f.dataset.glOn);
  }
}

function normalize(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
