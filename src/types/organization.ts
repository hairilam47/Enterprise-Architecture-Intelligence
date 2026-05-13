export type RoleScope = 'organization' | 'department' | 'team' | 'workspace'

export type Role = {
  id: string
  name: string
  scope: RoleScope
  permissions: string[]
}

export type User = {
  id: string
  organizationId: string
  displayName: string
  email: string
  roleIds: string[]
  teamIds: string[]
  isActive: boolean
}

export type Team = {
  id: string
  departmentId: string
  name: string
  leadUserId?: string
  memberUserIds: string[]
}

export type Department = {
  id: string
  organizationId: string
  name: string
  ownerUserId?: string
  teamIds: string[]
}

export type Organization = {
  id: string
  name: string
  domain: string
  departmentIds: string[]
  workspaceIds: string[]
  createdAt: string
}
