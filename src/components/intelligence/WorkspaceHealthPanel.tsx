import type { WorkspaceIntelligenceReport } from '../../intelligence/intelligenceTypes'
import { ArchitectureInsightsPanel } from './ArchitectureInsightsPanel'
import { HealthSignalList } from './HealthSignalList'
import { ReplayIntegrityPanel } from './ReplayIntegrityPanel'
import { RiskIndicatorChip } from './RiskIndicatorChip'

type WorkspaceHealthPanelProps = {
  report: WorkspaceIntelligenceReport
  mode: 'Build' | 'Analyze' | 'Replay'
}

function categoryForMode(mode: WorkspaceHealthPanelProps['mode']) {
  if (mode === 'Build') return ['topology', 'traceability', 'governance']
  if (mode === 'Analyze') return ['dependency', 'topology', 'traceability']
  return ['replay']
}

export function WorkspaceHealthPanel({ report, mode }: WorkspaceHealthPanelProps) {
  const contextualCategories = categoryForMode(mode)
  const contextualSignals = report.signals.filter((signal) => contextualCategories.includes(signal.category))

  return (
    <section className="workspace-health-panel panel" aria-label="Architecture health">
      <details>
        <summary>
          <div>
            <p className="eyebrow">Architecture health</p>
            <h2>{report.summary.headline}</h2>
          </div>
          <div className="health-summary-chips">
            <RiskIndicatorChip severity={report.summary.status} label={report.summary.status} />
            <span>{report.summary.signalCounts.warning} warnings</span>
            <span>{report.summary.signalCounts.critical} critical</span>
          </div>
        </summary>
        <div className="health-dimension-grid">
          {report.summary.dimensions.map((dimension) => (
            <div key={dimension.id}>
              <span>{dimension.label}</span>
              <strong>{dimension.status}</strong>
              <small>{dimension.summary}</small>
            </div>
          ))}
        </div>
        <HealthSignalList signals={contextualSignals} />
        {mode === 'Replay' ? <ReplayIntegrityPanel report={report} /> : <ArchitectureInsightsPanel report={report} />}
      </details>
    </section>
  )
}
