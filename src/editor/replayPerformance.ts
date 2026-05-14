import type { SerializedEditorCommand } from './editorCommands'
import type { WorkspaceSnapshot } from '../workspace/workspaceSnapshots'

export type ReplayPerformancePlan = {
  batchSize: number
  throttleMs: number
  shouldUseSnapshotAcceleration: boolean
  memoryWarning?: string
  commandCount: number
}

export function createReplayPerformancePlan(commandCount: number, snapshotCount: number): ReplayPerformancePlan {
  return {
    batchSize: commandCount > 500 ? 25 : commandCount > 150 ? 50 : 100,
    throttleMs: commandCount > 500 ? 24 : commandCount > 150 ? 12 : 0,
    shouldUseSnapshotAcceleration: snapshotCount > 0 && commandCount > 50,
    memoryWarning: commandCount > 1000 ? 'Large replay history; snapshot acceleration is recommended.' : undefined,
    commandCount,
  }
}

export function batchReplayCommands(commands: SerializedEditorCommand[], batchSize: number) {
  const batches: SerializedEditorCommand[][] = []
  for (let index = 0; index < commands.length; index += batchSize) {
    batches.push(commands.slice(index, index + batchSize))
  }
  return batches
}

export function findReplayAccelerationSnapshot(snapshots: WorkspaceSnapshot[], targetCommandDepth: number) {
  return [...snapshots]
    .filter((snapshot) => snapshot.metadata.commandDepth <= targetCommandDepth)
    .sort((left, right) => right.metadata.commandDepth - left.metadata.commandDepth)[0]
}
