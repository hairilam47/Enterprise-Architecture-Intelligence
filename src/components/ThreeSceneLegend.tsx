import type { ThreePerformanceSummary } from '../three/threePerformance'

type ThreeSceneLegendProps = {
  performance: ThreePerformanceSummary
}

export function ThreeSceneLegend({ performance }: ThreeSceneLegendProps) {
  return (
    <aside className="panel three-scene-legend" aria-label="Three scene legend">
      <div className="panel__header">
        <p className="eyebrow">Scene Legend</p>
        <h2>Spatial meaning</h2>
      </div>
      <ul className="legend-list">
        <li><b className="legend-plane" /> Layer plane</li>
        <li><b className="legend-normal-node" /> Normal node</li>
        <li><b className="legend-selected" /> Selected node</li>
        <li><b className="legend-hover" /> Hovered dependency</li>
        <li><b className="legend-warning" /> Warning marker</li>
        <li><b className="legend-bottleneck" /> Bottleneck ring</li>
        <li><b className="legend-line" /> Dependency line</li>
      </ul>
      <div className="three-performance">
        <strong>{performance.spatialNodeCount} nodes</strong>
        <span>{performance.edgeCount} edges</span>
        <span>{performance.layerCount} layers</span>
      </div>
      {performance.densityWarning ? <div className="layer-warning">{performance.densityWarning}</div> : null}
      {performance.performanceWarning ? <div className="layer-warning">{performance.performanceWarning}</div> : null}
    </aside>
  )
}
