import { useMemo, useState } from 'react'
import { diffWorkspaceSnapshots, summarizeWorkspaceDiff } from '../../workspace/workspaceDiff'
import type { WorkspaceCheckpoint } from '../../workspace/workspaceCheckpoints'
import type { WorkspaceSnapshot } from '../../workspace/workspaceSnapshots'
import { compareSnapshots, scoreRestoreCandidate } from '../../workspace/workspaceSnapshots'
import { DiffPanel } from './DiffPanel'
import { CanvasDiffRenderer } from './diff/CanvasDiffRenderer'
import { GraphDiffRenderer } from './diff/GraphDiffRenderer'
import { MetadataDiffRenderer } from './diff/MetadataDiffRenderer'

type WorkspaceDiffViewerProps = {
  snapshots: WorkspaceSnapshot[]
  checkpoints: WorkspaceCheckpoint[]
  currentVersion: number
}

export function WorkspaceDiffViewer({ snapshots, checkpoints, currentVersion }: WorkspaceDiffViewerProps) {
  const [leftId, setLeftId] = useState(snapshots[1]?.metadata.id ?? snapshots[0]?.metadata.id ?? '')
  const [rightId, setRightId] = useState(snapshots[0]?.metadata.id ?? '')
  const left = snapshots.find((snapshot) => snapshot.metadata.id === leftId)
  const right = snapshots.find((snapshot) => snapshot.metadata.id === rightId)
  const diff = useMemo(() => {
    if (left && right) return diffWorkspaceSnapshots(left, right)
    if (left) return summarizeWorkspaceDiff(left.document, left.document)
    return undefined
  }, [left, right])
  const lineage = left && right ? compareSnapshots(left, right) : undefined
  const commandSnapshotIds = new Set(checkpoints.map((checkpoint) => checkpoint.snapshotId))

  if (snapshots.length === 0) return null

  return (
    <section className="panel workspace-diff-viewer">
      <p className="eyebrow">Diff Preview</p>
      <h2>Snapshot comparison</h2>
      <div className="diff-selectors">
        <label>
          <span>Before</span>
          <select value={leftId} onChange={(event) => setLeftId(event.target.value)}>
            {snapshots.map((snapshot) => (
              <option key={snapshot.metadata.id} value={snapshot.metadata.id}>
                {snapshot.metadata.label ?? snapshot.metadata.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>After</span>
          <select value={rightId} onChange={(event) => setRightId(event.target.value)}>
            {snapshots.map((snapshot) => (
              <option key={snapshot.metadata.id} value={snapshot.metadata.id}>
                {snapshot.metadata.label ?? snapshot.metadata.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      {diff && left && right ? (
        <>
          <div className="workspace-status-grid">
            <span>{diff.changeCount} changes</span>
            <span>{diff.changedEntities} entity changes</span>
            <span>{diff.changedRelationships} relationship changes</span>
            <span>{diff.changedCanvasNodes} canvas node changes</span>
            <span>{diff.changedMetadata} metadata changes</span>
            <span>{diff.commandCountDelta} command delta</span>
            <span>Restore score {scoreRestoreCandidate(right, currentVersion)}</span>
            <span>{commandSnapshotIds.has(right.metadata.id) ? 'Checkpoint snapshot' : 'Unpinned snapshot'}</span>
            {lineage ? <span>{lineage.sameLineage ? 'Related lineage' : 'Independent lineage'}</span> : null}
          </div>
          <div className="diff-side-by-side">
            <DiffPanel title="Before" changes={diff.changes.filter((change) => change.before !== undefined)} />
            <DiffPanel title="After" changes={diff.changes.filter((change) => change.after !== undefined)} />
          </div>
          <div className="diff-renderer-grid">
            <GraphDiffRenderer changes={diff.changes} />
            <CanvasDiffRenderer changes={diff.changes} />
            <MetadataDiffRenderer changes={diff.changes} />
          </div>
        </>
      ) : null}
    </section>
  )
}
