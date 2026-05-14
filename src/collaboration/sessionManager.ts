import { createCollaborationSession, type CollaborationSession } from './collaborationSession'

export type CollaborationSessionManagerState = {
  sessions: CollaborationSession[]
  activeSessionId: string
}

export function createDefaultCollaborationSessions(): CollaborationSessionManagerState {
  const sessions = [
    createCollaborationSession({ authorId: 'user-a', displayName: 'User A', color: '#2563eb', sessionId: 'sim-user-a' }),
    createCollaborationSession({ authorId: 'user-b', displayName: 'User B', color: '#16a34a', sessionId: 'sim-user-b' }),
    createCollaborationSession({ authorId: 'user-c', displayName: 'User C', color: '#dc2626', sessionId: 'sim-user-c' }),
  ]
  return { sessions, activeSessionId: sessions[0].sessionId }
}

export function updateCollaborationSession(
  state: CollaborationSessionManagerState,
  sessionId: string,
  patch: Partial<CollaborationSession>,
): CollaborationSessionManagerState {
  return { ...state, sessions: state.sessions.map((session) => session.sessionId === sessionId ? { ...session, ...patch } : session) }
}
