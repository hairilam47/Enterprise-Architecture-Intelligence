import type { WorkspaceIntelligenceReport } from '../../intelligence/intelligenceTypes'
import { RecommendationCard } from './RecommendationCard'

type ArchitectureInsightsPanelProps = {
  report: WorkspaceIntelligenceReport
}

export function ArchitectureInsightsPanel({ report }: ArchitectureInsightsPanelProps) {
  return (
    <section className="architecture-insights-panel">
      <div className="panel__header">
        <p className="eyebrow">Architecture insights</p>
        <h2>Deterministic recommendations</h2>
      </div>
      <div className="recommendation-list">
        {report.recommendations.length ? (
          report.recommendations.slice(0, 4).map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))
        ) : (
          <p className="architecture-health-empty">No architecture recommendations right now.</p>
        )}
      </div>
    </section>
  )
}
