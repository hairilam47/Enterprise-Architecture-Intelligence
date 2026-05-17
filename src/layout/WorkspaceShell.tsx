import type { ReactNode } from 'react'
import { resolveLayout } from './LayoutController'
import type {
  LayoutOverlayDefinition,
  LayoutPanelDefinition,
  LayoutState,
  ManagedOverlay,
} from './layoutTypes'

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
  const overlayById = new Map(
    resolvedLayout.activeOverlays.map(overlay => [overlay.id, overlay])
  )

  return (
    <main
      className={[
        'studio-shell',
        layoutState.leftCollapsed ? 'is-left-collapsed' : '',
        layoutState.rightCollapsed ? 'is-right-collapsed' : '',
        layoutState.bottomCollapsed ? 'is-bottom-collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-mode={layoutState.mode}
      data-layout-authority="workspace-shell"
      style={resolvedLayout.cssVariables}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div
        className="studio-shell__top"
        data-layout-zone="top-bar"
        data-layout-layer="topBar"
      >
        {topBar}
      </div>

      {/* ── Left sidebar ────────────────────────────────────────────────── */}
      <aside
        className="studio-shell__left"
        data-layout-zone="left-panel"
        data-layout-layer="panel"
      >
        {leftSidebar}
      </aside>

      {/* ── Stage (canvas) ──────────────────────────────────────────────── */}
      <section
        className="studio-shell__stage"
        data-layout-zone="stage"
        data-layout-layer="stage"
      >
        {stadium}
      </section>

      {/* ── Right inspector ─────────────────────────────────────────────── */}
      <aside
        className="studio-shell__right"
        data-layout-zone="right-panel"
        data-layout-layer="panel"
      >
        {inspector}
      </aside>

      {/* ── Bottom panel (timeline / developer) ─────────────────────────── */}
      <section
        className="studio-shell__bottom"
        data-layout-zone="bottom-panel"
        data-layout-layer="panel"
      >
        {bottomPanel}
      </section>

      {/*
       * ── Managed overlay portal ─────────────────────────────────────────
       *
       * The container div has `pointer-events: none` from the CSS authority
       * rules (Sprint 22A).  Each managed overlay wrapper gets:
       *
       *   `managed-overlay managed-overlay--active`  → pointer-events: auto
       *   `managed-overlay managed-overlay--idle`    → pointer-events: none
       *
       * This prevents closed/background overlays from forming invisible dead
       * zones over the canvas stage.
       *
       * Overlays that are not present in `resolvedLayout.activeOverlays`
       * (i.e. their definition.active is false) still render their React
       * node — most modals return `null` when closed anyway — but their
       * wrapper has `pointer-events: none` so they cannot intercept clicks.
       */}
      <div
        className="studio-shell__portals"
        data-layout-zone="floating"
        data-layout-layer="overlay"
        // Belt-and-suspenders: explicit inline style in addition to CSS rule.
        style={{ pointerEvents: 'none' }}
      >
        {overlays.map(overlay => {
          // Look up the definition from the resolved active set first; fall
          // back to the full registered set for inactive overlays that still
          // need a wrapper (so their React tree doesn't unmount unnecessarily).
          const definition =
            overlayById.get(overlay.id) ??
            registeredOverlays.find(d => d.id === overlay.id)

          if (!definition) return null

          const isActive = definition.active

          return (
            <div
              key={overlay.id}
              // Active overlays restore pointer events; idle overlays keep
              // the container's `pointer-events: none` inheritance.
              className={[
                'managed-overlay',
                isActive ? 'managed-overlay--active' : 'managed-overlay--idle',
              ].join(' ')}
              data-overlay-id={definition.id}
              data-overlay-zone={definition.zone}
              data-overlay-group={definition.group}
              data-layout-layer={definition.zLayer}
              // Inline style ensures the constraint applies even when the
              // CSS cascade is in a different order across browser engines.
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
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
