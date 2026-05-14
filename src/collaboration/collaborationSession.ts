import type { EditorSelection } from '../editor/editorStore'
import type { TimelinePlaybackState } from '../editor/timelinePlayback'
import { createTimelinePlayback } from '../editor/timelinePlayback'
import type { CollaborationOperation } from './conflictTypes'

export type CollaborationCursorState = {
  x: number
  y: number
  visible: boolean
}

export type CollaborationSession = {
  sessionId: string
  authorId: string
  displayName: string
  color: string
  operationStream: CollaborationOperation[]
  cursor: CollaborationCursorState
  selection: EditorSelection
  replayState: TimelinePlaybackState
}

export function createCollaborationSession(input: Pick<CollaborationSession, 'authorId' | 'displayName' | 'color'> & { sessionId?: string }): CollaborationSession {
  return {
    sessionId: input.sessionId ?? `sim-session:${crypto.randomUUID()}`,
    authorId: input.authorId,
    displayName: input.displayName,
    color: input.color,
    operationStream: [],
    cursor: { x: 0, y: 0, visible: false },
    selection: { nodeIds: [], edgeIds: [], groupIds: [] },
    replayState: createTimelinePlayback(),
  }
}

export function appendSessionOperation(session: CollaborationSession, operation: CollaborationOperation): CollaborationSession {
  return { ...session, operationStream: [...session.operationStream, operation] }
}
