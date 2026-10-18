/**
 * ModelViewer — Loads and positions the reconstructed GLB room model.
 *
 * Expected model path: /models/room_01.glb (served from frontend/public/models/).
 * Handles loading, missing model, and error states gracefully.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface ModelViewerProps {
  url: string
  onLoaded?: () => void
  onError?: (message: string) => void
}

/** Inner component that actually loads the GLTF — must only render when URL is valid. */
function LoadedModel({ url, onLoaded, onError }: ModelViewerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [loadError, setLoadError] = useState(false)

  let gltf: ReturnType<typeof useGLTF> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    gltf = useGLTF(url)
  } catch {
    // useGLTF throws if the file is missing; we'll catch it in the error boundary below.
    if (!loadError) {
      setLoadError(true)
      onError?.('Unable to load the 3D environment.')
    }
    return null
  }

  const scene = gltf?.scene

  // Compute bounding box and position camera on first load
  const boundingInfo = useMemo(() => {
    if (!scene) return null

    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Scale model to reasonable room dimensions if needed (target ~8m longest side max)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 20 ? 10 / maxDim : maxDim < 0.5 ? 5 / maxDim : 1

    return { box, size, center, scale }
  }, [scene])

  useEffect(() => {
    if (!boundingInfo || !scene) return

    const { center, scale } = boundingInfo

    // Position model centered at origin, sitting on the floor
    scene.scale.setScalar(scale)
    scene.position.set(
      -center.x * scale,
      -center.y * scale,  // Ground the model
      -center.z * scale,
    )

    // Place camera at edge of the model, at eye height, looking inward
    camera.position.set(0, 1.6, (boundingInfo.size.z * scale) / 2 + 1)
    camera.lookAt(0, 1.6, 0)

    onLoaded?.()
  }, [boundingInfo, scene, camera, onLoaded])

  if (!scene || loadError) return null

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}

/** Wrapper that checks for model availability before attempting to load. */
export default function ModelViewer({ url, onLoaded, onError }: ModelViewerProps) {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    // Pre-flight HEAD request to check if the model file exists
    fetch(url, { method: 'HEAD' })
      .then((res) => {
        if (res.ok) {
          setAvailable(true)
        } else {
          setAvailable(false)
          onError?.('3D room model not available yet.')
        }
      })
      .catch(() => {
        setAvailable(false)
        onError?.('3D room model not available yet.')
      })
  }, [url, onError])

  if (available === null || available === false) return null

  return <LoadedModel url={url} onLoaded={onLoaded} onError={onError} />
}
