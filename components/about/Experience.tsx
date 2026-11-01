import { experience } from "@/content/experience";
import { SectionLabel, Chip } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";

const fmt = (d: string | null) => d ?? "Present";

export function Experience({ index = "01" }: { index?: string }) {
  return (
    <section id="experience" aria-labelledby="exp-title" className="relative px-gutter py-[clamp(6rem,12vw,11rem)]">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel index={index} title="Experience" count={experience.length} />
        </div>
        <div className="col-span-12 lg:col-span-9">
          <SplitReveal as="h2" type="lines" id="exp-title" className="text-section max-w-[16ch] font-medium leading-[1.02] tracking-[-0.03em]">
            My professional journey and the <em className="t-serif">teams</em> I&apos;ve built with.
          </SplitReveal>
        </div>
      </div>

      <ol className="mt-[clamp(3rem,6vw,5rem)] border-t border-line">
        {experience.map((r) => (
          <li key={`${r.company}-${r.start}`} className="exp-row group grid grid-cols-12 gap-x-6 gap-y-3 border-b border-line py-7">
            <p className="t-label col-span-12 flex items-center gap-2 text-muted md:col-span-3">
              <span className="tabular-nums">
                {r.start} — {fmt(r.end)}
              </span>
              {r.current && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-signal px-2 py-0.5 font-semibold text-ink">
                  <span className="live-dot !bg-ink" /> Now
                </span>
              )}
            </p>
            <div className="col-span-12 md:col-span-5">
              <h3 className="t-display text-[clamp(2.2rem,4.4vw,4.6rem)] leading-[0.9] transition-colors duration-300 group-hover:text-signal-text">
                {r.company}
              </h3>
              <p className="mt-2 text-[15px] text-fg/80">{r.title}</p>
            </div>
            <div className="col-span-12 md:col-span-4">
              <p className="text-[15px] leading-relaxed text-muted">{r.summary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {r.stack.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
