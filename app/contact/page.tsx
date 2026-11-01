import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SplitReveal } from "@/components/ui/SplitReveal";
import { Contact } from "@/components/contact/Contact";

export const metadata = pageMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}. ${site.availability.detail}. Write through the form, by email or on ${site.socials.map((s) => s.label).join(", ")}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <header className="px-gutter pb-6 pt-[calc(var(--hud-h)+6rem)]">
        <SectionLabel index="00" title="Contact" />
        <SplitReveal as="h1" type="chars" trigger="load" className="t-display mt-6 text-giant leading-[0.8]">
          Contact
        </SplitReveal>
      </header>
      <Contact />
    </main>
  );
}
