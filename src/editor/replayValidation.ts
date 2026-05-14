import type { CommandHistoryState } from './commandHistory'
import type { EditorEvent } from './editorEvents'
import type { WorkspaceSnapshot } from '../workspace/workspaceSnapshots'

export type ReplayValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateReplayChain(input: {
  history: CommandHistoryState
  snapshots: WorkspaceSnapshot[]
  events: EditorEvent[]
}): ReplayValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const commands = [...input.history.undoStack].reverse()

  commands.forEach((command, index) => {
    if (!command.id || !command.type) errors.push(`Command ${index} is missing id or type.`)
    if (index > 0) {
      const previous = commands[index - 1]
      if (previous.after.workspaceId !== command.before.workspaceId) {
        errors.push(`Command ${command.id} changes workspace lineage.`)
      }
      if (previous.timestamp > command.timestamp) {
        errors.push(`Command ${command.id} is out of deterministic timestamp order.`)
      }
      if (previous.after.version > command.before.version) {
        warnings.push(`Command ${command.id} starts before the previous command version.`)
      }
    }
    if (command.type === 'transaction.batch' && (!command.childCommands || command.childCommands.length === 0)) {
      warnings.push(`Transaction command ${command.id} has no child commands.`)
    }
  })

  input.snapshots.forEach((snapshot) => {
    if (!snapshot.metadata.id) errors.push('Snapshot is missing metadata id.')
    if (snapshot.document.version !== snapshot.metadata.workspaceVersion) {
      warnings.push(`Snapshot ${snapshot.metadata.id} version metadata differs from document version.`)
    }
  })

  input.events.forEach((event) => {
    if (!event.id || !event.type || typeof event.timestamp !== 'number') {
      errors.push('Editor event is missing replay-safe fields.')
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}
