export type ToastKind = 'success' | 'info' | 'warning' | 'error'

export type Toast = {
  id: string
  message: string
  kind: ToastKind
}

type ToastListener = (toasts: Toast[]) => void

const MAX_TOASTS = 5

let _toasts: Toast[] = []
const _listeners = new Set<ToastListener>()

function _notify() {
  for (const listener of _listeners) listener([..._toasts])
}

export function showToast(message: string, kind: ToastKind = 'info', durationMs = 2800): void {
  const id = crypto.randomUUID()
  // L3: cap queue so rapid showToast calls don't stack indefinitely
  const base = _toasts.length >= MAX_TOASTS ? _toasts.slice(1) : _toasts
  _toasts = [...base, { id, message, kind }]
  _notify()
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id)
    _notify()
  }, durationMs)
}

export function subscribeToasts(listener: ToastListener): () => void {
  _listeners.add(listener)
  listener([..._toasts])
  return () => { _listeners.delete(listener) }
}
