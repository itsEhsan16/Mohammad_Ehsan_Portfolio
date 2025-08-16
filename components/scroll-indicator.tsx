"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { useThree } from "@/contexts/three-context"

// This component uses Three.js hooks and must ONLY be used inside a Canvas
function ScrollText3D() {
  const textRef = useRef<any>(null)
  const [initialY, setInitialY] = useState(0)

  useEffect(() => {
    if (textRef.current) {
      setInitialY(textRef.current.position.y)
    }
  }, [])

  useFrame((state) => {
    if (textRef.current && textRef.current.material) {
      // Create a new position instead of modifying directly
      const newY = initialY + Math.sin(state.clock.elapsedTime * 2) * 0.1
      textRef.current.position.set(textRef.current.position.x, newY, textRef.current.position.z)

      // Update opacity
      textRef.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2
    }
  })

  return (
    <Text
      ref={textRef}
      color="white"
      fontSize={0.3}
      font="/fonts/Inter-Regular.ttf" // Use Inter font which is included by default
      position={[0, 0, 0]}
      anchorX="center"
      anchorY="middle"
    >
      scroll down
    </Text>
  )
}

export function ScrollIndicator() {
  const { isThreeEnabled, disableThree } = useThree()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Only run in browser environment
    if (typeof window !== "undefined") {
      const handleError = (event: any) => {
        if (
          event.message &&
          (event.message.includes("THREE") ||
            event.message.includes("WebGL") ||
            event.message.includes("Cannot convert undefined or null to object") ||
            event.message.includes("Cannot assign to read only property"))
        ) {
          console.warn("Three.js error detected in scroll indicator:", event.message)
          disableThree()
        }
      }

      window.addEventListener("error", handleError)

      return () => {
        window.removeEventListener("error", handleError)
      }
    }
  }, [disableThree])

  // Don't render during SSR or if Three.js is disabled
  if (!isMounted || !isThreeEnabled) return null

  return (
    <div className="absolute bottom-10 left-0 right-0 h-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <ScrollText3D />
      </Canvas>
    </div>
  )
}
