import type { CompositionState } from '../../composition/compositionTypes'

type CompositionToolbarProps = {
  state: CompositionState
  canUndo: boolean
  canRedo: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onAutoLayoutLayer: () => void
  onAutoLayoutRelationship: () => void
  onToggleSnap: () => void
  onGroupSelection: () => void
  onUndo: () => void
  onRedo: () => void
  onDeleteSelected: () => void
  onDuplicateSelected: () => void
}

export function CompositionToolbar({
  state,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onResetView,
  onAutoLayoutLayer,
  onAutoLayoutRelationship,
  onToggleSnap,
  onGroupSelection,
  onUndo,
  onRedo,
  onDeleteSelected,
  onDuplicateSelected,
}: CompositionToolbarProps) {
  const hasSelection = state.selection.selectedNodeIds.length > 0 || !!state.selection.selectedEdgeId

  return (
    <div className="composition-toolbar">
      <div>
        <p className="eyebrow">Composition Canvas</p>
        <h2>Visual enterprise authoring</h2>
      </div>
      <div className="composition-toolbar__actions">
        <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo (Ctrl+Z)" title="Undo">↩</button>
        <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo (Ctrl+Shift+Z)" title="Redo">↪</button>
        <button type="button" onClick={onDeleteSelected} disabled={!hasSelection} aria-label="Delete selected (Del)" title="Delete">✕ Delete</button>
        <button type="button" onClick={onDuplicateSelected} disabled={state.selection.selectedNodeIds.length === 0} aria-label="Duplicate selected (Ctrl+D)" title="Duplicate">⧉ Duplicate</button>
        <span className="composition-toolbar__divider" />
        <button type="button" onClick={onZoomOut} aria-label="Zoom out">-</button>
        <span>{Math.round(state.viewport.zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} aria-label="Zoom in">+</button>
        <button type="button" onClick={onResetView}>Reset view</button>
        <span className="composition-toolbar__divider" />
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
