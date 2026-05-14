import type { CompositionDebugSummary } from '../../composition/compositionDebug'
import type { CompositionValidationResult } from '../../composition/compositionValidation'

type CompositionDebugPanelProps = {
  summary: CompositionDebugSummary
  validation: CompositionValidationResult
}

export function CompositionDebugPanel({ summary, validation }: CompositionDebugPanelProps) {
  const validationItems = [...validation.errors, ...validation.warnings, ...validation.suggestions].slice(0, 8)

  return (
    <aside className="panel composition-debug-panel">
      <div className="panel__header">
        <p className="eyebrow">Debug</p>
        <h2>Canvas state</h2>
      </div>
      <dl className="metadata-grid">
        <div><dt>Canvas nodes</dt><dd>{summary.canvasNodeCount}</dd></div>
        <div><dt>Canvas edges</dt><dd>{summary.canvasEdgeCount}</dd></div>
        <div><dt>Groups</dt><dd>{summary.groupCount}</dd></div>
        <div><dt>Selected</dt><dd>{summary.selectedItem}</dd></div>
        <div><dt>Drag</dt><dd>{summary.activeDragState}</dd></div>
        <div><dt>Connection</dt><dd>{summary.activeConnectionState}</dd></div>
        <div><dt>Sync</dt><dd>{summary.syncStatus}</dd></div>
        <div><dt>Graph nodes</dt><dd>{summary.graphNodeCount}</dd></div>
        <div><dt>Graph edges</dt><dd>{summary.graphEdgeCount}</dd></div>
        <div><dt>Trace count</dt><dd>{summary.traceHighlightCount}</dd></div>
        <div><dt>Zoom</dt><dd>{Math.round(summary.zoomLevel * 100)}%</dd></div>
        <div><dt>Pan</dt><dd>{Math.round(summary.panOffset.x)}, {Math.round(summary.panOffset.y)}</dd></div>
        <div><dt>Hovered node</dt><dd>{summary.hoveredNodeId ?? 'None'}</dd></div>
        <div><dt>Hovered group</dt><dd>{summary.hoveredGroupId ?? 'None'}</dd></div>
        <div><dt>Snap</dt><dd>{summary.snapEnabled ? 'On' : 'Off'}</dd></div>
        <div><dt>Issues</dt><dd>{summary.validationIssueCount}</dd></div>
      </dl>

      <section>
        <h3>Validation Warnings</h3>
        {validationItems.length === 0 ? (
          <p className="empty-state">No composition validation warnings.</p>
        ) : (
          <ul className="issue-list compact-issues">
            {validationItems.map((item) => (
              <li key={item.id} data-severity={item.severity === 'error' ? 'critical' : 'warning'}>
                <span>{item.severity}</span>
                <strong>{item.message}</strong>
                {item.suggestion ? <p>{item.suggestion}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  )
}
