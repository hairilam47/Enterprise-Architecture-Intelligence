import type { DomainEntity, DomainEntityKind } from '../domain/domainTypes'
import type { EnterpriseNode, EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'

export type CanvasNodeKind =
  | 'requirement'
  | 'api'
  | 'database'
  | 'service'
  | 'infrastructure'
  | 'testcase'
  | 'incident'
  | 'group'
  | 'environment'
  | 'zone'

export type CanvasGroupKind = 'subsystem' | 'bounded_context' | 'environment' | 'ownership_zone' | 'security_zone'

export type CanvasNodeStatus = 'normal' | 'selected' | 'warning' | 'bottleneck' | 'trace'

export type CanvasPoint = {
  x: number
  y: number
}

export type CompositionCanvasNode = {
  id: string
  label: string
  kind: CanvasNodeKind
  enterpriseNodeId?: string
  domainEntityId?: string
  layer?: string
  groupId?: string
  position: CanvasPoint
  size: {
    width: number
    height: number
  }
  status: CanvasNodeStatus
  metadata: Record<string, string | number | boolean>
}

export type CompositionCanvasEdge = {
  id: string
  sourceNodeId: string
  targetNodeId: string
  enterpriseEdgeId?: string
  relationship: EnterpriseRelationshipType
  label: string
  status: 'normal' | 'selected' | 'warning' | 'bottleneck' | 'trace'
}

export type CompositionCanvasGroup = {
  id: string
  label: string
  kind: CanvasGroupKind
  color: string
  nodeIds: string[]
  position: CanvasPoint
  size: {
    width: number
    height: number
  }
  metadata: Record<string, string | number | boolean>
}

export type CompositionSelectionState = {
  selectedNodeIds: string[]
  selectedEdgeId?: string
  selectedGroupId?: string
  hoveredNodeId?: string
  hoveredGroupId?: string
  pendingConnection?: {
    sourceNodeId: string
  }
}

export type CompositionViewportState = {
  x: number
  y: number
  zoom: number
}

export type CompositionLayoutState = {
  snapToGrid: boolean
  gridSize: number
  mode: 'freeform' | 'layered' | 'relationship'
}

export type CompositionState = {
  nodes: CompositionCanvasNode[]
  edges: CompositionCanvasEdge[]
  groups: CompositionCanvasGroup[]
  selection: CompositionSelectionState
  viewport: CompositionViewportState
  layout: CompositionLayoutState
}

export type CompositionNodeTemplate = {
  kind: CanvasNodeKind
  label: string
  description: string
  domainKind?: DomainEntityKind
  layer?: string
}

export type CompositionGraphContext = {
  traceHighlight: TraceHighlightState
  warningNodeIds: Set<string>
  bottleneckNodeIds: Set<string>
}

export type CanvasEntityLink = {
  node: CompositionCanvasNode
  entity?: DomainEntity
  enterpriseNode?: EnterpriseNode
}
