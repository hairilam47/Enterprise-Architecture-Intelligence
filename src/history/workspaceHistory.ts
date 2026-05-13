import type { Workspace, WorkspaceHistoryEntry } from '../types/architecture'

export function createWorkspaceHistoryEntry(
  workspace: Workspace,
  label = `Version ${workspace.version}`,
): WorkspaceHistoryEntry {
  return {
    id: `history-${workspace.version}-${crypto.randomUUID()}`,
    workspace: structuredClone(workspace),
    label,
    createdAt: new Date().toISOString(),
  }
}

export function appendWorkspaceHistory(
  history: WorkspaceHistoryEntry[],
  workspace: Workspace,
  label?: string,
): WorkspaceHistoryEntry[] {
  return [createWorkspaceHistoryEntry(workspace, label), ...history].slice(0, 12)
}
