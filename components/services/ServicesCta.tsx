import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Magnetic } from "@/components/ui/Magnetic";
import { Icon } from "@/components/ui/Icon";
import { TransitionLink } from "@/components/transition/TransitionLink";

/** The closing call to action on /services. */
export function ServicesCta() {
  return (
    <section aria-labelledby="start-title" className="relative px-gutter py-[clamp(6rem,12vw,11rem)]">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel index="03" title="Next step" />
        </div>
        <div className="col-span-12 lg:col-span-9">
          <SplitReveal as="h2" type="lines" id="start-title" className="t-display text-huge">
            Tell me what you&apos;re <span className="t-serif normal-case text-signal-text">building.</span>
          </SplitReveal>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Magnetic>
              <TransitionLink
                href="/contact"
                className="t-label inline-flex items-center gap-3 rounded-full bg-signal px-6 py-4 text-[12px] font-semibold text-ink"
              >
                Start a project <Icon name="arrow-right" size={14} />
              </TransitionLink>
            </Magnetic>
            <span className="t-label text-muted">Free intro call · scope &amp; timeline before anything starts</span>
          </div>
        </div>
      </div>
    </section>
  );
}
