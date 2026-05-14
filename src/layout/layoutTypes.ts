import type { CSSProperties, ReactNode } from 'react'

export type WorkspaceLayoutMode = 'Build' | 'Analyze' | 'Replay'

export type LayoutPanelId =
  | 'left-navigation'
  | 'right-inspector'
  | 'bottom-timeline'
  | 'palette-tools'
  | 'developer-systems'

export type LayoutOverlayId =
  | 'command-palette'
  | 'starter-wizard'
  | 'workspace-launcher'
  | 'shortcut-overlay'
  | 'context-menu'
  | 'checkpoint-dialog'
  | 'recovery-import'
  | 'remote-cursors'
  | 'guidance'
  | 'health'
  | 'recommendations'
  | 'minimap'
  | 'zoom-controls'

export type LayoutOverlayGroup = 'modal' | 'contextual' | 'guidance' | 'utility' | 'collaboration'

export type LayoutZone = 'top-bar' | 'left-panel' | 'right-panel' | 'stage' | 'bottom-panel' | 'floating'

export type LayoutZIndexLayer = 'base' | 'stage' | 'panel' | 'topBar' | 'utility' | 'overlay' | 'modal'

export type LayoutPanelDefinition = {
  id: LayoutPanelId
  zone: LayoutZone
  label: string
  collapsible: boolean
  collapsed: boolean
  minWidth?: number
  maxWidth?: number
  zLayer: LayoutZIndexLayer
}

export type LayoutOverlayDefinition = {
  id: LayoutOverlayId
  group: LayoutOverlayGroup
  zone: LayoutZone
  label: string
  active: boolean
  zLayer: LayoutZIndexLayer
}

export type ViewportSize = {
  width: number
  height: number
}

export type LayoutState = {
  mode: WorkspaceLayoutMode
  leftCollapsed: boolean
  rightCollapsed: boolean
  bottomCollapsed: boolean
  developerMode: boolean
  timelineOpen: boolean
  activeGuidanceOverlayId?: LayoutOverlayId
  viewport?: ViewportSize
}

export type ResolvedLayout = {
  cssVariables: CSSProperties
  panels: LayoutPanelDefinition[]
  overlays: LayoutOverlayDefinition[]
  activeOverlays: LayoutOverlayDefinition[]
}

export type ManagedOverlay = {
  id: LayoutOverlayId
  node: ReactNode
}
