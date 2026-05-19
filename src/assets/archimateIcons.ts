/**
 * SVG path data for ArchiMate element icons.
 * Each entry is a small 24×24 icon suitable for palette tiles and canvas shapes.
 */

export type ArchimateIconId =
  | 'BusinessActor'
  | 'BusinessRole'
  | 'BusinessProcess'
  | 'BusinessService'
  | 'BusinessFunction'
  | 'BusinessObject'
  | 'Capability'
  | 'ValueStream'
  | 'ApplicationComponent'
  | 'ApplicationService'
  | 'ApplicationFunction'
  | 'DataObject'
  | 'Node'
  | 'Device'
  | 'SystemSoftware'
  | 'TechnologyService'
  | 'Artifact'
  | 'CommunicationNetwork'
  | 'Requirement'
  | 'Goal'
  | 'Stakeholder'
  | 'WorkPackage'
  | 'Deliverable'
  | 'Generic'

/** Returns an SVG element string (24×24 viewBox) for the given icon id */
export const ARCHIMATE_ICONS: Record<ArchimateIconId, string> = {
  // Business layer — blue tones
  BusinessActor:
    '<circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M4 21v-1a8 8 0 0116 0v1" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  BusinessRole:
    '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.5"/>',

  BusinessProcess:
    '<path d="M5 12h14M14 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  BusinessService:
    '<rect x="3" y="7" width="18" height="10" rx="5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="2" fill="currentColor"/>',

  BusinessFunction:
    '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 16l4-8 4 8" stroke="currentColor" stroke-width="1.5" fill="none"/>',

  BusinessObject:
    '<path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M4 9h16" stroke="currentColor" stroke-width="1.5"/>',

  // Strategy layer — purple
  Capability:
    '<path d="M12 3l2.5 6.5H21l-5.5 4 2 6.5L12 16l-5.5 4 2-6.5L3 9.5h6.5L12 3z" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  ValueStream:
    '<path d="M3 12h5l3-6 3 12 3-6h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',

  // Application layer — yellow/amber
  ApplicationComponent:
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<rect x="7" y="7" width="10" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>' +
    '<rect x="7" y="13" width="10" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/>',

  ApplicationService:
    '<ellipse cx="12" cy="12" rx="9" ry="5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M3 12v4c0 2.8 4 5 9 5s9-2.2 9-5v-4" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  ApplicationFunction:
    '<path d="M4 6h16v12H4z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M9 6v12M4 12h5" stroke="currentColor" stroke-width="1.5"/>',

  DataObject:
    '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M14 3v5h5M8 13h8M8 17h4" stroke="currentColor" stroke-width="1.5"/>',

  // Technology layer — grey
  Node:
    '<rect x="3" y="9" width="18" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M3 9l4-6h10l4 6" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  Device:
    '<rect x="2" y="6" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="1.5"/>',

  SystemSoftware:
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M7 8l4 4-4 4M13 16h4" stroke="currentColor" stroke-width="1.5"/>',

  TechnologyService:
    '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  Artifact:
    '<path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M13 2v7h7" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="9" cy="15" r="2" fill="currentColor"/>',

  CommunicationNetwork:
    '<circle cx="6" cy="6" r="2" fill="currentColor"/>' +
    '<circle cx="18" cy="6" r="2" fill="currentColor"/>' +
    '<circle cx="6" cy="18" r="2" fill="currentColor"/>' +
    '<circle cx="18" cy="18" r="2" fill="currentColor"/>' +
    '<circle cx="12" cy="12" r="2" fill="currentColor"/>' +
    '<path d="M8 6h8M6 8v8M18 8v8M8 18h8M8 8l4 4M16 8l-4 4M8 16l4-4M16 16l-4-4" stroke="currentColor" stroke-width="1"/>',

  // Motivation layer — violet
  Requirement:
    '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  Goal:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="1" fill="currentColor"/>',

  Stakeholder:
    '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M6 20v-2a6 6 0 0112 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M19 8l2 2-2 2" stroke="currentColor" stroke-width="1.5"/>',

  // Implementation layer — orange
  WorkPackage:
    '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M3 9h18M9 21V9" stroke="currentColor" stroke-width="1.5"/>',

  Deliverable:
    '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" fill="none" stroke="currentColor" stroke-width="1.5"/>',

  Generic:
    '<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.5"/>',
}

export function getIconForType(type: string): ArchimateIconId {
  const map: Record<string, ArchimateIconId> = {
    BusinessActor: 'BusinessActor',
    BusinessRole: 'BusinessRole',
    BusinessProcess: 'BusinessProcess',
    BusinessService: 'BusinessService',
    BusinessFunction: 'BusinessFunction',
    BusinessObject: 'BusinessObject',
    Contract: 'BusinessObject',
    Representation: 'BusinessObject',
    BusinessCollaboration: 'BusinessRole',
    Capability: 'Capability',
    CourseOfAction: 'Capability',
    ValueStream: 'ValueStream',
    ApplicationComponent: 'ApplicationComponent',
    ApplicationService: 'ApplicationService',
    ApplicationFunction: 'ApplicationFunction',
    ApplicationInteraction: 'ApplicationFunction',
    ApplicationProcess: 'ApplicationProcess' as ArchimateIconId,
    ApplicationCollaboration: 'ApplicationComponent',
    DataObject: 'DataObject',
    Node: 'Node',
    Device: 'Device',
    SystemSoftware: 'SystemSoftware',
    TechnologyService: 'TechnologyService',
    TechnologyCollaboration: 'TechnologyService',
    Artifact: 'Artifact',
    CommunicationNetwork: 'CommunicationNetwork',
    Path: 'CommunicationNetwork',
    Requirement: 'Requirement',
    Constraint: 'Requirement',
    Goal: 'Goal',
    Outcome: 'Goal',
    Principle: 'Goal',
    Driver: 'Goal',
    Assessment: 'Goal',
    Meaning: 'Goal',
    Value: 'Goal',
    Stakeholder: 'Stakeholder',
    WorkPackage: 'WorkPackage',
    Deliverable: 'Deliverable',
    ImplementationEvent: 'Deliverable',
    Plateau: 'Deliverable',
    Gap: 'Deliverable',
    Equipment: 'Device',
    Facility: 'Node',
    DistributionNetwork: 'CommunicationNetwork',
  }
  return map[type] ?? 'Generic'
}
