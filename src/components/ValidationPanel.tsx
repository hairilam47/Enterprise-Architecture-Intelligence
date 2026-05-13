import type { ValidationResult } from '../types/architecture'

type ValidationPanelProps = {
  validation: ValidationResult
}

export function ValidationPanel({ validation }: ValidationPanelProps) {
  return (
    <aside className="panel validation-panel" aria-label="Validation warnings">
      <div className="panel__header">
        <p className="eyebrow">Validation Engine</p>
        <h2>{validation.isValid ? 'No blockers' : 'Needs attention'}</h2>
      </div>

      {validation.issues.length === 0 ? (
        <p className="empty-state">No compatibility warnings in the current workspace.</p>
      ) : (
        <ul className="issue-list">
          {validation.issues.map((issue) => (
            <li key={issue.id} data-severity={issue.severity}>
              <span>{issue.severity}</span>
              <strong>{issue.layer}</strong>
              <p>{issue.message}</p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
