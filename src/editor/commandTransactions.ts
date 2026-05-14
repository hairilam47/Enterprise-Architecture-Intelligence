import { createWorkspaceCommand, type EditorCommandType, type SerializedEditorCommand } from './editorCommands'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'

export type CommandTransaction = {
  id: string
  label: string
  startedAt: number
  commands: SerializedEditorCommand[]
}

export type CommandTransactionState = {
  stack: CommandTransaction[]
  committed: SerializedEditorCommand[]
  activeTransactionId?: string
}

export function createCommandTransactionState(): CommandTransactionState {
  return {
    stack: [],
    committed: [],
  }
}

export function beginTransaction(state: CommandTransactionState, label: string): CommandTransactionState {
  const transaction: CommandTransaction = {
    id: `editor-transaction:${crypto.randomUUID()}`,
    label,
    startedAt: Date.now(),
    commands: [],
  }
  return {
    ...state,
    stack: [transaction, ...state.stack],
    activeTransactionId: transaction.id,
  }
}

export function addCommandToTransaction(state: CommandTransactionState, command: SerializedEditorCommand): CommandTransactionState {
  const [active, ...rest] = state.stack
  if (!active) return state
  return {
    ...state,
    stack: [{ ...active, commands: [command, ...active.commands] }, ...rest],
  }
}

export function commitTransaction(
  state: CommandTransactionState,
  before: WorkspaceDocument,
  after: WorkspaceDocument,
  type: EditorCommandType = 'transaction.batch',
): { state: CommandTransactionState; command?: SerializedEditorCommand } {
  const [active, ...rest] = state.stack
  if (!active) return { state }

  const command = createWorkspaceCommand({
    type,
    label: active.label,
    before,
    after,
    transactionId: active.id,
    childCommands: [...active.commands].reverse(),
    payload: { childCommandCount: active.commands.length },
  }).serialize()

  return {
    state: {
      stack: rest,
      committed: [command, ...state.committed],
      activeTransactionId: rest[0]?.id,
    },
    command,
  }
}

export function rollbackTransaction(state: CommandTransactionState): CommandTransactionState {
  const [, ...rest] = state.stack
  return {
    ...state,
    stack: rest,
    activeTransactionId: rest[0]?.id,
  }
}

export function isTransactionActive(state: CommandTransactionState) {
  return state.stack.length > 0
}
