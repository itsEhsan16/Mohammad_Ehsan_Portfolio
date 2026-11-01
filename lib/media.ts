import "server-only";
import fs from "node:fs";
import path from "node:path";
import { projects } from "@/content/projects";
import type { Project } from "@/content/types";

/** True when `src` (a public URL path like "/media/x.jpg") exists in /public at build time. */
export function publicFileExists(src?: string) {
  if (!src) return false;
  try {
    return fs.existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
  } catch {
    return false;
  }
}

/** Projects with media references pruned to files that actually exist. */
export function resolveProject(p: Project): Project {
  return {
    ...p,
    cover: p.cover && publicFileExists(p.cover.src) ? p.cover : undefined,
    loop: p.loop && publicFileExists(p.loop) ? p.loop : undefined,
    blocks: p.blocks
      .map((b) => (b.type === "gallery" ? { ...b, images: b.images.filter((img) => publicFileExists(img.src)) } : b))
      .filter((b) => !(b.type === "gallery" && b.images.length === 0)),
  };
}

export function resolvedProjects() {
  return projects.map(resolveProject);
}

export const portraitSrc = "/media/portrait.jpg";
export const hasPortrait = () => publicFileExists(portraitSrc);
