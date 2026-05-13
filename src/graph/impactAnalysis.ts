import type { EnterpriseGraph } from './enterpriseGraph'
import { findCriticalPath, traverseDownstream, traverseUpstream } from './traverseGraph'

export type ImpactAnalysis = {
  selectedNodeId: string
  upstreamNodeIds: string[]
  downstreamNodeIds: string[]
  impactNodeIds: string[]
  impactEdgeIds: string[]
  criticalNodeIds: string[]
  explanation: string
}

export function analyzeImpact(graph: EnterpriseGraph, selectedNodeId: string): ImpactAnalysis {
  const upstream = traverseUpstream(graph, selectedNodeId)
  const downstream = traverseDownstream(graph, selectedNodeId)
  const criticalPath = findCriticalPath(graph)
  const impactNodeIds = [...new Set([...upstream.nodeIds, ...downstream.nodeIds])]
  const impactEdgeIds = [...new Set([...upstream.edgeIds, ...downstream.edgeIds])]
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId)

  return {
    selectedNodeId,
    upstreamNodeIds: upstream.nodeIds,
    downstreamNodeIds: downstream.nodeIds,
    impactNodeIds,
    impactEdgeIds,
    criticalNodeIds: criticalPath.nodeIds,
    explanation: `${selectedNode?.label ?? selectedNodeId} touches ${impactNodeIds.length} node${
      impactNodeIds.length === 1 ? '' : 's'
    } across upstream dependencies and downstream impact.`,
  }
}
