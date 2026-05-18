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
import { useInteractionSurface } from '../interaction/useInteractionSurface'
import { downloadSvg } from '../utils/exportCanvas'
import { showToast } from '../toast/toastService'

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
  const { onEnter, onLeave } = useInteractionSurface('d3-graph')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const viewportRef = useRef<SVGGElement | null>(null)
  const simulationRef = useRef<d3.Simulation<D3Node, D3Edge> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map())

  // D3 selection refs — shared between simulation and class-update effects (H2/H3)
  const nodeGroupsRef = useRef<d3.Selection<SVGGElement, D3Node, SVGGElement, unknown> | null>(null)
  const edgeSelectionRef = useRef<d3.Selection<SVGLineElement, D3Edge, SVGGElement, unknown> | null>(null)
  const currentEdgesRef = useRef<D3Edge[]>([])

  // RAF refs for C2 hover peek throttle
  const hoverPeekRafRef = useRef<number | undefined>()
  const hoverPeekPosRefInternal = useRef<{ x: number; y: number } | undefined>()

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
  const [hoverPeekPos, setHoverPeekPos] = useState<{ x: number; y: number } | undefined>()
  const [highlightedPath, setHighlightedPath] = useState<GraphTraversalResult | undefined>()
  const [positionResetSignal, setPositionResetSignal] = useState(0)
  // C1: Only updated on zoom 'end', not on every tick
  const [zoomTransform, setZoomTransform] = useState<{ x: number; y: number; k: number } | undefined>()
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

  // L4: Single memo for both active sets — one invalidation when activePath changes
  const { activeNodeIds, activeEdgeIds } = useMemo(
    () => ({
      activeNodeIds: new Set(activePath?.nodeIds.map((nodeId) => `visual:${nodeId}`) ?? []),
      activeEdgeIds: new Set(activePath?.edgeIds.map((edgeId) => `visual:${edgeId}`) ?? []),
    }),
    [activePath],
  )
  const impactedNodeIds = useMemo(
    () => new Set((traceHighlight?.impactedEntityIds ?? []).map((id) => `visual:${id}`)),
    [traceHighlight?.impactedEntityIds],
  )
  const missingLinkIds = useMemo(
    () => new Set((traceHighlight?.missingLinkNodeIds ?? []).map((id) => `visual:${id}`)),
    [traceHighlight?.missingLinkNodeIds],
  )

  // ─── Zoom setup (runs once) ─────────────────────────────────────────────────
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
        // H4: prevent wheel from bubbling to stadium camera zoom (double-zoom fix)
        if (event.sourceEvent instanceof WheelEvent) {
          event.sourceEvent.stopPropagation()
        }
      })
      // C1: only update React state at gesture end, not on every tick
      .on('end', (event) => {
        setZoomTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k })
      })

    zoomRef.current = zoom
    svg.call(zoom)

    return () => {
      svg.on('.zoom', null)
      zoomRef.current = null
      // Cancel any pending hover peek RAF
      if (hoverPeekRafRef.current !== undefined) {
        cancelAnimationFrame(hoverPeekRafRef.current)
      }
    }
  }, [])

  // ─── Simulation effect — only runs when graph data changes (H2, H3) ─────────
  useEffect(() => {
    simulationRef.current?.stop()

    const { nodes, edges } = cloneForD3(focusedGraph)
    currentEdgesRef.current = edges
    const nodeById = new Map(nodes.map((node) => [node.id, node]))

    // Restore persisted drag positions
    nodes.forEach((node) => {
      const saved = nodePositions.current.get(node.id)
      if (saved) {
        node.fx = saved.x
        node.fy = saved.y
        node.x = saved.x
        node.y = saved.y
      }
    })

    const viewport = d3.select(viewportRef.current)
    const edgeLayer = viewport.select<SVGGElement>('.d3-edge-layer')
    const labelLayer = viewport.select<SVGGElement>('.d3-label-layer')
    const nodeLayer = viewport.select<SVGGElement>('.d3-node-layer')
    const simulation = createForceSimulation(nodes, edges, width, height)
    const resolveNode = (node: string | number | D3Node) =>
      typeof node === 'object' ? node : nodeById.get(String(node))

    simulationRef.current = simulation

    // Build edge selection with default (non-highlighted) colors
    const edgeSel = edgeLayer
      .selectAll<SVGLineElement, D3Edge>('line')
      .data(edges, (edge) => edge.id)
      .join('line')
      .attr('class', 'd3-edge')
      .attr('stroke', (edge) => edge.color)
      .attr('stroke-width', (edge) => edge.width)
    edgeSelectionRef.current = edgeSel

    // Edge labels — data join controls visibility; class effect toggles shouldShowLabels
    labelLayer
      .selectAll<SVGTextElement, D3Edge>('text')
      .data(edges, (edge) => edge.id)
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
            // Persist position — node stays where user dropped it
            const px = node.x ?? event.x
            const py = node.y ?? event.y
            nodePositions.current.set(node.id, { x: px, y: py })
            node.fx = px
            node.fy = py
          }),
      )

    // Default ring/core visuals (active classes applied by class-update effect)
    nodeGroups.select('circle.d3-node-ring').attr('r', (node) => node.radius + 7)
    nodeGroups
      .select('circle.d3-node-core')
      .attr('r', (node) => node.radius)
      .attr('fill', (node) => node.color)
    nodeGroups.select('text.d3-node-type').text((node) => node.type.slice(0, 2).toUpperCase())
    nodeGroups
      .select('text.d3-node-label')
      .text((node) => (node.label.length > 16 ? `${node.label.slice(0, 14)}...` : node.label))

    nodeGroupsRef.current = nodeGroups

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
  }, [focusedGraph, positionResetSignal])

  // ─── Class-update effect — lightweight, no simulation restart (H2) ──────────
  // Runs whenever any highlight/selection/label-visibility state changes.
  useEffect(() => {
    const nodeGroups = nodeGroupsRef.current
    const edgeSel = edgeSelectionRef.current
    if (!nodeGroups || !edgeSel) return

    // Update edge visual state
    edgeSel
      .attr('stroke', (edge) => (activeEdgeIds.has(edge.id) ? '#0f172a' : edge.color))
      .attr('stroke-width', (edge) => (activeEdgeIds.has(edge.id) ? edge.width + 2 : edge.width))

    // Update node ring sizes based on selection/active state
    nodeGroups.select('circle.d3-node-ring').attr('r', (node) => {
      const base = node.radius + 7
      return selectedNodeId === node.id || activeNodeIds.has(node.id) ? base + 4 : base
    })

    // Toggle label text visibility
    nodeGroups
      .select('text.d3-node-label')
      .text((node) =>
        shouldShowLabels ? (node.label.length > 16 ? `${node.label.slice(0, 14)}...` : node.label) : '',
      )

    // Toggle edge labels visibility via data join
    const viewport = d3.select(viewportRef.current)
    viewport
      .select<SVGGElement>('.d3-label-layer')
      .selectAll<SVGTextElement, D3Edge>('text')
      .data(shouldShowLabels ? currentEdgesRef.current : [], (edge) => edge.id)
      .join('text')
      .attr('class', 'd3-edge-label')
      .text((edge) => edge.relationship.replace('_', ' '))

    // Apply CSS classes
    nodeGroups
      .classed('is-selected', (node) => selectedNodeId === node.id)
      .classed('is-active-path', (node) => activeNodeIds.has(node.id))
      .classed('is-warning', (node) => warningNodeIds.has(node.id))
      .classed('is-bottleneck', (node) => bottleneckNodeIds.has(node.id))
      .classed('is-impacted', (node) => impactedNodeIds.has(node.id))
      .classed('is-missing-link', (node) => missingLinkIds.has(node.id))
  }, [
    activeEdgeIds,
    activeNodeIds,
    bottleneckNodeIds,
    impactedNodeIds,
    missingLinkIds,
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

  function handlePanTo(graphX: number, graphY: number) {
    const svg = d3.select(svgRef.current)
    const zoom = zoomRef.current
    if (!zoom) return
    svg.transition().duration(300).call(zoom.translateTo, graphX, graphY)
  }

  function handleResetPositions() {
    nodePositions.current.clear()
    setPositionResetSignal((n) => n + 1)
    showToast('Node positions reset', 'info')
  }

  function handleExportSvg() {
    if (svgRef.current) {
      downloadSvg(svgRef.current, 'enterprise-graph.svg')
      showToast('Graph exported as SVG', 'success')
    }
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

  const hoveredVisualNode = hoveredNodeId ? focusedGraph.nodes.find((n) => n.id === hoveredNodeId) : undefined
  const hoveredDepCount = hoverPath ? Math.max(0, hoverPath.nodeIds.length - 1) : 0

  return (
    <section className="d3-graph-panel panel" aria-label="D3 enterprise graph" onMouseEnter={onEnter} onMouseLeave={onLeave}>
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
        onExportSvg={handleExportSvg}
        onResetPositions={handleResetPositions}
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
          {/* L5: className instead of inline style object */}
          <div
            className="d3-canvas-relative"
            onMouseMove={(e) => {
              if (!hoveredNodeId) return
              // C2: RAF throttle — avoid setState on every mousemove pixel
              const rect = e.currentTarget.getBoundingClientRect()
              hoverPeekPosRefInternal.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
              if (hoverPeekRafRef.current === undefined) {
                hoverPeekRafRef.current = requestAnimationFrame(() => {
                  setHoverPeekPos(hoverPeekPosRefInternal.current)
                  hoverPeekRafRef.current = undefined
                })
              }
            }}
            onMouseLeave={() => {
              if (hoverPeekRafRef.current !== undefined) {
                cancelAnimationFrame(hoverPeekRafRef.current)
                hoverPeekRafRef.current = undefined
              }
              setHoverPeekPos(undefined)
            }}
          >
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

            {/* Hover peek card */}
            {hoveredVisualNode && hoverPeekPos && (
              <div
                className="d3-hover-peek"
                style={{ left: hoverPeekPos.x + 14, top: hoverPeekPos.y - 28 }}
              >
                <div className="d3-hover-peek__name">{hoveredVisualNode.label}</div>
                <div className="d3-hover-peek__type">{hoveredVisualNode.type}</div>
                {hoveredDepCount > 0 && (
                  <div className="d3-hover-peek__deps">{hoveredDepCount} connected nodes</div>
                )}
              </div>
            )}
          </div>

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
            graphWidth={width}
            graphHeight={height}
            zoomTransform={zoomTransform}
            onPanTo={handlePanTo}
          />
          <GraphInspector selectedNode={selectedInspectorNode} metrics={selectedMetrics} />
          <GraphLegend />
        </div>
      </div>
    </section>
  )
}
