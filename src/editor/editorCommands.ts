import type { CompositionState } from '../composition/compositionTypes'
import type { DomainRegistryState } from '../domain/domainTypes'
import type { ArchitectureLayer, Workspace } from '../types/architecture'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { EditorSelection, EditorState, EditorViewportState } from './editorStore'

export type EditorCommandType =
  | 'workspace.rename'
  | 'workspace.reset'
  | 'workspace.import'
  | 'workspace.restore'
  | 'layer.plugin.swap'
  | 'domain.entity.create'
  | 'domain.entity.delete'
  | 'domain.relationship.create'
  | 'composition.state.replace'
  | 'composition.node.create'
  | 'composition.node.delete'
  | 'composition.node.move'
  | 'composition.node.resize'
  | 'composition.node.rename'
  | 'composition.edge.connect'
  | 'composition.edge.remove'
  | 'composition.metadata.update'
  | 'viewport.change'
  | 'selection.change'
  | 'transaction.batch'

export type SerializedEditorCommand = {
  id: string
  type: EditorCommandType
  label: string
  timestamp: number
  operation: OperationMetadata
  before: WorkspaceDocument
  after: WorkspaceDocument
  payload: Record<string, unknown>
  eventIds: string[]
  transactionId?: string
  childCommands?: SerializedEditorCommand[]
}

export type OperationMetadata = {
  operationId: string
  sessionId: string
  authorId?: string
  logicalClock: number
  parentOperationId?: string
}

export type EditorCommandContext = {
  document: WorkspaceDocument
}

export interface EditorCommand {
  id: string
  type: EditorCommandType
  label: string
  timestamp: number
  execute(context: EditorCommandContext): WorkspaceDocument
  undo(context: EditorCommandContext): WorkspaceDocument
  redo(context: EditorCommandContext): WorkspaceDocument
  serialize(): SerializedEditorCommand
}

type CreateWorkspaceCommandInput = {
  type: EditorCommandType
  label: string
  before: WorkspaceDocument
  after: WorkspaceDocument
  payload?: Record<string, unknown>
  transactionId?: string
  childCommands?: SerializedEditorCommand[]
}

export function createWorkspaceCommand({
  type,
  label,
  before,
  after,
  payload = {},
  transactionId,
  childCommands,
}: CreateWorkspaceCommandInput): EditorCommand {
  const timestamp = Date.now()
  const serialized: SerializedEditorCommand = {
    id: `editor-command:${crypto.randomUUID()}`,
    type,
    label,
    timestamp,
    operation: createOperationMetadata(timestamp, transactionId),
    before: structuredClone(before),
    after: structuredClone(after),
    payload: structuredClone(payload),
    eventIds: [],
    transactionId,
    childCommands,
  }

  return hydrateWorkspaceCommand(serialized)
}

export function createOperationMetadata(logicalClock = Date.now(), parentOperationId?: string): OperationMetadata {
  const sessionKey = 'ea-studio.session-id'
  const sessionId =
    typeof window !== 'undefined'
      ? window.sessionStorage.getItem(sessionKey) ?? `session:${crypto.randomUUID()}`
      : `session:${crypto.randomUUID()}`
  if (typeof window !== 'undefined' && !window.sessionStorage.getItem(sessionKey)) {
    window.sessionStorage.setItem(sessionKey, sessionId)
  }
  return {
    operationId: `operation:${crypto.randomUUID()}`,
    sessionId,
    logicalClock,
    parentOperationId,
  }
}

export function hydrateWorkspaceCommand(serialized: SerializedEditorCommand): EditorCommand {
  const snapshot = structuredClone(serialized)
  return {
    id: snapshot.id,
    type: snapshot.type,
    label: snapshot.label,
    timestamp: snapshot.timestamp,
    execute: () => structuredClone(snapshot.after),
    undo: () => structuredClone(snapshot.before),
    redo: () => structuredClone(snapshot.after),
    serialize: () => structuredClone(snapshot),
  }
}

export function createSwapPluginCommand(before: WorkspaceDocument, after: WorkspaceDocument, layer: ArchitectureLayer, pluginId: string) {
  return createWorkspaceCommand({
    type: 'layer.plugin.swap',
    label: `Swap ${layer} plugin`,
    before,
    after,
    payload: { layer, pluginId },
  })
}

export function createRenameWorkspaceCommand(before: WorkspaceDocument, after: WorkspaceDocument, name: string) {
  return createWorkspaceCommand({
    type: 'workspace.rename',
    label: 'Rename workspace',
    before,
    after,
    payload: { name },
  })
}

export function createDomainEntityCommand(before: WorkspaceDocument, after: WorkspaceDocument, entityId: string, operation: 'create' | 'delete') {
  return createWorkspaceCommand({
    type: operation === 'create' ? 'domain.entity.create' : 'domain.entity.delete',
    label: operation === 'create' ? 'Create domain entity' : 'Delete domain entity',
    before,
    after,
    payload: { entityId },
  })
}

export function createDomainRelationshipCommand(before: WorkspaceDocument, after: WorkspaceDocument, relationshipId?: string) {
  return createWorkspaceCommand({
    type: 'domain.relationship.create',
    label: 'Create domain relationship',
    before,
    after,
    payload: { relationshipId },
  })
}

export function createCompositionStateCommand(before: WorkspaceDocument, after: WorkspaceDocument, operation = 'replace') {
  return createWorkspaceCommand({
    type: 'composition.state.replace',
    label: 'Update composition canvas',
    before,
    after,
    payload: { operation },
  })
}

export function createViewportCommand(
  state: EditorState,
  surfaceId: string,
  viewport: EditorViewportState,
) {
  return {
    id: `editor-runtime-command:${crypto.randomUUID()}`,
    label: 'Change viewport',
    createdAt: new Date().toISOString(),
    before: { rendering: { ...state.rendering } },
    after: {
      rendering: {
        ...state.rendering,
        viewportBySurface: {
          ...state.rendering.viewportBySurface,
          [surfaceId]: viewport,
        },
      },
    },
  }
}

export function createSelectCommand(state: EditorState, selection: EditorSelection) {
  return {
    id: `editor-runtime-command:${crypto.randomUUID()}`,
    label: 'Change selection',
    createdAt: new Date().toISOString(),
    before: { interaction: { ...state.interaction } },
    after: { interaction: { ...state.interaction, selection } },
  }
}

export function serializeCompositionPayload(state: CompositionState) {
  return {
    nodeCount: state.nodes.length,
    edgeCount: state.edges.length,
    groupCount: state.groups.length,
  }
}

export function serializeWorkspacePayload(workspace: Workspace) {
  return {
    workspaceId: workspace.id,
    version: workspace.version,
    layerCount: workspace.layers.length,
  }
}

export function serializeDomainPayload(registry: DomainRegistryState) {
  return {
    entityCount: registry.entities.length,
    relationshipCount: registry.relationships.length,
  }
}

export function executeEditorCommand(command: EditorCommand) {
  return { type: 'command/executed' as const, command: command.serialize() }
}

export function undoEditorCommand() {
  return { type: 'history/undo' as const }
}

export function redoEditorCommand() {
  return { type: 'history/redo' as const }
}
