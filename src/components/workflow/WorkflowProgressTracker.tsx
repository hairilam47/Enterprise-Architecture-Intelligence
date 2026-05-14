import type { WorkflowProgress } from '../../workflow/workflowTypes'

type WorkflowProgressTrackerProps = {
  progress: WorkflowProgress
}

export function WorkflowProgressTracker({ progress }: WorkflowProgressTrackerProps) {
  if (progress.percentComplete >= 100) return null

  return (
    <section className="workflow-progress-tracker" aria-label="Workflow progress">
      <div>
        <span>{progress.workflow.title}</span>
        <strong>{progress.percentComplete}%</strong>
      </div>
      <ol>
        {progress.workflow.steps.map((step) => (
          <li key={step.id} className={`is-${progress.stepStates[step.id]}`}>
            {step.mode ? <span>{step.mode}</span> : null}
            <small>{step.title}</small>
          </li>
        ))}
      </ol>
    </section>
  )
}
