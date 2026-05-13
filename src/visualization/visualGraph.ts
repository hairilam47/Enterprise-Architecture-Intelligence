import type { EnterpriseEdge, EnterpriseGraph, EnterpriseNode } from '../graph/enterpriseGraph'

export type VisualNode = {
  id: string
  enterpriseNodeId: string
  label: string
  type: EnterpriseNode['type']
  status: EnterpriseNode['status']
  x: number
  y: number
  radius: number
  color: string
  metadata: EnterpriseNode
}

export type VisualEdge = {
  id: string
  enterpriseEdgeId: string
  sourceId: string
  targetId: string
  relationship: EnterpriseEdge['relationship']
  width: number
  color: string
  metadata: EnterpriseEdge
}

export type VisualOverlay = {
  id: string
  kind: 'warning' | 'bottleneck' | 'highlight' | 'impact'
  nodeIds: string[]
  edgeIds: string[]
  label: string
}

export type VisualGraph = {
  id: string
  nodes: VisualNode[]
  edges: VisualEdge[]
  overlays: VisualOverlay[]
  sourceGraph: EnterpriseGraph
}

export const nodeTypeColors: Record<EnterpriseNode['type'], string> = {
  requirement: '#2563eb',
  api: '#0891b2',
  database: '#16a34a',
  service: '#7c3aed',
  infrastructure: '#475569',
  incident: '#dc2626',
  testcase: '#ca8a04',
}

export const statusColors: Record<EnterpriseNode['status'], string> = {
  healthy: '#16a34a',
  warning: '#f59e0b',
  critical: '#dc2626',
  unknown: '#64748b',
}
