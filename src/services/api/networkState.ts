export type NetworkState = {
  isOnline: boolean
  changedAt: string
}

export function getNetworkState(): NetworkState {
  if (typeof navigator === 'undefined') {
    return { isOnline: true, changedAt: new Date().toISOString() }
  }
  return { isOnline: navigator.onLine, changedAt: new Date().toISOString() }
}

export function subscribeNetworkState(listener: (state: NetworkState) => void) {
  if (typeof window === 'undefined') return () => undefined

  function notify() {
    listener(getNetworkState())
  }

  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)

  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}
