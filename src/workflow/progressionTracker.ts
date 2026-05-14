import type {
  WorkflowCriteria,
  WorkflowDefinition,
  WorkflowProgress,
  WorkflowProgressionState,
  WorkflowRuntimeContext,
  WorkflowStepState,
} from './workflowTypes'

export function createWorkflowProgressionState(activeWorkflowId: string): WorkflowProgressionState {
  const now = new Date().toISOString()
  return {
    activeWorkflowId,
    completedStepIds: [],
    dismissedHintIds: [],
    startedAt: now,
    updatedAt: now,
  }
}

export function criterionMet(criteria: WorkflowCriteria, context: WorkflowRuntimeContext) {
  const count = criteria.count ?? 1
  switch (criteria.type) {
    case 'has_workspace':
      return context.workspaceCreated
    case 'has_requirement':
      return context.requirementCount >= count
    case 'has_service_or_api_or_data':
      return context.serviceApiDataCount >= count
    case 'has_relationship':
      return context.relationshipCount >= count
    case 'is_analyze_mode':
      return context.mode === 'analyze'
    case 'has_dependency_path':
      return context.relationshipCount > 0 && context.graphNodeCount > 1
    case 'has_checkpoint':
      return context.checkpointCount >= count
    case 'is_replay_mode':
      return context.mode === 'replay'
    case 'has_timeline_open':
      return context.timelineOpen
  }
}

export function stepCompleted(stepCriteria: WorkflowCriteria[] | undefined, context: WorkflowRuntimeContext) {
  if (!stepCriteria?.length) return false
  return stepCriteria.every((criteria) => criterionMet(criteria, context))
}

export function resolveWorkflowProgress(
  workflow: WorkflowDefinition,
  state: WorkflowProgressionState,
  context: WorkflowRuntimeContext,
): WorkflowProgress {
  const completedStepIds = workflow.steps
    .filter((step) => state.completedStepIds.includes(step.id) || stepCompleted(step.completionCriteria, context))
    .map((step) => step.id)
  const currentStep = workflow.steps.find((step) => !completedStepIds.includes(step.id))
  const stepStates = workflow.steps.reduce<Record<string, WorkflowStepState>>((accumulator, step) => {
    if (state.dismissedHintIds.includes(step.id)) accumulator[step.id] = 'dismissed'
    else if (completedStepIds.includes(step.id)) accumulator[step.id] = 'completed'
    else if (step.id === currentStep?.id) accumulator[step.id] = 'active'
    else if (step.optional) accumulator[step.id] = 'optional'
    else accumulator[step.id] = 'suggested'
    return accumulator
  }, {})

  return {
    workflow,
    currentStep,
    completedStepIds,
    percentComplete: Math.round((completedStepIds.length / workflow.steps.length) * 100),
    stepStates,
  }
}

export function syncCompletedSteps(state: WorkflowProgressionState, completedStepIds: string[]): WorkflowProgressionState {
  const merged = Array.from(new Set([...state.completedStepIds, ...completedStepIds]))
  if (merged.length === state.completedStepIds.length) return state
  return {
    ...state,
    completedStepIds: merged,
    updatedAt: new Date().toISOString(),
  }
}

export function dismissWorkflowHint(state: WorkflowProgressionState, hintId: string): WorkflowProgressionState {
  return {
    ...state,
    dismissedHintIds: Array.from(new Set([...state.dismissedHintIds, hintId])),
    updatedAt: new Date().toISOString(),
  }
}
