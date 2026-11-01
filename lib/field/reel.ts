"use client";

import { gsap } from "@/lib/motion/gsap";
import { getFieldBackdrop, setFieldBackdrop, type FieldBackdropState } from "@/lib/gl/registry";
import { setDragging } from "@/lib/cursor";

export type ReelLayout = "list" | "wheel";

/** The feel of the LIST / WHEEL strip. Eased against real elapsed time, like the field. */
export const REEL = {
  wheelSpeed: 1,
  dragSpeed: 1.15,
  /** px per input event, so one hard flick can't skip half the strip */
  maxDelta: 140,
  /** strip easing per 60 Hz frame */
  lerp: 0.11,
  /** list ↔ wheel easing per 60 Hz frame; rows near the middle morph first */
  morph: 0.1,
  /** ms without input before the strip settles on a row */
  snapDelay: 160,
  /** frames of release velocity carried on after a drag */
  throwTouch: 14,
  throwMouse: 6,
  /** in the list, rows spread apart with speed */
  stretch: 0.14,
  /** on the wheel, rows fade between these angles (rad) and shrink toward the edge */
  fadeFrom: 0.55,
  fadeTo: 1.05,
  shrink: 0.12,
  slop: 6,
} as const;

export interface ReelGeometry {
  W: number;
  H: number;
  /** css px: left edge of the titles, row pitch, wheel radius */
  x0: number;
  pitch: number;
  radius: number;
  /** keep-out at the top (header) and bottom (switcher) for the preview card */
  top: number;
  bottom: number;
}

export interface ReelRowRef {
  el: HTMLElement;
  /** row number along the strip */
  k: number;
  /** project index */
  item: number;
}

interface Row extends ReelRowRef {
  w: number;
  width: number;
  y: number;
  tf: string;
  op: number;
  delay: number;
}

export interface ReelCallbacks {
  /** The highlighted project changed. */
  onActive?(item: number, via: "pointer" | "keyboard" | "auto"): void;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (rate: number, dt: number) => 1 - Math.pow(1 - rate, dt * 60);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** wrap into [-L/2, L/2): the strip is a loop, so every row is always somewhere near the middle */
const wrapC = (v: number, L: number) => {
  const n = ((v % L) + L) % L;
  return n >= L / 2 ? n - L : n;
};

export class ReelController {
  layout: ReelLayout;
  readonly backdrop: FieldBackdropState = { panX: 0, panY: 0, moving: 0, dim: 0 };

  private rows: Row[] = [];
  private geo: ReelGeometry;
  private pos = 0;
  private target = 0;
  private vel = 0;
  private lastInput = 0;
  private drag = { on: false, id: -1, y: 0, sx: 0, sy: 0, far: false, v: 0, t: 0, type: "mouse" };
  private pointer = { x: -1e4, y: -1e4, in: false };
  private hoverCapable: boolean;
  private kbd = false;
  private active = -1;
  private activeItem = -1;
  private cardY = Number.NaN;
  private cardTf = "";
  private suppressClick = false;
  private introAt = Number.POSITIVE_INFINITY;
  private off: (() => void)[] = [];

  constructor(
    private root: HTMLElement,
    layout: ReelLayout,
    geo: ReelGeometry,
    private ui: { card?: HTMLElement | null },
    private cb: ReelCallbacks,
    private reduced: boolean,
    start = 0,
  ) {
    this.layout = layout;
    this.geo = geo;
    this.pos = this.target = start;
    this.hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced) this.introAt = 0;
    this.bind();
    setFieldBackdrop(this.backdrop);
    gsap.ticker.add(this.tick);
  }

  /* ───────────── setup ───────────── */

  setRows(refs: ReelRowRef[], geo: ReelGeometry) {
    this.geo = geo;
    const old = new Map(this.rows.map((r) => [r.el, r]));
    const w0 = this.layout === "wheel" ? 1 : 0;
    this.rows = refs.map((r) => {
      const prev = old.get(r.el);
      return { ...r, w: prev?.w ?? w0, width: r.el.scrollWidth, y: prev?.y ?? 0, tf: "", op: -1, delay: prev?.delay ?? 0 };
    });
    // the card is measured once per layout
    this.cardY = Number.NaN;
  }

  setLayout(layout: ReelLayout) {
    if (layout === this.layout) return;
    this.layout = layout;
    if (layout === "wheel") this.lastInput = 0; // settle on a row straight away
  }

  /** Rows rise in from the middle outward. */
  intro() {
    if (this.reduced) return;
    const L = this.rows.length * this.geo.pitch;
    const ranked = this.rows
      .map((r) => ({ r, d: Math.abs(wrapC(r.k * this.geo.pitch - this.pos, L)) }))
      .sort((a, b) => a.d - b.d);
    ranked.forEach(({ r }, i) => (r.delay = Math.min(i, 12) * 45));
    this.introAt = performance.now();
  }

  /** Strip position, so a remount (or a later visit) can come back to the same project. */
  get position() {
    return this.target;
  }

  /* ───────────── input ───────────── */

