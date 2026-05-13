import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { DomainRegistryState, DomainRelationship } from './domainTypes'

export function createDomainRelationship(
  state: DomainRegistryState,
  sourceEntityId: string,
  targetEntityId: string,
  relationship: EnterpriseRelationshipType,
  description = '',
): DomainRegistryState {
  if (!sourceEntityId || !targetEntityId || sourceEntityId === targetEntityId) {
    return state
  }

  const now = new Date().toISOString()
  const nextRelationship: DomainRelationship = {
    id: `domain-rel:${crypto.randomUUID()}`,
    sourceEntityId,
    targetEntityId,
    relationship,
    description,
    createdAt: now,
    updatedAt: now,
  }

  return { ...state, relationships: [nextRelationship, ...state.relationships] }
}

export function updateDomainRelationship(
  state: DomainRegistryState,
  relationshipId: string,
  patch: Partial<Pick<DomainRelationship, 'sourceEntityId' | 'targetEntityId' | 'relationship' | 'description'>>,
): DomainRegistryState {
  return {
    ...state,
    relationships: state.relationships.map((relationship) =>
      relationship.id === relationshipId
        ? { ...relationship, ...patch, updatedAt: new Date().toISOString() }
        : relationship,
    ),
  }
}

export function deleteDomainRelationship(state: DomainRegistryState, relationshipId: string): DomainRegistryState {
  return {
    ...state,
    relationships: state.relationships.filter((relationship) => relationship.id !== relationshipId),
  }
}

export function listRelationshipsForEntity(state: DomainRegistryState, entityId: string) {
  return state.relationships.filter(
    (relationship) => relationship.sourceEntityId === entityId || relationship.targetEntityId === entityId,
  )
}
