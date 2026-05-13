import { traverseDownstream, traverseUpstream } from '../graph/traverseGraph'
import type { VisualGraph, VisualNode } from './visualGraph'

export type GraphNodeMetrics = {
  upstream: VisualNode[]
  downstream: VisualNode[]
  relatedRequirements: VisualNode[]
  relatedApis: VisualNode[]
  relatedInfrastructure: VisualNode[]
  relatedTests: VisualNode[]
  impactCount: number
  riskNotes: string[]
}

function nodesFromIds(visualGraph: VisualGraph, enterpriseNodeIds: string[]) {
  const ids = new Set(enterpriseNodeIds.map((id) => `visual:${id}`))
  return visualGraph.nodes.filter((node) => ids.has(node.id))
}

export function getGraphNodeMetrics(visualGraph: VisualGraph, enterpriseNodeId?: string): GraphNodeMetrics {
  if (!enterpriseNodeId) {
    return {
      upstream: [],
      downstream: [],
      relatedRequirements: [],
      relatedApis: [],
      relatedInfrastructure: [],
      relatedTests: [],
      impactCount: 0,
      riskNotes: ['Select a graph node to inspect enterprise impact.'],
    }
  }

  const upstreamTraversal = traverseUpstream(visualGraph.sourceGraph, enterpriseNodeId)
  const downstreamTraversal = traverseDownstream(visualGraph.sourceGraph, enterpriseNodeId)
  const upstream = nodesFromIds(visualGraph, upstreamTraversal.nodeIds).filter(
    (node) => node.enterpriseNodeId !== enterpriseNodeId,
  )
  const downstream = nodesFromIds(visualGraph, downstreamTraversal.nodeIds).filter(
    (node) => node.enterpriseNodeId !== enterpriseNodeId,
  )
  const impactedNodes = [...upstream, ...downstream]
  const riskNotes = [
    ...impactedNodes
      .filter((node) => node.status === 'critical')
      .map((node) => `${node.label} is critical in the selected impact area.`),
    ...impactedNodes
      .filter((node) => node.status === 'warning')
      .map((node) => `${node.label} has a warning in the selected impact area.`),
  ]

  return {
    upstream,
    downstream,
    relatedRequirements: impactedNodes.filter((node) => node.type === 'requirement'),
    relatedApis: impactedNodes.filter((node) => node.type === 'api'),
    relatedInfrastructure: impactedNodes.filter((node) => node.type === 'infrastructure'),
    relatedTests: impactedNodes.filter((node) => node.type === 'testcase'),
    impactCount: new Set(impactedNodes.map((node) => node.id)).size,
    riskNotes: riskNotes.length ? riskNotes : ['No immediate critical or warning nodes in the selected impact area.'],
  }
}
