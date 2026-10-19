/**
 * Scene — The main React Three Fiber 3D scene for the Namma Space viewer.
 *
 * Renders the Canvas, lighting, environment, model, first-person controls,
 * POI 3D markers, camera navigation ("Go To" POI), and real-time A* pathfinding
 * visualization ("Navigate" POI).
 */

import { Suspense, useCallback, useState, useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import ModelViewer from './ModelViewer'
import FirstPersonControls from './FirstPersonControls'
import ViewerHUD from './ViewerHUD'
import POIMarkers from './POIMarkers'
import POIPanel from './POIPanel'
import NavigationPath from './NavigationPath'
import type { ViewerState } from './ViewerHUD'
import type { POI } from '../types/poi'
import type { PathResult } from '../navigation/navigationTypes'
import { ROOM_01_POIS } from '../data/pois'
import { findPath } from '../navigation/pathfinding'

const MODEL_URL = '/models/room_01.glb'

/** Floor grid rendered when no model is loaded. */
function FloorPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color="#1a1a2e"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  )
}

/** Grid lines for spatial reference. */
function GridHelper() {
  return <gridHelper args={[50, 50, '#2a2a40', '#1e1e30']} />
}

/** Exposes the actual real-time player/camera position to the parent Scene */
function PlayerPositionTracker({
  onPositionUpdate,
}: {
  onPositionUpdate: (pos: THREE.Vector3) => void
}) {
  const { camera } = useThree()
  useFrame(() => {
    onPositionUpdate(camera.position)
  })
  return null
}

/** CameraNavigator — Smoothly glides the camera to a selected POI ("Go To" feature). */
function CameraNavigator({
  targetPOI,
  onArrival,
}: {
  targetPOI: POI | null
  onArrival: () => void
}) {
  const { camera } = useThree()
  const isNavigating = useRef(false)
  const startTime = useRef(0)
  const startPos = useRef(new THREE.Vector3())
  const startQuat = useRef(new THREE.Quaternion())
  const destPos = useRef(new THREE.Vector3())
  const destQuat = useRef(new THREE.Quaternion())

  useEffect(() => {
    if (!targetPOI) {
      isNavigating.current = false
      return
    }

    startPos.current.copy(camera.position)
    startQuat.current.copy(camera.quaternion)

    const poiPos = new THREE.Vector3(
      targetPOI.position.x,
      targetPOI.position.y,
      targetPOI.position.z,
    )

    // Stand ~1.3m away from the POI horizontally at eye level 1.6m
    const dir = new THREE.Vector3().subVectors(camera.position, poiPos)
    dir.y = 0
    if (dir.lengthSq() < 0.01) {
      dir.set(0, 0, 1)
    }
    dir.normalize().multiplyScalar(1.3)

    destPos.current.copy(poiPos).add(dir)
    destPos.current.y = 1.6 // Maintain eye height

    // Destination orientation: look at the POI
    const m = new THREE.Matrix4().lookAt(
      destPos.current,
      poiPos,
      new THREE.Vector3(0, 1, 0),
    )
    destQuat.current.setFromRotationMatrix(m)

    startTime.current = performance.now()
    isNavigating.current = true
  }, [targetPOI, camera])

  useFrame(() => {
    if (!isNavigating.current) return

    const elapsed = (performance.now() - startTime.current) / 1000
    const duration = 1.1 // 1.1s smooth camera glide
    const t = Math.min(elapsed / duration, 1.0)
    // Cubic ease out
    const ease = 1 - Math.pow(1 - t, 3)

    camera.position.lerpVectors(startPos.current, destPos.current, ease)
    camera.quaternion.slerpQuaternions(startQuat.current, destQuat.current, ease)

    if (t >= 1.0) {
      isNavigating.current = false
      onArrival()
    }
  })

  return null
}

