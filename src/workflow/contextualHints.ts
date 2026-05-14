import type { WorkflowMode, WorkflowRuntimeContext } from './workflowTypes'

export type ContextualHintModel = {
  id: string
  mode: WorkflowMode
  title: string
  description: string
  severity: 'info' | 'warning'
  actionLabel?: string
}

export function resolveContextualHints(context: WorkflowRuntimeContext): ContextualHintModel[] {
  const hints: ContextualHintModel[] = []

  if (context.mode === 'build') {
    if (context.requirementCount === 0) {
      hints.push({
        id: 'build:first-requirement',
        mode: 'build',
        title: 'Add your first business requirement',
        description: 'A requirement gives the architecture a business anchor before systems are added.',
        severity: 'info',
        actionLabel: 'Open requirements',
      })
    } else if (context.serviceApiDataCount === 0) {
      hints.push({
        id: 'build:add-system',
        mode: 'build',
        title: 'Add a service, API, or data entity',
        description: 'Technical entities make the workspace analyzable and traceable.',
        severity: 'info',
        actionLabel: 'Open canvas',
      })
    }

    if (context.relationshipCount === 0 && context.requirementCount > 0 && context.serviceApiDataCount > 0) {
      hints.push({
        id: 'build:isolated-entities',
        mode: 'build',
        title: 'Connect isolated entities',
        description: 'Relationships unlock dependency analysis, traceability, and replay value.',
        severity: 'warning',
        actionLabel: 'Create relationship',
      })
    }
  }

  if (context.mode === 'analyze') {
    if (context.relationshipCount === 0) {
      hints.push({
        id: 'analyze:no-relationships',
        mode: 'analyze',
        title: 'Build relationships first',
        description: 'Graph intelligence appears once architecture entities are connected.',
        severity: 'info',
      })
    } else {
      hints.push({
        id: 'analyze:review-paths',
        mode: 'analyze',
        title: 'Review dependency concentration',
        description: 'Look for services, APIs, or data nodes that concentrate downstream impact.',
        severity: 'info',
      })
    }
  }

  if (context.mode === 'replay') {
    if (context.checkpointCount === 0) {
      hints.push({
        id: 'replay:create-checkpoint',
        mode: 'replay',
        title: 'Create your first checkpoint',
        description: 'Checkpoints make workspace evolution recoverable and easier to review.',
        severity: 'info',
        actionLabel: 'Create checkpoint',
      })
    } else if (!context.timelineOpen) {
      hints.push({
        id: 'replay:open-timeline',
        mode: 'replay',
        title: 'Open workspace evolution',
        description: 'Use the timeline to review changes without mutating the live workspace.',
        severity: 'info',
        actionLabel: 'Open timeline',
      })
    }
  }

  return hints
}
