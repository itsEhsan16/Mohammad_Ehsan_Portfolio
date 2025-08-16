"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"

// This component uses Three.js hooks and must ONLY be used inside a Canvas
function NavItem3D({ position, text, section, index }: { position: any; text: string; section: string; index: number }) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<any>(null)
  const [initialY, setInitialY] = useState(0)

  // Ensure position is a valid array
  const safePosition = position || [0, 0, 0]

  useEffect(() => {
    if (meshRef.current) {
      setInitialY(meshRef.current.position.y)
    }
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      // Create a new position instead of modifying directly
      const newY = initialY + Math.sin(state.clock.elapsedTime + index) * 0.05
      meshRef.current.position.set(meshRef.current.position.x, newY, meshRef.current.position.z)
    }
  })

  const handleClick = () => {
    // Use window.location for client-side navigation instead of router
    if (typeof document !== "undefined") {
      const element = document.getElementById(section)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <group
      ref={meshRef}
      position={safePosition}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      <Text
        color={hovered ? "#ff7b00" : "white"}
        fontSize={0.3}
        font="/fonts/Inter-Regular.ttf" // Use Inter font which is included by default
        position={[0, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        {`${String(index).padStart(2, "0")} // ${text}`}
      </Text>
    </group>
  )
}

function NavScene() {
  const navItems = [
    { text: "home", section: "home" },
    { text: "expertise", section: "expertise" },
    { text: "work", section: "work" },
    { text: "experience", section: "experience" },
    { text: "contact", section: "contact" },
  ]

  return (
    <>
      <ambientLight intensity={0.5} />
      {navItems.map((item, index) => (
        <NavItem3D
          key={index}
          // Position items vertically instead of horizontally
          // Y position decreases as index increases (moving down)
          position={[0, 2 - index * 1, 0]}
          text={item.text}
          section={item.section}
          index={index + 1}
        />
      ))}
    </>
  )
}

export function ThreeNav() {
  // Let's disable this component entirely since it's causing visual issues
  return null
}
