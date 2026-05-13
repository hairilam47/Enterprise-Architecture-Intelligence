import type { ArchitectureLayer, Workspace } from '../types/architecture'

type SwapPluginInput = {
  workspace: Workspace
  layer: ArchitectureLayer
  pluginId: string
}

export function swapPlugin({ workspace, layer, pluginId }: SwapPluginInput): Workspace {
  return {
    ...workspace,
    version: workspace.version + 1,
    updatedAt: new Date().toISOString(),
    layers: workspace.layers.map((workspaceLayer) =>
      workspaceLayer.layer === layer ? { ...workspaceLayer, pluginId } : workspaceLayer,
    ),
  }
}
