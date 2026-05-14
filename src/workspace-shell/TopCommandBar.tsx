import type { ReactNode } from 'react'

type TopCommandBarProps = {
  title: string
  description: string
  mode: 'Build' | 'Analyze' | 'Replay'
  status: ReactNode
  actions: ReactNode
}

export function TopCommandBar({ title, description, mode, status, actions }: TopCommandBarProps) {
  return (
    <header className="top-command-bar" data-mode={mode}>
      <div className="top-command-bar__identity">
        <span className="top-command-bar__mode">
          <span aria-hidden="true" />
          {mode}
        </span>
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="top-command-bar__status">{status}</div>
      <div className="top-command-bar__actions">{actions}</div>
    </header>
  )
}
