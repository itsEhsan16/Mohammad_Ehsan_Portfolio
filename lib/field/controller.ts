"use client";

import { gsap } from "@/lib/motion/gsap";
import { getFieldBackdrop, setFieldBackdrop, type FieldBackdropState } from "@/lib/gl/registry";
import { setDragging } from "@/lib/cursor";
import type { FieldGeometry } from "./geometry";

/**
 * The feel of the field. Lengths are px and assume the card width the
 * geometry picks; everything eases against real elapsed time, so the field
 * settles the same at 60 Hz and 120 Hz.
 */
export const FIELD = {
  wheelSpeed: 2.6,
  dragSpeed: 1.35,
  /** camera smoothing per 60 Hz frame */
  lerp: 0.18,
  /** a horizontal push bleeds a little into vertical, so the field reads as a surface rather than two scrollbars */
  xToY: 0.1,
  /** px per input event after speed, so one hard flick can't teleport the field */
  maxDelta: 90,
  /** frames of release velocity carried on after a drag */
  throwTouch: 10,
  throwMouse: 3,
  /** cards shrink while the field moves, and come back when it settles */
  minScale: 0.32,
  scaleIn: 0.09,
  scaleOut: 0.075,
  scaleHold: 120,
  /** flattening along the direction of travel */
  squash: 0.2,
  /** corner rounding at full movement */
  radius: 150,
  /** RGB split at full movement */
  aberration: 11,
  /** nearby cards lean toward the pointer */
  magnet: 0.5,
  magnetRadius: 0.62,
  magnetLerp: 0.08,
  /** rest on a card this long and everything else steps back */
  dwell: 750,
  dim: 0.14,
  focusScale: 1.035,
  /** colour belongs to the middle of the screen; out at the edges a card is a blueprint */
  colourAt: 0.16,
  colourGone: 0.8,
  colourPow: 1.25,
  /** px a press may travel and still count as a click */
  slop: 6,
} as const;

export interface CellRef {
  el: HTMLElement;
  arrive: HTMLElement;
  plate: HTMLElement;
  frame: HTMLElement;
  blue: HTMLElement | null;
  item: number;
  col: number;
  row: number;
}

interface Cell extends CellRef {
  x: number;
  y: number;
  mx: number;
  my: number;
  s: number;
  op: number;
  g: number;
  tf: string;
  pt: string;
}

export interface FieldCallbacks {
  /** The tile nearest the middle of the screen changed. */
  onCentre?(item: number): void;
  /** Dwell (or keyboard) focus changed; -1 when nothing is held. */
  onFocus?(item: number): void;
  /** A card was clicked, tapped, or opened from the keyboard. */
  onOpen?(cell: CellRef, via: "pointer" | "keyboard"): void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mod = (v: number, n: number) => ((v % n) + n) % n;
const ease = (rate: number, dt: number) => 1 - Math.pow(1 - rate, dt * 60);

export class FieldController {
  geo: FieldGeometry;
  cells: Cell[] = [];
  /** Camera, in cells: (0, 0) centres the first tile. */
  cam = { u: 0, v: 0, tu: 0, tv: 0 };
  locked = false;
  readonly backdrop: FieldBackdropState = { panX: 0, panY: 0, moving: 0, dim: 0 };

  private scl = { now: 1, want: 1 };
  private moving = 0;
  private dirX = 1;
  private dirY = 0;
  private pointer = { x: -1e4, y: -1e4, in: false, type: "mouse" };
  private drag = { on: false, id: -1, x: 0, y: 0, sx: 0, sy: 0, far: false, vx: 0, vy: 0, t: 0 };
  private dwell = { cell: -1, at: 0 };
  private focus = -1;
  private centre = -1;
  private centreItem = -1;
  private kbd = false;
  private over = -1;
  private labelText = "";
  private radius = -1;
  private aberrOn = false;
  private coordsText = "";
  private scaleTimer = 0;
  private timers: number[] = [];
  private off: (() => void)[] = [];
  private offR: SVGFEOffsetElement | null;
  private offB: SVGFEOffsetElement | null;

  constructor(
    private root: HTMLElement,
    private world: HTMLElement,
    geo: FieldGeometry,
    private ui: { label?: HTMLElement | null; coords?: HTMLElement | null },
    private cb: FieldCallbacks,
    private reduced: boolean,
    start?: { u: number; v: number },
  ) {
    this.geo = geo;
    if (start && Number.isFinite(start.u) && Number.isFinite(start.v)) {
      this.cam = { u: start.u, v: start.v, tu: start.u, tv: start.v };
    }
    this.offR = root.querySelector<SVGFEOffsetElement>("[data-ab='r']");
    this.offB = root.querySelector<SVGFEOffsetElement>("[data-ab='b']");
    this.bind();
    setFieldBackdrop(this.backdrop);
    gsap.ticker.add(this.tick);
  }

