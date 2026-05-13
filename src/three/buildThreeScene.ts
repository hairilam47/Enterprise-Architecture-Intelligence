import type { VisualGraph } from '../visualization/visualGraph'
import { getLayerColor, getLayerPosition, getNodeColor, getNodeSize, getSpatialStatus, layerOrder } from './threeMappings'
import type { SpatialEdge, SpatialScene } from './sceneTypes'

type BuildThreeSceneOptions = {
  selectedNodeId?: string
  highlightedNodeIds?: Set<string>
  highlightedEdgeIds?: Set<string>
  showWarnings: boolean
  showBottlenecks: boolean
  layerFocus?: string
  viewMode: 'stack' | 'topology'
}

export function buildThreeScene(visualGraph: VisualGraph, options: BuildThreeSceneOptions): SpatialScene {
  const warningNodeIds = new Set(
    options.showWarnings
      ? visualGraph.overlays.filter((overlay) => overlay.kind === 'warning').flatMap((overlay) => overlay.nodeIds)
      : [],
  )
  const bottleneckNodeIds = new Set(
    options.showBottlenecks
      ? visualGraph.overlays.filter((overlay) => overlay.kind === 'bottleneck').flatMap((overlay) => overlay.nodeIds)
      : [],
  )
  const layers = [...layerOrder, 'Support']
    .filter((layer) => !options.layerFocus || layer === options.layerFocus || layer === 'Support')
    .map((layer) => ({
      id: `spatial-layer:${layer}`,
      name: layer,
      layer,
      yPosition: getLayerPosition(layer),
      color: getLayerColor(layer),
      opacity: options.layerFocus && options.layerFocus !== layer ? 0.12 : 0.18,
    }))
  const visibleLayerNames = new Set(layers.map((layer) => layer.layer))
  const nodes = visualGraph.nodes
    .filter((node) => visibleLayerNames.has(node.metadata.layer ?? node.metadata.owner ?? 'Support'))
    .map((node, index) => {
      const layer = node.metadata.layer ?? node.metadata.owner ?? 'Support'
      const layerIndex = layerOrder.indexOf(layer as (typeof layerOrder)[number])
      const column = layerIndex >= 0 ? layerIndex : layerOrder.length
      const x = options.viewMode === 'stack' ? (index % 4 - 1.5) * 1.35 : node.x / 85 - 5
      const z = options.viewMode === 'stack' ? Math.floor(index / 4) * 1.1 - 1.6 : node.y / 85 - 2.7
      const status = getSpatialStatus(node, options.selectedNodeId, warningNodeIds, bottleneckNodeIds)

      return {
        id: `spatial:${node.id}`,
        enterpriseNodeId: node.enterpriseNodeId,
        label: node.label,
        type: node.type,
        layer,
        position: {
          x: options.viewMode === 'stack' ? x : x + column * 0.12,
          y: getLayerPosition(layer) + 0.18,
          z,
        },
        size: getNodeSize(node),
        color: getNodeColor(node),
        metadata: { ...node.metadata },
        status,
      }
    })
  const nodeByVisualId = new Map(nodes.map((node) => [node.id.replace('spatial:', ''), node]))
  const edges: SpatialEdge[] = visualGraph.edges.flatMap((edge) => {
    const source = nodeByVisualId.get(edge.sourceId)
    const target = nodeByVisualId.get(edge.targetId)

    if (!source || !target) {
      return []
    }

    const isWarning = warningNodeIds.has(edge.sourceId) || warningNodeIds.has(edge.targetId)
    const isBottleneck = bottleneckNodeIds.has(edge.sourceId) || bottleneckNodeIds.has(edge.targetId)
    const status = options.highlightedEdgeIds?.has(edge.id)
      ? 'highlighted'
      : isWarning
        ? 'warning'
        : isBottleneck
          ? 'bottleneck'
          : 'normal'

    return [
      {
        id: `spatial:${edge.id}`,
        source: source.id,
        target: target.id,
        relationship: edge.relationship,
        points: [source.position, target.position],
        status,
      },
    ]
  })

  return {
    layers,
    nodes,
    edges,
  }
}
