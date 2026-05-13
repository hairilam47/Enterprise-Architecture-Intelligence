export type EnterpriseNodeType =
  | 'requirement'
  | 'api'
  | 'database'
  | 'service'
  | 'infrastructure'
  | 'incident'
  | 'testcase'

export type EnterpriseRelationshipType =
  | 'depends_on'
  | 'calls'
  | 'stores'
  | 'validated_by'
  | 'deployed_on'
  | 'causes'

export type EnterpriseNode = {
  id: string
  label: string
  type: EnterpriseNodeType
  owner?: string
  layer?: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  metrics?: {
    latency?: number
    throughput?: number
    successRate?: number
  }
  metadata?: Record<string, string | number | boolean>
}

export type EnterpriseEdge = {
  id: string
  sourceId: string
  targetId: string
  relationship: EnterpriseRelationshipType
  weight: number
  label?: string
  metadata?: Record<string, string | number | boolean>
}

export type EnterpriseGraph = {
  id: string
  name: string
  nodes: EnterpriseNode[]
  edges: EnterpriseEdge[]
  createdAt: string
}

export type GraphTraversalResult = {
  startNodeId: string
  nodeIds: string[]
  edgeIds: string[]
}
