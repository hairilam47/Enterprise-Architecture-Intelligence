import type { EnterpriseEdge, EnterpriseNode, EnterpriseNodeType } from '../graph/enterpriseGraph'
import type { DomainEntity, DomainRelationship } from './domainTypes'

const entityNodeType: Record<DomainEntity['kind'], EnterpriseNodeType> = {
  requirement: 'requirement',
  api: 'api',
  databaseTable: 'database',
  testCase: 'testcase',
  incident: 'incident',
  service: 'service',
  infrastructureComponent: 'infrastructure',
}

const entityLayer: Record<DomainEntity['kind'], string> = {
  requirement: 'Business',
  api: 'Integration',
  databaseTable: 'Data',
  testCase: 'Operations',
  incident: 'Operations',
  service: 'Application',
  infrastructureComponent: 'Infrastructure',
}

function mapStatus(status: DomainEntity['status']): EnterpriseNode['status'] {
  if (status === 'at_risk') return 'warning'
  if (status === 'deprecated') return 'critical'
  if (status === 'draft') return 'unknown'
  return 'healthy'
}

export function entityToGraphNode(entity: DomainEntity): EnterpriseNode {
  return {
    id: entity.id,
    label: entity.name,
    type: entityNodeType[entity.kind],
    owner: entity.ownerTeam,
    layer: entityLayer[entity.kind],
    status: mapStatus(entity.status),
    metadata: {
      domainKind: entity.kind,
      description: entity.description,
      tags: entity.tags.join(', '),
      ...entity.metadata,
    },
  }
}

export function relationshipToGraphEdge(relationship: DomainRelationship): EnterpriseEdge {
  return {
    id: relationship.id,
    sourceId: relationship.sourceEntityId,
    targetId: relationship.targetEntityId,
    relationship: relationship.relationship,
    weight: relationship.relationship === 'causes' ? 3 : 2,
    label: relationship.description,
    metadata: {
      source: 'domain',
      description: relationship.description,
    },
  }
}

export function entitiesToGraphNodes(entities: DomainEntity[]) {
  return entities.map(entityToGraphNode)
}

export function domainRelationshipsToGraphEdges(relationships: DomainRelationship[]) {
  return relationships.map(relationshipToGraphEdge)
}
