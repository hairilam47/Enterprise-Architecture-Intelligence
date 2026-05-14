import type { WorkspaceDiffChange } from '../../../workspace/workspaceDiff'

export function MetadataDiffRenderer({ changes }: { changes: WorkspaceDiffChange[] }) {
  const metadataChanges = changes.filter((change) => change.path.startsWith('metadata'))
  return (
    <section className="metadata-diff-renderer">
      <h3>Metadata diffs</h3>
      <span>{metadataChanges.length} metadata changes</span>
    </section>
  )
}
