import type { WorkspaceTemplate } from '../../templates/templateTypes'

type GeneratedPreviewStepProps = {
  template?: WorkspaceTemplate
  includeCheckpoint: boolean
}

export function GeneratedPreviewStep({ template, includeCheckpoint }: GeneratedPreviewStepProps) {
  if (!template) return null

  return (
    <section className="wizard-step">
      <h3>Generated preview</h3>
      <div className="generated-preview-grid">
        <div><span>Entities</span><strong>{template.starterEntities?.length ?? 0}</strong></div>
        <div><span>Relationships</span><strong>{template.starterRelationships?.length ?? 0}</strong></div>
        <div><span>Checkpoint</span><strong>{includeCheckpoint ? 'Yes' : 'No'}</strong></div>
      </div>
      <p>{template.description}</p>
    </section>
  )
}
