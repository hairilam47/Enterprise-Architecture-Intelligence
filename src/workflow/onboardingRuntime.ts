import { createWorkflowProgressionState } from './progressionTracker'
import type { WorkflowProgressionState } from './workflowTypes'

const storageKey = 'ea-studio:onboarding-runtime'

export function loadOnboardingRuntime(defaultWorkflowId: string): WorkflowProgressionState {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return createWorkflowProgressionState(defaultWorkflowId)
    const parsed = JSON.parse(raw) as WorkflowProgressionState
    return parsed.activeWorkflowId ? parsed : createWorkflowProgressionState(defaultWorkflowId)
  } catch {
    return createWorkflowProgressionState(defaultWorkflowId)
  }
}

export function saveOnboardingRuntime(state: WorkflowProgressionState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // Onboarding state is optional and must not block workspace editing.
  }
}
