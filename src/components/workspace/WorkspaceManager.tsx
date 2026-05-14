import { useEffect, useState } from 'react'
import type { SavedWorkspaceSummary } from '../../services/workspaceApiTypes'
import type { WorkspaceDocument } from '../../workspace/workspaceDocument'
import { ExportImportPanel } from './ExportImportPanel'
import { useWorkspaceService, type WorkspaceRepositoryMode } from './WorkspaceServiceProvider'

type WorkspaceManagerProps = {
  document: WorkspaceDocument
  savedWorkspaces: SavedWorkspaceSummary[]
  onRenameWorkspace: (name: string) => void
  onSaveWorkspace: () => void
  onLoadWorkspace: (workspaceId: string) => void
  onDuplicateWorkspace: (workspaceId: string) => void
  onDeleteWorkspace: (workspaceId: string) => void
  onResetWorkspace: () => void
  onImportWorkspace: (document: WorkspaceDocument) => void
}

export function WorkspaceManager({
  document,
  savedWorkspaces,
  onRenameWorkspace,
  onSaveWorkspace,
  onLoadWorkspace,
  onDuplicateWorkspace,
  onDeleteWorkspace,
  onResetWorkspace,
  onImportWorkspace,
}: WorkspaceManagerProps) {
  const { repositoryMode, setRepositoryMode } = useWorkspaceService()
  const [name, setName] = useState(document.name)
  const [resetArmed, setResetArmed] = useState(false)

  useEffect(() => {
    setName(document.name)
  }, [document.name])

  return (
    <section className="workspace-manager-grid">
      <div className="panel workspace-manager">
        <div className="panel__header">
          <p className="eyebrow">Workspace Manager</p>
          <h2>Save, load, duplicate, and reset</h2>
        </div>

        <label className="workspace-name-field">
          <span>Workspace name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => name.trim() && onRenameWorkspace(name.trim())}
          />
        </label>

        <label className="workspace-name-field">
          <span>Repository mode</span>
          <select value={repositoryMode} onChange={(event) => setRepositoryMode(event.target.value as WorkspaceRepositoryMode)}>
            <option value="local">Local storage repository</option>
            <option value="mockApi">Mock API repository</option>
            <option value="api">Backend API repository</option>
          </select>
        </label>

        <div className="overlay-actions">
          <button type="button" onClick={() => {
            if (name.trim() && name.trim() !== document.name) onRenameWorkspace(name.trim())
            onSaveWorkspace()
          }}>
            Save workspace
          </button>
          <button type="button" onClick={() => setResetArmed((current) => !current)}>
            {resetArmed ? 'Cancel reset' : 'Prepare reset'}
          </button>
          <button type="button" disabled={!resetArmed} onClick={() => {
            onResetWorkspace()
            setResetArmed(false)
          }}>
            Confirm reset
          </button>
        </div>

        <section>
          <h3>Saved Workspaces</h3>
          {savedWorkspaces.length === 0 ? (
            <p className="empty-state">No local saved workspaces yet.</p>
          ) : (
            <ul className="workspace-save-list">
              {savedWorkspaces.map((workspace) => (
                <li key={workspace.workspaceId}>
                  <div>
                    <strong>{workspace.name}</strong>
                    <span>{workspace.savedAt ? new Date(workspace.savedAt).toLocaleString() : workspace.updatedAt}</span>
                  </div>
                  <div className="overlay-actions">
                    <button type="button" onClick={() => onLoadWorkspace(workspace.workspaceId)}>Load</button>
                    <button type="button" onClick={() => onDuplicateWorkspace(workspace.workspaceId)}>Duplicate</button>
                    <button type="button" onClick={() => onDeleteWorkspace(workspace.workspaceId)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ExportImportPanel document={document} onImportWorkspace={onImportWorkspace} />
    </section>
  )
}
