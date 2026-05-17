export type SavedWorkspaceSummary = {
  workspaceId: string
  name: string
  description: string
  schemaVersion: number
  version: number
  updatedAt: string
  savedAt?: string
}

export type WorkspaceOwner = {
  userId?: string
  displayName: string
}

export type WorkspaceOrganizationContext = {
  organizationId: string
  organizationName: string
  departmentId?: string
  departmentName?: string
  teamId?: string
  teamName?: string
}

export type WorkspaceDocument = {
  schemaVersion: number
  version: number
  workspaceId: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  owner: WorkspaceOwner
  organizationContext: WorkspaceOrganizationContext
  layeredArchitectureState: { id: string; organizationId: string; name: string; version: number; layers: { layer: string; pluginId: string }[] } & Record<string, unknown>
  domainRegistryState: {
    entities: { id: string; kind: string; name: string; status: string }[]
    relationships: { id: string; sourceEntityId: string; targetEntityId: string; relationship: string }[]
  }
  compositionCanvasState: {
    nodes: { id: string; label: string; kind: string; position: { x: number; y: number } }[]
    edges: { id: string; sourceNodeId: string; targetNodeId: string }[]
    groups: { id: string; label: string; nodeIds: string[] }[]
  }
  auditEvents: { id: string; action: string; actorUserId?: string; createdAt: string }[]
  historySnapshots: unknown[]
  traceHighlightState: {
    selectedTracePath?: { id: string; nodeIds: string[]; edgeIds: string[] } | null
    impactedEntityIds?: string[]
    missingLinkNodeIds?: string[]
    riskSeverity?: string
  }
  validationState: { valid?: boolean; errors?: string[]; warnings?: string[] } & Record<string, unknown>
  visualPreferences: { activeWorkspaceView?: string; activeGraphView?: string; activeDomainKind?: string } & Record<string, unknown>
  metadata: Record<string, unknown> & {
    source?: string
    savedAt?: string
  }
  commandHistoryState?: unknown
  workspaceSnapshots?: unknown[]
  workspaceCheckpoints?: unknown[]
  editorEvents?: unknown[]
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
