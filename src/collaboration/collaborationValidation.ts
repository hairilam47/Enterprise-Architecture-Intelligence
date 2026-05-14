import type { CollaborationOperation } from './conflictTypes'
import { detectOperationConflicts } from './conflictDetection'
import { sortOperationsForMerge } from './operationMerge'

export type CollaborationValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateCollaborationDeterminism(operations: CollaborationOperation[]): CollaborationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const sorted = sortOperationsForMerge(operations)
  sorted.forEach((operation, index) => {
    if (index > 0 && sorted[index - 1].operation.logicalClock > operation.operation.logicalClock) {
      errors.push(`Operation ${operation.id} is out of merge order.`)
    }
    if (!operation.operation.sessionId) errors.push(`Operation ${operation.id} is missing sessionId.`)
    if (!operation.operation.operationId) errors.push(`Operation ${operation.id} is missing operationId.`)
  })
  detectOperationConflicts(sorted).forEach((conflict) => {
    if (conflict.severity === 'error') errors.push(conflict.message)
    else warnings.push(conflict.message)
  })
  return { valid: errors.length === 0, errors, warnings }
}
