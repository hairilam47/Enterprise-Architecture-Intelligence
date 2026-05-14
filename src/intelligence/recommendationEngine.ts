import type { ArchitectureRecommendation, ArchitectureSignal } from './intelligenceTypes'

export function generateRecommendations(signals: ArchitectureSignal[]): ArchitectureRecommendation[] {
  return signals
    .filter((signal) => signal.suggestedAction)
    .slice(0, 5)
    .map((signal) => ({
      id: `recommendation:${signal.id}`,
      title: signal.suggestedAction ?? signal.title,
      description: `Because: ${signal.description}`,
      sourceSignalIds: [signal.id],
      suggestedAction: signal.suggestedAction,
    }))
}
