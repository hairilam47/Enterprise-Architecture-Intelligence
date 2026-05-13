import { traverseDownstream, traverseUpstream } from '../graph/traverseGraph'
import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import type { TraceImpactAnalysis, TraceRiskLevel } from './traceabilityTypes'
import { nodeMap } from './traceUtils'

function riskFor(impactCount: number, incidentCount: number, criticalCount: number): TraceRiskLevel {
  if (incidentCount > 0 || criticalCount > 1 || impactCount > 8) return 'high'
  if (criticalCount > 0 || impactCount > 4) return 'medium'
  return 'low'
}

export function analyzeTraceImpact(graph: EnterpriseGraph, selectedNodeId?: string): TraceImpactAnalysis {
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0]
  const nodes = nodeMap(graph)
  const upstream = traverseUpstream(graph, selectedNode.id).nodeIds
    .filter((id) => id !== selectedNode.id)
    .map((id) => nodes.get(id))
    .filter(Boolean)
  const downstream = traverseDownstream(graph, selectedNode.id).nodeIds
    .filter((id) => id !== selectedNode.id)
    .map((id) => nodes.get(id))
    .filter(Boolean)
  const affectedEntities = [...new Map([...upstream, ...downstream].map((node) => [node!.id, node!])).values()]
  const relatedIncidents = affectedEntities.filter((node) => node.type === 'incident')
  const relatedInfrastructure = affectedEntities.filter((node) => node.type === 'infrastructure')
  const relatedApis = affectedEntities.filter((node) => node.type === 'api' || node.type === 'service')
  const relatedTests = affectedEntities.filter((node) => node.type === 'testcase')
  const criticalCount = affectedEntities.filter((node) => node.status === 'critical' || node.status === 'warning').length

  return {
    selectedNode,
    upstream: upstream as TraceImpactAnalysis['upstream'],
    downstream: downstream as TraceImpactAnalysis['downstream'],
    affectedEntities,
    relatedIncidents,
    relatedInfrastructure,
    relatedApis,
    relatedTests,
    riskLevel: riskFor(affectedEntities.length, relatedIncidents.length, criticalCount),
    impactCount: affectedEntities.length,
  }
}
