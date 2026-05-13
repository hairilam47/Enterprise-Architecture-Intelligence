import type { VisualGraph, VisualNode } from './visualGraph'

export type GraphSearchResult = {
  nodeId: string
  enterpriseNodeId: string
  label: string
  type: VisualNode['type']
  layer?: string
  matchReason: string
}

function metadataText(node: VisualNode) {
  return Object.entries(node.metadata.metadata ?? {})
    .map(([key, value]) => `${key} ${String(value)}`)
    .join(' ')
}

export function searchVisualGraph(visualGraph: VisualGraph, query: string): GraphSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  return visualGraph.nodes
    .map<GraphSearchResult | undefined>((node) => {
      const fields = [
        { key: 'label', value: node.label },
        { key: 'type', value: node.type },
        { key: 'layer', value: node.metadata.layer ?? node.metadata.owner ?? '' },
        { key: 'metadata', value: metadataText(node) },
      ]
      const match = fields.find((field) => field.value.toLowerCase().includes(normalizedQuery))

      if (!match) {
        return undefined
      }

      return {
        nodeId: node.id,
        enterpriseNodeId: node.enterpriseNodeId,
        label: node.label,
        type: node.type,
        layer: node.metadata.layer ?? node.metadata.owner,
        matchReason: match.key,
      }
    })
    .filter((result): result is GraphSearchResult => Boolean(result))
    .slice(0, 8)
}
