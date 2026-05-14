import type { WorkspaceTemplate } from './templateTypes'

export const governanceTemplates: WorkspaceTemplate[] = [
  {
    id: 'risk-compliance',
    title: 'Risk/compliance',
    description: 'Map requirements, controls, validation, and affected systems.',
    category: 'Governance',
    recommendedMode: 'build',
  },
  {
    id: 'security-mapping',
    title: 'Security mapping',
    description: 'Trace security requirements to services, APIs, data, and infrastructure.',
    category: 'Security mapping',
    recommendedMode: 'analyze',
  },
  {
    id: 'integration-governance',
    title: 'Integration governance',
    description: 'Inspect API, event, and data dependencies across ownership boundaries.',
    category: 'Integration governance',
    recommendedMode: 'analyze',
  },
]
