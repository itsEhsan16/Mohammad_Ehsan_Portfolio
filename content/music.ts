import type { PieceId } from "@/lib/music/synth";

/**
 * The music behind the scrollbar's ♪. The built-in tracks are generated live in
 * the browser (lib/music/synth.ts) — no files, nothing to license.
 *
 * To add a real song: put the MP3 (and optionally a square cover) in
 * public/media/music/ and add an entry with `src` (and `cover`), e.g.
 *   { id: "night-drive", title: "Night Drive", artist: "Someone", src: "/media/music/night-drive.mp3", cover: "/media/music/night-drive.jpg" }
 * Only use audio you have the rights to publish.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  /** a built-in piece, played live with Web Audio … */
  synth?: PieceId;
  /** … or an audio file in /public */
  src?: string;
  /** cover image in /public; without one a generated cover is drawn */
  cover?: string;
}

export const playlist: Track[] = [
  { id: "blueprint", title: "Blueprint", artist: "Mohammad Ehsan", synth: "blueprint" },
  { id: "signal", title: "Signal", artist: "Mohammad Ehsan", synth: "signal" },
  { id: "render", title: "Render", artist: "Mohammad Ehsan", synth: "render" },
];
