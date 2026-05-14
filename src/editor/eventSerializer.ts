import type { EditorEvent } from './editorEvents'

export function serializeEditorEvent(event: EditorEvent) {
  return JSON.stringify(event)
}

export function deserializeEditorEvent(json: string): EditorEvent {
  const parsed = JSON.parse(json) as EditorEvent
  if (!parsed.id || !parsed.type || typeof parsed.timestamp !== 'number') {
    throw new Error('Serialized editor event is invalid.')
  }
  return parsed
}

export function serializeEditorEvents(events: EditorEvent[]) {
  return JSON.stringify(events, null, 2)
}

export function deserializeEditorEvents(json: string): EditorEvent[] {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Serialized editor events must be an array.')
  return parsed.map((event) => {
    if (!event.id || !event.type || typeof event.timestamp !== 'number') {
      throw new Error('Serialized editor event is invalid.')
    }
    return event as EditorEvent
  })
}
