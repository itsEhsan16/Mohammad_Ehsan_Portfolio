# Mohammad Ehsan — Portfolio v2 "RENDER"

Personal portfolio of **Mohammad Ehsan**, software engineer and front-end developer based in India.

Live: <https://mohammadehsan.vercel.app>

The site behaves like a renderer. Everything starts as a blueprint (halftone dots, wireframes, mono annotations) and resolves into final pixels as you interact with it:
- **Hero:** paint the giant halftone name with your cursor to "render" it in signal orange.
- **Project images:** they start as edge-detected blueprints and develop into colour as they scroll into view.
- **Page navigation:** pages "compile" through an ordered-dither wipe, or morph from a project card into its case study.

## Highlights

**WebGL** (OGL, about 43 KB, loaded after first paint and only on desktop pointers):
- An ink-field hero driven by a ping-pong trail simulation, with click ripples and an idle autopilot.
- Blueprint→render image planes synced to the DOM.
- A shared-element morph into each case study.

**Motion** (GSAP + Lenis on a single ticker):
- Split-text reveals and a scroll-scrubbed manifesto.
- A sticky horizontal work reel and tilted service cards that fan out.
- Variable-font letters that react to the cursor.
- Scramble titles and magnetic buttons.

**Chrome:**
- HUD telemetry strip: IST clock, availability, FPS, build and scroll.
- ⌘K command palette and a custom cursor with contextual labels.
- Ink/paper theme toggle with a circular reveal.
- Optional synthesized UI sounds (Web Audio, off by default).
- Draggable holographic stickers.

**Pages:**
- Home, `/work` (filters, list/grid, hover preview) and 5 static case studies with scroll-to-advance.
- `/about` (stamp portrait and live telemetry card) and a custom 404.

**Built to degrade gracefully:**
- All content is server-rendered HTML.
- Reduced motion turns off smooth scroll, pinning and WebGL.
- Touch devices get CSS halftones instead of WebGL.
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

## Editing content

All copy lives in typed modules under `content/`. Nothing is hard-coded in components.

| File | What's inside |
|---|---|
| `content/site.ts` | Name, role, links, résumé, location/timezone, availability, hero subline, manifesto, about page |
| `content/projects.ts` | The 5 case studies, built from blocks (`text`, `features`, `stack`, `gallery`, `stats`, `status`) |
| `content/experience.ts` | Roles. The Infotact description is a draft to refine. |
| `content/capabilities.ts` | Skill groups (also feeds the marquee) |
| `content/services.ts` | Freelance process cards and offerings (no prices) |

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

## Environment variables

All variables are optional; see `.env.example`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `…_TEMPLATE_ID`, `…_PUBLIC_KEY` | Contact form via [EmailJS](https://www.emailjs.com). The template receives `user_name`, `user_email`, `message` and `reply_to`; set the template's **Reply-To** to `{{reply_to}}`. Without these, the form falls back to opening the visitor's mail app. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata, OG images and the sitemap (default `https://mohammadehsan.vercel.app`) |
| `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_GITHUB_URL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_TWITTER_URL` | Override the public links in `content/site.ts` |

## Architecture

```
app/          routes (/, /work, /work/[slug], /about, 404), metadata, OG images, sitemap, robots, icons
content/      all copy and data (typed)
components/
  chrome/     HUD, header, mobile menu, cursor, footer + SAY HELLO, stickers, preloader, ⌘K palette
  home/       hero, manifesto, work reel, capabilities, services, experience, contact
  work/       work index, project media, case blocks, next project
  about/      stamp portrait, telemetry card
  transition/ transition link, route watcher, wipe/morph layer
  gl/         the WebGL canvas
lib/
  gl/         OGL engine, shaders, procedural posters/text masks, DOM↔GL registry
  motion/     GSAP registration + eases, Lenis handle
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

- axe (WCAG 2 A/AA) reports no violations on every route in both themes.
- Skip link and real links and buttons throughout. Visible focus rings, plus `aria-live` for toasts and form status.
- The split-text helpers keep screen-reader text intact.
- Reduced motion is respected everywhere, including an override through the pre-paint script.
- Initial JS on `/` is about 253 KB gzipped (React 19 + GSAP make up most of it). The WebGL chunk (about 43 KB) and the palette load later.

## Deployment

Vercel (`vercel.json` uses `pnpm install --frozen-lockfile` and `pnpm run build`). Requires Node ≥ 20.9.

## License

© Mohammad Ehsan. Use freely for educational purposes. Fonts are licensed under the SIL Open Font License; see `assets/fonts/LICENSE.md`.
