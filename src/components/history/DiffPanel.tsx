import type { WorkspaceDiffChange } from '../../workspace/workspaceDiff'

type DiffPanelProps = {
  title: string
  changes: WorkspaceDiffChange[]
}

export function DiffPanel({ title, changes }: DiffPanelProps) {
  return (
    <section className="diff-panel">
      <h3>{title}</h3>
      <div className="diff-change-list">
        {changes.length === 0 ? (
          <p className="empty-state">No changes in this section.</p>
        ) : (
          changes.slice(0, 80).map((change) => (
            <article key={`${change.path}:${change.type}`} className={`diff-change diff-change--${change.type}`}>
              <strong>{change.path || '(root)'}</strong>
              <span>{change.type}</span>
              <code>{JSON.stringify(change.after ?? change.before)?.slice(0, 180)}</code>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
