import type { WorkflowStep } from '../../workflow/workflowTypes'

type NextStepCardProps = {
  step?: WorkflowStep
  onAction?: () => void
  onDismiss?: (stepId: string) => void
}

export function NextStepCard({ step, onAction, onDismiss }: NextStepCardProps) {
  if (!step) return null

  return (
    <section className="next-step-card" aria-label="Next workflow step">
      <p className="eyebrow">Next step</p>
      <h2>{step.title}</h2>
      <p>{step.description}</p>
      <div className="next-step-card__actions">
        {step.suggestedAction ? <button type="button" onClick={onAction}>{step.suggestedAction.label}</button> : null}
        {onDismiss ? <button type="button" onClick={() => onDismiss(step.id)}>Later</button> : null}
      </div>
    </section>
  )
}
