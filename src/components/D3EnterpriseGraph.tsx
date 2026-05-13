import * as d3 from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { EnterpriseNodeType, EnterpriseRelationshipType, GraphTraversalResult } from '../graph/enterpriseGraph'
import { findCriticalPath, findImpactPath, traverseDownstream, traverseUpstream } from '../graph/traverseGraph'
import { createForceSimulation, type D3Edge, type D3Node } from '../visualization/d3ForceLayout'
import {
  defaultGraphFilters,
  filterVisualGraph,
  type BottleneckSeverityFilter,
  type WarningSeverityFilter,
} from '../visualization/graphFilters'
import { focusVisualGraph, type GraphFocusMode } from '../visualization/graphFocus'
import { getGraphNodeMetrics } from '../visualization/graphMetrics'
import { getGraphPerformanceSummary } from '../visualization/graphPerformance'
import { searchVisualGraph, type GraphSearchResult } from '../visualization/graphSearch'
import type { VisualGraph } from '../visualization/visualGraph'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import { GraphFilterPanel } from './GraphFilterPanel'
import { GraphFocusControls } from './GraphFocusControls'
import { GraphInspector } from './GraphInspector'
import { GraphLegend } from './GraphLegend'
import { GraphMiniMap } from './GraphMiniMap'
import { GraphSearchBox } from './GraphSearchBox'
import { GraphToolbar } from './GraphToolbar'

type D3EnterpriseGraphProps = {
  visualGraph: VisualGraph
  traceHighlight?: TraceHighlightState
}

const width = 900
const height = 520

function cloneForD3(visualGraph: VisualGraph) {
  const nodes: D3Node[] = visualGraph.nodes.map((node) => ({ ...node, metadata: { ...node.metadata } }))
  const edges: D3Edge[] = visualGraph.edges.map((edge) => ({
    ...edge,
    metadata: { ...edge.metadata },
    source: edge.sourceId,
    target: edge.targetId,
  }))

  return { nodes, edges }
}

