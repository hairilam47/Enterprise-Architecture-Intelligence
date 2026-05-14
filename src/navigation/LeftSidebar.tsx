import type { ReactNode } from 'react'

type LeftSidebarProps = {
  collapsed: boolean
  onToggle: () => void
  navigation: ReactNode
  tools?: ReactNode
}

export function LeftSidebar({ collapsed, onToggle, navigation, tools }: LeftSidebarProps) {
  return (
    <div className={`left-sidebar-panel ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="left-sidebar-panel__header">
        <strong>Workspace</strong>
        <button type="button" className="panel-collapse-button" onClick={onToggle}>
          {collapsed ? 'Open' : 'Collapse'}
        </button>
      </div>
      <div className="left-sidebar-panel__body">
        {navigation}
        {tools}
      </div>
    </div>
  )
}
