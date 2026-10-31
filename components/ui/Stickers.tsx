"use client";

import { useEffect, useRef } from "react";
import { gsap, finePointer, motionOK } from "@/lib/motion/gsap";
import { setState } from "@/lib/store";
import { site } from "@/content/site";
import { tick, click } from "@/lib/audio";

type StickerDef = {
  id: string;
  style: React.CSSProperties;
  rotate: number;
  className: string;
  content: React.ReactNode;
  onActivate?: () => void;
  label: string;
};

const STICKERS: StickerDef[] = [
  {
    id: "open",
    label: site.availability.label,
    style: { left: "34%", top: "8%" },
    rotate: -9,
    className: "holo rounded-full px-5 py-2.5 text-ink",
    content: (
      <span className="t-label flex items-center gap-2 text-[12px] font-semibold">
        <span className="h-2 w-2 rounded-full bg-ink" /> {site.availability.label}
      </span>
    ),
  },
  {
    id: "stack",
    label: "React · Next.js · TypeScript",
    style: { right: "6%", top: "12%" },
    rotate: 7,
    className: "rounded-[14px] bg-orange px-4 py-3 text-ink",
    content: <span className="t-label block text-[12px] font-semibold leading-tight">React · Next.js<br />TypeScript</span>,
  },
  {
    id: "base",
    label: site.location.label,
    style: { left: "8%", bottom: "16%" },
    rotate: -5,
    className: "grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-ink/70 bg-bone text-ink",
    content: (
      <span className="t-label text-center text-[11px] font-semibold leading-tight">
        Based in
        <br />
        <span className="font-display text-[22px] leading-none">INDIA</span>
        <br />
        IST · +05:30
      </span>
    ),
  },
  {
    id: "since",
    label: `Shipping since ${site.since}`,
    style: { left: "52%", bottom: "8%" },
    rotate: 12,
    className: "grid h-32 w-32 place-items-center text-bone",
    content: (
      <span className="relative grid h-full w-full place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path
            fill="#0b0b0a"
            stroke="#edeae4"
            strokeWidth="1.2"
            d="M50 2 58 17 75 9 76 27 94 28 85 44 98 56 82 63 87 81 69 79 63 96 50 85 37 96 31 79 13 81 18 63 2 56 15 44 6 28 24 27 25 9 42 17Z"
          />
        </svg>
        <span className="t-label relative text-center text-[10px] font-semibold leading-tight">
          Since
          <br />
          <span className="font-display text-[26px] leading-none">{site.since}</span>
        </span>
      </span>
    ),
  },
  {
    id: "cmdk",
    label: "Open command menu",
    style: { right: "18%", bottom: "30%" },
    rotate: -11,
    className:
      "grid h-16 w-16 place-items-center rounded-xl border border-ink/20 bg-bone text-ink shadow-[0_6px_0_#b9b4aa,0_14px_30px_rgba(0,0,0,.35)]",
    content: <span className="font-mono text-[20px] font-semibold">⌘K</span>,
    onActivate: () => setState({ cmdOpen: true }),
  },
];

/** Draggable holographic stickers (GSAP Draggable + Inertia). Decorative; each is also a real button. */
export function Stickers() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-sticker]"));
    if (motionOK()) {
      gsap.from(els, {
        scale: 0,
        rotation: -35,
        duration: 1,
        ease: "spring",
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: "top 70%", once: true },
      });
    }

    let z = 10;
    let draggables: { kill: () => void }[] = [];
    let cancelled = false;
    // drag only with a mouse/trackpad — on touch the stickers are just decoration.
    // Draggable + Inertia are loaded on demand to keep them out of the initial bundle.
    const loadDrag = () =>
      Promise.all([import("gsap/Draggable"), import("gsap/InertiaPlugin")]).then(([{ Draggable }, { InertiaPlugin }]) => {
        if (cancelled) return;
        gsap.registerPlugin(Draggable, InertiaPlugin);
        draggables = Draggable.create(els, {
          type: "x,y",
          bounds: root,
          inertia: true,
          zIndexBoost: false,
          onPress() {
            (this.target as HTMLElement).style.zIndex = String(++z);
            gsap.to(this.target, { scale: 1.08, duration: 0.3, ease: "spring" });
            tick();
          },
          onRelease() {
            gsap.to(this.target, { scale: 1, duration: 0.5, ease: "spring" });
          },
          onClick() {
            click();
            const id = (this.target as HTMLElement).dataset.sticker;
            STICKERS.find((s) => s.id === id)?.onActivate?.();
          },
        });
      });
    // fetch the drag plugins only when the footer is about to be seen
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void loadDrag();
        }
      },
      { rootMargin: "50% 0px" },
    );
    if (finePointer()) io.observe(root);

    // holographic shine follows the pointer
    const shine = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    const holos = Array.from(root.querySelectorAll<HTMLElement>(".holo"));
    holos.forEach((h) => h.addEventListener("pointermove", shine));

    return () => {
      cancelled = true;
      io.disconnect();
      draggables.forEach((d) => d.kill());
      holos.forEach((h) => h.removeEventListener("pointermove", shine));
    };
  }, []);

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-10 hidden sm:block">
      {STICKERS.map((s) => (
        <button
          key={s.id}
          type="button"
          data-sticker={s.id}
          data-rot={s.rotate}
          data-cursor="drag"
          aria-label={s.label}
          className="pointer-events-auto absolute select-none touch-none"
          style={{ ...s.style, rotate: `${s.rotate}deg` }}
          tabIndex={s.onActivate ? 0 : -1}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && s.onActivate) {
              e.preventDefault();
              s.onActivate();
            }
          }}
        >
          <span className={`block shadow-[0_10px_30px_rgba(0,0,0,.35)] ${s.className}`}>{s.content}</span>
        </button>
      ))}
    </div>
  );
}
