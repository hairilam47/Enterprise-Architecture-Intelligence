import type { CollaborationSession } from '../../collaboration/collaborationSession'

export function RemoteSelectionLayer({ sessions }: { sessions: CollaborationSession[] }) {
  return (
    <section className="panel remote-selection-layer">
      <p className="eyebrow">Collaboration Simulation</p>
      <h2>Remote selections</h2>
      <div className="workspace-status-grid">
        {sessions.map((session) => (
          <span key={session.sessionId} style={{ borderColor: session.color }}>
            {session.displayName}: {session.selection.nodeIds.length} nodes
          </span>
        ))}
      </div>
    </section>
  )
}
