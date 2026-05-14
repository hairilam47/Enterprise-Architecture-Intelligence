import type { WorkspaceIntelligenceInput } from './intelligenceTypes'
import { detectBottlenecks } from './bottleneckDetection'
import { analyzeReplayIntegrity } from './replayIntegrity'
import { analyzeTopology } from './topologyAnalysis'
import { analyzeTraceabilityHealth } from './traceabilityHealth'

export function collectArchitectureSignals(input: WorkspaceIntelligenceInput) {
  return [
    ...analyzeTopology(input.graph),
    ...detectBottlenecks(input.graph),
    ...analyzeTraceabilityHealth(input.graph),
    ...analyzeReplayIntegrity(input.commandHistory, input.checkpoints, input.snapshots),
  ]
}
