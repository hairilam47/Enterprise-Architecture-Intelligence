import type { RemoteWsCursor } from '../../collaboration/useWsCollaboration'

type WsCursorLayerProps = {
  cursors: Map<string, RemoteWsCursor>
  isConnected: boolean
}

export function WsCursorLayer({ cursors, isConnected }: WsCursorLayerProps) {
  return (
    <div className="remote-cursor-layer ws-cursor-layer" aria-label="Live remote cursors" aria-hidden={!isConnected}>
      {[...cursors.values()].map((cursor) => (
        <div
          key={cursor.sessionId}
          className="remote-cursor ws-cursor"
          style={{ left: cursor.x, top: cursor.y, borderColor: cursor.color, color: cursor.color }}
        >
          <span>{cursor.displayName}</span>
        </div>
      ))}
    </div>
  )
}
