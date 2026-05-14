import type { ArchitectureSignal } from '../../intelligence/intelligenceTypes'
import { RiskIndicatorChip } from './RiskIndicatorChip'

type HealthSignalCardProps = {
  signal: ArchitectureSignal
}

export function HealthSignalCard({ signal }: HealthSignalCardProps) {
  return (
    <article className={`health-signal-card is-${signal.severity}`}>
      <div>
        <RiskIndicatorChip severity={signal.severity} label={signal.category} />
        <h3>{signal.title}</h3>
        <p>{signal.description}</p>
      </div>
      {signal.suggestedAction ? <small>{signal.suggestedAction}</small> : null}
    </article>
  )
}
