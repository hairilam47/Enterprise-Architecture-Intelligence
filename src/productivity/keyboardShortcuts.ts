import { useEffect } from 'react'

export type KeyboardShortcut = {
  id: string
  label: string
  keys: string
  run: () => void
  preventDefault?: boolean
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) && event.key !== 'Escape') return

      const key = event.key.toLowerCase()
      const shortcut = shortcuts.find((item) => {
        const normalized = item.keys.toLowerCase()
        const wantsMeta = normalized.includes('cmd') || normalized.includes('ctrl')
        const wantsShift = normalized.includes('shift')
        const expectedKey = normalized.split('+').at(-1)
        return (
          expectedKey === key &&
          (!wantsMeta || event.metaKey || event.ctrlKey) &&
          (!wantsShift || event.shiftKey)
        )
      })

      if (!shortcut) return
      if (shortcut.preventDefault !== false) event.preventDefault()
      shortcut.run()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
