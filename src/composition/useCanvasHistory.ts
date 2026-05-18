import { useCallback, useRef } from 'react'
import type { CompositionState } from './compositionTypes'

const MAX_HISTORY = 30

export type CanvasHistoryHandle = {
  /** Push a snapshot before a mutation so it can be undone. */
  push: (state: CompositionState) => void
  /** Return the previous state, or null if history is empty. */
  undo: (current: CompositionState) => CompositionState | null
  /** Return the next state, or null if there is nothing to redo. */
  redo: (current: CompositionState) => CompositionState | null
  canUndo: () => boolean
  canRedo: () => boolean
}

/**
 * Imperative undo/redo stack for the composition canvas.
 * Stored in refs so mutations never trigger a re-render — the canvas
 * component re-renders only when the actual CompositionState changes.
 */
export function useCanvasHistory(): CanvasHistoryHandle {
  const past = useRef<CompositionState[]>([])
  const future = useRef<CompositionState[]>([])

  const push = useCallback((state: CompositionState) => {
    past.current = [...past.current, state].slice(-MAX_HISTORY)
    future.current = []
  }, [])

  const undo = useCallback((current: CompositionState): CompositionState | null => {
    if (past.current.length === 0) return null
    const previous = past.current[past.current.length - 1]
    past.current = past.current.slice(0, -1)
    future.current = [current, ...future.current].slice(0, MAX_HISTORY)
    return previous
  }, [])

  const redo = useCallback((current: CompositionState): CompositionState | null => {
    if (future.current.length === 0) return null
    const next = future.current[0]
    future.current = future.current.slice(1)
    past.current = [...past.current, current].slice(-MAX_HISTORY)
    return next
  }, [])

  const canUndo = useCallback(() => past.current.length > 0, [])
  const canRedo = useCallback(() => future.current.length > 0, [])

  return { push, undo, redo, canUndo, canRedo }
}
