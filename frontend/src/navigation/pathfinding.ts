/**
 * pathfinding.ts
 *
 * A* (A-Star) pathfinding engine for Namma Space.
 *
 * Implements:
 *   - Euclidean / diagonal distance heuristic
 *   - Priority queue for open set
 *   - Direct 8-directional movement with exact edge weights
 *   - Strict corner-cutting prevention (inherited from NavigationGraph)
 *   - Line-of-sight path smoothing (string-pulling across walkable space)
 *   - Precise distance calculation in meters
 */

import type { POI } from '../types/poi'
import type { GridNode, PathResult, Waypoint3D } from './navigationTypes'
import { NavigationGraph, defaultNavGraph } from './navigationGraph'

/** Min-Heap Priority Queue for optimal A* open set performance */
class MinHeap {
  private items: GridNode[] = []

  public push(node: GridNode): void {
    this.items.push(node)
    this.bubbleUp(this.items.length - 1)
  }

  public pop(): GridNode | undefined {
    if (this.items.length === 0) return undefined
    const top = this.items[0]
    const bottom = this.items.pop()!
    if (this.items.length > 0) {
      this.items[0] = bottom
      this.sinkDown(0)
    }
    return top
  }

  public size(): number {
    return this.items.length
  }

  public isEmpty(): boolean {
    return this.items.length === 0
  }

  private bubbleUp(idx: number): void {
    const node = this.items[idx]
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2)
      const parent = this.items[parentIdx]
      if (node.f >= parent.f) break
      this.items[idx] = parent
      idx = parentIdx
    }
    this.items[idx] = node
  }

  private sinkDown(idx: number): void {
    const length = this.items.length
    const node = this.items[idx]
    while (true) {
      let leftIdx = 2 * idx + 1
      let rightIdx = 2 * idx + 2
      let swapIdx: number | null = null

      if (leftIdx < length) {
        if (this.items[leftIdx].f < node.f) {
          swapIdx = leftIdx
        }
      }

      if (rightIdx < length) {
        if (
          (swapIdx === null && this.items[rightIdx].f < node.f) ||
          (swapIdx !== null && this.items[rightIdx].f < this.items[leftIdx].f)
        ) {
          swapIdx = rightIdx
        }
      }

      if (swapIdx === null) break
      this.items[idx] = this.items[swapIdx]
      idx = swapIdx
    }
    this.items[idx] = node
  }
}

/** Distance heuristic: Euclidean distance */
function heuristic(a: GridNode, b: GridNode): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

/** Step distance between adjacent nodes */
function stepCost(a: GridNode, b: GridNode): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}

/**
 * Check if a direct line segment between two nodes is entirely walkable.
 * Samples points along the segment at half-resolution steps.
 */
function hasLineOfSight(
  a: GridNode,
  b: GridNode,
  graph: NavigationGraph,
): boolean {
  const dist = Math.hypot(b.x - a.x, b.z - a.z)
  const steps = Math.ceil(dist / (graph.config.resolution * 0.5))
  if (steps <= 1) return true

  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const sampleX = a.x + (b.x - a.x) * t
    const sampleZ = a.z + (b.z - a.z) * t
    const node = graph.findClosestWalkableNode(sampleX, sampleZ)
    if (!node || !node.walkable) {
      return false
    }
    // Ensure the sample is close to an actually walkable node
    const d = Math.hypot(node.x - sampleX, node.z - sampleZ)
    if (d > graph.config.resolution * 0.75) {
      return false
    }
  }
  return true
}

/**
 * Smooths raw grid waypoints using greedy string-pulling (line-of-sight skip).
 */
function smoothPath(
  rawPath: GridNode[],
  graph: NavigationGraph,
): GridNode[] {
  if (rawPath.length <= 2) return rawPath

  const smoothed: GridNode[] = [rawPath[0]]
  let currentIdx = 0

  while (currentIdx < rawPath.length - 1) {
    let furthestVisible = currentIdx + 1

    for (let testIdx = rawPath.length - 1; testIdx > currentIdx + 1; testIdx--) {
      if (hasLineOfSight(rawPath[currentIdx], rawPath[testIdx], graph)) {
        furthestVisible = testIdx
        break
      }
    }

    smoothed.push(rawPath[furthestVisible])
    currentIdx = furthestVisible
  }

  return smoothed
}

