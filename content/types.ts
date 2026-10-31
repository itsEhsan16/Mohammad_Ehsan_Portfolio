export type ProjectStatus = "live" | "open-source" | "in-development";

export interface ProjectLink {
  label: string;
  href: string;
}

/** A case-study block. Empty or missing blocks are simply not rendered. */
export type CaseBlock =
  | { type: "text"; label: string; title?: string; body: string[] }
  | { type: "features"; label: string; title?: string; items: { title: string; body: string }[] }
  | { type: "stack"; label: string; title?: string; items: { name: string; why: string }[] }
  | { type: "gallery"; label: string; title?: string; images: { src: string; alt: string; caption?: string }[] }
  | { type: "stats"; label: string; title?: string; items: { value: string; label: string }[] }
  | { type: "status"; label: string; title?: string; body: string[]; next?: string[] };

export interface Project {
  slug: string;
  index: number;
  title: string;
  /** Short serif-italic line under the title. */
  tagline: string;
  /** One or two sentences used on cards and in metadata. */
  summary: string;
  kind: string;
  role?: string;
  year?: string;
  status: ProjectStatus;
  stack: string[];
  links: ProjectLink[];
  /** Cover image. Falls back to a procedural "blueprint card" if the file is missing. */
  cover?: { src: string; alt: string };
  /** Optional muted loop video for hover previews. */
  loop?: string;
  blocks: CaseBlock[];
}

export interface Role {
  company: string;
  title: string;
  start: string;
  end: string | null;
  current: boolean;
  summary: string;
  stack: string[];
}

export interface Capability {
  title: string;
  description: string;
  tags: string[];
}

export interface ServiceStep {
  step: string;
  title: string;
  body: string;
  tag?: string;
}
