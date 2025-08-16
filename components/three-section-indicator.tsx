"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Text, Float } from "@react-three/drei"
import { SectionTitle } from "./section-title"
import { useThree } from "@/contexts/three-context"

// This component uses Three.js hooks and must ONLY be used inside a Canvas
function SectionTitle3D({ title, number }: { title: string; number: string }) {
  const textRef = useRef<any>(null)
  const [initialY, setInitialY] = useState(0)

  useEffect(() => {
    if (textRef.current) {
      setInitialY(textRef.current.position.y)
    }
  }, [])

  useFrame((state) => {
    if (textRef.current) {
      // Create a new position instead of modifying directly
      const newY = initialY + Math.sin(state.clock.elapsedTime) * 0.05
      textRef.current.position.set(textRef.current.position.x, newY, textRef.current.position.z)
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
      <group ref={textRef}>
        <Text
          color="#ff7b00"
          fontSize={0.4}
          font="/fonts/Inter-Bold.ttf" // Use Inter font which is included by default
          position={[-2, 0, 0]}
          anchorX="left"
          anchorY="middle"
        >
          {`${number} //`}
        </Text>
        <Text
          color="white"
          fontSize={0.5}
          font="/fonts/Inter-Bold.ttf" // Use Inter font which is included by default
          position={[-0.8, 0, 0]}
          anchorX="left"
          anchorY="middle"
        >
          {title}
        </Text>
      </group>
    </Float>
  )
}

export function ThreeSectionIndicator({ title, number }: { title: string; number: string }) {
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
          console.warn("Three.js error detected in section indicator:", event.message)
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
  if (!isMounted || !isThreeEnabled) {
    return <SectionTitle title={title} number={number} />
  }

  return (
    <div className="h-16 mb-4">
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <SectionTitle3D title={title} number={number} />
      </Canvas>
    </div>
  )
}
