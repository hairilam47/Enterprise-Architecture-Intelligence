import { cloneWorkspaceDocument } from '../workspace/workspaceSerializer'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import { createServiceError } from './serviceErrors'
import { apiErrorFromResponse, parseJsonResponse, retryFetch } from './api/retryFetch'
import { serviceFail, serviceOk, type WorkspaceRepository } from './workspaceRepository'
import type {
  CreateWorkspaceResponse,
  DeleteWorkspaceResponse,
  DuplicateWorkspaceResponse,
  ExportWorkspaceResponse,
  ImportWorkspaceResponse,
  ListWorkspacesResponse,
  LoadWorkspaceResponse,
  SaveWorkspaceResponse,
} from './workspaceApiTypes'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8787/api'

type ApiErrorBody = {
  error?: {
    type?: string
    message?: string
    details?: string[]
  }
  warnings?: string[]
}

function mapApiError(error: ReturnType<typeof apiErrorFromResponse>['payload']) {
  return createServiceError(error.type, error.message, error.details, error.cause)
}

export function createApiWorkspaceRepository(apiBaseUrl = import.meta.env.VITE_WORKSPACE_API_BASE_URL ?? DEFAULT_API_BASE_URL): WorkspaceRepository {
  async function request<T>(path: string, init?: RequestInit) {
    try {
      const response = await retryFetch(`${apiBaseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      })
      const body = (await parseJsonResponse(response)) as T & ApiErrorBody
      if (!response.ok) {
        return serviceFail<T>(mapApiError(apiErrorFromResponse(response, body).payload), body.warnings ?? [])
      }
      return serviceOk(body as T, body.warnings ?? [])
    } catch (error) {
      return serviceFail<T>(createServiceError('network_error', 'Unable to reach workspace API.', [], error))
    }
  }

  return {
    async createWorkspace(document: WorkspaceDocument) {
      return request<CreateWorkspaceResponse>('/workspaces', {
        method: 'POST',
        body: JSON.stringify(document),
      })
    },

    async saveWorkspace(document: WorkspaceDocument) {
      return request<SaveWorkspaceResponse>(`/workspaces/${encodeURIComponent(document.workspaceId)}/save`, {
        method: 'POST',
        body: JSON.stringify(document),
      })
    },

    async loadWorkspace(workspaceId: string) {
      return request<LoadWorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceId)}`)
    },

    async listWorkspaces() {
      return request<ListWorkspacesResponse>('/workspaces')
    },

    async deleteWorkspace(workspaceId: string) {
      return request<DeleteWorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceId)}`, {
        method: 'DELETE',
      })
    },

    async duplicateWorkspace(workspaceId: string) {
      const loaded = await request<LoadWorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceId)}`)
      if (!loaded.ok || !loaded.data) {
        return serviceFail(loaded.error, loaded.warnings)
      }
      const duplicate = cloneWorkspaceDocument(loaded.data.document)
      return request<DuplicateWorkspaceResponse>(`/workspaces`, {
        method: 'POST',
        body: JSON.stringify(duplicate),
      })
    },

    async exportWorkspace(workspaceId: string) {
      return request<ExportWorkspaceResponse>(`/workspaces/${encodeURIComponent(workspaceId)}/export`)
    },

    async importWorkspace(document: WorkspaceDocument) {
      return request<ImportWorkspaceResponse>('/workspaces/import', {
        method: 'POST',
        body: JSON.stringify(document),
      })
    },
  }
}
