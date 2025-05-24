"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Float, Html } from "@react-three/drei"
import { Vector3, Euler, MathUtils } from "three"

// Cube component with interactive behavior
function Cube({ position, rotation, color, scale = 1, section }) {
  const meshRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)
  const [initialScale] = useState({ x: scale, y: scale, z: scale })

  // Animation on hover and click
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Create new rotation values instead of modifying directly
      meshRef.current.rotation.x = meshRef.current.rotation.x + delta * 0.2
      meshRef.current.rotation.y = meshRef.current.rotation.y + delta * 0.3

      // Scale effect on hover - with safe checks
      const targetScaleX = scale * (hovered ? 1.2 : 1)
      const targetScaleY = scale * (hovered ? 1.2 : 1)
      const targetScaleZ = scale * (hovered ? 1.2 : 1)

      // Use set method instead of direct assignment
      meshRef.current.scale.set(
        MathUtils.lerp(meshRef.current.scale.x || initialScale.x, targetScaleX, 0.1),
        MathUtils.lerp(meshRef.current.scale.y || initialScale.y, targetScaleY, 0.1),
        MathUtils.lerp(meshRef.current.scale.z || initialScale.z, targetScaleZ, 0.1),
      )
    }
  })

  const handleClick = () => {
    setClicked(!clicked)
    // Use window.location for client-side navigation instead of router
    if (typeof document !== "undefined") {
      const element = document.getElementById(section)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  // Ensure position and rotation are valid objects
  const safePosition = position || new Vector3(0, 0, 0)
  const safeRotation = rotation || new Euler(0, 0, 0)

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={[safePosition.x, safePosition.y, safePosition.z]}
        rotation={[safeRotation.x, safeRotation.y, safeRotation.z]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={[initialScale.x, initialScale.y, initialScale.z]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? "#ff7b00" : color} metalness={0.5} roughness={0.2} />
        <Html
          position={[0, 0, 0.6]}
          center
          distanceFactor={8}
          occlude
          className={`pointer-events-none transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md whitespace-nowrap">
            <span className="text-sm font-mono text-primary">{section}</span>
          </div>
        </Html>
      </mesh>
    </Float>
  )
}

// Glowing orb component
function GlowingOrb({ position }) {
  const meshRef = useRef(null)
  const [initialY, setInitialY] = useState(0)

  // Ensure position is a valid object
  const safePosition = position || new Vector3(0, 0, 0)

  useEffect(() => {
    if (safePosition) {
      setInitialY(safePosition.y)
    }
  }, [safePosition])

  useFrame((state) => {
    if (meshRef.current) {
      // Create a new position instead of modifying directly
      const newY = initialY + Math.sin(state.clock.elapsedTime) * 0.2
      meshRef.current.position.set(safePosition.x, newY, safePosition.z)
    }
  })

  return (
    <mesh ref={meshRef} position={[safePosition.x, safePosition.y, safePosition.z]}>
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial color="#ff9d00" emissive="#ff5500" emissiveIntensity={2} toneMapped={false} />
      {/* Add point light inside the orb for glow effect */}
      <pointLight color="#ff7b00" intensity={2} distance={6} />
    </mesh>
  )
}

// Main scene component
function Scene() {
  const { camera } = useThree()

  useEffect(() => {
    // Set initial camera position
    if (camera) {
      camera.position.set(0, 0, 10)
    }
  }, [camera])

  // Create safe Vector3 and Euler objects
  const cubePositions = {
    expertise: new Vector3(-3, 0, 0),
    work: new Vector3(0, 2, -2),
    experience: new Vector3(3, -1, -1),
    contact: new Vector3(0, -2, 0),
  }

  const cubeRotations = {
    expertise: new Euler(0.5, 0.5, 0),
    work: new Euler(0.7, 0.2, 0.5),
    experience: new Euler(0.3, 0.8, 0.2),
    contact: new Euler(0.4, 0.3, 0.7),
  }

  return (
    <>
      {/* Environment lighting */}
      <Environment preset="night" />

      {/* Ambient light for overall scene brightness */}
      <ambientLight intensity={0.2} />

      {/* Directional light for shadows and highlights */}
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      {/* Interactive cubes for each section */}
      <Cube
        position={cubePositions.expertise}
        rotation={cubeRotations.expertise}
        color="#ff4d00"
        scale={1.5}
        section="expertise"
      />
      <Cube position={cubePositions.work} rotation={cubeRotations.work} color="#ff7b00" scale={1.2} section="work" />
      <Cube
        position={cubePositions.experience}
        rotation={cubeRotations.experience}
        color="#ff9500"
        scale={1.3}
        section="experience"
      />
      <Cube
        position={cubePositions.contact}
        rotation={cubeRotations.contact}
        color="#ffa200"
        scale={1.1}
        section="contact"
      />

      {/* Glowing orb */}
      <GlowingOrb position={new Vector3(4, 2, 1)} />
    </>
  )
}

// Main component that wraps the Three.js canvas
export function ThreeScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
