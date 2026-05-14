import type { WorkflowAction, WorkflowProgress } from './workflowTypes'

export function resolveNextStep(progress: WorkflowProgress) {
  return progress.currentStep
}

export function resolveNextAction(progress: WorkflowProgress): WorkflowAction | undefined {
  return progress.currentStep?.suggestedAction
}
