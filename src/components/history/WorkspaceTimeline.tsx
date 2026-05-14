import { useEffect, useMemo, useState } from 'react'
import type { CommandHistoryState } from '../../editor/commandHistory'
import type { EditorEvent } from '../../editor/editorEvents'
import {
  cancel,
  createTimelinePlayback,
  getPlaybackIntervalMs,
  pause,
  play,
  seek,
  setPlaybackLength,
  setPlaybackSpeed,
  stepBackward,
  stepForward,
} from '../../editor/timelinePlayback'
import type { WorkspaceCheckpoint } from '../../workspace/workspaceCheckpoints'
import type { WorkspaceSnapshot } from '../../workspace/workspaceSnapshots'
import type { WorkspaceDocument } from '../../workspace/workspaceDocument'
import { PlaybackOverlay } from './PlaybackOverlay'
import { TimelineEntry, type WorkspaceTimelineEntryModel } from './TimelineEntry'
import { TimelinePlaybackControls } from './TimelinePlaybackControls'
import { TimelineToolbar } from './TimelineToolbar'

type WorkspaceTimelineProps = {
  history: CommandHistoryState
  snapshots: WorkspaceSnapshot[]
  checkpoints: WorkspaceCheckpoint[]
  events: EditorEvent[]
  selectedEntryId?: string
  onSelectEntry: (entry: WorkspaceTimelineEntryModel) => void
  onCreateCheckpoint: () => void
  onRestoreCheckpoint: (checkpoint: WorkspaceCheckpoint) => void
  onDeleteCheckpoint: (checkpointId: string) => void
  onExportHistory: () => void
  onToggleRecovery: () => void
  onReplayDocumentChange?: (document: WorkspaceDocument | undefined, status: string, performanceWarning?: string) => void
}

