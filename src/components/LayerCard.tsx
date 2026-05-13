import { getPluginById } from '../plugins/pluginRegistry'
import type { LayerSimulation, WorkspaceLayer } from '../types/architecture'
import { PluginSelector } from './PluginSelector'

type LayerCardProps = {
  workspaceLayer: WorkspaceLayer
  simulation?: LayerSimulation
  onSwap: (pluginId: string) => void
}

export function LayerCard({ workspaceLayer, simulation, onSwap }: LayerCardProps) {
  const plugin = getPluginById(workspaceLayer.pluginId)

  return (
    <article className="layer-card" style={{ borderTopColor: plugin?.visualConfig.accent }}>
      <div className="layer-card__header">
        <div>
          <p className="eyebrow">{workspaceLayer.layer}</p>
          <h2>{plugin?.name ?? 'Missing plugin'}</h2>
        </div>
        <span className="layer-card__icon" aria-hidden="true">
          {plugin?.visualConfig.icon.slice(0, 2).toUpperCase() ?? 'NA'}
        </span>
      </div>

      <p className="layer-card__category">{plugin?.category ?? 'Unregistered'}</p>

      <PluginSelector
        layer={workspaceLayer.layer}
        selectedPluginId={workspaceLayer.pluginId}
        onSwap={onSwap}
      />

      <dl className="metric-grid">
        <div>
          <dt>Latency</dt>
          <dd>{simulation?.latency ?? 0} ms</dd>
        </div>
        <div>
          <dt>Throughput</dt>
          <dd>{simulation?.throughput ?? 0}/s</dd>
        </div>
        <div>
          <dt>Success</dt>
          <dd>{(((simulation?.successRate ?? 0) * 100)).toFixed(1)}%</dd>
        </div>
      </dl>

      {simulation?.warnings.length ? (
        <div className="layer-warning" role="status">
          {simulation.warnings[0]}
        </div>
      ) : null}
    </article>
  )
}
