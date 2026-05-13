import { useState } from 'react'
import type { EnterpriseGraph } from '../../graph/enterpriseGraph'
import { traceDownstreamPath, traceRelationshipFilters, traceShortestPath, traceUpstreamPath } from '../../traceability/tracePaths'
import type { RelationshipFilter, TracePath } from '../../traceability/traceabilityTypes'

type TracePathExplorerProps = {
  graph: EnterpriseGraph
  selectedNodeId?: string
  onSelectPath: (path: TracePath) => void
}

export function TracePathExplorer({ graph, selectedNodeId, onSelectPath }: TracePathExplorerProps) {
  const [targetId, setTargetId] = useState(graph.nodes.at(-1)?.id ?? '')
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>('any')
  const sourceId = selectedNodeId ?? graph.nodes[0]?.id ?? ''

  return (
    <aside className="panel" aria-label="Trace path explorer">
      <div className="panel__header"><p className="eyebrow">Trace Path Explorer</p><h2>Follow graph paths</h2></div>
      <div className="relationship-form">
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
        </select>
        <select value={relationshipFilter} onChange={(event) => setRelationshipFilter(event.target.value as RelationshipFilter)}>
          {traceRelationshipFilters.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
        </select>
        <button type="button" onClick={() => onSelectPath(traceUpstreamPath(graph, sourceId, relationshipFilter))}>Trace upstream</button>
        <button type="button" onClick={() => onSelectPath(traceDownstreamPath(graph, sourceId, relationshipFilter))}>Trace downstream</button>
        <button type="button" onClick={() => onSelectPath(traceShortestPath(graph, sourceId, targetId, relationshipFilter))}>Shortest path</button>
      </div>
    </aside>
  )
}
