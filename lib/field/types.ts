/** One tile in the /work field. Built on the server from the case studies (see lib/field/items.ts). */
export interface FieldItem {
  /** Stable key, e.g. "seva:cover". */
  key: string;
  slug: string;
  /** Project number (N°01…). */
  index: number;
  /** Tile number across the whole field (1-based). */
  n: number;
  title: string;
  kind: string;
  status: string;
  tagline: string;
  summary: string;
  stack: string[];
  links: { label: string; href: string }[];
  /** What this tile shows: "Key visual", a screenshot caption, or "Spec sheet". */
  caption: string;
  /** Image tiles carry a source and its pixel size; spec tiles have none and render as type. */
  src?: string;
  alt?: string;
  w?: number;
  h?: number;
}
