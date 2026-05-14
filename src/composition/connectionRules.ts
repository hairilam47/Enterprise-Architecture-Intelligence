import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { CanvasNodeKind, CompositionCanvasNode, CompositionState } from './compositionTypes'
import { relationshipOptions } from './relationshipAuthoring'

export type ConnectionRuleSeverity = 'info' | 'warning' | 'error'

export type ConnectionRuleResult = {
  isAllowed: boolean
  severity: ConnectionRuleSeverity
  messages: string[]
  suggestions: string[]
}

const allowedBySourceKind: Partial<Record<CanvasNodeKind, Partial<Record<EnterpriseRelationshipType, CanvasNodeKind[]>>>> = {
  requirement: {
    depends_on: ['api', 'service'],
    validated_by: ['testcase'],
  },
  api: {
    calls: ['api', 'service'],
    stores: ['database'],
    depends_on: ['service', 'infrastructure'],
  },
  service: {
    calls: ['api', 'service'],
    stores: ['database'],
    deployed_on: ['infrastructure'],
    depends_on: ['api', 'database', 'infrastructure'],
  },
  database: {
    depends_on: ['infrastructure'],
  },
  incident: {
    causes: ['api', 'service', 'infrastructure', 'database'],
    depends_on: ['service', 'infrastructure'],
  },
  testcase: {
    validated_by: ['requirement', 'api', 'service'],
    depends_on: ['api', 'service'],
  },
  infrastructure: {
    depends_on: ['infrastructure'],
  },
}

function findNode(state: CompositionState, nodeId: string) {
  return state.nodes.find((node) => node.id === nodeId)
}

function relationshipExists(
  state: CompositionState,
  sourceNodeId: string,
  targetNodeId: string,
  relationship: EnterpriseRelationshipType,
) {
  return state.edges.some(
    (edge) =>
      edge.sourceNodeId === sourceNodeId &&
      edge.targetNodeId === targetNodeId &&
      edge.relationship === relationship,
  )
}

export function validateConnection(
  state: CompositionState,
  sourceNodeId: string | undefined,
  targetNodeId: string | undefined,
  relationship: EnterpriseRelationshipType,
): ConnectionRuleResult {
  const messages: string[] = []
  const suggestions: string[] = []
  const source = sourceNodeId ? findNode(state, sourceNodeId) : undefined
  const target = targetNodeId ? findNode(state, targetNodeId) : undefined

  if (!sourceNodeId || !source) {
    messages.push('Connection source does not exist on the canvas.')
  }

  if (!targetNodeId || !target) {
    messages.push('Connection target does not exist on the canvas.')
  }

  if (!relationshipOptions.includes(relationship)) {
    messages.push(`Relationship type "${relationship}" is not supported.`)
  }

  if (sourceNodeId && targetNodeId && sourceNodeId === targetNodeId) {
    messages.push('Self-connections are usually not useful for enterprise traceability.')
    suggestions.push('Connect to a dependent system, API, data store, test, or infrastructure node instead.')
  }

  if (source && target) {
    const allowedTargets = allowedBySourceKind[source.kind]?.[relationship]
    if (allowedTargets && !allowedTargets.includes(target.kind)) {
      messages.push(`${relationship} is unusual from ${source.kind} to ${target.kind}.`)
      suggestions.push(`Prefer ${relationship} from ${source.kind} to ${allowedTargets.join(', ')}.`)
    }

    if (!source.domainEntityId || !target.domainEntityId) {
      messages.push('One or both endpoints are canvas-only, so the graph relationship cannot be persisted yet.')
      suggestions.push('Use domain-backed components when you want D3, Three.js, and traceability to update.')
    }

    if (source.domainEntityId && target.domainEntityId && source.domainEntityId === target.domainEntityId) {
      messages.push('Both endpoints map to the same domain entity.')
    }

    if (relationshipExists(state, source.id, target.id, relationship)) {
      messages.push('This relationship already exists on the canvas.')
      suggestions.push('Select the existing edge instead of creating a duplicate.')
    }
  }

  return {
    isAllowed: messages.length === 0,
    severity: messages.some((message) => message.includes('does not exist') || message.includes('not supported'))
      ? 'error'
      : messages.length > 0
        ? 'warning'
        : 'info',
    messages,
    suggestions,
  }
}

export function getConnectionEndpointLabel(node?: CompositionCanvasNode) {
  if (!node) return 'No endpoint'
  return `${node.label} (${node.kind})`
}
