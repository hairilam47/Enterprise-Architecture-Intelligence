import { getPluginById } from '../plugins/pluginRegistry'
import type { LayerSimulation, SimulationResult, Workspace } from '../types/architecture'

const SUCCESS_RATE_FLOOR = 0.5

export function simulateWorkspace(workspace: Workspace): SimulationResult {
  const selectedPluginIds = new Set(workspace.layers.map((layer) => layer.pluginId))

  const layerBreakdown: LayerSimulation[] = workspace.layers.map((workspaceLayer) => {
    const plugin = getPluginById(workspaceLayer.pluginId)

    if (!plugin) {
      return {
        layer: workspaceLayer.layer,
        pluginId: workspaceLayer.pluginId,
        pluginName: 'Missing plugin',
        latency: 0,
        throughput: 0,
        successRate: SUCCESS_RATE_FLOOR,
        bottleneckScore: 100,
        warnings: ['Selected plugin could not be found in the local registry.'],
      }
    }

    const warnings = plugin.compatibility.flatMap((rule) => {
      const ruleWarnings: string[] = []

      rule.requiresLayers?.forEach((requiredLayer) => {
        const hasRequiredLayer = workspace.layers.some((layer) => layer.layer === requiredLayer)
        if (!hasRequiredLayer) {
          ruleWarnings.push(`Requires ${requiredLayer} layer coverage. ${rule.notes}`)
        }
      })

      rule.incompatibleWith?.forEach((blockedPluginId) => {
        if (selectedPluginIds.has(blockedPluginId)) {
          ruleWarnings.push(`Compatibility warning: ${rule.notes}`)
        }
      })

      if (rule.minThroughput && plugin.metrics.throughput < rule.minThroughput) {
        ruleWarnings.push(`Throughput below ${rule.minThroughput}. ${rule.notes}`)
      }

      return ruleWarnings
    })

    const bottleneckScore =
      plugin.metrics.latency / 2 +
      Math.max(0, 1000 - plugin.metrics.throughput) / 20 +
      Math.max(0, 0.985 - plugin.metrics.successRate) * 1000

    return {
      layer: plugin.layer,
      pluginId: plugin.id,
      pluginName: plugin.name,
      latency: plugin.metrics.latency,
      throughput: plugin.metrics.throughput,
      successRate: plugin.metrics.successRate,
      bottleneckScore,
      warnings,
    }
  })

  const totalLatency = layerBreakdown.reduce((sum, layer) => sum + layer.latency, 0)
  const successRate = layerBreakdown.reduce((rate, layer) => rate * layer.successRate, 1)
  const effectiveThroughput = Math.min(...layerBreakdown.map((layer) => layer.throughput))
  const bottlenecks = [...layerBreakdown]
    .sort((first, second) => second.bottleneckScore - first.bottleneckScore)
    .slice(0, 3)
  const warnings = layerBreakdown.flatMap((layer) => layer.warnings)
  const slowestLayer = [...layerBreakdown].sort((first, second) => second.latency - first.latency)[0]
  const throughputLayer = [...layerBreakdown].sort((first, second) => first.throughput - second.throughput)[0]
  const weakestReliabilityLayer = [...layerBreakdown].sort(
    (first, second) => first.successRate - second.successRate,
  )[0]
  const explanation = [
    `Total latency is the sum of all selected layer latencies: ${totalLatency} ms.`,
    `Overall success rate multiplies each layer success rate, producing ${(successRate * 100).toFixed(
      1,
    )}%.`,
    `${throughputLayer.layer} limits effective throughput at ${throughputLayer.throughput}/s.`,
    `${slowestLayer.layer} contributes the highest single latency at ${slowestLayer.latency} ms.`,
    `${weakestReliabilityLayer.layer} has the lowest layer success rate at ${(
      weakestReliabilityLayer.successRate * 100
    ).toFixed(1)}%.`,
  ]

  return {
    totalLatency,
    successRate,
    effectiveThroughput,
    bottlenecks,
    layerBreakdown,
    warnings,
    explanation,
    simulatedAt: new Date().toISOString(),
  }
}
