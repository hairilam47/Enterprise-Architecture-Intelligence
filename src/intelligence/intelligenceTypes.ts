import type { EnterpriseGraph } from '../graph/enterpriseGraph'
import type { CommandHistoryState } from '../editor/commandHistory'
import type { WorkspaceCheckpointState } from '../workspace/workspaceCheckpoints'
import type { WorkspaceSnapshotState } from '../workspace/workspaceSnapshots'

export type ArchitectureSignalSeverity = 'info' | 'warning' | 'critical'
export type ArchitectureSignalCategory = 'topology' | 'dependency' | 'traceability' | 'replay' | 'governance'

export type ArchitectureSignal = {
  id: string
  severity: ArchitectureSignalSeverity
  category: ArchitectureSignalCategory
  title: string
  description: string
  relatedEntityIds?: string[]
  suggestedAction?: string
}

export type ArchitectureRecommendation = {
  id: string
  title: string
  description: string
  sourceSignalIds: string[]
  suggestedAction?: string
}

export type HealthDimensionStatus = 'stable' | 'incomplete' | 'attention' | 'risk'

export type WorkspaceHealthDimension = {
  id: 'connectivity' | 'traceability' | 'replayIntegrity' | 'dependencyBalance' | 'domainCoverage'
  label: string
  status: HealthDimensionStatus
  summary: string
  signalIds: string[]
}

export type DependencyHeatPoint = {
  entityId: string
  label: string
  centrality: number
  incoming: number
  outgoing: number
  severity: ArchitectureSignalSeverity
}

export type WorkspaceHealthSummary = {
  status: 'healthy' | 'attention' | 'risk'
  headline: string
  signalCounts: Record<ArchitectureSignalSeverity, number>
  dimensions: WorkspaceHealthDimension[]
}

export type WorkspaceIntelligenceReport = {
  summary: WorkspaceHealthSummary
  signals: ArchitectureSignal[]
  recommendations: ArchitectureRecommendation[]
  heatPoints: DependencyHeatPoint[]
}

export type WorkspaceIntelligenceInput = {
  graph: EnterpriseGraph
  commandHistory: CommandHistoryState
  checkpoints: WorkspaceCheckpointState
  snapshots: WorkspaceSnapshotState
}
