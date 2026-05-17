import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { IdentityContext } from './identityContext'

export function canRead(identity: IdentityContext | null): boolean {
  return identity !== null
}

export function canWrite(identity: IdentityContext | null): boolean {
  if (!identity) return false
  return identity.roles.some((r) => r === 'admin' || r === 'editor')
}

export function canAdmin(identity: IdentityContext | null): boolean {
  if (!identity) return false
  return identity.roles.includes('admin')
}

/**
 * Returns true when the identity may edit the given workspace.
 * Admins can edit any workspace; editors can only edit workspaces
 * belonging to their own organisation.
 */
export function canEditWorkspace(
  identity: IdentityContext | null,
  document: WorkspaceDocument,
): boolean {
  if (!canWrite(identity)) return false
  if (canAdmin(identity)) return true
  return document.organizationContext.organizationId === identity?.organizationId
}
