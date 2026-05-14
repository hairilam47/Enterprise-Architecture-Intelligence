import type {
  CreateWorkspaceResponse,
  DeleteWorkspaceResponse,
  DuplicateWorkspaceResponse,
  ExportWorkspaceResponse,
  ImportWorkspaceResponse,
  ListWorkspacesResponse,
  LoadWorkspaceResponse,
  SaveWorkspaceResponse,
  ServiceResult,
} from './workspaceApiTypes'
import type { WorkspaceDocument } from '../workspace/workspaceDocument'

export type WorkspaceRepository = {
  createWorkspace(document: WorkspaceDocument): Promise<ServiceResult<CreateWorkspaceResponse>>
  saveWorkspace(document: WorkspaceDocument): Promise<ServiceResult<SaveWorkspaceResponse>>
  loadWorkspace(workspaceId: string): Promise<ServiceResult<LoadWorkspaceResponse>>
  listWorkspaces(): Promise<ServiceResult<ListWorkspacesResponse>>
  deleteWorkspace(workspaceId: string): Promise<ServiceResult<DeleteWorkspaceResponse>>
  duplicateWorkspace(workspaceId: string): Promise<ServiceResult<DuplicateWorkspaceResponse>>
  exportWorkspace(workspaceId: string): Promise<ServiceResult<ExportWorkspaceResponse>>
  importWorkspace(document: WorkspaceDocument): Promise<ServiceResult<ImportWorkspaceResponse>>
}

export function serviceOk<T>(data: T, warnings: string[] = []): ServiceResult<T> {
  return { ok: true, data, warnings }
}

export function serviceFail<T>(error: ServiceResult<T>['error'], warnings: string[] = []): ServiceResult<T> {
  return { ok: false, error, warnings }
}
