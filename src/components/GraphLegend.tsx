import { nodeTypeColors } from '../visualization/visualGraph'

export function GraphLegend() {
  return (
    <aside className="graph-legend panel" aria-label="Graph legend">
      <div className="panel__header">
        <p className="eyebrow">Legend</p>
        <h2>Visual meaning</h2>
      </div>

      <div className="legend-section">
        {Object.entries(nodeTypeColors).map(([type, color]) => (
          <span key={type}>
            <i style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>

      <ul className="legend-list">
        <li>
          <b className="legend-line" /> Edge shows enterprise relationship.
        </li>
        <li>
          <b className="legend-selected" /> Selected node.
        </li>
        <li>
          <b className="legend-hover" /> Hovered dependency.
        </li>
        <li>
          <b className="legend-warning" /> Validation warning.
        </li>
        <li>
          <b className="legend-bottleneck" /> Simulation bottleneck.
        </li>
      </ul>
    </aside>
  )
}
