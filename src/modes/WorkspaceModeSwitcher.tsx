export type WorkspaceMode = 'Build' | 'Analyze' | 'Replay'

type WorkspaceModeSwitcherProps = {
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
}

export function WorkspaceModeSwitcher({ mode, onModeChange }: WorkspaceModeSwitcherProps) {
  return (
    <div className="workspace-mode-switcher" aria-label="Workspace mode">
      {(['Build', 'Analyze', 'Replay'] as WorkspaceMode[]).map((item) => (
        <button
          key={item}
          type="button"
          className={mode === item ? 'is-active' : ''}
          data-mode={item}
          aria-pressed={mode === item}
          onClick={() => onModeChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
