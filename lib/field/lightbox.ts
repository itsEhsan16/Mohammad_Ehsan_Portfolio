"use client";

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Click a card and its picture flies to the middle; close it and it flies back
 * to the card it came from. A FLIP rather than a fade: the box is laid out at
 * its final size and transformed back onto the card, so only one transform is
 * interpolated and it reads as the same picture, not a second copy.
 */
export class Lightbox {
  open = false;
  private raf = 0;
  private openedAt = 0;

  constructor(
    private els: { root: HTMLElement; box: HTMLElement; caption: HTMLElement | null },
    private reduced: boolean,
  ) {}

  /** As large as fits between the header and the caption, at the picture's own aspect ratio. */
  dest(aspect: number): Rect {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const mobile = W < 640;
    const top = mobile ? 92 : 100;
    const bottom = mobile ? 210 : 150;
    const availW = W * (mobile ? 0.92 : 0.72);
    const availH = Math.max(120, H - top - bottom);
    let w = availW;
    let h = w / aspect;
    if (h > availH) {
      h = availH;
      w = h * aspect;
    }
    return { left: (W - w) / 2, top: top + (availH - h) / 2, width: w, height: h };
  }

  /** Lay the box (and its caption) out at the destination, with no flight. */
  private place(aspect: number) {
    const { box, caption } = this.els;
    const to = this.dest(aspect);
    Object.assign(box.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
    if (caption) Object.assign(caption.style, { left: `${to.left}px`, top: `${to.top + to.height + 18}px`, width: `${to.width}px` });
    return to;
  }

  /** The viewport changed while a picture is up. */
  relayout(aspect: number) {
    if (this.open) this.place(aspect);
  }

  show(from: Rect | null, aspect: number) {
    cancelAnimationFrame(this.raf);
    const { box, root } = this.els;
    const to = this.place(aspect);
    box.style.transition = "none";
    box.style.opacity = "1";
    // uniform scale from the width: the picture never stretches on the way
    box.style.transform =
      from && !this.reduced
        ? `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})`
        : "none";
    void box.offsetWidth;
    if (from && !this.reduced) {
      box.style.transition = "transform 600ms cubic-bezier(.16,.84,.32,1)";
      box.style.transform = "translate(0px, 0px) scale(1)";
    }
    root.classList.remove("is-flying");
    root.classList.add("is-open");
    this.open = true;
    this.openedAt = performance.now();
  }

  /** Fly home. The card keeps moving while the picture is up, so the target is re-read every frame. */
  hide(target: () => Rect | null, done?: () => void) {
    if (!this.open) return;
    this.open = false;
    cancelAnimationFrame(this.raf);
    const { box, root } = this.els;
    const from = { left: parseFloat(box.style.left), top: parseFloat(box.style.top), width: parseFloat(box.style.width) || 1 };
    root.classList.remove("is-open");
    root.classList.add("is-flying");
    box.style.transition = "none";
    const finish = () => {
      root.classList.remove("is-flying");
      box.style.opacity = "";
      box.style.transform = "";
      done?.();
    };
    if (this.reduced || !target()) {
      finish();
      return;
    }
    const t0 = performance.now();
    const ms = 480;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const r = target();
      if (r && r.width > 0) {
        const k = 1 + (r.width / from.width - 1) * e;
        box.style.transform = `translate(${(r.left - from.left) * e}px, ${(r.top - from.top) * e}px) scale(${k})`;
      }
      // fade over the last fifth: the card underneath is the same picture in the same place by then
      box.style.opacity = String(1 - Math.max(0, (t - 0.8) / 0.2));
      if (t < 1) {
        this.raf = requestAnimationFrame(step);
        return;
      }
      finish();
    };
    this.raf = requestAnimationFrame(step);
  }

  /** True just after opening, so the tail of the gesture that opened it can't close it. */
  get settling() {
    return performance.now() - this.openedAt < 260;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}
