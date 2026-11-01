"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/content/types";
import { statusLabel } from "@/content/projects";
import { ProjectMedia } from "./ProjectMedia";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Chip } from "@/components/ui/SectionLabel";
import { Icon } from "@/components/ui/Icon";
import { gsap, finePointer, motionOK } from "@/lib/motion/gsap";
import { tick } from "@/lib/audio";
import { setWorkView } from "@/lib/field/view";
import { cn } from "@/lib/utils";

type Filter = "all" | "shipped" | "in-development";
type View = "list" | "grid";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "shipped", label: "Shipped" },
  { id: "in-development", label: "In development" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function WorkIndex({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [hovered, setHovered] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const visible = useMemo(
    () =>
      projects.filter((p) =>
        filter === "all" ? true : filter === "shipped" ? p.status !== "in-development" : p.status === "in-development",
      ),
    [projects, filter],
  );

  // cursor-following preview (fine pointers only)
  useEffect(() => {
    const el = preview.current;
    if (!el || !finePointer() || view !== "list") return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" });
    const rTo = gsap.quickTo(el, "rotation", { duration: 0.9, ease: "power3" });
    let lastX = 0;
    const move = (e: PointerEvent) => {
      xTo(e.clientX + 28);
      yTo(e.clientY - el.offsetHeight / 2);
      rTo(gsap.utils.clamp(-10, 10, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [view]);

  useEffect(() => {
    const el = preview.current;
    if (!el) return;
    gsap.to(el, { autoAlpha: hovered ? 1 : 0, scale: hovered ? 1 : 0.85, duration: 0.45, ease: "expo" });
  }, [hovered]);

  // entrance for list rows / grid tiles whenever the set changes
  useEffect(() => {
    if (!motionOK() || !listRef.current) return;
    gsap.fromTo(
      listRef.current.children,
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, ease: "expo", stagger: 0.06, overwrite: true },
    );
  }, [visible, view]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-gutter pb-5">
        <div role="group" aria-label="Filter projects" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              onMouseEnter={tick}
              className={cn(
                "t-label rounded-full border px-3.5 py-2 text-[11px] transition-colors",
                filter === f.id ? "border-fg bg-fg text-bg" : "border-line text-fg/80 hover:border-fg/50",
              )}
            >
              {f.label}
              <span className="ml-1.5">
                {pad(
                  projects.filter((p) =>
                    f.id === "all" ? true : f.id === "shipped" ? p.status !== "in-development" : p.status === "in-development",
                  ).length,
                )}
              </span>
            </button>
          ))}
        </div>
        <div role="group" aria-label="Layout" className="flex gap-1.5">
          <button
            type="button"
            aria-pressed={false}
            onClick={() => setWorkView("field")}
            onMouseEnter={tick}
            className="t-label hidden items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[11px] text-fg/80 transition-colors hover:border-fg/50 [html.js_&]:inline-flex"
          >
            <span aria-hidden="true" className="h-[6px] w-[6px] bg-signal" />
            field
          </button>
          {(["list", "grid"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              onMouseEnter={tick}
              className={cn(
                "t-label rounded-full border px-3.5 py-2 text-[11px] transition-colors",
                view === v ? "border-signal bg-signal text-ink" : "border-line text-fg/80 hover:border-fg/50",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <ul ref={listRef} className="work-list" onMouseLeave={() => setHovered(null)}>
          {visible.map((p) => (
            <li key={p.slug} className="border-b border-line" data-active={hovered === p.slug ? "" : undefined}>
              <TransitionLink
                href={`/work/${p.slug}`}
                data-cursor="open"
                onMouseEnter={() => {
                  setHovered(p.slug);
                  tick();
                }}
                onFocus={() => setHovered(p.slug)}
                onBlur={() => setHovered(null)}
                className="work-row grid grid-cols-12 items-center gap-x-6 gap-y-2 px-gutter py-6 md:py-7"
              >
                <span className="t-label col-span-2 text-muted md:col-span-1">N°{pad(p.index)}</span>
                <span className="col-span-10 md:col-span-6">
                  <span className="work-title t-display block text-[clamp(2.4rem,6.2vw,7rem)] leading-[0.88]">{p.title}</span>
                </span>
                <span className="t-label col-span-6 text-muted md:col-span-2">{p.kind}</span>
                <span className="col-span-6 flex justify-end md:col-span-3 md:justify-between">
                  <span className="hidden flex-wrap gap-1.5 md:flex">
                    <Chip className={p.status === "in-development" ? "border-signal/60 text-signal-text" : ""}>
                      {statusLabel[p.status]}
                    </Chip>
                  </span>
                  <span className="work-arrow grid h-11 w-11 place-items-center rounded-full border border-line">
                    <Icon name="arrow-up-right" size={15} />
                  </span>
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      ) : (
        <ul ref={listRef} className="grid grid-cols-1 gap-x-6 gap-y-14 px-gutter pt-10 md:grid-cols-2">
          {visible.map((p, i) => (
            <li key={p.slug} className={cn(i % 2 === 1 && "md:mt-24")}>
              <TransitionLink href={`/work/${p.slug}`} morph data-cursor="open" className="group block" onMouseEnter={tick}>
                <ProjectMedia project={p} morphKey={`/work/${p.slug}`} sizes="(min-width: 768px) 46vw, 100vw" />
                <span className="mt-4 flex items-start justify-between gap-4">
                  <span>
                    <span className="t-label block text-muted">
                      N°{pad(p.index)} — {p.kind}
                    </span>
                    <span className="t-display mt-2 block text-[clamp(2rem,3.6vw,3.8rem)] leading-[0.9] transition-colors group-hover:text-signal-text">
                      {p.title}
                    </span>
                    <span className="t-serif mt-1 block text-xl text-fg/80">{p.tagline}</span>
                  </span>
                  <Chip className={p.status === "in-development" ? "border-signal/60 text-signal-text" : ""}>
                    {statusLabel[p.status]}
                  </Chip>
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>
      )}

      {/* hover preview (list view, fine pointer) */}
      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-40 hidden w-[min(30vw,460px)] opacity-0 fine:block"
      >
        {projects.map((p) => (
          <div key={p.slug} className={cn("absolute inset-x-0 top-0", hovered === p.slug ? "visible" : "invisible")}>
            <ProjectMedia project={p} variant="plain" sizes="460px" gl={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
