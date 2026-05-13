import type { GraphTraversalResult } from '../graph/enterpriseGraph'
import type { VisualGraph, VisualNode } from '../visualization/visualGraph'

type InteractiveCanvasProps = {
  visualGraph: VisualGraph
  selectedNodeId?: string
  hoveredNodeId?: string
  highlightedPath?: GraphTraversalResult
  onSelectNode: (nodeId: string) => void
  onHoverNode: (nodeId?: string) => void
}

export function InteractiveCanvas({
  visualGraph,
  selectedNodeId,
  hoveredNodeId,
  highlightedPath,
  onSelectNode,
  onHoverNode,
}: InteractiveCanvasProps) {
  const highlightedNodeIds = new Set(highlightedPath?.nodeIds.map((id) => `visual:${id}`) ?? [])
  const highlightedEdgeIds = new Set(highlightedPath?.edgeIds.map((id) => `visual:${id}`) ?? [])
  const hoveredNode = visualGraph.nodes.find((node) => node.id === hoveredNodeId)
  const dependencyNodeIds = new Set<string>()

  if (hoveredNode) {
    visualGraph.edges.forEach((edge) => {
      if (edge.sourceId === hoveredNode.id) {
        dependencyNodeIds.add(edge.targetId)
      }

      if (edge.targetId === hoveredNode.id) {
        dependencyNodeIds.add(edge.sourceId)
      }
    })
  }

  function getNode(nodeId: string): VisualNode | undefined {
    return visualGraph.nodes.find((node) => node.id === nodeId)
  }

  function compactLabel(label: string) {
    return label.length > 14 ? `${label.slice(0, 12)}...` : label
  }

  return (
    <svg className="interactive-canvas" viewBox="0 0 860 430" role="img" aria-label="Enterprise dependency graph">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>

      {visualGraph.edges.map((edge) => {
        const source = getNode(edge.sourceId)
        const target = getNode(edge.targetId)

        if (!source || !target) {
          return null
        }

        const isHighlighted = highlightedEdgeIds.has(edge.id)
        const isRelatedToHover = hoveredNodeId === edge.sourceId || hoveredNodeId === edge.targetId

        return (
          <g key={edge.id}>
            <line
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={isHighlighted ? '#0f172a' : edge.color}
              strokeWidth={isHighlighted || isRelatedToHover ? edge.width + 1.5 : edge.width}
              strokeOpacity={hoveredNodeId && !isRelatedToHover && !isHighlighted ? 0.25 : 0.88}
              markerEnd="url(#arrowhead)"
            />
            <text
              x={(source.x + target.x) / 2}
              y={(source.y + target.y) / 2 - 8}
              textAnchor="middle"
              className="edge-label"
            >
              {edge.relationship.replace('_', ' ')}
            </text>
          </g>
        )
      })}

      {visualGraph.nodes.map((node) => {
        const isSelected = selectedNodeId === node.id
        const isHighlighted = highlightedNodeIds.has(node.id)
        const isDependency = dependencyNodeIds.has(node.id)
        const hasOverlay = visualGraph.overlays.some((overlay) => overlay.nodeIds.includes(node.id))

        return (
          <g
            key={node.id}
            className="graph-node"
            transform={`translate(${node.x} ${node.y})`}
            onClick={() => onSelectNode(node.id)}
            onMouseEnter={() => onHoverNode(node.id)}
            onMouseLeave={() => onHoverNode(undefined)}
            role="button"
            tabIndex={0}
          >
            <title>{node.label}</title>
            <circle
              r={node.radius + (isSelected || isHighlighted ? 7 : isDependency ? 4 : 0)}
              fill={isHighlighted ? '#e0f2fe' : isDependency ? '#fef3c7' : '#ffffff'}
              stroke={isSelected ? '#0f172a' : hasOverlay ? '#f59e0b' : '#cbd5e1'}
              strokeWidth={isSelected || isHighlighted ? 3 : 1.5}
            />
            <circle r={node.radius} fill={node.color} />
            <text y="4" textAnchor="middle" className="node-type">
              {node.type.slice(0, 2).toUpperCase()}
            </text>
            <text y={node.radius + 19} textAnchor="middle" className="node-label">
              {compactLabel(node.label)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
