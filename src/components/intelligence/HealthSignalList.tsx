import type { ArchitectureSignal } from '../../intelligence/intelligenceTypes'
import { HealthSignalCard } from './HealthSignalCard'

type HealthSignalListProps = {
  signals: ArchitectureSignal[]
  limit?: number
}

export function HealthSignalList({ signals, limit = 6 }: HealthSignalListProps) {
  if (!signals.length) {
    return <p className="architecture-health-empty">No architecture health signals in this context.</p>
  }

  return (
    <div className="health-signal-list">
      {signals.slice(0, limit).map((signal) => (
        <HealthSignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  )
}
