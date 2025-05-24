"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export function VerticalNav() {
  const [visible, setVisible] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  const navItems = [
    { text: "home", section: "home" },
    { text: "expertise", section: "expertise" },
    { text: "work", section: "work" },
    { text: "experience", section: "experience" },
    { text: "contact", section: "contact" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)

      // Determine which section is currently in view
      const sections = navItems.map((item) => item.section)

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [navItems])

  if (!visible) return null

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col space-y-6">
      {navItems.map((item, index) => (
        <motion.a
          key={index}
          href={`#${item.section}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className={`flex items-center justify-end text-sm transition-colors ${
            activeSection === item.section ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="font-mono mr-2">{String(index + 1).padStart(2, "0")} //</span>
          <span>{item.text}</span>
        </motion.a>
      ))}
    </div>
  )
}
