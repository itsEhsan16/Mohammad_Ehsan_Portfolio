import type { ServiceStep } from "./types";

export const servicesIntro = {
  title: "Have an idea?",
  accent: "Let's ship it.",
  body: "Alongside my full-time role I take on a small number of freelance builds — from a single launch page to a complete web app. One person from first call to deploy, so nothing gets lost in hand-offs.",
};

export const process: ServiceStep[] = [
  { step: "01", title: "Discover", body: "A short call about your goals. We agree on scope and timeline before anything starts.", tag: "Free intro call" },
  { step: "02", title: "Design", body: "Structure and visuals in Figma, shaped with your feedback at every step." },
  { step: "03", title: "Build", body: "React / Next.js, responsive, animated and accessible — production-grade from day one." },
  { step: "04", title: "Ship", body: "Deployed on your domain, handed over with docs, and supported after launch.", tag: "It's live" },
];

export const offerings = [
  { title: "Landing pages & marketing sites", body: "Launch pages and multi-page sites that load fast and convert." },
  { title: "Web apps & dashboards", body: "React / Next.js applications with auth, data and real-time UI." },
  { title: "Design → production", body: "Your Figma files turned into clean, responsive, maintainable code." },
  { title: "Performance & accessibility", body: "Audits and fixes for Core Web Vitals, SEO and WCAG." },
];
