"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { FieldItem } from "@/lib/field/types";
import { fieldGeometry, frameIn, tileAt } from "@/lib/field/geometry";
import { FieldController, type CellRef } from "@/lib/field/controller";
import { Lightbox } from "@/lib/field/lightbox";
import { serverViewportSnapshot, subscribeViewport, viewportSnapshot } from "@/lib/field/viewport";
import { whenVisible } from "@/lib/transition";
import { reducedMotion } from "@/lib/motion/gsap";
import { click, tick } from "@/lib/audio";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const pad = (n: number, l = 2) => String(n).padStart(l, "0");

// where the camera was, so coming back from a case study lands on the same spot
const CAM_KEY = "me:fieldcam";
function readCam() {
  try {
    const v = JSON.parse(sessionStorage.getItem(CAM_KEY) || "null");
    return v && typeof v.u === "number" && typeof v.v === "number" ? (v as { u: number; v: number }) : undefined;
  } catch {
    return undefined;
  }
}
function saveCam(u: number, v: number) {
  try {
    sessionStorage.setItem(CAM_KEY, JSON.stringify({ u: Math.round(u * 100) / 100, v: Math.round(v * 100) / 100 }));
  } catch {}
}

type Shown = { item: number; cell: HTMLElement; via: "pointer" | "keyboard"; lo?: string; seq: number; closing?: boolean };

/**
 * /work as an endless field: every tile of every project on a wrap-around grid
 * you drag, scroll or arrow through. Cards shrink and smear while the field
 * moves, the middle of the screen renders in colour while the edges stay
 * blueprint, resting on a card holds it, and a click flies the picture to the
 * middle. The physics live in lib/field/controller.ts; this is the DOM.
 */
