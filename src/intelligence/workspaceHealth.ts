import { collectArchitectureSignals } from './architectureSignals'
import { analyzeDependencyConcentration } from './dependencyAnalysis'
import { summarizeWorkspaceHealth } from './healthScoring'
import type { WorkspaceIntelligenceInput, WorkspaceIntelligenceReport } from './intelligenceTypes'
import { generateRecommendations } from './recommendationEngine'
import { sortArchitectureSignals } from './signalRegistry'

export function analyzeWorkspaceHealth(input: WorkspaceIntelligenceInput): WorkspaceIntelligenceReport {
  const signals = sortArchitectureSignals(collectArchitectureSignals(input))
  return {
    summary: summarizeWorkspaceHealth(signals),
    signals,
    recommendations: generateRecommendations(signals),
    heatPoints: analyzeDependencyConcentration(input.graph),
  }
}
