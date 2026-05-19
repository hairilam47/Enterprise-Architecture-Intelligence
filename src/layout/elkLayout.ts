/**
 * elkLayout.ts — ELK.js layout adapter for the EA canvas.
 *
 * Accepts EAProject elements/relationships and returns computed {id, x, y}
 * positions via ELK's layered algorithm.  Falls back to a simple grid when
 * ELK is not available or throws.
 */

import ELK from 'elkjs/lib/elk.bundled.js'
import type { EAProject } from '../store/eaTypes'

export interface LayoutPosition {
  id: string
  x: number
  y: number
}

interface ELKNode {
  id: string
  width: number
  height: number
}

interface ELKEdge {
  id: string
  sources: string[]
  targets: string[]
}

const elk = new ELK()

const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '60',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
}

export async function computeELKLayout(
  project: EAProject,
  viewId?: string,
): Promise<LayoutPosition[]> {
  const vid = viewId ?? project.activeViewId ?? ''
  const view = project.views.find((v) => v.id === vid)
  const elementIds = new Set(
    view ? view.elementIds : Object.keys(project.elements),
  )
  const relIds = new Set(
    view ? view.relationshipIds : Object.keys(project.relationships),
  )

  const elkNodes: ELKNode[] = Object.values(project.elements)
    .filter((el) => elementIds.has(el.id))
    .map((el) => ({ id: el.id, width: 160, height: 60 }))

  const elkEdges: ELKEdge[] = Object.values(project.relationships)
    .filter(
      (r) =>
        relIds.has(r.id) &&
        elementIds.has(r.sourceId) &&
        elementIds.has(r.targetId),
    )
    .map((r) => ({ id: r.id, sources: [r.sourceId], targets: [r.targetId] }))

  if (elkNodes.length === 0) return []

  try {
    const graph = await elk.layout({
      id: 'root',
      layoutOptions: ELK_OPTIONS,
      children: elkNodes,
      edges: elkEdges,
    })

    return (graph.children ?? [])
      .filter((n) => n.x !== undefined && n.y !== undefined)
      .map((n) => ({ id: n.id, x: n.x!, y: n.y! }))
  } catch {
    // Fallback: simple grid
    return elkNodes.map((n, i) => ({
      id: n.id,
      x: (i % 5) * 220 + 80,
      y: Math.floor(i / 5) * 120 + 80,
    }))
  }
}
