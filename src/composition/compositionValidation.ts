import type { DomainRegistryState } from '../domain/domainTypes'
import type { EnterpriseGraph, EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import type { CompositionState } from './compositionTypes'
import { relationshipOptions } from './relationshipAuthoring'

export type CompositionValidationSeverity = 'warning' | 'error' | 'suggestion'

export type CompositionValidationIssue = {
  id: string
  severity: CompositionValidationSeverity
  subjectId?: string
  message: string
  suggestion?: string
}

export type CompositionValidationResult = {
  warnings: CompositionValidationIssue[]
  errors: CompositionValidationIssue[]
  suggestions: CompositionValidationIssue[]
  syncStatus: 'synced' | 'warnings' | 'needs_attention'
}

function issue(
  severity: CompositionValidationSeverity,
  id: string,
  message: string,
  subjectId?: string,
  suggestion?: string,
): CompositionValidationIssue {
  return { id, severity, message, subjectId, suggestion }
}

export function validateComposition(
  state: CompositionState,
  graph: EnterpriseGraph,
  registry: DomainRegistryState,
  traceHighlight: TraceHighlightState,
): CompositionValidationResult {
  const issues: CompositionValidationIssue[] = []
  const nodeIds = new Set(state.nodes.map((node) => node.id))
  const graphNodeIds = new Set(graph.nodes.map((node) => node.id))
  const graphEdgeIds = new Set(graph.edges.map((edge) => edge.id))
  const entityIds = new Set(registry.entities.map((entity) => entity.id))
  const relationshipTypes = new Set<EnterpriseRelationshipType>(relationshipOptions)

  state.nodes.forEach((node) => {
    if (node.domainEntityId && !entityIds.has(node.domainEntityId)) {
      issues.push(
        issue(
          'warning',
          `missing-domain:${node.id}`,
          `${node.label} references a missing domain entity.`,
          node.id,
          'Rebuild the canvas from the current graph or recreate the domain entity.',
        ),
      )
    }

    if (node.enterpriseNodeId && !graphNodeIds.has(node.enterpriseNodeId)) {
      issues.push(
        issue(
          'warning',
          `missing-graph-node:${node.id}`,
          `${node.label} references a graph node that is no longer present.`,
          node.id,
          'Refresh from graph or remove the orphaned canvas item.',
        ),
      )
    }

    if (!node.enterpriseNodeId && !['group', 'environment', 'zone'].includes(node.kind)) {
      issues.push(
        issue(
          'suggestion',
          `canvas-only:${node.id}`,
          `${node.label} is canvas-only and will not appear in graph intelligence yet.`,
          node.id,
          'Create it from a domain-backed palette item to sync with D3, Three.js, and traceability.',
        ),
      )
    }
  })

  state.edges.forEach((edge) => {
    if (!relationshipTypes.has(edge.relationship)) {
      issues.push(issue('error', `invalid-relationship:${edge.id}`, `${edge.relationship} is not a valid relationship.`, edge.id))
    }

    if (!nodeIds.has(edge.sourceNodeId)) {
      issues.push(issue('warning', `missing-source:${edge.id}`, `${edge.label} has a missing source node.`, edge.id))
    }

    if (!nodeIds.has(edge.targetNodeId)) {
      issues.push(issue('warning', `missing-target:${edge.id}`, `${edge.label} has a missing target node.`, edge.id))
    }

    if (edge.enterpriseEdgeId && !graphEdgeIds.has(edge.enterpriseEdgeId)) {
      issues.push(
        issue(
          'warning',
          `missing-graph-edge:${edge.id}`,
          `${edge.label} references a graph edge that is no longer present.`,
          edge.id,
          'Recreate the relationship or refresh from the graph source.',
        ),
      )
    }
  })

  state.groups.forEach((group) => {
    const missingChildren = group.nodeIds.filter((nodeId) => !nodeIds.has(nodeId))
    if (missingChildren.length > 0) {
      issues.push(
        issue(
          'warning',
          `missing-group-children:${group.id}`,
          `${group.label} contains ${missingChildren.length} missing child node(s).`,
          group.id,
          'Ungroup or update the group membership.',
        ),
      )
    }

    if (group.nodeIds.length === 0) {
      issues.push(
        issue(
          'suggestion',
          `empty-group:${group.id}`,
          `${group.label} has no child nodes.`,
          group.id,
          'Add nodes to the group or remove it from the canvas.',
        ),
      )
    }
  })

  traceHighlight.selectedTracePath?.nodeIds.forEach((nodeId) => {
    if (!graphNodeIds.has(nodeId)) {
      issues.push(
        issue(
          'warning',
          `invalid-trace-node:${nodeId}`,
          `Trace path references missing graph node ${nodeId}.`,
          nodeId,
          'Re-run traceability from the current graph.',
        ),
      )
    }
  })

  const warnings = issues.filter((item) => item.severity === 'warning')
  const errors = issues.filter((item) => item.severity === 'error')
  const suggestions = issues.filter((item) => item.severity === 'suggestion')

  return {
    warnings,
    errors,
    suggestions,
    syncStatus: errors.length > 0 ? 'needs_attention' : warnings.length > 0 ? 'warnings' : 'synced',
  }
}
