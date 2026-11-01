# Asset list and generation prompts

The site is complete without any of these:
- Projects without a cover render a procedural blueprint poster.
- The about page shows a typographic stamp.
- UI sounds, the favicon, OG images, stickers and grain are all generated in code.

Add files at the exact paths below and rebuild. `lib/media.ts` checks which files exist at build time and switches them on automatically.

## Art direction (applies to every generated image)

- Ink-black background **#0B0B0A** and bone/paper materials **#EDEAE4**.
- One accent of signal orange **#FF4D00**.
- Studio still life with hard side or rim light, deep shadows and generous negative space.
- Fine film grain. No text, no logos, no UI, no people.
- High-contrast silhouettes. The site first draws every image as an edge-detected "blueprint" and a halftone, then resolves it to full colour, so clear shapes read best.

**Common negative prompt** (Midjourney `--no`, or the negative field elsewhere):

```
text, letters, typography, watermark, logo, UI, screen, people, hands, neon, cyberpunk, rainbow gradients, clutter, plastic CGI look, oversaturated, lens flare
```

**Export:**
- Covers: 16:10, at least 2400×1500, JPG at quality 90. They're used as-is through `next/image`, so WebP/AVIF are produced automatically.
- Videos: 16:10 at 1920×1200, a 6–10 s seamless loop, MP4 (H.264) plus an optional WebM, no audio, 4 MB or less.

Suggested tools: Midjourney v7, Imagen, Flux or Firefly for stills; Veo, Sora, Kling or Runway for loops. Append `--ar 16:10 --style raw` in Midjourney.

## 1. Project covers (most impact)

**Status (2026-11-01):** covers 1–4 are generated and in the repo.
- **Tool:** Figma Weave, model Nano Banana 2.1.
- **Settings:** resolution 2K, aspect ratio 16:9, JPEG. The output is 2752×1536; the files are saved at 2000×1116.
- **Prompts:** each prompt below was sent with the art-direction line in front and a "Strictly no text, no letters, no numbers, no logos, no UI, no people…" constraint after it, because the model has no negative-prompt field.
- **Cover 5** is currently a real screenshot of this site. Generate it only if you prefer the art.

| # | Save as | Used in | Prompt |
|---|---|---|---|
| 1 | `public/media/work/adaptive-learning/cover.jpg` | Work reel, `/work`, case-study hero, OG | Overhead editorial still life on an ink-black surface: dozens of small bone-white paper index cards arranged as a branching path that splits and reconverges like a learning roadmap; one continuous signal-orange (#FF4D00) thread tracing a single personalised route through them; a few cards marked with tiny pencil check marks; soft raking light, deep shadows, macro paper-fibre detail; minimal, generous negative space, subtle film grain |
| 2 | `public/media/work/task-management-app/cover.jpg` | Same | Top-down flat lay on charcoal felt: a precise Swiss grid of bone-white paper task cards with hand-drawn checkboxes, several ticked in signal-orange (#FF4D00) ink; smaller subtask cards clipped beneath their parents with black binder clips; one card lifted at an angle casting a crisp shadow; controlled overhead softbox light; minimal editorial still life, subtle film grain |
| 3 | `public/media/work/seva/cover.jpg` | Same (concept art, in development) | Cinematic still life on dark slate: everyday service tools — a wrench, a paint brush, scissors, a screwdriver, a stethoscope, a sponge — arranged in a perfect radial ring around a single glossy signal-orange (#FF4D00) map pin standing at the centre; hard top light with long shadows; ink-black falloff; matte textures; symmetrical, minimal, editorial product photography, film grain |
| 4 | `public/media/work/desi-etsy/cover.jpg` | Same (concept art, in development) | Editorial still life of handmade Asian crafts on an ink-black plinth — a hand-thrown unglazed clay cup, folded indigo block-printed cotton, a hammered brass bowl, a woven bamboo coaster — lit by one narrow beam of warm light; a single saffron-orange (#FF4D00) silk thread draped across the composition; rich tactile textures, deep shadows; medium format, minimal, generous negative space, film grain |
| 5 | `public/media/work/personal-portfolio/cover.jpg` | Same | Studio still life of a single matte-black glass slab standing upright on an ink-black surface; its face covered in a fine halftone dot pattern that gradually resolves into solid signal-orange (#FF4D00) toward one edge; faint white blueprint grid lines etched around it; hard rim light from the left, deep shadows; minimal composition with negative space on the right; medium format, 85 mm, f/5.6; subtle film grain; editorial product photography |

## 2. Optional loops (AI video, for in-development projects)

**Status:** not generated yet.

When a `loop.mp4` exists, it plays muted in place of the still on the reel, on `/work` and in the case hero, with the cover as its poster. It's paused when the visitor prefers reduced motion.

Adding a loop has a trade-off: that project loses the WebGL blueprint effect and the card→case morph, which work on stills only.

| # | Save as | Prompt |
|---|---|---|
| 6 | `public/media/work/seva/loop.mp4` | Slow top-down camera drift over an ink-black city map drawn in thin bone-white blueprint lines; small signal-orange map pins drop softly into place one by one, each emitting a subtle ripple; thin lines draw from a central pin to tiny matte service tools (wrench, brush, scissors); calm, elegant, smooth motion; seamless loop; no text |
| 7 | `public/media/work/desi-etsy/loop.mp4` | Macro dolly gliding across handmade crafts on an ink-black surface — clay cup, indigo block-print textile, brass bowl; a single warm light beam sweeps slowly across, revealing textures; a saffron-orange thread gently sways; shallow depth of field, luxurious, seamless loop; no text |

## 3. Real captures (better than AI for shipped work)

| # | Save as | What to capture |
|---|---|---|
| 8 | `public/media/work/adaptive-learning/shot-1.webp` … `shot-4.webp` (+ `loop.mp4`) | At 1440×900: the home screen, a learning path, the schedule, and progress tracking. Plus a 10 s screen recording scrolling through a flow, cropped to 16:10. |
| 9 | `public/media/work/task-management-app/shot-1.webp` … `shot-3.webp` | The task board, a task with subtasks, and the sign-in screen (run the app locally) |
| 10 | `public/media/work/personal-portfolio/shot-*.webp` | Screens of this site (the hero, the /work field, the paper theme, /services) |

If you'd rather have the agent capture item 8 automatically, add `aiadaptivelearning.netlify.app` to the cloud environment's **Allowed domains**.

## 4. Portrait (your photo)

**Save as:** `public/media/portrait.jpg`

**Spec:**
- 4:5, at least 1600×2000, head and shoulders.
- Plain light-grey or white background, soft light from one side, sharp eyes, no heavy filters.

**What the site does with it:**
- It renders as a halftone "ink stamp" with a perforated edge, and develops to full colour around the cursor.
- On touch devices and without WebGL it shows as a high-contrast monochrome photo.

## 5. Résumé (optional)

To serve a PDF from the site instead of Google Drive, save it as `public/Mohammad-Ehsan-Resume.pdf`. Then change `resume` in `content/site.ts` to `"/Mohammad-Ehsan-Resume.pdf"`, and the redirect destination in `next.config.mjs` to the same path.
