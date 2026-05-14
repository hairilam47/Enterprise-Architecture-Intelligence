import type { EnterpriseRelationshipType } from '../../graph/enterpriseGraph'
import { relationshipOptions } from '../../composition/relationshipAuthoring'
import type { CompositionCanvasNode } from '../../composition/compositionTypes'

type RelationshipDrawerProps = {
  source?: CompositionCanvasNode
  target?: CompositionCanvasNode
  relationship: EnterpriseRelationshipType
  canCreateGraphRelationship: boolean
  onRelationshipChange: (relationship: EnterpriseRelationshipType) => void
  onConfirm: () => void
  onCancel: () => void
}

export function RelationshipDrawer({
  source,
  target,
  relationship,
  canCreateGraphRelationship,
  onRelationshipChange,
  onConfirm,
  onCancel,
}: RelationshipDrawerProps) {
  if (!source || !target) return null

  return (
    <div className="relationship-drawer panel" role="dialog" aria-label="Relationship authoring">
      <div>
        <p className="eyebrow">Relationship</p>
        <h2>{source.label} to {target.label}</h2>
      </div>
      <label>
        <span>Relationship type</span>
        <select value={relationship} onChange={(event) => onRelationshipChange(event.target.value as EnterpriseRelationshipType)}>
          {relationshipOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <p className="graph-explanation">
        {canCreateGraphRelationship
          ? 'This will create a domain relationship, then D3, Three.js, and traceability will update from the shared graph.'
          : 'Canvas-only preview: both endpoints need domain-backed entities before this can write into graph intelligence.'}
      </p>
      <div className="overlay-actions">
        <button type="button" onClick={onConfirm}>Create relationship</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
