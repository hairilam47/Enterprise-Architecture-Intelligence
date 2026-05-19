import { useEAStore, selectPrimarySelection } from '../../store/eaStore'
import { selectDirectDependencies, selectUpstreamChain, selectDownstreamChain } from '../../store/eaSelectors'
import { LAYER_COLORS } from '../../store/eaTypes'
import type { EAElement } from '../../store/eaTypes'

type Props = {
  onClose?: () => void
}

function ElementChip({ el, onClick }: { el: EAElement; onClick: (id: string) => void }) {
  const color = LAYER_COLORS[el.layer] ?? '#6B7280'
  return (
    <button
      onClick={() => onClick(el.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}40`,
        color: '#ccc', fontSize: 11, width: '100%', textAlign: 'left',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.name}</span>
      <span style={{ color: color, fontSize: 9, flexShrink: 0, marginLeft: 'auto' }}>{el.type}</span>
    </button>
  )
}

export function ImpactAnalysisPanel({ onClose }: Props) {
  const selected = useEAStore(selectPrimarySelection)
  const direct = useEAStore(selected ? selectDirectDependencies(selected.id) : () => [])
  const upstream = useEAStore(selected ? selectUpstreamChain(selected.id) : () => [])
  const downstream = useEAStore(selected ? selectDownstreamChain(selected.id) : () => [])
  const setSelection = useEAStore((s) => s.setSelection)
  const setHighlighted = useEAStore((s) => s.setHighlighted)
  const clearHighlighted = useEAStore((s) => s.clearHighlighted)

  function focusElement(id: string) {
    setSelection([id])
  }

  function highlightAll() {
    const ids = [...upstream.map((e) => e.id), ...downstream.map((e) => e.id)]
    setHighlighted(ids)
  }

  if (!selected) {
    return (
      <aside style={panelStyle}>
        <PanelHeader title="Impact Analysis" onClose={onClose} />
        <div style={{ padding: '20px 16px', color: '#666', fontSize: 12, textAlign: 'center' }}>
          Select an element on the canvas to see its impact analysis.
        </div>
      </aside>
    )
  }

  const color = LAYER_COLORS[selected.layer] ?? '#6B7280'
  const upstreamOnly = upstream.filter((e) => !downstream.find((d) => d.id === e.id))
  const downstreamOnly = downstream.filter((e) => !upstream.find((u) => u.id === e.id))

  return (
    <aside style={panelStyle}>
      <PanelHeader title="Impact Analysis" onClose={onClose} />

      {/* Selected element */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Selected</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: '#e0e0e0', fontSize: 13 }}>{selected.name}</span>
        </div>
        <div style={{ fontSize: 10, color, marginTop: 2 }}>{selected.type} · {selected.layer}</div>
      </div>

      {/* Quick actions */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 6 }}>
        <ActionBtn label="Highlight all affected" onClick={highlightAll} />
        <ActionBtn label="Clear highlights" onClick={clearHighlighted} secondary />
      </div>

      {/* Summary */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 12 }}>
        <Stat label="Upstream" value={upstreamOnly.length} color="#60A5FA" />
        <Stat label="Downstream" value={downstreamOnly.length} color="#34D399" />
        <Stat label="Direct" value={direct.length} color={color} />
      </div>

      {/* Direct relationships */}
      {direct.length > 0 && (
        <Section title="Direct Relationships">
          {direct.map(({ element, relationship, direction }) => (
            <div key={relationship.id} style={{ marginBottom: 3 }}>
              <div style={{ fontSize: 9, color: direction === 'upstream' ? '#60A5FA' : '#34D399', marginBottom: 1 }}>
                {direction === 'upstream' ? '◀ upstream' : '▶ downstream'} · {relationship.type}
              </div>
              <ElementChip el={element} onClick={focusElement} />
            </div>
          ))}
        </Section>
      )}

      {/* Upstream chain */}
      {upstreamOnly.length > 0 && (
        <Section title={`What I depend on (${upstreamOnly.length})`}>
          {upstreamOnly.map((el) => (
            <ElementChip key={el.id} el={el} onClick={focusElement} />
          ))}
        </Section>
      )}

      {/* Downstream chain */}
      {downstreamOnly.length > 0 && (
        <Section title={`What depends on me (${downstreamOnly.length})`}>
          {downstreamOnly.map((el) => (
            <ElementChip key={el.id} el={el} onClick={focusElement} />
          ))}
        </Section>
      )}

      {direct.length === 0 && upstream.length === 0 && downstream.length === 0 && (
        <div style={{ padding: '20px 16px', color: '#666', fontSize: 12, textAlign: 'center' }}>
          No relationships found for this element.
        </div>
      )}
    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  width: 240,
  height: '100%',
  overflowY: 'auto',
  background: 'var(--color-surface, #1a1a2e)',
  borderLeft: '1px solid var(--color-border, #2a2a4a)',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
}

function PanelHeader({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 600, fontSize: 13, color: '#e0e0e0' }}>{title}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16 }}>✕</button>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{children}</div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function ActionBtn({ label, onClick, secondary = false }: { label: string; onClick: () => void; secondary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
        background: secondary ? 'transparent' : 'rgba(96,165,250,0.15)',
        border: `1px solid ${secondary ? 'rgba(255,255,255,0.1)' : '#60A5FA40'}`,
        color: secondary ? '#666' : '#60A5FA', fontSize: 10,
      }}
    >
      {label}
    </button>
  )
}
