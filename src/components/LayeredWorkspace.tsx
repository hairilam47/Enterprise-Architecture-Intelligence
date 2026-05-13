import { useMemo, useState } from 'react'
import { createAuditEvent } from '../audit/createAuditEvent'
import { compareWorkspaces } from '../comparison/compareWorkspaces'
import { createEntity, deleteEntity, initialDomainRegistry } from '../domain/domainRegistry'
import type { DomainEntityDraft, DomainEntityKind } from '../domain/domainTypes'
import { createDomainRelationship } from '../domain/relationshipBuilder'
import { swapPlugin } from '../engine/swapPlugin'
import { buildEnterpriseGraph } from '../graph/buildGraph'
import type { EnterpriseRelationshipType } from '../graph/enterpriseGraph'
import { appendWorkspaceHistory, createWorkspaceHistoryEntry } from '../history/workspaceHistory'
import { getPluginById } from '../plugins/pluginRegistry'
import { simulateWorkspace } from '../simulation/simulateWorkspace'
import { architectureLayers, type ArchitectureLayer, type Workspace } from '../types/architecture'
import type { AuditEvent } from '../types/audit'
import { validateWorkspace } from '../validation/validateWorkspace'
import { applySimulationOverlay } from '../visualization/simulationOverlay'
import { toVisualGraph } from '../visualization/visualAdapters'
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
import { TraceabilityWorkspace } from './traceability/TraceabilityWorkspace'

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
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const [workspaceView, setWorkspaceView] = useState<'architecture' | 'domain' | 'graph' | 'traceability'>('architecture')
  const [graphView, setGraphView] = useState<'d3' | 'three'>('d3')
  const [domainKind, setDomainKind] = useState<DomainEntityKind>('requirement')
  const [domainRegistry, setDomainRegistry] = useState(initialDomainRegistry)
  const [selectedDomainEntityId, setSelectedDomainEntityId] = useState<string | undefined>(
    initialDomainRegistry.entities[0]?.id,
  )
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

  function handleSwap(layer: ArchitectureLayer, pluginId: string) {
    const previousLayer = workspace.layers.find((item) => item.layer === layer)
    const nextWorkspace = swapPlugin({ workspace, layer, pluginId })
    const previousPlugin = previousLayer ? getPluginById(previousLayer.pluginId) : undefined
    const nextPlugin = getPluginById(pluginId)
    const nextValidation = validateWorkspace(nextWorkspace)
    const nextSimulation = simulateWorkspace(nextWorkspace)

    setWorkspace(nextWorkspace)
    setHistory((currentHistory) =>
      appendWorkspaceHistory(
        currentHistory,
        nextWorkspace,
        `${layer}: ${previousPlugin?.name ?? 'Unknown'} to ${nextPlugin?.name ?? 'Unknown'}`,
      ),
    )
    setAuditEvents((currentEvents) => [
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
      ...currentEvents,
    ])
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
    setDomainRegistry((currentRegistry) => {
      const nextRegistry = createEntity(currentRegistry, draft)
      setSelectedDomainEntityId(nextRegistry.entities[0]?.id)
      return nextRegistry
    })
  }

  function handleDeleteEntity(entityId: string) {
    setDomainRegistry((currentRegistry) => deleteEntity(currentRegistry, entityId))
    setSelectedDomainEntityId(undefined)
  }

  function handleCreateRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    relationship: EnterpriseRelationshipType,
    description: string,
  ) {
    setDomainRegistry((currentRegistry) =>
      createDomainRelationship(currentRegistry, sourceEntityId, targetEntityId, relationship, description),
    )
  }

  const domainWorkspaceProps = {
    registry: domainRegistry,
    selectedEntityId: selectedDomainEntityId,
    onSelectEntity: setSelectedDomainEntityId,
    onCreateEntity: handleCreateEntity,
    onDeleteEntity: handleDeleteEntity,
    onCreateRelationship: handleCreateRelationship,
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Local in-memory foundation</p>
          <h1>{workspace.name}</h1>
          <p>{workspace.description}</p>
        </div>
        <div className="workspace-status">
          <span>Workspace preserved</span>
          <strong>{new Date(workspace.updatedAt).toLocaleTimeString()}</strong>
        </div>
      </header>

      <section className="graph-view-switcher panel" aria-label="Workspace section switcher">
        <div>
          <p className="eyebrow">Workspace Sections</p>
          <h2>Architecture, domains, and graph intelligence</h2>
        </div>
        <div className="segmented-control">
          <button type="button" className={workspaceView === 'architecture' ? 'is-active' : ''} onClick={() => setWorkspaceView('architecture')}>Layered architecture</button>
          <button type="button" className={workspaceView === 'domain' ? 'is-active' : ''} onClick={() => setWorkspaceView('domain')}>Domain workspaces</button>
          <button type="button" className={workspaceView === 'graph' ? 'is-active' : ''} onClick={() => setWorkspaceView('graph')}>Graph views</button>
          <button type="button" className={workspaceView === 'traceability' ? 'is-active' : ''} onClick={() => setWorkspaceView('traceability')}>Traceability</button>
        </div>
      </section>

      {workspaceView === 'architecture' ? (
        <>
          <section className="workspace-layout" aria-label="Layered architecture workspace">
            <div className="layer-stack">
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

            <div className="side-rail">
              <SimulationPanel simulation={simulation} />
              <ValidationPanel validation={validation} />
              <AssistantNotesPanel simulation={simulation} />
              <AuditTrailPanel events={auditEvents} />
            </div>
          </section>

          <ComparisonMode
            comparison={comparison}
            history={history}
            onCopyWorkspace={handleCopyWorkspace}
          />
        </>
      ) : null}

      {workspaceView === 'domain' ? (
        <>
          <section className="graph-view-switcher panel" aria-label="Domain switcher">
            <div>
              <p className="eyebrow">Domain Entity Management</p>
              <h2>Every entity becomes graph intelligence</h2>
            </div>
            <div className="segmented-control domain-tabs">
              <button type="button" className={domainKind === 'requirement' ? 'is-active' : ''} onClick={() => setDomainKind('requirement')}>Requirements</button>
              <button type="button" className={domainKind === 'api' ? 'is-active' : ''} onClick={() => setDomainKind('api')}>APIs</button>
              <button type="button" className={domainKind === 'databaseTable' ? 'is-active' : ''} onClick={() => setDomainKind('databaseTable')}>Data</button>
              <button type="button" className={domainKind === 'testCase' ? 'is-active' : ''} onClick={() => setDomainKind('testCase')}>Testing</button>
              <button type="button" className={domainKind === 'incident' ? 'is-active' : ''} onClick={() => setDomainKind('incident')}>Operations</button>
            </div>
          </section>
          {domainKind === 'requirement' ? <RequirementsWorkspace {...domainWorkspaceProps} /> : null}
          {domainKind === 'api' ? <ApiWorkspace {...domainWorkspaceProps} /> : null}
          {domainKind === 'databaseTable' ? <DataWorkspace {...domainWorkspaceProps} /> : null}
          {domainKind === 'testCase' ? <TestingWorkspace {...domainWorkspaceProps} /> : null}
          {domainKind === 'incident' ? <OperationsWorkspace {...domainWorkspaceProps} /> : null}
        </>
      ) : null}

      {workspaceView === 'graph' ? (
        <>
          <DependencyGraphPanel visualGraph={visualGraph} />

          <section className="graph-view-switcher panel" aria-label="Graph view switcher">
            <div>
              <p className="eyebrow">Graph Views</p>
              <h2>Analytical and spatial understanding</h2>
            </div>
            <div className="segmented-control">
              <button type="button" className={graphView === 'd3' ? 'is-active' : ''} onClick={() => setGraphView('d3')}>D3 Analytical View</button>
              <button type="button" className={graphView === 'three' ? 'is-active' : ''} onClick={() => setGraphView('three')}>Three.js Spatial View</button>
            </div>
          </section>

          {graphView === 'd3' ? (
            <D3EnterpriseGraph visualGraph={visualGraph} traceHighlight={traceHighlight} />
          ) : (
            <LazyThreeArchitectureView visualGraph={visualGraph} traceHighlight={traceHighlight} />
          )}
        </>
      ) : null}

      {workspaceView === 'traceability' ? (
        <TraceabilityWorkspace
          graph={enterpriseGraph}
          traceHighlight={traceHighlight}
          onTraceHighlightChange={setTraceHighlight}
        />
      ) : null}
    </main>
  )
}
