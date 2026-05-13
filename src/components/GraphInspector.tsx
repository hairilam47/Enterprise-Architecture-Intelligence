import type { ImpactAnalysis } from '../graph/impactAnalysis'
import type { GraphNodeMetrics } from '../visualization/graphMetrics'
import type { VisualNode } from '../visualization/visualGraph'

type GraphInspectorProps = {
  selectedNode?: VisualNode
  impact?: ImpactAnalysis
  metrics?: GraphNodeMetrics
}

function compactNames(nodes: VisualNode[]) {
  if (!nodes.length) {
    return 'None'
  }

  return nodes
    .slice(0, 3)
    .map((node) => node.label)
    .join(', ')
}

export function GraphInspector({ selectedNode, impact, metrics }: GraphInspectorProps) {
  return (
    <aside className="graph-inspector panel" aria-label="Graph inspector">
      <div className="panel__header">
        <p className="eyebrow">Graph Inspector</p>
        <h2>{selectedNode?.label ?? 'Select a node'}</h2>
      </div>

      {selectedNode ? (
        <>
          <dl className="inspector-grid">
            <div>
              <dt>Type</dt>
              <dd>{selectedNode.type}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedNode.status}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{selectedNode.metadata.owner ?? 'Unassigned'}</dd>
            </div>
          </dl>
          <p className="graph-explanation">
            {impact?.explanation ??
              `${selectedNode.label} has ${metrics?.impactCount ?? 0} related enterprise object${
                metrics?.impactCount === 1 ? '' : 's'
              } in the current impact area.`}
          </p>
          {selectedNode.metadata.metadata ? (
            <dl className="metadata-grid">
              {Object.entries(selectedNode.metadata.metadata).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <ul className="assistant-notes">
            <li>Upstream: {metrics?.upstream.length ?? Math.max((impact?.upstreamNodeIds.length ?? 1) - 1, 0)} dependencies.</li>
            <li>Downstream: {metrics?.downstream.length ?? Math.max((impact?.downstreamNodeIds.length ?? 1) - 1, 0)} impacted nodes.</li>
            <li>Related requirements: {compactNames(metrics?.relatedRequirements ?? [])}.</li>
            <li>Related APIs: {compactNames(metrics?.relatedApis ?? [])}.</li>
            <li>Related infrastructure: {compactNames(metrics?.relatedInfrastructure ?? [])}.</li>
            <li>Related tests: {compactNames(metrics?.relatedTests ?? [])}.</li>
            <li>Impact count: {metrics?.impactCount ?? 0} nodes.</li>
            <li>Risk notes: {(metrics?.riskNotes ?? ['No risk notes available.']).join(' ')}</li>
            <li>AI may highlight and suggest paths. User approval remains outside the graph.</li>
          </ul>
        </>
      ) : (
        <p className="empty-state">Click any graph node to inspect enterprise details and impact.</p>
      )}
    </aside>
  )
}
