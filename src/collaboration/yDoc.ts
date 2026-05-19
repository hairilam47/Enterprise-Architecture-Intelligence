import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import type { EAElement, EARelationship } from '../store/eaTypes'

export interface YDocHandle {
  ydoc: Y.Doc
  provider: WebrtcProvider
  yElements: Y.Map<EAElement>
  yRelationships: Y.Map<EARelationship>
  destroy: () => void
}

export function createYDoc(projectId: string): YDocHandle {
  const ydoc = new Y.Doc()
  const provider = new WebrtcProvider(`ea-room-${projectId}`, ydoc, {
    signaling: ['wss://signaling.yjs.dev'],
  })
  const yElements = ydoc.getMap<EAElement>('elements')
  const yRelationships = ydoc.getMap<EARelationship>('relationships')

  function destroy() {
    provider.disconnect()
    provider.destroy()
    ydoc.destroy()
  }

  return { ydoc, provider, yElements, yRelationships, destroy }
}