  /* ───────────── cells ───────────── */

  setCells(refs: CellRef[], geo: FieldGeometry) {
    this.cells.forEach((c) => c.el.classList.remove("is-focus"));
    this.root.classList.remove("is-focused");
    const old = new Map(this.cells.map((c) => [c.el, c]));
    this.geo = geo;
    this.cells = refs.map((r) => {
      const prev = old.get(r.el);
      return prev ? { ...prev, ...r } : { ...r, x: 0, y: 0, mx: 0, my: 0, s: this.scl.now, op: -1, g: -1, tf: "", pt: "" };
    });
    this.focus = -1;
    this.dwell.cell = -1;
    this.centre = -1;
  }

  /** Put every card in its pre-arrival state (before first paint). */
  hold() {
    if (this.reduced) return;
    this.cells.forEach((c) => c.arrive.classList.add("is-waiting"));
  }

  /** Stream the cards in, in random order. */
  arrive(delay = 140, stagger = 26) {
    const list = this.cells.map((c) => c.arrive).filter((el) => el.classList.contains("is-waiting"));
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    list.forEach((el, i) => {
      this.timers.push(
        window.setTimeout(() => {
          // the transition goes on in its own frame, or there is no "before" to animate from
          el.classList.add("is-arriving");
          void el.offsetWidth;
          el.classList.remove("is-waiting");
          this.timers.push(window.setTimeout(() => el.classList.remove("is-arriving"), 980));
        }, delay + i * stagger),
      );
    });
  }

  /** Frame (picture) rect of a cell on screen right now. */
  frameRect(el: HTMLElement) {
    const c = this.cells.find((x) => x.el === el);
    return c && c.el.isConnected ? c.frame.getBoundingClientRect() : null;
  }

  lock(on: boolean) {
    this.locked = on;
    if (on) {
      this.release();
      this.dwell.cell = -1;
      this.setFocus(-1);
    }
    this.updateLabel();
  }

  /** Move the camera by whole cells (keyboard, HUD). */
  step(du: number, dv: number) {
    this.cam.tu = Math.round(this.cam.tu) + du;
    this.cam.tv = Math.round(this.cam.tv) + dv;
    this.kick(Math.max(Math.abs(du), Math.abs(dv)) * 0.6);
  }

  openCentre() {
    const c = this.cells[this.centre];
    if (c) this.cb.onOpen?.(c, "keyboard");
  }

  /* ───────────── input ───────────── */

  private bind() {
    const r = this.root;
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement | Window, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.off.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    const isUI = (e: Event) => !!(e.target as Element | null)?.closest?.("[data-field-ui]");

    // non-passive: a passive wheel listener can't stop the trackpad's back-swipe
    on(
      r,
      "wheel",
      (e) => {
        if (e.ctrlKey) return; // pinch-zoom stays the browser's
        e.preventDefault();
        if (this.locked) return;
        let dx = e.deltaX;
        let dy = e.deltaY;
        if (e.deltaMode === 1) {
          dx *= 16;
          dy *= 16;
        } else if (e.deltaMode === 2) {
          dx *= this.geo.W;
          dy *= this.geo.H;
        }
        if (e.shiftKey && !dx) {
          dx = dy;
          dy = 0;
        }
        // the wheel pushes the field away; a drag carries it with you
        this.push(-dx, -dy, FIELD.wheelSpeed);
        this.kbd = false;
      },
      { passive: false },
    );

    on(r, "pointerdown", (e) => {
      if (this.locked || isUI(e) || this.drag.on) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      this.pointer.type = e.pointerType;
      this.drag = { on: true, id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, far: false, vx: 0, vy: 0, t: performance.now() };
      this.kbd = false;
      r.classList.add("is-dragging");
      setDragging(true);
      try {
        r.setPointerCapture(e.pointerId);
      } catch {}
    });

    on(r, "pointermove", (e) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.in = true;
      this.pointer.type = e.pointerType;
      if (e.pointerType === "mouse") this.kbd = false;
      this.moveLabel();
      const d = this.drag;
      if (!d.on || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      if (!d.far && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > FIELD.slop) {
        d.far = true;
        this.updateLabel();
      }
      if (!d.far) return;
      // smoothed velocity in px per 60 Hz frame, for the throw on release
      const now = performance.now();
      const f = Math.max(1, (now - d.t) / 16.67);
      d.t = now;
      d.vx = d.vx * 0.6 + (dx / f) * 0.4;
      d.vy = d.vy * 0.6 + (dy / f) * 0.4;
      this.push(dx, dy, FIELD.dragSpeed);
    });

    const up = (e: PointerEvent) => {
      const d = this.drag;
      if (!d.on || e.pointerId !== d.id) return;
      const wasDrag = d.far;
      if (wasDrag && performance.now() - d.t < 90 && !this.reduced) {
        const k = e.pointerType === "touch" ? FIELD.throwTouch : FIELD.throwMouse;
        this.cam.tu -= (d.vx * k * FIELD.dragSpeed) / this.geo.pitchX;
        this.cam.tv -= (d.vy * k * FIELD.dragSpeed) / this.geo.pitchY;
      }
      this.release();
      if (!wasDrag && !this.locked) {
        const i = this.cellAt(e.clientX, e.clientY);
        if (i >= 0) this.cb.onOpen?.(this.cells[i], "pointer");
      }
    };
    on(r, "pointerup", up);
    on(r, "pointercancel", () => this.release());
    on(r, "pointerleave", (e) => {
      if (e.pointerType !== "mouse") return;
      this.pointer.in = false;
      this.updateLabel();
    });
    on(window, "blur", () => this.release());

    on(r, "focus", () => {
      if (r.matches(":focus-visible")) this.kbd = true;
    });
    on(r, "blur", () => (this.kbd = false));
  }

