import type { WorkspaceDiffChange } from '../../../workspace/workspaceDiff'

export function CanvasDiffRenderer({ changes }: { changes: WorkspaceDiffChange[] }) {
  const canvasChanges = changes.filter((change) => change.path.startsWith('compositionCanvasState'))
  return (
    <section className="canvas-diff-renderer">
      <h3>Canvas diffs</h3>
      <span>{canvasChanges.length} composition canvas changes</span>
    </section>
  )
}
