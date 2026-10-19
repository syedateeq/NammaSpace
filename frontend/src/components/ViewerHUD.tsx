/**
 * ViewerHUD — Heads-up display overlay for the Namma Space 3D viewer.
 *
 * Shows:
 *  - Namma Space branding
 *  - Active navigation route banner (Route to, Distance, Waypoints, Clear, Recalculate)
 *  - Control instructions (WASD = Move, Mouse = Look, ESC = Release Mouse)
 *  - Current viewer state (loading, missing model, ready, error)
 */

import './ViewerHUD.css'
import type { PathResult } from '../navigation/navigationTypes'

export type ViewerState = 'loading' | 'ready' | 'missing' | 'error'

interface ViewerHUDProps {
  state: ViewerState
  errorMessage?: string
  isLocked?: boolean
  activeRoute?: PathResult | null
  onClearRoute?: () => void
  onRecalculateRoute?: () => void
}

export default function ViewerHUD({
  state,
  errorMessage,
  isLocked = false,
  activeRoute,
  onClearRoute,
  onRecalculateRoute,
}: ViewerHUDProps) {
  return (
    <div className="hud">
      {/* Top-left branding */}
      <div className="hud__brand">
        <span className="hud__logo">🚀</span>
        <span className="hud__title">Namma Space</span>
      </div>

      {/* Top-center Active Route Bar */}
      {activeRoute && activeRoute.success && (
        <div className="hud__route-bar">
          <div className="hud__route-info">
            <span className="hud__route-icon">🧭</span>
            <span className="hud__route-title">
              Route to: <strong>{activeRoute.targetPoiName}</strong>
            </span>
            <span className="hud__route-divider">•</span>
            <span className="hud__route-stat">
              Distance: <strong>{activeRoute.distance.toFixed(1)} m</strong>
            </span>
            <span className="hud__route-divider">•</span>
            <span className="hud__route-stat">
              Waypoints: <strong>{activeRoute.waypointCount}</strong>
            </span>
          </div>
          <div className="hud__route-actions">
            <button
              className="hud__route-btn hud__route-btn--clear"
              onClick={onClearRoute}
              title="Clear Route"
            >
              Clear Route
            </button>
            <button
              className="hud__route-btn hud__route-btn--recalc"
              onClick={onRecalculateRoute}
              title="Recalculate Route"
            >
              ↻ Recalculate
            </button>
          </div>
        </div>
      )}

      {/* Center overlay messages */}
      {state === 'loading' && (
        <div className="hud__center">
          <div className="hud__spinner" />
          <p className="hud__message">Loading 3D environment…</p>
        </div>
      )}

      {state === 'missing' && (
        <div className="hud__center">
          <div className="hud__icon">📦</div>
          <p className="hud__message">3D room model not available yet.</p>
          <p className="hud__sub">
            Place the reconstructed model at<br />
            <code>frontend/public/models/room_01.glb</code>
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="hud__center">
          <div className="hud__icon">⚠️</div>
          <p className="hud__message">{errorMessage || 'Unable to load the 3D environment.'}</p>
        </div>
      )}

      {state === 'ready' && !isLocked && !activeRoute && (
        <div className="hud__center hud__center--click">
          <p className="hud__click">Click viewport to explore</p>
        </div>
      )}

      {/* Bottom-left controls legend */}
      <div className="hud__controls">
        {isLocked && (
          <div className="hud__active-indicator">
            <span className="hud__active-dot" />
            <span>Free Roam Active</span>
          </div>
        )}
        <div className="hud__key-row">
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
          <span className="hud__key-label">= Move</span>
        </div>
        <div className="hud__key-row">
          <kbd>Mouse</kbd>
          <span className="hud__key-label">= Look</span>
        </div>
        <div className="hud__key-row">
          <kbd>ESC</kbd>
          <span className="hud__key-label">= Release Mouse</span>
        </div>
      </div>
    </div>
  )
}
