import { describe, it, expect, beforeEach } from 'vitest'
import { useEAStore } from '../store/eaStore'
import { selectUpstreamChain, selectDownstreamChain, selectDirectDependencies, selectCyclicDependencies } from '../store/eaSelectors'

beforeEach(() => {
  useEAStore.getState().resetProject()
})

describe('selectDirectDependencies', () => {
  it('returns upstream and downstream direct relationships', () => {
    const store = useEAStore.getState()
    const a = store.addElement('ApplicationComponent', 'A')
    const b = store.addElement('DataObject', 'B')
    const c = store.addElement('Node', 'C')
    store.addRelationship('Access', a.id, b.id)
    store.addRelationship('Assignment', c.id, a.id)

    const state = useEAStore.getState()
    const deps = selectDirectDependencies(a.id)(state)

    const downIds = deps.filter((d) => d.direction === 'downstream').map((d) => d.element.id)
    const upIds = deps.filter((d) => d.direction === 'upstream').map((d) => d.element.id)
    expect(downIds).toContain(b.id)
    expect(upIds).toContain(c.id)
  })
})

describe('selectUpstreamChain', () => {
  it('returns all transitive upstream elements', () => {
    const store = useEAStore.getState()
    const a = store.addElement('BusinessProcess', 'A')
    const b = store.addElement('BusinessActor', 'B')
    const c = store.addElement('Stakeholder', 'C')
    // C → B → A (C and B are upstream of A)
    store.addRelationship('Association', c.id, b.id)
    store.addRelationship('Association', b.id, a.id)

    const state = useEAStore.getState()
    const upstream = selectUpstreamChain(a.id)(state)
    const ids = upstream.map((e) => e.id)
    expect(ids).toContain(b.id)
    expect(ids).toContain(c.id)
  })
})

describe('selectDownstreamChain', () => {
  it('returns all transitive downstream elements', () => {
    const store = useEAStore.getState()
    const crm = store.addElement('ApplicationComponent', 'CRM')
    const db = store.addElement('DataObject', 'CustomerDB')
    const archive = store.addElement('DataObject', 'Archive')
    store.addRelationship('Access', crm.id, db.id)
    store.addRelationship('Flow', db.id, archive.id)

    const state = useEAStore.getState()
    const downstream = selectDownstreamChain(crm.id)(state)
    const ids = downstream.map((e) => e.id)
    expect(ids).toContain(db.id)
    expect(ids).toContain(archive.id)
  })
})

describe('selectCyclicDependencies', () => {
  it('detects a cycle', () => {
    const store = useEAStore.getState()
    const a = store.addElement('ApplicationComponent', 'A')
    const b = store.addElement('ApplicationComponent', 'B')
    store.addRelationship('Serving', a.id, b.id)
    store.addRelationship('Serving', b.id, a.id)

    const cycles = selectCyclicDependencies(useEAStore.getState())
    expect(cycles.length).toBeGreaterThan(0)
  })

  it('returns empty for a clean DAG', () => {
    const store = useEAStore.getState()
    const a = store.addElement('BusinessProcess', 'A')
    const b = store.addElement('BusinessService', 'B')
    const c = store.addElement('ApplicationComponent', 'C')
    store.addRelationship('Realization', c.id, b.id)
    store.addRelationship('Serving', b.id, a.id)

    const cycles = selectCyclicDependencies(useEAStore.getState())
    expect(cycles).toHaveLength(0)
  })
})
