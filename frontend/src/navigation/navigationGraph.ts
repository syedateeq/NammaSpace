/**
 * navigationGraph.ts
 *
 * 2D navigation grid graph representation for indoor pathfinding.
 *
 * Implements:
 *   - Discrete grid generation from bounds and resolution (0.25m)
 *   - Obstacle masking
 *   - 8-directional neighbor connectivity
 *   - Corner-cutting prevention (blocks diagonal movement if adjacent cardinal cells are blocked)
 *   - Closest walkable node lookup for coordinates inside or adjacent to obstacles
 */

import type {
  GridNode,
  NavGridConfig,
  ObstacleBox,
} from './navigationTypes'
import { ROOM_01_NAV_CONFIG, ROOM_01_OBSTACLES } from './navigationData'

export class NavigationGraph {
  public readonly config: NavGridConfig
  public readonly obstacles: ObstacleBox[]
  public readonly nodes: GridNode[][] = []
  public readonly cols: number
  public readonly rows: number

  constructor(
    config: NavGridConfig = ROOM_01_NAV_CONFIG,
    obstacles: ObstacleBox[] = ROOM_01_OBSTACLES,
  ) {
    this.config = config
    this.obstacles = obstacles

    this.cols = Math.round((config.maxX - config.minX) / config.resolution) + 1
    this.rows = Math.round((config.maxZ - config.minZ) / config.resolution) + 1

    this.buildGrid()
    this.linkNeighbors()
  }

  /** Initialize all grid nodes and flag obstacles */
  private buildGrid(): void {
    const { minX, minZ, resolution } = this.config

    for (let c = 0; c < this.cols; c++) {
      this.nodes[c] = []
      const wx = minX + c * resolution

      for (let r = 0; r < this.rows; r++) {
        const wz = minZ + r * resolution

        // Check if point falls inside any obstacle
        let isWalkable = true
        let blockedReason: string | undefined

        for (const obs of this.obstacles) {
          if (
            wx >= obs.minX &&
            wx <= obs.maxX &&
            wz >= obs.minZ &&
            wz <= obs.maxZ
          ) {
            isWalkable = false
            blockedReason = obs.name
            break
          }
        }

        this.nodes[c][r] = {
          gridX: c,
          gridZ: r,
          x: Number(wx.toFixed(3)),
          z: Number(wz.toFixed(3)),
          walkable: isWalkable,
          blockedReason,
          neighbors: [],
          g: 0,
          h: 0,
          f: 0,
          parent: null,
          visited: false,
          closed: false,
        }
      }
    }
  }

  /** Link each walkable node to its valid 8-directional neighbors */
  private linkNeighbors(): void {
    // 8-directional offsets: [dx, dz]
    const directions: [number, number][] = [
      [0, -1],  // North
      [0, 1],   // South
      [-1, 0],  // West
      [1, 0],   // East
      [-1, -1], // NW
      [1, -1],  // NE
      [-1, 1],  // SW
      [1, 1],   // SE
    ]

    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const node = this.nodes[c][r]
        if (!node.walkable) continue

        for (const [dx, dz] of directions) {
          const nc = c + dx
          const nr = r + dz

          // Boundary check
          if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue

          const neighbor = this.nodes[nc][nr]
          if (!neighbor.walkable) continue

          // Prevent diagonal corner cutting:
          // If moving diagonally, both adjacent orthogonal nodes must be walkable
          if (dx !== 0 && dz !== 0) {
            const side1 = this.nodes[c + dx][r]
            const side2 = this.nodes[c][r + dz]
            if (!side1.walkable || !side2.walkable) {
              continue // Diagonal passage blocked by adjacent obstacle edge
            }
          }

          node.neighbors.push(neighbor)
        }
      }
    }
  }

  /** Reset algorithm working state on all nodes before running A* */
  public resetNodes(): void {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const n = this.nodes[c][r]
        n.g = 0
        n.h = 0
        n.f = 0
        n.parent = null
        n.visited = false
        n.closed = false
      }
    }
  }

  /** Convert world (x, z) coordinates to closest grid indices */
  public worldToGrid(x: number, z: number): { gridX: number; gridZ: number } {
    const c = Math.round((x - this.config.minX) / this.config.resolution)
    const r = Math.round((z - this.config.minZ) / this.config.resolution)

    return {
      gridX: Math.max(0, Math.min(this.cols - 1, c)),
      gridZ: Math.max(0, Math.min(this.rows - 1, r)),
    }
  }

  /** Retrieve node by grid coordinates */
  public getNode(gridX: number, gridZ: number): GridNode | null {
    if (gridX < 0 || gridX >= this.cols || gridZ < 0 || gridZ >= this.rows) {
      return null
    }
    return this.nodes[gridX][gridZ]
  }

  /**
   * Find the closest walkable node to a world position.
   * If the exact node is blocked (e.g. inside furniture or wall),
   * performs a spiral search outward to find the nearest approachable point.
   */
  public findClosestWalkableNode(worldX: number, worldZ: number): GridNode | null {
    const { gridX, gridZ } = this.worldToGrid(worldX, worldZ)
    const exactNode = this.getNode(gridX, gridZ)

    if (exactNode && exactNode.walkable) {
      return exactNode
    }

    // Concentric spiral search outward up to max grid dimension
    const maxRadius = Math.max(this.cols, this.rows)
    let bestNode: GridNode | null = null
    let bestDistSq = Infinity

    for (let radius = 1; radius <= maxRadius; radius++) {
      let foundInRadius = false

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue

          const node = this.getNode(gridX + dx, gridZ + dz)
          if (node && node.walkable) {
            foundInRadius = true
            const distSq = (node.x - worldX) ** 2 + (node.z - worldZ) ** 2
            if (distSq < bestDistSq) {
              bestDistSq = distSq
              bestNode = node
            }
          }
        }
      }

      // If we found candidates at this layer, no need to search further outward
      if (foundInRadius && bestNode) {
        return bestNode
      }
    }

    return bestNode
  }

  /** Total nodes in the grid */
  public getTotalNodes(): number {
    return this.cols * this.rows
  }

  /** Number of blocked (obstacle) nodes */
  public getBlockedNodesCount(): number {
    let count = 0
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this.nodes[c][r].walkable) count++
      }
    }
    return count
  }

  /** Number of walkable nodes */
  public getWalkableNodesCount(): number {
    return this.getTotalNodes() - this.getBlockedNodesCount()
  }
}

/** Global default graph instance for room_01 */
export const defaultNavGraph = new NavigationGraph()
