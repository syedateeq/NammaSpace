/**
 * First-person camera controls for Namma Space 3D viewer.
 *
 * Uses Pointer Lock API for mouse look and WASD for movement.
 * Integrates with the collision utility boundary for future obstacle detection.
 */

import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { canMoveTo } from '../utils/collision'

/** Configurable movement parameters */
const MOVE_SPEED = 4.0        // Units per second
const MOUSE_SENSITIVITY = 0.002
const CAMERA_HEIGHT = 1.6     // Approximate eye height in meters
const MIN_PITCH = -Math.PI / 3 // Look down limit (60°)
const MAX_PITCH = Math.PI / 3  // Look up limit (60°)

export default function FirstPersonControls() {
  const { camera, gl } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const isLocked = useRef(false)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  // ---------- Pointer Lock ----------
  const requestLock = useCallback(() => {
    gl.domElement.requestPointerLock()
  }, [gl])

  useEffect(() => {
    const canvas = gl.domElement

    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return

      euler.current.setFromQuaternion(camera.quaternion)
      euler.current.y -= e.movementX * MOUSE_SENSITIVITY
      euler.current.x -= e.movementY * MOUSE_SENSITIVITY
      euler.current.x = Math.max(MIN_PITCH, Math.min(MAX_PITCH, euler.current.x))
      camera.quaternion.setFromEuler(euler.current)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code.toLowerCase()] = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code.toLowerCase()] = false
    }

    canvas.addEventListener('click', requestLock)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      canvas.removeEventListener('click', requestLock)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [camera, gl, requestLock])

  // ---------- Movement loop ----------
  useFrame((_, delta) => {
    if (!isLocked.current) return

    const speed = MOVE_SPEED * Math.min(delta, 0.1) // Cap delta to prevent jump after tab-switch
    const direction = new THREE.Vector3()

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()

    const k = keys.current
    if (k['keyw'] || k['arrowup'])    direction.add(forward)
    if (k['keys'] || k['arrowdown'])  direction.sub(forward)
    if (k['keyd'] || k['arrowright']) direction.add(right)
    if (k['keya'] || k['arrowleft'])  direction.sub(right)

    if (direction.lengthSq() === 0) return
    direction.normalize().multiplyScalar(speed)

    const currentPos = camera.position.clone()
    const targetPos = currentPos.clone().add(direction)
    targetPos.y = CAMERA_HEIGHT // Lock to eye height

    if (canMoveTo(currentPos, targetPos)) {
      camera.position.copy(targetPos)
    }
  })

  return null // Pure logic component — no rendered mesh
}
