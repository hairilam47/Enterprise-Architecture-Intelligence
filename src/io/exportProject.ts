/**
 * Export/Import utilities for EAProject data.
 *
 * Supports:
 * - JSON (full project blob)
 * - ArchiMate Exchange File Format 3.1 (XML)
 * - Import from EAStudio landscape.js v1 blueprint
 */

import type { EAProject, EAElement, EARelationship } from '../store/eaTypes'

// ── JSON Export ────────────────────────────────────────────────────────────

export function exportAsJSON(project: EAProject): string {
  return JSON.stringify({ schemaVersion: 2, ...project }, null, 2)
}

export function importFromJSON(json: string): EAProject {
  const parsed = JSON.parse(json)
  if (parsed.schemaVersion !== 2) {
    throw new Error(`Unsupported schema version: ${parsed.schemaVersion}. Expected 2.`)
  }
  return parsed as EAProject
}

// ── ArchiMate Exchange File Format 3.1 (XML) ──────────────────────────────

function xmlEscape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function exportAsArchiMateXML(project: EAProject): string {
  const elements = Object.values(project.elements)
  const relationships = Object.values(project.relationships)
  const views = project.views

  const elementXML = elements
    .map(
      (el) =>
        `    <element identifier="${el.id}" xsi:type="archimate:${el.type}">
      <name xml:lang="en">${xmlEscape(el.name)}</name>${el.description ? `\n      <documentation xml:lang="en">${xmlEscape(el.description)}</documentation>` : ''}
    </element>`,
    )
    .join('\n')

  const relXML = relationships
    .map(
      (rel) =>
        `    <relationship identifier="${rel.id}" xsi:type="archimate:${rel.type}Relationship"
        source="${rel.sourceId}" target="${rel.targetId}">
      ${rel.label ? `<name xml:lang="en">${xmlEscape(rel.label)}</name>` : ''}
    </relationship>`,
    )
    .join('\n')

  const viewXML = views
    .map((view) => {
      const nodeRefs = view.elementIds.map((id) => `      <node identifier="node-${id}" elementRef="${id}" xsi:type="archimate:DiagramObject"/>`).join('\n')
      return `    <view identifier="${view.id}" xsi:type="archimate:ArchimateDiagramModel">
      <name xml:lang="en">${xmlEscape(view.name)}</name>
${nodeRefs}
    </view>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://www.opengroup.org/xsd/archimate/3.0/"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:archimate="http://www.opengroup.org/xsd/archimate/3.0/"
       xsi:schemaLocation="http://www.opengroup.org/xsd/archimate/3.0/ http://www.opengroup.org/xsd/archimate/3.1/archimate3_model.xsd"
       identifier="${project.id}">
  <name xml:lang="en">${xmlEscape(project.name)}</name>
  <elements>
${elementXML}
  </elements>
  <relationships>
${relXML}
  </relationships>
  <views>
    <diagrams>
${viewXML}
    </diagrams>
  </views>
</model>`
}

// ── Import from EAStudio landscape.js v1 blueprint ───────────────────────

type LandscapeBlueprint = {
  quadrants?: { id: string; name: string; color?: string; x: number; y: number; w: number; h: number }[]
  nodes?: { id: string; name: string; description?: string; icon?: string; x: number; y: number; layer?: string }[]
  edges?: { id: string; sourceId: string; targetId: string; label?: string; type?: string }[]
}

const ICON_TYPE_MAP: Record<string, string> = {
  'ic-server': 'Node', 'ic-database': 'DataObject', 'ic-cloud': 'SystemSoftware',
  'ic-api': 'ApplicationService', 'ic-app': 'ApplicationComponent', 'ic-service': 'BusinessService',
  'ic-network': 'CommunicationNetwork', 'ic-shield': 'SystemSoftware', 'ic-mobile': 'Device',
  'ic-monitor': 'Device', 'ic-cube': 'ApplicationComponent', 'ic-fn': 'ApplicationFunction',
  'ic-storage': 'Artifact', 'ic-queue': 'TechnologyService', 'ic-cache': 'SystemSoftware',
  'ic-user': 'BusinessActor', 'ic-people': 'BusinessRole', 'ic-process': 'BusinessProcess',
  'ic-doc': 'BusinessObject', 'ic-gear': 'Node',
}

const ICON_LAYER_MAP: Record<string, EAElement['layer']> = {
  'ic-server': 'Technology', 'ic-database': 'Application', 'ic-cloud': 'Technology',
  'ic-api': 'Application', 'ic-app': 'Application', 'ic-service': 'Business',
  'ic-network': 'Technology', 'ic-shield': 'Technology', 'ic-mobile': 'Technology',
  'ic-monitor': 'Technology', 'ic-cube': 'Application', 'ic-fn': 'Application',
  'ic-storage': 'Technology', 'ic-queue': 'Technology', 'ic-cache': 'Technology',
  'ic-user': 'Business', 'ic-people': 'Business', 'ic-process': 'Business',
  'ic-doc': 'Business', 'ic-gear': 'Technology',
}

const REL_MAP: Record<string, EARelationship['type']> = {
  data: 'Flow', solid: 'Association', dashed: 'Serving', dotted: 'Access', async: 'Triggering',
}

export function importFromLandscapeBlueprint(bp: LandscapeBlueprint, projectId = crypto.randomUUID()): EAProject {
  const ts = new Date().toISOString()
  const VIEW_ID = 'view-imported'

  const elements: Record<string, EAElement> = {}
  for (const node of bp.nodes ?? []) {
    const type = (ICON_TYPE_MAP[node.icon ?? ''] ?? 'ApplicationComponent') as EAElement['type']
    const layer = ICON_LAYER_MAP[node.icon ?? ''] ?? 'Application'
    elements[node.id] = {
      id: node.id,
      type,
      name: node.name,
      description: node.description,
      layer,
      status: 'Active',
      properties: { originalIcon: node.icon },
      positions: { [VIEW_ID]: { x: node.x, y: node.y } },
      sizes: { [VIEW_ID]: { w: 180, h: 60 } },
      viewIds: [VIEW_ID],
      createdAt: ts,
      updatedAt: ts,
    }
  }

  const relationships: Record<string, EARelationship> = {}
  for (const edge of bp.edges ?? []) {
    const type = REL_MAP[edge.type ?? 'solid'] ?? 'Association'
    relationships[edge.id] = {
      id: edge.id,
      type: type as EARelationship['type'],
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      label: edge.label,
      properties: {},
      createdAt: ts,
    }
  }

  const view = {
    id: VIEW_ID,
    name: 'Imported View',
    type: 'Canvas' as const,
    loS: 2 as const,
    elementIds: Object.keys(elements),
    relationshipIds: Object.keys(relationships),
    layoutData: { quadrants: bp.quadrants ?? [] },
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: ts,
    updatedAt: ts,
  }

  return {
    id: projectId,
    name: 'Imported Blueprint',
    elements,
    relationships,
    views: [view],
    activeViewId: VIEW_ID,
    selectedElementIds: [],
    selectedRelationshipId: null,
    highlightedElementIds: [],
    version: 1,
    createdAt: ts,
    updatedAt: ts,
  }
}

// ── Download helpers (browser only) ───────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(project: EAProject) {
  downloadFile(exportAsJSON(project), `${project.name.replace(/\s+/g, '-')}.ea.json`, 'application/json')
}

export function downloadArchiMateXML(project: EAProject) {
  downloadFile(exportAsArchiMateXML(project), `${project.name.replace(/\s+/g, '-')}.archimate`, 'application/xml')
}