export function WorkspaceTimeline({
  history,
  snapshots,
  checkpoints,
  events,
  selectedEntryId,
  onSelectEntry,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  onDeleteCheckpoint,
  onExportHistory,
  onToggleRecovery,
  onReplayDocumentChange,
}: WorkspaceTimelineProps) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [playback, setPlayback] = useState(() => createTimelinePlayback())
  const entries = useMemo(() => {
    const commandEntries: WorkspaceTimelineEntryModel[] = history.undoStack.map((command) => ({
      id: command.id,
      type: command.type === 'transaction.batch' ? 'transaction' : command.type.includes('restore') ? 'restore' : 'command',
      timestamp: command.timestamp,
      title: command.label,
      description: command.type,
      metadata: {
        commandType: command.type,
        transactionId: command.transactionId,
        sessionId: command.operation.sessionId,
        authorId: command.operation.authorId,
        logicalClock: command.operation.logicalClock,
      },
      replayDocument: command.after,
    }))
    const snapshotEntries: WorkspaceTimelineEntryModel[] = snapshots.map((snapshot) => ({
      id: snapshot.metadata.id,
      type: 'snapshot',
      timestamp: snapshot.metadata.timestamp,
      title: snapshot.metadata.label ?? `Snapshot v${snapshot.metadata.workspaceVersion}`,
      description: `Command depth ${snapshot.metadata.commandDepth}`,
      snapshotId: snapshot.metadata.id,
      metadata: { workspaceVersion: snapshot.metadata.workspaceVersion, commandDepth: snapshot.metadata.commandDepth },
      replayDocument: snapshot.document,
    }))
    const checkpointEntries: WorkspaceTimelineEntryModel[] = checkpoints.map((checkpoint) => ({
      id: checkpoint.id,
      type: 'checkpoint',
      timestamp: new Date(checkpoint.createdAt).getTime(),
      title: checkpoint.name,
      description: checkpoint.description,
      checkpointId: checkpoint.id,
      snapshotId: checkpoint.snapshotId,
      metadata: { commandDepth: checkpoint.commandDepth },
      replayDocument: snapshots.find((snapshot) => snapshot.metadata.id === checkpoint.snapshotId)?.document,
    }))
    const eventEntries: WorkspaceTimelineEntryModel[] = events
      .filter((event) => event.type.includes('save') || event.type.includes('restore'))
      .map((event) => ({
        id: event.id,
        type: event.type.includes('restore') ? 'restore' : 'save',
        timestamp: event.timestamp,
        title: event.type,
        metadata: { commandId: event.commandId },
      }))
    return [...commandEntries, ...snapshotEntries, ...checkpointEntries, ...eventEntries]
      .filter((entry) => filter === 'all' || entry.type === filter)
      .filter((entry) => {
        const query = search.trim().toLowerCase()
        if (!query) return true
        return [
          entry.id,
          entry.title,
          entry.description,
          entry.snapshotId,
          entry.checkpointId,
          entry.metadata.commandType,
          entry.metadata.transactionId,
          new Date(entry.timestamp).toISOString(),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .sort((left, right) => right.timestamp - left.timestamp)
  }, [checkpoints, events, filter, history.undoStack, search, snapshots])
  const playbackEntry = entries[playback.index]

  useEffect(() => {
    setPlayback((current) => setPlaybackLength(current, entries.length))
  }, [entries.length])

  useEffect(() => {
    if (playback.status !== 'playing') return
    const timeoutId = window.setTimeout(() => {
      setPlayback((current) => {
        if (current.index >= Math.max(0, current.length - 1)) return pause(current)
        return stepForward(current)
      })
    }, getPlaybackIntervalMs(playback))
    return () => window.clearTimeout(timeoutId)
  }, [playback])

  useEffect(() => {
    if (playback.status === 'cancelled' || playback.status === 'idle') {
      onReplayDocumentChange?.(undefined, playback.status)
      return
    }
    onReplayDocumentChange?.(playbackEntry?.replayDocument, playback.status)
  }, [onReplayDocumentChange, playback.status, playbackEntry?.replayDocument])

  return (
    <section className="panel workspace-timeline">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Workspace Timeline</p>
          <h2>Replay-ready history</h2>
        </div>
      </div>
      <TimelineToolbar
        filter={filter}
        search={search}
        onFilterChange={setFilter}
        onSearchChange={setSearch}
        onCreateCheckpoint={onCreateCheckpoint}
        onExportHistory={onExportHistory}
        onToggleRecovery={onToggleRecovery}
      />
      <TimelinePlaybackControls
        playback={playback}
        onPlay={() => setPlayback(play)}
        onPause={() => setPlayback(pause)}
        onCancel={() => setPlayback(cancel)}
        onStepForward={() => setPlayback(stepForward)}
        onStepBackward={() => setPlayback(stepBackward)}
        onSeek={(index) => setPlayback((current) => seek(current, index))}
        onSpeedChange={(speed) => setPlayback((current) => setPlaybackSpeed(current, speed))}
      />
      <PlaybackOverlay playback={playback} entry={playbackEntry} />
      <div className="timeline-list" role="list">
        {entries.length === 0 ? (
          <p className="empty-state">No timeline entries yet.</p>
        ) : (
          entries.map((entry) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              selected={selectedEntryId === entry.id}
              previewed={playbackEntry?.id === entry.id}
              onSelect={onSelectEntry}
            />
          ))
        )}
      </div>
      {checkpoints.length > 0 ? (
        <section className="timeline-checkpoints">
          <h3>Named checkpoints</h3>
          <ul className="workspace-save-list">
            {checkpoints.map((checkpoint) => (
              <li key={checkpoint.id}>
                <div>
                  <strong>{checkpoint.name}</strong>
                  <span>{checkpoint.description || new Date(checkpoint.createdAt).toLocaleString()}</span>
                </div>
                <div className="overlay-actions">
                  <button type="button" onClick={() => onRestoreCheckpoint(checkpoint)}>Restore</button>
                  <button type="button" onClick={() => onDeleteCheckpoint(checkpoint.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}
