import { getPluginById } from '../plugins/pluginRegistry'
import type { ValidationIssue, ValidationResult, Workspace } from '../types/architecture'

export function validateWorkspace(workspace: Workspace): ValidationResult {
  const selectedPluginIds = new Set(workspace.layers.map((layer) => layer.pluginId))
  const selectedLayers = new Set(workspace.layers.map((layer) => layer.layer))

  const issues: ValidationIssue[] = workspace.layers.flatMap((workspaceLayer) => {
    const plugin = getPluginById(workspaceLayer.pluginId)

    if (!plugin) {
      return [
        {
          id: `${workspaceLayer.layer}-missing-plugin`,
          severity: 'critical',
          layer: workspaceLayer.layer,
          pluginId: workspaceLayer.pluginId,
          message: 'Selected plugin is not registered locally.',
        },
      ]
    }

    return plugin.compatibility.flatMap((rule, ruleIndex) => {
      const ruleIssues: ValidationIssue[] = []

      rule.requiresLayers?.forEach((requiredLayer) => {
        if (!selectedLayers.has(requiredLayer)) {
          ruleIssues.push({
            id: `${plugin.id}-${ruleIndex}-requires-${requiredLayer}`,
            severity: 'critical',
            layer: plugin.layer,
            pluginId: plugin.id,
            message: `${plugin.name} requires ${requiredLayer} layer coverage. ${rule.notes}`,
          })
        }
      })

      rule.incompatibleWith?.forEach((blockedPluginId) => {
        if (selectedPluginIds.has(blockedPluginId)) {
          const blockedPlugin = getPluginById(blockedPluginId)

          ruleIssues.push({
            id: `${plugin.id}-${ruleIndex}-blocks-${blockedPluginId}`,
            severity: 'warning',
            layer: plugin.layer,
            pluginId: plugin.id,
            message: `${plugin.name} has a compatibility warning with ${
              blockedPlugin?.name ?? blockedPluginId
            }. ${rule.notes}`,
          })
        }
      })

      if (rule.minThroughput && plugin.metrics.throughput < rule.minThroughput) {
        ruleIssues.push({
          id: `${plugin.id}-${ruleIndex}-throughput`,
          severity: 'warning',
          layer: plugin.layer,
          pluginId: plugin.id,
          message: `${plugin.name} throughput is below ${rule.minThroughput}/s. ${rule.notes}`,
        })
      }

      return ruleIssues
    })
  })

  return {
    isValid: !issues.some((issue) => issue.severity === 'critical'),
    issues,
    checkedAt: new Date().toISOString(),
  }
}
