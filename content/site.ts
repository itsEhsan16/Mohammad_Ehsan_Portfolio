/**
 * Identity, links and global copy. Edit freely — every page reads from here.
 * Public links are hard-coded; NEXT_PUBLIC_* env vars only override them.
 */
export const site = {
  name: "Mohammad Ehsan",
  firstName: "Mohammad",
  lastName: "Ehsan",
  handle: "Mohammad_Ehsan._",
  role: "Software Engineer · Front-End Developer",
  roleShort: "Software Engineer",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://mohammadehsan.vercel.app").replace(/\/$/, ""),
  email: process.env.NEXT_PUBLIC_EMAIL || "mdehsan2737@gmail.com",
  resume:
    "https://drive.google.com/file/d/1TK7upHpmypxtoagJpmSsbNh1Ks9gdahO/view?usp=sharing",
  location: {
    country: "India",
    label: "India · IST",
    timeZone: "Asia/Kolkata",
    tzLabel: "IST",
  },
  availability: {
    open: true,
    label: "Open to work",
    detail: "Available for full-time roles and freelance projects",
  },
  since: 2024,
  description:
    "Software engineer and front-end developer crafting fast, accessible, high-performance web experiences with React, Next.js and TypeScript.",
  hero: {
    // `*word*` renders in the serif-italic accent face.
    subline: "Software engineer crafting fast, accessible interfaces — from first sketch to shipped *product*.",
  },
  manifesto:
    "I'm Ehsan, a software engineer based in India. I build digital experiences that combine creativity with technical excellence — intuitive, high-performance applications with React, Next.js and TypeScript, backed by Node.js, Firebase and Supabase. Since 2024 I've built for clients as a freelancer and with teams at NeuroNexsus and Infotact.",
  /** Words in the manifesto that get the signal underline. */
  manifestoHighlights: ["creativity", "technical", "excellence", "intuitive,", "high-performance"],
  socials: [
    { label: "GitHub", short: "GH", href: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/itsEhsan16" },
    {
      label: "LinkedIn",
      short: "IN",
      href: process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/in/mohammad-ehsan-23aaba290/",
    },
    { label: "X / Twitter", short: "X", href: process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/Md_Ehsan16" },
  ],
  twitterHandle: "@Md_Ehsan16",
  nav: [
    { label: "Work", href: "/work" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/#services" },
    { label: "Contact", href: "/#contact" },
  ],
  about: {
    intro:
      "Building digital experiences that combine creativity with technical excellence. Focused on creating intuitive, high-performance applications.",
    story: [
      "I'm a software engineer and front-end developer from India. I care about the moment an interface stops feeling like software and starts feeling inevitable — fast, accessible, and quietly delightful.",
      "My day-to-day is React, Next.js and TypeScript on the front, with Node.js, Express, Firebase and Supabase behind it. I design in Figma when a project needs it, and I like owning the whole path from first sketch to the last line of code.",
      "I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.",
    ],
    now: [
      "Associate L1 at Infotact Solution",
      "Freelancing on front-end builds",
      "Building Seva — a local services platform",
      "Building Desi Etsy — a marketplace for artisans",
    ],
  },
} as const;

export type Site = typeof site;
