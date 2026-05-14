export type StarterWorkflow = {
  id: string
  title: string
  description: string
  category: 'create' | 'import' | 'demo' | 'template'
  run: () => void
}

type WorkspaceLauncherProps = {
  open: boolean
  workflows: StarterWorkflow[]
  onClose: () => void
}

export function WorkspaceLauncher({ open, workflows, onClose }: WorkspaceLauncherProps) {
  if (!open) return null

  return (
    <div className="workspace-launcher-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="workspace-launcher" role="dialog" aria-modal="true" aria-label="Workspace launcher" onMouseDown={(event) => event.stopPropagation()}>
        <div className="workspace-launcher__hero">
          <p className="eyebrow">First step</p>
          <h2>Choose how to start</h2>
          <p>Open the right surface without hunting through panels. Everything remains local and user-controlled.</p>
        </div>
        <div className="workspace-launcher__grid">
          {workflows.map((workflow) => (
            <button
              key={workflow.id}
              type="button"
              onClick={() => {
                workflow.run()
                onClose()
              }}
            >
              <span>{workflow.category}</span>
              <strong>{workflow.title}</strong>
              <small>{workflow.description}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
