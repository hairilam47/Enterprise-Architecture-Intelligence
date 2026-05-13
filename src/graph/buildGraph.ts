import { getPluginById } from '../plugins/pluginRegistry'
import type { SimulationResult, ValidationResult, Workspace } from '../types/architecture'
import type { DomainRegistryState } from '../domain/domainTypes'
import { domainRelationshipsToGraphEdges, entitiesToGraphNodes } from '../domain/entityToGraph'
import type { EnterpriseEdge, EnterpriseGraph, EnterpriseNode } from './enterpriseGraph'

const layerNodeType: Record<string, EnterpriseNode['type']> = {
  Business: 'requirement',
  Application: 'service',
  Integration: 'api',
  Data: 'database',
  Infrastructure: 'infrastructure',
  Hardware: 'infrastructure',
  Operations: 'incident',
}

export function buildEnterpriseGraph(
  workspace: Workspace,
  simulation: SimulationResult,
  validation: ValidationResult,
  domainRegistry?: DomainRegistryState,
): EnterpriseGraph {
  const pluginNodes: EnterpriseNode[] = workspace.layers.map((workspaceLayer) => {
    const plugin = getPluginById(workspaceLayer.pluginId)
    const layerSimulation = simulation.layerBreakdown.find((item) => item.layer === workspaceLayer.layer)
    const hasValidationIssue = validation.issues.some((issue) => issue.layer === workspaceLayer.layer)
    const isBottleneck = simulation.bottlenecks.some((item) => item.layer === workspaceLayer.layer)

    return {
      id: `plugin:${workspaceLayer.pluginId}`,
      label: plugin?.name ?? workspaceLayer.pluginId,
      type: layerNodeType[workspaceLayer.layer] ?? 'service',
      owner: workspaceLayer.layer,
      layer: workspaceLayer.layer,
      status: hasValidationIssue ? 'warning' : isBottleneck ? 'critical' : 'healthy',
      metrics: layerSimulation
        ? {
            latency: layerSimulation.latency,
            throughput: layerSimulation.throughput,
            successRate: layerSimulation.successRate,
          }
        : undefined,
      metadata: {
        pluginId: workspaceLayer.pluginId,
        category: plugin?.category ?? 'Unknown',
      },
    }
  })

  const supportingNodes: EnterpriseNode[] = [
    {
      id: 'requirement:executive-insight',
      label: 'Executive Insight Requirement',
      type: 'requirement',
      owner: 'Business',
      status: 'healthy',
      metadata: { priority: 'high' },
    },
    {
      id: 'testcase:architecture-validation',
      label: 'Architecture Validation Suite',
      type: 'testcase',
      owner: 'Operations',
      status: validation.isValid ? 'healthy' : 'warning',
      metadata: { issueCount: validation.issues.length },
    },
    {
      id: 'incident:latency-risk',
      label: 'Latency Risk Scenario',
      type: 'incident',
      owner: 'Operations',
      status: simulation.totalLatency > 400 ? 'warning' : 'unknown',
      metadata: { totalLatency: simulation.totalLatency },
    },
  ]

  const layerEdges: EnterpriseEdge[] = workspace.layers.slice(0, -1).map((workspaceLayer, index) => {
    const nextLayer = workspace.layers[index + 1]

    return {
      id: `edge:${workspaceLayer.pluginId}:${nextLayer.pluginId}`,
      sourceId: `plugin:${workspaceLayer.pluginId}`,
      targetId: `plugin:${nextLayer.pluginId}`,
      relationship: index === 2 ? 'stores' : index === 4 ? 'deployed_on' : 'depends_on',
      weight: 1,
    }
  })

  const graphEdges: EnterpriseEdge[] = [
    {
      id: 'edge:requirement:business',
      sourceId: 'requirement:executive-insight',
      targetId: `plugin:${workspace.layers[0].pluginId}`,
      relationship: 'depends_on',
      weight: 2,
    },
    {
      id: 'edge:validation:workspace',
      sourceId: `plugin:${workspace.layers[1].pluginId}`,
      targetId: 'testcase:architecture-validation',
      relationship: 'validated_by',
      weight: 2,
    },
    {
      id: 'edge:risk:operations',
      sourceId: simulation.bottlenecks[0]?.pluginId
        ? `plugin:${simulation.bottlenecks[0].pluginId}`
        : `plugin:${workspace.layers[0].pluginId}`,
      targetId: 'incident:latency-risk',
      relationship: 'causes',
      weight: 3,
    },
    ...layerEdges,
  ]

  return {
    id: `graph:${workspace.id}:v${workspace.version}`,
    name: `${workspace.name} Graph`,
    nodes: [
      ...supportingNodes,
      ...pluginNodes,
      ...(domainRegistry ? entitiesToGraphNodes(domainRegistry.entities) : []),
    ],
    edges: [
      ...graphEdges,
      ...(domainRegistry ? domainRelationshipsToGraphEdges(domainRegistry.relationships) : []),
    ],
    createdAt: new Date().toISOString(),
  }
}
