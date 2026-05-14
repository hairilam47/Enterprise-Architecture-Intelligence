import type { SerializedEditorCommand } from './editorCommands'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { WorkspaceCheckpoint } from '../workspace/workspaceCheckpoints'

export type ReplaySandboxState = {
  id: string
  status: 'idle' | 'hydrated' | 'replaying' | 'cancelled' | 'complete' | 'error'
  baseDocument?: WorkspaceDocument
  previewDocument?: WorkspaceDocument
  appliedCommandIds: string[]
  checkpointIds: string[]
  error?: string
}

export function createReplaySandbox(): ReplaySandboxState {
  return {
    id: `replay-sandbox:${crypto.randomUUID()}`,
    status: 'idle',
    appliedCommandIds: [],
    checkpointIds: [],
  }
}

export function hydrateReplaySandbox(state: ReplaySandboxState, document: WorkspaceDocument): ReplaySandboxState {
  return {
    ...state,
    status: 'hydrated',
    baseDocument: structuredClone(document),
    previewDocument: structuredClone(document),
    appliedCommandIds: [],
    error: undefined,
  }
}

export function applyReplayCommand(state: ReplaySandboxState, command: SerializedEditorCommand): ReplaySandboxState {
  if (state.status === 'cancelled') return state
  return {
    ...state,
    status: 'replaying',
    previewDocument: structuredClone(command.after),
    appliedCommandIds: [...state.appliedCommandIds, command.id],
  }
}

export function cancelReplaySandbox(state: ReplaySandboxState): ReplaySandboxState {
  return { ...state, status: 'cancelled', previewDocument: undefined, appliedCommandIds: [] }
}

export function resetReplaySandbox(state: ReplaySandboxState): ReplaySandboxState {
  return { ...createReplaySandbox(), id: state.id }
}

export function addReplayCheckpoint(state: ReplaySandboxState, checkpoint: WorkspaceCheckpoint): ReplaySandboxState {
  return {
    ...state,
    checkpointIds: Array.from(new Set([...state.checkpointIds, checkpoint.id])),
  }
}
