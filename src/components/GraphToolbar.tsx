import { architectureLayers } from '../types/architecture'
import type { GraphFocusMode } from '../visualization/graphFocus'

type GraphToolbarProps = {
  focusMode: GraphFocusMode
  layerFilter: string
  showLabels: boolean
  showWarnings: boolean
  showBottlenecks: boolean
  onFocusModeChange: (mode: GraphFocusMode) => void
  onLayerFilterChange: (layer: string) => void
  onShowLabelsChange: (show: boolean) => void
  onShowWarningsChange: (show: boolean) => void
  onShowBottlenecksChange: (show: boolean) => void
  onResetView: () => void
}

const focusModes: GraphFocusMode[] = [
  'full_graph',
  'selected_neighborhood',
  'impact_path',
  'critical_path',
  'bottlenecks_only',
  'warnings_only',
  'layer_view',
]

export function GraphToolbar({
  focusMode,
  layerFilter,
  showLabels,
  showWarnings,
  showBottlenecks,
  onFocusModeChange,
  onLayerFilterChange,
  onShowLabelsChange,
  onShowWarningsChange,
  onShowBottlenecksChange,
  onResetView,
}: GraphToolbarProps) {
  return (
    <div className="graph-toolbar" aria-label="Graph toolbar">
      <label>
        <span>Focus</span>
        <select value={focusMode} onChange={(event) => onFocusModeChange(event.target.value as GraphFocusMode)}>
          {focusModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Layer</span>
        <select value={layerFilter} onChange={(event) => onLayerFilterChange(event.target.value)}>
          <option value="">All layers</option>
          {architectureLayers.map((layer) => (
            <option key={layer} value={layer}>
              {layer}
            </option>
          ))}
        </select>
      </label>

      <label className="toolbar-check">
        <input
          type="checkbox"
          checked={showLabels}
          onChange={(event) => onShowLabelsChange(event.target.checked)}
        />
        Labels
      </label>
      <label className="toolbar-check">
        <input
          type="checkbox"
          checked={showWarnings}
          onChange={(event) => onShowWarningsChange(event.target.checked)}
        />
        Warnings
      </label>
      <label className="toolbar-check">
        <input
          type="checkbox"
          checked={showBottlenecks}
          onChange={(event) => onShowBottlenecksChange(event.target.checked)}
        />
        Bottlenecks
      </label>

      <button type="button" onClick={onResetView}>
        Reset view
      </button>
    </div>
  )
}
