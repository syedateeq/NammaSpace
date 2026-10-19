/**
 * POIPanel — Sidebar panel for searching, filtering, and selecting POIs.
 *
 * Features:
 *   - Real-time search by name, description, category
 *   - Category filter chips with color coding
 *   - Selectable POI cards with icon, name, description, and "Go To" action
 *   - Animated slide-in from the right with dedicated close button
 *   - Toggle button to show/hide POI markers
 *   - Detail strip with coordinates, "Navigate" (A* pathfinding), and "Go To" actions
 *   - Route information display: Target, Distance, Waypoints, Clear & Recalculate
 */

import { useState, useMemo } from 'react'
import type { POI, POICategory } from '../types/poi'
import type { PathResult } from '../navigation/navigationTypes'
import {
  POI_ICON_MAP,
  POI_CATEGORY_LABELS,
  POI_CATEGORY_COLORS,
} from '../types/poi'
import './POIPanel.css'

interface POIPanelProps {
  pois: POI[]
  selectedId: string | null
  onSelect: (id: string) => void
  onClearSelection: () => void
  markersVisible: boolean
  onToggleMarkers: () => void
  isOpen: boolean
  onTogglePanel: () => void
  onGoTo?: (poi: POI) => void
  onNavigate?: (poi: POI) => void
  activeRoute?: PathResult | null
  onClearRoute?: () => void
  onRecalculateRoute?: () => void
}

