import type { CommandHistoryState } from '../editor/commandHistory'
import type { WorkspaceCheckpointState } from '../workspace/workspaceCheckpoints'
import type { WorkspaceSnapshotState } from '../workspace/workspaceSnapshots'
import { verifySnapshotChecksum } from '../workspace/workspaceSnapshots'
import type { ArchitectureSignal } from './intelligenceTypes'

export function analyzeReplayIntegrity(
  commandHistory: CommandHistoryState,
  checkpoints: WorkspaceCheckpointState,
  snapshots: WorkspaceSnapshotState,
): ArchitectureSignal[] {
  const signals: ArchitectureSignal[] = []
  const commandCount = commandHistory.undoStack.length + commandHistory.redoStack.length
  const unhealthySnapshots = snapshots.snapshots.filter((snapshot) => !verifySnapshotChecksum(snapshot))

  if (checkpoints.checkpoints.length === 0) {
    signals.push({
      id: 'replay:no-checkpoints',
      severity: commandCount > 3 ? 'warning' : 'info',
      category: 'replay',
      title: 'Workspace has no recovery checkpoint',
      description: 'Replay history exists, but no named recovery point has been created yet.',
      suggestedAction: 'Create a replay checkpoint before large topology modifications.',
    })
  }

  if (commandCount >= 10 && snapshots.snapshots.length === 0) {
    signals.push({
      id: 'replay:no-snapshots',
      severity: 'warning',
      category: 'replay',
      title: 'Replay history has limited snapshot coverage',
      description: 'Long command histories without snapshots can make future recovery and replay slower.',
      suggestedAction: 'Create a checkpoint to capture a stable recovery point.',
    })
  }

  if (unhealthySnapshots.length > 0) {
    signals.push({
      id: 'replay:snapshot-integrity',
      severity: 'critical',
      category: 'replay',
      title: `${unhealthySnapshots.length} replay snapshots need integrity review`,
      description: 'Snapshot checksum validation found replay recovery points that may be unsafe to restore.',
      suggestedAction: 'Use recovery tooling to inspect or export a recovery bundle.',
    })
  }

  const operationSessions = new Set(commandHistory.undoStack.map((command) => command.operation.sessionId))
  if (operationSessions.size > 1 && checkpoints.checkpoints.length === 0) {
    signals.push({
      id: 'replay:multi-session-no-checkpoint',
      severity: 'warning',
      category: 'replay',
      title: 'Multiple operation sessions without checkpoint coverage',
      description: 'Local collaboration simulation has produced operations, but no checkpoint marks a stable merge boundary.',
      suggestedAction: 'Create a checkpoint after reviewing merged operation history.',
    })
  }

  return signals
}
