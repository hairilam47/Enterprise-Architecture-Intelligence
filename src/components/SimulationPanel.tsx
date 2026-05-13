import type { SimulationResult } from '../types/architecture'

type SimulationPanelProps = {
  simulation: SimulationResult
}

export function SimulationPanel({ simulation }: SimulationPanelProps) {
  return (
    <aside className="panel simulation-panel" aria-label="Simulation results">
      <div className="panel__header">
        <p className="eyebrow">Simulation Engine</p>
        <h2>Current run</h2>
      </div>

      <dl className="summary-grid">
        <div>
          <dt>Total latency</dt>
          <dd>{simulation.totalLatency} ms</dd>
        </div>
        <div>
          <dt>Success rate</dt>
          <dd>{(simulation.successRate * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Throughput</dt>
          <dd>{simulation.effectiveThroughput}/s</dd>
        </div>
      </dl>

      <section>
        <h3>Bottlenecks</h3>
        <ol className="compact-list">
          {simulation.bottlenecks.map((layer) => (
            <li key={layer.layer}>
              <span>{layer.layer}</span>
              <strong>{layer.pluginName}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h3>Layer breakdown</h3>
        <div className="breakdown-list">
          {simulation.layerBreakdown.map((layer) => (
            <div className="breakdown-row" key={layer.layer}>
              <span>{layer.layer}</span>
              <meter min="0" max="180" value={layer.latency} aria-label={`${layer.layer} latency`} />
              <strong>{layer.latency} ms</strong>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Explanation</h3>
        <ul className="explanation-list">
          {simulation.explanation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
