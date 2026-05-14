export type WorkspaceTimelineEntryModel = {
  id: string
  type: 'command' | 'transaction' | 'snapshot' | 'checkpoint' | 'restore' | 'save'
  timestamp: number
  title: string
  description?: string
  metadata: Record<string, string | number | boolean | undefined>
  snapshotId?: string
  checkpointId?: string
  replayDocument?: import('../../workspace/workspaceDocument').WorkspaceDocument
}

type TimelineEntryProps = {
  entry: WorkspaceTimelineEntryModel
  selected: boolean
  previewed?: boolean
  onSelect: (entry: WorkspaceTimelineEntryModel) => void
}

export function TimelineEntry({ entry, selected, previewed = false, onSelect }: TimelineEntryProps) {
  return (
    <button
      type="button"
      className={`timeline-entry timeline-entry--${entry.type} ${selected ? 'is-selected' : ''} ${previewed ? 'is-previewed' : ''}`}
      onClick={() => onSelect(entry)}
    >
      <span>{new Date(entry.timestamp).toLocaleString()}</span>
      <strong>{entry.title}</strong>
      {entry.description ? <small>{entry.description}</small> : null}
      {entry.metadata.authorId || entry.metadata.sessionId ? (
        <small>{entry.metadata.authorId ?? 'unknown'} / {entry.metadata.sessionId ?? 'session'}</small>
      ) : null}
      {entry.metadata.conflict ? <small className="is-dirty">Conflict marker</small> : null}
      <em>{entry.type}</em>
    </button>
  )
}
