import type { ArchitectureRecommendation } from '../../intelligence/intelligenceTypes'

type RecommendationCardProps = {
  recommendation: ArchitectureRecommendation
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <article className="recommendation-card">
      <strong>{recommendation.title}</strong>
      <p>{recommendation.description}</p>
    </article>
  )
}
