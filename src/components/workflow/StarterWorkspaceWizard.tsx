import { useMemo, useState } from 'react'
import type { WorkspaceTemplate } from '../../templates/templateTypes'
import { GeneratedPreviewStep } from './GeneratedPreviewStep'
import { StarterWorkspaceGenerator } from './StarterWorkspaceGenerator'
import { TemplateSelectionStep } from './TemplateSelectionStep'
import { WorkspaceConfigurationStep } from './WorkspaceConfigurationStep'
import { WorkspaceGoalStep } from './WorkspaceGoalStep'

type StarterWorkspaceWizardProps = {
  open: boolean
  templates: WorkspaceTemplate[]
  defaultWorkspaceName: string
  onClose: () => void
  onGenerate: (templateId: string, options: { workspaceName: string; includeCheckpoint: boolean }) => void
}

export function StarterWorkspaceWizard({
  open,
  templates,
  defaultWorkspaceName,
  onClose,
  onGenerate,
}: StarterWorkspaceWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [goal, setGoal] = useState('Enterprise Architecture')
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? '')
  const [workspaceName, setWorkspaceName] = useState(defaultWorkspaceName)
  const [includeCheckpoint, setIncludeCheckpoint] = useState(true)
  const filteredTemplates = useMemo(
    () => templates.filter((template) => template.category === goal || goal === 'Enterprise Architecture').slice(0, 8),
    [goal, templates],
  )
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? filteredTemplates[0]

  if (!open) return null

  const steps = [
    <WorkspaceGoalStep key="goal" value={goal} onChange={setGoal} />,
    <TemplateSelectionStep key="template" templates={filteredTemplates} selectedTemplateId={selectedTemplate?.id ?? ''} onSelect={setSelectedTemplateId} />,
    <WorkspaceConfigurationStep key="config" workspaceName={workspaceName} onWorkspaceNameChange={setWorkspaceName} includeCheckpoint={includeCheckpoint} onIncludeCheckpointChange={setIncludeCheckpoint} />,
    <GeneratedPreviewStep key="preview" template={selectedTemplate} includeCheckpoint={includeCheckpoint} />,
  ]

  return (
    <div className="starter-wizard-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="starter-wizard" role="dialog" aria-modal="true" aria-label="Starter workspace wizard" onMouseDown={(event) => event.stopPropagation()}>
        <div className="starter-wizard__header">
          <div>
            <p className="eyebrow">Guided start</p>
            <h2>Generate a calm starter workspace</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>
        <div className="starter-wizard__body">
          <div className="starter-wizard__main">{steps[stepIndex]}</div>
          <StarterWorkspaceGenerator template={selectedTemplate} />
        </div>
        <div className="starter-wizard__footer">
          <span>{stepIndex + 1} / {steps.length}</span>
          <div>
            <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>Back</button>
            {stepIndex < steps.length - 1 ? (
              <button type="button" onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}>Next</button>
            ) : (
              <button type="button" onClick={() => {
                if (selectedTemplate) onGenerate(selectedTemplate.id, { workspaceName, includeCheckpoint })
                onClose()
              }}>
                Generate
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
