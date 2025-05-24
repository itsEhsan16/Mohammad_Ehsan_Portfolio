"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type ThreeContextType = {
  isThreeEnabled: boolean
  disableThree: () => void
}

const ThreeContext = createContext<ThreeContextType | undefined>(undefined)

export function ThreeProvider({ children }: { children: ReactNode }) {
  // Start with Three.js disabled to avoid visual issues
  const [isThreeEnabled, setIsThreeEnabled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const disableThree = () => {
    setIsThreeEnabled(false)
  }

  // During SSR, assume 3D is not available
  if (!isMounted) {
    return <ThreeContext.Provider value={{ isThreeEnabled: false, disableThree }}>{children}</ThreeContext.Provider>
  }

  return <ThreeContext.Provider value={{ isThreeEnabled, disableThree }}>{children}</ThreeContext.Provider>
}

export function useThree() {
  const context = useContext(ThreeContext)
  if (context === undefined) {
    throw new Error("useThree must be used within a ThreeProvider")
  }
  return context
}
