"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { setState, useApp } from "@/lib/store";
import { gsap } from "@/lib/motion/gsap";
import { getLenis } from "@/lib/motion/lenis";
import { useLocalTime } from "@/lib/time";
import { SoundToggle } from "./Toggles";

const items = [{ label: "Home", href: "/" }, ...site.nav];

export function MobileMenu() {
  const open = useApp((s) => s.menuOpen);
  const ref = useRef<HTMLDivElement>(null);
  const time = useLocalTime(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "quint" });
      gsap.fromTo(
        el.querySelectorAll("[data-menu-item]"),
        { yPercent: 110 },
        { yPercent: 0, duration: 1, ease: "expo", stagger: 0.05, delay: 0.25 },
      );
      const first = el.querySelector<HTMLElement>("a,button");
      first?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
      gsap.to(el, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.6,
        ease: "quint",
        onComplete: () => {
          gsap.set(el, { visibility: "hidden" });
        },
      });
    }
  }, [open]);

  // Esc to close + focus trap
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState({ menuOpen: false });
      if (e.key !== "Tab" || !ref.current) return;
      const focusables = ref.current.querySelectorAll<HTMLElement>("a,button");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      id="mobile-menu"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="invisible fixed inset-0 z-[55] flex flex-col justify-between bg-bg px-gutter pb-8 pt-28 md:hidden"
      style={{ clipPath: "inset(0 0 100% 0)" }}
    >
      <nav aria-label="Mobile">
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={item.href} className="overflow-hidden">
              <TransitionLink
                href={item.href}
                data-menu-item
                onClick={() => setState({ menuOpen: false })}
                className="t-display flex items-baseline gap-3 text-[15vw] leading-[0.9]"
              >
                <span className="t-label text-[11px] text-signal">0{i + 1}</span>
                {item.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-6">
        <div className="t-label flex flex-wrap gap-x-6 gap-y-2 text-muted">
          {projects.map((p) => (
            <TransitionLink key={p.slug} href={`/work/${p.slug}`} onClick={() => setState({ menuOpen: false })}>
              {p.title}
            </TransitionLink>
          ))}
        </div>
        <div className="flex items-end justify-between border-t border-line pt-4">
          <div className="t-label space-y-1 text-muted">
            <p>
              {site.location.label} · {time}
            </p>
            <div className="flex gap-4 text-fg">
              {site.socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <SoundToggle />
        </div>
      </div>
    </div>
  );
}
