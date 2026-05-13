import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'

export type DomainEntityKind =
  | 'requirement'
  | 'api'
  | 'databaseTable'
  | 'testCase'
  | 'incident'
  | 'service'
  | 'infrastructureComponent'

export type DomainEntityStatus = 'draft' | 'active' | 'at_risk' | 'deprecated' | 'resolved'

export type DomainEntityBase = {
  id: string
  kind: DomainEntityKind
  name: string
  description: string
  ownerTeam: string
  status: DomainEntityStatus
  tags: string[]
  metadata: Record<string, string | number | boolean>
  createdAt: string
  updatedAt: string
}

export type Requirement = DomainEntityBase & { kind: 'requirement' }
export type API = DomainEntityBase & { kind: 'api' }
export type DatabaseTable = DomainEntityBase & { kind: 'databaseTable' }
export type TestCase = DomainEntityBase & { kind: 'testCase' }
export type Incident = DomainEntityBase & { kind: 'incident' }
export type Service = DomainEntityBase & { kind: 'service' }
export type InfrastructureComponent = DomainEntityBase & { kind: 'infrastructureComponent' }

export type DomainEntity =
  | Requirement
  | API
  | DatabaseTable
  | TestCase
  | Incident
  | Service
  | InfrastructureComponent

export type DomainRelationship = {
  id: string
  sourceEntityId: string
  targetEntityId: string
  relationship: EnterpriseRelationshipType
  description: string
  createdAt: string
  updatedAt: string
}

export type DomainRegistryState = {
  entities: DomainEntity[]
  relationships: DomainRelationship[]
}

export type DomainEntityDraft = {
  kind: DomainEntityKind
  name: string
  description: string
  ownerTeam: string
  status: DomainEntityStatus
  tags: string[]
  metadata: Record<string, string | number | boolean>
}
