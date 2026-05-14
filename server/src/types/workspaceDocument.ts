export type SavedWorkspaceSummary = {
  workspaceId: string
  name: string
  description: string
  schemaVersion: number
  version: number
  updatedAt: string
  savedAt?: string
}

export type WorkspaceDocument = {
  schemaVersion: number
  version: number
  workspaceId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  owner: Record<string, unknown>
  organizationContext: Record<string, unknown>
  layeredArchitectureState: Record<string, unknown>
  domainRegistryState: {
    entities: unknown[]
    relationships: unknown[]
  }
  compositionCanvasState: {
    nodes: unknown[]
    edges: unknown[]
    groups: unknown[]
  }
  auditEvents: unknown[]
  historySnapshots: unknown[]
  traceHighlightState: Record<string, unknown>
  validationState: Record<string, unknown>
  visualPreferences: Record<string, unknown>
  metadata: Record<string, unknown> & {
    savedAt?: string
  }
}

export type WorkspaceValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type WorkspaceApiError = {
  status: number
  type: string
  message: string
  details?: string[]
}
