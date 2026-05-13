import type { DomainEntity, DomainEntityDraft, DomainEntityKind, DomainRegistryState } from './domainTypes'

export const initialDomainRegistry: DomainRegistryState = {
  entities: [
    {
      id: 'domain:req-executive-insight',
      kind: 'requirement',
      name: 'Executive Insight Requirement',
      description: 'Leadership needs trustworthy enterprise intelligence across layers.',
      ownerTeam: 'Business Architecture',
      status: 'active',
      tags: ['executive', 'intelligence'],
      metadata: { priority: 'high' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'domain:api-intelligence-mesh',
      kind: 'api',
      name: 'Intelligence Mesh API',
      description: 'API surface for graph-backed enterprise intelligence retrieval.',
      ownerTeam: 'Integration Platform',
      status: 'active',
      tags: ['api', 'mesh'],
      metadata: { version: 'v1' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'domain:data-architecture-facts',
      kind: 'databaseTable',
      name: 'architecture_facts',
      description: 'Curated table for architecture facts and simulation outputs.',
      ownerTeam: 'Data Platform',
      status: 'active',
      tags: ['lakehouse', 'facts'],
      metadata: { schema: 'enterprise' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  relationships: [
    {
      id: 'domain-rel:req-api',
      sourceEntityId: 'domain:req-executive-insight',
      targetEntityId: 'domain:api-intelligence-mesh',
      relationship: 'depends_on',
      description: 'Requirement depends on API access to graph intelligence.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'domain-rel:api-data',
      sourceEntityId: 'domain:api-intelligence-mesh',
      targetEntityId: 'domain:data-architecture-facts',
      relationship: 'stores',
      description: 'API stores normalized architecture observations.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
}

export function createEntity(state: DomainRegistryState, draft: DomainEntityDraft): DomainRegistryState {
  const now = new Date().toISOString()
  const entity: DomainEntity = {
    ...draft,
    id: `domain:${draft.kind}:${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now,
  } as DomainEntity

  return { ...state, entities: [entity, ...state.entities] }
}

export function updateEntity(
  state: DomainRegistryState,
  entityId: string,
  patch: Partial<DomainEntityDraft>,
): DomainRegistryState {
  return {
    ...state,
    entities: state.entities.map((entity) =>
      entity.id === entityId ? ({ ...entity, ...patch, updatedAt: new Date().toISOString() } as DomainEntity) : entity,
    ),
  }
}

export function deleteEntity(state: DomainRegistryState, entityId: string): DomainRegistryState {
  return {
    entities: state.entities.filter((entity) => entity.id !== entityId),
    relationships: state.relationships.filter(
      (relationship) => relationship.sourceEntityId !== entityId && relationship.targetEntityId !== entityId,
    ),
  }
}

export function listEntitiesByDomain(state: DomainRegistryState, kind: DomainEntityKind) {
  return state.entities.filter((entity) => entity.kind === kind)
}

export function getEntityById(state: DomainRegistryState, entityId: string) {
  return state.entities.find((entity) => entity.id === entityId)
}
