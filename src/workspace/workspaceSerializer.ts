import type { CompositionState } from '../composition/compositionTypes'
import type { DomainRegistryState } from '../domain/domainTypes'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import type { ValidationResult, Workspace, WorkspaceHistoryEntry } from '../types/architecture'
import type { AuditEvent } from '../types/audit'
import type { CommandHistoryState } from '../editor/commandHistory'
import type { EditorEvent } from '../editor/editorEvents'
import type { WorkspaceCheckpoint } from './workspaceCheckpoints'
import type { WorkspaceSnapshot } from './workspaceSnapshots'
import { CURRENT_SCHEMA_VERSION, migrateWorkspaceDocument } from './workspaceMigration'
import { validateWorkspaceDocument } from './workspaceValidation'
import type { WorkspaceDocument, WorkspaceVisualPreferences } from './workspaceDocument'

export type CreateWorkspaceDocumentInput = {
  workspace: Workspace
  domainRegistry: DomainRegistryState
  compositionState: CompositionState
  auditEvents: AuditEvent[]
  history: WorkspaceHistoryEntry[]
  commandHistory?: CommandHistoryState
  workspaceSnapshots?: WorkspaceSnapshot[]
  workspaceCheckpoints?: WorkspaceCheckpoint[]
  editorEvents?: EditorEvent[]
  traceHighlight: TraceHighlightState
  validation: ValidationResult
  visualPreferences: WorkspaceVisualPreferences
  metadata?: Partial<WorkspaceDocument['metadata']>
}

export function createWorkspaceDocument({
  workspace,
  domainRegistry,
  compositionState,
  auditEvents,
  history,
  commandHistory,
  workspaceSnapshots,
  workspaceCheckpoints,
  editorEvents,
  traceHighlight,
  validation,
  visualPreferences,
  metadata,
}: CreateWorkspaceDocumentInput): WorkspaceDocument {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    version: workspace.version,
    workspaceId: workspace.id,
    name: workspace.name,
    description: workspace.description,
    createdAt: history.at(-1)?.createdAt ?? workspace.updatedAt,
    updatedAt: workspace.updatedAt,
    owner: {
      displayName: 'Local Workspace Owner',
    },
    organizationContext: {
      organizationId: workspace.organizationId,
      organizationName: 'Northstar Enterprise',
    },
    layeredArchitectureState: structuredClone(workspace),
    domainRegistryState: structuredClone(domainRegistry),
    compositionCanvasState: structuredClone(compositionState),
    auditEvents: structuredClone(auditEvents),
    historySnapshots: structuredClone(history),
    commandHistoryState: commandHistory ? structuredClone(commandHistory) : undefined,
    workspaceSnapshots: workspaceSnapshots ? structuredClone(workspaceSnapshots) : [],
    workspaceCheckpoints: workspaceCheckpoints ? structuredClone(workspaceCheckpoints) : [],
    editorEvents: editorEvents ? structuredClone(editorEvents) : [],
    traceHighlightState: structuredClone(traceHighlight),
    validationState: structuredClone(validation),
    visualPreferences: structuredClone(visualPreferences),
    metadata: {
      source: 'local-memory',
      ...metadata,
    },
  }
}

export function serializeWorkspace(document: WorkspaceDocument) {
  return JSON.stringify(document, null, 2)
}

export function deserializeWorkspace(json: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return {
      document: undefined,
      errors: ['Import file is not valid JSON.'],
      warnings: [],
    }
  }

  const migration = migrateWorkspaceDocument(parsed)
  if (!migration.document) {
    return { document: undefined, errors: migration.errors, warnings: migration.warnings }
  }

  const validation = validateWorkspaceDocument(migration.document)
  return {
    document: validation.valid ? migration.document : undefined,
    errors: validation.errors,
    warnings: [...migration.warnings, ...validation.warnings],
  }
}

export function cloneWorkspaceDocument(document: WorkspaceDocument, name = `${document.name} Copy`): WorkspaceDocument {
  const now = new Date().toISOString()
  const workspaceId = `workspace-${crypto.randomUUID()}`
  return {
    ...structuredClone(document),
    version: 1,
    workspaceId,
    name,
    createdAt: now,
    updatedAt: now,
    layeredArchitectureState: {
      ...structuredClone(document.layeredArchitectureState),
      id: workspaceId,
      name,
      updatedAt: now,
      version: document.layeredArchitectureState.version + 1,
    },
    metadata: {
      ...document.metadata,
      source: 'localStorage',
      duplicatedFromWorkspaceId: document.workspaceId,
      savedAt: now,
    },
  }
}

export function resetWorkspaceDocument(document: WorkspaceDocument): WorkspaceDocument {
  const now = new Date().toISOString()
  return {
    ...structuredClone(document),
    version: document.version + 1,
    updatedAt: now,
    metadata: {
      ...document.metadata,
      source: 'reset',
      savedAt: undefined,
    },
  }
}
