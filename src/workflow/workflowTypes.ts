export type WorkflowMode = 'build' | 'analyze' | 'replay'

export type WorkflowCriteriaType =
  | 'has_workspace'
  | 'has_requirement'
  | 'has_service_or_api_or_data'
  | 'has_relationship'
  | 'is_analyze_mode'
  | 'has_dependency_path'
  | 'has_checkpoint'
  | 'is_replay_mode'
  | 'has_timeline_open'

export type WorkflowCriteria = {
  type: WorkflowCriteriaType
  count?: number
}

export type WorkflowAction = {
  id: string
  label: string
  description: string
  targetMode?: WorkflowMode
  commandId?: string
}

export type WorkflowStep = {
  id: string
  title: string
  description: string
  mode?: WorkflowMode
  completionCriteria?: WorkflowCriteria[]
  suggestedAction?: WorkflowAction
  optional?: boolean
}

export type WorkflowDefinition = {
  id: string
  title: string
  description: string
  steps: WorkflowStep[]
}

export type WorkflowStepState = 'active' | 'completed' | 'suggested' | 'optional' | 'dismissed'

export type WorkflowProgressionState = {
  activeWorkflowId: string
  completedStepIds: string[]
  dismissedHintIds: string[]
  startedAt: string
  updatedAt: string
}

export type WorkflowRuntimeContext = {
  mode: WorkflowMode
  workspaceCreated: boolean
  requirementCount: number
  serviceApiDataCount: number
  relationshipCount: number
  graphNodeCount: number
  checkpointCount: number
  timelineOpen: boolean
}

export type WorkflowProgress = {
  workflow: WorkflowDefinition
  currentStep?: WorkflowStep
  completedStepIds: string[]
  percentComplete: number
  stepStates: Record<string, WorkflowStepState>
}
