import { useEffect, useMemo, useRef, useState } from 'react'
import { getNetworkState, subscribeNetworkState, type NetworkState } from '../services/api/networkState'
import { createWorkspaceSyncService, type WorkspaceSyncSnapshot } from '../services/workspaceSyncService'
import type { WorkspaceService } from '../services/workspaceService'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'

type UseWorkspaceSyncOptions = {
  enabled?: boolean
  onSaved?: (document: WorkspaceDocument, savedAt?: string) => void | Promise<void>
  onUndo?: () => void
  onRedo?: () => void
}

export function useWorkspaceSync(
  document: WorkspaceDocument,
  workspaceService: WorkspaceService,
  { enabled = true, onSaved, onUndo, onRedo }: UseWorkspaceSyncOptions = {},
) {
  const [snapshot, setSnapshot] = useState<WorkspaceSyncSnapshot>(() => ({
    saveState: 'idle',
    runtime: { isDirty: false },
    retryCount: 0,
    inFlightVersion: 0,
    pendingVersion: 0,
  }))
  const [networkState, setNetworkState] = useState<NetworkState>(() => getNetworkState())
  const documentFingerprint = useMemo(() => JSON.stringify(document), [document])
  const lastQueuedFingerprint = useRef<string>()
  const initialFingerprint = useRef<string>()
  const latestDocument = useRef(document)
  const savedCallback = useRef(onSaved)
  const wasOnline = useRef(networkState.isOnline)

  useEffect(() => {
    latestDocument.current = document
    savedCallback.current = onSaved
  }, [document, onSaved])

  const syncService = useMemo(
    () =>
      createWorkspaceSyncService({
        save: async (nextDocument) => {
          const result = await workspaceService.saveWorkspace(nextDocument)
          if (result.ok && result.data) {
            await savedCallback.current?.(result.data.document, result.data.summary.savedAt)
          }
          return result
        },
      }),
    [workspaceService],
  )

  useEffect(() => syncService.subscribe(setSnapshot), [syncService])

  useEffect(() => () => syncService.dispose(), [syncService])

  useEffect(() => subscribeNetworkState(setNetworkState), [])

  useEffect(() => {
    if (!enabled) return
    if (!initialFingerprint.current) {
      initialFingerprint.current = documentFingerprint
      lastQueuedFingerprint.current = documentFingerprint
      return
    }
    if (documentFingerprint === lastQueuedFingerprint.current) return
    lastQueuedFingerprint.current = documentFingerprint
    syncService.enqueueSave(document)
  }, [document, documentFingerprint, enabled, syncService])

  useEffect(() => {
    const reconnected = !wasOnline.current && networkState.isOnline
    wasOnline.current = networkState.isOnline
    if (reconnected && snapshot.runtime.isDirty) {
      void syncService.saveNow(latestDocument.current)
    }
  }, [networkState.isOnline, snapshot.runtime.isDirty, syncService])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isModifier = event.metaKey || event.ctrlKey
      if (!isModifier) return

      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        void syncService.saveNow(latestDocument.current)
        return
      }
      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        onRedo?.()
        return
      }
      if (key === 'z') {
        event.preventDefault()
        onUndo?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRedo, onUndo, syncService])

  return {
    ...snapshot,
    isOnline: networkState.isOnline,
    saveNow: () => syncService.saveNow(latestDocument.current),
    markSynced: syncService.markSynced,
  }
}
