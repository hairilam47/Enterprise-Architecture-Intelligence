import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import type { CompositionCanvasEdge, CompositionState } from './compositionTypes'

export const relationshipOptions: EnterpriseRelationshipType[] = [
  'depends_on',
  'calls',
  'stores',
  'validated_by',
  'deployed_on',
  'causes',
]

export function createCanvasRelationship(
  state: CompositionState,
  sourceNodeId: string,
  targetNodeId: string,
  relationship: EnterpriseRelationshipType,
): CompositionState {
  if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return state

  const existing = state.edges.some(
    (edge) =>
      edge.sourceNodeId === sourceNodeId &&
      edge.targetNodeId === targetNodeId &&
      edge.relationship === relationship,
  )

  if (existing) return state

  const edge: CompositionCanvasEdge = {
    id: `canvas-edge:${crypto.randomUUID()}`,
    sourceNodeId,
    targetNodeId,
    relationship,
    label: relationship,
    status: 'normal',
  }

  return { ...state, edges: [edge, ...state.edges] }
}

export function canAuthorGraphRelationship(state: CompositionState, sourceNodeId: string, targetNodeId: string) {
  const source = state.nodes.find((node) => node.id === sourceNodeId)
  const target = state.nodes.find((node) => node.id === targetNodeId)

  return Boolean(source?.domainEntityId && target?.domainEntityId && source.domainEntityId !== target.domainEntityId)
}
