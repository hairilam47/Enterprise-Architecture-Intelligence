import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import { detectMissingLinks } from '../traceability/detectMissingLinks'
import type { ArchitectureSignal } from './intelligenceTypes'

export function analyzeTraceabilityHealth(graph: EnterpriseGraph): ArchitectureSignal[] {
  const signals: ArchitectureSignal[] = []
  const missingLinks = detectMissingLinks(graph)
  const unconnectedRequirements = graph.nodes.filter(
    (node) => node.type === 'requirement' && !graph.edges.some((edge) => edge.sourceId === node.id || edge.targetId === node.id),
  )
  const unownedEntities = graph.nodes.filter((node) => !node.owner || node.owner === 'Unassigned')

  if (missingLinks.length > 0) {
    signals.push({
      id: 'traceability:missing-links',
      severity: missingLinks.some((warning) => warning.severity === 'high') ? 'critical' : 'warning',
      category: 'traceability',
      title: `${missingLinks.length} missing traceability relationships`,
      description: 'Some requirements, APIs, data entities, services, incidents, or tests are missing expected lineage relationships.',
      relatedEntityIds: missingLinks.map((warning) => warning.nodeId),
      suggestedAction: 'Review missing relationships and add lineage where it reflects the real architecture.',
    })
  }

  if (unconnectedRequirements.length > 0) {
    signals.push({
      id: 'traceability:unconnected-requirements',
      severity: 'warning',
      category: 'traceability',
      title: `${unconnectedRequirements.length} requirements are not connected to implementation entities`,
      description: 'Requirements without implementation links cannot explain downstream architecture impact.',
      relatedEntityIds: unconnectedRequirements.map((node) => node.id),
      suggestedAction: 'Connect requirements to APIs, services, tests, or data entities.',
    })
  }

  if (unownedEntities.length > 0) {
    signals.push({
      id: 'governance:unowned-entities',
      severity: unownedEntities.length >= 5 ? 'warning' : 'info',
      category: 'governance',
      title: `${unownedEntities.length} enterprise entities have no explicit owner`,
      description: 'Ownership improves review, accountability, and future collaboration readiness.',
      relatedEntityIds: unownedEntities.map((node) => node.id),
      suggestedAction: 'Assign owner teams to entities that need accountability.',
    })
  }

  return signals
}
