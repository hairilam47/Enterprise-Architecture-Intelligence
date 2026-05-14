import type { WorkflowDefinition } from './workflowTypes'

export const buildAnalyzeReplayJourney: WorkflowDefinition = {
  id: 'build-analyze-replay',
  title: 'Build → Analyze → Replay',
  description: 'Create an architecture, connect it, inspect impact, then preserve a replayable checkpoint.',
  steps: [
    {
      id: 'create-workspace',
      title: 'Create Workspace',
      description: 'Begin with a named local enterprise architecture workspace.',
      mode: 'build',
      completionCriteria: [{ type: 'has_workspace' }],
      suggestedAction: {
        id: 'open-launcher',
        label: 'Choose a starter',
        description: 'Pick a template or begin with the composition canvas.',
        targetMode: 'build',
        commandId: 'workspace.launcher',
      },
    },
    {
      id: 'add-business-requirement',
      title: 'Add Business Requirement',
      description: 'Anchor the workspace in a business requirement before adding systems.',
      mode: 'build',
      completionCriteria: [{ type: 'has_requirement', count: 1 }],
      suggestedAction: {
        id: 'open-domain-requirements',
        label: 'Open requirements',
        description: 'Capture the business reason for this architecture.',
        targetMode: 'build',
      },
    },
    {
      id: 'add-service-api-data',
      title: 'Add Service, API, or Data Entity',
      description: 'Add the technical entity that fulfills or supports the requirement.',
      mode: 'build',
      completionCriteria: [{ type: 'has_service_or_api_or_data', count: 1 }],
      suggestedAction: {
        id: 'open-composition',
        label: 'Open canvas',
        description: 'Place services, APIs, and data components spatially.',
        targetMode: 'build',
      },
    },
    {
      id: 'create-relationship',
      title: 'Create Relationship',
      description: 'Connect entities so analysis and traceability can reason over the workspace.',
      mode: 'build',
      completionCriteria: [{ type: 'has_relationship', count: 1 }],
      suggestedAction: {
        id: 'author-relationship',
        label: 'Create relationship',
        description: 'Connect requirement, API, service, data, infrastructure, or test entities.',
        targetMode: 'build',
      },
    },
    {
      id: 'open-analyze-mode',
      title: 'Open Analyze Mode',
      description: 'Switch from authoring to relationship intelligence.',
      mode: 'analyze',
      completionCriteria: [{ type: 'is_analyze_mode' }],
      suggestedAction: {
        id: 'switch-analyze',
        label: 'Analyze graph',
        description: 'Open the dependency graph and inspect architecture risk.',
        targetMode: 'analyze',
        commandId: 'mode.analyze',
      },
    },
    {
      id: 'review-dependency-path',
      title: 'Review Dependency Path',
      description: 'Inspect at least one dependency path or topology relationship.',
      mode: 'analyze',
      completionCriteria: [{ type: 'has_dependency_path' }],
      suggestedAction: {
        id: 'review-graph',
        label: 'Review graph',
        description: 'Use the analytical graph to inspect dependencies and bottlenecks.',
        targetMode: 'analyze',
      },
    },
    {
      id: 'create-checkpoint',
      title: 'Create Checkpoint',
      description: 'Preserve the current architecture state as a named recovery point.',
      mode: 'replay',
      completionCriteria: [{ type: 'has_checkpoint', count: 1 }],
      suggestedAction: {
        id: 'create-checkpoint',
        label: 'Create checkpoint',
        description: 'Create a named checkpoint before reviewing evolution.',
        targetMode: 'replay',
        commandId: 'replay.checkpoint',
      },
    },
    {
      id: 'open-replay-timeline',
      title: 'Open Replay Timeline',
      description: 'Open timeline context to review how the workspace has evolved.',
      mode: 'replay',
      completionCriteria: [{ type: 'has_timeline_open' }, { type: 'is_replay_mode' }],
      suggestedAction: {
        id: 'open-timeline',
        label: 'Open timeline',
        description: 'Review workspace evolution without changing live state.',
        targetMode: 'replay',
        commandId: 'replay.timeline',
      },
    },
  ],
}

export const workflowDefinitions = [buildAnalyzeReplayJourney]
