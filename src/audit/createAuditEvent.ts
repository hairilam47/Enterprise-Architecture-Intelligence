import type { AuditEvent, AuditEventAction } from '../types/audit'
import type { Workspace } from '../types/architecture'

type CreateAuditEventInput = {
  workspace: Workspace
  action: AuditEventAction
  subjectId?: string
  actorUserId?: string
  metadata?: AuditEvent['metadata']
}

export function createAuditEvent({
  workspace,
  action,
  subjectId = workspace.id,
  actorUserId,
  metadata = {},
}: CreateAuditEventInput): AuditEvent {
  const createdAt = new Date().toISOString()

  return {
    id: `audit-${createdAt}-${crypto.randomUUID()}`,
    organizationId: workspace.organizationId,
    workspaceId: workspace.id,
    actorUserId,
    action,
    subjectId,
    metadata: {
      workspaceVersion: workspace.version,
      ...metadata,
    },
    createdAt,
  }
}
