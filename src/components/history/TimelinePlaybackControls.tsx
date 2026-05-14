import type { TimelinePlaybackState } from '../../editor/timelinePlayback'
import { getPlaybackProgress } from '../../editor/timelinePlayback'

type TimelinePlaybackControlsProps = {
  playback: TimelinePlaybackState
  onPlay: () => void
  onPause: () => void
  onCancel: () => void
  onStepForward: () => void
  onStepBackward: () => void
  onSeek: (index: number) => void
  onSpeedChange: (speed: number) => void
}

export function TimelinePlaybackControls({
  playback,
  onPlay,
  onPause,
  onCancel,
  onStepForward,
  onStepBackward,
  onSeek,
  onSpeedChange,
}: TimelinePlaybackControlsProps) {
  return (
    <div className="timeline-playback-controls">
      <div className="overlay-actions">
        <button type="button" onClick={playback.status === 'playing' ? onPause : onPlay}>
          {playback.status === 'playing' ? 'Pause replay' : 'Play replay'}
        </button>
        <button type="button" onClick={onStepBackward}>Step back</button>
        <button type="button" onClick={onStepForward}>Step forward</button>
        <button type="button" onClick={onCancel}>Cancel replay</button>
      </div>
      <label>
        <span>Progress {getPlaybackProgress(playback)}%</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, playback.length - 1)}
          value={playback.index}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </label>
      <label>
        <span>Speed</span>
        <select value={playback.speed} onChange={(event) => onSpeedChange(Number(event.target.value))}>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </label>
    </div>
  )
}
