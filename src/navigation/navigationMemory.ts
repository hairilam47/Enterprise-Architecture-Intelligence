import type { DomainEntityKind } from '../domain/domainTypes'
import type { WorkspaceMode } from '../modes/WorkspaceModeSwitcher'

export type WorkspaceViewId = 'architecture' | 'domain' | 'graph' | 'traceability' | 'composition'

export type NavigationMemoryState = {
  mode: WorkspaceMode
  view: WorkspaceViewId
  graphView: 'd3' | 'three'
  domainKind: DomainEntityKind
  selectedEntityId?: string
  recentQueries: string[]
}

const storageKey = 'ea-studio:navigation-memory'

export function loadNavigationMemory(): Partial<NavigationMemoryState> {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? JSON.parse(raw) as Partial<NavigationMemoryState> : {}
  } catch {
    return {}
  }
}

export function saveNavigationMemory(memory: NavigationMemoryState) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(memory))
  } catch {
    // Navigation memory is optional and should never block editing.
  }
}

export function pushRecentQuery(current: string[], query: string) {
  const normalized = query.trim()
  if (!normalized) return current
  return [normalized, ...current.filter((item) => item !== normalized)].slice(0, 8)
}
