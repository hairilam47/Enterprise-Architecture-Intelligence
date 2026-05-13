import type { MissingLinkWarning } from '../../traceability/traceabilityTypes'

type MissingLinksPanelProps = {
  warnings: MissingLinkWarning[]
  onSelectWarning: (warning: MissingLinkWarning) => void
}

export function MissingLinksPanel({ warnings, onSelectWarning }: MissingLinksPanelProps) {
  return (
    <aside className="panel" aria-label="Missing links">
      <div className="panel__header"><p className="eyebrow">Missing Links</p><h2>{warnings.length} suggestions</h2></div>
      <ul className="issue-list">
        {warnings.slice(0, 8).map((warning) => (
          <li key={warning.id} data-severity={warning.severity === 'high' ? 'critical' : 'warning'}>
            <span>{warning.severity}</span>
            <strong>{warning.suggestedRelationship}</strong>
            <p>{warning.message}</p>
            <button type="button" onClick={() => onSelectWarning(warning)}>Highlight</button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
