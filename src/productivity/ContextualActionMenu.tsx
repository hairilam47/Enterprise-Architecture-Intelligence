import type { CommandAction } from '../commands/commandTypes'

export type ContextualMenuState = {
  x: number
  y: number
  label: string
  actions: CommandAction[]
}

type ContextualActionMenuProps = {
  menu?: ContextualMenuState
  onClose: () => void
}

export function ContextualActionMenu({ menu, onClose }: ContextualActionMenuProps) {
  if (!menu) return null

  return (
    <div className="contextual-action-scrim" role="presentation" onMouseDown={onClose}>
      <section
        className="contextual-action-menu"
        style={{ left: menu.x, top: menu.y }}
        role="menu"
        aria-label={menu.label}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <p>{menu.label}</p>
        {menu.actions.map((action) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            onClick={() => {
              action.perform()
              onClose()
            }}
          >
            <strong>{action.title}</strong>
            <span>{action.description}</span>
          </button>
        ))}
      </section>
    </div>
  )
}
