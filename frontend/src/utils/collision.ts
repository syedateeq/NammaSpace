/**
 * Movement / collision utility for first-person navigation.
 *
 * Part 4: Returns true for all movement (no real obstacles yet).
 * Future phases will implement ray-casting against the loaded mesh
 * to prevent walking through walls and furniture.
 */

import type { Vector3 } from 'three'

/**
 * Check whether the camera can move to a target position.
 *
 * @param _currentPos  Current camera world position
 * @param _targetPos   Desired next camera world position
 * @param _scene       Optional Three.js scene for raycasting (future)
 * @returns            true if movement is allowed
 *
 * TODO (Part 6 — Desktop Pathfinding):
 *   - Accept the loaded room mesh as a collidable
 *   - Cast a ray from currentPos → targetPos
 *   - Return false if the ray intersects geometry within move distance
 *   - Optionally slide along walls instead of hard-blocking
 */
export function canMoveTo(
  _currentPos: Vector3,
  _targetPos: Vector3,
  _scene?: unknown,
): boolean {
  // Phase 4: Allow all movement — no collision geometry loaded yet.
  return true
}
