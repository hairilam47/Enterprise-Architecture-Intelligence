import type { WorkspaceComparison, WorkspaceHistoryEntry } from '../types/architecture'

type ComparisonModeProps = {
  comparison: WorkspaceComparison
  history: WorkspaceHistoryEntry[]
  onCopyWorkspace: () => void
}

function formatDelta(value: number, suffix = '') {
  if (value === 0) {
    return `0${suffix}`
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(suffix === '%' ? 2 : 0)}${suffix}`
}

export function ComparisonMode({ comparison, history, onCopyWorkspace }: ComparisonModeProps) {
  return (
    <section className="comparison-panel panel" aria-label="What-if comparison mode">
      <div className="comparison-panel__header">
        <div>
          <p className="eyebrow">What-if Mode</p>
          <h2>Current vs copied workspace</h2>
        </div>
        <button type="button" onClick={onCopyWorkspace}>
          Copy current
        </button>
      </div>

      <dl className="summary-grid">
        <div>
          <dt>Latency delta</dt>
          <dd>{formatDelta(comparison.latencyDelta, ' ms')}</dd>
        </div>
        <div>
          <dt>Success delta</dt>
          <dd>{formatDelta(comparison.successRateDelta * 100, '%')}</dd>
        </div>
        <div>
          <dt>Throughput delta</dt>
          <dd>{formatDelta(comparison.throughputDelta, '/s')}</dd>
        </div>
      </dl>

      <p className="comparison-summary">{comparison.summary}</p>

      <div className="comparison-grid">
        <div>
          <h3>Changed layers</h3>
          {comparison.changedLayers.length === 0 ? (
            <p className="empty-state">Copy the current workspace, then swap plugins to compare.</p>
          ) : (
            <ul className="compact-list">
              {comparison.changedLayers.map((change) => (
                <li key={change.layer}>
                  <span>{change.layer}</span>
                  <strong>
                    {change.basePluginName} to {change.candidatePluginName}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3>Version history</h3>
          <ol className="timeline-list compact">
            {history.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <span>{entry.label}</span>
                <strong>{new Date(entry.createdAt).toLocaleTimeString()}</strong>
                <small>{entry.workspace.layers.length} layers</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
