import type { CommandHistoryState } from '../editor/commandHistory'
import type { EditorEvent } from '../editor/editorEvents'
import type { WorkspaceCheckpoint } from './workspaceCheckpoints'
import type { WorkspaceSnapshot } from './workspaceSnapshots'

export type WorkspaceHistoryBundle = {
  format: 'ea-studio-history-bundle'
  bundleVersion: number
  exportedAt: string
  compatibility: {
    minSchemaVersion: number
    source: 'browser-local'
  }
  history: CommandHistoryState
  snapshots: WorkspaceSnapshot[]
  editorEvents: EditorEvent[]
  checkpoints: WorkspaceCheckpoint[]
}

export function exportWorkspaceHistoryBundle(input: Omit<WorkspaceHistoryBundle, 'format' | 'bundleVersion' | 'exportedAt' | 'compatibility'>) {
  const bundle: WorkspaceHistoryBundle = {
    format: 'ea-studio-history-bundle',
    bundleVersion: 1,
    exportedAt: new Date().toISOString(),
    compatibility: {
      minSchemaVersion: 1,
      source: 'browser-local',
    },
    ...structuredClone(input),
  }
  return JSON.stringify(bundle, null, 2)
}

export function importWorkspaceHistoryBundle(json: string) {
  const errors: string[] = []
  let bundle: WorkspaceHistoryBundle | undefined
  try {
    bundle = JSON.parse(json) as WorkspaceHistoryBundle
  } catch {
    return { bundle: undefined, errors: ['History bundle is not valid JSON.'], warnings: [] }
  }

  if (bundle.format !== 'ea-studio-history-bundle') errors.push('History bundle format is unsupported.')
  if (bundle.bundleVersion > 1) errors.push(`History bundle version ${bundle.bundleVersion} is newer than supported.`)
  if (!bundle.history || !Array.isArray(bundle.history.undoStack)) errors.push('History bundle is missing command history.')
  if (!Array.isArray(bundle.snapshots)) errors.push('History bundle snapshots must be an array.')
  if (!Array.isArray(bundle.editorEvents)) errors.push('History bundle editorEvents must be an array.')
  if (!Array.isArray(bundle.checkpoints)) errors.push('History bundle checkpoints must be an array.')

  return { bundle: errors.length === 0 ? bundle : undefined, errors, warnings: [] }
}

export function downloadHistoryBundle(filename: string, json: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
