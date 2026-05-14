import type { SerializedEditorCommand } from '../editor/editorCommands'
import type { WorkspaceCheckpoint } from './workspaceCheckpoints'
import type { WorkspaceDocument } from './workspaceDocument'
import type { WorkspaceSnapshot } from './workspaceSnapshots'
import { verifySnapshotChecksum } from './workspaceSnapshots'

export type RecoveryIssueType =
  | 'failed_save'
  | 'corrupted_snapshot'
  | 'invalid_replay_chain'
  | 'stale_state'
  | 'failed_command_replay'

export type WorkspaceRecoveryIssue = {
  id: string
  type: RecoveryIssueType
  severity: 'info' | 'warning' | 'error'
  message: string
  createdAt: string
}

export type WorkspaceRecoveryStatus = {
  healthy: boolean
  issues: WorkspaceRecoveryIssue[]
  latestHealthySnapshotId?: string
}

export function analyzeWorkspaceRecovery(input: {
  document: WorkspaceDocument
  snapshots: WorkspaceSnapshot[]
  commands: SerializedEditorCommand[]
  saveError?: string
}): WorkspaceRecoveryStatus {
  const issues: WorkspaceRecoveryIssue[] = []

  if (input.saveError) {
    issues.push(createRecoveryIssue('failed_save', 'warning', input.saveError))
  }

  input.snapshots.forEach((snapshot) => {
    if (!snapshot.document?.workspaceId || snapshot.document.workspaceId !== input.document.workspaceId) {
      issues.push(createRecoveryIssue('corrupted_snapshot', 'error', `Snapshot ${snapshot.metadata.id} does not match this workspace.`))
    }
    if (!verifySnapshotChecksum(snapshot)) {
      issues.push(createRecoveryIssue('corrupted_snapshot', 'error', `Snapshot ${snapshot.metadata.id} checksum verification failed.`))
    }
  })

  input.commands.forEach((command) => {
    if (command.before.workspaceId !== input.document.workspaceId || command.after.workspaceId !== input.document.workspaceId) {
      issues.push(createRecoveryIssue('invalid_replay_chain', 'error', `Command ${command.id} references a different workspace.`))
    }
  })

  return {
    healthy: issues.every((issue) => issue.severity !== 'error'),
    issues,
    latestHealthySnapshotId: input.snapshots.find((snapshot) => snapshot.document.workspaceId === input.document.workspaceId)?.metadata.id,
  }
}

export function validateRestoreIntegrity(snapshot: WorkspaceSnapshot, currentDocument: WorkspaceDocument) {
  const errors: string[] = []
  if (snapshot.document.workspaceId !== currentDocument.workspaceId) errors.push('Snapshot belongs to a different workspace.')
  if (!verifySnapshotChecksum(snapshot)) errors.push('Snapshot checksum verification failed.')
  return { valid: errors.length === 0, errors }
}

export function createRollbackRestorePlan(snapshot: WorkspaceSnapshot, currentDocument: WorkspaceDocument) {
  const validation = validateRestoreIntegrity(snapshot, currentDocument)
  return {
    valid: validation.valid,
    errors: validation.errors,
    rollbackDocument: structuredClone(currentDocument),
    restoreDocument: structuredClone(snapshot.document),
    snapshotId: snapshot.metadata.id,
  }
}

export function createRecoveryIssue(type: RecoveryIssueType, severity: WorkspaceRecoveryIssue['severity'], message: string): WorkspaceRecoveryIssue {
  return {
    id: `recovery-issue:${crypto.randomUUID()}`,
    type,
    severity,
    message,
    createdAt: new Date().toISOString(),
  }
}

export function createRecoveryBundle(input: {
  document: WorkspaceDocument
  snapshots: WorkspaceSnapshot[]
  commands: SerializedEditorCommand[]
  checkpoints: WorkspaceCheckpoint[]
  issues: WorkspaceRecoveryIssue[]
}) {
  return {
    format: 'ea-studio-recovery-bundle',
    version: 1,
    exportedAt: new Date().toISOString(),
    ...structuredClone(input),
  }
}
