import type { EAProject } from '../store/eaTypes'

// ── Result types ───────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info'

export type EAValidationIssue = {
  ruleId: string
  severity: ValidationSeverity
  message: string
  elementIds: string[]
  suggestion?: string
}

export type ValidationRule = {
  id: string
  name: string
  severity: ValidationSeverity
  check: (project: EAProject) => EAValidationIssue[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function rels(project: EAProject) {
  return Object.values(project.relationships)
}

function els(project: EAProject) {
  return Object.values(project.elements)
}

function relsBetweenLayers(project: EAProject, fromLayer: string, toLayer: string) {
  return rels(project).filter((r) => {
    const src = project.elements[r.sourceId]
    const tgt = project.elements[r.targetId]
    return src?.layer === fromLayer && tgt?.layer === toLayer
  })
}

function connectedIds(project: EAProject) {
  const ids = new Set<string>()
  for (const r of rels(project)) {
    ids.add(r.sourceId)
    ids.add(r.targetId)
  }
  return ids
}

// ── Rules ──────────────────────────────────────────────────────────────────

export const EA_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'no-presentation-to-db',
    name: 'Presentation skips to Data layer',
    severity: 'error',
    check(project) {
      const violations = relsBetweenLayers(project, 'Business', 'Application').filter((r) => {
        const tgt = project.elements[r.targetId]
        return tgt?.type === 'DataObject'
      })
      return violations.map((r) => ({
        ruleId: 'no-presentation-to-db',
        severity: 'error',
        message: `Business layer element directly accesses a Data Object — use an Application Service as intermediary.`,
        elementIds: [r.sourceId, r.targetId],
        suggestion: 'Add an ApplicationService between the BusinessProcess and DataObject.',
      }))
    },
  },

  {
    id: 'app-component-not-deployed',
    name: 'Application Component not assigned to any Node',
    severity: 'warning',
    check(project) {
      const assignedToNode = new Set<string>()
      for (const r of rels(project)) {
        const tgt = project.elements[r.targetId]
        if (r.type === 'Assignment' && tgt?.layer === 'Application') assignedToNode.add(r.targetId)
        if (r.type === 'Assignment' && project.elements[r.sourceId]?.layer === 'Technology') assignedToNode.add(r.targetId)
      }
      return els(project)
        .filter((el) => el.layer === 'Application' && el.type === 'ApplicationComponent' && !assignedToNode.has(el.id))
        .map((el) => ({
          ruleId: 'app-component-not-deployed',
          severity: 'warning',
          message: `Application Component "${el.name}" is not assigned to any Technology Node.`,
          elementIds: [el.id],
          suggestion: 'Create an Assignment relationship from a Node or Device to this component.',
        }))
    },
  },

  {
    id: 'service-not-realized',
    name: 'Service with no realizing component',
    severity: 'warning',
    check(project) {
      const realized = new Set<string>()
      for (const r of rels(project)) {
        if (r.type === 'Realization') realized.add(r.targetId)
      }
      return els(project)
        .filter((el) =>
          (el.type === 'BusinessService' || el.type === 'ApplicationService' || el.type === 'TechnologyService') &&
          !realized.has(el.id),
        )
        .map((el) => ({
          ruleId: 'service-not-realized',
          severity: 'warning',
          message: `Service "${el.name}" has no realizing component.`,
          elementIds: [el.id],
          suggestion: 'Create a Realization relationship from an ApplicationComponent or Process to this service.',
        }))
    },
  },

  {
    id: 'orphan-element',
    name: 'Element has no relationships',
    severity: 'info',
    check(project) {
      const connected = connectedIds(project)
      return els(project)
        .filter((el) => !connected.has(el.id))
        .map((el) => ({
          ruleId: 'orphan-element',
          severity: 'info',
          message: `Element "${el.name}" (${el.type}) has no relationships — it may be isolated.`,
          elementIds: [el.id],
        }))
    },
  },

  {
    id: 'circular-dependency',
    name: 'Circular dependency detected',
    severity: 'error',
    check(project) {
      const adj: Record<string, string[]> = {}
      for (const r of rels(project)) {
        if (!adj[r.sourceId]) adj[r.sourceId] = []
        adj[r.sourceId].push(r.targetId)
      }
      const visited = new Set<string>()
      const stack = new Set<string>()
      const cycles: string[][] = []

      function dfs(node: string, path: string[]) {
        if (stack.has(node)) {
          const idx = path.indexOf(node)
          if (idx !== -1) cycles.push(path.slice(idx))
          return
        }
        if (visited.has(node)) return
        visited.add(node)
        stack.add(node)
        path.push(node)
        for (const nb of adj[node] ?? []) dfs(nb, path)
        path.pop()
        stack.delete(node)
      }

      for (const id of Object.keys(adj)) dfs(id, [])

      return cycles.map((cycle) => ({
        ruleId: 'circular-dependency',
        severity: 'error',
        message: `Circular dependency: ${cycle.map((id) => project.elements[id]?.name ?? id).join(' → ')}`,
        elementIds: cycle,
        suggestion: 'Break the cycle by introducing an intermediary or reversing one relationship.',
      }))
    },
  },

  {
    id: 'cross-layer-skip',
    name: 'Relationship skips architecture layers',
    severity: 'warning',
    check(project) {
      const LAYER_IDX: Record<string, number> = {
        Motivation: 0, Strategy: 1, Business: 2, Application: 3, Technology: 4, Physical: 5, Implementation: 6,
      }
      const SKIP_THRESHOLD = 2
      return rels(project)
        .filter((r) => {
          const src = project.elements[r.sourceId]
          const tgt = project.elements[r.targetId]
          if (!src || !tgt) return false
          const si = LAYER_IDX[src.layer] ?? -1
          const ti = LAYER_IDX[tgt.layer] ?? -1
          return Math.abs(si - ti) >= SKIP_THRESHOLD
        })
        .map((r) => {
          const src = project.elements[r.sourceId]
          const tgt = project.elements[r.targetId]
          return {
            ruleId: 'cross-layer-skip',
            severity: 'warning',
            message: `Relationship from "${src?.name}" (${src?.layer}) to "${tgt?.name}" (${tgt?.layer}) skips architecture layers.`,
            elementIds: [r.sourceId, r.targetId],
            suggestion: 'Consider adding intermediate elements in the skipped layers to improve traceability.',
          }
        })
    },
  },
]

// ── Runner ─────────────────────────────────────────────────────────────────

export function runValidation(project: EAProject): EAValidationIssue[] {
  return EA_VALIDATION_RULES.flatMap((rule) => {
    try {
      return rule.check(project)
    } catch {
      return []
    }
  })
}
