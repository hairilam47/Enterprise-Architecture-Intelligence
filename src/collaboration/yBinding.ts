import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { useEAStore } from '../store/eaStore'
import { createYDoc } from './yDoc'
import type { YDocHandle } from './yDoc'
import type { EAElement, EARelationship } from '../store/eaTypes'

export interface CollaborationState {
  active: boolean
  peers: number
}

/**
 * useCollaboration — bidirectional sync between eaStore and Yjs Y.Maps.
 *
 * Direction A (remote → local):  Y.Map observe → eaStore.updateElement / updateRelationship
 * Direction B (local → remote):  eaStore.subscribe → Y.Map.set / delete
 *
 * Guard flag `applying` prevents echo loops when a remote update triggers a
 * local store change which would otherwise re-broadcast to Yjs.
 */
export function useCollaboration(projectId: string | null): CollaborationState {
  const [state, setState] = useState<CollaborationState>({ active: false, peers: 0 })
  const handleRef = useRef<YDocHandle | null>(null)
  const applying = useRef(false)

  const updateElement = useEAStore((s) => s.updateElement)
  const removeElement = useEAStore((s) => s.removeElement)
  const updateRelationship = useEAStore((s) => s.updateRelationship)
  const removeRelationship = useEAStore((s) => s.removeRelationship)

  useEffect(() => {
    if (!projectId) return

    const handle = createYDoc(projectId)
    handleRef.current = handle
    setState({ active: true, peers: 0 })

    const { yElements, yRelationships, provider } = handle

    // ── Direction A: remote Yjs changes → eaStore ──────────────────────────
    const onElementsChange = (events: Y.YMapEvent<EAElement>[]) => {
      applying.current = true
      try {
        events.forEach((event) => {
          event.changes.keys.forEach((change, key) => {
            if (change.action === 'delete') {
              removeElement(key)
            } else {
              const el = yElements.get(key)
              if (el) updateElement(key, el)
            }
          })
        })
      } finally {
        applying.current = false
      }
    }

    const onRelationshipsChange = (events: Y.YMapEvent<EARelationship>[]) => {
      applying.current = true
      try {
        events.forEach((event) => {
          event.changes.keys.forEach((change, key) => {
            if (change.action === 'delete') {
              removeRelationship(key)
            } else {
              const rel = yRelationships.get(key)
              if (rel) updateRelationship(key, rel)
            }
          })
        })
      } finally {
        applying.current = false
      }
    }

    yElements.observeDeep(onElementsChange as Parameters<typeof yElements.observeDeep>[0])
    yRelationships.observeDeep(onRelationshipsChange as Parameters<typeof yRelationships.observeDeep>[0])

    // ── Direction B: local eaStore changes → Yjs ───────────────────────────
    const unsubscribe = useEAStore.subscribe(
      (s) => s.project,
      (project) => {
        if (applying.current) return
        handle.ydoc.transact(() => {
          Object.values(project.elements).forEach((el) => {
            const existing = yElements.get(el.id)
            if (!existing || existing.updatedAt !== el.updatedAt) {
              yElements.set(el.id, el)
            }
          })
          yElements.forEach((_, id) => {
            if (!project.elements[id]) yElements.delete(id)
          })

          Object.values(project.relationships).forEach((rel) => {
            const existing = yRelationships.get(rel.id)
            if (!existing || existing.createdAt !== rel.createdAt) {
              yRelationships.set(rel.id, rel)
            }
          })
          yRelationships.forEach((_, id) => {
            if (!project.relationships[id]) yRelationships.delete(id)
          })
        })
      },
    )

    // Track peer count
    const onPeers = () => {
      setState((s) => ({ ...s, peers: provider.awareness.getStates().size - 1 }))
    }
    provider.awareness.on('change', onPeers)

    return () => {
      yElements.unobserveDeep(onElementsChange as Parameters<typeof yElements.unobserveDeep>[0])
      yRelationships.unobserveDeep(onRelationshipsChange as Parameters<typeof yRelationships.unobserveDeep>[0])
      provider.awareness.off('change', onPeers)
      unsubscribe()
      handle.destroy()
      handleRef.current = null
      setState({ active: false, peers: 0 })
    }
  }, [projectId, updateElement, removeElement, updateRelationship, removeRelationship])

  return state
}
