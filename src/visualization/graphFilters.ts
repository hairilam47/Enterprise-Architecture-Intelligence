import type { EnterpriseNodeType, EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { VisualGraph } from './visualGraph'

export type WarningSeverityFilter = 'any' | 'warning' | 'critical'
export type BottleneckSeverityFilter = 'any' | 'bottleneck'

export type GraphFilters = {
  nodeTypes?: EnterpriseNodeType[]
  relationshipTypes?: EnterpriseRelationshipType[]
  layers?: string[]
  warningSeverity?: WarningSeverityFilter
  bottleneckSeverity?: BottleneckSeverityFilter
  showWarnings: boolean
  showBottlenecks: boolean
}

export const defaultGraphFilters: GraphFilters = {
  showWarnings: true,
  showBottlenecks: true,
  warningSeverity: 'any',
  bottleneckSeverity: 'any',
}

export function filterVisualGraph(visualGraph: VisualGraph, filters: GraphFilters): VisualGraph {
  const warningNodeIds = new Set(
    visualGraph.overlays
      .filter((overlay) => overlay.kind === 'warning')
      .flatMap((overlay) => overlay.nodeIds),
  )
  const bottleneckNodeIds = new Set(
    visualGraph.overlays
      .filter((overlay) => overlay.kind === 'bottleneck')
      .flatMap((overlay) => overlay.nodeIds),
  )

  const nodes = visualGraph.nodes.filter((node) => {
    const matchesType = !filters.nodeTypes?.length || filters.nodeTypes.includes(node.type)
    const matchesLayer =
      !filters.layers?.length ||
      filters.layers.includes(node.metadata.layer ?? '') ||
      filters.layers.includes(node.metadata.owner ?? '')
    const matchesWarning =
      filters.warningSeverity === 'any' ||
      (filters.warningSeverity === 'warning' && (warningNodeIds.has(node.id) || node.status === 'warning')) ||
      (filters.warningSeverity === 'critical' && node.status === 'critical')
    const matchesBottleneck =
      filters.bottleneckSeverity === 'any' || bottleneckNodeIds.has(node.id)

    return matchesType && matchesLayer && matchesWarning && matchesBottleneck
  })
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = visualGraph.edges.filter((edge) => {
    const matchesRelationship =
      !filters.relationshipTypes?.length || filters.relationshipTypes.includes(edge.relationship)

    return matchesRelationship && nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)
  })

  return {
    ...visualGraph,
    nodes,
    edges,
    overlays: visualGraph.overlays.filter((overlay) => {
      if (overlay.kind === 'warning') {
        return filters.showWarnings
      }

      if (overlay.kind === 'bottleneck') {
        return filters.showBottlenecks
      }

      return true
    }),
  }
}
