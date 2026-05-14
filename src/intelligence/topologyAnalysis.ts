import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import { getDependencyCounts } from './dependencyAnalysis'
import type { ArchitectureSignal } from './intelligenceTypes'

function connectedComponents(graph: EnterpriseGraph) {
  const adjacency = new Map<string, Set<string>>()
  graph.nodes.forEach((node) => adjacency.set(node.id, new Set()))
  graph.edges.forEach((edge) => {
    adjacency.get(edge.sourceId)?.add(edge.targetId)
    adjacency.get(edge.targetId)?.add(edge.sourceId)
  })

  const visited = new Set<string>()
  const components: string[][] = []

  graph.nodes.forEach((node) => {
    if (visited.has(node.id)) return
    const queue = [node.id]
    const component: string[] = []
    visited.add(node.id)

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) break
      component.push(current)
      adjacency.get(current)?.forEach((next) => {
        if (!visited.has(next)) {
          visited.add(next)
          queue.push(next)
        }
      })
    }

    components.push(component)
  })

  return components
}

export function analyzeTopology(graph: EnterpriseGraph): ArchitectureSignal[] {
  const signals: ArchitectureSignal[] = []
  const counts = getDependencyCounts(graph)
  const isolated = counts.filter((item) => item.centrality === 0)
  const components = connectedComponents(graph)
  const relationshipByLayer = graph.edges.reduce<Record<string, number>>((accumulator, edge) => {
    const source = graph.nodes.find((node) => node.id === edge.sourceId)
    const layer = source?.layer ?? 'Unknown'
    accumulator[layer] = (accumulator[layer] ?? 0) + 1
    return accumulator
  }, {})
  const dominantLayer = Object.entries(relationshipByLayer).sort((left, right) => right[1] - left[1])[0]

  if (isolated.length > 0) {
    signals.push({
      id: 'topology:isolated-entities',
      severity: isolated.length >= 4 ? 'critical' : 'warning',
      category: 'topology',
      title: `${isolated.length} isolated enterprise entities detected`,
      description: 'These entities are not yet connected to architecture flows, so impact and traceability analysis will be incomplete.',
      relatedEntityIds: isolated.map((item) => item.node.id),
      suggestedAction: 'Connect isolated entities into architecture flows.',
    })
  }

  if (components.length > 1 && graph.edges.length > 0) {
    signals.push({
      id: 'topology:disconnected-subgraphs',
      severity: components.length >= 3 ? 'warning' : 'info',
      category: 'topology',
      title: `${components.length} disconnected topology groups`,
      description: 'The architecture currently has multiple disconnected dependency areas. This may be intentional, but it limits end-to-end impact visibility.',
      relatedEntityIds: components.flat(),
      suggestedAction: 'Review whether disconnected groups should be linked by dependencies, calls, or deployment relationships.',
    })
  }

  const orphanServices = counts.filter((item) => item.node.type === 'service' && item.incoming === 0)
  if (orphanServices.length > 0) {
    signals.push({
      id: 'topology:orphan-services',
      severity: 'warning',
      category: 'topology',
      title: `${orphanServices.length} service entities have no upstream business dependency`,
      description: 'Services without upstream requirements or APIs can become hard to justify, test, and govern.',
      relatedEntityIds: orphanServices.map((item) => item.node.id),
      suggestedAction: 'Connect services to upstream requirements, APIs, or operational flows.',
    })
  }

  if (dominantLayer && graph.edges.length >= 4 && dominantLayer[1] / graph.edges.length >= 0.72) {
    signals.push({
      id: 'topology:domain-concentration',
      severity: 'info',
      category: 'topology',
      title: `${dominantLayer[0]} contains ${Math.round((dominantLayer[1] / graph.edges.length) * 100)}% of architecture relationships`,
      description: 'Relationship concentration can be normal, but it is worth checking whether other domains are under-modeled.',
      suggestedAction: 'Review semantic zone distribution and add missing implementation, data, or operational relationships.',
    })
  }

  return signals
}