export function D3EnterpriseGraph({ visualGraph, traceHighlight }: D3EnterpriseGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewportRef = useRef<SVGGElement | null>(null)
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [focusMode, setFocusMode] = useState<GraphFocusMode>('full_graph')
  const [layerFilter, setLayerFilter] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [showWarnings, setShowWarnings] = useState(true)
  const [showBottlenecks, setShowBottlenecks] = useState(true)
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<EnterpriseNodeType[]>([])
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<EnterpriseRelationshipType[]>([])
  const [warningSeverity, setWarningSeverity] = useState<WarningSeverityFilter>('any')
  const [bottleneckSeverity, setBottleneckSeverity] = useState<BottleneckSeverityFilter>('any')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNodeId, setSelectedNodeId] = useState(visualGraph.nodes[0]?.id)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>()
  const [highlightedPath, setHighlightedPath] = useState<GraphTraversalResult | undefined>()
  const selectedNode = visualGraph.nodes.find((node) => node.id === selectedNodeId)

  const filteredGraph = useMemo(
    () =>
      filterVisualGraph(visualGraph, {
        ...defaultGraphFilters,
        nodeTypes: selectedNodeTypes,
        relationshipTypes: selectedRelationshipTypes,
        layers: layerFilter ? [layerFilter] : undefined,
        warningSeverity,
        bottleneckSeverity,
        showWarnings,
        showBottlenecks,
      }),
    [
      bottleneckSeverity,
      layerFilter,
      selectedNodeTypes,
      selectedRelationshipTypes,
      showBottlenecks,
      showWarnings,
      visualGraph,
      warningSeverity,
    ],
  )
  const focusedGraph = useMemo(
    () =>
      focusVisualGraph(filteredGraph, {
        mode: focusMode,
        selectedEnterpriseNodeId: selectedNode?.enterpriseNodeId,
        layer: layerFilter,
      }),
    [filteredGraph, focusMode, layerFilter, selectedNode?.enterpriseNodeId],
  )
  const selectedInspectorNode =
    focusedGraph.nodes.find((node) => node.id === selectedNodeId) ?? focusedGraph.nodes[0]
  const selectedMetrics = useMemo(
    () => getGraphNodeMetrics(visualGraph, selectedInspectorNode?.enterpriseNodeId),
    [selectedInspectorNode?.enterpriseNodeId, visualGraph],
  )
  const searchResults = useMemo(
    () => searchVisualGraph(filteredGraph, searchQuery),
    [filteredGraph, searchQuery],
  )
  const performanceSummary = useMemo(
    () => getGraphPerformanceSummary(focusedGraph),
    [focusedGraph],
  )
  const shouldShowLabels = showLabels && !performanceSummary.shouldHideLabels
  const activeFilters = useMemo(() => {
    const filters = [
      layerFilter ? `Layer: ${layerFilter}` : '',
      selectedNodeTypes.length ? `Node types: ${selectedNodeTypes.length}` : '',
      selectedRelationshipTypes.length ? `Relationships: ${selectedRelationshipTypes.length}` : '',
      warningSeverity !== 'any' ? `Warnings: ${warningSeverity}` : '',
      bottleneckSeverity !== 'any' ? 'Bottlenecks only' : '',
      !showWarnings ? 'Warnings hidden' : '',
      !showBottlenecks ? 'Bottlenecks hidden' : '',
    ]

    return filters.filter(Boolean)
  }, [
    bottleneckSeverity,
    layerFilter,
    selectedNodeTypes.length,
    selectedRelationshipTypes.length,
    showBottlenecks,
    showWarnings,
    warningSeverity,
  ])
  const warningNodeIds = useMemo(
    () =>
      new Set(
        focusedGraph.overlays
          .filter((overlay) => overlay.kind === 'warning' && showWarnings)
          .flatMap((overlay) => overlay.nodeIds),
      ),
    [focusedGraph.overlays, showWarnings],
  )
  const bottleneckNodeIds = useMemo(
    () =>
      new Set(
        focusedGraph.overlays
          .filter((overlay) => overlay.kind === 'bottleneck' && showBottlenecks)
          .flatMap((overlay) => overlay.nodeIds),
      ),
    [focusedGraph.overlays, showBottlenecks],
  )

  const hoverPath = useMemo(() => {
    const enterpriseNodeId = hoveredNodeId?.replace('visual:', '')

    if (!enterpriseNodeId) {
      return undefined
    }

    const upstream = traverseUpstream(focusedGraph.sourceGraph, enterpriseNodeId)
    const downstream = traverseDownstream(focusedGraph.sourceGraph, enterpriseNodeId)

    return {
      startNodeId: enterpriseNodeId,
      nodeIds: [...new Set([...upstream.nodeIds, ...downstream.nodeIds])],
      edgeIds: [...new Set([...upstream.edgeIds, ...downstream.edgeIds])],
    }
  }, [focusedGraph.sourceGraph, hoveredNodeId])

  const tracePath = traceHighlight?.selectedTracePath
    ? {
        startNodeId: traceHighlight.selectedTracePath.nodeIds[0] ?? '',
        nodeIds: traceHighlight.selectedTracePath.nodeIds,
        edgeIds: traceHighlight.selectedTracePath.edgeIds,
      }
    : undefined
  const activePath = tracePath ?? highlightedPath ?? hoverPath
  const activeNodeIds = useMemo(
    () => new Set(activePath?.nodeIds.map((nodeId) => `visual:${nodeId}`) ?? []),
    [activePath],
  )
  const activeEdgeIds = useMemo(
    () => new Set(activePath?.edgeIds.map((edgeId) => `visual:${edgeId}`) ?? []),
    [activePath],
  )

  useEffect(() => {
    const svgElement = svgRef.current
    const viewportElement = viewportRef.current

    if (!svgElement || !viewportElement) {
      return
    }

    const svg = d3.select(svgElement)
    const viewport = d3.select(viewportElement)
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 2.8])
      .on('zoom', (event) => {
        viewport.attr('transform', event.transform.toString())
      })

    zoomRef.current = zoom
    svg.call(zoom)

    return () => {
      svg.on('.zoom', null)
      zoomRef.current = null
    }
  }, [])

  useEffect(() => {
    simulationRef.current?.stop()

    const { nodes, edges } = cloneForD3(focusedGraph)
    const nodeById = new Map(nodes.map((node) => [node.id, node]))
    const viewport = d3.select(viewportRef.current)
    const edgeLayer = viewport.select<SVGGElement>('.d3-edge-layer')
    const labelLayer = viewport.select<SVGGElement>('.d3-label-layer')
    const nodeLayer = viewport.select<SVGGElement>('.d3-node-layer')
    const simulation = createForceSimulation(nodes, edges, width, height)
    const resolveNode = (node: string | number | D3Node) =>
      typeof node === 'object' ? node : nodeById.get(String(node))

    simulationRef.current = simulation

    edgeLayer
      .selectAll<SVGLineElement, D3Edge>('line')
      .data(edges, (edge) => edge.id)
      .join('line')
      .attr('class', 'd3-edge')
      .attr('stroke', (edge) => (activeEdgeIds.has(edge.id) ? '#0f172a' : edge.color))
      .attr('stroke-width', (edge) => (activeEdgeIds.has(edge.id) ? edge.width + 2 : edge.width))

    labelLayer
      .selectAll<SVGTextElement, D3Edge>('text')
      .data(shouldShowLabels ? edges : [], (edge) => edge.id)
      .join('text')
      .attr('class', 'd3-edge-label')
      .text((edge) => edge.relationship.replace('_', ' '))

    const nodeGroups = nodeLayer
      .selectAll<SVGGElement, D3Node>('g')
      .data(nodes, (node) => node.id)
      .join((enter) => {
        const group = enter.append('g').attr('class', 'd3-node').attr('tabindex', 0)
        group.append('circle').attr('class', 'd3-node-ring')
        group.append('circle').attr('class', 'd3-node-core')
        group.append('text').attr('class', 'd3-node-type')
        group.append('text').attr('class', 'd3-node-label')
        return group
      })
      .on('mouseenter', (_, node) => setHoveredNodeId(node.id))
      .on('mouseleave', () => setHoveredNodeId(undefined))
      .on('click', (_, node) => {
        setSelectedNodeId(node.id)
        setHighlightedPath(undefined)
      })
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', (event, node) => {
            if (!event.active) {
              simulation.alphaTarget(0.25).restart()
            }
            node.fx = node.x
            node.fy = node.y
          })
          .on('drag', (event, node) => {
            node.fx = event.x
            node.fy = event.y
          })
          .on('end', (event, node) => {
            if (!event.active) {
              simulation.alphaTarget(0)
            }
            node.fx = undefined
            node.fy = undefined
          }),
      )

    nodeGroups.select('circle.d3-node-ring').attr('r', (node) => {
      const base = node.radius + 7
      if (selectedNodeId === node.id || activeNodeIds.has(node.id)) {
        return base + 4
      }
      return base
    })
    nodeGroups
      .select('circle.d3-node-core')
      .attr('r', (node) => node.radius)
      .attr('fill', (node) => node.color)
    nodeGroups.select('text.d3-node-type').text((node) => node.type.slice(0, 2).toUpperCase())
    nodeGroups
      .select('text.d3-node-label')
      .text((node) => (shouldShowLabels ? (node.label.length > 16 ? `${node.label.slice(0, 14)}...` : node.label) : ''))

    nodeGroups
      .classed('is-selected', (node) => selectedNodeId === node.id)
      .classed('is-active-path', (node) => activeNodeIds.has(node.id))
      .classed('is-warning', (node) => warningNodeIds.has(node.id))
      .classed('is-bottleneck', (node) => bottleneckNodeIds.has(node.id))

    simulation.on('tick', () => {
      edgeLayer
        .selectAll<SVGLineElement, D3Edge>('line')
        .attr('x1', (edge) => resolveNode(edge.source)?.x ?? 0)
        .attr('y1', (edge) => resolveNode(edge.source)?.y ?? 0)
        .attr('x2', (edge) => resolveNode(edge.target)?.x ?? 0)
        .attr('y2', (edge) => resolveNode(edge.target)?.y ?? 0)

      labelLayer
        .selectAll<SVGTextElement, D3Edge>('text')
        .attr('x', (edge) => {
          const source = resolveNode(edge.source)
          const target = resolveNode(edge.target)
          return ((source?.x ?? 0) + (target?.x ?? 0)) / 2
        })
        .attr('y', (edge) => {
          const source = resolveNode(edge.source)
          const target = resolveNode(edge.target)
          return ((source?.y ?? 0) + (target?.y ?? 0)) / 2 - 8
        })

      nodeGroups.attr('transform', (node) => `translate(${node.x ?? 0} ${node.y ?? 0})`)
    })

    return () => {
      simulation.stop()
    }
  }, [
    activeEdgeIds,
    activeNodeIds,
    bottleneckNodeIds,
    focusedGraph,
    selectedNodeId,
    shouldShowLabels,
    warningNodeIds,
  ])

  function handleResetView() {
    const svg = d3.select(svgRef.current)
    const zoom = zoomRef.current

    if (!zoom) {
      d3.select(viewportRef.current).attr('transform', d3.zoomIdentity.toString())
      return
    }

    svg
      .transition()
      .duration(250)
      .call(zoom.transform, d3.zoomIdentity)
  }

  function focusCriticalPath() {
    setHighlightedPath(findCriticalPath(visualGraph.sourceGraph))
    setFocusMode('critical_path')
  }

  function focusBottleneckPath() {
    const bottleneckNodeId = [...bottleneckNodeIds][0]?.replace('visual:', '')

    if (!bottleneckNodeId) {
      return
    }

    setHighlightedPath(findImpactPath(visualGraph.sourceGraph, bottleneckNodeId, visualGraph.sourceGraph.nodes.at(-1)?.id ?? bottleneckNodeId))
    setFocusMode('bottlenecks_only')
  }

  function focusWarningPath() {
    const warningNodeId = [...warningNodeIds][0]?.replace('visual:', '')
    const startNodeId = selectedNode?.enterpriseNodeId ?? visualGraph.sourceGraph.nodes[0]?.id

    if (!warningNodeId || !startNodeId) {
      return
    }

    setHighlightedPath(findImpactPath(visualGraph.sourceGraph, startNodeId, warningNodeId))
    setFocusMode('warnings_only')
  }

  function handleSearchSelect(result: GraphSearchResult) {
    setSelectedNodeId(result.nodeId)
    setHighlightedPath({
      startNodeId: result.enterpriseNodeId,
      nodeIds: [
        ...new Set([
          ...traverseUpstream(visualGraph.sourceGraph, result.enterpriseNodeId).nodeIds,
          ...traverseDownstream(visualGraph.sourceGraph, result.enterpriseNodeId).nodeIds,
        ]),
      ],
      edgeIds: [
        ...new Set([
          ...traverseUpstream(visualGraph.sourceGraph, result.enterpriseNodeId).edgeIds,
          ...traverseDownstream(visualGraph.sourceGraph, result.enterpriseNodeId).edgeIds,
        ]),
      ],
    })
    setFocusMode('selected_neighborhood')
  }

  return (
    <section className="d3-graph-panel panel" aria-label="D3 enterprise graph">
      <div className="comparison-panel__header">
        <div>
          <p className="eyebrow">Sprint 4 D3 Graph</p>
          <h2>Risk and dependency map</h2>
        </div>
        <div className="graph-telemetry">
          <span>{focusedGraph.nodes.length} visible nodes</span>
          <span>{focusedGraph.edges.length} visible edges</span>
        </div>
      </div>

      <GraphToolbar
        focusMode={focusMode}
        layerFilter={layerFilter}
        showLabels={showLabels}
        showWarnings={showWarnings}
        showBottlenecks={showBottlenecks}
        onFocusModeChange={setFocusMode}
        onLayerFilterChange={setLayerFilter}
        onShowLabelsChange={setShowLabels}
        onShowWarningsChange={setShowWarnings}
        onShowBottlenecksChange={setShowBottlenecks}
        onResetView={handleResetView}
      />
      <GraphFocusControls
        onFocusModeChange={(mode) => {
          if (mode === 'critical_path') {
            focusCriticalPath()
            return
          }
          if (mode === 'bottlenecks_only') {
            focusBottleneckPath()
            return
          }
          if (mode === 'warnings_only') {
            focusWarningPath()
            return
          }
          setFocusMode(mode)
        }}
      />

      <div className="d3-graph-layout">
        <div className="d3-canvas-wrap">
          <GraphSearchBox
            query={searchQuery}
            results={searchResults}
            onQueryChange={setSearchQuery}
            onSelectResult={handleSearchSelect}
          />
          <svg ref={svgRef} className="d3-enterprise-canvas" viewBox={`0 0 ${width} ${height}`} role="img">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
              </marker>
            </defs>
            <g ref={viewportRef}>
              <g className="d3-edge-layer" />
              <g className="d3-label-layer" />
              <g className="d3-node-layer" />
            </g>
          </svg>
          <div className="overlay-actions">
            {[...warningNodeIds].map((nodeId) => {
              const node = visualGraph.nodes.find((item) => item.id === nodeId)
              return node ? (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    setHighlightedPath(
                      findImpactPath(
                        visualGraph.sourceGraph,
                        selectedNode?.enterpriseNodeId ?? visualGraph.sourceGraph.nodes[0]?.id ?? node.enterpriseNodeId,
                        node.enterpriseNodeId,
                      ),
                    )
                  }}
                >
                  Warning: {node.label}
                </button>
              ) : null
            })}
            {[...bottleneckNodeIds].map((nodeId) => {
              const node = visualGraph.nodes.find((item) => item.id === nodeId)
              return node ? (
                <button key={node.id} type="button" onClick={focusBottleneckPath}>
                  Bottleneck: {node.label}
                </button>
              ) : null
            })}
          </div>
        </div>

        <div className="graph-side">
          <GraphFilterPanel
            selectedNodeTypes={selectedNodeTypes}
            selectedRelationshipTypes={selectedRelationshipTypes}
            layerFilter={layerFilter}
            warningSeverity={warningSeverity}
            bottleneckSeverity={bottleneckSeverity}
            onNodeTypesChange={setSelectedNodeTypes}
            onRelationshipTypesChange={setSelectedRelationshipTypes}
            onLayerFilterChange={setLayerFilter}
            onWarningSeverityChange={setWarningSeverity}
            onBottleneckSeverityChange={setBottleneckSeverity}
          />
          <GraphMiniMap
            totalNodeCount={visualGraph.nodes.length}
            visibleNodeCount={focusedGraph.nodes.length}
            edgeCount={focusedGraph.edges.length}
            focusMode={focusMode}
            activeFilters={activeFilters}
            performance={performanceSummary}
          />
          <GraphInspector selectedNode={selectedInspectorNode} metrics={selectedMetrics} />
          <GraphLegend />
        </div>
      </div>
    </section>
  )
}
