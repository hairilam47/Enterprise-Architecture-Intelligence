import type { DomainEntityDraft, DomainRegistryState } from '../../domain/domainTypes'
import type { EnterpriseRelationshipType } from '../../graph/enterpriseGraph'

export type DomainWorkspaceProps = {
  registry: DomainRegistryState
  selectedEntityId?: string
  onSelectEntity: (entityId: string) => void
  onCreateEntity: (draft: DomainEntityDraft) => void
  onDeleteEntity: (entityId: string) => void
  onCreateRelationship: (
    sourceEntityId: string,
    targetEntityId: string,
    relationship: EnterpriseRelationshipType,
    description: string,
  ) => void
}
