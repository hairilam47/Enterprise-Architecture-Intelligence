import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { createAuditEvent } from '../audit/createAuditEvent'
import { createDefaultCollaborationSessions } from '../collaboration/sessionManager'
import { createOperationQueue } from '../collaboration/operationQueue'
import { validateCollaborationDeterminism } from '../collaboration/collaborationValidation'
import { CommandPalette } from '../commands/CommandPalette'
import type { CommandAction } from '../commands/commandTypes'
import { compareWorkspaces } from '../comparison/compareWorkspaces'
import type { CompositionState } from '../composition/compositionTypes'
import { graphToCanvasState } from '../composition/graphToCanvas'
import { createEntity, deleteEntity, initialDomainRegistry } from '../domain/domainRegistry'
import type { DomainEntity, DomainEntityDraft, DomainEntityKind } from '../domain/domainTypes'
import { createDomainRelationship } from '../domain/relationshipBuilder'
import { commandRegistry } from '../editor/commandRegistry'
import { restoreCommandHistory } from '../editor/commandHistory'
import { validateReplayChain } from '../editor/replayValidation'
import {
  createCompositionStateCommand,
  createDomainEntityCommand,
  createDomainRelationshipCommand,
  createRenameWorkspaceCommand,
  createSwapPluginCommand,
  createWorkspaceCommand,
  executeEditorCommand,
} from '../editor/editorCommands'
import { createInitialEditorState, editorReducer } from '../editor/editorStore'
import { swapPlugin } from '../engine/swapPlugin'
import { buildEnterpriseGraph } from '../graph/buildGraph'
import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import { appendWorkspaceHistory, createWorkspaceHistoryEntry } from '../history/workspaceHistory'
import { useWorkspaceSync } from '../hooks/useWorkspaceSync'
import { getPluginById } from '../plugins/pluginRegistry'
import { simulateWorkspace } from '../simulation/simulateWorkspace'
import { architectureLayers, type ArchitectureLayer, type Workspace } from '../types/architecture'
import type { AuditEvent } from '../types/audit'
import { validateWorkspace } from '../validation/validateWorkspace'
import { applySimulationOverlay } from '../visualization/simulationOverlay'
import { toVisualGraph } from '../visualization/visualAdapters'
import { createWorkspaceDocument } from '../workspace/workspaceSerializer'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import { validateWorkspaceDocument } from '../workspace/workspaceValidation'
import {
  addWorkspaceCheckpoint,
  checkpointRestoreDocument,
  createWorkspaceCheckpoint,
  createWorkspaceCheckpointState,
  deleteWorkspaceCheckpoint,
  findCheckpointSnapshot,
  validateCheckpointRestore,
  type WorkspaceCheckpoint,
} from '../workspace/workspaceCheckpoints'
import { downloadHistoryBundle, exportWorkspaceHistoryBundle } from '../workspace/workspaceHistoryExport'
import { analyzeWorkspaceRecovery, createRecoveryBundle } from '../workspace/workspaceRecovery'
import { createWorkspaceSnapshot } from '../workspace/workspaceSnapshots'
import type { SavedWorkspaceSummary } from '../services/workspaceApiTypes'
import { buildWorkspaceSearchIndex } from '../search/workspaceSearch'
import type { TraceHighlightState } from '../traceability/traceabilityTypes'
import { AssistantNotesPanel } from './AssistantNotesPanel'
import { AuditTrailPanel } from './AuditTrailPanel'
import { ComparisonMode } from './ComparisonMode'
import { D3EnterpriseGraph } from './D3EnterpriseGraph'
import { DependencyGraphPanel } from './DependencyGraphPanel'
import { LayerCard } from './LayerCard'
import { LazyThreeArchitectureView } from './LazyThreeArchitectureView'
import { SimulationPanel } from './SimulationPanel'
import { ValidationPanel } from './ValidationPanel'
import { ApiWorkspace } from './domain/ApiWorkspace'
import { DataWorkspace } from './domain/DataWorkspace'
import { OperationsWorkspace } from './domain/OperationsWorkspace'
import { RequirementsWorkspace } from './domain/RequirementsWorkspace'
import { TestingWorkspace } from './domain/TestingWorkspace'
import { EnterpriseCompositionCanvas } from './composition/EnterpriseCompositionCanvas'
import { RemoteCursorLayer } from './collaboration/RemoteCursorLayer'
import { RemoteSelectionLayer } from './collaboration/RemoteSelectionLayer'
import { WsCursorLayer } from './collaboration/WsCursorLayer'
import { useWsCollaboration } from '../collaboration/useWsCollaboration'
import { CommandHistoryPanel } from './debug/CommandHistoryPanel'
import { CheckpointDialog } from './history/CheckpointDialog'
import { RecoveryPanel } from './history/RecoveryPanel'
import { RecoveryImportDialog } from './history/RecoveryImportDialog'
import { ReplayComparisonView } from './history/ReplayComparisonView'
import { WorkspaceDiffViewer } from './history/WorkspaceDiffViewer'
import { WorkspaceTimeline } from './history/WorkspaceTimeline'
import type { WorkspaceTimelineEntryModel } from './history/TimelineEntry'
import type { WorkspaceRecoveryBundle } from '../workspace/workspaceRecoveryImport'
import { TraceabilityWorkspace } from './traceability/TraceabilityWorkspace'
import { WorkspaceManager } from './workspace/WorkspaceManager'
import { useWorkspaceService } from './workspace/WorkspaceServiceProvider'
import { WorkspaceStatusBar } from './workspace/WorkspaceStatusBar'
import { EmptyStateGuidance } from './guidance/EmptyStateGuidance'
import { SuggestionPanel } from './guidance/SuggestionPanel'
import { StarterWorkspaceWizard } from './workflow/StarterWorkspaceWizard'
import { WorkflowProgressTracker } from './workflow/WorkflowProgressTracker'
import { DependencyHeatOverlay } from './intelligence/DependencyHeatOverlay'
import { WorkspaceHealthPanel } from './intelligence/WorkspaceHealthPanel'
import { StadiumWorkspace } from '../canvas/StadiumWorkspace'
import { WorkspaceInspector } from '../inspector/WorkspaceInspector'
import { Breadcrumbs } from '../navigation/Breadcrumbs'
import { LeftSidebar } from '../navigation/LeftSidebar'
import {
  loadNavigationMemory,
  pushRecentQuery,
  saveNavigationMemory,
  type WorkspaceViewId,
} from '../navigation/navigationMemory'
import { BottomWorkspacePanel } from '../panels/BottomWorkspacePanel'
import { ContextualActionMenu, type ContextualMenuState } from '../productivity/ContextualActionMenu'
import { useKeyboardShortcuts, type KeyboardShortcut } from '../productivity/keyboardShortcuts'
import { ShortcutOverlay } from '../productivity/ShortcutOverlay'
import { WorkspaceLauncher, type StarterWorkflow } from '../productivity/WorkspaceLauncher'
import { WorkspaceModeSwitcher, type WorkspaceMode } from '../modes/WorkspaceModeSwitcher'
import { TopCommandBar } from '../workspace-shell/TopCommandBar'
import type { ShellPanelState } from '../workspace-shell/WorkspaceShell'
import { WorkspaceShell } from '../layout/WorkspaceShell'
import type { LayoutState, ManagedOverlay } from '../layout/layoutTypes'
import { createPanelRegistry } from '../layout/panelRegistry'
import { createOverlayRegistry } from '../layout/overlayRegistry'
import { WorkspaceTemplatePicker } from '../ui/WorkspaceTemplatePicker'
import { evaluateJourney } from '../workflow/journeyEngine'
import { loadOnboardingRuntime, saveOnboardingRuntime } from '../workflow/onboardingRuntime'
import { dismissWorkflowHint, syncCompletedSteps } from '../workflow/progressionTracker'
import { getWorkflowById } from '../workflow/workflowRegistry'
import type { WorkflowMode, WorkflowRuntimeContext } from '../workflow/workflowTypes'
import { workspaceTemplates } from '../templates/starterWorkspaceFactory'
import { applyWorkspaceTemplate, getWorkspaceTemplate } from '../templates/starterWorkspaceFactory'
import { analyzeWorkspaceHealth } from '../intelligence/workspaceHealth'
import { useIdentity } from '../org/useIdentity'

const initialWorkspace: Workspace = {
  id: 'workspace-enterprise-intelligence',
  organizationId: 'org-northstar',
  name: 'Enterprise Intelligence Architecture',
  description: 'Local-first workspace for comparing layered intelligence architecture plugins.',
  version: 1,
  updatedAt: new Date().toISOString(),
  layers: [
    { layer: 'Business', pluginId: 'biz-strategy-map' },
    { layer: 'Application', pluginId: 'app-process-orchestrator' },
    { layer: 'Integration', pluginId: 'int-event-mesh' },
    { layer: 'Data', pluginId: 'data-governed-lakehouse' },
    { layer: 'Infrastructure', pluginId: 'infra-container-fabric' },
    { layer: 'Hardware', pluginId: 'hw-private-cloud' },
    { layer: 'Operations', pluginId: 'ops-observability-hub' },
  ],
}

