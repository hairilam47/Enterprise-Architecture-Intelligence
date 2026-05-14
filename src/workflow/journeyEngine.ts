import { resolveContextualHints } from './contextualHints'
import { resolveNextAction, resolveNextStep } from './nextStepResolver'
import { resolveWorkflowProgress } from './progressionTracker'
import type { WorkflowDefinition, WorkflowProgressionState, WorkflowRuntimeContext } from './workflowTypes'

export function evaluateJourney(
  workflow: WorkflowDefinition,
  state: WorkflowProgressionState,
  context: WorkflowRuntimeContext,
) {
  const progress = resolveWorkflowProgress(workflow, state, context)
  const nextStep = resolveNextStep(progress)
  return {
    progress,
    nextStep,
    nextAction: resolveNextAction(progress),
    hints: resolveContextualHints(context).filter((hint) => !state.dismissedHintIds.includes(hint.id)),
  }
}
