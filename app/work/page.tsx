import type { Metadata } from "next";
import { WorkView } from "@/components/work/WorkView";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { statusLabel } from "@/content/projects";
import { resolvedProjects } from "@/lib/media";
import { fieldItems, reelProjects } from "@/lib/field/items";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects by Mohammad Ehsan — an AI learning platform, a task manager, a services marketplace, an artisan storefront and this portfolio.",
  alternates: { canonical: "/work" },
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function WorkPage() {
  const projects = resolvedProjects();
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <WorkView items={fieldItems(projects)} projects={reelProjects(projects)}>
        {/* the page without JS and for crawlers; with JS it becomes the keyboard shortcut list (see WorkView) */}
        <section className="work-static px-gutter pb-24 pt-[calc(var(--hud-h)+6rem)]">
          <SectionLabel index="02" title="Index of work" count={projects.length} />
          <h1 className="t-display mt-6 text-giant leading-[0.8]">Work</h1>
          <nav aria-label="Projects" className="mt-12">
            <p className="work-static__hint t-label text-[10px] text-muted">Jump to a project</p>
            <ol className="work-static__list border-t border-line">
              {projects.map((p) => (
                <li key={p.slug} className="border-b border-line">
                  <TransitionLink href={`/work/${p.slug}`} className="work-static__link group flex flex-wrap items-baseline gap-x-6 gap-y-2 py-6">
                    <span className="t-label w-10 text-muted">N°{pad(p.index)}</span>
                    <span className="work-static__title t-display text-[clamp(2.4rem,6vw,6.6rem)] leading-[0.88] transition-colors group-hover:text-signal-text">
                      {p.title}
                    </span>
                    <span className="work-static__meta t-label text-muted">
                      {p.kind} · {statusLabel[p.status]}
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ol>
          </nav>
        </section>
      </WorkView>
    </main>
  );
}
