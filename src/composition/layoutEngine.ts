import type { CompositionCanvasNode, CompositionState, CanvasPoint } from './compositionTypes'

const layerOrder = ['Business', 'Application', 'Integration', 'Data', 'Infrastructure', 'Hardware', 'Operations']

export function snapPoint(point: CanvasPoint, gridSize: number) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  }
}

export function getLayerPosition(layer?: string) {
  const index = Math.max(0, layerOrder.indexOf(layer ?? 'Application'))
  return {
    x: 80 + (index % 4) * 260,
    y: 90 + Math.floor(index / 4) * 220,
  }
}

export function autoLayoutByLayer(state: CompositionState): CompositionState {
  const counters = new Map<string, number>()
  const nodes = state.nodes.map((node) => {
    const layer = node.layer ?? 'Application'
    const count = counters.get(layer) ?? 0
    counters.set(layer, count + 1)
    const base = getLayerPosition(layer)

    return {
      ...node,
      position: {
        x: base.x + (count % 2) * 220,
        y: base.y + Math.floor(count / 2) * 126,
      },
    }
  })

  return { ...state, nodes, layout: { ...state.layout, mode: 'layered' } }
}

export function autoLayoutByRelationship(state: CompositionState): CompositionState {
  const incoming = new Map<string, number>()
  state.edges.forEach((edge) => incoming.set(edge.targetNodeId, (incoming.get(edge.targetNodeId) ?? 0) + 1))

  const nodes = [...state.nodes]
    .sort((left, right) => (incoming.get(left.id) ?? 0) - (incoming.get(right.id) ?? 0))
    .map((node, index) => ({
      ...node,
      position: {
        x: 80 + (index % 4) * 240,
        y: 90 + Math.floor(index / 4) * 150,
      },
    }))

  return { ...state, nodes, layout: { ...state.layout, mode: 'relationship' } }
}

export function moveNode(
  state: CompositionState,
  nodeId: string,
  position: CanvasPoint,
  moveChildren = true,
): CompositionState {
  const node = state.nodes.find((item) => item.id === nodeId)
  const nextPosition = state.layout.snapToGrid ? snapPoint(position, state.layout.gridSize) : position

  if (!node) return state

  const dx = nextPosition.x - node.position.x
  const dy = nextPosition.y - node.position.y
  const childIds =
    moveChildren && (node.kind === 'group' || node.kind === 'environment' || node.kind === 'zone')
      ? new Set(state.groups.find((group) => group.id === node.groupId || group.id === node.id)?.nodeIds ?? [])
      : new Set<string>()

  return {
    ...state,
    nodes: state.nodes.map((item) => {
      if (item.id === nodeId) return { ...item, position: nextPosition }
      if (childIds.has(item.id)) {
        return { ...item, position: { x: item.position.x + dx, y: item.position.y + dy } }
      }
      return item
    }),
    groups: state.groups.map((group) =>
      group.id === node.groupId || group.id === node.id ? { ...group, position: nextPosition } : group,
    ),
  }
}

export function fitGroupBounds(nodes: CompositionCanvasNode[]) {
  const padding = 34
  const minX = Math.min(...nodes.map((node) => node.position.x))
  const minY = Math.min(...nodes.map((node) => node.position.y))
  const maxX = Math.max(...nodes.map((node) => node.position.x + node.size.width))
  const maxY = Math.max(...nodes.map((node) => node.position.y + node.size.height))

  return {
    position: { x: minX - padding, y: minY - padding },
    size: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 },
  }
}
