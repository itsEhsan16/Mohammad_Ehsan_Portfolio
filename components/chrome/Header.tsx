"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { SoundToggle, ThemeToggle } from "./Toggles";
import { Scramble } from "@/components/ui/Scramble";
import { Icon } from "@/components/ui/Icon";
import { setState, useApp } from "@/lib/store";
import { gsap } from "@/lib/motion/gsap";
import { scrollY } from "@/lib/motion/lenis";
import { tick } from "@/lib/audio";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const menuOpen = useApp((s) => s.menuOpen);

  // hide on scroll down, reveal on scroll up
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = scrollY();
    let hidden = false;
    const update = () => {
      const y = scrollY();
      const d = y - last;
      if (Math.abs(d) < 2) return;
      const shouldHide = d > 0 && y > 200;
      if (shouldHide !== hidden) {
        hidden = shouldHide;
        gsap.to(el, { yPercent: hidden ? -160 : 0, duration: 0.7, ease: "expo" });
      }
      last = y;
    };
    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <header
      ref={ref}
      className="fixed inset-x-0 top-[var(--hud-h)] z-[60] px-gutter"
      data-menu-open={menuOpen ? "" : undefined}
    >
      <div className="flex h-14 items-center justify-between gap-4">
        <TransitionLink
          href="/"
          className="t-label group flex items-center gap-1 text-[12px] text-fg"
          aria-label={`${site.name} — home`}
          onMouseEnter={tick}
        >
          <Scramble text={site.handle.replace(/_$/, "")} hover />
          <span className="text-signal motion-safe:animate-pulse">_</span>
        </TransitionLink>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-bg/60 p-1 backdrop-blur-md">
            {site.nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <TransitionLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={tick}
                    className={cn(
                      "relative block rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                      active ? "bg-fg text-bg" : "text-fg/75 hover:text-fg",
                    )}
                  >
                    {item.label}
                  </TransitionLink>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setState({ cmdOpen: true })}
                onMouseEnter={tick}
                className="t-label ml-1 flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[11px] text-fg/75 transition-colors hover:text-fg"
                aria-label="Open command menu (⌘K)"
                aria-keyshortcuts="Meta+K Control+K"
              >
                <Icon name="command" size={12} /> K
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <SoundToggle className="hidden sm:grid" />
          <ThemeToggle />
          <button
            type="button"
            className="t-label flex h-9 items-center gap-2 rounded-full border border-line bg-bg/60 px-4 text-[11px] text-fg backdrop-blur-md md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setState({ menuOpen: !menuOpen })}
          >
            {menuOpen ? "Close" : "Menu"}
            <Icon name={menuOpen ? "close" : "menu"} size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
