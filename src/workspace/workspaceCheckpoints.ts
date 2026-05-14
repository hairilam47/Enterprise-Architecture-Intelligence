import type { WorkspaceSnapshot } from './workspaceSnapshots'
import type { WorkspaceDocument } from './workspaceDocument'

export type WorkspaceCheckpoint = {
  id: string
  name: string
  description?: string
  snapshotId: string
  createdAt: string
  commandDepth: number
}

export type WorkspaceCheckpointState = {
  checkpoints: WorkspaceCheckpoint[]
  activeCheckpointId?: string
}

export function createWorkspaceCheckpointState(): WorkspaceCheckpointState {
  return { checkpoints: [] }
}

export function createWorkspaceCheckpoint(
  snapshot: WorkspaceSnapshot,
  name: string,
  description = '',
): WorkspaceCheckpoint {
  return {
    id: `workspace-checkpoint:${crypto.randomUUID()}`,
    name,
    description,
    snapshotId: snapshot.metadata.id,
    createdAt: new Date().toISOString(),
    commandDepth: snapshot.metadata.commandDepth,
  }
}

export function addWorkspaceCheckpoint(
  state: WorkspaceCheckpointState,
  checkpoint: WorkspaceCheckpoint,
): WorkspaceCheckpointState {
  return {
    checkpoints: [checkpoint, ...state.checkpoints],
    activeCheckpointId: checkpoint.id,
  }
}

export function deleteWorkspaceCheckpoint(state: WorkspaceCheckpointState, checkpointId: string): WorkspaceCheckpointState {
  return {
    checkpoints: state.checkpoints.filter((checkpoint) => checkpoint.id !== checkpointId),
    activeCheckpointId: state.activeCheckpointId === checkpointId ? undefined : state.activeCheckpointId,
  }
}

export function findCheckpointSnapshot(
  checkpoint: WorkspaceCheckpoint,
  snapshots: WorkspaceSnapshot[],
) {
  return snapshots.find((snapshot) => snapshot.metadata.id === checkpoint.snapshotId)
}

export function validateCheckpointRestore(checkpoint: WorkspaceCheckpoint, snapshot?: WorkspaceSnapshot) {
  const errors: string[] = []
  if (!snapshot) errors.push(`Snapshot ${checkpoint.snapshotId} was not found.`)
  if (snapshot && snapshot.metadata.commandDepth !== checkpoint.commandDepth) {
    errors.push('Checkpoint command depth does not match snapshot metadata.')
  }
  return { valid: errors.length === 0, errors }
}

export function checkpointRestoreDocument(snapshot: WorkspaceSnapshot): WorkspaceDocument {
  return structuredClone(snapshot.document)
}
