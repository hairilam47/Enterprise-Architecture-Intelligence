import type { SerializedEditorCommand } from '../../editor/editorCommands'

type CommandInspectorProps = {
  command?: SerializedEditorCommand
}

export function CommandInspector({ command }: CommandInspectorProps) {
  if (!command) {
    return (
      <section className="panel command-inspector">
        <p className="eyebrow">Command Inspector</p>
        <h2>No command selected</h2>
      </section>
    )
  }

  return (
    <section className="panel command-inspector">
      <p className="eyebrow">Command Inspector</p>
      <h2>{command.label}</h2>
      <dl className="debug-metrics">
        <div>
          <dt>Type</dt>
          <dd>{command.type}</dd>
        </div>
        <div>
          <dt>Timestamp</dt>
          <dd>{new Date(command.timestamp).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Before</dt>
          <dd>v{command.before.version}</dd>
        </div>
        <div>
          <dt>After</dt>
          <dd>v{command.after.version}</dd>
        </div>
      </dl>
      <pre className="command-payload">{JSON.stringify(command.payload, null, 2)}</pre>
    </section>
  )
}
