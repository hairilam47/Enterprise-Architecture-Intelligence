export type ApiErrorType =
  | 'validation_error'
  | 'storage_error'
  | 'schema_error'
  | 'network_error'
  | 'permission_error'
  | 'not_found'
  | 'unknown_error'

export type ApiErrorPayload = {
  type: ApiErrorType
  message: string
  status?: number
  details?: string[]
  retryable: boolean
  cause?: unknown
}

export type ApiErrorBody = {
  error?: {
    type?: ApiErrorType
    message?: string
    details?: string[]
  }
  warnings?: string[]
}

export class ApiError extends Error {
  payload: ApiErrorPayload

  constructor(payload: ApiErrorPayload) {
    super(payload.message)
    this.name = 'ApiError'
    this.payload = payload
  }
}

export function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status === 500 || status === 503
}

export function isNonRetryableStatus(status: number) {
  return status === 400 || status === 401 || status === 404
}

export function mapStatusToApiErrorType(status: number): ApiErrorType {
  if (status === 400) return 'validation_error'
  if (status === 401 || status === 403) return 'permission_error'
  if (status === 404) return 'not_found'
  if (status >= 500) return 'storage_error'
  return 'unknown_error'
}

export function createApiError(
  type: ApiErrorType,
  message: string,
  options: { status?: number; details?: string[]; retryable?: boolean; cause?: unknown } = {},
) {
  return new ApiError({
    type,
    message,
    status: options.status,
    details: options.details,
    retryable: options.retryable ?? (options.status ? isRetryableStatus(options.status) : type === 'network_error'),
    cause: options.cause,
  })
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof TypeError) {
    return createApiError('network_error', 'Network request failed.', { retryable: true, cause: error })
  }
  if (error instanceof Error) {
    return createApiError('unknown_error', error.message, { retryable: false, cause: error })
  }
  return createApiError('unknown_error', 'Unexpected API error.', { retryable: false, cause: error })
}
