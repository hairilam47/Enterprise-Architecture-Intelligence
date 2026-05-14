import { createApiError, isNonRetryableStatus, isRetryableStatus, mapStatusToApiErrorType, normalizeApiError } from './apiError'

export type RetryFetchOptions = RequestInit & {
  retries?: number
  baseDelayMs?: number
  maxDelayMs?: number
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number) {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
  const jitter = Math.floor(Math.random() * Math.min(120, exponential))
  return exponential + jitter
}

export async function retryFetch(input: RequestInfo | URL, options: RetryFetchOptions = {}) {
  const { retries = 3, baseDelayMs = 350, maxDelayMs = 5000, ...init } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init)
      if (response.ok || isNonRetryableStatus(response.status)) return response

      if (!isRetryableStatus(response.status) || attempt === retries) {
        return response
      }

      await delay(backoffDelay(attempt, baseDelayMs, maxDelayMs))
    } catch (error) {
      lastError = error
      if (attempt === retries) {
        throw normalizeApiError(error)
      }
      await delay(backoffDelay(attempt, baseDelayMs, maxDelayMs))
    }
  }

  throw createApiError('network_error', 'Network request failed after retries.', {
    retryable: true,
    cause: lastError,
  })
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  return (text ? JSON.parse(text) : {}) as T
}

export function apiErrorFromResponse(response: Response, body: { error?: { message?: string; details?: string[]; type?: string } }) {
  return createApiError(mapStatusToApiErrorType(response.status), body.error?.message ?? `API request failed with ${response.status}.`, {
    status: response.status,
    details: body.error?.details,
    retryable: isRetryableStatus(response.status),
  })
}
