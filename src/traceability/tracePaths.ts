import { findImpactPath, traverseDownstream, traverseUpstream } from '../graph/traverseGraph'
import type { EnterpriseGraph, EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { RelationshipFilter, TracePath } from './traceabilityTypes'

function filterPath(graph: EnterpriseGraph, path: TracePath, relationshipFilter: RelationshipFilter): TracePath {
  if (relationshipFilter === 'any') return path
  const edgeIds = path.edgeIds.filter((edgeId) => graph.edges.find((edge) => edge.id === edgeId)?.relationship === relationshipFilter)
  const nodeIds = new Set<string>()
  edgeIds.forEach((edgeId) => {
    const edge = graph.edges.find((item) => item.id === edgeId)
    if (edge) {
      nodeIds.add(edge.sourceId)
      nodeIds.add(edge.targetId)
    }
  })
  return { ...path, edgeIds, nodeIds: [...nodeIds] }
}

export function traceUpstreamPath(graph: EnterpriseGraph, nodeId: string, relationshipFilter: RelationshipFilter = 'any'): TracePath {
  const result = traverseUpstream(graph, nodeId)
  return filterPath(graph, { id: `trace-up:${nodeId}`, label: 'Upstream trace', nodeIds: result.nodeIds, edgeIds: result.edgeIds }, relationshipFilter)
}

export function traceDownstreamPath(graph: EnterpriseGraph, nodeId: string, relationshipFilter: RelationshipFilter = 'any'): TracePath {
  const result = traverseDownstream(graph, nodeId)
  return filterPath(graph, { id: `trace-down:${nodeId}`, label: 'Downstream trace', nodeIds: result.nodeIds, edgeIds: result.edgeIds }, relationshipFilter)
}

export function traceShortestPath(graph: EnterpriseGraph, sourceId: string, targetId: string, relationshipFilter: RelationshipFilter = 'any'): TracePath {
  const result = findImpactPath(graph, sourceId, targetId)
  return filterPath(graph, { id: `trace-short:${sourceId}:${targetId}`, label: 'Shortest path', nodeIds: result.nodeIds, edgeIds: result.edgeIds }, relationshipFilter)
}

export const traceRelationshipFilters: (EnterpriseRelationshipType | 'any')[] = ['any', 'depends_on', 'calls', 'stores', 'validated_by', 'deployed_on', 'causes']
