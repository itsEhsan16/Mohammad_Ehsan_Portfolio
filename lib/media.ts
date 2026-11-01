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

/**
 * Pixel size of a JPEG, PNG or WebP in /public, read from the file header at
 * build time (no image library). Undefined when the file is missing or unknown.
 */
export function imageSize(src: string): { w: number; h: number } | undefined {
  let b: Buffer;
  try {
    const fd = fs.openSync(path.join(process.cwd(), "public", src.replace(/^\//, "")), "r");
    const buf = Buffer.alloc(256 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    b = buf.subarray(0, n);
  } catch {
    return undefined;
  }
  // PNG: IHDR follows the 8-byte signature
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  // WebP: RIFF container with a VP8X, VP8 (lossy) or VP8L (lossless) first chunk
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const chunk = b.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
    }
  }
  // JPEG: walk the segments to the first start-of-frame marker
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const m = b[i + 1];
      if (m === 0xff) {
        i++;
        continue;
      }
      if (m === 0x01 || (m >= 0xd0 && m <= 0xd8)) {
        i += 2;
        continue;
      }
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return undefined;
}
