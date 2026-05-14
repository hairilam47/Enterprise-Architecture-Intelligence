import type { ReactNode } from 'react'

type WorkspaceInspectorProps = {
  collapsed: boolean
  onToggle: () => void
  children: ReactNode
}

export function WorkspaceInspector({ collapsed, onToggle, children }: WorkspaceInspectorProps) {
  return (
    <div className={`workspace-inspector-panel ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="workspace-inspector-panel__header">
        <strong>Inspector</strong>
        <button type="button" className="panel-collapse-button" onClick={onToggle}>
          {collapsed ? 'Open' : 'Collapse'}
        </button>
      </div>
      <div className="workspace-inspector-panel__body">{children}</div>
    </div>
  )
}
