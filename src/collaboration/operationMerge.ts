import type { CollaborationOperation } from './conflictTypes'

export function sortOperationsForMerge(operations: CollaborationOperation[]) {
  return [...operations].sort((left, right) => {
    if (left.operation.logicalClock !== right.operation.logicalClock) {
      return left.operation.logicalClock - right.operation.logicalClock
    }
    if (left.operation.sessionId !== right.operation.sessionId) {
      return left.operation.sessionId.localeCompare(right.operation.sessionId)
    }
    return left.operation.operationId.localeCompare(right.operation.operationId)
  })
}

export function mergeOperations(existing: CollaborationOperation[], incoming: CollaborationOperation[]) {
  const byId = new Map([...existing, ...incoming].map((operation) => [operation.operation.operationId, operation]))
  return sortOperationsForMerge([...byId.values()])
}
