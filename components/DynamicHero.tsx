"use client"
import dynamic from "next/dynamic"

const DynamicHero = dynamic(() => import("./hero").then((mod) => mod.Hero), { ssr: false })

export default function HeroClientWrapper() {
  return <DynamicHero />
} 