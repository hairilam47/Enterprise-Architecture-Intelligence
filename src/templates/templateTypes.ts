import type { DomainEntityKind, DomainEntityStatus } from '../domain/domainTypes'
import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { WorkflowMode } from '../workflow/workflowTypes'

export type StarterEntity = {
  key: string
  kind: DomainEntityKind
  name: string
  description: string
  ownerTeam: string
  status?: DomainEntityStatus
  tags?: string[]
  metadata?: Record<string, string | number | boolean>
}

export type StarterRelationship = {
  sourceKey: string
  targetKey: string
  relationship: EnterpriseRelationshipType
  description: string
}

export type WorkspaceTemplate = {
  id: string
  title: string
  description: string
  category: string
  recommendedMode?: WorkflowMode
  starterEntities?: StarterEntity[]
  starterRelationships?: StarterRelationship[]
  suggestedWorkflow?: string[]
}
