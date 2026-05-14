const zones = ['Business', 'Application', 'Integration', 'Data', 'Infrastructure', 'Operations']

export function WorkspaceZoneLayer() {
  return (
    <div className="workspace-zone-layer" aria-hidden="true">
      {zones.map((zone) => (
        <div key={zone} className="workspace-zone">
          <span>{zone}</span>
        </div>
      ))}
    </div>
  )
}
