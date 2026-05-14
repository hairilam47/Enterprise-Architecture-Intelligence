import type { CanvasGroupKind, CompositionCanvasGroup } from '../../composition/compositionTypes'

type GroupEditorProps = {
  group?: CompositionCanvasGroup
  onUpdate: (patch: Partial<Pick<CompositionCanvasGroup, 'label' | 'kind' | 'color'>>) => void
  onUngroup: () => void
}

const groupKinds: CanvasGroupKind[] = ['subsystem', 'bounded_context', 'environment', 'ownership_zone', 'security_zone']
const colors = ['#2563eb', '#0891b2', '#16a34a', '#7c3aed', '#dc2626', '#475569']

export function GroupEditor({ group, onUpdate, onUngroup }: GroupEditorProps) {
  return (
    <aside className="panel group-editor">
      <div className="panel__header">
        <p className="eyebrow">Group Editor</p>
        <h2>{group ? group.label : 'Select a group'}</h2>
      </div>

      {!group ? (
        <p className="empty-state">Select a group on the canvas or use Group selection to create one.</p>
      ) : (
        <div className="group-editor-form">
          <label>
            <span>Name</span>
            <input value={group.label} onChange={(event) => onUpdate({ label: event.target.value })} />
          </label>
          <label>
            <span>Group type</span>
            <select value={group.kind} onChange={(event) => onUpdate({ kind: event.target.value as CanvasGroupKind })}>
              {groupKinds.map((kind) => (
                <option key={kind} value={kind}>{kind.replaceAll('_', ' ')}</option>
              ))}
            </select>
          </label>
          <div>
            <span className="field-label">Color</span>
            <div className="color-swatch-row">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={group.color === color ? 'is-active' : ''}
                  style={{ background: color }}
                  aria-label={`Set group color ${color}`}
                  onClick={() => onUpdate({ color })}
                />
              ))}
            </div>
          </div>
          <ul className="compact-list">
            <li><span>Children</span><strong>{group.nodeIds.length}</strong></li>
            <li><span>Type</span><strong>{group.kind.replaceAll('_', ' ')}</strong></li>
          </ul>
          <button type="button" onClick={onUngroup}>Ungroup nodes</button>
        </div>
      )}
    </aside>
  )
}
