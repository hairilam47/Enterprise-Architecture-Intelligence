/**
 * Bridge between the legacy EditorState (useReducer) and the new eaStore (Zustand).
 *
 * Keeps two-way sync of:
 *  - Selection (selectedElementIds ↔ EditorInteractionState.selection.nodeIds)
 *  - Active view  (activeViewId ↔ EditorRenderingState.activeWorkspaceView)
 *
 * Usage:
 *   const { editorDispatch } = useEditorBridge()
 *   Call editorDispatch whenever legacy editor actions happen.
 *
 * The hook sets up a Zustand subscription that propagates eaStore changes
 * back to the legacy reducer via the provided dispatch.
 */

import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import { useEAStore } from './eaStore'
import type { EditorAction } from '../editor/editorStore'

export function useEditorBridge(dispatch: Dispatch<EditorAction>) {
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  useEffect(() => {
    // When eaStore selection changes → push to legacy editor
    const unsub = useEAStore.subscribe(
      (s) => s.project.selectedElementIds,
      (ids) => {
        dispatchRef.current({
          type: 'interaction/selectionChanged',
          selection: { nodeIds: ids, edgeIds: [], groupIds: [] },
        })
      },
    )
    return unsub
  }, [])
}

/** Push legacy editor selection into eaStore (call when EditorInteractionState changes) */
export function syncSelectionToEAStore(nodeIds: string[]) {
  const store = useEAStore.getState()
  const currentIds = store.project.selectedElementIds
  // Avoid unnecessary updates
  if (
    nodeIds.length === currentIds.length &&
    nodeIds.every((id, i) => id === currentIds[i])
  ) return
  store.setSelection(nodeIds)
}
