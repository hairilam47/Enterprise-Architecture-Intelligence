import { describe, it, expect, beforeEach } from 'vitest'
import { useEAStore } from '../store/eaStore'
import { serializeContext, buildAgentPrompt, parseAgentActions } from '../intelligence/contextSerializer'

beforeEach(() => {
  useEAStore.getState().resetProject()
})

describe('serializeContext', () => {
  it('returns null selectedElement when nothing selected', () => {
    const store = useEAStore.getState()
    const ctx = serializeContext(store)
    expect(ctx.selectedElement).toBeNull()
  })

  it('serialises the selected element correctly', () => {
    const store = useEAStore.getState()
    const el = store.addElement('ApplicationComponent', 'CRM', { description: 'Core CRM system' })
    store.setSelection([el.id])
    const ctx = serializeContext(useEAStore.getState())
    expect(ctx.selectedElement).not.toBeNull()
    expect(ctx.selectedElement?.name).toBe('CRM')
    expect(ctx.selectedElement?.type).toBe('ApplicationComponent')
  })

  it('includes direct relationships', () => {
    const store = useEAStore.getState()
    const a = store.addElement('ApplicationComponent', 'App A')
    const b = store.addElement('DataObject', 'Data B')
    store.addRelationship('Access', a.id, b.id)
    store.setSelection([a.id])
    const ctx = serializeContext(useEAStore.getState())
    expect(ctx.directRelationships.length).toBeGreaterThan(0)
    expect(ctx.directRelationships[0].element.id).toBe(b.id)
  })

  it('provides project summary with element counts', () => {
    const store = useEAStore.getState()
    store.addElement('BusinessActor', 'Customer')
    store.addElement('ApplicationComponent', 'App')
    const ctx = serializeContext(useEAStore.getState())
    expect(ctx.projectSummary.totalElements).toBeGreaterThanOrEqual(2)
  })
})

describe('buildAgentPrompt', () => {
  it('includes system prompt, context, and user message', () => {
    const store = useEAStore.getState()
    const ctx = serializeContext(store)
    const prompt = buildAgentPrompt('SYS_PROMPT', ctx, 'What depends on CRM?')
    expect(prompt).toContain('SYS_PROMPT')
    expect(prompt).toContain('What depends on CRM?')
    expect(prompt).toContain('"totalElements"')
  })
})

describe('parseAgentActions', () => {
  it('parses createElement action', () => {
    const response = '[ACTION:createElement type="ApplicationComponent" name="New CRM" layer="Application"]'
    const actions = parseAgentActions(response)
    expect(actions).toHaveLength(1)
    expect(actions[0].type).toBe('createElement')
    if (actions[0].type === 'createElement') {
      expect(actions[0].name).toBe('New CRM')
      expect(actions[0].elementType).toBe('ApplicationComponent')
    }
  })

  it('parses highlightElements action', () => {
    const response = '[ACTION:highlightElements ids="id1,id2,id3"]'
    const actions = parseAgentActions(response)
    expect(actions[0].type).toBe('highlightElements')
    if (actions[0].type === 'highlightElements') {
      expect(actions[0].ids).toEqual(['id1', 'id2', 'id3'])
    }
  })

  it('returns empty array for no actions', () => {
    const actions = parseAgentActions('Just a regular response with no action blocks.')
    expect(actions).toHaveLength(0)
  })

  it('parses multiple actions', () => {
    const response = `
      [ACTION:createElement type="Node" name="App Server"]
      [ACTION:createRelationship type="Assignment" sourceId="node-1" targetId="app-1"]
    `
    const actions = parseAgentActions(response)
    expect(actions).toHaveLength(2)
  })
})
