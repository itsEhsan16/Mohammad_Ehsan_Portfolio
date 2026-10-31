import type { Role } from "./types";

export const experience: Role[] = [
  {
    company: "Infotact Solution",
    title: "Associate L1",
    start: "07/2025",
    end: null,
    current: true,
    // Draft — the previous site reused the Freelancing copy here. Refine with your actual responsibilities.
    summary:
      "Building and maintaining client web applications in a remote team, working across React, Next.js and TypeScript with GraphQL APIs and Tailwind CSS.",
    stack: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS"],
  },
  {
    company: "Freelancing",
    title: "Frontend Developer",
    start: "05/2024",
    end: null,
    current: true,
    summary:
      "Designing, developing, and maintaining responsive web applications for diverse clients. Implementing modern frontend best practices, optimizing user experience, and collaborating remotely with designers, backend developers, and stakeholders to deliver high-quality, scalable solutions.",
    stack: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS"],
  },
  {
    company: "NeuroNexsus",
    title: "Frontend Developer",
    start: "04/2024",
    end: "06/2024",
    current: false,
    summary:
      "Built and maintained web applications from concept to deployment. Gathered requirements and delivered solutions that met project goals.",
    stack: ["JavaScript", "Node.js", "React"],
  },
];
