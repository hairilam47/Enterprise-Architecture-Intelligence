import { useState, useEffect } from 'react'
import { useEAStore, selectPrimarySelection } from '../../store/eaStore'
import { LAYER_COLORS } from '../../store/eaTypes'
import type { EAStatus } from '../../store/eaTypes'
import { runValidation } from '../../validation/eaValidationRules'

const STATUS_OPTIONS: EAStatus[] = ['Active', 'Proposed', 'Deprecated', 'Retired']

export function PropertiesPanel() {
  const selected = useEAStore(selectPrimarySelection)
  const updateElement = useEAStore((s) => s.updateElement)
  const removeElement = useEAStore((s) => s.removeElement)
  const project = useEAStore((s) => s.project)

  const [issues, setIssues] = useState(() => runValidation(project))

  useEffect(() => {
    setIssues(runValidation(project))
  }, [project.version])

  const selectedIssues = selected
    ? issues.filter((i) => i.elementIds.includes(selected.id))
    : []

  if (!selected) {
    return (
      <aside style={panelStyle}>
        <div style={headerStyle}>Properties</div>
        <div style={{ padding: '20px 14px', color: '#555', fontSize: 12, textAlign: 'center' }}>
          Click an element to view its properties.
        </div>
        {issues.length > 0 && (
          <ValidationSummary issues={issues} />
        )}
      </aside>
    )
  }

  const color = LAYER_COLORS[selected.layer] ?? '#6B7280'

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>
        <span>Properties</span>
        <button
          onClick={() => removeElement(selected.id)}
          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
        >
          Delete
        </button>
      </div>

      {/* Type badge */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10,
          background: `${color}22`, border: `1px solid ${color}66`, color,
        }}>
          {selected.type}
        </span>
        <span style={{ marginLeft: 8, fontSize: 10, color: '#666' }}>{selected.layer}</span>
      </div>

      {/* Editable fields */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field
          label="Name"
          value={selected.name}
          onChange={(v) => updateElement(selected.id, { name: v })}
        />
        <Field
          label="Description"
          value={selected.description ?? ''}
          multiline
          onChange={(v) => updateElement(selected.id, { description: v })}
        />
        <div>
          <div style={labelStyle}>Status</div>
          <select
            value={selected.status}
            onChange={(e) => updateElement(selected.id, { status: e.target.value as EAStatus })}
            style={selectStyle}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Validation issues for this element */}
      {selectedIssues.length > 0 && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Issues</div>
          {selectedIssues.map((issue, i) => (
            <div key={i} style={{
              padding: '6px 8px', borderRadius: 4, marginBottom: 4, fontSize: 11,
              background: issue.severity === 'error' ? 'rgba(239,68,68,0.1)' : issue.severity === 'warning' ? 'rgba(234,179,8,0.1)' : 'rgba(96,165,250,0.1)',
              border: `1px solid ${issue.severity === 'error' ? '#ef444440' : issue.severity === 'warning' ? '#eab30840' : '#60A5FA40'}`,
              color: issue.severity === 'error' ? '#ef4444' : issue.severity === 'warning' ? '#eab308' : '#60A5FA',
            }}>
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', height: 'auto' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
    </div>
  )
}

function ValidationSummary({ issues }: { issues: ReturnType<typeof runValidation> }) {
  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.filter((i) => i.severity === 'warning').length
  return (
    <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Model Health</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {errors > 0 && <Badge label={`${errors} errors`} color="#ef4444" />}
        {warnings > 0 && <Badge label={`${warnings} warnings`} color="#eab308" />}
        {errors === 0 && warnings === 0 && <Badge label="No issues" color="#22c55e" />}
      </div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontSize: 10,
      background: `${color}22`, border: `1px solid ${color}55`, color,
    }}>
      {label}
    </span>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

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

const headerStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontWeight: 600,
  fontSize: 13,
  color: '#e0e0e0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#888',
  marginBottom: 3,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 4,
  padding: '5px 8px',
  color: '#e0e0e0',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}
