import type { EnterpriseGraph, EnterpriseNode } from '../graph/enterpriseGraph'
import type { MissingLinkWarning } from './traceabilityTypes'

function hasOutgoingTo(graph: EnterpriseGraph, node: EnterpriseNode, targetTypes: EnterpriseNode['type'][]) {
  return graph.edges.some((edge) => {
    const target = graph.nodes.find((item) => item.id === edge.targetId)
    return edge.sourceId === node.id && Boolean(target && targetTypes.includes(target.type))
  })
}

function hasIncoming(graph: EnterpriseGraph, node: EnterpriseNode) {
  return graph.edges.some((edge) => edge.targetId === node.id)
}

export function detectMissingLinks(graph: EnterpriseGraph): MissingLinkWarning[] {
  return graph.nodes.flatMap((node) => {
    const warnings: MissingLinkWarning[] = []

    if (node.type === 'requirement' && !hasOutgoingTo(graph, node, ['testcase'])) {
      warnings.push({ id: `${node.id}:missing-test`, nodeId: node.id, severity: 'medium', message: `${node.label} has no validating test case.`, suggestedRelationship: 'validated_by' })
    }
    if (node.type === 'requirement' && !hasOutgoingTo(graph, node, ['api', 'service'])) {
      warnings.push({ id: `${node.id}:missing-api`, nodeId: node.id, severity: 'medium', message: `${node.label} has no API/service implementation link.`, suggestedRelationship: 'depends_on' })
    }
    if (node.type === 'api' && !hasIncoming(graph, node)) {
      warnings.push({ id: `${node.id}:missing-service`, nodeId: node.id, severity: 'low', message: `${node.label} has no owning service relationship.`, suggestedRelationship: 'calls' })
    }
    if (node.type === 'database' && !hasIncoming(graph, node)) {
      warnings.push({ id: `${node.id}:missing-api`, nodeId: node.id, severity: 'medium', message: `${node.label} has no API relationship.`, suggestedRelationship: 'stores' })
    }
    if (node.type === 'incident' && !hasIncoming(graph, node)) {
      warnings.push({ id: `${node.id}:missing-root-cause`, nodeId: node.id, severity: 'high', message: `${node.label} has no root-cause relationship.`, suggestedRelationship: 'causes' })
    }
    if (node.type === 'service' && !hasOutgoingTo(graph, node, ['infrastructure'])) {
      warnings.push({ id: `${node.id}:missing-infra`, nodeId: node.id, severity: 'medium', message: `${node.label} has no infrastructure deployment link.`, suggestedRelationship: 'deployed_on' })
    }

    return warnings
  })
}
