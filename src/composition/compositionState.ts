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

export function removeNode(state: CompositionState, nodeId: string): CompositionState {
  return {
    ...state,
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId),
    groups: state.groups.map((g) => ({ ...g, nodeIds: g.nodeIds.filter((id) => id !== nodeId) })),
    selection: {
      ...state.selection,
      selectedNodeIds: state.selection.selectedNodeIds.filter((id) => id !== nodeId),
      pendingConnection: state.selection.pendingConnection?.sourceNodeId === nodeId
        ? undefined
        : state.selection.pendingConnection,
    },
  }
}

export function removeEdge(state: CompositionState, edgeId: string): CompositionState {
  return {
    ...state,
    edges: state.edges.filter((e) => e.id !== edgeId),
    selection: {
      ...state.selection,
      selectedEdgeId: state.selection.selectedEdgeId === edgeId ? undefined : state.selection.selectedEdgeId,
    },
  }
}

export function removeSelectedItems(state: CompositionState): CompositionState {
  let next = state
  for (const nodeId of [...state.selection.selectedNodeIds]) {
    next = removeNode(next, nodeId)
  }
  if (state.selection.selectedEdgeId) {
    next = removeEdge(next, state.selection.selectedEdgeId)
  }
  return next
}

const DUPLICATE_OFFSET = 24

export function duplicateNodes(state: CompositionState, nodeIds: string[]): CompositionState {
  if (nodeIds.length === 0) return state
  const newNodes = nodeIds.flatMap((nodeId) => {
    const original = state.nodes.find((n) => n.id === nodeId)
    if (!original) return []
    return [{
      ...original,
      id: `canvas:${original.kind}:${crypto.randomUUID()}`,
      position: { x: original.position.x + DUPLICATE_OFFSET, y: original.position.y + DUPLICATE_OFFSET },
      enterpriseNodeId: undefined,
      domainEntityId: undefined,
      status: 'selected' as const,
    }]
  })
  if (newNodes.length === 0) return state

  return {
    ...state,
    nodes: [
      ...newNodes,
      ...state.nodes.map((n) => ({
        ...n,
        status: n.status === 'selected' ? ('normal' as const) : n.status,
      })),
    ],
    selection: { ...state.selection, selectedNodeIds: newNodes.map((n) => n.id) },
  }
}

export function updateNodeLabel(state: CompositionState, nodeId: string, label: string): CompositionState {
  return {
    ...state,
    nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, label } : n)),
  }
}

export function selectNodesInRect(
  state: CompositionState,
  rect: { x: number; y: number; width: number; height: number },
): CompositionState {
  const left = rect.width >= 0 ? rect.x : rect.x + rect.width
  const top = rect.height >= 0 ? rect.y : rect.y + rect.height
  const right = left + Math.abs(rect.width)
  const bottom = top + Math.abs(rect.height)
  const selectedNodeIds = state.nodes
    .filter((n) => n.position.x < right && n.position.x + n.size.width > left && n.position.y < bottom && n.position.y + n.size.height > top)
    .map((n) => n.id)
  return {
    ...state,
    nodes: state.nodes.map((n) => ({
      ...n,
      status: selectedNodeIds.includes(n.id) ? 'selected' : n.status === 'selected' ? 'normal' : n.status,
    })),
    selection: { ...state.selection, selectedNodeIds, selectedEdgeId: undefined, selectedGroupId: undefined },
  }
}