export default function Scene() {
  const [viewerState, setViewerState] = useState<ViewerState>('loading')
  const [errorMsg, setErrorMsg] = useState<string>()

  // POI state
  const [selectedPOI, setSelectedPOI] = useState<string | null>(null)
  const [markersVisible, setMarkersVisible] = useState(true)
  const [poiPanelOpen, setPOIPanelOpen] = useState(false)
  const [navTarget, setNavTarget] = useState<POI | null>(null)

  // Real player position tracked from FirstPersonControls / Camera
  const playerPosRef = useRef(new THREE.Vector3(0, 1.6, 3.28))

  // Active A* navigation route state
  const [currentRoute, setCurrentRoute] = useState<PathResult | null>(null)

  const handlePositionUpdate = useCallback((pos: THREE.Vector3) => {
    playerPosRef.current.copy(pos)
  }, [])

  const handleLoaded = useCallback(() => {
    setViewerState('ready')
  }, [])

  const handleError = useCallback((msg: string) => {
    if (msg.includes('not available')) {
      setViewerState('missing')
    } else {
      setViewerState('error')
      setErrorMsg(msg)
    }
  }, [])

  const handleSelectPOI = useCallback((id: string) => {
    setSelectedPOI(id)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedPOI(null)
    setNavTarget(null)
  }, [])

  // "Go To" observation interaction (camera smooth glide)
  const handleGoTo = useCallback((poi: POI) => {
    setSelectedPOI(poi.id)
    setNavTarget(poi)
  }, [])

  // "Navigate" interaction: Calculates A* path from player to POI
  const handleNavigate = useCallback((poi: POI) => {
    setSelectedPOI(poi.id)
    // Run A* from genuine player position
    const start = {
      x: playerPosRef.current.x,
      y: playerPosRef.current.y,
      z: playerPosRef.current.z,
    }
    const route = findPath(start, poi)
    setCurrentRoute(route)
  }, [])

  const handleClearRoute = useCallback(() => {
    setCurrentRoute(null)
  }, [])

  const handleRecalculateRoute = useCallback(() => {
    if (!currentRoute) return
    const targetPoi = ROOM_01_POIS.find((p) => p.id === currentRoute.targetPoiId)
    if (targetPoi) {
      handleNavigate(targetPoi)
    }
  }, [currentRoute, handleNavigate])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 200, position: [0, 1.6, 5] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0f' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 3]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 4, -2]} intensity={0.3} />

        {/* Fog for depth */}
        <fog attach="fog" args={['#0a0a0f', 20, 60]} />

        {/* Scene content */}
        <FloorPlane />
        <GridHelper />

        {/* Model (loads asynchronously) */}
        <Suspense fallback={null}>
          <ModelViewer
            url={MODEL_URL}
            onLoaded={handleLoaded}
            onError={handleError}
          />
        </Suspense>

        {/* POI Markers in the 3D scene */}
        <POIMarkers
          pois={ROOM_01_POIS}
          selectedId={selectedPOI}
          onSelect={handleSelectPOI}
          visible={markersVisible}
        />

        {/* 3D Visual Walking Path */}
        <NavigationPath route={currentRoute} />

        {/* First-person camera controls */}
        <FirstPersonControls />

        {/* Real-time player coordinate tracker */}
        <PlayerPositionTracker onPositionUpdate={handlePositionUpdate} />

        {/* Camera Navigator for "Go To" transitions */}
        <CameraNavigator
          targetPOI={navTarget}
          onArrival={() => setNavTarget(null)}
        />
      </Canvas>

      {/* HUD overlay */}
      <ViewerHUD state={viewerState} errorMessage={errorMsg} />

      {/* POI & Navigation Panel overlay */}
      <POIPanel
        pois={ROOM_01_POIS}
        selectedId={selectedPOI}
        onSelect={handleSelectPOI}
        onClearSelection={handleClearSelection}
        markersVisible={markersVisible}
        onToggleMarkers={() => setMarkersVisible((v) => !v)}
        isOpen={poiPanelOpen}
        onTogglePanel={() => setPOIPanelOpen((v) => !v)}
        onGoTo={handleGoTo}
        onNavigate={handleNavigate}
        activeRoute={currentRoute}
        onClearRoute={handleClearRoute}
        onRecalculateRoute={handleRecalculateRoute}
      />
    </div>
  )
}
