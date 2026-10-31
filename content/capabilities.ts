import type { Capability } from "./types";

export const capabilitiesIntro =
  "My technical skills and areas of expertise span across various domains of software development.";

export const capabilities: Capability[] = [
  {
    title: "Frontend",
    description: "Creating responsive, accessible, and performant user interfaces with modern frameworks.",
    tags: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
  },
  {
    title: "Backend",
    description: "Designing and implementing scalable server-side applications and APIs.",
    tags: ["Node.js", "Express", "Firebase", "Supabase"],
  },
  {
    title: "UI / UX",
    description: "Creating intuitive and engaging user experiences with a focus on usability.",
    tags: ["Figma", "Prototyping"],
  },
  {
    title: "Languages",
    description: "Proficient in multiple programming languages for various application domains.",
    tags: ["JavaScript", "TypeScript", "Python", "Java"],
  },
];

/** Everything in the marquee — derived from the groups above. */
export const toolbelt = Array.from(new Set(capabilities.flatMap((c) => c.tags)));
