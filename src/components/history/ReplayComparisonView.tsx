import { summarizeWorkspaceDiff } from '../../workspace/workspaceDiff'
import type { WorkspaceDocument } from '../../workspace/workspaceDocument'

type ReplayComparisonViewProps = {
  liveDocument: WorkspaceDocument
  replayDocument?: WorkspaceDocument
  mode?: 'side_by_side' | 'overlay'
}

export function ReplayComparisonView({ liveDocument, replayDocument, mode = 'side_by_side' }: ReplayComparisonViewProps) {
  if (!replayDocument) return null

  const diff = summarizeWorkspaceDiff(liveDocument, replayDocument)

  return (
    <section className={`panel replay-comparison replay-comparison--${mode}`}>
      <p className="eyebrow">Replay / Live Comparison</p>
      <h2>Isolated time-travel preview</h2>
      <div className="workspace-status-grid">
        <span>{diff.changedEntities} entity changes</span>
        <span>{diff.changedRelationships} relationship changes</span>
        <span>{diff.changedCanvasNodes} canvas changes</span>
        <span>{diff.changedMetadata} metadata changes</span>
        <span>{diff.changeCount} total diffs</span>
      </div>
      <div className="replay-comparison-grid">
        <article>
          <h3>Live</h3>
          <strong>{liveDocument.name}</strong>
          <span>v{liveDocument.version}</span>
          <span>{liveDocument.domainRegistryState.entities.length} entities</span>
          <span>{liveDocument.compositionCanvasState.nodes.length} canvas nodes</span>
        </article>
        <article>
          <h3>Replay</h3>
          <strong>{replayDocument.name}</strong>
          <span>v{replayDocument.version}</span>
          <span>{replayDocument.domainRegistryState.entities.length} entities</span>
          <span>{replayDocument.compositionCanvasState.nodes.length} canvas nodes</span>
        </article>
      </div>
    </section>
  )
}
