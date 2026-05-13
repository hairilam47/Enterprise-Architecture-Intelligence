import { useMemo, useState } from 'react'
import type { EnterpriseGraph } from '../../graph/enterpriseGraph'
import { analyzeTraceImpact } from '../../traceability/analyzeImpact'
import { buildTraceabilityMatrix } from '../../traceability/buildTraceabilityMatrix'
import { detectMissingLinks } from '../../traceability/detectMissingLinks'
import type { MissingLinkWarning, TraceHighlightState, TracePath } from '../../traceability/traceabilityTypes'
import { ImpactAnalysisPanel } from './ImpactAnalysisPanel'
import { MissingLinksPanel } from './MissingLinksPanel'
import { TracePathExplorer } from './TracePathExplorer'
import { TraceabilityMatrix } from './TraceabilityMatrix'

type TraceabilityWorkspaceProps = {
  graph: EnterpriseGraph
  traceHighlight: TraceHighlightState
  onTraceHighlightChange: (state: TraceHighlightState) => void
}

export function TraceabilityWorkspace({ graph, traceHighlight, onTraceHighlightChange }: TraceabilityWorkspaceProps) {
  const [selectedNodeId, setSelectedNodeId] = useState(graph.nodes[0]?.id)
  const matrix = useMemo(() => buildTraceabilityMatrix(graph), [graph])
  const impact = useMemo(() => analyzeTraceImpact(graph, selectedNodeId), [graph, selectedNodeId])
  const missingLinks = useMemo(() => detectMissingLinks(graph), [graph])

  function publishPath(path: TracePath) {
    onTraceHighlightChange({
      selectedTracePath: path,
      impactedEntityIds: path.nodeIds,
      missingLinkNodeIds: missingLinks.map((warning) => warning.nodeId),
      riskSeverity: impact.riskLevel,
    })
  }

  function publishWarning(warning: MissingLinkWarning) {
    onTraceHighlightChange({
      selectedTracePath: { id: warning.id, label: warning.message, nodeIds: [warning.nodeId], edgeIds: [] },
      impactedEntityIds: [warning.nodeId],
      missingLinkNodeIds: [warning.nodeId],
      riskSeverity: warning.severity,
    })
    setSelectedNodeId(warning.nodeId)
  }

  return (
    <section className="traceability-workspace" aria-label="Traceability workspace">
      <section className="graph-view-switcher panel">
        <div><p className="eyebrow">Traceability</p><h2>Graph-driven impact intelligence</h2></div>
        <select value={selectedNodeId} onChange={(event) => setSelectedNodeId(event.target.value)}>
          {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select>
      </section>
      <div className="trace-layout">
        <TraceabilityMatrix matrix={matrix} />
        <div className="graph-side">
          <ImpactAnalysisPanel impact={impact} />
          <MissingLinksPanel warnings={missingLinks} onSelectWarning={publishWarning} />
          <TracePathExplorer graph={graph} selectedNodeId={selectedNodeId} onSelectPath={publishPath} />
          <aside className="panel">
            <div className="panel__header"><p className="eyebrow">Shared Highlight State</p><h2>{traceHighlight.riskSeverity}</h2></div>
            <p className="comparison-summary">{traceHighlight.selectedTracePath?.label ?? 'No trace path selected'}</p>
            <p className="comparison-summary">{traceHighlight.impactedEntityIds.length} impacted entities</p>
          </aside>
        </div>
      </div>
    </section>
  )
}
