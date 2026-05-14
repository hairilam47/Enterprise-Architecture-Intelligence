import { cloneWorkspaceDocument, serializeWorkspace } from '../workspace/workspaceSerializer'
import type { SavedWorkspaceSummary } from '../workspace/workspaceStorage'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import { createServiceError } from './serviceErrors'
import { serviceFail, serviceOk, type WorkspaceRepository } from './workspaceRepository'

const mockStore = new Map<string, WorkspaceDocument>()

function delay(ms = 220) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function toSummary(document: WorkspaceDocument): SavedWorkspaceSummary {
  return {
    workspaceId: document.workspaceId,
    name: document.name,
    description: document.description,
    schemaVersion: document.schemaVersion,
    updatedAt: document.updatedAt,
    savedAt: document.metadata.savedAt,
  }
}

export function createMockApiWorkspaceRepository(): WorkspaceRepository {
  return {
    async createWorkspace(document) {
      await delay()
      const savedAt = new Date().toISOString()
      const nextDocument: WorkspaceDocument = {
        ...structuredClone(document),
        version: Math.max(1, document.version),
        updatedAt: savedAt,
        metadata: { ...document.metadata, source: 'mockApi', savedAt },
      }
      mockStore.set(nextDocument.workspaceId, nextDocument)
      return serviceOk({ document: nextDocument, summary: toSummary(nextDocument) })
    },

    async saveWorkspace(document) {
      await delay()
      const savedAt = new Date().toISOString()
      const nextDocument: WorkspaceDocument = {
        ...structuredClone(document),
        version: Math.max(1, document.version),
        updatedAt: savedAt,
        metadata: { ...document.metadata, source: 'mockApi', savedAt },
      }
      mockStore.set(nextDocument.workspaceId, nextDocument)
      return serviceOk({ document: nextDocument, summary: toSummary(nextDocument) })
    },

    async loadWorkspace(workspaceId) {
      await delay()
      const document = mockStore.get(workspaceId)
      if (!document) return serviceFail(createServiceError('not_found', 'Mock API workspace was not found.'))
      return serviceOk({ document: structuredClone(document) })
    },

    async listWorkspaces() {
      await delay()
      return serviceOk({ workspaces: [...mockStore.values()].map(toSummary) })
    },

    async deleteWorkspace(workspaceId) {
      await delay()
      mockStore.delete(workspaceId)
      return serviceOk({ workspaceId })
    },

    async duplicateWorkspace(workspaceId) {
      await delay()
      const document = mockStore.get(workspaceId)
      if (!document) return serviceFail(createServiceError('not_found', 'Mock API workspace to duplicate was not found.'))
      const duplicate = cloneWorkspaceDocument(document)
      mockStore.set(duplicate.workspaceId, duplicate)
      return serviceOk({ document: duplicate, summary: toSummary(duplicate) })
    },

    async exportWorkspace(workspaceId) {
      await delay()
      const document = mockStore.get(workspaceId)
      if (!document) return serviceFail(createServiceError('not_found', 'Mock API workspace to export was not found.'))
      return serviceOk({ document: structuredClone(document), json: serializeWorkspace(document) })
    },

    async importWorkspace(document) {
      await delay()
      mockStore.set(document.workspaceId, structuredClone(document))
      return serviceOk({ document, summary: toSummary(document) })
    },
  }
}
