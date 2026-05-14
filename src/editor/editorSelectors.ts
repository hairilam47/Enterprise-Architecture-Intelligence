import type { EditorState } from './editorStore'

export function selectEditorRuntime(state: EditorState) {
  return state.runtime
}

export function selectEditorSelection(state: EditorState) {
  return state.interaction.selection
}

export function selectCanUndo(state: EditorState) {
  return state.commandHistory.undoStack.length > 0
}

export function selectCanRedo(state: EditorState) {
  return state.commandHistory.redoStack.length > 0
}

export function selectViewport(state: EditorState, surfaceId: string) {
  return state.rendering.viewportBySurface[surfaceId]
}

export function selectPersistenceState(state: EditorState) {
  return state.persistence
}

export function selectHistoryDepth(state: EditorState) {
  return {
    undoDepth: state.commandHistory.undoStack.length,
    redoDepth: state.commandHistory.redoStack.length,
  }
}

export function selectLastCommand(state: EditorState) {
  return state.commandHistory.undoStack[0] ?? state.commandHistory.redoStack[0]
}

export function selectSnapshotCount(state: EditorState) {
  return state.snapshots.snapshots.length
}

export function selectActiveTransaction(state: EditorState) {
  return state.transactions.stack[0]
}
