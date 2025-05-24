"use client"

import { useState, useEffect } from "react"

export function ThreeWrapper({ children, fallback = null }) {
  const [hasError, setHasError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Set mounted state to true when component mounts
    setIsMounted(true)

    // Only run in browser environment
    if (typeof window !== "undefined") {
      // Add error handler for Three.js errors
      const handleError = (event) => {
        // Check if it's a Three.js related error
        if (
          event.message &&
          (event.message.includes("THREE") ||
            event.message.includes("WebGL") ||
            event.message.includes("Cannot convert undefined or null to object"))
        ) {
          console.error("Three.js error detected:", event.message)
          setHasError(true)
        }
      }

      window.addEventListener("error", handleError)

      return () => {
        window.removeEventListener("error", handleError)
      }
    }
  }, [])

  if (!isMounted || hasError) {
    return fallback
  }

  return children
}
