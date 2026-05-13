export type AuditEventAction =
  | 'workspace.created'
  | 'workspace.versioned'
  | 'workspace.updated'
  | 'plugin.swapped'
  | 'simulation.ran'
  | 'validation.ran'
  | 'comparison.snapshot.created'
  | 'assistant.note.created'

export type AuditEvent = {
  id: string
  organizationId: string
  workspaceId?: string
  actorUserId?: string
  action: AuditEventAction
  subjectId: string
  metadata: Record<string, string | number | boolean | null>
  createdAt: string
}
