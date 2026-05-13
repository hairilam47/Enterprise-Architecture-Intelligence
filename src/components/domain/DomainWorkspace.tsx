import type { DomainEntityDraft, DomainEntityKind, DomainRegistryState } from '../../domain/domainTypes'
import { listRelationshipsForEntity } from '../../domain/relationshipBuilder'
import type { EnterpriseRelationshipType } from '../../graph/enterpriseGraph'
import { EntityForm } from './EntityForm'
import { RelationshipEditor } from './RelationshipEditor'

type DomainWorkspaceProps = {
  title: string
  kind: DomainEntityKind
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

export function DomainWorkspace({
  title,
  kind,
  registry,
  selectedEntityId,
  onSelectEntity,
  onCreateEntity,
  onDeleteEntity,
  onCreateRelationship,
}: DomainWorkspaceProps) {
  const entities = registry.entities.filter((entity) => entity.kind === kind)
  const selectedEntity = entities.find((entity) => entity.id === selectedEntityId) ?? entities[0]
  const relatedRelationships = selectedEntity ? listRelationshipsForEntity(registry, selectedEntity.id) : []

  return (
    <section className="domain-workspace panel" aria-label={`${title} workspace`}>
      <div className="comparison-panel__header">
        <div>
          <p className="eyebrow">Domain Workspace</p>
          <h2>{title}</h2>
        </div>
        <span className="domain-count">{entities.length} entities</span>
      </div>
      <div className="domain-layout">
        <div>
          <EntityForm kind={kind} onSubmit={onCreateEntity} />
          <div className="domain-list">
            {entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                className={selectedEntity?.id === entity.id ? 'is-active' : ''}
                onClick={() => onSelectEntity(entity.id)}
              >
                <strong>{entity.name}</strong>
                <span>{entity.ownerTeam} · {entity.status}</span>
              </button>
            ))}
          </div>
        </div>
        <aside className="panel domain-inspector">
          <div className="panel__header">
            <p className="eyebrow">Entity Inspector</p>
            <h2>{selectedEntity?.name ?? 'No entity selected'}</h2>
          </div>
          {selectedEntity ? (
            <>
              <p>{selectedEntity.description}</p>
              <dl className="inspector-grid">
                <div><dt>Owner</dt><dd>{selectedEntity.ownerTeam}</dd></div>
                <div><dt>Status</dt><dd>{selectedEntity.status}</dd></div>
                <div><dt>Graph node</dt><dd>{selectedEntity.id}</dd></div>
              </dl>
              <p className="comparison-summary">Tags: {selectedEntity.tags.join(', ') || 'None'}</p>
              <h3>Graph links</h3>
              <ol className="compact-list">
                {relatedRelationships.length ? relatedRelationships.map((relationship) => (
                  <li key={relationship.id}>
                    <span>{relationship.relationship}</span>
                    <strong>{relationship.sourceEntityId === selectedEntity.id ? 'outbound' : 'inbound'}</strong>
                  </li>
                )) : <li><span>No relationships yet</span><strong>isolated</strong></li>}
              </ol>
              <button type="button" onClick={() => onDeleteEntity(selectedEntity.id)}>Delete entity</button>
            </>
          ) : <p className="empty-state">Create an entity to add it to the enterprise graph.</p>}
        </aside>
        <RelationshipEditor registry={registry} onCreateRelationship={onCreateRelationship} />
      </div>
    </section>
  )
}
