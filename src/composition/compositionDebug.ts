import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import type { CompositionValidationResult } from './compositionValidation'
import type { CanvasPoint, CompositionState } from './compositionTypes'

export type CompositionInteractionDebugState = {
  activeDragNodeId?: string
  activeConnectionSourceId?: string
  hoveredGroupId?: string
  pointerCanvasPoint?: CanvasPoint
}

export type CompositionDebugSummary = {
  canvasNodeCount: number
  canvasEdgeCount: number
  groupCount: number
  selectedItem: string
  activeDragState: string
  activeConnectionState: string
  syncStatus: CompositionValidationResult['syncStatus']
  graphNodeCount: number
  graphEdgeCount: number
  traceHighlightCount: number
  zoomLevel: number
  panOffset: CanvasPoint
  hoveredNodeId?: string
  hoveredGroupId?: string
  snapEnabled: boolean
  validationIssueCount: number
}

export function createCompositionDebugSummary(
  state: CompositionState,
  graph: EnterpriseGraph,
  traceHighlight: TraceHighlightState,
  validation: CompositionValidationResult,
  interaction: CompositionInteractionDebugState,
): CompositionDebugSummary {
  const selectedItem =
    state.selection.selectedNodeIds[0] ??
    state.selection.selectedEdgeId ??
    state.selection.selectedGroupId ??
    'None'

  return {
    canvasNodeCount: state.nodes.length,
    canvasEdgeCount: state.edges.length,
    groupCount: state.groups.length,
    selectedItem,
    activeDragState: interaction.activeDragNodeId ?? 'None',
    activeConnectionState: interaction.activeConnectionSourceId ?? state.selection.pendingConnection?.sourceNodeId ?? 'None',
    syncStatus: validation.syncStatus,
    graphNodeCount: graph.nodes.length,
    graphEdgeCount: graph.edges.length,
    traceHighlightCount:
      (traceHighlight.selectedTracePath?.nodeIds.length ?? 0) +
      traceHighlight.impactedEntityIds.length +
      traceHighlight.missingLinkNodeIds.length,
    zoomLevel: state.viewport.zoom,
    panOffset: { x: state.viewport.x, y: state.viewport.y },
    hoveredNodeId: state.selection.hoveredNodeId,
    hoveredGroupId: interaction.hoveredGroupId ?? state.selection.hoveredGroupId,
    snapEnabled: state.layout.snapToGrid,
    validationIssueCount: validation.errors.length + validation.warnings.length + validation.suggestions.length,
  }
}
