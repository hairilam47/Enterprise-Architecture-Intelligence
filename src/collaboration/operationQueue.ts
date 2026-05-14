import type { CollaborationOperation } from './conflictTypes'

export type OperationQueueState = {
  pending: CollaborationOperation[]
  merged: CollaborationOperation[]
}

export function createOperationQueue(): OperationQueueState {
  return { pending: [], merged: [] }
}

export function enqueueOperation(queue: OperationQueueState, operation: CollaborationOperation): OperationQueueState {
  return { ...queue, pending: [...queue.pending, operation] }
}

export function dequeueOperations(queue: OperationQueueState, batchSize = 25) {
  return {
    batch: queue.pending.slice(0, batchSize),
    queue: { ...queue, pending: queue.pending.slice(batchSize) },
  }
}
