import { useState } from 'react'
import type { EnterpriseRelationshipType } from '../../graph/enterpriseGraph'
import type { DomainRegistryState } from '../../domain/domainTypes'

type RelationshipEditorProps = {
  registry: DomainRegistryState
  onCreateRelationship: (
    sourceEntityId: string,
    targetEntityId: string,
    relationship: EnterpriseRelationshipType,
    description: string,
  ) => void
}

const relationships: EnterpriseRelationshipType[] = [
  'depends_on',
  'calls',
  'stores',
  'validated_by',
  'deployed_on',
  'causes',
]

export function RelationshipEditor({ registry, onCreateRelationship }: RelationshipEditorProps) {
  const [sourceId, setSourceId] = useState(registry.entities[0]?.id ?? '')
  const [targetId, setTargetId] = useState(registry.entities[1]?.id ?? '')
  const [relationship, setRelationship] = useState<EnterpriseRelationshipType>('depends_on')
  const [description, setDescription] = useState('')

  return (
    <aside className="panel relationship-editor" aria-label="Relationship editor">
      <div className="panel__header">
        <p className="eyebrow">Relationship Builder</p>
        <h2>Connect entities to graph</h2>
      </div>
      <div className="relationship-form">
        <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
          {registry.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
        </select>
        <select value={relationship} onChange={(event) => setRelationship(event.target.value as EnterpriseRelationshipType)}>
          {relationships.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
        </select>
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {registry.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
        </select>
        <input value={description} placeholder="Relationship note" onChange={(event) => setDescription(event.target.value)} />
        <button type="button" onClick={() => onCreateRelationship(sourceId, targetId, relationship, description)}>
          Create relationship
        </button>
      </div>
      <ol className="timeline-list compact">
        {registry.relationships.slice(0, 8).map((item) => {
          const source = registry.entities.find((entity) => entity.id === item.sourceEntityId)
          const target = registry.entities.find((entity) => entity.id === item.targetEntityId)
          return (
            <li key={item.id}>
              <span>{item.relationship}</span>
              <strong>{source?.name ?? 'Unknown'} to {target?.name ?? 'Unknown'}</strong>
              <small>graph</small>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
