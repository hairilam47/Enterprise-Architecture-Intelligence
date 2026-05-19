import type { EAElement, EARelationship, EALayer } from './eaTypes'
import type { EAStore } from './eaStore'

// ── Dependency graph helpers ───────────────────────────────────────────────

export type DependencyResult = {
  element: EAElement
  relationship: EARelationship
  direction: 'upstream' | 'downstream'
}

/** Direct relationships for one element (one hop) */
export function selectDirectDependencies(elementId: string) {
  return (s: EAStore): DependencyResult[] => {
    const results: DependencyResult[] = []
    for (const rel of Object.values(s.project.relationships)) {
      if (rel.sourceId === elementId) {
        const el = s.project.elements[rel.targetId]
        if (el) results.push({ element: el, relationship: rel, direction: 'downstream' })
      } else if (rel.targetId === elementId) {
        const el = s.project.elements[rel.sourceId]
        if (el) results.push({ element: el, relationship: rel, direction: 'upstream' })
      }
    }
    return results
  }
}

/** Full upstream chain (what this element depends on, transitively) */
export function selectUpstreamChain(elementId: string) {
  return (s: EAStore): EAElement[] => {
    const visited = new Set<string>()
    const queue = [elementId]
    const result: EAElement[] = []
    while (queue.length) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      for (const rel of Object.values(s.project.relationships)) {
        if (rel.targetId === current) {
          const el = s.project.elements[rel.sourceId]
          if (el && !visited.has(el.id)) {
            result.push(el)
            queue.push(el.id)
          }
        }
      }
    }
    return result
  }
}

/** Full downstream chain (what depends on this element, transitively) */
export function selectDownstreamChain(elementId: string) {
  return (s: EAStore): EAElement[] => {
    const visited = new Set<string>()
    const queue = [elementId]
    const result: EAElement[] = []
    while (queue.length) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      for (const rel of Object.values(s.project.relationships)) {
        if (rel.sourceId === current) {
          const el = s.project.elements[rel.targetId]
          if (el && !visited.has(el.id)) {
            result.push(el)
            queue.push(el.id)
          }
        }
      }
    }
    return result
  }
}

/** Cross-layer mappings: elements in targetLayer that have a relationship with elementId */
export function selectCrossLayerMappings(elementId: string, targetLayer: EALayer) {
  return (s: EAStore): EAElement[] => {
    const direct = selectDirectDependencies(elementId)(s)
    return direct
      .map((d) => d.element)
      .filter((el) => el.layer === targetLayer)
  }
}

/** Layer summary: element count per layer */
export function selectProjectLayerSummary(s: EAStore): Record<EALayer, number> {
  const counts: Partial<Record<EALayer, number>> = {}
  for (const el of Object.values(s.project.elements)) {
    counts[el.layer] = (counts[el.layer] ?? 0) + 1
  }
  return counts as Record<EALayer, number>
}

/** Elements with no relationships (orphans) */
export function selectOrphanElements(s: EAStore): EAElement[] {
  const connected = new Set<string>()
  for (const rel of Object.values(s.project.relationships)) {
    connected.add(rel.sourceId)
    connected.add(rel.targetId)
  }
  return Object.values(s.project.elements).filter((el) => !connected.has(el.id))
}

/** Detect simple cycles in the relationship graph (returns element ids in a cycle) */
export function selectCyclicDependencies(s: EAStore): string[][] {
  const cycles: string[][] = []
  const rels = Object.values(s.project.relationships)

  // Build adjacency list
  const adj: Record<string, string[]> = {}
  for (const rel of rels) {
    if (!adj[rel.sourceId]) adj[rel.sourceId] = []
    adj[rel.sourceId].push(rel.targetId)
  }

  const visited = new Set<string>()
  const stack = new Set<string>()
  const path: string[] = []

  function dfs(node: string) {
    if (stack.has(node)) {
      const idx = path.indexOf(node)
      if (idx !== -1) cycles.push(path.slice(idx))
      return
    }
    if (visited.has(node)) return
    visited.add(node)
    stack.add(node)
    path.push(node)
    for (const neighbor of adj[node] ?? []) {
      dfs(neighbor)
    }
    path.pop()
    stack.delete(node)
  }

  for (const id of Object.keys(adj)) {
    dfs(id)
  }
  return cycles
}
