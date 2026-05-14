import type { WorkspaceDiffChange } from '../../../workspace/workspaceDiff'

export function GraphDiffRenderer({ changes }: { changes: WorkspaceDiffChange[] }) {
  const graphChanges = changes.filter(
    (change) =>
      change.path.startsWith('domainRegistryState.entities') ||
      change.path.startsWith('domainRegistryState.relationships'),
  )
  return (
    <section className="domain-diff-renderer">
      <h3>Graph and domain diffs</h3>
      <span>{graphChanges.length} graph-relevant changes</span>
    </section>
  )
}
