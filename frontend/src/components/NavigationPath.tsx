/**
 * NavigationPath.tsx
 *
 * Renders the calculated A* walking path in the 3D scene.
 *
 * Visual design:
 *   - Smooth glowing tube floating slightly above the floor (0.08m)
 *   - Start marker (player departure point) with pulsing emerald beacon
 *   - Target marker (goal landmark) with accent ring and light
 *   - Subtle animated directional pulses moving along the route towards the target
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PathResult } from '../navigation/navigationTypes'

interface NavigationPathProps {
  route: PathResult | null
}

export default function NavigationPath({ route }: NavigationPathProps) {
  const lineMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const pulseGroupRef = useRef<THREE.Group>(null)

  // Build smooth 3D CatmullRom spline through the waypoints
  const { curve, startPoint, endPoint, markerPositions } = useMemo(() => {
    if (!route || !route.success || route.waypoints.length < 2) {
      return {
        curve: null,
        startPoint: null,
        endPoint: null,
        markerPositions: [],
      }
    }

    const pts = route.waypoints.map(
      (w) => new THREE.Vector3(w.x, w.y, w.z),
    )

    // Eliminate duplicate adjacent points
    const deduped: THREE.Vector3[] = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].distanceTo(deduped[deduped.length - 1]) > 0.05) {
        deduped.push(pts[i])
      }
    }

    if (deduped.length < 2) {
      return {
        curve: null,
        startPoint: null,
        endPoint: null,
        markerPositions: [],
      }
    }

    const spline = new THREE.CatmullRomCurve3(
      deduped,
      false,
      'centripetal',
      0.15,
    )

    // Sample evenly spaced positions along curve for directional breadcrumbs
    const totalDist = route.distance
    const numMarkers = Math.max(3, Math.min(16, Math.floor(totalDist / 0.4)))
    const markers: THREE.Vector3[] = []
    for (let i = 1; i < numMarkers; i++) {
      markers.push(spline.getPoint(i / numMarkers))
    }

    return {
      curve: spline,
      startPoint: deduped[0],
      endPoint: deduped[deduped.length - 1],
      markerPositions: markers,
    }
  }, [route])

  // Animated glow pulse along the path
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (lineMaterialRef.current) {
      // Gentle glow breathe
      lineMaterialRef.current.emissiveIntensity = 2.0 + Math.sin(t * 3) * 0.5
    }

    if (pulseGroupRef.current) {
      // Small scale wave on directional markers
      pulseGroupRef.current.children.forEach((child, i) => {
        const offset = i * 0.4
        const s = 1 + Math.sin(t * 4 - offset) * 0.25
        child.scale.set(s, s, s)
      })
    }
  })

  if (!route || !route.success || !curve || !startPoint || !endPoint) {
    return null
  }

  return (
    <group name="navigation-path">
      {/* 3D Glowing path tube */}
      <mesh receiveShadow={false} castShadow={false}>
        <tubeGeometry args={[curve, 64, 0.022, 8, false]} />
        <meshStandardMaterial
          ref={lineMaterialRef}
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={2.0}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.92}
          toneMapped={false}
        />
      </mesh>

      {/* Directional breadcrumb dots along the route */}
      <group ref={pulseGroupRef}>
        {markerPositions.map((pos, idx) => (
          <mesh
            key={`marker-${idx}`}
            position={[pos.x, pos.y + 0.005, pos.z]}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.01, 12]} />
            <meshBasicMaterial
              color="#34d399"
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Start Departure Point (Player origin) */}
      <group position={[startPoint.x, startPoint.y, startPoint.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.14, 24]} />
          <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} />
        </mesh>
        <pointLight
          color="#34d399"
          intensity={1.2}
          distance={1.5}
          decay={2}
        />
      </group>

      {/* Target Arrival Beacon (POI destination) */}
      <group position={[endPoint.x, endPoint.y, endPoint.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.2, 24]} />
          <meshBasicMaterial color="#22d3ee" side={THREE.DoubleSide} />
        </mesh>
        {/* Subtle vertical destination beacon cylinder */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.5, 6]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.6}
          />
        </mesh>
        <pointLight
          color="#22d3ee"
          intensity={2.0}
          distance={2.0}
          decay={2}
        />
      </group>
    </group>
  )
}
