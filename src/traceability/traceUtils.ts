import type { EnterpriseGraph, EnterpriseNodeType } from '../graph/enterpriseGraph'
import type { TraceDomain } from './traceabilityTypes'

export const traceDomains: TraceDomain[] = ['Requirements', 'APIs', 'Data', 'Tests', 'Infrastructure', 'Incidents']

export function domainForType(type: EnterpriseNodeType): TraceDomain | undefined {
  if (type === 'requirement') return 'Requirements'
  if (type === 'api' || type === 'service') return 'APIs'
  if (type === 'database') return 'Data'
  if (type === 'testcase') return 'Tests'
  if (type === 'infrastructure') return 'Infrastructure'
  if (type === 'incident') return 'Incidents'
}

export function nodesByDomain(graph: EnterpriseGraph, domain: TraceDomain) {
  return graph.nodes.filter((node) => domainForType(node.type) === domain)
}

export function nodeMap(graph: EnterpriseGraph) {
  return new Map(graph.nodes.map((node) => [node.id, node]))
}
