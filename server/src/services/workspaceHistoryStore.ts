import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type {
  WorkspaceCommandLogEntry,
  WorkspaceHistoryDocument,
  WorkspaceHistorySnapshot,
  WorkspaceVersionCheckpoint,
} from '../types/workspaceHistory.js'

const historyDir = path.resolve(process.cwd(), 'data/workspace-history')

function safeWorkspaceId(workspaceId: string) {
  return workspaceId.replace(/[^a-zA-Z0-9:_-]/g, '_')
}

function historyPath(workspaceId: string) {
  return path.join(historyDir, `${safeWorkspaceId(workspaceId)}.history.json`)
}

async function ensureHistoryDir() {
  await mkdir(historyDir, { recursive: true })
}

async function readHistory(workspaceId: string): Promise<WorkspaceHistoryDocument> {
  await ensureHistoryDir()
  try {
    const raw = await readFile(historyPath(workspaceId), 'utf8')
    return JSON.parse(raw) as WorkspaceHistoryDocument
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { workspaceId, snapshots: [], commandLog: [], checkpoints: [] }
    }
    throw error
  }
}

async function writeHistory(document: WorkspaceHistoryDocument) {
  await ensureHistoryDir()
  const targetPath = historyPath(document.workspaceId)
  const tempPath = `${targetPath}.tmp`
  await writeFile(tempPath, JSON.stringify(document, null, 2), 'utf8')
  await rename(tempPath, targetPath)
}

export async function appendWorkspaceSnapshot(snapshot: WorkspaceHistorySnapshot) {
  const history = await readHistory(snapshot.workspaceId)
  const nextHistory = { ...history, snapshots: [...history.snapshots, snapshot] }
  await writeHistory(nextHistory)
  return nextHistory
}

export async function appendWorkspaceCommand(entry: WorkspaceCommandLogEntry) {
  const history = await readHistory(entry.workspaceId)
  const nextHistory = { ...history, commandLog: [...history.commandLog, entry] }
  await writeHistory(nextHistory)
  return nextHistory
}

export async function appendWorkspaceOperation(workspaceId: string, operation: WorkspaceCommandLogEntry) {
  if (!operation.operation?.operationId || !operation.operation.sessionId || typeof operation.operation.logicalClock !== 'number') {
    throw Object.assign(new Error('Operation metadata is required.'), { status: 400, type: 'validation_error' })
  }
  return appendWorkspaceCommand({ ...operation, workspaceId })
}

export async function appendWorkspaceCheckpoint(checkpoint: WorkspaceVersionCheckpoint) {
  const history = await readHistory(checkpoint.workspaceId)
  const nextHistory = { ...history, checkpoints: [...history.checkpoints, checkpoint] }
  await writeHistory(nextHistory)
  return nextHistory
}

export async function listWorkspaceCheckpoints(workspaceId: string) {
  const history = await readHistory(workspaceId)
  return history.checkpoints.sort((left, right) => right.timestamp - left.timestamp)
}

export async function createNamedWorkspaceCheckpoint(input: {
  workspaceId: string
  workspaceVersion: number
  snapshotId: string
  name: string
  description?: string
  commandDepth?: number
}) {
  const checkpoint: WorkspaceVersionCheckpoint = {
    id: `workspace-checkpoint:${crypto.randomUUID()}`,
    timestamp: Date.now(),
    ...input,
  }
  await appendWorkspaceCheckpoint(checkpoint)
  return checkpoint
}

export async function findWorkspaceSnapshot(workspaceId: string, snapshotId: string) {
  const history = await readHistory(workspaceId)
  return history.snapshots.find((snapshot) => snapshot.id === snapshotId)
}

export async function deleteWorkspaceCheckpoint(workspaceId: string, checkpointId: string) {
  const history = await readHistory(workspaceId)
  const checkpoint = history.checkpoints.find((item) => item.id === checkpointId)
  if (!checkpoint) return { deleted: false, protected: false, history }
  const isProtected = checkpoint.name?.toLowerCase().includes('recovery') || checkpoint.id.includes('recovery')
  if (isProtected) return { deleted: false, protected: true, history }
  const auditEntry: WorkspaceCommandLogEntry = {
    id: `workspace-command-log:${crypto.randomUUID()}`,
    workspaceId,
    commandId: `checkpoint-delete:${checkpointId}`,
    commandType: 'checkpoint.deleted',
    timestamp: Date.now(),
    payload: { checkpointId, name: checkpoint.name, preservedSnapshotId: checkpoint.snapshotId },
  }
  const nextHistory = {
    ...history,
    checkpoints: history.checkpoints.filter((item) => item.id !== checkpointId),
    commandLog: [...history.commandLog, auditEntry],
  }
  await writeHistory(nextHistory)
  return { deleted: true, protected: false, history: nextHistory }
}

export async function loadWorkspaceHistory(workspaceId: string) {
  return readHistory(workspaceId)
}

