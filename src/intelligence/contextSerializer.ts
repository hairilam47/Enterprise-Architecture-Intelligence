/**
 * Serializes the current eaStore state into a compact JSON context
 * for injection into the AI agent's prompt.
 */

import type { EAStore } from '../store/eaStore'
import { selectActiveView, selectPrimarySelection } from '../store/eaStore'
import { selectDirectDependencies, selectUpstreamChain, selectDownstreamChain } from '../store/eaSelectors'
import type { EALayer } from '../store/eaTypes'

export type SerializedContext = {
  selectedElement: {
    id: string
    name: string
    type: string
    layer: string
    description?: string
    status: string
  } | null
  directRelationships: {
    type: string
    direction: 'upstream' | 'downstream'
    element: { id: string; name: string; type: string; layer: string }
  }[]
  upstreamChain: { id: string; name: string; type: string; layer: string }[]
  downstreamChain: { id: string; name: string; type: string; layer: string }[]
  projectSummary: {
    name: string
    elementCountByLayer: Partial<Record<EALayer, number>>
    totalElements: number
    totalRelationships: number
  }
  currentView: {
    name: string
    type: string
    loS: number
  } | null
  recentElements: { id: string; name: string; type: string; layer: string }[]
}

export function serializeContext(store: EAStore): SerializedContext {
  const project = store.project
  const selected = selectPrimarySelection(store)
  const activeView = selectActiveView(store)

  const directDeps = selected
    ? selectDirectDependencies(selected.id)(store).map((d) => ({
        type: d.relationship.type,
        direction: d.direction,
        element: { id: d.element.id, name: d.element.name, type: d.element.type, layer: d.element.layer },
      }))
    : []

  const upstream = selected
    ? selectUpstreamChain(selected.id)(store).map((e) => ({ id: e.id, name: e.name, type: e.type, layer: e.layer }))
    : []

  const downstream = selected
    ? selectDownstreamChain(selected.id)(store).map((e) => ({ id: e.id, name: e.name, type: e.type, layer: e.layer }))
    : []

  const elementCountByLayer: Partial<Record<EALayer, number>> = {}
  for (const el of Object.values(project.elements)) {
    elementCountByLayer[el.layer] = (elementCountByLayer[el.layer] ?? 0) + 1
  }

  // Recent elements = last 5 updated
  const recentElements = Object.values(project.elements)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map((e) => ({ id: e.id, name: e.name, type: e.type, layer: e.layer }))

  return {
    selectedElement: selected
      ? {
          id: selected.id,
          name: selected.name,
          type: selected.type,
          layer: selected.layer,
          description: selected.description,
          status: selected.status,
        }
      : null,
    directRelationships: directDeps,
    upstreamChain: upstream,
    downstreamChain: downstream,
    projectSummary: {
      name: project.name,
      elementCountByLayer,
      totalElements: Object.keys(project.elements).length,
      totalRelationships: Object.keys(project.relationships).length,
    },
    currentView: activeView
      ? { name: activeView.name, type: activeView.type, loS: activeView.loS }
      : null,
    recentElements,
  }
}

/** Build the full prompt string to send to the AI */
export function buildAgentPrompt(systemPrompt: string, context: SerializedContext, userMessage: string): string {
  const contextBlock = JSON.stringify(context, null, 2)
  return `${systemPrompt}

---
## Current Model Context
\`\`\`json
${contextBlock}
\`\`\`

---
## User Message
${userMessage}`
}

/** Parse action commands from AI response and return structured actions */
export type AgentAction =
  | { type: 'createElement'; elementType: string; name: string; layer?: string }
  | { type: 'createRelationship'; relType: string; sourceId: string; targetId: string }
  | { type: 'highlightElements'; ids: string[] }
  | { type: 'runImpactAnalysis'; elementId: string }

export function parseAgentActions(response: string): AgentAction[] {
  const actions: AgentAction[] = []
  const actionRegex = /\[ACTION:(\w+)([^\]]*)\]/g
  let match: RegExpExecArray | null
  while ((match = actionRegex.exec(response)) !== null) {
    const actionName = match[1]
    const rawAttrs = match[2]
    const attrs: Record<string, string> = {}
    const attrRegex = /(\w+)="([^"]*)"/g
    let attr: RegExpExecArray | null
    while ((attr = attrRegex.exec(rawAttrs)) !== null) {
      attrs[attr[1]] = attr[2]
    }
    if (actionName === 'createElement') {
      actions.push({ type: 'createElement', elementType: attrs.type ?? 'ApplicationComponent', name: attrs.name ?? 'New Element', layer: attrs.layer })
    } else if (actionName === 'createRelationship') {
      actions.push({ type: 'createRelationship', relType: attrs.type ?? 'Association', sourceId: attrs.sourceId ?? '', targetId: attrs.targetId ?? '' })
    } else if (actionName === 'highlightElements') {
      actions.push({ type: 'highlightElements', ids: (attrs.ids ?? '').split(',').filter(Boolean) })
    } else if (actionName === 'runImpactAnalysis') {
      actions.push({ type: 'runImpactAnalysis', elementId: attrs.elementId ?? '' })
    }
  }
  return actions
}
