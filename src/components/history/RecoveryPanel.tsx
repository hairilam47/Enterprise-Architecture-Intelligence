import type { WorkspaceRecoveryStatus } from '../../workspace/workspaceRecovery'

type RecoveryPanelProps = {
  status: WorkspaceRecoveryStatus
  onRestoreLatestHealthy: () => void
  onExportRecoveryBundle: () => void
  onImportRecoveryBundle: () => void
}

export function RecoveryPanel({ status, onRestoreLatestHealthy, onExportRecoveryBundle, onImportRecoveryBundle }: RecoveryPanelProps) {
  return (
    <section className="panel recovery-panel">
      <p className="eyebrow">Recovery</p>
      <h2>{status.healthy ? 'History chain healthy' : 'Recovery attention needed'}</h2>
      {status.issues.length === 0 ? (
        <p className="empty-state">No recovery issues detected.</p>
      ) : (
        <ul className="workspace-save-list">
          {status.issues.map((issue) => (
            <li key={issue.id}>
              <div>
                <strong>{issue.type}</strong>
                <span>{issue.message}</span>
              </div>
              <span>{issue.severity}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="overlay-actions">
        <button type="button" disabled={!status.latestHealthySnapshotId} onClick={onRestoreLatestHealthy}>Restore latest healthy snapshot</button>
        <button type="button" onClick={onExportRecoveryBundle}>Export recovery bundle</button>
        <button type="button" onClick={onImportRecoveryBundle}>Import recovery bundle</button>
      </div>
    </section>
  )
}
