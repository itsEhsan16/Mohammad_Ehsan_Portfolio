import "server-only";
import type { Project } from "@/content/types";
import { statusLabel } from "@/content/projects";
import { imageSize } from "@/lib/media";
import type { FieldItem } from "./types";

type Draft = Omit<FieldItem, "n">;

function base(p: Project): Omit<Draft, "key" | "caption" | "src" | "alt" | "w" | "h"> {
  return {
    slug: p.slug,
    index: p.index,
    title: p.title,
    kind: p.kind,
    status: statusLabel[p.status],
    tagline: p.tagline,
    summary: p.summary,
    stack: p.stack,
    links: p.links,
  };
}

function image(p: Project, key: string, src: string, alt: string, caption: string): Draft | null {
  const size = imageSize(src);
  if (!size) return null;
  return { ...base(p), key: `${p.slug}:${key}`, caption, src, alt, w: size.w, h: size.h };
}

/**
 * The tiles of the /work field, from projects whose media has already been
 * resolved against /public. Order matters: neighbours in this list end up next
 * to each other, so the key visuals lead and screenshots and type-only spec
 * sheets alternate after them.
 */
export function fieldItems(projects: Project[]): FieldItem[] {
  const covers: Draft[] = [];
  const shots: Draft[] = [];
  const sheets: Draft[] = [];

  for (const p of projects) {
    const cover = p.cover ? image(p, "cover", p.cover.src, p.cover.alt, "Key visual") : null;
    if (cover) covers.push(cover);
    for (const block of p.blocks) {
      if (block.type !== "gallery") continue;
      block.images.forEach((img, i) => {
        const shot = image(p, `shot-${i + 1}`, img.src, img.alt, img.caption ?? img.alt.split("—").pop()?.trim() ?? "Screen");
        if (shot) shots.push(shot);
      });
    }
    sheets.push({ ...base(p), key: `${p.slug}:sheet`, caption: "Spec sheet" });
  }

  // covers first, then screenshots and sheets interleaved
  const rest: Draft[] = [];
  const max = Math.max(shots.length, sheets.length);
  for (let i = 0; i < max; i++) {
    if (shots[i]) rest.push(shots[i]);
    if (sheets[i]) rest.push(sheets[i]);
  }
  return [...covers, ...rest].map((d, i) => ({ ...d, n: i + 1 }));
}
