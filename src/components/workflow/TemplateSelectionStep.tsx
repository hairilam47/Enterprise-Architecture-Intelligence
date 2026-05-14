import type { WorkspaceTemplate } from '../../templates/templateTypes'

type TemplateSelectionStepProps = {
  templates: WorkspaceTemplate[]
  selectedTemplateId: string
  onSelect: (templateId: string) => void
}

export function TemplateSelectionStep({ templates, selectedTemplateId, onSelect }: TemplateSelectionStepProps) {
  return (
    <section className="wizard-step">
      <h3>Choose a starter blueprint</h3>
      <div className="wizard-template-grid">
        {templates.map((template) => (
          <button key={template.id} type="button" className={selectedTemplateId === template.id ? 'is-active' : ''} onClick={() => onSelect(template.id)}>
            <span>{template.category}</span>
            <strong>{template.title}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
