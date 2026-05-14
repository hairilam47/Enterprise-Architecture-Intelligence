import type { SerializedEditorCommand } from './editorCommands'
import type { OperationMetadata } from './editorCommands'

export type EditorEvent = {
  id: string
  type: string
  timestamp: number
  payload: unknown
  commandId?: string
  workspaceId?: string
  operation?: OperationMetadata
}

export function createEditorEvent(type: string, payload: unknown, command?: SerializedEditorCommand): EditorEvent {
  return {
    id: `editor-event:${crypto.randomUUID()}`,
    type,
    timestamp: Date.now(),
    payload: structuredClone(payload),
    commandId: command?.id,
    workspaceId: command?.after.workspaceId,
    operation: command?.operation,
  }
}

export function eventsFromCommand(command: SerializedEditorCommand): EditorEvent[] {
  return [
    createEditorEvent(
      `command.${command.type}`,
      {
        label: command.label,
        payload: command.payload,
        beforeVersion: command.before.version,
        afterVersion: command.after.version,
      },
      command,
    ),
  ]
}
