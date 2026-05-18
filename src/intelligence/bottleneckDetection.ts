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

// Threshold above which a layer's cross-layer fan-in ratio is flagged
const LAYER_LOAD_WARNING_THRESHOLD = 0.55
const LAYER_LOAD_CRITICAL_THRESHOLD = 0.80

export function analyzeLayerLoad(graph: EnterpriseGraph): ArchitectureSignal[] {
  if (graph.nodes.length === 0) return []

  // Group nodes by layer
  const layerNodes = new Map<string, string[]>()
  for (const node of graph.nodes) {
    const layer = node.layer ?? 'unknown'
    const existing = layerNodes.get(layer) ?? []
    existing.push(node.id)
    layerNodes.set(layer, existing)
  }

  if (layerNodes.size < 2) return []

  const nodeLayer = new Map<string, string>()
  for (const node of graph.nodes) {
    nodeLayer.set(node.id, node.layer ?? 'unknown')
  }

  // Count cross-layer incoming edges per layer
  const crossLayerFanIn = new Map<string, number>()
  for (const layer of layerNodes.keys()) {
    crossLayerFanIn.set(layer, 0)
  }

  for (const edge of graph.edges) {
    const sourceLayer = nodeLayer.get(edge.sourceId)
    const targetLayer = nodeLayer.get(edge.targetId)
    if (sourceLayer && targetLayer && sourceLayer !== targetLayer) {
      crossLayerFanIn.set(targetLayer, (crossLayerFanIn.get(targetLayer) ?? 0) + 1)
    }
  }

  const signals: ArchitectureSignal[] = []

  for (const [layer, nodeIds] of layerNodes) {
    const fanIn = crossLayerFanIn.get(layer) ?? 0
    const nodeCount = nodeIds.length
    // Load ratio: cross-layer dependencies per node in the layer
    const loadRatio = nodeCount > 0 ? fanIn / nodeCount : 0

    if (loadRatio >= LAYER_LOAD_CRITICAL_THRESHOLD) {
      signals.push({
        id: `dependency:layer-load:${layer}`,
        severity: 'critical',
        category: 'dependency',
        title: `${layer} layer is under high cross-layer load`,
        description: `The ${layer} layer receives ${fanIn} cross-layer dependencies across ${nodeCount} node${nodeCount !== 1 ? 's' : ''} (load ratio ${loadRatio.toFixed(2)}). This level of concentration creates a high blast radius if the layer degrades.`,
        relatedEntityIds: nodeIds,
        suggestedAction: `Consider distributing responsibilities within the ${layer} layer or introducing an abstraction layer to reduce cross-layer coupling.`,
      })
    } else if (loadRatio >= LAYER_LOAD_WARNING_THRESHOLD) {
      signals.push({
        id: `dependency:layer-load:${layer}`,
        severity: 'warning',
        category: 'dependency',
        title: `${layer} layer has elevated cross-layer load`,
        description: `The ${layer} layer receives ${fanIn} cross-layer dependencies across ${nodeCount} node${nodeCount !== 1 ? 's' : ''} (load ratio ${loadRatio.toFixed(2)}). Monitor for growing coupling.`,
        relatedEntityIds: nodeIds,
        suggestedAction: `Review inter-layer dependency patterns feeding into the ${layer} layer.`,
      })
    }
  }

  return signals
}
