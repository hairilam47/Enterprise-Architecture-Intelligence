import {
  deleteWorkspace,
  duplicateWorkspace,
  listSavedWorkspaces,
  loadWorkspace,
  saveWorkspace,
} from '../workspace/workspaceStorage'
import { serializeWorkspace } from '../workspace/workspaceSerializer'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import { createServiceError, normalizeServiceError } from './serviceErrors'
import { serviceFail, serviceOk, type WorkspaceRepository } from './workspaceRepository'

export function createLocalWorkspaceRepository(): WorkspaceRepository {
  return {
    async createWorkspace(document: WorkspaceDocument) {
      try {
        const summary = saveWorkspace(document)
        return serviceOk({ document, summary })
      } catch (error) {
        return serviceFail(createServiceError('storage_error', 'Unable to create workspace locally.', [], error))
      }
    },

    async saveWorkspace(document: WorkspaceDocument) {
      try {
        const summary = saveWorkspace(document)
        return serviceOk({ document, summary })
      } catch (error) {
        return serviceFail(createServiceError('storage_error', 'Unable to save workspace locally.', [], error))
      }
    },

    async loadWorkspace(workspaceId: string) {
      const result = loadWorkspace(workspaceId)
      if (!result.document) {
        return serviceFail(createServiceError('not_found', 'Saved workspace was not found.', result.errors), result.warnings)
      }
      return serviceOk({ document: result.document }, result.warnings)
    },

    async listWorkspaces() {
      try {
        return serviceOk({ workspaces: listSavedWorkspaces() })
      } catch (error) {
        return serviceFail(createServiceError('storage_error', 'Unable to list local workspaces.', [], error))
      }
    },

    async deleteWorkspace(workspaceId: string) {
      try {
        deleteWorkspace(workspaceId)
        return serviceOk({ workspaceId })
      } catch (error) {
        return serviceFail(createServiceError('storage_error', 'Unable to delete local workspace.', [], error))
      }
    },

    async duplicateWorkspace(workspaceId: string) {
      try {
        const result = duplicateWorkspace(workspaceId)
        if (!result.document || !result.summary) {
          return serviceFail(createServiceError('not_found', 'Workspace to duplicate was not found.', result.errors), result.warnings)
        }
        return serviceOk({ document: result.document, summary: result.summary }, result.warnings)
      } catch (error) {
        return serviceFail(normalizeServiceError(error))
      }
    },

    async exportWorkspace(workspaceId: string) {
      const result = loadWorkspace(workspaceId)
      if (!result.document) {
        return serviceFail(createServiceError('not_found', 'Workspace to export was not found.', result.errors), result.warnings)
      }
      return serviceOk({ document: result.document, json: serializeWorkspace(result.document) }, result.warnings)
    },

    async importWorkspace(document: WorkspaceDocument) {
      try {
        const summary = saveWorkspace(document)
        return serviceOk({ document, summary })
      } catch (error) {
        return serviceFail(createServiceError('storage_error', 'Unable to import workspace locally.', [], error))
      }
    },
  }
}
