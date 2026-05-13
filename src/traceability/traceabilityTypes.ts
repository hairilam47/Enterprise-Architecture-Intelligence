import type { EnterpriseEdge, EnterpriseNode, EnterpriseRelationshipType } from '../graph/enterpriseGraph'

export type TraceDomain = 'Requirements' | 'APIs' | 'Data' | 'Tests' | 'Infrastructure' | 'Incidents'
export type TraceRiskLevel = 'low' | 'medium' | 'high'

export type TraceabilityMatrixCell = {
  sourceDomain: TraceDomain
  targetDomain: TraceDomain
  directCount: number
  indirectCount: number
  missingCount: number
  relationshipCount: number
}

export type TraceabilityMatrix = {
  domains: TraceDomain[]
  cells: TraceabilityMatrixCell[]
}

export type TraceImpactAnalysis = {
  selectedNode?: EnterpriseNode
  upstream: EnterpriseNode[]
  downstream: EnterpriseNode[]
  affectedEntities: EnterpriseNode[]
  relatedIncidents: EnterpriseNode[]
  relatedInfrastructure: EnterpriseNode[]
  relatedApis: EnterpriseNode[]
  relatedTests: EnterpriseNode[]
  riskLevel: TraceRiskLevel
  impactCount: number
}

export type MissingLinkWarning = {
  id: string
  nodeId: string
  severity: TraceRiskLevel
  message: string
  suggestedRelationship: EnterpriseRelationshipType
}

export type TracePath = {
  id: string
  label: string
  nodeIds: string[]
  edgeIds: string[]
}

export type TraceHighlightState = {
  selectedTracePath?: TracePath
  impactedEntityIds: string[]
  missingLinkNodeIds: string[]
  riskSeverity: TraceRiskLevel
}

export type RelationshipFilter = EnterpriseEdge['relationship'] | 'any'
