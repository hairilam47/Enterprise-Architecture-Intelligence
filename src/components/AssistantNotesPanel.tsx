import type { SimulationResult } from '../types/architecture'

type AssistantNotesPanelProps = {
  simulation: SimulationResult
}

export function AssistantNotesPanel({ simulation }: AssistantNotesPanelProps) {
  const topBottleneck = simulation.bottlenecks[0]

  return (
    <aside className="panel assistant-panel" aria-label="AI assistant notes">
      <div className="panel__header">
        <p className="eyebrow">AI Assistance</p>
        <h2>Notes only</h2>
      </div>

      <div className="assistant-rule">
        Assist, warn, highlight, suggest, and sketch. Never decide or approve for the user.
      </div>

      <ul className="assistant-notes">
        <li>
          Highlight: {topBottleneck.layer} is the current bottleneck through {topBottleneck.pluginName}.
        </li>
        <li>
          Suggestion: compare a lower-latency option before committing any architecture decision.
        </li>
        <li>
          Warning: {simulation.warnings.length || 'no'} compatibility note
          {simulation.warnings.length === 1 ? '' : 's'} detected in this local run.
        </li>
      </ul>
    </aside>
  )
}
