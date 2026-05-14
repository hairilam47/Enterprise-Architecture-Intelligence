import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import type { DependencyHeatPoint } from './intelligenceTypes'

export function getDependencyCounts(graph: EnterpriseGraph) {
  return graph.nodes.map((node) => {
    const incoming = graph.edges.filter((edge) => edge.targetId === node.id).length
    const outgoing = graph.edges.filter((edge) => edge.sourceId === node.id).length
    const centrality = incoming + outgoing
    return { node, incoming, outgoing, centrality }
  })
}

export function analyzeDependencyConcentration(graph: EnterpriseGraph): DependencyHeatPoint[] {
  const counts = getDependencyCounts(graph)
  const maxCentrality = Math.max(1, ...counts.map((item) => item.centrality))

  return counts
    .filter((item) => item.centrality > 0)
    .map((item) => {
      const ratio = item.centrality / maxCentrality
      return {
        entityId: item.node.id,
        label: item.node.label,
        centrality: item.centrality,
        incoming: item.incoming,
        outgoing: item.outgoing,
        severity: ratio >= 0.8 && item.centrality >= 4 ? 'critical' : ratio >= 0.55 && item.centrality >= 3 ? 'warning' : 'info',
      } satisfies DependencyHeatPoint
    })
    .sort((left, right) => right.centrality - left.centrality)
}
