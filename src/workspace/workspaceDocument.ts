import type { CompositionState } from '../composition/compositionTypes'
import type { CommandHistoryState } from '../editor/commandHistory'
import type { EditorEvent } from '../editor/editorEvents'
import type { DomainRegistryState } from '../domain/domainTypes'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import type { ValidationResult, Workspace, WorkspaceHistoryEntry } from '../types/architecture'
import type { AuditEvent } from '../types/audit'
import type { WorkspaceCheckpoint } from './workspaceCheckpoints'
import type { WorkspaceSnapshot } from './workspaceSnapshots'

export type WorkspaceOrganizationContext = {
  organizationId: string
  organizationName: string
  departmentId?: string
  departmentName?: string
  teamId?: string
  teamName?: string
}

export type WorkspaceVisualPreferences = {
  activeWorkspaceView: 'architecture' | 'domain' | 'graph' | 'traceability' | 'composition'
  activeGraphView: 'd3' | 'three'
  activeDomainKind: string
}

export type WorkspaceDocumentMetadata = {
  source: 'localStorage' | 'mockApi' | 'api' | 'import' | 'reset' | 'local-memory'
  savedAt?: string
  duplicatedFromWorkspaceId?: string
  notes?: string
}

export type WorkspaceDocument = {
  schemaVersion: number
  version: number
  workspaceId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  owner: {
    userId?: string
    displayName: string
  }
  organizationContext: WorkspaceOrganizationContext
  layeredArchitectureState: Workspace
  domainRegistryState: DomainRegistryState
  compositionCanvasState: CompositionState
  auditEvents: AuditEvent[]
  historySnapshots: WorkspaceHistoryEntry[]
  commandHistoryState?: CommandHistoryState
  workspaceSnapshots?: WorkspaceSnapshot[]
  workspaceCheckpoints?: WorkspaceCheckpoint[]
  editorEvents?: EditorEvent[]
  traceHighlightState: TraceHighlightState
  validationState: ValidationResult
  visualPreferences: WorkspaceVisualPreferences
  metadata: WorkspaceDocumentMetadata & Record<string, string | number | boolean | undefined>
}

export type WorkspaceDocumentApplyResult = {
  workspace: Workspace
  domainRegistry: DomainRegistryState
  compositionState: CompositionState
  auditEvents: AuditEvent[]
  history: WorkspaceHistoryEntry[]
  traceHighlight: TraceHighlightState
  visualPreferences: WorkspaceVisualPreferences
}
