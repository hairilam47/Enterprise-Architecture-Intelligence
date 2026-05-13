import { useMemo, useState } from 'react'
import type { GraphTraversalResult } from '../graph/enterpriseGraph'
import { findImpactPath } from '../graph/traverseGraph'
import { analyzeImpact } from '../graph/impactAnalysis'
import type { VisualGraph } from '../visualization/visualGraph'
import { toD3ForceGraph, toThreeSceneGraph } from '../visualization/visualAdapters'
import { GraphInspector } from './GraphInspector'
import { InteractiveCanvas } from './InteractiveCanvas'

type DependencyGraphPanelProps = {
  visualGraph: VisualGraph
}

export function DependencyGraphPanel({ visualGraph }: DependencyGraphPanelProps) {
  const [selectedNodeId, setSelectedNodeId] = useState(visualGraph.nodes[0]?.id)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>()
  const [highlightedPath, setHighlightedPath] = useState<GraphTraversalResult | undefined>()
  const selectedNode = visualGraph.nodes.find((node) => node.id === selectedNodeId)
  const impact = useMemo(
    () => (selectedNode ? analyzeImpact(visualGraph.sourceGraph, selectedNode.enterpriseNodeId) : undefined),
    [selectedNode, visualGraph.sourceGraph],
  )
  const d3Graph = useMemo(() => toD3ForceGraph(visualGraph), [visualGraph])
  const threeGraph = useMemo(() => toThreeSceneGraph(visualGraph), [visualGraph])
  const selectedImpactPath = impact
    ? {
        startNodeId: impact.selectedNodeId,
        nodeIds: impact.impactNodeIds,
        edgeIds: impact.impactEdgeIds,
      }
    : undefined
  const warningOverlay = visualGraph.overlays.find((overlay) => overlay.kind === 'warning')
  const bottleneckOverlay = visualGraph.overlays.find((overlay) => overlay.kind === 'bottleneck')

  function handleSelectWarning(nodeId: string) {
    const selectedEnterpriseNodeId = selectedNode?.enterpriseNodeId ?? visualGraph.nodes[0]?.enterpriseNodeId

    if (!selectedEnterpriseNodeId) {
      return
    }

    setHighlightedPath(findImpactPath(visualGraph.sourceGraph, selectedEnterpriseNodeId, nodeId))
  }

  return (
    <section className="graph-panel panel" aria-label="Dependency graph intelligence">
      <div className="comparison-panel__header">
        <div>
          <p className="eyebrow">Enterprise Graph Engine</p>
          <h2>Dependency intelligence</h2>
        </div>
        <div className="graph-telemetry">
          <span>{d3Graph.nodes.length} nodes</span>
          <span>{d3Graph.links.length} edges</span>
          <span>{threeGraph.nodes.length} scene-ready</span>
        </div>
      </div>

      <div className="graph-layout">
        <div>
          <InteractiveCanvas
            visualGraph={visualGraph}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            highlightedPath={highlightedPath ?? selectedImpactPath}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId)
              setHighlightedPath(undefined)
            }}
            onHoverNode={setHoveredNodeId}
          />
          <div className="overlay-actions">
            <button type="button" onClick={() => setHighlightedPath(undefined)}>
              Clear path
            </button>
            {warningOverlay?.nodeIds.map((visualNodeId) => {
              const node = visualGraph.nodes.find((item) => item.id === visualNodeId)

              if (!node) {
                return null
              }

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => handleSelectWarning(node.enterpriseNodeId)}
                >
                  Warning: {node.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="graph-side">
          <GraphInspector selectedNode={selectedNode} impact={impact} />
          <aside className="panel overlay-panel" aria-label="Simulation overlays">
            <div className="panel__header">
              <p className="eyebrow">Simulation Overlay</p>
              <h2>Highlights</h2>
            </div>
            <ul className="issue-list">
              <li data-severity="warning">
                <span>bottlenecks</span>
                <strong>{bottleneckOverlay?.nodeIds.length ?? 0} highlighted</strong>
                <p>Simulation bottlenecks map directly to enterprise nodes.</p>
              </li>
              <li data-severity="warning">
                <span>warnings</span>
                <strong>{warningOverlay?.nodeIds.length ?? 0} highlighted</strong>
                <p>Validation warnings can reveal an impact path on click.</p>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
