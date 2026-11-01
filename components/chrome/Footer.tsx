import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Icon } from "@/components/ui/Icon";
import { SayHello } from "./SayHello";
import { CopyEmail, BackToTop, LocalTime } from "./FooterBits";
import { Stickers } from "@/components/ui/Stickers";

const sha = process.env.NEXT_PUBLIC_BUILD_SHA || "local";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-[clamp(6rem,14vw,14rem)] overflow-hidden border-t border-line" aria-labelledby="footer-title" data-nosnippet>
      <div className="px-gutter pt-6">
        <div className="t-label flex items-center justify-between text-muted">
          <span>
            <span className="text-signal">∞</span> {"//"} Say hello
          </span>
          <span className="hidden sm:inline">
            Replies from {site.location.label} · <LocalTime />
          </span>
        </div>
      </div>

      <div className="relative">
        <h2 id="footer-title" className="sr-only">
          Say hello — contact {site.name}
        </h2>
        <SayHello />
        <Stickers />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line px-gutter py-10 md:grid-cols-12">
        <div className="col-span-2 md:col-span-5" data-footer-cta>
          <p className="t-label mb-3 text-muted">Start a project</p>
          <CopyEmail />
          <div className="mt-5 flex flex-wrap gap-2">
            <TransitionLink
              href="/contact"
              className="t-label inline-flex items-center gap-2 rounded-full bg-fg px-4 py-2.5 text-[11px] text-bg transition-transform hover:-translate-y-0.5"
            >
              Write a message <Icon name="arrow-right" size={13} />
            </TransitionLink>
            <a
              href={site.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="t-label inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[11px] text-fg transition-colors hover:border-fg/50"
            >
              Résumé <Icon name="arrow-up-right" size={13} />
            </a>
          </div>
        </div>

        <nav aria-label="Footer" className="md:col-span-2">
          <p className="t-label mb-3 text-muted">Pages</p>
          <ul className="t-display space-y-1 text-[22px] leading-none">
            {[{ label: "Home", href: "/" }, ...site.nav].map((l) => (
              <li key={l.href}>
                <TransitionLink href={l.href} className="transition-colors hover:text-signal">
                  {l.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-2">
          <p className="t-label mb-3 text-muted">Work</p>
          <ul className="space-y-1.5 text-sm">
            {projects.map((p) => (
              <li key={p.slug}>
                <TransitionLink href={`/work/${p.slug}`} className="text-fg/80 transition-colors hover:text-fg">
                  {p.title}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="t-label mb-3 text-muted">Elsewhere</p>
          <ul className="space-y-1.5 text-sm">
            {site.socials.map((s) => (
              <li key={s.href}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-fg/80 transition-colors hover:text-fg"
                >
                  {s.label}
                  <Icon name="arrow-up-right" size={12} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
          <p className="t-label mt-6 flex items-center gap-2 text-muted">
            <span className="live-dot" /> {site.availability.detail}
          </p>
        </div>
      </div>

      <div className="t-label flex flex-wrap items-center justify-between gap-3 border-t border-line px-gutter py-5 text-[10px] text-muted">
        <span>
          © {year} {site.name}
        </span>
        <span className="hidden md:inline">Designed &amp; built in-house — Next.js · GSAP · WebGL</span>
        <span>Build {sha}</span>
        <BackToTop />
      </div>
    </footer>
  );
}
