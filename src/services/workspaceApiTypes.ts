import type { SavedWorkspaceSummary } from '../workspace/workspaceStorage'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'
import type { ServiceError } from './serviceErrors'

export type ServiceResult<T> = {
  ok: boolean
  data?: T
  error?: ServiceError
  warnings: string[]
}

export type CreateWorkspaceRequest = { document: WorkspaceDocument }
export type CreateWorkspaceResponse = { document: WorkspaceDocument; summary: SavedWorkspaceSummary }

export type SaveWorkspaceRequest = { document: WorkspaceDocument }
export type SaveWorkspaceResponse = { document: WorkspaceDocument; summary: SavedWorkspaceSummary }

export type LoadWorkspaceRequest = { workspaceId: string }
export type LoadWorkspaceResponse = { document: WorkspaceDocument }

export type ListWorkspacesRequest = Record<string, never>
export type ListWorkspacesResponse = { workspaces: SavedWorkspaceSummary[] }

export type DeleteWorkspaceRequest = { workspaceId: string }
export type DeleteWorkspaceResponse = { workspaceId: string }

export type DuplicateWorkspaceRequest = { workspaceId: string }
export type DuplicateWorkspaceResponse = { document: WorkspaceDocument; summary: SavedWorkspaceSummary }

export type ImportWorkspaceRequest = { document: WorkspaceDocument }
export type ImportWorkspaceResponse = { document: WorkspaceDocument; summary: SavedWorkspaceSummary }

export type ExportWorkspaceRequest = { workspaceId: string }
export type ExportWorkspaceResponse = { document: WorkspaceDocument; json: string }

export const FUTURE_WORKSPACE_ENDPOINTS = `
GET /api/workspaces
POST /api/workspaces
GET /api/workspaces/:id
PUT /api/workspaces/:id
DELETE /api/workspaces/:id
POST /api/workspaces/import
GET /api/workspaces/:id/export
`

export type { SavedWorkspaceSummary }
