import type { SpatialScene } from './sceneTypes'

export type ThreePerformanceSummary = {
  spatialNodeCount: number
  edgeCount: number
  layerCount: number
  shouldHideLabels: boolean
  densityWarning?: string
  performanceWarning?: string
}

export function getThreePerformanceSummary(scene: SpatialScene): ThreePerformanceSummary {
  const spatialNodeCount = scene.nodes.length
  const edgeCount = scene.edges.length
  const layerCount = scene.layers.length
  const density = spatialNodeCount <= 1 ? 0 : edgeCount / (spatialNodeCount * (spatialNodeCount - 1))

  return {
    spatialNodeCount,
    edgeCount,
    layerCount,
    shouldHideLabels: spatialNodeCount > 30 || density > 0.16,
    densityWarning: density > 0.22 ? 'Spatial density is high. Use layer focus or topology view.' : undefined,
    performanceWarning:
      spatialNodeCount > 80
        ? 'Large spatial scene detected. Hide labels and narrow the layer focus before analysis.'
        : undefined,
  }
}
