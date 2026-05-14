import type { SerializedEditorCommand } from '../editor/editorCommands'

export type CollaborationConflictType =
  | 'overlapping_mutation'
  | 'incompatible_operation'
  | 'stale_replay_window'
  | 'invalid_logical_clock'
  | 'merge_divergence'

export type CollaborationConflict = {
  id: string
  type: CollaborationConflictType
  severity: 'warning' | 'error'
  message: string
  operationIds: string[]
}

export type CollaborationOperation = SerializedEditorCommand
