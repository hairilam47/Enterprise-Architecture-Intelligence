import type { ArchitectureSignalSeverity } from '../../intelligence/intelligenceTypes'

type RiskIndicatorChipProps = {
  severity: ArchitectureSignalSeverity | 'healthy' | 'attention' | 'risk'
  label: string
}

export function RiskIndicatorChip({ severity, label }: RiskIndicatorChipProps) {
  return <span className={`risk-indicator-chip is-${severity}`}>{label}</span>
}