export default function POIPanel({
  pois,
  selectedId,
  onSelect,
  onClearSelection,
  markersVisible,
  onToggleMarkers,
  isOpen,
  onTogglePanel,
  onGoTo,
  onNavigate,
  activeRoute,
  onClearRoute,
  onRecalculateRoute,
}: POIPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<POICategory | 'all'>('all')

  // Derive unique categories from dataset
  const categories = useMemo(() => {
    const cats = new Set(pois.map((p) => p.category))
    return Array.from(cats) as POICategory[]
  }, [pois])

  // Filter POIs by search + category
  const filteredPois = useMemo(() => {
    let result = pois

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    }

    return result
  }, [pois, searchQuery, activeCategory])

  const selectedPoi = pois.find((p) => p.id === selectedId) || null

  return (
    <>
      {/* Toggle button — visible when panel is closed */}
      {!isOpen && (
        <button
          className="poi-toggle-btn"
          onClick={onTogglePanel}
          title="Open POI panel"
        >
          <span className="poi-toggle-btn__icon">📍</span>
          <span className="poi-toggle-btn__label">POIs</span>
        </button>
      )}

      {/* Sliding panel */}
      <div className={`poi-panel ${isOpen ? 'poi-panel--open' : ''}`}>
        {/* Header */}
        <div className="poi-panel__header">
          <div className="poi-panel__title-row">
            <h2 className="poi-panel__title">
              <span className="poi-panel__title-icon">📍</span>
              Points of Interest
            </h2>
            <div className="poi-panel__header-actions">
              <span className="poi-panel__count">{filteredPois.length}</span>
              <button
                className="poi-panel__close-btn"
                onClick={onTogglePanel}
                title="Close panel"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="poi-panel__search">
            <span className="poi-panel__search-icon">🔍</span>
            <input
              type="text"
              className="poi-panel__search-input"
              placeholder="Search places (e.g. bed, door)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="poi-panel__search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="poi-panel__chips">
            <button
              className={`poi-chip ${activeCategory === 'all' ? 'poi-chip--active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`poi-chip ${activeCategory === cat ? 'poi-chip--active' : ''}`}
                style={
                  activeCategory === cat
                    ? {
                        background: `${POI_CATEGORY_COLORS[cat]}22`,
                        borderColor: `${POI_CATEGORY_COLORS[cat]}66`,
                        color: POI_CATEGORY_COLORS[cat],
                      }
                    : undefined
                }
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? 'all' : cat)
                }
              >
                {POI_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Markers toggle */}
          <button className="poi-panel__markers-toggle" onClick={onToggleMarkers}>
            <span
              className={`poi-panel__markers-dot ${
                markersVisible ? 'poi-panel__markers-dot--on' : ''
              }`}
            />
            {markersVisible ? 'Markers visible' : 'Markers hidden'}
          </button>
        </div>

        {/* POI List */}
        <div className="poi-panel__list">
          {filteredPois.length === 0 && (
            <div className="poi-panel__empty">
              <span className="poi-panel__empty-icon">🔎</span>
              <p>No matching places found.</p>
            </div>
          )}

          {filteredPois.map((poi) => {
            const isActive = selectedId === poi.id
            const isRouteTarget = activeRoute?.targetPoiId === poi.id
            return (
              <div
                key={poi.id}
                role="button"
                tabIndex={0}
                className={`poi-card ${isActive ? 'poi-card--selected' : ''} ${
                  isRouteTarget ? 'poi-card--routed' : ''
                }`}
                onClick={() => (isActive ? onClearSelection() : onSelect(poi.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    isActive ? onClearSelection() : onSelect(poi.id)
                  }
                }}
                style={
                  isActive
                    ? {
                        borderColor: `${POI_CATEGORY_COLORS[poi.category]}88`,
                        background: `${POI_CATEGORY_COLORS[poi.category]}0d`,
                      }
                    : undefined
                }
              >
                <div
                  className="poi-card__icon"
                  style={{
                    background: `${POI_CATEGORY_COLORS[poi.category]}18`,
                    color: POI_CATEGORY_COLORS[poi.category],
                  }}
                >
                  {POI_ICON_MAP[poi.icon]}
                </div>
                <div className="poi-card__body">
                  <div className="poi-card__name-row">
                    <span className="poi-card__name">{poi.name}</span>
                    <div className="poi-card__actions">
                      <button
                        className="poi-card__nav-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(poi.id)
                          onNavigate?.(poi)
                        }}
                        title={`Navigate to ${poi.name}`}
                      >
                        🧭 Navigate
                      </button>
                      <button
                        className="poi-card__goto-link"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(poi.id)
                          onGoTo?.(poi)
                        }}
                        title={`Go to ${poi.name}`}
                      >
                        Go To →
                      </button>
                    </div>
                  </div>
                  <div className="poi-card__desc">{poi.description}</div>
                  <div className="poi-card__meta">
                    <span
                      className="poi-card__category"
                      style={{
                        color: POI_CATEGORY_COLORS[poi.category],
                        background: `${POI_CATEGORY_COLORS[poi.category]}12`,
                      }}
                    >
                      {POI_CATEGORY_LABELS[poi.category]}
                    </span>
                    {isRouteTarget && (
                      <span className="poi-card__routed-badge">
                        🧭 Active Route
                      </span>
                    )}
                  </div>
                </div>
                {isActive && <span className="poi-card__check">✓</span>}
              </div>
            )
          })}
        </div>

        {/* Selected POI detail strip */}
        {selectedPoi && (
          <div
            className="poi-panel__detail"
            style={{
              borderColor: `${POI_CATEGORY_COLORS[selectedPoi.category]}44`,
            }}
          >
            <div className="poi-panel__detail-header">
              <span className="poi-panel__detail-icon">
                {POI_ICON_MAP[selectedPoi.icon]}
              </span>
              <strong>{selectedPoi.name}</strong>

              <div className="poi-detail__action-buttons">
                <button
                  className="poi-nav-primary-btn"
                  onClick={() => onNavigate?.(selectedPoi)}
                  title={`Calculate walking route to ${selectedPoi.name}`}
                >
                  🧭 Navigate
                </button>
                <button
                  className="poi-goto-btn"
                  onClick={() => onGoTo?.(selectedPoi)}
                  title={`Look at ${selectedPoi.name}`}
                >
                  🎯 Go To
                </button>
              </div>
            </div>

            <p className="poi-panel__detail-desc">{selectedPoi.description}</p>
            <div className="poi-panel__detail-coords">
              <code>
                x: {selectedPoi.position.x.toFixed(1)} &nbsp; y:{' '}
                {selectedPoi.position.y.toFixed(1)} &nbsp; z:{' '}
                {selectedPoi.position.z.toFixed(1)}
              </code>
            </div>
          </div>
        )}

        {/* Active Route info strip */}
        {activeRoute && (
          <div className="poi-panel__route-box">
            <div className="poi-route-box__header">
              <div className="poi-route-box__title">
                <span className="poi-route-box__icon">🧭</span>
                <strong>Route to {activeRoute.targetPoiName}</strong>
              </div>
              <button
                className="poi-route-box__close"
                onClick={onClearRoute}
                title="Clear route"
              >
                ✕
              </button>
            </div>

            {activeRoute.success ? (
              <>
                <div className="poi-route-box__stats">
                  <div className="poi-route-stat">
                    <span className="poi-route-stat__label">Distance</span>
                    <span className="poi-route-stat__value">
                      {activeRoute.distance.toFixed(1)} m
                    </span>
                  </div>
                  <div className="poi-route-stat">
                    <span className="poi-route-stat__label">Waypoints</span>
                    <span className="poi-route-stat__value">
                      {activeRoute.waypointCount}
                    </span>
                  </div>
                </div>
                <p className="poi-route-box__hint">
                  Follow the glowing cyan path with WASD keys.
                </p>
                <div className="poi-route-box__actions">
                  <button
                    className="poi-route-btn poi-route-btn--clear"
                    onClick={onClearRoute}
                  >
                    Clear Route
                  </button>
                  <button
                    className="poi-route-btn poi-route-btn--recalc"
                    onClick={onRecalculateRoute}
                  >
                    ↻ Recalculate
                  </button>
                </div>
              </>
            ) : (
              <div className="poi-route-box__error">
                <span className="poi-route-error-icon">⚠️</span>
                <span>{activeRoute.message || 'No walkable route found.'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