  /** Keyboard, routed from the page (focus may be on the heading after a transition). True when handled. */
  key(e: KeyboardEvent) {
    if (this.locked) return false;
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const s = steps[e.key];
    if (s) {
      this.kbd = true;
      this.step(s[0], s[1]);
      return true;
    }
    if (e.key === "Enter" || e.key === " ") {
      this.openCentre();
      return true;
    }
    return false;
  }

  private release() {
    const d = this.drag;
    if (!d.on) return;
    d.on = false;
    try {
      this.root.releasePointerCapture(d.id);
    } catch {}
    d.id = -1;
    this.root.classList.remove("is-dragging");
    setDragging(false);
    this.updateLabel();
  }

  private push(dx: number, dy: number, speed: number) {
    const M = FIELD.maxDelta;
    const cx = clamp(dx * speed, -M, M);
    const cy = clamp(dy * speed, -M, M);
    // the camera moves against the field
    this.cam.tu -= cx / this.geo.pitchX;
    this.cam.tv -= (cy + cx * FIELD.xToY) / this.geo.pitchY;
    this.kick(Math.max(Math.abs(cx), Math.abs(cy)) / M);
    this.dwell.cell = -1;
  }

  private kick(strength: number) {
    if (this.reduced) return;
    this.scl.want = 1 + (FIELD.minScale - 1) * clamp(strength, 0, 1);
    window.clearTimeout(this.scaleTimer);
    this.scaleTimer = window.setTimeout(() => (this.scl.want = 1), FIELD.scaleHold);
  }

  /** Arithmetic hit test: cells are pointer-events: none, or the pictures would swallow the drag. */
  private cellAt(x: number, y: number) {
    const hw = this.geo.cardW / 2;
    const hh = this.geo.plateH / 2;
    let best = Infinity;
    let hit = -1;
    this.cells.forEach((c, i) => {
      const ex = Math.abs(x - c.x);
      const ey = Math.abs(y - c.y);
      if (ex <= hw * c.s && ey <= hh * c.s) {
        const d = ex * ex + ey * ey;
        if (d < best) {
          best = d;
          hit = i;
        }
      }
    });
    return hit;
  }

  /* ───────────── cursor label ───────────── */

  private labelW = 90;

  /** Beside the pointer like a tooltip (+18, +22), flipped near the right and bottom edges. */
  private moveLabel() {
    const el = this.ui.label;
    if (!el || this.pointer.type !== "mouse") return;
    const w = this.labelW;
    const x = this.pointer.x + 18 + w > this.geo.W - 8 ? this.pointer.x - 10 - w : this.pointer.x + 18;
    const y = this.pointer.y + 22 + 22 > this.geo.H - 8 ? this.pointer.y - 30 : this.pointer.y + 22;
    el.style.transform = `translate3d(${x}px,${y}px,0)`;
  }

