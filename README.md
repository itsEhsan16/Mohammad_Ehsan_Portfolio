# Mohammad Ehsan — Portfolio v2 "RENDER"

Personal portfolio of **Mohammad Ehsan**, software engineer and front-end developer based in India.

Live: <https://mohammadehsan.vercel.app>

The site behaves like a renderer. Everything starts as a blueprint (halftone dots, wireframes, mono annotations) and resolves into final pixels as you interact with it:
- **Home:** one stage. A 3D figure stands on a dithered ridge in front of the giant halftone name; your cursor paints the name signal orange and "renders" the figure in full colour. Drag to look around.
- **Project images:** they start as edge-detected blueprints and develop into colour as they scroll into view.
- **Page navigation:** pages "compile" through an ordered-dither wipe, or morph from a project card into its case study.
- **`/work`:** three views behind a LIST · WHEEL · GRID switcher, all of them endless. LIST and WHEEL are a looping strip of big titles with a preview card; GRID is a drag-through field where the middle of the screen renders in colour while the edges stay blueprint.

## Highlights

**WebGL** (OGL, loaded after first paint and only on desktop pointers: the engine is about 13 KB gzipped; the home scene adds about 10 KB, and the model loader about 8 KB once you add a model):
- The home scene: terrain and figure render offscreen (two outputs plus depth), then are composited as ordered dither. The ground is drawn before the painted name and the figure after it, so the name sits between them.
- The figure is a procedural wooden mannequin until you add your own GLB (rigged and animated models work); see [The home scene and your 3D model](#the-home-scene-and-your-3d-model).
- An ink-field name driven by a ping-pong trail simulation that spans the whole stage, with click ripples and an idle autopilot.
- Blueprint→render image planes synced to the DOM.
- A shared-element morph into each case study, from a project card or from the work field's open picture.
- The work field's backdrop: noise density computed once per dither cell, then ordered-dithered to the screen, with the cursor trail tearing holes in it.

**Motion** (GSAP + Lenis on a single ticker):
- Split-text reveals and a scroll-scrubbed manifesto on /about.
- Tilted service cards that fan out on /services.
- Variable-font letters that react to the cursor.
- Scramble titles and magnetic buttons.

**Chrome:**
- HUD telemetry strip: IST clock, availability, FPS, build and scroll.
- A dynamic scrollbar in place of the native one. A thin pill follows the page while it moves and blooms into a capsule with a live IST clock and ♪; ♪ opens a small music player with built-in tracks played live through Web Audio.
- ⌘K command palette.
- A macOS-style pointer set (black fill, signal-orange outline): arrow, hand, I-beam over text, open and closed hands for dragging, a crosshair where the hero can be painted, and a copy pointer. Hints such as "Open" or "Drag" appear in a small tooltip beside it. A rainbow pinwheel spins beside the arrow while a page changes, and shaking the mouse makes the pointer grow, like macOS.
- Ink/paper theme toggle with a circular reveal.
- Optional synthesized UI sounds (Web Audio, off by default).
- Draggable holographic stickers.

**`/work` views** (switcher at the bottom centre; the choice is remembered, GRID by default):
- **LIST** — a looping column of project titles. Hover a title to preview it; the preview card slides beside it and "renders" the cover in behind an orange scan line.
- **WHEEL** — the same titles as spokes of a wheel whose hub sits off-screen. It snaps to the title in the middle. LIST and WHEEL morph into each other, row by row.
- **GRID** — the work field, below.
- Scroll, drag, swipe or ↑↓ move the strip; Enter opens the highlighted project, and the preview picture morphs into the case study.

**The work field** (GRID):
- A wrap-around grid of project tiles: key visuals, screenshots and type-only spec sheets. Drag, scroll/trackpad, arrow keys or touch move it; it never runs out.
- While it moves, cards shrink, flatten along the direction of travel, round their corners and split into RGB. At rest they lean toward the pointer.
- Colour belongs to the middle of the screen: cards toward the edges cross-fade to a grey, dot-screened blueprint.
- Rest on a card and everything else steps back. Click it and the picture flies to the middle, with a link that morphs into the case study.
- CRT glass over the field (grade, scan lines, vignette, a slow refresh band), a dithered WebGL backdrop that pans with the field and tears open under the cursor, and a HUD with live coordinates.
- Reduced motion and crawlers start on LIST; no-JS visitors get a plain list of links (it stays in the page as a keyboard list that appears when focused). The camera and strip positions are kept for the session.

**Pages:**
- Home: one stage, with your name, intro, availability, résumé and an index into every page. No long scroll and no footer.
- `/work` (LIST · WHEEL · GRID) and 5 static case studies with scroll-to-advance.
- `/about`: the manifesto, story, stamp portrait, live telemetry card and experience.
- `/services`: the process deck, what I can build, capabilities and a call to action.
- `/contact`: the contact form, email, socials, availability and local time.
- A custom 404.

**Built to degrade gracefully:**
- All content is server-rendered HTML.
- Reduced motion turns off smooth scroll, pinning and WebGL.
- Touch devices get CSS halftones instead of WebGL. The home stage shows the same skyline as a dot screen, plus your cut-out still once you export one.
- No-JS visitors get the complete page.
- Losing the WebGL context falls back to the DOM.

**SEO:**
- Per-page metadata, JSON-LD (`Person` and `CreativeWork`) and dynamic OG images.
- Sitemap, robots, manifest, icons, and a `/resume` redirect.

## Stack

| Area | Packages |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4 (CSS-first tokens in `app/globals.css`) |
| Motion | GSAP 3.15 (ScrollTrigger, SplitText, ScrambleText, CustomEase, Draggable, Inertia) + `@gsap/react`, Lenis |
| WebGL | OGL (WebGL2) |
| Misc | cmdk (palette), EmailJS (contact form) |

Fonts are self-hosted (OFL) in `assets/fonts`: Archivo variable (weight + width axes), Geist, Geist Mono and Instrument Serif.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # optional — see below
pnpm dev                     # http://localhost:3000
```

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / server |
| `pnpm lint` | ESLint (flat config, `eslint-config-next`) |
| `pnpm type-check` | `next typegen && tsc --noEmit` |
| `pnpm check` | type-check + lint |

**Debug flags** (add to any URL):

| Flag | Effect |
|---|---|
| `?gl=force` | Run WebGL even on software renderers or touch |
| `?gl=0` | Disable WebGL |
| `?boot=1` | Force the boot preloader |
| `?boot=0` | Skip the boot preloader |
| `?view=grid` / `list` / `wheel` | Force a `/work` view for this visit |
| `?cursor=mac` / `?cursor=system` | Force the Mac pointer or the system cursor for this visit |
| `?figure=standin` | Dev only: show the mannequin even when your model exists |
| `?figure=still` | Dev only: export the phone still of the figure (see below) |
| `?figure=/media/hero/_test/x.glb` | Dev only: try another GLB in the home scene |

## Editing content

All copy lives in typed modules under `content/`. Nothing is hard-coded in components.

| File | What's inside |
|---|---|
| `content/site.ts` | Name, role, links, résumé, location/timezone, availability, hero subline, manifesto, about page, and `nav` (the header, menu, footer, ⌘K and the home index all read it) |
| `content/projects.ts` | The 5 case studies, built from blocks (`text`, `features`, `stack`, `gallery`, `stats`, `status`) |
| `content/experience.ts` | Roles. The Infotact description is a draft to refine. |
| `content/capabilities.ts` | Skill groups on /services (also feeds the marquee and /about's toolbox) |
| `content/services.ts` | /services: the intro, process cards and offerings (no prices) |
| `content/music.ts` | The playlist behind the scrollbar's ♪ (built-in pieces, or your own MP3s) |

**How case-study content works:**
- Add a `{ type: "stats" }` block once you have real numbers. Empty blocks are hidden.
- Gallery images listed in `projects.ts` appear automatically once the file exists in `public/` (checked at build time).

## Images, video and the portrait

The site is complete without any media files:
- Projects without a cover render a procedural blueprint poster.
- The about stamp shows a typographic placeholder.

Drop files at the documented paths and rebuild. They are picked up automatically. Each project's paths are:

| Asset | Path |
|---|---|
| Cover | `public/media/work/<slug>/cover.jpg` (16:10) |
| Optional loop | `public/media/work/<slug>/loop.mp4` |
| Screenshots | `public/media/work/<slug>/shot-N.webp` |
| Portrait | `public/media/portrait.jpg` (4:5) |

Prompts for every asset are in **[`docs/ASSET_PROMPTS.md`](docs/ASSET_PROMPTS.md)**.

## The home scene and your 3D model

The home page is one stage (`components/home/HomeStage.tsx`). Your name, intro, availability, résumé and the index into every page are real HTML. On desktop WebGL, `lib/gl/scene.ts` draws the scene behind them:
- **Ground:** a ring of hills built from one height function (`lib/gl/terrain.ts`), dithered in 3 px dots, with contour lines that glow orange under the cursor. The same function places the feet and draws the dot-screen fallback on the server.
- **Figure:** dithered in 2 px cells with an RGB split at its edges. Under the cursor it shows the "render": full colour with an orange rim.
- **Camera:** drag to orbit, wheel to move closer or further. The pointer adds a little parallax, and when you leave it alone the stage drifts and settles back to the hero framing.
- **Readouts:** the HUD shows the live camera angles, distance, triangle count, figure and clip.

Without your model, a procedural wooden mannequin stands in.

**Adding your model:**
1. Put `me.glb` in `public/media/hero/`.
2. Optionally add `public/media/hero/me.json`, e.g. `{ "yaw": 0, "height": 1.8, "clip": "idle" }`. `yaw` turns a model that doesn't face the camera, `height` is in metres, and `clip` names the animation to play.
3. Run `pnpm dev`, open `/?figure=still` on a desktop, and save the `figure.webp` it downloads into `public/media/hero/`. Phones, tablets and reduced-motion visitors see this cut-out instead of the live scene.
4. Commit and deploy. The model is found at build time and its URL carries a content hash, so browsers never show a stale copy.

What the loader does:
- It scales the model to `height` with its feet on the ridge, whatever units or up-axis it was exported in. Rigged models are measured in their first animation frame.
- It plays the clip named in `me.json`, else one called "idle", else the first. A model without animation gets a slow sway.
- It keeps the base colour and texture, and draws everything with the scene's own dithered shader.

**Making it with Tripo (H3.1):**
- **Photos:** use several views (front, side, back). Full body, an A-pose (arms a little away from the body), even light, a plain background, fitted clothes and empty hands.
- **Settings:** a face limit around 30k (or Smart Low Poly) and a 1024–2048 texture.
- **Animation (optional):** auto-rig as a biped with the Tripo spec, retarget an "idle" clip, and export a GLB with the animation baked in.
- **Licence:** generate on a paid plan with the model set to private. Free-tier models are public (CC BY) and Tripo's ownership terms for them are unclear.

**Shrinking the file** with [gltf-transform](https://gltf-transform.dev/cli). Aim for 1–1.5 MB and stay under 3 MB:

```bash
npx @gltf-transform/cli inspect tripo.glb
npx @gltf-transform/cli dedup tripo.glb a.glb
npx @gltf-transform/cli weld a.glb b.glb
npx @gltf-transform/cli simplify b.glb c.glb --ratio 0.05 --error 0.01
npx @gltf-transform/cli resize c.glb d.glb --width 1024 --height 1024
npx @gltf-transform/cli webp d.glb e.glb
npx @gltf-transform/cli prune e.glb me.glb
npx @gltf-transform/cli validate me.glb
```

- Pick the `simplify` ratio so about 30k triangles remain (`inspect` shows the count).
- Don't use `optimize` with its defaults, `quantize`, `draco` or `meshopt`: OGL can't read those files.
- Face and shape (morph-target) animation is skipped, so bake any idle motion into the skeleton.

## The pointer

- The cursors are native CSS image cursors in `public/cursors`, so the pointer itself never lags. Only the tooltip, the pinwheel and the shake effect are drawn with JS (`components/chrome/Cursor.tsx`).
- `app/globals.css` decides which cursor shows where, under `html.mac-cursor`. The pre-paint script adds that class for mouse and trackpad users, but not for touch or forced-colours users, nor anyone who chose **Use system cursor** in ⌘K. That choice matters because image cursors ignore the OS cursor-size setting.
- To edit a cursor, change `name.svg`, then copy it to `name@2x.svg` with `width` and `height` doubled. Safari uses the 2x file on Retina. If you move the tip, update the hotspot in `app/globals.css` (listed in `lib/cursor.ts`).
- Each image is cropped to its glyph. Safari falls back to the system cursor near the window's right and bottom edges when an image would cross them, so smaller images keep that band thin.

## The scrollbar and the music

`components/chrome/DynamicBar.tsx` is one capsule on the right edge with three states:
- **Rest:** a 5 × 64 pill that follows the scroll position. It shows while the page moves or when the pointer comes near the right edge, and fades after a moment of stillness. Drag it to scroll. While music plays it stays visible, in signal orange.
- **Bloom:** an analog clock, ♪ and the time in IST. It opens while the page moves, on hover or on keyboard focus, and folds back 150 ms after that ends.
- **Player:** cover, title and artist, a waveform driven by the real audio level, a timeline (drag it, or use ← / →, Home and End) and prev / play-pause / next. Esc, a click outside, moving the pointer away or scrolling folds it back to the bloom.

On mouse and trackpad devices the native scrollbar is hidden, so the pill is the scrollbar. On touch screens it sits beside the system's own scroll indicator: tap it to bloom, then tap ♪.

The music:
- The player (`lib/music/player.ts`) lives in the root layout, so music keeps playing between pages. Nothing plays until someone presses ♪ or picks **Play music** in ⌘K. OS media keys and the lock screen work through the Media Session API.
- The three built-in pieces are composed in code and played live with Web Audio (`lib/music/synth.ts`), so there are no audio files to host or license. Each gets a generated halftone cover.
- **To add a real song,** put the MP3 (and optionally a square cover) in `public/media/music/` and add an entry with `src` (and `cover`) to `content/music.ts`. Only use audio you have the rights to publish.

The concept and motion are Xavier Jac's ([@KMkota0](https://x.com/KMkota0)) Dynamic Scrollbar; the player credits him. The code is our own.

## Environment variables

All variables are optional; see `.env.example`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `…_TEMPLATE_ID`, `…_PUBLIC_KEY` | Contact form via [EmailJS](https://www.emailjs.com). The template receives `user_name`, `user_email`, `message` and `reply_to`; set the template's **Reply-To** to `{{reply_to}}`. Without these, the form falls back to opening the visitor's mail app. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, OG images and the sitemap (default `https://mohammadehsan.vercel.app`) |
| `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_TWITTER_URL` | Override the public links in `content/site.ts` |

## Architecture

```
app/          routes (/, /work, /work/[slug], /about, /services, /contact, 404), metadata, OG images, sitemap, robots, icons
content/      all copy and data (typed)
components/
  chrome/     HUD, header, mobile menu, cursor, dynamic scrollbar + music player, footer + SAY HELLO, stickers, preloader, ⌘K palette
  home/       the stage (name, intro, readouts), its server-drawn fallback, the index card
  services/   process deck + offerings, capabilities, call to action
  contact/    the contact form and details
  work/       work views (switcher, title reel, field), project media, case blocks, next project
  about/      manifesto, stamp portrait, telemetry card, experience
  transition/ transition link, route watcher, wipe/morph layer
  gl/         the WebGL canvas
lib/
  gl/         OGL engine, shaders, procedural posters/text masks, DOM↔GL registry;
              the home scene: scene + scene-shaders, terrain (ground + camera framing), mannequin, figure-glb (lazy model loader)
  motion/     GSAP registration + eases, Lenis handle
  field/      the /work views: field geometry + physics, title-reel physics, lightbox, view store, tile lists (built from content at build time)
  music/      the site-wide music player and the built-in Web Audio pieces
  transition.ts  wipe.ts  store.ts  theme.ts  audio.ts  time.ts  media.ts (build-time asset checks)  seo.ts
```

**One clock.** `gsap.ticker` drives Lenis first, then tweens and ScrollTrigger, then the WebGL engine.

**Pre-paint boot script** (in `app/layout.tsx`). Before first paint it decides:
- the theme;
- reduced motion (the `.reduce` class);
- the WebGL policy (the `.no-gl` class);
- whether the preloader runs (once per session, never for bots or no-JS).

**WebGL is a progressive enhancement.** Components register DOM elements with `useGLPlane`. The engine draws them behind the transparent DOM and hides the DOM copy only once its texture is on screen.

**Page transitions.** `TransitionLink` intercepts navigation through `next/link`'s `onNavigate`. It then runs:
1. cover (wipe, or morph);
2. reset scroll;
3. push;
4. wait for the route to commit;
5. refresh triggers;
6. reveal;
7. focus the new `<h1>`.

## Accessibility and performance

- axe (WCAG 2.1 A/AA) reports no violations on any route in either theme. That includes the manifesto mid-scroll: words you haven't reached yet dim only to the faintest level that still passes large-text contrast (37% on ink, 45% on paper, set as `--dim` in `app/globals.css`).
- Skip link and real links and buttons throughout. Visible focus rings, plus `aria-live` for toasts and form status.
- The split-text helpers keep screen-reader text intact.
- Reduced motion is respected everywhere, including an override through the pre-paint script.
- The custom pointer can be switched off from ⌘K ("Use system cursor") for anyone who relies on a larger OS cursor.
- The scrollbar is a real button that blooms on keyboard focus. The player is a labelled dialog and its timeline is a slider; Esc returns focus to ♪, and ⌘K can play or pause the music.
- The home stage is real HTML first. The 3D scene behind it is decorative, and every page it leads to is a link in the index card and the header.
- Initial JS on `/` is about 270 KB gzipped (React 19 + GSAP make up most of it). The WebGL engine (about 13 KB), the home scene (about 10 KB, home only), the model loader (about 8 KB, only with a model) and the palette load later.

## Deployment

Vercel (`vercel.json` uses `pnpm install --frozen-lockfile` and `pnpm run build`). Requires Node ≥ 20.9.

## License

© Mohammad Ehsan. Use freely for educational purposes. Fonts are licensed under the SIL Open Font License; see `assets/fonts/LICENSE.md`.
