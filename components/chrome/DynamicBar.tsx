"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "@/lib/motion/gsap";
import { getLenis, scrollY } from "@/lib/motion/lenis";
import { setDragging } from "@/lib/cursor";
import { useApp } from "@/lib/store";
import { site } from "@/content/site";
import { formatTime, music } from "@/lib/music/player";
import { MusicCover } from "./MusicCover";
import { cn } from "@/lib/utils";

type Mode = "rest" | "bloom" | "player";

/** ms after movement (or hover) ends before the clock folds back into the bar */
const REST_DELAY = 150;
/** ms of stillness before the resting bar fades out */
const IDLE_HIDE = 1600;
/** ms of grace when the pointer leaves the open player */
const LEAVE_DELAY = 260;
/** height of the resting bar — its centre is what tracks scroll progress */
const REST_H = 64;

const ist = new Intl.DateTimeFormat("en-US", { timeZone: site.location.timeZone, hour: "numeric", minute: "2-digit", hour12: true });
function istClock() {
  const parts = ist.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const h = Number(get("hour")) % 12;
  const m = Number(get("minute"));
  return { text: `${String(h || 12).padStart(2, "0")}:${get("minute")}`, ap: get("dayPeriod").toUpperCase(), h, m };
}

/**
 * The scrollbar, with somewhere to be. A slim bar rides the right edge and
 * tracks the page; while the page moves (or on hover/focus) it blooms into a
 * capsule with a live clock on IST and a ♪; the ♪ opens a small player for the
 * site's music (lib/music). Drag the bar to scroll.
 * Concept and motion after Xavier Jac's dynamic scrollbar.
 */
