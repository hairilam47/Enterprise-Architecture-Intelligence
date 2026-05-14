import type { KeyboardShortcut } from './keyboardShortcuts'

type ShortcutOverlayProps = {
  open: boolean
  shortcuts: KeyboardShortcut[]
  onClose: () => void
}

export function ShortcutOverlay({ open, shortcuts, onClose }: ShortcutOverlayProps) {
  if (!open) return null

  return (
    <div className="shortcut-overlay-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="shortcut-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel__header">
          <p className="eyebrow">Keyboard</p>
          <h2>Fast paths</h2>
        </div>
        <div className="shortcut-overlay__grid">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id}>
              <span>{shortcut.label}</span>
              <kbd>{shortcut.keys}</kbd>
            </div>
          ))}
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </section>
    </div>
  )
}
