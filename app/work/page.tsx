import type { Metadata } from "next";
import { WorkIndex } from "@/components/work/WorkIndex";
import { WorkView } from "@/components/work/WorkView";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { resolvedProjects } from "@/lib/media";
import { fieldItems } from "@/lib/field/items";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by Mohammad Ehsan — an AI learning platform, a task manager, a services marketplace, an artisan storefront and this portfolio.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  const projects = resolvedProjects();
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <WorkView items={fieldItems(projects)}>
        <header className="px-gutter pb-10 pt-[calc(var(--hud-h)+6rem)]">
          <SectionLabel index="02" title="Index of work" count={projects.length} />
          <div className="mt-6 flex items-start gap-3">
            <SplitReveal as="h1" type="chars" trigger="load" className="t-display text-giant leading-[0.8]">
              Work
            </SplitReveal>
            <span className="t-label mt-[2vw] text-[clamp(14px,1.6vw,22px)] text-signal-text">({String(projects.length).padStart(2, "0")})</span>
          </div>
          <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-fg/85">
            A selection of projects I&apos;ve worked on — shipped, open source and in development. Each one opens into a
            short case study.
          </p>
        </header>
        <WorkIndex projects={projects} />
      </WorkView>
    </main>
  );
}
