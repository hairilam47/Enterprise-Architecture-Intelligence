import type { ArchitectureSignal } from './intelligenceTypes'

export function sortArchitectureSignals(signals: ArchitectureSignal[]) {
  const severityRank = { critical: 0, warning: 1, info: 2 }
  return [...signals].sort(
    (left, right) =>
      severityRank[left.severity] - severityRank[right.severity] ||
      left.category.localeCompare(right.category) ||
      left.title.localeCompare(right.title),
  )
}

export function groupSignalsByCategory(signals: ArchitectureSignal[]) {
  return signals.reduce<Record<ArchitectureSignal['category'], ArchitectureSignal[]>>(
    (accumulator, signal) => {
      accumulator[signal.category].push(signal)
      return accumulator
    },
    { topology: [], dependency: [], traceability: [], replay: [], governance: [] },
  )
}
