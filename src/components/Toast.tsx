import { useEffect, useState } from 'react'
import { subscribeToasts, type Toast } from '../toast/toastService'

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => subscribeToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.kind}`} role="status">
          {toast.message}
        </div>
      ))}
    </div>
  )
}
