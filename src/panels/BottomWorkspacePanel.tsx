import type { ReactNode } from 'react'

type BottomWorkspacePanelProps = {
  collapsed: boolean
  developerMode: boolean
  onToggle: () => void
  onToggleDeveloperMode: () => void
  children: ReactNode
}

export function BottomWorkspacePanel({
  collapsed,
  developerMode,
  onToggle,
  onToggleDeveloperMode,
  children,
}: BottomWorkspacePanelProps) {
  return (
    <div className={`bottom-workspace-panel ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="bottom-workspace-panel__header">
        <strong>Timeline and recovery</strong>
        <div className="bottom-workspace-panel__actions">
          <button type="button" className="bottom-panel-action" onClick={onToggle}>{collapsed ? 'Open' : 'Collapse'}</button>
          <button type="button" className={`bottom-panel-action ${developerMode ? 'is-active' : ''}`} onClick={onToggleDeveloperMode}>
            Developer mode
          </button>
        </div>
      </div>
      <div className="bottom-workspace-panel__body">{children}</div>
    </div>
  )
}
