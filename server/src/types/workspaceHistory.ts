export type WorkspaceHistorySnapshot = {
  id: string
  workspaceId: string
  workspaceVersion: number
  timestamp: number
  label?: string
  document: unknown
}

export type WorkspaceCommandLogEntry = {
  id: string
  workspaceId: string
  commandId: string
  commandType: string
  timestamp: number
  payload: unknown
  operation?: {
    operationId: string
    sessionId: string
    authorId?: string
    logicalClock: number
    parentOperationId?: string
  }
}

export type WorkspaceVersionCheckpoint = {
  id: string
  workspaceId: string
  workspaceVersion: number
  timestamp: number
  snapshotId?: string
  name?: string
  description?: string
  commandDepth?: number
}

export type WorkspaceHistoryDocument = {
  workspaceId: string
  snapshots: WorkspaceHistorySnapshot[]
  commandLog: WorkspaceCommandLogEntry[]
  checkpoints: WorkspaceVersionCheckpoint[]
}
