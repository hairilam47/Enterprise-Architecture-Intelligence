export type ArchitectureLayer =
  | 'Business'
  | 'Application'
  | 'Integration'
  | 'Data'
  | 'Infrastructure'
  | 'Hardware'
  | 'Operations'

export const architectureLayers: ArchitectureLayer[] = [
  'Business',
  'Application',
  'Integration',
  'Data',
  'Infrastructure',
  'Hardware',
  'Operations',
]

export type PluginMetrics = {
  latency: number
  throughput: number
  successRate: number
}

export type CompatibilityRule = {
  requiresLayers?: ArchitectureLayer[]
  incompatibleWith?: string[]
  minThroughput?: number
  notes: string
}

export type VisualConfig = {
  accent: string
  icon: string
  density: 'compact' | 'standard' | 'expanded'
}

export type Plugin = {
  id: string
  name: string
  layer: ArchitectureLayer
  category: string
  metrics: PluginMetrics
  compatibility: CompatibilityRule[]
  visualConfig: VisualConfig
}

export type WorkspaceLayer = {
  layer: ArchitectureLayer
  pluginId: string
}

export type Workspace = {
  id: string
  organizationId: string
  name: string
  description: string
  version: number
  layers: WorkspaceLayer[]
  updatedAt: string
}

export type LayerSimulation = {
  layer: ArchitectureLayer
  pluginId: string
  pluginName: string
  latency: number
  throughput: number
  successRate: number
  bottleneckScore: number
  warnings: string[]
}

export type SimulationResult = {
  totalLatency: number
  successRate: number
  effectiveThroughput: number
  bottlenecks: LayerSimulation[]
  layerBreakdown: LayerSimulation[]
  warnings: string[]
  explanation: string[]
  simulatedAt: string
}

export type ValidationSeverity = 'info' | 'warning' | 'critical'

export type ValidationIssue = {
  id: string
  severity: ValidationSeverity
  layer: ArchitectureLayer
  pluginId: string
  message: string
}

export type ValidationResult = {
  isValid: boolean
  issues: ValidationIssue[]
  checkedAt: string
}

export type WorkspaceHistoryEntry = {
  id: string
  workspace: Workspace
  label: string
  createdAt: string
}

export type WorkspaceComparison = {
  baseWorkspaceId: string
  candidateWorkspaceId: string
  latencyDelta: number
  successRateDelta: number
  throughputDelta: number
  changedLayers: {
    layer: ArchitectureLayer
    basePluginName: string
    candidatePluginName: string
  }[]
  summary: string
}
