import { useState } from 'react'
import { importWorkspaceRecoveryBundle, type WorkspaceRecoveryBundle } from '../../workspace/workspaceRecoveryImport'

type RecoveryImportDialogProps = {
  open: boolean
  onImport: (bundle: WorkspaceRecoveryBundle, warnings: string[]) => void
  onCancel: () => void
}

export function RecoveryImportDialog({ open, onImport, onCancel }: RecoveryImportDialogProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [bundle, setBundle] = useState<WorkspaceRecoveryBundle | undefined>()

  if (!open) return null

  return (
    <div className="history-dialog" role="dialog" aria-modal="true" aria-label="Import recovery bundle">
      <div className="panel">
        <p className="eyebrow">Recovery Import</p>
        <h2>Validate recovery bundle</h2>
        <input
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const result = importWorkspaceRecoveryBundle(await file.text())
            setErrors(result.errors)
            setWarnings(result.warnings)
            setBundle(result.bundle)
          }}
        />
        {errors.length > 0 ? <p className="workspace-sync-warning">{errors.join(' ')}</p> : null}
        {warnings.length > 0 ? <p className="workspace-sync-warning">{warnings.join(' ')}</p> : null}
        {bundle ? (
          <div className="workspace-status-grid">
            <span>{bundle.snapshots.length} snapshots</span>
            <span>{bundle.commands.length} commands</span>
            <span>{bundle.checkpoints.length} checkpoints</span>
          </div>
        ) : null}
        <div className="overlay-actions">
          <button type="button" disabled={!bundle} onClick={() => bundle ? onImport(bundle, warnings) : undefined}>Import safely</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
