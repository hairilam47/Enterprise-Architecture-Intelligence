export const viewportConstraints = {
  topBarHeight: 64,
  railWidth: 48,
  leftPanel: {
    min: 260,
    preferred: 272,
    max: 300,
  },
  rightInspector: {
    min: 320,
    preferred: 340,
    max: 360,
  },
  timeline: {
    collapsed: 48,
    expanded: 240,
    replayFocusMin: 320,
    replayFocusViewportRatio: 0.45,
  },
  stage: {
    minProtectedWidth: 640,
    minProtectedHeight: 420,
  },
} as const

export const layoutZIndex = {
  base: 0,
  stage: 1,
  panel: 20,
  topBar: 40,
  utility: 55,
  overlay: 80,
  modal: 100,
} as const

export function clampDimension(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
