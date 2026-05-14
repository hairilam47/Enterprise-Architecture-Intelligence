import type { WorkspaceDocument } from './workspaceDocument'
import type { WorkspaceSnapshot } from './workspaceSnapshots'

export type WorkspaceDiffChange = {
  path: string
  before: unknown
  after: unknown
  type: 'added' | 'removed' | 'changed'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function diffWorkspaceDocuments(before: WorkspaceDocument, after: WorkspaceDocument): WorkspaceDiffChange[] {
  const changes: WorkspaceDiffChange[] = []

  function visit(left: unknown, right: unknown, path: string) {
    if (Object.is(left, right)) return

    if (!isObject(left) || !isObject(right)) {
      changes.push({
        path,
        before: left,
        after: right,
        type: left === undefined ? 'added' : right === undefined ? 'removed' : 'changed',
      })
      return
    }

    const keys = new Set([...Object.keys(left), ...Object.keys(right)].sort())
    keys.forEach((key) => {
      visit(left[key], right[key], path ? `${path}.${key}` : key)
    })
  }

  visit(before, after, '')
  return changes
}

export function summarizeWorkspaceDiff(before: WorkspaceDocument, after: WorkspaceDocument) {
  const changes = diffWorkspaceDocuments(before, after)
  return {
    changeCount: changes.length,
    topLevelSections: Array.from(new Set(changes.map((change) => change.path.split('.')[0]).filter(Boolean))),
    changedEntities: changes.filter((change) => change.path.startsWith('domainRegistryState.entities')).length,
    changedRelationships: changes.filter((change) => change.path.startsWith('domainRegistryState.relationships')).length,
    changedCanvasNodes: changes.filter((change) => change.path.startsWith('compositionCanvasState.nodes')).length,
    changedMetadata: changes.filter((change) => change.path.startsWith('metadata')).length,
    commandCountDelta:
      (after.commandHistoryState?.undoStack.length ?? 0) - (before.commandHistoryState?.undoStack.length ?? 0),
    changes,
  }
}

export function diffWorkspaceSnapshots(before: WorkspaceSnapshot, after: WorkspaceSnapshot) {
  return summarizeWorkspaceDiff(before.document, after.document)
}
