"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, useAnimations } from "@react-three/drei"
import { useRef, useEffect, useMemo } from "react"
import * as THREE from "three"

function EarthModel() {
  const { scene, animations } = useGLTF("/scene.gltf")
  const ref = useRef<THREE.Group>(null)
  const { actions, mixer } = useAnimations(animations, ref)

  // Clone the scene to avoid sharing between instances
  const clonedScene = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    if (ref.current) {
      // Set initial transforms
      ref.current.scale.set(1.5, 1.5, 1.5)
      ref.current.position.set(0, 0, 2)
      ref.current.rotation.set(0, 0, 0)
    }

    // Play animations if available
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions).forEach((action) => {
        action?.reset().play()
      })
    }
  }, [actions])

  useFrame((_, delta) => {
    if (mixer) {
      mixer.update(delta)
    }
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3 // Smooth rotation based on delta time
    }
  })

  return (
    <group ref={ref}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload the GLTF to avoid loading delays
useGLTF.preload("/scene.gltf")

export function EarthBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
        gl={{
          alpha: true,
          antialias: false, 
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]} 
        frameloop="always" 
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
        <EarthModel />
      </Canvas>
    </div>
  )
}
