import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects, statusLabel, getNextProject } from "@/content/projects";
import { resolveProject } from "@/lib/media";
import { jsonLd, pageMetadata, projectJsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import { CaseBlocks } from "@/components/work/CaseBlocks";
import { NextProject } from "@/components/work/NextProject";
import { Footer } from "@/components/chrome/Footer";
import { ProjectMedia } from "@/components/work/ProjectMedia";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Chip } from "@/components/ui/SectionLabel";
import { Icon } from "@/components/ui/Icon";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return pageMetadata({
    title: `${p.title} — Case study`,
    socialTitle: `${p.title} — ${site.name}`,
    description: p.summary,
    path: `/work/${p.slug}`,
    type: "article",
  });
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const raw = projects.find((x) => x.slug === slug);
  if (!raw) notFound();
  const p = resolveProject(raw);
  const next = resolveProject(getNextProject(p.slug));

  const meta = [
    { k: "Type", v: p.kind },
    ...(p.role ? [{ k: "Role", v: p.role }] : []),
    ...(p.year ? [{ k: "Year", v: p.year }] : []),
    { k: "Status", v: statusLabel[p.status] },
  ];

  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(projectJsonLd(p)) }} />
      <header className="px-gutter pb-10 pt-[calc(var(--hud-h)+5.5rem)]">
        <div className="t-label flex items-center justify-between text-muted">
          <TransitionLink href="/work" className="inline-flex items-center gap-2 text-fg/85 hover:text-signal-text">
            <Icon name="arrow-left" size={13} /> All work
          </TransitionLink>
          <span>
            N°{pad(p.index)} / {pad(projects.length)}
          </span>
        </div>
        <SplitReveal as="h1" type="chars" trigger="load" className="t-display mt-8 text-[clamp(3.6rem,13vw,17rem)] leading-[0.82]">
          {p.title}
        </SplitReveal>
        <div className="mt-6 grid grid-cols-12 gap-6">
          <p className="t-serif col-span-12 text-[clamp(1.6rem,3vw,3rem)] leading-[1.05] text-fg/90 lg:col-span-6">{p.tagline}</p>
          <dl className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 lg:col-span-6">
            {meta.map((m) => (
              <div key={m.k}>
                <dt className="t-label text-muted">{m.k}</dt>
                <dd className="mt-1.5 text-[15px] text-fg/90">{m.v}</dd>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-4">
              <dt className="t-label text-muted">Stack</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <Chip key={s}>{s}</Chip>
                ))}
              </dd>
            </div>
            {p.links.length > 0 && (
              <div className="col-span-2 sm:col-span-4">
                <dt className="sr-only">Links</dt>
                <dd className="flex flex-wrap gap-2">
                  {p.links.map((l, i) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        i === 0
                          ? "t-label inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2.5 text-[11px] font-semibold text-ink"
                          : "t-label inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[11px] text-fg hover:border-fg/50"
                      }
                    >
                      {l.label} <Icon name="arrow-up-right" size={12} />
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <div className="px-gutter">
        <ProjectMedia
          project={p}
          variant="blueprint"
          priority
          morphKey={`/work/${p.slug}`}
          className="aspect-[16/10] lg:aspect-[16/8]"
          sizes="100vw"
        />
      </div>

      <div className="mt-[clamp(3rem,6vw,5rem)]">
        <CaseBlocks blocks={p.blocks} />
      </div>

      <Footer />
      <NextProject next={next} />
    </main>
  );
}
