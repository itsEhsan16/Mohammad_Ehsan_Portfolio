"use client";

import { useEffect, useRef } from "react";
import { gsap, finePointer, motionOK } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils";

/** Pulls its child toward the pointer (fine pointers only), then springs back. */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!finePointer() || !motionOK()) return;
    // move the child only — the hit area (this wrapper) never moves
    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const xTo = gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      gsap.to(inner, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, 0.4)" });
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
