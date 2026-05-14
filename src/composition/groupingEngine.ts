import type { CanvasGroupKind, CompositionCanvasGroup, CompositionState } from './compositionTypes'
import { fitGroupBounds } from './layoutEngine'

export function createGroupFromSelection(
  state: CompositionState,
  kind: CanvasGroupKind,
  label: string,
): CompositionState {
  const selectedIds = state.selection.selectedNodeIds
  const selectedNodes = state.nodes.filter((node) => selectedIds.includes(node.id))

  if (selectedNodes.length === 0) return state

  const id = `group:${crypto.randomUUID()}`
  const bounds = fitGroupBounds(selectedNodes)
  const group: CompositionCanvasGroup = {
    id,
    label,
    kind,
    nodeIds: selectedNodes.map((node) => node.id),
    position: bounds.position,
    size: bounds.size,
    metadata: {
      ownership: kind === 'ownership_zone' ? 'team-owned' : 'architecture-owned',
      nodeCount: selectedNodes.length,
    },
    color: kind === 'security_zone' ? '#dc2626' : kind === 'environment' ? '#16a34a' : '#2563eb',
  }

  return {
    ...state,
    groups: [group, ...state.groups],
    nodes: state.nodes.map((node) =>
      selectedIds.includes(node.id) ? { ...node, groupId: id } : node,
    ),
    selection: {
      ...state.selection,
      selectedGroupId: id,
      selectedEdgeId: undefined,
    },
  }
}

export function updateGroup(
  state: CompositionState,
  groupId: string,
  patch: Partial<Pick<CompositionCanvasGroup, 'label' | 'kind' | 'color' | 'metadata'>>,
): CompositionState {
  return {
    ...state,
    groups: state.groups.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
  }
}

export function removeGroup(state: CompositionState, groupId: string): CompositionState {
  return {
    ...state,
    groups: state.groups.filter((group) => group.id !== groupId),
    nodes: state.nodes.map((node) => (node.groupId === groupId ? { ...node, groupId: undefined } : node)),
  }
}