  private updateLabel() {
    // the hand over a card (the field itself shows the open hand)
    this.root.classList.toggle(
      "is-over",
      this.over >= 0 && this.pointer.in && this.pointer.type === "mouse" && !this.locked && !(this.drag.on && this.drag.far),
    );
    const el = this.ui.label;
    if (!el) return;
    let text = "";
    if (this.pointer.in && this.pointer.type === "mouse") {
      if (this.locked) text = el.dataset.close ?? "Click to close";
      else if (this.drag.on && this.drag.far) text = "";
      else if (this.over >= 0) text = el.dataset.open ?? "Click to open";
    }
    if (text === this.labelText) return;
    this.labelText = text;
    if (text) {
      el.textContent = text;
      this.labelW = el.offsetWidth || this.labelW;
      this.moveLabel();
    }
    el.classList.toggle("is-on", !!text);
  }

  /* ───────────── focus ───────────── */

  private setFocus(i: number) {
    if (i === this.focus) return;
    const prev = this.cells[this.focus];
    if (prev) prev.el.classList.remove("is-focus");
    this.focus = i;
    const next = this.cells[i];
    if (next) next.el.classList.add("is-focus");
    this.root.classList.toggle("is-focused", i >= 0);
    this.cb.onFocus?.(next ? next.item : -1);
  }

  /* ───────────── frame ───────────── */

  private tick = () => {
    const g = this.geo;
    if (!this.cells.length) return;
    const now = performance.now();
    const dt = Math.min(0.1, gsap.ticker.deltaRatio(60) / 60);

    // camera
    const k = this.reduced ? 1 : ease(FIELD.lerp, dt);
    this.cam.u += (this.cam.tu - this.cam.u) * k;
    this.cam.v += (this.cam.tv - this.cam.v) * k;
    // movement is the distance the ease still has to close, so it decays with the glide rather than snapping off on release
    const gx = (this.cam.tu - this.cam.u) * g.pitchX;
    const gy = (this.cam.tv - this.cam.v) * g.pitchY;
    const gap = Math.hypot(gx, gy);
    this.moving = this.reduced ? 0 : clamp(gap / 120, 0, 1);
    if (gap > 0.01) {
      this.dirX = -gx / gap;
      this.dirY = -gy / gap;
    }
    const rate = this.scl.want < this.scl.now ? FIELD.scaleIn : FIELD.scaleOut;
    this.scl.now += (this.scl.want - this.scl.now) * ease(rate, dt);

    // field-wide properties, written only when they change
    const rad = Math.round(FIELD.radius * this.moving);
    if (rad !== this.radius) {
      this.radius = rad;
      this.root.style.setProperty("--wf-r", rad + "px");
    }
    const ab = FIELD.aberration * this.moving;
    const abOn = ab > 0.15 && !!this.offR && !!this.offB;
    if (abOn) {
      this.offR!.setAttribute("dx", (ab * this.dirX).toFixed(2));
      this.offR!.setAttribute("dy", (ab * this.dirY).toFixed(2));
      this.offB!.setAttribute("dx", (-ab * this.dirX).toFixed(2));
      this.offB!.setAttribute("dy", (-ab * this.dirY).toFixed(2));
    }
    if (abOn !== this.aberrOn) {
      this.aberrOn = abOn;
      this.world.classList.toggle("is-split", abOn);
    }

    // pass 1: where every card is (the dwell test needs the final boxes)
    const W = g.W;
    const H = g.H;
    const hw = g.cardW / 2;
    const hh = g.plateH / 2;
    const tw = g.cols * g.pitchX;
    const th = g.rows * g.pitchY;
    const P = this.pointer;
    const magOn = P.in && P.type === "mouse" && !this.reduced && !this.locked;
    const magR = g.cardW * FIELD.magnetRadius;
    const km = ease(FIELD.magnetLerp, dt);
    let over = -1;
    let bestOver = Infinity;
    let centre = -1;
    let bestCentre = Infinity;
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      const x = mod((c.col - g.cx - this.cam.u) * g.pitchX + tw / 2, tw) + W / 2 - tw / 2;
      const y = mod((c.row - g.cy - this.cam.v) * g.pitchY + th / 2, th) + H / 2 - th / 2;
      let tx = 0;
      let ty = 0;
      if (magOn) {
        const dx = P.x - x;
        const dy = P.y - y;
        const d = Math.hypot(dx, dy);
        if (d < magR && d > 0.001) {
          const f = 1 - d / magR;
          tx = dx * FIELD.magnet * f * f;
          ty = dy * FIELD.magnet * f * f;
        }
      }
      // a card that has just wrapped must not glide back across the screen
      if (Math.abs(x - c.x) > g.pitchX * 2 || Math.abs(y - c.y) > g.pitchY * 2) {
        c.mx = tx;
        c.my = ty;
      } else {
        c.mx += (tx - c.mx) * km;
        c.my += (ty - c.my) * km;
      }
      c.x = x + c.mx;
      c.y = y + c.my;
      if (P.in && !this.drag.on && !this.locked) {
        const ex = Math.abs(P.x - c.x);
        const ey = Math.abs(P.y - c.y);
        if (ex <= hw * c.s && ey <= hh * c.s) {
          const d2 = ex * ex + ey * ey;
          if (d2 < bestOver) {
            bestOver = d2;
            over = i;
          }
        }
      }
      const dc = (c.x - W / 2) ** 2 + (c.y - H / 2) ** 2;
      if (dc < bestCentre) {
        bestCentre = dc;
        centre = i;
      }
    }

