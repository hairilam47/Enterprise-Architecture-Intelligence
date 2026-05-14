import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import { createWorkspaceCommand } from '../editor/editorCommands'
import type { CollaborationSession } from './collaborationSession'

export function createSimulatedRemoteRename(session: CollaborationSession, document: WorkspaceDocument, name: string) {
  const after: WorkspaceDocument = {
    ...structuredClone(document),
    version: document.version + 1,
    name,
    updatedAt: new Date().toISOString(),
  }
  const command = createWorkspaceCommand({
    type: 'workspace.rename',
    label: `${session.displayName} renamed workspace`,
    before: document,
    after,
    payload: { simulated: true, authorId: session.authorId },
  }).serialize()
  command.operation = {
    ...command.operation,
    sessionId: session.sessionId,
    authorId: session.authorId,
  }
  return command
}
