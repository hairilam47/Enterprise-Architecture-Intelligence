import { cloneWorkspaceDocument, deserializeWorkspace, serializeWorkspace } from './workspaceSerializer'
import type { WorkspaceDocument } from './workspaceDocument'

const INDEX_KEY = 'eia.workspace.index'
const DOCUMENT_PREFIX = 'eia.workspace.document.'

export type SavedWorkspaceSummary = {
  workspaceId: string
  name: string
  description: string
  schemaVersion: number
  version: number
  updatedAt: string
  savedAt?: string
}

function getStorage() {
  if (typeof window === 'undefined') return undefined
  return window.localStorage
}

function readIndex(): SavedWorkspaceSummary[] {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(INDEX_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeIndex(index: SavedWorkspaceSummary[]) {
  getStorage()?.setItem(INDEX_KEY, JSON.stringify(index, null, 2))
}

function toSummary(document: WorkspaceDocument): SavedWorkspaceSummary {
  return {
    workspaceId: document.workspaceId,
    name: document.name,
    description: document.description,
    schemaVersion: document.schemaVersion,
    version: document.version,
    updatedAt: document.updatedAt,
    savedAt: document.metadata.savedAt,
  }
}

export function saveWorkspace(document: WorkspaceDocument): SavedWorkspaceSummary {
  const storage = getStorage()
  if (!storage) throw new Error('localStorage is not available in this browser context.')

  const savedAt = new Date().toISOString()
  const documentToSave: WorkspaceDocument = {
    ...structuredClone(document),
    version: Math.max(1, document.version),
    updatedAt: savedAt,
    metadata: {
      ...document.metadata,
      source: 'localStorage',
      savedAt,
    },
  }
  const summary = toSummary(documentToSave)
  const nextIndex = [summary, ...readIndex().filter((item) => item.workspaceId !== document.workspaceId)]

  storage.setItem(`${DOCUMENT_PREFIX}${document.workspaceId}`, serializeWorkspace(documentToSave))
  writeIndex(nextIndex)

  return summary
}

export function loadWorkspace(workspaceId: string) {
  const raw = getStorage()?.getItem(`${DOCUMENT_PREFIX}${workspaceId}`)
  if (!raw) return { document: undefined, errors: ['Saved workspace was not found.'], warnings: [] }
  return deserializeWorkspace(raw)
}

export function listSavedWorkspaces(): SavedWorkspaceSummary[] {
  return readIndex()
}

export function deleteWorkspace(workspaceId: string) {
  getStorage()?.removeItem(`${DOCUMENT_PREFIX}${workspaceId}`)
  writeIndex(readIndex().filter((item) => item.workspaceId !== workspaceId))
}

export function duplicateWorkspace(workspaceId: string) {
  const loaded = loadWorkspace(workspaceId)
  if (!loaded.document) return loaded
  const duplicate = cloneWorkspaceDocument(loaded.document)
  const summary = saveWorkspace(duplicate)
  return { document: duplicate, summary, errors: [], warnings: loaded.warnings }
}
