import type { Project } from "./types";

/**
 * Case studies. Written only from facts already on the previous site
 * (descriptions, stacks, links, status). Anything you can add — screenshots,
 * metrics, your exact role — makes them stronger:
 *   - images listed below are picked up automatically once the file exists in /public
 *   - add a { type: "stats" } block for real numbers
 */
export const projects: Project[] = [
  {
    slug: "adaptive-learning",
    index: 1,
    title: "Adaptive Learning",
    tagline: "A study plan that rewrites itself around you.",
    summary:
      "A comprehensive AI-driven learning platform featuring personalized learning paths, adaptive scheduling, intelligent progress tracking, and milestone-based skill development.",
    kind: "AI learning platform",
    status: "live",
    stack: ["React.js", "TypeScript", "Tailwind CSS", "Gemini API", "Supabase"],
    links: [
      { label: "Live site", href: "https://aiadaptivelearning.netlify.app/" },
      { label: "Source", href: "https://github.com/itsEhsan16/AIDrivenLearning" },
    ],
    cover: { src: "/media/work/adaptive-learning/cover.jpg", alt: "Adaptive Learning — key visual" },
    loop: "/media/work/adaptive-learning/loop.mp4",
    blocks: [
      {
        type: "text",
        label: "Overview",
        title: "Personal paths, generated and adapted by AI.",
        body: [
          "Adaptive Learning is a comprehensive AI-driven learning platform. Instead of a fixed syllabus, every learner gets a personalized learning path, an adaptive schedule, intelligent progress tracking and milestone-based skill development.",
        ],
      },
      {
        type: "features",
        label: "Key features",
        items: [
          { title: "Personalized learning paths", body: "Paths are generated around each learner's goals using the Gemini API." },
          { title: "Adaptive scheduling", body: "Study sessions are planned and re-planned as progress changes." },
          { title: "Intelligent progress tracking", body: "Progress is tracked continuously so the plan always reflects where you are." },
          { title: "Milestone-based skills", body: "Skills are broken into milestones that make long goals feel finite." },
        ],
      },
      {
        type: "stack",
        label: "Stack",
        items: [
          { name: "React.js + TypeScript", why: "Typed, component-driven UI for a data-heavy dashboard." },
          { name: "Gemini API", why: "Generates and adapts the learning paths." },
          { name: "Supabase", why: "Auth and Postgres storage for users, paths and progress." },
          { name: "Tailwind CSS", why: "Fast, consistent styling across the app." },
        ],
      },
      {
        type: "gallery",
        label: "Screens",
        images: [
          { src: "/media/work/adaptive-learning/shot-1.webp", alt: "Adaptive Learning — home" },
          { src: "/media/work/adaptive-learning/shot-2.webp", alt: "Adaptive Learning — learning path" },
          { src: "/media/work/adaptive-learning/shot-3.webp", alt: "Adaptive Learning — schedule" },
          { src: "/media/work/adaptive-learning/shot-4.webp", alt: "Adaptive Learning — progress" },
        ],
      },
    ],
  },
  {
    slug: "task-management-app",
    index: 2,
    title: "Task Manager",
    tagline: "Tasks, subtasks and progress — without the clutter.",
    summary:
      "A modern task management application that helps users organize their tasks, track progress, and manage subtasks efficiently.",
    kind: "Productivity web app",
    status: "open-source",
    stack: ["React", "Firebase Authentication", "Radix UI", "Tailwind CSS"],
    links: [{ label: "Source", href: "https://github.com/itsEhsan16/task-management-app" }],
    cover: { src: "/media/work/task-management-app/cover.jpg", alt: "Task Manager — key visual" },
    blocks: [
      {
        type: "text",
        label: "Overview",
        title: "Organize, track, finish.",
        body: [
          "A modern task management application that helps users organize their tasks, track progress, and manage subtasks efficiently — with authentication handled by Firebase and accessible UI primitives from Radix.",
        ],
      },
      {
        type: "features",
        label: "Key features",
        items: [
          { title: "Task organization", body: "Create, group and prioritise tasks in one place." },
          { title: "Subtasks", body: "Break work down and manage subtasks under each task." },
          { title: "Progress tracking", body: "See what's done and what's left at a glance." },
          { title: "Secure sign-in", body: "User accounts with Firebase Authentication." },
        ],
      },
      {
        type: "stack",
        label: "Stack",
        items: [
          { name: "React", why: "Component model for the task list and editors." },
          { name: "Firebase Authentication", why: "Managed, secure user sign-in." },
          { name: "Radix UI", why: "Accessible dialogs, menus and form primitives." },
          { name: "Tailwind CSS", why: "Utility-first styling." },
        ],
      },
      {
        type: "gallery",
        label: "Screens",
        images: [
          { src: "/media/work/task-management-app/shot-1.webp", alt: "Task Manager — board" },
          { src: "/media/work/task-management-app/shot-2.webp", alt: "Task Manager — task with subtasks" },
          { src: "/media/work/task-management-app/shot-3.webp", alt: "Task Manager — sign in" },
        ],
      },
    ],
  },
  {
    slug: "seva",
    index: 3,
    title: "Seva",
    tagline: "Local help, booked in a few taps.",
    summary:
      "A service booking platform that connects users with local service providers for various needs. Currently in development.",
    kind: "Service marketplace",
    status: "in-development",
    stack: ["React", "TypeScript", "Node.js", "MongoDB"],
    links: [],
    cover: { src: "/media/work/seva/cover.jpg", alt: "Seva — concept key visual" },
    loop: "/media/work/seva/loop.mp4",
    blocks: [
      {
        type: "text",
        label: "Overview",
        title: "Connecting people with the services around them.",
        body: [
          "Seva is a service booking platform that connects users with local service providers for their everyday needs — one place to find, compare and book help nearby.",
        ],
      },
      {
        type: "stack",
        label: "Stack",
        items: [
          { name: "React + TypeScript", why: "Typed front end for search, profiles and booking flows." },
          { name: "Node.js", why: "API for providers, availability and bookings." },
          { name: "MongoDB", why: "Flexible documents for varied service listings." },
        ],
      },
      {
        type: "status",
        label: "Status",
        title: "Currently in development.",
        body: ["Seva is being built right now. This case study will grow with screens and details as it ships."],
      },
    ],
  },
  {
    slug: "desi-etsy",
    index: 4,
    title: "Desi Etsy",
    tagline: "Handmade, from artisans to everyone.",
    summary:
      "An e-commerce platform focused on handmade and unique products from Asian artisans. Currently in development.",
    kind: "E-commerce marketplace",
    status: "in-development",
    stack: ["Next.js", "PostgreSQL"],
    links: [],
    cover: { src: "/media/work/desi-etsy/cover.jpg", alt: "Desi Etsy — concept key visual" },
    loop: "/media/work/desi-etsy/loop.mp4",
    blocks: [
      {
        type: "text",
        label: "Overview",
        title: "A storefront for handmade work.",
        body: [
          "Desi Etsy is an e-commerce platform focused on handmade and unique products from Asian artisans — giving makers a dedicated place to reach buyers who value craft.",
        ],
      },
      {
        type: "stack",
        label: "Stack",
        items: [
          { name: "Next.js", why: "Server-rendered, SEO-friendly storefront and product pages." },
          { name: "PostgreSQL", why: "Relational data for products, artisans and orders." },
        ],
      },
      {
        type: "status",
        label: "Status",
        title: "Currently in development.",
        body: ["Desi Etsy is in active development. Screens and details will be added as it ships."],
      },
    ],
  },
  {
    slug: "personal-portfolio",
    index: 5,
    title: "This Portfolio",
    tagline: "A portfolio that renders itself.",
    summary:
      "A modern portfolio website showcasing my skills, projects, and experience as a software engineer — rebuilt as a small rendering engine with WebGL, smooth scroll and page transitions.",
    kind: "Personal site",
    role: "Design & development",
    year: "2025 — 2026",
    status: "live",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "GSAP", "WebGL (OGL)", "EmailJS"],
    links: [
      { label: "Live site", href: "https://mohammadehsan.vercel.app/" },
      { label: "Source", href: "https://github.com/itsEhsan16/Mohammad_Ehsan_Portfolio" },
    ],
    cover: { src: "/media/work/personal-portfolio/cover.jpg", alt: "Portfolio v2 — key visual" },
    blocks: [
      {
        type: "text",
        label: "Overview",
        title: "From blueprint to pixels.",
        body: [
          "Version two of my portfolio treats the page like a renderer: everything starts as a blueprint — halftone dots, wireframes, mono annotations — and resolves into final pixels as you interact with it. It's how front-end work feels from the inside.",
          "Everything is server-rendered with Next.js for speed and SEO; the WebGL layer, motion and transitions are progressive enhancements that degrade gracefully for reduced motion, touch and devices without WebGL.",
        ],
      },
      {
        type: "features",
        label: "Under the hood",
        items: [
          { title: "A home page in 3D", body: "A figure on a ring of dithered hills, in front of a halftone name you paint with the cursor. The cursor also renders the figure in full colour, and dragging orbits the camera." },
          { title: "Blueprint → render images", body: "Project images render as edge-detected blueprints and resolve to colour with a scanline sweep." },
          { title: "Dither page transitions", body: "An ordered-dither wipe and a shared-element morph between pages." },
          { title: "⌘K command menu", body: "Keyboard-first navigation and actions from anywhere on the site." },
          { title: "Accessible by default", body: "Real HTML underneath, reduced-motion and no-WebGL fallbacks, visible focus states." },
        ],
      },
      {
        type: "stack",
        label: "Stack",
        items: [
          { name: "Next.js 16 + React 19", why: "Static, server-rendered pages with client islands." },
          { name: "OGL", why: "A small WebGL layer (about 13 KB gzipped, plus a 10 KB scene on the home page) for the shaders, render targets, planes and the 3D stage." },
          { name: "GSAP + Lenis", why: "Scroll-linked motion, split-text and smooth scrolling on one ticker." },
          { name: "Tailwind CSS 4", why: "Design tokens in CSS, themes via data attributes." },
          { name: "EmailJS", why: "Serverless contact form." },
        ],
      },
      {
        type: "gallery",
        label: "Screens",
        images: [
          { src: "/media/work/personal-portfolio/shot-1.webp", alt: "Home stage: a dithered figure on a ridge in front of the halftone name, with an orange stroke painted across it", caption: "Home — paint the name, render the figure" },
          { src: "/media/work/personal-portfolio/shot-2.webp", alt: "The work field: a drag-through grid of project tiles with one picture open in the middle", caption: "Work — the endless GRID field" },
          { src: "/media/work/personal-portfolio/shot-3.webp", alt: "The home stage on the paper theme, with the figure and name in ink", caption: "Paper theme" },
          { src: "/media/work/personal-portfolio/shot-4.webp", alt: "The Services page with the process cards fanned out and the list of offerings", caption: "Services — the process deck" },
        ],
      },
    ],
  },
];

export const statusLabel: Record<Project["status"], string> = {
  live: "Live",
  "open-source": "Open source",
  "in-development": "In development",
};

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export function getNextProject(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
