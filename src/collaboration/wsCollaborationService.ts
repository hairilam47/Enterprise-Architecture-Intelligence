export type WsCursorEvent = {
  type: 'cursor'
  sessionId: string
  displayName: string
  color: string
  x: number
  y: number
}

export type WsPresenceEvent = {
  type: 'presence'
  sessionId: string
  displayName: string
  color: string
  action: 'join' | 'leave'
}

export type WsEvent = WsCursorEvent | WsPresenceEvent

type MessageHandler = (event: WsEvent) => void

class WsCollaborationService {
  private ws: WebSocket | null = null
  private handlers = new Set<MessageHandler>()
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private currentUrl = ''
  readonly sessionId = `ws:${crypto.randomUUID().slice(0, 8)}`

  connect(url: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.currentUrl === url) return
    this.currentUrl = url
    this._tryConnect()
  }

  private _tryConnect() {
    try {
      this.ws = new WebSocket(this.currentUrl)

      this.ws.onopen = () => {
        clearTimeout(this.reconnectTimer)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WsEvent
          for (const handler of this.handlers) handler(data)
        } catch {
          // ignore malformed messages
        }
      }

      this.ws.onclose = () => {
        this.ws = null
        // exponential back-off, cap at 8s
        const delay = Math.min(8000, 1500 * Math.pow(1.5, Math.floor(Math.random() * 3)))
        this.reconnectTimer = setTimeout(() => this._tryConnect(), delay)
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch {
      // WebSocket not available (SSR or blocked)
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  broadcast(event: Omit<WsEvent, 'sessionId'>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ ...event, sessionId: this.sessionId }))
      } catch {
        // ignore send errors
      }
    }
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => { this.handlers.delete(handler) }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsCollaborationService = new WsCollaborationService()
