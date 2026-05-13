import type { TraceImpactAnalysis } from '../../traceability/traceabilityTypes'

type ImpactAnalysisPanelProps = {
  impact: TraceImpactAnalysis
}

export function ImpactAnalysisPanel({ impact }: ImpactAnalysisPanelProps) {
  return (
    <aside className="panel" aria-label="Trace impact analysis">
      <div className="panel__header"><p className="eyebrow">Impact Analysis</p><h2>{impact.selectedNode?.label}</h2></div>
      <dl className="summary-grid">
        <div><dt>Risk</dt><dd>{impact.riskLevel}</dd></div>
        <div><dt>Impact</dt><dd>{impact.impactCount}</dd></div>
        <div><dt>Incidents</dt><dd>{impact.relatedIncidents.length}</dd></div>
      </dl>
      <ul className="assistant-notes">
        <li>Upstream dependencies: {impact.upstream.length}</li>
        <li>Downstream dependencies: {impact.downstream.length}</li>
        <li>Related APIs/services: {impact.relatedApis.length}</li>
        <li>Related infrastructure: {impact.relatedInfrastructure.length}</li>
        <li>Related tests: {impact.relatedTests.length}</li>
        <li>Risk is heuristic only. User decides what action to take.</li>
      </ul>
    </aside>
  )
}
