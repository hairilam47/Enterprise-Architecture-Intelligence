import type { SerializedEditorCommand } from './editorCommands'

export const DEFAULT_MAX_HISTORY_DEPTH = 120

export type CommandHistoryState = {
  undoStack: SerializedEditorCommand[]
  redoStack: SerializedEditorCommand[]
  maxDepth: number
}

export function createCommandHistoryState(maxDepth = DEFAULT_MAX_HISTORY_DEPTH): CommandHistoryState {
  return {
    undoStack: [],
    redoStack: [],
    maxDepth,
  }
}

export function pushCommand(history: CommandHistoryState, command: SerializedEditorCommand): CommandHistoryState {
  return {
    ...history,
    undoStack: [command, ...history.undoStack].slice(0, history.maxDepth),
    redoStack: [],
  }
}

export function undoCommand(history: CommandHistoryState): { command?: SerializedEditorCommand; history: CommandHistoryState } {
  const [command, ...undoStack] = history.undoStack
  if (!command) return { history }
  return {
    command,
    history: {
      ...history,
      undoStack,
      redoStack: [command, ...history.redoStack].slice(0, history.maxDepth),
    },
  }
}

export function redoCommand(history: CommandHistoryState): { command?: SerializedEditorCommand; history: CommandHistoryState } {
  const [command, ...redoStack] = history.redoStack
  if (!command) return { history }
  return {
    command,
    history: {
      ...history,
      undoStack: [command, ...history.undoStack].slice(0, history.maxDepth),
      redoStack,
    },
  }
}

export function clearCommandHistory(history: CommandHistoryState): CommandHistoryState {
  return {
    ...history,
    undoStack: [],
    redoStack: [],
  }
}

export function serializeCommandHistory(history: CommandHistoryState): CommandHistoryState {
  return structuredClone(history)
}

export function restoreCommandHistory(input: Partial<CommandHistoryState> | undefined): CommandHistoryState {
  return {
    undoStack: Array.isArray(input?.undoStack) ? structuredClone(input.undoStack) : [],
    redoStack: Array.isArray(input?.redoStack) ? structuredClone(input.redoStack) : [],
    maxDepth: typeof input?.maxDepth === 'number' ? input.maxDepth : DEFAULT_MAX_HISTORY_DEPTH,
  }
}

export function canUndo(history: CommandHistoryState) {
  return history.undoStack.length > 0
}

export function canRedo(history: CommandHistoryState) {
  return history.redoStack.length > 0
}

export function historyDepth(history: CommandHistoryState) {
  return {
    undoDepth: history.undoStack.length,
    redoDepth: history.redoStack.length,
  }
}

export function lastCommand(history: CommandHistoryState) {
  return history.undoStack[0] ?? history.redoStack[0]
}
