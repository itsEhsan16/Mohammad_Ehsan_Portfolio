"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Code, Layout, Smartphone, Database, Lightbulb, Layers } from "lucide-react"
import { SectionTitle } from "./section-title"
import { useThree } from "@/contexts/three-context"
import dynamic from "next/dynamic"

// Dynamically import Three.js components with no SSR
const ThreeSectionIndicator = dynamic(
  () => import("./three-section-indicator").then((mod) => mod.ThreeSectionIndicator),
  { ssr: false },
)

const skills = [
  {
    title: "Frontend Development",
    description: "Creating responsive, accessible, and performant user interfaces with modern frameworks.",
    icon: <Layout className="w-10 h-10 text-primary" />,
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
  },
  // {
  //   title: "Mobile Development",
  //   description: "Building cross-platform mobile applications with native-like performance.",
  //   icon: <Smartphone className="w-10 h-10 text-primary" />,
  //   technologies: ["React Native", "Flutter", "iOS", "Android"],
  // },
  {
    title: "Backend Development",
    description: "Designing and implementing scalable server-side applications and APIs.",
    icon: <Database className="w-10 h-10 text-primary" />,
    technologies: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Firebase"],
  },
  {
    title: "UI/UX Design",
    description: "Creating intuitive and engaging user experiences with a focus on usability.",
    icon: <Lightbulb className="w-10 h-10 text-primary" />,
    technologies: ["Figma", "Adobe XD", "Sketch", "User Research", "Prototyping"],
  },
  // {
  //   title: "DevOps",
  //   description: "Automating and optimizing development workflows and deployment processes.",
  //   icon: <Layers className="w-10 h-10 text-primary" />,
  //   technologies: ["Docker", "CI/CD", "AWS", "Vercel", "Netlify"],
  // },
  {
    title: "Programming Languages",
    description: "Proficient in multiple programming languages for various application domains.",
    icon: <Code className="w-10 h-10 text-primary" />,
    technologies: ["JavaScript", "TypeScript", "Python", "Java", "C#"],
  },
]

export function Expertise() {
  const { isThreeEnabled } = useThree()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section id="expertise" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          {isMounted ? (
            <ThreeSectionIndicator title="Expertise" number="02" />
          ) : (
            <SectionTitle title="Expertise" number="02" />
          )}
          <p className="text-muted-foreground max-w-2xl">
            My technical skills and areas of expertise span across various domains of software development.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card hover:bg-card/80 p-6 rounded-lg border border-border transition-colors"
            >
              <div className="mb-4">{skill.icon}</div>
              <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
              <p className="text-muted-foreground mb-4">{skill.description}</p>
              <div className="flex flex-wrap gap-2">
                {skill.technologies.map((tech, techIndex) => (
                  <span key={techIndex} className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
