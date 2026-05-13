import type { VisualGraph } from './visualGraph'

export type GraphPerformanceSummary = {
  nodeCount: number
  edgeCount: number
  density: number
  shouldHideLabels: boolean
  warning?: string
}

export function calculateGraphDensity(nodeCount: number, edgeCount: number) {
  if (nodeCount <= 1) {
    return 0
  }

  return edgeCount / (nodeCount * (nodeCount - 1))
}

export function getGraphPerformanceSummary(
  visualGraph: VisualGraph,
  maxVisibleNodes = 75,
): GraphPerformanceSummary {
  const nodeCount = visualGraph.nodes.length
  const edgeCount = visualGraph.edges.length
  const density = calculateGraphDensity(nodeCount, edgeCount)
  const shouldHideLabels = nodeCount > 35 || density > 0.18
  const warning =
    nodeCount > maxVisibleNodes
      ? `Visible graph has ${nodeCount} nodes. Use search, focus modes, or filters before analysis.`
      : density > 0.25
        ? 'Graph density is high. Focus modes will improve readability.'
        : undefined

  return {
    nodeCount,
    edgeCount,
    density,
    shouldHideLabels,
    warning,
  }
}
