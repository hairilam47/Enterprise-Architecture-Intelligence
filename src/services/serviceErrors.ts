export type ServiceErrorType =
  | 'validation_error'
  | 'storage_error'
  | 'schema_error'
  | 'network_error'
  | 'permission_error'
  | 'not_found'
  | 'unknown_error'

export type ServiceError = {
  type: ServiceErrorType
  message: string
  details?: string[]
  cause?: unknown
}

export function createServiceError(type: ServiceErrorType, message: string, details: string[] = [], cause?: unknown): ServiceError {
  return { type, message, details, cause }
}

export function normalizeServiceError(error: unknown): ServiceError {
  if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
    return error as ServiceError
  }

  if (error instanceof Error) {
    return createServiceError('unknown_error', error.message, [], error)
  }

  return createServiceError('unknown_error', 'Unexpected service error.', [], error)
}
