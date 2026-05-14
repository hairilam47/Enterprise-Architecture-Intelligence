import type { CompositionNodeTemplate } from '../../composition/compositionTypes'

export const compositionTemplates: CompositionNodeTemplate[] = [
  {
    kind: 'requirement',
    label: 'Requirement',
    description: 'Business capability, constraint, or traceable need.',
    domainKind: 'requirement',
    layer: 'Business',
  },
  {
    kind: 'api',
    label: 'API',
    description: 'Integration surface or contract between systems.',
    domainKind: 'api',
    layer: 'Integration',
  },
  {
    kind: 'database',
    label: 'Database',
    description: 'Table, store, lakehouse asset, or governed data product.',
    domainKind: 'databaseTable',
    layer: 'Data',
  },
  {
    kind: 'service',
    label: 'Service',
    description: 'Application service, capability, or bounded implementation.',
    domainKind: 'service',
    layer: 'Application',
  },
  {
    kind: 'infrastructure',
    label: 'Infrastructure',
    description: 'Runtime, deployment target, network, or platform component.',
    domainKind: 'infrastructureComponent',
    layer: 'Infrastructure',
  },
  {
    kind: 'testcase',
    label: 'Test Case',
    description: 'Validation, control, or automated regression coverage.',
    domainKind: 'testCase',
    layer: 'Operations',
  },
  {
    kind: 'incident',
    label: 'Incident',
    description: 'Operational event, risk scenario, or failure mode.',
    domainKind: 'incident',
    layer: 'Operations',
  },
  {
    kind: 'group',
    label: 'Group',
    description: 'Subsystem group for selected systems.',
  },
  {
    kind: 'environment',
    label: 'Environment',
    description: 'Runtime environment container.',
  },
  {
    kind: 'zone',
    label: 'Zone',
    description: 'Team ownership or architecture zone.',
  },
]

type CompositionPaletteProps = {
  onAddTemplate: (template: CompositionNodeTemplate) => void
}

export function CompositionPalette({ onAddTemplate }: CompositionPaletteProps) {
  return (
    <aside className="panel composition-palette" aria-label="Composition palette">
      <div className="panel__header">
        <p className="eyebrow">Palette</p>
        <h2>Author architecture</h2>
      </div>
      <div className="palette-grid">
        {compositionTemplates.map((template) => (
          <button
            key={template.kind}
            type="button"
            draggable
            onClick={() => onAddTemplate(template)}
            onDragStart={(event) => {
              event.dataTransfer.setData('application/x-composition-template', JSON.stringify(template))
              event.dataTransfer.effectAllowed = 'copy'
            }}
          >
            <strong>{template.label}</strong>
            <span>{template.layer ?? 'Container'}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
