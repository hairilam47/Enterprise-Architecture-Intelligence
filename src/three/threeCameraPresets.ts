import type { SpatialNode } from './sceneTypes'

export type ThreeCameraPreset =
  | 'default'
  | 'front'
  | 'top'
  | 'angled'
  | 'layer_focus'
  | 'selected_node_focus'

export type CameraPresetConfig = {
  position: [number, number, number]
  target: [number, number, number]
}

export function getCameraPreset(
  preset: ThreeCameraPreset,
  selectedNode?: SpatialNode,
  layerYPosition = 3.8,
): CameraPresetConfig {
  if (preset === 'front') {
    return { position: [0, 4.2, 9.5], target: [0, 3.4, 0] }
  }

  if (preset === 'top') {
    return { position: [0, 11, 0.01], target: [0, 3.5, 0] }
  }

  if (preset === 'angled') {
    return { position: [5.8, 7.4, 7.4], target: [0, 3.2, 0] }
  }

  if (preset === 'layer_focus') {
    return { position: [3.8, layerYPosition + 2.2, 5.8], target: [0, layerYPosition, 0] }
  }

  if (preset === 'selected_node_focus' && selectedNode) {
    return {
      position: [
        selectedNode.position.x + 2.6,
        selectedNode.position.y + 2.1,
        selectedNode.position.z + 4,
      ],
      target: [selectedNode.position.x, selectedNode.position.y, selectedNode.position.z],
    }
  }

  return { position: [3.8, 7.2, 7.8], target: [0, 3.2, 0] }
}
