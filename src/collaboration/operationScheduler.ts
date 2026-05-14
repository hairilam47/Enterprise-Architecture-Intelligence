import { dequeueOperations, type OperationQueueState } from './operationQueue'
import { mergeOperations } from './operationMerge'

export function scheduleOperationMerge(queue: OperationQueueState, batchSize = 25): OperationQueueState {
  const { batch, queue: nextQueue } = dequeueOperations(queue, batchSize)
  return {
    pending: nextQueue.pending,
    merged: mergeOperations(queue.merged, batch),
  }
}