    if (over !== this.over) {
      this.over = over;
      this.updateLabel();
    }
    if (centre !== this.centre) {
      this.centre = centre;
      const item = this.cells[centre]?.item ?? -1;
      if (item !== this.centreItem) {
        this.centreItem = item;
        this.cb.onCentre?.(item);
      }
    }

    // focus: dwell for a mouse, the centred card for the keyboard
    if (!this.locked) {
      if (this.kbd) {
        this.setFocus(centre);
      } else if (P.type === "mouse") {
        if (over !== this.dwell.cell) {
          this.dwell.cell = over;
          this.dwell.at = over >= 0 ? now : 0;
        }
        const held = this.dwell.cell >= 0 && now - this.dwell.at >= FIELD.dwell ? this.dwell.cell : -1;
        this.setFocus(held);
      } else {
        this.setFocus(-1);
      }
    }

    // pass 2: write it — the cell carries place and size, the plate carries the distortion
    const sq = this.reduced ? 0 : FIELD.squash * this.moving;
    const plateTf = sq > 0.002 ? `scale(${(1 - sq * Math.abs(this.dirX)).toFixed(3)},${(1 - sq * Math.abs(this.dirY)).toFixed(3)})` : "";
    const kS = ease(0.14, dt);
    const near = W * FIELD.colourAt;
    const far = W * FIELD.colourGone;
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      const isF = i === this.focus;
      const want = this.scl.now * (isF ? FIELD.focusScale : 1);
      c.s += (want - c.s) * (this.reduced ? 1 : kS);
      const s = c.s;
      const tf = `translate3d(${(c.x - hw * s).toFixed(1)}px,${(c.y - hh * s).toFixed(1)}px,0) scale(${s.toFixed(4)})`;
      if (tf !== c.tf) {
        c.tf = tf;
        c.el.style.transform = tf;
      }
      const op = this.focus < 0 || isF ? 1 : FIELD.dim;
      if (op !== c.op) {
        c.op = op;
        c.el.style.opacity = String(op);
      }
      if (c.blue) {
        // a cross-fade between two constant layers, never a filter that changes per frame
        const t = clamp((Math.hypot(c.x - W / 2, c.y - H / 2) - near) / (far - near), 0, 1);
        const gv = Math.round(Math.pow(t, FIELD.colourPow) * 50) / 50;
        if (gv !== c.g) {
          c.g = gv;
          c.blue.style.opacity = String(gv);
        }
      }
      if (plateTf !== c.pt) {
        c.pt = plateTf;
        c.plate.style.transform = plateTf;
      }
    }

    // readouts and the backdrop
    const coords = this.ui.coords;
    if (coords) {
      const f = (n: number) => (n < 0 ? "−" : "+") + Math.abs(n).toFixed(2).padStart(6, "0");
      const text = `X${f(this.cam.u)} Y${f(-this.cam.v)}`;
      if (text !== this.coordsText) {
        this.coordsText = text;
        coords.textContent = text;
      }
    }
    const bd = this.backdrop;
    bd.panX = this.cam.u * g.pitchX;
    bd.panY = this.cam.v * g.pitchY;
    bd.moving = this.moving;
    bd.dim = this.locked ? 1 : this.focus >= 0 ? 0.6 : 0;
  };

  destroy() {
    gsap.ticker.remove(this.tick);
    this.off.forEach((f) => f());
    if (this.drag.on) setDragging(false);
    this.root.classList.remove("is-over", "is-dragging");
    this.timers.forEach((t) => window.clearTimeout(t));
    window.clearTimeout(this.scaleTimer);
    if (getFieldBackdrop() === this.backdrop) setFieldBackdrop(null);
  }
}
