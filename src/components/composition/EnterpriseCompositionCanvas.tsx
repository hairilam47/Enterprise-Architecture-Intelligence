import { useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, PointerEvent } from 'react'
import type { CompositionNodeTemplate, CompositionState, CanvasPoint } from '../../composition/compositionTypes'
import { addCanvasNode, selectNode, setHoveredNode, toggleSnapToGrid, updateCanvasNodePosition, updateViewport } from '../../composition/compositionState'
import { createCompositionDebugSummary } from '../../composition/compositionDebug'
import { validateComposition } from '../../composition/compositionValidation'
import { validateConnection } from '../../composition/connectionRules'
import { createGroupFromSelection, removeGroup, updateGroup } from '../../composition/groupingEngine'
import { autoLayoutByLayer, autoLayoutByRelationship } from '../../composition/layoutEngine'
import { canAuthorGraphRelationship, createCanvasRelationship } from '../../composition/relationshipAuthoring'
import { graphToCanvasState } from '../../composition/graphToCanvas'
import type { DomainEntityDraft, DomainRegistryState } from '../../domain/domainTypes'
import type { EnterpriseGraph, EnterpriseRelationshipType } from '../../graph/enterpriseGraph'
import type { TraceHighlightState } from '../../traceability/traceabilityTypes'
import { CanvasGroup } from './CanvasGroup'
import { CanvasInspector } from './CanvasInspector'
import { CanvasNodeCard } from './CanvasNodeCard'
import { CompositionDebugPanel } from './CompositionDebugPanel'
import { CompositionPalette, compositionTemplates } from './CompositionPalette'
import { CompositionToolbar } from './CompositionToolbar'
import { ConnectionPreview } from './ConnectionPreview'
import { GroupEditor } from './GroupEditor'
import { RelationshipDrawer } from './RelationshipDrawer'
import { useInteractionSurface } from '../../interaction/useInteractionSurface'

type EnterpriseCompositionCanvasProps = {
  graph: EnterpriseGraph
  registry: DomainRegistryState
  traceHighlight: TraceHighlightState
  initialCompositionState?: CompositionState
  onCreateEntity: (draft: DomainEntityDraft) => string
  onCreateRelationship: (
    sourceEntityId: string,
    targetEntityId: string,
    relationship: EnterpriseRelationshipType,
    description: string,
  ) => void
  onTraceHighlightChange: (highlight: TraceHighlightState) => void
  onCompositionStateChange?: (state: CompositionState) => void
}

type PendingRelationship = {
  sourceNodeId: string
  targetNodeId: string
}

function createContainerNode(template: CompositionNodeTemplate, position: CanvasPoint) {
  return {
    id: `canvas:${template.kind}:${crypto.randomUUID()}`,
    label: template.label,
    kind: template.kind,
    position,
    size: { width: template.kind === 'group' ? 260 : 320, height: template.kind === 'group' ? 126 : 170 },
    status: 'normal' as const,
    metadata: {
      description: template.description,
      authoringOnly: true,
    },
  }
}

function createDraftFromTemplate(template: CompositionNodeTemplate): DomainEntityDraft | undefined {
  if (!template.domainKind) return undefined

  return {
    kind: template.domainKind,
    name: `New ${template.label}`,
    description: template.description,
    ownerTeam: 'Architecture Studio',
    status: 'draft',
    tags: ['composition'],
    metadata: {
      source: 'composition-canvas',
      layer: template.layer ?? 'Application',
    },
  }
}

