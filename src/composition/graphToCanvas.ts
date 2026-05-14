import type { DomainRegistryState } from '../domain/domainTypes'
import type { EnterpriseGraph, EnterpriseNode } from '../graph/enterpriseGraph'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import type {
  CanvasNodeKind,
  CompositionCanvasEdge,
  CompositionCanvasGroup,
  CompositionCanvasNode,
  CompositionGraphContext,
  CompositionState,
} from './compositionTypes'
import { getLayerPosition } from './layoutEngine'

const nodeTypeToCanvasKind: Record<EnterpriseNode['type'], CanvasNodeKind> = {
  requirement: 'requirement',
  api: 'api',
  database: 'database',
  service: 'service',
  infrastructure: 'infrastructure',
  testcase: 'testcase',
  incident: 'incident',
}

function buildContext(graph: EnterpriseGraph, traceHighlight: TraceHighlightState): CompositionGraphContext {
  return {
    traceHighlight,
    warningNodeIds: new Set(graph.nodes.filter((node) => node.status === 'warning').map((node) => node.id)),
    bottleneckNodeIds: new Set(graph.nodes.filter((node) => node.status === 'critical').map((node) => node.id)),
  }
}

function getNodeStatus(node: EnterpriseNode, context: CompositionGraphContext): CompositionCanvasNode['status'] {
  if (context.traceHighlight.selectedTracePath?.nodeIds.includes(node.id)) return 'trace'
  if (context.traceHighlight.impactedEntityIds.includes(node.id)) return 'trace'
  if (context.bottleneckNodeIds.has(node.id)) return 'bottleneck'
  if (context.warningNodeIds.has(node.id) || context.traceHighlight.missingLinkNodeIds.includes(node.id)) return 'warning'
  return 'normal'
}

export function graphToCanvasState(
  graph: EnterpriseGraph,
  registry: DomainRegistryState,
  traceHighlight: TraceHighlightState,
  previousState?: CompositionState,
): CompositionState {
  const context = buildContext(graph, traceHighlight)
  const previousNodes = new Map(previousState?.nodes.map((node) => [node.enterpriseNodeId ?? node.id, node]))
  const domainIds = new Set(registry.entities.map((entity) => entity.id))
  const layerCounts = new Map<string, number>()

  const nodes: CompositionCanvasNode[] = graph.nodes.map((enterpriseNode) => {
    const previous = previousNodes.get(enterpriseNode.id)
    const layer = enterpriseNode.layer ?? 'Application'
    const count = layerCounts.get(layer) ?? 0
    layerCounts.set(layer, count + 1)
    const base = getLayerPosition(layer)

    return {
      id: previous?.id ?? `canvas:${enterpriseNode.id}`,
      label: enterpriseNode.label,
      kind: nodeTypeToCanvasKind[enterpriseNode.type],
      enterpriseNodeId: enterpriseNode.id,
      domainEntityId: domainIds.has(enterpriseNode.id) ? enterpriseNode.id : undefined,
      layer,
      groupId: previous?.groupId,
      position: previous?.position ?? {
        x: base.x + (count % 2) * 210,
        y: base.y + Math.floor(count / 2) * 120,
      },
      size: previous?.size ?? { width: 170, height: 76 },
      status: getNodeStatus(enterpriseNode, context),
      metadata: {
        owner: enterpriseNode.owner ?? 'Unassigned',
        graphNodeId: enterpriseNode.id,
        domainBacked: domainIds.has(enterpriseNode.id),
      },
    }
  })

  const nodeByEnterpriseId = new Map(nodes.map((node) => [node.enterpriseNodeId, node]))
  const traceEdgeIds = traceHighlight.selectedTracePath?.edgeIds ?? []
  const graphEdges: CompositionCanvasEdge[] = graph.edges
    .map((enterpriseEdge) => {
      const source = nodeByEnterpriseId.get(enterpriseEdge.sourceId)
      const target = nodeByEnterpriseId.get(enterpriseEdge.targetId)
      if (!source || !target) return undefined

      return {
        id: `canvas:${enterpriseEdge.id}`,
        sourceNodeId: source.id,
        targetNodeId: target.id,
        enterpriseEdgeId: enterpriseEdge.id,
        relationship: enterpriseEdge.relationship,
        label: enterpriseEdge.label ?? enterpriseEdge.relationship,
        status: traceEdgeIds.includes(enterpriseEdge.id) ? 'trace' : 'normal',
      }
    })
    .filter((edge): edge is CompositionCanvasEdge => Boolean(edge))
  const graphEdgeIds = new Set(graphEdges.map((edge) => edge.enterpriseEdgeId))
  const canvasOnlyEdges =
    previousState?.edges.filter((edge) => !edge.enterpriseEdgeId || !graphEdgeIds.has(edge.enterpriseEdgeId)) ?? []

  const previousGroups = previousState?.groups ?? []
  const groups: CompositionCanvasGroup[] = previousGroups.map((group) => ({
    ...group,
    color: group.color ?? '#2563eb',
    nodeIds: group.nodeIds.filter((nodeId) => nodes.some((node) => node.id === nodeId)),
  }))

  const canvasOnlyNodes =
    previousState?.nodes.filter((node) => !node.enterpriseNodeId && ['group', 'environment', 'zone'].includes(node.kind)) ?? []

  return {
    nodes: [...canvasOnlyNodes, ...nodes],
    edges: [...canvasOnlyEdges, ...graphEdges],
    groups,
    selection: previousState?.selection ?? { selectedNodeIds: [] },
    viewport: previousState?.viewport ?? { x: 0, y: 0, zoom: 1 },
    layout: previousState?.layout ?? { snapToGrid: true, gridSize: 20, mode: 'layered' },
  }
}
