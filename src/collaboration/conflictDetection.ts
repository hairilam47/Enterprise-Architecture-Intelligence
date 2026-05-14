import type { CollaborationConflict, CollaborationOperation } from './conflictTypes'

export function detectOperationConflicts(operations: CollaborationOperation[]): CollaborationConflict[] {
  const conflicts: CollaborationConflict[] = []
  const byPath = new Map<string, CollaborationOperation>()
  operations.forEach((operation) => {
    if (operation.operation.logicalClock < 0) {
      conflicts.push(createConflict('invalid_logical_clock', 'error', 'Operation has invalid logical clock.', [operation.operation.operationId]))
    }
    const path = `${operation.type}:${operation.payload?.entityId ?? operation.payload?.relationshipId ?? operation.payload?.layer ?? operation.after.workspaceId}`
    const previous = byPath.get(path)
    if (previous && previous.operation.sessionId !== operation.operation.sessionId && previous.operation.logicalClock === operation.operation.logicalClock) {
      conflicts.push(createConflict('overlapping_mutation', 'warning', `Concurrent mutation on ${path}.`, [previous.operation.operationId, operation.operation.operationId]))
    }
    byPath.set(path, operation)
  })
  return conflicts
}

function createConflict(type: CollaborationConflict['type'], severity: CollaborationConflict['severity'], message: string, operationIds: string[]): CollaborationConflict {
  return { id: `collab-conflict:${crypto.randomUUID()}`, type, severity, message, operationIds }
}
