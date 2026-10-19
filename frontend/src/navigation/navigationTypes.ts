/**
 * navigationTypes.ts
 *
 * Core type definitions for Namma Space 2D indoor navigation grid
 * and A* pathfinding.
 */

export interface GridNode {
  /** Grid array indices */
  gridX: number
  gridZ: number

  /** World space coordinates (meters) */
  x: number
  z: number

  /** Whether this node can be traversed */
  walkable: boolean

  /** Obstacle ID or tag if blocked */
  blockedReason?: string

  /** 8-directional neighbor nodes */
  neighbors: GridNode[]

  /** A* algorithm working properties */
  g: number // Cost from start
  h: number // Heuristic to target
  f: number // Total cost (g + h)
  parent: GridNode | null
  visited: boolean
  closed: boolean
}

export interface NavGridConfig {
  /** Floor boundaries in world coordinates */
  minX: number
  maxX: number
  minZ: number
  maxZ: number

  /** Grid spacing in meters (e.g. 0.25m) */
  resolution: number

  /** Walking height (meters) where path is rendered */
  walkHeight: number
}

export interface ObstacleBox {
  id: string
  name: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Waypoint3D {
  x: number
  y: number
  z: number
}

export interface PathResult {
  /** Whether a valid path was found */
  success: boolean

  /** Target POI ID that this route leads to */
  targetPoiId: string

  /** Target POI display name */
  targetPoiName: string

  /** List of 3D points forming the path from player to target */
  waypoints: Waypoint3D[]

  /** Total path length in meters */
  distance: number

  /** Number of waypoints along the route */
  waypointCount: number

  /** Explanatory message or error */
  message?: string
}
