import type { Metadata } from "next";
import { site } from "@/content/site";
import { capabilities } from "@/content/capabilities";
import type { Project } from "@/content/types";

/**
 * Metadata for a page with its own link preview. A page that sets `openGraph`
 * replaces the root object, so every field is filled in here. The page needs
 * its own `opengraph-image` file too, or the preview loses its image.
 */
export function pageMetadata({
  title,
  description,
  path,
  socialTitle = `${title} — ${site.name}`,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  socialTitle?: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      title: socialTitle,
      description,
      url: `${site.url}${path}`,
      siteName: `${site.name} — Portfolio`,
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", creator: site.twitterHandle, title: socialTitle, description },
  };
}

/** Serialize JSON-LD safely for a <script> tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    email: `mailto:${site.email}`,
    address: { "@type": "PostalAddress", addressCountry: "IN" },
    sameAs: site.socials.map((s) => s.href),
    knowsAbout: Array.from(new Set(capabilities.flatMap((c) => c.tags))),
  };
}

export function projectJsonLd(p: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    headline: p.tagline,
    description: p.summary,
    url: `${site.url}/work/${p.slug}`,
    author: { "@type": "Person", name: site.name, url: site.url },
    keywords: p.stack.join(", "),
    ...(p.links.length ? { sameAs: p.links.map((l) => l.href) } : {}),
  };
}
