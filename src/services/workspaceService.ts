import { serializeWorkspace } from '../workspace/workspaceSerializer'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import { migrateWorkspaceDocument } from '../workspace/workspaceMigration'
import { validateWorkspaceDocument } from '../workspace/workspaceValidation'
import { createServiceError, normalizeServiceError } from './serviceErrors'
import { serviceFail, serviceOk, type WorkspaceRepository } from './workspaceRepository'

export function createWorkspaceService(repository: WorkspaceRepository) {
  function validateBeforeWrite(document: WorkspaceDocument) {
    const migration = migrateWorkspaceDocument(document)
    if (!migration.document) {
      return {
        document: undefined,
        errors: migration.errors,
        warnings: migration.warnings,
      }
    }

    const validation = validateWorkspaceDocument(migration.document)
    return {
      document: validation.valid ? migration.document : undefined,
      errors: validation.errors,
      warnings: [...migration.warnings, ...validation.warnings],
    }
  }

  return {
    async createWorkspace(document: WorkspaceDocument) {
      const checked = validateBeforeWrite(document)
      if (!checked.document) {
        return serviceFail(createServiceError('validation_error', 'Workspace failed validation.', checked.errors), checked.warnings)
      }
      return repository.createWorkspace(checked.document)
    },

    async saveWorkspace(document: WorkspaceDocument) {
      const checked = validateBeforeWrite(document)
      if (!checked.document) {
        return serviceFail(createServiceError('validation_error', 'Workspace failed validation.', checked.errors), checked.warnings)
      }
      return repository.saveWorkspace(checked.document)
    },

    async loadWorkspace(workspaceId: string) {
      const result = await repository.loadWorkspace(workspaceId)
      if (!result.ok || !result.data) return result
      const checked = validateBeforeWrite(result.data.document)
      if (!checked.document) {
        return serviceFail(createServiceError('schema_error', 'Loaded workspace failed schema validation.', checked.errors), checked.warnings)
      }
      return serviceOk({ document: checked.document }, [...result.warnings, ...checked.warnings])
    },

    async listWorkspaces() {
      return repository.listWorkspaces()
    },

    async deleteWorkspace(workspaceId: string) {
      return repository.deleteWorkspace(workspaceId)
    },

    async duplicateWorkspace(workspaceId: string) {
      return repository.duplicateWorkspace(workspaceId)
    },

    async exportWorkspace(workspaceId: string) {
      return repository.exportWorkspace(workspaceId)
    },

    exportWorkspaceDocument(document: WorkspaceDocument) {
      const checked = validateBeforeWrite(document)
      if (!checked.document) {
        return serviceFail(createServiceError('validation_error', 'Workspace failed validation.', checked.errors), checked.warnings)
      }
      return serviceOk({ document: checked.document, json: serializeWorkspace(checked.document) }, checked.warnings)
    },

    async importWorkspace(document: WorkspaceDocument) {
      try {
        const checked = validateBeforeWrite(document)
        if (!checked.document) {
          return serviceFail(createServiceError('validation_error', 'Imported workspace failed validation.', checked.errors), checked.warnings)
        }
        return repository.importWorkspace(checked.document)
      } catch (error) {
        return serviceFail(normalizeServiceError(error))
      }
    },
  }
}

export type WorkspaceService = ReturnType<typeof createWorkspaceService>
