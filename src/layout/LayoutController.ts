import type { CSSProperties } from 'react'
import type {
  LayoutOverlayDefinition,
  LayoutPanelDefinition,
  LayoutState,
  LayoutZIndexLayer,
  ResolvedLayout,
} from './layoutTypes'
import { clampDimension, layoutZIndex, viewportConstraints } from './viewportConstraints'

function resolveLayerIndex(layer: LayoutZIndexLayer) {
  return layoutZIndex[layer]
}

function resolveBottomHeight(layoutState: LayoutState) {
  if (layoutState.bottomCollapsed) return `${viewportConstraints.timeline.collapsed}px`
  if (layoutState.mode === 'Replay') {
    return `minmax(${viewportConstraints.timeline.replayFocusMin}px, ${Math.round(
      viewportConstraints.timeline.replayFocusViewportRatio * 100,
    )}vh)`
  }
  return `${viewportConstraints.timeline.expanded}px`
}

function resolvePanelWidth(
  collapsed: boolean,
  preferred: number,
  min: number,
  max: number,
) {
  if (collapsed) return `${viewportConstraints.railWidth}px`
  return `${clampDimension(preferred, min, max)}px`
}

function enforceSingleGuidanceOverlay(overlays: LayoutOverlayDefinition[]) {
  let guidanceClaimed = false

  return overlays.map((overlay) => {
    if (overlay.group !== 'guidance' || !overlay.active) return overlay
    if (guidanceClaimed) return { ...overlay, active: false }
    guidanceClaimed = true
    return overlay
  })
}

export function resolveLayout(
  layoutState: LayoutState,
  panels: LayoutPanelDefinition[],
  overlays: LayoutOverlayDefinition[],
): ResolvedLayout {
  const resolvedOverlays = enforceSingleGuidanceOverlay(overlays)
  const leftWidth = resolvePanelWidth(
    layoutState.leftCollapsed,
    viewportConstraints.leftPanel.preferred,
    viewportConstraints.leftPanel.min,
    viewportConstraints.leftPanel.max,
  )
  const rightWidth = resolvePanelWidth(
    layoutState.rightCollapsed,
    viewportConstraints.rightInspector.preferred,
    viewportConstraints.rightInspector.min,
    viewportConstraints.rightInspector.max,
  )

  return {
    panels,
    overlays: resolvedOverlays,
    activeOverlays: resolvedOverlays.filter((overlay) => overlay.active),
    cssVariables: {
      '--shell-topbar-height': `${viewportConstraints.topBarHeight}px`,
      '--shell-left-width': leftWidth,
      '--shell-right-width': rightWidth,
      '--shell-rail-width': `${viewportConstraints.railWidth}px`,
      '--shell-bottom-height': resolveBottomHeight(layoutState),
      '--shell-bottom-collapsed-height': `${viewportConstraints.timeline.collapsed}px`,
      '--z-stage': resolveLayerIndex('stage'),
      '--z-panel': resolveLayerIndex('panel'),
      '--z-topbar': resolveLayerIndex('topBar'),
      '--z-utility': resolveLayerIndex('utility'),
      '--z-overlay': resolveLayerIndex('overlay'),
      '--z-modal': resolveLayerIndex('modal'),
    } as CSSProperties,
  }
}

export function getOverlayAttributes(overlay?: LayoutOverlayDefinition) {
  if (!overlay) return {}
  return {
    'data-overlay-id': overlay.id,
    'data-overlay-zone': overlay.zone,
    'data-layout-layer': overlay.zLayer,
  }
}

export function isOverlayActive(overlays: LayoutOverlayDefinition[], id: LayoutOverlayDefinition['id']) {
  return overlays.some((overlay) => overlay.id === id && overlay.active)
}
