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
  if (graph.nodes.length === 0) {
    return { startNodeId: '', nodeIds: [], edgeIds: [] }
  }

  // Build adjacency structures for Kahn's topological sort
  const inDegree = new Map<string, number>()
  const outEdges = new Map<string, { edgeId: string; targetId: string; weight: number }[]>()

  for (const node of graph.nodes) {
    inDegree.set(node.id, 0)
    outEdges.set(node.id, [])
  }

  for (const edge of graph.edges) {
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) ?? 0) + 1)
    outEdges.get(edge.sourceId)?.push({ edgeId: edge.id, targetId: edge.targetId, weight: edge.weight })
  }

  // Kahn's algorithm — nodes not in the graph's node list are skipped
  const queue: string[] = []
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId)
  }

  const topoOrder: string[] = []
  const visited = new Set<string>()
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    topoOrder.push(nodeId)
    for (const { targetId } of outEdges.get(nodeId) ?? []) {
      const newDeg = (inDegree.get(targetId) ?? 1) - 1
      inDegree.set(targetId, newDeg)
      if (newDeg === 0) queue.push(targetId)
    }
  }

  // DP longest-path: dist[v] = max weighted distance from any source to v
  const dist = new Map<string, number>()
  const prevNode = new Map<string, string>()
  const prevEdge = new Map<string, string>()
  for (const nodeId of graph.nodes.map((n) => n.id)) {
    dist.set(nodeId, 0)
  }

  for (const nodeId of topoOrder) {
    const d = dist.get(nodeId) ?? 0
    for (const { edgeId, targetId, weight } of outEdges.get(nodeId) ?? []) {
      const candidate = d + weight
      if (candidate > (dist.get(targetId) ?? 0)) {
        dist.set(targetId, candidate)
        prevNode.set(targetId, nodeId)
        prevEdge.set(targetId, edgeId)
      }
    }
  }

  // Find the node with the maximum distance (end of critical path)
  let maxDist = -1
  let endNodeId = graph.nodes[0]?.id ?? ''
  for (const [nodeId, d] of dist) {
    if (d > maxDist) {
      maxDist = d
      endNodeId = nodeId
    }
  }

  // Backtrack to recover the path
  const pathNodeIds: string[] = []
  const pathEdgeIds: string[] = []
  let cursor: string | undefined = endNodeId

  while (cursor !== undefined) {
    pathNodeIds.unshift(cursor)
    const edge = prevEdge.get(cursor)
    if (edge) pathEdgeIds.unshift(edge)
    cursor = prevNode.get(cursor)
  }

  // Also include any nodes explicitly marked critical that aren't on the path
  const pathNodeSet = new Set(pathNodeIds)
  for (const node of graph.nodes) {
    if (node.status === 'critical' && !pathNodeSet.has(node.id)) {
      pathNodeIds.push(node.id)
    }
  }

  return {
    startNodeId: pathNodeIds[0] ?? endNodeId,
    nodeIds: pathNodeIds,
    edgeIds: pathEdgeIds,
  }
}
