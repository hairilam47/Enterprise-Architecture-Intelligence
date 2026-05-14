type TimelineToolbarProps = {
  filter: string
  search: string
  onFilterChange: (filter: string) => void
  onSearchChange: (search: string) => void
  onCreateCheckpoint: () => void
  onExportHistory: () => void
  onToggleRecovery: () => void
}

export function TimelineToolbar({
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onCreateCheckpoint,
  onExportHistory,
  onToggleRecovery,
}: TimelineToolbarProps) {
  return (
    <div className="timeline-toolbar">
      <label>
        <span>Filter</span>
        <select value={filter} onChange={(event) => onFilterChange(event.target.value)}>
          <option value="all">All history</option>
          <option value="command">Commands</option>
          <option value="snapshot">Snapshots</option>
          <option value="checkpoint">Checkpoints</option>
          <option value="restore">Restores</option>
          <option value="save">Saves</option>
        </select>
      </label>
      <label>
        <span>Search</span>
        <input
          value={search}
          placeholder="Command, transaction, checkpoint, snapshot..."
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <div className="overlay-actions">
        <button type="button" onClick={onCreateCheckpoint}>Create checkpoint</button>
        <button type="button" onClick={onExportHistory}>Export history</button>
        <button type="button" onClick={onToggleRecovery}>Recovery</button>
      </div>
    </div>
  )
}
