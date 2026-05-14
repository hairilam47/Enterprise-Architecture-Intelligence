import type { TimelinePlaybackState } from '../../editor/timelinePlayback'
import type { WorkspaceTimelineEntryModel } from './TimelineEntry'

type PlaybackOverlayProps = {
  playback: TimelinePlaybackState
  entry?: WorkspaceTimelineEntryModel
}

export function PlaybackOverlay({ playback, entry }: PlaybackOverlayProps) {
  if (!playback.previewMode || playback.status === 'idle' || playback.status === 'cancelled') return null

  return (
    <div className="playback-overlay" role="status">
      <strong>Replay preview mode</strong>
      <span>{playback.status}</span>
      <span>{entry ? `${entry.title} (${entry.type})` : 'No frame selected'}</span>
    </div>
  )
}
