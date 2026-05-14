import { createCommandHistoryState, pushCommand, redoCommand, undoCommand, type CommandHistoryState } from './commandHistory'
import { createCommandTransactionState, type CommandTransactionState } from './commandTransactions'
import type { SerializedEditorCommand } from './editorCommands'
import { eventsFromCommand, type EditorEvent } from './editorEvents'
import {
  addWorkspaceSnapshot,
  createSnapshotFromCommand,
  createWorkspaceSnapshotState,
  shouldCreateCommandSnapshot,
  type WorkspaceSnapshot,
  type WorkspaceSnapshotState,
} from '../workspace/workspaceSnapshots'

export type EditorSelection = {
  nodeIds: string[]
  edgeIds: string[]
  groupIds: string[]
}

export type EditorViewportState = {
  x: number
  y: number
  zoom: number
}

export type EditorPersistenceState = {
  workspaceId: string
  documentVersion: number
  lastPersistedAt?: string
}

export type EditorRuntimeState = {
  isDirty: boolean
  lastModifiedAt?: string
  lastSavedAt?: string
  saveError?: string
  lastCommandId?: string
  lastCommandLabel?: string
}

export type EditorRenderingState = {
  activeWorkspaceView: 'architecture' | 'domain' | 'graph' | 'traceability' | 'composition'
  activeGraphView: 'd3' | 'three'
  viewportBySurface: Record<string, EditorViewportState>
}

export type EditorInteractionState = {
  selection: EditorSelection
  hoveredId?: string
  activeDragId?: string
  activeConnectionId?: string
}

export type RuntimeEditorHistoryEntry = {
  id: string
  label: string
  createdAt: string
  before: Partial<EditorState>
  after: Partial<EditorState>
}

export type EditorState = {
  persistence: EditorPersistenceState
  runtime: EditorRuntimeState
  rendering: EditorRenderingState
  interaction: EditorInteractionState
  commandHistory: CommandHistoryState
  transactions: CommandTransactionState
  snapshots: WorkspaceSnapshotState
  events: EditorEvent[]
  undoStack: RuntimeEditorHistoryEntry[]
  redoStack: RuntimeEditorHistoryEntry[]
}

export type EditorAction =
  | { type: 'command/executed'; command: SerializedEditorCommand }
  | { type: 'history/undo'; command?: SerializedEditorCommand }
  | { type: 'history/redo'; command?: SerializedEditorCommand }
  | { type: 'history/restored'; history: CommandHistoryState }
  | { type: 'snapshot/created'; snapshot: WorkspaceSnapshot }
  | { type: 'snapshots/restored'; snapshots: WorkspaceSnapshot[] }
  | { type: 'events/restored'; events: EditorEvent[] }
  | { type: 'runtime/saved'; savedAt: string; documentVersion?: number }
  | { type: 'runtime/error'; message: string }
  | { type: 'interaction/selectionChanged'; selection: EditorSelection }
  | { type: 'rendering/viewportChanged'; surfaceId: string; viewport: EditorViewportState }

export function createInitialEditorState(workspaceId = 'workspace-enterprise-intelligence'): EditorState {
  return {
    persistence: {
      workspaceId,
      documentVersion: 1,
    },
    runtime: {
      isDirty: false,
    },
    rendering: {
      activeWorkspaceView: 'architecture',
      activeGraphView: 'd3',
      viewportBySurface: {},
    },
    interaction: {
      selection: { nodeIds: [], edgeIds: [], groupIds: [] },
    },
    commandHistory: createCommandHistoryState(),
    transactions: createCommandTransactionState(),
    snapshots: createWorkspaceSnapshotState(),
    events: [],
    undoStack: [],
    redoStack: [],
  }
}

function mergeEditorState(state: EditorState, patch: Partial<EditorState>): EditorState {
  return {
    ...state,
    ...patch,
    persistence: { ...state.persistence, ...(patch.persistence ?? {}) },
    runtime: { ...state.runtime, ...(patch.runtime ?? {}) },
    rendering: { ...state.rendering, ...(patch.rendering ?? {}) },
    interaction: { ...state.interaction, ...(patch.interaction ?? {}) },
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'command/executed') {
    const commandDepth = state.commandHistory.undoStack.length + 1
    const snapshots = shouldCreateCommandSnapshot(commandDepth)
      ? addWorkspaceSnapshot(state.snapshots, createSnapshotFromCommand(action.command, commandDepth))
      : state.snapshots

    return {
      ...state,
      runtime: {
        ...state.runtime,
        isDirty: true,
        lastModifiedAt: new Date(action.command.timestamp).toISOString(),
        saveError: undefined,
        lastCommandId: action.command.id,
        lastCommandLabel: action.command.label,
      },
      persistence: {
        ...state.persistence,
        workspaceId: action.command.after.workspaceId,
        documentVersion: action.command.after.version,
      },
      commandHistory: pushCommand(state.commandHistory, action.command),
      snapshots,
      events: [...eventsFromCommand(action.command), ...state.events].slice(0, 500),
    }
  }

  if (action.type === 'history/undo') {
    const result = action.command
      ? { command: action.command, history: undoCommand(state.commandHistory).history }
      : undoCommand(state.commandHistory)
    if (!result.command) return state
    return {
      ...state,
      runtime: {
        ...state.runtime,
        isDirty: true,
        lastModifiedAt: new Date().toISOString(),
        lastCommandId: result.command.id,
        lastCommandLabel: `Undo ${result.command.label}`,
      },
      persistence: {
        ...state.persistence,
        documentVersion: result.command.before.version,
      },
      commandHistory: result.history,
    }
  }

  if (action.type === 'history/redo') {
    const result = action.command
      ? { command: action.command, history: redoCommand(state.commandHistory).history }
      : redoCommand(state.commandHistory)
    if (!result.command) return state
    return {
      ...state,
      runtime: {
        ...state.runtime,
        isDirty: true,
        lastModifiedAt: new Date().toISOString(),
        lastCommandId: result.command.id,
        lastCommandLabel: `Redo ${result.command.label}`,
      },
      persistence: {
        ...state.persistence,
        documentVersion: result.command.after.version,
      },
      commandHistory: result.history,
    }
  }

  if (action.type === 'history/restored') {
    return { ...state, commandHistory: action.history }
  }

  if (action.type === 'snapshot/created') {
    return { ...state, snapshots: addWorkspaceSnapshot(state.snapshots, action.snapshot) }
  }

  if (action.type === 'snapshots/restored') {
    return { ...state, snapshots: { ...state.snapshots, snapshots: action.snapshots } }
  }

  if (action.type === 'events/restored') {
    return { ...state, events: action.events }
  }

  if (action.type === 'runtime/saved') {
    return {
      ...state,
      persistence: {
        ...state.persistence,
        documentVersion: action.documentVersion ?? state.persistence.documentVersion,
        lastPersistedAt: action.savedAt,
      },
      runtime: { ...state.runtime, isDirty: false, lastSavedAt: action.savedAt, saveError: undefined },
    }
  }

  if (action.type === 'runtime/error') {
    return { ...state, runtime: { ...state.runtime, isDirty: true, saveError: action.message } }
  }

  if (action.type === 'interaction/selectionChanged') {
    return { ...state, interaction: { ...state.interaction, selection: action.selection } }
  }

  if (action.type === 'rendering/viewportChanged') {
    return {
      ...state,
      rendering: {
        ...state.rendering,
        viewportBySurface: {
          ...state.rendering.viewportBySurface,
          [action.surfaceId]: action.viewport,
        },
      },
    }
  }

  if (action.type === 'command/executed') return mergeEditorState(state, {})

  return state
}
