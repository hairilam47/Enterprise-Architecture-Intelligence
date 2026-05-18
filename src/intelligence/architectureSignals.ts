import type { WorkspaceIntelligenceInput } from './intelligenceTypes'
import { analyzeLayerLoad, detectBottlenecks } from './bottleneckDetection'
import { analyzeReplayIntegrity } from './replayIntegrity'
import { analyzeTopology } from './topologyAnalysis'
import { analyzeTraceabilityHealth } from './traceabilityHealth'

export function collectArchitectureSignals(input: WorkspaceIntelligenceInput) {
  return [
    ...analyzeTopology(input.graph),
    ...detectBottlenecks(input.graph),
    ...analyzeLayerLoad(input.graph),
    ...analyzeTraceabilityHealth(input.graph),
    ...analyzeReplayIntegrity(input.commandHistory, input.checkpoints, input.snapshots),
  ]
}
