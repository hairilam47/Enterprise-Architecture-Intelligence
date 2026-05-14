import type { CompositionState } from '../../composition/compositionTypes'

type CompositionToolbarProps = {
  state: CompositionState
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onAutoLayoutLayer: () => void
  onAutoLayoutRelationship: () => void
  onToggleSnap: () => void
  onGroupSelection: () => void
}

export function CompositionToolbar({
  state,
  onZoomIn,
  onZoomOut,
  onResetView,
  onAutoLayoutLayer,
  onAutoLayoutRelationship,
  onToggleSnap,
  onGroupSelection,
}: CompositionToolbarProps) {
  return (
    <div className="composition-toolbar">
      <div>
        <p className="eyebrow">Composition Canvas</p>
        <h2>Visual enterprise authoring</h2>
      </div>
      <div className="composition-toolbar__actions">
        <button type="button" onClick={onZoomOut} aria-label="Zoom out">-</button>
        <span>{Math.round(state.viewport.zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in">+</button>
        <button type="button" onClick={onResetView}>Reset view</button>
        <button type="button" onClick={onAutoLayoutLayer}>Layer layout</button>
        <button type="button" onClick={onAutoLayoutRelationship}>Relationship layout</button>
        <button type="button" className={state.layout.snapToGrid ? 'is-active' : ''} onClick={onToggleSnap}>
          Snap
        </button>
        <button type="button" onClick={onGroupSelection} disabled={state.selection.selectedNodeIds.length === 0}>
          Group selection
        </button>
      </div>
    </div>
  )
}
