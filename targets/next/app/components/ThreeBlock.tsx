'use client'

import { lazy, Suspense } from 'react'
import { useMemo } from 'react'

const Canvas = lazy(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })))
const OrbitControls = lazy(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })))

function Box({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={`hsl(${Math.random() * 360}, 70%, 50%)`} />
    </mesh>
  )
}

export default function ThreeBlock() {
  const boxes = useMemo(() => {
    const positions: [number, number, number][] = []
    for (let i = 0; i < 100; i++) {
      positions.push([
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
      ])
    }
    return positions
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas camera={{ position: [10, 10, 10] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          {boxes.map((position, i) => (
            <Box key={i} position={position} />
          ))}
          <OrbitControls />
        </Canvas>
      </Suspense>
    </div>
  )
}
