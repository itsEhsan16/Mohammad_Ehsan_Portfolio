"use client";

import { getImageProps } from "next/image";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReelProject } from "@/lib/field/types";
import { ReelController, reelGeometry, reelRepeats, type ReelLayout, type ReelRowRef } from "@/lib/field/reel";
import { serverViewportSnapshot, subscribeViewport, viewportSnapshot } from "@/lib/field/viewport";
import { whenVisible } from "@/lib/transition";
import { reducedMotion } from "@/lib/motion/gsap";
import { tick } from "@/lib/audio";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");

// where the strip was (in rows), so coming back from a case study lands on the same project
const POS_KEY = "me:reelpos";
function readPos() {
  try {
    const v = Number(sessionStorage.getItem(POS_KEY));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}
function savePos(rows: number) {
  try {
    sessionStorage.setItem(POS_KEY, String(Math.round(rows)));
  } catch {}
}

/**
 * LIST and WHEEL: every project as a big title on a strip that loops forever.
 * The same rows are laid out as a column or as spokes of a wheel whose hub sits
 * off-screen, and ease from one to the other. A preview card shows the
 * highlighted project. The physics live in lib/field/reel.ts.
 */
export function TitleReel({
  projects,
  layout,
  apiRef,
  leaving = false,
}: {
  projects: ReelProject[];
  layout: ReelLayout;
  apiRef?: React.RefObject<{ key(e: KeyboardEvent): boolean } | null>;
  leaving?: boolean;
}) {
  const size = useSyncExternalStore(subscribeViewport, viewportSnapshot, serverViewportSnapshot);
  const [W, H] = size.split("x").map(Number);
  const geo = useMemo(() => reelGeometry(W, H), [W, H]);
  const n = projects.length;
  const rows = useMemo(() => Array.from({ length: reelRepeats(geo, n) * n }, (_, k) => ({ k, item: k % n })), [geo, n]);

  const covers = useMemo(
    () =>
      projects.map((p) =>
        p.cover
          ? getImageProps({ src: p.cover.src, alt: p.cover.alt, fill: true, sizes: "(min-width: 768px) 34vw, 1px", quality: 75, loading: "eager" }).props
          : null,
      ),
    [projects],
  );

  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const ctrl = useRef<ReelController | null>(null);
  const latest = useRef({ geo, layout, projects });
  const [[active, prev], setPair] = useState<[number, number]>([0, -1]);
  const [announce, setAnnounce] = useState("");

  useLayoutEffect(() => {
    latest.current = { geo, layout, projects };
  });

  // mount
  useLayoutEffect(() => {
    const r = root.current;
    if (!r) return;
    const { geo: g, layout: l } = latest.current;
    const c = new ReelController(
      r,
      l,
      g,
      { card: card.current },
      {
        onActive: (i, via) => {
          setPair(([a]) => (a === i ? [a, -1] : [i, a]));
          if (via === "keyboard") {
            const p = latest.current.projects[i];
            setAnnounce(`N°${pad(p.index)} ${p.title}, ${p.kind}. ${p.status}. Press Enter to open.`);
          }
        },
      },
      reducedMotion(),
      readPos() * g.pitch,
    );
    ctrl.current = c;
    c.setRows(collect(r), g);
    const stop = whenVisible(() => c.intro());
    if (apiRef) apiRef.current = c;
    return () => {
      savePos(c.position / Math.max(1, latest.current.geo.pitch));
      stop();
      c.destroy();
      if (apiRef?.current === c) apiRef.current = null;
      ctrl.current = null;
    };
    // the api ref is stable for the life of the view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const r = root.current;
    if (r) ctrl.current?.setRows(collect(r), geo);
  }, [geo, rows]);

  useEffect(() => {
    ctrl.current?.setLayout(layout);
  }, [layout]);

  const cur = projects[active] ?? projects[0];

  return (
    <div
      ref={root}
      className={cn("wr", `wr--${layout}`, leaving && "is-leaving")}
      tabIndex={0}
      role="region"
      aria-roledescription={layout === "wheel" ? "project wheel" : "project list"}
      aria-label={`Work, as a ${layout}. Scroll, drag or use the arrow keys to move; press Enter to open the highlighted project.`}
      data-lenis-prevent
      style={{ "--wr-fs": `${geo.fs}px`, "--wr-pitch": `${geo.pitch}px` } as React.CSSProperties}
    >
      <div className="wf-bg" aria-hidden="true" />

      <div className="wr-rows" aria-hidden="true">
        {rows.map(({ k, item }) => {
          const p = projects[item];
          return (
            <TransitionLink key={k} href={`/work/${p.slug}`} tabIndex={-1} className="wr-row" data-k={k} data-item={item} onMouseEnter={tick}>
              <span className="wr-bullet" />
              <span className="wr-name">{p.title}</span>
              <span className="wr-tags">
                <span className="wr-chip">{p.kind}</span>
                <span className="wr-go">
                  <Icon name="arrow-up-right" size={12} />
                </span>
              </span>
            </TransitionLink>
          );
        })}
      </div>

      <div className="wf-crt" aria-hidden="true" />

      <div ref={card} className="wr-card" data-reel-ui aria-hidden="true">
        <TransitionLink href={`/work/${cur.slug}`} morph morphRef={media} tabIndex={-1} className="block">
          <div ref={media} className="wr-card__media">
            {projects.map((p, i) => {
              const img = covers[i];
              if (!img) return null;
              return (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img
                  key={p.slug}
                  {...img}
                  // all five load up front (see getImageProps above), so a reveal never plays over an empty frame
                  fetchPriority={i === active ? "high" : "low"}
                  draggable={false}
                  data-morph-image={i === active ? "hi" : undefined}
                  onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                  className={cn("wr-card__img", i === active && "is-current", i === prev && "is-prev")}
                />
              );
            })}
            {!cur.cover && <span className="wr-card__empty t-display">{cur.title}</span>}
            <span key={`scan-${active}`} className="wr-card__scan" />
            <i className="wr-tick wr-tick--tl" />
            <i className="wr-tick wr-tick--tr" />
            <i className="wr-tick wr-tick--bl" />
            <i className="wr-tick wr-tick--br" />
          </div>
        </TransitionLink>
        <div className="wr-card__cap">
          <div className="min-w-0">
            <p className="t-label truncate text-[10px] text-muted">
              N°{pad(cur.index)} — {cur.kind} · {cur.status}
            </p>
            <p className="t-serif mt-1 truncate text-[clamp(1rem,1.3vw,1.2rem)] text-fg/85">{cur.tagline}</p>
          </div>
          <TransitionLink href={`/work/${cur.slug}`} morph morphRef={media} tabIndex={-1} className="wr-card__go t-label">
            Case study <Icon name="arrow-up-right" size={12} />
          </TransitionLink>
        </div>
      </div>

      <div className="wf-hud" data-reel-ui>
        <p className="min-w-0 truncate" aria-hidden="true">
          <span className="mr-2 inline-block h-[6px] w-[6px] bg-signal align-middle" />
          N°{pad(cur.index)} / {pad(n)} — {cur.title}
        </p>
        <span className="hidden whitespace-nowrap lg:inline" aria-hidden="true">
          Scroll · drag · ↑↓ · enter
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

function collect(root: HTMLElement): ReelRowRef[] {
  return Array.from(root.querySelectorAll<HTMLElement>(".wr-row")).map((el) => ({
    el,
    k: Number(el.dataset.k),
    item: Number(el.dataset.item),
  }));
}
