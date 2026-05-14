import type { CommandHistoryState } from '../editor/commandHistory'
import type { EditorEvent } from '../editor/editorEvents'
import type { WorkspaceCheckpoint } from './workspaceCheckpoints'
import type { WorkspaceRecoveryIssue } from './workspaceRecovery'
import type { WorkspaceSnapshot } from './workspaceSnapshots'
import { verifySnapshotChecksum } from './workspaceSnapshots'

export type WorkspaceRecoveryBundle = {
  format: 'ea-studio-recovery-bundle'
  version: number
  exportedAt: string
  snapshots: WorkspaceSnapshot[]
  commands: CommandHistoryState['undoStack']
  checkpoints: WorkspaceCheckpoint[]
  issues: WorkspaceRecoveryIssue[]
  editorEvents?: EditorEvent[]
}

export function importWorkspaceRecoveryBundle(json: string) {
  const errors: string[] = []
  const warnings: string[] = []
  let bundle: WorkspaceRecoveryBundle | undefined

  try {
    bundle = JSON.parse(json) as WorkspaceRecoveryBundle
  } catch {
    return { bundle: undefined, errors: ['Recovery bundle is not valid JSON.'], warnings }
  }

  if (bundle.format !== 'ea-studio-recovery-bundle') errors.push('Unsupported recovery bundle format.')
  if (bundle.version > 1) errors.push(`Recovery bundle version ${bundle.version} is newer than supported.`)
  if (!Array.isArray(bundle.snapshots)) errors.push('Recovery bundle snapshots must be an array.')
  if (!Array.isArray(bundle.commands)) errors.push('Recovery bundle commands must be an array.')
  if (!Array.isArray(bundle.checkpoints)) errors.push('Recovery bundle checkpoints must be an array.')

  bundle.snapshots?.forEach((snapshot) => {
    if (!verifySnapshotChecksum(snapshot)) warnings.push(`Snapshot ${snapshot.metadata.id} failed checksum validation.`)
  })

  return { bundle: errors.length === 0 ? bundle : undefined, errors, warnings }
}
