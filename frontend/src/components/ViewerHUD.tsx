/**
 * ViewerHUD — Minimal heads-up display overlay for the 3D viewer.
 *
 * Shows:
 *  - Namma Space branding
 *  - Control instructions
 *  - Current viewer state (loading, missing model, ready, error)
 */

import './ViewerHUD.css'

export type ViewerState = 'loading' | 'ready' | 'missing' | 'error'

interface ViewerHUDProps {
  state: ViewerState
  errorMessage?: string
}

export default function ViewerHUD({ state, errorMessage }: ViewerHUDProps) {
  return (
    <div className="hud">
      {/* Top-left branding */}
      <div className="hud__brand">
        <span className="hud__logo">🚀</span>
        <span className="hud__title">Namma Space</span>
      </div>

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

      {state === 'ready' && (
        <div className="hud__center hud__center--click">
          <p className="hud__click">Click to explore</p>
        </div>
      )}

      {/* Bottom-left controls legend */}
      <div className="hud__controls">
        <div className="hud__key-row">
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
          <span className="hud__key-label">— Move</span>
        </div>
        <div className="hud__key-row">
          <kbd>Mouse</kbd>
          <span className="hud__key-label">— Look</span>
        </div>
        <div className="hud__key-row">
          <kbd>ESC</kbd>
          <span className="hud__key-label">— Exit mouse control</span>
        </div>
      </div>
    </div>
  )
}
