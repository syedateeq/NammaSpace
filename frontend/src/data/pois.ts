/**
 * Sample POI dataset for room_01.
 *
 * Coordinates are carefully tuned to lie strictly within the
 * actual reconstructed model bounding box:
 *   X bounds: [-2.17, +2.17], main points [-1.4, +1.5]
 *   Y bounds: [-3.22, +3.22], floor ~0.0, eye-height ~1.6, ceiling ~2.4
 *   Z bounds: [-2.28, +2.28], depth into room [-1.4, +1.2]
 *
 * Coordinate system: Three.js default (Y-up, right-handed).
 *   x → right,  y → up,  z → toward camera (+Z = front/entrance, -Z = back wall)
 */

import type { POI } from '../types/poi'

export const ROOM_01_POIS: POI[] = [
  {
    id: 'poi_main_door',
    name: 'Main Door',
    category: 'entry',
    description: 'Primary entrance to the room. Solid wooden door with handle on the left.',
    position: { x: -1.4, y: 1.2, z: 1.2 },
    icon: 'door',
    floor: 0,
  },
  {
    id: 'poi_bed',
    name: 'Bed',
    category: 'furniture',
    description: 'Single bed positioned along the right wall. Main sleeping area.',
    position: { x: 1.2, y: 0.6, z: -0.8 },
    icon: 'bed',
    floor: 0,
  },
  {
    id: 'poi_wardrobe',
    name: 'Wardrobe',
    category: 'furniture',
    description: 'Built-in wardrobe near the entrance wall. Two-door design with storage.',
    position: { x: -1.3, y: 1.3, z: 0.2 },
    icon: 'wardrobe',
    floor: 0,
  },
  {
    id: 'poi_mirror',
    name: 'Mirror',
    category: 'fixture',
    description: 'Wall-mounted dressing mirror above the dresser unit.',
    position: { x: -1.2, y: 1.5, z: -0.6 },
    icon: 'mirror',
    floor: 0,
  },
  {
    id: 'poi_study_area',
    name: 'Study Area',
    category: 'zone',
    description: 'Desk and chair setup near the window. Includes study lamp and workspace.',
    position: { x: 0.8, y: 0.8, z: 0.8 },
    icon: 'desk',
    floor: 0,
  },
  {
    id: 'poi_window',
    name: 'Window',
    category: 'fixture',
    description: 'Main window with curtains. Provides natural light and ventilation.',
    position: { x: 1.5, y: 1.6, z: 0.3 },
    icon: 'window',
    floor: 0,
  },
  {
    id: 'poi_bookshelf',
    name: 'Bookshelf',
    category: 'furniture',
    description: 'Wall-mounted bookshelf with textbooks and personal items.',
    position: { x: 0.2, y: 1.6, z: -1.4 },
    icon: 'bookshelf',
    floor: 0,
  },
  {
    id: 'poi_chair',
    name: 'Study Chair',
    category: 'furniture',
    description: 'Ergonomic study chair at the desk area.',
    position: { x: 0.5, y: 0.5, z: 1.1 },
    icon: 'chair',
    floor: 0,
  },
  {
    id: 'poi_ceiling_light',
    name: 'Ceiling Light',
    category: 'utility',
    description: 'Main ceiling-mounted LED light fixture. Central illumination for the room.',
    position: { x: 0.2, y: 2.3, z: -0.2 },
    icon: 'light',
    floor: 0,
  },
]
