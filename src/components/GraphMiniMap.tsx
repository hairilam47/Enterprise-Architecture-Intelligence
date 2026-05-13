import type { GraphFocusMode } from '../visualization/graphFocus'
import type { GraphPerformanceSummary } from '../visualization/graphPerformance'

type GraphMiniMapProps = {
  totalNodeCount: number
  visibleNodeCount: number
  edgeCount: number
  focusMode: GraphFocusMode
  activeFilters: string[]
  performance: GraphPerformanceSummary
}

export function GraphMiniMap({
  totalNodeCount,
  visibleNodeCount,
  edgeCount,
  focusMode,
  activeFilters,
  performance,
}: GraphMiniMapProps) {
  return (
    <aside className="graph-minimap panel" aria-label="Graph minimap">
      <div className="panel__header">
        <p className="eyebrow">Mini Map</p>
        <h2>Current graph scope</h2>
      </div>

      <dl className="summary-grid minimap-grid">
        <div>
          <dt>Total nodes</dt>
          <dd>{totalNodeCount}</dd>
        </div>
        <div>
          <dt>Visible</dt>
          <dd>{visibleNodeCount}</dd>
        </div>
        <div>
          <dt>Edges</dt>
          <dd>{edgeCount}</dd>
        </div>
      </dl>

      <div className="minimap-frame" aria-hidden="true">
        <span style={{ width: `${Math.max(12, (visibleNodeCount / Math.max(totalNodeCount, 1)) * 100)}%` }} />
      </div>

      <p className="comparison-summary">Focus: {focusMode.replaceAll('_', ' ')}</p>
      <p className="comparison-summary">Density: {performance.density.toFixed(3)}</p>
      {performance.warning ? <div className="layer-warning">{performance.warning}</div> : null}

      <div className="active-filter-list">
        {activeFilters.length ? activeFilters.map((filter) => <span key={filter}>{filter}</span>) : <span>No filters</span>}
      </div>
    </aside>
  )
}
