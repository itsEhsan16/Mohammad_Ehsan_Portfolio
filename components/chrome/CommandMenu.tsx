"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { setState, useApp, getState } from "@/lib/store";
import { transitionTo } from "@/lib/transition";
import { toggleTheme } from "@/lib/theme";
import { setSound, tick } from "@/lib/audio";
import { copyEmail } from "./FooterBits";
import { cursorCapable, setMacCursor } from "@/lib/cursor";
import { music } from "@/lib/music/player";
import { getLenis } from "@/lib/motion/lenis";
import { gsap } from "@/lib/motion/gsap";

const pages = [
  { label: "Home", href: "/", hint: "/" },
  { label: "Work", href: "/work", hint: "/work" },
  { label: "About", href: "/about", hint: "/about" },
  { label: "Services", href: "/#services", hint: "#services" },
  { label: "Contact", href: "/#contact", hint: "#contact" },
];

/** ⌘K command palette (cmdk) in a lightweight accessible modal — keyboard-first navigation and actions. */
export default function CommandMenu() {
  const open = useApp((s) => s.cmdOpen);
  const mac = useApp((s) => s.macCursor);
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    if (open) {
      restore.current = document.activeElement as HTMLElement | null;
      getLenis()?.stop();
      gsap.fromTo(el, { autoAlpha: 0, y: -12, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo" });
      requestAnimationFrame(() => el.querySelector<HTMLInputElement>("[cmdk-input]")?.focus());
    } else {
      getLenis()?.start();
      restore.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setState({ cmdOpen: false });
      }
      if (e.key === "Tab") e.preventDefault(); // focus stays in the palette
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setState({ cmdOpen: false });
  const go = (href: string) => {
    close();
    requestAnimationFrame(() => void transitionTo(router, href));
  };
  const run = (fn: () => void) => {
    close();
    requestAnimationFrame(fn);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <button type="button" aria-label="Close command menu" className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-sm" onClick={close} />
      <div ref={panel} className="cmdk-panel relative w-full max-w-[560px] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,.8)]">
        <Command label="Command menu" loop>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <span className="t-label text-[11px] text-signal-text">⌘K</span>
            <Command.Input placeholder="Search anything…" className="h-14 w-full bg-transparent text-[16px] text-fg outline-none placeholder:text-muted" />
          </div>
          <Command.List className="max-h-[52vh] overflow-y-auto p-2" data-lenis-prevent>
            <Command.Empty className="t-label px-3 py-6 text-center text-muted">No results — try “work” or “email”.</Command.Empty>
            <Command.Group heading="Pages">
              {pages.map((p) => (
                <Item key={p.href} onSelect={() => go(p.href)} hint={p.hint}>
                  {p.label}
                </Item>
              ))}
            </Command.Group>
            <Command.Group heading="Work">
              {projects.map((p) => (
                <Item key={p.slug} value={`${p.title} ${p.kind} ${p.stack.join(" ")}`} onSelect={() => go(`/work/${p.slug}`)} hint={`N°${String(p.index).padStart(2, "0")}`}>
                  {p.title}
                </Item>
              ))}
            </Command.Group>
            <Command.Group heading="Actions">
              <Item onSelect={() => run(() => void copyEmail())} hint={site.email}>
                Copy email address
              </Item>
              <Item onSelect={() => run(() => window.open(site.resume, "_blank", "noopener"))} hint="Drive ↗">
                Open résumé
              </Item>
              <Item onSelect={() => run(() => toggleTheme({ x: window.innerWidth - 40, y: 40 }))} hint="ink / paper">
                Toggle theme
              </Item>
              <Item
                onSelect={() =>
                  run(() => {
                    const next = !getState().sound;
                    setSound(next);
                    setState({ sound: next });
                  })
                }
                hint="off by default"
              >
                Toggle interface sound
              </Item>
              <Item value="music play pause song audio" onSelect={() => run(() => music.toggle())} hint={music.track.title}>
                {music.getState().playing ? "Pause music" : "Play music"}
              </Item>
              {cursorCapable() && (
                <Item
                  value="cursor pointer mouse mac system arrow"
                  onSelect={() => run(() => setMacCursor(!mac))}
                  hint={mac ? "mac → system" : "system → mac"}
                >
                  {mac ? "Use system cursor" : "Use Mac cursor"}
                </Item>
              )}
            </Command.Group>
            <Command.Group heading="Elsewhere">
              {site.socials.map((s) => (
                <Item key={s.href} onSelect={() => run(() => window.open(s.href, "_blank", "noopener"))} hint="↗">
                  {s.label}
                </Item>
              ))}
            </Command.Group>
          </Command.List>
          <div className="t-label flex items-center justify-between border-t border-line px-4 py-2.5 text-[10px] text-muted">
            <span>↑↓ navigate · ↵ select · esc close</span>
            <span>{site.handle}</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Item({ children, onSelect, hint, value }: { children: React.ReactNode; onSelect: () => void; hint?: string; value?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      onMouseEnter={tick}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-[8px] px-3 py-2.5 text-[14px] text-fg/85 data-[selected=true]:bg-fg data-[selected=true]:text-bg"
    >
      <span>{children}</span>
      {hint && <span className="t-label truncate text-[10px] opacity-60">{hint}</span>}
    </Command.Item>
  );
}
