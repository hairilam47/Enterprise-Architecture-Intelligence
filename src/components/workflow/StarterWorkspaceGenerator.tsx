import type { WorkspaceTemplate } from '../../templates/templateTypes'

type StarterWorkspaceGeneratorProps = {
  template?: WorkspaceTemplate
}

export function StarterWorkspaceGenerator({ template }: StarterWorkspaceGeneratorProps) {
  if (!template) return null

  return (
    <aside className="starter-workspace-generator">
      <p className="eyebrow">Generator</p>
      <h3>{template.title}</h3>
      <p>{template.description}</p>
      <ul>
        {(template.starterEntities ?? []).slice(0, 5).map((entity) => (
          <li key={entity.key}>{entity.name}</li>
        ))}
      </ul>
    </aside>
  )
}
