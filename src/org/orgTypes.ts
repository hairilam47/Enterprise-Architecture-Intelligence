export type OrganizationRole = 'admin' | 'editor' | 'viewer' | 'guest'

export type Organization = {
  id: string
  name: string
  slug: string
  createdAt: string
}

export type Department = {
  id: string
  organizationId: string
  name: string
  parentDepartmentId?: string
}

export type TeamMember = {
  userId: string
  displayName: string
  role: OrganizationRole
  joinedAt: string
}

export type Team = {
  id: string
  organizationId: string
  departmentId?: string
  name: string
  members: TeamMember[]
}
