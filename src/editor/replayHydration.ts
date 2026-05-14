import type { SerializedEditorCommand } from './editorCommands'
import { findReplayAccelerationSnapshot } from './replayPerformance'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { WorkspaceSnapshot } from '../workspace/workspaceSnapshots'

export function orderCommandsForReplay(commands: SerializedEditorCommand[]) {
  return [...commands].sort((left, right) => {
    if (left.operation.logicalClock !== right.operation.logicalClock) return left.operation.logicalClock - right.operation.logicalClock
    return left.id.localeCompare(right.id)
  })
}

export function hydrateReplayFromSnapshot(
  liveDocument: WorkspaceDocument,
  snapshots: WorkspaceSnapshot[],
  commands: SerializedEditorCommand[],
  targetIndex: number,
) {
  const ordered = orderCommandsForReplay(commands)
  const snapshot = findReplayAccelerationSnapshot(snapshots, targetIndex)
  const baseDocument = snapshot?.document ?? liveDocument
  const startIndex = snapshot?.metadata.commandDepth ?? 0
  return {
    baseDocument: structuredClone(baseDocument),
    commands: ordered.slice(startIndex, targetIndex + 1),
    accelerationSnapshotId: snapshot?.metadata.id,
  }
}

export function hydrateReplayPreviewDocument(
  liveDocument: WorkspaceDocument,
  snapshots: WorkspaceSnapshot[],
  commands: SerializedEditorCommand[],
  targetIndex: number,
) {
  const hydration = hydrateReplayFromSnapshot(liveDocument, snapshots, commands, targetIndex)
  return hydration.commands.reduce((document, command) => structuredClone(command.after), hydration.baseDocument)
}
