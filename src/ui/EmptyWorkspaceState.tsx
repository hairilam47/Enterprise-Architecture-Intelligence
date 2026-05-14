import type { ReactNode } from 'react'

type EmptyWorkspaceAction = {
  label: string
  description: string
  onSelect: () => void
}

type EmptyWorkspaceStateProps = {
  title: string
  description: string
  eyebrow?: string
  actions?: EmptyWorkspaceAction[]
  aside?: ReactNode
}

export function EmptyWorkspaceState({
  title,
  description,
  eyebrow = 'Start here',
  actions = [],
  aside,
}: EmptyWorkspaceStateProps) {
  return (
    <section className="empty-workspace-state" aria-label={title}>
      <div className="empty-workspace-state__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions.length > 0 ? (
        <div className="empty-workspace-state__actions">
          {actions.map((action) => (
            <button key={action.label} type="button" onClick={action.onSelect}>
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </button>
          ))}
        </div>
      ) : null}
      {aside ? <div className="empty-workspace-state__aside">{aside}</div> : null}
    </section>
  )
}
