import type { EnterpriseRelationshipType, EnterpriseNodeType } from '../graph/enterpriseGraph'

export type SpatialStatus = 'normal' | 'selected' | 'warning' | 'bottleneck'

export type Vector3Position = {
  x: number
  y: number
  z: number
}

export type SpatialLayer = {
  id: string
  name: string
  layer: string
  yPosition: number
  color: string
  opacity: number
}

export type SpatialNode = {
  id: string
  enterpriseNodeId: string
  label: string
  type: EnterpriseNodeType
  layer?: string
  position: Vector3Position
  size: number
  color: string
  metadata: Record<string, unknown>
  status: SpatialStatus
}

export type SpatialEdge = {
  id: string
  source: string
  target: string
  relationship: EnterpriseRelationshipType
  points: [Vector3Position, Vector3Position]
  status: SpatialStatus | 'highlighted'
}

export type SpatialScene = {
  layers: SpatialLayer[]
  nodes: SpatialNode[]
  edges: SpatialEdge[]
}
