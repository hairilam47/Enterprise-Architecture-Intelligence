import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import { analyzeDependencyConcentration } from './dependencyAnalysis'
import type { ArchitectureSignal } from './intelligenceTypes'

export function detectBottlenecks(graph: EnterpriseGraph): ArchitectureSignal[] {
  return analyzeDependencyConcentration(graph)
    .filter((point) => point.severity !== 'info')
    .slice(0, 5)
    .map((point) => ({
      id: `dependency:bottleneck:${point.entityId}`,
      severity: point.severity,
      category: 'dependency',
      title: `${point.label} is a dependency concentration point`,
      description: `${point.label} has ${point.incoming} incoming and ${point.outgoing} outgoing architecture flows. Concentrated dependency paths can increase blast radius.`,
      relatedEntityIds: [point.entityId],
      suggestedAction: `Review dependency concentration around ${point.label}.`,
    }))
}
