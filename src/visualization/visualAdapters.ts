import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import { nodeTypeColors, statusColors, type VisualGraph } from './visualGraph'

const columns = {
  requirement: 0,
  service: 1,
  api: 2,
  database: 3,
  infrastructure: 4,
  incident: 5,
  testcase: 5,
}

export function toVisualGraph(graph: EnterpriseGraph): VisualGraph {
  const typeCounts = new Map<string, number>()

  const nodes = graph.nodes.map((node) => {
    const column = columns[node.type]
    const row = typeCounts.get(node.type) ?? 0
    typeCounts.set(node.type, row + 1)

    return {
      id: `visual:${node.id}`,
      enterpriseNodeId: node.id,
      label: node.label,
      type: node.type,
      status: node.status,
      x: 72 + column * 142,
      y: 72 + row * 92 + (column % 2) * 24,
      radius: node.status === 'critical' ? 23 : 19,
      color: node.status === 'healthy' ? nodeTypeColors[node.type] : statusColors[node.status],
      metadata: node,
    }
  })

  const edges = graph.edges.map((edge) => ({
    id: `visual:${edge.id}`,
    enterpriseEdgeId: edge.id,
    sourceId: `visual:${edge.sourceId}`,
    targetId: `visual:${edge.targetId}`,
    relationship: edge.relationship,
    width: Math.max(1.5, edge.weight),
    color: edge.relationship === 'causes' ? '#dc2626' : '#94a3b8',
    metadata: edge,
  }))

  return {
    id: `visual:${graph.id}`,
    nodes,
    edges,
    overlays: [],
    sourceGraph: graph,
  }
}

export function toD3ForceGraph(visualGraph: VisualGraph) {
  return {
    nodes: visualGraph.nodes.map((node) => ({
      id: node.id,
      enterpriseNodeId: node.enterpriseNodeId,
      label: node.label,
      group: node.type,
      radius: node.radius,
      x: node.x,
      y: node.y,
    })),
    links: visualGraph.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      relationship: edge.relationship,
      value: edge.width,
    })),
  }
}

export function toThreeSceneGraph(visualGraph: VisualGraph) {
  return {
    nodes: visualGraph.nodes.map((node) => ({
      id: node.id,
      position: [node.x, node.y, 0] as const,
      color: node.color,
      radius: node.radius,
      enterpriseNodeId: node.enterpriseNodeId,
    })),
    edges: visualGraph.edges.map((edge) => ({
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      color: edge.color,
      width: edge.width,
      enterpriseEdgeId: edge.enterpriseEdgeId,
    })),
  }
}
