export type TimelinePlaybackState = {
  status: 'idle' | 'playing' | 'paused' | 'cancelled'
  index: number
  length: number
  speed: number
  previewMode: boolean
  startedAt?: number
}

export function createTimelinePlayback(length = 0): TimelinePlaybackState {
  return { status: 'idle', index: 0, length, speed: 1, previewMode: true }
}

export function play(state: TimelinePlaybackState): TimelinePlaybackState {
  return { ...state, status: 'playing', previewMode: true, startedAt: state.startedAt ?? Date.now() }
}

export function pause(state: TimelinePlaybackState): TimelinePlaybackState {
  return { ...state, status: 'paused' }
}

export function cancel(state: TimelinePlaybackState): TimelinePlaybackState {
  return { ...state, status: 'cancelled', index: 0, previewMode: false, startedAt: undefined }
}

export function setPlaybackLength(state: TimelinePlaybackState, length: number): TimelinePlaybackState {
  return { ...state, length, index: Math.min(state.index, Math.max(0, length - 1)) }
}

export function setPlaybackSpeed(state: TimelinePlaybackState, speed: number): TimelinePlaybackState {
  return { ...state, speed: Math.max(0.25, Math.min(speed, 4)) }
}

export function seek(state: TimelinePlaybackState, index: number): TimelinePlaybackState {
  return { ...state, index: Math.max(0, Math.min(index, Math.max(0, state.length - 1))) }
}

export function stepForward(state: TimelinePlaybackState): TimelinePlaybackState {
  return seek(state, state.index + 1)
}

export function stepBackward(state: TimelinePlaybackState): TimelinePlaybackState {
  return seek(state, state.index - 1)
}

export function getPlaybackProgress(state: TimelinePlaybackState) {
  if (state.length <= 1) return 0
  return Math.round((state.index / (state.length - 1)) * 100)
}

export function getPlaybackIntervalMs(state: TimelinePlaybackState) {
  return Math.round(1000 / state.speed)
}
