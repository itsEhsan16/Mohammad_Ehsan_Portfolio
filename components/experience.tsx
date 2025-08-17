"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "./section-title";
import { useThree } from "@/contexts/three-context";
import dynamic from "next/dynamic";

// Dynamically import Three.js components with no SSR
const ThreeSectionIndicator = dynamic(
  () =>
    import("./three-section-indicator").then(
      (mod) => mod.ThreeSectionIndicator
    ),
  { ssr: false }
);

const experiences = [
  {
    position: "Associate L1",
    company: "Infotact Solution",
    period: "07/2025 - Present",
    description:
      "Designing, developing, and maintaining responsive web applications for diverse clients. Implementing modern frontend best practices, optimizing user experience, and collaborating remotely with designers, backend developers, and stakeholders to deliver high-quality, scalable solutions.",
    technologies: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS"],
  },
  {
    position: "Frontend Developer",
    company: "Freelancing",
    period: "05/2024 - Present",
    description:
      "Designing, developing, and maintaining responsive web applications for diverse clients. Implementing modern frontend best practices, optimizing user experience, and collaborating remotely with designers, backend developers, and stakeholders to deliver high-quality, scalable solutions.",
    technologies: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS"],
  },
  // {
  //   position: "Mobile App Developer",
  //   company: "AppWorks Solutions",
  //   period: "2019 - 2021",
  //   description:
  //     "Developed cross-platform mobile applications for iOS and Android. Worked on feature implementation, performance optimization, and integration with backend services.",
  //   technologies: ["React Native", "Redux", "Firebase", "Jest", "Fastlane"],
  // },
  {
    position: "Frontend Developer",
    company: "NeuroNexsus",
    period: "04/2024 - 06/2024",
    description:
      "Built and maintained web applications from concept to deployment. Gather requirements and deliver solutions that met project goals.",
    technologies: ["JavaScript", "Node.js", "React"],
  },
  // {
  //   position: "Junior Web Developer",
  //   company: "WebSphere Agency",
  //   period: "2015 - 2017",
  //   description:
  //     "Assisted in the development of responsive websites and web applications. Gained experience in frontend technologies and agile development methodologies.",
  //   technologies: ["HTML/CSS", "JavaScript", "jQuery", "PHP", "MySQL"],
  // },
];

export function Experience() {
  const { isThreeEnabled } = useThree();

  return (
    <section id="experience" className="section-spacing bg-background">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="content-spacing"
        >
          {isThreeEnabled ? (
            <ThreeSectionIndicator title="Experience" number="04" />
          ) : (
            <SectionTitle title="Experience" number="04" />
          )}
          <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
            My professional journey and the companies I've had the privilege to
            work with.
          </p>
        </motion.div>

        <div className="space-y-16 lg:space-y-20">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <div className="lg:w-1/3 lg:flex-shrink-0">
                  <h3 className="text-xl font-bold mb-2 text-balance">
                    {exp.position}
                  </h3>
                  <p className="text-primary font-mono mb-1">{exp.company}</p>
                  <p className="text-muted-foreground font-mono text-sm">
                    {exp.period}
                  </p>
                </div>
                <div className="lg:w-2/3">
                  <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                    {exp.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {exp.technologies.map((tech, techIndex) => (
                      <Badge
                        key={techIndex}
                        variant="outline"
                        className="px-3 py-1"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              {index < experiences.length - 1 && (
                <div className="absolute left-0 right-0 bottom-0 h-px bg-border/50 mt-8 lg:mt-10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