export function LayeredWorkspace() {
  const { identity } = useIdentity()
  const { workspaceService } = useWorkspaceService()
  const navigationMemory = useMemo(() => loadNavigationMemory(), [])
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const [workspaceView, setWorkspaceView] = useState<WorkspaceViewId>(navigationMemory.view ?? 'architecture')
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>(navigationMemory.mode ?? 'Build')
  const [shellPanelState, setShellPanelState] = useState<ShellPanelState>({
    leftCollapsed: false,
    rightCollapsed: true,
    bottomCollapsed: true,
    developerMode: false,
  })
  const [graphView, setGraphView] = useState<'d3' | 'three'>(navigationMemory.graphView ?? 'd3')
  const [domainKind, setDomainKind] = useState<DomainEntityKind>(navigationMemory.domainKind ?? 'requirement')
  const [domainRegistry, setDomainRegistry] = useState(initialDomainRegistry)
  const [compositionCanvasState, setCompositionCanvasState] = useState<CompositionState | undefined>()
  const [savedWorkspaces, setSavedWorkspaces] = useState<SavedWorkspaceSummary[]>([])
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>()
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState<string | undefined>()
  const [editorState, dispatchEditorAction] = useReducer(editorReducer, createInitialEditorState(initialWorkspace.id))
  const [checkpointState, setCheckpointState] = useState(createWorkspaceCheckpointState)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showCheckpointDialog, setShowCheckpointDialog] = useState(false)
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false)
  const [showRecoveryImport, setShowRecoveryImport] = useState(false)
  const [selectedTimelineEntry, setSelectedTimelineEntry] = useState<WorkspaceTimelineEntryModel | undefined>()
  const [replayPreviewDocument, setReplayPreviewDocument] = useState<WorkspaceDocument | undefined>()
  const [replaySandboxStatus, setReplaySandboxStatus] = useState('idle')
  const [replayPerformanceWarning, setReplayPerformanceWarning] = useState<string | undefined>()
  const [collaborationSessions] = useState(() => createDefaultCollaborationSessions())
  const { remoteCursors: wsRemoteCursors, isConnected: wsIsConnected, broadcastCursor } = useWsCollaboration()
  const [operationQueue] = useState(() => createOperationQueue())
  const [selectedDomainEntityId, setSelectedDomainEntityId] = useState<string | undefined>(
    navigationMemory.selectedEntityId ?? initialDomainRegistry.entities[0]?.id,
  )
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [starterWizardOpen, setStarterWizardOpen] = useState(false)
  const [shortcutOverlayOpen, setShortcutOverlayOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextualMenuState | undefined>()
  const [recentQueries, setRecentQueries] = useState<string[]>(navigationMemory.recentQueries ?? [])
  const [workflowState, setWorkflowState] = useState(() => loadOnboardingRuntime('build-analyze-replay'))
  const [traceHighlight, setTraceHighlight] = useState<TraceHighlightState>({
    impactedEntityIds: [],
    missingLinkNodeIds: [],
    riskSeverity: 'low',
  })
  const [comparisonBase, setComparisonBase] = useState<Workspace>(() => structuredClone(initialWorkspace))
  const [history, setHistory] = useState(() => [
    createWorkspaceHistoryEntry(initialWorkspace, 'Initial architecture'),
  ])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => [
    createAuditEvent({
      workspace: initialWorkspace,
      action: 'simulation.ran',
      metadata: { reason: 'initial-load' },
    }),
    createAuditEvent({
      workspace: initialWorkspace,
      action: 'workspace.created',
      metadata: { source: 'local-memory' },
    }),
  ])
  const simulation = useMemo(() => simulateWorkspace(workspace), [workspace])
  const validation = useMemo(() => validateWorkspace(workspace), [workspace])
  const comparison = useMemo(
    () => compareWorkspaces(comparisonBase, workspace),
    [comparisonBase, workspace],
  )
  const enterpriseGraph = useMemo(
    () => buildEnterpriseGraph(workspace, simulation, validation, domainRegistry),
    [workspace, simulation, validation, domainRegistry],
  )
  const visualGraph = useMemo(
    () => applySimulationOverlay(toVisualGraph(enterpriseGraph), simulation, validation),
    [enterpriseGraph, simulation, validation],
  )
  const effectiveCompositionState = useMemo(
    () => compositionCanvasState ?? graphToCanvasState(enterpriseGraph, domainRegistry, traceHighlight),
    [compositionCanvasState, enterpriseGraph, domainRegistry, traceHighlight],
  )
  const visualPreferences = useMemo(
    () => ({
      activeWorkspaceView: workspaceView,
      activeGraphView: graphView,
      activeDomainKind: domainKind,
    }),
    [workspaceView, graphView, domainKind],
  )
  const currentWorkspaceDocument = useMemo(
    () =>
      createWorkspaceDocument({
        workspace,
        domainRegistry,
        compositionState: effectiveCompositionState,
        auditEvents,
        history,
        traceHighlight,
        validation,
        visualPreferences,
        commandHistory: editorState.commandHistory,
        workspaceSnapshots: editorState.snapshots.snapshots,
        workspaceCheckpoints: checkpointState.checkpoints,
        editorEvents: editorState.events,
        identity,
      }),
    [
      identity,
      workspace,
      domainRegistry,
      effectiveCompositionState,
      auditEvents,
      history,
      traceHighlight,
      validation,
      visualPreferences,
      editorState.commandHistory,
      editorState.snapshots.snapshots,
      checkpointState.checkpoints,
      editorState.events,
    ],
  )
  const workspaceFingerprint = useMemo(
    () =>
      JSON.stringify({
        workspace,
        domainRegistry,
        compositionCanvasState: effectiveCompositionState,
        auditEvents,
        history,
        traceHighlight,
        visualPreferences,
      }),
    [workspace, domainRegistry, effectiveCompositionState, auditEvents, history, traceHighlight, visualPreferences],
  )
  const documentValidation = useMemo(
    () => validateWorkspaceDocument(currentWorkspaceDocument),
    [currentWorkspaceDocument],
  )
  const refreshSavedWorkspaces = useCallback(async () => {
    const result = await workspaceService.listWorkspaces()
    if (result.ok && result.data) {
      setSavedWorkspaces(result.data.workspaces)
    }
  }, [workspaceService])
  const handleCompositionStateChange = useCallback((state: CompositionState) => {
    if (JSON.stringify(state) === JSON.stringify(currentWorkspaceDocument.compositionCanvasState)) return
    const before = currentWorkspaceDocument
    const now = new Date().toISOString()
    const after: WorkspaceDocument = {
      ...structuredClone(before),
      version: before.version + 1,
      updatedAt: now,
      compositionCanvasState: structuredClone(state),
      layeredArchitectureState: {
        ...structuredClone(before.layeredArchitectureState),
        version: before.layeredArchitectureState.version + 1,
        updatedAt: now,
      },
    }
    const command = createCompositionStateCommand(before, after, 'canvas-state-change')
    applyWorkspaceDocument(command.execute({ document: before }), { markSynced: false })
    dispatchEditorAction(executeEditorCommand(command))
  }, [currentWorkspaceDocument])
  const handleUndoEditorCommand = useCallback(() => {
    const serialized = editorState.commandHistory.undoStack[0]
    if (!serialized) return
    const command = commandRegistry.hydrate(serialized)
    applyWorkspaceDocument(command.undo({ document: currentWorkspaceDocument }), { markSynced: false })
    dispatchEditorAction({ type: 'history/undo', command: serialized })
  }, [currentWorkspaceDocument, editorState.commandHistory.undoStack])
  const handleRedoEditorCommand = useCallback(() => {
    const serialized = editorState.commandHistory.redoStack[0]
    if (!serialized) return
    const command = commandRegistry.hydrate(serialized)
    applyWorkspaceDocument(command.redo({ document: currentWorkspaceDocument }), { markSynced: false })
    dispatchEditorAction({ type: 'history/redo', command: serialized })
  }, [currentWorkspaceDocument, editorState.commandHistory.redoStack])
  const workspaceSync = useWorkspaceSync(currentWorkspaceDocument, workspaceService, {
    onSaved: async (_document, savedAt) => {
      setLastSavedAt(savedAt)
      setLastSavedFingerprint(workspaceFingerprint)
      dispatchEditorAction({
        type: 'runtime/saved',
        savedAt: savedAt ?? new Date().toISOString(),
        documentVersion: currentWorkspaceDocument.version,
      })
      await refreshSavedWorkspaces()
    },
    onUndo: handleUndoEditorCommand,
    onRedo: handleRedoEditorCommand,
  })
  const recoveryStatus = useMemo(
    () =>
      analyzeWorkspaceRecovery({
        document: currentWorkspaceDocument,
        snapshots: editorState.snapshots.snapshots,
        commands: editorState.commandHistory.undoStack,
        saveError: workspaceSync.runtime.saveError,
      }),
    [currentWorkspaceDocument, editorState.commandHistory.undoStack, editorState.snapshots.snapshots, workspaceSync.runtime.saveError],
  )
  const replayValidation = useMemo(
    () =>
      validateReplayChain({
        history: editorState.commandHistory,
        snapshots: editorState.snapshots.snapshots,
        events: editorState.events,
      }),
    [editorState.commandHistory, editorState.events, editorState.snapshots.snapshots],
  )
  const collaborationValidation = useMemo(
    () => validateCollaborationDeterminism(editorState.commandHistory.undoStack),
    [editorState.commandHistory.undoStack],
  )
  const intelligenceReport = useMemo(
    () =>
      analyzeWorkspaceHealth({
        graph: enterpriseGraph,
        commandHistory: editorState.commandHistory,
        checkpoints: checkpointState,
        snapshots: editorState.snapshots,
      }),
    [checkpointState, editorState.commandHistory, editorState.snapshots, enterpriseGraph],
  )
  const workflowMode = useMemo<WorkflowMode>(() => workspaceMode.toLowerCase() as WorkflowMode, [workspaceMode])
  const workflowContext = useMemo<WorkflowRuntimeContext>(
    () => ({
      mode: workflowMode,
      workspaceCreated: Boolean(workspace.id),
      requirementCount: domainRegistry.entities.filter((entity) => entity.kind === 'requirement').length,
      serviceApiDataCount: domainRegistry.entities.filter((entity) =>
        ['service', 'api', 'databaseTable'].includes(entity.kind),
      ).length,
      relationshipCount: domainRegistry.relationships.length,
      graphNodeCount: enterpriseGraph.nodes.length,
      checkpointCount: checkpointState.checkpoints.length,
      timelineOpen: showTimeline && !shellPanelState.bottomCollapsed,
    }),
    [checkpointState.checkpoints.length, domainRegistry, enterpriseGraph.nodes.length, shellPanelState.bottomCollapsed, showTimeline, workflowMode, workspace.id],
  )
  const activeWorkflow = useMemo(() => getWorkflowById(workflowState.activeWorkflowId), [workflowState.activeWorkflowId])
  const journey = useMemo(
    () => evaluateJourney(activeWorkflow, workflowState, workflowContext),
    [activeWorkflow, workflowContext, workflowState],
  )
  const completedStepKey = journey.progress.completedStepIds.join('|')

  useEffect(() => {
    void refreshSavedWorkspaces()
  }, [refreshSavedWorkspaces])

  useEffect(() => {
    saveOnboardingRuntime(workflowState)
  }, [workflowState])

  useEffect(() => {
    setWorkflowState((current) => syncCompletedSteps(current, journey.progress.completedStepIds))
  }, [completedStepKey, journey.progress.completedStepIds])

  useEffect(() => {
    saveNavigationMemory({
      mode: workspaceMode,
      view: workspaceView,
      graphView,
      domainKind,
      selectedEntityId: selectedDomainEntityId,
      recentQueries,
    })
  }, [domainKind, graphView, recentQueries, selectedDomainEntityId, workspaceMode, workspaceView])

  function runWorkspaceCommand(command: ReturnType<typeof createWorkspaceCommand>) {
    applyWorkspaceDocument(command.execute({ document: currentWorkspaceDocument }), { markSynced: false })
    dispatchEditorAction(executeEditorCommand(command))
  }

  function handleCreateCheckpoint(name: string, description: string) {
    const snapshot = createWorkspaceSnapshot(
      currentWorkspaceDocument,
      editorState.commandHistory.undoStack.length,
      name,
    )
    const checkpoint = createWorkspaceCheckpoint(snapshot, name, description)
    dispatchEditorAction({ type: 'snapshot/created', snapshot })
    setCheckpointState((current) => addWorkspaceCheckpoint(current, checkpoint))
    setShowCheckpointDialog(false)
  }

  function handleRestoreSnapshot(snapshotId: string, checkpoint?: WorkspaceCheckpoint) {
    const snapshot = editorState.snapshots.snapshots.find((item) => item.metadata.id === snapshotId)
    if (!snapshot) return
    if (checkpoint) {
      const validationResult = validateCheckpointRestore(checkpoint, snapshot)
      if (!validationResult.valid) return
    }

    const recoverySnapshot = createWorkspaceSnapshot(
      currentWorkspaceDocument,
      editorState.commandHistory.undoStack.length,
      'Automatic recovery before restore',
    )
    dispatchEditorAction({ type: 'snapshot/created', snapshot: recoverySnapshot })

    const restoredDocument = checkpointRestoreDocument(snapshot)
    const now = new Date().toISOString()
    const after: WorkspaceDocument = {
      ...restoredDocument,
      version: currentWorkspaceDocument.version + 1,
      updatedAt: now,
      metadata: {
        ...restoredDocument.metadata,
        notes: `Restored from ${checkpoint?.name ?? snapshot.metadata.label ?? snapshot.metadata.id}`,
      },
    }
    runWorkspaceCommand(createWorkspaceCommand({
      type: 'workspace.restore',
      label: `Restore ${checkpoint?.name ?? snapshot.metadata.label ?? 'snapshot'}`,
      before: currentWorkspaceDocument,
      after,
      payload: {
        snapshotId,
        checkpointId: checkpoint?.id,
        recoverySnapshotId: recoverySnapshot.metadata.id,
      },
    }))
  }

  function handleRestoreCheckpoint(checkpoint: WorkspaceCheckpoint) {
    const snapshot = findCheckpointSnapshot(checkpoint, editorState.snapshots.snapshots)
    if (!snapshot) return
    handleRestoreSnapshot(snapshot.metadata.id, checkpoint)
  }

  function handleExportHistory() {
    downloadHistoryBundle(
      `${currentWorkspaceDocument.workspaceId}-history.json`,
      exportWorkspaceHistoryBundle({
        history: editorState.commandHistory,
        snapshots: editorState.snapshots.snapshots,
        editorEvents: editorState.events,
        checkpoints: checkpointState.checkpoints,
      }),
    )
  }

  function handleExportRecoveryBundle() {
    const bundle = createRecoveryBundle({
      document: currentWorkspaceDocument,
      snapshots: editorState.snapshots.snapshots,
      commands: editorState.commandHistory.undoStack,
      checkpoints: checkpointState.checkpoints,
      issues: recoveryStatus.issues,
    })
    downloadHistoryBundle(`${currentWorkspaceDocument.workspaceId}-recovery.json`, JSON.stringify(bundle, null, 2))
  }

  function handleRestoreLatestHealthySnapshot() {
    if (!recoveryStatus.latestHealthySnapshotId) return
    handleRestoreSnapshot(recoveryStatus.latestHealthySnapshotId)
  }

  function handleSwap(layer: ArchitectureLayer, pluginId: string) {
    const previousLayer = workspace.layers.find((item) => item.layer === layer)
    const nextWorkspace = swapPlugin({ workspace, layer, pluginId })
    const previousPlugin = previousLayer ? getPluginById(previousLayer.pluginId) : undefined
    const nextPlugin = getPluginById(pluginId)
    const nextValidation = validateWorkspace(nextWorkspace)
    const nextSimulation = simulateWorkspace(nextWorkspace)
    const nextHistory = appendWorkspaceHistory(
      history,
      nextWorkspace,
      `${layer}: ${previousPlugin?.name ?? 'Unknown'} to ${nextPlugin?.name ?? 'Unknown'}`,
    )
    const nextAuditEvents = [
      createAuditEvent({
        workspace: nextWorkspace,
        action: 'validation.ran',
        metadata: {
          issueCount: nextValidation.issues.length,
          hasBlockers: !nextValidation.isValid,
        },
      }),
      createAuditEvent({
        workspace: nextWorkspace,
        action: 'simulation.ran',
        metadata: {
          totalLatency: nextSimulation.totalLatency,
          successRate: Number(nextSimulation.successRate.toFixed(4)),
          effectiveThroughput: nextSimulation.effectiveThroughput,
        },
      }),
      createAuditEvent({
        workspace: nextWorkspace,
        action: 'plugin.swapped',
        subjectId: pluginId,
        metadata: {
          layer,
          fromPluginId: previousLayer?.pluginId ?? null,
          toPluginId: pluginId,
        },
      }),
      ...auditEvents,
    ]
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: nextWorkspace.version,
      updatedAt: nextWorkspace.updatedAt,
      layeredArchitectureState: nextWorkspace,
      historySnapshots: nextHistory,
      auditEvents: nextAuditEvents,
      validationState: nextValidation,
    }
    runWorkspaceCommand(createSwapPluginCommand(currentWorkspaceDocument, after, layer, pluginId))
  }

  function handleCopyWorkspace() {
    const copiedWorkspace = structuredClone(workspace)

    setComparisonBase(copiedWorkspace)
    setAuditEvents((currentEvents) => [
      createAuditEvent({
        workspace,
        action: 'comparison.snapshot.created',
        metadata: { copiedVersion: copiedWorkspace.version },
      }),
      ...currentEvents,
    ])
  }

  function handleCreateEntity(draft: DomainEntityDraft) {
    const nextRegistry = createEntity(domainRegistry, draft)
    const entityId = nextRegistry.entities[0]?.id
    const now = new Date().toISOString()
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      updatedAt: now,
      domainRegistryState: nextRegistry,
      layeredArchitectureState: {
        ...structuredClone(workspace),
        version: workspace.version + 1,
        updatedAt: now,
      },
      auditEvents: [
        createAuditEvent({
          workspace,
          action: 'domain.entity.created',
          subjectId: entityId,
          metadata: { kind: draft.kind, name: draft.name },
        }),
        ...auditEvents,
      ],
    }
    runWorkspaceCommand(createDomainEntityCommand(currentWorkspaceDocument, after, entityId ?? 'unknown', 'create'))
    setSelectedDomainEntityId(entityId)
  }

  function handleCompositionCreateEntity(draft: DomainEntityDraft) {
    const now = new Date().toISOString()
    const entity: DomainEntity = {
      ...draft,
      id: `domain:${draft.kind}:${crypto.randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    } as DomainEntity

    const nextRegistry = {
      ...domainRegistry,
      entities: [entity, ...domainRegistry.entities],
    }
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      updatedAt: now,
      domainRegistryState: nextRegistry,
      layeredArchitectureState: {
        ...structuredClone(workspace),
        version: workspace.version + 1,
        updatedAt: now,
      },
      auditEvents: [
        createAuditEvent({
          workspace,
          action: 'domain.entity.created',
          subjectId: entity.id,
          metadata: {
            source: 'composition-canvas',
            kind: entity.kind,
            name: entity.name,
          },
        }),
        ...auditEvents,
      ],
    }
    runWorkspaceCommand(createDomainEntityCommand(currentWorkspaceDocument, after, entity.id, 'create'))
    setSelectedDomainEntityId(entity.id)

    return entity.id
  }

  function handleDeleteEntity(entityId: string) {
    const now = new Date().toISOString()
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      updatedAt: now,
      domainRegistryState: deleteEntity(domainRegistry, entityId),
      layeredArchitectureState: {
        ...structuredClone(workspace),
        version: workspace.version + 1,
        updatedAt: now,
      },
    }
    runWorkspaceCommand(createDomainEntityCommand(currentWorkspaceDocument, after, entityId, 'delete'))
    setSelectedDomainEntityId(undefined)
  }

  function handleCreateRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    relationship: EnterpriseRelationshipType,
    description: string,
  ) {
    const now = new Date().toISOString()
    const nextRegistry = createDomainRelationship(domainRegistry, sourceEntityId, targetEntityId, relationship, description)
    const relationshipId = nextRegistry.relationships[0]?.id
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      updatedAt: now,
      domainRegistryState: nextRegistry,
      layeredArchitectureState: {
        ...structuredClone(workspace),
        version: workspace.version + 1,
        updatedAt: now,
      },
    }
    runWorkspaceCommand(createDomainRelationshipCommand(currentWorkspaceDocument, after, relationshipId))
  }

  function applyWorkspaceDocument(document: WorkspaceDocument, options: { markSynced?: boolean } = { markSynced: true }) {
    setWorkspace(document.layeredArchitectureState)
    setDomainRegistry(document.domainRegistryState)
    setCompositionCanvasState(document.compositionCanvasState)
    setAuditEvents(document.auditEvents)
    setHistory(document.historySnapshots)
    setTraceHighlight(document.traceHighlightState)
    setWorkspaceView(document.visualPreferences.activeWorkspaceView)
    setGraphView(document.visualPreferences.activeGraphView)
    setDomainKind(document.visualPreferences.activeDomainKind as DomainEntityKind)
    setSelectedDomainEntityId(document.domainRegistryState.entities[0]?.id)
    setLastSavedAt(document.metadata.savedAt)
    if (document.commandHistoryState) {
      dispatchEditorAction({ type: 'history/restored', history: restoreCommandHistory(document.commandHistoryState) })
    }
    dispatchEditorAction({ type: 'snapshots/restored', snapshots: document.workspaceSnapshots ?? [] })
    dispatchEditorAction({ type: 'events/restored', events: document.editorEvents ?? [] })
    setCheckpointState({
      checkpoints: document.workspaceCheckpoints ?? [],
      activeCheckpointId: document.workspaceCheckpoints?.[0]?.id,
    })
    if (options.markSynced) workspaceSync.markSynced(document.metadata.savedAt)
    setLastSavedFingerprint(
      JSON.stringify({
        workspace: document.layeredArchitectureState,
        domainRegistry: document.domainRegistryState,
        compositionCanvasState: document.compositionCanvasState,
        auditEvents: document.auditEvents,
        history: document.historySnapshots,
        traceHighlight: document.traceHighlightState,
        visualPreferences: document.visualPreferences,
      }),
    )
  }

  function handleRenameWorkspace(name: string) {
    const now = new Date().toISOString()
    const nextWorkspace = {
      ...workspace,
      name,
      version: workspace.version + 1,
      updatedAt: now,
    }
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      name,
      updatedAt: now,
      layeredArchitectureState: nextWorkspace,
    }
    runWorkspaceCommand(createRenameWorkspaceCommand(currentWorkspaceDocument, after, name))
  }

  async function handleSaveWorkspace() {
    const result = await workspaceSync.saveNow()
    if (!result.ok || !result.data) return

    setLastSavedAt(result.data.summary.savedAt)
    setLastSavedFingerprint(workspaceFingerprint)
    await refreshSavedWorkspaces()
  }

  async function handleLoadWorkspace(workspaceId: string) {
    const result = await workspaceService.loadWorkspace(workspaceId)
    if (result.ok && result.data) {
      applyWorkspaceDocument(result.data.document)
    }
    await refreshSavedWorkspaces()
  }

  async function handleDuplicateWorkspace(workspaceId: string) {
    const result = await workspaceService.duplicateWorkspace(workspaceId)
    if (result.ok && result.data) {
      applyWorkspaceDocument(result.data.document)
    }
    await refreshSavedWorkspaces()
  }

  async function handleDeleteSavedWorkspace(workspaceId: string) {
    await workspaceService.deleteWorkspace(workspaceId)
    await refreshSavedWorkspaces()
  }

  function handleResetWorkspace() {
    const nextHistory = [createWorkspaceHistoryEntry(initialWorkspace, 'Initial architecture')]
    const now = new Date().toISOString()
    const nextWorkspace = {
      ...structuredClone(initialWorkspace),
      version: workspace.version + 1,
      updatedAt: now,
    }
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      name: nextWorkspace.name,
      description: nextWorkspace.description,
      updatedAt: now,
      layeredArchitectureState: nextWorkspace,
      domainRegistryState: initialDomainRegistry,
      compositionCanvasState: graphToCanvasState(buildEnterpriseGraph(nextWorkspace, simulateWorkspace(nextWorkspace), validateWorkspace(nextWorkspace), initialDomainRegistry), initialDomainRegistry, { impactedEntityIds: [], missingLinkNodeIds: [], riskSeverity: 'low' }),
      traceHighlightState: { impactedEntityIds: [], missingLinkNodeIds: [], riskSeverity: 'low' },
      historySnapshots: nextHistory,
      auditEvents: [
        createAuditEvent({
          workspace: nextWorkspace,
          action: 'workspace.updated',
          metadata: { source: 'reset' },
        }),
      ],
      visualPreferences: {
        activeWorkspaceView: 'architecture',
        activeGraphView: 'd3',
        activeDomainKind: 'requirement',
      },
    }
    runWorkspaceCommand(createWorkspaceCommand({
      type: 'workspace.reset',
      label: 'Reset workspace',
      before: currentWorkspaceDocument,
      after,
      payload: { source: 'user-confirmed-reset' },
    }))
    setComparisonBase(structuredClone(initialWorkspace))
    setSelectedDomainEntityId(initialDomainRegistry.entities[0]?.id)
    setLastSavedAt(undefined)
    setLastSavedFingerprint(undefined)
  }

  const domainWorkspaceProps = {
    registry: domainRegistry,
    selectedEntityId: selectedDomainEntityId,
    onSelectEntity: setSelectedDomainEntityId,
    onCreateEntity: handleCreateEntity,
    onDeleteEntity: handleDeleteEntity,
    onCreateRelationship: handleCreateRelationship,
  }

  const starterTemplates = [
    {
      id: 'operating-model',
      name: 'Operating Model',
      description: 'Start with layered capabilities, APIs, data, and operations flow.',
      mode: 'Build' as const,
    },
    {
      id: 'dependency-analysis',
      name: 'Dependency Analysis',
      description: 'Move into analytical graph mode to inspect risks and bottlenecks.',
      mode: 'Analyze' as const,
    },
    {
      id: 'replay-review',
      name: 'Replay Review',
      description: 'Open timeline and recovery surfaces for checkpoint inspection.',
      mode: 'Replay' as const,
    },
  ]

  function handleTemplateSelect(templateId: string) {
    if (templateId === 'operating-model') {
      setWorkspaceMode('Build')
      setWorkspaceView('composition')
      return
    }

    if (templateId === 'dependency-analysis') {
      setWorkspaceMode('Analyze')
      setWorkspaceView('graph')
      setGraphView('d3')
      return
    }

    setWorkspaceMode('Replay')
    setWorkspaceView('traceability')
    setShowTimeline(true)
    setShellPanelState((current) => ({ ...current, bottomCollapsed: false }))
  }

  function runWorkflowAction(commandId?: string) {
    const command = commands.find((item) => item.id === commandId)
    if (command) {
      command.perform()
      return
    }

    const targetMode = journey.nextStep?.suggestedAction?.targetMode
    if (targetMode === 'build') handleTemplateSelect('operating-model')
    if (targetMode === 'analyze') handleTemplateSelect('dependency-analysis')
    if (targetMode === 'replay') handleTemplateSelect('replay-review')
  }

  function handleHintAction(hintId: string) {
    if (hintId.startsWith('build:first-requirement')) {
      setWorkspaceMode('Build')
      setWorkspaceView('domain')
      setDomainKind('requirement')
      return
    }
    if (hintId.startsWith('build:add-system') || hintId.startsWith('build:isolated')) {
      setWorkspaceMode('Build')
      setWorkspaceView('composition')
      return
    }
    if (hintId.startsWith('replay:create-checkpoint')) {
      setShowCheckpointDialog(true)
      return
    }
    if (hintId.startsWith('replay:open-timeline')) {
      setWorkspaceMode('Replay')
      setShowTimeline(true)
      setShellPanelState((current) => ({ ...current, bottomCollapsed: false }))
    }
  }

  function handleStarterWorkspaceGenerate(templateId: string, options: { workspaceName: string; includeCheckpoint: boolean }) {
    const template = getWorkspaceTemplate(templateId)
    const now = new Date().toISOString()
    const nextRegistry = applyWorkspaceTemplate(domainRegistry, templateId)
    const nextWorkspace = {
      ...workspace,
      name: options.workspaceName || template?.title || workspace.name,
      version: workspace.version + 1,
      updatedAt: now,
    }
    const nextSimulation = simulateWorkspace(nextWorkspace)
    const nextValidation = validateWorkspace(nextWorkspace)
    const nextGraph = buildEnterpriseGraph(nextWorkspace, nextSimulation, nextValidation, nextRegistry)
    const nextTraceHighlight: TraceHighlightState = { impactedEntityIds: [], missingLinkNodeIds: [], riskSeverity: 'low' }
    const after: WorkspaceDocument = {
      ...structuredClone(currentWorkspaceDocument),
      version: currentWorkspaceDocument.version + 1,
      name: nextWorkspace.name,
      updatedAt: now,
      layeredArchitectureState: nextWorkspace,
      domainRegistryState: nextRegistry,
      compositionCanvasState: graphToCanvasState(nextGraph, nextRegistry, nextTraceHighlight),
      traceHighlightState: nextTraceHighlight,
      validationState: nextValidation,
      auditEvents: [
        createAuditEvent({
          workspace: nextWorkspace,
          action: 'workspace.template.applied',
          metadata: { templateId, templateTitle: template?.title ?? templateId },
        }),
        ...auditEvents,
      ],
    }
    runWorkspaceCommand(createWorkspaceCommand({
      type: 'workspace.import',
      label: `Apply ${template?.title ?? 'starter template'}`,
      before: currentWorkspaceDocument,
      after,
      payload: { templateId, includeCheckpoint: options.includeCheckpoint },
    }))

    if (options.includeCheckpoint) {
      const snapshot = createWorkspaceSnapshot(after, editorState.commandHistory.undoStack.length + 1, `${template?.title ?? 'Starter'} checkpoint`)
      const checkpoint = createWorkspaceCheckpoint(snapshot, `${template?.title ?? 'Starter'} checkpoint`, 'Starter checkpoint generated by guided workflow.')
      dispatchEditorAction({ type: 'snapshot/created', snapshot })
      setCheckpointState((current) => addWorkspaceCheckpoint(current, checkpoint))
    }

    setWorkspaceMode(template?.recommendedMode === 'analyze' ? 'Analyze' : template?.recommendedMode === 'replay' ? 'Replay' : 'Build')
    setWorkspaceView(template?.recommendedMode === 'analyze' ? 'graph' : template?.recommendedMode === 'replay' ? 'traceability' : 'composition')
  }

  function openEntityFromSearch(entityId: string) {
    const entity = domainRegistry.entities.find((item) => item.id === entityId)
    setWorkspaceMode('Build')
    setWorkspaceView('domain')
    if (entity) setDomainKind(entity.kind)
    setSelectedDomainEntityId(entityId)
    setShellPanelState((current) => ({ ...current, rightCollapsed: false }))
  }

  function openGraphNodeFromSearch() {
    setWorkspaceMode('Analyze')
    setWorkspaceView('graph')
    setGraphView('d3')
    setShellPanelState((current) => ({ ...current, rightCollapsed: false }))
  }

  function openHistoryFromSearch() {
    setWorkspaceMode('Replay')
    setShowTimeline(true)
    setShellPanelState((current) => ({ ...current, bottomCollapsed: false }))
  }

  const searchIndex = useMemo(
    () =>
      buildWorkspaceSearchIndex({
        registry: domainRegistry,
        graph: enterpriseGraph,
        checkpoints: checkpointState,
        snapshots: editorState.snapshots,
        sessions: collaborationSessions.sessions,
        operationQueue,
        openEntity: openEntityFromSearch,
        openGraphNode: openGraphNodeFromSearch,
        openCheckpoint: openHistoryFromSearch,
        openSnapshot: openHistoryFromSearch,
        openCollaboration: () => {
          setShellPanelState((current) => ({ ...current, bottomCollapsed: false }))
          setShowTimeline(true)
        },
      }),
    [
      checkpointState,
      collaborationSessions.sessions,
      domainRegistry,
      editorState.snapshots,
      enterpriseGraph,
      operationQueue,
    ],
  )

  const commands = useMemo<CommandAction[]>(
    () => [
      {
        id: 'workspace.launcher',
        title: 'Open launcher',
        description: 'Choose a first-step workflow or template.',
        scope: 'productivity',
        shortcut: 'L',
        keywords: ['start', 'template', 'new'],
        perform: () => setStarterWizardOpen(true),
      },
      {
        id: 'workspace.save',
        title: 'Save workspace',
        description: 'Save the current workspace document.',
        scope: 'workspace',
        shortcut: 'Cmd/Ctrl+S',
        keywords: ['persist', 'sync'],
        perform: () => void handleSaveWorkspace(),
      },
      {
        id: 'workspace.command-palette',
        title: 'Open command palette',
        description: 'Search commands and workspace objects.',
        scope: 'productivity',
        shortcut: 'Cmd/Ctrl+K',
        perform: () => setCommandPaletteOpen(true),
      },
      {
        id: 'workspace.shortcuts',
        title: 'Show keyboard shortcuts',
        description: 'Open quick-help overlay.',
        scope: 'productivity',
        shortcut: '?',
        keywords: ['help', 'keys'],
        perform: () => setShortcutOverlayOpen(true),
      },
      {
        id: 'mode.build',
        title: 'Switch to Build mode',
        description: 'Open the composition canvas.',
        scope: 'mode',
        shortcut: 'B',
        perform: () => handleTemplateSelect('operating-model'),
      },
      {
        id: 'mode.analyze',
        title: 'Switch to Analyze mode',
        description: 'Open analytical graph intelligence.',
        scope: 'mode',
        shortcut: 'A',
        perform: () => handleTemplateSelect('dependency-analysis'),
      },
      {
        id: 'mode.replay',
        title: 'Switch to Replay mode',
        description: 'Open replay, traceability, and timeline context.',
        scope: 'mode',
        shortcut: 'R',
        perform: () => handleTemplateSelect('replay-review'),
      },
      {
        id: 'navigation.architecture',
        title: 'Go to layered architecture',
        description: 'Open plugin layers and simulation context.',
        scope: 'navigation',
        perform: () => setWorkspaceView('architecture'),
      },
      {
        id: 'navigation.domain',
        title: 'Go to domain workspaces',
        description: 'Manage requirements, APIs, data, tests, and operations.',
        scope: 'navigation',
        perform: () => setWorkspaceView('domain'),
      },
      {
        id: 'navigation.graph',
        title: 'Go to graph views',
        description: 'Open D3 or Three.js visual intelligence.',
        scope: 'navigation',
        perform: () => setWorkspaceView('graph'),
      },
      {
        id: 'navigation.traceability',
        title: 'Go to traceability',
        description: 'Inspect impact paths and missing links.',
        scope: 'navigation',
        perform: () => setWorkspaceView('traceability'),
      },
      {
        id: 'replay.timeline',
        title: 'Toggle timeline',
        description: 'Show or hide timeline and replay surfaces.',
        scope: 'replay',
        shortcut: 'T',
        perform: () => {
          setShowTimeline((current) => !current)
          setShellPanelState((current) => ({ ...current, bottomCollapsed: false }))
        },
      },
      {
        id: 'replay.checkpoint',
        title: 'Create checkpoint',
        description: 'Name a recovery point for the current workspace state.',
        scope: 'replay',
        perform: () => setShowCheckpointDialog(true),
      },
      {
        id: 'developer.toggle',
        title: 'Toggle Developer Mode',
        description: 'Reveal command history, workspace manager, and internals.',
        scope: 'developer',
        perform: () => setShellPanelState((current) => ({ ...current, developerMode: !current.developerMode, bottomCollapsed: false })),
      },
    ],
    [handleSaveWorkspace],
  )

  const keyboardShortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      { id: 'palette', label: 'Command palette', keys: 'Cmd/Ctrl+K', run: () => setCommandPaletteOpen(true) },
      { id: 'save', label: 'Save workspace', keys: 'Cmd/Ctrl+S', run: () => void handleSaveWorkspace() },
      { id: 'build', label: 'Build mode', keys: 'B', run: () => handleTemplateSelect('operating-model') },
      { id: 'analyze', label: 'Analyze mode', keys: 'A', run: () => handleTemplateSelect('dependency-analysis') },
      { id: 'replay', label: 'Replay mode', keys: 'R', run: () => handleTemplateSelect('replay-review') },
      { id: 'timeline', label: 'Toggle timeline', keys: 'T', run: () => setShowTimeline((current) => !current) },
      { id: 'focus', label: 'Focus canvas', keys: 'F', run: () => setShellPanelState((current) => ({ ...current, leftCollapsed: true, rightCollapsed: true })) },
      { id: 'search', label: 'Search workspace', keys: 'Space', run: () => setCommandPaletteOpen(true) },
      { id: 'help', label: 'Show shortcuts', keys: '?', run: () => setShortcutOverlayOpen(true) },
    ],
    [handleSaveWorkspace],
  )

  useKeyboardShortcuts(keyboardShortcuts)

  const starterWorkflows = useMemo<StarterWorkflow[]>(
    () => [
      {
        id: 'create-architecture',
        title: 'Create Architecture',
        description: 'Start authoring in the Enterprise Composition Canvas.',
        category: 'create',
        run: () => handleTemplateSelect('operating-model'),
      },
      {
        id: 'import-workspace',
        title: 'Import Workspace',
        description: 'Open workspace import/export tooling in Developer Mode.',
        category: 'import',
        run: () => setShellPanelState((current) => ({ ...current, developerMode: true, bottomCollapsed: false })),
      },
      {
        id: 'explore-demo',
        title: 'Explore Demo',
        description: 'Open analytical graph intelligence for the seeded workspace.',
        category: 'demo',
        run: () => handleTemplateSelect('dependency-analysis'),
      },
      {
        id: 'template-microservices',
        title: 'Microservices',
        description: 'Use composition mode for service, API, data, and infra mapping.',
        category: 'template',
        run: () => handleTemplateSelect('operating-model'),
      },
      {
        id: 'template-event-driven',
        title: 'Event-driven',
        description: 'Jump to graph analysis for dependency and integration paths.',
        category: 'template',
        run: () => handleTemplateSelect('dependency-analysis'),
      },
      {
        id: 'template-api-platform',
        title: 'API Platform',
        description: 'Open API domain management and relationship authoring.',
        category: 'template',
        run: () => {
          setWorkspaceMode('Build')
          setWorkspaceView('domain')
          setDomainKind('api')
        },
      },
      {
        id: 'template-saas',
        title: 'SaaS Architecture',
        description: 'Start from the composition canvas and inspect operations.',
        category: 'template',
        run: () => handleTemplateSelect('operating-model'),
      },
      {
        id: 'template-data-platform',
        title: 'Data Platform',
        description: 'Open data domain entities and graph traceability.',
        category: 'template',
        run: () => {
          setWorkspaceMode('Build')
          setWorkspaceView('domain')
          setDomainKind('databaseTable')
        },
      },
    ],
    [],
  )

  const breadcrumbs = [
    { id: 'workspace', label: workspace.name, onSelect: () => setWorkspaceView('composition') },
    { id: 'mode', label: workspaceMode },
    { id: 'view', label: workspaceView },
    ...(workspaceView === 'domain' ? [{ id: 'domain', label: domainKind }] : []),
    ...(workspaceView === 'graph' ? [{ id: 'graph', label: graphView }] : []),
  ]

  const contextualCanvasActions = commands.filter((command) =>
    ['workspace.save', 'replay.checkpoint', 'mode.analyze', 'mode.replay', 'developer.toggle'].includes(command.id),
  )

  const activeGuidanceSurface = useMemo(() => {
    const isStarterWorkspace =
      domainRegistry.entities.length <= initialDomainRegistry.entities.length && workspaceView === 'composition'

    if (isStarterWorkspace) {
      return (
        <EmptyStateGuidance
          mode={workflowMode}
          onPrimaryAction={() => setStarterWizardOpen(true)}
        />
      )
    }

    if (workspaceMode === 'Analyze' || workspaceMode === 'Replay') {
      return <WorkspaceHealthPanel report={intelligenceReport} mode={workspaceMode} />
    }

    return (
      <div className="guided-workspace-panel">
        <WorkflowProgressTracker progress={journey.progress} />
        <SuggestionPanel
          nextStep={journey.nextStep}
          hints={journey.hints}
          onRunNextStep={() => runWorkflowAction(journey.nextAction?.commandId)}
          onRunHint={(hint) => handleHintAction(hint.id)}
          onDismiss={(hintId) => setWorkflowState((current) => dismissWorkflowHint(current, hintId))}
        />
      </div>
    )
  }, [
    domainRegistry.entities.length,
    intelligenceReport,
    journey.hints,
    journey.nextAction?.commandId,
    journey.nextStep,
    journey.progress,
    workflowMode,
    workspaceMode,
    workspaceView,
  ])

  const layoutState = useMemo<LayoutState>(
    () => ({
      mode: workspaceMode,
      leftCollapsed: shellPanelState.leftCollapsed,
      rightCollapsed: shellPanelState.rightCollapsed,
      bottomCollapsed: shellPanelState.bottomCollapsed,
      developerMode: shellPanelState.developerMode,
      timelineOpen: showTimeline,
      activeGuidanceOverlayId: activeGuidanceSurface ? 'guidance' : undefined,
    }),
    [activeGuidanceSurface, shellPanelState, showTimeline, workspaceMode],
  )

  const registeredPanels = useMemo(() => createPanelRegistry(layoutState), [layoutState])
  const registeredOverlays = useMemo(
    () =>
      createOverlayRegistry(layoutState, {
        commandPaletteOpen,
        starterWizardOpen,
        launcherOpen,
        shortcutOverlayOpen,
        contextMenuOpen: Boolean(contextMenu),
        checkpointDialogOpen: showCheckpointDialog,
        recoveryImportOpen: showRecoveryImport,
        guidanceVisible: Boolean(activeGuidanceSurface),
      }),
    [
      activeGuidanceSurface,
      commandPaletteOpen,
      contextMenu,
      layoutState,
      launcherOpen,
      shortcutOverlayOpen,
      showCheckpointDialog,
      showRecoveryImport,
      starterWizardOpen,
    ],
  )

  const managedOverlays = useMemo<ManagedOverlay[]>(
    () => [
      {
        id: 'remote-cursors',
        node: (
          <>
            <RemoteCursorLayer sessions={collaborationSessions.sessions} />
            <WsCursorLayer cursors={wsRemoteCursors} isConnected={wsIsConnected} />
          </>
        ),
      },
      {
        id: 'command-palette',
        node: (
          <CommandPalette
            open={commandPaletteOpen}
            commands={commands}
            searchIndex={searchIndex}
            recentQueries={recentQueries}
            onClose={() => setCommandPaletteOpen(false)}
            onQueryCommit={(query) => setRecentQueries((current) => pushRecentQuery(current, query))}
          />
        ),
      },
      {
        id: 'starter-wizard',
        node: (
          <StarterWorkspaceWizard
            open={starterWizardOpen}
            templates={workspaceTemplates}
            defaultWorkspaceName={workspace.name}
            onClose={() => setStarterWizardOpen(false)}
            onGenerate={handleStarterWorkspaceGenerate}
          />
        ),
      },
      {
        id: 'workspace-launcher',
        node: <WorkspaceLauncher open={launcherOpen} workflows={starterWorkflows} onClose={() => setLauncherOpen(false)} />,
      },
      {
        id: 'shortcut-overlay',
        node: <ShortcutOverlay open={shortcutOverlayOpen} shortcuts={keyboardShortcuts} onClose={() => setShortcutOverlayOpen(false)} />,
      },
      {
        id: 'context-menu',
        node: <ContextualActionMenu menu={contextMenu} onClose={() => setContextMenu(undefined)} />,
      },
      {
        id: 'checkpoint-dialog',
        node: <CheckpointDialog open={showCheckpointDialog} onCreate={handleCreateCheckpoint} onCancel={() => setShowCheckpointDialog(false)} />,
      },
      {
        id: 'recovery-import',
        node: (
          <RecoveryImportDialog
            open={showRecoveryImport}
            onCancel={() => setShowRecoveryImport(false)}
            onImport={(bundle: WorkspaceRecoveryBundle) => {
              dispatchEditorAction({ type: 'snapshots/restored', snapshots: bundle.snapshots })
              dispatchEditorAction({ type: 'events/restored', events: bundle.editorEvents ?? [] })
              setCheckpointState({ checkpoints: bundle.checkpoints, activeCheckpointId: bundle.checkpoints[0]?.id })
              setShowRecoveryImport(false)
            }}
          />
        ),
      },
    ],
    [
      collaborationSessions.sessions,
      commandPaletteOpen,
      commands,
      contextMenu,
      keyboardShortcuts,
      launcherOpen,
      recentQueries,
      searchIndex,
      shortcutOverlayOpen,
      showCheckpointDialog,
      showRecoveryImport,
      starterWizardOpen,
      starterWorkflows,
      workspace.name,
    ],
  )

  return (
    <WorkspaceShell
      layoutState={layoutState}
      registeredPanels={registeredPanels}
      registeredOverlays={registeredOverlays}
      topBar={
        <TopCommandBar
          title={workspace.name}
          description={workspace.description}
          mode={workspaceMode}
          status={
            <>
              <Breadcrumbs items={breadcrumbs} />
              <span>{workspaceSync.saveState}</span>
              <span>{workspaceSync.runtime.isDirty ? 'Unsaved' : 'Synced'}</span>
              <span>{collaborationSessions.sessions.length} local sessions</span>
            </>
          }
          actions={
            <>
              <WorkspaceModeSwitcher
                mode={workspaceMode}
                onModeChange={(mode) => {
                  setWorkspaceMode(mode)
                  if (mode === 'Build') setWorkspaceView('composition')
                  if (mode === 'Analyze') setWorkspaceView('graph')
                  if (mode === 'Replay') {
                    setWorkspaceView('traceability')
                    setShowTimeline(true)
                    setShellPanelState((current) => ({ ...current, bottomCollapsed: false }))
                  }
                }}
              />
              <button type="button" onClick={() => setStarterWizardOpen(true)}>Start</button>
              <button type="button" onClick={() => setCommandPaletteOpen(true)}>Command</button>
              <button type="button" onClick={() => void handleSaveWorkspace()}>Save</button>
              <button type="button" onClick={() => setShellPanelState((current) => ({ ...current, rightCollapsed: !current.rightCollapsed }))}>Inspector</button>
              <button type="button" onClick={() => setShellPanelState((current) => ({ ...current, bottomCollapsed: !current.bottomCollapsed }))}>Timeline</button>
              <button
                type="button"
                className={shellPanelState.developerMode ? 'is-active' : ''}
                onClick={() => setShellPanelState((current) => ({ ...current, developerMode: !current.developerMode }))}
              >
                Dev
              </button>
            </>
          }
        />
      }
      leftSidebar={
        <LeftSidebar
          collapsed={shellPanelState.leftCollapsed}
          onToggle={() => setShellPanelState((current) => ({ ...current, leftCollapsed: !current.leftCollapsed }))}
          navigation={
            <nav className="studio-navigation" aria-label="Workspace navigation">
              <button type="button" data-short="K" onClick={() => setCommandPaletteOpen(true)}>Search everything</button>
              <div className="studio-navigation-section">
                <p className="eyebrow">Workspace</p>
                <button type="button" data-short="CC" className={workspaceView === 'composition' ? 'is-active' : ''} onClick={() => setWorkspaceView('composition')}>
                  Composition Canvas
                </button>
                <button type="button" data-short="LA" className={workspaceView === 'architecture' ? 'is-active' : ''} onClick={() => setWorkspaceView('architecture')}>
                  Layered Architecture
                </button>
                <button type="button" data-short="DW" className={workspaceView === 'domain' ? 'is-active' : ''} onClick={() => setWorkspaceView('domain')}>
                  Domain Workspaces
                </button>
              </div>
              <div className="studio-navigation-section">
                <p className="eyebrow">Architecture</p>
                <button type="button" data-short="GV" className={workspaceView === 'graph' ? 'is-active' : ''} onClick={() => setWorkspaceView('graph')}>
                  Graph Views
                </button>
                <button type="button" data-short="TR" className={workspaceView === 'traceability' ? 'is-active' : ''} onClick={() => setWorkspaceView('traceability')}>
                  Traceability
                </button>
              </div>
              <div className="studio-navigation-section">
                <p className="eyebrow">Replay</p>
                <button type="button" data-short="TL" className={showTimeline ? 'is-active' : ''} onClick={() => setShowTimeline((current) => !current)}>
                  Timeline
                </button>
                <button type="button" data-short="RC" className={showRecoveryPanel ? 'is-active' : ''} onClick={() => setShowRecoveryPanel((current) => !current)}>
                  Recovery
                </button>
              </div>
              <div className="studio-navigation-section">
                <p className="eyebrow">Tools</p>
                <button type="button" data-short="?" onClick={() => setShortcutOverlayOpen(true)}>Shortcuts</button>
                <button type="button" data-short="DV" className={shellPanelState.developerMode ? 'is-active' : ''} onClick={() => setShellPanelState((current) => ({ ...current, developerMode: !current.developerMode, bottomCollapsed: false }))}>
                  Developer Mode
                </button>
              </div>
            </nav>
          }
          tools={
            <>
              {workspaceView === 'domain' ? (
                <div className="studio-tool-group">
                  <p className="eyebrow">Domain</p>
                  {[
                    ['requirement', 'Requirements', 'RQ'],
                    ['api', 'APIs', 'API'],
                    ['databaseTable', 'Data', 'DB'],
                    ['testCase', 'Testing', 'TC'],
                    ['incident', 'Operations', 'OP'],
                  ].map(([id, label, short]) => (
                    <button key={id} type="button" data-short={short} className={domainKind === id ? 'is-active' : ''} onClick={() => setDomainKind(id as DomainEntityKind)}>
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              {workspaceView === 'graph' ? (
                <div className="studio-tool-group">
                  <p className="eyebrow">Graph View</p>
                  <button type="button" data-short="D3" className={graphView === 'd3' ? 'is-active' : ''} onClick={() => setGraphView('d3')}>D3 Analytical</button>
                  <button type="button" data-short="3D" className={graphView === 'three' ? 'is-active' : ''} onClick={() => setGraphView('three')}>Three Spatial</button>
                </div>
              ) : null}
              {workspaceView === 'composition' ? (
                <WorkspaceTemplatePicker templates={starterTemplates} onSelectTemplate={handleTemplateSelect} />
              ) : null}
            </>
          }
        />
      }
      stadium={
        <StadiumWorkspace
          mode={workspaceMode}
          onCanvasPointerMove={(event) => broadcastCursor(event.clientX, event.clientY)}
          onCanvasContextMenu={(event) => {
            event.preventDefault()
            setContextMenu({
              x: event.clientX,
              y: event.clientY,
              label: `${workspaceMode} canvas actions`,
              actions: contextualCanvasActions,
            })
          }}
          guidance={activeGuidanceSurface}
        >
          {workspaceView === 'architecture' ? (
            <div className="stadium-card-grid">
              {architectureLayers.map((layer) => {
                const workspaceLayer = workspace.layers.find((item) => item.layer === layer)
                const layerSimulation = simulation.layerBreakdown.find((item) => item.layer === layer)
                if (!workspaceLayer) return null
                return (
                  <LayerCard
                    key={layer}
                    workspaceLayer={workspaceLayer}
                    simulation={layerSimulation}
                    onSwap={(pluginId) => handleSwap(layer, pluginId)}
                  />
                )
              })}
            </div>
          ) : null}
          {workspaceView === 'domain' ? (
            <>
              {domainKind === 'requirement' ? <RequirementsWorkspace {...domainWorkspaceProps} /> : null}
              {domainKind === 'api' ? <ApiWorkspace {...domainWorkspaceProps} /> : null}
              {domainKind === 'databaseTable' ? <DataWorkspace {...domainWorkspaceProps} /> : null}
              {domainKind === 'testCase' ? <TestingWorkspace {...domainWorkspaceProps} /> : null}
              {domainKind === 'incident' ? <OperationsWorkspace {...domainWorkspaceProps} /> : null}
            </>
          ) : null}
          {workspaceView === 'graph' ? (
            <>
              {workspaceMode === 'Analyze' ? <DependencyHeatOverlay heatPoints={intelligenceReport.heatPoints} /> : null}
              {graphView === 'd3' ? (
                <D3EnterpriseGraph visualGraph={visualGraph} traceHighlight={traceHighlight} />
              ) : (
                <LazyThreeArchitectureView visualGraph={visualGraph} traceHighlight={traceHighlight} />
              )}
            </>
          ) : null}
          {workspaceView === 'traceability' ? (
            <TraceabilityWorkspace graph={enterpriseGraph} traceHighlight={traceHighlight} onTraceHighlightChange={setTraceHighlight} />
          ) : null}
          {workspaceView === 'composition' ? (
            <EnterpriseCompositionCanvas
              graph={enterpriseGraph}
              registry={domainRegistry}
              traceHighlight={traceHighlight}
              initialCompositionState={compositionCanvasState}
              onCreateEntity={handleCompositionCreateEntity}
              onCreateRelationship={handleCreateRelationship}
              onTraceHighlightChange={setTraceHighlight}
              onCompositionStateChange={handleCompositionStateChange}
            />
          ) : null}
        </StadiumWorkspace>
      }
      inspector={
        <WorkspaceInspector
          collapsed={shellPanelState.rightCollapsed}
          onToggle={() => setShellPanelState((current) => ({ ...current, rightCollapsed: !current.rightCollapsed }))}
        >
          <details className="inspector-section" open>
            <summary>Workspace Summary</summary>
            <WorkspaceStatusBar
              document={currentWorkspaceDocument}
              lastSavedAt={lastSavedAt}
              hasUnsavedChanges={workspaceSync.runtime.isDirty || workspaceFingerprint !== lastSavedFingerprint}
              saveState={workspaceSync.saveState}
              runtime={workspaceSync.runtime}
              retryCount={workspaceSync.retryCount}
              isOnline={workspaceSync.isOnline}
              validationStatus={!documentValidation.valid ? 'errors' : documentValidation.warnings.length > 0 ? 'warnings' : 'valid'}
              entityCount={domainRegistry.entities.length}
              graphNodeCount={enterpriseGraph.nodes.length}
              canvasNodeCount={effectiveCompositionState.nodes.length}
              canUndo={editorState.commandHistory.undoStack.length > 0}
              canRedo={editorState.commandHistory.redoStack.length > 0}
              undoDepth={editorState.commandHistory.undoStack.length}
              redoDepth={editorState.commandHistory.redoStack.length}
              snapshotCount={editorState.snapshots.snapshots.length}
              activeTransactionLabel={editorState.transactions.stack[0]?.label}
              lastCommandLabel={editorState.runtime.lastCommandLabel}
              activeCheckpointName={checkpointState.checkpoints.find((checkpoint) => checkpoint.id === checkpointState.activeCheckpointId)?.name}
              snapshotHealth={recoveryStatus.healthy ? 'healthy' : 'error'}
              recoveryStatus={recoveryStatus.healthy ? 'healthy' : `${recoveryStatus.issues.length} issues`}
              replayValidationState={replayValidation.valid ? 'valid' : `${replayValidation.errors.length} errors`}
              restoreIntegrity={recoveryStatus.healthy ? 'verified' : 'attention'}
              playbackModeState={replayPreviewDocument ? `preview ${replaySandboxStatus}` : showTimeline ? 'preview-ready' : 'closed'}
              replaySandboxStatus={replaySandboxStatus}
              divergenceWarning={replayPreviewDocument ? 'Replay preview differs from live state.' : undefined}
              replayPerformanceState={replayPerformanceWarning ?? 'normal'}
              activeSessionCount={collaborationSessions.sessions.length}
              collaborationState="simulated-local"
              mergeQueueState={`${operationQueue.pending.length} pending / ${operationQueue.merged.length} merged`}
              conflictWarningState={collaborationValidation.valid ? 'none' : `${collaborationValidation.errors.length} errors`}
              retentionStats={`${editorState.commandHistory.undoStack.length}/${editorState.commandHistory.maxDepth} commands retained`}
              onToggleTimeline={() => setShowTimeline((current) => !current)}
              onCreateCheckpoint={() => setShowCheckpointDialog(true)}
              onExportHistory={handleExportHistory}
              onUndo={handleUndoEditorCommand}
              onRedo={handleRedoEditorCommand}
            />
          </details>
          <details className="inspector-section" open>
            <summary>Architecture Health</summary>
            <WorkspaceHealthPanel report={intelligenceReport} mode={workspaceMode} />
          </details>
          {workspaceView === 'architecture' ? (
            <>
              <details className="inspector-section" open>
                <summary>Simulation</summary>
                <SimulationPanel simulation={simulation} />
              </details>
              <details className="inspector-section">
                <summary>Validation</summary>
                <ValidationPanel validation={validation} />
              </details>
              <details className="inspector-section">
                <summary>AI Assistance</summary>
                <AssistantNotesPanel simulation={simulation} />
              </details>
              <details className="inspector-section">
                <summary>Diagnostics</summary>
                <AuditTrailPanel events={auditEvents} />
                <ComparisonMode comparison={comparison} history={history} onCopyWorkspace={handleCopyWorkspace} />
              </details>
            </>
          ) : null}
          {workspaceView === 'graph' ? (
            <details className="inspector-section" open>
              <summary>Graph Intelligence</summary>
              <DependencyGraphPanel visualGraph={visualGraph} />
            </details>
          ) : null}
          <details className="inspector-section">
            <summary>Collaboration</summary>
            <RemoteSelectionLayer sessions={collaborationSessions.sessions} />
          </details>
        </WorkspaceInspector>
      }
      bottomPanel={
        <BottomWorkspacePanel
          collapsed={shellPanelState.bottomCollapsed}
          developerMode={shellPanelState.developerMode}
          onToggle={() => setShellPanelState((current) => ({ ...current, bottomCollapsed: !current.bottomCollapsed }))}
          onToggleDeveloperMode={() => setShellPanelState((current) => ({ ...current, developerMode: !current.developerMode }))}
        >
          {showTimeline ? (
            <WorkspaceTimeline
              history={editorState.commandHistory}
              snapshots={editorState.snapshots.snapshots}
              checkpoints={checkpointState.checkpoints}
              events={editorState.events}
              selectedEntryId={selectedTimelineEntry?.id}
              onSelectEntry={(entry) => {
                setSelectedTimelineEntry(entry)
                if (entry.checkpointId) {
                  const checkpoint = checkpointState.checkpoints.find((item) => item.id === entry.checkpointId)
                  if (checkpoint && window.confirm(`Restore checkpoint "${checkpoint.name}"? A recovery snapshot will be created first.`)) handleRestoreCheckpoint(checkpoint)
                } else if (entry.snapshotId && entry.type === 'snapshot' && window.confirm('Restore this snapshot? A recovery snapshot will be created first.')) {
                  handleRestoreSnapshot(entry.snapshotId)
                }
              }}
              onCreateCheckpoint={() => setShowCheckpointDialog(true)}
              onRestoreCheckpoint={(checkpoint) => {
                if (window.confirm(`Restore checkpoint "${checkpoint.name}"? A recovery snapshot will be created first.`)) handleRestoreCheckpoint(checkpoint)
              }}
              onDeleteCheckpoint={(checkpointId) => setCheckpointState((current) => deleteWorkspaceCheckpoint(current, checkpointId))}
              onExportHistory={handleExportHistory}
              onToggleRecovery={() => setShowRecoveryPanel((current) => !current)}
              onReplayDocumentChange={(document, status, warning) => {
                setReplayPreviewDocument(document)
                setReplaySandboxStatus(status)
                setReplayPerformanceWarning(warning)
              }}
            />
          ) : null}
          <ReplayComparisonView liveDocument={currentWorkspaceDocument} replayDocument={replayPreviewDocument} />
          {showRecoveryPanel ? (
            <RecoveryPanel
              status={recoveryStatus}
              onRestoreLatestHealthy={handleRestoreLatestHealthySnapshot}
              onExportRecoveryBundle={handleExportRecoveryBundle}
              onImportRecoveryBundle={() => setShowRecoveryImport(true)}
            />
          ) : null}
          <WorkspaceDiffViewer snapshots={editorState.snapshots.snapshots} checkpoints={checkpointState.checkpoints} currentVersion={currentWorkspaceDocument.version} />
          {shellPanelState.developerMode ? (
            <>
              <CommandHistoryPanel editorState={editorState} />
              <WorkspaceManager
                document={currentWorkspaceDocument}
                savedWorkspaces={savedWorkspaces}
                onRenameWorkspace={handleRenameWorkspace}
                onSaveWorkspace={handleSaveWorkspace}
                onLoadWorkspace={handleLoadWorkspace}
                onDuplicateWorkspace={handleDuplicateWorkspace}
                onDeleteWorkspace={handleDeleteSavedWorkspace}
                onResetWorkspace={handleResetWorkspace}
                onImportWorkspace={async (document) => {
                  applyWorkspaceDocument(document)
                  await refreshSavedWorkspaces()
                }}
              />
            </>
          ) : null}
        </BottomWorkspacePanel>
      }
      overlays={managedOverlays}
    />
  )
}