export async function listWorkspaceCommands(workspaceId: string, options: { offset?: number; limit?: number; start?: number; end?: number } = {}) {
  const history = await readHistory(workspaceId)
  const ordered = [...history.commandLog].sort((left, right) => {
    if (left.timestamp !== right.timestamp) return left.timestamp - right.timestamp
    return left.commandId.localeCompare(right.commandId)
  })
  const filtered = ordered.filter((command) => {
    if (typeof options.start === 'number' && command.timestamp < options.start) return false
    if (typeof options.end === 'number' && command.timestamp > options.end) return false
    return true
  })
  const offset = options.offset ?? 0
  const limit = options.limit ?? 100
  return {
    commands: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
  }
}

export async function listWorkspaceOperationsBySession(workspaceId: string, sessionId: string) {
  const result = await listWorkspaceCommands(workspaceId, { limit: 1000 })
  return { operations: result.commands.filter((command) => command.operation?.sessionId === sessionId) }
}

export async function listWorkspaceOperationsByAuthor(workspaceId: string, authorId: string) {
  const result = await listWorkspaceCommands(workspaceId, { limit: 1000 })
  return { operations: result.commands.filter((command) => command.operation?.authorId === authorId) }
}

export async function createReplayWindow(workspaceId: string, targetCommandIndex?: number) {
  const history = await readHistory(workspaceId)
  const commands = [...history.commandLog].sort((left, right) => left.timestamp - right.timestamp)
  const target = typeof targetCommandIndex === 'number' ? targetCommandIndex : commands.length - 1
  const snapshot = [...history.snapshots]
    .filter((item) => item.timestamp <= (commands[target]?.timestamp ?? Date.now()))
    .sort((left, right) => right.timestamp - left.timestamp)[0]
  return {
    workspaceId,
    targetCommandIndex: target,
    accelerationSnapshot: snapshot,
    commands: commands.slice(0, target + 1),
    checkpoints: history.checkpoints,
  }
}

export function createHistoryChecksum(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function validateHistorySnapshotIntegrity(snapshot: WorkspaceHistorySnapshot) {
  const errors: string[] = []
  if (!snapshot.document || typeof snapshot.document !== 'object') errors.push('Snapshot document is missing.')
  if (!snapshot.id) errors.push('Snapshot id is missing.')
  return { valid: errors.length === 0, errors, checksum: createHistoryChecksum(snapshot.document) }
}

export async function mergeWorkspaceHistoryFromDocument(workspaceId: string, document: Record<string, unknown>) {
  const history = await readHistory(workspaceId)
  const snapshots = Array.isArray(document.workspaceSnapshots)
    ? document.workspaceSnapshots.map((snapshot) => {
        const item = snapshot as { metadata?: { id?: string; timestamp?: number; workspaceVersion?: number; label?: string }; document?: unknown }
        return {
          id: item.metadata?.id ?? `workspace-snapshot:${crypto.randomUUID()}`,
          workspaceId,
          workspaceVersion: item.metadata?.workspaceVersion ?? 1,
          timestamp: item.metadata?.timestamp ?? Date.now(),
          label: item.metadata?.label,
          document: item.document,
        } satisfies WorkspaceHistorySnapshot
      })
    : []
  const checkpoints = Array.isArray(document.workspaceCheckpoints)
    ? document.workspaceCheckpoints.map((checkpoint) => {
        const item = checkpoint as { id?: string; name?: string; description?: string; snapshotId?: string; createdAt?: string; commandDepth?: number }
        return {
          id: item.id ?? `workspace-checkpoint:${crypto.randomUUID()}`,
          workspaceId,
          workspaceVersion: typeof document.version === 'number' ? document.version : 1,
          timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
          snapshotId: item.snapshotId,
          name: item.name,
          description: item.description,
          commandDepth: item.commandDepth,
        } satisfies WorkspaceVersionCheckpoint
      })
    : []
  const commands = document.commandHistoryState && typeof document.commandHistoryState === 'object' && 'undoStack' in document.commandHistoryState && Array.isArray(document.commandHistoryState.undoStack)
    ? document.commandHistoryState.undoStack.map((command) => ({
        id: `workspace-command-log:${crypto.randomUUID()}`,
        workspaceId,
        commandId: String(command.id ?? crypto.randomUUID()),
        commandType: String(command.type ?? 'unknown'),
        timestamp: typeof command.timestamp === 'number' ? command.timestamp : Date.now(),
        payload: command.payload ?? {},
      }) satisfies WorkspaceCommandLogEntry)
    : []

  const byId = <T extends { id: string }>(items: T[]) => [...new Map(items.map((item) => [item.id, item])).values()]
  const nextHistory: WorkspaceHistoryDocument = {
    workspaceId,
    snapshots: byId([...history.snapshots, ...snapshots]),
    checkpoints: byId([...history.checkpoints, ...checkpoints]),
    commandLog: byId([...history.commandLog, ...commands]),
  }
  await writeHistory(nextHistory)
  return nextHistory
}
