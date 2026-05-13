import type { ThreeCameraPreset } from './threeCameraPresets'

export type ThreeInteractionState = {
  hoveredNodeLabel?: string
  selectedNodeLabel?: string
  highlightedDependencyCount: number
  focusedLayer: string
  activeCameraPreset: ThreeCameraPreset
}

export function describeThreeInteractionState(state: ThreeInteractionState) {
  return [
    `Selected: ${state.selectedNodeLabel ?? 'None'}`,
    `Hovered: ${state.hoveredNodeLabel ?? 'None'}`,
    `Highlighted dependencies: ${state.highlightedDependencyCount}`,
    `Focused layer: ${state.focusedLayer || 'All layers'}`,
    `Camera: ${state.activeCameraPreset.replaceAll('_', ' ')}`,
  ]
}
