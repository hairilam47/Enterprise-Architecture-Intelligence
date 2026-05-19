import { useEAStore } from '../../store/eaStore'

type ViewTab = 'canvas' | 'graph' | '3d'

type Props = {
  activeView: ViewTab
  onChange: (v: ViewTab) => void
}

export function ViewSwitcher({ activeView, onChange }: Props) {
  const projectName = useEAStore((s) => s.project.name)
  const totalElements = useEAStore((s) => Object.keys(s.project.elements).length)

  const tabs: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'canvas', label: '2D Canvas', icon: '⬛' },
    { id: 'graph', label: 'Graph',     icon: '◉' },
    { id: '3d',    label: '3D Scene',  icon: '◈' },
  ]

  return (
    <div
      style={{
        height: 44,
        background: 'var(--color-surface, #1a1a2e)',
        borderBottom: '1px solid var(--color-border, #2a2a4a)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {/* Project name */}
      <span style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0', marginRight: 16, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {projectName}
      </span>
      <span style={{ fontSize: 10, color: '#666', marginRight: 20 }}>{totalElements} elements</span>

      {/* View tabs */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: activeView === tab.id ? 700 : 400,
            background: activeView === tab.id ? 'rgba(96,165,250,0.15)' : 'transparent',
            color: activeView === tab.id ? '#60A5FA' : '#888',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
