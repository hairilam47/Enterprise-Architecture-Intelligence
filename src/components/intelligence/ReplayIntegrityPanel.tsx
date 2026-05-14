import type { WorkspaceIntelligenceReport } from '../../intelligence/intelligenceTypes'
import { HealthSignalList } from './HealthSignalList'

type ReplayIntegrityPanelProps = {
  report: WorkspaceIntelligenceReport
}

export function ReplayIntegrityPanel({ report }: ReplayIntegrityPanelProps) {
  const replaySignals = report.signals.filter((signal) => signal.category === 'replay')
  return (
    <section className="replay-integrity-panel">
      <div className="panel__header">
        <p className="eyebrow">Replay integrity</p>
        <h2>{replaySignals.length ? 'Replay needs context' : 'Replay healthy'}</h2>
      </div>
      <HealthSignalList signals={replaySignals} limit={4} />
    </section>
  )
}
