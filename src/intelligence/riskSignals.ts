import type { ArchitectureSignal } from './intelligenceTypes'

export function getRiskSignals(signals: ArchitectureSignal[]) {
  return signals.filter((signal) => signal.severity === 'critical' || signal.severity === 'warning')
}

export function countSignalsBySeverity(signals: ArchitectureSignal[]) {
  return {
    info: signals.filter((signal) => signal.severity === 'info').length,
    warning: signals.filter((signal) => signal.severity === 'warning').length,
    critical: signals.filter((signal) => signal.severity === 'critical').length,
  }
}
