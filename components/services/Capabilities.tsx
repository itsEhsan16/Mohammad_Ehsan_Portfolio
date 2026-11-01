import { capabilities, capabilitiesIntro, toolbelt } from "@/content/capabilities";
import { SectionLabel, Chip } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Marquee } from "@/components/ui/Marquee";

export function Capabilities({ index = "02" }: { index?: string }) {
  return (
    <section id="capabilities" aria-labelledby="cap-title" className="relative py-[clamp(6rem,12vw,11rem)]">
      <div className="grid grid-cols-12 gap-6 px-gutter">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel index={index} title="Capabilities" count={capabilities.length} />
        </div>
        <div className="col-span-12 lg:col-span-9">
          <SplitReveal as="h2" type="lines" id="cap-title" className="text-section max-w-[18ch] font-medium leading-[1.02] tracking-[-0.03em]">
            What I bring to a <em className="t-serif">team</em> — and to a build.
          </SplitReveal>
          <p className="mt-6 max-w-[52ch] text-muted">{capabilitiesIntro}</p>
        </div>
      </div>

      <ul className="mt-[clamp(3rem,6vw,5rem)] border-t border-line">
        {capabilities.map((c, i) => (
          <li key={c.title} className="group cap-row relative border-b border-line">
            <div
              tabIndex={0}
              className="grid grid-cols-12 items-center gap-x-6 px-gutter py-5 outline-offset-[-4px] lg:py-6"
            >
              <span className="t-label col-span-2 text-muted lg:col-span-1">0{i + 1}</span>
              <h3 className="cap-title t-display col-span-10 text-[clamp(2.6rem,8vw,9rem)] leading-[0.86] lg:col-span-6">
                {c.title}
              </h3>
              <div className="cap-detail col-span-12 lg:col-span-5">
                <div className="cap-detail-inner">
                  <p className="pt-4 text-[15px] leading-relaxed text-fg/85 lg:pt-0">{c.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <span aria-hidden="true" className="cap-fill pointer-events-none absolute inset-0 -z-10 origin-bottom bg-surface" />
          </li>
        ))}
      </ul>

      <Marquee items={toolbelt} className="t-display mt-[clamp(3rem,6vw,5rem)] text-[clamp(2.2rem,5vw,5rem)] leading-none text-fg/90" />
    </section>
  );
}