export function EnterpriseCompositionCanvas({
  graph,
  registry,
  traceHighlight,
  initialCompositionState,
  onCreateEntity,
  onCreateRelationship,
  onTraceHighlightChange,
  onCompositionStateChange,
}: EnterpriseCompositionCanvasProps) {
  const { onEnter, onLeave } = useInteractionSurface('composition-canvas')
  const [state, setState] = useState<CompositionState>(() => initialCompositionState ?? graphToCanvasState(graph, registry, traceHighlight))
  const [dragging, setDragging] = useState<{ nodeId: string; offset: CanvasPoint } | undefined>()
  const [panning, setPanning] = useState<{ start: CanvasPoint; viewport: CompositionState['viewport'] } | undefined>()
  const [relationshipDraft, setRelationshipDraft] = useState<PendingRelationship | undefined>()
  const [relationshipType, setRelationshipType] = useState<EnterpriseRelationshipType>('depends_on')
  const [pointerCanvasPoint, setPointerCanvasPoint] = useState<CanvasPoint | undefined>()
  const canvasRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    setState((current) => graphToCanvasState(graph, registry, traceHighlight, current))
  }, [graph, registry, traceHighlight])

  useEffect(() => {
    onCompositionStateChange?.(state)
  }, [state, onCompositionStateChange])

  const selectedNode = useMemo(
    () => state.nodes.find((node) => node.id === state.selection.selectedNodeIds[0]),
    [state.nodes, state.selection.selectedNodeIds],
  )
  const selectedGroup = useMemo(
    () => state.groups.find((group) => group.id === state.selection.selectedGroupId),
    [state.groups, state.selection.selectedGroupId],
  )
  const pendingConnectionSource = state.selection.pendingConnection?.sourceNodeId
  const pendingSourceNode = pendingConnectionSource
    ? state.nodes.find((node) => node.id === pendingConnectionSource)
    : undefined
  const pendingTargetNode = state.selection.hoveredNodeId
    ? state.nodes.find((node) => node.id === state.selection.hoveredNodeId)
    : undefined
  const connectionRuleResult = useMemo(
    () => validateConnection(state, pendingConnectionSource, pendingTargetNode?.id, relationshipType),
    [state, pendingConnectionSource, pendingTargetNode?.id, relationshipType],
  )
  const validation = useMemo(
    () => validateComposition(state, graph, registry, traceHighlight),
    [state, graph, registry, traceHighlight],
  )
  const debugSummary = useMemo(
    () =>
      createCompositionDebugSummary(state, graph, traceHighlight, validation, {
        activeDragNodeId: dragging?.nodeId,
        activeConnectionSourceId: pendingConnectionSource,
        hoveredGroupId: state.selection.hoveredGroupId,
        pointerCanvasPoint,
      }),
    [state, graph, traceHighlight, validation, dragging?.nodeId, pendingConnectionSource, pointerCanvasPoint],
  )

  const hoveredDependencies = useMemo(() => {
    if (!state.selection.hoveredNodeId) return new Set<string>()
    const connected = new Set<string>([state.selection.hoveredNodeId])
    state.edges.forEach((edge) => {
      if (edge.sourceNodeId === state.selection.hoveredNodeId) connected.add(edge.targetNodeId)
      if (edge.targetNodeId === state.selection.hoveredNodeId) connected.add(edge.sourceNodeId)
    })
    return connected
  }, [state.edges, state.selection.hoveredNodeId])

  function clientToCanvas(point: CanvasPoint) {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return point
    return {
      x: (point.x - rect.left - state.viewport.x) / state.viewport.zoom,
      y: (point.y - rect.top - state.viewport.y) / state.viewport.zoom,
    }
  }

  function handleAddTemplate(template: CompositionNodeTemplate, position?: CanvasPoint) {
    const nextPosition = position ?? { x: 120 - state.viewport.x, y: 100 - state.viewport.y }
    const draft = createDraftFromTemplate(template)

    if (draft) {
      const entityId = onCreateEntity(draft)
      setState((current) => ({
        ...current,
        selection: { ...current.selection, selectedNodeIds: [`canvas:${entityId}`] },
      }))
      return
    }

    setState((current) => addCanvasNode(current, createContainerNode(template, nextPosition)))
  }

  function handleDrop(event: DragEvent<SVGSVGElement>) {
    event.preventDefault()
    const rawTemplate = event.dataTransfer.getData('application/x-composition-template')
    if (!rawTemplate) return
    const template = JSON.parse(rawTemplate) as CompositionNodeTemplate
    handleAddTemplate(template, clientToCanvas({ x: event.clientX, y: event.clientY }))
  }

  function handleNodePointerDown(event: PointerEvent<SVGGElement>, nodeId: string) {
    event.stopPropagation()
    const node = state.nodes.find((item) => item.id === nodeId)
    if (!node) return
    const point = clientToCanvas({ x: event.clientX, y: event.clientY })
    setDragging({ nodeId, offset: { x: point.x - node.position.x, y: point.y - node.position.y } })
    setState((current) => selectNode(current, nodeId, event.shiftKey))
  }

  function handleCanvasPointerMove(event: PointerEvent<SVGSVGElement>) {
    const currentPoint = clientToCanvas({ x: event.clientX, y: event.clientY })
    setPointerCanvasPoint(currentPoint)

    if (dragging) {
      setState((current) =>
        updateCanvasNodePosition(current, dragging.nodeId, {
          x: currentPoint.x - dragging.offset.x,
          y: currentPoint.y - dragging.offset.y,
        }),
      )
      return
    }

    if (panning) {
      setState((current) =>
        updateViewport(current, {
          x: panning.viewport.x + event.clientX - panning.start.x,
          y: panning.viewport.y + event.clientY - panning.start.y,
        }),
      )
    }
  }

  function handleRelationshipConfirm() {
    if (!relationshipDraft) return
    const source = state.nodes.find((node) => node.id === relationshipDraft.sourceNodeId)
    const target = state.nodes.find((node) => node.id === relationshipDraft.targetNodeId)

    setState((current) =>
      createCanvasRelationship(current, relationshipDraft.sourceNodeId, relationshipDraft.targetNodeId, relationshipType),
    )

    if (source?.domainEntityId && target?.domainEntityId) {
      onCreateRelationship(
        source.domainEntityId,
        target.domainEntityId,
        relationshipType,
        `Authored on composition canvas: ${source.label} ${relationshipType} ${target.label}`,
      )
    }

    setRelationshipDraft(undefined)
  }

  function cancelConnection() {
    setRelationshipDraft(undefined)
    setState((current) => ({
      ...current,
      selection: { ...current.selection, pendingConnection: undefined },
    }))
  }

  function handleSelectNode(nodeId: string, append = false) {
    const node = state.nodes.find((item) => item.id === nodeId)
    setState((current) => selectNode(current, nodeId, append))
    if (node?.enterpriseNodeId) {
      const directlyConnectedEdgeIds = graph.edges
        .filter((edge) => edge.sourceId === node.enterpriseNodeId || edge.targetId === node.enterpriseNodeId)
        .map((edge) => edge.id)
      const directlyConnectedNodeIds = graph.edges.flatMap((edge) => {
        if (edge.sourceId === node.enterpriseNodeId) return [edge.targetId]
        if (edge.targetId === node.enterpriseNodeId) return [edge.sourceId]
        return []
      })

      onTraceHighlightChange({
        selectedTracePath: {
          id: `composition-selection:${node.enterpriseNodeId}`,
          label: `${node.label} neighborhood`,
          nodeIds: [node.enterpriseNodeId, ...directlyConnectedNodeIds],
          edgeIds: directlyConnectedEdgeIds,
        },
        impactedEntityIds: directlyConnectedNodeIds,
        missingLinkNodeIds: traceHighlight.missingLinkNodeIds,
        riskSeverity: node.status === 'bottleneck' ? 'high' : node.status === 'warning' ? 'medium' : 'low',
      })
    }
  }

  const drawerSource = relationshipDraft
    ? state.nodes.find((node) => node.id === relationshipDraft.sourceNodeId)
    : undefined
  const drawerTarget = relationshipDraft
    ? state.nodes.find((node) => node.id === relationshipDraft.targetNodeId)
    : undefined
  const canCreateGraphRelationship = relationshipDraft
    ? canAuthorGraphRelationship(state, relationshipDraft.sourceNodeId, relationshipDraft.targetNodeId)
    : false

  return (
    <section className="composition-workspace" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <CompositionToolbar
        state={state}
        onZoomIn={() => setState((current) => updateViewport(current, { zoom: Math.min(1.8, current.viewport.zoom + 0.1) }))}
        onZoomOut={() => setState((current) => updateViewport(current, { zoom: Math.max(0.55, current.viewport.zoom - 0.1) }))}
        onResetView={() => setState((current) => updateViewport(current, { x: 0, y: 0, zoom: 1 }))}
        onAutoLayoutLayer={() => setState(autoLayoutByLayer)}
        onAutoLayoutRelationship={() => setState(autoLayoutByRelationship)}
        onToggleSnap={() => setState(toggleSnapToGrid)}
        onGroupSelection={() => setState((current) => createGroupFromSelection(current, 'bounded_context', 'Bounded Context'))}
      />

      <div className="composition-layout">
        <CompositionPalette onAddTemplate={handleAddTemplate} />
        <div className="composition-canvas-shell panel">
          <svg
            ref={canvasRef}
            className="composition-canvas"
            viewBox="0 0 1180 700"
            role="application"
            aria-label="Enterprise authoring canvas"
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onPointerDown={(event) => {
              if (event.target === canvasRef.current) {
                setPanning({ start: { x: event.clientX, y: event.clientY }, viewport: state.viewport })
                setState((current) => ({
                  ...current,
                  selection: {
                    ...current.selection,
                    selectedNodeIds: [],
                    selectedEdgeId: undefined,
                    selectedGroupId: undefined,
                  },
                }))
              }
            }}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={() => {
              setDragging(undefined)
              setPanning(undefined)
            }}
            onPointerLeave={() => {
              setDragging(undefined)
              setPanning(undefined)
              setPointerCanvasPoint(undefined)
            }}
            onWheel={(event) => {
              event.preventDefault()
              event.stopPropagation()
              const direction = event.deltaY > 0 ? -0.08 : 0.08
              setState((current) => updateViewport(current, { zoom: Math.min(1.8, Math.max(0.55, current.viewport.zoom + direction)) }))
            }}
          >
            <defs>
              <marker id="composition-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
              </marker>
            </defs>
            <g transform={`translate(${state.viewport.x} ${state.viewport.y}) scale(${state.viewport.zoom})`}>
              {state.groups.map((group) => (
                <CanvasGroup
                  key={group.id}
                  group={group}
                  isSelected={state.selection.selectedGroupId === group.id}
                  isHovered={state.selection.hoveredGroupId === group.id}
                  onSelect={() =>
                    setState((current) => ({
                      ...current,
                      selection: {
                        ...current.selection,
                        selectedGroupId: group.id,
                        selectedNodeIds: [],
                        selectedEdgeId: undefined,
                      },
                    }))
                  }
                  onHover={() =>
                    setState((current) => ({
                      ...current,
                      selection: { ...current.selection, hoveredGroupId: group.id },
                    }))
                  }
                  onLeave={() =>
                    setState((current) => ({
                      ...current,
                      selection: { ...current.selection, hoveredGroupId: undefined },
                    }))
                  }
                />
              ))}

              {state.edges.map((edge) => {
                const source = state.nodes.find((node) => node.id === edge.sourceNodeId)
                const target = state.nodes.find((node) => node.id === edge.targetNodeId)
                if (!source || !target) return null
                const sourcePoint = {
                  x: source.position.x + source.size.width,
                  y: source.position.y + source.size.height / 2,
                }
                const targetPoint = {
                  x: target.position.x,
                  y: target.position.y + target.size.height / 2,
                }
                const midX = (sourcePoint.x + targetPoint.x) / 2
                const midY = (sourcePoint.y + targetPoint.y) / 2
                const path = `M ${sourcePoint.x} ${sourcePoint.y} C ${midX} ${sourcePoint.y}, ${midX} ${targetPoint.y}, ${targetPoint.x} ${targetPoint.y}`

                return (
                  <g
                    key={edge.id}
                    className={`composition-edge status-${edge.status} ${state.selection.selectedEdgeId === edge.id ? 'is-selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      setState((current) => ({
                        ...current,
                        edges: current.edges.map((item) => ({
                          ...item,
                          status: item.id === edge.id ? 'selected' : item.status === 'selected' ? 'normal' : item.status,
                        })),
                        selection: {
                          ...current.selection,
                          selectedEdgeId: edge.id,
                          selectedNodeIds: [],
                          selectedGroupId: undefined,
                        },
                      }))
                    }}
                  >
                    <path d={path} />
                    <text x={midX} y={midY - 8}>{edge.relationship}</text>
                  </g>
                )
              })}

              <ConnectionPreview
                source={pendingSourceNode}
                target={pendingTargetNode?.id === pendingSourceNode?.id ? undefined : pendingTargetNode}
                pointer={pointerCanvasPoint}
                relationship={relationshipType}
                ruleResult={connectionRuleResult}
                onCancel={cancelConnection}
              />

              {state.nodes.map((node) => (
                <CanvasNodeCard
                  key={node.id}
                  node={node}
                  isHovered={state.selection.hoveredNodeId === node.id}
                  isConnected={hoveredDependencies.has(node.id)}
                  onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                  onPointerEnter={() => setState((current) => setHoveredNode(current, node.id))}
                  onPointerLeave={() => setState((current) => setHoveredNode(current, undefined))}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleSelectNode(node.id, event.shiftKey)
                  }}
                  onStartConnection={() =>
                    setState((current) => ({
                      ...current,
                      selection: { ...current.selection, pendingConnection: { sourceNodeId: node.id } },
                    }))
                  }
                  onFinishConnection={() => {
                    const sourceNodeId = state.selection.pendingConnection?.sourceNodeId
                    if (sourceNodeId && sourceNodeId !== node.id) {
                      setRelationshipDraft({ sourceNodeId, targetNodeId: node.id })
                    }
                  }}
                />
              ))}
            </g>
          </svg>

          <div className="composition-hints">
            <span>{state.nodes.length} nodes</span>
            <span>{state.edges.length} relationships</span>
            <span>{state.groups.length} groups</span>
            <span>{selectedNode ? `Selected: ${selectedNode.label}` : 'Select or drag a component'}</span>
          </div>
        </div>

        <CanvasInspector state={state} graph={graph} registry={registry} traceHighlight={traceHighlight} />
      </div>

      <div className="composition-support-grid">
        <CompositionDebugPanel summary={debugSummary} validation={validation} />
        <GroupEditor
          group={selectedGroup}
          onUpdate={(patch) =>
            selectedGroup ? setState((current) => updateGroup(current, selectedGroup.id, patch)) : undefined
          }
          onUngroup={() =>
            selectedGroup
              ? setState((current) => ({
                  ...removeGroup(current, selectedGroup.id),
                  selection: { ...current.selection, selectedGroupId: undefined },
                }))
              : undefined
          }
        />
      </div>

      <RelationshipDrawer
        source={drawerSource}
        target={drawerTarget}
        relationship={relationshipType}
        canCreateGraphRelationship={canCreateGraphRelationship}
        onRelationshipChange={setRelationshipType}
        onConfirm={handleRelationshipConfirm}
        onCancel={cancelConnection}
      />

      <div className="panel composition-sync-panel">
        <p className="eyebrow">Canvas to graph sync</p>
        <h2>Authoring feeds enterprise intelligence</h2>
        <p className="graph-explanation">
          Domain-backed canvas nodes become enterprise graph nodes through entity mapping. Visual relationships between
          domain-backed nodes create domain relationships, then D3, Three.js, traceability, and inspector views consume
          the updated graph source.
        </p>
        <div className="overlay-actions">
          {compositionTemplates.slice(0, 5).map((template) => (
            <button key={template.kind} type="button" onClick={() => handleAddTemplate(template)}>
              Add {template.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
