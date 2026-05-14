import type { ArchitectureSignal, WorkspaceHealthDimension, WorkspaceHealthSummary } from './intelligenceTypes'
import { countSignalsBySeverity } from './riskSignals'

function dimension(
  id: WorkspaceHealthDimension['id'],
  label: string,
  signals: ArchitectureSignal[],
  category: ArchitectureSignal['category'] | ArchitectureSignal['category'][],
  stableSummary: string,
): WorkspaceHealthDimension {
  const categories = Array.isArray(category) ? category : [category]
  const related = signals.filter((signal) => categories.includes(signal.category))
  const hasCritical = related.some((signal) => signal.severity === 'critical')
  const hasWarning = related.some((signal) => signal.severity === 'warning')
  return {
    id,
    label,
    status: hasCritical ? 'risk' : hasWarning ? 'attention' : related.length ? 'incomplete' : 'stable',
    summary: related[0]?.title ?? stableSummary,
    signalIds: related.map((signal) => signal.id),
  }
}

export function summarizeWorkspaceHealth(signals: ArchitectureSignal[]): WorkspaceHealthSummary {
  const signalCounts = countSignalsBySeverity(signals)
  const dimensions = [
    dimension('connectivity', 'Topology', signals, 'topology', 'Topology stable'),
    dimension('traceability', 'Traceability', signals, ['traceability', 'governance'], 'Traceability connected'),
    dimension('replayIntegrity', 'Replay', signals, 'replay', 'Replay healthy'),
    dimension('dependencyBalance', 'Dependency balance', signals, 'dependency', 'Dependency balance stable'),
    dimension('domainCoverage', 'Domain coverage', signals, 'governance', 'Domain ownership visible'),
  ]
  const status = signalCounts.critical > 0 ? 'risk' : signalCounts.warning > 0 ? 'attention' : 'healthy'
  const headline =
    status === 'risk'
      ? 'Architecture health needs review'
      : status === 'attention'
        ? 'Architecture health has signals'
        : 'Workspace healthy'

  return {
    status,
    headline,
    signalCounts,
    dimensions,
  }
}
