import type { EnterpriseEdge, EnterpriseGraph, EnterpriseNode } from '../graph/enterpriseGraph'
import type { CompositionState } from './compositionTypes'

export function canvasToGraph(state: CompositionState, sourceGraph: EnterpriseGraph): EnterpriseGraph {
  const sourceNodeById = new Map(sourceGraph.nodes.map((node) => [node.id, node]))
  const sourceEdgeById = new Map(sourceGraph.edges.map((edge) => [edge.id, edge]))

  const nodes: EnterpriseNode[] = state.nodes
    .filter((node) => node.enterpriseNodeId)
    .map((node) => ({
      ...(sourceNodeById.get(node.enterpriseNodeId ?? '') as EnterpriseNode),
      label: node.label,
      layer: node.layer,
      metadata: {
        ...(sourceNodeById.get(node.enterpriseNodeId ?? '')?.metadata ?? {}),
        canvasX: node.position.x,
        canvasY: node.position.y,
        canvasGroupId: node.groupId ?? '',
      },
    }))

  const edges: EnterpriseEdge[] = state.edges
    .filter((edge) => edge.enterpriseEdgeId)
    .map((edge) => ({
      ...(sourceEdgeById.get(edge.enterpriseEdgeId ?? '') as EnterpriseEdge),
      relationship: edge.relationship,
      label: edge.label,
    }))

  return {
    ...sourceGraph,
    id: `${sourceGraph.id}:composition-preview`,
    nodes,
    edges,
  }
}
