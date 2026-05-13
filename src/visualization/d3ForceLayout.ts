import * as d3 from 'd3'
import type { VisualEdge, VisualNode } from './visualGraph'

export type D3Node = VisualNode & d3.SimulationNodeDatum

export type D3Edge = Omit<VisualEdge, 'sourceId' | 'targetId'> &
  d3.SimulationLinkDatum<D3Node> & {
    sourceId: string
    targetId: string
  }

export function calculateNodeRadius(node: VisualNode) {
  const latency = node.metadata.metrics?.latency ?? 0

  return Math.max(node.radius, Math.min(32, node.radius + latency / 30))
}

export function calculateEdgeDistance(edge: VisualEdge) {
  if (edge.relationship === 'causes') {
    return 180
  }

  if (edge.relationship === 'depends_on') {
    return 145
  }

  return 125
}

export function configureForces(
  simulation: d3.Simulation<D3Node, D3Edge>,
  width: number,
  height: number,
) {
  return simulation
    .force('charge', d3.forceManyBody<D3Node>().strength(-520))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide<D3Node>().radius((node) => calculateNodeRadius(node) + 24))
    .force('x', d3.forceX<D3Node>((node) => node.x).strength(0.06))
    .force('y', d3.forceY<D3Node>((node) => node.y).strength(0.06))
}

export function createForceSimulation(
  nodes: D3Node[],
  edges: D3Edge[],
  width: number,
  height: number,
) {
  const simulation = d3.forceSimulation<D3Node>(nodes)
  const linkForce = d3
    .forceLink<D3Node, D3Edge>(edges)
    .id((node) => node.id)
    .distance((edge) => calculateEdgeDistance(edge))
    .strength(0.42)

  simulation.force('link', linkForce)

  return configureForces(simulation, width, height)
}
