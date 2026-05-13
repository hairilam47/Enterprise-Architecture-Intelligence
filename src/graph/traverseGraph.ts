import type { EnterpriseGraph, GraphTraversalResult } from './enterpriseGraph'

function traverse(
  graph: EnterpriseGraph,
  startNodeId: string,
  direction: 'upstream' | 'downstream',
): GraphTraversalResult {
  const visitedNodes = new Set<string>([startNodeId])
  const visitedEdges = new Set<string>()
  const queue = [startNodeId]

  while (queue.length > 0) {
    const currentNodeId = queue.shift()

    if (!currentNodeId) {
      break
    }

    const connectedEdges = graph.edges.filter((edge) =>
      direction === 'upstream' ? edge.targetId === currentNodeId : edge.sourceId === currentNodeId,
    )

    connectedEdges.forEach((edge) => {
      const nextNodeId = direction === 'upstream' ? edge.sourceId : edge.targetId
      visitedEdges.add(edge.id)

      if (!visitedNodes.has(nextNodeId)) {
        visitedNodes.add(nextNodeId)
        queue.push(nextNodeId)
      }
    })
  }

  return {
    startNodeId,
    nodeIds: [...visitedNodes],
    edgeIds: [...visitedEdges],
  }
}

export function traverseUpstream(graph: EnterpriseGraph, startNodeId: string) {
  return traverse(graph, startNodeId, 'upstream')
}

export function traverseDownstream(graph: EnterpriseGraph, startNodeId: string) {
  return traverse(graph, startNodeId, 'downstream')
}

export function findDependencies(graph: EnterpriseGraph, startNodeId: string) {
  return traverseUpstream(graph, startNodeId)
}

export function findImpactPath(graph: EnterpriseGraph, sourceNodeId: string, targetNodeId: string) {
  const queue = [{ nodeId: sourceNodeId, pathNodeIds: [sourceNodeId], pathEdgeIds: [] as string[] }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()

    if (!current || visited.has(current.nodeId)) {
      continue
    }

    if (current.nodeId === targetNodeId) {
      return {
        startNodeId: sourceNodeId,
        nodeIds: current.pathNodeIds,
        edgeIds: current.pathEdgeIds,
      }
    }

    visited.add(current.nodeId)

    graph.edges
      .filter((edge) => edge.sourceId === current.nodeId)
      .forEach((edge) => {
        queue.push({
          nodeId: edge.targetId,
          pathNodeIds: [...current.pathNodeIds, edge.targetId],
          pathEdgeIds: [...current.pathEdgeIds, edge.id],
        })
      })
  }

  return {
    startNodeId: sourceNodeId,
    nodeIds: [sourceNodeId],
    edgeIds: [],
  }
}

export function findCriticalPath(graph: EnterpriseGraph) {
  const weightedEdges = [...graph.edges].sort((first, second) => second.weight - first.weight)
  const criticalEdgeIds = new Set(weightedEdges.slice(0, 5).map((edge) => edge.id))
  const criticalNodeIds = new Set<string>()

  weightedEdges.forEach((edge) => {
    if (criticalEdgeIds.has(edge.id)) {
      criticalNodeIds.add(edge.sourceId)
      criticalNodeIds.add(edge.targetId)
    }
  })

  graph.nodes
    .filter((node) => node.status === 'critical')
    .forEach((node) => {
      criticalNodeIds.add(node.id)
    })

  return {
    startNodeId: [...criticalNodeIds][0] ?? graph.nodes[0]?.id ?? '',
    nodeIds: [...criticalNodeIds],
    edgeIds: [...criticalEdgeIds],
  }
}