export function WorkField({
  items,
  apiRef,
  leaving = false,
}: {
  items: FieldItem[];
  /** WorkView routes arrow keys and Enter here. */
  apiRef?: React.RefObject<{ key(e: KeyboardEvent): boolean } | null>;
  /** Fading out before another view takes over. */
  leaving?: boolean;
}) {
  const size = useSyncExternalStore(subscribeViewport, viewportSnapshot, serverViewportSnapshot);
  const [W, H] = size.split("x").map(Number);
  const geo = useMemo(() => fieldGeometry(W, H, items.length), [W, H, items.length]);
  const cells = useMemo(() => {
    const out: { col: number; row: number; item: number }[] = [];
    for (let row = 0; row < geo.rows; row++)
      for (let col = 0; col < geo.cols; col++) out.push({ col, row, item: tileAt(col, row, geo, items.length) });
    return out;
  }, [geo, items.length]);

  const tileImg = useMemo(
    () =>
      items.map((it) =>
        it.src
          ? getImageProps({ src: it.src, alt: it.alt ?? "", fill: true, sizes: "(max-width: 640px) 70vw, 30vw", quality: 75, loading: "eager" }).props
          : null,
      ),
    [items],
  );

  // the tiles only change with the layout; HUD and announcement updates must not reconcile them
  const tiles = useMemo(
    () =>
      cells.map(({ col, row, item }) => {
        const t = items[item];
        const fr = frameIn(geo, t.w, t.h);
        const img = tileImg[item];
        return (
          <div key={`${col}.${row}`} className="wf-cell" data-col={col} data-row={row} data-item={item}>
            <div className="wf-arrive">
              <div className="wf-plate">
                <div className="wf-frame" style={{ left: fr.left, top: fr.top, width: fr.width, height: fr.height }}>
                  {img ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
                      <img {...img} draggable={false} className="wf-img" />
                      <div className="wf-blue">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img {...img} alt="" draggable={false} className="wf-img" />
                      </div>
                    </>
                  ) : (
                    <Sheet item={t} />
                  )}
                </div>
              </div>
            </div>
            <i className="wf-tick wf-tick--tl" />
            <i className="wf-tick wf-tick--tr" />
            <i className="wf-tick wf-tick--bl" />
            <i className="wf-tick wf-tick--br" />
            <div className="wf-meta">
              <span>
                N°{pad(t.index)} · {t.title}
              </span>
              <span>
                {t.status} {"//"} {pad(t.n, 3)}
              </span>
            </div>
          </div>
        );
      }),
    [cells, geo, items, tileImg],
  );

  const projects = useMemo(() => {
    const seen = new Set<string>();
    return items.filter((it) => (seen.has(it.slug) ? false : (seen.add(it.slug), true)));
  }, [items]);

  const root = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const lbRoot = useRef<HTMLDivElement>(null);
  const lbBox = useRef<HTMLDivElement>(null);
  const lbCap = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);
  const ctrl = useRef<FieldController | null>(null);
  const lb = useRef<Lightbox | null>(null);
  const latest = useRef({ geo, items });
  const shownRef = useRef<Shown | null>(null);
  const seq = useRef(0);

  const [centre, setCentre] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [shown, setShown] = useState<Shown | null>(null);
  const open = !!shown && !shown.closing;

  useLayoutEffect(() => {
    latest.current = { geo, items };
    shownRef.current = shown;
  });

  // mount: controller, lightbox, arrival, page state
  useLayoutEffect(() => {
    const r = root.current;
    const w = world.current;
    if (!r || !w) return;
    const reduced = reducedMotion();
    const c = new FieldController(
      r,
      w,
      latest.current.geo,
      { label: label.current, coords: coords.current },
      {
        onCentre: (i) => setCentre(i),
        onFocus: (i) => {
          if (i < 0) return;
          tick();
          const it = latest.current.items[i];
          setAnnounce(`N°${pad(it.index)} ${it.title}, ${it.kind}. ${it.caption}. ${it.status}. Press Enter to open.`);
        },
        onOpen: (cell, via) => {
          if (lb.current?.open || shownRef.current) return;
          click();
          const lo = cell.frame.querySelector("img")?.currentSrc || undefined;
          seq.current += 1;
          setShown({ item: cell.item, cell: cell.el, via, lo, seq: seq.current });
        },
      },
      reduced,
      readCam(),
    );
    ctrl.current = c;
    c.setCells(collect(w), latest.current.geo);
    c.hold();
    const stopArrive = whenVisible(() => c.arrive());
    if (lbRoot.current && lbBox.current) lb.current = new Lightbox({ root: lbRoot.current, box: lbBox.current, caption: lbCap.current }, reduced);
    if (apiRef) apiRef.current = c;
    return () => {
      if (apiRef?.current === c) apiRef.current = null;
      saveCam(c.cam.tu, c.cam.tv);
      stopArrive();
      c.destroy();
      lb.current?.destroy();
      ctrl.current = null;
      lb.current = null;
      w.querySelectorAll(".is-waiting,.is-arriving").forEach((el) => el.classList.remove("is-waiting", "is-arriving"));
      delete document.documentElement.dataset.lightbox;
    };
    // the api ref is stable for the life of the view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // while a picture is open the view switcher steps aside
  useEffect(() => {
    const html = document.documentElement;
    if (open) html.dataset.lightbox = "";
    else delete html.dataset.lightbox;
  }, [open]);

  // geometry changed (resize): hand the new cells over without moving the camera
  useLayoutEffect(() => {
    const w = world.current;
    if (w) ctrl.current?.setCells(collect(w), geo);
    const s = shownRef.current;
    const it = s ? latest.current.items[s.item] : null;
    if (it) lb.current?.relayout(it.w && it.h ? it.w / it.h : 16 / 10);
  }, [geo, cells]);

  // open: fly from the card to the middle
  useLayoutEffect(() => {
    if (!shown || shown.closing) return;
    const c = ctrl.current;
    const l = lb.current;
    if (!c || !l) return;
    const it = latest.current.items[shown.item];
    c.lock(true);
    l.show(c.frameRect(shown.cell), it.w && it.h ? it.w / it.h : 16 / 10);
    cta.current?.focus({ preventScroll: true });
    // only re-run for a new opening, not for the closing flag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown?.seq]);

  const close = useCallback(() => {
    const l = lb.current;
    const c = ctrl.current;
    const s = shownRef.current;
    if (!l || !c || !s || !l.open || l.settling) return;
    c.lock(false);
    setShown({ ...s, closing: true });
    l.hide(
      () => c.frameRect(s.cell),
      () => setShown((cur) => (cur && cur.seq === s.seq ? null : cur)),
    );
    if (s.via === "keyboard") root.current?.focus({ preventScroll: true });
  }, []);

  // Esc closes; Tab stays inside the open picture
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab" && lbRoot.current) {
        const f = lbRoot.current.querySelectorAll<HTMLElement>("a[href],button");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const it = shown ? items[shown.item] : null;
  const hi = it?.src ? getImageProps({ src: it.src, alt: it.alt ?? "", fill: true, sizes: "(max-width: 640px) 92vw, 72vw", quality: 85 }).props : null;
  const inView = items[centre] ?? items[0];

  return (
    <div
      ref={root}
      className={cn("wf", leaving && "is-leaving")}
      tabIndex={0}
      role="region"
      aria-roledescription="project field"
      aria-label="Work, as a grid. Drag, scroll or use the arrow keys to move; press Enter to open the project in the middle."
      data-lenis-prevent
      style={
        {
          "--cw": `${geo.cardW}px`,
          "--ph": `${geo.plateH}px`,
          "--lh": `${geo.labelH}px`,
          "--fs": `${geo.font}px`,
        } as React.CSSProperties
      }
    >
      {/* one chromatic-aberration filter for the whole field; its offsets are rewritten while it moves */}
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <filter id="wf-ab" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset data-ab="r" in="r" dx="0" dy="0" result="r2" />
          <feOffset data-ab="b" in="b" dx="0" dy="0" result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>

      <div className="wf-bg" aria-hidden="true" />

      <div className="wf-stage">
        <div ref={world} className="wf-world" aria-hidden="true">
          {tiles}
        </div>
        <div className="wf-crt" aria-hidden="true" />
      </div>

      <svg className="wf-reticle" aria-hidden="true" viewBox="0 0 28 28" width="28" height="28">
        <path d="M14 0v9M14 19v9M0 14h9M19 14h9" stroke="currentColor" strokeWidth="1" />
        <rect x="12.5" y="12.5" width="3" height="3" fill="currentColor" />
      </svg>

      <div className="wf-hud" data-field-ui>
        <p className="min-w-0 truncate" aria-hidden="true">
          <span className="mr-2 inline-block h-[6px] w-[6px] bg-signal align-middle" />
          <span className="hidden sm:inline">In view — </span>N°{pad(inView.index)} {inView.title}
          <span className="hidden lg:inline"> · {inView.caption}</span>
        </p>
        <div className="flex items-center gap-4 whitespace-nowrap tabular-nums">
          <span ref={coords} aria-hidden="true" className="hidden sm:inline">
            X+000.00 Y+000.00
          </span>
          <span className="hidden lg:inline">
            {pad(projects.length)} projects / {pad(items.length)} tiles
          </span>
        </div>
      </div>

      {/* the open picture */}
      <div
        ref={lbRoot}
        className="wf-lbox"
        data-field-ui
        role="dialog"
        aria-modal="true"
        aria-label={it ? `${it.title} — ${it.caption}` : "Preview"}
        aria-hidden={!open}
        inert={!open}
        onClick={(e) => {
          if ((e.target as Element).closest("a,button")) return;
          close();
        }}
      >
        <div className="wf-lbox__veil" />
        <div ref={lbBox} className="wf-lbox__box">
          {it?.src ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {shown?.lo && <img src={shown.lo} alt="" className="wf-lbox__lo" draggable={false} data-morph-image="lo" />}
              {hi && (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img
                  key={it.key}
                  {...hi}
                  draggable={false}
                  className="wf-lbox__hi"
                  data-morph-image="hi"
                  onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                />
              )}
            </>
          ) : it ? (
            <Sheet item={it} big />
          ) : null}
          <i className="wf-lbox__tick wf-lbox__tick--tl" />
          <i className="wf-lbox__tick wf-lbox__tick--tr" />
          <i className="wf-lbox__tick wf-lbox__tick--bl" />
          <i className="wf-lbox__tick wf-lbox__tick--br" />
        </div>
        <div ref={lbCap} className="wf-lbox__cap">
          {it && (
            <>
              <div className="min-w-0">
                <p className="t-label text-[10px] text-muted">
                  N°{pad(it.index)} — {it.kind} · {it.status}
                </p>
                <p className="t-display mt-2 text-[clamp(1.7rem,3.2vw,3rem)] leading-[0.88]">{it.title}</p>
                <p className="t-serif mt-1 truncate text-[clamp(1rem,1.4vw,1.25rem)] text-fg/80">{it.caption}</p>
                {it.links.length > 0 && (
                  <p className="t-label mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                    {it.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="text-fg/80 hover:text-signal-text">
                        {l.label} ↗
                      </a>
                    ))}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <TransitionLink
                  ref={cta}
                  href={`/work/${it.slug}`}
                  morph
                  morphRef={lbBox}
                  className="t-label inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-[11px] font-semibold text-ink"
                >
                  View case study <Icon name="arrow-up-right" size={13} />
                </TransitionLink>
                <button
                  type="button"
                  onClick={close}
                  className="t-label inline-flex items-center gap-2 rounded-full border border-line px-4 py-3 text-[11px] text-fg hover:border-fg/50"
                >
                  Close <Icon name="close" size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={label} className="wf-label" aria-hidden="true" data-open="Click to open" data-close="Click to close" />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}

function collect(world: HTMLElement): CellRef[] {
  return Array.from(world.querySelectorAll<HTMLElement>(".wf-cell")).map((el) => ({
    el,
    arrive: el.querySelector<HTMLElement>(".wf-arrive")!,
    plate: el.querySelector<HTMLElement>(".wf-plate")!,
    frame: el.querySelector<HTMLElement>(".wf-frame")!,
    blue: el.querySelector<HTMLElement>(".wf-blue"),
    item: Number(el.dataset.item),
    col: Number(el.dataset.col),
    row: Number(el.dataset.row),
  }));
}

/** A type-only tile: the project as a spec sheet, for projects whose pictures are few. */
function Sheet({ item, big = false }: { item: FieldItem; big?: boolean }) {
  return (
    <div className={cn("wf-sheet", big && "wf-sheet--big")}>
      <div className="wf-sheet__row">
        <span>
          N°{pad(item.index)} — {item.kind}
        </span>
        <span>{item.status}</span>
      </div>
      <div>
        <p className="wf-sheet__title">{item.title}</p>
        <p className="wf-sheet__tag">{item.tagline}</p>
        {big && <p className="wf-sheet__sum">{item.summary}</p>}
      </div>
      <div className="wf-sheet__row">
        <span>{item.stack.slice(0, big ? 6 : 3).join(" · ")}</span>
        <span>{"// spec"}</span>
      </div>
    </div>
  );
}
