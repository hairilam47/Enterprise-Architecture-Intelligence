import type { DomainRegistryState } from '../../domain/domainTypes'
import type { EnterpriseGraph } from '../../graph/enterpriseGraph'
import type { TraceHighlightState } from '../../traceability/traceabilityTypes'
import type { CompositionState } from '../../composition/compositionTypes'

type CanvasInspectorProps = {
  state: CompositionState
  graph: EnterpriseGraph
  registry: DomainRegistryState
  traceHighlight: TraceHighlightState
}

export function CanvasInspector({ state, graph, registry, traceHighlight }: CanvasInspectorProps) {
  const selectedNode = state.nodes.find((node) => node.id === state.selection.selectedNodeIds[0])
  const selectedEntity = selectedNode?.domainEntityId
    ? registry.entities.find((entity) => entity.id === selectedNode.domainEntityId)
    : undefined
  const enterpriseNode = selectedNode?.enterpriseNodeId
    ? graph.nodes.find((node) => node.id === selectedNode.enterpriseNodeId)
    : undefined
  const relationships = selectedNode
    ? state.edges.filter((edge) => edge.sourceNodeId === selectedNode.id || edge.targetNodeId === selectedNode.id)
    : []
  const traceActive = selectedNode?.enterpriseNodeId
    ? traceHighlight.selectedTracePath?.nodeIds.includes(selectedNode.enterpriseNodeId) ||
      traceHighlight.impactedEntityIds.includes(selectedNode.enterpriseNodeId)
    : false

  return (
    <aside className="panel canvas-inspector">
      <div className="panel__header">
        <p className="eyebrow">Canvas Inspector</p>
        <h2>{selectedNode ? selectedNode.label : 'Select a system'}</h2>
      </div>

      {!selectedNode ? (
        <p className="empty-state">Select a canvas node to inspect enterprise metadata, graph relationships, traceability, warnings, and bottlenecks.</p>
      ) : (
        <>
          <dl className="inspector-grid">
            <div>
              <dt>Type</dt>
              <dd>{selectedNode.kind}</dd>
            </div>
            <div>
              <dt>Layer</dt>
              <dd>{selectedNode.layer ?? 'Canvas'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{selectedNode.status}</dd>
            </div>
          </dl>

          <section>
            <h3>Entity Details</h3>
            <p className="graph-explanation">
              {selectedEntity?.description ?? enterpriseNode?.metadata?.description ?? 'This canvas item is not backed by a domain entity yet.'}
            </p>
            <ul className="compact-list">
              <li><span>Owner</span><strong>{selectedEntity?.ownerTeam ?? enterpriseNode?.owner ?? 'Unassigned'}</strong></li>
              <li><span>Graph node</span><strong>{selectedNode.enterpriseNodeId ?? 'Pending'}</strong></li>
              <li><span>Trace active</span><strong>{traceActive ? 'Yes' : 'No'}</strong></li>
            </ul>
          </section>

          <section>
            <h3>Graph Relationships</h3>
            {relationships.length === 0 ? (
              <p className="empty-state">No authored relationships yet.</p>
            ) : (
              <ul className="compact-list">
                {relationships.map((relationship) => {
                  const counterpartId =
                    relationship.sourceNodeId === selectedNode.id ? relationship.targetNodeId : relationship.sourceNodeId
                  const counterpart = state.nodes.find((node) => node.id === counterpartId)
                  return (
                    <li key={relationship.id}>
                      <span>{relationship.relationship}</span>
                      <strong>{counterpart?.label ?? counterpartId}</strong>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section>
            <h3>Risk Notes</h3>
            <ul className="assistant-notes">
              {selectedNode.status === 'warning' ? <li>Warning highlight is advisory; the user decides next action.</li> : null}
              {selectedNode.status === 'bottleneck' ? <li>Bottleneck highlight comes from graph/simulation context.</li> : null}
              {traceActive ? <li>Traceability path or impact state is currently highlighting this system.</li> : null}
              {selectedNode.status === 'normal' && !traceActive ? <li>No active warning, bottleneck, or trace highlight for this node.</li> : null}
            </ul>
          </section>
        </>
      )}
    </aside>
  )
}
