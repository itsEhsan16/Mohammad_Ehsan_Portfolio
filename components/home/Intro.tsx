import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Manifesto } from "@/components/ui/Manifesto";

/** The home intro: the manifesto read word by word as you scroll, and three quick facts. */
export function Intro() {
  return (
    <section id="intro" aria-labelledby="intro-label" className="relative px-gutter py-[clamp(6rem,14vw,12rem)]">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <SectionLabel id="intro-label" index="01.1" title="Intro" className="lg:sticky lg:top-32" />
        </div>
        <div className="col-span-12 lg:col-span-9">
          <Manifesto className="text-[clamp(1.65rem,3.55vw,3.6rem)] leading-[1.08]" start="top 80%" end="bottom 45%" />

          <dl className="mt-[clamp(3rem,6vw,6rem)] grid grid-cols-1 gap-px overflow-hidden rounded-[6px] border border-line bg-line sm:grid-cols-3">
            {[
              { k: "Shipping since", v: String(site.since), d: "Freelance and in-house roles" },
              { k: "Selected projects", v: String(projects.length).padStart(2, "0"), d: "Shipped and in development" },
              { k: "Based in", v: site.location.tzLabel, d: `${site.location.country} · UTC+05:30 · remote-friendly` },
            ].map((s) => (
              <div key={s.k} className="bg-bg p-5 sm:p-6">
                <dt className="t-label text-muted">{s.k}</dt>
                <dd className="mt-3">
                  <span className="t-display block text-[clamp(3rem,6vw,5.5rem)] leading-none">{s.v}</span>
                  <span className="mt-2 block text-sm text-muted">{s.d}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
