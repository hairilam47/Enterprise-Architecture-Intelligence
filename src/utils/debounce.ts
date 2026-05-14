export type DebouncedFunction<TArgs extends unknown[]> = {
  (...args: TArgs): void
  cancel: () => void
  flush: () => void
}

export function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
): DebouncedFunction<TArgs> {
  let timeoutId: number | undefined
  let latestArgs: TArgs | undefined

  function cancel() {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
      timeoutId = undefined
    }
    latestArgs = undefined
  }

  function flush() {
    if (!latestArgs) return
    const args = latestArgs
    cancel()
    callback(...args)
  }

  function debounced(...args: TArgs) {
    latestArgs = args
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      timeoutId = undefined
      if (!latestArgs) return
      const nextArgs = latestArgs
      latestArgs = undefined
      callback(...nextArgs)
    }, delayMs)
  }

  debounced.cancel = cancel
  debounced.flush = flush

  return debounced
}
