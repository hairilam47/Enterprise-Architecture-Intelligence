/**
 * storeToVisualGraph.ts
 *
 * Converts the eaStore (ArchiMate EAProject) into the VisualGraph format
 * consumed by the existing D3EnterpriseGraph and ThreeArchitectureView components.
 *
 * This is a compatibility bridge — it maps ArchiMate types/layers onto the
 * legacy EnterpriseNode schema so the visualisation components need zero changes.
 */

import type { EAProject, EAElement, EARelationship, EALayer } from '../store/eaTypes'
import type { EnterpriseNode, EnterpriseEdge, EnterpriseGraph } from '../graph/enterpriseGraph'
import type { VisualGraph, VisualNode, VisualEdge } from '../visualization/visualGraph'

// ── Colour map: ArchiMate layer → hex ─────────────────────────────────────

const LAYER_TO_COLOR: Record<EALayer, string> = {
  Strategy:      '#8B5CF6',
  Business:      '#2563eb',
  Application:   '#7c3aed',
  Technology:    '#475569',
  Physical:      '#16a34a',
  Implementation:'#ea580c',
  Motivation:    '#0891b2',
}

// ── Type coercion helpers ──────────────────────────────────────────────────

function eaLayerToLegacyType(el: EAElement): EnterpriseNode['type'] {
  const t = el.type
  if (t === 'DataObject') return 'database'
  if (t === 'Node' || t === 'Device' || t === 'SystemSoftware' || t === 'Artifact') return 'infrastructure'
  if (t === 'BusinessActor' || t === 'BusinessRole' || t === 'Stakeholder') return 'api'
  if (t === 'Requirement' || t === 'Goal' || t === 'Principle' || t === 'Constraint') return 'requirement'
  if (t.includes('Service') || t.includes('Process') || t.includes('Function')) return 'service'
  if (t.includes('Component') || t.includes('Collaboration') || t.includes('Interaction')) return 'infrastructure'
  if (t === 'WorkPackage' || t === 'Deliverable' || t === 'Gap' || t === 'Plateau') return 'testcase'
  return 'service'
}

function eaStatusToLegacy(el: EAElement): EnterpriseNode['status'] {
  if (el.status === 'Deprecated' || el.status === 'Retired') return 'warning'
  return 'healthy'
}

function eaRelTypeToLegacy(rel: EARelationship): EnterpriseEdge['relationship'] {
  const map: Record<string, EnterpriseEdge['relationship']> = {
    Serving:       'calls',
    Access:        'stores',
    Assignment:    'deployed_on',
    Realization:   'calls',
    Triggering:    'calls',
    Flow:          'depends_on',
    Composition:   'depends_on',
    Aggregation:   'depends_on',
    Influence:     'depends_on',
    Association:   'depends_on',
    Specialization:'depends_on',
    Junction:      'depends_on',
  }
  return map[rel.type] ?? 'depends_on'
}

// ── Main conversion ────────────────────────────────────────────────────────

export function projectToEnterpriseGraph(project: EAProject, viewId?: string): EnterpriseGraph {
  const vid = viewId ?? project.activeViewId ?? ''
  const view = project.views.find((v) => v.id === vid)
  const elementIds = new Set(view ? view.elementIds : Object.keys(project.elements))
  const relIds = new Set(view ? view.relationshipIds : Object.keys(project.relationships))

  const nodes: EnterpriseNode[] = Object.values(project.elements)
    .filter((el) => elementIds.has(el.id))
    .map((el) => ({
      id: el.id,
      label: el.name,
      type: eaLayerToLegacyType(el),
      owner: el.layer,
      layer: el.layer,
      status: eaStatusToLegacy(el),
      metrics: {},
      metadata: { description: el.description, eaType: el.type, ...el.properties },
    }))

  const edges: EnterpriseEdge[] = Object.values(project.relationships)
    .filter((r) => relIds.has(r.id) && elementIds.has(r.sourceId) && elementIds.has(r.targetId))
    .map((rel) => ({
      id: rel.id,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      relationship: eaRelTypeToLegacy(rel),
      weight: 1,
      label: rel.label ?? rel.name,
      metadata: { relType: rel.type },
    }))

  return {
    id: project.id,
    name: project.name,
    nodes,
    edges,
    createdAt: project.createdAt,
  }
}

export function projectToVisualGraph(
  project: EAProject,
  viewId?: string,
  selectedIds: string[] = [],
  highlightedIds: string[] = [],
): VisualGraph {
  const vid = viewId ?? project.activeViewId ?? ''
  const enterpriseGraph = projectToEnterpriseGraph(project, viewId)

  const elementMap = project.elements

  const nodes: VisualNode[] = enterpriseGraph.nodes.map((node, index) => {
    const el = elementMap[node.id]
    const pos = el?.positions[vid] ?? { x: (index % 6) * 200 + 80, y: Math.floor(index / 6) * 120 + 80 }
    const color = LAYER_TO_COLOR[el?.layer ?? 'Business'] ?? '#475569'
    return {
      id: node.id,
      enterpriseNodeId: node.id,
      label: node.label,
      type: node.type,
      status: node.status,
      x: pos.x,
      y: pos.y,
      radius: 24,
      color,
      metadata: node,
    }
  })

  const edges: VisualEdge[] = enterpriseGraph.edges.map((edge) => ({
    id: edge.id,
    enterpriseEdgeId: edge.id,
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    relationship: edge.relationship,
    width: 1.5,
    color: '#6B7280',
    metadata: edge,
  }))

  const overlays = []
  if (selectedIds.length > 0) {
    overlays.push({ id: 'selection', kind: 'highlight' as const, nodeIds: selectedIds, edgeIds: [], label: 'Selected' })
  }
  if (highlightedIds.length > 0) {
    overlays.push({ id: 'highlights', kind: 'impact' as const, nodeIds: highlightedIds, edgeIds: [], label: 'Highlighted' })
  }

  return {
    id: project.id,
    nodes,
    edges,
    overlays,
    sourceGraph: enterpriseGraph,
  }
}
