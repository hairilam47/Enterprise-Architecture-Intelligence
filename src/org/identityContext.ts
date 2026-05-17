import type { OrganizationRole } from './orgTypes'

export type IdentityContext = {
  userId: string
  displayName: string
  email?: string
  organizationId: string
  organizationName: string
  departmentId?: string
  teamId?: string
  roles: OrganizationRole[]
}

/** Mock identity used until a real auth provider is wired (Sprint 14+). */
export const MOCK_IDENTITY: IdentityContext = {
  userId: 'user-local',
  displayName: 'Local Architect',
  organizationId: 'org-northstar',
  organizationName: 'Northstar Enterprise',
  roles: ['admin'],
}
