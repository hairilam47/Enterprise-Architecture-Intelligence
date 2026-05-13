import { getPluginById } from '../plugins/pluginRegistry'
import { simulateWorkspace } from '../simulation/simulateWorkspace'
import type { Workspace, WorkspaceComparison } from '../types/architecture'

export function compareWorkspaces(
  baseWorkspace: Workspace,
  candidateWorkspace: Workspace,
): WorkspaceComparison {
  const baseSimulation = simulateWorkspace(baseWorkspace)
  const candidateSimulation = simulateWorkspace(candidateWorkspace)

  const changedLayers = candidateWorkspace.layers.flatMap((candidateLayer) => {
    const baseLayer = baseWorkspace.layers.find((layer) => layer.layer === candidateLayer.layer)

    if (!baseLayer || baseLayer.pluginId === candidateLayer.pluginId) {
      return []
    }

    return [
      {
        layer: candidateLayer.layer,
        basePluginName: getPluginById(baseLayer.pluginId)?.name ?? baseLayer.pluginId,
        candidatePluginName: getPluginById(candidateLayer.pluginId)?.name ?? candidateLayer.pluginId,
      },
    ]
  })

  const latencyDelta = candidateSimulation.totalLatency - baseSimulation.totalLatency
  const successRateDelta = candidateSimulation.successRate - baseSimulation.successRate
  const throughputDelta = candidateSimulation.effectiveThroughput - baseSimulation.effectiveThroughput

  return {
    baseWorkspaceId: baseWorkspace.id,
    candidateWorkspaceId: candidateWorkspace.id,
    latencyDelta,
    successRateDelta,
    throughputDelta,
    changedLayers,
    summary:
      changedLayers.length > 0
        ? `${changedLayers.length} layer change${changedLayers.length === 1 ? '' : 's'} compared.`
        : 'No plugin differences between current and copied workspace.',
  }
}
