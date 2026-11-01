import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Process } from "@/components/services/Process";
import { Capabilities } from "@/components/services/Capabilities";
import { ServicesCta } from "@/components/services/ServicesCta";

export const metadata = pageMetadata({
  title: "Services",
  description: `Freelance builds by ${site.name}: landing pages and marketing sites, web apps and dashboards, design to production, and performance and accessibility work.`,
  path: "/services",
});

export default function ServicesPage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <header className="px-gutter pb-6 pt-[calc(var(--hud-h)+6rem)]">
        <SectionLabel index="00" title="Services" />
        <SplitReveal as="h1" type="chars" trigger="load" className="t-display mt-6 text-giant leading-[0.8]">
          Services
        </SplitReveal>
      </header>
      <Process />
      <Capabilities />
      <ServicesCta />
    </main>
  );
}
