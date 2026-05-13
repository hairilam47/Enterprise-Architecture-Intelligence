import { architectureLayers } from '../types/architecture'
import type { ThreeCameraPreset } from '../three/threeCameraPresets'

type ThreeViewToolbarProps = {
  showLabels: boolean
  showWarnings: boolean
  showBottlenecks: boolean
  showDependencies: boolean
  layerFocus: string
  viewMode: 'stack' | 'topology'
  cameraPreset: ThreeCameraPreset
  lineOpacity: number
  nodeScale: number
  onShowLabelsChange: (show: boolean) => void
  onShowWarningsChange: (show: boolean) => void
  onShowBottlenecksChange: (show: boolean) => void
  onShowDependenciesChange: (show: boolean) => void
  onLayerFocusChange: (layer: string) => void
  onViewModeChange: (mode: 'stack' | 'topology') => void
  onCameraPresetChange: (preset: ThreeCameraPreset) => void
  onLineOpacityChange: (opacity: number) => void
  onNodeScaleChange: (scale: number) => void
  onResetCamera: () => void
  onFocusSelected: () => void
}

export function ThreeViewToolbar({
  showLabels,
  showWarnings,
  showBottlenecks,
  showDependencies,
  layerFocus,
  viewMode,
  cameraPreset,
  lineOpacity,
  nodeScale,
  onShowLabelsChange,
  onShowWarningsChange,
  onShowBottlenecksChange,
  onShowDependenciesChange,
  onLayerFocusChange,
  onViewModeChange,
  onCameraPresetChange,
  onLineOpacityChange,
  onNodeScaleChange,
  onResetCamera,
  onFocusSelected,
}: ThreeViewToolbarProps) {
  return (
    <div className="graph-toolbar three-toolbar" aria-label="Three view toolbar">
      <label>
        <span>Layer focus</span>
        <select value={layerFocus} onChange={(event) => onLayerFocusChange(event.target.value)}>
          <option value="">All layers</option>
          {architectureLayers.map((layer) => (
            <option key={layer} value={layer}>
              {layer}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>View</span>
        <select value={viewMode} onChange={(event) => onViewModeChange(event.target.value as 'stack' | 'topology')}>
          <option value="stack">Stack view</option>
          <option value="topology">Topology view</option>
        </select>
      </label>
      <label>
        <span>Camera</span>
        <select value={cameraPreset} onChange={(event) => onCameraPresetChange(event.target.value as ThreeCameraPreset)}>
          <option value="default">Default</option>
          <option value="front">Front</option>
          <option value="top">Top</option>
          <option value="angled">Angled</option>
          <option value="layer_focus">Layer focus</option>
          <option value="selected_node_focus">Selected node</option>
        </select>
      </label>
      <label className="toolbar-check">
        <input type="checkbox" checked={showLabels} onChange={(event) => onShowLabelsChange(event.target.checked)} />
        Labels
      </label>
      <label className="toolbar-check">
        <input type="checkbox" checked={showWarnings} onChange={(event) => onShowWarningsChange(event.target.checked)} />
        Warnings
      </label>
      <label className="toolbar-check">
        <input type="checkbox" checked={showBottlenecks} onChange={(event) => onShowBottlenecksChange(event.target.checked)} />
        Bottlenecks
      </label>
      <label className="toolbar-check">
        <input type="checkbox" checked={showDependencies} onChange={(event) => onShowDependenciesChange(event.target.checked)} />
        Lines
      </label>
      <label>
        <span>Line opacity</span>
        <input
          type="range"
          min="0.15"
          max="1"
          step="0.05"
          value={lineOpacity}
          onChange={(event) => onLineOpacityChange(Number(event.target.value))}
        />
      </label>
      <label>
        <span>Node size</span>
        <input
          type="range"
          min="0.75"
          max="1.8"
          step="0.05"
          value={nodeScale}
          onChange={(event) => onNodeScaleChange(Number(event.target.value))}
        />
      </label>
      <button type="button" onClick={onResetCamera}>Reset camera</button>
      <button type="button" onClick={onFocusSelected}>Focus selected</button>
    </div>
  )
}
