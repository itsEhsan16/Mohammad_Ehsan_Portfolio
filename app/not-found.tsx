import type { Metadata } from "next";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "404 — Error",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-gutter pt-[calc(var(--hud-h)+5rem)] outline-none">
      <p className="t-label text-signal-text">404 // Route not found</p>
      <h1 className="relative mt-4 select-none">
        <span className="t-display block text-[clamp(6rem,30vw,40rem)] leading-[0.78]">Error</span>
        <span
          aria-hidden="true"
          className="glitch-layer t-display pointer-events-none absolute inset-0 block text-[clamp(6rem,30vw,40rem)] leading-[0.78] text-signal mix-blend-screen"
        >
          Error
        </span>
      </h1>
      <p className="mt-8 max-w-[44ch] text-[clamp(1.1rem,1.6vw,1.4rem)] leading-snug text-fg/85">
        This route failed to compile. The page you&apos;re looking for doesn&apos;t exist — or it moved during the rebuild.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <TransitionLink href="/" className="t-label inline-flex items-center gap-2 rounded-full bg-signal px-5 py-3 text-[11px] font-semibold text-ink">
          <Icon name="arrow-left" size={13} /> Back home
        </TransitionLink>
        <TransitionLink href="/work" className="t-label inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-[11px] text-fg hover:border-fg/50">
          See the work
        </TransitionLink>
        <span className="t-label text-muted">or press ⌘K / Ctrl+K</span>
      </div>
    </main>
  );
}
