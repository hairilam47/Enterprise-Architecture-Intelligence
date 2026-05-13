import { traverseDownstream } from '../graph/traverseGraph'
import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import type { TraceabilityMatrix } from './traceabilityTypes'
import { domainForType, nodesByDomain, traceDomains } from './traceUtils'

export function buildTraceabilityMatrix(graph: EnterpriseGraph): TraceabilityMatrix {
  const cells = traceDomains.flatMap((sourceDomain) =>
    traceDomains.map((targetDomain) => {
      const sourceNodes = nodesByDomain(graph, sourceDomain)
      const targetNodes = nodesByDomain(graph, targetDomain)
      const targetIds = new Set(targetNodes.map((node) => node.id))
      const directCount = graph.edges.filter((edge) => {
        const source = graph.nodes.find((node) => node.id === edge.sourceId)
        const target = graph.nodes.find((node) => node.id === edge.targetId)
        return domainForType(source?.type ?? 'service') === sourceDomain && domainForType(target?.type ?? 'service') === targetDomain
      }).length
      const indirectCount = sourceNodes.reduce((count, node) => {
        const downstream = traverseDownstream(graph, node.id)
        return count + downstream.nodeIds.filter((nodeId) => targetIds.has(nodeId)).length
      }, 0)
      const relationshipCount = directCount + Math.max(0, indirectCount - directCount)
      const missingCount = sourceNodes.length && targetNodes.length && relationshipCount === 0 ? sourceNodes.length : 0

      return { sourceDomain, targetDomain, directCount, indirectCount, missingCount, relationshipCount }
    }),
  )

  return { domains: traceDomains, cells }
}
