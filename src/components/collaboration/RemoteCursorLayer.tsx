import type { CollaborationSession } from '../../collaboration/collaborationSession'

export function RemoteCursorLayer({ sessions }: { sessions: CollaborationSession[] }) {
  return (
    <div className="remote-cursor-layer" aria-label="Simulated remote cursors">
      {sessions.filter((session) => session.cursor.visible).map((session) => (
        <div
          key={session.sessionId}
          className="remote-cursor"
          style={{ left: session.cursor.x, top: session.cursor.y, borderColor: session.color, color: session.color }}
        >
          <span>{session.displayName}</span>
        </div>
      ))}
    </div>
  )
}
