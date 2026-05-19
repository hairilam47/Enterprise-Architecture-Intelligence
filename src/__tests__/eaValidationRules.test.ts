import { describe, it, expect } from 'vitest'
import { runValidation } from '../validation/eaValidationRules'
import type { EAProject, EAElement, EARelationship } from '../store/eaTypes'

function makeProject(
  elements: EAElement[],
  relationships: EARelationship[] = [],
): EAProject {
  return {
    id: 'test',
    name: 'Test Project',
    elements: Object.fromEntries(elements.map((e) => [e.id, e])),
    relationships: Object.fromEntries(relationships.map((r) => [r.id, r])),
    views: [],
    activeViewId: null,
    selectedElementIds: [],
    selectedRelationshipId: null,
    highlightedElementIds: [],
    version: 1,
    createdAt: '',
    updatedAt: '',
  }
}

function el(id: string, type: EAElement['type'], layer: EAElement['layer']): EAElement {
  return {
    id,
    type,
    name: id,
    layer,
    status: 'Active',
    properties: {},
    positions: {},
    sizes: {},
    viewIds: [],
    createdAt: '',
    updatedAt: '',
  }
}

function rel(id: string, type: EARelationship['type'], sourceId: string, targetId: string): EARelationship {
  return { id, type, sourceId, targetId, properties: {}, createdAt: '' }
}

describe('eaValidationRules — orphan-element', () => {
  it('flags elements with no relationships', () => {
    const p = makeProject([el('a', 'ApplicationComponent', 'Application')])
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'orphan-element' && i.elementIds.includes('a'))).toBe(true)
  })

  it('does not flag connected elements', () => {
    const p = makeProject(
      [el('a', 'ApplicationComponent', 'Application'), el('b', 'DataObject', 'Application')],
      [rel('r1', 'Access', 'a', 'b')],
    )
    const issues = runValidation(p)
    expect(issues.filter((i) => i.ruleId === 'orphan-element')).toHaveLength(0)
  })
})

describe('eaValidationRules — app-component-not-deployed', () => {
  it('flags ApplicationComponent with no Node assignment', () => {
    const p = makeProject([
      el('app', 'ApplicationComponent', 'Application'),
      el('svc', 'BusinessService', 'Business'),
    ], [rel('r1', 'Association', 'svc', 'app')])
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'app-component-not-deployed' && i.elementIds.includes('app'))).toBe(true)
  })

  it('does not flag when node assigns to app component', () => {
    const p = makeProject(
      [el('app', 'ApplicationComponent', 'Application'), el('node', 'Node', 'Technology')],
      [rel('r1', 'Assignment', 'node', 'app')],
    )
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'app-component-not-deployed')).toBe(false)
  })
})

describe('eaValidationRules — service-not-realized', () => {
  it('flags BusinessService with no Realization', () => {
    const p = makeProject([el('svc', 'BusinessService', 'Business'), el('other', 'BusinessActor', 'Business')], [rel('r1', 'Association', 'other', 'svc')])
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'service-not-realized' && i.elementIds.includes('svc'))).toBe(true)
  })

  it('does not flag realized service', () => {
    const p = makeProject(
      [el('svc', 'BusinessService', 'Business'), el('proc', 'BusinessProcess', 'Business')],
      [rel('r1', 'Realization', 'proc', 'svc')],
    )
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'service-not-realized')).toBe(false)
  })
})

describe('eaValidationRules — circular-dependency', () => {
  it('detects a direct cycle (A→B→A)', () => {
    const p = makeProject(
      [el('a', 'ApplicationComponent', 'Application'), el('b', 'ApplicationComponent', 'Application')],
      [rel('r1', 'Serving', 'a', 'b'), rel('r2', 'Serving', 'b', 'a')],
    )
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'circular-dependency')).toBe(true)
  })

  it('does not flag a DAG', () => {
    const p = makeProject(
      [el('a', 'ApplicationComponent', 'Application'), el('b', 'DataObject', 'Application'), el('c', 'Node', 'Technology')],
      [rel('r1', 'Access', 'a', 'b'), rel('r2', 'Assignment', 'c', 'a')],
    )
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'circular-dependency')).toBe(false)
  })
})

describe('eaValidationRules — cross-layer-skip', () => {
  it('flags relationship skipping 2+ layers', () => {
    const p = makeProject(
      [el('actor', 'BusinessActor', 'Business'), el('node', 'Node', 'Technology')],
      [rel('r1', 'Association', 'actor', 'node')],
    )
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'cross-layer-skip')).toBe(true)
  })

  it('does not flag adjacent layer relationship', () => {
    const p = makeProject(
      [el('app', 'ApplicationComponent', 'Application'), el('node', 'Node', 'Technology')],
      [rel('r1', 'Assignment', 'node', 'app')],
    )
    const issues = runValidation(p)
    expect(issues.some((i) => i.ruleId === 'cross-layer-skip')).toBe(false)
  })
})
