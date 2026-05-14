import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { SaveWorkspaceResponse, ServiceResult } from './workspaceApiTypes'
import { debounce } from '../utils/debounce'

export type WorkspaceSaveState = 'idle' | 'saving' | 'synced' | 'error'

export type WorkspaceRuntimeState = {
  isDirty: boolean
  lastSavedAt?: string
  lastModifiedAt?: string
  saveError?: string
}

export type WorkspaceSyncSnapshot = {
  saveState: WorkspaceSaveState
  runtime: WorkspaceRuntimeState
  retryCount: number
  inFlightVersion: number
  pendingVersion: number
}

export type WorkspaceSyncService = {
  enqueueSave: (document: WorkspaceDocument) => void
  saveNow: (document?: WorkspaceDocument) => Promise<ServiceResult<SaveWorkspaceResponse> | undefined>
  markDirty: () => void
  markSynced: (savedAt?: string) => void
  subscribe: (listener: (snapshot: WorkspaceSyncSnapshot) => void) => () => void
  getSnapshot: () => WorkspaceSyncSnapshot
  dispose: () => void
}

type WorkspaceSyncServiceOptions = {
  debounceMs?: number
  retryDelayMs?: number
  maxRetryDelayMs?: number
  save: (document: WorkspaceDocument) => Promise<ServiceResult<SaveWorkspaceResponse>>
}

export function createWorkspaceSyncService({
  debounceMs = 1500,
  retryDelayMs = 2500,
  maxRetryDelayMs = 15000,
  save,
}: WorkspaceSyncServiceOptions): WorkspaceSyncService {
  let latestDocument: WorkspaceDocument | undefined
  let pendingDocument: WorkspaceDocument | undefined
  let saveState: WorkspaceSaveState = 'idle'
  let runtime: WorkspaceRuntimeState = { isDirty: false }
  let inFlight = false
  let saveSequence = 0
  let inFlightVersion = 0
  let pendingVersion = 0
  let retryCount = 0
  let retryTimeoutId: number | undefined
  const listeners = new Set<(snapshot: WorkspaceSyncSnapshot) => void>()

  function getSnapshot(): WorkspaceSyncSnapshot {
    return {
      saveState,
      runtime: { ...runtime },
      retryCount,
      inFlightVersion,
      pendingVersion,
    }
  }

  function emit() {
    const snapshot = getSnapshot()
    listeners.forEach((listener) => listener(snapshot))
  }

  function clearRetry() {
    if (retryTimeoutId !== undefined) {
      window.clearTimeout(retryTimeoutId)
      retryTimeoutId = undefined
    }
  }

  async function drainQueue(): Promise<ServiceResult<SaveWorkspaceResponse> | undefined> {
    if (inFlight) return undefined
    const document = pendingDocument ?? latestDocument
    if (!document) return undefined

    pendingDocument = undefined
    inFlight = true
    saveState = 'saving'
    inFlightVersion = ++saveSequence
    emit()

    const result = await save(document)
    inFlight = false

    if (pendingDocument) {
      return drainQueue()
    }

    if (result.ok && result.data) {
      retryCount = 0
      runtime = {
        isDirty: false,
        lastSavedAt: result.data.summary.savedAt ?? new Date().toISOString(),
        lastModifiedAt: runtime.lastModifiedAt,
      }
      saveState = 'synced'
      clearRetry()
    } else {
      runtime = {
        ...runtime,
        isDirty: true,
        saveError: result.error?.message ?? 'Workspace save failed.',
      }
      saveState = 'error'
      scheduleRetry()
    }

    emit()
    return result
  }

  function scheduleRetry() {
    if (!latestDocument || retryTimeoutId !== undefined) return
    const delay = Math.min(maxRetryDelayMs, retryDelayMs * 2 ** retryCount)
    retryCount += 1
    retryTimeoutId = window.setTimeout(() => {
      retryTimeoutId = undefined
      if (latestDocument) {
        pendingDocument = latestDocument
        void drainQueue()
      }
    }, delay)
  }

  const debouncedDrain = debounce(() => {
    void drainQueue()
  }, debounceMs)

  function markDirty() {
    runtime = {
      ...runtime,
      isDirty: true,
      lastModifiedAt: new Date().toISOString(),
      saveError: undefined,
    }
    if (saveState === 'synced' || saveState === 'idle') saveState = 'idle'
    emit()
  }

  return {
    enqueueSave(document) {
      latestDocument = structuredClone(document)
      pendingDocument = latestDocument
      pendingVersion += 1
      markDirty()
      debouncedDrain()
    },

    async saveNow(document) {
      if (document) {
        latestDocument = structuredClone(document)
        pendingDocument = latestDocument
        pendingVersion += 1
      }
      debouncedDrain.cancel()
      return drainQueue()
    },

    markDirty,

    markSynced(savedAt) {
      runtime = { isDirty: false, lastSavedAt: savedAt ?? new Date().toISOString(), lastModifiedAt: runtime.lastModifiedAt }
      saveState = 'synced'
      retryCount = 0
      clearRetry()
      emit()
    },

    subscribe(listener) {
      listeners.add(listener)
      listener(getSnapshot())
      return () => listeners.delete(listener)
    },

    getSnapshot,

    dispose() {
      debouncedDrain.cancel()
      clearRetry()
      listeners.clear()
    },
  }
}
