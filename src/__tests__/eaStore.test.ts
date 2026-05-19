import { describe, it, expect, beforeEach } from 'vitest'
import { useEAStore } from '../store/eaStore'

function freshStore() {
  useEAStore.getState().resetProject()
  return useEAStore.getState()
}

describe('eaStore — element CRUD', () => {
  beforeEach(() => freshStore())

  it('adds an element to the project', () => {
    const store = useEAStore.getState()
    const el = store.addElement('ApplicationComponent', 'CRM App')
    expect(useEAStore.getState().project.elements[el.id]).toBeDefined()
    expect(useEAStore.getState().project.elements[el.id].name).toBe('CRM App')
  })

  it('removes an element and its relationships', () => {
    const store = useEAStore.getState()
    const a = store.addElement('ApplicationComponent', 'A')
    const b = store.addElement('Node', 'B')
    store.addRelationship('Assignment', b.id, a.id)
    store.removeElement(a.id)
    const state = useEAStore.getState().project
    expect(state.elements[a.id]).toBeUndefined()
    expect(Object.values(state.relationships).every((r) => r.sourceId !== a.id && r.targetId !== a.id)).toBe(true)
  })

  it('updates element name', () => {
    const store = useEAStore.getState()
    const el = store.addElement('BusinessActor', 'Old Name')
    store.updateElement(el.id, { name: 'New Name' })
    expect(useEAStore.getState().project.elements[el.id].name).toBe('New Name')
  })
})

describe('eaStore — undo / redo', () => {
  beforeEach(() => freshStore())

  it('undo removes a freshly added element', () => {
    const store = useEAStore.getState()
    const el = store.addElement('DataObject', 'Temp')
    expect(useEAStore.getState().project.elements[el.id]).toBeDefined()
    useEAStore.getState().undo()
    expect(useEAStore.getState().project.elements[el.id]).toBeUndefined()
  })

  it('redo re-applies the undone action', () => {
    const store = useEAStore.getState()
    const el = store.addElement('DataObject', 'Temp')
    useEAStore.getState().undo()
    useEAStore.getState().redo()
    expect(useEAStore.getState().project.elements[el.id]).toBeDefined()
  })
})

describe('eaStore — relationships', () => {
  beforeEach(() => freshStore())

  it('adds a relationship between two elements', () => {
    const store = useEAStore.getState()
    const src = store.addElement('ApplicationComponent', 'Source')
    const tgt = store.addElement('DataObject', 'Target')
    const rel = store.addRelationship('Access', src.id, tgt.id)
    expect(useEAStore.getState().project.relationships[rel.id]).toBeDefined()
    expect(useEAStore.getState().project.relationships[rel.id].type).toBe('Access')
  })

  it('removes a relationship', () => {
    const store = useEAStore.getState()
    const a = store.addElement('BusinessProcess', 'A')
    const b = store.addElement('BusinessService', 'B')
    const rel = store.addRelationship('Realization', a.id, b.id)
    store.removeRelationship(rel.id)
    expect(useEAStore.getState().project.relationships[rel.id]).toBeUndefined()
  })
})

describe('eaStore — selection', () => {
  beforeEach(() => freshStore())

  it('sets and clears selection', () => {
    const store = useEAStore.getState()
    const el = store.addElement('BusinessActor', 'User')
    store.setSelection([el.id])
    expect(useEAStore.getState().project.selectedElementIds).toContain(el.id)
    store.clearSelection()
    expect(useEAStore.getState().project.selectedElementIds).toHaveLength(0)
  })
})

describe('eaStore — views', () => {
  beforeEach(() => freshStore())

  it('adds a view and sets it as active', () => {
    const store = useEAStore.getState()
    const view = store.addView('Application View', 'Canvas', 2)
    store.setActiveView(view.id)
    expect(useEAStore.getState().project.activeViewId).toBe(view.id)
  })

  it('removes a view and resets activeViewId', () => {
    const store = useEAStore.getState()
    store.addView('V1')
    const v2 = store.addView('V2')
    store.setActiveView(v2.id)
    store.removeView(v2.id)
    const { activeViewId, views } = useEAStore.getState().project
    expect(views.find((v) => v.id === v2.id)).toBeUndefined()
    expect(activeViewId).not.toBe(v2.id)
  })
})
