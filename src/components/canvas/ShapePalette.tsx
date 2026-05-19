import type { DragEvent } from 'react'
import type { EAElementType, EALayer } from '../../store/eaTypes'
import { LAYER_COLORS } from '../../store/eaTypes'
import { ARCHIMATE_ICONS, getIconForType } from '../../assets/archimateIcons'

export type PaletteItem = {
  type: EAElementType
  label: string
  layer: EALayer
}

const PALETTE_SECTIONS: { layer: EALayer; items: PaletteItem[] }[] = [
  {
    layer: 'Strategy',
    items: [
      { type: 'Capability',      label: 'Capability',      layer: 'Strategy' },
      { type: 'ValueStream',     label: 'Value Stream',    layer: 'Strategy' },
      { type: 'CourseOfAction',  label: 'Course of Action',layer: 'Strategy' },
    ],
  },
  {
    layer: 'Business',
    items: [
      { type: 'BusinessActor',   label: 'Business Actor',   layer: 'Business' },
      { type: 'BusinessRole',    label: 'Business Role',    layer: 'Business' },
      { type: 'BusinessProcess', label: 'Business Process', layer: 'Business' },
      { type: 'BusinessService', label: 'Business Service', layer: 'Business' },
      { type: 'BusinessFunction',label: 'Business Function',layer: 'Business' },
      { type: 'BusinessObject',  label: 'Business Object',  layer: 'Business' },
    ],
  },
  {
    layer: 'Application',
    items: [
      { type: 'ApplicationComponent', label: 'App Component', layer: 'Application' },
      { type: 'ApplicationService',   label: 'App Service',   layer: 'Application' },
      { type: 'ApplicationFunction',  label: 'App Function',  layer: 'Application' },
      { type: 'DataObject',           label: 'Data Object',   layer: 'Application' },
    ],
  },
  {
    layer: 'Technology',
    items: [
      { type: 'Node',                 label: 'Node',                  layer: 'Technology' },
      { type: 'Device',               label: 'Device',                layer: 'Technology' },
      { type: 'SystemSoftware',       label: 'System Software',       layer: 'Technology' },
      { type: 'TechnologyService',    label: 'Technology Service',    layer: 'Technology' },
      { type: 'Artifact',             label: 'Artifact',              layer: 'Technology' },
      { type: 'CommunicationNetwork', label: 'Network',               layer: 'Technology' },
    ],
  },
  {
    layer: 'Motivation',
    items: [
      { type: 'Stakeholder',  label: 'Stakeholder', layer: 'Motivation' },
      { type: 'Goal',         label: 'Goal',        layer: 'Motivation' },
      { type: 'Requirement',  label: 'Requirement', layer: 'Motivation' },
      { type: 'Principle',    label: 'Principle',   layer: 'Motivation' },
    ],
  },
  {
    layer: 'Implementation',
    items: [
      { type: 'WorkPackage',  label: 'Work Package',  layer: 'Implementation' },
      { type: 'Deliverable',  label: 'Deliverable',   layer: 'Implementation' },
      { type: 'Gap',          label: 'Gap',           layer: 'Implementation' },
    ],
  },
]

type ShapePaletteProps = {
  className?: string
}

export function ShapePalette({ className = '' }: ShapePaletteProps) {
  function handleDragStart(e: DragEvent<HTMLDivElement>, item: PaletteItem) {
    e.dataTransfer.setData('application/ea-element-type', item.type)
    e.dataTransfer.setData('application/ea-element-layer', item.layer)
    e.dataTransfer.setData('application/ea-element-label', item.label)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside
      className={`shape-palette ${className}`}
      style={{
        width: 200,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--color-surface, #1a1a2e)',
        borderRight: '1px solid var(--color-border, #2a2a4a)',
        padding: '8px 0',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Element Palette
      </div>

      {PALETTE_SECTIONS.map((section) => {
        const color = LAYER_COLORS[section.layer]
        return (
          <div key={section.layer} style={{ marginBottom: 4 }}>
            <div
              style={{
                padding: '6px 12px 4px',
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color,
                borderLeft: `3px solid ${color}`,
                marginLeft: 4,
              }}
            >
              {section.layer}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 6px' }}>
              {section.items.map((item) => {
                const iconId = getIconForType(item.type)
                const icon = ARCHIMATE_ICONS[iconId] ?? ARCHIMATE_ICONS.Generic
                return (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '5px 8px',
                      borderRadius: 5,
                      cursor: 'grab',
                      fontSize: 12,
                      color: '#ccc',
                      userSelect: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    }}
                  >
                    <svg
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0, color }}
                      dangerouslySetInnerHTML={{ __html: icon }}
                    />
                    <span style={{ lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
