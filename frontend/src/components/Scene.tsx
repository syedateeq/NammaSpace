/**
 * Scene — The main React Three Fiber 3D scene for the Namma Space viewer.
 *
 * Renders the Canvas, lighting, environment, model, and first-person controls.
 * Reports viewer state upward for the HUD overlay.
 */

import { Suspense, useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import ModelViewer from './ModelViewer'
import FirstPersonControls from './FirstPersonControls'
import ViewerHUD from './ViewerHUD'
import type { ViewerState } from './ViewerHUD'

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

export default function Scene() {
  const [viewerState, setViewerState] = useState<ViewerState>('loading')
  const [errorMsg, setErrorMsg] = useState<string>()

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

        {/* First-person camera controls */}
        <FirstPersonControls />
      </Canvas>

      {/* HUD overlay */}
      <ViewerHUD state={viewerState} errorMessage={errorMsg} />
    </div>
  )
}
