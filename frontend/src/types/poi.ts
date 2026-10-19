/**
 * POI (Point of Interest) data model for Namma Space.
 *
 * Defines the shape of indoor landmarks used for labeling,
 * search, and navigation within the 3D viewer.
 */

/** Category of indoor points of interest. */
export type POICategory =
  | 'entry'       // Doors, entrances
  | 'furniture'   // Beds, tables, chairs, wardrobes
  | 'fixture'     // Windows, mirrors, built-in shelves
  | 'zone'        // Study area, reading corner, workspace
  | 'utility'     // Switches, sockets, AC unit

/** Visual icon type — maps to an emoji or custom icon. */
export type POIIcon =
  | 'door'
  | 'bed'
  | 'wardrobe'
  | 'mirror'
  | 'desk'
  | 'window'
  | 'light'
  | 'bookshelf'
  | 'chair'
  | 'generic'

/** 3D position within the reconstructed scene. */
export interface POIPosition {
  x: number
  y: number
  z: number
}

/** A single Point of Interest in an indoor space. */
export interface POI {
  /** Unique identifier (e.g., "poi_main_door"). */
  id: string

  /** Human-readable display name. */
  name: string

  /** Semantic category for filtering. */
  category: POICategory

  /** Short description shown on selection. */
  description: string

  /** 3D world-space position in the scene. */
  position: POIPosition

  /** Icon type for visual marker. */
  icon: POIIcon

  /** Optional floor number (default 0 for single-floor). */
  floor?: number
}

/** Map from POIIcon to an emoji character for rendering. */
export const POI_ICON_MAP: Record<POIIcon, string> = {
  door:      '🚪',
  bed:       '🛏️',
  wardrobe:  '👔',
  mirror:    '🪞',
  desk:      '📚',
  window:    '🪟',
  light:     '💡',
  bookshelf: '📖',
  chair:     '🪑',
  generic:   '📍',
}

/** Map from POICategory to a display label. */
export const POI_CATEGORY_LABELS: Record<POICategory, string> = {
  entry:     'Entry / Exit',
  furniture: 'Furniture',
  fixture:   'Fixtures',
  zone:      'Zones',
  utility:   'Utility',
}

/** Category color accents for UI chips and markers. */
export const POI_CATEGORY_COLORS: Record<POICategory, string> = {
  entry:     '#34d399',   // Emerald
  furniture: '#818cf8',   // Indigo
  fixture:   '#22d3ee',   // Cyan
  zone:      '#a78bfa',   // Violet
  utility:   '#fbbf24',   // Amber
}
