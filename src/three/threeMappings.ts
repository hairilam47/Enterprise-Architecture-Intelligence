import { architectureLayers } from '../types/architecture'
import { nodeTypeColors, type VisualNode } from '../visualization/visualGraph'
import type { SpatialStatus } from './sceneTypes'

export const layerOrder = architectureLayers

export const layerColors: Record<string, string> = {
  Business: '#2563eb',
  Application: '#7c3aed',
  Integration: '#0891b2',
  Data: '#16a34a',
  Infrastructure: '#475569',
  Hardware: '#ea580c',
  Operations: '#0284c7',
  Support: '#64748b',
}

export function getLayerPosition(layer?: string) {
  const index = layer ? layerOrder.indexOf(layer as (typeof architectureLayers)[number]) : -1
  return index >= 0 ? (layerOrder.length - index - 1) * 1.35 : -1.35
}

export function getLayerColor(layer?: string) {
  return layerColors[layer ?? 'Support'] ?? layerColors.Support
}

export function getNodeColor(node: VisualNode) {
  return nodeTypeColors[node.type] ?? '#64748b'
}

export function getNodeSize(node: VisualNode) {
  const latency = node.metadata.metrics?.latency ?? 0
  return Math.max(0.18, Math.min(0.42, 0.2 + latency / 420))
}

export function getSpatialStatus(
  node: VisualNode,
  selectedNodeId?: string,
  warningNodeIds = new Set<string>(),
  bottleneckNodeIds = new Set<string>(),
): SpatialStatus {
  if (selectedNodeId === node.id) {
    return 'selected'
  }

  if (warningNodeIds.has(node.id) || node.status === 'warning') {
    return 'warning'
  }

  if (bottleneckNodeIds.has(node.id) || node.status === 'critical') {
    return 'bottleneck'
  }

  return 'normal'
}
