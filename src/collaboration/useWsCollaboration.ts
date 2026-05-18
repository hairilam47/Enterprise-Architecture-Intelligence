import { useCallback, useEffect, useRef, useState } from 'react'
import { wsCollaborationService } from './wsCollaborationService'

export type RemoteWsCursor = {
  sessionId: string
  displayName: string
  color: string
  x: number
  y: number
  lastSeen: number
}

const WS_URL = 'ws://localhost:3001/collab'
const CURSOR_EXPIRY_MS = 4000
const BROADCAST_THROTTLE_MS = 50

export function useWsCollaboration() {
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteWsCursor>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const lastBroadcast = useRef(0)
  const pruneTimer = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    wsCollaborationService.connect(WS_URL)

    const unsub = wsCollaborationService.subscribe((event) => {
      if (event.type === 'cursor') {
        setRemoteCursors((prev) => {
          const next = new Map(prev)
          next.set(event.sessionId, {
            sessionId: event.sessionId,
            displayName: event.displayName,
            color: event.color,
            x: event.x,
            y: event.y,
            lastSeen: Date.now(),
          })
          return next
        })
      }
      if (event.type === 'presence' && event.action === 'leave') {
        setRemoteCursors((prev) => {
          const next = new Map(prev)
          next.delete(event.sessionId)
          return next
        })
      }
    })

    // H1: subscribe to connection events instead of polling setInterval
    const unsubConn = wsCollaborationService.onConnectionChange((connected) => {
      setIsConnected(connected)
    })

    // Prune stale cursors
    pruneTimer.current = setInterval(() => {
      const cutoff = Date.now() - CURSOR_EXPIRY_MS
      setRemoteCursors((prev) => {
        let changed = false
        const next = new Map(prev)
        for (const [id, cursor] of next) {
          if (cursor.lastSeen < cutoff) { next.delete(id); changed = true }
        }
        return changed ? next : prev
      })
    }, 1500)

    return () => {
      unsub()
      unsubConn()
      clearInterval(pruneTimer.current)
      wsCollaborationService.disconnect()
    }
  }, [])

  const broadcastCursor = useCallback((x: number, y: number, displayName = 'You', color = '#2563eb') => {
    const now = Date.now()
    if (now - lastBroadcast.current < BROADCAST_THROTTLE_MS) return
    lastBroadcast.current = now
    wsCollaborationService.broadcast({ type: 'cursor', x, y, displayName, color })
  }, [])

  return { remoteCursors, isConnected, broadcastCursor }
}