  private bind() {
    const r = this.root;
    const on = <K extends keyof HTMLElementEventMap>(
      t: HTMLElement | Window,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.off.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };

    on(
      r,
      "wheel",
      (e) => {
        if (e.ctrlKey) return;
        e.preventDefault();
        let d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (e.deltaMode === 1) d *= 32;
        else if (e.deltaMode === 2) d *= this.geo.H;
        this.target += clamp(d * REEL.wheelSpeed, -REEL.maxDelta, REEL.maxDelta);
        this.lastInput = performance.now();
        this.kbd = false;
      },
      { passive: false },
    );

    on(r, "pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if ((e.target as Element | null)?.closest?.("[data-reel-ui]")) return;
      this.drag = { on: true, id: e.pointerId, y: e.clientY, sx: e.clientX, sy: e.clientY, far: false, v: 0, t: performance.now(), type: e.pointerType };
      this.kbd = false;
    });

    on(r, "pointermove", (e) => {
      this.pointer = { x: e.clientX, y: e.clientY, in: true };
      if (e.pointerType === "mouse") this.kbd = false;
      const d = this.drag;
      if (!d.on || e.pointerId !== d.id) return;
      if (!d.far) {
        if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) <= REEL.slop) return;
        d.far = true;
        d.y = e.clientY;
        r.classList.add("is-dragging");
        setDragging(true);
        try {
          r.setPointerCapture(e.pointerId);
        } catch {}
        return;
      }
      const dy = e.clientY - d.y;
      d.y = e.clientY;
      const now = performance.now();
      const f = Math.max(1, (now - d.t) / 16.67);
      d.t = now;
      d.v = d.v * 0.6 + (dy / f) * 0.4;
      // drag the strip with you: pulling down brings earlier projects in
      this.target -= clamp(dy * REEL.dragSpeed, -REEL.maxDelta, REEL.maxDelta);
      this.lastInput = now;
    });

    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (!d.on || e.pointerId !== d.id) return;
      d.on = false;
      if (d.far) {
        if (performance.now() - d.t < 90 && !this.reduced) {
          this.target -= d.v * (d.type === "touch" ? REEL.throwTouch : REEL.throwMouse) * REEL.dragSpeed;
        }
        // the click that follows a drag must not open a project
        this.suppressClick = true;
        window.setTimeout(() => (this.suppressClick = false), 0);
        this.lastInput = performance.now();
        r.classList.remove("is-dragging");
        setDragging(false);
        try {
          r.releasePointerCapture(e.pointerId);
        } catch {}
      }
    };
    on(r, "pointerup", end);
    on(r, "pointercancel", end);
    on(r, "pointerleave", (e) => {
      if (e.pointerType === "mouse") this.pointer.in = false;
    });
    on(
      r,
      "click",
      (e) => {
        if (!this.suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
        this.suppressClick = false;
      },
      { capture: true },
    );
  }

  /** Keyboard, routed from the page (focus may be on the heading after a transition). */
  key(e: KeyboardEvent) {
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (dir) {
      this.kbd = true;
      this.target = Math.round(this.target / this.geo.pitch) * this.geo.pitch + dir * this.geo.pitch;
      this.lastInput = performance.now();
      return true;
    }
    if (e.key === "Enter" || e.key === " ") {
      this.rows.find((r) => r.k === this.active)?.el.click();
      return true;
    }
    return false;
  }

  /* ───────────── frame ───────────── */

  private tick = () => {
    const g = this.geo;
    if (!this.rows.length) return;
    const now = performance.now();
    const dt = Math.min(0.1, gsap.ticker.deltaRatio(60) / 60);
    const p = g.pitch;
    const L = this.rows.length * p;

    // settle on a row when idle: always on the wheel; in the list only without hover (touch, keyboard)
    const snaps = this.layout === "wheel" || !this.hoverCapable || this.kbd;
    if (snaps && !this.drag.on && now - this.lastInput > REEL.snapDelay) {
      this.target = Math.round(this.target / p) * p;
    }
    const prev = this.pos;
    this.pos += (this.target - this.pos) * (this.reduced ? 1 : ease(REEL.lerp, dt));
    if (Math.abs(this.target - this.pos) < 0.05) this.pos = this.target;
    this.vel = (this.pos - prev) / Math.max(dt * 60, 0.001);
    const speed = clamp(Math.abs(this.vel) / 60, 0, 1);

    const H2 = g.H / 2;
    const stretch = 1 + (this.reduced ? 0 : speed * REEL.stretch);
    const wantW = this.layout === "wheel" ? 1 : 0;
    let centre = -1;
    let bestC = Infinity;
    let hover = -1;
    const P = this.pointer;
    const canHover = this.hoverCapable && P.in && !this.drag.on && !this.kbd && this.layout === "list";

    for (const r of this.rows) {
      const a = wrapC(r.k * p - this.pos, L);
      if (Math.abs(a) < bestC) {
        bestC = Math.abs(a);
        centre = r.k;
      }
      // morph: rows near the middle get there first
      const rate = REEL.morph * (1.15 - 0.5 * Math.min(1, Math.abs(a) / (g.H * 0.75)));
      r.w += (wantW - r.w) * (this.reduced ? 1 : ease(rate, dt));
      if (Math.abs(wantW - r.w) < 0.001) r.w = wantW;

      // list: a column through the middle of the screen
      const yL = H2 + a * stretch - p / 2;
      // wheel: spokes of a circle whose hub sits off-screen to the left
      const th = a / g.radius;
      const xW = g.x0 + g.radius * (Math.cos(th) - 1);
      const yW = H2 + g.radius * Math.sin(th) - p / 2;
      const sW = 1 - REEL.shrink * Math.min(1, Math.abs(th) / 0.9);
      const oW = 1 - smooth(REEL.fadeFrom, REEL.fadeTo, Math.abs(th));
      const w = r.w;
      const x = g.x0 + (xW - g.x0) * w;
      let y = yL + (yW - yL) * w;
      const rot = th * w;
      const s = 1 + (sW - 1) * w;
      let op = 1 + (oW - 1) * w;

      // entrance
      if (!this.reduced) {
        const t = clamp((now - this.introAt - r.delay) / 700, 0, 1);
        const e = 1 - Math.pow(1 - t, 3);
        y += (1 - e) * 56;
        op *= e;
      }
      r.y = y;

      if (canHover && P.y >= y && P.y <= y + p && P.x >= x - 24 && P.x <= x + r.width + 48) hover = r.k;

      const visible = op > 0.02 && y > -p * 2 && y < g.H + p;
      const tf = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(4)}rad) scale(${s.toFixed(4)})`;
      if (tf !== r.tf) {
        r.tf = tf;
        r.el.style.transform = tf;
      }
      const o = visible ? Math.round(op * 100) / 100 : 0;
      if (o !== r.op) {
        r.op = o;
        r.el.style.opacity = String(o);
        r.el.style.visibility = o === 0 ? "hidden" : "";
      }
    }

    // which project is highlighted: the hovered row in the list, the middle row otherwise
    let next = this.active;
    let via: "pointer" | "keyboard" | "auto" = "auto";
    if (this.layout === "wheel" || !this.hoverCapable || this.kbd || this.active < 0) {
      next = centre;
      via = this.kbd ? "keyboard" : "auto";
    } else if (hover >= 0) {
      next = hover;
      via = "pointer";
    }
    if (next !== this.active) {
      this.rows.find((r) => r.k === this.active)?.el.classList.remove("is-active");
      this.active = next;
      const row = this.rows.find((r) => r.k === next);
      row?.el.classList.add("is-active");
      if (row && row.item !== this.activeItem) {
        this.activeItem = row.item;
        this.cb.onActive?.(row.item, via);
      }
    }

    // the preview card rides beside the highlighted row in the list, and holds the middle on the wheel
    const card = this.ui.card;
    if (card) {
      const ch = card.offsetHeight;
      const row = this.rows.find((r) => r.k === this.active);
      const wheel = this.rows.length ? this.rows.reduce((s, r) => s + r.w, 0) / this.rows.length : 0;
      const listY = row ? row.y + p / 2 - ch / 2 : H2 - ch / 2;
      const want = clamp(listY + (H2 - ch / 2 - listY) * wheel, g.top, Math.max(g.top, g.H - g.bottom - ch));
      this.cardY = Number.isNaN(this.cardY) ? want : this.cardY + (want - this.cardY) * (this.reduced ? 1 : ease(0.14, dt));
      const tf = `translate3d(0,${this.cardY.toFixed(1)}px,0)`;
      if (tf !== this.cardTf) {
        this.cardTf = tf;
        card.style.transform = tf;
      }
    }

    const bd = this.backdrop;
    bd.panX = 0;
    bd.panY = this.pos;
    bd.moving = speed;
    bd.dim = 0;
  };

  destroy() {
    gsap.ticker.remove(this.tick);
    this.off.forEach((f) => f());
    if (this.drag.on && this.drag.far) setDragging(false);
    if (getFieldBackdrop() === this.backdrop) setFieldBackdrop(null);
  }
}

/** Type size, row pitch and wheel radius for a viewport. The component writes fs/pitch to CSS so both agree. */
export function reelGeometry(W: number, H: number): ReelGeometry & { fs: number; mobile: boolean } {
  const mobile = W < 768;
  const fs = clamp(W * (mobile ? 0.1 : 0.052), 36, 90);
  const pitch = Math.round(fs * 1.06);
  return {
    W,
    H,
    fs,
    mobile,
    pitch,
    x0: clamp(W * 0.025, 16, 40),
    radius: Math.max(H * 0.75, 320),
    top: mobile ? 88 : 96,
    bottom: 66,
  };
}

/** How many times the projects repeat so the loop always overfills the screen (and the wheel's visible arc). */
export function reelRepeats(g: ReelGeometry, count: number) {
  const need = Math.max(g.H + 4 * g.pitch, 2 * g.radius * REEL.fadeTo + 2 * g.pitch);
  return Math.max(3, Math.ceil(need / (count * g.pitch)));
}
