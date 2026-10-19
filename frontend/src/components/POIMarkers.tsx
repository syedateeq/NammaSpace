/**
 * POIMarkers — Renders interactive 3D markers for each POI in the scene.
 *
 * Each marker is a floating sprite with a glowing ring that pulses.
 * Clicking a marker selects it; hovering shows the name tooltip.
 * The selected marker gets a brighter glow and connects with a beam
 * line to the floor.
 */

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { POI } from '../types/poi'
import { POI_ICON_MAP, POI_CATEGORY_COLORS } from '../types/poi'

interface POIMarkersProps {
  pois: POI[]
  selectedId: string | null
  onSelect: (id: string) => void
  visible: boolean
}

/** Individual 3D marker for a single POI. */
function POIMarker({
  poi,
  isSelected,
  onSelect,
}: {
  poi: POI
  isSelected: boolean
  onSelect: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const color = useMemo(
    () => new THREE.Color(POI_CATEGORY_COLORS[poi.category]),
    [poi.category],
  )

  // Animate: gentle floating + ring pulse
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    // Floating bob
    groupRef.current.position.y =
      poi.position.y + Math.sin(t * 1.5 + poi.position.x) * 0.05

    // Ring rotation + scale pulse
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.8
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.15
      const pulseScale = 1 + Math.sin(t * 2) * 0.08
      ringRef.current.scale.setScalar(isSelected ? pulseScale * 1.3 : pulseScale)
    }
  })

  const icon = POI_ICON_MAP[poi.icon] || '📍'

  return (
    <group
      ref={groupRef}
      position={[poi.position.x, poi.position.y, poi.position.z]}
    >
      {/* Invisible larger hit target for easy clicking */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Glowing sphere core */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 2.5 : hovered ? 1.8 : 1.0}
          transparent
          opacity={isSelected ? 1 : 0.85}
          toneMapped={false}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.2, 0.018, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 3 : 1.2}
          transparent
          opacity={isSelected ? 0.9 : 0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Vertical beam to floor when selected */}
      {isSelected && (
        <mesh position={[0, -poi.position.y / 2, 0]}>
          <cylinderGeometry args={[0.006, 0.006, poi.position.y, 4]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
          />
        </mesh>
      )}

      {/* Point light glow */}
      <pointLight
        color={color}
        intensity={isSelected ? 2.5 : hovered ? 1.5 : 0.4}
        distance={isSelected ? 3.5 : 2}
        decay={2}
      />

      {/* HTML label overlay */}
      {(hovered || isSelected) && (
        <Html
          center
          distanceFactor={6}
          style={{
            pointerEvents: 'none',
            transform: 'translateY(-28px)',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 10, 15, 0.92)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${POI_CATEGORY_COLORS[poi.category]}66`,
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              fontSize: '11px',
              fontFamily: "'Inter', system-ui, sans-serif",
              color: '#f0f0f5',
              boxShadow: `0 4px 16px rgba(0, 0, 0, 0.6)`,
            }}
          >
            <span style={{ fontSize: '13px' }}>{icon}</span>
            <span style={{ fontWeight: 600 }}>{poi.name}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

/** Renders all POI markers in the 3D scene. */
export default function POIMarkers({
  pois,
  selectedId,
  onSelect,
  visible,
}: POIMarkersProps) {
  if (!visible) return null

  return (
    <group>
      {pois.map((poi) => (
        <POIMarker
          key={poi.id}
          poi={poi}
          isSelected={selectedId === poi.id}
          onSelect={() => onSelect(poi.id)}
        />
      ))}
    </group>
  )
}
