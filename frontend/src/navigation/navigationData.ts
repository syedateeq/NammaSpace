/**
 * navigationData.ts
 *
 * Configured navigation map for room_01.
 *
 * Defines the floor navigation boundaries, grid resolution (0.25m),
 * and obstacle footprints corresponding to the captured indoor space.
 */

import type { NavGridConfig, ObstacleBox } from './navigationTypes'

export const ROOM_01_NAV_CONFIG: NavGridConfig = {
  minX: -2.0,
  maxX: 2.0,
  minZ: -2.0,
  maxZ: 2.0,
  resolution: 0.25, // 25cm grid cells for smooth indoor pathfinding
  walkHeight: 0.08, // Elevation above floor to render paths without z-fighting
}

/**
 * Manually defined obstacle bounding boxes corresponding to the actual
 * indoor room furniture and perimeter walls.
 */
export const ROOM_01_OBSTACLES: ObstacleBox[] = [
  // ---------- Perimeter Walls ----------
  {
    id: 'wall_back',
    name: 'Back Wall',
    minX: -2.0,
    maxX: 2.0,
    minZ: -2.0,
    maxZ: -1.7,
  },
  {
    id: 'wall_right',
    name: 'Right Wall (Window side)',
    minX: 1.65,
    maxX: 2.0,
    minZ: -2.0,
    maxZ: 2.0,
  },
  {
    id: 'wall_front',
    name: 'Front Wall',
    minX: -0.8,
    maxX: 2.0,
    minZ: 1.65,
    maxZ: 2.0,
  },
  {
    id: 'wall_left_back',
    name: 'Left Wall (Dresser section)',
    minX: -2.0,
    maxX: -1.65,
    minZ: -2.0,
    maxZ: 0.8,
  },

  // ---------- Furniture Obstacles ----------
  {
    id: 'obs_bed',
    name: 'Bed',
    minX: 0.8,
    maxX: 1.65,
    minZ: -1.4,
    maxZ: -0.3,
  },
  {
    id: 'obs_wardrobe',
    name: 'Wardrobe',
    minX: -1.65,
    maxX: -0.9,
    minZ: -0.2,
    maxZ: 0.7,
  },
  {
    id: 'obs_study_desk',
    name: 'Study Desk',
    minX: 0.5,
    maxX: 1.2,
    minZ: 0.5,
    maxZ: 1.0,
  },
  {
    id: 'obs_study_chair',
    name: 'Study Chair',
    minX: 0.35,
    maxX: 0.7,
    minZ: 0.95,
    maxZ: 1.3,
  },
  {
    id: 'obs_mirror_dresser',
    name: 'Mirror Dresser Unit',
    minX: -1.65,
    maxX: -0.95,
    minZ: -0.9,
    maxZ: -0.35,
  },
  {
    id: 'obs_bookshelf',
    name: 'Back Bookshelf Unit',
    minX: -0.1,
    maxX: 0.55,
    minZ: -1.7,
    maxZ: -1.25,
  },
]