/**
 * Calculate the shortest walkable route from a start position to a target POI.
 *
 * @param startPos  Current player/camera position {x, y, z}
 * @param targetPoi Target POI object
 * @param graph     Navigation graph (defaults to room_01 graph)
 */
export function findPath(
  startPos: { x: number; y?: number; z: number },
  targetPoi: POI,
  graph: NavigationGraph = defaultNavGraph,
): PathResult {
  graph.resetNodes()

  const startNode = graph.findClosestWalkableNode(startPos.x, startPos.z)
  const targetNode = graph.findClosestWalkableNode(
    targetPoi.position.x,
    targetPoi.position.z,
  )

  if (!startNode || !targetNode) {
    return {
      success: false,
      targetPoiId: targetPoi.id,
      targetPoiName: targetPoi.name,
      waypoints: [],
      distance: 0,
      waypointCount: 0,
      message: 'No walkable route found (start or target outside bounds).',
    }
  }

  if (startNode === targetNode) {
    const singleWp: Waypoint3D = {
      x: targetPoi.position.x,
      y: graph.config.walkHeight,
      z: targetPoi.position.z,
    }
    return {
      success: true,
      targetPoiId: targetPoi.id,
      targetPoiName: targetPoi.name,
      waypoints: [singleWp],
      distance: 0.1,
      waypointCount: 1,
      message: 'Already at target location.',
    }
  }

  const openSet = new MinHeap()
  startNode.g = 0
  startNode.h = heuristic(startNode, targetNode)
  startNode.f = startNode.h
  startNode.visited = true
  openSet.push(startNode)

  let reached = false

  while (!openSet.isEmpty()) {
    const current = openSet.pop()!

    if (current === targetNode) {
      reached = true
      break
    }

    current.closed = true

    for (const neighbor of current.neighbors) {
      if (neighbor.closed) continue

      const tentativeG = current.g + stepCost(current, neighbor)

      if (!neighbor.visited) {
        neighbor.visited = true
        neighbor.parent = current
        neighbor.g = tentativeG
        neighbor.h = heuristic(neighbor, targetNode)
        neighbor.f = neighbor.g + neighbor.h
        openSet.push(neighbor)
      } else if (tentativeG < neighbor.g) {
        neighbor.parent = current
        neighbor.g = tentativeG
        neighbor.f = neighbor.g + neighbor.h
        // Re-push to refresh priority in heap
        openSet.push(neighbor)
      }
    }
  }

  if (!reached) {
    return {
      success: false,
      targetPoiId: targetPoi.id,
      targetPoiName: targetPoi.name,
      waypoints: [],
      distance: 0,
      waypointCount: 0,
      message: 'No walkable route found (path blocked by obstacles).',
    }
  }

  // Reconstruct path from target back to start
  const rawPath: GridNode[] = []
  let curr: GridNode | null = targetNode
  while (curr) {
    rawPath.push(curr)
    curr = curr.parent
  }
  rawPath.reverse()

  // Apply smoothing
  const smoothedNodes = smoothPath(rawPath, graph)

  // Construct 3D waypoints at walk height
  const waypoints: Waypoint3D[] = []

  // Add initial player ground position
  waypoints.push({
    x: Number(startPos.x.toFixed(2)),
    y: graph.config.walkHeight,
    z: Number(startPos.z.toFixed(2)),
  })

  for (const node of smoothedNodes) {
    waypoints.push({
      x: node.x,
      y: graph.config.walkHeight,
      z: node.z,
    })
  }

  // Add final target POI ground position
  waypoints.push({
    x: Number(targetPoi.position.x.toFixed(2)),
    y: graph.config.walkHeight,
    z: Number(targetPoi.position.z.toFixed(2)),
  })

  // Calculate cumulative distance in meters
  let totalDistance = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    totalDistance += Math.hypot(p2.x - p1.x, p2.z - p1.z)
  }

  return {
    success: true,
    targetPoiId: targetPoi.id,
    targetPoiName: targetPoi.name,
    waypoints,
    distance: Number(totalDistance.toFixed(1)),
    waypointCount: waypoints.length,
    message: `Route found — ${totalDistance.toFixed(1)} m`,
  }
}