export function DynamicBar() {
  const [mode, setMode] = useState<Mode>("rest");
  const modeRef = useRef<Mode>("rest");
  const st = useSyncExternalStore(music.subscribe, music.getState, music.getServerState);
  const menuOpen = useApp((s) => s.menuOpen);
  const track = music.tracks[st.index];

  const root = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const hourHand = useRef<SVGRectElement>(null);
  const minHand = useRef<SVGRectElement>(null);
  const timeEl = useRef<HTMLSpanElement>(null);
  const apEl = useRef<HTMLSpanElement>(null);
  const slider = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const curEl = useRef<HTMLSpanElement>(null);
  const durEl = useRef<HTMLSpanElement>(null);
  const noteBtn = useRef<HTMLButtonElement>(null);
  const playBtn = useRef<HTMLButtonElement>(null);
  const wave = useRef<HTMLSpanElement>(null);
  const eq = useRef<HTMLSpanElement>(null);
  const flags = useRef({
    hovered: false,
    focused: false,
    dragging: false,
    dragged: false,
    touchOpen: false,
    nearEdge: false,
    lastMove: -1e9,
    openedAt: 0,
    leaveTimer: 0,
    scrub: -1,
  });

  const go = (m: Mode) => {
    if (modeRef.current === m) return;
    modeRef.current = m;
    setMode(m);
  };

  const openPlayer = () => {
    flags.current.openedAt = performance.now();
    go("player");
    if (!music.getState().playing) music.play();
    requestAnimationFrame(() => playBtn.current?.focus({ preventScroll: true }));
  };

  useEffect(() => {
    const r = root.current;
    const th = thumb.current;
    if (!r || !th) return;
    const f = flags.current;
    const goRef = (m: Mode) => {
      if (modeRef.current === m) return;
      modeRef.current = m;
      setMode(m);
    };
    let lastY = scrollY();
    let shown = false;
    let lastAria = 0;
    const lv: number[] = [];

    const tick = () => {
      const now = performance.now();
      const y = scrollY();
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const moving = Math.abs(y - lastY) > 0.35;
      lastY = y;
      const m = modeRef.current;

      // movement blooms the bar; stillness folds it back (the player folds to the clock when the page moves)
      if (moving && !f.dragging) {
        f.lastMove = now;
        if (m === "rest") goRef("bloom");
        else if (m === "player" && now - f.openedAt > 500) goRef("bloom");
      } else if (m === "bloom" && !f.hovered && !f.focused && !f.dragging && !f.touchOpen && now - f.lastMove > REST_DELAY) {
        goRef("rest");
      }

      // the resting bar's centre tracks scroll progress; bigger states grow around it, kept inside the rail
      const railH = r.clientHeight;
      const h = th.offsetHeight;
      const progress = max > 1 ? y / max : 0.5;
      const centre = progress * (railH - REST_H) + REST_H / 2;
      const top = Math.min(Math.max(0, centre - h / 2), Math.max(0, railH - h));
      th.style.transform = `translate3d(0,${top.toFixed(1)}px,0)`;

      const ms = music.getState();
      const want = m !== "rest" || f.hovered || f.focused || f.dragging || f.nearEdge || ms.playing || now - f.lastMove < IDLE_HIDE;
      // an attribute, not a class: React owns className and would wipe it on the next render
      if (want !== shown) {
        shown = want;
        r.toggleAttribute("data-shown", want);
      }

      if (m === "player") {
        const d = music.duration || 1;
        const p = f.scrub >= 0 ? f.scrub : music.position;
        if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, p / d).toFixed(4)})`;
        if (curEl.current) curEl.current.textContent = formatTime(p);
        if (durEl.current) durEl.current.textContent = formatTime(d);
        if (slider.current && now - lastAria > 1000) {
          lastAria = now;
          slider.current.setAttribute("aria-valuemax", String(Math.round(d)));
          slider.current.setAttribute("aria-valuenow", String(Math.round(p)));
          slider.current.setAttribute("aria-valuetext", `${formatTime(p)} of ${formatTime(d)}`);
        }
      }
      // the waveform and the mini equaliser follow the real audio level
      if (ms.playing && m !== "rest") {
        music.levels(5, lv);
        wave.current?.querySelectorAll("i").forEach((b, i) => (b.style.transform = `scaleY(${(0.22 + lv[i] * 1.15).toFixed(3)})`));
        eq.current?.querySelectorAll("i").forEach((b, i) => (b.style.transform = `scaleY(${(0.3 + lv[i + 1] * 1.25).toFixed(3)})`));
      }
    };
    gsap.ticker.add(tick);

    // the clock: IST, every second
    const clock = () => {
      const c = istClock();
      if (timeEl.current) timeEl.current.textContent = c.text;
      if (apEl.current) apEl.current.textContent = c.ap;
      hourHand.current?.style.setProperty("transform", `rotate(${c.h * 30 + c.m * 0.5}deg)`);
      minHand.current?.style.setProperty("transform", `rotate(${c.m * 6}deg)`);
    };
    clock();
    const clockTimer = window.setInterval(clock, 1000);

    const onMove = (e: PointerEvent) => {
      f.nearEdge = e.pointerType === "mouse" && e.clientX > window.innerWidth - 40;
    };
    const onDownOutside = (e: PointerEvent) => {
      if (r.contains(e.target as Node)) return;
      f.touchOpen = false;
      if (modeRef.current === "player") goRef("bloom");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modeRef.current === "player") {
        goRef("bloom");
        // keep focus inside: the ♪ becomes focusable once React has committed the bloom
        f.focused = true;
        window.setTimeout(() => noteBtn.current?.focus({ preventScroll: true }), 30);
      } else if (modeRef.current === "bloom" && r.contains(document.activeElement)) {
        (document.activeElement as HTMLElement | null)?.blur();
        f.focused = false;
        f.touchOpen = false;
      }
    };
    const onFocusIn = () => (f.focused = true);
    const onFocusOut = (e: FocusEvent) => {
      if (!r.contains(e.relatedTarget as Node | null)) {
        f.focused = false;
        if (modeRef.current === "player" && !f.hovered) goRef("bloom");
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDownOutside, { capture: true, passive: true });
    window.addEventListener("keydown", onKey);
    r.addEventListener("focusin", onFocusIn);
    r.addEventListener("focusout", onFocusOut);
    return () => {
      gsap.ticker.remove(tick);
      window.clearInterval(clockTimer);
      window.clearTimeout(f.leaveTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDownOutside, { capture: true });
      window.removeEventListener("keydown", onKey);
      r.removeEventListener("focusin", onFocusIn);
      r.removeEventListener("focusout", onFocusOut);
      if (f.dragging) setDragging(false);
    };
  }, []);

  /* ───────────── pointer on the bar: hover, tap, drag-to-scroll ───────────── */

  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const f = flags.current;
    f.hovered = true;
    window.clearTimeout(f.leaveTimer);
    if (modeRef.current === "rest") go("bloom");
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const f = flags.current;
    f.hovered = false;
    window.clearTimeout(f.leaveTimer);
    f.leaveTimer = window.setTimeout(() => {
      if (!f.hovered && !f.focused && modeRef.current === "player") go("bloom");
    }, LEAVE_DELAY);
  };
  const onDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (modeRef.current === "player" || t.closest("button:not(.dbar__hit),a,[role=slider]")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const f = flags.current;
    const th = thumb.current;
    const rail = root.current;
    if (!th || !rail) return;
    const startY = e.clientY;
    const startScroll = scrollY();
    f.dragged = false;
    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - startY;
      if (!f.dragging) {
        if (Math.abs(dy) < 4) return;
        f.dragging = true;
        f.dragged = true;
        setDragging(true);
      }
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = startScroll + (dy / Math.max(1, rail.clientHeight - REST_H)) * max;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(Math.max(0, Math.min(max, target)), { immediate: true, force: true });
      else window.scrollTo(0, target);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (f.dragging) {
        f.dragging = false;
        setDragging(false);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const onHitClick = () => {
    const f = flags.current;
    if (f.dragged) {
      f.dragged = false;
      return;
    }
    // touch and keyboard: a tap opens the clock and keeps it open until you tap elsewhere
    f.touchOpen = true;
    if (modeRef.current === "rest") go("bloom");
  };

  /* ───────────── timeline ───────────── */

  const seekFrom = (clientX: number) => {
    const el = slider.current;
    if (!el) return 0;
    const b = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - b.left) / Math.max(1, b.width))) * music.duration;
  };
  const onSliderDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const f = flags.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    f.scrub = seekFrom(e.clientX);
  };
  const onSliderMove = (e: React.PointerEvent) => {
    const f = flags.current;
    if (f.scrub >= 0) f.scrub = seekFrom(e.clientX);
  };
  const onSliderUp = () => {
    const f = flags.current;
    if (f.scrub < 0) return;
    music.seek(f.scrub);
    f.scrub = -1;
  };
  const onSliderKey = (e: React.KeyboardEvent) => {
    const step = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (step) {
      e.preventDefault();
      music.seek(music.position + step);
    } else if (e.key === "Home") {
      e.preventDefault();
      music.seek(0);
    } else if (e.key === "End") {
      e.preventDefault();
      music.seek(music.duration - 1);
    }
  };

  const live = st.started ? `${st.playing ? "Now playing" : "Paused"}: ${track.title} by ${track.artist}` : "";

  return (
    <div ref={root} className={cn("dbar", st.playing && "is-playing", menuOpen && "is-hidden")} data-mode={mode}>
      <div ref={thumb} className="dbar__thumb" onPointerEnter={onEnter} onPointerLeave={onLeave} onPointerDown={onDown}>
        <div className="dbar__inner">
          <button
            type="button"
            className="dbar__hit"
            aria-label="Clock and music player"
            aria-expanded={mode !== "rest"}
            tabIndex={mode === "player" ? -1 : 0}
            onClick={onHitClick}
            onFocus={() => {
              flags.current.focused = true;
              if (modeRef.current === "rest") go("bloom");
            }}
          />

          <div className="dbar__min" inert={mode !== "bloom"}>
            <div className="dbar__min-top">
              <span className="dbar__clock" aria-hidden="true">
                <svg viewBox="0 0 20 20">
                  <rect ref={hourHand} className="dbar__hand" x="9.35" y="4.8" width="1.3" height="5.2" rx="0.65" />
                  <rect ref={minHand} className="dbar__hand" x="9.45" y="2.6" width="1.1" height="7.4" rx="0.55" />
                  <circle cx="10" cy="10" r="1.35" />
                </svg>
              </span>
              <button
                ref={noteBtn}
                type="button"
                className="dbar__note"
                aria-label={st.playing ? `Open the music player — playing ${track.title}` : "Play music"}
                onClick={openPlayer}
              >
                {st.playing ? (
                  <span ref={eq} className="dbar__eq" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M7 15.2V4.6l10-2.2v10.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <ellipse cx="4.6" cy="15.4" rx="2.6" ry="2.1" fill="currentColor" />
                    <ellipse cx="14.6" cy="12.9" rx="2.6" ry="2.1" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
            <p className="dbar__time">
              <span ref={timeEl}>--:--</span>
              <span ref={apEl} className="dbar__sub">
                --
              </span>
              <span className="dbar__sub">IST</span>
            </p>
          </div>

          <div className="dbar__music" role="dialog" aria-label="Music player" inert={mode !== "player"}>
            <MusicCover track={track} className="dbar__cover" />
            <div className="dbar__head">
              <div className="dbar__meta">
                <p className="dbar__title">{track.title}</p>
                <p className="dbar__artist">{track.artist}</p>
              </div>
              <span ref={wave} className="dbar__wave" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <div
              ref={slider}
              className="dbar__timeline"
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(music.duration)}
              aria-valuenow={0}
              onPointerDown={onSliderDown}
              onPointerMove={onSliderMove}
              onPointerUp={onSliderUp}
              onPointerCancel={onSliderUp}
              onKeyDown={onSliderKey}
            >
              <span className="dbar__track">
                <span ref={fill} className="dbar__fill" />
              </span>
            </div>
            <p className="dbar__times" aria-hidden="true">
              <span ref={curEl}>0:00</span>
              <span ref={durEl}>{formatTime(music.duration)}</span>
            </p>
            <div className="dbar__controls">
              <button type="button" className="dbar__ctl" aria-label="Previous track" onClick={() => music.prev()}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 5h2.2v14H5zM20 5.5v13L8.6 12z" fill="currentColor" />
                </svg>
              </button>
              <button
                ref={playBtn}
                type="button"
                className="dbar__ctl dbar__ctl--main"
                aria-label={st.playing ? "Pause" : "Play"}
                onClick={() => music.toggle()}
              >
                {st.playing ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6.5 5h3.6v14H6.5zM13.9 5h3.6v14h-3.6z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 4.5v15L19.5 12z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <button type="button" className="dbar__ctl" aria-label="Next track" onClick={() => music.next()}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M16.8 5H19v14h-2.2zM4 5.5v13L15.4 12z" fill="currentColor" />
                </svg>
              </button>
            </div>
            <p className="dbar__credit">
              Concept :: Xavier Jac (
              <a href="https://x.com/KMkota0" target="_blank" rel="noopener noreferrer">
                @KMkota0
              </a>
              )
            </p>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
