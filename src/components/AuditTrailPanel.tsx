import type { AuditEvent } from '../types/audit'

type AuditTrailPanelProps = {
  events: AuditEvent[]
}

export function AuditTrailPanel({ events }: AuditTrailPanelProps) {
  return (
    <aside className="panel audit-panel" aria-label="Audit trail">
      <div className="panel__header">
        <p className="eyebrow">Audit Trail</p>
        <h2>System records</h2>
      </div>

      <ol className="timeline-list">
        {events.slice(0, 8).map((event) => (
          <li key={event.id}>
            <span>{new Date(event.createdAt).toLocaleTimeString()}</span>
            <strong>{event.action}</strong>
            <small>v{event.metadata.workspaceVersion}</small>
          </li>
        ))}
      </ol>
    </aside>
  )
}
