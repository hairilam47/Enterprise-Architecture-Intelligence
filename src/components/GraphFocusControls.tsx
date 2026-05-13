import type { GraphFocusMode } from '../visualization/graphFocus'

type GraphFocusControlsProps = {
  onFocusModeChange: (mode: GraphFocusMode) => void
}

export function GraphFocusControls({ onFocusModeChange }: GraphFocusControlsProps) {
  return (
    <div className="focus-controls" aria-label="Graph focus controls">
      <button type="button" onClick={() => onFocusModeChange('full_graph')}>
        Full graph
      </button>
      <button type="button" onClick={() => onFocusModeChange('selected_neighborhood')}>
        Selected node
      </button>
      <button type="button" onClick={() => onFocusModeChange('critical_path')}>
        Critical path
      </button>
      <button type="button" onClick={() => onFocusModeChange('bottlenecks_only')}>
        Bottlenecks
      </button>
      <button type="button" onClick={() => onFocusModeChange('warnings_only')}>
        Warnings
      </button>
    </div>
  )
}
