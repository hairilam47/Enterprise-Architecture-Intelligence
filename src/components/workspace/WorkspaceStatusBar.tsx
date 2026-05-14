import type { WorkspaceDocument } from '../../workspace/workspaceDocument'
import type { WorkspaceRuntimeState, WorkspaceSaveState } from '../../services/workspaceSyncService'

type WorkspaceStatusBarProps = {
  document: WorkspaceDocument
  lastSavedAt?: string
  hasUnsavedChanges: boolean
  saveState?: WorkspaceSaveState
  runtime?: WorkspaceRuntimeState
  retryCount?: number
  isOnline?: boolean
  validationStatus: 'valid' | 'warnings' | 'errors'
  entityCount: number
  graphNodeCount: number
  canvasNodeCount: number
  canUndo?: boolean
  canRedo?: boolean
  undoDepth?: number
  redoDepth?: number
  snapshotCount?: number
  activeTransactionLabel?: string
  lastCommandLabel?: string
  activeCheckpointName?: string
  snapshotHealth?: 'healthy' | 'warning' | 'error'
  recoveryStatus?: string
  replayValidationState?: string
  restoreIntegrity?: string
  playbackModeState?: string
  replaySandboxStatus?: string
  divergenceWarning?: string
  replayPerformanceState?: string
  activeSessionCount?: number
  collaborationState?: string
  mergeQueueState?: string
  conflictWarningState?: string
  retentionStats?: string
  onToggleTimeline?: () => void
  onCreateCheckpoint?: () => void
  onExportHistory?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

export function WorkspaceStatusBar({
  document,
  lastSavedAt,
  hasUnsavedChanges,
  saveState = 'idle',
  runtime,
  retryCount = 0,
  isOnline = true,
  validationStatus,
  entityCount,
  graphNodeCount,
  canvasNodeCount,
  canUndo = false,
  canRedo = false,
  undoDepth = 0,
  redoDepth = 0,
  snapshotCount = 0,
  activeTransactionLabel,
  lastCommandLabel,
  activeCheckpointName,
  snapshotHealth = 'healthy',
  recoveryStatus = 'healthy',
  replayValidationState = 'valid',
  restoreIntegrity = 'verified',
  playbackModeState = 'idle',
  replaySandboxStatus = 'idle',
  divergenceWarning,
  replayPerformanceState = 'normal',
  activeSessionCount = 1,
  collaborationState = 'local',
  mergeQueueState = 'empty',
  conflictWarningState = 'none',
  retentionStats,
  onToggleTimeline,
  onCreateCheckpoint,
  onExportHistory,
  onUndo,
  onRedo,
}: WorkspaceStatusBarProps) {
  return (
    <section className="workspace-status-bar panel" aria-label="Workspace persistence status">
      <div>
        <p className="eyebrow">Workspace Document</p>
        <h2>{document.name}</h2>
      </div>
      <div className="workspace-status-grid">
        <span>Schema v{document.schemaVersion}</span>
        <span>Document v{document.version}</span>
        <span>{lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Not saved yet'}</span>
        <span className={hasUnsavedChanges ? 'is-dirty' : 'is-clean'}>{hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}</span>
        <span className={`save-status-badge save-status-badge--${saveState}`}>{saveState}</span>
        <span className={isOnline ? 'is-clean' : 'is-dirty'}>{isOnline ? 'Online' : 'Offline'}</span>
        {retryCount > 0 ? <span className="is-dirty">Retry {retryCount}</span> : null}
        <span>{validationStatus}</span>
        <span>{entityCount} entities</span>
        <span>{graphNodeCount} graph nodes</span>
        <span>{canvasNodeCount} canvas nodes</span>
        <span>{undoDepth} undo / {redoDepth} redo</span>
        <span>{snapshotCount} snapshots</span>
        <span>{activeTransactionLabel ? `Transaction: ${activeTransactionLabel}` : 'No active transaction'}</span>
        <span>{activeCheckpointName ? `Checkpoint: ${activeCheckpointName}` : 'No checkpoint'}</span>
        <span>Snapshots {snapshotHealth}</span>
        <span>Recovery {recoveryStatus}</span>
        <span>Replay {replayValidationState}</span>
        <span>Restore {restoreIntegrity}</span>
        <span>Playback {playbackModeState}</span>
        <span>Sandbox {replaySandboxStatus}</span>
        <span>Replay performance {replayPerformanceState}</span>
        <span>{activeSessionCount} sessions</span>
        <span>Collab {collaborationState}</span>
        <span>Merge {mergeQueueState}</span>
        <span>Conflicts {conflictWarningState}</span>
        {divergenceWarning ? <span className="is-dirty">{divergenceWarning}</span> : null}
        {retentionStats ? <span>{retentionStats}</span> : null}
        {lastCommandLabel ? <span>Last: {lastCommandLabel}</span> : null}
        {runtime?.lastModifiedAt ? <span>Modified {new Date(runtime.lastModifiedAt).toLocaleTimeString()}</span> : null}
      </div>
      <div className="overlay-actions workspace-history-actions">
        <button type="button" disabled={!canUndo} onClick={onUndo}>Undo</button>
        <button type="button" disabled={!canRedo} onClick={onRedo}>Redo</button>
        <button type="button" onClick={onToggleTimeline}>Timeline</button>
        <button type="button" onClick={onCreateCheckpoint}>Checkpoint</button>
        <button type="button" onClick={onExportHistory}>Export history</button>
      </div>
      {!isOnline ? <p className="workspace-sync-warning">Offline mode is active. Changes are queued and will retry after reconnect.</p> : null}
      {runtime?.saveError ? <p className="workspace-sync-warning">Autosave retry queued: {runtime.saveError}</p> : null}
    </section>
  )
}
