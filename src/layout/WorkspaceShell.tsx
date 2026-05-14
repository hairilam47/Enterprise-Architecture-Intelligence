import type { ReactNode } from 'react'
import { resolveLayout } from './LayoutController'
import type { LayoutOverlayDefinition, LayoutPanelDefinition, LayoutState, ManagedOverlay } from './layoutTypes'

type WorkspaceShellProps = {
  layoutState: LayoutState
  registeredPanels: LayoutPanelDefinition[]
  registeredOverlays: LayoutOverlayDefinition[]
  topBar: ReactNode
  leftSidebar: ReactNode
  stadium: ReactNode
  inspector: ReactNode
  bottomPanel: ReactNode
  overlays?: ManagedOverlay[]
}

export function WorkspaceShell({
  layoutState,
  registeredPanels,
  registeredOverlays,
  topBar,
  leftSidebar,
  stadium,
  inspector,
  bottomPanel,
  overlays = [],
}: WorkspaceShellProps) {
  const resolvedLayout = resolveLayout(layoutState, registeredPanels, registeredOverlays)
  const overlayById = new Map(resolvedLayout.activeOverlays.map((overlay) => [overlay.id, overlay]))

  return (
    <main
      className={[
        'studio-shell',
        layoutState.leftCollapsed ? 'is-left-collapsed' : '',
        layoutState.rightCollapsed ? 'is-right-collapsed' : '',
        layoutState.bottomCollapsed ? 'is-bottom-collapsed' : '',
      ].join(' ')}
      data-mode={layoutState.mode}
      data-layout-authority="workspace-shell"
      style={resolvedLayout.cssVariables}
    >
      <div className="studio-shell__top" data-layout-zone="top-bar" data-layout-layer="topBar">
        {topBar}
      </div>
      <aside className="studio-shell__left" data-layout-zone="left-panel" data-layout-layer="panel">
        {leftSidebar}
      </aside>
      <section className="studio-shell__stage" data-layout-zone="stage" data-layout-layer="stage">
        {stadium}
      </section>
      <aside className="studio-shell__right" data-layout-zone="right-panel" data-layout-layer="panel">
        {inspector}
      </aside>
      <section className="studio-shell__bottom" data-layout-zone="bottom-panel" data-layout-layer="panel">
        {bottomPanel}
      </section>
      <div className="studio-shell__portals" data-layout-zone="floating" data-layout-layer="overlay">
        {overlays.map((overlay) => {
          const definition = overlayById.get(overlay.id)
          if (!definition) return null
          return (
            <div
              key={overlay.id}
              className="managed-overlay"
              data-overlay-id={definition.id}
              data-overlay-zone={definition.zone}
              data-overlay-group={definition.group}
              data-layout-layer={definition.zLayer}
            >
              {overlay.node}
            </div>
          )
        })}
      </div>
    </main>
  )
}

export type { LayoutState as ShellLayoutState } from './layoutTypes'
