import type { CompositionCanvasNode, CompositionState, CanvasPoint } from './compositionTypes'
import { moveNode } from './layoutEngine'

export function selectNode(state: CompositionState, nodeId: string, append = false): CompositionState {
  const selectedNodeIds = append
    ? Array.from(new Set([...state.selection.selectedNodeIds, nodeId]))
    : [nodeId]

  return {
    ...state,
    nodes: state.nodes.map((node) => ({
      ...node,
      status: selectedNodeIds.includes(node.id) ? 'selected' : node.status === 'selected' ? 'normal' : node.status,
    })),
    selection: { ...state.selection, selectedNodeIds, selectedEdgeId: undefined },
  }
}

export function setHoveredNode(state: CompositionState, nodeId?: string): CompositionState {
  return { ...state, selection: { ...state.selection, hoveredNodeId: nodeId } }
}

export function addCanvasNode(state: CompositionState, node: CompositionCanvasNode): CompositionState {
  return {
    ...state,
    nodes: [node, ...state.nodes],
    selection: { ...state.selection, selectedNodeIds: [node.id] },
  }
}

export function updateCanvasNodePosition(state: CompositionState, nodeId: string, point: CanvasPoint): CompositionState {
  return moveNode(state, nodeId, point)
}

export function updateViewport(state: CompositionState, patch: Partial<CompositionState['viewport']>): CompositionState {
  return { ...state, viewport: { ...state.viewport, ...patch } }
}

export function toggleSnapToGrid(state: CompositionState): CompositionState {
  return { ...state, layout: { ...state.layout, snapToGrid: !state.layout.snapToGrid } }
}
