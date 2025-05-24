"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { useThree } from "@/contexts/three-context"

// Dynamically import Three.js components with no SSR
const ThreeScene = dynamic(() => import("./three-scene").then((mod) => mod.ThreeScene), { ssr: false })
const ScrollIndicator = dynamic(() => import("./scroll-indicator").then((mod) => mod.ScrollIndicator), { ssr: false })

export function Hero() {
  const { isThreeEnabled } = useThree()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section id="home" className="relative h-screen flex items-center">
      {/* Fallback background that's always shown */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-background -z-10" />

      {/* Only render Three.js components if enabled and on client */}
      {isMounted && isThreeEnabled && (
        <>
          <ThreeScene />
          <ScrollIndicator />
        </>
      )}

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter mb-4">Mohammad Ehsan</h1>
          <h2 className="text-lg md:text-xl font-mono text-muted-foreground tracking-wide mb-8">
            SOFTWARE ENGINEER, FRONT END DEVELOPER.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            Building digital experiences that combine creativity with technical excellence. Focused on creating
            intuitive, high-performance applications.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
