// ArchiMate 3.1-aligned meta-model types for the EA store

// ── Element ────────────────────────────────────────────────────────────────

export type EALayer =
  | 'Strategy'
  | 'Business'
  | 'Application'
  | 'Technology'
  | 'Physical'
  | 'Implementation'
  | 'Motivation'

export type EAElementType =
  // Strategy layer
  | 'Capability'
  | 'CourseOfAction'
  | 'ValueStream'
  // Business layer
  | 'BusinessActor'
  | 'BusinessRole'
  | 'BusinessCollaboration'
  | 'BusinessProcess'
  | 'BusinessFunction'
  | 'BusinessService'
  | 'BusinessObject'
  | 'Contract'
  | 'Representation'
  // Application layer
  | 'ApplicationComponent'
  | 'ApplicationCollaboration'
  | 'ApplicationFunction'
  | 'ApplicationInteraction'
  | 'ApplicationProcess'
  | 'ApplicationService'
  | 'DataObject'
  // Technology layer
  | 'Node'
  | 'Device'
  | 'SystemSoftware'
  | 'TechnologyCollaboration'
  | 'TechnologyService'
  | 'Artifact'
  | 'CommunicationNetwork'
  | 'Path'
  // Physical layer
  | 'Equipment'
  | 'Facility'
  | 'DistributionNetwork'
  // Implementation
  | 'WorkPackage'
  | 'Deliverable'
  | 'ImplementationEvent'
  | 'Plateau'
  | 'Gap'
  // Motivation
  | 'Stakeholder'
  | 'Driver'
  | 'Assessment'
  | 'Goal'
  | 'Outcome'
  | 'Principle'
  | 'Requirement'
  | 'Constraint'
  | 'Meaning'
  | 'Value'

export type EAStatus = 'Active' | 'Proposed' | 'Deprecated' | 'Retired'

export type EAElement = {
  id: string
  type: EAElementType
  name: string
  description?: string
  layer: EALayer
  status: EAStatus
  properties: Record<string, unknown>
  // Visual position in a view (keyed by viewId)
  positions: Record<string, { x: number; y: number }>
  // Visual size in a view (keyed by viewId)
  sizes: Record<string, { w: number; h: number }>
  // Which views this element appears on
  viewIds: string[]
  // Link to legacy composition canvas node if present
  compositionNodeId?: string
  createdAt: string
  updatedAt: string
}

// ── Relationship ───────────────────────────────────────────────────────────

export type EARelationshipType =
  // Structural
  | 'Composition'
  | 'Aggregation'
  | 'Assignment'
  | 'Realization'
  // Dependency
  | 'Serving'
  | 'Access'
  | 'Influence'
  | 'Association'
  // Dynamic
  | 'Triggering'
  | 'Flow'
  // Other
  | 'Specialization'
  | 'Junction'

export type EARelationship = {
  id: string
  type: EARelationshipType
  sourceId: string
  targetId: string
  name?: string
  label?: string
  properties: Record<string, unknown>
  createdAt: string
}

// ── View ───────────────────────────────────────────────────────────────────

export type EAViewType = 'Canvas' | 'Graph' | '3D' | 'Matrix' | 'C4Context' | 'C4Container' | 'C4Component'

// Level of Specification (from ea-architecture-project)
// L1 = Business-level: capabilities, value streams, high-level apps
// L2 = Application-level: services, databases, APIs, integrations
// L3 = Technology-level: containers, VMs, clusters, networks
export type LevelOfSpec = 1 | 2 | 3

export type EAView = {
  id: string
  name: string
  type: EAViewType
  loS: LevelOfSpec
  description?: string
  elementIds: string[]
  relationshipIds: string[]
  // Layout algorithm output (positions stored per-element in EAElement.positions)
  layoutData: Record<string, unknown>
  // Camera / viewport state
  viewport: {
    x: number
    y: number
    zoom: number
    // 3D camera
    cameraPosition?: { x: number; y: number; z: number }
  }
  createdAt: string
  updatedAt: string
}

// ── Project ────────────────────────────────────────────────────────────────

export type EAProject = {
  id: string
  name: string
  description?: string
  elements: Record<string, EAElement>
  relationships: Record<string, EARelationship>
  views: EAView[]
  activeViewId: string | null
  // Selection state
  selectedElementIds: string[]
  selectedRelationshipId: string | null
  // Highlight (used by impact analysis)
  highlightedElementIds: string[]
  // Metadata
  version: number
  createdAt: string
  updatedAt: string
}

// ── Utility types ──────────────────────────────────────────────────────────

export type ProjectSnapshot = {
  id: string
  projectState: EAProject
  createdAt: string
  label: string
}

// Layer ordering (lowest index = highest in stack)
export const LAYER_ORDER: EALayer[] = [
  'Motivation',
  'Strategy',
  'Business',
  'Application',
  'Technology',
  'Physical',
  'Implementation',
]

export const LAYER_COLORS: Record<EALayer, string> = {
  Motivation:    '#8B5CF6',
  Strategy:      '#EC4899',
  Business:      '#3B82F6',
  Application:   '#EAB308',
  Technology:    '#6B7280',
  Physical:      '#10B981',
  Implementation:'#F97316',
}

export const ELEMENT_LAYER_MAP: Record<EAElementType, EALayer> = {
  Capability: 'Strategy', CourseOfAction: 'Strategy', ValueStream: 'Strategy',
  BusinessActor: 'Business', BusinessRole: 'Business', BusinessCollaboration: 'Business',
  BusinessProcess: 'Business', BusinessFunction: 'Business', BusinessService: 'Business',
  BusinessObject: 'Business', Contract: 'Business', Representation: 'Business',
  ApplicationComponent: 'Application', ApplicationCollaboration: 'Application',
  ApplicationFunction: 'Application', ApplicationInteraction: 'Application',
  ApplicationProcess: 'Application', ApplicationService: 'Application', DataObject: 'Application',
  Node: 'Technology', Device: 'Technology', SystemSoftware: 'Technology',
  TechnologyCollaboration: 'Technology', TechnologyService: 'Technology',
  Artifact: 'Technology', CommunicationNetwork: 'Technology', Path: 'Technology',
  Equipment: 'Physical', Facility: 'Physical', DistributionNetwork: 'Physical',
  WorkPackage: 'Implementation', Deliverable: 'Implementation',
  ImplementationEvent: 'Implementation', Plateau: 'Implementation', Gap: 'Implementation',
  Stakeholder: 'Motivation', Driver: 'Motivation', Assessment: 'Motivation',
  Goal: 'Motivation', Outcome: 'Motivation', Principle: 'Motivation',
  Requirement: 'Motivation', Constraint: 'Motivation', Meaning: 'Motivation', Value: 'Motivation',
}
