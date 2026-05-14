type WorkspaceConfigurationStepProps = {
  workspaceName: string
  onWorkspaceNameChange: (name: string) => void
  includeCheckpoint: boolean
  onIncludeCheckpointChange: (include: boolean) => void
}

export function WorkspaceConfigurationStep({
  workspaceName,
  onWorkspaceNameChange,
  includeCheckpoint,
  onIncludeCheckpointChange,
}: WorkspaceConfigurationStepProps) {
  return (
    <section className="wizard-step">
      <h3>Configure starter workspace</h3>
      <label>
        <span>Workspace name</span>
        <input value={workspaceName} onChange={(event) => onWorkspaceNameChange(event.target.value)} />
      </label>
      <label className="wizard-check">
        <input
          type="checkbox"
          checked={includeCheckpoint}
          onChange={(event) => onIncludeCheckpointChange(event.target.checked)}
        />
        <span>Create starter checkpoint</span>
      </label>
    </section>
  )
}
