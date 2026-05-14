type WorkspaceTemplate = {
  id: string
  name: string
  description: string
  mode: 'Build' | 'Analyze' | 'Replay'
}

type WorkspaceTemplatePickerProps = {
  templates: WorkspaceTemplate[]
  onSelectTemplate: (templateId: string) => void
}

export function WorkspaceTemplatePicker({ templates, onSelectTemplate }: WorkspaceTemplatePickerProps) {
  return (
    <section className="workspace-template-picker" aria-label="Workspace templates">
      <div>
        <p className="eyebrow">Templates</p>
        <h2>Enterprise starting points</h2>
      </div>
      <div className="workspace-template-picker__grid">
        {templates.map((template) => (
          <button key={template.id} type="button" onClick={() => onSelectTemplate(template.id)}>
            <span>{template.mode}</span>
            <strong>{template.name}</strong>
            <small>{template.description}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
