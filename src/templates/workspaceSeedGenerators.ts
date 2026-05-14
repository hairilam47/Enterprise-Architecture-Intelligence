import type { DomainEntity, DomainRegistryState, DomainRelationship } from '../domain/domainTypes'
import type { WorkspaceTemplate } from './templateTypes'

function entityId(templateId: string, key: string) {
  return `domain:${templateId}:${key}`
}

export function generateTemplateEntities(template: WorkspaceTemplate, now = new Date().toISOString()): DomainEntity[] {
  return (template.starterEntities ?? []).map((entity) => ({
    id: entityId(template.id, entity.key),
    kind: entity.kind,
    name: entity.name,
    description: entity.description,
    ownerTeam: entity.ownerTeam,
    status: entity.status ?? 'active',
    tags: entity.tags ?? [template.category],
    metadata: {
      templateId: template.id,
      starterKey: entity.key,
      ...(entity.metadata ?? {}),
    },
    createdAt: now,
    updatedAt: now,
  }) as DomainEntity)
}

export function generateTemplateRelationships(template: WorkspaceTemplate, now = new Date().toISOString()): DomainRelationship[] {
  return (template.starterRelationships ?? []).map((relationship) => ({
    id: `domain-rel:${template.id}:${relationship.sourceKey}:${relationship.targetKey}:${relationship.relationship}`,
    sourceEntityId: entityId(template.id, relationship.sourceKey),
    targetEntityId: entityId(template.id, relationship.targetKey),
    relationship: relationship.relationship,
    description: relationship.description,
    createdAt: now,
    updatedAt: now,
  }))
}

export function mergeTemplateIntoRegistry(registry: DomainRegistryState, template: WorkspaceTemplate): DomainRegistryState {
  const now = new Date().toISOString()
  const existingIds = new Set(registry.entities.map((entity) => entity.id))
  const existingRelationshipIds = new Set(registry.relationships.map((relationship) => relationship.id))
  const starterEntities = generateTemplateEntities(template, now).filter((entity) => !existingIds.has(entity.id))
  const starterRelationships = generateTemplateRelationships(template, now).filter(
    (relationship) => !existingRelationshipIds.has(relationship.id),
  )

  return {
    entities: [...starterEntities, ...registry.entities],
    relationships: [...starterRelationships, ...registry.relationships],
  }
}
