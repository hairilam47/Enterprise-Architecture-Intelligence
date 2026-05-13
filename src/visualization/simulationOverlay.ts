import type { SimulationResult, ValidationResult } from '../types/architecture'
import type { VisualGraph, VisualOverlay } from './visualGraph'

export function applySimulationOverlay(
  visualGraph: VisualGraph,
  simulation: SimulationResult,
  validation: ValidationResult,
): VisualGraph {
  const bottleneckNodeIds = simulation.bottlenecks.map((layer) => `visual:plugin:${layer.pluginId}`)
  const warningNodeIds = validation.issues.map((issue) => `visual:plugin:${issue.pluginId}`)
  const overlays: VisualOverlay[] = [
    {
      id: 'overlay:bottlenecks',
      kind: 'bottleneck',
      nodeIds: bottleneckNodeIds,
      edgeIds: [],
      label: 'Simulation bottlenecks',
    },
    {
      id: 'overlay:warnings',
      kind: 'warning',
      nodeIds: warningNodeIds,
      edgeIds: [],
      label: 'Validation warnings',
    },
  ]

  return {
    ...visualGraph,
    overlays,
  }
}
