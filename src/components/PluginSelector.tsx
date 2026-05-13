import { getPluginsByLayer } from '../plugins/pluginRegistry'
import type { ArchitectureLayer } from '../types/architecture'

type PluginSelectorProps = {
  layer: ArchitectureLayer
  selectedPluginId: string
  onSwap: (pluginId: string) => void
}

export function PluginSelector({ layer, selectedPluginId, onSwap }: PluginSelectorProps) {
  const layerPlugins = getPluginsByLayer(layer)

  return (
    <label className="plugin-selector">
      <span>Plugin</span>
      <select value={selectedPluginId} onChange={(event) => onSwap(event.target.value)}>
        {layerPlugins.map((plugin) => (
          <option key={plugin.id} value={plugin.id}>
            {plugin.name}
          </option>
        ))}
      </select>
    </label>
  )
}
