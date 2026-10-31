import type { Metadata } from "next";
import { site } from "@/content/site";
import { capabilities } from "@/content/capabilities";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { SectionLabel, Chip } from "@/components/ui/SectionLabel";
import { Stamp } from "@/components/about/Stamp";
import { Telemetry } from "@/components/about/Telemetry";
import { Experience } from "@/components/home/Experience";
import { Icon } from "@/components/ui/Icon";
import { Magnetic } from "@/components/ui/Magnetic";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { hasPortrait, portraitSrc } from "@/lib/media";

export const metadata: Metadata = {
  title: "About",
  description: `About ${site.name} — ${site.role} based in India. ${site.about.intro}`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const portrait = hasPortrait() ? portraitSrc : undefined;
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <header className="px-gutter pb-10 pt-[calc(var(--hud-h)+6rem)]">
        <SectionLabel index="00" title="About" />
        <SplitReveal as="h1" type="chars" trigger="load" className="t-display mt-6 text-giant leading-[0.8]">
          About
        </SplitReveal>
      </header>

      <section className="grid grid-cols-12 gap-x-6 gap-y-14 px-gutter pb-[clamp(4rem,8vw,8rem)]">
        <div className="col-span-12 md:col-span-5 lg:col-span-4">
          <Stamp src={portrait} />
          <div className="mt-12">
            <Telemetry />
          </div>
        </div>
        <div className="col-span-12 md:col-span-7 lg:col-span-7 lg:col-start-6">
          <SplitReveal as="p" type="lines" trigger="load" className="text-[clamp(1.6rem,3vw,3rem)] font-medium leading-[1.1] tracking-[-0.025em]">
            {site.about.intro}
          </SplitReveal>
          <div className="mt-10 max-w-[60ch] space-y-5 text-[17px] leading-relaxed text-fg/85">
            {site.about.story.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div>
              <p className="t-label text-muted">Now</p>
              <ul className="mt-4 space-y-2.5">
                {site.about.now.map((n) => (
                  <li key={n} className="flex items-start gap-3 text-[15px] text-fg/90">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" /> {n}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="t-label text-muted">Toolbox</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {capabilities.flatMap((c) => c.tags).map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Magnetic>
              <a
                href={site.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="t-label inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3.5 text-[12px] font-semibold text-ink"
              >
                Download résumé <Icon name="arrow-up-right" size={13} />
              </a>
            </Magnetic>
            <TransitionLink
              href="/work"
              className="t-label inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-[12px] text-fg hover:border-fg/50"
            >
              See the work <Icon name="arrow-right" size={13} />
            </TransitionLink>
          </div>
        </div>
      </section>

      <Experience />
    </main>
  );
}
