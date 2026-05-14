import { applyReplayCommand, createReplaySandbox, hydrateReplaySandbox, type ReplaySandboxState } from './replaySandbox'
import { orderCommandsForReplay } from './replayHydration'
import { batchReplayCommands, createReplayPerformancePlan } from './replayPerformance'
import type { SerializedEditorCommand } from './editorCommands'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { WorkspaceSnapshot } from '../workspace/workspaceSnapshots'

export type ReplayRuntime = {
  sandbox: ReplaySandboxState
  performance: ReturnType<typeof createReplayPerformancePlan>
}

export function createReplayRuntime(
  liveDocument: WorkspaceDocument,
  commands: SerializedEditorCommand[],
  snapshots: WorkspaceSnapshot[],
): ReplayRuntime {
  return {
    sandbox: hydrateReplaySandbox(createReplaySandbox(), liveDocument),
    performance: createReplayPerformancePlan(commands.length, snapshots.length),
  }
}

export function replayCommandStream(runtime: ReplayRuntime, commands: SerializedEditorCommand[]): ReplayRuntime {
  const ordered = orderCommandsForReplay(commands)
  const batches = batchReplayCommands(ordered, runtime.performance.batchSize)
  const sandbox = batches.flat().reduce((state, command) => applyReplayCommand(state, command), runtime.sandbox)
  return {
    ...runtime,
    sandbox: { ...sandbox, status: 'complete' },
  }
}
