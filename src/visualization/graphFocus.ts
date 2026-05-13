import { findCriticalPath, findImpactPath, traverseDownstream, traverseUpstream } from '../graph/traverseGraph'
import type { VisualGraph } from './visualGraph'

export type GraphFocusMode =
  | 'full_graph'
  | 'selected_neighborhood'
  | 'impact_path'
  | 'critical_path'
  | 'bottlenecks_only'
  | 'warnings_only'
  | 'layer_view'

export type GraphFocusOptions = {
  mode: GraphFocusMode
  selectedEnterpriseNodeId?: string
  layer?: string
}

function toVisualNodeId(enterpriseNodeId: string) {
  return `visual:${enterpriseNodeId}`
}

function toVisualEdgeId(enterpriseEdgeId: string) {
  return `visual:${enterpriseEdgeId}`
}

function keepSubgraph(visualGraph: VisualGraph, visualNodeIds: Set<string>, visualEdgeIds?: Set<string>) {
  const nodes = visualGraph.nodes.filter((node) => visualNodeIds.has(node.id))
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = visualGraph.edges.filter((edge) => {
    const inNodeSet = nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId)
    const inEdgeSet = !visualEdgeIds || visualEdgeIds.has(edge.id)

    return inNodeSet && inEdgeSet
  })

  return {
    ...visualGraph,
    nodes,
    edges,
  }
}

export function focusVisualGraph(visualGraph: VisualGraph, options: GraphFocusOptions): VisualGraph {
  if (options.mode === 'full_graph') {
    return visualGraph
  }

  if (options.mode === 'layer_view' && options.layer) {
    const layerNodeIds = new Set(
      visualGraph.nodes
        .filter((node) => node.metadata.layer === options.layer || node.metadata.owner === options.layer)
        .map((node) => node.id),
    )

    return keepSubgraph(visualGraph, layerNodeIds)
  }

  if (options.mode === 'bottlenecks_only') {
    const nodeIds = new Set(
      visualGraph.overlays
        .filter((overlay) => overlay.kind === 'bottleneck')
        .flatMap((overlay) => overlay.nodeIds),
    )

    return keepSubgraph(visualGraph, nodeIds)
  }

  if (options.mode === 'warnings_only') {
    const nodeIds = new Set(
      visualGraph.overlays
        .filter((overlay) => overlay.kind === 'warning')
        .flatMap((overlay) => overlay.nodeIds),
    )

    return keepSubgraph(visualGraph, nodeIds)
  }

  if (options.mode === 'critical_path') {
    const criticalPath = findCriticalPath(visualGraph.sourceGraph)

    return keepSubgraph(
      visualGraph,
      new Set(criticalPath.nodeIds.map(toVisualNodeId)),
      new Set(criticalPath.edgeIds.map(toVisualEdgeId)),
    )
  }

  if (!options.selectedEnterpriseNodeId) {
    return visualGraph
  }

  if (options.mode === 'selected_neighborhood') {
    const upstream = traverseUpstream(visualGraph.sourceGraph, options.selectedEnterpriseNodeId)
    const downstream = traverseDownstream(visualGraph.sourceGraph, options.selectedEnterpriseNodeId)

    return keepSubgraph(
      visualGraph,
      new Set([...upstream.nodeIds, ...downstream.nodeIds].map(toVisualNodeId)),
      new Set([...upstream.edgeIds, ...downstream.edgeIds].map(toVisualEdgeId)),
    )
  }

  if (options.mode === 'impact_path') {
    const warningTarget = visualGraph.overlays
      .find((overlay) => overlay.kind === 'warning')
      ?.nodeIds.at(0)
      ?.replace('visual:', '')
    const targetNodeId = warningTarget ?? visualGraph.sourceGraph.nodes.at(-1)?.id

    if (!targetNodeId) {
      return visualGraph
    }

    const impactPath = findImpactPath(
      visualGraph.sourceGraph,
      options.selectedEnterpriseNodeId,
      targetNodeId,
    )

    return keepSubgraph(
      visualGraph,
      new Set(impactPath.nodeIds.map(toVisualNodeId)),
      new Set(impactPath.edgeIds.map(toVisualEdgeId)),
    )
  }

  return visualGraph
}
