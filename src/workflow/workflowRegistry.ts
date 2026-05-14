import { workflowDefinitions } from './workflowDefinitions'
import type { WorkflowDefinition } from './workflowTypes'

export function getWorkflowRegistry(): WorkflowDefinition[] {
  return workflowDefinitions
}

export function getWorkflowById(workflowId: string) {
  return workflowDefinitions.find((workflow) => workflow.id === workflowId) ?? workflowDefinitions[0]
}
