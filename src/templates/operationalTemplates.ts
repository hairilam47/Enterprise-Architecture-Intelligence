import type { WorkspaceTemplate } from './templateTypes'

export const operationalTemplates: WorkspaceTemplate[] = [
  {
    id: 'operational-intelligence',
    title: 'Operational Intelligence',
    description: 'Service health, observability, incident, and infrastructure starter.',
    category: 'Operational Intelligence',
    recommendedMode: 'analyze',
  },
  {
    id: 'incident-topology',
    title: 'Incident topology',
    description: 'Map incident causes to services, APIs, and deployment targets.',
    category: 'Incident topology',
    recommendedMode: 'replay',
  },
  {
    id: 'observability',
    title: 'Observability',
    description: 'Connect telemetry requirements to runtime components.',
    category: 'Observability',
    recommendedMode: 'analyze',
  },
  {
    id: 'devops-delivery-chain',
    title: 'DevOps delivery chain',
    description: 'Trace service delivery from requirement through tests and infrastructure.',
    category: 'DevOps delivery chain',
    recommendedMode: 'build',
  },
]
