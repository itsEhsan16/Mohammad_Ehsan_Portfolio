"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionTitle } from "./section-title"
import { useThree } from "@/contexts/three-context"
import dynamic from "next/dynamic"

// Dynamically import Three.js components with no SSR
const ThreeSectionIndicator = dynamic(
  () => import("./three-section-indicator").then((mod) => mod.ThreeSectionIndicator),
  { ssr: false },
)

const projects = [
  {
    title: "E-Commerce Platform",
    description:
      "A full-featured e-commerce platform with product management, cart functionality, payment processing, and order tracking.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe", "Supabase"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "Task Management App",
    description:
      "A collaborative task management application with real-time updates, team workspaces, and progress tracking.",
    tags: ["React", "Firebase", "Material UI", "Redux"],
    liveUrl: "#",
    githubUrl: "https://github.com/itsEhsan16/task-management-app",
  },
  {
    title: "Health & Fitness Tracker",
    description:
      "A mobile application for tracking fitness activities, nutrition, and health metrics with personalized insights.",
    tags: ["React Native", "TypeScript", "Node.js", "MongoDB"],
    liveUrl: "#",
    githubUrl: "#",
  },
  {
    title: "Real Estate Marketplace",
    description:
      "A platform connecting property buyers, sellers, and agents with advanced search, virtual tours, and mortgage calculators.",
    tags: ["Next.js", "PostgreSQL", "Mapbox", "AWS"],
    liveUrl: "#",
    githubUrl: "#",
  },
]

export function Projects() {
  const { isThreeEnabled } = useThree()
  const [_hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section id="work" className="section-spacing bg-background">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="content-spacing"
        >
          {isMounted && isThreeEnabled ? (
            <ThreeSectionIndicator title="Work" number="03" />
          ) : (
            <SectionTitle title="Work" number="03" />
          )}
          <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
            A selection of projects I've worked on, showcasing my skills and experience in different domains.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="bg-card hover:bg-card/80 p-8 rounded-xl border border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-balance">{project.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed flex-grow">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 mt-auto">
                  <Button size="sm" className="gap-2" asChild>
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" asChild>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4" />
                      Code
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
